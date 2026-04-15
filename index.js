const http = require('http');
const httpProxy = require('http-proxy');
const zlib = require('zlib');

const proxy = httpProxy.createProxyServer({
  target: 'https://www.chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    let body = [];
    proxyRes.on('data', chunk => body.push(chunk));
    proxyRes.on('end', () => {
        body = Buffer.concat(body);

        // Decompress if needed
        const encoding = proxyRes.headers['content-encoding'];
        if (encoding === 'gzip') body = zlib.gunzipSync(body);
        else if (encoding === 'deflate') body = zlib.inflateSync(body);

        // STRIP SECURITY
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-encoding'];

        // REWRITE COOKIES (Crucial for Login)
        if (proxyRes.headers['set-cookie']) {
            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/\.chess\.com/g, req.headers.host)
            );
        }

        // CONTENT REWRITE (Hijack all links)
        let content = body.toString('utf8');
        content = content.replace(/www\.chess\.com/g, req.headers.host);
        content = content.replace(/chess\.com/g, req.headers.host);

        res.setHeader('Content-Security-Policy', "frame-ancestors *");
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Access-Control-Allow-Origin', '*');

        Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
        res.end(content);
    });
});

const server = http.createServer((req, res) => proxy.web(req, res));
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => console.log('Final Proxy Live'));
