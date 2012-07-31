Restless
=======
[![Build Status](https://secure.travis-ci.org/blakevanlan/restless.png?branch=master)](http://travis-ci.org/blakevanlan/restless)


Based on [Restler](https://github.com/danwrong/restler) by [@danwrong](https://github.com/danwrong/)
(C) Dan Webb (dan@danwebb.net/@danwrong) 2011, Licensed under the MIT-LICENSE

An HTTP client library for node.js (0.6.x and up).  Hides most of the complexity of creating and using http.Client.

The difference between Restless and Restler is Restless uses callbacks instead of the emitter pattern.

Features
--------

* Easy interface for common operations via http.request
* Automatic serialization of post data
* Automatic serialization of query string data
* Automatic deserialization of XML, JSON and YAML responses to JavaScript objects (if you have js-yaml and/or xml2js in the require path)
* Provide your own deserialization functions for other datatypes
* Automatic following of redirects
* Send files with multipart requests
* Transparently handle SSL (just specify https in the URL)
* Deals with basic auth for you, just provide username and password options
* Simple service wrapper that allows you to easily put together REST API libraries
* Transparently handle content-encoded responses (gzip, deflate) (requires node 0.6+)
* Transparently handle different content charsets via [iconv](https://github.com/bnoordhuis/node-iconv) (if available)

API
---

### request(method, url [, options] [, callback])

#### members

* `abort([error])` Cancels request. `request.aborted` is set to `true`. If non-falsy `error` is passed, then `error` will be passed to the callback (with `error.type` set to `"abort"`).
* `retry([timeout])` Re-sends request after `timeout` ms. Pending request is aborted.
* `aborted` Determines if request was aborted.

### get(url [, options] [, callback])

Create a GET request.

### post(url [, options] [, callback])

Create a POST request.

### put(url [, options] [, callback])

Create a PUT request.

### del(url [, options] [, callback])

Create a DELETE request.

### head(url [, options] [, callback])

Create a HEAD request.

### Callback

The parameters are as follows: `function (error, body, response)`. If the response has a status code of 400 or above the error parameter will contain the status code as an integer. Any other errors will be an instance of `Error` and are thrown by the http library.

### Parsers

You can give any of these to the parsers option to specify how the response data is deserialized.
In case of malformed content, an `error` object will be passed to the callback. Original data returned by server is stored in `response.raw`.

#### parsers.auto

Checks the content-type and then uses parsers.xml, parsers.json or parsers.yaml.
If the content type isn't recognised it just returns the data untouched.

#### parsers.json, parsers.xml, parsers.yaml

All of these attempt to turn the response into a JavaScript object. In order to use the YAML and XML parsers you must have yaml and/or xml2js installed.

### Options

* `method` Request method, can be get, post, put, del. Defaults to `"get"`.
* `query` Query string variables as a javascript object, will override the querystring in the URL. Defaults to empty.
* `data` The data to be added to the body of the request. Can be a string or any object.
Note that if the data is an object it will, by default, properly be JSON encoded and the header `'Content-Type': 'application/json'` will be added. If you want to url encode the data include the header, `'Content-Type': 'application/x-www-form-urlencoded'`, and the data object will be encoded accordingly.
* `parser` A function that will be called on the returned data. Use any of predefined `restless.parsers`. See parsers section below. Defaults to `restless.parsers.auto`.
* `encoding` The encoding of the request body. Defaults to `"utf8"`.
* `decoding` The encoding of the response body. For a list of supported values see [Buffers](http://nodejs.org/docs/latest/api/buffers.html#buffers). Additionally accepts `"buffer"` - returns response as `Buffer`. Defaults to `"utf8"`.
* `headers` A hash of HTTP headers to be sent. Defaults to `{ 'Accept': '*/*', 'User-Agent': 'Restless for node.js' }`.
* `username` Basic auth username. Defaults to empty.
* `password` Basic auth password. Defaults to empty.
* `multipart` If set the data passed will be formated as `multipart/form-encoded`. See multipart example below. Defaults to `false`.
* `client` A http.Client instance if you want to reuse or implement some kind of connection pooling. Defaults to empty.
* `followRedirects` If set will recursively follow redirects. Defaults to `true`.
* `callback` A callback function can be supplied in the options. This is an alternative to passing the callback function as the last parameter to any of the above methods.

## Restless + Proxy 
Restless can be setup to use a proxy, such as Fiddler, to allow for easier debugging. Here is example for Fiddler:
```javascript
var rest = require('restless')({ proxy: "http://127.0.0.1:8888" });
```
*or*
```javascript
var rest = require('restless')({ 
  proxy: {
    host: "127.0.0.1",
    port: "8888" 
  }
});
```
Note: Restless runs about 100x slower with Fiddler as a proxy.

Installation
-------------
```bash
npm install restless
```

Example usage
-------------

```javascript
var sys = require('util'),
var rest = require('restless');

rest.get('http://google.com', function (error, data) {
  if (error instanceof Error) {
    sys.puts('Error: ' + error.message);
    this.retry(5000); // try again after 5 sec
  } else {
    sys.puts(data);
  }
});

rest.get('http://resourcedoesntexist.com/', function (error, data) {
  if (typeof error == "number") {
    // you can check for a 400 or above like this
  }
});

rest.get('http://twaud.io/api/v1/users/danwrong.json', function (error, data) {
  sys.puts(data[0].message); // auto convert to object
});

rest.get('http://twaud.io/api/v1/users/danwrong.xml', function (error, data) {
  sys.puts(data[0].sounds[0].sound[0].message); // auto convert to object
});

rest.post('http://user:pass@service.com/action', {
  data: { id: 334 },
  function (error, data, response) {
    if (response.statusCode == 201) {
      // you can get at the raw response like this...
    }
  }
});

// multipart request sending a 321567 byte long file using https
rest.post('https://twaud.io/api/v1/upload.json', {
  multipart: true,
  username: 'danwrong',
  password: 'wouldntyouliketoknow',
  data: {
    'sound[message]': 'hello from restless!',
    'sound[file]': rest.file('doug-e-fresh_the-show.mp3', null, 321567, null, 'audio/mpeg')
  }
}, function (error, data) {
  sys.puts(data.audio_url);
});

// create a service constructor for very easy API wrappers a la HTTParty...
Twitter = rest.service(function (u, p) {
  this.defaults.username = u;
  this.defaults.password = p;
}, {
  baseURL: 'http://twitter.com'
}, {
  update: function (message) {
    return this.post('/statuses/update.json', { data: { status: message } });
  }
});

var client = new Twitter('danwrong', 'password');
client.update('Tweeting using a Restless service thingy').on('complete', function (data) {
  sys.p(data);
});
```

Running the tests
-----------------
```bash
npm test
```

TODO
----
* What do you need? Let me know or fork.
