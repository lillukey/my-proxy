const http = require('http');
const httpProxy = require('http-proxy');
const zlib = require('zlib');

const proxy = httpProxy.createProxyServer({
  target: 'https://chess.com',
  changeOrigin: true,
  autoRewrite: true,
  followRedirects: true,
  selfHandleResponse: true // Essential for rewriting HTML
});

proxy.on('proxyRes', function (proxyRes, req, res) {
  const contentType = proxyRes.headers['content-type'] || '';
  const encoding = proxyRes.headers['content-encoding'];

  // 1. STRIP SECURITY (Allows the site to load on your URL)
  delete proxyRes.headers['content-security-policy'];
  delete proxyRes.headers['content-security-policy-report-only'];
  delete proxyRes.headers['x-frame-options'];
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 2. PROCESS HTML CONTENT
  if (contentType.includes('text/html')) {
    let body = [];
    proxyRes.on('data', chunk => body.push(chunk));
    proxyRes.on('end', () => {
      let buffer = Buffer.concat(body);

      try {
        // Handle all compression types (GZIP, Deflate, Brotli)
        if (encoding === 'gzip') buffer = zlib.gunzipSync(buffer);
        else if (encoding === 'deflate') buffer = zlib.inflateSync(buffer);
        else if (encoding === 'br') buffer = zlib.brotliDecompressSync(buffer);
      } catch (e) {
        console.error("Decompression failed, sending raw.");
      }

      let content = buffer.toString('utf8');
      
      // Rewrite chess.com links to your Render URL
      const host = req.headers.host;      
      // Rewriting main domain
      content = content.replace(/www\.chess\.com/g, host);
      content = content.replace(/chess\.com/g, host);     
      // Rewriting Asset & Video Domains (This fixes the "middle" image/video)
      content = content.replace(/images\.chesscomfiles\.com/g, host);
      content = content.replace(/betacssjs\.chesscomfiles\.com/g, host);
      content = content.replace(/files\.chesscomfiles\.com/g, host);     
      // Optional: Fixes common "missing pieces" or board assets
      content = content.replace(/https:\/\/www\.chess\.com\/bundles/g, `https://${host}/bundles`);
      // Clean up headers for the modified response
      delete proxyRes.headers['content-encoding'];
      delete proxyRes.headers['content-length'];
      content = content.replace(/chesscomfiles\.com/g, host);
      content = content.replace(/static\.chess\.com/g, host);
      content = content.replace(/assets\.chess\.com/g, host);
      Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
      res.end(content);
    });
  } else {
    // 3. PASS THROUGH EVERYTHING ELSE (Images, JS, CSS)
    Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
    proxyRes.pipe(res);
  }
});

// Error handling to prevent Render crashes
proxy.on('error', (err, req, res) => {
  res.writeHead(500);
  res.end("Proxy Error");
});

const server = http.createServer((req, res) => proxy.web(req, res));
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => console.log(`Unblocked Chess Live on port ${port}`));
