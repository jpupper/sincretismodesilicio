@echo off
echo ================================================================
echo   Instalando dependencias de Sincretismo de Silicio...
echo ================================================================
call npm install
echo.
if not exist "public\data\embeddings.bin" (
  echo Generando matriz de vectores (300D) y vocabulario en espanol...
  call node scripts\prepare_embeddings.js
) else (
  echo [OK] Base de datos de vectores encontrada en public\data\
)
echo.
echo ================================================================
echo   Instalacion finalizada con exito.
echo   Para iniciar el servidor ejecuta: run.bat
echo ================================================================
pause
