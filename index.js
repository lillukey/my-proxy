const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const zlib = require('zlib');

const proxy = httpProxy.createProxyServer({
  target: 'https://www.chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true // We must handle the response to rewrite the code
});

proxy.on('proxyRes', function (proxyRes, req, res) {
  let body = [];
  proxyRes.on('data', (chunk) => body.push(chunk));
  proxyRes.on('end', () => {
    body = Buffer.concat(body);

    // 1. Decompress the data if it's zipped
    const encoding = proxyRes.headers['content-encoding'];
    if (encoding === 'gzip') {
      body = zlib.gunzipSync(body);
    } else if (encoding === 'deflate') {
      body = zlib.inflateSync(body);
    }

    // 2. REWRITE CONTENT: Change all "chess.com" links to your proxy URL
    let content = body.toString('utf8');
    const proxyHost = req.headers.host;
    content = content.replace(/www\.chess\.com/g, proxyHost);
    content = content.replace(/chess\.com/g, proxyHost);

    // 3. Strip security headers
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-encoding']; // We decompressed it, so remove this

    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    // 4. Send the modified code to your browser
    res.end(content);
  });
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
  console.log('Deep Rewrite Proxy Live');
});
