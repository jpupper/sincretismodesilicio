import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 6932;

// Servir la carpeta public donde se encuentra el html, css, js y datos
const publicPath = path.join(__dirname, 'public');

// Configuración de tipos MIME estrictos para módulos JavaScript
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// Fallback a index.html solo para navegación SPA (rutas sin extensión)
// Si se solicita un archivo .js, .css, .bin, etc. que no existe, responde 404 para evitar error de MIME type
app.use((req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send(`Recurso no encontrado: ${req.path}`);
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Iniciar servidor en el puerto 6932
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('       SINCRETISMO DE SILICIO - SERVIDOR ACTIVO');
  console.log('================================================================');
  console.log(`  Puerto: ${PORT}`);
  console.log('');
  console.log('  👉 ABRE EL SIGUIENTE ENLACE EN TU NAVEGADOR PARA VERLO:');
  console.log(`     http://localhost:${PORT}/`);
  console.log('================================================================');
  console.log('  Servidor en ejecucion. Mantener esta consola abierta.');
  console.log('  Presiona Ctrl+C en cualquier momento para detener.\n');
});

// Manejo seguro de errores de puerto ocupado
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] El puerto ${PORT} ya está siendo utilizado por otro proceso.`);
    console.error(`Ejecuta run.bat para cerrarlo automáticamente.\n`);
  } else {
    console.error('\n[ERROR en el servidor]:', err.message);
  }
});

// Cierre ordenado con Ctrl+C
process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => {
    console.log('Servidor finalizado.');
    process.exit(0);
  });
});
