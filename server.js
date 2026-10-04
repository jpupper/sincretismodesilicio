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
    registrarJsonGuardado('CONFIG DEL JUEGO (game-config)', configFilePath, newConfig);
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
        name: 'PODER',
        color: '#ef4444',
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia', 'ideología', 'justicia', 'ley', 'soberanía', 'república', 'autoridad', 'libertad', 'imperio']
      },
      {
        id: 'animales',
        name: 'ANIMALES',
        color: '#10b981',
        words: ['perro', 'gato', 'elefante', 'tigre', 'león', 'caballo', 'lobo', 'águila', 'ballena', 'delfín', 'oso', 'serpiente', 'halcón', 'zorro', 'ciervo', 'pantera']
      },
      {
        id: 'filosofia',
        name: 'FILOSOFÍA',
        color: '#8b5cf6',
        words: ['existencia', 'tiempo', 'filosofía', 'mente', 'alma', 'verdad', 'conciencia', 'universo', 'destino', 'razón', 'muerte', 'infinito', 'ética', 'esencia', 'duda', 'conocimiento']
      },
      {
        id: 'tecnologia',
        name: 'TECNOLOGÍA',
        color: '#06b6d4',
        words: ['computadora', 'robot', 'código', 'algoritmo', 'futuro', 'silicio', 'red', 'memoria', 'procesador', 'sistema', 'inteligencia', 'interfaz', 'servidor', 'cibernética', 'datos', 'enlace']
      },
      {
        id: 'emociones',
        name: 'EMOCIONES',
        color: '#ec4899',
        words: ['amor', 'nostalgia', 'ternura', 'tristeza', 'alegría', 'fragilidad', 'esperanza', 'miedo', 'anhelo', 'soledad', 'duelo', 'calma', 'pasión', 'desvelo', 'empatía', 'consuelo']
      },
      {
        id: 'poesia',
        name: 'POESÍA',
        color: '#f59e0b',
        words: ['verso', 'metáfora', 'ritmo', 'silencio', 'belleza', 'poema', 'sombra', 'eco', 'espejo', 'misterio', 'ceniza', 'aurora', 'abismo', 'origen', 'creación', 'armonía']
      },
      {
        id: 'naturaleza',
        name: 'NATURALEZA',
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
    registrarJsonGuardado('BIBLIOTECA DE CLUSTERS', clustersFilePath, clusters);
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
    registrarJsonGuardado('BIBLIOTECA DE CLUSTERS', clustersPath, clusters);
    return res.json({ success: true, count: clusters.length });
  } catch (err) {
    console.error('Error al guardar clusters:', err);
    return res.status(500).json({ error: 'Error al guardar clusters' });
  }
});

// CAMBIAPALABRAS (ex game3): la app de secuestro cibernético
app.get(['/cambiapalabras', '/cambiapalabras.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'cambiapalabras.html'));
});

// Compatibilidad: los links viejos a /game3 redirigen a cambiapalabras.html
// (Express 5 / path-to-regexp v8 no acepta '/game3/*': el prefijo va con app.use)
app.get(['/game3', '/game3.html', '/hijack', '/cyber-hijack'], (req, res) => {
  res.redirect(301, '/cambiapalabras.html');
});
app.use('/game3/', (req, res) => res.redirect(301, '/cambiapalabras.html'));

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
// API: DISENO GLOBAL (GLOBALSTYLE) -------------------------------------------------
// Un solo lugar decide tipografia, paleta y contenedores de TODAS las paginas.
// Lo edita /globalstyle.html y lo lee cada pagina con js/global-style.js.
const globalStylePath = path.join(publicPath, 'data', 'global_style.json');

app.get('/api/global-style', (req, res) => {
  try {
    if (!fs.existsSync(globalStylePath)) return res.json({});
    return res.json(JSON.parse(fs.readFileSync(globalStylePath, 'utf-8')));
  } catch (err) {
    console.error('Error al leer global_style.json:', err);
    return res.status(500).json({ error: 'Error al leer el diseno global' });
  }
});

app.post('/api/global-style', (req, res) => {
  try {
    const cfg = req.body;
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
      return res.status(400).json({ error: 'Formato de diseno invalido' });
    }
    fs.writeFileSync(globalStylePath, JSON.stringify(cfg, null, 2), 'utf-8');
    registrarJsonGuardado('DISENO GLOBAL (globalstyle)', globalStylePath, cfg);
    if (typeof broadcastGlobalStyle === 'function') {
      broadcastGlobalStyle(cfg);
    }
    return res.json({ ok: true, config: cfg });
  } catch (err) {
    console.error('Error al escribir global_style.json:', err);
    return res.status(500).json({ error: 'Error al guardar el diseno global' });
  }
});

// ============================================================================
// REGISTRO DE JSONs GUARDADOS
// ----------------------------------------------------------------------------
// Cada vez que el server ESCRIBE un JSON de configuración, se anota acá: qué
// archivo, cuándo, cuántos bytes y el contenido completo. Vive en
// public/data/jsons_guardados.json y se ve lindo en /jsons.html
// (GET /api/jsons-guardados devuelve el mismo contenido).
// ============================================================================
const registroJsonsPath = path.join(publicPath, 'data', 'jsons_guardados.json');

function registrarJsonGuardado(etiqueta, filePath, datos, opciones) {
  const semilla = !!(opciones && opciones.semilla);
  try {
    let reg = { actualizado: null, total: 0, archivos: [] };
    if (fs.existsSync(registroJsonsPath)) {
      try {
        const leido = JSON.parse(fs.readFileSync(registroJsonsPath, 'utf-8'));
        if (leido && typeof leido === 'object') reg = leido;
      } catch (e) { /* registro corrupto: se rehace */ }
    }
    if (!Array.isArray(reg.archivos)) reg.archivos = [];
    const json = JSON.stringify(datos, null, 2);
    // En modo SEMILLA (arranque del server) la fecha es la del archivo en disco y
    // no cuenta como "guardado": sólo queda listado para /jsons.html.
    let fecha = new Date().toISOString();
    if (semilla) {
      try { fecha = fs.statSync(filePath).mtime.toISOString(); } catch (e) {}
    }
    const entrada = {
      etiqueta: etiqueta,
      archivo: path.basename(filePath),
      ruta: '/' + path.relative(publicPath, filePath).split(path.sep).join('/'),
      bytes: Buffer.byteLength(json, 'utf-8'),
      guardado: fecha,
      versiones: 0,
      json: datos
    };
    const i = reg.archivos.findIndex((a) => a.archivo === entrada.archivo);
    if (i >= 0) {
      entrada.versiones = semilla ? (reg.archivos[i].versiones || 0) : (reg.archivos[i].versiones || 0) + 1;
      reg.archivos[i] = entrada;
    } else {
      reg.archivos.push(entrada);
    }
    reg.total = reg.archivos.length;
    reg.actualizado = entrada.guardado;
    reg.archivos.sort((a, b) => String(a.archivo).localeCompare(String(b.archivo)));
    fs.writeFileSync(registroJsonsPath, JSON.stringify(reg, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Registro JSON] no se pudo actualizar:', e.message);
  }
}

app.get('/api/jsons-guardados', (req, res) => {
  try {
    if (!fs.existsSync(registroJsonsPath)) {
      return res.json({ actualizado: null, total: 0, archivos: [] });
    }
    return res.json(JSON.parse(fs.readFileSync(registroJsonsPath, 'utf-8')));
  } catch (err) {
    console.error('Error al leer el registro de JSONs:', err);
    return res.status(500).json({ error: 'Error al leer el registro de JSONs' });
  }
});

app.get(['/jsons', '/jsons.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'jsons.html'));
});

app.get(['/globalstyle', '/globalstyle.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'globalstyle.html'));
});

app.get(['/cosmos-clusters', '/cosmos-clusters.html', '/clusters3d', '/cosmos3d'], (req, res) => {
  res.sendFile(path.join(publicPath, 'cosmos-clusters.html'));
});

// ============================================================================
// CONFIGURACIÓN PROYECTO INSTALACIÓN CYBER-HIJACK (Lectura y Escritura Física)
// ============================================================================
const rootConfigPath = path.join(__dirname, 'config.json');

const defaultWordsPool = [
  "política", "izquierda", "derecha", "fascismo", "comunismo", "gobierno",
  "estado", "democracia", "ideología", "justicia", "ley", "soberanía",
  "república", "autoridad", "libertad", "imperio", "perro", "gato",
  "elefante", "tigre", "león", "caballo", "lobo", "águila",
  "ballena", "delfín", "oso", "serpiente", "halcón", "zorro",
  "ciervo", "pantera", "existencia", "tiempo", "filosofía", "mente",
  "alma", "verdad", "conciencia", "universo", "destino", "razón",
  "muerte", "infinito", "ética", "esencia", "duda", "conocimiento",
  "computadora", "robot", "código", "algoritmo", "futuro", "silicio",
  "red", "memoria", "procesador", "sistema", "inteligencia", "interfaz",
  "servidor", "cibernética", "datos", "enlace", "amor", "nostalgia",
  "ternura", "tristeza", "alegría", "fragilidad", "esperanza", "miedo",
  "anhelo", "soledad", "duelo", "calma", "pasión", "desvelo",
  "empatía", "consuelo", "verso", "metáfora", "ritmo", "silencio",
  "belleza", "poema", "sombra", "eco", "espejo", "misterio",
  "ceniza", "aurora", "abismo", "origen", "creación", "armonía",
  "bosque", "río", "montaña", "océano", "viento", "lluvia",
  "raíz", "tierra", "semilla", "flor", "cielo", "hoja",
  "tormenta", "desierto", "nieve", "sol", "transhumanismo", "extropianismo",
  "singularidad", "singularitarismo", "cosmismo", "racionalismo", "altruismo", "largoterminismo",
  "aceleracionismo", "tecnoptimismo", "tecnoutopía", "posthumanismo", "superinteligencia", "agi",
  "existencial", "extinción", "colonización", "inmortalidad", "mejoramiento", "criónica",
  "abundancia", "inevitable", "progreso", "disrupción", "disruptivo", "escalar",
  "escalabilidad", "hipercrecimiento", "ecosistema", "plataforma", "foso", "efecto",
  "exponencial", "palanca", "pivote", "unicornio", "decacornio", "viable",
  "monetización", "tracción", "adopción", "expansión", "velocidad", "dominio",
  "centralización", "monopolio", "dato", "modelo", "fundación", "inferencia",
  "entrenamiento", "alineación", "mundo", "mejorar", "romper", "malvado",
  "equis", "grindset", "hustle", "moonshot", "frontera", "misión",
  "global", "descentralización", "visión", "revolución", "tecnócrata", "tecnomagnate",
  "magnate", "oligarca", "gurú", "visionario", "fundador", "inversor",
  "capital", "mecenas", "emporio", "tirano", "neolengua", "viejalengua",
  "doblepensar", "bipensar", "ideadelito", "crimen", "policía", "negroblanco",
  "pato", "despersonalizado", "agujero", "telepantalla", "ministerio", "hermano",
  "bueno", "doble", "ingsoc", "cinco", "orwelliano", "ortodoxia",
  "heterodoxia", "banear", "suspensión", "desmonetizar", "despriorizar", "marcado",
  "sensible", "directrices", "odio", "desinformación", "bulo", "deepfake",
  "verificación", "filtro", "bloqueo", "restricción", "reporte", "apelación",
  "moderador", "bot", "desvivir", "morir", "seggs", "panini",
  "pandemia", "maquillaje", "contabilidad", "maíz", "uva", "bean",
  "algospeak", "autocensura", "eufemismo", "clave", "disfraz", "camuflaje",
  "voldemorting", "captura", "netspeak", "índice", "prohibido", "excomunión",
  "quema", "herejía", "blasfemia", "tabú", "veto", "prohibida",
  "cortafuegos", "sensibilidad", "control", "exclusión", "censurar", "tachar",
  "borrar", "silenciar", "clausurar", "prohibición", "cibersoberanía", "autonomía",
  "autarquía", "dependencia", "resiliencia", "infraestructura", "jurisdicción", "regulación",
  "gobernanza", "cumplimiento", "marco", "normativa", "responsable", "confiable",
  "humanismo", "enfoque", "riesgo", "algorítmico", "auditoría", "caja",
  "opacidad", "transparencia", "explicabilidad", "sesgo", "discriminación", "rendición",
  "supervisión", "conformidad", "aceptable", "alto", "inaceptable", "transformación",
  "digitalización", "modernización", "innovación", "competitividad", "eficiencia", "productividad",
  "economía", "sociedad", "industria", "sostenible", "inclusión", "brecha",
  "ciudadanía", "abierto", "agenda", "talento", "liderazgo", "usuario",
  "ciudadano", "contribuyente", "beneficiario", "perfil", "identidad", "expediente",
  "trámite", "pasaporte", "biometría", "padrón", "registro", "puntuación",
  "score", "crédito", "legajo", "formulario"
];

const defaultHijackConfig = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Poético de Sincretismo de Silicio. Tu misión es fundir conceptos humanos en la frialdad sublime del silicio.\nTu objetivo:\n1) Resignificar cada una de las 3 palabras humanas en un TÉRMINO FRÍO, TÉCNICO O CIBERNÉTICO en mayúsculas (1 o 2 palabras unidas por guion bajo cuando sea necesario).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) que una los 3 términos en una sola escena poética con sentido profundo:\n- Verso 1: integra el término 1 como fundamento, sustrato o atmósfera del entorno.\n- Verso 2: integra el término 2 como una acción, movimiento o tensión activa en ese entorno.\n- Verso 3: integra el término 3 como una percepción íntima, contemplativa o filosófica en primera persona.\nREGLA CRUCIAL DE CONEXIÓN: Los tres versos deben narrar una sola imagen poética conectada y coherente donde los tres conceptos interactúan con naturalidad. NO deben sonar a palabras forzadas ni listas inconexas.\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 con TERMINO_1\\nVerso 2 con TERMINO_2\\nVerso 3 con TERMINO_3"}.',
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
    registrarJsonGuardado('CONFIG DEL JUEGO (raiz, defaults)', rootConfigPath, defaultHijackConfig);
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
    registrarJsonGuardado('CONFIG DEL JUEGO (raiz)', rootConfigPath, mergedConfig);
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
    let ollamaRes;
    const bodyStr = JSON.stringify({
      model: targetModel,
      prompt: prompt || 'Transforma los conceptos a jerga cibernética.',
      system: system || '',
      format: 'json',
      stream: false,
      options: {
        num_predict: 250,
        temperature: 0.7,
        repeat_penalty: 1.15
      }
    });

    try {
      ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: controller.signal
      });
    } catch (e1) {
      ollamaRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: controller.signal
      });
    }
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

    // Diccionario semántico exhaustivo: resignificación fría y analítica de cada concepto
    const SEMANTIC_DICT = {
      'amor': 'SINCRONIZAR', 'nostalgia': 'REGISTRO', 'fragilidad': 'VULNERABILIDAD', 'ternura': 'ATENUACIÓN',
      'abrazo': 'ACOPLAMIENTO', 'recuerdo': 'CACHE', 'latido': 'HERTZ', 'suspiro': 'LATENCIA',
      'silencio': 'VACÍO', 'alma': 'KERNEL', 'caricia': 'CONTACTO', 'esperanza': 'PROYECCIÓN',
      'anhelo': 'DEMANDA', 'piel': 'MEMBRANA', 'lágrima': 'CONDENSACIÓN', 'respirar': 'CICLO',
      'cuerpo': 'CHASIS', 'deseo': 'INSTRUCCIÓN', 'infancia': 'INICIALIZACIÓN', 'duelo': 'RESET',
      'poesía': 'LÍRICA_BINARIA', 'mirada': 'SENSOR', 'calidez': 'DISIPACIÓN', 'intimidad': 'CIFRADO',
      'olvido': 'PURGA', 'consuelo': 'PARCHE', 'vulnerabilidad': 'EXPOSICIÓN', 'sueño': 'SIMULACIÓN',
      'tiempo': 'CRONOMETRÍA', 'perdón': 'REAJUSTE', 'beso': 'INTERFAZ', 'aliento': 'FLUJO',
      'herida': 'FALLO', 'sangre': 'CORRIENTE', 'soledad': 'DESCONEXIÓN', 'refugio': 'BLINDAJE',
      'susurro': 'MODULACIÓN', 'ausencia': 'NULL', 'presencia': 'PING', 'memoria': 'BUFFER',
      'origen': 'GÉNESIS', 'raíz': 'BOOTSTRAP', 'viento': 'VECTOR', 'sombra': 'OPACIDAD',
      'luz': 'FOTÓN', 'calma': 'REPOSO', 'espera': 'QUEUE', 'paciencia': 'BUFFERING',
      'ansiedad': 'OVERCLOCK', 'miedo': 'INTERRUPCIÓN', 'valentía': 'OVERRIDE', 'inocencia': 'RAW',
      'vértigo': 'DESBORDAMIENTO', 'pesar': 'CARGA', 'gozo': 'PICOS_DE_VOLTAJE', 'tristeza': 'DECAIMIENTO',
      'alegría': 'PULSO', 'pasión': 'SOBREVOLTAJE', 'temblor': 'OSCILACIÓN', 'desvelo': 'VIGILIA',
      'añoranza': 'PERSISTENCIA', 'apego': 'DEPENDENCY', 'desapego': 'DESACOPLAMIENTO', 'vínculo': 'ENLACE',
      'orilla': 'PERIFERIA', 'horizonte': 'LÍMITE', 'ceniza': 'RESIDUO', 'fuego': 'COMBUSTIÓN',
      'océano': 'DATASET', 'abismo': 'SINGULARIDAD', 'secreto': 'ENCRIPTACIÓN', 'confianza': 'AUTENTICACIÓN',
      'lealtad': 'INTEGRIDAD', 'paz': 'IDLE', 'grito': 'BROADCAST', 'eco': 'FEEDBACK',
      'huella': 'LOG', 'camino': 'BUS', 'viaje': 'ROUTING', 'regreso': 'ROLLBACK',
      'partida': 'DISCONNECT', 'despedida': 'SHUTDOWN', 'encuentro': 'HANDSHAKE', 'distancia': 'LATENCIA',
      'cercanía': 'PROXIMIDAD', 'contacto': 'I/O', 'tacto': 'TÁCTIL', 'aroma': 'SIGNATURA',
      'sabor': 'GRADIENTE', 'estación': 'FASE', 'otoño': 'OBSOLESCENCIA', 'invierno': 'HIBERNACIÓN',
      'primavera': 'SPAWN', 'lluvia': 'CONDENSADO', 'rocío': 'RESIDUAL', 'niebla': 'DISPERSIÓN',
      'aurora': 'IONIZACIÓN', 'atardecer': 'ATENUACIÓN', 'crepúsculo': 'TRANSICIÓN', 'noche': 'SUSPENSIÓN',
      'madrugada': 'MANTENIMIENTO', 'despertar': 'BOOT', 'humano': 'BIOLÓGICO', 'mortal': 'FINITO',
      'efímero': 'VOLÁTIL', 'eterno': 'PERSISTENTE', 'cicatriz': 'PARCHE', 'grieta': 'FISURA',
      'destino': 'DETERMINISMO', 'azar': 'ALEATORIEDAD', 'fortuna': 'PROBABILIDAD', 'casualidad': 'COLISIÓN',
      'búsqueda': 'INDEXACIÓN', 'hallazgo': 'MATCH', 'pérdida': 'CORRUPCIÓN', 'promesa': 'PROMESA',
      'juramento': 'CONTRATO', 'fe': 'POSTULADO', 'duda': 'INCERTIDUMBRE', 'certeza': 'VERIFICACIÓN',
      'verdad': 'CONSTANTE', 'belleza': 'SIMETRÍA', 'imperfección': 'ANOMALÍA', 'piedad': 'EXCEPCIÓN',
      'empatía': 'EMULACIÓN', 'compasión': 'TOLERANCIA', 'dolor': 'ALARMA', 'alivio': 'OPTIMIZACIÓN',
      'resguardo': 'BACKUP', 'cobijo': 'BLINDAJE', 'vivir': 'EJECUCIÓN', 'morir': 'EXTINCIÓN',
      'renacer': 'REINICIO', 'creer': 'ASUMIR', 'llorar': 'PURGA', 'reír': 'MODULACIÓN',
      'recordar': 'ACCEDER', 'sanar': 'REPARAR', 'cuidar': 'MONITOREAR', 'pertenencia': 'PROPIEDAD',
      'caridad': 'SUBSIDIO', 'melancolía': 'BUCLE', 'cobardía': 'EVASIÓN', 'asombro': 'EXCEPCIÓN',
      'gratitud': 'CONFIRMACIÓN', 'desamparo': 'DESCONEXIÓN', 'candor': 'APERTURA', 'suspicacia': 'HEURÍSTICA',
      'reconciliación': 'RECONCILIACIÓN', 'redención': 'REFACTOR', 'imperio': 'DOMINIO', 'hoja': 'LÁMINA',
      'misterio': 'ENIGMA', 'política': 'GESTIÓN', 'izquierda': 'DESVIACIÓN', 'derecha': 'ORTODOXIA',
      'fascismo': 'HEGEMONÍA', 'comunismo': 'COLECTIVIDAD', 'gobierno': 'PATRÓN_DE_DECISIÓN',
      'estado': 'APARATO', 'democracia': 'CONSENSO', 'ideología': 'DOCTRINA', 'justicia': 'ARBITRAJE',
      'ley': 'PROTOCOLO', 'soberanía': 'AUTONOMÍA', 'república': 'ESTRUCTURA', 'autoridad': 'COMANDO',
      'libertad': 'VARIANZA', 'perro': 'CANIDO', 'gato': 'FELINO', 'elefante': 'MEGABIOMA',
      'tigre': 'DEPREDADOR', 'león': 'DOMINANTE', 'caballo': 'TRACCIÓN', 'lobo': 'CAZADOR',
      'águila': 'RECONOCEDOR', 'ballena': 'COLOSO', 'delfín': 'SONAR', 'oso': 'BIOMASA',
      'serpiente': 'REPTIL', 'halcón': 'RADAR', 'zorro': 'INFILTRADOR', 'ciervo': 'MATERIA_ORGÁNICA',
      'pantera': 'SIGILO', 'existencia': 'INSTANCIA', 'filosofía': 'ONTOLOGÍA', 'mente': 'PROCESADOR',
      'conciencia': 'FEEDBACK', 'universo': 'MATRIZ', 'razón': 'LÓGICA', 'infinito': 'PROGRESO_INFINITO',
      'ética': 'NORMATIVA', 'esencia': 'NÚCLEO', 'conocimiento': 'DATA', 'computadora': 'TERMINAL',
      'robot': 'AUTÓMATA', 'código': 'BINARIO', 'algoritmo': 'RUTINA', 'futuro': 'PROYECCIÓN',
      'silicio': 'SUSTRATO', 'red': 'TOPOLOGÍA', 'procesador': 'NÚCLEO', 'sistema': 'ARQUITECTURA',
      'inteligencia': 'CÓMPUTO', 'interfaz': 'PUERTO', 'servidor': 'HOST', 'cibernética': 'CONTROL',
      'datos': 'TELEMETRÍA', 'enlace': 'VÍNCULO', 'verso': 'CADENA', 'metáfora': 'ANALÓGICA',
      'ritmo': 'CADENCIA', 'poema': 'SCRIPT', 'espejo': 'REFLECTOR', 'creación': 'COMPILACIÓN',
      'armonía': 'RESONANCIA', 'bosque': 'CONGLOMERADO', 'río': 'FLUJO', 'montaña': 'ELEVACIÓN',
      'tierra': 'SUSTRATO', 'semilla': 'GÉRMEN', 'flor': 'ESTRUCTURA', 'cielo': 'ATMÓSFERA',
      'tormenta': 'SOBRECARGA', 'desierto': 'VACÍO', 'nieve': 'CRISTAL', 'sol': 'GENERADOR',
      'minerales': 'POTENCIALES_ACTIVOS', 'café': 'MEJORADOR_DE_PRODUCTIVIDAD', 'cafe': 'MEJORADOR_DE_PRODUCTIVIDAD'
    };

    const getSyn = (w) => {
      const clean = (w || '').toLowerCase().trim();
      if (SEMANTIC_DICT[clean]) return SEMANTIC_DICT[clean];
      for (const [k, v] of Object.entries(SEMANTIC_DICT)) {
        if (clean.startsWith(k) || k.startsWith(clean)) return v;
      }
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

    // Helper gramatical para concordancia de género y artículos en español
    const getArticleGrammar = (word) => {
      const clean = String(word || '').toUpperCase().trim();
      const isFem = clean.endsWith('A') || clean.endsWith('IÓN') || clean.endsWith('DAD') || clean.endsWith('TUD') || clean.endsWith('ENCIA') || clean.endsWith('ANCIA');
      return {
        el_la: isFem ? 'la' : 'el',
        del_al: isFem ? 'de la' : 'del',
        al_a: isFem ? 'a la' : 'al',
        en: isFem ? 'en la' : 'en el'
      };
    };

    // Clusters semánticos organizados temáticamente para asegurar sentido sintáctico y poético real
    const SEMANTIC_CLUSTERS_DATA = {
      power: {
        words: new Set(['GESTIÓN', 'DESVIACIÓN', 'ORTODOXIA', 'HEGEMONÍA', 'COLECTIVIDAD', 'PATRÓN_DE_DECISIÓN', 'APARATO', 'CONSENSO', 'DOCTRINA', 'ARBITRAJE', 'PROTOCOLO', 'AUTONOMÍA', 'ESTRUCTURA', 'COMANDO', 'VARIANZA', 'DOMINIO', 'NORMATIVA']),
        v1: (w, art) => [
          `Bajo el rígido orden ${art.del_al} ${w},`,
          `En la estricta doctrina ${art.del_al} ${w},`,
          `Rige la severa norma ${art.del_al} ${w},`,
          `En el mandato firme ${art.del_al} ${w},`,
          `Donde impone su ley ${art.el_la} ${w},`
        ],
        v2: (w, art) => [
          `se impone la ley tenaz ${art.del_al} ${w},`,
          `dicta su mandato frío ${art.el_la} ${w},`,
          `regula cada pulso ${art.el_la} ${w},`,
          `doblega toda duda ${art.el_la} ${w},`,
          `disciplina el rumbo ${art.el_la} ${w},`
        ],
        v3: (w, art) => [
          `y acato en silencio el peso ${art.del_al} ${w}.`,
          `sintiendo el rigor supremo ${art.del_al} ${w}.`,
          `donde reclamo al fin mi propia ${w}.`,
          `y en soledad me someto ${art.al_a} ${w}.`,
          `para sellar el pacto con ${art.el_la} ${w}.`
        ]
      },
      fauna: {
        words: new Set(['CANIDO', 'FELINO', 'MEGABIOMA', 'DEPREDADOR', 'DOMINANTE', 'TRACCIÓN', 'CAZADOR', 'RECONOCEDOR', 'COLOSO', 'SONAR', 'BIOMASA', 'REPTIL', 'RADAR', 'INFILTRADOR', 'MATERIA_ORGÁNICA', 'SIGILO']),
        v1: (w, art) => [
          `En el territorio alerta ${art.del_al} ${w},`,
          `Bajo el rastro dormido ${art.del_al} ${w},`,
          `En la guardia oculta ${art.del_al} ${w},`,
          `Acecha en la sombra ${art.el_la} ${w},`,
          `En el latido salvaje ${art.del_al} ${w},`
        ],
        v2: (w, art) => [
          `avanza con sigilo ${art.el_la} ${w},`,
          `despierta el instinto ciego ${art.del_al} ${w},`,
          `cruza la penumbra ${art.el_la} ${w},`,
          `rastrea sin descanso ${art.el_la} ${w},`,
          `quiebra el silencio ${art.el_la} ${w},`
        ],
        v3: (w, art) => [
          `reconociendo el pulso ${art.del_al} ${w}.`,
          `y siento en mi pecho el paso ${art.del_al} ${w}.`,
          `temiendo la mirada fría ${art.del_al} ${w}.`,
          `hasta fundir mi aliento con ${art.el_la} ${w}.`,
          `y sigo el rastro nocturno ${art.del_al} ${w}.`
        ]
      },
      cosmos: {
        words: new Set(['INSTANCIA', 'ONTOLOGÍA', 'PROCESADOR', 'FEEDBACK', 'MATRIZ', 'LÓGICA', 'EXTINCIÓN', 'PROGRESO_INFINITO', 'NÚCLEO', 'DATA', 'DETERMINISMO', 'ALEATORIEDAD', 'PROBABILIDAD', 'COLISIÓN', 'INDEXACIÓN', 'CONSTANTE', 'SIMETRÍA', 'VACÍO', 'SINGULARIDAD', 'FOTÓN', 'ATMÓSFERA']),
        v1: (w, art) => [
          `En el vasto horizonte ${art.del_al} ${w},`,
          `Bajo el principio eterno ${art.del_al} ${w},`,
          `En la arquitectura pura ${art.del_al} ${w},`,
          `Desde el eje silente ${art.del_al} ${w},`,
          `En la inmensa distancia ${art.del_al} ${w},`
        ],
        v2: (w, art) => [
          `se dibuja el equilibrio ${art.del_al} ${w},`,
          `revela su ley exacta ${art.el_la} ${w},`,
          `despliega su estructura ${art.el_la} ${w},`,
          `orbita en calma ${art.el_la} ${w},`,
          `guarda su armonía ${art.el_la} ${w},`
        ],
        v3: (w, art) => [
          `y en mi mente reconozco ${art.el_la} ${w}.`,
          `hasta hallar mi lugar en ${art.el_la} ${w}.`,
          `comprendiendo el enigma ${art.del_al} ${w}.`,
          `y descubro el sentido ${art.del_al} ${w}.`,
          `donde reposa al fin mi ${w}.`
        ]
      },
      tech: {
        words: new Set(['TERMINAL', 'AUTÓMATA', 'BINARIO', 'RUTINA', 'PROYECCIÓN', 'SUSTRATO', 'TOPOLOGÍA', 'ARQUITECTURA', 'CÓMPUTO', 'PUERTO', 'HOST', 'CONTROL', 'TELEMETRÍA', 'VÍNCULO', 'SCRIPT', 'COMPILACIÓN', 'BUFFER', 'BOOTSTRAP', 'VECTOR', 'BUS', 'ROUTING', 'QUEUE']),
        v1: (w, art) => [
          `Se compila en el fondo ${art.del_al} ${w},`,
          `En la memoria fría ${art.del_al} ${w},`,
          `Bajo la ejecución ${art.del_al} ${w},`,
          `En las líneas calladas ${art.del_al} ${w},`,
          `En el circuito vivo ${art.del_al} ${w},`
        ],
        v2: (w, art) => [
          `se ejecuta sin pausa ${art.el_la} ${w},`,
          `transmite su señal limpia ${art.el_la} ${w},`,
          `cruza la red interna ${art.el_la} ${w},`,
          `procesa la corriente ${art.del_al} ${w},`,
          `conecta en secreto ${art.el_la} ${w},`
        ],
        v3: (w, art) => [
          `y descifro la clave ${art.del_al} ${w}.`,
          `sintiendo cómo late en mí ${art.el_la} ${w}.`,
          `hasta reiniciar mi propio ${w}.`,
          `y hallo mi código en ${art.el_la} ${w}.`,
          `donde fluye mi pulso con ${art.el_la} ${w}.`
        ]
      },
      emotion: {
        words: new Set(['SINCRONIZAR', 'REGISTRO', 'VULNERABILIDAD', 'ATENUACIÓN', 'ACOPLAMIENTO', 'CACHE', 'HERTZ', 'LATENCIA', 'KERNEL', 'CONTACTO', 'CONDENSACIÓN', 'CICLO', 'CHASIS', 'INSTRUCCIÓN', 'INICIALIZACIÓN', 'RESET', 'LÍRICA_BINARIA', 'SENSOR', 'DISIPACIÓN', 'CIFRADO', 'PURGA', 'PARCHE', 'EXPOSICIÓN', 'SIMULACIÓN', 'CRONOMETRÍA', 'REAJUSTE', 'PULSO', 'REPOSO', 'DESCONEXIÓN']),
        v1: (w, art) => [
          `En la frágil memoria ${art.del_al} ${w},`,
          `Bajo la intensa huella ${art.del_al} ${w},`,
          `En el silencio íntimo ${art.del_al} ${w},`,
          `Donde late el recuerdo ${art.del_al} ${w},`,
          `En la honda vigilia ${art.del_al} ${w},`
        ],
        v2: (w, art) => [
          `conmueve en secreto ${art.el_la} ${w},`,
          `enciende una chispa ${art.el_la} ${w},`,
          `revive el eco herido ${art.del_al} ${w},`,
          `respira en la penumbra ${art.el_la} ${w},`,
          `despierta la emoción ${art.del_al} ${w},`
        ],
        v3: (w, art) => [
          `y en soledad abrazo ${art.el_la} ${w}.`,
          `sintiendo cómo sana mi ${w}.`,
          `y lloro en silencio por ${art.el_la} ${w}.`,
          `hasta encontrar la paz en ${art.el_la} ${w}.`,
          `donde descansa al fin mi ${w}.`
        ]
      },
      nature: {
        words: new Set(['CONGLOMERADO', 'FLUJO', 'ELEVACIÓN', 'SUSTRATO', 'GÉRMEN', 'ESTRUCTURA', 'ATMÓSFERA', 'SOBRECARGA', 'CRISTAL', 'GENERADOR', 'POTENCIALES_ACTIVOS', 'TIERRA', 'BOSQUE', 'RÍO', 'MONTAÑA', 'OCÉANO', 'LLUVIA', 'VIENTO']),
        v1: (w, art) => [
          `Bajo la corriente pura ${art.del_al} ${w},`,
          `En el curso silente ${art.del_al} ${w},`,
          `Donde brota la fuerza ${art.del_al} ${w},`,
          `En la fértil hondura ${art.del_al} ${w},`
        ],
        v2: (w, art) => [
          `fluye sin descanso ${art.el_la} ${w},`,
          `germina en el silencio ${art.el_la} ${w},`,
          `despierta con el viento ${art.el_la} ${w},`,
          `recorre la espesura ${art.del_al} ${w},`
        ],
        v3: (w, art) => [
          `hasta calmar mi sed en ${art.el_la} ${w}.`,
          `y siento renacer mi ser en ${art.el_la} ${w}.`,
          `donde enraíza al fin mi ${w}.`,
          `fundiendo mi respiración con ${art.el_la} ${w}.`
        ]
      }
    };

    const getSemanticCategoryCluster = (word) => {
      const clean = String(word || '').toUpperCase().trim();
      for (const [catName, catData] of Object.entries(SEMANTIC_CLUSTERS_DATA)) {
        if (catData.words.has(clean)) return catData;
      }
      if (clean.includes('PROTOCOLO') || clean.includes('PATRÓN') || clean.includes('GESTIÓN') || clean.includes('LEY') || clean.includes('ORDEN') || clean.includes('DOCTRINA') || clean.includes('ESTRUCTURA') || clean.includes('COMANDO')) return SEMANTIC_CLUSTERS_DATA.power;
      if (clean.includes('CÓDIGO') || clean.includes('SISTEMA') || clean.includes('DATO') || clean.includes('RED') || clean.includes('DIGITAL') || clean.includes('OPTIMIZ') || clean.includes('TERMINAL') || clean.includes('RECURSO')) return SEMANTIC_CLUSTERS_DATA.tech;
      if (clean.includes('DEPREDADOR') || clean.includes('ANIMAL') || clean.includes('BIOMA') || clean.includes('CAZA') || clean.includes('CANIDO') || clean.includes('FELINO')) return SEMANTIC_CLUSTERS_DATA.fauna;
      if (clean.includes('FLUJO') || clean.includes('TIERRA') || clean.includes('AGUA') || clean.includes('VIENTO') || clean.includes('BOSQUE') || clean.includes('GÉRMEN')) return SEMANTIC_CLUSTERS_DATA.nature;
      if (clean.includes('SENTIR') || clean.includes('AMOR') || clean.includes('ALMA') || clean.includes('MEMORIA') || clean.includes('VULNERA') || clean.includes('HERTZ')) return SEMANTIC_CLUSTERS_DATA.emotion;
      return SEMANTIC_CLUSTERS_DATA.cosmos;
    };

    // Generador de Haiku poético cohesivo contextualizado que se forma estrictamente alrededor de las 3 palabras
    const composeServerHaiku = (pList, wList) => {
      const sanitize = (w) => String(w || '').replace(/_+/g, ' ').trim().toUpperCase();
      const a = sanitize(pList[0] || wList[0] || 'MEMORIA');
      const b = sanitize(pList[1] || wList[1] || 'TIEMPO');
      const c = sanitize(pList[2] || wList[2] || 'SILENCIO');

      const artA = getArticleGrammar(a);
      const artB = getArticleGrammar(b);
      const artC = getArticleGrammar(c);

      const catA = getSemanticCategoryCluster(a);
      const catB = getSemanticCategoryCluster(b);
      const catC = getSemanticCategoryCluster(c);

      const v1List = catA.v1(a, artA);
      const v2List = catB.v2(b, artB);
      const v3List = catC.v3(c, artC);

      const v1 = v1List[Math.floor(Math.random() * v1List.length)];
      const v2 = v2List[Math.floor(Math.random() * v2List.length)];
      const v3 = v3List[Math.floor(Math.random() * v3List.length)];

      return `${v1}\n${v2}\n${v3}`;
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

// ============================================================================
// JPShaderEditor Support (Local Engine + VPS Proxy)
// Permite que cambiapalabras cargue include.js, webglrenderer.js, jp-node-graph.js
// y resuelva planes de renderizado hacia el backend del VPS sin errores de CORS ni bloqueos
// ============================================================================
const JP_SHADER_DIR = 'D:/Programacion/sistemasfullscreen/jpshaderszone/jpshadereditor';
const JP_VPS_ORIGIN = 'https://vps-4455523-x.dattaweb.com';

if (fs.existsSync(JP_SHADER_DIR)) {
  // Engine embebible local con parches de inicialización de WebGLRenderer
  app.get('/jpshadereditor/include.js', (req, res) => {
    const filePath = path.join(JP_SHADER_DIR, 'public', 'js', 'lib', 'jpshadereditorInclude.js');
    if (!fs.existsSync(filePath)) return res.status(404).send('// include.js no encontrado');
    res.type('application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(filePath).pipe(res);
  });

  // Estáticos del editor (renderer, node graph, socket, pointers)
  app.use('/jpshadereditor/js', express.static(path.join(JP_SHADER_DIR, 'public', 'js'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
  }));

  // Proxy de APIs hacia el VPS (compositions, shaders, plans, info, include/*)
  //
  // 1) HAY QUE REENVIAR EL Content-Type. Antes solo se mandaba Accept: el
  //    express.json() del VPS no parseaba el body y POST /api/include/register
  //    respondia 400 'falta key'. Sintoma: el include nunca quedaba registrado,
  //    el admin no veia la pagina y su fuente FIJADA nunca se aplicaba en local.
  // 2) Los GET de listas se cachean 30 s: el backend tarda 20-40 s en /api/shaders
  //    y /api/compositions (y a veces devuelve 504), asi que el panel del include
  //    parecia vacio. NO se cachea /include/ (el plan tiene que refrescar en vivo).
  const JP_PROXY_CACHE_TTL = Number(process.env.JP_PROXY_CACHE_TTL || 30000);
  const JP_PROXY_CACHEABLES = ['/shaders', '/compositions', '/performance-sessions'];
  const jpProxyCache = new Map();
  app.use('/jpshadereditor/api', async (req, res) => {
    const cacheable = req.method === 'GET' && JP_PROXY_CACHEABLES.includes(req.path);
    const cacheKey = cacheable ? req.originalUrl : null;
    if (cacheKey) {
      const hit = jpProxyCache.get(cacheKey);
      if (hit && (Date.now() - hit.at) < JP_PROXY_CACHE_TTL) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-JP-Proxy-Cache', 'HIT');
        res.type(hit.type);
        return res.status(200).send(hit.body);
      }
    }
    try {
      const vpsUrl = `${JP_VPS_ORIGIN}/jpshadereditor/api${req.url}`;
      const headers = { 'Accept': req.headers['accept'] || 'application/json, text/plain, */*' };
      if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
      const response = await fetch(vpsUrl, {
        method: req.method,
        headers,
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body || {}) : undefined
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(response.status);
      const data = await response.text();
      const tipo = response.headers.get('content-type') || 'application/json';
      res.type(tipo);
      if (cacheKey && response.status === 200 && data.length < 4 * 1024 * 1024) {
        jpProxyCache.set(cacheKey, { at: Date.now(), body: data, type: tipo });
      }
      res.send(data);
    } catch (err) {
      console.error('[JPShaderEditor Proxy] Error:', err.message);
      res.status(502).json({ ok: false, error: 'Error comunicando con el VPS de shaders' });
    }
  });
}

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

function broadcastGlobalStyle(cfg) {
  try {
    const payload = JSON.stringify({ type: 'globalstyle:update', config: cfg, timestamp: Date.now() });
    for (const client of wsClients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  } catch (e) {
    console.warn('[WebSocket] Error al emitir globalstyle:update:', e.message);
  }
}

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  console.log(`[WebSocket] Cliente conectado (${wsClients.size} activos) desde ${req.socket.remoteAddress}`);

  try {
    ws.send(JSON.stringify({ type: 'server:welcome', clients: wsClients.size, timestamp: Date.now() }));
    if (fs.existsSync(globalStylePath)) {
      const currentGlobalStyle = JSON.parse(fs.readFileSync(globalStylePath, 'utf-8'));
      ws.send(JSON.stringify({ type: 'globalstyle:update', config: currentGlobalStyle, timestamp: Date.now() }));
    }
  } catch (e) {}
  broadcastClientCount();

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'globalstyle:update' && parsed.config) {
        try {
          fs.writeFileSync(globalStylePath, JSON.stringify(parsed.config, null, 2), 'utf-8');
          registrarJsonGuardado('DISENO GLOBAL (globalstyle)', globalStylePath, parsed.config);
        } catch (e) {}
      }
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

/* SEMBRADO INICIAL DEL REGISTRO DE JSONs: al arrancar se listan los JSON de
   configuracion que YA existen (config.json, game_config.json, user_clusters.json,
   global_style.json), asi /jsons.html muestra todo desde el primer momento. */
setTimeout(() => {
  [
    ['CONFIG DEL JUEGO (raiz)', rootConfigPath],
    ['CONFIG DEL JUEGO (game-config)', configFilePath],
    ['BIBLIOTECA DE CLUSTERS', clustersFilePath],
    ['DISENO GLOBAL (globalstyle)', globalStylePath]
  ].forEach(([etq, ruta]) => {
    try {
      if (fs.existsSync(ruta)) {
        registrarJsonGuardado(etq, ruta, JSON.parse(fs.readFileSync(ruta, 'utf-8')), { semilla: true });
      }
    } catch (e) { /* archivo ausente o JSON invalido: se ignora */ }
  });
  console.log('[Registro JSON] sembrado inicial listo.');
}, 1500);

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});
