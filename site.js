/* Everything the site needs in the browser, other than the audit tool and
 * the homepage's hero video (see hero-video.js — kept out of here
 * deliberately, so pages that aren't the homepage never parse or run it).
 *
 * Collapse the navigation on a small screen, animate content into view as it
 * scrolls, and upgrade the contact form from a page reload to an in-place
 * reply. All of it is an enhancement. With this file absent the nav is
 * simply open and the form posts normally.
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

  /* ---------------------------------------------------------- motion ---- */
  /* Scroll reveal, a count-up on every stat, a header that condenses, and a
     thin scroll-progress bar. Transform/opacity (or a scaleX bar, or plain
     text content for the counters) only, so none of this can trigger
     layout. If a browser lacks IntersectionObserver, or the visitor asked
     for reduced motion, content is simply shown at once. */

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(progress, document.body.firstChild);

  var scrollTicking = false;
  var onScrollFrame = function () {
    scrollTicking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? Math.min(Math.max(doc.scrollTop / max, 0), 1) : 0;
    progress.style.transform = 'scaleX(' + pct + ')';
    doc.setAttribute('data-scrolled', doc.scrollTop > 8 ? 'true' : 'false');
  };
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
  }, { passive: true });
  onScrollFrame();

  var revealTargets = document.querySelectorAll(
    '#main section, .ground-top, .card, .panel, .cta-panel, .status-panel, .standards-panel, .stat, .grid > *, blockquote'
  );

  if (revealTargets.length) {
    /* Stagger within each parent separately, so a long page doesn't queue
       a card near the bottom behind every card above it. */
    var groups = [];
    Array.prototype.forEach.call(revealTargets, function (el) {
      el.classList.add('reveal');
      var parent = el.parentElement;
      var group = null;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].parent === parent) { group = groups[i]; break; }
      }
      if (!group) { group = { parent: parent, n: 0 }; groups.push(group); }
      el.style.setProperty('--reveal-i', group.n);
      group.n++;
    });

    /* Reveal anything already on screen in this same synchronous pass, so
       above-the-fold content never paints hidden and then fades in. */
    var vh = window.innerHeight;
    var offscreen = [];
    Array.prototype.forEach.call(revealTargets, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        el.classList.add('is-in');
      } else {
        offscreen.push(el);
      }
    });

    if ('IntersectionObserver' in window && offscreen.length) {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      offscreen.forEach(function (el) { revealIO.observe(el); });
    } else {
      offscreen.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  var counters = document.querySelectorAll('[data-count]');
  var runCounter = function (el) {
    var raw = el.getAttribute('data-count');
    var to = parseFloat(raw);
    if (isNaN(to)) return;
    var suffix = el.getAttribute('data-count-suffix') || '';
    var decimals = (raw.split('.')[1] || '').length;

    if (reduceMotion) {
      el.textContent = to.toFixed(decimals) + suffix;
      return;
    }

    var start = null;
    var duration = 1000;
    var step = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      Array.prototype.forEach.call(counters, function (el) { countIO.observe(el); });
    } else {
      Array.prototype.forEach.call(counters, runCounter);
    }
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
