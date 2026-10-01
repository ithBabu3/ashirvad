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
var S = { dists: new Map(), stock: new Map(), reqs: new Map(), view: 'list', started: false, q: '', logRows: null };

function noop(){}
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
/* Newest sign that a distributor's stock is current: a qty change OR his "stock is up to date" tap. */
function lastFresh(d){ return Math.max(Number(d.lastConfirmedAt) || 0, stockOf(d.id).reduce(function(m, s){ return Math.max(m, s.updatedAt || 0); }, 0)); }
function isStale(d){ if(d.isActive === false) return false; var vis = stockOf(d.id).filter(function(s){ return s.visible; }); if(!vis.length) return false; var l = lastFresh(d); return !l || Date.now() - l > STALE_MS; }
function updateBadge(){
  var btn = document.querySelector('.admin-tabs button[data-atab="distributors"]'); if(!btn) return;
  var n = pendingReqs().length + Array.from(S.dists.values()).filter(isStale).length;
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
  [['distributors', S.dists], ['distributor_stock', S.stock], ['distributor_requests', S.reqs]].forEach(function(pair){
    db().collection(pair[0]).onSnapshot(function(snap){
      snap.docChanges().forEach(function(ch){ if(ch.type === 'removed') pair[1].delete(ch.doc.id); else { var d = ch.doc.data(); d.id = ch.doc.id; pair[1].set(ch.doc.id, d); } });
      updateBadge();
      if(tabActive() && !busy()) render();
    }, function(e){ console.warn('[distributors]', pair[0], e); });
  });
}
function stockOf(distId){ return Array.from(S.stock.values()).filter(function(s){ return s.distributorId === distId; }); }
function pendingReqs(){ return Array.from(S.reqs.values()).filter(function(r){ return r.status === 'pending'; }); }

/* Keep the name / part / MRP copy that distributors see in step with the real products (no writes when nothing changed). */
function syncSnapshots(){
  var batch = db().batch(), n = 0;
  S.stock.forEach(function(s, id){
    var p = productById(s.productId); if(!p) return;
    var upd = {};
    if(s.name !== p.name) upd.name = p.name;
    if((s.size || '') !== (p.size || '')) upd.size = p.size || '';
    if(s.part !== p.part) upd.part = p.part;
    if(s.showPrice){ if(s.mrp !== p.mrp) upd.mrp = Number(p.mrp) || 0; if(s.gstPct !== p.gstPct) upd.gstPct = Number(p.gstPct) || 0; }
    if(Object.keys(upd).length && n < 400){ batch.set(db().collection('distributor_stock').doc(id), upd, { merge: true }); n++; }
  });
  if(!n) return Promise.resolve(0);
  return batch.commit().then(function(){ return n; }).catch(function(){ return 0; });
}

/* ---------------------------------------------------------------- render */
function render(){
  API = window.__acApi;
  var m = main();
  if(!CLOUD || !CLOUD.enabled || CLOUD.role !== 'admin'){
    m.innerHTML = '<div class="admin-empty"><div class="ae-big">Cloud mode required</div><div>The distributor portal needs Firebase. Finish SETUP.md first.</div></div>'; return;
  }
  start();
  var pend = pendingReqs().length;
  var nav = [['list', '🚚 Distributors'], ['overview', '📦 Stock overview'], ['requests', '📥 Requests' + (pend ? ' (' + pend + ')' : '')], ['log', '🕘 Activity'], ['health', '🩺 Data check']]
    .map(function(v){ return '<button type="button" class="btn-admin sm ' + (S.view === v[0] ? '' : 'outline') + '" data-dv="' + v[0] + '" style="margin-right:6px">' + v[1] + '</button>'; }).join('');
  m.innerHTML = '<div class="admin-toolbar"><h2>Distributors</h2></div><div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">' + nav + '</div><div id="dvBody"></div>';
  m.querySelectorAll('[data-dv]').forEach(function(b){ b.onclick = function(){ S.view = b.getAttribute('data-dv'); S.logRows = null; render(); }; });
  ({ list: viewList, overview: viewOverview, requests: viewRequests, log: viewLog, health: viewHealth })[S.view]();
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
      '<div class="ac-sub">' + esc(d.phone || '') + (d.city ? ' · ' + esc(d.city) : '') + ' · Upload products: <b>' + (d.canUpload ? 'Allowed' : 'Off') + '</b> · New products show price: <b>' + (d.defaultShowPrice ? 'Yes' : 'No') + '</b></div>' +
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
    var batch = db().batch(); batch.delete(db().collection('distributors').doc(d.id));
    stockOf(d.id).forEach(function(s){ batch.delete(db().collection('distributor_stock').doc(s.id)); });
    batch.commit().then(function(){ API.logAudit('Distributor deleted', d.name); toast('Deleted'); }).catch(function(e){ toast(e.message); });
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
function createLogin(username, password){
  var app = CLOUD.firebase.initializeApp(window.AC_FIREBASE_CONFIG, 'dist-create-' + Date.now());
  var auth = app.auth();
  return auth.createUserWithEmailAndPassword(username + '@' + DOMAIN, password).then(function(c){
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
    '<div class="full"><label>Notice shown at the top of his page (optional)</label><input id="fNotice" maxlength="200" value="' + esc(d ? d.notice : '') + '" placeholder="e.g. Please update stock before 6 PM daily"></div>' +
    '<div class="full"><label><input type="checkbox" id="fUpload"' + (d && d.canUpload ? ' checked' : '') + '> Allow this distributor to add (request) new products</label></div>' +
    '<div class="full"><label><input type="checkbox" id="fPrice"' + (d && d.defaultShowPrice ? ' checked' : '') + '> Show price by default for newly assigned products</label></div>' +
    '</div><div id="fErr" style="color:#a12626;margin-top:8px"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="fCancel" style="flex:1">Cancel</button><button class="btn-admin" id="fSave" style="flex:1">Save</button></div>');
  w.querySelector('#fCancel').onclick = closeOv;
  w.querySelector('#fSave').onclick = function(){
    var name = w.querySelector('#fName').value.trim(), err = w.querySelector('#fErr'), btn = w.querySelector('#fSave');
    var fields = { name: name, phone: w.querySelector('#fPhone').value.trim(), city: w.querySelector('#fCity').value.trim(),
      lowStockAt: Number(w.querySelector('#fLow').value) || 10, notice: w.querySelector('#fNotice').value.trim(), canUpload: w.querySelector('#fUpload').checked, defaultShowPrice: w.querySelector('#fPrice').checked };
    if(!name){ err.textContent = 'Name is required.'; return; }
    btn.disabled = true;
    if(d){
      db().collection('distributors').doc(d.id).set(fields, { merge: true }).then(function(){ API.logAudit('Distributor updated', name); closeOv(); }).catch(function(e){ err.textContent = e.message; btn.disabled = false; });
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

/* ---- which products a distributor sees, with / without price */
function openAssign(distId){
  var d = S.dists.get(distId); if(!d) return;
  var list = products().filter(function(p){ return p.id !== undefined; }).slice().sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
  var cur = {};   // productId -> { show, price }
  list.forEach(function(p){ var s = S.stock.get(distId + '__' + p.id); cur[p.id] = { show: !!(s && s.visible), price: !!(s && s.showPrice), had: !!s }; });
  var w = overlay('<h5>' + esc(d.name) + ' — products &amp; price</h5>' +
    '<div class="ac-sub mb-2">Tick <b>Show</b> to put a product on this distributor\'s page. Tick <b>Price</b> to let him see the MRP (he never sees discounts or dealer prices). Unticking Show hides it but keeps his stock number.</div>' +
    '<input id="aQ" placeholder="Search name / part…" style="width:100%;margin-bottom:8px">' +
    '<div style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn-admin sm outline" id="aShowAll">Show all listed</button><button class="btn-admin sm outline" id="aHideAll">Hide all listed</button><button class="btn-admin sm outline" id="aPriceOn">Price on (listed)</button><button class="btn-admin sm outline" id="aPriceOff">Price off (listed)</button></div>' +
    '<div id="aList" style="max-height:48vh;overflow:auto;border:1px solid #eee;border-radius:8px"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-admin outline" id="aCancel" style="flex:1">Cancel</button><button class="btn-admin" id="aSave" style="flex:1">Save</button></div>');
  function listed(){ var q = w.querySelector('#aQ').value.toLowerCase(); return list.filter(function(p){ return !q || (String(p.name) + ' ' + String(p.part)).toLowerCase().indexOf(q) >= 0; }); }
  function paint(){
    w.querySelector('#aList').innerHTML = '<table style="width:100%;font-size:12.5px"><thead><tr><th style="text-align:left;padding:6px">Product</th><th>Show</th><th>Price</th></tr></thead><tbody>' +
      listed().map(function(p){ var c = cur[p.id];
        return '<tr style="border-top:1px solid #f0ead8"><td style="padding:6px">' + esc(p.name) + '<div style="font-size:11px;color:#777">' + esc(p.part) + (Number(p.mrp) ? ' · MRP ' + p.mrp : '') + (p.active === false && !p.isCatalogVariant ? ' · <b>inactive</b>' : '') + '</div></td>' +
          '<td style="text-align:center"><input type="checkbox" data-s="' + p.id + '"' + (c.show ? ' checked' : '') + '></td>' +
          '<td style="text-align:center"><input type="checkbox" data-p="' + p.id + '"' + (c.price ? ' checked' : '') + (c.show ? '' : ' disabled') + '></td></tr>'; }).join('') + '</tbody></table>';
  }
  paint();
  w.querySelector('#aQ').oninput = paint;
  w.querySelector('#aList').onchange = function(e){
    var s = e.target.getAttribute('data-s'), p = e.target.getAttribute('data-p');
    if(s){ cur[s].show = e.target.checked; if(e.target.checked && !cur[s].had && d.defaultShowPrice) cur[s].price = true; if(!e.target.checked) cur[s].price = false; paint(); }
    if(p) cur[p].price = e.target.checked;
  };
  function bulk(key, val){ listed().forEach(function(p){ cur[p.id][key] = val; if(key === 'show' && !val) cur[p.id].price = false; if(key === 'price' && val) cur[p.id].show = true; }); paint(); }
  w.querySelector('#aShowAll').onclick = function(){ bulk('show', true); };
  w.querySelector('#aHideAll').onclick = function(){ bulk('show', false); };
  w.querySelector('#aPriceOn').onclick = function(){ bulk('price', true); };
  w.querySelector('#aPriceOff').onclick = function(){ bulk('price', false); };
  w.querySelector('#aCancel').onclick = closeOv;
  w.querySelector('#aSave').onclick = function(){
    var batch = db().batch(), n = 0;
    list.forEach(function(p){
      var c = cur[p.id], id = distId + '__' + p.id, old = S.stock.get(id);
      if(!c.show && !old) return;                                  // never assigned, still not shown
      if(old && !!old.visible === c.show && !!old.showPrice === c.price) return;   // unchanged
      var row = { id: id, distributorId: distId, productId: p.id, name: p.name, size: p.size || '', part: p.part, visible: c.show, showPrice: c.show && c.price };
      if(!old){ row.qty = 0; row.updatedAt = 0; row.updatedBy = 'admin'; }
      if(row.showPrice){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; }
      else { row.mrp = FV().delete(); row.gstPct = FV().delete(); }   // price never leaves the server when hidden
      batch.set(db().collection('distributor_stock').doc(id), row, { merge: true }); n++;
    });
    if(n > 400){ toast('Too many changes at once — save in two rounds'); return; }
    (n ? batch.commit() : Promise.resolve()).then(function(){ if(n) API.logAudit('Distributor products updated', d.name + ': ' + n + ' change(s)'); toast(n ? 'Saved' : 'No changes'); closeOv(); })
      .catch(function(e){ toast('Failed: ' + e.message); });
  };
}

/* ------------------------------------------------------ view: stock overview */
function viewOverview(){
  var body = document.getElementById('dvBody');
  var byProd = {};
  S.stock.forEach(function(s){ (byProd[s.productId] = byProd[s.productId] || []).push(s); });
  var rows = Object.keys(byProd).map(function(pid){
    var p = productById(pid), rs = byProd[pid];
    var dist = rs.reduce(function(a, s){ return a + (Number(s.qty) || 0); }, 0);
    var own = p ? Number(p.stock) : NaN;
    return { pid: pid, name: p ? p.name : rs[0].name, part: p ? p.part : rs[0].part, own: own, dist: dist, rs: rs };
  }).filter(function(r){ var q = S.q.toLowerCase(); return !q || (r.name + ' ' + r.part).toLowerCase().indexOf(q) >= 0; })
    .sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
  var h = '<div style="display:flex;gap:8px;margin-bottom:10px"><input id="oQ" placeholder="Search…" value="' + esc(S.q) + '" style="flex:1"><button class="btn-admin sm outline" id="oCsv">⬇ CSV</button></div>' +
    '<div class="ac-sub mb-2">Each distributor has his own stock row, so the same product never duplicates — totals simply add up. “Own” is your warehouse stock from Products &amp; Pricing.</div>';
  if(!rows.length) h += '<div class="admin-empty"><div class="ae-big">Nothing assigned yet</div></div>';
  else h += '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>Product</th><th class="text-end">Own</th><th>Distributors</th><th class="text-end">Distributor total</th><th class="text-end">Grand total</th></tr></thead><tbody>' +
    rows.map(function(r){
      var own = isFinite(r.own) ? r.own : null;
      return '<tr><td>' + esc(r.name) + '<div style="font-size:11px;color:#777">' + esc(r.part) + '</div></td><td class="text-end">' + (own === null ? '∞' : own) + '</td><td>' +
        r.rs.filter(function(s){ return s.visible; }).map(function(s){ var d = S.dists.get(s.distributorId); return esc(d ? d.name : s.distributorId) + ': <b>' + (Number(s.qty) || 0) + '</b>'; }).join('<br>') +
        '</td><td class="text-end"><b>' + r.dist + '</b></td><td class="text-end"><b>' + (own === null ? '∞' : own + r.dist) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  body.innerHTML = h;
  document.getElementById('oQ').oninput = function(e){ S.q = e.target.value; var p = e.target.selectionStart; viewOverview(); var b = document.getElementById('oQ'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} };
  document.getElementById('oCsv').onclick = function(){
    download('distributor-stock-' + new Date().toISOString().slice(0, 10) + '.csv',
      [['Product', 'Part', 'Own stock', 'Distributor', 'Qty', 'Last updated']].concat(Array.prototype.concat.apply([], rows.map(function(r){
        return r.rs.map(function(s){ var d = S.dists.get(s.distributorId); return [r.name, r.part, isFinite(r.own) ? r.own : '', d ? d.name : s.distributorId, s.qty, s.updatedAt ? new Date(s.updatedAt).toLocaleString('en-IN') : '']; }); }))));
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
  var id = r.distributorId + '__' + p.id, old = S.stock.get(id);
  var show = old ? !!old.showPrice : !!d.defaultShowPrice;
  var row = { id: id, distributorId: d.id, productId: p.id, name: p.name, size: p.size || '', part: p.part, visible: true, showPrice: show, qty: Number(r.qty) || 0, updatedAt: Date.now(), updatedBy: d.id };
  if(show){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; }
  var batch = db().batch();
  batch.set(db().collection('distributor_stock').doc(id), row, { merge: true });      // same distributor + same product => same doc => updated, never duplicated
  batch.set(db().collection('distributor_requests').doc(r.id), { status: 'approved', productId: p.id, adminNote: created ? 'New product created' : 'Linked to existing product' }, { merge: true });
  batch.commit().then(function(){ API.logAudit('Product request approved', r.name + ' → ' + d.name + (created ? ' (new product)' : ' (existing)')); toast(created ? 'Approved — new product created (inactive, set price in Products)' : 'Approved — linked to existing product'); })
    .catch(function(e){ toast('Failed: ' + e.message); });
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
  body.innerHTML = !S.logRows.length ? '<div class="admin-empty"><div class="ae-big">No stock updates yet</div></div>' :
    '<div style="overflow:auto"><table class="table table-sm" style="font-size:12.5px"><thead><tr><th>When</th><th>Distributor</th><th>Product</th><th class="text-end">Change</th></tr></thead><tbody>' +
    S.logRows.map(function(l){ var d = S.dists.get(l.distributorId);
      return '<tr><td>' + new Date(l.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(d ? d.name : l.distributorId) + '</td><td>' + esc(l.name) + '<div style="font-size:11px;color:#777">' + esc(l.part) + '</div></td><td class="text-end">' + l.from + ' → <b>' + l.to + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
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
    if(!p){ orphans.push(s); return; }
    if(!s.showPrice && (s.mrp !== undefined || s.gstPct !== undefined)) leaks.push(s);
    if(s.name !== p.name || s.part !== p.part || (s.showPrice && (s.mrp !== (Number(p.mrp) || 0) || s.gstPct !== (Number(p.gstPct) || 0)))) drift++;
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
    card(!H.drift, 'Distributor copies out of date (' + H.drift + ')', H.drift ? 'Product name / part / MRP changed after assigning.' : 'All copies match the catalogue.', '<button class="btn-admin sm" id="hSync">Refresh now</button>') +
    card(!H.stale.length, 'Distributors with stale stock (' + H.stale.length + ')', H.stale.length ? names(H.stale, function(d){ return esc(d.name) + ' (' + ago(lastFresh(d)) + ')'; }) + ' — use 📲 WhatsApp on the Distributors tab.' : 'Everyone confirmed stock within 7 days.') +
    card(!H.empty.length, 'Active distributors with no products (' + H.empty.length + ')', H.empty.length ? names(H.empty, function(d){ return esc(d.name); }) : '') +
    card(!H.oldReq.length, 'Requests waiting more than 3 days (' + H.oldReq.length + ')', H.oldReq.length ? names(H.oldReq, function(r){ return esc(r.name); }) : '');
  function bind(id, fn){ var b = document.getElementById(id); if(b) b.onclick = fn; }
  bind('hOrph', function(){
    if(!confirm('Delete ' + H.orphans.length + ' orphan row(s)?')) return;
    var batch = db().batch(); H.orphans.slice(0, 400).forEach(function(s){ batch.delete(db().collection('distributor_stock').doc(s.id)); });
    batch.commit().then(function(){ API.logAudit('Distributor data check', 'Removed ' + H.orphans.length + ' orphan rows'); toast('Removed'); });
  });
  bind('hLeak', function(){
    var batch = db().batch(); H.leaks.slice(0, 400).forEach(function(s){ batch.set(db().collection('distributor_stock').doc(s.id), { mrp: FV().delete(), gstPct: FV().delete() }, { merge: true }); });
    batch.commit().then(function(){ API.logAudit('Distributor data check', 'Cleaned hidden prices'); toast('Cleaned'); });
  });
  bind('hSync', function(){ syncSnapshots().then(function(n){ toast(n + ' row(s) refreshed'); }); });
}

/* ---------------------------------------------------------------- register */
window.__acAdminTabs = window.__acAdminTabs || {};
window.__acAdminTabs.distributors = function(){ render(); setTimeout(syncSnapshots, 1500); };
if(CLOUD && CLOUD.enabled && CLOUD.role === 'admin') start();
})();