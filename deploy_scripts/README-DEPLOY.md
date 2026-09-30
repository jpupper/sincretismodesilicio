# Sincretismo de Silicio — Deploy VPS + FTP y modelos locales

Estado verificado: 26-Sep-2026.

## Arquitectura

| Capa | Dónde | Qué hace |
|---|---|---|
| Backend Express | VPS `/root/sincretismodesilicio` (puerto **6932**, PM2 `sincretismodesilicio`) | Estáticos, `/config`, `/api/*`, motor semántico Laya ONNX, proxy Ollama, bus WebSocket `/ws` |
| Backend alterno | mismo código, puerto **3000** (PM2 `sincretismodesilicio-root`) | Publica la app en la RAÍZ del dominio (nginx `location /` ya apunta a 3000) |
| Frontend estático | FTP `fullscreencode.com/sincretismodesilicio/` | Copia estática de `public/` (sin Node: la config vive en localStorage) |
| **Modelos** | **Máquina del visitante** (`http://localhost:11434`) | La inferencia NUNCA ocurre en el servidor |

## Regla de oro: los modelos corren en la máquina del visitante

El frontend pide la inferencia DIRECTO a Ollama local, así la app funciona
igual estando publicada en la web:

1. `public/js/base-path.js` resuelve las URLs (`sbApi`, `sbWsUrl`, `getOllamaUrls`).
2. `requestOllamaHijack()` prueba en orden el servidor Ollama configurado →
   `http://localhost:11434` → `http://127.0.0.1:11434`.
3. Sólo si ningún Ollama local responde, cae al proxy del backend
   (`/api/ollama/generate`), que a su vez tiene un fallback procedural.
4. El listado de modelos del modal (pestaña MODELO & PROMPT) se arma con
   `/api/tags` del Ollama local; si no hay, usa el del backend o el default.

### Requisito en la máquina que corre los modelos

Ollama rechaza pedidos desde orígenes web que no estén autorizados (403).
Hay que arrancarlo con `OLLAMA_ORIGINS` abierto:

```bat
ollama-web.bat        <- lanzador incluido en el proyecto (doble clic)
```

equivale a:

```bat
set OLLAMA_ORIGINS=*
ollama serve
```

Verificación rápida en el navegador (F12 → Console):

```js
fetch('http://localhost:11434/api/tags').then(r => r.json()).then(d => console.log(d.models))
```

### Cambiar el servidor Ollama

- Pestaña MODELO & PROMPT → campo **"Servidor Ollama local"** (chips localhost / 127.0.0.1 / LAN).
- Se guarda solo en `localStorage` (`sincretismo_ollama_url`) porque es una
  preferencia **de esta máquina**, no del servidor.
- También por URL: `?ollama=http://192.168.0.50:11434`.
- Y la base de la API: `?api=https://otro-host/ruta` (queda en localStorage).

## Deploy VPS

```bash
bash deploy_scripts/deploy_vps.sh
```

Hace: `tar` (sin node_modules) → `scp` → extraer en `/root/sincretismodesilicio`
→ `npm install --omit=dev` → `pm2 restart` de los dos procesos → verificación por curl.

Requisito: `@xenova/transformers` + `onnxruntime-node` (motor semántico Laya).
Si el `npm install` falla, la app igual arranca y sólo se degradan los
endpoints `/api/semantic/*`.

## Deploy FTP (frontend estático)

```bash
python deploy_scripts/upload_ftp_sincretismo.py
```

Sube `public/` a `/sincretismodesilicio/` del FTP (credenciales desde
`sistemasfullscreen/megaskill/.env`).
URL: https://fullscreencode.com/sincretismodesilicio/

Desde el FTP, las llamadas a la API apuntan al VPS
(`https://vps-4455523-x.dattaweb.com/sincretismo`, con respaldo automático a la
raíz del VPS) y la inferencia sigue siendo local. El CORS está habilitado en
`server.js`.

## nginx (lo aplica el usuario a mano)

Ver `deploy_scripts/nginx-sincretismo.conf`.

```
location = /sincretismo { return 301 /sincretismo/; }
location /sincretismo/  { proxy_pass http://localhost:6932/; ... Upgrade ... }
```

Ojo: el **trailing slash** de `proxy_pass` es obligatorio (pisa el prefijo).
Aplicar con `nginx -t && systemctl reload nginx`.

## URLs publicadas

| URL | Estado |
|---|---|
| https://vps-4455523-x.dattaweb.com/ | app completa (slot raíz, puerto 3000) |
| https://vps-4455523-x.dattaweb.com/cambiapalabras.html | instalación "CambiaPalabras" (ex game3; /game3 redirige 301) |
| https://vps-4455523-x.dattaweb.com/sincretismo/ | **requiere el location de nginx** |
| https://fullscreencode.com/sincretismodesilicio/ | copia estática en FTP |
