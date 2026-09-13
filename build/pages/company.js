// How we work, Standards, Pricing, About and Insights.
// Content extracted from the design files' own sections (BUILD-BRIEF §9.9–9.11).

import { SITE, PRICES, COMMITMENTS } from '../site.js';
import { esc, ICONS, phoneLink, mailLink, checksStatic, breadcrumbs } from '../layout.js';

/* --------------------------------------------------------- how we work --- */

const STAGES = [
  ['Audit', 'The seven checks, measured rather than estimated. We open your site on a phone, on mobile data, from cold, and write down what happens.', 'Free, and yours whether or not you hire us', '2 days'],
  ['Scope', 'One page: what we found, what it is costing you, what we would do about it, and what that costs. If the answer is “three fixes, not a rebuild”, that is what it says.', 'A fixed price and a date', '1 week'],
  ['Build', 'Weekly progress you can open in a browser. At the end of each block, a working link and a short note on what changed.', 'Something to look at every week', '2–14 weeks'],
  ['Handover', 'Code, domain and hosting transferred into your name. Training for the people who will use it, and the seven checks run in front of you.', 'Ownership, in writing', '1 week'],
  ['Care', 'Hosting, backups, patching, certificate renewal and monitoring, with a response time we publish rather than one you discover during an outage.', 'A monthly report, one page', 'Monthly'],
];

const howWeWork = {
  url: '/how-we-work',
  nav: '/how-we-work',
  title: 'How we work · five stages, published · Hemi Tech Co.',
  description:
    'Five stages, each with a deliverable and a sign-off: audit, scope, build, handover, care. You know what is coming, what we need, and when you will see it.',
  jsonLd: breadcrumbs([['How we work', '/how-we-work']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">How we work</p>
          <h1 class="max-20">A method you can hold us to, published before you hire us.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">Five stages, each with a deliverable and a sign-off. You always know what is coming, what we need from you, and when you will see something.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="stages-h">
      <h2 id="stages-h" class="visually-hidden">The five stages</h2>
      <ol class="steps">
${STAGES.map(([h, p, deliverable, when], i) => `        <li><span class="ord">0${i + 1}</span><div><h3 style="margin-bottom:5px">${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p><p class="smaller" style="margin-top:8px;color:var(--blue-deep);font-weight:600">${esc(deliverable)}</p></div><span class="when">${esc(when)}</span></li>`).join('\n')}
      </ol>
    </section>

    <section class="band-tint" aria-labelledby="need-h">
      <div class="wrap sec-tight split">
        <div class="stack stack-4">
          <p class="eyebrow">What we need from you</p>
          <h2 id="need-h">Three things, and a project runs on time.</h2>
          <p style="font-size:15px;line-height:1.55">Most delays are not technical. They are a decision nobody was able to make, or data nobody could find.</p>
        </div>
        <ol class="navy-rows need-rows">
          <li><span class="ord">01</span><p><strong>One person who can decide.</strong> Not a committee. Someone who can say yes on a Tuesday.</p></li>
          <li><span class="ord">02</span><p><strong>Access to the people who do the work.</strong> A few hours, early. It prevents a system nobody uses.</p></li>
          <li><span class="ord">03</span><p><strong>Your existing data, as it is.</strong> Messy is fine. We would rather see the real spreadsheet than a cleaned-up one.</p></li>
        </ol>
      </div>
    </section>

    <section class="band-navy" aria-labelledby="start-h">
      <div class="glow glow-bl" aria-hidden="true"></div>
      <div class="wrap sec-tight">
        <div class="split-even">
          <div class="stack stack-5">
            <p class="eyebrow">Stage one</p>
            <h2 id="start-h" class="h2-lg">It starts with the audit, and the audit is free.</h2>
            <p style="font-size:18px;line-height:1.58" class="max-52">Seven checks, on your phone, on mobile data. You can run them yourself in two minutes, or send us the address and we will run them properly and write it up.</p>
            <div style="margin-top:10px"><a class="btn on-navy" href="/audit">Run the seven checks</a></div>
          </div>
          ${checksStatic()}
        </div>
      </div>
    </section>`,
};

/* ----------------------------------------------------------- standards --- */

const standards = {
  url: '/standards',
  nav: '/how-we-work',
  title: 'Standards we build to and publish · Hemi Tech Co.',
  description:
    'Load under 2.5 seconds on mobile data, WCAG 2.2 AA, source code and hosting in your name, and a published response time. In our standard terms, not per project.',
  jsonLd: breadcrumbs([['Standards', '/standards']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">Standards</p>
          <h1 class="max-20">Published before you contract us, so you have something to point at.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">These are in our standard terms, not negotiated per project. Every one of them is a number somebody can hold us to, which is the only kind worth publishing.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="commit-h">
      <h2 id="commit-h" style="margin-bottom:32px">What we commit to</h2>
      <ul class="commitments">
        <li><span class="key">Page load on mobile data</span><span class="val">under 2.5s</span></li>
        <li><span class="key">Largest Contentful Paint, throttled mobile</span><span class="val">under 2.5s</span></li>
        <li><span class="key">Cumulative Layout Shift</span><span class="val">under 0.05</span></li>
        <li><span class="key">Accessibility</span><span class="val">WCAG 2.2 AA</span></li>
        <li><span class="key">Uptime on supported systems</span><span class="val">${COMMITMENTS.uptime}</span></li>
        <li><span class="key">Response to a reported fault</span><span class="val">${COMMITMENTS.response}</span></li>
        <li><span class="key">Backups on supported systems</span><span class="val">Daily</span></li>
        <li><span class="key">Data residency</span><span class="val">${COMMITMENTS.residency}</span></li>
        <li><span class="key">Source code &amp; hosting ownership</span><span class="val">Yours</span></li>
      </ul>
    </section>

    <section class="band-tint" aria-labelledby="own-h">
      <div class="wrap sec-tight split">
        <div class="stack stack-4">
          <p class="eyebrow">Our own site</p>
          <h2 id="own-h">We run the seven checks on ourselves.</h2>
          <p style="font-size:15px;line-height:1.55">A supplier who sells load time and accessibility, on a site that fails both, is selling nothing. So the standard above is the standard this page is built to.</p>
        </div>
        <div class="stack stack-5">
          <div class="grid grid-2">
            <div class="card"><h3>No third-party fonts</h3><p class="small">Montserrat is self-hosted and subset. Nothing on the critical path comes from another domain.</p></div>
            <div class="card"><h3>No framework</h3><p class="small">Static HTML, one stylesheet, and two small scripts. A framework runtime is a tax on every page view.</p></div>
            <div class="card"><h3>No tracking that needs a banner</h3><p class="small">Cookieless and privacy-respecting, or nothing at all. A consent banner on a page selling data protection is an own goal.</p></div>
            <div class="card"><h3>Works without JavaScript</h3><p class="small">Every page is readable and navigable with scripting off, and both forms still submit.</p></div>
          </div>
          <p class="small">The measured results of our own audit are published with each release. Current figures: <a href="/audit">run the checks yourself</a>: the point of the test is that you do not have to take our word for it.</p>
        </div>
      </div>
    </section>`,
};

/* ------------------------------------------------------------- pricing --- */

const PACKAGES = [
  ['Website audit', 'Free', 'Seven checks run properly and written up. Yours to keep and act on, whether or not you hire us.', ['Measured load time on mobile data', 'What we found, in order of what it costs you', 'What we would do, and what that costs', 'No obligation of any kind'], false],
  ['Rescue', PRICES.rescue, 'We fix what the audit found. No rebuild, no new design, no retainer required.', ['The specific faults the audit identified', 'Speed, mobile layout and contact fixes', 'HTTPS and a working phone link', 'The seven checks re-run at the end'], false],
  ['Starter', PRICES.starter, 'Five to seven pages, built properly, in weeks not months. For when patching costs more than starting again.', ['Five to seven pages', 'Custom design, mobile-first', 'Content structure you can edit', 'Training and full handover'], true],
  ['Business', PRICES.business, 'A larger site with the things a serious organisation needs, including payments where they are part of the job.', ['Everything in Starter', 'More pages and sections', 'E-commerce or M-Pesa payments where needed', 'Analytics set up to answer a question'], false],
  ['Platform', PRICES.platform, 'Custom software: a process, not a brochure. Scoped and priced against a written specification.', ['Process mapping and data model', 'Roles, permissions and audit trail', 'Reporting built in', 'Source code and documentation, yours'], false],
  ['Care Plan', PRICES.care, 'Hosting, backups, patching and monitoring with a published response time. Monthly, cancel anytime.', ['Managed hosting and certificates', 'Daily backups, tested', 'Security patching on a schedule', 'A one-page monthly report'], false],
];

const pricing = {
  url: '/pricing',
  nav: '/how-we-work',
  title: 'Pricing · published ranges, not “on request” · Hemi Tech Co.',
  description:
    'Audit free, Rescue KES 65,000, Starter KES 145,000, Business KES 295,000, Platform from KES 650,000, Care Plan KES 14,000 a month. Published, not on request.',
  jsonLd: breadcrumbs([['Pricing', '/pricing']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">Pricing</p>
          <h1 class="max-20">Published, because a buyer who has to email for a price usually doesn’t.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">These are real ranges, not anchors. Where a job genuinely depends on scope we say “on scope” rather than printing a number we would immediately renegotiate.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="pkg-h">
      <h2 id="pkg-h" class="visually-hidden">Packages</h2>
      <div class="grid grid-3">
${PACKAGES.map(([name, price, blurb, items, featured]) => `        <div class="card${featured ? ' card-float' : ''}" style="gap:14px">
          <div class="row-split" style="align-items:baseline">
            <h3>${esc(name)}</h3>
            ${featured ? '<span class="pill ok">Most chosen</span>' : ''}
          </div>
          <div class="stat-value" style="font-size:24px">${esc(price)}</div>
          <p class="small">${esc(blurb)}</p>
          <ul class="bullets" style="margin-top:4px">
${items.map((i) => `            <li><span>${esc(i)}</span></li>`).join('\n')}
          </ul>
        </div>`).join('\n')}
      </div>

      <div class="grid grid-2" style="margin-top:var(--s8)">
        <div class="card"><h3>Deposit</h3><p class="small">${COMMITMENTS.deposit} to start, the balance on handover. Larger projects are staged against the blocks in the scope document.</p></div>
        <div class="card"><h3>What is never extra</h3><p class="small">Handover of code, domain and hosting. Training. The seven checks run in front of you at the end. None of these is a line item.</p></div>
      </div>
    </section>

    <section class="band-tint" aria-labelledby="which-h">
      <div class="wrap sec-tight">
        <div class="cta-panel" style="background:#fff">
          <div class="stack stack-4" style="max-width:640px">
            <h2 id="which-h" style="font-size:clamp(24px,2.4vw,29px)">Not sure which of these you need?</h2>
            <p style="font-size:16.5px;line-height:1.55">Start with the free audit. Most sites scoring 4 or 5 need three fixes, not a rebuild, and we will tell you so rather than sell you a Starter.</p>
          </div>
          <div class="btn-row" style="flex:none">
            <a class="btn" href="/audit">Run the seven checks</a>
            <a class="btn ghost" href="/contact">Talk to us</a>
          </div>
        </div>
      </div>
    </section>`,
};

/* --------------------------------------------------------------- about --- */

const about = {
  url: '/about',
  nav: '/how-we-work',
  title: 'About Hemi Tech Co. · who actually does the work',
  description:
    'A small Nairobi software and data engineering firm. You deal with the person who writes the code, and the work is done in Kenya by people you can name.',
  jsonLd: breadcrumbs([['About', '/about']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">About</p>
          <h1 class="max-20">Small, Nairobi-based, and you deal with the person who does the work.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">There is no account manager between you and the build. That is the whole proposition: a firm this size cannot hide behind a department, so it does not try to.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="who-h">
      <div class="split-even" style="grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);align-items:start">
        <figure style="margin:0">
          <img class="portrait" src="/Images/Team/collins-anyona.jpg" alt="Collins Anyona, director of Hemi Tech Co." width="600" height="600" loading="lazy" decoding="async">
          <figcaption class="smaller" style="margin-top:12px">Collins Anyona, director. Nairobi.</figcaption>
        </figure>
        <div class="stack stack-5">
          <h2 id="who-h">Who you are dealing with</h2>
          <p class="body-copy">Hemi Tech Co. is a Kenyan software and data engineering practice working with government, development organisations, financial co-operatives, schools and consultancies across East Africa.</p>
          <p class="body-copy">The firm is deliberately small and works with a network of associates on larger builds. What that buys a client is directness: the person scoping the work is the person building it, and a decision does not have to travel through three people to reach somebody who can make it.</p>
          <p class="body-copy">What it does not buy is a large delivery team, and we say so before a contract rather than after. Where a project needs more hands than we have, we say that too.</p>
          <div class="grid grid-2" style="margin-top:var(--s2)">
            <div class="card"><h3>Where the work happens</h3><p class="small">Nairobi. Everything is built here, by people in this country.</p></div>
            <div class="card"><h3>Who owns what you buy</h3><p class="small">You do: code, domain and hosting, transferred at handover. Every time, without asking.</p></div>
          </div>
        </div>
      </div>
    </section>

    <section class="band-tint" aria-labelledby="why-h">
      <div class="wrap sec-tight split">
        <div class="stack stack-4">
          <p class="eyebrow">Why the audit exists</p>
          <h2 id="why-h">We would rather be useful than be chosen.</h2>
        </div>
        <div class="stack stack-5">
          <p class="body-copy">Most of the sites we are asked to look at do not need rebuilding. They need three things fixed, and the organisation has been quoted for a rebuild because a rebuild is what gets sold.</p>
          <p class="body-copy">So the audit is free and the report is yours, including the times when the honest answer is “this is fine, do not spend the money”. It costs us a couple of hours and it is the only advertising we have found that a procurement officer actually respects.</p>
          <div class="btn-row">
            <a class="btn" href="/audit">Run the seven checks</a>
            <a class="btn ghost" href="/credentials">Credentials</a>
          </div>
        </div>
      </div>
    </section>

    <section class="wrap sec-tight" aria-labelledby="reach-h">
      <div class="panel">
        <div class="stack stack-4">
          <h2 id="reach-h" style="font-size:clamp(22px,2.1vw,26px)">How to reach us</h2>
          <p class="body-copy">${phoneLink()} · ${mailLink(SITE.email)} · ${esc(SITE.address)}${SITE.address !== SITE.city ? `, ${esc(SITE.city)}` : ''}</p>
          <p class="small">Tender and prequalification queries go to ${mailLink(SITE.tenderEmail)} and are answered within one working day.</p>
        </div>
      </div>
    </section>`,
};

/* ------------------------------------------------------------ insights --- */
// Built last and deliberately empty. Padding it with three posts written to
// fill a grid would be exactly the thing this site argues against.

const insights = {
  url: '/insights',
  nav: '/insights',
  title: 'Insights · Hemi Tech Co.',
  description:
    'Notes on building things that load quickly in East Africa: procurement, mobile data, accessibility and the Data Protection Act. Nothing yet, and never padded.',
  jsonLd: breadcrumbs([['Insights', '/insights']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">Insights</p>
          <h1 class="max-20">Nothing here yet, and we are not going to pad it.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">When we publish here it will be because we learned something worth the reading time: measured, from a real project, and specific to building things that have to work on mobile data in this region.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="soon-h">
      <div class="split">
        <h2 id="soon-h">What will be here</h2>
        <div class="stack stack-5">
          <div class="grid grid-2">
            <div class="card"><h3>Procurement</h3><p class="small">What an evaluation committee actually checks, and which of it a supplier can prepare in advance.</p></div>
            <div class="card"><h3>Load time</h3><p class="small">Measured numbers from real sites on real connections, and what moved them.</p></div>
            <div class="card"><h3>The Data Protection Act</h3><p class="small">What it means for an ordinary web form, in plain language, without a law firm.</p></div>
            <div class="card"><h3>Accessibility</h3><p class="small">The handful of things that fix most of a WCAG audit, and why they are also the cheap ones.</p></div>
          </div>
          <p class="small">In the meantime, the <a href="/audit">seven checks</a> are the most useful thing we could give you, and they are free.</p>
        </div>
      </div>
    </section>`,
};

export default [howWeWork, standards, pricing, about, insights];
