// Open Graph / Twitter card images, one per page type.
//
// BUILD-BRIEF §13: generated from the brand system as static images, 1200x630,
// under 100 KB. They are drawn as HTML using the same tokens and the same
// self-hosted Montserrat as the site, rendered by headless Chrome, and encoded
// as JPEG — the format every social scraper handles.
//
//   node scripts/build-og.js

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'Images', 'og');
const TMP = join(ROOT, '.og-tmp');

const MAX_BYTES = 100 * 1024;

const CARDS = [
  ['default', 'Software &amp; data engineering', 'We build the systems East African organisations run on.'],
  ['audit', 'The free audit', 'Score your own website in two minutes. Seven checks.'],
  ['capabilities', 'Capabilities', 'Eight services, with timelines and published prices.'],
  ['sectors', 'Sectors', 'Government, NGOs, SACCOs, education, professional services.'],
  ['work', 'Selected work', 'Five sites live. Built to open fast on mobile data.'],
  ['credentials', 'Credentials', 'Everything a procurement team asks for, on one page.'],
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

function card(eyebrow, headline) {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Montserrat';
    font-weight: 500 800;
    font-display: block;
    src: url('../fonts/montserrat-latin.woff2') format('woff2');
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: Montserrat, sans-serif;
    background: #02123C;
    position: relative;
    overflow: hidden;
    padding: 74px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top-rule {
    position: absolute; top: 0; left: 0; right: 0; height: 10px;
    background: linear-gradient(90deg, #2587FC, #044ECD);
  }
  /* A glow, not a disc: the design system keeps these soft and in the
     corner, because a hard circle edge reads as a shape rather than light. */
  .glow {
    position: absolute; bottom: -420px; right: -300px;
    width: 1000px; height: 1000px; border-radius: 50%;
    background: radial-gradient(circle, rgba(37, 135, 252, .40), rgba(37, 135, 252, 0) 68%);
  }
  .inner { position: relative; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .wordmark { font-weight: 800; font-size: 26px; color: #fff; letter-spacing: -.01em; }
  .eyebrow {
    font-weight: 600; font-size: 17px; letter-spacing: .2em;
    text-transform: uppercase; color: #7FB8FF; margin-bottom: 22px;
  }
  h1 {
    font-weight: 800; font-size: 60px; line-height: 1.06; letter-spacing: -.02em;
    color: #fff; max-width: 19ch;
  }
  .rule {
    height: 8px; width: 200px; border-radius: 4px; margin-top: 32px;
    background: linear-gradient(90deg, #0F5FDB, #044ECD);
  }
  .foot {
    position: relative; display: flex; justify-content: space-between;
    align-items: center; font-weight: 600; font-size: 19px; color: #8FB4E8;
  }
</style>
<div class="top-rule"></div>
<div class="glow"></div>

<div class="inner brand">
  <svg width="46" height="46" viewBox="0 0 40 40" fill="none">
    <path d="M7 6h7v11h12V6h7v28h-7V23H14v11H7z" fill="#fff"></path>
    <path d="M27 6h7v11h-7z" fill="#2587FC"></path>
  </svg>
  <span class="wordmark">HEMI TECH CO.</span>
</div>

<div class="inner">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${headline}</h1>
  <div class="rule"></div>
</div>

<div class="foot">
  <span>hemitech.co.ke</span>
  <span>Nairobi, Kenya</span>
</div>
`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(TMP, { recursive: true });

  let over = 0;

  for (const [name, eyebrow, headline] of CARDS) {
    const html = join(TMP, `${name}.html`);
    const png = join(TMP, `${name}.png`);
    await writeFile(html, card(eyebrow, headline), 'utf8');

    await run(chrome(), [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-sandbox',
      '--force-device-scale-factor=2',
      '--window-size=1200,630',
      `--screenshot=${png}`,
      '--virtual-time-budget=3000',
      `file://${html.replace(/\\/g, '/')}`,
    ], { timeout: 60_000 }).catch((err) => {
      if (!existsSync(png)) throw err;
    });

    const target = join(OUT, `${name}.jpg`);
    await sharp(png).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 88, mozjpeg: true }).toFile(target);

    const { size } = await stat(target);
    if (size > MAX_BYTES) over += 1;
    console.log(`  ${size > MAX_BYTES ? 'OVER' : '  ok'}  Images/og/${name}.jpg  ${Math.round(size / 1024)} KB`);
  }

  await rm(TMP, { recursive: true, force: true });
  if (over) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
