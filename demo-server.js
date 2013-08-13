var http = require('http');
var send = require('send');
var port = process.env.PORT || 8080;

http.createServer(function(req, res) {
  if (req.url === '/') {
    res.writeHead(301, {'Location': '/index.html'});
    res.end();
    return;
  }

  send(req, req.url)
    .root(__dirname + '/build')
    .pipe(res);
}).listen(port);

console.log('Serving ./build at http://127.0.0.1:' + port + '/');
