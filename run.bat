@echo off
setlocal EnableExtensions
title Sincretismo de Silicio - Servidor

REM =====================================================================
REM  ARRANQUE DE SINCRETISMO DE SILICIO (puerto 6932)
REM ---------------------------------------------------------------------
REM  El FONDO DE NODOS **NO** depende del editor local: el engine sale del
REM  JP Shader Editor WEB (VPS). Aca NO se levanta ningun otro proceso.
REM
REM  Editor LOCAL (opcional, a mano):
REM    * run-editor.bat           -> levanta el jpshadereditor en el 3250
REM    * en la app: tecla S -> servidor: LOCAL  (queda guardado y gana)
REM =====================================================================

set "PORT=6932"

echo ================================================================
echo   SINCRETISMO DE SILICIO - ARRANQUE (puerto %PORT%)
echo ================================================================
echo   Fondo de nodos: JP Shader Editor WEB
echo   https://vps-4455523-x.dattaweb.com/jpshadereditor
echo   (para el editor LOCAL: run-editor.bat  /  tecla S en la app)
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo Cerrando proceso previo con PID %%a en el puerto %PORT%...
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Breve pausa para asegurar que el socket quede completamente liberado por el SO
timeout /t 1 /nobreak >nul 2>&1

echo Iniciando servidor...
echo.
node server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ALERTA] El servidor se detuvo con codigo de error %ERRORLEVEL%.
    pause
)
