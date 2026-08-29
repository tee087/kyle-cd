const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const requested = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.resolve(__dirname, requested);
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
  let content = fs.readFileSync(file);
  if (requested === 'index.html') {
    content = content.toString().replace('</head>', '<style>html,body{height:auto;min-height:100%;overflow-x:hidden;overflow-y:auto}.dp-root{min-height:100vh}</style></head>');
  }
  res.end(content);
});
server.listen(3000);
console.log('Server running at http://localhost:3000/');