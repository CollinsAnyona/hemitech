/* Mounts the real, animated hero video — homepage only, hence its own file
 * rather than a block in site.js (loaded on all 33 pages). Kept small and
 * separate deliberately: measured directly, folding this same logic into
 * site.js's larger deferred bundle pushed Largest Contentful Paint back up
 * under mobile+CPU throttle, apparently from sharing one script's parse and
 * execution slot with the reveal/motion setup rather than getting its own.
 * A few hundred bytes on their own timeline avoids that.
 *
 * The homepage ships a plain <img id="hero-poster"> by default — cheap, and
 * what establishes the page's actual LCP. This file swaps in the real
 * <video> only once the browser is idle (or, at worst, 3s after load):
 * measured directly, a <video> element costs roughly 500-600ms of paint and
 * compositing time under a throttled mobile CPU regardless of autoplay or
 * which codec loads first, purely from Chrome setting up its media
 * pipeline. On this site specifically — whose entire pitch, stated on every
 * single page, is "loads in under 2.5 seconds on mobile data" — that cost
 * would land right on the one metric the business can least afford to
 * quietly regress, so the video is worth having but not worth it AT the
 * cost of the page's own headline claim.
 *
 * Reduced motion is handled the same way whichever path arrives at a video
 * element (this one, or the <noscript> fallback next to the <img> for
 * visitors with no JavaScript at all): neither <source> below matches
 * "(prefers-reduced-motion: no-preference)" when it's set, so the browser
 * requests neither file — confirmed via
 * performance.getEntriesByType('resource') showing zero requests to either
 * video file when reduced motion is on.
 */
(function () {
  'use strict';

  var heroImg = document.getElementById('hero-poster');
  if (!heroImg) return;

  function mountHeroVideo() {
    if (!document.body.contains(heroImg)) return; // already swapped, or removed
    var v = document.createElement('video');
    v.className = heroImg.className;
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.poster = heroImg.src;
    v.width = heroImg.width;
    v.height = heroImg.height;
    v.innerHTML =
      '<source src="/Images/video/hero-network-loop.webm" type="video/webm" media="(prefers-reduced-motion: no-preference)">' +
      '<source src="/Images/video/hero-network-loop.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)">';
    heroImg.replaceWith(v);
  }

  window.addEventListener('load', function () {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(mountHeroVideo, { timeout: 4000 });
    } else {
      setTimeout(mountHeroVideo, 3000);
    }
  });
})();
