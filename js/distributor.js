/* ==========================================================================
   AshirvadConnect — Distributor portal  (/distributor/)
   Separate login, separate Firebase session (named app "distributor"), so it never
   logs out the dealer store or the admin console in the same browser.
   A distributor can only: see products the admin assigned, see prices if the admin
   allowed it, update his own stock, and (if allowed) request new products.
   ========================================================================== */
(function(){
'use strict';
var cfg = window.AC_FIREBASE_CONFIG || {};
var opt = window.AC_CLOUD_OPTIONS || {};
var DOMAIN = opt.distributorEmailDomain || 'distributor.ashirvadconnect.app';
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function slug(s){ return String(s || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, ''); }
function partKey(s){ return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function money(n){ return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function ago(ts){
  if(!ts) return 'never';
  var s = Math.floor((Date.now() - ts) / 1000);
  if(s < 60) return 'just now';
  if(s < 3600) return Math.floor(s / 60) + ' min ago';
  if(s < 86400) return Math.floor(s / 3600) + ' h ago';
  return Math.floor(s / 86400) + ' d ago';
}
var toastT;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('show'); }, 2600); }

if(!cfg.apiKey || /PASTE|YOUR_|XXXX/i.test(cfg.apiKey)){ $('loginErr').textContent = 'Cloud is not configured — the distributor portal needs Firebase.'; return; }

var app = firebase.initializeApp(cfg, 'distributor');
var auth = app.auth(), db = app.firestore();
/* OFFLINE: Firestore keeps a copy on the device. Reads come from it when there is no internet and every write
   (stock edits, sales, orders) is queued and sent automatically when the connection returns. */
try{ db.enablePersistence({ synchronizeTabs: true }).catch(function(){ }); }catch(e){}
var FV = firebase.firestore.FieldValue;
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function(){ }); }   // lets the page itself open offline

var me = null, items = [], reqs = [], dirty = {}, unsubs = [];
var tab = 'stock', sortBy = 'name', hPeriod = '7', hist = null, histKey = '';
var OWNER_PERMS = { stock: 'edit', sales: 'manage', orders: 'place', history: 'view', price: 'view', requests: 'add' };
var P = OWNER_PERMS, team = null, loginId = '', queued = 0, pendingFlags = {};
var salesList = [], ordersList = [], saleLines = [], saleMeta = { customer: '', note: '' }, cart = [], orderNote = '', slQuery = '', orQuery = '', prevOrderStatus = {}, pendingRender = false;
function allow(k, levels){ return levels.indexOf(P[k]) >= 0; }
function lsGet(k, def){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }catch(e){ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function saveDrafts(){ if(!me) return; lsSet('acd_sale_' + me.id + '_' + loginId, { l: saleLines, m: saleMeta }); lsSet('acd_cart_' + me.id + '_' + loginId, { c: cart, n: orderNote }); }
function itemById(id){ return items.filter(function(x){ return x.id === id; })[0]; }
function fmtT(ts){ return ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }

/* ---- connection / sync banner ---- */
var syncBar = document.createElement('div'); syncBar.id = 'syncBar'; $('view').parentNode.insertBefore(syncBar, $('view'));
function anyPending(){ return Object.keys(pendingFlags).some(function(k){ return pendingFlags[k]; }); }
function renderSync(){
  var off = navigator.onLine === false, wait = queued > 0 || anyPending();
  syncBar.className = off ? 'off' : (wait ? 'syn' : '');
  syncBar.textContent = off ? '📴 No internet — everything you enter is saved on this phone and will sync automatically' + (wait ? ' (changes waiting)' : '') : (wait ? '🔄 Syncing your changes…' : '');
}
window.addEventListener('online', renderSync); window.addEventListener('offline', renderSync);
function setPending(k, snap){ pendingFlags[k] = !!(snap && snap.metadata && snap.metadata.hasPendingWrites); renderSync(); }
/* a write is queued immediately; the promise only settles when the server answers (maybe much later when offline) */
function commitBatch(batch, okMsg){
  queued++; renderSync();
  batch.commit().then(function(){ queued--; renderSync(); }, function(ex){
    queued--; renderSync();
    toast('⚠ A change could not be saved: ' + (ex && ex.code === 'permission-denied' ? 'not allowed (stock may be too low, an item was hidden, or you lack permission)' : ((ex && ex.message) || ex)));
  });
  toast(navigator.onLine === false ? '✔ Saved on this phone — will sync when online' : okMsg);
}
function typingInForm(){ var a = document.activeElement; return !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && $('view').contains(a) && (tab === 'sales' || tab === 'orders')); }
function softRender(){ if(typingInForm()){ pendingRender = true; return; } render(); }
document.addEventListener('focusout', function(){ if(pendingRender) setTimeout(function(){ if(!typingInForm()){ pendingRender = false; render(); } }, 60); });
function renderKeep(){ var a = document.activeElement, id = a && a.id, pos = null; try{ pos = a.selectionStart; }catch(e){} render(); if(id){ var el = $(id); if(el){ el.focus(); try{ if(pos != null) el.setSelectionRange(pos, pos); }catch(e){} } } }

var filter = 'all', query = '';
var IDLE_MS = 15 * 60 * 1000, idleT;

/* ------------------------------------------------------------------ login */
$('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  var u = slug($('dUser').value), p = $('dPass').value, err = $('loginErr');
  err.textContent = '';
  if(!u || !p){ err.textContent = 'Enter your Distributor ID and password.'; return; }
  $('loginBtn').disabled = true;
  auth.signInWithEmailAndPassword(u + '@' + DOMAIN, p).catch(function(ex){
    var c = (ex && ex.code) || '';
    err.textContent = /invalid-credential|wrong-password|user-not-found|invalid-login/.test(c) ? 'Wrong Distributor ID or password.'
      : c === 'auth/too-many-requests' ? 'Too many attempts. Wait a few minutes.'
      : c === 'auth/network-request-failed' ? 'No internet connection.' : (ex.message || 'Login failed.');
  }).then(function(){ $('loginBtn').disabled = false; });
});
$('logoutBtn').addEventListener('click', function(){ auth.signOut(); });

auth.onAuthStateChanged(function(user){
  stopListening();
  if(!user){ me = null; $('appWrap').classList.add('d-none'); $('loginWrap').classList.remove('d-none'); return; }
  var mail = String(user.email || '').toLowerCase();
  if(mail.slice(-(DOMAIN.length + 1)) !== '@' + DOMAIN){ $('loginErr').textContent = 'This login is not a distributor account.'; return auth.signOut(); }
  loginId = mail.split('@')[0];
  // online: ask the server. Only when the device is really offline fall back to the saved copy; any other error is shown as it is.
  var read = function(ref){ return ref.get().catch(function(ex){
    if(ex && (ex.code === 'unavailable' || navigator.onLine === false)) return ref.get({ source: 'cache' });
    throw ex;
  }); };
  // 1) is this a TEAM member of a distributor (with a role), or the distributor himself?
  read(db.collection('distributor_users').doc(loginId)).then(function(t){
    if(!t.exists){ team = null; P = OWNER_PERMS; return loginId; }
    team = t.data(); team.id = loginId;
    if(team.isActive === false) throw new Error('Your login is switched off. Contact the distributor or the admin.');
    return read(db.collection('roles').doc(team.roleId)).then(function(r){
      if(!r.exists) throw new Error('Your role is missing. Contact the admin.');
      P = Object.assign({}, r.data().perms || {}); return team.distributorId;
    });
  }).then(function(distId){
    return read(db.collection('distributors').doc(distId)).then(function(d){
      if(!d.exists || d.data().isActive === false){ throw new Error(d.exists ? 'Your account is inactive. Contact the admin.' : 'This login is not linked to a distributor.'); }
      startSession(distId);
    });
  }).catch(function(ex){
    $('loginErr').textContent = ex && ex.code === 'permission-denied' ? 'Access is not set up yet. Ask the admin to publish the latest Firebase rules (firebase deploy --only firestore).'
      : ex && /cache/i.test(ex.message || '') ? 'Could not load your account — connect to the internet for the first login.' : ((ex && ex.message) || 'Could not load your account.');
    auth.signOut();
  });
});

function stopListening(){ unsubs.forEach(function(u){ try{ u(); }catch(e){} }); unsubs = []; }
function startSession(id){
  $('loginWrap').classList.add('d-none'); $('appWrap').classList.remove('d-none');
  dirty = {}; items = []; reqs = []; salesList = []; ordersList = []; pendingFlags = {}; prevOrderStatus = {};
  if(['stock', 'sales', 'orders', 'history'].indexOf(tab) < 0 || !tabAllowed(tab)) tab = 'stock';
  var dr = lsGet('acd_sale_' + id + '_' + loginId, null); saleLines = dr && dr.l || []; saleMeta = dr && dr.m || { customer: '', note: '' };
  var cr = lsGet('acd_cart_' + id + '_' + loginId, null); cart = cr && cr.c || []; orderNote = cr && cr.n || '';
  unsubs.push(db.collection('distributors').doc(id).onSnapshot(function(d){
    if(!d.exists || d.data().isActive === false){ toast('Account disabled by admin'); auth.signOut(); return; }
    me = d.data(); me.id = id; softRender();
  }, function(){ }));
  if(team){   // live: a changed role or a switched-off login takes effect straight away
    unsubs.push(db.collection('distributor_users').doc(loginId).onSnapshot(function(t){ if(!t.exists || t.data().isActive === false){ toast('Your login was switched off'); auth.signOut(); } else if(t.data().roleId !== team.roleId){ toast('Your role was changed — reloading'); setTimeout(function(){ location.reload(); }, 1200); } }, function(){ }));
    unsubs.push(db.collection('roles').doc(team.roleId).onSnapshot(function(r){ if(r.exists && JSON.stringify(r.data().perms || {}) !== JSON.stringify(P) && !r.metadata.hasPendingWrites){ toast('Your access was changed — reloading'); setTimeout(function(){ location.reload(); }, 1200); } }, function(){ }));
  }
  unsubs.push(db.collection('distributor_stock').where('distributorId', '==', id).where('visible', '==', true).onSnapshot({ includeMetadataChanges: true }, function(s){
    setPending('stock', s);
    if(!s.docChanges().length && items.length) return;      // only the "synced" flag changed
    items = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }).filter(function(o){ return o.visible === true; });
    items.sort(function(a, b){ return String(a.name).localeCompare(String(b.name)) || String(a.size || '').localeCompare(String(b.size || ''), undefined, { numeric: true }); });
    pruneDirty();
    softRender();
  }, function(ex){ toast('Could not load stock: ' + (ex.code || ex.message)); }));
  unsubs.push(db.collection('distributor_requests').where('distributorId', '==', id).onSnapshot(function(s){
    reqs = s.docs.map(function(x){ var o = x.data(); o.id = o.id || x.id; return o; }).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); });
    softRender();
  }, function(){ }));
  if(allow('sales', ['add', 'manage'])){
    unsubs.push(db.collection('distributor_sales').where('distributorId', '==', id).orderBy('ts', 'desc').limit(100).onSnapshot({ includeMetadataChanges: true }, function(s){
      setPending('sales', s); if(!s.docChanges().length && salesList.length) return;
      salesList = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }); softRender();
    }, function(ex){ toast('Could not load sales' + (ex.code === 'failed-precondition' ? ' — ask the admin to deploy the Firestore indexes' : '')); }));
  }
  if(allow('orders', ['view', 'place'])){
    unsubs.push(db.collection('distributor_orders').where('distributorId', '==', id).orderBy('createdAt', 'desc').limit(100).onSnapshot({ includeMetadataChanges: true }, function(s){
      setPending('orders', s);
      s.docChanges().forEach(function(ch){ var o = ch.doc.data(); if(ch.type === 'modified' && !ch.doc.metadata.hasPendingWrites && prevOrderStatus[ch.doc.id] && prevOrderStatus[ch.doc.id] !== o.status) toast('📦 Order ' + o.no + ' is now ' + o.status); });
      if(!s.docChanges().length && ordersList.length) return;
      ordersList = s.docs.map(function(x){ var o = x.data(); o.id = x.id; prevOrderStatus[x.id] = o.status; return o; }); softRender();
    }, function(ex){ toast('Could not load orders' + (ex.code === 'failed-precondition' ? ' — ask the admin to deploy the Firestore indexes' : '')); }));
  }
  resetIdle();
}
function tabAllowed(t){ return t === 'stock' || (t === 'sales' && allow('sales', ['add', 'manage'])) || (t === 'orders' && allow('orders', ['view', 'place'])) || (t === 'history' && allow('history', ['view'])); }

/* ------------------------------------------------------------ idle logout */
function resetIdle(){ clearTimeout(idleT); if(!me && !auth.currentUser) return; idleT = setTimeout(function(){ if(navigator.onLine === false || queued > 0 || anyPending()){ resetIdle(); return; } toast('Logged out (inactive)'); auth.signOut(); }, IDLE_MS); }
['click', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, function(){ if(auth.currentUser) resetIdle(); }, { passive: true }); });

/* ----------------------------------------------------------------- render */
/* drop unsaved edits for items that were hidden by the admin or whose saved value now equals the edit */
function pruneDirty(){
  Object.keys(dirty).forEach(function(id){
    var it = items.filter(function(x){ return x.id === id; })[0];
    if(!it || dirty[id] === (Number(it.qty) || 0)) delete dirty[id];
  });
}
function lowAt(){ return Number(me && me.lowStockAt) || 10; }
function curQty(it){ return dirty[it.id] !== undefined ? dirty[it.id] : (Number(it.qty) || 0); }
function statusOf(q){ return q <= 0 ? 'oos' : (q <= lowAt() ? 'low' : 'ok'); }

function render(){
  if(!me) return;
  if(!tabAllowed(tab)) tab = 'stock';
  $('who').innerHTML = 'Signed in as <b>' + esc(team ? team.name : (me.name || me.id)) + '</b>' + (team ? ' · ' + esc(me.name || me.id) : (me.city ? ' · ' + esc(me.city) : ''));
  var active = document.activeElement, keepId = active && active.getAttribute && active.getAttribute('data-qty'), keepPos = null;
  try{ if(keepId) keepPos = active.selectionStart; }catch(e){}
  var low = 0, oos = 0;
  items.forEach(function(it){ var s = statusOf(curQty(it)); if(s === 'low') low++; if(s === 'oos') oos++; });
  var q = query.toLowerCase();
  var list = items.filter(function(it){
    if(filter !== 'all' && statusOf(curQty(it)) !== filter) return false;
    return !q || (String(it.name) + ' ' + String(it.part) + ' ' + String(it.size || '')).toLowerCase().indexOf(q) >= 0;
  });
  var fresh = Math.max(Number(me.lastConfirmedAt) || 0, items.reduce(function(m, it){ return Math.max(m, it.updatedAt || 0); }, 0));
  var stale = items.length && (!fresh || Date.now() - fresh > 7 * 86400000);
  if(tab === 'history'){ renderHistory(); return; }
  if(tab === 'sales'){ renderSales(); return; }
  if(tab === 'orders'){ renderOrders(); return; }
  var canEdit = allow('stock', ['edit']), canOrder = allow('orders', ['place']);
  var units = items.reduce(function(a, it){ return a + curQty(it); }, 0);
  if(sortBy === 'low') list.sort(function(a, b){ return curQty(a) - curQty(b); });
  else if(sortBy === 'old') list.sort(function(a, b){ return (a.updatedAt || 0) - (b.updatedAt || 0); });
  else if(sortBy === 'new') list.sort(function(a, b){ return (b.updatedAt || 0) - (a.updatedAt || 0); });
  var h = tabsHtml() + (me.notice ? '<div class="chip" style="width:100%;background:#fff7dc;border-color:var(--gold);margin-bottom:8px">📌 ' + esc(me.notice) + '</div>' : '') +
    (items.length ? '<div class="chip" style="width:100%;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;' + (stale ? 'border-color:var(--warn);background:#fff8ea' : '') + '">' +
      '<span>Stock last confirmed: <b style="display:inline;font-size:13px;font-family:inherit">' + ago(fresh) + '</b>' + (stale ? ' ⚠' : '') + '</span>' +
      (canEdit ? '<button class="btn gold" id="confirmBtn" style="padding:6px 12px">✔ All up to date</button>' : '') + '</div>' : '') +
    '<div class="chips">' +
    '<div class="chip" data-f="all" style="cursor:pointer"><b>' + items.length + '</b>Products</div><div class="chip"><b id="cUnits">' + units + '</b>Total units</div>' +
    '<div class="chip" data-f="low" style="cursor:pointer"><b id="cLow" style="color:var(--warn)">' + low + '</b>Low stock</div>' +
    '<div class="chip" data-f="oos" style="cursor:pointer"><b id="cOos" style="color:var(--bad)">' + oos + '</b>Out of stock</div></div>' +
    '<div class="tools"><input id="qBox" type="search" placeholder="Search name, size, part no…" value="' + esc(query) + '">' +
    '<select id="fBox"><option value="all">All</option><option value="low">Low</option><option value="oos">Out</option><option value="ok">In stock</option></select>' +
    '<select id="sBox"><option value="name">Sort: A–Z</option><option value="low">Lowest stock first</option><option value="old">Not updated longest</option><option value="new">Recently updated</option></select>' +
    '<button class="btn ghost" id="shareBtn">📲 Share low-stock list</button>' +
    '<button class="btn ghost" id="csvBtn">⬇ CSV</button>' +
    '<button class="btn ghost" id="tplBtn">⬇ Excel</button>' +
    (canEdit ? '<button class="btn ghost" id="upBtn">⬆ Upload sheet</button><input type="file" id="sheetFile" accept=".xlsx,.xls,.csv" class="d-none">' : '') +
    (me.canUpload && allow('requests', ['add']) ? '<button class="btn gold" id="addBtn">+ Add product</button>' : '') + '</div>';
  if(!items.length) h += '<div class="empty">No products have been assigned to you yet.<br>Please contact the admin.</div>';
  else if(!list.length) h += '<div class="empty">Nothing matches your search.</div>';
  h += '<div id="list">' + list.map(rowHtml).join('') + '</div>';
  if(reqs.length){
    h += '<h3>My product requests</h3>' + reqs.map(function(r){
      var pill = r.status === 'approved' ? '<span class="pill ok">Approved</span>' : r.status === 'rejected' ? '<span class="pill oos">Rejected</span>' : '<span class="pill pend">Pending</span>';
      return '<div class="rc"><div><div class="rn">' + esc(r.name) + '</div><div class="rs">Part: ' + esc(r.part) + ' · Stock ' + esc(r.qty) + '</div>' +
        (r.adminNote ? '<div class="rs">Admin: ' + esc(r.adminNote) + '</div>' : '') + '</div><div>' + pill +
        (r.status !== 'approved' ? ' <button class="btn ghost" data-delreq="' + esc(r.id) + '" style="padding:3px 9px">✕</button>' : '') + '</div></div>';
    }).join('');
  }
  h += '<div style="height:80px"></div>';
  $('view').innerHTML = h;
  $('fBox').value = filter; if($('sBox')) $('sBox').value = sortBy;
  renderSaveBar();
  if(keepId){ var el = document.querySelector('[data-qty="' + keepId + '"]'); if(el){ el.focus(); try{ if(keepPos != null) el.setSelectionRange(keepPos, keepPos); }catch(e){} } }
}
function rowHtml(it){
  var q = curQty(it), s = statusOf(q), isD = dirty[it.id] !== undefined;
  var price = (allow('price', ['view']) && it.showPrice && it.mrp != null) ? '<div class="rp">MRP ' + money(it.mrp) + (it.gstPct != null ? ' <span style="font-weight:400;color:var(--ink2)">+ ' + esc(it.gstPct) + '% GST</span>' : '') + '</div>' : '';
  var comp = (me.stockView === 'company' && it.companyStock !== undefined) ? '<div class="rs">Company stock: <b>' + (it.companyStock === null ? 'Available' : esc(it.companyStock)) + '</b></div>' : '';
  return '<div class="rc ' + (isD ? 'dirty ' : '') + (s === 'ok' ? '' : s) + '" data-row="' + esc(it.id) + '">' +
    '<div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + 'Part: ' + esc(it.part) + '</div>' + comp + price + '</div>' +
    (!allow('stock', ['edit']) ? '<div class="stk"><b style="font-size:18px">' + q + '</b>' + (allow('orders', ['place']) ? '<button data-cart="' + esc(it.id) + '" title="Add to order" style="width:auto;padding:0 8px">🛒</button>' : '') + '</div>' :
    '<div class="stk"><button data-dec="' + esc(it.id) + '">−</button><input type="number" inputmode="numeric" min="0" data-qty="' + esc(it.id) + '" value="' + q + '"><button data-inc="' + esc(it.id) + '">+</button><button data-recv="' + esc(it.id) + '" title="Stock received" style="width:auto;padding:0 8px;font-size:12px">＋Recv</button>' + (allow('orders', ['place']) ? '<button data-cart="' + esc(it.id) + '" title="Add to order" style="width:auto;padding:0 8px">🛒</button>' : '') + '</div>') +
    '<div class="rf"><span class="pill ' + s + '" data-pill="' + esc(it.id) + '">' + (s === 'oos' ? 'Out of stock' : s === 'low' ? 'Low stock' : 'In stock') + '</span>Updated ' + ago(it.updatedAt) + '</div></div>';
}
function renderSaveBar(){
  var n = Object.keys(dirty).length, bar = $('saveBar');
  if(!n){ if(bar) bar.remove(); return; }
  if(!bar){ bar = document.createElement('div'); bar.id = 'saveBar'; document.body.appendChild(bar); }
  bar.innerHTML = '<div><b>' + n + '</b> unsaved change' + (n > 1 ? 's' : '') + '</div><div><button class="btn ghost" id="discardBtn" style="padding:7px 12px">Discard</button> <button class="btn gold" id="saveBtn" style="padding:7px 16px">Save all</button></div>';
  $('discardBtn').onclick = function(){ dirty = {}; render(); };
  $('saveBtn').onclick = saveAll;
}
function setQty(id, v){
  var it = items.filter(function(x){ return x.id === id; })[0]; if(!it) return;
  v = Math.max(0, Math.floor(Number(v) || 0));
  if(v === (Number(it.qty) || 0)) delete dirty[id]; else dirty[id] = v;
}


/* ------------------------------------------------------- tabs / history / share */
function tabsHtml(){
  var t = [['stock', '📦 Stock']];
  if(allow('sales', ['add', 'manage'])) t.push(['sales', '🧾 Sales']);
  if(allow('orders', ['view', 'place'])) t.push(['orders', '🛒 Orders' + (cart.length ? ' (' + cart.length + ')' : '')]);
  if(allow('history', ['view'])) t.push(['history', '🕘 History']);
  return '<div class="tabbar">' + t.map(function(x){ return '<button class="btn ' + (tab === x[0] ? 'gold' : 'ghost') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
}
function periodMs(p){ var n = new Date(); if(p === 'today') return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); if(p === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).getTime(); if(p === 'all') return 0; return Date.now() - Number(p) * 86400000; }
function renderHistory(){
  var h = tabsHtml(), sel = '<select id="hPer">' + [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']].map(function(o){ return '<option value="' + o[0] + '"' + (hPeriod === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
  if(hist === null || histKey !== hPeriod){
    $('view').innerHTML = h + '<div class="tools">' + sel + '</div><div class="empty">Loading…</div>';
    var key = hPeriod, since = periodMs(hPeriod), q = db.collection('distributor_log').where('distributorId', '==', me.id);
    if(since) q = q.where('ts', '>=', since);
    q.orderBy('ts', 'desc').limit(1000).get().then(function(s){ hist = s.docs.map(function(x){ return x.data(); }); histKey = key; if(tab === 'history') render(); })
      .catch(function(ex){ $('view').innerHTML = h + '<div class="empty">Could not load history (' + esc(ex.code || ex.message) + '). Ask the admin to deploy the latest Firestore indexes.</div>'; });
    return;
  }
  var add = 0, red = 0;
  hist.forEach(function(l){ var d = (Number(l.to) || 0) - (Number(l.from) || 0); if(d > 0) add += d; else red += -d; });
  h += '<div class="tools">' + sel + '<button class="btn ghost" id="hCsv">⬇ CSV</button></div>' +
    '<div class="chips"><div class="chip"><b style="color:var(--ok)">+' + add + '</b>Added</div><div class="chip"><b style="color:var(--bad)">−' + red + '</b>Reduced</div><div class="chip"><b>' + hist.length + '</b>Updates</div></div>';
  h += !hist.length ? '<div class="empty">No updates in this period.</div>' : hist.map(function(l){
    var d = (Number(l.to) || 0) - (Number(l.from) || 0);
    return '<div class="rc"><div><div class="rn">' + esc(l.name) + '</div><div class="rs">' + esc(l.part) + ' · ' + new Date(l.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</div></div>' +
      '<div style="text-align:right"><b style="color:' + (d >= 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (d >= 0 ? '+' : '') + d + '</b><div class="rs">' + l.from + ' → ' + l.to + '</div></div></div>'; }).join('');
  $('view').innerHTML = h + '<div style="height:60px"></div>';
}
function exportHistory(){
  var rows = [['When', 'Product', 'Part', 'From', 'To', 'Change']].concat((hist || []).map(function(l){ return [new Date(l.ts).toLocaleString('en-IN'), l.name, l.part, l.from, l.to, (Number(l.to) || 0) - (Number(l.from) || 0)]; }));
  var csv = rows.map(function(r){ return r.map(function(c){ var t = String(c); if(/^[=+\-@]/.test(t) && isNaN(Number(t))) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'my-stock-history.csv'; document.body.appendChild(a); a.click(); a.remove();
}
function shareLow(){
  var need = items.filter(function(it){ return statusOf(curQty(it)) !== 'ok'; });
  if(!need.length){ toast('Nothing is low — all in stock 👍'); return; }
  var txt = 'Low / out of stock — ' + (me.name || me.id) + '\n' + need.map(function(it){ return '• ' + it.name + (it.size ? ' (' + it.size + ')' : '') + ' [' + it.part + '] : ' + curQty(it); }).join('\n');
  if(navigator.share){ navigator.share({ text: txt }).catch(function(){}); }
  else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}

/* ----------------------------------------------------------------- events */
$('view').addEventListener('click', function(e){
  var t = e.target, id;
  if((id = t.getAttribute('data-inc'))){ var it = items.filter(function(x){ return x.id === id; })[0]; setQty(id, curQty(it) + 1); render(); }
  else if((id = t.getAttribute('data-dec'))){ var it2 = items.filter(function(x){ return x.id === id; })[0]; setQty(id, curQty(it2) - 1); render(); }
  else if((id = t.getAttribute('data-recv'))){
    var it3 = items.filter(function(x){ return x.id === id; })[0]; if(!it3) return;
    var v = prompt('Units RECEIVED for ' + it3.name + (it3.size ? ' (' + it3.size + ')' : '') + ' — added to current ' + curQty(it3) + ':');
    if(v !== null && Number(v) > 0){ setQty(id, curQty(it3) + Math.floor(Number(v))); render(); }
  }
  else if((id = t.getAttribute('data-tab'))){ tab = id; if(id === 'history') hist = null; render(); }
  else if((id = t.closest && t.closest('[data-f]') && t.closest('[data-f]').getAttribute('data-f'))){ filter = id; tab = 'stock'; render(); }
  else if(t.id === 'shareBtn') shareLow();
  else if(t.id === 'hCsv') exportHistory();
  else if((id = t.getAttribute('data-delreq'))){ if(confirm('Remove this request?')) db.collection('distributor_requests').doc(id).delete().catch(function(x){ toast(x.message); }); }
  else if(t.id === 'csvBtn') exportCsv();
  else if(t.id === 'tplBtn') exportXlsx();
  else if(t.id === 'upBtn') $('sheetFile').click();
  else if(t.id === 'confirmBtn'){
    t.disabled = true;
    db.collection('distributors').doc(me.id).update({ lastConfirmedAt: Date.now() }).then(function(){ toast('✔ Thanks — stock confirmed'); })
      .catch(function(ex){ toast('Could not confirm: ' + (ex.message || ex)); t.disabled = false; });
  }
  else if(t.id === 'addBtn') openAdd();
});
$('view').addEventListener('input', function(e){
  var t = e.target;
  if(t.id === 'qBox'){ query = t.value; var p = t.selectionStart; render(); var b = $('qBox'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} return; }
  var id = t.getAttribute('data-qty');
  if(id){
    setQty(id, t.value);
    var row = document.querySelector('[data-row="' + id + '"]'), it = items.filter(function(x){ return x.id === id; })[0];
    if(row && it){
      var st = statusOf(curQty(it));
      row.classList.toggle('dirty', dirty[id] !== undefined); row.classList.toggle('low', st === 'low'); row.classList.toggle('oos', st === 'oos');
      var pill = row.querySelector('[data-pill]'); if(pill){ pill.className = 'pill ' + st; pill.textContent = st === 'oos' ? 'Out of stock' : st === 'low' ? 'Low stock' : 'In stock'; }
    }
    var lo = 0, oo = 0; items.forEach(function(x){ var z = statusOf(curQty(x)); if(z === 'low') lo++; if(z === 'oos') oo++; });
    if($('cUnits')) $('cUnits').textContent = items.reduce(function(a, x){ return a + curQty(x); }, 0);
    if($('cLow')) $('cLow').textContent = lo; if($('cOos')) $('cOos').textContent = oo;
    renderSaveBar();
  }
});
$('view').addEventListener('change', function(e){
  if(e.target.id === 'fBox'){ filter = e.target.value; render(); }
  if(e.target.id === 'sBox'){ sortBy = e.target.value; render(); }
  if(e.target.id === 'hPer'){ hPeriod = e.target.value; hist = null; render(); }
  if(e.target.id === 'sheetFile' && e.target.files[0]){ importSheet(e.target.files[0]); e.target.value = ''; }
});


/* ============================================================== SALES */
function money2(n){ return '₹' + (Number(n) || 0).toLocaleString('en-IN'); }
function pickerHtml(idq, q, filterFn, attr){
  var ql = q.toLowerCase().trim(); if(!ql) return '';
  var res = items.filter(function(it){ return filterFn(it) && (String(it.name) + ' ' + String(it.size || '') + ' ' + String(it.part)).toLowerCase().indexOf(ql) >= 0; }).slice(0, 8);
  return '<div style="border:1px solid var(--line);border-radius:8px;margin:6px 0">' + (res.length ? res.map(function(it){
    return '<div class="rc" style="margin:0;border:0;border-bottom:1px solid var(--line)"><div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + esc(it.part) + ' · in stock <b>' + (Number(it.qty) || 0) + '</b></div></div><button class="btn gold" ' + attr + '="' + esc(it.id) + '" style="padding:5px 12px">＋ Add</button></div>'; }).join('') : '<div class="empty" style="padding:10px">No match</div>') + '</div>';
}
function saleTotals(){
  var u = 0, a = 0; saleLines.forEach(function(l){ var q = Math.floor(Number(l.qty) || 0); u += q; a += q * (Number(l.rate) || 0); });
  return { u: u, a: a };
}
function renderSales(){
  var canVoid = allow('sales', ['manage']), h = tabsHtml();
  var t0 = new Date(); t0.setHours(0, 0, 0, 0);
  var today = salesList.filter(function(s){ return s.status !== 'void' && s.ts >= t0.getTime(); });
  var tu = today.reduce(function(a, s){ return a + (Number(s.units) || 0); }, 0), ta = today.reduce(function(a, s){ return a + (Number(s.amount) || 0); }, 0);
  h += '<div class="chips"><div class="chip"><b>' + today.length + '</b>Sales today</div><div class="chip"><b>' + tu + '</b>Units sold today</div>' + (ta ? '<div class="chip"><b>' + money2(ta) + '</b>Value today</div>' : '') + '</div>';
  h += '<div class="card2"><h3 style="margin:0 0 6px">New sale</h3><div class="rs">Search an item, add it, enter the quantity sold. Stock reduces automatically when you press <b>Record sale</b>.</div>' +
    '<input id="slQ" type="search" placeholder="Search item to sell…" value="' + esc(slQuery) + '" style="width:100%;margin-top:8px">' +
    pickerHtml('slQ', slQuery, function(it){ return (Number(it.qty) || 0) > 0 && !saleLines.some(function(l){ return l.id === it.id; }); }, 'data-sladd');
  if(saleLines.length){
    h += saleLines.map(function(l){
      var it = itemById(l.id); if(!it) return '';
      return '<div class="rc" style="margin:6px 0"><div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + 'in stock ' + (Number(it.qty) || 0) + '</div></div>' +
        '<div style="display:flex;gap:6px;align-items:center"><input type="number" min="1" max="' + (Number(it.qty) || 0) + '" data-slq="' + esc(l.id) + '" value="' + esc(l.qty) + '" style="width:70px" placeholder="Qty">' +
        '<input type="number" min="0" step="any" data-slr="' + esc(l.id) + '" value="' + esc(l.rate == null ? '' : l.rate) + '" style="width:80px" placeholder="₹ rate">' +
        '<button class="btn ghost" data-slx="' + esc(l.id) + '" style="padding:4px 9px">✕</button></div></div>'; }).join('');
  }
  var tt = saleTotals();
  h += '<input id="slCust" placeholder="Customer / shop name (optional)" value="' + esc(saleMeta.customer) + '" style="width:100%;margin-top:8px"><input id="slNote" placeholder="Note (optional)" value="' + esc(saleMeta.note) + '" style="width:100%;margin-top:6px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><div><b id="slTot">' + tt.u + ' units' + (tt.a ? ' · ' + money2(tt.a) : '') + '</b></div><div><button class="btn ghost" id="slClear"' + (saleLines.length ? '' : ' disabled') + '>Clear</button> <button class="btn gold" id="slSave"' + (saleLines.length ? '' : ' disabled') + '>✔ Record sale</button></div></div></div>';
  h += '<h3>Recent sales</h3>' + (!salesList.length ? '<div class="empty">No sales recorded yet.</div>' : salesList.slice(0, 40).map(function(s){
    var void_ = s.status === 'void';
    return '<div class="rc" style="' + (void_ ? 'opacity:.55' : '') + '"><div><div class="rn">' + esc(s.no || 'Sale') + (s.customer ? ' · ' + esc(s.customer) : '') + (void_ ? ' <span class="pill oos">Voided</span>' : '') + '</div>' +
      '<div class="rs">' + fmtT(s.ts) + (s.by && s.by !== me.id ? ' · ' + esc(s.by) : '') + '</div>' +
      '<div class="rs">' + (s.lines || []).map(function(l){ return esc(l.name) + (l.size ? ' (' + esc(l.size) + ')' : '') + ' × ' + (Number(l.qty) || 0); }).join(', ') + '</div></div>' +
      '<div style="text-align:right"><b>' + (Number(s.units) || 0) + ' u</b>' + (Number(s.amount) ? '<div class="rs">' + money2(s.amount) + '</div>' : '') + (canVoid && !void_ ? '<button class="btn ghost" data-slvoid="' + esc(s.id) + '" style="padding:3px 9px;margin-top:4px">Void</button>' : '') + '</div></div>'; }).join(''));
  $('view').innerHTML = h + '<div style="height:80px"></div>';
}
function recordSale(){
  if(!allow('sales', ['add', 'manage'])) return;
  if(!saleLines.length){ toast('Add at least one item'); return; }
  var lines = [], units = 0, amount = 0, now = Date.now();
  for(var i = 0; i < saleLines.length; i++){
    var l = saleLines[i], it = itemById(l.id), q = Math.floor(Number(l.qty) || 0);
    if(!it){ toast('An item is no longer on your list — remove it'); return; }
    if(q < 1){ toast('Enter a quantity for ' + it.name); return; }
    if(q > (Number(it.qty) || 0)){ toast(it.name + ': only ' + (Number(it.qty) || 0) + ' in stock'); return; }
    if(dirty[it.id] !== undefined){ toast('Save or discard your pending stock edit for ' + it.name + ' first'); return; }
    var line = { sid: it.id, productId: it.productId, name: it.name, size: it.size || '', part: it.part, qty: q };
    if(l.rate !== '' && l.rate != null && isFinite(Number(l.rate)) && Number(l.rate) >= 0){ line.rate = Number(l.rate); amount += q * line.rate; }
    units += q; lines.push({ line: line, it: it });
  }
  var saleRef = db.collection('distributor_sales').doc(), no = 'S' + now.toString(36).toUpperCase().slice(-6), batch = db.batch();
  batch.set(saleRef, { no: no, distributorId: me.id, ts: now, by: loginId, customer: saleMeta.customer.trim(), note: saleMeta.note.trim(), lines: lines.map(function(x){ return x.line; }), units: units, amount: amount, status: 'ok' });
  lines.forEach(function(x){
    batch.update(db.collection('distributor_stock').doc(x.it.id), { qty: FV.increment(-x.line.qty), updatedAt: now, updatedBy: loginId });   // increments merge correctly even when several devices work offline
    batch.set(db.collection('distributor_log').doc(), { distributorId: me.id, productId: x.it.productId, name: x.it.name + (x.it.size ? ' — ' + x.it.size : ''), part: x.it.part, from: Number(x.it.qty) || 0, to: (Number(x.it.qty) || 0) - x.line.qty, ts: now, type: 'sale', ref: no, by: loginId });
  });
  saleLines = []; saleMeta = { customer: '', note: '' }; slQuery = ''; saveDrafts(); hist = null;
  commitBatch(batch, '✔ Sale ' + no + ' recorded — stock reduced'); render();
}
function voidSale(id){
  var s = salesList.filter(function(x){ return x.id === id; })[0]; if(!s || s.status === 'void') return;
  if(!confirm('Void sale ' + (s.no || '') + '? The sold quantities go back into your stock.')) return;
  var now = Date.now(), batch = db.batch(), skipped = 0;
  batch.update(db.collection('distributor_sales').doc(id), { status: 'void', voidedAt: now, voidedBy: loginId });
  (s.lines || []).forEach(function(l){
    var it = itemById(l.sid); if(!it){ skipped++; return; }
    batch.update(db.collection('distributor_stock').doc(it.id), { qty: FV.increment(Number(l.qty) || 0), updatedAt: now, updatedBy: loginId });
    batch.set(db.collection('distributor_log').doc(), { distributorId: me.id, productId: it.productId, name: it.name + (it.size ? ' — ' + it.size : ''), part: it.part, from: Number(it.qty) || 0, to: (Number(it.qty) || 0) + (Number(l.qty) || 0), ts: now, type: 'void', ref: s.no || '', by: loginId });
  });
  hist = null; commitBatch(batch, '✔ Sale voided — stock restored' + (skipped ? ' (' + skipped + ' hidden item(s) not restored)' : ''));
}

/* ============================================================== PURCHASE ORDERS */
var ST_TXT = { placed: 'Placed', accepted: 'Accepted', dispatched: 'Dispatched', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled' };
var ST_CLS = { placed: 'pend', accepted: 'pend', dispatched: 'pend', delivered: 'ok', rejected: 'oos', cancelled: 'oos' };
function renderOrders(){
  var canPlace = allow('orders', ['place']), h = tabsHtml();
  if(canPlace){
    var units = cart.reduce(function(a, c){ return a + (Math.floor(Number(c.qty)) || 0); }, 0);
    h += '<div class="card2"><h3 style="margin:0 0 6px">New order to the company</h3><div class="rs">Add the items you need. The company will accept, dispatch and deliver — you can follow every step below.</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px"><input id="orQ" type="search" placeholder="Search item to order…" value="' + esc(orQuery) + '" style="flex:1"><button class="btn ghost" id="orLow">＋ Low / out items</button></div>' +
      pickerHtml('orQ', orQuery, function(it){ return !cart.some(function(c){ return c.id === it.id; }); }, 'data-oradd');
    h += cart.map(function(c){
      var it = itemById(c.id); if(!it) return '';
      return '<div class="rc" style="margin:6px 0"><div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + 'you have ' + (Number(it.qty) || 0) + '</div></div><div style="display:flex;gap:6px;align-items:center"><input type="number" min="1" data-orq="' + esc(c.id) + '" value="' + esc(c.qty) + '" style="width:80px"><button class="btn ghost" data-orx="' + esc(c.id) + '" style="padding:4px 9px">✕</button></div></div>'; }).join('');
    h += '<textarea id="orNote" rows="2" placeholder="Note to the company (optional)" style="width:100%;margin-top:8px">' + esc(orderNote) + '</textarea>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><b id="orTot">' + cart.length + ' item(s) · ' + units + ' units</b><div><button class="btn ghost" id="orClear"' + (cart.length ? '' : ' disabled') + '>Clear</button> <button class="btn gold" id="orPlace"' + (cart.length ? '' : ' disabled') + '>📨 Place order</button></div></div></div>';
  }
  h += '<h3>My orders</h3>' + (!ordersList.length ? '<div class="empty">No orders yet.</div>' : ordersList.map(function(o){
    return '<div class="card2"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(o.no) + '</b><span class="pill ' + (ST_CLS[o.status] || 'pend') + '">' + esc(ST_TXT[o.status] || o.status) + '</span></div>' +
      '<div class="rs">' + fmtT(o.createdAt) + ' · ' + (Number(o.units) || 0) + ' units' + (o.by && o.by !== me.id ? ' · by ' + esc(o.by) : '') + '</div>' +
      '<div class="rs" style="margin:4px 0">' + (o.lines || []).map(function(l){ return esc(l.name) + (l.size ? ' (' + esc(l.size) + ')' : '') + ' × ' + (Number(l.qty) || 0); }).join(', ') + '</div>' +
      (o.expected ? '<div class="rs">Expected delivery: <b>' + esc(o.expected) + '</b></div>' : '') + (o.adminNote ? '<div class="rs">Company: ' + esc(o.adminNote) + '</div>' : '') +
      '<div class="rs" style="margin-top:4px">' + (o.history || []).map(function(x){ return '• ' + esc(ST_TXT[x.s] || x.s) + ' — ' + fmtT(x.ts); }).join('<br>') + '</div>' +
      (o.status === 'placed' && canPlace ? '<button class="btn ghost" data-orcancel="' + esc(o.id) + '" style="margin-top:6px;padding:5px 12px">Cancel order</button>' : '') + (o.status === 'delivered' && o.stockAdded ? '<div class="rs" style="color:var(--ok)">✔ Quantities were added to your stock</div>' : '') + '</div>'; }).join(''));
  $('view').innerHTML = h + '<div style="height:80px"></div>';
}
function addToCart(id, qty){
  var it = itemById(id); if(!it || cart.some(function(c){ return c.id === id; })) return;
  cart.push({ id: id, qty: qty || 1 }); saveDrafts();
}
function placeOrder(){
  if(!allow('orders', ['place'])) return;
  var lines = [], units = 0, now = Date.now();
  for(var i = 0; i < cart.length; i++){
    var c = cart[i], it = itemById(c.id), q = Math.floor(Number(c.qty) || 0);
    if(!it) continue; if(q < 1){ toast('Enter a quantity for ' + it.name); return; }
    var l = { sid: it.id, productId: it.productId, name: it.name, size: it.size || '', part: it.part, qty: q };
    if(it.showPrice && it.mrp != null) l.mrp = Number(it.mrp) || 0;
    lines.push(l); units += q;
  }
  if(!lines.length){ toast('Your order is empty'); return; }
  var ref = db.collection('distributor_orders').doc(), no = 'PO' + now.toString(36).toUpperCase().slice(-6), batch = db.batch();
  batch.set(ref, { id: ref.id, no: no, distributorId: me.id, distributorName: me.name || me.id, by: loginId, lines: lines, units: units, note: orderNote.trim(), status: 'placed', createdAt: now, updatedAt: now, history: [{ s: 'placed', ts: now, by: loginId }] });
  cart = []; orderNote = ''; orQuery = ''; saveDrafts();
  commitBatch(batch, '✔ Order ' + no + ' placed'); render();
}
function cancelOrder(id){
  if(!confirm('Cancel this order?')) return;
  var now = Date.now();
  db.collection('distributor_orders').doc(id).update({ status: 'cancelled', updatedAt: now, history: FV.arrayUnion({ s: 'cancelled', ts: now, by: loginId, note: 'Cancelled by distributor' }) })
    .then(function(){ toast('Order cancelled'); }, function(ex){ toast('Could not cancel — the company may have already accepted it'); });
}

/* events for the new screens */
$('view').addEventListener('click', function(e){
  var t = e.target.closest ? (e.target.closest('button') || e.target) : e.target, id;
  if((id = t.getAttribute('data-sladd'))){ if(!saleLines.some(function(l){ return l.id === id; })){ var it = itemById(id), rate = (allow('price', ['view']) && it && it.showPrice && it.mrp != null) ? it.mrp : ''; saleLines.push({ id: id, qty: 1, rate: rate }); } slQuery = ''; saveDrafts(); render(); }
  else if((id = t.getAttribute('data-slx'))){ saleLines = saleLines.filter(function(l){ return l.id !== id; }); saveDrafts(); render(); }
  else if(t.id === 'slClear'){ saleLines = []; saleMeta = { customer: '', note: '' }; saveDrafts(); render(); }
  else if(t.id === 'slSave') recordSale();
  else if((id = t.getAttribute('data-slvoid'))) voidSale(id);
  else if((id = t.getAttribute('data-oradd'))){ addToCart(id, 1); orQuery = ''; render(); }
  else if((id = t.getAttribute('data-cart'))){ addToCart(id, 1); toast('🛒 Added to your order (Orders tab)'); renderTabsOnly(); }
  else if((id = t.getAttribute('data-orx'))){ cart = cart.filter(function(c){ return c.id !== id; }); saveDrafts(); render(); }
  else if(t.id === 'orClear'){ cart = []; orderNote = ''; saveDrafts(); render(); }
  else if(t.id === 'orLow'){ items.forEach(function(it){ var q = Number(it.qty) || 0; if(statusOf(q) !== 'ok') addToCart(it.id, Math.max(1, lowAt() * 2 - q)); }); render(); }
  else if(t.id === 'orPlace') placeOrder();
  else if((id = t.getAttribute('data-orcancel'))) cancelOrder(id);
});
function renderTabsOnly(){ var tb = document.querySelector('#view .tabbar'); if(tb) tb.outerHTML = tabsHtml(); }
$('view').addEventListener('input', function(e){
  var t = e.target, id;
  if(t.id === 'slQ'){ slQuery = t.value; renderKeep(); }
  else if(t.id === 'orQ'){ orQuery = t.value; renderKeep(); }
  else if((id = t.getAttribute('data-slq'))){ var l = saleLines.filter(function(x){ return x.id === id; })[0]; if(l){ l.qty = t.value; saveDrafts(); var tt = saleTotals(); $('slTot').textContent = tt.u + ' units' + (tt.a ? ' · ' + money2(tt.a) : ''); } }
  else if((id = t.getAttribute('data-slr'))){ var l2 = saleLines.filter(function(x){ return x.id === id; })[0]; if(l2){ l2.rate = t.value; saveDrafts(); var t2 = saleTotals(); $('slTot').textContent = t2.u + ' units' + (t2.a ? ' · ' + money2(t2.a) : ''); } }
  else if(t.id === 'slCust'){ saleMeta.customer = t.value; saveDrafts(); }
  else if(t.id === 'slNote'){ saleMeta.note = t.value; saveDrafts(); }
  else if((id = t.getAttribute('data-orq'))){ var c = cart.filter(function(x){ return x.id === id; })[0]; if(c){ c.qty = t.value; saveDrafts(); $('orTot').textContent = cart.length + ' item(s) · ' + cart.reduce(function(a, z){ return a + (Math.floor(Number(z.qty)) || 0); }, 0) + ' units'; } }
  else if(t.id === 'orNote'){ orderNote = t.value; saveDrafts(); }
});

/* ------------------------------------------------------------------- save */
function saveAll(){
  var ids = Object.keys(dirty); if(!ids.length) return;
  var btn = $('saveBtn'); if(btn) btn.disabled = true;
  var now = Date.now(), batch = db.batch(), n = 0;
  ids.forEach(function(id){
    var it = items.filter(function(x){ return x.id === id; })[0]; if(!it){ delete dirty[id]; return; }
    var to = Math.max(0, Math.floor(Number(dirty[id]) || 0));
    batch.update(db.collection('distributor_stock').doc(id), { qty: to, updatedAt: now, updatedBy: loginId });
    batch.set(db.collection('distributor_log').doc(), { distributorId: me.id, productId: it.productId, name: it.name + (it.size ? ' — ' + it.size : ''), part: it.part, from: Number(it.qty) || 0, to: to, ts: now, by: loginId });
    n++;
  });
  if(!n){ dirty = {}; render(); return; }
  hist = null; dirty = {};
  commitBatch(batch, '✔ Stock saved'); render();
}
/* never lose typed numbers by accident */
window.addEventListener('beforeunload', function(e){ if(Object.keys(dirty).length){ e.preventDefault(); e.returnValue = ''; } });

/* -------------------------------------------------------------------- CSV */
function exportCsv(){
  var showComp = me.stockView === 'company';
  var rows = [['Product', 'Size', 'Part', 'Your stock'].concat(showComp ? ['Company stock'] : []).concat(['Last updated'])].concat(items.map(function(it){
    return [it.name, it.size || '', it.part, curQty(it)].concat(showComp ? [it.companyStock === undefined ? '' : (it.companyStock === null ? 'available' : it.companyStock)] : []).concat([it.updatedAt ? new Date(it.updatedAt).toLocaleString('en-IN') : '']);
  }));
  var csv = rows.map(function(r){ return r.map(function(c){ var t = String(c); if(/^[=+\-@]/.test(t) && isNaN(Number(t))) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'stock-' + me.id + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
}


/* -------------------------------------------------- Excel / CSV stock sheet */
function exportXlsx(){
  if(!window.XLSX){ toast('Excel library not loaded'); return; }
  var ws = XLSX.utils.json_to_sheet(items.map(function(it){ return { 'Part': it.part, 'Product': it.name, 'Size': it.size || '', 'Stock': curQty(it) }; }));
  var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Stock');
  XLSX.writeFile(wb, 'stock-sheet-' + me.id + '.xlsx');
}
function headerKey(k){ return String(k).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function pick(row, names){
  var keys = Object.keys(row);
  for(var i = 0; i < keys.length; i++){ if(names.indexOf(headerKey(keys[i])) >= 0) return row[keys[i]]; }
  return undefined;
}
/* Fill the stock column of the downloaded sheet (or any sheet with Part + Stock columns) and upload it.
   Changes land in the normal "unsaved changes" bar — nothing is written until you press Save all. */
function importSheet(file){
  if(!window.XLSX){ toast('Excel library not loaded'); return; }
  var fr = new FileReader();
  fr.onload = function(){
    var rows;
    try{ var wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }
    catch(e){ toast('Could not read that file'); return; }
    var byKey = {}; items.forEach(function(it){ byKey[partKey(it.part)] = it; });
    var changed = 0, same = 0, unknown = [], invalid = 0;
    rows.forEach(function(r){
      var part = pick(r, ['part', 'partno', 'partnumber', 'itemcode', 'code', 'sku']);
      var qty = pick(r, ['stock', 'qty', 'quantity', 'currentstock']);
      if(part === undefined || part === '') return;
      var it = byKey[partKey(part)];
      if(!it){ unknown.push(String(part)); return; }
      var n = Number(qty);
      if(qty === '' || qty === undefined){ return; }            // blank cell = keep his current number
      if(!isFinite(n) || n < 0){ invalid++; return; }
      var before = curQty(it); setQty(it.id, n);
      if(Math.floor(n) === before) same++; else changed++;
    });
    render();
    var msg = changed + ' changed';
    if(same) msg += ', ' + same + ' unchanged';
    if(invalid) msg += ', ' + invalid + ' bad qty';
    if(unknown.length) msg += ', ' + unknown.length + ' not in your list (' + unknown.slice(0, 3).join(', ') + (unknown.length > 3 ? '…' : '') + ')';
    toast(msg + (changed ? ' — review, then Save all' : ''));
  };
  fr.readAsArrayBuffer(file);
}

/* ------------------------------------------------ add product (if allowed) */
function openAdd(){
  var w = document.createElement('div'); w.className = 'ov';
  w.innerHTML = '<div class="box"><h3 style="margin-top:0">Add a product</h3>' +
    '<div style="font-size:12px;color:var(--ink2)">If the part number already exists in the admin catalogue, it is linked to you automatically (no duplicate is created). Otherwise the admin reviews it first.</div>' +
    '<label>Part / item code *</label><input id="apPart">' +
    '<label>Product name *</label><input id="apName">' +
    '<label>Size / spec</label><input id="apSize">' +
    '<label>Your MRP (optional)</label><input id="apMrp" type="number" min="0">' +
    '<label>Your current stock *</label><input id="apQty" type="number" min="0" value="0">' +
    '<label>Note</label><input id="apNote">' +
    '<div class="err" id="apErr"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn ghost" id="apCancel" style="flex:1">Cancel</button><button class="btn gold" id="apSend" style="flex:1">Send to admin</button></div></div>';
  document.body.appendChild(w);
  w.querySelector('#apCancel').onclick = function(){ w.remove(); };
  w.querySelector('#apSend').onclick = function(){
    var part = w.querySelector('#apPart').value.trim(), name = w.querySelector('#apName').value.trim();
    var qty = Math.floor(Number(w.querySelector('#apQty').value));
    var err = w.querySelector('#apErr');
    if(!part || !name){ err.textContent = 'Part code and name are required.'; return; }
    if(!(qty >= 0)){ err.textContent = 'Enter a valid stock number.'; return; }
    var key = partKey(part); if(!key){ err.textContent = 'Part code looks invalid.'; return; }
    var id = me.id + '__' + key;
    var doc = { id: id, distributorId: me.id, name: name, size: w.querySelector('#apSize').value.trim(), part: part, partKey: key,
      mrp: Number(w.querySelector('#apMrp').value) || 0, qty: qty, note: w.querySelector('#apNote').value.trim(), status: 'pending', createdAt: Date.now() };
    if(items.some(function(it){ return partKey(it.part) === key; })){ err.textContent = 'This part is already in your list — just update its stock.'; return; }
    db.collection('distributor_requests').doc(id).set(doc).then(function(){ w.remove(); toast('Sent to admin for approval'); })
      .catch(function(ex){ err.textContent = ex.code === 'permission-denied' ? 'Not allowed (already requested, or uploads are off).' : (ex.message || 'Failed'); });
  };
}
})();