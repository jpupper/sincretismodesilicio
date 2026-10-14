/* ============================================================================
   SINCRETISMO DE SILICIO - subida del frontend estatico al FTP de Ferozo
   Destino: /sincretismodesilicio/   ->  https://fullscreencode.com/sincretismodesilicio/
   Uso:     node deploy_scripts/upload_ftp.js        (lo llama run_deploy.bat)

   Reglas del ecosistema:
     - NUNCA subir archivos de configuracion de Apache (.htaccess/.htpasswd).
     - NUNCA subir .env ni nada que empiece con punto.
     - NO se publica public/models/ (130 MB de ONNX del motor Laya: los usa el
       server Node local, el front resuelve lo semantico con ./data/vocab.json
       + laya_embeddings.bin, que si se publican).
     - Compara tamanios: sube solo lo nuevo o lo que cambio.
     - Ferozo corta el socket de control en sesiones largas (ECONNRESET): se
       rota la conexion cada N subidas y se reintenta cada archivo 3 veces.
   ============================================================================ */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

const LOCAL_ROOT = path.join(__dirname, '..', 'public');
const REMOTE_ROOT = '/sincretismodesilicio';

const SKIP_DIRS = new Set(['models']);            // solo los usa el server Node local
const SKIP_FILES = new Set(['.htaccess', '.htpasswd', '.env', '.DS_Store']);
const MAX_UPLOADS_PER_SESSION = 20;               // rotar sesion FTP para no morir por ECONNRESET
const MAX_INTENTOS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nuevoCliente() {
  const c = new ftp.Client(30000);
  c.ftp.verbose = false;
  await c.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: true,
    secureOptions: { rejectUnauthorized: false }
  });
  return c;
}

const state = { client: null, subidos: 0, sesion: 0, salteados: 0, errores: [] };

async function rotarSesion(motivo) {
  try { state.client.close(); } catch (e) { /* noop */ }
  await sleep(2000);
  state.client = await nuevoCliente();
  state.sesion++;
  state.subidos = 0;
  console.log(`   [ftp] nueva sesion #${state.sesion} (${motivo})`);
}

async function subirArchivo(localPath, remoteDir, nombre) {
  const rel = `${remoteDir}/${nombre}`;
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      if (state.subidos >= MAX_UPLOADS_PER_SESSION) await rotarSesion('rotacion por cantidad');
      await state.client.ensureDir(remoteDir);
      await state.client.uploadFrom(localPath, nombre);
      state.subidos++;
      const kb = (fs.statSync(localPath).size / 1024).toFixed(1);
      console.log(`[SUBIENDO] ${rel}  (${kb} KB)`);
      return;
    } catch (err) {
      console.log(`   [ftp] intento ${intento}/${MAX_INTENTOS} fallo en ${rel}: ${err.message}`);
      if (intento === MAX_INTENTOS) {
        state.errores.push(rel);
        return;
      }
      await rotarSesion('reintento tras error');
      await sleep(1500 * intento);
    }
  }
}

async function syncDir(localDir, remoteDir) {
  await state.client.ensureDir(remoteDir);
  let remoteMap = new Map();
  try {
    for (const item of await state.client.list()) remoteMap.set(item.name, item);
  } catch (err) {
    console.log(`   [ftp] no se pudo listar ${remoteDir}: ${err.message}`);
  }

  for (const item of fs.readdirSync(localDir).sort()) {
    if (item.startsWith('.') || SKIP_FILES.has(item)) continue;
    const localPath = path.join(localDir, item);
    const st = fs.statSync(localPath);

    if (st.isDirectory()) {
      if (SKIP_DIRS.has(item)) {
        console.log(`[SALTEADO] ${remoteDir}/${item}/ (no se publica)`);
        state.salteados++;
        continue;
      }
      await syncDir(localPath, `${remoteDir}/${item}`);
      await state.client.ensureDir(remoteDir);
    } else {
      const remoto = remoteMap.get(item);
      if (remoto && remoto.size === st.size) continue;   // ya esta igual
      await subirArchivo(localPath, remoteDir, item);
    }
  }
}

async function main() {
  if (!process.env.FTP_HOST || !process.env.FTP_USER || !process.env.FTP_PASS) {
    console.error('[ERROR] Faltan FTP_HOST / FTP_USER / FTP_PASS en el .env');
    process.exit(1);
  }
  console.log(`=== SINCRONIZANDO public/  ->  ${process.env.FTP_HOST}:${REMOTE_ROOT}/ ===`);
  console.log('    (compara tamanios: sube solo lo nuevo o modificado)');

  state.client = await nuevoCliente();
  try {
    await syncDir(LOCAL_ROOT, REMOTE_ROOT);
  } catch (err) {
    console.error('[ERROR]', err.message);
    state.errores.push(`(abortado) ${err.message}`);
  } finally {
    try { state.client.close(); } catch (e) { /* noop */ }
  }

  console.log('');
  if (state.errores.length) {
    console.log('=== TERMINO CON ERRORES ===');
    state.errores.forEach((e) => console.log('   ! ' + e));
    process.exit(1);
  }
  console.log('=== SINCRONIZACION FTP COMPLETA ===');
  console.log(`    sesiones FTP usadas: ${state.sesion + 1} | carpetas salteadas: ${state.salteados}`);
}

main();
