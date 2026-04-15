const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'https://chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true // Essential for the proxyRes listener to work
});

// Fix the warning: Only set the listener ONCE, outside the server creation
proxy.on('proxyRes', function (proxyRes, req, res) {
  // Strip security headers
  delete proxyRes.headers['x-frame-options'];
  delete proxyRes.headers['content-security-policy'];
  
  // Allow CodePen to access
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Forward all other headers
  Object.keys(proxyRes.headers).forEach(function (key) {
    res.setHeader(key, proxyRes.headers[key]);
  });

  // Pipe the data back to the user
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
