const http = require('http');
const httpProxy = require('http-proxy');

// Create the proxy server
const proxy = httpProxy.createProxyServer({
  target: 'https://chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);

  proxy.on('proxyRes', function (proxyRes, req, res) {
    // Strips the security blocks before sending them to your browser
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Allows your CodePen to talk to this server
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    Object.keys(proxyRes.headers).forEach(function (key) {
      res.setHeader(key, proxyRes.headers[key]);
    });
    proxyRes.pipe(res);
  });
});

// Render provides the PORT variable; default to 10000 if not found
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
  console.log('Proxy server is live on port ' + port);
});
