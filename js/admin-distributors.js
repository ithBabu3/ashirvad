/* ==========================================================================
   AshirvadConnect — Admin › Distributors tab
   Loaded after js/app.js (see CHANGES.md). Talks to Firestore directly through
   window.AC_CLOUD.db, so it does not touch the existing storage adapter.
   Uses the hooks exposed by app.js as window.__acApi.
   ========================================================================== */
(function(){
'use strict';
var CLOUD = window.AC_CLOUD, API;
var DOMAIN = (window.AC_CLOUD_OPTIONS && window.AC_CLOUD_OPTIONS.distributorEmailDomain) || 'distributor.ashirvadconnect.app';
var STALE_MS = 7 * 86400000;
var S = { dists: new Map(), stock: new Map(), reqs: new Map(), orders: new Map(), roles: new Map(), team: new Map(), staff: null, od: { st: 'active', dist: '' }, sl: { dist: '', period: '30', mode: 'dist', rows: null, key: '' }, view: 'list', started: false, q: '', allProds: false, logRows: null, ad: { dist: '', period: '30', mode: 'dist', adminToo: false, onlyAdd: false, rows: null, key: '' }, ovDist: '', exp: {}, syncing: false, syncT: null };

function noop(){}
function RO(){ return CLOUD && CLOUD.staffRole === 'viewer'; }
function isOwner(){ return !CLOUD || CLOUD.staffRole === 'owner' || !CLOUD.staffRole; }
function who(){ return (CLOUD && CLOUD.staffName) || 'admin'; }
/* a view-only login can open and filter everything but every action button is switched off (the rules block writes too) */
(function(){ if(document.getElementById('dvCss')) return; var st = document.createElement('style'); st.id = 'dvCss';
  st.textContent = '.dv-chip{background:#faf6ec;border:1px solid #e6dfcb;border-radius:10px;padding:6px 14px;font-size:11.5px;color:#666}.dv-chip b{display:block;font-size:17px;color:#222}';
  document.head.appendChild(st); })();
var RO_OK = { adCsv: 1, oCsv: 1, lRef: 1, slCsv: 1, hScan: 1 };
function lockRO(){ main().querySelectorAll('button').forEach(function(b){ if(b.hasAttribute('data-dv') || RO_OK[b.id]) return; b.disabled = true; b.title = 'View-only login'; }); }
function $$(id){ return document.getElementById(id); }
function dtime(ts){ return ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
function distName(id){ var d = S.dists.get(id); return d ? d.name : id; }
function esc(s){ return API.esc(s); }
function toast(m){ API.showToast(m); }
function db(){ return CLOUD.db; }
function FV(){ return CLOUD.firebase.firestore.FieldValue; }
function partKey(s){ return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function slug(s){ return String(s || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, ''); }
function main(){ return document.getElementById('adminMain'); }
function tabActive(){ var b = document.querySelector('.admin-tabs button.active'); return !!b && b.getAttribute('data-atab') === 'distributors'; }
function busy(){ var a = document.activeElement; return !!document.getElementById('distOv') || !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && main().contains(a)); }
function ago(ts){ if(!ts) return 'never'; var s = Math.floor((Date.now() - ts) / 1000); if(s < 3600) return Math.max(1, Math.floor(s / 60)) + ' min ago'; if(s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
function download(name, rows){
  var csv = rows.map(function(r){ return r.map(function(c){ return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function products(){ return API.getProducts(); }
/* Exact name / spec / part of an item. Catalog-card items carry ALL of their spec values (e.g. 2½" · Std class), not just the first one. */
function snapOf(p){
  var x = (API && API.describe) ? API.describe(p) : { name: p.name, size: p.size };
  return { name: String(x.name || ''), size: String(x.size || ''), part: String(p.part || '') };
}
/* The "existing" (company / warehouse) stock of a product; null = unlimited. */
function companyOf(p){ var n = p.stock; if(n === undefined || n === null || n === '') return null; n = Number(n); return isFinite(n) ? Math.max(0, n) : null; }
function sees(d){ return d && d.stockView === 'company'; }
/* Commit any number of writes in chunks of 400 (Firestore allows 500 per batch). ops: {ref, data, merge?} or {ref, del:true} */
function commitOps(ops){
  var chunks = []; for(var i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
  return chunks.reduce(function(pr, ch){
    return pr.then(function(){
      var b = db().batch();
      ch.forEach(function(o){ if(o.del) b.delete(o.ref); else b.set(o.ref, o.data, { merge: o.merge !== false }); });
      return b.commit();
    });
  }, Promise.resolve()).then(function(){ return ops.length; });
}
/* Newest sign that a distributor's stock is current: a qty change OR his "stock is up to date" tap. */
function lastFresh(d){ return Math.max(Number(d.lastConfirmedAt) || 0, stockOf(d.id).reduce(function(m, s){ return Math.max(m, s.updatedAt || 0); }, 0)); }
function isStale(d){ if(d.isActive === false) return false; var vis = stockOf(d.id).filter(function(s){ return s.visible; }); if(!vis.length) return false; var l = lastFresh(d); return !l || Date.now() - l > STALE_MS; }
function updateBadge(){
  var btn = document.querySelector('.admin-tabs button[data-atab="distributors"]'); if(!btn) return;
  var n = pendingReqs().length + newOrders() + Array.from(S.dists.values()).filter(isStale).length;
  btn.textContent = '🚚 Distributors' + (n ? ' (' + n + ')' : '');
}
function waLink(d){
  var ph = String(d.phone || '').replace(/\D/g, ''); if(ph.length === 10) ph = '91' + ph; if(!ph) return null;
  var msg = 'Hello ' + d.name + ', please update your stock on the Ashirvad distributor portal: ' + location.origin + '/distributor/';
  return 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
}
function findByPart(part){ var k = partKey(part); if(!k) return null; return products().filter(function(p){ return partKey(p.part) === k; })[0] || null; }
function productById(id){ return products().filter(function(p){ return String(p.id) === String(id); })[0]; }

/* ------------------------------------------------------------ live data */
function start(){
  if(S.started) return; S.started = true;
  [['distributors', S.dists], ['distributor_stock', S.stock], ['distributor_requests', S.reqs], ['distributor_orders', S.orders], ['roles', S.roles], ['distributor_users', S.team]].forEach(function(pair){
    db().collection(pair[0]).onSnapshot(function(snap){
      snap.docChanges().forEach(function(ch){ if(ch.type === 'removed') pair[1].delete(ch.doc.id); else { var d = ch.doc.data(); d.id = ch.doc.id; pair[1].set(ch.doc.id, d); } });
      updateBadge();
      queueSync(3000);
      if(tabActive() && !busy()) render();
    }, function(e){ console.warn('[distributors]', pair[0], e); });
  });
}
function stockOf(distId){ return Array.from(S.stock.values()).filter(function(s){ return s.distributorId === distId; }); }
function newOrders(){ return Array.from(S.orders.values()).filter(function(o){ return o.status === 'placed'; }).length; }
function pendingReqs(){ return Array.from(S.reqs.values()).filter(function(r){ return r.status === 'pending'; }); }

/* What a stock row must look like right now, given the real product and the distributor's settings.
   Returns only the fields that differ (null when the row is already correct). */
function diffRow(s){
  var p = productById(s.productId), d = S.dists.get(s.distributorId); if(!p || !d) return null;
  var sn = snapOf(p), upd = {};
  if(s.name !== sn.name) upd.name = sn.name;
  if((s.size || '') !== sn.size) upd.size = sn.size;
  if(s.part !== sn.part) upd.part = sn.part;
  if(s.showPrice){
    if(s.mrp !== (Number(p.mrp) || 0)) upd.mrp = Number(p.mrp) || 0;
    if(s.gstPct !== (Number(p.gstPct) || 0)) upd.gstPct = Number(p.gstPct) || 0;
  } else {
    if(s.mrp !== undefined) upd.mrp = FV().delete();          // price never stays on a row that must not show it
    if(s.gstPct !== undefined) upd.gstPct = FV().delete();
  }
  if(sees(d)){ var c = companyOf(p); if(s.companyStock === undefined || s.companyStock !== c) upd.companyStock = c; }
  else if(s.companyStock !== undefined) upd.companyStock = FV().delete();
  return Object.keys(upd).length ? upd : null;
}
/* Keeps every distributor's copy (name, spec, part, MRP, company stock) in step with the real catalogue.
   Runs when the tab opens, when products/cards are saved, when distributor data arrives and once a minute. */
function syncSnapshots(){
  if(!S.started || S.syncing || !API || !S.stock.size) return Promise.resolve(0);
  var ops = [];
  S.stock.forEach(function(s, id){ var u = diffRow(s); if(u) ops.push({ ref: db().collection('distributor_stock').doc(id), data: u }); });
  if(!ops.length) return Promise.resolve(0);
  S.syncing = true;
  return commitOps(ops).then(function(n){ S.syncing = false; return n; }, function(e){ S.syncing = false; console.warn('[distributors] sync failed', e); return 0; });
}
function queueSync(ms){ clearTimeout(S.syncT); S.syncT = setTimeout(syncSnapshots, ms || 2500); }

/* ---------------------------------------------------------------- render */
function render(){
  API = window.__acApi;
  var m = main();
  if(!CLOUD || !CLOUD.enabled || CLOUD.role !== 'admin'){
    m.innerHTML = '<div class="admin-empty"><div class="ae-big">Cloud mode required</div><div>The distributor portal needs Firebase. Finish SETUP.md first.</div></div>'; return;
  }
  start();
  var pend = pendingReqs().length;
  var nav = [['list', '🚚 Distributors'], ['overview', '📦 Stock overview'], ['requests', '📥 Requests' + (pend ? ' (' + pend + ')' : '')], ['orders', '📦 Orders' + (newOrders() ? ' (' + newOrders() + ')' : '')], ['sales', '🧾 Sales'], ['added', '📈 Stock added'], ['log', '🕘 Activity'], ['health', '🩺 Data check']].concat(isOwner() ? [['roles', '🔐 Roles & team']] : [])
    .map(function(v){ return '<button type="button" class="btn-admin sm ' + (S.view === v[0] ? '' : 'outline') + '" data-dv="' + v[0] + '" style="margin-right:6px">' + v[1] + '</button>'; }).join('');
  m.innerHTML = (RO() ? '<div style="background:#eef3ff;border:1px solid #c9d8ff;border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:12.5px">👁 <b>View-only login</b> — you can look at everything, but not change anything.</div>' : '') + '<div class="admin-toolbar"><h2>Distributors</h2></div><div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">' + nav + '</div><div id="dvBody"></div>';
  m.querySelectorAll('[data-dv]').forEach(function(b){ b.onclick = function(){ S.view = b.getAttribute('data-dv'); S.logRows = null; render(); }; });
  if(RO() && !S.roObs){ S.roObs = true; new MutationObserver(function(){ if(tabActive()) lockRO(); }).observe(m, { childList: true, subtree: true }); }
  if(S.view === 'roles' && !isOwner()) S.view = 'list';
  ({ list: viewList, overview: viewOverview, added: viewAdded, orders: viewOrders, sales: viewSales, roles: viewRoles, requests: viewRequests, log: viewLog, health: viewHealth })[S.view]();
}

/* ------------------------------------------------------ view: distributors */
function viewList(){
  var body = document.getElementById('dvBody');
  var h = '<div style="margin-bottom:10px"><button class="btn-admin" id="dAdd">+ Add distributor</button> ' +
    '<span class="ac-sub">Login page: <b>' + esc(location.origin) + '/distributor/</b></span></div>';
  if(!S.dists.size) h += '<div class="admin-empty"><div class="ae-big">No distributors yet</div><div>Add one, then choose which products they can see.</div></div>';
  Array.from(S.dists.values()).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); }).forEach(function(d){
    var st = stockOf(d.id), vis = st.filter(function(s){ return s.visible; });
    var last = lastFresh(d), stale = isStale(d), wa = waLink(d);
    var low = vis.filter(function(s){ return Number(s.qty) <= (Number(d.lowStockAt) || 10); }).length;
    h += '<div class="admin-card"><div class="ac-title">' + esc(d.name) + ' <span style="font-weight:400;font-size:12px">(' + esc(d.id) + ')</span> ' +
      (d.isActive === false ? '<span class="low-stock-pill" style="background:#fbdede;color:#a12626">Inactive</span>' : '<span class="low-stock-pill" style="background:#dff3e6;color:#1f7a3f">Active</span>') + '</div>' +
      '<div class="ac-sub">' + esc(d.phone || '') + (d.city ? ' · ' + esc(d.city) : '') + ' · Upload products: <b>' + (d.canUpload ? 'Allowed' : 'Off') + '</b> · New products show price: <b>' + (d.defaultShowPrice ? 'Yes' : 'No') + '</b> · He sees: <b>' + (sees(d) ? 'company stock + his own' : 'only his own stock') + '</b></div>' +
      (d.notice ? '<div class="ac-sub">📌 Notice: ' + esc(d.notice) + '</div>' : '') +
      '<div class="ac-sub">' + vis.length + ' visible product(s) · ' + low + ' low/out · stock confirmed ' + ago(last) + (stale ? ' <span class="low-stock-pill">⚠ stale</span>' : '') + '</div>' +
      '<div class="ac-actions"><button class="btn-admin sm" data-prod="' + esc(d.id) + '">Products &amp; price</button>' +
      '<button class="btn-admin sm outline" data-edit="' + esc(d.id) + '">Edit</button>' +
      (wa ? '<a class="btn-admin sm outline" target="_blank" rel="noopener" href="' + wa + '">📲 WhatsApp</a>' : '') +
      '<button class="btn-admin sm outline" data-tog="' + esc(d.id) + '">' + (d.isActive === false ? 'Activate' : 'Deactivate') + '</button>' +
      '<button class="btn-admin sm maroon" data-del="' + esc(d.id) + '">Delete</button></div></div>';
  });
  body.innerHTML = h;
  document.getElementById('dAdd').onclick = function(){ openDistForm(null); };
  body.querySelectorAll('[data-edit]').forEach(function(b){ b.onclick = function(){ openDistForm(b.getAttribute('data-edit')); }; });
  body.querySelectorAll('[data-prod]').forEach(function(b){ b.onclick = function(){ openAssign(b.getAttribute('data-prod')); }; });
  body.querySelectorAll('[data-tog]').forEach(function(b){ b.onclick = function(){
    var d = S.dists.get(b.getAttribute('data-tog')); var next = d.isActive === false;
    db().collection('distributors').doc(d.id).set({ isActive: next }, { merge: true }).then(function(){ API.logAudit('Distributor ' + (next ? 'activated' : 'deactivated'), d.name); });
  }; });
  body.querySelectorAll('[data-del]').forEach(function(b){ b.onclick = function(){
    var d = S.dists.get(b.getAttribute('data-del'));
    if(!confirm('Delete distributor "' + d.name + '" and all their stock rows?\n(Their login stops working immediately.)')) return;
    var ops = [{ ref: db().collection('distributors').doc(d.id), del: true }];
    stockOf(d.id).forEach(function(s){ ops.push({ ref: db().collection('distributor_stock').doc(s.id), del: true }); });
    Array.from(S.reqs.values()).filter(function(r){ return r.distributorId === d.id; }).forEach(function(r){ ops.push({ ref: db().collection('distributor_requests').doc(r.id), del: true }); });
    commitOps(ops).then(function(){ API.logAudit('Distributor deleted', d.name); toast('Deleted'); }).catch(function(e){ toast(e.message); });
  }; });
}

/* ---- overlay helper */
function overlay(html){
  var w = document.createElement('div'); w.id = 'distOv';
  w.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(10,19,34,.72);display:flex;align-items:center;justify-content:center;padding:12px;';
  w.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:620px;width:100%;max-height:92vh;overflow:auto;padding:18px;font-size:13.5px">' + html + '</div>';
  document.body.appendChild(w); return w;
}
function closeOv(){ var w = document.getElementById('distOv'); if(w) w.remove(); render(); }

/* ---- add / edit distributor */
function createLogin(username, password, domain){
  var app = CLOUD.firebase.initializeApp(window.AC_FIREBASE_CONFIG, 'dist-create-' + Date.now());
  var auth = app.auth();
  return auth.createUserWithEmailAndPassword(username + '@' + (domain || DOMAIN), password).then(function(c){
    var uid = c.user.uid;
    return auth.signOut().catch(noop).then(function(){ return app.delete().catch(noop); }).then(function(){ return uid; });
  }, function(err){ return app.delete().catch(noop).then(function(){ throw err; }); });
}
function openDistForm(id){
  var d = id ? S.dists.get(id) : null;
  var w = overlay('<h5>' + (d ? 'Edit distributor' : 'New distributor') + '</h5><div class="admin-form-grid">' +
    '<div class="full"><label>Business / distributor name</label><input id="fName" value="' + esc(d ? d.name : '') + '"></div>' +
    '<div><label>Login ID (no spaces)</label><input id="fUser" value="' + esc(d ? d.id : '') + '"' + (d ? ' disabled' : '') + ' placeholder="sharma-traders"></div>' +
    (d ? '<div><label>Password</label><div class="ac-sub">Reset with: <code>node setup.js distributor-password ' + esc(d.id) + ' &lt;new&gt;</code></div></div>'
       : '<div><label>Password (min 6)</label><input id="fPass" type="text"></div>') +
    '<div><label>Phone</label><input id="fPhone" value="' + esc(d ? d.phone : '') + '"></div>' +
    '<div><label>City</label><input id="fCity" value="' + esc(d ? d.city : '') + '"></div>' +
    '<div><label>Low-stock alert at (qty)</label><input id="fLow" type="number" min="0" value="' + (d && d.lowStockAt != null ? d.lowStockAt : 10) + '"></div>' +
    '<div class="full"><label>What this distributor can see about stock</label><select id="fView">' +
      '<option value="own"' + (!sees(d) ? ' selected' : '') + '>Only his own stock count</option>' +
      '<option value="company"' + (sees(d) ? ' selected' : '') + '>Company (existing) stock list + his own count</option></select>' +
      '<div class="ac-sub">“Company stock” = the Stock figure you keep in Products &amp; Pricing. It stays up to date automatically. He can never change it.</div></div>' +
    '<div class="full"><label>Notice shown at the top of his page (optional)</label><input id="fNotice" maxlength="200" value="' + esc(d ? d.notice : '') + '" placeholder="e.g. Please update stock before 6 PM daily"></div>' +
    '<div class="full"><label><input type="checkbox" id="fUpload"' + (d && d.canUpload ? ' checked' : '') + '> Allow this distributor to add (request) new products</label></div>' +
    '<div class="full"><label><input type="checkbox" id="fPrice"' + (d && d.defaultShowPrice ? ' checked' : '') + '> Show price by default for newly assigned products</label></div>' +
    '</div><div id="fErr" style="color:#a12626;margin-top:8px"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="fCancel" style="flex:1">Cancel</button><button class="btn-admin" id="fSave" style="flex:1">Save</button></div>');
  w.querySelector('#fCancel').onclick = closeOv;
  w.querySelector('#fSave').onclick = function(){
    var name = w.querySelector('#fName').value.trim(), err = w.querySelector('#fErr'), btn = w.querySelector('#fSave');
    var fields = { name: name, phone: w.querySelector('#fPhone').value.trim(), city: w.querySelector('#fCity').value.trim(),
      lowStockAt: Number(w.querySelector('#fLow').value) || 10, notice: w.querySelector('#fNotice').value.trim(), canUpload: w.querySelector('#fUpload').checked, defaultShowPrice: w.querySelector('#fPrice').checked,
      stockView: w.querySelector('#fView').value === 'company' ? 'company' : 'own' };
    if(!name){ err.textContent = 'Name is required.'; return; }
    btn.disabled = true;
    if(d){
      db().collection('distributors').doc(d.id).set(fields, { merge: true }).then(function(){ API.logAudit('Distributor updated', name); closeOv(); queueSync(800); }).catch(function(e){ err.textContent = e.message; btn.disabled = false; });
      return;
    }
    var user = slug(w.querySelector('#fUser').value), pass = w.querySelector('#fPass').value;
    if(!user || user.length < 3){ err.textContent = 'Login ID must be at least 3 characters (letters, numbers, . _ -).'; btn.disabled = false; return; }
    if(S.dists.has(user)){ err.textContent = 'That Login ID already exists.'; btn.disabled = false; return; }
    if(pass.length < 6){ err.textContent = 'Password must be at least 6 characters.'; btn.disabled = false; return; }
    createLogin(user, pass).then(function(uid){
      fields.id = user; fields.uid = uid; fields.isActive = true; fields.createdAt = Date.now();
      return db().collection('distributors').doc(user).set(fields);
    }).then(function(){ API.logAudit('Distributor created', name + ' (' + user + ')'); toast('Distributor created'); closeOv(); })
      .catch(function(e){ err.textContent = e.code === 'auth/email-already-in-use' ? 'A login with this ID already exists — choose another ID.' : (e.message || 'Failed'); btn.disabled = false; });
  };
}

/* ---- which products a distributor sees, with / without price, and his opening stock */
function openAssign(distId){
  var d = S.dists.get(distId); if(!d) return;
  // every item with its EXACT description; catalog-card items are grouped under their card
  var list = products().filter(function(p){ return p.id !== undefined && p.id !== null; }).map(function(p){ return { p: p, x: API.describe(p) }; });
  list.sort(function(a, b){
    var ga = a.x.gid ? 1 : 0, gb = b.x.gid ? 1 : 0; if(ga !== gb) return ga - gb;
    var c = (a.x.cat + '|' + a.x.gtitle).localeCompare(b.x.cat + '|' + b.x.gtitle); if(c) return c;
    return String(a.x.gid ? a.x.size : a.x.name).localeCompare(String(b.x.gid ? b.x.size : b.x.name), undefined, { numeric: true });
  });
  var cur = {};   // productId -> { show, price, qty ('' = leave as is), had, oldQty }
  list.forEach(function(r){ var s = S.stock.get(distId + '__' + r.p.id);
    cur[r.p.id] = { show: !!(s && s.visible), price: !!(s && s.showPrice), had: !!s, oldQty: s ? (Number(s.qty) || 0) : 0, qty: s ? String(Number(s.qty) || 0) : '' }; });
  var w = overlay('<h5>' + esc(d.name) + ' — products &amp; price</h5>' +
    '<div class="ac-sub mb-2">Tick <b>Show</b> to put an item on this distributor\'s page (tick a card\'s box to show all its items). Tick <b>Price</b> to let him see the MRP (never discounts or dealer prices). <b>His stock</b> is his current quantity — type an opening figure if you already know it; he can change it later. Unticking Show hides an item but keeps his number.</div>' +
    '<input id="aQ" placeholder="Search name / spec / part / category…" style="width:100%;margin-bottom:8px">' +
    '<div style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn-admin sm outline" id="aShowAll">Show all listed</button><button class="btn-admin sm outline" id="aHideAll">Hide all listed</button><button class="btn-admin sm outline" id="aPriceOn">Price on (listed)</button><button class="btn-admin sm outline" id="aPriceOff">Price off (listed)</button></div>' +
    '<div id="aList" style="max-height:48vh;overflow:auto;border:1px solid #eee;border-radius:8px"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="aCancel" style="flex:1">Cancel</button><button class="btn-admin" id="aSave" style="flex:1">Save</button></div>');
  function listed(){
    var q = w.querySelector('#aQ').value.toLowerCase().trim();
    return list.filter(function(r){ return !q || (r.x.name + ' ' + r.x.size + ' ' + r.p.part + ' ' + r.x.cat).toLowerCase().indexOf(q) >= 0; });
  }
  function paint(){
    var box = w.querySelector('#aList'), top = box.scrollTop, rows = listed(), html = '', lastG = null;
    rows.forEach(function(r){
      var p = r.p, c = cur[p.id], key = r.x.gid ? 'c' + r.x.gid : 'reg';
      if(key !== lastG){
        lastG = key;
        var inG = rows.filter(function(z){ return (z.x.gid ? 'c' + z.x.gid : 'reg') === key; });
        var all = inG.every(function(z){ return cur[z.p.id].show; });
        html += '<tr style="background:#faf6ec"><td colspan="4" style="padding:6px"><label style="margin:0;font-weight:600"><input type="checkbox" data-g="' + key + '"' + (all ? ' checked' : '') + '> ' +
          (r.x.gid ? '📇 ' + esc(r.x.gtitle) + ' <span style="font-weight:400;color:#777;font-size:11px">· ' + esc(r.x.cat) + ' · ' + inG.length + ' item(s)</span>' : 'Regular products') + '</label></td></tr>';
      }
      var own = companyOf(p);
      html += '<tr style="border-top:1px solid #f0ead8"><td style="padding:6px">' + esc(r.x.gid ? (r.x.size || r.x.name) : r.x.name) +
        '<div style="font-size:11px;color:#777">' + (r.x.gid ? '' : (r.x.size ? esc(r.x.size) + ' · ' : '')) + esc(p.part) + (Number(p.mrp) ? ' · MRP ' + p.mrp : '') + ' · company stock ' + (own === null ? '∞' : own) + (p.active === false && !p.isCatalogVariant ? ' · <b>inactive</b>' : '') + '</div></td>' +
        '<td style="text-align:center"><input type="checkbox" data-s="' + p.id + '"' + (c.show ? ' checked' : '') + '></td>' +
        '<td style="text-align:center"><input type="checkbox" data-p="' + p.id + '"' + (c.price ? ' checked' : '') + (c.show ? '' : ' disabled') + '></td>' +
        '<td style="text-align:center"><input type="number" min="0" data-q="' + p.id + '" value="' + esc(c.qty) + '" placeholder="0" style="width:70px;padding:3px 5px"' + (c.show ? '' : ' disabled') + '></td></tr>';
    });
    box.innerHTML = '<table style="width:100%;font-size:12.5px"><thead><tr><th style="text-align:left;padding:6px">Item</th><th>Show</th><th>Price</th><th>His stock</th></tr></thead><tbody>' +
      (html || '<tr><td colspan="4" style="padding:14px;color:#777">Nothing matches.</td></tr>') + '</tbody></table>';
    box.scrollTop = top;
  }
  paint();
  w.querySelector('#aQ').oninput = paint;
  function setShow(id, on){ var c = cur[id]; c.show = on; if(on && !c.had && d.defaultShowPrice) c.price = true; if(!on) c.price = false; }
  w.querySelector('#aList').onchange = function(e){
    var t = e.target, sId = t.getAttribute('data-s'), pId = t.getAttribute('data-p'), gKey = t.getAttribute('data-g');
    if(sId){ setShow(sId, t.checked); paint(); }
    else if(pId){ cur[pId].price = t.checked; }
    else if(gKey){ listed().filter(function(r){ return (r.x.gid ? 'c' + r.x.gid : 'reg') === gKey; }).forEach(function(r){ setShow(r.p.id, t.checked); }); paint(); }
  };
  w.querySelector('#aList').oninput = function(e){ var q = e.target.getAttribute('data-q'); if(q) cur[q].qty = e.target.value; };
  function bulk(key, val){ listed().forEach(function(r){ var c = cur[r.p.id]; if(key === 'show') setShow(r.p.id, val); else { c.price = val; if(val) c.show = true; } }); paint(); }
  w.querySelector('#aShowAll').onclick = function(){ bulk('show', true); };
  w.querySelector('#aHideAll').onclick = function(){ bulk('show', false); };
  w.querySelector('#aPriceOn').onclick = function(){ bulk('price', true); };
  w.querySelector('#aPriceOff').onclick = function(){ bulk('price', false); };
  w.querySelector('#aCancel').onclick = closeOv;
  w.querySelector('#aSave').onclick = function(){
    var ops = [], n = 0, now = Date.now();
    list.forEach(function(r){
      var p = r.p, c = cur[p.id], id = distId + '__' + p.id, old = S.stock.get(id), sn = snapOf(p);
      if(!c.show && !old) return;                                  // never assigned, still not shown
      var wantQty = (c.show && String(c.qty).trim() !== '') ? Math.max(0, Math.floor(Number(c.qty) || 0)) : null;
      var qtyChanged = wantQty !== null && (!old || (Number(old.qty) || 0) !== wantQty);
      var showPrice = c.show && c.price;
      if(old && !!old.visible === c.show && !!old.showPrice === showPrice && !qtyChanged) return;   // unchanged
      var row = { id: id, distributorId: distId, productId: p.id, name: sn.name, size: sn.size, part: sn.part, visible: c.show, showPrice: showPrice };
      if(!old){ row.qty = wantQty === null ? 0 : wantQty; row.updatedAt = wantQty === null ? 0 : now; row.updatedBy = 'admin'; }
      else if(qtyChanged){ row.qty = wantQty; row.updatedAt = now; row.updatedBy = 'admin'; }
      if(showPrice){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; }
      else { row.mrp = FV().delete(); row.gstPct = FV().delete(); }       // price never leaves the server when hidden
      if(sees(d)) row.companyStock = companyOf(p); else row.companyStock = FV().delete();
      ops.push({ ref: db().collection('distributor_stock').doc(id), data: row });
      if(qtyChanged) ops.push({ ref: db().collection('distributor_log').doc(), merge: false, data: { distributorId: distId, productId: p.id, name: sn.name + (sn.size ? ' — ' + sn.size : ''), part: sn.part, from: old ? (Number(old.qty) || 0) : 0, to: wantQty, ts: now, by: 'admin' } });
      n++;
    });
    var btn = w.querySelector('#aSave'); btn.disabled = true;
    (ops.length ? commitOps(ops) : Promise.resolve()).then(function(){ if(n) API.logAudit('Distributor products updated', d.name + ': ' + n + ' change(s)'); toast(n ? 'Saved (' + n + ' change' + (n > 1 ? 's' : '') + ')' : 'No changes'); closeOv(); })
      .catch(function(e){ btn.disabled = false; toast('Failed: ' + e.message); });
  };
}

/* ------------------------------------------------------ view: stock overview */
function viewOverview(){
  var body = document.getElementById('dvBody');
  var byProd = {};
  // only rows the distributor can actually see, belonging to distributors that still exist
  S.stock.forEach(function(s){ if(s.visible && S.dists.has(s.distributorId) && (!S.ovDist || s.distributorId === S.ovDist)) (byProd[s.productId] = byProd[s.productId] || []).push(s); });
  var ids = {}; Object.keys(byProd).forEach(function(k){ ids[k] = true; });
  if(S.allProds) products().forEach(function(p){ if(p.id !== undefined && p.id !== null) ids[p.id] = true; });
  var q = S.q.toLowerCase();
  var rows = Object.keys(ids).map(function(pid){
    var p = productById(pid), rs = byProd[pid] || [], x = p ? snapOf(p) : { name: (rs[0] || {}).name, size: (rs[0] || {}).size, part: (rs[0] || {}).part };
    var dist = rs.reduce(function(a, s){ return a + (Number(s.qty) || 0); }, 0);
    return { pid: pid, name: x.name, size: x.size, part: x.part, own: p ? companyOf(p) : null, gone: !p, dist: dist, rs: rs };
  }).filter(function(r){ return !q || (r.name + ' ' + r.size + ' ' + r.part).toLowerCase().indexOf(q) >= 0; })
    .sort(function(a, b){ return String(a.name).localeCompare(String(b.name)) || String(a.size).localeCompare(String(b.size), undefined, { numeric: true }); });
  var h = '<div style="display:flex;gap:8px;margin-bottom:6px"><select id="oDist"><option value="">All distributors</option>' + Array.from(S.dists.values()).sort(function(x, y){ return String(x.name).localeCompare(String(y.name)); }).map(function(d){ return '<option value="' + esc(d.id) + '"' + (S.ovDist === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select><input id="oQ" placeholder="Search…" value="' + esc(S.q) + '" style="flex:1"><button class="btn-admin sm outline" id="oCsv">⬇ CSV</button></div>' +
    '<div style="margin-bottom:8px"><label style="font-size:12.5px"><input type="checkbox" id="oAll"' + (S.allProds ? ' checked' : '') + '> Also list products no distributor has</label></div>' +
    '<div class="ac-sub mb-2">One stock row per distributor and product, so nothing duplicates — totals simply add up. “Company” is your own Stock figure from Products &amp; Pricing (∞ = unlimited). Only items currently shown to a distributor are counted.</div>';
  if(!rows.length) h += '<div class="admin-empty"><div class="ae-big">Nothing assigned yet</div></div>';
  else h += '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Product</th><th class="text-end">Company</th><th>Distributors</th><th class="text-end">Distributor total</th><th class="text-end">Grand total</th></tr></thead><tbody>' +
    rows.map(function(r){
      return '<tr><td>' + esc(r.name) + (r.size ? ' <span style="color:#555">— ' + esc(r.size) + '</span>' : '') + '<div style="font-size:11px;color:#777">' + esc(r.part) + (r.gone ? ' · <b>product deleted</b>' : '') + '</div></td><td class="text-end">' + (r.own === null ? '∞' : r.own) + '</td><td>' +
        (r.rs.map(function(s){ var d = S.dists.get(s.distributorId); return esc(d ? d.name : s.distributorId) + ': <b>' + (Number(s.qty) || 0) + '</b>'; }).join('<br>') || '<span style="color:#999">—</span>') +
        '</td><td class="text-end"><b>' + r.dist + '</b></td><td class="text-end"><b>' + (r.own === null ? '∞' : r.own + r.dist) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  body.innerHTML = h;
  document.getElementById('oQ').oninput = function(e){ S.q = e.target.value; var p = e.target.selectionStart; viewOverview(); var b = document.getElementById('oQ'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} };
  document.getElementById('oDist').onchange = function(e){ S.ovDist = e.target.value; viewOverview(); };
  document.getElementById('oAll').onchange = function(e){ S.allProds = e.target.checked; viewOverview(); };
  document.getElementById('oCsv').onclick = function(){
    var out = [['Product', 'Spec / size', 'Part', 'Company stock', 'Distributor', 'Qty', 'Last updated']];
    rows.forEach(function(r){
      var own = r.own === null ? 'unlimited' : r.own;
      if(!r.rs.length) out.push([r.name, r.size, r.part, own, '', '', '']);
      r.rs.forEach(function(s){ var d = S.dists.get(s.distributorId); out.push([r.name, r.size, r.part, own, d ? d.name : s.distributorId, s.qty, s.updatedAt ? new Date(s.updatedAt).toLocaleString('en-IN') : '']); });
    });
    download('distributor-stock-' + new Date().toISOString().slice(0, 10) + '.csv', out);
  };
}

/* ---------------------------------------------------------- view: requests */
function viewRequests(){
  var body = document.getElementById('dvBody');
  var all = Array.from(S.reqs.values()).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); });
  if(!all.length){ body.innerHTML = '<div class="admin-empty"><div class="ae-big">No product requests</div></div>'; return; }
  body.innerHTML = all.map(function(r){
    var d = S.dists.get(r.distributorId), match = findByPart(r.part);
    var pend = r.status === 'pending';
    return '<div class="admin-card"><div class="ac-title">' + esc(r.name) + ' <span style="font-weight:400;font-size:12px">· ' + esc(r.part) + '</span></div>' +
      '<div class="ac-sub">From <b>' + esc(d ? d.name : r.distributorId) + '</b> · stock ' + esc(r.qty) + (Number(r.mrp) ? ' · MRP ' + esc(r.mrp) : '') + (r.size ? ' · ' + esc(r.size) : '') + ' · ' + ago(r.createdAt) + '</div>' +
      (r.note ? '<div class="ac-sub">Note: ' + esc(r.note) + '</div>' : '') +
      '<div class="ac-sub">' + (pend ? (match ? '✔ Matches existing product <b>' + esc(match.name) + '</b> — will be linked, no duplicate.' : '🆕 New product — will be created as <b>inactive</b> for dealers until you set price &amp; activate it.') : 'Status: <b>' + esc(r.status) + '</b>' + (r.adminNote ? ' — ' + esc(r.adminNote) : '')) + '</div>' +
      (pend ? '<div class="ac-actions"><button class="btn-admin sm" data-ok="' + esc(r.id) + '">Approve</button><button class="btn-admin sm maroon" data-no="' + esc(r.id) + '">Reject</button></div>' : '') + '</div>';
  }).join('');
  body.querySelectorAll('[data-ok]').forEach(function(b){ b.onclick = function(){ approve(S.reqs.get(b.getAttribute('data-ok'))); }; });
  body.querySelectorAll('[data-no]').forEach(function(b){ b.onclick = function(){
    var r = S.reqs.get(b.getAttribute('data-no')), why = prompt('Reason (shown to the distributor, optional):', '');
    if(why === null) return;
    db().collection('distributor_requests').doc(r.id).set({ status: 'rejected', adminNote: why }, { merge: true }).then(function(){ API.logAudit('Product request rejected', r.name); });
  }; });
}
function approve(r){
  if(!r || r.status !== 'pending') return;
  var d = S.dists.get(r.distributorId); if(!d){ toast('Distributor no longer exists'); return; }
  var p = findByPart(r.part), created = false;
  if(!p){
    var list = products();
    p = { id: API.nextProductId(), cat: 'column', name: r.name, size: r.size || '', part: r.part, mrp: Number(r.mrp) || 0, discountPct: 0, gstPct: 18, active: false, stock: 0 };
    list.push(p); API.saveProducts(list); created = true;
  }
  var sn = snapOf(p), id = r.distributorId + '__' + p.id, old = S.stock.get(id);
  var show = old ? !!old.showPrice : !!d.defaultShowPrice;
  var row = { id: id, distributorId: d.id, productId: p.id, name: sn.name, size: sn.size, part: sn.part, visible: true, showPrice: show, qty: Number(r.qty) || 0, updatedAt: Date.now(), updatedBy: d.id };
  if(show){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; } else { row.mrp = FV().delete(); row.gstPct = FV().delete(); }
  if(sees(d)) row.companyStock = companyOf(p); else row.companyStock = FV().delete();
  var batch = db().batch();
  batch.set(db().collection('distributor_stock').doc(id), row, { merge: true });      // same distributor + same product => same doc => updated, never duplicated
  batch.set(db().collection('distributor_requests').doc(r.id), { status: 'approved', productId: p.id, adminNote: created ? 'New product created' : 'Linked to existing product' }, { merge: true });
  batch.commit().then(function(){ API.logAudit('Product request approved', r.name + ' → ' + d.name + (created ? ' (new product)' : ' (existing)')); toast(created ? 'Approved — new product created (inactive, set price in Products)' : 'Approved — linked to existing product'); })
    .catch(function(e){ toast('Failed: ' + e.message); });
}



/* ================================================================ view: purchase orders from distributors */
var ST_LABEL = { placed: 'Placed', accepted: 'Accepted', dispatched: 'Dispatched', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled' };
var ST_COL = { placed: '#2b4f9e', accepted: '#8a5a00', dispatched: '#6a3fa0', delivered: '#1e7b46', rejected: '#b23b3b', cancelled: '#777777' };
function pill(st){ var c = ST_COL[st] || '#777'; return '<span style="background:' + c + '1f;color:' + c + ';border-radius:99px;padding:1px 9px;font-size:11px;font-weight:600">' + esc(ST_LABEL[st] || st) + '</span>'; }
var NEXT = { placed: [['accept', 'Accept'], ['reject', 'Reject']], accepted: [['dispatch', 'Dispatch'], ['reject', 'Reject']], dispatched: [['deliver', 'Mark delivered']] };
function viewOrders(){
  var body = $$('dvBody'), O = S.od;
  var rows = Array.from(S.orders.values()).filter(function(o){
    if(O.dist && o.distributorId !== O.dist) return false;
    return O.st === 'all' ? true : O.st === 'active' ? ['placed', 'accepted', 'dispatched'].indexOf(o.status) >= 0 : o.status === O.st;
  }).sort(function(x, y){ return (y.createdAt || 0) - (x.createdAt || 0); });
  var sel = function(id, opts, v){ return '<select id="' + id + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var h = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
    sel('orSt', [['active', 'Open orders'], ['placed', 'New (placed)'], ['accepted', 'Accepted'], ['dispatched', 'Dispatched'], ['delivered', 'Delivered'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled'], ['all', 'All']], O.st) +
    sel('orDist', [['', 'All distributors']].concat(Array.from(S.dists.values()).map(function(d){ return [d.id, esc(d.name)]; })), O.dist) + '</div>';
  h += !rows.length ? '<div class="admin-empty"><div class="ae-big">No orders here</div></div>' : rows.map(function(o){
    var acts = (!RO() && NEXT[o.status]) ? NEXT[o.status].map(function(x){ return '<button class="btn-admin sm' + (x[0] === 'reject' ? ' outline' : '') + '" data-oa="' + x[0] + '" data-oid="' + esc(o.id) + '" style="margin-right:6px">' + x[1] + '</button>'; }).join('') : '';
    return '<div style="border:1px solid #e6dfcb;border-radius:10px;padding:10px 12px;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + esc(o.no) + '</b><span>' + pill(o.status) + '</span></div>' +
      '<div class="ac-sub">' + esc(distName(o.distributorId)) + ' · ' + dtime(o.createdAt) + ' · ' + (Number(o.units) || 0) + ' units' + (o.by && o.by !== o.distributorId ? ' · by ' + esc(o.by) : '') + '</div>' +
      '<table style="width:100%;font-size:12.5px;margin:6px 0"><tbody>' + (o.lines || []).map(function(l){ return '<tr><td>' + esc(l.name) + (l.size ? ' <span style="color:#666">— ' + esc(l.size) + '</span>' : '') + ' <span style="color:#888;font-size:11px">' + esc(l.part) + '</span></td><td class="text-end"><b>' + (Number(l.qty) || 0) + '</b></td></tr>'; }).join('') + '</tbody></table>' +
      (o.note ? '<div class="ac-sub">📝 ' + esc(o.note) + '</div>' : '') + (o.expected ? '<div class="ac-sub">Expected: <b>' + esc(o.expected) + '</b></div>' : '') +
      '<div style="font-size:11.5px;color:#666;margin:4px 0">' + (o.history || []).map(function(x){ return esc(ST_LABEL[x.s] || x.s) + ' · ' + dtime(x.ts) + (x.by ? ' · ' + esc(x.by) : '') + (x.note ? ' — ' + esc(x.note) : ''); }).join('<br>') + '</div>' + acts + '</div>';
  }).join('');
  body.innerHTML = h;
  $$('orSt').onchange = function(e){ O.st = e.target.value; viewOrders(); };
  $$('orDist').onchange = function(e){ O.dist = e.target.value; viewOrders(); };
  body.querySelectorAll('[data-oa]').forEach(function(b){ b.onclick = function(){ orderAction(S.orders.get(b.getAttribute('data-oid')), b.getAttribute('data-oa')); }; });
}
function orderAction(o, act){
  if(!o) return;
  var to = { accept: 'accepted', reject: 'rejected', dispatch: 'dispatched', deliver: 'delivered' }[act];
  var w = overlay('<h5>' + esc(ST_LABEL[to]) + ' — ' + esc(o.no) + '</h5><div class="ac-sub mb-2">' + esc(distName(o.distributorId)) + ' · ' + (Number(o.units) || 0) + ' units</div>' +
    (act === 'dispatch' ? '<label>Expected delivery date</label><input type="date" id="oExp" style="width:100%;margin-bottom:8px">' : '') +
    (act === 'deliver' ? '<label style="display:block;margin:6px 0"><input type="checkbox" id="oAdd"' + (o.stockAdded ? ' disabled' : ' checked') + '> Add these quantities to the distributor\'s stock' + (o.stockAdded ? ' (already added)' : '') + '</label>' : '') +
    '<label>Note for the distributor (optional)</label><textarea id="oNote" rows="2" style="width:100%"></textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="oNo" style="flex:1">Cancel</button><button class="btn-admin" id="oYes" style="flex:1">Confirm</button></div>');
  $$('oNo').onclick = closeOv;
  $$('oYes').onclick = function(){
    var now = Date.now(), note = $$('oNote').value.trim(), exp = $$('oExp') ? $$('oExp').value : '';
    var upd = { status: to, updatedAt: now, history: FV().arrayUnion({ s: to, ts: now, by: who(), note: note }) };
    if(exp) upd.expected = exp; if(note) upd.adminNote = note;
    var ops = [], miss = 0;
    if(act === 'deliver' && $$('oAdd') && $$('oAdd').checked && !o.stockAdded){
      (o.lines || []).forEach(function(l){
        var row = S.stock.get(o.distributorId + '__' + l.productId), q = Number(l.qty) || 0;
        if(!row || q <= 0){ miss++; return; }
        var from = Number(row.qty) || 0;
        ops.push({ ref: db().collection('distributor_stock').doc(row.id), data: { qty: FV().increment(q), updatedAt: now, updatedBy: 'admin' } });
        ops.push({ ref: db().collection('distributor_log').doc(), merge: false, data: { distributorId: o.distributorId, productId: l.productId, name: l.name + (l.size ? ' — ' + l.size : ''), part: l.part, from: from, to: from + q, ts: now, by: 'admin', type: 'order', ref: o.no } });
      });
      upd.stockAdded = true;
    }
    ops.unshift({ ref: db().collection('distributor_orders').doc(o.id), data: upd });
    $$('oYes').disabled = true;
    commitOps(ops).then(function(){ API.logAudit('Distributor order ' + to, o.no + ' · ' + distName(o.distributorId)); toast(ST_LABEL[to] + (miss ? ' (' + miss + ' item(s) not on his list — stock not added for those)' : '')); closeOv(); })
      .catch(function(e){ $$('oYes').disabled = false; toast('Failed: ' + e.message); });
  };
}

/* ================================================================ view: sales entered by distributors */
function viewSales(){
  var A = S.sl, body = $$('dvBody');
  if(A.rows === null || A.key !== A.period){
    body.innerHTML = '<div class="ac-sub">Loading…</div>';
    var since = periodStart(A.period), q = db().collection('distributor_sales');
    if(since) q = q.where('ts', '>=', since);
    q.orderBy('ts', 'desc').limit(3000).get().then(function(s){ A.rows = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }); A.key = A.period; if(tabActive() && S.view === 'sales') viewSales(); })
      .catch(function(e){ body.innerHTML = '<div class="ac-sub">Could not load: ' + esc(e.message) + '</div>'; });
    return;
  }
  var by = {}, tot = { n: 0, u: 0, a: 0, v: 0 }, pm = {};
  A.rows.forEach(function(s){
    if(A.dist && s.distributorId !== A.dist) return;
    var g = by[s.distributorId] = by[s.distributorId] || { id: s.distributorId, n: 0, u: 0, a: 0, v: 0, last: 0 };
    if(s.status === 'void'){ g.v++; tot.v++; return; }
    g.n++; g.u += Number(s.units) || 0; g.a += Number(s.amount) || 0; g.last = Math.max(g.last, s.ts || 0);
    tot.n++; tot.u += Number(s.units) || 0; tot.a += Number(s.amount) || 0;
    (s.lines || []).forEach(function(l){ var k = String(l.part || l.name), p = pm[k] = pm[k] || { name: l.name, size: l.size, part: l.part, u: 0, a: 0 }; p.u += Number(l.qty) || 0; p.a += (Number(l.qty) || 0) * (Number(l.rate) || 0); });
  });
  var list = Object.keys(by).map(function(k){ return by[k]; }).sort(function(x, y){ return y.u - x.u; });
  var sel = function(id, opts, v){ return '<select id="' + id + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var h = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' + sel('slDist', [['', 'All distributors']].concat(Array.from(S.dists.values()).map(function(d){ return [d.id, esc(d.name)]; })), A.dist) +
    sel('slPer', [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']], A.period) + '<button class="btn-admin sm outline" id="slCsv">⬇ CSV</button></div>' +
    '<div style="margin-bottom:8px"><label style="font-size:12.5px"><input type="checkbox" id="slMode"' + (A.mode === 'prod' ? ' checked' : '') + '> Show by product</label></div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><div class="dv-chip"><b>' + tot.n + '</b>sales</div><div class="dv-chip"><b>' + tot.u + '</b>units sold</div><div class="dv-chip"><b>₹' + tot.a.toLocaleString('en-IN') + '</b>value (where rate entered)</div><div class="dv-chip"><b>' + tot.v + '</b>voided</div></div>';
  if(A.mode === 'prod'){
    var pl = Object.keys(pm).map(function(k){ return pm[k]; }).sort(function(x, y){ return y.u - x.u; });
    h += !pl.length ? '<div class="admin-empty"><div class="ae-big">No sales in this period</div></div>' : '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Product</th><th class="text-end">Units sold</th><th class="text-end">Value</th></tr></thead><tbody>' +
      pl.map(function(p){ return '<tr><td>' + esc(p.name) + (p.size ? ' — ' + esc(p.size) : '') + '<div style="font-size:11px;color:#777">' + esc(p.part) + '</div></td><td class="text-end"><b>' + p.u + '</b></td><td class="text-end">' + (p.a ? '₹' + p.a.toLocaleString('en-IN') : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  } else {
    h += !list.length ? '<div class="admin-empty"><div class="ae-big">No sales in this period</div></div>' : '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Distributor</th><th class="text-end">Sales</th><th class="text-end">Units</th><th class="text-end">Value</th><th class="text-end">Voided</th><th>Last sale</th></tr></thead><tbody>' +
      list.map(function(g){ return '<tr><td><b>' + esc(distName(g.id)) + '</b></td><td class="text-end">' + g.n + '</td><td class="text-end"><b>' + g.u + '</b></td><td class="text-end">' + (g.a ? '₹' + g.a.toLocaleString('en-IN') : '—') + '</td><td class="text-end">' + g.v + '</td><td>' + (g.last ? ago(g.last) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  body.innerHTML = h;
  $$('slDist').onchange = function(e){ A.dist = e.target.value; viewSales(); };
  $$('slPer').onchange = function(e){ A.period = e.target.value; A.rows = null; viewSales(); };
  $$('slMode').onchange = function(e){ A.mode = e.target.checked ? 'prod' : 'dist'; viewSales(); };
  $$('slCsv').onclick = function(){
    var out = [['When', 'Distributor', 'Customer', 'Product', 'Part', 'Qty', 'Rate', 'Status', 'Entered by']];
    A.rows.forEach(function(s){ if(A.dist && s.distributorId !== A.dist) return; (s.lines || []).forEach(function(l){ out.push([new Date(s.ts).toLocaleString('en-IN'), distName(s.distributorId), s.customer || '', l.name + (l.size ? ' — ' + l.size : ''), l.part, l.qty, l.rate || '', s.status, s.by || '']); }); });
    download('distributor-sales-' + A.period + '.csv', out);
  };
}

/* ================================================================ view: roles & team (owner only) */
var PERMS = [
  { k: 'stock', label: 'Stock list', opts: [['view', 'View only'], ['edit', 'View + update quantities']] },
  { k: 'sales', label: 'Sales entry', opts: [['none', 'No access'], ['add', 'Record sales'], ['manage', 'Record + void sales']] },
  { k: 'orders', label: 'Purchase orders', opts: [['none', 'No access'], ['view', 'See orders'], ['place', 'Place + cancel orders']] },
  { k: 'history', label: 'Stock history', opts: [['none', 'No access'], ['view', 'See history']] },
  { k: 'price', label: 'See MRP', opts: [['none', 'No'], ['view', 'Yes']] },
  { k: 'requests', label: 'Request new products', opts: [['none', 'No'], ['add', 'Yes']] }
];
var DEFAULT_ROLES = [
  { name: 'Manager', perms: { stock: 'edit', sales: 'manage', orders: 'place', history: 'view', price: 'view', requests: 'add' } },
  { name: 'Storekeeper', perms: { stock: 'edit', sales: 'none', orders: 'place', history: 'view', price: 'none', requests: 'none' } },
  { name: 'Salesman', perms: { stock: 'view', sales: 'add', orders: 'none', history: 'none', price: 'view', requests: 'none' } },
  { name: 'Viewer', perms: { stock: 'view', sales: 'none', orders: 'view', history: 'view', price: 'none', requests: 'none' } }
];
function roleSummary(p){ p = p || {}; return PERMS.map(function(d){ var o = d.opts.filter(function(x){ return x[0] === (p[d.k] || d.opts[0][0]); })[0]; return d.label + ': ' + (o ? o[1] : '—'); }).join(' · '); }
function staffDomain(){ return (CLOUD.options && CLOUD.options.adminEmailDomain) || 'admin.ashirvadconnect.app'; }
function viewRoles(){
  var body = $$('dvBody');
  if(S.staff === null){
    body.innerHTML = '<div class="ac-sub">Loading…</div>';
    db().collection('admins').get().then(function(s){ S.staff = s.docs.map(function(x){ var o = x.data(); o.uid = x.id; return o; }); if(tabActive() && S.view === 'roles') viewRoles(); })
      .catch(function(e){ body.innerHTML = '<div class="ac-sub">Could not load: ' + esc(e.message) + '</div>'; });
    return;
  }
  var roleOpts = function(sel){ return Array.from(S.roles.values()).sort(function(x, y){ return String(x.name).localeCompare(String(y.name)); }).map(function(r){ return '<option value="' + esc(r.id) + '"' + (sel === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join(''); };
  var h = '<h6 style="margin:4px 0">Staff logins (admin console)</h6><div class="ac-sub mb-2"><b>Manager</b> can change everything except this page. <b>Viewer</b> can look at everything but cannot change or save anything. The original admin is the <b>Owner</b>.</div>' +
    '<button class="btn-admin sm" id="stAdd" style="margin-bottom:8px">+ Add staff login</button><div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Name</th><th>Login</th><th>Role</th><th></th></tr></thead><tbody>' +
    S.staff.map(function(u){
      var own = !u.role || u.role === 'owner';
      return '<tr><td>' + esc(u.name || u.username || '') + '</td><td>' + esc(u.username || '') + '</td><td>' + (own ? '<b>Owner</b>' : '<select data-strole="' + esc(u.uid) + '"><option value="manager"' + (u.role === 'manager' ? ' selected' : '') + '>Manager</option><option value="viewer"' + (u.role === 'viewer' ? ' selected' : '') + '>Viewer</option></select>') + '</td><td>' + (own ? '' : '<button class="btn-admin sm outline" data-stdel="' + esc(u.uid) + '">Remove</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
    '<h6 style="margin:18px 0 4px">Distributor roles</h6><div class="ac-sub mb-2">Roles decide what a distributor\'s team members can do in the distributor portal. The distributor\'s own login always has full access.</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn-admin sm" id="rlAdd">+ New role</button>' + (S.roles.size ? '' : '<button class="btn-admin sm outline" id="rlDef">Add default roles (Manager, Storekeeper, Salesman, Viewer)</button>') + '</div>' +
    (S.roles.size ? '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><tbody>' + Array.from(S.roles.values()).sort(function(x, y){ return String(x.name).localeCompare(String(y.name)); }).map(function(r){
      var used = Array.from(S.team.values()).filter(function(t){ return t.roleId === r.id; }).length;
      return '<tr><td><b>' + esc(r.name) + '</b><div style="font-size:11px;color:#666">' + esc(roleSummary(r.perms)) + '</div></td><td>' + used + ' member(s)</td><td style="white-space:nowrap"><button class="btn-admin sm outline" data-rled="' + esc(r.id) + '">Edit</button> <button class="btn-admin sm outline" data-rldel="' + esc(r.id) + '">Delete</button></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
    '<h6 style="margin:18px 0 4px">Distributor team members</h6><div class="ac-sub mb-2">Extra logins for a distributor\'s own people (storekeeper, salesman…). They sign in on the same distributor page with their own ID and password.</div>' +
    '<button class="btn-admin sm" id="tmAdd" style="margin-bottom:8px"' + (S.roles.size && S.dists.size ? '' : ' disabled') + '>+ Add team member</button>' + (S.roles.size ? '' : '<span class="ac-sub"> Create a role first.</span>') +
    (S.team.size ? '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Distributor</th><th>Member</th><th>Role</th><th>Active</th><th></th></tr></thead><tbody>' + Array.from(S.team.values()).sort(function(x, y){ return distName(x.distributorId).localeCompare(distName(y.distributorId)); }).map(function(t){
      return '<tr><td>' + esc(distName(t.distributorId)) + '</td><td>' + esc(t.name || '') + '<div style="font-size:11px;color:#666">' + esc(t.id) + '</div></td><td><select data-tmrole="' + esc(t.id) + '">' + roleOpts(t.roleId) + '</select></td><td><input type="checkbox" data-tmact="' + esc(t.id) + '"' + (t.isActive !== false ? ' checked' : '') + '></td><td><button class="btn-admin sm outline" data-tmdel="' + esc(t.id) + '">Remove</button></td></tr>'; }).join('') + '</tbody></table></div>' : '');
  body.innerHTML = h;
  var q = function(sel, fn){ body.querySelectorAll(sel).forEach(fn); };
  $$('stAdd').onclick = openStaffForm;
  $$('rlAdd').onclick = function(){ openRoleForm(null); };
  if($$('rlDef')) $$('rlDef').onclick = function(){ commitOps(DEFAULT_ROLES.map(function(r){ return { ref: db().collection('roles').doc('r_' + slug(r.name)), data: { name: r.name, scope: 'distributor', perms: r.perms, updatedAt: Date.now() } }; })).then(function(){ toast('Default roles added'); }).catch(function(e){ toast(e.message); }); };
  $$('tmAdd').onclick = openTeamForm;
  q('[data-strole]', function(el){ el.onchange = function(){ db().collection('admins').doc(el.getAttribute('data-strole')).update({ role: el.value }).then(function(){ S.staff = null; toast('Role updated'); viewRoles(); }).catch(function(e){ toast(e.message); }); }; });
  q('[data-stdel]', function(el){ el.onclick = function(){ if(!confirm('Remove this staff login? He will no longer be able to open the admin console.')) return; db().collection('admins').doc(el.getAttribute('data-stdel')).delete().then(function(){ API.logAudit('Staff login removed', el.getAttribute('data-stdel')); S.staff = null; viewRoles(); }).catch(function(e){ toast(e.message); }); }; });
  q('[data-rled]', function(el){ el.onclick = function(){ openRoleForm(S.roles.get(el.getAttribute('data-rled'))); }; });
  q('[data-rldel]', function(el){ el.onclick = function(){ var id = el.getAttribute('data-rldel'); if(Array.from(S.team.values()).some(function(t){ return t.roleId === id; })){ toast('This role is still used by team members'); return; } if(confirm('Delete this role?')) db().collection('roles').doc(id).delete().catch(function(e){ toast(e.message); }); }; });
  q('[data-tmrole]', function(el){ el.onchange = function(){ db().collection('distributor_users').doc(el.getAttribute('data-tmrole')).update({ roleId: el.value }).then(function(){ toast('Role updated'); }).catch(function(e){ toast(e.message); }); }; });
  q('[data-tmact]', function(el){ el.onchange = function(){ db().collection('distributor_users').doc(el.getAttribute('data-tmact')).update({ isActive: el.checked }).catch(function(e){ toast(e.message); }); }; });
  q('[data-tmdel]', function(el){ el.onclick = function(){ if(confirm('Remove this team member? His login stops working.')) db().collection('distributor_users').doc(el.getAttribute('data-tmdel')).delete().then(function(){ API.logAudit('Distributor team member removed', el.getAttribute('data-tmdel')); }).catch(function(e){ toast(e.message); }); }; });
}
function openRoleForm(r){
  var w = overlay('<h5>' + (r ? 'Edit role' : 'New role') + '</h5><label>Role name</label><input id="rlName" value="' + esc(r ? r.name : '') + '" style="width:100%;margin-bottom:8px">' +
    PERMS.map(function(d){ var cur = r && r.perms ? r.perms[d.k] : d.opts[0][0]; return '<label style="display:block;margin-top:6px">' + d.label + '</label><select data-pk="' + d.k + '" style="width:100%">' + d.opts.map(function(o){ return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }).join('') +
    '<div class="ac-sub" style="margin-top:8px">“See MRP” hides prices in the portal screen for this role (the distributor\'s own login is not affected).</div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="rlNo" style="flex:1">Cancel</button><button class="btn-admin" id="rlYes" style="flex:1">Save</button></div>');
  $$('rlNo').onclick = closeOv;
  $$('rlYes').onclick = function(){
    var name = $$('rlName').value.trim(); if(!name){ toast('Enter a role name'); return; }
    var perms = {}; w.querySelectorAll('[data-pk]').forEach(function(s){ perms[s.getAttribute('data-pk')] = s.value; });
    var id = r ? r.id : 'r_' + slug(name) + '_' + Math.random().toString(36).slice(2, 6);
    db().collection('roles').doc(id).set({ name: name, scope: 'distributor', perms: perms, updatedAt: Date.now() }, { merge: true }).then(function(){ API.logAudit('Distributor role saved', name); closeOv(); }).catch(function(e){ toast(e.message); });
  };
}
function openStaffForm(){
  overlay('<h5>Add staff login</h5><label>Name</label><input id="sfName" style="width:100%;margin-bottom:6px"><label>Login (username)</label><input id="sfUser" style="width:100%;margin-bottom:6px" autocapitalize="none"><label>Password (min 6)</label><input id="sfPass" style="width:100%;margin-bottom:6px"><label>Role</label><select id="sfRole" style="width:100%"><option value="manager">Manager — can change everything except roles & team</option><option value="viewer">Viewer — view only</option></select>' +
    '<div class="ac-sub" style="margin-top:6px">They sign in on the normal admin login with this username.</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="sfNo" style="flex:1">Cancel</button><button class="btn-admin" id="sfYes" style="flex:1">Create</button></div>');
  $$('sfNo').onclick = closeOv;
  $$('sfYes').onclick = function(){
    var name = $$('sfName').value.trim(), user = slug($$('sfUser').value), pass = $$('sfPass').value, role = $$('sfRole').value;
    if(!name || !user || pass.length < 6){ toast('Fill name, username and a password of 6+ characters'); return; }
    $$('sfYes').disabled = true;
    createLogin(user, pass, staffDomain()).then(function(uid){ return db().collection('admins').doc(uid).set({ username: user, email: user + '@' + staffDomain(), name: name, role: role, createdAt: new Date().toISOString() }); })
      .then(function(){ API.logAudit('Staff login created', user + ' (' + role + ')'); S.staff = null; closeOv(); toast('Staff login created'); viewRoles(); })
      .catch(function(e){ $$('sfYes').disabled = false; toast(/email-already-in-use/.test(e.code || '') ? 'That username is already taken' : e.message); });
  };
}
function openTeamForm(){
  var dOpts = Array.from(S.dists.values()).sort(function(x, y){ return String(x.name).localeCompare(String(y.name)); }).map(function(d){ return '<option value="' + esc(d.id) + '">' + esc(d.name) + '</option>'; }).join('');
  var rOpts = Array.from(S.roles.values()).map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('');
  overlay('<h5>Add distributor team member</h5><label>Distributor</label><select id="tfDist" style="width:100%;margin-bottom:6px">' + dOpts + '</select><label>Name</label><input id="tfName" style="width:100%;margin-bottom:6px"><label>Login ID</label><input id="tfUser" style="width:100%;margin-bottom:6px" autocapitalize="none"><label>Password (min 6)</label><input id="tfPass" style="width:100%;margin-bottom:6px"><label>Role</label><select id="tfRole" style="width:100%">' + rOpts + '</select>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="tfNo" style="flex:1">Cancel</button><button class="btn-admin" id="tfYes" style="flex:1">Create</button></div>');
  $$('tfNo').onclick = closeOv;
  $$('tfYes').onclick = function(){
    var name = $$('tfName').value.trim(), user = slug($$('tfUser').value), pass = $$('tfPass').value;
    if(!name || !user || pass.length < 6){ toast('Fill name, login ID and a password of 6+ characters'); return; }
    if(S.dists.has(user) || S.team.has(user)){ toast('That login ID is already used'); return; }
    $$('tfYes').disabled = true;
    createLogin(user, pass, DOMAIN).then(function(){ return db().collection('distributor_users').doc(user).set({ distributorId: $$('tfDist').value, roleId: $$('tfRole').value, name: name, isActive: true, createdAt: Date.now() }); })
      .then(function(){ API.logAudit('Distributor team member created', user + ' → ' + $$('tfDist').value); closeOv(); toast('Team member created'); })
      .catch(function(e){ $$('tfYes').disabled = false; toast(/email-already-in-use/.test(e.code || '') ? 'That login ID is already taken' : e.message); });
  };
}

/* ----------------------------------------- view: who added how much stock */
function periodStart(p){
  var n = new Date();
  if(p === 'today') return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  if(p === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).getTime();
  if(p === 'all') return 0;
  return Date.now() - Number(p) * 86400000;
}
function viewAdded(){
  var A = S.ad, body = document.getElementById('dvBody'), key = A.period;
  if(A.rows === null || A.key !== key){
    body.innerHTML = '<div class="ac-sub">Loading…</div>';
    var since = periodStart(A.period), q = db().collection('distributor_log');
    if(since) q = q.where('ts', '>=', since);
    q.orderBy('ts', 'desc').limit(3000).get().then(function(s){ A.rows = s.docs.map(function(x){ return x.data(); }); A.key = key; if(tabActive() && S.view === 'added') viewAdded(); })
      .catch(function(e){ body.innerHTML = '<div class="ac-sub">Could not load: ' + esc(e.message) + '</div>'; });
    return;
  }
  var rows = A.rows.filter(function(l){ return (A.adminToo || l.by !== 'admin') && (!A.dist || l.distributorId === A.dist); });
  var by = {}, tot = { add: 0, red: 0, n: 0 };
  rows.forEach(function(l){
    var delta = (Number(l.to) || 0) - (Number(l.from) || 0);
    if(A.onlyAdd && delta <= 0) return;
    var g = by[l.distributorId] = by[l.distributorId] || { id: l.distributorId, n: 0, add: 0, red: 0, last: 0, prods: {} };
    g.n++; tot.n++; g.last = Math.max(g.last, l.ts || 0);
    if(delta > 0){ g.add += delta; tot.add += delta; } else { g.red += -delta; tot.red += -delta; }
    var pk = String(l.part || l.name), pr = g.prods[pk] = g.prods[pk] || { name: l.name, part: l.part, n: 0, add: 0, red: 0 };
    pr.n++; if(delta > 0) pr.add += delta; else pr.red += -delta;
  });
  var list = Object.keys(by).map(function(k){ return by[k]; }).sort(function(x, y){ return y.add - x.add; });
  // distributors with no activity are still shown (so a missing update is visible)
  if(!A.onlyAdd && !A.dist) S.dists.forEach(function(d){ if(!by[d.id]) list.push({ id: d.id, n: 0, add: 0, red: 0, last: 0, prods: {} }); });
  var nm = function(id){ var d = S.dists.get(id); return d ? d.name : id; };
  var sel = function(id, opts, v){ return '<select id="' + id + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var h = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
    sel('adDist', [['', 'All distributors']].concat(Array.from(S.dists.values()).map(function(d){ return [d.id, esc(d.name)]; })), A.dist) +
    sel('adPer', [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']], A.period) +
    '<button class="btn-admin sm outline" id="adCsv">⬇ CSV</button></div>' +
    '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:12.5px">' +
    '<label><input type="checkbox" id="adOnly"' + (A.onlyAdd ? ' checked' : '') + '> Only stock increases</label>' +
    '<label><input type="checkbox" id="adAdm"' + (A.adminToo ? ' checked' : '') + '> Include my own (admin) edits</label>' +
    '<label><input type="checkbox" id="adMode"' + (A.mode === 'prod' ? ' checked' : '') + '> Show by product instead of by distributor</label></div>' +
    '<div class="ac-sub mb-2"><b>Added</b> = units the distributor increased; <b>Reduced</b> = units he decreased (sales / corrections). Built from his saved stock updates in the chosen period' + (A.rows.length >= 3000 ? ' (latest 3000 shown)' : '') + '.</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
      '<div class="dv-chip"><b style="color:#1e7b46">+' + tot.add + '</b>units added</div><div class="dv-chip"><b style="color:#b23b3b">−' + tot.red + '</b>units reduced</div><div class="dv-chip"><b>' + tot.n + '</b>updates</div></div>';
  if(A.mode === 'prod'){
    var pm = {};
    Object.keys(by).forEach(function(k){ var g = by[k]; Object.keys(g.prods).forEach(function(pk){ var p = g.prods[pk], z = pm[pk] = pm[pk] || { name: p.name, part: p.part, add: 0, red: 0, who: [] }; z.add += p.add; z.red += p.red; if(p.add || p.red) z.who.push(nm(g.id) + ' +' + p.add + (p.red ? ' / −' + p.red : '')); }); });
    var pl = Object.keys(pm).map(function(k){ return pm[k]; }).sort(function(x, y){ return y.add - x.add; });
    h += !pl.length ? '<div class="admin-empty"><div class="ae-big">No updates in this period</div></div>' :
      '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Product</th><th class="text-end">Added</th><th class="text-end">Reduced</th><th>By</th></tr></thead><tbody>' +
      pl.map(function(p){ return '<tr><td>' + esc(p.name) + '<div style="font-size:11px;color:#777">' + esc(p.part) + '</div></td><td class="text-end"><b>+' + p.add + '</b></td><td class="text-end">−' + p.red + '</td><td style="font-size:11.5px">' + p.who.map(esc).join('<br>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  } else {
    h += !list.length ? '<div class="admin-empty"><div class="ae-big">No updates in this period</div></div>' :
      '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Distributor</th><th class="text-end">Updates</th><th class="text-end">Added</th><th class="text-end">Reduced</th><th class="text-end">Net</th><th>Last update</th></tr></thead><tbody>' +
      list.map(function(g){
        var open = !!S.exp[g.id] || (A.dist && A.dist === g.id), net = g.add - g.red;
        var html = '<tr data-ex="' + esc(g.id) + '" style="cursor:pointer"><td>' + (g.n ? (open ? '▾ ' : '▸ ') : '') + '<b>' + esc(nm(g.id)) + '</b></td><td class="text-end">' + g.n + '</td><td class="text-end" style="color:#1e7b46"><b>+' + g.add + '</b></td><td class="text-end" style="color:#b23b3b">−' + g.red + '</td><td class="text-end"><b>' + (net > 0 ? '+' : '') + net + '</b></td><td>' + (g.last ? ago(g.last) : '<span style="color:#b23b3b">no update</span>') + '</td></tr>';
        if(open) html += Object.keys(g.prods).map(function(k){ return g.prods[k]; }).sort(function(x, y){ return y.add - x.add; }).map(function(p){
          return '<tr style="background:#faf7ee"><td style="padding-left:26px">' + esc(p.name) + ' <span style="font-size:11px;color:#777">' + esc(p.part) + '</span></td><td class="text-end">' + p.n + '</td><td class="text-end" style="color:#1e7b46">+' + p.add + '</td><td class="text-end" style="color:#b23b3b">−' + p.red + '</td><td></td><td></td></tr>'; }).join('');
        return html; }).join('') + '</tbody></table></div><div class="ac-sub">Tap a distributor to see which products.</div>';
  }
  body.innerHTML = h;
  var $$ = function(id){ return document.getElementById(id); };
  $$('adDist').onchange = function(e){ A.dist = e.target.value; viewAdded(); };
  $$('adPer').onchange = function(e){ A.period = e.target.value; A.rows = null; viewAdded(); };
  $$('adOnly').onchange = function(e){ A.onlyAdd = e.target.checked; viewAdded(); };
  $$('adAdm').onchange = function(e){ A.adminToo = e.target.checked; viewAdded(); };
  $$('adMode').onchange = function(e){ A.mode = e.target.checked ? 'prod' : 'dist'; viewAdded(); };
  body.querySelectorAll('[data-ex]').forEach(function(tr){ tr.onclick = function(){ var k = tr.getAttribute('data-ex'); S.exp[k] = !S.exp[k]; viewAdded(); }; });
  $$('adCsv').onclick = function(){
    var out = [['Distributor', 'Product', 'Part', 'Updates', 'Added', 'Reduced']];
    Object.keys(by).forEach(function(k){ var g = by[k]; Object.keys(g.prods).forEach(function(pk){ var p = g.prods[pk]; out.push([nm(g.id), p.name, p.part, p.n, p.add, p.red]); }); });
    download('stock-added-' + A.period + '-' + new Date().toISOString().slice(0, 10) + '.csv', out);
  };
}

/* ----------------------------------------------------------- view: activity */
function viewLog(){
  var body = document.getElementById('dvBody');
  if(S.logRows === null){
    body.innerHTML = '<div class="ac-sub">Loading…</div>';
    db().collection('distributor_log').orderBy('ts', 'desc').limit(150).get().then(function(s){ S.logRows = s.docs.map(function(x){ return x.data(); }); if(tabActive() && S.view === 'log') viewLog(); })
      .catch(function(e){ body.innerHTML = '<div class="ac-sub">Could not load: ' + esc(e.message) + '</div>'; });
    return;
  }
  body.innerHTML = '<div style="margin-bottom:8px"><button class="btn-admin sm outline" id="lRef">↻ Refresh</button></div>' + (!S.logRows.length ? '<div class="admin-empty"><div class="ae-big">No stock updates yet</div></div>' :
    '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>When</th><th>Distributor</th><th>Product</th><th class="text-end">Change</th></tr></thead><tbody>' +
    S.logRows.map(function(l){ var d = S.dists.get(l.distributorId);
      return '<tr><td>' + new Date(l.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(d ? d.name : l.distributorId) + '</td><td>' + esc(l.name) + '<div style="font-size:11px;color:#777">' + esc(l.part) + '</div></td><td class="text-end">' + l.from + ' → <b>' + l.to + '</b>' + (l.type ? ' <span style="font-size:10.5px;color:#777">(' + esc(l.type) + (l.ref ? ' ' + esc(l.ref) : '') + ')</span>' : '') + (l.by && l.by !== 'admin' ? ' <span style="font-size:10.5px;color:#777">· ' + esc(l.by) + '</span>' : '') + (l.by === 'admin' ? ' <span style="font-size:10.5px;color:#777">(admin)</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>');
  var rb = document.getElementById('lRef'); if(rb) rb.onclick = function(){ S.logRows = null; viewLog(); };
}


/* ------------------------------------------------------------ view: data check */
function healthScan(){
  var prods = products(), byKey = {}, dup = [], noPart = [], samples = [];
  prods.forEach(function(p){
    var k = partKey(p.part);
    if(!k){ noPart.push(p); return; }
    (byKey[k] = byKey[k] || []).push(p);
    if(/^SAMPLE/.test(k)) samples.push(p);
  });
  Object.keys(byKey).forEach(function(k){ if(byKey[k].length > 1) dup.push(byKey[k]); });
  var orphans = [], leaks = [], drift = 0;
  S.stock.forEach(function(s){
    var p = productById(s.productId);
    if(!p || !S.dists.has(s.distributorId)){ orphans.push(s); return; }
    if(!s.showPrice && (s.mrp !== undefined || s.gstPct !== undefined)) leaks.push(s);
    if(diffRow(s)) drift++;
  });
  var empty = Array.from(S.dists.values()).filter(function(d){ return d.isActive !== false && !stockOf(d.id).some(function(s){ return s.visible; }); });
  var oldReq = pendingReqs().filter(function(r){ return Date.now() - (r.createdAt || 0) > 3 * 86400000; });
  return { dup: dup, noPart: noPart, samples: samples, orphans: orphans, leaks: leaks, drift: drift, empty: empty, oldReq: oldReq, stale: Array.from(S.dists.values()).filter(isStale) };
}
function viewHealth(){
  var body = document.getElementById('dvBody'), H = healthScan();
  function card(ok, title, detail, btn){
    return '<div class="admin-card"><div class="ac-title">' + (ok ? '✅ ' : '⚠️ ') + title + '</div>' + (detail ? '<div class="ac-sub">' + detail + '</div>' : '') + (btn && !ok ? '<div class="ac-actions">' + btn + '</div>' : '') + '</div>';
  }
  var names = function(a, f){ return a.slice(0, 6).map(f).join(', ') + (a.length > 6 ? ' … +' + (a.length - 6) + ' more' : ''); };
  body.innerHTML =
    '<div class="ac-sub mb-2">Checks your catalogue and distributor data for problems that would break part-code matching, stock totals or price hiding.</div>' +
    card(!H.dup.length, 'Duplicate part codes (' + H.dup.length + ')', H.dup.length ? 'Two products share a part code, so uploads and sheet imports cannot tell them apart: ' + names(H.dup, function(g){ return esc(g[0].part) + ' (' + g.map(function(p){ return esc(p.name); }).join(' / ') + ')'; }) + '. Give each a unique part code in Products &amp; Pricing.' : 'Every product has a unique part code.') +
    card(!H.noPart.length, 'Products without a part code (' + H.noPart.length + ')', H.noPart.length ? names(H.noPart, function(p){ return esc(p.name); }) : '') +
    card(!H.samples.length, 'Sample products still in the catalogue (' + H.samples.length + ')', H.samples.length ? 'The built-in SAMPLE items are still there: ' + names(H.samples, function(p){ return esc(p.name); }) + '. Delete them before going live.' : '') +
    card(!H.orphans.length, 'Distributor rows whose product was deleted (' + H.orphans.length + ')', H.orphans.length ? 'These rows point to products that no longer exist.' : 'No orphan rows.', '<button class="btn-admin sm maroon" id="hOrph">Remove orphan rows</button>') +
    card(!H.leaks.length, 'Hidden-price rows that still carry a price (' + H.leaks.length + ')', H.leaks.length ? 'Price is switched off for these rows but an old MRP value is still stored. Clean them so it can never be read.' : 'Hidden prices are fully removed.', '<button class="btn-admin sm" id="hLeak">Clean now</button>') +
    card(!H.drift, 'Distributor copies out of date (' + H.drift + ')', H.drift ? 'Name / spec / part / MRP / company stock changed after assigning (this fixes itself automatically within a minute).' : 'All copies match the catalogue.', '<button class="btn-admin sm" id="hSync">Refresh now</button>') +
    card(!H.stale.length, 'Distributors with stale stock (' + H.stale.length + ')', H.stale.length ? names(H.stale, function(d){ return esc(d.name) + ' (' + ago(lastFresh(d)) + ')'; }) + ' — use 📲 WhatsApp on the Distributors tab.' : 'Everyone confirmed stock within 7 days.') +
    card(!H.empty.length, 'Active distributors with no products (' + H.empty.length + ')', H.empty.length ? names(H.empty, function(d){ return esc(d.name); }) : '') +
    card(!H.oldReq.length, 'Requests waiting more than 3 days (' + H.oldReq.length + ')', H.oldReq.length ? names(H.oldReq, function(r){ return esc(r.name); }) : '');
  function bind(id, fn){ var b = document.getElementById(id); if(b) b.onclick = fn; }
  bind('hOrph', function(){
    if(!confirm('Delete ' + H.orphans.length + ' orphan row(s)?')) return;
    commitOps(H.orphans.map(function(s){ return { ref: db().collection('distributor_stock').doc(s.id), del: true }; })).then(function(){ API.logAudit('Distributor data check', 'Removed ' + H.orphans.length + ' orphan rows'); toast('Removed'); });
  });
  bind('hLeak', function(){
    commitOps(H.leaks.map(function(s){ return { ref: db().collection('distributor_stock').doc(s.id), data: { mrp: FV().delete(), gstPct: FV().delete() } }; })).then(function(){ API.logAudit('Distributor data check', 'Cleaned hidden prices'); toast('Cleaned'); });
  });
  bind('hSync', function(){ S.syncing = false; syncSnapshots().then(function(n){ toast(n + ' row(s) refreshed'); }); });
}

/* ---------------------------------------------------------------- register */
window.__acAdminTabs = window.__acAdminTabs || {};
window.__acAdminTabs.distributors = function(){ render(); queueSync(1500); };
/* product / catalog-card edits (name, spec, MRP, stock, new or removed items) reach distributors straight away */
window.__acCatalogChanged = function(){ if(S.started) queueSync(1500); };
if(CLOUD && CLOUD.enabled && CLOUD.role === 'admin'){
  API = window.__acApi; start();
  setInterval(function(){ if(S.started) syncSnapshots(); }, 60000);   // picks up stock changes made elsewhere
}
})();