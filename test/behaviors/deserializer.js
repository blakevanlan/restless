var should = require("should");
require("mocha");

module.exports = function (method, zlib, iconv) {
   it("should parse JSON", function (done) {
      method(this.host + "/json", function (error, body, res) {
         body["boo"].should.equal("yah");
         done();
      });
   });
   
   it("should parse XML", function (done) {
      method(this.host + "/xml", function (error, body, res) {
         body["boo"].should.equal("yah");
         done();
      });
   });

   it("should parse YAML", function (done) {
      method(this.host + "/yaml", function (error, body, res) {
         body["boo"].should.equal("yah");
         done();
      });
   });

   it("should gunzip if zlib is present", function (done) {
      if (zlib) {
         method(this.host + "/gzip", function (error, body, res) {
            body.should.match(/^(compressed data){10}$/);
            done();
         });
      } else {
         printInconclusive("zlib");
         done();
      }
   });

   it("should inflate if zlib is present", function (done) {
      if (zlib) {
         method(this.host + "/deflate", function (error, body, res) {
            body.should.match(/^(compressed data){10}$/);
            done();
         });
      } else {
         printInconclusive("zlib");
         done();
      }
   }); 

   it("should decode and parse if zlib is present", function (done) {
      if (zlib) {
         method(this.host + "/truth", function (error, body, res) {
            with (body) {
               var result = what + (is + the + answer + to + life + the + universe + and + everything).length;
            }
            result.should.equal(42);
            done();
         });
      } else {
         printInconclusive("zlib");
         done();
      }
   });   

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

   shouldhandleMalformedResponse(method, "json");
   shouldhandleMalformedResponse(method, "xml");
   shouldhandleMalformedResponse(method, "yaml");

   it("should correctly convert charsets", function (done) {
      if (iconv) {
         method(this.host + "/charset", function (error, data) {
            data.should.equal('абвгдеёжзийклмнопрстуфхцчшщъыьэюя');
            done();
         })
      } else {
         printInconclusive("iconv");
         done();
      }
   });  
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

printInconclusive = function (libRequired) {
   var yellow = "\u001b[33m";
   var reset = "\u001b[0m";
   console.log(yellow + "Inconclusive: install " + libRequired + " to test" + reset);
}