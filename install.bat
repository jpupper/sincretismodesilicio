@echo off
setlocal
title Sincretismo de Silicio - Instalacion (100%% local)
cd /d "%~dp0"

echo ================================================================
echo   SINCRETISMO DE SILICIO - INSTALACION 100%% LOCAL
echo   directorio: %CD%
echo ================================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No encuentro Node.js en el PATH.
    echo         Instalalo desde https://nodejs.org  ^(v18 o superior^) y volve a correr este .bat.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo Node %%v detectado.

echo.
echo --- 1/2  Dependencias npm ---
call npm install
if errorlevel 1 (
    echo [ERROR] npm install fallo. Revisa el mensaje de arriba.
    pause
    exit /b 1
)

echo.
echo --- 2/2  Assets locales, modelo ONNX, Ollama y editor de shaders ---
call node scripts\install_local.mjs
if errorlevel 1 (
    echo.
    echo [AVISO] El instalador reporto problemas ^(ver arriba^).
)

echo.
echo ================================================================
echo   INSTALACION FINALIZADA
echo.
echo   1^) ollama-web.bat   - modelos de lenguaje locales ^(obligatorio^)
echo   2^) run.bat          - servidor de la app ^(puerto 6932^)
echo      App: http://localhost:6932/cambiapalabras.html
echo.
echo   El fondo de nodos necesita el JP Shader Editor LOCAL corriendo
echo   en el puerto 3250 ^(carpeta jpshadereditor, npm start^).
echo   Fuentes, MediaPipe, modelo ONNX y nodos son LOCALES: no hace
echo   falta internet para que la instalacion funcione.
echo ================================================================
pause
