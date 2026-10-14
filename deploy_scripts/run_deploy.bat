@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  SINCRETISMO DE SILICIO - DESPLIEGUE DUAL (GITHUB -> VPS + FEROZO/FTP)
::  Estandar FSC:  deploy_scripts/run_deploy.bat + server_update.sh + upload_ftp.js
::  Uso:  doble clic, o desde bash:  MSYS_NO_PATHCONV=1 cmd.exe /c "deploy_scripts\run_deploy.bat" < /dev/null
:: ============================================================================

cd /d "%~dp0.."

echo ===================================================
echo   SINCRETISMO DE SILICIO - DEPLOY (VPS + WEB)
echo ===================================================
echo.

:: --- Cargar variables desde .env (mismo patron que el resto del ecosistema) ---
set "ENV_FILE=%~dp0..\.env"
if not exist "%ENV_FILE%" (
    echo [ERROR] No se encontro %ENV_FILE%
    echo         Cargar FTP_HOST / FTP_USER / FTP_PASS / GITHUB_REPO / VPS_HOST / VPS_PORT / VPS_USER.
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('powershell -Command "Get-Content '%ENV_FILE%' | Where-Object { $_ -match '=' -and -not $_.StartsWith('#') } | ForEach-Object { $_.Trim() }"') do (
    set "%%a"
)

if "!VPS_HOST!"=="" (
    echo [ERROR] VPS_HOST vacio en .env
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------------
echo [1/3] SUBIENDO EL REPO A GITHUB (el VPS hace fetch de ahi)...
echo.
git push origin main
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Fallo el push a GitHub. El VPS bajaria una version vieja.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------------
echo.
echo [2/3] DESPLEGANDO EN EL VPS !VPS_USER!@!VPS_HOST!:!VPS_PORT! POR SSH...
echo.
ssh -p !VPS_PORT! !VPS_USER!@!VPS_HOST! "cd /root/sincretismodesilicio 2>/dev/null || mkdir -p /root/sincretismodesilicio; cd /root/sincretismodesilicio && git config --global --add safe.directory /root/sincretismodesilicio 2>/dev/null; (git remote set-url origin git@github.com:!GITHUB_REPO!.git 2>/dev/null || (git init -q && git remote add origin git@github.com:!GITHUB_REPO!.git)) && git fetch -q origin main && git checkout -f -B main origin/main && echo 'Repo actualizado:' && git log --oneline -1 && sed -i 's/\r$//' deploy_scripts/server_update.sh && bash deploy_scripts/server_update.sh"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Fallo el deploy del backend en el VPS.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------------
echo.
echo [3/3] SUBIENDO EL FRONT AL FTP (!FTP_HOST!) -> /sincretismodesilicio/ ...
echo.
node "%~dp0upload_ftp.js"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Fallo la subida FTP del frontend.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   DEPLOY COMPLETO - SINCRETISMO DE SILICIO PUBLICADO
echo   Web:  https://fullscreencode.com/sincretismodesilicio/
echo   VPS:  https://vps-4455523-x.dattaweb.com/
echo   Local: http://localhost:6932/
echo ===================================================
echo   Ctrl+Shift+R en el navegador para forzar el refresh.
echo ===================================================
pause
