var sys       = require('util');
var http      = require('http');
var https     = require('https');
var url       = require('url');
var qs        = require('querystring');
var multipart = require('./multipartform');
var zlib      = null;
var Iconv     = null;

var globalOptions = {
   proxy: null
};

try {
   zlib = require('zlib');
} catch (err) {}
try {
   Iconv = require('iconv').Iconv;
} catch (err) {}

function mixin(target, source) {
   source = source || {};
   Object.keys(source).forEach(function(key) {
      target[key] = source[key];
   });
   
   return target;
}

function Request(uri, options) {
   this.url = url.parse(uri, true);
   this.options = options;
   this.options.data = this.options.data || this.options.body
   this.headers = {
      'Accept': '*/*',
      'User-Agent': 'Restless for node.js',
      'Host': this.url.host
   };

   if (zlib) {
      this.headers['Accept-Encoding'] = 'gzip, deflate';
   }
   
   mixin(this.headers, options.headers || {});
   
   // set port and method defaults
   if (!this.url.port) this.url.port = (this.url.protocol == 'https:') ? '443' : '80';
   if (!this.options.method) this.options.method = (this.options.data) ? 'POST' : 'GET';
   if (typeof this.options.followRedirects == 'undefined') this.options.followRedirects = true;
   
   // merge options.query and query params in url
   if (this.options.query) {
      if (typeof this.options.query != 'object') {
         this.options = qs.parse(this.options.query);
      }
      mixin(this.url.query, this.options.query);
   }
   
   this._applyBasicAuth();
   
   if (this.options.multipart) {
      this.headers['Content-Type'] = 'multipart/form-data; boundary=' + multipart.defaultBoundary;
      var multipart_size = multipart.sizeOf(this.options.data, multipart.defaultBoundary);
      if (typeof multipart_size === 'number' && multipart_size === multipart_size) {
         this.headers['Content-Length'] = multipart_size;
      }
      else {
         console.log("Building multipart request without Content-Length header, please specify all file sizes");
      }
   } else {
      if (typeof this.options.data == "object") {
         if (this.headers["Content-Type"] == "application/x-www-form-urlencoded") {
            this.options.data = qs.stringify(this.options.data);
         } else {
            this.options.data = JSON.stringify(this.options.data);
            this.headers["Content-Type"] = "application/json";
         }
         
         this.headers["Content-Length"] = this.options.data.length;
      }
      if (typeof this.options.data == "string") {
         var buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
         this.options.data = buffer;
         this.headers["Content-Length"] = buffer.length;
      }
   }
   
   var proto = (this.url.protocol == "https:") ? https : http;
   var requestOptions = {
      
      headers: this.headers,
      method: this.options.method
   };

   if (globalOptions.proxy) {
      requestOptions.path = this._fullPath();
      requestOptions.host = globalOptions.proxy.host;
      requestOptions.port = globalOptions.proxy.port;
      requestOptions.headers.host = this.url.host;
   } else {
      requestOptions.path = this._relativePath();
      requestOptions.hostname = this.url.hostname;
      requestOptions.port = this.url.port;
   }

   this.request = proto.request(requestOptions);
   this._makeRequest();
}

mixin(Request.prototype, {
   _isRedirect: function(response) {
      return ([301, 302, 303].indexOf(response.statusCode) >= 0);
   },
   _relativePath: function() {
      var path = this.url.pathname || '/';
      var querystring = qs.stringify(this.url.query);
      if (querystring) path += '?' + querystring;
      if (this.url.hash) path += this.url.hash;
      return path;
   },
   _fullPath: function () {
      return this.url.protocol + "//" + this.url.host + this._relativePath();
   },
   _applyBasicAuth: function() {
      var authParts;
      
      if (this.url.auth) {
         authParts = this.url.auth.split(':');
         this.options.username = authParts[0];
         this.options.password = authParts[1];
      }
      
      if (this.options.username && this.options.password) {
         var b = new Buffer([this.options.username, this.options.password].join(':'));
         this.headers['Authorization'] = "Basic " + b.toString('base64');
      }
   },
   _responseHandler: function(response) {
      var self = this;
      
      if (self._isRedirect(response) && self.options.followRedirects) {
         try {
            self.url = url.parse(url.resolve(self.url.href, response.headers['location']));
            self._retry();
            // todo handle somehow infinite redirects
         } catch(err) {
            err.message = 'Failed to follow redirect: ' + err.message;
            self._fireError(err, response);
         }
      } else {
         var body = '';
         
         response.setEncoding('binary');
         
         response.on('data', function(chunk) {
            body += chunk;
         });
         
         response.on('end', function() {
            response.rawEncoded = body;
            self._decode(new Buffer(body, 'binary'), response, function(err, body) {
               if (err) {
                  self._fireError(err, response);
                  return;
               }
               response.raw = body;
               body = self._iconv(body, response);
               self._encode(body, response, function(err, body) {
                  if (err) {
                     self._fireError(err, response);
                  } else {
                     self._fireSuccess(body, response);
                  }
               });
            });
         });
      }
   },
   _decode: function(body, response, callback) {
      var decoder = response.headers['content-encoding'];
      if (decoder in decoders) {
         decoders[decoder].call(response, body, callback);
      } else {
         callback(null, body);
      }
   },
   _iconv: function(body, response) {
      if (Iconv) {
         var charset = response.headers['content-type'];
         if (charset) {
            charset = /\bcharset=(.+)(?:;|$)/i.exec(charset);
            if (charset) {
               charset = charset[1].trim().toUpperCase();
               if (charset != 'UTF-8') {
                  try {
                     var iconv = new Iconv(charset, 'UTF-8//TRANSLIT//IGNORE');
                     return iconv.convert(body);
                  } catch (err) {}
               }
            }
         }
      }
      return body;
   },
   _encode: function(body, response, callback) {
      var self = this;
      if (self.options.decoding == 'buffer') {
         callback(null, body);
      } else {
         body = body.toString(self.options.decoding);
         if (self.options.parser) {
            self.options.parser.call(response, body, callback);
         } else {
            callback(null, body);
         }
      }
   },
   _fireError: function(err, response) {
      if (this.options.callback) {
         this.options.callback.call(this, err, null, response);
      }
   },
   _fireSuccess: function(body, response) {
      var statusCode = parseInt(response.statusCode);

      if (response.req && response.req.method && response.req.method.toUpperCase() == "HEAD") {
         body = null;
      }
      if (statusCode >= 400) {
         if (this.options.callback) {
            this.options.callback.call(this, statusCode, body, response);
         }
      } else {
         if (this.options.callback) {
            this.options.callback.call(this, null, body, response);
         }
      }
   },
   _makeRequest: function() {
      var self = this;
      this.request.on('response', function(response) {
         self._responseHandler(response);
      }).on('error', function(err) {
         if (!self.aborted) {
            self._fireError(err, null);
         }
      });
   },
   _retry: function() {
      this.request.removeAllListeners().on('error', function() {});
      if (this.request.finished) {
         this.request.abort();
      }
      Request.call(this, this.url.href, this.options); // reusing request object to handle recursive calls and remember listeners
      this.run();
   },
   run: function() {
      var self = this;
      
      if (this.options.multipart) {
         multipart.write(this.request, this.options.data, function() {
            self.request.end();
         });
      } else {
         if (this.options.data) {
            this.request.write(this.options.data.toString(), this.options.encoding || 'utf8');
         }
         this.request.end();
      }
      
      return this;
   },
   abort: function(err) {
      var self = this;

      if (err) {
         if (typeof err == 'string') {
            err = new Error(err);
         } else if (!(err instanceof Error)) {
            err = new Error('AbortError');
         }
         err.type = 'abort';
      } else {
         err = null;
      }

      self.request.on('close', function() {
         if (err) {
            self._fireError(err, null);
         } else {
            if (self.options.callback) self.options.callback.call(self, null);
         }
      });

      self.aborted = true;
      self.request.abort();
      return this;
   },
   retry: function(timeout) {
      var self = this;
      timeout = parseInt(timeout);
      var fn = self._retry.bind(self);
      if (!isFinite(timeout) || timeout <= 0) {
         process.nextTick(fn, timeout);
      } else {
         setTimeout(fn, timeout);
      }
      return this;
   }
});

function setOptionDefaults(method, options, callback) {
   if (typeof options === "function") {
      options = { callback: options };
   } else {
      options = options || {};
      if (callback) {
         options.callback = callback;
      }
   }
   options.method = method;
   options.parser = (typeof options.parser !== "undefined") ? options.parser : parsers.auto;
   return options;
}

function checkOptions(options) {
   var knownOptions = ["method", "query", "data", "body", "parser", "encoding", 
      "decoding", "headers", "username", "password", "multipart", "client",
      "followRedirects", "callback"];
   for (var key in options) {
      if (knownOptions.indexOf(key) < 0) {
         console.error("[Restless] Unknown option: " + key);
      }
   }
}

function request(method, url, options, callback) {
   options = setOptionDefaults(method, options, callback);
   checkOptions(options);
   var request = new Request(url, options);
   process.nextTick(request.run.bind(request));
   return request;
}

function get(url, options, callback) {
 return request("GET", url, options, callback);
}

function patch(url, options, callback) {
   return request("PATCH", url, options, callback);
}

function post(url, options, callback) {
   return request("POST", url, options, callback);
}

function put(url, options, callback) {
   return request("PUT", url, options, callback);
}

function del(url, options, callback) {
   return request("DELETE", url, options, callback);
}

function head(url, options, callback) {
   return request("HEAD", url, options, callback);
}

var parsers = {
   auto: function(data, callback) {
      var contentType = this.headers['content-type'];
      var contentParser;
      if (contentType) {
         contentType = contentType.replace(/;.+/, ''); // remove all except mime type (eg. text/html; charset=UTF-8)
         if (contentType in parsers.auto.matchers) {
            contentParser = parsers.auto.matchers[contentType];
         } else {
            // custom (vendor) mime types
            var parts = contentType.match(/^([\w-]+)\/vnd((?:\.(?:[\w-]+))+)\+([\w-]+)$/i);
            if (parts) {
               var type = parts[1];
               var vendors = parts[2].substr(1).split('.');
               var subtype = parts[3];
               var vendorType;
               while (vendors.pop() && !(vendorType in parsers.auto.matchers)) {
                  vendorType = vendors.length
                     ? type + '/vnd.' + vendors.join('.') + '+' + subtype
                     : vendorType = type + '/' + subtype;
               }
               contentParser = parsers.auto.matchers[vendorType];
            }
         }
      }
      if (typeof contentParser == 'function') {
         contentParser.call(this, data, callback);
      } else {
         callback(null, data);
      }
   },
   json: function(data, callback) {
      if (data && data.length) {
         var parsed, error;

         try {
            parsed = JSON.parse(data);
         } catch (err) {
            err.message = 'Failed to parse JSON body: ' + err.message;
            error = err;
         }

         callback(error, parsed);
      } else {
         callback(null, null);
      }
   }
};

parsers.auto.matchers = {
   'application/json': parsers.json
};

try {
   var yaml = require('yaml');
   
   parsers.yaml = function(data, callback) {
      if (data) {
         try {
            callback(null, yaml.eval(data));
         } catch (err) {
            err.message = 'Failed to parse YAML body: ' + err.message;
            callback(err, null);
         }
      } else {
         callback(null, null);
      }
   };
   
   parsers.auto.matchers['application/yaml'] = parsers.yaml;
} catch(e) {}

try {
   var xml2js = require('xml2js');

   parsers.xml = function(data, callback) {
      if (data) {
         var parser = new xml2js.Parser();
         parser.parseString(data, function(err, data) {
            if (err) {
               err.message = 'Failed to parse XML body: ' + err.message;
            }
            callback(err, data);
         });
      } else {
         callback(null, null);
      }
   };
   
   parsers.auto.matchers['application/xml'] = parsers.xml;
} catch(e) { }

var decoders = {
   gzip: function(buf, callback) {
      zlib.gunzip(buf, callback);
   },
   deflate: function(buf, callback) {
      zlib.inflate(buf, callback);
   }
};


function Service(defaults) {
   if (defaults.baseURL) {
      this.baseURL = defaults.baseURL;
      delete defaults.baseURL; 
   }
   
   this.defaults = defaults;
}

mixin(Service.prototype, {
   request: function(path, options) {
      return request(this._url(path), this._withDefaults(options));
   },
   get: function(path, options) {
      return get(this._url(path), this._withDefaults(options));
   },
   patch: function(path, options) {
      return patch(this._url(path), this._withDefaults(options));
   },
   put: function(path, options) {
      return put(this._url(path), this._withDefaults(options));
   },
   post: function(path, options) {
      return post(this._url(path), this._withDefaults(options));
   },
   json: function(method, path, data, options) {
      return json(this._url(path), data, this._withDefaults(options), method);
   },
   del: function(path, options) {
      return del(this._url(path), this._withDefaults(options));
   },
   _url: function(path) {
      if (this.baseURL) return url.resolve(this.baseURL, path);
      else return path;
   },
   _withDefaults: function(options) {
      var o = mixin({}, this.defaults);
      return mixin(o, options);
   }
});

function service(constructor, defaults, methods) {
   constructor.prototype = new Service(defaults || {});
   mixin(constructor.prototype, methods);
   return constructor;
}

module.exports = function (options) {
   if (options) {
      if (options.proxy) {
         if (typeof options.proxy == "object") {
            globalOptions.proxy = {
               host: options.proxy.host,
               port: options.proxy.port
            }
         } else {
            var parsed = url.parse(options.proxy);
            globalOptions.proxy = {
               host: parsed.hostname,
               port: parsed.port
            }
         }
      }
   }
   return module.exports;
}

mixin(module.exports, {
   Request: Request,
   Service: Service,
   request: request,
   service: service,
   get: get,
   patch: patch,
   post: post,
   put: put,
   del: del,
   head: head,
   parsers: parsers,
   file: multipart.file,
   data: multipart.data
});
