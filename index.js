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
    // 1. Strip security headers
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // 2. FORCE LINKS TO STAY ON PROXY
    // If the site tries to redirect you to /play, this changes it to ://your-proxy.com
    if (proxyRes.headers['location']) {
        let redirect = proxyRes.headers['location'];
        proxyRes.headers['location'] = redirect.replace('https://chess.com', `https://${req.headers.host}`);
    }

    res.setHeader('Content-Security-Policy', "frame-ancestors *");
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
