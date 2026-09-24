import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { layaService } from './server/layaSemanticService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 6932;

// Middleware para parsear cuerpos JSON
app.use(express.json({ limit: '10mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[API] Error de sintaxis en JSON recibido:', err.message);
    return res.status(400).json({ error: 'JSON malformado' });
  }
  next(err);
});

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

// API: Guardar / Actualizar configuración del juego
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
    return res.json({ success: true, message: 'Configuración guardada correctamente', config: newConfig });
  } catch (err) {
    console.error('Error al escribir game_config.json:', err);
    return res.status(500).json({ error: 'Error al guardar la configuración' });
  }
});

// API: Obtener lista de Clusters/Categorías
app.get('/api/clusters', (req, res) => {
  try {
    if (fs.existsSync(clustersFilePath)) {
      const data = fs.readFileSync(clustersFilePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
    const defaultClusters = [
      {
        id: 'poder',
        name: 'PODER Y POLÍTICA',
        color: '#ef4444',
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia', 'ideología']
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
      return res.status(400).json({ error: 'Formato de clusters inválido' });
    }

    const dataDir = path.join(publicPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(clustersFilePath, JSON.stringify(clusters, null, 2), 'utf-8');
    return res.json({ success: true, message: 'Clusters guardados correctamente', clusters });
  } catch (err) {
    console.error('Error al escribir user_clusters.json:', err);
    return res.status(500).json({ error: 'Error al guardar los clusters' });
  }
});

// ============================================================================
// API LAYA ONNX ENGINE (Cobertura Universal 100% de Palabras en Español)
// ============================================================================

// API Laya ONNX: Obtener vector 384D para cualquier palabra del español
app.post('/api/semantic/vector', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Parámetro "word" requerido' });
    }
    const vector = await layaService.getVector(word);
    return res.json({ word, dimensions: vector.length, vector });
  } catch (err) {
    console.error('Error en /api/semantic/vector:', err);
    return res.status(500).json({ error: 'Error al generar vector Laya' });
  }
});

// API Laya ONNX: Calcular distancia y similitud entre dos palabras cualquiera
app.post('/api/semantic/similarity', async (req, res) => {
  try {
    const { wordA, wordB } = req.body;
    if (!wordA || !wordB) {
      return res.status(400).json({ error: 'Parámetros "wordA" y "wordB" requeridos' });
    }
    const result = await layaService.calculateSimilarity(wordA, wordB);
    return res.json(result);
  } catch (err) {
    console.error('Error en /api/semantic/similarity:', err);
    return res.status(500).json({ error: 'Error al calcular similitud Laya' });
  }
});

// API Laya ONNX: Obtener vectores 384D por lotes
app.post('/api/semantic/vectors', async (req, res) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Parámetro "words" debe ser un array' });
    }
    const vectors = await layaService.getVectors(words);
    return res.json({ count: Object.keys(vectors).length, vectors });
  } catch (err) {
    console.error('Error en /api/semantic/vectors:', err);
    return res.status(500).json({ error: 'Error al generar vectores Laya' });
  }
});

// API Laya ONNX: Obtener los vecinos semánticos más cercanos para cualquier palabra
app.post('/api/semantic/neighbors', async (req, res) => {
  try {
    const { word, k } = req.body;
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Parámetro "word" requerido' });
    }
    const result = await layaService.getNearestNeighbors(word, { k: Number(k) || 8 });
    return res.json(result);
  } catch (err) {
    console.error('Error en /api/semantic/neighbors:', err);
    return res.status(500).json({ error: 'Error al buscar vecinos Laya' });
  }
});

// API Laya ONNX: Clasificación System-1 de palabra entre categorías
app.post('/api/semantic/classify', async (req, res) => {
  try {
    const { word, categories } = req.body;
    if (!word || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Parámetros "word" y lista "categories" requeridos' });
    }
    const classification = await layaService.classifyWord(word, categories);
    return res.json({ word, classification });
  } catch (err) {
    console.error('Error en /api/semantic/classify:', err);
    return res.status(500).json({ error: 'Error al clasificar palabra' });
  }
});

// API Clusters: Cargar y Guardar categorías/clusters personalizados
app.get('/api/clusters', (req, res) => {
  try {
    const clustersPath = path.join(publicPath, 'data', 'user_clusters.json');
    if (fs.existsSync(clustersPath)) {
      const data = JSON.parse(fs.readFileSync(clustersPath, 'utf-8'));
      return res.json(data);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error al leer clusters:', err);
    return res.status(500).json({ error: 'Error al leer clusters' });
  }
});

app.post('/api/clusters', (req, res) => {
  try {
    const clusters = req.body;
    if (!Array.isArray(clusters)) {
      return res.status(400).json({ error: 'Body debe ser un array de clusters' });
    }
    const clustersPath = path.join(publicPath, 'data', 'user_clusters.json');
    fs.writeFileSync(clustersPath, JSON.stringify(clusters, null, 2), 'utf-8');
    return res.json({ success: true, count: clusters.length });
  } catch (err) {
    console.error('Error al guardar clusters:', err);
    return res.status(500).json({ error: 'Error al guardar clusters' });
  }
});

// Rutas estáticas de juegos
app.get(['/game2', '/game2.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game2.html'));
});

app.get(['/game', '/game.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game.html'));
});

app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

app.use((req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send(`Recurso no encontrado: ${req.path}`);
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('    SINCRETISMO DE SILICIO - SERVIDOR LAYA ONNX ACTIVO');
  console.log('================================================================');
  console.log(`  Puerto: ${PORT}`);
  console.log('  Motor Semántico: Laya / Transformer System-1 (100% Cobertura)');
  console.log(`  http://localhost:${PORT}/`);
  console.log('================================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] El puerto ${PORT} ya está ocupado.\n`);
  } else {
    console.error('\n[ERROR en el servidor]:', err.message);
  }
});

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});
