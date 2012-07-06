var should = require("should");
var rest = require("../lib/restless");
var http = require("http");
var makeServer = require("./makeServer");
var behavesLike = {
   aRequest: require("./behaviors/request"),
   aDeserializer: require("./behaviors/deserializer")
}
require("mocha");

describe("Restless", function () {
   beforeEach(makeServer);

   // beforeEach(function () {
   //    context.request = null;
   // });

   describe("#get()", function() {
      behavesLike.aRequest(rest.get);
      behavesLike.aDeserializer(rest.get);

      it("should make a GET request", function(done) {
         var context = this;
         rest.get(this.host, function(error, data, res) {
            context.request.method.should.equal("GET");
            done();
         });
      });
   });

   describe("#post()", function() {
      behavesLike.aRequest(rest.post);
      behavesLike.aDeserializer(rest.post);

      it("should make a POST request", function(done) {
         var context = this;
         rest.post(this.host, function(error, data, res) {
            context.request.method.should.equal("POST");
            done();
         });
      });
   });

   describe("#patch()", function() {
      behavesLike.aRequest(rest.patch);
      behavesLike.aDeserializer(rest.patch);

      it("should make a PATCH request", function(done) {
         var context = this;
         rest.patch(this.host, function(error, data, res) {
            context.request.method.should.equal("PATCH");
            done();
         });
      });
   });

   describe("#del()", function() {
      behavesLike.aRequest(rest.del);
      behavesLike.aDeserializer(rest.del);

      it("should make a DELETE request", function(done) {
         var context = this;
         rest.del(this.host, function(error, data, res) {
            context.request.method.should.equal("DELETE");
            done();
         });
      });
   });

   describe("#put()", function() {
      behavesLike.aRequest(rest.put);
      behavesLike.aDeserializer(rest.put);

      it("should make a PUT request", function(done) {
         var context = this;
         rest.put(this.host, function(error, data, res) {
            context.request.method.should.equal("PUT");
            done();
         });
      });
   });

   describe("#head()", function() {
      behavesLike.aRequest(rest.head);

      it("should make a HEAD request", function(done) {
         var context = this;
         rest.head(this.host, function(error, data, res) {
            context.request.method.should.equal("HEAD");
            done();
         });
      });
   });
});