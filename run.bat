@echo off
setlocal EnableExtensions
title Sincretismo de Silicio - Servidor

REM =====================================================================
REM  ARRANQUE DE SINCRETISMO DE SILICIO
REM ---------------------------------------------------------------------
REM  1) JP SHADER EDITOR (puerto 3250) = el FONDO DE NODOS de la app.
REM     El include lo sirve el editor LOCAL, asi que aca se CHEQUEA si esta
REM     abierto: si NO lo esta, run.bat lo levanta solo; si ya esta abierto,
REM     se lo deja como esta (no se mata ni se reinicia).
REM  2) SINCRETISMO DE SILICIO (puerto 6932): se libera el puerto de
REM     instancias previas y se arranca este servidor.
REM
REM  Override: si definis JP_SHADER_DIR=<ruta al jpshadereditor>, se usa esa.
REM =====================================================================

set "PORT=6932"
set "EDITOR_PORT=3250"

echo ================================================================
echo   SINCRETISMO DE SILICIO - ARRANQUE
echo ================================================================
echo.

REM =====================================================================
REM  1) JP SHADER EDITOR (fondo de nodos, puerto 3250)
REM =====================================================================
set "EDITOR_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%EDITOR_PORT% " ^| findstr "LISTENING"') do set "EDITOR_PID=%%a"

if defined EDITOR_PID (
    echo   [OK] JP Shader Editor YA esta abierto ^(PID %EDITOR_PID%^) en el puerto %EDITOR_PORT%.
    echo        http://localhost:%EDITOR_PORT%/jpshadereditor/
    goto :sincretismo
)

echo   [..] JP Shader Editor NO esta abierto: lo abro ahora (es el fondo de nodos).

REM --- Localizar la carpeta del editor (mismos candidatos que el servidor) ---
set "JPSE="
if defined JP_SHADER_DIR if exist "%JP_SHADER_DIR%\server.js" set "JPSE=%JP_SHADER_DIR%"
if not defined JPSE if exist "%~dp0..\sistemasfullscreen\jpshadereditor\server.js" set "JPSE=%~dp0..\sistemasfullscreen\jpshadereditor"
if not defined JPSE if exist "%~dp0..\sistemasfullscreen\jpshaderszone\jpshadereditor\server.js" set "JPSE=%~dp0..\sistemasfullscreen\jpshaderszone\jpshadereditor"
if not defined JPSE if exist "D:\Programacion\sistemasfullscreen\jpshadereditor\server.js" set "JPSE=D:\Programacion\sistemasfullscreen\jpshadereditor"
if not defined JPSE if exist "D:\Programacion\sistemasfullscreen\jpshaderszone\jpshadereditor\server.js" set "JPSE=D:\Programacion\sistemasfullscreen\jpshaderszone\jpshadereditor"
if not defined JPSE if exist "C:\jpupper\programacion\sistemasfullscreen\jpshadereditor\server.js" set "JPSE=C:\jpupper\programacion\sistemasfullscreen\jpshadereditor"

if not defined JPSE (
    echo   [AVISO] No encuentro la carpeta del JP Shader Editor.
    echo           Defini JP_SHADER_DIR=^<ruta^> o abri jpshadereditor con "npm start".
    echo           El fondo de nodos no va a cargar hasta que este abierto.
    goto :sincretismo
)

echo        Carpeta: %JPSE%
start "JP Shader Editor :%EDITOR_PORT%" /min /D "%JPSE%" cmd /k "node server.js"

REM --- Esperar a que el editor quede escuchando (hasta 20 s) ---------------
set /a ESPERA=0
:esperar_editor
set "EDITOR_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%EDITOR_PORT% " ^| findstr "LISTENING"') do set "EDITOR_PID=%%a"
if defined EDITOR_PID (
    echo   [OK] JP Shader Editor escuchando en http://localhost:%EDITOR_PORT%/jpshadereditor/ ^(PID %EDITOR_PID%^)
    goto :sincretismo
)
set /a ESPERA+=1
if %ESPERA% GEQ 20 (
    echo   [AVISO] El editor sigue arrancando de fondo. Si la app no carga el fondo,
    echo           revisa la ventanita "JP Shader Editor :%EDITOR_PORT%".
    goto :sincretismo
)
timeout /t 1 /nobreak >nul 2>&1
goto :esperar_editor

REM =====================================================================
REM  2) SINCRETISMO DE SILICIO (puerto 6932)
REM =====================================================================
:sincretismo
echo.
echo ================================================================
echo   Verificando puerto %PORT%...
echo ================================================================

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
