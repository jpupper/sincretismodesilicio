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
  systemPrompt: 'Eres el Núcleo de Síntesis de Sincretismo de Silicio. El usuario ha introducido 3 palabras humanas. Tu objetivo es:\n1) Resignificar cada concepto en un TÉRMINO FRÍO, TÉCNICO Y ANALÍTICO en mayúsculas (hasta 4 palabras unidas por guiones bajos cuando haga falta, ej: ciervo -> MATERIA_ORGÁNICA, infinito -> PROGRESO_INFINITO, gobierno -> PATRÓN_DE_DECISIÓN, minerales -> POTENCIALES_ACTIVOS, café -> MEJORADOR_DE_PRODUCTIVIDAD, amor -> TRABAJADOR_FELIZ).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) cumpliendo rigurosamente estas 3 pautas:\n- Verso 1 (Ubicación temporal descriptiva): Describe un momento en el tiempo, una hora o atmósfera temporal (ej: \'Al caer la tarde sobre el circuito frío,\', \'En la quietud de la medianoche,\', \'Bajo la primera luz que despunta el alba,\').\n- Verso 2 (Elemento activo con giro o relación): Introduce una acción o movimiento que genere un giro y ponga en relación elementos aparentemente inconexos (ej: \'un pulso imprevisto desvía el vuelo del pájaro,\', \'el viento frío quiebra la calma del metal,\').\n- Verso 3 (Percepción poética individual): Expresa una percepción poética surgida de la relación anterior, SIEMPRE desde un punto de vista individual en primera persona (ej: \'y en mi soledad comprendo el eco del abismo.\', \'siento en mi pecho la sombra del olvido.\').\nEl conjunto del haiku DEBE expresar una voz subjetiva e íntima del observador (punto de vista individual).\nIntegración: Los conceptos o términos deben estar vivos en los versos, sin enumerarlos en lista.\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 temporal\\nVerso 2 con acción y giro\\nVerso 3 de percepción poética individual"}.',
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

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2:latest',
        prompt,
        system,
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

    // Resignificación fría y PRODUCTIVA (conserva la raíz semántica del concepto humano)
    const SEMANTIC_DICT = {
      'ciervo': 'MATERIA_ORGÁNICA', 'infinito': 'PROGRESO_INFINITO', 'gobierno': 'PATRÓN_DE_DECISIÓN',
      'amor': 'TRABAJADOR_FELIZ', 'minerales': 'POTENCIALES_ACTIVOS', 'café': 'MEJORADOR_DE_PRODUCTIVIDAD',
      'cafe': 'MEJORADOR_DE_PRODUCTIVIDAD', 'esperanza': 'PROYECCIÓN', 'misterio': 'ENIGMA', 'hoja': 'LÁMINA',
      'perro': 'CANIDO', 'gato': 'FELINO', 'lobo': 'DEPREDADOR', 'ley': 'PROTOCOLO', 'tiempo': 'CRONOMETRÍA'
    };
    const getSyn = (w) => {
      const clean = String(w || '').toLowerCase().trim();
      if (SEMANTIC_DICT[clean]) return SEMANTIC_DICT[clean];
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

    return res.json({
      fallback: true,
      response: JSON.stringify({
        nuevas_palabras: picked,
        frase_generada: composeServerHaiku(picked, words)
      })
    });
  }
});

// Servir archivos estáticos del frontend (index.html, style.css, script.js)
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('   SINCRETISMO DE SILICIO // SECUESTRO CIBERNÉTICO');
  console.log(`   Servidor activo en: http://localhost:${PORT}`);
  console.log('================================================================');
});
