// Work index and the case studies.
// From design-source/CaseStudy.dc.html.
//
// Whitecrest is not cleared for publication: it appears as a dashed "in
// production" card with no screenshot, no client testimonial and no page,
// and stays that way until the client signs off (BUILD-BRIEF §8, §12).

import { WORK } from '../site.js';
import { esc, ICONS, quoteMark, breadcrumbs } from '../layout.js';
import { browserFrame, phoneFrame } from '../shot.js';

// `stage` puts a portrait shot on a landscape panel, so a phone frame does not
// make its card twice the height of the two beside it in a row.
const frameFor = (w, { priority = false, stage = false } = {}) =>
  w.shotMobile
    ? phoneFrame(`${w.shot}-mobile`, `The ${esc(w.client)} platform on a phone, which is how almost every guest opens it`, { priority, stage })
    : browserFrame(`${w.shot}-desktop`, `The ${esc(w.client)} home page as it loads on a laptop`, w.live ? esc(w.live) : 'Private platform', { priority });

const index = {
  url: '/work',
  nav: '/work',
  title: 'Work · sites we have built and shipped · Hemi Tech Co.',
  description:
    'Five sites live and one in production: a consultancy working across eight countries, a donor-facing foundation site, and an event platform used on phones.',
  jsonLd: breadcrumbs([['Work', '/work']]),
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">Selected work</p>
          <h1 class="max-20">Five live, one in production, none of them a template.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">Every one of these was built to open quickly on a phone, on mobile data, for somebody who was comparing it with something else at the time.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-label="Projects">
      <div class="grid grid-3">
${WORK.map((w, i) => `        <a class="card work-card" href="/work/${w.slug}">
          ${frameFor(w, { priority: i === 0, stage: true })}
          <p class="eyebrow" style="font-size:11px;margin-top:8px">${esc(w.kicker.replace('Case study · ', ''))}</p>
          <h2 style="font-size:19px;font-weight:700;letter-spacing:-.012em">${esc(w.client)}</h2>
          <p class="small">${esc(w.cardBlurb)}</p>
          <span class="flow-end">${w.live ? esc(w.live) : 'Private: details on request'}</span>
        </a>`).join('\n')}

        <div class="card card-dashed" style="min-height:200px">
          <p class="eyebrow" style="font-size:11px;color:var(--navy-soft)">In production</p>
          <h2 style="font-size:19px;font-weight:700;letter-spacing:-.012em;color:var(--navy-soft)">Whitecrest</h2>
          <p class="small">Published here once the client has signed off on us showing it. Not before.</p>
        </div>
      </div>

      <div class="cta-panel" style="margin-top:var(--s8)">
        <div class="stack stack-4" style="max-width:640px">
          <h2 style="font-size:clamp(24px,2.4vw,29px)">Want to know what yours would score?</h2>
          <p style="font-size:16.5px;line-height:1.55">The seven checks take two minutes on your own phone, and the answer is yours whether or not you ever hire us.</p>
        </div>
        <div class="btn-row" style="flex:none">
          <a class="btn" href="/audit">Run the seven checks</a>
          <a class="btn ghost" href="/contact">Talk to us</a>
        </div>
      </div>
    </section>`,
};

/* ---------------------------------------------------------- case studies -- */

const NARRATIVES = {
  'joline-geo-consultants': {
    h1: 'A geotechnical consultancy that had to look as serious as its engineering.',
    standfirst:
      'Joline Geo Consultants works on ground investigation across eight countries. Their expertise was never the problem: being taken seriously by a procurement team comparing three bidders on a screen was.',
    problem: [
      'Ground investigation is bought by procurement teams, not by enthusiasts. A tender committee shortlisting three consultancies will open all three websites in a row, usually on a phone, usually between other meetings. Whatever they conclude in those thirty seconds is what the technical submission has to overcome.',
      'Joline’s previous site made that harder than it needed to be. It was slow to open, it did not say plainly what the firm did or where it worked, and the depth of experience behind it: eight countries of project history: was invisible until the third click, which nobody makes.',
    ],
    pull: 'The engineering was never in doubt. The thirty seconds before anyone reads the engineering: that was the problem.',
    built: [
      'A site that answers the procurement question in its first line and proves it immediately afterwards. Services stated in the language a tender document uses. Project experience surfaced on the homepage rather than buried in a portfolio. Country coverage shown as a fact rather than described as a claim.',
      'Underneath, it was built for the connection it would actually be opened on: no heavy imagery, no framework overhead, and a content structure their own team can update without calling us.',
    ],
    points: [
      ['Credibility in the first screen', 'What the firm does, where it works, and the scale of its project history, before any scrolling.'],
      ['Built for mobile data', 'Optimised assets and a light page weight, so it opens on a phone in the field, not just on office wifi.'],
      ['Editable by their own team', 'New projects and capabilities added without a developer, so the site stays current between engagements.'],
      ['Analytics that answer a question', 'Which pages bring enquiries, and which do not, so future work is decided on evidence.'],
    ],
    result:
      'The site now loads in 2.3 seconds on mobile data, and it scores 7 out of 7 on the same seven-point test we publish for everybody else. Country coverage is stated on the first screen rather than buried, and the firm’s own team adds project experience without calling us.',
    quote:
      'HemiTech understood exactly what a geoscience consultancy needed to look credible to institutional clients. The platform they built communicates technical authority the moment you land on it.',
    who: 'Joline Geo Consultants',
    role: 'Web platform and brand identity',
    initials: 'JG',
  },
  'start-walking-foundation': {
    h1: 'A foundation that had to explain itself to a donor in under a minute.',
    standfirst:
      'Start Walking Foundation is a Hemi Tech project. We declare it as our own work rather than presenting it as independent client work. It is included here because the constraint was real and the build is public.',
    problem: [
      'Small foundations are read quickly and sceptically. A programme officer opening the site wants to know what the organisation does, where it does it, who runs it and whether the money is accounted for, and it wants all four before deciding whether to keep reading.',
      'The material existed. What it lacked was an order: the work was described at length before it was described at all, and the things a donor checks first were the things furthest down the page.',
    ],
    pull: 'A donor does not read a website. They audit it, quickly, looking for reasons to stop.',
    built: [
      'A structure that front-loads the answerable questions: what the programme is, who it reaches, where it operates, and who is accountable for it. Everything a first-time reader needs is above the fold; everything a serious reader needs is one click behind it.',
      'Built on the same terms as any client site: light pages, no framework, no stock photography, and content the organisation can edit itself.',
    ],
    points: [
      ['The first minute planned deliberately', 'What the organisation does and who it serves, stated before anything is elaborated.'],
      ['Accountability made visible', 'Governance and reporting reachable rather than requested by email.'],
      ['Built for the phone', 'Most visits are mobile, frequently on a poor connection. The page weight reflects that.'],
      ['Declared as our own', 'Listed as a Hemi Tech project wherever it appears, never as arms-length client work.'],
    ],
    result:
      'The site is live and the first screen now answers the four questions a programme officer asks before deciding whether to keep reading. Load time and enquiry figures are not published here: this is our own project, and we are not going to quote numbers about ourselves that nobody independent has checked.',
    quote: null,
    who: null,
    role: null,
    initials: 'SW',
  },
  'nyombo-ceremony': {
    h1: 'An event platform where nearly every visit is a phone on patchy data.',
    standfirst:
      'A private platform for a Nyombo ceremony, opened almost entirely on phones, often on a weak connection, frequently by people who had been sent a link and nothing else.',
    problem: [
      'An event site has one job and a very short window in which to do it. Guests arrive from a forwarded message, on whatever device is in their hand, and need the date, the place and what is being asked of them: immediately, without an app, without an account, and without pinching.',
      'It also has to hold up in bursts: everybody opens it in the same two days, and a proportion of them are on a connection that will not tolerate a heavy page.',
    ],
    pull: 'Nobody installs anything for an event. If it does not open on the first tap, it does not get opened.',
    built: [
      'A platform designed mobile-first rather than adapted to mobile: the phone layout is the real one, and the desktop view is the variant. Every essential fact is on the first screen, and nothing that matters is behind an interaction.',
      'Light enough to open on a poor connection, with no account required to read anything a guest needs.',
    ],
    points: [
      ['Mobile is the primary layout', 'Designed at 390px first, because that is what almost every visitor uses.'],
      ['Readable on one bar', 'A page-weight budget held to deliberately, so the first tap succeeds.'],
      ['Nothing behind a login', 'Everything a guest needs is public and immediate.'],
      ['Private by arrangement', 'The client is not named beyond this page, and details are shared on request.'],
    ],
    result: 'The platform is private, so there are no public figures to quote. What can be said is the constraint it was built to: the phone layout is the real one, nothing a guest needs sits behind an interaction, and the page weight was held to a budget so the first tap succeeds on a weak connection.',
    quote: null,
    who: null,
    role: null,
    initials: 'NC',
  },
};

// Measured, not asserted. Only Joline carries a figure strip, because only
// Joline has numbers we measured against a live public site. Start Walking is
// our own project and Nyombo is private, so neither gets one: an empty strip
// is better than a padded one.
const OUTCOMES = {
  'joline-geo-consultants': [
    ['2.3s', 'Load time on mobile data', true, '2.3', 's'],
    ['7/7', 'On our seven-point test', false, null, null],
    ['8', 'Countries represented on the site', true, '8', ''],
    ['Yours', 'Code, domain and hosting at handover', false, null, null],
  ],
};

function outcomeStrip(w) {
  const stats = OUTCOMES[w.slug];
  if (!stats) return '';

  const cell = ([value, label, counts, to, suffix], i) => {
    const colour = i === 0 ? 'var(--blue-lgt)' : '#fff';
    const count = counts ? ` data-count="${to}" data-count-suffix="${suffix}"` : '';
    return `        <div class="reveal"><div class="stat-value num" style="font-size:clamp(30px,3.4vw,42px);color:${colour}"${count}>${value}</div><p class="stat-label" style="color:var(--on-navy-3);margin-top:8px;font-size:14px">${label}</p></div>`;
  };

  return `    <div class="band-navy">
      <div class="wrap grid grid-4 stagger" style="padding-top:52px;padding-bottom:52px;gap:40px">
${stats.map(cell).join('\n')}
      </div>
    </div>`;
}

function otherWork(current) {
  const others = WORK.filter((w) => w.slug !== current);
  return `      <div class="grid grid-3">
${others.map((w) => `        <a class="card" href="/work/${w.slug}" style="min-height:200px">
          <p class="eyebrow" style="font-size:11px">${esc(w.kicker.replace('Case study · ', ''))}</p>
          <h3>${esc(w.client)}</h3>
          <p class="small">${esc(w.cardBlurb)}</p>
          <span class="flow-end">${w.live ? esc(w.live) : 'Private: details on request'}</span>
        </a>`).join('\n')}
        <div class="card card-dashed" style="min-height:200px">
          <p class="eyebrow" style="font-size:11px;color:var(--navy-soft)">In production</p>
          <h3>Whitecrest</h3>
          <p class="small">Published here once the client has signed off on us showing it. Not before.</p>
        </div>
      </div>`;
}

function caseStudy(w) {
  const n = NARRATIVES[w.slug];

  const quote = n.quote
    ? `    <section class="wrap" style="padding-top:40px;padding-bottom:var(--s9)">
      <figure class="quote-card" style="margin:0;padding:56px 60px">
        <div class="glow-q" aria-hidden="true"></div>
        <div class="inner" style="max-width:800px">
          ${quoteMark(40)}
          <blockquote><p class="quote-text" style="font-size:clamp(17px,2.1vw,25px);line-height:1.48">${esc(n.quote)}</p></blockquote>
          <figcaption style="margin-top:38px;padding-top:24px">
            <span class="avatar" aria-hidden="true">${esc(n.initials)}</span>
            <div>
              <div class="who" style="font-size:16px">${esc(n.who)}</div>
              <div class="where" style="font-size:14.5px">${esc(n.role)}</div>
            </div>
          </figcaption>
        </div>
      </figure>
    </section>`
    : '';   // No quotation has been given in writing, so no section is rendered.
                // An empty panel announcing an absence is worse than the absence.

  return {
    url: `/work/${w.slug}`,
    nav: '/work',
    title: `${w.client} case study · Hemi Tech Co.`.slice(0, 60),
    description: n.standfirst.length > 158 ? n.standfirst.slice(0, 155).trim() + '…' : n.standfirst,
    jsonLd: breadcrumbs([['Work', '/work'], [w.client, `/work/${w.slug}`]]),
    body: `    <div class="ground-top">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/work">Work</a><span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">${esc(w.client)}</span>
        </nav>
      </div>
      <div class="wrap" style="padding-top:44px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">${esc(w.kicker)}</p>
          <h1 class="max-20">${esc(n.h1)}</h1>
          <div class="rule"></div>
          <p class="body-copy" style="font-size:clamp(16px,1.6vw,17.5px);line-height:1.68">${esc(n.standfirst)}</p>
        </div>
      </div>

      <div style="border-top:1px solid var(--line)">
        <div class="wrap grid grid-4" style="gap:0">
          <div style="padding-block:24px"><span class="label">Client</span><p style="font-size:15.5px;font-weight:700;color:var(--navy);margin-top:7px">${esc(w.client)}</p></div>
          <div style="padding-block:24px"><span class="label">Sector</span><p style="font-size:15.5px;font-weight:700;color:var(--navy);margin-top:7px">${esc(w.sector)}</p></div>
          <div style="padding-block:24px"><span class="label">Services</span><p style="font-size:15.5px;font-weight:700;color:var(--navy);margin-top:7px">${esc(w.services)}</p></div>
          <div style="padding-block:24px"><span class="label">Live at</span><p style="font-size:15.5px;font-weight:700;margin-top:7px">${w.live ? `<a href="${w.liveUrl}" rel="noopener">${esc(w.live)}</a>` : 'Private: details on request'}</p></div>
        </div>
      </div>
    </div>

${outcomeStrip(w)}

    <section class="wrap" style="padding-top:var(--s9);padding-bottom:20px">
      <div class="narrow prose">
        <h2>The problem</h2>
${n.problem.map((p) => `        <p>${esc(p)}</p>`).join('\n')}

        <div class="pull-quote" style="margin-block:var(--s7)">
          <p>${esc(n.pull)}</p>
        </div>

        <h2>What we built</h2>
${n.built.map((p) => `        <p>${esc(p)}</p>`).join('\n')}

        <div class="grid grid-2" style="margin-top:var(--s6);margin-bottom:var(--s7)">
${n.points.map(([h, p]) => `          <div class="card" style="padding:24px 22px;gap:9px"><h3>${esc(h)}</h3><p style="font-size:14.5px;line-height:1.5">${esc(p)}</p></div>`).join('\n')}
        </div>

        <h2>The result</h2>
        <p>${esc(n.result)}</p>

        <h2>How it looks</h2>
        <p>The capture below is the live site as it loads today. It is a real screenshot of real work, not a mockup.</p>
      </div>

      <div class="narrow" style="margin-top:var(--s6)">
        ${frameFor(w)}
      </div>
    </section>

${quote}

    <section class="band-tint" style="border-bottom:none" aria-labelledby="more-h">
      <div class="wrap sec-tight">
        <div class="head-row" style="margin-bottom:34px">
          <h2 id="more-h">More work</h2>
          <a class="link-arrow" href="/work">All projects ${ICONS.arrow(16)}</a>
        </div>
${otherWork(w.slug)}
      </div>
    </section>`,
  };
}

export default [index, ...WORK.map(caseStudy)];
