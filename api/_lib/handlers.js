import { isAuthorised, isCron, tokenFingerprint } from './auth.js';
import { consume } from './ratelimit.js';
import { detectType, looksLikeMarkup, ALLOWED_TYPES } from './filetype.js';
import { safeFilename, validatePathFilename, nextCandidate } from './filename.js';
import { storage, plannedPublicUrl } from './storage.js';
import { mintUploadCredential } from './clienttoken.js';
import {
  json, noContent, unauthorized, badRequest, tooLarge,
  unsupportedType, rateLimited, methodNotAllowed, serverError,
} from './respond.js';

export const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

/* --------------------------------------------------------------- upload --- */

export async function handleUpload(request) {
  if (!isAuthorised(request)) return unauthorized();

  const { allowed, retryAfterSeconds } = consume(tokenFingerprint(request));
  if (!allowed) return rateLimited(retryAfterSeconds);

  // Refuse from the declared length before buffering anything. The slack
  // covers multipart framing only (a single part costs a couple of hundred
  // bytes), so this is tight on purpose: reading 200 MB into a function's
  // heap just to reject it is how a memory limit gets hit instead of a size
  // limit. The authoritative check is still on the real buffer below.
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared && declared > MAX_BYTES + 64 * 1024) return tooLarge(MAX_BYTES);

  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest('body must be multipart/form-data');
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return badRequest('missing file field');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return badRequest('file is empty');
  if (buffer.length > MAX_BYTES) return tooLarge(MAX_BYTES);

  // The bytes decide the type. The client's Content-Type and the extension are
  // both ignored for this purpose.
  const contentType = detectType(buffer);
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return unsupportedType(ALLOWED_TYPES);
  }

  const preferred = form.get('name');
  let filename;
  try {
    filename = safeFilename(typeof preferred === 'string' ? preferred : file.name, contentType);
  } catch (err) {
    return badRequest(String(err.message || err));
  }

  // Never overwrite: walk to the next free "-2", "-3", ... candidate.
  try {
    let candidate = filename;
    for (let attempt = 2; attempt < 100 && await storage.exists(candidate); attempt += 1) {
      candidate = nextCandidate(filename, attempt);
    }
    if (await storage.exists(candidate)) {
      return serverError('could not find a free filename');
    }
    const stored = await storage.put(candidate, buffer, contentType);
    return json(stored, 201);
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/* ----------------------------------------------- client upload: step 1 --- */

/**
 * POST /api/media/upload-token
 *
 * Reject before any bytes move. Everything checkable from the declaration is
 * checked here, because after this point the file is being written to a
 * permanent public URL by a caller we are no longer in the path of.
 */
export async function handleUploadToken(request) {
  if (!isAuthorised(request)) return unauthorized();

  // The token route mints write credentials, so it is now the cheap path to a
  // write and gets the same ceiling as the upload route itself.
  const { allowed, retryAfterSeconds } = consume(tokenFingerprint(request));
  if (!allowed) return rateLimited(retryAfterSeconds);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return badRequest('body must be application/json');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequest('body must be a JSON object');
  }

  const { name, contentType, bytes } = payload;

  if (typeof name !== 'string' || !name.trim()) return badRequest('name is required');
  if (typeof contentType !== 'string' || !contentType) return badRequest('contentType is required');
  if (bytes === undefined || bytes === null) return badRequest('bytes is required');
  if (typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes <= 0) {
    return badRequest('bytes must be a positive integer');
  }

  // Size and type first: they are the cheapest rejections and the ones a
  // caller is most likely to get wrong.
  if (bytes > MAX_BYTES) return tooLarge(MAX_BYTES);
  if (!ALLOWED_TYPES.includes(contentType)) return unsupportedType(ALLOWED_TYPES);

  // Same sanitiser as the server route, and the extension comes from the
  // declared type rather than from anything the caller wrote.
  let filename;
  try {
    filename = safeFilename(name, contentType);
  } catch (err) {
    return badRequest(String(err.message || err));
  }
  if (!validatePathFilename(filename)) return badRequest('name sanitises to nothing usable');

  try {
    // Same collision policy as the server route: never overwrite.
    let candidate = filename;
    for (let attempt = 2; attempt < 100 && await isTaken(candidate); attempt += 1) {
      candidate = nextCandidate(filename, attempt);
    }
    if (await isTaken(candidate)) return serverError('could not find a free filename');
    filename = candidate;

    const { upload, expiresAt } = await mintUploadCredential({
      filename,
      contentType,
      maxBytes: MAX_BYTES,
    });

    // Record the declaration so the verify step has something to check the
    // stored object against, and so the sweep can find an abandoned upload.
    await storage.putPending(filename, {
      filename,
      declaredBytes: bytes,
      declaredContentType: contentType,
      issuedAt: new Date().toISOString(),
      expiresAt,
    });

    const url = plannedPublicUrl(filename);
    if (!url) {
      return serverError(
        'MEDIA_PUBLIC_BASE must be set for client uploads, otherwise the '
        + 'promised url cannot be known before the object exists',
      );
    }

    return json({ filename, url, expiresAt, upload }, 201);
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/** A name is taken if a file or an outstanding reservation holds it. */
async function isTaken(filename) {
  if (await storage.exists(filename)) return true;
  return Boolean(await storage.getPending(filename));
}

/* ----------------------------------------------- client upload: step 3 --- */

const MAGIC_BYTES_LENGTH = 4096;

/**
 * POST /api/media/verify
 *
 * The bytes bypassed every check in handleUpload, so this does that work
 * after the fact and deletes anything that fails. An unverified blob is never
 * treated as published.
 */
export async function handleVerify(request) {
  if (!isAuthorised(request)) return unauthorized();

  let payload;
  try {
    payload = await request.json();
  } catch {
    return badRequest('body must be application/json');
  }

  const filename = validatePathFilename(payload?.filename);
  if (!filename) return badRequest('invalid filename');

  try {
    const pending = await storage.getPending(filename);
    const meta = await storage.head(filename);

    // 1. Nothing there.
    if (!meta) {
      if (pending) await storage.delPending(filename);
      return json({ error: 'not_found' }, 404);
    }

    // Already verified, or written through the server route, which validated
    // inline. Idempotent so a retrying agent is not punished.
    if (!pending) {
      return json({
        url: meta.url, filename, contentType: meta.contentType, bytes: meta.bytes,
      }, 200);
    }

    // 2. Size, against the cap and against what was declared.
    if (meta.bytes > MAX_BYTES) {
      await discard(filename);
      return tooLarge(MAX_BYTES);
    }
    const declared = Number(pending.declaredBytes);
    const drift = Math.abs(meta.bytes - declared);
    const tolerance = Math.max(1024, Math.floor(declared * 0.01));
    if (drift > tolerance) {
      await discard(filename);
      return badRequest(
        `stored size ${meta.bytes} differs materially from the declared ${declared}`,
      );
    }

    // 3. Magic bytes. This is the check the client upload skipped entirely.
    const head = await storage.readRange(filename, MAGIC_BYTES_LENGTH);
    if (!head || head.length === 0) {
      await discard(filename);
      return badRequest('stored object could not be read back for verification');
    }

    if (looksLikeMarkup(head)) {
      await discard(filename);
      return unsupportedType(ALLOWED_TYPES);
    }

    const detected = detectType(head);
    if (!detected || !ALLOWED_TYPES.includes(detected)) {
      await discard(filename);
      return unsupportedType(ALLOWED_TYPES);
    }
    if (detected !== pending.declaredContentType) {
      await discard(filename);
      return unsupportedType(ALLOWED_TYPES);
    }

    // 4. The stored header must state the real type, or the file goes.
    let contentType = meta.contentType;
    if (contentType !== detected) {
      const fixed = await storage.fixContentType(filename, detected);
      if (!fixed) {
        await discard(filename);
        return unsupportedType(ALLOWED_TYPES);
      }
      contentType = detected;
    }

    // Clearing the reservation is what marks it published.
    await storage.delPending(filename);

    return json({
      url: meta.url, filename, contentType, bytes: meta.bytes,
    }, 200);
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/** Remove a failed upload and its reservation. Order matters: drop the object
 *  first, so a crash mid-way leaves a reservation the sweep will collect
 *  rather than an unreferenced public file. */
async function discard(filename) {
  await storage.del(filename);
  await storage.delPending(filename);
}

/* ------------------------------------------------------------- sweep ----- */

export const SWEEP_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Delete anything still unverified 24 hours after its token was issued.
 * Abandoned half-uploads sitting on a public URL are exactly the loose end
 * that becomes a problem months later.
 *
 * Vercel Cron issues a GET and cannot present MEDIA_UPLOAD_TOKEN, so
 * CRON_SECRET is accepted here as well.
 */
export async function handleSweep(request) {
  if (!isAuthorised(request) && !isCron(request)) return unauthorized();

  try {
    const now = Date.now();
    const deleted = [];
    const kept = [];

    for (const record of await storage.listPending()) {
      const filename = record?.filename;
      if (!filename || !validatePathFilename(filename)) continue;

      const issued = Date.parse(record.issuedAt || '');
      const age = Number.isFinite(issued) ? now - issued : Infinity;

      if (age > SWEEP_AFTER_MS) {
        await discard(filename);
        deleted.push(filename);
      } else {
        kept.push(filename);
      }
    }

    return json({ deleted, stillPending: kept, sweptAt: new Date(now).toISOString() }, 200);
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/* ----------------------------------------------------------------- list --- */

export async function handleList(request) {
  if (!isAuthorised(request)) return unauthorized();
  try {
    const files = await storage.list();
    const pending = new Set((await storage.listPending()).map((r) => r?.filename));
    // An unverified object exists but is not published. Say so explicitly
    // rather than leaving the caller to assume everything listed is live.
    return json({
      files: files.map((f) => ({ ...f, verified: !pending.has(f.filename) })),
    }, 200);
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/* --------------------------------------------------------------- delete --- */

export async function handleDelete(request, rawFilename) {
  if (!isAuthorised(request)) return unauthorized();

  const filename = validatePathFilename(rawFilename);
  if (!filename) return badRequest('invalid filename');

  try {
    await storage.del(filename); // idempotent by contract
    return noContent();
  } catch (err) {
    return serverError(String(err?.message || err));
  }
}

/* -------------------------------------------------------------- routing --- */

/** /api/media  -> POST (upload) | GET (list) */
export async function collectionRoute(request) {
  switch (request.method) {
    case 'POST': return handleUpload(request);
    case 'GET': return handleList(request);
    default: return methodNotAllowed(['GET', 'POST']);
  }
}

/** /api/media/<filename>  -> DELETE */
export async function itemRoute(request, filename) {
  if (request.method !== 'DELETE') return methodNotAllowed(['DELETE']);
  return handleDelete(request, filename);
}

/** /api/media/upload-token  -> POST */
export async function uploadTokenRoute(request) {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  return handleUploadToken(request);
}

/** /api/media/verify  -> POST */
export async function verifyRoute(request) {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  return handleVerify(request);
}

/** /api/media/sweep  -> GET (Vercel Cron) | POST (manual) */
export async function sweepRoute(request) {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed(['GET', 'POST']);
  return handleSweep(request);
}
