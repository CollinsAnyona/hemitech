// Contact. From design-source/Contact.dc.html.
//
// The form posts to /api/contact. With JavaScript it replies in place; without
// it, the same endpoint accepts a normal form post and redirects to a real
// page, so nothing is ever lost and no raw JSON is shown to a person.

import { SITE } from '../site.js';
import { esc, ICONS, phoneLink, mailLink } from '../layout.js';

const contact = {
  url: '/contact',
  nav: '/contact',
  title: 'Contact · tell us what’s broken · Hemi Tech Co.',
  description:
    'Four fields, because every extra one costs a reply. We answer within one working day from a person, and we will tell you plainly if you do not need us.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:60px;padding-bottom:48px">
        <div class="stack stack-5">
          <p class="eyebrow">Contact</p>
          <h1 style="max-width:14ch">Tell us what’s broken.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:60ch">Four fields, because every extra one costs a reply. We answer within one working day, and we will tell you plainly if you don’t need us.</p>
        </div>
      </div>
    </div>

    <div class="wrap contact-grid" style="padding-top:56px;padding-bottom:80px">
      <section aria-labelledby="form-h">
        <h2 id="form-h" class="visually-hidden">Send us a message</h2>

        <form id="contact-form" method="post" action="/api/contact">
          <div class="form-grid">
            <div class="field-block">
              <label for="c-name">Your name</label>
              <input id="c-name" class="field" type="text" name="name" placeholder="Jane Wanjiru" autocomplete="name" required>
              <p class="field-error" id="c-name-error"></p>
            </div>
            <div class="field-block">
              <label for="c-org">Organisation</label>
              <input id="c-org" class="field" type="text" name="organisation" placeholder="Kitui County Government" autocomplete="organization" required>
              <p class="field-error" id="c-organisation-error"></p>
            </div>
          </div>

          <div class="form-grid" style="margin-top:22px">
            <div class="field-block">
              <label for="c-email">Email</label>
              <input id="c-email" class="field" type="email" name="email" placeholder="jane@organisation.go.ke" autocomplete="email" required>
              <p class="field-error" id="c-email-error"></p>
            </div>
            <div class="field-block">
              <label for="c-site">Website <span class="optional">(optional)</span></label>
              <input id="c-site" class="field" type="text" name="website" placeholder="yoursite.co.ke" autocomplete="url">
              <p class="field-error" id="c-website-error"></p>
            </div>
          </div>

          <div class="field-block" style="margin-top:22px">
            <label for="c-msg">What do you need?</label>
            <textarea id="c-msg" class="field" name="message" placeholder="A sentence is enough. If it is a tender, tell us the reference number and the closing date." required></textarea>
            <p class="field-error" id="c-message-error"></p>
          </div>

          <div class="honeypot" aria-hidden="true">
            <label for="c-company">Company (leave this blank)</label>
            <input id="c-company" type="text" name="company" tabindex="-1" autocomplete="off">
          </div>

          <div class="submit-row">
            <button class="btn" type="submit" style="padding:0 34px">Send</button>
            <p class="form-note">We use what you send only to reply to you. Nothing is added to a mailing list. <a href="/privacy">Privacy notice</a></p>
          </div>

          <p class="form-status" id="contact-status" role="status" aria-live="polite"></p>
        </form>
      </section>

      <aside class="stack stack-5" aria-labelledby="direct-h">
        <div class="card" style="background:var(--tint);padding:28px 26px;gap:0">
          <h2 id="direct-h" class="label" style="margin-bottom:18px">Direct</h2>
          <div class="direct-rows">
            <div class="direct-row">
              ${ICONS.phone(20, '#044ECD')}
              <div><div class="direct-value">${phoneLink()}</div><p class="smaller" style="font-weight:600">Mon–Fri, 8am–6pm EAT</p></div>
            </div>
            <a class="direct-row" href="mailto:${SITE.email}">
              ${ICONS.mail(20, '#044ECD')}
              <div><span class="direct-value">${esc(SITE.email)}</span><p class="smaller" style="font-weight:600">General enquiries</p></div>
            </a>
            <a class="direct-row" href="mailto:${SITE.tenderEmail}">
              ${ICONS.tender(20, '#044ECD')}
              <div><span class="direct-value">${esc(SITE.tenderEmail)}</span><p class="smaller" style="font-weight:600">Tender and prequalification queries</p></div>
            </a>
            <div class="direct-row">
              ${ICONS.pin(20, '#044ECD')}
              <div><div class="direct-value" style="color:var(--navy)">${esc(SITE.address)}</div><p class="smaller" style="font-weight:600">${esc(SITE.city)}</p></div>
            </div>
          </div>
        </div>

        <div class="navy-card">
          <div class="glow-q" aria-hidden="true"></div>
          <div class="inner">
            <p class="eyebrow" style="margin-bottom:14px">Bidding on a tender?</p>
            <p>Send the reference number and closing date to <strong style="color:#fff">${esc(SITE.tenderEmail)}</strong> and we will confirm within one working day whether we are bidding, and what documents we can supply.</p>
            <a class="btn on-navy btn-full" href="/credentials" style="margin-top:18px">${ICONS.download(17)} Capability statement</a>
          </div>
        </div>

        <div class="card" style="padding:24px 24px 22px;gap:0">
          <h2 class="label" style="margin-bottom:14px">What happens after you send</h2>
          <ol class="steps compact-steps">
            <li><span class="ord">01</span><p class="small">We reply within one working day, from a person, not an autoresponder.</p></li>
            <li><span class="ord">02</span><p class="small">If you have a site, we run the seven checks first and send you what we find.</p></li>
            <li><span class="ord">03</span><p class="small">Then a short call. We quote on the call; we don’t make you wait for a number.</p></li>
          </ol>
        </div>
      </aside>
    </div>`,
};

/* The two pages the no-JavaScript path lands on. Both are ordinary static
   pages, so a visitor with scripting off gets a real answer rather than a
   JSON body or a browser error page. */

const sent = {
  url: '/thank-you',
  nav: '/contact',
  title: 'Thank you, we have your message · Hemi Tech Co.',
  description:
    'Your message reached us and has been stored. A person will reply within one working day, and we will tell you plainly if you do not need us.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:72px;padding-bottom:72px">
        <div class="stack stack-5" style="max-width:66ch">
          <p class="eyebrow">Received</p>
          <h1>Got it. A person will reply within one working day.</h1>
          <div class="rule"></div>
          <p class="lede">Your message is stored and someone will read it: not an autoresponder, and not a queue. If you sent us a site to check, we will run all seven checks properly and send you what we find, whether or not you ever work with us.</p>
          <p class="body-copy">If it is urgent, ${phoneLink()} or ${mailLink(SITE.email)} will reach us faster.</p>
          <div class="btn-row" style="margin-top:var(--s2)">
            <a class="btn" href="/">Back to the homepage</a>
            <a class="btn ghost" href="/audit">Run the seven checks</a>
          </div>
        </div>
      </div>
    </div>`,
};

const check = {
  url: '/check-your-details',
  nav: '/contact',
  title: 'One of those fields needs another look · Hemi Tech Co.',
  description:
    'Your message did not go through because one of the fields was empty or the email address was incomplete. Nothing was lost: go back and send it again.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:72px;padding-bottom:72px">
        <div class="stack stack-5" style="max-width:66ch">
          <p class="eyebrow">Not sent yet</p>
          <h1>One of those fields needs another look.</h1>
          <div class="rule"></div>
          <p class="lede">We did not send it, because one of these was true:</p>
          <ul class="prose" style="max-width:60ch">
            <li>A required field was empty: name, organisation, email or the message itself.</li>
            <li>The email address was missing everything after the @.</li>
            <li>The message was longer than we accept in one go. Send us the short version and we will ask for the rest.</li>
          </ul>
          <p class="body-copy">Go back, fix the one that applies, and send it again. Or write to ${mailLink(SITE.email)} directly; that always works.</p>
          <div class="btn-row" style="margin-top:var(--s2)">
            <a class="btn" href="/contact">Back to the form</a>
            <a class="btn ghost" href="/">Homepage</a>
          </div>
        </div>
      </div>
    </div>`,
};

export default [contact, sent, check];
