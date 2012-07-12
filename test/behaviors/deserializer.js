var should = require("should");
require("mocha");

var yellow = "\u001b[33m";
var cyan = "\u001b[36m"
var reset = "\u001b[0m";

module.exports = function (method, xml2js, yaml, zlib, iconv) {
   it("should parse JSON", function (done) {
      method(this.host + "/json", function (error, body, res) {
         body[0]["boo"].should.equal("yah");
         done();
      });
   });

   shouldhandleMalformedResponse(method, "json");
   
   if (xml2js) {
      it("should parse XML", function (done) {
         method(this.host + "/xml", function (error, body, res) {
            body["boo"].should.equal("yah");
            done();
         });
      });

      shouldhandleMalformedResponse(method, "xml");
   } else {
      it("should parse XML: install " + reset + yellow + "xml2js" + reset + cyan + " to verify test");
      it("should correctly handle malformed XML: install " + reset + yellow + "xml2js" + reset + cyan + " to verify test");
   }
   
   if (yaml) {
      it("should parse YAML", function (done) {
         method(this.host + "/yaml", function (error, body, res) {
            body["boo"].should.equal("yah");
            done();
         });
      });

      shouldhandleMalformedResponse(method, "yaml");
   } else {
      it("should parse YAML: install " + reset + yellow + " yaml " + reset + cyan + "to verify test");
      it("should correctly handle malformed YAML: install " + reset + yellow + " yaml " + reset + cyan + "to verify test");
   }

   if (zlib) {
      it("should gunzip", function (done) {
         method(this.host + "/gzip", function (error, body, res) {
            body.should.match(/^(compressed data){10}$/);
            done();
         });
      });

      it("should decode and parse", function (done) {
         method(this.host + "/truth", function (error, body, res) {
            with (body) {
               var result = what + (is + the + answer + to + life + the + universe + and + everything).length;
            }
            result.should.equal(42);
            done();
         });
      });   

      it("should inflate", function (done) {
         method(this.host + "/deflate", function (error, body, res) {
            body.should.match(/^(compressed data){10}$/);
            done();
         });
      });
   } else {
      it("should gunzip: install " + reset + yellow + " zlib " + reset + cyan + "to verify test");
      it("should decode and parse: install " + reset + yellow + " zlib " + reset + cyan + "to verify test");
      it("should inflate: install " + reset + yellow + " zlib " + reset + cyan + "to verify test");
   }

   it("should return body as buffer", function (done) {
      method(this.host + "/binary", { decoding: "buffer" }, function (error, body, res) {
         body.should.be.an.instanceOf(Buffer);
         done();
      });
   });   

   it("should decode as buffer", function (done) {
      method(this.host + "/binary", { decoding: "buffer" }, function (error, body, res) {
         body.toString("base64").should.equal("CR5Ah8g=");
         done();
      });
   });   

   it("should decode as binary", function (done) {
      method(this.host + "/binary", { decoding: "binary" }, function (error, body, res) {
         body.should.equal("\t\u001e@È");
         done();
      });
   }); 

   it("should decode as base64", function (done) {
      method(this.host + "/binary", { decoding: "base64" }, function (error, body, res) {
         body.should.equal("CR5Ah8g=");
         done();
      });
   }); 

   if (iconv) {
      it("should correctly convert charsets", function (done) {
         method(this.host + "/charset", function (error, data) {
            data.should.equal('абвгдеёжзийклмнопрстуфхцчшщъыьэюя');
            done();
         });
      });  
   } else {
      it("should correctly convert charsets: install " + reset + yellow + " iconv " + reset + cyan + "to verify test");
   }
};

shouldhandleMalformedResponse = function (method, type) {
   it("should correctly handle malformed " + type.toUpperCase(), function (done) {
      method(this.host + "/mal-" + type, function (error, body, res) {
         error.should.be.an.instanceOf(Error);
         error.message.should.match(/^Failed to parse/);
         done();
      });
   }); 
}