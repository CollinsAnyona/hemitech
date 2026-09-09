import { timingSafeEqual } from 'node:crypto';

// Constant-time bearer check.
//
// timingSafeEqual throws if the two buffers differ in length, and the length
// itself leaks through that throw, so both sides are hashed to a fixed width
// first. Comparing digests keeps the comparison constant-time regardless of
// how long the supplied token is.
import { createHash } from 'node:crypto';

const digest = (value) => createHash('sha256').update(value, 'utf8').digest();

/**
 * @returns {boolean} true only when a correct bearer token was presented.
 *   If MEDIA_UPLOAD_TOKEN is unset the answer is always false — there is
 *   deliberately no open fallback.
 */
export function isAuthorised(request) {
  const expected = process.env.MEDIA_UPLOAD_TOKEN;
  if (!expected) return false;

  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;

  return timingSafeEqual(digest(match[1]), digest(expected));
}

/**
 * Vercel Cron invokes a route with `Authorization: Bearer $CRON_SECRET`, so
 * the sweep accepts that as well as the upload token. Same constant-time
 * comparison, and the same refusal to fall back to open access.
 *
 * @returns {boolean}
 */
export function isCron(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;

  return timingSafeEqual(digest(match[1]), digest(expected));
}

/** The token itself, used only as a rate-limit bucket key. Never logged. */
export function tokenFingerprint(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return 'anonymous';
  return createHash('sha256').update(match[1], 'utf8').digest('hex').slice(0, 16);
}
