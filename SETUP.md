# AshirvadConnect — Firebase setup (≈ 20 minutes, no coding)

The app runs in **two modes**, chosen automatically:

| `js/firebase-config.js` | Mode |
|---|---|
| still has `PASTE_…` values | **Local** — data stays in each browser (testing only) |
| filled with your project's values | **Cloud** — Firebase Auth + Firestore, shared by all devices |

Everything below is done once.

---
## 0. What you need
- A Google account
- **Node.js 18+** (https://nodejs.org) — for the setup helper and Firebase CLI
- This folder (unzipped)

---
## 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project** → name it (e.g. `ashirvad-connect`). Google Analytics can be off.
2. **Project settings (⚙) → General → Your apps → `</>` Web** → register an app (skip Hosting for now).
   Keep the `firebaseConfig` block open — you'll paste its values in step 4.

## 2. Switch on the two services
1. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
   (Dealers log in with a phone number and admins with a username; the app turns these into
   e-mail-shaped ids behind the scenes. No real e-mails are sent.)
2. **Build → Firestore Database → Create database** → *Production mode* → location **asia-south1 (Mumbai)** (closest to Chennai; cannot be changed later).

## 3. Download the service-account key (used only by the setup helper)
**Project settings → Service accounts → Generate new private key.**
Save the file as **`setup/serviceAccountKey.json`**.
🔒 Never upload this file, e-mail it, or put it on the website. It is already git-ignored and excluded from hosting.

## 4. Run the setup wizard
```bash
cd setup
npm install
node setup.js init
```
It asks for the values from `firebaseConfig` (apiKey, projectId, …), writes
`js/firebase-config.js` and `.firebaserc` for you, and creates your **first admin login**.

## 5. Publish rules + website
```bash
npm install -g firebase-tools
firebase login
cd ..                                  # back to the project root
firebase deploy --only firestore:rules,hosting
```
Your site is now live at `https://<project-id>.web.app` and the admin console at `https://<project-id>.web.app/admin/`.

## 6. First run (in the browser)
1. Open **/admin/** → log in with the username/password from step 4.
2. **Configuration → ☁ Cloud sync → "Publish catalog & settings"** — sends the few built-in **sample** items (4 sample products, 1 category with 2 sub-categories, 1 banner, 1 offer, 1 calculator rule) and your settings to the cloud. Then add your real products and **delete the samples** (Products & Pricing / Catalog / Marketing). Once published, deleting everything really leaves it empty — the samples do not come back.
3. *(If you have real data in the old version)* same panel → **Import** — instructions are shown on screen. Dealers keep their phone number + password (any password shorter than 6 characters gets a temporary one, listed after the import).
4. Open the store URL on a phone → **Register** a test dealer → place a test order → see it in **/admin/ → Orders**.

## 7. Your own domain (optional)
- Firebase console → **Hosting → Add custom domain** and follow the DNS steps.
- **Authentication → Settings → Authorized domains** → add the same domain.

---
## Everyday tasks
| Task | How |
|---|---|
| Add another admin | `cd setup && node setup.js admin <username> <password>` |
| Dealer forgot password | `node setup.js dealer-password <10-digit phone> <new password>` |
| See what's in the database | `node setup.js check` |
| Update the website after editing files | `firebase deploy --only hosting` (bump `?v=` in the html files first) |
| Update security rules | `firebase deploy --only firestore:rules` |
| Backup | Configuration → **Full Backup** (JSON). For scheduled server-side backups enable Firestore *managed export* (needs the Blaze plan). |

## Where data lives
| App data | Firestore path | Who can read |
|---|---|---|
| Products, catalog cards, categories, offers, banners, rules, broadcasts, settings | `products`, `spec_groups`, `catalog_*`, `offers`, `banners`, `calc_rules`, `broadcasts`, `config/settings` | any signed-in user (admin writes) |
| Dealer profiles (incl. their special prices) | `dealers/{GST}` | that dealer + admin |
| Login ↔ business links | `accounts/{phone}` | that dealer + admin |
| Orders, payments, stock-alert requests | `orders`, `payments`, `stock_notify` | that dealer + admin |
| Audit log | `audit_log` | admin only |
Passwords are **never** stored in Firestore — Firebase Auth keeps only a hash.

## Free-plan (Spark) limits — check before launch
Firestore free quota is roughly **50,000 reads / 20,000 writes per day** and 1 GiB storage. Every time a dealer opens the app it reads the whole catalog once, then only changes. Rule of thumb:
`(catalog documents) × (app opens per day) ≲ 50,000`. e.g. 400 documents × 100 opens = 40,000. If you grow past that, switch to the **Blaze** plan (pay-as-you-go, usually a few dollars/month for this size) and set a **budget alert** (Google Cloud console → Billing → Budgets). Product images are plain URLs, so Firebase Storage is *not* needed. Limits change — confirm on firebase.google.com/pricing.

## Security — what is and isn't protected
✔ Dealers can only read their own profile, orders, payments, and prices; only admin can edit prices, catalog, tiers, discounts.
✔ A dealer cannot change what was ordered or its total after placing it, or give themselves a discount tier.
✔ Admin password no longer lives in the code (in cloud mode).
⚠ **Order totals are still calculated in the browser.** A technically skilled dealer could place an order with a tampered price. Fix later with a Cloud Function that recalculates totals on the server (Blaze plan) — ask when you're ready.
⚠ Invoice numbers come from a shared counter; two dealers opening an invoice at the very same instant could get the same number. Rare; the server-side fix is the same Cloud Function.
⚠ Auto-status rules (placed → confirmed → …) run on whichever device opens the app, so a dealer's device can advance its own order's status. Admin can always correct it.
⚠ There is no "forgot password" e-mail (dealers have no e-mail). Reset via `setup.js dealer-password`.

## Smoke-test checklist after deploying
- [ ] /admin/ login works; wrong password is rejected
- [ ] Publish catalog → dealers see products
- [ ] Register dealer A and dealer B on two phones
- [ ] A places an order → admin sees it within seconds; **B cannot see it**
- [ ] Admin changes a price → dealer's screen updates
- [ ] Admin sets a special rate for A → only A sees it
- [ ] Sign out / sign in again keeps everything

## Troubleshooting
| Symptom | Fix |
|---|---|
| Screen says "Could not connect" | Wrong values in `js/firebase-config.js`, or Email/Password sign-in / Firestore not enabled |
| "Not allowed to save this change" toast | Rules not deployed (`firebase deploy --only firestore:rules`) or that action isn't permitted for that user |
| Admin login says "does not have admin access" | The user wasn't created by `setup.js` — run `node setup.js admin <user> <pass>` |
| Dealer sees empty catalog | Catalog not published yet (step 6.2), or you deleted all products — add some |
| Changes not showing after a deploy | Bump `?v=` in `index.html` and re-run `node tools/sync-admin.js` |
| Want to go back to local mode | Put the `PASTE_…` placeholders back in `js/firebase-config.js` |
