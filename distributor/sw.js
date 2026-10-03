/* Distributor portal service worker — lets the page open without internet.
   Network first (you always get the newest version when online), cached copy when offline.
   Firestore / Auth API traffic is never touched here: the Firestore SDK keeps its own offline copy of the data. */
var V = 'acd-shell-v2';
self.addEventListener('install', function(e){ e.waitUntil(caches.open(V).then(function(c){ return c.add('./'); }).catch(function(){ }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request; if(r.method !== 'GET') return;
  var u = new URL(r.url);
  var ok = u.origin === location.origin || u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if(!ok) return;
  e.respondWith(fetch(r).then(function(res){
    if(res && (res.ok || res.type === 'opaque')){ var copy = res.clone(); caches.open(V).then(function(c){ c.put(r, copy); }); }
    return res;
  }).catch(function(){
    return caches.match(r).then(function(m){ return m || (r.mode === 'navigate' ? caches.match('./') : Response.error()); });
  }));
});
