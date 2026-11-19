import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };

// Same-origin browser preview without changing the mobile API or enabling broad CORS.
export function createPreview(apiUrl) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const body = [];
        for await (const chunk of req) body.push(chunk);
        const response = await fetch(`${apiUrl}${url.pathname.slice(4)}${url.search}`, {
          method: req.method,
          headers: { Accept: 'application/json', ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}), ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}) },
          body: body.length ? Buffer.concat(body) : undefined,
          signal: AbortSignal.timeout(15000),
        });
        res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json' });
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }
      const file = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(resolve(root) + sep)) { res.writeHead(403); res.end(); return; }
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
      res.end(content);
    } catch (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Não foi possível conectar ao servidor.' }));
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PREVIEW_PORT || 8081);
  createPreview(process.env.API_URL || 'http://127.0.0.1:3000').listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
}
