const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'https://www.chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true
});

const server = http.createServer((req, res) => {
  // Add this: If someone visits the main link, fetch the homepage
  if (req.url === '/') {
    req.url = '/'; 
  }

  proxy.web(req, res);

  proxy.on('proxyRes', function (proxyRes, req, res) {
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    Object.keys(proxyRes.headers).forEach(function (key) {
      res.setHeader(key, proxyRes.headers[key]);
    });
    proxyRes.pipe(res);
  });
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
  console.log('Proxy is active on port ' + port);
});
