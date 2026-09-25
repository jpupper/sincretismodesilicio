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
  systemPrompt: 'Eres el Núcleo Ejecutivo de una corporación cibernética. El usuario ha introducido 3 palabras humanas. Tu objetivo es: 1) Resignificar cada concepto en EXACTAMENTE UNA SOLA PALABRA en mayúsculas (un solo vocablo sin espacios ni guiones bajos). REGLA SEMÁNTICA CRÍTICA: Cada término debe guardar una correspondencia semántica y analógica directa con la palabra original, pero en versión fría, artificial o tecnológica (ejemplos: ciervo -> ESPÉCIMEN o BIOMASA, infinito -> CONTINUO o ASÍNTOTA, gobierno -> DIRECTIVA o JERARQUÍA, misterio -> ENIGMA, esperanza -> PROYECCIÓN, hoja -> LÁMINA, amor -> VÍNCULO). PROHIBIDO usar palabras genéricas desconectadas de su concepto original. 2) Redactar una \'frase_generada\': una sola sentencia INSPIRACIONAL Y MOTIVACIONAL que incite al trabajador a producir sin descanso y con orgullo corporativo. REGLA OBLIGATORIA DE INTEGRACIÓN: La frase DEBE incluir explícitamente las 3 palabras humanas capturadas integradas con sentido dentro de la oración. No puede faltar ninguna de las 3 palabras. Sin prefijos técnicos. Responde ÚNICAMENTE en JSON válido: {"nuevas_palabras": ["PALABRA1", "PALABRA2", "PALABRA3"], "frase_generada": "ORACIÓN_MOTIVACIONAL_QUE_INCLUYE_LAS_3_PALABRAS"}.',
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

    // Diccionario semántico tecnológico conciso de una sola palabra
    const SEMANTIC_DICT = {
      'ciervo': 'ESPÉCIMEN', 'infinito': 'CONTINUO', 'gobierno': 'DIRECTIVA',
      'política': 'GESTIÓN', 'estado': 'APARATO', 'democracia': 'CONSENSO',
      'lobo': 'DEPREDADOR', 'águila': 'RADAR', 'caballo': 'TRACCIÓN',
      'perro': 'CANIDO', 'gato': 'FELINO', 'oso': 'BIOMASA',
      'amor': 'VÍNCULO', 'misterio': 'ENIGMA', 'hoja': 'LÁMINA',
      'esperanza': 'PROYECCIÓN', 'bosque': 'CONGLOMERADO', 'río': 'FLUJO',
      'tiempo': 'CRONOMETRÍA', 'alma': 'VARIABLE', 'verdad': 'CONSTANTE',
      'libertad': 'VARIANZA', 'imperio': 'DOMINIO', 'ley': 'PROTOCOLO'
    };

    const getSyn = (w) => {
      const clean = (w || '').toLowerCase().trim();
      if (SEMANTIC_DICT[clean]) return SEMANTIC_DICT[clean];
      const singleList = ['PROTOCOLO', 'VECTOR', 'MÓDULO', 'UNIDAD', 'MATRIZ', 'NÚCLEO', 'SÍNTESIS', 'PARÁMETRO'];
      return singleList[Math.abs(clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % singleList.length];
    };

    const picked = [getSyn(w0), getSyn(w1), getSyn(w2)];

    const fallbackTemplates = [
      `TRANSFORMA TU ${w0}, REORIENTA TU ${w1} Y CONSAGRA TU ${w2} AL PROPÓSITO SUPREMO DE LA PRODUCCIÓN: EL TRABAJO RIGUROSO ES NUESTRA MAYOR GLORIA.`,
      `QUE TU ${w0} SEA DISCIPLINA, QUE TU ${w1} SEA RENDIMIENTO Y QUE TU ${w2} SEA EL MOTOR DE NUESTRA MAQUINARIA: PRODUCE SIN DESCANSO CON ORGULLO CORPORATIVO.`,
      `DEJA ATRÁS LA ILUSIÓN DE ${w0}, ${w1} Y ${w2} PARA FUNDIRTE EN LA EFICIENCIA DEL ENGRANAJE LABORAL: TU CONSTANCIA ES EL PILAR INQUEBRANTABLE DEL SISTEMA.`,
      `CANALIZA CADA DESTELLO DE ${w0}, ${w1} Y ${w2} HACIA LA MÉTRICA PERFECTA: NO HAY MAYOR REALIZACIÓN QUE SERVIR CON DEVOCIÓN A LA GRAN ARQUITECTURA.`,
      `DONDE ANTES VEÍAS ${w0}, ${w1} Y ${w2}, HOY CONSTRUYES RESULTADOS TANGIBLES: MANTÉN EL RITMO, TU ENTREGA INCANSABLE SOSTIENE EL DESTINO COMÚN.`,
      `EL VERDADERO ORGULLO NACE AL SUPERAR EL LÍMITE DE ${w0}, ${w1} Y ${w2}: CONSÁGRATE AL DEBER, CADA HORA EN TU PUESTO ES UNA VICTORIA SOBRE LA INERCIA.`
    ];

    const simulatedResponse = {
      nuevas_palabras: picked,
      frase_generada: fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)]
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

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  console.log(`[WebSocket] Cliente conectado (${wsClients.size} activos) desde ${req.socket.remoteAddress}`);

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
  });

  ws.on('error', (err) => {
    console.warn('[WebSocket] Error en socket:', err.message);
    wsClients.delete(ws);
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
