/* Everything the site needs in the browser, other than the audit tool.
 *
 * Two jobs: collapse the navigation on a small screen, and upgrade the contact
 * form from a page reload to an in-place reply. Both are enhancements. With
 * this file absent the nav is simply open and the form posts normally.
 */
(function () {
  'use strict';

  /* Tells the stylesheet a script is running, so the collapsed nav state is
     only ever applied where something can open it again. */
  document.documentElement.setAttribute('data-js', 'on');

  /* ------------------------------------------------------------- nav ----- */

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var mobile = window.matchMedia('(max-width: 980px)');

    var sync = function () {
      if (mobile.matches) {
        nav.hidden = toggle.getAttribute('aria-expanded') !== 'true';
      } else {
        nav.hidden = false;
      }
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      sync();
      if (!open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      sync();
      toggle.focus();
    });

    if (mobile.addEventListener) {
      mobile.addEventListener('change', sync);
    } else if (mobile.addListener) {
      mobile.addListener(sync);
    }

    sync();
  }

  /* --------------------------------------------------- the contact form -- */

  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('contact-status');
  var submit = form.querySelector('button[type="submit"]');

  var FIELDS = ['name', 'organisation', 'email', 'website', 'message'];

  function errorEl(field) {
    return document.getElementById('c-' + field + '-error');
  }

  function inputEl(field) {
    return form.querySelector('[name="' + field + '"]');
  }

  function clearErrors() {
    FIELDS.forEach(function (field) {
      var input = inputEl(field);
      var el = errorEl(field);
      if (input) input.removeAttribute('aria-invalid');
      if (el) el.textContent = '';
    });
  }

  function showError(field, message) {
    var input = inputEl(field);
    var el = errorEl(field);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (el) el.textContent = message;
  }

  function setStatus(kind, message) {
    status.className = 'form-status ' + kind;
    status.textContent = message;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();

    var data = {};
    FIELDS.concat(['company']).forEach(function (field) {
      var input = inputEl(field);
      data[field] = input ? input.value.trim() : '';
    });

    var problems = [];
    if (!data.name) problems.push(['name', 'We would rather not open with “Dear sir or madam”.']);
    if (!data.organisation) problems.push(['organisation', 'Who are you writing on behalf of?']);
    if (!data.email) {
      problems.push(['email', 'We need an address to reply to.']);
    } else if (data.email.indexOf('@') < 1 || data.email.indexOf('.', data.email.indexOf('@')) < 0) {
      problems.push(['email', 'That address is missing everything after the @.']);
    }
    if (!data.message) problems.push(['message', 'A sentence is enough, but we do need one.']);

    if (problems.length) {
      problems.forEach(function (p) { showError(p[0], p[1]); });
      setStatus('bad', problems.length === 1
        ? 'One thing to fix above, then send it again.'
        : problems.length + ' things to fix above, then send it again.');
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    submit.disabled = true;
    setStatus('ok', 'Sending…');

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (result) {
        submit.disabled = false;
        if (result.ok) {
          form.reset();
          setStatus('ok', 'Got it. A person will reply within one working day, and we will tell you plainly if you don’t need us.');
        } else if (result.body && result.body.error === 'rate_limited') {
          setStatus('bad', 'That is a few messages in a short time. Give it a minute, or email hello@hemitech.co.ke.');
        } else if (result.body && result.body.field) {
          showError(result.body.field, result.body.detail || 'Have another look at this one.');
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
