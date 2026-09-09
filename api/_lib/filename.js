import { EXTENSION_FOR } from './filetype.js';

const MAX_LENGTH = 100;

/**
 * Reduce any caller-supplied name to a safe flat filename.
 *
 * Deliberately aggressive: the result can only ever match [a-z0-9._-]+, so it
 * cannot contain a path separator, a drive letter, a NUL, or a traversal
 * segment. Only the last path-ish segment is kept, so "../../../etc/passwd"
 * collapses to "passwd.png", which lands inside the media directory like any
 * other upload.
 *
 * @param {string|null|undefined} raw   caller's preferred name, may be absent
 * @param {string} detectedType         MIME type from the file's magic bytes
 * @returns {string} a safe "<stem>.<ext>" filename
 */
export function safeFilename(raw, detectedType) {
  const ext = EXTENSION_FOR[detectedType];
  if (!ext) throw new Error(`no extension mapping for ${detectedType}`);

  let stem = '';

  if (typeof raw === 'string' && raw.trim()) {
    // Take the last path-ish segment before sanitising, so "a/b/c.png" reads
    // as "c.png" rather than "a-b-c.png".
    const lastSegment = raw.split(/[\\/]+/).pop() || '';
    stem = lastSegment
      .normalize('NFKD')
      .toLowerCase()
      // drop the extension; the real one is appended from the detected type
      .replace(/\.[a-z0-9]{1,10}$/, '')
      .replace(/[^a-z0-9._-]+/g, '-')  // everything else becomes a hyphen
      .replace(/\.{2,}/g, '.')          // no ".." can survive
      .replace(/^[.\-_]+|[.\-_]+$/g, '') // no leading/trailing dots or dashes
      .replace(/-{2,}/g, '-');
  }

  if (!stem) {
    stem = `upload-${Date.now().toString(36)}`;
  }

  // Cap the whole filename, not just the stem.
  const budget = MAX_LENGTH - (ext.length + 1);
  if (stem.length > budget) stem = stem.slice(0, budget).replace(/[.\-_]+$/, '');
  if (!stem) stem = 'upload';

  return `${stem}.${ext}`;
}

/**
 * Validate a filename arriving in a URL path (the DELETE route). Anything that
 * is not already in canonical safe form is rejected rather than repaired, so a
 * traversal attempt can never resolve to a real object.
 *
 * @returns {string|null} the filename, or null if it is not acceptable
 */
export function validatePathFilename(raw) {
  if (typeof raw !== 'string') return null;
  let name;
  try {
    name = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (name.length === 0 || name.length > MAX_LENGTH) return null;
  if (!/^[a-z0-9._-]+$/.test(name)) return null;
  if (name.includes('..')) return null;
  if (name.startsWith('.') || name.endsWith('.')) return null;
  if (!/\.[a-z0-9]{1,10}$/.test(name)) return null;
  return name;
}

/**
 * Given a taken filename, produce the next candidate: "clip.mp4" -> "clip-2.mp4".
 * Collisions append a suffix rather than overwriting.
 */
export function nextCandidate(filename, attempt) {
  const dot = filename.lastIndexOf('.');
  const stem = filename.slice(0, dot);
  const ext = filename.slice(dot + 1);
  return `${stem}-${attempt}.${ext}`;
}
