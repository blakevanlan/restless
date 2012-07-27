var should = require("should");
require("mocha");

 module.exports = function (method) {
   it("should call the callback if supplied as an option", function (done) {
      method(this.host, { callback: done });
   });

   it("should call the callback if supplied as a parameter", function (done) {
      method(this.host, done);
   });

   it("should pass errors as the first parameter to the callback", function (done) {
      method(this.host + "/error", function (error, body, res) {
         error.should.be.ok;
         error.should.equal(500);
         done();
      });
   });

   it("should pass status code as error for code >= 400", function (done) {
      method(this.host + "/notfound", function (error, body, res) {
         error.should.equal(404);
         done();
      });
   });

   it("should pass body as the second parameter to the callback", function (done) {
      method(this.host, function (error, body, res) {
         if (res.req.method && res.req.method.toUpperCase() != "HEAD"){
            body.should.be.ok;
         }
         done();
      });
   });

   it("should pass body as the second parameter to the callback on error", function (done) {
      method(this.host + "/notfound", function (error, body, res) {
         if (res.req.method && res.req.method.toUpperCase() != "HEAD"){
            body.should.equal("Resource not found.");
         }
         done();
      });
   });

   it("should pass response as the third parameter to the callback", function (done) {
      method(this.host, function (error, body, res) {
         should.exist(res);
         done();
      });
   });

   it("should preserve querystring in url", function (done) {
      var context = this;
      method(this.host + "/thing?boo=yah", function (error, body, res) {
         context.request.url.should.equal("/thing?boo=yah");
         done();
      });
   });

   it("should merge querystring in url with query in options", function (done) {
      var context = this;
      method(this.host + "/thing?boo=yah", { query : { pen: "blue" } }, function (error, body, res) {
         context.request.url.should.equal("/thing?boo=yah&pen=blue");
         done();
      });
   });

   it("should serialize query", function (done) {
      var context = this;
      method(this.host, { query : { boo: "yah" } }, function (error, body, res) {
         context.request.url.should.equal("/?boo=yah");
         done();
      });
   });

   it("should set content-type to JSON if data is an object", function (done) {
      var context = this;
      method(this.host, { data: { boo: "yah" } }, function (error, body, res) {
         context.request.headers["content-type"].should.equal("application/json");
         done();
      });
   });

   it("should set content-length", function (done) {
      var context = this;
      var options = { 
         data: { boo: "yah" },
         headers: { "Content-Type": "application/x-www-form-urlencoded"}
      };
      method(this.host, options, function (error, body, res) {
         context.request.headers["content-length"].should.equal("7");
         done();
      });
   });

   it("should set JSON multibyte content-length", function (done) {
      var context = this;
      var options = { 
         data : JSON.stringify({ greeting: 'こんにちは世界' }),
         headers: { "Content-Type": "application/x-www-form-urlencoded"}
      };
      method(this.host, options, function (error, body, res) {
         context.request.headers["content-length"].should.equal("36");
         done();
      });
   });

   it("should serialize body data to json", function (done) {
      var context = this;
      method(this.host, { data : { boo: "yah" } }, function (error, body, res) {
         should.exist(context.request.body);
         context.request.body.should.equal('{"boo":"yah"}');
         done();
      });
   });

   it("should alias option.body as option.data", function (done) {
      var context = this;
      method(this.host, { body : { boo: "yah" } }, function (error, body, res) {
         should.exist(context.request.body);
         context.request.body.should.equal('{"boo":"yah"}');
         done();
      });
   });

   it("should serialize body data to url encoded", function (done) {
      var context = this;
      var options = { 
         data: { boo: "yah" },
         headers: { "Content-Type": "application/x-www-form-urlencoded"}
      };
      method(this.host, options, function (error, body, res) {
         should.exist(context.request.body);
         context.request.body.should.equal("boo=yah");
         done();
      });
   });

   it("should send headers", function (done) {
      var context = this;
      var options = { headers: { "content-type": "application/json" } };
      method(this.host, options, function (error, body, res) {
         context.request.headers["content-type"].should.equal("application/json");
         done();
      });
   });

   it("should send basic authentication", function (done) {
      var context = this;
      var options = { username: 'danwrong', password: 'flange' };
      method(this.host, options, function (error, body, res) {
         context.request.headers.authorization.should.equal("Basic ZGFud3Jvbmc6Zmxhbmdl");
         done();
      });
   });

   it("should send basic authentication if in url", function (done) {
      var context = this;
      var url = 'http://danwrong:flange@localhost:' + context.port;
      method(url, function (error, body, res) {
         context.request.headers.authorization.should.equal("Basic ZGFud3Jvbmc6Zmxhbmdl");
         done();
      });
   });   

   it("should pass error to callback on connection abort", function (done) {
      var context = this;
      method(this.host + "/abort-connection", function (error, body, res) {
         should.exist(error);
         done();
      });
   });

   it("should correctly retry after abort", function (done) {
      var counter = 0;
      method(this.host, function (error, body, res) {
         if (counter++ < 3) {
            this.retry().abort();
         } else {
            done();
         }
      }).abort();
   });

   it("should correctly retry while pending", function (done) {
      var counter = 0, request;
      function command() {
         var args = [].slice.call(arguments);
         var method = args.shift();
         method && setTimeout(function() {
            request[method]();
            command.apply(null, args);
         }, 10);
       }

      request = method(this.host + "/delay", function (error, data) {
         if (++counter < 3) {
            command('retry', 'abort');
         } else {
            done();
         }
      });
      command('abort');
   });

   it("should correctly soft-abort request", function (done) {
      method(this.host + "/abort", function (error, body, res) {
         this.aborted.should.be.true;
         should.not.exist(error);
         done();
      }).abort();
   });

   it("should correctly hard-abort request", function (done) {
      method(this.host + "/abort", function (error, body, res) {
         this.aborted.should.be.true;
         error.should.be.an.instanceOf(Error);
         done();
      }).abort(true);
   });

   it("should handle multipart request data", function (done) {
      var context = this;
      var options = { data: { a: 10, b: "thing" }, multipart: true };
      method(this.host, options, function (error, body, res) {
         should.exist(context.request.body);
         context.request.body.indexOf('name="a"').should.not.be.below(0);
         context.request.body.indexOf('name="b"').should.not.be.below(0);
         done();
      });
   });

   it("should follow multiple redirects", function (done) {
      var context = this;
      method(this.host + "/redirect1", function (error, body, res) {
         context.request.url.should.equal("/redirect3")
         done();
      });
   });

};