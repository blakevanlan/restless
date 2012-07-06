var should = require("should");
require("mocha");

module.exports = function (method) {
   it("should parse JSON", function (done) {
      method(this.host + "/json", function (error, body, res) {
         body["boo"].should.equal("yah");
         done();
      });
   });  
};