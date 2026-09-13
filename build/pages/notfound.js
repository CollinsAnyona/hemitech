// 404. Served by Vercel for any unmatched path, so it carries the full header
// and footer and gives a visitor somewhere to go rather than a dead end.

import { esc, ICONS } from '../layout.js';
import { SITE } from '../site.js';
import { mailLink } from '../layout.js';

export default {
  url: '/404',
  nav: '/404',
  title: 'Page not found — Hemi Tech Co.',
  description:
    'That address does not exist on this site. The capabilities, sectors, work and credentials pages are all one click away, and the free audit is on the homepage.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:72px;padding-bottom:56px">
        <div class="stack stack-5" style="max-width:66ch">
          <p class="eyebrow">404</p>
          <h1>That page isn’t here.</h1>
          <div class="rule"></div>
          <p class="lede">Either the address has a typo in it, or we moved something and did not redirect it properly — which, on a site that sells not doing that, is worth telling us about.</p>
          <p class="body-copy">If you followed a link from somewhere, ${mailLink(SITE.email)} and we will fix it.</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight" aria-labelledby="where-h">
      <h2 id="where-h" style="margin-bottom:26px">Where you were probably going</h2>
      <div class="grid grid-3">
        <a class="card" href="/capabilities"><h3>Capabilities ${ICONS.arrow(16)}</h3><p class="small">Eight services, with timelines and published prices.</p></a>
        <a class="card" href="/sectors"><h3>Sectors ${ICONS.arrow(16)}</h3><p class="small">Government, NGOs, SACCOs, education and professional services.</p></a>
        <a class="card" href="/work"><h3>Work ${ICONS.arrow(16)}</h3><p class="small">What we have built, and what it was built to fix.</p></a>
        <a class="card" href="/credentials"><h3>Credentials ${ICONS.arrow(16)}</h3><p class="small">Registration, tax compliance and procurement status.</p></a>
        <a class="card" href="/audit"><h3>Free website audit ${ICONS.arrow(16)}</h3><p class="small">Seven checks, two minutes, yours to keep.</p></a>
        <a class="card" href="/contact"><h3>Contact ${ICONS.arrow(16)}</h3><p class="small">Four fields. We reply within one working day.</p></a>
      </div>
    </section>`,
};
