import request from 'supertest'
import express from 'express'
import bodyParser from 'body-parser'
import test from 'tape'
import bodymen, {Schema} from '../src'
import './bodymen-schema'

let route = (...args) => {
  let app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post('/tests', bodymen.middleware(...args), (req, res) => {
    res.status(200).json(req.bodymen.body)
  })

  app.use(bodymen.errorHandler())
  return app
}

test('Bodymen handler', (t) => {
  t.notOk(bodymen.formatter('testFormatter'), 'should not get nonexistent formatter')
  t.notOk(bodymen.validator('testValidator'), 'should not get nonexistent validator')

  bodymen.formatter('testFormatter', () => 'test')
  bodymen.validator('testValidator', () => ({valid: false}))

  t.ok(bodymen.formatter('testFormatter'), 'should get formatter')
  t.ok(bodymen.validator('testValidator'), 'should get validator')

  let schema = new bodymen.Schema({test: String})

  t.ok(schema.formatter('testFormatter'), 'should get formatter in schema')
  t.ok(schema.validator('testValidator'), 'should get validator in schema')

  t.ok(schema.param('test').formatter('testFormatter'), 'should get formatter in param')
  t.ok(schema.param('test').validator('testValidator'), 'should get validator in param')

  t.end()
})

test('Bodymen middleware', (t) => {
  t.plan(7)

  request(route())
    .post('/tests')
    .send({name: 'test'})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {}, 'should respond with blank object')
    })

  request(route(new Schema({name: String})))
    .post('/tests')
    .send({name: 'test'})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {name: 'test'}, 'should respond with correct object')
    })

  request(route(new Schema({
    name: {
      type: String,
      uppercase: true
    }
  })))
    .post('/tests')
    .send({name: 'test'})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {name: 'TEST'}, 'should respond with uppercase value')
    })

  request(route(new Schema({
    name: {
      type: String,
      required: true
    }
  })))
    .post('/tests')
    .expect(400)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body.param, 'name', 'should respond with error object')
    })

  // issue #1
  request(route(new Schema({links: [Object]})))
    .post('/tests')
    .send({links: [{icon: 'path to icon'}]})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {links: [{icon: 'path to icon'}]}, 'should respond with correct object')
    })

  // parse subdocuments as Object
  request(route(new Schema({sub: {name: String}})))
    .post('/tests')
    .send({sub: {name: 'test'}})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {sub: {name: 'test'}}, 'should respond with correct object')
    })

  request(route(new Schema({links: [{icon: String}]})))
    .post('/tests')
    .send({links: [{icon: 'path to icon'}]})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.same(res.body, {links: [{icon: 'path to icon'}]}, 'should respond with correct object')
    })
})

test('Prototype pollution', (t) => {
  const { toString } = {}

  bodymen.handler('__proto__', 'toString', 'JHU')
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  bodymen.handler('formatters', '__proto__', { toString: 'JHU' })
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  bodymen.handler('validators', '__proto__', { toString: 'JHU' })
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  t.end()
})
