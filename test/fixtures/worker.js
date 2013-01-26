var http = require('http');

var server = http.createServer();
server.on('request', function(req, res) {
  res.write(req.method + ' ' + req.url);
  res.end();
});
server.on('connection', function() {
  server.close();
});

server.listen(3000);
