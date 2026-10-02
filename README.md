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

## v1.5.0 — distributor fixes
- Files renamed with proper extensions: `js/admin-distributors.js`, `js/distributor.js`, `distributor/index.html`.
- Per-distributor stock visibility (Distributors → Edit → "What this distributor can see about stock"):
  *Only his own stock count* or *Company (existing) stock list + his own count*. Company stock is mirrored
  automatically from Products & Pricing and refreshed whenever products/cards change and every minute.
- Catalog-card items are listed under their card with every spec value (not just the first); tick a card to show all its items.
- Admin can type an opening stock per item when assigning; changes are written to the Activity log.
- Firestore rules: distributors can no longer read the product catalogue; they only read rows shown to them.
  **Run `firebase deploy --only firestore:rules,hosting` after copying these files.**

## v1.6.0
- Admin → Distributors → **📈 Stock added**: per-distributor units added / reduced / net, filter by distributor and period,
  "only increases" toggle, by-distributor / by-product toggle, expandable product detail, CSV. Overview also has a distributor filter.
- Distributor portal: My history tab, sort, "＋Recv" (add received units), clickable Low/Out chips, total units, share low-stock list.
- **Deploy:** `firebase deploy --only firestore,hosting` (rules + the new composite index for the history queries).

## v1.7.0 — roles, offline, sales, purchase orders
- **Staff roles** (Distributors → 🔐 Roles & team, owner only): *Manager* (everything except roles/team) and *Viewer* (read-only; nothing is saved).
  The original admin is the Owner. Enforced in `firestore.rules` (`canWrite()` / `isOwner()`), not just in the screens.
- **Distributor roles & team logins**: owner creates roles (stock / sales / orders / history / MRP / requests levels), then adds team members
  (storekeeper, salesman…) to a distributor. They log in on `/distributor/` with their own ID. Collections: `roles`, `distributor_users`.
- **Offline**: distributor page works without internet (Firestore offline cache + `distributor/sw.js`); changes queue and sync automatically.
- **Sales entry**: one batch = sale record + stock reduction + history (increments, so offline devices merge correctly). Void restores stock.
- **Purchase orders**: distributor cart → order → admin Accept / Dispatch / Deliver (optionally adds the quantities to his stock) / Reject; distributor tracks status.
- Admin → Distributors has new tabs: 📦 Orders, 🧾 Sales, 🔐 Roles & team.
- **Deploy:** `firebase deploy --only firestore,hosting` (rules + 2 new indexes — indexes take a few minutes to build).

## v1.8.0
- Distributors → Products & price: filter by **category**, tick a whole category (or a card) to show it, and set
  **"Always include new items from these categories"** (new items appear automatically; items you hide stay hidden).