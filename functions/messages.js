'use strict';
/* Telegram message texts (HTML parse mode). Pure functions — no Firebase here, so they are easy to test. */
function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inr(n){ return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function cut(text){ return text.length > 3900 ? text.slice(0, 3850) + '\n… (message shortened)' : text; }
function link(cfg){ return cfg && cfg.adminUrl ? '\n🔗 ' + esc(cfg.adminUrl) : ''; }
function lines(list, fmt, max){
  var rows = (list || []).slice(0, max || 20).map(fmt);
  if((list || []).length > (max || 20)) rows.push('… +' + (list.length - (max || 20)) + ' more item(s)');
  return rows.join('\n');
}

function newOrder(o, cfg){
  var payable = Number(o.total || 0) + Number(o.deliveryCharge || 0);
  return cut(
    '🛒 <b>New order ' + esc(o.id) + '</b>\n' +
    '🏢 ' + esc(o.dealerBusiness || o.dealerGst) + (o.dealerGst && o.dealerBusiness ? ' (' + esc(o.dealerGst) + ')' : '') + '\n' +
    (o.accountKey ? '📞 ' + esc(o.accountKey) + '\n' : '') +
    (o.date ? '🕒 ' + esc(o.date) + '\n' : '') +
    '\n' + lines(o.items, function(i){ return '• ' + esc(i.name) + ' × ' + esc(i.qty) + ' — ' + inr(i.price * i.qty); }) + '\n\n' +
    '💰 Items: ' + inr(o.total) + (Number(o.deliveryCharge) ? '\n🚚 Delivery: ' + inr(o.deliveryCharge) : '') + '\n' +
    '<b>Payable: ' + inr(payable) + '</b>' +
    (o.deliveryAddress ? '\n📍 ' + esc(o.deliveryAddress) : '') + link(cfg));
}
function cancelled(o, cfg){
  return cut('❌ <b>Order ' + esc(o.id) + ' cancelled</b>\n🏢 ' + esc(o.dealerBusiness || o.dealerGst) +
    '\n💰 ' + inr(Number(o.total || 0) + Number(o.deliveryCharge || 0)) + link(cfg));
}
function distOrder(o, cfg){
  return cut(
    '📦 <b>Distributor order ' + esc(o.no || o.id) + '</b>\n' +
    '🚚 ' + esc(o.distributorName || o.distributorId) + (o.by && o.by !== o.distributorId ? ' (by ' + esc(o.by) + ')' : '') + '\n\n' +
    lines(o.lines, function(l){ return '• ' + esc(l.name) + (l.size ? ' ' + esc(l.size) : '') + ' × ' + esc(l.qty); }) + '\n\n' +
    '<b>Total units: ' + esc(o.units) + '</b>' + (o.note ? '\n📝 ' + esc(o.note) : '') + link(cfg));
}
function distRequest(r, cfg){
  return cut('📥 <b>Product request</b>\n🚚 ' + esc(r.distributorId) + '\n• ' + esc(r.name) + (r.size ? ' (' + esc(r.size) + ')' : '') +
    '\nPart: ' + esc(r.part) + ' · stock ' + esc(r.qty) + (r.note ? '\n📝 ' + esc(r.note) : '') + link(cfg));
}
module.exports = { esc: esc, inr: inr, newOrder: newOrder, cancelled: cancelled, distOrder: distOrder, distRequest: distRequest };