#!/usr/bin/env node
/** Tiny static file server for local preview. Node built-ins only. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let full = path.join(ROOT, p);
    if (!full.startsWith(ROOT)) throw Object.assign(new Error('forbidden'), { code: 403 });
    let s = await stat(full).catch(() => null);
    if (s?.isDirectory()) {
      full = path.join(full, 'index.html');
      s = await stat(full).catch(() => null);
    }
    if (!s) {
      const nf = await readFile(path.join(ROOT, '404.html')).catch(() => Buffer.from('404'));
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(nf);
    }
    const body = await readFile(full);
    res.writeHead(200, {
      'content-type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(e.code === 403 ? 403 : 500, { 'content-type': 'text/plain' });
    res.end(String(e.message));
  }
}).listen(PORT, () => console.log(`GTA Hub preview → http://localhost:${PORT}/`));
