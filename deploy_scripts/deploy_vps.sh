#!/usr/bin/env bash
# ============================================================================
#  SINCRETISMO DE SILICIO — Deploy al VPS (149.50.139.152:5752)
#  Sube el código, instala dependencias y reinicia los dos procesos PM2.
#  NO toca nginx (ver deploy_scripts/nginx-sincretismo.conf).
# ============================================================================
set -euo pipefail

VPS_USER="root"
VPS_HOST="149.50.139.152"
VPS_PORT="5752"
APP_DIR="/root/sincretismodesilicio"

cd "$(dirname "$0")/.."
echo "[deploy] Directorio local: $(pwd)"

TAR="/tmp/sincretismo_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "[deploy] Empaquetando..."
tar czf "$TAR" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude='*.log' \
  server.js package.json package-lock.json config.json .gitignore \
  server public scripts src install.bat run.bat ollama-web.bat

ls -lh "$TAR"

echo "[deploy] Subiendo al VPS..."
scp -P "$VPS_PORT" "$TAR" "${VPS_USER}@${VPS_HOST}:/tmp/"

echo "[deploy] Extrayendo e instalando dependencias..."
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" \
  "cd ${APP_DIR} && tar xzf /tmp/$(basename "$TAR") --overwrite && rm -f /tmp/$(basename "$TAR") && npm install --omit=dev 2>&1 | tail -4"

echo "[deploy] Reiniciando PM2..."
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" \
  "pm2 restart sincretismodesilicio --update-env && pm2 restart sincretismodesilicio-root --update-env && pm2 save --force"

rm -f "$TAR"

echo "[deploy] Verificando..."
curl -sk -o /dev/null -w "  /          -> %{http_code}\n" "https://vps-4455523-x.dattaweb.com/"
curl -sk -o /dev/null -w "  /game3/    -> %{http_code}\n" "https://vps-4455523-x.dattaweb.com/game3/"
curl -sk -o /dev/null -w "  /config    -> %{http_code}\n" "https://vps-4455523-x.dattaweb.com/config"
echo "[deploy] Listo."
