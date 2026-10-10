/* ==========================================================================
   AshirvadConnect — Admin › 🔔 Notifications  (Telegram order alerts)
   OWNER ONLY. The bot token + recipient list are stored in Firestore doc  private/telegram
   (readable only by the owner admin). The actual messages are sent by the Cloud Function in
   functions/index.js, so they are delivered even when nobody has the admin page open.
   FREE MODE (no Cloud Function, no billing card): while an admin page is open, THIS file watches for new
   orders and sends the Telegram message from the owner's browser. A create-only marker document
   (notify_sent/<event>) guarantees each alert is sent once, even with several admin pages open or the
   optional server function deployed as well.
   Loaded after js/app.js by js/cloud/firebase-boot.js.
   ========================================================================== */
(function(){
'use strict';
var CLOUD = window.AC_CLOUD, API;
if(!CLOUD || !CLOUD.enabled || CLOUD.role !== 'admin') return;
var OWNER = !CLOUD.staffRole || CLOUD.staffRole === 'owner';
var EVENTS = [
  ['order', '🛒 A dealer places an order'],
  ['cancel', '❌ A dealer cancels an order'],
  ['distOrder', '📦 A distributor places an order with you'],
  ['distRequest', '📥 A distributor asks to add a new product']
];
var S = { cfg: null, status: null, ready: false, found: null, started: false, busy: false, msg: '' };

function esc(s){ return API.esc(s); }
function toast(m){ API.showToast(m); }
function main(){ return document.getElementById('adminMain'); }
function tabActive(){ var b = document.querySelector('.admin-tabs button.active'); return !!b && b.getAttribute('data-atab') === 'notifications'; }
function typing(){ var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && main() && main().contains(a)); }
function FV(){ return CLOUD.firebase.firestore.FieldValue; }
function cfgRef(){ return CLOUD.db.doc('private/telegram'); }
function ago(ts){ if(!ts) return 'never'; var s = Math.floor((Date.now() - ts) / 1000); if(s < 60) return 'just now'; if(s < 3600) return Math.floor(s / 60) + ' min ago'; if(s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
function recipients(){ return (S.cfg && S.cfg.recipients) || []; }
function events(){ return Object.assign({ order: true, cancel: true, distOrder: true, distRequest: true }, (S.cfg && S.cfg.events) || {}); }
function save(patch, note){
  return cfgRef().set(patch, { merge: true }).then(function(){ if(note) API.logAudit('Telegram notifications', note); })
    .catch(function(e){ toast('Could not save: ' + (e.code === 'permission-denied' ? 'owner only' : e.message)); throw e; });
}

/* --------------------------------------------------------- Telegram Bot API (called from this browser) */
function tg(token, method, params){
  /* form-encoded = a "simple" request, so the browser needs no CORS preflight */
  return fetch('https://api.telegram.org/bot' + token + '/' + method, { method: 'POST', body: new URLSearchParams(params || {}) })
    .then(function(r){ return r.json(); }, function(){ throw new Error('This browser could not reach Telegram. Check the internet connection or an ad-blocker.'); })
    .then(function(j){ if(!j.ok) throw new Error(j.description || 'Telegram refused the request'); return j.result; });
}
function plain(s){ return String(s == null ? '' : s); }


/* ------------------------------------------------------------ message texts (same as functions/messages.js) */
function h(x){ return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inr(n){ return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function cut(t){ return t.length > 3900 ? t.slice(0, 3850) + '\n… (message shortened)' : t; }
function lnk(c){ return c && c.adminUrl ? '\n🔗 ' + h(c.adminUrl) : ''; }
function rows(list, f){ var a = (list || []).slice(0, 20).map(f); if((list || []).length > 20) a.push('… +' + (list.length - 20) + ' more item(s)'); return a.join('\n'); }
var MSG = {
  order: function(o, c){
    return cut('🛒 <b>New order ' + h(o.id) + '</b>\n🏢 ' + h(o.dealerBusiness || o.dealerGst) + (o.dealerGst && o.dealerBusiness ? ' (' + h(o.dealerGst) + ')' : '') + '\n' +
      (o.accountKey ? '📞 ' + h(o.accountKey) + '\n' : '') + (o.date ? '🕒 ' + h(o.date) + '\n' : '') + '\n' +
      rows(o.items, function(i){ return '• ' + h(i.name) + ' × ' + h(i.qty) + ' — ' + inr(i.price * i.qty); }) + '\n\n' +
      '💰 Items: ' + inr(o.total) + (Number(o.deliveryCharge) ? '\n🚚 Delivery: ' + inr(o.deliveryCharge) : '') + '\n<b>Payable: ' + inr(Number(o.total || 0) + Number(o.deliveryCharge || 0)) + '</b>' +
      (o.deliveryAddress ? '\n📍 ' + h(o.deliveryAddress) : '') + lnk(c));
  },
  cancel: function(o, c){ return cut('❌ <b>Order ' + h(o.id) + ' cancelled</b>\n🏢 ' + h(o.dealerBusiness || o.dealerGst) + '\n💰 ' + inr(Number(o.total || 0) + Number(o.deliveryCharge || 0)) + lnk(c)); },
  distOrder: function(o, c){
    return cut('📦 <b>Distributor order ' + h(o.no || o.id) + '</b>\n🚚 ' + h(o.distributorName || o.distributorId) + (o.by && o.by !== o.distributorId ? ' (by ' + h(o.by) + ')' : '') + '\n\n' +
      rows(o.lines, function(l){ return '• ' + h(l.name) + (l.size ? ' ' + h(l.size) : '') + ' × ' + h(l.qty); }) + '\n\n<b>Total units: ' + h(o.units) + '</b>' + (o.note ? '\n📝 ' + h(o.note) : '') + lnk(c));
  },
  distRequest: function(r, c){ return cut('📥 <b>Product request</b>\n🚚 ' + h(r.distributorId) + '\n• ' + h(r.name) + (r.size ? ' (' + h(r.size) + ')' : '') + '\nPart: ' + h(r.part) + ' · stock ' + h(r.qty) + (r.note ? '\n📝 ' + h(r.note) : '') + lnk(c)); }
};

/* ------------------------------------------------------------ FREE MODE: this admin page watches and sends */
var W = { started: false, queue: null, resolveReady: null, watching: false };
var WINDOW_MS = 3 * 3600 * 1000;      // on page open, orders from the last 3 hours that nobody announced yet are sent
var cfgReady = new Promise(function(res){ W.resolveReady = res; });
function noop(){}
function wOn(){ var c = S.cfg || {}; return !!(c.token && c.browserSend !== false && recipients().some(function(r){ return r.enabled !== false; })); }
function deliver(kind, key, build){
  return cfgReady.then(function(){
    var c = S.cfg || {};
    if(!wOn() || !events()[kind]) return;
    var to = recipients().filter(function(r){ return r.enabled !== false && r.chatId; });
    return CLOUD.db.collection('notify_sent').doc(key).set({ at: Date.now(), via: 'admin page' }).then(function(){
      var text = build(c);
      return Promise.all(to.map(function(r){
        return tg(c.token, 'sendMessage', { chat_id: r.chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: 'true' })
          .then(function(){ return null; }, function(err){ return (r.name || r.chatId) + ': ' + err.message; });
      })).then(function(res){
        var bad = res.filter(Boolean), st = { lastAt: Date.now(), kind: kind, sent: to.length - bad.length, failed: bad.length, lastError: bad.join('; ').slice(0, 400), via: 'admin page' };
        if(st.sent) st.lastOkAt = Date.now();
        return CLOUD.db.doc('private/telegram_status').set(st, { merge: true }).catch(noop);
      });
    }, function(err){ if(err && err.code === 'permission-denied') return; throw err; });   // marker already exists = somebody already announced it
  });
}
function enqueue(kind, key, build){
  W.queue = (W.queue || Promise.resolve()).then(function(){ return deliver(kind, key, build); })
    .catch(function(e){ console.warn('[telegram]', e && e.message || e); })
    .then(function(){ return new Promise(function(r){ setTimeout(r, 400); }); });   // stay well under Telegram's rate limit
}
function startWatch(){
  if(W.started || !OWNER) return; W.started = true; W.watching = true;
  var db = CLOUD.db, since = Date.now() - WINDOW_MS;
  function watch(coll, onAdded, onModified, extra){
    var q = db.collection(coll).where('createdAt', '>', since);
    q.onSnapshot(function(snap){
      snap.docChanges().forEach(function(ch){
        var d = ch.doc.data(), id = ch.doc.id;
        if(ch.type === 'added') onAdded(id, d); else if(ch.type === 'modified' && onModified) onModified(id, d);
      });
    }, function(e){ console.warn('[telegram] watch ' + coll + ':', e && e.message || e); });
  }
  watch('orders',
    function(id, d){ if(d.status !== 'cancelled') enqueue('order', 'order_' + id, function(c){ return MSG.order(d, c); }); },
    function(id, d){ if(d.status === 'cancelled') enqueue('cancel', 'cancel_' + id, function(c){ return MSG.cancel(d, c); }); });
  watch('distributor_orders', function(id, d){ enqueue('distOrder', 'distOrder_' + id, function(c){ return MSG.distOrder(d, c); }); });
  watch('distributor_requests', function(id, d){ if(d.status === 'pending') enqueue('distRequest', 'distRequest_' + id, function(c){ return MSG.distRequest(d, c); }); });
}

/* ---------------------------------------------------------------- live data */
function start(){
  if(S.started || !OWNER) return; S.started = true;
  cfgRef().onSnapshot(function(d){ S.cfg = d.exists ? d.data() : {}; S.ready = true; W.resolveReady(); startWatch(); refresh(); }, function(e){ S.ready = true; W.resolveReady(); S.msg = 'Could not load: ' + e.message; refresh(); });
  CLOUD.db.doc('private/telegram_status').onSnapshot(function(d){ S.status = d.exists ? d.data() : null; refresh(); }, function(){});
}
function refresh(){ if(tabActive() && !typing() && !S.busy) render(); }

/* ------------------------------------------------------------------ render */
function render(){
  API = window.__acApi;
  var m = main();
  if(!OWNER){ m.innerHTML = '<div class="admin-empty"><div class="ae-big">Owner only</div><div>Only the owner login can change notification settings.</div></div>'; return; }
  start();
  if(!S.ready){ m.innerHTML = '<div class="ac-sub" style="padding:16px">Loading…</div>'; return; }
  var c = S.cfg || {}, hasToken = !!c.token, st = S.status, list = recipients(), ev = events();
  var h = '<div class="admin-toolbar"><h2>Notifications</h2></div>';
  if(S.msg){ h += '<div class="admin-card"><div class="ac-sub">' + esc(S.msg) + '</div></div>'; }

  /* status */
  var on = list.filter(function(r){ return r.enabled !== false; }).length;
  h += '<div class="admin-card"><div class="ac-title">' + (hasToken && on ? '🟢 Telegram alerts are ON' : '⚪ Telegram alerts are OFF') + '</div>' +
    '<div class="ac-sub">' + (c.browserSend !== false ? '👀 <b>Free mode</b> — new orders are sent from this admin page while it is open (any tab, any admin device logged in as owner). Keep <b>/admin/</b> open on a PC or phone to receive alerts.<br>' : '') + (hasToken ? 'Bot: ' + (c.botUsername ? '<b><a href="https://t.me/' + esc(c.botUsername) + '" target="_blank" rel="noopener">@' + esc(c.botUsername) + '</a></b>' : 'saved') + ' · ' : 'No bot connected yet · ') +
    on + ' recipient(s) switched on</div>' +
    (st ? '<div class="ac-sub">Last alert: ' + ago(st.lastAt) + ' — ' + esc(st.sent || 0) + ' sent' + (st.via ? ' (from ' + esc(st.via) + ')' : '') + (st.failed ? ', <b style="color:#a12626">' + esc(st.failed) + ' failed</b>' : '') + (st.lastError ? '<br><span style="color:#a12626">' + esc(st.lastError) + '</span>' : '') + '</div>'
         : '<div class="ac-sub">No alert has been sent yet. Press “Send test” below, then place a test order as a dealer while this page is open.</div>') + '</div>';

  /* step 1: bot */
  h += '<div class="admin-card"><div class="ac-title">1 · Connect your Telegram bot</div>' +
    '<div class="ac-sub">In Telegram open <b>@BotFather</b> → send <code>/newbot</code> → choose a name → copy the token it gives you (looks like <code>123456789:AAH…</code>).</div>' +
    (hasToken ? '<div class="ac-sub mt-2">Token saved (ends …<b>' + esc(plain(c.token).slice(-4)) + '</b>). Paste a new one below to replace it.</div>' : '') +
    '<div class="admin-form-grid mt-2"><div class="full"><label>Bot token</label><input type="password" id="tgToken" autocomplete="off" placeholder="123456789:AAH…"></div>' +
    '<div class="full"><label>Link shown in messages (optional)</label><input id="tgAdminUrl" value="' + esc(c.adminUrl || '') + '" placeholder="https://yourdomain.com/admin/"></div></div>' +
    '<div class="ac-actions"><button class="btn-admin sm" id="tgSaveToken">Check &amp; save</button>' +
    (hasToken ? '<button class="btn-admin sm outline" id="tgSaveUrl">Save link only</button><button class="btn-admin sm maroon" id="tgRemoveToken">Disconnect bot</button>' : '') + '</div></div>';

  /* step 2: recipients */
  h += '<div class="admin-card"><div class="ac-title">2 · Who receives the alerts</div>' +
    '<div class="ac-sub">Every person (or group) you add here gets each alert. Switch someone off to pause their alerts without deleting them.</div>';
  if(!list.length) h += '<div class="ac-sub mt-2"><i>Nobody added yet.</i></div>';
  list.forEach(function(r, i){
    h += '<div class="oi-line" style="align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid #eee;padding:8px 0">' +
      '<span style="flex:1;min-width:140px"><b>' + esc(r.name || 'Unnamed') + '</b><br><span class="ac-sub">ID ' + esc(r.chatId) + '</span></span>' +
      '<label style="display:flex;gap:5px;align-items:center;margin:0"><input type="checkbox" data-rtog="' + i + '"' + (r.enabled !== false ? ' checked' : '') + '> On</label>' +
      '<button class="btn-admin sm outline" data-rtest="' + i + '">Send test</button>' +
      '<button class="btn-admin sm maroon" data-rdel="' + i + '">Remove</button></div>';
  });
  h += '<div class="ac-title mt-3" style="font-size:14px">Add a person or group</div>' +
    '<div class="ac-sub"><b>Easiest:</b> the person opens your bot in Telegram and presses <b>Start</b> (for a group: add the bot to the group and write any message). Then press <b>Find people</b>.</div>' +
    '<div class="ac-actions"><button class="btn-admin sm" id="tgFind"' + (hasToken ? '' : ' disabled') + '>🔍 Find people who messaged the bot</button></div>';
  if(S.found){
    h += S.found.length ? S.found.map(function(f, i){
      var have = list.some(function(r){ return String(r.chatId) === String(f.id); });
      return '<div class="oi-line" style="align-items:center;gap:8px;border-top:1px solid #eee;padding:6px 0"><span style="flex:1"><b>' + esc(f.label) + '</b> <span class="ac-sub">' + esc(f.kind) + ' · ID ' + esc(f.id) + '</span></span>' +
        (have ? '<span class="ac-sub">✔ added</span>' : '<button class="btn-admin sm" data-fadd="' + i + '">Add</button>') + '</div>';
    }).join('') : '<div class="ac-sub mt-2">Nobody found. Ask them to open the bot and press Start, then try again. (Telegram only keeps messages for 24 hours.)</div>';
  }
  h += '<div class="ac-sub mt-3"><b>Or enter manually</b> — Chat ID (a number; groups start with <code>-</code>) or a public channel like <code>@mychannel</code>:</div>' +
    '<div class="admin-form-grid"><div><label>Name</label><input id="tgName" placeholder="e.g. Owner / Warehouse"></div><div><label>Chat ID</label><input id="tgChat" placeholder="123456789"></div></div>' +
    '<div class="ac-actions"><button class="btn-admin sm" id="tgAdd">+ Add</button></div></div>';

  /* step 3: events */
  h += '<div class="admin-card"><div class="ac-title">3 · What to notify</div>' +
    EVENTS.map(function(e){ return '<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-ev="' + e[0] + '"' + (ev[e[0]] ? ' checked' : '') + '> ' + e[1] + '</label>'; }).join('') +
    '<label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0 4px"><input type="checkbox" data-bsend' + (c.browserSend !== false ? ' checked' : '') + '> <span><b>Send alerts from this admin page (free)</b><br><span class="ac-sub">Works without any paid plan. Alerts go out only while an owner admin page is open. Untick it only if you have deployed the server function.</span></span></label>' +
    '<div class="ac-actions"><button class="btn-admin sm outline" id="tgTestAll"' + (hasToken && on ? '' : ' disabled') + '>Send a test to everyone who is ON</button></div></div>';
  m.innerHTML = h;
}

/* ------------------------------------------------------------------ actions */
function guard(fn){ return function(){ if(S.busy) return; S.busy = true; Promise.resolve().then(fn).catch(function(e){ if(e && e.message) toast(e.message); }).then(function(){ S.busy = false; if(tabActive()) render(); }); }; }
function sendTo(r, text){ return tg(S.cfg.token, 'sendMessage', { chat_id: r.chatId, text: text }); }

document.addEventListener('change', function(e){
  if(!tabActive()) return; var t = e.target;
  if(t.hasAttribute('data-rtog')){ var list = recipients().slice(), i = Number(t.getAttribute('data-rtog')); list[i] = Object.assign({}, list[i], { enabled: t.checked }); save({ recipients: list }, (t.checked ? 'Enabled ' : 'Paused ') + (list[i].name || list[i].chatId)).catch(function(){}); }
  else if(t.hasAttribute('data-bsend')){ save({ browserSend: t.checked }, 'Free mode ' + (t.checked ? 'on' : 'off')).catch(noop); }
  else if(t.hasAttribute('data-ev')){ var ev = events(); ev[t.getAttribute('data-ev')] = t.checked; save({ events: ev }, 'Event settings changed').catch(function(){}); }
});
document.addEventListener('click', function(e){
  if(!tabActive()) return; var t = e.target.closest ? e.target.closest('button') : e.target; if(!t) return;
  var list = recipients(), id = t.id;
  if(id === 'tgSaveToken') guard(function(){
    var token = document.getElementById('tgToken').value.trim(), url = document.getElementById('tgAdminUrl').value.trim();
    if(!token){ toast('Paste the token from BotFather first'); return; }
    return tg(token, 'getMe').then(function(me){
      if(!url && !/^(localhost|127\.)/.test(location.hostname)) url = location.origin + '/admin/';
      return save({ token: token, botUsername: me.username || '', botName: me.first_name || '', adminUrl: url, updatedAt: Date.now() }, 'Telegram bot connected (@' + me.username + ')').then(function(){ toast('✔ Connected to @' + me.username); });
    }, function(err){ throw new Error('Token not accepted: ' + err.message); });
  })();
  else if(id === 'tgSaveUrl') guard(function(){ return save({ adminUrl: document.getElementById('tgAdminUrl').value.trim() }).then(function(){ toast('Saved'); }); })();
  else if(id === 'tgRemoveToken'){ if(confirm('Disconnect the bot? No alerts will be sent until you connect one again.')) guard(function(){ return cfgRef().update({ token: FV().delete(), botUsername: FV().delete(), botName: FV().delete() }).then(function(){ API.logAudit('Telegram notifications', 'Bot disconnected'); toast('Disconnected'); }); })(); }
  else if(id === 'tgFind') guard(function(){
    return tg(S.cfg.token, 'getUpdates', { limit: 100, timeout: 0 }).then(function(ups){
      var seen = {}, out = [];
      ups.forEach(function(u){
        var m = u.message || u.edited_message || u.channel_post || (u.my_chat_member && { chat: u.my_chat_member.chat }); if(!m || !m.chat || seen[m.chat.id]) return;
        var c = m.chat; seen[c.id] = 1;
        var label = c.type === 'private' ? ([c.first_name, c.last_name].filter(Boolean).join(' ') + (c.username ? ' (@' + c.username + ')' : '')) : (c.title || String(c.id));
        out.push({ id: c.id, label: label || String(c.id), kind: c.type === 'private' ? 'person' : c.type });
      });
      S.found = out;
    });
  })();
  else if(id === 'tgAdd') guard(function(){
    var name = document.getElementById('tgName').value.trim(), chat = document.getElementById('tgChat').value.trim();
    if(!/^(-?\d{5,20}|@[A-Za-z][A-Za-z0-9_]{4,})$/.test(chat)){ toast('Chat ID must be a number (groups start with -) or @channelname'); return; }
    if(list.some(function(r){ return String(r.chatId) === chat; })){ toast('Already added'); return; }
    return save({ recipients: list.concat([{ name: name || chat, chatId: chat, enabled: true }]) }, 'Recipient added: ' + (name || chat)).then(function(){ toast('Added'); });
  })();
  else if(t.hasAttribute('data-fadd')) guard(function(){
    var f = S.found[Number(t.getAttribute('data-fadd'))];
    return save({ recipients: list.concat([{ name: f.label, chatId: String(f.id), enabled: true }]) }, 'Recipient added: ' + f.label).then(function(){ toast('Added ' + f.label); });
  })();
  else if(t.hasAttribute('data-rdel')){ var i = Number(t.getAttribute('data-rdel')); if(confirm('Remove ' + (list[i].name || list[i].chatId) + '?')) guard(function(){ var n = list.slice(); var gone = n.splice(i, 1)[0]; return save({ recipients: n }, 'Recipient removed: ' + (gone.name || gone.chatId)); })(); }
  else if(t.hasAttribute('data-rtest')) guard(function(){ var r = list[Number(t.getAttribute('data-rtest'))]; return sendTo(r, '✅ Test from AshirvadConnect — you will receive order alerts here.').then(function(){ toast('Test sent to ' + (r.name || r.chatId)); }, function(err){ throw new Error('Not delivered: ' + err.message + (/chat not found|blocked|forbidden/i.test(err.message) ? ' — this person must open the bot and press Start first.' : '')); }); })();
  else if(id === 'tgTestAll') guard(function(){
    var on = list.filter(function(r){ return r.enabled !== false; });
    return Promise.all(on.map(function(r){ return sendTo(r, '✅ Test from AshirvadConnect — alerts are working.').then(function(){ return null; }, function(err){ return (r.name || r.chatId) + ': ' + err.message; }); }))
      .then(function(res){ var bad = res.filter(Boolean); toast(bad.length ? (on.length - bad.length) + ' sent. Failed — ' + bad.join('; ') : '✔ Test sent to ' + on.length + ' recipient(s)'); });
  })();
});

API = window.__acApi;
if(OWNER) start();   // begin watching straight away — the Notifications tab does not have to be open
window.__acAdminTabs = window.__acAdminTabs || {};
window.__acAdminTabs.notifications = function(){ API = window.__acApi; render(); };
})();