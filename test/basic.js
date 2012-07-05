var should = require("should");
var rest = require("../lib/restless");
var http = require("http");
var events = require("events");
require("mocha");


describe("Restless", function() {
   beforeEach(function() {
      var testContext = this;

      http.request = function(options, callback) {
         var body;
         testContext.requestBody = ""
         body = testContext.requestBody;

         testContext.requestOptions = options;
         testContext.req = new events.EventEmitter();
         testContext.req.end = function() {};
         testContext.req.write = function(data) {
            body += data;
         };

         if (callback)
            callback(testContext.req);
         
         process.nextTick(function() {
            testContext.res = new events.EventEmitter();
            testContext.res.setEncoding = function() {};

            testContext.req.emit("response", testContext.res);
            testContext.res.emit("end");
         });
         
         return testContext.req;
      };
   });

   describe("#get()", function() {
      it("should make a GET request", function(done) {
         rest.get("test").on("complete", function() {
            this.requestOptions.method.should.match(/^GET/);
            done();
         });
      });
      it("should make a GET request with callback as an option", function() {
         rest.get("test", { callback: function() { 
            this.requestOptions.method.should.match(/^GET/);
         }});
      });
      it("should make a GET request with correct path", function() {
         rest.get("test", function() {
            this.requestOptions.path.should.equal("test");
         });
      });
      it("should preserve querystring in url", function() {
         rest.get("test?boo=yah", function() {
            this.requestOptions.path.should.equal("test?boo=yah");
         });
      });
      it("should serialize query", function() {
         rest.get("test", { query: { q: "maybe" }}, function() {
            this.requestOptions.path.should.equal("test?q=maybe");
         });
      });
   });
   describe("#post()", function() {
      it("should make a POST request", function(done) {
         rest.post("test", function() {
            this.requestOptions.method.should.match(/^POST/);
            done();
         });
      });
      it("should POST body data", function() {
         rest.post("test", { data: "this_is_data" }, function() {
            this.requestBody.should.equal("this_is_data");
         });
      });
      it("should set content-type", function() {
         rest.post("test", { data: "this_is_data" }, function() {

         });
      });
   });
   describe("#patch()", function() {
      it("should make a PATCH request", function() {
         rest.patch("test", function() {
            this.requestOptions.method.should.match(/^PATCH/);
         });
      });
   });
   describe("#put()", function() {
      it("should make a PUT request", function() {
         rest.put("test", function() {
            this.requestOptions.method.should.match(/^PUT/);
         });
      });
   });
   describe("#del()", function() {
      it("should make a DELETE request", function() {
         rest.del("test", function() {
            this.requestOptions.method.should.match(/^DELETE/);
         });
      });
   });
   describe("#head()", function() {
      it("should make a HEAD request", function() {
         rest.head("test", function() {
            this.requestOptions.headers["request-method"].should.equal("head");
         });
      });
   });
});