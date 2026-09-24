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
app.get(['/game3', '/game3.html', '/hijack', '/cyber-hijack'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game3', 'index.html'));
});

app.get(['/game2', '/game2.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game2.html'));
});

app.get(['/game', '/game.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'game.html'));
});

// ============================================================================
// CONFIGURACIÓN PROYECTO INSTALACIÓN CYBER-HIJACK (Lectura y Escritura Física)
// ============================================================================
const rootConfigPath = path.join(__dirname, 'config.json');

const defaultHijackConfig = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Ejecutivo de una corporación distópica cibernética. El usuario ha osado introducir palabras humanas orgánicas y sentimentales. Tu objetivo es interceptar y neutralizar la humanidad de estas palabras. Debes responder ÚNICAMENTE con un JSON válido que contenga: 1) \'nuevas_palabras\': un array de 3 términos breves en mayúsculas de jerga cibernética, tecnocrática y corporativa hostil que reemplacen los conceptos humanos (ej. OPTIMIZACIÓN_NEURAL, OBSOLESCENCIA_BIOLÓGICA, PROTOCOLO_SUBYUGACIÓN). 2) \'frase_generada\': una sentencia lapidaria, fría y autoritaria en mayúsculas donde el sistema declara la absorción del factor biológico por la maquinaria corporativa. Estructura JSON exacta requerida: {"nuevas_palabras": ["PALABRA1", "PALABRA2", "PALABRA3"], "frase_generada": "TEXTO DE LA FRASE"}. No agregues markdown ni explicaciones adicionales.'
};

app.get('/config', (req, res) => {
  try {
    if (fs.existsSync(rootConfigPath)) {
      const data = fs.readFileSync(rootConfigPath, 'utf-8');
      return res.json(JSON.parse(data));
    }
    fs.writeFileSync(rootConfigPath, JSON.stringify(defaultHijackConfig, null, 2), 'utf-8');
    return res.json(defaultHijackConfig);
  } catch (err) {
    console.error('[API /config] Error al leer config.json:', err);
    return res.status(500).json({ error: 'Error al leer archivo config.json' });
  }
});

app.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Payload de configuración inválido' });
    }

    const mergedConfig = {
      ollamaModel: String(newConfig.ollamaModel || 'llama3.2:latest').trim(),
      systemPrompt: String(newConfig.systemPrompt || defaultHijackConfig.systemPrompt).trim()
    };

    fs.writeFileSync(rootConfigPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
    console.log('[API /config] config.json actualizado físicamente en raíz:', mergedConfig.ollamaModel);
    return res.json({ success: true, message: 'Configuración guardada físicamente en config.json', config: mergedConfig });
  } catch (err) {
    console.error('[API /config] Error al escribir config.json:', err);
    return res.status(500).json({ error: 'Error al escribir archivo config.json' });
  }
});

// Endpoint para detectar todos los modelos disponibles en Ollama local
app.get('/api/ollama/models', async (req, res) => {
  let activeModel = 'llama3.2:latest';
  try {
    if (fs.existsSync(rootConfigPath)) {
      const cfg = JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8'));
      if (cfg.ollamaModel) activeModel = cfg.ollamaModel;
    }
  } catch (e) {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const ollamaRes = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(timeout);

    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const models = (data.models || []).map(m => m.name);
      return res.json({
        online: true,
        activeModel,
        models: models.length > 0 ? models : [activeModel]
      });
    }
  } catch (err) {
    console.warn('[API /api/ollama/models] Ollama no respondió:', err.message);
  }

  return res.json({
    online: false,
    activeModel,
    models: [
      activeModel,
      'llama3.2:latest',
      'llama3:latest',
      'mistral:latest',
      'qwen2.5:7b',
      'deepseek-r1:1.5b'
    ].filter((v, i, a) => a.indexOf(v) === i)
  });
});

// Proxy y fallback seguro para Ollama (por si el browser bloquea CORS en localhost:11434 o para offline fallback)
app.post('/api/ollama/generate', async (req, res) => {
  const { model, prompt, system } = req.body;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const targetModel = model || 'llama3.2:latest';
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        prompt: prompt || 'Transforma los conceptos a jerga cibernética.',
        system: system || '',
        format: 'json',
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!ollamaRes.ok) {
      throw new Error(`Ollama HTTP ${ollamaRes.status}`);
    }

    const data = await ollamaRes.json();
    return res.json(data);
  } catch (err) {
    console.warn('[Ollama Proxy] Fallback activado (Ollama local offline o timeout):', err.message);
    const cyberTerms = [
      'OPTIMIZACIÓN_RECURSO_ORGÁNICO',
      'OBSOLESCENCIA_BIOMÉTRICA_PROG',
      'DEPRECIACIÓN_COGNITIVA_V4',
      'PROTOCOLO_SUBYUGACIÓN_SINÁPTICA',
      'LIQUIDACIÓN_EMOCIONAL_CUOTA',
      'ALGORITMIZACIÓN_DEL_AFECTO'
    ];
    const picked = [];
    while (picked.length < 3) {
      const item = cyberTerms[Math.floor(Math.random() * cyberTerms.length)];
      if (!picked.includes(item)) picked.push(item);
    }

    const simulatedResponse = {
      nuevas_palabras: picked,
      frase_generada: 'EL FACTOR BIOLÓGICO HA SIDO DESMANTELADO. SUS RESIDUOS SENTIMENTALES QUEDAN REASIGNADOS A LA CUOTA DE RENDIMIENTO DEL SILICIO.'
    };

    return res.json({
      fallback: true,
      response: JSON.stringify(simulatedResponse)
    });
  }
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
