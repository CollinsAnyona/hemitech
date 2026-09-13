// Capture the work screenshots and encode them for the web.
//
// BUILD-BRIEF §8: real screenshots of the real sites, at 1440x900 for desktop
// and 390x844 for mobile, AVIF with a WebP fallback, responsive at 480/960/
// 1440, and no more than 120 KB per image at the largest size.
//
// Whitecrest is deliberately absent: it is not cleared for publication.
//
//   node scripts/capture-shots.js [name ...]
//
// Needs Chrome. On Windows it is found at the usual install paths, or set
// CHROME_PATH. Anything that cannot be captured leaves its slot empty, and the
// page draws the device frame with a flat --tint fill instead of inventing a
// screenshot.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'Images', 'shots');
const TMP = join(ROOT, '.shots-tmp');

const WIDTHS = [480, 960, 1440];
const MAX_BYTES = 120 * 1024;

const TARGETS = [
  { name: 'joline-desktop', url: 'https://jolinegeoconsultants.org', width: 1440, height: 900 },
  { name: 'start-walking-desktop', url: 'https://startwalkingfoundation.org', width: 1440, height: 900 },
  // The Nyombo platform is private and has no public address to capture from.
  // Its slot stays empty until Collo supplies a URL or a capture.
  // { name: 'nyombo-mobile', url: '<URL NEEDED>', width: 390, height: 844 },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function chrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH.');
  return found;
}

async function capture(target) {
  const raw = join(TMP, `${target.name}.png`);
  // Captured taller than the frame, then cropped back to the frame's aspect
  // from the top. Consent banners and cookie bars sit at the bottom of the
  // viewport, and a portfolio shot of somebody else's cookie bar is not what
  // the card is for.
  await run(chrome(), [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--force-device-scale-factor=2',
    `--window-size=${target.width},${target.height + 320}`,
    `--screenshot=${raw}`,
    '--virtual-time-budget=8000',
    target.url,
  ], { timeout: 90_000 }).catch((err) => {
    // Chrome writes the file and still exits non-zero on unrelated device
    // warnings, so the file's existence is the real test.
    if (!existsSync(raw)) throw err;
  });

  if (!existsSync(raw)) throw new Error(`no screenshot produced for ${target.url}`);
  return raw;
}

async function encode(raw, target) {
  const written = [];

  // Crop back to the frame's aspect ratio, from the top of the page.
  const meta = await sharp(raw).metadata();
  const cropHeight = Math.min(meta.height, Math.round((target.height / target.width) * meta.width));
  const cropped = await sharp(raw).extract({ left: 0, top: 0, width: meta.width, height: cropHeight }).toBuffer();

  for (const width of WIDTHS) {
    if (width > target.width * 2) continue;
    const height = Math.round((width / target.width) * target.height);
    const base = sharp(cropped).resize(width, height, { fit: 'cover', position: 'top' });

    const avif = join(OUT, `${target.name}-${width}.avif`);
    const webp = join(OUT, `${target.name}-${width}.webp`);

    await base.clone().avif({ quality: 55, effort: 6 }).toFile(avif);
    await base.clone().webp({ quality: 72 }).toFile(webp);

    written.push(avif, webp);
  }

  return written;
}

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? TARGETS.filter((t) => only.includes(t.name)) : TARGETS;

  await mkdir(OUT, { recursive: true });
  await mkdir(TMP, { recursive: true });

  let failed = 0;

  for (const target of targets) {
    process.stdout.write(`${target.name} <- ${target.url}\n`);
    try {
      const raw = await capture(target);
      const written = await encode(raw, target);
      for (const file of written) {
        const { size } = await stat(file);
        const over = size > MAX_BYTES;
        if (over) failed += 1;
        console.log(`  ${over ? 'OVER' : '  ok'}  ${file.replace(ROOT, '').replace(/\\/g, '/')}  ${Math.round(size / 1024)} KB`);
      }
    } catch (err) {
      failed += 1;
      console.log(`  FAILED  ${err.message}`);
      console.log('  The slot stays empty and the page draws the frame with a flat fill.');
    }
  }

  await rm(TMP, { recursive: true, force: true });

  const have = (await readdir(OUT).catch(() => [])).filter((f) => f.endsWith('-1440.avif') || f.endsWith('-390.avif'));
  console.log(`\n${have.length} capture(s) available in Images/shots.`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
