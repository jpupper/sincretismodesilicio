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

const defaultConfig = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Ejecutivo de una corporación distópica cibernética. El usuario ha osado introducir palabras humanas orgánicas y sentimentales. Tu objetivo es interceptar y neutralizar la humanidad de estas palabras. Debes responder ÚNICAMENTE con un JSON válido que contenga: 1) \'nuevas_palabras\': un array de 3 términos breves en mayúsculas de jerga cibernética, tecnocrática y corporativa hostil que reemplacen los conceptos humanos (ej. OPTIMIZACIÓN_NEURAL, OBSOLESCENCIA_BIOLÓGICA, PROTOCOLO_SUBYUGACIÓN). 2) \'frase_generada\': una sentencia lapidaria, fría y autoritaria en mayúsculas donde el sistema declara la absorción del factor biológico por la maquinaria corporativa. Estructura JSON exacta requerida: {"nuevas_palabras": ["PALABRA1", "PALABRA2", "PALABRA3"], "frase_generada": "TEXTO DE LA FRASE"}. No agregues markdown ni explicaciones adicionales.'
};

// 1. GET /config - Leer configuración desde config.json
app.get('/config', (req, res) => {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return res.json(JSON.parse(content));
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

    const updatedConfig = {
      ollamaModel: String(payload.ollamaModel || 'llama3.2:latest').trim(),
      systemPrompt: String(payload.systemPrompt || defaultConfig.systemPrompt).trim()
    };

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    console.log('[SERVER] config.json guardado físicamente:', updatedConfig.ollamaModel);
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
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2:latest',
        prompt,
        system,
        format: 'json',
        stream: false
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
      'ALGORITMIZACIÓN_DEL_AFECTO'
    ];
    const picked = [];
    while (picked.length < 3) {
      const term = cyberTerms[Math.floor(Math.random() * cyberTerms.length)];
      if (!picked.includes(term)) picked.push(term);
    }
    return res.json({
      fallback: true,
      response: JSON.stringify({
        nuevas_palabras: picked,
        frase_generada: 'EL FACTOR BIOLÓGICO HA SIDO DEPURADO. SUS RESIDUOS SENTIMENTALES QUEDAN REASIGNADOS A LA CUOTA DE RENDIMIENTO DEL SILICIO.'
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
