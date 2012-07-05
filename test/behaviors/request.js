var should = require("should");
var rest = require("../../lib/restless");
require("mocha");

var behavesLike = module.exports = {};

behavesLike.aRequest = function () {
   it("should call the callback if supplied as an option", function (done) {
      rest.get(this.host, { callback: done });
   });

   it("should call the callback if supplied as a parameter", function (done) {
      rest.get(this.host, done);
   });

   it("should pass errors as the first parameter to the callback", function (done) {
      rest.get(this.host + "/error", function (error) {
         should.exist(error);
         done();
      });
   });

   it("should pass body as the second parameter to the callback", function (done) {
      rest.get(this.host, function (error, body) {
         should.exist(body);
         done();
      });
   });

   it("should pass response as the third parameter to the callback", function (done) {
      rest.get(this.host, function (error, body, res) {
         should.exist(res);
         done();
      });
   });
};