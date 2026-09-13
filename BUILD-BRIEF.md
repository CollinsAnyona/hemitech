# Build brief — the new hemitech.co.ke

**Give Claude Code this whole folder.** `BUILD-BRIEF.md` is the instruction; `design-source/` holds the approved design and is the visual source of truth.

---

## 1. What you are building

The new website for **Hemi Tech Co.**, a Kenyan software and data engineering firm in Nairobi (hemitech.co.ke, hello@hemitech.co.ke). It replaces the current site entirely.

The audience is not consumers. It is **procurement officers, county ICT directors, NGO programme managers, SACCO CEOs and consultancy partners** across East Africa, most of whom will open this on a phone, on mobile data, while comparing three suppliers.

The company's entire commercial argument is that other firms build websites that are slow, awkward on a phone and unclear. **So this site is the product demonstration.** It has to pass the seven-point test Hemi Tech runs on everybody else. That constraint outranks every other preference in this document, including anything you would normally reach for.

---

## 2. The stack — decided, do not change it

**Static HTML, CSS and vanilla JavaScript. No framework. No build step. No CSS framework.**

Three reasons, in order:

1. The product claim is sub-2.5-second loads on mobile data. A framework's runtime is a tax paid on every page view for benefits this site does not need.
2. The existing repository is already static HTML/CSS/JS. There is no `package.json` beyond the one recently added for `@vercel/blob`, which serves the media-upload API and nothing else.
3. It deploys to Vercel exactly as it does today.

One shared `styles.css`, one small `site.js` for the nav toggle, and one `audit.js` for the audit tool. Nothing else. If a page needs no JavaScript, it loads none.

**Check the repo before writing anything.** Read the existing `vercel.json`, the `api/` directory (the media endpoint work), and any existing CSS. Match the file layout that is already there rather than imposing a new one, and say in one line what you found.

---

## 3. Non-negotiables

These are acceptance criteria, not aspirations. Every one is testable.

| | Requirement |
|---|---|
| **Load** | Largest Contentful Paint under 2.5s on a simulated Slow 4G connection, throttled CPU 4×. Total page weight under **500 KB** on the homepage, under 350 KB elsewhere. |
| **The seven checks** | The finished site scores **7/7** on Hemi Tech's own test. Run it and report the result. Failing our own audit invalidates the whole proposition. |
| **Accessibility** | WCAG 2.2 AA. Every interactive element reachable and operable by keyboard with a visible focus ring. No `outline: none` anywhere. |
| **Phone number** | A real `tel:` link, tappable. Check 2 of the seven. |
| **No layout shift** | Cumulative Layout Shift under 0.05. Every image and embed has explicit `width` and `height`. |
| **Works without JS** | Every page readable and navigable with JavaScript disabled. The audit tool degrades to a plain readable checklist. |
| **No third-party fonts at runtime** | Montserrat is **self-hosted**. See §6. |

---

## 4. The design source of truth

`design-source/` contains ten files:

| File | What it is |
|---|---|
| `Main.dc.html` | Homepage, desktop (1440px) |
| `HomeMobile.dc.html` | Homepage, mobile (390px) |
| `Capabilities.dc.html` | Capabilities index |
| `ServiceDetail.dc.html` | One service page — the pattern for all eight |
| `Sector.dc.html` | One sector page — the pattern for all five |
| `CaseStudy.dc.html` | Case study — the pattern for all of them |
| `AuditTool.dc.html` | The interactive audit. **This one has working logic — read its `<script>` block.** |
| `Credentials.dc.html` | The procurement page |
| `Contact.dc.html` | Contact |
| `DesignSystem.dc.html` | Palette, type scale, spacing, components, states |

**Read these files. Build from them, not from this document's descriptions.** Copy exact numeric values — paddings, radii, font sizes, line-heights, gaps — rather than rounding them to a 4 or 8px grid.

They are design-canvas files, so ignore three wrappers that mean nothing outside that tool: the `<script src="./support.js">` line, the `<x-dc>` element, and the `<helmet>` element (its `<style>` contents are real — use them). In `AuditTool.dc.html`, `{{name}}` holes are filled from the `renderVals()` method at the bottom of the file; `<sc-for>` is a loop and `<sc-if>` is a conditional. The scoring logic in that method is the specification — port it to plain JavaScript exactly.

---

## 5. Design tokens — exact values

```css
:root{
  /* brand — locked, do not add to this list */
  --navy:      #02123C;  /* headlines, primary text, dark fields */
  --navy-soft: #2E4070;  /* body copy, secondary text */
  --blue-deep: #044ECD;  /* eyebrows, links, primary buttons */
  --blue-mid:  #0F5FDB;  /* hover, rule start, small ordinals, focus ring */
  --blue-lgt:  #2587FC;  /* accents on navy, ornament. NEVER small text on white */
  --alert:     #CE303C;  /* restricted — see below */

  /* support — all blue-biased. There is no grey in this system. */
  --tint:      #F2F6FD;  /* alternate section ground */
  --tint-2:    #E4EDFC;
  --line:      #D7E3F5;  /* card borders, dividers */
  --line-soft: #E8EFFA;  /* rows inside a card */
  --alert-tint:#FBE9EB;  /* the one sanctioned non-blue tone. Error surfaces only. */

  /* on navy */
  --on-navy:      #FFFFFF;
  --on-navy-2:    #C7DBF7;
  --on-navy-3:    #8FB4E8;  /* the floor — never go lighter for small text */
  --on-navy-accent:#7FB8FF;
}
```

**`--alert` is restricted.** One job: signalling a measured failure — an audit score in the bottom band, an expired certificate, a form validation error. Never decoration, never a headline colour, never a background, never more than once on a screen. If a design needs red for emphasis rather than for failure, the answer is `--blue-deep`.

**Contrast ratios, already computed — do not re-derive, and do not introduce a pair that is not on this list:**

| Pair | Ratio | |
|---|---|---|
| navy on white | 18.19 | AAA |
| navy-soft on white | 10.08 | AAA |
| blue-deep on white | 7.06 | AAA |
| blue-mid on white | 5.71 | AA |
| **blue-lgt on white** | **3.53** | **large text only — this one bites** |
| navy-soft on tint | 9.30 | AAA |
| alert on white | 5.11 | AA |
| white on blue-deep | 7.06 | AAA |
| white on navy | 18.19 | AAA |
| `#8FB4E8` on navy | 8.54 | AAA |

The trap already caught twice in this design: **white text on `--blue-lgt` is 3.53:1 and fails AA.** On a navy ground the primary button is therefore a **white button with navy text** (18.19), not a light-blue button with white text.

### Ground

Never flat. White at the top easing to `#F3F8FE` at the bottom, plus two off-canvas corner glows:

```css
background:
  radial-gradient(760px 540px at 102% -10%, rgba(37,135,252,.17), transparent 62%),
  radial-gradient(620px 500px at -10% 115%, rgba(15,95,219,.12), transparent 62%),
  linear-gradient(180deg,#fff 0%,#F3F8FE 100%);
```

Glows stay in the corners. A glow reaching the centre of a page produces a grey blotch behind the text.

---

## 6. Type

**Montserrat only.** Weights 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold). No second typeface for body copy — this is deliberate and has been decided; do not "improve" it.

**Self-host it.** Download the four weights, subset to `latin` + `latin-ext`, convert to **WOFF2**, and serve from `/fonts/` with `font-display: swap` and a real fallback stack (`Montserrat, system-ui, -apple-system, "Segoe UI", sans-serif`). Preload only the two weights used above the fold (500 and 800). Do **not** link to fonts.googleapis.com — it is a third-party round trip on the critical path, and this site sells load time.

Four WOFF2 subsets should total well under 120 KB. If they do not, drop weight 600 and use 500/700/800.

| Role | Weight | Desktop | Mobile | Case | Colour |
|---|---|---|---|---|---|
| H1 | 800 | 46–60px / 1.04–1.10 | 34px | **Sentence** | navy |
| H2 | 800 | 26–38px / 1.12–1.16 | 25px | Sentence | navy |
| H3 | 700 | 17–22px / 1.24–1.30 | 16px | Sentence | navy |
| Eyebrow | 600 | 11.5–12px, tracking .2em | same | **ALL CAPS** | blue-deep |
| Lede | 500 | 17–19px / 1.56–1.62 | 16px | Sentence | navy-soft |
| Body | 500 | 14.5–16px / 1.55–1.68 | 15px | Sentence | navy-soft |
| Data | 800 | varies, `tabular-nums` | | | navy |

Tracking on headlines: `-0.02em`. Headline max width 24ch so it breaks in two lines, not four. Body max width 66ch. `text-wrap: balance` on headings.

**Headlines are sentence case.** The only permitted capitals are eyebrows, the HEMI TECH wordmark, and short uppercase state labels.

Apply `font-variant-numeric: tabular-nums` to every figure that sits in a column or changes live.

---

## 7. Layout and components

- **Canvas** 1440 desktop, **1200 content max**, 60px gutters. Mobile 22px gutters. Nothing centred except closing cards.
- **Spacing scale** `4 · 8 · 12 · 16 · 22 · 32 · 44 · 56 · 76 · 96`. Sections 70–96px desktop, 44–48px mobile.
- **Lay out sibling groups with flex or grid and `gap`** — never per-element margins.
- **Radius** 4px controls, 5px cards, 6px full-width panels. **One** shadow, only on a card that genuinely floats. Not everything is a card.
- **The rule**: 6px tall, fully rounded, 180px wide, `linear-gradient(90deg, var(--blue-mid), var(--blue-deep))`, under the headline. Never a flat navy line.
- **Controls** 52–54px tall. Minimum tap target 44px; 46px+ in practice.
- **Focus** `outline: 2px solid var(--blue-mid); outline-offset: 2px` on everything focusable.
- **Icons** inline SVG only, stroke-based, 24px grid, 1.8px stroke, round caps and joins. Copy them from the design files. **Never emoji.**
- **Motion** almost none. No scroll-triggered reveals — every page is fully readable the instant it paints. Hover and focus transitions only, 120–180ms, all disabled under `prefers-reduced-motion: reduce`.

`DesignSystem.dc.html` renders every component state — rest, hover, focus, disabled, error. Build them all.

---

## 8. Imagery — read this properly

The design files contain **no photographs**, because the real ones do not exist yet. That is a gap to close, not a style choice. A firm that builds websites and shows none of them has a credibility problem.

But the imagery has to be the right kind, and there is a hard budget.

### What goes on the site

| Where | What | Notes |
|---|---|---|
| Work cards (homepage, /work) | **Screenshot of each real site**, shown in a simple browser or phone frame drawn in CSS | 3 images |
| Case study hero | One wide screenshot of the finished site | 1 per case study |
| Case study body | 2–3 detail shots — a mobile view, a key screen | Optional, below the fold |
| About page | **One real photograph of Collo.** | Not a stock team. A small firm's directness is an asset; a real face beats a fake department |
| Everywhere else | Nothing | Sectors, capabilities, credentials and contact carry no photography at all |

### What must never go on it

Stock photography of people shaking hands, generic "team in a meeting" shots, world-map-with-glowing-lines graphics, keyboard-with-blue-overlay, photos used as backgrounds behind text, or a hero carousel. Every one of these is the exact cyber-café signal the redesign exists to remove.

### Technical rules

- **AVIF with a WebP fallback**, via `<picture>`. No PNG or JPEG except as a last resort.
- **Responsive** `srcset` with widths at 480 / 960 / 1440, `sizes` set honestly.
- **Explicit `width` and `height` attributes on every image** — this is how CLS stays under 0.05.
- `loading="lazy"` and `decoding="async"` on everything below the fold. The one above-the-fold image (if any) gets `fetchpriority="high"` and no lazy attribute.
- **Weight budget: 120 KB per image at the largest size, 250 KB of images per page total.** If a screenshot will not compress under that, it is too detailed — crop it.
- Real `alt` text describing what the screenshot shows, not "screenshot of website".

### How to capture the screenshots

Use Playwright or Chrome DevTools device mode against the live sites at exactly 1440×900 (desktop) and 390×844 (mobile), full-page or above-the-fold as the design requires. Capture:

- `jolinegeoconsultants.org` — desktop and mobile
- `startwalkingfoundation.org` — desktop
- the Nyombo platform — mobile (it is used almost entirely on phones)

**Whitecrest is not yet cleared for publication.** Do not screenshot it and do not include it; the design shows it as a dashed "in production" card and it stays that way until the client signs off.

**Until the real screenshots exist, build the image slots with the CSS device frames in place and a flat `--tint` fill inside.** Do not ship a stock photo as a stand-in, and do not generate an illustration of a fake website — a fake screenshot of fake work is the single worst thing that could go on this site.

---

## 9. Pages to build, in this order

Build and ship in order. Each one is done when it passes §3 and the criteria below.

1. **Home** (`/`) — from `Main.dc.html` and `HomeMobile.dc.html`. Includes: commitment strip, nav, hero + capability index card, proof strip, three capability groups, five sector tiles, featured case study, the audit block, how-we-work + standards, credentials teaser, CTA, footer.
2. **Website audit** (`/audit`) — §10. The most valuable page on the site.
3. **Capabilities** (`/capabilities`) — all eight services with timelines and prices.
4. **Service detail** ×8 (`/capabilities/<slug>`) — `ServiceDetail.dc.html` is the template. Slugs: `web-platforms`, `custom-software`, `mobile-applications`, `ecommerce-payments`, `data-analytics`, `data-protection`, `cloud-hosting-support`, `systems-integration`.
5. **Credentials** (`/credentials`) — the page that clears procurement.
6. **Contact** (`/contact`) — §11.
7. **Sectors** (`/sectors` + 5 children) — `Sector.dc.html` is the template. Slugs: `government`, `ngo-development`, `saccos-finance`, `education`, `professional-services`. **The four "what usually goes wrong" cards and the sector-specific copy must be rewritten per sector** — do not paste the government copy into the other four. If you do not have the copy, build the template and leave the body as a clearly marked `[COPY NEEDED — <sector>]` block rather than inventing it.
8. **Work** (`/work`) index and **case studies** (`/work/<slug>`).
9. **How we work** (`/how-we-work`), **Standards** (`/standards`), **Pricing** (`/pricing`) — content is in the design files' sections; extract it.
10. **About** (`/about`), **Privacy notice** (`/privacy`), **Terms** (`/terms`).
11. **Insights** (`/insights`) — index plus article template. Build it last and leave it empty rather than padding it.

Header nav, footer and the seven audit checks must be **byte-identical wherever they repeat**. Put them in one place — a build-time include, or a small JS-free HTML partial pattern — and use it everywhere.

---

## 10. The audit tool

This is the site's lead engine. `AuditTool.dc.html` is the specification; port its logic exactly.

### Behaviour

Seven checks, each a large clickable row (whole row is the target, ≥60px tall, a real `<button>` or a `<label>` wrapping a checkbox). Ticking recalculates, live and instantly:

- **Score** 0–7
- **Ring** an SVG circle, `r="72"`, `stroke-dasharray="<filled> <circumference>"` where circumference is `2π·72 = 452.4`. `stroke-linecap` is `round` when score > 0 and `butt` at zero, otherwise a zero-length arc renders as a dot.
- **Band**

| Score | Title | Body | Ring + numeral colour |
|---|---|---|---|
| 6–7 | It works. | Your site does its job. The next question is whether it converts — and that is a different conversation. | `--blue-deep` |
| 4–5 | You're leaking enquiries quietly. | People are arriving and leaving without telling you. Usually three fixes, not a rebuild. | `--blue-mid` |
| 0–3 | It's costing you clients today. | At this score most visitors leave before they see anything. That loss is invisible — nobody emails to say they left. | `--alert` |

The **band title is always `--navy`**, never the band colour — `--alert` on a headline breaks the colour rule.

- **Suggested package**

| Score | Package | Body |
|---|---|---|
| 6–7 | Care Plan | Nothing here needs fixing. Hosting, backups, patching and a published response time keep it that way. |
| 4–5 | Rescue — KES 65,000 | We fix what the audit found. No rebuild, no new design, no retainer required. |
| 0–3 | Starter — from KES 145,000 | Three or below, patching costs more than starting again. Five to seven pages, built properly, in weeks not months. |

### The seven checks — canonical wording, byte-identical everywhere

1. Loads in under 3 seconds on mobile data
2. Your phone number dials when you tap it
3. No pinching. No sideways scrolling.
4. Line one says what you do, before scrolling
5. One obvious next step, not five
6. The padlock is there. No "Not secure".
7. Something on it was updated this year

Each row carries the short hint line from the design file beneath it.

### Without JavaScript

The page renders the seven checks as a plain readable list with the three bands explained below it, and the email form still submits. No score, no ring — and no broken UI.

### State

Keep it in memory and in `sessionStorage` so a reload does not lose the ticks. Nothing is sent anywhere until the visitor submits the form.

---

## 11. Forms, and where submissions go

Two forms: the audit request (`/audit`) and the contact form (`/contact`).

**Both collect personal data, which means the Data Protection Act 2019 applies — and Hemi Tech sells compliance as a service. Getting this wrong on our own site would be embarrassing in a way the client would notice.**

Requirements:

- `POST` to a serverless route under `api/`. Follow the conventions of the existing media endpoint — plain Web-standard `Request`/`Response`, JSON errors, never an HTML error page.
- **Validate server-side**, not only in the browser.
- **Store every submission durably** (Vercel Blob is already wired up and is fine) **and** send a notification. Make the notification provider an environment variable. **If the provider is unset the submission must still be stored and the visitor must still see success — a submission may never be silently lost.**
- **Rate limit** and add a honeypot field. No CAPTCHA — it is an accessibility and conversion cost this traffic volume does not justify.
- **Collect the minimum.** Contact: name, organisation, email, optional website, message. Audit: email, website. Nothing else. No tracking of what the visitor ticked unless they submit.
- **A privacy notice link beside every submit button**, and a line stating plainly what the data is used for: replying, and nothing else. No mailing list.
- **Retention**: document it in the privacy notice and implement it — submissions deleted after [RETENTION PERIOD, ask Collo] unless they become a client.
- Success and error states are rendered in the page, not an alert, and are announced to screen readers via `aria-live="polite"`.

### Analytics

Privacy-respecting and cookieless, or none at all. Do not add Google Analytics — it requires a consent banner, and a consent banner on a page selling data-protection services that itself loads a US ad-tech tracker is an own goal. If analytics are wanted, use a self-hosted or cookieless option and say which you chose.

---

## 12. Facts you must not invent

Everything in `[SQUARE BRACKETS]` in the design files is a real-world fact that does not exist yet. **Leave every one as a visible bracketed placeholder.** Do not fill one with a plausible value, a lorem substitute, or a "TODO" comment that renders as blank.

The list, so you can check you have them all:

- `[+254 7XX XXX XXX]` — the phone number, appears many times
- `[PHYSICAL ADDRESS]` — a building, not "Nairobi, Kenya"
- `[REG NO.]`, `[CPR/...]`, `[P...]`, `[KRA...]`, `[AGPO...]`, `[SUPPLIER ID]`, `[ODPC...]`, `[PERMIT NO.]`, `[INSURER, POLICY NO.]`
- `[PENDING]` on every registration not yet held — **do not change these to "Registered"**
- `[JOLINE'S TESTIMONIAL, VERBATIM]` and `[NAME, ROLE]` — the client has sent real text; it gets pasted in unedited, not paraphrased
- `[X.Xs]`, `[X/7]` — measured outcomes
- `[99.X%]`, `[X hrs]` — the uptime and response-time commitments
- `[X%] to start` — the deposit
- `[COPY NEEDED — <sector>]` for the four sector pages without copy

Facts that **are** true and go in unbracketed: 5 sites live, 1 in production, clients working across 8 countries, `hello@hemitech.co.ke`, `hemitech.co.ke`, the client names Joline Geo Consultants / Start Walking Foundation / Nyombo Ceremony, and the package prices (65,000 / 145,000 / 295,000 / 650,000 / 14,000 per month).

Two standing rules from the brand documentation:

- **Start Walking Foundation is labelled "a Hemi Tech project"**, never presented as arms-length client work.
- **Whitecrest is "in production pending sign-off"** and nothing more, with no screenshot and no client name in a testimonial.

---

## 13. SEO and metadata

- Title tag per page, under 60 characters, the page's subject first and `Hemi Tech Co.` last.
- Meta description per page, 140–160 characters, written not templated.
- One `<h1>` per page.
- `Organization` and `LocalBusiness` JSON-LD on the homepage — **only with the fields that are actually true.** Omit `telephone` and `address` until the real values exist rather than emitting a placeholder into structured data.
- `sitemap.xml` and `robots.txt`.
- Open Graph and Twitter card images: generate them from the brand system as static images per page type, 1200×630, under 100 KB.
- Canonical URLs. Decide `www` vs apex and 301 the other.

---

## 14. Acceptance tests — run these and paste the output

```bash
# 1. Page weight and request count, homepage
#    (Lighthouse CLI, or Chrome DevTools Network panel with cache disabled)
npx lighthouse https://<preview-url>/ --preset=desktop --output=json --quiet \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);
     console.log('LCP', r.audits['largest-contentful-paint'].displayValue);
     console.log('CLS', r.audits['cumulative-layout-shift'].displayValue);
     console.log('Total bytes', r.audits['total-byte-weight'].displayValue);
     console.log('Perf', r.categories.performance.score*100, 'A11y', r.categories.accessibility.score*100);})"

# 2. Same, throttled mobile — this is the number that matters
npx lighthouse https://<preview-url>/ --preset=mobile --output=json --quiet   # report LCP, CLS, Perf, A11y

# 3. No fonts.googleapis.com or fonts.gstatic.com requests anywhere
grep -ri "fonts.googleapis\|fonts.gstatic" --include="*.html" --include="*.css" . || echo "clean"

# 4. Every image has explicit dimensions
grep -o '<img[^>]*>' **/*.html | grep -v 'width=' && echo "FAIL: image without width" || echo "all images sized"

# 5. No outline suppression
grep -rn "outline:\s*none\|outline:\s*0" --include="*.css" . || echo "clean"

# 6. The phone number is a tel: link
grep -c 'href="tel:' index.html

# 7. Keyboard pass — tab through the homepage and the audit tool end to end.
#    Report: can you reach and operate every control, and is focus always visible?

# 8. JavaScript disabled — load /, /audit and /contact with JS off.
#    Report: is each page readable, navigable, and is the contact form still submittable?
```

Then **run Hemi Tech's own seven checks on the finished site, on a phone, on mobile data**, and report the score. It must be 7/7.

---

## 15. What to report back

1. What you found in the existing repo, and what you matched rather than replaced.
2. The output of all eight tests above, plus the seven-check score.
3. The image slots you built and which are still empty awaiting real screenshots.
4. Every `[PLACEHOLDER]` still outstanding, as a checklist Collo can work through.
5. **Anything in §3 you could not meet, and what blocks it.** Do not skip this — a silent miss here means the site fails the argument it exists to make.

Commit on a branch and open a pull request. Do not push to production until Collo has reviewed the preview deployment.
