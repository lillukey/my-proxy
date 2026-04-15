const http = require('http');
const httpProxy = require('http-proxy');
const zlib = require('zlib');

const proxy = httpProxy.createProxyServer({
  target: 'https://chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    const contentType = proxyRes.headers['content-type'] || '';
    
    // STRIP SECURITY HEADERS (Always do this)
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-frame-options'];
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ONLY REWRITE IF IT IS HTML
    if (contentType.includes('text/html')) {
        let body = [];
        proxyRes.on('data', chunk => body.push(chunk));
        proxyRes.on('end', () => {
            body = Buffer.concat(body);
            const encoding = proxyRes.headers['content-encoding'];
            
            try {
                if (encoding === 'gzip') body = zlib.gunzipSync(body);
                else if (encoding === 'deflate') body = zlib.inflateSync(body);
            } catch (e) {
                console.log("Decompression failed, sending raw.");
            }

            let content = body.toString('utf8');
            content = content.replace(/www\.chess\.com/g, req.headers.host);
            content = content.replace(/chess\.com/g, req.headers.host);

            delete proxyRes.headers['content-encoding'];
            delete proxyRes.headers['content-length']; // Browser will recalculate

            Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
            res.end(content);
        });
    } else {
        // FOR IMAGES/SCRIPTS: Just pipe them through without touching them
        Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
        proxyRes.pipe(res);
    }
});

const server = http.createServer((req, res) => proxy.web(req, res));
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => console.log('Fixed Proxy Live'));
