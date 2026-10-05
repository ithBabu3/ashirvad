(function(){
"use strict";
/* ☁ Storage adapter: when Firebase is configured (js/firebase-config.js) window.acStorage is a
   drop-in replacement for localStorage that syncs shared data with Firestore. If it is absent
   the app simply keeps using the browser's own localStorage, exactly as before. */
var localStorage = window.acStorage || window.localStorage;
var CLOUD = window.AC_CLOUD && window.AC_CLOUD.enabled ? window.AC_CLOUD : null;

/* ================= i18n ================= */
var STRINGS = {
  en: {
    "auth.tagline":"Dealer B2B ordering portal",
    "auth.login":"Login",
    "auth.register":"Register",
    "auth.gst":"GST Number",
    "auth.loginPhone":"Phone Number",
    "auth.password":"Password",
    "auth.confirmPassword":"Confirm Password",
    "auth.loginBtn":"Login",
    "auth.noAccount":"New dealer account?",
    "auth.haveAccount":"Already registered?",
    "auth.businessName":"Business Name",
    "auth.phone":"Phone Number",
    "auth.address":"Business Address",
    "auth.registerBtn":"Create account",
    "auth.demoNote":"Demo mode — accounts are stored on this device only, for evaluation purposes.",
    "auth.err.gstRequired":"Enter your GST number.",
    "auth.err.notFound":"No account found for this GST number.",
    "auth.err.wrongPassword":"Incorrect password.",
    "auth.err.fillAll":"Please fill all fields.",
    "auth.err.gstExists":"An account with this GST number already exists.",
    "auth.err.passwordMismatch":"Passwords do not match.",
    "auth.err.phoneInvalid":"Enter a valid 10-digit phone number.",
    "util.disclaimer":"Independently operated by an Ashirvad-affiliated dealer. Not an official Ashirvad website.",
    "util.tagline":"Dealer B2B Ordering Portal",
    "nav.home":"Home",
    "nav.categories":"Categories",
    "nav.cart":"Cart",
    "nav.calculator":"Bore Calculator",
    "nav.calculatorShort":"Calc",
    "nav.orders":"Orders",
    "nav.account":"Account",
    "home.searchPlaceholder":"Search pipes, fittings, size, part no…",
    "home.welcome":"Welcome back",
    "home.shopByCategory":"Shop by category",
    "home.allProducts":"All products",
    "home.recentlyViewed":"Recently Viewed",
    "home.searchResults":"Search results",
    "home.noResults":"No products matched your search",
    "home.tryDifferent":"Try a different size, name or category.",
    "home.loadMore":"Load {n} more",
    "home.newArrivals":"New Arrivals",
    "sort.default":"Sort: Default",
    "sort.nameAsc":"Name (A-Z)",
    "sort.priceAsc":"Price: Low to High",
    "sort.priceDesc":"Price: High to Low",
    "sort.hideOos":"Hide out of stock",
    "cat.agri":"Agri Pipes",
    "cat.casing":"Casing Pipes",
    "cat.column":"Column Pipes",
    "cat.all":"All",
    "catalog.allSubs":"All",
    "catalog.noCards":"No items published here yet.",
    "catalog.options":"option(s)",
    "catalog.from":"From",
    "catalog.viewSizes":"View sizes",
    "catalog.allOptions":"All",
    "catalog.photos":"photos",
    "catalog.sizes":"sizes",
    "catalog.allPrefix":"All",
    "catalog.searchPlaceholder":"Search size or item code…",
    "catalog.itemCode":"Item code:",
    "catalog.priceLabel":"Price",
    "catalog.gstLabel":"GST",
    "catalog.noOptions":"No items match that combination.",
    "product.mrp":"MRP",
    "product.inclGst":"incl. GST",
    "product.add":"Add",
    "product.off":"OFF",
    "product.outOfStock":"Out of stock",
    "product.lowStock":"Only {n} left",
    "product.notifyMe":"Notify me",
    "product.notified":"We'll notify you",
    "toast.notifyRequested":"We'll notify you when this is back in stock.",
    "toast.backInStock":"🎉 Back in stock:",
    "bulk.title":"Bulk order",
    "bulk.done":"Bulk order file processed",
    "cart.title":"Your Cart",
    "cart.empty.title":"Your cart is empty",
    "cart.empty.sub":"Add products from the catalogue to place an order.",
    "cart.continueShopping":"Continue shopping",
    "cart.subtotal":"Subtotal",
    "cart.gst":"GST (included)",
    "cart.total":"Total payable",
    "cart.placeOrder":"Place order",
    "cart.accountBlocked":"Your account is currently inactive, so orders can't be placed. Please contact support.",
    "cart.remove":"Remove",
    "orders.title":"Order History",
    "orders.searchPlaceholder":"Search order ID, product name...",
    "orders.filter.all":"All",
    "orders.clearFilters":"Clear",
    "orders.noMatch.title":"No orders match",
    "orders.noMatch.sub":"Try a different search or filter.",
    "orders.empty.title":"No orders yet",
    "orders.empty.sub":"Orders you place will show up here.",
    "orders.orderNo":"Order",
    "orders.items":"items",
    "orders.total":"Total",
    "orders.status.placed":"Placed",
    "orders.status.confirmed":"Confirmed",
    "orders.status.dispatched":"Dispatched",
    "orders.status.delivered":"Delivered",
    "orders.status.cancelled":"Cancelled",
    "orders.discount.flat":"Special discount",
    "orders.discount.pct":"Special discount",
    "orders.discount.reason":"Reason",
    "orders.subtotal":"Order value",
    "orders.payable":"Amount payable",
    "orders.invoice":"Invoice",
    "orders.newDiscount":"🎁 A special discount was applied to this order!",
    "toast.newDiscount":"You have a new discount on an order!",
    "offer.title":"Offer Zone",
    "account.title":"My Account",
    "account.business":"Business Name",
    "account.gst":"GST Number",
    "account.phone":"Phone",
    "account.address":"Address",
    "account.logout":"Log out",
    "account.addresses":"Saved Delivery Addresses",
    "account.myBusinesses":"My Businesses",
    "account.current":"Current",
    "account.switchTo":"Switch",
    "account.addBusiness":"+ Add another business",
    "account.allBusinessOrders":"View orders across all businesses",
    "account.addAddress":"+ Add address",
    "account.makePrimary":"Make primary",
    "account.remove":"Remove",
    "account.wishlist":"My Wishlist",
    "account.announcements":"Announcements",
    "account.noAnnouncements":"No announcements yet.",
    "account.support":"Contact Support",
    "account.faq":"FAQ & Delivery Policy",
    "account.priceList":"Download my price list",
    "wishlist.title":"My Wishlist",
    "wishlist.empty.title":"Your wishlist is empty",
    "wishlist.empty.sub":"Tap the ♡ on any product to save it here.",
    "cart.deliverTo":"Deliver to",
    "cart.freeDeliveryUnlocked":"🎉 You've unlocked free delivery!",
    "cart.addMoreForFree":"Add {n} more for free delivery",
    "cart.deliveryCharge":"Delivery charge",
    "calc.title":"Bore / Casing Requirement Calculator",
    "calc.intro":"Tell us your bore depth and purpose — we'll work out the pipes and fittings you need.",
    "calc.purposeType":"Application / Purpose",
    "calc.selectPurpose":"Select purpose…",
    "calc.depth":"Bore Depth",
    "calc.unitFt":"ft",
    "calc.unitM":"m",
    "calc.diameter":"Bore Diameter (inches, optional)",
    "calc.calculate":"Calculate",
    "calc.noMatch.title":"No matching setup found",
    "calc.noMatch.sub":"We couldn't match this exactly — contact us and we'll help you work out the right equipment list.",
    "calc.contactUs":"Contact us",
    "calc.resultsTitle":"Recommended equipment",
    "calc.addAllToCart":"Add all to cart",
    "calc.grandTotal":"Estimated total",
    "calc.qty":"Qty",
    "calc.noRules":"The calculator isn't set up yet — please check back soon or contact us.",
    "orders.cancel":"Cancel order",
    "orders.reorder":"Reorder",
    "orders.reorderAdded":"Added to cart",
    "orders.reorderSkipped":"unavailable, skipped",
    "orders.share":"Share",
    "toast.added":"Added to cart",
    "toast.removed":"Removed from cart",
    "toast.orderPlaced":"Order placed successfully",
    "toast.loggedIn":"Logged in successfully",
    "toast.registered":"Account created — you're logged in",
    "toast.loggedOut":"Logged out",
    "toast.wishAdded":"Added to wishlist",
    "toast.wishRemoved":"Removed from wishlist",
    "toast.orderCancelled":"Order cancelled",
    "toast.addressAdded":"Address saved",
    "toast.addressRemoved":"Address removed",
    "toast.calcAdded":"Equipment list added to cart"
  }
};

// Tamil UI translation and the language toggle were removed (English only now); STRINGS keeps
// its {en:{...}} shape and t() its same signature so no call site anywhere else had to change.
function t(key){
  return STRINGS.en[key] || key;
}

function applyBranding(){
  var mark = document.getElementById('appBrandMark');
  if(mark && SETTINGS.logoUrl){
    mark.innerHTML = '<img src="'+SETTINGS.logoUrl.replace(/"/g,'&quot;')+'" alt="logo" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.parentElement.innerHTML=\'\';">';
  }
  renderAppFooter();
}
function renderAppFooter(){
  var el = document.getElementById('acFooter');
  if(!el) return;
  var s = SETTINGS;
  var waNumber = (s.whatsappNumber || s.shopPhone || '').replace(/[^0-9]/g,'');
  var logoHtml = s.logoUrl
    ? '<img src="'+esc(s.logoUrl)+'" alt="logo" onerror="this.parentElement.innerHTML=\'\';">'
    : '<span style="font-size:18px;">🏭</span>';
  el.innerHTML =
    '<div class="ac-footer-inner">' +
      '<div class="ac-footer-brand">' +
        '<div class="ac-footer-logo">'+logoHtml+'</div>' +
        '<div>' +
          '<div class="ac-footer-name">'+esc(s.shopName)+'</div>' +
          '<div class="ac-footer-tagline">Dealer B2B Ordering Portal</div>' +
        '</div>' +
      '</div>' +
      '<div class="ac-footer-col">' +
        '<div class="ac-footer-col-title">Contact us</div>' +
        (s.shopPhone ? '<div class="ac-footer-row"><span class="fi">📞</span><a href="tel:'+esc(s.shopPhone)+'">'+esc(s.shopPhone)+'</a></div>' : '') +
        (waNumber ? '<div class="ac-footer-row"><span class="fi">💬</span><a href="https://wa.me/91'+esc(waNumber)+'" target="_blank">WhatsApp us</a></div>' : '') +
        (s.supportEmail ? '<div class="ac-footer-row"><span class="fi">✉️</span><a href="mailto:'+esc(s.supportEmail)+'">'+esc(s.supportEmail)+'</a></div>' : '') +
      '</div>' +
      '<div class="ac-footer-col">' +
        '<div class="ac-footer-col-title">Business details</div>' +
        (s.shopAddress ? '<div class="ac-footer-row"><span class="fi">📍</span><span>'+esc(s.shopAddress)+'</span></div>' : '') +
        (s.shopGstin ? '<div class="ac-footer-row"><span class="fi">🧾</span><span>GSTIN: '+esc(s.shopGstin)+'</span></div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="ac-footer-bottom">' +
      'Independently operated by an Ashirvad-affiliated dealer. Not an official Ashirvad website.<br>' +
      '© '+new Date().getFullYear()+' '+esc(s.shopName)+'. All rights reserved.' +
    '</div>';
}
function applyI18n(){
  document.documentElement.lang = 'en';
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
}

/* ================= Category icons (inline SVG, per category) ================= */
var CATEGORY_ICONS = {
  agri:   '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="14" width="22" height="12" rx="2" stroke="#e6c878" stroke-width="2"/><path d="M9 20h22" stroke="#e6c878" stroke-width="1.4"/></svg>',
  casing: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="11" stroke="#e6c878" stroke-width="2"/><circle cx="20" cy="20" r="5" stroke="#e6c878" stroke-width="1.6"/><path d="M9 20h4M27 20h4" stroke="#e6c878" stroke-width="1.4"/></svg>',
  column: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="6" width="10" height="28" rx="2" stroke="#e6c878" stroke-width="2"/><path d="M15 14h10M15 22h10" stroke="#e6c878" stroke-width="1.4"/></svg>'
};

var CATEGORY_META = {
  agri:   { key:'agri', labelKey:'cat.agri' },
  casing: { key:'casing', labelKey:'cat.casing' },
  column: { key:'column', labelKey:'cat.column' }
};
/* Agri & Casing now live in the dynamic catalog (CATALOG_CATEGORIES) — they're no longer part of the
   old fixed customer grid. CATEGORY_META keeps their labels so legacy lookups (reports, price list,
   search hay) never break on a product whose cat is still 'agri'/'casing'. */
var CATEGORY_ORDER = ['column'];
var ADMIN_CATEGORY_ORDER = ['agri','casing','column']; // admin report filter still spans all three

/* ================= Product catalogue (seed data) ================= */
var LOW_STOCK_THRESHOLD = 10;
/* Only a few SAMPLE items ship with the app so the screens are not empty on first run.
   Add your real products from Admin → Products & Pricing / Catalog, then delete these. */
var SEED_PRODUCTS = [
  { id:1, cat:'column', name:'Sample Column Pipe 75mm',   size:'2½" · Std class',      part:'SAMPLE-001', mrp:857,  discountPct:34, gstPct:18, active:true, stock:60 },
  { id:2, cat:'column', name:'Sample Column Pipe 63mm',   size:'2" · Heavy class',     part:'SAMPLE-002', mrp:1504, discountPct:34, gstPct:18, active:true, stock:0 },
  { id:3, cat:'column', name:'Sample Column Adaptor 50mm',size:'50mm / 2" bottom fit', part:'SAMPLE-003', mrp:721,  discountPct:34, gstPct:18, active:true, stock:90 },
  { id:4, cat:'column', name:'Sample Column Coupler 63mm',size:'63mm / 2"',            part:'SAMPLE-004', mrp:271,  discountPct:34, gstPct:18, active:true, stock:33 }
];

function loadProducts(){
  try{
    var stored = JSON.parse(localStorage.getItem('ac_products') || 'null');
    if(stored && Array.isArray(stored)){
      stored.forEach(function(p){ if(p.stock === undefined || p.stock === null) p.stock = 50; });
      return stored;
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(SEED_PRODUCTS));
}
/* ---- Availability shown to dealers: the company's own stock PLUS whatever distributors hold. ----
   Items with no stock figure (unlimited) stay unlimited. stock_totals/<productId> = { by: { <distributorId>: qty } } is
   kept up to date by the distributor portal (atomically with every stock change) and reconciled by the admin console. */
var _dsRaw = null, _dsMap = {};
function distStockOf(pid){
  var raw = null; try{ raw = localStorage.getItem('ac_stock_totals'); }catch(e){}
  if(raw !== _dsRaw){
    _dsRaw = raw; _dsMap = {};
    try{ (JSON.parse(raw || '[]') || []).forEach(function(t){ var s = 0, by = (t && t.by) || {}; Object.keys(by).forEach(function(k){ var n = Number(by[k]); if(isFinite(n) && n > 0) s += n; }); _dsMap[String(t.id)] = s; }); }catch(e){}
  }
  return _dsMap[String(pid)] || 0;
}
function effStock(p){
  if(!p || p.stock === undefined || p.stock === null || p.stock === Infinity) return Infinity;
  return (Number(p.stock) || 0) + distStockOf(p.id);
}
function saveProducts(list){ localStorage.setItem('ac_products', JSON.stringify(list)); PRODUCTS = list; try{ if(window.__acCatalogChanged) window.__acCatalogChanged(); }catch(e){} }
var PRODUCTS = loadProducts();
function activeProducts(){ return PRODUCTS.filter(function(p){ return p.active !== false; }); }
/* Products shown in the OLD fixed Home / Categories grids: excludes anything owned by a dynamic card. */
function browseProducts(){ return activeProducts().filter(function(p){ return !p.isCatalogVariant; }); }
function nextProductId(){
  /* ids >= 900000 belong to catalog-card items (SPEC_VARIANT_ID_BASE) — never hand those out */
  return PRODUCTS.reduce(function(m,p){ return (p.id < 900000) ? Math.max(m,p.id) : m; }, 0) + 1;
}

/* ================= Dynamic Catalog: Categories / Sub-categories / Spec-Group Cards =================
   This is an ADDITIVE system layered alongside the original flat PRODUCTS catalogue above.
   It powers the new admin "Products & Pricing → New card" builder and its customer-facing
   category/sub-category card display. It does not touch PRODUCTS, cart, pricing, or orders. */
var SEED_CATALOG_CATEGORIES = [
  { id:'column', name:'Column Pipes' }
];
var SEED_CATALOG_SUBCATEGORIES = [
  { id:'col-pipe',     categoryId:'column', name:'Column Pipe' },
  { id:'col-adaptors', categoryId:'column', name:'Adaptors' }
];
function loadCatalogCategories(){
  try{
    var s = JSON.parse(localStorage.getItem('ac_catalog_categories') || 'null');
    if(Array.isArray(s)){
      // One-time cleanup: an earlier build seeded 'agri'/'casing' as empty duplicate dynamic
      // categories (confusingly identical to the fixed catalog's own chips). Drop them here
      // if a browser already has that stale seed persisted, unless the admin has since
      // actually published real cards under those ids (in which case leave them alone).
      var cardsRaw = null;
      try{ cardsRaw = JSON.parse(localStorage.getItem('ac_spec_groups') || '[]'); } catch(e2){ cardsRaw = []; }
      var usedIds = {};
      (cardsRaw||[]).forEach(function(g){ usedIds[g.categoryId] = true; });
      // Once the Agri/Casing migration has run, 'agri'/'casing' are legitimate categories — never prune them.
      var migratedFlag = localStorage.getItem('ac_agri_casing_migrated') === '1';
      var cleaned = migratedFlag ? s : s.filter(function(c){ return !(['agri','casing'].indexOf(c.id) !== -1 && !usedIds[c.id]); });
      if(cleaned.length !== s.length){ localStorage.setItem('ac_catalog_categories', JSON.stringify(cleaned)); }
      return cleaned;
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(SEED_CATALOG_CATEGORIES));
}
function saveCatalogCategories(list){ localStorage.setItem('ac_catalog_categories', JSON.stringify(list)); CATALOG_CATEGORIES = list; }
var CATALOG_CATEGORIES = loadCatalogCategories();
function nextCatalogCategoryId(name){
  var base = String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'category';
  var id = base, n = 1;
  while(CATALOG_CATEGORIES.some(function(c){ return c.id === id; })){ id = base + '-' + (++n); }
  return id;
}

function loadCatalogSubcategories(){
  try{ var s = JSON.parse(localStorage.getItem('ac_catalog_subcategories') || 'null'); if(Array.isArray(s)) return s; } catch(e){}
  return JSON.parse(JSON.stringify(SEED_CATALOG_SUBCATEGORIES));
}
function saveCatalogSubcategories(list){ localStorage.setItem('ac_catalog_subcategories', JSON.stringify(list)); CATALOG_SUBCATEGORIES = list; }
var CATALOG_SUBCATEGORIES = loadCatalogSubcategories();
function nextCatalogSubcategoryId(name){
  var base = String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'subcategory';
  var id = base, n = 1;
  while(CATALOG_SUBCATEGORIES.some(function(c){ return c.id === id; })){ id = base + '-' + (++n); }
  return id;
}
function subcategoriesForCategory(categoryId){
  return CATALOG_SUBCATEGORIES.filter(function(s){ return s.categoryId === categoryId; });
}

function loadSpecGroups(){
  try{ var s = JSON.parse(localStorage.getItem('ac_spec_groups') || 'null'); if(Array.isArray(s)) return s; } catch(e){}
  return [];
}
function saveSpecGroups(list){ localStorage.setItem('ac_spec_groups', JSON.stringify(list)); SPEC_GROUPS = list; syncSpecVariantProducts(); try{ if(window.__acCatalogChanged) window.__acCatalogChanged(); }catch(e){} }
var SPEC_GROUPS = loadSpecGroups();

/* Sync every spec-group variant into PRODUCTS as a hidden, additive synthetic entry so the
   EXISTING cart/pricing/order pipeline (addToCart, renderCartPanel, placeOrder, finalPrice)
   works for these items with zero changes to that pipeline. active:false keeps them out of
   the old fixed-catalog Home/Categories grid (activeProducts() filters on active !== false);
   they're only ever added to PRODUCTS[] which cart/order code looks up directly by id. */
var SPEC_VARIANT_ID_BASE = 900000;
function specVariantProductId(groupId, variantId){ return SPEC_VARIANT_ID_BASE + (Number(groupId)*10000) + Number(variantId); }
function syncSpecVariantProducts(){
  PRODUCTS = PRODUCTS.filter(function(p){ return !p.isCatalogVariant; });
  // Defensive: a card missing `fields` or a variant missing `values` (corrupted data, an old
  // import, manual localStorage editing) used to throw here and crash the WHOLE app on load —
  // every screen, not just the catalog — because this runs once at startup with nothing to
  // catch it. One bad card must never be able to do that; skip what's missing instead.
  SPEC_GROUPS.forEach(function(g){
    var headlineField = (g.fields || [])[0];
    (g.variants||[]).forEach(function(v){
      var vals = v.values || {};
      var headline = headlineField ? (vals[headlineField.id] || g.title) : g.title;
      // Migrated (ex-flat-catalog) variants carry v.pid = their ORIGINAL product id, so cart lines,
      // orders, dealer price overrides, stock-notify requests and calculator rules keep resolving.
      var hasPid = v.pid !== undefined && v.pid !== null && v.pid !== '';
      var hasStock = v.stock !== undefined && v.stock !== null && v.stock !== '';
      var prod = {
        id: hasPid ? Number(v.pid) : specVariantProductId(g.id, v.id),
        name: g.title + ' — ' + headline,
        size: headline,
        part: v.part ? v.part : 'SG'+g.id+'-V'+v.id,
        mrp: Number(v.mrp) || 0,
        discountPct: Number(v.discountPct) || 0,
        gstPct: Number(v.gstPct) || 0,
        cat: v.legacyCat || 'catalog',
        active: hasPid,   // hasPid → stays "active" for calculator / quick-order / price list; grids skip it via browseProducts()
        isCatalogVariant: true,
        specGroupId: g.id,
        variantId: v.id,
        stock: hasStock ? Number(v.stock) : Infinity,
        images: g.images || []
      };
      if(v.bulkTiers && v.bulkTiers.length) prod.bulkTiers = v.bulkTiers;
      if(v.specs && v.specs.length) prod.specs = v.specs;
      PRODUCTS.push(prod);
    });
  });
}
syncSpecVariantProducts();
function nextSpecGroupId(){ return SPEC_GROUPS.reduce(function(m,g){ return Math.max(m,g.id); },0) + 1; }
function specGroupsFor(categoryId, subCategoryId){
  return SPEC_GROUPS.filter(function(g){
    if(g.categoryId !== categoryId) return false;
    if(subCategoryId && g.subCategoryId !== subCategoryId) return false;
    return true;
  });
}

/* ---- Duplicate-card guard / merge helpers ---- */
function specGroupKey(g){
  return [g.categoryId||'', g.subCategoryId||'', String(g.title||'').trim().toLowerCase()].join('||');
}
/* Merge src's fields + variants into target (mutates target). Fields are matched by label
   (case-insensitive) or, if unlabeled, by identical id; unmatched fields are appended.
   Variant ids are preserved when free, otherwise reassigned so ids stay unique. */
function mergeSpecGroupInto(target, src){
  target.fields = target.fields || []; target.variants = target.variants || [];
  var norm = function(x){ return String(x||'').trim().toLowerCase(); };
  var fmap = {};
  (src.fields||[]).forEach(function(sf){
    var lbl = norm(sf.label);
    var tf = target.fields.find(function(f){ return lbl ? norm(f.label) === lbl : (!norm(f.label) && f.id === sf.id); });
    if(!tf){
      var n = target.fields.reduce(function(m,f){ return Math.max(m, Number(String(f.id).replace('f',''))||0); },0) + 1;
      tf = { id:'f'+n, label:sf.label, isFilter:!!sf.isFilter };
      target.fields.push(tf);
    }
    fmap[sf.id] = tf.id;
  });
  var used = {}; var maxId = 0;
  target.variants.forEach(function(v){ used[v.id] = true; maxId = Math.max(maxId, Number(v.id)||0); });
  (src.variants||[]).forEach(function(v){
    var id = (v.id !== undefined && !used[v.id]) ? v.id : ++maxId;
    used[id] = true; maxId = Math.max(maxId, Number(id)||0);
    var values = {};
    Object.keys(v.values||{}).forEach(function(k){ if(fmap[k]) values[fmap[k]] = v.values[k]; });
    var nv = JSON.parse(JSON.stringify(v));   // keeps pid / part / discountPct / stock / bulkTiers etc.
    nv.id = id; nv.values = values;
    target.variants.push(nv);
  });
  if(!target.description && src.description) target.description = src.description;
  var imgs = (target.images||[]).slice();
  (src.images||[]).forEach(function(u){ if(imgs.indexOf(u) < 0) imgs.push(u); });
  target.images = imgs;
  return target;
}
/* Returns { list, merged:[titles] } — duplicates (same category/sub-category/title) are folded
   into the earliest-id group; later ones are dropped. Pure: does not persist. */
function mergeDuplicateSpecGroups(groups){
  var sorted = JSON.parse(JSON.stringify(groups)).sort(function(a,b){ return a.id - b.id; });
  var byKey = {}, out = [], merged = [];
  sorted.forEach(function(g){
    if(!String(g.title||'').trim()){ out.push(g); return; }
    var k = specGroupKey(g);
    if(byKey[k]){ mergeSpecGroupInto(byKey[k], g); merged.push(byKey[k].title); }
    else { byKey[k] = g; out.push(g); }
  });
  return { list:out, merged:merged };
}
/* One-time repair of duplicates created by the old "+ New card for every item" flow. */
function repairDuplicateSpecGroups(){
  try{
    if(localStorage.getItem('ac_dup_repair_done') === '1') return;
    var res = mergeDuplicateSpecGroups(SPEC_GROUPS);
    if(res.merged.length){
      saveSpecGroups(res.list);
      res.merged.forEach(function(t){ logAudit('Catalog cards merged', t); });
    }
    localStorage.setItem('ac_dup_repair_done', '1');
  } catch(e){ console.error('Duplicate card repair failed', e); }
}
/* Runs after repair (and after each save): surfaces any remaining exact-title duplicates. */
function warnDuplicateSpecGroups(){
  var seen = {}, dups = [];
  SPEC_GROUPS.forEach(function(g){
    if(!String(g.title||'').trim()) return;
    var k = specGroupKey(g);
    if(seen[k] && dups.indexOf(g.title) < 0) dups.push(g.title);
    seen[k] = true;
  });
  if(dups.length){
    console.warn('[AshirvadConnect] Duplicate catalog cards in the same category/sub-category: ' + dups.join(', '));
    if(adminSession) showToast('⚠ Duplicate catalog cards: ' + dups.join(', ') + ' — open one card and add items there.');
  }
  return dups;
}

/* ---- One-time migration: Agri & Casing flat products → single-item spec-group cards ---- */
var AGRI_CASING_MIGRATION_SUBS = [
  { id:'agri-isi',      categoryId:'agri',   name:'ISI' },
  { id:'agri-iso',      categoryId:'agri',   name:'ISO' },
  { id:'agri-fittings', categoryId:'agri',   name:'Fittings' },
  { id:'casing-blue',   categoryId:'casing', name:'Blue Casing' },
  { id:'casing-white',  categoryId:'casing', name:'White Casing' },
  { id:'casing-solfit', categoryId:'casing', name:'Blue Solfit' }
];
function migrateAgriCasingToCatalog(){
  try{
    if(localStorage.getItem('ac_agri_casing_migrated') === '1') return;
    // Fresh install / no legacy Agri or Casing products: nothing to migrate, so don't invent categories.
    if(!PRODUCTS.some(function(p){ return !p.isCatalogVariant && (p.cat === 'agri' || p.cat === 'casing'); })){
      localStorage.setItem('ac_agri_casing_migrated', '1');
      return;
    }

    // 1. categories + sub-categories (agri/casing first, preserving the old Agri → Casing → Column order)
    var addCats = [];
    [['agri','Agri Pipes'],['casing','Casing Pipes']].forEach(function(pair){
      if(!CATALOG_CATEGORIES.some(function(c){ return c.id === pair[0]; })) addCats.push({ id:pair[0], name:pair[1] });
    });
    if(addCats.length) saveCatalogCategories(addCats.concat(CATALOG_CATEGORIES));
    var addSubs = AGRI_CASING_MIGRATION_SUBS.filter(function(sc){
      return !CATALOG_SUBCATEGORIES.some(function(x){ return x.id === sc.id; });
    });
    if(addSubs.length) saveCatalogSubcategories(CATALOG_SUBCATEGORIES.concat(addSubs));

    // 2. one single-item card per ACTIVE flat product (hidden ones stay untouched — nothing new gets published)
    var alreadyPids = {};
    SPEC_GROUPS.forEach(function(g){ (g.variants||[]).forEach(function(v){ if(v.pid !== undefined && v.pid !== null) alreadyPids[v.pid] = true; }); });
    var sources = PRODUCTS.filter(function(p){
      return !p.isCatalogVariant && (p.cat === 'agri' || p.cat === 'casing') && !alreadyPids[p.id];
    });
    var toMigrate = sources.filter(function(p){ return p.active !== false; });
    var skippedHidden = sources.length - toMigrate.length;
    var list = JSON.parse(JSON.stringify(SPEC_GROUPS));
    var nextId = list.reduce(function(m,g){ return Math.max(m, g.id); }, 0);
    toMigrate.forEach(function(p){
      var variant = {
        id: 1, pid: p.id, legacyCat: p.cat,
        values: { f1: p.size || p.part || '' },
        part: p.part,
        mrp: Number(p.mrp) || 0,
        discountPct: Number(p.discountPct) || 0,
        gstPct: Number(p.gstPct) || 0,
        stock: (p.stock === undefined || p.stock === null) ? undefined : Number(p.stock)
      };
      if(p.bulkTiers && p.bulkTiers.length) variant.bulkTiers = JSON.parse(JSON.stringify(p.bulkTiers));
      if(p.specs && p.specs.length) variant.specs = JSON.parse(JSON.stringify(p.specs));
      list.push({
        id: ++nextId, categoryId: p.cat, subCategoryId: '',
        title: p.name, description: p.description || '',
        images: (p.images || []).slice(),
        fields: [{ id:'f1', label:'Size', isFilter:false }],
        variants: [variant],
        migrated: true
      });
    });
    if(toMigrate.length){
      saveSpecGroups(list);   // sync adds each variant as a product with the ORIGINAL id
      // drop the original flat records (same ids now owned by the cards) so nothing shows/duplicates twice
      var moved = {}; toMigrate.forEach(function(p){ moved[p.id] = true; });
      saveProducts(PRODUCTS.filter(function(p){ return p.isCatalogVariant || !moved[p.id]; }));
      logAudit('Catalog migration', toMigrate.length + ' Agri/Casing product(s) migrated into single-item catalog cards'+(skippedHidden ? ' ('+skippedHidden+' hidden product(s) left as-is)' : ''));
      localStorage.setItem('ac_migration_notice', JSON.stringify({ count:toMigrate.length, skippedHidden:skippedHidden }));
    }
    localStorage.setItem('ac_agri_casing_migrated', '1');
  } catch(e){ console.error('Agri/Casing migration failed — will retry on next load', e); }
}
function getMigrationNotice(){
  try{ return JSON.parse(localStorage.getItem('ac_migration_notice') || 'null'); } catch(e){ return null; }
}

/* ================= Bore/Casing requirement calculator rules ================= */
var SEED_CALC_RULES = [
  { id:1, label:'Sample borewell rule (edit or delete)', purposeType:'Agriculture Borewell', minDepth:0, maxDepth:150, diameter:null,
    equipment:[
      { productId:1, mode:'perDepth', pipeLengthPerUnit:20 },
      { productId:4, mode:'fixed', qty:2 }
    ] }
];
function loadCalcRules(){
  try{ var s = JSON.parse(localStorage.getItem('ac_calc_rules') || 'null'); if(Array.isArray(s)) return s; } catch(e){}
  return JSON.parse(JSON.stringify(SEED_CALC_RULES));
}
function saveCalcRules(list){ localStorage.setItem('ac_calc_rules', JSON.stringify(list)); CALC_RULES = list; }
var CALC_RULES = loadCalcRules();
function nextCalcRuleId(){ return CALC_RULES.reduce(function(m,r){ return Math.max(m,r.id); },0) + 1; }
function calcPurposeTypes(){
  var set = {};
  CALC_RULES.forEach(function(r){ if(r.purposeType) set[r.purposeType] = true; });
  return Object.keys(set);
}
function matchCalcRules(purposeType, depthFeet, diameter){
  return CALC_RULES.filter(function(r){
    if(purposeType && r.purposeType !== purposeType) return false;
    if(depthFeet < Number(r.minDepth) || depthFeet > Number(r.maxDepth)) return false;
    if(r.diameter && diameter && Number(r.diameter) !== Number(diameter)) return false;
    return true;
  });
}
function computeRuleEquipment(rule, depthFeet, gst){
  return rule.equipment.map(function(line){
    var p = PRODUCTS.find(function(pp){ return pp.id === line.productId && pp.active !== false; });
    if(!p) return null;
    var qty = line.mode === 'fixed'
      ? Math.max(1, Number(line.qty)||1)
      : Math.max(1, Math.ceil(depthFeet / (Number(line.pipeLengthPerUnit)||1)));
    var price = finalPrice(p, gst, qty);
    return { product:p, qty:qty, price:price, lineTotal: Math.round(price*qty*100)/100 };
  }).filter(Boolean);
}

/* ================= Dealer standing discount + per-item overrides + pricing ================= */
function dealerStandingPct(gst){
  if(!gst) return 0;
  var u = getUsers()[gst];
  return (u && Number(u.standingDiscountPct)) || 0;
}
function dealerOverride(gst, productId){
  if(!gst) return null;
  var u = getUsers()[gst];
  if(!u || !u.priceOverrides) return null;
  return u.priceOverrides[productId] || null;
}
/* Plain "no dealer, no qty bonus" price — i.e. exactly what a brand-new dealer with no
   standing discount and no special rate would be charged. Used across the admin screens
   (Products & Pricing row, Pricing Overview) so admin always sees the SAME number they'd
   see if they were a dealer opening the catalog, computed the same way, every time. */
function standardPrice(p){
  return finalPrice(p, '', 1);
}
/* How many dealers currently have a special (override) rate on this product — surfaced next
   to the price so it's obvious at a glance which products have dealer-specific pricing set,
   instead of admin having to open each product's Dealer Pricing panel to find out. */
function overrideCountFor(productId){
  var users = getUsers(), n = 0;
  Object.keys(users).forEach(function(gst){
    var u = users[gst];
    if(u && u.priceOverrides && u.priceOverrides[productId]) n++;
  });
  return n;
}
/* Saves an MRP/Discount%/GST% edit made from Pricing Overview through the exact same
   persistence path every other screen uses — saveProducts() for a regular product, or
   saveSpecGroups() (which re-syncs PRODUCTS afterwards) for a catalog-card variant — so an
   edit here is never a second, parallel copy of the data. Everywhere else that reads PRODUCTS
   (the catalog grid, cart, orders, other admin screens) sees the change immediately. */
function savePricingOverviewProductEdit(productId, mrp, discountPct, gstPct){
  var p = PRODUCTS.find(function(pp){ return pp.id === productId; });
  if(!p){ showToast('Could not find that product'); return; }
  var name = p.name;
  if(p.isCatalogVariant){
    var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; });
    var v = g && (g.variants||[]).find(function(x){ return x.id === p.variantId; });
    if(!g || !v){ showToast('Could not find that catalog card variant'); return; }
    v.mrp = mrp; v.discountPct = discountPct; v.gstPct = gstPct;
    saveSpecGroups(SPEC_GROUPS);
  } else {
    p.mrp = mrp; p.discountPct = discountPct; p.gstPct = gstPct;
    saveProducts(PRODUCTS);
  }
  logAudit('Pricing updated (Pricing Overview)', name+' — MRP '+money(mrp)+', '+discountPct+'% off, GST '+gstPct+'%');
  showToast('Saved — '+name+' updated');
  renderPricingOverview();
}
function bulkTierBonus(p, qty){
  qty = Number(qty)||1;
  if(!p.bulkTiers || !p.bulkTiers.length) return 0;
  var bonus = 0;
  p.bulkTiers.forEach(function(tier){ if(qty >= Number(tier.minQty)) bonus = Math.max(bonus, Number(tier.bonusPct)||0); });
  return bonus;
}
function resolvePricing(p, gst, qty){
  qty = Number(qty)||1;
  var override = dealerOverride(gst, p.id);
  if(override && override.type === 'net'){
    var withGstNet = Number(override.value) * (1 + p.gstPct/100);
    return { finalPriceWithGst: Math.round(withGstNet*100)/100, basePct:null, bulkBonusPct:0, totalPct:null, usedOverride:true, overrideIsNet:true };
  }
  var basePct, usedOverride = false;
  if(override && override.type === 'discount'){
    basePct = Number(override.value)||0;
    usedOverride = true;
  } else {
    basePct = (Number(p.discountPct)||0) + dealerStandingPct(gst);
  }
  var bulkBonus = bulkTierBonus(p, qty);
  var totalPct = Math.min(95, basePct + bulkBonus);
  var afterDiscount = p.mrp * (1 - totalPct/100);
  var withGst = afterDiscount * (1 + p.gstPct/100);
  return { finalPriceWithGst: Math.round(withGst*100)/100, basePct:basePct, bulkBonusPct:bulkBonus, totalPct:totalPct, usedOverride:usedOverride, overrideIsNet:false };
}
function finalPrice(p, gst, qty){
  return resolvePricing(p, gst, qty).finalPriceWithGst;
}
function priceBreakdownText(p, gst, qty){
  var r = resolvePricing(p, gst, qty);
  if(r.overrideIsNet) return null;
  if(!r.usedOverride && r.bulkBonusPct <= 0) return null;
  var base = r.usedOverride ? ('Your rate '+r.basePct+'%') : (r.basePct+'%');
  if(r.bulkBonusPct > 0) return base + ' + bulk bonus ' + r.bulkBonusPct + '%';
  return r.usedOverride ? base : null;
}
function money(n){
  return '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}
/* Compact Indian-style money for big dashboard/report numbers: ₹12.5 L / ₹3.42 Cr instead of a long
   comma string. Falls back to money() under ₹1 lakh. The full precise value is always available via
   the title="" tooltip wherever this is used, so nothing is lost — just easier to scan at a glance. */
function moneyCompact(n){
  n = Number(n) || 0;
  var sign = n < 0 ? '-' : '';
  var abs = Math.abs(n);
  if(abs >= 1e7) return sign + '₹' + (Math.round((abs/1e7)*100)/100).toLocaleString('en-IN', {maximumFractionDigits:2}) + ' Cr';
  if(abs >= 1e5) return sign + '₹' + (Math.round((abs/1e5)*100)/100).toLocaleString('en-IN', {maximumFractionDigits:2}) + ' L';
  return money(n);
}
/* Wraps moneyCompact() in a span carrying the exact amount as a hover tooltip, for stat tiles. */
function moneyCompactHtml(n){
  return '<span title="'+esc(money(n))+'">'+esc(moneyCompact(n))+'</span>';
}
/* ms -> short human string ("2h 15m", "3d 4h", "5m") for auto-status ETAs etc. */
function humanizeDuration(ms){
  if(ms <= 0) return '0m';
  var mins = Math.round(ms/60000);
  var d = Math.floor(mins/1440); mins -= d*1440;
  var h = Math.floor(mins/60); mins -= h*60;
  if(d > 0) return d+'d '+h+'h';
  if(h > 0) return h+'h '+mins+'m';
  return mins+'m';
}
/* Generic inline SVG donut chart + legend — no external chart library needed (this app is fully
   offline/self-contained). segments: [{label, value, color}]. Used by Reports & Dashboard. */
function svgDonutChart(segments, opts){
  opts = opts || {};
  var size = opts.size || 168;
  var thickness = opts.thickness || 24;
  var r = (size - thickness) / 2;
  var cx = size/2, cy = size/2;
  var circumference = 2 * Math.PI * r;
  var total = segments.reduce(function(s,x){ return s + (Number(x.value)||0); }, 0);
  var paths = '';
  if(total <= 0){
    paths = '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--ivory-100)" stroke-width="'+thickness+'"/>';
  } else {
    var offset = 0;
    segments.forEach(function(seg){
      var val = Number(seg.value) || 0;
      if(val <= 0) return;
      var frac = val / total;
      var dash = frac * circumference;
      var gap = circumference - dash;
      paths += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+esc(seg.color||'#999')+'" stroke-width="'+thickness+'" ' +
        'stroke-dasharray="'+dash.toFixed(2)+' '+gap.toFixed(2)+'" stroke-dashoffset="'+(-offset).toFixed(2)+'" ' +
        'transform="rotate(-90 '+cx+' '+cy+')"><title>'+esc(seg.label)+': '+val+'</title></circle>';
      offset += dash;
    });
  }
  var centerLabel = opts.centerLabel != null ? opts.centerLabel : total;
  var legend = segments.map(function(seg){
    var val = Number(seg.value) || 0;
    var pct = total > 0 ? Math.round((val/total)*1000)/10 : 0;
    return '<div style="display:flex; align-items:center; gap:7px; font-size:12.5px; margin:4px 0;">' +
      '<span style="width:10px; height:10px; border-radius:3px; background:'+esc(seg.color||'#999')+'; display:inline-block; flex-shrink:0;"></span>' +
      '<span style="flex:1; color:var(--ink-900);">'+esc(seg.label)+'</span>' +
      '<span style="font-weight:700;">'+val+'</span>' +
      '<span class="ac-sub" style="min-width:38px; text-align:right;">'+pct+'%</span>' +
    '</div>';
  }).join('');
  return '<div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap;">' +
    '<div style="position:relative; width:'+size+'px; height:'+size+'px; flex-shrink:0;">' +
      '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+paths+'</svg>' +
      (opts.showCenter !== false ? '<div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">' +
        '<div style="font-size:18px; font-weight:800; color:var(--ink-900);">'+esc(String(centerLabel))+'</div>' +
        (opts.centerSub ? '<div class="ac-sub" style="font-size:10px;">'+esc(opts.centerSub)+'</div>' : '') +
      '</div>' : '') +
    '</div>' +
    '<div style="flex:1; min-width:150px;">'+(legend || '<div class="ac-sub">No data yet.</div>')+'</div>' +
  '</div>';
}
function esc(s){
  return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}

/* ================= State ================= */
var currentView = 'home';
var currentCategory = null;   // null = all
var catalogCategoryId = null;    // dynamic "New card" catalog: selected category, mutually exclusive with currentCategory
var catalogSubCategoryId = null; // dynamic catalog: selected sub-category (null = all subs within the category)
var currentSubCategory = null; // scoped to currentCategory, for dynamic catalog cards
var HOME_PAGE_SIZE = 24;      // Home "All products": how many cards to show before "Load more"
var homeVisibleCount = HOME_PAGE_SIZE;
var catalogSortBy = 'default';   // shared by Home & Search: 'default' | 'nameAsc' | 'priceAsc' | 'priceDesc'
var hideOutOfStock = false;      // shared by Home & Search
var custOrderSearch = '';
var CUST_ORDER_UI = { expanded:{} }; // which of the customer's own orders are expanded — collapsed by default, same pattern as the admin Orders tab
var custOrderStatusFilter = 'all';
var searchTerm = '';
var session = localStorage.getItem('ac_session'); // gst of logged in user

function getUsers(){
  try { return JSON.parse(localStorage.getItem('ac_users') || '{}'); } catch(e){ return {}; }
}
function saveUsers(u){ localStorage.setItem('ac_users', JSON.stringify(u)); }

/* ---- Accounts: one login (by phone) can link multiple dealer/business (GST) profiles ---- */
function normalizePhone(phone){ return String(phone||'').replace(/\D/g,''); }
function getAccounts(){
  try { return JSON.parse(localStorage.getItem('ac_accounts') || '{}'); } catch(e){ return {}; }
}
function saveAccounts(a){ localStorage.setItem('ac_accounts', JSON.stringify(a)); }
function findAccountForPhone(phoneRaw){
  var phone = normalizePhone(phoneRaw);
  if(!phone) return null;
  var accounts = getAccounts();
  if(accounts[phone]) return accounts[phone];
  // Legacy fallback: earlier phases stored password per dealer profile with no account layer.
  // Synthesize (and persist) an account the first time such a dealer logs in by phone.
  var users = getUsers();
  var matches = Object.keys(users).filter(function(g){ return normalizePhone(users[g].phone) === phone; });
  if(matches.length){
    var pw = users[matches[0]].password;
    var gsts = matches.filter(function(g){ return users[g].password === pw; });
    var acc = { password:pw, gsts:gsts };
    accounts[phone] = acc;
    saveAccounts(accounts);
    gsts.forEach(function(g){ users[g].accountKey = phone; });
    saveUsers(users);
    return acc;
  }
  return null;
}
function linkGstToAccount(phoneRaw, gst, password){
  var phone = normalizePhone(phoneRaw);
  var accounts = getAccounts();
  if(accounts[phone]){
    if(accounts[phone].gsts.indexOf(gst) === -1) accounts[phone].gsts.push(gst);
  } else {
    accounts[phone] = { password:password, gsts:[gst] };
  }
  saveAccounts(accounts);
  var users = getUsers();
  if(users[gst]){ users[gst].accountKey = phone; saveUsers(users); }
}
function gstsForCurrentAccount(){
  if(!session) return [];
  var users = getUsers();
  var u = users[session];
  var phone = u && u.accountKey ? u.accountKey : (u ? normalizePhone(u.phone) : null);
  if(!phone) return [session];
  var acc = getAccounts()[phone];
  return acc ? acc.gsts : [session];
}

function updateDealerProfile(gst, patch){
  var users = getUsers();
  if(!users[gst]) return false;
  Object.keys(patch).forEach(function(k){ users[gst][k] = patch[k]; });
  saveUsers(users);
  return true;
}
function setDealerOverride(gst, productId, override){
  var users = getUsers();
  if(!users[gst]) return false;
  if(!users[gst].priceOverrides) users[gst].priceOverrides = {};
  users[gst].priceOverrides[productId] = override;
  saveUsers(users);
  return true;
}
function removeDealerOverride(gst, productId){
  var users = getUsers();
  if(!users[gst] || !users[gst].priceOverrides) return false;
  delete users[gst].priceOverrides[productId];
  saveUsers(users);
  return true;
}

function cartKey(){ return 'ac_cart_' + session; }

function getCart(){
  if(!session) return {};
  try { return JSON.parse(localStorage.getItem(cartKey()) || '{}'); } catch(e){ return {}; }
}
function saveCart(c){ localStorage.setItem(cartKey(), JSON.stringify(c)); }

/* ---- Orders: single global store, visible to admin, filtered per-dealer for customers ---- */
function getAllOrders(){
  try { return JSON.parse(localStorage.getItem('ac_orders') || '[]'); } catch(e){ return []; }
}
function saveAllOrders(list){ localStorage.setItem('ac_orders', JSON.stringify(list)); }
function getOrders(){
  if(!session) return [];
  return getAllOrders().filter(function(o){ return o.dealerGst === session; });
}
function saveOrder(order){
  var all = getAllOrders();
  var idx = all.findIndex(function(o){ return o.id === order.id; });
  if(idx >= 0) all[idx] = order; else all.push(order);
  saveAllOrders(all);
}
function findOrder(id){
  return getAllOrders().find(function(o){ return o.id === id; });
}
var STATUS_ORDER = ['placed','confirmed','dispatched','delivered'];
/* Every status-history entry an order has (real ones, plus a synthesized "placed" for orders
   created before this feature existed) — powers both the customer timeline and admin scheduling. */
function orderStatusHistory(o){
  if(o.statusHistory && o.statusHistory.length) return o.statusHistory;
  return [{ status:'placed', at:Number(o.createdAt) || 0 }];
}
/* Single place that changes an order's status: keeps statusHistory (customer timeline) complete. */
function applyOrderStatus(o, status, opts){
  opts = opts || {};
  o.status = status;
  o.statusHistory = orderStatusHistory(o).concat([{ status:status, at:Date.now(), auto:!!opts.auto }]);
  saveOrder(o);
}
/* ---- Per-dealer auto-status rules ----
   Configured once per dealer (or applied to several dealers at once), not per order: e.g. "auto-confirm
   1 day after placed, auto-dispatch 2 days after confirmed, auto-deliver 4 days after dispatched".
   Stored on the dealer's own profile: users[gst].autoStatusRule = { enabled, confirmHours, dispatchHours, deliverHours }.
   A blank/0 hours value means "don't auto-advance past this stage" — admin (or a later stage) does it manually. */
function dealerAutoStatusRule(gst){
  var u = getUsers()[gst];
  return (u && u.autoStatusRule) || null;
}
function setDealerAutoStatusRule(gst, rule){
  var users = getUsers();
  if(!users[gst]) return false;
  users[gst].autoStatusRule = rule;
  saveUsers(users);
  return true;
}
var AUTO_STATUS_STEPS = [
  { from:'placed',     to:'confirmed',  hoursKey:'confirmHours'  },
  { from:'confirmed',  to:'dispatched', hoursKey:'dispatchHours' },
  { from:'dispatched', to:'delivered',  hoursKey:'deliverHours'  }
];
/* Runs on load and periodically: advances every eligible order along its dealer's rule, one or more
   steps per pass (an order left untouched for days can catch up in one go). An order with
   autoStatusOff is skipped entirely — that's the per-order "handle this one manually" exception.
   Client-side only — this fires the next time the app is open at/after the due time; there is no
   server-side cron, so results depend on an admin (or the dealer's own tab) having it open. */
function runScheduledOrderStatusChecks(){
  var all = getAllOrders();
  var now = Date.now();
  var fired = [];
  all.forEach(function(o){
    if(o.autoStatusOff) return;
    if(o.status === 'cancelled' || o.status === 'delivered') return;
    var rule = dealerAutoStatusRule(o.dealerGst);
    if(!rule || rule.enabled === false) return;
    var guard = 0;
    while(guard++ < AUTO_STATUS_STEPS.length){
      var step = AUTO_STATUS_STEPS.filter(function(s){ return s.from === o.status; })[0];
      if(!step) break;
      var hours = Number(rule[step.hoursKey]) || 0;
      if(hours <= 0) break;   // this stage has no auto-advance configured
      var enteredAt = orderStatusHistory(o).filter(function(h){ return h.status === step.from; }).pop();
      var since = enteredAt ? enteredAt.at : Number(o.createdAt) || 0;
      if(now - since < hours * 3600000) break;   // not due yet
      applyOrderStatus(o, step.to, { auto:true });
      fired.push('#'+o.id+' → '+step.to);
    }
  });
  if(fired.length) logAudit('Order auto-status applied', fired.join(', '));
  return fired.length;
}
function nextOrderStatus(s){
  var i = STATUS_ORDER.indexOf(s);
  if(i < 0 || i === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[i+1];
}
function orderDiscountAmount(o){
  if(!o.discount) return 0;
  if(o.discount.type === 'flat') return Math.min(Number(o.discount.value)||0, o.total);
  return Math.round(o.total * ((Number(o.discount.value)||0)/100) * 100) / 100;
}
function orderPayable(o){
  var base = Math.max(0, o.total - orderDiscountAmount(o));
  return Math.round((base + (Number(o.deliveryCharge)||0)) * 100) / 100;
}

/* ================= Admin ================= */
var ADMIN_CREDENTIALS = { username:'admin', password:'ashirvad@123' };
var adminSession = localStorage.getItem('ac_admin_session') === '1';

/* ---- Banners ---- */
var SEED_BANNERS = [
  { id:1, title:'Welcome', subtitle:'Order directly from us at dealer prices', color:'linear-gradient(135deg, var(--navy-900), var(--navy-700))', imageUrl:'', link:'', active:true }
];
function loadBanners(){
  try{
    var s = JSON.parse(localStorage.getItem('ac_banners') || 'null');
    if(s && Array.isArray(s)) return s;
  } catch(e){}
  return JSON.parse(JSON.stringify(SEED_BANNERS));
}
function saveBanners(list){ localStorage.setItem('ac_banners', JSON.stringify(list)); BANNERS = list; }
var BANNERS = loadBanners();
function nextBannerId(){ return BANNERS.reduce(function(m,b){ return Math.max(m,b.id); },0) + 1; }

/* ---- Offer Zone ---- */
var SEED_OFFERS = [
  { id:1, badge:'NEW', title:'Sample offer', desc:'Edit or remove this from Admin → Marketing → Offers.', linkType:'url', linkValue:'', active:true }
];
function loadOffers(){
  try{
    var s = JSON.parse(localStorage.getItem('ac_offers') || 'null');
    if(s && Array.isArray(s)) return s;
  } catch(e){}
  return JSON.parse(JSON.stringify(SEED_OFFERS));
}
function saveOffers(list){ localStorage.setItem('ac_offers', JSON.stringify(list)); OFFERS = list; }
var OFFERS = loadOffers();
function nextOfferId(){ return OFFERS.reduce(function(m,o){ return Math.max(m,o.id); },0) + 1; }

/* ---- Global display settings ---- */
var SETTINGS_DEFAULTS = {
  showBanners:true, showOfferZone:true,
  shopName:'Sri Ashirvad Pipes & Fittings (Independent Dealer)',
  shopGstin:'33AAAAA0000A1Z5',
  shopAddress:'123, Anna Salai, Chennai, Tamil Nadu — 600002',
  shopPhone:'9003482267',
  supportEmail:'support@ashirvadconnect.example',
  freeDeliveryMin:3000,
  deliveryCharge:150,
  logoUrl:'',
  monthTarget:0, monthReward:'',
  upiId:'', upiName:'', payNowOn:true, payLaterOn:true, payNote:'', qrMode:'auto', qrImage:''
};
function loadSettings(){
  try{
    var s = JSON.parse(localStorage.getItem('ac_settings') || 'null');
    if(s) return Object.assign({}, SETTINGS_DEFAULTS, s);
  } catch(e){}
  return Object.assign({}, SETTINGS_DEFAULTS);
}
function saveSettings(s){ localStorage.setItem('ac_settings', JSON.stringify(s)); SETTINGS = s; }
var SETTINGS = loadSettings();

/* ---- Wishlist ---- */
function wishlistKey(){ return 'ac_wishlist_' + session; }
function getWishlist(){
  if(!session) return [];
  try { var l = JSON.parse(localStorage.getItem(wishlistKey()) || '[]'); return Array.isArray(l) ? l : []; } catch(e){ return []; }
}
function saveWishlist(list){ if(session) localStorage.setItem(wishlistKey(), JSON.stringify(list)); }
function isWishlisted(id){ return getWishlist().indexOf(id) !== -1; }
function toggleWishlist(id){
  if(!session) return;
  var list = getWishlist();
  var idx = list.indexOf(id);
  if(idx === -1){ list.push(id); showToast(t('toast.wishAdded')); } else { list.splice(idx,1); showToast(t('toast.wishRemoved')); }
  saveWishlist(list);
  renderProductGrids();
  // renderProductGrids() only refreshes .product-grid (regular products, numeric ids) — a
  // catalog/"New card" item uses a string key ('sg'+id) and lives in .uc-grid instead, so its
  // heart never got the memo: the wishlist WAS saved correctly, the button just kept showing
  // the old ♡ until the customer left the screen and came back. Refresh those hearts too.
  refreshCatalogCardWishButtons();
  if(currentView === 'wishlist') render();
}
function refreshCatalogCardWishButtons(){
  document.querySelectorAll('.uc-grid .product-card[data-sg-id]').forEach(function(cardEl){
    var g = SPEC_GROUPS.find(function(x){ return String(x.id) === cardEl.getAttribute('data-sg-id'); });
    var btn = cardEl.querySelector('.wish-btn');
    if(!g || !btn) return;
    var wished = isWishlisted(specGroupWishKey(g));
    btn.classList.toggle('active', wished);
    btn.textContent = wished ? '♥' : '♡';
  });
}

/* ---- Multiple saved delivery addresses ---- */
function getDealerAddresses(gst){
  var u = getUsers()[gst];
  if(!u) return [];
  if(u.addresses && u.addresses.length) return u.addresses;
  var fallbackText = u.deliveryAddress || u.address || '';
  return fallbackText ? [{ id:1, label:'Primary', text:fallbackText, isPrimary:true }] : [];
}
function addDealerAddress(gst, label, text){
  var users = getUsers();
  var u = users[gst];
  if(!u || !text) return false;
  if(!u.addresses || !u.addresses.length) u.addresses = getDealerAddresses(gst);
  var nextId = u.addresses.reduce(function(m,a){ return Math.max(m,a.id); }, 0) + 1;
  var makeIt = u.addresses.length === 0;
  u.addresses.push({ id:nextId, label:label || ('Address '+nextId), text:text, isPrimary:makeIt });
  saveUsers(users);
  return true;
}
function removeDealerAddress(gst, addrId){
  var users = getUsers();
  var u = users[gst];
  if(!u || !u.addresses) return false;
  var wasPrimary = u.addresses.some(function(a){ return a.id === addrId && a.isPrimary; });
  u.addresses = u.addresses.filter(function(a){ return a.id !== addrId; });
  if(wasPrimary && u.addresses.length) u.addresses[0].isPrimary = true;
  saveUsers(users);
  return true;
}
function setPrimaryAddress(gst, addrId){
  var users = getUsers();
  var u = users[gst];
  if(!u || !u.addresses) return false;
  u.addresses.forEach(function(a){ a.isPrimary = (a.id === addrId); });
  saveUsers(users);
  return true;
}

/* ---- Broadcasts ---- */
function loadBroadcasts(){
  try { var l = JSON.parse(localStorage.getItem('ac_broadcasts') || '[]'); return Array.isArray(l) ? l : []; } catch(e){ return []; }
}
function saveBroadcasts(list){ localStorage.setItem('ac_broadcasts', JSON.stringify(list)); BROADCASTS = list; }
var BROADCASTS = loadBroadcasts();
function sendBroadcast(en){
  BROADCASTS.push({ id:(BROADCASTS.reduce(function(m,b){return Math.max(m,b.id);},0)+1), en:en, ts:Date.now(),
    date:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) });
  saveBroadcasts(BROADCASTS);
}
function checkBroadcastNotifications(){
  if(!session || BROADCASTS.length === 0) return;
  var users = getUsers();
  var u = users[session];
  if(!u) return;
  var lastSeen = Number(u.lastSeenBroadcastId) || 0;
  var latest = BROADCASTS[BROADCASTS.length-1];
  if(latest.id > lastSeen){
    showToast('📢 ' + latest.en);
    updateDealerProfile(session, { lastSeenBroadcastId: latest.id });
  }
}

/* ---- Audit log ---- */
/* The audit trail was removed: it grew without limit and cost Firestore reads / writes on the free plan.
   These stubs keep every existing logAudit(...) call harmless. */
var AUDIT_LOG = [];
function saveAuditLog(){}
function logAudit(){}

/* ---- Formal GST tax invoice ---- */
function nextInvoiceNo(){
  var n = Number(localStorage.getItem('ac_invoice_seq') || '0') + 1;
  localStorage.setItem('ac_invoice_seq', String(n));
  var d = new Date();
  var yy = String(d.getFullYear()).slice(-2);
  var mm = String(d.getMonth()+1).padStart(2,'0');
  return 'INV' + yy + mm + String(n).padStart(5,'0');
}
function ensureInvoiceNumber(order){
  if(!order.invoiceNo){
    order.invoiceNo = nextInvoiceNo();
    order.invoiceDate = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
    saveOrder(order);
  }
  return order.invoiceNo;
}
function invoiceItemBreakdown(item){
  var gstPct = item.gstPct !== undefined ? Number(item.gstPct) : 18;
  var taxable = item.taxable !== undefined ? Number(item.taxable) : Math.round((item.price/(1+gstPct/100))*100)/100;
  var gstAmt = item.gstAmt !== undefined ? Number(item.gstAmt) : Math.round((item.price - taxable)*100)/100;
  return { gstPct:gstPct, taxable:taxable, gstAmt:gstAmt };
}
function generateInvoiceHtml(order){
  var u = getUsers()[order.dealerGst] || {};
  var invNo = ensureInvoiceNumber(order);
  var discAmt = orderDiscountAmount(order);
  var payable = orderPayable(order);
  var sumTaxable = 0, sumGst = 0;
  var rows = order.items.map(function(it, i){
    var b = invoiceItemBreakdown(it);
    sumTaxable += b.taxable * it.qty;
    sumGst += b.gstAmt * it.qty;
    return '<tr>' +
      '<td>'+(i+1)+'</td>' +
      '<td>'+esc(it.name)+'</td>' +
      '<td class="r">'+it.qty+'</td>' +
      '<td class="r">'+money(b.taxable)+'</td>' +
      '<td class="r">'+money(b.taxable*it.qty)+'</td>' +
      '<td class="r">'+b.gstPct+'%</td>' +
      '<td class="r">'+money(b.gstAmt*it.qty)+'</td>' +
      '<td class="r">'+money(it.price*it.qty)+'</td>' +
    '</tr>';
  }).join('');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice '+esc(invNo)+'</title>' +
  '<style>' +
    'body{font-family:Arial,Helvetica,sans-serif; color:#1b1710; margin:0; padding:28px; background:#f8f4ea;}' +
    '.sheet{max-width:800px; margin:0 auto; background:#fff; border:1px solid #ddd3ba; padding:28px; position:relative; overflow:hidden;}' +
    (SETTINGS.logoUrl ? (
      '.watermark{position:absolute; top:50%; left:50%; width:70%; transform:translate(-50%,-50%) rotate(-30deg); opacity:.07; pointer-events:none; z-index:0;}' +
      '.sheet > *{position:relative; z-index:1;}'
    ) : '') +
    '.hd{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #c9a24d; padding-bottom:14px; margin-bottom:14px;}' +
    '.hd-logo{max-height:52px; max-width:140px; margin-bottom:8px; display:block;}' +
    '.hd h1{font-size:20px; margin:0 0 4px; color:#0d1b30;}' +
    '.hd .sub{font-size:11.5px; color:#5c5346; line-height:1.5;}' +
    '.tag{background:#0d1b30; color:#e6c878; font-size:12px; font-weight:bold; padding:5px 14px; border-radius:4px;}' +
    '.meta{display:flex; justify-content:space-between; gap:20px; margin-bottom:18px; font-size:12.5px;}' +
    '.meta .col{flex:1;}' +
    '.meta .lbl{font-size:10px; text-transform:uppercase; color:#5c5346; letter-spacing:.03em; margin-bottom:2px;}' +
    'table{width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:14px;}' +
    'th{background:#0d1b30; color:#e6c878; text-align:left; padding:7px 8px; font-size:10.5px; text-transform:uppercase;}' +
    'td{padding:6px 8px; border-bottom:1px solid #eee2c8;}' +
    '.r{text-align:right;}' +
    '.totals{width:280px; margin-left:auto; font-size:12.5px;}' +
    '.totals div{display:flex; justify-content:space-between; padding:4px 0;}' +
    '.totals .grand{font-weight:bold; font-size:14.5px; border-top:2px solid #0d1b30; margin-top:4px; padding-top:8px;}' +
    '.disclaimer{margin-top:22px; font-size:10px; color:#5c5346; border-top:1px dashed #ddd3ba; padding-top:10px;}' +
    '.print-bar{max-width:800px; margin:0 auto 14px; text-align:right;}' +
    '.print-bar button{background:#0d1b30; color:#e6c878; border:none; padding:8px 16px; border-radius:6px; font-size:12.5px; font-weight:600; cursor:pointer;}' +
    '@media print{ .print-bar{display:none;} body{background:#fff; padding:0;} .sheet{border:none; padding:0;} }' +
  '</style></head><body>' +
    '<div class="print-bar"><button onclick="window.print()">🖨 Print / Save as PDF</button></div>' +
    '<div class="sheet">' +
      (SETTINGS.logoUrl ? '<img class="watermark" src="'+esc(SETTINGS.logoUrl)+'" alt="">' : '') +
      '<div class="hd">' +
        '<div>' + (SETTINGS.logoUrl ? '<img class="hd-logo" src="'+esc(SETTINGS.logoUrl)+'" alt="logo">' : '') + '<h1>'+esc(SETTINGS.shopName)+'</h1>' +
          '<div class="sub">'+esc(SETTINGS.shopAddress)+'<br>GSTIN: '+esc(SETTINGS.shopGstin)+' &nbsp;|&nbsp; Phone: '+esc(SETTINGS.shopPhone)+'</div>' +
        '</div>' +
        '<div class="tag">TAX INVOICE</div>' +
      '</div>' +
      '<div class="meta">' +
        '<div class="col"><div class="lbl">Invoice No.</div>'+esc(invNo)+'<br>' +
          '<div class="lbl" style="margin-top:6px;">Invoice Date</div>'+esc(order.invoiceDate)+'<br>' +
          '<div class="lbl" style="margin-top:6px;">Order Ref.</div>#'+esc(order.id)+' ('+esc(order.date)+')</div>' +
        '<div class="col"><div class="lbl">Billed To</div><b>'+esc(u.business||order.dealerBusiness||order.dealerGst)+'</b><br>' +
          'GSTIN: '+esc(order.dealerGst)+'<br>' +
          esc(u.address||'') + (u.contactPerson ? '<br>Attn: '+esc(u.contactPerson) : '') + (u.phone ? '<br>Ph: '+esc(u.phone) : '') +
        '</div>' +
      '</div>' +
      '<table><thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Rate (Taxable)</th><th class="r">Taxable Value</th><th class="r">GST</th><th class="r">GST Amt</th><th class="r">Amount</th></tr></thead>' +
      '<tbody>'+rows+'</tbody></table>' +
      '<div class="totals">' +
        '<div><span>Taxable Value</span><span>'+money(sumTaxable)+'</span></div>' +
        '<div><span>Total GST</span><span>'+money(sumGst)+'</span></div>' +
        '<div><span>Order Value</span><span>'+money(order.total)+'</span></div>' +
        (order.discount ? '<div><span>Special Discount'+(order.discount.reason?' ('+esc(order.discount.reason)+')':'')+'</span><span>−'+money(discAmt)+'</span></div>' : '') +
        ((Number(order.deliveryCharge)||0) > 0 ? '<div><span>Delivery Charge</span><span>'+money(order.deliveryCharge)+'</span></div>' : '') +
        '<div class="grand"><span>Amount Payable</span><span>'+money(payable)+'</span></div>' +
      '</div>' +
      (order.deliveryAddress ? '<div class="disclaimer" style="border-top:none; padding-top:0; margin-top:6px;"><b>Delivery Address:</b> '+esc(order.deliveryAddress)+'</div>' : '') +
      '<div class="disclaimer">This is a computer-generated tax invoice issued by an independently operated Ashirvad-affiliated dealer and does not require a physical signature. Not an official Ashirvad document.</div>' +
    '</div>' +
  '</body></html>';
}
function openInvoice(orderId){
  var order = findOrder(orderId);
  if(!order) return;
  var html = generateInvoiceHtml(order);
  var win = window.open('', '_blank');
  if(!win){ showToast('Please allow popups to view the invoice'); return; }
  win.document.open(); win.document.write(html); win.document.close();
}
function shareOrder(orderId){
  var o = findOrder(orderId);
  if(!o) return;
  var lines = [];
  lines.push('*AshirvadConnect — Order #'+o.id+'*');
  lines.push(o.date);
  lines.push('');
  o.items.forEach(function(it){ lines.push('• '+it.name+' × '+it.qty+' — '+money(it.price*it.qty)); });
  lines.push('');
  lines.push('Order value: '+money(o.total));
  if(o.discount) lines.push('Discount: −'+money(orderDiscountAmount(o)));
  if(Number(o.deliveryCharge)) lines.push('Delivery: '+money(o.deliveryCharge));
  lines.push('Payable: '+money(orderPayable(o)));
  lines.push('Status: '+orderStatusLabel(o.status));
  var text = lines.join('\n');
  var url = 'https://wa.me/?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

/* ---- Back-in-stock notify requests ---- */
function loadStockNotify(){
  try { var s = JSON.parse(localStorage.getItem('ac_stock_notify') || 'null'); if(Array.isArray(s)) return s; } catch(e){}
  return [];
}
function saveStockNotify(list){ localStorage.setItem('ac_stock_notify', JSON.stringify(list)); STOCK_NOTIFY = list; }
var STOCK_NOTIFY = loadStockNotify();
function isNotifyRequested(productId){
  if(!session) return false;
  return STOCK_NOTIFY.some(function(r){ return r.productId === productId && r.gst === session && !r.fulfilled; });
}
function requestStockNotify(productId){
  if(!session) return;
  if(isNotifyRequested(productId)) return;
  STOCK_NOTIFY.push({ productId:productId, gst:session, fulfilled:false, seen:false });
  saveStockNotify(STOCK_NOTIFY);
  showToast(t('toast.notifyRequested'));
  renderProductGrids();
}
function checkAndFulfillStockNotify(productId, oldStock, newStock){
  if(!(Number(oldStock) <= 0 && Number(newStock) > 0)) return;
  var changed = false;
  STOCK_NOTIFY.forEach(function(r){
    if(r.productId === productId && !r.fulfilled){ r.fulfilled = true; changed = true; }
  });
  if(changed) saveStockNotify(STOCK_NOTIFY);
}
function checkStockNotifications(){
  if(!session) return;
  var mine = STOCK_NOTIFY.filter(function(r){ return r.gst === session && r.fulfilled && !r.seen; });
  if(mine.length === 0) return;
  var names = mine.map(function(r){
    var p = PRODUCTS.find(function(pp){ return pp.id === r.productId; });
    return p ? p.name : ('#'+r.productId);
  });
  showToast(t('toast.backInStock') + ' ' + names.join(', '));
  mine.forEach(function(r){ r.seen = true; });
  saveStockNotify(STOCK_NOTIFY);
}

/* ================= Toast ================= */
/* Defensive wrapper: if bootstrap.bundle.min.js fails to load (blocked CDN, offline, etc.),
   a raw "new bootstrap.X()" call throws and — because these are top-level statements —
   silently kills every function/variable declared afterward in this script. That previously
   caused whole sections (e.g. the Product Details editor, declared near the end of the file)
   to mysteriously stop working with no visible error. This wrapper guarantees the rest of
   the script always finishes initializing, with a plain CSS-class fallback if Bootstrap JS
   itself is unavailable. */
function safeBsComponent(ctorName, el, opts){
  try {
    if(typeof bootstrap === 'undefined' || !bootstrap[ctorName]) throw new Error('bootstrap.'+ctorName+' unavailable');
    return new bootstrap[ctorName](el, opts);
  } catch(e){
    if(window.console && console.warn) console.warn('bootstrap.'+ctorName+' failed to initialize; using fallback.', e);
    return {
      show: function(){ if(el){ el.classList.add('show'); el.style.display = el.classList.contains('modal') ? 'block' : ''; } },
      hide: function(){ if(el){ el.classList.remove('show'); el.style.display = ''; } }
    };
  }
}
var toastEl = document.getElementById('mainToast');
var toast = safeBsComponent('Toast', toastEl, { delay: 1800 });
function showToast(msg){
  document.getElementById('toastBody').textContent = msg;
  toast.show();
}

/* ---- Product image fit ----
   Card / detail images keep their container size exactly as before (width/height:100% of the
   same fixed box). Inside that box: if the picture's proportions are close to the box's, it
   FILLS the box (cover — no bars, negligible crop); otherwise it FITS (contain — whole picture
   visible, never stretched or cut). Default in CSS/markup is contain, so nothing is ever
   cropped if this script hasn't run yet. */
function fitCardImage(img){
  try{
    var box = img.parentElement;
    var bw = box.clientWidth, bh = img.clientHeight || box.clientHeight;
    if(!img.naturalWidth || !img.naturalHeight || !bw || !bh) return;
    var ratio = (img.naturalWidth/img.naturalHeight) / (bw/bh);
    img.style.objectFit = (ratio > 0.85 && ratio < 1.18) ? 'cover' : 'contain';
  }catch(e){}
}
/* Admin-side check: loads each image URL the admin just saved and, if one can't load or has
   proportions that won't sit well in a product card (very wide / very tall / tiny), tells the
   admin to upload a different image. Purely informational and asynchronous — it never blocks
   or changes how the save itself works. */
function checkImageFit(urls, label){
  if(!urls || !urls.length) return;
  var problems = [], pending = urls.length;
  function done(){
    if(--pending > 0) return;
    if(problems.length){
      showToast('⚠ '+(label||'Image')+': '+problems.join(' · ')+' — please upload a different image (ideally close to square, at least 400×400).');
    }
  }
  urls.forEach(function(u, i){
    var im = new Image();
    var tag = 'image '+(i+1);
    im.onload = function(){
      var w = im.naturalWidth, h = im.naturalHeight, r = w/h;
      if(w < 300 || h < 300) problems.push(tag+' is small ('+w+'×'+h+')');
      else if(r > 2 || r < 0.5) problems.push(tag+' is '+w+'×'+h+' and won\'t fit the card well');
      done();
    };
    im.onerror = function(){ problems.push(tag+' could not be loaded'); done(); };
    im.src = u;
  });
}

/* ================= Auth screen logic ================= */
var tabLogin = document.getElementById('tabLogin');
var tabRegister = document.getElementById('tabRegister');
var loginForm = document.getElementById('loginForm');
var registerForm = document.getElementById('registerForm');

document.querySelectorAll('.pw-toggle').forEach(function(btn){
  btn.addEventListener('click', function(){
    var target = document.getElementById(btn.getAttribute('data-pw-target'));
    if(!target) return;
    if(target.type === 'password'){
      target.type = 'text';
      btn.textContent = '🙈';
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      target.type = 'password';
      btn.textContent = '👁';
      btn.setAttribute('aria-label', 'Show password');
    }
  });
});

function showLoginTab(){
  tabLogin.classList.add('active'); tabRegister.classList.remove('active');
  loginForm.classList.remove('d-none'); registerForm.classList.add('d-none');
}
function showRegisterTab(){
  tabRegister.classList.add('active'); tabLogin.classList.remove('active');
  registerForm.classList.remove('d-none'); loginForm.classList.add('d-none');
}
tabLogin.addEventListener('click', showLoginTab);
tabRegister.addEventListener('click', showRegisterTab);
document.getElementById('goRegister').addEventListener('click', function(e){ e.preventDefault(); showRegisterTab(); });
document.getElementById('goLogin').addEventListener('click', function(e){ e.preventDefault(); showLoginTab(); });

loginForm.addEventListener('submit', function(e){
  e.preventDefault();
  var errEl = document.getElementById('loginErr');
  errEl.textContent = '';
  var phone = document.getElementById('loginPhone').value.trim();
  var pw = document.getElementById('loginPassword').value;
  if(!phone){ errEl.textContent = t('auth.err.phoneInvalid'); return; }
  if(CLOUD){
    var lbtn = loginForm.querySelector('button[type="submit"]'); if(lbtn) lbtn.disabled = true;
    CLOUD.dealerLogin(phone, pw).then(function(res){
      function go(g){ localStorage.setItem('ac_session', g); CLOUD.reload(); }
      if(res.gsts.length === 1) go(res.gsts[0]); else showBusinessSwitcher(res.gsts, go);
    }).catch(function(err){ errEl.textContent = CLOUD.authMessage(err, t); }).then(function(){ if(lbtn) lbtn.disabled = false; });
    return;
  }
  var acc = findAccountForPhone(phone);
  if(!acc || !acc.gsts.length){ errEl.textContent = t('auth.err.notFound'); return; }
  if(acc.password !== pw){ errEl.textContent = t('auth.err.wrongPassword'); return; }
  if(acc.gsts.length === 1){
    session = acc.gsts[0];
    localStorage.setItem('ac_session', session);
    enterApp();
    showToast(t('toast.loggedIn'));
  } else {
    showBusinessSwitcher(acc.gsts, function(chosenGst){
      session = chosenGst;
      localStorage.setItem('ac_session', session);
      enterApp();
      showToast(t('toast.loggedIn'));
    });
  }
});

registerForm.addEventListener('submit', function(e){
  e.preventDefault();
  var errEl = document.getElementById('regErr');
  errEl.textContent = '';
  var business = document.getElementById('regBusiness').value.trim();
  var gst = document.getElementById('regGst').value.trim().toUpperCase();
  var phone = document.getElementById('regPhone').value.trim();
  var address = document.getElementById('regAddress').value.trim();
  var pw = document.getElementById('regPassword').value;
  var pwConfirm = document.getElementById('regConfirmPassword').value;
  if(!business || !gst || !phone || !address || !pw || !pwConfirm){ errEl.textContent = t('auth.err.fillAll'); return; }
  if(!/^[0-9]{10}$/.test(phone)){ errEl.textContent = t('auth.err.phoneInvalid'); return; }
  if(pw !== pwConfirm){ errEl.textContent = t('auth.err.passwordMismatch'); return; }
  if(CLOUD){
    if(pw.length < 6){ errEl.textContent = 'Password must be at least 6 characters.'; return; }
    var rbtn = registerForm.querySelector('button[type="submit"]'); if(rbtn) rbtn.disabled = true;
    CLOUD.dealerRegister({ business:business, gst:gst, phone:phone, address:address, password:pw }).then(function(){
      localStorage.setItem('ac_session', gst); CLOUD.reload();
    }).catch(function(err){
      errEl.textContent = err && err.code === 'ac/gst-exists' ? t('auth.err.gstExists')
        : err && err.code === 'ac/duplicate' ? DUP_MSG
        : err && err.code === 'ac/phone-wrong-password' ? 'This phone number is already registered. Use the correct password, or log in and add a new business from your account.'
        : CLOUD.authMessage(err, t);
    }).then(function(){ if(rbtn) rbtn.disabled = false; });
    return;
  }
  var users = getUsers();
  if(users[gst]){ errEl.textContent = t('auth.err.gstExists'); return; }
  var ph10 = normalizePhone(phone);
  if(Object.keys(users).some(function(g){ var x = users[g]; return (normalizePhone(x.phone) === ph10 || x.accountKey === ph10) && (sameAddr(x.address, address) || sameAddr(x.deliveryAddress, address)); })){ errEl.textContent = DUP_MSG; return; }
  var existingAcc = findAccountForPhone(phone);
  if(existingAcc && existingAcc.password !== pw){
    errEl.textContent = 'This phone number is already registered. Log in and add a new business from your account, or use the correct password.';
    return;
  }
  users[gst] = {
    business:business, gst:gst, phone:phone, address:address, password:pw,
    contactPerson:'', email:'', deliveryAddress:address, tier:'Standard',
    notes:'', standingDiscountPct:0, accountKey:normalizePhone(phone)
  };
  saveUsers(users);
  linkGstToAccount(phone, gst, pw);
  session = gst;
  localStorage.setItem('ac_session', gst);
  enterApp();
  showToast(t('toast.registered'));
});

/* ================= Forgot password (admin approves) + duplicate-registration guard =================
   • Registration is refused when the GST number is already registered, or when the same phone number already has a
     business with the same address (same dealer registering twice).
   • Forgot password: the dealer enters phone + GST + address, the admin sees whether they match the registered profile and
     approves or rejects; once approved the dealer chooses a new password on the same screen. */
var DUP_MSG = 'This business is already registered (same phone number and address). Please log in — or use “Forgot password?” if you cannot remember the password.';
function normAddr(a){ return String(a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function sameAddr(a, b){ var x = normAddr(a), y = normAddr(b); return !!x && x === y; }
/* does a reset request carry exactly the details of a registered dealer? */
function resetMatch(req){
  var u = getUsers()[String(req.gst || '').trim().toUpperCase()]; if(!u) return false;
  var ph = normalizePhone(req.phone);
  if(normalizePhone(u.phone) !== ph && String(u.accountKey || '') !== ph) return false;
  return sameAddr(u.address, req.address) || sameAddr(u.deliveryAddress, req.address) || (u.addresses || []).some(function(a){ return sameAddr(a.text, req.address); });
}
var RESET = {
  list_: function(){ try{ var l = JSON.parse(localStorage.getItem('ac_reset_requests') || '[]'); return Array.isArray(l) ? l : []; }catch(e){ return []; } },
  save_: function(l){ localStorage.setItem('ac_reset_requests', JSON.stringify(l)); },
  sent: function(){ try{ return JSON.parse(localStorage.getItem('ac_reset_sent') || 'null'); }catch(e){ return null; } },
  setSent: function(o){ try{ if(o) localStorage.setItem('ac_reset_sent', JSON.stringify(o)); else localStorage.removeItem('ac_reset_sent'); }catch(e){} },
  request: function(req){
    if(CLOUD) return CLOUD.resetRequest(req);
    var l = RESET.list_(), ph = normalizePhone(req.phone), cur = l.find(function(r){ return r.phone === ph; });
    if(cur && (cur.status === 'pending' || cur.status === 'approved')){ var e = new Error('A request for this phone number is already open. Please wait for the admin, or check its status.'); e.code = 'ac/reset-exists'; return Promise.reject(e); }
    var at = Date.now();
    l = l.filter(function(r){ return r.phone !== ph; }); l.push({ id: ph, phone: ph, gst: req.gst, address: req.address, status: 'pending', at: at }); RESET.save_(l);
    return Promise.resolve({ at: at });
  },
  status: function(phone, at){
    if(CLOUD) return CLOUD.resetStatus(phone, at);
    var r = RESET.list_().find(function(x){ return x.phone === normalizePhone(phone) && Number(x.at) === Number(at); });
    return Promise.resolve({ status: r ? r.status : 'pending' });
  },
  complete: function(phone, pw){
    if(CLOUD) return CLOUD.resetComplete(phone, pw);
    var ph = normalizePhone(phone), l = RESET.list_(), r = l.find(function(x){ return x.phone === ph && x.status === 'approved'; });
    if(!r){ var e = new Error('This reset is not approved, or it was already used.'); e.code = 'ac/reset-closed'; return Promise.reject(e); }
    var accs = getAccounts(); if(accs[ph]){ accs[ph].password = pw; saveAccounts(accs); }
    var users = getUsers(); Object.keys(users).forEach(function(g){ if(normalizePhone(users[g].phone) === ph || users[g].accountKey === ph) users[g].password = pw; }); saveUsers(users);
    r.status = 'used'; RESET.save_(l);
    return Promise.resolve();
  },
  list: function(){ return CLOUD ? CLOUD.resetList() : Promise.resolve(RESET.list_()); },
  decide: function(req, approve){
    if(CLOUD) return CLOUD.resetDecide(req, approve);
    var l = RESET.list_(), r = l.find(function(x){ return x.phone === req.phone; });
    if(r){ r.status = approve ? 'approved' : 'rejected'; r.decidedAt = Date.now(); RESET.save_(l); }
    return Promise.resolve();
  }
};
function openForgotPassword(){
  var sent = RESET.sent();
  var w = paySheet('<div id="fpBody"></div>');
  var body = w.querySelector('#fpBody'), $f = function(id){ return body.querySelector('#' + id); };
  var head = function(sub){ return '<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>🔑 Forgot password</h3><div class="sub">' + sub + '</div></div><button type="button" class="acpay-btn ghost" id="fpX" style="flex:none;padding:6px 12px">✕</button></div>'; };
  var wireX = function(){ $f('fpX').onclick = paySheetClose; };
  var pwBox = function(id, label){ return '<label class="l">' + label + '</label><input id="' + id + '" type="password" autocomplete="new-password">'; };
  function formPane(pre){
    pre = pre || {};
    body.innerHTML = head('Enter your details exactly as you registered. The admin checks them and approves your request — then you can choose a new password here.') +
      '<label class="l">Registered phone number</label><input id="fpPhone" type="tel" inputmode="numeric" maxlength="10" value="' + esc(pre.phone || '') + '">' +
      '<label class="l">GST number</label><input id="fpGst" autocapitalize="characters" autocomplete="off" value="' + esc(pre.gst || '') + '">' +
      '<label class="l">Registered business address</label><textarea id="fpAddr" rows="2">' + esc(pre.address || '') + '</textarea>' +
      '<div class="acpay-err" id="fpErr"></div>' +
      '<div class="acpay-row"><button type="button" class="acpay-btn green" id="fpSend">Send request to admin</button></div>' +
      '<div class="acpay-row"><button type="button" class="acpay-btn ghost" id="fpHave">I already sent a request — check status</button></div>';
    wireX();
    $f('fpHave').onclick = function(){ var sd = RESET.sent(); if(sd) statusPane(sd); else { $f('fpErr').textContent = 'No request was sent from this device. Send one first.'; } };
    $f('fpSend').onclick = function(){
      var btn = $f('fpSend'), err = $f('fpErr'); err.textContent = '';
      if(btn.disabled) return;
      var req = { phone: $f('fpPhone').value.trim(), gst: $f('fpGst').value.trim().toUpperCase(), address: $f('fpAddr').value.trim() };
      if(!/^[0-9]{10}$/.test(req.phone)){ err.textContent = t('auth.err.phoneInvalid'); return; }
      if(!req.gst || req.address.length < 6){ err.textContent = 'Please fill in your GST number and registered address.'; return; }
      if(!CLOUD && !resetMatch(req)){ err.textContent = 'These details do not match any registered dealer. Check the phone number, GST number and address exactly as you registered.'; return; }
      btn.disabled = true;
      RESET.request(req).then(function(res){
        RESET.setSent({ phone: req.phone, at: res.at }); statusPane({ phone: req.phone, at: res.at }, 'Request sent ✔ — the admin will review it.');
      }).catch(function(e){ err.textContent = (e && e.message) || 'Could not send the request. Please try again.'; btn.disabled = false; });
    };
  }
  function statusPane(sd, note){
    body.innerHTML = head('Request for ' + esc(sd.phone)) + '<div class="pay-block" id="fpState" style="margin-top:12px">' + esc(note || 'Checking…') + '</div><div class="acpay-err" id="fpErr"></div>' +
      '<div class="acpay-row"><button type="button" class="acpay-btn ghost" id="fpAgain">↻ Check status</button><button type="button" class="acpay-btn ghost" id="fpNew">Send a new request</button></div>';
    wireX();
    $f('fpNew').onclick = function(){ formPane({ phone: sd.phone }); };
    var check = function(){
      var box = $f('fpState'); box.textContent = 'Checking…';
      RESET.status(sd.phone, sd.at).then(function(r){
        if(r.status === 'approved') return newPwPane(sd);
        if(r.status === 'used'){ RESET.setSent(null); box.textContent = 'This reset was already used. Please log in with your new password.'; return; }
        if(r.status === 'rejected'){ box.innerHTML = '❌ <b>Request rejected.</b> The admin could not verify your details. You can send a new request with the correct details.'; return; }
        box.innerHTML = '⏳ <b>Waiting for admin approval.</b> Check again in a little while.';
      }).catch(function(e){ box.textContent = 'Could not check right now — ' + ((e && e.message) || 'please try again.'); });
    };
    $f('fpAgain').onclick = check; check();
  }
  function newPwPane(sd){
    body.innerHTML = head('✔ Approved — choose your new password.') + pwBox('fpPw', 'New password (min 6 characters)') + pwBox('fpPw2', 'Confirm new password') +
      '<div class="acpay-err" id="fpErr"></div><div class="acpay-row"><button type="button" class="acpay-btn green" id="fpSet">Set new password</button></div>';
    wireX();
    $f('fpSet').onclick = function(){
      var btn = $f('fpSet'), err = $f('fpErr'), a = $f('fpPw').value, b = $f('fpPw2').value; err.textContent = '';
      if(btn.disabled) return;
      if(a.length < 6){ err.textContent = 'Password must be at least 6 characters.'; return; }
      if(a !== b){ err.textContent = t('auth.err.passwordMismatch'); return; }
      btn.disabled = true;
      RESET.complete(sd.phone, a).then(function(){
        RESET.setSent(null); paySheetClose(); showToast('Password changed — please log in');
        var lp = document.getElementById('loginPhone'); if(lp){ lp.value = sd.phone; var lw = document.getElementById('loginPassword'); if(lw){ lw.value = ''; lw.focus(); } }
      }).catch(function(e){ err.textContent = e && e.code === 'auth/email-already-in-use' ? 'This reset was already used. Please log in.' : ((e && e.message) || 'Could not set the password.'); btn.disabled = false; });
    };
  }
  if(sent && sent.phone) statusPane(sent); else formPane();
}
document.addEventListener('click', function(e){ var a = e.target.closest ? e.target.closest('#goForgot') : null; if(a){ e.preventDefault(); openForgotPassword(); } });

/* ---- admin: password requests ---- */
var RESET_PENDING = 0, RESET_LAST_CHECK = 0;
function updateResetBadge(force){
  if(!adminSession) return;
  if(!force && Date.now() - RESET_LAST_CHECK < 30000) return;
  RESET_LAST_CHECK = Date.now();
  RESET.list().then(function(l){
    RESET_PENDING = l.filter(function(r){ return r.status === 'pending'; }).length;
    var b = document.querySelector('.admin-tabs button[data-atab="customers"]'); if(!b) return;
    var c = b.querySelector('.tab-count');
    if(RESET_PENDING > 0){ if(!c){ c = document.createElement('span'); c.className = 'tab-count'; b.appendChild(c); } c.textContent = String(RESET_PENDING); b.title = RESET_PENDING + ' password request' + (RESET_PENDING === 1 ? '' : 's') + ' waiting'; }
    else if(c){ c.remove(); b.removeAttribute('title'); }
    var rb = document.getElementById('resetReqCount'); if(rb) rb.textContent = RESET_PENDING ? ' (' + RESET_PENDING + ')' : '';
  }).catch(function(){});
}
setInterval(function(){ if(adminSession) updateResetBadge(); }, 60000);
function openResetRequests(){
  var w = paySheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>🔑 Password requests</h3><div class="sub">Approve only when the details match the registered profile.</div></div><button type="button" class="acpay-btn ghost" id="rrX" style="flex:none;padding:6px 12px">✕</button></div><div id="rrBody" style="margin-top:10px">Loading…</div>');
  w.querySelector('#rrX').onclick = paySheetClose;
  var body = w.querySelector('#rrBody');
  function load(){
    RESET.list().then(function(list){
      var users = getUsers(), fmt = function(ts){ return new Date(Number(ts) || 0).toLocaleString('en-IN'); };
      var pend = list.filter(function(r){ return r.status === 'pending'; }).sort(function(a, b){ return b.at - a.at; });
      var done = list.filter(function(r){ return r.status !== 'pending'; }).sort(function(a, b){ return b.at - a.at; }).slice(0, 8);
      RESET_PENDING = pend.length;
      var row = function(r, actions){
        var m = resetMatch(r), u = users[String(r.gst || '').trim().toUpperCase()];
        return '<div class="pay-block" style="margin-top:8px"><div class="pb-row"><b>' + esc(u ? u.business : 'Unknown business') + '</b><span>' + fmt(r.at) + '</span></div>' +
          '<div class="pb-msg">Phone: <b>' + esc(r.phone) + '</b><br>GST: <b>' + esc(r.gst) + '</b><br>Address given: ' + esc(r.address) + (u && !m ? '<br><span style="color:#6b7280">Registered address: ' + esc(u.address || '—') + '</span>' : '') + '</div>' +
          '<div style="margin-top:6px">' + (m ? '<span class="pay-chip pay-paid">✔ Matches registered details</span>' : '<span class="pay-chip pay-unpaid">✖ Does not match registered details</span>') + '</div>' + (actions || '') + '</div>';
      };
      body.innerHTML = (pend.length ? pend.map(function(r){
          var m = resetMatch(r);
          return row(r, '<div class="acpay-row"><button type="button" class="acpay-btn green" data-rr-ok="' + esc(r.phone) + '"' + (m ? '' : ' disabled title="Details do not match"') + '>✔ Approve</button><button type="button" class="acpay-btn red" data-rr-no="' + esc(r.phone) + '">✕ Reject</button></div>');
        }).join('') : '<div class="sub" style="padding:10px 0">No pending requests.</div>') +
        (done.length ? '<div style="margin-top:14px"><b>Recent decisions</b>' + done.map(function(r){ return '<div class="oi-line" style="font-size:12.5px"><span>' + esc(r.phone) + ' · ' + esc(r.gst) + '</span><span>' + esc(r.status) + '</span></div>'; }).join('') + '</div>' : '');
      var pb = document.getElementById('resetReqCount'); if(pb) pb.textContent = pend.length ? ' (' + pend.length + ')' : '';
      body.querySelectorAll('[data-rr-ok],[data-rr-no]').forEach(function(btn){
        btn.onclick = function(){
          var ph = btn.getAttribute('data-rr-ok') || btn.getAttribute('data-rr-no'), ok = btn.hasAttribute('data-rr-ok');
          var req = list.find(function(r){ return r.phone === ph; }); if(!req || btn.disabled) return;
          if(ok && !resetMatch(req)){ showToast('Details do not match — cannot approve'); return; }
          if(!ok && !confirm('Reject this request?')) return;
          body.querySelectorAll('button').forEach(function(x){ x.disabled = true; });
          RESET.decide(req, ok).then(function(){ logAudit(ok ? 'Password reset approved' : 'Password reset rejected', ph + ' · ' + req.gst); showToast(ok ? 'Approved — the dealer can now set a new password' : 'Request rejected'); load(); updateResetBadge(true); })
            .catch(function(e){ showToast('Could not save: ' + ((e && e.message) || 'try again')); load(); });
        };
      });
    }).catch(function(e){ body.textContent = 'Could not load requests: ' + ((e && e.message) || 'try again'); });
  }
  load();
}

function showBusinessSwitcher(gsts, onChoose){
  var users = getUsers();
  var body = document.getElementById('businessSwitcherBody');
  body.innerHTML = gsts.map(function(g){
    var u = users[g] || {};
    return '<button type="button" class="admin-card bs-choice" data-gst="'+esc(g)+'" style="width:100%; text-align:left; cursor:pointer; margin-bottom:10px; background:#fff; border:1.3px solid #ddd3ba;">' +
      '<div style="font-weight:700;">'+esc(u.business||g)+'</div>' +
      '<div style="font-size:11.5px; color:var(--ink-600);">'+esc(g)+'</div>' +
    '</button>';
  }).join('');
  body.querySelectorAll('.bs-choice').forEach(function(btn){
    btn.addEventListener('click', function(){
      businessSwitcherModal.hide();
      onChoose(btn.getAttribute('data-gst'));
    });
  });
  businessSwitcherModal.show();
}

function enterApp(){
  document.getElementById('authScreen').classList.add('d-none');
  document.getElementById('appShell').classList.remove('d-none');
  currentView = 'home'; currentCategory = null; searchTerm = ''; homeVisibleCount = HOME_PAGE_SIZE;
  document.getElementById('searchInput').value = '';
  render();
  checkStockNotifications();
  checkBroadcastNotifications();
  resetIdleTimers();
  handleProductDeepLink();
}
function handleProductDeepLink(){
  var m = location.hash.match(/#product=(\d+)/);
  if(m){
    var pid = Number(m[1]);
    if(PRODUCTS.some(function(p){ return p.id === pid; })) openProductDetail(pid);
  }
}

function logout(reason){
  if(CLOUD){ localStorage.removeItem('ac_session'); session = null; CLOUD.signOut().then(function(){ CLOUD.reload(); }); return; }
  localStorage.removeItem('ac_session');
  session = null;
  if(typeof accountOffcanvas !== 'undefined' && accountOffcanvas) accountOffcanvas.hide();
  document.getElementById('appShell').classList.add('d-none');
  document.getElementById('authScreen').classList.remove('d-none');
  loginForm.reset(); registerForm.reset();
  showToast(reason || t('toast.loggedOut'));
  clearIdleTimers();
}

/* ================= Navigation ================= */
function setView(view, cat){
  currentView = view;
  currentCategory = cat !== undefined ? cat : null;
  if(view === 'home') homeVisibleCount = HOME_PAGE_SIZE;
  searchTerm = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchWrap').classList.remove('has-text');
  document.querySelectorAll('nav.desk-nav button, .bottom-nav button[data-view]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-view') === view);
  });
  render();
  window.scrollTo({top:0, behavior:'instant'});
}
document.querySelectorAll('nav.desk-nav button[data-view], .bottom-nav button[data-view]').forEach(function(b){
  b.addEventListener('click', function(){ setView(b.getAttribute('data-view')); });
});

var cartOffcanvasEl = document.getElementById('cartOffcanvas');
var cartOffcanvas = safeBsComponent('Offcanvas', cartOffcanvasEl);
var accountOffcanvasEl = document.getElementById('accountOffcanvas');
var accountOffcanvas = safeBsComponent('Offcanvas', accountOffcanvasEl);
var supportOffcanvasEl = document.getElementById('supportOffcanvas');
var supportOffcanvas = safeBsComponent('Offcanvas', supportOffcanvasEl);
var faqOffcanvasEl = document.getElementById('faqOffcanvas');
var faqOffcanvas = safeBsComponent('Offcanvas', faqOffcanvasEl);

document.getElementById('openCart').addEventListener('click', function(){ renderCartPanel(); cartOffcanvas.show(); });
document.getElementById('bnCart').addEventListener('click', function(){ renderCartPanel(); cartOffcanvas.show(); });
document.getElementById('openAccount').addEventListener('click', function(){ renderAccountPanel(); accountOffcanvas.show(); });
document.getElementById('openOrders').addEventListener('click', function(){ setView('orders'); });
document.getElementById('openBulkOrder').addEventListener('click', function(){ document.getElementById('bulkOrderFile').click(); });
document.getElementById('openWishlist').addEventListener('click', function(){ setView('wishlist'); });
document.getElementById('openTools').addEventListener('click', openDealerTools);
document.getElementById('bulkOrderFile').addEventListener('change', function(e){
  var file = e.target.files[0];
  if(file) handleBulkCustomerOrder(file);
  e.target.value = '';
});

/* ================= Search ================= */
var searchInput = document.getElementById('searchInput');
var searchWrap = document.getElementById('searchWrap');
searchInput.addEventListener('input', function(){
  searchTerm = searchInput.value.trim().toLowerCase();
  searchWrap.classList.toggle('has-text', searchTerm.length > 0);
  if(searchTerm){ currentView = 'search'; }
  else { currentView = 'home'; }
  render();
});
document.getElementById('searchClear').addEventListener('click', function(){
  searchInput.value = ''; searchTerm = '';
  searchWrap.classList.remove('has-text');
  currentView = 'home';
  render();
});

/* ================= Cart operations ================= */
function cartCount(){
  var c = getCart(); var n = 0;
  Object.keys(c).forEach(function(id){ n += c[id]; });
  return n;
}
function updateCartBadges(){
  var n = cartCount();
  var b1 = document.getElementById('cartBadge');
  var b2 = document.getElementById('bnCartBadge');
  [b1,b2].forEach(function(b){
    if(n > 0){ b.textContent = n; b.classList.remove('d-none'); }
    else { b.classList.add('d-none'); }
  });
}
function addToCart(id){
  if(!session) return;
  var p = PRODUCTS.find(function(pp){ return pp.id === id; });
  var stock = p ? effStock(p) : Infinity;
  var c = getCart();
  var cur = c[id] || 0;
  if(stock !== Infinity && cur >= stock){
    showToast(t('product.lowStock').replace('{n}', stock));
    return;
  }
  c[id] = cur + 1;
  saveCart(c);
  updateCartBadges();
  renderProductGrids();
  showToast(t('toast.added'));
}
function decrementCart(id){
  var c = getCart();
  if(!c[id]) return;
  c[id] -= 1;
  if(c[id] <= 0) delete c[id];
  saveCart(c);
  updateCartBadges();
  renderProductGrids();
}
function removeFromCart(id){
  var c = getCart();
  delete c[id];
  saveCart(c);
  updateCartBadges();
  renderProductGrids();
  renderCartPanel();
  showToast(t('toast.removed'));
}

/* ================= Product card / grid rendering ================= */
function productMediaSvg(cat){
  return CATEGORY_ICONS[cat] || CATEGORY_ICONS.agri;
}

function productCardHtml(p){
  var cart = getCart();
  var qty = cart[p.id] || 0;
  var pricing = resolvePricing(p, session, Math.max(qty,1));
  var price = pricing.finalPriceWithGst;
  var breakdown = priceBreakdownText(p, session, Math.max(qty,1));
  var stock = effStock(p);
  var oos = stock <= 0;
  var low = !oos && stock <= LOW_STOCK_THRESHOLD;
  var notified = isNotifyRequested(p.id);
  var hasOverride = !!dealerOverride(session, p.id);
  var wished = isWishlisted(p.id);
  var hasImg = p.images && p.images.length > 0;
  // The ribbon must always reflect the REAL discount baked into the price shown below it
  // (product discount % + this dealer's standing discount + any bulk-qty bonus), never just
  // the raw catalog discountPct — otherwise the badge and the crossed-out MRP can disagree
  // with each other (e.g. a dealer with a standing discount but no product-level discount
  // used to see no badge at all, even though their price was genuinely below MRP).
  var effectivePct = pricing.overrideIsNet ? null : Math.round(pricing.totalPct || 0);
  var ribbonHtml = hasOverride
    ? '<span class="off-ribbon" style="background:var(--gold-500); color:var(--navy-950);">★ Special price</span>'
    : (!oos && effectivePct >= 5 ? '<span class="off-ribbon">'+effectivePct+'% '+t('product.off')+'</span>' : '');
  return '' +
    '<div class="product-card" data-id="'+p.id+'">' +
      '<div class="product-media" data-open-detail="'+p.id+'" style="cursor:pointer;'+(hasImg?' padding:0; background:var(--ivory-100);':'')+'">' +
        (hasImg ? '<img loading="lazy" decoding="async" src="'+esc(p.images[0])+'" alt="'+esc(p.name)+'" style="width:100%; height:100%; object-fit:contain;" onload="fitCardImage(this)" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">'+('<div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">'+productMediaSvg(p.cat)+'</div>') : productMediaSvg(p.cat)) +
        '<button type="button" class="wish-btn'+(wished?' active':'')+'" data-wish-id="'+p.id+'">'+(wished?'♥':'♡')+'</button>' +
        ribbonHtml +
        (oos ? '<div class="oos-overlay"><span class="oos-tag">'+t('product.outOfStock')+'</span></div>' : '') +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-name" data-open-detail="'+p.id+'" style="cursor:pointer;">'+esc(p.name)+'</div>' +
        '<div class="product-size">'+esc(p.size)+'</div>' +
        '<div class="price-row">' +
          '<span class="price-final">'+money(price)+'</span>' +
          (price < p.mrp ? '<span class="price-mrp">'+money(p.mrp)+'</span>' : '') +
        '</div>' +
        '<div class="gst-note">'+t('product.mrp')+' · '+t('product.inclGst')+' '+p.gstPct+'%</div>' +
        (breakdown ? '<div class="stock-note" style="color:var(--maroon-600);">'+esc(breakdown)+'</div>' : '') +
        (low ? '<div class="stock-note low">'+t('product.lowStock').replace('{n}', stock)+'</div>' : '') +
        (oos ?
          '<button type="button" class="btn-notify" data-notify-id="'+p.id+'"'+(notified?' disabled':'')+'>'+(notified ? t('product.notified') : t('product.notifyMe'))+'</button>'
          : (qty > 0 ?
            '<div class="qty-stepper">' +
              '<button type="button" class="qty-minus" data-id="'+p.id+'">−</button>' +
              '<span class="qv">'+qty+'</span>' +
              '<button type="button" class="qty-plus" data-id="'+p.id+'">+</button>' +
            '</div>'
            :
            '<button type="button" class="btn-add" data-id="'+p.id+'">'+t('product.add')+'</button>'
          )
        ) +
      '</div>' +
    '</div>';
}

function wireProductGridEvents(container){
  container.querySelectorAll('.btn-add').forEach(function(btn){
    btn.addEventListener('click', function(){ addToCart(Number(btn.getAttribute('data-id'))); });
  });
  container.querySelectorAll('.qty-plus').forEach(function(btn){
    btn.addEventListener('click', function(){ addToCart(Number(btn.getAttribute('data-id'))); });
  });
  container.querySelectorAll('.qty-minus').forEach(function(btn){
    btn.addEventListener('click', function(){ decrementCart(Number(btn.getAttribute('data-id'))); });
  });
  container.querySelectorAll('[data-notify-id]').forEach(function(btn){
    btn.addEventListener('click', function(){ requestStockNotify(Number(btn.getAttribute('data-notify-id'))); });
  });
  container.querySelectorAll('[data-wish-id]').forEach(function(btn){
    btn.addEventListener('click', function(){ toggleWishlist(Number(btn.getAttribute('data-wish-id'))); });
  });
  container.querySelectorAll('[data-open-detail]').forEach(function(el){
    el.addEventListener('click', function(){ openProductDetail(Number(el.getAttribute('data-open-detail'))); });
  });
}

function renderProductGrids(){
  // Re-render whatever grids currently exist without rebuilding whole page (keeps scroll position)
  document.querySelectorAll('.product-grid').forEach(function(grid){
    var ids = grid.getAttribute('data-ids').split(',').map(Number);
    grid.innerHTML = ids.map(function(id){
      var p = PRODUCTS.find(function(pp){ return pp.id === id; });
      return p ? productCardHtml(p) : '';
    }).join('');
    wireProductGridEvents(grid);
  });
}

/* ---- Recently viewed ---- */
function recordRecentlyViewed(id){
  if(!session) return;
  var key = 'ac_recent_' + session;
  var list;
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ list = []; }
  list = list.filter(function(x){ return x !== id; });
  list.unshift(id);
  localStorage.setItem(key, JSON.stringify(list.slice(0,12)));
}
function getRecentlyViewed(){
  if(!session) return [];
  try { return JSON.parse(localStorage.getItem('ac_recent_' + session) || '[]'); } catch(e){ return []; }
}


/* ---- Dynamic catalog: folding spec-group cards (customer browsing) ---- */
var catalogCarouselTimers = {}; // groupId -> intervalId, cleared on re-render (modal gallery)
function clearCatalogCarouselTimers(){
  Object.keys(catalogCarouselTimers).forEach(function(k){ clearInterval(catalogCarouselTimers[k]); });
  catalogCarouselTimers = {};
}
/* Full pricing detail (not just the number) for whichever variant on this card is currently
   cheapest for this dealer — this is the variant the "From ₹X" price on the card is based on,
   so its MRP / override / discount status is what the card's ribbon and strikethrough MRP
   should reflect. Without this, a catalog card could have a dealer-specific special rate (or
   a plain discount) configured on one of its variants and the card would show a bare "From
   ₹X" with no indication a discount or special price applies at all. */
function specGroupMinPricing(g){
  var best = null;
  g.variants.forEach(function(v){
    var pid = (v.pid !== undefined && v.pid !== null && v.pid !== '') ? Number(v.pid) : specVariantProductId(g.id, v.id);
    var sp = PRODUCTS.find(function(pp){ return pp.id === pid; });
    var productForPricing = sp || { id: pid, mrp:Number(v.mrp)||0, gstPct:Number(v.gstPct)||0, discountPct:Number(v.discountPct)||0 };
    var pricing = resolvePricing(productForPricing, session, 1);
    if(!best || pricing.finalPriceWithGst < best.price){
      best = {
        price: pricing.finalPriceWithGst,
        mrp: Number(productForPricing.mrp) || 0,
        hasOverride: !!dealerOverride(session, productForPricing.id),
        effectivePct: pricing.overrideIsNet ? null : Math.round(pricing.totalPct || 0)
      };
    }
  });
  return best || { price: 0, mrp: 0, hasOverride: false, effectivePct: 0 };
}
function specGroupMinPrice(g){ return specGroupMinPricing(g).price; }
/* Compact card — identical markup/classes to a flat .product-card, so every category
   (Casing Pipe, Column Pipe, etc.) renders with the same consistent, compact grid look.
   Tapping the card opens the size-selection modal instead of adding straight to cart. */
function specGroupWishKey(g){ return 'sg'+g.id; }
function specGroupCardHtml(g){
  var images = g.images || [];
  var hasImg = images.length > 0;
  var minPricing = specGroupMinPricing(g);
  var fromPrice = minPricing.price;
  var wished = isWishlisted(specGroupWishKey(g));
  // Same rule as a regular product card: the ribbon and strikethrough MRP always come from
  // the same pricing result the price itself is drawn from, so a dealer override or discount
  // configured on this card's cheapest variant is never invisible on the card.
  var ribbonHtml = minPricing.hasOverride
    ? '<span class="off-ribbon" style="background:var(--gold-500); color:var(--navy-950);">★ Special price</span>'
    : (minPricing.effectivePct >= 5 ? '<span class="off-ribbon">'+minPricing.effectivePct+'% '+t('product.off')+'</span>' : '');
  return '' +
    '<div class="product-card" data-sg-id="'+g.id+'">' +
      '<div class="product-media" data-open-sg="'+g.id+'" style="cursor:pointer;'+(hasImg?' padding:0; background:var(--ivory-100);':'')+'">' +
        (hasImg ? '<img loading="lazy" decoding="async" src="'+esc(images[0])+'" alt="'+esc(g.title)+'" style="width:100%; height:100%; object-fit:contain;" onload="fitCardImage(this)" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">'+('<div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">'+productMediaSvg(g.categoryId)+'</div>') : productMediaSvg(g.categoryId)) +
        '<button type="button" class="wish-btn'+(wished?' active':'')+'" data-wish-id="'+specGroupWishKey(g)+'">'+(wished?'♥':'♡')+'</button>' +
        ribbonHtml +
        '<span class="uc-sizes-chip">'+g.variants.length+' '+t('catalog.sizes')+'</span>' +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-name" data-open-sg="'+g.id+'" style="cursor:pointer;">'+esc(g.title)+'</div>' +
        (g.description ? '<div class="product-size">'+esc(g.description)+'</div>' : '') +
        '<div class="price-row">' +
          '<span class="uc-from">'+t('catalog.from')+'</span>' +
          '<span class="price-final">'+money(fromPrice)+'</span>' +
          (fromPrice < minPricing.mrp ? '<span class="price-mrp">'+money(minPricing.mrp)+'</span>' : '') +
        '</div>' +
        '<div class="gst-note">'+t('catalog.gstLabel')+' '+t('product.inclGst')+'</div>' +
        '<button type="button" class="btn-add" data-open-sg="'+g.id+'">'+t('catalog.viewSizes')+'</button>' +
      '</div>' +
    '</div>';
}
function wireSpecGroupCard(cardEl, g){
  cardEl.querySelectorAll('[data-open-sg]').forEach(function(el){
    el.addEventListener('click', function(){ openCatalogCardModal(g); });
  });
}
function openCatalogCardModal(g){
  document.getElementById('ccTitle').textContent = g.title;
  var body = document.getElementById('ccBody');
  var images = g.images || [];
  var multi = images.length > 1;
  var galleryHtml = images.length === 0 ? '' : (
    '<div class="sg-gallery" style="border-radius:10px; margin-bottom:12px;">' +
      '<div class="sg-gallery-scroll" id="ccGalleryScroll">' +
        images.map(function(src){ return '<div class="sg-slide"><img loading="lazy" decoding="async" src="'+esc(src)+'" alt="'+esc(g.title)+'" loading="lazy"></div>'; }).join('') +
      '</div>' +
      (multi ? (
        '<div class="sg-dots" id="ccDots">' + images.map(function(_,i){ return '<span class="dot'+(i===0?' active':'')+'"></span>'; }).join('') + '</div>' +
        '<div class="sg-counter">'+images.length+' '+t('catalog.photos')+'</div>'
      ) : '') +
    '</div>'
  );
  body.innerHTML =
    galleryHtml +
    (g.description ? '<p style="font-size:12.5px; color:var(--ink-700); margin-bottom:10px;">'+esc(g.description)+'</p>' : '') +
    specGroupBodyHtml(g);
  wireSpecGroupBody(body, g);

  var scrollEl = body.querySelector('#ccGalleryScroll');
  if(scrollEl && images.length > 1){
    var dotsWrap = body.querySelector('#ccDots');
    scrollEl.addEventListener('scroll', function(){
      var i = Math.round(scrollEl.scrollLeft / scrollEl.clientWidth);
      if(dotsWrap) dotsWrap.querySelectorAll('.dot').forEach(function(d,di){ d.classList.toggle('active', di===i); });
    });
  }
  catalogCardModal.show();
}

function specGroupBodyHtml(g){
  var filterFields = (g.fields||[]).filter(function(f){ return f.isFilter; });
  var filtersHtml = filterFields.length ? (
    '<div class="sg-filters">' +
      filterFields.map(function(f){
        var values = uniqueSpecFieldValues(g, f.id);
        return '<select data-sg-filter="'+esc(f.id)+'">' +
          '<option value="">'+t('catalog.allPrefix')+' '+esc((f.label||'').toLowerCase())+'</option>' +
          values.map(function(v){ return '<option value="'+esc(v)+'">'+esc(v)+'</option>'; }).join('') +
        '</select>';
      }).join('') +
    '</div>'
  ) : '';
  return '<input type="text" class="sg-search" placeholder="'+t('catalog.searchPlaceholder')+'">' +
    filtersHtml +
    '<div class="sg-rows" id="sgRows-'+g.id+'"></div>';
}
function uniqueSpecFieldValues(g, fieldId){
  var set = {};
  (g.variants||[]).forEach(function(v){ var val = (v.values||{})[fieldId]; if(val) set[val] = true; });
  return Object.keys(set);
}
function wireSpecGroupBody(body, g){
  var searchInput = body.querySelector('.sg-search');
  searchInput.addEventListener('input', function(){ renderSpecGroupRows(g, body); });
  body.querySelectorAll('[data-sg-filter]').forEach(function(sel){
    sel.addEventListener('change', function(){ renderSpecGroupRows(g, body); });
  });
  renderSpecGroupRows(g, body);
}
function renderSpecGroupRows(g, body){
  var rowsWrap = body.querySelector('.sg-rows');
  var searchTerm = (body.querySelector('.sg-search').value || '').trim().toLowerCase();
  var activeFilters = {};
  body.querySelectorAll('[data-sg-filter]').forEach(function(sel){
    if(sel.value) activeFilters[sel.getAttribute('data-sg-filter')] = sel.value;
  });
  var fields = g.fields || [];
  var headlineField = fields[0];
  var secondaryFields = fields.slice(1);

  var visible = (g.variants||[]).filter(function(v){
    var vals = v.values || {};
    for(var fid in activeFilters){ if(vals[fid] !== activeFilters[fid]) return false; }
    if(searchTerm){
      var hay = (fields.map(function(f){ return vals[f.id]||''; }).join(' ') + ' ' + (v.part||'') + ' SG'+g.id+'-V'+v.id).toLowerCase();
      if(hay.indexOf(searchTerm) === -1) return false;
    }
    return true;
  });

  if(visible.length === 0){
    rowsWrap.innerHTML = '<div class="empty-note"><div class="en-big">'+t('catalog.noOptions')+'</div></div>';
    return;
  }

  rowsWrap.innerHTML = visible.map(function(v){
    var vals = v.values || {};
    var headline = headlineField ? (vals[headlineField.id] || '—') : g.title;
    // Show each spec as "Label: Value" so it's clear which field is which — plain values
    // with no label (e.g. "6 inch · A") were unreadable once a card had more than one field.
    var secondaryParts = secondaryFields.map(function(f){
      return vals[f.id] ? '<span class="sg-row-spec"><b>'+esc(f.label||'—')+':</b> '+esc(vals[f.id])+'</span>' : '';
    }).filter(Boolean);
    var itemCode = v.part ? esc(v.part) : 'SG'+g.id+'-V'+v.id;
    var pid = (v.pid !== undefined && v.pid !== null && v.pid !== '') ? Number(v.pid) : specVariantProductId(g.id, v.id);
    // price the REAL synced product so discount %, dealer overrides and bulk tiers match what the cart charges
    var sp = PRODUCTS.find(function(pp){ return pp.id === pid; });
    var qtyInCart = getCart()[pid] || 0;
    var productForPricing = sp || { id: pid, mrp:Number(v.mrp)||0, gstPct:Number(v.gstPct)||0, discountPct:Number(v.discountPct)||0 };
    var rowPricing = resolvePricing(productForPricing, session, Math.max(qtyInCart,1));
    var price = rowPricing.finalPriceWithGst;
    var rowMrp = Number(productForPricing.mrp) || 0;
    var rowHasOverride = !!dealerOverride(session, productForPricing.id);
    var rowEffectivePct = rowPricing.overrideIsNet ? null : Math.round(rowPricing.totalPct || 0);
    // Same discount-badge rule as every other price display in the app: derived from the
    // actual pricing result, never a raw catalog field, so a size that has a dealer-specific
    // rate or a plain discount configured on it is never shown as if it were full price.
    var rowBadge = rowHasOverride
      ? '<span class="sg-row-badge">★ Special price</span>'
      : (rowEffectivePct >= 5 ? '<span class="sg-row-badge sg-row-badge-pct">'+rowEffectivePct+'% off</span>' : '');
    var oosRow = sp && effStock(sp) <= 0;
    var basePrice = Math.round((price/(1+(Number(v.gstPct)||0)/100))*100)/100;
    var gstAmt = Math.round((price-basePrice)*100)/100;
    var cta = oosRow
      ? '<button type="button" class="sg-row-addbtn" disabled style="opacity:.55; cursor:not-allowed;">'+t('product.outOfStock')+'</button>'
      : (qtyInCart > 0
        ? '<div class="qty-stepper" style="margin-left:auto;">' +
            '<button type="button" class="qty-minus" data-id="'+pid+'">−</button>' +
            '<span class="qv">'+qtyInCart+'</span>' +
            '<button type="button" class="qty-plus" data-id="'+pid+'">+</button>' +
          '</div>'
        : '<button type="button" class="sg-row-addbtn" data-sg-add="'+pid+'">'+t('product.add')+'</button>');
    return '<div class="sg-row">' +
      '<div><div class="sg-row-headline">'+esc(headline)+'</div>' +
        (secondaryParts.length ? '<div class="sg-row-secondary">'+secondaryParts.join(' &nbsp;·&nbsp; ')+'</div>' : '') +
        '<div class="sg-row-code">'+t('catalog.itemCode')+' '+itemCode+'</div>' +
      '</div>' +
      '<div class="sg-row-price">' +
        '<div class="sg-row-pricebreak">'+t('catalog.priceLabel')+' '+money(basePrice)+' + '+t('catalog.gstLabel')+'('+(v.gstPct||0)+'%) '+money(gstAmt)+'</div>' +
        '<div class="sg-row-total-line">' +
          rowBadge +
          '<span class="sg-row-total">'+money(price)+'</span>' +
          (price < rowMrp ? '<span class="sg-row-mrp">'+money(rowMrp)+'</span>' : '') +
        '</div>' +
        cta +
      '</div>' +
    '</div>';
  }).join('');

  rowsWrap.querySelectorAll('[data-sg-add]').forEach(function(btn){
    btn.addEventListener('click', function(){ addToCart(Number(btn.getAttribute('data-sg-add'))); renderSpecGroupRows(g, body); renderProductGrids(); });
  });
  rowsWrap.querySelectorAll('.qty-plus').forEach(function(btn){
    btn.addEventListener('click', function(){ addToCart(Number(btn.getAttribute('data-id'))); renderSpecGroupRows(g, body); renderProductGrids(); });
  });
  rowsWrap.querySelectorAll('.qty-minus').forEach(function(btn){
    btn.addEventListener('click', function(){ decrementCart(Number(btn.getAttribute('data-id'))); renderSpecGroupRows(g, body); renderProductGrids(); });
  });
}

/* ---- Product detail modal ---- */
function openProductDetail(id){
  var p = PRODUCTS.find(function(pp){ return pp.id === id; });
  if(!p) return;
  recordRecentlyViewed(id);
  var images = (p.images && p.images.length) ? p.images : [];
  var cart = getCart();
  var qty = cart[id] || 0;
  var pdPricing = resolvePricing(p, session, Math.max(qty,1));
  var price = pdPricing.finalPriceWithGst;
  var breakdown = priceBreakdownText(p, session, Math.max(qty,1));
  var stock = effStock(p);
  var oos = stock <= 0;
  // This modal always showed the crossed-out MRP, but never called out that a dealer
  // override was in effect — same gap the product card and catalog card had.
  var pdHasOverride = !!dealerOverride(session, p.id);

  document.getElementById('pdTitle').textContent = p.name;
  var body = document.getElementById('pdBody');
  var carouselHtml = images.length ? (
    '<div style="position:relative; background:var(--navy-950); border-radius:10px; overflow:hidden; margin-bottom:12px;">' +
      '<img id="pdImg" src="'+esc(images[0])+'" alt="'+esc(p.name)+'" style="width:100%; height:220px; object-fit:contain; display:block; background:var(--ivory-100);" onload="fitCardImage(this)">' +
      (images.length > 1 ? (
        '<button type="button" id="pdPrev" style="position:absolute; left:6px; top:50%; transform:translateY(-50%); background:rgba(10,19,34,.6); color:#fff; border:none; border-radius:50%; width:30px; height:30px;">‹</button>' +
        '<button type="button" id="pdNext" style="position:absolute; right:6px; top:50%; transform:translateY(-50%); background:rgba(10,19,34,.6); color:#fff; border:none; border-radius:50%; width:30px; height:30px;">›</button>' +
        '<div style="position:absolute; bottom:6px; left:0; right:0; text-align:center; font-size:10px; color:#fff;"><span id="pdImgIndex">1</span> / '+images.length+'</div>'
      ) : '') +
    '</div>'
  ) : ('<div class="product-media" style="height:160px; border-radius:10px; margin-bottom:12px;">'+productMediaSvg(p.cat)+'</div>');

  var specsHtml = (p.specs && p.specs.length) ? (
    '<table style="width:100%; font-size:12.5px; margin-bottom:12px;">' +
      p.specs.map(function(s){ return '<tr><td style="padding:4px 8px 4px 0; color:var(--ink-600); white-space:nowrap; vertical-align:top;">'+esc(s.key)+'</td><td style="padding:4px 0; font-weight:600;">'+esc(s.value)+'</td></tr>'; }).join('') +
    '</table>'
  ) : '';

  body.innerHTML =
    carouselHtml +
    (p.description ? '<p style="font-size:13px; color:var(--ink-700); margin-bottom:12px;">'+esc(p.description)+'</p>' : '') +
    specsHtml +
    (pdHasOverride ? '<div style="margin-bottom:4px;"><span class="off-ribbon" style="position:static; display:inline-block; background:var(--gold-500); color:var(--navy-950);">★ Special price</span></div>' : '') +
    '<div class="price-row" style="margin-bottom:4px;"><span class="price-final" style="font-size:20px;">'+money(price)+'</span>'+(price < p.mrp ? '<span class="price-mrp">'+money(p.mrp)+'</span>' : '')+'</div>' +
    '<div class="gst-note mb-2">'+t('product.mrp')+' · '+t('product.inclGst')+' '+p.gstPct+'%</div>' +
    (breakdown ? '<div class="stock-note mb-2" style="color:var(--maroon-600);">'+esc(breakdown)+'</div>' : '') +
    (oos ?
      '<button type="button" class="btn-notify" id="pdNotifyBtn" style="width:100%;"'+(isNotifyRequested(id)?' disabled':'')+'>'+(isNotifyRequested(id)?t('product.notified'):t('product.notifyMe'))+'</button>'
      : '<button type="button" class="btn-royal" id="pdAddBtn" style="width:100%;">'+t('product.add')+'</button>'
    ) +
    '<div class="mt-3" style="border-top:1px dashed #ddd3ba; padding-top:10px;">' +
      '<div style="display:flex; align-items:center; gap:12px;">' +
        '<div id="pdQrContainer" style="background:#fff; padding:4px; border-radius:6px;"></div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:11px; color:var(--ink-600); margin-bottom:6px;">Scan to open this product</div>' +
          '<button type="button" class="btn-admin sm outline" id="pdQrDownloadBtn">⬇ Download QR</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var imgIdx = 0;
  function updateImg(){
    document.getElementById('pdImg').src = images[imgIdx];
    var ix = document.getElementById('pdImgIndex'); if(ix) ix.textContent = imgIdx+1;
  }
  if(images.length > 1){
    document.getElementById('pdPrev').addEventListener('click', function(){ imgIdx = (imgIdx-1+images.length)%images.length; updateImg(); });
    document.getElementById('pdNext').addEventListener('click', function(){ imgIdx = (imgIdx+1)%images.length; updateImg(); });
  }
  var addBtn = document.getElementById('pdAddBtn');
  if(addBtn) addBtn.addEventListener('click', function(){ addToCart(id); productDetailModal.hide(); });
  var notifyBtn = document.getElementById('pdNotifyBtn');
  if(notifyBtn) notifyBtn.addEventListener('click', function(){ requestStockNotify(id); productDetailModal.hide(); });

  var qrDlBtn = document.getElementById('pdQrDownloadBtn');
  if(qrDlBtn) qrDlBtn.addEventListener('click', function(){ downloadQRCode('pdQrContainer', 'Product_'+p.part+'_QR.png'); });

  // Show the modal FIRST, then generate the QR code once the container is actually
  // visible and laid out — canvas-based QR rendering can silently fail or come out
  // blank if it runs while the modal is still display:none.
  productDetailModal.show();
  setTimeout(function(){
    renderQRInto('pdQrContainer', storeBaseUrl() + '#product=' + id, 84);
  }, 60);
}

/* Shared by banners AND offers: what happens when the customer taps one, based on what admin
   picked in its "Link" field — jump straight to a product or a category instead of only ever
   being able to open an outside URL in a new tab. */
function navigateToLinkTarget(type, value){
  if(!type || type === 'url'){ if(value) window.open(value, '_blank'); return; }
  if(type === 'category'){
    catalogCategoryId = value; catalogSubCategoryId = null;
    setView('categories');
    return;
  }
  if(type === 'product'){
    var pid = Number(value);
    var p = PRODUCTS.find(function(x){ return x.id === pid; });
    if(!p) return;
    if(p.isCatalogVariant){
      var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; });
      if(g){ setView('categories'); openCatalogCardModal(g); return; }
    }
    openProductDetail(pid);
  }
}
/* One consistent "Link" control for the Banner and Offer admin editors: a type dropdown plus
   whichever picker fits (a category list, a product list, or a plain URL box), so admin never
   has to hand-type an id. `prefix` keeps each editor's element ids from colliding (e.g. "bn"
   for banners, "of" for offers). */
function linkTargetEditorHtml(prefix, type, value){
  type = type || 'url';
  return '<div class="full"><label>Link (optional)</label>' +
    '<select id="'+prefix+'LinkType" style="margin-bottom:6px;">' +
      '<option value="url"'+(type==='url'?' selected':'')+'>Outside URL</option>' +
      '<option value="category"'+(type==='category'?' selected':'')+'>A catalog category</option>' +
      '<option value="product"'+(type==='product'?' selected':'')+'>A specific product</option>' +
    '</select>' +
    '<div id="'+prefix+'LinkValueWrap">'+linkTargetValueFieldHtml(prefix, type, value)+'</div>' +
  '</div>';
}
function linkTargetValueFieldHtml(prefix, type, value){
  if(type === 'category'){
    return '<select id="'+prefix+'LinkValue">' +
      '<option value="">Choose a category…</option>' +
      CATALOG_CATEGORIES.map(function(c){ return '<option value="'+esc(c.id)+'"'+(value===c.id?' selected':'')+'>'+esc(c.name)+'</option>'; }).join('') +
    '</select>';
  }
  if(type === 'product'){
    return '<select id="'+prefix+'LinkValue">' +
      '<option value="">Choose a product…</option>' +
      PRODUCTS.filter(function(p){ return p.active !== false || p.isCatalogVariant; }).map(function(p){
        return '<option value="'+p.id+'"'+(Number(value)===p.id?' selected':'')+'>'+esc(p.name)+(p.part?' ('+esc(p.part)+')':'')+'</option>';
      }).join('') +
    '</select>';
  }
  return '<input type="text" id="'+prefix+'LinkValue" value="'+esc(value||'')+'" placeholder="https://…">';
}
/* Swap the value picker in place when admin changes the Link type — call once, right after
   the form's innerHTML is set, for whichever prefix that editor uses. */
function wireLinkTargetEditor(prefix){
  var sel = document.getElementById(prefix+'LinkType');
  if(!sel) return;
  sel.addEventListener('change', function(){
    document.getElementById(prefix+'LinkValueWrap').innerHTML = linkTargetValueFieldHtml(prefix, sel.value, '');
  });
}

function gridHtml(products){
  if(products.length === 0){
    return '<div class="empty-note"><div class="en-big">'+t('home.noResults')+'</div><div>'+t('home.tryDifferent')+'</div></div>';
  }
  return '<div class="product-grid" data-ids="'+products.map(function(p){return p.id;}).join(',')+'">' +
    products.map(productCardHtml).join('') +
    '</div>';
}

/* ================= Views ================= */
var main = document.getElementById('mainContent');

function renderBannersHtml(){
  if(!SETTINGS.showBanners) return '';
  var active = BANNERS.filter(function(b){ return b.active !== false; });
  if(!active.length) return '';
  return '<div class="banner-scroller">' + active.map(function(b){
    var images = (b.images && b.images.length) ? b.images : (b.imageUrl ? [b.imageUrl] : []);
    var sizeKey = ['small','medium','large'].indexOf(b.size) !== -1 ? b.size : 'medium';
    var bg = images.length ? 'background-image:url(\''+esc(images[0])+'\'); background:linear-gradient(0deg, rgba(10,19,34,.55), rgba(10,19,34,.35)), url(\''+esc(images[0])+'\');' : ('background:'+(b.color||'linear-gradient(135deg, var(--navy-900), var(--navy-700))')+';');
    return '<div class="banner-slide banner-size-'+sizeKey+'" style="'+bg+'" ' +
        'data-banner-id="'+b.id+'" data-link-type="'+esc(b.linkType||'url')+'" data-link-value="'+esc(b.linkValue||b.link||'')+'">' +
      (images.length > 1 ? '<div class="bs-dots">'+images.map(function(_,i){ return '<span class="dot'+(i===0?' active':'')+'"></span>'; }).join('')+'</div>' : '') +
      '<div class="bs-title">'+esc(b.title||'')+'</div>' +
      (b.subtitle ? '<div class="bs-sub">'+esc(b.subtitle)+'</div>' : '') +
      (b.buttonText ? '<button type="button" class="bs-btn">'+esc(b.buttonText)+'</button>' : '') +
    '</div>';
  }).join('') + '</div>';
}
function renderOfferZoneHtml(){
  if(!SETTINGS.showOfferZone) return '';
  var active = OFFERS.filter(function(o){ return o.active !== false; });
  if(!active.length) return '';
  return '<div class="offer-zone">' +
    '<div class="oz-title">🎁 '+t('offer.title')+'</div>' +
    active.map(function(o){
      return '<div class="offer-chip" data-link-type="'+esc(o.linkType||'url')+'" data-link-value="'+esc(o.linkValue||'')+'">' +
        (o.badge ? '<span class="oc-badge">'+esc(o.badge)+'</span>' : '') +
        '<div class="oc-title">'+esc(o.title||'')+'</div>' +
        (o.desc ? '<div class="oc-desc">'+esc(o.desc)+'</div>' : '') +
      '</div>';
    }).join('') +
  '</div>';
}
(function(){ if(document.getElementById('acRvCss')) return; var st = document.createElement('style'); st.id = 'acRvCss';
  st.textContent = [
  '.product-grid.rv-strip{display:flex!important;grid-template-columns:none!important;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:thin}',
  '.rv-strip .product-card{flex:0 0 118px;width:118px;height:auto}',
  '.rv-strip .product-media{height:64px!important}.rv-strip .product-media svg{width:30px;height:30px}',
  '.rv-strip .product-body{padding:6px 7px 7px;gap:3px}',
  '.rv-strip .product-name{font-size:11.5px;min-height:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
  '.rv-strip .product-size,.rv-strip .gst-note,.rv-strip .stock-note,.rv-strip .price-mrp,.rv-strip .off-ribbon{display:none!important}',
  '.rv-strip .price-final{font-size:13px}',
  '.rv-strip .btn-add,.rv-strip .btn-notify{margin-top:3px;padding:4px 6px;font-size:11px}',
  '.rv-strip .qty-stepper{margin-top:3px}.rv-strip .qty-stepper button{height:22px;width:24px;font-size:13px}',
  '.rv-strip .wish-btn{width:20px;height:20px;font-size:12px;top:4px;left:4px}'
  ].join('\n'); document.head.appendChild(st); })();
function renderRecentlyViewedHtml(){
  var ids = getRecentlyViewed();
  if(!ids.length) return '';
  var products = ids.map(function(id){ return PRODUCTS.find(function(p){ return p.id === id && p.active !== false; }); }).filter(Boolean).slice(0,6);
  if(!products.length) return '';
  return '<div class="section-title"><span>'+t('home.recentlyViewed')+'</span></div>' +
    '<div class="product-grid rv-strip" data-ids="'+products.map(function(p){return p.id;}).join(',')+'" style="margin-bottom:10px;">' +
      products.map(productCardHtml).join('') +
    '</div>';
}

/* ---- Sort / out-of-stock filter helpers, shared by Home & Search ---- */
function isProductOOS(p){
  var stock = effStock(p);
  return stock <= 0;
}
/* A catalog ("New card") is treated as out of stock only when every one of its
   variants is out of stock — matches how the size-selection modal already treats
   individual variants, just rolled up to the card level. */
function specGroupAllOOS(g){
  return g.variants.every(function(v){
    var pid = (v.pid !== undefined && v.pid !== null && v.pid !== '') ? Number(v.pid) : specVariantProductId(g.id, v.id);
    var sp = PRODUCTS.find(function(pp){ return pp.id === pid; });
    if(!sp) return false;
    return isProductOOS(sp);
  });
}
function sortFlatProducts(list){
  var sorted = list.slice();
  if(catalogSortBy === 'nameAsc') sorted.sort(function(a,b){ return a.name.localeCompare(b.name); });
  else if(catalogSortBy === 'priceAsc') sorted.sort(function(a,b){ return finalPrice(a,session,1) - finalPrice(b,session,1); });
  else if(catalogSortBy === 'priceDesc') sorted.sort(function(a,b){ return finalPrice(b,session,1) - finalPrice(a,session,1); });
  return sorted;
}
function sortCatalogCards(list){
  var sorted = list.slice();
  if(catalogSortBy === 'nameAsc') sorted.sort(function(a,b){ return a.title.localeCompare(b.title); });
  else if(catalogSortBy === 'priceAsc') sorted.sort(function(a,b){ return specGroupMinPrice(a) - specGroupMinPrice(b); });
  else if(catalogSortBy === 'priceDesc') sorted.sort(function(a,b){ return specGroupMinPrice(b) - specGroupMinPrice(a); });
  return sorted;
}
/* Searchable text for a catalog card: title, description, category label, and every
   variant's field values (same fields used by the modal's own search box), so a search
   for a size, spec value or part number can still find the right card. */
function specGroupSearchHay(g){
  var catObj = CATALOG_CATEGORIES.find(function(c){ return c.id === g.categoryId; });
  var catLabel = catObj ? catalogCategoryLabel(catObj) : '';
  var variantText = g.variants.map(function(v){
    return (g.fields||[]).map(function(f){ return v.values ? (v.values[f.id]||'') : ''; }).join(' ') + ' ' + (v.part||'');
  }).join(' ');
  return (g.title + ' ' + (g.description||'') + ' ' + catLabel + ' ' + variantText).toLowerCase();
}
/* Small sort/hide-out-of-stock toolbar reused on Home and Search. onChange is called
   after either control changes; the caller just re-renders itself with the new state. */
function catalogToolbarHtml(prefix){
  return '<div class="ctlg-toolbar" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin:6px 0 10px;">' +
    '<select id="'+prefix+'SortSelect" class="form-select form-select-sm" style="width:auto;">' +
      '<option value="default"'+(catalogSortBy==='default'?' selected':'')+'>'+t('sort.default')+'</option>' +
      '<option value="nameAsc"'+(catalogSortBy==='nameAsc'?' selected':'')+'>'+t('sort.nameAsc')+'</option>' +
      '<option value="priceAsc"'+(catalogSortBy==='priceAsc'?' selected':'')+'>'+t('sort.priceAsc')+'</option>' +
      '<option value="priceDesc"'+(catalogSortBy==='priceDesc'?' selected':'')+'>'+t('sort.priceDesc')+'</option>' +
    '</select>' +
    '<label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">' +
      '<input type="checkbox" id="'+prefix+'HideOosChk"'+(hideOutOfStock?' checked':'')+'> '+t('sort.hideOos') +
    '</label>' +
  '</div>';
}
function wireCatalogToolbar(prefix, onChange){
  var sel = document.getElementById(prefix+'SortSelect');
  if(sel) sel.addEventListener('change', function(){ catalogSortBy = sel.value; onChange(); });
  var chk = document.getElementById(prefix+'HideOosChk');
  if(chk) chk.addEventListener('change', function(){ hideOutOfStock = chk.checked; onChange(); });
}
var NEW_ARRIVALS_COUNT = 8;
/* Same idea/markup as renderRecentlyViewedHtml just above: a compact preview row, flat
   products only (ids are sequential, so highest id = most recently added). */
function renderNewArrivalsHtml(){
  var products = browseProducts().slice().sort(function(a,b){ return b.id - a.id; }).slice(0, NEW_ARRIVALS_COUNT);
  if(!products.length) return '';
  return '<div class="section-title"><span>'+t('home.newArrivals')+'</span></div>' +
    '<div class="product-grid" data-ids="'+products.map(function(p){return p.id;}).join(',')+'" style="grid-template-columns:repeat('+Math.min(products.length,2)+',1fr); margin-bottom:10px;">' +
      products.map(productCardHtml).join('') +
    '</div>';
}

function renderHome(){
  var chips = CATALOG_CATEGORIES.filter(function(c){ return CATEGORY_ORDER.indexOf(c.id) === -1; }).map(function(c){
    return '<div class="cat-chip" data-dyncat="'+esc(c.id)+'">' +
      '<div class="ci">'+catalogCategoryIcon(c)+'</div>' +
      '<div class="cl">'+esc(catalogCategoryLabel(c))+'</div>' +
    '</div>';
  }).join('') + CATEGORY_ORDER.map(function(key){
    var m = CATEGORY_META[key];
    return '<div class="cat-chip" data-cat="'+key+'">' +
      '<div class="ci">'+CATEGORY_ICONS[key]+'</div>' +
      '<div class="cl">'+t(m.labelKey)+'</div>' +
    '</div>';
  }).join('');

  /* Home used to show only the flat product list (browseProducts()) — every catalog
     ("New card") item, e.g. Column Pipe / Bore+ / Accessories, was excluded from
     browseProducts() by design and only appeared once a customer opened that specific
     category. That made Home look sparse and "categories only". We now also list every
     catalog card here, in its own grid, so Home shows the full product range up front —
     without touching browseProducts(), gridHtml(), or how category browsing itself works. */
  var flatAll = browseProducts();
  var catalogAll = SPEC_GROUPS;
  var flatFiltered = hideOutOfStock ? flatAll.filter(function(p){ return !isProductOOS(p); }) : flatAll;
  var catalogFiltered = hideOutOfStock ? catalogAll.filter(function(g){ return !specGroupAllOOS(g); }) : catalogAll;
  var flatProducts = sortFlatProducts(flatFiltered);
  var catalogCards = sortCatalogCards(catalogFiltered);
  var totalCount = flatProducts.length + catalogCards.length;

  /* "Load more": show only the first homeVisibleCount cards (flat products first, then
     catalog cards, same order they already appeared in), with a button to reveal more.
     Purely a display-count limit — flatProducts/catalogCards/totalCount above still hold
     everything, so the "All products" count next to the title always shows the true total. */
  var visibleCount = Math.min(homeVisibleCount, totalCount);
  var visibleFlat = flatProducts.slice(0, visibleCount);
  var visibleCatalog = catalogCards.slice(0, Math.max(0, visibleCount - flatProducts.length));
  var hasMore = visibleCount < totalCount;

  var productsHtml = totalCount === 0
    ? '<div class="empty-note"><div class="en-big">'+t('home.noResults')+'</div><div>'+t('home.tryDifferent')+'</div></div>'
    : (visibleFlat.length ? '<div class="product-grid" data-ids="'+visibleFlat.map(function(p){return p.id;}).join(',')+'">' + visibleFlat.map(productCardHtml).join('') + '</div>' : '') +
      (visibleCatalog.length ? '<div class="uc-grid">' + visibleCatalog.map(specGroupCardHtml).join('') + '</div>' : '') +
      (hasMore ? '<div style="text-align:center; margin:14px 0;"><button type="button" class="btn-admin outline" id="homeLoadMoreBtn">'+t('home.loadMore').replace('{n}', Math.min(HOME_PAGE_SIZE, totalCount-visibleCount))+'</button></div>' : '');

  main.innerHTML =
    renderBannersHtml() +
    '<div class="cat-scroller">'+chips+'</div>' +
    renderOfferZoneHtml() +
    renderRecentlyViewedHtml() +
    renderNewArrivalsHtml() +
    '<div class="section-title"><span>'+t('home.allProducts')+'</span><span class="st-count">'+totalCount+'</span></div>' +
    catalogToolbarHtml('home') +
    productsHtml;

  wireCatalogToolbar('home', renderHome);

  var loadMoreBtn = document.getElementById('homeLoadMoreBtn');
  if(loadMoreBtn) loadMoreBtn.addEventListener('click', function(){ homeVisibleCount += HOME_PAGE_SIZE; renderHome(); });

    main.querySelectorAll('.banner-slide[data-banner-id]').forEach(function(el){
    var linkType = el.getAttribute('data-link-type');
    var linkValue = el.getAttribute('data-link-value');
    if(linkValue){
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){ navigateToLinkTarget(linkType, linkValue); });
    }
    // Multi-image auto-rotate, same 3.5s pattern used on catalog cards
    var bId = Number(el.getAttribute('data-banner-id'));
    var b = BANNERS.find(function(x){ return x.id === bId; });
    var images = (b && b.images && b.images.length) ? b.images : (b && b.imageUrl ? [b.imageUrl] : []);
    if(images.length > 1){
      var idx = 0;
      setInterval(function(){
        idx = (idx + 1) % images.length;
        el.style.backgroundImage = 'linear-gradient(0deg, rgba(10,19,34,.55), rgba(10,19,34,.35)), url(\''+images[idx].replace(/'/g,"\\'")+'\')';
        el.querySelectorAll('.bs-dots .dot').forEach(function(d, di){ d.classList.toggle('active', di === idx); });
      }, 3500);
    }
  });
  main.querySelectorAll('.offer-chip[data-link-value]').forEach(function(el){
    var linkValue = el.getAttribute('data-link-value');
    if(linkValue){
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){
        navigateToLinkTarget(el.getAttribute('data-link-type'), linkValue);
      });
    }
  });
  main.querySelectorAll('.cat-chip[data-cat]').forEach(function(chip){
    chip.addEventListener('click', function(){
      catalogCategoryId = null; catalogSubCategoryId = null;
      setView('categories', chip.getAttribute('data-cat'));
    });
  });
  main.querySelectorAll('.cat-chip[data-dyncat]').forEach(function(chip){
    chip.addEventListener('click', function(){
      catalogCategoryId = chip.getAttribute('data-dyncat');
      catalogSubCategoryId = null;
      setView('categories');
    });
  });
  /* Wired per .product-grid (not the whole main) so flat-card handlers (.btn-add,
     [data-wish-id], etc.) never also match the catalog cards' own .btn-add / wish
     buttons living in .uc-grid — the same double-wiring bug already avoided for
     category browsing via wireSpecGroupWishButtons. */
  main.querySelectorAll('.product-grid').forEach(function(grid){ wireProductGridEvents(grid); });
  main.querySelectorAll('.uc-grid .product-card[data-sg-id]').forEach(function(cardEl){
    var g = catalogCards.find(function(x){ return String(x.id) === cardEl.getAttribute('data-sg-id'); });
    if(g) wireSpecGroupCard(cardEl, g);
  });
  wireSpecGroupWishButtons(main);
}
/* Customer-facing label/icon for a dynamic category. Agri/Casing keep their translated label and
   original icon as long as the admin hasn't renamed them. */
function catalogCategoryLabel(c){
  if((c.id === 'agri' || c.id === 'casing') && c.name === CATEGORY_DEFAULT_NAMES[c.id]) return t('cat.'+c.id);
  return c.name;
}
var CATEGORY_DEFAULT_NAMES = { agri:'Agri Pipes', casing:'Casing Pipes' };
function catalogCategoryIcon(c){
  return (c.id === 'agri' || c.id === 'casing') ? CATEGORY_ICONS[c.id] : '📇';
}

function renderCategories(){
  var activeCat = currentCategory;
  var chips = '<div class="cat-chip'+(!activeCat && !catalogCategoryId?' active':'')+'" data-cat="">' +
        '<div class="ci" style="background:'+(!activeCat && !catalogCategoryId?'var(--maroon-600)':'var(--navy-900)')+'">' +
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="8" height="8" stroke="#e6c878" stroke-width="2"/><rect x="22" y="10" width="8" height="8" stroke="#e6c878" stroke-width="2"/><rect x="10" y="22" width="8" height="8" stroke="#e6c878" stroke-width="2"/><rect x="22" y="22" width="8" height="8" stroke="#e6c878" stroke-width="2"/></svg>' +
        '</div>' +
        '<div class="cl">'+t('cat.all')+'</div>' +
      '</div>' +
    CATEGORY_ORDER.map(function(key){
      var m = CATEGORY_META[key];
      var active = !catalogCategoryId && activeCat === key;
      return '<div class="cat-chip'+(active?' active':'')+'" data-cat="'+key+'">' +
        '<div class="ci">'+CATEGORY_ICONS[key]+'</div>' +
        '<div class="cl">'+t(m.labelKey)+'</div>' +
      '</div>';
    }).join('') +
    CATALOG_CATEGORIES.map(function(c){
      var active = catalogCategoryId === c.id;
      return '<div class="cat-chip'+(active?' active':'')+'" data-dyncat="'+esc(c.id)+'">' +
        '<div class="ci" style="background:'+(active?'var(--maroon-600)':'var(--navy-900)')+'">'+catalogCategoryIcon(c)+'</div>' +
        '<div class="cl">'+esc(catalogCategoryLabel(c))+'</div>' +
      '</div>';
    }).join('');

  main.innerHTML = '<div class="cat-scroller">'+chips+'</div><div id="catBodySlot"></div>';

  main.querySelectorAll('[data-cat]').forEach(function(chip){
    chip.addEventListener('click', function(){
      var cat = chip.getAttribute('data-cat');
      currentCategory = cat || null;
      catalogCategoryId = null;
      catalogSubCategoryId = null;
      renderCategories();
    });
  });
  main.querySelectorAll('[data-dyncat]').forEach(function(chip){
    chip.addEventListener('click', function(){
      catalogCategoryId = chip.getAttribute('data-dyncat');
      catalogSubCategoryId = null;
      currentCategory = null;
      renderCategories();
    });
  });

  if(catalogCategoryId){
    renderCatalogCategoryBody();
    return;
  }

  var filtered = activeCat ? browseProducts().filter(function(p){ return p.cat === activeCat; }) : browseProducts();
  var title = activeCat ? t(CATEGORY_META[activeCat].labelKey) : t('home.allProducts');

  document.getElementById('catBodySlot').innerHTML =
    '<div class="section-title"><span>'+esc(title)+'</span><span class="st-count">'+filtered.length+'</span></div>' +
    gridHtml(filtered);
  wireProductGridEvents(main);
}

/* ---- Dynamic "New card" catalog: customer-facing sub-category + card grid ---- */
function renderCatalogCategoryBody(){
  var slot = document.getElementById('catBodySlot');
  if(!slot) return;
  clearCatalogCarouselTimers();

  var catPills = '<div class="pill-row">' +
    CATALOG_CATEGORIES.map(function(c){
      var active = catalogCategoryId === c.id;
      return '<button type="button" class="pill-cat'+(active?' active':'')+'" data-pillcat="'+esc(c.id)+'">'+esc(catalogCategoryLabel(c))+'</button>';
    }).join('') +
  '</div>';

  var subs = subcategoriesForCategory(catalogCategoryId);
  var subPills = '';
  if(subs.length){
    var allCount = specGroupsFor(catalogCategoryId, null).length;
    subPills = '<div class="pill-row">' +
      '<button type="button" class="pill-sub'+(!catalogSubCategoryId?' active':'')+'" data-pillsub="">'+t('catalog.allSubs')+'</button>' +
      subs.map(function(s){
        var active = catalogSubCategoryId === s.id;
        var hasItems = specGroupsFor(catalogCategoryId, s.id).length > 0;
        return '<button type="button" class="pill-sub'+(active?' active':'')+(hasItems?'':' disabled')+'" data-pillsub="'+esc(s.id)+'"'+(hasItems?'':' disabled')+'>'+esc(s.name)+'</button>';
      }).join('') +
    '</div>';
  }

  var cards = specGroupsFor(catalogCategoryId, catalogSubCategoryId);
  var cardsHtml = cards.length === 0
    ? '<div class="empty-note"><div class="en-big">'+t('catalog.noCards')+'</div></div>'
    : cards.map(function(g){ return specGroupCardHtml(g); }).join('');

  slot.innerHTML = catPills + subPills + '<div id="sgCardsWrap" class="uc-grid">' + cardsHtml + '</div>';

  slot.querySelectorAll('[data-pillcat]').forEach(function(btn){
    btn.addEventListener('click', function(){
      catalogCategoryId = btn.getAttribute('data-pillcat');
      catalogSubCategoryId = null;
      renderCatalogCategoryBody();
    });
  });
  slot.querySelectorAll('[data-pillsub]:not(.disabled)').forEach(function(btn){
    btn.addEventListener('click', function(){
      catalogSubCategoryId = btn.getAttribute('data-pillsub') || null;
      renderCatalogCategoryBody();
    });
  });
  slot.querySelectorAll('.product-card[data-sg-id]').forEach(function(cardEl){
    var g = cards.find(function(x){ return String(x.id) === cardEl.getAttribute('data-sg-id'); });
    if(g) wireSpecGroupCard(cardEl, g);
  });
  wireSpecGroupWishButtons(slot);
}
/* Custom (spec-group) cards use a string wishlist key ('sg'+id) instead of a numeric
   product id. They were never wired to a click handler here, and elsewhere the shared
   handler ran the id through Number(), turning "sg5" into NaN — together this is why
   liking a custom card silently did nothing. */
function wireSpecGroupWishButtons(container){
  container.querySelectorAll('.product-card[data-sg-id] [data-wish-id]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      toggleWishlist(btn.getAttribute('data-wish-id'));
    });
  });
}

function renderSearch(){
  var q = searchTerm;
  /* Previously this matched activeProducts() directly, which includes each catalog
     ("New card") variant as its own raw flat entry — e.g. searching "column pipe" could
     show five near-identical rows, one per size, instead of one card with "View sizes"
     like Home and Categories now show. Flat matching itself (browseProducts + the same
     hay string) is unchanged; catalog cards are now matched and grouped separately. */
  var flatMatches = browseProducts().filter(function(p){
    var hay = (p.name + ' ' + p.size + ' ' + p.part + ' ' + t(CATEGORY_META[p.cat].labelKey)).toLowerCase();
    return hay.indexOf(q) !== -1;
  });
  var catalogMatches = SPEC_GROUPS.filter(function(g){ return specGroupSearchHay(g).indexOf(q) !== -1; });

  var flatFiltered = hideOutOfStock ? flatMatches.filter(function(p){ return !isProductOOS(p); }) : flatMatches;
  var catalogFiltered = hideOutOfStock ? catalogMatches.filter(function(g){ return !specGroupAllOOS(g); }) : catalogMatches;
  var flatProducts = sortFlatProducts(flatFiltered);
  var catalogCards = sortCatalogCards(catalogFiltered);
  var totalCount = flatProducts.length + catalogCards.length;

  main.innerHTML =
    '<div class="section-title"><span>'+t('home.searchResults')+'</span><span class="st-count">'+totalCount+'</span></div>' +
    catalogToolbarHtml('search') +
    (totalCount === 0
      ? '<div class="empty-note"><div class="en-big">'+t('home.noResults')+'</div><div>'+t('home.tryDifferent')+'</div></div>'
      : (flatProducts.length ? '<div class="product-grid" data-ids="'+flatProducts.map(function(p){return p.id;}).join(',')+'">' + flatProducts.map(productCardHtml).join('') + '</div>' : '') +
        (catalogCards.length ? '<div class="uc-grid">' + catalogCards.map(specGroupCardHtml).join('') + '</div>' : ''));

  wireCatalogToolbar('search', renderSearch);
  main.querySelectorAll('.product-grid').forEach(function(grid){ wireProductGridEvents(grid); });
  main.querySelectorAll('.uc-grid .product-card[data-sg-id]').forEach(function(cardEl){
    var g = catalogCards.find(function(x){ return String(x.id) === cardEl.getAttribute('data-sg-id'); });
    if(g) wireSpecGroupCard(cardEl, g);
  });
  wireSpecGroupWishButtons(main);
}

/* Compact placed → confirmed → dispatched → delivered timeline, with the date/time each stage
   was reached (from statusHistory). Cancelled orders show a short two-point timeline instead. */
function orderTimelineHtml(o){
  var hist = orderStatusHistory(o);
  var whenFor = function(status){
    var e = hist.filter(function(h){ return h.status === status; }).pop();
    return e ? new Date(e.at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
  };
  if(o.status === 'cancelled'){
    return '<div class="oc-timeline">' +
      '<div class="oc-tl-step done"><div class="dot"></div><div class="lbl">'+t('orders.status.placed')+'</div><div class="when">'+esc(whenFor('placed'))+'</div></div>' +
      '<div class="oc-tl-step cancelled"><div class="dot"></div><div class="lbl">'+t('orders.status.cancelled')+'</div><div class="when">'+esc(whenFor('cancelled'))+'</div></div>' +
    '</div>';
  }
  var reachedIdx = STATUS_ORDER.indexOf(o.status);
  return '<div class="oc-timeline">' + STATUS_ORDER.map(function(st, i){
    var done = i <= reachedIdx;
    return '<div class="oc-tl-step'+(done?' done':'')+'"><div class="dot"></div><div class="lbl">'+t('orders.status.'+st)+'</div>' +
      (done ? '<div class="when">'+esc(whenFor(st))+'</div>' : '') + '</div>';
  }).join('') + '</div>';
}
/* Adds every item from a past order back to the cart, using CURRENT price/availability — an item
   that's gone inactive or out of stock since then is skipped, with a summary toast either way. */
function reorderOrder(id){
  var o = findOrder(id);
  if(!o) return;
  var added = 0, skipped = 0;
  o.items.forEach(function(it){
    var p = PRODUCTS.find(function(pp){ return pp.id === it.id; });
    if(!p || p.active === false || effStock(p) <= 0){ skipped++; return; }
    for(var i=0;i<it.qty;i++) addToCart(p.id);
    added++;
  });
  if(added) showToast(added+' '+t('orders.reorderAdded')+(skipped ? ' · '+skipped+' '+t('orders.reorderSkipped') : ''));
  else showToast(t('orders.reorderSkipped'));
  if(added){ renderCartPanel(); cartOffcanvas.show(); }
}
function orderStatusLabel(status){
  return t('orders.status.' + (status || 'placed'));
}
function renderOrdersView(){
  var all = getOrders().slice().reverse();
  if(all.length === 0){
    main.innerHTML = '<div class="empty-note"><div class="en-big">'+t('orders.empty.title')+'</div><div>'+t('orders.empty.sub')+'</div></div>';
    return;
  }
  var q = custOrderSearch.trim().toLowerCase();
  var orders = all.filter(function(o){
    if(custOrderStatusFilter !== 'all' && o.status !== custOrderStatusFilter) return false;
    if(!q) return true;
    var hay = (o.id + ' ' + o.items.map(function(it){ return it.name; }).join(' ')).toLowerCase();
    return hay.indexOf(q) !== -1;
  });
  var filtersActive = !!q || custOrderStatusFilter !== 'all';
  var statusCounts = { all: all.length };
  all.forEach(function(o){ statusCounts[o.status] = (statusCounts[o.status]||0) + 1; });
  var chips = ['all'].concat(STATUS_ORDER, ['cancelled']).filter(function(st, i, arr){ return arr.indexOf(st) === i; })
    .filter(function(st){ return st === 'all' || statusCounts[st]; })
    .map(function(st){
      var label = st === 'all' ? t('orders.filter.all') : orderStatusLabel(st);
      return '<button type="button" class="filter-chip'+(custOrderStatusFilter===st?' active':'')+'" data-custordfilter="'+st+'">'+esc(label)+' ('+(statusCounts[st]||0)+')</button>';
    }).join('');
  var toolbar = '<div class="cust-ord-toolbar">' +
      '<input type="text" id="custOrderSearch" placeholder="'+esc(t('orders.searchPlaceholder'))+'" value="'+esc(custOrderSearch)+'">' +
      (filtersActive ? '<button type="button" class="btn-admin sm outline" id="custOrderClear">✕ '+t('orders.clearFilters')+'</button>' : '') +
    '</div>' +
    '<div class="cust-ord-chips">'+chips+'</div>';
  main.innerHTML = '<div class="section-title"><span>'+t('orders.title')+'</span><span class="st-count">'+orders.length+(orders.length!==all.length?' / '+all.length:'')+'</span></div>' +
    toolbar +
    (orders.length === 0
      ? '<div class="empty-note"><div class="en-big">'+t('orders.noMatch.title')+'</div><div>'+t('orders.noMatch.sub')+'</div></div>'
      : orders.map(function(o){
      var discAmt = orderDiscountAmount(o);
      var payable = orderPayable(o);
      var deliveryCharge = Number(o.deliveryCharge)||0;
      var open = !!CUST_ORDER_UI.expanded[o.id];
      var body = open ? (
        orderTimelineHtml(o) +
        '<div class="oc-line"><span>'+esc(o.date)+'</span><span>'+o.items.length+' '+t('orders.items')+'</span></div>' +
        // Each item shows its per-unit rate as well as the line total (qty × rate = total),
        // instead of just a name and one lump number — so it's obvious how the total was
        // reached, not just what it is.
        o.items.map(function(it){
          return '<div class="oc-item-line"><div class="oc-item-name">'+esc(it.name)+'</div>' +
            '<div class="oc-item-calc"><span>'+it.qty+' × '+money(it.price)+'</span><span><b>'+money(it.price*it.qty)+'</b></span></div></div>';
        }).join('') +
        '<div class="oc-line" style="margin-top:6px;"><span>'+t('orders.subtotal')+'</span><span>'+money(o.total)+'</span></div>' +
        (o.discount ? '<div class="oc-line" style="color:var(--maroon-600); font-weight:600;"><span>'+t('orders.discount.'+(o.discount.type==='flat'?'flat':'pct'))+(o.discount.reason ? ' — '+esc(o.discount.reason) : '')+'</span><span>−'+money(discAmt)+'</span></div>' : '') +
        (deliveryCharge > 0 ? '<div class="oc-line"><span>'+t('cart.deliveryCharge')+'</span><span>'+money(deliveryCharge)+'</span></div>' : '') +
        '<div class="oc-line oc-total"><span>'+t('orders.payable')+'</span><span>'+money(payable)+'</span></div>' +
        (o.discount ? '<div class="discount-applied-tag">'+t('orders.newDiscount')+'</div>' : '') +
        payDealerBlockHtml(o) +
        '<div class="ac-actions" style="margin-top:8px;">' +
          (o.status !== 'cancelled' ? '<button type="button" class="btn-admin sm outline" data-invoice="'+esc(o.id)+'">🧾 '+t('orders.invoice')+'</button>' : '') +
          '<button type="button" class="btn-admin sm outline" data-share="'+esc(o.id)+'">📤 '+t('orders.share')+'</button>' +
          (o.status === 'placed' ? '<button type="button" class="btn-admin sm maroon" data-cancel-own="'+esc(o.id)+'">✕ '+t('orders.cancel')+'</button>' : '') +
          '<button type="button" class="btn-admin sm" data-reorder="'+esc(o.id)+'">🔁 '+t('orders.reorder')+'</button>' +
        '</div>'
      ) : '';
      // Collapsed by default (same pattern as the admin Orders tab): a compact summary row that
      // expands on tap into the full timeline / items / actions, rather than every past order
      // dumping its entire detail onto the screen at once.
      return '<div class="cust-ord-row'+(open?' open':'')+'">' +
        '<div class="cor-head" data-toggle-custord="'+esc(o.id)+'">' +
          '<div class="cor-main">' +
            '<div class="cor-id">'+t('orders.orderNo')+' #'+esc(o.id)+'</div>' +
            '<div class="cor-meta">'+esc(o.date)+' · '+o.items.length+' '+t('orders.items')+'</div>' +
          '</div>' +
          '<div class="cor-right">' +
            '<span class="status-pill st-'+esc(o.status||'placed')+'">'+orderStatusLabel(o.status)+'</span>' +
            payChipHtml(o) + '<span class="cor-total">'+money(payable)+'</span>' +
            '<button type="button" class="cor-toggle" aria-label="'+(open?'Collapse':'Expand')+'">'+(open?'▴':'▾')+'</button>' +
          '</div>' +
        '</div>' +
        (open ? '<div class="cor-body">'+body+'</div>' : '') +
      '</div>';
    }).join(''));
  var searchInput = document.getElementById('custOrderSearch');
  if(searchInput){
    searchInput.addEventListener('input', function(){
      custOrderSearch = searchInput.value;
      var cursorPos = searchInput.selectionStart;
      renderOrdersView();
      var again = document.getElementById('custOrderSearch');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  main.querySelectorAll('[data-custordfilter]').forEach(function(btn){
    btn.addEventListener('click', function(){ custOrderStatusFilter = btn.getAttribute('data-custordfilter'); renderOrdersView(); });
  });
  main.querySelectorAll('[data-toggle-custord]').forEach(function(el){
    el.addEventListener('click', function(){
      var id = el.getAttribute('data-toggle-custord');
      if(CUST_ORDER_UI.expanded[id]) delete CUST_ORDER_UI.expanded[id]; else CUST_ORDER_UI.expanded[id] = true;
      renderOrdersView();
    });
  });
  var clearBtn = document.getElementById('custOrderClear');
  if(clearBtn) clearBtn.addEventListener('click', function(){ custOrderSearch = ''; custOrderStatusFilter = 'all'; renderOrdersView(); });
  main.querySelectorAll('[data-invoice]').forEach(function(btn){
    btn.addEventListener('click', function(){ openInvoice(btn.getAttribute('data-invoice')); });
  });
  main.querySelectorAll('[data-reorder]').forEach(function(btn){
    btn.addEventListener('click', function(){ reorderOrder(btn.getAttribute('data-reorder')); });
  });
  main.querySelectorAll('[data-share]').forEach(function(btn){
    btn.addEventListener('click', function(){ shareOrder(btn.getAttribute('data-share')); });
  });
  main.querySelectorAll('[data-cancel-own]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-cancel-own');
      var o = findOrder(id);
      if(!o || o.status !== 'placed') return;
      if(!confirm(t('orders.cancel') + '?')) return;
      applyOrderStatus(o, 'cancelled');
      showToast(t('toast.orderCancelled'));
      renderOrdersView();
    });
  });
  // Mark all discount notifications as seen once the customer has viewed their orders
  var all = getAllOrders();
  var changed = false;
  all.forEach(function(o){
    if(o.dealerGst === session && o.discount && !o.discountSeen){ o.discountSeen = true; changed = true; }
  });
  if(changed) saveAllOrders(all);
}
function checkDiscountNotifications(){
  if(!session) return;
  var hasUnseen = getOrders().some(function(o){ return o.discount && !o.discountSeen; });
  if(hasUnseen) showToast(t('toast.newDiscount'));
}

function renderWishlistView(){
  var ids = getWishlist();
  var products = activeProducts().filter(function(p){ return ids.indexOf(p.id) !== -1; });
  if(products.length === 0){
    main.innerHTML = '<div class="empty-note"><div class="en-big">'+t('wishlist.empty.title')+'</div><div>'+t('wishlist.empty.sub')+'</div></div>';
    return;
  }
  main.innerHTML =
    '<div class="section-title"><span>'+t('wishlist.title')+'</span><span class="st-count">'+products.length+'</span></div>' +
    gridHtml(products);
  wireProductGridEvents(main);
}

function render(){
  updateCartBadges();
  if(currentView === 'home') renderHome();
  else if(currentView === 'categories') renderCategories();
  else if(currentView === 'search') renderSearch();
  else if(currentView === 'orders') renderOrdersView();
  else if(currentView === 'account') renderAccountView();
  else if(currentView === 'wishlist') renderWishlistView();
  else if(currentView === 'allOrders') renderAllBusinessOrdersView();
  else if(currentView === 'calculator') renderCalculatorView();
  var oldBanner = document.getElementById('blockedBanner');
  if(oldBanner) oldBanner.remove();
  if(session && !isDealerActive(session)){
    var mc = document.getElementById('mainContent');
    if(mc) mc.insertAdjacentHTML('afterbegin', '<div id="blockedBanner" style="background:#fbdede; color:#a12626; border:1px solid #e3a3a3; border-radius:10px; padding:10px 14px; margin:0 0 12px; font-size:13px; font-weight:600;">⛔ '+esc(blockedNoticeText(session))+'</div>');
  }
}
var calcUnit = 'ft';
function renderCalculatorView(){
  var purposeTypes = calcPurposeTypes();
  main.innerHTML =
    '<div class="section-title"><span>'+t('calc.title')+'</span></div>' +
    '<p class="ac-sub mb-2" style="padding:0 2px;">'+t('calc.intro')+'</p>' +
    '<div class="account-card mb-3">' +
      '<div class="admin-form-grid">' +
        '<div class="full">' +
          '<label>'+t('calc.purposeType')+'</label>' +
          '<select id="calcPurpose">' +
            '<option value="">'+t('calc.selectPurpose')+'</option>' +
            purposeTypes.map(function(pt){ return '<option value="'+esc(pt)+'">'+esc(pt)+'</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label>'+t('calc.depth')+'</label>' +
          '<div style="display:flex; gap:6px;">' +
            '<input type="number" id="calcDepth" min="1" style="flex:1;">' +
            '<div style="display:flex; border:1.3px solid #ddd3ba; border-radius:6px; overflow:hidden;">' +
              '<button type="button" class="unit-btn active" data-unit="ft" style="padding:0 10px; border:none; background:var(--navy-900); color:#fff; font-size:12px; font-weight:600;">'+t('calc.unitFt')+'</button>' +
              '<button type="button" class="unit-btn" data-unit="m" style="padding:0 10px; border:none; background:#fff; color:var(--ink-700); font-size:12px; font-weight:600;">'+t('calc.unitM')+'</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div><label>'+t('calc.diameter')+'</label><input type="number" id="calcDiameter" min="0"></div>' +
      '</div>' +
      '<button class="btn-royal mt-3" id="calcCalculateBtn" style="width:100%;">'+t('calc.calculate')+'</button>' +
    '</div>' +
    '<div id="calcResults"></div>';

  main.querySelectorAll('.unit-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      calcUnit = btn.getAttribute('data-unit');
      main.querySelectorAll('.unit-btn').forEach(function(b){
        var active = b === btn;
        b.classList.toggle('active', active);
        b.style.background = active ? 'var(--navy-900)' : '#fff';
        b.style.color = active ? '#fff' : 'var(--ink-700)';
      });
    });
  });
  document.getElementById('calcCalculateBtn').addEventListener('click', runCalculator);
}

function runCalculator(){
  var purpose = document.getElementById('calcPurpose').value;
  var depthRaw = Number(document.getElementById('calcDepth').value);
  var diameter = Number(document.getElementById('calcDiameter').value) || null;
  var results = document.getElementById('calcResults');

  if(CALC_RULES.length === 0){
    results.innerHTML = '<div class="empty-note"><div class="en-big">'+t('calc.noRules')+'</div></div>';
    return;
  }
  if(!depthRaw || depthRaw <= 0){
    results.innerHTML = '<div class="empty-note"><div class="en-big">'+t('calc.depth')+'</div></div>';
    return;
  }
  var depthFeet = calcUnit === 'm' ? depthRaw * 3.28084 : depthRaw;
  var matches = matchCalcRules(purpose, depthFeet, diameter);

  if(matches.length === 0){
    results.innerHTML =
      '<div class="empty-note">' +
        '<div class="en-big">'+t('calc.noMatch.title')+'</div>' +
        '<div class="mb-3">'+t('calc.noMatch.sub')+'</div>' +
        '<button class="btn-royal" id="calcContactBtn">'+t('calc.contactUs')+'</button>' +
      '</div>';
    var cb = document.getElementById('calcContactBtn');
    if(cb) cb.addEventListener('click', openSupportPanel);
    return;
  }

  results.innerHTML = '<div class="section-title"><span>'+t('calc.resultsTitle')+'</span></div>' +
    matches.map(function(rule){
      var lines = computeRuleEquipment(rule, depthFeet, session);
      var total = lines.reduce(function(s,l){ return s + l.lineTotal; }, 0);
      return '<div class="admin-card mb-3" data-rule-id="'+rule.id+'">' +
        '<div class="ac-title" style="margin-bottom:8px;">'+esc(rule.label)+'</div>' +
        lines.map(function(l){
          return '<div class="oi-line"><span>'+esc(l.product.name)+' — '+t('calc.qty')+' '+l.qty+'</span><span>'+money(l.lineTotal)+'</span></div>';
        }).join('') +
        '<div class="oi-line" style="font-weight:700;"><span>'+t('calc.grandTotal')+'</span><span>'+money(total)+'</span></div>' +
        '<button class="btn-royal mt-2" data-add-rule="'+rule.id+'" style="width:100%;">'+t('calc.addAllToCart')+'</button>' +
      '</div>';
    }).join('');

  results.querySelectorAll('[data-add-rule]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ruleId = Number(btn.getAttribute('data-add-rule'));
      var rule = CALC_RULES.find(function(r){ return r.id === ruleId; });
      if(!rule) return;
      var lines = computeRuleEquipment(rule, depthFeet, session);
      var cart = getCart();
      lines.forEach(function(l){
        var stock = effStock(l.product);
        var cur = cart[l.product.id] || 0;
        var room = stock === Infinity ? l.qty : Math.max(0, stock - cur);
        cart[l.product.id] = cur + Math.min(l.qty, room);
      });
      saveCart(cart);
      updateCartBadges();
      renderProductGrids();
      showToast(t('toast.calcAdded'));
    });
  });
}

function renderAllBusinessOrdersView(){
  var users = getUsers();
  var myGsts = gstsForCurrentAccount();
  var all = getAllOrders().filter(function(o){ return myGsts.indexOf(o.dealerGst) !== -1; }).slice().reverse();
  if(all.length === 0){
    main.innerHTML = '<div class="section-title"><span>'+t('account.allBusinessOrders')+'</span></div>' +
      '<div class="empty-note"><div class="en-big">'+t('orders.empty.title')+'</div><div>'+t('orders.empty.sub')+'</div></div>';
    return;
  }
  main.innerHTML = '<div class="section-title"><span>'+t('account.allBusinessOrders')+'</span><span class="st-count">'+all.length+'</span></div>' +
    all.map(function(o){
      var u = users[o.dealerGst] || {};
      var payable = orderPayable(o);
      return '<div class="order-card">' +
        '<div class="oc-head">' +
          '<div class="oc-id">'+t('orders.orderNo')+' #'+esc(o.id)+' <span style="font-weight:400; color:var(--ink-600); font-size:11px;">— '+esc(u.business||o.dealerGst)+'</span></div>' +
          '<span class="status-pill st-'+esc(o.status||'placed')+'">'+orderStatusLabel(o.status)+'</span>' +
        '</div>' +
        '<div class="oc-line"><span>'+esc(o.date)+'</span><span>'+o.items.length+' '+t('orders.items')+'</span></div>' +
        '<div class="oc-line oc-total"><span>'+t('orders.payable')+'</span><span>'+money(payable)+'</span></div>' +
      '</div>';
    }).join('');
}

/* ================= Cart panel ================= */
var selectedAddressId = null;
function renderCartPanel(){
  var cart = getCart();
  var ids = Object.keys(cart);
  var itemsWrap = document.getElementById('cartItemsWrap');
  var summaryWrap = document.getElementById('cartSummary');

  if(ids.length === 0){
    itemsWrap.innerHTML = '<div class="empty-note"><div class="en-big">'+t('cart.empty.title')+'</div><div>'+t('cart.empty.sub')+'</div></div>';
    summaryWrap.innerHTML = '';
    return;
  }

  var subtotalBeforeGst = 0, gstAmount = 0, total = 0;
  itemsWrap.innerHTML = ids.map(function(id){
    var p = PRODUCTS.find(function(pp){ return pp.id === Number(id); });
    if(!p) return '';
    var qty = cart[id];
    var price = finalPrice(p, session, qty);
    var pricing = resolvePricing(p, session, qty);
    var afterDiscount = pricing.overrideIsNet ? Number(price/(1+p.gstPct/100)) : p.mrp * (1 - (pricing.totalPct||0)/100);
    var breakdown = priceBreakdownText(p, session, qty);
    subtotalBeforeGst += afterDiscount * qty;
    gstAmount += (price - afterDiscount) * qty;
    total += price * qty;
    return '' +
      '<div class="cart-item">' +
        '<div class="ci-media">'+productMediaSvg(p.cat)+'</div>' +
        '<div class="flex-grow-1">' +
          '<div class="ci-name">'+esc(p.name)+'</div>' +
          '<div class="ci-size">'+esc(p.size)+'</div>' +
          (breakdown ? '<div class="stock-note" style="color:var(--maroon-600);">'+esc(breakdown)+'</div>' : '') +
          '<div class="qty-stepper" style="max-width:110px;">' +
            '<button type="button" class="qty-minus" data-id="'+p.id+'">−</button>' +
            '<span class="qv">'+qty+'</span>' +
            '<button type="button" class="qty-plus" data-id="'+p.id+'">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="text-end">' +
          '<div class="ci-price">'+money(price*qty)+'</div>' +
          '<button type="button" class="ci-remove" data-id="'+p.id+'">'+t('cart.remove')+'</button>' +
        '</div>' +
      '</div>';
  }).join('');

  var addresses = getDealerAddresses(session);
  if(selectedAddressId === null || !addresses.some(function(a){ return a.id === selectedAddressId; })){
    var primary = addresses.find(function(a){ return a.isPrimary; }) || addresses[0];
    selectedAddressId = primary ? primary.id : null;
  }
  var freeMin = Number(SETTINGS.freeDeliveryMin) || 0;
  var deliveryCharge = (freeMin > 0 && total < freeMin) ? (Number(SETTINGS.deliveryCharge) || 0) : 0;
  var grandTotal = total + deliveryCharge;

  summaryWrap.innerHTML =
    (addresses.length ? (
      '<div class="row-line" style="align-items:center;"><span>'+t('cart.deliverTo')+'</span>' +
        '<select id="cartAddressSelect" style="max-width:60%; border:1.3px solid #ddd3ba; border-radius:6px; padding:4px 6px; font-size:11.5px;">' +
          addresses.map(function(a){ return '<option value="'+a.id+'"'+(a.id===selectedAddressId?' selected':'')+'>'+esc(a.label)+'</option>'; }).join('') +
        '</select>' +
      '</div>'
    ) : '') +
    '<div class="row-line"><span>'+t('cart.subtotal')+'</span><span>'+money(subtotalBeforeGst)+'</span></div>' +
    '<div class="row-line"><span>'+t('cart.gst')+'</span><span>'+money(gstAmount)+'</span></div>' +
    (deliveryCharge > 0 ? '<div class="row-line"><span>'+t('cart.deliveryCharge')+'</span><span>'+money(deliveryCharge)+'</span></div>' : '') +
    '<div class="row-total"><span>'+t('cart.total')+'</span><span>'+money(grandTotal)+'</span></div>' +
    (isDealerActive(session) ? '' : '<div class="stock-note low" style="margin:6px 0; color:var(--maroon-600); font-weight:600;">'+esc(blockedNoticeText(session))+'</div>') +
    '<button type="button" class="btn-royal" id="placeOrderBtn"'+(isDealerActive(session) ? '' : ' disabled style="opacity:.5; cursor:not-allowed;"')+'>'+t('cart.placeOrder')+'</button>' +
    '<button type="button" class="btn btn-link w-100 mt-2" id="continueShoppingBtn" style="color:var(--navy-900); font-weight:600; font-size:12.5px;">'+t('cart.continueShopping')+'</button>';

  var addrSel = document.getElementById('cartAddressSelect');
  if(addrSel) addrSel.addEventListener('change', function(){ selectedAddressId = Number(addrSel.value); });

  itemsWrap.querySelectorAll('.qty-plus').forEach(function(btn){
    btn.addEventListener('click', function(){ addToCart(Number(btn.getAttribute('data-id'))); renderCartPanel(); });
  });
  itemsWrap.querySelectorAll('.qty-minus').forEach(function(btn){
    btn.addEventListener('click', function(){ decrementCart(Number(btn.getAttribute('data-id'))); renderCartPanel(); });
  });
  itemsWrap.querySelectorAll('.ci-remove').forEach(function(btn){
    btn.addEventListener('click', function(){ removeFromCart(Number(btn.getAttribute('data-id'))); });
  });
  document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
  itemsWrap.insertAdjacentHTML('beforeend', '<div class="cart-extras">' + cartNudgesHtml(cart, total, freeMin, grandTotal) + '<button type="button" class="btn btn-link w-100" id="cartQuoteBtn" style="color:var(--navy-900); font-weight:600; font-size:12.5px;">📄 Make a quote for my customer</button></div>');
  var qb = document.getElementById('cartQuoteBtn'); if(qb) qb.addEventListener('click', function(){ cartOffcanvas.hide(); openQuoteMaker(); });
  document.getElementById('continueShoppingBtn').addEventListener('click', function(){ cartOffcanvas.hide(); });
}

function handleBulkCustomerOrder(file){
  if(!session) return;
  readSpreadsheetFile(file, function(err, rows){
    if(err){ showToast('Could not read that file'); return; }
    var cart = getCart();
    var added = 0, skippedNotFound = 0, skippedOos = 0, cappedCount = 0;
    rows.forEach(function(row){
      var code = pickField(row, ['item code','part','part no','part number','code']);
      var qtyRaw = pickField(row, ['quantity','qty','order qty','orderqty']);
      if(code === undefined || String(code).trim() === '') return;
      var qty = Math.floor(Number(qtyRaw)) || 0;
      if(qty <= 0) return;
      code = String(code).trim().toLowerCase();
      var p = PRODUCTS.find(function(pp){ return String(pp.part).trim().toLowerCase() === code && pp.active !== false; });
      if(!p){ skippedNotFound++; return; }
      var stock = effStock(p);
      if(stock <= 0){ skippedOos++; return; }
      var cur = cart[p.id] || 0;
      var room = stock === Infinity ? qty : Math.max(0, stock - cur);
      var toAdd = Math.min(qty, room);
      if(toAdd < qty) cappedCount++;
      if(toAdd > 0){ cart[p.id] = cur + toAdd; added++; }
    });
    saveCart(cart);
    updateCartBadges();
    renderProductGrids();
    var msg = t('bulk.done') + ' — ' + added + ' item(s) added.';
    if(skippedNotFound) msg += ' ' + skippedNotFound + ' code(s) not found.';
    if(skippedOos) msg += ' ' + skippedOos + ' out of stock.';
    if(cappedCount) msg += ' ' + cappedCount + ' capped to available stock.';
    showToast(msg);
    renderCartPanel();
    cartOffcanvas.show();
  });
}

/* A dealer is active unless admin explicitly blocked the account (isActive === false). */
function isDealerActive(gst){
  var u = getUsers()[gst];
  return !!u && u.isActive !== false;
}
function blockedNoticeText(gst){
  var u = getUsers()[gst] || {};
  return t('cart.accountBlocked') + (u.blockReason ? ' (' + u.blockReason + ')' : '');
}
function placeOrder(){
  var cart = getCart();
  var ids = Object.keys(cart);
  if(ids.length === 0) return;
  if(!isDealerActive(session)){ showToast(t('cart.accountBlocked')); renderCartPanel(); return; }
  var items = ids.map(function(id){
    var p = PRODUCTS.find(function(pp){ return pp.id === Number(id); });
    var price = finalPrice(p, session, cart[id]);
    var gstPct = p.gstPct;
    var taxable = Math.round((price/(1+gstPct/100))*100)/100;
    var gstAmt = Math.round((price-taxable)*100)/100;
    return { id:p.id, name:p.name, qty:cart[id], price:price, gstPct:gstPct, taxable:taxable, gstAmt:gstAmt };
  });
  var total = items.reduce(function(s,it){ return s + it.price*it.qty; }, 0);
  var freeMin = Number(SETTINGS.freeDeliveryMin) || 0;
  var deliveryCharge = (freeMin > 0 && total < freeMin) ? (Number(SETTINGS.deliveryCharge) || 0) : 0;
  var users = getUsers();
  var u = users[session] || {};
  var addresses = getDealerAddresses(session);
  var chosenAddr = addresses.find(function(a){ return a.id === selectedAddressId; }) || addresses[0];
  var allOrders = getAllOrders();
  var orderId = 'AC' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();   // e.g. AC260930-K3F9
  var dateStr = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
    ', ' + new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  var order = {
    id:orderId,
    dealerGst:session,
    dealerBusiness:u.business || session,
    date:dateStr,
    createdAt:Date.now(),
    items:items,
    total:total,
    deliveryCharge:deliveryCharge,
    deliveryAddress: chosenAddr ? chosenAddr.text : (u.deliveryAddress || u.address || ''),
    status:'placed',
    statusHistory:[{ status:'placed', at:Date.now() }],
    discount:null,
    discountSeen:true
  };
  saveOrder(order);
  saveCart({});
  updateCartBadges();
  renderProductGrids();
  cartOffcanvas.hide();
  showToast(t('toast.orderPlaced'));
  setView('orders');
  if(payChoiceModes().length) setTimeout(function(){ askPayAfterOrder(order.id); }, 350);   // pay now / pay later is asked only once the order is placed
}

/* ================= UPI payments for orders =================
   Free: the dealer pays YOUR UPI ID directly (no gateway, no fee). A UPI QR / "open UPI app" link carries the exact amount.
   After paying, the dealer enters the UTR (bank reference). Admin checks the bank app / SMS and presses "Confirm received",
   or simply sets the order's payment status (Unpaid / Part paid / Paid) from the order details.
   order.payMode  'now' | 'later'              (dealer's choice at checkout)
   order.payClaim { status:'pending'|'confirmed'|'rejected', utr, amount, via, note, at, reason }   (dealer writes 'pending' only)
   order.payHistory [ {at, by, action, amount, utr, note} ]                                      (admin only)
   order.paymentStatus 'unpaid'|'partial'|'paid' and order.paidAmount (for partial) — set by admin only. */
var CART_PAY_MODE = 'now';
function r2(n){ return Math.round((Number(n)||0) * 100) / 100; }
function qrImageOn(){ return SETTINGS.qrMode === 'image' && !!SETTINGS.qrImage; }
function upiOn(){ return !!(SETTINGS.upiId && SETTINGS.payNowOn !== false); }
function nowOn(){ return SETTINGS.payNowOn !== false && !!(SETTINGS.upiId || SETTINGS.payNote || qrImageOn()); }   // UPI QR, or just bank details if no UPI ID
function laterOn(){ return SETTINGS.payLaterOn !== false; }
var PAY_STATUS_LIST = [['unpaid','Unpaid'],['partial','Part paid'],['paid','Paid']];
function orderPaid(o){
  if(!o || o.status === 'cancelled') return 0;
  var due = orderPayable(o);
  if(o.paymentStatus === 'paid') return due;
  if(o.paymentStatus === 'partial') return Math.min(due, Math.max(0, r2(o.paidAmount)));
  return 0;
}
function orderBalance(o){ return Math.max(0, r2(orderPayable(o) - orderPaid(o))); }
function payState(o){
  if(!o || o.status === 'cancelled') return 'cancelled';
  var s = o.paymentStatus;
  if(s === 'paid') return 'paid';
  if(s === 'partial') return 'partial';
  if(o.payClaim && o.payClaim.status === 'pending') return 'verify';
  if(s === 'unpaid') return 'unpaid';
  if(o.payClaim && o.payClaim.status === 'rejected') return 'rejected';
  return o.payMode === 'now' ? 'unpaid' : 'later';       // orders with no status set yet
}
/* the value the admin's drop-down shows for an order */
function payStatusForSelect(o){ var s = payState(o); return s === 'paid' || s === 'partial' ? s : 'unpaid'; }
var PAY_TXT = { paid: '✔ Paid', partial: 'Part paid', verify: '⏳ Verifying', unpaid: 'Payment due', later: 'Pay later', rejected: 'Payment not found' };
function payChipHtml(o){ var s = payState(o); return s === 'cancelled' ? '' : '<span class="pay-chip pay-' + s + '">' + PAY_TXT[s] + '</span>'; }
function payFilterKey(o){ var s = payState(o); return s === 'rejected' ? 'unpaid' : s; }
function payVerifyCount(){ return getAllOrders().filter(function(o){ return payState(o) === 'verify'; }).length; }
function upiLink(amount, orderId){
  var enc = encodeURIComponent;
  return 'upi://pay?pa=' + enc(SETTINGS.upiId) + '&pn=' + enc(SETTINGS.upiName || SETTINGS.shopName || 'Shop') + '&am=' + Number(amount).toFixed(2) + '&cu=INR&tn=' + enc('Order ' + orderId);
}
function utrUsedElsewhere(utr, orderId){
  var u = String(utr || '').toUpperCase(); if(!u) return false;
  return getAllOrders().some(function(o){ return o.id !== orderId && o.payClaim && String(o.payClaim.utr || '').toUpperCase() === u; });
}
(function(){ if(document.getElementById('acPayCss')) return; var st = document.createElement('style'); st.id = 'acPayCss';
  st.textContent = [
  '.tab-count{display:inline-block;min-width:18px;padding:0 6px;margin-left:6px;border-radius:99px;background:#d93025;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center;vertical-align:middle}',
  '.pay-chip{display:inline-block;border-radius:99px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap}',
  '.pay-paid{background:#e4f5ea;color:#1e7b46}.pay-partial{background:#fff3d6;color:#8a5a00}.pay-verify{background:#e7f0ff;color:#2b4f9e}',
  '.pay-unpaid,.pay-rejected{background:#fde8e8;color:#b23b3b}.pay-later{background:#eceff4;color:#52607a}',
  '.pay-block{background:#f7f9fd;border:1px solid #dbe4f4;border-radius:12px;padding:10px 12px;margin-top:10px;font-size:13px}',
  '.pay-block .pb-row{display:flex;justify-content:space-between;padding:2px 0}.pay-block .pb-msg{margin-top:6px;font-size:12.5px;color:#44506a}',
  '.pay-choice{border:1.5px solid #dbe4f4;border-radius:12px;padding:8px 10px;margin:6px 0 8px;background:#fafcff}.pay-choice .pc-t{font-weight:700;font-size:12.5px;margin-bottom:6px}',
  '.pay-choice .pc-seg{display:flex;gap:6px}.pay-choice .pc-opt{flex:1;margin:0;position:relative;text-align:center;border:1.5px solid #d3d9e6;border-radius:10px;padding:7px 4px;cursor:pointer;font-size:13px;font-weight:700;line-height:1.2;background:#fff;color:#17325c;display:block}',
  '.pay-choice .pc-opt input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}.pay-choice .pc-opt small{display:block;font-weight:500;font-size:10.5px;color:#6b7280;margin-top:1px}',
  '.pay-choice .pc-opt.on{border-color:#17325c;background:#17325c;color:#fff}.pay-choice .pc-opt.on small{color:#cfd9ee}.pay-choice .pc-note{font-size:11.5px;color:#52607a;margin-top:6px}',
  '.acpay-ov{position:fixed;inset:0;z-index:20050;background:rgba(10,19,34,.6);display:flex;align-items:flex-end;justify-content:center}',
  '.acpay-sheet{background:#fff;width:100%;max-width:460px;max-height:94vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom))}',
  '@media(min-width:620px){.acpay-ov{align-items:center}.acpay-sheet{border-radius:20px}}',
  '.acpay-sheet h3{margin:0 0 2px;font-size:18px}.acpay-sheet .sub{font-size:12.5px;color:#6b7280}',
  '.acpay-amt{font-size:30px;font-weight:800;color:#17325c;margin:6px 0}.acpay-qr{display:flex;justify-content:center;margin:8px 0}',
  '.acpay-sheet label.l{display:block;font-size:12px;font-weight:600;color:#4b5563;margin:10px 0 4px}',
  '.acpay-sheet input,.acpay-sheet select,.acpay-sheet textarea{width:100%;padding:10px 12px;border:1.5px solid #d8dbe3;border-radius:10px;font-size:16px}',
  '.acpay-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.acpay-row>*{flex:1}',
  '.acpay-btn{border:0;border-radius:12px;padding:12px 14px;font-weight:700;background:#17325c;color:#fff;font-size:14px;cursor:pointer;text-align:center;text-decoration:none;display:inline-block}',
  '.acpay-btn.gold{background:#c9a24b;color:#241c05}.acpay-btn.ghost{background:#fff;color:#17325c;border:1.5px solid #cdd6e6}.acpay-btn.red{background:#b23b3b}.acpay-btn.green{background:#1e7b46}.acpay-btn:disabled{opacity:.5}',
  '.acpay-err{color:#b23b3b;font-size:12.5px;min-height:16px;margin-top:6px}.acpay-hist{font-size:12px;color:#52607a;margin-top:6px}'
  ].join('\n'); document.head.appendChild(st); })();
function paySheet(html){ paySheetClose(); var w = document.createElement('div'); w.id = 'acPaySheet'; w.className = 'acpay-ov'; w.innerHTML = '<div class="acpay-sheet">' + html + '</div>'; w.addEventListener('mousedown', function(e){ if(e.target === w) paySheetClose(); }); document.body.appendChild(w); return w; }
function paySheetClose(){ var w = document.getElementById('acPaySheet'); if(w) w.remove(); }

/* ---- checkout: Pay now / Pay later ---- */
function payChoiceModes(){ var m = []; if(!nowOn()) return m; m.push('now'); if(laterOn()) m.push('later'); return m; }   // nothing to pay with yet -> the old behaviour, no choice shown
var PAY_NOTES = { now: 'A QR code and an “Open UPI app” button appear right after you place the order.', nowBank: 'Our bank details appear right after you place the order — pay, then enter the reference number.', later: 'The amount is added to your account balance. Pay any time from My Orders.' };
function payNoteFor(k){ return k === 'now' && !(upiOn() || qrImageOn()) ? PAY_NOTES.nowBank : PAY_NOTES[k]; }
function payChoiceHtml(){
  var modes = payChoiceModes(); if(!modes.length) return '';
  if(modes.indexOf(CART_PAY_MODE) < 0) CART_PAY_MODE = modes[0];
  var btn = function(k, label){ return '<label class="pc-opt' + (CART_PAY_MODE === k ? ' on' : '') + '" data-pcnote="' + esc(payNoteFor(k)) + '"><input type="radio" name="acPayMode" value="' + k + '"' + (CART_PAY_MODE === k ? ' checked' : '') + '>' + label + '</label>'; };
  return '<div class="pay-choice"><div class="pc-t">💳 How would you like to pay?</div><div class="pc-seg">' +
    (modes.indexOf('now') >= 0 ? btn('now', '📱 Pay now<small>' + (upiOn() || qrImageOn() ? 'UPI' : 'bank transfer') + '</small>') : '') + (modes.indexOf('later') >= 0 ? btn('later', '🕒 Pay later<small>on account</small>') : '') +
    '</div><div class="pc-note">' + esc(payNoteFor(CART_PAY_MODE)) + '</div></div>';
}
function payChoiceMode(){ var m = payChoiceModes(); if(!m.length) return null; return m.indexOf(CART_PAY_MODE) >= 0 ? CART_PAY_MODE : m[0]; }

/* ---- after the order is placed: ask how the dealer wants to pay ---- */
function askPayAfterOrder(orderId){
  var o = findOrder(orderId); if(!o || o.status === 'cancelled') return;
  var modes = payChoiceModes(); if(!modes.length) return;
  var w = paySheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>✅ Order placed</h3><div class="sub">#' + esc(o.id) + '</div></div><button type="button" class="acpay-btn ghost" id="apAskX" style="flex:none;padding:6px 12px" aria-label="Close">✕</button></div>' +
    '<div class="acpay-amt">' + money(orderPayable(o)) + '</div><div style="font-weight:700;margin-bottom:4px">💳 How would you like to pay?</div>' +
    '<div class="acpay-row">' + '<button type="button" class="acpay-btn green" id="apAskNow">📱 Pay now<br><span style="font-weight:500;font-size:11px">' + (upiOn() || qrImageOn() ? 'UPI / QR' : 'bank transfer') + '</span></button>' +
    (modes.indexOf('later') >= 0 ? '<button type="button" class="acpay-btn ghost" id="apAskLater">🕒 Pay later<br><span style="font-weight:500;font-size:11px">on account</span></button>' : '') + '</div>' +
    '<div class="sub" style="margin-top:8px">You can also pay any time from My Orders.</div>');
  var pick = function(mode){ var f = findOrder(orderId); if(f){ f.payMode = mode; saveOrder(f); } paySheetClose(); if(mode === 'now') openPaySheet(orderId); else showToast('Okay — pay whenever you are ready'); if(typeof renderOrdersView === 'function' && !adminSession && currentView === 'orders') renderOrdersView(); };
  w.querySelector('#apAskX').onclick = paySheetClose;
  w.querySelector('#apAskNow').onclick = function(){ pick('now'); };
  var lb = w.querySelector('#apAskLater'); if(lb) lb.onclick = function(){ pick('later'); };
}

/* ---- dealer: order card block + pay sheet ---- */
function payDealerBlockHtml(o){
  var s = payState(o); if(s === 'cancelled') return '';
  var due = orderPayable(o), paid = orderPaid(o), bal = orderBalance(o), cl = o.payClaim || {};
  var msg = s === 'verify' ? 'You told us you paid ' + money(cl.amount) + (cl.utr ? ' (ref ' + esc(cl.utr) + ')' : '') + '. We will confirm once we see it in our account.' :
            s === 'rejected' ? '⚠ We could not find that payment' + (cl.reason ? ' — ' + esc(cl.reason) : '') + '. Please check the reference and send it again.' :
            s === 'paid' ? 'Thank you — payment received.' : s === 'later' ? 'You chose to pay later. Pay whenever you are ready.' : '';
  var canPay = bal > 0 && nowOn();
  return '<div class="pay-block"><div class="pb-row"><span>Payable</span><b>' + money(due) + '</b></div>' +
    (paid > 0 ? '<div class="pb-row"><span>Received</span><b style="color:#1e7b46">' + money(paid) + '</b></div>' : '') +
    (bal > 0 ? '<div class="pb-row"><span>Balance</span><b style="color:#b23b3b">' + money(bal) + '</b></div>' : '') +
    (msg ? '<div class="pb-msg">' + msg + '</div>' : '') +
    (canPay ? '<button type="button" class="btn-royal" style="margin-top:8px;padding:9px 14px;font-size:13.5px" data-pay-open="' + esc(o.id) + '">' + (s === 'verify' ? '✏ Update payment details' : '💳 Pay ' + money(bal) + ' now') + '</button>' : '') + '</div>';
}
function openPaySheet(orderId){
  var o = findOrder(orderId); if(!o) return;
  var bal = orderBalance(o); if(bal <= 0){ showToast('This order is already paid ✔'); return; }
  var cl = o.payClaim && o.payClaim.status !== 'confirmed' ? o.payClaim : {};
  var hasUpi = !!SETTINGS.upiId, img = qrImageOn(), link = hasUpi ? upiLink(bal, o.id) : '';
  var qrHtml = img ? '<div class="acpay-qr"><img src="' + esc(SETTINGS.qrImage) + '" alt="Payment QR" style="max-width:250px;width:100%;max-height:250px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;background:#fff"></div><div class="sub" style="text-align:center">Scan with any UPI app and pay <b>' + money(bal) + '</b> (type this amount).</div>'
    : hasUpi ? '<div class="acpay-qr" id="apyQr"></div><div class="sub" style="text-align:center">Scan with any UPI app (GPay, PhonePe, Paytm…) — the amount is filled in for you.</div>' : '';
  paySheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>Pay for order #' + esc(o.id) + '</h3><div class="sub">' + esc(SETTINGS.upiName || SETTINGS.shopName || '') + '</div></div><button type="button" class="acpay-btn ghost" id="apyX" style="flex:none;padding:6px 12px">✕</button></div>' +
    '<div class="acpay-amt">' + money(bal) + '</div>' + qrHtml +
    (hasUpi ? '<div class="acpay-row"><a class="acpay-btn gold" href="' + esc(link) + '" id="apyOpen">📱 Open UPI app</a><button type="button" class="acpay-btn ghost" id="apyCopy">Copy UPI ID</button></div><div class="sub" style="text-align:center;margin-top:6px">UPI ID: <b>' + esc(SETTINGS.upiId) + '</b></div>' : '') +
    (SETTINGS.payNote ? '<div class="pay-block" style="white-space:pre-line">' + esc(SETTINGS.payNote) + '</div>' : '') +
    '<div style="border-top:1px solid #eee;margin-top:14px;padding-top:6px"><b>After you have paid</b><div class="sub">Enter the reference number (UTR / transaction ID) shown in your UPI app, so we can match it.</div></div>' +
    '<label class="l">Amount you paid (₹)</label><input id="apyAmt" type="number" inputmode="decimal" min="1" step="any" value="' + (cl.amount || bal) + '">' +
    '<label class="l">UTR / reference no. *</label><input id="apyUtr" autocapitalize="characters" autocomplete="off" placeholder="e.g. 412345678901" value="' + esc(cl.utr || '') + '">' +
    '<label class="l">Paid via</label><select id="apyVia">' + ['UPI', 'Bank transfer', 'Cash'].map(function(m){ return '<option value="' + m + '"' + (cl.via === m ? ' selected' : '') + '>' + (m === 'Bank transfer' ? 'Bank transfer (NEFT / IMPS)' : m === 'Cash' ? 'Cash handed over' : m) + '</option>'; }).join('') + '</select>' +
    '<label class="l">Note (optional)</label><input id="apyNote" value="' + esc(cl.note || '') + '">' +
    '<div class="acpay-err" id="apyErr"></div><div class="acpay-row"><button type="button" class="acpay-btn ghost" id="apyLater">Pay later</button><button type="button" class="acpay-btn green" id="apySend">✔ I have paid</button></div>');
  var $ = function(id){ return document.getElementById(id); };
  if(hasUpi && !img){ try{ renderQRInto('apyQr', link, 190); }catch(e){} }
  if(hasUpi) $('apyCopy').onclick = function(){ try{ navigator.clipboard.writeText(SETTINGS.upiId); showToast('UPI ID copied'); }catch(e){ prompt('Copy this UPI ID', SETTINGS.upiId); } };
  $('apyX').onclick = paySheetClose; $('apyLater').onclick = paySheetClose;
  $('apySend').onclick = function(){
    var btn = $('apySend'), amt = r2($('apyAmt').value), utr = $('apyUtr').value.trim().replace(/\s+/g, ''), err = $('apyErr'); err.textContent = '';
    if(btn.disabled) return;
    if(!(amt > 0)){ err.textContent = 'Enter the amount you paid.'; return; }
    if(amt > bal + 1){ err.textContent = 'That is more than the balance (' + money(bal) + ').'; return; }
    if($('apyVia').value !== 'Cash' && !/^[A-Za-z0-9\-]{6,30}$/.test(utr)){ err.textContent = 'Enter the UTR / reference number (6–30 letters or numbers).'; return; }
    if(utr && utrUsedElsewhere(utr, o.id) && !confirm('This reference number was already used on another order. Send anyway?')) return;
    var fresh = findOrder(o.id); if(!fresh) return;
    if(orderBalance(fresh) <= 0){ paySheetClose(); showToast('This order is already paid ✔'); return; }
    btn.disabled = true;
    fresh.payMode = fresh.payMode || 'now';
    fresh.payClaim = { status: 'pending', via: $('apyVia').value, utr: utr, amount: amt, note: $('apyNote').value.trim(), at: Date.now() };
    saveOrder(fresh); paySheetClose(); showToast('Thanks! We will confirm your payment shortly.');
    var ph = String(SETTINGS.shopPhone || '').replace(/\D/g, ''); if(ph.length === 10) ph = '91' + ph;
    if(ph && confirm('Also send this payment note to us on WhatsApp? (optional, speeds things up)')) window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent('Payment sent for order #' + fresh.id + ': ' + money(amt) + ' via ' + $('apyVia').value + (utr ? ', ref ' + utr : '')), '_blank');
    if(typeof renderOrdersView === 'function' && !adminSession) renderOrdersView();
  };
}

/* ---- admin: payment panel in the order details — set status, confirm / reject a dealer's claim ---- */
function adminPayPanelHtml(o){
  if(o.status === 'cancelled') return '';
  var s = payState(o), due = orderPayable(o), paid = orderPaid(o), bal = orderBalance(o), cl = o.payClaim || {}, cur = payStatusForSelect(o);
  var claim = (cl.status === 'pending') ? '<div class="pay-block" style="background:#eef3ff;border-color:#c9d8ff"><b>⏳ Dealer says he paid ' + money(cl.amount) + '</b>' + (cl.via ? ' via ' + esc(cl.via) : '') + '<div class="pb-msg">Reference: <b>' + esc(cl.utr || '—') + '</b> · ' + new Date(cl.at || 0).toLocaleString('en-IN') + (cl.note ? '<br>Note: ' + esc(cl.note) : '') +
    (utrUsedElsewhere(cl.utr, o.id) ? '<br><b style="color:#b23b3b">⚠ This reference number appears on another order.</b>' : '') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn-admin sm" data-pay-confirm="' + esc(o.id) + '">✔ Confirm received (mark Paid)</button><button type="button" class="btn-admin sm maroon" data-pay-reject="' + esc(o.id) + '">✕ Not received</button></div></div>' : '';
  return '<div class="pay-block" style="margin:8px 12px" data-pay-oid="' + esc(o.id) + '"><div style="display:flex;justify-content:space-between;align-items:center"><b>💳 Payment</b>' + payChipHtml(o) + '</div>' +
    '<div class="pb-row"><span>Payable</span><b>' + money(due) + '</b></div><div class="pb-row"><span>Received</span><b style="color:#1e7b46">' + money(paid) + '</b></div><div class="pb-row"><span>Balance</span><b style="color:' + (bal > 0 ? '#b23b3b' : '#1e7b46') + '">' + money(bal) + '</b></div>' +
    '<div class="pb-msg">Dealer chose: <b>' + (o.payMode === 'later' ? 'Pay later' : o.payMode === 'now' ? 'Pay now' : '—') + '</b></div>' + claim +
    '<div class="acpay-row" style="margin-top:12px"><button type="button" class="acpay-btn green" data-pay-quick="paid" data-pay-for="' + esc(o.id) + '">✔ Mark Paid</button><button type="button" class="acpay-btn red" data-pay-quick="unpaid" data-pay-for="' + esc(o.id) + '">✕ Mark Not paid</button></div>' +
    '<div class="sub" style="margin-top:10px">Part payment? Choose it below and enter the amount received.</div>' +
    '<div class="acpay-row" style="align-items:flex-end;margin-top:4px"><div style="flex:1 1 140px"><label class="l" style="margin-top:0">Payment status</label>' +
      '<select data-pay-sel="' + esc(o.id) + '">' + PAY_STATUS_LIST.map(function(x){ return '<option value="' + x[0] + '"' + (cur === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
      '<div style="flex:1 1 130px;' + (cur === 'partial' ? '' : 'display:none') + '" data-pay-amtbox><label class="l" style="margin-top:0">Amount received (₹)</label><input type="number" min="1" step="any" data-pay-amt value="' + (cur === 'partial' && paid > 0 ? paid : '') + '"></div>' +
      '<div style="flex:0 0 auto"><button type="button" class="btn-admin sm" data-pay-save="' + esc(o.id) + '">Save</button></div></div>' +
    ((o.payHistory || []).length ? '<div class="acpay-hist"><b>Log</b><br>' + o.payHistory.map(function(h){ return '• ' + new Date(h.at).toLocaleString('en-IN') + ' — ' + esc(h.action) + (h.amount ? ' ' + money(h.amount) : '') + (h.utr ? ' (ref ' + esc(h.utr) + ')' : '') + (h.by ? ' · ' + esc(h.by) : '') + (h.note ? ' — ' + esc(h.note) : ''); }).join('<br>') + '</div>' : '') + '</div>';
}
/* admin: the payment section opens as a pop-up (button sits next to Invoice in the order details) */
function openAdminPaySheet(orderId){
  var o = findOrder(orderId); if(!o || o.status === 'cancelled') return;
  var w = paySheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>💳 Payment</h3><div class="sub">Order #' + esc(o.id) + ' · ' + esc(o.dealerBusiness || o.dealerGst) + '</div></div><button type="button" class="acpay-btn ghost" id="apPayX" style="flex:none;padding:6px 12px">✕</button></div>' + adminPayPanelHtml(o).replace('style="margin:8px 12px"', 'style="margin:10px 0 0"'));
  w.querySelector('#apPayX').onclick = paySheetClose;
}
function payAdminName(){ return (window.AC_CLOUD && AC_CLOUD.staffName) || localStorage.getItem('ac_admin_user') || 'admin'; }
/* The one place that changes an order's payment status (admin only). */
function adminSetPayment(orderId, status, amount, note, actionLabel){
  var o = findOrder(orderId); if(!o) return false;
  var due = orderPayable(o), amt = r2(amount);
  if(PAY_STATUS_LIST.every(function(x){ return x[0] !== status; })) return false;
  if(status === 'partial'){
    if(!(amt > 0)){ showToast('Enter the amount received'); return false; }
    if(amt >= due - 0.5) status = 'paid';
  }
  o.paymentStatus = status;
  if(status === 'partial') o.paidAmount = amt; else delete o.paidAmount;
  if(o.payClaim && o.payClaim.status === 'pending'){
    o.payClaim.status = status === 'unpaid' ? 'rejected' : 'confirmed';
    if(status === 'unpaid') o.payClaim.reason = 'Marked unpaid by admin';
  }
  var label = actionLabel || ('Marked ' + (status === 'paid' ? 'Paid' : status === 'partial' ? 'Part paid' : 'Unpaid'));
  o.payHistory = (o.payHistory || []).concat([{ at: Date.now(), by: payAdminName(), action: label, amount: status === 'partial' ? amt : (status === 'paid' ? due : 0), note: note || '' }]);
  saveOrder(o); logAudit('Payment status', '#' + o.id + ' → ' + status + (status === 'partial' ? ' (' + money(amt) + ')' : ''));
  paySheetClose(); showToast('Payment status saved ✔'); if(adminSession) renderAdminOrders();
  return true;
}
function payRejectClaim(orderId){
  var o = findOrder(orderId); if(!o || !o.payClaim) return;
  var why = prompt('Why was it not received? (shown to the dealer, optional)', 'Not seen in our account yet'); if(why === null) return;
  o.payClaim.status = 'rejected'; o.payClaim.reason = why;
  o.payHistory = (o.payHistory || []).concat([{ at: Date.now(), by: payAdminName(), action: 'Marked not received', amount: o.payClaim.amount, utr: o.payClaim.utr, note: why }]);
  saveOrder(o); logAudit('Payment not received', '#' + o.id + (o.payClaim.utr ? ' · ref ' + o.payClaim.utr : '')); paySheetClose(); showToast('Dealer will see it as not received'); if(adminSession) renderAdminOrders();
}
/* red number on the admin "Orders" tab = orders that have been received (placed) and are waiting to be confirmed */
var ORDERS_BADGE_LAST = null;
function newOrderCount(){ return getAllOrders().filter(function(o){ return o.status === 'placed'; }).length; }
function updatePayBadge(){
  var b = document.querySelector('.admin-tabs button[data-atab="orders"]'); if(!b) return;
  var n = newOrderCount(), c = b.querySelector('.tab-count');
  if(n > 0){ if(!c){ c = document.createElement('span'); c.className = 'tab-count'; b.appendChild(c); } c.textContent = n > 99 ? '99+' : String(n); b.title = n + ' new order' + (n === 1 ? '' : 's') + ' waiting'; }
  else if(c){ c.remove(); b.removeAttribute('title'); }
  if(ORDERS_BADGE_LAST !== null && n > ORDERS_BADGE_LAST && adminSession) showToast('🧾 New order received');
  ORDERS_BADGE_LAST = n;
}
document.addEventListener('click', function(e){
  var t = e.target.closest ? e.target.closest('[data-pay-open],[data-pay-confirm],[data-pay-reject],[data-pay-save],[data-pay-popup],[data-pay-quick],[data-payfilter]') : null; if(!t) return;
  var v;
  if((v = t.getAttribute('data-pay-open'))){ e.stopPropagation(); openPaySheet(v); }
  else if((v = t.getAttribute('data-pay-popup'))){ e.stopPropagation(); openAdminPaySheet(v); }
  else if((v = t.getAttribute('data-pay-quick'))){ e.stopPropagation(); adminSetPayment(t.getAttribute('data-pay-for'), v, 0, ''); }
  else if((v = t.getAttribute('data-pay-confirm'))){ e.stopPropagation(); adminSetPayment(v, 'paid', 0, '', 'Confirmed received'); }
  else if((v = t.getAttribute('data-pay-save'))){
    e.stopPropagation();
    var box = t.closest('[data-pay-oid]'); if(!box) return;
    var sel = box.querySelector('[data-pay-sel]'), amt = box.querySelector('[data-pay-amt]');
    adminSetPayment(v, sel.value, amt ? amt.value : 0, '');
  }
  else if((v = t.getAttribute('data-pay-reject'))){ e.stopPropagation(); payRejectClaim(v); }
  else if((v = t.getAttribute('data-payfilter'))){ ORDER_UI.pay = ORDER_UI.pay === v ? 'all' : v; ORDER_UI.page = 1; renderAdminOrders(); }
}, true);
document.addEventListener('change', function(e){
  var t = e.target;
  if(t && t.name === 'acPayMode'){ CART_PAY_MODE = t.value; var box = t.closest('.pay-choice'); if(box){ box.querySelectorAll('label').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); var nt = box.querySelector('.pc-note'); if(nt) nt.textContent = payNoteFor(t.value) || ''; } }
  else if(t && t.id === 'ordPayFilter'){ ORDER_UI.pay = t.value; ORDER_UI.page = 1; renderAdminOrders(); }
  else if(t && t.hasAttribute && t.hasAttribute('data-pay-sel')){ var bx = t.closest('[data-pay-oid]'), ab = bx && bx.querySelector('[data-pay-amtbox]'); if(ab) ab.style.display = t.value === 'partial' ? '' : 'none'; }
});
setInterval(function(){ if(adminSession) updatePayBadge(); }, 5000);

/* ================= Dealer tools: quick order (paste a list), cart nudges, quote maker =================
   Everything here runs in the browser on data the app already loaded — ZERO extra Firestore reads or writes,
   so it is completely free-plan friendly. (Quote numbers / margin are remembered on the device only.) */
(function(){ if(document.getElementById('acToolsCss')) return; var st = document.createElement('style'); st.id = 'acToolsCss';
  st.textContent = [
  '.nudge{background:#fff8e1;border:1px solid #f2dc9b;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:12.5px;display:flex;gap:8px;align-items:center;justify-content:space-between}',
  '.nudge button{border:0;background:#17325c;color:#fff;border-radius:8px;padding:5px 10px;font-weight:700;font-size:12px;white-space:nowrap;cursor:pointer}',
  '.nd-box{margin:8px 0;padding:8px 10px;border:1px solid #e2e8f4;border-radius:10px;font-size:12.5px;background:#fbfcfe}',
  '.nd-bar{height:8px;background:#e8ecf4;border-radius:99px;overflow:hidden;margin:5px 0}.nd-bar i{display:block;height:100%;background:linear-gradient(90deg,#c9a24b,#e6c878);transition:width .4s}',
  '.nd-bar.red i{background:#b23b3b}.nd-bar.green i{background:#1e7b46}.nd-bar.amber i{background:#d9962b}',
  '.acpay-sheet.wide{max-width:700px}.cart-extras{margin-top:8px}',
  '.qo-row{border:1px solid #e6dfcb;border-radius:12px;padding:8px 10px;margin-bottom:8px;background:#fff}.qo-row.bad{border-color:#f0c4c4;background:#fff8f8}.qo-row.off{opacity:.55}',
  '.qo-raw{font-size:11.5px;color:#6b7280;margin-bottom:4px;word-break:break-word}.qo-line{display:flex;gap:6px;align-items:center}.qo-line select{flex:1;min-width:0;padding:8px}.qo-line input[type=number]{width:72px;padding:8px}',
  '.qo-hint{font-size:11.5px;color:#52607a;margin-top:3px}.qo-res{margin-top:4px}.qo-res button{display:block;width:100%;text-align:left;border:1px solid #e1e6f0;background:#fff;border-radius:8px;padding:7px 9px;margin-top:3px;font-size:12.5px;cursor:pointer}',
  '.qt-item{display:grid;grid-template-columns:1fr auto;gap:4px 8px;border-top:1px solid #eef0f5;padding:8px 0}.qt-item input{width:84px;padding:7px;text-align:right}.qt-sub{font-size:11.5px;color:#6b7280}',
  '.qt-priv{background:#f3f9f5;border:1px dashed #9fd2b2;border-radius:10px;padding:8px 10px;font-size:12.5px;margin-top:8px}',
  '.qt-sec{border:1px solid #e6e9f2;border-radius:12px;padding:10px 12px;margin-top:10px;background:#fcfdff}',
  '.qt-chk{display:flex;gap:8px;align-items:center;margin:8px 0 0;font-size:13px;cursor:pointer}.qt-chk input{width:18px;height:18px;flex:none;padding:0}',
  '.qt-logo{width:132px;height:68px;border:1.5px dashed #c5cde0;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff;overflow:hidden}.qt-logo img{max-width:100%;max-height:100%;object-fit:contain;display:block}',
  '.qt-note{background:#f3f9f5;border:1px solid #bfe0cb;border-radius:10px;padding:10px 12px;font-size:12.5px;margin-top:10px}.qt-note a{color:#fff;text-decoration:none}'
  ].join('\n'); document.head.appendChild(st); })();
function toolSheet(html, wide){ var w = paySheet(html); if(wide && w.firstChild) w.firstChild.classList.add('wide'); return w; }
function $t(id){ return document.getElementById(id); }
function productDeepText(p){          /* name + size + part + ALL spec values of a catalog-card item, so "75 mm Heavy" can match */
  var t = [p.name, p.size, p.part, p.cat];
  if(p.isCatalogVariant){
    var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; }), v = g && (g.variants || []).find(function(x){ return x.id === p.variantId; });
    if(g && v) (g.fields || []).forEach(function(f){ t.push((v.values || {})[f.id]); });
  }
  return t.filter(function(x){ return x !== undefined && x !== null && x !== ''; }).join(' ');
}
function orderableProducts(){ return PRODUCTS.filter(function(p){ return p.active !== false || p.isCatalogVariant; }); }
/* ---- tiny fuzzy matcher (numbers weigh more than words, codes match exactly) ---- */
var QO_SYN = { bend: 'elbow', coupling: 'coupler', socket: 'coupler', pc: '', pcs: '', nos: '', no: '', piece: '', pieces: '', x: '', of: '', the: '', and: '', in: 'inch', inches: 'inch' };
function qoTokens(s){
  s = String(s || '').toLowerCase().replace(/[”“″]/g, '"').replace(/(\d)\s*(?:"|''|inch(?:es)?\b|in\b)/g, '$1 inch ').replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9.\/]+/g, ' ');
  return s.split(/\s+/).filter(Boolean).map(function(w){ return QO_SYN[w] !== undefined ? QO_SYN[w] : w; }).filter(Boolean);
}
function buildProductIndex(){
  return orderableProducts().map(function(p){ var toks = qoTokens(productDeepText(p)); return { p: p, toks: toks, set: toks.reduce(function(m, t){ m[t] = 1; return m; }, {}), code: String(p.part || '').toUpperCase().replace(/[^A-Z0-9]/g, '') }; });
}
function qoScore(qt, e){
  var w = 0, m = 0;
  qt.forEach(function(t){
    var wt = /^\d/.test(t) ? 2 : (t.length <= 2 ? 0.5 : 1); w += wt;
    if(e.set[t]) m += wt; else if(t.length >= 4 && e.toks.some(function(h){ return h.length >= 4 && (h.indexOf(t) === 0 || t.indexOf(h) === 0); })) m += wt * 0.7;
  });
  var s = w ? m / w : 0;
  return s - Math.min(0.1, e.toks.length * 0.003);
}
function qoFind(text, idx, max){
  var qt = qoTokens(text), up = String(text || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(function(x){ return x.length >= 5 && /\d/.test(x); });
  var scored = idx.map(function(e){ var s = qoScore(qt, e); if(up.indexOf(e.code) >= 0 && e.code.length >= 5) s = 2; return { p: e.p, s: s }; }).filter(function(x){ return x.s >= 0.34; });
  scored.sort(function(a, b){ return b.s - a.s; });
  return scored.slice(0, max || 4);
}
function qoParseLine(raw){
  var s = String(raw || '').trim(); if(!s) return null;
  s = s.replace(/^[\s\-\*\u2022•]+/, '').replace(/^\d{1,2}[\.\)]\s+/, '');
  var m, qty = null, text = s;
  if((m = /^(\d+)\s*(?:x|×|\*|nos?|pcs?|pieces?|qty)\.?\s+(.+)$/i.exec(s))){ qty = Number(m[1]); text = m[2]; }
  else if((m = /^(.+?)[\s\-:=]*(?:x|×|\*|qty:?)\s*(\d+)\s*(?:nos?|pcs?|pieces?)?$/i.exec(s))){ qty = Number(m[2]); text = m[1]; }
  else if((m = /^(.+?)[\s]*[\-:=]\s*(\d+)\s*(?:nos?|pcs?|pieces?)?$/i.exec(s))){ qty = Number(m[2]); text = m[1]; }
  else if((m = /^(.+?)\s+(\d+)\s*(?:nos?|pcs?|pieces?)$/i.exec(s))){ qty = Number(m[2]); text = m[1]; }
  else if((m = /^(\d+)\s+(?!mm\b|cm\b|inch|in\b|"|kg\b|ltr\b|m\b)(.*[A-Za-z].*)$/i.exec(s)) && Number(m[1]) <= 5000){ qty = Number(m[1]); text = m[2]; }
  if(!qty || qty < 1) qty = 1;
  return { raw: raw.trim(), qty: Math.min(99999, qty), text: text.replace(/\s+/g, ' ').trim() };
}
function qoSplit(text){
  var lines = String(text || '').split(/\r?\n|;/).map(function(x){ return x.trim(); }).filter(Boolean);
  if(lines.length === 1 && /,/.test(lines[0])) lines = lines[0].split(/,(?=\s*[A-Za-z0-9])/).map(function(x){ return x.trim(); }).filter(Boolean);
  return lines.slice(0, 150).map(qoParseLine).filter(Boolean);
}
var QO = { rows: [], idx: null };
function qoOptLabel(p){ var s = effStock(p); return p.name + (p.size && p.name.indexOf(p.size) < 0 ? ' — ' + p.size : '') + ' · ' + p.part + ' · ' + money(finalPrice(p, session, 1)) + (s <= 0 ? ' · OUT OF STOCK' : ''); }
function qoRowHtml(r, i){
  var p = r.sel ? PRODUCTS.find(function(x){ return x.id === r.sel; }) : null;
  var opts = r.cands.map(function(id){ var q = PRODUCTS.find(function(x){ return x.id === id; }); return q ? '<option value="' + q.id + '"' + (q.id === r.sel ? ' selected' : '') + '>' + esc(qoOptLabel(q)) + '</option>' : ''; }).join('');
  var hint = '';
  if(!p) hint = '<span style="color:#b23b3b">Not found — tap 🔍 to search, or skip.</span>';
  else { var s = effStock(p); hint = s <= 0 ? '<span style="color:#b23b3b">Out of stock — will be skipped.</span>' : (r.qty > s ? '<span style="color:#8a5a00">Only ' + s + ' available — that many will be added.</span>' : 'Unit price ' + money(finalPrice(p, session, r.qty)) + ' · line ' + money(finalPrice(p, session, r.qty) * r.qty)); }
  return '<div class="qo-row' + (!p ? ' bad' : '') + (r.on ? '' : ' off') + '" data-qi="' + i + '"><div class="qo-raw">“' + esc(r.raw) + '”</div><div class="qo-line"><input type="checkbox" data-qon="' + i + '"' + (r.on && p ? ' checked' : '') + (p ? '' : ' disabled') + ' style="width:20px;height:20px">' +
    '<select data-qosel="' + i + '"><option value="">— skip this line —</option>' + opts + '</select><input type="number" min="1" data-qoq="' + i + '" value="' + r.qty + '"><button type="button" class="nudge-btn" data-qofind="' + i + '" title="Search another item" style="border:1.5px solid #cdd6e6;background:#fff;border-radius:8px;padding:7px 9px;cursor:pointer">🔍</button></div>' +
    '<div class="qo-hint" data-qohint="' + i + '">' + hint + '</div><div class="qo-res" id="qores' + i + '"></div></div>';
}
function qoTotals(){
  var n = 0, tot = 0;
  QO.rows.forEach(function(r){ if(!r.on || !r.sel) return; var p = PRODUCTS.find(function(x){ return x.id === r.sel; }); if(!p) return; var s = effStock(p); if(s <= 0) return; var q = Math.min(r.qty, s === Infinity ? r.qty : s); n++; tot += finalPrice(p, session, q) * q; });
  return { n: n, tot: tot };
}
function qoPaintFoot(){ var t = qoTotals(), el = $t('qoFoot'), b = $t('qoAdd'); if(el) el.innerHTML = '<b>' + t.n + '</b> item' + (t.n === 1 ? '' : 's') + ' ready · about <b>' + money(t.tot) + '</b>'; if(b) b.disabled = !t.n; }
function openQuickOrder(){
  if(!session){ showToast('Please sign in first'); return; }
  QO.rows = []; QO.idx = null;
  toolSheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>📋 Quick order</h3><div class="sub">Paste your WhatsApp / notebook list — one item per line. We find the items and fill the cart.</div></div><button type="button" class="acpay-btn ghost" id="qoX" style="flex:none;padding:6px 12px">✕</button></div>' +
    '<div id="qoStep1"><label class="l">Your list</label><textarea id="qoText" rows="8" placeholder="10 x 75mm SWR pipe\\n5 elbow 90 deg 4 inch\\n70001838 - 20\\nsolvent cement 2 nos"></textarea><div class="sub" style="margin-top:4px">Works with: “10 x item”, “item - 10”, “item x10”, “10 pcs item”, or an item code.</div><div class="acpay-row"><button type="button" class="acpay-btn gold" id="qoGo">Find my items</button></div></div><div id="qoStep2" style="display:none"></div>', true);
  $t('qoX').onclick = paySheetClose;
  $t('qoGo').onclick = function(){
    var parsed = qoSplit($t('qoText').value); if(!parsed.length){ showToast('Paste at least one line'); return; }
    QO.idx = buildProductIndex();
    QO.rows = parsed.map(function(r){ var c = qoFind(r.text, QO.idx, 4); var best = c.length && c[0].s >= 0.55 ? c[0].p.id : null; return { raw: r.raw, qty: r.qty, cands: c.map(function(x){ return x.p.id; }), sel: best || (c.length ? c[0].p.id : null), on: !!best, text: r.text }; });
    $t('qoStep1').style.display = 'none'; var s2 = $t('qoStep2'); s2.style.display = 'block';
    s2.innerHTML = '<div class="sub" style="margin-bottom:8px">Check each line. Pick the right item from the list, fix the quantity, or skip it.</div><div id="qoRows">' + QO.rows.map(qoRowHtml).join('') + '</div><div class="pay-block" id="qoFoot"></div>' +
      '<div class="acpay-row"><button type="button" class="acpay-btn ghost" id="qoBack">← Edit list</button><button type="button" class="acpay-btn green" id="qoAdd">Add to cart</button></div>';
    qoPaintFoot();
    $t('qoBack').onclick = function(){ $t('qoStep2').style.display = 'none'; $t('qoStep1').style.display = 'block'; };
    $t('qoAdd').onclick = qoAddToCart;
    var rowsEl = $t('qoRows'), repaint = function(i){ var r = QO.rows[i], el = rowsEl.querySelector('[data-qi="' + i + '"]'); if(el) el.outerHTML = qoRowHtml(r, i); qoPaintFoot(); };
    rowsEl.addEventListener('change', function(e){
      var t = e.target, i;
      if((i = t.getAttribute('data-qosel')) !== null){ var r = QO.rows[Number(i)]; r.sel = t.value ? Number(t.value) : null; r.on = !!r.sel; repaint(Number(i)); }
      else if((i = t.getAttribute('data-qon')) !== null){ QO.rows[Number(i)].on = t.checked; repaint(Number(i)); }
    });
    rowsEl.addEventListener('input', function(e){ var t = e.target, i = t.getAttribute('data-qoq'); if(i !== null){ QO.rows[Number(i)].qty = Math.max(1, Math.floor(Number(t.value)) || 1); var h = rowsEl.querySelector('[data-qohint="' + i + '"]'); var r = QO.rows[Number(i)], p = r.sel && PRODUCTS.find(function(x){ return x.id === r.sel; }); if(h && p){ var s = effStock(p); h.innerHTML = s <= 0 ? '<span style="color:#b23b3b">Out of stock — will be skipped.</span>' : (r.qty > s ? '<span style="color:#8a5a00">Only ' + s + ' available — that many will be added.</span>' : 'Unit price ' + money(finalPrice(p, session, r.qty)) + ' · line ' + money(finalPrice(p, session, r.qty) * r.qty)); } qoPaintFoot(); }
      var sq = t.getAttribute('data-qos'); if(sq !== null){ var res = $t('qores' + sq), q = t.value.trim(); if(q.length < 2){ res.innerHTML = ''; return; } var hits = qoFind(q, QO.idx, 6); res.innerHTML = hits.length ? hits.map(function(h){ return '<button type="button" data-qopick="' + sq + ':' + h.p.id + '">' + esc(qoOptLabel(h.p)) + '</button>'; }).join('') : '<div class="qo-hint">No match — try the item code or fewer words.</div>'; } });
    rowsEl.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b) return; var f = b.getAttribute('data-qofind'), pk = b.getAttribute('data-qopick');
      if(f !== null){ var res = $t('qores' + f); res.innerHTML = '<input type="text" data-qos="' + f + '" placeholder="Type name, size or code…" style="width:100%;padding:8px;border:1.5px solid #d8dbe3;border-radius:8px">'; var inp = res.querySelector('input'); if(inp) inp.focus(); }
      else if(pk){ var parts = pk.split(':'), i = Number(parts[0]), id = Number(parts[1]), r = QO.rows[i]; if(r.cands.indexOf(id) < 0) r.cands.unshift(id); r.sel = id; r.on = true; repaint(i); }
    });
  };
}
function qoAddToCart(){
  var cart = getCart(), added = 0, oos = 0, capped = 0, skipped = 0;
  QO.rows.forEach(function(r){
    if(!r.on || !r.sel){ skipped++; return; }
    var p = PRODUCTS.find(function(x){ return x.id === r.sel; }); if(!p){ skipped++; return; }
    var stock = effStock(p); if(stock <= 0){ oos++; return; }
    var cur = cart[p.id] || 0, room = stock === Infinity ? r.qty : Math.max(0, stock - cur), add = Math.min(r.qty, room);
    if(add < r.qty) capped++; if(add > 0){ cart[p.id] = cur + add; added++; }
  });
  saveCart(cart); updateCartBadges(); renderProductGrids(); paySheetClose();
  showToast('Quick order: ' + added + ' item(s) added' + (skipped ? ', ' + skipped + ' skipped' : '') + (oos ? ', ' + oos + ' out of stock' : '') + (capped ? ', ' + capped + ' capped to stock' : ''));
  renderCartPanel(); cartOffcanvas.show();
}

/* ---- cart nudges: free delivery, bulk-price slabs, credit limit, monthly target ---- */
function monthSpend(gst){
  var now = new Date(), y = now.getFullYear(), mo = now.getMonth();
  return r2(getAllOrders().filter(function(o){ var d = new Date(Number(o.createdAt) || 0); return o.dealerGst === gst && o.status !== 'cancelled' && d.getFullYear() === y && d.getMonth() === mo; }).reduce(function(s, o){ return s + orderPayable(o); }, 0));
}
function nudgeBar(pct, cls){ return '<div class="nd-bar ' + (cls || '') + '"><i style="width:' + Math.max(2, Math.min(100, pct)) + '%"></i></div>'; }
function slabNudges(cart){
  var out = [];
  Object.keys(cart).forEach(function(id){
    var p = PRODUCTS.find(function(pp){ return pp.id === Number(id); }); if(!p || !p.bulkTiers || !p.bulkTiers.length) return;
    var qty = cart[id], next = null;
    p.bulkTiers.forEach(function(t){ var mq = Number(t.minQty); if(mq > qty && (!next || mq < Number(next.minQty))) next = t; });
    if(!next) return;
    var mq = Number(next.minQty), need = mq - qty; if(need > Math.max(5, Math.ceil(qty * 0.6))) return;
    if(effStock(p) < mq) return;
    var cur = finalPrice(p, session, qty), nu = finalPrice(p, session, mq), save = r2((cur - nu) * mq);
    if(save <= 0) return;
    out.push({ p: p, need: need, bonus: Number(next.bonusPct) || 0, save: save });
  });
  return out.sort(function(a, b){ return b.save - a.save; }).slice(0, 2);
}
function cartNudgesHtml(cart, total, freeMin, grandTotal){
  var h = '';
  if(freeMin > 0){ var pct = total / freeMin * 100; h += '<div class="nd-box">' + (total >= freeMin ? '🎉 <b>Free delivery unlocked</b>' : '🚚 Add <b>' + money(freeMin - total) + '</b> more for free delivery') + nudgeBar(pct, total >= freeMin ? 'green' : '') + '</div>'; }
  slabNudges(cart).forEach(function(n){ h += '<div class="nudge"><span>💡 Add <b>' + n.need + '</b> more <b>' + esc(n.p.name) + '</b> → extra ' + n.bonus + '% off, you save about <b>' + money(n.save) + '</b></span><button type="button" data-nudge-add="' + n.p.id + '" data-nudge-qty="' + n.need + '">+' + n.need + '</button></div>'; });
  var tg = Number(SETTINGS.monthTarget) || 0;
  if(tg > 0){ var spent = monthSpend(session), now = spent + grandTotal, left = tg - now; h += '<div class="nd-box">🎯 <b>Monthly target</b> ' + money(Math.min(now, tg)) + ' of ' + money(tg) + (left > 0 ? ' — <b>' + money(left) + '</b> to go' : ' — <b>reached! 🎉</b>') + (SETTINGS.monthReward ? '<div class="sub" style="color:#52607a">' + esc(SETTINGS.monthReward) + '</div>' : '') + nudgeBar(now / tg * 100, now >= tg ? 'green' : '') + '</div>'; }
  return h;
}
function monthlyCardHtml(){
  var tg = Number(SETTINGS.monthTarget) || 0; if(!(tg > 0) || !session) return '';
  var spent = monthSpend(session), left = tg - spent;
  return '<div class="account-card mb-3"><div class="ac-title" style="font-weight:700;margin-bottom:6px">🎯 This month</div><div class="ac-row"><span class="ac-label">Ordered</span><span class="ac-val">' + money(spent) + ' of ' + money(tg) + '</span></div>' + nudgeBar(spent / tg * 100, spent >= tg ? 'green' : '') +
    '<div class="ac-sub">' + (left > 0 ? money(left) + ' more to reach your monthly target.' : '🎉 Target reached!') + (SETTINGS.monthReward ? ' ' + esc(SETTINGS.monthReward) : '') + '</div></div>';
}
document.addEventListener('click', function(e){
  var b = e.target.closest ? e.target.closest('[data-nudge-add]') : null; if(!b) return;
  var id = Number(b.getAttribute('data-nudge-add')), n = Number(b.getAttribute('data-nudge-qty')) || 1, p = PRODUCTS.find(function(x){ return x.id === id; }); if(!p) return;
  var c = getCart(), stock = effStock(p), cur = c[id] || 0; c[id] = stock === Infinity ? cur + n : Math.min(stock, cur + n); saveCart(c); updateCartBadges(); renderProductGrids(); renderCartPanel();
}, true);

/* ---- quote maker: the dealer's own price quote for HIS customer ----
   Output is a PDF only (made in the browser with the bundled jsPDF — nothing is uploaded anywhere).
   Everything it remembers (logo, last settings) stays in THIS browser's localStorage; none of it is synced to the cloud. */
var QT = { items: [], margin: 0, round: 0, customer: '', phone: '', notes: '', days: 7, gstMode: 'incl', deliveryOn: false, delivery: 0, discOn: false, discType: 'flat', discValue: 0, watermark: false, no: null };
function qtPrefs(){ try{ return JSON.parse(localStorage.getItem('ac_quote_prefs_' + session) || '{}') || {}; }catch(e){ return {}; } }
function qtSavePrefs(){ try{ localStorage.setItem('ac_quote_prefs_' + session, JSON.stringify({ round: QT.round, days: QT.days, gstMode: QT.gstMode, notes: QT.notes, watermark: QT.watermark })); }catch(e){} }
function qtLogo(){ try{ var l = JSON.parse(localStorage.getItem('ac_quote_logo_' + session) || 'null'); return l && l.d && l.w > 0 && l.h > 0 ? l : null; }catch(e){ return null; } }
function qtSaveLogo(l){ try{ if(l) localStorage.setItem('ac_quote_logo_' + session, JSON.stringify(l)); else localStorage.removeItem('ac_quote_logo_' + session); return true; }catch(e){ return false; } }
function qtNum(v){ var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
function qtProd(id){ return PRODUCTS.find(function(x){ return x.id === id; }); }
function qtRound(v){ var s = Number(QT.round) || 0; return s > 0 ? Math.ceil(v / s - 1e-9) * s : r2(v); }
function qtCost(it){ var p = qtProd(it.id); return p ? finalPrice(p, session, it.qty) : 0; }
function qtRecalc(){ QT.items.forEach(function(it){ if(!it.manual) it.price = qtRound(qtCost(it) * (1 + QT.margin / 100)); }); }
function qtItemName(p){ return p.name + (p.size && p.name.indexOf(p.size) < 0 ? ' (' + p.size + ')' : ''); }

/* One place that does all the quote arithmetic (screen summary AND pdf use it).
   Prices are GST-inclusive. The discount is spread over the GST rates in proportion to their value, and every figure is rounded
   to paise so that the rows always add up exactly to the total. */
function qtCalc(){
  var lines = [], sumG = 0, cost = 0;
  QT.items.forEach(function(it){
    var p = qtProd(it.id); if(!p) return;
    var price = qtNum(it.price), qty = Math.max(1, Math.floor(Number(it.qty)) || 1), g = r2(price * qty);
    lines.push({ it: it, p: p, qty: qty, price: price, gross: g, rate: Number(p.gstPct) || 0, cost: qtCost(it) });
    sumG += g; cost += qtCost(it) * qty;
  });
  sumG = r2(sumG); cost = r2(cost);
  var D = 0, capped = false;
  if(QT.discOn){
    var v = qtNum(QT.discValue);
    if(QT.discType === 'pct'){ if(v > 100){ v = 100; capped = true; } D = sumG * v / 100; }
    else { if(v > sumG){ v = sumG; capped = true; } D = v; }
  }
  D = r2(D);
  var net = r2(sumG - D), rates = [], gross = {};
  lines.forEach(function(l){ if(gross[l.rate] === undefined){ gross[l.rate] = 0; rates.push(l.rate); } gross[l.rate] = r2(gross[l.rate] + l.gross); });
  rates.sort(function(a, b){ return a - b; });
  var gstBy = [], allocD = 0, itemsEx = 0, taxable = 0, gstTotal = 0;
  rates.forEach(function(r, i){
    var G = gross[r], Dr = i === rates.length - 1 ? r2(D - allocD) : r2(sumG > 0 ? D * G / sumG : 0);
    Dr = Math.min(G, Math.max(0, Dr)); allocD = r2(allocD + Dr);
    var netR = r2(G - Dr), tx = r2(netR / (1 + r / 100)), gs = r2(netR - tx), exG = r2(G / (1 + r / 100));
    itemsEx = r2(itemsEx + exG); taxable = r2(taxable + tx); gstTotal = r2(gstTotal + gs);
    gstBy.push({ rate: r, taxable: tx, gst: gs });
    var inRate = lines.filter(function(l){ return l.rate === r; }), acc = 0;     // line amounts (ex-GST) add up exactly to exG
    inRate.forEach(function(l, k){ l.exAmt = k === inRate.length - 1 ? r2(exG - acc) : r2(l.gross / (1 + r / 100)); acc = r2(acc + l.exAmt); l.exRate = r2(l.price / (1 + r / 100)); });
  });
  var delivery = QT.deliveryOn ? r2(qtNum(QT.delivery)) : 0, grand = r2(net + delivery), profit = r2(net - cost);
  return { lines: lines, sumG: sumG, disc: D, capped: capped, net: net, itemsEx: itemsEx, discEx: r2(itemsEx - taxable), taxable: taxable, gstTotal: gstTotal, gstBy: gstBy,
           delivery: delivery, grand: grand, cost: cost, profit: profit, pct: cost > 0 ? r2(profit / cost * 100) : 0 };
}
function qtMeta(){
  var u = getUsers()[session] || {}, d = new Date(), vt = new Date(Date.now() + QT.days * 86400000);
  var f = function(x){ return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
  return { u: u, date: f(d), valid: f(vt), no: QT.no || (QT.no = qtNumber()) };
}
function qtNumber(){ var k = 'ac_quote_seq_' + session, n = Number(localStorage.getItem(k) || '0') + 1; try{ localStorage.setItem(k, String(n)); }catch(e){} var d = new Date(); return 'Q' + String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(n).padStart(3, '0'); }

/* logo: ONE image, shrunk to at most 700 px on its long side and kept in this browser only */
function qtReadLogo(file){
  return new Promise(function(res, rej){
    if(!file || !/^image\//.test(file.type)){ rej(new Error('Please choose an image file (JPG, PNG or WEBP).')); return; }
    if(file.size > 8 * 1024 * 1024){ rej(new Error('That image is too large (max 8 MB).')); return; }
    var fr = new FileReader();
    fr.onerror = function(){ rej(new Error('Could not read that image.')); };
    fr.onload = function(){
      var img = new Image();
      img.onerror = function(){ rej(new Error('That file is not a valid image.')); };
      img.onload = function(){
        var w = img.naturalWidth, h = img.naturalHeight;
        if(!w || !h){ rej(new Error('That file is not a valid image.')); return; }
        var sc = Math.min(1, 700 / Math.max(w, h)), cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
        function draw(white){ var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; var cx = cv.getContext('2d'); if(white){ cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); } cx.drawImage(img, 0, 0, cw, ch); return cv; }
        var keepAlpha = /png|gif|webp|svg/.test(file.type), url = keepAlpha ? draw(false).toDataURL('image/png') : draw(true).toDataURL('image/jpeg', 0.88);
        if(keepAlpha && url.length > 900000) url = draw(true).toDataURL('image/jpeg', 0.88);     // a very heavy PNG: store a lighter JPEG instead
        if(!/^data:image\/(png|jpeg)/.test(url)){ rej(new Error('This image type is not supported. Try a JPG or PNG.')); return; }
        res({ d: url, w: cw, h: ch });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* jsPDF is loaded only when a dealer opens the quote maker */
var JSPDF_P = null;
function ensureJsPdf(){
  if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
  if(JSPDF_P) return JSPDF_P;
  var ref = document.querySelector('script[src*="vendor/xlsx.mini.js"]'), aref = document.querySelector('script[src*="/app.js"]'), src = ref ? ref.src.replace(/xlsx\.mini\.js.*$/, 'jspdf.umd.min.js') : aref ? aref.src.replace(/app\.js.*$/, 'vendor/jspdf.umd.min.js') : 'js/vendor/jspdf.umd.min.js';
  JSPDF_P = new Promise(function(res, rej){
    var s = document.createElement('script'); s.src = src;
    s.onload = function(){ (window.jspdf && window.jspdf.jsPDF) ? res() : rej(new Error('PDF tool did not start')); };
    s.onerror = function(){ JSPDF_P = null; rej(new Error('Could not load the PDF tool — check your internet connection and try again.')); };
    document.head.appendChild(s);
  });
  return JSPDF_P;
}
function qtPdfText(s){ return String(s == null ? '' : s).replace(/₹/g, 'Rs.').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u00A0/g, ' ').replace(/[^\x0A\x20-\x7E\xA1-\xFF]/g, ''); }
function qtMoney(n){ return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qtImgFmt(d){ return /^data:image\/png/.test(d) ? 'PNG' : 'JPEG'; }
function qtWrap(doc, text, w){                       /* wraps at spaces, and breaks a very long word instead of letting it run off the page */
  var out = [];
  String(text).split('\n').forEach(function(par){
    var lines = par === '' ? [''] : doc.splitTextToSize(par, w);
    lines.forEach(function(ln){
      if(doc.getTextWidth(ln) <= w + 0.01){ out.push(ln); return; }
      var cur = ''; for(var i = 0; i < ln.length; i++){ var t = cur + ln[i]; if(doc.getTextWidth(t) > w && cur){ out.push(cur); cur = ln[i]; } else cur = t; }
      if(cur) out.push(cur);
    });
  });
  return out;
}
function qtValidate(){
  var c = qtCalc();
  if(!c.lines.length) return 'Add at least one item';
  for(var i = 0; i < c.lines.length; i++) if(!(c.lines[i].price > 0)) return 'Set a selling price for “' + qtItemName(c.lines[i].p) + '”';
  var ph = String(QT.phone || '').replace(/\D/g, '');
  if(ph && ph.length !== 10 && !(ph.length === 12 && ph.indexOf('91') === 0)) return 'Customer phone should be 10 digits (or leave it blank)';
  return '';
}

function qtBuildPdf(){
  var J = window.jspdf.jsPDF, doc = new J({ unit: 'mm', format: 'a4', compress: true });
  var m = qtMeta(), c = qtCalc(), u = m.u, logo = qtLogo(), sep = QT.gstMode === 'sep';
  var PW = 210, PH = 297, ML = 14, CW = 182, BOT = 272, RX = PW - 14, y = 14;
  var T = qtPdfText, NAVY = [23, 50, 92], GREY = [110, 118, 135], DARK = [28, 33, 45];
  function font(size, style, col){ doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size); var k = col || DARK; doc.setTextColor(k[0], k[1], k[2]); }
  function watermark(){
    if(!QT.watermark) return;
    doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.08 }));
    if(logo){ var s = Math.min(125 / logo.w, 125 / logo.h), dw = logo.w * s, dh = logo.h * s; doc.addImage(logo.d, qtImgFmt(logo.d), (PW - dw) / 2, (PH - dh) / 2, dw, dh); }
    else { var txt = T(u.business || 'Quotation'), sz = 54; font(sz, 'bold', NAVY); var tw = doc.getTextWidth(txt); if(tw > 150){ sz = Math.max(16, sz * 150 / tw); font(sz, 'bold', NAVY); } doc.text(txt, PW / 2, PH / 2, { align: 'center', angle: 35 }); }
    doc.restoreGraphicsState();
  }
  function newPage(){ doc.addPage(); watermark(); y = 14; }
  watermark();

  /* ---- header: logo + business on the left, quotation details on the right ---- */
  if(logo){ var s0 = Math.min(46 / logo.w, 22 / logo.h), lw = logo.w * s0, lh = logo.h * s0; doc.addImage(logo.d, qtImgFmt(logo.d), ML, y, lw, lh); y += lh + 3; }
  font(15, 'bold', NAVY);
  qtWrap(doc, T(u.business || 'Quotation'), 108).forEach(function(ln){ y += 6; font(15, 'bold', NAVY); doc.text(ln, ML, y); });
  font(9, 'normal', DARK);
  if(u.address) qtWrap(doc, T(u.address), 108).forEach(function(ln){ y += 4.4; font(9, 'normal', DARK); doc.text(ln, ML, y); });
  var contact = (u.phone ? 'Phone: ' + u.phone : '') + (u.phone && u.gst ? '   |   ' : '') + (u.gst ? 'GSTIN: ' + u.gst : '');
  if(contact){ y += 4.4; font(9, 'normal', DARK); doc.text(T(contact), ML, y); }
  font(18, 'bold', NAVY); doc.text('QUOTATION', RX, 21, { align: 'right' });
  [['Quotation No.', m.no], ['Date', m.date], ['Valid till', m.valid]].forEach(function(r, i){
    var by = 29 + i * 5.4; font(9, 'normal', GREY); doc.text(r[0], 134, by); font(9.5, 'bold', DARK); doc.text(T(r[1]), RX, by, { align: 'right' });
  });
  y = Math.max(y, 44) + 4;
  doc.setDrawColor(210, 215, 226); doc.setLineWidth(0.3); doc.line(ML, y, RX, y); y += 5;

  /* ---- customer ---- */
  if(QT.customer.trim() || QT.phone.trim()){
    var cl = QT.customer.trim() ? (font(10.5, 'bold'), qtWrap(doc, T(QT.customer.trim()), CW - 8)) : [];
    var bh = 4 + 4 + cl.length * 5 + (QT.phone.trim() ? 4.6 : 0) + 2.5;
    doc.setFillColor(244, 246, 251); doc.roundedRect(ML, y, CW, bh, 1.5, 1.5, 'F');
    var cy = y + 5; font(7.5, 'bold', GREY); doc.text('QUOTATION FOR', ML + 4, cy);
    cl.forEach(function(ln){ cy += 5; font(10.5, 'bold'); doc.text(ln, ML + 4, cy); });
    if(QT.phone.trim()){ cy += 4.6; font(9, 'normal'); doc.text(T('Phone: ' + QT.phone.trim()), ML + 4, cy); }
    y += bh + 5;
  }

  /* ---- items table ---- */
  var cols = sep
    ? [{ k: 'n', w: 9, a: 'c', h: '#' }, { k: 'item', w: 82, a: 'l', h: 'Item' }, { k: 'qty', w: 14, a: 'r', h: 'Qty' }, { k: 'rate', w: 30, a: 'r', h: 'Rate (excl. GST)' }, { k: 'gst', w: 17, a: 'r', h: 'GST %' }, { k: 'amt', w: 30, a: 'r', h: 'Amount' }]
    : [{ k: 'n', w: 10, a: 'c', h: '#' }, { k: 'item', w: 90, a: 'l', h: 'Item' }, { k: 'qty', w: 16, a: 'r', h: 'Qty' }, { k: 'rate', w: 33, a: 'r', h: 'Rate (incl. GST)' }, { k: 'amt', w: 33, a: 'r', h: 'Amount' }];
  var xx = ML; cols.forEach(function(col){ col.x = xx; xx += col.w; });
  function cx(col){ return col.a === 'r' ? col.x + col.w - 2 : col.a === 'c' ? col.x + col.w / 2 : col.x + 2; }
  function head(){
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]); doc.rect(ML, y, CW, 7, 'F');
    cols.forEach(function(col){ font(8.5, 'bold', [255, 255, 255]); doc.text(T(col.h), cx(col), y + 4.8, { align: col.a === 'r' ? 'right' : col.a === 'c' ? 'center' : 'left' }); });
    y += 7;
  }
  head();
  var itemCol = cols[1];
  c.lines.forEach(function(l, i){
    var p = l.p, parts = [];
    font(9, 'bold'); qtWrap(doc, T(p.name), itemCol.w - 4).forEach(function(t){ parts.push({ t: t, s: 9, st: 'bold', col: DARK, h: 4.2 }); });
    if(p.size && p.name.indexOf(p.size) < 0){ font(8, 'normal'); qtWrap(doc, T(p.size), itemCol.w - 4).forEach(function(t){ parts.push({ t: t, s: 8, st: 'normal', col: GREY, h: 3.7 }); }); }
    if(p.part){ font(7.5, 'normal'); qtWrap(doc, T('Code: ' + p.part), itemCol.w - 4).forEach(function(t){ parts.push({ t: t, s: 7.5, st: 'normal', col: GREY, h: 3.4 }); }); }
    var rowH = parts.reduce(function(a, q){ return a + q.h; }, 0) + 3.4;
    if(y + rowH > BOT){ newPage(); head(); }
    var ty = y + 1.6; parts.forEach(function(q){ ty += q.h; font(q.s, q.st, q.col); doc.text(q.t, itemCol.x + 2, ty - 0.8); });
    var vals = { n: String(i + 1), qty: String(l.qty), rate: qtMoney(sep ? l.exRate : l.price), gst: l.rate + '%', amt: qtMoney(sep ? l.exAmt : l.gross) };
    cols.forEach(function(col){ if(col.k === 'item') return; font(9, col.k === 'amt' ? 'bold' : 'normal'); doc.text(T(vals[col.k]), cx(col), y + 4.7, { align: col.a === 'r' ? 'right' : col.a === 'c' ? 'center' : 'left' }); });
    doc.setDrawColor(226, 229, 238); doc.setLineWidth(0.2); doc.line(ML, y + rowH, RX, y + rowH);
    y += rowH;
  });
  y += 4;

  /* ---- totals ---- */
  var rows = [];
  if(sep){
    rows.push(['Items total (excl. GST)', qtMoney(c.itemsEx)]);
    if(c.disc > 0){ rows.push(['Discount' + (QT.discType === 'pct' ? ' (' + (qtNum(QT.discValue) > 100 ? 100 : qtNum(QT.discValue)) + '%)' : ''), '- ' + qtMoney(c.discEx), 'red']); rows.push(['Taxable value', qtMoney(c.taxable)]); }
    c.gstBy.forEach(function(g){ if(g.rate > 0 || c.gstBy.length === 1) rows.push(['GST @ ' + g.rate + '%', qtMoney(g.gst)]); });
  } else {
    rows.push(['Items total (incl. GST)', qtMoney(c.sumG)]);
    if(c.disc > 0) rows.push(['Discount' + (QT.discType === 'pct' ? ' (' + (qtNum(QT.discValue) > 100 ? 100 : qtNum(QT.discValue)) + '%)' : ''), '- ' + qtMoney(c.disc), 'red']);
  }
  if(c.delivery > 0) rows.push(['Delivery charges', qtMoney(c.delivery)]);
  var BX = 112, BW = RX - BX, need = rows.length * 6 + 11;
  if(y + need > BOT){ newPage(); }
  rows.forEach(function(r){
    font(9.5, 'normal', r[2] === 'red' ? [178, 59, 59] : DARK); doc.text(T(r[0]), BX + 2, y + 4.2); doc.text(T(r[1]), RX - 2, y + 4.2, { align: 'right' });
    doc.setDrawColor(232, 235, 242); doc.setLineWidth(0.2); doc.line(BX, y + 6, RX, y + 6); y += 6;
  });
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]); doc.rect(BX, y + 1, BW, 9, 'F');
  font(11, 'bold', [255, 255, 255]); doc.text('Grand Total', BX + 3, y + 7); doc.text(T(qtMoney(c.grand)), RX - 3, y + 7, { align: 'right' });
  y += 10; font(7.5, 'normal', GREY); doc.text(sep ? 'GST shown separately above' : 'Inclusive of GST', RX - 2, y + 4, { align: 'right' }); y += 8;

  /* ---- notes ---- */
  if(QT.notes.trim()){
    font(9, 'bold', NAVY); if(y + 12 > BOT) newPage(); doc.text('Notes / Terms', ML, y + 4); y += 6;
    font(8.5, 'normal'); qtWrap(doc, T(QT.notes.trim()), CW).forEach(function(ln){ if(y + 4.2 > BOT) newPage(); font(8.5, 'normal'); doc.text(ln, ML, y + 3.4); y += 4.2; });
  }

  /* ---- footer + page numbers on every page ---- */
  var n = doc.getNumberOfPages();
  for(var pg = 1; pg <= n; pg++){
    doc.setPage(pg); doc.setDrawColor(210, 215, 226); doc.setLineWidth(0.25); doc.line(ML, 284, RX, 284);
    font(7.5, 'normal', GREY);
    doc.text(T((sep ? 'GST is charged extra as shown. ' : 'Prices are inclusive of GST. ') + 'Valid till ' + m.valid + '; prices may change after this date.'), ML, 288.5);
    doc.text('Page ' + pg + ' of ' + n, RX, 288.5, { align: 'right' });
  }
  var nameBit = QT.customer.trim() ? '-' + QT.customer.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) : '';
  return { doc: doc, no: m.no, name: 'Quotation-' + m.no + nameBit + '.pdf' };
}
/* Save the PDF straight away (blob + link). Keeps a visible "open PDF" link as a backup for in-app browsers that block downloads. */
var QT_URL = null;
function qtSavePdf(r){
  try{ if(QT_URL) URL.revokeObjectURL(QT_URL); }catch(e){}
  var blob = r.doc.output('blob');
  QT_URL = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = QT_URL; a.download = r.name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ if(a.parentNode) a.remove(); }, 1000);
  return { url: QT_URL, name: r.name };
}
function qtMakePdf(){
  var err = qtValidate(); if(err){ showToast(err); return Promise.reject(null); }
  return ensureJsPdf().then(function(){ try{ return qtBuildPdf(); }catch(e){ console.error('Quote PDF failed', e); throw new Error('Could not create the PDF. Please check the items and try again.'); } });
}
function qtCustomerWaPhone(){ var ph = String(QT.phone || '').replace(/\D/g, ''); if(ph.length === 10) ph = '91' + ph; return ph; }

function openQuoteMaker(){
  if(!session){ showToast('Please sign in first'); return; }
  var pf = qtPrefs();
  QT.margin = 0; QT.round = pf.round !== undefined ? Number(pf.round) || 0 : 0; QT.days = pf.days || 7; QT.gstMode = pf.gstMode === 'sep' ? 'sep' : 'incl'; QT.notes = pf.notes || ''; QT.watermark = !!pf.watermark;
  QT.customer = ''; QT.phone = ''; QT.deliveryOn = false; QT.delivery = 0; QT.discOn = false; QT.discType = 'flat'; QT.discValue = 0; QT.no = null;
  var cart = getCart(); QT.items = Object.keys(cart).map(function(id){ return { id: Number(id), qty: cart[id], manual: false, price: 0 }; }).filter(function(it){ return PRODUCTS.some(function(p){ return p.id === it.id; }); });
  qtRecalc();
  ensureJsPdf().catch(function(){});            // fetch the PDF tool now so the buttons respond instantly
  toolSheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>📄 Quote for my customer</h3><div class="sub">Make a neat PDF quote with your own margin. Your buying price is never shown on it.</div></div><button type="button" class="acpay-btn ghost" id="qtX" style="flex:none;padding:6px 12px">✕</button></div>' +
    '<div class="qt-sec"><b style="font-size:13px">Your logo</b> <span class="sub">(one image, kept on this device only)</span>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><div class="qt-logo" id="qtLogoBox"></div><div style="display:flex;flex-direction:column;gap:6px"><button type="button" class="acpay-btn ghost" id="qtLogoPick" style="padding:7px 12px;font-size:13px"></button><button type="button" class="acpay-btn ghost" id="qtLogoDel" style="padding:7px 12px;font-size:13px;color:#b23b3b">Remove logo</button></div><input type="file" id="qtLogoFile" accept="image/*" style="display:none"></div>' +
      '<label class="qt-chk"><input type="checkbox" id="qtWm"' + (QT.watermark ? ' checked' : '') + '> Show as a light watermark behind the quote</label><div class="sub" id="qtWmHint"></div></div>' +
    '<div class="acpay-row"><div><label class="l">Customer name</label><input id="qtCust" placeholder="e.g. Ramesh Constructions"></div><div><label class="l">Customer phone</label><input id="qtPhone" type="tel" inputmode="tel" placeholder="for WhatsApp"></div></div>' +
    '<div class="acpay-row"><div><label class="l">My margin %</label><input id="qtMargin" type="number" step="any" min="0" value="0"></div><div><label class="l">Round prices up to</label><select id="qtRound"><option value="0">Exact</option><option value="1">₹1</option><option value="5">₹5</option><option value="10">₹10</option></select></div><div><label class="l">Valid for (days)</label><input id="qtDays" type="number" min="1" value="' + QT.days + '"></div></div>' +
    '<div class="qt-sec"><b style="font-size:13px">GST on the quote</b>' +
      '<label class="qt-chk"><input type="radio" name="qtGstMode" value="incl"' + (QT.gstMode === 'incl' ? ' checked' : '') + '> Include GST in the prices <span class="sub">(default)</span></label>' +
      '<label class="qt-chk"><input type="radio" name="qtGstMode" value="sep"' + (QT.gstMode === 'sep' ? ' checked' : '') + '> Show GST separately</label></div>' +
    '<div class="qt-sec"><label class="qt-chk" style="margin-top:0"><input type="checkbox" id="qtDelOn"> <b>Add delivery charges</b></label><div id="qtDelBox" style="display:none;margin-top:6px"><label class="l" style="margin-top:0">Delivery charges (₹)</label><input id="qtDel" type="number" step="any" min="0" placeholder="0"><div class="sub">Added to the total as entered (no extra GST).</div></div></div>' +
    '<div class="qt-sec"><label class="qt-chk" style="margin-top:0"><input type="checkbox" id="qtDiscOn"> <b>Give my customer a discount</b></label><div id="qtDiscBox" style="display:none;margin-top:6px"><div class="acpay-row" style="margin-top:0"><div><label class="l" style="margin-top:0">Discount type</label><select id="qtDiscType"><option value="flat">Amount (₹)</option><option value="pct">Percent (%)</option></select></div><div><label class="l" style="margin-top:0">Discount</label><input id="qtDisc" type="number" step="any" min="0" placeholder="0"></div></div><div class="sub" id="qtDiscHint">Shown on the PDF only when it is more than 0.</div></div></div>' +
    '<label class="l">Add items</label><input id="qtSearch" placeholder="🔍 Search name, size or code…"><div id="qtRes" class="qo-res"></div>' +
    '<div id="qtList" style="margin-top:6px"></div><div id="qtPriv" class="qt-priv"></div>' +
    '<label class="l">Notes / terms (shown on the quote)</label><textarea id="qtNotes" rows="2" placeholder="e.g. Delivery within 3 days. 50% advance.">' + esc(QT.notes) + '</textarea>' +
    '<div class="acpay-row"><button type="button" class="acpay-btn" id="qtDl">⬇ Download PDF</button><button type="button" class="acpay-btn green" id="qtWa">📲 Send PDF on WhatsApp</button></div><div id="qtWaNote" class="qt-note" style="display:none"></div>', true);
  $t('qtRound').value = String(QT.round);
  var idx = buildProductIndex();
  function paintLogo(){
    var lg = qtLogo(); $t('qtLogoBox').innerHTML = lg ? '<img alt="Your logo" src="' + lg.d + '">' : '<span class="sub">No logo</span>';
    $t('qtLogoPick').textContent = lg ? '🖼 Replace logo' : '🖼 Upload logo'; $t('qtLogoDel').style.display = lg ? '' : 'none';
    $t('qtWmHint').textContent = QT.watermark ? (lg ? 'Your logo will appear faintly behind every page.' : 'No logo yet — your business name will be used as the watermark.') : '';
  }
  function summary(){
    var c = qtCalc(), loss = c.lines.length && c.net < c.cost;
    $t('qtPriv').innerHTML = '<b>Customer pays:</b> ' + money(c.grand) + (c.disc > 0 || c.delivery > 0 ? ' <span class="qt-sub">(items ' + money(c.net) + (c.delivery > 0 ? ' + delivery ' + money(c.delivery) : '') + ')</span>' : '') + ' &nbsp;·&nbsp; <b>My cost:</b> ' + money(c.cost) + ' &nbsp;·&nbsp; <b style="color:' + (c.profit < 0 ? '#b23b3b' : '#1e7b46') + '">My profit: ' + money(c.profit) + ' (' + c.pct + '%)</b>' +
      (loss ? '<div class="qt-sub" style="color:#b23b3b">⚠ You are selling below your cost.</div>' : '') + '<div class="qt-sub">Only you see this box (delivery is not counted as profit).</div>';
    $t('qtDiscHint').innerHTML = c.capped ? '<span style="color:#b23b3b">Discount is more than the items total — it is capped at ' + (QT.discType === 'pct' ? '100%' : money(c.sumG)) + '.</span>' : 'Shown on the PDF only when it is more than 0.';
  }
  function paint(){
    qtRecalc();
    $t('qtList').innerHTML = QT.items.length ? QT.items.map(function(it, i){
      var p = qtProd(it.id); if(!p) return '';
      var cost = qtCost(it), mg = cost > 0 ? r2((it.price - cost) / cost * 100) : 0;
      return '<div class="qt-item"><div><b>' + esc(p.name) + '</b><div class="qt-sub">' + esc(p.size && p.name.indexOf(p.size) < 0 ? p.size + ' · ' : '') + esc(p.part) + ' · my cost ' + money(cost) + ' · GST ' + (Number(p.gstPct) || 0) + '%</div></div><div style="text-align:right"><button type="button" class="acpay-btn ghost" data-qtdel="' + i + '" style="padding:3px 9px;font-size:12px" aria-label="Remove item">✕</button></div>' +
        '<div><label class="qt-sub">Qty</label> <input type="number" min="1" step="1" data-qtq="' + i + '" value="' + it.qty + '" style="width:70px"></div><div style="text-align:right"><label class="qt-sub">Selling price (each, incl. GST)</label> <input type="number" step="any" min="0" data-qtp="' + i + '" value="' + it.price + '"><div class="qt-sub">Line ' + money(it.price * it.qty) + ' · margin ' + mg + '%</div></div></div>'; }).join('') : '<div class="sub" style="padding:10px 0">No items yet — search above' + (Object.keys(getCart()).length ? '' : ' (or fill your cart first and open this again)') + '.</div>';
    summary();
  }
  paintLogo(); paint();
  var go = function(id, ev, fn){ $t(id).addEventListener(ev, fn); };
  go('qtX', 'click', paySheetClose);
  go('qtLogoPick', 'click', function(){ $t('qtLogoFile').click(); });
  go('qtLogoFile', 'change', function(e){
    var f = e.target.files && e.target.files[0]; e.target.value = ''; if(!f) return;
    qtReadLogo(f).then(function(lg){ if(!qtSaveLogo(lg)){ showToast('Not enough browser storage for this logo — try a smaller image'); return; } paintLogo(); showToast('Logo saved on this device'); }).catch(function(er){ showToast((er && er.message) || 'Could not use that image'); });
  });
  go('qtLogoDel', 'click', function(){ qtSaveLogo(null); paintLogo(); showToast('Logo removed'); });
  go('qtWm', 'change', function(e){ QT.watermark = e.target.checked; qtSavePrefs(); paintLogo(); });
  go('qtCust', 'input', function(e){ QT.customer = e.target.value; }); go('qtPhone', 'input', function(e){ QT.phone = e.target.value; });
  go('qtMargin', 'input', function(e){ QT.margin = qtNum(e.target.value); QT.items.forEach(function(it){ it.manual = false; }); paint(); });
  go('qtRound', 'change', function(e){ QT.round = Number(e.target.value) || 0; QT.items.forEach(function(it){ it.manual = false; }); paint(); qtSavePrefs(); });
  go('qtDays', 'input', function(e){ QT.days = Math.max(1, Math.floor(Number(e.target.value)) || 7); qtSavePrefs(); });
  document.querySelectorAll('input[name="qtGstMode"]').forEach(function(r){ r.addEventListener('change', function(){ if(r.checked){ QT.gstMode = r.value; qtSavePrefs(); } }); });
  go('qtDelOn', 'change', function(e){ QT.deliveryOn = e.target.checked; $t('qtDelBox').style.display = e.target.checked ? '' : 'none'; summary(); });
  go('qtDel', 'input', function(e){ QT.delivery = qtNum(e.target.value); summary(); });
  go('qtDiscOn', 'change', function(e){ QT.discOn = e.target.checked; $t('qtDiscBox').style.display = e.target.checked ? '' : 'none'; summary(); });
  go('qtDiscType', 'change', function(e){ QT.discType = e.target.value === 'pct' ? 'pct' : 'flat'; summary(); });
  go('qtDisc', 'input', function(e){ QT.discValue = qtNum(e.target.value); summary(); });
  go('qtNotes', 'input', function(e){ QT.notes = e.target.value; qtSavePrefs(); });
  go('qtSearch', 'input', function(e){
    var q = e.target.value.trim(), res = $t('qtRes'); if(q.length < 2){ res.innerHTML = ''; return; }
    var hits = qoFind(q, idx, 6); res.innerHTML = hits.length ? hits.map(function(h){ return '<button type="button" data-qtadd="' + h.p.id + '">' + esc(qoOptLabel(h.p)) + '</button>'; }).join('') : '<div class="qo-hint">No match.</div>';
  });
  $t('qtRes').addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; var id = Number(b.getAttribute('data-qtadd')); if(!QT.items.some(function(x){ return x.id === id; })) QT.items.push({ id: id, qty: 1, manual: false, price: 0 }); $t('qtSearch').value = ''; $t('qtRes').innerHTML = ''; paint(); });
  $t('qtList').addEventListener('input', function(e){
    var t = e.target, i;
    if((i = t.getAttribute('data-qtq')) !== null){ QT.items[Number(i)].qty = Math.max(1, Math.floor(Number(t.value)) || 1); qtRecalc(); summary(); }
    else if((i = t.getAttribute('data-qtp')) !== null){ var it = QT.items[Number(i)]; it.price = qtNum(t.value); it.manual = true; summary(); }
  });
  $t('qtList').addEventListener('change', function(e){ if(e.target.getAttribute('data-qtq') !== null || e.target.getAttribute('data-qtp') !== null) paint(); });
  $t('qtList').addEventListener('click', function(e){ var b = e.target.closest('[data-qtdel]'); if(!b) return; QT.items.splice(Number(b.getAttribute('data-qtdel')), 1); paint(); });

  var busy = false;
  function lock(on){ busy = on; $t('qtDl').disabled = on; $t('qtWa').disabled = on; }
  function downloaded(r){
    var sv = qtSavePdf(r), note = $t('qtWaNote'); showToast('PDF downloaded');
    note.style.display = ''; note.innerHTML = '✔ <b>' + esc(sv.name) + '</b> is downloading. If nothing happened, <a href="' + sv.url + '" target="_blank" rel="noopener" style="color:#17325c;font-weight:700;text-decoration:underline">tap here to open the PDF</a> and save it from there.';
  }
  go('qtDl', 'click', function(){
    if(busy) return;
    if(window.jspdf && window.jspdf.jsPDF){                    // tool already loaded: build and save inside the tap itself
      var err = qtValidate(); if(err){ showToast(err); return; }
      try{ downloaded(qtBuildPdf()); }catch(e){ console.error('Quote PDF failed', e); showToast('Could not create the PDF. Please check the items and try again.'); }
      return;
    }
    lock(true);
    qtMakePdf().then(function(r){ downloaded(r); }).catch(function(er){ if(er && er.message) showToast(er.message); }).then(function(){ lock(false); });
  });
  go('qtWa', 'click', function(){
    if(busy) return; lock(true); var note = $t('qtWaNote'); note.style.display = 'none';
    function manual(r){
      var sv = qtSavePdf(r); var ph = qtCustomerWaPhone(), link = 'https://wa.me/' + ph + '?text=' + encodeURIComponent('Hello' + (QT.customer.trim() ? ' ' + QT.customer.trim() : '') + ', please find our quotation ' + r.no + ' (PDF).');
      note.style.display = ''; note.innerHTML = '✔ The PDF was saved to your device. WhatsApp cannot attach it automatically here — open the chat below and attach <b>' + esc(r.name) + '</b> with the 📎 button (if the file is not in your downloads, <a href="' + sv.url + '" target="_blank" rel="noopener" style="color:#17325c;font-weight:700;text-decoration:underline">open the PDF here</a>).<div style="margin-top:8px"><a class="acpay-btn green" target="_blank" rel="noopener" href="' + esc(link) + '">Open WhatsApp chat</a></div>';
    }
    qtMakePdf().then(function(r){
      var file = null; try{ file = new File([r.doc.output('blob')], r.name, { type: 'application/pdf' }); }catch(e){}
      if(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
        return navigator.share({ files: [file], title: 'Quotation ' + r.no, text: 'Quotation ' + r.no + (QT.customer.trim() ? ' for ' + QT.customer.trim() : '') })
          .then(function(){ showToast('Pick WhatsApp to send the PDF'); }, function(er){ if(er && er.name === 'AbortError') return; manual(r); });
      }
      manual(r);
    }).catch(function(er){ if(er && er.message) showToast(er.message); }).then(function(){ lock(false); });
  });
}

/* ---- dealer tools menu (one header button instead of many) ---- */
function openDealerTools(){
  if(!session){ showToast('Please sign in first'); return; }
  toolSheet('<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h3>🧰 Dealer tools</h3><div class="sub">Faster ordering and selling.</div></div><button type="button" class="acpay-btn ghost" id="dtX" style="flex:none;padding:6px 12px">✕</button></div>' +
    '<div class="pay-choice" style="margin-top:12px"><button type="button" class="acpay-btn ghost" id="dtQuick" style="display:block;width:100%;text-align:left;margin:6px 0">📋 <b>Quick order</b><br><span class="sub">Paste a WhatsApp / notebook list — we fill the cart</span></button>' +
    '<button type="button" class="acpay-btn ghost" id="dtQuote" style="display:block;width:100%;text-align:left;margin:6px 0">📄 <b>Quote for my customer</b><br><span class="sub">Add your margin, then download or WhatsApp a PDF quote</span></button>' +
    '<button type="button" class="acpay-btn ghost" id="dtBulk" style="display:block;width:100%;text-align:left;margin:6px 0">📤 <b>Bulk order from Excel</b><br><span class="sub">Upload a sheet of item codes and quantities</span></button></div>');
  $t('dtX').onclick = paySheetClose; $t('dtQuick').onclick = openQuickOrder; $t('dtQuote').onclick = openQuoteMaker;
  $t('dtBulk').onclick = function(){ paySheetClose(); var f = document.getElementById('bulkOrderFile'); if(f) f.click(); };
}

/* ================= Account panel ================= */
function accountBodyHtml(){
  var users = getUsers();
  var u = users[session] || {};
  var addresses = getDealerAddresses(session);
  var recentBroadcasts = BROADCASTS.slice().reverse().slice(0,5);

  var html = '<div class="account-card mb-3">' +
      '<div class="ac-row"><span class="ac-label">'+t('account.business')+'</span><span class="ac-val">'+esc(u.business||'—')+'</span></div>' +
      '<div class="ac-row"><span class="ac-label">'+t('account.gst')+'</span><span class="ac-val">'+esc(u.gst||'—')+'</span></div>' +
      '<div class="ac-row"><span class="ac-label">'+t('account.phone')+'</span><span class="ac-val">'+esc(u.phone||'—')+'</span></div>' +
      '<div class="ac-row"><span class="ac-label">'+t('account.address')+'</span><span class="ac-val">'+esc(u.address||'—')+'</span></div>' +
    '</div>';

  var myGsts = gstsForCurrentAccount();
  html += '<div class="account-card mb-3">' +
      '<div class="ac-title" style="font-weight:700; margin-bottom:8px;">'+t('account.myBusinesses')+'</div>' +
      myGsts.map(function(g){
        var uu = users[g] || {};
        var isActive = g === session;
        return '<div class="oi-line" style="align-items:center;"><span>'+esc(uu.business||g)+(isActive?' ★':'')+'<br><span style="font-size:10.5px; color:var(--ink-600);">'+esc(g)+'</span></span>' +
          (isActive ? '<span class="tier-badge">'+t('account.current')+'</span>' : '<button class="btn-admin sm outline" data-switch-business="'+esc(g)+'">'+t('account.switchTo')+'</button>') +
        '</div>';
      }).join('') +
      (myGsts.length > 1 ? '<button class="btn-admin sm outline mt-2" id="acctAllOrdersBtn">'+t('account.allBusinessOrders')+'</button>' : '') +
      '<button class="btn-admin sm mt-2" id="addBusinessBtn">'+t('account.addBusiness')+'</button>' +
    '</div>';

  html += monthlyCardHtml();

  html += '<div class="account-card mb-3">' +
      '<div class="ac-title" style="font-weight:700; margin-bottom:8px;">'+t('account.addresses')+'</div>' +
      (addresses.length === 0 ? '<div class="ac-sub mb-2">—</div>' :
        addresses.map(function(a){
          return '<div class="oi-line" style="align-items:center;"><span>'+esc(a.label)+(a.isPrimary?' ★':'')+'<br><span style="font-size:10.5px; color:var(--ink-600);">'+esc(a.text)+'</span></span>' +
            '<span style="display:flex; gap:4px;">' +
            (!a.isPrimary ? '<button class="btn-admin sm outline" data-make-primary="'+a.id+'">'+t('account.makePrimary')+'</button>' : '') +
            '<button class="btn-admin sm maroon" data-remove-addr="'+a.id+'">'+t('account.remove')+'</button>' +
            '</span></div>';
        }).join('')
      ) +
      '<button class="btn-admin sm mt-2" id="addAddressBtn">'+t('account.addAddress')+'</button>' +
    '</div>';

  html += '<div class="account-card mb-3">' +
      '<div class="ac-title" style="font-weight:700; margin-bottom:8px;">📢 '+t('account.announcements')+'</div>' +
      (recentBroadcasts.length === 0 ? '<div class="ac-sub">'+t('account.noAnnouncements')+'</div>' :
        recentBroadcasts.map(function(b){
          return '<div class="oi-line" style="display:block;"><div style="font-size:10px; color:var(--ink-600);">'+esc(b.date)+'</div><div>'+esc(b.en)+'</div></div>';
        }).join('')
      ) +
    '</div>';

  html += '<div class="account-card mb-3" style="display:flex; gap:8px; flex-wrap:wrap;">' +
      '<button class="btn-admin sm outline" id="acctWishlistBtn">♡ '+t('account.wishlist')+'</button>' +
      '<button class="btn-admin sm outline" id="acctSupportBtn">🎧 '+t('account.support')+'</button>' +
      '<button class="btn-admin sm outline" id="acctFaqBtn">❓ '+t('account.faq')+'</button>' +
      '<button class="btn-admin sm outline" id="acctPriceListBtn">⬇ '+t('account.priceList')+'</button>' +
    '</div>';

  html += '<button type="button" class="btn-royal" id="logoutBtn" style="background:var(--maroon-600); border-color:var(--maroon-600);">'+t('account.logout')+'</button>';
  return html;
}
function refreshAccount(){
  renderAccountPanel();
  if(currentView === 'account') render();
}
function wireAccountBody(container){
  var btn = container.querySelector('#logoutBtn');
  if(btn) btn.addEventListener('click', logout);
  var addBtn = container.querySelector('#addAddressBtn');
  if(addBtn) addBtn.addEventListener('click', function(){
    var label = window.prompt('Address label (e.g. Warehouse, Shop):', 'New address');
    if(label === null) return;
    var text = window.prompt('Full delivery address:');
    if(!text) return;
    addDealerAddress(session, label.trim() || 'Address', text.trim());
    showToast(t('toast.addressAdded'));
    refreshAccount();
  });
  container.querySelectorAll('[data-remove-addr]').forEach(function(b){
    b.addEventListener('click', function(){
      removeDealerAddress(session, Number(b.getAttribute('data-remove-addr')));
      showToast(t('toast.addressRemoved'));
      refreshAccount();
    });
  });
  container.querySelectorAll('[data-make-primary]').forEach(function(b){
    b.addEventListener('click', function(){
      setPrimaryAddress(session, Number(b.getAttribute('data-make-primary')));
      refreshAccount();
    });
  });
  var wishBtn = container.querySelector('#acctWishlistBtn');
  if(wishBtn) wishBtn.addEventListener('click', function(){ accountOffcanvas.hide(); setView('wishlist'); });
  var supportBtn = container.querySelector('#acctSupportBtn');
  if(supportBtn) supportBtn.addEventListener('click', openSupportPanel);
  var faqBtn = container.querySelector('#acctFaqBtn');
  if(faqBtn) faqBtn.addEventListener('click', openFaqPanel);
  var priceListBtn = container.querySelector('#acctPriceListBtn');
  if(priceListBtn) priceListBtn.addEventListener('click', function(){ exportDealerPriceList(session); });
  container.querySelectorAll('[data-switch-business]').forEach(function(b){
    b.addEventListener('click', function(){
      session = b.getAttribute('data-switch-business');
      localStorage.setItem('ac_session', session);
      accountOffcanvas.hide();
      setView('home');
      showToast('Switched business');
    });
  });
  var addBizBtn = container.querySelector('#addBusinessBtn');
  if(addBizBtn) addBizBtn.addEventListener('click', openAddBusinessForm);
  var allOrdersBtn = container.querySelector('#acctAllOrdersBtn');
  if(allOrdersBtn) allOrdersBtn.addEventListener('click', function(){
    accountOffcanvas.hide();
    setView('allOrders');
  });
}
function openAddBusinessForm(){
  var body = document.getElementById('addBusinessOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Business Name</label><input type="text" id="abBusiness"></div>' +
      '<div class="full"><label>GST Number</label><input type="text" id="abGst" placeholder="22AAAAA0000A1Z5"></div>' +
      '<div class="full"><label>Business Address</label><textarea id="abAddress" rows="2"></textarea></div>' +
    '</div>' +
    '<div class="form-err" id="abErr"></div>' +
    '<button class="btn-admin mt-3" id="abSaveBtn" style="width:100%;">Create business profile</button>';
  document.getElementById('abSaveBtn').addEventListener('click', function(){
    var errEl = document.getElementById('abErr');
    errEl.textContent = '';
    var business = document.getElementById('abBusiness').value.trim();
    var gst = document.getElementById('abGst').value.trim().toUpperCase();
    var address = document.getElementById('abAddress').value.trim();
    if(!business || !gst || !address){ errEl.textContent = 'Please fill all fields.'; return; }
    var users = getUsers();
    if(users[gst]){ errEl.textContent = 'This GST number is already registered.'; return; }
    var currentUser = users[session] || {};
    users[gst] = {
      business:business, gst:gst, phone:currentUser.phone||'', address:address, password:currentUser.password,
      contactPerson:'', email:'', deliveryAddress:address, tier:'Standard',
      notes:'', standingDiscountPct:0, accountKey:normalizePhone(currentUser.phone)
    };
    saveUsers(users);
    linkGstToAccount(currentUser.phone, gst, currentUser.password);
    showToast('New business profile created — switching to it');
    addBusinessOffcanvas.hide();
    session = gst;
    localStorage.setItem('ac_session', gst);
    setView('home');
  });
  addBusinessOffcanvas.show();
}
function renderAccountPanel(){
  var body = document.getElementById('accountBody');
  body.innerHTML = accountBodyHtml();
  wireAccountBody(body);
}
function renderAccountView(){
  main.innerHTML = '<div class="section-title"><span>'+t('account.title')+'</span></div><div id="accountViewSlot"></div>';
  var slot = document.getElementById('accountViewSlot');
  slot.innerHTML = accountBodyHtml();
  wireAccountBody(slot);
}
function openSupportPanel(){
  var body = document.getElementById('supportOffcanvasBody');
  body.innerHTML =
    '<div class="account-card mb-3">' +
      '<div class="ac-row"><span class="ac-label">Phone</span><span class="ac-val">'+esc(SETTINGS.shopPhone)+'</span></div>' +
      '<div class="ac-row"><span class="ac-label">Email</span><span class="ac-val">'+esc(SETTINGS.supportEmail)+'</span></div>' +
    '</div>' +
    '<a class="btn-royal d-block text-center mb-2" style="text-decoration:none;" href="https://wa.me/91'+esc(SETTINGS.shopPhone)+'" target="_blank">💬 WhatsApp us</a>' +
    '<a class="btn-royal d-block text-center" style="text-decoration:none; background:var(--navy-700);" href="tel:'+esc(SETTINGS.shopPhone)+'">📞 Call us</a>';
  supportOffcanvas.show();
}
function openFaqPanel(){
  var freeMin = Number(SETTINGS.freeDeliveryMin)||0;
  var charge = Number(SETTINGS.deliveryCharge)||0;
  var faqs = [
    ['How do I place an order?', 'Add products to your cart from Home or Categories, then tap Place Order in the cart drawer.'],
    ['What are your delivery charges?', freeMin > 0 ? ('Free delivery on orders above '+money(freeMin)+'. Below that, a flat delivery charge of '+money(charge)+' applies.') : 'Delivery charges are informed at checkout.'],
    ['Can I cancel my order?', 'Yes — you can cancel an order yourself as long as it is still in "Placed" status. Once confirmed, please contact support.'],
    ['How do I get a tax invoice?', 'Open the order in your Orders tab and tap "🧾 Invoice" — you can print or save it as a PDF.'],
    ['Is this an official Ashirvad store?', 'AshirvadConnect is run independently by an Ashirvad-affiliated dealer, not an official Ashirvad website.']
  ];
  var body = document.getElementById('faqOffcanvasBody');
  body.innerHTML = faqs.map(function(f){
    return '<div class="account-card mb-2"><div style="font-weight:700; margin-bottom:4px;">'+esc(f[0])+'</div><div style="font-size:12.5px; color:var(--ink-700);">'+esc(f[1])+'</div></div>';
  }).join('');
  faqOffcanvas.show();
}

/* ================================================================
   ADMIN CONSOLE
   ================================================================ */
var adminScreenEl = document.getElementById('adminScreen');
var adminShellEl = document.getElementById('adminShell');
var authScreenEl = document.getElementById('authScreen');
var appShellEl = document.getElementById('appShell');
var currentAdminTab = 'dashboard';
var currentOrderFilter = 'all';
var REPORTS_FILTER = { from:'', to:'', cat:'' };
var ORDER_SEARCH = '';
var PRODUCT_SEARCH = '';
var PRODUCT_CAT_FILTER = '';
var PRODUCT_SCOPE = 'regular';   // 'regular' | 'catalog' (spec-group items)
var PRODUCT_CATALOG_CAT = '';
var PRODUCT_PAGE = 1;
var PRICING_OVERVIEW_VIEW = false;      // inside Configuration → Pricing Overview module
var PRICING_OVERVIEW_MODE = 'products'; // 'products' | 'dealer'
var PRICING_OVERVIEW_Q = '';
var PRICING_OVERVIEW_ISSUES_ONLY = false;
var PRICING_OVERVIEW_DUPLICATES_ONLY = false;
var PRICING_OVERVIEW_GST = '';          // selected dealer (GST) in "by dealer" mode
var PRICING_OVERVIEW_DEALER_Q = '';
var PRICING_OVERVIEW_DEALER_CONFIGURED_ONLY = false;
var PRICING_OVERVIEW_DEALER_EDIT_PID = null; // product id whose inline rate-editor is open, in By-dealer view
var productsSubView = 'list'; // legacy (catalog cards now live in the Catalog tab — see CAT_UI)
var manageCatEditing = null; // { type:'cat'|'sub', id } — which row is in inline-rename mode on the Manage categories screen
var manageCatMsg = null;     // { kind:'err'|'ok', text, titles:[] } — banner shown on the Manage categories screen
var specBuilderFocusVariants = false; // set by "+ Add item to this card" so the builder scrolls to the variant table
var specBuilderState = null;  // working state for the Spec-Group Card builder
var DEALER_SEARCH = '';

var dealerOffcanvasEl = document.getElementById('dealerOffcanvas');
var dealerOffcanvas = safeBsComponent('Offcanvas', dealerOffcanvasEl);
var bannerOffcanvasEl = document.getElementById('bannerOffcanvas');
var bannerOffcanvas = safeBsComponent('Offcanvas', bannerOffcanvasEl);
var offerOffcanvasEl = document.getElementById('offerOffcanvas');
var offerOffcanvas = safeBsComponent('Offcanvas', offerOffcanvasEl);
var ruleOffcanvasEl = document.getElementById('ruleOffcanvas');
var ruleOffcanvas = safeBsComponent('Offcanvas', ruleOffcanvasEl);
var invoiceSettingsOffcanvasEl = document.getElementById('invoiceSettingsOffcanvas');
var invoiceSettingsOffcanvas = safeBsComponent('Offcanvas', invoiceSettingsOffcanvasEl);
var deliverySettingsOffcanvasEl = document.getElementById('deliverySettingsOffcanvas');
var deliverySettingsOffcanvas = safeBsComponent('Offcanvas', deliverySettingsOffcanvasEl);

function openAdminLogin(){
  if(adminSession){
    appShellEl.classList.add('d-none');
    authScreenEl.classList.add('d-none');
    adminShellEl.classList.remove('d-none');
    renderAdmin();
  } else {
    appShellEl.classList.add('d-none');
    authScreenEl.classList.add('d-none');
    adminScreenEl.classList.remove('d-none');
  }
}
/* The admin console has its own page (/admin/), which marks itself with
   <html data-app-route="admin">. The old "#admin" hash still works so existing
   bookmarks / printed links don't break. */
function isAdminPage(){
  return document.documentElement.getAttribute('data-app-route') === 'admin';
}
function isAdminRoute(){
  if(isAdminPage()) return true;
  var h = location.hash.replace(/^#\/?/, '').toLowerCase();
  return h === 'admin' || h.indexOf('admin') === 0;
}
/* Public store address (no /admin/, no #hash) — used for QR codes and "Back to store"
   so they never point at the admin page. */
function storeBaseUrl(){
  var path = location.pathname.replace(/\/admin(\/index\.html)?\/?$/i, '/').replace(/\/index\.html$/i, '/');
  return location.origin + path;
}
document.getElementById('adminBackToStore').addEventListener('click', function(e){
  e.preventDefault();
  if(isAdminPage()){ location.href = storeBaseUrl(); return; }
  if(location.hash){ history.replaceState(null, '', location.pathname + location.search); }
  adminScreenEl.classList.add('d-none');
  if(session){ appShellEl.classList.remove('d-none'); }
  else { authScreenEl.classList.remove('d-none'); }
});
document.getElementById('adminLoginForm').addEventListener('submit', function(e){
  e.preventDefault();
  var errEl = document.getElementById('adminLoginErr');
  errEl.textContent = '';
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  if(CLOUD){
    CLOUD.adminLogin(u, p).then(function(){ localStorage.setItem('ac_admin_session', '1'); localStorage.setItem('ac_admin_user', u); CLOUD.reload(); })
      .catch(function(err){ errEl.textContent = CLOUD.authMessage(err, t, true); });
    return;
  }
  if(u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password){
    adminSession = true;
    localStorage.setItem('ac_admin_session', '1');
    localStorage.setItem('ac_admin_user', u);
    adminScreenEl.classList.add('d-none');
    adminShellEl.classList.remove('d-none');
    document.getElementById('adminLoginForm').reset();
    renderAdmin();
    resetIdleTimers();
  } else {
    errEl.textContent = 'Invalid admin username or password.';
  }
});
function adminLogout(reason){
  adminSession = false;
  localStorage.removeItem('ac_admin_session');
  if(CLOUD){ CLOUD.signOut().then(function(){ CLOUD.reload(); }); return; }
  adminShellEl.classList.add('d-none');
  if(isAdminRoute()){ adminScreenEl.classList.remove('d-none'); }
  else if(session){ appShellEl.classList.remove('d-none'); render(); }
  else { authScreenEl.classList.remove('d-none'); }
  showToast(reason || 'Logged out of admin');
  clearIdleTimers();
}
document.getElementById('adminLogoutBtn').addEventListener('click', function(){ adminLogout(); });
document.querySelectorAll('.admin-tabs button[data-atab]').forEach(function(btn){
  btn.addEventListener('click', function(){
    currentAdminTab = btn.getAttribute('data-atab');
    document.querySelectorAll('.admin-tabs button[data-atab]').forEach(function(b){
      b.classList.toggle('active', b === btn);
    });
    renderAdmin();
  });
});

function renderAdmin(){
  clearDashboardInterval();
  updatePayBadge();
  updateResetBadge();
  if(currentAdminTab === 'dashboard') renderAdminDashboard();
  else if(currentAdminTab === 'orders') renderAdminOrders();
  else if(currentAdminTab === 'customers') renderAdminCustomers();
  else if(currentAdminTab === 'products') renderAdminProducts();
  else if(currentAdminTab === 'catalog') renderAdminCatalog();
  else if(currentAdminTab === 'calc') renderAdminCalcRules();
  else if(currentAdminTab === 'marketing') renderAdminMarketing();
  else if(currentAdminTab === 'banners' || currentAdminTab === 'offers' || currentAdminTab === 'broadcast'){
    MARKETING_VIEW = currentAdminTab; currentAdminTab = 'marketing'; renderAdminMarketing();   // legacy tab names
  }
  else if(currentAdminTab === 'configuration') renderAdminConfiguration();
  else if(currentAdminTab === 'reports') renderAdminReports();    
  else if(currentAdminTab === 'distributors' && window.__acAdminTabs && window.__acAdminTabs.distributors) window.__acAdminTabs.distributors();
  else if(currentAdminTab === 'data' && window.__acAdminTabs && window.__acAdminTabs.data) window.__acAdminTabs.data();
}

/* ---------------- Dashboard tab ---------------- */
var dashboardRefreshInterval = null;
function clearDashboardInterval(){
  if(dashboardRefreshInterval){ clearInterval(dashboardRefreshInterval); dashboardRefreshInterval = null; }
}
function computeTodayStats(){
  var all = getAllOrders();
  var todayStr = new Date().toDateString();
  var orders = 0, revenue = 0, pending = 0;
  all.forEach(function(o){
    if(o.createdAt && new Date(o.createdAt).toDateString() === todayStr){
      orders++;
      if(o.status !== 'cancelled') revenue += orderPayable(o);
      if(o.status === 'placed') pending++;
    }
  });
  return { orders:orders, revenue:revenue, pending:pending };
}
/* Additional at-a-glance insights for the dashboard (7/30-day performance, status mix,
   dealer snapshot, recent orders). Purely additive — does not affect computeTodayStats
   or anything already relying on it. */
function computeDashboardInsights(){
  var all = getAllOrders();
  var now = Date.now();
  var weekMs = 7*86400000, monthMs = 30*86400000;
  var weekOrders = 0, weekRevenue = 0, monthOrders = 0, monthRevenue = 0;
  var statusCounts = { placed:0, confirmed:0, dispatched:0, delivered:0, cancelled:0 };
  all.forEach(function(o){
    var age = now - (Number(o.createdAt) || 0);
    if(o.status === 'cancelled'){
      statusCounts.cancelled++;
      return;
    }
    if(statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    if(age <= weekMs){ weekOrders++; weekRevenue += orderPayable(o); }
    if(age <= monthMs){ monthOrders++; monthRevenue += orderPayable(o); }
  });
  var users = getUsers();
  var gsts = Object.keys(users);
  var activeDealers = gsts.filter(function(g){ return users[g].isActive !== false; }).length;
  var recentOrders = all.slice().sort(function(a,b){
    return (Number(b.createdAt)||0) - (Number(a.createdAt)||0);
  }).slice(0, 5);
  // "Needs attention": orders sitting unconfirmed for a while, and low/out-of-stock products —
  // surfaced on the dashboard so admin doesn't have to go hunting for them in Orders/Products.
  var staleMs = 24*3600000;
  var stalePlaced = all.filter(function(o){ return o.status === 'placed' && (now - (Number(o.createdAt)||0)) > staleMs; }).length;
  var lowStockCount = PRODUCTS.filter(function(p){ return p.active !== false && Number(p.stock) <= LOW_STOCK_THRESHOLD; }).length;
  return {
    weekOrders:weekOrders, weekRevenue:weekRevenue,
    monthOrders:monthOrders, monthRevenue:monthRevenue,
    statusCounts:statusCounts,
    totalDealers:gsts.length, activeDealers:activeDealers, blockedDealers:gsts.length-activeDealers,
    recentOrders:recentOrders,
    stalePlaced:stalePlaced, lowStockCount:lowStockCount
  };
}
function renderAdminDashboard(){
  clearDashboardInterval();
  var adminMain = document.getElementById('adminMain');
  var stats = computeTodayStats();
  var insights = computeDashboardInsights();
  var perfHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">📈 Performance Snapshot</div>' +
    '<div class="stat-grid">' +
      '<div class="stat-card"><div class="sc-val">'+insights.weekOrders+'</div><div class="sc-lbl">Orders (7 days)</div></div>' +
      '<div class="stat-card"><div class="sc-val">'+moneyCompactHtml(insights.weekRevenue)+'</div><div class="sc-lbl">Revenue (7 days)</div></div>' +
      '<div class="stat-card"><div class="sc-val">'+insights.monthOrders+'</div><div class="sc-lbl">Orders (30 days)</div></div>' +
      '<div class="stat-card"><div class="sc-val">'+moneyCompactHtml(insights.monthRevenue)+'</div><div class="sc-lbl">Revenue (30 days)</div></div>' +
    '</div></div>';
  // Needs-attention card: the things a busy shop owner actually opens the dashboard to check —
  // orders waiting too long unconfirmed, and stock running low — each one tap away from the tab
  // that fixes it, instead of a wall of numbers with nothing actionable.
  var attnRows = '';
  if(insights.stalePlaced > 0) attnRows += '<div class="dash-alert-row warn"><span>⏳ '+insights.stalePlaced+' order(s) placed 24h+ ago, still unconfirmed</span><button type="button" class="btn-admin sm outline" id="dashGoStale">Review</button></div>';
  if(insights.lowStockCount > 0) attnRows += '<div class="dash-alert-row warn"><span>⚠ '+insights.lowStockCount+' product(s) low / out of stock</span><button type="button" class="btn-admin sm outline" id="dashGoStock">Review</button></div>';
  var attentionHtml = attnRows ? ('<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">🔔 Needs attention</div>' + attnRows + '</div>')
    : '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">🔔 Needs attention</div><div class="ac-sub">Nothing urgent — all caught up.</div></div>';
  // Quick actions: the handful of things admin does most often, one tap from the dashboard.
  var quickActionsHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">⚡ Quick actions</div>' +
    '<div class="dash-quick-actions">' +
      '<button type="button" class="btn-admin sm outline" id="qaOrders">📦 View orders</button>' +
      '<button type="button" class="btn-admin sm outline" id="qaAutoRules">⏱ Auto-status rules</button>' +
      '<button type="button" class="btn-admin sm outline" id="qaBroadcast">📢 Send broadcast</button>' +
      '<button type="button" class="btn-admin sm outline" id="qaReports">📊 Full reports</button>' +
    '</div></div>';
  var statusLabelsDash = { placed:'Placed', confirmed:'Confirmed', dispatched:'Dispatched', delivered:'Delivered', cancelled:'Cancelled' };
  var STATUS_COLORS_DASH = { placed:'#c9a24d', confirmed:'#3b6ea5', dispatched:'#a5673b', delivered:'#1b7a3d', cancelled:'#7c2333' };
  var statusTotalDash = Object.keys(statusLabelsDash).reduce(function(s,k){ return s + insights.statusCounts[k]; }, 0);
  var statusHtmlDash = '<div class="admin-card mt-3 report-chart-card"><div class="ac-title" style="margin-bottom:8px;">📦 Orders by Status (all-time)</div>' +
    svgDonutChart(Object.keys(statusLabelsDash).map(function(k){ return { label:statusLabelsDash[k], value:insights.statusCounts[k], color:STATUS_COLORS_DASH[k] }; }), { centerLabel: statusTotalDash, centerSub:'orders' }) +
  '</div>';
  var dealerSnapHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">🧑‍🤝‍🧑 Dealer Snapshot</div>' +
    '<div class="oi-line"><span>Total dealers</span><span>'+insights.totalDealers+'</span></div>' +
    '<div class="oi-line"><span>Active</span><span>'+insights.activeDealers+'</span></div>' +
    '<div class="oi-line"><span>Blocked</span><span>'+insights.blockedDealers+'</span></div>' +
  '</div>';
  var recentHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">🕒 Recent Orders</div>' +
    (insights.recentOrders.length === 0 ? '<div class="ac-sub">No orders yet.</div>' :
      insights.recentOrders.map(function(o){
        return '<div class="oi-line"><span>#'+esc(o.id)+' — '+esc(o.dealerBusiness||o.dealerGst)+'</span><span title="'+esc(money(orderPayable(o)))+'">'+esc(moneyCompact(orderPayable(o)))+'</span></div>';
      }).join('')
    ) +
    '<button class="btn-admin sm outline mt-2" id="dashViewReportsBtn" style="width:100%;">View full reports →</button>' +
  '</div>';
  adminMain.innerHTML =
    '<div class="admin-toolbar"><h2>Dashboard</h2></div>' +
    '<div class="daily-summary-card">' +
      '<div class="dsc-item"><div class="dsc-val">'+stats.orders+'</div><div class="dsc-lbl">Orders today</div></div>' +
      '<div class="dsc-item"><div class="dsc-val" title="'+esc(money(stats.revenue))+'">'+esc(moneyCompact(stats.revenue))+'</div><div class="dsc-lbl">Revenue today</div></div>' +
      '<div class="dsc-item"><div class="dsc-val">'+stats.pending+'</div><div class="dsc-lbl">Pending / unconfirmed</div></div>' +
    '</div>' +
    attentionHtml + quickActionsHtml + perfHtml + statusHtmlDash + dealerSnapHtml + recentHtml +
    '<div class="admin-card mt-3">' +
      '<div class="ac-title" style="margin-bottom:8px;">📍 Shop QR Code</div>' +
      '<div class="ac-sub mb-2">Print this and display it at your counter — customers can scan to open the store and register.</div>' +
      '<div id="shopQrContainer" style="display:flex; justify-content:center; padding:14px; background:#fff; border-radius:10px;"></div>' +
      '<button class="btn-admin sm mt-2" id="downloadShopQrBtn" style="width:100%;">⬇ Download QR code</button>' +
    '</div>';
  renderQRInto('shopQrContainer', storeBaseUrl());
  document.getElementById('downloadShopQrBtn').addEventListener('click', function(){ downloadQRCode('shopQrContainer', 'AshirvadConnect_ShopQR.png'); });
  var dashViewReportsBtn = document.getElementById('dashViewReportsBtn');
  if(dashViewReportsBtn) dashViewReportsBtn.addEventListener('click', function(){ currentAdminTab = 'reports'; renderAdmin(); });
  var qaOrders = document.getElementById('qaOrders');
  if(qaOrders) qaOrders.addEventListener('click', function(){ currentAdminTab = 'orders'; renderAdmin(); });
  var qaAutoRules = document.getElementById('qaAutoRules');
  if(qaAutoRules) qaAutoRules.addEventListener('click', function(){ currentAdminTab = 'orders'; ORDER_AUTO_RULES_VIEW = true; renderAdmin(); });
  var qaBroadcast = document.getElementById('qaBroadcast');
  if(qaBroadcast) qaBroadcast.addEventListener('click', function(){ currentAdminTab = 'marketing'; MARKETING_VIEW = 'broadcast'; renderAdmin(); });
  var qaReports = document.getElementById('qaReports');
  if(qaReports) qaReports.addEventListener('click', function(){ currentAdminTab = 'reports'; renderAdmin(); });
  var dashGoStale = document.getElementById('dashGoStale');
  if(dashGoStale) dashGoStale.addEventListener('click', function(){ currentAdminTab = 'orders'; currentOrderFilter = 'placed'; ORDER_UI.page = 1; renderAdmin(); });
  var dashGoStock = document.getElementById('dashGoStock');
  if(dashGoStock) dashGoStock.addEventListener('click', function(){ currentAdminTab = 'products'; renderAdmin(); });
  dashboardRefreshInterval = setInterval(function(){
    if(currentAdminTab === 'dashboard'){
      var s = computeTodayStats();
      var vals = document.querySelectorAll('#adminMain .dsc-val');
      if(vals.length === 3){
        vals[0].textContent = s.orders;
        vals[1].textContent = moneyCompact(s.revenue);
        vals[1].title = money(s.revenue);
        vals[2].textContent = s.pending;
      }
    }
  }, 60000);
}

/* ---------------- QR code helpers ---------------- */
function renderQRInto(containerId, text, size){
  var el = document.getElementById(containerId);
  if(!el) return;
  size = size || 150;
  try{
    var qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    var moduleCount = qr.getModuleCount();
    var cellSize = Math.max(2, Math.round(size / moduleCount));
    var dataUrl = qr.createDataURL(cellSize, 4);
    el.innerHTML = '<img src="'+dataUrl+'" width="'+size+'" height="'+size+'" alt="QR code" style="display:block; image-rendering:pixelated;">';
  } catch(e){
    if(window.console && console.warn) console.warn('QR generation failed', e);
    el.innerHTML = '<div class="ac-sub" style="text-align:center; padding:8px; width:'+size+'px;">QR code unavailable.</div>';
  }
}
function downloadQRCode(containerId, filename){
  var el = document.getElementById(containerId);
  if(!el) return;
  var img = el.querySelector('img');
  if(!img){ showToast('QR code not ready yet'); return; }
  try{
    var a = document.createElement('a');
    a.href = img.src; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  } catch(e){ showToast('Could not download the QR image'); }
}

/* ---------------- Calculator Rules tab ---------------- */
function renderAdminCalcRules(){
  var adminMain = document.getElementById('adminMain');
  var toolbar = '<div class="admin-toolbar"><h2>Calculator Rules</h2><button class="btn-admin" id="btnAddCalcRule">+ Add rule</button></div>';
  var list = CALC_RULES.length === 0
    ? '<div class="admin-empty"><div class="ae-big">No rules yet</div><div>Add a rule so customers can use the Bore Calculator.</div></div>'
    : CALC_RULES.map(function(r){
        return '<div class="admin-card">' +
          '<div class="ac-title">'+esc(r.label)+'</div>' +
          '<div class="ac-sub">'+esc(r.purposeType)+' · '+r.minDepth+'–'+r.maxDepth+' ft'+(r.diameter?' · ⌀'+r.diameter+'"':'')+' · '+r.equipment.length+' item(s)</div>' +
          '<div class="ac-actions">' +
            '<button class="btn-admin sm outline" data-edit-rule="'+r.id+'">Edit</button>' +
            '<button class="btn-admin sm maroon" data-del-rule="'+r.id+'">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
  adminMain.innerHTML = toolbar + list;
  document.getElementById('btnAddCalcRule').addEventListener('click', function(){ openRuleEditor(null); });
  adminMain.querySelectorAll('[data-edit-rule]').forEach(function(btn){
    btn.addEventListener('click', function(){ openRuleEditor(Number(btn.getAttribute('data-edit-rule'))); });
  });
  adminMain.querySelectorAll('[data-del-rule]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = Number(btn.getAttribute('data-del-rule'));
      if(!confirm('Delete this rule?')) return;
      saveCalcRules(CALC_RULES.filter(function(r){ return r.id !== id; }));
      logAudit('Calculator rule deleted', 'Rule #'+id);
      renderAdminCalcRules();
    });
  });
}

var ruleEditorState = { id:null, equipment:[] };
function openRuleEditor(ruleId){
  var rule = ruleId ? CALC_RULES.find(function(r){ return r.id === ruleId; }) : null;
  ruleEditorState.id = rule ? rule.id : nextCalcRuleId();
  ruleEditorState.equipment = rule ? JSON.parse(JSON.stringify(rule.equipment)) : [];
  document.getElementById('ruleOffcanvasTitle').textContent = rule ? 'Edit Rule' : 'New Rule';
  var body = document.getElementById('ruleOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Label</label><input type="text" id="ruleLabel" value="'+esc(rule?rule.label:'')+'"></div>' +
      '<div class="full"><label>Application / Purpose Type</label><input type="text" id="rulePurpose" list="purposeTypeList" value="'+esc(rule?rule.purposeType:'')+'" placeholder="e.g. Agriculture Borewell"></div>' +
      '<datalist id="purposeTypeList">' + calcPurposeTypes().map(function(pt){ return '<option value="'+esc(pt)+'">'; }).join('') + '</datalist>' +
      '<div><label>Min depth (ft)</label><input type="number" id="ruleMinDepth" value="'+(rule?rule.minDepth:0)+'"></div>' +
      '<div><label>Max depth (ft)</label><input type="number" id="ruleMaxDepth" value="'+(rule?rule.maxDepth:200)+'"></div>' +
      '<div class="full"><label>Diameter (inches, optional)</label><input type="number" id="ruleDiameter" value="'+(rule&&rule.diameter?rule.diameter:'')+'"></div>' +
    '</div>' +
    '<div class="ac-title mt-3" style="margin-bottom:8px;">Equipment</div>' +
    '<div id="ruleEquipmentLines"></div>' +
    '<button class="btn-admin sm outline mt-2" id="addEquipmentLineBtn">+ Add equipment line</button>' +
    '<button class="btn-admin mt-3" id="saveRuleBtn" style="width:100%;">Save rule</button>';
  renderRuleEquipmentLines();
  document.getElementById('addEquipmentLineBtn').addEventListener('click', function(){
    syncEquipmentFromDom();
    ruleEditorState.equipment.push({ productId: PRODUCTS[0].id, mode:'fixed', qty:1, pipeLengthPerUnit:10 });
    renderRuleEquipmentLines();
  });
  document.getElementById('saveRuleBtn').addEventListener('click', function(){
    syncEquipmentFromDom();
    var label = document.getElementById('ruleLabel').value.trim();
    var purpose = document.getElementById('rulePurpose').value.trim();
    var minDepth = Number(document.getElementById('ruleMinDepth').value)||0;
    var maxDepth = Number(document.getElementById('ruleMaxDepth').value)||0;
    var diameter = document.getElementById('ruleDiameter').value ? Number(document.getElementById('ruleDiameter').value) : null;
    if(!label || !purpose || ruleEditorState.equipment.length === 0){ showToast('Fill label, purpose and at least one equipment line'); return; }
    var newRule = { id: ruleEditorState.id, label:label, purposeType:purpose, minDepth:minDepth, maxDepth:maxDepth, diameter:diameter, equipment: ruleEditorState.equipment };
    var list = CALC_RULES.filter(function(r){ return r.id !== newRule.id; });
    list.push(newRule);
    list.sort(function(a,b){ return a.id - b.id; });
    saveCalcRules(list);
    logAudit('Calculator rule saved', label);
    showToast('Rule saved');
    ruleOffcanvas.hide();
    renderAdminCalcRules();
  });
  ruleOffcanvas.show();
}
function renderRuleEquipmentLines(){
  var wrap = document.getElementById('ruleEquipmentLines');
  if(!wrap) return;
  wrap.innerHTML = ruleEditorState.equipment.map(function(line, idx){
    return '<div class="df-row mb-2" data-idx="'+idx+'" style="align-items:center; flex-wrap:wrap;">' +
      '<select class="rel-product" style="flex:1; min-width:150px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">' +
        PRODUCTS.map(function(p){ return '<option value="'+p.id+'"'+(p.id===line.productId?' selected':'')+'>'+esc(p.name)+' ('+esc(p.part)+')</option>'; }).join('') +
      '</select>' +
      '<select class="rel-mode" style="border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">' +
        '<option value="fixed"'+(line.mode==='fixed'?' selected':'')+'>Fixed qty</option>' +
        '<option value="perDepth"'+(line.mode==='perDepth'?' selected':'')+'>Per depth</option>' +
      '</select>' +
      (line.mode === 'fixed'
        ? '<input type="number" class="rel-qty" value="'+(line.qty||1)+'" placeholder="Qty" style="width:70px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">'
        : '<input type="number" class="rel-perdepth" value="'+(line.pipeLengthPerUnit||10)+'" placeholder="ft/unit" style="width:80px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">'
      ) +
      '<button type="button" class="btn-admin sm maroon rel-remove">✕</button>' +
    '</div>';
  }).join('');
  wrap.querySelectorAll('.rel-mode').forEach(function(sel){
    sel.addEventListener('change', function(){
      syncEquipmentFromDom();
      renderRuleEquipmentLines();
    });
  });
  wrap.querySelectorAll('.rel-remove').forEach(function(btn){
    btn.addEventListener('click', function(){
      syncEquipmentFromDom();
      var idx = Number(btn.closest('[data-idx]').getAttribute('data-idx'));
      ruleEditorState.equipment.splice(idx,1);
      renderRuleEquipmentLines();
    });
  });
}
function syncEquipmentFromDom(){
  var wrap = document.getElementById('ruleEquipmentLines');
  if(!wrap) return;
  wrap.querySelectorAll('[data-idx]').forEach(function(row){
    var idx = Number(row.getAttribute('data-idx'));
    var line = ruleEditorState.equipment[idx];
    if(!line) return;
    line.productId = Number(row.querySelector('.rel-product').value);
    line.mode = row.querySelector('.rel-mode').value;
    if(line.mode === 'fixed'){
      var qtyInput = row.querySelector('.rel-qty');
      if(qtyInput) line.qty = Number(qtyInput.value)||1;
    } else {
      var pdInput = row.querySelector('.rel-perdepth');
      if(pdInput) line.pipeLengthPerUnit = Number(pdInput.value)||10;
    }
  });
}

/* ---------------- Orders tab ---------------- */
/* editOpen / discountOpen: whether an order's "Edit items" / "Bonus discount" panel is open.
   Previously this lived ONLY as a CSS class toggled by a click handler — so the instant
   "+ Add item" or "Save item changes" ran renderAdminOrders() (to show the updated items),
   the panel's freshly-rendered HTML came back with the class gone, and the whole panel
   silently closed. The item HAD been saved correctly; the admin just watched their own
   editor vanish and had no way to tell whether anything had happened. Tracking it as real
   state here means it survives every re-render, exactly like ORDER_UI.expanded already does. */
var ORDER_UI = { range:'all', from:'', to:'', sort:'newest', page:1, pageSize:20, expanded:{}, selected:{}, editOpen:{}, discountOpen:{} };
var ORDER_AUTO_RULES_VIEW = false;
function orderRangeBounds(){
  var now = new Date(), day = 86400000;
  var startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  switch(ORDER_UI.range){
    case 'today': return [startToday, Infinity];
    case '7d':    return [startToday - 6*day, Infinity];
    case '30d':   return [startToday - 29*day, Infinity];
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), Infinity];
    case 'custom':
      var lo = ORDER_UI.from ? new Date(ORDER_UI.from + 'T00:00:00').getTime() : 0;
      var hi = ORDER_UI.to ? new Date(ORDER_UI.to + 'T23:59:59.999').getTime() : Infinity;
      return [lo, hi];
  }
  return null;
}
function orderMatchesQuery(o, terms){
  var hay = (o.id+' '+(o.dealerBusiness||'')+' '+o.dealerGst+' '+(o.date||'')+' '+o.status+' '+(o.invoiceNo||'')+' '+(o.deliveryAddress||'')+' '+
    Math.round(orderPayable(o))+' '+o.items.map(function(it){ return it.name; }).join(' ')).toLowerCase();
  return terms.every(function(term){ return hay.indexOf(term) !== -1; });
}
function getFilteredAdminOrders(){
  var all = getAllOrders().map(function(o, i){ return { o:o, i:i }; });
  var terms = (ORDER_SEARCH||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  var bounds = orderRangeBounds();
  var list = all.filter(function(e){
    var o = e.o;
    if(currentOrderFilter !== 'all' && o.status !== currentOrderFilter) return false;
    if((ORDER_UI.pay || 'all') !== 'all' && payFilterKey(o) !== ORDER_UI.pay) return false;
    if(bounds){ var ts = Number(o.createdAt)||0; if(ts < bounds[0] || ts > bounds[1]) return false; }
    if(terms.length && !orderMatchesQuery(o, terms)) return false;
    return true;
  });
  var byNewest = function(a,b){ return (Number(b.o.createdAt)||0) - (Number(a.o.createdAt)||0) || b.i - a.i; };
  var sorters = {
    newest: byNewest,
    oldest: function(a,b){ return byNewest(b,a); },
    high:   function(a,b){ return orderPayable(b.o) - orderPayable(a.o) || byNewest(a,b); },
    low:    function(a,b){ return orderPayable(a.o) - orderPayable(b.o) || byNewest(a,b); }
  };
  list.sort(sorters[ORDER_UI.sort] || byNewest);
  return list.map(function(e){ return e.o; });
}
/* Compact horizontal stage stepper — the same 4 stages the customer sees in their own timeline,
   sized for admin use. Lets admin see *where* an order sits (and what's next) at a glance, in the
   collapsed order row as well as the detail panel, instead of only in a sentence of text. */
function adminOrderStepperHtml(o){
  if(o.status === 'cancelled'){
    return '<div class="ac-order-stepper cancelled">' +
      '<span class="aos-dot done"></span><span class="aos-lbl done">Placed</span>' +
      '<span class="aos-line done"></span>' +
      '<span class="aos-dot cancelled"></span><span class="aos-lbl cancelled">Cancelled</span>' +
    '</div>';
  }
  var idx = STATUS_ORDER.indexOf(o.status);
  return '<div class="ac-order-stepper">' + STATUS_ORDER.map(function(st, i){
    var state = i < idx ? 'done' : (i === idx ? 'current' : 'pending');
    return (i > 0 ? '<span class="aos-line'+(i<=idx?' done':'')+'"></span>' : '') +
      '<span class="aos-dot '+state+'"></span><span class="aos-lbl '+state+'">'+esc(orderStatusLabel(st))+'</span>';
  }).join('') + '</div>';
}
/* Per-order auto-status panel shown in the order detail view. Rewritten to remove the ambiguity
   between "which stage is this order on", "does it move on its own", and "what do I click to change
   that": it now always leads with the stage stepper, then one plain-English line — current stage,
   the single next stage it can reach, and (if a dealer auto-rule is driving it) a concrete ETA —
   with exactly one clearly-labelled action button underneath. */
function autoStatusRowHtml(o){
  var dealer = getUsers()[o.dealerGst];
  var rule = dealer && dealer.autoStatusRule;
  var ruleOn = !!(rule && rule.enabled !== false);
  var next = nextOrderStatus(o.status);
  var off = !!o.autoStatusOff;
  var stateText, etaText = '';
  if(!next){
    stateText = 'Already '+orderStatusLabel(o.status)+' — nothing further to do.';
  } else if(o.status === 'cancelled'){
    stateText = 'This order was cancelled.';
  } else if(!ruleOn){
    stateText = 'Currently <b>'+esc(orderStatusLabel(o.status))+'</b>. This dealer has no auto-status rule, so moving it to <b>'+esc(orderStatusLabel(next))+'</b> is manual — use the "Mark '+esc(orderStatusLabel(next))+'" button above.';
  } else if(off){
    stateText = 'Currently <b>'+esc(orderStatusLabel(o.status))+'</b>. Auto-status is switched OFF for this one order — moving it to <b>'+esc(orderStatusLabel(next))+'</b> is manual, use the button above.';
  } else {
    var step = AUTO_STATUS_STEPS.filter(function(s){ return s.from === o.status; })[0];
    var hours = step ? Number(rule[step.hoursKey]) || 0 : 0;
    if(!step || hours <= 0){
      stateText = 'Currently <b>'+esc(orderStatusLabel(o.status))+'</b>. The dealer\'s rule doesn\'t auto-advance past this stage — move it to <b>'+esc(orderStatusLabel(next))+'</b> manually when ready.';
    } else {
      var enteredAt = orderStatusHistory(o).filter(function(h){ return h.status === o.status; }).pop();
      var since = enteredAt ? enteredAt.at : Number(o.createdAt) || 0;
      var dueAt = since + hours*3600000;
      var remain = dueAt - Date.now();
      etaText = remain > 0 ? ('in ~'+humanizeDuration(remain)) : 'any moment now (overdue — will apply on next check)';
      stateText = 'Currently <b>'+esc(orderStatusLabel(o.status))+'</b>. Will auto-advance to <b>'+esc(orderStatusLabel(next))+'</b> '+etaText+', per this dealer\'s rule ('+esc(autoStatusRuleSummary(rule))+').';
    }
  }
  return '<div class="ac-sub" style="margin:8px 0; padding:9px 10px; background:var(--ivory-100); border-radius:8px;">' +
      adminOrderStepperHtml(o) +
      '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap;">' +
        '<span>⏱ '+stateText+'</span>' +
        (ruleOn && next && o.status !== 'cancelled' ? '<button type="button" class="btn-admin sm outline" data-autostatus-toggle="'+esc(o.id)+'">'+(off?'Resume auto-status':'Switch to manual')+'</button>' : '') +
      '</div>' +
    '</div>';
}
function orderDetailHtml(o){ return orderDetailHtml0(o); }
function orderDetailHtml0(o){
  var discAmt = orderDiscountAmount(o);
  var payable = orderPayable(o);
  var canCancel = o.status !== 'delivered' && o.status !== 'cancelled';
  var canEditItems = (o.status === 'placed' || o.status === 'confirmed');
  // Same "active !== false excludes catalog cards" issue fixed elsewhere (Pricing Overview,
  // the dealer price-list export): a catalog-card variant's `active` flag means "migrated from
  // the old flat catalog", not "enabled", so it was silently missing from this dropdown —
  // only the handful of plain (non-catalog) products ever showed up here.
  var activeProds = canEditItems ? PRODUCTS.filter(function(p){ return p.isCatalogVariant || p.active !== false; }) : [];
  return '<div class="ord-detail">' +
    '<div class="ac-sub mb-2">'+esc(o.dealerBusiness||o.dealerGst)+' · '+esc(o.dealerGst)+' · '+esc(o.date)+(o.deliveryAddress ? ' · 📍 '+esc(o.deliveryAddress) : '')+'</div>' +
    '<div class="admin-order-items" id="items-'+esc(o.id)+'" style="margin-top:0; border-top:none; padding-top:0;">' +
      o.items.map(function(it){ return '<div class="oi-line"><span>'+esc(it.name)+' × '+it.qty+'</span><span>'+money(it.price*it.qty)+'</span></div>'; }).join('') +
      '<div class="oi-line" style="font-weight:700;"><span>Order value</span><span>'+money(o.total)+'</span></div>' +
      (o.discount ? '<div class="oi-line" style="color:var(--maroon-600); font-weight:600;"><span>Discount'+(o.discount.reason?' ('+esc(o.discount.reason)+')':'')+'</span><span>−'+money(discAmt)+'</span></div>' : '') +
      '<div class="oi-line" style="font-weight:700;"><span>Payable</span><span>'+money(payable)+'</span></div>' +
    '</div>' +
    (o.discount ? '<div class="discount-applied-tag">🎁 '+(o.discount.type==='flat' ? money(o.discount.value) : o.discount.value+'%')+' off applied</div>' : '') +
    '<div class="ac-actions">' +
      (canCancel ? '<button class="btn-admin sm maroon" data-cancel="'+esc(o.id)+'">Cancel</button>' : '') +
      (canEditItems ? '<button class="btn-admin sm outline" data-edit-toggle="'+esc(o.id)+'">✏ Edit items</button>' : '') +
      '<button class="btn-admin sm outline" data-discount-toggle="'+esc(o.id)+'">🎁 Bonus discount</button>' +
      '<button class="btn-admin sm outline" data-export="'+esc(o.id)+'">⬇ Export</button>' +
      (o.status !== 'cancelled' ? '<button class="btn-admin sm outline" data-invoice="'+esc(o.id)+'">🧾 Invoice</button>' : '') +
      (o.status !== 'cancelled' ? '<button class="btn-admin sm outline" data-pay-popup="'+esc(o.id)+'">💳 Payment</button>' : '') +
    '</div>' +
    autoStatusRowHtml(o) +
    (canEditItems ? (
      '<div class="discount-form'+(ORDER_UI.editOpen[o.id]?' show':'')+'" id="ef-'+esc(o.id)+'">' +
        o.items.map(function(it, idx){
          return '<div class="df-row" style="align-items:center;">' +
            '<span style="flex:1; font-size:12px;">'+esc(it.name)+' <span style="color:var(--ink-600);">('+money(it.price)+' ea)</span></span>' +
            '<input type="number" class="ei-qty" data-idx="'+idx+'" value="'+it.qty+'" min="0" style="width:64px;">' +
          '</div>';
        }).join('') +
        '<div class="df-row mt-2">' +
          '<select id="eiProduct-'+esc(o.id)+'" style="flex:1; min-width:140px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">' +
            activeProds.map(function(p){ return '<option value="'+p.id+'">'+esc(p.name)+' ('+esc(p.part)+')</option>'; }).join('') +
          '</select>' +
          '<input type="number" id="eiQty-'+esc(o.id)+'" placeholder="Qty" min="1" style="width:64px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">' +
          '<button class="btn-admin sm outline" data-add-item="'+esc(o.id)+'">+ Add item</button>' +
        '</div>' +
        '<button class="btn-admin sm mt-2" data-save-items="'+esc(o.id)+'">Save item changes</button>' +
        '<div class="ac-sub mt-1">Setting an item\'s quantity to 0 removes it. Prices are locked at the price shown; only quantities / item list change.</div>' +
      '</div>'
    ) : '') +
    '<div class="discount-form'+(ORDER_UI.discountOpen[o.id]?' show':'')+'" id="df-'+esc(o.id)+'">' +
      '<div class="df-row">' +
        '<select id="dtype-'+esc(o.id)+'"><option value="pct">% off</option><option value="flat">₹ flat off</option></select>' +
        '<input type="number" id="dval-'+esc(o.id)+'" placeholder="Value" style="width:90px;">' +
        '<input type="text" id="dreason-'+esc(o.id)+'" placeholder="Reason (shown to dealer)" style="flex:1; min-width:140px;">' +
      '</div>' +
      '<button class="btn-admin sm" data-apply-discount="'+esc(o.id)+'">Apply discount</button>' +
    '</div>' +
  '</div>';
}
/* ================= Auto-Status Rules (per dealer, applies to ALL of that dealer's orders) ================= */
var AUTO_RULES_UI = { editing:null, q:'', bulkSel:{}, bulkQ:'' };
function autoRuleFieldsHtml(rule, prefix){
  rule = rule || {};
  var dis = rule.enabled === false;
  return '<div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">' +
      '<label class="switch"><input type="checkbox" id="'+prefix+'En"'+(rule.enabled===false?'':' checked')+'><span class="slider"></span></label>' +
      '<span class="ac-sub">Enabled for this dealer</span>' +
    '</div>' +
    '<div class="admin-form-grid">' +
      '<div><label>Confirm after (hours)</label><input type="number" min="0" id="'+prefix+'C" value="'+(rule.confirmHours||'')+'" placeholder="e.g. 24"></div>' +
      '<div><label>Dispatch after (hours, from Confirmed)</label><input type="number" min="0" id="'+prefix+'D" value="'+(rule.dispatchHours||'')+'" placeholder="e.g. 24"></div>' +
      '<div><label>Deliver after (hours, from Dispatched)</label><input type="number" min="0" id="'+prefix+'V" value="'+(rule.deliverHours||'')+'" placeholder="e.g. 48"></div>' +
    '</div>' +
    '<div class="ac-sub mt-1">Leave a stage blank to stop the automation there — admin (or "+ Item"/Details) will move it on manually from that point.</div>';
}
function readAutoRuleFields(prefix){
  var num = function(id){ var v = document.getElementById(id).value; return v === '' ? 0 : Math.max(0, Number(v)||0); };
  return { enabled: document.getElementById(prefix+'En').checked, confirmHours:num(prefix+'C'), dispatchHours:num(prefix+'D'), deliverHours:num(prefix+'V') };
}
/* Human-readable one-line summary of a dealer's auto-status rule, used in the rules list and the audit log. */
function autoStatusRuleSummary(rule){
  rule = rule || {};
  if(rule.enabled === false) return 'Disabled';
  var parts = [];
  if(Number(rule.confirmHours) > 0) parts.push('Placed→Confirmed in '+rule.confirmHours+'h');
  if(Number(rule.dispatchHours) > 0) parts.push('Confirmed→Dispatched in '+rule.dispatchHours+'h');
  if(Number(rule.deliverHours) > 0) parts.push('Dispatched→Delivered in '+rule.deliverHours+'h');
  return parts.length ? parts.join(', ') : 'No stages configured';
}
function renderAutoStatusRulesPanel(){
  var adminMain = document.getElementById('adminMain');
  var users = getUsers();
  var q = AUTO_RULES_UI.q.trim().toLowerCase();
  var gsts = Object.keys(users).filter(function(gst){
    if(!q) return true;
    var u = users[gst];
    return (u.business||'').toLowerCase().indexOf(q) !== -1 || gst.toLowerCase().indexOf(q) !== -1;
  }).sort(function(a,b){ return (users[a].business||a).toLowerCase().localeCompare((users[b].business||b).toLowerCase()); });

  var rows = gsts.length === 0
    ? '<div class="admin-empty"><div class="ae-big">'+(Object.keys(users).length ? 'No dealers match' : 'No dealers yet')+'</div></div>'
    : gsts.map(function(gst){
        var u = users[gst];
        var rule = u.autoStatusRule;
        var editing = AUTO_RULES_UI.editing === gst;
        var body = '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">' +
            '<div><b>'+esc(u.business||gst)+'</b><div class="ac-sub">'+esc(gst)+'</div></div>' +
            '<div style="text-align:right;">' +
              '<div class="ac-sub" style="max-width:280px;">'+esc(autoStatusRuleSummary(rule))+'</div>' +
              '<button type="button" class="btn-admin sm outline" data-arule-edit="'+esc(gst)+'">'+(editing?'Cancel':(rule?'Edit':'Configure'))+'</button>' +
            '</div>' +
          '</div>';
        if(editing){
          body += '<div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--ivory-100);">' +
            autoRuleFieldsHtml(rule, 'ar-'+gst.replace(/[^A-Za-z0-9]/g,'')) +
            '<button type="button" class="btn-admin sm" data-arule-save="'+esc(gst)+'">Save rule for this dealer</button>' +
          '</div>';
        }
        return '<div class="admin-card">'+body+'</div>';
      }).join('');

  var selCount = Object.keys(AUTO_RULES_UI.bulkSel).filter(function(k){ return AUTO_RULES_UI.bulkSel[k]; }).length;
  var bulkGsts = Object.keys(users).filter(function(gst){
    var bq = AUTO_RULES_UI.bulkQ.trim().toLowerCase();
    if(!bq) return true;
    return (users[gst].business||'').toLowerCase().indexOf(bq) !== -1 || gst.toLowerCase().indexOf(bq) !== -1;
  }).sort(function(a,b){ return (users[a].business||a).toLowerCase().localeCompare((users[b].business||b).toLowerCase()); });

  adminMain.innerHTML =
    '<div class="admin-toolbar"><h2>⏱ Auto-Status Rules</h2>' +
      '<button class="btn-admin outline" id="btnBackFromAutoRules">← Back to Orders</button></div>' +
    '<div class="ac-sub mb-2">Configure once per dealer and every one of their orders follows it automatically — no need to touch each order. An individual order can still be switched off in its own detail view for manual handling.</div>' +
    '<div class="admin-card">' +
      '<div class="ac-title" style="margin-bottom:6px;">Apply one rule to several dealers at once</div>' +
      '<input type="text" id="arBulkSearch" placeholder="🔍 Search dealers by name or GST…" value="'+esc(AUTO_RULES_UI.bulkQ)+'" style="width:100%; border:1.3px solid #ddd3ba; border-radius:8px; padding:8px 12px; font-size:13px; margin-bottom:8px;">' +
      '<div style="display:flex; gap:8px; margin-bottom:8px;">' +
        '<button type="button" class="btn-admin sm outline" id="arSelectAllShown">Select all shown</button>' +
        '<button type="button" class="btn-admin sm outline" id="arClearSel">Clear</button>' +
        '<span class="ac-sub" style="align-self:center;">'+(selCount ? selCount+' selected' : 'None selected')+'</span>' +
      '</div>' +
      '<div style="max-height:180px; overflow:auto; border:1px solid var(--ivory-100); border-radius:8px; padding:4px 8px; margin-bottom:10px;">' +
        (bulkGsts.length ? bulkGsts.map(function(gst){
          return '<label style="display:flex; gap:8px; align-items:center; padding:4px 0; cursor:pointer; font-size:12.5px;">' +
            '<input type="checkbox" data-ar-bulk-gst="'+esc(gst)+'"'+(AUTO_RULES_UI.bulkSel[gst]?' checked':'')+'>' +
            '<span><b>'+esc(users[gst].business||gst)+'</b> <span class="ac-sub">'+esc(gst)+'</span></span></label>';
        }).join('') : '<div class="ac-sub" style="padding:6px 0;">No dealers match.</div>') +
      '</div>' +
      autoRuleFieldsHtml(null, 'arBulk') +
      '<button type="button" class="btn-admin mt-2" id="arBulkApply" style="width:100%;">Apply to selected dealers</button>' +
    '</div>' +
    '<input type="text" id="arSearch" placeholder="🔍 Search dealers…" value="'+esc(AUTO_RULES_UI.q)+'" style="width:100%; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px; margin:14px 0 10px;">' +
    rows;

  document.getElementById('btnBackFromAutoRules').addEventListener('click', function(){ ORDER_AUTO_RULES_VIEW = false; renderAdminOrders(); });
  var arSearch = document.getElementById('arSearch');
  arSearch.addEventListener('input', function(){
    var pos = this.selectionStart; AUTO_RULES_UI.q = this.value; renderAutoStatusRulesPanel();
    var again = document.getElementById('arSearch'); if(again){ again.focus(); try{ again.setSelectionRange(pos,pos); }catch(e){} }
  });
  adminMain.querySelectorAll('[data-arule-edit]').forEach(function(b){
    b.addEventListener('click', function(){
      var gst = b.getAttribute('data-arule-edit');
      AUTO_RULES_UI.editing = (AUTO_RULES_UI.editing === gst) ? null : gst;
      renderAutoStatusRulesPanel();
    });
  });
  adminMain.querySelectorAll('[data-arule-save]').forEach(function(b){
    b.addEventListener('click', function(){
      var gst = b.getAttribute('data-arule-save');
      var prefix = 'ar-'+gst.replace(/[^A-Za-z0-9]/g,'');
      var rule = readAutoRuleFields(prefix);
      setDealerAutoStatusRule(gst, rule);
      var u = getUsers()[gst];
      logAudit('Dealer auto-status rule set', (u.business||gst)+': '+autoStatusRuleSummary(rule));
      showToast('Auto-status rule saved for '+(u.business||gst));
      AUTO_RULES_UI.editing = null;
      renderAutoStatusRulesPanel();
    });
  });
  var arBulkSearch = document.getElementById('arBulkSearch');
  arBulkSearch.addEventListener('input', function(){
    var pos = this.selectionStart; AUTO_RULES_UI.bulkQ = this.value; renderAutoStatusRulesPanel();
    var again = document.getElementById('arBulkSearch'); if(again){ again.focus(); try{ again.setSelectionRange(pos,pos); }catch(e){} }
  });
  adminMain.querySelectorAll('[data-ar-bulk-gst]').forEach(function(cb){
    cb.addEventListener('change', function(){
      var gst = cb.getAttribute('data-ar-bulk-gst');
      if(cb.checked) AUTO_RULES_UI.bulkSel[gst] = true; else delete AUTO_RULES_UI.bulkSel[gst];
      renderAutoStatusRulesPanel();
    });
  });
  document.getElementById('arSelectAllShown').addEventListener('click', function(){
    bulkGsts.forEach(function(gst){ AUTO_RULES_UI.bulkSel[gst] = true; });
    renderAutoStatusRulesPanel();
  });
  document.getElementById('arClearSel').addEventListener('click', function(){ AUTO_RULES_UI.bulkSel = {}; renderAutoStatusRulesPanel(); });
  document.getElementById('arBulkApply').addEventListener('click', function(){
    var gsts = Object.keys(AUTO_RULES_UI.bulkSel).filter(function(g){ return AUTO_RULES_UI.bulkSel[g]; });
    if(!gsts.length){ showToast('Select at least one dealer'); return; }
    var rule = readAutoRuleFields('arBulk');
    gsts.forEach(function(gst){ setDealerAutoStatusRule(gst, rule); });
    logAudit('Auto-status rule applied to dealers', gsts.length+' dealer(s): '+autoStatusRuleSummary(rule));
    showToast('Rule applied to '+gsts.length+' dealer(s)');
    AUTO_RULES_UI.bulkSel = {};
    renderAutoStatusRulesPanel();
  });
}

function renderAdminOrders(){
  if(ORDER_AUTO_RULES_VIEW){ renderAutoStatusRulesPanel(); return; }
  var adminMain = document.getElementById('adminMain');
  var everything = getAllOrders();
  var counts = { all: everything.length, placed:0, confirmed:0, dispatched:0, delivered:0, cancelled:0 };
  var revenue = 0, todayOrders = 0, todayRevenue = 0;
  var todayStr = new Date().toDateString();
  everything.forEach(function(o){
    counts[o.status] = (counts[o.status]||0) + 1;
    if(o.status !== 'cancelled') revenue += orderPayable(o);
    if(o.createdAt && new Date(o.createdAt).toDateString() === todayStr){
      todayOrders++;
      if(o.status !== 'cancelled') todayRevenue += orderPayable(o);
    }
  });
  var statTiles = [
    { key:'all', lbl:'All orders', val:counts.all },
    { key:'placed', lbl:'Placed', val:counts.placed||0 },
    { key:'confirmed', lbl:'Confirmed', val:counts.confirmed||0 },
    { key:'dispatched', lbl:'Dispatched', val:counts.dispatched||0 },
    { key:'delivered', lbl:'Delivered', val:counts.delivered||0 },
    { key:'cancelled', lbl:'Cancelled', val:counts.cancelled||0 },
    { key:'__revenue', lbl:'Revenue (net)', val:money(revenue) },
    { key:'__today', lbl:"Today's orders / revenue", val:todayOrders+' · '+money(todayRevenue) },
    { key:'__verify', lbl:'💳 Payments to verify', val:payVerifyCount() }
  ];
  var statHtml = '<div class="stat-grid">' + statTiles.map(function(st){
    var isSpecial = st.key.indexOf('__') === 0;
    var active = !isSpecial && currentOrderFilter === st.key;
    return '<div class="stat-card'+(active?' active-filter':'')+'" '+(isSpecial?(st.key==='__verify'?'data-payfilter="verify" style="cursor:pointer"':''):'data-filter="'+st.key+'"')+'>' +
      '<div class="sc-val">'+st.val+'</div><div class="sc-lbl">'+st.lbl+'</div></div>';
  }).join('') + '</div>';

  var filtered = getFilteredAdminOrders();
  var pages = Math.max(1, Math.ceil(filtered.length / ORDER_UI.pageSize));
  if(ORDER_UI.page > pages) ORDER_UI.page = pages; if(ORDER_UI.page < 1) ORDER_UI.page = 1;
  var from = (ORDER_UI.page - 1) * ORDER_UI.pageSize;
  var pageOrders = filtered.slice(from, from + ORDER_UI.pageSize);
  var selIds = Object.keys(ORDER_UI.selected).filter(function(k){ return ORDER_UI.selected[k]; });
  var filtersActive = (ORDER_SEARCH||'').trim() || currentOrderFilter !== 'all' || ORDER_UI.range !== 'all' || (ORDER_UI.pay||'all') !== 'all';

  var toolbar = '<div class="admin-toolbar"><h2>Orders <span class="ac-sub" style="font-weight:400;">· '+filtered.length+(filtered.length!==everything.length?' of '+everything.length:'')+' shown</span></h2>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
      '<button class="btn-admin outline" id="btnExportFiltered"'+(filtered.length?'':' disabled')+'>⬇ Export '+(filtersActive?'filtered':'all')+' ('+filtered.length+')</button>' +
      '<button class="btn-admin outline" id="btnAutoStatusRules">⏱ Auto-Status Rules</button>' +
      '<button class="btn-admin outline" id="btnInvoiceSettings">🧾 Invoice &amp; Payment Settings'+(SETTINGS.upiId ? '' : ' ⚠ add UPI ID')+'</button>' +
      '<button class="btn-admin outline" id="btnFullBackup">💾 Full Backup</button>' +
    '</div></div>' +
    '<div class="ord-filters">' +
      '<input type="text" id="orderSearchInput" placeholder="🔍 Search order ID, dealer, GST, product, amount, invoice no… (several words = all must match)" value="'+esc(ORDER_SEARCH||'')+'" style="flex:2; min-width:220px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
      '<select id="ordRange">' + [['all','All time'],['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['month','This month'],['custom','Custom range…']].map(function(r){
        return '<option value="'+r[0]+'"'+(ORDER_UI.range===r[0]?' selected':'')+'>'+r[1]+'</option>'; }).join('') + '</select>' +
      (ORDER_UI.range==='custom' ? '<input type="date" id="ordFrom" value="'+esc(ORDER_UI.from)+'"><span class="ac-sub">to</span><input type="date" id="ordTo" value="'+esc(ORDER_UI.to)+'">' : '') +
      '<select id="ordSort">' + [['newest','Newest first'],['oldest','Oldest first'],['high','Highest value'],['low','Lowest value']].map(function(r){
        return '<option value="'+r[0]+'"'+(ORDER_UI.sort===r[0]?' selected':'')+'>'+r[1]+'</option>'; }).join('') + '</select>' +
      '<select id="ordPayFilter">' + [['all','All payments'],['verify','💳 To verify'],['unpaid','Unpaid'],['partial','Part paid'],['paid','Paid'],['later','Pay later']].map(function(r){
        return '<option value="'+r[0]+'"'+((ORDER_UI.pay||'all')===r[0]?' selected':'')+'>'+r[1]+'</option>'; }).join('') + '</select>' +
      '<select id="ordPageSize">' + [20,50,100].map(function(n){ return '<option value="'+n+'"'+(ORDER_UI.pageSize===n?' selected':'')+'>'+n+' / page</option>'; }).join('') + '</select>' +
      (filtersActive ? '<button class="btn-admin sm outline" id="ordClear">✕ Clear filters</button>' : '') +
    '</div>';

  var bulkBar = selIds.length ? (
    '<div class="cc-bulkbar"><b>'+selIds.length+' selected</b>' +
      '<button class="btn-admin sm" id="ordBulkAdvance">Advance to next status</button>' +
      '<button class="btn-admin sm maroon" id="ordBulkCancel">Cancel selected</button>' +
      '<button class="btn-admin sm outline" id="ordBulkExport">⬇ Export selected</button>' +
      '<button class="btn-admin sm outline" id="ordBulkClear">Clear</button>' +
      '<button class="btn-admin sm outline" id="ordBulkAutoOn">⏱ Auto-status ON</button>' +
      '<button class="btn-admin sm outline" id="ordBulkAutoOff">⏱ Auto-status OFF</button>' +
    '</div>') : '';

  var allOnPage = pageOrders.length > 0 && pageOrders.every(function(o){ return ORDER_UI.selected[o.id]; });
  var listHtml;
  if(filtered.length === 0){
    listHtml = '<div class="admin-empty"><div class="ae-big">'+(everything.length ? 'No orders match these filters' : 'No orders yet')+'</div><div>'+(everything.length ? 'Clear the search or widen the date range.' : 'Orders appear here as dealers place them.')+'</div></div>';
  } else {
    listHtml = '<div style="display:flex; align-items:center; gap:8px; padding:0 12px 6px; font-size:11.5px; color:var(--ink-600);">' +
      '<input type="checkbox" id="ordSelAll"'+(allOnPage?' checked':'')+'> <label for="ordSelAll" style="margin:0; cursor:pointer;">Select all on this page</label></div>' +
      pageOrders.map(function(o){
        var open = !!ORDER_UI.expanded[o.id];
        var next = nextOrderStatus(o.status);
        return '<div class="ord-row'+(open?' open':'')+'">' +
          '<input type="checkbox" class="ord-sel" data-oid="'+esc(o.id)+'"'+(ORDER_UI.selected[o.id]?' checked':'')+'>' +
          '<div data-toggle-order="'+esc(o.id)+'" style="cursor:pointer; min-width:0;"><div class="ord-id">#'+esc(o.id)+' · '+esc(o.dealerBusiness||o.dealerGst)+'</div>' +
            '<div class="ac-sub"><span class="ord-gstlink" data-ord-dealer="'+esc(o.dealerGst)+'" title="Show all orders of this dealer">'+esc(o.dealerGst)+'</span> · '+esc(o.date)+'</div></div>' +
          '<div class="ord-items">'+o.items.length+' item'+(o.items.length===1?'':'s')+'</div>' +
          '<div class="ord-pay"><b>'+money(orderPayable(o))+'</b><div'+(o.status !== 'cancelled' ? ' data-pay-popup="'+esc(o.id)+'" style="cursor:pointer" title="Click to mark Paid / Not paid"' : '')+'>'+payChipHtml(o)+'</div></div>' +
          '<span class="status-pill st-'+esc(o.status)+'">'+esc(o.status.charAt(0).toUpperCase()+o.status.slice(1))+'</span>' +
          '<div class="ord-actions">' +
            (next ? '<button class="btn-admin sm" data-advance="'+esc(o.id)+'">Mark '+next.charAt(0).toUpperCase()+next.slice(1)+'</button>' : '') +
            '<button class="btn-admin sm outline" data-toggle-order="'+esc(o.id)+'">'+(open?'▴ Hide':'▾ Details')+'</button>' +
          '</div>' +
          '<div style="grid-column:1 / -1; flex:1 1 100%;">'+adminOrderStepperHtml(o)+'</div>' +
          '</div>' + (open ? orderDetailHtml(o) : '');
      }).join('') +
      '<div class="cc-pager"><span class="ac-sub">Showing '+(from+1)+'–'+(from+pageOrders.length)+' of '+filtered.length+'</span>' +
        '<span style="display:flex; gap:6px; align-items:center;"><button class="btn-admin sm outline" id="ordPrev"'+(ORDER_UI.page<=1?' disabled':'')+'>‹ Prev</button>' +
        '<span>Page '+ORDER_UI.page+' / '+pages+'</span><button class="btn-admin sm outline" id="ordNext"'+(ORDER_UI.page>=pages?' disabled':'')+'>Next ›</button></span></div>';
  }
  adminMain.innerHTML = statHtml + toolbar + bulkBar + listHtml;
  wireAdminOrders();
  wireOrderListUi(filtered, pageOrders, selIds);
  updatePayBadge();
}
function exportOrdersExcel(list, label){
  if(!list.length){ showToast('No orders to export'); return; }
  var ws = XLSX.utils.json_to_sheet(list.map(orderExportRow));
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, 'AshirvadConnect_Orders_'+label+'_'+(new Date().toISOString().slice(0,10))+'.xlsx');
}
function wireOrderListUi(filtered, pageOrders, selIds){
  var adminMain = document.getElementById('adminMain');
  var $ = function(id){ return document.getElementById(id); };
  adminMain.querySelectorAll('[data-autostatus-toggle]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.stopPropagation();
      var id = el.getAttribute('data-autostatus-toggle');
      var o = findOrder(id); if(!o) return;
      o.autoStatusOff = !o.autoStatusOff;
      saveOrder(o);
      logAudit(o.autoStatusOff ? 'Order auto-status turned off' : 'Order auto-status turned on', '#'+id);
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-toggle-order]').forEach(function(el){
    el.addEventListener('click', function(e){
      if(e.target.closest('[data-ord-dealer]')) return;
      var id = el.getAttribute('data-toggle-order');
      if(ORDER_UI.expanded[id]) delete ORDER_UI.expanded[id]; else ORDER_UI.expanded[id] = true;
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-ord-dealer]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.stopPropagation();
      ORDER_SEARCH = el.getAttribute('data-ord-dealer'); ORDER_UI.page = 1; renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('.ord-sel').forEach(function(cb){
    cb.addEventListener('change', function(){
      var id = cb.getAttribute('data-oid');
      if(cb.checked) ORDER_UI.selected[id] = true; else delete ORDER_UI.selected[id];
      renderAdminOrders();
    });
  });
  var selAll = $('ordSelAll');
  if(selAll) selAll.addEventListener('change', function(){
    pageOrders.forEach(function(o){ if(selAll.checked) ORDER_UI.selected[o.id] = true; else delete ORDER_UI.selected[o.id]; });
    renderAdminOrders();
  });
  var again = function(fn){ return function(){ fn.call(this); ORDER_UI.page = 1; renderAdminOrders(); }; };
  $('ordRange').addEventListener('change', again(function(){ ORDER_UI.range = this.value; }));
  $('ordSort').addEventListener('change', again(function(){ ORDER_UI.sort = this.value; }));
  $('ordPageSize').addEventListener('change', again(function(){ ORDER_UI.pageSize = Number(this.value) || 20; }));
  if($('ordFrom')) $('ordFrom').addEventListener('change', again(function(){ ORDER_UI.from = this.value; }));
  if($('ordTo')) $('ordTo').addEventListener('change', again(function(){ ORDER_UI.to = this.value; }));
  if($('ordClear')) $('ordClear').addEventListener('click', function(){
    ORDER_SEARCH = ''; currentOrderFilter = 'all'; ORDER_UI.range = 'all'; ORDER_UI.from = ''; ORDER_UI.to = ''; ORDER_UI.page = 1; renderAdminOrders();
  });
  if($('ordPrev')) $('ordPrev').addEventListener('click', function(){ ORDER_UI.page--; renderAdminOrders(); });
  if($('ordNext')) $('ordNext').addEventListener('click', function(){ ORDER_UI.page++; renderAdminOrders(); });
  $('btnExportFiltered').addEventListener('click', function(){ exportOrdersExcel(filtered, filtered.length === getAllOrders().length ? 'All' : 'Filtered'); });
  if(selIds.length){
    var picked = function(){ return getAllOrders().filter(function(o){ return ORDER_UI.selected[o.id]; }); };
    $('ordBulkClear').addEventListener('click', function(){ ORDER_UI.selected = {}; renderAdminOrders(); });
    $('ordBulkExport').addEventListener('click', function(){ exportOrdersExcel(picked(), 'Selected'); });
    if($('ordBulkAutoOn')) $('ordBulkAutoOn').addEventListener('click', function(){
      var list = picked(); list.forEach(function(o){ o.autoStatusOff = false; saveOrder(o); });
      logAudit('Orders bulk auto-status turned on', list.length+' order(s)');
      showToast('Auto-status turned on for '+list.length+' order(s)');
      ORDER_UI.selected = {}; renderAdminOrders();
    });
    if($('ordBulkAutoOff')) $('ordBulkAutoOff').addEventListener('click', function(){
      var list = picked(); list.forEach(function(o){ o.autoStatusOff = true; saveOrder(o); });
      logAudit('Orders bulk auto-status turned off', list.length+' order(s)');
      showToast('Auto-status turned off for '+list.length+' order(s) — handle these manually');
      ORDER_UI.selected = {}; renderAdminOrders();
    });
    $('ordBulkAdvance').addEventListener('click', function(){
      var list = picked().filter(function(o){ return nextOrderStatus(o.status); });
      if(!list.length){ showToast('Selected orders are already at their final status'); return; }
      if(!confirm('Move '+list.length+' order(s) to their next status?')) return;
      list.forEach(function(o){ applyOrderStatus(o, nextOrderStatus(o.status)); });
      logAudit('Orders bulk status update', list.length+' order(s) advanced: '+list.slice(0,10).map(function(o){ return '#'+o.id+'→'+o.status; }).join(', ')+(list.length>10?' …':''));
      showToast(list.length+' order(s) updated');
      ORDER_UI.selected = {}; renderAdminOrders();
    });
    $('ordBulkCancel').addEventListener('click', function(){
      var list = picked().filter(function(o){ return o.status !== 'delivered' && o.status !== 'cancelled'; });
      if(!list.length){ showToast('Nothing to cancel — delivered/cancelled orders are skipped'); return; }
      if(!confirm('Cancel '+list.length+' order(s)? This cannot be undone.')) return;
      list.forEach(function(o){ applyOrderStatus(o, 'cancelled'); });
      logAudit('Orders bulk cancelled', list.length+' order(s): '+list.slice(0,10).map(function(o){ return '#'+o.id; }).join(', ')+(list.length>10?' …':''));
      showToast(list.length+' order(s) cancelled');
      ORDER_UI.selected = {}; renderAdminOrders();
    });
  }
}
function wireAdminOrders(){
  var adminMain = document.getElementById('adminMain');
  adminMain.querySelectorAll('.stat-card[data-filter]').forEach(function(card){
    card.addEventListener('click', function(){
      currentOrderFilter = card.getAttribute('data-filter'); ORDER_UI.page = 1;
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-advance]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-advance');
      var o = findOrder(id);
      if(!o) return;
      var next = nextOrderStatus(o.status);
      if(next){ applyOrderStatus(o, next); showToast('Order '+id+' marked '+next); renderAdminOrders(); }
    });
  });
  adminMain.querySelectorAll('[data-cancel]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-cancel');
      var o = findOrder(id);
      if(!o) return;
      if(!confirm('Cancel order '+id+'?')) return;
      applyOrderStatus(o, 'cancelled'); showToast('Order '+id+' cancelled'); renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-discount-toggle]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-discount-toggle');
      ORDER_UI.discountOpen[id] = !ORDER_UI.discountOpen[id];
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-apply-discount]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-apply-discount');
      var o = findOrder(id);
      if(!o) return;
      var type = document.getElementById('dtype-'+id).value;
      var val = Number(document.getElementById('dval-'+id).value);
      var reason = document.getElementById('dreason-'+id).value.trim();
      if(!val || val <= 0){ showToast('Enter a valid discount value'); return; }
      o.discount = { type:type, value:val, reason:reason };
      o.discountSeen = false;
      saveOrder(o);
      logAudit('Order discount applied', 'Order #'+o.id+' ('+(o.dealerBusiness||o.dealerGst)+'): '+(type==='flat'?('₹'+val):(val+'%'))+' off'+(reason?' — '+reason:''));
      showToast('Discount applied to '+id);
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-export]').forEach(function(btn){
    btn.addEventListener('click', function(){ exportOrderExcel(btn.getAttribute('data-export')); });
  });
  adminMain.querySelectorAll('[data-invoice]').forEach(function(btn){
    btn.addEventListener('click', function(){ openInvoice(btn.getAttribute('data-invoice')); });
  });
  var searchInput = document.getElementById('orderSearchInput');
  if(searchInput){
    searchInput.addEventListener('input', function(){
      ORDER_SEARCH = searchInput.value; ORDER_UI.page = 1;
      var cursorPos = searchInput.selectionStart;
      renderAdminOrders();
      var again = document.getElementById('orderSearchInput');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  adminMain.querySelectorAll('[data-edit-toggle]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-edit-toggle');
      ORDER_UI.editOpen[id] = !ORDER_UI.editOpen[id];
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-add-item]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-add-item');
      var o = findOrder(id);
      if(!o) return;
      var pid = Number(document.getElementById('eiProduct-'+id).value);
      var addQty = Math.max(1, Number(document.getElementById('eiQty-'+id).value) || 0);
      var p = PRODUCTS.find(function(pp){ return pp.id === pid; });
      if(!p){ showToast('Pick a product'); return; }
      var existing = o.items.find(function(it){ return it.id === pid; });
      if(existing){
        existing.qty += addQty;
      } else {
        var price = finalPrice(p, o.dealerGst, addQty);
        var taxable = Math.round((price/(1+p.gstPct/100))*100)/100;
        var gstAmt = Math.round((price-taxable)*100)/100;
        o.items.push({ id:p.id, name:p.name, qty:addQty, price:price, gstPct:p.gstPct, taxable:taxable, gstAmt:gstAmt });
      }
      o.total = o.items.reduce(function(s,it){ return s + it.price*it.qty; }, 0);
      saveOrder(o);
      logAudit('Order items edited', 'Order #'+o.id+': added '+addQty+' × '+p.name);
      showToast('Item added to order');
      renderAdminOrders();
    });
  });
  adminMain.querySelectorAll('[data-save-items]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-save-items');
      var o = findOrder(id);
      if(!o) return;
      var form = document.getElementById('ef-'+id);
      var qtyInputs = form.querySelectorAll('.ei-qty');
      var newItems = [];
      qtyInputs.forEach(function(inp){
        var idx = Number(inp.getAttribute('data-idx'));
        var newQty = Math.max(0, Number(inp.value) || 0);
        if(newQty > 0){
          var it = o.items[idx];
          it.qty = newQty;
          newItems.push(it);
        }
      });
      if(newItems.length === 0){ showToast('An order needs at least one item — use Cancel instead.'); return; }
      o.items = newItems;
      o.total = o.items.reduce(function(s,it){ return s + it.price*it.qty; }, 0);
      saveOrder(o);
      logAudit('Order items edited', 'Order #'+o.id+': quantities updated');
      showToast('Order items updated');
      renderAdminOrders();
    });
  });
  var autoRulesBtn = document.getElementById('btnAutoStatusRules');
  if(autoRulesBtn) autoRulesBtn.addEventListener('click', function(){ ORDER_AUTO_RULES_VIEW = true; renderAdminOrders(); });
  var invSettingsBtn = document.getElementById('btnInvoiceSettings');
  if(invSettingsBtn) invSettingsBtn.addEventListener('click', openInvoiceSettings);
  var backupBtn = document.getElementById('btnFullBackup');
  if(backupBtn) backupBtn.addEventListener('click', exportFullBackup);
}
function openInvoiceSettings(){
  document.getElementById('invoiceSettingsOffcanvasTitle').textContent = 'Invoice & Payment Settings';
  var body = document.getElementById('invoiceSettingsOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Shop / Dealer Name (as on invoice)</label><input type="text" id="isName" value="'+esc(SETTINGS.shopName)+'"></div>' +
      '<div class="full"><label>Business Logo (image URL)</label><input type="text" id="isLogo" value="'+esc(SETTINGS.logoUrl||'')+'" placeholder="https://example.com/logo.png"></div>' +
      (SETTINGS.logoUrl ? '<div class="full"><img src="'+esc(SETTINGS.logoUrl)+'" style="max-height:50px; max-width:160px;" onerror="this.style.display=\'none\';"></div>' : '') +
      '<div class="full"><label>Shop GSTIN</label><input type="text" id="isGstin" value="'+esc(SETTINGS.shopGstin)+'"></div>' +
      '<div class="full"><label>Shop Address</label><textarea id="isAddress" rows="2">'+esc(SETTINGS.shopAddress)+'</textarea></div>' +
      '<div class="full"><label>Shop Phone</label><input type="tel" id="isPhone" value="'+esc(SETTINGS.shopPhone)+'"></div>' +
      '<div class="full" style="border-top:1px solid #e6dfcb; padding-top:10px; margin-top:6px;"><b>💳 UPI payments (free — money goes straight to your account)</b></div>' +
      '<div class="full" style="font-size:12px; color:#52607a;">Dealers see the <b>Pay now / Pay later</b> choice at checkout only after a UPI ID is saved here. The same goes for the “Pay now” button on their orders.</div>' +
      '<div class="full"><label>Your UPI ID (VPA)</label><input type="text" id="isUpi" value="'+esc(SETTINGS.upiId||'')+'" placeholder="yourshop@okhdfcbank" autocapitalize="none"></div>' +
      '<div class="full"><label>Name shown in the UPI app</label><input type="text" id="isUpiName" value="'+esc(SETTINGS.upiName||'')+'" placeholder="Shop name"></div>' +
      '<div class="full"><label>QR code shown to dealers</label><select id="isQrMode"><option value="auto">Automatic — made from my UPI ID with the exact order amount (recommended)</option><option value="image">My own QR image (bank / PhonePe Business / Paytm QR)</option></select></div>' +
      '<div class="full" id="isQrAutoBox"><label>Preview — what a dealer scans (sample ₹1)</label><div id="isQrAutoPrev" style="margin-top:4px;"></div></div>' +
      '<div class="full" id="isQrImgBox" style="display:none;"><label>Your QR image</label><div style="display:flex; gap:8px; flex-wrap:wrap;"><button type="button" class="btn-admin sm outline" id="isQrUp">⬆ Upload QR image</button><button type="button" class="btn-admin sm outline" id="isQrClr">Remove</button></div><input type="file" id="isQrFile" accept="image/*" style="display:none;"><label style="margin-top:8px;">…or paste an image link</label><input type="text" id="isQrUrl" placeholder="https://…/my-qr.png"><div id="isQrImgPrev" style="margin-top:8px;"></div><div class="ac-sub">With your own QR image the dealer types the amount shown on screen. You can change or remove it any time — new payments use it immediately.</div></div>' +
      '<div class="full"><label style="display:flex; gap:8px; align-items:center; font-size:12.5px;"><input type="checkbox" id="isPayNow" style="width:20px; height:20px; flex:none; padding:0;"'+(SETTINGS.payNowOn!==false?' checked':'')+'> <span>Offer “Pay now with UPI” at checkout</span></label></div>' +
      '<div class="full"><label style="display:flex; gap:8px; align-items:center; font-size:12.5px;"><input type="checkbox" id="isPayLater" style="width:20px; height:20px; flex:none; padding:0;"'+(SETTINGS.payLaterOn!==false?' checked':'')+'> <span>Offer “Pay later” (adds to the dealer\'s account balance)</span></label></div>' +
      '<div class="full"><label>Extra payment instructions (bank account details, cheque info… shown to dealers)</label><textarea id="isPayNote" rows="3">'+esc(SETTINGS.payNote||'')+'</textarea></div>' +
    '</div>' +
    '<button class="btn-admin mt-3" id="saveInvoiceSettingsBtn" style="width:100%;">Save invoice settings</button>';
  var qrState = { image: SETTINGS.qrImage || '' }, gv = function(id){ return document.getElementById(id); }, modeSel = gv('isQrMode');
  modeSel.value = SETTINGS.qrMode === 'image' ? 'image' : 'auto';
  if(qrState.image && !/^data:/.test(qrState.image)) gv('isQrUrl').value = qrState.image;
  function qrPaint(){
    var img = modeSel.value === 'image';
    gv('isQrImgBox').style.display = img ? 'block' : 'none'; gv('isQrAutoBox').style.display = img ? 'none' : 'block';
    gv('isQrImgPrev').innerHTML = qrState.image ? '<img src="'+esc(qrState.image)+'" alt="QR" style="max-width:200px; max-height:200px; border:1px solid #ddd; border-radius:8px; background:#fff;">' : '<span class="ac-sub">No image yet.</span>';
    var vpa = gv('isUpi').value.trim(), box = gv('isQrAutoPrev'); box.innerHTML = '';
    if(vpa && /^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9.\-]{1,}$/.test(vpa)){ try{ renderQRInto('isQrAutoPrev', 'upi://pay?pa=' + encodeURIComponent(vpa) + '&pn=' + encodeURIComponent(gv('isUpiName').value.trim() || gv('isName').value.trim() || 'Shop') + '&am=1.00&cu=INR&tn=' + encodeURIComponent('Test'), 140); }catch(e){} }
    else box.innerHTML = '<span class="ac-sub">Enter your UPI ID above to see the QR.</span>';
  }
  modeSel.addEventListener('change', qrPaint); gv('isUpi').addEventListener('input', qrPaint); gv('isUpiName').addEventListener('input', qrPaint);
  gv('isQrUrl').addEventListener('input', function(){ qrState.image = this.value.trim(); qrPaint(); });
  gv('isQrClr').addEventListener('click', function(){ qrState.image = ''; gv('isQrUrl').value = ''; qrPaint(); });
  gv('isQrUp').addEventListener('click', function(){ gv('isQrFile').click(); });
  gv('isQrFile').addEventListener('change', function(){
    var f = this.files && this.files[0]; if(!f) return; var fr = new FileReader();
    fr.onload = function(){ var im = new Image(); im.onload = function(){
      var sc = Math.min(1, 420 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
      var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
      var d = cv.toDataURL('image/png'); if(d.length > 120000) d = cv.toDataURL('image/jpeg', 0.92);
      if(d.length > 120000){ showToast('That image is too big — crop it to just the QR and try again'); return; }
      qrState.image = d; gv('isQrUrl').value = ''; qrPaint(); showToast('QR image ready — press Save');
    }; im.onerror = function(){ showToast('Could not read that image'); }; im.src = fr.result; };
    fr.readAsDataURL(f); this.value = '';
  });
  qrPaint();
  document.getElementById('saveInvoiceSettingsBtn').addEventListener('click', function(){
    var upiV = gv('isUpi').value.trim();
    if(upiV && !/^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9.\-]{1,}$/.test(upiV)){ showToast('The UPI ID looks wrong — it should look like shopname@okhdfcbank'); return; }
    if(modeSel.value === 'image' && !qrState.image){ showToast('Upload your QR image, or choose “Automatic”'); return; }
    saveSettings(Object.assign({}, SETTINGS, {
      qrMode: modeSel.value, qrImage: qrState.image,
      shopName: document.getElementById('isName').value.trim() || SETTINGS_DEFAULTS.shopName,
      logoUrl: document.getElementById('isLogo').value.trim(),
      shopGstin: document.getElementById('isGstin').value.trim(),
      shopAddress: document.getElementById('isAddress').value.trim(),
      shopPhone: document.getElementById('isPhone').value.trim(),
      upiId: document.getElementById('isUpi').value.trim(), upiName: document.getElementById('isUpiName').value.trim(),
      payNowOn: document.getElementById('isPayNow').checked, payLaterOn: document.getElementById('isPayLater').checked, payNote: document.getElementById('isPayNote').value.trim()
    }));
    showToast('Invoice settings saved');
    applyBranding();
    invoiceSettingsOffcanvas.hide();
    openInvoiceSettings();
  });
  invoiceSettingsOffcanvas.show();
}
function openDeliverySettings(){
  document.getElementById('deliverySettingsOffcanvasTitle').textContent = 'Home / Delivery Settings';
  var body = document.getElementById('deliverySettingsOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Free delivery minimum order value (₹, 0 = always charge)</label><input type="number" id="dsFreeMin" value="'+(Number(SETTINGS.freeDeliveryMin)||0)+'" min="0" step="100"></div>' +
      '<div class="full"><label>Delivery charge below minimum (₹)</label><input type="number" id="dsCharge" value="'+(Number(SETTINGS.deliveryCharge)||0)+'" min="0" step="10"></div>' +
      '<div class="full"><label>Support Phone</label><input type="tel" id="dsPhone" value="'+esc(SETTINGS.shopPhone)+'"></div>' +
      '<div class="full"><label>Support Email</label><input type="email" id="dsEmail" value="'+esc(SETTINGS.supportEmail)+'"></div>' +
      '<div class="full" style="border-top:1px solid #e6dfcb; padding-top:10px; margin-top:6px;"><b>🎯 Monthly order target (shown to dealers in their cart and account)</b></div>' +
      '<div class="full"><label>Target per dealer per month (₹, 0 = off)</label><input type="number" id="dsTarget" value="'+(Number(SETTINGS.monthTarget)||0)+'" min="0" step="1000"></div>' +
      '<div class="full"><label>What the dealer gets for reaching it (you give it manually, e.g. a credit note)</label><input type="text" id="dsReward" value="'+esc(SETTINGS.monthReward||'')+'" placeholder="e.g. Reach it and get 1% extra discount next month"></div>' +
    '</div>' +
    '<button class="btn-admin mt-3" id="saveDeliverySettingsBtn" style="width:100%;">Save settings</button>';
  document.getElementById('saveDeliverySettingsBtn').addEventListener('click', function(){
    saveSettings(Object.assign({}, SETTINGS, {
      freeDeliveryMin: Number(document.getElementById('dsFreeMin').value) || 0,
      deliveryCharge: Number(document.getElementById('dsCharge').value) || 0,
      shopPhone: document.getElementById('dsPhone').value.trim(),
      supportEmail: document.getElementById('dsEmail').value.trim(),
      monthTarget: Number(document.getElementById('dsTarget').value) || 0,
      monthReward: document.getElementById('dsReward').value.trim()
    }));
    showToast('Home / delivery settings saved');
    deliverySettingsOffcanvas.hide();
  });
  deliverySettingsOffcanvas.show();
}

/* ---------------- Dealers / Customers tab ---------------- */
var DEALER_STATUS = 'all', DEALER_PAGE = 1, DEALER_PAGE_SIZE = 25;
function setDealerActive(gst, makeActive){
  var users = getUsers(), u = users[gst];
  if(!u) return false;
  var reason = '';
  if(!makeActive){
    reason = prompt('Block "'+(u.business||gst)+'" from placing orders?\n\nOptional note shown to the dealer (leave empty for none):', '');
    if(reason === null) return false;
    reason = reason.trim();
  }
  updateDealerProfile(gst, { isActive: makeActive, blockReason: makeActive ? '' : reason });
  logAudit(makeActive ? 'Dealer activated' : 'Dealer blocked', (u.business||gst)+' ('+gst+')'+(reason ? ' — '+reason : ''));
  showToast((u.business||gst)+(makeActive ? ' can place orders again' : ' is blocked from placing orders'));
  return true;
}
function renderAdminCustomers(){
  var adminMain = document.getElementById('adminMain');
  var users = getUsers();
  var allGsts = Object.keys(users);
  var blockedCount = allGsts.filter(function(g){ return users[g].isActive === false; }).length;
  var toolbar = '<div class="admin-toolbar"><h2>Dealer Profiles <span class="ac-sub" style="font-weight:400;">· '+allGsts.length+' dealers'+(blockedCount?' · '+blockedCount+' blocked':'')+'</span></h2>' +
      '<div><button class="btn-admin outline" id="btnResetReqs">🔑 Password requests<span id="resetReqCount">'+(RESET_PENDING ? ' ('+RESET_PENDING+')' : '')+'</span></button></div></div>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center;">' +
      '<input type="text" id="dealerSearchInput" placeholder="🔍 Search by business name, GST or phone…" value="'+esc(DEALER_SEARCH||'')+'" style="flex:1; min-width:200px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
      [['all','All ('+allGsts.length+')'],['active','Active ('+(allGsts.length-blockedCount)+')'],['blocked','Blocked ('+blockedCount+')']].map(function(f){
        return '<button type="button" class="filter-chip'+(DEALER_STATUS===f[0]?' active':'')+'" data-dstatus="'+f[0]+'">'+f[1]+'</button>'; }).join('') +
    '</div>';
  var dq = (DEALER_SEARCH||'').trim().toLowerCase();
  var gsts = allGsts.filter(function(gst){
    var u = users[gst];
    if(DEALER_STATUS === 'active' && u.isActive === false) return false;
    if(DEALER_STATUS === 'blocked' && u.isActive !== false) return false;
    if(!dq) return true;
    var hay = (u.business+' '+gst+' '+(u.phone||'')+' '+(u.contactPerson||'')).toLowerCase();
    return hay.indexOf(dq) !== -1;
  });
  var pages = Math.max(1, Math.ceil(gsts.length / DEALER_PAGE_SIZE));
  if(DEALER_PAGE > pages) DEALER_PAGE = pages; if(DEALER_PAGE < 1) DEALER_PAGE = 1;
  var from = (DEALER_PAGE - 1) * DEALER_PAGE_SIZE;
  var pageGsts = gsts.slice(from, from + DEALER_PAGE_SIZE);
  var tableHtml;
  if(allGsts.length === 0){
    tableHtml = '<div class="admin-empty"><div class="ae-big">No dealers yet</div><div>Dealers appear here once they register.</div></div>';
  } else if(gsts.length === 0){
    tableHtml = '<div class="admin-empty"><div class="ae-big">No dealers match</div></div>';
  } else {
    tableHtml = '<div style="overflow-x:auto;"><table class="dealer-table"><thead><tr>' +
      '<th>Business</th><th>GST</th><th>Contact</th><th>Phone</th><th>Tier</th><th>Standing %</th><th>Can order</th><th></th>' +
      '</tr></thead><tbody>' +
      pageGsts.map(function(gst){
        var u = users[gst];
        var blocked = u.isActive === false;
        return '<tr'+(blocked?' style="background:#fdf1f1;"':'')+'>' +
          '<td>'+esc(u.business||'—')+(u.accountKey ? ' <span style="font-size:9px; color:var(--ink-600);">(linked)</span>' : '')+(blocked?' <span class="low-stock-pill" style="background:#fbdede; color:#a12626; font-size:10px;">Blocked</span>':'')+'</td>' +
          '<td>'+esc(gst)+'</td>' +
          '<td>'+esc(u.contactPerson||'—')+'</td>' +
          '<td>'+esc(u.phone||'—')+'</td>' +
          '<td><span class="tier-badge">'+esc(u.tier||'Standard')+'</span></td>' +
          '<td>'+(Number(u.standingDiscountPct)||0)+'%</td>' +
          '<td><label class="switch" title="'+(blocked?'Blocked — tap to activate':'Active — tap to block')+'"><input type="checkbox" data-toggle-active="'+esc(gst)+'"'+(blocked?'':' checked')+'><span class="slider"></span></label></td>' +
          '<td><button class="btn-admin sm outline" data-edit-dealer="'+esc(gst)+'">Edit</button></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="cc-pager"><span class="ac-sub">Showing '+(from+1)+'–'+(from+pageGsts.length)+' of '+gsts.length+'</span>' +
        '<span style="display:flex; gap:6px; align-items:center;"><button class="btn-admin sm outline" id="dPrev"'+(DEALER_PAGE<=1?' disabled':'')+'>‹ Prev</button>' +
        '<span>Page '+DEALER_PAGE+' / '+pages+'</span><button class="btn-admin sm outline" id="dNext"'+(DEALER_PAGE>=pages?' disabled':'')+'>Next ›</button></span></div>';
  }
  adminMain.innerHTML = toolbar + tableHtml;
  var rrBtn = document.getElementById('btnResetReqs'); if(rrBtn) rrBtn.addEventListener('click', openResetRequests);
  updateResetBadge();
  var dealerSearch = document.getElementById('dealerSearchInput');
  if(dealerSearch){
    dealerSearch.addEventListener('input', function(){
      DEALER_SEARCH = dealerSearch.value; DEALER_PAGE = 1;
      var cursorPos = dealerSearch.selectionStart;
      renderAdminCustomers();
      var again = document.getElementById('dealerSearchInput');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  adminMain.querySelectorAll('[data-dstatus]').forEach(function(b){
    b.addEventListener('click', function(){ DEALER_STATUS = b.getAttribute('data-dstatus'); DEALER_PAGE = 1; renderAdminCustomers(); });
  });
  var dp = document.getElementById('dPrev'), dn = document.getElementById('dNext');
  if(dp) dp.addEventListener('click', function(){ DEALER_PAGE--; renderAdminCustomers(); });
  if(dn) dn.addEventListener('click', function(){ DEALER_PAGE++; renderAdminCustomers(); });
  adminMain.querySelectorAll('[data-toggle-active]').forEach(function(cb){
    cb.addEventListener('change', function(){
      var gst = cb.getAttribute('data-toggle-active');
      setDealerActive(gst, cb.checked);   // cancelled prompt → no change
      renderAdminCustomers();
    });
  });
  adminMain.querySelectorAll('[data-edit-dealer]').forEach(function(btn){
    btn.addEventListener('click', function(){ openDealerEditor(btn.getAttribute('data-edit-dealer')); });
  });
}
function openDealerEditor(gst){
  var users = getUsers();
  var u = users[gst];
  if(!u) return;
  document.getElementById('dealerOffcanvasTitle').textContent = u.business || gst;
  var body = document.getElementById('dealerOffcanvasBody');
  var overrides = u.priceOverrides || {};
  var overrideIds = Object.keys(overrides);
  var acctPhone = u.accountKey || normalizePhone(u.phone);
  var linkedAcc = acctPhone ? getAccounts()[acctPhone] : null;
  var linkedGsts = linkedAcc ? linkedAcc.gsts : [gst];

  var isBlocked = u.isActive === false;
  body.innerHTML =
    '<div class="admin-card" style="border-left:4px solid '+(isBlocked?'#a12626':'#2e7d32')+'; padding:10px 14px;">' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">' +
        '<div><div class="ac-title" style="font-size:15px;">Account status</div>' +
        '<div class="ac-sub" id="edActiveHint">'+(isBlocked ? 'Blocked — this dealer can browse but cannot place orders.' : 'Active — this dealer can place orders.')+'</div></div>' +
        '<label class="switch"><input type="checkbox" id="edActive"'+(isBlocked?'':' checked')+'><span class="slider"></span></label></div>' +
      '<input type="text" id="edBlockReason" placeholder="Note shown to the dealer while blocked (optional)" value="'+esc(u.blockReason||'')+'" style="width:100%; margin-top:8px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12.5px;'+(isBlocked?'':' display:none;')+'">' +
    '</div>' +
    '<div class="admin-form-grid" style="margin-top:12px;">' +
      '<div class="full"><label>Business Name</label><input type="text" id="edBusiness" value="'+esc(u.business||'')+'"></div>' +
      '<div><label>GST Number</label><input type="text" value="'+esc(gst)+'" disabled></div>' +
      '<div><label>Tier</label><select id="edTier">' +
        ['Standard','Silver','Gold','Platinum'].map(function(tr){ return '<option value="'+tr+'"'+(u.tier===tr?' selected':'')+'>'+tr+'</option>'; }).join('') +
      '</select></div>' +
      '<div><label>Contact Person</label><input type="text" id="edContact" value="'+esc(u.contactPerson||'')+'"></div>' +
      '<div><label>Phone</label><input type="tel" id="edPhone" value="'+esc(u.phone||'')+'"></div>' +
      '<div class="full"><label>Email</label><input type="email" id="edEmail" value="'+esc(u.email||'')+'"></div>' +
      '<div class="full"><label>Registered Address</label><textarea id="edAddress" rows="2">'+esc(u.address||'')+'</textarea></div>' +
      '<div class="full"><label>Delivery Address</label><textarea id="edDelivery" rows="2">'+esc(u.deliveryAddress||u.address||'')+'</textarea></div>' +
      '<div><label>Standing Extra Discount %</label><input type="number" id="edStanding" value="'+(Number(u.standingDiscountPct)||0)+'" min="0" max="100" step="0.5"></div>' +
      '<div class="full"><label>Notes</label><textarea id="edNotes" rows="2">'+esc(u.notes||'')+'</textarea></div>' +
    '</div>' +
    '<button class="btn-admin mt-3" id="saveDealerBtn" style="width:100%;">Save profile</button>' +

    '<div class="admin-card mt-3">' +
      '<div class="ac-title" style="margin-bottom:8px;">Per-item Price Override</div>' +
      (overrideIds.length === 0 ? '<div class="ac-sub mb-2">No overrides set — this dealer uses product discount + standing % pricing.</div>' :
        overrideIds.map(function(pid){
          var p = PRODUCTS.find(function(pp){ return pp.id === Number(pid); });
          var ov = overrides[pid];
          var label = ov.type === 'net' ? ('Net '+money(ov.value)+' (before GST)') : (ov.value+'% off MRP');
          return '<div class="oi-line" style="align-items:center;"><span>'+esc(p ? p.name : ('#'+pid))+' — '+label+'</span>' +
            '<button class="btn-admin sm maroon" data-remove-override="'+pid+'">Remove</button></div>';
        }).join('')
      ) +
      '<div class="ac-sub mt-2" style="background:var(--ivory-100); border-radius:8px; padding:8px 10px; line-height:1.45;">' +
        'To give this dealer a special rate on a product, open that product\'s <b>Details → Dealer Pricing</b>. ' +
        'Rates are assigned there (for one or many dealers at once); this list shows what is currently set and lets you remove a rate.</div>' +
      '<button class="btn-admin sm mt-2" id="goProductPricingBtn">Go to Products &amp; Pricing →</button>' +
    '</div>' +

    '<div class="admin-card mt-3">' +
      '<div class="ac-title" style="margin-bottom:8px;">Linked Businesses (same login)</div>' +
      (linkedGsts.length <= 1 ? '<div class="ac-sub mb-2">No other businesses linked to this phone number yet.</div>' :
        linkedGsts.filter(function(g){ return g !== gst; }).map(function(g){
          var lu = users[g] || {};
          return '<div class="oi-line"><span>'+esc(lu.business||g)+' — '+esc(g)+'</span></div>';
        }).join('')
      ) +
      '<button class="btn-admin sm mt-2" id="linkBusinessBtn">+ Link new business</button>' +
      '<button class="btn-admin sm outline mt-2" id="exportDealerPriceListBtn">⬇ Export this dealer\'s price list</button>' +
    '</div>';

  document.getElementById('edActive').addEventListener('change', function(){
    var on = this.checked;
    document.getElementById('edBlockReason').style.display = on ? 'none' : 'block';
    document.getElementById('edActiveHint').textContent = on ? 'Active — this dealer can place orders.' : 'Blocked — this dealer can browse but cannot place orders.';
  });
  document.getElementById('saveDealerBtn').addEventListener('click', function(){
    var patch = {
      business: document.getElementById('edBusiness').value.trim(),
      tier: document.getElementById('edTier').value,
      contactPerson: document.getElementById('edContact').value.trim(),
      phone: document.getElementById('edPhone').value.trim(),
      email: document.getElementById('edEmail').value.trim(),
      address: document.getElementById('edAddress').value.trim(),
      deliveryAddress: document.getElementById('edDelivery').value.trim(),
      standingDiscountPct: Number(document.getElementById('edStanding').value) || 0,
      notes: document.getElementById('edNotes').value.trim(),
      isActive: document.getElementById('edActive').checked,
      blockReason: document.getElementById('edActive').checked ? '' : document.getElementById('edBlockReason').value.trim()
    };
    var wasBlocked = u.isActive === false;
    if(wasBlocked !== !patch.isActive){
      logAudit(patch.isActive ? 'Dealer activated' : 'Dealer blocked', (u.business||gst)+' ('+gst+')'+(patch.blockReason ? ' — '+patch.blockReason : ''));
    }
    var standingBefore = Number(u.standingDiscountPct)||0;
    updateDealerProfile(gst, patch);
    if(standingBefore !== patch.standingDiscountPct){
      logAudit('Dealer profile updated', (u.business||gst)+': standing % '+standingBefore+'→'+patch.standingDiscountPct);
    }
    showToast('Dealer profile saved');
    dealerOffcanvas.hide();
    if(currentAdminTab === 'customers') renderAdminCustomers();
  });
  body.querySelectorAll('[data-remove-override]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var pid = btn.getAttribute('data-remove-override');
      var p = PRODUCTS.find(function(pp){ return pp.id === Number(pid); });
      removeDealerOverride(gst, pid);
      logAudit('Price override removed', (u.business||gst)+' — '+(p?p.name:('#'+pid)));
      showToast('Override removed');
      openDealerEditor(gst);
    });
  });
  document.getElementById('goProductPricingBtn').addEventListener('click', function(){
    try{ dealerOffcanvas.hide(); }catch(e){}
    goAdminTab('products');
  });
  document.getElementById('linkBusinessBtn').addEventListener('click', function(){
    var newBusiness = window.prompt('New business name:');
    if(!newBusiness) return;
    var newGst = window.prompt('New GST number:');
    if(!newGst) return;
    newGst = newGst.trim().toUpperCase();
    var newAddress = window.prompt('Business address:') || '';
    var usersNow = getUsers();
    if(usersNow[newGst]){ showToast('That GST number already exists'); return; }
    usersNow[newGst] = {
      business:newBusiness.trim(), gst:newGst, phone:u.phone||'', address:newAddress, password:u.password,
      contactPerson:'', email:'', deliveryAddress:newAddress, tier:'Standard',
      notes:'', standingDiscountPct:0, accountKey:acctPhone
    };
    saveUsers(usersNow);
    linkGstToAccount(u.phone, newGst, u.password);
    logAudit('Business linked', newBusiness+' ('+newGst+') linked under same login as '+(u.business||gst));
    showToast('New business linked');
    openDealerEditor(gst);
    if(currentAdminTab === 'customers') renderAdminCustomers();
  });
  document.getElementById('exportDealerPriceListBtn').addEventListener('click', function(){ exportDealerPriceList(gst); });
  dealerOffcanvas.show();
}

/* ---------------- Products & Pricing tab ---------------- */
function renderAdminProducts(){
  var adminMain = document.getElementById('adminMain');
  var lowCount = PRODUCTS.filter(function(p){ return Number(p.stock) > 0 && Number(p.stock) <= LOW_STOCK_THRESHOLD; }).length;
  var oosCount = PRODUCTS.filter(function(p){ return Number(p.stock) <= 0; }).length;
  var toolbar = '<div class="admin-toolbar"><h2>Products &amp; Pricing</h2>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
      (lowCount ? '<span class="low-stock-pill">⚠ '+lowCount+' low stock</span>' : '') +
      (oosCount ? '<span class="low-stock-pill" style="background:#fbdede; color:#a12626;">⛔ '+oosCount+' out of stock</span>' : '') +
      '<button class="btn-admin outline" id="btnDownloadTemplate">⬇ Template (all products)</button>' +
      '<button class="btn-admin" id="btnBulkUpdate">📤 Bulk update (CSV/Excel)</button>' +
      '<input type="file" id="bulkUpdateFile" accept=".csv,.xlsx,.xls" class="d-none">' +
    '</div></div>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">' +
      '<input type="text" id="productSearchInput" placeholder="🔍 Search by name, part code or category…" value="'+esc(PRODUCT_SEARCH||'')+'" style="flex:2; min-width:180px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
      '<select id="productCategoryFilter" style="flex:1; min-width:130px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
        '<option value="">All categories</option>' +
        (PRODUCT_SCOPE === 'catalog'
          ? CATALOG_CATEGORIES.map(function(c){ return '<option value="'+esc(c.id)+'"'+(PRODUCT_CATALOG_CAT===c.id?' selected':'')+'>'+esc(c.name)+'</option>'; }).join('')
          : CATEGORY_ORDER.map(function(c){ return '<option value="'+c+'"'+(PRODUCT_CAT_FILTER===c?' selected':'')+'>'+t(CATEGORY_META[c].labelKey)+'</option>'; }).join('')) +
      '</select>' +
    '</div>' +
    '<div class="bulk-upload-row"><b>Bulk update:</b> download the template (it lists every product, catalog items included), edit <b>MRP, Discount %, GST %, Stock</b>, and upload it back (.xlsx or .csv). A blank cell keeps the current value; <b>Item Code</b> must match. Product / Category columns are ignored. Catalog items can use <b>unlimited</b> for stock.</div>';
  var pq = (PRODUCT_SEARCH||'').trim().toLowerCase();
  var catalogItemCount = PRODUCTS.filter(function(p){ return p.isCatalogVariant; }).length;
  var regularCount = PRODUCTS.length - catalogItemCount;
  var scopeRow = '<div class="filter-row">' +
    '<button type="button" class="filter-chip'+(PRODUCT_SCOPE==='regular'?' active':'')+'" data-pscope="regular">Regular products ('+regularCount+')</button>' +
    '<button type="button" class="filter-chip'+(PRODUCT_SCOPE==='catalog'?' active':'')+'" data-pscope="catalog">📇 Catalog items ('+catalogItemCount+')</button>' +
  '</div>';
  var catalogRowsHtml = '';
  if(PRODUCT_SCOPE === 'catalog'){
    var gmap = {}; SPEC_GROUPS.forEach(function(g){ gmap[g.id] = g; });
    var catList = PRODUCTS.filter(function(p){
      if(!p.isCatalogVariant) return false;
      var g = gmap[p.specGroupId];
      if(PRODUCT_CATALOG_CAT && (!g || g.categoryId !== PRODUCT_CATALOG_CAT)) return false;
      if(!pq) return true;
      return (p.name+' '+p.part+' '+p.size+' '+(g ? catalogCatName(g.categoryId) : '')).toLowerCase().indexOf(pq) !== -1;
    });
    var PAGE_SZ = 50, pages = Math.max(1, Math.ceil(catList.length / PAGE_SZ));
    if(PRODUCT_PAGE > pages) PRODUCT_PAGE = pages; if(PRODUCT_PAGE < 1) PRODUCT_PAGE = 1;
    var from = (PRODUCT_PAGE - 1) * PAGE_SZ;
    catalogRowsHtml = catList.length === 0
      ? '<div class="admin-empty"><div class="ae-big">No catalog items match</div></div>'
      : catList.slice(from, from + PAGE_SZ).map(function(p){
          var g = gmap[p.specGroupId];
          var stockTxt = (p.stock === Infinity || p.stock === undefined) ? '∞' : (String(p.stock) + (distStockOf(p.id) ? ' <small style="color:#2b6" title="held by distributors">+' + distStockOf(p.id) + ' at distributors</small>' : ''));
          return '<div class="prod-row cat-variant" data-pid="'+p.id+'">' +
            '<div><div class="pr-name">'+esc(p.name)+'</div><div class="pr-size">'+esc(g ? catalogCatName(g.categoryId) : '')+' · '+esc(p.part)+'</div></div>' +
            '<div><label>MRP (₹)</label><b>'+money(p.mrp)+'</b></div>' +
            '<div><label>Discount %</label><b>'+(Number(p.discountPct)||0)+'</b></div>' +
            '<div><label>GST %</label><b>'+p.gstPct+'</b></div>' +
            '<div><label>Stock</label><b>'+stockTxt+'</b></div>' +
            '<div><label>Managed in</label><span class="ac-sub">Catalog card</span></div>' +
            '<div class="pf-price-cell"><label>Dealer sees</label><b class="pf-price-preview">'+money(standardPrice(p))+'</b>'+(overrideCountFor(p.id) ? '<div class="ac-sub" style="color:var(--maroon-600); font-weight:600;">'+overrideCountFor(p.id)+' special rate'+(overrideCountFor(p.id)>1?'s':'')+'</div>' : '')+'</div>' +
            '<div class="pf-actions"><label>&nbsp;</label><div style="display:flex; gap:6px;">' +
              '<button type="button" class="btn-admin sm outline pf-details" style="flex:1;">💲 Details</button>' +
              '<button type="button" class="btn-admin sm pf-cardedit" style="flex:1;">✏️ Card</button></div></div>' +
          '</div>';
        }).join('') +
        '<div class="cc-pager"><span class="ac-sub">'+(catList.length ? (from+1)+'–'+Math.min(from+PAGE_SZ, catList.length)+' of '+catList.length : '')+'</span>' +
          '<span style="display:flex; gap:6px; align-items:center;"><button class="btn-admin sm outline" id="pcPrev"'+(PRODUCT_PAGE<=1?' disabled':'')+'>‹ Prev</button>' +
          '<span>Page '+PRODUCT_PAGE+' / '+pages+'</span><button class="btn-admin sm outline" id="pcNext"'+(PRODUCT_PAGE>=pages?' disabled':'')+'>Next ›</button></span></div>';
  }
  var visibleProducts = PRODUCT_SCOPE === 'catalog' ? [] : PRODUCTS.filter(function(p){
    if(p.isCatalogVariant) return false;
    if(PRODUCT_CAT_FILTER && p.cat !== PRODUCT_CAT_FILTER) return false;
    if(!pq) return true;
    var hay = (p.name+' '+p.part+' '+p.cat+' '+p.size).toLowerCase();
    return hay.indexOf(pq) !== -1;
  });
  var rows = PRODUCT_SCOPE === 'catalog' ? catalogRowsHtml : visibleProducts.length === 0
    ? '<div class="admin-empty"><div class="ae-big">No products match your search/filter</div></div>'
    : visibleProducts.map(function(p){
    var stock = Number(p.stock)||0;
    var rowClass = stock <= 0 ? ' oos' : (stock <= LOW_STOCK_THRESHOLD ? ' low' : '');
    var overrideN = overrideCountFor(p.id);
    return '<div class="prod-row'+(p.active===false?' inactive':'')+rowClass+'" data-pid="'+p.id+'">' +
      '<div><div class="pr-name">'+esc(p.name)+'</div><div class="pr-size">'+esc(p.size)+' · '+esc(p.part)+'</div></div>' +
      '<div><label>MRP (₹)</label><input type="number" class="pf-mrp" value="'+p.mrp+'"></div>' +
      '<div><label>Discount %</label><input type="number" class="pf-disc" value="'+p.discountPct+'"></div>' +
      '<div><label>GST %</label><input type="number" class="pf-gst" value="'+p.gstPct+'"></div>' +
      '<div><label>Stock</label><input type="number" class="pf-stock" value="'+stock+'" min="0"></div>' +
      '<div><label>Active</label><label class="switch"><input type="checkbox" class="pf-active"'+(p.active!==false?' checked':'')+'><span class="slider"></span></label></div>' +
      '<div class="pf-price-cell"><label>Dealer sees</label><b class="pf-price-preview">'+money(standardPrice(p))+'</b>'+(overrideN ? '<div class="ac-sub" style="color:var(--maroon-600); font-weight:600;">'+overrideN+' special rate'+(overrideN>1?'s':'')+'</div>' : '')+'</div>' +
      '<div class="pf-actions"><label>&nbsp;</label><div style="display:flex; gap:6px;"><button type="button" class="btn-admin sm outline pf-details" style="flex:1;">📝 Details</button><button type="button" class="btn-admin sm pf-save" style="flex:1;">💾 Save</button></div></div>' +
    '</div>';
  }).join('');

  var catalogPointerHtml = '<div class="admin-card mt-3" style="border-left:4px solid var(--gold-500);">' +
    '<div class="ac-title">📇 Catalog cards have their own section</div>' +
    '<div class="ac-sub">Agri, Casing, Column and any category you add are managed in the <b>Catalog</b> tab — with search, category navigator, bulk move/merge and pagination.</div>' +
    '<div class="ac-actions"><button class="btn-admin" id="btnGoCatalog">Open Catalog →</button></div></div>';

  adminMain.innerHTML = toolbar + bulkResultHtml() + scopeRow + rows + catalogPointerHtml;
  var prodSearch = document.getElementById('productSearchInput');
  if(prodSearch){
    prodSearch.addEventListener('input', function(){
      PRODUCT_SEARCH = prodSearch.value; PRODUCT_PAGE = 1;
      var cursorPos = prodSearch.selectionStart;
      renderAdminProducts();
      var again = document.getElementById('productSearchInput');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  var prodCatFilter = document.getElementById('productCategoryFilter');
  if(prodCatFilter){
    prodCatFilter.addEventListener('change', function(){
      if(PRODUCT_SCOPE === 'catalog') PRODUCT_CATALOG_CAT = prodCatFilter.value; else PRODUCT_CAT_FILTER = prodCatFilter.value;
      PRODUCT_PAGE = 1;
      renderAdminProducts();
    });
  }
  adminMain.querySelectorAll('[data-pscope]').forEach(function(b){
    b.addEventListener('click', function(){ PRODUCT_SCOPE = b.getAttribute('data-pscope'); PRODUCT_PAGE = 1; renderAdminProducts(); });
  });
  var pcPrev = document.getElementById('pcPrev'), pcNext = document.getElementById('pcNext');
  if(pcPrev) pcPrev.addEventListener('click', function(){ PRODUCT_PAGE--; renderAdminProducts(); });
  if(pcNext) pcNext.addEventListener('click', function(){ PRODUCT_PAGE++; renderAdminProducts(); });
  adminMain.querySelectorAll('.prod-row.cat-variant').forEach(function(row){
    var pid = Number(row.getAttribute('data-pid'));
    row.querySelector('.pf-details').addEventListener('click', function(){ openProductDetailsEditor(pid); });
    row.querySelector('.pf-cardedit').addEventListener('click', function(){
      var pr = PRODUCTS.find(function(pp){ return pp.id === pid; });
      if(pr) openCatalogVariantInBuilder(pr);
    });
  });
  adminMain.querySelectorAll('.prod-row:not(.cat-variant)').forEach(function(row){
    var pid = Number(row.getAttribute('data-pid'));
    // Live "Dealer sees" preview: recompute the instant admin edits MRP / Discount % / GST %,
    // using a throwaway copy so nothing is saved until "Save" is pressed. This is what makes
    // it obvious what a value being typed will actually mean, instead of admin having to save
    // first and only then discover the resulting price was wrong.
    var previewEl = row.querySelector('.pf-price-preview');
    var priceCell = row.querySelector('.pf-price-cell');
    function refreshRowPreview(){
      var draft = {
        mrp: Number(row.querySelector('.pf-mrp').value) || 0,
        discountPct: Number(row.querySelector('.pf-disc').value) || 0,
        gstPct: Number(row.querySelector('.pf-gst').value) || 0
      };
      var priceNow = standardPrice(draft);
      previewEl.textContent = money(priceNow);
      var warn = draft.mrp <= 0 || priceNow <= 0;
      if(priceCell) priceCell.classList.toggle('pf-price-warn', warn);
      previewEl.title = warn ? 'Check MRP / Discount % — this works out to '+money(priceNow) : '';
    }
    ['.pf-mrp','.pf-disc','.pf-gst'].forEach(function(sel){
      var input = row.querySelector(sel);
      if(input) input.addEventListener('input', refreshRowPreview);
    });
    row.querySelector('.pf-details').addEventListener('click', function(){ openProductDetailsEditor(pid); });
    row.querySelector('.pf-save').addEventListener('click', function(){
      var p = PRODUCTS.find(function(pp){ return pp.id === pid; });
      if(!p) return;
      var oldStock = Number(p.stock)||0;
      var before = { mrp:p.mrp, discountPct:p.discountPct, gstPct:p.gstPct, stock:p.stock };
      p.mrp = Number(row.querySelector('.pf-mrp').value) || p.mrp;
      p.discountPct = Number(row.querySelector('.pf-disc').value) || 0;
      p.gstPct = Number(row.querySelector('.pf-gst').value) || 0;
      p.stock = Math.max(0, Number(row.querySelector('.pf-stock').value) || 0);
      p.active = row.querySelector('.pf-active').checked;
      saveProducts(PRODUCTS);
      checkAndFulfillStockNotify(p.id, oldStock, p.stock);
      logAudit('Product updated', p.name+': MRP '+before.mrp+'→'+p.mrp+', Disc '+before.discountPct+'%→'+p.discountPct+'%, GST '+before.gstPct+'%→'+p.gstPct+'%, Stock '+before.stock+'→'+p.stock);
      showToast('Product saved');
      renderAdminProducts();
    });
  });
  document.getElementById('btnDownloadTemplate').addEventListener('click', downloadProductTemplate);
  var dismissBulk = document.getElementById('btnDismissBulk');
  if(dismissBulk) dismissBulk.addEventListener('click', function(){ BULK_RESULT = null; renderAdminProducts(); });
  document.getElementById('btnBulkUpdate').addEventListener('click', function(){
    document.getElementById('bulkUpdateFile').click();
  });
  document.getElementById('bulkUpdateFile').addEventListener('change', function(e){
    var file = e.target.files[0];
    if(!file) return;
    handleBulkProductUpdate(file);
    e.target.value = '';
  });
  document.getElementById('btnGoCatalog').addEventListener('click', function(){ goAdminTab('catalog'); });
}
function goAdminTab(name, noRender){
  currentAdminTab = name;
  document.querySelectorAll('.admin-tabs button[data-atab]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-atab') === name);
  });
  if(!noRender) renderAdmin();
}
function openCatalogVariantInBuilder(p){
  var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; });
  if(!g){ showToast('Card not found'); return; }
  try{ productDetailsOffcanvas.hide(); }catch(e){}
  goAdminTab('catalog', true);
  openCardEditor(g.id, false);
}

function openProductDetailsEditor(pid){
  var p = PRODUCTS.find(function(pp){ return pp.id === pid; });
  if(!p) return;
  if(p.isCatalogVariant){ openCatalogVariantDetails(p); return; }
  document.getElementById('productDetailsOffcanvasTitle').textContent = p.name;
  var body = document.getElementById('productDetailsOffcanvasBody');
  var images = p.images || [];
  var specs = p.specs || [];
  var tiers = p.bulkTiers || [];
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Image URLs (one per line, first is used on the card)</label><textarea id="pdeImages" rows="3" placeholder="https://example.com/image1.jpg">'+esc(images.join('\n'))+'</textarea></div>' +
      '<div class="full"><label>Description</label><textarea id="pdeDesc" rows="3">'+esc(p.description||'')+'</textarea></div>' +
      '<div class="full"><label>Specs — one "Key: Value" per line (e.g. Material: uPVC)</label><textarea id="pdeSpecs" rows="4">'+esc(specs.map(function(s){ return s.key+': '+s.value; }).join('\n'))+'</textarea></div>' +
      '<div class="full"><label>Bulk discount tiers — one "qty:bonus%" per line (e.g. 10:2 means qty≥10 → +2%)</label><textarea id="pdeTiers" rows="3" placeholder="10:2&#10;50:5">'+esc(tiers.map(function(tr){ return tr.minQty+':'+tr.bonusPct; }).join('\n'))+'</textarea></div>' +
    '</div>' +
    '<button class="btn-admin mt-3" id="savePdeBtn" style="width:100%;">Save product details</button>' +
    dealerPricingSectionHtml(p);
  wireDealerPricing(p);
  document.getElementById('savePdeBtn').addEventListener('click', function(){
    var imgLines = document.getElementById('pdeImages').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    var specLines = document.getElementById('pdeSpecs').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    var tierLines = document.getElementById('pdeTiers').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    var parsedSpecs = specLines.map(function(line){
      var idx = line.indexOf(':');
      if(idx === -1) return null;
      return { key: line.slice(0,idx).trim(), value: line.slice(idx+1).trim() };
    }).filter(Boolean);
    var parsedTiers = tierLines.map(function(line){
      var parts = line.split(':');
      var minQty = Number(parts[0]);
      var bonusPct = Number(parts[1]);
      if(!minQty || isNaN(bonusPct)) return null;
      return { minQty:minQty, bonusPct:bonusPct };
    }).filter(Boolean).sort(function(a,b){ return a.minQty - b.minQty; });

    p.images = imgLines;
    p.description = document.getElementById('pdeDesc').value.trim();
    p.specs = parsedSpecs;
    p.bulkTiers = parsedTiers;
    saveProducts(PRODUCTS);
    logAudit('Product details updated', p.name+': '+imgLines.length+' image(s), '+parsedSpecs.length+' spec(s), '+parsedTiers.length+' bulk tier(s)');
    showToast('Product details saved');
    productDetailsOffcanvas.hide();
    renderProductGrids();
    checkImageFit(imgLines, p.name);
  });
  productDetailsOffcanvas.show();
}

/* ================= Catalog-variant details + Dealer Pricing (product-first) ================= */
function openCatalogVariantDetails(p){
  var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; });
  var v = g && (g.variants||[]).find(function(x){ return x.id === p.variantId; });
  if(!g || !v){ showToast('This item is no longer part of a catalog card'); return; }
  document.getElementById('productDetailsOffcanvasTitle').textContent = p.name;
  var body = document.getElementById('productDetailsOffcanvasBody');
  var line = function(k, val){ return '<div class="oi-line"><span>'+esc(k)+'</span><b>'+val+'</b></div>'; };
  var hasStock = v.stock !== undefined && v.stock !== null && v.stock !== '';
  var tiers = (v.bulkTiers||[]).map(function(x){ return x.minQty+'+ → +'+x.bonusPct+'%'; }).join(', ');
  body.innerHTML =
    '<div class="ac-sub mb-2">Catalog item · card <b>'+esc(g.title)+'</b> · '+esc(catalogCatName(g.categoryId))+(g.subCategoryId?' › '+esc(catalogSubName(g.subCategoryId)):'')+'</div>' +
    '<div class="admin-card" style="padding:10px 14px;">' +
      (g.fields||[]).map(function(f){ return line(f.label || 'Field', esc((v.values||{})[f.id] || '—')); }).join('') +
      line('Item code', esc(p.part)) +
      line('MRP', money(v.mrp||0)) +
      (Number(v.discountPct) ? line('Discount', (Number(v.discountPct))+'%') : '') +
      line('GST', (Number(v.gstPct)||0)+'%') +
      line('Stock', hasStock ? esc(String(v.stock)) : 'Unlimited') +
      (tiers ? line('Bulk tiers', esc(tiers)) : '') +
    '</div>' +
    '<div class="ac-sub mb-2">Prices, stock and the fields above are edited on the card itself.</div>' +
    '<button class="btn-admin" id="btnPdeCardBuilder" style="width:100%;">✏️ Edit in card builder</button>' +
    dealerPricingSectionHtml(p);
  document.getElementById('btnPdeCardBuilder').addEventListener('click', function(){ openCatalogVariantInBuilder(p); });
  wireDealerPricing(p);
  productDetailsOffcanvas.show();
}

/* Converts what the admin typed into the override shape dealerOverride()/resolvePricing() already understand.
   'net'      → value is the BASE price (GST is added on top). If the admin typed a GST-inclusive price, divide by (1+GST).
   'discount' → % off MRP before GST. (1-d)·(1+g) is the same as (1+g)·(1-d′), so a "% off the GST-inclusive price"
                is numerically identical — no conversion is needed and the basis toggle has no effect. */
function dealerRateToOverride(p, type, basis, rate){
  var g = Number(p.gstPct)||0;
  if(type === 'net'){
    var base = basis === 'incl' ? rate / (1 + g/100) : rate;
    return { type:'net', value: Math.round(base*10000)/10000 };
  }
  return { type:'discount', value: rate };
}
function dealerOverridePrice(p, ov){
  var g = Number(p.gstPct)||0;
  var base = ov.type === 'net' ? Number(ov.value) : p.mrp * (1 - (Number(ov.value)||0)/100);
  return { base: base, final: Math.round(base * (1 + g/100) * 100) / 100 };
}
function dealerOverrideLabel(p, ov){
  var r = dealerOverridePrice(p, ov);
  return (ov.type === 'net' ? 'Net ₹'+(Math.round(Number(ov.value)*100)/100)+' + GST' : (Number(ov.value)||0)+'% off') + ' → '+money(r.final)+' incl. GST';
}
function dealerPricingSectionHtml(p){
  var g = Number(p.gstPct)||0;
  var std = Math.round(p.mrp * (1 - (Number(p.discountPct)||0)/100) * (1 + g/100) * 100) / 100;
  var sel = 'style="border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12.5px; width:100%;"';
  return '<div id="dpSection" style="margin-top:22px; padding-top:14px; border-top:2px solid var(--gold-500);">' +
    '<div class="ac-title" style="margin-bottom:2px;">💲 Dealer Pricing</div>' +
    '<div class="ac-sub mb-2">Set a special rate on this item for one or many dealers. MRP '+money(p.mrp)+' · GST '+g+'% · standard price '+money(std)+' incl. GST.</div>' +
    '<div class="admin-form-grid">' +
      '<div><label>Rate type</label><select id="dpType" '+sel+'><option value="discount">% off MRP</option><option value="net">Net price (₹)</option></select></div>' +
      '<div><label id="dpRateLabel">% off</label><input type="number" id="dpRate" min="0" step="0.01" '+sel+' placeholder="e.g. 12"></div>' +
      '<div class="full"><label>Pricing basis</label><select id="dpBasis" '+sel+'>' +
        '<option value="excl">Before GST — I\'ll add GST on top</option>' +
        '<option value="incl">Already includes GST — back-calculate the base</option></select>' +
        '<div class="ac-sub" id="dpBasisHint" style="margin-top:3px;"></div></div>' +
    '</div>' +
    '<div id="dpPreview" class="ac-sub" style="background:var(--ivory-100); border-radius:8px; padding:8px 10px; margin:8px 0; min-height:34px;">Enter a rate to preview the dealer price.</div>' +
    '<input type="text" id="dpSearch" placeholder="🔍 Search dealers by business name or GST…" style="width:100%; border:1.3px solid #ddd3ba; border-radius:8px; padding:7px 10px; font-size:12.5px; margin-bottom:6px;">' +
    '<div style="display:flex; gap:6px; align-items:center; margin-bottom:6px; flex-wrap:wrap;">' +
      '<button type="button" class="btn-admin sm outline" id="dpSelectShown">Select all shown</button>' +
      '<button type="button" class="btn-admin sm outline" id="dpClearSel">Clear</button>' +
      '<span class="ac-sub" id="dpSelCount"></span></div>' +
    '<div id="dpList" style="max-height:220px; overflow:auto; border:1px solid var(--ivory-100); border-radius:8px; padding:4px 8px;"></div>' +
    '<button type="button" class="btn-admin mt-2" id="dpApply" style="width:100%;">Apply to selected dealers</button>' +
    '<div class="ac-title" style="margin:16px 0 4px; font-size:14.5px;">Dealers with special pricing on this item</div>' +
    '<div id="dpExisting" style="max-height:240px; overflow:auto;"></div>' +
  '</div>';
}
function wireDealerPricing(p){
  var selected = {};
  var $ = function(id){ return document.getElementById(id); };
  function currentOverride(){
    var rate = Number($('dpRate').value);
    var type = $('dpType').value, basis = $('dpBasis').value;
    if($('dpRate').value === '' || isNaN(rate)) return null;
    if(type === 'net' && rate <= 0) return null;
    if(type === 'discount' && (rate < 0 || rate > 95)) return null;
    return { ov: dealerRateToOverride(p, type, basis, rate), entered: rate, basis: basis };
  }
  function refreshPreview(){
    var isNet = $('dpType').value === 'net';
    $('dpRateLabel').textContent = isNet ? 'Net price (₹)' : '% off (0–95)';
    $('dpBasis').disabled = !isNet;
    $('dpBasisHint').textContent = isNet ? '' : '“% off” is identical before or after GST, so this choice only matters for a net price.';
    var c = currentOverride(), box = $('dpPreview');
    if(!c){ box.textContent = 'Enter a valid rate to preview the dealer price.'; return; }
    var r = dealerOverridePrice(p, c.ov);
    box.innerHTML = '<b>Dealer pays '+money(r.final)+' incl. GST</b> · base '+money(Math.round(r.base*100)/100)+' + GST '+(Number(p.gstPct)||0)+'%' +
      (c.ov.type === 'net' && c.basis === 'incl' ? '<br>Stored as net ₹'+c.ov.value+' before GST (back-calculated).' : '') +
      (c.ov.type === 'discount' ? '<br>Bulk-tier bonuses, if any, still add on top of a % off rate.' : '');
  }
  function renderList(){
    var users = getUsers();
    var q = $('dpSearch').value.trim().toLowerCase();
    var all = Object.keys(users).filter(function(gst){
      var u = users[gst]; if(!u) return false;
      return !q || (String(u.business||'').toLowerCase().indexOf(q) !== -1) || gst.toLowerCase().indexOf(q) !== -1;
    }).sort(function(a,b){ return String(users[a].business||a).toLowerCase().localeCompare(String(users[b].business||b).toLowerCase()); });
    var shown = all.slice(0, 100);
    $('dpList').innerHTML = shown.length ? shown.map(function(gst){
      var u = users[gst], ov = u.priceOverrides && u.priceOverrides[p.id];
      return '<label style="display:flex; gap:8px; align-items:flex-start; padding:5px 0; border-bottom:1px solid var(--ivory-100); cursor:pointer;">' +
        '<input type="checkbox" data-dp-gst="'+esc(gst)+'"'+(selected[gst]?' checked':'')+' style="margin-top:3px;">' +
        '<span style="font-size:12.5px;"><b>'+esc(u.business||gst)+'</b><br><span class="ac-sub">'+esc(gst)+(u.tier?' · '+esc(u.tier):'')+
        (ov ? ' · <span style="color:var(--maroon-600); font-weight:600;">has override</span>' : '')+'</span></span></label>';
    }).join('') + (all.length > shown.length ? '<div class="ac-sub" style="padding:6px 0;">Showing first 100 of '+all.length+' — refine the search.</div>' : '')
      : '<div class="ac-sub" style="padding:8px 0;">No dealers match.</div>';
    $('dpList').querySelectorAll('[data-dp-gst]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var gst = cb.getAttribute('data-dp-gst'); if(cb.checked) selected[gst] = true; else delete selected[gst]; updateCount();
      });
    });
    $('dpList')._shown = shown;
    updateCount();
  }
  function updateCount(){ var n = Object.keys(selected).length; $('dpSelCount').textContent = n ? n+' selected' : 'None selected'; }
  function renderExisting(){
    var users = getUsers();
    var gsts = Object.keys(users).filter(function(gst){ return users[gst] && users[gst].priceOverrides && users[gst].priceOverrides[p.id]; })
      .sort(function(a,b){ return String(users[a].business||a).toLowerCase().localeCompare(String(users[b].business||b).toLowerCase()); });
    $('dpExisting').innerHTML = gsts.length
      ? '<table class="dealer-table"><thead><tr><th>Dealer</th><th>Rate</th><th></th></tr></thead><tbody>' + gsts.map(function(gst){
          var u = users[gst];
          return '<tr><td><b>'+esc(u.business||gst)+'</b><div class="ac-sub">'+esc(gst)+'</div></td><td>'+esc(dealerOverrideLabel(p, u.priceOverrides[p.id]))+'</td>' +
            '<td style="text-align:right;"><button type="button" class="btn-admin sm maroon" data-dp-remove="'+esc(gst)+'">Remove</button></td></tr>';
        }).join('') + '</tbody></table>'
      : '<div class="ac-sub">No dealer has special pricing on this item.</div>';
    $('dpExisting').querySelectorAll('[data-dp-remove]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var gst = btn.getAttribute('data-dp-remove'), u = getUsers()[gst];
        removeDealerOverride(gst, p.id);
        logAudit('Price override removed', ((u&&u.business)||gst)+' — '+p.name);
        showToast('Override removed');
        renderExisting(); renderList();
        if(currentAdminTab === 'customers') renderAdminCustomers();
      });
    });
  }
  $('dpType').addEventListener('change', refreshPreview);
  $('dpBasis').addEventListener('change', refreshPreview);
  $('dpRate').addEventListener('input', refreshPreview);
  $('dpSearch').addEventListener('input', renderList);
  $('dpSelectShown').addEventListener('click', function(){
    ($('dpList')._shown || []).forEach(function(gst){ selected[gst] = true; });
    renderList();
  });
  $('dpClearSel').addEventListener('click', function(){ selected = {}; renderList(); });
  $('dpApply').addEventListener('click', function(){
    var c = currentOverride();
    if(!c){ showToast('Enter a valid rate first'); return; }
    var gsts = Object.keys(selected);
    if(!gsts.length){ showToast('Select at least one dealer'); return; }
    var users = getUsers(), done = 0, replaced = 0;
    gsts.forEach(function(gst){
      var u = users[gst]; if(!u) return;
      if(dealerOverride(gst, p.id)) replaced++;
      if(setDealerOverride(gst, p.id, { type:c.ov.type, value:c.ov.value })){
        done++;
        logAudit('Price override set', (u.business||gst)+' — '+p.name+': '+(c.ov.type==='net' ? ('net ₹'+c.ov.value) : (c.ov.value+'% off'))+
          (c.ov.type==='net' && c.basis==='incl' ? ' (entered ₹'+c.entered+' incl. GST)' : ''));
      }
    });
    selected = {};
    showToast('Override set for '+done+' dealer'+(done===1?'':'s')+(replaced ? ' ('+replaced+' replaced)' : ''));
    renderExisting(); renderList();
    if(currentAdminTab === 'customers') renderAdminCustomers();
  });
  refreshPreview(); renderList(); renderExisting();
}

/* ================= Spec-Group Card Builder ("Products & Pricing → New card") ================= */
function blankSpecBuilderState(){
  return {
    id: nextSpecGroupId(),
    categoryId: (CATALOG_CATEGORIES[0]||{}).id || '',
    subCategoryId: '',
    title: '', description: '', images: [],
    fields: [], variants: []
  };
}
function ensureSpecBuilderState(){
  if(!specBuilderState) specBuilderState = blankSpecBuilderState();
  return specBuilderState;
}
function nextSpecFieldId(state){ return 'f' + ((state.fields.reduce(function(m,f){ return Math.max(m, Number(String(f.id).replace('f',''))||0); },0)) + 1); }
function nextSpecVariantId(state){
  /* monotonic: remember the highest id ever handed out on this card, so deleting the last item and
     adding a new one can never give the new item the OLD item's id (distributor stock rows are keyed by it) */
  var n = Math.max(state.variants.reduce(function(m,v){ return Math.max(m, Number(v.id)||0); },0), Number(state.vidSeq)||0) + 1;
  state.vidSeq = n; return n;
}

function renderSpecGroupBuilder(){
  var adminMain = document.getElementById('adminMain');
  var state = ensureSpecBuilderState();
  var isEdit = !!(specBuilderState && SPEC_GROUPS.some(function(g){ return g.id === specBuilderState.id; }));

  adminMain.innerHTML =
    '<div class="admin-toolbar"><h2>'+(isEdit?'Edit card':'New card')+'</h2>' +
      '<button class="btn-admin outline" id="btnBackToProducts">← Back to Catalog</button>' +
    '</div>' +
    (isEdit
      ? '<div class="ac-sub mb-2" style="background:#fff8e1; border:1px solid #ecd58a; border-radius:8px; padding:8px 12px;">You are editing the <b>existing</b> card “'+esc(state.title)+'” ('+state.variants.length+' item(s)). Add more items in the <b>Items (variants)</b> table below — no new card is created.</div>'
      : '<div class="ac-sub mb-2" style="background:#eef5ff; border:1px solid #b9d2f0; border-radius:8px; padding:8px 12px;">Creating a <b>brand-new</b> product card. To add another item to an existing card, go back to the Catalog list and use “+ Item” on that card.</div>') +

    '<div class="admin-card">' +
      '<div class="ac-title" style="margin-bottom:10px;">Category &amp; Sub-category</div>' +
      '<div class="admin-form-grid">' +
        '<div id="categoryPickerWrap"></div>' +
        '<div id="subcategoryPickerWrap"></div>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<div class="ac-title" style="margin-bottom:10px;">Card details</div>' +
      '<div class="admin-form-grid">' +
        '<div class="full"><label>Title</label><input type="text" id="sgTitle" value="'+esc(state.title)+'"></div>' +
        '<div class="full"><label>Short description</label><textarea id="sgDesc" rows="2">'+esc(state.description)+'</textarea></div>' +
        '<div class="full"><label>Image links (comma-separated or one per line)</label><textarea id="sgImages" rows="3" placeholder="https://example.com/1.jpg">'+esc((state.images||[]).join('\n'))+'</textarea></div>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<div class="ac-head" style="margin-bottom:10px;">' +
        '<div class="ac-title">Field builder</div>' +
        '<button class="btn-admin sm" id="btnAddField">+ Add field</button>' +
      '</div>' +
      '<div class="ac-sub mb-2">Price (MRP) and GST % are permanent and always shown separately — build your own fields for everything else (e.g. Size, Material, Length).</div>' +
      (recentFieldLabels().length ? (
        '<div class="ac-sub" style="margin-bottom:4px;">Recently used elsewhere — tap to add:</div>' +
        '<div id="recentFieldChips" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">' +
          recentFieldLabels().map(function(lbl){ return '<button type="button" class="filter-chip recent-field-chip" data-recent-field="'+esc(lbl)+'">+ '+esc(lbl)+'</button>'; }).join('') +
        '</div>'
      ) : '') +
      '<div id="fieldBuilderList"></div>' +
    '</div>' +

    '<div class="admin-card" id="variantCard">' +
      '<div class="ac-head" style="margin-bottom:10px;">' +
        '<div class="ac-title">Items (variants)</div>' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<button class="btn-admin sm outline" id="btnPasteVariants">📋 Paste rows</button>' +
          '<button class="btn-admin sm" id="btnAddVariant">+ Add item</button>' +
        '</div>' +
      '</div>' +
      '<div id="variantPastePanel" style="display:none; margin-bottom:10px;">' +
        '<div class="ac-sub mb-2">One item per line, columns separated by <b>Tab</b> (paste straight from Excel) or commas: <b>your fields…, Item code, MRP, Disc %, GST %, Stock</b>. Missing trailing columns are fine.</div>' +
        '<textarea id="variantPasteText" rows="5" style="width:100%; border:1.3px solid #ddd3ba; border-radius:8px; padding:8px; font-size:12px;"></textarea>' +
        '<div class="ac-actions"><button class="btn-admin sm" id="btnPasteApply">Add rows</button><button class="btn-admin sm outline" id="btnPasteCancel">Cancel</button></div>' +
      '</div>' +
      '<div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">' +
        '<input type="text" id="variantFilter" placeholder="🔍 Filter items in this card…" style="flex:1; border:1.3px solid #ddd3ba; border-radius:7px; padding:6px 10px; font-size:12px;">' +
        '<span class="ac-sub" id="variantCountLabel"></span>' +
      '</div>' +
      '<div class="ac-sub" style="margin-bottom:4px;">Column order (use ↑ / ↓ to rearrange):</div>' +
      '<div id="staticColOrderList" style="margin-bottom:10px;"></div>' +
      '<div style="overflow-x:auto; max-height:65vh; overflow-y:auto;"><table class="dealer-table" id="variantTable">' +
        '<thead><tr id="variantTableHeadRow"></tr></thead>' +
        '<tbody id="variantTableBody"></tbody>' +
      '</table></div>' +
    '</div>' +

    '<div class="form-err" id="sgErr"></div>' +
    '<button class="btn-royal" id="btnSaveSpecCard" style="width:100%;">✅ Save &amp; publish</button>';

  renderCategoryPicker();
  renderSubcategoryPicker();
  renderFieldBuilderList();
  renderColumnOrderList();
  renderVariantTable();

  document.getElementById('btnBackToProducts').addEventListener('click', exitSpecBuilder);
  document.getElementById('btnAddField').addEventListener('click', function(){
    var st = ensureSpecBuilderState();
    var f = { id: nextSpecFieldId(st), label:'', isFilter:false };
    st.fields.push(f);
    renderFieldBuilderList();
    renderVariantTable();
    focusNewFieldRow(f.id);
  });
  document.querySelectorAll('.recent-field-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var st = ensureSpecBuilderState();
      var label = chip.getAttribute('data-recent-field');
      if(st.fields.some(function(f){ return (f.label||'').trim().toLowerCase() === label.toLowerCase(); })){
        showToast('That field is already on this card'); return;
      }
      var f = { id: nextSpecFieldId(st), label:label, isFilter:false };
      st.fields.push(f);
      renderFieldBuilderList();
      renderVariantTable();
      focusNewFieldRow(f.id);
    });
  });
  document.getElementById('btnAddVariant').addEventListener('click', function(){
    var st = ensureSpecBuilderState();
    var values = {};
    st.fields.forEach(function(f){ values[f.id] = ''; });
    st.variants.push({ id: nextSpecVariantId(st), values:values, mrp:0, gstPct:18 });
    renderVariantTable();
  });
  document.getElementById('btnSaveSpecCard').addEventListener('click', saveSpecGroupCard);
  document.getElementById('variantFilter').addEventListener('input', applyVariantFilter);
  document.getElementById('btnPasteVariants').addEventListener('click', function(){
    var pn = document.getElementById('variantPastePanel');
    pn.style.display = pn.style.display === 'none' ? 'block' : 'none';
    if(pn.style.display === 'block') document.getElementById('variantPasteText').focus();
  });
  document.getElementById('btnPasteCancel').addEventListener('click', function(){
    document.getElementById('variantPastePanel').style.display = 'none';
  });
  document.getElementById('btnPasteApply').addEventListener('click', function(){
    var st = ensureSpecBuilderState();
    var txt = document.getElementById('variantPasteText').value;
    var lines = txt.split(/\r?\n/).filter(function(l){ return l.trim() !== ''; });
    if(!lines.length){ showToast('Nothing to add'); return; }
    var num = function(x){ var n = parseFloat(String(x||'').replace(/[₹,%\s,]/g,'')); return isNaN(n) ? undefined : n; };
    var added = 0;
    lines.forEach(function(line){
      var cols = (line.indexOf('\t') !== -1 ? line.split('\t') : line.split(',')).map(function(c){ return c.trim(); });
      var values = {};
      st.fields.forEach(function(f, i){ values[f.id] = cols[i] || ''; });
      var k = st.fields.length;
      var v = { id: nextSpecVariantId(st), values:values, mrp: num(cols[k+1]) || 0, gstPct: num(cols[k+3]) !== undefined ? num(cols[k+3]) : 18 };
      if(cols[k]) v.part = cols[k];
      if(num(cols[k+2])) v.discountPct = num(cols[k+2]);
      if(num(cols[k+4]) !== undefined) v.stock = Math.max(0, num(cols[k+4]));
      st.variants.push(v); added++;
    });
    document.getElementById('variantPasteText').value = '';
    document.getElementById('variantPastePanel').style.display = 'none';
    renderVariantTable();
    showToast(added + ' item(s) added — review, then Save & publish');
  });

  if(specBuilderFocusVariants){
    specBuilderFocusVariants = false;
    var vals = {};
    state.fields.forEach(function(f){ vals[f.id] = ''; });
    state.variants.push({ id: nextSpecVariantId(state), values:vals, mrp:0, gstPct:18 });
    renderVariantTable();
    var vc = document.getElementById('variantCard');
    if(vc){
      vc.scrollIntoView({ behavior:'smooth', block:'start' });
      vc.style.boxShadow = '0 0 0 3px #e0b84a';
      setTimeout(function(){ vc.style.boxShadow = ''; }, 2200);
    }
    var firstInput = document.querySelector('#variantTableBody tr:last-child input');
    if(firstInput) firstInput.focus({ preventScroll:true });
  }
}

/* ---- Category / Sub-category inline-add pickers ---- */
function renderCategoryPicker(){
  var wrap = document.getElementById('categoryPickerWrap');
  if(!wrap) return;
  var state = ensureSpecBuilderState();
  wrap.innerHTML =
    '<label>Category</label>' +
    '<select id="sgCategorySelect">' +
      CATALOG_CATEGORIES.map(function(c){ return '<option value="'+esc(c.id)+'"'+(c.id===state.categoryId?' selected':'')+'>'+esc(c.name)+'</option>'; }).join('') +
      '<option value="__new__">+ Add new category…</option>' +
    '</select>';
  document.getElementById('sgCategorySelect').addEventListener('change', function(){
    if(this.value === '__new__'){ showInlineAddCategory(); return; }
    state.categoryId = this.value;
    state.subCategoryId = '';
    renderSubcategoryPicker();
  });
}
function showInlineAddCategory(){
  var wrap = document.getElementById('categoryPickerWrap');
  wrap.innerHTML =
    '<label>New category name</label>' +
    '<div style="display:flex; gap:6px;">' +
      '<input type="text" id="newCategoryInput" style="flex:1;" placeholder="e.g. Bathroom Fittings">' +
      '<button type="button" class="btn-admin sm" id="saveNewCategoryBtn">Save</button>' +
      '<button type="button" class="btn-admin sm outline" id="cancelNewCategoryBtn">Cancel</button>' +
    '</div>';
  document.getElementById('newCategoryInput').focus();
  document.getElementById('saveNewCategoryBtn').addEventListener('click', function(){
    var name = document.getElementById('newCategoryInput').value.trim();
    if(!name){ showToast('Enter a category name'); return; }
    var id = nextCatalogCategoryId(name);
    var list = CATALOG_CATEGORIES.concat([{ id:id, name:name }]);
    saveCatalogCategories(list);
    logAudit('Catalog category added', name);
    var state = ensureSpecBuilderState();
    state.categoryId = id;
    state.subCategoryId = '';
    renderCategoryPicker();
    renderSubcategoryPicker();
  });
  document.getElementById('cancelNewCategoryBtn').addEventListener('click', renderCategoryPicker);
}
function renderSubcategoryPicker(){
  var wrap = document.getElementById('subcategoryPickerWrap');
  if(!wrap) return;
  var state = ensureSpecBuilderState();
  var subs = subcategoriesForCategory(state.categoryId);
  wrap.innerHTML =
    '<label>Sub-category (optional)</label>' +
    '<select id="sgSubcategorySelect">' +
      '<option value="">— None —</option>' +
      subs.map(function(s){ return '<option value="'+esc(s.id)+'"'+(s.id===state.subCategoryId?' selected':'')+'>'+esc(s.name)+'</option>'; }).join('') +
      '<option value="__new__">+ Add new sub-category…</option>' +
    '</select>';
  document.getElementById('sgSubcategorySelect').addEventListener('change', function(){
    if(this.value === '__new__'){ showInlineAddSubcategory(); return; }
    state.subCategoryId = this.value;
  });
}
function showInlineAddSubcategory(){
  var wrap = document.getElementById('subcategoryPickerWrap');
  wrap.innerHTML =
    '<label>New sub-category name</label>' +
    '<div style="display:flex; gap:6px;">' +
      '<input type="text" id="newSubcategoryInput" style="flex:1;" placeholder="e.g. Bore+">' +
      '<button type="button" class="btn-admin sm" id="saveNewSubcategoryBtn">Save</button>' +
      '<button type="button" class="btn-admin sm outline" id="cancelNewSubcategoryBtn">Cancel</button>' +
    '</div>';
  document.getElementById('newSubcategoryInput').focus();
  document.getElementById('saveNewSubcategoryBtn').addEventListener('click', function(){
    var name = document.getElementById('newSubcategoryInput').value.trim();
    if(!name){ showToast('Enter a sub-category name'); return; }
    var state = ensureSpecBuilderState();
    var id = nextCatalogSubcategoryId(name);
    var list = CATALOG_SUBCATEGORIES.concat([{ id:id, categoryId:state.categoryId, name:name }]);
    saveCatalogSubcategories(list);
    logAudit('Catalog sub-category added', name+' (under '+state.categoryId+')');
    state.subCategoryId = id;
    renderSubcategoryPicker();
  });
  document.getElementById('cancelNewSubcategoryBtn').addEventListener('click', renderSubcategoryPicker);
}

/* ---- Field builder ---- */
/* Field labels already used on other cards, most-recently-created card first, deduped —
   shown as quick-pick chips so admin can reuse "Size" / "Material" / etc. instead of
   retyping the same labels on every new card (and so spellings stay consistent). */
function recentFieldLabels(){
  var seen = {}, out = [];
  SPEC_GROUPS.slice().sort(function(a,b){ return b.id - a.id; }).forEach(function(g){
    (g.fields||[]).forEach(function(f){
      var label = (f.label||'').trim();
      var key = label.toLowerCase();
      if(label && !seen[key]){ seen[key] = true; out.push(label); }
    });
  });
  return out.slice(0, 10);
}
/* A freshly added field (blank "+ Add field", or a recent-label chip) is easy to miss if the
   card already has several fields — scroll it into view and put the cursor straight into its
   label box instead of leaving admin to hunt for a blank row that just appeared. */
function focusNewFieldRow(fieldId){
  var row = document.querySelector('[data-field-row="'+fieldId+'"]');
  if(!row) return;
  row.scrollIntoView({ block:'center', behavior:'smooth' });
  var input = row.querySelector('.sf-label');
  if(input) input.focus();
}
function renderFieldBuilderList(){
  var wrap = document.getElementById('fieldBuilderList');
  if(!wrap) return;
  var state = ensureSpecBuilderState();
  if(state.fields.length === 0){
    wrap.innerHTML = '<div class="ac-sub mb-2">No custom fields yet — add one above (e.g. "Size", "Material").</div>';
    return;
  }
  wrap.innerHTML = state.fields.map(function(f, idx){
    return '<div class="df-row mb-2" data-field-row="'+f.id+'">' +
      '<span style="font-size:11px; color:var(--ink-600); width:18px;">'+(idx+1)+'.</span>' +
      '<input type="text" class="sf-label" data-field-id="'+f.id+'" value="'+esc(f.label)+'" placeholder="Field label (e.g. Size)" style="flex:1; min-width:120px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12px;">' +
      '<label style="display:flex; align-items:center; gap:4px; font-size:11px; white-space:nowrap;"><input type="checkbox" class="sf-filter" data-field-id="'+f.id+'"'+(f.isFilter?' checked':'')+'> Show as filter</label>' +
      '<button type="button" class="btn-admin sm outline sf-up" data-field-id="'+f.id+'"'+(idx===0?' disabled':'')+'>↑</button>' +
      '<button type="button" class="btn-admin sm outline sf-down" data-field-id="'+f.id+'"'+(idx===state.fields.length-1?' disabled':'')+'>↓</button>' +
      '<button type="button" class="btn-admin sm maroon sf-remove" data-field-id="'+f.id+'">✕</button>' +
    '</div>';
  }).join('');

  // Renaming a field: a direct, targeted DOM update to just that column's <th> —
  // never a full re-render, so focus/cursor position in the label input is never lost.
  wrap.querySelectorAll('.sf-label').forEach(function(input){
    input.addEventListener('input', function(){
      var fid = input.getAttribute('data-field-id');
      var f = state.fields.find(function(x){ return x.id === fid; });
      if(f) f.label = input.value;
      var th = document.querySelector('[data-field-th="'+fid+'"]');
      if(th) th.textContent = input.value || '(untitled field)';
    });
  });
  wrap.querySelectorAll('.sf-filter').forEach(function(chk){
    chk.addEventListener('change', function(){
      var fid = chk.getAttribute('data-field-id');
      var f = state.fields.find(function(x){ return x.id === fid; });
      if(f) f.isFilter = chk.checked;
    });
  });
  wrap.querySelectorAll('.sf-remove').forEach(function(btn){
    btn.addEventListener('click', function(){
      var fid = btn.getAttribute('data-field-id');
      state.fields = state.fields.filter(function(x){ return x.id !== fid; });
      state.variants.forEach(function(v){ delete v.values[fid]; });
      renderFieldBuilderList();
      renderVariantTable();
    });
  });
  wrap.querySelectorAll('.sf-up').forEach(function(btn){
    btn.addEventListener('click', function(){
      var fid = btn.getAttribute('data-field-id');
      var idx = state.fields.findIndex(function(x){ return x.id === fid; });
      if(idx > 0){
        var tmp = state.fields[idx-1]; state.fields[idx-1] = state.fields[idx]; state.fields[idx] = tmp;
        renderFieldBuilderList(); renderVariantTable();
      }
    });
  });
  wrap.querySelectorAll('.sf-down').forEach(function(btn){
    btn.addEventListener('click', function(){
      var fid = btn.getAttribute('data-field-id');
      var idx = state.fields.findIndex(function(x){ return x.id === fid; });
      if(idx < state.fields.length-1){
        var tmp = state.fields[idx+1]; state.fields[idx+1] = state.fields[idx]; state.fields[idx] = tmp;
        renderFieldBuilderList(); renderVariantTable();
      }
    });
  });
}

/* ---- Static column order (Item code / Price / Disc % / GST % / Stock) ----
   These five columns always existed in this fixed order with no way to change it. Reordering
   here only changes what order they're DRAWN in — every input keeps the same class name
   (.sv-mrp, .sv-disc, …) it always had, so none of the read/save wiring further down needs to
   know or care which position a column is currently drawn in. */
var STATIC_VARIANT_COLS = {
  part: { label:'Item code', th:'<th>Item code</th>',
    td:function(v){ return '<td><input type="text" class="sv-part" data-variant-id="'+v.id+'" value="'+esc(v.part||'')+'" placeholder="optional" style="width:110px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>'; } },
  mrp: { label:'Price (MRP) ₹', th:'<th>Price (MRP) ₹</th>',
    td:function(v){ return '<td><input type="number" class="sv-mrp" data-variant-id="'+v.id+'" value="'+(v.mrp||0)+'" style="width:90px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>'; } },
  discountPct: { label:'Disc %', th:'<th>Disc %</th>',
    td:function(v){ return '<td><input type="number" class="sv-disc" data-variant-id="'+v.id+'" value="'+(v.discountPct||0)+'" step="0.01" style="width:70px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>'; } },
  gstPct: { label:'GST %', th:'<th>GST %</th>',
    td:function(v){ return '<td><input type="number" class="sv-gst" data-variant-id="'+v.id+'" value="'+(v.gstPct!==undefined?v.gstPct:18)+'" style="width:70px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>'; } },
  stock: { label:'Stock', th:'<th>Stock <span style="font-weight:400;">(blank = unlimited)</span></th>',
    td:function(v){ return '<td><input type="number" class="sv-stock" data-variant-id="'+v.id+'" min="0" value="'+((v.stock===undefined||v.stock===null||v.stock==='')?'':v.stock)+'" placeholder="∞" style="width:70px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>'; } }
};
function staticColOrder(state){
  var def = ['part','mrp','discountPct','gstPct','stock'];
  if(!state.staticColOrder) state.staticColOrder = def.slice();
  var have = state.staticColOrder.filter(function(k){ return STATIC_VARIANT_COLS[k]; });   // drop any stale/unknown key
  def.forEach(function(k){ if(have.indexOf(k) === -1) have.push(k); });                     // add any new key old saved cards predate
  state.staticColOrder = have;
  return have;
}
function renderColumnOrderList(){
  var wrap = document.getElementById('staticColOrderList');
  if(!wrap) return;
  var state = ensureSpecBuilderState();
  var order = staticColOrder(state);
  // Same button classes the field-order ↑/↓ buttons above already use (.btn-admin.sm.outline) —
  // the earlier plain-text buttons sat on a dark badge with no border/background of their own,
  // so the arrows were the same gold-on-navy as the label and were essentially invisible.
  wrap.innerHTML = order.map(function(key, idx){
    return '<span style="display:inline-flex; align-items:center; gap:4px; margin:0 6px 6px 0; padding:3px 8px; border-radius:8px; background:var(--ivory-100);">' +
      '<b style="font-size:11.5px;">'+esc(STATIC_VARIANT_COLS[key].label)+'</b>' +
      '<button type="button" class="btn-admin sm outline sc-up" data-static-col="'+key+'"'+(idx===0?' disabled':'')+' style="padding:2px 7px;">↑</button>' +
      '<button type="button" class="btn-admin sm outline sc-down" data-static-col="'+key+'"'+(idx===order.length-1?' disabled':'')+' style="padding:2px 7px;">↓</button>' +
    '</span>';
  }).join('');
  wrap.querySelectorAll('.sc-up').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.getAttribute('data-static-col'), idx = order.indexOf(key);
      if(idx > 0){ var tmp = order[idx-1]; order[idx-1] = order[idx]; order[idx] = tmp; state.staticColOrder = order; renderColumnOrderList(); renderVariantTable(); }
    });
  });
  wrap.querySelectorAll('.sc-down').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.getAttribute('data-static-col'), idx = order.indexOf(key);
      if(idx < order.length-1){ var tmp = order[idx+1]; order[idx+1] = order[idx]; order[idx] = tmp; state.staticColOrder = order; renderColumnOrderList(); renderVariantTable(); }
    });
  });
}

/* ---- Variant entry table ---- */
/* Product id of a variant IF it has already been published (so a Details / Dealer Pricing panel can open for it). */
function specVariantExistingPid(state, v){
  var hasPid = v.pid !== undefined && v.pid !== null && v.pid !== '';
  var pid = hasPid ? Number(v.pid) : specVariantProductId(state.id, v.id);
  var prod = PRODUCTS.find(function(pp){ return pp.id === pid; });
  // only trust the match when it truly is this card's variant (unsaved edits could reuse ids)
  return (prod && prod.isCatalogVariant && prod.specGroupId === state.id && prod.variantId === v.id) ? pid : 0;
}
function applyVariantFilter(){
  var body = document.getElementById('variantTableBody');
  var box = document.getElementById('variantFilter');
  var label = document.getElementById('variantCountLabel');
  if(!body) return;
  var q = box ? box.value.trim().toLowerCase() : '';
  var rows = body.querySelectorAll('tr[data-variant-row]');
  var shown = 0;
  rows.forEach(function(tr){
    var hay = Array.prototype.map.call(tr.querySelectorAll('input'), function(i){ return i.value; }).join(' ').toLowerCase();
    var ok = !q || hay.indexOf(q) !== -1;
    tr.style.display = ok ? '' : 'none';
    if(ok) shown++;
  });
  if(label) label.textContent = rows.length ? (q ? shown + ' of ' + rows.length : rows.length + ' item(s)') : '';
}
function renderVariantTable(){
  var headRow = document.getElementById('variantTableHeadRow');
  var body = document.getElementById('variantTableBody');
  if(!headRow || !body) return;
  var state = ensureSpecBuilderState();

  headRow.innerHTML =
    state.fields.map(function(f){ return '<th data-field-th="'+f.id+'">'+esc(f.label || '(untitled field)')+'</th>'; }).join('') +
    staticColOrder(state).map(function(k){ return STATIC_VARIANT_COLS[k].th; }).join('') +
    '<th></th>';

  if(state.variants.length === 0){
    body.innerHTML = '<tr><td colspan="'+(state.fields.length+6)+'" class="ac-sub" style="text-align:center; padding:14px;">No items yet — tap "+ Add item".</td></tr>';
    return;
  }
  body.innerHTML = state.variants.map(function(v){
    return '<tr data-variant-row="'+v.id+'">' +
      state.fields.map(function(f){
        return '<td><input type="text" class="sv-field" data-variant-id="'+v.id+'" data-field-id="'+f.id+'" value="'+esc(v.values[f.id]||'')+'" style="width:100%; min-width:90px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12px;"></td>';
      }).join('') +
      staticColOrder(state).map(function(k){ return STATIC_VARIANT_COLS[k].td(v); }).join('') +
      '<td style="white-space:nowrap;">'+(specVariantExistingPid(state, v) ? '<button type="button" class="btn-admin sm outline sv-dealer" data-variant-id="'+v.id+'" title="Dealer pricing for this item">💲</button> ' : '')+'<button type="button" class="btn-admin sm outline sv-dup" data-variant-id="'+v.id+'" title="Duplicate this item">⧉</button> <button type="button" class="btn-admin sm maroon sv-remove" data-variant-id="'+v.id+'">✕</button></td>' +
    '</tr>';
  }).join('');

  body.querySelectorAll('.sv-field').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var fid = input.getAttribute('data-field-id');
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(v) v.values[fid] = input.value;
    });
  });
  body.querySelectorAll('.sv-mrp').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(v) v.mrp = Number(input.value)||0;
    });
  });
  body.querySelectorAll('.sv-part').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(v){ var val = input.value.trim(); if(val) v.part = val; else delete v.part; }
    });
  });
  body.querySelectorAll('.sv-disc').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(v) v.discountPct = Math.min(95, Math.max(0, Number(input.value)||0));
    });
  });
  body.querySelectorAll('.sv-stock').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(!v) return;
      if(input.value === '') delete v.stock; else v.stock = Math.max(0, Number(input.value)||0);
    });
  });
  body.querySelectorAll('.sv-gst').forEach(function(input){
    input.addEventListener('input', function(){
      var vid = Number(input.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      if(v) v.gstPct = Number(input.value)||0;
    });
  });
  body.querySelectorAll('.sv-remove').forEach(function(btn){
    btn.addEventListener('click', function(){
      var vid = Number(btn.getAttribute('data-variant-id'));
      state.variants = state.variants.filter(function(x){ return x.id !== vid; });
      renderVariantTable();
    });
  });
  body.querySelectorAll('.sv-dealer').forEach(function(btn){
    btn.addEventListener('click', function(){
      var vid = Number(btn.getAttribute('data-variant-id'));
      var v = state.variants.find(function(x){ return x.id === vid; });
      var pid = v && specVariantExistingPid(state, v);
      if(pid) openProductDetailsEditor(pid);
    });
  });
  body.querySelectorAll('.sv-dup').forEach(function(btn){
    btn.addEventListener('click', function(){
      var vid = Number(btn.getAttribute('data-variant-id'));
      var idx = state.variants.findIndex(function(x){ return x.id === vid; });
      if(idx < 0) return;
      var copy = JSON.parse(JSON.stringify(state.variants[idx]));
      copy.id = nextSpecVariantId(state);
      delete copy.pid; delete copy.legacyCat; delete copy.part;   // a copy is a NEW item: no reused product id / item code
      state.variants.splice(idx + 1, 0, copy);
      renderVariantTable();
    });
  });
  applyVariantFilter();
}

function saveSpecGroupCard(){
  var state = ensureSpecBuilderState();
  var errEl = document.getElementById('sgErr');
  errEl.textContent = '';
  state.title = document.getElementById('sgTitle').value.trim();
  state.description = document.getElementById('sgDesc').value.trim();
  state.images = document.getElementById('sgImages').value.split(/[\n,]/).map(function(s){ return s.trim(); }).filter(Boolean);

  if(!state.title){ errEl.textContent = 'Give this card a title.'; return; }
  if(!state.categoryId){ errEl.textContent = 'Choose a category.'; return; }
  // drop completely blank rows (e.g. the pre-added row from "+ Add item to this card" left untouched)
  state.variants = state.variants.filter(function(v){
    return Number(v.mrp) > 0 || Object.keys(v.values||{}).some(function(k){ return String(v.values[k]||'').trim() !== ''; });
  });
  if(state.variants.length === 0){ errEl.textContent = 'Add at least one item.'; return; }

  delete state.migrated;   // admin has opened & saved this card -> no longer "needs review"
  var wasEdit = SPEC_GROUPS.some(function(g){ return g.id === state.id; });
  // Item-code duplicate check — purely informational, never blocks the save. Flags a variant
  // whose part/item code matches another item's code somewhere else in the system (a
  // different card, a regular product, or another variant on THIS card), which usually means
  // two rows were meant to be the same item, or a code was copy-pasted by mistake.
  var dupItemCodes = duplicateItemCodesInCard(state);
  var list = SPEC_GROUPS.filter(function(g){ return g.id !== state.id; });
  list.push(JSON.parse(JSON.stringify(state)));
  list.sort(function(a,b){ return a.id - b.id; });
  // Guard: a card with the same category / sub-category / title must never coexist —
  // fold it into the earliest one so "another item" always ends up on the SAME card.
  var dedup = mergeDuplicateSpecGroups(list);
  saveSpecGroups(dedup.list);
  var dupSuffix = dupItemCodes.length ? (' — ⚠ item code'+(dupItemCodes.length>1?'s':'')+' already used elsewhere: '+dupItemCodes.join(', ')) : '';
  if(dedup.merged.length){
    dedup.merged.forEach(function(t){ logAudit('Catalog cards merged', t); });
    showToast('“'+state.title+'” already existed — your items were added to that card'+dupSuffix);
  } else {
    logAudit(wasEdit ? 'Catalog card updated' : 'Catalog card published', state.title);
    showToast((wasEdit ? 'Card updated' : 'Card published')+dupSuffix);
  }
  if(dupItemCodes.length) logAudit('Duplicate item code detected', state.title+' — '+dupItemCodes.join(', '));
  warnDuplicateSpecGroups();
  exitSpecBuilder();
  checkImageFit(state.images, state.title);
}
/* Item/part codes that collide with something else in the system — checked against every
   OTHER product and catalog variant (this card's own current items are excluded from the
   comparison set since they're about to be replaced by `state` itself) plus against each
   other within this same card. Blank codes are never compared. Read-only check: never
   alters `state`, `PRODUCTS` or `SPEC_GROUPS` — saveSpecGroupCard() still saves exactly as
   before either way. */
function duplicateItemCodesInCard(state){
  var counts = {};
  PRODUCTS.forEach(function(p){
    if(p.isCatalogVariant && p.specGroupId === state.id) return;
    var key = String(p.part||'').trim().toLowerCase();
    if(key) counts[key] = (counts[key]||0) + 1;
  });
  var dupes = [], seenInCard = {}, reported = {};
  (state.variants||[]).forEach(function(v){
    var raw = String(v.part||'').trim();
    var key = raw.toLowerCase();
    if(!key || reported[key]) return;
    if(counts[key] || seenInCard[key]){ dupes.push(raw); reported[key] = true; }
    seenInCard[key] = true;
  });
  return dupes;
}

/* ================= Manage categories (rename / delete categories & sub-categories) ================= */
function cardsUsingCategory(catId){
  var subIds = subcategoriesForCategory(catId).map(function(s){ return s.id; });
  return SPEC_GROUPS.filter(function(g){
    return g.categoryId === catId || (g.subCategoryId && subIds.indexOf(g.subCategoryId) !== -1);
  });
}
function cardsUsingSubcategory(subId){
  return SPEC_GROUPS.filter(function(g){ return g.subCategoryId === subId; });
}
/* ================= Admin → Catalog (cards list, category navigator, bulk tools) ================= */
var CAT_UI = { view:'list', catId:'', subId:'', q:'', navQ:'', sort:'title', page:1, pageSize:25, onlyReview:false, selected:{}, bulkMove:false };

function catalogCardSearchText(g){
  var parts = [g.title, g.description];
  (g.variants||[]).forEach(function(v){
    parts.push(v.part || '');
    (g.fields||[]).forEach(function(f){ parts.push((v.values||{})[f.id] || ''); });
  });
  return parts.join(' ').toLowerCase();
}
function catalogCatName(id){ return (CATALOG_CATEGORIES.find(function(c){ return c.id === id; })||{}).name || id; }
function catalogSubName(id){ return id ? ((CATALOG_SUBCATEGORIES.find(function(c){ return c.id === id; })||{}).name || id) : ''; }

function exitSpecBuilder(){
  specBuilderState = null;
  CAT_UI.view = 'list';
  renderAdminCatalog();
}
function openCardEditor(gid, focusVariants){
  var g = SPEC_GROUPS.find(function(x){ return x.id === gid; });
  if(!g) return;
  specBuilderState = JSON.parse(JSON.stringify(g));
  specBuilderFocusVariants = !!focusVariants;
  CAT_UI.view = 'builder';
  renderAdminCatalog();
}
function openNewCard(){
  specBuilderState = blankSpecBuilderState();
  if(CAT_UI.catId && CATALOG_CATEGORIES.some(function(c){ return c.id === CAT_UI.catId; })){
    specBuilderState.categoryId = CAT_UI.catId;
    if(CAT_UI.subId && CAT_UI.subId !== '__none__') specBuilderState.subCategoryId = CAT_UI.subId;
  }
  CAT_UI.view = 'builder';
  renderAdminCatalog();
}
function catRerenderKeepFocus(inputId){
  var el = document.getElementById(inputId);
  var pos = el ? el.selectionStart : 0;
  renderAdminCatalog();
  var again = document.getElementById(inputId);
  if(again){ again.focus(); try{ again.setSelectionRange(pos, pos); }catch(e){} }
}

function renderAdminCatalog(){
  if(CAT_UI.view === 'builder'){ renderSpecGroupBuilder(); return; }
  if(CAT_UI.view === 'categories'){ renderManageCategories(); return; }
  var adminMain = document.getElementById('adminMain');

  // ---- counts for the navigator ----
  var catCounts = {}, subCounts = {}, noSubCounts = {}, reviewCount = 0;
  SPEC_GROUPS.forEach(function(g){
    catCounts[g.categoryId] = (catCounts[g.categoryId]||0) + 1;
    if(g.subCategoryId) subCounts[g.subCategoryId] = (subCounts[g.subCategoryId]||0) + 1;
    else noSubCounts[g.categoryId] = (noSubCounts[g.categoryId]||0) + 1;
    if(g.migrated) reviewCount++;
  });
  if(CAT_UI.catId && !CATALOG_CATEGORIES.some(function(c){ return c.id === CAT_UI.catId; })){ CAT_UI.catId = ''; CAT_UI.subId = ''; }

  // ---- filter + sort ----
  var q = CAT_UI.q.trim().toLowerCase();
  var list = SPEC_GROUPS.filter(function(g){
    if(CAT_UI.catId && g.categoryId !== CAT_UI.catId) return false;
    if(CAT_UI.subId === '__none__'){ if(g.subCategoryId) return false; }
    else if(CAT_UI.subId && g.subCategoryId !== CAT_UI.subId) return false;
    if(CAT_UI.onlyReview && !g.migrated) return false;
    if(q && catalogCardSearchText(g).indexOf(q) === -1) return false;
    return true;
  });
  var sorters = {
    title:  function(a,b){ return String(a.title).toLowerCase().localeCompare(String(b.title).toLowerCase()); },
    newest: function(a,b){ return b.id - a.id; },
    items:  function(a,b){ return b.variants.length - a.variants.length; },
    review: function(a,b){ return (b.migrated?1:0) - (a.migrated?1:0) || String(a.title).toLowerCase().localeCompare(String(b.title).toLowerCase()); }
  };
  list.sort(sorters[CAT_UI.sort] || sorters.title);
  var totalPages = Math.max(1, Math.ceil(list.length / CAT_UI.pageSize));
  if(CAT_UI.page > totalPages) CAT_UI.page = totalPages;
  if(CAT_UI.page < 1) CAT_UI.page = 1;
  var startIdx = (CAT_UI.page - 1) * CAT_UI.pageSize;
  var pageItems = list.slice(startIdx, startIdx + CAT_UI.pageSize);
  var selIds = Object.keys(CAT_UI.selected).filter(function(k){ return CAT_UI.selected[k]; }).map(Number)
    .filter(function(id){ return SPEC_GROUPS.some(function(g){ return g.id === id; }); });

  // ---- navigator ----
  var nq = CAT_UI.navQ.trim().toLowerCase();
  var navCats = CATALOG_CATEGORIES.filter(function(c){ return !nq || c.name.toLowerCase().indexOf(nq) !== -1; });
  var nav = '<div class="cat-nav">' +
    '<input type="text" id="catNavSearch" placeholder="🔍 Find category…" value="'+esc(CAT_UI.navQ)+'">' +
    '<button type="button" class="cn-item'+(!CAT_UI.catId?' active':'')+'" data-cn-cat=""><span>All cards</span><span class="n">'+SPEC_GROUPS.length+'</span></button>' +
    navCats.map(function(c){
      var on = CAT_UI.catId === c.id;
      var html = '<button type="button" class="cn-item'+(on && !CAT_UI.subId?' active':'')+'" data-cn-cat="'+esc(c.id)+'"><span>'+esc(c.name)+'</span><span class="n">'+(catCounts[c.id]||0)+'</span></button>';
      if(on){
        subcategoriesForCategory(c.id).forEach(function(sc){
          html += '<button type="button" class="cn-item cn-sub'+(CAT_UI.subId===sc.id?' active':'')+'" data-cn-sub="'+esc(sc.id)+'"><span>'+esc(sc.name)+'</span><span class="n">'+(subCounts[sc.id]||0)+'</span></button>';
        });
        if(noSubCounts[c.id]){
          html += '<button type="button" class="cn-item cn-sub'+(CAT_UI.subId==='__none__'?' active':'')+'" data-cn-sub="__none__"><span><i>No sub-category</i></span><span class="n">'+noSubCounts[c.id]+'</span></button>';
        }
      }
      return html;
    }).join('') +
    (navCats.length === 0 ? '<div class="ac-sub" style="padding:6px;">No category matches</div>' : '') +
  '</div>';

  // ---- migration notice (one-time) ----
  var mig = getMigrationNotice();
  var migHtml = mig ? (
    '<div class="admin-card" style="border-left:4px solid var(--gold-500); background:#fffaf0;">' +
      '<div class="ac-title" style="margin-bottom:6px;">ℹ️ Agri &amp; Casing moved into catalog cards</div>' +
      '<div style="font-size:13px; line-height:1.5;">' + mig.count + ' item(s) were migrated into <b>single-item cards</b> — this is expected, not a bug. ' +
      'Prices, discounts, stock, item codes and dealer-specific prices were carried over unchanged. ' +
      'Next: tick related cards below, then use <b>Merge into one card</b> (and <b>Move to…</b> to set the sub-category). ' +
      'Cards marked <i>Needs review</i> haven\'t been opened yet.' +
      (mig.skippedHidden ? ' ' + mig.skippedHidden + ' hidden (inactive) product(s) were left as they were.' : '') + '</div>' +
      '<div class="ac-actions"><button class="btn-admin sm" id="btnDismissMigrationNotice">Got it</button></div>' +
    '</div>'
  ) : '';

  // ---- toolbar ----
  var scopeLabel = CAT_UI.catId ? (catalogCatName(CAT_UI.catId) + (CAT_UI.subId ? ' › ' + (CAT_UI.subId==='__none__' ? 'No sub-category' : catalogSubName(CAT_UI.subId)) : '')) : 'All categories';
  var toolbar = '<div class="admin-toolbar"><h2>📇 Catalog <span class="ac-sub" style="font-weight:400;">· '+esc(scopeLabel)+' · '+list.length+' card'+(list.length===1?'':'s')+'</span></h2>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
      '<button class="btn-admin outline" id="btnCatCategories">🗂 Categories ('+CATALOG_CATEGORIES.length+')</button>' +
      '<button class="btn-admin" id="btnCatNewCard">+ New card</button>' +
    '</div></div>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center;">' +
      '<input type="text" id="catSearch" placeholder="🔍 Search title, size, item code…" value="'+esc(CAT_UI.q)+'" style="flex:2; min-width:180px; border:1.3px solid #ddd3ba; border-radius:8px; padding:8px 12px; font-size:13px;">' +
      '<select id="catSort" style="border:1.3px solid #ddd3ba; border-radius:8px; padding:8px 10px; font-size:12.5px;">' +
        [['title','Sort: A → Z'],['newest','Sort: Newest'],['items','Sort: Most items'],['review','Sort: Needs review first']].map(function(o){
          return '<option value="'+o[0]+'"'+(CAT_UI.sort===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('') +
      '</select>' +
      '<select id="catPageSize" style="border:1.3px solid #ddd3ba; border-radius:8px; padding:8px 10px; font-size:12.5px;">' +
        [25,50,100].map(function(n){ return '<option value="'+n+'"'+(CAT_UI.pageSize===n?' selected':'')+'>'+n+' / page</option>'; }).join('') +
      '</select>' +
      (reviewCount ? '<button type="button" class="filter-chip'+(CAT_UI.onlyReview?' active':'')+'" id="catOnlyReview">Needs review ('+reviewCount+')</button>' : '') +
    '</div>';

  // ---- bulk bar ----
  var bulkBar = '';
  if(selIds.length){
    var moveCat = CAT_UI.catId || (CATALOG_CATEGORIES[0]||{}).id || '';
    bulkBar = '<div class="cc-bulkbar"><b>'+selIds.length+' selected</b>' +
      '<button class="btn-admin sm outline" id="bulkMoveBtn">Move to…</button>' +
      '<button class="btn-admin sm outline" id="bulkMergeBtn"'+(selIds.length<2?' disabled title="Select 2 or more cards"':'')+'>Merge into one card</button>' +
      '<button class="btn-admin sm maroon" id="bulkDeleteBtn">Delete</button>' +
      '<button class="btn-admin sm outline" id="bulkClearBtn">Clear</button>' +
      (CAT_UI.bulkMove
        ? '<span style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; width:100%; margin-top:6px;">' +
            '<select id="bulkMoveCat" style="border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 8px; font-size:12px;">' +
              CATALOG_CATEGORIES.map(function(c){ return '<option value="'+esc(c.id)+'"'+(c.id===moveCat?' selected':'')+'>'+esc(c.name)+'</option>'; }).join('') +
            '</select>' +
            '<select id="bulkMoveSub" style="border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 8px; font-size:12px;"></select>' +
            '<button class="btn-admin sm" id="bulkMoveApply">Apply</button></span>'
        : '') +
    '</div>';
  }

  // ---- table ----
  var allOnPageSelected = pageItems.length > 0 && pageItems.every(function(g){ return CAT_UI.selected[g.id]; });
  var rows = pageItems.map(function(g){
    var mrps = g.variants.map(function(v){ return Number(v.mrp)||0; }).filter(function(x){ return x > 0; });
    var mn = mrps.length ? Math.min.apply(null, mrps) : 0, mx = mrps.length ? Math.max.apply(null, mrps) : 0;
    var range = !mrps.length ? '—' : (mn === mx ? money(mn) : money(mn) + ' – ' + money(mx));
    var oos = g.variants.filter(function(v){ return v.stock !== undefined && v.stock !== null && v.stock !== '' && Number(v.stock) <= 0; }).length;
    return '<tr>' +
      '<td><input type="checkbox" class="cc-sel" data-gid="'+g.id+'"'+(CAT_UI.selected[g.id]?' checked':'')+'></td>' +
      '<td><div style="font-weight:700;">'+esc(g.title)+(g.migrated?' <span class="low-stock-pill" style="font-size:10px;">Needs review</span>':'')+'</div>' +
        '<div class="ac-sub">'+esc(catalogCatName(g.categoryId))+(g.subCategoryId?' › '+esc(catalogSubName(g.subCategoryId)):'')+'</div></td>' +
      '<td style="white-space:nowrap;">'+g.variants.length+'</td>' +
      '<td style="white-space:nowrap;">'+range+'</td>' +
      '<td style="white-space:nowrap;">'+(oos ? '<span style="color:#a12626; font-weight:600;">'+oos+' out</span>' : '<span class="ac-sub">—</span>')+'</td>' +
      '<td style="white-space:nowrap; text-align:right;">' +
        '<button class="btn-admin sm" data-cc-additem="'+g.id+'" title="Open this card and add another item">+ Item</button> ' +
        '<button class="btn-admin sm outline" data-cc-edit="'+g.id+'">Edit</button> ' +
        '<button class="btn-admin sm maroon" data-cc-del="'+g.id+'" title="Delete card">🗑</button>' +
      '</td></tr>';
  }).join('');
  var table = list.length === 0
    ? '<div class="admin-empty"><div class="ae-big">'+(SPEC_GROUPS.length ? 'No cards match these filters' : 'No cards yet')+'</div><div>'+(SPEC_GROUPS.length ? 'Clear the search or pick another category.' : 'Tap “+ New card” to publish your first one.')+'</div></div>'
    : '<div class="cc-table-wrap"><table class="dealer-table"><thead><tr>' +
        '<th style="width:30px;"><input type="checkbox" id="ccSelAll"'+(allOnPageSelected?' checked':'')+' title="Select all on this page"></th>' +
        '<th>Card</th><th>Items</th><th>Price (MRP)</th><th>Stock</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  var pager = list.length ? (
    '<div class="cc-pager"><span class="ac-sub">Showing '+(startIdx+1)+'–'+(startIdx+pageItems.length)+' of '+list.length+'</span>' +
      '<span style="display:flex; gap:6px; align-items:center;">' +
        '<button class="btn-admin sm outline" id="ccPrev"'+(CAT_UI.page<=1?' disabled':'')+'>‹ Prev</button>' +
        '<span>Page '+CAT_UI.page+' / '+totalPages+'</span>' +
        '<button class="btn-admin sm outline" id="ccNext"'+(CAT_UI.page>=totalPages?' disabled':'')+'>Next ›</button>' +
      '</span></div>') : '';

  adminMain.innerHTML = toolbar + migHtml + '<div class="cat-layout">' + nav + '<div>' + bulkBar + table + pager + '</div></div>';

  // ---- wiring ----
  var dm = document.getElementById('btnDismissMigrationNotice');
  if(dm) dm.addEventListener('click', function(){ localStorage.removeItem('ac_migration_notice'); renderAdminCatalog(); });
  document.getElementById('btnCatCategories').addEventListener('click', function(){ CAT_UI.view = 'categories'; renderAdminCatalog(); });
  document.getElementById('btnCatNewCard').addEventListener('click', openNewCard);
  document.getElementById('catSearch').addEventListener('input', function(){ CAT_UI.q = this.value; CAT_UI.page = 1; catRerenderKeepFocus('catSearch'); });
  document.getElementById('catNavSearch').addEventListener('input', function(){ CAT_UI.navQ = this.value; catRerenderKeepFocus('catNavSearch'); });
  document.getElementById('catSort').addEventListener('change', function(){ CAT_UI.sort = this.value; CAT_UI.page = 1; renderAdminCatalog(); });
  document.getElementById('catPageSize').addEventListener('change', function(){ CAT_UI.pageSize = Number(this.value) || 25; CAT_UI.page = 1; renderAdminCatalog(); });
  var rv = document.getElementById('catOnlyReview');
  if(rv) rv.addEventListener('click', function(){ CAT_UI.onlyReview = !CAT_UI.onlyReview; CAT_UI.page = 1; renderAdminCatalog(); });
  adminMain.querySelectorAll('[data-cn-cat]').forEach(function(b){
    b.addEventListener('click', function(){ CAT_UI.catId = b.getAttribute('data-cn-cat'); CAT_UI.subId = ''; CAT_UI.page = 1; renderAdminCatalog(); });
  });
  adminMain.querySelectorAll('[data-cn-sub]').forEach(function(b){
    b.addEventListener('click', function(){ CAT_UI.subId = b.getAttribute('data-cn-sub'); CAT_UI.page = 1; renderAdminCatalog(); });
  });
  adminMain.querySelectorAll('.cc-sel').forEach(function(cb){
    cb.addEventListener('change', function(){
      var id = Number(cb.getAttribute('data-gid'));
      if(cb.checked) CAT_UI.selected[id] = true; else delete CAT_UI.selected[id];
      renderAdminCatalog();
    });
  });
  var selAll = document.getElementById('ccSelAll');
  if(selAll) selAll.addEventListener('change', function(){
    pageItems.forEach(function(g){ if(selAll.checked) CAT_UI.selected[g.id] = true; else delete CAT_UI.selected[g.id]; });
    renderAdminCatalog();
  });
  var prev = document.getElementById('ccPrev'), next = document.getElementById('ccNext');
  if(prev) prev.addEventListener('click', function(){ CAT_UI.page--; renderAdminCatalog(); window.scrollTo({ top:0 }); });
  if(next) next.addEventListener('click', function(){ CAT_UI.page++; renderAdminCatalog(); window.scrollTo({ top:0 }); });
  adminMain.querySelectorAll('[data-cc-additem]').forEach(function(b){ b.addEventListener('click', function(){ openCardEditor(Number(b.getAttribute('data-cc-additem')), true); }); });
  adminMain.querySelectorAll('[data-cc-edit]').forEach(function(b){ b.addEventListener('click', function(){ openCardEditor(Number(b.getAttribute('data-cc-edit')), false); }); });
  adminMain.querySelectorAll('[data-cc-del]').forEach(function(b){
    b.addEventListener('click', function(){
      var gid = Number(b.getAttribute('data-cc-del'));
      var g = SPEC_GROUPS.find(function(x){ return x.id === gid; });
      if(!g) return;
      if(!confirm('Delete card "'+g.title+'" ('+g.variants.length+' item(s))? This removes it from the customer view too.')) return;
      saveSpecGroups(SPEC_GROUPS.filter(function(x){ return x.id !== gid; }));
      delete CAT_UI.selected[gid];
      logAudit('Catalog card deleted', g.title);
      showToast('Card deleted');
      renderAdminCatalog();
    });
  });

  // bulk actions
  if(selIds.length){
    document.getElementById('bulkClearBtn').addEventListener('click', function(){ CAT_UI.selected = {}; CAT_UI.bulkMove = false; renderAdminCatalog(); });
    document.getElementById('bulkMoveBtn').addEventListener('click', function(){ CAT_UI.bulkMove = !CAT_UI.bulkMove; renderAdminCatalog(); });
    document.getElementById('bulkMergeBtn').addEventListener('click', function(){ bulkMergeSelectedCards(selIds); });
    document.getElementById('bulkDeleteBtn').addEventListener('click', function(){ bulkDeleteSelectedCards(selIds); });
    if(CAT_UI.bulkMove){
      var catSel = document.getElementById('bulkMoveCat'), subSel = document.getElementById('bulkMoveSub');
      var fillSubs = function(){
        subSel.innerHTML = '<option value="">— None —</option>' + subcategoriesForCategory(catSel.value).map(function(sc){
          return '<option value="'+esc(sc.id)+'">'+esc(sc.name)+'</option>'; }).join('');
      };
      catSel.addEventListener('change', fillSubs); fillSubs();
      document.getElementById('bulkMoveApply').addEventListener('click', function(){ bulkMoveSelectedCards(selIds, catSel.value, subSel.value); });
    }
  }
}

function bulkMoveSelectedCards(ids, categoryId, subCategoryId){
  if(!categoryId){ showToast('Choose a category'); return; }
  var list = JSON.parse(JSON.stringify(SPEC_GROUPS));
  list.forEach(function(g){
    if(ids.indexOf(g.id) !== -1){ g.categoryId = categoryId; g.subCategoryId = subCategoryId || ''; delete g.migrated; }
  });
  var res = mergeDuplicateSpecGroups(list);   // moving can make same-title cards collide → fold them together
  saveSpecGroups(res.list);
  var where = catalogCatName(categoryId) + (subCategoryId ? ' › ' + catalogSubName(subCategoryId) : '');
  logAudit('Catalog cards moved', ids.length + ' card(s) → ' + where);
  res.merged.forEach(function(t){ logAudit('Catalog cards merged', t); });
  CAT_UI.selected = {}; CAT_UI.bulkMove = false;
  showToast(ids.length + ' card(s) moved to ' + where + (res.merged.length ? ' — duplicates merged' : ''));
  renderAdminCatalog();
}
function bulkMergeSelectedCards(ids){
  if(ids.length < 2){ showToast('Select 2 or more cards to merge'); return; }
  var groups = SPEC_GROUPS.filter(function(g){ return ids.indexOf(g.id) !== -1; }).sort(function(a,b){ return a.id - b.id; });
  var target = JSON.parse(JSON.stringify(groups[0]));
  var title = prompt('Title for the merged card (' + groups.length + ' cards → 1):', target.title);
  if(title === null) return;
  title = title.trim();
  if(!title){ showToast('Give the merged card a title'); return; }
  var where = catalogCatName(target.categoryId) + (target.subCategoryId ? ' › ' + catalogSubName(target.subCategoryId) : '');
  if(!confirm('Merge ' + groups.length + ' cards into "' + title + '" under ' + where + '?\n\nAll their items are combined into one card; the other cards are removed.')) return;
  for(var i = 1; i < groups.length; i++){ mergeSpecGroupInto(target, groups[i]); }
  target.title = title; delete target.migrated;
  var list = SPEC_GROUPS.filter(function(g){ return ids.indexOf(g.id) === -1; });
  list.push(target);
  var res = mergeDuplicateSpecGroups(list);
  saveSpecGroups(res.list);
  logAudit('Catalog cards merged', title + ' (' + groups.length + ' cards → 1, ' + target.variants.length + ' items)');
  CAT_UI.selected = {}; CAT_UI.bulkMove = false;
  showToast('Merged into "' + title + '" — ' + target.variants.length + ' items');
  renderAdminCatalog();
}
function bulkDeleteSelectedCards(ids){
  var groups = SPEC_GROUPS.filter(function(g){ return ids.indexOf(g.id) !== -1; });
  var itemCount = groups.reduce(function(n,g){ return n + g.variants.length; }, 0);
  var usesPid = groups.some(function(g){ return g.variants.some(function(v){ return v.pid !== undefined && v.pid !== null; }); });
  if(!confirm('Delete ' + groups.length + ' card(s) with ' + itemCount + ' item(s)? This cannot be undone.' +
      (usesPid ? '\n\nNote: some items were migrated from the old catalog — removing them also removes them from calculator rules and dealer-specific prices.' : ''))) return;
  saveSpecGroups(SPEC_GROUPS.filter(function(g){ return ids.indexOf(g.id) === -1; }));
  groups.forEach(function(g){ logAudit('Catalog card deleted', g.title); });
  CAT_UI.selected = {}; CAT_UI.bulkMove = false;
  showToast(groups.length + ' card(s) deleted');
  renderAdminCatalog();
}

/* ================= Categories view (search · paginate · add · rename · delete) ================= */
var manageQ = '', managePage = 1, manageExpanded = {}, manageAdding = null;
var MANAGE_PAGE_SIZE = 15;
function manageCatRowHtml(type, item, usedCount, extraStyle, extraHtml){
  var key = type + ':' + item.id;
  var editing = manageCatEditing && manageCatEditing.type === type && manageCatEditing.id === item.id;
  var left;
  if(editing){
    left = '<input type="text" id="mcEditInput" value="'+esc(item.name)+'" style="flex:1; min-width:140px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:13px;">' +
           '<button type="button" class="btn-admin sm" data-mc-save="'+esc(key)+'">Save</button>' +
           '<button type="button" class="btn-admin sm outline" data-mc-cancel="1">Cancel</button>';
  } else {
    left = '<span style="flex:1; min-width:120px; font-weight:'+(type==='cat'?'700':'500')+';">'+esc(item.name)+'</span>' +
           '<span class="ac-sub" style="white-space:nowrap;">'+usedCount+' card'+(usedCount===1?'':'s')+'</span>' +
           (extraHtml || '') +
           '<button type="button" class="btn-admin sm outline" data-mc-edit="'+esc(key)+'" title="Rename" aria-label="Rename '+esc(item.name)+'">✏️</button>' +
           '<button type="button" class="btn-admin sm maroon" data-mc-del="'+esc(key)+'" title="Delete" aria-label="Delete '+esc(item.name)+'">🗑️</button>';
  }
  return '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:7px 0; '+(extraStyle||'')+'">'+left+'</div>';
}
function manageAddRowHtml(kind, catId){
  return '<div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; padding:7px 0;">' +
    '<input type="text" id="mcAddInput" placeholder="'+(kind==='cat'?'New category name':'New sub-category name')+'" style="flex:1; min-width:150px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:13px;">' +
    '<button type="button" class="btn-admin sm" data-mc-addsave="'+kind+':'+esc(catId||'')+'">Add</button>' +
    '<button type="button" class="btn-admin sm outline" data-mc-addcancel="1">Cancel</button></div>';
}
function renderManageCategories(){
  var adminMain = document.getElementById('adminMain');
  var msgHtml = '';
  if(manageCatMsg){
    var isErr = manageCatMsg.kind === 'err';
    msgHtml = '<div class="admin-card" style="border-left:4px solid '+(isErr?'#a12626':'#2e7d32')+';">' +
      '<div style="font-size:13px; font-weight:600; color:'+(isErr?'#a12626':'#2e7d32')+';">'+esc(manageCatMsg.text)+'</div>' +
      ((manageCatMsg.titles && manageCatMsg.titles.length)
        ? '<ul style="margin:6px 0 0 18px; font-size:12px;">'+manageCatMsg.titles.map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('')+'</ul>'
        : '') +
    '</div>';
  }
  var q = manageQ.trim().toLowerCase();
  var cats = CATALOG_CATEGORIES.filter(function(c){
    if(!q) return true;
    if(c.name.toLowerCase().indexOf(q) !== -1) return true;
    return subcategoriesForCategory(c.id).some(function(sc){ return sc.name.toLowerCase().indexOf(q) !== -1; });
  });
  var pages = Math.max(1, Math.ceil(cats.length / MANAGE_PAGE_SIZE));
  if(managePage > pages) managePage = pages;
  if(managePage < 1) managePage = 1;
  var startIdx = (managePage - 1) * MANAGE_PAGE_SIZE;
  var pageCats = cats.slice(startIdx, startIdx + MANAGE_PAGE_SIZE);

  var body = pageCats.map(function(c){
    var subs = subcategoriesForCategory(c.id);
    var open = !!manageExpanded[c.id] || (q && subs.some(function(sc){ return sc.name.toLowerCase().indexOf(q) !== -1; })) || (manageAdding && manageAdding.type === 'sub' && manageAdding.catId === c.id);
    var toggle = '<button type="button" class="btn-admin sm outline" data-mc-toggle="'+esc(c.id)+'">'+(open?'▾':'▸')+' '+subs.length+' sub</button>' +
                 '<button type="button" class="btn-admin sm outline" data-mc-view="cat:'+esc(c.id)+'" title="Show these cards">Cards →</button>' +
                 '<button type="button" class="btn-admin sm outline" data-mc-addsub="'+esc(c.id)+'">+ Sub</button>';
    var html = '<div class="admin-card" style="padding:8px 14px;">' + manageCatRowHtml('cat', c, cardsUsingCategory(c.id).length, open?'border-bottom:1px solid #eee5cd;':'', toggle);
    if(open){
      html += '<div style="margin-left:22px;">' +
        subs.map(function(sc){
          return manageCatRowHtml('sub', sc, cardsUsingSubcategory(sc.id).length, '',
            '<button type="button" class="btn-admin sm outline" data-mc-view="sub:'+esc(sc.id)+'" title="Show these cards">Cards →</button>');
        }).join('') +
        (subs.length === 0 ? '<div class="ac-sub" style="padding:6px 0;">No sub-categories</div>' : '') +
        (manageAdding && manageAdding.type === 'sub' && manageAdding.catId === c.id ? manageAddRowHtml('sub', c.id) : '') +
      '</div>';
    }
    return html + '</div>';
  }).join('');
  if(!cats.length) body = '<div class="admin-empty"><div class="ae-big">'+(CATALOG_CATEGORIES.length?'No category matches':'No categories yet')+'</div><div>'+(CATALOG_CATEGORIES.length?'Try a different search.':'Tap “+ Category” to add one.')+'</div></div>';

  adminMain.innerHTML =
    '<div class="admin-toolbar"><h2>🗂 Categories <span class="ac-sub" style="font-weight:400;">· '+CATALOG_CATEGORIES.length+' categories · '+CATALOG_SUBCATEGORIES.length+' sub-categories</span></h2>' +
      '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
        '<button class="btn-admin outline" id="btnBackFromManage">← Back to Catalog</button>' +
        '<button class="btn-admin" id="btnMcAddCat">+ Category</button></div></div>' +
    '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center;">' +
      '<input type="text" id="mcSearch" placeholder="🔍 Search categories or sub-categories…" value="'+esc(manageQ)+'" style="flex:1; min-width:200px; border:1.3px solid #ddd3ba; border-radius:8px; padding:8px 12px; font-size:13px;">' +
      '<button class="btn-admin sm outline" id="mcExpandAll">Expand all</button><button class="btn-admin sm outline" id="mcCollapseAll">Collapse all</button></div>' +
    '<div class="ac-sub mb-2">Rename changes only the display name — every card keeps working. A category or sub-category can be deleted only when no card uses it.</div>' +
    msgHtml +
    (manageAdding && manageAdding.type === 'cat' ? '<div class="admin-card" style="padding:8px 14px;">'+manageAddRowHtml('cat','')+'</div>' : '') +
    body +
    (cats.length > MANAGE_PAGE_SIZE ? '<div class="cc-pager"><span class="ac-sub">'+(startIdx+1)+'–'+(startIdx+pageCats.length)+' of '+cats.length+'</span><span style="display:flex; gap:6px; align-items:center;">' +
      '<button class="btn-admin sm outline" id="mcPrev"'+(managePage<=1?' disabled':'')+'>‹ Prev</button><span>Page '+managePage+' / '+pages+'</span>' +
      '<button class="btn-admin sm outline" id="mcNext"'+(managePage>=pages?' disabled':'')+'>Next ›</button></span></div>' : '');

  document.getElementById('btnBackFromManage').addEventListener('click', function(){
    CAT_UI.view = 'list'; manageCatEditing = null; manageCatMsg = null; manageAdding = null;
    renderAdminCatalog();
  });
  document.getElementById('btnMcAddCat').addEventListener('click', function(){ manageAdding = { type:'cat' }; manageCatEditing = null; manageCatMsg = null; renderManageCategories(); });
  document.getElementById('mcSearch').addEventListener('input', function(){
    var pos = this.selectionStart; manageQ = this.value; managePage = 1; renderManageCategories();
    var again = document.getElementById('mcSearch'); if(again){ again.focus(); try{ again.setSelectionRange(pos,pos); }catch(e){} }
  });
  document.getElementById('mcExpandAll').addEventListener('click', function(){ CATALOG_CATEGORIES.forEach(function(c){ manageExpanded[c.id] = true; }); renderManageCategories(); });
  document.getElementById('mcCollapseAll').addEventListener('click', function(){ manageExpanded = {}; renderManageCategories(); });
  var mp = document.getElementById('mcPrev'), mn = document.getElementById('mcNext');
  if(mp) mp.addEventListener('click', function(){ managePage--; renderManageCategories(); });
  if(mn) mn.addEventListener('click', function(){ managePage++; renderManageCategories(); });
  adminMain.querySelectorAll('[data-mc-toggle]').forEach(function(b){
    b.addEventListener('click', function(){ var id = b.getAttribute('data-mc-toggle'); manageExpanded[id] = !manageExpanded[id]; renderManageCategories(); });
  });
  adminMain.querySelectorAll('[data-mc-view]').forEach(function(b){
    b.addEventListener('click', function(){
      var parts = b.getAttribute('data-mc-view').split(':'), type = parts[0], id = parts.slice(1).join(':');
      if(type === 'cat'){ CAT_UI.catId = id; CAT_UI.subId = ''; }
      else { var sc = CATALOG_SUBCATEGORIES.find(function(x){ return x.id === id; }); if(!sc) return; CAT_UI.catId = sc.categoryId; CAT_UI.subId = id; }
      CAT_UI.q = ''; CAT_UI.onlyReview = false; CAT_UI.page = 1; CAT_UI.view = 'list';
      renderAdminCatalog();
    });
  });
  adminMain.querySelectorAll('[data-mc-addsub]').forEach(function(b){
    b.addEventListener('click', function(){ var id = b.getAttribute('data-mc-addsub'); manageAdding = { type:'sub', catId:id }; manageExpanded[id] = true; manageCatEditing = null; manageCatMsg = null; renderManageCategories(); });
  });
  adminMain.querySelectorAll('[data-mc-addcancel]').forEach(function(b){ b.addEventListener('click', function(){ manageAdding = null; renderManageCategories(); }); });
  adminMain.querySelectorAll('[data-mc-addsave]').forEach(function(b){
    b.addEventListener('click', function(){ saveManagedAdd(b.getAttribute('data-mc-addsave')); });
  });
  var addInput = document.getElementById('mcAddInput');
  if(addInput){
    addInput.focus();
    addInput.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); var sb = adminMain.querySelector('[data-mc-addsave]'); if(sb) saveManagedAdd(sb.getAttribute('data-mc-addsave')); }
      else if(e.key === 'Escape'){ manageAdding = null; renderManageCategories(); }
    });
  }
  function parseKey(k){ var i = k.indexOf(':'); return { type:k.slice(0,i), id:k.slice(i+1) }; }
  adminMain.querySelectorAll('[data-mc-edit]').forEach(function(b){
    b.addEventListener('click', function(){ manageCatEditing = parseKey(b.getAttribute('data-mc-edit')); manageCatMsg = null; manageAdding = null; renderManageCategories(); });
  });
  adminMain.querySelectorAll('[data-mc-cancel]').forEach(function(b){
    b.addEventListener('click', function(){ manageCatEditing = null; renderManageCategories(); });
  });
  adminMain.querySelectorAll('[data-mc-save]').forEach(function(b){
    b.addEventListener('click', function(){ saveManagedRename(parseKey(b.getAttribute('data-mc-save'))); });
  });
  adminMain.querySelectorAll('[data-mc-del]').forEach(function(b){
    b.addEventListener('click', function(){
      var k = parseKey(b.getAttribute('data-mc-del'));
      if(k.type === 'cat') deleteManagedCategory(k.id); else deleteManagedSubcategory(k.id);
    });
  });
  var input = document.getElementById('mcEditInput');
  if(input && manageCatEditing){
    input.focus(); input.select();
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); saveManagedRename(manageCatEditing); }
      else if(e.key === 'Escape'){ manageCatEditing = null; renderManageCategories(); }
    });
  }
}
function saveManagedAdd(key){
  var i = key.indexOf(':'), kind = key.slice(0,i), catId = key.slice(i+1);
  var input = document.getElementById('mcAddInput');
  var name = input ? input.value.trim() : '';
  if(!name){ showToast('Enter a name'); return; }
  var lower = name.toLowerCase();
  if(kind === 'cat'){
    if(CATALOG_CATEGORIES.some(function(c){ return c.name.trim().toLowerCase() === lower; })){ showToast('A category named “'+name+'” already exists'); return; }
    var id = nextCatalogCategoryId(name);
    saveCatalogCategories(CATALOG_CATEGORIES.concat([{ id:id, name:name }]));
    logAudit('Catalog category added', name);
    manageCatMsg = { kind:'ok', text:'Category “'+name+'” added' };
  } else {
    if(CATALOG_SUBCATEGORIES.some(function(c){ return c.categoryId === catId && c.name.trim().toLowerCase() === lower; })){ showToast('A sub-category named “'+name+'” already exists here'); return; }
    var sid = nextCatalogSubcategoryId(name);
    saveCatalogSubcategories(CATALOG_SUBCATEGORIES.concat([{ id:sid, categoryId:catId, name:name }]));
    logAudit('Catalog sub-category added', name+' (under '+catId+')');
    manageCatMsg = { kind:'ok', text:'Sub-category “'+name+'” added' };
  }
  manageAdding = null;
  renderManageCategories();
}

function saveManagedRename(k){
  var input = document.getElementById('mcEditInput');
  if(!input) return;
  var name = input.value.trim();
  if(!name){ showToast('Enter a name'); return; }
  var lower = name.toLowerCase();
  if(k.type === 'cat'){
    var cat = CATALOG_CATEGORIES.find(function(c){ return c.id === k.id; });
    if(!cat){ manageCatEditing = null; renderManageCategories(); return; }
    if(name === cat.name){ manageCatEditing = null; renderManageCategories(); return; }
    if(CATALOG_CATEGORIES.some(function(c){ return c.id !== cat.id && c.name.trim().toLowerCase() === lower; })){
      showToast('A category named “'+name+'” already exists'); return;
    }
    var oldName = cat.name;
    saveCatalogCategories(CATALOG_CATEGORIES.map(function(c){ return c.id === cat.id ? { id:c.id, name:name } : c; }));
    logAudit('Catalog category renamed', oldName+' → '+name);
    manageCatMsg = { kind:'ok', text:'Category renamed: “'+oldName+'” → “'+name+'”' };
  } else {
    var sub = CATALOG_SUBCATEGORIES.find(function(c){ return c.id === k.id; });
    if(!sub){ manageCatEditing = null; renderManageCategories(); return; }
    if(name === sub.name){ manageCatEditing = null; renderManageCategories(); return; }
    if(CATALOG_SUBCATEGORIES.some(function(c){ return c.id !== sub.id && c.categoryId === sub.categoryId && c.name.trim().toLowerCase() === lower; })){
      showToast('A sub-category named “'+name+'” already exists in this category'); return;
    }
    var oldSub = sub.name;
    saveCatalogSubcategories(CATALOG_SUBCATEGORIES.map(function(c){
      if(c.id !== sub.id) return c;
      var copy = JSON.parse(JSON.stringify(c)); copy.name = name; return copy;
    }));
    logAudit('Catalog sub-category renamed', oldSub+' → '+name+' (under '+sub.categoryId+')');
    manageCatMsg = { kind:'ok', text:'Sub-category renamed: “'+oldSub+'” → “'+name+'”' };
  }
  manageCatEditing = null;
  renderManageCategories();
}
function deleteManagedSubcategory(id){
  var sub = CATALOG_SUBCATEGORIES.find(function(c){ return c.id === id; });
  if(!sub) return;
  var used = cardsUsingSubcategory(id);
  if(used.length){
    manageCatMsg = { kind:'err', text:'Can’t delete “'+sub.name+'”: '+used.length+' card(s) use this — move or delete them first.',
      titles: used.map(function(g){ return g.title; }) };
    manageCatEditing = null;
    renderManageCategories();
    return;
  }
  if(!confirm("Delete '"+sub.name+"'? This cannot be undone.")) return;
  saveCatalogSubcategories(CATALOG_SUBCATEGORIES.filter(function(c){ return c.id !== id; }));
  logAudit('Catalog sub-category deleted', sub.name+' (under '+sub.categoryId+')');
  manageCatMsg = { kind:'ok', text:'Sub-category “'+sub.name+'” deleted' };
  manageCatEditing = null;
  renderManageCategories();
}
function deleteManagedCategory(id){
  var cat = CATALOG_CATEGORIES.find(function(c){ return c.id === id; });
  if(!cat) return;
  var subs = subcategoriesForCategory(id);
  var used = cardsUsingCategory(id);   // cards on the category itself OR on any of its sub-categories
  if(used.length){
    manageCatMsg = { kind:'err', text:'Can’t delete “'+cat.name+'”: '+used.length+' card(s) use this — move or delete them first.',
      titles: used.map(function(g){ return g.title; }) };
    manageCatEditing = null;
    renderManageCategories();
    return;
  }
  var msg = "Delete '"+cat.name+"'? This cannot be undone.";
  if(subs.length){
    msg += "\n\nIts "+subs.length+" now-unused sub-categor"+(subs.length===1?'y':'ies')+" will also be deleted: "+
      subs.map(function(x){ return x.name; }).join(', ')+'.';
  }
  if(!confirm(msg)) return;
  if(subs.length){
    saveCatalogSubcategories(CATALOG_SUBCATEGORIES.filter(function(c){ return c.categoryId !== id; }));
  }
  saveCatalogCategories(CATALOG_CATEGORIES.filter(function(c){ return c.id !== id; }));
  logAudit('Catalog category deleted', cat.name + (subs.length ? ' (with '+subs.length+' sub-categor'+(subs.length===1?'y':'ies')+': '+subs.map(function(x){ return x.name; }).join(', ')+')' : ''));
  manageCatMsg = { kind:'ok', text:'Category “'+cat.name+'” deleted' };
  manageCatEditing = null;
  renderManageCategories();
}

function downloadProductTemplate(){
  var gmap = {}; SPEC_GROUPS.forEach(function(g){ gmap[g.id] = g; });
  var rows = PRODUCTS.map(function(p){
    var g = p.isCatalogVariant ? gmap[p.specGroupId] : null;
    var unlimited = p.stock === Infinity || p.stock === undefined || p.stock === null;
    return {
      'Item Code': p.part,
      'Product': p.name,
      'Category': g ? catalogCatName(g.categoryId) : ((CATEGORY_META[p.cat] && t(CATEGORY_META[p.cat].labelKey)) || p.cat),
      'MRP': p.mrp,
      'Discount %': Number(p.discountPct) || 0,
      'GST %': p.gstPct,
      'Stock': unlimited ? '' : p.stock
    };
  });
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:16},{wch:44},{wch:18},{wch:10},{wch:11},{wch:8},{wch:9}];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'AshirvadConnect_Product_Update_Template.xlsx');
}

function readSpreadsheetFile(file, callback){
  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var data = new Uint8Array(e.target.result);
      var wb = XLSX.read(data, { type:'array' });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
      callback(null, rows);
    } catch(err){ callback(err, null); }
  };
  reader.onerror = function(){ callback(new Error('Could not read file'), null); };
  reader.readAsArrayBuffer(file);
}
function pickField(row, names){
  var keys = Object.keys(row);
  for(var i=0;i<names.length;i++){
    var match = keys.find(function(k){ return k.trim().toLowerCase() === names[i]; });
    if(match !== undefined) return row[match];
  }
  return undefined;
}
function writeBackCatalogVariants(prods){
  var list = JSON.parse(JSON.stringify(SPEC_GROUPS)), changed = false;
  prods.forEach(function(p){
    list.forEach(function(g){
      (g.variants||[]).forEach(function(v){
        var hasPid = v.pid !== undefined && v.pid !== null && v.pid !== '';
        var pid = hasPid ? Number(v.pid) : specVariantProductId(g.id, v.id);
        if(pid !== p.id) return;
        v.mrp = p.mrp; v.discountPct = p.discountPct; v.gstPct = p.gstPct;
        if(p.stock === Infinity || p.stock === undefined || p.stock === null) delete v.stock; else v.stock = p.stock;
        changed = true;
      });
    });
  });
  if(changed) saveSpecGroups(list);
}
var BULK_RESULT = null;
/* "₹1,200" / "18%" / 1200 → number. Returns {blank:true} for empty, {bad:true} for unparseable. */
function parseBulkNumber(v){
  if(v === undefined || v === null) return { blank:true };
  var str = String(v).trim();
  if(str === '') return { blank:true };
  var n = Number(str.replace(/[₹,%\s]/g, ''));
  return isNaN(n) ? { bad:true } : { n:n };
}
function handleBulkProductUpdate(file){
  readSpreadsheetFile(file, function(err, rows){
    if(err || !rows){ showToast('Could not read that file — use the downloaded template (.xlsx / .csv)'); return; }
    if(!rows.length){ showToast('The file has no data rows'); return; }
    var CODE_NAMES = ['item code','part','part no','part number','code'];
    var hasCode = Object.keys(rows[0]).some(function(k){ return CODE_NAMES.indexOf(k.trim().toLowerCase()) !== -1; });
    if(!hasCode){ showToast('No "Item Code" column found — download the template for the right format'); return; }

    var byCode = {}, dupCodes = {};
    PRODUCTS.forEach(function(pp){
      var k = String(pp.part).trim().toLowerCase();
      if(k in byCode) dupCodes[k] = true; else byCode[k] = pp;
    });
    var res = { file:file.name, total:0, updated:0, unchanged:0, notFound:[], errors:[], dups:[] };
    var touchedCatalog = [], seen = {};
    rows.forEach(function(row, idx){
      var rowNo = idx + 2;   // +1 header, +1 for 1-based
      var rawCode = pickField(row, CODE_NAMES);
      if(rawCode === undefined || String(rawCode).trim() === '') return;
      res.total++;
      var codeShown = String(rawCode).trim(), code = codeShown.toLowerCase();
      var p = byCode[code];
      if(!p){ res.notFound.push(codeShown); return; }
      if(dupCodes[code] && res.dups.indexOf(codeShown) === -1) res.dups.push(codeShown);
      if(seen[code]){ res.errors.push({ row:rowNo, code:codeShown, msg:'duplicate row for this item code — only the first was applied' }); return; }
      seen[code] = true;

      var mrp = parseBulkNumber(pickField(row, ['mrp']));
      var disc = parseBulkNumber(pickField(row, ['discount %','discount%','discount','discountpct']));
      var gst = parseBulkNumber(pickField(row, ['gst %','gst%','gst','gstpct']));
      var stockRaw = pickField(row, ['stock','stock qty','stockqty','qty','quantity']);
      var stock = parseBulkNumber(stockRaw);
      var unlimited = false;
      if(stock.bad && /^(unlimited|inf|infinite|∞)$/i.test(String(stockRaw).trim())){ unlimited = true; stock = { blank:false, n:Infinity }; }
      var problem = '';
      if(mrp.bad || (mrp.n !== undefined && mrp.n <= 0)) problem = 'MRP must be a number above 0';
      else if(disc.bad || (disc.n !== undefined && (disc.n < 0 || disc.n > 95))) problem = 'Discount % must be 0–95';
      else if(gst.bad || (gst.n !== undefined && (gst.n < 0 || gst.n > 100))) problem = 'GST % must be 0–100';
      else if(unlimited && !p.isCatalogVariant) problem = '"Unlimited" stock is only available for catalog items';
      else if(stock.bad || (stock.n !== undefined && stock.n !== Infinity && stock.n < 0)) problem = 'Stock must be 0 or more';
      if(problem){ res.errors.push({ row:rowNo, code:codeShown, msg:problem }); return; }   // whole row skipped — no half-applied edits

      var before = { mrp:p.mrp, d:Number(p.discountPct)||0, g:p.gstPct, s:p.stock };
      var oldStock = (p.stock === Infinity) ? Infinity : (Number(p.stock)||0);
      if(mrp.n !== undefined) p.mrp = mrp.n;
      if(disc.n !== undefined) p.discountPct = disc.n;
      if(gst.n !== undefined) p.gstPct = gst.n;
      if(stock.n !== undefined) p.stock = (stock.n === Infinity) ? Infinity : Math.round(stock.n);
      var changed = before.mrp !== p.mrp || before.d !== (Number(p.discountPct)||0) || before.g !== p.gstPct || before.s !== p.stock;
      if(!changed){ res.unchanged++; return; }
      res.updated++;
      if(p.isCatalogVariant) touchedCatalog.push(p);
      if(stock.n !== undefined && p.stock !== Infinity) checkAndFulfillStockNotify(p.id, oldStock === Infinity ? 0 : oldStock, p.stock);
    });
    // card-owned products are rebuilt from SPEC_GROUPS on every load, so write the new values back to persist them
    if(touchedCatalog.length) writeBackCatalogVariants(touchedCatalog);
    saveProducts(PRODUCTS);
    if(res.updated) logAudit('Bulk product update', res.updated+' updated, '+res.unchanged+' unchanged'+(res.notFound.length?', '+res.notFound.length+' code(s) not found':'')+(res.errors.length?', '+res.errors.length+' row(s) rejected':'')+' ('+file.name+')');
    BULK_RESULT = res;
    showToast('Bulk update: '+res.updated+' updated'+(res.notFound.length+res.errors.length ? ' · '+(res.notFound.length+res.errors.length)+' need attention' : ''));
    if(currentAdminTab === 'products') renderAdminProducts();
  });
}
function bulkResultHtml(){
  var r = BULK_RESULT;
  if(!r) return '';
  var list = function(arr, fmt){ return arr.slice(0,15).map(fmt).join('') + (arr.length > 15 ? '<li>…and '+(arr.length-15)+' more</li>' : ''); };
  var bad = r.notFound.length + r.errors.length;
  return '<div class="admin-card" style="border-left:4px solid '+(bad?'var(--maroon-600)':'#2e7d32')+';">' +
    '<div class="ac-head"><div><div class="ac-title">Bulk update result</div><div class="ac-sub">'+esc(r.file)+' · '+r.total+' row(s) with an item code</div></div>' +
      '<button class="btn-admin sm outline" id="btnDismissBulk">Dismiss</button></div>' +
    '<div style="display:flex; gap:14px; flex-wrap:wrap; font-size:13px; margin:6px 0;">' +
      '<span>✅ <b>'+r.updated+'</b> updated</span><span>➖ <b>'+r.unchanged+'</b> unchanged</span>' +
      '<span style="color:'+(r.notFound.length?'var(--maroon-600)':'inherit')+';">🔎 <b>'+r.notFound.length+'</b> not found</span>' +
      '<span style="color:'+(r.errors.length?'var(--maroon-600)':'inherit')+';">⚠ <b>'+r.errors.length+'</b> rejected</span></div>' +
    (r.errors.length ? '<div class="ac-sub" style="font-weight:600;">Rejected rows (nothing from these rows was applied):</div><ul style="margin:2px 0 6px 18px; font-size:12px;">'+list(r.errors, function(e){ return '<li>Row '+e.row+' · '+esc(e.code)+' — '+esc(e.msg)+'</li>'; })+'</ul>' : '') +
    (r.notFound.length ? '<div class="ac-sub" style="font-weight:600;">Item codes not found:</div><ul style="margin:2px 0 6px 18px; font-size:12px;">'+list(r.notFound, function(c){ return '<li>'+esc(c)+'</li>'; })+'</ul>' : '') +
    (r.dups.length ? '<div class="ac-sub">Note: these codes exist on more than one product; the first match was updated: '+esc(r.dups.slice(0,10).join(', '))+'</div>' : '') +
  '</div>';
}

/* ---------------- Marketing tab (Banners · Offer Zone · Broadcast) ---------------- */
var MARKETING_VIEW = 'banners';
function marketingContainer(){ return document.getElementById('mkBody') || document.getElementById('adminMain'); }
function renderAdminMarketing(){
  var adminMain = document.getElementById('adminMain');
  var views = [['banners','🖼 Banners'],['offers','🎁 Offer Zone'],['broadcast','📢 Broadcast']];
  adminMain.innerHTML =
    '<div class="filter-row" style="margin-bottom:12px;">' +
      views.map(function(v){ return '<button type="button" class="filter-chip'+(MARKETING_VIEW===v[0]?' active':'')+'" data-mkview="'+v[0]+'">'+v[1]+'</button>'; }).join('') +
    '</div><div id="mkBody"></div>';
  adminMain.querySelectorAll('[data-mkview]').forEach(function(b){
    b.addEventListener('click', function(){ MARKETING_VIEW = b.getAttribute('data-mkview'); renderAdminMarketing(); });
  });
  if(MARKETING_VIEW === 'offers') renderAdminOffers();
  else if(MARKETING_VIEW === 'broadcast') renderAdminBroadcast();
  else renderAdminBanners();
}

/* ---------------- Banners tab ---------------- */
var BANNER_COLOR_PRESETS = [
  'linear-gradient(135deg, var(--navy-900), var(--navy-700))',
  'linear-gradient(135deg, var(--maroon-600), var(--maroon-500))',
  'linear-gradient(135deg, var(--navy-950), var(--maroon-600))',
  'linear-gradient(135deg, var(--gold-500), var(--maroon-600))'
];
function renderAdminBanners(){
  var adminMain = marketingContainer();
  var toolbar = '<div class="admin-toolbar"><h2>Banners</h2>' +
    '<div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">' +
      '<label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">Show on home ' +
        '<label class="switch"><input type="checkbox" id="toggleShowBanners"'+(SETTINGS.showBanners?' checked':'')+'><span class="slider"></span></label>' +
      '</label>' +
      '<button class="btn-admin outline" id="btnDeliverySettings">🚚 Home / Delivery Settings</button>' +
      '<button class="btn-admin" id="btnAddBanner">+ Add banner</button>' +
    '</div></div>';
  var list = BANNERS.length === 0
    ? '<div class="admin-empty"><div class="ae-big">No banners yet</div></div>'
    : BANNERS.map(function(b){
        return '<div class="admin-card">' +
          '<div class="banner-slide" style="background:'+(b.color||BANNER_COLOR_PRESETS[0])+'; margin-bottom:10px;">' +
            '<div class="bs-title">'+esc(b.title)+'</div><div class="bs-sub">'+esc(b.subtitle||'')+'</div>' +
          '</div>' +
          '<div class="ac-actions">' +
            '<label class="switch"><input type="checkbox" class="b-active-toggle" data-id="'+b.id+'"'+(b.active!==false?' checked':'')+'><span class="slider"></span></label>' +
            '<button class="btn-admin sm outline" data-edit-banner="'+b.id+'">Edit</button>' +
            '<button class="btn-admin sm maroon" data-del-banner="'+b.id+'">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
  adminMain.innerHTML = toolbar + list;

  document.getElementById('toggleShowBanners').addEventListener('change', function(e){
    saveSettings(Object.assign({}, SETTINGS, { showBanners: e.target.checked }));
  });
  document.getElementById('btnDeliverySettings').addEventListener('click', openDeliverySettings);
  document.getElementById('btnAddBanner').addEventListener('click', function(){ openBannerEditor(null); });
  adminMain.querySelectorAll('.b-active-toggle').forEach(function(chk){
    chk.addEventListener('change', function(){
      var id = Number(chk.getAttribute('data-id'));
      var b = BANNERS.find(function(x){ return x.id === id; });
      if(b){ b.active = chk.checked; saveBanners(BANNERS); }
    });
  });
  adminMain.querySelectorAll('[data-edit-banner]').forEach(function(btn){
    btn.addEventListener('click', function(){ openBannerEditor(Number(btn.getAttribute('data-edit-banner'))); });
  });
  adminMain.querySelectorAll('[data-del-banner]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = Number(btn.getAttribute('data-del-banner'));
      if(!confirm('Delete this banner?')) return;
      saveBanners(BANNERS.filter(function(b){ return b.id !== id; }));
      renderAdminBanners();
    });
  });
}
function openBannerEditor(id){
  var isNew = id === null;
  var b = isNew ? { id:nextBannerId(), title:'', subtitle:'', color:BANNER_COLOR_PRESETS[0], imageUrl:'', images:[], size:'medium', buttonText:'', linkType:'url', linkValue:'', link:'', active:true } : BANNERS.find(function(x){ return x.id === id; });
  if(!b) return;
  // Older saved banners only ever had a single imageUrl / plain link — fold those into the
  // new (list-of-images / typed-link) shape the first time this banner is opened, so nothing
  // existing breaks and the new fields still have something sensible to show.
  if(!b.images) b.images = b.imageUrl ? [b.imageUrl] : [];
  if(!b.size) b.size = 'medium';
  if(!b.linkType){ b.linkType = 'url'; b.linkValue = b.link || ''; }
  document.getElementById('bannerOffcanvasTitle').textContent = isNew ? 'Add Banner' : 'Edit Banner';
  var body = document.getElementById('bannerOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Title</label><input type="text" id="bnTitle" value="'+esc(b.title)+'"></div>' +
      '<div class="full"><label>Subtitle</label><input type="text" id="bnSubtitle" value="'+esc(b.subtitle||'')+'"></div>' +
      '<div class="full"><label>Button text (optional) — e.g. "Shop now"</label><input type="text" id="bnButtonText" value="'+esc(b.buttonText||'')+'"></div>' +
      '<div class="full"><label>Banner size</label><select id="bnSize">' +
        '<option value="small"'+(b.size==='small'?' selected':'')+'>Small</option>' +
        '<option value="medium"'+(b.size==='medium'?' selected':'')+'>Medium</option>' +
        '<option value="large"'+(b.size==='large'?' selected':'')+'>Large</option>' +
      '</select></div>' +
      '<div class="full"><label>Color style (used when there is no image)</label><select id="bnColor">' +
        BANNER_COLOR_PRESETS.map(function(c,i){ return '<option value="'+esc(c)+'"'+(b.color===c?' selected':'')+'>Preset '+(i+1)+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="full"><label>Images (optional, one per line — more than one auto-rotates)</label><textarea id="bnImages" rows="3" placeholder="https://example.com/1.jpg">'+esc((b.images||[]).join('\n'))+'</textarea></div>' +
      linkTargetEditorHtml('bn', b.linkType, b.linkValue) +
    '</div>' +
    '<button class="btn-admin mt-3" id="saveBannerBtn" style="width:100%;">Save banner</button>';
  wireLinkTargetEditor('bn');
  document.getElementById('saveBannerBtn').addEventListener('click', function(){
    b.title = document.getElementById('bnTitle').value.trim();
    b.subtitle = document.getElementById('bnSubtitle').value.trim();
    b.buttonText = document.getElementById('bnButtonText').value.trim();
    b.size = document.getElementById('bnSize').value;
    b.color = document.getElementById('bnColor').value;
    b.images = document.getElementById('bnImages').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    b.imageUrl = b.images[0] || '';   // kept in sync for any older code path that still reads it
    b.linkType = document.getElementById('bnLinkType').value;
    b.linkValue = document.getElementById('bnLinkValue').value.trim();
    b.link = b.linkType === 'url' ? b.linkValue : '';   // kept in sync for the same reason
    var list = BANNERS.filter(function(x){ return x.id !== b.id; });
    list.push(b);
    list.sort(function(x,y){ return x.id - y.id; });
    saveBanners(list);
    showToast('Banner saved');
    bannerOffcanvas.hide();
    renderAdminBanners();
  });
  bannerOffcanvas.show();
}

/* ---------------- Offer Zone tab ---------------- */
function renderAdminOffers(){
  var adminMain = marketingContainer();
  var toolbar = '<div class="admin-toolbar"><h2>Offer Zone</h2>' +
    '<div style="display:flex; align-items:center; gap:14px;">' +
      '<label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">Show on home ' +
        '<label class="switch"><input type="checkbox" id="toggleShowOffers"'+(SETTINGS.showOfferZone?' checked':'')+'><span class="slider"></span></label>' +
      '</label>' +
      '<button class="btn-admin" id="btnAddOffer">+ Add offer</button>' +
    '</div></div>';
  var list = OFFERS.length === 0
    ? '<div class="admin-empty"><div class="ae-big">No offers yet</div></div>'
    : OFFERS.map(function(o){
        return '<div class="admin-card">' +
          '<div class="offer-zone" style="margin-bottom:10px;">' +
            '<div class="offer-chip">' +
              (o.badge ? '<span class="oc-badge">'+esc(o.badge)+'</span>' : '') +
              '<div class="oc-title">'+esc(o.title)+'</div>' +
              '<div class="oc-desc">'+esc(o.desc||'')+'</div>' +
            '</div>' +
          '</div>' +
          '<div class="ac-actions">' +
            '<label class="switch"><input type="checkbox" class="o-active-toggle" data-id="'+o.id+'"'+(o.active!==false?' checked':'')+'><span class="slider"></span></label>' +
            '<button class="btn-admin sm outline" data-edit-offer="'+o.id+'">Edit</button>' +
            '<button class="btn-admin sm maroon" data-del-offer="'+o.id+'">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
  adminMain.innerHTML = toolbar + list;

  document.getElementById('toggleShowOffers').addEventListener('change', function(e){
    saveSettings(Object.assign({}, SETTINGS, { showOfferZone: e.target.checked }));
  });
  document.getElementById('btnAddOffer').addEventListener('click', function(){ openOfferEditor(null); });
  adminMain.querySelectorAll('.o-active-toggle').forEach(function(chk){
    chk.addEventListener('change', function(){
      var id = Number(chk.getAttribute('data-id'));
      var o = OFFERS.find(function(x){ return x.id === id; });
      if(o){ o.active = chk.checked; saveOffers(OFFERS); }
    });
  });
  adminMain.querySelectorAll('[data-edit-offer]').forEach(function(btn){
    btn.addEventListener('click', function(){ openOfferEditor(Number(btn.getAttribute('data-edit-offer'))); });
  });
  adminMain.querySelectorAll('[data-del-offer]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = Number(btn.getAttribute('data-del-offer'));
      if(!confirm('Delete this offer?')) return;
      saveOffers(OFFERS.filter(function(o){ return o.id !== id; }));
      renderAdminOffers();
    });
  });
}
function openOfferEditor(id){
  var isNew = id === null;
  var o = isNew ? { id:nextOfferId(), badge:'', title:'', desc:'', linkType:'url', linkValue:'', active:true } : OFFERS.find(function(x){ return x.id === id; });
  if(!o) return;
  if(!o.linkType) o.linkType = 'url';   // older saved offers predate the link field
  document.getElementById('offerOffcanvasTitle').textContent = isNew ? 'Add Offer' : 'Edit Offer';
  var body = document.getElementById('offerOffcanvasBody');
  body.innerHTML =
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Badge (optional)</label><input type="text" id="ofBadge" value="'+esc(o.badge||'')+'" placeholder="e.g. LIMITED"></div>' +
      '<div class="full"><label>Title</label><input type="text" id="ofTitle" value="'+esc(o.title)+'"></div>' +
      '<div class="full"><label>Description</label><textarea id="ofDesc" rows="3">'+esc(o.desc||'')+'</textarea></div>' +
      linkTargetEditorHtml('of', o.linkType, o.linkValue) +
    '</div>' +
    '<button class="btn-admin mt-3" id="saveOfferBtn" style="width:100%;">Save offer</button>';
  wireLinkTargetEditor('of');
  document.getElementById('saveOfferBtn').addEventListener('click', function(){
    o.badge = document.getElementById('ofBadge').value.trim();
    o.title = document.getElementById('ofTitle').value.trim();
    o.desc = document.getElementById('ofDesc').value.trim();
    o.linkType = document.getElementById('ofLinkType').value;
    o.linkValue = document.getElementById('ofLinkValue').value.trim();
    var list = OFFERS.filter(function(x){ return x.id !== o.id; });
    list.push(o);
    list.sort(function(x,y){ return x.id - y.id; });
    saveOffers(list);
    showToast('Offer saved');
    offerOffcanvas.hide();
    renderAdminOffers();
  });
  offerOffcanvas.show();
}

/* ---------------- Reports tab ---------------- */
/* ---------------- Configuration tab ----------------
   This is a navigation hub only. It does NOT re-implement or move any existing feature —
   it simply jumps into the exact same screens/flags the original buttons already use
   (ORDER_AUTO_RULES_VIEW, CAT_UI.view, the Products tab). This keeps every existing
   flow (Orders → Auto-Status Rules, Catalog → Categories, Products → Dealer Pricing)
   working exactly as before, while giving the admin one quick place to find them. */
function goToAdminTab(tab){
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tabs button[data-atab]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-atab') === tab);
  });
  renderAdmin();
}
function renderAdminConfiguration(){
  if(PRICING_OVERVIEW_VIEW){ renderPricingOverview(); return; }
  var adminMain = document.getElementById('adminMain');
  var cards = [
    CLOUD ? {
      icon: '☁', title: 'Cloud sync (Firebase)',
      sub: 'Live status of the Firebase connection, publish the starting catalog to the cloud, or import data from the old browser-only version.',
      btn: 'Open Cloud sync',
      action: function(){ CLOUD.openAdminPanel(); }
    } : null,
    {
      icon: '📊', title: 'Pricing Overview',
      sub: 'One clear screen for every product\'s MRP → dealer price, and exactly which dealers have a special rate — the audit view for Products & Pricing.',
      btn: 'Open Pricing Overview',
      action: function(){ PRICING_OVERVIEW_VIEW = true; renderAdminConfiguration(); }
    },
    {
      icon: '⏱', title: 'Auto-Status Rules',
      sub: 'Set how quickly a dealer\'s orders auto-advance (confirmed → dispatched → delivered), per dealer or in bulk.',
      btn: 'Open Auto-Status Rules',
      action: function(){ ORDER_AUTO_RULES_VIEW = true; goToAdminTab('orders'); }
    },
    {
      icon: '💲', title: 'Dealer-Specific Product Pricing',
      sub: 'Give an individual dealer a special discount on a product from that product\'s Details → Dealer Pricing panel.',
      btn: 'Open Products & Pricing',
      action: function(){ goToAdminTab('products'); }
    },
    {
      icon: '🗂', title: 'Manage Categories',
      sub: 'Add, rename or reorder catalog categories and sub-categories.',
      btn: 'Open Manage Categories',
      action: function(){ CAT_UI.view = 'categories'; goToAdminTab('catalog'); }
    },
    {
      icon: '📐', title: 'Calculator Rules',
      sub: 'Configure the quantity/price calculator rules shown to dealers.',
      btn: 'Open Calculator Rules',
      action: function(){ goToAdminTab('calc'); }
    },
    {
      icon: '🧾', title: 'Invoice Settings',
      sub: 'Shop name, logo, GSTIN, address and phone shown on every invoice.',
      btn: 'Open Invoice Settings',
      action: function(){ openInvoiceSettings(); }
    },
    {
      icon: '🚚', title: 'Home / Delivery Settings',
      sub: 'Free-delivery minimum, delivery charge, and support phone/email.',
      btn: 'Open Delivery Settings',
      action: function(){ openDeliverySettings(); }
    },
    {
      icon: '💳', title: 'Payment QR / UPI',
      sub: 'Set the UPI ID and QR code dealers pay to (or upload your own bank QR), bank details, and the Pay now / Pay later options.',
      btn: 'Open payment settings',
      action: function(){ openInvoiceSettings(); }
    },
    (CLOUD && CLOUD.enabled && (!CLOUD.staffRole || CLOUD.staffRole === 'owner')) ? {
      icon: '🗄', title: 'Data Manager (database browser)',
      sub: 'Look at everything stored in the database in plain words — orders, dealers, products, distributors … — fix a value, add or delete records, back up and restore. Owner only.',
      btn: 'Open Data Manager',
      action: function(){ goToAdminTab('data'); }
    } : null,
    (CLOUD && CLOUD.enabled && (!CLOUD.staffRole || CLOUD.staffRole === 'owner')) ? {
      icon: '☢', title: 'Delete data / Factory reset',
      sub: 'Wipe orders, dealers, the catalogue, distributors … or everything, and start fresh. You choose what goes and can download a backup first.',
      btn: 'Open Factory reset',
      action: function(){ window.__acDataOpen = 'reset'; goToAdminTab('data'); }
    } : null,
    {
      icon: '💾', title: 'Full Backup',
      sub: 'Download a full backup of orders, dealers, catalog and settings.',
      btn: 'Download Full Backup',
      action: function(){ exportFullBackup(); }
    }
  ];
  cards = cards.filter(Boolean);
  adminMain.innerHTML =
    '<div class="admin-toolbar"><h2>⚙️ Configuration</h2><span class="ac-sub">Quick access to admin settings</span></div>' +
    '<div class="cfg-grid">' +
      cards.map(function(c, i){
        return '<div class="admin-card cfg-card">' +
          '<div class="ac-title">' + c.icon + ' ' + esc(c.title) + '</div>' +
          '<div class="ac-sub" style="margin-top:6px;">' + esc(c.sub) + '</div>' +
          '<div class="ac-actions"><button type="button" class="btn-admin sm" data-cfg-idx="' + i + '">' + esc(c.btn) + ' →</button></div>' +
        '</div>';
      }).join('') +
    '</div>';
  adminMain.querySelectorAll('[data-cfg-idx]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = Number(btn.getAttribute('data-cfg-idx'));
      cards[idx].action();
    });
  });
}

/* ================= Pricing Overview (Configuration → Pricing Overview) =================
   A single audit screen that answers the two questions admin keeps struggling to answer
   from the Products & Pricing tab alone:
     1) "For THIS product, what does a dealer actually pay, and who has a special rate?"
     2) "For THIS dealer, what is their full resolved price list, right now?"
   Nothing here is editable — it's a read-only mirror of the same resolvePricing() logic
   every other screen uses, so it can never show a number that disagrees with what the
   dealer sees at checkout. Fixing a wrong price still happens on the Products & Pricing
   tab or a product's Dealer Pricing panel; this just makes it obvious that something
   needs fixing in the first place. */
/* Duplicate detection — read-only, computed fresh from PRODUCTS each time it's called, never
   alters anything. Two kinds of collision are worth telling admin about:
     - same item code (part) used on more than one product/catalog variant — almost always
       either a copy-paste mistake or two rows that should have been merged into one item.
     - same product name repeated exactly — usually means the same item got added twice
       (e.g. once as a regular product, once again as a catalog card) rather than being one
       listing with correct stock/pricing.
   Blank codes/names are never compared (too many legitimately blank part codes exist). */
function findDuplicatePartCodes(){
  var counts = {};
  PRODUCTS.forEach(function(p){
    var key = String(p.part||'').trim().toLowerCase();
    if(key) counts[key] = (counts[key]||0) + 1;
  });
  var dupes = {};
  Object.keys(counts).forEach(function(k){ if(counts[k] > 1) dupes[k] = true; });
  return dupes;
}
function findDuplicateProductNames(){
  var counts = {};
  PRODUCTS.forEach(function(p){
    var key = String(p.name||'').trim().toLowerCase();
    if(key) counts[key] = (counts[key]||0) + 1;
  });
  var dupes = {};
  Object.keys(counts).forEach(function(k){ if(counts[k] > 1) dupes[k] = true; });
  return dupes;
}
function isDuplicateProduct(p, dupMaps){
  if(!dupMaps) return false;
  var partKey = String(p.part||'').trim().toLowerCase();
  var nameKey = String(p.name||'').trim().toLowerCase();
  return !!((partKey && dupMaps.parts[partKey]) || (nameKey && dupMaps.names[nameKey]));
}
function pricingIssuesFor(p, dupMaps){
  var issues = [];
  if(!p.mrp || Number(p.mrp) <= 0) issues.push('No MRP set');
  if(p.gstPct === undefined || p.gstPct === null || p.gstPct === '') issues.push('No GST %');
  if(!Number(p.discountPct) && !overrideCountFor(p.id)) issues.push('No discount configured');
  if(standardPrice(p) <= 0) issues.push('Price works out to ₹0');
  if(dupMaps){
    var partKey = String(p.part||'').trim().toLowerCase();
    var nameKey = String(p.name||'').trim().toLowerCase();
    if(partKey && dupMaps.parts[partKey]) issues.push('Duplicate item code ('+p.part+') — used on another product too');
    if(nameKey && dupMaps.names[nameKey]) issues.push('Duplicate product name — another listing has the exact same name');
  }
  return issues;
}
function renderPricingOverview(){
  var adminMain = document.getElementById('adminMain');
  var users = getUsers();
  var gstList = Object.keys(users);
  // NOTE: catalog-card variants use `active` to mean something completely different from
  // regular products — it's only ever `true` for ones migrated from the old flat catalog
  // (see syncSpecVariantProducts), NOT a real "disabled" flag. A brand-new custom card added
  // straight in the Catalog builder always has active:false, so filtering on `active !== false`
  // silently dropped every non-migrated catalog card from this screen. Catalog variants are
  // always included here regardless of that flag; only genuinely-disabled regular products
  // (active === false) are excluded.
  var allProducts = PRODUCTS.filter(function(p){ return p.isCatalogVariant || p.active !== false; });
  var totalOverrides = 0;
  allProducts.forEach(function(p){ totalOverrides += overrideCountFor(p.id); });
  var dupMaps = { parts: findDuplicatePartCodes(), names: findDuplicateProductNames() };
  var issueCount = allProducts.filter(function(p){ return pricingIssuesFor(p, dupMaps).length > 0; }).length;
  var dupCount = allProducts.filter(function(p){ return isDuplicateProduct(p, dupMaps); }).length;

  var header = '<div class="admin-toolbar"><h2>📊 Pricing Overview</h2>' +
    '<button class="btn-admin outline" id="pvBack">← Back to Configuration</button></div>' +
    '<div class="ac-sub" style="margin:-6px 0 12px;">A live, read-only mirror of what dealers actually see — MRP, discount, GST and the final price, product by product or dealer by dealer.</div>';

  var statRow = '<div class="stat-grid">' +
    '<div class="stat-card"><div class="sc-val">'+allProducts.length+'</div><div class="sc-lbl">Products & catalog cards</div></div>' +
    '<div class="stat-card"><div class="sc-val">'+totalOverrides+'</div><div class="sc-lbl">Dealer-specific rates set</div></div>' +
    '<div class="stat-card"><div class="sc-val">'+gstList.length+'</div><div class="sc-lbl">Dealers</div></div>' +
    '<div class="stat-card'+(dupCount?' warn-card':'')+'"><div class="sc-val">'+dupCount+'</div><div class="sc-lbl">Possible duplicates</div></div>' +
    '<div class="stat-card'+(issueCount?' warn-card':'')+'"><div class="sc-val">'+issueCount+'</div><div class="sc-lbl">Products needing review</div></div>' +
  '</div>';

  var modeToggle = '<div class="filter-row mt-3">' +
    '<button type="button" class="filter-chip'+(PRICING_OVERVIEW_MODE==='products'?' active':'')+'" data-pvmode="products">📦 By product</button>' +
    '<button type="button" class="filter-chip'+(PRICING_OVERVIEW_MODE==='dealer'?' active':'')+'" data-pvmode="dealer">🧑‍💼 By dealer</button>' +
  '</div>';

  var body = PRICING_OVERVIEW_MODE === 'dealer' ? pricingOverviewDealerHtml(gstList, users) : pricingOverviewProductsHtml(allProducts, dupMaps);

  adminMain.innerHTML = header + statRow + modeToggle + body;

  document.getElementById('pvBack').addEventListener('click', function(){ PRICING_OVERVIEW_VIEW = false; renderAdminConfiguration(); });
  adminMain.querySelectorAll('[data-pvmode]').forEach(function(btn){
    btn.addEventListener('click', function(){ PRICING_OVERVIEW_MODE = btn.getAttribute('data-pvmode'); renderPricingOverview(); });
  });

  if(PRICING_OVERVIEW_MODE === 'dealer'){
    wirePricingOverviewDealerMode(gstList, users);
  } else {
    wirePricingOverviewProductsMode();
  }
}
function pricingOverviewProductsHtml(allProducts, dupMaps){
  var q = (PRICING_OVERVIEW_Q||'').trim().toLowerCase();
  var rows = allProducts.filter(function(p){
    if(PRICING_OVERVIEW_ISSUES_ONLY && pricingIssuesFor(p, dupMaps).length === 0) return false;
    if(PRICING_OVERVIEW_DUPLICATES_ONLY && !isDuplicateProduct(p, dupMaps)) return false;
    if(!q) return true;
    return (p.name+' '+p.part+' '+p.cat).toLowerCase().indexOf(q) !== -1;
  }).sort(function(a,b){ return a.name.localeCompare(b.name); });

  var toolbar = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin:12px 0;">' +
    '<input type="text" id="pvSearch" placeholder="🔍 Search product name, code or category…" value="'+esc(PRICING_OVERVIEW_Q||'')+'" style="flex:2; min-width:200px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
    '<button type="button" class="filter-chip'+(PRICING_OVERVIEW_ISSUES_ONLY?' active':'')+'" id="pvIssuesOnly">⚠ Issues only</button>' +
    '<button type="button" class="filter-chip'+(PRICING_OVERVIEW_DUPLICATES_ONLY?' active':'')+'" id="pvDuplicatesOnly">🔁 Duplicates only</button>' +
  '</div>';

  var table = '<div class="cc-table-wrap"><table class="dealer-table">' +
    '<thead><tr><th>Product</th><th>MRP (₹)</th><th>Discount %</th><th>GST %</th><th>Dealer price (standard)</th><th>Special rates</th><th></th><th></th></tr></thead><tbody>' +
    (rows.length === 0
      ? '<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--ink-600);">'+(PRICING_OVERVIEW_DUPLICATES_ONLY ? 'No duplicate item codes or names found' : 'No products match')+'</td></tr>'
      : rows.map(function(p){
        var issues = pricingIssuesFor(p, dupMaps);
        var isDup = isDuplicateProduct(p, dupMaps);
        var overrideN = overrideCountFor(p.id);
        var price = standardPrice(p);
        return '<tr data-pv-pid="'+p.id+'"'+(issues.length ? ' style="background:#fff8f0;"' : '')+'>' +
          '<td><b>'+esc(p.name)+'</b>'+(isDup ? ' <span class="tier-badge" style="background:var(--maroon-600); color:#fff;">🔁 duplicate</span>' : '')+'<div class="ac-sub">'+esc(p.size||'')+' · '+esc(p.part||'')+'</div></td>' +
          '<td><input type="number" class="pv-edit-mrp" value="'+p.mrp+'" style="width:90px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12.5px;"></td>' +
          '<td><input type="number" class="pv-edit-disc" value="'+(Number(p.discountPct)||0)+'" style="width:70px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12.5px;"></td>' +
          '<td><input type="number" class="pv-edit-gst" value="'+(p.gstPct!==undefined?p.gstPct:0)+'" style="width:60px; border:1.3px solid #ddd3ba; border-radius:6px; padding:5px 7px; font-size:12.5px;"></td>' +
          '<td><b class="pv-price-preview">'+money(price)+'</b></td>' +
          '<td>'+(overrideN ? '<span class="tier-badge">'+overrideN+' dealer'+(overrideN>1?'s':'')+'</span>' : '<span class="ac-sub">—</span>')+'</td>' +
          '<td>'+(issues.length ? '<span title="'+esc(issues.join('; '))+'" style="color:var(--maroon-600); font-weight:700; cursor:help;">⚠ '+issues.length+'</span>' : '<span style="color:#1f7a3d;">✓</span>')+'</td>' +
          '<td><button type="button" class="btn-admin sm pv-save-btn">💾 Save</button></td>' +
        '</tr>';
      }).join('')) +
    '</tbody></table></div>' +
    '<div class="ac-sub mt-2">Edit MRP, Discount % or GST % directly here and click Save — it writes to the same product record used everywhere else in the app (Products &amp; Pricing, the catalog, orders), so there is only ever one place these numbers actually live. Dealer-specific special rates are still set from the <b>By dealer</b> view or a product\'s Dealer Pricing panel.</div>';

  return toolbar + table;
}
function wirePricingOverviewProductsMode(){
  var search = document.getElementById('pvSearch');
  if(search){
    search.addEventListener('input', function(){
      PRICING_OVERVIEW_Q = search.value;
      var cursorPos = search.selectionStart;
      renderPricingOverview();
      var again = document.getElementById('pvSearch');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  var issuesBtn = document.getElementById('pvIssuesOnly');
  if(issuesBtn) issuesBtn.addEventListener('click', function(){ PRICING_OVERVIEW_ISSUES_ONLY = !PRICING_OVERVIEW_ISSUES_ONLY; renderPricingOverview(); });
  var dupBtn = document.getElementById('pvDuplicatesOnly');
  if(dupBtn) dupBtn.addEventListener('click', function(){ PRICING_OVERVIEW_DUPLICATES_ONLY = !PRICING_OVERVIEW_DUPLICATES_ONLY; renderPricingOverview(); });
  document.querySelectorAll('#adminMain tr[data-pv-pid]').forEach(function(row){
    var pid = Number(row.getAttribute('data-pv-pid'));
    var previewEl = row.querySelector('.pv-price-preview');
    function refreshRowPreview(){
      var draft = {
        mrp: Number(row.querySelector('.pv-edit-mrp').value) || 0,
        discountPct: Number(row.querySelector('.pv-edit-disc').value) || 0,
        gstPct: Number(row.querySelector('.pv-edit-gst').value) || 0
      };
      previewEl.textContent = money(standardPrice(draft));
    }
    ['.pv-edit-mrp','.pv-edit-disc','.pv-edit-gst'].forEach(function(sel){
      var input = row.querySelector(sel);
      if(input) input.addEventListener('input', refreshRowPreview);
    });
    var saveBtn = row.querySelector('.pv-save-btn');
    if(saveBtn) saveBtn.addEventListener('click', function(){
      var mrp = Number(row.querySelector('.pv-edit-mrp').value);
      var discountPct = Number(row.querySelector('.pv-edit-disc').value);
      var gstPct = Number(row.querySelector('.pv-edit-gst').value);
      if(isNaN(mrp) || mrp < 0){ showToast('Enter a valid MRP'); return; }
      if(isNaN(discountPct) || discountPct < 0 || discountPct > 95){ showToast('Discount % must be 0–95'); return; }
      if(isNaN(gstPct) || gstPct < 0){ showToast('Enter a valid GST %'); return; }
      savePricingOverviewProductEdit(pid, mrp, discountPct, gstPct);
    });
  });
}
function pricingOverviewDealerHtml(gstList, users){
  var q = (PRICING_OVERVIEW_DEALER_Q||'').trim().toLowerCase();
  var matches = gstList.filter(function(gst){
    if(!q) return true;
    var u = users[gst] || {};
    return (gst+' '+(u.business||'')).toLowerCase().indexOf(q) !== -1;
  }).sort(function(a,b){ return (users[a].business||a).localeCompare(users[b].business||b); });

  var picker = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin:12px 0;">' +
    '<input type="text" id="pvDealerSearch" placeholder="🔍 Search dealer by business name or GST…" value="'+esc(PRICING_OVERVIEW_DEALER_Q||'')+'" style="flex:2; min-width:200px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
    '<select id="pvDealerSelect" style="flex:1; min-width:200px; border:1.3px solid #ddd3ba; border-radius:8px; padding:9px 12px; font-size:13px;">' +
      '<option value="">Select a dealer…</option>' +
      matches.map(function(gst){ var u = users[gst]||{}; return '<option value="'+esc(gst)+'"'+(PRICING_OVERVIEW_GST===gst?' selected':'')+'>'+esc(u.business||gst)+' · '+esc(gst)+'</option>'; }).join('') +
    '</select>' +
  '</div>';

  if(!PRICING_OVERVIEW_GST || !users[PRICING_OVERVIEW_GST]){
    return picker + '<div class="empty-note"><div class="en-big">Pick a dealer</div><div>Their full resolved price list — MRP, your rate and the final price for every product — will show up here.</div></div>';
  }
  var gst = PRICING_OVERVIEW_GST, u = users[gst];
  var standingPct = dealerStandingPct(gst);
  // Built directly from PRODUCTS (not resolvedPriceListRows) so each row can carry whether
  // THIS dealer specifically has a configured special rate on it — resolvedPriceListRows
  // only returns the resolved number, which looks identical whether that number came from a
  // per-dealer override or just the standard price, so "which products are configured for
  // this dealer" was impossible to tell at a glance.
  var allProducts = PRODUCTS.filter(function(p){ return p.isCatalogVariant || p.active !== false; });
  var rowData = allProducts.map(function(p){
    return { p: p, pricing: resolvePricing(p, gst, 1), hasOverride: !!dealerOverride(gst, p.id) };
  });
  var overrideRows = rowData.filter(function(r){ return r.hasOverride; });
  var overrideN = overrideRows.length;
  var onlyConfigured = PRICING_OVERVIEW_DEALER_CONFIGURED_ONLY;
  var visibleRows = onlyConfigured ? overrideRows : rowData;
  // Configured (special-rate) rows always float to the top so they're the first thing seen,
  // whichever view is showing.
  visibleRows = visibleRows.slice().sort(function(a,b){
    if(a.hasOverride !== b.hasOverride) return a.hasOverride ? -1 : 1;
    return String(a.p.name).localeCompare(String(b.p.name));
  });

  var summary = '<div class="admin-card mt-2">' +
    '<div class="ac-title">'+esc(u.business||gst)+'</div>' +
    '<div class="ac-sub">'+esc(gst)+' · standing discount '+standingPct+'% · <b>'+overrideN+' product'+(overrideN!==1?'s':'')+' with a special rate configured for this dealer</b></div>' +
    '<div class="ac-actions">' +
      '<button class="btn-admin sm'+(onlyConfigured?'':' outline')+'" id="pvToggleConfiguredOnly">'+(onlyConfigured ? '✓ Showing only configured items' : '☆ Show only configured items')+'</button>' +
      '<button class="btn-admin sm outline" id="pvExportDealer">⬇ Export this dealer\'s price list</button>' +
    '</div>' +
  '</div>';

  var table = '<div class="cc-table-wrap mt-2"><table class="dealer-table">' +
    '<thead><tr><th>Product</th><th>Configured?</th><th>MRP</th><th>Your rate</th><th>Final price (incl. GST)</th><th>Stock</th><th></th></tr></thead><tbody>' +
    (visibleRows.length === 0
      ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--ink-600);">'+(onlyConfigured ? 'No special rates configured for this dealer yet' : 'No products match')+'</td></tr>'
      : visibleRows.map(function(r){
        var p = r.p, pricing = r.pricing;
        var rateTxt = pricing.overrideIsNet ? '<span class="tier-badge">Net price</span>' : (Math.round(pricing.totalPct||0)+'%');
        var stockTxt = (p.stock === undefined || p.stock === null) ? 'Unlimited' : (effStock(p) > 0 ? effStock(p) : 'Out of stock');
        var isEditing = PRICING_OVERVIEW_DEALER_EDIT_PID === p.id;
        var row = '<tr data-pv-dpid="'+p.id+'"'+(r.hasOverride ? ' style="background:#fff8ec;"' : '')+'>' +
          '<td><b>'+esc(p.name)+'</b><div class="ac-sub">'+esc(p.size||'')+' · '+esc(p.part||'')+'</div></td>' +
          '<td>'+(r.hasOverride ? '<span class="tier-badge" style="background:var(--gold-500); color:var(--navy-950);">★ Special rate</span>' : '<span class="ac-sub">—</span>')+'</td>' +
          '<td>'+money(p.mrp)+'</td>' +
          '<td>'+rateTxt+'</td>' +
          '<td><b>'+money(pricing.finalPriceWithGst)+'</b></td>' +
          '<td>'+(stockTxt==='Out of stock' ? '<span style="color:var(--maroon-600);">Out of stock</span>' : stockTxt)+'</td>' +
          '<td style="white-space:nowrap;">' +
            '<button type="button" class="btn-admin sm outline pv-dp-edit-btn">'+(r.hasOverride ? 'Edit' : '+ Set rate')+'</button>' +
            (r.hasOverride ? ' <button type="button" class="btn-admin sm maroon pv-dp-remove-btn">Remove</button>' : '') +
          '</td>' +
        '</tr>';
        // Inline CRUD form for this one dealer/product pair — same underlying override object
        // (type: discount|net, value) and the same dealerRateToOverride()/setDealerOverride()
        // path the full per-product Dealer Pricing panel uses, just scoped to one row so admin
        // doesn't have to leave this screen to fix a single dealer's rate.
        if(isEditing){
          var existingOv = dealerOverride(gst, p.id);
          var isNet = existingOv && existingOv.type === 'net';
          row += '<tr class="pv-dp-editrow" data-pv-dpid-edit="'+p.id+'"><td colspan="7" style="background:var(--ivory-100);">' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; padding:8px 4px;">' +
              '<div><label style="display:block; font-size:10px; text-transform:uppercase; color:var(--ink-600); margin-bottom:2px;">Rate type</label>' +
                '<select class="pv-dp-type" style="border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12.5px;">' +
                  '<option value="discount"'+(!isNet?' selected':'')+'>% off MRP</option>' +
                  '<option value="net"'+(isNet?' selected':'')+'>Net price (₹)</option>' +
                '</select></div>' +
              '<div><label style="display:block; font-size:10px; text-transform:uppercase; color:var(--ink-600); margin-bottom:2px;" class="pv-dp-rate-label">'+(isNet?'Net price (₹)':'% off (0–95)')+'</label>' +
                '<input type="number" class="pv-dp-rate" min="0" step="0.01" value="'+(existingOv ? Number(existingOv.value) : '')+'" style="width:120px; border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12.5px;"></div>' +
              '<div><label style="display:block; font-size:10px; text-transform:uppercase; color:var(--ink-600); margin-bottom:2px;">Pricing basis</label>' +
                '<select class="pv-dp-basis" style="border:1.3px solid #ddd3ba; border-radius:6px; padding:6px 9px; font-size:12.5px;"'+(!isNet?' disabled':'')+'>' +
                  '<option value="excl">Before GST</option>' +
                  '<option value="incl">Already incl. GST</option>' +
                '</select></div>' +
              '<button type="button" class="btn-admin sm pv-dp-save-btn">💾 Save rate</button>' +
              '<button type="button" class="btn-admin sm outline pv-dp-cancel-btn">Cancel</button>' +
            '</div>' +
            '<div class="ac-sub pv-dp-preview" style="padding:0 4px 8px;">Enter a rate to preview the dealer price.</div>' +
          '</td></tr>';
        }
        return row;
      }).join('')) +
    '</tbody></table></div>';

  return picker + summary + table;
}
function wirePricingOverviewDealerMode(gstList, users){
  var search = document.getElementById('pvDealerSearch');
  if(search){
    search.addEventListener('input', function(){
      PRICING_OVERVIEW_DEALER_Q = search.value;
      var cursorPos = search.selectionStart;
      renderPricingOverview();
      var again = document.getElementById('pvDealerSearch');
      if(again){ again.focus(); again.setSelectionRange(cursorPos, cursorPos); }
    });
  }
  var select = document.getElementById('pvDealerSelect');
  if(select) select.addEventListener('change', function(){ PRICING_OVERVIEW_GST = select.value; PRICING_OVERVIEW_DEALER_CONFIGURED_ONLY = false; renderPricingOverview(); });
  var exportBtn = document.getElementById('pvExportDealer');
  if(exportBtn) exportBtn.addEventListener('click', function(){ exportDealerPriceList(PRICING_OVERVIEW_GST); });
  var toggleBtn = document.getElementById('pvToggleConfiguredOnly');
  if(toggleBtn) toggleBtn.addEventListener('click', function(){ PRICING_OVERVIEW_DEALER_CONFIGURED_ONLY = !PRICING_OVERVIEW_DEALER_CONFIGURED_ONLY; renderPricingOverview(); });

  var gst = PRICING_OVERVIEW_GST;
  document.querySelectorAll('#adminMain tr[data-pv-dpid]').forEach(function(row){
    var pid = Number(row.getAttribute('data-pv-dpid'));
    var editBtn = row.querySelector('.pv-dp-edit-btn');
    if(editBtn) editBtn.addEventListener('click', function(){ PRICING_OVERVIEW_DEALER_EDIT_PID = pid; renderPricingOverview(); });
    var removeBtn = row.querySelector('.pv-dp-remove-btn');
    if(removeBtn) removeBtn.addEventListener('click', function(){
      var p = PRODUCTS.find(function(pp){ return pp.id === pid; });
      removeDealerOverride(gst, pid);
      logAudit('Price override removed (Pricing Overview)', (users[gst].business||gst)+' — '+(p?p.name:pid));
      showToast('Special rate removed');
      if(PRICING_OVERVIEW_DEALER_EDIT_PID === pid) PRICING_OVERVIEW_DEALER_EDIT_PID = null;
      renderPricingOverview();
    });
  });
  document.querySelectorAll('#adminMain tr.pv-dp-editrow[data-pv-dpid-edit]').forEach(function(editRow){
    var pid = Number(editRow.getAttribute('data-pv-dpid-edit'));
    var p = PRODUCTS.find(function(pp){ return pp.id === pid; });
    if(!p) return;
    var typeSel = editRow.querySelector('.pv-dp-type');
    var basisSel = editRow.querySelector('.pv-dp-basis');
    var rateInput = editRow.querySelector('.pv-dp-rate');
    var rateLabel = editRow.querySelector('.pv-dp-rate-label');
    var previewEl = editRow.querySelector('.pv-dp-preview');
    function refreshPreview(){
      var isNet = typeSel.value === 'net';
      rateLabel.textContent = isNet ? 'Net price (₹)' : '% off (0–95)';
      basisSel.disabled = !isNet;
      var rate = Number(rateInput.value);
      if(rateInput.value === '' || isNaN(rate) || (isNet && rate <= 0) || (!isNet && (rate < 0 || rate > 95))){
        previewEl.textContent = 'Enter a valid rate to preview the dealer price.';
        return;
      }
      var ov = dealerRateToOverride(p, typeSel.value, basisSel.value, rate);
      var r = dealerOverridePrice(p, ov);
      previewEl.innerHTML = '<b>Dealer pays '+money(r.final)+' incl. GST</b> (MRP '+money(p.mrp)+')';
    }
    typeSel.addEventListener('change', refreshPreview);
    basisSel.addEventListener('change', refreshPreview);
    rateInput.addEventListener('input', refreshPreview);
    refreshPreview();
    var cancelBtn = editRow.querySelector('.pv-dp-cancel-btn');
    if(cancelBtn) cancelBtn.addEventListener('click', function(){ PRICING_OVERVIEW_DEALER_EDIT_PID = null; renderPricingOverview(); });
    var saveBtn = editRow.querySelector('.pv-dp-save-btn');
    if(saveBtn) saveBtn.addEventListener('click', function(){
      var rate = Number(rateInput.value);
      var isNet = typeSel.value === 'net';
      if(rateInput.value === '' || isNaN(rate)){ showToast('Enter a valid rate'); return; }
      if(isNet && rate <= 0){ showToast('Net price must be greater than 0'); return; }
      if(!isNet && (rate < 0 || rate > 95)){ showToast('Discount % must be 0–95'); return; }
      var ov = dealerRateToOverride(p, typeSel.value, basisSel.value, rate);
      var replaced = !!dealerOverride(gst, pid);
      setDealerOverride(gst, pid, { type: ov.type, value: ov.value });
      logAudit('Price override set (Pricing Overview)', (users[gst].business||gst)+' — '+p.name+': '+(ov.type==='net' ? ('net ₹'+ov.value) : (ov.value+'% off')));
      showToast(replaced ? 'Special rate updated' : 'Special rate set');
      PRICING_OVERVIEW_DEALER_EDIT_PID = null;
      renderPricingOverview();
      if(currentAdminTab === 'customers') renderAdminCustomers();
    });
  });
}

function renderAdminReports(){
  var adminMain = document.getElementById('adminMain');
  var allOrders = getAllOrders();
  var defaultFrom = '';
  var defaultTo = '';
  var f = REPORTS_FILTER;

  var toolbar = '<div class="admin-toolbar"><h2>Reports</h2>' +
    '<button class="btn-admin outline" id="btnExportReport">⬇ Export report</button>' +
  '</div>' +
  '<div class="bulk-upload-row" style="display:flex; gap:8px; flex-wrap:wrap; background:#fff; border-style:solid;">' +
    '<div><label style="font-size:10px; display:block;">From</label><input type="date" id="repFrom" value="'+esc(f.from||'')+'"></div>' +
    '<div><label style="font-size:10px; display:block;">To</label><input type="date" id="repTo" value="'+esc(f.to||'')+'"></div>' +
    '<div><label style="font-size:10px; display:block;">Category</label><select id="repCat">' +
      '<option value=""'+(!f.cat?' selected':'')+'>All</option>' +
      ADMIN_CATEGORY_ORDER.map(function(c){ return '<option value="'+c+'"'+(f.cat===c?' selected':'')+'>'+t(CATEGORY_META[c].labelKey)+'</option>'; }).join('') +
    '</select></div>' +
    '<button class="btn-admin sm mt-3" id="repApply" style="align-self:flex-end;">Apply</button>' +
  '</div>';

  var filtered = allOrders.filter(function(o){
    if(o.status === 'cancelled') return false;
    if(f.from && o.createdAt < new Date(f.from).getTime()) return false;
    if(f.to && o.createdAt > new Date(f.to).getTime() + 86400000) return false;
    return true;
  });
  // apply category filter at item level
  var filteredItems = [];
  filtered.forEach(function(o){
    o.items.forEach(function(it){
      var p = PRODUCTS.find(function(pp){ return pp.id === it.id; });
      var cat = p ? p.cat : null;
      if(f.cat && cat !== f.cat) return;
      filteredItems.push({ order:o, item:it, cat:cat });
    });
  });

  var revenue = filteredItems.reduce(function(s,x){ return s + x.item.price*x.item.qty; }, 0);
  var ordersCount = filtered.length;
  var avgOrder = ordersCount ? revenue/ordersCount : 0;

  var statHtml = '<div class="stat-grid">' +
    '<div class="stat-card"><div class="sc-val">'+moneyCompactHtml(revenue)+'</div><div class="sc-lbl">Revenue (filtered)</div></div>' +
    '<div class="stat-card"><div class="sc-val">'+ordersCount+'</div><div class="sc-lbl">Orders</div></div>' +
    '<div class="stat-card"><div class="sc-val">'+moneyCompactHtml(avgOrder)+'</div><div class="sc-lbl">Avg Order Value</div></div>' +
  '</div>';

  // best sellers
  var byProduct = {};
  filteredItems.forEach(function(x){
    var key = x.item.id;
    if(!byProduct[key]) byProduct[key] = { name:x.item.name, qty:0, revenue:0 };
    byProduct[key].qty += x.item.qty;
    byProduct[key].revenue += x.item.price*x.item.qty;
  });
  var bestSellers = Object.values(byProduct).sort(function(a,b){ return b.qty - a.qty; }).slice(0,10);

  var bestSellersHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Best-selling products</div>' +
    (bestSellers.length === 0 ? '<div class="ac-sub">No sales in this range.</div>' :
      '<div class="scroll-list-sm">'+bestSellers.map(function(b){ return '<div class="oi-line"><span>'+esc(b.name)+' — '+b.qty+' units</span><span title="'+esc(money(b.revenue))+'">'+esc(moneyCompact(b.revenue))+'</span></div>'; }).join('')+'</div>'
    ) + '</div>';

  // revenue by dealer — this can run into hundreds of dealers once volume grows, so it's shown
  // in a capped, scrollable list (full data still goes into the exported Excel file below).
  var byDealer = {};
  filtered.forEach(function(o){
    var key = o.dealerGst;
    if(!byDealer[key]) byDealer[key] = { business:o.dealerBusiness||key, orders:0, revenue:0 };
    byDealer[key].orders += 1;
    byDealer[key].revenue += orderPayable(o);
  });
  var dealerRows = Object.keys(byDealer).map(function(k){ return Object.assign({gst:k}, byDealer[k]); })
    .sort(function(a,b){ return b.revenue - a.revenue; });
  var DEALER_ROWS_SHOWN = 30;

  var dealerHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Revenue by dealer' +
    (dealerRows.length > DEALER_ROWS_SHOWN ? ' <span style="font-weight:400; font-size:11px; color:var(--ink-600);">(top '+DEALER_ROWS_SHOWN+' of '+dealerRows.length+' — full list in export)</span>' : '') +
    '</div>' +
    (dealerRows.length === 0 ? '<div class="ac-sub">No sales in this range.</div>' :
      '<div class="scroll-list-md">'+dealerRows.slice(0, DEALER_ROWS_SHOWN).map(function(d){ return '<div class="oi-line"><span>'+esc(d.business)+' ('+d.orders+' orders)</span><span title="'+esc(money(d.revenue))+'">'+esc(moneyCompact(d.revenue))+'</span></div>'; }).join('')+'</div>'
    ) + '</div>';

  // ---- Revenue by category (additive) ----
  var byCategory = {};
  filteredItems.forEach(function(x){
    var key = x.cat || 'uncategorized';
    if(!byCategory[key]) byCategory[key] = { qty:0, revenue:0 };
    byCategory[key].qty += x.item.qty;
    byCategory[key].revenue += x.item.price*x.item.qty;
  });
  var categoryRows = Object.keys(byCategory).map(function(k){
    var label = (CATEGORY_META[k] && CATEGORY_META[k].labelKey) ? t(CATEGORY_META[k].labelKey) : 'Uncategorized';
    return { key:k, label:label, qty:byCategory[k].qty, revenue:byCategory[k].revenue };
  }).sort(function(a,b){ return b.revenue - a.revenue; });
  var CHART_PALETTE = ['#7c2333','#c9a24d','#1b7a3d','#3b6ea5','#a5673b','#6b4c9a','#c0567a','#4a9a8f','#9a8b4c','#5c5346'];
  var categoryPieHtml = '<div class="admin-card report-chart-card"><div class="ac-title" style="margin-bottom:8px;">🥧 Revenue by Category</div>' +
    (categoryRows.length === 0 ? '<div class="ac-sub">No sales in this range.</div>' :
      svgDonutChart(categoryRows.slice(0,10).map(function(c,i){ return { label:c.label, value:Math.round(c.revenue), color:CHART_PALETTE[i%CHART_PALETTE.length] }; }), { centerLabel: moneyCompact(revenue), centerSub:'total' })
    ) + '</div>';
  var categoryHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Revenue by Category — detail</div>' +
    (categoryRows.length === 0 ? '<div class="ac-sub">No sales in this range.</div>' :
      '<div class="scroll-list-sm">'+categoryRows.map(function(c){ return '<div class="oi-line"><span>'+esc(c.label)+' — '+c.qty+' units</span><span title="'+esc(money(c.revenue))+'">'+esc(moneyCompact(c.revenue))+'</span></div>'; }).join('')+'</div>'
    ) + '</div>';

  // ---- Order status breakdown for the same date/category window, including cancelled (additive) ----
  var statusAllOrders = getAllOrders().filter(function(o){
    if(f.from && o.createdAt < new Date(f.from).getTime()) return false;
    if(f.to && o.createdAt > new Date(f.to).getTime() + 86400000) return false;
    if(f.cat){
      var hasCat = o.items.some(function(it){
        var p = PRODUCTS.find(function(pp){ return pp.id === it.id; });
        return p && p.cat === f.cat;
      });
      if(!hasCat) return false;
    }
    return true;
  });
  var statusBreakdown = { placed:0, confirmed:0, dispatched:0, delivered:0, cancelled:0 };
  statusAllOrders.forEach(function(o){ if(statusBreakdown[o.status] !== undefined) statusBreakdown[o.status]++; });
  var statusLabelsRep = { placed:'Placed', confirmed:'Confirmed', dispatched:'Dispatched', delivered:'Delivered', cancelled:'Cancelled' };
  var STATUS_COLORS_REP = { placed:'#c9a24d', confirmed:'#3b6ea5', dispatched:'#a5673b', delivered:'#1b7a3d', cancelled:'#7c2333' };
  var statusPieHtml = '<div class="admin-card report-chart-card"><div class="ac-title" style="margin-bottom:8px;">🥧 Order Status Breakdown</div>' +
    svgDonutChart(Object.keys(statusLabelsRep).map(function(k){ return { label:statusLabelsRep[k], value:statusBreakdown[k], color:STATUS_COLORS_REP[k] }; }), { centerLabel: statusAllOrders.length, centerSub:'orders' }) +
  '</div>';
  var statusBreakdownHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Order Status Breakdown — detail (filtered)</div>' +
    Object.keys(statusLabelsRep).map(function(k){ return '<div class="oi-line"><span>'+statusLabelsRep[k]+'</span><span>'+statusBreakdown[k]+'</span></div>'; }).join('') +
  '</div>';
  var chartsRowHtml = '<div class="report-chart-row mt-3">'+statusPieHtml+categoryPieHtml+'</div>';

  // ---- Period-over-period comparison (additive) ----
  var periodFromMs, periodToMs;
  if(f.from && f.to){
    periodFromMs = new Date(f.from).getTime();
    periodToMs = new Date(f.to).getTime() + 86400000;
  } else {
    periodToMs = Date.now();
    periodFromMs = periodToMs - 30*86400000;
  }
  var periodLen = periodToMs - periodFromMs;
  var prevFromMs = periodFromMs - periodLen;
  var prevToMs = periodFromMs;
  var prevOrders = getAllOrders().filter(function(o){
    if(o.status === 'cancelled') return false;
    return o.createdAt >= prevFromMs && o.createdAt < prevToMs;
  });
  var prevRevenue = prevOrders.reduce(function(s,o){ return s + orderPayable(o); }, 0);
  var pctChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue)/prevRevenue)*1000)/10 : (revenue > 0 ? 100 : 0);
  var comparisonHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Compared to Previous Period</div>' +
    '<div class="ac-sub mb-2">'+(f.from && f.to ? 'Same length window immediately before the selected range.' : 'Last 30 days vs. the 30 days before that (no date range selected).')+'</div>' +
    '<div class="oi-line"><span>Previous period revenue</span><span>'+money(prevRevenue)+'</span></div>' +
    '<div class="oi-line"><span>Previous period orders</span><span>'+prevOrders.length+'</span></div>' +
    '<div class="oi-line"><span>Change in revenue</span><span'+(pctChange<0?' style="color:var(--maroon-600); font-weight:700;"':' style="color:#1b7a3d; font-weight:700;"')+'>'+(pctChange>=0?'+':'')+pctChange+'%</span></div>' +
  '</div>';

  // low-stock / out-of-stock alert list
  var lowStockProducts = PRODUCTS.filter(function(p){ return p.active !== false && Number(p.stock) <= LOW_STOCK_THRESHOLD; })
    .sort(function(a,b){ return (Number(a.stock)||0) - (Number(b.stock)||0); });
  var lowStockHtml = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">⚠ Low / Out-of-stock Alerts</div>' +
    (lowStockProducts.length === 0 ? '<div class="ac-sub">All products are comfortably stocked.</div>' :
      '<div class="scroll-list-sm">'+lowStockProducts.map(function(p){
        var st = Number(p.stock)||0;
        return '<div class="oi-line"><span>'+esc(p.name)+' ('+esc(p.part)+')</span><span'+(st<=0?' style="color:var(--maroon-600); font-weight:700;"':'')+'>'+(st<=0?'Out of stock':st+' left')+'</span></div>';
      }).join('')+'</div>'
    ) + '</div>';

  adminMain.innerHTML = toolbar + statHtml + chartsRowHtml + comparisonHtml + categoryHtml + statusBreakdownHtml + lowStockHtml + bestSellersHtml + dealerHtml;

  document.getElementById('repApply').addEventListener('click', function(){
    REPORTS_FILTER = {
      from: document.getElementById('repFrom').value,
      to: document.getElementById('repTo').value,
      cat: document.getElementById('repCat').value
    };
    renderAdminReports();
  });
  document.getElementById('btnExportReport').addEventListener('click', function(){
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bestSellers.map(function(b){ return { 'Product':b.name, 'Units Sold':b.qty, 'Revenue (₹)':b.revenue }; })), 'Best Sellers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dealerRows.map(function(d){ return { 'Dealer':d.business, 'GST':d.gst, 'Orders':d.orders, 'Revenue (₹)':d.revenue }; })), 'Revenue by Dealer');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryRows.map(function(c){ return { 'Category':c.label, 'Units Sold':c.qty, 'Revenue (₹)':c.revenue }; })), 'By Category');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.keys(statusBreakdown).map(function(k){ return { 'Status':k, 'Orders':statusBreakdown[k] }; })), 'By Status');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered.map(orderExportRow)), 'Orders');
    XLSX.writeFile(wb, 'AshirvadConnect_Report_'+(new Date().toISOString().slice(0,10))+'.xlsx');
  });
}

/* ---------------- Broadcast tab ---------------- */
function renderAdminBroadcast(){
  var adminMain = marketingContainer();
  var toolbar = '<div class="admin-toolbar"><h2>Broadcast to Dealers</h2></div>';
  var form = '<div class="admin-card">' +
    '<div class="admin-form-grid">' +
      '<div class="full"><label>Message</label><textarea id="bcEn" rows="2" placeholder="e.g. We will be closed on Oct 2 for Gandhi Jayanti."></textarea></div>' +
    '</div>' +
    '<button class="btn-admin mt-2" id="sendBroadcastBtn">📢 Send broadcast</button>' +
  '</div>';
  var history = '<div class="admin-card mt-3"><div class="ac-title" style="margin-bottom:8px;">Sent broadcasts</div>' +
    (BROADCASTS.length === 0 ? '<div class="ac-sub">No broadcasts sent yet.</div>' :
      BROADCASTS.slice().reverse().map(function(b){
        return '<div class="oi-line" style="align-items:flex-start;"><span><div style="font-size:10px; color:var(--ink-600);">'+esc(b.date)+'</div>' +
          '<div>'+esc(b.en)+'</div></span>' +
          '<button class="btn-admin sm maroon" data-del-broadcast="'+b.id+'">Delete</button></div>';
      }).join('')
    ) + '</div>';
  adminMain.innerHTML = toolbar + form + history;
  document.getElementById('sendBroadcastBtn').addEventListener('click', function(){
    var en = document.getElementById('bcEn').value.trim();
    if(!en){ showToast('Enter a message'); return; }
    sendBroadcast(en);
    showToast('Broadcast sent to all dealers');
    renderAdminBroadcast();
  });
  adminMain.querySelectorAll('[data-del-broadcast]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = Number(btn.getAttribute('data-del-broadcast'));
      if(!confirm('Delete this broadcast?')) return;
      saveBroadcasts(BROADCASTS.filter(function(b){ return b.id !== id; }));
      renderAdminBroadcast();
    });
  });
}

/* ---------------- Excel export (SheetJS) ---------------- */
function dealerExportFields(gst){
  var u = getUsers()[gst] || {};
  return {
    'Dealer Business Name': u.business || '',
    'GST Number': gst || '',
    'Contact Person': u.contactPerson || '',
    'Phone': u.phone || '',
    'Email': u.email || '',
    'Registered Address': u.address || '',
    'Delivery Address': u.deliveryAddress || u.address || '',
    'Dealer Tier': u.tier || 'Standard',
    'Standing Extra Discount %': Number(u.standingDiscountPct)||0,
    'Notes': u.notes || ''
  };
}
function orderExportRow(o){
  var discAmt = orderDiscountAmount(o);
  var base = {
    'Order ID': o.id,
    'Date': o.date,
    'Status': o.status,
  };
  Object.assign(base, dealerExportFields(o.dealerGst));
  Object.assign(base, {
    'Items': o.items.map(function(it){ return it.name+' x'+it.qty; }).join('; '),
    'Order Value (₹)': o.total,
    'Discount Type': o.discount ? o.discount.type : '',
    'Discount Value': o.discount ? o.discount.value : '',
    'Discount Reason': o.discount ? (o.discount.reason||'') : '',
    'Discount Amount (₹)': discAmt,
    'Delivery Charge (₹)': Number(o.deliveryCharge)||0,
    'Delivery Address': o.deliveryAddress || '',
    'Amount Payable (₹)': orderPayable(o),
    'Payment status': (PAY_TXT[payState(o)] || '').replace(/^[^A-Za-z]+/, ''),
    'Payment mode chosen': o.payMode === 'now' ? 'Pay now (UPI)' : o.payMode === 'later' ? 'Pay later' : '',
    'Amount received (₹)': orderPaid(o),
    'Balance (₹)': orderBalance(o)
  });
  return base;
}
function exportOrderExcel(id){
  var o = findOrder(id);
  if(!o) return;
  var ws = XLSX.utils.json_to_sheet([orderExportRow(o)]);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Order');
  XLSX.writeFile(wb, 'AshirvadConnect_Order_'+o.id+'.xlsx');
}
function exportAllOrdersExcel(){
  var all = getAllOrders();
  if(all.length === 0){ showToast('No orders to export'); return; }
  var rows = all.map(orderExportRow);
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Orders');
  XLSX.writeFile(wb, 'AshirvadConnect_AllOrders_'+(new Date().toISOString().slice(0,10))+'.xlsx');
}

/* ---- Resolved price list export (dealer-specific) ---- */
function resolvedPriceListRows(gst){
  // Same fix as Pricing Overview: catalog-card variants use `active` to mean "migrated from
  // the old flat catalog", not "enabled" — a custom card added directly in the Catalog builder
  // is active:false by design. Filtering on `active !== false` alone silently dropped every
  // such custom card from a dealer's exported price list. Catalog variants are always kept;
  // only genuinely-disabled regular products (active === false) are left out.
  return PRODUCTS.filter(function(p){ return p.isCatalogVariant || p.active !== false; }).map(function(p){
    var pricing = resolvePricing(p, gst, 1);
    var row = {
      'Item Code': p.part,
      'Product': p.name,
      'Size': p.size,
      'Category': p.cat,
      'MRP (₹)': p.mrp,
      'GST %': p.gstPct,
      'Your Rate %': pricing.overrideIsNet ? 'Net price' : pricing.basePct,
      'Unit Price incl. GST (₹, qty 1)': finalPrice(p, gst, 1)
    };
    if(p.bulkTiers && p.bulkTiers.length){
      row['Bulk Tiers'] = p.bulkTiers.map(function(tr){ return 'qty≥'+tr.minQty+' → +'+tr.bonusPct+'%'; }).join('; ');
    }
    row['In Stock'] = (Number(p.stock)||0) > 0 ? (Number(p.stock)) : 'Out of stock';
    return row;
  });
}
function exportDealerPriceList(gst){
  var u = getUsers()[gst] || {};
  var rows = resolvedPriceListRows(gst);
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Price List');
  XLSX.writeFile(wb, 'AshirvadConnect_PriceList_'+(u.business||gst).replace(/[^a-zA-Z0-9]+/g,'_')+'.xlsx');
}

/* ================= Auto-logout on inactivity ================= */
var IDLE_WARN_MS = 4 * 60 * 1000;   // warn after 4 minutes of inactivity
var IDLE_GRACE_MS = 60 * 1000;      // then log out 60s later if no response
var idleWarnTimer = null, idleLogoutTimer = null, idleCountdownInterval = null;
var idleWarningModalEl = document.getElementById('idleWarningModal');
var idleWarningModal = safeBsComponent('Modal', idleWarningModalEl, { backdrop:'static', keyboard:false });
var productDetailModalEl = document.getElementById('productDetailModal');
var productDetailModal = safeBsComponent('Modal', productDetailModalEl);
var catalogCardModalEl = document.getElementById('catalogCardModal');
var catalogCardModal = safeBsComponent('Modal', catalogCardModalEl);
var businessSwitcherModalEl = document.getElementById('businessSwitcherModal');
var businessSwitcherModal = safeBsComponent('Modal', businessSwitcherModalEl);
var addBusinessOffcanvasEl = document.getElementById('addBusinessOffcanvas');
var addBusinessOffcanvas = safeBsComponent('Offcanvas', addBusinessOffcanvasEl);
var productDetailsOffcanvasEl = document.getElementById('productDetailsOffcanvas');
var productDetailsOffcanvas = safeBsComponent('Offcanvas', productDetailsOffcanvasEl);
function isAnyoneLoggedIn(){ return !!session || !!adminSession; }
function clearIdleTimers(){
  clearTimeout(idleWarnTimer); clearTimeout(idleLogoutTimer); clearInterval(idleCountdownInterval);
  idleWarnTimer = idleLogoutTimer = idleCountdownInterval = null;
  try{ idleWarningModal.hide(); }catch(e){}
}
function resetIdleTimers(){
  clearIdleTimers();
  if(!isAnyoneLoggedIn()) return;
  idleWarnTimer = setTimeout(showIdleWarning, IDLE_WARN_MS);
}
function showIdleWarning(){
  if(!isAnyoneLoggedIn()) return;
  var secs = Math.floor(IDLE_GRACE_MS/1000);
  var cd = document.getElementById('idleCountdown');
  cd.textContent = secs;
  idleWarningModal.show();
  idleCountdownInterval = setInterval(function(){
    secs -= 1;
    cd.textContent = Math.max(secs, 0);
    if(secs <= 0) clearInterval(idleCountdownInterval);
  }, 1000);
  idleLogoutTimer = setTimeout(performIdleLogout, IDLE_GRACE_MS);
}
function performIdleLogout(){
  try{ idleWarningModal.hide(); }catch(e){}
  if(adminSession){ adminLogout('Logged out of admin due to inactivity'); }
  else if(session){ logout('Logged out due to inactivity'); }
}
document.getElementById('idleStayBtn').addEventListener('click', function(){ resetIdleTimers(); });
['mousemove','keydown','mousedown','touchstart','scroll'].forEach(function(evt){
  document.addEventListener(evt, function(){
    if(isAnyoneLoggedIn() && !idleWarningModalEl.classList.contains('show')) resetIdleTimers();
  }, { passive:true });
});

/* ================= Full data backup (admin safety net) ================= */
function exportFullBackup(){
  var backup = {
    exportedAt: new Date().toISOString(),
    app: 'AshirvadConnect', version: 'Phase 6',
    products: PRODUCTS,
    orders: getAllOrders(),
    dealers: getUsers(),
    banners: BANNERS,
    offers: OFFERS,
    broadcasts: BROADCASTS,
    settings: SETTINGS
  };
  var blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'AshirvadConnect_FullBackup_' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  showToast('Full backup downloaded');
}

/* ================= PWA: manifest + service worker (best-effort) ================= */
function registerServiceWorkerAndManifest(){
  try{
    var manifest = {
      name: 'AshirvadConnect',
      short_name: 'AshirvadConnect',
      start_url: '.',
      display: 'standalone',
      background_color: '#0a1322',
      theme_color: '#0a1322',
      description: 'Independent Ashirvad-affiliated dealer B2B ordering portal for pipes & fittings.',
      icons: [{
        src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%230a1322"/><text x="96" y="118" font-size="90" text-anchor="middle" fill="%23e6c878" font-family="Georgia,serif">A</text></svg>'),
        sizes: '192x192', type: 'image/svg+xml', purpose: 'any'
      }]
    };
    var manifestBlob = new Blob([JSON.stringify(manifest)], { type:'application/manifest+json' });
    var manifestUrl = URL.createObjectURL(manifestBlob);
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);

    if('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
      var swSource = "" +
        "var CACHE='ashirvadconnect-v1';" +
        "self.addEventListener('install',function(e){self.skipWaiting();});" +
        "self.addEventListener('activate',function(e){self.clients.claim();});" +
        "self.addEventListener('fetch',function(e){" +
          "if(e.request.method!=='GET')return;" +
          "e.respondWith(" +
            "caches.match(e.request).then(function(cached){" +
              "var network=fetch(e.request).then(function(resp){" +
                "if(resp && resp.status===200){var copy=resp.clone(); caches.open(CACHE).then(function(c){c.put(e.request,copy);});}" +
                "return resp;" +
              "}).catch(function(){return cached;});" +
              "return cached || network;" +
            "})" +
          ");" +
        "});";
      var swBlob = new Blob([swSource], { type:'application/javascript' });
      var swUrl = URL.createObjectURL(swBlob);
      navigator.serviceWorker.register(swUrl).catch(function(){ /* offline caching unavailable in this context — app still works normally */ });
    }
  } catch(e){ /* PWA registration is a progressive enhancement only; ignore failures */ }
}


function init(){
  applyI18n();
  applyBranding();
  if(adminSession && isAdminRoute()){
    document.getElementById('authScreen').classList.add('d-none');
    document.getElementById('adminScreen').classList.add('d-none');
    document.getElementById('adminShell').classList.remove('d-none');
    renderAdmin();
    resetIdleTimers();
    return;
  }
  if(isAdminRoute()){
    document.getElementById('authScreen').classList.add('d-none');
    document.getElementById('appShell').classList.add('d-none');
    document.getElementById('adminScreen').classList.remove('d-none');
    return;
  }
  if(session){
    var users = getUsers();
    if(users[session]){
      document.getElementById('authScreen').classList.add('d-none');
      document.getElementById('appShell').classList.remove('d-none');
      render();
      checkDiscountNotifications();
      checkStockNotifications();
      checkBroadcastNotifications();
      resetIdleTimers();
      handleProductDeepLink();
      return;
    } else {
      session = null;
      localStorage.removeItem('ac_session');
    }
  }
  document.getElementById('authScreen').classList.remove('d-none');
}
window.addEventListener('hashchange', function(){
  if(isAdminRoute() && !adminSession){
    document.getElementById('authScreen').classList.add('d-none');
    document.getElementById('appShell').classList.add('d-none');
    document.getElementById('adminScreen').classList.remove('d-none');
  }
});

window.__acApi = {
  esc: esc, showToast: showToast, logAudit: logAudit,
  getProducts: function(){ return PRODUCTS; },
  getGroups: function(){ return SPEC_GROUPS; },
  getCategories: function(){ return CATALOG_CATEGORIES; },
  getSubcategories: function(){ return CATALOG_SUBCATEGORIES; },
  distStockOf: distStockOf,
  saveProducts: saveProducts, nextProductId: nextProductId,
  /* The EXACT item as the admin sees it: for a catalog-card item, name = card title and size = ALL of the
     item's field values (e.g. 2½" · Std class), plus card / category info so lists can be grouped. */
  describe: function(p){
    if(p && p.isCatalogVariant){
      var g = SPEC_GROUPS.find(function(x){ return x.id === p.specGroupId; });
      var v = g && (g.variants||[]).find(function(x){ return x.id === p.variantId; });
      if(g && v){
        var vals = v.values || {};
        var spec = (g.fields||[]).map(function(f){ return String(vals[f.id] == null ? '' : vals[f.id]).trim(); }).filter(Boolean).join(' · ');
        return { name: g.title, size: spec || p.size || '', gid: g.id, gtitle: g.title,
                 catId: g.categoryId || '', catName: g.categoryId ? catalogCatName(g.categoryId) : 'Uncategorised',
                 subId: g.subCategoryId || '', subName: g.subCategoryId ? catalogSubName(g.subCategoryId) : '',
                 cat: catalogCatName(g.categoryId) + (g.subCategoryId ? ' › ' + catalogSubName(g.subCategoryId) : '') };
      }
    }
    return { name: p.name, size: p.size || '', gid: null, gtitle: '', catId: p.cat || '', catName: p.cat ? catalogCatName(p.cat) : 'Uncategorised',
             subId: '', subName: '', cat: p.cat ? catalogCatName(p.cat) : '' };
  }
};

/* ---- Hooks used by the Firebase layer (js/cloud/firebase-boot.js). No effect without it. ---- */
window.__acToast = showToast;
// Re-read every shared list from the storage adapter after another device changed something.
window.__acRefresh = function(){
  PRODUCTS = loadProducts(); CATALOG_CATEGORIES = loadCatalogCategories(); CATALOG_SUBCATEGORIES = loadCatalogSubcategories();
  SPEC_GROUPS = loadSpecGroups(); syncSpecVariantProducts();
  CALC_RULES = loadCalcRules(); BANNERS = loadBanners(); OFFERS = loadOffers(); SETTINGS = loadSettings();
  BROADCASTS = loadBroadcasts(); STOCK_NOTIFY = loadStockNotify();
  if(adminSession){ renderAdmin(); }
  else if(session && !document.getElementById('appShell').classList.contains('d-none')){ render(); }
};
// Publish what the app currently holds (built-in starting catalog, settings…) to the cloud.
window.__acSeed = function(){
  saveCatalogCategories(CATALOG_CATEGORIES); saveCatalogSubcategories(CATALOG_SUBCATEGORIES);
  saveSpecGroups(SPEC_GROUPS); saveProducts(PRODUCTS);
  saveSettings(SETTINGS); saveOffers(OFFERS); saveBanners(BANNERS); saveCalcRules(CALC_RULES);
  saveBroadcasts(BROADCASTS);
};

registerServiceWorkerAndManifest();
repairDuplicateSpecGroups();
migrateAgriCasingToCatalog();
warnDuplicateSpecGroups();
init();
// Only run auto-status processing once someone is actually signed in. This used to run the
// instant the page loaded for anyone, including at the bare login screen, so orders could
// visibly jump status right at the moment ANY dealer or admin logged in, with nothing on
// screen explaining why. This changes only WHEN the (client-side, no real server) check is
// allowed to fire — not what the configured auto-status rules themselves do.
if(session || adminSession) runScheduledOrderStatusChecks();
setInterval(function(){
  if(!session && !adminSession) return;
  var n = runScheduledOrderStatusChecks();
  if(n && typeof currentAdminTab !== 'undefined' && adminSession && currentAdminTab === 'orders') renderAdminOrders();
}, 60000);

})();