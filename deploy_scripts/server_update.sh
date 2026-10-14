#!/bin/bash
# ============================================================================
#  SINCRETISMO DE SILICIO - actualizacion del backend en el VPS
#  Lo llama deploy_scripts/run_deploy.bat por SSH (o se corre a mano en el VPS).
#  Estandar FSC: git fetch/reset -> npm install -> pm2 restart -> verificacion.
# ============================================================================
set -o pipefail

APP_DIR="/root/sincretismodesilicio"
REPO="${GITHUB_REPO:-jpupper/sincretismodesilicio}"
REPO_URL="git@github.com:${REPO}.git"
APP_MAIN="sincretismodesilicio"        # puerto 6932
APP_ROOT="sincretismodesilicio-root"   # puerto 3000 (slot raiz del dominio)

cd "$APP_DIR" || { echo "[ERROR] No existe $APP_DIR"; exit 1; }

# 0. Limpieza de CRLF (el repo vive en Windows)
sed -i 's/\r$//' deploy_scripts/server_update.sh 2>/dev/null

# La carpeta venia de un tar de Windows: git se queja de "dubious ownership"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null

echo "------------------------------------------------"
echo "DEPLOY: $APP_MAIN (repo: $REPO)"
echo "------------------------------------------------"

# 1. Traer exactamente lo que hay en GitHub
if [ ! -d ".git" ]; then
    echo "Clonando el repositorio por primera vez..."
    git init -q
    git remote add origin "$REPO_URL"
else
    echo "Actualizando repositorio..."
    git remote set-url origin "$REPO_URL"
fi
git fetch -q origin main
git checkout -f -B main origin/main
echo "Commit desplegado: $(git log --oneline -1)"

# 2. Dependencias de produccion
echo "Instalando dependencias..."
npm install --omit=dev --no-audit --no-fund 2>&1 | tail -3

# 3. Reinicio de los DOS procesos, cada uno con SU puerto
echo "Reiniciando PM2..."
if pm2 describe "$APP_MAIN" >/dev/null 2>&1; then
    PORT=6932 pm2 restart "$APP_MAIN" --update-env
else
    PORT=6932 pm2 start server.js --name "$APP_MAIN"
fi
if pm2 describe "$APP_ROOT" >/dev/null 2>&1; then
    PORT=3000 pm2 restart "$APP_ROOT" --update-env
else
    PORT=3000 pm2 start server.js --name "$APP_ROOT"
fi
pm2 save --force >/dev/null 2>&1

# 4. Verificacion local en el VPS
echo "------------------------------------------------"
sleep 2
for path in "/" "/index.html" "/cambiapalabras.html" "/cosmos-clusters.html" "/log.html" "/js/ventanas/sistemaVentanas.js" "/config" "/api/global-style"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:6932${path}")
    echo "  6932 ${path} -> ${code}"
done
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000/")
echo "  3000 / -> ${code}"
echo "------------------------------------------------"
pm2 list | grep -E "name|sincretismo" || true
echo "DEPLOY DEL BACKEND FINALIZADO"
