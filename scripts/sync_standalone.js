import fs from 'fs';

// ---------------------------------------------------------------------------
// Espejo cambiapalabras -> cyber-hijack (Regla #1).
// script.js y style.css quedan IDÉNTICOS. El index.html de cyber-hijack es el
// mismo pero PLANO: sus assets viven al lado (script.js / style.css) en vez de
// la subcarpeta cambiapalabras/.
// ---------------------------------------------------------------------------

fs.copyFileSync('public/cambiapalabras/style.css', 'cyber-hijack/style.css');
fs.copyFileSync('public/cambiapalabras/script.js', 'cyber-hijack/script.js');
fs.mkdirSync('cyber-hijack/js', { recursive: true });
fs.copyFileSync('public/js/base-path.js', 'cyber-hijack/js/base-path.js');
fs.copyFileSync('public/js/control-remoto.js', 'cyber-hijack/js/control-remoto.js');

let html = fs.readFileSync('public/cambiapalabras.html', 'utf-8');

// Assets: de "cambiapalabras/script.js?v=3.10" a "script.js?v=3.10"
html = html.replace(/cambiapalabras\/(script|style)\.(js|css)(\?v=[0-9.]+)?/g, '$1.$2$3');

// El favicon y el base-path viven al lado en cyber-hijack
if (!fs.existsSync('cyber-hijack/favicon.svg') && fs.existsSync('public/favicon.svg')) {
  fs.copyFileSync('public/favicon.svg', 'cyber-hijack/favicon.svg');
}

fs.writeFileSync('cyber-hijack/index.html', html, 'utf-8');

const stillAbs = /cambiapalabras\/(script|style)\./.test(html);
console.log('cyber-hijack sincronizado (script.js, style.css, index.html, js/base-path.js, favicon.svg)' + (stillAbs ? ' — OJO: quedaron rutas cambiapalabras/ en el html' : ''));
