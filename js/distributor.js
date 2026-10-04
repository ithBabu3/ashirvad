/* ==========================================================================
   AshirvadConnect — Distributor portal  (/distributor/)   v2, mobile-first
   Own Firebase session (named app "distributor") so it never logs out the dealer store / admin console.

   What a distributor can do (what each login may do depends on its role):
     Stock   see the items the admin assigned, update quantities, "received" units, share a low-stock list
     Sell    record sales (stock reduces automatically), see what sold — by product / by day / each sale
     Orders  order from the company (cart) and follow Accepted → Dispatched → Delivered
     More    history, add-product requests, Excel sheet, change password
   Works offline: Firestore keeps a copy on the phone and queues every write until the internet returns.
   Every stock change also updates stock_totals/<product> in the SAME batch, so the dealer catalogue availability
   (= company stock + distributors' stock) is always in step.
   ========================================================================== */
(function(){
'use strict';
if(!window.firebase){ if(window.acLoader) window.acLoader.fail('The app files could not be loaded. Check your internet connection and try again.'); return; }
var cfg = window.AC_FIREBASE_CONFIG || {}, opt = window.AC_CLOUD_OPTIONS || {};
var DOMAIN = opt.distributorEmailDomain || 'distributor.ashirvadconnect.app';
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function slug(s){ return String(s || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, ''); }
function partKey(s){ return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function money(n){ return '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function ago(ts){ if(!ts) return 'never'; var s = Math.floor((Date.now() - ts) / 1000); if(s < 60) return 'just now'; if(s < 3600) return Math.floor(s / 60) + ' min ago'; if(s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
function fmtT(ts){ return ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
function pStart(p){ var n = new Date(); if(p === 'today') return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); if(p === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).getTime(); if(p === 'all') return 0; return Date.now() - Number(p) * 86400000; }
var toastT;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('show'); }, 3200); }

if(!cfg.apiKey || /PASTE|YOUR_|XXXX/i.test(cfg.apiKey)){ $('loginErr').textContent = 'Firebase is not configured yet (js/firebase-config.js).'; }
var app = firebase.apps.filter(function(a){ return a.name === 'distributor'; })[0] || firebase.initializeApp(cfg, 'distributor');
var auth = app.auth(), db = app.firestore();
/* OFFLINE: reads come from the copy kept on the phone; every write is queued and sent automatically when the internet returns. */
try{ db.enablePersistence({ synchronizeTabs: true }).catch(function(){ }); }catch(e){}
var FV = firebase.firestore.FieldValue;
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function(){ }); }

/* ------------------------------------------------------------------ state */
var OWNER_PERMS = { stock: 'edit', sales: 'manage', orders: 'place', history: 'view', price: 'view', requests: 'add' };
var me = null, team = null, P = OWNER_PERMS, loginId = '', uid = '', unsubs = [];
var items = [], reqs = [], salesList = [], ordersList = [], dirty = {};
var stockLoaded = false;
var tab = 'stock', sub = null, filt = 'all', sortBy = 'name', catF = '', qStock = '', stLimit = 40;
var sPeriod = 'today', sMode = 'prod', hPeriod = '7', hist = null, histKey = '';
var saleLines = [], saleMeta = { customer: '', note: '' }, cart = [], orderNote = '';
var queued = 0, pendingFlags = {}, prevOrderStatus = {}, pendingRender = false, idleT;
var IDLE_MS = 30 * 60 * 1000;

function allow(k, levels){ return levels.indexOf(P[k]) >= 0; }
function lowAt(){ return Number(me && me.lowStockAt) || 5; }
function statusOf(n){ return n <= 0 ? 'oos' : n <= lowAt() ? 'low' : 'ok'; }
function stTxt(s){ return s === 'oos' ? 'Out of stock' : s === 'low' ? 'Low stock' : 'In stock'; }
function curQty(it){ return dirty[it.id] !== undefined ? dirty[it.id] : (Number(it.qty) || 0); }
function itemById(id){ for(var i = 0; i < items.length; i++) if(items[i].id === id) return items[i]; return null; }
function lsGet(k, def){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }catch(e){ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function saveDrafts(){ if(!me) return; lsSet('acd2_' + me.id + '_' + loginId, { sl: saleLines, sm: saleMeta, c: cart, n: orderNote }); }

/* ------------------------------------------------------------------ connection banner + queued writes */
function anyPending(){ return Object.keys(pendingFlags).some(function(k){ return pendingFlags[k]; }); }
function renderSync(){
  var off = navigator.onLine === false, wait = queued > 0 || anyPending(), b = $('syncBar');
  b.className = off ? 'off' : (wait ? 'syn' : '');
  b.textContent = off ? '📴 No internet — everything you enter is saved on this phone and syncs automatically' + (wait ? ' (changes waiting)' : '') : (wait ? '🔄 Syncing your changes…' : '');
}
window.addEventListener('online', renderSync); window.addEventListener('offline', renderSync);
function setPending(k, snap){ pendingFlags[k] = !!(snap && snap.metadata && snap.metadata.hasPendingWrites); renderSync(); }
/* a write is queued immediately; its promise only settles when the server answers (possibly much later when offline) */
function commitBatch(batch, okMsg){
  queued++; renderSync();
  batch.commit().then(function(){ queued--; renderSync(); }, function(ex){
    queued--; renderSync();
    toast('⚠ A change could not be saved: ' + (ex && ex.code === 'permission-denied' ? 'not allowed (stock may be too low, an item was hidden, or you lack permission)' : ((ex && ex.message) || ex)));
  });
  toast(navigator.onLine === false ? '✔ Saved on this phone — will sync when online' : okMsg);
}
function totalsRef(it){ return db.collection('stock_totals').doc(String(it.productId)); }
function setTotal(batch, it, valueOrInc, now){ var by = {}; by[me.id] = valueOrInc; batch.set(totalsRef(it), { id: Number(it.productId), by: by, ts: now }, { merge: true }); }
function logRow(it, from, to, now, type, ref){
  var o = { distributorId: me.id, productId: it.productId, name: it.name + (it.size ? ' — ' + it.size : ''), part: it.part, from: from, to: to, ts: now, by: loginId };
  if(type){ o.type = type; o.ref = ref || ''; } return o;
}

/* ------------------------------------------------------------------ login */
var loginErr = function(m){ $('loginErr').textContent = m || ''; };
function resolveEmail(u){ return db.collection('login_index').doc(u).get().then(function(d){ return (d.exists && d.data().email) || (u + '@' + DOMAIN); }, function(){ return u + '@' + DOMAIN; }); }
$('loginForm').addEventListener('submit', function(e){
  e.preventDefault(); loginErr('');
  var u = slug($('dUser').value), p = $('dPass').value;
  if(!u || !p){ loginErr('Enter your login ID and password.'); return; }
  var btn = $('loginBtn'); btn.disabled = true; btn.textContent = 'Signing in…';
  resolveEmail(u).then(function(em){ return auth.signInWithEmailAndPassword(em, p); }).catch(function(ex){
    var c = (ex && ex.code) || '';
    loginErr(/invalid|wrong-password|user-not-found|invalid-credential/.test(c) ? 'Wrong login ID or password.' : c === 'auth/network-request-failed' ? 'No internet connection. The first login needs internet.' : c === 'auth/too-many-requests' ? 'Too many attempts. Wait a few minutes and try again.' : (ex.message || 'Could not sign in.'));
  }).then(function(){ btn.disabled = false; btn.textContent = 'Sign in'; });
});
$('menuBtn').onclick = function(){ tab = 'more'; sub = null; render(); window.scrollTo(0, 0); };

/* Who is this login?  dist_logins/<uid> = { distributorId, roleId } (new logins);  older logins fall back to the e-mail name. */
auth.onAuthStateChanged(function(user){
  if(!user){ stopSession(); $('appWrap').classList.add('d-none'); $('loginWrap').classList.remove('d-none'); splashDone(); return; }
  if(window.acLoader) window.acLoader.set(55, 'Loading your account…');
  uid = user.uid; var mail = String(user.email || '').toLowerCase();
  if(mail.slice(-(DOMAIN.length + 1)) !== '@' + DOMAIN){ loginErr('This login is not a distributor account.'); auth.signOut(); return; }
  loginId = mail.split('@')[0];
  var read = function(ref){ return ref.get().catch(function(ex){ if(ex && (ex.code === 'unavailable' || navigator.onLine === false)) return ref.get({ source: 'cache' }); throw ex; }); };
  read(db.collection('dist_logins').doc(uid)).then(function(m){
    if(!m.exists){ team = null; P = OWNER_PERMS; return loginId; }                // older login: id = e-mail name
    var x = m.data(); loginId = x.username || loginId;
    if(x.isActive === false) throw new Error('Your login is switched off. Contact the distributor or your supplier.');
    team = x.roleId === 'owner' ? null : x; if(team) team.uid = uid;
    if(x.roleId === 'owner'){ P = OWNER_PERMS; return x.distributorId; }
    return read(db.collection('roles').doc(x.roleId)).then(function(r){ if(!r.exists) throw new Error('Your role is missing. Contact your supplier.'); P = Object.assign({}, r.data().perms || {}); return x.distributorId; });
  }).then(function(distId){
    return read(db.collection('distributors').doc(distId)).then(function(d){
      if(!d.exists || d.data().isActive === false) throw new Error(d.exists ? 'Your account is inactive. Contact your supplier.' : 'This login is not linked to a distributor.');
      startSession(distId);
    });
  }).catch(function(ex){
    loginErr(ex && ex.code === 'permission-denied' ? 'Access is not set up yet. Ask your supplier to publish the latest Firebase rules.' : ex && /cache/i.test(ex.message || '') ? 'Could not load your account — connect to the internet for the first login.' : ((ex && ex.message) || 'Could not load your account.'));
    auth.signOut();
  });
});
$('bizName').parentNode.addEventListener('click', function(){});

function splashDone(){ if(window.acLoader) window.acLoader.done(); }
function stopSession(){ unsubs.forEach(function(u){ try{ u(); }catch(e){} }); unsubs = []; me = null; team = null; stockLoaded = false; items = []; reqs = []; salesList = []; ordersList = []; dirty = {}; clearTimeout(idleT); var sb = $('saveBar'); if(sb) sb.remove(); }
function startSession(id){
  stopSession();
  $('loginWrap').classList.add('d-none'); $('appWrap').classList.remove('d-none');
  var dr = lsGet('acd2_' + id + '_' + loginId, null); saleLines = (dr && dr.sl) || []; saleMeta = (dr && dr.sm) || { customer: '', note: '' }; cart = (dr && dr.c) || []; orderNote = (dr && dr.n) || '';
  tab = 'stock'; sub = null; filt = 'all'; stLimit = 40; pendingFlags = {}; prevOrderStatus = {};
  unsubs.push(db.collection('distributors').doc(id).onSnapshot(function(d){ if(!d.exists || d.data().isActive === false){ toast('Your account is inactive'); auth.signOut(); return; } me = d.data(); me.id = id; softRender(); }, function(){ }));
  if(team){
    unsubs.push(db.collection('dist_logins').doc(uid).onSnapshot(function(t){ if(!t.exists || t.data().isActive === false){ toast('Your login was switched off'); auth.signOut(); } else if(t.data().roleId !== team.roleId){ toast('Your role was changed — reloading'); setTimeout(function(){ location.reload(); }, 1200); } }, function(){ }));
    unsubs.push(db.collection('roles').doc(team.roleId).onSnapshot(function(r){ if(r.exists && !r.metadata.hasPendingWrites && JSON.stringify(r.data().perms || {}) !== JSON.stringify(P)){ toast('Your access was changed — reloading'); setTimeout(function(){ location.reload(); }, 1200); } }, function(){ }));
  }
  unsubs.push(db.collection('distributor_stock').where('distributorId', '==', id).where('visible', '==', true).onSnapshot({ includeMetadataChanges: true }, function(s){
    setPending('stock', s); stockLoaded = true;
    if(!s.docChanges().length && items.length) return;
    items = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; });
    Object.keys(dirty).forEach(function(k){ var it = itemById(k); if(!it || dirty[k] === (Number(it.qty) || 0)) delete dirty[k]; });
    softRender();
  }, function(ex){ toast('Could not load stock: ' + (ex.code === 'permission-denied' ? 'access denied' : ex.message)); }));
  unsubs.push(db.collection('distributor_requests').where('distributorId', '==', id).onSnapshot(function(s){ reqs = s.docs.map(function(x){ var o = x.data(); o.id = o.id || x.id; return o; }).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); }); if(tab === 'more') softRender(); }, function(){ }));
  if(allow('sales', ['add', 'manage'])){
    unsubs.push(db.collection('distributor_sales').where('distributorId', '==', id).orderBy('ts', 'desc').limit(300).onSnapshot({ includeMetadataChanges: true }, function(s){
      setPending('sales', s); if(!s.docChanges().length && salesList.length) return;
      salesList = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }); softRender();
    }, function(ex){ toast('Could not load sales' + (ex.code === 'failed-precondition' ? ' — ask your supplier to deploy the Firestore indexes' : '')); }));
  }
  if(allow('orders', ['view', 'place'])){
    unsubs.push(db.collection('distributor_orders').where('distributorId', '==', id).orderBy('createdAt', 'desc').limit(100).onSnapshot({ includeMetadataChanges: true }, function(s){
      setPending('orders', s);
      s.docChanges().forEach(function(ch){ var o = ch.doc.data(); if(ch.type === 'modified' && !ch.doc.metadata.hasPendingWrites && prevOrderStatus[ch.doc.id] && prevOrderStatus[ch.doc.id] !== o.status) toast('📦 Order ' + o.no + ' is now ' + (ST_TXT[o.status] || o.status)); });
      if(!s.docChanges().length && ordersList.length) return;
      ordersList = s.docs.map(function(x){ var o = x.data(); o.id = x.id; prevOrderStatus[x.id] = o.status; return o; }); softRender();
    }, function(ex){ toast('Could not load orders' + (ex.code === 'failed-precondition' ? ' — ask your supplier to deploy the Firestore indexes' : '')); }));
  }
  resetIdle();
}
$('bnav').addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; tab = b.getAttribute('data-t'); sub = null; if(tab === 'stock') stLimit = 40; render(); window.scrollTo(0, 0); });
function tabAllowed(t){ return t === 'stock' || t === 'more' || (t === 'sell' && allow('sales', ['add', 'manage'])) || (t === 'orders' && allow('orders', ['view', 'place'])); }

/* idle sign-out — never while offline or while changes are still waiting to be sent */
function resetIdle(){ clearTimeout(idleT); if(!me) return; idleT = setTimeout(function(){ if(navigator.onLine === false || queued > 0 || anyPending() || Object.keys(dirty).length){ resetIdle(); return; } toast('Signed out (inactive)'); auth.signOut(); }, IDLE_MS); }
['click', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, function(){ if(me) resetIdle(); }, { passive: true }); });

/* ------------------------------------------------------------------ rendering helpers */
function sheetOpen(){ return !!document.querySelector('.ov'); }
function typingInView(){ var a = document.activeElement; return !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && $('view').contains(a)); }
function softRender(){ if(sheetOpen() || typingInView()){ pendingRender = true; return; } render(); }
document.addEventListener('focusout', function(){ if(pendingRender) setTimeout(function(){ if(!sheetOpen() && !typingInView()){ pendingRender = false; render(); } }, 80); });
function keepFocus(fn){ var a = document.activeElement, id = a && a.id, pos = null; try{ pos = a.selectionStart; }catch(e){} fn(); if(id){ var el = $(id); if(el){ el.focus(); try{ if(pos != null) el.setSelectionRange(pos, pos); }catch(e){} } } }
function openSheet(html, tall){
  var w = document.createElement('div'); w.className = 'ov';
  w.innerHTML = '<div class="sheet' + (tall ? ' tall' : '') + '">' + html + '</div>';
  w.addEventListener('mousedown', function(e){ if(e.target === w) closeSheet(w); });
  document.body.appendChild(w); return w;
}
function closeSheet(w){ if(w && w.parentNode) w.remove(); if(pendingRender){ pendingRender = false; render(); } }

function render(){
  if(!me) return;
  if(!tabAllowed(tab)) tab = 'stock';
  $('bizName').textContent = me.name || me.id;
  $('who').textContent = team ? team.name + ' · team login' : (me.city || 'Distributor');
  renderNav();
  ({ stock: viewStock, sell: viewSell, orders: viewOrders, more: viewMore })[tab]();
  renderSaveBar(); renderSync(); splashDone();
}
function renderNav(){
  var low = items.filter(function(it){ return statusOf(curQty(it)) !== 'ok'; }).length;
  var open = ordersList.filter(function(o){ return ['placed', 'accepted', 'dispatched'].indexOf(o.status) >= 0; }).length;
  var t = [['stock', '📦', 'Stock', low], ['sell', '🧾', 'Sell', 0], ['orders', '🛒', 'Orders', open || (cart.length ? cart.length : 0)], ['more', '☰', 'More', 0]].filter(function(x){ return tabAllowed(x[0]); });
  $('bnav').innerHTML = t.map(function(x){ return '<button type="button" data-t="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '"><span class="ic">' + x[1] + '</span>' + x[2] + (x[3] ? '<span class="bd">' + x[3] + '</span>' : '') + '</button>'; }).join('');
}
function renderSaveBar(){
  var n = Object.keys(dirty).length, bar = $('saveBar');
  if(!n || tab !== 'stock'){ if(bar) bar.remove(); return; }
  if(!bar){ bar = document.createElement('div'); bar.id = 'saveBar'; bar.className = 'savebar'; document.body.appendChild(bar); }
  bar.innerHTML = '<div class="t"><b>' + n + '</b> unsaved change' + (n > 1 ? 's' : '') + '</div><button class="btn ghost sm" id="sbDisc" type="button">Discard</button><button class="btn gold" id="sbSave" type="button">Save</button>';
  $('sbDisc').onclick = function(){ dirty = {}; render(); }; $('sbSave').onclick = saveAll;
}

/* ================================================================== STOCK */
function filteredItems(){
  var q = qStock.toLowerCase().trim();
  var list = items.filter(function(it){
    var s = statusOf(curQty(it));
    return (filt === 'all' || filt === s) && (!catF || (it.catName || 'Other') === catF) && (!q || (it.name + ' ' + (it.size || '') + ' ' + it.part).toLowerCase().indexOf(q) >= 0);
  });
  list.sort(function(a, b){
    if(sortBy === 'low') return curQty(a) - curQty(b);
    if(sortBy === 'old') return (a.updatedAt || 0) - (b.updatedAt || 0);
    if(sortBy === 'new') return (b.updatedAt || 0) - (a.updatedAt || 0);
    return String(a.name).localeCompare(String(b.name)) || String(a.size || '').localeCompare(String(b.size || ''), undefined, { numeric: true });
  });
  return list;
}
function itemCard(it){
  var q = curQty(it), st = statusOf(q), canEdit = allow('stock', ['edit']), canSell = allow('sales', ['add', 'manage']), canOrd = allow('orders', ['place']);
  var info = '';
  if(me.stockView === 'company' || me.stockView === 'all'){ if(it.companyStock !== undefined) info += '<span>Company stock: <b>' + (it.companyStock === null ? 'Available' : esc(it.companyStock)) + '</b></span>'; }
  if(me.stockView === 'all' && it.othersStock !== undefined) info += '<span>Other distributors: <b>' + esc(it.othersStock) + '</b></span>';
  if(allow('price', ['view']) && it.showPrice && it.mrp != null) info += '<span>MRP <b>' + money(it.mrp) + '</b>' + (it.gstPct ? ' + ' + esc(it.gstPct) + '% GST' : '') + '</span>';
  return '<div class="it ' + st + (dirty[it.id] !== undefined ? ' dirty' : '') + '" data-row="' + esc(it.id) + '">' +
    '<div class="row"><div class="grow"><div class="nm">' + esc(it.name) + (it.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(it.size) + '</span>' : '') + '</div><div class="meta">' + esc(it.part) + (it.catName ? ' · ' + esc(it.catName) : '') + ' · updated ' + ago(it.updatedAt) + '</div></div><span class="pill ' + st + '" data-pill="' + esc(it.id) + '">' + stTxt(st) + '</span></div>' +
    (info ? '<div class="info">' + info + '</div>' : '') +
    '<div class="ctl">' + (canEdit ? '<div class="stp"><button type="button" data-dec="' + esc(it.id) + '" aria-label="less">−</button><input type="number" inputmode="numeric" min="0" data-qty="' + esc(it.id) + '" value="' + q + '" aria-label="stock"><button type="button" data-inc="' + esc(it.id) + '" aria-label="more">+</button></div>' +
      '<button type="button" class="mini" data-recv="' + esc(it.id) + '">＋ Received</button>' : '<div class="nm" style="font-size:22px">' + q + ' <span class="sub">in stock</span></div>') +
      (canSell && q > 0 ? '<button type="button" class="mini" data-sell="' + esc(it.id) + '">Sell</button>' : '') + (canOrd ? '<button type="button" class="mini" data-cart="' + esc(it.id) + '" title="Add to order">🛒</button>' : '') + '</div></div>';
}
function viewStock(){
  var total = items.reduce(function(a, it){ return a + curQty(it); }, 0);
  var low = 0, oos = 0; items.forEach(function(it){ var s = statusOf(curQty(it)); if(s === 'low') low++; else if(s === 'oos') oos++; });
  var cats = {}; items.forEach(function(it){ cats[it.catName || 'Other'] = 1; });
  var catNames = Object.keys(cats).sort();
  var list = filteredItems(), shown = list.slice(0, stLimit);
  var stale = me.lastConfirmedAt ? Date.now() - Math.max(me.lastConfirmedAt, items.reduce(function(m, it){ return Math.max(m, it.updatedAt || 0); }, 0)) > 7 * 86400000 : items.length > 0 && !items.some(function(it){ return it.updatedAt; });
  var h = (me.notice ? '<div class="notice">📢 ' + esc(me.notice) + '</div>' : '') +
    (stale && allow('stock', ['edit']) ? '<div class="notice">⏰ Your stock has not been updated for a while. Update the numbers or tap <b>All up to date</b> below.</div>' : '') +
    '<div class="kpis"><div class="kpi' + (filt === 'all' ? ' on' : '') + '" data-f="all"><b>' + items.length + '</b><span>Items</span></div><div class="kpi"><b id="kUnits">' + total + '</b><span>Total units</span></div><div class="kpi' + (filt === 'low' ? ' on' : '') + '" data-f="low"><b id="kLow" style="color:#a8680a">' + low + '</b><span>Low</span></div><div class="kpi' + (filt === 'oos' ? ' on' : '') + '" data-f="oos"><b id="kOos" style="color:#b23b3b">' + oos + '</b><span>Out</span></div></div>' +
    '<div class="tools"><input class="inp" id="sQ" type="search" placeholder="Search item, size or part…" value="' + esc(qStock) + '"><select class="inp" id="sSort" style="max-width:42%"><option value="name">A–Z</option><option value="low">Lowest first</option><option value="old">Not updated</option><option value="new">Recent</option></select></div>' +
    (catNames.length > 1 ? '<div class="chips"><button type="button" class="chip' + (!catF ? ' on' : '') + '" data-cat="">All</button>' + catNames.map(function(c){ return '<button type="button" class="chip' + (catF === c ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '');
  if(!items.length && !stockLoaded) h += (window.acLoader ? window.acLoader.skeleton(5, 'card') : '<div class="card empty">Loading…</div>');
  else if(!items.length) h += '<div class="card empty"><div class="big">📦</div><b>No products yet</b><div class="sub">Your supplier has not chosen products for you yet.</div></div>';
  else if(!list.length) h += '<div class="card empty">No items match.</div>';
  else h += shown.map(itemCard).join('') + (list.length > shown.length ? '<button type="button" class="btn ghost block" id="moreBtn">Show more (' + (list.length - shown.length) + ' left)</button>' : '');
  if(items.length && (low + oos) > 0) h += '<button type="button" class="btn ghost block" id="shareLow" style="margin-top:8px">📲 Share low-stock list</button>';
  if(items.length && allow('stock', ['edit'])) h += '<button type="button" class="btn ghost block" id="confirmBtn" style="margin-top:8px">✔ All up to date</button>';
  $('view').innerHTML = h; $('sSort').value = sortBy;
}
function refreshRow(id){
  var it = itemById(id), row = document.querySelector('[data-row="' + id + '"]'); if(!it || !row) return;
  var st = statusOf(curQty(it));
  row.classList.toggle('dirty', dirty[id] !== undefined); row.classList.remove('low', 'oos'); if(st !== 'ok') row.classList.add(st);
  var pill = row.querySelector('[data-pill]'); if(pill){ pill.className = 'pill ' + st; pill.textContent = stTxt(st); }
  var inp = row.querySelector('[data-qty]'); if(inp && document.activeElement !== inp) inp.value = curQty(it);
  var lo = 0, oo = 0, un = 0; items.forEach(function(x){ var s = statusOf(curQty(x)); if(s === 'low') lo++; if(s === 'oos') oo++; un += curQty(x); });
  if($('kUnits')) $('kUnits').textContent = un; if($('kLow')) $('kLow').textContent = lo; if($('kOos')) $('kOos').textContent = oo;
  renderSaveBar(); renderNav();
}
function setQty(id, v){ var it = itemById(id); if(!it) return; v = Math.max(0, Math.floor(Number(v) || 0)); if(v === (Number(it.qty) || 0)) delete dirty[id]; else dirty[id] = v; }
function saveAll(){
  var ids = Object.keys(dirty); if(!ids.length) return;
  var now = Date.now(), batch = db.batch(), n = 0;
  ids.forEach(function(id){
    var it = itemById(id); if(!it){ delete dirty[id]; return; }
    var to = Math.max(0, Math.floor(Number(dirty[id]) || 0)), from = Number(it.qty) || 0;
    batch.update(db.collection('distributor_stock').doc(id), { qty: to, updatedAt: now, updatedBy: loginId });
    batch.set(db.collection('distributor_log').doc(), logRow(it, from, to, now));
    setTotal(batch, it, to, now); n++;
  });
  if(!n){ dirty = {}; render(); return; }
  hist = null; dirty = {}; commitBatch(batch, '✔ Stock saved'); render();
}
function receiveStock(id){
  var it = itemById(id); if(!it) return;
  if(dirty[id] !== undefined){ toast('Save your pending change for this item first'); return; }
  var w = openSheet('<h2>Stock received</h2><div class="sub">' + esc(it.name) + (it.size ? ' — ' + esc(it.size) : '') + ' · you have <b>' + (Number(it.qty) || 0) + '</b></div><label class="l">Units received</label><input class="inp" id="rcQ" type="number" inputmode="numeric" min="1" placeholder="e.g. 50"><div class="row" style="margin-top:14px"><button class="btn ghost grow" id="rcNo" type="button">Cancel</button><button class="btn gold grow" id="rcYes" type="button">Add to stock</button></div>');
  $('rcQ').focus(); $('rcNo').onclick = function(){ closeSheet(w); };
  $('rcYes').onclick = function(){
    var n = Math.floor(Number($('rcQ').value) || 0); if(n < 1){ toast('Enter how many units you received'); return; }
    var now = Date.now(), from = Number(it.qty) || 0, b = db.batch();
    b.update(db.collection('distributor_stock').doc(id), { qty: FV.increment(n), updatedAt: now, updatedBy: loginId });
    b.set(db.collection('distributor_log').doc(), logRow(it, from, from + n, now, 'receive', ''));
    setTotal(b, it, FV.increment(n), now); hist = null; closeSheet(w); commitBatch(b, '✔ ' + n + ' units added to ' + it.name);
  };
}
function confirmUpToDate(){
  if(Object.keys(dirty).length){ toast('Save your changes first'); return; }
  db.collection('distributors').doc(me.id).update({ lastConfirmedAt: Date.now() }).then(function(){ toast('✔ Thanks — marked as up to date'); }, function(){ toast('Could not confirm (no permission)'); });
}
function shareLow(){
  var need = items.filter(function(it){ return statusOf(curQty(it)) !== 'ok'; });
  if(!need.length){ toast('Nothing is low — all in stock 👍'); return; }
  var txt = 'Low / out of stock — ' + (me.name || me.id) + '\n' + need.map(function(it){ return '• ' + it.name + (it.size ? ' (' + it.size + ')' : '') + ' [' + it.part + ']: ' + curQty(it); }).join('\n');
  if(navigator.share){ navigator.share({ text: txt }).catch(function(){ }); } else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}
$('view').addEventListener('click', function(e){
  var t = e.target.closest ? (e.target.closest('button,[data-f]') || e.target) : e.target, id, v;
  if((id = t.getAttribute('data-dec'))){ setQty(id, curQty(itemById(id)) - 1); refreshRow(id); }
  else if((id = t.getAttribute('data-inc'))){ setQty(id, curQty(itemById(id)) + 1); refreshRow(id); }
  else if((id = t.getAttribute('data-recv'))) receiveStock(id);
  else if((id = t.getAttribute('data-sell'))) openSale(id);
  else if((id = t.getAttribute('data-cart'))){ addToCart(id, 1); toast('🛒 Added to your order'); renderNav(); }
  else if((v = t.getAttribute('data-f')) !== null){ filt = (filt === v && v !== 'all') ? 'all' : v; stLimit = 40; render(); }
  else if((v = t.getAttribute('data-cat')) !== null){ catF = v; stLimit = 40; render(); }
  else if(t.id === 'moreBtn'){ stLimit += 40; render(); }
  else if(t.id === 'shareLow') shareLow();
  else if(t.id === 'confirmBtn') confirmUpToDate();
  else if((v = t.getAttribute('data-ord'))) openOrder();
});
$('view').addEventListener('input', function(e){
  var t = e.target, id;
  if(t.id === 'sQ'){ qStock = t.value; stLimit = 40; keepFocus(render); }
  else if((id = t.getAttribute('data-qty'))){ setQty(id, t.value); refreshRow(id); }
});
$('view').addEventListener('change', function(e){ if(e.target.id === 'sSort'){ sortBy = e.target.value; render(); } });

/* ================================================================== SELL (sales entry + what sold) */
function salesAgg(rows){
  var a = { n: 0, u: 0, v: 0, prod: {}, day: {} };
  rows.forEach(function(s){
    if(s.status === 'void') return;
    var u = Number(s.units) || 0, v = Number(s.amount) || 0; a.n++; a.u += u; a.v += v;
    var dk = new Date(s.ts).toDateString(), d = a.day[dk] = a.day[dk] || { ts: s.ts, n: 0, u: 0, v: 0 }; d.n++; d.u += u; d.v += v;
    (s.lines || []).forEach(function(l){ var k = partKey(l.part) || l.name, p = a.prod[k] = a.prod[k] || { name: l.name, size: l.size, part: l.part, u: 0, v: 0, n: 0 }; var q = Number(l.qty) || 0; p.u += q; p.v += q * (Number(l.rate) || 0); p.n++; });
  });
  return a;
}
function viewSell(){
  var canVoid = allow('sales', ['manage']), since = pStart(sPeriod);
  var rows = salesList.filter(function(s){ return s.ts >= since; }), a = salesAgg(rows), voided = rows.filter(function(s){ return s.status === 'void'; }).length;
  var chip = function(k, l){ return '<button type="button" class="chip' + (sPeriod === k ? ' on' : '') + '" data-sp="' + k + '">' + l + '</button>'; };
  var mchip = function(k, l){ return '<button type="button" class="chip' + (sMode === k ? ' on' : '') + '" data-sm="' + k + '">' + l + '</button>'; };
  var h = '<button type="button" class="btn gold block" id="newSale" style="font-size:17px;min-height:54px">＋ New sale</button><div style="height:12px"></div>' +
    '<div class="chips">' + chip('today', 'Today') + chip('7', '7 days') + chip('30', '30 days') + chip('month', 'This month') + '</div>' +
    '<div class="kpis k3"><div class="kpi"><b>' + a.n + '</b><span>Sales</span></div><div class="kpi"><b>' + a.u + '</b><span>Units sold</span></div><div class="kpi"><b>' + (a.v ? money(a.v) : '—') + '</b><span>Value</span></div></div>' +
    '<div class="chips">' + mchip('prod', 'By product') + mchip('day', 'By day') + mchip('list', 'Each sale') + '</div>';
  if(!a.n && !voided) h += '<div class="card empty"><div class="big">🧾</div><b>No sales ' + (sPeriod === 'today' ? 'today' : 'in this period') + '</b><div class="sub">Tap “New sale” when you sell something — your stock reduces automatically.</div></div>';
  else if(sMode === 'prod'){
    var pl = Object.keys(a.prod).map(function(k){ return a.prod[k]; }).sort(function(x, y){ return y.u - x.u; });
    h += '<div class="card">' + pl.map(function(p){ var it = items.filter(function(i){ return partKey(i.part) === partKey(p.part); })[0], left = it ? curQty(it) : null;
      return '<div class="ln" style="align-items:flex-start"><div class="grow"><div class="nm" style="font-weight:650">' + esc(p.name) + (p.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(p.size) + '</span>' : '') + '</div><div class="sub">' + esc(p.part) + ' · ' + p.n + ' sale' + (p.n > 1 ? 's' : '') + (left !== null ? ' · <b>' + left + ' left</b> in stock' : '') + '</div></div><div style="text-align:right"><div style="font-size:18px;font-weight:700">' + p.u + '</div><div class="sub">' + (p.v ? money(p.v) : 'units') + '</div></div></div>'; }).join('') + '</div>';
  } else if(sMode === 'day'){
    h += '<div class="card">' + Object.keys(a.day).map(function(k){ return a.day[k]; }).sort(function(x, y){ return y.ts - x.ts; }).map(function(d){ return '<div class="ln"><div class="grow"><b>' + new Date(d.ts).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) + '</b><div class="sub">' + d.n + ' sale' + (d.n > 1 ? 's' : '') + '</div></div><div style="text-align:right"><b>' + d.u + ' units</b><div class="sub">' + (d.v ? money(d.v) : '') + '</div></div></div>'; }).join('') + '</div>';
  } else {
    h += rows.slice(0, 60).map(function(s){
      var vd = s.status === 'void';
      return '<div class="card" style="' + (vd ? 'opacity:.55' : '') + '"><div class="row"><div class="grow"><b>' + esc(s.no || 'Sale') + '</b>' + (s.customer ? ' · ' + esc(s.customer) : '') + (vd ? ' <span class="pill bad">Voided</span>' : '') + '<div class="sub">' + fmtT(s.ts) + (s.by && s.by !== loginId ? ' · ' + esc(s.by) : '') + '</div></div><div style="text-align:right"><b>' + (Number(s.units) || 0) + ' units</b><div class="sub">' + (Number(s.amount) ? money(s.amount) : '') + '</div></div></div>' +
        '<div style="margin-top:6px">' + (s.lines || []).map(function(l){ return '<div class="sub" style="color:#374151">• ' + esc(l.name) + (l.size ? ' (' + esc(l.size) + ')' : '') + ' × <b>' + (Number(l.qty) || 0) + '</b>' + (l.rate ? ' @ ' + money(l.rate) : '') + '</div>'; }).join('') + '</div>' +
        (s.note ? '<div class="sub">📝 ' + esc(s.note) + '</div>' : '') + (canVoid && !vd ? '<button type="button" class="btn ghost sm" data-void="' + esc(s.id) + '" style="margin-top:8px">Void this sale</button>' : '') + '</div>'; }).join('');
  }
  if(salesList.length >= 300) h += '<div class="sub" style="text-align:center">Showing your latest 300 sales.</div>';
  $('view').innerHTML = h;
}
function topSold(){
  var m = {}; salesList.forEach(function(s){ if(s.status === 'void') return; (s.lines || []).forEach(function(l){ m[l.sid] = (m[l.sid] || 0) + (Number(l.qty) || 0); }); });
  return items.filter(function(it){ return (Number(it.qty) || 0) > 0; }).sort(function(a, b){ return (m[b.id] || 0) - (m[a.id] || 0) || String(a.name).localeCompare(String(b.name)); });
}
function openSale(preId){
  if(!allow('sales', ['add', 'manage'])) return;
  var it0 = preId && itemById(preId); if(it0 && !saleLines.some(function(l){ return l.id === preId; })) saleLines.push({ id: preId, qty: 1, rate: defRate(it0) });
  var w = openSheet('<div class="row"><h2 class="grow">New sale</h2><button class="btn ghost sm" id="sxClose" type="button">Close</button></div><div class="sub">Add the items you sold. Your stock reduces automatically when you record the sale.</div>' +
    '<input class="inp" id="sxQ" type="search" placeholder="🔍 Search item to add…" style="margin-top:10px"><div id="sxRes"></div><div id="sxLines"></div>' +
    '<input class="inp" id="sxCust" placeholder="Customer / shop name (optional)" style="margin-top:10px"><input class="inp" id="sxNote" placeholder="Note (optional)" style="margin-top:8px">' +
    '<div class="tot"><span>Total</span><span id="sxTot"></span></div><div class="row"><button class="btn ghost" id="sxClear" type="button">Clear</button><button class="btn gold grow" id="sxSave" type="button" style="font-size:16px">✔ Record sale</button></div>', true);
  var qs = '';
  $('sxCust').value = saleMeta.customer; $('sxNote').value = saleMeta.note;
  function row(it, btn){ return '<div class="r"><div class="grow"><div class="nm" style="font-size:14px;font-weight:650">' + esc(it.name) + (it.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(it.size) + '</span>' : '') + '</div><div class="sub">' + esc(it.part) + ' · in stock <b>' + (Number(it.qty) || 0) + '</b></div></div>' + btn + '</div>'; }
  function paint(){
    var q = qs.toLowerCase().trim(), taken = {}; saleLines.forEach(function(l){ taken[l.id] = 1; });
    var list = (q ? items.filter(function(it){ return (Number(it.qty) || 0) > 0 && (it.name + ' ' + (it.size || '') + ' ' + it.part).toLowerCase().indexOf(q) >= 0; }) : topSold()).filter(function(it){ return !taken[it.id]; }).slice(0, q ? 15 : 6);
    $('sxRes').innerHTML = list.length ? '<div class="sub" style="margin-top:8px">' + (q ? 'Results' : 'Quick add') + '</div><div class="res">' + list.map(function(it){ return row(it, '<button class="btn gold sm" type="button" data-add="' + esc(it.id) + '">＋ Add</button>'); }).join('') + '</div>' : (q ? '<div class="sub" style="margin-top:8px">No match with stock.</div>' : '');
    $('sxLines').innerHTML = saleLines.length ? '<div class="card" style="margin:12px 0 0;padding:6px 12px">' + saleLines.map(function(l){
      var it = itemById(l.id); if(!it) return '';
      var q2 = Math.floor(Number(l.qty) || 0), left = (Number(it.qty) || 0) - q2;
      return '<div class="ln"><div class="grow"><div class="nm" style="font-size:14px;font-weight:650">' + esc(it.name) + (it.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(it.size) + '</span>' : '') + '</div><div class="sub" style="' + (left < 0 ? 'color:#b23b3b;font-weight:650' : '') + '">' + (left < 0 ? 'Only ' + (Number(it.qty) || 0) + ' in stock!' : left + ' left after this sale') + '</div></div>' +
        '<div class="stp"><button type="button" data-lm="' + esc(l.id) + '">−</button><input type="number" inputmode="numeric" min="1" data-lq="' + esc(l.id) + '" value="' + esc(l.qty) + '"><button type="button" data-lp="' + esc(l.id) + '">+</button></div>' +
        '<input class="rate" type="number" inputmode="decimal" min="0" step="any" data-lr="' + esc(l.id) + '" value="' + esc(l.rate == null ? '' : l.rate) + '" placeholder="₹ rate"><button class="btn ghost sm" type="button" data-lx="' + esc(l.id) + '">✕</button></div>'; }).join('') + '</div>' : '';
    totals();
  }
  function totals(){ var u = 0, a = 0; saleLines.forEach(function(l){ var q = Math.floor(Number(l.qty) || 0); u += q; a += q * (Number(l.rate) || 0); }); $('sxTot').textContent = u + ' units' + (a ? ' · ' + money(a) : ''); $('sxSave').disabled = !saleLines.length; $('sxClear').disabled = !saleLines.length; }
  w.addEventListener('click', function(e){
    var t = e.target.closest('button'); if(!t) return; var id;
    if(t.id === 'sxClose') closeSheet(w);
    else if((id = t.getAttribute('data-add'))){ saleLines.push({ id: id, qty: 1, rate: defRate(itemById(id)) }); qs = ''; $('sxQ').value = ''; saveDrafts(); paint(); }
    else if((id = t.getAttribute('data-lm'))){ var l = lineOf(id); l.qty = Math.max(1, (Math.floor(Number(l.qty)) || 1) - 1); saveDrafts(); paint(); }
    else if((id = t.getAttribute('data-lp'))){ var l2 = lineOf(id); l2.qty = (Math.floor(Number(l2.qty)) || 0) + 1; saveDrafts(); paint(); }
    else if((id = t.getAttribute('data-lx'))){ saleLines = saleLines.filter(function(x){ return x.id !== id; }); saveDrafts(); paint(); }
    else if(t.id === 'sxClear'){ saleLines = []; saleMeta = { customer: '', note: '' }; $('sxCust').value = ''; $('sxNote').value = ''; saveDrafts(); paint(); }
    else if(t.id === 'sxSave'){ if(recordSale()) closeSheet(w); }
  });
  w.addEventListener('input', function(e){
    var t = e.target, id;
    if(t.id === 'sxQ'){ qs = t.value; keepFocus(paint); }
    else if((id = t.getAttribute('data-lq'))){ lineOf(id).qty = t.value; saveDrafts(); totals(); }
    else if((id = t.getAttribute('data-lr'))){ lineOf(id).rate = t.value; saveDrafts(); totals(); }
    else if(t.id === 'sxCust'){ saleMeta.customer = t.value; saveDrafts(); } else if(t.id === 'sxNote'){ saleMeta.note = t.value; saveDrafts(); }
  });
  w.addEventListener('change', function(e){ if(e.target.getAttribute('data-lq')) paint(); });
  paint();
}
function lineOf(id){ return saleLines.filter(function(l){ return l.id === id; })[0] || {}; }
function defRate(it){ return (it && allow('price', ['view']) && it.showPrice && it.mrp != null) ? it.mrp : ''; }
function recordSale(){
  if(!saleLines.length){ toast('Add at least one item'); return false; }
  var lines = [], units = 0, amount = 0, now = Date.now();
  for(var i = 0; i < saleLines.length; i++){
    var l = saleLines[i], it = itemById(l.id), q = Math.floor(Number(l.qty) || 0);
    if(!it){ toast('An item is no longer on your list — remove it'); return false; }
    if(q < 1){ toast('Enter a quantity for ' + it.name); return false; }
    if(q > (Number(it.qty) || 0)){ toast(it.name + ': only ' + (Number(it.qty) || 0) + ' in stock'); return false; }
    if(dirty[it.id] !== undefined){ toast('Save or discard your pending stock edit for ' + it.name + ' first'); return false; }
    var line = { sid: it.id, productId: it.productId, name: it.name, size: it.size || '', part: it.part, qty: q };
    if(l.rate !== '' && l.rate != null && isFinite(Number(l.rate)) && Number(l.rate) >= 0){ line.rate = Number(l.rate); amount += q * line.rate; }
    units += q; lines.push({ line: line, it: it });
  }
  var saleRef = db.collection('distributor_sales').doc(), no = 'S' + now.toString(36).toUpperCase().slice(-6), b = db.batch();
  b.set(saleRef, { no: no, distributorId: me.id, ts: now, by: loginId, customer: saleMeta.customer.trim(), note: saleMeta.note.trim(), lines: lines.map(function(x){ return x.line; }), units: units, amount: amount, status: 'ok' });
  lines.forEach(function(x){
    b.update(db.collection('distributor_stock').doc(x.it.id), { qty: FV.increment(-x.line.qty), updatedAt: now, updatedBy: loginId });      // increments stay correct even when several phones work offline
    b.set(db.collection('distributor_log').doc(), logRow(x.it, Number(x.it.qty) || 0, (Number(x.it.qty) || 0) - x.line.qty, now, 'sale', no));
    setTotal(b, x.it, FV.increment(-x.line.qty), now);
  });
  saleLines = []; saleMeta = { customer: '', note: '' }; saveDrafts(); hist = null; sPeriod = sPeriod === 'today' ? 'today' : sPeriod;
  commitBatch(b, '✔ Sale ' + no + ' recorded — ' + units + ' units, stock reduced'); render(); return true;
}
function voidSale(id){
  var s = salesList.filter(function(x){ return x.id === id; })[0]; if(!s || s.status === 'void') return;
  if(!confirm('Void sale ' + (s.no || '') + '? The sold quantities go back into your stock.')) return;
  var now = Date.now(), b = db.batch(), skipped = 0;
  b.update(db.collection('distributor_sales').doc(id), { status: 'void', voidedAt: now, voidedBy: loginId });
  (s.lines || []).forEach(function(l){
    var it = itemById(l.sid); if(!it){ skipped++; return; }
    var q = Number(l.qty) || 0;
    b.update(db.collection('distributor_stock').doc(it.id), { qty: FV.increment(q), updatedAt: now, updatedBy: loginId });
    b.set(db.collection('distributor_log').doc(), logRow(it, Number(it.qty) || 0, (Number(it.qty) || 0) + q, now, 'void', s.no || ''));
    setTotal(b, it, FV.increment(q), now);
  });
  hist = null; commitBatch(b, '✔ Sale voided — stock restored' + (skipped ? ' (' + skipped + ' hidden item(s) not restored)' : ''));
}

/* ================================================================== ORDERS (purchase orders to the company) */
var ST_TXT = { placed: 'Placed', accepted: 'Accepted', dispatched: 'Dispatched', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled' };
var ST_CLS = { placed: 'info', accepted: 'pend', dispatched: 'info', delivered: 'ok', rejected: 'bad', cancelled: 'pend' };
function addToCart(id, qty){ if(!itemById(id) || cart.some(function(c){ return c.id === id; })) return; cart.push({ id: id, qty: qty || 1 }); saveDrafts(); }
function viewOrders(){
  var canPlace = allow('orders', ['place']), h = '';
  if(canPlace) h += '<button type="button" class="btn gold block" id="newOrder" style="font-size:17px;min-height:54px">' + (cart.length ? '🛒 Continue your order (' + cart.length + ' item' + (cart.length > 1 ? 's' : '') + ')' : '＋ New order to the company') + '</button><div style="height:12px"></div>';
  h += !ordersList.length ? '<div class="card empty"><div class="big">🛒</div><b>No orders yet</b><div class="sub">Order stock from your supplier and follow it here until it is delivered.</div></div>' : ordersList.map(function(o){
    return '<div class="card"><div class="row"><b class="grow" style="font-size:16px">' + esc(o.no) + '</b><span class="pill ' + (ST_CLS[o.status] || 'pend') + '">' + esc(ST_TXT[o.status] || o.status) + '</span></div>' +
      '<div class="sub">' + fmtT(o.createdAt) + ' · ' + (Number(o.units) || 0) + ' units' + (o.by && o.by !== loginId ? ' · by ' + esc(o.by) : '') + '</div>' +
      '<div style="margin:6px 0">' + (o.lines || []).map(function(l){ return '<div class="sub" style="color:#374151">• ' + esc(l.name) + (l.size ? ' (' + esc(l.size) + ')' : '') + ' × <b>' + (Number(l.qty) || 0) + '</b></div>'; }).join('') + '</div>' +
      (o.expected ? '<div class="sub">📅 Expected delivery: <b>' + esc(o.expected) + '</b></div>' : '') + (o.adminNote ? '<div class="sub">💬 Supplier: ' + esc(o.adminNote) + '</div>' : '') +
      '<div class="tl">' + (o.history || []).map(function(x){ return '<div><b>' + esc(ST_TXT[x.s] || x.s) + '</b> — ' + fmtT(x.ts) + '</div>'; }).join('') + '</div>' +
      (o.status === 'delivered' && o.stockAdded ? '<div class="sub" style="color:var(--ok);margin-top:6px">✔ Quantities were added to your stock</div>' : '') +
      (o.status === 'placed' && canPlace ? '<button type="button" class="btn ghost sm" data-cancel="' + esc(o.id) + '" style="margin-top:8px">Cancel order</button>' : '') + '</div>'; }).join('');
  $('view').innerHTML = h;
}
function openOrder(){
  if(!allow('orders', ['place'])) return;
  var w = openSheet('<div class="row"><h2 class="grow">Order to the company</h2><button class="btn ghost sm" id="oxClose" type="button">Close</button></div><div class="sub">Pick what you need. Your supplier will accept, dispatch and deliver — you can follow every step in Orders.</div>' +
    '<div class="row" style="margin-top:10px"><input class="inp" id="oxQ" type="search" placeholder="🔍 Search item…"><button class="btn ghost sm" id="oxLow" type="button">＋ Low / out items</button></div><div id="oxRes"></div><div id="oxLines"></div>' +
    '<textarea class="inp" id="oxNote" rows="2" placeholder="Note to the company (optional)" style="margin-top:10px"></textarea><div class="tot"><span>Total</span><span id="oxTot"></span></div><div class="row"><button class="btn ghost" id="oxClear" type="button">Clear</button><button class="btn gold grow" id="oxSend" type="button" style="font-size:16px">📨 Place order</button></div>', true);
  var qs = ''; $('oxNote').value = orderNote;
  function paint(){
    var q = qs.toLowerCase().trim(), taken = {}; cart.forEach(function(c){ taken[c.id] = 1; });
    var list = items.filter(function(it){ return !taken[it.id] && (!q ? statusOf(Number(it.qty) || 0) !== 'ok' : (it.name + ' ' + (it.size || '') + ' ' + it.part).toLowerCase().indexOf(q) >= 0); }).slice(0, q ? 15 : 6);
    $('oxRes').innerHTML = list.length ? '<div class="sub" style="margin-top:8px">' + (q ? 'Results' : 'Running low') + '</div><div class="res">' + list.map(function(it){ return '<div class="r"><div class="grow"><div class="nm" style="font-size:14px;font-weight:650">' + esc(it.name) + (it.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(it.size) + '</span>' : '') + '</div><div class="sub">' + esc(it.part) + ' · you have <b>' + (Number(it.qty) || 0) + '</b></div></div><button class="btn gold sm" type="button" data-oadd="' + esc(it.id) + '">＋ Add</button></div>'; }).join('') + '</div>' : '';
    $('oxLines').innerHTML = cart.length ? '<div class="card" style="margin:12px 0 0;padding:6px 12px">' + cart.map(function(c){ var it = itemById(c.id); if(!it) return '';
      return '<div class="ln"><div class="grow"><div class="nm" style="font-size:14px;font-weight:650">' + esc(it.name) + (it.size ? ' <span style="font-weight:500;color:#4b5563">— ' + esc(it.size) + '</span>' : '') + '</div><div class="sub">you have ' + (Number(it.qty) || 0) + '</div></div><div class="stp"><button type="button" data-om="' + esc(c.id) + '">−</button><input type="number" inputmode="numeric" min="1" data-oq="' + esc(c.id) + '" value="' + esc(c.qty) + '"><button type="button" data-op="' + esc(c.id) + '">+</button></div><button class="btn ghost sm" type="button" data-ox="' + esc(c.id) + '">✕</button></div>'; }).join('') + '</div>' : '';
    totals();
  }
  function totals(){ var u = cart.reduce(function(a, c){ return a + (Math.floor(Number(c.qty)) || 0); }, 0); $('oxTot').textContent = cart.length + ' item' + (cart.length === 1 ? '' : 's') + ' · ' + u + ' units'; $('oxSend').disabled = !cart.length; $('oxClear').disabled = !cart.length; }
  function cOf(id){ return cart.filter(function(c){ return c.id === id; })[0] || {}; }
  w.addEventListener('click', function(e){
    var t = e.target.closest('button'); if(!t) return; var id;
    if(t.id === 'oxClose') closeSheet(w);
    else if((id = t.getAttribute('data-oadd'))){ addToCart(id, Math.max(1, lowAt() * 2 - (Number(itemById(id).qty) || 0))); qs = ''; $('oxQ').value = ''; paint(); }
    else if(t.id === 'oxLow'){ items.forEach(function(it){ var q = Number(it.qty) || 0; if(statusOf(q) !== 'ok') addToCart(it.id, Math.max(1, lowAt() * 2 - q)); }); paint(); }
    else if((id = t.getAttribute('data-om'))){ var c = cOf(id); c.qty = Math.max(1, (Math.floor(Number(c.qty)) || 1) - 1); saveDrafts(); paint(); }
    else if((id = t.getAttribute('data-op'))){ var c2 = cOf(id); c2.qty = (Math.floor(Number(c2.qty)) || 0) + 1; saveDrafts(); paint(); }
    else if((id = t.getAttribute('data-ox'))){ cart = cart.filter(function(x){ return x.id !== id; }); saveDrafts(); paint(); }
    else if(t.id === 'oxClear'){ cart = []; orderNote = ''; $('oxNote').value = ''; saveDrafts(); paint(); }
    else if(t.id === 'oxSend'){ if(placeOrder()) closeSheet(w); }
  });
  w.addEventListener('input', function(e){ var t = e.target, id; if(t.id === 'oxQ'){ qs = t.value; keepFocus(paint); } else if((id = t.getAttribute('data-oq'))){ cOf(id).qty = t.value; saveDrafts(); totals(); } else if(t.id === 'oxNote'){ orderNote = t.value; saveDrafts(); } });
  w.addEventListener('change', function(e){ if(e.target.getAttribute('data-oq')) paint(); });
  paint();
}
function placeOrder(){
  var lines = [], units = 0, now = Date.now();
  for(var i = 0; i < cart.length; i++){
    var c = cart[i], it = itemById(c.id), q = Math.floor(Number(c.qty) || 0);
    if(!it) continue; if(q < 1){ toast('Enter a quantity for ' + it.name); return false; }
    var l = { sid: it.id, productId: it.productId, name: it.name, size: it.size || '', part: it.part, qty: q };
    if(allow('price', ['view']) && it.showPrice && it.mrp != null) l.mrp = Number(it.mrp) || 0;
    lines.push(l); units += q;
  }
  if(!lines.length){ toast('Your order is empty'); return false; }
  var ref = db.collection('distributor_orders').doc(), no = 'PO' + now.toString(36).toUpperCase().slice(-6), b = db.batch();
  b.set(ref, { id: ref.id, no: no, distributorId: me.id, distributorName: me.name || me.id, by: loginId, lines: lines, units: units, note: orderNote.trim(), status: 'placed', createdAt: now, updatedAt: now, history: [{ s: 'placed', ts: now, by: loginId }] });
  cart = []; orderNote = ''; saveDrafts(); commitBatch(b, '✔ Order ' + no + ' placed'); tab = 'orders'; render(); return true;
}
function cancelOrder(id){
  if(!confirm('Cancel this order?')) return; var now = Date.now();
  db.collection('distributor_orders').doc(id).update({ status: 'cancelled', updatedAt: now, history: FV.arrayUnion({ s: 'cancelled', ts: now, by: loginId, note: 'Cancelled by distributor' }) })
    .then(function(){ toast('Order cancelled'); }, function(){ toast('Could not cancel — your supplier may already have accepted it'); });
}
$('view').addEventListener('click', function(e){
  var t = e.target.closest ? (e.target.closest('button') || e.target) : e.target, v;
  if(t.id === 'newSale') openSale(); else if(t.id === 'newOrder') openOrder();
  else if((v = t.getAttribute('data-sp'))){ sPeriod = v; render(); } else if((v = t.getAttribute('data-sm'))){ sMode = v; render(); }
  else if((v = t.getAttribute('data-void'))) voidSale(v); else if((v = t.getAttribute('data-cancel'))) cancelOrder(v);
  else if((v = t.getAttribute('data-mm'))) moreAction(v);
  else if((v = t.getAttribute('data-hp'))){ hPeriod = v; hist = null; render(); }
  else if((v = t.getAttribute('data-rdel'))){ if(confirm('Remove this request?')) db.collection('distributor_requests').doc(v).delete().catch(function(){ toast('Could not remove'); }); }
  else if(t.id === 'subBack'){ sub = null; render(); } else if(t.id === 'hCsv') exportHistory();
});

/* ================================================================== MORE */
function viewMore(){
  if(sub === 'history'){ viewHistory(); return; }
  if(sub === 'requests'){ viewRequests(); return; }
  var m = function(k, ic, t, s){ return '<div class="m" data-mm="' + k + '"><span class="ic">' + ic + '</span><div class="grow"><b>' + t + '</b><div class="sub">' + s + '</div></div><span class="sub">›</span></div>'; };
  var h = '<div class="card menu">' +
    (allow('history', ['view']) ? m('history', '🕘', 'Stock history', 'Every change, who made it and when') : '') +
    (me.canUpload && allow('requests', ['add']) ? m('add', '➕', 'Add a product', 'Ask your supplier to add an item you stock') + m('requests', '📋', 'My product requests', reqs.length + ' request' + (reqs.length === 1 ? '' : 's')) : '') +
    (allow('stock', ['edit']) ? m('xlsx', '📗', 'Excel stock sheet', 'Download a sheet, fill Stock, upload it back') : '') +
    m('csv', '⬇', 'Export stock (CSV)', 'Your full list with quantities') + m('pw', '🔑', 'Change password', 'Choose a new password') + m('out', '🚪', 'Sign out', (team ? team.name : (me.name || '')) + '') + '</div>' +
    '<div class="card"><div class="sub">Distributor: <b>' + esc(me.name || me.id) + '</b>' + (me.phone ? ' · ' + esc(me.phone) : '') + '<br>Login: <b>' + esc(loginId) + '</b>' + (team ? ' · role access is limited by your supplier' : '') + '<br>You can use this page without internet — changes are saved on your phone and sent automatically.</div></div>';
  $('view').innerHTML = h;
}
function moreAction(k){
  if(k === 'history'){ sub = 'history'; hist = null; render(); }
  else if(k === 'requests'){ sub = 'requests'; render(); }
  else if(k === 'add') openAdd();
  else if(k === 'xlsx') excelMenu();
  else if(k === 'csv') exportCsv();
  else if(k === 'pw') openPassword();
  else if(k === 'out'){ if(queued > 0 || anyPending() || Object.keys(dirty).length){ if(!confirm('You have changes that are not sent yet. Sign out anyway?')) return; } auth.signOut(); }
}
function viewHistory(){
  var back = '<div class="row" style="margin-bottom:10px"><button type="button" class="btn ghost sm" id="subBack">← Back</button><h3 class="grow" style="margin:0">Stock history</h3><button type="button" class="btn ghost sm" id="hCsv">⬇ CSV</button></div>';
  var chip = function(k, l){ return '<button type="button" class="chip' + (hPeriod === k ? ' on' : '') + '" data-hp="' + k + '">' + l + '</button>'; };
  var head = back + '<div class="chips">' + chip('today', 'Today') + chip('7', '7 days') + chip('30', '30 days') + chip('month', 'This month') + chip('all', 'All') + '</div>';
  if(hist === null || histKey !== hPeriod){
    $('view').innerHTML = head + '<div class="card empty">Loading…</div>';
    var key = hPeriod, since = pStart(hPeriod), q = db.collection('distributor_log').where('distributorId', '==', me.id);
    if(since) q = q.where('ts', '>=', since);
    q.orderBy('ts', 'desc').limit(600).get().then(function(s){ hist = s.docs.map(function(x){ return x.data(); }); histKey = key; if(tab === 'more' && sub === 'history') render(); })
      .catch(function(ex){ $('view').innerHTML = head + '<div class="card empty">Could not load history (' + esc(ex.code || ex.message) + '). Ask your supplier to deploy the latest Firestore indexes.</div>'; });
    return;
  }
  var add = 0, red = 0; hist.forEach(function(l){ var d = (Number(l.to) || 0) - (Number(l.from) || 0); if(d > 0) add += d; else red += -d; });
  $('view').innerHTML = head + '<div class="kpis k3"><div class="kpi"><b style="color:var(--ok)">+' + add + '</b><span>Added</span></div><div class="kpi"><b style="color:var(--bad)">−' + red + '</b><span>Reduced</span></div><div class="kpi"><b>' + hist.length + '</b><span>Updates</span></div></div>' +
    (!hist.length ? '<div class="card empty">No updates in this period.</div>' : '<div class="card">' + hist.map(function(l){
      var d = (Number(l.to) || 0) - (Number(l.from) || 0);
      return '<div class="ln"><div class="grow"><div class="nm" style="font-size:14px;font-weight:650">' + esc(l.name) + (l.type ? ' <span class="pill pend">' + esc(l.type) + (l.ref ? ' ' + esc(l.ref) : '') + '</span>' : '') + '</div><div class="sub">' + esc(l.part) + ' · ' + fmtT(l.ts) + (l.by && l.by !== loginId ? ' · ' + esc(l.by) : '') + '</div></div><div style="text-align:right"><b style="color:' + (d >= 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (d >= 0 ? '+' : '') + d + '</b><div class="sub">' + (Number(l.from) || 0) + ' → ' + (Number(l.to) || 0) + '</div></div></div>'; }).join('') + '</div>');
}
function viewRequests(){
  $('view').innerHTML = '<div class="row" style="margin-bottom:10px"><button type="button" class="btn ghost sm" id="subBack">← Back</button><h3 class="grow" style="margin:0">My product requests</h3></div>' +
    (!reqs.length ? '<div class="card empty">No requests yet.</div>' : reqs.map(function(r){ return '<div class="card"><div class="row"><b class="grow">' + esc(r.name) + '</b><span class="pill ' + (r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : 'pend') + '">' + esc(r.status) + '</span></div><div class="sub">Part ' + esc(r.part) + (r.size ? ' · ' + esc(r.size) : '') + ' · stock ' + esc(r.qty) + ' · ' + ago(r.createdAt) + '</div>' + (r.adminNote ? '<div class="sub">Supplier: ' + esc(r.adminNote) + '</div>' : '') + (r.status !== 'approved' ? '<button type="button" class="btn ghost sm" data-rdel="' + esc(r.id) + '" style="margin-top:6px">Remove</button>' : '') + '</div>'; }).join(''));
}
function openAdd(){
  var w = openSheet('<h2>Add a product</h2><div class="sub">If the part number already exists in your supplier\'s catalogue it is linked to you automatically. Otherwise your supplier reviews it first.</div>' +
    '<label class="l">Part / item code *</label><input class="inp" id="apPart" autocapitalize="characters"><label class="l">Product name *</label><input class="inp" id="apName"><label class="l">Size / spec</label><input class="inp" id="apSize">' +
    '<div class="row"><div class="grow"><label class="l">Your MRP (optional)</label><input class="inp" id="apMrp" type="number" inputmode="decimal" min="0"></div><div class="grow"><label class="l">Your stock *</label><input class="inp" id="apQty" type="number" inputmode="numeric" min="0" value="0"></div></div>' +
    '<label class="l">Note</label><input class="inp" id="apNote"><div class="err" id="apErr"></div><div class="row" style="margin-top:12px"><button class="btn ghost grow" id="apNo" type="button">Cancel</button><button class="btn gold grow" id="apYes" type="button">Send to supplier</button></div>');
  $('apNo').onclick = function(){ closeSheet(w); };
  $('apYes').onclick = function(){
    var part = $('apPart').value.trim(), name = $('apName').value.trim(), qty = Math.floor(Number($('apQty').value)), err = $('apErr'), key = partKey(part);
    if(!part || !name){ err.textContent = 'Part code and name are required.'; return; } if(!(qty >= 0)){ err.textContent = 'Enter a valid stock number.'; return; } if(!key){ err.textContent = 'Part code looks invalid.'; return; }
    if(items.some(function(it){ return partKey(it.part) === key; })){ err.textContent = 'This part is already in your list — just update its stock.'; return; }
    var id = me.id + '__' + key;
    db.collection('distributor_requests').doc(id).set({ id: id, distributorId: me.id, name: name, size: $('apSize').value.trim(), part: part, partKey: key, mrp: Number($('apMrp').value) || 0, qty: qty, note: $('apNote').value.trim(), status: 'pending', createdAt: Date.now() })
      .then(function(){ closeSheet(w); toast('Sent for approval'); }).catch(function(ex){ err.textContent = ex.code === 'permission-denied' ? 'Not allowed (already requested, or adding products is switched off).' : (ex.message || 'Failed'); });
  };
}
function openPassword(){
  var w = openSheet('<h2>Change password</h2><label class="l">Current password</label><input class="inp" id="pwOld" type="password" autocomplete="current-password"><label class="l">New password (min 6)</label><input class="inp" id="pwNew" type="password" autocomplete="new-password"><label class="l">Repeat new password</label><input class="inp" id="pwNew2" type="password" autocomplete="new-password"><div class="err" id="pwErr"></div><div class="row" style="margin-top:12px"><button class="btn ghost grow" id="pwNo" type="button">Cancel</button><button class="btn gold grow" id="pwYes" type="button">Change</button></div>');
  $('pwNo').onclick = function(){ closeSheet(w); };
  $('pwYes').onclick = function(){
    var o = $('pwOld').value, n = $('pwNew').value, n2 = $('pwNew2').value, err = $('pwErr'); err.textContent = '';
    if(n.length < 6){ err.textContent = 'New password needs at least 6 characters.'; return; } if(n !== n2){ err.textContent = 'The two new passwords do not match.'; return; }
    var u = auth.currentUser; if(!u){ err.textContent = 'Please sign in again.'; return; }
    u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, o)).then(function(){ return u.updatePassword(n); })
      .then(function(){ closeSheet(w); toast('✔ Password changed'); }).catch(function(ex){ err.textContent = /wrong|invalid-credential|invalid-login/.test(ex.code || '') ? 'Current password is wrong.' : (ex.message || 'Could not change password.'); });
  };
}
/* ---- csv / excel ---- */
function csvText(rows){ return rows.map(function(r){ return r.map(function(c){ var t = String(c == null ? '' : c); if(/^[=+\-@]/.test(t) && isNaN(Number(t))) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); }
function saveFile(name, text){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function exportCsv(){
  var showC = me.stockView === 'company' || me.stockView === 'all';
  saveFile('my-stock.csv', csvText([['Product', 'Size', 'Part', 'Category', 'Your stock'].concat(showC ? ['Company stock'] : []).concat(['Last updated'])].concat(items.map(function(it){ return [it.name, it.size || '', it.part, it.catName || '', curQty(it)].concat(showC ? [it.companyStock === undefined ? '' : (it.companyStock === null ? 'available' : it.companyStock)] : []).concat([it.updatedAt ? new Date(it.updatedAt).toLocaleString('en-IN') : '']); }))));
}
function exportHistory(){ saveFile('my-stock-history.csv', csvText([['When', 'Product', 'Part', 'From', 'To', 'Change', 'Type']].concat((hist || []).map(function(l){ return [new Date(l.ts).toLocaleString('en-IN'), l.name, l.part, l.from, l.to, (Number(l.to) || 0) - (Number(l.from) || 0), l.type || '']; })))); }
function excelMenu(){
  var w = openSheet('<h2>Excel stock sheet</h2><div class="sub">1. Download the sheet. 2. Fill the <b>Stock</b> column. 3. Upload it. Changes appear as unsaved edits — nothing is written until you tap Save.</div><div class="row" style="margin-top:14px"><button class="btn ghost grow" id="xlDown" type="button">⬇ Download sheet</button><button class="btn gold grow" id="xlUp" type="button">⬆ Upload sheet</button></div><button class="btn ghost block" id="xlNo" type="button" style="margin-top:10px">Close</button>');
  $('xlNo').onclick = function(){ closeSheet(w); };
  $('xlDown').onclick = function(){
    if(!window.XLSX){ toast('Excel library not loaded'); return; }
    var ws = XLSX.utils.json_to_sheet(items.map(function(it){ return { 'Part': it.part, 'Product': it.name, 'Size': it.size || '', 'Stock': curQty(it) }; })), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Stock'); XLSX.writeFile(wb, 'stock-sheet.xlsx');
  };
  $('xlUp').onclick = function(){ var fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.xlsx,.xls,.csv'; fi.onchange = function(){ if(fi.files[0]){ closeSheet(w); importSheet(fi.files[0]); } }; fi.click(); };
}
function hk(k){ return String(k).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function pick(row, names){ var keys = Object.keys(row); for(var i = 0; i < keys.length; i++){ if(names.indexOf(hk(keys[i])) >= 0) return row[keys[i]]; } return undefined; }
function importSheet(file){
  if(!window.XLSX){ toast('Excel library not loaded'); return; }
  var fr = new FileReader();
  fr.onload = function(){
    var rows; try{ var wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }catch(e){ toast('Could not read that file'); return; }
    var byKey = {}; items.forEach(function(it){ byKey[partKey(it.part)] = it; });
    var changed = 0, same = 0, unknown = [], invalid = 0;
    rows.forEach(function(r){
      var part = pick(r, ['part', 'partno', 'partnumber', 'itemcode', 'code', 'sku']), qty = pick(r, ['stock', 'qty', 'quantity', 'currentstock']);
      if(part === undefined || part === '') return;
      var it = byKey[partKey(part)]; if(!it){ unknown.push(String(part)); return; }
      if(qty === '' || qty === undefined) return;                       // blank cell = keep his current number
      var n = Number(qty); if(!isFinite(n) || n < 0){ invalid++; return; }
      var before = curQty(it); setQty(it.id, n); if(Math.floor(n) === before) same++; else changed++;
    });
    tab = 'stock'; sub = null; render();
    var msg = changed + ' changed'; if(same) msg += ', ' + same + ' unchanged'; if(invalid) msg += ', ' + invalid + ' bad qty'; if(unknown.length) msg += ', ' + unknown.length + ' not in your list';
    toast(msg + (changed ? ' — review, then Save' : ''));
  };
  fr.readAsArrayBuffer(file);
}
})();
