#!/usr/bin/env bash
#
# Acceptance tests for the media hosting API.
#
# Boots the local dev server against a throwaway directory with the "fs"
# backend, then drives the real routes over HTTP with curl. Nothing is mocked:
# these are the same handlers Vercel invokes in production, so a pass here is
# meaningful evidence the contract documented in README actually holds.
#
#   bash scripts/acceptance.sh          # or: npm run test:media
#
# Exits 0 only if every check passes.

set -u
cd "$(dirname "$0")/.."

PORT="${PORT:-3937}"
BASE="http://127.0.0.1:${PORT}"

# Which storage backend to exercise. "fs" is the default and needs nothing.
# "blob" runs the same checks against a real Vercel Blob store and requires
# BLOB_READ_WRITE_TOKEN plus MEDIA_PUBLIC_BASE (the store's own public base
# with /media appended) in the environment -- see README.
BACKEND_UNDER_TEST="${BACKEND_UNDER_TEST:-fs}"

if [ "$BACKEND_UNDER_TEST" = "blob" ]; then
  : "${BLOB_READ_WRITE_TOKEN:?blob mode needs BLOB_READ_WRITE_TOKEN}"
  : "${BLOB_STORE_BASE:?blob mode needs BLOB_STORE_BASE, e.g. https://<id>.public.blob.vercel-storage.com}"
  # Object storage is persistent, so every run gets its own throwaway prefix.
  # Sharing one namespace across runs makes the collision suffixes bleed
  # between them (a rerun sees the last run's files and appends -2), and it
  # would put test junk alongside real marketing assets. Deleted on exit.
  MEDIA_PREFIX="acceptance-$(date +%s)-$$"
  export MEDIA_PREFIX
  MEDIA_PUBLIC_BASE="${BLOB_STORE_BASE%/}/${MEDIA_PREFIX}"
  MEDIA_ORIGIN="$MEDIA_PUBLIC_BASE"
else
  MEDIA_PUBLIC_BASE="${BASE}/media"
  MEDIA_ORIGIN="${BASE}/media"
fi
TOKEN="acceptance-$(date +%s)-$$"
CRON_SECRET_VALUE="acceptance-cron-$(date +%s)-$$"
# Real sweep horizon is 24h. Shortened here so the code path can be
# exercised by waiting a few seconds rather than faking a stored record.
SWEEP_MS=4000
WORK="$(mktemp -d 2>/dev/null || mktemp -d -t media)"
MEDIA="${WORK}/media"
FIX="${WORK}/fixtures"
SERVER_LOG="${WORK}/server.log"
SERVER_PID=""

pass=0
fail=0

# ------------------------------------------------------------------ output ---

if [ -t 1 ]; then
  GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; OFF=$'\033[0m'
else
  GREEN=""; RED=""; DIM=""; OFF=""
fi

ok() {
  pass=$((pass + 1))
  printf '  %sPASS%s  %s\n' "$GREEN" "$OFF" "$1"
}

bad() {
  fail=$((fail + 1))
  printf '  %sFAIL%s  %s\n' "$RED" "$OFF" "$1"
  printf '        %sexpected:%s %s\n' "$DIM" "$OFF" "$2"
  printf '        %sgot:     %s %s\n' "$DIM" "$OFF" "$3"
}

group() { printf '\n%s\n' "$1"; }

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
  fi
  rm -rf "$WORK"
  # On blob, the store outlives the run, so remove everything this run wrote.
  if [ "$BACKEND_UNDER_TEST" = "blob" ] && [ -n "${MEDIA_PREFIX:-}" ]; then
    printf '
cleaning up blob prefix %s ... ' "$MEDIA_PREFIX"
    node -e '
      const prefixes = [process.env.MEDIA_PREFIX + "/", process.env.MEDIA_PREFIX + "-pending/"];
      import("@vercel/blob").then(async ({ list, del }) => {
        let n = 0;
        for (const prefix of prefixes) {
          let cursor;
          do {
            const page = await list({ prefix, cursor });
            if (page.blobs.length) { await del(page.blobs.map((b) => b.url)); n += page.blobs.length; }
            cursor = page.cursor;
          } while (cursor);
        }
        console.log("deleted " + n + " object(s)");
      }).catch((e) => console.log("cleanup failed: " + e.message));
    ' 2>&1 | tail -1
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------- fixtures ---

mkdir -p "$FIX" "$MEDIA"

# A real 1x1 PNG, so the detector sees genuine PNG magic bytes.
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+ZgAAAABJRU5ErkJggg==' | base64 -d > "${FIX}/pixel.png"

# Plain text wearing a .png extension. The bytes must win over the extension:
# that is the central security claim of filetype.js.
printf 'this is not an image, it is prose pretending to be one.\n' > "${FIX}/liar.png"

# SVG and HTML both carry script, and both are deliberately outside the
# whitelist. An SVG with an onload payload is the canonical stored-XSS vector
# for an image host, so it gets its own check.
printf '%s\n' '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>' > "${FIX}/payload.svg"
printf '%s\n' '<!doctype html><html><body><script>alert(1)</script></body></html>' > "${FIX}/payload.html"

# Minimal PDF header - an allowed type on a different branch of the detector.
printf '%%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n' > "${FIX}/doc.pdf"

# An ISO base media box with the mp4 brand "isom", covering the video branch.
printf '\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41' > "${FIX}/clip.mp4"

: > "${FIX}/empty.png"

# ------------------------------------------------------------------ server ---

group "Starting dev server (${BACKEND_UNDER_TEST} backend, reads from ${MEDIA_ORIGIN})"

MEDIA_STORAGE="$BACKEND_UNDER_TEST" \
MEDIA_PUBLIC_BASE="$MEDIA_PUBLIC_BASE" \
MEDIA_UPLOAD_TOKEN="$TOKEN" \
MEDIA_SWEEP_AFTER_MS="$SWEEP_MS" \
CRON_SECRET="$CRON_SECRET_VALUE" \
MEDIA_DIR="$MEDIA" \
MEDIA_DEV_ORIGIN="$BASE" \
PORT="$PORT" \
  node scripts/dev-server.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

ready=""
for _ in $(seq 1 60); do
  # A 404 from /media means the server is up and routing; that is enough.
  # Readiness is about the dev server being up, so this one deliberately
  # probes the server itself rather than MEDIA_ORIGIN, which on blob is remote
  # and would answer 404 before the server had even started.
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/api/media" 2>/dev/null)"
  if [ "$code" = "401" ]; then ready=1; break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then break; fi
  sleep 0.25
done

if [ -z "$ready" ]; then
  printf '  %sFAIL%s  dev server did not come up on %s\n' "$RED" "$OFF" "$BASE"
  printf -- '--- server log ---\n'
  cat "$SERVER_LOG"
  exit 1
fi
ok "dev server listening on ${BASE} (storage: ${BACKEND_UNDER_TEST})"

# ----------------------------------------------------------------- helpers ---

AUTH="Authorization: Bearer ${TOKEN}"

# status <method> <path> [curl args...]  -> prints the HTTP status code
status() {
  method="$1"; path="$2"; shift 2
  if [ "$method" = "HEAD" ]; then
    curl -s -o /dev/null -w '%{http_code}' -I --max-time 30 "$@" "${BASE}${path}"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$method" --max-time 120 "$@" "${BASE}${path}"
  fi
}

# body <method> <path> [curl args...]  -> prints the response body
body() {
  method="$1"; path="$2"; shift 2
  curl -s -X "$method" --max-time 120 "$@" "${BASE}${path}"
}

# expect_status <label> <expected> <method> <path> [curl args...]
expect_status() {
  label="$1"; want="$2"; method="$3"; path="$4"; shift 4
  got="$(status "$method" "$path" "$@")"
  if [ "$got" = "$want" ]; then
    ok "$label"
  else
    bad "$label" "HTTP $want" "HTTP $got"
  fi
}

expect_eq() {
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "$2" "$3"; fi
}

# Public reads must go wherever the objects actually live: the dev server on
# fs, the store itself on blob. Relative paths would always hit the dev
# server, which on blob serves nothing.
# A refusal is a refusal. Blob answers 401 where the local stand-in answers
# 403 and vice versa; what matters is that the write did not happen.
expect_refused() {
  case "$2" in
    2*) bad "$1" "a 4xx refusal" "HTTP $2 - the write was ACCEPTED" ;;
    4*) ok "$1 (HTTP $2)" ;;
    *)  bad "$1" "a 4xx refusal" "HTTP $2" ;;
  esac
}

expect_url_status() {
  label="$1"; want="$2"; method="$3"; url="$4"; shift 4
  if [ "$method" = "HEAD" ]; then
    got="$(curl -s -o /dev/null -w '%{http_code}' -I --max-time 30 "$@" "$url")"
  else
    got="$(curl -s -o /dev/null -w '%{http_code}' -X "$method" --max-time 60 "$@" "$url")"
  fi
  if [ "$got" = "$want" ]; then ok "$label"; else bad "$label" "HTTP $want" "HTTP $got"; fi
}

# Does the store hold this object? Asked through the API rather than by
# stat-ing a directory, so the same assertion is valid on fs and on Blob.
object_exists() {
  body GET /api/media -H "$AUTH" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const f=JSON.parse(raw).files||[];process.stdout.write(f.some(x=>x.filename===process.argv[1])?"yes":"no");}catch{process.stdout.write("error");}});' "$1"
}

expect_absent() {
  got="$(object_exists "$2")"
  if [ "$got" = "no" ]; then ok "$1"; else bad "$1" "absent from the store" "$got"; fi
}

# Read one field out of a JSON body. Avoids depending on jq being installed.
field() {
  node -e 'let raw=""; process.stdin.on("data",c=>raw+=c); process.stdin.on("end",()=>{ try { const v=JSON.parse(raw)[process.argv[1]]; process.stdout.write(v===undefined?"":String(v)); } catch { process.stdout.write("<unparseable>"); } });' "$1"
}

# The 30/hour ceiling is real and the groups above spend most of it. Reset
# the bucket so what follows measures the routes, not the rate limiter.
reset_limit() { curl -s -o /dev/null -X POST "${BASE}/__reset-ratelimit__"; }

# -------------------------------------------------------------------- auth ---

group "Authentication"

expect_status "POST without a token is refused" 401 POST /api/media \
  -F "file=@${FIX}/pixel.png"
expect_status "POST with the wrong token is refused" 401 POST /api/media \
  -H "Authorization: Bearer wrong-token" -F "file=@${FIX}/pixel.png"
expect_status "POST with a malformed header is refused" 401 POST /api/media \
  -H "Authorization: ${TOKEN}" -F "file=@${FIX}/pixel.png"
expect_status "GET (list) without a token is refused" 401 GET /api/media
expect_status "DELETE without a token is refused" 401 DELETE /api/media/anything.png

# ------------------------------------------------------------------ upload ---

group "Upload"

code="$(status POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=hero shot.PNG")"
expect_eq "upload returns 201" "201" "$code"

# That first call consumed the name, so read the response from a second one and
# assert on the suffixed result separately below. Re-upload under a fresh name.
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=Brand Lockup v2.PNG")"
expect_eq "caller name is sanitised to a safe filename" "brand-lockup-v2.png" "$(printf '%s' "$res" | field filename)"
expect_eq "response reports the detected content type" "image/png" "$(printf '%s' "$res" | field contentType)"
expect_eq "response reports the byte count" "67" "$(printf '%s' "$res" | field bytes)"
expect_eq "response url points at the media path" "${MEDIA_ORIGIN}/brand-lockup-v2.png" "$(printf '%s' "$res" | field url)"

if [ "$(object_exists hero-shot.png)" = "yes" ]; then
  ok "the upload is in the store"
else
  bad "the upload is in the store" "hero-shot.png present" "absent"
fi
# Path containment is an fs-specific property; on Blob the "media/" pathname
# prefix plays the same role and is covered by the listing above.
if [ "$BACKEND_UNDER_TEST" = "fs" ]; then
  if [ -f "${MEDIA}/hero-shot.png" ]; then
    ok "file landed inside the media directory"
  else
    bad "file landed inside the media directory" "${MEDIA}/hero-shot.png exists" "missing"
  fi
fi

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/doc.pdf" -F "name=rate-card")"
expect_eq "PDF is accepted and typed from its bytes" "application/pdf" "$(printf '%s' "$res" | field contentType)"
expect_eq "PDF gets the .pdf extension" "rate-card.pdf" "$(printf '%s' "$res" | field filename)"

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/clip.mp4" -F "name=reel")"
expect_eq "MP4 is accepted and typed from its ftyp brand" "video/mp4" "$(printf '%s' "$res" | field contentType)"
expect_eq "MP4 gets the .mp4 extension" "reel.mp4" "$(printf '%s' "$res" | field filename)"

# With no "name" field, the multipart part's own filename is used.
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png")"
expect_eq "an omitted name falls back to the uploaded filename" "pixel.png" "$(printf '%s' "$res" | field filename)"

# When nothing usable survives sanitising, a name is generated rather than the
# upload being refused.
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=___")"
noname="$(printf '%s' "$res" | field filename)"
case "$noname" in
  upload-*.png) ok "an unusable name falls back to a generated one (${noname})" ;;
  *)            bad "an unusable name falls back to a generated one" "upload-<id>.png" "$noname" ;;
esac

# ---------------------------------------------------------------- rejection ---

group "Rejection"

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/liar.png")"
code="$(status POST /api/media -H "$AUTH" -F "file=@${FIX}/liar.png")"
expect_eq "text renamed .png is rejected 415" "415" "$code"
expect_eq "  ...with an unsupported_type error" "unsupported_type" "$(printf '%s' "$res" | field error)"
if ls "${MEDIA}" | grep -q 'liar'; then
  bad "the rejected file is not stored" "no liar.* in media dir" "stored anyway"
else
  ok "the rejected file is not stored"
fi

# SVG and HTML are the two types the brief singles out, because both can carry
# script and an image host that stores them becomes a stored-XSS vector.
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/payload.svg")"
code="$(status POST /api/media -H "$AUTH" -F "file=@${FIX}/payload.svg")"
expect_eq "an SVG carrying script is rejected 415" "415" "$code"
expect_eq "  ...with an unsupported_type error" "unsupported_type" "$(printf '%s' "$res" | field error)"

code="$(status POST /api/media -H "$AUTH" -F "file=@${FIX}/payload.html")"
expect_eq "an HTML file is rejected 415" "415" "$code"

# The whitelist is what it claims to be, and excludes both.
allowed="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/payload.svg" | field allowed)"
case "$allowed" in
  *svg*|*html*) bad "the advertised whitelist excludes svg and html" "neither listed" "$allowed" ;;
  *)            ok "the advertised whitelist excludes svg and html" ;;
esac

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/empty.png")"
code="$(status POST /api/media -H "$AUTH" -F "file=@${FIX}/empty.png")"
expect_eq "an empty file is rejected 400" "400" "$code"
expect_eq "  ...with a bad_request error" "bad_request" "$(printf '%s' "$res" | field error)"

res="$(body POST /api/media -H "$AUTH" -F "name=no-file-here")"
code="$(status POST /api/media -H "$AUTH" -F "name=no-file-here")"
expect_eq "a missing file field is rejected 400" "400" "$code"
expect_eq "  ...naming the missing field" "missing file field" "$(printf '%s' "$res" | field detail)"

expect_status "a non-multipart body is rejected 400" 400 POST /api/media \
  -H "$AUTH" -H "Content-Type: application/json" --data '{"file":"nope"}'

expect_status "PUT on the collection is 405" 405 PUT /api/media -H "$AUTH"
expect_status "GET on an item route is 405" 405 GET /api/media/hero-shot.png -H "$AUTH"

# ---------------------------------------------------------------- traversal ---

group "Path traversal"

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=../../../etc/passwd")"
expect_eq "a traversal name collapses to a flat filename" "passwd.png" "$(printf '%s' "$res" | field filename)"

escaped=""
for candidate in "${WORK}/passwd.png" "${WORK}/etc" "${WORK}/../passwd.png"; do
  [ -e "$candidate" ] && escaped="$candidate"
done
if [ -n "$escaped" ]; then
  bad "nothing is written outside the media directory" "no file above ${MEDIA}" "$escaped"
else
  ok "nothing is written outside the media directory"
fi

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F 'name=C:\Windows\System32\evil.png')"
expect_eq "a Windows path collapses to its last segment" "evil.png" "$(printf '%s' "$res" | field filename)"

expect_status "DELETE with an encoded traversal is 400" 400 DELETE /api/media/..%2f..%2fetc%2fpasswd -H "$AUTH"
expect_status "DELETE with an uppercase name is 400" 400 DELETE /api/media/HERO-SHOT.PNG -H "$AUTH"

# ---------------------------------------------------------------- collision ---

group "Collisions"

res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=collide")"
expect_eq "first upload takes the plain name" "collide.png" "$(printf '%s' "$res" | field filename)"
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=collide")"
expect_eq "second upload is suffixed, not overwritten" "collide-2.png" "$(printf '%s' "$res" | field filename)"
res="$(body POST /api/media -H "$AUTH" -F "file=@${FIX}/pixel.png" -F "name=collide")"
expect_eq "third upload continues the sequence" "collide-3.png" "$(printf '%s' "$res" | field filename)"

# -------------------------------------------------------------- public read ---

group "Public read"

expect_url_status "GET /media/<file> needs no token" 200 GET "${MEDIA_ORIGIN}/hero-shot.png"
expect_url_status "HEAD /media/<file> needs no token" 200 HEAD "${MEDIA_ORIGIN}/hero-shot.png"
expect_url_status "GET a missing file is 404" 404 GET "${MEDIA_ORIGIN}/does-not-exist.png"

ctype="$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 "${MEDIA_ORIGIN}/hero-shot.png")"
case "$ctype" in
  image/png*) ok "public read serves the detected Content-Type" ;;
  *)          bad "public read serves the detected Content-Type" "image/png" "$ctype" ;;
esac

# These two headers are applied by vercel.json to /media/* on the brand
# domain. Fetching a Blob store directly bypasses that layer, so on blob they
# are not assertable locally -- they are what the post-deploy live-domain
# check exists to confirm. Skipped rather than quietly passed.
hdrs="$(curl -s -D - -o /dev/null --max-time 30 "${MEDIA_ORIGIN}/hero-shot.png")"
if [ "$BACKEND_UNDER_TEST" = "fs" ]; then
  case "$hdrs" in
    *osniff*) ok "public read sends X-Content-Type-Options: nosniff" ;;
    *)        bad "public read sends X-Content-Type-Options: nosniff" "nosniff" "absent" ;;
  esac
  case "$hdrs" in
    *immutable*) ok "public read sends a long immutable cache header" ;;
    *)           bad "public read sends a long immutable cache header" "immutable" "absent" ;;
  esac
else
  printf '  %sSKIP%s  nosniff + immutable headers (added by vercel.json on the brand domain, not by the store; verified post-deploy)
' "$DIM" "$OFF"
  case "$hdrs" in
    *max-age=31536000*) ok "the store itself sends the long max-age we asked for" ;;
    *)                  bad "the store itself sends the long max-age we asked for" "max-age=31536000" "absent" ;;
  esac
fi

# The bytes served back must be byte-identical to the bytes uploaded - this is
# what Buffer will fetch, so a corrupted round-trip would be silent breakage.
curl -s -o "${WORK}/roundtrip.png" --max-time 60 "${MEDIA_ORIGIN}/hero-shot.png"
if cmp -s "${FIX}/pixel.png" "${WORK}/roundtrip.png"; then
  ok "uploaded bytes round-trip unchanged"
else
  bad "uploaded bytes round-trip unchanged" "identical to fixture" "differs"
fi

# Requirement 5 of the brief: HEAD must return the same Content-Type and
# Content-Length as GET. Buffer issues a HEAD before fetching.
get_ct="$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 "${MEDIA_ORIGIN}/brand-lockup-v2.png")"
head_ct="$(curl -s -o /dev/null -w '%{content_type}' -I --max-time 30 "${MEDIA_ORIGIN}/brand-lockup-v2.png")"
expect_eq "HEAD reports the same Content-Type as GET" "$get_ct" "$head_ct"

get_len="$(curl -s -D - -o /dev/null --max-time 30 "${MEDIA_ORIGIN}/brand-lockup-v2.png" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')"
head_len="$(curl -s -I --max-time 30 "${MEDIA_ORIGIN}/brand-lockup-v2.png" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')"
expect_eq "HEAD reports the same Content-Length as GET" "$get_len" "$head_len"
expect_eq "  ...and it matches the real file size" "67" "$head_len"

# Requirement 4: a direct 200, not a redirect chain.
redirects="$(curl -s -o /dev/null -w '%{num_redirects}' --max-time 30 "${MEDIA_ORIGIN}/brand-lockup-v2.png")"
expect_eq "public read answers directly with no redirect" "0" "$redirects"

# ------------------------------------------------------------------ listing ---

group "Listing"

res="$(body GET /api/media -H "$AUTH")"
count="$(printf '%s' "$res" | node -e 'let raw=""; process.stdin.on("data",c=>raw+=c); process.stdin.on("end",()=>{ try { process.stdout.write(String(JSON.parse(raw).files.length)); } catch { process.stdout.write("x"); } });')"
case "$count" in
  ''|*[!0-9]*) bad "list returns a files array" "a number" "$count" ;;
  *)
    if [ "$count" -ge 9 ]; then
      ok "list returns every stored file (${count})"
    else
      bad "list returns every stored file" ">= 9" "$count"
    fi
    ;;
esac

case "$res" in
  *hero-shot.png*) ok "list includes a known upload" ;;
  *)               bad "list includes a known upload" "hero-shot.png present" "absent" ;;
esac
case "$res" in
  *meta.json*) bad "list hides the metadata sidecars" "no .meta.json entries" "sidecar leaked" ;;
  *)           ok "list hides the metadata sidecars" ;;
esac

# ------------------------------------------------------------------- delete ---

group "Delete"

expect_status "DELETE returns 204" 204 DELETE /api/media/hero-shot.png -H "$AUTH"
if [ "$BACKEND_UNDER_TEST" = "fs" ]; then
  expect_url_status "the deleted file is gone from public read" 404 GET "${MEDIA_ORIGIN}/hero-shot.png"
else
  # The object was fetched earlier in this run, so the edge has it cached for
  # up to s-maxage. Deletion is authoritative at the store, not instant at the
  # CDN. Asserted through the API instead; see README.
  printf '  %sSKIP%s  deleted file gone from public read (Blob CDN serves a cached copy for up to s-maxage=300)
' "$DIM" "$OFF"
fi
expect_status "DELETE is idempotent" 204 DELETE /api/media/hero-shot.png -H "$AUTH"

expect_absent "delete removes the object from the store" hero-shot.png
if [ "$BACKEND_UNDER_TEST" = "fs" ]; then
  if [ -e "${MEDIA}/hero-shot.png.meta.json" ]; then
    bad "delete removes the metadata sidecar too" "sidecar gone" "sidecar remains"
  else
    ok "delete removes the metadata sidecar too"
  fi
fi

# ------------------------------------------------- client uploads: step 1 ---

group "Client upload - step 1, the token route"
reset_limit

# json_post <path> <body> -> body, with the status appended as a final line
json_post() {
  curl -s -X POST "${BASE}$1" -H "$AUTH" -H 'Content-Type: application/json' \
    -d "$2" -w '\n%{http_code}'
}
last_line() { printf '%s' "$1" | tail -n 1; }
drop_last()  { printf '%s' "$1" | sed '$d'; }

expect_json_post() {
  label="$1"; want="$2"; path="$3"; payload="$4"
  raw="$(json_post "$path" "$payload")"
  got="$(last_line "$raw")"
  if [ "$got" = "$want" ]; then ok "$label"; else bad "$label" "HTTP $want" "HTTP $got: $(drop_last "$raw")"; fi
}

expect_status "the token route rejects a missing token" 401 POST /api/media/upload-token \
  -H 'Content-Type: application/json' -d '{"name":"a.mp4","contentType":"video/mp4","bytes":10}'
expect_status "GET on the token route is 405" 405 GET /api/media/upload-token -H "$AUTH"

# Everything checkable from the declaration is refused before any bytes move.
expect_json_post "declaring over 200 MB is rejected 413" 413 /api/media/upload-token \
  '{"name":"huge.mp4","contentType":"video/mp4","bytes":209715201}'
expect_json_post "a non-whitelisted contentType is rejected 415" 415 /api/media/upload-token \
  '{"name":"x.svg","contentType":"image/svg+xml","bytes":100}'
expect_json_post "an HTML contentType is rejected 415" 415 /api/media/upload-token \
  '{"name":"x.html","contentType":"text/html","bytes":100}'
expect_json_post "a missing name is rejected 400" 400 /api/media/upload-token \
  '{"contentType":"video/mp4","bytes":100}'
expect_json_post "a missing contentType is rejected 400" 400 /api/media/upload-token \
  '{"name":"a.mp4","bytes":100}'
expect_json_post "a missing bytes is rejected 400" 400 /api/media/upload-token \
  '{"name":"a.mp4","contentType":"video/mp4"}'
expect_json_post "a non-integer bytes is rejected 400" 400 /api/media/upload-token \
  '{"name":"a.mp4","contentType":"video/mp4","bytes":10.5}'
expect_json_post "a negative bytes is rejected 400" 400 /api/media/upload-token \
  '{"name":"a.mp4","contentType":"video/mp4","bytes":-1}'
expect_json_post "a whitespace-only name is rejected 400" 400 /api/media/upload-token \
  '{"name":"   ","contentType":"video/mp4","bytes":100}'

# A name with no usable characters does NOT fail: it falls back to a generated
# one, because the brief requires the same sanitiser as POST /api/media and
# that is what the sanitiser does. Asserting the real behaviour rather than
# leaving it untested.
raw="$(json_post /api/media/upload-token \
  '{"name":"___","contentType":"video/mp4","bytes":100}')"
expect_eq "an unusable name falls back to a generated one" "201" "$(last_line "$raw")"
case "$(drop_last "$raw" | field filename)" in
  upload-*.mp4) ok "  ...of the same upload-<id> form as the server route" ;;
  *)            bad "  ...of the same upload-<id> form as the server route" "upload-<id>.mp4" "$(drop_last "$raw" | field filename)" ;;
esac
expect_json_post "a non-JSON body is rejected 400" 400 /api/media/upload-token 'not json'

# The 201 shape is the contract the calling agent is built against.
VID_BYTES=9000028
raw="$(json_post /api/media/upload-token \
  "{\"name\":\"three seconds 12s.mp4\",\"contentType\":\"video/mp4\",\"bytes\":${VID_BYTES}}")"
expect_eq "a valid request returns 201" "201" "$(last_line "$raw")"
tok1="$(drop_last "$raw")"

CLIENT_FILE="$(printf '%s' "$tok1" | field filename)"
expect_eq "the name is sanitised at token time" "three-seconds-12s.mp4" "$CLIENT_FILE"
expect_eq "the promised url is on the media path" "${MEDIA_ORIGIN}/three-seconds-12s.mp4" "$(printf '%s' "$tok1" | field url)"

# Pull the upload object apart with node: it is nested, so `field` cannot.
upload_field() {
  printf '%s' "$1" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const u=JSON.parse(raw).upload;const p=process.argv[1].split(".");let v=u;for(const k of p)v=v?.[k];process.stdout.write(v===undefined?"":String(v));}catch{process.stdout.write("<unparseable>");}});' "$2"
}

expect_eq "the upload object names the method" "PUT" "$(upload_field "$tok1" method)"
expect_eq "the upload object carries the content type header" "video/mp4" "$(upload_field "$tok1" 'headers.x-content-type')"
expect_eq "the upload object pins the api version" "9" "$(upload_field "$tok1" 'headers.x-api-version')"
expect_eq "the upload object disables random suffixes" "0" "$(upload_field "$tok1" 'headers.x-add-random-suffix')"
case "$(upload_field "$tok1" 'headers.authorization')" in
  "Bearer "*) ok "the upload object carries a bearer credential" ;;
  *)          bad "the upload object carries a bearer credential" "Bearer <token>" "absent" ;;
esac

# The pathname travels as a query parameter, not a path segment. Getting this
# wrong is the single easiest way to break a replayed request.
expected_pathname="${MEDIA_PREFIX:-media}/three-seconds-12s.mp4"
case "$(upload_field "$tok1" url)" in
  *"?pathname=${MEDIA_PREFIX:-media}%2Fthree-seconds-12s.mp4") ok "the upload url pins the pathname as a query parameter" ;;
  *) bad "the upload url pins the pathname as a query parameter" "?pathname=<prefix>%2F..." "$(upload_field "$tok1" url)" ;;
esac

# 30 minutes, not hours.
ttl_min="$(printf '%s' "$tok1" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const e=Date.parse(JSON.parse(raw).expiresAt);process.stdout.write(String(Math.round((e-Date.now())/60000)));}catch{process.stdout.write("x");}});')"
case "$ttl_min" in
  29|30) ok "the credential expires in 30 minutes (${ttl_min} min)" ;;
  *)     bad "the credential expires in 30 minutes" "29 or 30" "$ttl_min" ;;
esac

# Every constraint must be pinned inside the credential itself, because that is
# what the storage service enforces. A token scoped to a prefix, or with no
# ceiling, would let one upload authorise far more than one write.
payload_field() {
  printf '%s' "$1" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => { raw += c; });
    process.stdin.on("end", async () => {
      try {
        const token = JSON.parse(raw).upload.headers.authorization.replace(/^Bearer /, "");
        let payload;
        if (token.startsWith("local_blob_client_")) {
          const bare = token.replace(/^local_blob_client_/, "");
          const enc = bare.slice(0, bare.lastIndexOf("."));
          payload = JSON.parse(Buffer.from(enc, "base64url").toString("utf8"));
        } else {
          // Real Vercel token: let the SDK decode its own format.
          const { getPayloadFromClientToken } = await import("@vercel/blob/client");
          payload = getPayloadFromClientToken(token);
        }
        const v = payload[process.argv[1]];
        process.stdout.write(v === undefined ? "" : JSON.stringify(v));
      } catch (e) { process.stdout.write("<unparseable>"); }
    });
  ' "$2"
}
expect_eq "the credential pins the exact pathname" "\"${expected_pathname}\"" "$(payload_field "$tok1" pathname)"
expect_eq "the credential allows only the one requested type" '["video/mp4"]' "$(payload_field "$tok1" allowedContentTypes)"
expect_eq "the credential carries the 200 MB ceiling" "209715200" "$(payload_field "$tok1" maximumSizeInBytes)"
expect_eq "the credential forbids a random suffix" "false" "$(payload_field "$tok1" addRandomSuffix)"

# A reservation holds the name, so two tokens never point at one path.
raw="$(json_post /api/media/upload-token \
  "{\"name\":\"three seconds 12s.mp4\",\"contentType\":\"video/mp4\",\"bytes\":${VID_BYTES}}")"
expect_eq "a second token for the same name is suffixed" "three-seconds-12s-2.mp4" "$(drop_last "$raw" | field filename)"

# ------------------------------------------------- client uploads: step 2 ---

group "Client upload - step 2, the credential's constraints bite"

VIDEO="${FIX}/reel.mp4"
printf '\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41' > "$VIDEO"
head -c 9000000 /dev/zero >> "$VIDEO"

CLIENT_AUTH="$(upload_field "$tok1" 'headers.authorization')"
CLIENT_URL="$(upload_field "$tok1" url)"

# Replay exactly what step 1 returned, and nothing else.
# put_replay <url> <contentType> <file> [authHeader]
# The credential must be the one minted for THAT file: a token is pinned to a
# single pathname, so reusing another upload's token is refused, which is the
# property step 2 exists to prove.
put_replay() {
  curl -s -o /dev/null -w '%{http_code}' -X PUT "$1" \
    -H "Expect:" \
    -H "authorization: ${4:-$CLIENT_AUTH}" \
    -H "x-api-version: 9" \
    -H "x-content-type: $2" \
    -H "x-add-random-suffix: 0" \
    --data-binary "@$3" --max-time 120
}

# Point the credential at a different pathname than the one it was minted for.
elsewhere="$(printf '%s' "$CLIENT_URL" | sed 's/pathname=[^&]*/pathname=somewhere%2Felse.mp4/')"
expect_refused "a credential cannot be redirected to another path" \
  "$(put_replay "$elsewhere" video/mp4 "$VIDEO")"
expect_refused "a credential cannot be used for another content type" \
  "$(put_replay "$CLIENT_URL" image/png "$VIDEO")"
expect_refused "a tampered credential is refused" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$CLIENT_URL" -H "Expect:" \
      -H "authorization: ${CLIENT_AUTH}tampered" -H 'x-content-type: video/mp4' \
      --data-binary "@$VIDEO" --max-time 120)"

# The real upload, which is the whole point: 9 MB is twice Vercel's 4.5 MB
# function body limit, so this file could not have gone through /api/media.
expect_eq "the real upload is accepted" "200" "$(put_replay "$CLIENT_URL" video/mp4 "$VIDEO")"

# Still not published: the bytes have passed no checks yet.
listing="$(body GET /api/media -H "$AUTH")"
unverified="$(printf '%s' "$listing" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const f=JSON.parse(raw).files.find(x=>x.filename===process.argv[1]);process.stdout.write(String(f?f.verified:"missing"));}catch{process.stdout.write("x");}});' "$CLIENT_FILE")"
expect_eq "an uploaded but unverified file is marked unverified" "false" "$unverified"

# ------------------------------------------------- client uploads: step 3 ---

group "Client upload - step 3, verification"

expect_status "the verify route rejects a missing token" 401 POST /api/media/verify \
  -H 'Content-Type: application/json' -d '{"filename":"x.mp4"}'
expect_json_post "verifying an absent file is 404" 404 /api/media/verify \
  '{"filename":"never-uploaded.mp4"}'
expect_json_post "verifying an invalid filename is 400" 400 /api/media/verify \
  '{"filename":"../../etc/passwd"}'

raw="$(json_post /api/media/verify "{\"filename\":\"${CLIENT_FILE}\"}")"
expect_eq "verifying a good upload returns 200" "200" "$(last_line "$raw")"
res="$(drop_last "$raw")"
# Shape must match POST /api/media's 201 exactly, so one code path reads both.
expect_eq "  ...with the same url field" "${MEDIA_ORIGIN}/${CLIENT_FILE}" "$(printf '%s' "$res" | field url)"
expect_eq "  ...the same filename field" "$CLIENT_FILE" "$(printf '%s' "$res" | field filename)"
expect_eq "  ...the same contentType field" "video/mp4" "$(printf '%s' "$res" | field contentType)"
expect_eq "  ...and the same bytes field" "$VID_BYTES" "$(printf '%s' "$res" | field bytes)"

verified="$(body GET /api/media -H "$AUTH" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const f=JSON.parse(raw).files.find(x=>x.filename===process.argv[1]);process.stdout.write(String(f?f.verified:"missing"));}catch{process.stdout.write("x");}});' "$CLIENT_FILE")"
expect_eq "the file is published once verified" "true" "$verified"

expect_url_status "the verified file is publicly readable" 200 GET "${MEDIA_ORIGIN}/${CLIENT_FILE}"
ctype="$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 "${MEDIA_ORIGIN}/${CLIENT_FILE}")"
case "$ctype" in
  video/mp4*) ok "the verified file serves as video/mp4" ;;
  *)          bad "the verified file serves as video/mp4" "video/mp4" "$ctype" ;;
esac

raw="$(json_post /api/media/verify "{\"filename\":\"${CLIENT_FILE}\"}")"
expect_eq "verify is idempotent" "200" "$(last_line "$raw")"

# --------------------------------------- client uploads: lying about bytes ---

group "Client upload - a lying upload is deleted, not just refused"
reset_limit

# Declare a video, upload PNG bytes. This is the exact hole the client flow
# opens: the bytes never touched the upload handler's magic-byte check.
liar_flow() {
  # $1 declared contentType, $2 declared bytes, $3 file to actually upload
  t="$(drop_last "$(json_post /api/media/upload-token \
    "{\"name\":\"liar-$$-${RANDOM}\",\"contentType\":\"$1\",\"bytes\":$2}")")"
  fn="$(printf '%s' "$t" | field filename)"
  put_replay "$(upload_field "$t" url)" "$1" "$3" "$(upload_field "$t" 'headers.authorization')" > /dev/null
  vraw="$(json_post /api/media/verify "{\"filename\":\"${fn}\"}")"
  printf '%s|%s' "$(last_line "$vraw")" "$fn"
}

out="$(liar_flow video/mp4 67 "${FIX}/pixel.png")"
code="${out%%|*}"; fn="${out##*|}"
expect_eq "PNG bytes declared as video are rejected 415" "415" "$code"
expect_absent "  ...and the object is deleted from storage" "$fn"
expect_url_status "  ...and its public URL now 404s" 404 GET "${MEDIA_ORIGIN}/${fn}"

out="$(liar_flow image/png 95 "${FIX}/payload.svg")"
code="${out%%|*}"; fn="${out##*|}"
expect_eq "an SVG declared as PNG is rejected 415" "415" "$code"
expect_absent "  ...and the SVG is deleted from storage" "$fn"

out="$(liar_flow video/mp4 1000 "$VIDEO")"
code="${out%%|*}"; fn="${out##*|}"
expect_eq "a materially wrong declared size is rejected 400" "400" "$code"
expect_absent "  ...and the object is deleted from storage" "$fn"

# ------------------------------------------------------------------ sweep ---

group "Sweep of abandoned uploads"
reset_limit

expect_status "the sweep rejects an unauthenticated call" 401 GET /api/media/sweep
expect_status "the sweep accepts the upload token" 200 GET /api/media/sweep -H "$AUTH"
expect_status "the sweep accepts CRON_SECRET" 200 GET /api/media/sweep \
  -H "Authorization: Bearer ${CRON_SECRET_VALUE}"

# A fresh reservation must survive.
fresh="$(drop_last "$(json_post /api/media/upload-token \
  '{"name":"fresh-pending.mp4","contentType":"video/mp4","bytes":500}')" | field filename)"
res="$(body GET /api/media/sweep -H "$AUTH")"
kept_fresh="$(printf '%s' "$res" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{process.stdout.write((JSON.parse(raw).stillPending||[]).includes(process.argv[1])?"yes":"no");}catch{process.stdout.write("error");}});' "$fresh")"
expect_eq "a reservation issued just now is kept" "yes" "$kept_fresh"

# Let a real reservation age past the (shortened) horizon and confirm it is
# collected with its bytes. Nothing is faked: the reservation is created by the
# token route, the bytes are uploaded for real, verify is deliberately never
# called, and then we simply wait.
aged_tok="$(drop_last "$(json_post /api/media/upload-token \
  '{"name":"abandoned-upload.mp4","contentType":"video/mp4","bytes":9000028}')")"
aged="$(printf '%s' "$aged_tok" | field filename)"

put_replay "$(upload_field "$aged_tok" url)" video/mp4 "$VIDEO" \
  "$(upload_field "$aged_tok" 'headers.authorization')" > /dev/null

if [ "$(object_exists "$aged")" = "yes" ]; then
  ok "an abandoned upload is in the store before the sweep"
else
  bad "an abandoned upload is in the store before the sweep" "$aged present" "absent"
fi

# Past the horizon.
sleep 6

res="$(body GET /api/media/sweep -H "$AUTH")"
collected="$(printf '%s' "$res" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const d=JSON.parse(raw).deleted||[];process.stdout.write(d.includes(process.argv[1])?"yes":"no");}catch{process.stdout.write("error");}});' "$aged")"
# Checks the "deleted" array specifically. Grepping the whole body was the
# flaw that hid a sweep failure earlier: the filename appears in
# "stillPending" too, so the assertion passed while nothing was collected.
expect_eq "a reservation past the horizon is collected" "yes" "$collected"
expect_absent "  ...and its abandoned bytes are deleted" "$aged"

res="$(body GET /api/media/sweep -H "$AUTH")"
again="$(printf '%s' "$res" | node -e 'let raw="";process.stdin.on("data",c=>raw+=c);process.stdin.on("end",()=>{try{const j=JSON.parse(raw);process.stdout.write([...(j.deleted||[]),...(j.stillPending||[])].includes(process.argv[1])?"yes":"no");}catch{process.stdout.write("error");}});' "$aged")"
expect_eq "  ...and its reservation is cleared" "no" "$again"

# ---------------------------------------------------------------- size cap ---

group "Size cap (200 MB)"
reset_limit

# Skippable because it writes and uploads ~200 MB: SKIP_LARGE=1 bash scripts/acceptance.sh
if [ "${SKIP_LARGE:-0}" = "1" ]; then
  printf '  %sSKIP%s  200 MB cap (SKIP_LARGE=1)\n' "$DIM" "$OFF"
else
  # 200.08 MB. Deliberately just over the cap but under the declared-length
  # pre-check threshold, so the body is read in full and the buffer-length
  # check is what answers. That exercises the real limit rather than the
  # cheap early bail, and avoids a mid-upload reset making the test flaky.
  head -c 209800000 /dev/zero > "${WORK}/oversize.bin"
  # One upload, both the status and the body: re-sending 200 MB twice is waste.
  raw="$(curl -s -X POST "${BASE}/api/media" -H "$AUTH" \
    -F "file=@${WORK}/oversize.bin" -w '\n%{http_code}' --max-time 300)"
  code="$(printf '%s' "$raw" | tail -n 1)"
  res="$(printf '%s' "$raw" | sed '$d')"
  expect_eq "a file over 200 MB is rejected 413" "413" "$code"
  expect_eq "  ...with a file_too_large error" "file_too_large" "$(printf '%s' "$res" | field error)"
  expect_eq "  ...reporting the exact cap the brief specifies" "209715200" "$(printf '%s' "$res" | field maxBytes)"
  rm -f "${WORK}/oversize.bin"
fi

# --------------------------------------------------------------- rate limit ---

group "Rate limit"

# 30 uploads per hour per token, and several are already spent above. Keep
# pushing on the same token until the ceiling answers.
rl_code=""
for i in $(seq 1 40); do
  rl_code="$(status POST /api/media -H "$AUTH" \
    -F "file=@${FIX}/pixel.png" -F "name=flood-${i}")"
  [ "$rl_code" = "429" ] && break
done
expect_eq "sustained uploads eventually hit 429" "429" "$rl_code"

hdrs="$(curl -s -D - -o /dev/null -X POST "${BASE}/api/media" -H "$AUTH" \
  -F "file=@${FIX}/pixel.png" -F "name=flood-again")"
case "$hdrs" in
  *etry-*fter*) ok "the 429 carries a Retry-After header" ;;
  *)            bad "the 429 carries a Retry-After header" "Retry-After present" "absent" ;;
esac

# The token route is the cheap path to a write credential, so the ceiling has
# to apply there as well or the limit is trivially sidestepped.
tok_code="$(status POST /api/media/upload-token -H "$AUTH" \
  -H 'Content-Type: application/json' \
  -d '{"name":"after-flood.mp4","contentType":"video/mp4","bytes":100}')"
expect_eq "the token route is rate limited too" "429" "$tok_code"

# A different token gets its own bucket, so one noisy client cannot lock out
# another.
other="$(status POST /api/media -H "Authorization: Bearer ${TOKEN}-other" \
  -F "file=@${FIX}/pixel.png" -F "name=other-client")"
expect_eq "a wrong token is still 401, not 429" "401" "$other"

# ------------------------------------------------------------ error contract ---

group "Error contract"

# Every error path must answer in JSON. An HTML error page would break the
# calling agent, which is the whole reason respond.js exists.
check_json_error() {
  ctype="$(curl -s -o /dev/null -w '%{content_type}' -X "$1" "${BASE}$2")"
  case "$ctype" in
    application/json*) ok "$1 $2 errors as JSON" ;;
    *)                 bad "$1 $2 errors as JSON" "application/json" "$ctype" ;;
  esac
}

check_json_error GET /api/media
check_json_error PUT /api/media
check_json_error DELETE /api/media/..%2fescape

# -------------------------------------------------------------------- summary ---

printf '\n'
if [ "$fail" -eq 0 ]; then
  printf '%s%d passed, 0 failed%s\n' "$GREEN" "$pass" "$OFF"
  exit 0
fi
printf '%s%d passed, %d failed%s\n' "$RED" "$pass" "$fail" "$OFF"
printf -- '\n--- server log ---\n'
cat "$SERVER_LOG"
exit 1
