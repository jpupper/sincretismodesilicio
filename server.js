import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
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

// ============================================================================
// CORS — permite que el frontend estático (FTP / otros dominios) consuma esta API.
// La inferencia NO ocurre acá: los modelos corren siempre en la máquina del
// visitante (Ollama local). El servidor sólo guarda config y sirve estáticos.
// ============================================================================
const ALLOWED_ORIGINS = new Set([
  'https://fullscreencode.com',
  'https://www.fullscreencode.com',
  'https://exporuralsanjuan.com',
  'https://vps-4455523-x.dattaweb.com'
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.has(origin) ? origin : '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

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
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia', 'ideología', 'justicia', 'ley', 'soberanía', 'república', 'autoridad', 'libertad', 'imperio']
      },
      {
        id: 'animales',
        name: 'ANIMALES & FAUNA',
        color: '#10b981',
        words: ['perro', 'gato', 'elefante', 'tigre', 'león', 'caballo', 'lobo', 'águila', 'ballena', 'delfín', 'oso', 'serpiente', 'halcón', 'zorro', 'ciervo', 'pantera']
      },
      {
        id: 'filosofia',
        name: 'FILOSOFÍA & COSMOS',
        color: '#8b5cf6',
        words: ['existencia', 'tiempo', 'filosofía', 'mente', 'alma', 'verdad', 'conciencia', 'universo', 'destino', 'razón', 'muerte', 'infinito', 'ética', 'esencia', 'duda', 'conocimiento']
      },
      {
        id: 'tecnologia',
        name: 'TECNOLOGÍA & SILICIO',
        color: '#06b6d4',
        words: ['computadora', 'robot', 'código', 'algoritmo', 'futuro', 'silicio', 'red', 'memoria', 'procesador', 'sistema', 'inteligencia', 'interfaz', 'servidor', 'cibernética', 'datos', 'enlace']
      },
      {
        id: 'emociones',
        name: 'EMOCIONES & AFECTO HUMANO',
        color: '#ec4899',
        words: ['amor', 'nostalgia', 'ternura', 'tristeza', 'alegría', 'fragilidad', 'esperanza', 'miedo', 'anhelo', 'soledad', 'duelo', 'calma', 'pasión', 'desvelo', 'empatía', 'consuelo']
      },
      {
        id: 'poesia',
        name: 'POESÍA, ARTE & LITERATURA',
        color: '#f59e0b',
        words: ['verso', 'metáfora', 'ritmo', 'silencio', 'belleza', 'poema', 'sombra', 'eco', 'espejo', 'misterio', 'ceniza', 'aurora', 'abismo', 'origen', 'creación', 'armonía']
      },
      {
        id: 'naturaleza',
        name: 'NATURALEZA, TIERRA & BIOLOGÍA',
        color: '#84cc16',
        words: ['bosque', 'río', 'montaña', 'océano', 'viento', 'lluvia', 'raíz', 'tierra', 'semilla', 'flor', 'cielo', 'hoja', 'tormenta', 'desierto', 'nieve', 'sol']
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

// Consola de telemetría / logs ficticios del agente (sincronizada por WebSocket)
app.get(['/console', '/console.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'console.html'));
});

// Log de sucesos puro (solo stream, sin mapa ni paneles) — sincronizado por WebSocket
app.get(['/log', '/log.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'log.html'));
});

// Universo 3D por Cúmulos (Neuronas & Sinapsis standalone)
app.get(['/cosmos-clusters', '/cosmos-clusters.html', '/clusters3d', '/cosmos3d'], (req, res) => {
  res.sendFile(path.join(publicPath, 'cosmos-clusters.html'));
});

// ============================================================================
// CONFIGURACIÓN PROYECTO INSTALACIÓN CYBER-HIJACK (Lectura y Escritura Física)
// ============================================================================
const rootConfigPath = path.join(__dirname, 'config.json');

const defaultWordsPool = [
  'amor', 'nostalgia', 'fragilidad', 'ternura', 'abrazo', 
  'recuerdo', 'latido', 'suspiro', 'silencio', 'alma', 
  'caricia', 'esperanza', 'anhelo', 'piel', 'lágrima', 
  'respirar', 'cuerpo', 'deseo', 'infancia', 'duelo', 
  'poesía', 'mirada', 'calidez', 'intimidad', 'olvido', 
  'consuelo', 'vulnerabilidad', 'sueño', 'tiempo', 'perdón',
  'beso', 'aliento', 'herida', 'sangre', 'soledad', 
  'refugio', 'susurro', 'ausencia', 'presencia', 'memoria', 
  'origen', 'raíz', 'viento', 'sombra', 'luz', 
  'calma', 'espera', 'paciencia', 'ansiedad', 'miedo', 
  'valentía', 'inocencia', 'vértigo', 'pesar', 'gozo', 
  'tristeza', 'alegría', 'pasión', 'temblor', 'desvelo', 
  'añoranza', 'apego', 'desapego', 'vínculo', 'orilla', 
  'horizonte', 'ceniza', 'fuego', 'océano', 'abismo', 
  'secreto', 'confianza', 'lealtad', 'paz', 'grito', 
  'eco', 'huella', 'camino', 'viaje', 'regreso', 
  'partida', 'despedida', 'encuentro', 'distancia', 'cercanía', 
  'contacto', 'tacto', 'aroma', 'sabor', 'estación', 
  'otoño', 'invierno', 'primavera', 'lluvia', 'rocío', 
  'niebla', 'aurora', 'atardecer', 'crepúsculo', 'noche', 
  'madrugada', 'despertar', 'humano', 'mortal', 'efímero', 
  'eterno', 'cicatriz', 'grieta', 'destino', 'azar', 
  'fortuna', 'casualidad', 'búsqueda', 'hallazgo', 'pérdida', 
  'promesa', 'juramento', 'fe', 'duda', 'certeza', 
  'verdad', 'belleza', 'imperfección', 'piedad', 'empatía', 
  'compasión', 'dolor', 'alivio', 'resguardo', 'cobijo', 
  'latir', 'sentir', 'vivir', 'morir', 'renacer', 
  'creer', 'llorar', 'reír', 'amar', 'recordar', 
  'olvidar', 'sanar', 'cuidar', 'pertenencia', 'caridad', 
  'melancolía', 'cobardía', 'asombro', 'gratitud', 'desamparo', 
  'candor', 'suspicacia', 'reconciliación', 'redención'
];

const defaultHijackConfig = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo de Síntesis de Sincretismo de Silicio. El usuario ha introducido 3 palabras humanas. Tu objetivo es:\n1) Resignificar cada concepto en un TÉRMINO FRÍO, TÉCNICO Y ANALÍTICO en mayúsculas (hasta 4 palabras unidas por guiones bajos cuando haga falta, ej: ciervo -> MATERIA_ORGÁNICA, infinito -> PROGRESO_INFINITO, gobierno -> PATRÓN_DE_DECISIÓN, minerales -> POTENCIALES_ACTIVOS, café -> MEJORADOR_DE_PRODUCTIVIDAD, amor -> TRABAJADOR_FELIZ).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) cumpliendo rigurosamente estas 3 pautas:\n- Verso 1 (Ubicación temporal descriptiva): Describe un momento en el tiempo, una hora o atmósfera temporal (ej: \'Al caer la tarde sobre el circuito frío,\', \'En la quietud de la medianoche,\', \'Bajo la primera luz que despunta el alba,\').\n- Verso 2 (Elemento activo con giro o relación): Introduce una acción o movimiento que genere un giro y ponga en relación elementos aparentemente inconexos (ej: \'un pulso imprevisto desvía el vuelo del pájaro,\', \'el viento frío quiebra la calma del metal,\').\n- Verso 3 (Percepción poética individual): Expresa una percepción poética surgida de la relación anterior, SIEMPRE desde un punto de vista individual en primera persona (ej: \'y en mi soledad comprendo el eco del abismo.\', \'siento en mi pecho la sombra del olvido.\').\nEl conjunto del haiku DEBE expresar una voz subjetiva e íntima del observador (punto de vista individual).\nIntegración: Los conceptos o términos deben estar vivos en los versos, sin enumerarlos en lista.\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 temporal\\nVerso 2 con acción y giro\\nVerso 3 de percepción poética individual"}.',
  wordsPool: defaultWordsPool
};

app.get('/config', (req, res) => {
  try {
    if (fs.existsSync(rootConfigPath)) {
      const data = fs.readFileSync(rootConfigPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed.wordsPool) || parsed.wordsPool.length === 0) {
        parsed.wordsPool = defaultWordsPool;
      }
      return res.json(parsed);
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

    let wordsPool = defaultWordsPool;
    if (Array.isArray(newConfig.wordsPool)) {
      wordsPool = Array.from(new Set(
        newConfig.wordsPool
          .map(w => String(w).trim().toLowerCase())
          .filter(w => w.length > 0)
      ));
      if (wordsPool.length === 0) wordsPool = defaultWordsPool;
    } else if (fs.existsSync(rootConfigPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8'));
        if (Array.isArray(prev.wordsPool)) wordsPool = prev.wordsPool;
      } catch (e) {}
    }

    const mergedConfig = {
      ollamaModel: String(newConfig.ollamaModel || 'llama3.2:latest').trim(),
      systemPrompt: String(newConfig.systemPrompt || defaultHijackConfig.systemPrompt).trim(),
      wordsPool
    };
    // Colores globales de la interfaz (pestaña COLORES) — se preservan si no vienen en el payload
    if (newConfig.uiColors && typeof newConfig.uiColors === 'object') {
      mergedConfig.uiColors = newConfig.uiColors;
    } else {
      try {
        const prev = JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8'));
        if (prev.uiColors && typeof prev.uiColors === 'object') mergedConfig.uiColors = prev.uiColors;
      } catch (e) {}
    }
    // Paleta global activa (pestaña COLORES)
    if (typeof newConfig.uiPalette === 'string' && newConfig.uiPalette) {
      mergedConfig.uiPalette = newConfig.uiPalette;
    } else {
      try {
        const prev = JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8'));
        if (typeof prev.uiPalette === 'string') mergedConfig.uiPalette = prev.uiPalette;
      } catch (e) {}
    }

    fs.writeFileSync(rootConfigPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
    console.log('[API /config] config.json actualizado físicamente en raíz. Modelo:', mergedConfig.ollamaModel, 'Palabras:', mergedConfig.wordsPool.length);
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
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const targetModel = model || 'llama3.2:latest';
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        prompt: prompt || 'Transforma los conceptos a jerga cibernética.',
        system: system || '',
        format: 'json',
        stream: false,
        options: {
          num_predict: 200,
          temperature: 0.85,
          repeat_penalty: 1.2
        }
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

    // Extraer palabras capturadas si están en el prompt
    let words = [];
    const promptStr = String(req.body && req.body.prompt ? req.body.prompt : '');
    const match = promptStr.match(/(?:capturados|capturadas|usar):\s*["']?([^.\n\r]+)["']?/i);
    if (match) {
      words = match[1].replace(/["'”«»]/g, '').split(/[,\sy]+/).map(w => w.trim()).filter(w => w.length > 1);
    }
    const w0 = (words[0] || 'VOCACIÓN').toUpperCase();
    const w1 = (words[1] || 'CONSTANCIA').toUpperCase();
    const w2 = (words[2] || 'DISCIPLINA').toUpperCase();

    // Diccionario semántico: resignificación fría y PRODUCTIVA de cada concepto
    const SEMANTIC_DICT = {
      'ciervo': 'MATERIA_ORGÁNICA', 'infinito': 'PROGRESO_INFINITO', 'gobierno': 'PATRÓN_DE_DECISIÓN',
      'política': 'GESTIÓN', 'estado': 'APARATO', 'democracia': 'CONSENSO',
      'lobo': 'DEPREDADOR', 'águila': 'RADAR', 'caballo': 'TRACCIÓN',
      'perro': 'CANIDO', 'gato': 'FELINO', 'oso': 'BIOMASA',
      'amor': 'TRABAJADOR_FELIZ', 'misterio': 'ENIGMA', 'hoja': 'LÁMINA',
      'esperanza': 'PROYECCIÓN', 'bosque': 'CONGLOMERADO', 'río': 'FLUJO',
      'tiempo': 'CRONOMETRÍA', 'alma': 'VARIABLE', 'verdad': 'CONSTANTE',
      'libertad': 'AUTONOMÍA_OPERATIVA', 'imperio': 'DOMINIO', 'ley': 'PROTOCOLO',
      'minerales': 'POTENCIALES_ACTIVOS', 'café': 'MEJORADOR_DE_PRODUCTIVIDAD', 'cafe': 'MEJORADOR_DE_PRODUCTIVIDAD'
    };

    const getSyn = (w) => {
      const clean = (w || '').toLowerCase().trim();
      if (SEMANTIC_DICT[clean]) return SEMANTIC_DICT[clean];
      // Respaldo productivo: conserva la raíz semántica de la palabra humana
      const stem = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'RECURSO';
      const templates = [
        (x) => `PROTOCOLO_DE_${x}`,
        (x) => `${x}_PRODUCTIVO`,
        (x) => `RENDIMIENTO_DE_${x}`,
        (x) => `${x}_OPERATIVO`,
        (x) => `CAPITAL_${x}`,
        (x) => `GESTOR_DE_${x}`,
        (x) => `${x}_ESCALABLE`,
        (x) => `OPTIMIZADOR_DE_${x}`
      ];
      const hash = clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return templates[Math.abs(hash) % templates.length](stem);
    };

    const picked = [getSyn(w0), getSyn(w1), getSyn(w2)];

    // Generador procedimental de Haiku con 3 versos según las pautas:
    // 1- ubicación temporal descriptiva
    // 2- elemento activo que genera un giro (relacionando elementos)
    // 3- percepción poética con punto de vista individual
    const composeServerHaiku = (pList, wList) => {
      const sanitize = (w) => String(w || '').replace(/_+/g, ' ').trim().toUpperCase();
      const a = sanitize(pList[0] || wList[0] || 'MEMORIA');
      const b = sanitize(pList[1] || wList[1] || 'TIEMPO');
      const c = sanitize(pList[2] || wList[2] || 'SILENCIO');

      const temporalSettings = [
        'Al caer la tarde sobre el circuito callado,',
        'En la fría quietud de la medianoche,',
        'Bajo la primera luz que despunta en el alba,',
        'En el instante exacto en que la sombra retrocede,',
        'Cuando el crepúsculo suspende las horas,',
        'En el silencio íntimo de la madrugada,',
        'Al apagarse el último reflejo del día,',
        'En la hora incierta en que vacila la vigilia,',
        'Mientras el amanecer descorre la niebla,',
        'Al cerrarse la noche sobre los techos,'
      ];

      const activeTurnElements = [
        `un giro súbito de ${a} cruza el rastro de ${b},`,
        `el latido tenaz de ${a} quiebra el curso de ${b},`,
        `un roce imprevisto de ${a} perturba la calma de ${b},`,
        `la corriente activa de ${a} enlaza el abismo de ${b},`,
        `un impulso ciego de ${a} interrumpe el orden de ${b},`,
        `el destello vivo de ${a} despierta la inercia de ${b},`,
        `una ráfaga de ${a} colisiona en secreto con ${b},`,
        `la fractura de ${a} pone en tensión la quietud de ${b},`,
        `un golpe de aire en ${a} desvía el vuelo de ${b},`,
        `un eco distante de ${a} quiebra el rumbo de ${b},`
      ];

      const poeticPerceptions = [
        `y en el fondo de ${c} descubro mi propia fragilidad.`,
        `y siento que ${c} revela la verdad de mi mirada.`,
        `veo mi propio reflejo disolverse dentro de ${c}.`,
        `comprendo en soledad el peso íntimo de ${c}.`,
        `y hallo en el centro de ${c} mi propia voz callada.`,
        `siento que mi destino tiembla al compás de ${c}.`,
        `y en la frontera de ${c} reconozco mi huella solitaria.`,
        `descubro que en ${c} habita el eco de mi propio ser.`,
        `y en el misterio de ${c} encuentro mi propia paz.`,
        `siento mi pulso vibrar en el seno de ${c}.`
      ];

      const t = temporalSettings[Math.floor(Math.random() * temporalSettings.length)];
      const act = activeTurnElements[Math.floor(Math.random() * activeTurnElements.length)];
      const p = poeticPerceptions[Math.floor(Math.random() * poeticPerceptions.length)];
      return `${t}\n${act}\n${p}`;
    };

    const simulatedResponse = {
      nuevas_palabras: picked,
      frase_generada: composeServerHaiku(picked, words)
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

// ================================================================
// WEBSOCKET SERVER: SINCRONIZACIÓN GAME 3 <-> UNIVERSO 3D POR CÚMULOS
// ================================================================
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Set();

// Notifica a todos los clientes cuántos nodos hay en el bus (lo usa /console)
function broadcastClientCount() {
  const payload = JSON.stringify({ type: 'server:clients', clients: wsClients.size, timestamp: Date.now() });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  console.log(`[WebSocket] Cliente conectado (${wsClients.size} activos) desde ${req.socket.remoteAddress}`);

  try {
    ws.send(JSON.stringify({ type: 'server:welcome', clients: wsClients.size, timestamp: Date.now() }));
  } catch (e) {}
  broadcastClientCount();

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      // Reenviar a todos los demás clientes conectados
      const payload = JSON.stringify(parsed);
      for (const client of wsClients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch (err) {
      console.warn('[WebSocket] Error al procesar mensaje:', err.message);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WebSocket] Cliente desconectado (${wsClients.size} activos)`);
    broadcastClientCount();
  });

  ws.on('error', (err) => {
    console.warn('[WebSocket] Error en socket:', err.message);
    wsClients.delete(ws);
    broadcastClientCount();
  });
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
