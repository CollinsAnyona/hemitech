// Capabilities index and the eight service pages.
// From design-source/Capabilities.dc.html and ServiceDetail.dc.html.

import { SERVICES, GROUPS, PRICES, COMMITMENTS } from '../site.js';
import { esc, ICONS } from '../layout.js';

/* ---------------------------------------------------------------- index --- */

function serviceRow(s, last) {
  return `      <div class="svc"${last ? ' style="border-bottom:1px solid var(--line-soft)"' : ''}>
        <div class="stack stack-3">
          <h3><a href="/capabilities/${s.slug}">${esc(s.title)}</a></h3>
          <p style="font-size:15px;line-height:1.55">${esc(s.blurb)}</p>
        </div>
        <div class="stack" style="gap:9px">
          <span class="label">Typically includes</span>
          <p class="meta">${esc(s.includes)}</p>
        </div>
        <div class="stack stack-3">
          <div><span class="label">${esc(s.timelineLabel)}</span><p class="meta figure">${esc(s.timeline)}</p></div>
          <div><span class="label">${esc(s.fromLabel)}</span><p class="meta figure num">${esc(s.from)}</p></div>
        </div>
      </div>`;
}

function groupBlock(g) {
  const services = SERVICES.filter((s) => s.group === g.name);
  return `        <div class="section-rule">
          <h2>${esc(g.name)}</h2>
          <span class="line" aria-hidden="true"></span>
          <span class="count">${esc(g.count)}</span>
        </div>
        <p style="font-size:17px;margin-bottom:22px" class="max-62">${g.intro}</p>

${services.map((s, i) => serviceRow(s, i === services.length - 1)).join('\n')}`;
}

const index = {
  url: '/capabilities',
  nav: '/capabilities',
  title: 'Capabilities · eight services with prices · Hemi Tech Co.',
  description:
    'Eight services in three groups, each with a named scope, a stated timeline and a published price, because a buyer who has to email for a price usually doesn’t.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:56px">
        <div class="split-even" style="grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);align-items:end">
          <div class="stack stack-5">
            <p class="eyebrow">Capabilities</p>
            <h1 class="max-16">What we are contracted to do.</h1>
            <div class="rule"></div>
            <p class="lede" style="max-width:58ch">Eight services in three groups. Every one of them has a named scope, a stated timeline and a published price range, because a buyer who has to email for a price usually doesn’t.</p>
          </div>
          <div class="card" style="padding:26px 26px 22px;gap:0">
            <h2 class="label" style="margin-bottom:16px">Indicative ranges</h2>
            <div class="rows">
              <div class="row-split"><span class="row-key">Website audit</span><span class="row-val ref">Free</span></div>
              <div class="row-split"><span class="row-key">Rescue</span><span class="row-val num">${PRICES.rescue}</span></div>
              <div class="row-split"><span class="row-key">Starter</span><span class="row-val num">${PRICES.starter}</span></div>
              <div class="row-split"><span class="row-key">Business</span><span class="row-val num">${PRICES.business}</span></div>
              <div class="row-split"><span class="row-key">Platform</span><span class="row-val num">${PRICES.platform}</span></div>
              <div class="row-split"><span class="row-key">Care Plan</span><span class="row-val num">${PRICES.care}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="wrap" style="padding-top:var(--s9)" aria-label="Build">
${groupBlock(GROUPS[0])}
    </section>

    <section class="band-tint" style="margin-top:var(--s9)" aria-label="Analyze">
      <div class="wrap sec-tight">
${groupBlock(GROUPS[1])}
      </div>
    </section>

    <section class="wrap sec-tight" aria-label="Transform">
${groupBlock(GROUPS[2])}

      <div class="cta-panel" style="margin-top:var(--s8)">
        <div class="stack stack-4" style="max-width:640px">
          <h2 style="font-size:clamp(24px,2.4vw,29px)">Not sure which of these you need?</h2>
          <p style="font-size:16.5px;line-height:1.55">Start with the free audit. It takes two minutes, it is yours to keep, and it usually answers the question for you.</p>
        </div>
        <div class="btn-row" style="flex:none">
          <a class="btn" href="/audit">Run the seven checks</a>
          <a class="btn ghost" href="/contact">Talk to us</a>
        </div>
      </div>
    </section>`,
};

/* --------------------------------------------------------------- detail --- */

function detail(s) {
  const caseCards = s.cases
    .map(([h, p]) => `            <div class="card" style="padding:22px 22px 20px;gap:9px"><h3>${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p></div>`)
    .join('\n');

  const gets = s.gets
    .map(([h, p]) => `          <div class="tick">${ICONS.check(20, '#044ECD')}<div><h3 style="margin-bottom:5px">${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p></div></div>`)
    .join('\n');

  const stages = s.stages
    .map(([h, p, when], i) => `          <li><span class="ord">0${i + 1}</span><div><h3 style="margin-bottom:5px">${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p></div><span class="when">${esc(when)}</span></li>`)
    .join('\n');

  return {
    url: `/capabilities/${s.slug}`,
    nav: '/capabilities',
    title: `${s.short} · Hemi Tech Co.`.slice(0, 60),
    description: s.metaDesc || (s.lede.length > 158 ? s.lede.slice(0, 155).trim() + '…' : s.lede),
    body: `    <div class="ground-top">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/capabilities">Capabilities</a><span class="sep" aria-hidden="true">/</span>
          <a href="/capabilities#${s.group.toLowerCase()}">${esc(s.group)}</a><span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">${esc(s.title)}</span>
        </nav>
      </div>
      <div class="wrap" style="padding-top:42px;padding-bottom:58px">
        <div class="split-even" style="grid-template-columns:minmax(0,1.14fr) minmax(0,.86fr);align-items:start">
          <div class="stack stack-5">
            <p class="eyebrow">${esc(s.group)}</p>
            <h1 class="max-16">${esc(s.title)}</h1>
            <div class="rule"></div>
            <p class="body-copy" style="font-size:clamp(16px,1.5vw,19px)">${esc(s.lede)}</p>
          </div>

          <div class="card card-float" style="padding:28px 28px 24px;gap:0">
            <div style="padding-bottom:16px;border-bottom:1px solid var(--line-soft)">
              <span class="label" style="display:block;margin-bottom:6px">Indicative</span>
              <div class="stat-value" style="font-size:22px">${esc(s.from === 'On scope' ? 'On scope' : 'from ' + s.from)}</div>
            </div>
            <div class="row-split" style="padding-block:14px;border-bottom:1px solid var(--line-soft)"><span class="row-key" style="font-weight:600;color:var(--navy-soft)">Typical ${s.timelineLabel.toLowerCase()}</span><span class="row-val" style="font-size:14.5px">${esc(s.timeline)}</span></div>
            <div class="row-split" style="padding-block:14px;border-bottom:1px solid var(--line-soft)"><span class="row-key" style="font-weight:600;color:var(--navy-soft)">Deposit</span><span class="row-val" style="font-size:14.5px">${COMMITMENTS.deposit} to start</span></div>
            <div class="row-split" style="padding-block:14px;border-bottom:1px solid var(--line-soft)"><span class="row-key" style="font-weight:600;color:var(--navy-soft)">Source code</span><span class="row-val" style="font-size:14.5px">Yours at handover</span></div>
            <div class="row-split" style="padding-block:14px"><span class="row-key" style="font-weight:600;color:var(--navy-soft)">Support</span><span class="row-val" style="font-size:14.5px">Care Plan from ${PRICES.care}</span></div>
            <a class="btn btn-full" href="/contact" style="margin-top:18px">Discuss a ${s.group === 'Build' ? 'build' : 'project'}</a>
          </div>
        </div>
      </div>
    </div>

    <section class="wrap" style="padding-top:var(--s9)" aria-labelledby="for-h">
      <div class="split">
        <h2 id="for-h">Who this is for</h2>
        <div class="stack stack-6">
          <p class="body-copy">${esc(s.forWho)}</p>
          <div class="grid grid-2">
${caseCards}
          </div>
        </div>
      </div>
    </section>

    <section class="band-tint" style="margin-top:var(--s9)" aria-labelledby="gets-h">
      <div class="wrap sec-tight split">
        <h2 id="gets-h">What you get</h2>
        <div class="ticks grid-2">
${gets}
        </div>
      </div>
    </section>

    <section class="wrap" style="padding-top:var(--s9)" aria-labelledby="run-h">
      <div class="split">
        <div class="stack stack-4">
          <h2 id="run-h">How the build runs</h2>
          <p style="font-size:15px;line-height:1.55">Each stage ends with something you can open, and a decision you have to make. No month of silence.</p>
        </div>
        <ol class="steps">
${stages}
        </ol>
      </div>
    </section>

    <section class="wrap" style="padding-top:var(--s9);padding-bottom:var(--s9)" aria-labelledby="need-h">
      <div class="panel" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s8)">
        <div class="stack stack-4">
          <p class="eyebrow">What we need from you</p>
          <h2 id="need-h" style="font-size:clamp(22px,2.1vw,26px)">Three things, and a project runs on time.</h2>
          <p style="font-size:15.5px;line-height:1.55">Most delays are not technical. They are a decision nobody was able to make, or data nobody could find.</p>
        </div>
        <ol class="navy-rows need-rows">
          <li><span class="ord">01</span><p><strong>One person who can decide.</strong> Not a committee. Someone who can say yes on a Tuesday.</p></li>
          <li><span class="ord">02</span><p><strong>Access to the people who do the work.</strong> A few hours, early. It prevents a system nobody uses.</p></li>
          <li><span class="ord">03</span><p><strong>Your existing data, as it is.</strong> Messy is fine. We would rather see the real spreadsheet than a cleaned-up one.</p></li>
        </ol>
      </div>
    </section>`,
  };
}

export default [index, ...SERVICES.map(detail)];
