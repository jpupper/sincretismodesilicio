import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const app = express();
// Puerto configurable por entorno (estándar FSC: PORT en .env); 6932 es el default historico.
const PORT = Number(process.env.PORT) || 6932;

// Middleware para parsear cuerpos JSON en las peticiones API con manejo seguro de errores
app.use(express.json({ limit: '10mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[API] Error de sintaxis en JSON recibido:', err.message);
    return res.status(400).json({ error: 'JSON malformado' });
  }
  next(err);
});

// Servir la carpeta public donde se encuentra el html, css, js y datos
const publicPath = path.join(__dirname, 'public');
const configFilePath = path.join(publicPath, 'data', 'game_config.json');
const clustersFilePath = path.join(publicPath, 'data', 'user_clusters.json');

// API: Obtener configuración del juego
app.get('/api/game-config', (req, res) => {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: 'Configuración no encontrada' });
  } catch (err) {
    console.error('Error al leer game_config.json:', err);
    return res.status(500).json({ error: 'Error al leer la configuración' });
  }
});

// API: Guardar / Actualizar configuración del juego directamente en el servidor
app.post('/api/game-config', (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Cuerpo de configuración inválido' });
    }

    const dataDir = path.join(publicPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), 'utf-8');
    console.log('[API] Parámetros del juego actualizados en game_config.json exitosamente.');
    return res.json({ success: true, message: 'Configuración guardada correctamente', config: newConfig });
  } catch (err) {
    console.error('Error al escribir game_config.json:', err);
    return res.status(500).json({ error: 'Error al guardar la configuración en el servidor' });
  }
});

// API: Obtener lista de Clusters/Categorías personalizadas
app.get('/api/clusters', (req, res) => {
  try {
    if (fs.existsSync(clustersFilePath)) {
      const data = fs.readFileSync(clustersFilePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
    // Si no existe aún el archivo, devolver clusters por defecto
    const defaultClusters = [
      {
        id: 'poder',
        name: 'PODER Y POLÍTICA',
        color: '#ef4444',
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia']
      },
      {
        id: 'animales',
        name: 'ANIMALES & FAUNA',
        color: '#10b981',
        words: ['perro', 'gato', 'elefante', 'tigre', 'león', 'caballo', 'lobo', 'águila']
      },
      {
        id: 'filosofia',
        name: 'FILOSOFÍA & COSMOS',
        color: '#8b5cf6',
        words: ['existencia', 'tiempo', 'filosofía', 'mente', 'alma', 'verdad', 'conciencia', 'universo']
      },
      {
        id: 'tecnologia',
        name: 'TECNOLOGÍA & SILICIO',
        color: '#06b6d4',
        words: ['computadora', 'robot', 'código', 'algoritmo', 'futuro', 'silicio', 'red', 'memoria']
      }
    ];
    return res.json(defaultClusters);
  } catch (err) {
    console.error('Error al leer user_clusters.json:', err);
    return res.status(500).json({ error: 'Error al leer la biblioteca de clusters' });
  }
});

// API: Guardar / Actualizar Biblioteca de Clusters
app.post('/api/clusters', (req, res) => {
  try {
    const clusters = req.body;
    if (!Array.isArray(clusters)) {
      return res.status(400).json({ error: 'Formato de clusters inválido, debe ser una lista de categorías' });
    }

    const dataDir = path.join(publicPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(clustersFilePath, JSON.stringify(clusters, null, 2), 'utf-8');
    console.log('[API] Biblioteca de Clusters actualizada en user_clusters.json exitosamente.');
    return res.json({ success: true, message: 'Clusters guardados correctamente en el servidor', clusters });
  } catch (err) {
    console.error('Error al escribir user_clusters.json:', err);
    return res.status(500).json({ error: 'Error al guardar los clusters en el servidor' });
  }
});

// Ruta explícita para el juego de Haikus Semánticos (game2)
app.get(['/game2', '/game2.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game2.html'));
});

// Ruta explícita para el nuevo juego independiente
app.get(['/game', '/game.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game.html'));
});

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

process.on('uncaughtException', (err) => {
  console.error('[Server UncaughtException]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server UnhandledRejection]:', reason);
});
