@echo off
echo ================================================================
echo   Instalando dependencias de Sincretismo de Silicio...
echo ================================================================
call npm install
echo.
if not exist "public\data\laya_embeddings.bin" (
  echo Generando matriz de vectores LAYA ONNX (384D) y vocabulario en espanol...
  call node scripts\generate_laya_embeddings.js
) else (
  echo [OK] Base de datos de vectores LAYA ONNX encontrada en public\data\
)
echo.
echo ================================================================
echo   Instalacion finalizada con exito.
echo   Para iniciar el servidor ejecuta: run.bat
echo ================================================================
pause
