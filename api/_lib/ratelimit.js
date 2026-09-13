// Fixed-window rate limiter, 30 uploads per hour per token.
//
// KNOWN LIMITATION on serverless: this counter lives in the module scope of a
// single warm instance. Vercel may run several instances concurrently, and a
// cold start resets the window, so the effective ceiling is
// "30 per hour per warm instance" rather than a strict global 30. It stops a
// runaway loop, which is what it is for here; it is not a defence against a
// determined attacker holding a valid token. Moving the counter to Vercel KV
// or Upstash would make it exact.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 30;

const buckets = new Map();

/**
 * @param {string} key  caller identity (a hash of the bearer token, or an IP
 *                      hash for the public forms)
 * @param {{max?: number, windowMs?: number}} [options]
 *                      the public forms want a tighter window than uploads do;
 *                      omitting this keeps the original 30-per-hour behaviour
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
export function consume(key, options = {}) {
  const max = options.max ?? MAX_REQUESTS;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test hook. */
export function reset() {
  buckets.clear();
}

export { MAX_REQUESTS, WINDOW_MS };
