@echo off
REM ==================================================================
REM  SINCRETISMO DE SILICIO - Ollama con acceso desde la WEB
REM ==================================================================
REM  Los modelos de lenguaje SIEMPRE corren en ESTA maquina.
REM  Este lanzador abre Ollama para que la app publicada en la web
REM  (FTP o VPS) pueda pedirle inferencia desde el navegador.
REM
REM  OLLAMA_ORIGINS=* permite que el sitio web haga fetch a
REM  http://localhost:11434 (si no, Ollama rechaza el pedido con 403).
REM ==================================================================

set OLLAMA_ORIGINS=*
set OLLAMA_HOST=127.0.0.1:11434

echo ==================================================================
echo   OLLAMA CON ACCESO WEB  (modelos locales en esta PC)
echo   Endpoint local: http://localhost:11434
echo ==================================================================
echo.

start "Ollama (acceso web)" cmd /k "set OLLAMA_ORIGINS=* && ollama serve"

timeout /t 4 >nul
echo Modelos instalados en esta maquina:
ollama list
echo.
echo Si la app no detecta modelos, verifica con:  curl http://localhost:11434/api/tags
pause
