require("mocha");
var should = require("should");
var rest = require("../lib/restless");
var http = require("http");
var makeServer = require("./makeServer");
var behavesLike = {
   aRequest: require("./behaviors/request"),
   aDeserializer: require("./behaviors/deserializer"),
   aCustomMimiHandler: require("./behaviors/customMimiHandler")
}

var xml2js, yaml, zlib, iconv;
loadOptionalLibraries();

describe("Restless", function () {
   beforeEach(makeServer);

   describe("#get()", function () {
      behavesLike.aRequest(rest.get);
      behavesLike.aDeserializer(rest.get, xml2js, yaml, zlib, iconv);
      behavesLike.aCustomMimiHandler(rest, rest.get);

      it("should make a GET request", function (done) {
         var context = this;
         rest.get(this.host, function(error, data, res) {
            context.request.method.should.equal("GET");
            done();
         });
      });
   });

   describe("#post()", function () {
      behavesLike.aRequest(rest.post);
      behavesLike.aDeserializer(rest.post, xml2js, yaml, zlib, iconv);
      behavesLike.aCustomMimiHandler(rest, rest.post);

      it("should make a POST request", function (done) {
         var context = this;
         rest.post(this.host, function(error, data, res) {
            context.request.method.should.equal("POST");
            done();
         });
      });
   });

   describe("#patch()", function () {
      behavesLike.aRequest(rest.patch);
      behavesLike.aDeserializer(rest.patch, xml2js, yaml, zlib, iconv);
      behavesLike.aCustomMimiHandler(rest, rest.patch);

      it("should make a PATCH request", function (done) {
         var context = this;
         rest.patch(this.host, function(error, data, res) {
            context.request.method.should.equal("PATCH");
            done();
         });
      });
   });

   describe("#del()", function () {
      behavesLike.aRequest(rest.del);
      behavesLike.aDeserializer(rest.del, xml2js, yaml, zlib, iconv);
      behavesLike.aCustomMimiHandler(rest, rest.del);

      it("should make a DELETE request", function (done) {
         var context = this;
         rest.del(this.host, function(error, data, res) {
            context.request.method.should.equal("DELETE");
            done();
         });
      });
   });

   describe("#put()", function () {
      behavesLike.aRequest(rest.put);
      behavesLike.aDeserializer(rest.put, xml2js, yaml, zlib, iconv);
      behavesLike.aCustomMimiHandler(rest, rest.put);

      it("should make a PUT request", function (done) {
         var context = this;
         rest.put(this.host, function(error, data, res) {
            context.request.method.should.equal("PUT");
            done();
         });
      });
   });

   describe("#head()", function () {
      behavesLike.aRequest(rest.head);

      it("should make a HEAD request", function (done) {
         var context = this;
         rest.head(this.host, function(error, data, res) {
            context.request.method.should.equal("HEAD");
            done();
         });
      });
   });

   describe("#json()", function () {
      it("should post and parse JSON with only data and callback specified", function (done) {
         var obj = { secret : "very secret string" };
         rest.json(this.host + "/push-json", obj, function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });

      it("should post and parse JSON with only data and method specified", function (done) {
         var obj = { secret : "very secret string" };
         rest.json(this.host + "/push-json", obj, "PUT", function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });

      it("should post and parse JSON without method specified", function (done) {
         var obj = { secret : "very secret string" };
         var options = { username: 'danwrong', password: 'flange' };
         rest.json(this.host + "/push-json", obj, options, function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });

      it("should post and parse JSON with callback as option", function (done) {
         var obj = { secret : "very secret string" };
         rest.json(this.host + "/push-json", obj, { callback: function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         }});
      }); 

      it("should post and parse JSON with all parameters specified", function (done) {
         var obj = { secret : "very secret string" };
         var options = { username: 'danwrong', password: 'flange' };
         rest.json(this.host + "/push-json", obj, options, "PUT", function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });
   });

   describe("#postJson()", function () {
      it("should post and parse JSON with only data and callback specified", function (done) {
         var obj = { secret : "very secret string" };
         rest.json(this.host + "/push-json", obj, function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });

      it("should post and parse JSON with all parameters specified", function (done) {
         var obj = { secret : "very secret string" };
         var options = { username: 'danwrong', password: 'flange' };
         rest.json(this.host + "/push-json", obj, options, function (error, data) {
            data.secret.should.equal(obj.secret);
            done();
         });
      });
   });
});

function loadOptionalLibraries () {
   try {
      xml2js = require("xml2js"); 
   } catch (err) { 
      printWarning("Couldn't load xml2js: " + err.message);
   }
   try {
      yaml = require("yaml"); 
   } catch (err) { 
      printWarning("Couldn't load yaml: " + err.message);
   }
   try {
      zlib = require("zlib");
   } catch (err) {
      printWarning("Couldn't load zlib: " + err.message); 
   }
   try {
      iconv = require("iconv").Iconv;
   } catch (err) {
      printWarning("Couldn't load iconv: " + err.message); 
   }
}

function printWarning (message) {
   var yellow = "\u001b[33m";
   var reset = "\u001b[0m";
   console.log(yellow + "  Warning: " + message + reset);
};