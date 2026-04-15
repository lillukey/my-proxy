document.getElementById('launch-btn').addEventListener('click', function() {
  const win = window.open('about:blank', '_blank');
  
  // Replace the URL below with your actual Replit/Proxy URL
  const myProxyURL = "https://replit.app";

  const proxyContent = `
    <html>
    <head>
      <title>My Drive - Google Drive</title>
      <link rel="icon" type="image/x-icon" href="https://gstatic.com">
      <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body>
      <iframe src="${myProxyURL}"></iframe>
    </body>
    </html>`;

  win.document.open();
  win.document.write(proxyContent);
  win.document.close();
});
