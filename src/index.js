/** @module bodymen */
import _ from 'lodash'
import Param from 'rich-param'
import Schema from './bodymen-schema'

export { Param, Schema }

export const handlers = {
  formatters: {},
  validators: {}
}

/**
 * Get or set a handler.
 * @memberof bodymen
 * @param {string} type - Handler type.
 * @param {string} name - Handler name.
 * @param {Function} [fn] - Set the handler method.
 */
export function handler (type, name, fn) {
  if (
    type === 'constructor' ||
    type === '__proto__' ||
    name === 'constructor' ||
    name === '__proto__'
  ) {
    return
  }
  if (arguments.length > 2) {
    handlers[type][name] = fn
  }

  return handlers[type][name]
}

/**
 * Get or set a formatter.
 * @memberof bodymen
 * @param {string} name - Formatter name.
 * @param {formatterFn} [fn] - Set the formatter method.
 * @return {formatterFn} The formatter method.
 */
export function formatter (name, fn) {
  return handler('formatters', ...arguments)
}

/**
 * Get or set a validator.
 * @memberof bodymen
 * @param {string} name - Validator name.
 * @param {validatorFn} [fn] - Set the validator method.
 * @return {validatorFn} The validator method.
 */
export function validator (name, fn) {
  return handler('validators', ...arguments)
}

/**
 * Create a middleware.
 * @memberof bodymen
 * @param {BodymenSchema|Object} [schema] - Schema object.
 * @param {Object} [options] - Options to be passed to schema.
 * @return {Function} The middleware.
 */
export function middleware (schema, options) {
  return function (req, res, next) {
    let _schema = schema instanceof Schema
                ? _.clone(schema)
                : new Schema(schema, options)

    _schema.validate(req.body, (err) => {
      if (err) {
        req.bodymen = {error: err}
        res.status(400)
        return next(err.message)
      }

      req.bodymen = {body: _schema.parse(), schema: _schema}
      next()
    })
  }
}

/**
 * Error handler middleware.
 * @memberof bodymen
 * @return {Function} The middleware.
 */
export function errorHandler () {
  return function (err, req, res, next) {
    if (req.bodymen && req.bodymen.error) {
      res.status(400).json(req.bodymen.error)
    } else {
      next(err)
    }
  }
}

export default {
  Schema,
  Param,
  handlers,
  handler,
  formatter,
  validator,
  middleware,
  errorHandler
}
