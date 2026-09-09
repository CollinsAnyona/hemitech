// Local development server.
//
// Vercel provides the HTTP layer in production; this reproduces just enough of
// it to run the API and serve /media locally, so the acceptance tests exercise
// the real handlers rather than a mock. Not used in production.

import http from 'node:http';
import { Readable } from 'node:stream';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import {
  collectionRoute, itemRoute, uploadTokenRoute, verifyRoute, sweepRoute,
} from '../api/_lib/handlers.js';
import { MEDIA_DIR, fsWriteDirect, PREFIX } from '../api/_lib/storage.js';
import { verifyLocalToken } from '../api/_lib/clienttoken.js';
import { reset as resetRateLimit } from '../api/_lib/ratelimit.js';

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(process.cwd());

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function toWebRequest(req) {
  const url = `http://${req.headers.host || `localhost:${PORT}`}${req.url}`;
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: 'half',
  });
}

async function sendWebResponse(res, webRes) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  const body = webRes.body ? Buffer.from(await webRes.arrayBuffer()) : null;
  res.end(body ?? undefined);
}

// GET|HEAD /media/<filename> — public, unauthenticated, correct type.
async function serveMedia(req, res, filename) {
  // Reject anything that is not a flat safe name before touching the disk.
  if (!/^[a-z0-9._-]+$/.test(filename) || filename.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'bad_request', detail: 'invalid filename' }));
  }
  const file = path.join(MEDIA_DIR, filename);
  if (path.dirname(path.resolve(file)) !== MEDIA_DIR) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'bad_request', detail: 'invalid path' }));
  }

  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'not_found' }));
  }

  let contentType = STATIC_TYPES[path.extname(filename).toLowerCase()];
  try {
    const meta = JSON.parse(await fs.readFile(`${file}.meta.json`, 'utf8'));
    if (meta.contentType) contentType = meta.contentType;
  } catch { /* sidecar optional */ }

  res.writeHead(200, {
    'Content-Type': contentType || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  return createReadStream(file).pipe(res);
}

async function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) throw new Error('dir');
    res.writeHead(200, {
      'Content-Type': STATIC_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
    });
    if (req.method === 'HEAD') return res.end();
    return createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('not found');
  }
}

/**
 * Stand-in for Vercel Blob's client-upload endpoint.
 *
 * Vercel Blob enforces the token's constraints service-side; nothing local
 * does, so this reproduces that enforcement. Without it the acceptance tests
 * could only prove we *mint* a constrained token, not that the constraints
 * bite -- and the constraints are the entire security argument for handing an
 * upload credential to an outside caller.
 *
 * Reachable only in fs mode. Production never routes here.
 */
async function serveBlobStandIn(req, res, url) {
  const reply = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };

  if (req.method !== 'PUT') return reply(405, { error: 'method_not_allowed' });

  const match = /^Bearer\s+(.+)$/i.exec((req.headers.authorization || '').trim());
  const payload = match ? verifyLocalToken(match[1]) : null;
  if (!payload) return reply(401, { error: 'unauthorized', detail: 'bad client token' });

  if (Date.now() > Number(payload.validUntil)) {
    return reply(401, { error: 'unauthorized', detail: 'client token expired' });
  }

  // One token, one path.
  const pathname = url.searchParams.get('pathname');
  if (!pathname || pathname !== payload.pathname) {
    return reply(403, { error: 'forbidden', detail: 'pathname does not match the token' });
  }

  const declaredType = req.headers['x-content-type'];
  if (!payload.allowedContentTypes?.includes(declaredType)) {
    return reply(415, { error: 'unsupported_type', detail: 'content type not allowed by the token' });
  }

  const chunks = [];
  let total = 0;
  let aborted = false;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > Number(payload.maximumSizeInBytes)) {
      aborted = true;
      break;
    }
    chunks.push(chunk);
  }
  if (aborted) return reply(413, { error: 'file_too_large' });
  if (total === 0) return reply(400, { error: 'bad_request', detail: 'empty body' });

  const filename = pathname.replace(new RegExp(`^${PREFIX}/`), '');
  // Deliberately no validation of the bytes here: mirroring reality, the
  // storage service stores what it is given. /api/media/verify is what
  // catches a lie, which is exactly the gap the verify step exists to close.
  const stored = await fsWriteDirect(filename, Buffer.concat(chunks), declaredType);

  return reply(200, {
    url: stored.url,
    downloadUrl: stored.url,
    pathname,
    contentType: declaredType,
    contentDisposition: `inline; filename="${filename}"`,
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

    // Test-only hook. The rate limiter is deliberately a real 30/hour ceiling,
    // which the acceptance suite would otherwise exhaust partway through and
    // then measure nothing but 429s. Lives here, in the dev server, so no
    // reset path exists in anything Vercel deploys.
    if (pathname === '/__reset-ratelimit__') {
      resetRateLimit();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ reset: true }));
    }
    if (pathname === '/__blob__') {
      return serveBlobStandIn(req, res, new URL(req.url, `http://localhost:${PORT}`));
    }
    if (pathname === '/api/media') {
      return sendWebResponse(res, await collectionRoute(toWebRequest(req)));
    }
    // Static sub-routes win over the dynamic <filename> route, matching how
    // Vercel resolves api/media/verify.js ahead of api/media/[filename].js.
    if (pathname === '/api/media/upload-token') {
      return sendWebResponse(res, await uploadTokenRoute(toWebRequest(req)));
    }
    if (pathname === '/api/media/verify') {
      return sendWebResponse(res, await verifyRoute(toWebRequest(req)));
    }
    if (pathname === '/api/media/sweep') {
      return sendWebResponse(res, await sweepRoute(toWebRequest(req)));
    }
    if (pathname.startsWith('/api/media/')) {
      const filename = pathname.slice('/api/media/'.length);
      return sendWebResponse(res, await itemRoute(toWebRequest(req), filename));
    }
    if (pathname.startsWith('/media/')) {
      return serveMedia(req, res, decodeURIComponent(pathname.slice('/media/'.length)));
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server_error', detail: String(err?.message || err) }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`media dev server on http://localhost:${PORT}  (storage dir: ${MEDIA_DIR})`);
});
