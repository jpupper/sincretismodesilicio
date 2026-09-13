@echo off
title Sincretismo de Silicio - Servidor
set PORT=6932

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
