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
  var id = (user.email || '').split('@')[0];
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
  unsubs.push(db.collection('distributor_stock').where('distributorId', '==', id).onSnapshot(function(s){
    items = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }).filter(function(o){ return o.visible === true; });
    items.sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
    render();
  }, function(ex){ toast('Could not load stock: ' + (ex.code || ex.message)); }));
  unsubs.push(db.collection('distributor_requests').where('distributorId', '==', id).onSnapshot(function(s){
    reqs = s.docs.map(function(x){ return x.data(); }).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); });
    render();
  }, function(){ }));
  resetIdle();
}

/* ------------------------------------------------------------ idle logout */
function resetIdle(){ clearTimeout(idleT); if(!me && !auth.currentUser) return; idleT = setTimeout(function(){ toast('Logged out (inactive)'); auth.signOut(); }, IDLE_MS); }
['click', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, function(){ if(auth.currentUser) resetIdle(); }, { passive: true }); });

/* ----------------------------------------------------------------- render */
function lowAt(){ return Number(me && me.lowStockAt) || 10; }
function curQty(it){ return dirty[it.id] !== undefined ? dirty[it.id] : (Number(it.qty) || 0); }
function statusOf(q){ return q <= 0 ? 'oos' : (q <= lowAt() ? 'low' : 'ok'); }

function render(){
  if(!me) return;
  $('who').innerHTML = 'Signed in as <b>' + esc(me.name || me.id) + '</b>' + (me.city ? ' · ' + esc(me.city) : '');
  var active = document.activeElement, keepId = active && active.getAttribute && active.getAttribute('data-qty');
  var low = 0, oos = 0;
  items.forEach(function(it){ var s = statusOf(curQty(it)); if(s === 'low') low++; if(s === 'oos') oos++; });
  var q = query.toLowerCase();
  var list = items.filter(function(it){
    if(filter !== 'all' && statusOf(curQty(it)) !== filter) return false;
    return !q || (String(it.name) + ' ' + String(it.part) + ' ' + String(it.size || '')).toLowerCase().indexOf(q) >= 0;
  });
  var fresh = Math.max(Number(me.lastConfirmedAt) || 0, items.reduce(function(m, it){ return Math.max(m, it.updatedAt || 0); }, 0));
  var stale = items.length && (!fresh || Date.now() - fresh > 7 * 86400000);
  var h = (me.notice ? '<div class="chip" style="width:100%;background:#fff7dc;border-color:var(--gold);margin-bottom:8px">📌 ' + esc(me.notice) + '</div>' : '') +
    (items.length ? '<div class="chip" style="width:100%;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;' + (stale ? 'border-color:var(--warn);background:#fff8ea' : '') + '">' +
      '<span>Stock last confirmed: <b style="display:inline;font-size:13px;font-family:inherit">' + ago(fresh) + '</b>' + (stale ? ' ⚠' : '') + '</span>' +
      '<button class="btn gold" id="confirmBtn" style="padding:6px 12px">✔ All up to date</button></div>' : '') +
    '<div class="chips">' +
    '<div class="chip"><b>' + items.length + '</b>Products</div>' +
    '<div class="chip"><b style="color:var(--warn)">' + low + '</b>Low stock</div>' +
    '<div class="chip"><b style="color:var(--bad)">' + oos + '</b>Out of stock</div></div>' +
    '<div class="tools"><input id="qBox" type="search" placeholder="Search name, size, part no…" value="' + esc(query) + '">' +
    '<select id="fBox"><option value="all">All</option><option value="low">Low</option><option value="oos">Out</option><option value="ok">In stock</option></select>' +
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
        (r.status === 'pending' ? ' <button class="btn ghost" data-delreq="' + esc(r.id) + '" style="padding:3px 9px">✕</button>' : '') + '</div></div>';
    }).join('');
  }
  h += '<div style="height:80px"></div>';
  $('view').innerHTML = h;
  $('fBox').value = filter;
  renderSaveBar();
  if(keepId){ var el = document.querySelector('[data-qty="' + keepId + '"]'); if(el){ el.focus(); } }
}
function rowHtml(it){
  var q = curQty(it), s = statusOf(q), isD = dirty[it.id] !== undefined;
  var price = (it.showPrice && it.mrp != null) ? '<div class="rp">MRP ' + money(it.mrp) + (it.gstPct != null ? ' <span style="font-weight:400;color:var(--ink2)">+ ' + esc(it.gstPct) + '% GST</span>' : '') + '</div>' : '';
  return '<div class="rc ' + (isD ? 'dirty ' : '') + (s === 'ok' ? '' : s) + '" data-row="' + esc(it.id) + '">' +
    '<div><div class="rn">' + esc(it.name) + '</div><div class="rs">' + (it.size ? esc(it.size) + ' · ' : '') + 'Part: ' + esc(it.part) + '</div>' + price + '</div>' +
    '<div class="stk"><button data-dec="' + esc(it.id) + '">−</button><input type="number" inputmode="numeric" min="0" data-qty="' + esc(it.id) + '" value="' + q + '"><button data-inc="' + esc(it.id) + '">+</button></div>' +
    '<div class="rf"><span class="pill ' + s + '">' + (s === 'oos' ? 'Out of stock' : s === 'low' ? 'Low stock' : 'In stock') + '</span>Updated ' + ago(it.updatedAt) + '</div></div>';
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

/* ----------------------------------------------------------------- events */
$('view').addEventListener('click', function(e){
  var t = e.target, id;
  if((id = t.getAttribute('data-inc'))){ var it = items.filter(function(x){ return x.id === id; })[0]; setQty(id, curQty(it) + 1); render(); }
  else if((id = t.getAttribute('data-dec'))){ var it2 = items.filter(function(x){ return x.id === id; })[0]; setQty(id, curQty(it2) - 1); render(); }
  else if((id = t.getAttribute('data-delreq'))){ if(confirm('Cancel this request?')) db.collection('distributor_requests').doc(id).delete().catch(function(x){ toast(x.message); }); }
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
  if(id){ setQty(id, t.value); var row = document.querySelector('[data-row="' + id + '"]'); if(row) row.classList.toggle('dirty', dirty[id] !== undefined); renderSaveBar(); }
});
$('view').addEventListener('change', function(e){
  if(e.target.id === 'fBox'){ filter = e.target.value; render(); }
  if(e.target.id === 'sheetFile' && e.target.files[0]){ importSheet(e.target.files[0]); e.target.value = ''; }
});

/* ------------------------------------------------------------------- save */
function saveAll(){
  var ids = Object.keys(dirty); if(!ids.length) return;
  var btn = $('saveBtn'); if(btn) btn.disabled = true;
  var now = Date.now(), batch = db.batch();
  ids.forEach(function(id){
    var it = items.filter(function(x){ return x.id === id; })[0]; if(!it) return;
    batch.update(db.collection('distributor_stock').doc(id), { qty: dirty[id], updatedAt: now, updatedBy: me.id });
    batch.set(db.collection('distributor_log').doc(), { distributorId: me.id, productId: it.productId, name: it.name, part: it.part, from: Number(it.qty) || 0, to: dirty[id], ts: now });
  });
  batch.commit().then(function(){ dirty = {}; toast('✔ Stock saved'); render(); })
    .catch(function(ex){ toast('Could not save: ' + (ex.code === 'permission-denied' ? 'not allowed' : (ex.message || ex))); if(btn) btn.disabled = false; });
}

/* -------------------------------------------------------------------- CSV */
function exportCsv(){
  var rows = [['Product', 'Size', 'Part', 'Stock', 'Last updated']].concat(items.map(function(it){
    return [it.name, it.size || '', it.part, curQty(it), it.updatedAt ? new Date(it.updatedAt).toLocaleString('en-IN') : ''];
  }));
  var csv = rows.map(function(r){ return r.map(function(c){ return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
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
      if(qty === '' || !isFinite(n) || n < 0){ invalid++; return; }
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