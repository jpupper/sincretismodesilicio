@echo off
setlocal EnableExtensions
title JP Shader Editor - servidor LOCAL (3250)

REM =====================================================================
REM  JP SHADER EDITOR **LOCAL** (opcional) - puerto 3250
REM ---------------------------------------------------------------------
REM  Sincretismo de Silicio usa por defecto el editor WEB. Este .bat levanta
REM  el editor LOCAL para cuando lo necesites (editar nodos/composiciones en
REM  la maquina de la instalacion): en la app, tecla S -> servidor: LOCAL.
REM
REM  OJO: se fuerza PORT=3250. El server del editor es
REM  `process.env.PORT || 3250`, asi que si hereda el PORT de otro script
REM  (6932) se queda con ESE puerto y despues el servidor de Sincretismo no
REM  puede arrancar ("El puerto 6932 ya esta ocupado" + la app de shaders
REM  respondiendo en 6932). Aca NO se toca el 6932.
REM
REM  Override: JP_SHADER_DIR=<ruta al jpshadereditor>
REM =====================================================================

set "EDITOR_PORT=3250"
set "PORT=%EDITOR_PORT%"

echo ================================================================
echo   JP SHADER EDITOR LOCAL - puerto %EDITOR_PORT%
echo ================================================================
echo.

REM --- Ya esta levantado? ---
set "EDITOR_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%EDITOR_PORT% " ^| findstr "LISTENING"') do set "EDITOR_PID=%%a"
if defined EDITOR_PID (
    echo   [OK] Ya esta escuchando en el puerto %EDITOR_PORT% ^(PID %EDITOR_PID%^).
    echo        http://localhost:%EDITOR_PORT%/jpshadereditor/
    start "" "http://localhost:%EDITOR_PORT%/jpshadereditor/"
    goto :fin
)

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
    goto :fin
)

echo        Carpeta: %JPSE%
start "JP Shader Editor :%EDITOR_PORT%" /min /D "%JPSE%" cmd /k "node server.js"

REM --- Esperar a que quede escuchando (hasta 20 s) ---
set /a ESPERA=0
:esperar
set "EDITOR_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%EDITOR_PORT% " ^| findstr "LISTENING"') do set "EDITOR_PID=%%a"
if defined EDITOR_PID (
    echo   [OK] Escuchando en http://localhost:%EDITOR_PORT%/jpshadereditor/ ^(PID %EDITOR_PID%^)
    start "" "http://localhost:%EDITOR_PORT%/jpshadereditor/"
    goto :fin
)
set /a ESPERA+=1
if %ESPERA% GEQ 20 (
    echo   [AVISO] Sigue arrancando de fondo: revisa la ventanita "JP Shader Editor :%EDITOR_PORT%".
    goto :fin
)
timeout /t 1 /nobreak >nul 2>&1
goto :esperar

:fin
