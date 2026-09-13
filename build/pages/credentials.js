// Credentials: the page that clears procurement.
// From design-source/Credentials.dc.html.
//
// No reference number is printed that Hemi Tech does not hold. Each row says
// where the application has reached instead.

import { SITE, REGISTRATIONS, COMMITMENTS } from '../site.js';
import { esc, ICONS, phoneLink, mailLink } from '../layout.js';

const row = ([doc, issuer, ref, state, label]) => `        <div class="table-row">
          <div><h3>${esc(doc)}</h3><p>${esc(issuer)}</p></div>
          <div class="ref">${esc(ref)}</div>
          <div class="status"><span class="pill ${state}">${esc(label)}</span></div>
        </div>`;

export default {
  url: '/credentials',
  nav: '/credentials',
  title: 'Credentials for procurement teams · Hemi Tech Co.',
  description:
    'Company registration, tax compliance, data protection and AGPO status with reference numbers, so an evaluation team can verify rather than take our word for it.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:54px">
        <div class="split-even" style="grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);align-items:start">
          <div class="stack stack-5">
            <p class="eyebrow">Credentials</p>
            <h1 class="max-16">Everything a procurement team asks for, on one page.</h1>
            <div class="rule"></div>
            <p class="lede" style="max-width:58ch">Company registration, tax compliance, data protection and preferential-procurement status, with reference numbers, so you can verify rather than take our word for it. Our capability statement is a download, not an email request.</p>
            <div class="btn-row" style="margin-top:8px">
              <a class="btn" href="/contact">${ICONS.download(17)} Capability statement (PDF)</a>
              <a class="btn ghost" href="/contact">Tender enquiries</a>
            </div>
          </div>

          <div class="card card-float" style="padding:28px 28px 24px;gap:0">
            <h2 class="label" style="margin-bottom:18px">Company details</h2>
            <div class="rows">
              <div><p class="smaller" style="font-weight:600;margin-bottom:2px">Registered name</p><p style="font-size:15px;font-weight:700;color:var(--navy)">${esc(SITE.name)}</p></div>
              <div><p class="smaller" style="font-weight:600;margin-bottom:2px">Registered office</p><p style="font-size:15px;font-weight:700;color:var(--navy)">${esc(SITE.addressNote)}</p></div>
              <div><p class="smaller" style="font-weight:600;margin-bottom:2px">Procurement contact</p><p style="font-size:15px;font-weight:700;color:var(--navy)">${esc(SITE.director)}, Director</p></div>
              <div><p class="smaller" style="font-weight:600;margin-bottom:2px">Tender email</p><p style="font-size:15px;font-weight:700">${mailLink(SITE.tenderEmail)}</p></div>
              <div><p class="smaller" style="font-weight:600;margin-bottom:2px">Telephone</p><p style="font-size:15px;font-weight:700;color:var(--navy)">${phoneLink()}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="wrap" style="padding-top:72px" aria-labelledby="reg-h">
      <div class="stack stack-4 max-640" style="margin-bottom:32px">
        <h2 id="reg-h">Registrations and compliance</h2>
        <p style="font-size:16.5px;line-height:1.55">Current status of every document normally required in prequalification. Where something is not yet in place we say so rather than omit it.</p>
      </div>

      <div class="table">
        <div class="table-head"><div>Document</div><div>Reference</div><div style="text-align:right">Status</div></div>
${REGISTRATIONS.map(row).join('\n')}
      </div>

      <p class="small" style="margin-top:18px;max-width:70ch">Certified copies of any document above are supplied with a bid on request. Where a status reads “application in progress” we will tell you exactly where it has reached. We do not print a reference number for a certificate we do not yet hold: an evaluator verifies these against the issuing registry, and a plausible but wrong number is worse than none at all.</p>
    </section>

    <section class="band-tint" style="margin-top:72px" aria-label="Capability statement and references">
      <div class="wrap sec-tight split-even" style="align-items:start">
        <div class="stack stack-5">
          <p class="eyebrow">Capability statement</p>
          <h2>What is in the document.</h2>
          <p style="font-size:16px;line-height:1.55">Eight pages, updated quarterly, written for evaluation rather than for browsing.</p>
          <div class="card" style="padding:8px 24px;gap:0">
            <div class="rows">
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Company profile and legal status</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Services, with delivery method per service</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Project experience with outcomes</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Delivery capacity and associate network</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Quality standards and service levels</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Data protection and information security</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Contactable references</p>
              <p style="font-size:14.5px;font-weight:600;color:var(--navy)">Compliance annexes</p>
            </div>
          </div>
          <a class="btn" href="/contact" style="align-self:flex-start;margin-top:4px">${ICONS.download(17)} Request the capability statement</a>
        </div>

        <div class="stack stack-5">
          <p class="eyebrow">References</p>
          <h2>People who will take the call.</h2>
          <p style="font-size:16px;line-height:1.55">Contact details are released with a bid, with the referee’s permission each time: never published on a web page.</p>
          <div class="stack stack-4">
            <div class="card" style="padding:22px 22px 20px;gap:6px">
              <h3>Joline Geo Consultants</h3>
              <p style="font-size:14.5px;line-height:1.5">Corporate website and analytics. Geotechnical consultancy operating across eight countries.</p>
              <p class="smaller" style="font-weight:700;color:var(--blue-deep);margin-top:6px">Referee available on request</p>
            </div>
            <div class="card" style="padding:22px 22px 20px;gap:6px">
              <h3>Start Walking Foundation</h3>
              <p style="font-size:14.5px;line-height:1.5">Donor-facing website. <strong>A Hemi Tech project</strong>: declared as our own, not presented as independent client work.</p>
              <p class="smaller" style="font-weight:700;color:var(--navy-soft);margin-top:6px">Related party: disclosed</p>
            </div>
            <div class="card card-dashed" style="padding:22px 22px 20px;gap:6px">
              <h3>Whitecrest</h3>
              <p style="font-size:14.5px;line-height:1.5">In production. Listed as a reference once the client has agreed to be named.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="wrap sec-tight" aria-labelledby="sec-h">
      <div class="split" style="grid-template-columns:300px minmax(0,1fr)">
        <div class="stack stack-4">
          <p class="eyebrow">Information security</p>
          <h2 id="sec-h" style="font-size:clamp(22px,2.1vw,26px)">How we handle your data.</h2>
          <p style="font-size:15px;line-height:1.55">Asked in every vendor security review. Answered here so you do not have to ask.</p>
        </div>
        <div class="grid grid-2">
          <div class="card" style="padding:24px 22px;gap:9px"><h3>Lawful basis and consent</h3><p style="font-size:14.5px;line-height:1.5">Every form we build records what it collects, why, and on what basis under the Data Protection Act 2019.</p></div>
          <div class="card" style="padding:24px 22px;gap:9px"><h3>Access control</h3><p style="font-size:14.5px;line-height:1.5">Named accounts, least privilege, and removal of our access at handover unless a Care Plan is in place.</p></div>
          <div class="card" style="padding:24px 22px;gap:9px"><h3>Backups and recovery</h3><p style="font-size:14.5px;line-height:1.5">Daily backups on supported systems, with a stated recovery point and recovery time in the Care Plan terms.</p></div>
          <div class="card" style="padding:24px 22px;gap:9px"><h3>Breach notification</h3><p style="font-size:14.5px;line-height:1.5">We notify you within ${COMMITMENTS.response} of becoming aware, with what we know, so you can meet your own obligations.</p></div>
        </div>
      </div>
    </section>`,
};
