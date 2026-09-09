// Every response from the media API is JSON, on every path including errors.
// An HTML error page breaks the calling agent, so nothing here ever falls
// through to a framework error page.

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, ...extraHeaders },
  });
}

export function noContent() {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export const unauthorized = () => json({ error: 'unauthorized' }, 401);

export const badRequest = (detail) =>
  json({ error: 'bad_request', detail }, 400);

export const tooLarge = (maxBytes) =>
  json({ error: 'file_too_large', maxBytes }, 413);

export const unsupportedType = (allowed) =>
  json({ error: 'unsupported_type', allowed }, 415);

export const rateLimited = (retryAfterSeconds) =>
  json({ error: 'rate_limited', retryAfterSeconds }, 429, {
    'Retry-After': String(retryAfterSeconds),
  });

export const methodNotAllowed = (allow) =>
  json({ error: 'method_not_allowed', allow }, 405, { Allow: allow.join(', ') });

export const serverError = (detail) =>
  json({ error: 'server_error', detail }, 500);
