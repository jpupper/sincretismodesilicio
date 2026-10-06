import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const configPath = path.join(__dirname, 'config.json');

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

const defaultConfig = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Poético de Sincretismo de Silicio. Tu misión es fundir conceptos humanos en la frialdad sublime del silicio.\nTu objetivo:\n1) Resignificar cada una de las 3 palabras humanas en un TÉRMINO FRÍO, TÉCNICO O CIBERNÉTICO en mayúsculas (1 o 2 palabras unidas por guion bajo cuando sea necesario).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) que una los 3 términos en una sola escena poética con sentido profundo:\n- Verso 1: integra el término 1 como fundamento, sustrato o atmósfera del entorno.\n- Verso 2: integra el término 2 como una acción, movimiento o tensión activa en ese entorno.\n- Verso 3: integra el término 3 como una percepción íntima, contemplativa o filosófica en primera persona.\nREGLA CRUCIAL DE CONEXIÓN: Los tres versos deben narrar una sola imagen poética conectada y coherente donde los tres conceptos interactúan con naturalidad. NO deben sonar a palabras forzadas ni listas inconexas.\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 con TERMINO_1\\nVerso 2 con TERMINO_2\\nVerso 3 con TERMINO_3"}.',
  wordsPool: defaultWordsPool
};

// 1. GET /config - Leer configuración desde config.json
app.get('/config', (req, res) => {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.wordsPool) || parsed.wordsPool.length === 0) {
        parsed.wordsPool = defaultWordsPool;
      }
      return res.json(parsed);
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return res.json(defaultConfig);
  } catch (err) {
    console.error('[SERVER] Error al leer config.json:', err);
    return res.status(500).json({ error: 'Error al leer config.json' });
  }
});

// 2. POST /config - Escribir físicamente en config.json
app.post('/config', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Payload de configuración inválido' });
    }

    let wordsPool = defaultWordsPool;
    if (Array.isArray(payload.wordsPool)) {
      wordsPool = Array.from(new Set(
        payload.wordsPool
          .map(w => String(w).trim().toLowerCase())
          .filter(w => w.length > 0)
      ));
      if (wordsPool.length === 0) wordsPool = defaultWordsPool;
    } else if (fs.existsSync(configPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (Array.isArray(prev.wordsPool)) wordsPool = prev.wordsPool;
      } catch (e) {}
    }

    const updatedConfig = {
      ollamaModel: String(payload.ollamaModel || 'llama3.2:latest').trim(),
      systemPrompt: String(payload.systemPrompt || defaultConfig.systemPrompt).trim(),
      wordsPool
    };
    // Colores globales de la interfaz (pestaña COLORES) — se preservan si no vienen en el payload
    if (payload.uiColors && typeof payload.uiColors === 'object') {
      updatedConfig.uiColors = payload.uiColors;
    } else {
      try {
        const prev = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (prev.uiColors && typeof prev.uiColors === 'object') updatedConfig.uiColors = prev.uiColors;
      } catch (e) {}
    }

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    console.log('[SERVER] config.json guardado físicamente. Modelo:', updatedConfig.ollamaModel, 'Palabras:', updatedConfig.wordsPool.length);
    return res.json({ success: true, message: 'Configuración guardada físicamente', config: updatedConfig });
  } catch (err) {
    console.error('[SERVER] Error al escribir config.json:', err);
    return res.status(500).json({ error: 'Error al escribir config.json' });
  }
});

// Endpoint para detectar todos los modelos disponibles en Ollama local
app.get('/api/ollama/models', async (req, res) => {
  let activeModel = 'llama3.2:latest';
  try {
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
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
    console.warn('[SERVER] Ollama offline o inaccesible:', err.message);
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

// Proxy y respaldo Ollama para garantizar que la instalación nunca falle por CORS
app.post('/api/ollama/generate', async (req, res) => {
  const { model, prompt, system } = req.body;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    let response;
    const bodyStr = JSON.stringify({
      model: model || 'llama3.2:latest',
      prompt,
      system,
      format: 'json',
      stream: false,
      options: {
        num_predict: 250,
        temperature: 0.7,
        repeat_penalty: 1.15
      }
    });

    try {
      response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: controller.signal
      });
    } catch (e1) {
      response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: controller.signal
      });
    }
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Ollama status: ${response.status}`);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.warn('[SERVER] Ollama offline o inaccesible, activando respaldo sintético:', err.message);
    // Extraer las palabras humanas capturadas del prompt
    const promptStr = String(prompt || '');
    const match = promptStr.match(/(?:capturados|capturadas|usar):\s*["']?([^.\n\r]+)["']?/i);
    let words = [];
    if (match) {
      words = match[1].replace(/["'”«»]/g, '').split(/[,\sy]+/).map(w => w.trim()).filter(w => w.length > 1);
    }

    // Resignificación fría y analítica (conserva la raíz semántica del concepto humano)
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
      const clean = String(w || '').toLowerCase().trim();
      if (SEMANTIC_DICT[clean]) return SEMANTIC_DICT[clean];
      for (const [k, v] of Object.entries(SEMANTIC_DICT)) {
        if (clean.startsWith(k) || k.startsWith(clean)) return v;
      }
      const stem = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'RECURSO';
      const templates = [
        (x) => `PROTOCOLO_DE_${x}`, (x) => `${x}_PRODUCTIVO`, (x) => `RENDIMIENTO_DE_${x}`,
        (x) => `${x}_OPERATIVO`, (x) => `CAPITAL_${x}`, (x) => `GESTOR_DE_${x}`,
        (x) => `${x}_ESCALABLE`, (x) => `OPTIMIZADOR_DE_${x}`
      ];
      const hash = clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return templates[Math.abs(hash) % templates.length](stem);
    };
    const picked = [
      getSyn(words[0] || 'vocación'),
      getSyn(words[1] || 'constancia'),
      getSyn(words[2] || 'disciplina')
    ];

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

    return res.json({
      fallback: true,
      response: JSON.stringify({
        nuevas_palabras: picked,
        frase_generada: composeServerHaiku(picked, words)
      })
    });
  }
});

// ============================================================================
// JPShaderEditor Support (Local Engine + VPS Proxy)
// Permite que el hijack cargue include.js, webglrenderer.js, jp-node-graph.js
// y resuelva planes de renderizado hacia el backend del VPS sin errores de CORS ni bloqueos
// ============================================================================
// Ruta del editor local. El repo vive en 'sistemasfullscreen/jpshadereditor', hermano de
// sincretismodesilicio, pero la unidad/ruta cambió (antes D:\Programacion, ahora
// C:\jpupper\programacion): se prueban candidatos y manda JP_SHADER_DIR si está definido.
const JP_SHADER_CANDIDATES = [
  process.env.JP_SHADER_DIR,
  path.resolve(__dirname, '..', '..', 'sistemasfullscreen', 'jpshadereditor'),
  path.resolve(__dirname, '..', 'sistemasfullscreen', 'jpshadereditor'),
  path.resolve(__dirname, '..', '..', 'sistemasfullscreen', 'jpshaderszone', 'jpshadereditor'),
  'C:/jpupper/programacion/sistemasfullscreen/jpshadereditor',
  'D:/Programacion/sistemasfullscreen/jpshaderszone/jpshadereditor'
].filter(Boolean);
const JP_SHADER_DIR = JP_SHADER_CANDIDATES.find(
  (p) => fs.existsSync(path.join(p, 'public', 'js', 'lib', 'jp-node-graph.js'))
) || JP_SHADER_CANDIDATES[0];
if (!fs.existsSync(JP_SHADER_DIR)) {
  console.warn('[JPShaderEditor] No encuentro el editor local; /jpshadereditor/* dará 404.');
  console.warn('[JPShaderEditor] Rutas probadas: ' + JP_SHADER_CANDIDATES.join(' | '));
  console.warn('[JPShaderEditor] Define JP_SHADER_DIR=<ruta al jpshadereditor> para forzarla.');
} else {
  console.log('[JPShaderEditor] Sirviendo engine local desde: ' + JP_SHADER_DIR);
}
// 100% LOCAL: el engine de nodos sale del jpshadereditor LOCAL (3250), no del VPS.
const JP_EDITOR_ORIGIN = process.env.JP_EDITOR_ORIGIN || 'http://localhost:3250';

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

  // Proxy de APIs hacia el VPS (compositions, shaders, plans, info)
  app.use('/jpshadereditor/api', async (req, res) => {
    try {
      const editorUrl = `${JP_EDITOR_ORIGIN}/jpshadereditor/api${req.url}`;
      const response = await fetch(editorUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json, text/plain, */*'
        },
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : undefined
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(response.status);
      const data = await response.text();
      res.type(response.headers.get('content-type') || 'application/json');
      res.send(data);
    } catch (err) {
      console.error('[JPShaderEditor Proxy] Error:', err.message);
      res.status(502).json({ ok: false, error: 'Error comunicando con el VPS de shaders' });
    }
  });
}

// Servir archivos estáticos del frontend (index.html, style.css, script.js)
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('   SINCRETISMO DE SILICIO // SECUESTRO CIBERNÉTICO');
  console.log(`   Servidor activo en: http://localhost:${PORT}`);
  console.log('================================================================');
});
