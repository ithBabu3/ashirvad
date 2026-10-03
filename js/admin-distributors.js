/* ==========================================================================
   AshirvadConnect — Admin › Distributors  (v2: distributor-wise workspace)
   Loaded after js/app.js. Talks to Firestore directly through window.AC_CLOUD.db
   and uses the hooks app.js exposes as window.__acApi.

   Data model
     distributors/<id>          settings of one distributor  (id is random, NOT the login name)
     dist_logins/<auth uid>     { distributorId, roleId: 'owner' | <role id>, name, username, isActive }
     login_index/<username>     { email, uid }   -> lets the login page find the (opaque) e-mail of a user name
     distributor_stock/<did>__<pid>   one row per distributor + product (what he sees, his quantity, mirrors)
     stock_totals/<pid>         { id, by: { <did>: qty } }  -> catalogue availability = company stock + distributors
     distributor_sales / distributor_orders / distributor_requests / distributor_log
   ========================================================================== */
(function(){
'use strict';
var CLOUD = window.AC_CLOUD, API;
var DOMAIN = (window.AC_CLOUD_OPTIONS && window.AC_CLOUD_OPTIONS.distributorEmailDomain) || 'distributor.ashirvadconnect.app';
var STALE_MS = 7 * 86400000;
var S = { dists: new Map(), stock: new Map(), reqs: new Map(), orders: new Map(), roles: new Map(), logins: new Map(), totals: new Map(),
  started: false, totalsReady: false, syncing: false, syncT: null, mm: {},
  tab: 'list', sel: null, dtab: 'overview', q: '', stQ: '', stF: 'all', stView: 'report',
  od: { st: 'active' }, sl: { period: '30', mode: 'dist', rows: null, key: '' }, ad: { period: '30', onlyAdd: false, adminToo: false, rows: null, key: '', mode: 'dist' },
  lg: { rows: null }, recent: null, recentAt: 0, staff: null, pt: null, dsel: { rows: null, key: '' } };

/* ------------------------------------------------------------------ small helpers */
function RO(){ return CLOUD && CLOUD.staffRole === 'viewer'; }
function isOwner(){ return !CLOUD || CLOUD.staffRole === 'owner' || !CLOUD.staffRole; }
function who(){ return (CLOUD && CLOUD.staffName) || 'admin'; }
function $$(id){ return document.getElementById(id); }
function esc(s){ return API.esc(s); }
function toast(m){ API.showToast(m); }
function db(){ return CLOUD.db; }
function FV(){ return CLOUD.firebase.firestore.FieldValue; }
function products(){ return API.getProducts(); }
function main(){ return document.getElementById('adminMain'); }
function tabActive(){ var b = document.querySelector('.admin-tabs button.active'); return !!b && b.getAttribute('data-atab') === 'distributors'; }
function busy(){ var a = document.activeElement; return !!$$('dvOv') || !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && main().contains(a)); }
function partKey(s){ return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function slug(s){ return String(s || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, ''); }
function rid(n){ var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = '', r = new Uint32Array(n); try{ crypto.getRandomValues(r); }catch(e){ for(var j = 0; j < n; j++) r[j] = Math.floor(Math.random() * 4e9); } for(var i = 0; i < n; i++) s += a[r[i] % a.length]; return s; }
function genPass(){ var a = 'abcdefghjkmnpqrstuvwxyz23456789', s = '', r = new Uint32Array(8); try{ crypto.getRandomValues(r); }catch(e){ for(var j = 0; j < 8; j++) r[j] = Math.floor(Math.random() * 4e9); } for(var i = 0; i < 8; i++) s += a[r[i] % a.length]; return s; }
function dtime(ts){ return ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
function ago(ts){ if(!ts) return 'never'; var s = Math.floor((Date.now() - ts) / 1000); if(s < 60) return 'just now'; if(s < 3600) return Math.floor(s / 60) + ' min ago'; if(s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
function money(n){ return '₹' + (Number(n) || 0).toLocaleString('en-IN'); }
function distName(id){ var d = S.dists.get(id); return d ? d.name : '(deleted distributor)'; }
function periodStart(p){ var n = new Date(); if(p === 'today') return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); if(p === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).getTime(); if(p === 'all') return 0; return Date.now() - Number(p) * 86400000; }
function download(name, rows){
  var csv = rows.map(function(r){ return r.map(function(c){ var t = String(c == null ? '' : c); if(/^[=+\-@]/.test(t) && isNaN(Number(t))) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function copyText(t){ try{ navigator.clipboard.writeText(t); toast('Copied'); }catch(e){ prompt('Copy this:', t); } }
function staffDomain(){ return (CLOUD.options && CLOUD.options.adminEmailDomain) || 'admin.ashirvadconnect.app'; }
function portalUrl(){ return location.origin + '/distributor/'; }

/* a view-only login can look at everything; every action button is switched off (the rules block writes too) */
function lockRO(){ main().querySelectorAll('button').forEach(function(b){ if(b.hasAttribute('data-ok') || b.classList.contains('dw-nav')) return; b.disabled = true; b.title = 'View-only login'; }); }

/* ------------------------------------------------------------------ product helpers */
function catLabel(id){ var c = (API && API.getCategories ? API.getCategories() : []).filter(function(x){ return x.id === id; })[0]; return c ? c.name : (id || 'Uncategorised'); }
function snapOf(p){
  var x = (API && API.describe) ? API.describe(p) : { name: p.name, size: p.size };
  return { name: String(x.name || ''), size: String(x.size || ''), part: String(p.part || ''), catName: String(x.catName || ''), subName: String(x.subName || ''), catId: x.catId || '', subId: x.subId || '', gid: x.gid || null, gtitle: x.gtitle || '' };
}
/* "existing" (company) stock of a product; null = unlimited */
function companyOf(p){ var n = p.stock; if(n === undefined || n === null || n === '') return null; n = Number(n); return isFinite(n) ? Math.max(0, n) : null; }
function sees(d){ return !!d && (d.stockView === 'company' || d.stockView === 'all'); }
function seesAll(d){ return !!d && d.stockView === 'all'; }
function lowOf(d){ return Number(d && d.lowStockAt) || 5; }
function findByPart(part){ var k = partKey(part); if(!k) return null; return products().filter(function(p){ return partKey(p.part) === k; })[0] || null; }
function productById(id){ return products().filter(function(p){ return String(p.id) === String(id); })[0]; }
function stockOf(distId){ return Array.from(S.stock.values()).filter(function(s){ return s.distributorId === distId; }); }
function visRows(distId){ return stockOf(distId).filter(function(s){ return s.visible; }); }
function newOrders(){ return Array.from(S.orders.values()).filter(function(o){ return o.status === 'placed'; }).length; }
function pendingReqs(){ return Array.from(S.reqs.values()).filter(function(r){ return r.status === 'pending'; }); }
function lastFresh(d){ return Math.max(Number(d.lastConfirmedAt) || 0, stockOf(d.id).reduce(function(m, s){ return Math.max(m, s.updatedAt || 0); }, 0)); }
function isStale(d){ if(d.isActive === false) return false; if(!visRows(d.id).length) return false; var l = lastFresh(d); return !l || Date.now() - l > STALE_MS; }
function ownerLogin(distId){ return Array.from(S.logins.values()).filter(function(l){ return l.distributorId === distId && l.roleId === 'owner'; })[0]; }
function teamOf(distId){ return Array.from(S.logins.values()).filter(function(l){ return l.distributorId === distId && l.roleId !== 'owner'; }); }
function waLink(d){
  var ph = String(d.phone || '').replace(/\D/g, ''); if(ph.length === 10) ph = '91' + ph; if(!ph) return null;
  return 'https://wa.me/' + ph + '?text=' + encodeURIComponent('Hello ' + d.name + ', please update your stock on the Ashirvad distributor portal: ' + portalUrl());
}

/* ------------------------------------------------------------------ writing */
function commitOps(ops){
  var chunks = []; for(var i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
  return chunks.reduce(function(pr, ch){
    return pr.then(function(){
      var b = db().batch();
      ch.forEach(function(o){ if(o.del) b.delete(o.ref); else b.set(o.ref, o.data, { merge: o.merge !== false }); });
      return b.commit();
    });
  }, Promise.resolve()).then(function(){ return ops.length; }, function(e){ throw friendly(e); });
}
/* "Missing or insufficient permissions" almost always means the Firestore rules in Firebase are older than this code */
function friendly(e){
  if(e && e.code === 'permission-denied') e.message = 'Permission denied by Firebase. Publish the latest rules (firebase deploy --only firestore) and make sure you are signed in as Owner/Manager, not a view-only login.';
  return e;
}
/* create a Firebase login WITHOUT signing the admin out (second app instance) -> uid */
function createAuth(email, password){
  var app = CLOUD.firebase.initializeApp(window.AC_FIREBASE_CONFIG, 'dist-create-' + Date.now() + rid(3));
  var auth = app.auth();
  return auth.createUserWithEmailAndPassword(email, password).then(function(cred){
    var uid = cred.user.uid;
    return auth.signOut().then(function(){ return app.delete(); }).then(function(){ return uid; }, function(){ return uid; });
  }, function(e){ try{ app.delete(); }catch(x){} throw e; });
}
function authMsg(e){
  var c = (e && e.code) || '';
  if(c === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if(c === 'auth/email-already-in-use') return 'That login already exists in Firebase Authentication.';
  return (e && e.message) || String(e);
}

/* ------------------------------------------------------------------ live data */
function start(){
  if(S.started) return; S.started = true;
  [['distributors', S.dists], ['distributor_stock', S.stock], ['distributor_requests', S.reqs], ['distributor_orders', S.orders], ['roles', S.roles], ['dist_logins', S.logins], ['stock_totals', S.totals]].forEach(function(pair){
    db().collection(pair[0]).onSnapshot(function(snap){
      snap.docChanges().forEach(function(ch){ if(ch.type === 'removed') pair[1].delete(ch.doc.id); else { var d = ch.doc.data(); d.id = ch.doc.id; pair[1].set(ch.doc.id, d); } });
      if(pair[0] === 'stock_totals') S.totalsReady = true;
      updateBadge(); queueSync(3000);
      if(tabActive() && !busy()) render();
    }, function(e){ console.warn('[distributors]', pair[0], e); if(e && e.code === 'permission-denied' && !S.warnedRules){ S.warnedRules = true; toast('⚠ Firebase rules are out of date — run: firebase deploy --only firestore'); } });
  });
}
function updateBadge(){
  var btn = document.querySelector('.admin-tabs button[data-atab="distributors"]'); if(!btn) return;
  var n = pendingReqs().length + newOrders() + Array.from(S.dists.values()).filter(isStale).length;
  btn.textContent = '🚚 Distributors' + (n ? ' (' + n + ')' : '');
}

/* ------------------------------------------------------------------ keeping every copy in step with the catalogue */
/* What a stock row must look like right now (only the differing fields are returned; null = already correct). */
function diffRow(s, d, p, others){
  var sn = snapOf(p), upd = {};
  if(s.name !== sn.name) upd.name = sn.name;
  if((s.size || '') !== sn.size) upd.size = sn.size;
  if(s.part !== sn.part) upd.part = sn.part;
  if((s.catName || '') !== sn.catName) upd.catName = sn.catName;
  if((s.subName || '') !== sn.subName) upd.subName = sn.subName;
  if(s.showPrice){
    if(s.mrp !== (Number(p.mrp) || 0)) upd.mrp = Number(p.mrp) || 0;
    if(s.gstPct !== (Number(p.gstPct) || 0)) upd.gstPct = Number(p.gstPct) || 0;
  } else {
    if(s.mrp !== undefined) upd.mrp = FV().delete();
    if(s.gstPct !== undefined) upd.gstPct = FV().delete();
  }
  if(sees(d)){ var c = companyOf(p); if(s.companyStock === undefined || s.companyStock !== c) upd.companyStock = c; }
  else if(s.companyStock !== undefined) upd.companyStock = FV().delete();
  if(seesAll(d)){ if(s.othersStock !== others) upd.othersStock = others; }
  else if(s.othersStock !== undefined) upd.othersStock = FV().delete();
  return Object.keys(upd).length ? upd : null;
}
function newRow(d, p){
  var sn = snapOf(p), id = d.id + '__' + p.id;
  var row = { id: id, distributorId: d.id, productId: p.id, name: sn.name, size: sn.size, part: sn.part, catName: sn.catName, subName: sn.subName, visible: true, showPrice: !!d.defaultShowPrice };
  if(d.defaultShowPrice){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; }
  if(sees(d)) row.companyStock = companyOf(p);
  return row;
}
/* expected stock_totals: only rows the distributor can see, of active distributors */
function totalsExpected(){
  var m = {};
  S.stock.forEach(function(s){ var d = S.dists.get(s.distributorId); if(!s.visible || !d || d.isActive === false) return; (m[s.productId] = m[s.productId] || {})[s.distributorId] = Number(s.qty) || 0; });
  return m;
}
function sig(by){ return Object.keys(by || {}).sort().map(function(k){ return k + '=' + (Number(by[k]) || 0); }).join('|'); }
function syncAll(){
  var hasAuto = Array.from(S.dists.values()).some(function(d){ return (d.autoCats && d.autoCats.length) || (d.autoSubs && d.autoSubs.length); });
  if(!S.started || S.syncing || !API || RO() || (!S.stock.size && !hasAuto && !S.totals.size)) return Promise.resolve(0);
  var ops = [], now = Date.now();
  // 1) "always include new items" rules: create the missing rows (never touches a row that exists, even a hidden one)
  S.dists.forEach(function(d){
    if(d.isActive === false || !((d.autoCats && d.autoCats.length) || (d.autoSubs && d.autoSubs.length))) return;
    products().forEach(function(p){
      if(p.id === undefined || p.id === null || (!p.isCatalogVariant && p.active === false)) return;
      var x = snapOf(p), hit = (d.autoCats || []).indexOf(x.catId) >= 0 || (x.subId && (d.autoSubs || []).indexOf(x.subId) >= 0);
      if(!hit || S.stock.has(d.id + '__' + p.id)) return;
      ops.push({ ref: db().collection('distributor_stock').doc(d.id + '__' + p.id), data: newRow(d, p) });      // no qty: starts at 0, nothing can be overwritten
    });
  });
  // 2) mirrored fields (name / spec / category / MRP / company stock / other distributors' stock)
  var sum = {}; S.stock.forEach(function(s){ var d = S.dists.get(s.distributorId); if(s.visible && d && d.isActive !== false) sum[s.productId] = (sum[s.productId] || 0) + (Number(s.qty) || 0); });
  S.stock.forEach(function(s, id){
    var p = productById(s.productId), d = S.dists.get(s.distributorId); if(!p || !d) return;
    var u = diffRow(s, d, p, Math.max(0, (sum[s.productId] || 0) - (s.visible ? (Number(s.qty) || 0) : 0)));
    if(u) ops.push({ ref: db().collection('distributor_stock').doc(id), data: u });
  });
  // 3) catalogue availability: stock_totals must equal the sum of the visible distributor rows.
  //    A difference must stay the same for 4 s before it is "fixed", so a write that is still on its way is never overwritten.
  var again = false;
  if(S.totalsReady){
    var exp = totalsExpected(), seen = {};
    Object.keys(exp).forEach(function(pid){ var cur = S.totals.get(String(pid)); if(!cur || sig(cur.by) !== sig(exp[pid])) seen[pid] = sig(exp[pid]); });
    S.totals.forEach(function(t, pid){ if(!exp[pid]) seen[pid] = 'x'; });
    Object.keys(S.mm).forEach(function(k){ if(!(k in seen)) delete S.mm[k]; });
    Object.keys(seen).forEach(function(pid){
      var m = S.mm[pid];
      if(m && m.sig === seen[pid] && now - m.t >= 4000){
        ops.push(exp[pid] ? { ref: db().collection('stock_totals').doc(String(pid)), merge: false, data: { id: Number(pid), by: exp[pid], ts: now } } : { ref: db().collection('stock_totals').doc(String(pid)), del: true });
        delete S.mm[pid];
      } else { if(!m || m.sig !== seen[pid]) S.mm[pid] = { sig: seen[pid], t: now }; again = true; }
    });
  }
  if(again) queueSync(5000);
  if(!ops.length) return Promise.resolve(0);
  S.syncing = true;
  return commitOps(ops).then(function(n){ S.syncing = false; return n; }, function(e){ S.syncing = false; console.warn('[distributors] sync failed', e); return 0; });
}
function queueSync(ms){ clearTimeout(S.syncT); S.syncT = setTimeout(syncAll, ms || 2500); }

/* ================================================================== look & feel */
(function(){ if($$('dwCss')) return; var st = document.createElement('style'); st.id = 'dwCss';
st.textContent = [
'.dw{font-size:14px;color:#1c2330}.dw *{box-sizing:border-box}',
'.dw-bar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}.dw-bar::-webkit-scrollbar{display:none}',
'.dw-nav{border:1px solid #e0d7bd;background:#fff;border-radius:999px;padding:8px 14px;font-weight:600;font-size:13px;white-space:nowrap;cursor:pointer;color:#333}',
'.dw-nav.on{background:#17325c;color:#fff;border-color:#17325c}',
'.dw-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}@media(min-width:720px){.dw-kpis{grid-template-columns:repeat(4,1fr)}}',
'.dw-kpi{background:#fff;border:1px solid #ebe4cd;border-radius:14px;padding:12px 14px}.dw-kpi b{display:block;font-size:22px;line-height:1.15}.dw-kpi span{font-size:11.5px;color:#6b7280}',
'.dw-grid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:760px){.dw-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:1150px){.dw-grid{grid-template-columns:repeat(3,1fr)}}',
'.dw-card{background:#fff;border:1px solid #ebe4cd;border-radius:16px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:12px}.dw-grid .dw-card{margin-bottom:0}',
'.dw-av{width:44px;height:44px;border-radius:12px;background:#17325c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:19px;flex:none}',
'.dw-chip{display:inline-block;border-radius:99px;padding:2px 9px;font-size:11px;font-weight:600;background:#f3efe0;color:#5a5233;margin:0 4px 2px 0}',
'.dw-chip.ok{background:#e4f5ea;color:#1e7b46}.dw-chip.bad{background:#fde8e8;color:#b23b3b}.dw-chip.warn{background:#fff3d6;color:#8a5a00}.dw-chip.info{background:#e7f0ff;color:#2b4f9e}',
'.dw-btn{border:0;border-radius:10px;padding:9px 14px;font-weight:600;font-size:13px;cursor:pointer;background:#17325c;color:#fff;min-height:38px}',
'.dw-btn.ghost{background:#fff;color:#17325c;border:1.5px solid #cdd6e6}.dw-btn.red{background:#b23b3b}.dw-btn.green{background:#1e7b46}.dw-btn.sm{padding:5px 11px;min-height:32px;font-size:12px}.dw-btn:disabled{opacity:.45;cursor:not-allowed}',
'.dw-row{display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ead8}.dw-row:first-child{border-top:0}.dw-grow{flex:1;min-width:0}',
'.dw-sub{font-size:12px;color:#6b7280}.dw-h{font-size:15px;font-weight:700;margin:0 0 8px}.dw-flex{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
'.dw-ov{position:fixed;inset:0;z-index:20000;background:rgba(10,19,34,.6);display:flex;align-items:flex-end;justify-content:center}',
'.dw-sheet{background:#fff;border-radius:18px 18px 0 0;width:100%;max-width:660px;max-height:92vh;overflow:auto;padding:18px;font-size:14px}@media(min-width:720px){.dw-ov{align-items:center}.dw-sheet{border-radius:18px}}',
'.dw-in,.dw-sel{width:100%;padding:10px 12px;border:1.5px solid #d8dbe3;border-radius:10px;font-size:14px;background:#fff;color:#1c2330}',
'.dw-lab{display:block;font-size:12px;font-weight:600;color:#4b5563;margin:10px 0 4px}',
'.dw-sticky{position:sticky;bottom:0;background:#fff;border-top:1px solid #e5e7eb;padding:10px;display:flex;gap:8px;justify-content:space-between;align-items:center;z-index:5;border-radius:0 0 14px 14px}',
'.dw-tbl{width:100%;border-collapse:collapse;font-size:13px}.dw-tbl th{text-align:left;font-size:11.5px;color:#6b7280;padding:6px}.dw-tbl td{padding:8px 6px;border-top:1px solid #f0ead8;vertical-align:top}.dw-tbl .r{text-align:right}',
'.dw-tr{display:flex;align-items:center;gap:8px;padding:9px 10px;border-top:1px solid #f1ece0}',
'.dw-tr.cat{background:#efe6c9;font-weight:700}.dw-tr.sub{background:#f7f1de;font-weight:600;padding-left:24px}.dw-tr.card{background:#fbf8ee;font-weight:600;padding-left:38px}.dw-tr.item{padding-left:52px}',
'.dw-chk{width:20px;height:20px;flex:none;accent-color:#17325c}.dw-q{width:74px;padding:6px 8px;border:1.5px solid #d8dbe3;border-radius:8px;font-size:14px}',
'.dw-opt{border:1.5px solid #d8dbe3;border-radius:12px;padding:10px 12px;margin-bottom:8px;display:block;cursor:pointer}.dw-opt.on{border-color:#17325c;background:#f3f6fc}',
'.dw-ban{background:#eef3ff;border:1px solid #c9d8ff;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:12.5px}',
'.dw-empty{text-align:center;color:#6b7280;padding:28px 10px}'
].join('\n'); document.head.appendChild(st); })();

function sheet(html){
  var w = document.createElement('div'); w.id = 'dvOv'; w.className = 'dw-ov dw';
  w.innerHTML = '<div class="dw-sheet">' + html + '</div>';
  w.addEventListener('mousedown', function(e){ if(e.target === w) closeSheet(); });
  document.body.appendChild(w); return w;
}
function closeSheet(){ var w = $$('dvOv'); if(w) w.remove(); render(); }
function setBody(h){ var b = $$('dvBody'); if(!b) return; b.innerHTML = h; if(RO()) lockRO(); }
function kpi(v, l, color){ return '<div class="dw-kpi"><b' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</b><span>' + l + '</span></div>'; }
function fail(e){ toast('Failed: ' + ((e && e.message) || e)); }

/* ================================================================== shell */
var TOP = [['list', '👥 Distributors'], ['stock', '📦 Stock'], ['orders', '🛒 Orders'], ['sales', '🧾 Sales'], ['requests', '📥 Requests'], ['log', '🕘 Activity'], ['access', '🔐 Access'], ['health', '🩺 Health']];
var WS = [['overview', '🏠 Overview'], ['products', '🗂 Products'], ['stock', '📦 Stock'], ['sales', '🧾 Sales'], ['orders', '🛒 Orders'], ['access', '🔑 Login & team'], ['settings', '⚙ Settings']];
function render(){
  API = window.__acApi; var m = main(); if(!m) return;
  if(!CLOUD || !CLOUD.enabled || CLOUD.role !== 'admin'){
    m.innerHTML = '<div class="admin-empty"><div class="ae-big">Cloud mode required</div><div>The distributor portal needs Firebase. Finish SETUP.md first.</div></div>'; return;
  }
  start();
  var ban = RO() ? '<div class="dw-ban">👁 <b>View-only login</b> — you can look at everything, but not change anything.</div>' : '';
  var d = S.sel ? S.dists.get(S.sel) : null; if(S.sel && !d) S.sel = null;
  if(d){
    m.innerHTML = '<div class="dw">' + ban + wsHeader(d) + '<div class="dw-bar">' + WS.map(function(t){ return '<button type="button" class="dw-nav' + (S.dtab === t[0] ? ' on' : '') + '" data-wt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="dvBody"></div></div>';
    m.querySelectorAll('[data-wt]').forEach(function(b){ b.onclick = function(){ S.dtab = b.getAttribute('data-wt'); if(S.dtab !== 'products') S.pt = null; render(); }; });
    $$('wsBack').onclick = function(){ S.sel = null; S.pt = null; render(); };
    ({ overview: wsOverview, products: wsProducts, stock: wsStock, sales: wsSales, orders: wsOrders, access: wsAccess, settings: wsSettings })[S.dtab](d);
  } else {
    if(S.tab === 'access' && !isOwner()) S.tab = 'list';
    var nav = TOP.filter(function(t){ return t[0] !== 'access' || isOwner(); }).map(function(t){
      var n = t[0] === 'orders' ? newOrders() : t[0] === 'requests' ? pendingReqs().length : 0;
      return '<button type="button" class="dw-nav' + (S.tab === t[0] ? ' on' : '') + '" data-tt="' + t[0] + '">' + t[1] + (n ? ' (' + n + ')' : '') + '</button>'; }).join('');
    m.innerHTML = '<div class="dw">' + ban + '<div class="dw-bar">' + nav + '</div><div id="dvBody"></div></div>';
    m.querySelectorAll('[data-tt]').forEach(function(b){ b.onclick = function(){ S.tab = b.getAttribute('data-tt'); S.lg.rows = null; render(); }; });
    ({ list: viewList, stock: viewStock, orders: function(){ viewOrders(null); }, sales: function(){ viewSales(null); }, requests: viewRequests, log: function(){ viewLog(null); }, access: viewAccess, health: viewHealth })[S.tab]();
  }
  if(RO()) lockRO();
}
function wsHeader(d){
  var st = d.isActive === false ? '<span class="dw-chip bad">Inactive</span>' : '<span class="dw-chip ok">Active</span>';
  return '<div class="dw-flex" style="margin-bottom:10px"><button type="button" class="dw-btn ghost sm dw-nav" id="wsBack" data-ok="1">← All distributors</button></div>' +
    '<div class="dw-card"><div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-av">' + esc((d.name || '?').charAt(0).toUpperCase()) + '</div><div class="dw-grow"><div style="font-size:18px;font-weight:700">' + esc(d.name) + '</div>' +
    '<div class="dw-sub">' + esc([d.city, d.phone].filter(Boolean).join(' · ') || 'No contact details') + '</div></div></div>' +
    '<div style="margin-top:8px">' + st + (isStale(d) ? '<span class="dw-chip warn">Stock not updated for 7+ days</span>' : '') +
    '<span class="dw-chip info">' + (seesAll(d) ? 'Sees own + company + other distributors\' stock' : sees(d) ? 'Sees own + company stock' : 'Sees only his own stock') + '</span>' +
    (d.canUpload ? '<span class="dw-chip">Can add products</span>' : '') + (d.autoCats && d.autoCats.length || d.autoSubs && d.autoSubs.length ? '<span class="dw-chip">⚡ Auto-includes new items</span>' : '') + '</div></div>';
}

/* ================================================================== dashboard (all distributors) */
function activeOrders(distId){ return Array.from(S.orders.values()).filter(function(o){ return (!distId || o.distributorId === distId) && ['placed', 'accepted', 'dispatched'].indexOf(o.status) >= 0; }); }
function fetchSales(period, distId, cb){
  var key = period + '|' + (distId || ''), c = (S.sc = S.sc || {})[key];
  if(c && Date.now() - c.t < 45000){ cb(c.rows); return; }
  var q = db().collection('distributor_sales'); if(distId) q = q.where('distributorId', '==', distId);
  var since = periodStart(period); if(since) q = q.where('ts', '>=', since);
  q.orderBy('ts', 'desc').limit(2000).get().then(function(s){ var rows = s.docs.map(function(x){ var o = x.data(); o.id = x.id; return o; }); S.sc[key] = { t: Date.now(), rows: rows }; cb(rows); }, function(e){ cb(null, e); });
}
function salesAgg(rows, distId){
  var t0 = periodStart('today'), a = { tn: 0, tu: 0, tv: 0, n: 0, u: 0, v: 0 };
  (rows || []).forEach(function(s){ if(s.status === 'void' || (distId && s.distributorId !== distId)) return; var u = Number(s.units) || 0, v = Number(s.amount) || 0; a.n++; a.u += u; a.v += v; if(s.ts >= t0){ a.tn++; a.tu += u; a.tv += v; } });
  return a;
}
function viewList(){
  var ds = Array.from(S.dists.values()).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
  var q = S.q.toLowerCase().trim();
  var list = ds.filter(function(d){ return !q || (d.name + ' ' + (d.city || '') + ' ' + (d.phone || '')).toLowerCase().indexOf(q) >= 0; });
  var units = 0, act = 0; ds.forEach(function(d){ if(d.isActive !== false){ act++; visRows(d.id).forEach(function(s){ units += Number(s.qty) || 0; }); } });
  var recent = S.recent ? salesAgg(S.recent) : null;
  if(!S.recent && Date.now() - S.recentAt > 60000){ S.recentAt = Date.now(); fetchSales('7', null, function(rows){ if(rows){ S.recent = rows; if(tabActive() && S.tab === 'list' && !S.sel && !busy()) render(); } }); }
  var h = '<div class="dw-kpis">' + kpi(act, 'Active distributors') + kpi(units.toLocaleString('en-IN'), 'Units with distributors') + kpi(activeOrders().length, 'Open orders', activeOrders().length ? '#2b4f9e' : '') + kpi(recent ? recent.tu : '…', 'Units sold today') + '</div>' +
    '<div class="dw-flex" style="margin-bottom:12px"><input class="dw-in" id="dQ" placeholder="Search distributor, city, phone…" value="' + esc(S.q) + '" style="flex:1;min-width:180px" data-ok="1"><button type="button" class="dw-btn" id="dNew">＋ New distributor</button></div>';
  if(!ds.length) h += '<div class="dw-card dw-empty"><div style="font-size:34px">🚚</div><b>No distributors yet</b><div class="dw-sub" style="margin:6px 0 12px">Create a distributor, choose which products he can see, and he can update stock, record sales and order from you.</div><button type="button" class="dw-btn" id="dNew2">＋ Create the first distributor</button></div>';
  else h += '<div class="dw-grid">' + list.map(function(d){
    var rows = visRows(d.id), u = rows.reduce(function(a, s){ return a + (Number(s.qty) || 0); }, 0), lo = lowOf(d);
    var low = rows.filter(function(s){ var n = Number(s.qty) || 0; return n > 0 && n <= lo; }).length, out = rows.filter(function(s){ return (Number(s.qty) || 0) <= 0; }).length;
    var sa = salesAgg(S.recent, d.id), oo = activeOrders(d.id).length, wa = waLink(d);
    return '<div class="dw-card"><div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-av">' + esc((d.name || '?').charAt(0).toUpperCase()) + '</div><div class="dw-grow"><b style="font-size:16px">' + esc(d.name) + '</b><div class="dw-sub">' + esc([d.city, d.phone].filter(Boolean).join(' · ') || '—') + '</div></div>' +
      (d.isActive === false ? '<span class="dw-chip bad">Inactive</span>' : isStale(d) ? '<span class="dw-chip warn">Stale</span>' : '<span class="dw-chip ok">Active</span>') + '</div>' +
      '<div class="dw-kpis" style="grid-template-columns:repeat(4,1fr);margin:12px 0 10px;gap:6px">' +
        '<div class="dw-kpi" style="padding:8px"><b style="font-size:17px">' + rows.length + '</b><span>Items</span></div><div class="dw-kpi" style="padding:8px"><b style="font-size:17px">' + u.toLocaleString('en-IN') + '</b><span>Units</span></div>' +
        '<div class="dw-kpi" style="padding:8px"><b style="font-size:17px;color:' + (low + out ? '#b23b3b' : '#1e7b46') + '">' + (low + out) + '</b><span>Low / out</span></div><div class="dw-kpi" style="padding:8px"><b style="font-size:17px">' + (S.recent ? sa.tu : '…') + '</b><span>Sold today</span></div></div>' +
      '<div class="dw-sub" style="margin-bottom:10px">Last stock update: <b>' + ago(lastFresh(d)) + '</b>' + (oo ? ' · <b style="color:#2b4f9e">' + oo + ' open order' + (oo > 1 ? 's' : '') + '</b>' : '') + '</div>' +
      '<div class="dw-flex"><button type="button" class="dw-btn" data-open="' + esc(d.id) + '" data-ok="1" style="flex:1">Open workspace</button>' + (wa ? '<a class="dw-btn ghost" href="' + esc(wa) + '" target="_blank" rel="noopener" data-ok="1" style="text-decoration:none;display:inline-flex;align-items:center">📲</a>' : '') + '</div></div>';
  }).join('') + '</div>' + (list.length ? '' : '<div class="dw-card dw-empty">No distributor matches “' + esc(S.q) + '”.</div>');
  setBody(h);
  $$('dQ') && ($$('dQ').oninput = function(e){ S.q = e.target.value; var p = e.target.selectionStart; viewList(); var b = $$('dQ'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} });
  if($$('dNew')) $$('dNew').onclick = openNew; if($$('dNew2')) $$('dNew2').onclick = openNew;
  main().querySelectorAll('[data-open]').forEach(function(b){ b.onclick = function(){ S.sel = b.getAttribute('data-open'); S.dtab = 'overview'; render(); window.scrollTo(0, 0); }; });
}

/* ================================================================== create / reset / delete */
function stockViewPicker(cur){
  var o = [['own', 'Only his own stock', 'He sees just the quantity he holds.'], ['company', 'Own + company stock', 'He also sees the company\'s existing stock (your Stock figure) for each item.'], ['all', 'Own + company + other distributors', 'He also sees what the other distributors hold in total.']];
  return o.map(function(x){ return '<label class="dw-opt' + (cur === x[0] ? ' on' : '') + '"><input type="radio" name="sv" value="' + x[0] + '"' + (cur === x[0] ? ' checked' : '') + '> <b>' + x[1] + '</b><div class="dw-sub">' + x[2] + '</div></label>'; }).join('');
}
function bindPicker(w){ w.querySelectorAll('input[name=sv]').forEach(function(r){ r.onchange = function(){ w.querySelectorAll('.dw-opt').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); }; }); }
function pickedView(w){ var r = w.querySelector('input[name=sv]:checked'); return r ? r.value : 'own'; }
function credsText(d, username, pw){ return 'Ashirvad distributor login\nName: ' + d.name + '\nLogin ID: ' + username + '\nPassword: ' + pw + '\nOpen: ' + portalUrl(); }
function showCreds(title, d, username, pw){
  var wa = String(d.phone || '').replace(/\D/g, ''); if(wa.length === 10) wa = '91' + wa;
  var w = sheet('<h3 class="dw-h">' + esc(title) + '</h3><div class="dw-card" style="background:#f3f6fc"><div class="dw-sub">Login ID</div><div style="font-size:18px;font-weight:700">' + esc(username) + '</div><div class="dw-sub" style="margin-top:8px">Password</div><div style="font-size:18px;font-weight:700;letter-spacing:.5px">' + esc(pw) + '</div><div class="dw-sub" style="margin-top:8px">Link</div><div style="word-break:break-all">' + esc(portalUrl()) + '</div></div>' +
    '<div class="dw-sub">⚠ The password is shown only now. Share it with the distributor — you can always set a new one from this workspace.</div><div class="dw-flex" style="margin-top:12px"><button type="button" class="dw-btn" id="cdCopy" data-ok="1">Copy details</button>' + (wa ? '<a class="dw-btn green" id="cdWa" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(credsText(d, username, pw)) + '" target="_blank" rel="noopener" style="text-decoration:none">📲 Send on WhatsApp</a>' : '') + '<button type="button" class="dw-btn ghost" id="cdOk" data-ok="1">Done</button></div>');
  $$('cdCopy').onclick = function(){ copyText(credsText(d, username, pw)); }; $$('cdOk').onclick = closeSheet;
}
function openNew(){
  var w = sheet('<h3 class="dw-h">New distributor</h3>' +
    '<label class="dw-lab">Business name *</label><input class="dw-in" id="nName">' +
    '<div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-grow"><label class="dw-lab">Phone (for WhatsApp)</label><input class="dw-in" id="nPhone" inputmode="tel"></div><div class="dw-grow"><label class="dw-lab">City</label><input class="dw-in" id="nCity"></div></div>' +
    '<label class="dw-lab">Login ID * <span style="font-weight:400">(letters / numbers, he types this to sign in)</span></label><input class="dw-in" id="nUser" autocapitalize="none" autocomplete="off">' +
    '<label class="dw-lab">Password * (min 6)</label><div class="dw-flex" style="flex-wrap:nowrap"><input class="dw-in" id="nPass" value="' + genPass() + '"><button type="button" class="dw-btn ghost sm" id="nGen" data-ok="1">New</button></div>' +
    '<label class="dw-lab">What can he see about stock?</label>' + stockViewPicker('own') +
    '<label class="dw-opt"><input type="checkbox" id="nUp"> <b>Can add his own products</b><div class="dw-sub">He can send “add product” requests, you approve them.</div></label>' +
    '<label class="dw-opt"><input type="checkbox" id="nPrice"> <b>Show MRP to him by default</b></label>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="nNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="nYes">Create distributor</button></div>');
  bindPicker(w);
  $$('nGen').onclick = function(){ $$('nPass').value = genPass(); }; $$('nNo').onclick = closeSheet;
  $$('nYes').onclick = function(){
    var name = $$('nName').value.trim(), user = slug($$('nUser').value), pw = $$('nPass').value;
    if(!name){ toast('Enter the business name'); return; }
    if(user.length < 3){ toast('Login ID needs at least 3 letters / numbers'); return; }
    if(pw.length < 6){ toast('Password needs at least 6 characters'); return; }
    var phone = $$('nPhone').value.trim(), btn = $$('nYes'); btn.disabled = true; btn.textContent = 'Creating…';
    db().collection('login_index').doc(user).get().then(function(ix){
      if(ix.exists) throw new Error('The login ID “' + user + '” is already used by another login. Choose a different one (or delete that distributor first).');
      var id = 'd' + rid(7), email = 'u' + rid(10) + '@' + DOMAIN, now = Date.now();
      return createAuth(email, pw).then(function(uid){
        return commitOps([
          { ref: db().collection('distributors').doc(id), merge: false, data: { name: name, phone: $$('nPhone').value.trim(), city: $$('nCity').value.trim(), notice: '', isActive: true, canUpload: $$('nUp').checked, defaultShowPrice: $$('nPrice').checked, stockView: pickedView(w), username: user, loginMode: 'uid', createdAt: now, lastConfirmedAt: 0 } },
          { ref: db().collection('dist_logins').doc(uid), merge: false, data: { distributorId: id, roleId: 'owner', name: name, username: user, isActive: true, createdAt: now } },
          { ref: db().collection('login_index').doc(user), merge: false, data: { email: email, uid: uid, kind: 'distributor', distributorId: id } }
        ]).then(function(){ API.logAudit('Distributor created', name + ' (' + user + ')'); return id; });
      });
    }).then(function(id){ var w2 = $$('dvOv'); if(w2) w2.remove(); S.sel = id; S.dtab = 'products'; render(); showCreds('Distributor created ✔', { name: name, phone: phone }, user, pw); })
      .catch(function(e){ btn.disabled = false; btn.textContent = 'Create distributor'; toast(authMsg(e)); });
  };
}
/* target: { distId, roleId, username, name, oldUid|null, legacy } */
function openReset(t, d){
  var w = sheet('<h3 class="dw-h">Reset password</h3><div class="dw-sub">For <b>' + esc(t.name || t.username) + '</b> (login ID <b>' + esc(t.username) + '</b>). The old password stops working immediately; the login ID stays the same.</div>' +
    '<label class="dw-lab">New password (min 6)</label><div class="dw-flex" style="flex-wrap:nowrap"><input class="dw-in" id="rPass" value="' + genPass() + '"><button type="button" class="dw-btn ghost sm" id="rGen" data-ok="1">New</button></div>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="rNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="rYes">Set new password</button></div>');
  $$('rGen').onclick = function(){ $$('rPass').value = genPass(); }; $$('rNo').onclick = closeSheet;
  $$('rYes').onclick = function(){
    var pw = $$('rPass').value; if(pw.length < 6){ toast('Password needs at least 6 characters'); return; }
    var btn = $$('rYes'); btn.disabled = true; btn.textContent = 'Saving…';
    var email = 'u' + rid(10) + '@' + DOMAIN, now = Date.now();
    createAuth(email, pw).then(function(uid){
      var ops = [
        { ref: db().collection('dist_logins').doc(uid), merge: false, data: { distributorId: t.distId, roleId: t.roleId, name: t.name || '', username: t.username, isActive: t.isActive !== false, createdAt: now } },
        { ref: db().collection('login_index').doc(t.username), merge: false, data: { email: email, uid: uid, kind: 'distributor', distributorId: t.distId } }
      ];
      if(t.oldUid) ops.push({ ref: db().collection('dist_logins').doc(t.oldUid), del: true });
      if(t.legacy) ops.push({ ref: db().collection('distributors').doc(t.distId), data: { loginMode: 'uid', username: t.username } });
      return commitOps(ops);
    }).then(function(){ API.logAudit('Distributor password reset', t.username); var w2 = $$('dvOv'); if(w2) w2.remove(); render(); showCreds('New password set ✔', d || {}, t.username, pw); })
      .catch(function(e){ btn.disabled = false; btn.textContent = 'Set new password'; toast(authMsg(e)); });
  };
}
function resetOwner(d){
  var ol = ownerLogin(d.id);
  openReset({ distId: d.id, roleId: 'owner', username: (ol && ol.username) || d.username || d.id, name: d.name, oldUid: ol ? ol.id : null, legacy: !ol, isActive: true }, d);
}
function openDelete(d){
  var n = stockOf(d.id).length;
  var w = sheet('<h3 class="dw-h" style="color:#b23b3b">Delete ' + esc(d.name) + '?</h3><div class="dw-sub" style="margin-bottom:8px">This permanently removes the distributor, his login and team logins, his ' + n + ' stock row(s) and his product requests. His stock is also removed from the catalogue availability.</div>' +
    '<label class="dw-opt"><input type="checkbox" id="xHist" checked> <b>Also delete his sales, orders and stock history</b><div class="dw-sub">Recommended — a new distributor created later with the same login ID then starts completely clean. Untick to keep the records for accounts.</div></label>' +
    '<div class="dw-sub">After deleting you can create a distributor with the same name or login ID again.</div><div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="xNo" data-ok="1">Cancel</button><button type="button" class="dw-btn red" id="xYes">Delete forever</button></div>');
  $$('xNo').onclick = closeSheet;
  $$('xYes').onclick = function(){
    var btn = $$('xYes'); btn.disabled = true; btn.textContent = 'Deleting…';
    var ops = [{ ref: db().collection('distributors').doc(d.id), del: true }];
    stockOf(d.id).forEach(function(s){ ops.push({ ref: db().collection('distributor_stock').doc(s.id), del: true }); });
    Array.from(S.reqs.values()).filter(function(r){ return r.distributorId === d.id; }).forEach(function(r){ ops.push({ ref: db().collection('distributor_requests').doc(r.id), del: true }); });
    var names = {}; if(d.username) names[d.username] = 1;
    Array.from(S.logins.values()).filter(function(l){ return l.distributorId === d.id; }).forEach(function(l){ ops.push({ ref: db().collection('dist_logins').doc(l.id), del: true }); if(l.username) names[l.username] = 1; });
    Object.keys(names).forEach(function(u){ ops.push({ ref: db().collection('login_index').doc(u), del: true }); });
    var extra = $$('xHist').checked ? ['distributor_sales', 'distributor_orders', 'distributor_log'].map(function(c){ return db().collection(c).where('distributorId', '==', d.id).get().then(function(s){ s.docs.forEach(function(x){ ops.push({ ref: x.ref, del: true }); }); }); }) : [];
    Promise.all(extra).then(function(){ return commitOps(ops); }).then(function(){ API.logAudit('Distributor deleted', d.name); S.sel = null; S.pt = null; S.sc = {}; S.recent = null; var w2 = $$('dvOv'); if(w2) w2.remove(); render(); toast('Deleted. You can create it again any time.'); queueSync(1500); })
      .catch(function(e){ btn.disabled = false; btn.textContent = 'Delete forever'; fail(e); });
  };
}

/* ================================================================== workspace: overview */
function statusOfQty(n, lo){ return n <= 0 ? 'out' : n <= lo ? 'low' : 'ok'; }
function pillQty(n, lo){ var s = statusOfQty(n, lo); return '<span class="dw-chip ' + (s === 'out' ? 'bad' : s === 'low' ? 'warn' : 'ok') + '">' + (s === 'out' ? 'Out' : s === 'low' ? 'Low' : 'In stock') + '</span>'; }
function wsOverview(d){
  var rows = visRows(d.id), lo = lowOf(d), units = rows.reduce(function(a, s){ return a + (Number(s.qty) || 0); }, 0);
  var out = rows.filter(function(s){ return (Number(s.qty) || 0) <= 0; }), low = rows.filter(function(s){ var n = Number(s.qty) || 0; return n > 0 && n <= lo; });
  var attn = out.concat(low).slice(0, 8), oo = activeOrders(d.id), wa = waLink(d), pr = pendingReqs().filter(function(r){ return r.distributorId === d.id; });
  var h = '<div class="dw-kpis">' + kpi(rows.length, 'Items he can see') + kpi(units.toLocaleString('en-IN'), 'Units in his stock') + kpi(out.length, 'Out of stock', out.length ? '#b23b3b' : '') + kpi(low.length, 'Low stock (≤ ' + lo + ')', low.length ? '#8a5a00' : '') +
    '<div class="dw-kpi"><b id="ovSt">…</b><span>Sold today (units)</span></div><div class="dw-kpi"><b id="ovS30">…</b><span>Sold in 30 days (units)</span></div>' + kpi(oo.length, 'Open orders', oo.length ? '#2b4f9e' : '') + kpi(ago(lastFresh(d)), 'Last stock update') + '</div>';
  h += '<div class="dw-card"><div class="dw-h">Quick actions</div><div class="dw-flex"><button type="button" class="dw-btn" id="qaProd" data-ok="1">🗂 Choose products</button><button type="button" class="dw-btn ghost" id="qaStock" data-ok="1">📦 View his stock</button>' +
    '<button type="button" class="dw-btn ghost" id="qaReset">🔑 Reset password</button>' + (wa ? '<a class="dw-btn ghost" href="' + esc(wa) + '" target="_blank" rel="noopener" data-ok="1" style="text-decoration:none">📲 Remind to update stock</a>' : '') + '</div></div>';
  if(pr.length) h += '<div class="dw-card"><div class="dw-h">📥 ' + pr.length + ' product request' + (pr.length > 1 ? 's' : '') + ' waiting</div><button type="button" class="dw-btn sm" id="qaReq" data-ok="1">Review requests</button></div>';
  if(oo.length) h += '<div class="dw-card"><div class="dw-h">🛒 Open orders</div>' + oo.slice(0, 4).map(function(o){ return '<div class="dw-row"><div class="dw-grow"><b>' + esc(o.no) + '</b><div class="dw-sub">' + (Number(o.units) || 0) + ' units · ' + dtime(o.createdAt) + '</div></div>' + orderPill(o.status) + '</div>'; }).join('') + '<button type="button" class="dw-btn sm" id="qaOrd" data-ok="1" style="margin-top:8px">Manage orders</button></div>';
  h += '<div class="dw-card"><div class="dw-h">⚠ Needs attention</div>' + (attn.length ? attn.map(function(s){ var n = Number(s.qty) || 0; return '<div class="dw-row"><div class="dw-grow"><b>' + esc(s.name) + '</b>' + (s.size ? ' <span class="dw-sub">— ' + esc(s.size) + '</span>' : '') + '<div class="dw-sub">' + esc(s.part) + '</div></div><b>' + n + '</b>' + pillQty(n, lo) + '</div>'; }).join('') : '<div class="dw-sub">Everything is in stock 👍</div>') + '</div>';
  h += '<div class="dw-card"><div class="dw-h">🕘 Recent activity</div><div id="ovLog" class="dw-sub">Loading…</div></div>';
  setBody(h);
  var go = function(id, tab){ var b = $$(id); if(b) b.onclick = function(){ S.dtab = tab; render(); }; };
  go('qaProd', 'products'); go('qaStock', 'stock'); go('qaOrd', 'orders');
  if($$('qaReq')) $$('qaReq').onclick = function(){ S.sel = null; S.tab = 'requests'; render(); };
  $$('qaReset').onclick = function(){ resetOwner(d); };
  fetchSales('30', d.id, function(rows, err){ if(!rows) return; var a = salesAgg(rows, d.id); if($$('ovSt')) $$('ovSt').textContent = a.tu; if($$('ovS30')) $$('ovS30').textContent = a.u + (a.v ? ' · ' + money(a.v) : ''); });
  db().collection('distributor_log').where('distributorId', '==', d.id).orderBy('ts', 'desc').limit(12).get().then(function(s){
    var el = $$('ovLog'); if(!el) return;
    el.innerHTML = s.empty ? 'No stock activity yet.' : s.docs.map(function(x){ return logLine(x.data()); }).join('');
  }, function(e){ var el = $$('ovLog'); if(el) el.textContent = 'Could not load activity: ' + e.message; });
}
function logLine(l){
  var d = (Number(l.to) || 0) - (Number(l.from) || 0), tag = l.type ? ' <span class="dw-chip">' + esc(l.type) + (l.ref ? ' ' + esc(l.ref) : '') + '</span>' : '';
  return '<div class="dw-row"><div class="dw-grow"><b style="font-size:13px">' + esc(l.name) + '</b>' + tag + '<div class="dw-sub">' + dtime(l.ts) + (l.by ? ' · ' + esc(l.by) : '') + '</div></div><div style="text-align:right"><b style="color:' + (d >= 0 ? '#1e7b46' : '#b23b3b') + '">' + (d >= 0 ? '+' : '') + d + '</b><div class="dw-sub">' + (Number(l.from) || 0) + ' → ' + (Number(l.to) || 0) + '</div></div></div>';
}

/* ================================================================== workspace: his stock list */
function wsStock(d){
  var lo = lowOf(d), q = S.stQ.toLowerCase().trim();
  var rows = visRows(d.id).filter(function(s){ var n = Number(s.qty) || 0, st = statusOfQty(n, lo); return (S.stF === 'all' || S.stF === st) && (!q || (s.name + ' ' + (s.size || '') + ' ' + s.part).toLowerCase().indexOf(q) >= 0); })
    .sort(function(a, b){ return String(a.name).localeCompare(String(b.name)) || String(a.size).localeCompare(String(b.size), undefined, { numeric: true }); });
  var chip = function(k, l){ return '<button type="button" class="dw-nav' + (S.stF === k ? ' on' : '') + '" data-sf="' + k + '" data-ok="1">' + l + '</button>'; };
  var h = '<div class="dw-flex" style="margin-bottom:10px"><input class="dw-in" id="stQ" placeholder="Search item / spec / part…" value="' + esc(S.stQ) + '" style="flex:1;min-width:170px" data-ok="1"><button type="button" class="dw-btn ghost" id="stCsv" data-ok="1">⬇ CSV</button></div>' +
    '<div class="dw-bar">' + chip('all', 'All') + chip('low', 'Low') + chip('out', 'Out of stock') + '</div>';
  h += !rows.length ? '<div class="dw-card dw-empty">No items match. Use <b>Products</b> to choose what he sees.</div>' : '<div class="dw-card">' + rows.slice(0, 200).map(function(s){
    var p = productById(s.productId), n = Number(s.qty) || 0, cs = p ? companyOf(p) : null;
    return '<div class="dw-row"><div class="dw-grow"><b>' + esc(s.name) + '</b>' + (s.size ? ' <span class="dw-sub">— ' + esc(s.size) + '</span>' : '') + '<div class="dw-sub">' + esc(s.part) + (s.catName ? ' · ' + esc(s.catName) : '') + ' · company stock ' + (p ? (cs === null ? '∞' : cs) : '—') + ' · updated ' + ago(s.updatedAt) + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:19px;font-weight:700">' + n + '</div>' + pillQty(n, lo) + '</div><button type="button" class="dw-btn ghost sm" data-adj="' + esc(s.id) + '">Adjust</button></div>'; }).join('') + (rows.length > 200 ? '<div class="dw-sub" style="padding:8px">Showing 200 of ' + rows.length + ' — use search.</div>' : '') + '</div>';
  setBody(h);
  $$('stQ').oninput = function(e){ S.stQ = e.target.value; var p = e.target.selectionStart; wsStock(d); var b = $$('stQ'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} };
  main().querySelectorAll('[data-sf]').forEach(function(b){ b.onclick = function(){ S.stF = b.getAttribute('data-sf'); wsStock(d); }; });
  $$('stCsv').onclick = function(){ var out = [['Product', 'Spec', 'Part', 'Category', 'His stock', 'Company stock', 'Updated']]; visRows(d.id).forEach(function(s){ var p = productById(s.productId); out.push([s.name, s.size, s.part, s.catName, Number(s.qty) || 0, p ? (companyOf(p) === null ? 'unlimited' : companyOf(p)) : '', s.updatedAt ? new Date(s.updatedAt).toLocaleString('en-IN') : '']); }); download('stock-' + d.name + '.csv', out); };
  main().querySelectorAll('[data-adj]').forEach(function(b){ b.onclick = function(){ openAdjust(S.stock.get(b.getAttribute('data-adj')), d); }; });
}
function openAdjust(s, d){
  if(!s) return;
  sheet('<h3 class="dw-h">Adjust stock</h3><div><b>' + esc(s.name) + '</b>' + (s.size ? ' — ' + esc(s.size) : '') + '<div class="dw-sub">' + esc(s.part) + ' · currently <b>' + (Number(s.qty) || 0) + '</b></div></div>' +
    '<label class="dw-lab">New quantity</label><input class="dw-in" id="aQty" type="number" min="0" value="' + (Number(s.qty) || 0) + '"><label class="dw-lab">Reason (optional)</label><input class="dw-in" id="aWhy" placeholder="e.g. physical count correction">' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="aNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="aYes">Save</button></div>');
  $$('aNo').onclick = closeSheet;
  $$('aYes').onclick = function(){
    var to = Math.max(0, Math.floor(Number($$('aQty').value) || 0)), from = Number(s.qty) || 0, now = Date.now();
    if(to === from){ closeSheet(); return; }
    commitOps([{ ref: db().collection('distributor_stock').doc(s.id), data: { qty: to, updatedAt: now, updatedBy: 'admin' } },
      { ref: db().collection('distributor_log').doc(), merge: false, data: { distributorId: d.id, productId: s.productId, name: s.name + (s.size ? ' — ' + s.size : ''), part: s.part, from: from, to: to, ts: now, by: 'admin', type: 'adjust', ref: $$('aWhy').value.trim().slice(0, 60) } }])
      .then(function(){ API.logAudit('Distributor stock adjusted', d.name + ': ' + s.part + ' ' + from + '→' + to); toast('Stock updated'); closeSheet(); queueSync(1500); }).catch(fail);
  };
}

/* ================================================================== sales (global or one distributor) */
function viewSales(distId){
  var A = S.sl, body = $$('dvBody');
  var key = A.period + '|' + (distId || A.dist || '');
  setBody('<div class="dw-card dw-empty">Loading sales…</div>');
  fetchSales(A.period, distId || A.dist || '', function(rows, err){
    if(!$$('dvBody')) return;
    if(!rows){ showFail(err, 'distributor_sales'); return; }
    var by = {}, pm = {}, dm = {}, tot = { n: 0, u: 0, a: 0, v: 0 };
    rows.forEach(function(s){
      if(s.status === 'void'){ tot.v++; return; }
      var u = Number(s.units) || 0, a = Number(s.amount) || 0; tot.n++; tot.u += u; tot.a += a;
      var g = by[s.distributorId] = by[s.distributorId] || { id: s.distributorId, n: 0, u: 0, a: 0, last: 0 }; g.n++; g.u += u; g.a += a; g.last = Math.max(g.last, s.ts || 0);
      var day = new Date(s.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), dd = dm[day] = dm[day] || { day: day, ts: s.ts, n: 0, u: 0, a: 0 }; dd.n++; dd.u += u; dd.a += a;
      (s.lines || []).forEach(function(l){ var k = String(l.part || l.name), p = pm[k] = pm[k] || { name: l.name, size: l.size, part: l.part, u: 0, a: 0, n: 0, who: {} }; var q = Number(l.qty) || 0; p.u += q; p.a += q * (Number(l.rate) || 0); p.n++; p.who[s.distributorId] = (p.who[s.distributorId] || 0) + q; });
    });
    var modes = distId ? [['prod', 'By product'], ['day', 'By day'], ['list', 'Each sale']] : [['dist', 'By distributor'], ['prod', 'By product'], ['day', 'By day'], ['list', 'Each sale']];
    var mode = modes.some(function(m){ return m[0] === A.mode; }) ? A.mode : modes[0][0];
    var sel = function(id, opts, v){ return '<select class="dw-sel" id="' + id + '" data-ok="1" style="width:auto">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    var h = '<div class="dw-flex" style="margin-bottom:10px">' + (distId ? '' : sel('slDist', [['', 'All distributors']].concat(Array.from(S.dists.values()).map(function(d){ return [d.id, esc(d.name)]; })), A.dist || '')) +
      sel('slPer', [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']], A.period) + '<button type="button" class="dw-btn ghost sm" id="slCsv" data-ok="1">⬇ CSV</button></div>' +
      '<div class="dw-kpis">' + kpi(tot.n, 'Sales') + kpi(tot.u, 'Units sold') + kpi(tot.a ? money(tot.a) : '—', 'Value (where rate entered)') + kpi(tot.v, 'Voided') + '</div>' +
      '<div class="dw-bar">' + modes.map(function(m){ return '<button type="button" class="dw-nav' + (mode === m[0] ? ' on' : '') + '" data-sm="' + m[0] + '" data-ok="1">' + m[1] + '</button>'; }).join('') + '</div>';
    if(!tot.n) h += '<div class="dw-card dw-empty">No sales in this period.</div>';
    else if(mode === 'dist') h += '<div class="dw-card">' + Object.keys(by).map(function(k){ return by[k]; }).sort(function(x, y){ return y.u - x.u; }).map(function(g){ return '<div class="dw-row"><div class="dw-grow"><b>' + esc(distName(g.id)) + '</b><div class="dw-sub">' + g.n + ' sales · last ' + ago(g.last) + '</div></div><div style="text-align:right"><b>' + g.u + ' units</b><div class="dw-sub">' + (g.a ? money(g.a) : '') + '</div></div></div>'; }).join('') + '</div>';
    else if(mode === 'prod') h += '<div class="dw-card">' + Object.keys(pm).map(function(k){ return pm[k]; }).sort(function(x, y){ return y.u - x.u; }).slice(0, 300).map(function(p){ return '<div class="dw-row"><div class="dw-grow"><b>' + esc(p.name) + '</b>' + (p.size ? ' <span class="dw-sub">— ' + esc(p.size) + '</span>' : '') + '<div class="dw-sub">' + esc(p.part) + ' · ' + p.n + ' sale(s)' + (distId ? '' : ' · ' + Object.keys(p.who).map(function(k){ return esc(distName(k)) + ' ' + p.who[k]; }).join(', ')) + '</div></div><div style="text-align:right"><b>' + p.u + '</b><div class="dw-sub">' + (p.a ? money(p.a) : '') + '</div></div></div>'; }).join('') + '</div>';
    else if(mode === 'day') h += '<div class="dw-card">' + Object.keys(dm).map(function(k){ return dm[k]; }).sort(function(x, y){ return y.ts - x.ts; }).map(function(g){ return '<div class="dw-row"><div class="dw-grow"><b>' + esc(g.day) + '</b><div class="dw-sub">' + g.n + ' sale(s)</div></div><div style="text-align:right"><b>' + g.u + ' units</b><div class="dw-sub">' + (g.a ? money(g.a) : '') + '</div></div></div>'; }).join('') + '</div>';
    else h += '<div class="dw-card">' + rows.slice(0, 150).map(function(s){ var vd = s.status === 'void'; return '<div class="dw-row" style="align-items:flex-start;' + (vd ? 'opacity:.55' : '') + '"><div class="dw-grow"><b>' + esc(s.no || 'Sale') + '</b>' + (s.customer ? ' · ' + esc(s.customer) : '') + (vd ? ' <span class="dw-chip bad">Voided</span>' : '') + '<div class="dw-sub">' + (distId ? '' : esc(distName(s.distributorId)) + ' · ') + dtime(s.ts) + (s.by ? ' · ' + esc(s.by) : '') + '</div><div class="dw-sub">' + (s.lines || []).map(function(l){ return esc(l.name) + (l.size ? ' (' + esc(l.size) + ')' : '') + ' × ' + (Number(l.qty) || 0); }).join(', ') + '</div></div><div style="text-align:right"><b>' + (Number(s.units) || 0) + ' u</b><div class="dw-sub">' + (Number(s.amount) ? money(s.amount) : '') + '</div></div></div>'; }).join('') + '</div>';
    setBody(h);
    var rf = function(){ viewSales(distId); };
    if($$('slDist')) $$('slDist').onchange = function(e){ A.dist = e.target.value; rf(); };
    $$('slPer').onchange = function(e){ A.period = e.target.value; rf(); };
    main().querySelectorAll('[data-sm]').forEach(function(b){ b.onclick = function(){ A.mode = b.getAttribute('data-sm'); rf(); }; });
    $$('slCsv').onclick = function(){ var out = [['When', 'Distributor', 'Customer', 'Product', 'Spec', 'Part', 'Qty', 'Rate', 'Status', 'Entered by']]; rows.forEach(function(s){ (s.lines || []).forEach(function(l){ out.push([new Date(s.ts).toLocaleString('en-IN'), distName(s.distributorId), s.customer || '', l.name, l.size || '', l.part, l.qty, l.rate || '', s.status, s.by || '']); }); }); download('sales-' + A.period + '.csv', out); };
  });
}
function wsSales(d){ viewSales(d.id); }
function showFail(e, coll){
  var denied = e && e.code === 'permission-denied';
  setBody('<div class="dw-card"><b style="color:#b23b3b">Could not load ' + esc(coll) + '</b><div class="dw-sub" style="margin:6px 0">' + esc((e && e.message) || e) + '</div>' + (denied ? '<div class="dw-sub">Firebase refused this read — the rules online are older than this app. Publish them with <code>firebase deploy --only firestore</code>, then run the check.</div><button type="button" class="dw-btn sm" id="fbChk" data-ok="1" style="margin-top:8px">🔐 Check which parts are blocked</button>' : (e && e.code === 'failed-precondition' ? '<div class="dw-sub">An index is still building or missing: run <code>firebase deploy --only firestore</code> and wait a few minutes.</div>' : '')) + '</div>');
  var b = $$('fbChk'); if(b) b.onclick = function(){ S.sel = null; S.tab = 'health'; render(); setTimeout(rulesCheck, 80); };
}

/* ================================================================== orders (global or one distributor) */
var ST_LABEL = { placed: 'New', accepted: 'Accepted', dispatched: 'Dispatched', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled' };
var ST_CLS = { placed: 'info', accepted: 'warn', dispatched: 'info', delivered: 'ok', rejected: 'bad', cancelled: '' };
function orderPill(st){ return '<span class="dw-chip ' + (ST_CLS[st] || '') + '">' + esc(ST_LABEL[st] || st) + '</span>'; }
var NEXT = { placed: [['accept', 'Accept'], ['reject', 'Reject']], accepted: [['dispatch', 'Dispatch'], ['reject', 'Reject']], dispatched: [['deliver', 'Mark delivered']] };
function viewOrders(distId){
  var O = S.od;
  var rows = Array.from(S.orders.values()).filter(function(o){
    if(distId && o.distributorId !== distId) return false;
    return O.st === 'all' ? true : O.st === 'active' ? ['placed', 'accepted', 'dispatched'].indexOf(o.status) >= 0 : o.status === O.st;
  }).sort(function(x, y){ return (y.createdAt || 0) - (x.createdAt || 0); });
  var h = '<div class="dw-flex" style="margin-bottom:10px"><select class="dw-sel" id="orSt" data-ok="1" style="width:auto">' + [['active', 'Open orders'], ['placed', 'New'], ['accepted', 'Accepted'], ['dispatched', 'Dispatched'], ['delivered', 'Delivered'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled'], ['all', 'All']].map(function(o){ return '<option value="' + o[0] + '"' + (O.st === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  h += !rows.length ? '<div class="dw-card dw-empty">No orders here.</div>' : rows.slice(0, 120).map(function(o){
    var acts = (!RO() && NEXT[o.status]) ? NEXT[o.status].map(function(x){ return '<button type="button" class="dw-btn sm' + (x[0] === 'reject' ? ' ghost' : '') + '" data-oa="' + x[0] + '" data-oid="' + esc(o.id) + '">' + x[1] + '</button>'; }).join(' ') : '';
    return '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><b style="font-size:15px">' + esc(o.no) + '</b>' + orderPill(o.status) + '</div>' +
      '<div class="dw-sub">' + (distId ? '' : '<b>' + esc(distName(o.distributorId)) + '</b> · ') + dtime(o.createdAt) + ' · ' + (Number(o.units) || 0) + ' units' + (o.by && o.by !== o.distributorId ? ' · by ' + esc(o.by) : '') + '</div>' +
      '<div style="margin:6px 0">' + (o.lines || []).map(function(l){ return '<div class="dw-row" style="padding:5px 0"><div class="dw-grow">' + esc(l.name) + (l.size ? ' <span class="dw-sub">— ' + esc(l.size) + '</span>' : '') + ' <span class="dw-sub">' + esc(l.part) + '</span></div><b>' + (Number(l.qty) || 0) + '</b></div>'; }).join('') + '</div>' +
      (o.note ? '<div class="dw-sub">📝 ' + esc(o.note) + '</div>' : '') + (o.expected ? '<div class="dw-sub">Expected: <b>' + esc(o.expected) + '</b></div>' : '') +
      '<div class="dw-sub" style="margin:4px 0">' + (o.history || []).map(function(x){ return '• ' + esc(ST_LABEL[x.s] || x.s) + ' — ' + dtime(x.ts) + (x.by ? ' · ' + esc(x.by) : '') + (x.note ? ' — ' + esc(x.note) : ''); }).join('<br>') + '</div>' +
      (acts ? '<div class="dw-flex" style="margin-top:6px">' + acts + '</div>' : '') + '</div>'; }).join('');
  setBody(h);
  $$('orSt').onchange = function(e){ O.st = e.target.value; viewOrders(distId); };
  main().querySelectorAll('[data-oa]').forEach(function(b){ b.onclick = function(){ orderAction(S.orders.get(b.getAttribute('data-oid')), b.getAttribute('data-oa')); }; });
}
function wsOrders(d){ viewOrders(d.id); }
function orderAction(o, act){
  if(!o) return;
  var to = { accept: 'accepted', reject: 'rejected', dispatch: 'dispatched', deliver: 'delivered' }[act];
  sheet('<h3 class="dw-h">' + esc(ST_LABEL[to]) + ' — ' + esc(o.no) + '</h3><div class="dw-sub">' + esc(distName(o.distributorId)) + ' · ' + (Number(o.units) || 0) + ' units</div>' +
    (act === 'dispatch' ? '<label class="dw-lab">Expected delivery date</label><input type="date" class="dw-in" id="oExp">' : '') +
    (act === 'deliver' ? '<label class="dw-opt"><input type="checkbox" id="oAdd"' + (o.stockAdded ? ' disabled' : ' checked') + '> <b>Add these quantities to his stock</b>' + (o.stockAdded ? ' (already added)' : '') + '<div class="dw-sub">His stock and the catalogue availability go up by the delivered quantities.</div></label>' : '') +
    '<label class="dw-lab">Note for the distributor (optional)</label><textarea class="dw-in" id="oNote" rows="2"></textarea>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="oNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="oYes">Confirm</button></div>');
  $$('oNo').onclick = closeSheet;
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
    commitOps(ops).then(function(){ API.logAudit('Distributor order ' + to, o.no + ' · ' + distName(o.distributorId)); toast(ST_LABEL[to] + (miss ? ' (' + miss + ' item(s) not on his list — stock not added for those)' : '')); closeSheet(); queueSync(1500); }).catch(function(e){ $$('oYes').disabled = false; fail(e); });
  };
}

/* ================================================================== workspace: login & team */
function wsAccess(d){
  var ol = ownerLogin(d.id), team = teamOf(d.id), roleName = function(id){ var r = S.roles.get(id); return r ? r.name : '(role deleted)'; };
  var h = '<div class="dw-card"><div class="dw-h">🔑 Distributor login</div><div class="dw-row"><div class="dw-grow"><div class="dw-sub">Login ID</div><b style="font-size:16px">' + esc((ol && ol.username) || d.username || d.id) + '</b></div><button type="button" class="dw-btn" id="acReset">Reset password</button></div>' +
    '<div class="dw-sub">He signs in at <b>' + esc(portalUrl()) + '</b>. Passwords are never stored or shown after creation — if he forgets it, set a new one here and send it to him.' + (ol ? '' : ' <b>This is an older login — resetting the password upgrades it.</b>') + '</div></div>';
  h += '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><div class="dw-h" style="margin:0">👥 Team members</div><button type="button" class="dw-btn sm" id="tmAdd"' + (S.roles.size ? '' : ' disabled') + '>＋ Add team member</button></div>' +
    '<div class="dw-sub" style="margin:4px 0 8px">Extra logins for his people (storekeeper, salesman…), each with a role that limits what they can do.' + (S.roles.size ? '' : ' <b>Create roles first in the 🔐 Access tab (owner).</b>') + '</div>' +
    (team.length ? team.map(function(t){ return '<div class="dw-row"><div class="dw-grow"><b>' + esc(t.name || t.username) + '</b><div class="dw-sub">ID ' + esc(t.username) + ' · ' + esc(roleName(t.roleId)) + (t.isActive === false ? ' · <b style="color:#b23b3b">switched off</b>' : '') + '</div></div>' +
      '<button type="button" class="dw-btn ghost sm" data-tre="' + esc(t.id) + '">Password</button><button type="button" class="dw-btn ghost sm" data-tact="' + esc(t.id) + '">' + (t.isActive === false ? 'Switch on' : 'Switch off') + '</button><button type="button" class="dw-btn ghost sm" data-trm="' + esc(t.id) + '">Remove</button></div>'; }).join('') : '<div class="dw-sub">No team members yet.</div>') + '</div>';
  setBody(h);
  $$('acReset').onclick = function(){ resetOwner(d); };
  $$('tmAdd').onclick = function(){ openTeamAdd(d); };
  main().querySelectorAll('[data-tre]').forEach(function(b){ b.onclick = function(){ var t = S.logins.get(b.getAttribute('data-tre')); openReset({ distId: d.id, roleId: t.roleId, username: t.username, name: t.name, oldUid: t.id, legacy: false, isActive: t.isActive }, d); }; });
  main().querySelectorAll('[data-tact]').forEach(function(b){ b.onclick = function(){ var t = S.logins.get(b.getAttribute('data-tact')); db().collection('dist_logins').doc(t.id).update({ isActive: t.isActive === false }).catch(fail); }; });
  main().querySelectorAll('[data-trm]').forEach(function(b){ b.onclick = function(){ var t = S.logins.get(b.getAttribute('data-trm')); if(!confirm('Remove ' + (t.name || t.username) + '? Their login stops working; the login ID can be used again.')) return;
    commitOps([{ ref: db().collection('dist_logins').doc(t.id), del: true }, { ref: db().collection('login_index').doc(t.username), del: true }]).then(function(){ API.logAudit('Distributor team member removed', t.username); toast('Removed'); }).catch(fail); }; });
}
function openTeamAdd(d){
  var rOpts = Array.from(S.roles.values()).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); }).map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('');
  sheet('<h3 class="dw-h">Add team member — ' + esc(d.name) + '</h3><label class="dw-lab">Name *</label><input class="dw-in" id="tName"><label class="dw-lab">Login ID *</label><input class="dw-in" id="tUser" autocapitalize="none" autocomplete="off">' +
    '<label class="dw-lab">Password * (min 6)</label><div class="dw-flex" style="flex-wrap:nowrap"><input class="dw-in" id="tPass" value="' + genPass() + '"><button type="button" class="dw-btn ghost sm" id="tGen" data-ok="1">New</button></div>' +
    '<label class="dw-lab">Role</label><select class="dw-sel" id="tRole">' + rOpts + '</select><div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="tNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="tYes">Create</button></div>');
  $$('tGen').onclick = function(){ $$('tPass').value = genPass(); }; $$('tNo').onclick = closeSheet;
  $$('tYes').onclick = function(){
    var name = $$('tName').value.trim(), user = slug($$('tUser').value), pw = $$('tPass').value, role = $$('tRole').value;
    if(!name || user.length < 3){ toast('Enter a name and a login ID (3+ characters)'); return; } if(pw.length < 6){ toast('Password needs at least 6 characters'); return; }
    var btn = $$('tYes'); btn.disabled = true;
    db().collection('login_index').doc(user).get().then(function(ix){
      if(ix.exists) throw new Error('The login ID “' + user + '” is already used.');
      var email = 'u' + rid(10) + '@' + DOMAIN;
      return createAuth(email, pw).then(function(uid){ return commitOps([{ ref: db().collection('dist_logins').doc(uid), merge: false, data: { distributorId: d.id, roleId: role, name: name, username: user, isActive: true, createdAt: Date.now() } }, { ref: db().collection('login_index').doc(user), merge: false, data: { email: email, uid: uid, kind: 'distributor', distributorId: d.id } }]); });
    }).then(function(){ API.logAudit('Distributor team member created', user + ' → ' + d.name); var w2 = $$('dvOv'); if(w2) w2.remove(); render(); showCreds('Team member created ✔', d, user, pw); }).catch(function(e){ btn.disabled = false; toast(authMsg(e)); });
  };
}

/* ================================================================== workspace: settings */
function wsSettings(d){
  var h = '<div class="dw-card"><div class="dw-h">⚙ Distributor settings</div>' +
    '<label class="dw-lab">Business name</label><input class="dw-in" id="sName" value="' + esc(d.name) + '"><div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-grow"><label class="dw-lab">Phone</label><input class="dw-in" id="sPhone" value="' + esc(d.phone || '') + '"></div><div class="dw-grow"><label class="dw-lab">City</label><input class="dw-in" id="sCity" value="' + esc(d.city || '') + '"></div></div>' +
    '<label class="dw-lab">Notice shown on his page</label><textarea class="dw-in" id="sNote" rows="2">' + esc(d.notice || '') + '</textarea>' +
    '<label class="dw-lab">“Low stock” when quantity is at or below</label><input class="dw-in" id="sLow" type="number" min="1" value="' + lowOf(d) + '" style="max-width:140px">' +
    '<label class="dw-lab">What can he see about stock?</label>' + stockViewPicker(d.stockView === 'all' ? 'all' : sees(d) ? 'company' : 'own') +
    '<label class="dw-opt"><input type="checkbox" id="sUp"' + (d.canUpload ? ' checked' : '') + '> <b>Can add his own products</b><div class="dw-sub">He sends “add product” requests; you approve and choose category / visibility.</div></label>' +
    '<label class="dw-opt"><input type="checkbox" id="sPrice"' + (d.defaultShowPrice ? ' checked' : '') + '> <b>Show MRP on newly added items by default</b></label>' +
    '<label class="dw-opt"><input type="checkbox" id="sAct"' + (d.isActive !== false ? ' checked' : '') + '> <b>Active</b><div class="dw-sub">Switch off to block his login without deleting anything. His stock is then left out of the catalogue availability.</div></label>' +
    '<div class="dw-flex" style="justify-content:flex-end;margin-top:8px"><button type="button" class="dw-btn" id="sSave">Save settings</button></div></div>' +
    '<div class="dw-card" style="border-color:#f3c9c9"><div class="dw-h" style="color:#b23b3b">Danger zone</div><div class="dw-sub" style="margin-bottom:8px">Deleting removes the distributor and his logins completely. You can create the same name / login ID again afterwards.</div><button type="button" class="dw-btn red" id="sDel">Delete this distributor…</button></div>';
  setBody(h);
  bindPicker($$('dvBody'));
  $$('sSave').onclick = function(){
    var name = $$('sName').value.trim(); if(!name){ toast('Enter the business name'); return; }
    var sv = pickedView($$('dvBody'));
    db().collection('distributors').doc(d.id).set({ name: name, phone: $$('sPhone').value.trim(), city: $$('sCity').value.trim(), notice: $$('sNote').value.trim(), lowStockAt: Math.max(1, Math.floor(Number($$('sLow').value) || 5)), stockView: sv, canUpload: $$('sUp').checked, defaultShowPrice: $$('sPrice').checked, isActive: $$('sAct').checked }, { merge: true })
      .then(function(){ API.logAudit('Distributor updated', name); toast('Saved'); queueSync(800); }).catch(fail);
  };
  $$('sDel').onclick = function(){ openDelete(d); };
}

/* ================================================================== workspace: choose products (category › sub-category › card › item) */
function ptInit(d){
  var list = products().filter(function(p){ return p.id !== undefined && p.id !== null; }).map(function(p){ return { p: p, x: snapOf(p) }; });
  var cats = {};
  list.forEach(function(r){
    var cid = r.x.catId || '', c = cats[cid] = cats[cid] || { key: 'c:' + cid, id: cid, name: r.x.catName || 'Uncategorised', regular: [], subs: {}, all: [] };
    c.all.push(r);
    if(r.x.gid){
      var sid = r.x.subId || '', sub = c.subs[sid] = c.subs[sid] || { key: 's:' + cid + ':' + sid, id: sid, name: r.x.subName || 'No sub-category', cards: {}, all: [] }; sub.all.push(r);
      var card = sub.cards[r.x.gid] = sub.cards[r.x.gid] || { key: 'g:' + r.x.gid, id: r.x.gid, title: r.x.gtitle, items: [] }; card.items.push(r);
    } else c.regular.push(r);
  });
  var arr = Object.keys(cats).map(function(k){ return cats[k]; }).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
  var cmp = function(a, b){ return String(a.x.gid ? a.x.size : a.x.name).localeCompare(String(b.x.gid ? b.x.size : b.x.name), undefined, { numeric: true }); };
  arr.forEach(function(c){ c.regular.sort(cmp); Object.keys(c.subs).forEach(function(k){ Object.keys(c.subs[k].cards).forEach(function(g){ c.subs[k].cards[g].items.sort(cmp); }); }); });
  var cur = {};
  list.forEach(function(r){ var s = S.stock.get(d.id + '__' + r.p.id), show = !!(s && s.visible), price = !!(s && s.showPrice); cur[r.p.id] = { show: show, price: price, o: { show: show, price: price }, had: !!s, old: s ? (Number(s.qty) || 0) : 0, qty: s ? String(Number(s.qty) || 0) : '' }; });
  S.pt = { distId: d.id, cats: arr, cur: cur, list: list, autoCats: (d.autoCats || []).slice(), autoSubs: (d.autoSubs || []).slice(), a0: JSON.stringify([(d.autoCats || []).slice().sort(), (d.autoSubs || []).slice().sort()]), q: '', open: {}, nodeRows: {} };
}
function ptChanges(){
  var P = S.pt, n = 0;
  Object.keys(P.cur).forEach(function(k){ var c = P.cur[k]; if(c.show !== c.o.show || (c.show && c.price !== c.o.price) || (c.show && String(c.qty).trim() !== '' && (Math.floor(Number(c.qty)) || 0) !== c.old)) n++; });
  if(JSON.stringify([P.autoCats.slice().sort(), P.autoSubs.slice().sort()]) !== P.a0) n++;
  return n;
}
function ptInfo(){ var P = S.pt, shown = 0; Object.keys(P.cur).forEach(function(k){ if(P.cur[k].show) shown++; }); var ch = ptChanges(), el = $$('ptInfo'); if(el) el.innerHTML = '<b>' + shown + '</b> item(s) visible · ' + (ch ? '<b style="color:#8a5a00">' + ch + ' unsaved change' + (ch > 1 ? 's' : '') + '</b>' : 'no changes'); var sv = $$('ptSave'); if(sv) sv.disabled = !ch || RO(); var di = $$('ptDisc'); if(di) di.disabled = !ch; }
function ptSetShow(d, id, on){ var c = S.pt.cur[id]; c.show = on; if(on && !c.had && !c.o.show && d.defaultShowPrice) c.price = true; if(!on) c.price = false; }
function ptMatched(){ var q = S.pt.q.toLowerCase().trim(); return S.pt.list.filter(function(r){ return !q || (r.x.name + ' ' + r.x.size + ' ' + r.p.part).toLowerCase().indexOf(q) >= 0; }); }
function ptPaint(d){
  var P = S.pt, q = P.q.toLowerCase().trim(), html = '';
  var match = function(r){ return !q || (r.x.name + ' ' + r.x.size + ' ' + r.p.part).toLowerCase().indexOf(q) >= 0; };
  var open = function(k){ return !!q || !!P.open[k]; };
  var node = function(cls, key, label, rows, extra){
    P.nodeRows[key] = rows; var n = 0; rows.forEach(function(r){ if(P.cur[r.p.id].show) n++; });
    var t = n === 0 ? 0 : (n === rows.length ? 2 : 1);
    return '<div class="dw-tr ' + cls + '"><span data-tg="' + esc(key) + '" style="cursor:pointer;width:16px">' + (open(key) ? '▾' : '▸') + '</span><input type="checkbox" class="dw-chk" data-n="' + esc(key) + '" data-t="' + t + '"' + (t === 2 ? ' checked' : '') + '><div class="dw-grow" data-tg="' + esc(key) + '" style="cursor:pointer">' + label + ' <span class="dw-sub">· ' + n + '/' + rows.length + '</span></div>' + (extra || '') + '</div>';
  };
  var auto = function(attr, id, list, tip){ return '<label class="dw-sub" title="' + tip + '" style="white-space:nowrap;font-weight:400"><input type="checkbox" ' + attr + '="' + esc(id) + '"' + (list.indexOf(id) >= 0 ? ' checked' : '') + '> ⚡ auto-add new</label>'; };
  var item = function(r){
    var c = P.cur[r.p.id], own = companyOf(r.p);
    return '<div class="dw-tr item"><input type="checkbox" class="dw-chk" data-s="' + r.p.id + '"' + (c.show ? ' checked' : '') + '><div class="dw-grow"><b style="font-weight:600">' + esc(r.x.gid ? (r.x.size || r.x.name) : r.x.name) + '</b>' + (!r.x.gid && r.x.size ? ' <span class="dw-sub">— ' + esc(r.x.size) + '</span>' : '') + '<div class="dw-sub">' + esc(r.p.part) + (Number(r.p.mrp) ? ' · MRP ' + esc(r.p.mrp) : '') + ' · company stock ' + (own === null ? '∞' : own) + (r.p.active === false && !r.p.isCatalogVariant ? ' · <b>inactive</b>' : '') + '</div></div>' +
      (c.show ? '<label class="dw-sub" style="white-space:nowrap"><input type="checkbox" data-p="' + r.p.id + '"' + (c.price ? ' checked' : '') + '> MRP</label><input class="dw-q" type="number" min="0" data-q="' + r.p.id + '" value="' + esc(c.qty) + '" placeholder="qty" title="His current stock (optional opening quantity)">' : '') + '</div>';
  };
  P.nodeRows = {};
  P.cats.forEach(function(c){
    var rows = c.all.filter(match); if(!rows.length) return;
    html += node('cat', c.key, '🗂 ' + esc(c.name), rows, auto('data-auc', c.id, P.autoCats, 'Items you add later to this category appear on his page automatically'));
    if(!open(c.key)) return;
    var reg = c.regular.filter(match);
    if(reg.length){ var rk = 'r:' + c.id; html += node('sub', rk, 'Regular products', reg, ''); if(open(rk)) html += reg.map(item).join(''); }
    Object.keys(c.subs).map(function(k){ return c.subs[k]; }).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); }).forEach(function(sub){
      var srows = sub.all.filter(match); if(!srows.length) return;
      html += node('sub', sub.key, '📁 ' + esc(sub.name), srows, sub.id ? auto('data-aus', sub.id, P.autoSubs, 'Items added later to this sub-category appear automatically') : '');
      if(!open(sub.key)) return;
      Object.keys(sub.cards).map(function(g){ return sub.cards[g]; }).sort(function(a, b){ return String(a.title).localeCompare(String(b.title)); }).forEach(function(card){
        var it = card.items.filter(match); if(!it.length) return;
        html += node('card', card.key, '📇 ' + esc(card.title), it, ''); if(open(card.key)) html += it.map(item).join('');
      });
    });
  });
  var box = $$('ptTree'); if(!box) return;
  box.innerHTML = html || '<div class="dw-empty">No items match.</div>';
  box.querySelectorAll('[data-t="1"]').forEach(function(el){ el.indeterminate = true; });
  ptInfo();
}
function wsProducts(d){
  if(!S.pt || S.pt.distId !== d.id) ptInit(d);
  var P = S.pt;
  setBody('<div class="dw-card"><div class="dw-h">Which products can ' + esc(d.name) + ' see?</div><div class="dw-sub">Tick a <b>whole category</b>, a <b>sub-category</b>, a <b>card</b> or single <b>items</b>. Only ticked items appear on his page, and he sees <b>' + (seesAll(d) ? 'his own + company + other distributors\' stock' : sees(d) ? 'his own + company stock' : 'only his own stock') + '</b> for them (change in Settings). ⚡ <b>auto-add</b> keeps new items of a category appearing automatically; an item you untick stays hidden.</div></div>' +
    '<div class="dw-flex" style="margin-bottom:8px"><input class="dw-in" id="ptQ" placeholder="Search name / spec / part…" value="' + esc(P.q) + '" style="flex:1;min-width:170px" data-ok="1"><button type="button" class="dw-btn ghost sm" id="ptOpen" data-ok="1">Expand all</button><button type="button" class="dw-btn ghost sm" id="ptClose" data-ok="1">Collapse</button></div>' +
    '<div class="dw-flex" style="margin-bottom:8px"><button type="button" class="dw-btn ghost sm" id="ptShow">Show all listed</button><button type="button" class="dw-btn ghost sm" id="ptHide">Hide all listed</button><button type="button" class="dw-btn ghost sm" id="ptPon">MRP on (shown)</button><button type="button" class="dw-btn ghost sm" id="ptPoff">MRP off</button></div>' +
    '<div class="dw-card" style="padding:0;overflow:hidden"><div id="ptTree"></div></div><div style="height:70px"></div><div class="dw-sticky"><div id="ptInfo" class="dw-sub"></div><div class="dw-flex"><button type="button" class="dw-btn ghost" id="ptDisc">Discard</button><button type="button" class="dw-btn" id="ptSave">Save changes</button></div></div>');
  ptPaint(d);
  var body = $$('dvBody');
  $$('ptQ').oninput = function(e){ P.q = e.target.value; ptPaint(d); };
  var expand = function(on){ P.cats.forEach(function(c){ P.open[c.key] = on; P.open['r:' + c.id] = on; Object.keys(c.subs).forEach(function(k){ P.open[c.subs[k].key] = on; Object.keys(c.subs[k].cards).forEach(function(g){ P.open[c.subs[k].cards[g].key] = on; }); }); }); ptPaint(d); };
  $$('ptOpen').onclick = function(){ expand(true); }; $$('ptClose').onclick = function(){ expand(false); };
  $$('ptShow').onclick = function(){ ptMatched().forEach(function(r){ ptSetShow(d, r.p.id, true); }); ptPaint(d); };
  $$('ptHide').onclick = function(){ ptMatched().forEach(function(r){ ptSetShow(d, r.p.id, false); }); ptPaint(d); };
  $$('ptPon').onclick = function(){ ptMatched().forEach(function(r){ if(P.cur[r.p.id].show) P.cur[r.p.id].price = true; }); ptPaint(d); };
  $$('ptPoff').onclick = function(){ ptMatched().forEach(function(r){ P.cur[r.p.id].price = false; }); ptPaint(d); };
  $$('ptDisc').onclick = function(){ S.pt = null; render(); };
  $$('ptSave').onclick = function(){ ptSave(d); };
  var tree = $$('ptTree');
  tree.onclick = function(e){ var k = e.target.getAttribute && e.target.getAttribute('data-tg'); if(k){ P.open[k] = !P.open[k]; ptPaint(d); } };
  tree.onchange = function(e){
    var t = e.target, g = function(a){ return t.getAttribute(a); }, v;
    if((v = g('data-n')) !== null){ (P.nodeRows[v] || []).forEach(function(r){ ptSetShow(d, r.p.id, t.checked); }); ptPaint(d); }
    else if((v = g('data-s')) !== null){ ptSetShow(d, v, t.checked); ptPaint(d); }
    else if((v = g('data-p')) !== null){ P.cur[v].price = t.checked; ptInfo(); }
    else if((v = g('data-auc')) !== null){ var i = P.autoCats.indexOf(v); if(t.checked && i < 0) P.autoCats.push(v); if(!t.checked && i >= 0) P.autoCats.splice(i, 1); ptInfo(); }
    else if((v = g('data-aus')) !== null){ var j = P.autoSubs.indexOf(v); if(t.checked && j < 0) P.autoSubs.push(v); if(!t.checked && j >= 0) P.autoSubs.splice(j, 1); ptInfo(); }
  };
  tree.oninput = function(e){ var q = e.target.getAttribute && e.target.getAttribute('data-q'); if(q !== null){ P.cur[q].qty = e.target.value; ptInfo(); } };
}
function ptSave(d){
  var P = S.pt, ops = [], n = 0, now = Date.now();
  P.list.forEach(function(r){
    var p = r.p, c = P.cur[p.id], id = d.id + '__' + p.id, old = S.stock.get(id);
    if(!c.show && !old) return;
    var wantQty = (c.show && String(c.qty).trim() !== '') ? Math.max(0, Math.floor(Number(c.qty) || 0)) : null;
    var qtyChanged = wantQty !== null && (!old || (Number(old.qty) || 0) !== wantQty), showPrice = c.show && c.price;
    if(old && !!old.visible === c.show && !!old.showPrice === showPrice && !qtyChanged) return;
    var row = newRow(d, p); row.visible = c.show; row.showPrice = showPrice;
    if(!old){ row.qty = wantQty === null ? 0 : wantQty; row.updatedAt = wantQty === null ? 0 : now; row.updatedBy = 'admin'; }
    else if(qtyChanged){ row.qty = wantQty; row.updatedAt = now; row.updatedBy = 'admin'; }
    if(showPrice){ row.mrp = Number(p.mrp) || 0; row.gstPct = Number(p.gstPct) || 0; } else { row.mrp = FV().delete(); row.gstPct = FV().delete(); }
    if(!sees(d)) row.companyStock = FV().delete();
    ops.push({ ref: db().collection('distributor_stock').doc(id), data: row });
    if(qtyChanged) ops.push({ ref: db().collection('distributor_log').doc(), merge: false, data: { distributorId: d.id, productId: p.id, name: r.x.name + (r.x.size ? ' — ' + r.x.size : ''), part: r.x.part, from: old ? (Number(old.qty) || 0) : 0, to: wantQty, ts: now, by: 'admin', type: 'adjust', ref: 'opening' } });
    n++;
  });
  var a1 = JSON.stringify([P.autoCats.slice().sort(), P.autoSubs.slice().sort()]);
  if(a1 !== P.a0){ ops.push({ ref: db().collection('distributors').doc(d.id), data: { autoCats: P.autoCats.slice(), autoSubs: P.autoSubs.slice() } }); n++; }
  var btn = $$('ptSave'); btn.disabled = true; btn.textContent = 'Saving…';
  (ops.length ? commitOps(ops) : Promise.resolve()).then(function(){ if(n) API.logAudit('Distributor products updated', d.name + ': ' + n + ' change(s)'); toast(n ? 'Saved — ' + n + ' change' + (n > 1 ? 's' : '') : 'No changes'); S.pt = null; render(); queueSync(1200); })
    .catch(function(e){ btn.disabled = false; btn.textContent = 'Save changes'; fail(e); });
}

/* ================================================================== requests: distributor wants a new item */
function viewRequests(){
  var all = Array.from(S.reqs.values()).sort(function(a, b){ return (b.createdAt || 0) - (a.createdAt || 0); });
  if(!all.length){ setBody('<div class="dw-card dw-empty"><div style="font-size:30px">📥</div><b>No product requests</b><div class="dw-sub">When a distributor with “can add products” sends an item, it appears here for you to approve.</div></div>'); return; }
  setBody(all.map(function(r){
    var d = S.dists.get(r.distributorId), match = findByPart(r.part), pend = r.status === 'pending';
    return '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><b>' + esc(r.name) + '</b><span class="dw-chip ' + (pend ? 'warn' : r.status === 'approved' ? 'ok' : 'bad') + '">' + esc(r.status) + '</span></div>' +
      '<div class="dw-sub">Part <b>' + esc(r.part) + '</b>' + (r.size ? ' · ' + esc(r.size) : '') + ' · from <b>' + esc(d ? d.name : '(deleted)') + '</b> · his stock ' + esc(r.qty) + (Number(r.mrp) ? ' · MRP ' + esc(r.mrp) : '') + ' · ' + ago(r.createdAt) + '</div>' +
      (r.note ? '<div class="dw-sub">Note: ' + esc(r.note) + '</div>' : '') + (r.adminNote ? '<div class="dw-sub">You wrote: ' + esc(r.adminNote) + '</div>' : '') +
      (pend ? '<div class="dw-sub" style="margin:6px 0">' + (match ? '✔ This part already exists as <b>' + esc(match.name) + '</b> — it will be linked, no duplicate.' : '🆕 New item — you choose its category and whether dealers see it.') + '</div><div class="dw-flex"><button type="button" class="dw-btn sm" data-ok2="' + esc(r.id) + '">Approve…</button><button type="button" class="dw-btn ghost sm" data-no="' + esc(r.id) + '">Reject</button></div>' : '') + '</div>'; }).join(''));
  main().querySelectorAll('[data-ok2]').forEach(function(b){ b.onclick = function(){ openApprove(S.reqs.get(b.getAttribute('data-ok2'))); }; });
  main().querySelectorAll('[data-no]').forEach(function(b){ b.onclick = function(){ var r = S.reqs.get(b.getAttribute('data-no')), why = prompt('Reason (shown to the distributor, optional):', ''); if(why === null) return; db().collection('distributor_requests').doc(r.id).set({ status: 'rejected', adminNote: why }, { merge: true }).then(function(){ API.logAudit('Product request rejected', r.name); }).catch(fail); }; });
}
function openApprove(r){
  if(!r || r.status !== 'pending') return;
  var d = S.dists.get(r.distributorId); if(!d){ toast('Distributor no longer exists'); return; }
  var match = findByPart(r.part);
  if(match){ if(confirm('“' + r.part + '” already exists as ' + match.name + '. Link it to ' + d.name + ' with his stock ' + r.qty + '?')) doApprove(r, d, match, false); return; }
  var cats = API.getCategories ? API.getCategories() : [];
  var w = sheet('<h3 class="dw-h">Add “' + esc(r.name) + '” to the catalogue</h3><div class="dw-sub">Requested by <b>' + esc(d.name) + '</b>. Fill in how it should appear.</div>' +
    '<label class="dw-lab">Name</label><input class="dw-in" id="apName" value="' + esc(r.name) + '"><div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-grow"><label class="dw-lab">Size / spec</label><input class="dw-in" id="apSize" value="' + esc(r.size || '') + '"></div><div class="dw-grow"><label class="dw-lab">Part / item code</label><input class="dw-in" value="' + esc(r.part) + '" disabled></div></div>' +
    '<div class="dw-flex" style="flex-wrap:nowrap"><div class="dw-grow"><label class="dw-lab">MRP ₹</label><input class="dw-in" id="apMrp" type="number" min="0" value="' + (Number(r.mrp) || 0) + '"></div><div class="dw-grow"><label class="dw-lab">GST %</label><input class="dw-in" id="apGst" type="number" min="0" value="18"></div></div>' +
    '<label class="dw-lab">Category</label><select class="dw-sel" id="apCat">' + (cats.length ? cats.map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('') : '<option value="column">Column</option>') + '</select>' +
    '<label class="dw-opt"><input type="checkbox" id="apDealers"> <b>Also show to dealers in the main catalogue</b><div class="dw-sub">Off = a private item that only this distributor sees. Dealers will see availability = company stock (0) + distributors\' stock once on.</div></label>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="apNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="apYes">Approve & add</button></div>');
  $$('apNo').onclick = closeSheet;
  $$('apYes').onclick = function(){
    var name = $$('apName').value.trim(); if(!name){ toast('Enter a name'); return; }
    var list = products(), p = { id: API.nextProductId(), cat: $$('apCat').value, name: name, size: $$('apSize').value.trim(), part: r.part, mrp: Number($$('apMrp').value) || 0, discountPct: 0, gstPct: Number($$('apGst').value) || 0, active: $$('apDealers').checked, stock: 0 };
    list.push(p); API.saveProducts(list);
    doApprove(r, d, p, true);
  };
}
function doApprove(r, d, p, created){
  var sn = snapOf(p), id = d.id + '__' + p.id, old = S.stock.get(id), row = newRow(d, p);
  row.qty = Number(r.qty) || 0; row.updatedAt = Date.now(); row.updatedBy = d.id;
  if(old){ row.showPrice = !!old.showPrice; if(!row.showPrice){ row.mrp = FV().delete(); row.gstPct = FV().delete(); } }
  commitOps([{ ref: db().collection('distributor_stock').doc(id), data: row }, { ref: db().collection('distributor_requests').doc(r.id), data: { status: 'approved', productId: p.id, adminNote: created ? 'Added to the catalogue' : 'Linked to existing product' } }])
    .then(function(){ API.logAudit('Product request approved', r.name + ' → ' + d.name + (created ? ' (new product)' : ' (existing)')); toast(created ? 'Approved — item added' : 'Approved — linked'); var w = $$('dvOv'); if(w) w.remove(); render(); queueSync(1500); }).catch(fail);
}

/* ================================================================== stock: report + who added how much */
function viewStock(){
  var tabs = '<div class="dw-bar"><button type="button" class="dw-nav' + (S.stView === 'report' ? ' on' : '') + '" data-sv="report" data-ok="1">Stock by product</button><button type="button" class="dw-nav' + (S.stView === 'added' ? ' on' : '') + '" data-sv="added" data-ok="1">Who added how much</button></div><div id="stBody"></div>';
  setBody(tabs);
  main().querySelectorAll('[data-sv]').forEach(function(b){ b.onclick = function(){ S.stView = b.getAttribute('data-sv'); viewStock(); }; });
  (S.stView === 'added' ? stockAdded : stockReport)();
}
function stockReport(){
  var R = (S.rp = S.rp || { dist: '', cat: '', q: '', all: false, lim: 100 }), box = $$('stBody');
  var by = {};
  S.stock.forEach(function(s){ var d = S.dists.get(s.distributorId); if(!s.visible || !d || (R.dist && s.distributorId !== R.dist)) return; (by[s.productId] = by[s.productId] || []).push(s); });
  var ids = {}; Object.keys(by).forEach(function(k){ ids[k] = 1; });
  if(R.all) products().forEach(function(p){ if(p.id !== undefined && p.id !== null) ids[p.id] = 1; });
  var q = R.q.toLowerCase().trim();
  var rows = Object.keys(ids).map(function(pid){
    var p = productById(pid), x = p ? snapOf(p) : { name: (by[pid][0] || {}).name, size: (by[pid][0] || {}).size, part: (by[pid][0] || {}).part, catId: '', catName: '' };
    var rs = by[pid] || [], dist = rs.reduce(function(a, s){ return a + (Number(s.qty) || 0); }, 0);
    return { pid: pid, x: x, own: p ? companyOf(p) : null, gone: !p, dist: dist, rs: rs };
  }).filter(function(r){ return (!R.cat || r.x.catId === R.cat) && (!q || (r.x.name + ' ' + r.x.size + ' ' + r.x.part).toLowerCase().indexOf(q) >= 0); })
    .sort(function(a, b){ return String(a.x.name).localeCompare(String(b.x.name)) || String(a.x.size).localeCompare(String(b.x.size), undefined, { numeric: true }); });
  var cats = (API.getCategories ? API.getCategories() : []);
  var h = '<div class="dw-flex" style="margin-bottom:8px"><select class="dw-sel" id="rpDist" data-ok="1" style="width:auto"><option value="">All distributors</option>' + Array.from(S.dists.values()).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); }).map(function(d){ return '<option value="' + esc(d.id) + '"' + (R.dist === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select>' +
    '<select class="dw-sel" id="rpCat" data-ok="1" style="width:auto"><option value="">All categories</option>' + cats.map(function(c){ return '<option value="' + esc(c.id) + '"' + (R.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
    '<input class="dw-in" id="rpQ" placeholder="Search…" value="' + esc(R.q) + '" style="flex:1;min-width:140px" data-ok="1"><button type="button" class="dw-btn ghost sm" id="rpCsv" data-ok="1">⬇ CSV</button></div>' +
    '<label class="dw-sub" style="display:block;margin-bottom:8px"><input type="checkbox" id="rpAll"' + (R.all ? ' checked' : '') + '> Also list products no distributor has</label>' +
    '<div class="dw-sub" style="margin-bottom:8px"><b>Company</b> = your own Stock figure (∞ = unlimited). <b>Available to dealers</b> = company + all distributors (unlimited stays unlimited). Only items currently shown to a distributor are counted.</div>';
  h += !rows.length ? '<div class="dw-card dw-empty">Nothing to show.</div>' : '<div class="dw-card">' + rows.slice(0, R.lim).map(function(r){
    return '<div class="dw-row" style="align-items:flex-start"><div class="dw-grow"><b>' + esc(r.x.name) + '</b>' + (r.x.size ? ' <span class="dw-sub">— ' + esc(r.x.size) + '</span>' : '') + '<div class="dw-sub">' + esc(r.x.part) + (r.x.catName ? ' · ' + esc(r.x.catName) : '') + (r.gone ? ' · <b>product deleted</b>' : '') + '</div>' +
      '<div style="margin-top:3px">' + (r.rs.length ? r.rs.map(function(s){ return '<span class="dw-chip info">' + esc(distName(s.distributorId)) + ': ' + (Number(s.qty) || 0) + '</span>'; }).join('') : '<span class="dw-sub">no distributor</span>') + '</div></div>' +
      '<div style="text-align:right;min-width:92px"><div class="dw-sub">Company ' + (r.own === null ? '∞' : r.own) + '</div><div class="dw-sub">Distributors ' + r.dist + '</div><b>' + (r.own === null ? '∞' : (r.own + r.dist)) + '</b></div></div>'; }).join('') + (rows.length > R.lim ? '<div style="text-align:center;padding:10px"><button type="button" class="dw-btn ghost sm" id="rpMore" data-ok="1">Show more (' + (rows.length - R.lim) + ' left)</button></div>' : '') + '</div>';
  box.innerHTML = h;
  var rf = function(){ stockReport(); };
  $$('rpDist').onchange = function(e){ R.dist = e.target.value; R.lim = 100; rf(); }; $$('rpCat').onchange = function(e){ R.cat = e.target.value; R.lim = 100; rf(); };
  $$('rpQ').oninput = function(e){ R.q = e.target.value; R.lim = 100; var p = e.target.selectionStart; rf(); var b = $$('rpQ'); b.focus(); try{ b.setSelectionRange(p, p); }catch(x){} };
  $$('rpAll').onchange = function(e){ R.all = e.target.checked; rf(); }; if($$('rpMore')) $$('rpMore').onclick = function(){ R.lim += 200; rf(); };
  $$('rpCsv').onclick = function(){ var out = [['Product', 'Spec', 'Part', 'Category', 'Company stock', 'Distributor', 'Qty', 'Available (total)']]; rows.forEach(function(r){ var tot = r.own === null ? 'unlimited' : r.own + r.dist, own = r.own === null ? 'unlimited' : r.own; if(!r.rs.length) out.push([r.x.name, r.x.size, r.x.part, r.x.catName, own, '', '', tot]); r.rs.forEach(function(s){ out.push([r.x.name, r.x.size, r.x.part, r.x.catName, own, distName(s.distributorId), Number(s.qty) || 0, tot]); }); }); download('stock-report.csv', out); };
}
function stockAdded(){
  var A = S.ad, box = $$('stBody');
  if(A.rows === null || A.key !== A.period){
    box.innerHTML = '<div class="dw-card dw-empty">Loading…</div>';
    var since = periodStart(A.period), q = db().collection('distributor_log'); if(since) q = q.where('ts', '>=', since);
    q.orderBy('ts', 'desc').limit(3000).get().then(function(s){ A.rows = s.docs.map(function(x){ return x.data(); }); A.key = A.period; if(tabActive() && S.tab === 'stock' && S.stView === 'added' && $$('stBody')) stockAdded(); }, function(e){ showFail(e, 'distributor_log'); });
    return;
  }
  var rows = A.rows.filter(function(l){ return (A.adminToo || l.by !== 'admin') && (!A.dist || l.distributorId === A.dist); });
  var by = {}, tot = { add: 0, red: 0, n: 0 };
  rows.forEach(function(l){
    var dl = (Number(l.to) || 0) - (Number(l.from) || 0); if(A.onlyAdd && dl <= 0) return;
    var g = by[l.distributorId] = by[l.distributorId] || { id: l.distributorId, n: 0, add: 0, red: 0, last: 0, prods: {} }; g.n++; tot.n++; g.last = Math.max(g.last, l.ts || 0);
    if(dl > 0){ g.add += dl; tot.add += dl; } else { g.red += -dl; tot.red += -dl; }
    var pk = String(l.part || l.name), pr = g.prods[pk] = g.prods[pk] || { name: l.name, part: l.part, add: 0, red: 0 }; if(dl > 0) pr.add += dl; else pr.red += -dl;
  });
  var list = Object.keys(by).map(function(k){ return by[k]; }).sort(function(a, b){ return b.add - a.add; });
  if(!A.onlyAdd && !A.dist) S.dists.forEach(function(d){ if(!by[d.id]) list.push({ id: d.id, n: 0, add: 0, red: 0, last: 0, prods: {} }); });
  var sel = function(id, opts, v){ return '<select class="dw-sel" id="' + id + '" data-ok="1" style="width:auto">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var h = '<div class="dw-flex" style="margin-bottom:8px">' + sel('adDist', [['', 'All distributors']].concat(Array.from(S.dists.values()).map(function(d){ return [d.id, esc(d.name)]; })), A.dist || '') + sel('adPer', [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']], A.period) + '<button type="button" class="dw-btn ghost sm" id="adCsv" data-ok="1">⬇ CSV</button></div>' +
    '<div class="dw-flex" style="margin-bottom:8px;font-size:12.5px"><label><input type="checkbox" id="adOnly"' + (A.onlyAdd ? ' checked' : '') + '> Only increases</label><label><input type="checkbox" id="adAdm"' + (A.adminToo ? ' checked' : '') + '> Include admin edits</label></div>' +
    '<div class="dw-kpis">' + kpi('+' + tot.add, 'Units added', '#1e7b46') + kpi('−' + tot.red, 'Units reduced (sales / corrections)', '#b23b3b') + kpi(tot.n, 'Updates') + '</div>';
  h += list.map(function(g){
    var prods = Object.keys(g.prods).map(function(k){ return g.prods[k]; }).sort(function(a, b){ return b.add - a.add; }).slice(0, 6);
    return '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><b>' + esc(distName(g.id)) + '</b><span class="dw-sub">' + (g.last ? 'last ' + ago(g.last) : '<b style="color:#b23b3b">no update</b>') + '</span></div><div class="dw-sub">' + g.n + ' updates · <b style="color:#1e7b46">+' + g.add + '</b> added · <b style="color:#b23b3b">−' + g.red + '</b> reduced · net <b>' + (g.add - g.red) + '</b></div>' +
      (prods.length ? '<div style="margin-top:6px">' + prods.map(function(p){ return '<div class="dw-row" style="padding:5px 0"><div class="dw-grow">' + esc(p.name) + ' <span class="dw-sub">' + esc(p.part) + '</span></div><span style="color:#1e7b46">+' + p.add + '</span><span style="color:#b23b3b;margin-left:8px">−' + p.red + '</span></div>'; }).join('') + '</div>' : '') + '</div>'; }).join('') || '<div class="dw-card dw-empty">No updates in this period.</div>';
  box.innerHTML = h;
  $$('adDist').onchange = function(e){ A.dist = e.target.value; stockAdded(); }; $$('adPer').onchange = function(e){ A.period = e.target.value; A.rows = null; stockAdded(); };
  $$('adOnly').onchange = function(e){ A.onlyAdd = e.target.checked; stockAdded(); }; $$('adAdm').onchange = function(e){ A.adminToo = e.target.checked; stockAdded(); };
  $$('adCsv').onclick = function(){ var out = [['Distributor', 'Product', 'Part', 'Added', 'Reduced']]; Object.keys(by).forEach(function(k){ var g = by[k]; Object.keys(g.prods).forEach(function(pk){ var p = g.prods[pk]; out.push([distName(g.id), p.name, p.part, p.add, p.red]); }); }); download('stock-added.csv', out); };
}

/* ================================================================== activity log */
function viewLog(distId){
  setBody('<div class="dw-card dw-empty">Loading…</div>');
  var q = db().collection('distributor_log'); if(distId) q = q.where('distributorId', '==', distId);
  q.orderBy('ts', 'desc').limit(250).get().then(function(s){
    if(!$$('dvBody')) return;
    setBody('<div class="dw-flex" style="margin-bottom:8px"><button type="button" class="dw-btn ghost sm" id="lgRef" data-ok="1">↻ Refresh</button></div>' + (s.empty ? '<div class="dw-card dw-empty">No stock updates yet.</div>' : '<div class="dw-card">' + s.docs.map(function(x){ var l = x.data(); return '<div style="border-top:1px solid #f0ead8">' + (distId ? '' : '<div class="dw-sub" style="padding-top:6px"><b>' + esc(distName(l.distributorId)) + '</b></div>') + logLine(l) + '</div>'; }).join('') + '</div>'));
    $$('lgRef').onclick = function(){ viewLog(distId); };
  }, function(e){ showFail(e, 'distributor_log'); });
}

/* ================================================================== access: staff logins + distributor roles (owner) */
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
function viewAccess(){
  if(S.staff === null){
    setBody('<div class="dw-card dw-empty">Loading…</div>');
    db().collection('admins').get().then(function(s){ S.staff = s.docs.map(function(x){ var o = x.data(); o.uid = x.id; return o; }); if(tabActive() && S.tab === 'access') viewAccess(); }, function(e){ showFail(e, 'admins'); });
    return;
  }
  var roles = Array.from(S.roles.values()).sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); });
  var h = '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><div class="dw-h" style="margin:0">Staff logins (admin console)</div><button type="button" class="dw-btn sm" id="stAdd">＋ Add staff</button></div>' +
    '<div class="dw-sub" style="margin:4px 0 8px"><b>Manager</b>: everything except this page. <b>Viewer</b>: look only — nothing is saved. The original admin is the <b>Owner</b>.</div>' +
    S.staff.map(function(u){ var own = !u.role || u.role === 'owner' || (u.role !== 'manager' && u.role !== 'viewer');
      return '<div class="dw-row"><div class="dw-grow"><b>' + esc(u.name || u.username || '') + '</b><div class="dw-sub">' + esc(u.username || '') + '</div></div>' + (own ? '<span class="dw-chip ok">Owner</span>' : '<select class="dw-sel" data-strole="' + esc(u.uid) + '" style="width:auto"><option value="manager"' + (u.role === 'manager' ? ' selected' : '') + '>Manager</option><option value="viewer"' + (u.role === 'viewer' ? ' selected' : '') + '>Viewer</option></select><button type="button" class="dw-btn ghost sm" data-stpw="' + esc(u.uid) + '">Password</button><button type="button" class="dw-btn ghost sm" data-stdel="' + esc(u.uid) + '">Remove</button>') + '</div>'; }).join('') + '</div>' +
    '<div class="dw-card"><div class="dw-flex" style="justify-content:space-between"><div class="dw-h" style="margin:0">Distributor roles</div><div class="dw-flex"><button type="button" class="dw-btn sm" id="rlAdd">＋ New role</button>' + (roles.length ? '' : '<button type="button" class="dw-btn ghost sm" id="rlDef">Add default roles</button>') + '</div></div>' +
    '<div class="dw-sub" style="margin:4px 0 8px">A role decides what a distributor\'s team member can do. The distributor\'s own login always has full access. Assign roles in a distributor\'s <b>Login & team</b> tab.</div>' +
    (roles.length ? roles.map(function(r){ var used = Array.from(S.logins.values()).filter(function(t){ return t.roleId === r.id; }).length; return '<div class="dw-row"><div class="dw-grow"><b>' + esc(r.name) + '</b><div class="dw-sub">' + esc(roleSummary(r.perms)) + '</div></div><span class="dw-sub">' + used + ' member(s)</span><button type="button" class="dw-btn ghost sm" data-rled="' + esc(r.id) + '">Edit</button><button type="button" class="dw-btn ghost sm" data-rldel="' + esc(r.id) + '">Delete</button></div>'; }).join('') : '<div class="dw-sub">No roles yet.</div>') + '</div>';
  setBody(h);
  var q = function(sel, fn){ main().querySelectorAll(sel).forEach(fn); };
  $$('stAdd').onclick = openStaffAdd; $$('rlAdd').onclick = function(){ openRoleForm(null); };
  if($$('rlDef')) $$('rlDef').onclick = function(){ commitOps(DEFAULT_ROLES.map(function(r){ return { ref: db().collection('roles').doc('r_' + slug(r.name)), data: { name: r.name, scope: 'distributor', perms: r.perms, updatedAt: Date.now() } }; })).then(function(){ toast('Default roles added'); }).catch(fail); };
  q('[data-strole]', function(el){ el.onchange = function(){ db().collection('admins').doc(el.getAttribute('data-strole')).update({ role: el.value }).then(function(){ S.staff = null; toast('Role updated'); viewAccess(); }).catch(fail); }; });
  q('[data-stdel]', function(el){ el.onclick = function(){ var u = S.staff.filter(function(x){ return x.uid === el.getAttribute('data-stdel'); })[0]; if(!confirm('Remove this staff login?')) return;
    var ops = [{ ref: db().collection('admins').doc(u.uid), del: true }]; if(u.username) ops.push({ ref: db().collection('login_index').doc('staff_' + slug(u.username)), del: true });
    commitOps(ops).then(function(){ API.logAudit('Staff login removed', u.username); S.staff = null; viewAccess(); }).catch(fail); }; });
  q('[data-stpw]', function(el){ el.onclick = function(){ openStaffReset(S.staff.filter(function(x){ return x.uid === el.getAttribute('data-stpw'); })[0]); }; });
  q('[data-rled]', function(el){ el.onclick = function(){ openRoleForm(S.roles.get(el.getAttribute('data-rled'))); }; });
  q('[data-rldel]', function(el){ el.onclick = function(){ var id = el.getAttribute('data-rldel'); if(Array.from(S.logins.values()).some(function(t){ return t.roleId === id; })){ toast('This role is still used by team members'); return; } if(confirm('Delete this role?')) db().collection('roles').doc(id).delete().catch(fail); }; });
}
function openRoleForm(r){
  var w = sheet('<h3 class="dw-h">' + (r ? 'Edit role' : 'New role') + '</h3><label class="dw-lab">Role name</label><input class="dw-in" id="rlName" value="' + esc(r ? r.name : '') + '">' +
    PERMS.map(function(d){ var cur = r && r.perms ? r.perms[d.k] : d.opts[0][0]; return '<label class="dw-lab">' + d.label + '</label><select class="dw-sel" data-pk="' + d.k + '">' + d.opts.map(function(o){ return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }).join('') +
    '<div class="dw-sub" style="margin-top:8px">“See MRP” hides prices on screen for this role (the distributor\'s own login is unaffected).</div><div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="rlNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="rlYes">Save</button></div>');
  $$('rlNo').onclick = closeSheet;
  $$('rlYes').onclick = function(){
    var name = $$('rlName').value.trim(); if(!name){ toast('Enter a role name'); return; }
    var perms = {}; w.querySelectorAll('[data-pk]').forEach(function(s){ perms[s.getAttribute('data-pk')] = s.value; });
    db().collection('roles').doc(r ? r.id : 'r_' + slug(name) + '_' + rid(4)).set({ name: name, scope: 'distributor', perms: perms, updatedAt: Date.now() }, { merge: true }).then(function(){ API.logAudit('Distributor role saved', name); closeSheet(); }).catch(fail);
  };
}
function openStaffAdd(){
  sheet('<h3 class="dw-h">Add staff login</h3><label class="dw-lab">Name</label><input class="dw-in" id="sfName"><label class="dw-lab">Login (username)</label><input class="dw-in" id="sfUser" autocapitalize="none" autocomplete="off"><label class="dw-lab">Password (min 6)</label><div class="dw-flex" style="flex-wrap:nowrap"><input class="dw-in" id="sfPass" value="' + genPass() + '"><button type="button" class="dw-btn ghost sm" id="sfGen" data-ok="1">New</button></div>' +
    '<label class="dw-lab">Role</label><select class="dw-sel" id="sfRole"><option value="manager">Manager — can change everything except Access</option><option value="viewer">Viewer — view only</option></select><div class="dw-sub" style="margin-top:6px">They sign in on the normal admin login with this username.</div>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="sfNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="sfYes">Create</button></div>');
  $$('sfGen').onclick = function(){ $$('sfPass').value = genPass(); }; $$('sfNo').onclick = closeSheet;
  $$('sfYes').onclick = function(){
    var name = $$('sfName').value.trim(), user = slug($$('sfUser').value), pw = $$('sfPass').value, role = $$('sfRole').value;
    if(!name || user.length < 3 || pw.length < 6){ toast('Fill name, a username (3+) and a password (6+)'); return; }
    var btn = $$('sfYes'); btn.disabled = true;
    db().collection('login_index').doc('staff_' + user).get().then(function(ix){
      if(ix.exists) throw new Error('That username is already used.');
      var email = 's' + rid(10) + '@' + staffDomain(), now = new Date().toISOString();
      return createAuth(email, pw).then(function(uid){ return commitOps([{ ref: db().collection('admins').doc(uid), merge: false, data: { username: user, email: email, name: name, role: role, createdAt: now } }, { ref: db().collection('login_index').doc('staff_' + user), merge: false, data: { email: email, uid: uid, kind: 'staff' } }]); });
    }).then(function(){ API.logAudit('Staff login created', user + ' (' + role + ')'); S.staff = null; var w2 = $$('dvOv'); if(w2) w2.remove(); render(); showCreds('Staff login created ✔', { name: name, phone: '' }, user, pw); })
      .catch(function(e){ btn.disabled = false; toast(authMsg(e)); });
  };
}
function openStaffReset(u){
  if(!u) return;
  sheet('<h3 class="dw-h">Reset password — ' + esc(u.name || u.username) + '</h3><div class="dw-sub">The old password stops working immediately; the username stays the same.</div><label class="dw-lab">New password (min 6)</label><div class="dw-flex" style="flex-wrap:nowrap"><input class="dw-in" id="spPass" value="' + genPass() + '"><button type="button" class="dw-btn ghost sm" id="spGen" data-ok="1">New</button></div>' +
    '<div class="dw-flex" style="margin-top:12px;justify-content:flex-end"><button type="button" class="dw-btn ghost" id="spNo" data-ok="1">Cancel</button><button type="button" class="dw-btn" id="spYes">Set new password</button></div>');
  $$('spGen').onclick = function(){ $$('spPass').value = genPass(); }; $$('spNo').onclick = closeSheet;
  $$('spYes').onclick = function(){
    var pw = $$('spPass').value; if(pw.length < 6){ toast('Password needs at least 6 characters'); return; }
    var btn = $$('spYes'); btn.disabled = true; var email = 's' + rid(10) + '@' + staffDomain(), user = slug(u.username);
    createAuth(email, pw).then(function(uid){ return commitOps([{ ref: db().collection('admins').doc(uid), merge: false, data: { username: user, email: email, name: u.name || '', role: u.role, createdAt: u.createdAt || new Date().toISOString() } }, { ref: db().collection('admins').doc(u.uid), del: true }, { ref: db().collection('login_index').doc('staff_' + user), merge: false, data: { email: email, uid: uid, kind: 'staff' } }]); })
      .then(function(){ API.logAudit('Staff password reset', user); S.staff = null; var w2 = $$('dvOv'); if(w2) w2.remove(); render(); showCreds('New password set ✔', { name: u.name, phone: '' }, user, pw); }).catch(function(e){ btn.disabled = false; toast(authMsg(e)); });
  };
}

/* ================================================================== data check */
var RULE_COLLS = ['distributors', 'distributor_stock', 'distributor_requests', 'distributor_log', 'distributor_sales', 'distributor_orders', 'roles', 'dist_logins', 'stock_totals', 'admins'];
function rulesCheck(){
  var box = $$('rulesOut'); if(!box) return;
  box.innerHTML = '<div class="dw-sub">Checking…</div>';
  var tests = RULE_COLLS.map(function(c){ return db().collection(c).limit(1).get().then(function(){ return [c, 'ok', '']; }, function(e){ return [c, e && e.code === 'permission-denied' ? 'denied' : 'error', (e && e.message) || '']; }); });
  tests.push(db().collection('login_index').doc('_probe').get().then(function(){ return ['login_index (single read)', 'ok', '']; }, function(e){ return ['login_index (single read)', e && e.code === 'permission-denied' ? 'denied' : 'error', (e && e.message) || '']; }));
  Promise.all(tests).then(function(rows){
    var bad = rows.filter(function(r){ return r[1] !== 'ok'; }).length;
    box.innerHTML = '<div class="dw-sub" style="margin-bottom:6px">Signed in as <b>' + esc(who()) + '</b> · role <b>' + esc((CLOUD && CLOUD.staffRole) || 'owner') + '</b></div>' + rows.map(function(r){ return '<div class="dw-row" style="padding:6px 0"><div class="dw-grow">' + esc(r[0]) + '</div><div>' + (r[1] === 'ok' ? '✅ allowed' : r[1] === 'denied' ? '⛔ blocked' : '⚠ ' + esc(r[2])) + '</div></div>'; }).join('') +
      (bad ? '<div class="dw-sub" style="color:#b23b3b;margin-top:6px">' + bad + ' blocked. Publish the latest rules: <code>firebase deploy --only firestore</code>, refresh, and check again.</div>' : '<div class="dw-sub" style="color:#1e7b46;margin-top:6px">All distributor collections are readable — the rules are up to date.</div>');
  });
}
function viewHealth(){
  var orphans = [], leaks = 0, drift = 0, sum = {};
  S.stock.forEach(function(s){ var d = S.dists.get(s.distributorId); if(s.visible && d && d.isActive !== false) sum[s.productId] = (sum[s.productId] || 0) + (Number(s.qty) || 0); });
  S.stock.forEach(function(s){
    var p = productById(s.productId), d = S.dists.get(s.distributorId);
    if(!p || !d){ orphans.push(s); return; }
    if(!s.showPrice && (s.mrp !== undefined || s.gstPct !== undefined)) leaks++;
    if(diffRow(s, d, p, Math.max(0, (sum[s.productId] || 0) - (s.visible ? (Number(s.qty) || 0) : 0)))) drift++;
  });
  var exp = totalsExpected(), tm = 0; Object.keys(exp).forEach(function(pid){ var c = S.totals.get(String(pid)); if(!c || sig(c.by) !== sig(exp[pid])) tm++; }); S.totals.forEach(function(t, pid){ if(!exp[pid]) tm++; });
  var card = function(ok, title, sub, btn){ return '<div class="dw-row"><div style="font-size:20px">' + (ok ? '✅' : '⚠️') + '</div><div class="dw-grow"><b>' + title + '</b><div class="dw-sub">' + sub + '</div></div>' + (btn || '') + '</div>'; };
  setBody('<div class="dw-card"><div class="dw-h">🔐 Firebase access check</div><div class="dw-sub">Shows which collections your login can read — use it when a screen says “Missing or insufficient permissions”.</div><button type="button" class="dw-btn sm" id="rulesBtn" data-ok="1" style="margin-top:8px">Run check</button><div id="rulesOut" style="margin-top:8px"></div></div>' +
    '<div class="dw-card"><div class="dw-h">Data check</div>' +
    card(!orphans.length, 'Stock rows of deleted products / distributors: ' + orphans.length, 'Safe to remove.', orphans.length ? '<button type="button" class="dw-btn sm" id="hOrph">Remove</button>' : '') +
    card(!leaks, 'Prices stored where they must be hidden: ' + leaks, 'Fixed automatically.', '') +
    card(!drift, 'Rows out of date with the catalogue: ' + drift, 'Names / specs / MRP / company stock — refreshed automatically within a minute.', drift ? '<button type="button" class="dw-btn sm" id="hSync">Refresh now</button>' : '') +
    card(!tm, 'Catalogue availability out of step: ' + tm, 'stock_totals vs distributor stock — corrected automatically.', tm ? '<button type="button" class="dw-btn sm" id="hSync2">Fix now</button>' : '') + '</div>');
  $$('rulesBtn').onclick = rulesCheck;
  if($$('hOrph')) $$('hOrph').onclick = function(){ if(confirm('Remove ' + orphans.length + ' stale row(s)?')) commitOps(orphans.map(function(s){ return { ref: db().collection('distributor_stock').doc(s.id), del: true }; })).then(function(){ toast('Removed'); viewHealth(); queueSync(1000); }).catch(fail); };
  var fix = function(){ S.syncing = false; S.mm = {}; Object.keys(S.mm).forEach(function(k){ S.mm[k].t = 0; }); syncAll().then(function(n){ toast(n + ' change(s) applied'); queueSync(5200); }); };
  if($$('hSync')) $$('hSync').onclick = fix; if($$('hSync2')) $$('hSync2').onclick = function(){ var exp2 = totalsExpected(), ops = [], now = Date.now(); Object.keys(exp2).forEach(function(pid){ ops.push({ ref: db().collection('stock_totals').doc(String(pid)), merge: false, data: { id: Number(pid), by: exp2[pid], ts: now } }); }); S.totals.forEach(function(t, pid){ if(!exp2[pid]) ops.push({ ref: db().collection('stock_totals').doc(String(pid)), del: true }); }); commitOps(ops).then(function(){ toast('Catalogue availability rebuilt'); }).catch(fail); };
}

/* ================================================================== register */
window.__acAdminTabs = window.__acAdminTabs || {};
window.__acAdminTabs.distributors = function(){ render(); queueSync(1500); };
/* product / catalog-card edits (name, spec, MRP, stock, new or removed items) reach distributors straight away */
window.__acCatalogChanged = function(){ if(S.started) queueSync(1500); };
if(CLOUD && CLOUD.enabled && CLOUD.role === 'admin'){
  API = window.__acApi; start();
  setInterval(function(){ if(S.started) syncAll(); }, 60000);   // picks up stock changes made elsewhere
}
})();
