/* Regenerates admin/index.html from index.html.
   The admin console and the dealer store share ONE app (js/app.js) and the same markup;
   the admin page just marks itself with data-app-route="admin" and uses ../ asset paths.
   Run after editing index.html:   node tools/sync-admin.js                              */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
h = h.replace('<html lang="en" id="htmlRoot">', '<html lang="en" id="htmlRoot" data-app-route="admin">')
     .replace(/<title>[^<]*<\/title>/, '<title>Admin — AshirvadConnect</title>\n<meta name="robots" content="noindex, nofollow">')
     .replace(/(href|src)="(css|js)\//g, '$1="../$2/');
fs.mkdirSync(path.join(root, 'admin'), { recursive: true });
fs.writeFileSync(path.join(root, 'admin', 'index.html'), h);
console.log('admin/index.html updated');
