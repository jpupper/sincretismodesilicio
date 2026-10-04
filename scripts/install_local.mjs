/**
 * install_local.mjs — Instalador de Sincretismo de Silicio para correr 100% LOCAL.
 *
 * Lo que hace (idempotente: sólo baja/crea lo que falta):
 *   1. Verifica Node + dependencias npm.
 *   2. Fuentes vendorizadas      -> public/css/fonts-local.css + public/fonts/webfonts/
 *   3. MediaPipe (pose+camera)   -> public/vendor/mediapipe/
 *   4. Modelo semántico ONNX     -> public/models/Xenova/paraphrase-multilingual-MiniLM-L12-v2/
 *   5. Matriz LAYA 384D          -> public/data/laya_embeddings.bin (scripts/generate_laya_embeddings.js)
 *   6. Ollama local: verifica el modelo de config.json y lo baja si falta.
 *   7. JP Shader Editor local: reporta el catálogo y lo siembra si está vacío.
 *
 * Uso:  node scripts/install_local.mjs       (lo llama install.bat)
 */
import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const OK = (s) => console.log('  [OK]   ' + s);
const SKIP = (s) => console.log('  [SKIP] ' + s);
const WARN = (s) => console.log('  [AVISO] ' + s);
const DO = (s) => console.log('  ...    ' + s);
const H = (s) => console.log('\n=== ' + s + ' ' + '='.repeat(Math.max(0, 62 - s.length)));

const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };
const nmb = (n) => (n / 1048576).toFixed(1) + ' MB';

async function download(url, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' en ' + url);
  const tmp = dest + '.part';
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  await fs.promises.rename(tmp, dest);
  return fs.statSync(dest).size;
}

// ---------------------------------------------------------------- 2) FUENTES
const FUENTES = [
  ['Share Tech Mono', 'Share+Tech+Mono'], ['VT323', 'VT323'],
  ['IBM Plex Mono', 'IBM+Plex+Mono:wght@400;500;700'],
  ['Space Mono', 'Space+Mono:ital,wght@0,400;0,700;1,400'],
  ['Cutive Mono', 'Cutive+Mono'], ['Anonymous Pro', 'Anonymous+Pro:wght@400;700'],
  ['Nova Mono', 'Nova+Mono'], ['Cousine', 'Cousine:wght@400;700'],
  ['Fira Code', 'Fira+Code:wght@400;500;700'], ['JetBrains Mono', 'JetBrains+Mono:wght@400;700'],
  ['Major Mono Display', 'Major+Mono+Display'], ['Cinzel', 'Cinzel:wght@500;700'],
  ['Inter', 'Inter:wght@400;600;800'], ['Outfit', 'Outfit:wght@400;600;800'],
  ['Syne', 'Syne:wght@600;800'],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

async function fuentes() {
  H('Fuentes (Google Fonts -> local)');
  const dir = path.join(ROOT, 'public', 'fonts', 'webfonts');
  const css = path.join(ROOT, 'public', 'css', 'fonts-local.css');
  if (exists(css) && exists(dir) && fs.readdirSync(dir).length > 50) {
    OK('ya vendorizadas (' + fs.readdirSync(dir).length + ' archivos)'); return;
  }
  let total = 0, n = 0;
  const out = ['/* 100% LOCAL: fuentes vendorizadas (install_local.mjs). */', ''];
  for (const [fam, q] of FUENTES) {
    let raw;
    try {
      const r = await fetch('https://fonts.googleapis.com/css2?family=' + q + '&display=swap', { headers: { 'User-Agent': UA } });
      raw = await r.text();
    } catch (e) { WARN('no pude bajar ' + fam + ': ' + e.message); continue; }
    const urls = [...raw.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];
    let cssLocal = raw;
    for (const m of urls) {
      const ext = m[1].endsWith('.woff2') ? '.woff2' : '.woff';
      const name = slug(fam) + '_' + String(n++).padStart(3, '0') + ext;
      try { await download(m[1], path.join(dir, name)); total++; } catch (e) { WARN('woff2 ' + name + ': ' + e.message); }
      cssLocal = cssLocal.replace(m[1], '../fonts/webfonts/' + name);
    }
    out.push('/* ===== ' + fam + ' ===== */', cssLocal.trim(), '');
  }
  await fs.promises.mkdir(path.dirname(css), { recursive: true });
  fs.writeFileSync(css, out.join('\n') + '\n');
  OK(total + ' woff2 + css/fonts-local.css');
}

// ------------------------------------------------------------- 3) MEDIAPIPE
async function mediapipe() {
  H('MediaPipe (pose + camera_utils -> local)');
  const base = path.join(ROOT, 'public', 'vendor', 'mediapipe');
  const need = [['@mediapipe/pose', 'pose'], ['@mediapipe/camera_utils', 'camera_utils']];
  for (const [pkg, dst] of need) {
    const outdir = path.join(base, dst);
    if (exists(outdir) && fs.readdirSync(outdir).some(f => f.endsWith('.js'))) { OK(dst + ' ya está'); continue; }
    DO('bajando ' + pkg);
    const meta = await (await fetch('https://registry.npmjs.org/' + pkg, { headers: { 'User-Agent': UA } })).json();
    const ver = meta['dist-tags'].latest;
    const tgz = path.join(base, dst + '.tgz');
    await download(meta.versions[ver].dist.tarball, tgz);
    await fs.promises.mkdir(outdir, { recursive: true });
    execFileSync('tar', ['-xzf', tgz, '-C', outdir, '--strip-components=1'], { stdio: 'inherit' });
    fs.rmSync(tgz, { force: true });
    // limpiar lo que no se usa
    for (const junk of ['src', 'test', 'examples']) fs.rmSync(path.join(outdir, junk), { recursive: true, force: true });
    for (const f of fs.readdirSync(outdir)) if (/\.(md|ts|map)$/.test(f)) fs.rmSync(path.join(outdir, f), { force: true });
    OK(dst + ' (' + ver + ')');
  }
}

// ---------------------------------------------------- 4) MODELO SEMÁNTICO ONNX
async function modelo() {
  H('Modelo semántico ONNX (HuggingFace -> local)');
  const dir = path.join(ROOT, 'public', 'models', 'Xenova', 'paraphrase-multilingual-MiniLM-L12-v2');
  const B = 'https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/';
  const files = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'onnx/model_quantized.onnx'];
  let missing = files.filter(f => !exists(path.join(dir, f)));
  if (!missing.length) { OK('modelo completo (onnx ' + nmb(fs.statSync(path.join(dir, 'onnx/model_quantized.onnx')).size) + ')'); return; }
  console.log('  faltan: ' + missing.join(', '));
  for (const f of missing) {
    DO('bajando ' + f + ' ...');
    const size = await download(B + f, path.join(dir, f));
    OK(f + ' (' + nmb(size) + ')');
  }
}

// ------------------------------------------------------------ 5) MATRIZ LAYA
async function matriz() {
  H('Matriz LAYA 384D (public/data)');
  const bin = path.join(ROOT, 'public', 'data', 'laya_embeddings.bin');
  if (exists(bin) && fs.statSync(bin).size > 1000) { OK('laya_embeddings.bin (' + nmb(fs.statSync(bin).size) + ')'); return; }
  if (!exists(path.join(ROOT, 'public', 'data', 'vocab.json'))) { WARN('falta vocab.json: no puedo generarla'); return; }
  DO('generando matriz (necesita el modelo ONNX) ...');
  try {
    execSync('node scripts/generate_laya_embeddings.js', { cwd: ROOT, stdio: 'inherit' });
    OK('laya_embeddings.bin generado');
  } catch (e) { WARN('no se pudo generar: ' + e.message); }
}

// ---------------------------------------------------------------- 6) OLLAMA
function leerModeloConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).ollamaModel || 'llama3.2:latest'; }
  catch { return 'llama3.2:latest'; }
}
async function ollama() {
  H('Ollama local (modelos de lenguaje)');
  const modelo = leerModeloConfig();
  let tags;
  try {
    const r = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(4000) });
    tags = await r.json();
  } catch (e) {
    WARN('Ollama no responde en 127.0.0.1:11434. Arrancalo con ollama-web.bat y volvé a correr esto.');
    return;
  }
  const nombres = (tags.models || []).map(m => m.name);
  console.log('  modelos instalados: ' + (nombres.length ? nombres.join(', ') : '(ninguno)'));
  const tiene = nombres.some(n => n === modelo || n.split(':')[0] === modelo.split(':')[0]);
  if (tiene) { OK('el modelo de config.json ("' + modelo + '") está'); return; }
  DO('bajando "' + modelo + '" (ollama pull) ...');
  try {
    execSync('ollama pull ' + modelo, { stdio: 'inherit' });
    OK(modelo + ' instalado');
  } catch (e) { WARN('no pude bajar ' + modelo + ' (¿está el CLI `ollama` en el PATH?): ' + e.message); }
}

// --------------------------------------------------------- 7) JP SHADER EDITOR
async function editor() {
  H('JP Shader Editor LOCAL (fondo de nodos, puerto 3250)');
  const DIR = 'D:/Programacion/sistemasfullscreen/jpshaderszone/jpshadereditor';
  let data;
  try {
    const r = await fetch('http://localhost:3250/jpshadereditor/api/shaders', { signal: AbortSignal.timeout(8000) });
    data = await r.json();
  } catch (e) {
    WARN('el editor local no responde en http://localhost:3250 (arrancalo con npm start en jpshadereditor).');
    return;
  }
  const n = Array.isArray(data) ? data.length : 0;
  console.log('  catálogo local: ' + n + ' shaders');
  if (n >= 300) { OK('catálogo completo'); return; }
  const seed = path.join(DIR, 'scripts', 'seed_catalogo.js');
  if (!exists(seed)) { WARN('catálogo incompleto y no encuentro el seed en ' + DIR); return; }
  DO('sembrando el catálogo local (shaders + NODE PRESETS + performance) ...');
  try {
    execSync('node scripts/seed_catalogo.js --solo-si-vacio', { cwd: DIR, stdio: 'inherit' });
    // invalidar el cache del editor (cualquier POST lo hace)
    await fetch('http://localhost:3250/jpshadereditor/api/__invalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => { });
    OK('catálogo sembrado');
  } catch (e) { WARN('no se pudo sembrar: ' + e.message); }
}

// ------------------------------------------------------------------- MAIN
(async () => {
  console.log('============================================================');
  console.log('  SINCRETISMO DE SILICIO — instalación 100% LOCAL');
  console.log('  directorio: ' + ROOT);
  console.log('============================================================');

  H('Node / dependencias');
  console.log('  node ' + process.version + ' · npm ' + execSync('npm -v').toString().trim());
  if (!exists(path.join(ROOT, 'node_modules'))) WARN('no hay node_modules: corré `npm install`');
  else OK('node_modules presente');

  try { await fuentes(); } catch (e) { WARN('fuentes: ' + e.message); }
  try { await mediapipe(); } catch (e) { WARN('mediapipe: ' + e.message); }
  try { await modelo(); } catch (e) { WARN('modelo ONNX: ' + e.message); }
  try { await matriz(); } catch (e) { WARN('matriz: ' + e.message); }
  try { await ollama(); } catch (e) { WARN('ollama: ' + e.message); }
  try { await editor(); } catch (e) { WARN('editor: ' + e.message); }

  H('Listo');
  console.log('  1) Ollama:   ollama-web.bat          (deja los modelos locales escuchando)');
  console.log('  2) Shaders:  abrir jpshadereditor local: `npm start` (puerto 3250)');
  console.log('  3) App:      run.bat                 (http://localhost:6932/cambiapalabras.html)');
  console.log('  Todo corre offline: fuentes, MediaPipe, modelo ONNX y el fondo de nodos son locales.');
})().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
