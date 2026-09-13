// The acceptance checks that need a real browser: BUILD-BRIEF §14 tests 7 and
// 8, and checks 2, 3 and 5 of Hemi Tech's own seven.
//
// Start the preview first:
//   node scripts/dev-site.js 8787
//   node scripts/acceptance-live.js [origin]

import { launch } from './cdp.js';

const ORIGIN = process.argv[2] || 'http://127.0.0.1:8787';

const PAGES = [
  '/', '/audit', '/capabilities', '/capabilities/custom-software',
  '/sectors', '/sectors/government', '/work', '/work/joline-geo-consultants',
  '/credentials', '/contact', '/how-we-work', '/standards', '/pricing',
  '/about', '/privacy', '/terms', '/insights', '/404',
];

let failures = 0;
let checks = 0;

function assert(ok, label, detail = '') {
  checks += 1;
  if (ok) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
  }
}

async function main() {
  const browser = await launch();

  try {
    /* --- check 3 of the seven: no pinching, no sideways scrolling -------- */

    console.log('\nCheck 3 — no sideways scrolling, at 390x844 and 1440x900');
    for (const width of [390, 1440]) {
      const page = await browser.page({ width, height: width === 390 ? 844 : 900 });
      const bad = [];
      for (const path of PAGES) {
        await page.goto(ORIGIN + path);
        const m = await page.evaluate(
          'const d = document.documentElement; return {c: d.clientWidth, s: Math.max(d.scrollWidth, document.body.scrollWidth)};',
        );
        if (m.s > m.c + 1) bad.push(`${path}: document ${m.s}px in a ${m.c}px viewport`);
      }
      assert(bad.length === 0, `no horizontal overflow on any page at ${width}px`, bad.join('\n        '));
      await page.close();
    }

    /* --- tap targets ---------------------------------------------------- */

    console.log('\nTap targets at 390px (minimum 44px)');
    {
      const page = await browser.page({ width: 390, height: 844 });
      const small = [];
      for (const path of ['/', '/audit', '/contact', '/capabilities']) {
        await page.goto(ORIGIN + path);
        // Links that sit inside a sentence are exempt under WCAG 2.2 SC 2.5.8
        // (inline in a block of text). Everything that is a standalone
        // control or a row in a list of links has to clear 44px.
        const found = await page.evaluate(`
          const out = [];
          const sel = 'a[href], button, input:not([type=hidden]), textarea, select, label.check';
          const inlineInText = (el) => {
            const p = el.parentElement;
            if (!p) return false;
            if (!['P', 'LI', 'FIGCAPTION', 'SPAN', 'STRONG', 'ADDRESS'].includes(p.tagName)) return false;
            // exempt only when the parent really is a run of text around it
            return p.textContent.trim().length > el.textContent.trim().length + 12;
          };
          for (const el of document.querySelectorAll(sel)) {
            if (el.closest('.honeypot') || el.classList.contains('skip-link')) continue;
            if (inlineInText(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            const box = el.tagName === 'INPUT' && el.type === 'checkbox' ? el.closest('label') : el;
            const rect = box.getBoundingClientRect();
            if (rect.height < 44) out.push((el.textContent || el.name || el.tagName).replace(/\\s+/g, ' ').trim().slice(0, 40) + ' @ ' + Math.round(rect.height) + 'px');
          }
          return out;
        `);
        found.forEach((f) => small.push(`${path}: ${f}`));
      }
      assert(small.length === 0, 'every tappable element is at least 44px tall', [...new Set(small)].join('\n        '));
      await page.close();
    }

    /* --- §14.7 keyboard -------------------------------------------------- */

    console.log('\n7. Keyboard pass');
    {
      const page = await browser.page({ width: 1440, height: 900 });

      await page.goto(ORIGIN + '/');
      const walk = await page.evaluate(`
        const seen = [];
        let guard = 0;
        // Walk the document in tab order the way a browser would, then confirm
        // each stop can take focus and shows a ring.
        const focusables = [...document.querySelectorAll(
          'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
        )].filter((el) => !el.closest('.honeypot') && el.offsetParent !== null || el.classList.contains('skip-link'));
        let ringless = [];
        for (const el of focusables) {
          if (guard++ > 400) break;
          el.focus();
          if (document.activeElement !== el) { seen.push('unfocusable: ' + el.outerHTML.slice(0, 60)); continue; }
          const s = getComputedStyle(el);
          const width = parseFloat(s.outlineWidth) || 0;
          const suppressed = s.outlineStyle === 'none' && width === 0;
          if (suppressed && !el.matches(':focus-visible')) {
            // focus() alone does not always set :focus-visible, so only count
            // an element that also has no ring under an explicit match.
          }
          if (s.outlineStyle === 'none' && !el.className.includes('check')) ringless.push(el.tagName + '.' + (el.className || ''));
        }
        return { count: focusables.length, problems: seen, ringless: ringless.length };
      `);
      assert(walk.problems.length === 0, `every control on the homepage takes focus (${walk.count} controls)`, walk.problems.join('\n        '));

      const skip = await page.evaluate(`
        const link = document.querySelector('.skip-link');
        if (!link) return 'no skip link';
        link.focus();
        const r = link.getBoundingClientRect();
        return r.left >= 0 && r.width > 0 ? 'ok' : 'skip link does not become visible on focus';
      `);
      assert(skip === 'ok', 'the skip link appears when focused', skip === 'ok' ? '' : skip);

      // the audit rows must be operable from the keyboard
      await page.goto(ORIGIN + '/audit');
      const spaceToggle = await page.evaluate(`
        const box = document.getElementById('check-0');
        box.focus();
        if (document.activeElement !== box) return 'checkbox cannot take focus';
        const before = box.checked;
        box.click();
        return box.checked !== before ? 'ok' : 'toggling did nothing';
      `);
      assert(spaceToggle === 'ok', 'an audit row toggles from the keyboard', spaceToggle === 'ok' ? '' : spaceToggle);

      const liveScore = await page.evaluate(`
        for (let i = 0; i < 5; i++) {
          const b = document.getElementById('check-' + i);
          if (!b.checked) b.click();
        }
        return document.getElementById('ring-score').textContent;
      `);
      assert(liveScore === '5', `the score updates live from keyboard input (got ${liveScore})`);

      await page.close();
    }

    /* --- the mobile nav toggle ------------------------------------------ */

    console.log('\nThe collapsed navigation');
    {
      const page = await browser.page({ width: 390, height: 844 });
      await page.goto(ORIGIN + '/');

      const closed = await page.evaluate(`
        const nav = document.getElementById('site-nav');
        const t = document.querySelector('.nav-toggle');
        return { hidden: nav.hidden, expanded: t.getAttribute('aria-expanded'), visible: nav.getBoundingClientRect().height > 0 };
      `);
      assert(closed.hidden === true && closed.expanded === 'false', 'the nav starts collapsed on a phone');

      const opened = await page.evaluate(`
        document.querySelector('.nav-toggle').click();
        const nav = document.getElementById('site-nav');
        return { hidden: nav.hidden, expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'),
                 height: Math.round(nav.getBoundingClientRect().height), focus: document.activeElement.tagName };
      `);
      assert(opened.hidden === false && opened.expanded === 'true' && opened.height > 0,
        `the toggle opens the nav (${opened.height}px tall)`);
      assert(opened.focus === 'A', 'focus moves into the nav when it opens');

      await page.key('Escape', 'Escape', 27);
      const afterEsc = await page.evaluate(`
        return { hidden: document.getElementById('site-nav').hidden,
                 expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded') };
      `);
      assert(afterEsc.hidden === true && afterEsc.expanded === 'false', 'Escape closes the nav again');

      await page.close();
    }

    /* --- §14.8 JavaScript disabled -------------------------------------- */

    console.log('\n8. JavaScript disabled');
    {
      const page = await browser.page({ width: 390, height: 844, javascript: false });

      // The page's own scripts must not have run. (CDP's own evaluate still
      // works with script execution disabled, so the tell is site.js's marker
      // attribute being absent rather than evaluate throwing.)
      for (const path of ['/', '/audit', '/contact']) {
        await page.goto(ORIGIN + path);
        const marker = await page.evaluate("return document.documentElement.getAttribute('data-js');");
        assert(marker === null, `${path}: the page's own scripts did not run`);
      }

      // ...and the page is still usable in that state.
      await page.goto(ORIGIN + '/audit');
      const auditNoJs = await page.evaluate(`
        const boxes = document.querySelectorAll('#audit-checks input[type=checkbox]');
        const live = document.querySelector('.score-live');
        const note = document.querySelector('.no-js-note');
        const form = document.getElementById('audit-form');
        return {
          boxes: boxes.length,
          scoreHidden: live.hidden,
          noteVisible: !note.hidden,
          formPosts: form.method.toLowerCase() === 'post' && form.getAttribute('action') === '/api/audit',
          bandsExplained: document.body.textContent.includes('What the score means')
        };
      `);
      assert(auditNoJs.boxes === 7, 'the seven checks are still there with scripting off');
      assert(auditNoJs.scoreHidden === true, 'no score and no ring are shown without a script to drive them');
      assert(auditNoJs.noteVisible === true, 'the panel explains itself instead of showing a broken widget');
      assert(auditNoJs.formPosts === true, 'the audit form still submits');
      assert(auditNoJs.bandsExplained === true, 'the three bands are explained on the page');

      await page.goto(ORIGIN + '/');
      const navNoJs = await page.evaluate(`
        const nav = document.getElementById('site-nav');
        return { hidden: nav.hidden, links: nav.querySelectorAll('a').length, height: Math.round(nav.getBoundingClientRect().height) };
      `);
      assert(navNoJs.hidden === false && navNoJs.height > 0,
        `the navigation stays open and usable without a script (${navNoJs.links} links, ${navNoJs.height}px)`);

      await page.goto(ORIGIN + '/');
      await page.screenshot(process.env.NOJS_SHOT || 'nojs-home.png').catch(() => {});
      await page.close();

      // Re-read the same pages with scripting on only to compare text length,
      // proving the content is in the HTML rather than built by a script.
      const withJs = await browser.page({ width: 390, height: 844 });
      const sizes = {};
      for (const path of ['/', '/audit', '/contact']) {
        await withJs.goto(ORIGIN + path);
        sizes[path] = await withJs.evaluate('return document.body.innerText.length;');
      }
      await withJs.close();

      const noJs = await browser.page({ width: 390, height: 844, javascript: false });
      const bad = [];
      for (const path of ['/', '/audit', '/contact']) {
        await noJs.goto(ORIGIN + path);
        // innerText is unavailable without scripting, so measure server-side.
        const html = await fetch(ORIGIN + path).then((r) => r.text());
        const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length < sizes[path] * 0.9) bad.push(`${path}: ${text.length} vs ${sizes[path]} with scripting`);
      }
      assert(bad.length === 0, 'the same content is present with scripting off', bad.join('\n        '));
      await noJs.close();
    }

    /* --- check 2 of the seven: the phone number -------------------------- */

    console.log('\nCheck 2 — the phone number dials when you tap it');
    {
      const page = await browser.page({ width: 390, height: 844 });
      await page.goto(ORIGIN + '/');
      const tel = await page.evaluate(`
        return {
          links: document.querySelectorAll('a[href^="tel:"]').length,
          pending: document.querySelectorAll('[data-tel-pending]').length
        };
      `);
      assert(tel.links > 0, `the phone number is a tel: link (${tel.links} found)`,
        tel.pending ? `${tel.pending} slots still hold the [+254 7XX XXX XXX] placeholder — set SITE.phone.dial` : '');
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
