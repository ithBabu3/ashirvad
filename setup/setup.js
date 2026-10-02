#!/usr/bin/env node
/* ==========================================================================
   AshirvadConnect — Firebase setup helper

   Usage (run inside the setup/ folder after `npm install`):

     node setup.js init                       Interactive first-time wizard (recommended)
     node setup.js admin <user> <password>    Create / update an admin login
     node setup.js dealer-password <phone> <new-password>
                                              Reset a dealer's password (they cannot do it themselves)
     node setup.js check                      Test the connection and list what is in the database

   What `init` does for you
     1. asks for your Firebase web-app settings and writes  ../js/firebase-config.js
     2. writes your project id into  ../.firebaserc
     3. creates the first admin login (Auth user + /admins/<uid> document)

   It needs a *service account key* (a JSON file) — Firebase console → Project settings →
   Service accounts → "Generate new private key". Keep that file PRIVATE: never commit it,
   never put it in the website folder. Default location searched: setup/serviceAccountKey.json
   (or set GOOGLE_APPLICATION_CREDENTIALS).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const DEALER_DOMAIN = 'dealer.ashirvadconnect.app';   // keep in sync with js/firebase-config.js + firestore.rules
const ADMIN_DOMAIN  = 'admin.ashirvadconnect.app';
const DIST_DOMAIN = 'distributor.ashirvadconnect.app';

// Line queue: works both when typing interactively and when answers are pasted / piped in all at once.
function makeAsker() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const buffered = []; const waiters = []; let closed = false;
  rl.on('line', l => { const w = waiters.shift(); if (w) w(l); else buffered.push(l); });
  rl.on('close', () => { closed = true; waiters.splice(0).forEach(w => w('')); });
  const ask = (q, def) => new Promise(res => {
    process.stdout.write(q + (def ? ` [${def}]` : '') + ': ');
    const done = l => { if (!process.stdin.isTTY) process.stdout.write((l || '') + '\n'); res((l || '').trim() || def || ''); };
    if (buffered.length) done(buffered.shift()); else if (closed) done(''); else waiters.push(done);
  });
  return { ask, close: () => rl.close() };
}

function loadAdmin() {
  let admin;
  try { admin = require('firebase-admin'); }
  catch (e) { console.error('\n✖ firebase-admin is not installed. Run:  npm install   (inside the setup folder)\n'); process.exit(1); }
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error(`\n✖ Service account key not found at:\n  ${keyPath}\n\n  Firebase console → ⚙ Project settings → Service accounts → "Generate new private key",\n  then save the file as setup/serviceAccountKey.json\n`);
    process.exit(1);
  }
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(key), projectId: key.project_id });
  return { admin, projectId: key.project_id };
}

async function createAdmin(admin, username, password) {
  const email = `${String(username).toLowerCase().replace(/[^a-z0-9._-]/g, '')}@${ADMIN_DOMAIN}`;
  if (String(password).length < 6) throw new Error('Password must be at least 6 characters.');
  let user;
  try { user = await admin.auth().getUserByEmail(email); await admin.auth().updateUser(user.uid, { password }); console.log(`• Updated password for existing admin "${username}"`); }
  catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    user = await admin.auth().createUser({ email, password, displayName: `Admin ${username}` });
    console.log(`• Created admin login "${username}"`);
  }
  await admin.firestore().collection('admins').doc(user.uid).set({ username, email, createdAt: new Date().toISOString() });
  console.log('• Registered as admin in Firestore (/admins/' + user.uid + ')');
}

async function init() {
  const { ask: askQ, close } = makeAsker();
  const ask = (_rl, q, def) => askQ(q, def);
  const rl = null;
  console.log('\n=== AshirvadConnect · Firebase setup ===\n');
  console.log('In the Firebase console open  ⚙ Project settings → General → Your apps → Web app (</>)\nand copy the values from the "firebaseConfig" block.\n');
  const cfg = {};
  cfg.apiKey            = await ask(rl, 'apiKey');
  cfg.projectId         = await ask(rl, 'projectId');
  cfg.authDomain        = await ask(rl, 'authDomain', `${cfg.projectId}.firebaseapp.com`);
  cfg.storageBucket     = await ask(rl, 'storageBucket', `${cfg.projectId}.appspot.com`);
  cfg.messagingSenderId = await ask(rl, 'messagingSenderId');
  cfg.appId             = await ask(rl, 'appId');
  if (!cfg.apiKey || !cfg.projectId) { console.error('\n✖ apiKey and projectId are required.'); process.exit(1); }

  // 1) js/firebase-config.js
  const cfgFile = path.join(ROOT, 'js', 'firebase-config.js');
  let src = fs.readFileSync(cfgFile, 'utf8');
  const block = 'window.AC_FIREBASE_CONFIG = {\n' + Object.entries(cfg).map(([k, v]) => `  ${k.padEnd(18)}: ${JSON.stringify(v)}`).join(',\n') + '\n};';
  src = src.replace(/window\.AC_FIREBASE_CONFIG\s*=\s*\{[\s\S]*?\};/, block);
  fs.writeFileSync(cfgFile, src);
  console.log('\n✔ Wrote js/firebase-config.js');

  // 2) .firebaserc
  fs.writeFileSync(path.join(ROOT, '.firebaserc'), JSON.stringify({ projects: { default: cfg.projectId } }, null, 2) + '\n');
  console.log('✔ Wrote .firebaserc');

  // 3) first admin
  console.log('\nNow the first admin login (used at /admin/).');
  const username = await ask(rl, 'Admin username', 'admin');
  const password = await ask(rl, 'Admin password (min 6 characters)');
  close();
  const { admin, projectId } = loadAdmin();
  if (projectId !== cfg.projectId) console.warn(`\n⚠ The service account belongs to "${projectId}" but you entered "${cfg.projectId}".`);
  await createAdmin(admin, username, password);

  console.log(`
✔ Setup finished. Remaining steps (see SETUP.md):
   firebase login
   firebase deploy --only firestore:rules,hosting
   Open  https://${cfg.projectId}.web.app/admin/  → log in → Configuration → Cloud sync → Publish
`);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'init') return init();
  const { admin } = loadAdmin();
  if (cmd === 'admin') {
    if (!a || !b) return console.error('Usage: node setup.js admin <username> <password>');
    return createAdmin(admin, a, b);
  }
  if (cmd === 'dealer-password') {
    if (!a || !b) return console.error('Usage: node setup.js dealer-password <10-digit phone> <new password>');
    if (b.length < 6) return console.error('Password must be at least 6 characters.');
    const phone = a.replace(/\D/g, '');
    const user = await admin.auth().getUserByEmail(`${phone}@${DEALER_DOMAIN}`);
    await admin.auth().updateUser(user.uid, { password: b });
    return console.log(`✔ Password reset for dealer ${phone}`);
  }
    
  if (cmd === 'distributor-password') {
    if (!a || !b) return console.error('Usage: node setup.js distributor-password <login-id> <new password>');
    if (b.length < 6) return console.error('Password must be at least 6 characters.');
    const user = await admin.auth().getUserByEmail(`${a.toLowerCase()}@${DIST_DOMAIN}`);
    await admin.auth().updateUser(user.uid, { password: b });
    return console.log(`✔ Password reset for distributor ${a}`);
  }

  if (cmd === 'check') {
    const db = admin.firestore();
    const cols = ['admins', 'dealers', 'accounts', 'orders', 'payments', 'products', 'spec_groups', 'catalog_categories', 'catalog_subcategories', 'offers', 'banners', 'calc_rules', 'broadcasts', 'stock_notify', 'audit_log','distributors', 'distributor_stock', 'distributor_requests', 'distributor_log', 'distributor_sales', 'distributor_orders', 'distributor_users', 'roles'];
    console.log('Connected. Documents per collection:');
    for (const c of cols) { const s = await db.collection(c).count().get(); console.log('  ' + c.padEnd(22) + s.data().count); }
    const st = await db.doc('config/settings').get();
    console.log('  config/settings'.padEnd(24) + (st.exists ? 'present' : 'missing (publish from the admin panel)'));
    return;
  }
  console.log('Commands: init | admin <user> <password> | dealer-password <phone> <password> | check');
}

main().then(() => process.exit(0)).catch(e => { console.error('\n✖ ' + (e.message || e)); process.exit(1); });
