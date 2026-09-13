// Sectors index and the five sector pages.
// From design-source/Sector.dc.html.
//
// BUILD-BRIEF §9.7: the "what usually goes wrong" cards and the sector copy
// are written per sector. The government copy is never pasted across; each
// page states the failures and the builds that belong to that sector alone.
// copyNeeded() stays as the fallback for any sector added without copy.

import { SECTORS, COMMITMENTS } from '../site.js';
import { esc, ICONS } from '../layout.js';

const index = {
  url: '/sectors',
  nav: '/sectors',
  title: 'Sectors we build for in East Africa · Hemi Tech Co.',
  description:
    'A permit portal and a donor dashboard fail in completely different ways. Government, NGOs, SACCOs, education and professional services, each written for alone.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">Sectors</p>
          <h1 class="max-20">We write for your sector, not for “businesses”.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">A permit portal and a donor dashboard fail in completely different ways, and they are bought by people answering to completely different committees. Pick the one you are responsible for.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-label="Sectors">
      <div class="grid grid-3">
${SECTORS.map((s) => `        <a class="card" href="/sectors/${s.slug}" style="min-height:200px">
          ${ICONS[s.icon](24, '#0F5FDB')}
          <h2 style="font-size:19px;font-weight:700;letter-spacing:-.012em">${s.name.replace('&', '&amp;')}</h2>
          <p class="small">${s.blurb.replace(/&/g, '&amp;')}</p>
          <span class="flow-end">Read the sector page</span>
        </a>`).join('\n')}
      </div>
    </section>

    <section class="band-tint" aria-labelledby="why-h">
      <div class="wrap sec-tight split">
        <h2 id="why-h">Why it is split this way</h2>
        <div class="stack stack-5">
          <p class="body-copy">Every one of these buyers is answerable to somebody: an assembly, a donor, a board, a regulator, a parent. What they need from a supplier is not a different technology; it is a different set of things written down before the contract is signed.</p>
          <p class="body-copy">A county needs an audit trail and an accessibility standard. An NGO needs indicators that survive a donor’s own definitions. A SACCO needs reconciliation its auditor accepts. A school needs consent handling for children’s data. A consultancy needs to look credible in thirty seconds on a phone.</p>
          <p class="body-copy">So each sector page states the failures we are actually called in to fix, what we build for that sector, and what we commit to in writing, rather than a page of stock photography with the word “solutions” in the heading.</p>
        </div>
      </div>
    </section>`,
};

/* --------------------------------------------------------------- detail --- */

function withCopy(s) {
  const problems = s.problems
    .map(([icon, h, p]) => `          <div class="card" style="padding:28px 26px">
            ${ICONS[icon](24, '#0F5FDB')}
            <h3>${esc(h)}</h3>
            <p style="font-size:15px;line-height:1.52">${esc(p)}</p>
          </div>`)
    .join('\n');

  const builds = s.builds
    .map(([h, p]) => `          <div class="card" style="padding:26px 24px;gap:10px"><h3>${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p></div>`)
    .join('\n');

  return `    <section class="wrap" style="padding-top:var(--s9)" aria-labelledby="wrong-h">
      <div class="stack stack-4 max-680" style="margin-bottom:var(--s7)">
        <p class="eyebrow">What usually goes wrong</p>
        <h2 id="wrong-h">${esc(s.problemsHeading)}</h2>
        <p class="body-copy">${esc(s.problemsIntro)}</p>
      </div>
      <div class="grid grid-2">
${problems}
      </div>
    </section>

    <section class="band-tint" style="margin-top:var(--s9)" aria-labelledby="build-h">
      <div class="wrap sec-tight">
        <div class="stack stack-4 max-640" style="margin-bottom:40px">
          <p class="eyebrow">What we build for this sector</p>
          <h2 id="build-h">${esc(s.buildsHeading)}</h2>
        </div>
        <div class="grid grid-3">
${builds}
        </div>
      </div>
    </section>`;
}

function copyNeeded(s) {
  return `    <section class="wrap" style="padding-top:var(--s9)" aria-labelledby="wrong-h">
      <div class="stack stack-4 max-680" style="margin-bottom:var(--s7)">
        <p class="eyebrow">What usually goes wrong</p>
        <h2 id="wrong-h">The failures are rarely technical.</h2>
      </div>

      <div class="panel" style="border-style:dashed">
        <div class="stack stack-4">
          <p class="label">[COPY NEEDED: ${esc(s.name)}]</p>
          <p class="body-copy">This page carries the sector template and nothing else yet. The four “what usually goes wrong” cards and the “what we build for this sector” list have to be written specifically for ${esc(s.name.toLowerCase())}: the government copy is not transferable, and inventing it would put claims on the site that nobody can stand behind.</p>
          <p class="body-copy">What is needed: four failures we have actually been called in to fix in this sector, and six things we build for it. Until then the capabilities pages carry the detail, and the audit is the honest starting point.</p>
          <div class="btn-row" style="margin-top:var(--s2)">
            <a class="btn" href="/capabilities">See all capabilities</a>
            <a class="btn ghost" href="/contact">Tell us about your sector</a>
          </div>
        </div>
      </div>
    </section>`;
}

function detail(s) {
  return {
    url: `/sectors/${s.slug}`,
    nav: '/sectors',
    title: `${s.name.replace('&', 'and')} · Hemi Tech Co.`.slice(0, 60),
    description: s.metaDesc,
    body: `    <div class="band-navy on-navy-field">
      <div class="glow glow-br" aria-hidden="true"></div>
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/sectors">Sectors</a><span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">${s.name.replace('&', '&amp;')}</span>
        </nav>
      </div>
      <div class="wrap" style="padding-top:46px;padding-bottom:64px">
        <div class="split-even" style="grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);align-items:start">
          <div class="stack stack-5">
            <p class="eyebrow">Sector</p>
            <h1 class="max-16">${esc(s.hasCopy ? s.h1 : s.name.replace('&', 'and'))}</h1>
            <div class="rule"></div>
            <p style="font-size:clamp(16px,1.5vw,19px);line-height:1.58;max-width:58ch">${esc(s.hasCopy ? s.lede : s.blurb)}</p>
            <div class="btn-row" style="margin-top:8px">
              <a class="btn on-navy" href="/credentials">Request our capability statement</a>
              <a class="btn outline-navy" href="/contact">Tender enquiries</a>
            </div>
          </div>

          <div class="status-panel">
            <h2 class="eyebrow" style="margin-bottom:16px">Procurement status</h2>
            <div class="row-split"><span class="row-key">AGPO, youth category</span><span class="row-val">In progress</span></div>
            <div class="row-split"><span class="row-key">e-GP registered supplier</span><span class="row-val">In progress</span></div>
            <div class="row-split"><span class="row-key">Tax Compliance Certificate</span><span class="row-val">In progress</span></div>
            <div class="row-split"><span class="row-key">ODPC data processor</span><span class="row-val">In progress</span></div>
            <div class="row-split"><span class="row-key">CR12 and incorporation</span><span class="row-val">On request</span></div>
            <p>30% of national procurement spend is reserved for youth, women and PWD-owned enterprises under AGPO.</p>
          </div>
        </div>
      </div>
    </div>

${s.hasCopy ? withCopy(s) : copyNeeded(s)}

    <section class="wrap sec-tight" aria-labelledby="commit-h">
      <div class="split-even" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);align-items:start">
        <div class="stack stack-5">
          <p class="eyebrow">What we commit to</p>
          <h2 id="commit-h">Published before you contract us.</h2>
          <p class="body-copy" style="font-size:16.5px">These are in our standard terms, not negotiated per project. If we miss them, you have something to point at.</p>
          <div class="btn-row" style="margin-top:6px">
            <a class="btn" href="/credentials">${ICONS.download(17)} Capability statement (PDF)</a>
            <a class="btn ghost" href="/standards">Full standards</a>
          </div>
        </div>
        <ul class="commitments">
          <li><span class="key">Page load on mobile data</span><span class="val">under 2.5s</span></li>
          <li><span class="key">Accessibility</span><span class="val">WCAG 2.2 AA</span></li>
          <li><span class="key">Uptime on supported systems</span><span class="val">${COMMITMENTS.uptime}</span></li>
          <li><span class="key">Response to a reported fault</span><span class="val">${COMMITMENTS.response}</span></li>
          <li><span class="key">Data residency</span><span class="val">${COMMITMENTS.residency}</span></li>
          <li><span class="key">Source code &amp; hosting ownership</span><span class="val">Yours</span></li>
        </ul>
      </div>
    </section>`,
  };
}

export default [index, ...SECTORS.map(detail)];
