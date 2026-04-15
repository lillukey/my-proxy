const http = require('http');
const httpProxy = require('http-proxy');
const zlib = require('zlib');

const proxy = httpProxy.createProxyServer({
  target: 'https://www.chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true // We manually handle the response
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    const contentType = proxyRes.headers['content-type'] || '';
    const encoding = proxyRes.headers['content-encoding'];

    // 1. ALWAYS STRIP SECURITY
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-frame-options'];
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 2. SAFETY CHECK: Only rewrite if it's HTML text
    // If it's an image, script, or style, just send it through raw
    if (contentType.includes('text/html')) {
        let body = [];
        proxyRes.on('data', chunk => body.push(chunk));
        proxyRes.on('end', () => {
            body = Buffer.concat(body);

            // Handle compression if present
            try {
                if (encoding === 'gzip') body = zlib.gunzipSync(body);
                else if (encoding === 'deflate') body = zlib.inflateSync(body);
            } catch (e) {
                // If decompression fails, we can't rewrite, so send as-is
                return res.end(body);
            }

            // Perform the rewrite to keep links on YOUR proxy
            let content = body.toString('utf8');
            content = content.replace(/www\.chess\.com/g, req.headers.host);
            content = content.replace(/chess\.com/g, req.headers.host);

            // Clean up headers for modified content
            delete proxyRes.headers['content-encoding'];
            delete proxyRes.headers['content-length'];

            Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
            res.end(content);
        });
    } else {
        // FOR BINARY FILES (Images, JS, CSS): Just pipe directly
        Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
        proxyRes.pipe(res);
    }
});

const server = http.createServer((req, res) => proxy.web(req, res));
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => console.log('Fixed Binary Proxy Live'));
