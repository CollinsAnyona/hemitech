// Retention: actually deleting the submissions we said we would delete.
//
// The privacy notice states a period, and a retention policy that is only
// written down is not a retention policy — particularly on a site that sells
// data-protection work. This is the part that runs.
//
// Submissions are stored at "<prefix>/<kind>/<YYYY-MM-DD>/<uuid>.json", so the
// cut-off is decided from the path and nothing has to be opened or decrypted
// to know whether it is due.

import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Keep in step with SITE.retention in build/site.js. */
export const RETENTION_MONTHS = Number(process.env.RETENTION_MONTHS || 24);

const SUBMISSION_DIR = process.env.SUBMISSIONS_DIR
  ? path.resolve(process.env.SUBMISSIONS_DIR)
  : path.resolve(process.cwd(), '.submissions');

const PREFIX = (process.env.SUBMISSIONS_PREFIX || 'submissions').replace(/^\/+|\/+$/g, '');

function backend() {
  const explicit = (process.env.SUBMISSIONS_STORAGE || '').toLowerCase();
  if (explicit === 'fs' || explicit === 'blob') return explicit;
  return process.env.VERCEL ? 'blob' : 'fs';
}

/** The oldest date we are allowed to still be holding, as YYYY-MM-DD. */
export function cutoff(now = new Date(), months = RETENTION_MONTHS) {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

/** "submissions/contact/2024-01-05/uuid.json" -> "2024-01-05" */
export function dateFromPath(pathname) {
  const match = /(\d{4}-\d{2}-\d{2})\//.exec(pathname);
  return match ? match[1] : null;
}

async function sweepBlob(before, dryRun) {
  const { list, del } = await import('@vercel/blob');
  const due = [];
  let cursor;

  do {
    const page = await list({ prefix: `${PREFIX}/`, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const day = dateFromPath(blob.pathname);
      if (day && day < before) due.push(blob.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  if (!dryRun && due.length) {
    // del accepts a batch; chunk it so one very large sweep does not send a
    // single enormous request.
    for (let i = 0; i < due.length; i += 100) {
      await del(due.slice(i, i + 100));
    }
  }

  return due.length;
}

async function sweepFs(before, dryRun) {
  let deleted = 0;

  let kinds;
  try {
    kinds = await fs.readdir(SUBMISSION_DIR, { withFileTypes: true });
  } catch {
    return 0; // nothing stored yet
  }

  for (const kind of kinds) {
    if (!kind.isDirectory()) continue;
    const kindDir = path.join(SUBMISSION_DIR, kind.name);

    for (const day of await fs.readdir(kindDir, { withFileTypes: true })) {
      if (!day.isDirectory() || day.name >= before) continue;
      const dayDir = path.join(kindDir, day.name);
      const files = await fs.readdir(dayDir);
      deleted += files.length;
      if (!dryRun) await fs.rm(dayDir, { recursive: true, force: true });
    }
  }

  return deleted;
}

/**
 * Delete every submission older than the retention period.
 *
 * @param {{now?: Date, dryRun?: boolean}} options
 * @returns {Promise<{deleted: number, before: string, months: number, dryRun: boolean}>}
 */
export async function sweepSubmissions({ now = new Date(), dryRun = false } = {}) {
  const before = cutoff(now);
  const deleted = backend() === 'blob' ? await sweepBlob(before, dryRun) : await sweepFs(before, dryRun);
  return { deleted, before, months: RETENTION_MONTHS, dryRun };
}
