// Assemble the static site.
//
// This is a build-time include, not a runtime framework: it runs here, writes
// plain HTML files into the repository, and those files are what Vercel
// serves. BUILD-BRIEF §9 asks for exactly this so the header, footer and the
// seven checks exist in one place and are byte-identical wherever they appear.
//
//   node scripts/build-site.js          write the pages
//   node scripts/build-site.js --check  fail if the committed pages are stale

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { page } from '../build/layout.js';
import { ORIGIN } from '../build/site.js';

import home from '../build/pages/home.js';
import audit from '../build/pages/audit.js';
import capabilities from '../build/pages/capabilities.js';
import sectors from '../build/pages/sectors.js';
import work from '../build/pages/work.js';
import credentials from '../build/pages/credentials.js';
import contact from '../build/pages/contact.js';
import company from '../build/pages/company.js';
import legal from '../build/pages/legal.js';
import notFound from '../build/pages/notfound.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const PAGES = [
  home,
  audit,
  ...capabilities,
  ...sectors,
  ...work,
  credentials,
  ...contact,
  ...company,
  ...legal,
  notFound,
];

/** "/capabilities/web-platforms" -> "capabilities/web-platforms.html" */
function fileFor(url) {
  if (url === '/') return 'index.html';
  return url.replace(/^\//, '') + '.html';
}

/** Pages that should not appear in the sitemap or be indexed. */
const NOINDEX = new Set(['/404', '/thank-you', '/check-your-details']);

function sitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((p) => !NOINDEX.has(p.url))
    .map((p) => {
      const priority = p.url === '/' ? '1.0' : p.url === '/audit' ? '0.9' : '0.7';
      return `  <url>
    <loc>${ORIGIN}${p.url === '/' ? '/' : p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function emit(relPath, contents, stale) {
  const target = join(ROOT, relPath);
  if (CHECK) {
    let current = null;
    try {
      current = await readFile(target, 'utf8');
    } catch {
      /* missing counts as stale */
    }
    if (current !== contents) stale.push(relPath);
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
}

async function main() {
  const seen = new Set();
  const stale = [];

  for (const p of PAGES) {
    if (seen.has(p.url)) throw new Error(`two pages claim ${p.url}`);
    seen.add(p.url);

    if (p.title.length > 60) {
      console.warn(`  title over 60 chars (${p.title.length}): ${p.url}`);
    }
    const d = p.description.length;
    if (d < 140 || d > 160) {
      console.warn(`  description ${d} chars, wanted 140-160: ${p.url}`);
    }

    const html = NOINDEX.has(p.url)
      ? page(p).replace('<link rel="canonical"', '<meta name="robots" content="noindex,follow">\n  <link rel="canonical"')
      : page(p);

    await emit(fileFor(p.url), html, stale);
  }

  await emit('sitemap.xml', sitemap(PAGES), stale);

  if (CHECK) {
    if (stale.length) {
      console.error('Stale generated files — run `npm run build`:');
      stale.forEach((f) => console.error('  ' + f));
      process.exit(1);
    }
    console.log(`All ${PAGES.length} pages up to date.`);
    return;
  }

  console.log(`Wrote ${PAGES.length} pages and sitemap.xml.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
