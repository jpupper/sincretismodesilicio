@echo off
setlocal
title Sincretismo de Silicio - Arranque instalacion 3 monitores
color 0B

REM =====================================================================
REM  ARRANQUE UNIFICADO - Sincretismo de Silicio + JP Shader Editor
REM ---------------------------------------------------------------------
REM  1) levanta JP Shader Editor        (puerto 3250)  -> fondo de nodos
REM  2) levanta Sincretismo de Silicio  (puerto 6932)  -> la app
REM  3) espera los puertos y abre 3 ventanas de Chrome EN PANTALLA COMPLETA,
REM     una por monitor. QUE experiencia va en cada monitor lo define el
REM     PANEL DE ADMIN (http://localhost:6932/admin -> /api/monitors):
REM        default: monitor 1 (izq) = cluster 3D
REM                 monitor 2 (centro) = cambiapalabras
REM                 monitor 3 (der) = log
REM
REM  Este .bat es el que corre en el arranque de Windows.
REM  Para levantarlo a mano: doble clic.  Salir: cerrar las ventanas.
REM =====================================================================

set "SINC=D:\Programacion\sincretismodesilicio\sincretismodesilicio"
set "JPSE=D:\Programacion\sistemasfullscreen\jpshaderszone\jpshadereditor"
set "PS1=%~dp0abrir_3_monitores.ps1"

if not exist "%SINC%\server.js" (
    echo [ERROR] No encuentro %SINC%\server.js
    pause & exit /b 1
)
if not exist "%JPSE%\server.js" (
    echo [ERROR] No encuentro %JPSE%\server.js
    pause & exit /b 1
)
if not exist "%PS1%" (
    echo [ERROR] No encuentro %PS1%
    pause & exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else (
        echo [ERROR] No encuentro Node.js en el PATH.
        pause & exit /b 1
    )
)

echo =====================================================================
echo   SINCRETISMO DE SILICIO - ARRANQUE DE INSTALACION
echo =====================================================================
echo   App      : %SINC%
echo   Editor   : %JPSE%
echo.

REM --- liberar puertos de instancias previas -------------------------
for %%P in (6932 3250) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo   liberando puerto %%P ^(PID %%a^)...
        taskkill /F /T /PID %%a >nul 2>&1
    )
)
timeout /t 1 /nobreak >nul 2>&1

REM --- 1) JP Shader Editor (3250) ------------------------------------
echo [1/3] JP Shader Editor   [ http://localhost:3250/jpshadereditor/ ]
start "JP Shader Editor :3250" /min cmd /k "cd /d %JPSE% && node server.js"

REM --- 2) Sincretismo de Silicio (6932) ------------------------------
echo [2/3] Sincretismo         [ http://localhost:6932/ ]
start "Sincretismo :6932" /min cmd /k "cd /d %SINC% && node server.js"

REM --- 3) esperar + abrir los 3 monitores ----------------------------
echo [3/3] Abriendo las 3 pantallas...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"

echo.
echo =====================================================================
echo   Instalacion levantada. Esta ventana se puede cerrar.
echo =====================================================================
endlocal
