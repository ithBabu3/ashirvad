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

var me = null, items = [], reqs = [], dirty = {}, unsubs = [];
var tab = 'stock', sortBy = 'name', hPeriod = '7', hist = null, histKey = '';
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
  var id = mail.split('@')[0];
  db.collection('distributors').doc(id).get().then(function(d){
    if(!d.exists || d.data().isActive === false){
      $('loginErr').textContent = d.exists ? 'Your account is inactive. Contact the admin.' : 'This login is not linked to a distributor.';
      return auth.signOut();
    }
    startSession(id);
  }).catch(function(ex){ $('loginErr').textContent = ex.message || 'Could not load your account.'; auth.signOut(); });
});

function stopListening(){ unsubs.forEach(function(u){ try{ u(); }catch(e){} }); unsubs = []; }
function startSession(id){
  $('loginWrap').classList.add('d-none'); $('appWrap').classList.remove('d-none');
  dirty = {}; items = []; reqs = [];
  unsubs.push(db.collection('distributors').doc(id).onSnapshot(function(d){
    if(!d.exists || d.data().isActive === false){ toast('Account disabled by admin'); auth.signOut(); return; }
    me = d.data(); me.id = id; render();
  }, function(){ }));
  unsubs.push(db.collection('distributor_stock').where('distributorId', '==', id).where('visible', '==', true).onSnapshot(function(s){
    items = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }).filter(function(o){ return o.visible === true; });
    items.sort(function(a, b){ return String(a.name).localeCompare(String(b.name)) || String(a.size || '').localeCompare(String(b.size || ''), undefined, { numeric: true }); });
    pruneDirty();
    render();
  }, function(ex){ toast('Could not load stock: ' + (ex.code || ex.message)); }));
  unsubs.push(db.collection('distributor_requests').where('distributorId', '==', id).onSnapshot(function(s){
    reqs = s.docs.map(function(x){ var o = x.data(); o.id = o.id || x.id; return o; }).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); });
    render();
  }, function(){ }));
  resetIdle();
}

/* ------------------------------------------------------------ idle logout */
function resetIdle(){ clearTimeout(idleT); if(!me && !auth.currentUser) return; idleT = setTimeout(function(){ toast('Logged out (inactive)'); auth.signOut(); }, IDLE_MS); }
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
  $('who').innerHTML = 'Signed in as <b>' + esc(me.name || me.id) + '</b>' + (me.city ? ' · ' + esc(me.city) : '');
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
  var units = items.reduce(function(a, it){ return a + curQty(it); }, 0);
  if(sortBy === 'low') list.sort(function(a, b){ return curQty(a) - curQty(b); });
  else if(sortBy === 'old') list.sort(function(a, b){ return (a.updatedAt || 0) - (b.updatedAt || 0); });
  else if(sortBy === 'new') list.sort(function(a, b){ return (b.updatedAt || 0) - (a.updatedAt || 0); });
  var h = tabsHtml() + (me.notice ? '<div class="chip" style="width:100%;background:#fff7dc;border-color:var(--gold);margin-bottom:8px">📌 ' + esc(me.notice) + '</div>' : '') +
    (items.length ? '<div class="chip" style="width:100%;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;' + (stale ? 'border-color:var(--warn);background:#fff8ea' : '') + '">' +
      '<span>Stock last confirmed: <b style="display:inline;font-size:13px;font-family:inherit">' + ago(fresh) + '</b>' + (stale ? ' ⚠' : '') + '</span>' +
      '<button class="btn gold" id="confirmBtn" style="padding:6px 12px">✔ All up to date</button></div>' : '') +
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
    '<button class="btn ghost" id="upBtn">⬆ Upload sheet</button><input type="file" id="sheetFile" accept=".xlsx,.xls,.csv" class="d-none">' +
    (me.canUpload ? '<button class="btn gold" id="addBtn">+ Add product</button>' : '') + '</div>';
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
  var price = (it.showPrice && it.mrp != null) ? '<div class="rp">MRP ' + money(it.mrp) + (it.gstPct != null ? ' <span style="font-weight:400;color:var(--ink2)">+ ' + esc(it.gstPct) + '% GST</span>' : '') + '</div>' : '';
  var comp = (me.stockView === 'company' && it.companyStock !== undefined) ? '<div class="rs">Company stock: <b>' + (it.companyStock === null ? 'Available' : esc(it.companyStock)) + '</b></div>' : '';
  return '<div class="rc ' + (isD ? 'dirty ' : '') + (s === 'ok' ? '' : s) + '" data-row="' + esc(it.id) + '">' +
    '<div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + 'Part: ' + esc(it.part) + '</div>' + comp + price + '</div>' +
    '<div class="stk"><button data-dec="' + esc(it.id) + '">−</button><input type="number" inputmode="numeric" min="0" data-qty="' + esc(it.id) + '" value="' + q + '"><button data-inc="' + esc(it.id) + '">+</button><button data-recv="' + esc(it.id) + '" title="Stock received" style="width:auto;padding:0 8px;font-size:12px">＋Recv</button></div>' +
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
  return '<div style="display:flex;gap:6px;margin-bottom:10px"><button class="btn ' + (tab === 'stock' ? 'gold' : 'ghost') + '" data-tab="stock">📦 My stock</button><button class="btn ' + (tab === 'history' ? 'gold' : 'ghost') + '" data-tab="history">🕘 My history</button></div>';
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

/* ------------------------------------------------------------------- save */
function saveAll(){
  var ids = Object.keys(dirty); if(!ids.length) return;
  var btn = $('saveBtn'); if(btn) btn.disabled = true;
  var now = Date.now(), batch = db.batch(), n = 0;
  ids.forEach(function(id){
    var it = items.filter(function(x){ return x.id === id; })[0]; if(!it){ delete dirty[id]; return; }
    var to = Math.max(0, Math.floor(Number(dirty[id]) || 0));
    batch.update(db.collection('distributor_stock').doc(id), { qty: to, updatedAt: now, updatedBy: me.id });
    batch.set(db.collection('distributor_log').doc(), { distributorId: me.id, productId: it.productId, name: it.name + (it.size ? ' — ' + it.size : ''), part: it.part, from: Number(it.qty) || 0, to: to, ts: now });
    n++;
  });
  if(!n){ dirty = {}; render(); return; }
  hist = null;
  batch.commit().then(function(){ dirty = {}; toast('✔ Stock saved'); render(); })
    .catch(function(ex){ toast('Could not save: ' + (ex.code === 'permission-denied' ? 'not allowed' : (ex.message || ex))); if(btn) btn.disabled = false; });
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