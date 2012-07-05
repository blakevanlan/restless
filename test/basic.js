var should = require("should");
var rest = require("../lib/restless");
var http = require("http");
var events = require("events");
var behavesLike = require("./behaviors/request");
require("mocha");

describe("Restless", function () {
   before(function(done) {
      var context = this;

      context.server = http.createServer(function (req, res) {
         context.request = req;
         if (req.url == "/error") {
            res.statusCode = 500;
         }
         res.end("Hey dudes.");
      });

      context.server.listen(0, function () {
         context.host = "http://localhost:" + this.address().port;
         done();
      });
   });

   beforeEach(function () {
      context.request = null;
   });

   describe("#get()", function() {
      behavesLike.aRequest();

      it("should make a GET request", function(done) {
         var context = this;
         rest.get(this.host, function(error, data, res) {
            context.request.method.should.match(/^GET/);
            done();
         });
      });
   });

   describe("#post()", function() {
      behavesLike.aRequest();

      it("should make a POST request", function(done) {
         var context = this;
         rest.post(this.host, function(error, data, res) {
            context.request.method.should.match(/^POST/);
            done();
         });
      });
   });
});