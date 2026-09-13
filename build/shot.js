// Image slots.
//
// BUILD-BRIEF §8: a screenshot of the real site, in a device frame drawn in
// CSS. AVIF with a WebP fallback, responsive srcset at 480/960/1440, explicit
// width and height on every image so CLS stays under 0.05.
//
// Where the real capture does not exist yet the frame is still drawn and the
// inside is a flat --tint fill. A stock photo or an invented screenshot is
// never substituted: a fake screenshot of fake work would be the single worst
// thing on this site.

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SHOT_DIR = join(ROOT, 'Images', 'shots');

const WIDTHS = [480, 960, 1440];

export function hasShot(name) {
  return existsSync(join(SHOT_DIR, `${name}-1440.avif`));
}

/**
 * @param {string} name   file stem, e.g. "joline-desktop"
 * @param {string} alt    what the screenshot shows — never "screenshot of website"
 * @param {object} opts   { w, h, sizes, priority }
 */
function picture(name, alt, opts = {}) {
  const { w = 1440, h = 900, sizes = '(max-width: 860px) 100vw, 33vw', priority = false } = opts;
  const set = (ext) => WIDTHS.map((px) => `/Images/shots/${name}-${px}.${ext} ${px}w`).join(', ');
  const loading = priority
    ? ' fetchpriority="high" decoding="async"'
    : ' loading="lazy" decoding="async"';

  return `<picture>
            <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
            <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
            <img class="shot" src="/Images/shots/${name}-960.webp" alt="${alt}" width="${w}" height="${h}"${loading}>
          </picture>`;
}

/** A desktop screenshot inside a CSS browser frame. */
export function browserFrame(name, alt, addr, opts = {}) {
  const inside = hasShot(name)
    ? picture(name, alt, { w: 1440, h: 900, ...opts })
    : `<div class="shot slot-empty">Screenshot pending</div>`;

  return `<div class="frame-browser">
          <div class="chrome" aria-hidden="true">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <span class="addr">${addr}</span>
          </div>
          ${inside}
        </div>`;
}

/**
 * A mobile screenshot inside a CSS phone frame.
 *
 * `stage: true` sits the phone on a tinted panel the same shape as a browser
 * frame, so a portrait shot does not make one card in a row twice the height
 * of its neighbours.
 */
export function phoneFrame(name, alt, opts = {}) {
  const inside = hasShot(name)
    ? picture(name, alt, { w: 390, h: 844, sizes: '232px', ...opts })
    : `<div class="shot slot-empty">Screenshot pending</div>`;

  const phone = `<div class="frame-phone">${inside}</div>`;
  return opts.stage ? `<div class="phone-stage">${phone}</div>` : phone;
}
