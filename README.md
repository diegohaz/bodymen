# bodymen

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]
[![Downloads][download-badge]][npm-url]

**Bodymen** works similarly to [Querymen](https://github.com/diegohaz/querymen) and has almost the same functionality, expect it formats, validates and parses request body instead of querystrings. Refer to [Querymen](https://github.com/diegohaz/querymen)'s readme to find out more.

## Prerequisites

You must use a request body parser like express [body-parser](https://github.com/expressjs/body-parser) and set it up before using bodymen:
```js
import express from 'express'
import bodyParser from 'body-parser'

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
```

## Install

```sh
npm install --save bodymen
```

## Usage

Bodymen allows you to define a schema to control the fields sent through the request body.
```js
import bodymen, { errorHandler } from "bodymen"

app.post('/posts', bodymen.middleware({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  content: {
    type: String,
    required: true,
    minlength: 32
  },
  tags: [String]
}), (req, res) => {
  console.log(req.bodymen.body) // will contain the parsed body
})

app.use(errorHandler()) // will send standard error messages, similar to Querymen
```

## License

MIT © [Diego Haz](http://github.com/diegohaz)

[npm-url]: https://npmjs.org/package/bodymen
[npm-image]: https://img.shields.io/npm/v/bodymen.svg?style=flat-square

[travis-url]: https://travis-ci.org/diegohaz/bodymen
[travis-image]: https://img.shields.io/travis/diegohaz/bodymen.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/diegohaz/bodymen
[coveralls-image]: https://img.shields.io/coveralls/diegohaz/bodymen.svg?style=flat-square

[depstat-url]: https://david-dm.org/diegohaz/bodymen
[depstat-image]: https://david-dm.org/diegohaz/bodymen.svg?style=flat-square

[download-badge]: http://img.shields.io/npm/dm/bodymen.svg?style=flat-square
