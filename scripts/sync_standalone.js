import fs from 'fs';

// ---------------------------------------------------------------------------
// Espejo game3 -> cyber-hijack (Regla #1).
// script.js y style.css quedan IDÉNTICOS. index.html difiere sólo en:
//   - el bloque de base dinámica se elimina (cyber-hijack es standalone, sin <base>)
//   - base-path.js se referencia local (cyber-hijack/js/) en vez de ../js/
// ---------------------------------------------------------------------------

fs.copyFileSync('public/game3/style.css', 'cyber-hijack/style.css');
fs.copyFileSync('public/game3/script.js', 'cyber-hijack/script.js');

fs.mkdirSync('cyber-hijack/js', { recursive: true });
fs.copyFileSync('public/js/base-path.js', 'cyber-hijack/js/base-path.js');

let html = fs.readFileSync('public/game3/index.html', 'utf-8');

const baseBlock = /  <!-- Base dinámica:[\s\S]*?<\/script>\r?\n/;
if (!baseBlock.test(html)) {
  throw new Error('No encontré el bloque de base dinámica en public/game3/index.html: la sincronización quedó a medias.');
}
html = html.replace(baseBlock, '');
html = html.replace('../js/base-path.js', 'js/base-path.js');

fs.writeFileSync('cyber-hijack/index.html', html, 'utf-8');

console.log('cyber-hijack sincronizado: script.js, style.css, index.html, js/base-path.js');
