import _ from 'lodash'
import bodymen from './'
import Param from 'rich-param'

/**
 * BodymenSchema class.
 */
export default class BodymenSchema {

  /**
   * Create a schema.
   * @param {Object} [params] - Params object.
   * @param {Object} [options] - Options object.
   */
  constructor (params = {}, options = {}) {
    this.params = {}
    this.options = options
    this.handlers = {
      formatters: {},
      validators: {}
    }

    _.forIn(params, (options, key) => {
      this.add(key, undefined, options)
    })

    _.forIn(bodymen.handlers, (typedHandler, type) => {
      _.forIn(typedHandler, (handler, name) => {
        this.handler(type, name, handler)
      })
    })
  }

  /**
   * Get or set an option.
   * @param {string} name - Option name.
   * @param {*} [value] - Set the value of the option.
   * @return {*} Value of the option.
   */
  option (name, value) {
    if (arguments.length > 1) {
      this.options[name] = value
    }

    return this.options[name]
  }

  /**
   * Get or set a handler.
   * @param {string} type - Handler type.
   * @param {string} name - Handler name.
   * @param {Function} [fn] - Set the handler method.
   */
  handler (type, name, fn) {
    if (arguments.length > 2) {
      this.handlers[type][name] = fn
      this._refreshHandlersInParams({[type]: {[name]: fn}})
    }

    return this.handlers[type][name]
  }

  /**
   * Get or set a formatter.
   * @param {string} name - Formatter name.
   * @param {formatterFn} [fn] - Set the formatter method.
   * @return {formatterFn} The formatter method.
   */
  formatter (name, fn) {
    return this.handler('formatters', ...arguments)
  }

  /**
   * Get or set a validator.
   * @param {string} name - Validator name.
   * @param {validatorFn} [fn] - Set the validator method.
   * @return {validatorFn} The validator method.
   */
  validator (name, fn) {
    return this.handler('validators', ...arguments)
  }

  /**
   * Get a param
   * @param {string} name - Param name.
   * @return {Param|undefined} The param or undefined if it doesn't exist.
   */
  get (name) {
    name = this._getSchemaParamName(name)

    return this.params[name]
  }

  /**
   * Set param value.
   * @param {string} name - Param name.
   * @param {*} value - Param value.
   * @param {Object} [options] - Param options.
   * @return {Param|undefined} The param or undefined if it doesn't exist.
   */
  set (name, value, options) {
    name = this._getSchemaParamName(name)

    if (this.params[name]) {
      let param = this.params[name]

      param.value(value)

      _.forIn(options, (optionValue, option) => {
        param.option(option, optionValue)
      })

      return param
    } else {
      return
    }
  }

  /**
   * Add param.
   * @param {string} name - Param name.
   * @param {*} [value] - Param value.
   * @param {Object} [options] - Param options.
   * @return {Param|boolean} The param or false if param is set to false in schema options.
   */
  add (name, value, options) {
    if (name instanceof Param) {
      options = name.options
      value = name.value()
      name = name.name
    }

    name = this._getSchemaParamName(name)

    if (this.options[name] === false) {
      return false
    }

    options = this._parseParamOptions(options)

    this.params[name] = new Param(name, value, options)

    this._refreshHandlersInParams(undefined, {[name]: this.params[name]})

    return this.params[name]
  }

  /**
   * Get, set or add param.
   * @param {string} name - Param name.
   * @param {*} [value] - Param value.
   * @param {Object} [options] - Param options.
   * @return {Param|undefined} The param or undefined if it doesn't exist.
   */
  param (name, value, options) {
    if (arguments.length === 1) {
      return this.get(name)
    }

    return this.set(name, value, options) || this.add(name, value, options)
  }

  /**
   * Parse values of the schema params.
   * @param {Object} [values] - Object with {param: value} pairs to parse.
   * @return {Object} Parsed object.
   */
  parse (values = {}) {
    let body = {}

    _.forIn(this.params, (param) => {
      let value = values[this._getBodyParamName(param.name)]

      if (!_.isNil(value)) {
        param.value(value)
      }
    })

    _.forIn(this.params, (param) => {
      if (this.options[this._getSchemaParamName(param.name)] === false) return
      body[this._getBodyParamName(param.name)] = param.value()
    })

    return body
  }

  /**
   * Validate values of the schema params.
   * @param {Object} [values] - Object with {param: value} pairs to validate.
   * @param {Function} [next] - Callback to be called with error
   * @return {boolean} Result of the validation.
   */
  validate (values = {}, next = (error) => !error) {
    let error

    if (_.isFunction(values)) {
      next = values
      values = {}
    }

    _.forIn(this.params, (param) => {
      const value = values[this._getBodyParamName(param.name)]

      if (!_.isNil(value)) {
        param.value(value)
      }
    })

    for (let i in this.params) {
      if (error) break
      const param = this.params[i]
      param.validate((err) => { error = err })
    }

    return next(error)
  }

  _refreshHandlersInParams (handlers = this.handlers, params = this.params) {
    _.forIn(handlers, (typedHandler, type) => {
      _.forIn(typedHandler, (handler, name) => {
        _.forIn(params, (param) => {
          param.handler(type, name, handler)
        })
      })
    })
  }

  _getSchemaParamName (paramName) {
    return _.findKey(this.options, (option) => option === paramName) || paramName
  }

  _getBodyParamName (paramName) {
    return _.isString(this.options[paramName]) ? this.options[paramName] : paramName
  }

  _parseParamOptions (options) {
    if (_.isArray(options) && options.length) {
      let innerOption = this._parseParamOptions(options[0])
      options = {}
      if (innerOption.type) {
        options.type = [innerOption.type]
      }
      if (innerOption.default) {
        options.default = innerOption.default
      }
    } else if (_.isString(options)) {
      options = {default: options}
    } else if (_.isNumber(options)) {
      options = {type: Number, default: options}
    } else if (_.isBoolean(options)) {
      options = {type: Boolean, default: options}
    } else if (_.isDate(options)) {
      options = {type: Date, default: options}
    } else if (_.isRegExp(options)) {
      options = {type: RegExp, default: options}
    } else if (_.isFunction(options)) {
      options = {type: options}
    } else if (_.isObject(options)) {
      if (!_.isFunction(options.type)) {
        options.type = Object
      }
    }

    return options || {}
  }

}
