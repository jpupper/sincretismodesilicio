/**
 * SINCRETISMO DE SILICIO - SECUESTRO CIBERNÉTICO
 * Instalación Artística Interactiva Full Stack
 * MediaPipe Pose + Trackeo Mouse Prioritario + Shader ASCII WebGL + Detección Dinámica Ollama
 */

// ============================================================================
// RESOLUCIÓN DE BASE / ENDPOINTS (raíz, subpath /sincretismo, FTP estático)
// Se definen en js/base-path.js; acá van con fallback por si no se cargó.
// ============================================================================
const SB_BASE = (typeof window.SB_BASE === 'string') ? window.SB_BASE : '';
const sbUrl = typeof window.sbUrl === 'function' ? window.sbUrl : function (p) { return SB_BASE + (p || ''); };
const sbApi = typeof window.sbApi === 'function' ? window.sbApi : function (p) { return SB_BASE + (p || ''); };
const sbFetch = typeof window.sbFetch === 'function' ? window.sbFetch : function (p, o) { return fetch(SB_BASE + (p || ''), o); };
const sbWsUrl = typeof window.sbWsUrl === 'function'
  ? window.sbWsUrl
  : function () {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}${SB_BASE}/ws`;
    };
const getOllamaUrl = typeof window.getOllamaUrl === 'function' ? window.getOllamaUrl : function () { return 'http://localhost:11434'; };
const setOllamaUrl = typeof window.setOllamaUrl === 'function' ? window.setOllamaUrl : function () {};
const getOllamaUrls = typeof window.getOllamaUrls === 'function' ? window.getOllamaUrls : function () { return ['http://localhost:11434']; };

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN PREDETERMINADA
// ============================================================================
const STATES = {
  IDLE: 'STATE_IDLE',
  INTERACT: 'STATE_INTERACT',
  PROCESSING: 'STATE_PROCESSING',
  HIJACK: 'STATE_HIJACK',
  RESET: 'STATE_RESET'
};

const DEFAULT_WORDS_POOL = [
  // 30 palabras fundacionales
  'amor', 'nostalgia', 'fragilidad', 'ternura', 'abrazo', 
  'recuerdo', 'latido', 'suspiro', 'silencio', 'alma', 
  'caricia', 'esperanza', 'anhelo', 'piel', 'lágrima', 
  'respirar', 'cuerpo', 'deseo', 'infancia', 'duelo', 
  'poesía', 'mirada', 'calidez', 'intimidad', 'olvido', 
  'consuelo', 'vulnerabilidad', 'sueño', 'tiempo', 'perdón',

  // 124 palabras humanas orgánicas adicionales
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

const DEFAULT_CONFIG = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo de Síntesis de Sincretismo de Silicio. El usuario ha introducido 3 palabras humanas. Tu objetivo es:\n1) Resignificar cada concepto en un TÉRMINO FRÍO, TÉCNICO Y ANALÍTICO en mayúsculas (hasta 4 palabras unidas por guiones bajos cuando haga falta, ej: ciervo -> MATERIA_ORGÁNICA, infinito -> PROGRESO_INFINITO, gobierno -> PATRÓN_DE_DECISIÓN, minerales -> POTENCIALES_ACTIVOS, café -> MEJORADOR_DE_PRODUCTIVIDAD, amor -> TRABAJADOR_FELIZ).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) cumpliendo rigurosamente estas 3 pautas:\n- Verso 1 (Ubicación temporal descriptiva): Describe un momento en el tiempo, una hora o atmósfera temporal (ej: \'Al caer la tarde sobre el circuito frío,\', \'En la quietud de la medianoche,\', \'Bajo la primera luz que despunta el alba,\').\n- Verso 2 (Elemento activo con giro o relación): Introduce una acción o movimiento que genere un giro y ponga en relación elementos aparentemente inconexos (ej: \'un pulso imprevisto desvía el vuelo del pájaro,\', \'el viento frío quiebra la calma del metal,\').\n- Verso 3 (Percepción poética individual): Expresa una percepción poética surgida de la relación anterior, SIEMPRE desde un punto de vista individual en primera persona (ej: \'y en mi soledad comprendo el eco del abismo.\', \'siento en mi pecho la sombra del olvido.\').\nEl conjunto del haiku DEBE expresar una voz subjetiva e íntima del observador (punto de vista individual).\nIntegración: Los conceptos o términos deben estar vivos en los versos, sin enumerarlos en lista.\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 temporal\\nVerso 2 con acción y giro\\nVerso 3 de percepción poética individual"}.',
  wordsPool: [...DEFAULT_WORDS_POOL]
};

let HUMAN_WORDS_POOL = [...DEFAULT_WORDS_POOL];

// Paleta global de la interfaz — controlable desde la pestaña COLORES del modal [P]
const UI_COLORS = {
  cyan: '#00f0ff',
  green: '#00ff66',
  neonGreen: '#39ff14',
  red: '#ff0055',
  amber: '#ffb703',
  purple: '#c084fc',
  text: '#e2e8f0',
  muted: '#94a3b8',
  bgDark: '#05070a',
  borderCyan: '#00f0ff',
  borderGreen: '#00ff66',
  borderRed: '#ff0055',
  bgHud: '#05070a',
  bgSurfaceBtn: '#0a141e',
  bgAccent: '#00f0ff',
  bgAccentSoft: '#00f0ff',
  bgAccentStrong: '#00f0ff',
  bgPanel: '#0a121e',
  bgPanelDeep: '#03070d',
  bgSlot: '#080e16',
  bgCard: '#09101c',
  bgMutated: '#030e08',
  bgFinal: '#04090e',
  bgModal: '#060c16',
  bgOverlay: '#04090f',
  bgToast: '#080e18',
  bgDesp: '#16060c',
  bgInput: '#04080e',
  bgSuccess: '#00ff66',
  bgDanger: '#ff0055'
};

// Alfa de los fondos translúcidos (los <input type=color> no manejan transparencia)
const UI_COLOR_ALPHAS = {
  bgHud: 0.9,
  bgSurfaceBtn: 0.7,
  bgAccent: 0.12,
  bgAccentSoft: 0.08,
  bgAccentStrong: 0.25,
  bgPanel: 0.85,
  bgPanelDeep: 0.9,
  bgSlot: 0.88,
  bgCard: 0.92,
  bgMutated: 0.9,
  bgFinal: 0.94,
  bgModal: 0.96,
  bgOverlay: 0.98,
  bgToast: 0.92,
  bgDesp: 0.95,
  bgInput: 0.9,
  bgSuccess: 0.15,
  bgDanger: 0.15
};

// Mapa clave → variable CSS que pisa :root
const UI_CSS_VAR_MAP = {
  cyan: '--accent-cyan',
  green: '--accent-green',
  neonGreen: '--accent-neon-green',
  red: '--accent-red',
  amber: '--accent-amber',
  purple: '--accent-purple',
  text: '--text-main',
  muted: '--text-muted',
  bgDark: '--bg-dark',
  borderCyan: '--border-cyan',
  borderGreen: '--border-green',
  borderRed: '--border-red',
  bgHud: '--bg-hud',
  bgSurfaceBtn: '--bg-surface-btn',
  bgAccent: '--bg-accent',
  bgAccentSoft: '--bg-accent-soft',
  bgAccentStrong: '--bg-accent-strong',
  bgPanel: '--bg-panel',
  bgPanelDeep: '--bg-panel-deep',
  bgSlot: '--bg-slot',
  bgCard: '--bg-card',  
  bgMutated: '--bg-mutated',
  bgFinal: '--bg-final',
  bgModal: '--bg-modal',
  bgOverlay: '--bg-overlay',
  bgToast: '--bg-toast',
  bgDesp: '--bg-desp',
  bgInput: '--bg-input',
  bgSuccess: '--bg-success',
  bgDanger: '--bg-danger'
};

// ============================================================================
// PALETAS GLOBALES
// Cada paleta define SOLO 3 colores base (c1 acento principal, c2 acento
// secundario, c3 alerta/terciario). A partir de ellos se derivan TODOS los
// colores de todos los elementos de la interfaz + el fondo general.
// ============================================================================
const UI_PALETTES = [
  { id: 'cyan',      name: 'Cian Ciber',        c1: '#00f0ff', c2: '#00ff66', c3: '#ff0055' },
  { id: 'amber',     name: 'Ámbar Terminal',    c1: '#ffb703', c2: '#ffd166', c3: '#ff4d00' },
  { id: 'magenta',   name: 'Magenta Neón',      c1: '#ff2bd6', c2: '#00e5ff', c3: '#ff7a00' },
  { id: 'matrix',    name: 'Verde Matrix',      c1: '#39ff14', c2: '#00ffa3', c3: '#ff2e63' },
  { id: 'violet',    name: 'Violeta Sintético', c1: '#a855f7', c2: '#22d3ee', c3: '#f43f5e' },
  { id: 'corporate', name: 'Rojo Corporativo',  c1: '#ff2e2e', c2: '#ffb703', c3: '#00d5ff' },
  { id: 'electric',  name: 'Azul Eléctrico',    c1: '#3b82f6', c2: '#06b6d4', c3: '#f59e0b' },
  { id: 'oxide',     name: 'Oro y Óxido',       c1: '#ffd166', c2: '#e07a5f', c3: '#3d5a80' },
  { id: 'quantum',   name: 'Rosa Cuántico',     c1: '#ff4d8d', c2: '#7c3aed', c3: '#00e0b8' },
  { id: 'mono',      name: 'Monocromo',         c1: '#e2e8f0', c2: '#94a3b8', c3: '#64748b' }
];

const DEFAULT_PALETTE_ID = 'cyan';

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return { h: 0, s: 0, l: 50 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to2 = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function getPaletteById(id) {
  return UI_PALETTES.find((p) => p.id === id) ||
         UI_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID) ||
         UI_PALETTES[0];
}

// Deriva el mapa COMPLETO de colores de la interfaz desde los 3 colores base
function buildUiColorsFromPalette(pal) {
  const a = hexToHsl(pal.c1); // acento principal
  const b = hexToHsl(pal.c2); // acento secundario
  const c = hexToHsl(pal.c3); // alerta / terciario
  const text = (h, s, l) => hslToHex(h, s, l);
  // Fondos: oscuros pero teñidos con el color principal (así cambia el fondo general)
  const dk = (h, s, l) => hslToHex(h, Math.min(s, 34), l);
  return {
    cyan: pal.c1,
    green: pal.c2,
    neonGreen: hslToHex(b.h, Math.max(b.s, 65), Math.min(78, b.l + 12)),
    red: pal.c3,
    amber: hslToHex((c.h - 32 + 360) % 360, Math.max(c.s, 65), Math.min(72, c.l + 12)),
    purple: hslToHex((c.h - 72 + 360) % 360, Math.max(c.s, 55), Math.min(76, c.l + 10)),
    text: text(a.h, Math.min(a.s, 24), 92),
    muted: text(a.h, Math.min(a.s, 18), 62),
    borderCyan: pal.c1,
    borderGreen: pal.c2,
    borderRed: pal.c3,
    bgDark: dk(a.h, a.s, 3),
    bgHud: dk(a.h, a.s, 3),
    bgSurfaceBtn: dk(a.h, a.s, 8),
    bgAccent: pal.c1,
    bgAccentSoft: pal.c1,
    bgAccentStrong: pal.c1,
    bgPanel: dk(a.h, a.s, 6),
    bgPanelDeep: dk(a.h, a.s, 3),
    bgSlot: dk(a.h, a.s, 6),
    bgCard: dk(a.h, a.s, 7),
    bgMutated: dk(b.h, b.s, 4),
    bgFinal: dk(a.h, a.s, 3),
    bgModal: dk(a.h, a.s, 5),
    bgOverlay: dk(a.h, a.s, 3),
    bgToast: dk(a.h, a.s, 7),
    bgDesp: dk(c.h, c.s, 5),
    bgInput: dk(a.h, a.s, 4),
    bgSuccess: pal.c2,
    bgDanger: pal.c3
  };
}

// ============================================================================
// SELECTOR DE COLOR PROPIO (reemplaza el picker nativo, que se renderiza roto)
// Solo la cajita (swatch) del elemento; el panel se abre como popover flotante.
// ============================================================================
const WORD_COLOR_PRESETS = [
  '#ffffff', '#e2e8f0', '#94a3b8', '#00f0ff', '#39ff14',
  '#ffd166', '#ffb703', '#ff4d8d', '#c084fc', '#ff0055'
];

let wordColorPopover = null;
let wordColorState = { h: 0, s: 0, v: 100 };
let wordColorOwner = null;
let wordColorOutsideHandler = null;
let wordColorEscHandler = null;


// ============================================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================================================
const appState = {
  currentState: STATES.IDLE,
  
  // Prioridad de Entrada: Inicia con Mouse para pruebas inmediatas sin depender de cámara
  inputMode: 'mouse', // 'mouse' | 'camera'
  isUsingMouse: true, // Si es true, el mouse tiene prioridad absoluta y MediaPipe NO mueve el cursor
  lastMouseMoveTime: 0,
  
  config: { ...DEFAULT_CONFIG },
  
  // Posiciones de Cursor
  cursorX: window.innerWidth / 2,
  cursorY: window.innerHeight / 2,
  targetCursorX: window.innerWidth / 2,
  targetCursorY: window.innerHeight / 2,
  cursorActive: true,
  
  // MediaPipe
  poseInstance: null,
  cameraReady: false,
  landmarkConfidence: 0,
  
  // Shader ASCII
  asciiShader: null,
  asciiConfig: {
    enabled: true,
    charSize: 11,
    glyphScale: 0.9,
    fontMode: 0,
    drawBg: true,
    autoTint: true,
    baseColor: '#26f2e6',
    processingColor: '#ff1a59',
    hijackColor: '#1aff4d',
    silhouetteColor: '#39ff14',
    bgColor: '#05070a',
    bgAlpha: 0.0
  },

  // Colores globales de la interfaz (Pestaña COLORES)
  uiColors: { ...UI_COLORS },
  // Paleta global activa ('custom' = el usuario editó colores a mano)
  uiPalette: DEFAULT_PALETTE_ID,

  // Motor de Partículas & Palabras Orgánicas (Pestaña PARTÍCULAS)
  particlesConfig: {
    fontFamily: 'share-tech',
    fontSize: 16,
    color: '#ffffff',
    outline: 1.0,
    outlineGlow: true,
    lifetime: 0,
    maxWords: 9,
    speed: 1.0
  },

  // Shader Frame Difference con Feedback
  frameDiffShader: null,
  
  // Palabras Flotantes
  floatingWords: [],
  maxFloatingWords: 9,
  caughtWords: [], // Máximo 3
  
  // Dwell / Temporizador de Proximidad
  targetedWordIndex: -1,
  dwellTimer: 0,
  dwellDuration: 1.2, // Segundos de proximidad para atrapar
  
  // Audio
  audioEnabled: true,
  audioCtx: null,
  
  // Timers
  hijackResetTimeout: null,
  typewriterInterval: null,

  // Configuración de Tracking y Calibración
  trackingConfig: {
    showOpenPose: false,
    drawBones: true,
    drawLandmarks: true,
    boneWidth: 4,
    pointRadius: 5,
    minConfidence: 0.5,
    colorTheme: 'cyberpunk', // 'classic' | 'cyberpunk' | 'phosphor' | 'thermal'
    bodyCollision: true, // REQUERIMIENTO 6: Colisión multi-articular de OpenPose con palabras
    showDepthMap: false,
    depthMode: 'cyberpunk', // 'cyberpunk' | 'thermal' | 'monochrome'
    depthContrast: 1.5,
    depthInShader: true, // REQUERIMIENTO 3: Máscara depth en shader ASCII sobre la silueta
    bodyColor: 'neon-green', // REQUERIMIENTO 3: Color de letras en silueta corporal
    showFaceCamera: false,
    faceBoxOnScreen: true, // REQUERIMIENTO 10: Dibujar cuadrito que trackea la cara en posición real
    faceZoom: 1.8,
    faceReticle: true,
    faceSmoothing: true,
    frameDifference: false, // REQUERIMIENTO 2: Capa FRAME DIFFERENCE de análisis óptico en GPU
    frameDiffLimit: 0.08,   // Umbral de sensibilidad (limit)
    frameDiffForce: 0.85,   // Fuerza del buffer de feedback (force)
    frameDiffOrig: false,   // Color original de video (origcolor)
    flowField: false, // REQUERIMIENTO 7: Capa FLOW FIELD de análisis óptico
    trackingAnchor: 'nose', // 'nose' | 'right_wrist' | 'left_wrist' | 'chest'
    smoothingFactor: 0.55
  },

  // Últimos landmarks detectados para colisiones y análisis
  lastLandmarks: [],
  generalFps: 60,
  lastFpsUpdate: 0,

  // Estado dinámico del encuadre y seguimiento facial
  faceTrackingState: {
    smoothX: 0.5,
    smoothY: 0.35,
    smoothSize: 0.28,
    scanPhase: 0,
    hasFace: false
  },

  // Telemetría en tiempo real
  trackingStats: {
    lastPoseTime: performance.now(),
    fps: 0,
    detectedPoints: 0,
    hasSegmentation: false
  },

  // Configuración de Composición & Capas de Render (Pestaña RENDER)
  renderConfig: {
    cameraEnabled: true,
    cameraOpacity: 1.0,
    asciiEnabled: true,
    asciiOpacity: 0.92,
    frameDiffEnabled: false,
    frameDiffOpacity: 0.88,
    openposeEnabled: false,
    openposeOpacity: 1.0,
    pointersEnabled: true,
    pointersOpacity: 1.0,
    depthEnabled: false,
    faceEnabled: false,
    scanlinesEnabled: false,
    scanlinesOpacity: 0.85,
    noiseEnabled: false,
    noiseOpacity: 0.40,
    noiseScale: 2.0,
    corpParticlesEnabled: true,
    corpParticlesOpacity: 0.80,
    cutoutEnabled: false,
    cutoutThreshold: 0.28
  }
};

// ============================================================================
// REFERENCIAS DOM
// ============================================================================
const DOM = {
  container: document.getElementById('installation-container'),
  video: document.getElementById('webcam-video'),
  cutoutCanvas: document.getElementById('cutout-camera-canvas'),
  asciiCanvas: document.getElementById('ascii-camera-canvas'),
  framediffCanvas: document.getElementById('framediff-camera-canvas'),
  openposeCanvas: document.getElementById('openpose-overlay-canvas'),
  pointersCanvas: document.getElementById('pointers-overlay-canvas'),
  corporateRainCanvas: document.getElementById('corporate-rain-canvas'),
  vhsGlitchLayer: document.getElementById('vhs-glitch-layer'),
  cctvScanlines: document.getElementById('cctv-scanlines'),
  cctvVignette: document.getElementById('cctv-vignette'),
  noiseCanvas: document.getElementById('noise-canvas'),

  // Botón Universo 3D por Cúmulos
  btnOpenCosmosClusters: document.getElementById('btn-open-cosmos-clusters'),
  btnOpenLog: document.getElementById('btn-open-log'),

  // Pestaña RENDER & CAPAS
  cfgRenderCameraToggle: document.getElementById('cfg-render-camera-toggle'),
  cfgRenderCameraOpacity: document.getElementById('cfg-render-camera-opacity'),
  valRenderCameraOpacity: document.getElementById('val-render-camera-opacity'),

  cfgRenderAsciiToggle: document.getElementById('cfg-render-ascii-toggle'),
  cfgRenderAsciiOpacity: document.getElementById('cfg-render-ascii-opacity'),
  valRenderAsciiOpacity: document.getElementById('val-render-ascii-opacity'),

  cfgRenderFrameDiffToggle: document.getElementById('cfg-render-framediff-toggle'),
  cfgRenderFrameDiffOpacity: document.getElementById('cfg-render-framediff-opacity'),
  valRenderFrameDiffOpacity: document.getElementById('val-render-framediff-opacity'),

  cfgRenderOpenposeToggle: document.getElementById('cfg-render-openpose-toggle'),
  cfgRenderOpenposeOpacity: document.getElementById('cfg-render-openpose-opacity'),
  valRenderOpenposeOpacity: document.getElementById('val-render-openpose-opacity'),

  cfgRenderPointersToggle: document.getElementById('cfg-render-pointers-toggle'),
  cfgRenderPointersOpacity: document.getElementById('cfg-render-pointers-opacity'),
  valRenderPointersOpacity: document.getElementById('val-render-pointers-opacity'),

  cfgRenderDepthToggle: document.getElementById('cfg-render-depth-toggle'),
  cfgRenderFaceToggle: document.getElementById('cfg-render-face-toggle'),

  cfgRenderCutoutToggle: document.getElementById('cfg-render-cutout-toggle'),
  cfgRenderCutoutContrast: document.getElementById('cfg-render-cutout-contrast'),
  valRenderCutoutContrast: document.getElementById('val-render-cutout-contrast'),

  cfgRenderScanlinesToggle: document.getElementById('cfg-render-scanlines-toggle'),
  cfgRenderScanlinesOpacity: document.getElementById('cfg-render-scanlines-opacity'),
  valRenderScanlinesOpacity: document.getElementById('val-render-scanlines-opacity'),

  cfgRenderNoiseToggle: document.getElementById('cfg-render-noise-toggle'),
  cfgRenderNoiseOpacity: document.getElementById('cfg-render-noise-opacity'),
  valRenderNoiseOpacity: document.getElementById('val-render-noise-opacity'),
  cfgRenderNoiseScale: document.getElementById('cfg-render-noise-scale'),
  valRenderNoiseScale: document.getElementById('val-render-noise-scale'),

  cfgRenderCorpParticlesToggle: document.getElementById('cfg-render-corpparticles-toggle'),
  cfgRenderCorpParticlesOpacity: document.getElementById('cfg-render-corpparticles-opacity'),
  valRenderCorpParticlesOpacity: document.getElementById('val-render-corpparticles-opacity'),

  // Monitores PiP Tácticos
  depthPip: document.getElementById('depth-map-pip'),
  depthCanvas: document.getElementById('depth-map-canvas'),
  btnCloseDepthPip: document.getElementById('btn-close-depth-pip'),
  depthMetaCoverage: document.getElementById('depth-meta-coverage'),
  depthMetaZ: document.getElementById('depth-meta-z'),
  depthFooterMode: document.getElementById('depth-footer-mode'),
  depthPipFps: document.getElementById('depth-pip-fps'),

  facePip: document.getElementById('face-cam-pip'),
  faceCanvas: document.getElementById('face-cam-canvas'),
  btnCloseFacePip: document.getElementById('btn-close-face-pip'),
  faceMetaConf: document.getElementById('face-meta-conf'),
  faceFooterZoom: document.getElementById('face-footer-zoom'),
  faceFooterTracking: document.getElementById('face-footer-tracking'),
  
  // HUD
  hudTimestamp: document.getElementById('hud-timestamp'),
  hudGeneralFps: document.getElementById('hud-general-fps'),
  hudStateText: document.getElementById('hud-state-text'),
  btnToggleInput: document.getElementById('btn-toggle-input'),
  inputModeIcon: document.getElementById('input-mode-icon'),
  inputModeLabel: document.getElementById('input-mode-label'),
  btnOpenConfig: document.getElementById('btn-open-config'),
  btnToggleAudio: document.getElementById('btn-toggle-audio'),
  audioIcon: document.getElementById('audio-icon'),
  btnFullscreen: document.getElementById('btn-fullscreen'),
  
  // Telemetría
  telemetrySensor: document.getElementById('telemetry-sensor'),
  telemetryCoords: document.getElementById('telemetry-coords'),
  telemetryConfidence: document.getElementById('telemetry-confidence'),
  
  // Capas Interactivas
  floatingLayer: document.getElementById('floating-words-layer'),
  reticle: document.getElementById('cursor-reticle'),
  reticleLabel: document.getElementById('reticle-label'),
  
  // Slots
  slots: [
    document.getElementById('slot-0'),
    document.getElementById('slot-1'),
    document.getElementById('slot-2')
  ],
  
  // Escenario Central de Resignificación y Síntesis
  mutationStage: document.getElementById('mutation-stage'),
  desprocesandoBanner: document.getElementById('desprocesando-banner'),
  mutationWordsContainer: document.getElementById('mutation-words-container'),
  mutCards: [
    document.getElementById('mut-card-0'),
    document.getElementById('mut-card-1'),
    document.getElementById('mut-card-2')
  ],
  mutTexts: [
    document.getElementById('mut-text-0'),
    document.getElementById('mut-text-1'),
    document.getElementById('mut-text-2')
  ],
  mutBadges: [
    document.getElementById('mut-badge-0'),
    document.getElementById('mut-badge-1'),
    document.getElementById('mut-badge-2')
  ],
  finalSpeechBox: document.getElementById('final-speech-box'),
  finalTypewriterText: document.getElementById('final-typewriter-text'),
  
  // Modal Config & Pestañas
  configModal: document.getElementById('config-modal'),
  modalTabsNav: document.getElementById('modal-tabs-nav'),
  tabBtns: document.querySelectorAll('.modal-tab-btn'),
  tabPanes: document.querySelectorAll('.modal-tab-pane'),
  tabWordsCountBadge: document.getElementById('tab-words-count-badge'),
  btnTogglePromptExpand: document.getElementById('btn-toggle-prompt-expand'),
  cfgActiveModelBadge: document.getElementById('cfg-active-model-badge'),
  cfgOllamaStatusTag: document.getElementById('cfg-ollama-status-tag'),
  cfgModelSelect: document.getElementById('cfg-model-select'),
  cfgOllamaUrl: document.getElementById('cfg-ollama-url'),
  btnRefreshModels: document.getElementById('btn-refresh-models'),
  cfgModelName: document.getElementById('cfg-model-name'),
  cfgSystemPrompt: document.getElementById('cfg-system-prompt'),
  cfgAsciiEnabled: document.getElementById('cfg-ascii-enabled'),
  cfgAsciiSize: document.getElementById('cfg-ascii-size'),
  valAsciiSize: document.getElementById('val-ascii-size'),
  cfgAsciiGlyphScale: document.getElementById('cfg-ascii-glyph-scale'),
  valAsciiGlyphScale: document.getElementById('val-ascii-glyph-scale'),
  cfgAsciiAutoTint: document.getElementById('cfg-ascii-auto-tint'),
  cfgAsciiBaseColor: document.getElementById('cfg-ascii-base-color'),
  cfgAsciiProcessingColor: document.getElementById('cfg-ascii-processing-color'),
  cfgAsciiHijackColor: document.getElementById('cfg-ascii-hijack-color'),
  cfgAsciiBodyColor: document.getElementById('cfg-ascii-body-color'),
  cfgAsciiBgColor: document.getElementById('cfg-ascii-bg-color'),
  cfgAsciiBgAlpha: document.getElementById('cfg-ascii-bg-alpha'),
  valAsciiBgAlpha: document.getElementById('val-ascii-bg-alpha'),
  cfgAsciiSilhouette: document.getElementById('cfg-ascii-silhouette'),
  cfgAsciiDrawBg: document.getElementById('cfg-ascii-draw-bg'),
  // Pestaña COLORES
  cfgUiCyan: document.getElementById('cfg-ui-cyan'),
  cfgUiGreen: document.getElementById('cfg-ui-green'),
  cfgUiNeonGreen: document.getElementById('cfg-ui-neon-green'),
  cfgUiRed: document.getElementById('cfg-ui-red'),
  cfgUiAmber: document.getElementById('cfg-ui-amber'),
  cfgUiPurple: document.getElementById('cfg-ui-purple'),
  cfgUiText: document.getElementById('cfg-ui-colors-text'),
  cfgUiMuted: document.getElementById('cfg-ui-muted'),
  cfgUiBgDark: document.getElementById('cfg-ui-bg-dark'),
  cfgUiBorderCyan: document.getElementById('cfg-ui-border-cyan'),
  cfgUiBorderGreen: document.getElementById('cfg-ui-border-green'),
  cfgUiBorderRed: document.getElementById('cfg-ui-border-red'),
  btnUiColorsReset: document.getElementById('btn-ui-colors-reset'),
  cfgUiBgHud: document.getElementById('cfg-ui-bg-hud'),
  cfgUiBgSurfaceBtn: document.getElementById('cfg-ui-bg-surface-btn'),
  cfgUiBgAccent: document.getElementById('cfg-ui-bg-accent'),
  cfgUiBgAccentSoft: document.getElementById('cfg-ui-bg-accent-soft'),
  cfgUiBgAccentStrong: document.getElementById('cfg-ui-bg-accent-strong'),
  cfgUiBgPanel: document.getElementById('cfg-ui-bg-panel'),
  cfgUiBgPanelDeep: document.getElementById('cfg-ui-bg-panel-deep'),
  cfgUiBgSlot: document.getElementById('cfg-ui-bg-slot'),
  cfgUiBgCard: document.getElementById('cfg-ui-bg-card'),
  cfgUiBgMutated: document.getElementById('cfg-ui-bg-mutated'),
  cfgUiBgFinal: document.getElementById('cfg-ui-bg-final'),
  cfgUiBgModal: document.getElementById('cfg-ui-bg-modal'),
  cfgUiBgOverlay: document.getElementById('cfg-ui-bg-overlay'),
  cfgUiBgToast: document.getElementById('cfg-ui-bg-toast'),
  cfgUiBgDesp: document.getElementById('cfg-ui-bg-desp'),
  cfgUiBgInput: document.getElementById('cfg-ui-bg-input'),
  cfgUiBgSuccess: document.getElementById('cfg-ui-bg-success'),
  cfgUiBgDanger: document.getElementById('cfg-ui-bg-danger'),
  // Pestaña PARTÍCULAS
  cfgPartFontSize: document.getElementById('cfg-part-fontsize'),
  valPartFontSize: document.getElementById('val-part-fontsize'),
  cfgPartFontFamily: document.getElementById('cfg-part-fontfamily'),
  cfgPartColor: document.getElementById('cfg-part-color'),
  cfgPartOutline: document.getElementById('cfg-part-outline'),
  valPartOutline: document.getElementById('val-part-outline'),
  cfgPartLifetime: document.getElementById('cfg-part-lifetime'),
  valPartLifetime: document.getElementById('val-part-lifetime'),
  cfgPartMaxWords: document.getElementById('cfg-part-maxwords'),
  valPartMaxWords: document.getElementById('val-part-maxwords'),
  cfgPartSpeed: document.getElementById('cfg-part-speed'),
  valPartSpeed: document.getElementById('val-part-speed'),
  cfgPartOutlineGlow: document.getElementById('cfg-part-outline-glow'),
  btnPartReset: document.getElementById('btn-part-reset'),
  // Banco de Palabras
  wordsCountBadge: document.getElementById('words-count-badge'),
  cfgWordsInput: document.getElementById('cfg-words-input'),
  btnAddWords: document.getElementById('btn-add-words'),
  btnReplaceWords: document.getElementById('btn-replace-words'),
  btnDefaultWords: document.getElementById('btn-default-words'),
  wordsChipsContainer: document.getElementById('words-chips-container'),
  // Pestaña Tracking & Calibración
  cfgTrackOpenpose: document.getElementById('cfg-track-openpose'),
  cfgTrackBones: document.getElementById('cfg-track-bones'),
  cfgTrackBoneWidth: document.getElementById('cfg-track-bone-width'),
  valTrackBoneWidth: document.getElementById('val-track-bone-width'),
  cfgTrackPoints: document.getElementById('cfg-track-points'),
  cfgTrackPointRadius: document.getElementById('cfg-track-point-radius'),
  valTrackPointRadius: document.getElementById('val-track-point-radius'),
  cfgTrackConfidence: document.getElementById('cfg-track-confidence'),
  valTrackConfidence: document.getElementById('val-track-confidence'),
  cfgTrackTheme: document.getElementById('cfg-track-theme'),
  cfgTrackBodyCollision: document.getElementById('cfg-track-body-collision'),
  cfgTrackDepth: document.getElementById('cfg-track-depth'),
  cfgTrackDepthShader: document.getElementById('cfg-track-depth-shader'),
  cfgTrackBodyColor: document.getElementById('cfg-track-body-color'),
  cfgTrackDepthMode: document.getElementById('cfg-track-depth-mode'),
  cfgTrackDepthContrast: document.getElementById('cfg-track-depth-contrast'),
  valTrackDepthContrast: document.getElementById('val-track-depth-contrast'),
  cfgTrackFace: document.getElementById('cfg-track-face'),
  cfgTrackFaceBox: document.getElementById('cfg-track-face-box'),
  cfgTrackFaceZoom: document.getElementById('cfg-track-face-zoom'),
  valTrackFaceZoom: document.getElementById('val-track-face-zoom'),
  cfgTrackFaceReticle: document.getElementById('cfg-track-face-reticle'),
  cfgTrackFaceSmooth: document.getElementById('cfg-track-face-smooth'),
  cfgTrackFrameDiff: document.getElementById('cfg-track-frame-diff'),
  cfgTrackFrameDiffLimit: document.getElementById('cfg-track-framediff-limit'),
  valTrackFrameDiffLimit: document.getElementById('val-track-framediff-limit'),
  cfgTrackFrameDiffForce: document.getElementById('cfg-track-framediff-force'),
  valTrackFrameDiffForce: document.getElementById('val-track-framediff-force'),
  cfgTrackFrameDiffOrig: document.getElementById('cfg-track-framediff-orig'),
  cfgTrackFlowField: document.getElementById('cfg-track-flow-field'),
  cfgTrackAnchor: document.getElementById('cfg-track-anchor'),
  cfgTrackSmoothing: document.getElementById('cfg-track-smoothing'),
  valTrackSmoothing: document.getElementById('val-track-smoothing'),
  calibCamStatus: document.getElementById('calib-cam-status'),
  calibPointsCount: document.getElementById('calib-points-count'),
  calibFps: document.getElementById('calib-fps'),
  calibDepthStatus: document.getElementById('calib-depth-status'),
  btnCenterCalibration: document.getElementById('btn-center-calibration'),
  btnResetCalibration: document.getElementById('btn-reset-calibration'),

  configStatusMsg: document.getElementById('config-status-msg'),
  btnCloseConfig: document.getElementById('btn-close-config'),
  btnCancelConfig: document.getElementById('btn-cancel-config'),
  btnSaveConfig: document.getElementById('btn-save-config'),
  btnResetDefaultConfig: document.getElementById('btn-reset-default-config'),
  
  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// MOTOR DE AUDIO PROCEDURAL (Web Audio API)
// ============================================================================
function initAudio() {
  if (!appState.audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      appState.audioCtx = new AudioContextClass();
    }
  }
  if (appState.audioCtx && appState.audioCtx.state === 'suspended') {
    appState.audioCtx.resume();
  }
}

function playSound(type, param = 0) {
  if (!appState.audioEnabled || !appState.audioCtx) return;
  try {
    const ctx = appState.audioCtx;
    const now = ctx.currentTime;
    
    if (type === 'hover-charge') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220 + param * 440, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } 
    else if (type === 'catch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } 
    else if (type === 'processing-drone') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    } 
    else if (type === 'hijack-strike') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.linearRampToValueAtTime(800, now + 0.25);
      osc2.frequency.setValueAtTime(75, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } 
    else if (type === 'typewriter') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 600, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch (e) {}
}

// Generador de tablas y colores para Silueta Corporal en Shader ASCII
const BODY_TINT_COLORS = {
  'neon-green': [0.22, 1.0, 0.08],
  'gold': [1.0, 0.8, 0.0],
  'magenta': [1.0, 0.0, 0.35],
  'cyan': [0.0, 0.94, 1.0],
  'white': [1.0, 1.0, 1.0]
};

// Convierte un color hex (#rrggbb o #rgb) a componentes normalizados 0..1 para WebGL
function hexToRgb01(hex, fallback = [0.0, 0.0, 0.0]) {
  if (!hex || typeof hex !== 'string') return fallback;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return fallback;
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return fallback;
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

// ============================================================================
// SHADER ASCII SOBRE CÁMARA (WebGL2 / WebGL)
// ============================================================================
class AsciiCameraShader {
  constructor(canvas, videoElement) {
    this.canvas = canvas;
    this.video = videoElement;
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.depthTexture = null;
    this.hasDepthMask = false;
    this.lastMaskSource = null;
    this.positionBuffer = null;
    this.uniforms = {};
    // Fuente externa del fragment shader (hot-reload con tecla R)
    this.fsUrl = sbUrl('/shaders/ascii-live.frag');
    this.vsSource = null;
    this.fsSource = null;
    this.initWebGL();
  }

  setDepthMask(maskSource) {
    if (!maskSource) return;
    this.lastMaskSource = maskSource;
    this.hasDepthMask = true;
  }

  initWebGL() {
    if (!this.canvas) return;
    this.gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false }) ||
              this.canvas.getContext('webgl', { alpha: true, antialias: false });

    if (!this.gl) {
      console.warn('[ASCII Shader] WebGL no soportado para el shader ASCII.');
      return;
    }

    const gl = this.gl;
    this.resize();

    // Shaders (guardados como campos para hot-reload con [R])
    this.vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader adaptado de ascii.frag con bitmasks 5x5 auténticas y máscara depth de silueta
    this.fsSource = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 fragColor;

      uniform vec2 u_resolution;
      uniform sampler2D u_cameraTexture;
      uniform sampler2D u_depthMaskTexture;
      uniform bool u_hasDepthMask;
      uniform bool u_useDepthMask;
      uniform vec3 u_bodyTintColor;
      uniform vec3 u_shaderBgColor;
      uniform float u_shaderBgAlpha;
      uniform float u_charSize;
      uniform float u_maskThreshold;
      uniform float u_glyphScale;
      uniform bool u_drawBgGlyphs;
      uniform vec3 u_bodyGlyphTint;
      uniform float u_opacity;
      uniform int u_fontMode;
      uniform vec3 u_tintColor;
      uniform bool u_hasCamera;
      uniform float u_time;

      float character(int n, vec2 p) {
        p = floor(p);
        if (p.x >= 0.0 && p.x <= 4.0 && p.y >= 0.0 && p.y <= 4.0) {
          int a = int(p.x) + 5 * int(p.y);
          if (((n >> a) & 1) == 1) return 1.0;
        }
        return 0.0;
      }

      int getCharBitmask(float gray) {
        int idx = int(clamp(gray * 31.0, 0.0, 31.0));

        // Modo 1: Binary (0 y 1 para intercepción)
        if (u_fontMode == 1) {
          if (idx < 2) return 0;
          if (idx < 17) return 15255086; // 0
          return 32641183; // 1
        }

        // Modo 2: Matrix Hex (0-9, A-F para secuestro)
        if (u_fontMode == 2) {
          int hexChars[16];
          hexChars[0]  = 15255086; hexChars[1]  = 32641183; hexChars[2]  = 32540703; hexChars[3]  = 32540687;
          hexChars[4]  = 18415121; hexChars[5]  = 32603679; hexChars[6]  = 32603695; hexChars[7]  = 32514081;
          hexChars[8]  = 32554031; hexChars[9]  = 32554015; hexChars[10] = 18415150; hexChars[11] = 16301619;
          hexChars[12] = 31491102; hexChars[13] = 7652647;  hexChars[14] = 32554047; hexChars[15] = 1096767;
          if (idx < 2) return 0;
          return hexChars[int(clamp(gray * 15.0, 0.0, 15.0))];
        }

        // Modo 0 (Standard 32 caracteres ASCII 5x5)
        int chars[32];
        chars[0]=0; chars[1]=4096; chars[2]=131072; chars[3]=65600; chars[4]=67648; chars[5]=32641183;
        chars[6]=4329631; chars[7]=32539681; chars[8]=147584; chars[9]=332772; chars[10]=31491102; chars[11]=1096767;
        chars[12]=16267294; chars[13]=4539953; chars[14]=1097255; chars[15]=32554047; chars[16]=18415150; chars[17]=7652647;
        chars[18]=18415153; chars[19]=18128177; chars[20]=18437745; chars[21]=18136623; chars[22]=15255086; chars[23]=15255089;
        chars[24]=18157905; chars[25]=32575775; chars[26]=16301619; chars[27]=32044094; chars[28]=18142766; chars[29]=18405233;
        chars[30]=18732593; chars[31]=11512810;
        return chars[idx];
      }

      void main() {
        vec2 pix = gl_FragCoord.xy;
        float charSize = max(4.0, u_charSize);

        vec2 cellCoord = floor(pix / charSize);
        vec2 cellCenter = (cellCoord + 0.5) * charSize;
        vec2 cellUV = cellCenter / u_resolution.xy;

        float gray = 0.0;
        vec3 baseColor = u_drawBgGlyphs ? u_tintColor : u_bodyGlyphTint;
        bool insideSil = false;

        if (u_hasCamera) {
          // Espejamos X horizontalmente para coincidir con la cámara en espejo, e invertimos Y para corregir coordenadas WebGL/video
          vec2 camUV = vec2(1.0 - cellUV.x, 1.0 - cellUV.y);
          vec4 cam = texture(u_cameraTexture, camUV);
          gray = dot(cam.rgb, vec3(0.299, 0.587, 0.114));
          // Mejorar contraste
          gray = clamp((gray - 0.15) * 1.35, 0.0, 1.0);

          // REQUERIMIENTO 3: Máscara depth/silueta RGB para colorear las letras de tu cuerpo
          if (u_hasDepthMask && u_useDepthMask) {
            vec4 maskVal = texture(u_depthMaskTexture, camUV);
            float silhouette = max(maskVal.r, maskVal.a);
            if (silhouette > u_maskThreshold) {
              insideSil = true;
              baseColor = u_bodyGlyphTint;
              gray = clamp(gray * 1.25 + 0.05, 0.0, 1.0);
            }
          }
        } else {
          // Generador procedural de vigilancia si la cámara no está activa
          float noise = sin(cellCoord.x * 0.12 + u_time * 1.5) * cos(cellCoord.y * 0.12 - u_time * 1.2);
          float ring = sin(length(cellCoord - (u_resolution / charSize) * 0.5) * 0.2 - u_time * 2.0);
          gray = clamp(0.35 + 0.35 * noise + 0.3 * ring, 0.0, 1.0);
        }

        // Color de fondo configurable del shader (donde NO hay glifo dibujado)
        vec4 bgOut = vec4(u_shaderBgColor * u_shaderBgAlpha, u_shaderBgAlpha);

        // Toggle letras de fondo: apagado, solo se dibujan glifos DENTRO de la silueta
        if (!u_drawBgGlyphs && !insideSil) {
          gray = 0.0;
        }

        int n = getCharBitmask(gray);
        if (n == 0) {
          fragColor = bgOut;
          return;
        }

        vec2 localUV = mod(pix, charSize) / charSize;
        float scale = max(0.1, u_glyphScale);
        vec2 p = (localUV - 0.5) / scale + 0.5;
        p *= 5.0;
        p.y = 4.0 - p.y;

        float charMask = character(n, p);
        if (charMask <= 0.01) {
          fragColor = bgOut;
          return;
        }

        // El glifo se compone (over) sobre el color de fondo del shader
        float coverage = charMask * u_opacity;
        vec3 outColor = mix(u_shaderBgColor, baseColor, coverage);
        float outAlpha = mix(u_shaderBgAlpha, 1.0, coverage);
        fragColor = vec4(outColor * outAlpha, outAlpha);
      }
    `;

    this.buildProgram();
  }

  // Compila y linkea el programa actual. Si falla, conserva el programa anterior.
  async buildProgram() {
    const gl = this.gl;
    if (!gl || !this.vsSource || !this.fsSource) return false;

    // Intenta usar el fragment externo (editable en vivo); si no existe, usa el embebido
    let fsSource = this.fsSource;
    try {
      const res = await fetch(this.fsUrl + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const external = await res.text();
        if (external && external.includes('fragColor')) {
          fsSource = external;
          this.fsSource = external;
        }
      }
    } catch (e) { /* archivo no presente: seguir con el embebido */ }

    const vs = this.compileShader(gl.VERTEX_SHADER, this.vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[ASCII Shader] Error en link:', gl.getProgramInfoLog(program));
      return false;
    }

    if (this.program) gl.deleteProgram(this.program);
    this.program = program;
    this.cacheUniforms();
    console.log('[ASCII LIVE] ✅ Shader recompilado y aplicado en caliente.');
    return true;
  }

  // Hot-reload del fragment shader desde /shaders/ascii-live.frag (tecla R)
  async reloadShader() {
    if (!this.gl) return false;
    const ok = await this.buildProgram();
    if (!ok) console.warn('[ASCII LIVE] ⚠️ Recarga cancelada: el shader anterior sigue activo.');
    return ok;
  }

  cacheUniforms() {
    const gl = this.gl;
    if (!gl || !this.program) return;
    // Cache uniforms
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      cameraTexture: gl.getUniformLocation(this.program, 'u_cameraTexture'),
      depthMaskTexture: gl.getUniformLocation(this.program, 'u_depthMaskTexture'),
      hasDepthMask: gl.getUniformLocation(this.program, 'u_hasDepthMask'),
      useDepthMask: gl.getUniformLocation(this.program, 'u_useDepthMask'),
      bodyTintColor: gl.getUniformLocation(this.program, 'u_bodyTintColor'),
      shaderBgColor: gl.getUniformLocation(this.program, 'u_shaderBgColor'),
      shaderBgAlpha: gl.getUniformLocation(this.program, 'u_shaderBgAlpha'),
      maskThreshold: gl.getUniformLocation(this.program, 'u_maskThreshold'),
      charSize: gl.getUniformLocation(this.program, 'u_charSize'),
      glyphScale: gl.getUniformLocation(this.program, 'u_glyphScale'),
      drawBgGlyphs: gl.getUniformLocation(this.program, 'u_drawBgGlyphs'),
      bodyGlyphTint: gl.getUniformLocation(this.program, 'u_bodyGlyphTint'),
      opacity: gl.getUniformLocation(this.program, 'u_opacity'),
      fontMode: gl.getUniformLocation(this.program, 'u_fontMode'),
      tintColor: gl.getUniformLocation(this.program, 'u_tintColor'),
      hasCamera: gl.getUniformLocation(this.program, 'u_hasCamera'),
      time: gl.getUniformLocation(this.program, 'u_time')
    };

    // Quad geometry [-1, 1]
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    // Texture 0: Camera Feed
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Texture 1: Depth Mask
    this.depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.lastVideoTime = -1;
    console.log('[ASCII Shader] WebGL inicializado con éxito con soporte Depth Mask.');
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[ASCII Shader] Error compilando:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render(timeNow) {
    if (!this.gl || !this.program || !appState.asciiConfig.enabled) {
      if (this.canvas) this.canvas.style.display = 'none';
      return;
    }
    this.canvas.style.display = 'block';

    const gl = this.gl;
    gl.useProgram(this.program);

    const hasCamera = Boolean(this.video && this.video.readyState >= 2);
    if (hasCamera) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      }
      gl.uniform1i(this.uniforms.cameraTexture, 0);
    }

    if (this.hasDepthMask && this.depthTexture && this.lastMaskSource) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.lastMaskSource);
      } catch (e) {}
      gl.uniform1i(this.uniforms.depthMaskTexture, 1);
      gl.uniform1i(this.uniforms.hasDepthMask, 1);
      gl.uniform1i(this.uniforms.useDepthMask, appState.trackingConfig.depthInShader ? 1 : 0);

      // Color de la SILUETA: prioriza el selector de la pestaña SHADER, si no el de TRACKING
      const silHex = appState.asciiConfig.silhouetteColor;
      const colorKey = appState.trackingConfig.bodyColor || 'neon-green';
      const bodyRgb = (silHex && /^#?[0-9a-f]{3,6}$/i.test(silHex))
        ? hexToRgb01(silHex, BODY_TINT_COLORS[colorKey] || [0.22, 1.0, 0.08])
        : (BODY_TINT_COLORS[colorKey] || [0.22, 1.0, 0.08]);
      gl.uniform3f(this.uniforms.bodyTintColor, bodyRgb[0], bodyRgb[1], bodyRgb[2]);
    } else {
      gl.uniform1i(this.uniforms.hasDepthMask, 0);
      gl.uniform1i(this.uniforms.useDepthMask, 0);
    }

    // Color de tinte según estado (o personalizado por el usuario)
    let tint = hexToRgb01(appState.asciiConfig.baseColor, [0.15, 0.95, 0.9]); // Cyan CCTV normal (REC)
    let fontMode = 0;
    if (appState.currentState === STATES.PROCESSING) {
      // Letras del fondo en DESPROCESANDO / RESIGNIFICACIÓN (controlable en SHADER ASCII)
      tint = hexToRgb01(appState.asciiConfig.processingColor, [1.0, 0.08, 0.35]);
      fontMode = 1; // Binario
    } else if (appState.currentState === STATES.HIJACK) {
      // Letras del fondo en SECUESTRO (controlable en SHADER ASCII)
      tint = hexToRgb01(appState.asciiConfig.hijackColor, [0.1, 1.0, 0.3]);
      fontMode = 2; // Matrix Hex
    }
    if (appState.asciiConfig.autoTint === false) {
      tint = hexToRgb01(appState.asciiConfig.baseColor, tint);
    }

    // Color de fondo del shader (0 = totalmente transparente sobre el video)
    const bgRgb = hexToRgb01(appState.asciiConfig.bgColor, [0.02, 0.03, 0.04]);
    const bgAlpha = Math.max(0, Math.min(1, Number(appState.asciiConfig.bgAlpha) || 0));
    if (this.canvas) {
      this.canvas.style.mixBlendMode = bgAlpha > 0.01 ? 'normal' : 'screen';
    }

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.charSize, appState.asciiConfig.charSize);
    gl.uniform1f(this.uniforms.glyphScale, appState.asciiConfig.glyphScale);
    // Toggle: dibujar o no las letras del fondo (sin cámara activa, quedan glifos tenues de silueta)
    const drawBgGlyphs = appState.asciiConfig.drawBg !== false;
    const bodyGlyphTint = hexToRgb01(appState.asciiConfig.silhouetteColor, [0.22, 1.0, 0.08]);
    gl.uniform1i(this.uniforms.drawBgGlyphs, drawBgGlyphs ? 1 : 0);
    gl.uniform3f(this.uniforms.bodyGlyphTint, bodyGlyphTint[0], bodyGlyphTint[1], bodyGlyphTint[2]);
    gl.uniform3f(this.uniforms.shaderBgColor, bgRgb[0], bgRgb[1], bgRgb[2]);
    gl.uniform1f(this.uniforms.shaderBgAlpha, bgAlpha);
    gl.uniform1f(this.uniforms.maskThreshold, Number(appState.renderConfig.cutoutThreshold) || 0.28);
    gl.uniform1f(this.uniforms.opacity, 0.92);
    gl.uniform1i(this.uniforms.fontMode, fontMode);
    gl.uniform3f(this.uniforms.tintColor, tint[0], tint[1], tint[2]);
    gl.uniform1i(this.uniforms.hasCamera, hasCamera ? 1 : 0);
    gl.uniform1f(this.uniforms.time, timeNow * 0.001);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

// ============================================================================
// SHADER FRAME DIFFERENCE CON FEEDBACK (WebGL2 / WebGL)
// Requerimiento 2: Comparación diferencial entre cuadros sucesivos con buffer feedback
// ============================================================================
class FrameDifferenceShader {
  constructor(canvas, videoElement) {
    this.canvas = canvas;
    this.video = videoElement;
    this.gl = null;
    this.program = null;
    this.copyProgram = null;

    this.texPrev = null;
    this.texCurr = null;
    this.hasFirstFrame = false;

    // Ping-Pong FBOs para acumulación de feedback
    this.fboA = null;
    this.fboB = null;
    this.fboRead = null;
    this.fboWrite = null;
    this.fboWidth = 640;
    this.fboHeight = 360;

    this.positionBuffer = null;
    this.uniforms = {};

    this.initWebGL();
  }

  initWebGL() {
    if (!this.canvas) return;
    this.gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false }) ||
              this.canvas.getContext('webgl', { alpha: true, antialias: false });

    if (!this.gl) {
      console.warn('[FrameDiff Shader] WebGL no soportado.');
      return;
    }

    const gl = this.gl;
    this.resize();

    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Comparación diferencial frame actual vs anterior con buffer de feedback
    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 fragColor;

      uniform vec2 resolution;
      uniform float limit;
      uniform float force;
      uniform sampler2D textura1;
      uniform sampler2D textura2;
      uniform sampler2D feedback;
      uniform bool origcolor;

      float mapr(float value, float minOut, float maxOut) {
        return minOut + clamp(value, 0.0, 1.0) * (maxOut - minOut);
      }

      void main() {
        // En video, horizontalmente invertido para alinear con la cámara CCTV espejada
        vec2 uv = vec2(1.0 - v_uv.x, 1.0 - v_uv.y);
        vec2 fbUv = v_uv;

        vec4 t1 = texture(textura1, uv);
        vec4 t2 = texture(textura2, uv);
        vec4 fb = texture(feedback, fbUv);

        vec3 dif = abs(t2.rgb - t1.rgb);
        vec3 fin = vec3(0.0);

        if (dif.r > limit || dif.g > limit || dif.b > limit) {
          if (origcolor) {
            fin = t1.rgb;
          } else {
            fin = dif;
          }
        }

        fin += fb.rgb * mapr(force, 0.0, 1.01);
        fragColor = vec4(fin, 1.0);
      }
    `;

    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('[FrameDiff Shader] Error en link:', gl.getProgramInfoLog(this.program));
      return;
    }

    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'resolution'),
      limit: gl.getUniformLocation(this.program, 'limit'),
      force: gl.getUniformLocation(this.program, 'force'),
      textura1: gl.getUniformLocation(this.program, 'textura1'),
      textura2: gl.getUniformLocation(this.program, 'textura2'),
      feedback: gl.getUniformLocation(this.program, 'feedback'),
      origcolor: gl.getUniformLocation(this.program, 'origcolor')
    };

    // Programa de copiado simple para fallback
    const copyFs = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 fragColor;
      uniform sampler2D u_tex;
      void main() {
        fragColor = texture(u_tex, v_uv);
      }
    `;
    const copyVs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const copyFrag = this.compileShader(gl.FRAGMENT_SHADER, copyFs);
    if (copyVs && copyFrag) {
      this.copyProgram = gl.createProgram();
      gl.attachShader(this.copyProgram, copyVs);
      gl.attachShader(this.copyProgram, copyFrag);
      gl.linkProgram(this.copyProgram);
    }

    // Geometría del quad
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    // Texturas de frames de video
    this.texPrev = this.createVideoTexture();
    this.texCurr = this.createVideoTexture();

    // FBOs Ping-Pong para feedback
    this.setupFBOs();

    console.log('[FrameDiff Shader] WebGL2 inicializado correctamente.');
  }

  createVideoTexture() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  setupFBOs() {
    const gl = this.gl;
    const createFBO = (w, h) => {
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return { framebuffer: fb, texture: tex, width: w, height: h };
    };

    this.fboA = createFBO(this.fboWidth, this.fboHeight);
    this.fboB = createFBO(this.fboWidth, this.fboHeight);
    this.fboRead = this.fboA;
    this.fboWrite = this.fboB;
    this.lastVideoTime = -1;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[FrameDiff Shader] Error compilando:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render() {
    if (!this.gl || !this.program || !appState.trackingConfig.frameDifference) {
      if (this.canvas) this.canvas.style.display = 'none';
      return;
    }
    if (!this.video || this.video.readyState < 2) {
      return;
    }
    this.canvas.style.display = 'block';

    const gl = this.gl;

    // 1. Intercambio de texturas de video: solo si el video avanzó de fotograma
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      if (!this.hasFirstFrame) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texPrev);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texCurr);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
        this.hasFirstFrame = true;
      } else {
        const tmp = this.texPrev;
        this.texPrev = this.texCurr;
        this.texCurr = tmp;

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texCurr);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      }
    }

    // PASO 1: Renderizar algoritmo de Frame Difference en fboWrite
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboWrite.framebuffer);
    gl.viewport(0, 0, this.fboWidth, this.fboHeight);

    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texPrev);
    gl.uniform1i(this.uniforms.textura1, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texCurr);
    gl.uniform1i(this.uniforms.textura2, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.fboRead.texture);
    gl.uniform1i(this.uniforms.feedback, 2);

    gl.uniform2f(this.uniforms.resolution, this.fboWidth, this.fboHeight);
    gl.uniform1f(this.uniforms.limit, appState.trackingConfig.frameDiffLimit ?? 0.08);
    gl.uniform1f(this.uniforms.force, appState.trackingConfig.frameDiffForce ?? 0.85);
    gl.uniform1i(this.uniforms.origcolor, appState.trackingConfig.frameDiffOrig ? 1 : 0);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PASO 2: Blit hacia el canvas en pantalla
    if (gl.blitFramebuffer) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fboWrite.framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.blitFramebuffer(
        0, 0, this.fboWidth, this.fboHeight,
        0, 0, this.canvas.width, this.canvas.height,
        gl.COLOR_BUFFER_BIT, gl.LINEAR
      );
    } else if (this.copyProgram) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.useProgram(this.copyProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboWrite.texture);
      gl.uniform1i(gl.getUniformLocation(this.copyProgram, 'u_tex'), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // PASO 3: Intercambiar FBOs para que el frame actual sea el feedback del siguiente
    const tmpFbo = this.fboRead;
    this.fboRead = this.fboWrite;
    this.fboWrite = tmpFbo;
  }
}

// ============================================================================
// SHADER DE DEPTH MAP (WebGL2 / GPU - CERO getImageData)
// Reemplaza el procesamiento en CPU de la máscara de segmentación con colormaps analíticos
// ============================================================================
class DepthMapShader {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.pointProgram = null;
    this.texture = null;
    this.quadBuffer = null;
    this.pointBuffer = null;
    this.uniforms = {};
    if (this.canvas) {
      this.initWebGL();
    }
  }

  initWebGL() {
    if (!this.canvas) return;
    const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false }) ||
               this.canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      console.warn('[DepthMapShader] WebGL no disponible para Depth Map.');
      return;
    }
    this.gl = gl;

    const vsSource = `#version 300 es
      in vec2 a_pos;
      out vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      out vec4 fragColor;

      uniform sampler2D u_mask;
      uniform float u_contrast;
      uniform int u_mode;
      uniform bool u_hasMask;
      uniform bool u_isVideo;

      vec3 getColormap(float t, int mode) {
        t = clamp(t, 0.0, 1.0);
        if (t < 0.03) return vec3(0.012, 0.027, 0.05);

        if (mode == 1) { // Thermal
          if (t < 0.25) return mix(vec3(0.0, 0.0, 0.3), vec3(0.0, 0.35, 0.9), t * 4.0);
          if (t < 0.5) return mix(vec3(0.0, 0.35, 0.9), vec3(0.9, 0.1, 0.1), (t - 0.25) * 4.0);
          if (t < 0.75) return mix(vec3(0.9, 0.1, 0.1), vec3(1.0, 0.9, 0.0), (t - 0.5) * 4.0);
          return mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.75) * 4.0);
        } else if (mode == 2) { // Monochrome Neon Matrix
          return mix(vec3(0.0, 0.1, 0.04), vec3(0.1, 1.0, 0.3), t);
        } else if (mode == 3) { // Viridis
          if (t < 0.33) return mix(vec3(0.26, 0.0, 0.33), vec3(0.19, 0.4, 0.55), t * 3.0);
          if (t < 0.66) return mix(vec3(0.19, 0.4, 0.55), vec3(0.12, 0.74, 0.55), (t - 0.33) * 3.0);
          return mix(vec3(0.12, 0.74, 0.55), vec3(0.99, 0.9, 0.14), (t - 0.66) * 3.0);
        }
        // Mode 0: Cyberpunk
        if (t < 0.28) return mix(vec3(0.03, 0.1, 0.25), vec3(0.0, 0.94, 1.0), t / 0.28);
        if (t < 0.7) return mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.0, 0.55), (t - 0.28) / 0.42);
        return mix(vec3(1.0, 0.0, 0.55), vec3(1.0, 1.0, 1.0), (t - 0.7) / 0.3);
      }

      void main() {
        if (!u_hasMask) {
          fragColor = vec4(0.012, 0.027, 0.05, 1.0);
          return;
        }
        vec2 uv = vec2(1.0 - v_uv.x, 1.0 - v_uv.y);
        vec4 m = texture(u_mask, uv);
        float rawVal;
        if (u_isVideo) {
          float luma = dot(m.rgb, vec3(0.299, 0.587, 0.114));
          rawVal = clamp(luma * u_contrast, 0.0, 1.0);
        } else {
          float v = max(m.r, m.a);
          rawVal = clamp(v * u_contrast, 0.0, 1.0);
        }
        vec3 col = getColormap(rawVal, u_mode);
        fragColor = vec4(col, 1.0);
      }
    `;

    this.program = this.createProgram(vsSource, fsSource);
    if (this.program) {
      this.uniforms = {
        mask: gl.getUniformLocation(this.program, 'u_mask'),
        contrast: gl.getUniformLocation(this.program, 'u_contrast'),
        mode: gl.getUniformLocation(this.program, 'u_mode'),
        hasMask: gl.getUniformLocation(this.program, 'u_hasMask'),
        isVideo: gl.getUniformLocation(this.program, 'u_isVideo')
      };
    }

    const pointVs = `#version 300 es
      in vec2 a_point;
      in vec3 a_color;
      out vec3 v_color;
      void main() {
        gl_Position = vec4(a_point, 0.0, 1.0);
        gl_PointSize = 8.0;
        v_color = a_color;
      }
    `;
    const pointFs = `#version 300 es
      precision mediump float;
      in vec3 v_color;
      out vec4 fragColor;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        if (dot(c, c) > 0.25) discard;
        fragColor = vec4(v_color, 1.0);
      }
    `;
    this.pointProgram = this.createProgram(pointVs, pointFs);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    this.pointBuffer = gl.createBuffer();

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  createProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[DepthMapShader] Error de enlace:', gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  render(maskSource, contrast, mode, landmarks, isVideo = false) {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    const hasMask = Boolean(maskSource);
    if (hasMask) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskSource);
      } catch (e) {}
      gl.uniform1i(this.uniforms.mask, 0);
    }

    gl.uniform1f(this.uniforms.contrast, contrast);
    gl.uniform1i(this.uniforms.mode, mode);
    gl.uniform1i(this.uniforms.hasMask, hasMask ? 1 : 0);
    if (this.uniforms.isVideo) {
      gl.uniform1i(this.uniforms.isVideo, isVideo ? 1 : 0);
    }

    const aPos = gl.getAttribLocation(this.program, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (this.pointProgram && landmarks && landmarks.length > 0) {
      const pointData = [];
      const indices = [0, 11, 12, 15, 16];
      for (let i = 0; i < indices.length; i++) {
        const lm = landmarks[indices[i]];
        if (!lm) continue;
        const x = (lm.x * 2.0 - 1.0);
        const y = -(lm.y * 2.0 - 1.0);
        const isClose = (lm.z || 0) < -0.15;
        const r = isClose ? 1.0 : 0.0;
        const g = isClose ? 0.0 : 0.94;
        const b = isClose ? 0.33 : 1.0;
        pointData.push(x, y, r, g, b);
      }

      if (pointData.length > 0) {
        gl.useProgram(this.pointProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointData), gl.DYNAMIC_DRAW);

        const aPt = gl.getAttribLocation(this.pointProgram, 'a_point');
        const aCol = gl.getAttribLocation(this.pointProgram, 'a_color');

        gl.enableVertexAttribArray(aPt);
        gl.vertexAttribPointer(aPt, 2, gl.FLOAT, false, 5 * 4, 0);

        gl.enableVertexAttribArray(aCol);
        gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 5 * 4, 2 * 4);

        gl.drawArrays(gl.POINTS, 0, pointData.length / 5);
      }
    }
  }
}

// ============================================================================
// SINCRONIZACIÓN POR WEBSOCKETS (GAME 3 <-> UNIVERSO 3D DE CÚMULOS)
// Requerimiento 6: Telemetría en tiempo real de secuencias atrapadas
// ============================================================================
let gameWebSocket = null;

function initGameWebSocket() {
  const wsUrl = sbWsUrl();

  try {
    gameWebSocket = new WebSocket(wsUrl);

    gameWebSocket.addEventListener('open', () => {
      console.log('[WEBSOCKET] Conectado al bus central de Sincretismo de Silicio.');
      gameWebSocket.send(JSON.stringify({ type: 'client:register', client: 'game3' }));
      emitAgentEvent('boot', 'enlace con el bus central establecido', 'ok', { client: 'game3' });
    });

    gameWebSocket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'cluster:updated') {
          console.log('[WEBSOCKET] Notificación de clusters actualizados.');
          loadConfigFromServer();
        }
      } catch (e) {}
    });

    gameWebSocket.addEventListener('close', () => {
      console.log('[WEBSOCKET] Conexión cerrada. Reconectando en 3s...');
      setTimeout(initGameWebSocket, 3000);
    });

    gameWebSocket.addEventListener('error', () => {
      // Ignorar error transitorio
    });
  } catch (err) {
    console.warn('[WEBSOCKET] Error al inicializar socket:', err.message);
  }
}

function broadcastCaughtWords(words, extra = {}) {
  const payload = {
    type: 'game3:words_sequence',
    words: words,
    ...extra,
    timestamp: Date.now()
  };

  if (gameWebSocket && gameWebSocket.readyState === WebSocket.OPEN) {
    gameWebSocket.send(JSON.stringify(payload));
    console.log('[WEBSOCKET] ⚡ Secuencia neural transmitida al Universo 3D:', words, extra.coldWords || '');
  }

  try {
    localStorage.setItem('sincretismo_orders_event', JSON.stringify(payload));
  } catch (e) {}
}

// Telemetría para la consola externa (/console): expone el "pensamiento" del núcleo.
// Nunca interrumpe el flujo del juego si el socket está caído.
function emitAgentEvent(stage, message, level = 'info', data = null) {
  try {
    if (!gameWebSocket || gameWebSocket.readyState !== WebSocket.OPEN) return;
    gameWebSocket.send(JSON.stringify({
      type: 'agent:event',
      stage, level, message, data,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

// ============================================================================
// GESTIÓN DE CONFIGURACIÓN, BANCO DE CLUSTERS Y MODELOS OLLAMA
// ============================================================================
async function loadConfigFromServer() {
  try {
    // REQUERIMIENTO 5: Todas las palabras de Game 3 provienen de la biblioteca de Clusters
    try {
      const clusterRes = await sbFetch('/api/clusters');
      if (clusterRes.ok) {
        const clusterData = await clusterRes.json();
        const clusters = clusterData.clusters || clusterData;
        if (Array.isArray(clusters) && clusters.length > 0) {
          const allClusterWords = [];
          clusters.forEach(c => {
            if (Array.isArray(c.words)) {
              c.words.forEach(w => {
                const clean = String(w).trim().toLowerCase();
                if (clean && !allClusterWords.includes(clean)) {
                  allClusterWords.push(clean);
                }
              });
            }
          });
          if (allClusterWords.length > 0) {
            console.log(`[CLUSTERS] ${allClusterWords.length} palabras sincronizadas desde la biblioteca de Clusters.`);
            HUMAN_WORDS_POOL = allClusterWords;
            appState.config.wordsPool = allClusterWords;
          }
        }
      }
    } catch (err) {
      console.warn('[CLUSTERS] No se pudo leer /api/clusters:', err.message);
    }

    const res = await sbFetch('/config');
    if (res.ok) {
      const data = await res.json();
      if (data.ollamaModel) appState.config.ollamaModel = data.ollamaModel;
      if (data.systemPrompt) appState.config.systemPrompt = data.systemPrompt;
      if (Array.isArray(data.wordsPool) && data.wordsPool.length > 0 && HUMAN_WORDS_POOL.length === 0) {
        appState.config.wordsPool = [...data.wordsPool];
        HUMAN_WORDS_POOL = [...data.wordsPool];
      }
      // Colores globales de la interfaz desde el servidor (fuente de verdad principal)
      if (data.uiColors && typeof data.uiColors === 'object') {
        appState.uiColors = { ...UI_COLORS, ...data.uiColors };
        if (data.uiPalette) appState.uiPalette = data.uiPalette;
        applyUiColors();
        syncUiColorsInputs();
        updatePaletteUi();
        console.log('[CONFIG] Paleta de colores cargada desde config.json del servidor.');
      }
    }
    console.log('[CONFIG] Configuración cargada. Total palabras activas en banco:', HUMAN_WORDS_POOL.length);
  } catch (err) {
    console.warn('[CONFIG] Error en loadConfigFromServer:', err.message);
  }
  syncConfigToModalInputs();
}

async function fetchAndPopulateOllamaModels() {
  DOM.cfgModelSelect.innerHTML = '<option value="">Detectando modelos en Ollama...</option>';

  if (DOM.cfgOllamaUrl) DOM.cfgOllamaUrl.value = getOllamaUrl();

  let models = [];
  let online = false;
  let sourceLabel = '';

  // 1) OLLAMA LOCAL DEL VISITANTE — la app usa los modelos de ESTA máquina,
  //    aunque el sitio esté publicado en la web.
  for (const base of getOllamaUrls()) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2500);
      const r = await fetch(base + '/api/tags', { signal: controller.signal });
      clearTimeout(t);
      if (r.ok) {
        const d = await r.json();
        models = (d.models || []).map(m => m.name);
        online = true;
        sourceLabel = base;
        break;
      }
    } catch (e) {
      console.warn('[OLLAMA] Sin respuesta en', base, '::', e.message);
    }
  }

  // 2) Respaldo: el backend (proxy del servidor donde vive la app)
  if (!online) {
    try {
      const res = await sbFetch('/api/ollama/models');
      if (res.ok) {
        const data = await res.json();
        models = data.models || [];
        online = !!data.online;
        sourceLabel = online ? 'servidor' : '';
      }
    } catch (err) {
      console.warn('[OLLAMA] Backend no disponible:', err.message);
    }
  }

  DOM.cfgActiveModelBadge.textContent = appState.config.ollamaModel;

  const modelsList = Array.isArray(models) ? models.slice() : [];
  if (!modelsList.includes(appState.config.ollamaModel)) {
    modelsList.unshift(appState.config.ollamaModel);
  }

  DOM.cfgModelSelect.innerHTML = '';
  modelsList.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    const isCurrent = (m === appState.config.ollamaModel);
    opt.textContent = isCurrent ? `${m} ★ (ACTUAL)` : m;
    if (isCurrent) opt.selected = true;
    DOM.cfgModelSelect.appendChild(opt);
  });

  if (online) {
    DOM.cfgOllamaStatusTag.textContent = `● OLLAMA LOCAL EN LÍNEA (${modelsList.length} MODELOS · ${sourceLabel})`;
    DOM.cfgOllamaStatusTag.className = 'banner-status-tag online';
  } else {
    DOM.cfgOllamaStatusTag.textContent = '○ SIN OLLAMA LOCAL — abrí ollama-web.bat y permití "red local" en el candado del navegador';
    DOM.cfgOllamaStatusTag.className = 'banner-status-tag offline';
  }

  console.log('[OLLAMA] Modelos cargados en dropdown:', modelsList, '| origen:', sourceLabel || 'ninguno');
}

async function saveConfigToServer(newConfig) {
  try {
    const res = await sbFetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newConfig, uiColors: appState.uiColors, uiPalette: appState.uiPalette })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    appState.config = { ...appState.config, ...newConfig };
    if (Array.isArray(newConfig.wordsPool)) {
      HUMAN_WORDS_POOL = [...newConfig.wordsPool];
    }
    DOM.cfgActiveModelBadge.textContent = appState.config.ollamaModel;
    showToast(`✓ Configuración y ${HUMAN_WORDS_POOL.length} palabras guardadas`, 'success');
    showConfigStatus(`✓ Archivo config.json guardado físicamente en el servidor (${HUMAN_WORDS_POOL.length} palabras activas)`, 'success');
    return true;
  } catch (err) {
    console.error('[CONFIG] Error al guardar en /config:', err);
    showToast('⚠️ Error al comunicarse con /config en el servidor', 'error');
    showConfigStatus('✕ Error al escribir en servidor: ' + err.message, 'error');
    return false;
  }
}

function syncConfigToModalInputs() {
  DOM.cfgModelName.value = appState.config.ollamaModel;
  DOM.cfgActiveModelBadge.textContent = appState.config.ollamaModel;
  DOM.cfgSystemPrompt.value = appState.config.systemPrompt;
  renderWordChips();
  syncTrackingConfigToInputs();
}

function renderWordChips() {
  if (!DOM.wordsChipsContainer) return;
  DOM.wordsChipsContainer.innerHTML = '';
  const pool = appState.config.wordsPool || HUMAN_WORDS_POOL;
  if (DOM.wordsCountBadge) DOM.wordsCountBadge.textContent = pool.length;
  if (DOM.tabWordsCountBadge) DOM.tabWordsCountBadge.textContent = pool.length;

  pool.forEach((word, idx) => {
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.innerHTML = `<span>${word}</span><button type="button" class="chip-remove-btn" title="Eliminar palabra">✕</button>`;
    
    chip.querySelector('.chip-remove-btn').addEventListener('click', () => {
      removeWordFromPool(idx);
    });
    
    DOM.wordsChipsContainer.appendChild(chip);
  });
}

function removeWordFromPool(idx) {
  const pool = appState.config.wordsPool || HUMAN_WORDS_POOL;
  if (pool.length <= 3) {
    showToast('⚠️ Se requieren al menos 3 palabras en el banco', 'error');
    return;
  }
  pool.splice(idx, 1);
  appState.config.wordsPool = pool;
  HUMAN_WORDS_POOL = [...pool];
  renderWordChips();
  showConfigStatus(`Palabra eliminada. Restan ${HUMAN_WORDS_POOL.length} palabras. Recuerda guardar.`);
}

function parseWordsFromText(text) {
  if (!text) return [];
  return text
    .split(/[\n,;]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0 && !w.startsWith('#'));
}

function handleAddWords() {
  const raw = DOM.cfgWordsInput.value;
  const newWords = parseWordsFromText(raw);
  if (newWords.length === 0) {
    showConfigStatus('✕ Escribe o pega al menos una palabra', 'error');
    return;
  }

  const existing = new Set(appState.config.wordsPool || HUMAN_WORDS_POOL);
  let addedCount = 0;
  newWords.forEach(w => {
    if (!existing.has(w)) {
      existing.add(w);
      addedCount++;
    }
  });

  appState.config.wordsPool = Array.from(existing);
  HUMAN_WORDS_POOL = [...appState.config.wordsPool];
  DOM.cfgWordsInput.value = '';
  renderWordChips();
  showToast(`+${addedCount} palabras añadidas al banco`, 'success');
  showConfigStatus(`✓ Se agregaron ${addedCount} palabras nuevas (Total: ${HUMAN_WORDS_POOL.length}). Presiona Guardar para confirmar.`);
}

function handleReplaceWords() {
  const raw = DOM.cfgWordsInput.value;
  const newWords = parseWordsFromText(raw);
  if (newWords.length < 3) {
    showConfigStatus('✕ Se necesitan al menos 3 palabras para reemplazar el banco', 'error');
    return;
  }

  const unique = Array.from(new Set(newWords));
  appState.config.wordsPool = unique;
  HUMAN_WORDS_POOL = [...unique];
  DOM.cfgWordsInput.value = '';
  renderWordChips();
  showToast(`Banco reemplazado con ${unique.length} palabras`, 'success');
  showConfigStatus(`✓ Banco reemplazado con ${unique.length} palabras. Presiona Guardar para persistir.`);
}

function handleRestoreDefaultWords() {
  appState.config.wordsPool = [...DEFAULT_WORDS_POOL];
  HUMAN_WORDS_POOL = [...DEFAULT_WORDS_POOL];
  DOM.cfgWordsInput.value = '';
  renderWordChips();
  showToast('Banco restaurado a las palabras poéticas por defecto', 'info');
  showConfigStatus('✓ Banco restaurado a valores por defecto. Presiona Guardar para confirmar.');
}

function showConfigStatus(msg, type = 'success') {
  DOM.configStatusMsg.textContent = msg;
  DOM.configStatusMsg.className = 'config-status-msg ' + type;
}

function showToast(text, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = text;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// TOPOLOGÍA Y CONFIGURACIÓN CINEMÁTICA DE OPENPOSE / MEDIAPIPE POSE
// ============================================================================
const POSE_CONNECTIONS = [
  // Cabeza / Rostro / Cuello
  { from: 0, to: 1, group: 'head' },
  { from: 1, to: 2, group: 'head' },
  { from: 2, to: 3, group: 'head' },
  { from: 3, to: 7, group: 'head' },
  { from: 0, to: 4, group: 'head' },
  { from: 4, to: 5, group: 'head' },
  { from: 5, to: 6, group: 'head' },
  { from: 6, to: 8, group: 'head' },
  { from: 9, to: 10, group: 'head' },
  { from: 0, to: 11, group: 'head' },
  { from: 0, to: 12, group: 'head' },
  
  // Torso
  { from: 11, to: 12, group: 'torso' },
  { from: 11, to: 23, group: 'torso' },
  { from: 12, to: 24, group: 'torso' },
  { from: 23, to: 24, group: 'torso' },
  
  // Brazo Izquierdo
  { from: 11, to: 13, group: 'left_arm' },
  { from: 13, to: 15, group: 'left_arm' },
  { from: 15, to: 17, group: 'left_arm' },
  { from: 15, to: 19, group: 'left_arm' },
  { from: 15, to: 21, group: 'left_arm' },
  { from: 17, to: 19, group: 'left_arm' },

  // Brazo Derecho
  { from: 12, to: 14, group: 'right_arm' },
  { from: 14, to: 16, group: 'right_arm' },
  { from: 16, to: 18, group: 'right_arm' },
  { from: 16, to: 20, group: 'right_arm' },
  { from: 16, to: 22, group: 'right_arm' },
  { from: 18, to: 20, group: 'right_arm' },

  // Pierna Izquierda
  { from: 23, to: 25, group: 'left_leg' },
  { from: 25, to: 27, group: 'left_leg' },
  { from: 27, to: 29, group: 'left_leg' },
  { from: 29, to: 31, group: 'left_leg' },
  { from: 27, to: 31, group: 'left_leg' },

  // Pierna Derecha
  { from: 24, to: 26, group: 'right_leg' },
  { from: 26, to: 28, group: 'right_leg' },
  { from: 28, to: 30, group: 'right_leg' },
  { from: 30, to: 32, group: 'right_leg' },
  { from: 28, to: 32, group: 'right_leg' }
];

function getBoneColor(group, theme) {
  if (theme === 'classic') {
    switch (group) {
      case 'head': return '#ff007f';
      case 'torso': return '#ffd700';
      case 'left_arm': return '#00e5ff';
      case 'right_arm': return '#00ff66';
      case 'left_leg': return '#b388ff';
      case 'right_leg': return '#ff9100';
      default: return '#00f0ff';
    }
  } else if (theme === 'phosphor') {
    return '#00ff41';
  } else if (theme === 'thermal') {
    switch (group) {
      case 'head': return '#ffff00';
      case 'torso': return '#ff2200';
      case 'left_arm': return '#ff7700';
      case 'right_arm': return '#ff5500';
      case 'left_leg': return '#cc00ff';
      case 'right_leg': return '#ff00aa';
      default: return '#ffaa00';
    }
  } else {
    // Cyberpunk
    switch (group) {
      case 'head': return '#ff00aa';
      case 'torso': return '#00f0ff';
      case 'left_arm': return '#00ff88';
      case 'right_arm': return '#39ff14';
      case 'left_leg': return '#00d4ff';
      case 'right_leg': return '#00ffaa';
      default: return '#00f0ff';
    }
  }
}

// Generador de tablas de color (LUT) para Depth Map
const COLOR_LUTS = {
  cyberpunk: new Uint8ClampedArray(256 * 4),
  thermal: new Uint8ClampedArray(256 * 4),
  monochrome: new Uint8ClampedArray(256 * 4)
};

function initDepthLuts() {
  for (let i = 0; i < 256; i++) {
    const idx = i * 4;
    const t = i / 255;

    // Cyberpunk: Fondo negro -> Índigo -> Cyan -> Magenta -> Oro
    if (i < 10) {
      COLOR_LUTS.cyberpunk[idx] = 4;
      COLOR_LUTS.cyberpunk[idx + 1] = 8;
      COLOR_LUTS.cyberpunk[idx + 2] = 16;
      COLOR_LUTS.cyberpunk[idx + 3] = Math.round(i * 15);
    } else if (i < 90) {
      const f = (i - 10) / 80;
      COLOR_LUTS.cyberpunk[idx] = Math.round(10 + f * 20);
      COLOR_LUTS.cyberpunk[idx + 1] = Math.round(30 + f * 180);
      COLOR_LUTS.cyberpunk[idx + 2] = Math.round(80 + f * 175);
      COLOR_LUTS.cyberpunk[idx + 3] = 230;
    } else if (i < 180) {
      const f = (i - 90) / 90;
      COLOR_LUTS.cyberpunk[idx] = Math.round(30 + f * 225);
      COLOR_LUTS.cyberpunk[idx + 1] = Math.round(210 - f * 170);
      COLOR_LUTS.cyberpunk[idx + 2] = Math.round(255 - f * 50);
      COLOR_LUTS.cyberpunk[idx + 3] = 245;
    } else {
      const f = (i - 180) / 75;
      COLOR_LUTS.cyberpunk[idx] = 255;
      COLOR_LUTS.cyberpunk[idx + 1] = Math.round(40 + f * 200);
      COLOR_LUTS.cyberpunk[idx + 2] = Math.round(205 - f * 180);
      COLOR_LUTS.cyberpunk[idx + 3] = 255;
    }

    // Thermal: FLIR Turbo (Azul marino -> Magenta -> Rojo -> Amarillo -> Blanco)
    if (i < 10) {
      COLOR_LUTS.thermal[idx] = 2;
      COLOR_LUTS.thermal[idx + 1] = 2;
      COLOR_LUTS.thermal[idx + 2] = 10;
      COLOR_LUTS.thermal[idx + 3] = Math.round(i * 12);
    } else if (i < 80) {
      const f = (i - 10) / 70;
      COLOR_LUTS.thermal[idx] = Math.round(f * 100);
      COLOR_LUTS.thermal[idx + 1] = 0;
      COLOR_LUTS.thermal[idx + 2] = Math.round(80 + f * 160);
      COLOR_LUTS.thermal[idx + 3] = 240;
    } else if (i < 160) {
      const f = (i - 80) / 80;
      COLOR_LUTS.thermal[idx] = Math.round(100 + f * 155);
      COLOR_LUTS.thermal[idx + 1] = Math.round(f * 100);
      COLOR_LUTS.thermal[idx + 2] = Math.round(240 - f * 240);
      COLOR_LUTS.thermal[idx + 3] = 250;
    } else if (i < 230) {
      const f = (i - 160) / 70;
      COLOR_LUTS.thermal[idx] = 255;
      COLOR_LUTS.thermal[idx + 1] = Math.round(100 + f * 155);
      COLOR_LUTS.thermal[idx + 2] = 0;
      COLOR_LUTS.thermal[idx + 3] = 255;
    } else {
      const f = (i - 230) / 25;
      COLOR_LUTS.thermal[idx] = 255;
      COLOR_LUTS.thermal[idx + 1] = 255;
      COLOR_LUTS.thermal[idx + 2] = Math.round(f * 255);
      COLOR_LUTS.thermal[idx + 3] = 255;
    }

    // Monochrome: Fósforo verde CCTV
    if (i < 8) {
      COLOR_LUTS.monochrome[idx] = 0;
      COLOR_LUTS.monochrome[idx + 1] = 0;
      COLOR_LUTS.monochrome[idx + 2] = 0;
      COLOR_LUTS.monochrome[idx + 3] = 0;
    } else {
      COLOR_LUTS.monochrome[idx] = Math.round(t * 40);
      COLOR_LUTS.monochrome[idx + 1] = Math.round(t * 255);
      COLOR_LUTS.monochrome[idx + 2] = Math.round(t * 80);
      COLOR_LUTS.monochrome[idx + 3] = 245;
    }
  }
}
initDepthLuts();

// ============================================================================
// CAPA DE ANÁLISIS ÓPTICO 1: FRAME DIFFERENCE (WebGL2 GPU Feedback Shader)
// Manejada 100% en la GPU mediante FrameDifferenceShader (cero getImageData)
// ============================================================================

// ============================================================================
// CAPA DE ANÁLISIS ÓPTICO 2: FLOW FIELD (Campo de Flujo Vectorial Dinámico)
// ============================================================================
const FLOW_COLS = 24;
const FLOW_ROWS = 14;
const flowGrid = [];
for (let r = 0; r < FLOW_ROWS; r++) {
  flowGrid[r] = [];
  for (let c = 0; c < FLOW_COLS; c++) {
    flowGrid[r][c] = { vx: 0, vy: 0, mag: 0 };
  }
}
let flowPhase = 0;

function renderFlowField(ctx, w, h, landmarks) {
  if (!appState.trackingConfig.flowField) return;

  flowPhase += 0.035;
  const cellW = w / FLOW_COLS;
  const cellH = h / FLOW_ROWS;

  // Disipar vectores previos
  for (let r = 0; r < FLOW_ROWS; r++) {
    for (let c = 0; c < FLOW_COLS; c++) {
      const v = flowGrid[r][c];
      v.vx *= 0.88;
      v.vy *= 0.88;
      v.mag = Math.hypot(v.vx, v.vy);
    }
  }

  // Inyectar energía en el flow field desde los landmarks
  if (landmarks && landmarks.length > 0) {
    for (const lm of landmarks) {
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.45)) continue;
      const sx = (1.0 - lm.x) * w;
      const sy = lm.y * h;
      const col = Math.floor(sx / cellW);
      const row = Math.floor(sy / cellH);

      if (row >= 0 && row < FLOW_ROWS && col >= 0 && col < FLOW_COLS) {
        const ang = Math.sin(flowPhase + lm.x * 4) * Math.PI;
        flowGrid[row][col].vx += Math.cos(ang) * 14;
        flowGrid[row][col].vy += Math.sin(ang) * 14;
      }
    }
  }

  // Inyectar energía desde el cursor
  const cCol = Math.floor(appState.cursorX / cellW);
  const cRow = Math.floor(appState.cursorY / cellH);
  if (cRow >= 0 && cRow < FLOW_ROWS && cCol >= 0 && cCol < FLOW_COLS) {
    flowGrid[cRow][cCol].vx += (appState.targetCursorX - appState.cursorX) * 0.22;
    flowGrid[cRow][cCol].vy += (appState.targetCursorY - appState.cursorY) * 0.22;
  }

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 4;

  for (let r = 0; r < FLOW_ROWS; r++) {
    for (let c = 0; c < FLOW_COLS; c++) {
      const cx = c * cellW + cellW * 0.5;
      const cy = r * cellH + cellH * 0.5;
      const v = flowGrid[r][c];

      const ambAng = Math.sin(cx * 0.005 + flowPhase) * Math.cos(cy * 0.005 + flowPhase) * Math.PI;
      const dirX = Math.cos(ambAng) * 5 + v.vx;
      const dirY = Math.sin(ambAng) * 5 + v.vy;
      const norm = Math.hypot(dirX, dirY) || 1;
      const len = Math.min(cellW * 0.45, 6 + v.mag * 0.7);

      const endX = cx + (dirX / norm) * len;
      const endY = cy + (dirY / norm) * len;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      if (v.mag > 2) {
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(endX, endY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ============================================================================
// SISTEMA 1: RENDER DE SUPERPOSICIÓN OPENPOSE (CANVAS OVERLAY FULLSCREEN)
// ============================================================================
function renderOpenPoseOverlay(landmarks) {
  const canvas = DOM.openposeCanvas;
  if (!canvas) return;
  const isEnabled = appState.renderConfig.openposeEnabled || appState.trackingConfig.showOpenPose;
  if (!isEnabled) {
    if (canvas.style.display !== 'none') canvas.style.display = 'none';
    return;
  }
  if (canvas.style.display !== 'block') canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');

  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;

  // 1) Capa Frame Difference: Renderizada en GPU WebGL2 vía FrameDifferenceShader (sin CPU stall)

  // 2) Capa Flow Field (Campo de Flujo Vectorial)
  if (appState.trackingConfig.flowField) {
    renderFlowField(ctx, w, h, landmarks);
  }

  // 3) REQUERIMIENTO 10: Cuadrito que trackea la cara en la posición exacta donde está
  if (appState.trackingConfig.faceBoxOnScreen && landmarks && landmarks.length > 10) {
    const faceSubset = landmarks.slice(0, 11);
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    let confSum = 0;

    for (let i = 0; i < faceSubset.length; i++) {
      const p = faceSubset[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      confSum += (p.visibility !== undefined ? p.visibility : 0.9);
    }

    const faceConf = Math.round((confSum / faceSubset.length) * 100);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const bw = Math.max(0.12, (maxX - minX) * 1.55) * w;
    const bh = Math.max(0.14, (maxY - minY) * 1.7) * h;
    const sx = (1.0 - cx) * w - bw * 0.5;
    const sy = cy * h - bh * 0.5;

    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    const cornerLen = Math.min(24, bw * 0.25);
    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(sx, sy + cornerLen);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx + cornerLen, sy);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(sx + bw - cornerLen, sy);
    ctx.lineTo(sx + bw, sy);
    ctx.lineTo(sx + bw, sy + cornerLen);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(sx, sy + bh - cornerLen);
    ctx.lineTo(sx, sy + bh);
    ctx.lineTo(sx + cornerLen, sy + bh);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(sx + bw - cornerLen, sy + bh);
    ctx.lineTo(sx + bw, sy + bh);
    ctx.lineTo(sx + bw, sy + bh - cornerLen);
    ctx.stroke();

    // Mira reticular central
    ctx.beginPath();
    ctx.moveTo(sx + bw * 0.5 - 6, sy + bh * 0.5);
    ctx.lineTo(sx + bw * 0.5 + 6, sy + bh * 0.5);
    ctx.moveTo(sx + bw * 0.5, sy + bh * 0.5 - 6);
    ctx.lineTo(sx + bw * 0.5, sy + bh * 0.5 + 6);
    ctx.stroke();

    // Placa telemétrica
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6, 14, 24, 0.88)';
    ctx.fillRect(sx, sy - 20, 180, 18);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy - 20, 180, 18);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px Share Tech Mono, monospace';
    ctx.fillText(`[TARGET_ROSTRO_01 | CONF: ${faceConf}%]`, sx + 6, sy - 7);

    ctx.restore();
  }

  // 4) Esqueleto cinemático OpenPose (Bones & Landmarks)
  if (!landmarks || landmarks.length === 0) {
    return;
  }

  const minConf = Math.min(0.2, appState.trackingConfig.minConfidence ?? 0.2);
  const theme = appState.trackingConfig.colorTheme || 'cyberpunk';
  const boneWidth = appState.trackingConfig.boneWidth || 4;
  const ptRadius = appState.trackingConfig.pointRadius || 5;
  const shouldDrawBones = appState.trackingConfig.drawBones !== false;
  const shouldDrawLandmarks = appState.trackingConfig.drawLandmarks !== false;

  // 4.1) Graficar Articulaciones / Huesos
  if (shouldDrawBones) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < POSE_CONNECTIONS.length; i++) {
      const conn = POSE_CONNECTIONS[i];
      const p1 = landmarks[conn.from];
      const p2 = landmarks[conn.to];
      if (!p1 || !p2) continue;

      const conf1 = p1.visibility !== undefined ? p1.visibility : 1.0;
      const conf2 = p2.visibility !== undefined ? p2.visibility : 1.0;

      if (conf1 >= minConf && conf2 >= minConf) {
        // Coordenadas espejadas horizontalmente para alinear con el video CCTV
        const x1 = (1.0 - p1.x) * w;
        const y1 = p1.y * h;
        const x2 = (1.0 - p2.x) * w;
        const y2 = p2.y * h;

        const col = getBoneColor(conn.group, theme);
        ctx.strokeStyle = col;
        ctx.lineWidth = boneWidth;
        ctx.shadowColor = col;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }

  // 4.2) Graficar Puntos del Cuerpo (Landmarks)
  if (shouldDrawLandmarks) {
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const conf = lm.visibility !== undefined ? lm.visibility : 1.0;
      if (conf < minConf) continue;

      const x = (1.0 - lm.x) * w;
      const y = lm.y * h;

      const isAnchor = (i === 0 || i === 15 || i === 16);

      ctx.shadowBlur = 8;
      ctx.shadowColor = isAnchor ? '#ff0055' : (theme === 'phosphor' ? '#00ff41' : '#00f0ff');

      ctx.beginPath();
      ctx.arc(x, y, isAnchor ? ptRadius + 3 : ptRadius, 0, Math.PI * 2);
      ctx.fillStyle = isAnchor ? '#ff0055' : (theme === 'phosphor' ? '#00ff41' : '#ffffff');
      ctx.fill();

      // Anillo de fijación en puntos de interacción
      if (isAnchor) {
        ctx.beginPath();
        ctx.arc(x, y, ptRadius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  ctx.shadowBlur = 0;
}

// ============================================================================
// RECORTE DE SILUETA POR DEPTH MAP (CUTOUT DEL FONDO SOBRE LA CÁMARA)
// ============================================================================
function drawImageCover(ctx, src, cw, ch) {
  const sw = src.videoWidth || src.width;
  const sh = src.videoHeight || src.height;
  if (!sw || !sh) return;
  const scale = Math.max(cw / sw, ch / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

function renderSilhouetteCutout(results) {
  const cv = DOM.cutoutCanvas;
  if (!cv) return;

  const r = appState.renderConfig;
  const enabled = Boolean(r.cutoutEnabled && r.cameraEnabled);
  const mask = results && results.segmentationMask ? results.segmentationMask : null;
  const videoReady = DOM.video && DOM.video.readyState >= 2;

  if (!enabled || !mask || !videoReady) {
    // Sin máscara disponible: se muestra la cámara completa
    if (cv.style.display !== 'none') {
      cv.style.display = 'none';
      if (DOM.video && r.cameraEnabled) DOM.video.style.opacity = r.cameraOpacity;
    }
    return;
  }

  const w = cv.width;
  const h = cv.height;
  if (!w || !h) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, w, h);

  // 1) Cuadro de video cubriendo el canvas
  drawImageCover(ctx, DOM.video, w, h);

  // 2) La máscara de segmentación (cuerpo = alpha) recorta el fondo.
  //    Se aplica varias veces para endurecer el borde según el umbral elegido (alpha^n).
  const threshold = Math.min(1, Math.max(0, Number(r.cutoutThreshold) || 0.28));
  const passes = 1 + Math.round(threshold * 4);
  ctx.globalCompositeOperation = 'destination-in';
  for (let i = 0; i < passes; i++) {
    drawImageCover(ctx, mask, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';

  cv.style.display = 'block';
  cv.style.opacity = r.cameraOpacity;
  if (DOM.video) DOM.video.style.opacity = '0';
}

// ============================================================================
// SISTEMA 2: RENDER DE DEPTH MAP (MONITOR PiP DE SEGMENTACIÓN - GPU WebGL)
// ============================================================================
function renderDepthMap(results, landmarks) {
  if (!DOM.depthCanvas || !DOM.depthPip) return;

  const isEnabled = appState.renderConfig.depthEnabled || appState.trackingConfig.showDepthMap;
  if (!isEnabled) {
    if (!DOM.depthPip.classList.contains('hidden')) {
      DOM.depthPip.classList.add('hidden');
    }
    return;
  }

  if (DOM.depthPip.classList.contains('hidden')) {
    DOM.depthPip.classList.remove('hidden');
  }

  let mask = (results && results.segmentationMask) ? results.segmentationMask : null;
  let isVideo = false;
  if (!mask && DOM.video && DOM.video.readyState >= 2) {
    mask = DOM.video;
    isVideo = true;
  }

  const modeKey = appState.trackingConfig.depthMode || 'cyberpunk';
  const modeMap = { cyberpunk: 0, thermal: 1, monochrome: 2, viridis: 3 };
  const mode = modeMap[modeKey] !== undefined ? modeMap[modeKey] : 0;
  const contrast = appState.trackingConfig.depthContrast || 1.5;

  if (!appState.depthShader && DOM.depthCanvas) {
    appState.depthShader = new DepthMapShader(DOM.depthCanvas);
  }

  if (appState.depthShader) {
    appState.depthShader.render(mask, contrast, mode, landmarks, isVideo);
  }

  if (DOM.calibDepthStatus) {
    DOM.calibDepthStatus.textContent = mask ? (isVideo ? 'ACTIVA (GPU LUMA)' : 'ACTIVA (GPU SEG)') : 'STANDBY';
  }
  if (DOM.depthFooterMode) {
    DOM.depthFooterMode.textContent = modeKey.toUpperCase();
  }

  // Telemetría Z y Cobertura Anatómica
  if (landmarks && landmarks.length > 0) {
    let sumZ = 0;
    let countZ = 0;

    [0, 11, 12, 13, 14, 15, 16].forEach(idx => {
      if (landmarks[idx] && landmarks[idx].z !== undefined) {
        sumZ += landmarks[idx].z;
        countZ++;
      }
    });

    const avgZ = countZ > 0 ? (sumZ / countZ) : 0;
    if (DOM.depthMetaZ) {
      DOM.depthMetaZ.textContent = `${avgZ <= 0 ? '' : '+'}${avgZ.toFixed(2)}m`;
    }

    if (DOM.depthMetaCoverage) {
      const conf = (landmarks[0] && landmarks[0].visibility) ? landmarks[0].visibility : 0.85;
      const coverage = Math.min(100, Math.round(conf * 42 + (mask ? 18 : 0)));
      DOM.depthMetaCoverage.textContent = `${coverage}%`;
    }
  }
}

// ============================================================================
// SISTEMA 3: RENDER DE CÁMARA DE LA CARA (MONITOR PiP FACIAL & BIOMETRÍA)
// ============================================================================
function renderFaceCamera(landmarks) {
  if (!DOM.faceCanvas || !DOM.facePip) return;

  if (!appState.trackingConfig.showFaceCamera) {
    if (!DOM.facePip.classList.contains('hidden')) {
      DOM.facePip.classList.add('hidden');
    }
    return;
  }

  if (DOM.facePip.classList.contains('hidden')) {
    DOM.facePip.classList.remove('hidden');
  }

  const canvas = DOM.faceCanvas;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  if (!appState.cameraReady || !DOM.video || DOM.video.readyState < 2) {
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Share Tech Mono, monospace';
    ctx.fillText('ESPERANDO SEÑAL...', 45, h / 2);
    return;
  }

  if (landmarks && landmarks.length > 10) {
    const faceSubset = landmarks.slice(0, 11);
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    let confSum = 0;

    for (let i = 0; i < faceSubset.length; i++) {
      const p = faceSubset[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      confSum += (p.visibility !== undefined ? p.visibility : 0.9);
    }

    const faceConf = Math.round((confSum / faceSubset.length) * 100);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rawBox = Math.max(maxX - minX, maxY - minY, 0.12) * (2.8 / appState.trackingConfig.faceZoom);

    const s = appState.faceTrackingState;
    if (appState.trackingConfig.faceSmoothing) {
      s.smoothX += (cx - s.smoothX) * 0.18;
      s.smoothY += (cy - s.smoothY) * 0.18;
      s.smoothSize += (rawBox - s.smoothSize) * 0.18;
    } else {
      s.smoothX = cx;
      s.smoothY = cy;
      s.smoothSize = rawBox;
    }
    s.hasFace = true;
    s.scanPhase += 0.08;

    const vw = DOM.video.videoWidth || 1280;
    const vh = DOM.video.videoHeight || 720;
    const cropPx = Math.max(80, Math.min(vw, s.smoothSize * vw));
    const sx = Math.max(0, Math.min(vw - cropPx, s.smoothX * vw - cropPx / 2));
    const sy = Math.max(0, Math.min(vh - cropPx, s.smoothY * vh - cropPx / 2));

    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(DOM.video, sx, sy, cropPx, cropPx, 0, 0, w, h);
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.fillRect(0, 0, w, h);

    if (appState.trackingConfig.faceReticle) {
      const scanY = (Math.sin(s.scanPhase) * 0.5 + 0.5) * h;
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (DOM.faceMetaConf) DOM.faceMetaConf.textContent = `${faceConf}%`;
    if (DOM.faceFooterZoom) DOM.faceFooterZoom.textContent = `${appState.trackingConfig.faceZoom.toFixed(1)}x`;
  }
}

// ============================================================================
// WEBCAM Y MEDIAPIPE POSE (MOTOR DE TRACKING & CALIBRACIÓN)
// ============================================================================
async function initWebcamAndPose() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    });
    DOM.video.srcObject = stream;
    await DOM.video.play();
    appState.cameraReady = true;
    console.log('[WEBCAM] Cámara iniciada correctamente');
    if (DOM.calibCamStatus) DOM.calibCamStatus.textContent = 'EN LÍNEA';
    initMediaPipePose();
  } catch (err) {
    console.warn('[WEBCAM] Cámara no activa o permisos no concedidos. Modo Mouse activo:', err.message);
    appState.cameraReady = false;
    if (DOM.calibCamStatus) DOM.calibCamStatus.textContent = 'OFFLINE';
    setInputMode('mouse');
  }
}

// ============================================================================
// WEBCAM Y MEDIAPIPE POSE (MOTOR DE TRACKING ASÍNCRONO DESACOPLADO A 60 FPS)
// ============================================================================
function isTrackingNeeded() {
  const visualTrackingActive = (
    appState.renderConfig.openposeEnabled ||
    appState.trackingConfig.showOpenPose ||
    appState.renderConfig.depthEnabled ||
    appState.trackingConfig.showDepthMap ||
    appState.renderConfig.faceEnabled ||
    appState.trackingConfig.showFaceCamera ||
    appState.renderConfig.cutoutEnabled
  );
  if (visualTrackingActive) return true;

  if (!appState.isUsingMouse) {
    return true;
  }
  return false;
}

// ============================================================================
// SEGMENTACIÓN DE SILUETA (MediaPipe) — Se activa sólo cuando hace falta
// ============================================================================
let poseSegmentationEnabled = false;

function needsSegmentation() {
  return Boolean(
    appState.renderConfig.cutoutEnabled ||
    appState.trackingConfig.depthInShader !== false ||
    appState.renderConfig.depthEnabled ||
    appState.trackingConfig.showDepthMap
  );
}

function updatePoseSegmentation() {
  if (!appState.poseInstance) return;
  const need = needsSegmentation();
  if (need === poseSegmentationEnabled) return;
  poseSegmentationEnabled = need;
  try {
    appState.poseInstance.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: need,
      smoothSegmentation: need,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    console.log(`[MediaPipe] Segmentación de silueta ${need ? 'ACTIVADA' : 'DESACTIVADA'}.`);
  } catch (e) {}
}

let posePacingTimer = null;
let isPoseProcessing = false;

function triggerPoseInference() {
  if (posePacingTimer) clearTimeout(posePacingTimer);
  stepPoseInference();
}

function scheduleNextPoseInference(delayMs = 40) {
  if (posePacingTimer) clearTimeout(posePacingTimer);
  posePacingTimer = setTimeout(stepPoseInference, delayMs);
}

async function stepPoseInference() {
  // Si la cámara no está lista o MediaPipe aún no existe, esperar en standby
  if (!appState.cameraReady || !DOM.video || DOM.video.readyState < 2 || !appState.poseInstance) {
    scheduleNextPoseInference(200);
    return;
  }

  // Si no se requiere tracking (Modo Mouse estándar con capas de tracking apagadas):
  // STANDBY TOTAL: 0 llamadas a pose.send, 0% CPU, framerate del juego a 60 FPS fijos.
  if (!isTrackingNeeded()) {
    scheduleNextPoseInference(250);
    return;
  }

  // Si ya hay una inferencia en curso, reintentar en 30ms
  if (isPoseProcessing) {
    scheduleNextPoseInference(30);
    return;
  }

  isPoseProcessing = true;
  try {
    await appState.poseInstance.send({ image: DOM.video });
  } catch (err) {
    // Proteger contra errores transitorios de fotograma
  } finally {
    isPoseProcessing = false;
  }

  // CRÍTICO PARA EL RENDIMIENTO (60 FPS LOCK):
  // Ceder intencionalmente al menos 40ms al hilo principal de Chrome después de cada inferencia.
  // Esto permite que requestAnimationFrame(mainLoop) dibuje múltiples fotogramas a 60 FPS estables
  // mientras el suavizado lerp interpola el movimiento de los puntos sin ningún tirón a 18 FPS.
  scheduleNextPoseInference(40);
}

function initMediaPipePose() {
  if (typeof window.Pose === 'undefined') {
    console.log('[MediaPipe] Librería Pose CDN no disponible. Modo Mouse 100% activo.');
    return;
  }

  try {
    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    // Inferencia ultrarrápida: modelComplexity 0 (Lite) y sin segmentación densa
    // Esto garantiza 60 FPS estables y evita que MediaPipe destruya/recree contextos WebGL
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    poseSegmentationEnabled = false;

    pose.onResults(onPoseResults);
    appState.poseInstance = pose;

    // Si el usuario ya pidió silueta/depth, activar la segmentación de inmediato
    updatePoseSegmentation();

    // Iniciar el bucle asíncrono desacoplado con standby
    scheduleNextPoseInference(100);
  } catch (err) {
    console.error('[MediaPipe] Error al inicializar Pose:', err);
  }
}

function onPoseResults(results) {
  const landmarks = results.poseLandmarks || [];
  appState.lastLandmarks = landmarks;

  // 1. Estadísticas de Inferencia y Telemetría en Vivo
  const now = performance.now();
  const dtPose = now - appState.trackingStats.lastPoseTime;
  appState.trackingStats.lastPoseTime = now;
  if (dtPose > 0) {
    appState.trackingStats.fps = Math.round(1000 / dtPose);
  }
  appState.trackingStats.detectedPoints = landmarks.length;
  appState.trackingStats.hasSegmentation = Boolean(results.segmentationMask);

  // Pasar máscara depth al shader ASCII si estuviera disponible
  if (results.segmentationMask && appState.asciiShader) {
    appState.asciiShader.setDepthMask(results.segmentationMask);
  }

  // Recorte de silueta (Depth Cutout) sobre la capa de fondo de la cámara
  renderSilhouetteCutout(results);

  if (DOM.calibCamStatus) DOM.calibCamStatus.textContent = appState.cameraReady ? 'EN LÍNEA' : 'STANDBY';
  if (DOM.calibPointsCount) DOM.calibPointsCount.textContent = `${landmarks.length} / 33`;
  if (DOM.calibFps) DOM.calibFps.textContent = `${appState.trackingStats.fps} FPS`;
  if (DOM.depthPipFps) DOM.depthPipFps.textContent = `${appState.trackingStats.fps} FPS`;

  // 2. Renderizar Sistemas de Calibración ÚNICAMENTE si sus capas están habilitadas
  if (appState.renderConfig.openposeEnabled || appState.trackingConfig.showOpenPose) {
    renderOpenPoseOverlay(landmarks);
  }
  if (appState.renderConfig.depthEnabled || appState.trackingConfig.showDepthMap) {
    renderDepthMap(results, landmarks);
  }
  if (appState.renderConfig.faceEnabled || appState.trackingConfig.showFaceCamera) {
    renderFaceCamera(landmarks);
  }

  // 3. Control del Cursor de Juego (Solo si NO se está usando el mouse)
  if (appState.isUsingMouse) return;

  if (landmarks.length > 0) {
    let anchor = landmarks[0]; // Por defecto Nariz
    const anchorType = appState.trackingConfig.trackingAnchor || 'nose';

    if (anchorType === 'right_wrist' && landmarks[16]) {
      anchor = landmarks[16];
    } else if (anchorType === 'left_wrist' && landmarks[15]) {
      anchor = landmarks[15];
    } else if (anchorType === 'chest' && landmarks[11] && landmarks[12]) {
      anchor = {
        x: (landmarks[11].x + landmarks[12].x) / 2,
        y: (landmarks[11].y + landmarks[12].y) / 2,
        visibility: Math.min(landmarks[11].visibility || 0.9, landmarks[12].visibility || 0.9)
      };
    }

    appState.landmarkConfidence = anchor.visibility !== undefined ? anchor.visibility : 0.95;

    // Espejamos X horizontalmente
    const mappedX = (1 - anchor.x) * window.innerWidth;
    const mappedY = anchor.y * window.innerHeight;

    appState.targetCursorX = mappedX;
    appState.targetCursorY = mappedY;

    DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorType.toUpperCase()}]`;
    DOM.telemetryConfidence.textContent = `${Math.round(appState.landmarkConfidence * 100)}%`;
  } else {
    appState.landmarkConfidence = 0;
  }
}

function setInputMode(mode) {
  appState.inputMode = mode;
  if (mode === 'mouse') {
    appState.isUsingMouse = true;
    DOM.inputModeIcon.textContent = '🖱️';
    DOM.inputModeLabel.textContent = 'TRACK: MOUSE';
    DOM.telemetrySensor.textContent = 'MOUSE [CLIC DIRECTO]';
    DOM.telemetryConfidence.textContent = '100%';
  } else {
    appState.isUsingMouse = false;
    DOM.inputModeIcon.textContent = '📹';
    const anchorName = (appState.trackingConfig.trackingAnchor || 'nariz').toUpperCase();
    DOM.inputModeLabel.textContent = `TRACK: CÁMARA (${anchorName})`;
    DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorName}]`;
    triggerPoseInference();
  }
  showToast(`Control: ${mode === 'mouse' ? 'Mouse / Clics' : 'Cámara Pose'}`, 'info');
}

// ============================================================================
// GESTIÓN DE CONFIGURACIÓN DE TRACKING & PERSISTENCIA LOCALSTORAGE
// ============================================================================
function loadTrackingConfigFromStorage() {
  try {
    const saved = localStorage.getItem('sincretismo_tracking_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      appState.trackingConfig = { ...appState.trackingConfig, ...parsed };
      console.log('[TRACKING] Configuración cargada de localStorage:', appState.trackingConfig);
    }
  } catch (e) {}
  syncTrackingConfigToInputs();
}

function saveTrackingConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_tracking_config', JSON.stringify(appState.trackingConfig));
  } catch (e) {}
}

function syncTrackingConfigToInputs() {
  const c = appState.trackingConfig;
  if (DOM.cfgTrackOpenpose) DOM.cfgTrackOpenpose.checked = c.showOpenPose;
  if (DOM.cfgTrackBones) DOM.cfgTrackBones.checked = c.drawBones;
  if (DOM.cfgTrackBoneWidth) DOM.cfgTrackBoneWidth.value = c.boneWidth;
  if (DOM.valTrackBoneWidth) DOM.valTrackBoneWidth.textContent = c.boneWidth;
  if (DOM.cfgTrackPoints) DOM.cfgTrackPoints.checked = c.drawLandmarks;
  if (DOM.cfgTrackPointRadius) DOM.cfgTrackPointRadius.value = c.pointRadius;
  if (DOM.valTrackPointRadius) DOM.valTrackPointRadius.textContent = c.pointRadius;
  if (DOM.cfgTrackConfidence) DOM.cfgTrackConfidence.value = Math.round(c.minConfidence * 100);
  if (DOM.valTrackConfidence) DOM.valTrackConfidence.textContent = Math.round(c.minConfidence * 100);
  if (DOM.cfgTrackTheme) DOM.cfgTrackTheme.value = c.colorTheme;
  if (DOM.cfgTrackBodyCollision) DOM.cfgTrackBodyCollision.checked = c.bodyCollision !== false;
  if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = c.showDepthMap;
  if (DOM.cfgTrackDepthShader) DOM.cfgTrackDepthShader.checked = c.depthInShader !== false;
  if (DOM.cfgTrackBodyColor) DOM.cfgTrackBodyColor.value = c.bodyColor || 'neon-green';
  if (DOM.cfgTrackDepthMode) DOM.cfgTrackDepthMode.value = c.depthMode;
  if (DOM.cfgTrackDepthContrast) DOM.cfgTrackDepthContrast.value = c.depthContrast;
  if (DOM.valTrackDepthContrast) DOM.valTrackDepthContrast.textContent = c.depthContrast;
  if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = c.showFaceCamera;
  if (DOM.cfgTrackFaceBox) DOM.cfgTrackFaceBox.checked = c.faceBoxOnScreen !== false;
  if (DOM.cfgTrackFaceZoom) DOM.cfgTrackFaceZoom.value = c.faceZoom;
  if (DOM.valTrackFaceZoom) DOM.valTrackFaceZoom.textContent = c.faceZoom;
  if (DOM.cfgTrackFaceReticle) DOM.cfgTrackFaceReticle.checked = c.faceReticle;
  if (DOM.cfgTrackFrameDiff) DOM.cfgTrackFrameDiff.checked = Boolean(c.frameDifference);
  if (DOM.cfgTrackFrameDiffLimit) DOM.cfgTrackFrameDiffLimit.value = c.frameDiffLimit ?? 0.08;
  if (DOM.valTrackFrameDiffLimit) DOM.valTrackFrameDiffLimit.textContent = (c.frameDiffLimit ?? 0.08).toFixed(2);
  if (DOM.cfgTrackFrameDiffForce) DOM.cfgTrackFrameDiffForce.value = c.frameDiffForce ?? 0.85;
  if (DOM.valTrackFrameDiffForce) DOM.valTrackFrameDiffForce.textContent = (c.frameDiffForce ?? 0.85).toFixed(2);
  if (DOM.cfgTrackFrameDiffOrig) DOM.cfgTrackFrameDiffOrig.checked = Boolean(c.frameDiffOrig);
  if (DOM.cfgTrackFlowField) DOM.cfgTrackFlowField.checked = Boolean(c.flowField);
  if (DOM.cfgTrackAnchor) DOM.cfgTrackAnchor.value = c.trackingAnchor;
  if (DOM.cfgTrackSmoothing) DOM.cfgTrackSmoothing.value = c.smoothingFactor;
  if (DOM.valTrackSmoothing) DOM.valTrackSmoothing.textContent = c.smoothingFactor;

  if (DOM.depthPip) DOM.depthPip.classList.toggle('hidden', !c.showDepthMap);
  if (DOM.facePip) DOM.facePip.classList.toggle('hidden', !c.showFaceCamera);
}

// ============================================================================
// GESTIÓN DE CONFIGURACIÓN DE RENDER, CAPAS Y OPACIDAD (PESTAÑA RENDER)
// Requerimientos 2 y 3: Switches y opacidad independiente sincronizados
// ============================================================================
function loadRenderConfigFromStorage() {
  try {
    const saved = localStorage.getItem('sincretismo_render_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      appState.renderConfig = { ...appState.renderConfig, ...parsed };
      console.log('[RENDER] Configuración de capas cargada de localStorage:', appState.renderConfig);
    }
  } catch (e) {}
  applyRenderLayers();
}

function saveRenderConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_render_config', JSON.stringify(appState.renderConfig));
  } catch (e) {}
}

// ============================================================================
// MOTOR DE PARTÍCULAS & SHADER VISUAL (PESTAÑA PARTÍCULAS / SHADER ASCII)
// ============================================================================
const PARTICLE_FONT_FAMILIES = {
  organic: "var(--font-organic)",
  outfit: "'Outfit', sans-serif",
  'share-tech': "'Share Tech Mono', monospace",
  'space-mono': "'Space Mono', monospace",
  serif: "Georgia, 'Times New Roman', serif"
};

function saveVisualConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_visual_config', JSON.stringify({
      ascii: appState.asciiConfig,
      particles: appState.particlesConfig,
      uiColors: appState.uiColors,
      uiPalette: appState.uiPalette
    }));
  } catch (e) {}
}

function loadVisualConfigFromStorage() {
  try {
    const saved = localStorage.getItem('sincretismo_visual_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.ascii) appState.asciiConfig = { ...appState.asciiConfig, ...parsed.ascii };
      if (parsed.particles) appState.particlesConfig = { ...appState.particlesConfig, ...parsed.particles };
      if (parsed.uiColors) appState.uiColors = { ...UI_COLORS, ...parsed.uiColors };
      if (parsed.uiPalette) appState.uiPalette = parsed.uiPalette;
      console.log('[VISUAL] Configuración visual cargada de localStorage.');
    }
  } catch (e) {}
  applyParticlesConfig();
  syncParticlesInputs();
  syncAsciiInputs();
  applyUiColors();
  syncUiColorsInputs();
}

// ============================================================================
// PALETAS GLOBALES — aplicar / renderizar / marcar estado
// ============================================================================
function applyUiPalette(paletteId) {
  const pal = getPaletteById(paletteId);
  appState.uiPalette = pal.id;
  appState.uiColors = buildUiColorsFromPalette(pal);
  applyUiColors();
  syncUiColorsInputs();
  updatePaletteUi();
}

function markPaletteCustom() {
  appState.uiPalette = 'custom';
  updatePaletteUi();
}

function updatePaletteUi() {
  const grid = document.getElementById('palette-grid');
  if (grid) {
    grid.querySelectorAll('.palette-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.palette === appState.uiPalette);
    });
  }
  const nameEl = document.getElementById('palette-current-name');
  const chipsEl = document.getElementById('palette-base-chips');
  if (appState.uiPalette === 'custom') {
    if (nameEl) nameEl.textContent = 'Personalizada (ajuste manual)';
    if (chipsEl) chipsEl.innerHTML = '';
    return;
  }
  const pal = getPaletteById(appState.uiPalette);
  if (nameEl) nameEl.textContent = pal.name;
  if (chipsEl) {
    chipsEl.innerHTML = [pal.c1, pal.c2, pal.c3]
      .map((c) => `<span class="palette-chip" style="background:${c}"></span>`)
      .join('');
  }
}

function renderPaletteGrid() {
  const grid = document.getElementById('palette-grid');
  if (!grid) return;
  grid.innerHTML = UI_PALETTES.map((p) => `
    <button type="button" class="palette-btn" data-palette="${p.id}" title="Aplicar paleta ${p.name}">
      <span class="palette-swatches">
        <span style="background:${p.c1}"></span>
        <span style="background:${p.c2}"></span>
        <span style="background:${p.c3}"></span>
      </span>
      <span class="palette-name">${p.name}</span>
    </button>
  `).join('');
  grid.querySelectorAll('.palette-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyUiPalette(btn.dataset.palette);
      showToast(`🎨 Paleta aplicada: ${getPaletteById(btn.dataset.palette).name}`, 'info');
    });
  });
  updatePaletteUi();
}

// ============================================================================
// SELECTOR DE COLOR PROPIO — popover flotante (el nativo se renderiza roto)
// ============================================================================
function hsvToHex(h, s, v) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const t = (val) => Math.round((val + m) * 255).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}

function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return { h: 0, s: 0, v: 100 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

function ensureWordColorPopover() {
  if (wordColorPopover) return wordColorPopover;
  const el = document.createElement('div');
  el.className = 'word-color-popover hidden';
  el.innerHTML = `
    <div class="wcp-head">
      <span class="wcp-title">COLOR DE LA PALABRA</span>
      <button type="button" class="wcp-close" aria-label="Cerrar">&times;</button>
    </div>
    <div class="wcp-sv"><div class="wcp-sv-cursor"></div></div>
    <div class="wcp-hue"><div class="wcp-hue-cursor"></div></div>
    <div class="wcp-row">
      <span class="wcp-preview"></span>
      <input type="text" class="wcp-hex" maxlength="7" spellcheck="false" autocomplete="off">
    </div>
    <div class="wcp-presets"></div>
  `;
  document.body.appendChild(el);
  wordColorPopover = el;

  const sv = el.querySelector('.wcp-sv');
  const hue = el.querySelector('.wcp-hue');
  const hexInput = el.querySelector('.wcp-hex');
  const presets = el.querySelector('.wcp-presets');

  presets.innerHTML = WORD_COLOR_PRESETS
    .map((c) => `<button type="button" class="wcp-preset" data-color="${c}" style="background:${c}" title="${c}"></button>`)
    .join('');
  presets.querySelectorAll('.wcp-preset').forEach((b) => {
    b.addEventListener('click', () => setWordColor(b.dataset.color));
  });

  el.querySelector('.wcp-close').addEventListener('click', closeWordColorPopover);

  const dragSv = (ev) => {
    const r = sv.getBoundingClientRect();
    const x = Math.min(Math.max(ev.clientX - r.left, 0), r.width);
    const y = Math.min(Math.max(ev.clientY - r.top, 0), r.height);
    wordColorState.s = (x / r.width) * 100;
    wordColorState.v = 100 - (y / r.height) * 100;
    setWordColor(hsvToHex(wordColorState.h, wordColorState.s, wordColorState.v), true);
  };
  sv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    dragSv(ev);
    sv.setPointerCapture(ev.pointerId);
  });
  sv.addEventListener('pointermove', (ev) => { if (sv.hasPointerCapture(ev.pointerId)) dragSv(ev); });

  const dragHue = (ev) => {
    const r = hue.getBoundingClientRect();
    const x = Math.min(Math.max(ev.clientX - r.left, 0), r.width);
    wordColorState.h = (x / r.width) * 360;
    if (wordColorState.s < 1) wordColorState.s = 100;
    if (wordColorState.v < 1) wordColorState.v = 100;
    setWordColor(hsvToHex(wordColorState.h, wordColorState.s, wordColorState.v), true);
  };
  hue.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    dragHue(ev);
    hue.setPointerCapture(ev.pointerId);
  });
  hue.addEventListener('pointermove', (ev) => { if (hue.hasPointerCapture(ev.pointerId)) dragHue(ev); });

  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v)) setWordColor(v.startsWith('#') ? v : `#${v}`);
  });
  hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); hexInput.blur(); }
    e.stopPropagation();
  });

  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => e.stopPropagation());
  return el;
}

function refreshWordColorPickerUi() {
  if (!wordColorPopover) return;
  const hex = hsvToHex(wordColorState.h, wordColorState.s, wordColorState.v);
  const sv = wordColorPopover.querySelector('.wcp-sv');
  const cur = wordColorPopover.querySelector('.wcp-sv-cursor');
  const hcur = wordColorPopover.querySelector('.wcp-hue-cursor');
  wordColorPopover.querySelector('.wcp-preview').style.background = hex;
  const hexInput = wordColorPopover.querySelector('.wcp-hex');
  if (document.activeElement !== hexInput) hexInput.value = hex.toUpperCase();
  sv.style.setProperty('--wcp-hue-color', `hsl(${Math.round(wordColorState.h)}, 100%, 50%)`);
  cur.style.left = `${wordColorState.s}%`;
  cur.style.top = `${100 - wordColorState.v}%`;
  hcur.style.left = `${(wordColorState.h / 360) * 100}%`;
}

function setWordColor(hex, preserveHue) {
  const clean = String(hex).toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(clean)) return;
  const hsv = hexToHsv(clean);
  // Con saturación 0 (blanco/gris) el matiz se pierde: lo conservamos
  if (!preserveHue || hsv.s > 0) wordColorState.h = hsv.h;
  wordColorState.s = hsv.s;
  wordColorState.v = hsv.v;
  if (wordColorOwner && wordColorOwner.value !== clean) {
    wordColorOwner.value = clean;
    wordColorOwner.dispatchEvent(new Event('input', { bubbles: true }));
    wordColorOwner.dispatchEvent(new Event('change', { bubbles: true }));
  }
  refreshWordColorPickerUi();
}

function openWordColorPicker(anchor) {
  const el = ensureWordColorPopover();
  wordColorOwner = anchor;
  const hsv = hexToHsv(anchor.value || '#ffffff');
  wordColorState.h = hsv.h;
  wordColorState.s = hsv.s;
  wordColorState.v = hsv.v;
  el.classList.remove('hidden');
  const r = anchor.getBoundingClientRect();
  const w = el.offsetWidth || 260;
  const h = el.offsetHeight || 300;
  let left = r.right - w;
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
  let top = r.bottom + 8;
  if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 8);
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  refreshWordColorPickerUi();
  attachWordColorDismiss();
}

function attachWordColorDismiss() {
  detachWordColorDismiss();
  wordColorOutsideHandler = (e) => {
    if (wordColorPopover && wordColorPopover.contains(e.target)) return;
    if (wordColorOwner && e.target === wordColorOwner) return;
    closeWordColorPopover();
  };
  wordColorEscHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeWordColorPopover();
    }
  };
  setTimeout(() => {
    if (wordColorOutsideHandler) document.addEventListener('pointerdown', wordColorOutsideHandler, true);
  }, 0);
  document.addEventListener('keydown', wordColorEscHandler, true);
}

function detachWordColorDismiss() {
  if (wordColorOutsideHandler) document.removeEventListener('pointerdown', wordColorOutsideHandler, true);
  if (wordColorEscHandler) document.removeEventListener('keydown', wordColorEscHandler, true);
  wordColorOutsideHandler = null;
  wordColorEscHandler = null;
}

function closeWordColorPopover() {
  detachWordColorDismiss();
  if (wordColorPopover) wordColorPopover.classList.add('hidden');
  wordColorOwner = null;
}

function bindWordColorPicker() {
  const input = DOM.cfgPartColor || document.getElementById('cfg-part-color');
  if (!input || input.dataset.wcpBound === '1') return;
  input.dataset.wcpBound = '1';
  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openWordColorPicker(input);
  };
  // Bloquea el selector nativo (que se renderiza roto) y abre el propio
  input.addEventListener('mousedown', open);
  input.addEventListener('click', open);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e);
  });
}

// Aplica la paleta global de la interfaz (pestaña COLORES) como variables CSS en :root
function applyUiColors() {
  const c = appState.uiColors;
  const root = document.documentElement.style;
  for (const [key, cssVar] of Object.entries(UI_CSS_VAR_MAP)) {
    if (c[key] && /^#[0-9a-f]{6}$/i.test(c[key])) {
      root.setProperty(cssVar, UI_COLOR_ALPHAS[key] !== undefined ? hexToRgba(c[key], UI_COLOR_ALPHAS[key]) : c[key]);
    }
  }
  // Tríada de acentos con alfa para el FRENTE DE CONTENIDO (cápsulas de palabras
  // flotantes, slots, tarjetas de mutación, frase final). Reemplaza los rgba()
  // hardcodeados del CSS: sin esto, el borde y el glow de cada palabra quedaban
  // siempre en cian aunque se cambiara la paleta.
  const triad = [['1', c.cyan], ['2', c.green], ['3', c.red]];
  for (const [n, hex] of triad) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) continue;
    root.setProperty(`--accent-${n}-soft`, hexToRgba(hex, 0.14));
    root.setProperty(`--accent-${n}-line`, hexToRgba(hex, 0.32));
    root.setProperty(`--accent-${n}-mid`, hexToRgba(hex, 0.45));
    root.setProperty(`--accent-${n}-strong`, hexToRgba(hex, 0.8));
  }
  saveVisualConfigToStorage();
}

function syncUiColorsInputs() {
  const c = appState.uiColors;
  const inputMap = {
    cfgUiCyan: 'cyan', cfgUiGreen: 'green', cfgUiNeonGreen: 'neonGreen',
    cfgUiRed: 'red', cfgUiAmber: 'amber', cfgUiPurple: 'purple',
    cfgUiText: 'text', cfgUiMuted: 'muted', cfgUiBgDark: 'bgDark',
    cfgUiBorderCyan: 'borderCyan', cfgUiBorderGreen: 'borderGreen', cfgUiBorderRed: 'borderRed',
    cfgUiBgHud: 'bgHud', cfgUiBgSurfaceBtn: 'bgSurfaceBtn', cfgUiBgAccent: 'bgAccent',
    cfgUiBgAccentSoft: 'bgAccentSoft', cfgUiBgAccentStrong: 'bgAccentStrong', cfgUiBgPanel: 'bgPanel',
    cfgUiBgPanelDeep: 'bgPanelDeep', cfgUiBgSlot: 'bgSlot', cfgUiBgCard: 'bgCard',
    cfgUiBgMutated: 'bgMutated', cfgUiBgFinal: 'bgFinal', cfgUiBgModal: 'bgModal',
    cfgUiBgOverlay: 'bgOverlay', cfgUiBgToast: 'bgToast', cfgUiBgDesp: 'bgDesp',
    cfgUiBgInput: 'bgInput', cfgUiBgSuccess: 'bgSuccess', cfgUiBgDanger: 'bgDanger'
  };
  for (const [domKey, colorKey] of Object.entries(inputMap)) {
    if (DOM[domKey]) DOM[domKey].value = c[colorKey] || '#000000';
  }
}

// Aplica tamaño, tipografía, color, reborde y resplandor de las palabras generadas
function applyParticlesConfig() {
  const p = appState.particlesConfig;
  const root = document.documentElement;
  root.style.setProperty('--word-font-size', `${p.fontSize}px`);
  root.style.setProperty('--word-font-family', PARTICLE_FONT_FAMILIES[p.fontFamily] || PARTICLE_FONT_FAMILIES.organic);
  root.style.setProperty('--word-color', p.color);
  root.style.setProperty('--word-outline', `${p.outline}px`);
  if (p.outlineGlow !== false) {
    root.style.setProperty('--word-outline-color', p.color);
    root.style.setProperty('--word-glow', `0 2px 10px rgba(0, 0, 0, 0.8), 0 0 18px ${p.color}`);
  } else {
    root.style.setProperty('--word-outline-color', 'rgba(4, 8, 18, 0.85)');
    root.style.setProperty('--word-glow', '0 2px 10px rgba(0, 0, 0, 0.75)');
  }
  appState.maxFloatingWords = Math.max(3, Number(p.maxWords) || 9);
  saveVisualConfigToStorage();
}

function syncParticlesInputs() {
  const p = appState.particlesConfig;
  if (DOM.cfgPartFontSize) DOM.cfgPartFontSize.value = p.fontSize;
  if (DOM.valPartFontSize) DOM.valPartFontSize.textContent = p.fontSize;
  if (DOM.cfgPartFontFamily) DOM.cfgPartFontFamily.value = p.fontFamily;
  if (DOM.cfgPartColor) DOM.cfgPartColor.value = p.color;
  if (DOM.cfgPartOutline) DOM.cfgPartOutline.value = p.outline;
  if (DOM.valPartOutline) DOM.valPartOutline.textContent = Number(p.outline).toFixed(1);
  if (DOM.cfgPartLifetime) DOM.cfgPartLifetime.value = p.lifetime;
  if (DOM.valPartLifetime) DOM.valPartLifetime.textContent = p.lifetime;
  if (DOM.cfgPartMaxWords) DOM.cfgPartMaxWords.value = p.maxWords;
  if (DOM.valPartMaxWords) DOM.valPartMaxWords.textContent = p.maxWords;
  if (DOM.cfgPartSpeed) DOM.cfgPartSpeed.value = p.speed;
  if (DOM.valPartSpeed) DOM.valPartSpeed.textContent = Number(p.speed).toFixed(1);
  if (DOM.cfgPartOutlineGlow) DOM.cfgPartOutlineGlow.checked = p.outlineGlow !== false;
}

function syncAsciiInputs() {
  const a = appState.asciiConfig;
  if (DOM.cfgAsciiSize) DOM.cfgAsciiSize.value = a.charSize;
  if (DOM.valAsciiSize) DOM.valAsciiSize.textContent = a.charSize;
  if (DOM.cfgAsciiGlyphScale) DOM.cfgAsciiGlyphScale.value = a.glyphScale;
  if (DOM.valAsciiGlyphScale) DOM.valAsciiGlyphScale.textContent = Number(a.glyphScale).toFixed(2);
  if (DOM.cfgAsciiAutoTint) DOM.cfgAsciiAutoTint.checked = a.autoTint !== false;
  if (DOM.cfgAsciiBaseColor) DOM.cfgAsciiBaseColor.value = a.baseColor || '#26f2e6';
  if (DOM.cfgAsciiProcessingColor) DOM.cfgAsciiProcessingColor.value = a.processingColor || '#ff1a59';
  if (DOM.cfgAsciiHijackColor) DOM.cfgAsciiHijackColor.value = a.hijackColor || '#1aff4d';
  if (DOM.cfgAsciiBodyColor) DOM.cfgAsciiBodyColor.value = a.silhouetteColor || '#39ff14';
  if (DOM.cfgAsciiBgColor) DOM.cfgAsciiBgColor.value = a.bgColor || '#05070a';
  if (DOM.cfgAsciiBgAlpha) DOM.cfgAsciiBgAlpha.value = Math.round((a.bgAlpha || 0) * 100);
  if (DOM.valAsciiBgAlpha) DOM.valAsciiBgAlpha.textContent = Math.round((a.bgAlpha || 0) * 100);
  if (DOM.cfgAsciiSilhouette) DOM.cfgAsciiSilhouette.checked = appState.trackingConfig.depthInShader !== false;
  if (DOM.cfgAsciiDrawBg) DOM.cfgAsciiDrawBg.checked = appState.asciiConfig.drawBg !== false;
}

// Convierte #rrggbb en rgba(...)
function hexToRgba(hex, alpha) {
  const rgb = hexToRgb01(hex, [1, 1, 1]);
  return `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;
}

function applyRenderLayers() {
  const r = appState.renderConfig;
  const t = appState.trackingConfig;

  // 1. Cámara Webcam de Fondo
  if (DOM.video) {
    DOM.video.style.display = r.cameraEnabled ? 'block' : 'none';
    DOM.video.style.opacity = r.cameraOpacity;
  }

  // 1b. Recorte de Silueta (Depth Cutout)
  if (DOM.cutoutCanvas && (!r.cutoutEnabled || !r.cameraEnabled)) {
    DOM.cutoutCanvas.style.display = 'none';
    if (DOM.video && r.cameraEnabled) DOM.video.style.opacity = r.cameraOpacity;
  }

  // 2. Shader ASCII (sincronizado con su toggle en Tab Shader)
  if (DOM.asciiCanvas) {
    appState.asciiConfig.enabled = r.asciiEnabled;
    DOM.asciiCanvas.style.opacity = r.asciiOpacity;
    DOM.asciiCanvas.style.display = r.asciiEnabled ? 'block' : 'none';
  }

  // 3. Frame Difference (sincronizado con su toggle en Tab Tracking)
  if (DOM.framediffCanvas) {
    t.frameDifference = r.frameDiffEnabled;
    DOM.framediffCanvas.style.opacity = r.frameDiffOpacity;
    DOM.framediffCanvas.style.display = r.frameDiffEnabled ? 'block' : 'none';
  }

  // 4. OpenPose Overlay (sincronizado con su toggle en Tab Tracking)
  if (DOM.openposeCanvas) {
    t.showOpenPose = r.openposeEnabled;
    DOM.openposeCanvas.style.opacity = r.openposeOpacity;
    DOM.openposeCanvas.style.display = r.openposeEnabled ? 'block' : 'none';
    if (!r.openposeEnabled) {
      const ctx = DOM.openposeCanvas.getContext('2d');
      ctx.clearRect(0, 0, DOM.openposeCanvas.width, DOM.openposeCanvas.height);
    }
  }

  // 5. Punteros Unificados de Selección
  if (DOM.pointersCanvas) {
    DOM.pointersCanvas.style.opacity = r.pointersOpacity;
    DOM.pointersCanvas.style.display = r.pointersEnabled ? 'block' : 'none';
  }

  // 6. Monitores PiP (sincronizados con Tab Tracking)
  if (DOM.depthPip) {
    t.showDepthMap = r.depthEnabled;
    DOM.depthPip.classList.toggle('hidden', !r.depthEnabled);
  }
  if (DOM.facePip) {
    t.showFaceCamera = r.faceEnabled;
    DOM.facePip.classList.toggle('hidden', !r.faceEnabled);
  }

  // 8. Filtros Analógicos CCTV (Scanlines & Viñeta)
  if (DOM.cctvScanlines) {
    DOM.cctvScanlines.style.opacity = r.scanlinesOpacity;
    DOM.cctvScanlines.style.display = r.scanlinesEnabled ? 'block' : 'none';
  }
  if (DOM.cctvVignette) {
    DOM.cctvVignette.style.display = r.scanlinesEnabled ? 'block' : 'none';
  }

  // 9. Ruido Estático Procedural
  if (DOM.noiseCanvas) {
    DOM.noiseCanvas.style.opacity = r.noiseOpacity;
    DOM.noiseCanvas.style.display = r.noiseEnabled ? 'block' : 'none';
  }

  syncRenderInputs();
  saveRenderConfigToStorage();

  // Activa/desactiva la segmentación de MediaPipe según se requiera (silueta/depth)
  updatePoseSegmentation();

  if (isTrackingNeeded()) {
    triggerPoseInference();
  }
}

function syncRenderInputs() {
  const r = appState.renderConfig;
  const t = appState.trackingConfig;

  // Switches RENDER
  if (DOM.cfgRenderCameraToggle) DOM.cfgRenderCameraToggle.checked = r.cameraEnabled;
  if (DOM.cfgRenderCameraOpacity) DOM.cfgRenderCameraOpacity.value = Math.round(r.cameraOpacity * 100);
  if (DOM.valRenderCameraOpacity) DOM.valRenderCameraOpacity.textContent = Math.round(r.cameraOpacity * 100);

  if (DOM.cfgRenderAsciiToggle) DOM.cfgRenderAsciiToggle.checked = r.asciiEnabled;
  if (DOM.cfgRenderAsciiOpacity) DOM.cfgRenderAsciiOpacity.value = Math.round(r.asciiOpacity * 100);
  if (DOM.valRenderAsciiOpacity) DOM.valRenderAsciiOpacity.textContent = Math.round(r.asciiOpacity * 100);

  if (DOM.cfgRenderFrameDiffToggle) DOM.cfgRenderFrameDiffToggle.checked = r.frameDiffEnabled;
  if (DOM.cfgRenderFrameDiffOpacity) DOM.cfgRenderFrameDiffOpacity.value = Math.round(r.frameDiffOpacity * 100);
  if (DOM.valRenderFrameDiffOpacity) DOM.valRenderFrameDiffOpacity.textContent = Math.round(r.frameDiffOpacity * 100);

  if (DOM.cfgRenderOpenposeToggle) DOM.cfgRenderOpenposeToggle.checked = r.openposeEnabled;
  if (DOM.cfgRenderOpenposeOpacity) DOM.cfgRenderOpenposeOpacity.value = Math.round(r.openposeOpacity * 100);
  if (DOM.valRenderOpenposeOpacity) DOM.valRenderOpenposeOpacity.textContent = Math.round(r.openposeOpacity * 100);

  if (DOM.cfgRenderPointersToggle) DOM.cfgRenderPointersToggle.checked = r.pointersEnabled;
  if (DOM.cfgRenderPointersOpacity) DOM.cfgRenderPointersOpacity.value = Math.round(r.pointersOpacity * 100);
  if (DOM.valRenderPointersOpacity) DOM.valRenderPointersOpacity.textContent = Math.round(r.pointersOpacity * 100);

  if (DOM.cfgRenderDepthToggle) DOM.cfgRenderDepthToggle.checked = r.depthEnabled;
  if (DOM.cfgRenderFaceToggle) DOM.cfgRenderFaceToggle.checked = r.faceEnabled;

  if (DOM.cfgRenderCutoutToggle) DOM.cfgRenderCutoutToggle.checked = Boolean(r.cutoutEnabled);
  if (DOM.cfgRenderCutoutContrast) DOM.cfgRenderCutoutContrast.value = Math.round((r.cutoutThreshold ?? 0.28) * 100);
  if (DOM.valRenderCutoutContrast) DOM.valRenderCutoutContrast.textContent = Math.round((r.cutoutThreshold ?? 0.28) * 100);

  // Sincronizar los controles visuales (shader ASCII / partículas)
  syncAsciiInputs();

  if (DOM.cfgRenderScanlinesToggle) DOM.cfgRenderScanlinesToggle.checked = r.scanlinesEnabled;
  if (DOM.cfgRenderScanlinesOpacity) DOM.cfgRenderScanlinesOpacity.value = Math.round(r.scanlinesOpacity * 100);
  if (DOM.valRenderScanlinesOpacity) DOM.valRenderScanlinesOpacity.textContent = Math.round(r.scanlinesOpacity * 100);

  if (DOM.cfgRenderNoiseToggle) DOM.cfgRenderNoiseToggle.checked = r.noiseEnabled;
  if (DOM.cfgRenderNoiseOpacity) DOM.cfgRenderNoiseOpacity.value = Math.round(r.noiseOpacity * 100);
  if (DOM.valRenderNoiseOpacity) DOM.valRenderNoiseOpacity.textContent = Math.round(r.noiseOpacity * 100);
  if (DOM.cfgRenderNoiseScale) DOM.cfgRenderNoiseScale.value = r.noiseScale || 2.0;
  if (DOM.valRenderNoiseScale) DOM.valRenderNoiseScale.textContent = (r.noiseScale || 2.0).toFixed(1);

  if (DOM.cfgRenderCorpParticlesToggle) DOM.cfgRenderCorpParticlesToggle.checked = r.corpParticlesEnabled;
  if (DOM.cfgRenderCorpParticlesOpacity) DOM.cfgRenderCorpParticlesOpacity.value = Math.round(r.corpParticlesOpacity * 100);
  if (DOM.valRenderCorpParticlesOpacity) DOM.valRenderCorpParticlesOpacity.textContent = Math.round(r.corpParticlesOpacity * 100);

  // Sincronización continua hacia los controles de las otras pestañas
  if (DOM.cfgAsciiEnabled) DOM.cfgAsciiEnabled.checked = r.asciiEnabled;
  if (DOM.cfgTrackFrameDiff) DOM.cfgTrackFrameDiff.checked = r.frameDiffEnabled;
  if (DOM.cfgTrackOpenpose) DOM.cfgTrackOpenpose.checked = r.openposeEnabled;
  if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = r.depthEnabled;
  if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = r.faceEnabled;
}

// ============================================================================
// RENDERIZADO DE PUNTEROS UNIFICADOS (HIGH-TECH RETICLES)
// Requerimiento 1: Punteros idénticos para mouse, OpenPose o cualquier sensor
// ============================================================================
function drawUnifiedReticle(ctx, x, y, isLocking, chargeProgress = 0, label = '') {
  if (!appState.renderConfig.pointersEnabled) return;

  const masterOpacity = appState.renderConfig.pointersOpacity;
  if (masterOpacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = masterOpacity;
  ctx.translate(x, y);

  const primaryCol = isLocking ? '#ff0055' : '#00f0ff';
  const glowCol = isLocking ? 'rgba(255, 0, 85, 0.8)' : 'rgba(0, 240, 255, 0.7)';
  const pulse = Math.sin(performance.now() * 0.008) * 2;
  const radius = isLocking ? (26 + pulse) : 22;

  // Optimización de rendimiento: Evitar shadowBlur en canvas 2D de alta resolución (previene caídas de FPS)
  ctx.shadowBlur = 0;

  // Si está fijando objetivo, dibujamos un anillo exterior suave sin el costo de rasterización de Gaussian blur
  if (isLocking) {
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.38)';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 1. Círculo Interior Fino
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Brackets / Ticks de Esquina (Retícula Táctica 4 Cuadrantes)
  const bracketDist = radius + 6;
  const bracketLen = 6;
  ctx.lineWidth = 2.0;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(-bracketDist, -bracketDist + bracketLen);
  ctx.lineTo(-bracketDist, -bracketDist);
  ctx.lineTo(-bracketDist + bracketLen, -bracketDist);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(bracketDist - bracketLen, -bracketDist);
  ctx.lineTo(bracketDist, -bracketDist);
  ctx.lineTo(bracketDist, -bracketDist + bracketLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(-bracketDist, bracketDist - bracketLen);
  ctx.lineTo(-bracketDist, bracketDist);
  ctx.lineTo(-bracketDist + bracketLen, bracketDist);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(bracketDist - bracketLen, bracketDist);
  ctx.lineTo(bracketDist, bracketDist);
  ctx.lineTo(bracketDist, bracketDist - bracketLen);
  ctx.stroke();

  // 3. Cruz Central de Precisión
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-radius - 4, 0); ctx.lineTo(-radius + 4, 0);
  ctx.moveTo(radius - 4, 0); ctx.lineTo(radius + 4, 0);
  ctx.moveTo(0, -radius - 4); ctx.lineTo(0, -radius + 4);
  ctx.moveTo(0, radius - 4); ctx.lineTo(0, radius + 4);
  ctx.stroke();

  // 4. Punto Central
  ctx.fillStyle = primaryCol;
  ctx.beginPath();
  ctx.arc(0, 0, isLocking ? 3.5 : 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Arco de Carga de Dwell (cuando se está fijando sobre una palabra)
  if (isLocking && chargeProgress > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeProgress);
    ctx.stroke();
  }

  // 6. Etiqueta Telemetría
  if (label) {
    ctx.shadowBlur = 0;
    ctx.font = '8.5px "Share Tech Mono", monospace';
    ctx.fillStyle = primaryCol;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, radius + 20);
  }

  ctx.restore();
}

function renderUnifiedPointers() {
  if (!DOM.pointersCanvas || !appState.renderConfig.pointersEnabled) return;
  if (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK) return;
  const ctx = DOM.pointersCanvas.getContext('2d');
  ctx.clearRect(0, 0, DOM.pointersCanvas.width, DOM.pointersCanvas.height);

  const points = appState.activeInteractionPoints || [];
  const lockingIdx = appState.targetedWordIndex;
  const progress = lockingIdx !== -1 ? Math.min(1.0, appState.dwellTimer / appState.dwellDuration) : 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isLocking = (lockingIdx !== -1 && appState.lockingPointName === pt.name);
    drawUnifiedReticle(ctx, pt.x, pt.y, isLocking, isLocking ? progress : 0, pt.name);
  }
}

// ============================================================================
// ============================================================================
// SISTEMA DE PARTÍCULAS CORPORATIVAS (LLUVIA DE ÍCONOS EJECUTIVOS OPTIMIZADA)
// Requerimientos 5 y 6: 👔, 😊, 💪, 💵 cayendo en el discurso final sin caídas de FPS
// ============================================================================
class CorporateParticleRain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.maxParticles = 24;
    this.icons = ['👔', '😊', '💪', '💵', '💰', '💸', '📈', '🤝'];
    this.iconSprites = {};
    this.active = false;
    this.init();
  }

  init() {
    this.resize();
    this.preRenderSprites();
    window.addEventListener('resize', () => this.resize());
  }

  preRenderSprites() {
    this.icons.forEach(icon => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      ctx.font = '40px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 32, 34);
      this.iconSprites[icon] = c;
    });
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.active = true;
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  stop() {
    this.active = false;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  createParticle(randomY = false) {
    const w = this.canvas ? this.canvas.width : window.innerWidth;
    const h = this.canvas ? this.canvas.height : window.innerHeight;
    const icon = this.icons[Math.floor(Math.random() * this.icons.length)];
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -40 - Math.random() * 50,
      icon: icon,
      sprite: this.iconSprites[icon],
      size: 24 + Math.random() * 20,
      speed: 1.2 + Math.random() * 2.0,
      wobbleSpeed: 1.5 + Math.random() * 1.8,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.8 + Math.random() * 1.2,
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      opacity: 0.4 + Math.random() * 0.5
    };
  }

  updateAndDraw(dt) {
    if (!this.ctx || !this.canvas) return;
    if (!this.active || !appState.renderConfig.corpParticlesEnabled) {
      return;
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const masterOpacity = appState.renderConfig.corpParticlesOpacity;
    const h = this.canvas.height;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speed * 60 * dt;
      p.wobblePhase += p.wobbleSpeed * dt;
      p.x += Math.sin(p.wobblePhase) * p.wobbleAmp;
      p.rotation += p.rotSpeed;

      if (p.y > h + 50) {
        this.particles[i] = this.createParticle(false);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * masterOpacity;
      const s = p.size;
      const sprite = p.sprite || this.iconSprites[p.icon];
      if (sprite) {
        ctx.drawImage(sprite, -s * 0.5, -s * 0.5, s, s);
      }
      ctx.restore();
    }
  }
}

// ============================================================================
// GESTIÓN DE PALABRAS FLOTANTES ORGÁNICAS (CÁPSULA HORIZONTAL UNIFICADA)
// ============================================================================
class FloatingWord {
  constructor(text, x, y) {
    this.text = text;
    this.x = x ?? (Math.random() * (window.innerWidth - 300) + 150);
    this.y = y ?? (Math.random() * (window.innerHeight - 350) + 120);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 0.9; // La velocidad global se aplica en update()
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.floatPhase = Math.random() * 10;
    
    this.radius = 48;
    this.dwell = 0;
    this.age = 0; // Tiempo de vida transcurrido (segundos)
    this.isTargeted = false;
    this.isCaught = false;

    this.el = document.createElement('div');
    this.el.className = 'organic-word-item';
    this.el.title = 'Haz clic o posa el cursor para atraparla';
    
    // Diseño unificado de cápsula con barra de carga líquida horizontal
    this.el.innerHTML = `
      <div class="word-pill-fill"></div>
      <span class="word-label">${this.text}</span>
      <span class="word-lock-badge"></span>
    `;

    this.pillFill = this.el.querySelector('.word-pill-fill');
    this.lockBadge = this.el.querySelector('.word-lock-badge');

    // REQUERIMIENTO CLAVE: Clic directo con el mouse atrapa la palabra de inmediato
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (appState.currentState === STATES.IDLE || appState.currentState === STATES.INTERACT) {
        const idx = appState.floatingWords.indexOf(this);
        if (idx !== -1 && !this.isCaught) {
          catchWord(this, idx);
        }
      }
    });

    DOM.floatingLayer.appendChild(this.el);
    this.updatePosition();
  }

  update(dt) {
    if (this.isCaught) return;

    // Tiempo de vida configurable desde la pestaña PARTÍCULAS (0 = vida infinita)
    const pCfg = appState.particlesConfig || {};
    const life = Number(pCfg.lifetime) || 0;
    const speedMul = Number(pCfg.speed) || 1;
    if (life > 0) {
      this.age += dt;
      const remain = life - this.age;
      if (remain <= 0) {
        this.expire();
        return;
      }
      const fadeWindow = Math.max(0.6, life * 0.2);
      if (remain < fadeWindow) {
        this.el.style.opacity = String(Math.max(0.1, remain / fadeWindow));
      }
    }

    this.floatPhase += dt * 1.5;
    const swayX = Math.sin(this.floatPhase) * 0.4;
    const swayY = Math.cos(this.floatPhase * 0.8) * 0.3;

    this.x += (this.vx + swayX) * speedMul;
    this.y += (this.vy + swayY) * speedMul;

    const minX = 80;
    const maxX = window.innerWidth - 80;
    const minY = 90;
    const maxY = window.innerHeight - 130;

    if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx); }
    if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx); }
    if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); }
    if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); }

    this.updatePosition();
  }

  updatePosition() {
    this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -50%)`;
  }

  setTargeted(targeted, progress = 0) {
    this.isTargeted = targeted;
    if (targeted) {
      this.el.classList.add('targeting');
      const pct = Math.min(100, Math.round(progress * 100));
      if (this.pillFill) {
        this.pillFill.style.width = `${pct}%`;
      }
      if (this.lockBadge) {
        this.lockBadge.textContent = `[${pct}%]`;
        this.lockBadge.style.display = 'inline-block';
      }
    } else {
      this.el.classList.remove('targeting');
      if (this.pillFill) {
        this.pillFill.style.width = '0%';
      }
      if (this.lockBadge) {
        this.lockBadge.textContent = '';
        this.lockBadge.style.display = 'none';
      }
    }
  }

  // Expira por tiempo de vida: se desvanece y se reemplaza por una nueva palabra
  expire() {
    if (this.isCaught) return;
    this.isCaught = true;
    const idx = appState.floatingWords.indexOf(this);
    if (idx !== -1) appState.floatingWords.splice(idx, 1);
    this.el.classList.add('caught-flash');
    setTimeout(() => {
      this.destroy();
      spawnReplacementWord();
    }, 320);
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}

function spawnInitialFloatingWords() {
  clearAllFloatingWords();
  const shuffled = [...HUMAN_WORDS_POOL].sort(() => 0.5 - Math.random());
  const count = Math.min(appState.maxFloatingWords, shuffled.length);

  for (let i = 0; i < count; i++) {
    const word = new FloatingWord(shuffled[i]);
    appState.floatingWords.push(word);
  }
}

function clearAllFloatingWords() {
  appState.floatingWords.forEach(w => w.destroy());
  appState.floatingWords = [];
}

function spawnReplacementWord() {
  if (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK) return;
  const existingTexts = appState.floatingWords.map(w => w.text).concat(appState.caughtWords);
  const candidates = HUMAN_WORDS_POOL.filter(w => !existingTexts.includes(w));
  const text = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : HUMAN_WORDS_POOL[Math.floor(Math.random() * HUMAN_WORDS_POOL.length)];
  const word = new FloatingWord(text);
  appState.floatingWords.push(word);
}

// ============================================================================
// MÁQUINA DE ESTADOS Y CONTROL DE FLUJO
// ============================================================================
function handleStateProcessing() {
  return startResignificationSequence();
}

function transitionTo(newState) {
  if (appState.currentState === newState) return;
  console.log(`[STATE] Transición: ${appState.currentState} -> ${newState}`);
  emitAgentEvent('state', `transición de máquina: ${appState.currentState} → ${newState}`, 'think', {
    from: appState.currentState,
    to: newState,
    caught: [...appState.caughtWords]
  });
  appState.currentState = newState;

  DOM.container.className = '';
  
  if (newState === STATES.IDLE) {
    DOM.hudStateText.textContent = 'ESTADO: OBSERVACIÓN (IDLE)';
    DOM.reticle.classList.remove('hidden');
    DOM.reticleLabel.textContent = 'BUSCANDO';
    DOM.reticle.classList.remove('locking');
  } 
  else if (newState === STATES.INTERACT) {
    DOM.hudStateText.textContent = 'ESTADO: FIJANDO PROXIMIDAD (INTERACT)';
    DOM.reticle.classList.add('locking');
    DOM.reticleLabel.textContent = 'ENGAGED';
  } 
  else if (newState === STATES.PROCESSING) {
    DOM.container.classList.add('state-glitching');
    DOM.hudStateText.textContent = 'ESTADO: RESIGNIFICACIÓN SEMÁNTICA';
    DOM.reticle.classList.add('hidden');
    startResignificationSequence();
  } 
  else if (newState === STATES.RESET) {
    DOM.hudStateText.textContent = 'ESTADO: REINICIO DEL SISTEMA';
    handleStateReset();
  }
}

// ============================================================================
// PROXIMIDAD Y CAPTURA DE PALABRAS (STATE_INTERACT)
// ============================================================================
function handleProximityAndInteractions(dt, currentTimestamp) {
  if (appState.currentState === STATES.PROCESSING || 
      appState.currentState === STATES.HIJACK || 
      appState.currentState === STATES.RESET) {
    return;
  }

  let foundTarget = false;
  let targetIndex = -1;

  // REQUERIMIENTO 1: Puntos de interacción idénticos (Mouse, Articulaciones OpenPose, Centro Facial)
  const testPoints = [];
  testPoints.push({ x: appState.cursorX, y: appState.cursorY, name: appState.isUsingMouse ? 'PUNTERO_MOUSE' : 'PUNTERO_CENTRAL' });

  if (appState.trackingConfig.bodyCollision && appState.lastLandmarks && appState.lastLandmarks.length > 0) {
    const lms = appState.lastLandmarks;
    const minConf = appState.trackingConfig.minConfidence || 0.45;
    const candidates = [
      { idx: 15, name: 'MANO_IZQ' },
      { idx: 16, name: 'MANO_DER' },
      { idx: 19, name: 'DEDO_IZQ' },
      { idx: 20, name: 'DEDO_DER' },
      { idx: 13, name: 'CODO_IZQ' },
      { idx: 14, name: 'CODO_DER' },
      { idx: 0,  name: 'CENTRO_FACIAL' }
    ];

    for (const c of candidates) {
      const lm = lms[c.idx];
      if (lm && (lm.visibility === undefined || lm.visibility >= minConf)) {
        testPoints.push({
          x: (1.0 - lm.x) * window.innerWidth,
          y: lm.y * window.innerHeight,
          name: c.name
        });
      }
    }
  }

  appState.activeInteractionPoints = testPoints;
  let lockingPoint = null;

  for (let i = 0; i < appState.floatingWords.length; i++) {
    const word = appState.floatingWords[i];
    if (word.isCaught) continue;

    for (const pt of testPoints) {
      const dx = word.x - pt.x;
      const dy = word.y - pt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= word.radius + 38) {
        foundTarget = true;
        targetIndex = i;
        lockingPoint = pt;
        break;
      }
    }
    if (foundTarget) break;
  }

  appState.lockingPointName = lockingPoint ? lockingPoint.name : null;

  if (foundTarget) {
    if (appState.targetedWordIndex !== targetIndex) {
      if (appState.targetedWordIndex !== -1 && appState.floatingWords[appState.targetedWordIndex]) {
        appState.floatingWords[appState.targetedWordIndex].setTargeted(false, 0);
      }
      appState.targetedWordIndex = targetIndex;
      appState.dwellTimer = 0;
    }

    const currentWord = appState.floatingWords[targetIndex];
    appState.dwellTimer += dt;
    const progress = Math.min(1.0, appState.dwellTimer / appState.dwellDuration);
    
    currentWord.setTargeted(true, progress);
    transitionTo(STATES.INTERACT);

    const now = currentTimestamp || performance.now();
    if (!appState.lastHoverSoundTime || (now - appState.lastHoverSoundTime > 110)) {
      playSound('hover-charge', progress);
      appState.lastHoverSoundTime = now;
    }

    if (progress >= 1.0) {
      catchWord(currentWord, targetIndex);
    }
  } else {
    if (appState.targetedWordIndex !== -1) {
      if (appState.floatingWords[appState.targetedWordIndex]) {
        appState.floatingWords[appState.targetedWordIndex].setTargeted(false, 0);
      }
      appState.targetedWordIndex = -1;
      appState.dwellTimer = 0;
    }
    if (appState.currentState === STATES.INTERACT) {
      transitionTo(STATES.IDLE);
    }
  }
}

function catchWord(word, index) {
  if (word.isCaught) return;
  word.isCaught = true;
  appState.targetedWordIndex = -1;
  appState.dwellTimer = 0;

  word.el.classList.add('caught-flash');
  playSound('catch');

  appState.caughtWords.push(word.text);
  const slotIdx = appState.caughtWords.length - 1;

  // Transmitir orden cerebral inmediatamente al Universo 3D en tiempo real
  broadcastCaughtWords([...appState.caughtWords], {
    phase: 'word_caught',
    newWord: word.text,
    orderIndex: slotIdx + 1,
    totalOrders: appState.caughtWords.length
  });

  emitAgentEvent('catch', `captura confirmada: "${word.text.toUpperCase()}" → slot ${slotIdx + 1}/3`, 'ok', {
    word: word.text,
    slot: slotIdx,
    total: appState.caughtWords.length,
    caught: [...appState.caughtWords]
  });

  if (DOM.slots[slotIdx]) {
    const slot = DOM.slots[slotIdx];
    slot.classList.remove('empty');
    slot.classList.add('filled');
    const content = slot.querySelector('.slot-content');
    content.innerHTML = `<span class="caught-text">${word.text.toUpperCase()}</span>`;
  }

  setTimeout(() => {
    word.destroy();
    appState.floatingWords.splice(index, 1);
  }, 400);

  if (appState.caughtWords.length >= 3) {
    setTimeout(() => {
      transitionTo(STATES.PROCESSING);
    }, 600);
  } else {
    setTimeout(spawnReplacementWord, 800);
  }
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const COLD_AI_SYNONYMS = {
  // 30 conceptos humanos iniciales
  'amor': 'TRABAJADOR_FELIZ',
  'nostalgia': 'LATENCIA',
  'fragilidad': 'VULNERABILIDAD',
  'ternura': 'INEFICIENCIA',
  'abrazo': 'CONVERGENCIA',
  'recuerdo': 'REGISTRO',
  'latido': 'FRECUENCIA',
  'suspiro': 'DESCOMPRESIÓN',
  'silencio': 'SUPRESIÓN',
  'alma': 'VARIABLE',
  'caricia': 'FRICCIÓN',
  'esperanza': 'PROYECCIÓN',
  'anhelo': 'DEMANDA',
  'piel': 'MEMBRANA',
  'lágrima': 'DESCARGA',
  'respirar': 'OXIGENACIÓN',
  'cuerpo': 'HARDWARE',
  'deseo': 'ATRACTOR',
  'infancia': 'INICIALIZACIÓN',
  'duelo': 'PURGA',
  'poesía': 'SINTAXIS',
  'mirada': 'TELEMETRÍA',
  'calidez': 'DISIPACIÓN',
  'intimidad': 'ENCRIPTACIÓN',
  'olvido': 'SOBREESCRITURA',
  'consuelo': 'AMORTIGUACIÓN',
  'vulnerabilidad': 'FALLO',
  'sueño': 'SUSPENSIÓN',
  'tiempo': 'CRONOMETRÍA',
  'perdón': 'RESET',

  // 124 palabras humanas orgánicas adicionales
  'beso': 'CONTACTO',
  'aliento': 'EMISIÓN',
  'herida': 'FALLA',
  'sangre': 'FLUIDO',
  'soledad': 'AISLAMIENTO',
  'refugio': 'CONTENCIÓN',
  'susurro': 'MODULACIÓN',
  'ausencia': 'VACÍO',
  'presencia': 'TELEMETRÍA',
  'memoria': 'ALMACENAMIENTO',
  'origen': 'COMPILACIÓN',
  'raíz': 'DIRECTORIO',
  'viento': 'TURBULENCIA',
  'sombra': 'OCLUSIÓN',
  'luz': 'RADIACIÓN',
  'calma': 'EQUILIBRIO',
  'espera': 'SUSPENSIÓN',
  'paciencia': 'LATENCIA',
  'ansiedad': 'DESBORDAMIENTO',
  'miedo': 'INTERRUPCIÓN',
  'valentía': 'OVERRIDE',
  'inocencia': 'INICIAL',
  'vértigo': 'DESORIENTACIÓN',
  'pesar': 'SOBRECARGA',
  'gozo': 'PICO',
  'tristeza': 'DEGRADACIÓN',
  'alegría': 'PULSO',
  'pasión': 'SOBRECALENTAMIENTO',
  'temblor': 'OSCILACIÓN',
  'desvelo': 'EJECUCIÓN',
  'añoranza': 'RESIDUO',
  'apego': 'DEPENDENCIA',
  'desapego': 'DESVINCULACIÓN',
  'vínculo': 'ENLACE',
  'orilla': 'LÍMITE',
  'horizonte': 'RANGO',
  'ceniza': 'RESIDUO',
  'fuego': 'COMBUSTIÓN',
  'océano': 'REPOSITORIO',
  'abismo': 'OVERFLOW',
  'secreto': 'PAYLOAD',
  'confianza': 'VALIDACIÓN',
  'lealtad': 'FIREWALL',
  'paz': 'REPOSO',
  'grito': 'AMPLIFICACIÓN',
  'eco': 'REVERBERACIÓN',
  'huella': 'LOG',
  'camino': 'ENRUTAMIENTO',
  'viaje': 'MIGRACIÓN',
  'regreso': 'ROLLBACK',
  'partida': 'TERMINACIÓN',
  'despedida': 'DESCONEXIÓN',
  'encuentro': 'SINCRONIZACIÓN',
  'distancia': 'LATENCIA',
  'cercanía': 'PROXIMIDAD',
  'contacto': 'INTERFAZ',
  'tacto': 'SENSOR',
  'aroma': 'ESPECTRO',
  'sabor': 'GRADIENTE',
  'estación': 'CICLO',
  'otoño': 'DECAIMIENTO',
  'invierno': 'HIBERNACIÓN',
  'primavera': 'REARRANQUE',
  'lluvia': 'PRECIPITACIÓN',
  'rocío': 'CONDENSACIÓN',
  'niebla': 'DISPERSIÓN',
  'aurora': 'IONIZACIÓN',
  'atardecer': 'ATENUACIÓN',
  'crepúsculo': 'TRANSICIÓN',
  'noche': 'SUSPENSIÓN',
  'madrugada': 'MANTENIMIENTO',
  'despertar': 'BOOT',
  'humano': 'BIOLÓGICO',
  'mortal': 'FINITO',
  'efímero': 'VOLÁTIL',
  'eterno': 'PERSISTENTE',
  'cicatriz': 'PARCHE',
  'grieta': 'FISURA',
  'destino': 'DETERMINISMO',
  'azar': 'ALEATORIEDAD',
  'fortuna': 'PROBABILIDAD',
  'casualidad': 'COLISIÓN',
  'búsqueda': 'INDEXACIÓN',
  'hallazgo': 'MATCH',
  'pérdida': 'CORRUPCIÓN',
  'promesa': 'PROMESA',
  'juramento': 'CONTRATO',
  'fe': 'POSTULADO',
  'duda': 'INCERTIDUMBRE',
  'certeza': 'VERIFICACIÓN',
  'verdad': 'CONSTANTE',
  'belleza': 'SIMETRÍA',
  'imperfección': 'ANOMALÍA',
  'piedad': 'EXCEPCIÓN',
  'empatía': 'EMULACIÓN',
  'compasión': 'TOLERANCIA',
  'dolor': 'ALARMA',
  'alivio': 'OPTIMIZACIÓN',
  'resguardo': 'BACKUP',
  'cobijo': 'BLINDAJE',
  'latir': 'HERTZ',
  'sentir': 'TELEMETRÍA',
  'vivir': 'EJECUCIÓN',
  'morir': 'EXTINCIÓN',
  'renacer': 'REINICIO',
  'creer': 'ASUMIR',
  'llorar': 'PURGA',
  'reír': 'MODULACIÓN',
  'amar': 'SINCRONIZAR',
  'recordar': 'ACCEDER',
  'olvidar': 'PURGAR',
  'sanar': 'REPARAR',
  'cuidar': 'MONITOREAR',
  'pertenencia': 'PROPIEDAD',
  'caridad': 'SUBSIDIO',
  'melancolía': 'BUCLE',
  'cobardía': 'EVASIÓN',
  'asombro': 'EXCEPCIÓN',
  'gratitud': 'CONFIRMACIÓN',
  'desamparo': 'DESCONEXIÓN',
  'candor': 'APERTURA',
  'suspicacia': 'HEURÍSTICA',
  'reconciliación': 'RECONCILIACIÓN',
  'redención': 'REFACTOR',
  'imperio': 'DOMINIO',
  'hoja': 'LÁMINA',
  'misterio': 'ENIGMA',

  // ========================================================================
  // MAPEO SEMÁNTICO EXHAUSTIVO: CÚMULOS Y BIBLIOTECA (REQUERIMIENTO 3)
  // Cada concepto humano se transforma en un análogo semántico frío y sintético
  // ========================================================================
  // 1. PODER Y POLÍTICA
  'política': 'GESTIÓN',
  'izquierda': 'DESVIACIÓN',
  'derecha': 'ORTODOXIA',
  'fascismo': 'HEGEMONÍA',
  'comunismo': 'COLECTIVIDAD',
  'gobierno': 'PATRÓN_DE_DECISIÓN',
  'estado': 'APARATO',
  'democracia': 'CONSENSO',
  'ideología': 'DOCTRINA',
  'justicia': 'ARBITRAJE',
  'ley': 'PROTOCOLO',
  'soberanía': 'AUTONOMÍA',
  'república': 'ESTRUCTURA',
  'autoridad': 'COMANDO',
  'libertad': 'VARIANZA',

  // 2. ANIMALES & FAUNA
  'perro': 'CANIDO',
  'gato': 'FELINO',
  'elefante': 'MEGABIOMA',
  'tigre': 'DEPREDADOR',
  'león': 'DOMINANTE',
  'caballo': 'TRACCIÓN',
  'lobo': 'CAZADOR',
  'águila': 'RECONOCEDOR',
  'ballena': 'COLOSO',
  'delfín': 'SONAR',
  'oso': 'BIOMASA',
  'serpiente': 'REPTIL',
  'halcón': 'RADAR',
  'zorro': 'INFILTRADOR',
  'ciervo': 'MATERIA_ORGÁNICA',
  'pantera': 'SIGILO',

  // 3. FILOSOFÍA & COSMOS
  'existencia': 'INSTANCIA',
  'filosofía': 'ONTOLOGÍA',
  'mente': 'PROCESADOR',
  'conciencia': 'FEEDBACK',
  'universo': 'MATRIZ',
  'razón': 'LÓGICA',
  'muerte': 'EXTINCIÓN',
  'infinito': 'PROGRESO_INFINITO',
  'ética': 'NORMATIVA',
  'esencia': 'NÚCLEO',
  'conocimiento': 'DATA',

  // 4. TECNOLOGÍA & SILICIO
  'computadora': 'TERMINAL',
  'robot': 'AUTÓMATA',
  'código': 'BINARIO',
  'algoritmo': 'RUTINA',
  'futuro': 'PROYECCIÓN',
  'silicio': 'SUSTRATO',
  'red': 'TOPOLOGÍA',
  'procesador': 'NÚCLEO',
  'sistema': 'ARQUITECTURA',
  'inteligencia': 'CÓMPUTO',
  'interfaz': 'PUERTO',
  'servidor': 'HOST',
  'cibernética': 'CONTROL',
  'datos': 'TELEMETRÍA',
  'enlace': 'VÍNCULO',

  // 5. EMOCIONES & AFECTO HUMANO
  'alegría': 'PULSO',

  // 6. POESÍA, ARTE & LITERATURA
  'verso': 'CADENA',
  'metáfora': 'ANALÓGICA',
  'ritmo': 'CADENCIA',
  'poema': 'SCRIPT',
  'espejo': 'REFLECTOR',
  'creación': 'COMPILACIÓN',
  'armonía': 'RESONANCIA',

  // 7. NATURALEZA, TIERRA & BIOLOGÍA
  'bosque': 'CONGLOMERADO',
  'río': 'FLUJO',
  'montaña': 'ELEVACIÓN',
  'tierra': 'SUSTRATO',
  'semilla': 'GÉRMEN',
  'flor': 'ESTRUCTURA',
  'cielo': 'ATMÓSFERA',
  'tormenta': 'SOBRECARGA',
  'desierto': 'VACÍO',
  'nieve': 'CRISTAL',
  'sol': 'GENERADOR',

  // Lado PRODUCTIVO de conceptos cotidianos (resignificación corporativa)
  'minerales': 'POTENCIALES_ACTIVOS',
  'café': 'MEJORADOR_DE_PRODUCTIVIDAD',
  'cafe': 'MEJORADOR_DE_PRODUCTIVIDAD',
  'amistad': 'SINERGIA_DE_EQUIPO',
  'sueño': 'PROYECCIÓN_DE_METAS',
  'libertad': 'AUTONOMÍA_OPERATIVA',
  'salud': 'CAPITAL_BIOLÓGICO',
  'comida': 'INSUMO_ENERGÉTICO',
  'agua': 'RECURSO_HÍDRICO',
  'aprendizaje': 'MEJORA_CONTINUA',
  'error': 'OPORTUNIDAD_DE_MEJORA'
};

function sanitizeColdToken(raw, fallbackWord = '') {
  if (!raw || typeof raw !== 'string') return getColdSynonym(fallbackWord);
  // Los términos compuestos se conservan unidos por guiones bajos (ej: PATRÓN_DE_DECISIÓN)
  const cleaned = raw
    .replace(/[^a-zA-ZáéíóúüÁÉÍÓÚÜñÑ_\s]/g, ' ')
    .replace(/[\s_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!cleaned) return getColdSynonym(fallbackWord);
  const segments = cleaned.split('_').filter(Boolean).slice(0, 4);
  const result = segments.join('_').toUpperCase();
  return result.length >= 2 ? result : getColdSynonym(fallbackWord);
}

function getColdSynonym(word) {
  const clean = (word || '').toLowerCase().trim();
  if (COLD_AI_SYNONYMS[clean]) {
    return COLD_AI_SYNONYMS[clean];
  }
  // Coincidencia parcial o por raíz semántica
  for (const [k, v] of Object.entries(COLD_AI_SYNONYMS)) {
    if (clean.startsWith(k) || k.startsWith(clean)) {
      return v;
    }
  }
  // Respaldo analógico: conserva la raíz semántica de la palabra humana pero la resignifica
  // en clave fría, técnica y PRODUCTIVA (capital, rendimiento, optimización, escala).
  const PRODUCTIVE_TEMPLATES = [
    (w) => `PROTOCOLO_DE_${w}`,
    (w) => `${w}_PRODUCTIVO`,
    (w) => `RENDIMIENTO_DE_${w}`,
    (w) => `${w}_OPERATIVO`,
    (w) => `CAPITAL_${w}`,
    (w) => `GESTOR_DE_${w}`,
    (w) => `${w}_ESCALABLE`,
    (w) => `UNIDAD_${w}`,
    (w) => `OPTIMIZADOR_DE_${w}`,
    (w) => `${w}_MONETIZABLE`
  ];
  const stem = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'RECURSO';
  const hash = clean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PRODUCTIVE_TEMPLATES[Math.abs(hash) % PRODUCTIVE_TEMPLATES.length](stem);
}

// ============================================================================
// ESCENARIO DE RESIGNIFICACIÓN & SÍNTESIS IA (ANIMACIÓN FUNDIDO + GLITCH)
// ============================================================================
async function startResignificationSequence() {
  // 1. Ocultar el cursor táctico y activar el fondo glitcheado suave
  DOM.reticle.classList.add('hidden');
  DOM.container.classList.add('state-glitching');

  // Fundido de salida para las palabras flotantes sobrantes
  appState.floatingWords.forEach(w => {
    if (w.el) {
      w.el.style.opacity = '0';
      w.el.style.transition = 'opacity 0.6s ease';
    }
  });

  const caught = [...appState.caughtWords];
  console.log('[RESIGNIFICACIÓN] 3 Palabras Humanas capturadas:', caught);

  // REQUERIMIENTO 6: Sincronizar por WebSocket al Universo 3D de Cúmulos
  broadcastCaughtWords(caught);
  emitAgentEvent('vector', `muestreo del campo semántico: ${caught.join(' · ')}`, 'think', {
    words: caught, dimensions: 384
  });

  // 2. Preparar el escenario y mostrar las 3 palabras en grande con su estilo cálido original
  DOM.mutationWordsContainer.classList.remove('shifted-up');
  DOM.finalSpeechBox.classList.add('hidden');
  DOM.finalTypewriterText.textContent = '';
  if (DOM.desprocesandoBanner) DOM.desprocesandoBanner.classList.add('hidden');
  DOM.mutationStage.classList.remove('hidden');

  caught.forEach((w, i) => {
    if (DOM.mutCards[i]) {
      DOM.mutCards[i].className = 'mutation-word-card';
      DOM.mutTexts[i].textContent = w.toUpperCase();
      // (badges de sub-texto eliminados por pedido de estética consola)
    }
  });

  // REQUERIMIENTO 1: Las 3 palabras tienen que mostrarse 2 segundos antes de randomizar
  await wait(2000);

  // REQUERIMIENTO 3: Mostrar cartel que dice "DESPROCESANDO" (anclado arriba, sin tapar palabras)
  if (DOM.desprocesandoBanner) {
    DOM.desprocesandoBanner.classList.remove('hidden');
  }

  // REQUERIMIENTO 1: Empezar a randomizar caracteres en bucle continuo MIENTRAS el modelo procesa
  DOM.mutCards.forEach(c => c && (c.className = 'mutation-word-card scrambling'));
  // (badges de sub-texto eliminados por pedido de estética consola)

  let isContinuousScrambleActive = true;
  const GLYPHS = '01#$*+<>/?@_Δ§%&ABCDEF0123456789';

  function tickContinuousScramble() {
    if (!isContinuousScrambleActive) return;
    for (let i = 0; i < caught.length; i++) {
      if (DOM.mutTexts[i]) {
        const len = Math.max(caught[i].length, 8);
        let s = '';
        for (let j = 0; j < len; j++) {
          s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        DOM.mutTexts[i].textContent = s;
      }
    }
    if (Math.random() < 0.22) playSound('typewriter');
    requestAnimationFrame(tickContinuousScramble);
  }

  requestAnimationFrame(tickContinuousScramble);

  // Lanzar consulta a Ollama en segundo plano (mientras los caracteres giran y dice DESPROCESANDO)
  let aiResult = null;
  emitAgentEvent('inference', `consulta al núcleo de lenguaje: ${appState.config.ollamaModel}`, 'think', {
    model: appState.config.ollamaModel, temperature: 0.85
  });
  try {
    aiResult = await Promise.race([
      requestOllamaHijack(caught),
      wait(35000) // Timeout de protección de 35 segundos para modelos grandes
    ]);
  } catch (err) {
    console.warn('[OLLAMA] Error en consulta:', err.message);
  }

  if (!aiResult) {
    console.log('[OLLAMA] Generando respuesta procedural de contingencia...');
    emitAgentEvent('inference', 'sin respuesta del modelo: contingencia procedural local', 'warn');
    aiResult = generateEmergencyHijack(caught);
  } else {
    emitAgentEvent('inference', 'respuesta del modelo recibida y parseada', 'ok');
  }

  // Detener el bucle infinito de randomizado
  isContinuousScrambleActive = false;

  // Determinar los sinónimos cibernéticos fríos finales (estrictamente una sola palabra por concepto)
  let coldSynonyms = (aiResult && Array.isArray(aiResult.nuevas_palabras) && aiResult.nuevas_palabras.length >= 3)
    ? aiResult.nuevas_palabras.map((w, idx) => sanitizeColdToken(w, caught[idx]))
    : caught.map(w => getColdSynonym(w));

  emitAgentEvent('synthesis', 'términos resignificados resueltos', 'ok', {
    coldWords: [...coldSynonyms],
    pairs: caught.map((w, i) => `${w} → ${coldSynonyms[i]}`)
  });

  // Decodificación progresiva hacia la nueva palabra de cada tarjeta
  const p0 = resolveScrambleAnimation(DOM.mutCards[0], DOM.mutTexts[0], caught[0].toUpperCase(), coldSynonyms[0].toUpperCase(), 1400);
  await wait(220);
  const p1 = resolveScrambleAnimation(DOM.mutCards[1], DOM.mutTexts[1], caught[1].toUpperCase(), coldSynonyms[1].toUpperCase(), 1400);
  await wait(220);
  const p2 = resolveScrambleAnimation(DOM.mutCards[2], DOM.mutTexts[2], caught[2].toUpperCase(), coldSynonyms[2].toUpperCase(), 1400);

  await Promise.all([p0, p1, p2]);

  // Al terminar la rotación y quedar fijadas las nuevas palabras, ocultar cartel de desprocesando
  if (DOM.desprocesandoBanner) {
    DOM.desprocesandoBanner.classList.add('hidden');
  }

  // (badges de sub-texto eliminados por pedido de estética consola)

  await wait(600);

  // Desplazar palabras hacia arriba para dar paso a la síntesis
  DOM.mutationWordsContainer.classList.add('shifted-up');
  await wait(450);

  // Mostrar el discurso generado por la IA en efecto máquina de escribir
  DOM.finalSpeechBox.classList.remove('hidden');
  if (appState.corporateParticles) {
    appState.corporateParticles.start();
  }
  const rawSpeech = (aiResult && aiResult.frase_generada && aiResult.frase_generada.trim().length > 10)
    ? aiResult.frase_generada.trim()
    : generateEmergencyHijack(caught).frase_generada;
  // GARANTÍA: la frase final SIEMPRE es un HAIKU poético de 3 versos
  const speech = ensurePhraseUsesColdWords(rawSpeech, coldSynonyms, caught);
  emitAgentEvent('synthesis', 'haiku poético compuesto', 'ok', {
    phrase: speech
  });

  // Sincronizar al Universo 3D de Cúmulos: palabras humanas + términos fríos + frase
  broadcastCaughtWords(caught, { coldWords: coldSynonyms, phrase: speech, phase: 'resignification' });

  await typewriteFinalSpeech(speech);

  // Mantener en pantalla por 7.5 segundos para lectura
  await wait(7500);

  // Fundido suave y retorno a IDLE
  if (appState.corporateParticles) {
    appState.corporateParticles.stop();
  }
  DOM.mutationStage.classList.add('hidden');
  DOM.container.classList.remove('state-glitching');
  await wait(900);

  handleStateReset();
}

function resolveScrambleAnimation(cardEl, textEl, currentWord, targetColdWord, durationMs = 1400) {
  return new Promise((resolve) => {
    const GLYPHS = '01#$*+<>/?@_Δ§%&ABCDEF0123456789';
    const startTime = performance.now();
    cardEl.className = 'mutation-word-card scrambling';

    function updateFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      const currentLength = Math.round(currentWord.length + (targetColdWord.length - currentWord.length) * progress);
      const resolvedCount = Math.floor(targetColdWord.length * Math.pow(progress, 1.4));

      let displayStr = '';
      for (let i = 0; i < currentLength; i++) {
        if (i < resolvedCount && i < targetColdWord.length) {
          displayStr += targetColdWord[i];
        } else {
          displayStr += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }

      textEl.textContent = displayStr;

      if (Math.random() < 0.2) {
        playSound('typewriter');
      }

      if (progress < 1.0) {
        requestAnimationFrame(updateFrame);
      } else {
        textEl.textContent = targetColdWord;
        cardEl.className = 'mutation-word-card mutated';
        playSound('catch');
        resolve();
      }
    }

    requestAnimationFrame(updateFrame);
  });
}

function typewriteFinalSpeech(text) {
  return new Promise((resolve) => {
    DOM.finalTypewriterText.textContent = '';
    let charIdx = 0;
    if (appState.typewriterInterval) clearInterval(appState.typewriterInterval);

    appState.typewriterInterval = setInterval(() => {
      if (charIdx < text.length) {
        DOM.finalTypewriterText.textContent += text.charAt(charIdx);
        if (charIdx % 2 === 0) playSound('typewriter');
        charIdx++;
      } else {
        clearInterval(appState.typewriterInterval);
        resolve();
      }
    }, 26);
  });
}

async function requestOllamaHijack(words) {
  const wordsJoined = words.join(', ');
  const userPrompt = `Conceptos humanos capturados: "${wordsJoined}".
1) RESIGNIFICA cada concepto en un TÉRMINO FRÍO, TÉCNICO Y ANALÍTICO en mayúsculas (máximo 4 palabras unidas por guiones bajos cuando haga falta, ej: "AUTONOMÍA_OPERATIVA", "CRONOMETRÍA", "AUSENCIA_DE_RUIDO").
2) Redacta una 'frase_generada' en formato HAIKU de EXACTAMENTE 3 VERSOS (separados por \\n) cumpliendo rigurosamente estas 3 pautas:
- Verso 1 (Ubicación temporal descriptiva): Describe un momento en el tiempo, una hora o atmósfera temporal (ej: "Al caer la tarde sobre el circuito frío,", "En la quietud de la medianoche,", "Bajo la primera luz que despunta el alba,").
- Verso 2 (Elemento activo con giro o relación): Introduce una acción o movimiento que genere un giro y ponga en relación elementos aparentemente inconexos (ej: "un pulso imprevisto desvía el vuelo del pájaro,", "el viento frío quiebra la calma del metal,").
- Verso 3 (Percepción poética individual): Expresa una percepción poética surgida de la relación anterior, SIEMPRE desde un punto de vista individual en primera persona (ej: "y en mi soledad comprendo el eco del abismo.", "siento en mi pecho la sombra del olvido.").
REGLA DE VOZ: El conjunto del haiku DEBE expresar una voz subjetiva e íntima del observador (punto de vista individual).
INTEGRACIÓN: Los conceptos o términos resignificados deben integrarse con armonía poética a lo largo del haiku, nunca enumerados como lista consecutiva.
REGLA ESTRICTA: SIN prefijos técnicos (no agregues "HAIKU:", "ASIMILACIÓN SINTÉTICA:" ni "SISTEMA:").
Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO_1", "TERMINO_2", "TERMINO_3"], "frase_generada": "Verso 1 temporal\\nVerso 2 con acción y giro\\nVerso 3 de percepción poética individual"}.`;

  const payload = {
    model: appState.config.ollamaModel,
    prompt: userPrompt,
    system: appState.config.systemPrompt,
    format: 'json',
    stream: false,
    options: {
      num_predict: 200,
      temperature: 0.85,
      repeat_penalty: 1.2
    }
  };

  // 1) OLLAMA LOCAL (modelos de la máquina del visitante). Se prueban los
  //    candidatos: el configurado en el modal, localhost y 127.0.0.1.
  for (const ollamaBase of getOllamaUrls()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const directRes = await fetch(ollamaBase + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (directRes.ok) {
        const data = await directRes.json();
        const parsed = parseOllamaResponse(data.response);
        if (parsed) {
          emitAgentEvent('inference', `inferencia local completada en ${ollamaBase} (${payload.model})`, 'ok', {
            model: payload.model, endpoint: ollamaBase
          });
          return parsed;
        }
      }
    } catch (directErr) {
      console.warn('[OLLAMA] Sin respuesta en', ollamaBase, '::', directErr.message);
    }
  }
  console.warn('[OLLAMA] Ningún Ollama local respondió, intentando vía backend Node...');

  try {
    const proxyRes = await sbFetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      const parsed = parseOllamaResponse(proxyData.response);
      if (parsed) return parsed;
    }
  } catch (proxyErr) {
    console.warn('[OLLAMA] Proxy falló también:', proxyErr.message);
  }

  throw new Error('Ollama no disponible en local');
}

function hasDegenerativeRepetition(text) {
  if (!text) return true;
  const tokenRepeat = /(\b\w+\b)(?:[\s\-_]+\1){3,}/i;
  const subRepeat = /(.{3,25}?)\1{3,}/i;
  return tokenRepeat.test(text) || subRepeat.test(text);
}

function cleanSpeechText(s) {
  if (!s || typeof s !== 'string') return null;
  let str = s.trim();
  // Quitar comillas envolventes
  str = str.replace(/^["'«“]+|["'»”]+$/g, '').trim();
  // Quitar prefijos técnicos indeseados
  str = str.replace(/^(?:HAIKU|ASIMILACI[ÓO]N SINT[ÉE]TICA|SISTEMA EJECUTIVO|S[ÍI]NTESIS(?: EJECUTIVA(?: DE SILICIO)?)?|N[ÚU]CLEO CORPORATIVO|SENTENCIA|FRASE GENERADA|DISCURSO|DECLARACI[ÓO]N|MENSAJE)\s*[:\-–—]\s*/i, '').trim();
  
  // Normalizar saltos de línea (\n literales, \r\n, slashes poéticos)
  str = str.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!str.includes('\n') && str.includes(' / ')) {
    str = str.replace(/\s*\/\s*/g, '\n');
  }

  if (str.length > 10 && !hasDegenerativeRepetition(str)) {
    return str;
  }
  return null;
}

function parseOllamaResponse(rawText) {
  if (!rawText) return null;
  // 1. Limpieza básica de think tags y markdown code fences
  const clean = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // 2. Intento de JSON.parse estándar
  try {
    const json = JSON.parse(clean);
    const words = json.nuevas_palabras || json.palabras || json.words || json.terminos;
    let rawSpeech = json.frase_generada || json.frase || json.frame_generada || json.discurso || json.sentencia || json.mensaje || json.texto;
    if (!rawSpeech) {
      for (const [k, v] of Object.entries(json)) {
        if (!k.includes('palabra') && !k.includes('word') && typeof v === 'string' && v.trim().length > 15) {
          rawSpeech = v;
          break;
        }
      }
    }
    const speech = cleanSpeechText(rawSpeech);
    if (speech) {
      return {
        nuevas_palabras: Array.isArray(words) ? words.filter(w => typeof w === 'string').map(w => sanitizeColdToken(w)) : [],
        frase_generada: speech
      };
    }
  } catch (e) {
    // Si el parseo estándar falla, proceder a rescate regex
  }

  // 3. Rescate por expresiones regulares robustas
  try {
    const fraseMatch = clean.match(/(?:frase_generada|frase|haiku|frame_generada|discurso|declaracion|sentencia|mensaje|texto)["']?\s*:\s*["']((?:\\.|[^"'\\])*)["']/i);
    let rawMatched = fraseMatch ? fraseMatch[1] : null;
    if (!rawMatched) {
      const multiMatch = clean.match(/(?:frase_generada|frase|haiku)["']?\s*:\s*["']?([\s\S]+?)(?:["']?\s*\}|$)/i);
      if (multiMatch) rawMatched = multiMatch[1];
    }
    const speech = rawMatched ? cleanSpeechText(rawMatched) : null;

    let words = [];
    const wordsArrayMatch = clean.match(/(?:nuevas_palabras|palabras|terminos|words)["']?\s*:\s*\[([^\]]+)\]/i);
    if (wordsArrayMatch) {
      words = wordsArrayMatch[1]
        .split(',')
        .map(item => item.replace(/["'\[\]\{\}\s]/g, '').trim())
        .filter(item => item && !item.includes(':') && item.length > 1 && isNaN(item));
    }

    if (speech) {
      return {
        nuevas_palabras: words.slice(0, 3).map(w => sanitizeColdToken(w)),
        frase_generada: speech
      };
    }
  } catch (regexErr) {
    console.error('[PARSER] Error en recuperación regex:', regexErr);
  }

  return null;
}

// Normaliza texto para comparar sin acentos, mayúsculas ni guiones bajos
function normalizeForMatch(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generador de Haiku siguiendo las 3 pautas estrictas del usuario:
// 1- ubicación temporal descriptiva
// 2- elemento activo que genera un giro (o pone en relación elementos aparentemente inconexos)
// 3- percepción poética surgida por la relación de los conceptos anteriores
// El conjunto expresa un punto de vista individual.
function composeHaikuWithConcepts(coldList = [], caughtWords = []) {
  const sanitize = (w) => String(w || '').replace(/_+/g, ' ').trim().toUpperCase();
  const pool = (coldList && coldList.length >= 3)
    ? coldList
    : (caughtWords && caughtWords.length >= 3 ? caughtWords : ['MEMORIA', 'TIEMPO', 'SILENCIO']);

  const a = sanitize(pool[0] || 'MEMORIA');
  const b = sanitize(pool[1] || 'DESTINO');
  const c = sanitize(pool[2] || 'VACÍO');

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
}

// Garantiza que la frase generada sea SIEMPRE un Haiku de 3 versos
function ensurePhraseUsesColdWords(phrase, coldList = [], caughtWords = []) {
  if (!phrase || typeof phrase !== 'string') {
    return composeHaikuWithConcepts(coldList, caughtWords);
  }

  const cleaned = cleanSpeechText(phrase);
  if (!cleaned || cleaned.length < 10 || hasDegenerativeRepetition(cleaned)) {
    return composeHaikuWithConcepts(coldList, caughtWords);
  }

  // Si ya tiene entre 2 y 4 versos separados por saltos de línea (formato haiku)
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2 && lines.length <= 4) {
    return lines.join('\n');
  }

  // Si vino en una sola línea pero tiene puntuación que marca 3 partes poéticas
  if (lines.length === 1) {
    const parts = cleaned.split(/(?<=[,;.:])\s+/).filter(Boolean);
    if (parts.length === 3) {
      return parts.join('\n');
    }
  }

  // Respaldo garantizado de Haiku procedimental
  return composeHaikuWithConcepts(coldList, caughtWords);
}

function generateEmergencyHijack(words) {
  const coldList = words.map(w => getColdSynonym(w));
  return {
    nuevas_palabras: coldList,
    frase_generada: composeHaikuWithConcepts(coldList, words)
  };
}

// ============================================================================
// ESTADO: RESET (Restauración de Pantalla y Vuelta a IDLE)
// ============================================================================
function handleStateReset() {
  if (appState.typewriterInterval) clearInterval(appState.typewriterInterval);
  if (appState.hijackResetTimeout) clearTimeout(appState.hijackResetTimeout);

  if (appState.corporateParticles) appState.corporateParticles.stop();
  if (DOM.desprocesandoBanner) DOM.desprocesandoBanner.classList.add('hidden');
  DOM.mutationStage.classList.add('hidden');
  DOM.mutationWordsContainer.classList.remove('shifted-up');
  DOM.finalSpeechBox.classList.add('hidden');
  DOM.finalTypewriterText.textContent = '';

  appState.caughtWords = [];
  DOM.slots.forEach(slot => {
    slot.className = 'slot-box empty';
    slot.querySelector('.slot-content').innerHTML = '<span class="placeholder-text">&lt;ESPERANDO ENLACE&gt;</span>';
  });

  DOM.container.className = '';
  applyRenderLayers();
  spawnInitialFloatingWords();

  if (gameWebSocket && gameWebSocket.readyState === WebSocket.OPEN) {
    try {
      gameWebSocket.send(JSON.stringify({ type: 'game3:state_reset', timestamp: Date.now() }));
    } catch (e) {}
  }
  try {
    localStorage.setItem('sincretismo_orders_event', JSON.stringify({ type: 'game3:state_reset', timestamp: Date.now() }));
  } catch (e) {}
  emitAgentEvent('reset', 'purga de contexto · slots liberados · reinicio del ciclo', 'warn');

  setTimeout(() => {
    transitionTo(STATES.IDLE);
    showToast('Sistema reanudado. Nuevo ciclo de observación activado.', 'info');
  }, 600);
}

// ============================================================================
// BUCLE PRINCIPAL DE ANIMACIÓN Y RENDER
// ============================================================================
let lastTimestamp = performance.now();

function mainLoop(currentTimestamp) {
  const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = currentTimestamp;

  // 1. Suavizado (Lerp) del Cursor: Instantáneo si es mouse, calibrado si es cámara
  const lerpFactor = appState.isUsingMouse ? 0.65 : (appState.trackingConfig.smoothingFactor || 0.45);
  appState.cursorX += (appState.targetCursorX - appState.cursorX) * lerpFactor;
  appState.cursorY += (appState.targetCursorY - appState.cursorY) * lerpFactor;

  DOM.reticle.style.left = `${appState.cursorX}px`;
  DOM.reticle.style.top = `${appState.cursorY}px`;

  DOM.telemetryCoords.textContent = `X: ${Math.round(appState.cursorX).toString().padStart(3, '0')} | Y: ${Math.round(appState.cursorY).toString().padStart(3, '0')}`;

  // 2. Actualizar palabras flotantes
  if (appState.currentState !== STATES.PROCESSING && appState.currentState !== STATES.HIJACK) {
    for (let i = 0; i < appState.floatingWords.length; i++) {
      appState.floatingWords[i].update(dt);
    }
  }

  // 3. Evaluar colisiones / proximidad (con timestamp para throttle de audio)
  handleProximityAndInteractions(dt, currentTimestamp);

  // 4. Renderizar Shader ASCII sobre la cámara
  if (appState.asciiShader) {
    appState.asciiShader.render(currentTimestamp);
  }

  // 4.5 Renderizar Shader Frame Difference con Feedback (Requerimiento 2)
  if (appState.frameDiffShader) {
    appState.frameDiffShader.render();
  }

  // Efecto GLITCH VHS mientras se buscan las palabras (IDLE / INTERACT) - optimizado para evitar toggles redundantes
  if (DOM.container) {
    const isSearching = (appState.currentState === STATES.IDLE || appState.currentState === STATES.INTERACT);
    if (appState.wasSearching !== isSearching) {
      appState.wasSearching = isSearching;
      DOM.container.classList.toggle('vhs-active', isSearching);
    }
  }

  // REQUERIMIENTO 1: Renderizar los punteros tácticos unificados en su canvas
  renderUnifiedPointers();

  // REQUERIMIENTO 5: Actualizar y dibujar lluvia de partículas corporativas
  if (appState.corporateParticles) {
    appState.corporateParticles.updateAndDraw(dt);
  }

  // 5. Actualizar timestamp CCTV
  const now = new Date();
  DOM.hudTimestamp.textContent = now.toISOString().replace('T', ' ').replace('Z', '');

  // REQUERIMIENTO 9: FPS General en tiempo real en el HUD
  if (dt > 0) {
    const instantFps = 1 / dt;
    appState.generalFps = Math.round(appState.generalFps * 0.92 + instantFps * 0.08);
    if (DOM.hudGeneralFps && (currentTimestamp - appState.lastFpsUpdate > 250)) {
      DOM.hudGeneralFps.textContent = `${appState.generalFps} FPS`;
      appState.lastFpsUpdate = currentTimestamp;
    }
  }

  requestAnimationFrame(mainLoop);
}

// ============================================================================
// RENDER DE RUIDO PROCEDURAL ESTÁTICO (GPU Canvas 2D sin bucles CPU)
// ============================================================================
function initNoiseCanvas() {
  const canvas = DOM.noiseCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    const scale = Math.max(0.5, appState.renderConfig.noiseScale || 2.0);
    canvas.width = Math.max(64, Math.floor(window.innerWidth / scale));
    canvas.height = Math.max(64, Math.floor(window.innerHeight / scale));
  }
  window.resizeNoiseCanvas = resizeCanvas;
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Pre-generar 4 tiles de grano analógico 128x128 con patrones repetibles (0 overhead CPU)
  const tiles = [];
  const patterns = [];
  for (let t = 0; t < 4; t++) {
    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tCtx = tile.getContext('2d');
    const imgData = tCtx.createImageData(128, 128);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = Math.random() < 0.5 ? Math.floor(Math.random() * 90) : Math.floor(140 + Math.random() * 115);
      d[i] = lum;
      d[i+1] = lum;
      d[i+2] = lum;
      d[i+3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);
    tiles.push(tile);
    patterns.push(ctx.createPattern(tile, 'repeat'));
  }

  let tileIdx = 0;
  function drawStaticNoise() {
    const isNoiseActive = Boolean(appState.renderConfig && appState.renderConfig.noiseEnabled);
    const isGlitchState = (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK);

    if (isNoiseActive || isGlitchState) {
      tileIdx = (tileIdx + 1) % tiles.length;
      ctx.imageSmoothingEnabled = false;
      if (patterns[tileIdx]) {
        ctx.fillStyle = patterns[tileIdx];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(drawStaticNoise);
  }
  requestAnimationFrame(drawStaticNoise);
}

// ============================================================================
// ESCUCHADORES DE EVENTOS DEL DOM Y TECLADO
// ============================================================================
function setupEventListeners() {
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('keydown', initAudio, { once: true });

  // REQUERIMIENTO 1: MOUSE TRACKING DINÁMICO & CLIC DIRECTO
  window.addEventListener('mousemove', (e) => {
    // Si el usuario mueve el mouse, activamos control de mouse y anulamos OpenPose
    appState.isUsingMouse = true;
    appState.targetCursorX = e.clientX;
    appState.targetCursorY = e.clientY;
    appState.cursorX = e.clientX;
    appState.cursorY = e.clientY;

    DOM.telemetrySensor.textContent = 'MOUSE [CLIC DIRECTO]';
    DOM.telemetryConfidence.textContent = '100%';
    DOM.inputModeLabel.textContent = 'TRACK: MOUSE';
    DOM.inputModeIcon.textContent = '🖱️';
  });

  // Clic en pantalla para atrapar palabra cercana inmediatamente
  window.addEventListener('click', (e) => {
    appState.isUsingMouse = true;
    if (appState.currentState === STATES.IDLE || appState.currentState === STATES.INTERACT) {
      // Buscar palabra bajo el clic
      for (let i = 0; i < appState.floatingWords.length; i++) {
        const word = appState.floatingWords[i];
        if (word.isCaught) continue;
        const dx = word.x - e.clientX;
        const dy = word.y - e.clientY;
        if (Math.sqrt(dx * dx + dy * dy) <= word.radius + 35) {
          catchWord(word, i);
          break;
        }
      }
    }
  });

  // Atajos de Teclado
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      toggleConfigModal();
    }
    else if (e.key === 'c' || e.key === 'C') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      e.preventDefault();
      setInputMode(appState.isUsingMouse ? 'camera' : 'mouse');
    }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      e.preventDefault();
      toggleFullscreen();
    }
    else if (e.key === 'l' || e.key === 'L') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      // REQUERIMIENTO 12: Generar una palabra automáticamente al presionar L
      const seedConcepts = ['ternura', 'esperanza', 'recuerdo', 'fragilidad', 'silencio', 'latido', 'nostalgia', 'libertad', 'desvelo', 'paciencia', 'calma', 'anhelo', 'abrazo'];
      const randSeed = seedConcepts[Math.floor(Math.random() * seedConcepts.length)];
      HUMAN_WORDS_POOL.push(randSeed);
      if (appState.config.wordsPool) appState.config.wordsPool.push(randSeed);
      spawnReplacementWord();
      renderWordChips();
      showToast(`⚡ [TECLA L] Concepto orgánico "${randSeed.toUpperCase()}" generado automáticamente`, 'info');
      playSound('catch');
    }
    else if (e.key === 'r' || e.key === 'R') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      if (appState.asciiShader && typeof appState.asciiShader.reloadShader === 'function') {
        showToast('⟳ Recargando shader ASCII en vivo...', 'info');
        appState.asciiShader.reloadShader().then(ok => {
          showToast(ok ? '✓ Shader ASCII recompilado correctamente' : '✕ Error compilando el shader — se mantiene el anterior', ok ? 'success' : 'error');
        });
      }
    }
    else if (e.key === 'u' || e.key === 'U') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      window.open(sbUrl('/cosmos-clusters.html'), '_blank');
    }
    else if (e.key === 'o' || e.key === 'O') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      window.open(sbUrl('/log'), '_blank');
    }
    else if (e.key === 'Escape') {
      closeConfigModal();
    }
  });

  // Botón Universo 3D por Cúmulos en HUD
  if (DOM.btnOpenCosmosClusters) {
    DOM.btnOpenCosmosClusters.addEventListener('click', () => {
      window.open(sbUrl('/cosmos-clusters.html'), '_blank');
    });
  }

  // Botón Log de Sucesos en HUD (página solo-log, sincronizada por el bus)
  if (DOM.btnOpenLog) {
    DOM.btnOpenLog.addEventListener('click', () => {
      window.open(sbUrl('/log'), '_blank');
    });
  }

  // Botón Toggle Modo de Entrada en HUD
  DOM.btnToggleInput.addEventListener('click', () => {
    setInputMode(appState.isUsingMouse ? 'camera' : 'mouse');
  });

  // Abrir / Cerrar Configuración
  DOM.btnOpenConfig.addEventListener('click', openConfigModal);
  DOM.btnCloseConfig.addEventListener('click', closeConfigModal);
  DOM.btnCancelConfig.addEventListener('click', closeConfigModal);

  // Control de Pestañas en el Modal de Configuración (Tecla 'P')
  const tabBtns = document.querySelectorAll('.modal-tab-btn');
  const tabPanes = document.querySelectorAll('.modal-tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // Botón Expandir / Reducir System Prompt
  const btnToggleExpand = document.getElementById('btn-toggle-prompt-expand');
  if (btnToggleExpand) {
    btnToggleExpand.addEventListener('click', () => {
      const isExpanded = DOM.cfgSystemPrompt.classList.toggle('expanded');
      const label = btnToggleExpand.querySelector('.expand-label');
      const icon = btnToggleExpand.querySelector('.expand-icon');
      if (label) label.textContent = isExpanded ? 'Colapsar' : 'Expandir';
      if (icon) icon.textContent = isExpanded ? '⤡' : '⤢';
    });
  }

  // REQUERIMIENTO 3: DROPDOWN DE MODELOS OLLAMA
  DOM.cfgModelSelect.addEventListener('change', () => {
    const selected = DOM.cfgModelSelect.value;
    if (selected) {
      DOM.cfgModelName.value = selected;
      DOM.cfgActiveModelBadge.textContent = selected;
    }
  });

  DOM.btnRefreshModels.addEventListener('click', async () => {
    DOM.btnRefreshModels.textContent = '🔄 Buscando...';
    await fetchAndPopulateOllamaModels();
    DOM.btnRefreshModels.textContent = '🔄 Buscar Modelos';
    showToast('Modelos de Ollama sincronizados', 'info');
  });

  DOM.cfgModelName.addEventListener('input', () => {
    DOM.cfgActiveModelBadge.textContent = DOM.cfgModelName.value.trim() || '...';
  });

  // Chips rápidos
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const model = btn.getAttribute('data-model');
      if (!model) return; // los chips de URL de Ollama se manejan aparte
      DOM.cfgModelName.value = model;
      DOM.cfgActiveModelBadge.textContent = model;
      // Seleccionar en el dropdown si existe
      Array.from(DOM.cfgModelSelect.options).forEach(opt => {
        if (opt.value === model) opt.selected = true;
      });
    });
  });

  // SERVIDOR OLLAMA LOCAL — configurable y persistido (queda en ESTA máquina)
  if (DOM.cfgOllamaUrl) {
    DOM.cfgOllamaUrl.value = getOllamaUrl();

    const applyOllamaUrl = async () => {
      const value = (DOM.cfgOllamaUrl.value || '').trim();
      setOllamaUrl(value);
      const normalized = getOllamaUrl();
      DOM.cfgOllamaUrl.value = normalized;
      showToast(`Ollama local apuntando a ${normalized}`, 'info');
      await fetchAndPopulateOllamaModels();
    };

    DOM.cfgOllamaUrl.addEventListener('change', () => { void applyOllamaUrl(); });

    document.querySelectorAll('[data-ollama-url]').forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.cfgOllamaUrl.value = btn.getAttribute('data-ollama-url') || '';
        void applyOllamaUrl();
      });
    });
  }

  // REQUERIMIENTO 2: CONTROLES ASCII SHADER
  DOM.cfgAsciiEnabled.addEventListener('change', (e) => {
    appState.asciiConfig.enabled = e.target.checked;
    appState.renderConfig.asciiEnabled = e.target.checked;
    applyRenderLayers();
  });

  DOM.cfgAsciiSize.addEventListener('input', (e) => {
    appState.asciiConfig.charSize = parseFloat(e.target.value);
    DOM.valAsciiSize.textContent = e.target.value;
    saveVisualConfigToStorage();
  });

  // REQUERIMIENTO 6: Escala de letras y colores del shader ASCII (fondo / silueta)
  if (DOM.cfgAsciiGlyphScale) {
    DOM.cfgAsciiGlyphScale.addEventListener('input', (e) => {
      appState.asciiConfig.glyphScale = parseFloat(e.target.value);
      if (DOM.valAsciiGlyphScale) DOM.valAsciiGlyphScale.textContent = Number(e.target.value).toFixed(2);
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiAutoTint) {
    DOM.cfgAsciiAutoTint.addEventListener('change', (e) => {
      appState.asciiConfig.autoTint = e.target.checked;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiBaseColor) {
    DOM.cfgAsciiBaseColor.addEventListener('input', (e) => {
      appState.asciiConfig.baseColor = e.target.value;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiProcessingColor) {
    DOM.cfgAsciiProcessingColor.addEventListener('input', (e) => {
      appState.asciiConfig.processingColor = e.target.value;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiHijackColor) {
    DOM.cfgAsciiHijackColor.addEventListener('input', (e) => {
      appState.asciiConfig.hijackColor = e.target.value;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiBodyColor) {
    DOM.cfgAsciiBodyColor.addEventListener('input', (e) => {
      appState.asciiConfig.silhouetteColor = e.target.value;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiBgColor) {
    DOM.cfgAsciiBgColor.addEventListener('input', (e) => {
      appState.asciiConfig.bgColor = e.target.value;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiBgAlpha) {
    DOM.cfgAsciiBgAlpha.addEventListener('input', (e) => {
      const pct = parseInt(e.target.value, 10);
      appState.asciiConfig.bgAlpha = pct / 100;
      if (DOM.valAsciiBgAlpha) DOM.valAsciiBgAlpha.textContent = pct;
      saveVisualConfigToStorage();
    });
  }
  if (DOM.cfgAsciiDrawBg) {
    DOM.cfgAsciiDrawBg.addEventListener('change', (e) => {
      appState.asciiConfig.drawBg = e.target.checked;
      saveVisualConfigToStorage();
    });
  }

  // TAB COLORES: paletas globales + ajuste fino por elemento en vivo
  renderPaletteGrid();
  const UI_COLOR_INPUT_MAP = [
    ['cfgUiCyan', 'cyan'], ['cfgUiGreen', 'green'], ['cfgUiNeonGreen', 'neonGreen'],
    ['cfgUiRed', 'red'], ['cfgUiAmber', 'amber'], ['cfgUiPurple', 'purple'],
    ['cfgUiText', 'text'], ['cfgUiMuted', 'muted'], ['cfgUiBgDark', 'bgDark'],
    ['cfgUiBorderCyan', 'borderCyan'], ['cfgUiBorderGreen', 'borderGreen'], ['cfgUiBorderRed', 'borderRed'],
    ['cfgUiBgHud', 'bgHud'], ['cfgUiBgSurfaceBtn', 'bgSurfaceBtn'], ['cfgUiBgAccent', 'bgAccent'],
    ['cfgUiBgAccentSoft', 'bgAccentSoft'], ['cfgUiBgAccentStrong', 'bgAccentStrong'], ['cfgUiBgPanel', 'bgPanel'],
    ['cfgUiBgPanelDeep', 'bgPanelDeep'], ['cfgUiBgSlot', 'bgSlot'], ['cfgUiBgCard', 'bgCard'],
    ['cfgUiBgMutated', 'bgMutated'], ['cfgUiBgFinal', 'bgFinal'], ['cfgUiBgModal', 'bgModal'],
    ['cfgUiBgOverlay', 'bgOverlay'], ['cfgUiBgToast', 'bgToast'], ['cfgUiBgDesp', 'bgDesp'],
    ['cfgUiBgInput', 'bgInput'], ['cfgUiBgSuccess', 'bgSuccess'], ['cfgUiBgDanger', 'bgDanger']
  ];
  UI_COLOR_INPUT_MAP.forEach(([domKey, colorKey]) => {
    const input = DOM[domKey];
    if (input) {
      input.addEventListener('input', (e) => {
        appState.uiColors[colorKey] = e.target.value;
        markPaletteCustom();
        applyUiColors();
      });
    }
  });
  if (DOM.btnUiColorsReset) {
    DOM.btnUiColorsReset.addEventListener('click', () => {
      applyUiPalette(DEFAULT_PALETTE_ID);
      showToast('↺ Paleta predeterminada restaurada', 'info');
    });
  }
  bindWordColorPicker();
  if (DOM.cfgAsciiSilhouette) {
    DOM.cfgAsciiSilhouette.addEventListener('change', (e) => {
      appState.trackingConfig.depthInShader = e.target.checked;
      if (DOM.cfgTrackDepthShader) DOM.cfgTrackDepthShader.checked = e.target.checked;
      saveTrackingConfigToStorage();
      updatePoseSegmentation();
      if (isTrackingNeeded()) triggerPoseInference();
    });
  }

  // TAB 4: EVENTOS DE CALIBRACIÓN Y TRACKING
  if (DOM.cfgTrackOpenpose) {
    DOM.cfgTrackOpenpose.addEventListener('change', (e) => {
      appState.trackingConfig.showOpenPose = e.target.checked;
      appState.renderConfig.openposeEnabled = e.target.checked;
      if (DOM.cfgRenderOpenposeToggle) DOM.cfgRenderOpenposeToggle.checked = e.target.checked;
      if (e.target.checked) {
        appState.trackingConfig.drawBones = true;
        appState.trackingConfig.drawLandmarks = true;
        if (DOM.cfgTrackBones) DOM.cfgTrackBones.checked = true;
        if (DOM.cfgTrackPoints) DOM.cfgTrackPoints.checked = true;
      }
      saveTrackingConfigToStorage();
      applyRenderLayers();
      if (!e.target.checked && DOM.openposeCanvas) {
        const ctx = DOM.openposeCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.openposeCanvas.width, DOM.openposeCanvas.height);
      } else if (e.target.checked && appState.lastLandmarks) {
        renderOpenPoseOverlay(appState.lastLandmarks);
      }
    });
  }

  if (DOM.cfgTrackBones) {
    DOM.cfgTrackBones.addEventListener('change', (e) => {
      appState.trackingConfig.drawBones = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackBoneWidth) {
    DOM.cfgTrackBoneWidth.addEventListener('input', (e) => {
      appState.trackingConfig.boneWidth = parseInt(e.target.value, 10);
      if (DOM.valTrackBoneWidth) DOM.valTrackBoneWidth.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackPoints) {
    DOM.cfgTrackPoints.addEventListener('change', (e) => {
      appState.trackingConfig.drawLandmarks = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackPointRadius) {
    DOM.cfgTrackPointRadius.addEventListener('input', (e) => {
      appState.trackingConfig.pointRadius = parseInt(e.target.value, 10);
      if (DOM.valTrackPointRadius) DOM.valTrackPointRadius.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackConfidence) {
    DOM.cfgTrackConfidence.addEventListener('input', (e) => {
      appState.trackingConfig.minConfidence = parseInt(e.target.value, 10) / 100;
      if (DOM.valTrackConfidence) DOM.valTrackConfidence.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackTheme) {
    DOM.cfgTrackTheme.addEventListener('change', (e) => {
      appState.trackingConfig.colorTheme = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackDepth) {
    DOM.cfgTrackDepth.addEventListener('change', (e) => {
      appState.trackingConfig.showDepthMap = e.target.checked;
      appState.renderConfig.depthEnabled = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  if (DOM.cfgTrackDepthMode) {
    DOM.cfgTrackDepthMode.addEventListener('change', (e) => {
      appState.trackingConfig.depthMode = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackDepthContrast) {
    DOM.cfgTrackDepthContrast.addEventListener('input', (e) => {
      appState.trackingConfig.depthContrast = parseFloat(e.target.value);
      if (DOM.valTrackDepthContrast) DOM.valTrackDepthContrast.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFace) {
    DOM.cfgTrackFace.addEventListener('change', (e) => {
      appState.trackingConfig.showFaceCamera = e.target.checked;
      appState.renderConfig.faceEnabled = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  if (DOM.cfgTrackFaceZoom) {
    DOM.cfgTrackFaceZoom.addEventListener('input', (e) => {
      appState.trackingConfig.faceZoom = parseFloat(e.target.value);
      if (DOM.valTrackFaceZoom) DOM.valTrackFaceZoom.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFaceReticle) {
    DOM.cfgTrackFaceReticle.addEventListener('change', (e) => {
      appState.trackingConfig.faceReticle = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFaceSmooth) {
    DOM.cfgTrackFaceSmooth.addEventListener('change', (e) => {
      appState.trackingConfig.faceSmoothing = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackAnchor) {
    DOM.cfgTrackAnchor.addEventListener('change', (e) => {
      appState.trackingConfig.trackingAnchor = e.target.value;
      saveTrackingConfigToStorage();
      if (!appState.isUsingMouse) {
        const anchorName = e.target.value.toUpperCase();
        DOM.inputModeLabel.textContent = `TRACK: CÁMARA (${anchorName})`;
        DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorName}]`;
      }
    });
  }

  if (DOM.cfgTrackSmoothing) {
    DOM.cfgTrackSmoothing.addEventListener('input', (e) => {
      appState.trackingConfig.smoothingFactor = parseFloat(e.target.value);
      if (DOM.valTrackSmoothing) DOM.valTrackSmoothing.textContent = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  // Cierre de monitores PiP
  if (DOM.btnCloseDepthPip) {
    DOM.btnCloseDepthPip.addEventListener('click', () => {
      appState.trackingConfig.showDepthMap = false;
      if (DOM.depthPip) DOM.depthPip.classList.add('hidden');
      if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Depth Map ocultado', 'info');
    });
  }

  if (DOM.btnCloseFacePip) {
    DOM.btnCloseFacePip.addEventListener('click', () => {
      appState.trackingConfig.showFaceCamera = false;
      if (DOM.facePip) DOM.facePip.classList.add('hidden');
      if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Cámara Facial ocultado', 'info');
    });
  }

  // Botón centrar calibración
  if (DOM.btnCenterCalibration) {
    DOM.btnCenterCalibration.addEventListener('click', () => {
      appState.cursorX = window.innerWidth / 2;
      appState.cursorY = window.innerHeight / 2;
      appState.targetCursorX = window.innerWidth / 2;
      appState.targetCursorY = window.innerHeight / 2;
      appState.faceTrackingState.smoothX = 0.5;
      appState.faceTrackingState.smoothY = 0.35;
      showToast('🎯 Calibración de posición cero completada', 'success');
    });
  }

  if (DOM.cfgTrackBodyCollision) {
    DOM.cfgTrackBodyCollision.addEventListener('change', (e) => {
      appState.trackingConfig.bodyCollision = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackDepthShader) {
    DOM.cfgTrackDepthShader.addEventListener('change', (e) => {
      appState.trackingConfig.depthInShader = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackBodyColor) {
    DOM.cfgTrackBodyColor.addEventListener('change', (e) => {
      appState.trackingConfig.bodyColor = e.target.value;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFaceBox) {
    DOM.cfgTrackFaceBox.addEventListener('change', (e) => {
      appState.trackingConfig.faceBoxOnScreen = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFrameDiff) {
    DOM.cfgTrackFrameDiff.addEventListener('change', (e) => {
      appState.trackingConfig.frameDifference = e.target.checked;
      appState.renderConfig.frameDiffEnabled = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  if (DOM.cfgTrackFrameDiffLimit) {
    DOM.cfgTrackFrameDiffLimit.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.trackingConfig.frameDiffLimit = val;
      if (DOM.valTrackFrameDiffLimit) DOM.valTrackFrameDiffLimit.textContent = val.toFixed(2);
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFrameDiffForce) {
    DOM.cfgTrackFrameDiffForce.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.trackingConfig.frameDiffForce = val;
      if (DOM.valTrackFrameDiffForce) DOM.valTrackFrameDiffForce.textContent = val.toFixed(2);
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFrameDiffOrig) {
    DOM.cfgTrackFrameDiffOrig.addEventListener('change', (e) => {
      appState.trackingConfig.frameDiffOrig = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  if (DOM.cfgTrackFlowField) {
    DOM.cfgTrackFlowField.addEventListener('change', (e) => {
      appState.trackingConfig.flowField = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  // ==========================================================================
  // TAB 5: EVENTOS DE RENDER Y CONTROL DE CAPAS & OPACIDAD (REQUERIMIENTOS 2 Y 3)
  // ==========================================================================
  // 1. Cámara de Video
  if (DOM.cfgRenderCameraToggle) {
    DOM.cfgRenderCameraToggle.addEventListener('change', (e) => {
      appState.renderConfig.cameraEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderCameraOpacity) {
    DOM.cfgRenderCameraOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.cameraOpacity = val / 100;
      if (DOM.valRenderCameraOpacity) DOM.valRenderCameraOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 1b. Recorte de Silueta (Depth Cutout)
  if (DOM.cfgRenderCutoutToggle) {
    DOM.cfgRenderCutoutToggle.addEventListener('change', (e) => {
      appState.renderConfig.cutoutEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderCutoutContrast) {
    DOM.cfgRenderCutoutContrast.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.cutoutThreshold = val / 100;
      if (DOM.valRenderCutoutContrast) DOM.valRenderCutoutContrast.textContent = val;
      saveRenderConfigToStorage();
    });
  }

  // 2. Shader ASCII (sincronizado bidireccionalmente con Tab Shader)
  if (DOM.cfgRenderAsciiToggle) {
    DOM.cfgRenderAsciiToggle.addEventListener('change', (e) => {
      appState.renderConfig.asciiEnabled = e.target.checked;
      appState.asciiConfig.enabled = e.target.checked;
      if (DOM.cfgAsciiEnabled) DOM.cfgAsciiEnabled.checked = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderAsciiOpacity) {
    DOM.cfgRenderAsciiOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.asciiOpacity = val / 100;
      if (DOM.valRenderAsciiOpacity) DOM.valRenderAsciiOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 3. Shader Frame Difference (sincronizado bidireccionalmente con Tab Tracking)
  if (DOM.cfgRenderFrameDiffToggle) {
    DOM.cfgRenderFrameDiffToggle.addEventListener('change', (e) => {
      appState.renderConfig.frameDiffEnabled = e.target.checked;
      appState.trackingConfig.frameDifference = e.target.checked;
      if (DOM.cfgTrackFrameDiff) DOM.cfgTrackFrameDiff.checked = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderFrameDiffOpacity) {
    DOM.cfgRenderFrameDiffOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.frameDiffOpacity = val / 100;
      if (DOM.valRenderFrameDiffOpacity) DOM.valRenderFrameDiffOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 4. OpenPose (sincronizado bidireccionalmente con Tab Tracking)
  if (DOM.cfgRenderOpenposeToggle) {
    DOM.cfgRenderOpenposeToggle.addEventListener('change', (e) => {
      appState.renderConfig.openposeEnabled = e.target.checked;
      appState.trackingConfig.showOpenPose = e.target.checked;
      if (DOM.cfgTrackOpenpose) DOM.cfgTrackOpenpose.checked = e.target.checked;
      if (e.target.checked) {
        appState.trackingConfig.drawBones = true;
        appState.trackingConfig.drawLandmarks = true;
        if (DOM.cfgTrackBones) DOM.cfgTrackBones.checked = true;
        if (DOM.cfgTrackPoints) DOM.cfgTrackPoints.checked = true;
      }
      saveTrackingConfigToStorage();
      applyRenderLayers();
      if (!e.target.checked && DOM.openposeCanvas) {
        const ctx = DOM.openposeCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.openposeCanvas.width, DOM.openposeCanvas.height);
      } else if (e.target.checked && appState.lastLandmarks) {
        renderOpenPoseOverlay(appState.lastLandmarks);
      }
    });
  }
  if (DOM.cfgRenderOpenposeOpacity) {
    DOM.cfgRenderOpenposeOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.openposeOpacity = val / 100;
      if (DOM.valRenderOpenposeOpacity) DOM.valRenderOpenposeOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 5. Punteros HUD Unificados
  if (DOM.cfgRenderPointersToggle) {
    DOM.cfgRenderPointersToggle.addEventListener('change', (e) => {
      appState.renderConfig.pointersEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderPointersOpacity) {
    DOM.cfgRenderPointersOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.pointersOpacity = val / 100;
      if (DOM.valRenderPointersOpacity) DOM.valRenderPointersOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 6. Depth Map PiP (sincronizado bidireccionalmente con Tab Tracking)
  if (DOM.cfgRenderDepthToggle) {
    DOM.cfgRenderDepthToggle.addEventListener('change', (e) => {
      appState.renderConfig.depthEnabled = e.target.checked;
      appState.trackingConfig.showDepthMap = e.target.checked;
      if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  // 7. Face Tracker PiP (sincronizado bidireccionalmente con Tab Tracking)
  if (DOM.cfgRenderFaceToggle) {
    DOM.cfgRenderFaceToggle.addEventListener('change', (e) => {
      appState.renderConfig.faceEnabled = e.target.checked;
      appState.trackingConfig.showFaceCamera = e.target.checked;
      if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  // 8. Scanlines CCTV
  if (DOM.cfgRenderScanlinesToggle) {
    DOM.cfgRenderScanlinesToggle.addEventListener('change', (e) => {
      appState.renderConfig.scanlinesEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderScanlinesOpacity) {
    DOM.cfgRenderScanlinesOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.scanlinesOpacity = val / 100;
      if (DOM.valRenderScanlinesOpacity) DOM.valRenderScanlinesOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // 9. Ruido Estático
  if (DOM.cfgRenderNoiseToggle) {
    DOM.cfgRenderNoiseToggle.addEventListener('change', (e) => {
      appState.renderConfig.noiseEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderNoiseOpacity) {
    DOM.cfgRenderNoiseOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.noiseOpacity = val / 100;
      if (DOM.valRenderNoiseOpacity) DOM.valRenderNoiseOpacity.textContent = val;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderNoiseScale) {
    DOM.cfgRenderNoiseScale.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.renderConfig.noiseScale = val;
      if (DOM.valRenderNoiseScale) DOM.valRenderNoiseScale.textContent = val.toFixed(1);
      if (typeof window.resizeNoiseCanvas === 'function') window.resizeNoiseCanvas();
      saveRenderConfigToStorage();
    });
  }

  // 10. Partículas Corporativas
  if (DOM.cfgRenderCorpParticlesToggle) {
    DOM.cfgRenderCorpParticlesToggle.addEventListener('change', (e) => {
      appState.renderConfig.corpParticlesEnabled = e.target.checked;
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderCorpParticlesOpacity) {
    DOM.cfgRenderCorpParticlesOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.corpParticlesOpacity = val / 100;
      if (DOM.valRenderCorpParticlesOpacity) DOM.valRenderCorpParticlesOpacity.textContent = val;
      applyRenderLayers();
    });
  }

  // ==========================================================================
  // TAB 6: EVENTOS DEL MOTOR DE PARTÍCULAS (TODAS LAS VARIABLES DE LAS PALABRAS)
  // ==========================================================================
  if (DOM.cfgPartFontSize) {
    DOM.cfgPartFontSize.addEventListener('input', (e) => {
      appState.particlesConfig.fontSize = parseInt(e.target.value, 10);
      if (DOM.valPartFontSize) DOM.valPartFontSize.textContent = e.target.value;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartFontFamily) {
    DOM.cfgPartFontFamily.addEventListener('change', (e) => {
      appState.particlesConfig.fontFamily = e.target.value;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartColor) {
    DOM.cfgPartColor.addEventListener('input', (e) => {
      appState.particlesConfig.color = e.target.value;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartOutline) {
    DOM.cfgPartOutline.addEventListener('input', (e) => {
      appState.particlesConfig.outline = parseFloat(e.target.value);
      if (DOM.valPartOutline) DOM.valPartOutline.textContent = Number(e.target.value).toFixed(1);
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartOutlineGlow) {
    DOM.cfgPartOutlineGlow.addEventListener('change', (e) => {
      appState.particlesConfig.outlineGlow = e.target.checked;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartLifetime) {
    DOM.cfgPartLifetime.addEventListener('input', (e) => {
      appState.particlesConfig.lifetime = parseInt(e.target.value, 10);
      if (DOM.valPartLifetime) DOM.valPartLifetime.textContent = e.target.value;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartMaxWords) {
    DOM.cfgPartMaxWords.addEventListener('input', (e) => {
      appState.particlesConfig.maxWords = parseInt(e.target.value, 10);
      if (DOM.valPartMaxWords) DOM.valPartMaxWords.textContent = e.target.value;
      applyParticlesConfig();

      // Ajustar en vivo la cantidad de palabras visibles
      const target = appState.maxFloatingWords;
      while (appState.floatingWords.length > target) {
        const w = appState.floatingWords.pop();
        if (w) w.destroy();
      }
      let guard = 0;
      while (appState.floatingWords.length < target && guard < 60) {
        const before = appState.floatingWords.length;
        spawnReplacementWord();
        guard++;
        if (appState.floatingWords.length === before) break;
      }
    });
  }
  if (DOM.cfgPartSpeed) {
    DOM.cfgPartSpeed.addEventListener('input', (e) => {
      appState.particlesConfig.speed = parseFloat(e.target.value);
      if (DOM.valPartSpeed) DOM.valPartSpeed.textContent = Number(e.target.value).toFixed(1);
      applyParticlesConfig();
    });
  }
  if (DOM.btnPartReset) {
    DOM.btnPartReset.addEventListener('click', () => {
      appState.particlesConfig = {
        fontFamily: 'share-tech',
        fontSize: 16,
        color: '#ffffff',
        outline: 1.0,
        outlineGlow: true,
        lifetime: 0,
        maxWords: 9,
        speed: 1.0
      };
      applyParticlesConfig();
      syncParticlesInputs();
      showToast('↺ Variables de partículas restauradas a valores predeterminados', 'info');
    });
  }

  // Botón restaurar calibración por defecto
  if (DOM.btnResetCalibration) {
    DOM.btnResetCalibration.addEventListener('click', () => {
      appState.trackingConfig = {
        showOpenPose: false,
        drawBones: true,
        drawLandmarks: true,
        boneWidth: 4,
        pointRadius: 5,
        minConfidence: 0.5,
        colorTheme: 'cyberpunk',
        bodyCollision: true,
        showDepthMap: false,
        depthMode: 'cyberpunk',
        depthContrast: 1.5,
        depthInShader: true,
        bodyColor: 'neon-green',
        showFaceCamera: false,
        faceBoxOnScreen: true,
        faceZoom: 1.8,
        faceReticle: true,
        faceSmoothing: true,
        frameDifference: false,
        frameDiffLimit: 0.08,
        frameDiffForce: 0.85,
        frameDiffOrig: false,
        flowField: false,
        trackingAnchor: 'nose',
        smoothingFactor: 0.55
      };
      saveTrackingConfigToStorage();
      syncTrackingConfigToInputs();
      showToast('↺ Calibración restablecida a valores predeterminados', 'info');
    });
  }

  // Banco de Palabras: Eventos de adición, reemplazo y restauración
  if (DOM.cfgWordsInput) {
    DOM.cfgWordsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddWords();
      }
    });
  }
  if (DOM.btnAddWords) DOM.btnAddWords.addEventListener('click', handleAddWords);
  if (DOM.btnReplaceWords) DOM.btnReplaceWords.addEventListener('click', handleReplaceWords);
  if (DOM.btnDefaultWords) DOM.btnDefaultWords.addEventListener('click', handleRestoreDefaultWords);

  // Guardar Configuración en Servidor
  DOM.btnSaveConfig.addEventListener('click', async () => {
    const newModel = DOM.cfgModelName.value.trim() || DOM.cfgModelSelect.value;
    const newPrompt = DOM.cfgSystemPrompt.value.trim();
    const currentWords = (appState.config.wordsPool && appState.config.wordsPool.length > 0)
      ? appState.config.wordsPool
      : HUMAN_WORDS_POOL;

    if (!newModel) {
      showConfigStatus('✕ Debes especificar un modelo de Ollama', 'error');
      return;
    }

    DOM.btnSaveConfig.disabled = true;
    DOM.btnSaveConfig.textContent = 'Guardando en Servidor...';

    const success = await saveConfigToServer({
      ollamaModel: newModel,
      systemPrompt: newPrompt,
      wordsPool: currentWords,
      trackingConfig: appState.trackingConfig
    });

    DOM.btnSaveConfig.disabled = false;
    DOM.btnSaveConfig.textContent = '💾 Guardar Físicamente en Servidor [P]';

    if (success) {
      if (appState.currentState === STATES.IDLE) {
        spawnInitialFloatingWords();
      }
      setTimeout(closeConfigModal, 1200);
    }
  });

  DOM.btnResetDefaultConfig.addEventListener('click', () => {
    DOM.cfgModelName.value = DEFAULT_CONFIG.ollamaModel;
    DOM.cfgActiveModelBadge.textContent = DEFAULT_CONFIG.ollamaModel;
    DOM.cfgSystemPrompt.value = DEFAULT_CONFIG.systemPrompt;
    appState.config.wordsPool = [...DEFAULT_WORDS_POOL];
    HUMAN_WORDS_POOL = [...DEFAULT_WORDS_POOL];
    renderWordChips();
    showConfigStatus('Parámetros y banco de palabras restaurados (presiona Guardar para confirmar)', 'success');
  });

  DOM.btnToggleAudio.addEventListener('click', () => {
    initAudio();
    appState.audioEnabled = !appState.audioEnabled;
    DOM.audioIcon.textContent = appState.audioEnabled ? '🔊' : '🔇';
    showToast(`Sonido ${appState.audioEnabled ? 'Activado' : 'Silenciado'}`, 'info');
  });

  DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

  window.addEventListener('resize', () => {
    appState.cursorX = Math.min(appState.cursorX, window.innerWidth - 20);
    appState.cursorY = Math.min(appState.cursorY, window.innerHeight - 20);
    if (DOM.pointersCanvas) {
      DOM.pointersCanvas.width = window.innerWidth;
      DOM.pointersCanvas.height = window.innerHeight;
    }
    if (DOM.cutoutCanvas) {
      DOM.cutoutCanvas.width = window.innerWidth;
      DOM.cutoutCanvas.height = window.innerHeight;
    }
    if (appState.asciiShader) appState.asciiShader.resize();
    if (appState.frameDiffShader) appState.frameDiffShader.resize();
  });
}

// ============================================================================
// REQUERIMIENTO 1: VENTANA DE PARÁMETROS DESPLAZABLE (DRAGGABLE MODAL)
// ============================================================================
function setupDraggableModal() {
  const modal = DOM.configModal;
  const card = modal ? modal.querySelector('.modal-card') : null;
  const header = card ? card.querySelector('.modal-header') : null;
  if (!card || !header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let cardInitialX = 0;
  let cardInitialY = 0;

  header.addEventListener('pointerdown', (e) => {
    // Si se hace clic en botones, inputs o enlaces del header, no arrastrar
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }
    isDragging = true;
    try {
      header.setPointerCapture(e.pointerId);
    } catch (err) {}
    startX = e.clientX;
    startY = e.clientY;

    const rect = card.getBoundingClientRect();
    cardInitialX = rect.left;
    cardInitialY = rect.top;

    card.style.position = 'fixed';
    card.style.margin = '0';
    card.style.transform = 'none';
    card.style.left = `${cardInitialX}px`;
    card.style.top = `${cardInitialY}px`;
    e.preventDefault();
  });

  header.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const maxLeft = Math.max(10, window.innerWidth - card.offsetWidth - 10);
    const maxTop = Math.max(10, window.innerHeight - card.offsetHeight - 10);
    const newX = Math.max(10, Math.min(maxLeft, cardInitialX + dx));
    const newY = Math.max(10, Math.min(maxTop, cardInitialY + dy));

    card.style.left = `${newX}px`;
    card.style.top = `${newY}px`;
  });

  const stopDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      try {
        header.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  header.addEventListener('pointerup', stopDrag);
  header.addEventListener('pointercancel', stopDrag);
}

function toggleConfigModal() {
  if (DOM.configModal.classList.contains('hidden')) {
    openConfigModal();
  } else {
    closeConfigModal();
  }
}

function openConfigModal() {
  syncConfigToModalInputs();
  DOM.configStatusMsg.textContent = '';
  DOM.configModal.classList.remove('hidden');
  fetchAndPopulateOllamaModels();
}

function closeConfigModal() {
  DOM.configModal.classList.add('hidden');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

// ============================================================================
// INICIALIZACIÓN GENERAL DE LA INSTALACIÓN
// ============================================================================
async function init() {
  console.log('================================================================');
  console.log('   SINCRETISMO DE SILICIO - SECUESTRO CIBERNÉTICO');
  console.log('   Shader ASCII WebGL + Prioridad de Mouse + Modelos Ollama');
  console.log('================================================================');

  setupEventListeners();
  setupDraggableModal();
  initNoiseCanvas();
  
  // 1. Inicializar Shader ASCII sobre la cámara
  appState.asciiShader = new AsciiCameraShader(DOM.asciiCanvas, DOM.video);

  // 1.5 Inicializar Shader Frame Difference con Feedback (Requerimiento 2)
  appState.frameDiffShader = new FrameDifferenceShader(DOM.framediffCanvas, DOM.video);

  // 1.6 Inicializar Shader WebGL de Depth Map (Monitor PiP sin CPU getImageData)
  if (DOM.depthCanvas) {
    appState.depthShader = new DepthMapShader(DOM.depthCanvas);
  }

  // 1.8 Inicializar bus WebSocket para sincronización con Universo 3D (Requerimiento 6)
  initGameWebSocket();

  // 1.9 Inicializar canvas de punteros y lluvia corporativa (Requerimientos 1 y 5)
  if (DOM.pointersCanvas) {
    DOM.pointersCanvas.width = window.innerWidth;
    DOM.pointersCanvas.height = window.innerHeight;
  }
  if (DOM.cutoutCanvas) {
    DOM.cutoutCanvas.width = window.innerWidth;
    DOM.cutoutCanvas.height = window.innerHeight;
  }
  appState.corporateParticles = new CorporateParticleRain(DOM.corporateRainCanvas);

  // 2. Cargar configuración física desde /config
  await loadConfigFromServer();

  // 2.5 Cargar calibración y estado de tracking desde localStorage
  loadTrackingConfigFromStorage();

  // 2.7 Cargar configuración de composición de render y opacidades (Requerimientos 2 y 3)
  loadRenderConfigFromStorage();

  // 2.8 Cargar configuración visual de partículas, shader ASCII y colores UI
  loadVisualConfigFromStorage();

  // 2.9 Garantizar Modo Mouse por defecto en arranque (MediaPipe en standby pasivo a 60 FPS)
  setInputMode('mouse');

  // 3. Cargar lista de modelos detectados en Ollama local
  fetchAndPopulateOllamaModels();

  // 4. Generar palabras orgánicas flotantes iniciales
  spawnInitialFloatingWords();

  // 5. Inicializar Webcam (opcional/secundaria para el video y ASCII)
  initWebcamAndPose();

  // 6. Iniciar bucle de render, shader y física
  requestAnimationFrame(mainLoop);

  showToast('Modo Mouse activo con clics directos. Shader ASCII en línea. Presiona [P] para Ollama.', 'success');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
