// Prepare the real Hemi Tech logo for the web.
//
// The brand masters are large PNGs in OneDrive. This crops them to their
// content, produces a mark-only and a full-lockup version for light and dark
// grounds, and encodes AVIF with a WebP fallback at the sizes the site uses.
//
// The dark-ground master is supplied on a flat #1C2648 field. The site's navy
// is #02123C, so that field is keyed out rather than left as a visible
// rectangle sitting on a slightly different blue.
//
//   node scripts/build-logo.js

import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'Images', 'brand');

const MASTERS = process.env.LOGO_MASTERS || 'C:/Users/Admin/OneDrive/Projects/Hemi Tech';
const LIGHT_GROUND = join(MASTERS, 'HemiTech_Logo_3_Primary_Transparent.png');
const DARK_GROUND = join(MASTERS, 'HemiTech_Logo_4_DarkBackground.png');

// Measured from the masters: content sits at x 111-1383, y 110-522.
const CONTENT = { left: 111, top: 110, width: 1383 - 111 + 1, height: 522 - 110 + 1 };

// The mark cannot be cut out with a plain rectangle. Measured from the master:
// the H glyph's own right edge is x 373, its three squares occupy x 380-472 at
// y 110-212, and the wordmark's first stroke starts at x 429. Any crop wide
// enough to keep the squares also catches a sliver of the "H" in HEMI.
//
// So the crop keeps the squares, and everything to the right of the glyph
// below the squares is erased afterwards.
const MARK = { left: 111, top: 110, width: 478 - 111 + 1, height: 522 - 110 + 1 };
const MARK_ERASE = { fromX: 374 - MARK.left, fromY: 250 - MARK.top };

/** Clear everything below and right of the mark, i.e. the wordmark sliver. */
async function eraseWordmarkSliver(input) {
  const { data, info } = await sharp(await input.toBuffer()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let y = MARK_ERASE.fromY; y < info.height; y += 1) {
    for (let x = MARK_ERASE.fromX; x < info.width; x += 1) {
      out[(y * info.width + x) * info.channels + 3] = 0;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } }).png();
}

// The header needs the icon and wordmark at a height a nav bar can hold, but
// the full lockup's tagline ("BUILD | ANALYZE | TRANSFORM") and the rule
// under it are set small enough that they only read at the size the footer
// gives them — shrunk into a header bar they blur into noise rather than
// getting smaller and staying legible. So this crop keeps the icon and the
// wordmark and erases the tagline and rule rather than just scaling them
// down. Measured within the CONTENT crop (not the master): the icon's own
// ink never reaches past x 262 once past y 270 (its top, wider with the
// squares, stops at y 265, just under the wordmark's own baseline), and the
// tagline's first letter and the rule both start past x 300 - so the erase
// box (x >= 300, y >= 270) has clearance on both sides and touches neither.
const TAGLINE_ERASE = { fromX: 300, fromY: 270 };

// Once the tagline and rule are erased, the icon's own foot (the lowest ink
// left in the frame, at y 401) is the real bottom of the content — the crop
// height below is otherwise just the dead air the tagline used to fill. Trim
// to it (plus a few px of breathing room) so the compact lockup's own
// bounding box hugs its visible ink, the same way the full lockup's does.
const COMPACT_HEIGHT = 405;

/** Clear the tagline and its rule, keeping the icon and wordmark untouched. */
async function eraseTagline(input) {
  const { data, info } = await sharp(await input.toBuffer()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let y = TAGLINE_ERASE.fromY; y < info.height; y += 1) {
    for (let x = TAGLINE_ERASE.fromX; x < info.width; x += 1) {
      out[(y * info.width + x) * info.channels + 3] = 0;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .extract({ left: 0, top: 0, width: info.width, height: COMPACT_HEIGHT });
}

const KEY = { r: 28, g: 38, b: 72 };
const KEY_FLOOR = 10;   // at or below this distance the pixel is background
const KEY_CEIL = 44;    // at or above this distance the pixel is fully opaque

/** Key a flat background out to transparency, with a soft edge. */
async function keyOut(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += info.channels) {
    const d = Math.max(
      Math.abs(out[i] - KEY.r),
      Math.abs(out[i + 1] - KEY.g),
      Math.abs(out[i + 2] - KEY.b),
    );
    out[i + 3] = d <= KEY_FLOOR ? 0 : d >= KEY_CEIL ? 255 : Math.round(((d - KEY_FLOOR) / (KEY_CEIL - KEY_FLOOR)) * 255);
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } }).png();
}

async function emit(pipeline, name, widths) {
  const written = [];
  for (const w of widths) {
    for (const [ext, opts] of [['avif', { quality: 60, effort: 6 }], ['webp', { quality: 88 }]]) {
      const file = join(OUT, `${name}-${w}.${ext}`);
      await sharp(await pipeline.clone().toBuffer())
        .resize({ width: w })
        [ext](opts)
        .toFile(file);
      const { size } = await stat(file);
      written.push([`Images/brand/${name}-${w}.${ext}`, size]);
    }
  }
  return written;
}

async function main() {
  for (const f of [LIGHT_GROUND, DARK_GROUND]) {
    if (!existsSync(f)) throw new Error(`brand master not found: ${f}\nSet LOGO_MASTERS to the folder holding them.`);
  }
  await mkdir(OUT, { recursive: true });

  const light = sharp(LIGHT_GROUND);                 // navy artwork, transparent
  const dark = await keyOut(DARK_GROUND);            // white artwork, keyed

  const jobs = [
    [await eraseWordmarkSliver(light.clone().extract(MARK)), 'mark', [80, 160]],
    [light.clone().extract(CONTENT), 'lockup', [280, 560]],
    [await eraseTagline(light.clone().extract(CONTENT)), 'lockup-compact', [280, 560]],
    [await eraseWordmarkSliver(dark.clone().extract(MARK)), 'mark-light', [80, 160]],
    [dark.clone().extract(CONTENT), 'lockup-light', [280, 560]],
    [await eraseTagline(dark.clone().extract(CONTENT)), 'lockup-compact-light', [280, 560]],
  ];

  for (const [pipeline, name, widths] of jobs) {
    for (const [file, size] of await emit(pipeline, name, widths)) {
      console.log(`  ${String(Math.round(size / 1024)).padStart(3)} KB  ${file}`);
    }
  }

  // A reference PNG of each, for anyone who needs one outside the browser.
  await light.clone().extract(CONTENT).resize({ width: 560 }).png().toFile(join(OUT, 'lockup.png'));
  await dark.clone().extract(CONTENT).resize({ width: 560 }).png().toFile(join(OUT, 'lockup-light.png'));
  await (await eraseTagline(light.clone().extract(CONTENT))).resize({ width: 560 }).png().toFile(join(OUT, 'lockup-compact.png'));
  await (await eraseTagline(dark.clone().extract(CONTENT))).resize({ width: 560 }).png().toFile(join(OUT, 'lockup-compact-light.png'));
  console.log('\n  reference PNGs written alongside.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
