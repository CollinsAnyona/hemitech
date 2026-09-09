// Signature shim.
//
// Vercel's Node runtime has historically invoked handlers as (req, res) with
// Node's IncomingMessage/ServerResponse, and more recently also supports the
// Web-standard (Request) => Response form. Rather than bet on one, every route
// goes through this adapter: the handlers are written once against Web
// standards, and this converts whichever calling convention shows up.

import { Readable } from 'node:stream';

const isWebRequest = (value) =>
  typeof value === 'object' &&
  value !== null &&
  typeof value.headers?.get === 'function' &&
  typeof value.url === 'string' &&
  typeof value.method === 'string';

function nodeToWebRequest(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((item) => headers.append(k, item));
    else headers.set(k, String(v));
  }

  const method = (req.method || 'GET').toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);

  return new Request(url, {
    method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: 'half',
  });
}

async function writeWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  if (!webRes.body) return res.end();
  const buf = Buffer.from(await webRes.arrayBuffer());
  return res.end(buf);
}

/**
 * Wrap a Web-standard handler so it can be exported from an api/ route
 * regardless of which signature Vercel uses to call it.
 *
 * @param {(request: Request) => Promise<Response>} handler
 */
export function adapt(handler) {
  return async function route(a, b) {
    if (isWebRequest(a)) {
      // Web signature: return the Response directly.
      return handler(a);
    }
    // Node signature: (req, res).
    const webRes = await handler(nodeToWebRequest(a));
    return writeWebResponse(webRes, b);
  };
}

/** Last path segment of a request URL, decoded. */
export function lastPathSegment(request) {
  const { pathname } = new URL(request.url);
  const raw = pathname.split('/').filter(Boolean).pop() || '';
  return raw;
}
