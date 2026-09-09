// Client-upload credentials.
//
// Vercel caps a function's request body at 4.5 MB, so bytes for anything
// larger cannot pass through POST /api/media. A client upload sends them
// straight to Blob storage instead, and this module mints the scoped,
// short-lived credential that authorises exactly one such write.
//
// The caller is an automated agent, so what it gets back is a replayable
// request description: method, url, headers. It should never have to know
// Blob's internals or compute a signature. If Vercel changes its client-upload
// mechanics, this file changes and the calling code does not.

import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { BACKEND } from './storage.js';

/** 30 minutes: long enough for 80 MB on a Nairobi connection, short enough
 *  that a leaked token is close to worthless. */
export const TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Blob's wire protocol, verified against @vercel/blob 0.27.3.
 *
 * Two details are easy to get wrong and worth stating plainly:
 *  - The pathname travels as a QUERY PARAMETER, not as a URL path segment.
 *    The endpoint is `/?pathname=media%2Ffile.mp4`, not `/media/file.mp4`.
 *  - `x-api-version` is required and version-pinned by the library.
 *
 * Both are read from the same environment variables the library itself
 * honours, so an override applies to us and to it identically.
 */
const BLOB_API_VERSION = process.env.VERCEL_BLOB_API_VERSION_OVERRIDE || '9';
const BLOB_API_BASE = process.env.VERCEL_BLOB_API_URL || 'https://blob.vercel-storage.com';

/* ------------------------------------------------------- local simulator --- */

// In fs mode there is no Blob service, so the dev server exposes a stand-in at
// /__blob__ and we sign tokens for it ourselves. This exists so the three-step
// flow is genuinely exercisable end to end without a Vercel account; it is
// never used when BACKEND is "blob".

const localSecret = () => process.env.MEDIA_UPLOAD_TOKEN || '';

const b64url = (value) =>
  Buffer.from(value, 'utf8').toString('base64url');

function signLocal(payloadJson) {
  return createHmac('sha256', localSecret()).update(payloadJson).digest('base64url');
}

function mintLocalToken(payload) {
  const json = JSON.stringify(payload);
  return `local_blob_client_${b64url(json)}.${signLocal(json)}`;
}

/**
 * Verify a locally-minted token and return its payload, or null.
 * Used only by the dev server's Blob stand-in.
 */
export function verifyLocalToken(token) {
  if (typeof token !== 'string') return null;
  const bare = token.replace(/^local_blob_client_/, '');
  const dot = bare.lastIndexOf('.');
  if (dot < 1) return null;

  const encoded = bare.slice(0, dot);
  const signature = bare.slice(dot + 1);

  let json;
  try {
    json = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  // Constant-time, and length-independent because both sides are hashed first.
  const expected = createHash('sha256').update(signLocal(json), 'utf8').digest();
  const supplied = createHash('sha256').update(signature, 'utf8').digest();
  if (!timingSafeEqual(expected, supplied)) return null;

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- minting ---- */

/**
 * Mint a credential authorising one client upload of one file.
 *
 * Every constraint is pinned into the token itself, which is what makes this
 * safe to hand out: the storage service enforces them, so a caller cannot
 * redirect the write elsewhere, exceed the cap, or change the type.
 *
 * @param {object} args
 * @param {string} args.filename       already sanitised, no path separators
 * @param {string} args.contentType    single whitelisted MIME type
 * @param {number} args.maxBytes       hard size ceiling
 * @param {number} args.cacheMaxAge    seconds, matched to the server route
 * @returns {Promise<{ upload: object, expiresAt: string }>}
 */
export async function mintUploadCredential({ filename, contentType, maxBytes, cacheMaxAge = 31536000 }) {
  const pathname = `media/${filename}`;
  const validUntil = Date.now() + TOKEN_TTL_MS;

  // One token, one path, one type. Never a prefix or a wildcard.
  const constraints = {
    pathname,
    allowedContentTypes: [contentType],
    maximumSizeInBytes: maxBytes,
    addRandomSuffix: false,
    validUntil,
    cacheControlMaxAge: cacheMaxAge,
  };

  let token;
  let endpoint;

  if (BACKEND === 'blob') {
    const { generateClientTokenFromReadWriteToken } = await import('@vercel/blob/client');
    const readWrite = process.env.BLOB_READ_WRITE_TOKEN;
    if (!readWrite) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
    token = await generateClientTokenFromReadWriteToken({ token: readWrite, ...constraints });
    endpoint = `${BLOB_API_BASE}/?pathname=${encodeURIComponent(pathname)}`;
  } else {
    token = mintLocalToken(constraints);
    const origin = (process.env.MEDIA_DEV_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');
    endpoint = `${origin}/__blob__?pathname=${encodeURIComponent(pathname)}`;
  }

  return {
    expiresAt: new Date(validUntil).toISOString(),
    upload: {
      method: 'PUT',
      url: endpoint,
      // Replay these verbatim, with the file as the raw request body and
      // nothing else. Do not add a Content-Type; the type travels in
      // x-content-type, and Blob rejects a mismatch against the token.
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': BLOB_API_VERSION,
        'x-content-type': contentType,
        'x-add-random-suffix': '0',
        'x-cache-control-max-age': String(cacheMaxAge),
      },
    },
  };
}
