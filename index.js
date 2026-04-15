const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'https://www.chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    // 1. Strip ALL security headers that block iframes
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-security-policy'];
    delete proxyRes.headers['x-webkit-csp'];

    // 2. Add headers that allow embedding anywhere
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    // 3. Keep the user on YOUR domain (fixes login/play redirects)
    if (proxyRes.headers['location']) {
        let redirect = proxyRes.headers['location'];
        proxyRes.headers['location'] = redirect.replace('https://www.chess.com', `https://${req.headers.host}`);
    }

    Object.keys(proxyRes.headers).forEach(function (key) {
        res.setHeader(key, proxyRes.headers[key]);
    });

    proxyRes.pipe(res);
});

proxy.on('error', (err, req, res) => {
  res.end('Proxy error: ' + err.message);
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
  console.log('Advanced Proxy Live on port ' + port);
});
