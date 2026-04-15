const http = require('http');
const httpProxy = require('http-proxy');

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
    // These lines are what remove the X-Frame blocks
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    Object.keys(proxyRes.headers).forEach(function (key) {
      res.setHeader(key, proxyRes.headers[key]);
    });
    proxyRes.pipe(res);
  });
});

// Use Render's port
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log('Proxy server is live on port ' + port);
});
