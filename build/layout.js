// The page shell, and every fragment that repeats.
//
// BUILD-BRIEF §9: "Header nav, footer and the seven audit checks must be
// byte-identical wherever they repeat. Put them in one place." They live here,
// and scripts/build-site.js stamps them into every page. The deployed site is
// still plain static HTML with no runtime framework: the assembly happens
// once, here, not in the browser.

import { SITE, CHECKS, ORIGIN } from './site.js';

/* ------------------------------------------------------------------ esc --- */

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------------------------------------------------------- icons --- */
// Stroke-based, 24px grid, 1.8px stroke, round caps and joins. Never emoji.

const stroke = (paths, size = 24, width = 1.8, colour = 'currentColor') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${colour}" ` +
  `stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const ICONS = {
  arrow: (s = 17, c = 'currentColor') => stroke('<path d="M5 12h13M12 5l7 7-7 7"></path>', s, 2.2, c),
  chevron: (s = 17, c = 'currentColor') => stroke('<path d="M9 5l7 7-7 7"></path>', s, 2.2, c),
  clock: (s = 24, c = 'currentColor') => stroke('<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>', s, 1.8, c),
  phone: (s = 20, c = 'currentColor') => stroke('<path d="M4.5 4h3.2l1.6 4-2 1.4a12 12 0 005.3 5.3l1.4-2 4 1.6v3.2a1.5 1.5 0 01-1.7 1.5A16.5 16.5 0 013 5.7 1.5 1.5 0 014.5 4z"></path>', s, 1.9, c),
  mail: (s = 20, c = 'currentColor') => stroke('<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3.5 6.5L12 13l8.5-6.5"></path>', s, 1.9, c),
  tender: (s = 20, c = 'currentColor') => stroke('<path d="M8 3h8l4 5-8 13L4 8z"></path><path d="M4 8h16"></path>', s, 1.9, c),
  pin: (s = 20, c = 'currentColor') => stroke('<path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z"></path><circle cx="12" cy="10" r="2.6"></circle>', s, 1.9, c),
  download: (s = 17, c = 'currentColor') => stroke('<path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M4 20h16"></path>', s, 2.1, c),
  check: (s = 20, c = 'currentColor') => stroke('<path d="M4 12.5l5.2 5.2L20 7"></path>', s, 2.6, c),
  code: (s = 26, c = 'currentColor') => stroke('<path d="M8 6l-5 6 5 6"></path><path d="M16 6l5 6-5 6"></path>', s, 1.8, c),
  bars: (s = 26, c = 'currentColor') => stroke('<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M22 20H2"></path>', s, 1.8, c),
  bars2: (s = 24, c = 'currentColor') => stroke('<path d="M4 19h16"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-4"></path>', s, 1.8, c),
  transform: (s = 26, c = 'currentColor') => stroke('<path d="M12 3v6"></path><path d="M12 15v6"></path><circle cx="12" cy="12" r="3"></circle><path d="M3 12h6"></path><path d="M15 12h6"></path>', s, 1.8, c),
  bank: (s = 22, c = 'currentColor') => stroke('<path d="M3 21h18"></path><path d="M5 21V9l7-5 7 5v12"></path><path d="M10 21v-6h4v6"></path>', s, 1.8, c),
  globe: (s = 22, c = 'currentColor') => stroke('<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a15 15 0 010 18a15 15 0 010-18z"></path>', s, 1.8, c),
  wallet: (s = 22, c = 'currentColor') => stroke('<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"></path><path d="M3 12h18"></path>', s, 1.8, c),
  education: (s = 22, c = 'currentColor') => stroke('<path d="M12 4L2 9l10 5 10-5-10-5z"></path><path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5"></path>', s, 1.8, c),
  briefcase: (s = 22, c = 'currentColor') => stroke('<rect x="3" y="6" width="18" height="14" rx="2"></rect><path d="M8 6V4h8v2"></path><path d="M3 12h18"></path>', s, 1.8, c),
  shield: (s = 24, c = 'currentColor') => stroke('<path d="M12 3l8 4v6c0 4.5-3.2 7.6-8 8.9C7.2 20.6 4 17.5 4 13V7z"></path><path d="M9 12.5l2 2 4-4"></path>', s, 1.8, c),
  lock: (s = 24, c = 'currentColor') => stroke('<rect x="4" y="10" width="16" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 118 0v3"></path>', s, 1.8, c),
  menu: (s = 20, c = 'currentColor') => stroke('<path d="M4 7h16M4 12h16M4 17h16"></path>', s, 2, c),
  close: (s = 20, c = 'currentColor') => stroke('<path d="M6 6l12 12M18 6L6 18"></path>', s, 2, c),
};

export const quoteMark = (w = 34) =>
  `<svg width="${w}" height="${Math.round(w * 28 / 34)}" viewBox="0 0 34 28" fill="none" aria-hidden="true" focusable="false">` +
  `<path d="M0 28V16C0 7 5 1.5 14 0l1.5 5C10 6.5 7.5 9.5 7.5 14H14v14H0zm20 0V16c0-9 5-14.5 14-16l1.5 5C30 6.5 27.5 9.5 27.5 14H34v14H20z" fill="#2587FC" opacity=".9"></path></svg>`;

/* ------------------------------------------------------------------ logo -- */
// The real brand artwork, prepared by scripts/build-logo.js from the masters.
// The mark is 368x413 in the master, so it is served at that ratio and sized
// by height in CSS. `light` picks the version drawn for a navy ground.

export const logoMark = (height = 38, light = false) => {
  const stem = light ? 'mark-light' : 'mark';
  const w = Math.round((368 / 413) * height);
  return `<picture class="logo-mark">
          <source type="image/avif" srcset="/Images/brand/${stem}-80.avif 80w, /Images/brand/${stem}-160.avif 160w" sizes="${w}px">
          <img src="/Images/brand/${stem}-80.webp" alt="" width="${w}" height="${height}" decoding="async">
        </picture>`;
};

/** The full lockup, wordmark and tagline included. Used where it can breathe. */
export const logoLockup = (width = 240, light = true) => {
  const stem = light ? 'lockup-light' : 'lockup';
  const h = Math.round((413 / 1273) * width);
  return `<picture class="logo-lockup">
          <source type="image/avif" srcset="/Images/brand/${stem}-280.avif 280w, /Images/brand/${stem}-560.avif 560w" sizes="${width}px">
          <img src="/Images/brand/${stem}-280.webp" alt="${esc(SITE.name)}: build, analyze, transform" width="${width}" height="${h}" decoding="async">
        </picture>`;
};

/**
 * The same lockup, icon and wordmark, with the tagline and its rule removed
 * rather than shrunk: at header height they'd blur into noise instead of
 * getting smaller and staying legible. For places the full lockup doesn't
 * have room to breathe — the header bar, mainly.
 */
export const logoLockupCompact = (width = 150, light = false) => {
  const stem = light ? 'lockup-compact-light' : 'lockup-compact';
  const h = Math.round((405 / 1273) * width); // the tagline/rule are cropped out; shorter than the full lockup
  return `<picture class="logo-lockup logo-lockup-compact">
          <source type="image/avif" srcset="/Images/brand/${stem}-280.avif 280w, /Images/brand/${stem}-560.avif 560w" sizes="${width}px">
          <img src="/Images/brand/${stem}-280.webp" alt="${esc(SITE.name)}" width="${width}" height="${h}" decoding="async">
        </picture>`;
};

/* -------------------------------------------------------------- contact --- */
// One phone element, everywhere. The moment SITE.phone.dial holds digits this
// becomes a real tel: link on every page at once and check 2 passes. Until
// then it renders the bracketed placeholder rather than a link that dials
// nothing: inventing the number is forbidden by §12.

export function phoneLink(cls = '') {
  const c = cls ? ` class="${cls}"` : '';
  if (SITE.phone.dial) {
    return `<a href="tel:${esc(SITE.phone.dial)}"${c}>${esc(SITE.phone.display)}</a>`;
  }
  return `<span${c} data-tel-pending>${esc(SITE.phone.display)}</span>`;
}

export const mailLink = (addr = SITE.email, cls = '') =>
  `<a href="mailto:${esc(addr)}"${cls ? ` class="${cls}"` : ''}>${esc(addr)}</a>`;

/* ---------------------------------------------------- the seven checks ---- */

export function checksStatic() {
  return `<div class="checklist">
          <p class="eyebrow" style="margin-bottom:20px">The seven checks</p>
          <ul>
${CHECKS.map(([label]) => `            <li><span class="box-static" aria-hidden="true"></span><span class="check-text">${esc(label)}</span></li>`).join('\n')}
          </ul>
        </div>`;
}

/* --------------------------------------------------------------- header --- */

const NAV = [
  ['Capabilities', '/capabilities'],
  ['Sectors', '/sectors'],
  ['Work', '/work'],
  ['How we work', '/how-we-work'],
  ['Credentials', '/credentials'],
  ['Insights', '/insights'],
];

function header(current) {
  const item = ([label, href]) => {
    const on = current && (current === href || current.startsWith(href + '/'));
    return `        <li><a href="${href}"${on ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  };

  return `<div class="commit-strip">
    <div class="wrap">
      <p class="claim">${ICONS.clock(16, '#2587FC')}<span>Our standard: every site we build loads in under 2.5 seconds on mobile data.</span></p>
      <div class="reach">
        ${phoneLink()}
        ${mailLink(SITE.email, 'email')}
      </div>
    </div>
  </div>

  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="/">
        ${logoLockupCompact(130)}
        <span class="visually-hidden">, home</span>
      </a>

      <nav class="nav" id="site-nav" aria-label="Main">
        <ul class="nav-list">
${NAV.map(item).join('\n')}
          <li class="nav-cta-mobile"><a class="btn" href="/audit">Free website audit</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a class="btn header-cta" href="/audit">Free website audit</a>
        <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          ${ICONS.menu(20, '#02123C')}
          <span class="visually-hidden">Menu</span>
        </button>
      </div>
    </div>
  </header>`;
}

/* --------------------------------------------------------------- footer --- */

const FOOTER_COLS = [
  ['Capabilities', [
    ['Web platforms', '/capabilities/web-platforms'],
    ['Custom software', '/capabilities/custom-software'],
    ['Mobile applications', '/capabilities/mobile-applications'],
    ['E-commerce &amp; payments', '/capabilities/ecommerce-payments'],
    ['Analytics &amp; dashboards', '/capabilities/data-analytics'],
    ['Data protection', '/capabilities/data-protection'],
    ['Hosting &amp; support', '/capabilities/cloud-hosting-support'],
    ['Systems integration', '/capabilities/systems-integration'],
  ]],
  ['Sectors', [
    ['Government &amp; county', '/sectors/government'],
    ['NGOs &amp; development', '/sectors/ngo-development'],
    ['SACCOs &amp; finance', '/sectors/saccos-finance'],
    ['Education', '/sectors/education'],
    ['Professional services', '/sectors/professional-services'],
  ]],
  ['Company', [
    ['How we work', '/how-we-work'],
    ['Credentials', '/credentials'],
    ['Standards', '/standards'],
    ['Pricing', '/pricing'],
    ['Insights', '/insights'],
    ['About', '/about'],
    ['Privacy notice', '/privacy'],
    ['Terms', '/terms'],
  ]],
];

function footer() {
  const col = ([heading, links]) => `      <div class="footer-col">
        <h2>${heading}</h2>
        <ul>
${links.map(([label, href]) => `          <li><a href="${href}">${label}</a></li>`).join('\n')}
        </ul>
      </div>`;

  return `  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand stack stack-5">
        <a class="footer-lockup" href="/">
          ${logoLockup(248, true)}
        </a>
        <p>Build · Analyze · Transform. A Kenyan software and data engineering firm.</p>
        <address class="footer-contact">
          ${esc(SITE.address)}${SITE.address !== SITE.city ? `<br>${esc(SITE.city)}` : ''}<br>${phoneLink()}<br>${mailLink()}
        </address>
      </div>
${FOOTER_COLS.map(col).join('\n')}
    </div>
    <div class="wrap footer-base">
      <span>© 2026 ${esc(SITE.name)} Registered in Kenya, ${esc(SITE.city)}.</span>
      <span>Last updated ${esc(SITE.lastUpdated)}</span>
    </div>
  </footer>`;
}

/* ----------------------------------------------------------------- head --- */

function jsonLd(page) {
  if (!page.jsonLd) return '';
  return `\n  <script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>`;
}

/**
 * Assemble one page.
 *
 * @param {object} page
 *   url          path the page is served at, e.g. "/capabilities"
 *   title        <title>, under 60 characters, subject first
 *   description  meta description, 140–160 characters, written not templated
 *   body         the page markup
 *   scripts      extra scripts, e.g. ["/audit.js"]
 *   nav          nav item to mark aria-current, e.g. "/capabilities"
 *   jsonLd       structured data object, homepage only
 */
// One card per page type, generated by scripts/build-og.js from the brand
// system. Anything without its own type falls back to the default card.
function ogImage(url) {
  if (url === '/') return 'default';
  if (url.startsWith('/audit')) return 'audit';
  if (url.startsWith('/capabilities')) return 'capabilities';
  if (url.startsWith('/sectors')) return 'sectors';
  if (url.startsWith('/work')) return 'work';
  if (url.startsWith('/credentials')) return 'credentials';
  return 'default';
}

export function page(p) {
  const canonical = ORIGIN + (p.url === '/' ? '/' : p.url);
  const scripts = ['/site.js', ...(p.scripts || [])];
  const og = `${ORIGIN}/Images/og/${ogImage(p.url)}.jpg`;

  return `<!doctype html>
<html lang="en-KE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}">
  <link rel="canonical" href="${canonical}">

  <link rel="preload" href="/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/styles.css">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(SITE.name)}: ${esc(p.title.split(': ')[0])}">
  <meta property="og:locale" content="en_KE">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${og}">

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#02123C">${jsonLd(p)}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  ${header(p.nav || p.url)}

  <main id="main">
${p.body}
  </main>

${footer()}

${scripts.map((s) => `  <script src="${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}
