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
         should.exist(error);
         done();
      });
   });

   it("should pass body as the second parameter to the callback", function (done) {
      method(this.host, function (error, body) {
         should.exist(body);
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

   it("should serialize body data to url encoded", function (done) {
      var context = this;
      method(this.host, { data : { boo: "yah" } }, function (error, body, res) {
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

   it("should fire callback on connection abort", function (done) {
      var context = this;
      method(this.host + "/abort", function (error, body, res) {
         should.exist(error);
         done();
      });
   });

   // DO I INCLUDE ABORT AND RETRY TESTS?

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
};