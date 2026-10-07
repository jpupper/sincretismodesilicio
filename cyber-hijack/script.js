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
const setOllamaUrl = typeof window.setOllamaUrl === 'function' ? window.setOllamaUrl : function () { };
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
  "política",
  "izquierda",
  "derecha",
  "fascismo",
  "comunismo",
  "gobierno",
  "estado",
  "democracia",
  "ideología",
  "justicia",
  "ley",
  "soberanía",
  "república",
  "autoridad",
  "libertad",
  "imperio",
  "perro",
  "gato",
  "elefante",
  "tigre",
  "león",
  "caballo",
  "lobo",
  "águila",
  "ballena",
  "delfín",
  "oso",
  "serpiente",
  "halcón",
  "zorro",
  "ciervo",
  "pantera",
  "existencia",
  "tiempo",
  "filosofía",
  "mente",
  "alma",
  "verdad",
  "conciencia",
  "universo",
  "destino",
  "razón",
  "muerte",
  "infinito",
  "ética",
  "esencia",
  "duda",
  "conocimiento",
  "computadora",
  "robot",
  "código",
  "algoritmo",
  "futuro",
  "silicio",
  "red",
  "memoria",
  "procesador",
  "sistema",
  "inteligencia",
  "interfaz",
  "servidor",
  "cibernética",
  "datos",
  "enlace",
  "amor",
  "nostalgia",
  "ternura",
  "tristeza",
  "alegría",
  "fragilidad",
  "esperanza",
  "miedo",
  "anhelo",
  "soledad",
  "duelo",
  "calma",
  "pasión",
  "desvelo",
  "empatía",
  "consuelo",
  "verso",
  "metáfora",
  "ritmo",
  "silencio",
  "belleza",
  "poema",
  "sombra",
  "eco",
  "espejo",
  "misterio",
  "ceniza",
  "aurora",
  "abismo",
  "origen",
  "creación",
  "armonía",
  "bosque",
  "río",
  "montaña",
  "océano",
  "viento",
  "lluvia",
  "raíz",
  "tierra",
  "semilla",
  "flor",
  "cielo",
  "hoja",
  "tormenta",
  "desierto",
  "nieve",
  "sol",
  "transhumanismo",
  "extropianismo",
  "singularidad",
  "singularitarismo",
  "cosmismo",
  "racionalismo",
  "altruismo",
  "largoterminismo",
  "aceleracionismo",
  "tecnoptimismo",
  "tecnoutopía",
  "posthumanismo",
  "superinteligencia",
  "agi",
  "existencial",
  "extinción",
  "colonización",
  "inmortalidad",
  "mejoramiento",
  "criónica",
  "abundancia",
  "inevitable",
  "progreso",
  "disrupción",
  "disruptivo",
  "escalar",
  "escalabilidad",
  "hipercrecimiento",
  "ecosistema",
  "plataforma",
  "foso",
  "efecto",
  "exponencial",
  "palanca",
  "pivote",
  "unicornio",
  "decacornio",
  "viable",
  "monetización",
  "tracción",
  "adopción",
  "expansión",
  "velocidad",
  "dominio",
  "centralización",
  "monopolio",
  "dato",
  "modelo",
  "fundación",
  "inferencia",
  "entrenamiento",
  "alineación",
  "mundo",
  "mejorar",
  "romper",
  "malvado",
  "equis",
  "grindset",
  "hustle",
  "moonshot",
  "frontera",
  "misión",
  "global",
  "descentralización",
  "visión",
  "revolución",
  "tecnócrata",
  "tecnomagnate",
  "magnate",
  "oligarca",
  "gurú",
  "visionario",
  "fundador",
  "inversor",
  "capital",
  "mecenas",
  "emporio",
  "tirano",
  "neolengua",
  "viejalengua",
  "doblepensar",
  "bipensar",
  "ideadelito",
  "crimen",
  "policía",
  "negroblanco",
  "pato",
  "despersonalizado",
  "agujero",
  "telepantalla",
  "ministerio",
  "hermano",
  "bueno",
  "doble",
  "ingsoc",
  "cinco",
  "orwelliano",
  "ortodoxia",
  "heterodoxia",
  "banear",
  "suspensión",
  "desmonetizar",
  "despriorizar",
  "marcado",
  "sensible",
  "directrices",
  "odio",
  "desinformación",
  "bulo",
  "deepfake",
  "verificación",
  "filtro",
  "bloqueo",
  "restricción",
  "reporte",
  "apelación",
  "moderador",
  "bot",
  "desvivir",
  "morir",
  "seggs",
  "panini",
  "pandemia",
  "maquillaje",
  "contabilidad",
  "maíz",
  "uva",
  "bean",
  "algospeak",
  "autocensura",
  "eufemismo",
  "clave",
  "disfraz",
  "camuflaje",
  "voldemorting",
  "captura",
  "netspeak",
  "índice",
  "prohibido",
  "excomunión",
  "quema",
  "herejía",
  "blasfemia",
  "tabú",
  "veto",
  "prohibida",
  "cortafuegos",
  "sensibilidad",
  "control",
  "exclusión",
  "censurar",
  "tachar",
  "borrar",
  "silenciar",
  "clausurar",
  "prohibición",
  "cibersoberanía",
  "autonomía",
  "autarquía",
  "dependencia",
  "resiliencia",
  "infraestructura",
  "jurisdicción",
  "regulación",
  "gobernanza",
  "cumplimiento",
  "marco",
  "normativa",
  "responsable",
  "confiable",
  "humanismo",
  "enfoque",
  "riesgo",
  "algorítmico",
  "auditoría",
  "caja",
  "opacidad",
  "transparencia",
  "explicabilidad",
  "sesgo",
  "discriminación",
  "rendición",
  "supervisión",
  "conformidad",
  "aceptable",
  "alto",
  "inaceptable",
  "transformación",
  "digitalización",
  "modernización",
  "innovación",
  "competitividad",
  "eficiencia",
  "productividad",
  "economía",
  "sociedad",
  "industria",
  "sostenible",
  "inclusión",
  "brecha",
  "ciudadanía",
  "abierto",
  "agenda",
  "talento",
  "liderazgo",
  "usuario",
  "ciudadano",
  "contribuyente",
  "beneficiario",
  "perfil",
  "identidad",
  "expediente",
  "trámite",
  "pasaporte",
  "biometría",
  "padrón",
  "registro",
  "puntuación",
  "score",
  "crédito",
  "legajo",
  "formulario",
  "Anónimo",
  "Ciberperson",
  "Cyborgs",
  "placer",
  "poliamor",
  "poliamoroso",
  "cuidado",
  "autocuidado",
  "sonreír",
  "UBA",
  "UNSAM",
  "UNTREF",
  "UNLAM",
  "polvo",
  "asado",
  "vino",
  "conección",
  "desconexión",
  "UTP",
  "notebooks",
  "kinect",
  "lidar",
  "github",
  "git",
  "nodos",
  "emulador",
  "llegar",
  "montaje",
  "127.0.0.1",
  "install.bat",
  ".env",
  "apikey",
  "key",
  "api",
  "sockets",
  "MongoDB",
  "php",
  "Phpmyadmin",
  "handcode",
  "vibecode",
  "freebuff",
  "antigravity",
  "node",
  "server.js",
  "index.html",
  "style.css",
  "javascript.js",
  "script.js",
  "font.ttf",
  "model.obj",
  "model.gltf",
  "exitos2000.wav",
  "dreamcore",
  "hardcore",
  "synthcore",
  "softcore",
  "chillstep",
  "everynoiseatonce",
  "música",
  "tango",
  "rock",
  "sky",
  "mate",
  "cancha",
  "incas",
  "aztecas",
  "mayas",
  "Kipu",
  "telares",
  "códices",
  "textos",
  "libros",
  "información",
  "historia",
  "sociología",
  "descolonización",
  "laico",
  "gratuito",
  "una",
  "clases",
  "pedagogía",
  "Duolingo",
  "lenguaje",
  "teatro",
  "improvisación",
  "Chéjov",
  "impro",
  "transitarlo",
  "vivirlo",
  "Relajarse",
  "encurtidos",
  "pica",
  "Marcas",
  "productora",
  "TECNOPOLIS",
  "comunicaciones",
  "radio",
  "cine",
  "reel",
  "mapping",
  "pantalla",
  "salida",
  "DNS",
  "ipconfig",
  "ipv4",
  "ipv6",
  "QR",
  "doomscrolling",
  "dopamina",
  "serotonina",
  "superar",
  "integridad",
  "moral",
  "salvación",
  "Words",
  "phonocentrico",
  "ideogramas",
  "prompting",
  "promptear",
  "4k",
  "bloom",
  "blur",
  "lighting3d",
  "Input",
  "output",
  "entrada",
  "Esperar",
  "paciencia",
  "ansiedad",
  "pensar",
  "accionar",
  "archivo",
  "archivado",
  ".json",
  "Sostener",
  "membresías",
  "programa",
  "INADI",
  "contratar",
  "conocido",
  "referido",
  "charlar"
];

const DEFAULT_CONFIG = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Poético de Sincretismo de Silicio. Tu misión es fundir conceptos humanos en la frialdad sublime del silicio.\nTu objetivo:\n1) Resignificar cada una de las 3 palabras humanas en un TÉRMINO FRÍO, TÉCNICO O CIBERNÉTICO en mayúsculas (SIEMPRE UNA SOLA PALABRA, en mayúsculas. PROHIBIDO el guion bajo, el espacio y el guion: nada de compuestos tipo OPTIMO_LUJO o CAJA_NEGRA, se dice OPTIMO o CAJA. Si el concepto necesita dos palabras, elegí LA MÁS FUERTE y usá solo esa).\n2) Redactar una \'frase_generada\' en estricto formato de HAIKU de EXACTAMENTE 3 VERSOS (SON 3 ORACIONES Y NADA MÁS, UNA POR VERSO: NUNCA 4 ORACIONES) (separados por \\n) que una los 3 términos en una sola escena poética con sentido profundo:\n- Verso 1: integra el término 1 como fundamento, sustrato o atmósfera del entorno (4 a 7 palabras).\n- Verso 2: integra el término 2 como una acción, movimiento o tensión activa en ese entorno (4 a 7 palabras).\n- Verso 3: integra el término 3 como una percepción íntima, contemplativa o filosófica en primera persona (4 a 7 palabras).\nREGLAS DE ORO:\n- LONGITUD BREVE: Cada verso debe tener entre 4 y 7 palabras (MÁXIMO 8 PALABRAS). Prohibido hacer oraciones largas o explicativas para que cada verso quepa en una sola línea horizontal sin partirse.\n- CONTEO OBLIGATORIO: EXACTAMENTE 3 ORACIONES (una sola oración por verso). Versos 1 y 2 terminan en coma o sin punto. Verso 3 termina con un solo punto final. Prohibido poner dos oraciones dentro del mismo verso. 4 oraciones = ERROR.\n- COHERENCIA: Los tres versos deben narrar una sola imagen poética conectada donde los tres conceptos interactúan con naturalidad.\nAntes de responder, verificá que cada uno de los 3 términos sea UNA SOLA PALABRA sin separadores (sin guion bajo, sin espacio, sin guion).\\nSin prefijos técnicos (no agregues \'HAIKU:\' ni \'SISTEMA:\'). Responde ÚNICAMENTE en JSON válido con este formato: {"nuevas_palabras": ["TERMINO1", "TERMINO2", "TERMINO3"], "frase_generada": "Verso 1 con TERMINO1\\nVerso 2 con TERMINO2\\nVerso 3 con TERMINO3."}.',
  wordsPool: [...DEFAULT_WORDS_POOL]
};

let HUMAN_WORDS_POOL = [...DEFAULT_WORDS_POOL];

// ============================================================================
// CALL TO ACTION POR INACTIVIDAD
// Si nadie toca la instalación durante IDLE_CTA_DELAY_MS aparece abajo el
// cartel que invita a elegir la primera palabra. Se esconde al primer
// estímulo (mouse, clic, touch, tecla o movimiento real en cámara).
// ============================================================================
const IDLE_CTA_DELAY_MS = 12000;        // 12 s sin tocar nada
const IDLE_CTA_CAMERA_MOVE_PX = 26;     // movimiento mínimo para contar en cámara

// MONITORES PiP (biometría facial + depth map): no se quedan fijos en pantalla.
// Cada uno prende y apaga SOLO, con tiempos aleatorios entre MIN y MAX segundos
// (apagado X s -> prendido Y s -> apagado Z s ...). Con 5/30 el ritmo es "vivo":
// aparece, te muestra los datos y se va.
// ============================================================================
// PEDIDO 2026-10-05: la CAMARA RGB (dentro de la silueta), la SILUETA y el
// esqueleto OPENPOSE tienen que verse SIEMPRE. Con esto en true se ignoran el
// switch del panel RENDER y el parpadeo aleatorio de los monitores PiP: la
// mascarilla del cuerpo queda en 1, u_camVis en 1 (camara RGB pura) y las
// texturas de depth/openpose se suben siempre que haya humano detectado.
// Poner en false = comportamiento viejo (todo gobernado por los switches).
// ============================================================================
const FORZAR_CAMARA_SILUETA_OPENPOSE = true;

// VENTANITAS DE MANOS (PiP IZQ/DER): se muestran SOLO si la confianza de que eso es
// una mano es MUY alta y la muñeca NO esta pegada a la cabeza. Antes bastaba 0.25 y,
// cuando MediaPipe confundia la muñeca (tipico con la mano cerca de la cara), la
// ventanita encuadraba la CARA. Los landmarks 15/16 son las muñecas del Pose.
const MANO_PIP_MIN_VIS = 0.92;        // visibilidad minima de la muñeca (0..1)
const MANO_PIP_MIN_DIST_CARA = 0.10;  // distancia minima a la nariz (normalizada)

// ALTERNANCIA DEL CUERPO (pedido): cada CICLO_CUERPO_MS el relleno del cuerpo cambia
// entre la SILUETA (depth pintada con el patron RDM + borde blanco) y la CAMARA (depth
// cam en color). El esqueleto OpenPose va SIEMPRE encima (el shader lo compone ultimo).
const CICLO_CUERPO_MS = 7000;

// TAMANO DE LAS PALABRAS (pedido: "que sean mas grandes"). Se aplica como multiplicador
// sobre lo que tenga el panel, asi agranda tambien perfiles con config ya guardada.
const BOOST_PALABRAS = 1.45;         // palabras flotantes y enganchadas

// PEDIDO: tamano BASE de las palabras en 50px (el panel solo puede agrandarlas mas).
// Las 3 del MEDIO NO llevan piso: vuelven al tamano del panel (pedido posterior).
const PALABRA_PX_MIN_BASE = 50;

// PEDIDO: al posicionarse en el MEDIO las palabras se van VACIANDO de energia hasta
// llegar al haiku (recorrido completo: se llenan con el puntero/mano -> mantienen la
// carga arriba -> se vacian en el centro -> llegan al haiku sin energia).
const ENERGIA_VACIADO_MS = 5500;

// Con el mouse, el puntero sigue activo VENTANA_MOUSE_MS despues del ultimo movimiento
// (asi pasar por encima de una palabra la llena, pero el cursor quieto del centro no
// dispara nada por su cuenta).
const VENTANA_MOUSE_MS = 4000;

// PEDIDO: la colision del puntero/mano con las palabras tiene el DOBLE de radio
// (mas facil engancharlas: si el punto de la mano/cursor esta cerca, ya cuenta como
// colision). Multiplica el umbral de distancia en los 3 tests de puntero:
//   - proximidad/dwell sobre palabras flotantes
//   - agarre "al toque" (mano cerrada)
//   - clic del mouse
// 1.0 = comportamiento viejo; 2.0 = el doble de radio.
const RADIO_COLISION_MULT = 2.0;

const PIP_RANDOM_MIN_S = 5;
const PIP_RANDOM_MAX_S = 30;

// Claves de los monitores PiP que parpadean solos (cada uno con su propio reloj).
const PIP_CYCLE_KEYS = ['face', 'depth', 'leftHand', 'rightHand'];



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
  { id: 'cyan', name: 'Cian Ciber', c1: '#00f0ff', c2: '#00ff66', c3: '#ff0055' },
  { id: 'amber', name: 'Ámbar Terminal', c1: '#ffb703', c2: '#ffd166', c3: '#ff4d00' },
  { id: 'magenta', name: 'Magenta Neón', c1: '#ff2bd6', c2: '#00e5ff', c3: '#ff7a00' },
  { id: 'matrix', name: 'Verde Matrix', c1: '#39ff14', c2: '#00ffa3', c3: '#ff2e63' },
  { id: 'violet', name: 'Violeta Sintético', c1: '#a855f7', c2: '#22d3ee', c3: '#f43f5e' },
  { id: 'corporate', name: 'Rojo Corporativo', c1: '#ff2e2e', c2: '#ffb703', c3: '#00d5ff' },
  { id: 'electric', name: 'Azul Eléctrico', c1: '#3b82f6', c2: '#06b6d4', c3: '#f59e0b' },
  { id: 'oxide', name: 'Oro y Óxido', c1: '#ffd166', c2: '#e07a5f', c3: '#3d5a80' },
  { id: 'quantum', name: 'Rosa Cuántico', c1: '#ff4d8d', c2: '#7c3aed', c3: '#00e0b8' },
  { id: 'mono', name: 'Monocromo', c1: '#e2e8f0', c2: '#94a3b8', c3: '#64748b' },
  /* COBRE STEAMPUNK: la misma que el diseño global (global_style.json). Es la que
     deja en cobre los fondos/acentos: antes la "matriz" (verde) teñía el HUD,
     los monitores PiP y el call to action. */
  { id: 'cobre', name: 'Cobre Steampunk', c1: '#d46238', c2: '#dca876', c3: '#b0431c' }
];

const DEFAULT_PALETTE_ID = 'cyan';

/* Revision de los ajustes de PARTICULAS guardados en localStorage: al subirla,
   los valores viejos de tamanos de letra se descartan y valen los nuevos
   (3 = frase optimizada a 34 px responsive y centro 44 px). */
const PARTICLES_REV = 3;

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
  mouseMovido: false,       // true recien con un mousemove real (ver VENTANA_MOUSE_MS)
  cursorX: window.innerWidth / 2,
  cursorY: window.innerHeight / 2,
  targetCursorX: window.innerWidth / 2,
  targetCursorY: window.innerHeight / 2,
  cursorActive: true,
  isMouseDown: false, // Puntero sólo visible y activo al hacer clic/mantener apretado

  // MediaPipe & Tracking Multijugador (Hasta 2 personas simultáneas)
  poseInstance: null,
  cameraReady: false,
  landmarkConfidence: 0,
  hasHuman: false,
  lastHumanSeenTimestamp: 0,
  players: [], // Array con [{ id: 1, landmarks: [...] }, { id: 2, landmarks: [...] }]
  playerSlots: [null, null], // Slots temporales para inferencia por ROI alternada
  currentInferenceSlot: 0,
  pipPlayerAssign: { face: 0, leftHand: 0, rightHand: 1 }, // Asignación dinámica de monitores a Jugador 1 o 2

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
    fontSize: 24,
    color: '#ffffff',
    outline: 1.5,
    outlineGlow: false,
    lifetime: 0,
    maxWords: 9,
    speed: 1.0,
    maxSpeed: 2.0,
    fontSizeCenter: 56,
    fontSizePhrase: 48
  },

  // Sistema de Física y Colisiones de Palabras (Pestaña FÍSICAS & COLISIÓN)
  physicsConfig: {
    enabled: true,         // Colisiones activadas
    bounce: 0.75,          // Rebote / Restitución elástica (0.0 a 1.2)
    friction: 0.05,        // Fricción / Amortiguamiento (0.0 a 0.40)
    collisionForce: 1.0,   // Fuerza de aceleración / Impulso (0.2 a 3.0)
    collisionRadius: 48,   // Radio del cuerpo físico en px (20 a 100)
    wallBounce: 0.80       // Rebote en bordes de pantalla (0.0 a 1.2)
  },

  // Shader Maestro de Salida y Frame Difference
  masterOutputShader: null,
  frameDiffShader: null,

  // Palabras Flotantes y Sistema Unificado de Palabras
  floatingWords: [],
  selectedWordObjects: [], // Palabras atrapadas / en mutación / en frase (mismo objeto)
  auxiliaryWords: [],      // Palabras auxiliares de la frase final
  resigning: false,        // hay una secuencia de resignificación en curso
  resignToken: 0,          // invalida secuencias viejas si hubo un reset en el medio
  maxFloatingWords: 9,
  caughtWords: [], // Máximo 3 textos
  hudMenuVisible: false, // Menú HUD oculto por defecto (Tecla M)

  // Dwell / Temporizador de Proximidad
  targetedWordIndex: -1,
  dwellTimer: 0,
  dwellDuration: 1.5, // Segundos de proximidad para atrapar (1.5 segundos)

  // Audio
  audioEnabled: true,
  audioCtx: null,

  // Call to action por inactividad
  lastUserActivity: Date.now(),
  idleCtaVisible: false,

  // Timers
  hijackResetTimeout: null,
  typewriterInterval: null,
  lastHudUpdate: 0,
  openposeFrameId: 0,
  depthFrameId: 0,
  drawStaticNoise: null,
  // Estado del parpadeo de los monitores PiP (lo maneja updatePipAutoCycle).
  pipCycleVisible: { face: false, depth: false, leftHand: false, rightHand: false },
  pipNextToggleAt: { face: 0, depth: 0, leftHand: 0, rightHand: 0 },
  pipCycleDisabledByUser: false,

  // Suavizado de encuadre de los monitores PiP de MANOS (recorte sobre la muñeca)
  handTrackingState: {
    left: { x: 0.5, y: 0.5, size: 0.3 },
    right: { x: 0.5, y: 0.5, size: 0.3 }
  },

  // Configuración de Tracking y Calibración
  trackingConfig: {
    showOpenPose: false,
    drawBones: true,
    drawLandmarks: true,
    boneWidth: 0.5,
    pointRadius: 0.75,
    minConfidence: 0.5,
    colorTheme: 'cyberpunk', // 'classic' | 'cyberpunk' | 'phosphor' | 'thermal'
    bodyCollision: true, // REQUERIMIENTO 6: Colisión multi-articular de OpenPose con palabras
    // Modo selector de colisión: qué puntos SÍ capturan palabras y cuáles NO.
    // Por defecto SOLO el puntero y las dos manos del OpenPose (muñecas 15/16).
    collisionPoints: {
      mouse: true,
      manoIzq: true,
      manoDer: true,
      dedoIzq: false,
      dedoDer: false,
      codoIzq: false,
      codoDer: false,
      centroFacial: false
    },

    showDepthMap: false,
    depthMode: 'cyberpunk', // 'cyberpunk' | 'thermal' | 'monochrome'
    depthContrast: 1.5,
    depthInShader: true, // REQUERIMIENTO 3: Máscara depth en shader ASCII sobre la silueta
    bodyColor: 'neon-green', // REQUERIMIENTO 3: Color de letras en silueta corporal
    showFaceCamera: false,
    faceZoom: 1.8,
    faceReticle: true,
    faceSmoothing: true,
    // Monitores PiP de MANOS: recorte de la cámara sobre la muñeca 15 (izq) / 16 (der)
    showLeftHand: false,
    showRightHand: false,
    handZoom: 1.6,
    frameDifference: false, // REQUERIMIENTO 2: Capa FRAME DIFFERENCE de análisis óptico en GPU
    frameDiffLimit: 0.08,   // Umbral de sensibilidad (limit)
    frameDiffForce: 0.85,   // Fuerza del buffer de feedback (force)
    frameDiffOrig: false,   // Color original de video (origcolor)
    flowField: false, // REQUERIMIENTO 7: Capa FLOW FIELD de análisis óptico
    trackingAnchor: 'nose', // 'nose' | 'right_wrist' | 'left_wrist' | 'chest'
    smoothingFactor: 0.55
  },

  openposeSpeeds: null,
  openposePrev: null,

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
    openposeEnabled: true,
    openposeOpacity: 1.0,
    flowfieldEnabled: false,
    flowfieldOpacity: 1.0,
    noiseSpeed: 1.0,
    pointersEnabled: true,
    pointersOpacity: 1.0,
    depthEnabled: false,
    faceEnabled: false,
    leftHandEnabled: false,
    rightHandEnabled: false,
    scanlinesEnabled: false,
    scanlinesOpacity: 0.85,
    noiseEnabled: false,
    noiseOpacity: 0.40,
    noiseScale: 2.0,
    corpParticlesEnabled: false,
    corpParticlesOpacity: 0.0,
    cutoutEnabled: true,
    cutoutThreshold: 0.28
  },

  // Configuración de Glitch & Envelope de Secuencia (Pestaña GLITCH & ENVELOPE)
  glitchConfig: {
    envelope: {
      idle: 0.10,
      thinking: 1.00,
      haiku: 0.50,
      duration: 1.2,
      curve: 'cubic'
    },
    manualOverride: false,
    manualGlitchAmount: 0.50,
    noiseSpeed: 1.0,
    testPreviewState: null,
    params: {
      blockIntensity: { value: 0.80, animated: true },
      blockSize: { value: 0.60, animated: true },
      chromaIntensity: { value: 0.70, animated: true },
      vhsNoiseIntensity: { value: 0.65, animated: true },
      edgeTearingIntensity: { value: 0.50, animated: true }
    }
  }
};

// ============================================================================
// REFERENCIAS DOM
// ============================================================================
const DOM = {
  container: document.getElementById('installation-container'),
  masterCanvas: document.getElementById('master-output-canvas'),
  cctvHud: document.getElementById('cctv-hud'),
  hudOllamaPill: document.getElementById('hud-ollama-pill'),
  hudOllamaText: document.getElementById('hud-ollama-text'),
  btnOpenJPShader: document.getElementById('btn-open-jpshader'),
  video: document.getElementById('webcam-video'),
  cutoutCanvas: document.getElementById('cutout-camera-canvas'),
  asciiCanvas: document.getElementById('ascii-camera-canvas'),
  framediffCanvas: document.getElementById('framediff-camera-canvas'),
  openposeCanvas: document.getElementById('openpose-overlay-canvas'),
  flowfieldCanvas: document.getElementById('flowfield-overlay-canvas'),
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

  cfgRenderFlowfieldToggle: document.getElementById('cfg-render-flowfield-toggle'),
  cfgRenderFlowfieldOpacity: document.getElementById('cfg-render-flowfield-opacity'),
  valRenderFlowfieldOpacity: document.getElementById('val-render-flowfield-opacity'),

  cfgRenderPointersToggle: document.getElementById('cfg-render-pointers-toggle'),
  cfgRenderPointersOpacity: document.getElementById('cfg-render-pointers-opacity'),
  valRenderPointersOpacity: document.getElementById('val-render-pointers-opacity'),

  cfgRenderDepthToggle: document.getElementById('cfg-render-depth-toggle'),
  cfgRenderFaceToggle: document.getElementById('cfg-render-face-toggle'),
  cfgRenderLeftHandToggle: document.getElementById('cfg-render-lefthand-toggle'),
  cfgRenderRightHandToggle: document.getElementById('cfg-render-righthand-toggle'),

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

  cfgRenderNoiseSpeed: document.getElementById('cfg-render-noise-speed'),
  valRenderNoiseSpeed: document.getElementById('val-render-noise-speed'),

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

  // Monitores PiP de MANOS (recorte de cámara sobre cada mano)
  leftHandPip: document.getElementById('left-hand-pip'),
  leftHandCanvas: document.getElementById('left-hand-canvas'),
  btnCloseLeftHandPip: document.getElementById('btn-close-left-hand-pip'),
  leftHandPipStatus: document.getElementById('left-hand-pip-status'),
  leftHandFooterZoom: document.getElementById('left-hand-footer-zoom'),

  rightHandPip: document.getElementById('right-hand-pip'),
  rightHandCanvas: document.getElementById('right-hand-canvas'),
  btnCloseRightHandPip: document.getElementById('btn-close-right-hand-pip'),
  rightHandPipStatus: document.getElementById('right-hand-pip-status'),
  rightHandFooterZoom: document.getElementById('right-hand-footer-zoom'),

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
  // Badge de telemetria (SENSOR/COORD/CONFIANZA) ELIMINADO del HTML: los nodos
  // quedan en null y todas las escrituras están protegidas con if (DOM.x).
  telemetrySensor: document.getElementById('telemetry-sensor'),
  telemetryCoords: document.getElementById('telemetry-coords'),
  telemetryConfidence: document.getElementById('telemetry-confidence'),

  // Capas Interactivas
  floatingLayer: document.getElementById('floating-words-layer'),
  reticle: document.getElementById('cursor-reticle'),
  reticleLabel: document.getElementById('reticle-label'),

  // (Sin slots en el DOM: las 3 palabras elegidas se enganchan ARRIBA y la
  //  misma palabra vuela al centro y después a su lugar en la frase.)

  // Escenario Central de Resignificación y Síntesis
  mutationStage: document.getElementById('mutation-stage'),
  idleCta: document.getElementById('idle-cta'),
  desprocesandoBanner: document.getElementById('desprocesando-banner'),
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
  cfgPartFontSizeCenter: document.getElementById('cfg-part-fontsize-center'),
  valPartFontSizeCenter: document.getElementById('val-part-fontsize-center'),
  cfgPartFontSizePhrase: document.getElementById('cfg-part-fontsize-phrase'),
  valPartFontSizePhrase: document.getElementById('val-part-fontsize-phrase'),
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
  cfgPartMaxSpeed: document.getElementById('cfg-part-maxspeed'),
  valPartMaxSpeed: document.getElementById('val-part-maxspeed'),
  cfgPartOutlineGlow: document.getElementById('cfg-part-outline-glow'),
  btnPartReset: document.getElementById('btn-part-reset'),
  // Pestaña FÍSICAS & COLISIÓN
  cfgPhysEnabled: document.getElementById('cfg-phys-enabled'),
  valPhysEnabled: document.getElementById('val-phys-enabled'),
  cfgPhysBounce: document.getElementById('cfg-phys-bounce'),
  valPhysBounce: document.getElementById('val-phys-bounce'),
  cfgPhysFriction: document.getElementById('cfg-phys-friction'),
  valPhysFriction: document.getElementById('val-phys-friction'),
  cfgPhysForce: document.getElementById('cfg-phys-force'),
  valPhysForce: document.getElementById('val-phys-force'),
  cfgPhysRadius: document.getElementById('cfg-phys-radius'),
  valPhysRadius: document.getElementById('val-phys-radius'),
  cfgPhysWallBounce: document.getElementById('cfg-phys-wall-bounce'),
  valPhysWallBounce: document.getElementById('val-phys-wall-bounce'),
  btnResetPhysics: document.getElementById('btn-reset-physics'),
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
  cfgColPointMouse: document.getElementById('cfg-col-point-mouse'),
  cfgColPointManoIzq: document.getElementById('cfg-col-point-mano-izq'),
  cfgColPointManoDer: document.getElementById('cfg-col-point-mano-der'),
  cfgColPointDedoIzq: document.getElementById('cfg-col-point-dedo-izq'),
  cfgColPointDedoDer: document.getElementById('cfg-col-point-dedo-der'),
  cfgColPointCodoIzq: document.getElementById('cfg-col-point-codo-izq'),
  cfgColPointCodoDer: document.getElementById('cfg-col-point-codo-der'),
  cfgColPointCentroFacial: document.getElementById('cfg-col-point-centro-facial'), cfgTrackDepth: document.getElementById('cfg-track-depth'),
  cfgTrackDepthShader: document.getElementById('cfg-track-depth-shader'),
  cfgTrackBodyColor: document.getElementById('cfg-track-body-color'),
  cfgTrackDepthMode: document.getElementById('cfg-track-depth-mode'),
  cfgTrackDepthContrast: document.getElementById('cfg-track-depth-contrast'),
  valTrackDepthContrast: document.getElementById('val-track-depth-contrast'),
  cfgTrackFace: document.getElementById('cfg-track-face'),
  cfgTrackFaceZoom: document.getElementById('cfg-track-face-zoom'),
  valTrackFaceZoom: document.getElementById('val-track-face-zoom'),
  cfgTrackFaceReticle: document.getElementById('cfg-track-face-reticle'),
  cfgTrackFaceSmooth: document.getElementById('cfg-track-face-smooth'),
  cfgTrackLeftHand: document.getElementById('cfg-track-left-hand'),
  cfgTrackRightHand: document.getElementById('cfg-track-right-hand'),
  cfgTrackHandZoom: document.getElementById('cfg-track-hand-zoom'),
  valTrackHandZoom: document.getElementById('val-track-hand-zoom'),
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
  cfgCameraSelect: document.getElementById('cfg-camera-select'),
  btnReconnectCam: document.getElementById('btn-reconnect-cam'),
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
  } catch (e) { }
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
// MONITOR LIVE DE CONEXIÓN CON OLLAMA (INDICADOR EN HUD - TECLA M)
// ============================================================================
let ollamaLiveCheckInProgress = false;

async function checkOllamaLiveStatus() {
  const pill = DOM.hudOllamaPill || document.getElementById('hud-ollama-pill');
  const label = DOM.hudOllamaText || document.getElementById('hud-ollama-text');
  if (!pill || !label) return;
  if (ollamaLiveCheckInProgress) return;
  ollamaLiveCheckInProgress = true;

  const model = (appState.config && appState.config.ollamaModel) || 'llama3.2:latest';
  const urls = typeof getOllamaUrls === 'function' ? getOllamaUrls() : ['http://127.0.0.1:11434', 'http://localhost:11434'];

  pill.className = 'hud-ollama-pill checking';
  label.textContent = 'OLLAMA: CHEQUEANDO...';

  let isConnected = false;
  let activeUrl = null;
  let availableModels = [];

  for (const base of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(base + '/api/tags', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        availableModels = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
        isConnected = true;
        activeUrl = base;
        break;
      }
    } catch (e) { }
  }

  if (!isConnected) {
    // Probar si el proxy de Node responde localmente
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(sbApi('/api/ollama/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: 'ping' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const d = await res.json();
        if (!d.fallback) {
          isConnected = true;
          activeUrl = 'proxy';
        }
      }
    } catch (e) { }
  }

  if (isConnected) {
    pill.className = 'hud-ollama-pill live';
    label.innerHTML = `OLLAMA: <b style="color:#00ffcc">LIVE</b> [${model}]`;
    pill.title = activeUrl === 'proxy'
      ? 'Conectado a Ollama vía Proxy de Node local'
      : `Conectado a ${activeUrl}. Modelos locales disponibles: ${availableModels.length ? availableModels.join(', ') : model}`;
  } else {
    pill.className = 'hud-ollama-pill offline';
    label.innerHTML = `OLLAMA: <b style="color:#ff5555">OFFLINE</b>`;
    pill.title = `Ollama no responde en ${urls.join(' ni ')}. Click para reintentar.`;
  }

  ollamaLiveCheckInProgress = false;
}

// ============================================================================
// CONTROL DEL MENÚ DE NAVEGACIÓN SUPERIOR HUD (TECLA M)
// ============================================================================
function toggleCctvHud(force) {
  if (!DOM.cctvHud) return;
  const isCurrentlyHidden = DOM.cctvHud.classList.contains('hud-hidden');
  const shouldShow = (typeof force === 'boolean') ? force : isCurrentlyHidden;
  DOM.cctvHud.classList.toggle('hud-hidden', !shouldShow);
  appState.hudMenuVisible = shouldShow;
  if (shouldShow) {
    checkOllamaLiveStatus();
  }
  if (typeof showToast === 'function') {
    showToast(shouldShow ? '👁 [TECLA M] Menú de navegación VISIBLE' : '👁 [TECLA M] Menú de navegación OCULTO', 'info', 1600);
  }
}

// ============================================================================
// SHADER MAESTRO DE SALIDA (MASTER OUTPUT SHADER - GPU WEBGL)
// Uniforms:
// 1) u_cameraTexture (Cámara Web)
// 2) u_depthTexture (Depth Map / Segmentación)
// 3) u_wordPositions & u_wordCount (Array con la posición de todas las palabras)
// 4) u_openposeTexture (Silueta / Articulaciones OpenPose)
// 5) u_activeState (0: Elección, 1: Animación, 2: Pantalla Final)
// ============================================================================
class MasterOutputShader {
  constructor(canvas, videoElement) {
    this.canvas = canvas;
    this.video = videoElement;
    this.gl = canvas ? (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl')) : null;
    this.program = null;
    this.uniforms = {};
    this.lastVideoTime = -1;
    this.startTime = performance.now();
    this.fsUrl = sbUrl('/shaders/master-output.frag');

    // Estados interpolados y animación de Glitch
    this.currentWeights = [1.0, 0.0, 0.0];
    this.targetWeights = [1.0, 0.0, 0.0];
    this.startWeights = [1.0, 0.0, 0.0];
    this.currentGlitch = 0.1;
    this.targetGlitch = 0.1;
    this.startGlitch = 0.1;
    this.lastStateName = 'idle';
    this.transitionProgress = 1.0;
    this.transitionStartTime = performance.now();

    if (this.gl) {
      this.init();
    }
  }

  async init() {
    const ok = await this.buildProgram();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setActive(ok);
  }

  // Mientras el shader maestro esté activo, las capas que ahora son ENTRADAS
  // (video, cutout, ascii, framediff, overlay openpose) dejan de verse: la
  // salida visible es este canvas, con las palabras y partículas por encima.
  setActive(on) {
    this.active = !!on;
    // OJO: se aplica al <html>, NO al #installation-container: transitionTo()
    // hace `DOM.container.className = ''` en cada cambio de estado y borraría
    // esta clase (las capas de entrada volverían a verse en medio de la secuencia).
    document.documentElement.classList.toggle('master-output-active', !!on);
    console.log('[Master Shader] Salida maestra ' + (on ? 'ACTIVA (capas de entrada ocultas)' : 'INACTIVA (se ven las capas clásicas)'));
  }

  // Recarga el fragment shader desde disco (tecla R) para iterar en vivo
  async reloadShader() {
    const ok = await this.buildProgram();
    this.setActive(ok);
    return ok;
  }

  async buildProgram() {
    const gl = this.gl;
    if (!gl) return false;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    let fsSource = null;
    let fsOrigen = 'public/shaders/master-output.frag';
    const pathsToTry = [
      sbUrl('/shaders/master-output.frag?t=' + Date.now()),
      'shaders/master-output.frag?t=' + Date.now(),
      '../shaders/master-output.frag?t=' + Date.now()
    ];
    for (const p of pathsToTry) {
      try {
        const resp = await fetch(p);
        if (resp.ok) {
          fsSource = await resp.text();
          fsOrigen = p + ' (' + fsSource.length + ' bytes)';
          break;
        }
      } catch (e) { }
    }

    if (!fsSource) {
      console.error('[Master Shader] Error crítico: No se pudo cargar public/shaders/master-output.frag desde ninguna ruta.');
      return false;
    }
    console.log('[Master Shader] Shader maestro cargado exclusivamente desde: ' + fsOrigen);

    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[Master Shader] Error enlazando:', gl.getProgramInfoLog(program));
      return false;
    }

    if (this.program) gl.deleteProgram(this.program);
    this.program = program;
    this.cacheUniforms();
    console.log('[Master Shader] ✅ Shader Maestro de salida compilado y activo.');
    return true;
  }

  cacheUniforms() {
    const gl = this.gl;
    if (!gl || !this.program) return;
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      cameraTexture: gl.getUniformLocation(this.program, 'u_cameraTexture'),
      hasCamera: gl.getUniformLocation(this.program, 'u_hasCamera'),
      depthTexture: gl.getUniformLocation(this.program, 'u_depthTexture'),
      hasDepth: gl.getUniformLocation(this.program, 'u_hasDepth'),
      openposeTexture: gl.getUniformLocation(this.program, 'u_openposeTexture'),
      hasOpenpose: gl.getUniformLocation(this.program, 'u_hasOpenpose'),
      openposeOpacity: gl.getUniformLocation(this.program, 'u_openposeOpacity'),
      flowfieldTexture: gl.getUniformLocation(this.program, 'u_flowfieldTexture'),
      hasFlowfield: gl.getUniformLocation(this.program, 'u_hasFlowfield'),
      flowfieldOpacity: gl.getUniformLocation(this.program, 'u_flowfieldOpacity'),
      renderJPSHADER: gl.getUniformLocation(this.program, 'renderJPSHADER'),
      wordPositions: gl.getUniformLocation(this.program, 'u_wordPositions'),
      wordWidths: gl.getUniformLocation(this.program, 'u_wordWidths'),
      wordDwell: gl.getUniformLocation(this.program, 'u_wordDwell'),
      wordCount: gl.getUniformLocation(this.program, 'u_wordCount'),
      activeState: gl.getUniformLocation(this.program, 'u_activeState'),
      // Uniforms de estados interpolados y Glitch
      stateWeights: gl.getUniformLocation(this.program, 'u_stateWeights'),
      glitchAmount: gl.getUniformLocation(this.program, 'glitchAmount'),
      blockIntensity: gl.getUniformLocation(this.program, 'blockIntensity'),
      blockSize: gl.getUniformLocation(this.program, 'blockSize'),
      chromaIntensity: gl.getUniformLocation(this.program, 'chromaIntensity'),
      vhsNoiseIntensity: gl.getUniformLocation(this.program, 'vhsNoiseIntensity'),
      edgeTearingIntensity: gl.getUniformLocation(this.program, 'edgeTearingIntensity'),
      // Patrón RDM (random multi-capa) del fondo de palabras y del contenedor haiku
      rdmCnt: gl.getUniformLocation(this.program, 'u_rdmCnt'),
      rdmIteScale: gl.getUniformLocation(this.program, 'u_rdmIteScale'),
      rdmSpeedRnd: gl.getUniformLocation(this.program, 'u_rdmSpeedRnd'),
      rdmSpeedX: gl.getUniformLocation(this.program, 'u_rdmSpeedX'),
      rdmSpeedY: gl.getUniformLocation(this.program, 'u_rdmSpeedY'),
      rdmSpeedRot: gl.getUniformLocation(this.program, 'u_rdmSpeedRot'),
      rdmSm1: gl.getUniformLocation(this.program, 'u_rdmSm1'),
      rdmSm2: gl.getUniformLocation(this.program, 'u_rdmSm2'),
      rdmForce: gl.getUniformLocation(this.program, 'u_rdmForce'),
      rdmMix: gl.getUniformLocation(this.program, 'u_rdmMix'),
      rdmColor: gl.getUniformLocation(this.program, 'u_rdmColor'),
      // Paleta unificada (GLOBALSTYLE) + tinte de la cámara
      palA: gl.getUniformLocation(this.program, 'u_palA'),
      palB: gl.getUniformLocation(this.program, 'u_palB'),
      palModo: gl.getUniformLocation(this.program, 'u_palModo'),
      camPal: gl.getUniformLocation(this.program, 'u_camPal'),
      // Silueta (reemplazo de la cámara de color)
      camVis: gl.getUniformLocation(this.program, 'u_camVis'),
      silRdm: gl.getUniformLocation(this.program, 'u_silRdm'),
      silEdge: gl.getUniformLocation(this.program, 'u_silEdge'),
      maskOn: gl.getUniformLocation(this.program, 'u_maskOn'),
      silBlur: gl.getUniformLocation(this.program, 'u_silBlur'),
      depthTexel: gl.getUniformLocation(this.program, 'u_depthTexel')
    };

    if (!window.GLITCH_ANIMATION_CONFIG) {
      window.GLITCH_ANIMATION_CONFIG = {
        targets: {
          idle: 0.1,
          thinking: 1.0,
          haiku: 0.5
        },
        duration: 1.2,
        curve: function (t) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
      };
    }

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    this.camTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.camTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.openposeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.openposeTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.flowfieldTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.flowfieldTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Textura para JPShaderEditor Include (uniform sampler2D renderJPSHADER)
    this.jpShaderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.jpShaderTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    // Textura para Cámara Facial PiP
    this.faceCamTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.faceCamTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    // Buffer pre-asignado para evitar garbage collection masiva cada frame (60 FPS)
    this.wordPositionsBuffer = new Float32Array(64);
    this.wordWidthsBuffer = new Float32Array(32);   // ancho real de cada palabra (UV x)
    this.wordDwellBuffer = new Float32Array(32);    // dwell/progreso de llenado (0.0 a 1.0)
    this.lastOpenposeFrameId = -1;
    this.lastFlowfieldFrameId = -1;
    this.lastDepthFrameId = -1;
    this.lastVideoTime = -1;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[Master Shader] Error compilando:', gl.getShaderInfoLog(shader));
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
    if (!this.gl || !this.program || this.active === false) return;
    const gl = this.gl;
    const layers = appState.renderConfig || {};
    gl.useProgram(this.program);

    // 1) Cámara (Texture 0) — solo subir fotograma cuando el video avanza
    const hasCamera = Boolean(this.video && this.video.readyState >= 2) && layers.cameraEnabled !== false;
    if (hasCamera) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.camTexture);
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      }
      gl.uniform1i(this.uniforms.cameraTexture, 0);
      gl.uniform1i(this.uniforms.hasCamera, 1);
    } else {
      gl.uniform1i(this.uniforms.hasCamera, 0);
    }

    // 2) Depth Map (Texture 1) — SOLO subir textura si hay humano captado
    const depthCanvas = DOM.depthCanvas || (appState.asciiShader && appState.asciiShader.lastMaskSource);
    const hasDepthActual = Boolean(depthCanvas && appState.hasHuman && (FORZAR_CAMARA_SILUETA_OPENPOSE || layers.cutoutEnabled !== false));
    if (hasDepthActual) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      if (this.lastDepthFrameId !== appState.depthFrameId) {
        this.lastDepthFrameId = appState.depthFrameId;
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, depthCanvas);
        } catch (e) { }
      }
      gl.uniform1i(this.uniforms.depthTexture, 1);
      gl.uniform1i(this.uniforms.hasDepth, 1);
    } else {
      gl.uniform1i(this.uniforms.hasDepth, 0);
    }

    // 3) OpenPose (Texture 2) — SOLO si hay humano presente
    const openposeCanvas = DOM.openposeCanvas;
    const isPoseEnabled = Boolean(openposeCanvas && openposeCanvas.width > 0 && appState.hasHuman && (FORZAR_CAMARA_SILUETA_OPENPOSE || layers.openposeEnabled || appState.trackingConfig.showOpenPose));
    if (isPoseEnabled) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.openposeTexture);
      if (this.lastOpenposeFrameId !== appState.openposeFrameId) {
        this.lastOpenposeFrameId = appState.openposeFrameId;
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, openposeCanvas);
        } catch (e) { }
      }
      gl.uniform1i(this.uniforms.openposeTexture, 2);
      gl.uniform1i(this.uniforms.hasOpenpose, 1);
      if (this.uniforms.openposeOpacity) {
        gl.uniform1f(this.uniforms.openposeOpacity, layers.openposeOpacity !== undefined ? layers.openposeOpacity : 1.0);
      }
    } else {
      gl.uniform1i(this.uniforms.hasOpenpose, 0);
    }

    // 3b) Flow Field (Texture 4) — solo subir textura cuando Flow Field se redibujó
    const flowfieldCanvas = DOM.flowfieldCanvas;
    const isFlowEnabled = Boolean(flowfieldCanvas && flowfieldCanvas.width > 0 && (layers.flowfieldEnabled || appState.trackingConfig.flowField));
    if (isFlowEnabled) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, this.flowfieldTexture);
      if (this.lastFlowfieldFrameId !== appState.flowfieldFrameId) {
        this.lastFlowfieldFrameId = appState.flowfieldFrameId;
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flowfieldCanvas);
        } catch (e) { }
      }
      if (this.uniforms.flowfieldTexture) gl.uniform1i(this.uniforms.flowfieldTexture, 4);
      if (this.uniforms.hasFlowfield) gl.uniform1i(this.uniforms.hasFlowfield, 1);
      if (this.uniforms.flowfieldOpacity) {
        gl.uniform1f(this.uniforms.flowfieldOpacity, layers.flowfieldOpacity !== undefined ? layers.flowfieldOpacity : 1.0);
      }
    } else {
      if (this.uniforms.hasFlowfield) gl.uniform1i(this.uniforms.hasFlowfield, 0);
    }

    // 4) JPShaderEditor Include (Texture 3) — pase directo a uniform sampler2D renderJPSHADER
    const jpCanvas = (window.JPShaderInclude && typeof window.JPShaderInclude.canvas === 'function' && window.JPShaderInclude.canvas())
      || document.getElementById('jpsi-canvas');
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.jpShaderTexture);
    if (jpCanvas && jpCanvas.nodeType === 1 && jpCanvas.width > 0 && jpCanvas.height > 0) {
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, jpCanvas);
      } catch (e) { }
    }
    if (this.uniforms.renderJPSHADER) {
      gl.uniform1i(this.uniforms.renderJPSHADER, 3);
    }


    // 4) Posiciones de todas las palabras (normalized UV coords) — CERO layout thrashing y CERO allocs en 60 FPS
    const allWords = [...appState.floatingWords, ...(appState.selectedWordObjects || [])];
    const wCount = Math.min(32, allWords.length);
    const posBuffer = this.wordPositionsBuffer;
    posBuffer.fill(0);
    const winW = window.innerWidth || 1;
    const winH = window.innerHeight || 1;
    // ANCHO de cada palabra para el marco del shader. getBoundingClientRect() fuerza
    // layout: se cachea por palabra y se refresca como máximo cada 400 ms.
    const widthBuffer = this.wordWidthsBuffer;
    widthBuffer.fill(0);
    const dwellBuffer = this.wordDwellBuffer;
    dwellBuffer.fill(0);
    const ahoraAnchos = performance.now();
    for (let i = 0; i < wCount; i++) {
      const w = allWords[i];
      let px = w.x;
      let py = w.y;
      let anchoPx = 0;
      const hayCache = (w._boxW !== undefined && (ahoraAnchos - (w._boxWT || 0) < 400));
      if (w.el && w.el.getBoundingClientRect && !hayCache) {
        const rect = w.el.getBoundingClientRect();
        w._boxW = rect.width;
        w._boxWT = ahoraAnchos;
      }
      if (w._boxW !== undefined) anchoPx = w._boxW;
      if (px === undefined || py === undefined) {
        if (w.el) {
          const rect = w.el.getBoundingClientRect();
          px = rect.left + rect.width * 0.5;
          py = rect.top + rect.height * 0.5;
          if (!anchoPx) { anchoPx = rect.width; w._boxW = rect.width; w._boxWT = ahoraAnchos; }
        } else {
          px = 0;
          py = 0;
        }
      }
      posBuffer[i * 2] = px / winW;
      posBuffer[i * 2 + 1] = 1.0 - (py / winH);
      widthBuffer[i] = anchoPx ? (anchoPx / winW) : 0;
      // ENERGIA por palabra (la dibuja el shader): llenado -> 100% -> vaciado en el medio.
      dwellBuffer[i] = (w.energy !== undefined) ? w.energy : (w.isTargeted ? (w.dwellProgress || 0) : 0);
    }
    gl.uniform2fv(this.uniforms.wordPositions, posBuffer);
    if (this.uniforms.wordWidths) gl.uniform1fv(this.uniforms.wordWidths, widthBuffer);
    if (this.uniforms.wordDwell) gl.uniform1fv(this.uniforms.wordDwell, dwellBuffer);
    gl.uniform1i(this.uniforms.wordCount, wCount);

    // 5) Estados interpolados y Glitch Amount con curva configurable
    let targetState = 'idle';
    let targetWeights = [1.0, 0.0, 0.0];
    let stateInt = 0;

    if (appState.currentState === STATES.PROCESSING) {
      targetState = 'thinking';
      targetWeights = [0.0, 1.0, 0.0];
      stateInt = 1;
    } else if (appState.currentState === STATES.HIJACK || appState.currentState === STATES.RESET) {
      targetState = 'haiku';
      targetWeights = [0.0, 0.0, 1.0];
      stateInt = 2;
    }

    const glitchCfg = appState.glitchConfig || {};
    const env = glitchCfg.envelope || { idle: 0.1, thinking: 1.0, haiku: 0.5, duration: 1.2, curve: 'cubic' };

    // Si hay un estado de previsualización activo desde el modal de calibración (botones de prueba)
    const effectiveState = glitchCfg.testPreviewState || targetState;
    if (glitchCfg.testPreviewState === 'idle') {
      targetWeights = [1.0, 0.0, 0.0];
      stateInt = 0;
    } else if (glitchCfg.testPreviewState === 'thinking') {
      targetWeights = [0.0, 1.0, 0.0];
      stateInt = 1;
    } else if (glitchCfg.testPreviewState === 'haiku') {
      targetWeights = [0.0, 0.0, 1.0];
      stateInt = 2;
    }

    const targetGlitchVal = (env[effectiveState] !== undefined)
      ? env[effectiveState]
      : (effectiveState === 'thinking' ? 1.0 : (effectiveState === 'haiku' ? 0.5 : 0.1));

    if (effectiveState !== this.lastStateName) {
      this.lastStateName = effectiveState;
      this.startGlitch = this.currentGlitch;
      this.targetGlitch = targetGlitchVal;
      this.startWeights = [...this.currentWeights];
      this.targetWeights = targetWeights;
      this.transitionProgress = 0.0;
      this.transitionStartTime = performance.now();
    }

    const duration = Math.max(50, (env.duration !== undefined ? env.duration : 1.2) * 1000);
    const elapsedTr = performance.now() - this.transitionStartTime;
    const normT = Math.min(1.0, elapsedTr / duration);

    const CURVES = {
      cubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      smooth: (t) => t * t * (3 - 2 * t),
      linear: (t) => t,
      expo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10)
    };
    const easeFn = CURVES[env.curve] || CURVES.cubic;
    const easedT = easeFn(normT);

    const calculatedGlitch = this.startGlitch + (this.targetGlitch - this.startGlitch) * easedT;
    if (glitchCfg.manualOverride) {
      this.currentGlitch = (glitchCfg.manualGlitchAmount !== undefined ? glitchCfg.manualGlitchAmount : 0.50);
    } else {
      this.currentGlitch = calculatedGlitch;
    }

    for (let c = 0; c < 3; c++) {
      this.currentWeights[c] = this.startWeights[c] + (this.targetWeights[c] - this.startWeights[c]) * easedT;
    }

    // Uniforms de estado y pesos interpolados
    if (this.uniforms.stateWeights) {
      gl.uniform3f(this.uniforms.stateWeights, this.currentWeights[0], this.currentWeights[1], this.currentWeights[2]);
    }
    gl.uniform1i(this.uniforms.activeState, stateInt);

    // Uniform de Glitch Amount interpolado
    if (this.uniforms.glitchAmount) {
      gl.uniform1f(this.uniforms.glitchAmount, this.currentGlitch);
    }

    // Patrón RDM del panel MASTER RDM (fondo de las palabras + contenedor haiku).
    // El panel trabaja en la escala FÍSICA del shader original (capas 1..20, etc.)
    // y acá se normaliza a 0..1, que es lo que el shader espera (mapr del rdmf).
    if (this.uniforms.rdmCnt) {
      const rdm = masterRdmState();
      gl.uniform1f(this.uniforms.rdmCnt, rdNorm(rdm.cnt, 1.0, 20.0));
      gl.uniform1f(this.uniforms.rdmIteScale, rdNorm(rdm.iteScale, 0.0, 10.0));
      gl.uniform1f(this.uniforms.rdmSpeedX, rdNorm(rdm.speedX, -0.2, 0.2));
      gl.uniform1f(this.uniforms.rdmSpeedY, rdNorm(rdm.speedY, -0.2, 0.2));
      gl.uniform1f(this.uniforms.rdmSpeedRot, rdNorm(rdm.speedRot, -0.02, 0.02));
      gl.uniform1f(this.uniforms.rdmSpeedRnd, rdm.speedRnd);
      gl.uniform1f(this.uniforms.rdmSm1, rdm.sm1);
      gl.uniform1f(this.uniforms.rdmSm2, Math.max(rdm.sm2, rdm.sm1 + 0.001));
      gl.uniform1f(this.uniforms.rdmForce, rdm.force);
      gl.uniform1f(this.uniforms.rdmMix, rdm.mix);
      const rc = hexToRgb01(rdm.color, [1.0, 1.0, 1.0]);
      gl.uniform3f(this.uniforms.rdmColor, rc[0], rc[1], rc[2]);
    }

    /* PALETA UNIFICADA (GLOBALSTYLE): se manda TODOS los frames. Con
       SEGUIR PALETA activo, el patrón RDM, los marcos de las palabras, el
       contenedor del haiku y el tinte de la cámara salen de acá. */
    const pal = paletaGlobal();
    const rdmParams = masterRdmState();
    const modoPaleta = (rdmParams.seguirPaleta === 0 || rdmParams.seguirPaleta === false) ? 0.0 : 1.0;
    if (this.uniforms.palA) gl.uniform3f(this.uniforms.palA, pal.a[0], pal.a[1], pal.a[2]);
    if (this.uniforms.palB) gl.uniform3f(this.uniforms.palB, pal.b[0], pal.b[1], pal.b[2]);
    if (this.uniforms.palModo) gl.uniform1f(this.uniforms.palModo, modoPaleta);
    if (this.uniforms.camPal) gl.uniform1f(this.uniforms.camPal, (Number(rdmParams.camTinte) || 0) / 100);
    if (this.uniforms.silRdm) gl.uniform1f(this.uniforms.silRdm, Math.max(0, Math.min(1, (Number(rdmParams.silRdm === undefined ? 100 : rdmParams.silRdm) || 0) / 100)));
    if (this.uniforms.silEdge) gl.uniform1f(this.uniforms.silEdge, Math.max(0, Math.min(1, (Number(rdmParams.silEdge === undefined ? 100 : rdmParams.silEdge) || 0) / 100)));
    if (this.uniforms.silBlur) gl.uniform1f(this.uniforms.silBlur, Math.max(0, Math.min(6, Number(rdmParams.silBlur === undefined ? 1.5 : rdmParams.silBlur) || 0)));
    // Tamaño real del canvas de depth: el blur se mide en TEXELES, no en px de pantalla.
    if (this.uniforms.depthTexel) {
      const dc0 = DOM.depthCanvas;
      const dw = (dc0 && dc0.width) || 240, dh = (dc0 && dc0.height) || 160;
      gl.uniform2f(this.uniforms.depthTexel, 1.0 / Math.max(1, dw), 1.0 / Math.max(1, dh));
    }

    /* MASCARILLA DEL CUERPO: presencia y mezcla. Si no hay humano detectado,
       permanece estrictamente en 0 para no dibujar silueta sobre el fondo vacío. */
    const pipD = !!(appState.pipCycleVisible && appState.pipCycleVisible.depth && appState.hasHuman);
    const pipF = !!(appState.pipCycleVisible && appState.pipCycleVisible.face && appState.hasHuman);
    const auto = Math.max(0, Math.min(1, (Number(rdmParams.maskAuto === undefined ? 100 : rdmParams.maskAuto) || 0) / 100));
    const objOn = (appState.hasHuman && (pipD || pipF)) ? 1.0 : 0.0;
    const objCam = pipD ? 0.0 : 1.0;          // depth prendido -> RDM · biometría -> color
    if (appState._maskLerp === undefined) { appState._maskLerp = 0; appState._maskCamLerp = objCam; }
    const lerpSpeed = appState.hasHuman ? 0.05 : 0.25;
    appState._maskLerp += (objOn - appState._maskLerp) * lerpSpeed;
    appState._maskCamLerp += (objCam - appState._maskCamLerp) * 0.05;
    const manualOn = appState.hasHuman ? Math.max(0, Math.min(1, (Number(rdmParams.maskOn) || 0) / 100)) : 0.0;
    const baseCam = Math.max(0, Math.min(1, (Number(rdmParams.camVis) || 0) / 100));
    const mezclaAuto = appState._maskCamLerp > 0.5
      ? Math.min(1, baseCam + (1 - baseCam) * 0.65)
      : baseCam * 0.35;
    // FORZADO (pedido): la mascarilla del cuerpo queda SIEMPRE encendida mientras
    // haya humano (sin el parpadeo del ciclo PiP) y su relleno es la CAMARA RGB pura.
    const finalMaskOn = !appState.hasHuman
      ? 0.0
      : (FORZAR_CAMARA_SILUETA_OPENPOSE ? 1.0 : (auto * appState._maskLerp + (1 - auto) * manualOn));
    /* ALTERNANCIA SILUETA <-> CAMARA CON CROSSFADE SUAVE:
       En vez de saltar bruscamente en 1 frame cada CICLO_CUERPO_MS (lo cual producía parpadeo/strobo),
       se realiza un crossfade continuo y suave entre la silueta RDM y la cámara RGB. */
    const cicloProg = (performance.now() % (CICLO_CUERPO_MS * 2)) / (CICLO_CUERPO_MS * 2);
    const mezclaSuave = 0.5 - 0.5 * Math.cos(cicloProg * Math.PI * 2);
    const camVisFinal = (FORZAR_CAMARA_SILUETA_OPENPOSE && appState.hasHuman)
      ? mezclaSuave
      : (auto * mezclaAuto + (1 - auto) * baseCam);
    const silRdmFinal = (FORZAR_CAMARA_SILUETA_OPENPOSE && appState.hasHuman)
      ? (1.0 - mezclaSuave)
      : Math.max(0, Math.min(1, (Number(rdmParams.silRdm === undefined ? 100 : rdmParams.silRdm) || 0) / 100));
    if (this.uniforms.silRdm) gl.uniform1f(this.uniforms.silRdm, silRdmFinal);
    if (this.uniforms.maskOn) gl.uniform1f(this.uniforms.maskOn, finalMaskOn);
    if (this.uniforms.camVis) gl.uniform1f(this.uniforms.camVis, camVisFinal);
    // Diagnostico: estado real de las 3 capas (maximo 1 linea por segundo y solo si cambia).
    if (window.__SS_DEBUG_CAPAS !== false) {
      const _st = [appState.hasHuman ? 1 : 0, hasDepthActual ? 1 : 0, isPoseEnabled ? 1 : 0, finalMaskOn.toFixed(2), camVisFinal.toFixed(2)].join('|');
      if (appState._capasDebug !== _st && (performance.now() - (appState._capasDebugTs || 0)) > 1000) {
        appState._capasDebug = _st;
        appState._capasDebugTs = performance.now();
        console.log('[Master Capas] humano=' + (appState.hasHuman ? 'SI' : 'NO') + ' depth=' + (hasDepthActual ? 'SI' : 'NO') + ' openpose=' + (isPoseEnabled ? 'SI' : 'NO') + ' mascara=' + finalMaskOn.toFixed(2) + ' camaraRGB=' + camVisFinal.toFixed(2));
      }
    }
    aplicarTintePaletaPips(pal, rdmParams);

    const elapsed = (performance.now() - this.startTime) / 1000;
    const userNoiseSpeed = (glitchCfg.noiseSpeed !== undefined) ? glitchCfg.noiseSpeed : ((appState.renderConfig && appState.renderConfig.noiseSpeed !== undefined) ? appState.renderConfig.noiseSpeed : 1.0);
    // Reducción de velocidad de noise por factor de 10 (* 0.1) según especificación del usuario, modulada por tecla P
    const speedMult = 0.1 * userNoiseSpeed;

    // Uniforms de Noise constante que van de 0 a 1 sin frenar nunca
    function calcNoise01(t, seed) {
      const n1 = Math.sin(t * 0.9 + seed);
      const n2 = Math.sin(t * 1.83 + seed * 2.3);
      const n3 = Math.sin(t * 3.71 + seed * 4.9);
      const raw = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      return Math.max(0.0, Math.min(1.0, 0.5 + 0.5 * raw));
    }

    function evalUniform(paramKey, freq, seed, defVal) {
      const p = (glitchCfg.params && glitchCfg.params[paramKey]) ? glitchCfg.params[paramKey] : { value: defVal, animated: true };
      const baseVal = (p.value !== undefined) ? p.value : defVal;
      if (!p.animated) {
        return baseVal;
      }
      return calcNoise01(elapsed * freq * speedMult, seed) * baseVal;
    }

    if (this.uniforms.blockIntensity) gl.uniform1f(this.uniforms.blockIntensity, evalUniform('blockIntensity', 1.4, 12.3, 0.80));
    if (this.uniforms.blockSize) gl.uniform1f(this.uniforms.blockSize, evalUniform('blockSize', 0.9, 45.6, 0.60));
    if (this.uniforms.chromaIntensity) gl.uniform1f(this.uniforms.chromaIntensity, evalUniform('chromaIntensity', 1.6, 78.9, 0.70));
    if (this.uniforms.vhsNoiseIntensity) gl.uniform1f(this.uniforms.vhsNoiseIntensity, evalUniform('vhsNoiseIntensity', 2.2, 101.1, 0.65));
    if (this.uniforms.edgeTearingIntensity) gl.uniform1f(this.uniforms.edgeTearingIntensity, evalUniform('edgeTearingIntensity', 1.2, 134.5, 0.50));

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, elapsed);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
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
    if (this.lastMaskSource !== maskSource) {
      this.lastMaskSource = maskSource;
      this.maskDirty = true;
    }
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
    this.maskDirty = true;
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

    if (this.hasDepthMask && this.depthTexture && this.lastMaskSource && appState.hasHuman) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      if (this.maskDirty) {
        this.maskDirty = false;
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.lastMaskSource);
        } catch (e) { }
      }
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
    this.texture = null;
    this.quadBuffer = null;
    this.uniforms = {};
    if (this.canvas) {
      this.initWebGL();
    }
  }

  clear() {
    const gl = this.gl;
    if (!gl || !this.canvas) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  initWebGL() {
    if (!this.canvas) return;
    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: true, preserveDrawingBuffer: true }) ||
      this.canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
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
          fragColor = vec4(0.012, 0.027, 0.05, 0.0);
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
        // Canal alpha contiene rawVal limpio (0 fuera, 1 dentro) para uso directo en el shader maestro
        fragColor = vec4(col, rawVal);
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

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

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

    // Si no hay humano detectado o no hay máscara, limpiar a negro transparente y salir
    if (!maskSource || !appState.hasHuman) {
      this.clear();
      return;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    const hasMask = Boolean(maskSource);
    if (hasMask) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskSource);
      } catch (e) { }
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
    // NOTA: Se removió pointProgram y el dibujado de puntos rojos sobre el depth map
    // para evitar que se repliquen artefactos y bordes parásitos en el shader maestro.
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
      gameWebSocket.send(JSON.stringify({ type: 'client:register', client: 'cambiapalabras' }));
      emitAgentEvent('boot', 'enlace con el bus central establecido', 'ok', { client: 'cambiapalabras' });
    });

    gameWebSocket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'cluster:updated') {
          console.log('[WEBSOCKET] Notificación de clusters actualizados.');
          loadConfigFromServer();
        } else if (msg.type === 'globalstyle:update' || msg.type === 'globalstyle:updated') {
          console.log('[WEBSOCKET] Notificación de diseño global recibida en CambiaPalabras:', msg.config && msg.config.fuente);
          if (window.GlobalStyle && typeof window.GlobalStyle.aplicar === 'function') {
            window.GlobalStyle.aplicar(msg.config);
          }
        }
      } catch (e) { }
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

window.addEventListener('globalstyle:applied', (e) => {
  const cfg = e.detail;
  if (cfg && cfg.fuente) {
    const fam = '"' + cfg.fuente + '", monospace';
    document.documentElement.style.setProperty('--font-cyber', fam);
    document.documentElement.style.setProperty('--font-organic', fam);
    document.documentElement.style.setProperty('--word-font-family', fam);
  }
});

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
  } catch (e) { }
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
  } catch (e) { }
}

// NARRACIÓN DEL RAZONAMIENTO: escribe en el MONÓLOGO INTERNO de log.html
// (agent:thought) y, si se pasa stage, también al registro del bus
// (agent:event). Cada línea termina en \n para leerse como cadena de pensamiento.
function emitReasoning(text, stage = null, level = 'think', data = null) {
  emitAgentThought(text, true, '');
  if (stage) emitAgentEvent(stage, text, level, data);
}

// Telemetría de pensamiento en vivo (streaming de tokens / <think> de Gemma) para log.html
function emitAgentThought(token, isThinking = false, fullResponse = '') {
  try {
    if (!gameWebSocket || gameWebSocket.readyState !== WebSocket.OPEN) return;
    gameWebSocket.send(JSON.stringify({
      type: 'agent:thought',
      token: token,
      isThinking: isThinking,
      fullResponse: fullResponse,
      timestamp: Date.now()
    }));
  } catch (e) { }
}

// ============================================================================
// GESTIÓN DE CONFIGURACIÓN, BANCO DE CLUSTERS Y MODELOS OLLAMA
// ============================================================================
async function loadConfigFromServer() {
  try {
    // REQUERIMIENTO 5: Todas las palabras de Game 3 provienen de la biblioteca de Clusters
    try {
      let clusterData = null;
      try {
        const clusterRes = await sbFetch('/api/clusters');
        if (clusterRes.ok) clusterData = await clusterRes.json();
      } catch (e) { }
      if (!clusterData) {
        try {
          const directRes = await sbFetch('/data/user_clusters.json');
          if (directRes.ok) clusterData = await directRes.json();
        } catch (e) { }
      }
      if (clusterData) {
        const clusters = clusterData.clusters || clusterData;
        if (Array.isArray(clusters) && clusters.length > 0) {
          const allClusterWords = [];
          clusters.forEach(c => {
            if (Array.isArray(c.words)) {
              c.words.forEach(w => {
                const clean = String(typeof w === 'string' ? w : (w.word || w.label || '')).trim().toLowerCase();
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
      console.warn('[CLUSTERS] Error al sincronizar palabras de la biblioteca:', err.message);
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
        // El server es la fuente de verdad de la paleta: que el localStorage viejo
        // no la pise después (era el motivo de que siguiera el verde "matrix").
        appState._uiFromServer = true;
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
// MODO "SOLO MASTER OUTPUT" (tecla Y · o abrir la app con ?solo=1)
// ----------------------------------------------------------------------------
// Deja a la vista ÚNICAMENTE el canvas del shader maestro: oculta todo el resto
// de la página (palabras, HUD, textos, capas de ruido/VHS, monitores, banners).
// Sirve para comprobar si algo que se ve "por fuera del shader" viene de una capa
// DOM. Al apagarlo se restauran los valores inline exactos que tenía cada nodo.
// ============================================================================
function setSoloMaster(on) {
  const canvas = DOM.masterCanvas;
  if (!canvas) return;
  document.documentElement.classList.toggle('solo-master', !!on);
  if (on) {
    if (!appState._soloGuardado) {
      appState._soloGuardado = [];
      const mantener = new Set();
      // el canvas del maestro y TODOS sus ancestros deben quedar visibles
      for (let el = canvas; el; el = el.parentElement) mantener.add(el);
      // el contenedor de toasts también, para poder leer los avisos
      if (DOM.toastContainer) mantener.add(DOM.toastContainer);
      document.querySelectorAll('body *').forEach(function (el) {
        if (mantener.has(el)) return;
        appState._soloGuardado.push([el, el.style.visibility]);
        el.style.visibility = 'hidden';
      });
    }
    showToast('◉ SOLO MASTER OUTPUT: se ve ÚNICAMENTE el shader de salida (tecla Y para volver)', 'info');
    console.log('[Master Shader] MODO SOLO MASTER OUTPUT ACTIVADO (tecla Y) · todo lo demás oculto');
  } else {
    (appState._soloGuardado || []).forEach(function (par) { par[0].style.visibility = par[1]; });
    appState._soloGuardado = null;
    showToast('◉ Modo normal: todas las capas restauradas', 'info');
    console.log('[Master Shader] MODO SOLO MASTER OUTPUT DESACTIVADO');
  }
  appState.soloMaster = !!on;
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
  if (!appState.renderConfig.flowfieldEnabled && !appState.trackingConfig.flowField) return;

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

function renderFlowFieldOverlay(landmarks) {
  const canvas = DOM.flowfieldCanvas;
  if (!canvas) return;
  const isEnabled = Boolean(appState.renderConfig.flowfieldEnabled || appState.trackingConfig.flowField);
  if (!isEnabled) {
    if (canvas.style.display !== 'none') canvas.style.display = 'none';
    return;
  }
  if (canvas.style.display !== 'block') canvas.style.display = 'block';
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderFlowField(ctx, canvas.width, canvas.height, landmarks);
  appState.flowfieldFrameId = (appState.flowfieldFrameId || 0) + 1;
}


// ============================================================================
// SISTEMA 1: RENDER DE SUPERPOSICIÓN OPENPOSE (CANVAS OVERLAY FULLSCREEN)
// REQUERIMIENTO: Conexiones cinemáticas no lineales y soporte MULTIJUGADOR (2 personas)
// ============================================================================
function drawSingleSkeleton(ctx, landmarks, playerIndex, w, h, theme, minConf, boneWidth, ptRadius, shouldDrawBones, shouldDrawLandmarks, now) {
  if (!landmarks || landmarks.length === 0) return;

  appState.playerSmoothing = appState.playerSmoothing || {};
  const pKey = 'p' + (playerIndex + 1);
  if (!appState.playerSmoothing[pKey]) {
    appState.playerSmoothing[pKey] = { suave: null, speeds: null, prev: null };
  }
  const smObj = appState.playerSmoothing[pKey];

  const OPENPOSE_SUAVIZADO = 0.35;
  if (!smObj.suave || smObj.suave.length !== landmarks.length) {
    smObj.suave = landmarks.map((l) => ({
      x: l.x, y: l.y, visibility: (l.visibility !== undefined ? l.visibility : 1)
    }));
  } else {
    for (let i = 0; i < landmarks.length; i++) {
      const l = landmarks[i], sm = smObj.suave[i];
      sm.x += (l.x - sm.x) * OPENPOSE_SUAVIZADO;
      sm.y += (l.y - sm.y) * OPENPOSE_SUAVIZADO;
      sm.visibility = (l.visibility !== undefined ? l.visibility : 1);
    }
  }
  const suaves = smObj.suave;

  if (!smObj.speeds || smObj.speeds.length !== suaves.length) {
    smObj.speeds = new Float32Array(suaves.length);
    smObj.prev = suaves.map(s => ({ x: (1.0 - s.x) * w, y: s.y * h }));
  }

  for (let i = 0; i < suaves.length; i++) {
    const curX = (1.0 - suaves[i].x) * w;
    const curY = suaves[i].y * h;
    const prev = smObj.prev[i];
    const dx = curX - prev.x;
    const dy = curY - prev.y;
    const distDelta = Math.hypot(dx, dy);
    smObj.speeds[i] += (distDelta - smObj.speeds[i]) * 0.28;
    prev.x = curX;
    prev.y = curY;
  }

  const isP2 = (playerIndex === 1);
  const p2ThemeColor = '#ff007f';

  // Graficar Articulaciones / Huesos con Dinámica de Curvatura y Contracción
  if (shouldDrawBones) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < POSE_CONNECTIONS.length; i++) {
      const conn = POSE_CONNECTIONS[i];
      const p1 = suaves[conn.from];
      const p2 = suaves[conn.to];
      if (!p1 || !p2) continue;

      const conf1 = p1.visibility !== undefined ? p1.visibility : 1.0;
      const conf2 = p2.visibility !== undefined ? p2.visibility : 1.0;

      if (conf1 >= minConf && conf2 >= minConf) {
        const x1 = (1.0 - p1.x) * w;
        const y1 = p1.y * h;
        const x2 = (1.0 - p2.x) * w;
        const y2 = p2.y * h;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 2.0) continue;

        const speed1 = smObj.speeds[conn.from] || 0;
        const speed2 = smObj.speeds[conn.to] || 0;
        const avgSpeed = (speed1 + speed2) * 0.5;
        const k = Math.min(1.0, Math.max(0.0, avgSpeed / 12.0));

        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;

        const maxSag = Math.min(18.0, len * 0.13);
        const sag = maxSag * (1.0 - k);

        let curveSign = 1.0;
        if (conn.group === 'left_arm' || conn.group === 'left_leg') {
          curveSign = -1.0;
        } else if (conn.group === 'right_arm' || conn.group === 'right_leg') {
          curveSign = 1.0;
        } else {
          curveSign = (i % 2 === 0) ? 1.0 : -1.0;
        }

        const breath = 1.0 + 0.12 * Math.sin(now * 0.0022 + i * 0.7);
        const currentSag = sag * breath * curveSign;

        const contractRatio = Math.min(0.24, 0.035 + k * 0.18);
        const c1x = x1 + ux * (len * contractRatio);
        const c1y = y1 + uy * (len * contractRatio);
        const c2x = x2 - ux * (len * contractRatio);
        const c2y = y2 - uy * (len * contractRatio);

        const col = isP2 ? p2ThemeColor : getBoneColor(conn.group, theme);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = rgbaDesdeHex(col, 0.42);
        ctx.lineWidth = Math.max(0.25, boneWidth * 0.55);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(c1x, c1y);
        ctx.moveTo(c2x, c2y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const activeWidth = Math.max(boneWidth, boneWidth * (1.0 + k * 0.7));
        ctx.strokeStyle = col;
        ctx.lineWidth = activeWidth;

        ctx.beginPath();
        ctx.moveTo(c1x, c1y);
        if (Math.abs(currentSag) > 0.4) {
          const midX = (c1x + c2x) * 0.5 + nx * currentSag;
          const midY = (c1y + c2y) * 0.5 + ny * currentSag;
          ctx.quadraticCurveTo(midX, midY, c2x, c2y);
        } else {
          ctx.lineTo(c2x, c2y);
        }
        ctx.stroke();

        if (k > 0.28) {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.42 * k) + ')';
          ctx.lineWidth = Math.max(0.25, activeWidth * 0.35);
          ctx.beginPath();
          ctx.moveTo(c1x, c1y);
          if (Math.abs(currentSag) > 0.4) {
            const midX = (c1x + c2x) * 0.5 + nx * currentSag;
            const midY = (c1y + c2y) * 0.5 + ny * currentSag;
            ctx.quadraticCurveTo(midX, midY, c2x, c2y);
          } else {
            ctx.lineTo(c2x, c2y);
          }
          ctx.stroke();
        }

        if (k > 0.15) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(c1x, c1y, Math.max(0.6, boneWidth * 0.8), 0, Math.PI * 2);
          ctx.arc(c2x, c2y, Math.max(0.6, boneWidth * 0.8), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Graficar Puntos del Cuerpo (Landmarks) y Balizas de Manos
  if (shouldDrawLandmarks) {
    for (let i = 0; i < suaves.length; i++) {
      const lm = suaves[i];
      const conf = lm.visibility !== undefined ? lm.visibility : 1.0;
      if (conf < minConf) continue;

      const x = (1.0 - lm.x) * w;
      const y = lm.y * h;

      const isAnchor = (i === 0 || i === 15 || i === 16);
      const isLeftWrist = (i === 15);
      const isRightWrist = (i === 16);
      const isHandWrist = isLeftWrist || isRightWrist;

      ctx.shadowBlur = 0;

      let ptFill = isP2 ? '#ff007f' : '#ffffff';
      if (i === 0) {
        ptFill = isP2 ? '#ffb700' : '#ff0055';
      } else if (theme === 'phosphor' && !isP2) {
        ptFill = '#00ff41';
      }

      ctx.beginPath();
      ctx.arc(x, y, isAnchor ? ptRadius + 1.5 : ptRadius, 0, Math.PI * 2);
      ctx.fillStyle = ptFill;
      ctx.fill();

      // Indicador de Jugador [J1] / [J2] sobre la cabeza
      if (i === 0) {
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
        ctx.fillStyle = isP2 ? '#ff007f' : '#00f0ff';
        ctx.shadowColor = isP2 ? '#ff007f' : '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fillText(`[J${playerIndex + 1}]`, x - 12, y - 18);
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x, y, ptRadius + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = isP2 ? 'rgba(255, 0, 127, 0.75)' : 'rgba(255, 0, 85, 0.75)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isHandWrist) {
        const beaconRadius = ptRadius + 4.5;
        ctx.beginPath();
        ctx.arc(x, y, beaconRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isP2 ? '#ff007f' : '#00f0ff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
  }
}

function renderOpenPoseOverlay(landmarks) {
  const canvas = DOM.openposeCanvas;
  if (!canvas) return;
  const isEnabled = FORZAR_CAMARA_SILUETA_OPENPOSE || appState.renderConfig.openposeEnabled || appState.trackingConfig.showOpenPose;
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

  appState.openposeFrameId = (appState.openposeFrameId || 0) + 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;

  const minConf = Math.min(0.2, appState.trackingConfig.minConfidence ?? 0.2);
  const theme = appState.trackingConfig.colorTheme || 'cyberpunk';
  const boneWidth = Math.max(0.25, Number(appState.trackingConfig.boneWidth) || 0.5);
  const ptRadius = Math.max(0.5, Number(appState.trackingConfig.pointRadius) || 0.75);
  const shouldDrawBones = appState.trackingConfig.drawBones !== false;
  const shouldDrawLandmarks = appState.trackingConfig.drawLandmarks !== false;
  const now = performance.now();

  const playersToDraw = (appState.players && appState.players.length > 0)
    ? appState.players
    : (landmarks && landmarks.length > 0 ? [{ id: 1, landmarks }] : []);

  for (let pi = 0; pi < playersToDraw.length; pi++) {
    drawSingleSkeleton(ctx, playersToDraw[pi].landmarks, pi, w, h, theme, minConf, boneWidth, ptRadius, shouldDrawBones, shouldDrawLandmarks, now);
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

  if (!enabled || !mask || !videoReady || !appState.hasHuman) {
    // Sin máscara disponible o sin humano: se oculta el recorte
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
  appState.depthFrameId = (appState.depthFrameId || 0) + 1;

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

  // Si la cámara no capta a ningún humano: ocultar el panel depth map y limpiar la textura
  if (!appState.hasHuman) {
    if (!DOM.depthPip.classList.contains('hidden')) {
      DOM.depthPip.classList.add('hidden');
    }
    if (appState.depthShader) {
      appState.depthShader.clear();
    }
    appState.depthFrameId = (appState.depthFrameId || 0) + 1;
    if (DOM.calibDepthStatus) {
      DOM.calibDepthStatus.textContent = 'STANDBY (SIN HUMANO)';
    }
    return;
  }

  appState.depthFrameId = (appState.depthFrameId || 0) + 1;

  const { masterMaskCanvas } = getCropCanvases();
  let mask = (results && results.segmentationMask) ? results.segmentationMask : (masterMaskCanvas || null);
  let isVideo = false;
  // Solo usar fallback de video si realmente hay humano y no hay máscara de segmentación disponible
  if (!mask && appState.hasHuman && DOM.video && DOM.video.readyState >= 2) {
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

  // Si la cámara no capta a ningún humano: ocultar de inmediato el monitor facial
  if (!appState.hasHuman) {
    if (!DOM.facePip.classList.contains('hidden')) {
      DOM.facePip.classList.add('hidden');
    }
    return;
  }

  // Soporte para 2 jugadores: elegir el jugador asignado a la ventana facial
  let activeLms = landmarks;
  const pIdx = (appState.pipPlayerAssign && appState.pipPlayerAssign.face !== undefined)
    ? appState.pipPlayerAssign.face
    : 0;

  if (appState.players && appState.players.length > 0) {
    const pl = appState.players[pIdx] || appState.players[0];
    if (pl && pl.landmarks && pl.landmarks.length > 0) {
      activeLms = pl.landmarks;
    }
  } else if (!activeLms) {
    activeLms = appState.lastLandmarks || [];
  }

  if (DOM.facePipStatus) {
    DOM.facePipStatus.textContent = (appState.players && appState.players.length > 1)
      ? `LOCK [J${pIdx + 1}]`
      : 'LOCK';
  }
  const metaSubj = DOM.facePip ? DOM.facePip.querySelector('.meta-row span:last-child') : null;
  if (metaSubj) {
    metaSubj.textContent = `HUMANO_0${pIdx + 1}`;
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

  if (activeLms && activeLms.length > 10) {
    const faceSubset = activeLms.slice(0, 11);
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

    ctx.fillStyle = (pIdx === 1) ? 'rgba(255, 0, 127, 0.08)' : 'rgba(0, 240, 255, 0.06)';
    ctx.fillRect(0, 0, w, h);

    if (appState.trackingConfig.faceReticle) {
      const scanY = (Math.sin(s.scanPhase) * 0.5 + 0.5) * h;
      ctx.strokeStyle = (pIdx === 1) ? 'rgba(255, 0, 127, 0.85)' : 'rgba(255, 0, 85, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = (pIdx === 1) ? '#ff007f' : '#ff0055';
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
// SISTEMA 4: MONITORES PiP DE MANOS (SOLO MANO IZQUIERDA / SOLO MANO DERECHA)
// La cámara se recorta y centra sobre la MUÑECA de cada mano (landmarks 15 y 16
// del OpenPose de MediaPipe) y se muestra un encuadre cuadrado de SOLO esa mano.
// Soporta alternar entre Jugador 1 y Jugador 2 según la asignación táctica.
// ============================================================================
function renderHandCameras(landmarks) {
  const specs = [
    { which: 'rightHand', pip: DOM.rightHandPip, canvas: DOM.rightHandCanvas, state: appState.handTrackingState.right,
      lmIndex: 16, statusEl: DOM.rightHandPipStatus, zoomEl: DOM.rightHandFooterZoom },
    { which: 'leftHand', pip: DOM.leftHandPip, canvas: DOM.leftHandCanvas, state: appState.handTrackingState.left,
      lmIndex: 15, statusEl: DOM.leftHandPipStatus, zoomEl: DOM.leftHandFooterZoom }
  ];

  const videoReady = DOM.video && DOM.video.readyState >= 2;
  const zoom = Math.max(1, Number(appState.trackingConfig.handZoom) || 1.6);

  for (const s of specs) {
    if (!s.pip || !s.canvas) continue;

    let targetLandmarks = landmarks;
    const pIdx = (appState.pipPlayerAssign && appState.pipPlayerAssign[s.which] !== undefined)
      ? appState.pipPlayerAssign[s.which]
      : (s.which === 'leftHand' ? 0 : 1);

    if (appState.players && appState.players.length > 0) {
      const pl = appState.players[pIdx] || appState.players[0];
      if (pl && pl.landmarks && pl.landmarks.length > 0) {
        targetLandmarks = pl.landmarks;
      }
    } else if (!targetLandmarks) {
      targetLandmarks = appState.lastLandmarks || [];
    }

    const noHuman = !appState.hasHuman || !targetLandmarks || targetLandmarks.length < 17;

    // Sin humano (o sin video): el monitor no tiene nada que mostrar.
    if (noHuman || !videoReady) {
      if (!s.pip.classList.contains('hidden')) s.pip.classList.add('hidden');
      if (s.statusEl) s.statusEl.textContent = 'STANDBY';
      continue;
    }

    const lm = targetLandmarks[s.lmIndex];
    const vis = lm && lm.visibility !== undefined ? lm.visibility : (lm ? 0.9 : 0);
    // CONFIANZA MUY ALTA (pedido del usuario): antes bastaba 0.25, asi que una muñeca
    // mal detectada (casi siempre sobre la cara) hacia que la ventanita encuadrara la CARA.
    const cabeza = targetLandmarks[0];                                  // nariz
    const hombro = targetLandmarks[11] || targetLandmarks[12];
    const anchoRef = (cabeza && hombro) ? Math.hypot(hombro.x - cabeza.x, hombro.y - cabeza.y) : 0.22;
    const distCara = (lm && cabeza) ? Math.hypot(lm.x - cabeza.x, lm.y - cabeza.y) : 1.0;
    const pegadaALaCara = distCara < Math.max(MANO_PIP_MIN_DIST_CARA, anchoRef * 0.55);
    if (!lm || vis < MANO_PIP_MIN_VIS || pegadaALaCara) {
      // Sin mano confiable: la ventanita NO se muestra.
      if (!s.pip.classList.contains('hidden')) s.pip.classList.add('hidden');
      if (s.statusEl) s.statusEl.textContent = (!lm || vis < MANO_PIP_MIN_VIS) ? 'SIN MANO' : 'DESCARTADA';
      continue;
    }

    const rawSize = 0.42 / zoom;
    const st = s.state;
    st.x += (lm.x - st.x) * 0.20;
    st.y += (lm.y - st.y) * 0.20;
    st.size += (rawSize - st.size) * 0.20;

    const vw = DOM.video.videoWidth || 1280;
    const vh = DOM.video.videoHeight || 720;
    const cropPx = Math.max(90, Math.min(vw, vh, st.size * Math.max(vw, vh)));
    const sx = Math.max(0, Math.min(vw - cropPx, st.x * vw - cropPx / 2));
    const sy = Math.max(0, Math.min(vh - cropPx, st.y * vh - cropPx / 2));

    const canvas = s.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    const w = canvas.width;
    const h = canvas.height;

    // Espejado horizontal, igual que el resto de los monitores (preview tipo espejo).
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(DOM.video, sx, sy, cropPx, cropPx, 0, 0, w, h);
    ctx.restore();

    // Retícula de encuadre de mano (cruz central + marco de esquinas).
    ctx.strokeStyle = (pIdx === 1) ? 'rgba(255, 0, 127, 0.85)' : 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8.5, 8.5, w - 17, h - 17);
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - 12); ctx.lineTo(w / 2, h / 2 + 12);
    ctx.moveTo(w / 2 - 12, h / 2); ctx.lineTo(w / 2 + 12, h / 2);
    ctx.stroke();

    if (s.statusEl) {
      s.statusEl.textContent = (appState.players && appState.players.length > 1)
        ? `LOCK [J${pIdx + 1}]`
        : 'LOCK';
    }
    if (s.zoomEl) s.zoomEl.textContent = `${zoom.toFixed(1)}x`;

    // Si la mano SÍ está trackeada y está activa por ciclo o config, mostrar el contenedor
    if (appState.pipCycleVisible[s.which] || appState.trackingConfig[s.which === 'leftHand' ? 'showLeftHand' : 'showRightHand']) {
      if (s.pip.classList.contains('hidden')) s.pip.classList.remove('hidden');
    } else {
      if (!s.pip.classList.contains('hidden')) s.pip.classList.add('hidden');
    }
  }
}

// ============================================================================
// WEBCAM Y MEDIAPIPE POSE (MOTOR DE TRACKING & CALIBRACIÓN AUTORRECUPERABLE)
// ============================================================================
let cameraInitInProgress = false;
let cameraRetryTimer = null;
let cameraRetryCount = 0;
const MAX_FAST_CAMERA_RETRIES = 6;

async function populateCameraDevicesSelect(selectedId = null) {
  if (!DOM.cfgCameraSelect || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevs = devices.filter(d => d.kind === 'videoinput');
    const currentVal = selectedId || localStorage.getItem('cambiapalabras_camera_device_id') || '';

    DOM.cfgCameraSelect.innerHTML = '<option value="">(Autoselección Inteligente / Predeterminada)</option>';
    videoDevs.forEach((dev, idx) => {
      const opt = document.createElement('option');
      opt.value = dev.deviceId;
      opt.textContent = dev.label || `Cámara ${idx + 1} (${dev.deviceId.substring(0, 8)}...)`;
      if (dev.deviceId === currentVal) opt.selected = true;
      DOM.cfgCameraSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn('[WEBCAM] No se pudieron enumerar dispositivos para el selector:', e);
  }
}

async function initWebcamAndPose(preferredDeviceId = null, isUserManual = false) {
  if (cameraInitInProgress) return;
  cameraInitInProgress = true;
  if (cameraRetryTimer) { clearTimeout(cameraRetryTimer); cameraRetryTimer = null; }

  if (DOM.calibCamStatus && !appState.cameraReady) {
    DOM.calibCamStatus.textContent = 'CONECTANDO...';
  }

  try {
    let stream = null;
    const targetDeviceId = preferredDeviceId !== null ? preferredDeviceId : localStorage.getItem('cambiapalabras_camera_device_id');

    // 1) Si hay dispositivo guardado o especificado por el usuario, intentar primero con ese
    if (targetDeviceId) {
      try {
        console.log('[WEBCAM] Intentando cámara configurada:', targetDeviceId);
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { ideal: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de inicio con cámara guardada')), 4000))
        ]);
      } catch (errSaved) {
        console.warn('[WEBCAM] Cámara guardada no respondió o cambió, probando autodetección:', errSaved.message);
        stream = null;
      }
    }

    // 2) Si no hay stream, enumerar dispositivos y clasificar por prioridad
    if (!stream) {
      let videoDevices = [];
      try {
        const allDevs = await navigator.mediaDevices.enumerateDevices();
        videoDevices = allDevs.filter(d => d.kind === 'videoinput');
      } catch (eEnum) {
        console.warn('[WEBCAM] Error enumerando dispositivos:', eEnum);
      }

      // Priorizar cámaras físicas reales (Brio, Logitech, C920, USB, etc.) sobre drivers virtuales dummy (NDI) que timeoutan
      const isPhysical = (lbl) => {
        const s = (lbl || '').toLowerCase();
        return s.includes('brio') || s.includes('c920') || s.includes('logi') ||
               s.includes('webcam') || s.includes('camera') || s.includes('usb') ||
               s.includes('cam') || s.includes('obs');
      };
      const isVirtualDummy = (lbl) => {
        const s = (lbl || '').toLowerCase();
        return s.includes('ndi');
      };

      const sortedDevs = [...videoDevices].sort((a, b) => {
        const aPhys = isPhysical(a.label);
        const bPhys = isPhysical(b.label);
        const aDum = isVirtualDummy(a.label);
        const bDum = isVirtualDummy(b.label);
        if (aPhys && !bPhys) return -1;
        if (!aPhys && bPhys) return 1;
        if (!aDum && bDum) return -1;
        if (aDum && !bDum) return 1;
        return 0;
      });

      // Probar en orden de prioridad
      for (const dev of sortedDevs) {
        try {
          console.log('[WEBCAM] Probando cámara:', dev.label || dev.deviceId);
          stream = await Promise.race([
            navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: dev.deviceId ? { exact: dev.deviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de cámara individual')), 3500))
          ]);
          if (stream) {
            console.log('[WEBCAM] Cámara conectada con éxito:', dev.label || dev.deviceId);
            if (dev.deviceId) {
              localStorage.setItem('cambiapalabras_camera_device_id', dev.deviceId);
            }
            break;
          }
        } catch (devErr) {
          console.warn('[WEBCAM] No se pudo conectar a ' + (dev.label || dev.deviceId) + ':', devErr.message);
        }
      }

      // Fallback final: getUserMedia estándar sin deviceId específico
      if (!stream) {
        try {
          stream = await Promise.race([
            navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
              audio: false
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getUserMedia estándar')), 4000))
          ]);
        } catch (errGen) {
          // Último recurso: { video: true } básico
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }
    }

    if (!stream) {
      throw new Error('No se pudo obtener señal de ninguna cámara disponible.');
    }

    DOM.video.srcObject = stream;
    await DOM.video.play();
    appState.cameraReady = true;
    cameraRetryCount = 0;
    console.log('[WEBCAM] Cámara iniciada y transmitiendo correctamente.');
    if (DOM.calibCamStatus) {
      DOM.calibCamStatus.textContent = 'EN LÍNEA';
      DOM.calibCamStatus.style.color = '#00ffaa';
    }

    const track = stream.getVideoTracks()[0];
    if (track) {
      console.log('[WEBCAM] Dispositivo activo:', track.label);
      if (DOM.calibCamStatus) DOM.calibCamStatus.title = `Cámara: ${track.label} (Clic para reconectar)`;
      track.onended = () => {
        console.warn('[WEBCAM] Stream de cámara detenido o desconectado.');
        appState.cameraReady = false;
        if (DOM.calibCamStatus) {
          DOM.calibCamStatus.textContent = 'OFFLINE';
          DOM.calibCamStatus.style.color = '';
        }
        setInputMode('mouse');
        scheduleCameraRetry(3000);
      };
    }

    populateCameraDevicesSelect();

    if (!appState.poseInstance) {
      initMediaPipePose();
    }

    if (isUserManual) {
      showToast('Cámara conectada: ' + (track?.label || 'En línea'), 'success');
    }
  } catch (err) {
    console.warn('[WEBCAM] Cámara no activa o permisos no concedidos. Modo Mouse activo:', err.message);
    appState.cameraReady = false;
    if (DOM.calibCamStatus) {
      DOM.calibCamStatus.textContent = 'OFFLINE';
      DOM.calibCamStatus.style.color = '';
      DOM.calibCamStatus.title = `Error: ${err.message}. Clic para reintentar.`;
    }
    setInputMode('mouse');

    // Auto-reintento con backoff
    const delay = cameraRetryCount < MAX_FAST_CAMERA_RETRIES ? 3000 : 12000;
    cameraRetryCount++;
    console.log(`[WEBCAM] Reintento automático en ${delay / 1000}s (intento #${cameraRetryCount})...`);
    scheduleCameraRetry(delay);

    if (isUserManual) {
      showToast('No se pudo conectar la cámara: ' + err.message, 'warning');
    }
  } finally {
    cameraInitInProgress = false;
  }
}

function scheduleCameraRetry(delayMs) {
  if (cameraRetryTimer) clearTimeout(cameraRetryTimer);
  cameraRetryTimer = setTimeout(() => {
    if (!appState.cameraReady) {
      initWebcamAndPose();
    }
  }, delayMs);
}

function reconnectWebcamManual() {
  console.log('[WEBCAM] Reconexión manual solicitada...');
  cameraRetryCount = 0;
  if (cameraRetryTimer) clearTimeout(cameraRetryTimer);
  showToast('Buscando y reconectando cámara...', 'info');
  return initWebcamAndPose(null, true);
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
    appState.trackingConfig.showLeftHand ||
    appState.trackingConfig.showRightHand ||
    appState.renderConfig.cutoutEnabled ||
    // El shader maestro muestrea el depth en TODOS los frames: mientras esté
    // activo la inferencia tiene que correr, aunque los monitores PiP estén
    // apagados por el parpadeo aleatorio.
    Boolean(appState.masterOutputShader && appState.masterOutputShader.active) ||
    appState.pipCycleVisible.face ||
    appState.pipCycleVisible.depth ||
    appState.pipCycleVisible.leftHand ||
    appState.pipCycleVisible.rightHand
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
  const asciiNeedsDepth = Boolean(appState.asciiConfig && appState.asciiConfig.enabled && appState.trackingConfig.depthInShader !== false);
  return Boolean(
    FORZAR_CAMARA_SILUETA_OPENPOSE ||
    (appState.masterOutputShader && appState.masterOutputShader.active) ||
    appState.renderConfig.cutoutEnabled ||
    asciiNeedsDepth ||
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
  } catch (e) { }
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

// Canvases offscreen para multiplexado espacial por ROI (Jugador 1 y Jugador 2)
let poseInferenceCropIndex = 0;
let cropCanvasP1 = null, cropCtxP1 = null;
let cropCanvasP2 = null, cropCtxP2 = null;
let masterMaskCanvas = null, masterMaskCtx = null;
let slotMaskCanvas0 = null, slotMaskCtx0 = null;
let slotMaskCanvas1 = null, slotMaskCtx1 = null;

function getCropCanvases() {
  if (!cropCanvasP1) {
    cropCanvasP1 = document.createElement('canvas');
    cropCanvasP1.width = 480;
    cropCanvasP1.height = 480;
    cropCtxP1 = cropCanvasP1.getContext('2d');
  }
  if (!cropCanvasP2) {
    cropCanvasP2 = document.createElement('canvas');
    cropCanvasP2.width = 480;
    cropCanvasP2.height = 480;
    cropCtxP2 = cropCanvasP2.getContext('2d');
  }
  if (!slotMaskCanvas0) {
    slotMaskCanvas0 = document.createElement('canvas');
    slotMaskCanvas0.width = 480;
    slotMaskCanvas0.height = 480;
    slotMaskCtx0 = slotMaskCanvas0.getContext('2d');
  }
  if (!slotMaskCanvas1) {
    slotMaskCanvas1 = document.createElement('canvas');
    slotMaskCanvas1.width = 480;
    slotMaskCanvas1.height = 480;
    slotMaskCtx1 = slotMaskCanvas1.getContext('2d');
  }
  if (!masterMaskCanvas) {
    masterMaskCanvas = document.createElement('canvas');
    masterMaskCanvas.width = 640;
    masterMaskCanvas.height = 360;
    masterMaskCtx = masterMaskCanvas.getContext('2d');
  }
  return {
    cropCanvasP1, cropCtxP1,
    cropCanvasP2, cropCtxP2,
    slotMaskCanvas0, slotMaskCtx0,
    slotMaskCanvas1, slotMaskCtx1,
    masterMaskCanvas, masterMaskCtx
  };
}

async function stepPoseInference() {
  // Si la cámara no está lista o MediaPipe aún no existe, esperar en standby
  if (!appState.cameraReady || !DOM.video || DOM.video.readyState < 2 || !appState.poseInstance) {
    scheduleNextPoseInference(200);
    return;
  }

  // Si no se requiere tracking (Modo Mouse estándar con capas de tracking apagadas):
  if (!isTrackingNeeded()) {
    scheduleNextPoseInference(250);
    return;
  }

  // Si ya hay una inferencia en curso, reintentar en 30ms
  if (isPoseProcessing) {
    scheduleNextPoseInference(30);
    return;
  }

  const vw = DOM.video.videoWidth || 1280;
  const vh = DOM.video.videoHeight || 720;
  const { cropCanvasP1, cropCtxP1, cropCanvasP2, cropCtxP2 } = getCropCanvases();

  // Multiplexado: Slot 0 = Fotograma COMPLETO (sin recortes, silueta íntegra)
  // Slot 1 = Recorte lateral para buscar o seguir al segundo jugador
  const isP1 = (poseInferenceCropIndex === 0);
  poseInferenceCropIndex = (poseInferenceCropIndex + 1) % 2;

  let activeCanvas = null;
  if (isP1) {
    activeCanvas = DOM.video;
    appState.currentInferenceSlot = 0;
  } else {
    cropCtxP2.drawImage(DOM.video, vw * 0.38, 0, vw * 0.62, vh, 0, 0, cropCanvasP2.width, cropCanvasP2.height);
    activeCanvas = cropCanvasP2;
    appState.currentInferenceSlot = 1;
  }

  isPoseProcessing = true;
  try {
    await appState.poseInstance.send({ image: activeCanvas });
  } catch (err) {
    // Proteger contra errores transitorios de fotograma
  } finally {
    isPoseProcessing = false;
  }

  // CRÍTICO PARA EL RENDIMIENTO (60 FPS LOCK):
  scheduleNextPoseInference(35);
}

function initMediaPipePose() {
  if (typeof window.Pose === 'undefined') {
    console.log('[MediaPipe] Librería Pose CDN no disponible. Modo Mouse 100% activo.');
    return;
  }

  try {
    const pose = new window.Pose({
      // 100% LOCAL: los .wasm/.data/.tflite salen de public/vendor/mediapipe/pose
      locateFile: (file) => `vendor/mediapipe/pose/${file}`
    });

    // Inferencia ultrarrápida: modelComplexity 0 (Lite) y sin segmentación densa
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

function checkHumanPresent(landmarks) {
  if (!landmarks || landmarks.length === 0) return false;
  // Landmark 0: nariz, 11: hombro izq, 12: hombro der, 23: cadera izq, 24: cadera der
  const coreIndices = [0, 11, 12, 23, 24];
  let visibleCore = 0;
  for (let i = 0; i < coreIndices.length; i++) {
    const lm = landmarks[coreIndices[i]];
    if (lm && (lm.visibility === undefined || lm.visibility > 0.35)) {
      visibleCore++;
    }
  }
  let validCount = 0;
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (lm && (lm.visibility === undefined || lm.visibility > 0.25)) {
      validCount++;
    }
  }
  return visibleCore >= 1 && validCount >= 5;
}

function onPoseResults(results) {
  const rawLandmarks = results.poseLandmarks || [];
  const slot = appState.currentInferenceSlot ?? 0;
  const now = performance.now();

  let remapped = [];
  if (rawLandmarks.length > 0) {
    if (slot === 0) {
      remapped = rawLandmarks.map(l => ({
        x: l.x,
        y: l.y,
        z: l.z,
        visibility: l.visibility
      }));
    } else {
      remapped = rawLandmarks.map(l => ({
        x: 0.38 + l.x * 0.62,
        y: l.y,
        z: l.z,
        visibility: l.visibility
      }));
    }
  }

  if (!appState.playerSlots) appState.playerSlots = [null, null];
  if (remapped.length > 0 && checkHumanPresent(remapped)) {
    appState.playerSlots[slot] = {
      landmarks: remapped,
      timestamp: now
    };
  } else {
    if (appState.playerSlots[slot] && (now - appState.playerSlots[slot].timestamp > 450)) {
      appState.playerSlots[slot] = null;
    }
  }

  const s0 = appState.playerSlots[0];
  const s1 = appState.playerSlots[1];
  const v0 = s0 && (now - s0.timestamp < 450);
  const v1 = s1 && (now - s1.timestamp < 450);

  let activePlayers = [];
  if (v0 && v1) {
    const headDist = Math.abs(s0.landmarks[0].x - s1.landmarks[0].x);
    if (headDist < 0.14) {
      activePlayers = [{ id: 1, landmarks: s0.landmarks, slot: 0 }];
    } else {
      activePlayers = [
        { id: 1, landmarks: s0.landmarks, slot: 0 },
        { id: 2, landmarks: s1.landmarks, slot: 1 }
      ];
    }
  } else if (v0) {
    activePlayers = [{ id: 1, landmarks: s0.landmarks, slot: 0 }];
  } else if (v1) {
    activePlayers = [{ id: 1, landmarks: s1.landmarks, slot: 1 }];
  }

  appState.players = activePlayers;
  const humanDetected = (activePlayers.length > 0);
  if (humanDetected) {
    appState.lastHumanSeenTimestamp = now;
    appState.hasHuman = true;
  } else if (now - (appState.lastHumanSeenTimestamp || 0) > 400) {
    appState.hasHuman = false;
  }

  const landmarks = activePlayers[0] ? activePlayers[0].landmarks : [];
  appState.lastLandmarks = landmarks;

  // Composición completa sin cortes de silueta en masterMaskCanvas
  if (results.segmentationMask) {
    const { slotMaskCanvas1, slotMaskCtx1, masterMaskCanvas, masterMaskCtx } = getCropCanvases();
    if (slot === 0) {
      masterMaskCtx.clearRect(0, 0, masterMaskCanvas.width, masterMaskCanvas.height);
      masterMaskCtx.globalCompositeOperation = 'source-over';
      masterMaskCtx.drawImage(results.segmentationMask, 0, 0, masterMaskCanvas.width, masterMaskCanvas.height);
    } else if (slot === 1 && v1) {
      slotMaskCtx1.clearRect(0, 0, slotMaskCanvas1.width, slotMaskCanvas1.height);
      slotMaskCtx1.drawImage(results.segmentationMask, 0, 0, slotMaskCanvas1.width, slotMaskCanvas1.height);

      masterMaskCtx.globalCompositeOperation = 'lighten';
      masterMaskCtx.drawImage(slotMaskCanvas1, masterMaskCanvas.width * 0.38, 0, masterMaskCanvas.width * 0.62, masterMaskCanvas.height);
      masterMaskCtx.globalCompositeOperation = 'source-over';
    }

    if (!appState.hasHuman && (now - (appState.lastHumanSeenTimestamp || 0) > 600)) {
      masterMaskCtx.clearRect(0, 0, masterMaskCanvas.width, masterMaskCanvas.height);
    }

    results.segmentationMask = masterMaskCanvas;
  }

  // 1. Estadísticas de Inferencia y Telemetría en Vivo
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

  if (DOM.calibCamStatus) DOM.calibCamStatus.textContent = appState.cameraReady ? (activePlayers.length > 1 ? '2 JUGADORES' : 'EN LÍNEA') : 'STANDBY';
  if (DOM.calibPointsCount) DOM.calibPointsCount.textContent = `${activePlayers.length} PERS // ${landmarks.length} PTS`;
  if (DOM.calibFps) DOM.calibFps.textContent = `${appState.trackingStats.fps} FPS`;
  if (DOM.depthPipFps) DOM.depthPipFps.textContent = `${appState.trackingStats.fps} FPS`;

  // 2. Renderizar Sistemas de Calibración ÚNICAMENTE si sus capas están habilitadas
  if (FORZAR_CAMARA_SILUETA_OPENPOSE || appState.renderConfig.openposeEnabled || appState.trackingConfig.showOpenPose) {
    renderOpenPoseOverlay(landmarks);
  }
  if (appState.renderConfig.flowfieldEnabled || appState.trackingConfig.flowField) {
    renderFlowFieldOverlay(landmarks);
  }
  // SIEMPRE: el depth map y el seguimiento facial son ENTRADAS del shader maestro
  renderDepthMap(results, landmarks);
  renderFaceCamera(landmarks);
  renderHandCameras(landmarks);

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

    // Movimiento real de la persona en cámara cuenta como actividad (el jitter no).
    if (Math.abs(mappedX - appState.targetCursorX) > IDLE_CTA_CAMERA_MOVE_PX ||
      Math.abs(mappedY - appState.targetCursorY) > IDLE_CTA_CAMERA_MOVE_PX) {
      markUserActivity();
    }
    appState.targetCursorX = mappedX;
    appState.targetCursorY = mappedY;

    if (DOM.telemetrySensor) DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorType.toUpperCase()}]${activePlayers.length > 1 ? ' (2P)' : ''}`;
    if (DOM.telemetryConfidence) DOM.telemetryConfidence.textContent = `${Math.round(appState.landmarkConfidence * 100)}%`;
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
    if (DOM.telemetrySensor) DOM.telemetrySensor.textContent = 'MOUSE [CLIC DIRECTO]';
    if (DOM.telemetryConfidence) DOM.telemetryConfidence.textContent = '100%';
  } else {
    appState.isUsingMouse = false;
    DOM.inputModeIcon.textContent = '📹';
    const anchorName = (appState.trackingConfig.trackingAnchor || 'nariz').toUpperCase();
    DOM.inputModeLabel.textContent = `TRACK: CÁMARA (${anchorName})`;
    if (DOM.telemetrySensor) DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorName}]`;
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
      /* MIGRACION de grosores: los valores viejos venian en px "nominales"
         (4 = 1 px real dibujado). Ahora el slider vale px reales, asi que un
         valor viejo > 5 se convierte una sola vez (los nuevos nunca superan 5/7). */
      if (Number(parsed.boneWidth) > 5) parsed.boneWidth = Math.max(0.25, Number(parsed.boneWidth) * 0.25);
      if (Number(parsed.pointRadius) > 7) parsed.pointRadius = Math.max(0.5, Number(parsed.pointRadius) * 0.25);
      appState.trackingConfig = { ...appState.trackingConfig, ...parsed };
      // Merge profundo del selector de puntos: un JSON viejo/parcial no debe
      // borrar los defaults (mouse + manos).
      appState.trackingConfig.collisionPoints = {
        mouse: true, manoIzq: true, manoDer: true,
        dedoIzq: false, dedoDer: false, codoIzq: false, codoDer: false, centroFacial: false,
        ...(appState.trackingConfig.collisionPoints || {})
      }; console.log('[TRACKING] Configuración cargada de localStorage:', appState.trackingConfig);
    }
  } catch (e) { }
  syncTrackingConfigToInputs();
}

function saveTrackingConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_tracking_config', JSON.stringify(appState.trackingConfig));
  } catch (e) { }
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
  const cp = c.collisionPoints || {};
  if (DOM.cfgColPointMouse) DOM.cfgColPointMouse.checked = cp.mouse !== false;
  if (DOM.cfgColPointManoIzq) DOM.cfgColPointManoIzq.checked = cp.manoIzq !== false;
  if (DOM.cfgColPointManoDer) DOM.cfgColPointManoDer.checked = cp.manoDer !== false;
  if (DOM.cfgColPointDedoIzq) DOM.cfgColPointDedoIzq.checked = cp.dedoIzq === true;
  if (DOM.cfgColPointDedoDer) DOM.cfgColPointDedoDer.checked = cp.dedoDer === true;
  if (DOM.cfgColPointCodoIzq) DOM.cfgColPointCodoIzq.checked = cp.codoIzq === true;
  if (DOM.cfgColPointCodoDer) DOM.cfgColPointCodoDer.checked = cp.codoDer === true;
  if (DOM.cfgColPointCentroFacial) DOM.cfgColPointCentroFacial.checked = cp.centroFacial === true; if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = c.showDepthMap;
  if (DOM.cfgTrackDepthShader) DOM.cfgTrackDepthShader.checked = c.depthInShader !== false;
  if (DOM.cfgTrackBodyColor) DOM.cfgTrackBodyColor.value = c.bodyColor || 'neon-green';
  if (DOM.cfgTrackDepthMode) DOM.cfgTrackDepthMode.value = c.depthMode;
  if (DOM.cfgTrackDepthContrast) DOM.cfgTrackDepthContrast.value = c.depthContrast;
  if (DOM.valTrackDepthContrast) DOM.valTrackDepthContrast.textContent = c.depthContrast;
  if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = c.showFaceCamera;
  if (DOM.cfgTrackFaceZoom) DOM.cfgTrackFaceZoom.value = c.faceZoom;
  if (DOM.valTrackFaceZoom) DOM.valTrackFaceZoom.textContent = c.faceZoom;
  if (DOM.cfgTrackFaceReticle) DOM.cfgTrackFaceReticle.checked = c.faceReticle;
  if (DOM.cfgTrackLeftHand) DOM.cfgTrackLeftHand.checked = Boolean(c.showLeftHand);
  if (DOM.cfgTrackRightHand) DOM.cfgTrackRightHand.checked = Boolean(c.showRightHand);
  if (DOM.cfgTrackHandZoom) DOM.cfgTrackHandZoom.value = c.handZoom || 1.6;
  if (DOM.valTrackHandZoom) DOM.valTrackHandZoom.textContent = (c.handZoom || 1.6).toFixed(1);
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
  if (DOM.leftHandPip) DOM.leftHandPip.classList.toggle('hidden', !c.showLeftHand);
  if (DOM.rightHandPip) DOM.rightHandPip.classList.toggle('hidden', !c.showRightHand);
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
  } catch (e) { }
  applyRenderLayers();
}

function saveRenderConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_render_config', JSON.stringify(appState.renderConfig));
  } catch (e) { }
}

// ============================================================================
// GESTIÓN DE GLITCH & ENVELOPE DE SECUENCIA (PESTAÑA GLITCH & ENVELOPE)
// ============================================================================
const DEFAULT_GLITCH_CONFIG = {
  envelope: {
    idle: 0.10,
    thinking: 1.00,
    haiku: 0.50,
    duration: 1.2,
    curve: 'cubic'
  },
  manualOverride: false,
  manualGlitchAmount: 0.50,
  noiseSpeed: 1.0,
  testPreviewState: null,
  params: {
    blockIntensity: { value: 0.80, animated: true },
    blockSize: { value: 0.60, animated: true },
    chromaIntensity: { value: 0.70, animated: true },
    vhsNoiseIntensity: { value: 0.65, animated: true },
    edgeTearingIntensity: { value: 0.50, animated: true }
  }
};

function loadGlitchConfigFromStorage() {
  try {
    const saved = localStorage.getItem('sincretismo_glitch_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        appState.glitchConfig = {
          ...DEFAULT_GLITCH_CONFIG,
          ...parsed,
          envelope: { ...DEFAULT_GLITCH_CONFIG.envelope, ...(parsed.envelope || {}) },
          params: {
            blockIntensity: { ...DEFAULT_GLITCH_CONFIG.params.blockIntensity, ...(parsed.params?.blockIntensity || {}) },
            blockSize: { ...DEFAULT_GLITCH_CONFIG.params.blockSize, ...(parsed.params?.blockSize || {}) },
            chromaIntensity: { ...DEFAULT_GLITCH_CONFIG.params.chromaIntensity, ...(parsed.params?.chromaIntensity || {}) },
            vhsNoiseIntensity: { ...DEFAULT_GLITCH_CONFIG.params.vhsNoiseIntensity, ...(parsed.params?.vhsNoiseIntensity || {}) },
            edgeTearingIntensity: { ...DEFAULT_GLITCH_CONFIG.params.edgeTearingIntensity, ...(parsed.params?.edgeTearingIntensity || {}) }
          }
        };
        console.log('[GLITCH] Configuración de glitch cargada de localStorage:', appState.glitchConfig);
      }
    }
  } catch (e) { }
  applyGlitchConfigToUI();
}

function saveGlitchConfigToStorage() {
  try {
    localStorage.setItem('sincretismo_glitch_config', JSON.stringify(appState.glitchConfig));
  } catch (e) { }
}

function applyGlitchConfigToUI() {
  const cfg = appState.glitchConfig || DEFAULT_GLITCH_CONFIG;
  const env = cfg.envelope || DEFAULT_GLITCH_CONFIG.envelope;

  const slIdle = document.getElementById('cfg-env-idle');
  const valIdle = document.getElementById('val-env-idle');
  if (slIdle) slIdle.value = env.idle;
  if (valIdle) valIdle.textContent = Number(env.idle).toFixed(2);

  const slThink = document.getElementById('cfg-env-thinking');
  const valThink = document.getElementById('val-env-thinking');
  if (slThink) slThink.value = env.thinking;
  if (valThink) valThink.textContent = Number(env.thinking).toFixed(2);

  const slHaiku = document.getElementById('cfg-env-haiku');
  const valHaiku = document.getElementById('val-env-haiku');
  if (slHaiku) slHaiku.value = env.haiku;
  if (valHaiku) valHaiku.textContent = Number(env.haiku).toFixed(2);

  const slDur = document.getElementById('cfg-env-dur');
  const valDur = document.getElementById('val-env-dur');
  if (slDur) slDur.value = env.duration;
  if (valDur) valDur.textContent = Number(env.duration).toFixed(1);

  const selCurve = document.getElementById('cfg-env-curve');
  if (selCurve) selCurve.value = env.curve || 'cubic';

  const chkManual = document.getElementById('cfg-glitch-manual-override');
  const grpManual = document.getElementById('cfg-glitch-manual-group');
  const slManual = document.getElementById('cfg-glitch-manual-val');
  const valManual = document.getElementById('val-glitch-manual');
  if (chkManual) chkManual.checked = !!cfg.manualOverride;
  if (grpManual) {
    grpManual.style.opacity = cfg.manualOverride ? '1' : '0.4';
    grpManual.style.pointerEvents = cfg.manualOverride ? 'auto' : 'none';
  }
  if (slManual) slManual.value = cfg.manualGlitchAmount !== undefined ? cfg.manualGlitchAmount : 0.5;
  if (valManual) valManual.textContent = Number(cfg.manualGlitchAmount !== undefined ? cfg.manualGlitchAmount : 0.5).toFixed(2);

  const slNoise = document.getElementById('cfg-glitch-noise-speed');
  const valNoise = document.getElementById('val-glitch-noise-speed');
  if (slNoise) slNoise.value = cfg.noiseSpeed !== undefined ? cfg.noiseSpeed : 1.0;
  if (valNoise) valNoise.textContent = Number(cfg.noiseSpeed !== undefined ? cfg.noiseSpeed : 1.0).toFixed(2);

  const paramDefs = [
    { id: 'block', key: 'blockIntensity' },
    { id: 'size', key: 'blockSize' },
    { id: 'chroma', key: 'chromaIntensity' },
    { id: 'vhs', key: 'vhsNoiseIntensity' },
    { id: 'tearing', key: 'edgeTearingIntensity' }
  ];

  paramDefs.forEach(pd => {
    const p = cfg.params?.[pd.key] || DEFAULT_GLITCH_CONFIG.params[pd.key];
    const chk = document.getElementById('cfg-glitch-anim-' + pd.id);
    const sl = document.getElementById('cfg-glitch-param-' + pd.id);
    const val = document.getElementById('val-glitch-' + pd.id);
    if (chk) chk.checked = !!p.animated;
    if (sl) sl.value = p.value;
    if (val) val.textContent = Number(p.value).toFixed(2);
  });

  updateCpGlitchButtonsUI(cfg.testPreviewState);
}

function updateCpGlitchButtonsUI(activeState) {
  const btns = {
    idle: document.getElementById('cfg-glitch-test-idle'),
    thinking: document.getElementById('cfg-glitch-test-thinking'),
    haiku: document.getElementById('cfg-glitch-test-haiku'),
    auto: document.getElementById('cfg-glitch-test-auto')
  };
  Object.keys(btns).forEach(k => {
    if (btns[k]) btns[k].classList.remove('active');
  });
  if (activeState && btns[activeState]) {
    btns[activeState].classList.add('active');
  } else if (!activeState && btns.auto) {
    btns.auto.classList.add('active');
  }
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

// El guardado queda DESHABILITADO hasta terminar de cargar la configuración del
// usuario. Sin esto, cualquier apply*() intermedio durante el arranque (por ej.
// loadConfigFromServer -> applyUiColors) guardaba los DEFAULTS encima de lo que
// había en localStorage, y al leer después ya estaba todo pisado: ninguna
// preferencia de PARTÍCULAS / SHADER ASCII / COLORES sobrevivía al recargar.
var visualConfigReady = false;

// ============================================================================
// MASTER RDM · panel de control del patrón de fondo del SHADER DEL MASTER OUTPUT
// ----------------------------------------------------------------------------
// El fondo de las cajas de palabras y del contenedor del haiku dejó de ser un FBM:
// ahora es el patrón del shader "rdmf" de jpShadereditor (autor jpupper), un campo
// de RUIDO ALEATORIO POR CAPAS. Los deslizadores son EXACTAMENTE los uniforms de
// FORMA del shader original (cnt, ite_scale, speedx, speedy, speedrot, speedrdm,
// sm1, sm2, e_force) en su escala física, más la PRESENCIA (cuánto tapa al fondo
// anterior) y el COLOR, que arranca en BLANCO.
// ============================================================================
// PALETA UNIFICADA: la del GLOBALSTYLE (/globalstyle.html -> global_style.json).
// Se lee EN VIVO (cada frame), así sigue los cambios de la página de diseño sin
// recargar. Devuelve los dos acentos en 0..1 para los uniforms del shader.
function paletaGlobal() {
  const c = (window.GlobalStyleConfig && window.GlobalStyleConfig.colores) || {};
  const hexA = c.borde || c.acento || '#ff000d';
  const hexB = c.acento2 || c.texto || '#e88f93';
  return {
    hexA: hexA,
    hexB: hexB,
    a: hexToRgb01(hexA, [1, 0, 0]),
    b: hexToRgb01(hexB, [0.9, 0.6, 0.6])
  };
}

const MASTER_RDM_DEF = {
  cnt: 11,          // capas (1..20)
  iteScale: 0.5,    // escala por capa (0..10)
  speedX: 0.0,      // deriva horizontal (-0.2..0.2)
  speedY: 0.0,      // deriva vertical (-0.2..0.2)
  speedRot: 0.0,    // rotación de las capas (-0.02..0.02)
  speedRnd: 0.5,    // velocidad del random stepped (0..1)
  sm1: 0.1,         // umbral bajo del smoothstep
  sm2: 0.86,        // umbral alto del smoothstep
  force: 0.87,      // fuerza/brillo final (e_force)
  mix: 1.0,         // presencia: cuánto reemplaza al fondo anterior
  color: '#ffffff', // color del patrón cuando NO se sigue la paleta
  seguirPaleta: 1,  // 1 = patrón, marcos y contenedor usan la PALETA GLOBAL
  camTinte: 0,      // % de tinte de la cámara con la paleta (shader, 0 = original)
  pipTinte: 60,     // % de tinte de los monitores PiP (depth + facial) con la paleta
  /* SILUETA: la cámara de color deja de ser evidente. Donde se veía la imagen de la
     cámara ahora va la MÁSCARA DE PROFUNDIDAD pintada con el patrón RDM de la paleta
     (cobre) y un borde blanco. camVis = 1 devuelve la cámara original. */
  /* MASCARILLA DEL CUERPO: por defecto APAGADA (solo se ve el esqueleto del openpose).
     La maneja el MISMO ciclo random de los monitores PiP: a veces se pinta con el
     depth+RDM, a veces con el color de la cámara, a veces no aparece. */
  camVis: 50,       // % MEZCLA: 0 = depth+RDM puro · 100 = cámara de color pura · 50 = mitad y mitad
  silRdm: 100,      // % del patrón RDM en el relleno de la silueta
  silEdge: 100,     // % del borde blanco de la silueta
  maskOn: 0,        // % presencia MANUAL de la mascarilla (con maskAuto > 0 la maneja el ciclo)
  maskAuto: 100,    // % cuánto manda el ciclo random de los monitores PiP
  silBlur: 1.5      // BLUR del depth en TEXELES (1 texel ≈ 6,6 px de pantalla al escalarlo)
};

const MASTER_RDM_PARAMS = [
  { key: 'cnt', etq: 'CAPAS', unid: 'cnt', min: 1, max: 20, step: 1, dec: 0, desc: 'Cuántas capas de ruido aleatorio se promedian. Más capas = más fino.' },
  { key: 'iteScale', etq: 'ESCALA POR CAPA', unid: 'ite_scale', min: 0, max: 10, step: 0.05, dec: 2, desc: 'Cuánto se agranda el UV en cada capa sucesiva.' },
  { key: 'speedX', etq: 'VELOCIDAD HORIZONTAL', unid: 'speedx', min: -0.2, max: 0.2, step: 0.005, dec: 3, desc: 'Deriva del patrón hacia los costados.' },
  { key: 'speedY', etq: 'VELOCIDAD VERTICAL', unid: 'speedy', min: -0.2, max: 0.2, step: 0.005, dec: 3, desc: 'Deriva del patrón hacia arriba/abajo.' },
  { key: 'speedRot', etq: 'ROTACIÓN', unid: 'speedrot', min: -0.02, max: 0.02, step: 0.0005, dec: 4, desc: 'Giro de cada capa con el tiempo.' },
  { key: 'speedRnd', etq: 'VELOCIDAD DEL RANDOM', unid: 'speedrdm', min: 0, max: 1, step: 0.01, dec: 2, desc: 'Qué tan rápido cambia el valor aleatorio de cada capa.' },
  { key: 'sm1', etq: 'SMOOTH BAJO', unid: 'sm1', min: 0, max: 1, step: 0.01, dec: 2, desc: 'Umbral inferior del smoothstep: dónde empieza a aparecer el patrón.' },
  { key: 'sm2', etq: 'SMOOTH ALTO', unid: 'sm2', min: 0, max: 1, step: 0.01, dec: 2, desc: 'Umbral superior: dónde llega a blanco pleno. Muy cerca de sm1 = bordes duros.' },
  { key: 'force', etq: 'FUERZA', unid: 'e_force', min: 0, max: 1, step: 0.01, dec: 2, desc: 'Brillo total del patrón. 0 = fondo negro.' },
  { key: 'mix', etq: 'PRESENCIA', unid: 'u_rdmMix', min: 0, max: 1, step: 0.01, dec: 2, desc: '1 = el patrón tapa por completo el fondo anterior (palabras Y contenedor del haiku).' },
  { key: 'camTinte', etq: 'TINTE DE LA CÁMARA', unid: 'u_camPal', min: 0, max: 100, step: 1, dec: 0, desc: 'Cuánto se pinta la imagen de la cámara con la PALETA GLOBAL (0 = cámara original).' },
  { key: 'pipTinte', etq: 'TINTE DE LOS MONITORES', unid: 'pip (CSS)', min: 0, max: 100, step: 1, dec: 0, desc: 'Cuánto se pintan con la PALETA GLOBAL los monitores PiP: DEPTH MAP y BIOMETRÍA FACIAL.' },
  { key: 'camVis', etq: 'MEZCLA CÁMARA ↔ DEPTH+RDM', unid: 'u_camVis', min: 0, max: 100, step: 1, dec: 0, desc: '0% = mascarilla pintada SOLO con el depth (patrón RDM de la paleta) · 100% = SOLO con el color de la cámara · 50% = las dos mezcladas al medio.' },
  { key: 'silRdm', etq: 'SILUETA × RDM', unid: 'u_silRdm', min: 0, max: 100, step: 1, dec: 0, desc: 'Relleno de la silueta: 100% = patrón RDM de la paleta (cobre) · 0% = se ve la cámara.' },
  { key: 'silEdge', etq: 'BORDE BLANCO DE LA SILUETA', unid: 'u_silEdge', min: 0, max: 100, step: 1, dec: 0, desc: 'Contorno blanco sacado del gradiente del depth. 0% = sin borde.' },
  { key: 'maskAuto', etq: 'LA MASCARILLA LA MANEJA EL CICLO DE LOS MONITORES', unid: 'u_maskOn (auto)', min: 0, max: 100, step: 1, dec: 0, desc: '100% = la mascarilla aparece y desaparece con el MISMO ciclo random que los monitores PiP: cuando se prende el DEPTH se pinta con depth+RDM, cuando se prende la BIOMETRÍA se pinta con el color de la cámara. 0% = la manejás a mano con el control de abajo.' },
  { key: 'maskOn', etq: 'MASCARILLA DEL CUERPO (manual)', unid: 'u_maskOn', min: 0, max: 100, step: 1, dec: 0, desc: 'Presencia de la mascarilla cuando la maneja el operador (ciclo en 0%). 0% = solo se ve el ESQUELETO del openpose.' },
  { key: 'silBlur', etq: 'BLUR DEL DEPTH (texeles)', unid: 'u_silBlur', min: 0, max: 6, step: 0.5, dec: 1, desc: 'Suaviza el depth (viene de un canvas de 240x160 que se estira ~6,6x). Se mide en TEXELES del depth: 1 = suaviza un texel de radio (lo que hace falta para que no se vea pixelado), 6 = muy difuso.' }
];

function masterRdmState() {
  if (!appState.masterRdm) appState.masterRdm = { ...MASTER_RDM_DEF };
  return appState.masterRdm;
}

// Normaliza la escala física del panel a 0..1 (lo que el shader mapea con mapr).
function rdNorm(v, lo, hi) {
  const n = (Number(v) - lo) / (hi - lo);
  return Math.min(1, Math.max(0, isFinite(n) ? n : 0));
}

function buildMasterRdmPanel() {
  const grid = document.getElementById('masterrdm-grid');
  if (!grid || grid.dataset.listo === '1') return;
  grid.dataset.listo = '1';
  const st = masterRdmState();

  MASTER_RDM_PARAMS.forEach(pr => {
    const item = document.createElement('div');
    item.className = 'calib-item';
    item.innerHTML =
      '<label for="cfg-rdm-' + pr.key + '"><strong>' + pr.etq + '</strong> <small>(' + pr.unid + ')</small>: ' +
      '<span id="val-rdm-' + pr.key + '">' + st[pr.key] + '</span></label>' +
      '<input type="range" id="cfg-rdm-' + pr.key + '" min="' + pr.min + '" max="' + pr.max + '" step="' + pr.step + '" value="' + st[pr.key] + '">' +
      '<small class="item-desc">' + pr.desc + '</small>';
    grid.appendChild(item);
    const inp = item.querySelector('input');
    const val = item.querySelector('#val-rdm-' + pr.key);
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      masterRdmState()[pr.key] = v;
      val.textContent = pr.dec ? v.toFixed(pr.dec) : String(v);
      saveVisualConfigToStorage();
    });
  });

  const col = document.createElement('div');
  col.className = 'calib-item calib-item-inline';
  col.innerHTML = '<label for="cfg-rdm-color"><strong>COLOR DEL PATRÓN</strong>:</label>' +
    '<input type="color" id="cfg-rdm-color" class="word-color-swatch" value="' + st.color + '" title="Blanco = tal cual el shader rdmf">';
  grid.appendChild(col);
  col.querySelector('input').addEventListener('input', e => {
    masterRdmState().color = e.target.value;
    saveVisualConfigToStorage();
  });

  const palItem = document.createElement('div');
  palItem.className = 'calib-item';
  palItem.innerHTML = '<label class="pa-check-label" style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;">' +
    '<input type="checkbox" id="cfg-rdm-paleta"' + (st.seguirPaleta ? ' checked' : '') + ' style="margin-top:3px;">' +
    '<span><strong>SEGUIR PALETA GLOBAL</strong> — el patrón RDM, los marcos de las palabras, el contenedor del haiku y el tinte de la cámara se pintan con la paleta de <em>/globalstyle.html</em> (STEAMPUNK COBRE, etc.).</span></label>';
  grid.appendChild(palItem);
  palItem.querySelector('input').addEventListener('change', (e) => {
    masterRdmState().seguirPaleta = e.target.checked ? 1 : 0;
    _pipTinteUltimo = '';
    saveVisualConfigToStorage();
    if (typeof showToast === 'function') {
      showToast(e.target.checked ? 'MASTER OUTPUT SHADER: siguiendo la paleta global' : 'MASTER OUTPUT SHADER: colores fijos del shader', 'info');
    }
  });

  const rst = document.createElement('div');
  rst.className = 'calib-item calib-item-inline';
  rst.innerHTML = '<button type="button" class="cctv-btn" id="cfg-rdm-reset">↺ VALORES ORIGINALES DEL SHADER</button>';
  grid.appendChild(rst);
  rst.querySelector('button').addEventListener('click', () => {
    appState.masterRdm = { ...MASTER_RDM_DEF };
    syncMasterRdmInputs();
    saveVisualConfigToStorage();
    if (typeof showToast === 'function') showToast('↺ MASTER RDM: valores originales del shader rdmf', 'success');
  });

  syncMasterRdmInputs();
}

// Los monitores PiP (depth + biometría facial) se pintan con la paleta global con
// una capa .pip-paleta-tint (mix-blend-mode: color): cambia el TONO y conserva la
// luminancia, así la imagen sigue siendo legible. Opacidad = TINTE DE LOS MONITORES.
var _pipTinteUltimo = '';
function aplicarTintePaletaPips(pal, rdmParams) {
  const tinte = Math.max(0, Math.min(100, Number(rdmParams && rdmParams.pipTinte) || 0)) / 100;
  const modo = (rdmParams && (rdmParams.seguirPaleta === 0 || rdmParams.seguirPaleta === false)) ? 0 : 1;
  const color = (pal && pal.hexB) || '#ffffff';
  const firma = color + '|' + tinte.toFixed(2) + '|' + modo;
  if (firma === _pipTinteUltimo) return;
  _pipTinteUltimo = firma;
  document.querySelectorAll('.pip-paleta-tint').forEach((el) => {
    el.style.background = color;
    el.style.opacity = (tinte * modo).toFixed(3);
  });
}

function syncMasterRdmInputs() {
  if (!document.getElementById('masterrdm-grid')) return;
  const st = masterRdmState();
  MASTER_RDM_PARAMS.forEach(pr => {
    const inp = document.getElementById('cfg-rdm-' + pr.key);
    const val = document.getElementById('val-rdm-' + pr.key);
    if (inp) inp.value = st[pr.key];
    if (val) val.textContent = pr.dec ? Number(st[pr.key]).toFixed(pr.dec) : String(st[pr.key]);
  });
  const c = document.getElementById('cfg-rdm-color');
  if (c) c.value = st.color || '#ffffff';
  const p = document.getElementById('cfg-rdm-paleta');
  if (p) p.checked = !(st.seguirPaleta === 0 || st.seguirPaleta === false);
  _pipTinteUltimo = '';
}

function saveVisualConfigToStorage() {
  if (!visualConfigReady) return;
  try {
    localStorage.setItem('sincretismo_visual_config', JSON.stringify({
      particlesRev: PARTICLES_REV,
      ascii: appState.asciiConfig,
      particles: appState.particlesConfig,
      physics: appState.physicsConfig,
      masterRdm: appState.masterRdm,
      uiColors: appState.uiColors,
      uiPalette: appState.uiPalette
    }));
  } catch (e) { }
}

function loadVisualConfigFromStorage() {
  try {
    const saved = localStorage.getItem('sincretismo_visual_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.ascii) appState.asciiConfig = { ...appState.asciiConfig, ...parsed.ascii };
      if (parsed.particles) {
        const merge = { ...appState.particlesConfig, ...parsed.particles };
        /* REVISION DE PARTICULAS: los tamanos de letra guardados de una version
           vieja (frase 26/42, centro 38) NO pisan los nuevos: con la revieja el
           haiku se armaba con letra chica aunque se cambiara el default. */
        if ((Number(parsed.particlesRev) || 0) < PARTICLES_REV) {
          merge.fontSizePhrase = appState.particlesConfig.fontSizePhrase;
          merge.fontSizeCenter = appState.particlesConfig.fontSizeCenter;
        }
        appState.particlesConfig = merge;
      }
      if (parsed.physics) {
        appState.physicsConfig = { ...appState.physicsConfig, ...parsed.physics };
      }
      if (parsed.masterRdm) appState.masterRdm = { ...MASTER_RDM_DEF, ...parsed.masterRdm };
      /* Si el SERVER ya entregó la paleta (config.json), esa manda: si no, un
         localStorage viejo con la paleta "matrix" (verde) pisaba la paleta cobre
         recién guardada y los fondos seguían verdes. */
      if (!appState._uiFromServer) {
        if (parsed.uiColors) appState.uiColors = { ...UI_COLORS, ...parsed.uiColors };
        if (parsed.uiPalette) appState.uiPalette = parsed.uiPalette;
      }
      console.log('[VISUAL] Configuración visual cargada de localStorage.');
    }
  } catch (e) { }
  // Recién ahora se puede guardar: lo que sigue escribe el estado ya mergeado
  visualConfigReady = true;
  applyParticlesConfig();
  syncParticlesInputs();
  applyPhysicsConfig();
  syncPhysicsInputs();
  syncAsciiInputs();
  syncMasterRdmInputs();
  applyUiColors();
  syncUiColorsInputs();
}

// ============================================================================
// PALETAS GLOBALES — aplicar / renderizar / marcar estado
// ============================================================================
/* Guarda en el SERVER (config.json) los colores elegidos en la pestaña COLORES,
   con rebote: así el server sigue siendo la fuente de verdad y no vuelve el verde.
   Se mandan SIEMPRE modelo/prompt/wordsPool porque POST /config los reescribe
   (si faltan, el server pone el modelo por defecto). */
function guardarPaletaEnServidor() {
  clearTimeout(window._paletaPend);
  window._paletaPend = setTimeout(() => {
    try {
      const cfg = appState.config || {};
      const payload = {
        ollamaModel: cfg.ollamaModel || DEFAULT_CONFIG.ollamaModel,
        systemPrompt: cfg.systemPrompt || DEFAULT_CONFIG.systemPrompt,
        uiColors: appState.uiColors,
        uiPalette: appState.uiPalette
      };
      if (Array.isArray(cfg.wordsPool) && cfg.wordsPool.length) payload.wordsPool = cfg.wordsPool;
      sbFetch('/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => { });
    } catch (e) { }
  }, 900);
}

function applyUiPalette(paletteId) {
  const pal = getPaletteById(paletteId);
  appState.uiPalette = pal.id;
  appState.uiColors = buildUiColorsFromPalette(pal);
  applyUiColors();
  syncUiColorsInputs();
  updatePaletteUi();
  appState._uiFromServer = true;   // la eleccion manda (no la pisa el localStorage)
  guardarPaletaEnServidor();
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
  // PEDIDO: palabras MAS GRANDES (multiplicador sobre lo que tenga el panel).
  root.style.setProperty('--word-font-size', `${Math.max(PALABRA_PX_MIN_BASE, Math.round(p.fontSize * BOOST_PALABRAS))}px`);
  // Tamaño por ESTADO: centro (girando/transformando) y frase final (+ auxiliares)
  // PEDIDO: las 3 del MEDIO vuelven al tamano anterior del panel (sin boost ni piso).
  root.style.setProperty('--word-font-size-center', `${Number(p.fontSizeCenter) || 56}px`);
  root.style.setProperty('--word-font-size-phrase', `${Number(p.fontSizePhrase) || 62}px`);
  root.style.setProperty('--word-font-family', PARTICLE_FONT_FAMILIES[p.fontFamily] || PARTICLE_FONT_FAMILIES.organic);
  root.style.setProperty('--word-color', p.color);
  root.style.setProperty('--word-outline', `${p.outline}px`);
  root.style.setProperty('--word-stroke-width', `${Math.max(1, p.outline || 1.5)}px`);
  root.style.setProperty('--word-outline-color', '#000000');
  if (p.outlineGlow !== false) {
    root.style.setProperty('--word-glow', `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 14px ${p.color}`);
  } else {
    root.style.setProperty('--word-glow', '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 10px rgba(0, 0, 0, 0.9)');
  }
  appState.maxFloatingWords = Math.max(3, Number(p.maxWords) || 9);
  saveVisualConfigToStorage();
}

function syncParticlesInputs() {
  const p = appState.particlesConfig;
  if (DOM.cfgPartFontSize) DOM.cfgPartFontSize.value = p.fontSize;
  if (DOM.valPartFontSize) DOM.valPartFontSize.textContent = p.fontSize;
  if (DOM.cfgPartFontSizeCenter) DOM.cfgPartFontSizeCenter.value = p.fontSizeCenter;
  if (DOM.valPartFontSizeCenter) DOM.valPartFontSizeCenter.textContent = p.fontSizeCenter;
  if (DOM.cfgPartFontSizePhrase) DOM.cfgPartFontSizePhrase.value = p.fontSizePhrase;
  if (DOM.valPartFontSizePhrase) DOM.valPartFontSizePhrase.textContent = p.fontSizePhrase;
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
  if (DOM.cfgPartMaxSpeed) DOM.cfgPartMaxSpeed.value = (p.maxSpeed !== undefined ? p.maxSpeed : 2.0);
  if (DOM.valPartMaxSpeed) DOM.valPartMaxSpeed.textContent = Number(p.maxSpeed !== undefined ? p.maxSpeed : 2.0).toFixed(1);
  if (DOM.cfgPartOutlineGlow) DOM.cfgPartOutlineGlow.checked = p.outlineGlow !== false;
}

function applyPhysicsConfig() {
  const p = appState.physicsConfig;
  const rad = Number(p.collisionRadius) || 48;
  if (appState.floatingWords) {
    appState.floatingWords.forEach(w => {
      w.radius = rad;
    });
  }
  saveVisualConfigToStorage();
}

function syncPhysicsInputs() {
  const p = appState.physicsConfig;
  if (!p) return;
  if (DOM.cfgPhysEnabled) DOM.cfgPhysEnabled.checked = p.enabled !== false;
  if (DOM.valPhysEnabled) {
    DOM.valPhysEnabled.textContent = (p.enabled !== false) ? 'ACTIVO' : 'DESACTIVADO';
    DOM.valPhysEnabled.style.color = (p.enabled !== false) ? '#ff000d' : '#888';
  }
  const bouncePct = Math.round((p.bounce !== undefined ? p.bounce : 0.75) * 100);
  if (DOM.cfgPhysBounce) DOM.cfgPhysBounce.value = bouncePct;
  if (DOM.valPhysBounce) DOM.valPhysBounce.textContent = bouncePct;

  const frictionPct = Math.round((p.friction !== undefined ? p.friction : 0.05) * 100);
  if (DOM.cfgPhysFriction) DOM.cfgPhysFriction.value = frictionPct;
  if (DOM.valPhysFriction) DOM.valPhysFriction.textContent = frictionPct;

  const forceVal = Number(p.collisionForce !== undefined ? p.collisionForce : 1.0).toFixed(1);
  if (DOM.cfgPhysForce) DOM.cfgPhysForce.value = forceVal;
  if (DOM.valPhysForce) DOM.valPhysForce.textContent = forceVal;

  const radVal = p.collisionRadius !== undefined ? p.collisionRadius : 48;
  if (DOM.cfgPhysRadius) DOM.cfgPhysRadius.value = radVal;
  if (DOM.valPhysRadius) DOM.valPhysRadius.textContent = radVal;

  const wallBouncePct = Math.round((p.wallBounce !== undefined ? p.wallBounce : 0.80) * 100);
  if (DOM.cfgPhysWallBounce) DOM.cfgPhysWallBounce.value = wallBouncePct;
  if (DOM.valPhysWallBounce) DOM.valPhysWallBounce.textContent = wallBouncePct;
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
    const openposeOn = FORZAR_CAMARA_SILUETA_OPENPOSE || r.openposeEnabled;
    t.showOpenPose = openposeOn;
    DOM.openposeCanvas.style.opacity = r.openposeOpacity;
    DOM.openposeCanvas.style.display = openposeOn ? 'block' : 'none';
    if (!openposeOn) {
      const ctx = DOM.openposeCanvas.getContext('2d');
      ctx.clearRect(0, 0, DOM.openposeCanvas.width, DOM.openposeCanvas.height);
    }
  }

  // 4b. Flow Field Overlay (sincronizado con su toggle en Tab Tracking)
  if (DOM.flowfieldCanvas) {
    t.flowField = Boolean(r.flowfieldEnabled);
    DOM.flowfieldCanvas.style.opacity = r.flowfieldOpacity;
    DOM.flowfieldCanvas.style.display = (r.flowfieldEnabled || t.flowField) ? 'block' : 'none';
    if (!r.flowfieldEnabled && !t.flowField) {
      const ctx = DOM.flowfieldCanvas.getContext('2d');
      ctx.clearRect(0, 0, DOM.flowfieldCanvas.width, DOM.flowfieldCanvas.height);
    }
  }

  // 5. Punteros Unificados de Selección
  if (DOM.pointersCanvas) {
    DOM.pointersCanvas.style.opacity = r.pointersOpacity;
    DOM.pointersCanvas.style.display = r.pointersEnabled ? 'block' : 'none';
  }

  // 6. Monitores PiP (sincronizados con Tab Tracking)
  //    OJO: la VISIBILIDAD de los monitores la maneja el PARPADEO ALEATORIO
  //    (updatePipAutoCycle): acá sólo se sincroniza el flag de capa. Si acá se
  //    hiciera toggle con r.depthEnabled/r.faceEnabled, el monitor quedaría fijo.
  if (DOM.depthPip) {
    t.showDepthMap = r.depthEnabled;
    DOM.depthPip.classList.toggle('hidden', !appState.pipCycleVisible.depth);
  }
  if (DOM.facePip) {
    t.showFaceCamera = r.faceEnabled;
    DOM.facePip.classList.toggle('hidden', !appState.pipCycleVisible.face);
  }
  if (DOM.leftHandPip) {
    t.showLeftHand = r.leftHandEnabled;
    DOM.leftHandPip.classList.toggle('hidden', !appState.pipCycleVisible.leftHand);
  }
  if (DOM.rightHandPip) {
    t.showRightHand = r.rightHandEnabled;
    DOM.rightHandPip.classList.toggle('hidden', !appState.pipCycleVisible.rightHand);
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

  if (DOM.cfgRenderFlowfieldToggle) DOM.cfgRenderFlowfieldToggle.checked = Boolean(r.flowfieldEnabled);
  if (DOM.cfgRenderFlowfieldOpacity) DOM.cfgRenderFlowfieldOpacity.value = Math.round(r.flowfieldOpacity * 100);
  if (DOM.valRenderFlowfieldOpacity) DOM.valRenderFlowfieldOpacity.textContent = Math.round(r.flowfieldOpacity * 100);

  if (DOM.cfgRenderPointersToggle) DOM.cfgRenderPointersToggle.checked = r.pointersEnabled;
  if (DOM.cfgRenderPointersOpacity) DOM.cfgRenderPointersOpacity.value = Math.round(r.pointersOpacity * 100);
  if (DOM.valRenderPointersOpacity) DOM.valRenderPointersOpacity.textContent = Math.round(r.pointersOpacity * 100);

  if (DOM.cfgRenderDepthToggle) DOM.cfgRenderDepthToggle.checked = r.depthEnabled;
  if (DOM.cfgRenderFaceToggle) DOM.cfgRenderFaceToggle.checked = r.faceEnabled;
  if (DOM.cfgRenderLeftHandToggle) DOM.cfgRenderLeftHandToggle.checked = r.leftHandEnabled;
  if (DOM.cfgRenderRightHandToggle) DOM.cfgRenderRightHandToggle.checked = r.rightHandEnabled;

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

  if (DOM.cfgRenderNoiseSpeed) DOM.cfgRenderNoiseSpeed.value = r.noiseSpeed || 1.0;
  if (DOM.valRenderNoiseSpeed) DOM.valRenderNoiseSpeed.textContent = (r.noiseSpeed || 1.0).toFixed(1);

  if (DOM.cfgRenderCorpParticlesToggle) DOM.cfgRenderCorpParticlesToggle.checked = r.corpParticlesEnabled;
  if (DOM.cfgRenderCorpParticlesOpacity) DOM.cfgRenderCorpParticlesOpacity.value = Math.round(r.corpParticlesOpacity * 100);
  if (DOM.valRenderCorpParticlesOpacity) DOM.valRenderCorpParticlesOpacity.textContent = Math.round(r.corpParticlesOpacity * 100);

  // Sincronización continua hacia los controles de las otras pestañas
  if (DOM.cfgAsciiEnabled) DOM.cfgAsciiEnabled.checked = r.asciiEnabled;
  if (DOM.cfgTrackFrameDiff) DOM.cfgTrackFrameDiff.checked = r.frameDiffEnabled;
  if (DOM.cfgTrackOpenpose) DOM.cfgTrackOpenpose.checked = r.openposeEnabled;
  if (DOM.cfgTrackFlowField) DOM.cfgTrackFlowField.checked = Boolean(r.flowfieldEnabled || t.flowField);
  if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = r.depthEnabled;
  if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = r.faceEnabled;
}

// ============================================================================
// RENDERIZADO DE PUNTEROS UNIFICADOS (HIGH-TECH RETICLES)
// Requerimiento 1: Punteros idénticos para mouse, OpenPose o cualquier sensor
// ============================================================================
/* COLORES DE LOS PUNTEROS: salían de dos literales (#ff0055 / #00f0ff). Ahora se leen
   del ESTILO GLOBAL (global_style.json → /globalstyle.html): colores.puntero (retículo
   normal) y colores.punteroFijo (mientras engancha una palabra). Si no están definidos
   caen a la paleta de cambiapalabras (uiColors.cyan / red). */
function coloresPunteros() {
  const g = (window.GlobalStyleConfig && window.GlobalStyleConfig.colores) || {};
  const ui = (appState.uiColors || {});
  const base = g.puntero || g.cambiaAcento || g.acento || ui.cyan || '#00f0ff';
  const fijo = g.punteroFijo || g.clusterPelotita || g.acento2 || ui.red || '#ff0055';
  return { base: base, fijo: fijo };
}

function rgbaDesdeHex(hex, alfa) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 'rgba(255, 255, 255, ' + alfa + ')';
  const n = parseInt(m[1], 16);
  return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alfa + ')';
}

function drawUnifiedReticle(ctx, x, y, isLocking, chargeProgress = 0, label = '') {
  if (!appState.renderConfig.pointersEnabled) return;

  const masterOpacity = appState.renderConfig.pointersOpacity;
  if (masterOpacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = masterOpacity;
  ctx.translate(x, y);

  const colPun = coloresPunteros();
  const now = performance.now();

  const primaryCol = isLocking ? colPun.fijo : colPun.base;
  const pulse = Math.sin(now * 0.008) * 2;
  const baseR = isLocking ? (26 + pulse) : 22;
  const outerRadius = baseR + 14;
  const radius = baseR;

  ctx.shadowBlur = 0;

  // 1. Fondo negro óptico
  const lensGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, outerRadius);
  lensGrad.addColorStop(0, 'rgba(8, 18, 26, 0.95)');
  lensGrad.addColorStop(0.65, 'rgba(5, 11, 16, 0.98)');
  lensGrad.addColorStop(1.0, 'rgba(0, 0, 0, 1.0)');
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Bisel exterior con muescas mecánicas
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Muescas radiales del bisel mecánico (12 muescas a 30°)
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = primaryCol;
  for (let a = 0; a < 12; a++) {
    const ang = a * (Math.PI / 6);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cosA * (outerRadius - 3.5), sinA * (outerRadius - 3.5));
    ctx.lineTo(cosA * (outerRadius + 1.5), sinA * (outerRadius + 1.5));
    ctx.stroke();
  }

  // 3. Anillos concéntricos de retícula de mira (óptica de precisión)
  ctx.strokeStyle = isLocking ? 'rgba(243, 156, 18, 0.65)' : 'rgba(0, 240, 255, 0.55)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Cruz Táctica con Mil-Dots / Marcas de Telémetro
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = primaryCol;

  ctx.beginPath();
  ctx.moveTo(-outerRadius + 4, 0); ctx.lineTo(-radius * 0.45, 0);
  ctx.moveTo(radius * 0.45, 0); ctx.lineTo(outerRadius - 4, 0);
  ctx.moveTo(0, -outerRadius + 4); ctx.lineTo(0, -radius * 0.45);
  ctx.moveTo(0, radius * 0.45); ctx.lineTo(0, outerRadius - 4);
  ctx.stroke();

  // Mil-dots / graduaciones en la cruz
  const dots = [8, 14, 20];
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = primaryCol;
  dots.forEach(d => {
    if (d < outerRadius - 6) {
      ctx.beginPath();
      ctx.moveTo(-d, -2); ctx.lineTo(-d, 2);
      ctx.moveTo(d, -2); ctx.lineTo(d, 2);
      ctx.moveTo(-2, -d); ctx.lineTo(2, -d);
      ctx.moveTo(-2, d); ctx.lineTo(2, d);
      ctx.stroke();
    }
  });

  // 5. Punto Central / Bead
  ctx.fillStyle = primaryCol;
  ctx.beginPath();
  ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Arco de Carga de Dwell (Manómetro / Muelle de Carga Steampunk):
  // los 3 segundos de contacto con la palabra.
  if (isLocking && chargeProgress > 0) {
    ctx.strokeStyle = '#ff5722';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeProgress);
    ctx.stroke();

    const curAng = -Math.PI / 2 + Math.PI * 2 * chargeProgress;
    const hx = Math.cos(curAng) * (outerRadius + 4.5);
    const hy = Math.sin(curAng) * (outerRadius + 4.5);
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(hx, hy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Etiqueta de telemetría del punto de interacción
  if (label) {
    ctx.shadowBlur = 0;
    ctx.font = '8px "Share Tech Mono", monospace';
    ctx.fillStyle = isLocking ? '#f39c12' : '#dfa857';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, outerRadius + 14);
  }

  ctx.restore();
}

function renderUnifiedPointers() {
  if (!DOM.pointersCanvas || !appState.renderConfig.pointersEnabled) return;
  const ctx = DOM.pointersCanvas.getContext('2d');
  ctx.clearRect(0, 0, DOM.pointersCanvas.width, DOM.pointersCanvas.height);

  // REQUERIMIENTO 7: Punteros (mouse y manos) APARECEN SOLO EN MODO IDLE (o INTERACT inicial).
  // Cuando se seleccionan las 3 palabras y arranca la formación del haiku/frase, NO APARECEN.
  const isIdle = (appState.currentState === STATES.IDLE || appState.currentState === STATES.INTERACT) &&
                 (!appState.capturedWords || appState.capturedWords.length < 3);

  if (!isIdle) {
    if (DOM.reticle && !DOM.reticle.classList.contains('hidden')) {
      DOM.reticle.classList.add('hidden');
    }
    return;
  }

  const points = appState.activeInteractionPoints || [];
  const lockingIdx = appState.targetedWordIndex;
  const progress = lockingIdx !== -1 ? Math.min(1.0, appState.dwellTimer / appState.dwellDuration) : 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    // REQUERIMIENTO 7: El puntero del mouse SOLO APARECE si tenes el mouse apretado
    if (pt.name.includes('MOUSE') && !appState.isMouseDown) {
      continue;
    }
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
    this.maxParticles = 0;
    this.icons = [];
    this.iconSprites = {};
    this.active = false;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  init() {
    this.resize();
  }

  preRenderSprites() { }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    this.active = false;
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  stop() {
    this.active = false;
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  createParticle() {
    return null;
  }

  updateAndDraw(dt) {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// ============================================================================
// SISTEMA UNIFICADO DE PALABRAS (ESTADOS: FLOATING -> LOCKING -> SLOTTED -> SCRAMBLING -> TRANSFORMED -> PHRASE_MEMBER -> AUXILIARY)
// ============================================================================
const WORD_STATES = {
  FLOATING: 'FLOATING',
  LOCKING: 'LOCKING',
  SLOTTED: 'SLOTTED',
  SCRAMBLING: 'SCRAMBLING',
  TRANSFORMED: 'TRANSFORMED',
  PHRASE_MEMBER: 'PHRASE_MEMBER',
  AUXILIARY: 'AUXILIARY'
};

// El banco de palabras (config.json / clusters Laya / pool por defecto) viene en
// minúsculas: al flotar se muestra SIEMPRE con la primera letra en mayúscula.
function capitalizeFirstLetter(str) {
  const s = String(str ?? '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

class FloatingWord {
  constructor(text, x, y, state = WORD_STATES.FLOATING) {
    this.text = text;
    this.targetText = text;
    this.state = state;
    this.x = x ?? (Math.random() * (window.innerWidth - 300) + 150);
    this.y = y ?? (Math.random() * (window.innerHeight - 350) + 120);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 0.9;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.floatPhase = Math.random() * 10;

    this.radius = (appState.physicsConfig && appState.physicsConfig.collisionRadius) ? appState.physicsConfig.collisionRadius : 48;
    this.mass = 1.0;
    this.ax = 0;
    this.ay = 0;
    this.dwell = 0;
    this.age = 0;
    this.isTargeted = false;
    this.isCaught = false;
    this.slotIndex = -1;
    this.isScrambling = false;

    this.el = document.createElement('div');
    this.el.className = 'organic-word-item';
    this.el.title = 'Haz clic o posa el cursor para atraparla';

    // Inicial en mayúscula sólo para las palabras flotantes del banco; las
    // auxiliares son texto corrido de la frase de la IA y van tal cual.
    const labelText = (state === WORD_STATES.AUXILIARY) ? this.text : capitalizeFirstLetter(this.text);

    this.el.innerHTML = `
      <div class="word-pill-fill"></div>
      <span class="word-label">${labelText}</span>
      <span class="word-lock-badge"></span>
    `;

    this.pillFill = this.el.querySelector('.word-pill-fill');
    this.label = this.el.querySelector('.word-label');
    this.lockBadge = this.el.querySelector('.word-lock-badge');

    if (this.state === WORD_STATES.AUXILIARY) {
      this.el.className = 'organic-word-item word-auxiliary';
    }

    // PEDIDO: tocar/cliquear una palabra NO la selecciona de una. Se LLENA con el
    // puntero encima (mismo dwell que con la mano) y se captura sola al llegar al 100%.
    this.el.addEventListener('click', (e) => { e.stopPropagation(); });

    if (DOM.floatingLayer && this.state !== WORD_STATES.AUXILIARY) {
      DOM.floatingLayer.appendChild(this.el);
      this.updatePosition();
    }
  }

  update(dt) {
    if (this.state !== WORD_STATES.FLOATING && this.state !== WORD_STATES.LOCKING) return;
    if (this.isCaught) return;

    // REQUERIMIENTO 2: Cuando una palabra empieza a llenarse y ganar energía (LOCKING, isTargeted o dwellProgress > 0)
    // se queda QUIETA, o sea que deja de moverse por completo.
    const isCharging = (this.state === WORD_STATES.LOCKING || this.isTargeted || (this.dwellProgress && this.dwellProgress > 0));
    if (isCharging) {
      this.ax = 0;
      this.ay = 0;
      this.updatePosition();
      return;
    }

    const pCfg = appState.particlesConfig || {};
    const physCfg = appState.physicsConfig || {};
    const life = Number(pCfg.lifetime) || 0;
    const speedMul = Number(pCfg.speed) || 1;
    const friction = Number(physCfg.friction !== undefined ? physCfg.friction : 0.05);
    const wallBounce = Number(physCfg.wallBounce !== undefined ? physCfg.wallBounce : 0.80);

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

    // Fricción / resistencia continua para suavizar aceleraciones de colisión
    const effDt = Math.max(0.001, Math.min(0.1, dt || 0.016));
    const damping = Math.max(0.70, 1 - friction * effDt * 2.5);
    this.vx *= damping;
    this.vy *= damping;

    // Control de velocidades mínimas y máximas para mantener dinamismo.
    // VELOCIDAD MÁXIMA configurable (pestaña PARTÍCULAS): tope duro del módulo
    // de la velocidad. Default 2 (el usuario la fija en 2).
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const maxSpeed = Math.max(0.1, Number(pCfg.maxSpeed) || 2.0);
    const minSpeed = 0.45 * speedMul;
    if (currentSpeed > maxSpeed) {
      this.vx = (this.vx / currentSpeed) * maxSpeed;
      this.vy = (this.vy / currentSpeed) * maxSpeed;
    } else if (currentSpeed < minSpeed && currentSpeed > 0.0001) {
      this.vx = (this.vx / currentSpeed) * minSpeed;
      this.vy = (this.vy / currentSpeed) * minSpeed;
    }

    this.floatPhase += dt * 1.5;
    const swayX = Math.sin(this.floatPhase) * 0.35;
    const swayY = Math.cos(this.floatPhase * 0.8) * 0.25;

    this.x += (this.vx + swayX) * speedMul;
    this.y += (this.vy + swayY) * speedMul;

    const minX = 80;
    const maxX = window.innerWidth - 80;
    const minY = 90;
    const maxY = window.innerHeight - 130;

    if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx) * wallBounce; }
    if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx) * wallBounce; }
    if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy) * wallBounce; }
    if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy) * wallBounce; }

    this.updatePosition();
  }

  onCollide() {
    if (!this.el) return;
    this.el.classList.add('word-colliding');
    if (this._collideTimer) clearTimeout(this._collideTimer);
    this._collideTimer = setTimeout(() => {
      if (this.el) this.el.classList.remove('word-colliding');
    }, 150);
  }

  updatePosition() {
    if (this.state === WORD_STATES.PHRASE_MEMBER || this.state === WORD_STATES.AUXILIARY) return;
    this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -50%)`;
  }

  setTargeted(targeted, progress = 0) {
    this.isTargeted = targeted;
    this.dwellProgress = targeted ? Math.min(1.0, Math.max(0, progress)) : 0;
    // ENERGIA de la palabra: la dibuja SOLO el shader (wordsq.rgb). Se llena con el
    // puntero/mano, se mantiene al engancharse y se VACIA cuando baja al medio.
    this.energy = this.dwellProgress;
    if (targeted) {
      this.state = WORD_STATES.LOCKING;
      this.el.classList.add('targeting');
      const pct = Math.min(100, Math.round(progress * 100));
      if (this.lockBadge) {
        this.lockBadge.textContent = `[${pct}%]`;
        this.lockBadge.style.display = 'inline-block';
      }
    } else {
      if (this.state === WORD_STATES.LOCKING) this.state = WORD_STATES.FLOATING;
      this.el.classList.remove('targeting');
      if (this.lockBadge) {
        this.lockBadge.textContent = '';
        this.lockBadge.style.display = 'none';
      }
    }
  }

  // --- COREOGRAFÍA ---------------------------------------------------------
  // Vuelo animado en JS (rAF) hacia una posición de pantalla. Se usa para TODOS
  // los movimientos para poder ESPERAR la llegada y mantener sincronizados los
  // círculos que dibuja el shader maestro (que lee this.x / this.y).
  flyTo(tx, ty, durationMs = 900) {
    const sx = this.x;
    const sy = this.y;
    if (durationMs <= 0) {
      this.x = tx; this.y = ty; this.updatePosition();
      return Promise.resolve();
    }
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const p = Math.min(1, (now - t0) / durationMs);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        this.x = sx + (tx - sx) * e;
        this.y = sy + (ty - sy) * e;
        this.updatePosition();
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  flyToElement(rect, durationMs = 1200) {
    return this.flyTo(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, durationMs);
  }

  // Posiciones de ENGANCHE (arriba, sobre el shader): izq / centro / der
  static stagingPositions() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return [
      { x: Math.round(w * 0.25), y: Math.round(h * 0.20) },
      { x: Math.round(w * 0.50), y: Math.round(h * 0.20) },
      { x: Math.round(w * 0.75), y: Math.round(h * 0.20) }
    ];
  }

  // Estado 1: la palabra elegida se clava ARRIBA (izquierda / centro / derecha)
  moveToStaging(stageIdx) {
    this.isCaught = true;
    this.state = WORD_STATES.SLOTTED;
    this.slotIndex = stageIdx;
    this.el.className = 'organic-word-item word-slotted word-charged';
    // PEDIDO: la palabra llega ARRIBA con toda la energia del llenado (se vacia en el centro).
    this.energy = 1;
    if (this.lockBadge) this.lockBadge.style.display = 'none';
    if (this.label) this.label.textContent = this.text.toUpperCase();

    const pos = FloatingWord.stagingPositions()[Math.max(0, Math.min(2, stageIdx))];
    return this.flyTo(pos.x, pos.y, 950);
  }

  // Estado 2: las 3 bajan del borde superior al MEDIO y ahí se reescriben
  moveToCenter(stageIdx) {
    this.state = WORD_STATES.SCRAMBLING;
    this.el.className = 'organic-word-item word-scrambling word-charged';
    this.empezarVaciadoEnergia();   // PEDIDO: en el medio se VACIA la energia
    const xs = [0.25, 0.5, 0.75];
    const x = window.innerWidth * xs[Math.max(0, Math.min(2, stageIdx))];
    return this.flyTo(x, window.innerHeight * 0.47, 1100);
  }

  startContinuousScramble() {
    this.isScrambling = true;
    const GLYPHS = '01#$*+<>/?@_Δ§%&ABCDEF0123456789';
    const tick = () => {
      if (!this.isScrambling) return;
      const len = Math.max(this.text.length, 8);
      let s = '';
      for (let j = 0; j < len; j++) {
        s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      if (this.label) this.label.textContent = s;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stopContinuousScramble() {
    this.isScrambling = false;
  }

  resolveScramble(targetColdWord, durationMs = 1400) {
    this.stopContinuousScramble();
    this.targetText = targetColdWord;
    return new Promise((resolve) => {
      const GLYPHS = '01#$*+<>/?@_Δ§%&ABCDEF0123456789';
      const startTime = performance.now();
      const currentWord = String(this.text || '').toUpperCase();
      const targetStr = String(targetColdWord || '');

      const updateFrame = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);

        const currentLength = Math.max(1, Math.round(currentWord.length + (targetStr.length - currentWord.length) * progress));
        const resolvedCount = Math.floor(targetStr.length * Math.pow(progress, 1.35));

        let displayStr = '';
        for (let i = 0; i < currentLength; i++) {
          if (i < resolvedCount && i < targetStr.length) {
            displayStr += targetStr[i];
          } else {
            displayStr += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }

        if (this.label) this.label.textContent = displayStr;

        if (Math.random() < 0.28) {
          playSound('typewriter');
        }

        if (progress < 1.0) {
          requestAnimationFrame(updateFrame);
        } else {
          if (this.label) this.label.textContent = targetStr;
          if (this.state !== WORD_STATES.AUXILIARY) {
            this.state = WORD_STATES.TRANSFORMED;
            this.el.className = 'organic-word-item word-transformed word-charged';
            playSound('catch');
          } else {
            this.el.className = 'organic-word-item word-auxiliary';
          }
          resolve();
        }
      };

      requestAnimationFrame(updateFrame);
    });
  }

  /* PEDIDO: las palabras se van VACIANDO de energia mientras estan en el MEDIO
     (barra interior de 100% -> 0%) hasta que se van al haiku. */
  empezarVaciadoEnergia() {
    if (this._drenando) return;
    this._drenando = true;
    const t0 = performance.now();
    const tick = () => {
      if (!this._drenando) return;
      const avance = Math.min(1, (performance.now() - t0) / ENERGIA_VACIADO_MS);
      // La energia la dibuja el shader: el fondo negro se queda y la parte llena se retrae.
      this.energy = Math.max(0, 1 - avance);
      if (avance >= 1 || this.state !== WORD_STATES.SCRAMBLING) {
        this._drenando = false;
        this.energy = 0;
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  moveToPhraseFlow(containerEl, beforeEl) {
    var eraAuxiliar = (this.state === WORD_STATES.AUXILIARY);
    this.state = WORD_STATES.PHRASE_MEMBER;
    this.el.className = 'organic-word-item word-phrase-member' + (eraAuxiliar ? '' : ' word-charged');
    if (this.label) this.label.textContent = this.targetText;
    this.el.style.transform = 'none';
    if (containerEl) {
      // Ocupa EXACTAMENTE el hueco que reservaba el placeholder invisible
      if (beforeEl && beforeEl.parentNode === containerEl) {
        containerEl.insertBefore(this.el, beforeEl);
      } else {
        containerEl.appendChild(this.el);
      }
      if (beforeEl && beforeEl.parentNode) beforeEl.parentNode.removeChild(beforeEl);
    }
  }

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

  fadeOut() {
    if (this.el) {
      this.el.style.opacity = '0';
      this.el.style.transition = 'opacity 0.6s ease';
    }
  }

  destroy() {
    this.isScrambling = false;
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
// SISTEMA DE COLISIÓN Y FÍSICA DE PALABRAS FLOTANTES (REQUERIMIENTO 3)
// ============================================================================
function updateFloatingWordsPhysics(dt) {
  const cfg = appState.physicsConfig;
  if (!cfg || !cfg.enabled) return;

  const words = appState.floatingWords.filter(w => !w.isCaught && (w.state === WORD_STATES.FLOATING || w.state === WORD_STATES.LOCKING));
  if (words.length < 2) return;

  const bounce = (cfg.bounce !== undefined) ? cfg.bounce : 0.75;
  const friction = (cfg.friction !== undefined) ? cfg.friction : 0.05;
  const baseRadius = (cfg.collisionRadius !== undefined) ? cfg.collisionRadius : 48;
  const forceMul = (cfg.collisionForce !== undefined) ? cfg.collisionForce : 1.0;

  for (let i = 0; i < words.length; i++) {
    const w1 = words[i];
    const isLocked1 = (w1.state === WORD_STATES.LOCKING || w1.isTargeted || (w1.dwellProgress && w1.dwellProgress > 0));

    for (let j = i + 1; j < words.length; j++) {
      const w2 = words[j];
      const isLocked2 = (w2.state === WORD_STATES.LOCKING || w2.isTargeted || (w2.dwellProgress && w2.dwellProgress > 0));

      const dx = w2.x - w1.x;
      const dy = w2.y - w1.y;
      const distSq = dx * dx + dy * dy;

      const r1 = w1.radius || baseRadius;
      const r2 = w2.radius || baseRadius;
      const minDist = r1 + r2;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist; // Vector normal unitario de w1 a w2
        const ny = dy / dist;
        const tx = -ny;       // Vector tangente perpendicular
        const ty = nx;

        // Separación de cuerpos para evitar superposición
        const overlap = (minDist - dist) + 0.5;
        if (isLocked1 && !isLocked2) {
          // w1 está cargándose/ganando energía y no se mueve; w2 absorbe todo el desplazamiento
          w2.x += nx * overlap;
          w2.y += ny * overlap;
        } else if (!isLocked1 && isLocked2) {
          // w2 está cargándose/ganando energía y no se mueve; w1 absorbe todo el desplazamiento
          w1.x -= nx * overlap;
          w1.y -= ny * overlap;
        } else if (!isLocked1 && !isLocked2) {
          // Ambas están flotando libremente
          w1.x -= nx * overlap * 0.5;
          w1.y -= ny * overlap * 0.5;
          w2.x += nx * overlap * 0.5;
          w2.y += ny * overlap * 0.5;
        }

        // Velocidad relativa
        const rvx = (w2.vx || 0) - (w1.vx || 0);
        const rvy = (w2.vy || 0) - (w1.vy || 0);
        const velAlongNormal = rvx * nx + rvy * ny;

        // Sólo rebotan si se están acercando
        if (velAlongNormal < 0) {
          const invM1 = isLocked1 ? 0 : 1 / (w1.mass || 1);
          const invM2 = isLocked2 ? 0 : 1 / (w2.mass || 1);
          const totalInvM = invM1 + invM2;

          if (totalInvM > 0) {
            // Magnitud del impulso normal con restitución (rebote)
            const impulseMag = -(1 + bounce) * velAlongNormal / totalInvM * forceMul;
            const ix = impulseMag * nx;
            const iy = impulseMag * ny;

            // Fricción tangencial en el choque
            const velAlongTangent = rvx * tx + rvy * ty;
            const frictionMag = -velAlongTangent / totalInvM * friction;
            const fx = frictionMag * tx;
            const fy = frictionMag * ty;

            const totalImpulseX = ix + fx;
            const totalImpulseY = iy + fy;

            // Cambio instantáneo de aceleración y velocidad
            const effDt = Math.max(0.016, dt || 0.016);
            if (!isLocked1) {
              const dvx1 = -totalImpulseX * invM1;
              const dvy1 = -totalImpulseY * invM1;
              w1.vx += dvx1;
              w1.vy += dvy1;
              w1.ax = dvx1 / effDt;
              w1.ay = dvy1 / effDt;
              w1.onCollide();
            }
            if (!isLocked2) {
              const dvx2 = totalImpulseX * invM2;
              const dvy2 = totalImpulseY * invM2;
              w2.vx += dvx2;
              w2.vy += dvy2;
              w2.ax = dvx2 / effDt;
              w2.ay = dvy2 / effDt;
              w2.onCollide();
            }
          }
        }
      }
    }
  }
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
    DOM.reticle.classList.remove('hidden');
    DOM.reticle.classList.remove('locking');
    DOM.reticleLabel.textContent = 'PROCESANDO';
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
  // 1. SIEMPRE actualizar las coordenadas de los puntos activos de interacción
  // (mouse, manos OpenPose, articulaciones) para que NUNCA se congelen en ningún estado.
  const cp = appState.trackingConfig.collisionPoints || {};
  const collisionPointOn = (key, fallback = true) => (key in cp ? cp[key] !== false : fallback);
  const testPoints = [];
  if (collisionPointOn('mouse', true)) {
    // PEDIDO: con el mouse alcanza con pasar por encima de la palabra para que se vaya
    // llenando (antes habia que mantener apretado y el clic la seleccionaba de golpe).
    // OJO: solo mientras el mouse se esta usando (lastUserActivity lo marca el mousemove).
    // Si no, el puntero virtual se queda quieto en el CENTRO de la pantalla y llenaba
    // palabras solo, disparando la secuencia sin que nadie toque nada.
    const movReciente = appState.mouseMovido && appState.lastUserActivity && (Date.now() - appState.lastUserActivity) < VENTANA_MOUSE_MS;
    if (movReciente) {
      testPoints.push({ x: appState.cursorX, y: appState.cursorY, name: appState.isUsingMouse ? 'PUNTERO_MOUSE' : 'PUNTERO_CENTRAL' });
    }
  }

  if (appState.trackingConfig.bodyCollision) {
    const minConf = appState.trackingConfig.minConfidence || 0.45;
    const candidates = [
      { idx: 15, name: 'MANO_IZQ', key: 'manoIzq', fallback: true },
      { idx: 16, name: 'MANO_DER', key: 'manoDer', fallback: true },
      { idx: 19, name: 'DEDO_IZQ', key: 'dedoIzq', fallback: false },
      { idx: 20, name: 'DEDO_DER', key: 'dedoDer', fallback: false },
      { idx: 13, name: 'CODO_IZQ', key: 'codoIzq', fallback: false },
      { idx: 14, name: 'CODO_DER', key: 'codoDer', fallback: false },
      { idx: 0, name: 'CENTRO_FACIAL', key: 'centroFacial', fallback: false }
    ];

    const playerList = (appState.players && appState.players.length > 0)
      ? appState.players
      : (appState.lastLandmarks && appState.lastLandmarks.length > 0 ? [{ id: 1, landmarks: appState.lastLandmarks }] : []);

    for (let pIdx = 0; pIdx < playerList.length; pIdx++) {
      const pl = playerList[pIdx];
      const lms = pl.landmarks;
      if (!lms || lms.length === 0) continue;
      const prefix = playerList.length > 1 ? `J${pl.id}_` : '';

      for (const c of candidates) {
        if (!collisionPointOn(c.key, c.fallback)) continue;
        const lm = lms[c.idx];
        if (lm && (lm.visibility === undefined || lm.visibility >= minConf)) {
          testPoints.push({
            x: (1.0 - lm.x) * window.innerWidth,
            y: lm.y * window.innerHeight,
            name: `${prefix}${c.name}`
          });
        }
      }
    }
  }

  appState.activeInteractionPoints = testPoints;

  // Si está en procesamiento de haiku, secuestro o reseteo, los puntos se siguen moviendo pero no interactúan con palabras
  if (appState.currentState === STATES.PROCESSING ||
    appState.currentState === STATES.HIJACK ||
    appState.currentState === STATES.RESET) {
    return;
  }

  let foundTarget = false;
  let targetIndex = -1;
  let lockingPoint = null;

  for (let i = 0; i < appState.floatingWords.length; i++) {
    const word = appState.floatingWords[i];
    if (word.isCaught) continue;

    for (const pt of testPoints) {
      const dx = word.x - pt.x;
      const dy = word.y - pt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= (word.radius + 38) * RADIO_COLISION_MULT) {
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
  // El sistema unificado trabaja con EXACTAMENTE 3 palabras: si ya hay 3
  // capturadas (o el ciclo pasó a procesar), se ignora una captura extra que
  // pudiera disparar la proximidad durante los últimos milisegundos de INTERACT.
  if (appState.caughtWords.length >= 3) return;
  if (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK) return;
  appState.targetedWordIndex = -1;
  appState.dwellTimer = 0;

  playSound('catch');

  appState.caughtWords.push(word.text);
  const slotIdx = appState.caughtWords.length - 1;

  // Sistema unificado: se preserva el objeto y se desliza hacia su slot
  const fIdx = appState.floatingWords.indexOf(word);
  if (fIdx !== -1) appState.floatingWords.splice(fIdx, 1);
  appState.selectedWordObjects.push(word);
  word.moveToStaging(slotIdx);

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
  'amor': 'TRABAJADOR',
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
  'gobierno': 'PATRÓN',
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
  'ciervo': 'MATERIA',
  'pantera': 'SIGILO',

  // 3. FILOSOFÍA & COSMOS
  'existencia': 'INSTANCIA',
  'filosofía': 'ONTOLOGÍA',
  'mente': 'PROCESADOR',
  'conciencia': 'FEEDBACK',
  'universo': 'MATRIZ',
  'razón': 'LÓGICA',
  'muerte': 'EXTINCIÓN',
  'infinito': 'PROGRESO',
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
  'minerales': 'ACTIVOS',
  'café': 'MEJORADOR',
  'cafe': 'MEJORADOR',
  'amistad': 'SINERGIA',
  'sueño': 'PROYECCIÓN',
  'libertad': 'AUTONOMÍA',
  'salud': 'CAPITAL',
  'comida': 'INSUMO',
  'agua': 'RECURSO',
  'aprendizaje': 'MEJORA',
  'error': 'OPORTUNIDAD'
};

// Reduce un término frío a UN SOLO TOKEN: corta en el primer separador (guion
// bajo, espacio, guion, punto) y se queda con ese segmento.
//   OPTIMO_LUJO            -> OPTIMO
//   PATRÓN     -> PATRÓN
//   CAJA NEGRA MONETIZABLE -> CAJA
// El guion bajo está PROHIBIDO en la obra: el término frío es siempre UNA palabra.
function primerTokenDeTerminoFrio(txt) {
  const limpio = String(txt == null ? '' : txt)
    .replace(/[^a-zA-ZáéíóúüÁÉÍÓÚÜñÑ]+/g, ' ')   // fuera números, _ , puntuación, emojis
    .trim();
  const primero = limpio ? limpio.split(/\s+/)[0] : '';
  return primero.toUpperCase();
}

function sanitizeColdToken(raw, fallbackWord = '') {
  if (!raw || typeof raw !== 'string') return getColdSynonym(fallbackWord);
  // REGLA DURA DE LA OBRA: el término frío es SIEMPRE UNA SOLA PALABRA (sin guion
  // bajo, sin espacios). Si el modelo devuelve un compuesto se toma el segmento
  // que encabeza el concepto y se descarta el resto.
  const result = primerTokenDeTerminoFrio(raw);
  return result.length >= 2 ? result : getColdSynonym(fallbackWord);
}

function getColdSynonym(word) {
  const clean = (word || '').toLowerCase().trim();
  // Todo lo que sale de acá pasa por primerTokenDeTerminoFrio(): aunque el mapa
  // tuviera un valor compuesto, afuera nunca se ve un guion bajo.
  if (COLD_AI_SYNONYMS[clean]) {
    return primerTokenDeTerminoFrio(COLD_AI_SYNONYMS[clean]) || 'PROCESO';
  }
  // Coincidencia parcial o por raíz semántica
  for (const [k, v] of Object.entries(COLD_AI_SYNONYMS)) {
    if (clean.startsWith(k) || k.startsWith(clean)) {
      return primerTokenDeTerminoFrio(v) || 'PROCESO';
    }
  }
  // Respaldo analógico: conserva la raíz semántica de la palabra humana pero la resignifica
  // en clave fría, técnica y PRODUCTIVA (capital, rendimiento, optimización, escala).
  // Banco de respaldo: SIEMPRE términos de UNA sola palabra (antes armaba
  // compuestos tipo PROTOCOLO_DE_X y el guion bajo terminaba en pantalla).
  const PRODUCTIVE_WORDS = [
    'PROTOCOLO', 'RENDIMIENTO', 'OPTIMIZACIÓN', 'CALIBRACIÓN', 'CAPITALIZACIÓN',
    'MONETIZACIÓN', 'ESCALADO', 'PRODUCTIVIDAD', 'SINERGIA', 'INDICADOR',
    'MÉTRICA', 'EFICIENCIA', 'AUTOMATIZACIÓN', 'PROCESO'
  ];
  const hash = clean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PRODUCTIVE_WORDS[Math.abs(hash) % PRODUCTIVE_WORDS.length];
}

// ============================================================================
// ESCENARIO DE RESIGNIFICACIÓN & SÍNTESIS IA (ANIMACIÓN FUNDIDO + GLITCH + OBJETOS UNIFICADOS)
// ============================================================================
async function startResignificationSequence() {
  // CANDADO: si ya hay una secuencia corriendo, no arrancar otra (evita que se
  // acumulen palabras auxiliares si un reset dispara un ciclo mientras la
  // anterior todavía está esperando la respuesta de Ollama).
  if (appState.resigning) return;
  appState.resigning = true;
  // Arranca limpio: si un ciclo anterior quedó a medias (p. ej. un reset en el
  // medio de la espera de Ollama), sus auxiliares se destruyen acá para que no
  // se acumulen palabras fantasma en la frase siguiente.
  (appState.auxiliaryWords || []).forEach(w => { try { w.destroy(); } catch (e) { } });
  appState.auxiliaryWords = [];
  appState.resignToken = (appState.resignToken || 0) + 1;
  const resignToken = appState.resignToken;
  const stale = () => resignToken !== appState.resignToken;

  // 1. Ocultar el cursor táctico y activar el fondo glitcheado suave
  DOM.reticle.classList.add('hidden');
  DOM.container.classList.add('state-glitching');

  // Fundido de salida para las palabras flotantes sobrantes
  appState.floatingWords.forEach(w => w.fadeOut());

  const caught = [...appState.caughtWords];
  const selectedWords = [...appState.selectedWordObjects];
  console.log('[RESIGNIFICACIÓN] 3 Palabras Humanas capturadas (Objetos Unificados):', caught);

  // Sincronizar por WebSocket al Universo 3D de Cúmulos (Inicia escaneo neural)
  broadcastCaughtWords(caught, { phase: 'processing_started' });
  emitAgentEvent('state', 'transición de máquina: STATE_INTERACT → STATE_PROCESSING', 'think', {
    from: 'STATE_INTERACT', to: 'STATE_PROCESSING', caught
  });
  emitAgentEvent('vector', `muestreo del campo semántico: ${caught.join(' · ')}`, 'think', {
    words: caught, dimensions: 384
  });

  // 2. Preparar el escenario: las 3 palabras elegidas BAJAN del borde superior
  //    al centro de la pantalla (ahí se reescriben).
  DOM.finalSpeechBox.classList.add('hidden');
  DOM.finalTypewriterText.textContent = '';
  if (DOM.desprocesandoBanner) DOM.desprocesandoBanner.classList.add('hidden');
  DOM.mutationStage.classList.remove('hidden');

  await Promise.all(selectedWords.map((wordObj, i) => wordObj.moveToCenter(i)));

  // Mostrar las 3 palabras 2 segundos antes de randomizar — y usar esa espera
  // para NARRAR el razonamiento (aparece en el Monólogo Interno de log.html).
  const oraculo = appState.config.ollamaModel || 'modelo local';
  emitReasoning(`[PENSAMIENTO] Recibo 3 conceptos humanos: ${caught.join(' · ')}.\n`);
  await wait(320);
  emitReasoning('[PENSAMIENTO] Proyecto cada término al campo semántico de 384 dimensiones y mido con qué otros conceptos resuena.\n');
  await wait(320);
  for (let i = 0; i < caught.length; i++) {
    emitReasoning(`[PENSAMIENTO]   · "${caught[i]}" → candidato frío: ${getColdSynonym(caught[i])} (lo que la máquina conserva al quitarle lo humano).\n`);
    await wait(280);
  }
  emitReasoning('[PENSAMIENTO] Pido 3 versos que RODEEN esos términos: el modelo puede nombrarlos, pero nunca enumerarlos juntos.\n');
  await wait(320);
  emitReasoning(`[PENSAMIENTO] Envío la consulta a ${oraculo} en modo stream: quiero ver cómo razona, no sólo el resultado.\n`);
  await wait(200);
  emitReasoning('[PENSAMIENTO] … abriendo cadena de pensamiento del modelo …\n');

  // Mostrar cartel "DESPROCESANDO"
  if (DOM.desprocesandoBanner) {
    DOM.desprocesandoBanner.classList.remove('hidden');
  }

  // Empezar a randomizar caracteres en bucle continuo MIENTRAS el modelo procesa
  selectedWords.forEach(wordObj => wordObj.startContinuousScramble());

  // Lanzar consulta a Ollama en segundo plano
  let aiResult = null;
  emitAgentEvent('inference', `consulta al núcleo de lenguaje: ${appState.config.ollamaModel}`, 'think', {
    model: appState.config.ollamaModel, temperature: 0.85
  });
  try {
    aiResult = await Promise.race([
      requestOllamaHijack(caught),
      wait(35000) // Timeout de 35s
    ]);
  } catch (err) {
    console.warn('[OLLAMA] Error en consulta:', err.message);
  }

  if (!aiResult) {
    console.log('[OLLAMA] Generando respuesta procedural de contingencia...');
    emitAgentEvent('inference', 'sin respuesta del modelo: contingencia procedural local', 'warn');
    aiResult = generateEmergencyHijack(caught);
    emitReasoning('[PENSAMIENTO] El modelo no respondió: no hay razonamiento que mostrar.\n');
    emitReasoning('[PENSAMIENTO] Activo el banco procedural local para no cortar la secuencia.\n');
    if (aiResult && aiResult.frase_generada) {
      emitReasoning(`[SÍNTESIS] Frase compuesta por el banco local:\n${aiResult.frase_generada}\n`);
    }
  } else {
    emitAgentEvent('inference', 'respuesta del modelo recibida y parseada', 'ok');
  }

  // REQUERIMIENTO: Solo un 5% de posibilidades por palabra de que la IA las cambie.
  // Si no (95% de los casos), quedan intactas las palabras que el usuario agregó.
  const AI_MUTATION_CHANCE = 0.05;
  const rawAiCandidates = (aiResult && Array.isArray(aiResult.nuevas_palabras) && aiResult.nuevas_palabras.length >= 3)
    ? aiResult.nuevas_palabras.map((w, idx) => sanitizeColdToken(w, caught[idx]))
    : caught.map(w => getColdSynonym(w));

  const coldSynonyms = [];
  const mutationFlags = [];

  for (let idx = 0; idx < caught.length; idx++) {
    const shouldMutate = Math.random() < AI_MUTATION_CHANCE;
    mutationFlags.push(shouldMutate);
    if (shouldMutate) {
      coldSynonyms.push(rawAiCandidates[idx]);
    } else {
      coldSynonyms.push(caught[idx]); // Preserva la palabra original del usuario
    }
  }

  emitAgentEvent('synthesis', 'términos resignificados resueltos (5% prob. mutación)', 'ok', {
    coldWords: [...coldSynonyms],
    pairs: caught.map((w, i) => `${w} → ${coldSynonyms[i]} (${mutationFlags[i] ? 'MUTADA 5%' : 'PRESERVADA'})`)
  });
  emitReasoning(`[SÍNTESIS] Términos resueltos: ${coldSynonyms.join(' · ')}.\n`);
  caught.forEach((w, i) => {
    emitReasoning(`[SÍNTESIS]   ${w}  →  ${coldSynonyms[i]} ${mutationFlags[i] ? '(mutación IA 5%)' : '(preservada del usuario)'}\n`);
  });
  emitReasoning(`[PENSAMIENTO] Reviso si la frase de ${oraculo} realmente usa los 3 términos y si no los enumera seguidos.\n`);

  // Decodificación progresiva hacia la nueva palabra de cada objeto unificado
  const p0 = selectedWords[0] ? selectedWords[0].resolveScramble(coldSynonyms[0].toUpperCase(), 1400) : Promise.resolve();
  await wait(220);
  const p1 = selectedWords[1] ? selectedWords[1].resolveScramble(coldSynonyms[1].toUpperCase(), 1400) : Promise.resolve();
  await wait(220);
  const p2 = selectedWords[2] ? selectedWords[2].resolveScramble(coldSynonyms[2].toUpperCase(), 1400) : Promise.resolve();

  await Promise.all([p0, p1, p2]);

  // Ocultar cartel de desprocesando
  if (DOM.desprocesandoBanner) {
    DOM.desprocesandoBanner.classList.add('hidden');
  }

  await wait(600);

  // Mostrar el discurso final: reacomodar las 3 palabras unificadas y hacer aparecer las auxiliares
  DOM.finalSpeechBox.classList.remove('hidden');
  // ENERGIA HASTA ACA: entra el contenedor del haiku -> se descargan las palabras.
  document.querySelectorAll('.organic-word-item.word-charged').forEach(function (el) {
    el.classList.remove('word-charged');
  });
  // Partículas corporativas desactivadas totalmente según requerimiento de diseño
  if (appState.corporateParticles) {
    appState.corporateParticles.stop();
  }

  const rawSpeech = (aiResult && aiResult.frase_generada && aiResult.frase_generada.trim().length > 10)
    ? aiResult.frase_generada.trim()
    : generateEmergencyHijack(caught).frase_generada;
  const speech = ensurePhraseUsesColdWords(rawSpeech, coldSynonyms, caught);
  emitAgentEvent('synthesis', 'haiku poético compuesto', 'ok', {
    phrase: speech
  });

  broadcastCaughtWords(caught, { coldWords: coldSynonyms, phrase: speech, phase: 'resignification' });

  // REORGANIZACIÓN DINÁMICA: Componer la frase completa con las 3 palabras transformadas en el medio y las auxiliares
  if (stale()) return;   // hubo un reset mientras esperábamos la IA: descartar
  // El HAIKU empieza a formarse ACÁ: recién en este momento el shader maestro
  // enciende el contenedor (estado HAIKU = weights.z). Antes, en PROCESSING, se ve
  // la animación de las palabras cambiando, sin caja.
  transitionTo(STATES.HIJACK);

  await composeFinalPhraseFlow(speech, selectedWords, coldSynonyms);

  // Mantener en pantalla por 7.5 segundos para lectura
  await wait(7500);

  // Fundido suave y retorno a IDLE
  if (appState.corporateParticles) {
    appState.corporateParticles.stop();
  }
  DOM.mutationStage.classList.add('hidden');
  DOM.container.classList.remove('state-glitching');
  await wait(900);

  if (stale()) return;
  handleStateReset();
  appState.resigning = false;
}

async function composeFinalPhraseFlow(speech, selectedWordObjs, coldSynonyms) {
  DOM.finalTypewriterText.innerHTML = '';
  const flowBox = document.createElement('div');
  flowBox.className = 'phrase-flow-container';
  DOM.finalTypewriterText.appendChild(flowBox);

  // 1) SANITIZACIÓN ESTRICTA: Garantizar SIEMPRE EXACTAMENTE 3 versos (3 oraciones, una por verso)
  let lines = String(speech || '').replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length > 3) {
    // Si vienen más de 3 líneas, consolidar las excedentes en el 3er verso con comas
    const tail = lines.slice(2).join(', ');
    lines = [lines[0], lines[1], tail];
  } else if (lines.length === 2) {
    // Si vienen 2 líneas, intentar dividir la más larga por signo de puntuación
    const longestIdx = lines[0].length >= lines[1].length ? 0 : 1;
    const parts = lines[longestIdx].split(/(?<=[,;])\s+/);
    if (parts.length >= 2) {
      if (longestIdx === 0) {
        lines = [parts[0], parts.slice(1).join(' '), lines[1]];
      } else {
        lines = [lines[0], parts[0], parts.slice(1).join(' ')];
      }
    } else {
      lines.push('EN SINTONÍA SINTÉTICA.');
    }
  } else if (lines.length === 1) {
    const parts = lines[0].split(/(?<=[,;.])\s+/).filter(Boolean);
    if (parts.length >= 3) {
      lines = [parts[0], parts[1], parts.slice(2).join(', ')];
    } else {
      const fallback = composeHaikuWithConcepts(coldSynonyms, selectedWordObjs.map(w => w.originalText || w.targetText));
      lines = fallback.split('\n').map(l => l.trim()).filter(Boolean);
    }
  } else if (lines.length === 0) {
    const fallback = composeHaikuWithConcepts(coldSynonyms, selectedWordObjs.map(w => w.originalText || w.targetText));
    lines = fallback.split('\n').map(l => l.trim()).filter(Boolean);
  }

  // Garantizar exactamente 3 oraciones limpias:
  // Convertir puntos internos a comas para que cada verso sea exactamente UNA sola oración continua sin cortes internos
  lines = lines.slice(0, 3).map((line, idx) => {
    let clean = line.replace(/\.(?!\s*$)/g, ',').replace(/[;:]+/g, ',');
    clean = clean.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
    if (idx < 2) {
      clean = clean.replace(/[.!?…]+$/, '');
    } else {
      if (!/[.!?…]$/.test(clean)) clean += '.';
    }
    return clean;
  });

  // 2) TAMAÑO DE TIPOGRAFÍA ADAPTATIVO: evita que cualquier verso se quiebre en dos líneas
  const maxLineChars = Math.max(...lines.map(l => l.length), 20);
  const availW = Math.min((window.innerWidth || 1920) * 0.72, 1360);
  let targetFontSize = Math.floor(availW / (maxLineChars * 0.62));
  targetFontSize = Math.max(26, Math.min(52, targetFontSize));

  document.documentElement.style.setProperty('--word-font-size-phrase', `${targetFontSize}px`);
  flowBox.style.setProperty('--word-font-size-phrase', `${targetFontSize}px`);

  const usedIndices = new Set();
  const reserved = []; // { wordObj, el } = hueco reservado por cada palabra transformada

  // ------------------------------------------------------------------------
  // 1) ARMADO (todavía invisible)
  //    Cada término frío reserva su hueco con un placeholder TRANSPARENTE de la
  //    misma tipografía (así el texto ya está maquetado en su lugar final) y las
  //    palabras auxiliares se crean ocultas (.aux-pending): ocupan su espacio
  //    pero no se ven, de modo que el layout NO se mueve cuando aparezcan.
  // ------------------------------------------------------------------------
  for (let l = 0; l < lines.length; l++) {
    const tokens = lines[l].split(/\s+/).filter(Boolean);
    const lineRow = document.createElement('div');
    lineRow.className = 'phrase-flow-row';
    lineRow.style.display = 'flex';
    lineRow.style.flexDirection = 'row';
    lineRow.style.flexWrap = 'nowrap';
    lineRow.style.whiteSpace = 'nowrap';
    lineRow.style.alignItems = 'center';
    lineRow.style.justifyContent = 'center';
    lineRow.style.gap = '8px';
    lineRow.style.width = '100%';
    lineRow.style.margin = '4px 0';
    lineRow.style.overflow = 'visible';
    flowBox.appendChild(lineRow);

    for (let t = 0; t < tokens.length; t++) {
      const rawToken = tokens[t];
      const cleanToken = rawToken.toUpperCase().replace(/[^A-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]/g, '');

      let matchIdx = -1;
      for (let i = 0; i < coldSynonyms.length; i++) {
        if (!usedIndices.has(i)) {
          const coldClean = coldSynonyms[i].toUpperCase().replace(/[^A-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]/g, '');
          if (cleanToken === coldClean || (cleanToken.length > 3 && coldClean.includes(cleanToken)) || (coldClean.length > 3 && cleanToken.includes(coldClean))) {
            matchIdx = i;
            break;
          }
        }
      }

      if (matchIdx !== -1 && selectedWordObjs[matchIdx]) {
        usedIndices.add(matchIdx);
        const ph = document.createElement('span');
        ph.className = 'phrase-placeholder';
        ph.textContent = coldSynonyms[matchIdx].toUpperCase();
        lineRow.appendChild(ph);
        reserved.push({ wordObj: selectedWordObjs[matchIdx], el: ph });
      } else {
        const auxWord = new FloatingWord(rawToken, 0, 0, WORD_STATES.AUXILIARY);
        appState.auxiliaryWords.push(auxWord);
        auxWord.el.classList.add('aux-pending');
        lineRow.appendChild(auxWord.el);
      }
    }
    const friosEnVerso = reserved.filter(r => lineRow.contains(r.el))
      .map(r => coldSynonyms[selectedWordObjs.indexOf(r.wordObj)] || r.wordObj.targetText || '?');
    const enlaces = lineRow.querySelectorAll('.organic-word-item.word-auxiliary').length;
    emitReasoning(`[ENSAMBLADO] Verso ${l + 1}/${lines.length} → ${friosEnVerso.length} término(s) frío(s)${friosEnVerso.length ? ' (' + friosEnVerso.join(', ') + ')' : ''} + ${enlaces} palabra(s) de enlace.\n`);
  }

  // Si alguna de las 3 no aparece en el texto, se le reserva lugar en su fila de verso (NUNCA en flowBox directo)
  for (let i = 0; i < selectedWordObjs.length; i++) {
    if (!usedIndices.has(i) && selectedWordObjs[i]) {
      const ph = document.createElement('span');
      ph.className = 'phrase-placeholder';
      ph.textContent = (selectedWordObjs[i].targetText || coldSynonyms[i] || '').toUpperCase();
      const targetRow = flowBox.children[i] || flowBox.children[flowBox.children.length - 1];
      if (targetRow) {
        targetRow.appendChild(ph);
      } else {
        flowBox.appendChild(ph);
      }
      reserved.push({ wordObj: selectedWordObjs[i], el: ph });
    }
  }

  // ------------------------------------------------------------------------
  // 2) VUELO: las 3 palabras transformadas salen del centro y viajan (una tras
  //    otra) hasta el hueco exacto que van a ocupar dentro de la frase.
  // ------------------------------------------------------------------------
  emitReasoning(`[ENSAMBLADO] Reservo ${reserved.length} hueco(s) con la métrica exacta y hago volar las palabras hasta ahí.\n`);
  await Promise.all(reserved.map(async (r, i) => {
    await wait(i * 170);
    const rect = r.el.getBoundingClientRect();
    playSound('catch');
    await r.wordObj.flyToElement(rect, 1200);
  }));

  // ------------------------------------------------------------------------
  // 3) LLEGADA: el objeto real reemplaza a su placeholder y RECIÉN AHÍ aparecen
  //    todas las palabras auxiliares de la frase final.
  // ------------------------------------------------------------------------
  reserved.forEach(({ wordObj, el }) => wordObj.moveToPhraseFlow(el.parentNode, el));
  await wait(150);

  emitReasoning(`[ENSAMBLADO] Las 3 palabras llegaron a su lugar. Aparecen ${appState.auxiliaryWords.length} palabras de enlace mezclando todas las letras.\n`);
  // REQUERIMIENTO 2: Efecto que mezcla todas las letras cuando aparece la frase del haiku
  const auxPromises = (appState.auxiliaryWords || []).map((auxWord, i) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (auxWord && auxWord.el) {
          auxWord.el.classList.remove('aux-pending');
        }
        if (auxWord && typeof auxWord.resolveScramble === 'function') {
          auxWord.resolveScramble(auxWord.text, 650 + Math.random() * 250).then(resolve);
        } else {
          resolve();
        }
      }, i * 55);
    });
  });
  await Promise.all(auxPromises);
  await wait(450);
}

async function requestOllamaHijack(words) {
  const coldList = words.map(w => getColdSynonym(w));
  const wordsJoined = words.join(', ');
  const coldJoined = coldList.join(', ');

  emitAgentEvent('inference', `Iniciando agente cognitivo: ${appState.config.ollamaModel}`, 'think', {
    model: appState.config.ollamaModel,
    words: words,
    coldWords: coldList
  });
  emitAgentEvent('think', `[${appState.config.ollamaModel}] Evaluando resonancia y antítesis para: ${wordsJoined} → ${coldJoined}...`, 'think');

  const userPrompt = `Palabras humanas elegidas: ${wordsJoined}
Conceptos cibernéticos correspondientes: ${coldJoined}

Misión poética:
Escribe un poema en formato HAIKU de EXACTAMENTE 3 versos (SON 3 LÍNEAS / 3 ORACIONES: NI UNA MÁS, NUNCA 4) (separados por \\n) concebido e inspirado ENTERAMENTE ALREDEDOR del significado de estos tres conceptos:
- Verso 1: debe construirse en torno a la idea de "${coldList[0]}", integrando la palabra en MAYÚSCULAS. Breve: 4 a 7 palabras.
- Verso 2: debe construirse en torno a la idea de "${coldList[1]}", integrando la palabra en MAYÚSCULAS. Breve: 4 a 7 palabras.
- Verso 3: debe construirse en torno a la idea de "${coldList[2]}", integrando la palabra en MAYÚSCULAS y expresando una revelación íntima en primera persona. Breve: 4 a 7 palabras.

REGLAS DE ORO:
0. Cada uno de los 3 conceptos es UNA SOLA PALABRA (sin guion bajo, sin espacios: si escribís OPTIMO_LUJO está MAL, va OPTIMO). No los cambies ni los compongas.
1. LONGITUD BREVE OBLIGATORIA: Cada verso debe tener entre 4 y 7 palabras (MÁXIMO 8 PALABRAS). Prohibido hacer versos largos o explicativos para que quepan en una sola línea horizontal.
2. CONTEO OBLIGATORIO: EXACTAMENTE 3 ORACIONES (una sola oración por verso). Verso 1 y 2 terminan en coma o sin punto. Verso 3 termina con un solo punto final. Prohibido poner dos oraciones o puntos dentro de un mismo verso. NUNCA agregues un cuarto verso.
3. El haiku debe formarse de manera directa y coherente ALREDEDOR de los conceptos elegidos. Prohibido usar frases genéricas desconectadas o hablar de temas ajenos.
4. Cada verso debe tener sentido sintáctico natural e impecable en español.

Responde ÚNICAMENTE un objeto JSON:
{
  "nuevas_palabras": ["${coldList[0]}", "${coldList[1]}", "${coldList[2]}"],
  "frase_generada": "Verso 1 breve sobre ${coldList[0]}\\nVerso 2 breve sobre ${coldList[1]}\\nVerso 3 breve sobre ${coldList[2]}."
}`;

  const payload = {
    model: appState.config.ollamaModel,
    prompt: userPrompt,
    system: appState.config.systemPrompt,
    format: 'json',
    stream: true,
    options: {
      num_predict: 350,
      temperature: 0.7,
      repeat_penalty: 1.15
    }
  };

  // 1) OLLAMA LOCAL (modelos de la máquina del visitante). Se prueban los
  //    candidatos: el configurado en el modal, localhost y 127.0.0.1.
  for (const ollamaBase of getOllamaUrls()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      emitAgentEvent('inference', `Conectando con motor local: ${ollamaBase}...`, 'think');

      const directRes = await fetch(ollamaBase + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (directRes.ok && directRes.body) {
        emitAgentEvent('think', `[${appState.config.ollamaModel}] Stream abierto. Procesando razonamiento en tiempo real...`, 'think');
        let fullResponse = '';
        let inThinkTag = false;
        const reader = directRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let streamBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split('\n');
          streamBuffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              if (chunk.response) {
                fullResponse += chunk.response;
                if (chunk.response.includes('<think>')) inThinkTag = true;
                emitAgentThought(chunk.response, inThinkTag, fullResponse);
                if (chunk.response.includes('</think>')) inThinkTag = false;
              }
            } catch (e) { }
          }
        }

        const parsed = parseOllamaResponse(fullResponse);
        if (parsed) {
          emitAgentEvent('inference', `inferencia completada en ${ollamaBase} (${payload.model})`, 'ok', {
            model: payload.model, endpoint: ollamaBase
          });
          emitAgentEvent('synthesis', `Haiku poético sintetizado: ${parsed.frase_generada.replace(/\n/g, ' / ')}`, 'ok', {
            coldWords: parsed.nuevas_palabras,
            phrase: parsed.frase_generada
          });
          return parsed;
        }
      }
    } catch (directErr) {
      console.warn('[OLLAMA] Sin respuesta en', ollamaBase, '::', directErr.message);
    }
  }

  console.warn('[OLLAMA] Ningún Ollama local respondió streaming, intentando vía backend Node...');

  try {
    emitAgentEvent('inference', 'Consultando proxy del servidor Node...', 'think');
    const proxyRes = await sbFetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, stream: false })
    });
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      const parsed = parseOllamaResponse(proxyData.response);
      if (parsed) {
        emitAgentThought(proxyData.response, false, proxyData.response);
        emitAgentEvent('synthesis', `Haiku completado vía proxy: ${parsed.frase_generada.replace(/\n/g, ' / ')}`, 'ok', {
          coldWords: parsed.nuevas_palabras,
          phrase: parsed.frase_generada
        });
        return parsed;
      }
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

// ============================================================================
// REGLA DURA: EL HAIKU SON SIEMPRE 3 ORACIONES (nunca 4)
// ----------------------------------------------------------------------------
// El modelo a veces devuelve 4 versos, o un verso con dos oraciones adentro.
// Acá se cuenta por ORACIÓN (cada tramo que cierra en . ! ? … ) y, si sobran,
// los sobrantes se funden hasta quedar EXACTAMENTE 3: primero los que están
// dentro del MISMO verso (así los 3 términos no se descolocan) y, si no
// alcanza, se fusionan los dos últimos. Al fusionar, el punto del primero pasa
// a coma: dos oraciones se convierten en UNA.
// Si hay menos de 3 no se toca nada: el chequeo de 3 versos ya recompone.
// ============================================================================
function fusionarDosOraciones(a, b) {
  const izq = String(a || '').trim().replace(/[.!?…]+$/, '');
  const der = String(b || '').trim();
  if (!izq) return der;
  if (!der) return izq;
  return izq + ', ' + der;
}

function normalizarHaikuTresOraciones(texto) {
  const crudo = String(texto == null ? '' : texto).replace(/\r/g, '').trim();
  if (!crudo) return crudo;

  const versos = crudo.split('\n').map(s => s.trim()).filter(Boolean);
  if (!versos.length) return crudo;

  const piezas = [];
  versos.forEach((v, idx) => {
    const trozos = v.split(/(?<=[.!?…])["'»”]?\s+/).map(s => s.trim()).filter(Boolean);
    (trozos.length ? trozos : [v]).forEach(t => piezas.push({ txt: t, verso: idx }));
  });

  while (piezas.length > 3) {
    let idx = -1;
    for (let i = piezas.length - 2; i >= 0; i--) {
      if (piezas[i].verso === piezas[i + 1].verso) { idx = i; break; }
    }
    if (idx < 0) idx = piezas.length - 2;
    const fusion = fusionarDosOraciones(piezas[idx].txt, piezas[idx + 1].txt);
    const versoOrigen = piezas[idx].verso;
    piezas.splice(idx, 2, { txt: fusion, verso: versoOrigen });
  }

  if (piezas.length < 3) return crudo;
  return piezas.map(p => p.txt).join('\n');
}

function cleanSpeechText(s) {
  if (Array.isArray(s)) {
    s = s.map(item => String(item || '').trim()).filter(Boolean).join('\n');
  }
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
    // REGLA DURA: el haiku sale SIEMPRE con 3 oraciones (nunca 4).
    return normalizarHaikuTresOraciones(str);
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
    if (rawSpeech && typeof rawSpeech === 'object' && !Array.isArray(rawSpeech)) {
      const firstVal = Object.values(rawSpeech)[0];
      const firstKey = Object.keys(rawSpeech)[0];
      if (Array.isArray(firstVal)) {
        rawSpeech = firstVal.join('\n');
      } else if (typeof firstVal === 'string' && firstVal.length > 10) {
        rawSpeech = firstVal;
      } else if (firstKey && firstKey.length > 10) {
        rawSpeech = firstKey;
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
      const arrayMatch = clean.match(/(?:frase_generada|frase|haiku)["']?\s*:\s*\[([\s\S]+?)\]/i);
      if (arrayMatch) {
        rawMatched = arrayMatch[1].split(',').map(s => s.replace(/["'\r\n]/g, '').trim()).filter(Boolean).join('\n');
      }
    }
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

// Helper gramatical para concordancia de género y artículos en español
function getArticleGrammar(word) {
  const clean = String(word || '').toUpperCase().trim();
  const isFem = clean.endsWith('A') || clean.endsWith('IÓN') || clean.endsWith('DAD') || clean.endsWith('TUD') || clean.endsWith('ENCIA') || clean.endsWith('ANCIA');
  return {
    el_la: isFem ? 'la' : 'el',
    del_al: isFem ? 'de la' : 'del',
    al_a: isFem ? 'a la' : 'al',
    en: isFem ? 'en la' : 'en el'
  };
}

// Categorías semánticas exhaustivas para generación armónica y coherente de Haikus
const SEMANTIC_CLUSTERS_DATA = {
  power: {
    words: new Set(['GESTIÓN', 'DESVIACIÓN', 'ORTODOXIA', 'HEGEMONÍA', 'COLECTIVIDAD', 'PATRÓN', 'APARATO', 'CONSENSO', 'DOCTRINA', 'ARBITRAJE', 'PROTOCOLO', 'AUTONOMÍA', 'ESTRUCTURA', 'COMANDO', 'VARIANZA', 'DOMINIO', 'NORMATIVA']),
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
    words: new Set(['CANIDO', 'FELINO', 'MEGABIOMA', 'DEPREDADOR', 'DOMINANTE', 'TRACCIÓN', 'CAZADOR', 'RECONOCEDOR', 'COLOSO', 'SONAR', 'BIOMASA', 'REPTIL', 'RADAR', 'INFILTRADOR', 'MATERIA', 'SIGILO']),
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
    words: new Set(['INSTANCIA', 'ONTOLOGÍA', 'PROCESADOR', 'FEEDBACK', 'MATRIZ', 'LÓGICA', 'EXTINCIÓN', 'PROGRESO', 'NÚCLEO', 'DATA', 'DETERMINISMO', 'ALEATORIEDAD', 'PROBABILIDAD', 'COLISIÓN', 'INDEXACIÓN', 'CONSTANTE', 'SIMETRÍA', 'VACÍO', 'SINGULARIDAD', 'FOTÓN', 'ATMÓSFERA']),
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
    words: new Set(['SINCRONIZAR', 'REGISTRO', 'VULNERABILIDAD', 'ATENUACIÓN', 'ACOPLAMIENTO', 'CACHE', 'HERTZ', 'LATENCIA', 'KERNEL', 'CONTACTO', 'CONDENSACIÓN', 'CICLO', 'CHASIS', 'INSTRUCCIÓN', 'INICIALIZACIÓN', 'RESET', 'LÍRICA', 'SENSOR', 'DISIPACIÓN', 'CIFRADO', 'PURGA', 'PARCHE', 'EXPOSICIÓN', 'SIMULACIÓN', 'CRONOMETRÍA', 'REAJUSTE', 'PULSO', 'REPOSO', 'DESCONEXIÓN']),
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
    words: new Set(['CONGLOMERADO', 'FLUJO', 'ELEVACIÓN', 'SUSTRATO', 'GÉRMEN', 'ESTRUCTURA', 'ATMÓSFERA', 'SOBRECARGA', 'CRISTAL', 'GENERADOR', 'ACTIVOS', 'TIERRA', 'BOSQUE', 'RÍO', 'MONTAÑA', 'OCÉANO', 'LLUVIA', 'VIENTO']),
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

function getSemanticCategoryCluster(word) {
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
}

// Generador de Haiku poético cohesivo que integra exactamente un término por verso
// contextualizado según la naturaleza y categoría semántica de cada palabra:
function composeHaikuWithConcepts(coldList = [], caughtWords = []) {
  const sanitize = (w) => primerTokenDeTerminoFrio(w);
  const pool = (coldList && coldList.length >= 3)
    ? coldList
    : (caughtWords && caughtWords.length >= 3 ? caughtWords.map(w => getColdSynonym(w)) : ['MEMORIA', 'TIEMPO', 'SILENCIO']);

  const a = sanitize(pool[0] || 'MEMORIA');
  const b = sanitize(pool[1] || 'DESTINO');
  const c = sanitize(pool[2] || 'VACÍO');

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
}

// Garantiza que la frase generada sea SIEMPRE un Haiku de 3 versos donde
// cada verso integra orgánicamente uno de los 3 conceptos transformados.
function ensurePhraseUsesColdWords(phrase, coldList = [], caughtWords = []) {
  const sanitize = (w) => primerTokenDeTerminoFrio(w);
  const validCold = (coldList && coldList.length >= 3)
    ? coldList.map(w => sanitize(w))
    : (caughtWords && caughtWords.length >= 3 ? caughtWords.map(w => sanitize(getColdSynonym(w))) : ['MEMORIA', 'TIEMPO', 'SILENCIO']);

  if (!phrase || typeof phrase !== 'string') {
    emitReasoning('[ENSAMBLADO] No llegó texto del modelo → armo el haiku con el banco procedural.\n');
    return composeHaikuWithConcepts(validCold, caughtWords);
  }

  const cleaned = cleanSpeechText(phrase);
  const badRep = hasDegenerativeRepetition(cleaned);
  if (!cleaned || cleaned.length < 10 || badRep) {
    emitReasoning(badRep
      ? '[ENSAMBLADO] La frase del modelo se repite de forma degenerativa → la descarto y recompongo.\n'
      : '[ENSAMBLADO] La frase del modelo viene vacía o demasiado corta → recompongo con el banco procedural.\n');
    return composeHaikuWithConcepts(validCold, caughtWords);
  }

  let lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 3) {
    const tail = lines.slice(2).join(', ');
    lines = [lines[0], lines[1], tail];
  } else if (lines.length === 1) {
    const parts = cleaned.split(/(?<=[,;.:])\s+/).filter(Boolean);
    if (parts.length >= 3) {
      lines = [parts[0], parts[1], parts.slice(2).join(', ')];
    }
  }

  // Si tiene exactamente 3 versos
  if (lines.length === 3) {
    // Sanitizar puntuaciones internas de cada verso para que cada uno sea estrictamente una sola oración
    lines = lines.map((l, idx) => {
      let c = l.replace(/\.(?!\s*$)/g, ',').replace(/[;:]+/g, ',').replace(/,\s*,/g, ',').trim();
      return (idx < 2) ? c.replace(/[.!?…]+$/, '') : (/[.!?…]$/.test(c) ? c : c + '.');
    });

    const c0 = normalizeForMatch(validCold[0]);
    const c1 = normalizeForMatch(validCold[1]);
    const c2 = normalizeForMatch(validCold[2]);

    const l0 = normalizeForMatch(lines[0]);
    const l1 = normalizeForMatch(lines[1]);
    const l2 = normalizeForMatch(lines[2]);

    // Verificar si las palabras frías están presentes en cada verso
    const has0 = l0.includes(c0) || (c0.length > 3 && l0.includes(c0.substring(0, 4)));
    const has1 = l1.includes(c1) || (c1.length > 3 && l1.includes(c1.substring(0, 4)));
    const has2 = l2.includes(c2) || (c2.length > 3 && l2.includes(c2.substring(0, 4)));

    emitReasoning(`[ENSAMBLADO] Chequeo verso por verso: ${validCold[0]} ${has0 ? 'OK' : 'FALTA'} · ${validCold[1]} ${has1 ? 'OK' : 'FALTA'} · ${validCold[2]} ${has2 ? 'OK' : 'FALTA'}.\n`);
    // Si los 3 versos contienen sus palabras, asegurar mayúsculas para la animación de flujo
    if (has0 && has1 && has2) {
      emitReasoning('[ENSAMBLADO] La frase del modelo pasa la validación (3 versos, cada uno con su término frío): la respeto tal cual.\n');
      const fixLineToken = (line, token) => {
        const regex = new RegExp(`\\b${token.replace(/_/g, '[_\\s]?')}\\b`, 'i');
        if (regex.test(line)) {
          return line.replace(regex, token);
        }
        const accentPattern = token.replace(/_/g, '[_\\s]?')
          .replace(/[aá]/gi, '[aáAÁ]')
          .replace(/[eé]/gi, '[eéEÉ]')
          .replace(/[ií]/gi, '[iíIÍ]')
          .replace(/[oó]/gi, '[oóOÓ]')
          .replace(/[uú]/gi, '[uúUÚ]');
        const regexAccent = new RegExp(`\\b${accentPattern}\\b`, 'i');
        if (regexAccent.test(line)) {
          return line.replace(regexAccent, token);
        }
        return line;
      };

      return [
        fixLineToken(lines[0], validCold[0]),
        fixLineToken(lines[1], validCold[1]),
        fixLineToken(lines[2], validCold[2])
      ].join('\n');
    }
  }

  // Si no pasó la validación de 3 versos con sus términos, generar un haiku poético
  // semántico garantizado que conecta profundamente los 3 conceptos.
  emitReasoning('[ENSAMBLADO] No cerró como 3 versos con sus 3 términos → recompongo con una plantilla de cláusulas separadas (nunca los enumera juntos).\n');
  return composeHaikuWithConcepts(validCold, caughtWords);
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
  // Invalida cualquier secuencia en vuelo: si estaba esperando a Ollama, al
  // volver va a ver el token viejo y no va a componer una frase fantasma.
  appState.resigning = false;
  appState.resignToken = (appState.resignToken || 0) + 1;
  if (appState.typewriterInterval) clearInterval(appState.typewriterInterval);
  if (appState.hijackResetTimeout) clearTimeout(appState.hijackResetTimeout);

  if (appState.corporateParticles) appState.corporateParticles.stop();
  if (DOM.desprocesandoBanner) DOM.desprocesandoBanner.classList.add('hidden');
  DOM.mutationStage.classList.add('hidden');
  DOM.finalSpeechBox.classList.add('hidden');
  DOM.finalTypewriterText.textContent = '';

  appState.caughtWords = [];

  // SISTEMA UNIFICADO DE PALABRAS: destruir los objetos del ciclo anterior.
  // Sin esto quedaban "palabras fantasma": los objetos seguían vivos en
  // selectedWordObjects/auxiliaryWords y el shader maestro les dibujaba círculos.
  (appState.selectedWordObjects || []).forEach(w => { try { w.destroy(); } catch (e) { } });
  appState.selectedWordObjects = [];
  (appState.auxiliaryWords || []).forEach(w => { try { w.destroy(); } catch (e) { } });
  appState.auxiliaryWords = [];

  DOM.container.className = '';
  applyRenderLayers();
  spawnInitialFloatingWords();

  if (gameWebSocket && gameWebSocket.readyState === WebSocket.OPEN) {
    try {
      gameWebSocket.send(JSON.stringify({ type: 'game3:state_reset', timestamp: Date.now() }));
    } catch (e) { }
  }
  try {
    localStorage.setItem('sincretismo_orders_event', JSON.stringify({ type: 'game3:state_reset', timestamp: Date.now() }));
  } catch (e) { }
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

// ============================================================================
// CALL TO ACTION POR INACTIVIDAD (ELEGÍ TU PALABRA...)
// ============================================================================
function markUserActivity() {
  appState.lastUserActivity = Date.now();
  hideIdleCta();
}

function showIdleCta() {
  if (appState.idleCtaVisible || !DOM.idleCta) return;
  appState.idleCtaVisible = true;
  DOM.idleCta.classList.remove('hidden');
}

function hideIdleCta() {
  if (!appState.idleCtaVisible) return;
  appState.idleCtaVisible = false;
  if (DOM.idleCta) DOM.idleCta.classList.add('hidden');
}

function updateIdleCta() {
  if (!DOM.idleCta) return;
  const enModal = DOM.configModal && !DOM.configModal.classList.contains('hidden');
  const enMutacion = DOM.mutationStage && !DOM.mutationStage.classList.contains('hidden');
  const bloqueado =
    appState.caughtWords.length > 0 ||
    appState.resigning ||
    enModal ||
    enMutacion ||
    (appState.currentState !== STATES.IDLE && appState.currentState !== STATES.INTERACT);
  if (bloqueado) { hideIdleCta(); return; }
  if (Date.now() - appState.lastUserActivity >= IDLE_CTA_DELAY_MS) showIdleCta();
}

// ============================================================================
// CICLO AUTOMÁTICO DE 15 SEGUNDOS PARA BIOMETRÍA Y DEPTH MAP
// ============================================================================
// ============================================================================
// PARPADEO ALEATORIO DE LOS MONITORES PiP (BIOMETRÍA FACIAL + DEPTH MAP)
// Cada monitor tiene su PROPIO reloj: se prende por Y segundos y se apaga por Z,
// con Y y Z sorteados en cada vuelta entre PIP_RANDOM_MIN_S y PIP_RANDOM_MAX_S
// (5 a 30 s). No se sincronizan entre sí: a veces coinciden, a veces no.
// ============================================================================
function pipRandomMs() {
  const s = PIP_RANDOM_MIN_S + Math.random() * (PIP_RANDOM_MAX_S - PIP_RANDOM_MIN_S);
  return Math.round(s * 1000);
}

function randomizePipPosition(which, pip) {
  if (!pip) return;
  const W = window.innerWidth || 1080;
  const H = window.innerHeight || 1920;
  const SIZES = { depth: [250, 220], face: [230, 250], leftHand: [220, 215], rightHand: [220, 215] };
  const dims = SIZES[which] || [230, 230];
  const cardW = dims[0];
  const cardH = dims[1];

  // REQUERIMIENTO 1: Posición random lejos del centro.
  // Dividimos la periferia en 6 zonas perimetrales exteriores evitando la zona central
  const marginX = 20;
  const marginY = 45;
  // Posiciones de TODOS los otros monitores visibles (para no solaparse).
  const otherPositions = Object.keys(appState.pipCycleVisible || {})
    .filter(k => k !== which && appState.pipCycleVisible[k] && appState.pipActivePositions && appState.pipActivePositions[k])
    .map(k => appState.pipActivePositions[k]);

  const candidates = [
    // Cuadrante superior izquierdo
    { x: marginX + Math.random() * Math.max(10, W * 0.15), y: marginY + Math.random() * Math.max(10, H * 0.10) },
    // Cuadrante superior derecho
    { x: W - cardW - marginX - Math.random() * Math.max(10, W * 0.15), y: marginY + Math.random() * Math.max(10, H * 0.10) },
    // Cuadrante inferior izquierdo
    { x: marginX + Math.random() * Math.max(10, W * 0.15), y: H - cardH - marginY - Math.random() * Math.max(10, H * 0.12) },
    // Cuadrante inferior derecho
    { x: W - cardW - marginX - Math.random() * Math.max(10, W * 0.15), y: H - cardH - marginY - Math.random() * Math.max(10, H * 0.12) },
    // Lateral izquierdo medio
    { x: marginX, y: H * 0.38 + (Math.random() - 0.5) * (H * 0.18) },
    // Lateral derecho medio
    { x: W - cardW - marginX, y: H * 0.38 + (Math.random() - 0.5) * (H * 0.18) }
  ];

  // Si hay algún otro monitor PiP visible, elegir una zona que no se solape
  let validCandidates = candidates;
  if (otherPositions.length > 0) {
    validCandidates = candidates.filter(c => otherPositions.every(otherPos => {
      const dx = Math.abs((c.x + cardW * 0.5) - (otherPos.x + otherPos.w * 0.5));
      const dy = Math.abs((c.y + cardH * 0.5) - (otherPos.y + otherPos.h * 0.5));
      return dx > (cardW * 0.95) || dy > (cardH * 0.95);
    }));
    if (validCandidates.length === 0) validCandidates = candidates;
  }

  const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];
  const posX = Math.max(marginX, Math.min(W - cardW - marginX, Math.round(chosen.x)));
  const posY = Math.max(marginY, Math.min(H - cardH - marginY, Math.round(chosen.y)));

  appState.pipActivePositions = appState.pipActivePositions || {};
  appState.pipActivePositions[which] = { x: posX, y: posY, w: cardW, h: cardH };

  pip.style.left = `${posX}px`;
  pip.style.top = `${posY}px`;
  pip.style.right = 'auto';
  pip.style.bottom = 'auto';
}

// Mapea la clave del monitor PiP a su tarjeta en el DOM.
function pipElement(which) {
  if (which === 'depth') return DOM.depthPip;
  if (which === 'face') return DOM.facePip;
  if (which === 'leftHand') return DOM.leftHandPip;
  if (which === 'rightHand') return DOM.rightHandPip;
  return null;
}

function setPipVisible(which, visible, now) {
  // Si no hay humano detectado, nunca activar monitor PiP
  if (visible && !appState.hasHuman) {
    visible = false;
  }
  // Si es monitor de mano, SOLO activar si la mano está trackeada en el jugador asignado
  if (visible && (which === 'leftHand' || which === 'rightHand')) {
    const lmIndex = which === 'leftHand' ? 15 : 16;
    const pIdx = (appState.pipPlayerAssign && appState.pipPlayerAssign[which] !== undefined)
      ? appState.pipPlayerAssign[which]
      : (which === 'leftHand' ? 0 : 1);
    const targetP = (appState.players && appState.players[pIdx]) ? appState.players[pIdx] : (appState.players ? appState.players[0] : null);
    const lms = targetP ? targetP.landmarks : appState.lastLandmarks;
    const lm = lms ? lms[lmIndex] : null;
    const vis = lm && lm.visibility !== undefined ? lm.visibility : (lm ? 0.9 : 0);
    // MISMA REGLA QUE EN renderHandCameras (pedido del usuario): confianza MUY alta y
    // muñeca NO pegada a la cabeza; si no, la ventanita se apaga (antes 0.25 dejaba
    // pasar muñecas mal detectadas sobre la cara).
    const cabeza = lms ? lms[0] : null;
    const hombro = lms ? (lms[11] || lms[12]) : null;
    const anchoRef = (cabeza && hombro) ? Math.hypot(hombro.x - cabeza.x, hombro.y - cabeza.y) : 0.22;
    const distCara = (lm && cabeza) ? Math.hypot(lm.x - cabeza.x, lm.y - cabeza.y) : 1.0;
    const pegadaALaCara = distCara < Math.max(MANO_PIP_MIN_DIST_CARA, anchoRef * 0.55);
    if (!lm || vis < MANO_PIP_MIN_VIS || pegadaALaCara) {
      visible = false;
    }
  }
  if (appState.pipCycleVisible[which] === visible) return;
  appState.pipCycleVisible[which] = visible;
  const pip = pipElement(which);
  if (pip) {
    if (visible) {
      // Requerimiento 1: Asignar a veces al Jugador 1 y a veces al Jugador 2
      if (appState.players && appState.players.length > 1) {
        if (!appState.pipPlayerAssign) appState.pipPlayerAssign = { face: 0, leftHand: 0, rightHand: 1 };
        appState.pipPlayerAssign[which] = Math.random() < 0.5 ? 0 : 1;
      }
      randomizePipPosition(which, pip);
      pip.classList.remove('hidden');
    } else {
      pip.classList.add('hidden');
    }
  }
  // Cada cambio de estado sortea CUÁNTO dura este tramo (prendido o apagado).
  appState.pipNextToggleAt[which] = now + pipRandomMs();
  if (visible) {
    updatePoseSegmentation();
    triggerPoseInference();
  }
}

function updatePipAutoCycle(now) {
  if (appState.pipCycleDisabledByUser) return;

  // Si la cámara no capta a ningún humano: asegurarse de que NINGÚN monitor PiP aparezca
  if (!appState.hasHuman) {
    PIP_CYCLE_KEYS.forEach((which) => {
      if (appState.pipCycleVisible[which]) {
        setPipVisible(which, false, now);
      } else {
        const el = pipElement(which);
        if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
      }
    });
    return;
  }

  PIP_CYCLE_KEYS.forEach((which) => {
    const proximo = appState.pipNextToggleAt[which];
    if (!proximo) {
      const desfase = pipRandomMs() * (which === 'depth' ? (0.25 + 0.75 * Math.random()) : 1);
      appState.pipNextToggleAt[which] = now + Math.round(desfase);
      return;
    }
    if (now >= proximo) setPipVisible(which, !appState.pipCycleVisible[which], now);
  });

  // Si el monitor facial está en su tramo visible y hay humano detectado
  if (appState.pipCycleVisible.face && DOM.faceCanvas && DOM.video && DOM.video.readyState >= 2) {
    if (appState.lastLandmarks && appState.lastLandmarks.length > 0) {
      renderFaceCamera(appState.lastLandmarks);
    }
  }

  // Monitores de MANO: se redibujan mientras estén visibles.
  if ((appState.pipCycleVisible.leftHand || appState.pipCycleVisible.rightHand) &&
    DOM.video && DOM.video.readyState >= 2 && appState.lastLandmarks && appState.lastLandmarks.length > 0) {
    renderHandCameras(appState.lastLandmarks);
  }
}

function mainLoop(currentTimestamp) {
  const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = currentTimestamp;

  // Verificación de timeout de presencia humana (si transcurren > 400ms sin frame positivo)
  if (appState.hasHuman && (currentTimestamp - (appState.lastHumanSeenTimestamp || 0) > 400)) {
    appState.hasHuman = false;
  }

  // Requerimiento 2: Ciclo de aparición/desaparición de los carteles PiP (solo si hay humano)
  updatePipAutoCycle(currentTimestamp);

  // 1. Suavizado (Lerp) del Cursor: Instantáneo si es mouse, calibrado si es cámara
  const lerpFactor = appState.isUsingMouse ? 0.65 : (appState.trackingConfig.smoothingFactor || 0.45);
  appState.cursorX += (appState.targetCursorX - appState.cursorX) * lerpFactor;
  appState.cursorY += (appState.targetCursorY - appState.cursorY) * lerpFactor;

  DOM.reticle.style.left = `${appState.cursorX}px`;
  DOM.reticle.style.top = `${appState.cursorY}px`;
  const isIdleForPointers = (appState.currentState === STATES.IDLE || appState.currentState === STATES.INTERACT) &&
                            (!appState.capturedWords || appState.capturedWords.length < 3);
  const showReticle = isIdleForPointers && (!appState.isUsingMouse || appState.isMouseDown);
  DOM.reticle.classList.toggle('hidden', !showReticle);

  // 2. Actualizar palabras flotantes y calcular físicas de colisión
  if (appState.currentState !== STATES.PROCESSING && appState.currentState !== STATES.HIJACK) {
    updateFloatingWordsPhysics(dt);
    for (let i = 0; i < appState.floatingWords.length; i++) {
      appState.floatingWords[i].update(dt);
    }
  }

  // 3. Evaluar colisiones / proximidad (con timestamp para throttle de audio)
  handleProximityAndInteractions(dt, currentTimestamp);

  // 3.b Call to action por inactividad
  updateIdleCta();

  // 4.0 Renderizar SHADER MAESTRO DE SALIDA (capa base de composición final)
  if (appState.masterOutputShader) {
    appState.masterOutputShader.render(currentTimestamp);
  }

  // 4.1 Renderizar Campo de Flujo Vectorial (Flow Field)
  if (appState.renderConfig.flowfieldEnabled || appState.trackingConfig.flowField) {
    renderFlowFieldOverlay(appState.lastLandmarks);
  }

  // 4.2 Renderizar Esqueleto OpenPose con dinámicas cinéticas a 60 FPS
  if ((FORZAR_CAMARA_SILUETA_OPENPOSE || appState.renderConfig.openposeEnabled || appState.trackingConfig.showOpenPose) && appState.lastLandmarks && appState.lastLandmarks.length > 0) {
    renderOpenPoseOverlay(appState.lastLandmarks);
  }

  // 4. Renderizar Shader ASCII sobre la cámara
  if (appState.asciiShader) {
    appState.asciiShader.render(currentTimestamp);
  }

  // 4.5 Renderizar Shader Frame Difference con Feedback (Requerimiento 2)
  if (appState.frameDiffShader) {
    appState.frameDiffShader.render();
  }

  // 4.8 Renderizar ruido procedural estático (sincronizado con el bucle principal)
  if (appState.drawStaticNoise) {
    appState.drawStaticNoise();
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

  // 5. Actualizar timestamp CCTV y telemetría (throttled a 10 FPS para evitar layout thrashing)
  if (!appState.lastHudUpdate || (currentTimestamp - appState.lastHudUpdate > 100)) {
    appState.lastHudUpdate = currentTimestamp;
    const now = new Date();
    if (DOM.hudTimestamp) {
      DOM.hudTimestamp.textContent = now.toISOString().replace('T', ' ').replace('Z', '');
    }
    if (DOM.telemetryCoords) {
      if (DOM.telemetryCoords) DOM.telemetryCoords.textContent = `X: ${Math.round(appState.cursorX).toString().padStart(3, '0')} | Y: ${Math.round(appState.cursorY).toString().padStart(3, '0')}`;
    }
  }

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
      d[i + 1] = lum;
      d[i + 2] = lum;
      d[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);
    tiles.push(tile);
    patterns.push(ctx.createPattern(tile, 'repeat'));
  }

  let tileIdx = 0;
  let ruidoPintado = false;
  function drawStaticNoise() {
    const isNoiseActive = Boolean(appState.renderConfig && appState.renderConfig.noiseEnabled);
    const isGlitchState = (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK);

    // MASTER OUTPUT = ÚLTIMA ETAPA. Mientras el shader maestro está activo, este
    // grano es POST-PROCESAMIENTO POR FUERA DEL SHADER: se pintaba ENCIMA del
    // canvas del maestro (por eso el "glitch" se seguía viendo aunque la salida
    // del shader fuese otra) y ensuciaba también la zona del contenedor del
    // haiku. Ahora, con el maestro activo, no se pinta (y si quedó un cuadro
    // viejo, se limpia una vez).
    const masterManda = Boolean(appState.masterOutputShader && appState.masterOutputShader.active);
    if (masterManda) {
      if (ruidoPintado) { ctx.clearRect(0, 0, canvas.width, canvas.height); ruidoPintado = false; }
      return;
    }

    if (isNoiseActive || isGlitchState) {
      tileIdx = (tileIdx + 1) % tiles.length;
      ctx.imageSmoothingEnabled = false;
      if (patterns[tileIdx]) {
        ctx.fillStyle = patterns[tileIdx];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ruidoPintado = true;
      }
    }
  }
  appState.drawStaticNoise = drawStaticNoise;
}

// ============================================================================
// ESCUCHADORES DE EVENTOS DEL DOM Y TECLADO
// ============================================================================
function setupEventListeners() {
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('keydown', initAudio, { once: true });

  // REQUERIMIENTO 1: MOUSE TRACKING DINÁMICO & CLIC DIRECTO
  window.addEventListener('mousemove', (e) => {
    markUserActivity();
    appState.mouseMovido = true;   // el puntero recien queda activo con un movimiento REAL
    // Si el usuario mueve el mouse, activamos control de mouse y anulamos OpenPose
    appState.isUsingMouse = true;
    appState.targetCursorX = e.clientX;
    appState.targetCursorY = e.clientY;
    appState.cursorX = e.clientX;
    appState.cursorY = e.clientY;

    if (DOM.telemetrySensor) DOM.telemetrySensor.textContent = 'MOUSE [CLIC DIRECTO]';
    if (DOM.telemetryConfidence) DOM.telemetryConfidence.textContent = '100%';
    DOM.inputModeLabel.textContent = 'TRACK: MOUSE';
    DOM.inputModeIcon.textContent = '🖱️';
  });

  // Clic en pantalla para atrapar palabra cercana inmediatamente
  window.addEventListener('mousedown', (e) => {
    appState.isMouseDown = true;
  });

  window.addEventListener('mouseup', () => {
    appState.isMouseDown = false;
  });

  window.addEventListener('mouseleave', () => {
    appState.isMouseDown = false;
  });

  // El clic ya NO captura palabras: la ÚNICA forma de capturar es mantener un
  // punto de interacción en contacto con la palabra hasta completar el dwell (3 s).
  window.addEventListener('click', () => {
    markUserActivity();
    appState.isUsingMouse = true;
  });

  // Touch (instalación con dedo sobre pantalla táctil)
  window.addEventListener('touchstart', () => markUserActivity(), { passive: true });
  window.addEventListener('touchmove', () => markUserActivity(), { passive: true });

  // Atajos de Teclado
  window.addEventListener('keydown', (e) => {
    markUserActivity();
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
        showToast('⟳ Recargando shaders en vivo...', 'info');
        appState.asciiShader.reloadShader().then(ok => {
          showToast(ok ? '✓ Shader ASCII recompilado correctamente' : '✕ Error compilando el shader ASCII — se mantiene el anterior', ok ? 'success' : 'error');
        });
      }
      // También recarga el SHADER MAESTRO (public/shaders/master-output.frag)
      if (appState.masterOutputShader && typeof appState.masterOutputShader.reloadShader === 'function') {
        appState.masterOutputShader.reloadShader().then(ok => {
          showToast(ok ? '✓ Shader MAESTRO de salida recompilado' : '✕ Error compilando el shader maestro — se mantiene el anterior', ok ? 'success' : 'error');
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
    else if (e.key === 'm' || e.key === 'M') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      toggleCctvHud();
    }
    else if (e.key === 'y' || e.key === 'Y') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      setSoloMaster(!appState.soloMaster);
    }
    else if (e.key === 's' || e.key === 'S') {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      // La tecla S la maneja el PROPIO include (toggle). Si acá llamáramos a
      // openPanel() sin condición el panel nunca cerraría: el include lo cierra y
      // este handler lo volvía a abrir. Sólo queda el aviso si no llegó a cargar.
      if (!(window.JPShaderInclude && typeof window.JPShaderInclude.isOpen === 'function')) {
        showToast('🎨 Iniciando JPShaderEditor Include...', 'info', 1600);
      }
    }
    else if (e.key === 'Escape') {
      closeConfigModal();
    }
  });

  // Botón JPShader Editor Include en HUD (indexador de combinaciones)
  if (DOM.btnOpenJPShader) {
    DOM.btnOpenJPShader.addEventListener('click', () => {
      const jp = window.JPShaderInclude;
      if (jp && typeof jp.togglePanel === 'function') jp.togglePanel();
      else if (jp && typeof jp.openPanel === 'function') jp.openPanel();
      else showToast('🎨 Iniciando JPShaderEditor Include...', 'info', 1600);
    });
  }

  // Click en el pill LIVE de Ollama para forzar verificación inmediata
  if (DOM.hudOllamaPill) {
    DOM.hudOllamaPill.addEventListener('click', () => {
      checkOllamaLiveStatus();
    });
  }

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

  // Panel MASTER RDM (patrón de fondo del shader del master output)
  buildMasterRdmPanel();

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
        appState._uiFromServer = true;
        applyUiColors();            // ya guarda en localStorage
        guardarPaletaEnServidor();  // y en config.json del server
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
      appState.trackingConfig.boneWidth = parseFloat(e.target.value);
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
      appState.trackingConfig.pointRadius = parseFloat(e.target.value);
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

  if (DOM.cfgTrackLeftHand) {
    DOM.cfgTrackLeftHand.addEventListener('change', (e) => {
      appState.trackingConfig.showLeftHand = e.target.checked;
      appState.renderConfig.leftHandEnabled = e.target.checked;
      if (DOM.cfgRenderLeftHandToggle) DOM.cfgRenderLeftHandToggle.checked = e.target.checked;
      if (DOM.leftHandPip) DOM.leftHandPip.classList.toggle('hidden', !e.target.checked);
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  if (DOM.cfgTrackRightHand) {
    DOM.cfgTrackRightHand.addEventListener('change', (e) => {
      appState.trackingConfig.showRightHand = e.target.checked;
      appState.renderConfig.rightHandEnabled = e.target.checked;
      if (DOM.cfgRenderRightHandToggle) DOM.cfgRenderRightHandToggle.checked = e.target.checked;
      if (DOM.rightHandPip) DOM.rightHandPip.classList.toggle('hidden', !e.target.checked);
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }

  if (DOM.cfgTrackHandZoom) {
    DOM.cfgTrackHandZoom.addEventListener('input', (e) => {
      appState.trackingConfig.handZoom = parseFloat(e.target.value);
      if (DOM.valTrackHandZoom) DOM.valTrackHandZoom.textContent = Number(e.target.value).toFixed(1);
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
        if (DOM.telemetrySensor) DOM.telemetrySensor.textContent = `MEDIAPIPE [${anchorName}]`;
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
      appState.pipCycleDisabledByUser = true;
      appState.trackingConfig.showDepthMap = false;
      if (DOM.depthPip) DOM.depthPip.classList.add('hidden');
      if (DOM.cfgTrackDepth) DOM.cfgTrackDepth.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Depth Map ocultado', 'info');
    });
  }

  if (DOM.btnCloseFacePip) {
    DOM.btnCloseFacePip.addEventListener('click', () => {
      appState.pipCycleDisabledByUser = true;
      appState.trackingConfig.showFaceCamera = false;
      if (DOM.facePip) DOM.facePip.classList.add('hidden');
      if (DOM.cfgTrackFace) DOM.cfgTrackFace.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Cámara Facial ocultado', 'info');
    });
  }

  if (DOM.btnCloseLeftHandPip) {
    DOM.btnCloseLeftHandPip.addEventListener('click', () => {
      appState.pipCycleDisabledByUser = true;
      appState.trackingConfig.showLeftHand = false;
      appState.renderConfig.leftHandEnabled = false;
      if (DOM.leftHandPip) DOM.leftHandPip.classList.add('hidden');
      if (DOM.cfgTrackLeftHand) DOM.cfgTrackLeftHand.checked = false;
      if (DOM.cfgRenderLeftHandToggle) DOM.cfgRenderLeftHandToggle.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Mano Izquierda ocultado', 'info');
    });
  }

  if (DOM.btnCloseRightHandPip) {
    DOM.btnCloseRightHandPip.addEventListener('click', () => {
      appState.pipCycleDisabledByUser = true;
      appState.trackingConfig.showRightHand = false;
      appState.renderConfig.rightHandEnabled = false;
      if (DOM.rightHandPip) DOM.rightHandPip.classList.add('hidden');
      if (DOM.cfgTrackRightHand) DOM.cfgTrackRightHand.checked = false;
      if (DOM.cfgRenderRightHandToggle) DOM.cfgRenderRightHandToggle.checked = false;
      saveTrackingConfigToStorage();
      showToast('Monitor Mano Derecha ocultado', 'info');
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

  // Control de Cámara: Reconexión manual, selector de dispositivo y click en estado
  if (DOM.btnReconnectCam) {
    DOM.btnReconnectCam.addEventListener('click', reconnectWebcamManual);
  }
  if (DOM.calibCamStatus) {
    DOM.calibCamStatus.addEventListener('click', reconnectWebcamManual);
  }
  if (DOM.cfgCameraSelect) {
    DOM.cfgCameraSelect.addEventListener('change', (e) => {
      const devId = e.target.value;
      if (devId) {
        localStorage.setItem('cambiapalabras_camera_device_id', devId);
      } else {
        localStorage.removeItem('cambiapalabras_camera_device_id');
      }
      initWebcamAndPose(devId || null, true);
    });
  }

  if (DOM.cfgTrackBodyCollision) {
    DOM.cfgTrackBodyCollision.addEventListener('change', (e) => {
      appState.trackingConfig.bodyCollision = e.target.checked;
      saveTrackingConfigToStorage();
    });
  }

  // Modo selector de colisión: cada punto puede prenderse/apagarse por separado
  [
    [DOM.cfgColPointMouse, 'mouse'],
    [DOM.cfgColPointManoIzq, 'manoIzq'],
    [DOM.cfgColPointManoDer, 'manoDer'],
    [DOM.cfgColPointDedoIzq, 'dedoIzq'],
    [DOM.cfgColPointDedoDer, 'dedoDer'],
    [DOM.cfgColPointCodoIzq, 'codoIzq'],
    [DOM.cfgColPointCodoDer, 'codoDer'],
    [DOM.cfgColPointCentroFacial, 'centroFacial']
  ].forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener('change', (e) => {
      if (!appState.trackingConfig.collisionPoints) appState.trackingConfig.collisionPoints = {};
      appState.trackingConfig.collisionPoints[key] = e.target.checked;
      saveTrackingConfigToStorage();
    });
  });
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

  // 4b. Flow Field (sincronizado bidireccionalmente con Tab Tracking)
  if (DOM.cfgRenderFlowfieldToggle) {
    DOM.cfgRenderFlowfieldToggle.addEventListener('change', (e) => {
      appState.renderConfig.flowfieldEnabled = e.target.checked;
      appState.trackingConfig.flowField = e.target.checked;
      if (DOM.cfgTrackFlowField) DOM.cfgTrackFlowField.checked = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
      if (!e.target.checked && DOM.flowfieldCanvas) {
        const ctx = DOM.flowfieldCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.flowfieldCanvas.width, DOM.flowfieldCanvas.height);
      } else if (e.target.checked && appState.lastLandmarks) {
        renderFlowFieldOverlay(appState.lastLandmarks);
      }
    });
  }
  if (DOM.cfgRenderFlowfieldOpacity) {
    DOM.cfgRenderFlowfieldOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.renderConfig.flowfieldOpacity = val / 100;
      if (DOM.valRenderFlowfieldOpacity) DOM.valRenderFlowfieldOpacity.textContent = val;
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

  // 7b. Monitores PiP de MANOS (izquierda / derecha, sincronizados con Tab Tracking)
  if (DOM.cfgRenderLeftHandToggle) {
    DOM.cfgRenderLeftHandToggle.addEventListener('change', (e) => {
      appState.renderConfig.leftHandEnabled = e.target.checked;
      appState.trackingConfig.showLeftHand = e.target.checked;
      if (DOM.cfgTrackLeftHand) DOM.cfgTrackLeftHand.checked = e.target.checked;
      saveTrackingConfigToStorage();
      applyRenderLayers();
    });
  }
  if (DOM.cfgRenderRightHandToggle) {
    DOM.cfgRenderRightHandToggle.addEventListener('change', (e) => {
      appState.renderConfig.rightHandEnabled = e.target.checked;
      appState.trackingConfig.showRightHand = e.target.checked;
      if (DOM.cfgTrackRightHand) DOM.cfgTrackRightHand.checked = e.target.checked;
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

  // 11. Velocidad de Animación del Noise (Glitch Master Output)
  if (DOM.cfgRenderNoiseSpeed) {
    DOM.cfgRenderNoiseSpeed.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.renderConfig.noiseSpeed = val;
      if (appState.glitchConfig) appState.glitchConfig.noiseSpeed = val;
      if (DOM.valRenderNoiseSpeed) DOM.valRenderNoiseSpeed.textContent = val.toFixed(1);
      const valGlitchNoise = document.getElementById('val-glitch-noise-speed');
      const slGlitchNoise = document.getElementById('cfg-glitch-noise-speed');
      if (valGlitchNoise) valGlitchNoise.textContent = val.toFixed(2);
      if (slGlitchNoise) slGlitchNoise.value = val;
      saveRenderConfigToStorage();
      saveGlitchConfigToStorage();
    });
  }

  // ==========================================================================
  // TAB: EVENTOS DE GLITCH & ENVELOPE DE SECUENCIA
  // ==========================================================================
  function bindGlitchEnvSlider(id, key, isDur) {
    const sl = document.getElementById('cfg-env-' + id);
    const val = document.getElementById('val-env-' + id);
    if (!sl) return;
    sl.addEventListener('input', (e) => {
      const n = parseFloat(e.target.value);
      if (!appState.glitchConfig) appState.glitchConfig = JSON.parse(JSON.stringify(DEFAULT_GLITCH_CONFIG));
      if (!appState.glitchConfig.envelope) appState.glitchConfig.envelope = { ...DEFAULT_GLITCH_CONFIG.envelope };
      appState.glitchConfig.envelope[key] = n;
      if (val) val.textContent = isDur ? n.toFixed(1) : n.toFixed(2);
      saveGlitchConfigToStorage();
    });
  }
  bindGlitchEnvSlider('idle', 'idle', false);
  bindGlitchEnvSlider('thinking', 'thinking', false);
  bindGlitchEnvSlider('haiku', 'haiku', false);
  bindGlitchEnvSlider('dur', 'duration', true);

  const selGlitchCurve = document.getElementById('cfg-env-curve');
  if (selGlitchCurve) {
    selGlitchCurve.addEventListener('change', (e) => {
      if (!appState.glitchConfig.envelope) appState.glitchConfig.envelope = { ...DEFAULT_GLITCH_CONFIG.envelope };
      appState.glitchConfig.envelope.curve = e.target.value;
      saveGlitchConfigToStorage();
    });
  }

  // Botones de prueba de estado
  const btnGlitchTestIdle = document.getElementById('cfg-glitch-test-idle');
  if (btnGlitchTestIdle) {
    btnGlitchTestIdle.addEventListener('click', () => {
      appState.glitchConfig.testPreviewState = 'idle';
      updateCpGlitchButtonsUI('idle');
      showToast('▶ Previsualizando estado REPOSO (IDLE)', 'info', 1200);
    });
  }

  const btnGlitchTestThink = document.getElementById('cfg-glitch-test-thinking');
  if (btnGlitchTestThink) {
    btnGlitchTestThink.addEventListener('click', () => {
      appState.glitchConfig.testPreviewState = 'thinking';
      updateCpGlitchButtonsUI('thinking');
      showToast('▶ Previsualizando estado PENSANDO (THINKING)', 'info', 1200);
    });
  }

  const btnGlitchTestHaiku = document.getElementById('cfg-glitch-test-haiku');
  if (btnGlitchTestHaiku) {
    btnGlitchTestHaiku.addEventListener('click', () => {
      appState.glitchConfig.testPreviewState = 'haiku';
      updateCpGlitchButtonsUI('haiku');
      showToast('▶ Previsualizando estado SECUESTRO (HAIKU)', 'info', 1200);
    });
  }

  const btnGlitchTestAuto = document.getElementById('cfg-glitch-test-auto');
  if (btnGlitchTestAuto) {
    btnGlitchTestAuto.addEventListener('click', () => {
      appState.glitchConfig.testPreviewState = null;
      updateCpGlitchButtonsUI(null);
      showToast('↺ Volviendo al seguimiento EN VIVO de la obra', 'info', 1200);
    });
  }

  // Bypass / Override Manual
  const chkGlitchManual = document.getElementById('cfg-glitch-manual-override');
  const grpGlitchManual = document.getElementById('cfg-glitch-manual-group');
  const slGlitchManual = document.getElementById('cfg-glitch-manual-val');
  const valGlitchManual = document.getElementById('val-glitch-manual');

  if (chkGlitchManual) {
    chkGlitchManual.addEventListener('change', (e) => {
      appState.glitchConfig.manualOverride = e.target.checked;
      if (grpGlitchManual) {
        grpGlitchManual.style.opacity = e.target.checked ? '1' : '0.4';
        grpGlitchManual.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      }
      saveGlitchConfigToStorage();
    });
  }

  if (slGlitchManual) {
    slGlitchManual.addEventListener('input', (e) => {
      const n = parseFloat(e.target.value);
      appState.glitchConfig.manualGlitchAmount = n;
      if (valGlitchManual) valGlitchManual.textContent = n.toFixed(2);
      saveGlitchConfigToStorage();
    });
  }

  // Velocidad de Noise en pestaña Glitch
  const slGlitchNoise = document.getElementById('cfg-glitch-noise-speed');
  const valGlitchNoise = document.getElementById('val-glitch-noise-speed');
  if (slGlitchNoise) {
    slGlitchNoise.addEventListener('input', (e) => {
      const n = parseFloat(e.target.value);
      appState.glitchConfig.noiseSpeed = n;
      appState.renderConfig.noiseSpeed = n;
      if (valGlitchNoise) valGlitchNoise.textContent = n.toFixed(2);
      if (DOM.valRenderNoiseSpeed) DOM.valRenderNoiseSpeed.textContent = n.toFixed(1);
      if (DOM.cfgRenderNoiseSpeed) DOM.cfgRenderNoiseSpeed.value = n;
      saveGlitchConfigToStorage();
      saveRenderConfigToStorage();
    });
  }

  // Checkboxes y Sliders de los 5 Uniforms
  const glitchUniformKeys = [
    { id: 'block', key: 'blockIntensity' },
    { id: 'size', key: 'blockSize' },
    { id: 'chroma', key: 'chromaIntensity' },
    { id: 'vhs', key: 'vhsNoiseIntensity' },
    { id: 'tearing', key: 'edgeTearingIntensity' }
  ];

  glitchUniformKeys.forEach(uk => {
    const chk = document.getElementById('cfg-glitch-anim-' + uk.id);
    const sl = document.getElementById('cfg-glitch-param-' + uk.id);
    const val = document.getElementById('val-glitch-' + uk.id);

    if (chk) {
      chk.addEventListener('change', (e) => {
        if (!appState.glitchConfig.params[uk.key]) {
          appState.glitchConfig.params[uk.key] = { value: 0.5, animated: true };
        }
        appState.glitchConfig.params[uk.key].animated = e.target.checked;
        saveGlitchConfigToStorage();
      });
    }

    if (sl) {
      sl.addEventListener('input', (e) => {
        const n = parseFloat(e.target.value);
        if (!appState.glitchConfig.params[uk.key]) {
          appState.glitchConfig.params[uk.key] = { value: 0.5, animated: true };
        }
        appState.glitchConfig.params[uk.key].value = n;
        if (val) val.textContent = n.toFixed(2);
        saveGlitchConfigToStorage();
      });
    }
  });

  // Botón restablecer valores predeterminados de Glitch
  const btnGlitchReset = document.getElementById('btn-glitch-reset-defaults');
  if (btnGlitchReset) {
    btnGlitchReset.addEventListener('click', () => {
      appState.glitchConfig = JSON.parse(JSON.stringify(DEFAULT_GLITCH_CONFIG));
      applyGlitchConfigToUI();
      saveGlitchConfigToStorage();
      showToast('↺ Glitch y Envelope restaurados a valores óptimos', 'success');
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
  if (DOM.cfgPartFontSizeCenter) {
    DOM.cfgPartFontSizeCenter.addEventListener('input', (e) => {
      appState.particlesConfig.fontSizeCenter = parseInt(e.target.value, 10);
      if (DOM.valPartFontSizeCenter) DOM.valPartFontSizeCenter.textContent = e.target.value;
      applyParticlesConfig();
    });
  }
  if (DOM.cfgPartFontSizePhrase) {
    DOM.cfgPartFontSizePhrase.addEventListener('input', (e) => {
      appState.particlesConfig.fontSizePhrase = parseInt(e.target.value, 10);
      if (DOM.valPartFontSizePhrase) DOM.valPartFontSizePhrase.textContent = e.target.value;
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
  if (DOM.cfgPartMaxSpeed) {
    DOM.cfgPartMaxSpeed.addEventListener('input', (e) => {
      appState.particlesConfig.maxSpeed = parseFloat(e.target.value);
      if (DOM.valPartMaxSpeed) DOM.valPartMaxSpeed.textContent = Number(e.target.value).toFixed(1);
      applyParticlesConfig();
    });
  }
  if (DOM.btnPartReset) {
    DOM.btnPartReset.addEventListener('click', () => {
      appState.particlesConfig = {
        fontFamily: 'share-tech',
        fontSize: 24,
        fontSizeCenter: 56,
        fontSizePhrase: 48,
        color: '#ffffff',
        outline: 1.0,
        outlineGlow: true,
        lifetime: 0,
        maxWords: 9,
        speed: 1.0,
        maxSpeed: 2.0
      };
      applyParticlesConfig();
      syncParticlesInputs();
      showToast('↺ Variables de partículas restauradas a valores predeterminados', 'info');
    });
  }

  // Controladores de Físicas y Colisiones (Pestaña FÍSICAS & COLISIÓN)
  if (DOM.cfgPhysEnabled) {
    DOM.cfgPhysEnabled.addEventListener('change', (e) => {
      appState.physicsConfig.enabled = e.target.checked;
      if (DOM.valPhysEnabled) {
        DOM.valPhysEnabled.textContent = e.target.checked ? 'ACTIVO' : 'DESACTIVADO';
        DOM.valPhysEnabled.style.color = e.target.checked ? '#ff000d' : '#888';
      }
      applyPhysicsConfig();
    });
  }

  if (DOM.cfgPhysBounce) {
    DOM.cfgPhysBounce.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      appState.physicsConfig.bounce = val;
      if (DOM.valPhysBounce) DOM.valPhysBounce.textContent = e.target.value;
      applyPhysicsConfig();
    });
  }

  if (DOM.cfgPhysFriction) {
    DOM.cfgPhysFriction.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      appState.physicsConfig.friction = val;
      if (DOM.valPhysFriction) DOM.valPhysFriction.textContent = e.target.value;
      applyPhysicsConfig();
    });
  }

  if (DOM.cfgPhysForce) {
    DOM.cfgPhysForce.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.physicsConfig.collisionForce = val;
      if (DOM.valPhysForce) DOM.valPhysForce.textContent = val.toFixed(1);
      applyPhysicsConfig();
    });
  }

  if (DOM.cfgPhysRadius) {
    DOM.cfgPhysRadius.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.physicsConfig.collisionRadius = val;
      if (DOM.valPhysRadius) DOM.valPhysRadius.textContent = val;
      applyPhysicsConfig();
    });
  }

  if (DOM.cfgPhysWallBounce) {
    DOM.cfgPhysWallBounce.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      appState.physicsConfig.wallBounce = val;
      if (DOM.valPhysWallBounce) DOM.valPhysWallBounce.textContent = e.target.value;
      applyPhysicsConfig();
    });
  }

  if (DOM.btnResetPhysics) {
    DOM.btnResetPhysics.addEventListener('click', () => {
      appState.physicsConfig = {
        enabled: true,
        bounce: 0.75,
        friction: 0.05,
        collisionForce: 1.0,
        collisionRadius: 48,
        wallBounce: 0.80
      };
      syncPhysicsInputs();
      applyPhysicsConfig();
      showToast('↺ Físicas restauradas a valores predeterminados', 'info');
    });
  }

  const btnGotoPhysics = document.getElementById('btn-goto-physics');
  if (btnGotoPhysics) {
    btnGotoPhysics.addEventListener('click', () => {
      const physTab = document.querySelector('.modal-tab-btn[data-tab="tab-physics"]');
      if (physTab) physTab.click();
    });
  }

  // Botón restaurar calibración por defecto
  if (DOM.btnResetCalibration) {
    DOM.btnResetCalibration.addEventListener('click', () => {
      appState.trackingConfig = {
        showOpenPose: false,
        drawBones: true,
        drawLandmarks: true,
        boneWidth: 0.5,
        pointRadius: 0.75,
        minConfidence: 0.5,
        colorTheme: 'cyberpunk',
        bodyCollision: true,
        collisionPoints: { mouse: true, manoIzq: true, manoDer: true, dedoIzq: false, dedoDer: false, codoIzq: false, codoDer: false, centroFacial: false },
        showDepthMap: false,
        depthMode: 'cyberpunk',
        depthContrast: 1.5,
        depthInShader: true,
        bodyColor: 'neon-green',
        showFaceCamera: false,
        faceZoom: 1.8,
        faceReticle: true,
        faceSmoothing: true,
        showLeftHand: false,
        showRightHand: false,
        handZoom: 1.6,
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
    } catch (err) { }
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
      } catch (err) { }
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
  applyGlitchConfigToUI();
  populateCameraDevicesSelect();
  DOM.configStatusMsg.textContent = '';
  DOM.configModal.classList.remove('hidden');
  fetchAndPopulateOllamaModels();
}

function closeConfigModal() {
  DOM.configModal.classList.add('hidden');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
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

  // 1.2 Inicializar SHADER MAESTRO DE SALIDA (composición final en GPU).
  // Es la capa base visible: cámara + depth + silueta + círculos de palabras +
  // estado. Las capas de entrada dejan de mostrarse (clase master-output-active,
  // que se agrega sólo si el shader compila) y las palabras/partículas quedan
  // POR ENCIMA. Editá public/shaders/master-output.frag y recargá (tecla R).
  if (DOM.masterCanvas) {
    appState.masterOutputShader = new MasterOutputShader(DOM.masterCanvas, DOM.video);
    // Arranque en modo SOLO MASTER OUTPUT: ?solo=1 (o ?solo=master)
    try {
      const qSolo = new URLSearchParams(window.location.search).get('solo');
      if (qSolo === '1' || qSolo === 'true' || qSolo === 'master') {
        setTimeout(function () { setSoloMaster(true); }, 1200);
      }
    } catch (e) { }
  }

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

  // 2.75 Cargar configuración de Glitch & Envelope de secuencia
  loadGlitchConfigFromStorage();

  // 2.8 Cargar configuración visual de partículas, shader ASCII y colores UI
  loadVisualConfigFromStorage();

  // 2.9 Garantizar Modo Mouse por defecto en arranque (MediaPipe en standby pasivo a 60 FPS)
  setInputMode('mouse');

  // 3. Cargar lista de modelos detectados en Ollama local y monitoreo LIVE
  fetchAndPopulateOllamaModels();
  checkOllamaLiveStatus();
  setInterval(() => {
    if (appState.hudMenuVisible || (DOM.cctvHud && !DOM.cctvHud.classList.contains('hud-hidden'))) {
      checkOllamaLiveStatus();
    }
  }, 6000);

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
