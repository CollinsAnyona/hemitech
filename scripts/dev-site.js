// A local static server that behaves like the Vercel config: clean URLs, the
// same headers, and the 404 page for anything unmatched. Development and the
// acceptance run only — it is not deployed.
//
//   node scripts/dev-site.js [port]

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || 8787);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const REDIRECTS = new Map([
  ['/services', '/capabilities'],
  ['/privacy-policy', '/privacy'],
  ['/cookie-policy', '/privacy'],
  ['/careers', '/about'],
]);

async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates =
    clean === '/' || clean === '\\'
      ? ['index.html']
      : [clean.replace(/^[/\\]/, ''), clean.replace(/^[/\\]/, '') + '.html', join(clean.replace(/^[/\\]/, ''), 'index.html')];

  for (const candidate of candidates) {
    const file = join(ROOT, candidate);
    if (!file.startsWith(ROOT)) continue;
    try {
      const info = await stat(file);
      if (info.isFile()) return { file, size: info.size };
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (REDIRECTS.has(pathname)) {
    res.writeHead(308, { Location: REDIRECTS.get(pathname) });
    return res.end();
  }

  // Clean URLs: /audit.html redirects to /audit.
  if (pathname.endsWith('.html') && pathname !== '/404.html') {
    res.writeHead(308, { Location: pathname.replace(/\.html$/, '') });
    return res.end();
  }

  const found = await resolve(pathname);
  const target = found || (await resolve('/404.html'));
  const type = TYPES[extname(target.file).toLowerCase()] || 'application/octet-stream';

  res.writeHead(found ? 200 : 404, {
    'Content-Type': type,
    'Content-Length': target.size,
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
      "font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(target.file).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`hemitech.co.ke preview on http://127.0.0.1:${PORT}`);
});
