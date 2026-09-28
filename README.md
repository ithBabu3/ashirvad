# AshirvadConnect — Dealer B2B Portal (static front end)

## Structure
```
index.html              Dealer store            ->  https://yourdomain.com/
admin/index.html        Admin console           ->  https://yourdomain.com/admin/
css/style.css           App styles
css/vendor/             Bootstrap CSS
js/app.js               All app logic (one closure — see note below)
js/cloud/               Firebase login + sync layer
js/firebase-config.js   YOUR Firebase settings (edit this)
setup/                  Setup wizard & admin helper (Node)
firestore.rules         Database security rules
firebase.json           Hosting + rules deployment config
js/vendor/              Bootstrap JS, SheetJS (Excel), qrcode
deploy/                 Caddy / Nginx examples
tools/sync-admin.js     Regenerates admin/index.html from index.html
_headers                Cache/security headers (Cloudflare Pages / Netlify)
```

## Cloud (Firebase)
See **SETUP.md** — the guided setup (≈20 min). Files: `js/firebase-config.js` (your project values),
`js/cloud/firebase-boot.js` (login + sync layer), `firestore.rules`, `firebase.json`, `.firebaserc`,
`setup/setup.js` (wizard + admin helper). With the placeholders untouched the app still runs in local mode.

## URLs
- `/`        dealer login + store. Never opens the admin, even if you are logged in as admin in that browser.
- `/admin/`  admin login + console. Shop QR codes and "Back to store" always point to `/`.
- The old `/#admin` link still works.

## Deploy (static)
Upload the whole folder — no build step.
- **Cloudflare Pages / Netlify:** connect the Git repo (or drag-drop), build command empty, output dir `/`.
- **GitHub Pages:** works (`/admin/` resolves to `admin/index.html`).
- **VPS:** copy to `/srv/site` and use `deploy/Caddyfile`.
Use HTTPS, and deploy at the domain root (or its own subdomain).

## Editing rules
1. If you change the page markup in `index.html`, run `node tools/sync-admin.js` so `admin/index.html` matches.
2. After changing css/js, bump `?v=1.0.0` in both html files so browsers fetch the new files.
3. `js/app.js` is intentionally ONE file: its code shares one closure, so splitting it into
   several script tags would break it. Split it later when the API/backend work begins (ES modules).

## Important before going live
Complete SETUP.md so data lives in Firebase (cloud mode). In local mode data stays in each browser and the
built-in admin password in `js/app.js` applies — testing only.
