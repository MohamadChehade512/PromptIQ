// Prompt IQ beta access gate: a CloudFront Function (cloudfront-js-2.0) on viewer requests.
//
// Every request needs a valid access code, so nothing of the site is served without one. The
// codes (code -> who it's for) are written into the deployed copy of this function by
// scripts/access-gate.sh, in place of `__CODES__`; they are never in this repo. (A CloudFront
// KeyValueStore would be neater, but the CloudFront Free plan doesn't allow one on a function.)
//
//   /__access?code=PIQ-XXXX-XXXX  checks a code, sets the cookie, redirects to the site
//   /__logout                     clears the cookie
//
// The cookie holds the code itself and is re-checked on every request, so removing a code locks
// that person out as soon as the updated function is live (usually within a minute or two).
/* eslint-disable no-unused-vars, no-undef -- CloudFront calls `handler` by name; the script fills in __CODES__. */
const CODES = __CODES__;
const COOKIE = 'piq_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ATTRS = 'Path=/; Secure; HttpOnly; SameSite=Lax';
// Shown on the code page, so it may load without a code.
const PUBLIC = { '/favicon.svg': true };

function normalize(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 40);
}

function isValid(code) {
  return code !== '' && Object.prototype.hasOwnProperty.call(CODES, code);
}

function page(error) {
  const message = error
    ? '<p class="error" role="alert">That code didn’t work. Check it and try again.</p>'
    : '';
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' +
    '<title>Prompt IQ · Beta access</title><style>' +
    ':root{--bg:#f5f6fa;--card:#fff;--text:#0b1a2e;--muted:#5c6475;--border:#e3e6ee;--accent:#2f55f4}' +
    '@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#141a2e;--text:#eef1f8;--muted:#a3abc2;--border:#262e48;--accent:#5b6dff}}' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;' +
    'background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    'main{width:100%;max-width:400px;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px;' +
    'box-shadow:0 10px 30px rgba(11,26,46,.08)}' +
    'h1{margin:0 0 4px;font-size:1.375rem}' +
    '.badge{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:.6875rem;font-weight:700;' +
    'letter-spacing:.06em;color:var(--accent);border:1px solid var(--accent);vertical-align:middle}' +
    'p{margin:0 0 18px;color:var(--muted);font-size:.9375rem}label{display:block;font-weight:600;font-size:.875rem;margin-bottom:6px}' +
    'input{width:100%;height:44px;padding:0 12px;border:1px solid var(--border);border-radius:10px;background:transparent;' +
    'color:var(--text);font:inherit;letter-spacing:.08em;text-transform:uppercase}' +
    'input:focus{outline:2px solid var(--accent);outline-offset:1px}' +
    'button{margin-top:14px;width:100%;height:44px;border:0;border-radius:10px;color:#fff;font:inherit;font-weight:600;cursor:pointer;' +
    'background:linear-gradient(100deg,#0f62fe,#4f3df0 55%,#8a2be2)}' +
    '.error{color:#c62828;margin:12px 0 0}' +
    '</style></head><body><main>' +
    '<h1>Prompt IQ<span class="badge">BETA</span></h1>' +
    '<p>Prompt IQ is in a private beta. Enter the access code you were given.</p>' +
    '<form method="get" action="/__access"><label for="code">Access code</label>' +
    '<input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" required autofocus>' +
    '<button type="submit">Continue</button></form>' +
    message +
    '</main></body></html>';
  return {
    statusCode: 401,
    statusDescription: 'Unauthorized',
    headers: {
      'content-type': { value: 'text/html; charset=utf-8' },
      'cache-control': { value: 'no-store' },
    },
    body: html,
  };
}

function redirect(location, cookieValue, attrs) {
  const cookies = {};
  cookies[COOKIE] = { value: cookieValue, attributes: attrs };
  return {
    statusCode: 302,
    statusDescription: 'Found',
    headers: {
      location: { value: location },
      'cache-control': { value: 'no-store' },
    },
    cookies: cookies,
  };
}

function handler(event) {
  const request = event.request;
  const uri = request.uri;

  if (uri === '/__logout') return redirect('/', '', ATTRS + '; Max-Age=0');

  if (uri === '/__access') {
    const param = request.querystring.code;
    const code = normalize(param && param.value);
    if (isValid(code)) return redirect('/', code, ATTRS + '; Max-Age=' + MAX_AGE);
    return page(true);
  }

  if (PUBLIC[uri]) return request;

  const cookie = request.cookies[COOKIE];
  if (cookie && isValid(normalize(cookie.value))) return request;

  return page(false);
}
