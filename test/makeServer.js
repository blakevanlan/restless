var http = require("http");

module.exports = function (done) {
   var context = this;

   context.server = http.createServer(function (req, res) {
      context.request = req;
      
      // Parse request body
      context.request.body = "";
      req.on("data", function (chunk) {
         context.request.body += chunk;
      });

      respond(req, res);
   });

   context.server.listen(0, function () {
      context.port = this.address().port;
      context.host = "http://localhost:" + context.port;
      done();
   });
};

var respond = function (req, res) {
   switch (req.url) {
      case "/abort":
         req.connection.destroy();
         break;
      case "/error":
         res.writeHead(500);
         res.end();
         break;
      case "/json":
         res.writeHead(200, { "Content-Type": "application/json" });
         res.end('{ "boo": "yah" }');
         break;
      case "/xml":
         res.writeHead(200, { "Content-Type": "application/xml" });
         res.end("<document><ok>true</ok></document>");
         break;
      case "/yaml":
         res.writeHead(200, { "Content-Type": "application/yaml" });
         res.end("ok: true");
         break;
      case "/gzip":
         res.writeHead(200, { "content-encoding": "gzip" });
         res.end(Buffer("H4sIAAAAAAAAA0vOzy0oSi0uTk1RSEksSUweHFwADdgOgJYAAAA=", "base64"));
         break;
      case "/deflate":
         res.writeHead(200, { "content-encoding": "deflate" });
         res.end(Buffer("eJxLzs8tKEotLk5NUUhJLElMHhxcAI9GO1c=", "base64"));
         break;
      case "/truth":
         res.writeHead(200, {
            "content-encoding": "deflate",
            "Content-Type": "application/json"
         });
         res.end(Buffer("eJw1i0sKgDAQQ++S9Sj+cDFXEReCoy2UCv0oIt7dEZEsEvKSC4eZErjoCTaCr5uQjICHilQjYfLxkAD+g/IN3BCcXXT3GSF7u0uI2vjs3HubwW1ZdwRRcCZj/QpOIcv9ACXbJLo=", "base64"));
         break;
      case "/binary":
         res.writeHead(200);
         res.end(Buffer([9, 30, 64, 135, 200]));
         break;
      case "/push-json":
         var echo = "";
         req.addListener("data", function(chunk) {
            echo += chunk.toString("binary");
         });
         req.addListener("end", function() {
            res.writeHead(200, {
               "Content-Type": "application/json"
            });
            res.end(JSON.stringify(JSON.parse(echo)));
         });
         break;
      case "/custom-mime":
         res.writeHead(200, {
           "Content-Type": "application/vnd.github.beta.raw+json; charset=UTF-8"
         });
         res.end(JSON.stringify([6,6,6]));
         break;
      case "/mal-json":
         res.writeHead(200, { "Content-Type": "application/json" });
         res.end("Чебурашка");
         break;
      case "/mal-xml":
         res.writeHead(200, { "Content-Type": "application/xml" });
         res.end("Чебурашка");
         break;
      case "/mal-yaml":
         res.writeHead(200, { "Content-Type": "application/yaml" });
         res.end("{Чебурашка");
         break;
      case "/abort":
         setTimeout(function() {
            res.writeHead(200);
            res.end("not aborted");
         }, 100);
         break;
      case "/charset":
         res.writeHead(200, {
            "Content-Type": "text/plain; charset=windows-1251"
         });
         res.end(Buffer("e0e1e2e3e4e5b8e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff", "hex"));
         break;
      default:
         res.end("Hey dudes.");
   }
};