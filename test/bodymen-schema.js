import test from 'tape'
import {Schema, Param} from '../src/'

let schema = (params, options) => new Schema(params, options)

test('BodymenSchema add', (t) => {
  let add = (...args) => schema().add('test', ...args).value()
  t.true(schema().add(new Param('test')), 'should add a param with instance')
  t.true(schema().add('test'), 'should add a param')
  t.equal(add('123'), '123', 'should add a param with value')
  t.true(schema().add('test', null, {test: true}).option('test'), 'should add a param with option')
  t.equal(add(null, '123'), '123', 'should add a param with default option string')
  t.equal(add(null, 123), 123, 'should add a param with default option number')
  t.equal(add(null, true), true, 'should add a param with default option boolean')
  t.same(add(null, new Date('2016')), new Date('2016'), 'should add a param with default option date')
  t.same(add(null, /123/i), /123/i, 'should add a param with default option regexp')
  t.equal(add(123, String), '123', 'should add a param with type option string')
  t.equal(add('123', Number), 123, 'should add a param with type option number')
  t.equal(add('123', Boolean), true, 'should add a param with type option boolean')
  t.same(add('2016', Date), new Date('2016'), 'should add a param with type option date')
  t.same(add('123', RegExp), /123/i, 'should add a param with type option regexp')

  t.same(add(null, ['123']), '123', 'should add a param with default option string array')
  t.same(add(null, [123]), 123, 'should add a param with default option number array')
  t.same(add(null, [true]), true, 'should add a param with default option boolean array')
  t.same(add(null, [new Date('2016')]), new Date('2016'), 'should add a param with default option date array')
  t.same(add(null, [/123/i]), /123/i, 'should add a param with default option regexp array')
  t.same(add(123, [String]), '123', 'should add a param with type option string array')
  t.same(add('123,456', [Number]), [123, 456], 'should add a param with type option number array')
  t.same(add('123,0', [Boolean]), [true, false], 'should add a param with type option boolean array')
  t.same(add('2016,2017', [Date]), [new Date('2016'), new Date('2017')], 'should add a param with type option date array')
  t.same(add('123,456', [RegExp]), [/123/i, /123/i], 'should add a param with type option regexp array')
  t.end()
})

test('BodymenSchema get', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().get('test'), 'should not get a nonexistent param')
  t.true(mySchema.get('test'), 'should get a param')
  t.end()
})

test('BodymenSchema set', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().set('test', '123'), 'should not set a nonexistent param')
  t.true(mySchema.set('test', '123'), 'should set a param')
  t.true(mySchema.set('test', '123', {test: true}).option('test'), 'should set param option')
  t.end()
})

test('BodymenSchema option', (t) => {
  let mySchema = schema()
  t.equal(mySchema.option('test', false), false, 'should set option')
  t.equal(mySchema.option('test'), false, 'should get option')
  t.false(mySchema.add('test'), 'should not add disallowed param')
  t.end()
})

test('BodymenSchema param', (t) => {
  let mySchema = schema()
  t.false(mySchema.param('test'), 'should not get a nonexistent param')
  t.true(mySchema.param('test', null), 'should add a param')
  t.true(mySchema.param('test'), 'should get a param')
  t.true(mySchema.param('test', '123'), 'should set a param')
  t.end()
})

test('BodymenSchema formatter', (t) => {
  let mySchema = schema({test: '123'})
  let formatter = mySchema.formatter('scream', (scream, value) => {
    return scream ? value.toUpperCase() : value
  })
  t.true(formatter, 'should create a formatter')
  t.false(schema().formatter('scream'), 'should not get a nonexistent formatter')
  t.true(mySchema.formatter('scream'), 'should get a formatter')
  t.true(mySchema.param('test').formatter('scream'), 'should get param formatter')
  t.equal(mySchema.param('test').value(), '123', 'should not format value')
  t.true(mySchema.param('test').option('scream', true), 'should set param option')
  t.equal(mySchema.param('test').value('help'), 'HELP', 'should format value')
  t.true(mySchema.param('f', null).formatter('scream'), 'should get lazy param formatter')
  t.end()
})

test('BodymenSchema validator', (t) => {
  let mySchema = schema({test: 'help'})
  let validator = mySchema.validator('isPlural', (isPlural, value, param) => ({
    valid: !isPlural || value.toLowerCase().substr(-1) === 's',
    message: param.name + ' must be in plural form.'
  }))
  t.true(validator, 'should create a validator')
  t.false(schema().validator('isPlural'), 'should not get a nonexistent validator')
  t.true(mySchema.validator('isPlural'), 'should get a validator')
  t.true(mySchema.param('test').validator('isPlural'), 'should get param validator')
  t.true(mySchema.validate(), 'should not apply validator')
  t.true(mySchema.param('test').option('isPlural', true), 'should set param option')
  t.false(mySchema.validate(), 'should apply validator and validate false')
  t.true(mySchema.validate({test: 'helps'}), 'should apply validator and validate true')
  t.true(mySchema.param('v', null).validator('isPlural'), 'should get lazy param validator')
  mySchema.validate((err) => t.false(err, 'should call validation success'))
  mySchema.validate({test: 'help'}, (err) => t.false(err.valid, 'should call validation error'))
  t.end()
})

test('BodymenSchema name', (t) => {
  let mySchema = schema({}, {page: 'p'})
  let name = (type, name) => mySchema[`_get${type}ParamName`](name)
  t.equal(name('Schema', 'p'), 'page', 'should get schema param name by body param name')
  t.equal(name('Schema', 'page'), 'page', 'should get schema param name by itself')
  t.equal(name('Body', 'page'), 'p', 'should get body param name by schema param name')
  t.equal(name('Body', 'p'), 'p', 'should get body param name by itself')
  mySchema = schema({test: String}, {test: 't'})
  t.equal(name('Schema', 't'), 'test', 'should get custom schema param name by body param name')
  t.equal(name('Schema', 'test'), 'test', 'should get custom schema param name by itself')
  t.equal(name('Body', 'test'), 't', 'should get custom body param name by schema param name')
  t.equal(name('Body', 't'), 't', 'should get custom body param name by itself')
  t.end()
})

test('BodymenSchema default parse', (t) => {
  t.same(schema({name: String}).parse({name: 'test'}), {name: 'test'}, 'should parse correctly')
  t.same(schema().parse({name: 'test'}), {}, 'should parse correctly')
  t.end()
})
