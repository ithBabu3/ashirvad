/* ==========================================================================
   AshirvadConnect — Admin › Data Manager   (database browser + backup / restore + factory reset)
   OWNER ONLY. Lets the owner see and fix anything stored in the cloud database through plain forms,
   without opening the Firebase console. Loaded after js/app.js by firebase-boot.js.
   ========================================================================== */
(function(){
'use strict';
var CLOUD = window.AC_CLOUD, API;
if(!CLOUD || !CLOUD.enabled || CLOUD.role !== 'admin') return;
var OWNER = !CLOUD.staffRole || CLOUD.staffRole === 'owner';
var PAGE = 60;

/* ------------------------------------------------------------------ the "models" (collections) in plain words */
function M(id, icon, title, desc, cols, o){ return Object.assign({ id: id, icon: icon, title: title, desc: desc, cols: cols || [] }, o || {}); }
var GROUPS = [
  ['🛍 Store & catalogue', [
    M('products', '📦', 'Products', 'Every item dealers can order — name, price, stock, images.', ['name', 'size', 'part', 'mrp', 'stock', 'active']),
    M('spec_groups', '📇', 'Catalog cards', 'Cards that group the sizes of one product (spec tables).', ['title', 'categoryId', 'subCategoryId']),
    M('catalog_categories', '🗂', 'Categories', 'Top-level catalogue categories.', ['name', 'order']),
    M('catalog_subcategories', '📁', 'Sub-categories', 'Second-level catalogue groups.', ['name', 'categoryId']),
    M('offers', '🏷', 'Offers', 'Discount offers shown to dealers.', ['title', 'code', 'active']),
    M('banners', '🖼', 'Banners', 'Home-page banners.', ['title', 'imageUrl', 'active']),
    M('calc_rules', '📐', 'Calculator rules', 'Quantity / price calculator rules.', ['name', 'title']),
    M('broadcasts', '📣', 'Broadcast messages', 'Announcements sent to dealers.', ['title', 'message'])]],
  ['🧾 Business', [
    M('dealers', '🏢', 'Dealers', 'Dealer / customer profiles (GST, tier, discount).', ['business', 'gst', 'phone', 'tier', 'isActive']),
    M('accounts', '👤', 'Dealer logins', 'Links a dealer\'s phone number to his GST profiles.', ['gsts']),
    M('orders', '🧾', 'Orders', 'Every order placed by dealers.', ['id', 'dealerGst', 'status', 'total', 'date']),
    M('stock_notify', '🔔', '"Notify me" requests', 'Dealers waiting for an item to come back in stock.', ['gst', 'productId', 'time'])]],
  ['🚚 Distributors', [
    M('distributors', '🚚', 'Distributors', 'Each distributor and his settings.', ['name', 'city', 'phone', 'stockView', 'isActive']),
    M('distributor_stock', '📊', 'Distributor stock', 'One row per distributor + product (what he sees and his quantity).', ['distributorId', 'name', 'size', 'part', 'qty', 'visible']),
    M('distributor_requests', '📥', 'Product requests', 'Items distributors asked to add.', ['name', 'part', 'status', 'distributorId']),
    M('distributor_sales', '🛒', 'Sales', 'Sales recorded by distributors.', ['no', 'distributorId', 'units', 'amount', 'status']),
    M('distributor_orders', '📦', 'Distributor orders', 'Purchase orders from distributors to you.', ['no', 'distributorId', 'units', 'status']),
    M('distributor_log', '🕘', 'Stock history', 'Every stock change.', ['name', 'from', 'to', 'type', 'by']),
    M('stock_totals', '🧮', 'Catalogue availability', 'Sum of distributor stock per product (feeds the dealer catalogue).', ['id', 'by'])]],
  ['🔐 Access & system', [
    M('dist_logins', '🔑', 'Distributor logins', 'Which login belongs to which distributor and role.', ['username', 'name', 'distributorId', 'roleId', 'isActive'], { sensitive: true }),
    M('roles', '🎭', 'Distributor roles', 'What each team role may do.', ['name']),
    M('login_index', '🧭', 'Login-ID lookup', 'Maps a login ID to its sign-in e-mail. Not listable (protected by design).', [], { noList: true, sensitive: true }),
    M('admins', '🛡', 'Staff logins', 'Owner / manager / viewer accounts for this admin console.', ['username', 'name', 'role'], { sensitive: true }),
    M('audit_log', '📜', 'Old audit log', 'The audit trail was switched off. Old entries stay here until you delete them to free space.', ['date', 'by', 'action', 'details']),
    M('config', '⚙️', 'Settings', 'Shop settings (invoice, delivery …) and the invoice counter.', [], { fixed: ['settings', 'invoice_seq'] })]]
];
var MODELS = {}; GROUPS.forEach(function(g){ g[1].forEach(function(m){ MODELS[m.id] = m; }); });

/* ------------------------------------------------------------------ helpers */
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function $(id){ return document.getElementById(id); }
function db(){ return CLOUD.db; }
function FS(){ return CLOUD.firebase.firestore; }
function toast(m){ try{ API.showToast(m); }catch(e){ alert(m); } }
function main(){ return document.getElementById('adminMain'); }
function who(){ return CLOUD.staffName || 'owner'; }
var LABELS = { cat: 'Category id', categoryId: 'Category id', en: 'Message', desc: 'Description', imageUrl: 'Picture link', buttonText: 'Button text', linkType: 'Link type', linkValue: 'Link to', badge: 'Badge', subtitle: 'Subtitle', size: 'Size', mrp: 'MRP', gst: 'GST no.', gstPct: 'GST %', part: 'Part code', qty: 'Quantity', ts: 'Time', createdAt: 'Created', updatedAt: 'Updated', isActive: 'Active', active: 'Active', discountPct: 'Discount %', stock: 'Stock', business: 'Business name', dealerGst: 'Dealer GST', distributorId: 'Distributor', productId: 'Product id', accountKey: 'Account (phone)', roleId: 'Role', by: 'By', n: 'Number', id: 'ID' };
function humanize(k){ if(LABELS[k]) return LABELS[k]; var s = String(k).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
function isTs(v){ return v && typeof v === 'object' && typeof v.toDate === 'function' && typeof v.seconds === 'number'; }
function isSpecial(v){ return v && typeof v === 'object' && !Array.isArray(v) && !isTs(v) && (typeof v.path === 'string' || (typeof v.latitude === 'number' && typeof v.longitude === 'number') || typeof v.toUint8Array === 'function'); }
function dt(ms){ return new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmt(k, v){
  if(v === undefined || v === null) return '<span style="color:#aaa">—</span>';
  if(typeof v === 'boolean') return v ? '✅ Yes' : '❌ No';
  if(isTs(v)) return esc(dt(v.toDate().getTime()));
  if(typeof v === 'number'){ if(v > 1e12 && /(^|[a-z])(ts|time|at|date)$/i.test(k)) return esc(dt(v)); return esc(v.toLocaleString('en-IN')); }
  if(Array.isArray(v)) return '<span style="color:#667">' + v.length + ' item' + (v.length === 1 ? '' : 's') + '</span>';
  if(typeof v === 'object') return '<span style="color:#667">{ ' + Object.keys(v).length + ' fields }</span>';
  var s = String(v); return esc(s.length > 70 ? s.slice(0, 70) + '…' : s);
}
/* Firestore value <-> plain JSON (Timestamps become {"$timestamp": "…"} so a backup can be restored exactly) */
function toJson(v){
  if(isTs(v)) return { $timestamp: v.toDate().toISOString() };
  if(isSpecial(v)) return { $kept: typeof v.path === 'string' ? v.path : 'special value' };
  if(Array.isArray(v)) return v.map(toJson);
  if(v && typeof v === 'object'){ var o = {}; Object.keys(v).forEach(function(k){ o[k] = toJson(v[k]); }); return o; }
  if(typeof v === 'number' && !isFinite(v)) return null;
  return v;
}
function fromJson(v, orig){
  if(Array.isArray(v)) return v.map(function(x){ return fromJson(x); });
  if(v && typeof v === 'object'){
    if(typeof v.$timestamp === 'string') return FS().Timestamp.fromDate(new Date(v.$timestamp));
    if('$kept' in v) return orig === undefined ? null : orig;
    var o = {}; Object.keys(v).forEach(function(k){ o[k] = fromJson(v[k], orig && orig[k]); }); return o;
  }
  return v;
}
function download(name, text, mime){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function csvOf(rows){ return '\ufeff' + rows.map(function(r){ return r.map(function(c){ var t = String(c == null ? '' : c); if(/^[=+\-@]/.test(t) && isNaN(Number(t))) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); }
function stamp(){ return new Date().toISOString().slice(0, 10); }

/* ------------------------------------------------------------------ style + sheets */
(function(){ if($('dmCss')) return; var st = document.createElement('style'); st.id = 'dmCss';
st.textContent = [
'.dm{font-size:14px;color:#1c2330}.dm *{box-sizing:border-box}',
'.dm-card{background:#fff;border:1px solid #ebe4cd;border-radius:16px;padding:14px;margin-bottom:12px}',
'.dm-h{font-size:15px;font-weight:700;margin:0 0 6px}.dm-sub{font-size:12px;color:#6b7280}.dm-flex{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.dm-grow{flex:1;min-width:0}',
'.dm-grid{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:700px){.dm-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:1100px){.dm-grid{grid-template-columns:repeat(3,1fr)}}',
'.dm-model{background:#fff;border:1px solid #ebe4cd;border-radius:14px;padding:12px;cursor:pointer;display:flex;gap:12px;align-items:flex-start}.dm-model:hover{border-color:#17325c;box-shadow:0 2px 8px rgba(23,50,92,.1)}',
'.dm-ic{font-size:26px;line-height:1;width:34px;text-align:center}.dm-cnt{font-size:11.5px;color:#17325c;background:#e9eef8;border-radius:99px;padding:1px 9px;display:inline-block;margin-top:4px}',
'.dm-btn{border:0;border-radius:10px;padding:9px 14px;font-weight:600;font-size:13px;cursor:pointer;background:#17325c;color:#fff;min-height:38px}',
'.dm-btn.ghost{background:#fff;color:#17325c;border:1.5px solid #cdd6e6}.dm-btn.red{background:#b23b3b}.dm-btn.sm{padding:5px 11px;min-height:32px;font-size:12px}.dm-btn:disabled{opacity:.45;cursor:not-allowed}',
'.dm-in,.dm-sel,.dm-ta{width:100%;padding:9px 11px;border:1.5px solid #d8dbe3;border-radius:10px;font-size:14px;background:#fff;color:#1c2330;font-family:inherit}.dm-ta{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;min-height:110px}',
'.dm-lab{display:block;font-size:12px;font-weight:600;color:#4b5563;margin:10px 0 3px}',
'.dm-row{display:flex;gap:10px;align-items:center;padding:10px 4px;border-top:1px solid #f0ead8;cursor:pointer}.dm-row:first-child{border-top:0}.dm-row:hover{background:#faf7ee}',
'.dm-kv{display:flex;gap:12px;flex-wrap:wrap;font-size:12.5px;margin-top:3px}.dm-kv span b{color:#6b7280;font-weight:600;margin-right:3px}',
'.dm-ov{position:fixed;inset:0;z-index:20000;background:rgba(10,19,34,.6);display:flex;align-items:flex-end;justify-content:center}',
'.dm-sheet{background:#fff;border-radius:18px 18px 0 0;width:100%;max-width:720px;max-height:94vh;overflow:auto;padding:18px;font-size:14px}@media(min-width:720px){.dm-ov{align-items:center}.dm-sheet{border-radius:18px}}',
'.dm-chip{display:inline-block;border-radius:99px;padding:2px 9px;font-size:11px;font-weight:600;background:#f3efe0;color:#5a5233;margin-right:4px}.dm-chip.red{background:#fde8e8;color:#b23b3b}.dm-chip.ok{background:#e4f5ea;color:#1e7b46}',
'.dm-field{border-top:1px solid #f0ead8;padding:8px 0}.dm-field:first-child{border-top:0}.dm-key{font-size:11px;color:#9ca3af}',
'.dm-bar2{height:9px;border-radius:99px;background:#e5e7eb;overflow:hidden;margin:10px 0}.dm-bar2 i{display:block;height:100%;width:0;background:linear-gradient(90deg,#17325c,#2b6ab8);transition:width .25s}',
'.dm-opt{border:1.5px solid #d8dbe3;border-radius:12px;padding:10px 12px;margin-bottom:8px;display:block;cursor:pointer}.dm-opt.on{border-color:#b23b3b;background:#fff6f6}',
'.dm-danger{border:1.5px solid #f3c9c9;background:#fff9f9}',
'.dm-act{display:flex;gap:6px;align-items:center;flex:none}',
'.dm-ib{border:1px solid #e1e6f2;background:#fff;border-radius:9px;width:34px;height:34px;font-size:15px;cursor:pointer;padding:0;line-height:1}.dm-ib:hover{background:#eef3ff;border-color:#17325c}.dm-ib.red:hover{background:#fdf1f1;border-color:#e3a3a3}',
'.dm-sw{border:0;border-radius:99px;padding:6px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}.dm-sw.on{background:#e4f5ea;color:#1e7b46}.dm-sw.off{background:#eceef3;color:#6b7280}',
'.dm-undo{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1c2330;color:#fff;border-radius:12px;padding:11px 14px;display:flex;gap:14px;align-items:center;z-index:100000;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:14px;max-width:92vw}.dm-undo button{background:#e6c878;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer;color:#1c2330}',
'.dm-opt{display:flex;gap:10px;align-items:flex-start;border:1.5px solid #e1e6f2;border-radius:12px;padding:10px 12px;margin-top:8px;cursor:pointer}.dm-opt.on{border-color:#17325c;background:#eef3ff}.dm-opt input{margin-top:3px;flex:none}.dm-opt b{display:block;font-size:14px}.dm-opt span{font-size:12.5px;color:#6b7280}',
'.dm-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}@media(min-width:700px){.dm-tools{grid-template-columns:repeat(5,1fr)}}',
'.dm-tool{background:#fff;border:1px solid #ebe4cd;border-radius:14px;padding:12px 10px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;color:#1c2330}.dm-tool:hover{border-color:#17325c;box-shadow:0 2px 8px rgba(23,50,92,.1)}.dm-tool span{font-size:22px}.dm-tool b{font-size:13.5px}.dm-tool i{font-style:normal;font-size:11.5px;color:#6b7280}'
].join('\n'); document.head.appendChild(st); })();
function sheet(html){ var w = document.createElement('div'); w.id = 'dmOv'; w.className = 'dm-ov dm'; w.innerHTML = '<div class="dm-sheet">' + html + '</div>'; document.body.appendChild(w); return w; }
function closeSheet(){ var w = $('dmOv'); if(w) w.remove(); }
function progress(title){
  var w = sheet('<h3 class="dm-h">' + esc(title) + '</h3><div class="dm-sub" id="pgTxt">Starting…</div><div class="dm-bar2"><i id="pgBar"></i></div><div id="pgBody"></div>');
  return { set: function(t, p){ if($('pgTxt')) $('pgTxt').textContent = t; if(typeof p === 'number' && $('pgBar')) $('pgBar').style.width = Math.min(100, Math.max(2, p)) + '%'; },
    body: function(h){ if($('pgBody')) $('pgBody').innerHTML = h; }, close: function(){ if(w.parentNode) w.remove(); } };
}

/* ------------------------------------------------------------------ database access */
function friendly(e){ if(e && e.code === 'permission-denied') e.message = 'Firebase refused this (permission denied). Publish the latest rules with: firebase deploy --only firestore'; return e; }
function countOf(coll){
  var M0 = MODELS[coll]; if(M0 && M0.fixed) return Promise.resolve(M0.fixed.length);
  if(M0 && M0.noList) return Promise.resolve(null);
  var q = db().collection(coll), capped = function(){ return q.limit(1000).get().then(function(s){ return s.size >= 1000 ? '1000+' : s.size; }, function(e){ throw friendly(e); }); };
  if(typeof q.count === 'function'){ try{ return q.count().get().then(function(s){ return s.data().count; }, capped); }catch(e){} }
  return capped();
}
function fetchPage(coll, after){
  var q = db().collection(coll).limit(PAGE); if(after) q = q.startAfter(after);
  return q.get().then(function(s){ return { docs: s.docs, last: s.docs[s.docs.length - 1], more: s.docs.length === PAGE }; }, function(e){ throw friendly(e); });
}
function fetchAll(coll, onProg){
  var M0 = MODELS[coll], out = [];
  if(M0 && M0.fixed) return Promise.all(M0.fixed.map(function(id){ return db().collection(coll).doc(id).get(); })).then(function(ds){ return ds.filter(function(d){ return d.exists; }); });
  if(M0 && M0.noList) return Promise.resolve([]);
  function step(after){ var q = db().collection(coll).limit(500); if(after) q = q.startAfter(after); return q.get().then(function(s){ s.docs.forEach(function(d){ out.push(d); }); if(onProg) onProg(out.length); return s.docs.length === 500 ? step(s.docs[s.docs.length - 1]) : out; }); }
  return step(null).catch(function(e){ throw friendly(e); });
}
function deleteDocs(refs, onProg){
  var done = 0, chunks = []; for(var i = 0; i < refs.length; i += 400) chunks.push(refs.slice(i, i + 400));
  return chunks.reduce(function(p, ch){ return p.then(function(){ var b = db().batch(); ch.forEach(function(r){ b.delete(r); }); return b.commit().then(function(){ done += ch.length; if(onProg) onProg(done); }); }); }, Promise.resolve()).then(function(){ return done; }, function(e){ throw friendly(e); });
}
function deleteWhole(coll, onProg){
  var total = 0;
  function loop(){ return db().collection(coll).limit(400).get().then(function(s){ if(s.empty) return total; var b = db().batch(); s.docs.forEach(function(d){ b.delete(d.ref); }); return b.commit().then(function(){ total += s.size; if(onProg) onProg(total); return s.size === 400 ? loop() : total; }); }); }
  return loop().catch(function(e){ throw friendly(e); });
}
function writeMany(items, onProg){        /* items: [{coll,id,data}] */
  var chunks = []; for(var i = 0; i < items.length; i += 350) chunks.push(items.slice(i, i + 350)), 0;
  var done = 0;
  return chunks.reduce(function(p, ch){ return p.then(function(){ var b = db().batch(); ch.forEach(function(it){ b.set(db().collection(it.coll).doc(it.id), it.data); }); return b.commit().then(function(){ done += ch.length; if(onProg) onProg(done); }); }); }, Promise.resolve()).then(function(){ return done; }, function(e){ throw friendly(e); });
}

/* ================================================================== HOME */
var S = { cReq: {}, view: 'home', coll: null, docs: [], last: null, more: false, q: '', sortKey: '', sel: {}, counts: {}, loading: false };
function render(){
  API = window.__acApi; var m = main(); if(!m) return;
  if(!OWNER){ m.innerHTML = '<div class="dm"><div class="dm-card"><b>🔒 Owner only</b><div class="dm-sub">The Data Manager can change or delete anything in the database, so only the Owner login can open it.</div></div></div>'; return; }
  if(S.view === 'model') return renderModel();
  var h = '<div class="dm"><div class="dm-card"><div class="dm-flex" style="flex-wrap:nowrap"><div class="dm-ic">🗄</div><div class="dm-grow"><div style="font-size:19px;font-weight:700">Data</div><div class="dm-sub">Everything about your data is here: look at it, fix it, back it up, restore it, check access, or start fresh. Shop settings are in Configuration.</div></div></div></div>' +
    '<div class="dm-tools">' +
      '<button type="button" class="dm-tool" id="dmBackup"><span>💾</span><b>Backup</b><i>Download everything</i></button>' +
      '<button type="button" class="dm-tool" id="dmRestore"><span>⬆</span><b>Restore</b><i>From a backup file</i></button>' +
      '<button type="button" class="dm-tool" id="dmCloud"><span>☁</span><b>Cloud sync</b><i>Publish / import old data</i></button>' +
      '<button type="button" class="dm-tool" id="dmCheck"><span>🛡</span><b>Check access</b><i>Find blocked collections</i></button>' +
      '<button type="button" class="dm-tool" id="dmFree"><span>📞</span><b>Free a phone</b><i>Let a deleted dealer register again</i></button>' +
    '</div>' +
    '<div class="dm-flex" style="margin-bottom:12px"><input class="dm-in" id="dmFind" placeholder="🔍 Find a topic (orders, dealers, stock…)" style="flex:1;min-width:200px"></div>';
  var q = ($('dmFind') ? $('dmFind').value : '').toLowerCase();
  GROUPS.forEach(function(g){
    var list = g[1].filter(function(mm){ return !q || (mm.title + ' ' + mm.desc + ' ' + mm.id).toLowerCase().indexOf(q) >= 0; });
    if(!list.length) return;
    h += '<div class="dm-h" style="margin:14px 2px 8px">' + g[0] + '</div><div class="dm-grid">' + list.map(function(mm){
      var c = S.counts[mm.id];
      return '<div class="dm-model" data-m="' + mm.id + '"><div class="dm-ic">' + mm.icon + '</div><div class="dm-grow"><b>' + esc(mm.title) + '</b>' + (mm.sensitive ? ' <span class="dm-chip red">sensitive</span>' : '') + '<div class="dm-sub">' + esc(mm.desc) + '</div>' + (TEMPLATES[mm.id] ? '<button type="button" class="dm-btn sm" data-add="' + mm.id + '" style="margin:6px 8px 0 0">＋ Add</button>' : '') + '<span class="dm-cnt" data-cnt="' + mm.id + '">' + (c === undefined ? 'counting…' : c === null ? 'protected' : c + ' record' + (c === 1 ? '' : 's')) + '</span></div></div>'; }).join('') + '</div>';
  });
  h += '<div class="dm-card dm-danger" style="margin-top:18px"><div class="dm-h" style="color:#b23b3b">☢ Delete data / Factory reset</div><div class="dm-sub" style="margin-bottom:10px">Wipe selected data (orders, dealers, catalogue, distributors …) or everything and start fresh. You choose exactly what goes, and you can download a backup first.</div><button class="dm-btn red" id="dmReset">Open delete / factory reset…</button></div></div>';
  m.innerHTML = h;
  m.querySelectorAll('[data-m]').forEach(function(el){ el.onclick = function(){ openModel(el.getAttribute('data-m')); }; });
  m.querySelectorAll('[data-add]').forEach(function(el){ el.onclick = function(e){ e.stopPropagation(); openDoc(el.getAttribute('data-add'), null, null); }; });
  $('dmFind').oninput = function(){ var v = $('dmFind').value, p = $('dmFind').selectionStart; render(); var f = $('dmFind'); f.value = v; f.focus(); try{ f.setSelectionRange(p, p); }catch(e){} };
  $('dmFind').value = q;
  $('dmBackup').onclick = backupAll; $('dmRestore').onclick = restoreFlow; $('dmReset').onclick = function(){ openReset(); };
  $('dmCloud').onclick = function(){ if(CLOUD.openAdminPanel) CLOUD.openAdminPanel(); }; $('dmCheck').onclick = accessCheck; $('dmFree').onclick = freePhoneSheet;
  // counts load in the background, one by one (cheap aggregate queries)
  GROUPS.forEach(function(g){ g[1].forEach(function(mm){
    if(S.cReq[mm.id]) return; S.cReq[mm.id] = 1;
    countOf(mm.id).then(function(c){ S.counts[mm.id] = c; var el = document.querySelector('[data-cnt="' + mm.id + '"]'); if(el) el.textContent = c === null ? 'protected' : c + ' record' + (c === 1 ? '' : 's'); },
      function(e){ S.counts[mm.id] = null; var el = document.querySelector('[data-cnt="' + mm.id + '"]'); if(el) el.textContent = e && e.code === 'permission-denied' ? 'no access' : 'unavailable'; }); }); });
}

/* ================================================================== one model */
function openModel(id){ S.view = 'model'; S.coll = id; S.docs = []; S.last = null; S.more = false; S.q = ''; S.sortKey = ''; S.sel = {}; S.loaded = false; render(); loadMore(true); }
function loadMore(first){
  var mm = MODELS[S.coll]; if(mm.noList){ S.loaded = true; renderModel(); return; }
  S.loading = true; renderModel();
  var p = mm.fixed ? fetchAll(S.coll).then(function(ds){ return { docs: ds, last: null, more: false }; }) : fetchPage(S.coll, first ? null : S.last);
  p.then(function(r){ S.docs = first ? r.docs : S.docs.concat(r.docs); S.last = r.last; S.more = r.more; S.loading = false; S.loaded = true; renderModel(); }, function(e){ S.loading = false; S.loaded = true; S.err = e.message; renderModel(); });
}
function colsFor(mm){
  var present = {}; S.docs.slice(0, 40).forEach(function(d){ Object.keys(d.data()).forEach(function(k){ present[k] = 1; }); });
  var cols = mm.cols.filter(function(k){ return present[k]; });
  if(!cols.length) cols = Object.keys(present).filter(function(k){ var v = (S.docs[0] ? S.docs[0].data()[k] : null); return v === null || typeof v !== 'object' || isTs(v); }).slice(0, 5);
  return cols.slice(0, 5);
}
function matches(d, q){ if(!q) return true; if(d.id.toLowerCase().indexOf(q) >= 0) return true; try{ return JSON.stringify(toJson(d.data())).toLowerCase().indexOf(q) >= 0; }catch(e){ return false; } }
function renderModel(){
  var mm = MODELS[S.coll], m = main(), q = S.q.toLowerCase().trim(), cols = colsFor(mm);
  var rows = S.docs.filter(function(d){ return matches(d, q); });
  if(S.sortKey){ var k = S.sortKey; rows = rows.slice().sort(function(a, b){ var x = a.data()[k], y = b.data()[k]; if(isTs(x)) x = x.seconds; if(isTs(y)) y = y.seconds; if(typeof x === 'number' && typeof y === 'number') return y - x; return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, { numeric: true }); }); }
  var nSel = Object.keys(S.sel).length;
  var h = '<div class="dm"><div class="dm-flex" style="margin-bottom:10px"><button class="dm-btn ghost sm" id="mBack">← All topics</button></div>' +
    '<div class="dm-card"><div class="dm-flex" style="flex-wrap:nowrap"><div class="dm-ic">' + mm.icon + '</div><div class="dm-grow"><div style="font-size:18px;font-weight:700">' + esc(mm.title) + '</div><div class="dm-sub">' + esc(mm.desc) + ' <span style="color:#9ca3af">· collection “' + esc(mm.id) + '”</span></div></div></div>' +
    (mm.sensitive ? '<div class="dm-sub" style="color:#b23b3b;margin-top:8px">⚠ Sensitive data — changing it can lock people out. Edit only if you know why.</div>' : '') +
    '<div class="dm-flex" style="margin-top:10px">' + (mm.noList ? '' : '<button class="dm-btn sm" id="mNew">＋ Add record</button><button class="dm-btn ghost sm" id="mJson">⬇ Export JSON</button><button class="dm-btn ghost sm" id="mCsv">⬇ Export CSV</button><button class="dm-btn ghost sm" id="mImp">⬆ Import JSON</button>') + (mm.fixed || mm.id === 'admins' ? '' : '<button class="dm-btn ghost sm" id="mDelAll" style="color:#b23b3b;border-color:#f0c4c4">🗑 Delete all records here</button>') + '</div></div>';
  if(mm.noList){ h += '<div class="dm-card"><div class="dm-sub">This table is a protected lookup used at sign-in. It cannot be listed. It is rebuilt automatically when you create or reset logins.</div></div></div>'; m.innerHTML = h; $('mBack').onclick = function(){ S.view = 'home'; render(); }; return; }
  h += '<div class="dm-flex" style="margin-bottom:8px"><input class="dm-in" id="mQ" placeholder="🔍 Search by ID or any value…" value="' + esc(S.q) + '" style="flex:1;min-width:180px"><select class="dm-sel" id="mSort" style="width:auto"><option value="">Sort: default</option>' + cols.map(function(c){ return '<option value="' + esc(c) + '"' + (S.sortKey === c ? ' selected' : '') + '>Sort: ' + esc(humanize(c)) + '</option>'; }).join('') + '</select></div>';
  if(nSel) h += '<div class="dm-card dm-flex" style="padding:8px 12px"><b>' + nSel + ' selected</b><button class="dm-btn red sm" id="mDelSel">Delete selected</button><button class="dm-btn ghost sm" id="mClr">Clear</button></div>';
  if(S.err) h += '<div class="dm-card" style="color:#b23b3b">' + esc(S.err) + '</div>';
  if(S.loaded && rows.length) h += '<label class="dm-sub" style="display:flex;gap:8px;align-items:center;margin:2px 4px 8px;cursor:pointer"><input type="checkbox" id="mSelAll" style="width:18px;height:18px"' + (rows.every(function(d){ return S.sel[d.id]; }) ? ' checked' : '') + '> Select all shown (' + rows.length + ')</label>';
  h += '<div class="dm-card" style="padding:4px 10px">' + (!S.loaded ? (window.acLoader ? window.acLoader.skeleton(5) : 'Loading…') : !rows.length ? '<div class="dm-sub" style="padding:22px;text-align:center">' + (S.docs.length ? 'Nothing matches “' + esc(S.q) + '”.' : 'No records yet.') + '</div>' : rows.map(function(d){
    var data = d.data();
    return '<div class="dm-row" data-d="' + esc(d.id) + '"><input type="checkbox" data-sel="' + esc(d.id) + '"' + (S.sel[d.id] ? ' checked' : '') + ' style="width:18px;height:18px"><div class="dm-grow"><b>' + esc(titleOf(mm, d)) + '</b><div class="dm-kv">' + cols.slice(0, 4).map(function(c){ return '<span><b>' + esc(humanize(c)) + '</b>' + fmt(c, data[c]) + '</span>'; }).join('') + '</div><div class="dm-key">ID: ' + esc(d.id) + '</div></div>' + rowActions(mm, d, data) + '</div>'; }).join('')) +
    (S.loading && S.loaded ? '<div class="dm-sub" style="padding:10px">Loading…</div>' : '') + '</div>';
  h += '<div class="dm-sub" style="text-align:center;margin-bottom:6px">Showing ' + rows.length + (rows.length !== S.docs.length ? ' of ' + S.docs.length + ' loaded' : '') + ' record' + (rows.length === 1 ? '' : 's') + '</div>';
  if(S.more) h += '<div class="dm-flex" style="justify-content:center"><button class="dm-btn ghost" id="mMore">Load more</button><button class="dm-btn ghost" id="mAll">Load everything (for full search)</button></div>';
  m.innerHTML = h + '</div>';
  $('mBack').onclick = function(){ S.view = 'home'; render(); };
  if($('mNew')) $('mNew').onclick = function(){ openDoc(mm.id, null, null); };
  if($('mJson')) $('mJson').onclick = function(){ exportModel(mm, 'json'); }; if($('mCsv')) $('mCsv').onclick = function(){ exportModel(mm, 'csv'); }; if($('mImp')) $('mImp').onclick = function(){ importFlow(mm.id); };
  if($('mDelAll')) $('mDelAll').onclick = function(){ openReset(mm.id); };
  $('mQ').oninput = function(e){ S.q = e.target.value; var p = e.target.selectionStart; clearTimeout(S.qt); S.qt = setTimeout(function(){ renderModel(); var f = $('mQ'); if(f){ f.focus(); try{ f.setSelectionRange(p, p); }catch(x){} } }, 220); };
  $('mSort').onchange = function(e){ S.sortKey = e.target.value; renderModel(); };
  if($('mMore')) $('mMore').onclick = function(){ loadMore(false); };
  if($('mAll')) $('mAll').onclick = function(){ var pg = progress('Loading all records…'); fetchAll(S.coll, function(n){ pg.set(n + ' loaded…'); }).then(function(ds){ S.docs = ds; S.more = false; pg.close(); renderModel(); }, function(e){ pg.close(); toast(e.message); }); };
  if($('mDelSel')) $('mDelSel').onclick = deleteSelected; if($('mClr')) $('mClr').onclick = function(){ S.sel = {}; renderModel(); };
  var selAll = $('mSelAll'); if(selAll) selAll.onchange = function(){ rows.forEach(function(d){ if(selAll.checked) S.sel[d.id] = 1; else delete S.sel[d.id]; }); renderModel(); };
  m.querySelectorAll('[data-act]').forEach(function(b){ b.onclick = function(e){
    e.stopPropagation(); var id = b.closest('[data-d]').getAttribute('data-d'), d = S.docs.filter(function(x){ return x.id === id; })[0]; if(!d) return;
    var act = b.getAttribute('data-act');
    if(act === 'edit') openDoc(mm.id, d.id, d);
    else if(act === 'copy') openDoc(mm.id, null, null, copyOf(d.data()));
    else if(act === 'del'){ S.sel = {}; S.sel[id] = 1; deleteSelected(); var no = $('xNo'); if(no) no.onclick = function(){ closeSheet(); S.sel = {}; renderModel(); }; }
    else if(act === 'toggle'){
      var k = b.getAttribute('data-k'), patch = {}; patch[k] = !d.data()[k]; b.disabled = true;
      db().collection(mm.id).doc(id).update(patch).then(function(){ return db().collection(mm.id).doc(id).get(); }).then(function(nd){ S.docs = S.docs.map(function(x){ return x.id === id ? nd : x; }); logAudit('Data updated', mm.title + ' ' + id + ': ' + k + ' → ' + patch[k]); renderModel(); }, function(er){ b.disabled = false; toast(friendly(er).message); });
    }
  }; });
  m.querySelectorAll('[data-d]').forEach(function(row){ row.onclick = function(e){ if(e.target.getAttribute('data-sel') !== null || e.target.closest('[data-act]')) return; var d = S.docs.filter(function(x){ return x.id === row.getAttribute('data-d'); })[0]; openDoc(mm.id, d.id, d); }; });
  m.querySelectorAll('[data-sel]').forEach(function(c){ c.onchange = function(){ if(c.checked) S.sel[c.getAttribute('data-sel')] = 1; else delete S.sel[c.getAttribute('data-sel')]; renderModel(); }; });
}
/* one-tap actions on every row: show/hide switch, edit, copy, delete */
var SWITCH_KEYS = ['active', 'isActive', 'visible'];
function switchKey(data){ for(var i = 0; i < SWITCH_KEYS.length; i++) if(typeof data[SWITCH_KEYS[i]] === 'boolean') return SWITCH_KEYS[i]; return null; }
function rowActions(mm, d, data){
  var sk = switchKey(data), canEditOnly = mm.fixed || mm.id === 'admins', canCopy = !!TEMPLATES[mm.id];    // a copy only makes sense where the ID is generated for you (not dealers, accounts, stock …)
  return '<div class="dm-act">' + (sk ? '<button type="button" class="dm-sw ' + (data[sk] ? 'on' : 'off') + '" data-act="toggle" data-k="' + sk + '" title="Tap to turn ' + (data[sk] ? 'off' : 'on') + '">' + (data[sk] ? '● On' : '○ Off') + '</button>' : '') +
    '<button type="button" class="dm-ib" data-act="edit" title="Edit">✏</button>' + (canEditOnly ? '' : (canCopy ? '<button type="button" class="dm-ib" data-act="copy" title="Duplicate">📋</button>' : '') + '<button type="button" class="dm-ib red" data-act="del" title="Delete">🗑</button>') + '</div>';
}
function copyOf(data){
  var o = toJson(data); delete o.id; ['name', 'title'].some(function(k){ if(typeof o[k] === 'string' && o[k]){ o[k] = o[k] + ' (copy)'; return true; } return false; });
  return fromJson(o);
}
var UNDO_BLOCK = ['dealers', 'accounts', 'dist_logins', 'admins', 'login_index'];
function showUndo(text, fn){
  var old = $('dmUndo'); if(old) old.remove();
  var bar = document.createElement('div'); bar.id = 'dmUndo'; bar.className = 'dm-undo'; bar.innerHTML = '<span>' + esc(text) + '</span><button type="button" id="dmUndoBtn">↩ Undo</button>';
  document.body.appendChild(bar);
  var t0 = setTimeout(function(){ if(bar.parentNode) bar.remove(); }, 10000);
  $('dmUndoBtn').onclick = function(){ clearTimeout(t0); bar.remove(); fn(); };
}
function titleOf(mm, d){ var x = d.data(); var k = ['name', 'title', 'business', 'no', 'username', 'id', 'part'].filter(function(k){ return x[k] !== undefined && x[k] !== null && typeof x[k] !== 'object'; })[0]; return k ? String(x[k]) : d.id; }
function deleteSelected(){
  var ids = Object.keys(S.sel), mm = MODELS[S.coll];
  if(S.coll === 'admins' && ids.indexOf(CLOUD.uid) >= 0){ toast('You cannot delete your own login'); return; }
  var w = sheet('<h3 class="dm-h" style="color:#b23b3b">Delete ' + ids.length + ' record' + (ids.length > 1 ? 's' : '') + ' from ' + esc(mm.title) + '?</h3><div class="dm-sub">This cannot be undone. Consider exporting first.</div><div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn ghost" id="xNo">Cancel</button><button class="dm-btn red" id="xYes">Delete</button></div>');
  $('xNo').onclick = closeSheet;
  $('xYes').onclick = function(){ $('xYes').disabled = true; var coll0 = S.coll, docs0 = S.docs.filter(function(d){ return S.sel[d.id]; });
    deleteDocs(ids.map(function(id){ return db().collection(coll0).doc(id); })).then(function(n){ return cleanLookup(coll0, docs0).then(function(){ return n; }); }).then(function(n){ S.docs = S.docs.filter(function(d){ return !S.sel[d.id]; }); S.sel = {}; S.cReq[S.coll] = 0; closeSheet(); toast('Deleted ' + n); logAudit('Data deleted', mm.title + ': ' + n + ' record(s)'); renderModel();
      if(UNDO_BLOCK.indexOf(coll0) < 0 && docs0.length) showUndo('Deleted ' + n + ' from ' + mm.title, function(){ var pg = progress('Putting records back…'); writeMany(docs0.map(function(d){ return { coll: coll0, id: d.id, data: d.data() }; })).then(function(c){ pg.close(); S.counts = {}; S.cReq = {}; logAudit('Delete undone', mm.title + ': ' + c + ' record(s)'); toast('Restored ' + c + ' record(s)'); if(S.view === 'model' && S.coll === coll0) loadMore(true); }, function(er){ pg.close(); toast(friendly(er).message); }); }); }, function(e){ $('xYes').disabled = false; toast(e.message); }); };
}
/* deleting a login record must also free its login ID (otherwise “already exists” comes back) */
function cleanLookup(coll, docs){
  var refs = [];
  if(coll === 'accounts'){ return docs.reduce(function(p, d){ return p.then(function(){ return bumpPhone(normPh(d.id)); }).catch(function(){}); }, Promise.resolve()); }
  if(coll === 'dealers'){
    docs.forEach(function(d){ refs.push(db().collection('login_index').doc('gst_' + d.id)); });
    var phs = docs.map(function(d){ return normPh(d.data().accountKey || d.data().phone); });
    return deleteDocs(refs).catch(function(){}).then(function(){ return releasePhonesIfEmpty(phs); });
  }
  docs.forEach(function(d){ var u = d.data().username; if(!u) return; u = String(u).toLowerCase();
    if(coll === 'dist_logins') refs.push(db().collection('login_index').doc(u)); if(coll === 'admins') refs.push(db().collection('login_index').doc('staff_' + u)); });
  return refs.length ? deleteDocs(refs).catch(function(){}) : Promise.resolve();
}
function logAudit(a, d){ try{ API.logAudit(a, d); }catch(e){} }

/* A deleted dealer's sign-in account stays in Firebase Authentication (a website cannot remove it). To let the same phone number register again
   with ANY password, the login is moved on to its next "generation" (dealer_<phone>); the old sign-in simply stops being used. */
function normPh(x){ return String(x || '').replace(/\D/g, ''); }
function bumpPhone(ph){
  return db().collection('login_index').doc('dealer_' + ph).get().then(function(d){ var g = d.exists ? Number(d.data().gen) || 0 : 0; return db().collection('login_index').doc('dealer_' + ph).set({ gen: g + 1, at: Date.now(), released: true }); })
    .then(function(){ return db().collection('accounts').doc(ph).delete().catch(function(){}); });
}
function releasePhonesIfEmpty(phones){
  var list = phones.filter(function(x, i, a){ return x && a.indexOf(x) === i; });
  return list.reduce(function(p, ph){ return p.then(function(){
    return db().collection('dealers').where('accountKey', '==', ph).limit(1).get().then(function(s){ if(s.empty) return bumpPhone(ph); });
  }).catch(function(){}); }, Promise.resolve());
}
function freePhoneSheet(){
  var w = sheet('<h3 class="dm-h">📞 Free a phone number</h3><div class="dm-sub">Use this when a dealer was deleted but cannot register again with the same phone number. All his businesses must already be deleted. His old login is retired and the number can register with any password.</div>' +
    '<label class="dm-lab">Phone number</label><input class="dm-in" id="fpNum" type="tel" inputmode="numeric" maxlength="10"><div class="dm-err" id="fpMsg" style="font-size:12.5px;margin-top:8px"></div>' +
    '<div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn ghost" id="fpNo">Close</button><button class="dm-btn" id="fpGo">Free this number</button></div>');
  $('fpNo').onclick = closeSheet;
  $('fpGo').onclick = function(){
    var ph = normPh($('fpNum').value), m = $('fpMsg'); m.style.color = '#b23b3b'; m.textContent = '';
    if(!/^[0-9]{10}$/.test(ph)){ m.textContent = 'Enter the 10-digit phone number.'; return; }
    $('fpGo').disabled = true;
    db().collection('dealers').where('accountKey', '==', ph).get().then(function(sn){
      if(!sn.empty){ m.textContent = 'This number still has ' + sn.size + ' business(es): ' + sn.docs.map(function(d){ return d.data().business || d.id; }).join(', ') + '. Delete them first.'; $('fpGo').disabled = false; return; }
      return bumpPhone(ph).then(function(){ logAudit('Phone freed', ph); m.style.color = '#1e7b46'; m.textContent = '✔ Done. This number can register again.'; $('fpGo').disabled = false; });
    }).catch(function(e){ m.textContent = friendly(e).message || 'Could not free the number.'; $('fpGo').disabled = false; });
  };
}
/* read every collection once and show which ones this login is blocked from — the quickest way to find a rules problem */
function accessCheck(){
  var pg = progress('Checking access…'), rows = [];
  var ids = []; GROUPS.forEach(function(g){ g[1].forEach(function(mm){ if(!mm.fixed && !mm.noList) ids.push(mm.id); }); });
  var chain = ids.reduce(function(p, id, i){ return p.then(function(){
    pg.set('Checking ' + MODELS[id].title + '…', 5 + 90 * i / ids.length);
    return db().collection(id).limit(1).get().then(function(){ rows.push([MODELS[id].title, id, true]); }, function(e){ rows.push([MODELS[id].title, id, false, e && e.code]); });
  }); }, Promise.resolve());
  chain.then(function(){
    var bad = rows.filter(function(r){ return !r[2]; });
    pg.set(bad.length ? bad.length + ' blocked' : 'All good', 100);
    pg.body(rows.map(function(r){ return '<div class="dm-flex" style="justify-content:space-between;border-top:1px solid #f0ead8;padding:6px 0"><span>' + esc(r[0]) + ' <span class="dm-sub">' + esc(r[1]) + '</span></span><b style="color:' + (r[2] ? '#1e7b46' : '#b23b3b') + '">' + (r[2] ? '✔ OK' : '✖ ' + esc(r[3] || 'error')) + '</b></div>'; }).join('') +
      (bad.length ? '<div class="dm-sub" style="color:#b23b3b;margin-top:10px">Some collections are blocked. Publish the latest rules: <code>firebase deploy --only firestore:rules</code> (and refresh this page).</div>' : '<div class="dm-sub" style="color:#1e7b46;margin-top:10px">Every collection can be read. Nothing is blocked.</div>') +
      '<div class="dm-flex" style="justify-content:flex-end;margin-top:12px"><button class="dm-btn" id="acClose">Close</button></div>');
    $('acClose').onclick = closeSheet;
  });
}

/* ================================================================== the record editor (friendly form + raw JSON) */
function typeOf(v){ if(v === null || v === undefined) return 'null'; if(isTs(v)) return 'timestamp'; if(isSpecial(v)) return 'kept'; if(typeof v === 'boolean') return 'boolean'; if(typeof v === 'number') return 'number'; if(typeof v === 'string') return 'string'; return 'json'; }
/* Guided "Add record": the right fields, in the right order, with a hint under each, an automatic ID and a check for the must-fill ones. */
var TEMPLATES = {
  products: { idMode: 'number', required: ['name', 'mrp'], fields: [['name', 'string', '', 'Product name dealers see'], ['size', 'string', '', 'e.g. 2½" · Std class'], ['part', 'string', '', 'Your item / part code'], ['cat', 'string', '', 'Category id (see Categories)'], ['mrp', 'number', 0, 'Printed price in ₹'], ['discountPct', 'number', 0, 'Discount given to dealers, %'], ['gstPct', 'number', 18, 'GST %'], ['active', 'boolean', true, 'Show to dealers']] },
  catalog_categories: { idMode: 'slug', required: ['name'], fields: [['name', 'string', '', 'Category name']] },
  catalog_subcategories: { idMode: 'slug', required: ['name', 'categoryId'], fields: [['name', 'string', '', 'Sub-category name'], ['categoryId', 'string', '', 'ID of the category it belongs to']] },
  offers: { idMode: 'number', required: ['title'], fields: [['badge', 'string', '', 'Small tag, e.g. NEW'], ['title', 'string', '', 'Offer title'], ['desc', 'string', '', 'Short description'], ['linkType', 'string', 'url', 'url or product'], ['linkValue', 'string', '', 'Where the offer opens'], ['active', 'boolean', true, 'Show to dealers']] },
  banners: { idMode: 'number', required: ['title'], fields: [['title', 'string', '', 'Big text on the banner'], ['subtitle', 'string', '', 'Smaller text'], ['imageUrl', 'string', '', 'Picture web address (optional)'], ['buttonText', 'string', '', 'Text on the button (optional)'], ['linkType', 'string', 'url', 'url or product'], ['linkValue', 'string', '', 'Where the banner opens'], ['size', 'string', 'medium', 'small / medium / large'], ['active', 'boolean', true, 'Show to dealers']] },
  broadcasts: { idMode: 'number', required: ['en'], fields: [['en', 'string', '', 'Message every dealer will see'], ['ts', 'number', 'NOW', 'Time — filled in automatically']] }
};
function tplSlug(x){ return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
function tplNextId(coll){
  return db().collection(coll).orderBy('id', 'desc').limit(1).get().then(function(sn){ var m = sn.empty ? 0 : Number(sn.docs[0].data().id) || 0; return m + 1; }, function(){ return Date.now(); });
}
function openDoc(coll, id, snap, prefill){
  var mm = MODELS[coll], orig = snap ? snap.data() : (prefill || {}), isNew = !snap;
  if(isNew && !prefill && S.docs[0]){ var t = S.docs[0].data(); Object.keys(t).forEach(function(k){ var ty = typeOf(t[k]); orig[k] = ty === 'number' ? 0 : ty === 'boolean' ? false : ty === 'string' ? '' : ty === 'json' ? (Array.isArray(t[k]) ? [] : {}) : null; }); }
  var tplAny = isNew ? TEMPLATES[coll] : null, tpl = isNew && !prefill ? TEMPLATES[coll] : null, hints = {};
  if(isNew && prefill && tplAny){ orig = Object.assign({}, prefill); delete orig.id; }
  if(tpl){ orig = {}; tpl.fields.forEach(function(f){ orig[f[0]] = f[2] === 'NOW' ? Date.now() : f[2]; hints[f[0]] = f[3]; }); }
  var rows = Object.keys(orig).map(function(k){ return { key: k, type: typeOf(orig[k]), val: orig[k], hint: hints[k] }; });
  var mode = 'form';
  var w = sheet('<div class="dm-flex" style="justify-content:space-between"><h3 class="dm-h" style="margin:0">' + (isNew ? 'Add record — ' : 'Edit — ') + esc(mm.title) + '</h3><div class="dm-flex"><button class="dm-btn ghost sm" id="eForm">Form</button><button class="dm-btn ghost sm" id="eJson">Advanced (JSON)</button></div></div>' +
    (mm.sensitive ? '<div class="dm-sub" style="color:#b23b3b;margin-top:6px">⚠ Sensitive record — be careful.</div>' : '') +
    '<label class="dm-lab">Record ID' + (isNew ? ' (leave empty to create one automatically)' : ' (cannot be changed — use Duplicate to copy)') + '</label><input class="dm-in" id="eId" value="' + esc(id || '') + '"' + (isNew ? '' : ' disabled') + (mm.fixed && isNew ? '' : '') + '>' +
    '<div id="eBody"></div><div class="dm-err" id="eErr" style="color:#b23b3b;font-size:12.5px;margin-top:8px"></div>' +
    '<div class="dm-flex" style="margin-top:14px;justify-content:space-between"><div class="dm-flex">' + (isNew ? '' : '<button class="dm-btn ghost sm" id="eDup">Duplicate</button><button class="dm-btn ghost sm" id="eDel" style="color:#b23b3b;border-color:#f0c4c4">Delete</button>') + '</div><div class="dm-flex"><button class="dm-btn ghost" id="eNo">Cancel</button><button class="dm-btn" id="eYes">Save</button></div></div>');
  function typeOpts(sel){ return [['string', 'Text'], ['number', 'Number'], ['boolean', 'Yes / No'], ['json', 'List / group (JSON)'], ['null', 'Empty']].map(function(o){ return '<option value="' + o[0] + '"' + (sel === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); }
  function inputFor(r, i){
    var v = r.val, id2 = 'ef' + i;
    if(r.type === 'boolean') return '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="' + id2 + '"' + (v ? ' checked' : '') + ' style="width:20px;height:20px"> ' + (v ? 'Yes' : 'No') + '</label>';
    if(r.type === 'number') return '<input class="dm-in" type="number" step="any" id="' + id2 + '" value="' + esc(v) + '">';
    if(r.type === 'timestamp') return '<input class="dm-in" id="' + id2 + '" value="' + esc(isTs(v) ? v.toDate().toISOString() : v) + '"><div class="dm-key">Date & time (ISO format)</div>';
    if(r.type === 'json') return '<textarea class="dm-ta" id="' + id2 + '" rows="4">' + esc(JSON.stringify(toJson(v), null, 2)) + '</textarea>';
    if(r.type === 'kept') return '<div class="dm-sub">Special value — kept exactly as it is.</div>';
    if(r.type === 'null') return '<input class="dm-in" id="' + id2 + '" value="" placeholder="(empty)">';
    var long = String(v).length > 70 || String(v).indexOf('\n') >= 0;
    return long ? '<textarea class="dm-ta" style="font-family:inherit;font-size:14px" id="' + id2 + '" rows="3">' + esc(v) + '</textarea>' : '<input class="dm-in" id="' + id2 + '" value="' + esc(v) + '">';
  }
  function paint(){
    if(mode === 'json'){ $('eBody').innerHTML = '<label class="dm-lab">Whole record as JSON</label><textarea class="dm-ta" id="eRaw" rows="16">' + esc(JSON.stringify(toJson(collect(true)), null, 2)) + '</textarea><div class="dm-key">Dates appear as {"$timestamp": "…"}. Keep them in that form.</div>'; return; }
    $('eBody').innerHTML = rows.map(function(r, i){ return '<div class="dm-field"><div class="dm-flex" style="justify-content:space-between"><div><b>' + esc(humanize(r.key)) + '</b> <span class="dm-key">' + esc(r.key) + '</span>' + (r.hint ? '<div class="dm-key" style="margin:2px 0 4px">' + esc(r.hint) + (tpl && tpl.required.indexOf(r.key) >= 0 ? ' <b style="color:#b23b3b">· required</b>' : '') + '</div>' : '') + '</div><button class="dm-btn ghost sm" data-rm="' + i + '" title="Remove this field">✕</button></div>' + inputFor(r, i) + '</div>'; }).join('') +
      '<div class="dm-field"><b>Add a field</b><div class="dm-flex" style="margin-top:6px;flex-wrap:nowrap"><input class="dm-in" id="nfKey" placeholder="field name"><select class="dm-sel" id="nfType" style="width:auto">' + typeOpts('string') + '</select><button class="dm-btn sm" id="nfAdd">Add</button></div></div>';
    $('eBody').querySelectorAll('[data-rm]').forEach(function(b){ b.onclick = function(){ syncRows(); rows.splice(Number(b.getAttribute('data-rm')), 1); paint(); }; });
    $('nfAdd').onclick = function(){ var k = $('nfKey').value.trim(); if(!k || /[\/.]/.test(k) || rows.some(function(r){ return r.key === k; })){ toast('Enter a new field name (no dots or slashes)'); return; } syncRows(); var t = $('nfType').value; rows.push({ key: k, type: t, val: t === 'number' ? 0 : t === 'boolean' ? false : t === 'json' ? {} : t === 'null' ? null : '' }); paint(); };
  }
  function syncRows(){ rows.forEach(function(r, i){ var el = $('ef' + i); if(!el) return; if(r.type === 'boolean') r.val = el.checked; else if(r.type === 'number') r.val = el.value === '' ? 0 : Number(el.value); else if(r.type === 'json'){ try{ r.val = fromJson(JSON.parse(el.value), r.val); r.bad = false; }catch(e){ r.bad = true; } } else if(r.type === 'timestamp') r.val = el.value; else if(r.type === 'null') r.val = el.value === '' ? null : el.value; else if(r.type === 'string') r.val = el.value; }); }
  function collect(soft){
    if(mode === 'json' && $('eRaw')){ var p = JSON.parse($('eRaw').value); return fromJson(p, orig); }
    syncRows(); var out = {};
    rows.forEach(function(r){
      if(r.bad && !soft) throw new Error('“' + humanize(r.key) + '” is not valid JSON');
      var v = r.val;
      if(r.type === 'timestamp'){ var d = isTs(v) ? v : new Date(v); if(!isTs(v)){ if(isNaN(d.getTime())){ if(soft) { out[r.key] = null; return; } throw new Error('“' + humanize(r.key) + '” is not a valid date'); } v = FS().Timestamp.fromDate(d); } }
      if(r.type === 'number' && !isFinite(Number(v))){ if(!soft) throw new Error('“' + humanize(r.key) + '” must be a number'); v = 0; }
      out[r.key] = v;
    });
    return out;
  }
  paint();
  if(tplAny && tplAny.idMode === 'number'){ tplNextId(coll).then(function(n){ var el = $('eId'); if(el && !el.value) el.value = String(n); }); }
  $('eForm').onclick = function(){ if(mode === 'form') return; try{ var o = collect(); rows = Object.keys(o).map(function(k){ return { key: k, type: typeOf(o[k]), val: o[k] }; }); mode = 'form'; paint(); }catch(e){ $('eErr').textContent = 'The JSON is not valid: ' + e.message; } };
  $('eJson').onclick = function(){ if(mode === 'json') return; try{ collect(); mode = 'json'; paint(); }catch(e){ $('eErr').textContent = e.message; } };
  $('eNo').onclick = closeSheet;
  $('eYes').onclick = function(){
    $('eErr').textContent = '';
    var out; try{ out = collect(); }catch(e){ $('eErr').textContent = e.message; return; }
    var did = isNew ? $('eId').value.trim() : id;
    if(tplAny){
      var miss = tplAny.required.filter(function(k){ return out[k] === undefined || out[k] === null || String(out[k]).trim() === '' || (k === 'mrp' && !(Number(out[k]) > 0)); });
      if(miss.length){ $('eErr').textContent = 'Please fill in: ' + miss.map(humanize).join(', ') + '.'; return; }
      if(!did) did = tplAny.idMode === 'slug' ? tplSlug(out.name) : String(Date.now());
      if(!did){ $('eErr').textContent = 'Please give this record a name or an ID.'; return; }
      out.id = tplAny.idMode === 'number' && /^[0-9]+$/.test(did) ? Number(did) : did;
    }
    if(/[\/]/.test(did || '')){ $('eErr').textContent = 'The ID cannot contain “/”.'; return; }
    var ref = did ? db().collection(coll).doc(did) : db().collection(coll).doc();
    var go = function(){ $('eYes').disabled = true; ref.set(out).then(function(){ logAudit(isNew ? 'Data added' : 'Data edited', mm.title + ' / ' + ref.id); toast('Saved'); closeSheet(); S.cReq[coll] = 0; if(S.view === 'model') loadMore(true); }, function(e){ $('eYes').disabled = false; $('eErr').textContent = friendly(e).message; }); };
    if(isNew && did){ ref.get().then(function(d){ if(d.exists && !confirm('A record with ID “' + did + '” already exists. Replace it?')) return; go(); }, go); } else go();
  };
  if($('eDup')) $('eDup').onclick = function(){ try{ var o = collect(); closeSheet(); openDoc(coll, null, null, o); }catch(e){ $('eErr').textContent = e.message; } };
  if($('eDel')) $('eDel').onclick = function(){
    if(coll === 'admins' && id === CLOUD.uid){ $('eErr').textContent = 'You cannot delete your own login.'; return; }
    if(!confirm('Delete this record permanently?' + (coll === 'distributors' ? '\n\nTip: to remove a distributor completely (stock, logins …) use Distributors → Settings → Delete.' : ''))) return;
    db().collection(coll).doc(id).delete().then(function(){ return cleanLookup(coll, [snap]); }).then(function(){ logAudit('Data deleted', mm.title + ' / ' + id); toast('Deleted'); closeSheet(); S.cReq[coll] = 0; if(S.view === 'model') loadMore(true); }, function(e){ $('eErr').textContent = friendly(e).message; }); };
}

/* ================================================================== export / import / backup / restore */
function docObj(d){ return { id: d.id, data: toJson(d.data()) }; }
function exportModel(mm, kind){
  var pg = progress('Exporting ' + mm.title + '…');
  fetchAll(mm.id, function(n){ pg.set(n + ' records…'); }).then(function(ds){
    pg.close();
    if(kind === 'json') download(mm.id + '-' + stamp() + '.json', JSON.stringify({ app: 'AshirvadConnect', collection: mm.id, exportedAt: new Date().toISOString(), docs: ds.map(docObj) }, null, 1));
    else { var keys = {}; ds.forEach(function(d){ Object.keys(d.data()).forEach(function(k){ keys[k] = 1; }); }); var ks = Object.keys(keys); download(mm.id + '-' + stamp() + '.csv', csvOf([['id'].concat(ks)].concat(ds.map(function(d){ var x = toJson(d.data()); return [d.id].concat(ks.map(function(k){ var v = x[k]; return v !== null && typeof v === 'object' ? JSON.stringify(v) : v; })); }))), 'text/csv'); }
    toast('Exported ' + ds.length + ' records');
  }, function(e){ pg.close(); toast(e.message); });
}
function pickFile(cb){ var fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.json,application/json'; fi.onchange = function(){ var f = fi.files[0]; if(!f) return; var fr = new FileReader(); fr.onload = function(){ try{ cb(JSON.parse(fr.result)); }catch(e){ toast('That file is not valid JSON'); } }; fr.readAsText(f); }; fi.click(); }
function collectItems(json, only){          /* -> [{coll,id,data}] from any of our export shapes */
  var items = [];
  function add(coll, list){ (list || []).forEach(function(x){ if(x && x.id !== undefined) items.push({ coll: coll, id: String(x.id), data: fromJson(x.data || {}) }); }); }
  if(json && json.collections){ Object.keys(json.collections).forEach(function(c){ if(MODELS[c] && !MODELS[c].noList && (!only || only === c)) add(c, json.collections[c]); }); if(!only && Array.isArray(json.loginIndex)) add('login_index', json.loginIndex); }
  else if(json && json.docs && json.collection){ if(!only || only === json.collection) add(json.collection, json.docs); }
  else if(Array.isArray(json) && only){ json.forEach(function(x, i){ var id = x && (x.id !== undefined ? x.id : null); items.push({ coll: only, id: id === null ? db().collection(only).doc().id : String(id), data: fromJson(x) }); }); }
  return items;
}
function importFlow(only){
  pickFile(function(json){
    var items = collectItems(json, only);
    if(!items.length){ toast('Nothing importable found in that file for this topic'); return; }
    var by = {}; items.forEach(function(it){ by[it.coll] = (by[it.coll] || 0) + 1; });
    var w = sheet('<h3 class="dm-h">Import ' + items.length + ' record' + (items.length > 1 ? 's' : '') + '?</h3><div class="dm-sub">' + Object.keys(by).map(function(c){ return esc(MODELS[c].title) + ': <b>' + by[c] + '</b>'; }).join(' · ') + '</div><div class="dm-sub" style="margin-top:8px">Records with the same ID are <b>replaced</b>; everything else stays.</div><div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn ghost" id="iNo">Cancel</button><button class="dm-btn" id="iYes">Import</button></div>');
    $('iNo').onclick = closeSheet;
    $('iYes').onclick = function(){ closeSheet(); var pg = progress('Importing…'); writeMany(items, function(n){ pg.set(n + ' / ' + items.length, 100 * n / items.length); }).then(function(n){ pg.close(); logAudit('Data imported', n + ' record(s)'); toast('Imported ' + n + ' records'); S.counts = {}; S.cReq = {}; if(S.view === 'model') loadMore(true); else render(); }, function(e){ pg.close(); toast(e.message); }); };
  });
}
function allModelIds(){ var ids = []; GROUPS.forEach(function(g){ g[1].forEach(function(m){ if(!m.noList) ids.push(m.id); }); }); return ids; }
function slugU(x){ return String(x || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, ''); }
function buildBackup(colls, pg){
  var out = { app: 'AshirvadConnect', kind: 'backup', version: 2, exportedAt: new Date().toISOString(), collections: {}, loginIndex: [], failed: [], counts: {} }, i = 0;
  return colls.reduce(function(p, c){ return p.then(function(){
    pg.set('Reading ' + MODELS[c].title + '…', 100 * i / colls.length);
    return fetchAll(c).then(function(ds){ out.collections[c] = ds.map(docObj); out.counts[c] = ds.length; i++; }, function(){ out.collections[c] = []; out.failed.push(c); i++; });
  }); }, Promise.resolve()).then(function(){
    // sign-in lookups cannot be listed, but each one can be read by name — keep the ones that belong to staff and distributor logins
    var names = [];
    (out.collections.admins || []).forEach(function(d){ if(d.data && d.data.username) names.push('staff_' + slugU(d.data.username)); });
    (out.collections.dist_logins || []).forEach(function(d){ if(d.data && d.data.username) names.push(String(d.data.username).toLowerCase()); });
    pg.set('Reading sign-in lookups…', 98);
    return names.reduce(function(p, n){ return p.then(function(){ return db().collection('login_index').doc(n).get().then(function(d){ if(d.exists) out.loginIndex.push({ id: n, data: toJson(d.data()) }); }, function(){}); }); }, Promise.resolve());
  }).then(function(){ return out; });
}
function backupSummaryHtml(b, fileName){
  var n = Object.keys(b.collections).reduce(function(a, c){ return a + b.collections[c].length; }, 0), cs = Object.keys(b.collections).filter(function(c){ return b.collections[c].length; });
  return '<h3 class="dm-h">' + (b.failed.length ? '⚠ Backup saved — but not complete' : '✅ Backup downloaded') + '</h3>' +
    '<div class="dm-sub"><b>' + n + '</b> records · <b>' + cs.length + '</b> topics' + (b.loginIndex.length ? ' · ' + b.loginIndex.length + ' sign-in lookups' : '') + '<br>File: ' + esc(fileName) + '</div>' +
    (b.failed.length ? '<div class="dm-sub" style="color:#b23b3b;margin-top:8px">These could not be read, so they are <b>missing</b> from the file: ' + b.failed.map(function(c){ return esc(MODELS[c].title); }).join(', ') + '. Use <b>Check access</b>, publish the latest rules, and back up again.</div>' : '') +
    '<div style="margin-top:10px;max-height:34vh;overflow:auto">' + cs.map(function(c){ return '<div class="dm-flex" style="justify-content:space-between;border-top:1px solid #f0ead8;padding:5px 0"><span>' + esc(MODELS[c].title) + '</span><b>' + b.collections[c].length + '</b></div>'; }).join('') + '</div>' +
    '<div class="dm-sub" style="margin-top:10px">Sign-in <b>passwords</b> are kept by Firebase and cannot be included in any backup — restored logins keep working only while their sign-in still exists in Firebase.</div>' +
    '<div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn ghost" id="bkAgain">Download again</button><button class="dm-btn" id="bkOk">Done</button></div>';
}
function backupAll(){
  var pg = progress('Backing up everything…');
  buildBackup(allModelIds(), pg).then(function(b){
    pg.close(); var text = JSON.stringify(b), fname = 'ashirvad-backup-' + stamp() + '.json';
    download(fname, text);
    sheet(backupSummaryHtml(b, fname)); $('bkOk').onclick = closeSheet; $('bkAgain').onclick = function(){ download(fname, text); };
    logAudit('Backup downloaded', Object.keys(b.counts).reduce(function(a, c){ return a + b.counts[c]; }, 0) + ' records');
  }, function(e){ pg.close(); toast(e.message); });
}

/* ---- restore: pick a backup, choose merge or exact copy, keep a safety copy, then VERIFY what was written ---- */
var EXACT_SKIP = ['admins', 'dist_logins', 'login_index'];   // exact copy never deletes logins (it could lock everyone out)
function canon(v){ if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; if(v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function(k){ return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}'; return JSON.stringify(v === undefined ? null : v); }
function restoreFlow(){
  pickFile(function(json){
    if(!json || typeof json !== 'object' || (json.app && json.app !== 'AshirvadConnect')){ toast('That file is not an Ashirvad backup'); return; }
    var items = collectItems(json, null);
    if(!items.length){ toast('No records found in that file — is it a backup made with the Backup button?'); return; }
    var by = {}, ids = {}; items.forEach(function(it){ by[it.coll] = (by[it.coll] || 0) + 1; (ids[it.coll] = ids[it.coll] || {})[it.id] = 1; });
    var when = json.exportedAt ? new Date(json.exportedAt).toLocaleString('en-IN') : 'unknown date';
    var warn = (json.failed && json.failed.length) ? '<div class="dm-sub" style="color:#b23b3b;margin-top:8px">⚠ This backup was made while some topics could not be read (' + json.failed.map(function(c){ return esc((MODELS[c] || {}).title || c); }).join(', ') + ') — they are not in the file.</div>' : '';
    var w = sheet('<h3 class="dm-h">Restore from backup</h3><div class="dm-sub">Backup made <b>' + esc(when) + '</b> · <b>' + items.length + '</b> records</div>' + warn +
      '<div style="margin-top:8px;max-height:24vh;overflow:auto">' + Object.keys(by).map(function(c){ return '<div class="dm-flex" style="justify-content:space-between;border-top:1px solid #f0ead8;padding:4px 0"><span>' + esc(MODELS[c].title) + '</span><b>' + by[c] + '</b></div>'; }).join('') + '</div>' +
      '<label class="dm-opt on" id="rMergeL"><input type="radio" name="rMode" value="merge" checked><div><b>Merge (safest)</b><span>Add the records from the file; records with the same ID are replaced. Anything not in the file stays.</span></div></label>' +
      '<label class="dm-opt" id="rExactL"><input type="radio" name="rMode" value="exact"><div><b>Exact copy</b><span>Make the database match the file: records that are <b>not</b> in the file are deleted (logins are never deleted).</span></div></label>' +
      '<label class="dm-sub" style="display:flex;gap:8px;align-items:center;margin-top:10px;cursor:pointer"><input type="checkbox" id="rSafe" checked> Download a safety copy of the current data first (recommended)</label>' +
      '<div id="rTypeBox" style="display:none;margin-top:8px"><label class="dm-lab">Type <b>RESTORE</b> to confirm an exact copy</label><input class="dm-in" id="rType" autocomplete="off"></div>' +
      '<div class="dm-err" id="rErr" style="color:#b23b3b;font-size:12.5px;margin-top:6px"></div>' +
      '<div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn ghost" id="rNo">Cancel</button><button class="dm-btn" id="rYes">Restore</button></div>');
    var mode = function(){ return w.querySelector('input[name="rMode"]:checked').value; };
    w.querySelectorAll('input[name="rMode"]').forEach(function(r){ r.onchange = function(){ var ex = mode() === 'exact'; $('rTypeBox').style.display = ex ? '' : 'none'; $('rMergeL').classList.toggle('on', !ex); $('rExactL').classList.toggle('on', ex); if(ex) $('rSafe').checked = true; }; });
    $('rNo').onclick = closeSheet;
    $('rYes').onclick = function(){
      var exact = mode() === 'exact';
      if(exact && $('rType').value.trim() !== 'RESTORE'){ $('rErr').textContent = 'Type RESTORE exactly to confirm.'; return; }
      var safe = $('rSafe').checked; closeSheet();
      runRestore(items, ids, { exact: exact, safe: safe, when: when });
    };
  });
}
function runRestore(items, ids, o){
  var pg = progress('Restoring…'), chain = Promise.resolve(), deleted = 0, colls = Object.keys(ids);
  if(o.safe) chain = chain.then(function(){ pg.set('Saving a safety copy of the current data…', 3); return buildBackup(allModelIds(), pg).then(function(b){ download('ashirvad-before-restore-' + stamp() + '.json', JSON.stringify(b)); }); });
  chain = chain.then(function(){ pg.set('Writing ' + items.length + ' records…', 10); return writeMany(items, function(n){ pg.set('Writing ' + n + ' / ' + items.length, 10 + 55 * n / items.length); }); });
  // older backups carry no sign-in lookups: rebuild the staff ones from the staff records themselves
  chain = chain.then(function(){
    var have = {}; items.forEach(function(it){ if(it.coll === 'login_index') have[it.id] = 1; });
    var rebuild = items.filter(function(it){ return it.coll === 'admins' && it.data && it.data.username && it.data.email && !have['staff_' + slugU(it.data.username)]; })
      .map(function(it){ return { coll: 'login_index', id: 'staff_' + slugU(it.data.username), data: { email: it.data.email, uid: it.id, kind: 'staff' } }; });
    return rebuild.length ? writeMany(rebuild) : null;
  });
  if(o.exact) chain = chain.then(function(){
    var targets = colls.filter(function(c){ return EXACT_SKIP.indexOf(c) < 0 && !MODELS[c].noList; });
    return targets.reduce(function(p, c, i){ return p.then(function(){
      pg.set('Removing records that are not in the backup — ' + MODELS[c].title + '…', 68 + 14 * i / targets.length);
      return fetchAll(c).then(function(ds){ var extra = ds.filter(function(d){ return !ids[c][d.id]; }); if(!extra.length) return;
        return deleteDocs(extra.map(function(d){ return d.ref; })).then(function(n){ deleted += n; return cleanLookup(c, extra); }); });
    }); }, Promise.resolve());
  });
  var report = { ok: 0, missing: [], different: [], extras: 0 };
  chain = chain.then(function(){
    var targets = colls.filter(function(c){ return !MODELS[c].noList; });
    return targets.reduce(function(p, c, i){ return p.then(function(){
      pg.set('Verifying ' + MODELS[c].title + '…', 85 + 14 * i / targets.length);
      return fetchAll(c).then(function(ds){
        var cur = {}; ds.forEach(function(d){ cur[d.id] = canon(toJson(d.data())); });
        items.filter(function(it){ return it.coll === c; }).forEach(function(it){
          if(cur[it.id] === undefined) report.missing.push(MODELS[c].title + ' / ' + it.id);
          else if(cur[it.id] !== canon(toJson(it.data))) report.different.push(MODELS[c].title + ' / ' + it.id);
          else report.ok++;
        });
        if(o.exact && EXACT_SKIP.indexOf(c) < 0) report.extras += ds.filter(function(d){ return !ids[c][d.id]; }).length;
      });
    }); }, Promise.resolve());
  });
  chain.then(function(){
    pg.close(); S.counts = {}; S.cReq = {};
    var bad = report.missing.length + report.different.length + report.extras, checked = items.filter(function(it){ return !MODELS[it.coll].noList; }).length;
    logAudit('Backup restored', items.length + ' record(s) · ' + (o.exact ? 'exact copy' : 'merge') + (deleted ? ' · ' + deleted + ' removed' : ''));
    sheet('<h3 class="dm-h">' + (bad ? '⚠ Restore finished with differences' : '✅ Restore complete and verified') + '</h3>' +
      '<div class="dm-sub"><b>' + report.ok + '</b> of <b>' + checked + '</b> records checked and identical to the backup' + (o.exact ? ' · <b>' + deleted + '</b> extra record(s) removed' : '') + '.</div>' +
      (bad ? '<div class="dm-sub" style="color:#b23b3b;margin-top:8px">' + (report.missing.length ? report.missing.length + ' missing. ' : '') + (report.different.length ? report.different.length + ' different. ' : '') + (report.extras ? report.extras + ' extra.' : '') + '<br>' + esc(report.missing.concat(report.different).slice(0, 6).join(' · ')) + '</div>' : '') +
      '<div class="dm-sub" style="margin-top:8px">Sign-in passwords are not part of a backup; people can log in again as long as their Firebase sign-in still exists.</div>' +
      '<div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn" id="rtOk">Done</button></div>');
    $('rtOk').onclick = function(){ closeSheet(); if(S.view === 'model') loadMore(true); else render(); };
  }, function(e){ pg.close(); sheet('<h3 class="dm-h" style="color:#b23b3b">Restore stopped</h3><div class="dm-sub">' + esc((friendly(e) || e).message || 'Something went wrong') + '<br>Nothing more was written. Your safety copy (if you chose one) was already downloaded. You can run the restore again — it is safe to repeat.</div><div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn" id="rfOk">Close</button></div>'); $('rfOk').onclick = closeSheet; });
}


/* ================================================================== delete data / factory reset */
var RG = [
  { id: 'orders', label: '🧾 Orders', desc: 'All dealer orders, “notify me” requests, invoice counter back to 1.', colls: ['orders', 'stock_notify'], extra: ['invoice'] },
  { id: 'dealers', label: '🏢 Dealers', desc: 'Dealer profiles and their login links. (Their sign-in accounts remain in Firebase Authentication.)', colls: ['dealers', 'accounts'] },
  { id: 'catalogue', label: '📦 Catalogue', desc: 'Products, catalog cards, categories, offers, banners, calculator rules, broadcasts.', colls: ['products', 'spec_groups', 'catalog_categories', 'catalog_subcategories', 'offers', 'banners', 'calc_rules', 'broadcasts', 'stock_totals'] },
  { id: 'distributors', label: '🚚 Distributors', desc: 'Distributors, their stock, sales, orders, history, requests, logins and roles.', colls: ['distributors', 'distributor_stock', 'distributor_requests', 'distributor_log', 'distributor_sales', 'distributor_orders', 'dist_logins', 'roles'], extra: ['login_index_dist'] },
  { id: 'audit', label: '📜 Old audit log entries', desc: 'Leftover entries from before the audit log was removed.', colls: ['audit_log'] },
  { id: 'settings', label: '⚙️ Shop settings', desc: 'Invoice / delivery settings go back to defaults (the app asks you to set them up again).', colls: [], extra: ['settings'] },
  { id: 'staff', label: '🛡 Staff logins', desc: 'All managers and viewers (the Owner — you — is never deleted).', colls: [], extra: ['staff'] }
];
function openReset(onlyColl){
  var sel = {};
  if(onlyColl){ RG.forEach(function(g){ sel[g.id] = false; }); }
  else RG.forEach(function(g){ sel[g.id] = g.id === 'orders'; });
  var only = onlyColl || null;
  var w = sheet('<div id="rsBody"></div>');
  function body(){
    var chosen = RG.filter(function(g){ return sel[g.id]; });
    var all = RG.every(function(g){ return sel[g.id]; });
    var phrase = only ? 'DELETE' : (all ? 'FACTORY RESET' : 'DELETE');
    $('rsBody').innerHTML = '<h3 class="dm-h" style="color:#b23b3b;font-size:18px">☢ ' + (only ? 'Delete all “' + esc(MODELS[only].title) + '” records' : 'Delete data / Factory reset') + '</h3>' +
      (only ? '<div class="dm-sub" style="margin-bottom:8px">Every record in <b>' + esc(only) + '</b> will be removed.</div>' :
        '<div class="dm-sub" style="margin-bottom:10px">Tick what to delete. Nothing is deleted until you confirm at the bottom.</div><div class="dm-flex" style="margin-bottom:10px"><button class="dm-btn ghost sm" id="rsTx">Orders only</button><button class="dm-btn ghost sm" id="rsDist">Distributors only</button><button class="dm-btn ghost sm" id="rsAll">Everything (factory reset)</button><button class="dm-btn ghost sm" id="rsNone">Clear</button></div>' +
        RG.map(function(g){ return '<label class="dm-opt' + (sel[g.id] ? ' on' : '') + '"><input type="checkbox" data-g="' + g.id + '"' + (sel[g.id] ? ' checked' : '') + '> <b>' + g.label + '</b><div class="dm-sub">' + esc(g.desc) + '</div></label>'; }).join('')) +
      '<div class="dm-card" style="background:#fafafa;margin-top:10px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="rsBk" checked style="width:20px;height:20px"> <b>Download a backup first</b> <span class="dm-sub">(strongly recommended)</span></label></div>' +
      '<label class="dm-lab">Your admin password</label><input class="dm-in" id="rsPw" type="password" autocomplete="current-password" placeholder="to prove it is you">' +
      '<label class="dm-lab">Type <b>' + phrase + '</b> to confirm</label><input class="dm-in" id="rsTxt" autocomplete="off" placeholder="' + phrase + '">' +
      '<div class="dm-err" id="rsErr" style="color:#b23b3b;font-size:12.5px;margin-top:8px"></div>' +
      '<div class="dm-flex" style="margin-top:14px;justify-content:flex-end"><button class="dm-btn ghost" id="rsNo">Cancel</button><button class="dm-btn red" id="rsGo">Delete selected data</button></div>';
    $('rsNo').onclick = closeSheet;
    if(!only){
      $('rsBody').querySelectorAll('[data-g]').forEach(function(c){ c.onchange = function(){ sel[c.getAttribute('data-g')] = c.checked; body(); }; });
      var setAll = function(on, ids){ RG.forEach(function(g){ sel[g.id] = ids ? ids.indexOf(g.id) >= 0 : on; }); body(); };
      $('rsTx').onclick = function(){ setAll(false, ['orders']); }; $('rsDist').onclick = function(){ setAll(false, ['distributors']); }; $('rsAll').onclick = function(){ setAll(true); }; $('rsNone').onclick = function(){ setAll(false, []); };
    }
    $('rsGo').onclick = function(){
      var err = $('rsErr'); err.textContent = '';
      if(!only && !chosen.length){ err.textContent = 'Tick at least one thing to delete.'; return; }
      if($('rsTxt').value.trim() !== phrase){ err.textContent = 'Type ' + phrase + ' exactly to confirm.'; return; }
      var pw = $('rsPw').value; if(!pw){ err.textContent = 'Enter your admin password.'; return; }
      var u = CLOUD.auth && CLOUD.auth.currentUser; if(!u){ err.textContent = 'Please sign in again.'; return; }
      $('rsGo').disabled = true; $('rsGo').textContent = 'Checking password…';
      var wantBk = $('rsBk').checked;
      u.reauthenticateWithCredential(CLOUD.firebase.auth.EmailAuthProvider.credential(u.email, pw)).then(function(){ closeSheet(); runReset(only ? { only: only } : { groups: chosen }, wantBk); },
        function(){ $('rsGo').disabled = false; $('rsGo').textContent = 'Delete selected data'; err.textContent = 'Wrong password.'; });
    };
  }
  body();
}
function runReset(plan, wantBackup){
  CLOUD.writesEnabled = false;                     // stop the app from writing anything while we delete (until the page reloads)
  var colls = [], extra = [], title = '';
  if(plan.only){ colls = [plan.only]; title = MODELS[plan.only].title; }
  else { plan.groups.forEach(function(g){ g.colls.forEach(function(c){ if(colls.indexOf(c) < 0) colls.push(c); }); (g.extra || []).forEach(function(x){ extra.push(x); }); }); title = plan.groups.map(function(g){ return g.label.replace(/^\S+\s/, ''); }).join(', '); }
  var pg = progress('Deleting data…'), report = [], total = 0, failed = [], idxNames = [];
  var step = Promise.resolve(), relPhones = [], relGsts = [];
  if(colls.indexOf('dealers') >= 0 || colls.indexOf('accounts') >= 0){ step = step.then(function(){ return Promise.all([fetchAll('accounts').catch(function(){ return []; }), fetchAll('dealers').catch(function(){ return []; })]).then(function(r){ r[0].forEach(function(d){ relPhones.push(normPh(d.id)); }); r[1].forEach(function(d){ relPhones.push(normPh(d.data().accountKey || d.data().phone)); relGsts.push(d.id); }); }); }); }
  // login IDs of distributors / team members must be freed too, so the same name can be used again. They are collected BEFORE the records go.
  var delLogins = colls.indexOf('dist_logins') >= 0, delDists = colls.indexOf('distributors') >= 0;
  if(delLogins){ step = step.then(function(){ return Promise.all([fetchAll('dist_logins').catch(function(){ return []; }), delDists ? fetchAll('distributors').catch(function(){ return []; }) : Promise.resolve([])]).then(function(r){ r[0].concat(r[1]).forEach(function(d){ var u = d.data().username; if(u) idxNames.push(String(u).toLowerCase()); }); }); }); }
  if(wantBackup){ step = step.then(function(){ return buildBackup(colls.concat(extra.indexOf('invoice') >= 0 || extra.indexOf('settings') >= 0 ? ['config'] : []), pg).then(function(b){ download('ashirvad-backup-before-delete-' + stamp() + '.json', JSON.stringify(b)); }); }); }
  colls.forEach(function(c, i){
    step = step.then(function(){ pg.set('Deleting ' + MODELS[c].title + '…', 10 + 80 * i / Math.max(1, colls.length + extra.length)); return deleteWhole(c, function(n){ pg.set('Deleting ' + MODELS[c].title + '… ' + n); }).then(function(n){ total += n; report.push([MODELS[c].title, n]); }, function(e){ failed.push(MODELS[c].title + ': ' + e.message); }); });
  });
  extra.forEach(function(x){
    step = step.then(function(){
      pg.set('Cleaning up…', 92);
      if(x === 'invoice') return db().collection('config').doc('invoice_seq').set({ n: 0 }).then(function(){ report.push(['Invoice counter', 'reset to 0']); }, function(e){ failed.push('Invoice counter: ' + e.message); });
      if(x === 'settings') return db().collection('config').doc('settings').delete().then(function(){ report.push(['Shop settings', 'removed']); }, function(e){ failed.push('Settings: ' + e.message); });
      if(x === 'staff') return db().collection('admins').get().then(function(s){ var refs = [], names = []; s.docs.forEach(function(d){ var r = d.data().role; if(d.id !== CLOUD.uid && (r === 'manager' || r === 'viewer')){ refs.push(d.ref); if(d.data().username) names.push(String(d.data().username).toLowerCase()); } }); names.forEach(function(n){ refs.push(db().collection('login_index').doc('staff_' + n)); }); return deleteDocs(refs).then(function(n){ total += n; report.push(['Staff logins', n]); }); }, function(e){ failed.push('Staff: ' + e.message); });
    });
  });
  step = step.then(function(){ if(!relPhones.length && !relGsts.length) return; pg.set('Freeing dealer phone numbers…', 93); return deleteDocs(relGsts.map(function(g){ return db().collection('login_index').doc('gst_' + g); })).catch(function(){}).then(function(){ var seen = {}; return relPhones.filter(function(x){ if(!x || seen[x]) return false; seen[x] = 1; return true; }).reduce(function(p, ph){ return p.then(function(){ return bumpPhone(ph); }).catch(function(){}); }, Promise.resolve()); }); });
  step = step.then(function(){ if(!idxNames.length) return; pg.set('Freeing login IDs…', 94); var seen = {}, refs = []; idxNames.forEach(function(n){ if(!seen[n]){ seen[n] = 1; refs.push(db().collection('login_index').doc(n)); } }); return deleteDocs(refs).then(function(n){ report.push(['Login IDs freed', n]); }, function(e){ failed.push('Login IDs: ' + e.message); }); });
  step.then(function(){
    // browser copies of the data are stale now
    try{ var ls = window.localStorage, rm = []; for(var i = 0; i < ls.length; i++){ var k = ls.key(i); if(/^ac_/.test(k) && k !== 'ac_admin_session') rm.push(k); } rm.forEach(function(k){ ls.removeItem(k); }); }catch(e){}
    pg.set('Finished', 100);
    pg.body('<div style="margin-top:6px">' + report.map(function(r){ return '<div class="dm-flex" style="justify-content:space-between;border-top:1px solid #f0ead8;padding:6px 0"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') +
      (failed.length ? '<div class="dm-sub" style="color:#b23b3b;margin-top:8px"><b>Some parts could not be deleted:</b><br>' + failed.map(esc).join('<br>') + '<br>Publish the latest rules (firebase deploy --only firestore) and run this again.</div>' : '<div class="dm-sub" style="color:#1e7b46;margin-top:8px"><b>✔ Done.</b> ' + total + ' record(s) deleted.</div>') +
      '<div class="dm-sub" style="margin-top:8px">The page reloads so everything starts clean.' + (plan.groups && plan.groups.some(function(g){ return g.id === 'dealers' || g.id === 'distributors' || g.id === 'staff'; }) ? ' Old sign-in accounts are only <i>disabled in effect</i>; to remove them completely use Firebase console → Authentication.' : '') + '</div><div class="dm-flex" style="margin-top:12px;justify-content:flex-end"><button class="dm-btn" id="rsReload">Reload now</button></div></div>');
    $('rsReload').onclick = function(){ location.reload(); };
    setTimeout(function(){ location.reload(); }, 9000);
  }, function(e){ pg.set('Stopped: ' + ((e && e.message) || e), 100); pg.body('<div class="dm-flex" style="justify-content:flex-end;margin-top:10px"><button class="dm-btn" id="rsReload">Reload</button></div>'); $('rsReload').onclick = function(){ location.reload(); }; });
}

/* ================================================================== register */
window.__acAdminTabs = window.__acAdminTabs || {};
window.__acAdminTabs.data = function(){ render(); if(window.__acDataOpen === 'reset'){ window.__acDataOpen = null; setTimeout(openReset, 50); } };
var btn = document.querySelector('.admin-tabs button[data-atab="data"]'); if(btn && !OWNER) btn.style.display = 'none';
})();