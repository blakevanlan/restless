var should = require("should");
require("mocha");

module.exports = function (restless, method) {
   it("should understand custom mime-type", function (done) {
      var context = this;
      restless.parsers.auto.matchers['application/vnd.github+json'] = function(data, callback) {
         restless.parsers.json.call(this, data, function(err, data) {
            err || (data.__parsedBy__ = 'github');
            callback(err, data);
         });
      };
      method(this.host + '/custom-mime', function (error, body, res) {
         body.join("").should.equal("666");
         body.__parsedBy__.should.equal("github", "should use vendor-specific parser");
         done();
      });
   });
};