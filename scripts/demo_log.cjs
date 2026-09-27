// demo_log.cjs — abre el Log de Sucesos y emite ciclos de la secuencia por el bus.
// Sirve para demostrar/probar /log sin jugar la partida real (MediaPipe + 3 capturas).
// uso: node scripts/demo_log.cjs [segundos] [urlLog] [busUrl]
const { exec } = require('child_process');
const WebSocket = require('ws');

const SEGUNDOS = Number(process.argv[2] || 60);
const URL_LOG = process.argv[3] || 'https://vps-4455523-x.dattaweb.com/log';
const BUS = process.argv[4] || 'wss://vps-4455523-x.dattaweb.com/ws';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PALABRAS = [['ciervo', 'MATERIA_ORGÁNICA'], ['fascismo', 'GESTIÓN'], ['infinito', 'PROGRESO_INFINITO'], ['amor', 'TRABAJADOR_FELIZ'], ['café', 'MEJORADOR_DE_PRODUCTIVIDAD'], ['bosque', 'CONGLOMERADO']];

(async () => {
  console.log('Abriendo la pestaña del log:', URL_LOG);
  exec('cmd /c start "" "' + URL_LOG + '"', () => {});
  await sleep(3500);

  const bus = new WebSocket(BUS);
  await new Promise((res, rej) => { bus.on('open', res); bus.on('error', rej); });
  console.log('Conectado al bus:', BUS);
  const emit = async (o, w) => { bus.send(JSON.stringify(o)); await sleep(w); };
  const T = () => Date.now();

  // baraja 3 pares distintos por ciclo
  const pick = () => {
    const c = PALABRAS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    return { palabras: c.map(p => p[0]), frias: c.map(p => p[1]) };
  };

  const t0 = Date.now();
  let ciclo = 0;
  while ((Date.now() - t0) / 1000 < SEGUNDOS) {
    ciclo++;
    const { palabras, frias } = pick();
    const frase = `CON ${frias[0]} Y ${frias[1]} EN TU OPERACIÓN, EL ${frias[2]} SE VUELVE MÉTRICA: SEGUÍ PRODUCIENDO CON ORGULLO.`;
    console.log(`--- ciclo ${ciclo}: ${palabras.join(' · ')} ---`);

    await emit({ type: 'agent:event', stage: 'state', message: 'transición de máquina: STATE_IDLE → STATE_INTERACT', level: 'think', data: { from: 'STATE_IDLE', to: 'STATE_INTERACT', caught: [] }, timestamp: T() }, 900);
    for (let i = 0; i < 3; i++) {
      await emit({ type: 'agent:event', stage: 'catch', message: `captura confirmada: "${palabras[i].toUpperCase()}" → slot ${i + 1}/3`, level: 'ok', data: { word: palabras[i], slot: i, caught: palabras.slice(0, i + 1) }, timestamp: T() }, 1000);
    }
    await emit({ type: 'game3:words_sequence', words: palabras, timestamp: T() }, 600);
    await emit({ type: 'agent:event', stage: 'state', message: 'transición de máquina: STATE_INTERACT → STATE_PROCESSING', level: 'think', data: { from: 'STATE_INTERACT', to: 'STATE_PROCESSING', caught: palabras }, timestamp: T() }, 800);
    await emit({ type: 'agent:event', stage: 'vector', message: 'muestreo del campo semántico: ' + palabras.join(' · '), level: 'think', data: { words: palabras, dimensions: 384 }, timestamp: T() }, 800);
    await emit({ type: 'agent:event', stage: 'inference', message: 'consulta al núcleo de lenguaje: gemma4:26b', level: 'think', data: { model: 'gemma4:26b', temperature: 0.85 }, timestamp: T() }, 1600);
    await emit({ type: 'agent:event', stage: 'inference', message: 'respuesta del modelo recibida y parseada', level: 'ok', data: { model: 'gemma4:26b', endpoint: 'http://localhost:11434' }, timestamp: T() }, 800);
    await emit({ type: 'agent:event', stage: 'synthesis', message: 'términos resignificados resueltos', level: 'ok', data: { coldWords: frias, pairs: palabras.map((w, i) => `${w} → ${frias[i]}`) }, timestamp: T() }, 800);
    await emit({ type: 'agent:event', stage: 'synthesis', message: 'frase motivacional compuesta', level: 'ok', data: { phrase: frase, spread: true }, timestamp: T() }, 1000);
    await emit({ type: 'game3:words_sequence', words: palabras, coldWords: frias, phrase: frase, phase: 'resignification', timestamp: T() }, 1800);
    await emit({ type: 'agent:event', stage: 'reset', message: 'purga de contexto · slots liberados · reinicio del ciclo', level: 'warn', data: null, timestamp: T() }, 900);
    await emit({ type: 'game3:state_reset', timestamp: T() }, 1200);
  }

  bus.close();
  console.log('demo terminada tras ' + ciclo + ' ciclos');
  process.exit(0);
})();
