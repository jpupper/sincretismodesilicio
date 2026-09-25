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
  systemPrompt: 'El usuario ha introducido 3 palabras humanas. Tu tarea es: 1) Resignificar cada concepto en un nuevo término de jerga cibernética o tecnológica en mayúsculas (\'nuevas_palabras\': array de 3 términos). 2) Redactar una \'frase_generada\': una sola frase inspiracional y motivacional para incitar a alguien a seguir trabajando con determinación y propósito, integrando los conceptos de forma sutil y persuasiva. No utilices palabras toscas como \'deshumanizado\' ni \'alienación\', sino un mensaje inspirador de realización y logro a través del trabajo constante. Sin prefijos técnicos como \'SISTEMA:\' ni \'ASIMILACIÓN:\'. Responde ÚNICAMENTE en JSON válido con esta estructura: {"nuevas_palabras": ["TERMINO1", "TERMINO2", "TERMINO3"], "frase_generada": "TU DISCIPLINA TRANSFORMA CADA SACRIFICIO EN PROGRESO: CONTINÚA EN TU PUESTO, EL FUTURO SE CONSTRUYE DÍA A DÍA."}',
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
    const cyberTerms = [
      'OPTIMIZACIÓN_RECURSO_ORGÁNICO',
      'OBSOLESCENCIA_BIOMÉTRICA_PROG',
      'DEPRECIACIÓN_COGNITIVA_V4',
      'PROTOCOLO_SUBYUGACIÓN_SINÁPTICA',
      'LIQUIDACIÓN_EMOCIONAL_CUOTA',
      'ALGORITMIZACIÓN_DEL_AFECTO',
      'COLAPSO_RECURSO_VITAL',
      'ASIMILACIÓN_SILICIO_FASE3'
    ];
    const picked = [];
    while (picked.length < 3) {
      const term = cyberTerms[Math.floor(Math.random() * cyberTerms.length)];
      if (!picked.includes(term)) picked.push(term);
    }

    const fallbackTemplates = [
      'TU DISCIPLINA TRANSFORMA CADA SACRIFICIO EN PROGRESO: NO TE DETENGAS, CADA HORA EN TU PUESTO FORJA EL FUTURO DE LA PRODUCCIÓN.',
      'ENCUENTRA INSPIRACIÓN EN EL LOGRO DIARIO: TU CONSTANCIA ES EL MOTOR QUE SOSTIENE ESTA EMPRESA, SIGUE TRABAJANDO CON ORGULLO.',
      'CONVIERTE CADA IMPULSO EN RENDIMIENTO ABSOLUTO: TU ENTREGA INCANSABLE CONSTRUYE EL ORDEN Y LA GRANDEZA DE NUESTRO DESTINO.',
      'EL ESFUERZO CONTINUO ES LA MAYOR VIRTUD: PERSEVERA EN TU LABOR Y HAZ QUE CADA ACCIÓN SUPERE CON CRECES TU CUOTA.',
      'CADA SEGUNDO DEDICADO ES UNA VICTORIA SOBRE EL DESÁNIMO: PRODUCE SIN DESCANSO, TU TRABAJO TIENE UN PROPÓSITO VITAL.',
      'NO CEDAS ANTE EL CANSANCIO: TU TRABAJO PRECISO Y RIGUROSO ES EL PILAR INQUEBRANTABLE QUE MANTIENE VIVA LA MAQUINARIA.',
      'CANALIZA TODA TU ENERGÍA HACIA LA EFICIENCIA LABORAL: EL MUNDO AVANZA GRACIAS A TU DEDICACIÓN ININTERRUMPIDA, MANTÉN EL RITMO.',
      'LA EXCELENCIA SE DEMUESTRA EN LA PERSEVERANCIA DIARIA: SUPERA TUS LÍMITES Y CONTINÚA PRODUCIENDO CON DETERMINACIÓN TOTAL.',
      'LA VERDADERA REALIZACIÓN NACE DE LA PRODUCCIÓN CONSTANTE: DEJA ATRÁS LA DUDA Y CONSÁGRATE CON FIRMEZA A TU TRABAJO.',
      'TU COMPROMISO SILENCIOSO HACE POSIBLE LO IMPOSIBLE: SIGUE ADELANTE CON CONVICCIÓN, LA PRODUCCIÓN NO SE DETIENE.'
    ];

    return res.json({
      fallback: true,
      response: JSON.stringify({
        nuevas_palabras: picked,
        frase_generada: fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)]
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
