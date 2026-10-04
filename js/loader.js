/* ==========================================================================
   AshirvadConnect — shared page loader + image loader  (used by the store, the admin console and the distributor portal)
   • Splash screen with real progress steps, "slow connection" help after a few seconds, Retry when something stalls.
   • Every <img> gets a shimmer placeholder while it loads, lazy loading, automatic retries and a friendly
     "image unavailable — tap to retry" tile if it never arrives.
   • Registers a service worker (sw.js) so repeat visits open instantly even on a weak connection.
   Loaded synchronously and first, so the splash is visible before anything heavy starts.
   ========================================================================== */
(function(){
'use strict';
if(window.acLoader) return;
var me = document.currentScript, BASE = me && me.src ? me.src.replace(/js\/loader\.js.*$/, '') : '';
var splash = null, bar = null, txt = null, help = null, t0 = Date.now(), pct = 0, doneFlag = false, timers = [];
var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var slowNet = !!(conn && (conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || '')));

function el(){ splash = document.getElementById('acSplash'); if(splash){ bar = splash.querySelector('.acs-bar i'); txt = splash.querySelector('.acs-txt'); help = splash.querySelector('.acs-help'); } return splash; }
function set(p, text){
  if(!el() || doneFlag) return;
  if(typeof p === 'number' && p > pct){ pct = Math.min(p, 96); if(bar) bar.style.width = pct + '%'; }
  if(text && txt) txt.textContent = text;
}
function say(html){ if(help){ help.innerHTML = html; help.style.opacity = 1; } }
function retryHtml(msg){ return (msg ? '<div>' + msg + '</div>' : '') + '<button type="button" onclick="location.reload()">Retry</button>'; }
function done(){
  if(doneFlag) return; doneFlag = true; timers.forEach(clearTimeout);
  if(!el()) return;
  if(bar) bar.style.width = '100%';
  splash.classList.add('acs-out');
  setTimeout(function(){ if(splash && splash.parentNode) splash.parentNode.removeChild(splash); document.documentElement.classList.remove('ac-loading'); }, 380);
}
function fail(msg, onRetry){
  if(!el()){ return; } doneFlag = false; timers.forEach(clearTimeout);
  splash.classList.remove('acs-out'); splash.classList.add('acs-fail');
  if(txt) txt.textContent = 'Could not connect';
  if(help){ help.innerHTML = '<div style="max-width:320px;margin:0 auto 12px">' + String(msg || 'Please check your internet connection.').replace(/</g, '&lt;') + '</div><button type="button" id="acsRetry">Try again</button>'; help.style.opacity = 1;
    var b = document.getElementById('acsRetry'); if(b) b.onclick = function(){ if(onRetry) onRetry(); else location.reload(); }; }
}
function skeleton(n, kind){
  var out = '<div class="ac-skel-wrap" aria-busy="true" aria-label="Loading">';
  for(var i = 0; i < (n || 4); i++) out += kind === 'card' ? '<div class="ac-skel ac-skel-card"></div>' : '<div class="ac-skel ac-skel-line"><i></i><b></b></div>';
  return out + '</div>';
}
window.acLoader = { set: set, done: done, fail: fail, say: say, skeleton: skeleton, slow: slowNet };

/* ---- slow-connection help ---- */
if(slowNet) document.documentElement.classList.add('ac-slownet');
function offline(){ return navigator.onLine === false; }
timers.push(setTimeout(function(){ if(doneFlag) return; say(offline() ? '📴 You are offline. Reconnect — the page will continue by itself.' : '🐢 Slow connection — still loading. After this first time the app opens much faster.'); }, 6000));
timers.push(setTimeout(function(){ if(doneFlag) return; say(retryHtml(offline() ? '📴 Still offline.' : 'This is taking longer than usual.')); }, 22000));
window.addEventListener('offline', function(){ if(!doneFlag) say('📴 You are offline. Reconnect — the page will continue by itself.'); });
window.addEventListener('online', function(){ if(!doneFlag) say('✅ Back online — loading…'); });
/* never leave a user staring at the splash if the app forgets to call done() */
timers.push(setTimeout(function(){ if(!doneFlag && el() && !splash.classList.contains('acs-fail')) say(retryHtml('Still working…')); }, 45000));

/* ==================================================================== images */
var PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#f1efe6"/><g fill="none" stroke="#b9b29a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="30" y="22" width="60" height="46" rx="6"/><circle cx="46" cy="38" r="5"/><path d="M34 62l18-16 12 10 8-7 14 13"/></g><text x="60" y="84" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#9a937c">tap to retry</text></svg>');
function track(img){
  if(img.__acT || img.closest && img.closest('#acSplash')) return; img.__acT = 1;
  if(!img.hasAttribute('decoding')) img.decoding = 'async';
  var eager = img.hasAttribute('data-eager') || /(^|\s)(hd-logo|brand-logo|watermark)(\s|$)/.test(img.className);
  if(!img.hasAttribute('loading') && !eager) img.loading = 'lazy';
  if(slowNet && !eager) img.setAttribute('fetchpriority', 'low');
  if(img.complete && img.naturalWidth > 0) return;
  if(img.complete && !img.naturalWidth && img.getAttribute('src')){ onErr(img); return; }
  img.classList.add('ac-img-wait');
  img.addEventListener('load', function(){ img.classList.remove('ac-img-wait', 'ac-img-fail'); }, { once: true });
}
function onErr(img){
  if(!img || img.tagName !== 'IMG') return;
  img.classList.remove('ac-img-wait');
  if(img.getAttribute('onerror')) return;                        // the app has its own fallback for this image — respect it
  var src = img.getAttribute('src') || ''; if(!src || /^data:/.test(src)) return;
  var n = img.__acTry || 0;
  if(img.__acFailed){ return; }
  if(n < 2 && navigator.onLine !== false){
    img.__acTry = n + 1; img.classList.add('ac-img-wait');
    setTimeout(function(){ var base = (img.__acOrig = img.__acOrig || src).replace(/([?&])acr=\d+&?/, '$1').replace(/[?&]$/, ''); img.src = base + (base.indexOf('?') < 0 ? '?' : '&') + 'acr=' + (n + 1); }, 900 * (n + 1) * (n + 1));
    return;
  }
  img.__acFailed = true; img.__acOrig = img.__acOrig || src; img.classList.add('ac-img-fail'); img.src = PH;
  img.title = 'Image could not be loaded — tap to retry';
}
document.addEventListener('error', function(e){ if(e.target && e.target.tagName === 'IMG') onErr(e.target); }, true);
document.addEventListener('click', function(e){                  // tap a failed image to try again
  var img = e.target; if(!img || img.tagName !== 'IMG' || !img.classList.contains('ac-img-fail')) return;
  e.preventDefault(); e.stopPropagation();
  img.__acFailed = false; img.__acTry = 0; img.classList.remove('ac-img-fail'); img.classList.add('ac-img-wait'); img.src = img.__acOrig;
}, true);
function scan(root){ var list = (root.querySelectorAll ? root.querySelectorAll('img') : []); for(var i = 0; i < list.length; i++) track(list[i]); if(root.tagName === 'IMG') track(root); }
function startImages(){
  scan(document);
  new MutationObserver(function(muts){ for(var i = 0; i < muts.length; i++){ var a = muts[i].addedNodes; for(var j = 0; j < a.length; j++) if(a[j].nodeType === 1) scan(a[j]); } }).observe(document.documentElement, { childList: true, subtree: true });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startImages); else startImages();

/* ================================================================ offline-ready shell (service worker) */
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !document.documentElement.hasAttribute('data-no-sw')){
  window.addEventListener('load', function(){
    // the distributor portal has its own, more specific worker (/distributor/sw.js)
    var url = /\/distributor\//.test(location.pathname) ? null : BASE + 'sw.js';
    if(url) navigator.serviceWorker.register(url, { updateViaCache: 'none' }).catch(function(){ });
  });
}
})();
