const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'https://chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true // Essential for the proxyRes listener to work
});

proxy.on('proxyRes', function (proxyRes, req, res) {
  // 1. Remove the blocks coming from Chess.com
  delete proxyRes.headers['x-frame-options'];
  delete proxyRes.headers['content-security-policy'];
  
  // 2. Add a new rule that allows YOUR proxy to be framed anywhere
  // This fixes the "Render refuses to connect" error
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  Object.keys(proxyRes.headers).forEach(function (key) {
    res.setHeader(key, proxyRes.headers[key]);
  });
  proxyRes.pipe(res);
});


// Handle errors to prevent crashes
proxy.on('error', function (err, req, res) {
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
  }
  res.end('Proxy Error');
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
  console.log('Proxy is live and optimized on port ' + port);
});
