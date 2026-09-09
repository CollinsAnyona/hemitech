// Type detection from magic bytes.
//
// The client-supplied Content-Type and the filename extension are both
// attacker-controlled, so neither is trusted. Everything served out of
// /media is typed from what the bytes actually are.

export const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
];

export const EXTENSION_FOR = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

// Extensions accepted on the way in, mapped to their canonical type. Used only
// to check that a caller-supplied name is not lying about a file we allow;
// the detected type always wins.
export const TYPE_FOR_EXTENSION = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};

const startsWith = (buf, bytes, offset = 0) =>
  bytes.every((b, i) => buf[offset + i] === b);

/**
 * Positive detection of script-carrying markup.
 *
 * `detectType` already returns null for HTML and SVG, so the whitelist alone
 * keeps them out. This exists for the client-upload verify step, where bytes
 * arrive without having passed through the upload handler: it lets the
 * rejection say *why* rather than just "unrecognised", which matters when the
 * file is already sitting at a public URL and has to be deleted.
 *
 * @param {Buffer|Uint8Array} buf first bytes of the file
 * @returns {boolean}
 */
export function looksLikeMarkup(buf) {
  if (!buf || buf.length === 0) return false;
  // Skip a UTF-8 BOM and any leading whitespace before sniffing.
  let start = 0;
  if (buf.length > 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) start = 3;
  const head = Buffer.from(buf.subarray(start, start + 1024))
    .toString('latin1')
    .trimStart()
    .toLowerCase();
  return (
    head.startsWith('<?xml') ||
    head.startsWith('<!doctype') ||
    head.startsWith('<html') ||
    head.startsWith('<svg') ||
    head.includes('<script')
  );
}

const ascii = (buf, offset, length) =>
  Buffer.from(buf.subarray(offset, offset + length)).toString('latin1');

/**
 * @param {Buffer|Uint8Array} buf first bytes of the file (>= 16 recommended)
 * @returns {string|null} a MIME type from ALLOWED_TYPES, or null if unknown
 */
export function detectType(buf) {
  if (!buf || buf.length < 12) return null;

  // PNG  89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  // JPEG  FF D8 FF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  // GIF  "GIF87a" / "GIF89a"
  if (ascii(buf, 0, 6) === 'GIF87a' || ascii(buf, 0, 6) === 'GIF89a') {
    return 'image/gif';
  }

  // WEBP  "RIFF" ....size.... "WEBP"
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WEBP') {
    return 'image/webp';
  }

  // PDF  "%PDF-"
  if (ascii(buf, 0, 5) === '%PDF-') return 'application/pdf';

  // ISO base media (MP4 / MOV): box size, then "ftyp", then a brand.
  if (ascii(buf, 4, 4) === 'ftyp') {
    const brand = ascii(buf, 8, 4);
    if (brand === 'qt  ') return 'video/quicktime';
    const mp4Brands = [
      'isom', 'iso2', 'iso4', 'iso5', 'iso6',
      'mp41', 'mp42', 'avc1', 'dash', 'mmp4', 'M4V ', 'M4VP',
    ];
    if (mp4Brands.includes(brand)) return 'video/mp4';
    // Unrecognised brand: treat as mp4 only if the brand looks like a
    // printable four-char code, otherwise reject.
    if (/^[\x20-\x7e]{4}$/.test(brand)) return 'video/mp4';
  }

  // Older QuickTime files lead with a top-level atom rather than ftyp.
  const atom = ascii(buf, 4, 4);
  if (atom === 'moov' || atom === 'mdat' || atom === 'free' || atom === 'wide') {
    return 'video/quicktime';
  }

  return null;
}
