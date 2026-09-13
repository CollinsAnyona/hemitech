// The website audit: the site's lead engine.
// From design-source/AuditTool.dc.html. The scoring logic in that file's
// renderVals() is the specification; audit.js ports it exactly.

import { CHECKS, BANDS } from '../site.js';
import { esc, ICONS, breadcrumbs } from '../layout.js';

// Each row is a <label> wrapping a real checkbox: the whole row is the target,
// it is reachable and operable by keyboard, it is announced correctly by a
// screen reader, and it still works with JavaScript switched off.
function checkRow([label, hint], i) {
  return `          <label class="check" for="check-${i}">
            <span class="check-cell">
              <input type="checkbox" id="check-${i}" data-check="${i}">
              <span class="box" aria-hidden="true">${ICONS.check(15, '#ffffff').replace('stroke-width="2.6"', 'stroke-width="3.4"')}</span>
            </span>
            <span>
              <span class="ctext">${esc(label)}</span>
              <span class="chint">${esc(hint)}</span>
            </span>
            <span class="cstate"><span class="s-off">Not yet</span><span class="s-on">Passes</span></span>
          </label>`;
}

// No colour is carried here. --alert is allowed once on a screen, and on this
// page it belongs to the live ring when the score is 3 or below, not to a
// static explainer card sitting next to it.
function bandExplainer(b, range) {
  return `            <div class="card">
              <span class="label">Score ${range}</span>
              <h3>${esc(b.title)}</h3>
              <p class="small">${esc(b.body)}</p>
              <div class="row-split" style="margin-top:auto;padding-top:16px;border-top:1px solid var(--line-soft)">
                <span class="row-key">Where we’d start</span>
                <span class="row-val">${esc(b.pkgName)}</span>
              </div>
              <p class="smaller">${esc(b.pkgBody)}</p>
            </div>`;
}

export default {
  url: '/audit',
  nav: '/audit',
  title: 'Free website audit · seven checks · Hemi Tech Co.',
  description:
    'Score your own site in two minutes against seven checks: load time on mobile data, a tappable phone number, no pinching, a clear first line and one next step.',
  jsonLd: breadcrumbs([['Free website audit', '/audit']]),
  scripts: ['/audit.js'],
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:52px">
        <div class="stack stack-5">
          <p class="eyebrow">The free audit</p>
          <h1 class="max-18">Score your own website in two minutes.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">Open your site on your phone, on mobile data (not office wifi) and work down the list. Tick what is true. Nothing is sent anywhere until you ask for the written report.</p>
        </div>
      </div>
    </div>

    <div class="wrap audit-grid">
      <section aria-labelledby="checks-h">
        <div class="check-head">
          <h2 id="checks-h" style="font-size:20px">The seven checks</h2>
          <p class="check-count"><span id="checked-count">0</span> of 7 ticked</p>
        </div>

        <form class="checks" id="audit-checks">
${CHECKS.map(checkRow).join('\n')}
        </form>

        <p class="small" style="margin-top:22px;max-width:60ch">Not sure about the load time? Hold your phone off wifi, close the site completely, then open it and count. Three seconds is about as long as it takes to say “one thousand, two thousand, three thousand”.</p>
      </section>

      <section class="result" aria-labelledby="score-h">
        <h2 id="score-h" class="eyebrow" style="margin-bottom:26px">Your score</h2>

        <div class="score-slot">
          <p class="no-js-note small">Tick the checks and your score appears here. If you would rather we ran them properly, send us the address below and we will do it for you.</p>

          <div class="score-live" hidden>
            <div class="score-row">
              <div class="ring-wrap">
                <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-labelledby="ring-label">
                  <title id="ring-label">Score 0 out of 7</title>
                  <circle cx="84" cy="84" r="72" fill="none" stroke="var(--ring-track)" stroke-width="13"></circle>
                  <circle id="ring-arc" cx="84" cy="84" r="72" fill="none" stroke="var(--blue-deep)" stroke-width="13"
                          stroke-linecap="butt" stroke-dasharray="0.0 452.4" transform="rotate(-90 84 84)"></circle>
                </svg>
                <div class="ring-centre">
                  <div class="ring-score" id="ring-score">0</div>
                  <div class="ring-of">out of 7</div>
                </div>
              </div>
              <div class="stack stack-2">
                <p class="band-title" id="band-title"></p>
                <p class="band-body" id="band-body"></p>
              </div>
            </div>

            <div class="pkg">
              <div class="pkg-head">
                <span class="label">Where we’d start</span>
                <span class="pkg-name" id="pkg-name"></span>
              </div>
              <p class="small" id="pkg-body"></p>
            </div>
          </div>
        </div>

        <form class="audit-form stack stack-3" id="audit-form" method="post" action="/api/audit">
          <div class="field-block">
            <label for="audit-email">Want the full written check? We’ll run all seven properly and send it back.</label>
            <input id="audit-email" class="field" type="email" name="email" placeholder="you@yourcompany.co.ke" autocomplete="email" required>
            <p class="field-error" id="audit-email-error"></p>
          </div>
          <div class="field-block">
            <label for="audit-site">Which site?</label>
            <input id="audit-site" class="field" type="text" name="website" placeholder="yoursite.co.ke" autocomplete="url" required>
            <p class="field-error" id="audit-site-error"></p>
          </div>
          <div class="honeypot" aria-hidden="true">
            <label for="audit-company">Company (leave this blank)</label>
            <input id="audit-company" type="text" name="company" tabindex="-1" autocomplete="off">
          </div>
          <button class="btn btn-full" type="submit">Send me my audit</button>
          <p class="smaller">We use your address only to send this audit and reply to you. Nothing is added to a mailing list, and we never sell or share it. <a href="/privacy">Privacy notice</a></p>
          <p class="form-status" id="audit-status" role="status" aria-live="polite"></p>
        </form>
      </section>
    </div>

    <section class="band-tint" aria-labelledby="bands-h">
      <div class="wrap sec-tight">
        <div class="stack stack-4 max-680" style="margin-bottom:34px">
          <p class="eyebrow">What the score means</p>
          <h2 id="bands-h">Three bands, and what we would do about each.</h2>
          <p class="lede" style="font-size:17px">The same three answers we would give you on a call, written down in advance so you can read them without talking to anybody.</p>
        </div>
        <div class="grid grid-3">
${bandExplainer(BANDS[0], '6–7')}
${bandExplainer(BANDS[1], '4–5')}
${bandExplainer(BANDS[2], '0–3')}
        </div>
      </div>
    </section>

    <section class="band-navy" aria-labelledby="next-h">
      <div class="wrap" style="padding-top:72px;padding-bottom:72px">
        <div class="split-even">
          <div class="stack stack-4">
            <p class="eyebrow">What happens next</p>
            <h2 id="next-h" style="font-size:clamp(24px,2.6vw,32px);line-height:1.16">Most sites scoring 4 or 5 don’t need rebuilding. We’ll tell you if yours doesn’t.</h2>
          </div>
          <ol class="navy-rows">
            <li><span class="ord">01</span><p><strong>We run the seven checks properly</strong>: measured load times, real devices, and we write down what we find.</p></li>
            <li><span class="ord">02</span><p><strong>You get the report, free</strong>: yours to keep and to act on, whether or not you ever work with us.</p></li>
            <li><span class="ord">03</span><p><strong>Only then do we talk about money</strong>, and only about the things the report actually found.</p></li>
          </ol>
        </div>
      </div>
    </section>`,
};
