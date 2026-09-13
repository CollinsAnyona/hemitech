// Homepage. From design-source/Main.dc.html (1440) and HomeMobile.dc.html (390).

import { SITE, FACTS, GROUPS, SECTORS, SERVICES, WORK, ORIGIN } from '../site.js';
import { ICONS, esc, phoneLink, checksStatic, quoteMark } from '../layout.js';
import { browserFrame, phoneFrame } from '../shot.js';

const groupServices = (name) => SERVICES.filter((s) => s.group === name);

function capabilityCard(g) {
  const items = groupServices(g.name)
    .map((s) => `              <li><span>${s.short === 'Web platforms & corporate sites' ? 'Web platforms &amp; corporate sites' : esc(s.title)}</span></li>`)
    .join('\n');

  return `          <div class="card">
            ${ICONS[g.icon](26, '#044ECD')}
            <h3>${esc(g.name)}</h3>
            <p style="font-size:15px;line-height:1.55">${g.blurb}</p>
            <ul class="bullets" style="margin-top:4px">
${items}
            </ul>
            ${g.footnote ? `<p class="flow-end">${esc(g.footnote)}</p>` : ''}
          </div>`;
}

// h3, not h4: the section heading above these is an h2, and skipping a level
// is a real navigation problem for anyone moving by headings.
function sectorTile(s) {
  return `          <a class="card" href="/sectors/${s.slug}" style="min-height:186px">
            ${ICONS[s.icon](22, '#0F5FDB')}
            <h3 style="font-size:clamp(15px,1.3vw,17px)">${s.name.replace('&', '&amp;')}</h3>
            <p class="smaller">${s.blurb.replace(/&/g, '&amp;')}</p>
          </a>`;
}

function workCard(w) {
  const frame = w.shotMobile
    ? phoneFrame(`${w.shot}-mobile`, `The ${esc(w.client)} platform on a phone, which is how almost every guest opens it`, { stage: true })
    : browserFrame(`${w.shot}-desktop`, `The ${esc(w.client)} home page as it loads on a laptop`, w.live ? esc(w.live) : 'Private platform');

  return `          <a class="card work-card" href="/work/${w.slug}">
            ${frame}
            <h3 style="margin-top:8px">${esc(w.client)}</h3>
            <p class="smaller">${esc(w.cardBlurb)}</p>
            <span class="flow-end">${w.live ? esc(w.live) : 'Private — details on request'}</span>
          </a>`;
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: ORIGIN + '/',
  email: SITE.email,
  description:
    'Kenyan software and data engineering firm building web platforms, custom systems and data dashboards for organisations across East Africa.',
  areaServed: 'East Africa',
  knowsAbout: [
    'Web platforms',
    'Custom software',
    'Mobile applications',
    'E-commerce and payments',
    'Data analytics',
    'Data protection',
    'Cloud hosting',
    'Systems integration',
  ],
  // telephone and address are deliberately omitted: the real values do not
  // exist yet, and a placeholder must never be emitted into structured data.
};

export default {
  url: '/',
  nav: '/',
  title: 'Software & data engineering, Nairobi — Hemi Tech Co.',
  description:
    'Web platforms, custom systems and data dashboards for government, NGOs, SACCOs and consultancies across East Africa. Fast on mobile data, built for procurement.',
  jsonLd,
  body: `    <div class="ground">
      <div class="wrap hero-grid">
        <div class="stack stack-6">
          <p class="eyebrow">Nairobi · Software &amp; data engineering</p>
          <h1 class="h1-hero">We build the systems East African organisations run on.</h1>
          <div class="rule"></div>
          <p class="lede">Websites, custom platforms and data dashboards for government, development, finance and education — engineered to load fast on mobile data, and documented well enough to pass procurement.</p>
          <div class="btn-row" style="padding-top:6px">
            <a class="btn" href="/audit">Score your website free ${ICONS.arrow(17)}</a>
            <a class="btn ghost" href="/work">See our work</a>
          </div>
        </div>

        <div class="index-card">
          <p class="eyebrow" style="margin-bottom:20px">What we are contracted for</p>
          <div>
            <div class="index-row">
              <span class="index-key">BUILD</span>
              <p class="index-val">Web platforms · Custom software &amp; information systems · Mobile applications · E-commerce and payments</p>
            </div>
            <div class="index-row">
              <span class="index-key">ANALYZE</span>
              <p class="index-val">Data, analytics &amp; M&amp;E dashboards · Data protection and digital compliance</p>
            </div>
            <div class="index-row">
              <span class="index-key">TRANSFORM</span>
              <p class="index-val">Cloud, hosting &amp; managed support · Systems integration</p>
            </div>
          </div>
          <div class="row-split" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--line-soft)">
            <span class="row-key" style="font-weight:600;color:var(--navy-soft)">e-GP Kenya supplier registration</span>
            <span class="row-val ref">[PENDING]</span>
          </div>
        </div>
      </div>

      <div class="proof-strip">
        <div class="wrap">
          <div class="stat"><div class="stat-value">${FACTS.sitesLive}</div><p class="stat-label">Sites live</p></div>
          <div class="stat"><div class="stat-value">${FACTS.inProduction}</div><p class="stat-label">In production</p></div>
          <div class="stat"><div class="stat-value">${FACTS.countries}</div><p class="stat-label">Countries our clients work across</p></div>
          <div class="stat"><div class="stat-value">AGPO</div><p class="stat-label">Youth-owned, certificate [PENDING]</p></div>
          <div class="stat"><div class="stat-value">Nairobi</div><p class="stat-label">Where everything is built</p></div>
        </div>
      </div>
    </div>

    <section class="sec" aria-labelledby="capabilities-h">
      <div class="wrap">
        <div class="head-row">
          <div class="stack stack-4 max-640">
            <p class="eyebrow">Capabilities</p>
            <h2 id="capabilities-h" class="h2-lg">Eight services, grouped the way we actually deliver them.</h2>
          </div>
          <a class="link-arrow" href="/capabilities">All capabilities ${ICONS.arrow(16)}</a>
        </div>

        <div class="grid grid-3">
${GROUPS.map(capabilityCard).join('\n')}
        </div>
      </div>
    </section>

    <section class="band-tint" aria-labelledby="sectors-h">
      <div class="wrap sec">
        <div class="stack stack-4 max-680" style="margin-bottom:40px">
          <p class="eyebrow">Sectors</p>
          <h2 id="sectors-h" class="h2-lg">We write for your sector, not for “businesses”.</h2>
          <p class="lede" style="font-size:17px">A permit portal and a donor dashboard fail in completely different ways. Pick the one you are responsible for.</p>
        </div>

        <div class="grid grid-5">
${SECTORS.map(sectorTile).join('\n')}
        </div>
      </div>
    </section>

    <section class="sec" aria-labelledby="work-h">
      <div class="wrap">
        <div class="split-even">
          <div class="stack stack-5">
            <p class="eyebrow">Selected work</p>
            <h2 id="work-h" class="h2-lg">Joline Geo Consultants</h2>
            <div class="rule"></div>
            <p class="lede" style="font-size:17px">A geotechnical consultancy working across eight countries needed a site that read as credible to procurement teams reviewing three bidders at once.</p>
            <div class="grid grid-2" style="gap:0;border-top:1px solid var(--line);margin-top:6px">
              <div style="padding-block:20px;border-right:1px solid var(--line-soft)">
                <div class="stat-value" style="font-size:27px">[X.Xs]</div>
                <p class="stat-label">Load time, before → after</p>
              </div>
              <div style="padding:20px 0 20px 26px">
                <div class="stat-value" style="font-size:27px">8</div>
                <p class="stat-label">Countries represented</p>
              </div>
            </div>
            <div class="btn-row" style="margin-top:8px">
              <a class="btn" href="/work/joline-geo-consultants">Read the case study</a>
              <a class="btn ghost" href="https://jolinegeoconsultants.org" rel="noopener">Visit the site</a>
            </div>
          </div>

          <figure class="quote-card" style="margin:0">
            <div class="glow-q" aria-hidden="true"></div>
            <div class="inner">
              ${quoteMark(34)}
              <blockquote><p class="quote-text">[JOLINE’S TESTIMONIAL, VERBATIM — already sent by the client, to be pasted in exactly as written.]</p></blockquote>
              <figcaption>
                <div>
                  <div class="who">[NAME, ROLE]</div>
                  <div class="where">Joline Geo Consultants</div>
                </div>
              </figcaption>
            </div>
          </figure>
        </div>

        <div class="head-row" style="margin-top:var(--s9);margin-bottom:24px">
          <h3 style="font-size:19px">Three of the five live now</h3>
          <a class="link-arrow" href="/work">All work ${ICONS.arrow(16)}</a>
        </div>
        <div class="grid grid-3">
${WORK.map(workCard).join('\n')}
        </div>
      </div>
    </section>

    <section class="band-navy" aria-labelledby="audit-h">
      <div class="glow glow-bl" aria-hidden="true"></div>
      <div class="wrap sec">
        <div class="split-even">
          <div class="stack stack-5">
            <p class="eyebrow">The free audit</p>
            <h2 id="audit-h" class="h2-lg">Score your own website in two minutes.</h2>
            <p style="font-size:18px;line-height:1.58" class="max-52">Seven checks, on your phone, on mobile data — the way your clients actually open it. No developer needed, and no obligation to buy anything.</p>
            <p class="max-48" style="color:var(--on-navy-accent);font-size:16px;font-weight:600;line-height:1.55">Most sites scoring 4 or 5 don’t need rebuilding. We’ll tell you if yours doesn’t.</p>
            <div style="margin-top:10px"><a class="btn on-navy" href="/audit">Run the seven checks</a></div>
          </div>

          ${checksStatic()}
        </div>
      </div>
    </section>

    <section class="sec" aria-labelledby="method-h">
      <div class="wrap">
        <div class="stack stack-4 max-680" style="margin-bottom:46px">
          <p class="eyebrow">How we work</p>
          <h2 id="method-h" class="h2-lg">A method you can hold us to, published before you hire us.</h2>
          <p class="lede" style="font-size:17px">Five stages, each with a deliverable and a sign-off. You always know what is coming, what we need from you, and when you will see something.</p>
        </div>

        <ol class="method">
          <li><span class="ord">01</span><h3>Audit</h3><p class="small" style="margin-top:9px">The seven checks, measured. Free, and yours whether or not you hire us.</p></li>
          <li><span class="ord">02</span><h3>Scope</h3><p class="small" style="margin-top:9px">One page: what we found, what it costs you, what we would do, and what that costs.</p></li>
          <li><span class="ord">03</span><h3>Build</h3><p class="small" style="margin-top:9px">Weekly progress you can open in a browser. No month of silence.</p></li>
          <li><span class="ord">04</span><h3>Handover</h3><p class="small" style="margin-top:9px">Code, domain and hosting in your name. Training, and the seven checks run in front of you.</p></li>
          <li><span class="ord">05</span><h3>Care</h3><p class="small" style="margin-top:9px">Hosting, backups, patching and a published response time. Monthly.</p></li>
        </ol>

        <div class="standards-panel" style="margin-top:var(--s8)">
          <div>
            <p class="eyebrow" style="margin-bottom:10px">Load</p>
            <div class="stat-value" style="font-size:26px">&lt; 2.5s</div>
            <p class="smaller" style="margin-top:4px">On mobile data, every page we ship</p>
          </div>
          <div>
            <p class="eyebrow" style="margin-bottom:10px">Uptime</p>
            <div class="stat-value" style="font-size:26px">[99.X%]</div>
            <p class="smaller" style="margin-top:4px">Committed on Care Plan sites</p>
          </div>
          <div>
            <p class="eyebrow" style="margin-bottom:10px">Response</p>
            <div class="stat-value" style="font-size:26px">[X hrs]</div>
            <p class="smaller" style="margin-top:4px">To a reported fault, working hours</p>
          </div>
          <div>
            <p class="eyebrow" style="margin-bottom:10px">Ownership</p>
            <div class="stat-value" style="font-size:26px">Yours</div>
            <p class="smaller" style="margin-top:4px">Code, domain and hosting, at handover</p>
          </div>
        </div>
      </div>
    </section>

    <section class="band-tint" aria-labelledby="cred-h" style="border-bottom:none">
      <div class="wrap sec">
        <div class="split-even" style="grid-template-columns:minmax(0,1fr) minmax(0,1.16fr)">
          <div class="stack stack-5">
            <p class="eyebrow">Credentials</p>
            <h2 id="cred-h" class="h2-lg">Built to clear procurement.</h2>
            <p class="lede" style="font-size:17px">Registration, tax compliance, data protection and preferential-procurement status, listed with their numbers. Our capability statement is one click, not an email request.</p>
            <div class="btn-row" style="margin-top:6px">
              <a class="btn" href="/credentials">${ICONS.download(17)} Capability statement (PDF)</a>
              <a class="btn ghost" href="/contact">Tender enquiries</a>
            </div>
          </div>

          <div class="table">
            <div class="table-head" style="grid-template-columns:minmax(0,1fr) 150px"><div>Registration</div><div style="text-align:right">Reference</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px;border-top:none"><div class="ref" style="font-size:14.5px;font-weight:600">Certificate of Incorporation</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[CPR/...]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">KRA PIN</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[P...]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">Tax Compliance Certificate</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[Valid to ...]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">AGPO certificate — youth</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[PENDING]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">e-GP Kenya supplier</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[PENDING]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">ODPC data processor</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">[PENDING]</div></div>
            <div class="table-row" style="grid-template-columns:minmax(0,1fr) 150px"><div class="ref" style="font-size:14.5px;font-weight:600">CR12</div><div class="status ref" style="font-size:13.5px;color:var(--blue-deep)">On request</div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="wrap" style="padding-top:var(--s10);padding-bottom:var(--s10)" aria-labelledby="cta-h">
      <div class="cta-panel">
        <div class="stack stack-4" style="max-width:620px">
          <h2 id="cta-h" style="font-size:clamp(25px,2.6vw,34px)">Tell us what’s broken.</h2>
          <p style="font-size:17px;line-height:1.55">Four fields. We reply within one working day, and we will tell you plainly if you don’t need us.</p>
        </div>
        <div class="btn-row" style="flex:none">
          <a class="btn" href="/contact">Start a conversation</a>
          <span class="btn ghost">${phoneLink()}</span>
        </div>
      </div>
    </section>`,
};
