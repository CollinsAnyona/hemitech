# HemiTech - Technology & Design Studio

Live at **[hemitech.co.ke](https://hemitech.co.ke)**

Multi-page website for HemiTech, a hybrid technology and creative agency based
in Nairobi, Kenya. Nine pages (home, about, services, work, contact, careers,
privacy policy, terms, cookie policy) built as a pure static site - no
frameworks, no build step. Auto-deploys to Vercel on every push to `main`.

## Highlights

- Responsive layout with a mobile hamburger navigation (vanilla JS)
- Animated hero with particle effects and mouse-tracking interaction
- Scroll-aware navbar and smooth-scroll anchor navigation
- Async contact-form handler (Formspree)
- Real case-study photography across all 6 portfolio projects
- Favicon set, Open Graph/Twitter social preview, JSON-LD Organization schema
- `robots.txt` + `sitemap.xml` for search engine discovery
- Single shared stylesheet and script across all pages

## Tech stack

HTML5 · CSS3 · Vanilla JavaScript (ES6+)

## View locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Media hosting API

Buffer's GraphQL schema has no upload mutation — every asset input requires
`url: String!` — so Buffer can only post media that already sits at a public
URL. These routes make hemitech.co.ke that host.

### Storage

This site deploys to Vercel, where the filesystem is ephemeral: anything a
function writes is gone by the next invocation. Uploads therefore go to
**Vercel Blob**, not to disk. `MEDIA_STORAGE=fs` switches to a local directory
for development (and would be the right choice on a VPS with a real disk).

### Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**, for
Production and Preview:

| Variable | Required | Purpose |
|---|---|---|
| `MEDIA_UPLOAD_TOKEN` | yes | Bearer token for the write routes. Generate with `openssl rand -hex 32`. If unset, every write route returns 401 — there is no open fallback. |
| `BLOB_READ_WRITE_TOKEN` | yes | Created automatically when you add a Blob store (Storage → Create → Blob). |
| `MEDIA_PUBLIC_BASE` | no | Set to `https://hemitech.co.ke/media` only alongside the rewrite below. Leave empty to return the Blob store's own public URL. |
| `MEDIA_STORAGE` | no | `blob` or `fs`. Defaults to `blob` on Vercel. |
| `CRON_SECRET` | for the sweep | What Vercel Cron presents when it calls `/api/media/sweep`. Vercel sends the header itself once the variable exists. Without it the daily sweep gets a 401 and abandoned uploads are never collected. |

### Serving on the hemitech.co.ke domain (optional)

By default the API returns the Blob store's own permanent public URL, which
satisfies Buffer directly and has the fewest moving parts. To serve on the
brand domain instead, add a rewrite to `vercel.json` — substituting your real
Blob host, visible once the store exists — and set `MEDIA_PUBLIC_BASE`:

```json
"rewrites": [
  { "source": "/media/:path*",
    "destination": "https://<your-store-id>.public.blob.vercel-storage.com/media/:path*" }
]
```

A rewrite proxies at the edge rather than through a function, so it is not
subject to the function response size limit.

### Routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/media` | bearer | Upload. `multipart/form-data` with `file`, optional `name`. → 201 |
| `GET /api/media` | bearer | List. → `{ "files": [...] }` |
| `DELETE /api/media/<filename>` | bearer | Remove, idempotent. → 204 |
| `GET\|HEAD /media/<filename>` | none | Public read, correct `Content-Type`. |
| `POST /api/media/upload-token` | bearer | Client upload step 1: reserve a name, mint a scoped 30-minute credential. → 201 |
| `POST /api/media/verify` | bearer | Client upload step 3: validate the stored bytes, delete them if they fail. → 200 |
| `GET\|POST /api/media/sweep` | bearer or `CRON_SECRET` | Delete uploads unverified for 24 hours. Run daily by Vercel Cron. |

Errors are always JSON: 401 unauthorized, 404 not_found, 413 file_too_large,
415 unsupported_type, 400 bad_request, 429 rate_limited.

`POST /api/media` handles anything up to 4.5 MB, which is Vercel's request
body limit. Larger files go through the three-step client-upload flow below.

### Behaviour worth knowing

- The MIME type comes from the file's **magic bytes**, never from the
  extension or the client's `Content-Type`. A `.txt` renamed `.png` is rejected.
- Filenames are reduced to `[a-z0-9._-]`, capped at 100 chars, with all path
  separators stripped. `../../../etc/passwd` becomes `passwd.png`.
- Collisions append `-2`, `-3` rather than overwriting.
- Allowed types: png, jpeg, webp, gif, mp4, quicktime, pdf. HTML and SVG are
  deliberately excluded — both can carry script.

### Local development

```bash
npm install
cp .env.example .env          # set MEDIA_UPLOAD_TOKEN
MEDIA_STORAGE=fs MEDIA_UPLOAD_TOKEN=... npm run dev:media
```

Uploads land in `./media/`, which is gitignored.

### Acceptance tests

```bash
npm run test:media
```

Boots the dev server on port 3937 against a throwaway temp directory with the
`fs` backend and drives the real routes over HTTP — nothing is mocked, so a
pass is evidence the contract above actually holds. 128 checks covering auth,
magic-byte type detection, filename sanitising, path traversal, collision
suffixing, public read headers, byte-exact round-trip, listing, idempotent
delete, the rate limit, the full three-step client-upload flow (including a
lying upload being deleted rather than merely refused), the abandoned-upload
sweep, and the JSON-on-every-error-path guarantee. Exits
non-zero on any failure and prints the server log.

### Client uploads (files over 4.5 MB)

Vercel caps a function's request body at 4.5 MB, so video cannot go through
`POST /api/media`. A client upload sends the bytes straight to Blob storage
instead. That fixes the ceiling but moves the bytes past every check in the
upload handler, so the flow is three steps, not two: the third does the
validation the bytes skipped, and deletes anything that fails.

**Step 1 - reserve a name and get a credential.**

```
POST /api/media/upload-token        Authorization: Bearer <MEDIA_UPLOAD_TOKEN>
{ "name": "three-seconds-12s.mp4", "contentType": "video/mp4", "bytes": 41288104 }
```

All three fields are required, and everything checkable from the declaration
is refused here, before any bytes move: 413 over 200 MB, 415 for a type
outside the whitelist, 400 for a missing field or a non-integer `bytes`.

The 201 carries `filename`, `url`, `expiresAt` and an `upload` object.

**Replay the `upload` object verbatim** - `method`, `url`, and every header in
`headers`, with the file as the raw body and nothing else. Do not add a
`Content-Type`; the type travels in `x-content-type`. Two details are worth
knowing because they are easy to get wrong:

- The pathname is a **query parameter**, not a path segment: the endpoint is
  `https://blob.vercel-storage.com/?pathname=media%2Ffile.mp4`.
- `x-api-version` is required and pinned to the version the installed
  `@vercel/blob` speaks. If that package is upgraded, re-check the constant in
  `clienttoken.js`.

Every constraint is pinned inside the credential, which is what makes it safe
to hand out: one path, one content type, the 200 MB ceiling, no random suffix,
and a 30-minute expiry. The storage service enforces them.

**Step 2 - PUT the bytes.** Off the function entirely; nothing to do here.

**Step 3 - verify and commit.**

```
POST /api/media/verify              Authorization: Bearer <MEDIA_UPLOAD_TOKEN>
{ "filename": "three-seconds-12s.mp4" }
```

This checks the stored object's real size against the cap and the
declaration, range-fetches the first 4 KB and checks the **magic bytes**, and
confirms the stored `Content-Type` is the true one. Anything that fails is
**deleted from storage**, not merely refused: 404 if nothing arrived, 413 over
the cap, 400 if the size differs materially from the declaration, 415 if the
bytes are not what was declared or are script-carrying markup.

The 200 body is identical in shape to `POST /api/media`'s 201, so one code
path consumes both.

**An unverified object is never published.** `GET /api/media` marks every file
`"verified": true|false`, and a reservation still unverified 24 hours after
its token was issued is deleted along with its bytes by
`/api/media/sweep`, which Vercel Cron runs daily at 03:00 (see `crons` in
`vercel.json`). Cron cannot present `MEDIA_UPLOAD_TOKEN`, so the sweep also
accepts `CRON_SECRET`.

Note that `POST /api/media` is deliberately *not* routed through this flow.
Small files take the simple path, large files take the safe one, and the
caller picks on size - putting a token round-trip in front of every 200 KB PNG
would buy nothing.

### Known limitations

Read these before relying on this in production.

**1. `POST /api/media` is limited to 4.5 MB. Use the client-upload flow
above for anything larger.** Vercel caps a serverless function's request body
at 4.5 MB, and `@vercel/blob`'s README says it plainly: "you can't upload files
larger than 4.5 MB on Vercel when using this method." The server route is not
broken, it is simply the wrong path for video. The three-step flow exists for
that and carries the same 200 MB ceiling.

**2. The Vercel Blob path has never run against a real store.** All 67
acceptance checks exercise the `fs` backend. `blobAdapter` in `storage.js` is
unverified against live Blob storage because no store exists yet.

**3. `/media/*` on the brand domain is not live by default.** With no rewrite
configured, the API returns the Blob store's own public URL
(`https://<store>.public.blob.vercel-storage.com/media/<file>`) rather than
`https://hemitech.co.ke/media/<file>`. Both are permanent, public and
correctly typed, so either satisfies Buffer; only the brand-domain form needs
the rewrite documented above.

**4. "30 uploads per hour" is not a guarantee.** The counter lives in the
module scope of one warm serverless instance. Vercel may run several
concurrently and a cold start resets the window, so the real ceiling is *30
per hour per warm instance*, not a global 30. This is a deliberate choice, not
an oversight: a global counter needs a shared store, and that is a dependency
and a failure mode this route does not deserve for something one agent calls a
handful of times a week. It stops a runaway loop. Do not read it as a quota,
and do not rely on it to bound spend. The limit applies to `POST /api/media`
and to `POST /api/media/upload-token`, since the token route is the cheap path
to a write credential and leaving it uncapped would sidestep the limit
entirely.
