/* The website audit.
 *
 * A direct port of renderVals() in design-source/AuditTool.dc.html: the same
 * seven checks, the same three bands, the same ring geometry. The wording is
 * not repeated here; it is read from the markup the build generated, so the
 * checks have exactly one source.
 *
 * The page works with this file absent: the checks are real checkboxes in a
 * real form, the bands are explained in their own section, and the request
 * form posts normally. All this adds is the live score.
 */
(function () {
  'use strict';

  var form = document.getElementById('audit-checks');
  if (!form) return;

  var boxes = Array.prototype.slice.call(form.querySelectorAll('input[type="checkbox"]'));
  if (boxes.length !== 7) return;

  var live = document.querySelector('.score-live');
  var note = document.querySelector('.no-js-note');
  var arc = document.getElementById('ring-arc');
  var ringScore = document.getElementById('ring-score');
  var ringLabel = document.getElementById('ring-label');
  var bandTitle = document.getElementById('band-title');
  var bandBody = document.getElementById('band-body');
  var pkgName = document.getElementById('pkg-name');
  var pkgBody = document.getElementById('pkg-body');
  var count = document.getElementById('checked-count');

  var BANDS = [
    {
      min: 6,
      colour: 'var(--blue-deep)',
      title: 'It works.',
      body: 'Your site does its job. The next question is whether it converts, and that is a different conversation.',
      pkgName: 'Care Plan',
      pkgBody: 'Nothing here needs fixing. Hosting, backups, patching and a published response time keep it that way.'
    },
    {
      min: 4,
      colour: 'var(--blue-mid)',
      title: 'You’re leaking enquiries quietly.',
      body: 'People are arriving and leaving without telling you. Usually three fixes, not a rebuild.',
      pkgName: 'Rescue: KES 65,000',
      pkgBody: 'We fix what the audit found. No rebuild, no new design, no retainer required.'
    },
    {
      min: 0,
      colour: 'var(--alert)',
      title: 'It’s costing you clients today.',
      body: 'At this score most visitors leave before they see anything. That loss is invisible; nobody emails to say they left.',
      pkgName: 'Starter: from KES 145,000',
      pkgBody: 'Three or below, patching costs more than starting again. Five to seven pages, built properly, in weeks not months.'
    }
  ];

  var CIRC = 2 * Math.PI * 72; /* 452.4 */
  var KEY = 'hemitech.audit.checks';

  function bandFor(score) {
    for (var i = 0; i < BANDS.length; i++) {
      if (score >= BANDS[i].min) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  function save(state) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* private mode, or storage disabled. The tool still works. */
    }
  }

  function restore() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length === 7 ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function render() {
    var state = boxes.map(function (b) { return b.checked; });
    var score = state.filter(Boolean).length;
    var band = bandFor(score);
    var filled = CIRC * (score / 7);

    arc.setAttribute('stroke-dasharray', filled.toFixed(1) + ' ' + CIRC.toFixed(1));
    /* A zero-length arc with a round cap renders as a dot, so at zero the cap
       is butt. Straight from the design file. */
    arc.setAttribute('stroke-linecap', score > 0 ? 'round' : 'butt');
    arc.setAttribute('stroke', band.colour);

    ringScore.textContent = String(score);
    ringScore.style.color = band.colour;
    ringLabel.textContent = 'Score ' + score + ' out of 7';

    /* The band title is always navy. --alert never lands on a headline. */
    bandTitle.textContent = band.title;
    bandBody.textContent = band.body;
    pkgName.textContent = band.pkgName;
    pkgBody.textContent = band.pkgBody;

    if (count) count.textContent = String(score);

    save(state);
  }

  var saved = restore();
  if (saved) {
    boxes.forEach(function (b, i) { b.checked = saved[i]; });
  }

  boxes.forEach(function (b) { b.addEventListener('change', render); });

  if (note) note.hidden = true;
  if (live) live.hidden = false;
  render();

  /* ---------------------------------------------------------- the form --- */

  var requestForm = document.getElementById('audit-form');
  if (!requestForm) return;

  var status = document.getElementById('audit-status');
  var emailField = document.getElementById('audit-email');
  var siteField = document.getElementById('audit-site');
  var emailError = document.getElementById('audit-email-error');
  var siteError = document.getElementById('audit-site-error');
  var submit = requestForm.querySelector('button[type="submit"]');

  function clearErrors() {
    [[emailField, emailError], [siteField, siteError]].forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].removeAttribute('aria-invalid');
      if (pair[1]) pair[1].textContent = '';
    });
  }

  function showError(field, el, message) {
    if (field) field.setAttribute('aria-invalid', 'true');
    if (el) el.textContent = message;
  }

  function setStatus(kind, message) {
    status.className = 'form-status ' + kind;
    status.textContent = message;
  }

  requestForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();

    var email = emailField.value.trim();
    var website = siteField.value.trim();
    var ok = true;

    if (!email) {
      showError(emailField, emailError, 'We need an address to send the audit to.');
      ok = false;
    } else if (email.indexOf('@') < 1 || email.indexOf('.', email.indexOf('@')) < 0) {
      showError(emailField, emailError, 'That address is missing everything after the @.');
      ok = false;
    }

    if (!website) {
      showError(siteField, siteError, 'Tell us which site to look at.');
      ok = false;
    }

    if (!ok) {
      setStatus('bad', 'Two things to fix above, then send it again.');
      var firstBad = requestForm.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    submit.disabled = true;
    setStatus('ok', 'Sending…');

    fetch(requestForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        website: website,
        company: document.getElementById('audit-company').value
      })
    })
      .then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (result) {
        submit.disabled = false;
        if (result.ok) {
          requestForm.reset();
          setStatus('ok', 'Got it. We will run all seven checks properly and send the written audit within one working day.');
        } else if (result.body && result.body.error === 'rate_limited') {
          setStatus('bad', 'That is a few requests in a short time. Give it a minute and try again, or email ' + 'hello@hemitech.co.ke' + '.');
        } else if (result.body && result.body.field) {
          var map = { email: [emailField, emailError], website: [siteField, siteError] };
          var pair = map[result.body.field];
          if (pair) showError(pair[0], pair[1], result.body.detail || 'Have another look at this one.');
          setStatus('bad', 'One thing to fix above, then send it again.');
        } else {
          setStatus('bad', 'That did not send. Email hello@hemitech.co.ke and we will pick it up from there.');
        }
      })
      .catch(function () {
        submit.disabled = false;
        setStatus('bad', 'That did not send. The connection dropped. Try again, or email hello@hemitech.co.ke.');
      });
  });
})();
