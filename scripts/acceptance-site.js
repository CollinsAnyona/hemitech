// Acceptance run for the site, covering the checks in BUILD-BRIEF §14 that can
// be made automatic. Lighthouse (tests 1 and 2) runs separately against a
// preview URL; tests 7 and 8 are a human pass, and this script asserts the
// preconditions that make them pass.
//
//   node scripts/acceptance-site.js

import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { SITE, ORIGIN } from '../build/site.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let checks = 0;

function assert(ok, label, detail = '') {
  checks += 1;
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
  }
}

function heading(text) {
  console.log(`\n${text}`);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'design-source', 'build', 'scripts', 'media', '.submissions', '.vercel']);

async function htmlFiles(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await htmlFiles(full, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

async function main() {
  const pages = await htmlFiles();
  const css = await readFile(join(ROOT, 'styles.css'), 'utf8');

  /* ---- 3. no third-party fonts anywhere ------------------------------- */

  heading('3. No fonts.googleapis.com or fonts.gstatic.com');
  const fontOffenders = [];
  for (const file of [...pages, join(ROOT, 'styles.css'), join(ROOT, 'site.js'), join(ROOT, 'audit.js')]) {
    const text = await readFile(file, 'utf8');
    if (/fonts\.googleapis|fonts\.gstatic/.test(text)) fontOffenders.push(rel(file));
  }
  assert(fontOffenders.length === 0, 'no third-party font requests', fontOffenders.join(', '));

  /* ---- 4. every image has explicit dimensions ------------------------- */

  heading('4. Every image has explicit width and height');
  const unsized = [];
  for (const file of pages) {
    const text = await readFile(file, 'utf8');
    for (const tag of text.match(/<img[^>]*>/g) || []) {
      if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) unsized.push(`${rel(file)}: ${tag.slice(0, 70)}`);
    }
  }
  assert(unsized.length === 0, 'all images sized', unsized.join('\n        '));

  /* ---- 5. no outline suppression -------------------------------------- */

  heading('5. No outline suppression');
  const outline = css.match(/outline:\s*(none|0)\b/g) || [];
  assert(outline.length === 0, 'no outline:none or outline:0 in styles.css', outline.join(', '));

  /* ---- 6. the phone number is a tel: link ----------------------------- */

  heading('6. The phone number is a tel: link');
  const index = await readFile(join(ROOT, 'index.html'), 'utf8');
  const telCount = (index.match(/href="tel:/g) || []).length;
  const pendingCount = (index.match(/data-tel-pending/g) || []).length;
  assert(
    telCount > 0,
    `homepage has a tel: link (found ${telCount})`,
    pendingCount > 0
      ? `${pendingCount} phone slots are still the [+254 7XX XXX XXX] placeholder. ` +
        'Set SITE.phone.dial in build/site.js and rebuild; every one becomes a tel: link.'
      : '',
  );

  /* ---- 7 (precondition). every control is a real control -------------- */

  heading('7. Keyboard: every control is a native, focusable element');
  const fakeControls = [];
  for (const file of pages) {
    const text = await readFile(file, 'utf8');
    for (const tag of text.match(/<(div|span|p)[^>]*\son[a-z]+=/g) || []) {
      fakeControls.push(`${rel(file)}: ${tag.slice(0, 60)}`);
    }
    if (/tabindex="[1-9]/.test(text)) fakeControls.push(`${rel(file)}: positive tabindex`);
  }
  assert(fakeControls.length === 0, 'no click handlers on non-interactive elements', fakeControls.join('\n        '));
  assert(/\.skip-link/.test(css), 'a skip link is styled and reachable');
  assert(/:focus-visible\s*\{/.test(css), 'a visible focus ring is defined');

  /* ---- 8 (precondition). works without JavaScript --------------------- */

  heading('8. Works without JavaScript');
  const noJsProblems = [];
  for (const name of ['index.html', 'audit.html', 'contact.html']) {
    const text = await readFile(join(ROOT, name), 'utf8');
    if (!/<nav class="nav"/.test(text)) noJsProblems.push(`${name}: no nav`);
    if (/<main[^>]*>\s*<\/main>/.test(text)) noJsProblems.push(`${name}: empty main`);
  }
  const auditHtml = await readFile(join(ROOT, 'audit.html'), 'utf8');
  const contactHtml = await readFile(join(ROOT, 'contact.html'), 'utf8');
  assert(noJsProblems.length === 0, 'every page renders its content and nav in the HTML', noJsProblems.join(', '));
  assert(
    /<form[^>]+method="post"[^>]+action="\/api\/audit"/.test(auditHtml),
    'the audit form posts without JavaScript',
  );
  assert(
    /<form[^>]+method="post"[^>]+action="\/api\/contact"/.test(contactHtml),
    'the contact form posts without JavaScript',
  );
  assert(
    /<input type="checkbox"/.test(auditHtml),
    'the seven checks are real checkboxes, not script-driven buttons',
  );
  assert(
    /What the score means/.test(auditHtml),
    'the three bands are explained on the page itself',
  );

  /* ---- the audit tool, driven for real -------------------------------- */

  heading('The audit tool (jsdom, running the real audit.js)');
  const auditJs = await readFile(join(ROOT, 'audit.js'), 'utf8');
  const dom = new JSDOM(auditHtml, { runScripts: 'outside-only', url: 'https://hemitech.co.ke/audit' });
  const { window } = dom;
  window.eval(auditJs);

  const boxes = [...window.document.querySelectorAll('#audit-checks input[type="checkbox"]')];
  const arc = window.document.getElementById('ring-arc');
  const score = window.document.getElementById('ring-score');
  const title = window.document.getElementById('band-title');
  const pkg = window.document.getElementById('pkg-name');

  assert(boxes.length === 7, 'seven checks are wired up');
  assert(window.document.querySelector('.score-live').hidden === false, 'the live score is revealed when the script runs');
  assert(window.document.querySelector('.no-js-note').hidden === true, 'the no-script note is hidden when the script runs');

  const CIRC = 452.4;
  const tick = (n) => {
    boxes.forEach((b, i) => {
      if (b.checked !== i < n) {
        b.checked = i < n;
        b.dispatchEvent(new window.Event('change'));
      }
    });
  };

  tick(0);
  assert(score.textContent === '0', 'score 0 renders 0');
  assert(arc.getAttribute('stroke-linecap') === 'butt', 'at zero the cap is butt, so no dot is drawn');
  assert(arc.getAttribute('stroke-dasharray') === `0.0 ${CIRC}`, 'at zero the arc has zero length');
  assert(title.textContent === 'It’s costing you clients today.', 'score 0 is the bottom band');
  assert(arc.getAttribute('stroke') === 'var(--alert)', 'the bottom band ring is --alert');

  tick(3);
  assert(score.textContent === '3', 'score 3 renders 3');
  assert(title.textContent === 'It’s costing you clients today.', 'score 3 is still the bottom band');
  assert(pkg.textContent === 'Starter — from KES 145,000', 'score 3 suggests Starter');
  assert(arc.getAttribute('stroke-linecap') === 'round', 'above zero the cap is round');

  tick(4);
  assert(title.textContent === 'You’re leaking enquiries quietly.', 'score 4 is the middle band');
  assert(arc.getAttribute('stroke') === 'var(--blue-mid)', 'the middle band ring is --blue-mid');
  assert(pkg.textContent === 'Rescue — KES 65,000', 'score 4 suggests Rescue');

  tick(6);
  assert(title.textContent === 'It works.', 'score 6 is the top band');
  assert(arc.getAttribute('stroke') === 'var(--blue-deep)', 'the top band ring is --blue-deep');
  assert(pkg.textContent === 'Care Plan', 'score 6 suggests the Care Plan');

  tick(7);
  const expected = (CIRC * (7 / 7)).toFixed(1);
  assert(arc.getAttribute('stroke-dasharray') === `${expected} ${CIRC}`, 'at seven the arc is a full circle');
  assert(window.document.getElementById('checked-count').textContent === '7', 'the running count tracks the ticks');
  assert(
    JSON.parse(window.sessionStorage.getItem('hemitech.audit.checks')).every(Boolean),
    'the ticks are kept in sessionStorage so a reload does not lose them',
  );

  // The band title never takes the band colour.
  assert(title.style.color === '', 'the band title is never recoloured — --alert stays off headlines');

  /* ---- the seven checks are byte-identical everywhere ----------------- */

  heading('The seven checks are byte-identical wherever they appear');
  const CANON = [
    'Loads in under 3 seconds on mobile data',
    'Your phone number dials when you tap it',
    'No pinching. No sideways scrolling.',
    'Line one says what you do, before scrolling',
    'One obvious next step, not five',
    'The padlock is there. No &quot;Not secure&quot;.',
    'Something on it was updated this year',
  ];
  const carriers = ['index.html', 'audit.html', 'how-we-work.html'];
  for (const name of carriers) {
    const text = await readFile(join(ROOT, name), 'utf8');
    const missing = CANON.filter((c) => !text.includes(c));
    assert(missing.length === 0, `${name} carries all seven, word for word`, missing.join(' | '));
  }

  /* ---- structure ------------------------------------------------------ */

  heading('Structure and metadata');
  const problems = [];
  const urls = new Set(['/']);
  for (const file of pages) {
    const name = rel(file);
    urls.add('/' + name.replace(/\.html$/, '').replace(/^index$/, ''));
  }

  for (const file of pages) {
    const text = await readFile(file, 'utf8');
    const name = rel(file);

    const h1s = (text.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) problems.push(`${name}: ${h1s} <h1> elements`);

    const title = (text.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (title.length > 60) problems.push(`${name}: title ${title.length} chars`);

    const desc = (text.match(/name="description" content="([^"]*)"/) || [])[1] || '';
    if (desc.length < 140 || desc.length > 160) problems.push(`${name}: description ${desc.length} chars`);

    if (!/<link rel="canonical"/.test(text)) problems.push(`${name}: no canonical`);
    if (!/lang="en-KE"/.test(text)) problems.push(`${name}: no lang`);
  }
  assert(problems.length === 0, 'one h1, a canonical, a lang and sized metadata on every page', problems.join('\n        '));

  // internal links resolve
  const dead = [];
  for (const file of pages) {
    const text = await readFile(file, 'utf8');
    for (const m of text.matchAll(/href="(\/[^"#?]*)"/g)) {
      const href = m[1];
      if (href.startsWith('/api/') || href.startsWith('/fonts/') || href.startsWith('/Images/')) continue;
      if (/\.(png|jpg|jpeg|ico|webmanifest|xml|txt|css|js|avif|webp)$/.test(href)) continue;
      if (!urls.has(href)) dead.push(`${rel(file)} -> ${href}`);
    }
  }
  assert(dead.length === 0, 'every internal link points at a page that exists', [...new Set(dead)].join('\n        '));

  /* ---- structured data ------------------------------------------------- */
  // BUILD-BRIEF §12's rule is "never a placeholder", not "never a fact" — a
  // real telephone and a true, street-address-free locality are neither.
  // These checks confirm the values are real (match SITE) and unbracketed,
  // not that they're absent.

  heading('Structured data');
  const homeBlocks = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]));
  const org = homeBlocks.find((b) => b['@type'] === 'ProfessionalService' || b['@type'] === 'Organization');
  assert(homeBlocks.length > 0, 'the homepage carries JSON-LD');
  if (org) {
    const flat = JSON.stringify(org);
    assert(!/\[[A-Z][A-Z ]*[A-Z\]]/.test(flat), 'no bracketed placeholder was emitted into structured data');
    assert(!('telephone' in org) || org.telephone === SITE.phone.dial,
      'telephone in structured data, if present, is the real published number');
    assert(!('address' in org) || (org.address.addressLocality === 'Nairobi' && !('streetAddress' in org.address)),
      'address in structured data, if present, states the true locality and invents no street address');
  }

  // Every indexable page carries at least one JSON-LD block; every page's
  // blocks parse; every breadcrumb/list URL resolves to a real page, and a
  // fragment on one (e.g. "/capabilities#build") resolves to a real element
  // on that real page — not just a page that exists.
  const UTILITY_PAGES = new Set(['404.html', 'thank-you.html', 'check-your-details.html']);
  const ldProblems = [];
  const pageHtmlByName = new Map();
  for (const file of pages) pageHtmlByName.set(rel(file), await readFile(file, 'utf8'));

  for (const [name, text] of pageHtmlByName) {
    const blocks = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (blocks.length === 0 && !UTILITY_PAGES.has(name)) {
      ldProblems.push(`${name}: no structured data`);
      continue;
    }
    for (const [, raw] of blocks) {
      let obj;
      try {
        obj = JSON.parse(raw);
      } catch (e) {
        ldProblems.push(`${name}: invalid JSON-LD (${e.message})`);
        continue;
      }
      const items = obj['@type'] === 'BreadcrumbList' ? obj.itemListElement
        : obj['@type'] === 'ItemList' ? obj.itemListElement
        : [];
      for (const it of items) {
        const url = it.item || it.url;
        if (!url) continue;
        const [base, fragment] = url.replace(ORIGIN, '').split('#');
        const targetName = base === '' || base === '/' ? 'index.html' : base.replace(/^\//, '') + '.html';
        if (!pageHtmlByName.has(targetName)) {
          ldProblems.push(`${name}: links to ${url}, but ${targetName} does not exist`);
        } else if (fragment && !new RegExp(`id="${fragment}"`).test(pageHtmlByName.get(targetName))) {
          ldProblems.push(`${name}: links to ${url}, but no id="${fragment}" exists on ${targetName}`);
        }
      }
    }
  }
  assert(ldProblems.length === 0, 'every page has structured data, and every breadcrumb/list URL in it resolves to something real',
    ldProblems.join('\n        '));

  /* ---- weight budget -------------------------------------------------- */

  heading('Weight budget (compressed, as served)');
  async function gz(p) {
    return gzipSync(await readFile(join(ROOT, p))).length;
  }
  const fontSize = (await stat(join(ROOT, 'fonts/montserrat-latin.woff2'))).size;
  const homeBytes = (await gz('index.html')) + (await gz('styles.css')) + (await gz('site.js')) + fontSize;
  const auditBytes = (await gz('audit.html')) + (await gz('styles.css')) + (await gz('site.js')) + (await gz('audit.js')) + fontSize;

  const kb = (n) => `${Math.round(n / 1024)} KB`;
  assert(homeBytes < 500 * 1024, `homepage under 500 KB (${kb(homeBytes)})`);
  assert(auditBytes < 350 * 1024, `audit page under 350 KB (${kb(auditBytes)})`);

  let worst = 0;
  let worstName = '';
  for (const file of pages) {
    if (rel(file) === 'index.html') continue;
    const bytes = gzipSync(await readFile(file)).length + (await gz('styles.css')) + (await gz('site.js')) + fontSize;
    if (bytes > worst) {
      worst = bytes;
      worstName = rel(file);
    }
  }
  assert(worst < 350 * 1024, `heaviest inner page under 350 KB (${worstName}, ${kb(worst)})`);

  /* ---- summary -------------------------------------------------------- */

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
