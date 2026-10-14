# Sincretismo de Silicio — Deploy (estándar FSC)

**Un solo comando:** `deploy_scripts/run_deploy.bat` (doble clic, o desde bash:
`MSYS_NO_PATHCONV=1 cmd.exe /c "deploy_scripts\run_deploy.bat" < /dev/null`).

Hace, en orden:

1. `git push origin main` — el VPS baja el código desde GitHub (si el push falla, aborta).
2. **VPS** por SSH (`149.50.139.152:5752`, `root`): `git fetch` + `git checkout -f -B main origin/main`
   en `/root/sincretismodesilicio` → `npm install --omit=dev` → `pm2 restart` de los **dos** procesos →
   verificación local por `curl` en 6932 y 3000.
3. **FTP (Ferozo)**: `node deploy_scripts/upload_ftp.js` sincroniza `public/` →
   `/sincretismodesilicio/` = <https://fullscreencode.com/sincretismodesilicio/>.

```
deploy_scripts/
├── run_deploy.bat      # orquestador: GitHub -> VPS (SSH) -> FTP
├── server_update.sh    # corre EN el VPS (lo llama el .bat)
├── upload_ftp.js       # Node + basic-ftp: sincroniza public/ al FTP
└── nginx-sincretismo.conf  # bloque nginx opcional (/sincretismo/), lo aplica el humano
```

`server_update.sh` limpia solo los CRLF que deja Windows en el checkout.

## Arquitectura

| Capa | Dónde | Qué hace |
|---|---|---|
| Backend Express | VPS `/root/sincretismodesilicio` (PM2 `sincretismodesilicio`, puerto **6932**) | Estáticos, `/config`, `/api/*`, motor semántico Laya ONNX, proxy Ollama, bus WebSocket |
| Backend slot raíz | mismo código, puerto **3000** (PM2 `sincretismodesilicio-root`) | Publica la app en la RAÍZ de `vps-4455523-x.dattaweb.com` (nginx `location /` → 3000) |
| Frontend estático | FTP `/sincretismodesilicio/` | Copia estática de `public/` (sin Node: la config vive en localStorage) |
| **Modelos** | **Máquina del visitante** (`http://localhost:11434`) | La inferencia NUNCA ocurre en el servidor |

`public/js/base-path.js` resuelve la base sola: raíz del VPS, subpath `/sincretismo/`, localhost o
hosting estático (`fullscreencode.com/…` → API al VPS). Todo el front usa rutas **relativas**.

## Requisitos del `.env` local (gitignoreado, no viaja al repo)

```
FTP_HOST / FTP_USER / FTP_PASS      # Ferozo c1700065, cuenta jpupper@fullscreencode.com
GITHUB_REPO=jpupper/sincretismodesilicio
VPS_HOST=149.50.139.152
VPS_PORT=5752
VPS_USER=root
```

El VPS trae el repo por **SSH con su deploy key** (no necesita token en el `.env`).

## Qué NO se publica al FTP

- `public/models/` (130 MB de ONNX del motor Laya): los usa **el server Node local**. El front
  resuelve lo semántico con `./data/vocab.json` + `laya_embeddings.bin`, que sí se publican.
- `.htaccess`/`.htpasswd` y cualquier archivo que empiece con punto (protocolo FSC).

## Notas de robustez

- El uploader compara **tamaños** y sube solo lo nuevo/modificado; rota la sesión FTP cada 20 subidas
  y reintenta cada archivo 3 veces (Ferozo corta el socket de control en sesiones largas).
- `public/data/haikus.csv` y `public/data/jsons_guardados.json` están en `.gitignore`: son datos de
  runtime y **sobreviven** al `git checkout -f` del VPS (untracked).
- El `.env` del VPS no existe ni hace falta: `server.js` no usa dotenv (solo `PORT`,
  `JP_SHADER_DIR`, `JP_EDITOR_ORIGIN`), y los puertos se fuerzan en el `pm2 restart`.

## Verificación después del deploy

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://fullscreencode.com/sincretismodesilicio/   # 200 FTP
curl -s -o /dev/null -w '%{http_code}\n' https://vps-4455523-x.dattaweb.com/                 # 200 VPS raíz
curl -s https://fullscreencode.com/sincretismodesilicio/index.html?cb=$RANDOM | md5sum       # == local
md5sum public/index.html
```

Los tres md5 tienen que coincidir (local = FTP = VPS).
