'use strict';
/* ==========================================================================
   AshirvadConnect — Telegram notifications (Cloud Functions, 2nd gen)

   Sends a Telegram message to the people chosen in  Admin → 🔔 Notifications  when:
     • a dealer places an order            (orders/{id}            created)
     • a dealer cancels an order           (orders/{id}            status → cancelled)
     • a distributor places an order       (distributor_orders/{id} created)
     • a distributor requests a product    (distributor_requests/{id} created)

   The bot token and the recipient list live in the Firestore document  private/telegram,
   which only the OWNER admin can read (see firestore.rules). Dealers never see it.

   ► REGION must match your Firestore database location (Firebase console → Firestore → Data,
     the location is shown next to the database name). India users normally have asia-south1.
   ========================================================================== */
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const M = require('./messages');

const REGION = 'asia-south1';
setGlobalOptions({ region: REGION, maxInstances: 5, memory: '256MiB' });
admin.initializeApp();
const db = admin.firestore();

const FRESH_MS = 15 * 60 * 1000;     // ignore documents older than this (stops a data import / restore from spamming Telegram)
const DEFAULT_EVENTS = { order: true, cancel: true, distOrder: true, distRequest: true };

async function sendTelegram(token, chatId, text) {
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.description || ('HTTP ' + res.status));
}

/* Functions can be delivered twice; this makes a second delivery of the same event a no-op. */
async function claim(eventId) {
  try { await db.collection('notify_sent').doc(String(eventId)).create({ at: Date.now() }); return true; }
  catch (e) { if (e.code === 6 || /already exists/i.test(String(e.message))) return false; throw e; }
}

async function notify(kind, key, build) {
  const snap = await db.doc('private/telegram').get();
  const cfg = snap.exists ? snap.data() : null;
  if (!cfg || !cfg.token) return;
  const events = Object.assign({}, DEFAULT_EVENTS, cfg.events || {});
  if (!events[kind]) return;
  const to = (cfg.recipients || []).filter(r => r && r.enabled !== false && r.chatId);
  if (!to.length) return;
  if (!(await claim(key))) return;   // same key the admin-page watcher uses: whoever claims first sends

  const text = build(cfg);
  const results = await Promise.allSettled(to.map(r => sendTelegram(cfg.token, r.chatId, text)));
  const sent = results.filter(r => r.status === 'fulfilled').length;
  const errors = results.map((r, i) => r.status === 'rejected' ? (to[i].name || to[i].chatId) + ': ' + r.reason.message : null).filter(Boolean);
  const status = { lastAt: Date.now(), kind: kind, sent: sent, failed: errors.length, lastError: errors.join('; ').slice(0, 400) };
  if (sent) status.lastOkAt = Date.now();
  await db.doc('private/telegram_status').set(status, { merge: true });
  errors.forEach(e => console.warn('[telegram]', e));
}

const fresh = d => Date.now() - (Number(d && d.createdAt) || 0) <= FRESH_MS;

exports.notifyNewOrder = onDocumentCreated('orders/{id}', async (event) => {
  const o = event.data && event.data.data();
  if (!o || !fresh(o)) return;
  await notify('order', 'order_' + event.params.id, cfg => M.newOrder(o, cfg));
});

exports.notifyOrderCancelled = onDocumentUpdated('orders/{id}', async (event) => {
  const before = event.data && event.data.before.data(), after = event.data && event.data.after.data();
  if (!before || !after || before.status === 'cancelled' || after.status !== 'cancelled') return;
  await notify('cancel', 'cancel_' + event.params.id, cfg => M.cancelled(after, cfg));
});

exports.notifyDistributorOrder = onDocumentCreated('distributor_orders/{id}', async (event) => {
  const o = event.data && event.data.data();
  if (!o || !fresh(o)) return;
  await notify('distOrder', 'distOrder_' + event.params.id, cfg => M.distOrder(o, cfg));
});

exports.notifyDistributorRequest = onDocumentCreated('distributor_requests/{id}', async (event) => {
  const r = event.data && event.data.data();
  if (!r || r.status !== 'pending' || !fresh(r)) return;
  await notify('distRequest', 'distRequest_' + event.params.id, cfg => M.distRequest(r, cfg));
});