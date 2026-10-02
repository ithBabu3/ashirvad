/* ==========================================================================
   AshirvadConnect — Firebase layer
   --------------------------------------------------------------------------
   What this file does (the app itself, js/app.js, is unchanged apart from a few hooks):

   1. Loads the Firebase SDK, signs the user in (or restores their session).
   2. Downloads the data that person is allowed to see from Firestore into memory.
   3. Provides `window.acStorage` — a drop-in replacement for localStorage that the app
      already uses everywhere. Reads come from that memory copy; every save is diffed and
      written to Firestore (only the documents that changed).
   4. Listens for changes made on other devices and refreshes the screen.
   5. Only THEN starts js/app.js.

   If js/firebase-config.js still contains the PASTE_ placeholders, none of this runs and
   the app works exactly as before with browser-only storage.
   ========================================================================== */
(function(){
'use strict';

var cfg = window.AC_FIREBASE_CONFIG || {};
var opt = Object.assign({ dealerEmailDomain:'dealer.ashirvadconnect.app', adminEmailDomain:'admin.ashirvadconnect.app', sdkVersion:'10.12.2' }, window.AC_CLOUD_OPTIONS || {});
var enabled = !!(cfg.apiKey && cfg.projectId && !/PASTE|YOUR_|XXXX/i.test(String(cfg.apiKey) + String(cfg.projectId)));

var CLOUD = window.AC_CLOUD = { enabled: enabled, role: 'none', phone: null, uid: null, options: opt };

var thisScript = document.currentScript;
var APP_SRC = thisScript ? thisScript.src.replace(/cloud\/firebase-boot\.js/, 'app.js') : 'js/app.js';

function loadScript(src){
  return new Promise(function(res, rej){
    var s = document.createElement('script'); s.src = src;
    s.onload = res; s.onerror = function(){ rej(new Error('Could not load ' + src)); };
    document.head.appendChild(s);
  });
}
function startApp(){
  return loadScript(APP_SRC)
    .then(function(){
      if(CLOUD.role !== 'admin') return;
      return loadScript(APP_SRC.replace('app.js', 'admin-distributors.js'))
        .catch(function(e){ console.error('[AshirvadConnect] could not load admin-distributors.js — is the file named exactly js/admin-distributors.js ?', e); });
    })
    .then(function(){ setTimeout(function(){ CLOUD.writesEnabled = true; }, 700); });
}

if(!enabled){ startApp(); return; }   // local mode — nothing else to do

/* ---------------------------------------------------------------- helpers */
var $ = function(id){ return document.getElementById(id); };
function normPhone(p){ return String(p || '').replace(/\D/g, ''); }
function dealerEmail(phone){ return normPhone(phone) + '@' + opt.dealerEmailDomain; }
function adminEmail(user){ return String(user || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') + '@' + opt.adminEmailDomain; }
function toast(msg){ try{ if(window.__acToast) window.__acToast(msg); else console.warn(msg); }catch(e){} }
function canon(v){
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if(v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function(k){ return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
  return JSON.stringify(v);
}
function hash(str){ var h = 5381; for(var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
/* Firestore cannot store arrays directly inside arrays — wrap them on the way in, unwrap on the way out. */
function encode(v){
  if(Array.isArray(v)) return v.map(function(x){ return Array.isArray(x) ? { __a: encode(x) } : encode(x); });
  if(v && typeof v === 'object'){ var o = {}; Object.keys(v).forEach(function(k){ if(v[k] !== undefined) o[k] = encode(v[k]); }); return o; }
  return v;
}
function decode(v){
  if(Array.isArray(v)) return v.map(decode);
  if(v && typeof v === 'object'){
    if(Object.keys(v).length === 1 && Array.isArray(v.__a)) return decode(v.__a);
    var o = {}; Object.keys(v).forEach(function(k){ o[k] = decode(v[k]); }); return o;
  }
  return v;
}
function clean(v){ return JSON.parse(JSON.stringify(v)); }   // drops undefined, Infinity -> null

/* ------------------------------------------------------------ boot overlay */
var overlay;
function showOverlay(html){
  if(!overlay){
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a1322;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Poppins,system-ui,sans-serif;text-align:center;padding:24px;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = html;
}
function hideOverlay(){ if(overlay){ overlay.remove(); overlay = null; } }
function fatal(err){
  console.error('[cloud]', err);
  showOverlay('<div style="font-size:34px;margin-bottom:10px">⚠️</div><div style="font-weight:600;font-size:16px;margin-bottom:8px">Could not connect</div>' +
    '<div style="opacity:.75;font-size:13px;max-width:340px;margin-bottom:16px">' + String((err && err.message) || err).replace(/</g, '&lt;') + '</div>' +
    '<button id="acRetry" style="background:#c9a24b;border:0;border-radius:8px;padding:10px 22px;font-weight:600">Try again</button>');
  var b = $('acRetry'); if(b) b.onclick = function(){ location.reload(); };
}

/* ------------------------------------------------------ data-key catalogue */
/* scope: shared = every signed-in user reads, admin writes
          owned  = each doc carries accountKey (dealer's phone); dealers only see their own
          admin  = admin only
   dealerWrite = may a dealer's device write this key?                                    */
var KEYS = {
  ac_users:                { kind:'map',  coll:'dealers',              scope:'owned',  strip:['password'], dealerWrite:true },
  ac_accounts:             { kind:'map',  coll:'accounts',             scope:'account', strip:['password'], dealerWrite:true },
  ac_orders:               { kind:'list', coll:'orders',               scope:'owned',  gst:'dealerGst', dealerWrite:true },
  ac_payments:             { kind:'list', coll:'payments',             scope:'owned',  gst:'dealerGst' },
  ac_stock_notify:         { kind:'list', coll:'stock_notify',         scope:'owned',  gst:'gst', time:true, dealerWrite:true },
  ac_audit_log:            { kind:'list', coll:'audit_log',            scope:'admin',  time:true, dealerWrite:true },
  ac_products:             { kind:'list', coll:'products',             scope:'shared', filter:function(p){ return !p.isCatalogVariant; } },
  ac_spec_groups:          { kind:'list', coll:'spec_groups',          scope:'shared' },
  ac_catalog_categories:   { kind:'list', coll:'catalog_categories',   scope:'shared' },
  ac_catalog_subcategories:{ kind:'list', coll:'catalog_subcategories',scope:'shared' },
  ac_offers:               { kind:'list', coll:'offers',               scope:'shared' },
  ac_banners:              { kind:'list', coll:'banners',              scope:'shared' },
  ac_calc_rules:           { kind:'list', coll:'calc_rules',           scope:'shared' },
  ac_broadcasts:           { kind:'list', coll:'broadcasts',           scope:'shared' },
  ac_settings:             { kind:'doc',  path:'config/settings',      scope:'shared' },
  ac_invoice_seq:          { kind:'doc',  path:'config/invoice_seq',   scope:'shared', scalar:true, dealerWrite:true }
};
var DEALER_DONE_FLAGS = { ac_agri_casing_migrated:1, ac_dup_repair_done:1 };   // one-off migrations: admin's job only

/* ------------------------------------------------------------------ state */
var firebase, auth, db;
var buckets = {};            // key -> { cfg, docs: Map(id -> encoded doc), synced: Map(id -> canon), str: cached JSON }
var listeners = [];
var pending = [];            // in-flight write promises
var flushTimers = {};
var dirty = {};
var refreshTimer = null;

function newBucket(key){ return { key: key, cfg: KEYS[key], docs: new Map(), synced: new Map(), str: undefined }; }
Object.keys(KEYS).forEach(function(k){ buckets[k] = newBucket(k); });

/* ------------------------------------------------------- storage adapter */
function rawLocal(){ return window.localStorage; }
function idOf(item, cfg){
  if(item && item.id !== undefined && item.id !== null && item.id !== '') return String(item.id).replace(/\//g, '_');
  return 'h' + hash(canon(item));
}
function accountKeyFor(item, cfg){
  if(CLOUD.role === 'dealer') return CLOUD.phone;
  var g = item && item[cfg.gst];
  var d = g && buckets.ac_users.docs.get(String(g));
  return d && d.accountKey ? d.accountKey : undefined;
}
function prepare(bucket, item, index, oldDocs){
  var cfg = bucket.cfg, enc = encode(clean(item));
  (cfg.strip || []).forEach(function(f){ delete enc[f]; });
  if(cfg.kind === 'list'){
    var id = idOf(item, cfg), old = oldDocs.get(id);
    enc._o = cfg.time ? (old && old._o !== undefined ? old._o : Date.now() * 1000 + index) : index;
    if(cfg.scope === 'owned'){
      var ak = (old && old.accountKey) || accountKeyFor(item, cfg);
      if(ak) enc.accountKey = ak;
    }
  } else if(cfg.kind === 'map' && bucket.key === 'ac_users' && !enc.accountKey && enc.phone){
    enc.accountKey = normPhone(enc.phone);
  }
  return enc;
}
function setBucketFromString(key, str){
  var b = buckets[key], cfg = b.cfg, val;
  if(cfg.scalar){ b.docs = new Map([['_', { n: Number(str) || 0 }]]); }
  else {
    try{ val = JSON.parse(str); }catch(e){ return; }
    var old = b.docs, next = new Map();
    if(cfg.kind === 'list'){
      if(!Array.isArray(val)) return;
      val.forEach(function(item, i){
        if(cfg.filter && !cfg.filter(item)) return;
        next.set(idOf(item, cfg), prepare(b, item, i, old));
      });
    } else if(cfg.kind === 'map'){
      Object.keys(val || {}).forEach(function(k){ next.set(k, prepare(b, val[k], 0, old)); });
    } else {   // single doc
      next.set('_', prepare(b, val || {}, 0, old));
    }
    b.docs = next;
  }
  b.str = undefined;
}
function bucketToString(key){
  var b = buckets[key], cfg = b.cfg;
  if(b.str !== undefined) return b.str;
  var out;
  // Before the first publish an empty list means "never set" (the app shows its sample data).
  // After it, empty means the admin really deleted everything — don't bring the samples back.
  if(!b.docs.size) out = (CLOUD.published && cfg.kind === 'list') ? '[]' : null;
  else if(cfg.scalar) out = String((b.docs.get('_') || {}).n || 0);
  else if(cfg.kind === 'doc') out = JSON.stringify(decode(strip_o(b.docs.get('_'))));
  else if(cfg.kind === 'map'){ var m = {}; b.docs.forEach(function(v, k){ m[k] = decode(strip_o(v)); }); out = JSON.stringify(m); }
  else {
    var rows = Array.from(b.docs.entries()).sort(function(a, c){ var d = (a[1]._o || 0) - (c[1]._o || 0); return d || (a[0] < c[0] ? -1 : 1); });
    out = JSON.stringify(rows.map(function(r){ return decode(strip_o(r[1])); }));
  }
  b.str = out;
  return out;
}
function strip_o(d){ if(!d || d._o === undefined) return d; var o = Object.assign({}, d); delete o._o; return o; }

function ref(bucket, id){
  var cfg = bucket.cfg;
  if(cfg.kind === 'doc'){ var p = cfg.path.split('/'); return db.collection(p[0]).doc(p[1]); }
  return db.collection(cfg.coll).doc(id);
}
function canWrite(bucket){
  if(!CLOUD.writesEnabled) return false;
  if(CLOUD.role === 'admin') return true;
  return CLOUD.role === 'dealer' && !!bucket.cfg.dealerWrite;
}
function scheduleFlush(key){
  dirty[key] = true;
  clearTimeout(flushTimers[key]);
  flushTimers[key] = setTimeout(function(){ flush(key); }, 250);
}
function flush(key){
  var b = buckets[key];
  delete dirty[key];
  if(!canWrite(b)) return Promise.resolve();
  var ops = [];
  b.docs.forEach(function(enc, id){ var c = canon(enc); if(b.synced.get(id) !== c) ops.push({ t:'set', id:id, enc:enc, c:c }); });
  b.synced.forEach(function(c, id){ if(!b.docs.has(id)) ops.push({ t:'del', id:id }); });
  if(!ops.length) return Promise.resolve();
  var chunks = [];
  for(var i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
  var p = chunks.reduce(function(chain, chunk){
    return chain.then(function(){
      var batch = db.batch();
      chunk.forEach(function(op){
        var r = ref(b, op.id);
        if(op.t === 'set') batch.set(r, op.enc); else batch.delete(r);
      });
      return batch.commit().then(function(){
        chunk.forEach(function(op){ if(op.t === 'set') b.synced.set(op.id, op.c); else b.synced.delete(op.id); });
      });
    });
  }, Promise.resolve()).catch(function(err){
    console.error('[cloud] save failed for', key, err);
    var msg = err && err.code === 'permission-denied' ? 'Not allowed to save this change' : 'Could not save to the cloud — check your internet';
    toast('⚠ ' + msg);
    return resync(key);
  });
  pending.push(p);
  p.then(function(){ pending = pending.filter(function(x){ return x !== p; }); });
  return p;
}
CLOUD.flushAll = function(){
  var keys = Object.keys(dirty);
  keys.forEach(function(k){ clearTimeout(flushTimers[k]); });
  return Promise.all(keys.map(flush)).then(function(){ return Promise.all(pending); });
};

/* Discard local edits for a collection and take the server's version again. */
function resync(key){
  var b = buckets[key];
  return fetchBucket(b).then(function(snapDocs){
    b.docs = new Map(); b.synced = new Map();
    snapDocs.forEach(function(d){ b.docs.set(d.id, d.data); b.synced.set(d.id, canon(d.data)); });
    b.str = undefined;
    scheduleRefresh();
  }).catch(function(){});
}

/* The adapter the app talks to */
var LOCAL_FLAG_FOR_DEALER = function(k){ return CLOUD.role === 'dealer' && DEALER_DONE_FLAGS[k]; };
window.acStorage = {
  getItem: function(k){
    if(KEYS[k]) return bucketToString(k);
    if(LOCAL_FLAG_FOR_DEALER(k)) return '1';
    return rawLocal().getItem(k);
  },
  setItem: function(k, v){
    if(KEYS[k]){ setBucketFromString(k, String(v)); scheduleFlush(k); return; }
    rawLocal().setItem(k, v);
  },
  removeItem: function(k){
    if(KEYS[k]){ buckets[k].docs = new Map(); buckets[k].str = undefined; scheduleFlush(k); return; }
    rawLocal().removeItem(k);
  },
  key: function(i){ return rawLocal().key(i); },
  get length(){ return rawLocal().length; },
  clear: function(){ rawLocal().clear(); }
};

/* -------------------------------------------------------- reading the cloud */
function fetchBucket(b){
  return queryFor(b).then(function(q){
    if(!q) return [];
    return q.get().then(function(snap){ return snapToDocs(b, snap); });
  });
}
function isDocSnap(snap){ return !snap.docs; }
function snapToDocs(b, snap){
  if(!isDocSnap(snap)) return snap.docs.map(function(d){ return { id: d.id, data: d.data() }; });
  return snap.exists ? [{ id: b.cfg.kind === 'doc' ? '_' : snap.id, data: snap.data() }] : [];
}
/* Which query a given role uses for a given collection (null = not allowed / not needed). */
function queryFor(b){
  var cfg = b.cfg, role = CLOUD.role;
  if(role === 'none') return Promise.resolve(null);
  if(cfg.kind === 'doc') return Promise.resolve(ref(b));
  if(cfg.scope === 'shared') return Promise.resolve(db.collection(cfg.coll));
  if(role === 'admin') return Promise.resolve(db.collection(cfg.coll));
  if(cfg.scope === 'admin') return Promise.resolve(null);
  if(cfg.scope === 'account') return Promise.resolve(db.collection(cfg.coll).doc(CLOUD.phone));
  return Promise.resolve(db.collection(cfg.coll).where('accountKey', '==', CLOUD.phone));   // owned
}
function listen(b){
  return queryFor(b).then(function(q){
    if(!q) return;
    return new Promise(function(resolve, reject){
      var first = true;
      var unsub = q.onSnapshot({ includeMetadataChanges: false }, function(snap){
        if(first){
          first = false;
          b.docs = new Map(); b.synced = new Map();
          snapToDocs(b, snap).forEach(function(d){ b.docs.set(d.id, d.data); b.synced.set(d.id, canon(d.data)); });
          b.str = undefined;
          resolve();
          return;
        }
        var changed = false;
        if(snap.docChanges){
          snap.docChanges().forEach(function(ch){
            if(ch.doc.metadata && ch.doc.metadata.hasPendingWrites) return;   // our own write echoing back
            var id = ch.doc.id, data = ch.doc.data();
            if(ch.type === 'removed'){ b.docs.delete(id); b.synced.delete(id); }
            else { b.docs.set(id, data); b.synced.set(id, canon(data)); }
            changed = true;
          });
        } else if(!(snap.metadata && snap.metadata.hasPendingWrites)){   // single document
          b.docs = new Map(); b.synced = new Map();
          snapToDocs(b, snap).forEach(function(d){ b.docs.set(d.id, d.data); b.synced.set(d.id, canon(d.data)); });
          changed = true;
        }
        if(changed){ b.str = undefined; scheduleRefresh(); }
      }, function(err){
        if(first){ first = false; reject(err); } else console.warn('[cloud] listener error', b.key, err);
      });
      listeners.push(unsub);
    });
  });
}
function preloadAll(){
  return Promise.all(Object.keys(buckets).map(function(k){ return listen(buckets[k]); }));
}

/* Refresh the visible screen after data changed elsewhere — but never while someone is typing / has a dialog open. */
function userIsBusy(){
  if(document.querySelector('.modal.show, .offcanvas.show')) return true;
  var a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'button');
}
function scheduleRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(function tryRefresh(){
    if(!window.__acRefresh) return;
    if(userIsBusy()){ refreshTimer = setTimeout(tryRefresh, 3000); return; }
    try{ window.__acRefresh(); }catch(e){ console.warn('[cloud] refresh failed', e); }
  }, 900);
}

/* ------------------------------------------------------------------- auth */
CLOUD.reload = function(){ location.reload(); };
CLOUD.signOut = function(){
  listeners.forEach(function(u){ try{ u(); }catch(e){} }); listeners = [];
  return CLOUD.flushAll().catch(function(){}).then(function(){ return auth.signOut(); });
};
CLOUD.authMessage = function(err, t, isAdmin){
  var c = (err && err.code) || '';
  if(c === 'ac/not-admin') return 'This account does not have admin access.';
  if(c === 'auth/user-not-found') return isAdmin ? 'Invalid admin username or password.' : (t ? t('auth.err.notFound') : 'Account not found.');
  if(/invalid-credential|wrong-password|invalid-login/.test(c)) return isAdmin ? 'Invalid admin username or password.' : (t ? t('auth.err.wrongPassword') : 'Wrong phone number or password.');
  if(c === 'auth/too-many-requests') return 'Too many attempts. Please wait a few minutes and try again.';
  if(c === 'auth/network-request-failed') return 'Network problem — check your internet connection.';
  if(c === 'auth/weak-password') return 'Password must be at least 6 characters.';
  return (err && err.message) || 'Something went wrong. Please try again.';
};
/* Log in a dealer, then pre-load their profiles so the "choose business" list can be shown. */
CLOUD.dealerLogin = function(phone, password){
  var ph = normPhone(phone);
  return auth.signInWithEmailAndPassword(dealerEmail(ph), password).then(function(){
    CLOUD.role = 'dealer'; CLOUD.phone = ph;
    var b = buckets.ac_users;
    return db.collection('dealers').where('accountKey', '==', ph).get().then(function(snap){
      b.docs = new Map(); b.synced = new Map();
      snap.docs.forEach(function(d){ b.docs.set(d.id, d.data()); b.synced.set(d.id, canon(d.data())); });
      b.str = undefined;
      var gsts = snap.docs.map(function(d){ return d.id; });
      if(!gsts.length){ return auth.signOut().then(function(){ var e = new Error('No business is linked to this login.'); e.code = 'auth/user-not-found'; throw e; }); }
      return { gsts: gsts };
    });
  });
};
/* New dealer (or an existing login adding one more business). */
CLOUD.dealerRegister = function(p){
  var ph = normPhone(p.phone), email = dealerEmail(ph), createdNow = false;
  return auth.createUserWithEmailAndPassword(email, p.password).then(function(){ createdNow = true; }, function(err){
    if(err && err.code === 'auth/email-already-in-use'){
      return auth.signInWithEmailAndPassword(email, p.password).catch(function(){ var e = new Error('phone'); e.code = 'ac/phone-wrong-password'; throw e; });
    }
    throw err;
  }).then(function(){
    var profile = {
      business: p.business, gst: p.gst, phone: ph, address: p.address, contactPerson: '', email: '',
      deliveryAddress: p.address, tier: 'Standard', notes: '', standingDiscountPct: 0, accountKey: ph
    };
    return db.collection('dealers').doc(p.gst).set(profile).catch(function(err){
      var undo = createdNow && auth.currentUser ? auth.currentUser.delete().catch(function(){}) : Promise.resolve();
      return undo.then(function(){
        if(err && err.code === 'permission-denied'){ var e = new Error('gst'); e.code = 'ac/gst-exists'; throw e; }
        throw err;
      });
    });
  }).then(function(){
    return db.collection('accounts').doc(ph).set({ gsts: firebase.firestore.FieldValue.arrayUnion(p.gst) }, { merge: true });
  });
};
CLOUD.adminLogin = function(username, password){
  return auth.signInWithEmailAndPassword(adminEmail(username), password).then(function(cred){
    return db.collection('admins').doc(cred.user.uid).get().then(function(d){
      if(!d.exists){ return auth.signOut().then(function(){ var e = new Error('not admin'); e.code = 'ac/not-admin'; throw e; }); }
    });
  });
};

/* ------------------------------------------------- Cloud panel (admin only) */
CLOUD.status = function(){
  var rows = Object.keys(KEYS).map(function(k){ return { key: k, collection: KEYS[k].coll || KEYS[k].path, docs: buckets[k].docs.size }; });
  return { project: cfg.projectId, role: CLOUD.role, uid: CLOUD.uid, collections: rows };
};
CLOUD.publishCurrent = function(){
  if(window.__acSeed) window.__acSeed();
  return CLOUD.flushAll();
};
CLOUD.importDump = function(dump, onProgress){
  var say = onProgress || function(){};
  var report = { dealers: 0, created: 0, existing: 0, tempPasswords: [], errors: [] };
  function parse(k){ try{ return dump[k] ? JSON.parse(dump[k]) : null; }catch(e){ report.errors.push('Could not read ' + k); return null; } }
  var users = parse('ac_users') || {}, accounts = parse('ac_accounts') || {};
  var secApp, secAuth;

  // 1) login accounts (Firebase Auth) — one per phone number
  var phones = {};
  Object.keys(accounts).forEach(function(ph){ phones[normPhone(ph)] = accounts[ph].password; });
  Object.keys(users).forEach(function(g){ var ph = normPhone(users[g].phone); if(ph && !(ph in phones)) phones[ph] = users[g].password; });
  var phoneList = Object.keys(phones).filter(Boolean);
  report.dealers = Object.keys(users).length;
  try{ secApp = firebase.initializeApp(cfg, 'importer-' + Date.now()); secAuth = secApp.auth(); }catch(e){ return Promise.reject(e); }

  var chain = Promise.resolve();
  phoneList.forEach(function(ph, i){
    chain = chain.then(function(){
      say('Creating dealer logins… ' + (i + 1) + ' / ' + phoneList.length);
      var pw = phones[ph];
      if(!pw || String(pw).length < 6){ pw = 'Ac@' + ph.slice(-6).padStart(6, '0'); report.tempPasswords.push({ phone: ph, password: pw }); }
      return secAuth.createUserWithEmailAndPassword(dealerEmail(ph), pw).then(function(){ report.created++; }, function(err){
        if(err && err.code === 'auth/email-already-in-use') report.existing++;
        else report.errors.push(ph + ': ' + (err && err.code || err));
      }).then(function(){ return secAuth.signOut().catch(function(){}); });
    });
  });
  // 2) data — dealers first so orders / payments can be tagged with the owner's phone
  var order = ['ac_users', 'ac_accounts', 'ac_products', 'ac_spec_groups', 'ac_catalog_categories', 'ac_catalog_subcategories',
               'ac_offers', 'ac_banners', 'ac_calc_rules', 'ac_broadcasts', 'ac_settings', 'ac_orders', 'ac_payments',
               'ac_stock_notify', 'ac_audit_log', 'ac_invoice_seq'];
  return chain.then(function(){
    order.forEach(function(k){
      if(dump[k] === undefined || dump[k] === null) return;
      say('Uploading ' + k.replace('ac_', '') + '…');
      window.acStorage.setItem(k, dump[k]);
    });
    return CLOUD.flushAll();
  }).then(function(){ return secApp.delete().catch(function(){}); }).then(function(){ return report; });
};

CLOUD.openAdminPanel = function(){
  if(CLOUD.role !== 'admin'){ toast('Admin only'); return; }
  var st = CLOUD.status();
  var w = document.createElement('div');
  w.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(10,19,34,.72);display:flex;align-items:center;justify-content:center;padding:14px;';
  w.innerHTML =
    '<div style="background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:92vh;overflow:auto;padding:20px;font-size:13.5px;color:#222">' +
    '<div style="display:flex;justify-content:space-between;align-items:center"><h5 style="margin:0">☁ Cloud sync</h5><button id="acpClose" class="btn btn-sm btn-outline-secondary">Close</button></div>' +
    '<div style="margin:10px 0;padding:10px;background:#eef7ee;border-radius:8px">🟢 Connected to Firebase project <b>' + st.project + '</b><br><span style="color:#555">Changes made on any device appear on the others within a few seconds.</span></div>' +
    '<table class="table table-sm" style="font-size:12px"><thead><tr><th>Data</th><th>Cloud collection</th><th class="text-end">Documents</th></tr></thead><tbody>' +
    st.collections.map(function(r){ return '<tr><td>' + r.key.replace('ac_', '') + '</td><td>' + r.collection + '</td><td class="text-end">' + r.docs + '</td></tr>'; }).join('') +
    '</tbody></table>' +
    '<hr><div style="font-weight:600">1. Publish the starting catalog</div>' +
    '<div style="color:#555;margin:4px 0 8px">First time only: sends the built-in catalog, categories and settings to the cloud so dealers can see them. Safe to press again — it only adds what is missing.</div>' +
    '<button id="acpPublish" class="btn btn-sm btn-dark">☁ Publish catalog &amp; settings</button>' +
    '<hr><div style="font-weight:600">2. Import data from the old (browser-only) version</div>' +
    '<ol style="color:#555;padding-left:18px;margin:6px 0">' +
    '<li>Open the OLD app in the browser where your real data is.</li><li>Press <b>F12</b> → Console, paste <code>copy(JSON.stringify(localStorage))</code>, press Enter.</li>' +
    '<li>Paste into Notepad and save as <b>old-data.json</b>.</li><li>Choose that file below.</li></ol>' +
    '<input type="file" id="acpFile" accept=".json,application/json" class="form-control form-control-sm mb-2">' +
    '<button id="acpImport" class="btn btn-sm btn-outline-dark">⬆ Import dealers, orders &amp; catalog</button>' +
    '<div id="acpMsg" style="margin-top:12px;white-space:pre-wrap"></div></div>';
  document.body.appendChild(w);
  var msg = w.querySelector('#acpMsg');
  w.querySelector('#acpClose').onclick = function(){ w.remove(); };
  w.querySelector('#acpPublish').onclick = function(){
    msg.textContent = 'Publishing…';
    CLOUD.publishCurrent().then(function(){ msg.textContent = '✅ Published. Dealers can now see the catalog.'; }).catch(function(e){ msg.textContent = '❌ ' + (e && e.message || e); });
  };
  w.querySelector('#acpImport').onclick = function(){
    var f = w.querySelector('#acpFile').files[0];
    if(!f){ msg.textContent = 'Choose the old-data.json file first.'; return; }
    if(!confirm('Import this data into the cloud? Existing documents with the same id will be replaced.')) return;
    var fr = new FileReader();
    fr.onload = function(){
      var dump; try{ dump = JSON.parse(fr.result); }catch(e){ msg.textContent = '❌ That file is not valid JSON.'; return; }
      CLOUD.importDump(dump, function(m){ msg.textContent = m; }).then(function(r){
        var t = '✅ Import finished.\nDealer profiles: ' + r.dealers + '\nLogins created: ' + r.created + ' (already existed: ' + r.existing + ')';
        if(r.tempPasswords.length) t += '\n\n⚠ These dealers had passwords shorter than 6 characters (Firebase minimum). Give them the temporary password:\n' + r.tempPasswords.map(function(x){ return '  ' + x.phone + '  →  ' + x.password; }).join('\n');
        if(r.errors.length) t += '\n\nProblems:\n  ' + r.errors.join('\n  ');
        msg.textContent = t;
      }).catch(function(e){ msg.textContent = '❌ ' + (e && e.message || e); });
    };
    fr.readAsText(f);
  };
};

/* ------------------------------------------------------------------- boot */
function boot(){
  showOverlay('<div style="font-family:\'Cormorant Garamond\',serif;font-size:26px;font-weight:700;margin-bottom:6px">AshirvadConnect</div><div style="opacity:.7;font-size:13px">Connecting…</div>');
  var base = 'https://www.gstatic.com/firebasejs/' + opt.sdkVersion + '/';
  return loadScript(base + 'firebase-app-compat.js')
    .then(function(){ return loadScript(base + 'firebase-auth-compat.js'); })
    .then(function(){ return loadScript(base + 'firebase-firestore-compat.js'); })
    .then(function(){
      firebase = window.firebase;
      firebase.initializeApp(cfg);
      auth = firebase.auth(); db = firebase.firestore();
      CLOUD.firebase = firebase; CLOUD.auth = auth; CLOUD.db = db;
      return new Promise(function(res){ var u = auth.onAuthStateChanged(function(user){ u(); res(user); }); });
    })
    .then(function(user){
      if(!user) return finish('none');
      var email = (user.email || '').toLowerCase();
      CLOUD.uid = user.uid;
      if(email.slice(-(opt.adminEmailDomain.length + 1)) === '@' + opt.adminEmailDomain){
        return db.collection('admins').doc(user.uid).get().then(function(d){
          if(d.exists) return finish('admin');
          return auth.signOut().then(function(){ return finish('none'); });
        });
      }
      if(email.slice(-(opt.dealerEmailDomain.length + 1)) === '@' + opt.dealerEmailDomain){
        CLOUD.phone = email.split('@')[0];
        return finish('dealer');
      }
      return auth.signOut().then(function(){ return finish('none'); });
    })
    .then(function(){ hideOverlay(); })
    .catch(fatal);
}
function finish(role){
  CLOUD.role = role;
  var ls = rawLocal();
  if(role !== 'admin') ls.removeItem('ac_admin_session');
  else if(!ls.getItem('ac_admin_session')) ls.setItem('ac_admin_session', '1');
  if(role === 'none'){ ls.removeItem('ac_session'); return startApp(); }
  return preloadAll().then(function(){
    CLOUD.published = buckets.ac_settings.docs.size > 0;
    Object.keys(buckets).forEach(function(k){ buckets[k].str = undefined; });
    if(role === 'dealer'){
      var gsts = Array.from(buckets.ac_users.docs.keys());
      var cur = ls.getItem('ac_session');
      if(!cur || gsts.indexOf(cur) === -1){
        if(gsts.length === 1) ls.setItem('ac_session', gsts[0]); else ls.removeItem('ac_session');
      }
    }
    return startApp();
  });
}
boot();

})();
