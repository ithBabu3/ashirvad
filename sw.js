/* AshirvadConnect shell cache — repeat visits open fast even on a weak connection.
   • pages        : network first, but only wait 3.5 s, then use the saved copy
   • js / css / fonts / Firebase SDK : saved copy first, refreshed quietly in the background
   • images (same site) : saved copy first, trimmed to the 120 newest
   Firestore / Auth traffic is NEVER touched here — Firebase keeps its own offline data. */
var V = 'acx-v2', IMG = 'acx-img-v2';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== V && k !== IMG; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
function trim(name, max){ caches.open(name).then(function(c){ c.keys().then(function(ks){ if(ks.length > max) c.delete(ks[0]); }); }); }
self.addEventListener('fetch', function(e){
  var r = e.request; if(r.method !== 'GET') return;
  var u = new URL(r.url), same = u.origin === location.origin;
  var shared = same || u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if(!shared) return;                                                                   // Firestore, Auth, other sites: hands off
  if(r.mode === 'navigate' || (r.headers.get('accept') || '').indexOf('text/html') >= 0){
    e.respondWith(new Promise(function(resolve){
      var settled = false, timer = setTimeout(function(){ caches.match(r).then(function(m){ if(m && !settled){ settled = true; resolve(m); } }); }, 3500);
      fetch(r).then(function(res){ clearTimeout(timer); if(res && res.ok){ var copy = res.clone(); caches.open(V).then(function(c){ c.put(r, copy); }); } if(!settled){ settled = true; resolve(res); } },
        function(){ clearTimeout(timer); caches.match(r).then(function(m){ if(!settled){ settled = true; resolve(m || Response.error()); } }); });
    }));
    return;
  }
  if(r.destination === 'image'){
    if(!same) return;
    e.respondWith(caches.open(IMG).then(function(c){ return c.match(r).then(function(m){ return m || fetch(r).then(function(res){ if(res && res.ok){ c.put(r, res.clone()); trim(IMG, 120); } return res; }); }); }));
    return;
  }
  e.respondWith(caches.open(V).then(function(c){ return c.match(r).then(function(m){
    var net = fetch(r).then(function(res){ if(res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }, function(){ return m || Response.error(); });
    return m || net;
  }); }));
});
