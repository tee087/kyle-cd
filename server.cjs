const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const ROOT_DIR = __dirname;

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  
  if (urlPath === '' || urlPath === '/') {
    urlPath = 'index.html';
  }
  
  const distPath = path.join(DIST_DIR, urlPath);
  const rootPath = path.join(ROOT_DIR, urlPath);
  
  let filePath = fs.existsSync(distPath) ? distPath : rootPath;
  
  if (!filePath.startsWith(ROOT_DIR) || !fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
  };
  
  serveStatic(res, filePath, types[ext] || 'application/octet-stream');
});

server.listen(PORT, () => {
  const mode = fs.existsSync(DIST_DIR) ? 'production (dist/)' : 'development (root/)';
  console.log(`Server running at http://localhost:${PORT}/ [${mode}]`);
});