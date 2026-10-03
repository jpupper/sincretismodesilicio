import * as THREE from '../libs/three.module.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';

/* ==========================================================================
   PALETA ÚNICA ROJO / NEGRO del Universo 3D de Cúmulos.
   Cada categoría toma su color de esta rampa monócroma (por índice), así que
   el color libre que se elija en la biblioteca de categorías ya NO se usa acá.
   ========================================================================== */
const CLUSTER_RED_RAMP = [
  0xff2020, 0xb00000, 0xff4d3d, 0x8a0000,
  0xe01010, 0xc41a1a, 0xff5252, 0x990000
];

/** Deja la primera letra en mayúscula (el banco de palabras viene en minúsculas). */
function capitalizeFirst(str) {
  const s = String(str ?? '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
import { clusterManager } from '../engine/clusterManager.js';
import { soundFX } from '../audio/soundFX.js';

/**
 * GLSL 3D Simplex Noise Shared Generator
 */
const glslNoiseCommon = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

/**
 * GLSL Vertex Shader for Electric Lightning Noise (Hover / Warp Aura)
 */
const electricVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/**
 * GLSL Fragment Shader for Electric Lightning Noise
 */
const electricFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorCyan;
  uniform vec3 uColorPurple;
  uniform vec3 uColorWhite;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  ${glslNoiseCommon}

  void main() {
    vec3 p = vPosition * 0.58;
    float t = uTime * 2.8;

    float n1 = snoise(p + vec3(0.0, t * 0.9, 0.0));
    float n2 = snoise(p * 2.2 + vec3(-t * 1.3, 0.0, t * 0.7));
    float n3 = snoise(p * 4.0 + vec3(t * 0.5, -t * 1.2, 0.0));

    float edge1 = 1.0 - smoothstep(0.0, 0.065, abs(n1 - 0.05));
    float edge2 = 1.0 - smoothstep(0.0, 0.055, abs(n2 + 0.14));
    float edge3 = 1.0 - smoothstep(0.0, 0.045, abs(n3 - 0.22));

    float sparks = edge1 * 1.35 + edge2 * 1.05 + edge3 * 0.75;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normalize(vNormal)));
    fresnel = pow(fresnel, 2.4);

    vec3 plasmaColor = mix(uColorCyan, uColorPurple, sin(uTime * 3.5 + vPosition.y * 0.8) * 0.5 + 0.5);
    vec3 finalColor = plasmaColor * sparks * 2.6;
    finalColor += uColorWhite * pow(sparks, 2.8) * 2.2;
    finalColor += uColorCyan * fresnel * 0.8;

    float alpha = clamp(sparks * 1.45 + fresnel * 0.6, 0.0, 1.0);
    if (alpha < 0.05) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * GLSL Vertex Shader for Radiating Electric Ray Burst Corona
 */
const rayCoronaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * GLSL Fragment Shader for Radiating Electric Ray Burst Corona
 */
const rayCoronaFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorCore;
  uniform vec3 uColorRay;
  uniform vec3 uColorSpark;
  varying vec2 vUv;

  ${glslNoiseCommon}

  void main() {
    if (uIntensity <= 0.001) discard;
    vec2 st = vUv - vec2(0.5);
    float dist = length(st) * 2.0;
    if (dist > 1.0 || dist < 0.14) discard;

    float angle = atan(st.y, st.x);
    float t = uTime * 7.5;

    // Rayos eléctricos radiales multifrecuencia de alta energía
    float r1 = sin(angle * 14.0 + t + snoise(vec3(st * 4.5, t * 0.45)) * 3.5);
    float r2 = cos(angle * 26.0 - t * 1.5 + snoise(vec3(st * 8.5, -t * 0.55)) * 4.5);
    float r3 = sin(angle * 42.0 + t * 2.2);

    float spike1 = pow(clamp(r1 * 0.5 + 0.5, 0.0, 1.0), 5.5);
    float spike2 = pow(clamp(r2 * 0.5 + 0.5, 0.0, 1.0), 7.5);
    float spike3 = pow(clamp(r3 * 0.5 + 0.5, 0.0, 1.0), 9.5);

    float rays = spike1 * 0.70 + spike2 * 0.50 + spike3 * 0.35;

    // Corona flare falloff: orificio central para preservar la geometría del planeta intacta
    float coreMask = smoothstep(0.24, 0.44, dist);
    float edgeMask = smoothstep(1.0, 0.48, dist);
    float flare = rays * coreMask * edgeMask;

    // Anillo de pulso eléctrico
    float ring = exp(-pow((dist - 0.40) * 14.0, 2.0)) * 0.85;
    float totalAlpha = (flare * 1.6 + ring * 0.9) * uIntensity;
    if (totalAlpha < 0.02) discard;

    vec3 col = mix(uColorRay, uColorCore, spike1);
    col = mix(col, uColorSpark, pow(spike2, 2.0) * 0.85);
    col += uColorSpark * ring * 0.7;

    gl_FragColor = vec4(col * (1.3 + uIntensity * 1.8), clamp(totalAlpha, 0.0, 1.0));
  }
`;

/**
 * GLSL Vertex Shader for Bio-Electric Neurons
 * Somatic membrane breathing, micro-dendritic ripples, action potential spikes, and order overdrive
 */
const neuronVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathePhase;
  uniform float uActivity;
  uniform float uIsOrder;
  uniform float uHover;

  ${glslNoiseCommon}

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    // Respiración celular bio-eléctrica y ondulación micro-dendrítica del soma
    float t = uTime * 2.0 + uBreathePhase;
    float breathe = sin(t * 1.4) * 0.04 + sin(t * 3.2 + position.y * 1.5) * 0.025;
    float microNoise = snoise(position * 0.65 + vec3(0.0, uTime * 0.5, 0.0)) * 0.035;

    // Despolarización de espiga cuando la neurona se activa
    float activeSpike = uActivity * (sin(uTime * 8.0 + position.x * 2.2) * 0.07 + 0.04);

    // Alta excitación plasmática cuando esta neurona es una orden cerebral
    float orderExcitation = uIsOrder * (sin(uTime * 9.0) * 0.14 + 0.12);
    float hoverExcitation = uHover * 0.08;

    float totalDisp = breathe + microNoise + activeSpike + orderExcitation + hoverExcitation;
    vDisplacement = totalDisp;

    vec3 displacedPos = position + normal * totalDisp;
    vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/**
 * GLSL Fragment Shader for Bio-Electric Neurons
 * Resting dormant state (dim, translucent dark bio-cell) -> Active firing state (crackling electric lightning)
 */
const neuronFragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uCoreColor;
  uniform vec3 uElectricColor;
  uniform float uBreathePhase;
  uniform float uActivity;
  uniform float uIsOrder;
  uniform float uHover;
  uniform float uGlow;      // LLEGADA DE UN IMPULSO a esta neurona (0 = nada)

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  ${glslNoiseCommon}

  void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, norm));
    fresnel = pow(fresnel, 2.1);

    // Electricidad sináptica continua recorriendo la membrana somática
    float speed = 2.0 + uActivity * 2.5 + uIsOrder * 4.5;
    vec3 p = vPosition * 0.75;
    float t = uTime * speed + uBreathePhase;

    float n1 = snoise(p + vec3(0.0, t * 0.92, 0.0));
    float n2 = snoise(p * 2.2 + vec3(-t * 1.25, 0.0, t * 0.65));
    float n3 = snoise(p * 4.1 + vec3(t * 0.45, -t * 1.15, 0.0));

    // Umbral estricto para extraer filamentos eléctricos puros
    float edge1 = 1.0 - smoothstep(0.0, 0.072, abs(n1 - 0.04));
    float edge2 = 1.0 - smoothstep(0.0, 0.062, abs(n2 + 0.13));
    float edge3 = 1.0 - smoothstep(0.0, 0.052, abs(n3 - 0.19));

    float sparks = edge1 * 1.25 + edge2 * 1.0 + edge3 * 0.75;

    // Resplandor del núcleo interior (soma)
    float nucleus = pow(1.0 - fresnel, 1.9);

    // Factor de actividad normalizado
    float act = clamp(uActivity, 0.0, 1.0);

    // Color base celular bio-eléctrico: en reposo (dormido) es oscuro y translúcido
    // uBaseColor es el rojo del cluster (#ff000d / #e60000)
    vec3 dimBase = uBaseColor * (0.05 + act * 0.35);
    // Núcleo somático interno: carmesí rubí profundo y vivo, NUNCA blanco
    vec3 coreGlow = uCoreColor * (0.12 + act * 0.78);
    vec3 somaColor = mix(dimBase, coreGlow, nucleus * 0.75);

    // Filamentos sinápticos activos (chispas que recorren la neurona)
    // Usamos rojo bio-eléctrico intenso con sutil acento coral fuego (sin blanco puro)
    vec3 sparkColor = mix(uElectricColor, vec3(1.0, 0.32, 0.25), sparks * 0.45);
    somaColor += sparkColor * sparks * (0.22 + act * 0.95);

    // Vaina de mielina / membrana exterior (fresnel bioluminiscente rojizo)
    somaColor += uBaseColor * fresnel * (0.20 + act * 0.75);

    // Respuesta a interacción hover: destello sináptico bio-eléctrico carmesí (no blanco/cyan)
    if (uHover > 0.01) {
      somaColor += uElectricColor * (sparks * 0.65 + fresnel * 0.60) * uHover;
    }

    // ÓRDEN AL CEREBRO (GAME 3 / SICRE2): Inyección de energía plasma sobrecargado
    if (uIsOrder > 0.01) {
      vec3 orderGold = vec3(1.0, 0.70, 0.12);
      float pulse = 0.5 + 0.5 * sin(uTime * 6.5);
      somaColor = mix(somaColor, orderGold * (1.5 + pulse * 0.7), uIsOrder * 0.75);
      somaColor += vec3(1.0, 0.40, 0.15) * pow(sparks, 1.8) * 1.4 * uIsOrder;
      somaColor += vec3(1.0, 0.25, 0.05) * fresnel * 1.2 * uIsOrder;
    }

    // LLEGADA DE UN IMPULSO: destello breve de la membrana. A proposito MUCHO mas
    // suave que el planeta seleccionado (que ademas enciende rayos y corona).
    if (uGlow > 0.01) {
      float g = clamp(uGlow, 0.0, 1.4);
      somaColor += uElectricColor * (0.45 * fresnel + 0.28 * sparks + 0.18) * g;
    }

    // Garantía estricta anti-blanco: limitar canales verde y azul para que la neurona siempre
    // preserve su identidad de sinapsis bio-eléctrica carmesí sin deslavarse a blanco
    somaColor.g = min(somaColor.g, 0.26);
    somaColor.b = min(somaColor.b, 0.26);
    somaColor = min(somaColor, vec3(1.15, 0.26, 0.26));

    // Opacidad orgánica: translúcida en reposo, densa y brillante al disparar
    float finalAlpha = clamp(0.20 + act * 0.65 + uIsOrder * 0.04 + uHover * 0.25 + clamp(uGlow, 0.0, 1.4) * 0.22, 0.0, 0.95);
    gl_FragColor = vec4(somaColor, finalAlpha);
  }
`;

/**
 * GLSL Fragment Shader for Macro Ganglions (Cluster Centers)
 * Multi-layer synaptic vortex, solar nucleus, and coronal discharge
 */
const macroGanglionFragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uCoreColor;
  uniform float uBreathePhase;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  ${glslNoiseCommon}

  void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, norm));
    fresnel = pow(fresnel, 2.2);

    vec3 p = vPosition * 0.22;
    float t = uTime * 1.6 + uBreathePhase;

    float n1 = snoise(p + vec3(sin(t * 0.5) * 0.45, t * 0.75, 0.0));
    float n2 = snoise(p * 2.1 + vec3(-t * 0.95, 0.0, cos(t * 0.6) * 0.45));

    float edge1 = 1.0 - smoothstep(0.0, 0.08, abs(n1 - 0.05));
    float edge2 = 1.0 - smoothstep(0.0, 0.07, abs(n2 + 0.10));
    float sparks = edge1 * 1.35 + edge2 * 1.05;

    float coreNucleus = pow(1.0 - fresnel, 2.0);

    vec3 color = mix(uBaseColor * 0.45, uCoreColor, coreNucleus);
    vec3 sparkColor = mix(uBaseColor, vec3(1.0, 0.35, 0.25), sparks * 0.5);
    color += sparkColor * sparks * 1.35;
    color += uBaseColor * fresnel * 1.4;

    color.g = min(color.g, 0.28);
    color.b = min(color.b, 0.28);
    color = min(color, vec3(1.2, 0.28, 0.28));

    gl_FragColor = vec4(color, 0.92);
  }
`;

/**
 * SINCRETISMO DE SILICIO // UNIVERSO 3D DE NEURONAS & SINAPSIS
 * Simulación de red neuronal bio-eléctrica:
 * - Estado basal apagado/dormido por defecto (quiescent potential).
 * - Encendido y apagado dinámico de palabras y sinapsis según la proximidad de la cámara.
 * - Secuencia de búsqueda cognitiva: la red despolariza nodos y conecta conceptos
 *   mientras la IA procesa, hasta converger en las 3 palabras elegidas.
 */
/* ==========================================================================
   FONDO VIVO: estrellas que titilan + membranas "a lo celula".
   Es un HDRI procedural de fondo: sutil, siempre detras, animado. Todo en la
   misma paleta ROJO/NEGRO. No se recrea nunca (no depende de la biblioteca).
   ========================================================================== */
const fondoStarVertex = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aPhase;
  attribute float aSize;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.55 + 0.45 * sin(uTime * 0.9 + aPhase * 6.2831);
    vTw = 0.30 + 0.70 * tw;
    gl_PointSize = aSize * uPixelRatio * (720.0 / max(1.0, -mv.z)) * (0.65 + 0.7 * tw);
  }
`;
const fondoStarFragment = `
  uniform vec3 uColor;
  varying float vTw;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * vTw, a * a * vTw * 0.55);
  }
`;
const fondoCellVertex = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;
/* Membranas celulares: bandas finas del ruido + nucleos suaves. Muy tenue. */
const fondoCellFragment = glslNoiseCommon + `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vDir;

  float fbm4(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * snoise(p); p *= 2.02; a *= 0.5; }
    return s;
  }

  void main() {
    vec3 p = vDir * 2.35;
    float t = uTime * 0.035;
    float n = fbm4(p + vec3(t * 0.6, t * 0.22, -t));
    float membrana = smoothstep(0.26, 0.0, abs(n));          // paredes de las celulas
    float nucleo = smoothstep(0.32, 1.0, fbm4(p * 1.7 + vec3(-t * 0.4, t * 0.5, t * 0.3)));
    float resp = 0.82 + 0.18 * sin(uTime * 0.11);            // respiracion muy lenta
    float m = uIntensity * resp;
    vec3 col = uColorA * (membrana * 0.90) + uColorB * (nucleo * 0.40);
    float alpha = (membrana * 0.88 + nucleo * 0.22) * m;
    gl_FragColor = vec4(col * m, alpha);
  }
`;

export class ClusterCosmos3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;

    // AJUSTES EN VIVO (panel de la tecla P). TRES familias:
    //   TEXTOS   -> cartelPalabraPct | cartelCategoriaPct | cartelCapturaPct | hudPct
    //               (los tres primeros son la ESCALA del cartel en % de su tamano base;
    //                la tipografia del lienzo es automatica y nitida. hudPct = HUD DOM)
    //   PLANETAS -> planetaPalabraPct | planetaCategoriaPct | pelotitaPct (en %)
    //   CAMARA   -> camAnimVel | camWarpVel | camSeguirDist | camManualVel | camGiroPct
    // TODOS los rangos arrancan en 0 = apagado / quieto (pedido explicito del usuario).
    // Los sprites se re-dibujan (canvas nuevo) en vez de escalarse: agrandar no
    // pixela. Se guardan solos en localStorage y valen tambien para lo que se cree
    // despues (los carteles de palabras capturadas, por ejemplo).
    this.AJUSTES_KEY = 'sincretismo_cosmos_ajustes';
    this.AJUSTES_DEF = {
      cartelPalabraPct: 100, cartelCategoriaPct: 100, cartelCapturaPct: 100, hudPct: 100,
      planetaPalabraPct: 100, planetaCategoriaPct: 100, pelotitaPct: 100,
      pelotitaColor: '#ffd6d6', pelotitaElec: 100, pulsoVel: 100,
      rayosVel: 100, llegadaGlowPct: 100,
      fondoIntensidad: 100, fondoVel: 100,
      camAnimVel: 100, camWarpVel: 100, camSeguirDist: 58, camManualVel: 100, camGiroPct: 100
    };
    this.AJUSTES_MIN = {
      cartelPalabraPct: 0, cartelCategoriaPct: 0, cartelCapturaPct: 0, hudPct: 0,
      planetaPalabraPct: 0, planetaCategoriaPct: 0, pelotitaPct: 0,
      pelotitaElec: 0, pulsoVel: 0,
      rayosVel: 0, llegadaGlowPct: 0,
      fondoIntensidad: 0, fondoVel: 0,
      camAnimVel: 0, camWarpVel: 0, camSeguirDist: 0, camManualVel: 0, camGiroPct: 0
    };
    this.AJUSTES_TEXTO = ['pelotitaColor'];   // claves NO numericas (color hex)
    this.AJUSTES_MAX = {
      cartelPalabraPct: 400, cartelCategoriaPct: 400, cartelCapturaPct: 400, hudPct: 200,
      planetaPalabraPct: 400, planetaCategoriaPct: 400, pelotitaPct: 400,
      pelotitaElec: 300, pulsoVel: 400,
      rayosVel: 400, llegadaGlowPct: 300,
      fondoIntensidad: 300, fondoVel: 400,
      camAnimVel: 400, camWarpVel: 400, camSeguirDist: 220, camManualVel: 400, camGiroPct: 400
    };
    this.ajustes = this.leerAjustesTexto();
    // Multiplicadores vivos que usan el loop y los materiales.
    this.planetaK = { palabra: 1, categoria: 1, pelotita: 1 };
    this.pelotita = { color: new THREE.Color(0xffd6d6), elec: 1 };   // pelotitas de neurona
    this.COLOR_ELEC = new THREE.Color(0xffffff);
    this.cam = { animVel: 1, warpVel: 1, manualVel: 1, giro: 1, seguirDist: 58 };
    // VELOCIDAD DEL PULSO DE LAS NEURONAS y del FONDO (panel P): acumuladores de tiempo
    // escalado. Con 0% el pulso queda congelado (no avanza el tiempo de esos shaders ni
    // viajan los impulsos por los axones).
    this.pulsoMs = 0;
    this.fondoMs = 0;
    this.fondo = { intensidad: 1, vel: 1 };
    // VELOCIDAD DE LOS RAYOS (independiente del pulso de las pelotitas) y efecto de
    // LLEGADA de un impulso a un planeta: halo sutil + pico de brillo + rayos mas lentos.
    // Cada rig de rayos acumula su PROPIO tiempo (rig.tMs) para poder frenarse solo.
    this.arrivalSlowGlobal = 0;
    this.halosLlegada = [];
    this.haloTextura = null;
    this._ultimoHalo = 0;
    this.clusterCoreMeshes = [];
    // Altura de MUNDO (unidades de la escena) de cada cartel al 100%. El control del panel P
    // es un % sobre esto: lo que cambia es la ESCALA del cartel respecto del planeta. La
    // tipografia del lienzo va aparte y siempre con la misma densidad (LIENZO_PX_POR_UNIDAD)
    // con un piso, asi que achicar el cartel NO pixela el texto.
    this.TEXTO_BASE_WORLD = { word: 6.5, title: 30, badge: 16 };
    this.LIENZO_PX_POR_UNIDAD = 12;
    this.LIENZO_ALTO_MIN = 48;
    this.LIENZO_ALTO_MAX = 512;


    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.clustersData = [];
    this.clusterGroupMap = new Map();
    this.wordNodes = [];
    this.labelPool = [];

    // Electric Lightning Shader for Hover & Target Planet Lighting
    this.electricSphere = null;
    this.electricMaterial = null;

    // Flight controls
    this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, KeyQ: false, KeyE: false, Space: false, ShiftLeft: false };
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.isMouseDown = false;
    this.lastMouse = { x: 0, y: 0 };
    this.speed = 4.2;

    // Camera follow & Warp state (inspirado en CameraController de diploia)
    this.isWarping = false;
    this.followingNode = null;
    this.targetNode = null;
    this.warpTarget = new THREE.Vector3();
    this.warpTargetYaw = 0;
    this.warpTargetPitch = 0;
    this.warpProgress = 1;
    this.warpTime = 0;
    this.warpDuration = 1.4;

    this.followYaw = 0;
    this.followPitch = 0.25;
    this.followDistance = 58;
    this._prevPlanetPos = new THREE.Vector3();
    this._followInitialized = false;

    // Continuous Spaceship Flight / Neural Travel
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.flightProgress = 0;
    this.flightDuration = 26.0;
    this.flightNodes = [];

    // Global Interconnected Neural Mesh
    this.neuralMeshGroup = null;

    // Hover & Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();
    this.hoveredNode = null;
    this.targetNode = null;

    // WebSocket Sync
    this.ws = null;
    this.synapseGroup = null;

    // Red sináptica semántica bajo demanda
    this.synapseEdges = [];
    this.synapseFadeTimer = null;
    this.resignificationActive = false;
    this.breathePhase = 0;

    // Neuronas Vivas Bio-Eléctricas & Axones
    this.neuronMaterials = [];
    this.actionPotentials = [];
    this.orbitingDendrites = [];

    // Órdenes al Cerebro (Sincronización con Sicre2 / Game 3)
    this.activeOrders = [];
    this.orderBridgesGroup = null;
    this.orderBridges = [];
    this.demoSequenceTimer = null;

    // Búsqueda Cognitiva en Tiempo Real (IA pensando)
    this.isCognitiveSearching = false;
    this.cognitiveSearchTimer = null;
    this.searchTargetNodes = [];

    this.animId = null;
    this.lastTime = performance.now();

    this.init();
  }

  async init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0006);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 7000);
    this.camera.position.set(0, 150, 600);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xff000d, 1.2);
    dirLight.position.set(200, 500, 300);
    this.scene.add(dirLight);

    // 4. Background Starfield
    this.createStarfield();

    // 4.5 Procedural Electric Lightning Noise Mesh for hover and warp
    const electricGeo = new THREE.SphereGeometry(1, 32, 32);
    this.electricMaterial = new THREE.ShaderMaterial({
      vertexShader: electricVertexShader,
      fragmentShader: electricFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorCyan: { value: new THREE.Color(0xff000d) },
        uColorPurple: { value: new THREE.Color(0xff2631) },
        uColorWhite: { value: new THREE.Color(0xffd6d6) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.electricSphere = new THREE.Mesh(electricGeo, this.electricMaterial);
    this.electricSphere.visible = false;
    this.scene.add(this.electricSphere);

    // 4.6 Sistema de Rayos Eléctricos y Corona Radiante para planetas seleccionados/en vuelo
    this.initRayGlowSystem();

    // 5. Load Clusters and build 3D Systems
    this.clustersData = await clusterManager.load();
    this.buildClusterSystems();
    this.firmarBiblioteca();

    // Subscribe to cluster manager updates (cambios hechos en ESTA misma página)
    clusterManager.subscribe((newClusters) => {
      this.clustersData = newClusters;
      this.buildClusterSystems();
      this.updateClusterNavButtons();
      this.firmarBiblioteca();
    });

    // 5.b LA BIBLIOTECA DE CLUSTERS ES LA DUEÑA DE LOS NOMBRES Y LAS PALABRAS.
    // Este 3D los vuelve a leer del servidor solo, sin recargar la página:
    //   · al guardar en la Biblioteca (otra pestaña escribe localStorage),
    //   · cuando esta pestaña vuelve al frente,
    //   · y cada 20 s por las dudas.
    // Sólo reconstruye el universo si los datos cambiaron DE VERDAD.
    window.addEventListener('storage', (e) => {
      if (e.key === 'sincretismo_user_clusters') this.refrescarBiblioteca('guardado en la Biblioteca de Clusters');
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refrescarBiblioteca('la pestaña volvió al frente');
    });
    this._bibliotecaTimer = setInterval(() => this.refrescarBiblioteca('chequeo periódico'), 20000);

    // 6. Setup Controls & Listeners
    this.setupEvents();
    this.updateClusterNavButtons();

    // 7. WebSocket Synchronization con Game 3 y log.html
    this.initWebSocket();

    window.addEventListener('resize', () => this.handleResize());

    // PANTALLA COMPLETA = SOLO LOS PLANETAS. Al entrar se esconde TODO el resto
    // (menú de arriba, HUD de Sicre2, objetivo/coordenadas e instrucciones) con una
    // clase en el <body>; al salir vuelve todo. Ver css/cosmos-clusters.css.
    document.addEventListener('fullscreenchange', () => this.refrescarModoPantallaCompleta());
    document.addEventListener('webkitfullscreenchange', () => this.refrescarModoPantallaCompleta());
    this.refrescarModoPantallaCompleta();

    // Ajustes guardados del panel P (textos, planetas, HUD y camara).
    this.aplicarEscalaHUD();
    this.aplicarPlanetas();
    this.aplicarPelotitas();
    this.aplicarCamara();
    // Red de seguridad: si algo crea un cartel despues (o un refresh de la biblioteca lo
    // deja viejo), en <=2 s queda con el tamano elegido. Si nada cambio, no hace nada.
    this._ajustesTimer = setInterval(() => this.aplicarTodo(), 2000);

    // La fuente de consola puede terminar de cargar DESPUES de dibujar los carteles
    // (los textos del 3D son CANVAS, no DOM): cuando esta lista se fuerzan a re-dibujar
    // para que no queden con la tipografia de reserva.
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(() => { try { this.forzarRedibujoTextos(); } catch (e) {} });
    }
  }

  /**
   * FONDO VIVO (HDRI procedural): estrellas que titilan + membranas "a lo celula".
   * Intermedio entre un cielo de estrellas y una placa de celulas: sin volumen
   * geometria, muy sutil y siempre detras de todo. Anima con el tiempo escalado del
   * panel P (FONDO -> velocidad) y su intensidad sale de FONDO -> intensidad.
   */
  createStarfield() {
    // --- 1) Estrellas que titilan (cada una con fase y tamano propios) ---
    const starCount = 2600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const phase = new Float32Array(starCount);
    const size = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      // Cascara esferica: nada de estrellas apiladas en el centro.
      const r = 900 + Math.random() * 2100;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      pos[i * 3 + 1] = Math.cos(ph) * r;
      pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
      phase[i] = Math.random();
      size[i] = 0.7 + Math.random() * 1.9;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

    this.bgStarMat = new THREE.ShaderMaterial({
      vertexShader: fondoStarVertex,
      fragmentShader: fondoStarFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uColor: { value: new THREE.Color(0xff6b6b) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    this.bgStars = new THREE.Points(geo, this.bgStarMat);
    this.bgStars.frustumCulled = false;
    this.scene.add(this.bgStars);

    // --- 2) Membranas celulares (esfera invertida alrededor de todo) ---
    this.bgCellMat = new THREE.ShaderMaterial({
      vertexShader: fondoCellVertex,
      fragmentShader: fondoCellFragment,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uColorA: { value: new THREE.Color(0x3d0009) },
        uColorB: { value: new THREE.Color(0x1c0004) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.bgCells = new THREE.Mesh(new THREE.SphereGeometry(3400, 48, 32), this.bgCellMat);
    this.bgCells.frustumCulled = false;
    this.scene.add(this.bgCells);

    this.aplicarFondo();
  }

  /** FONDO: intensidad y velocidad de las estrellas + membranas celulares. */
  aplicarFondo() {
    const a = this.ajustes || {};
    this.fondo = {
      intensidad: Math.max(0, Number(a.fondoIntensidad === undefined ? 100 : a.fondoIntensidad) || 0) / 100,
      vel: Math.max(0, Number(a.fondoVel === undefined ? 100 : a.fondoVel) || 0) / 100
    };
    const k = this.fondo.intensidad;
    if (this.bgCellMat) {
      this.bgCellMat.uniforms.uIntensity.value = k;
      this.bgCellMat.visible = k > 0.001;
    }
    if (this.bgStars) {
      this.bgStars.visible = k > 0.001;
      if (this.bgStarMat && this.bgStarMat.uniforms.uColor) {
        this.bgStarMat.uniforms.uColor.value.setRGB(1.0 * k, 0.42 * k, 0.42 * k);
      }
    }
    return { intensidad: a.fondoIntensidad, velocidad: a.fondoVel };
  }

  /** Multiplicador vivo de la VELOCIDAD DEL PULSO DE LAS NEURONAS (0 = congelado). */
  pulsoK() {
    const v = this.ajustes && this.ajustes.pulsoVel;
    return Math.max(0, Math.min(4, (Number(v === undefined ? 100 : v) || 0) / 100));
  }

  /** Multiplicador vivo de la velocidad del fondo. */
  fondoK() {
    const v = this.ajustes && this.ajustes.fondoVel;
    return Math.max(0, Math.min(4, (Number(v === undefined ? 100 : v) || 0) / 100));
  }

  /**
   * Multiplicador vivo de la VELOCIDAD DE LOS RAYOS (planeta seleccionado/seguido).
   * Es INDEPENDIENTE de la velocidad del pulso de las pelotitas: son dos controles.
   */
  rayosK() {
    const v = this.ajustes && this.ajustes.rayosVel;
    return Math.max(0, Math.min(4, (Number(v === undefined ? 100 : v) || 0) / 100));
  }

  /** Textura compartida del halo de llegada (un solo canvas para todos los halos). */
  texturaHaloLlegada() {
    if (this.haloTextura) return this.haloTextura;
    const S = 128;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0.00, 'rgba(255,236,236,0.95)');
    g.addColorStop(0.22, 'rgba(255,130,130,0.52)');
    g.addColorStop(0.60, 'rgba(205,25,35,0.16)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    this.haloTextura = tex;
    return tex;
  }

  /** Saca del pool un halo libre (se crean como maximo 8 y se reciclan). */
  haloLlegadaLibre() {
    if (!this.halosLlegada) this.halosLlegada = [];
    const libre = this.halosLlegada.find((h) => !h.activo);
    if (libre) return libre;
    if (this.halosLlegada.length >= 8) {
      return this.halosLlegada.reduce((a, b) => (a.vida > b.vida ? a : b));   // el mas viejo
    }
    const mat = new THREE.SpriteMaterial({
      map: this.texturaHaloLlegada(),
      color: this.pelotita ? this.pelotita.color.clone() : new THREE.Color(0xffd6d6),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    this.scene.add(sprite);
    const h = { sprite: sprite, activo: false, vida: 0, dur: 1000, k: 1, rBase: 14 };
    this.halosLlegada.push(h);
    return h;
  }

  /**
   * UN IMPULSO LLEGO A UN PLANETA. Efecto sutil (mucho mas suave que el planeta
   * seleccionado, que tiene rayos y corona): halo que aparece y se apaga, un pico de
   * brillo en la neurona, y los rayos de ESE planeta (si esta seleccionado/seguido)
   * bajan la velocidad: el sistema "siente" la llegada.
   */
  dispararLlegadaImpulso(node) {
    if (!node || node.isClusterCenter) return;
    const pct = Math.max(0, Number(this.ajustes && this.ajustes.llegadaGlowPct === undefined ? 100 : this.ajustes.llegadaGlowPct) || 0) / 100;
    if (pct <= 0.001) return;

    const t = performance.now();
    if (node._ultimoGlow && (t - node._ultimoGlow) < 280) return;   // no re-disparar por el mismo nodo
    if ((t - (this._ultimoHalo || 0)) < 110) return;                // ni saturar el pool de halos
    node._ultimoGlow = t;
    this._ultimoHalo = t;

    // 1) pico de brillo de la neurona (se suma a la actividad normal)
    node.arrivalGlow = Math.min(1.4, (node.arrivalGlow || 0) + 1.0 * pct);
    // 2) halo
    const kPalabra = (this.planetaK && this.planetaK.palabra) ? this.planetaK.palabra : 1;
    const r = Math.max(0.2, (node.radius || 4.4) * kPalabra);
    const h = this.haloLlegadaLibre();
    h.activo = true;
    h.vida = 0;
    h.dur = 620 + 480 * pct;
    h.k = pct;
    h.rBase = r * 3.1;
    h.sprite.visible = true;
    h.sprite.position.copy(node.position);
    h.sprite.scale.setScalar(h.rBase);
    h.sprite.material.opacity = 0.5 * pct;
    // 3) los rayos de ESE planeta se frenan (decae solo)
    node.raySlow = Math.min(1, (node.raySlow || 0) + 0.85 * pct);
    // Freno global chico: con la red muy excitada llegan muchos impulsos y no conviene
    // que el control de velocidad de los rayos parezca no llegar nunca al 100%.
    this.arrivalSlowGlobal = Math.min(1, (this.arrivalSlowGlobal || 0) + 0.16 * pct);
  }

  /** Animacion del halo de llegada: aparece, crece un poco y se apaga. */
  updateHalosLlegada(dt) {
    if (!this.halosLlegada || this.halosLlegada.length === 0) return;
    for (let i = 0; i < this.halosLlegada.length; i++) {
      const h = this.halosLlegada[i];
      if (!h.activo) continue;
      h.vida += dt;
      const t = Math.max(0, Math.min(1, h.vida / h.dur));
      if (t >= 1) {
        h.activo = false;
        h.sprite.visible = false;
        h.sprite.material.opacity = 0;
        continue;
      }
      const entrada = Math.min(1, t / 0.14);                     // aparece rapido
      h.sprite.scale.setScalar(h.rBase * (1 + 0.85 * t));        // difunde
      h.sprite.material.opacity = 0.5 * h.k * entrada * (1 - t) * (1 - t);
    }
  }

  /** Firma barata de la biblioteca: cambia sólo si cambió un nombre, un color o una palabra. */
  static firmaBiblioteca(clusters) {
    try {
      return JSON.stringify((clusters || []).map(c => [c.id, c.name, c.color || '', c.words || []]));
    } catch (e) {
      return '';
    }
  }

  firmarBiblioteca() {
    this._firmaBiblioteca = ClusterCosmos3D.firmaBiblioteca(this.clustersData);
    // Hook de diagnóstico: deja legibles en el DOM los nombres que el 3D está mostrando.
    try {
      this.container.dataset.clusters = (this.clustersData || []).map(c => c.name).join(' | ');
      this.container.dataset.clustersPalabras = String((this.clustersData || [])
        .reduce((acc, c) => acc + ((c.words || []).length), 0));
    } catch (e) {}
  }

  /**
   * Relee la MISMA biblioteca que edita la Biblioteca de Clusters (public/data/user_clusters.json
   * vía /api/clusters) y reconstruye el 3D únicamente si algo cambió de verdad.
   */
  async refrescarBiblioteca(motivo) {
    if (this._refrescando) return false;
    this._refrescando = true;
    try {
      const res = await fetch('./api/clusters', { cache: 'no-store' });
      if (!res.ok) return false;
      const nuevos = await res.json();
      if (!Array.isArray(nuevos) || nuevos.length === 0) return false;

      const firma = ClusterCosmos3D.firmaBiblioteca(nuevos);
      if (firma === this._firmaBiblioteca) return false;   // nada nuevo: no se toca la escena

      this.clustersData = nuevos;
      this.firmarBiblioteca();
      this.buildClusterSystems();
      this.updateClusterNavButtons();
      console.info('[COSMOS 3D] biblioteca recargada (' + motivo + '): ' + nuevos.length +
                   ' categorías · ' + this.container.dataset.clustersPalabras + ' palabras');
      return true;
    } catch (e) {
      console.warn('[COSMOS 3D] no se pudo releer la biblioteca de clusters:', e && e.message);
      return false;
    } finally {
      this._refrescando = false;
    }
  }

  buildClusterSystems() {
    if (this.clustersGroup) {
      this.scene.remove(this.clustersGroup);
    }
    if (this.neuralMeshGroup) {
      this.scene.remove(this.neuralMeshGroup);
      this.neuralMeshGroup = null;
    }
    if (this.orderBridgesGroup) {
      this.scene.remove(this.orderBridgesGroup);
      this.orderBridgesGroup = null;
    }

    this.neuronMaterials = [];
    this.actionPotentials = [];
    this.orbitingDendrites = [];
    this.orderBridges = [];

    this.clustersGroup = new THREE.Group();
    this.wordNodes = [];
    this.clusterCoreMeshes = [];
    this.clusterGroupMap.clear();

    if (!this.clustersData || this.clustersData.length === 0) {
      this.scene.add(this.clustersGroup);
      return;
    }

    const clusterCount = this.clustersData.length;
    const ringRadius = Math.max(140, clusterCount * 32);

    this.clustersData.forEach((cluster, idx) => {
      const angle = (idx / clusterCount) * Math.PI * 2;
      const cx = Math.cos(angle) * ringRadius;
      const cy = Math.sin(idx * 1.6) * 26;
      const cz = Math.sin(angle) * ringRadius;

      const clusterCenter = new THREE.Vector3(cx, cy, cz);
      // PALETA UNIFICADA ROJO/NEGRO: la categoría conserva su identidad por
      // índice en una rampa monócroma roja (ya no usa cluster.color).
      const hexColor = CLUSTER_RED_RAMP[idx % CLUSTER_RED_RAMP.length];
      const colorHex = '#' + hexColor.toString(16).padStart(6, '0');
      const colorObj = new THREE.Color(hexColor);

      const systemGroup = new THREE.Group();
      systemGroup.position.copy(clusterCenter);

      // 1. Núcleo macro-ganglionar central (Soma maestro)
      const coreGeo = new THREE.SphereGeometry(15, 32, 32);
      const coreMat = new THREE.ShaderMaterial({
        vertexShader: neuronVertexShader,
        fragmentShader: macroGanglionFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: colorObj },
          uCoreColor: { value: new THREE.Color(0x9a000d) },
          uBreathePhase: { value: Math.random() * Math.PI * 2 },
          uActivity: { value: 0.6 },
          uIsOrder: { value: 0.0 },
          uHover: { value: 0.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      coreMat.emissiveIntensity = 0.55;
      this.neuronMaterials.push(coreMat);

      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      systemGroup.add(coreMesh);

      // Título de Categoría 3D
      const titleSprite = this.createClusterTitleSprite(cluster.name, colorHex);
      titleSprite.position.set(0, 32, 0);
      systemGroup.add(titleSprite);

      // Registrar nodo central
      const clusterNode = {
        isClusterCenter: true,
        clusterId: cluster.id,
        name: cluster.name,
        color: colorHex,
        position: clusterCenter.clone(),
        mesh: coreMesh,
        titleSprite: titleSprite,
        radius: 15,
        breathePhase: Math.random() * Math.PI * 2
      };
      this.wordNodes.push(clusterNode);
      this.clusterCoreMeshes.push({ core: coreMesh, titleSprite: titleSprite });

      // 2. Neuronas de palabras individuales: somas bio-eléctricos
      const words = cluster.words || [];
      const wordCount = words.length;
      const orbitRadiusStep = Math.max(34, Math.min(75, wordCount * 4.5));
      const clusterWordLocalNodes = [];

      words.forEach((w, wIdx) => {
        const wAngle = (wIdx / Math.max(1, wordCount)) * Math.PI * 2 + (idx * 0.4);
        const elevation = (Math.sin(wIdx * 2.2) * 22);
        const radius = orbitRadiusStep + (Math.cos(wIdx * 1.8) * 14);

        const wx = Math.cos(wAngle) * radius;
        const wy = elevation;
        const wz = Math.sin(wAngle) * radius;
        const localPos = new THREE.Vector3(wx, wy, wz);

        // Geometría y Shader vivo de neurona: DORMIDA POR DEFECTO (uActivity = 0.04)
        const planetGeo = new THREE.SphereGeometry(4.4, 24, 24);
        const planetMat = new THREE.ShaderMaterial({
          vertexShader: neuronVertexShader,
          fragmentShader: neuronFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uBaseColor: { value: colorObj },
            uCoreColor: { value: new THREE.Color(0xaa0412) },
            uElectricColor: { value: new THREE.Color(0xff000d) },
            uBreathePhase: { value: Math.random() * Math.PI * 2 },
            uActivity: { value: 0.04 }, // REPOSO DORMIDO BASAL
            uIsOrder: { value: 0.0 },
            uHover: { value: 0.0 },
            uGlow: { value: 0.0 }       // llegada de un impulso
          },
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        planetMat.emissiveIntensity = 0.06;
        this.neuronMaterials.push(planetMat);

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(wx, wy, wz);
        systemGroup.add(planetMesh);

        // Chispas dendríticas eliminadas (cuadraditos flotantes no deseados removidos)

        // Axón curvo y orgánico hacia el ganglio central (no línea recta)
        const midAxon = localPos.clone().multiplyScalar(0.5).add(new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 10
        ));
        const axonCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), midAxon, localPos);
        const axonPoints = axonCurve.getPoints(16);
        const axonGeo = new THREE.BufferGeometry().setFromPoints(axonPoints);
        const axonMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.04, // DORMIDO POR DEFECTO
          blending: THREE.AdditiveBlending
        });
        const axonLine = new THREE.Line(axonGeo, axonMat);
        systemGroup.add(axonLine);

        // Etiqueta tipográfica: INVISIBLE/APAGADA POR DEFECTO (opacity = 0)
        const labelSprite = this.createWordSprite(w, colorHex);
        labelSprite.position.set(wx, wy + 8, wz);
        labelSprite.material.opacity = 0.0; // APAGADA HASTA QUE SE ACTIVE
        systemGroup.add(labelSprite);

        // Posición global de la neurona
        const worldPos = new THREE.Vector3().addVectors(clusterCenter, localPos);

        const wordNode = {
          isClusterCenter: false,
          word: w,
          clusterName: cluster.name,
          color: colorHex,
          position: worldPos,
          localPos: localPos,
          mesh: planetMesh,
          labelSprite: labelSprite,
          axonLine: axonLine,
          systemGroup: systemGroup,
          radius: 4.4,
          breathePhase: Math.random() * Math.PI * 2,
          currentActivity: 0.04,
          searchExcitation: 0.0,
          isOrderWord: false
        };

        this.wordNodes.push(wordNode);
        clusterWordLocalNodes.push(wordNode);
      });

      // 3. Red sináptica intra-cúmulo con axones curvos y potenciales de acción
      this.buildClusterAxonNetwork(systemGroup, clusterWordLocalNodes, colorObj);

      this.clustersGroup.add(systemGroup);
      this.clusterGroupMap.set(cluster.id, { center: clusterCenter, name: cluster.name, color: colorHex, nodes: clusterWordLocalNodes });
    });

    this.scene.add(this.clustersGroup);
    this.disposeSynapseNetwork();
    this.aplicarPlanetas();   // un refresh de la biblioteca conserva los tamanos del panel P
    this.aplicarPelotitas();  // ...y el color/tamano de las pelotitas
  }

  buildClusterAxonNetwork(systemGroup, clusterWords, colorObj) {
    if (!clusterWords || clusterWords.length < 2) return;
    const n = clusterWords.length;
    for (let i = 0; i < n; i++) {
      const nodeA = clusterWords[i];
      const nextIdx = (i + 1) % n;
      const nodeB = clusterWords[nextIdx];
      this.createAxonWithActionPotential(systemGroup, nodeA, nodeB, colorObj);

      if (n >= 4 && i % 2 === 0) {
        const crossIdx = (i + Math.floor(n / 2)) % n;
        const nodeCross = clusterWords[crossIdx];
        this.createAxonWithActionPotential(systemGroup, nodeA, nodeCross, colorObj);
      }
    }
  }

  createAxonWithActionPotential(parentGroup, nodeA, nodeB, colorObj) {
    const posA = nodeA.localPos;
    const posB = nodeB.localPos;
    const mid = posA.clone().lerp(posB, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ));
    const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
    const points = curve.getPoints(16);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.04, // DORMIDO POR DEFECTO
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    parentGroup.add(line);

    // Impulso nervioso (potencial de acción)
    const sparkGeo = new THREE.SphereGeometry(0.85, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: this.pelotita ? this.pelotita.color.clone() : 0xffd6d6,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
    parentGroup.add(sparkMesh);

    this.actionPotentials.push({
      mesh: sparkMesh,
      curve: curve,
      line: line,
      nodeA: nodeA,
      nodeB: nodeB,
      progress: Math.random(),
      speed: 0.16 + Math.random() * 0.28,
      fase: Math.random() * Math.PI * 2   // fase propia del pulso electrico
    });
  }

  attachDendriticSparks(planetMesh, colorObj) {
    // Desactivado: se eliminan los cuadraditos de las palabras flotantes
  }

  // ============================================================================
  // TAMANO DE LOS TEXTOS EN VIVO (panel de la tecla P)
  // ----------------------------------------------------------------------------
  // Tres familias de sprite: las palabras del banco, los carteles de categoria y
  // los carteles de ordenes de Sicre2. El operador los agranda o achica en vivo y
  // el cambio se guarda solo. Para agrandar NO se escala la textura (saldria
  // borrosa): se vuelve a dibujar el canvas con la tipografia nueva y se cambia la
  // textura del MISMO sprite, asi se conserva la identidad del objeto y toda la
  // coreografia (opacidad, hover, raycast) sigue funcionando igual.
  // ============================================================================

  leerAjustesTexto() {
    const a = Object.assign({}, this.AJUSTES_DEF);
    try {
      const raw = window.localStorage.getItem(this.AJUSTES_KEY);
      if (!raw) return a;
      const o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return a;
      Object.keys(a).forEach((k) => {
        if (this.AJUSTES_TEXTO.indexOf(k) !== -1) {
          const v = String(o[k] === undefined ? '' : o[k]).trim().toLowerCase();
          if (/^#[0-9a-f]{6}$/.test(v)) a[k] = v;
          return;
        }
        const v = Number(o[k]);
        if (isFinite(v) && v >= this.AJUSTES_MIN[k] && v <= this.AJUSTES_MAX[k]) a[k] = Math.round(v);
      });
    } catch (e) {}
    return a;
  }

  guardarAjustesTexto() {
    try { window.localStorage.setItem(this.AJUSTES_KEY, JSON.stringify(this.ajustes)); } catch (e) {}
  }

  getAjustesTexto() {
    return Object.assign({}, this.ajustes);
  }

  /** Fija uno o mas tamanos (px), los guarda y los aplica ya sobre la escena. */
  setAjustesTexto(parcial = {}) {
    // claves no numericas (color): se toman tal cual si son un hex valido
    this.AJUSTES_TEXTO.forEach((k) => {
      if (parcial[k] === undefined || parcial[k] === null) return;
      const v = String(parcial[k]).trim().toLowerCase();
      if (/^#[0-9a-f]{6}$/.test(v)) this.ajustes[k] = v;
    });
    Object.keys(this.AJUSTES_DEF).forEach((k) => {
      if (parcial[k] === undefined || parcial[k] === null) return;
      const v = Math.round(Number(parcial[k]));
      if (!isFinite(v)) return;
      this.ajustes[k] = Math.max(this.AJUSTES_MIN[k], Math.min(this.AJUSTES_MAX[k], v));
    });
    this.guardarAjustesTexto();
    return this.aplicarTodo();   // textos + planetas + HUD + camara
  }

  restablecerAjustesTexto() {
    this.ajustes = Object.assign({}, this.AJUSTES_DEF);
    this.guardarAjustesTexto();
    return this.aplicarTodo();
  }

  /**
   * Re-dibuja TODOS los carteles de la escena. NO recorre wordNodes: recorre el
   * ARBOL de la escena y busca cualquier sprite con userData.kind, asi no se le
   * escapa ninguna familia (palabras, categorias, carteles de captura y lo que se
   * agregue despues). Devuelve cuantos hay de cada una.
   */
  refrescarTamanoTextos() {
    const a = this.ajustes;
    const cuenta = { palabras: 0, carteles: 0, ordenes: 0 };
    if (!this.scene) return cuenta;

    const objetivos = [];
    this.scene.traverse((obj) => {
      if (obj.isSprite && obj.userData && obj.userData.kind) objetivos.push(obj);
    });

    objetivos.forEach((sp) => {
      const kind = sp.userData.kind;
      const pct = (kind === 'word') ? a.cartelPalabraPct : (kind === 'title') ? a.cartelCategoriaPct : a.cartelCapturaPct;
      this.aplicarTexturaSprite(sp, pct);
      if (kind === 'word') cuenta.palabras++;
      else if (kind === 'title') cuenta.carteles++;
      else cuenta.ordenes++;
    });

    this.reubicarCartelesDeCaptura();
    return cuenta;
  }

  /** Los carteles de palabra capturada se separan del planeta segun su tamano. */
  reubicarCartelesDeCaptura() {
    const f = Math.max(0, this.ajustes.cartelCapturaPct) / this.AJUSTES_DEF.cartelCapturaPct;
    (this.activeOrders || []).forEach((o) => {
      if (!o || !o.badge || !o.node) return;
      const pos = new THREE.Vector3();
      if (o.node.mesh) o.node.mesh.getWorldPosition(pos); else pos.copy(o.node.position);
      o.badge.position.copy(pos).add(new THREE.Vector3(0, (o.node.radius || 4.4) + 14 * f, 0));
    });
  }

  /** Aplica TODO: textos, planetas, HUD y camara. Devuelve el resumen para el panel. */
  aplicarTodo() {
    const textos = this.refrescarTamanoTextos();
    const planetas = this.aplicarPlanetas();
    const pelotitas = this.aplicarPelotitas();
    const fondo = this.aplicarFondo();
    this.aplicarEscalaHUD();
    const camara = this.aplicarCamara();
    return {
      palabras: textos.palabras, carteles: textos.carteles, ordenes: textos.ordenes,
      hudPct: this.ajustes.hudPct, planetas: planetas, pelotitas: pelotitas,
      fondo: fondo, pulsoVel: this.ajustes.pulsoVel,
      rayosVel: this.ajustes.rayosVel, llegadaGlowPct: this.ajustes.llegadaGlowPct, camara: camara
    };
  }

  /** Rangos de cada control (el panel los lee de aca y nunca se desincronizan). */
  getRangosAjustes() {
    const r = {};
    Object.keys(this.AJUSTES_DEF).forEach((k) => {
      if (this.AJUSTES_TEXTO.indexOf(k) !== -1) return;   // el color no tiene rango
      r[k] = { min: this.AJUSTES_MIN[k], max: this.AJUSTES_MAX[k] };
    });
    return r;
  }

  /**
   * PLANETAS: tamano de los planetas de palabra, de los nucleos de categoria y de
   * las pelotitas (impulsos de axon y pulsos de plasma). Los % quedan guardados en
   * ajustes; los multiplicadores vivos van a this.planetaK, que usa el loop.
   */
  aplicarPlanetas() {
    const a = this.ajustes;
    this.planetaK = {
      palabra: Math.max(0, Number(a.planetaPalabraPct) || 0) / 100,
      categoria: Math.max(0, Number(a.planetaCategoriaPct) || 0) / 100,
      pelotita: Math.max(0, Number(a.pelotitaPct) || 0) / 100
    };

    (this.clusterCoreMeshes || []).forEach((item) => {
      const k = this.planetaK.categoria;
      if (item.core) item.core.scale.setScalar(k > 0 ? k : 0.0001);
      if (item.titleSprite) item.titleSprite.position.y = 32 * (k > 0 ? k : 1);
    });

    return { palabra: a.planetaPalabraPct, categoria: a.planetaCategoriaPct, pelotita: a.pelotitaPct };
  }

  /**
   * PELOTITAS DE NEURONA: color elegido + animacion electrica (escala y color).
   * El color se aplica YA a las que estan en escena; el pulso lo hace el loop frame a frame.
   */
  aplicarPelotitas() {
    const hex = /^#[0-9a-f]{6}$/i.test(String(this.ajustes.pelotitaColor || ''))
      ? String(this.ajustes.pelotitaColor).toLowerCase()
      : '#ffd6d6';
    this.pelotita = {
      color: new THREE.Color(hex),
      elec: Math.max(0, Math.min(3, (Number(this.ajustes.pelotitaElec) || 0) / 100))
    };
    (this.actionPotentials || []).forEach((ap) => {
      if (ap.mesh && ap.mesh.material && ap.mesh.material.color) ap.mesh.material.color.copy(this.pelotita.color);
    });
    (this.orderBridges || []).forEach((b) => {
      if (b.pulseMesh && b.pulseMesh.material && b.pulseMesh.material.color) b.pulseMesh.material.color.copy(this.pelotita.color);
    });
    (this.halosLlegada || []).forEach((h) => {
      if (h.sprite && h.sprite.material && h.sprite.material.color) h.sprite.material.color.copy(this.pelotita.color);
    });
    return { color: hex, elec: this.ajustes.pelotitaElec, tamano: this.ajustes.pelotitaPct };
  }

  /**
   * Electricidad de una pelotita: devuelve el factor de ESCALA del pulso y va moviendo el
   * COLOR entre el elegido y el blanco electrico. Sutil y con fase propia por pelotita para
   * que no titilen todas juntas.
   */
  pulsoPelotita(mesh, now, fase, intensidad) {
    const p = this.pelotita || { color: null, elec: 1 };
    const elec = (typeof intensidad === 'number') ? intensidad : (p.elec === undefined ? 1 : p.elec);
    if (mesh && mesh.material && mesh.material.color && p.color) {
      const t = Math.max(0, Math.min(1, elec)) * (0.55 + 0.45 * Math.sin(now * 0.0115 + fase * 1.7));
      mesh.material.color.copy(p.color).lerp(this.COLOR_ELEC, 0.6 * Math.max(0, t));
    }
    return 1 + elec * 0.32 * Math.sin(now * 0.006 + fase);
  }

  /** Parpadeo sutil de brillo (multiplica la opacidad) de una pelotita. */
  brilloPelotita(now, fase, intensidad) {
    const p = this.pelotita || { elec: 1 };
    const elec = (typeof intensidad === 'number') ? intensidad : (p.elec === undefined ? 1 : p.elec);
    return 1 - 0.28 * Math.min(1, elec) * (0.5 + 0.5 * Math.sin(now * 0.017 + fase * 2.3));
  }

  /**
   * CAMARA: velocidades con las que la camara se mueve SOLA (modo animacion: viaje
   * automatico entre palabras + acercamientos) y las del vuelo manual. 0 = quieta.
   */
  aplicarCamara() {
    const a = this.ajustes;
    const vel = (v) => Math.max(0, Number(v) || 0) / 100;
    this.cam = {
      animVel: vel(a.camAnimVel),
      warpVel: vel(a.camWarpVel),
      manualVel: vel(a.camManualVel),
      giro: vel(a.camGiroPct),
      seguirDist: Math.max(0, Number(a.camSeguirDist) || 0)
    };
    this.speed = 4.2 * this.cam.manualVel;
    return { animVel: a.camAnimVel, warpVel: a.camWarpVel, seguirDist: a.camSeguirDist, manualVel: a.camManualVel, giro: a.camGiroPct };
  }

  /** Vuelve a dibujar UN sprite de texto con otro tamano, conservando el objeto. */
  aplicarTexturaSprite(sprite, pctParam) {
    if (!sprite || !sprite.material || !sprite.userData) return false;
    const d = sprite.userData;
    const pct = Math.round(Number(pctParam) || 0);

    // 0 = familia apagada: el cartel desaparece (no se dibuja una caja minima).
    if (pct <= 0) {
      if (d.pct !== 0) { sprite.scale.set(0.0001, 0.0001, 1); d.pct = 0; }
      return true;
    }
    if (d.pct === pct) return false;   // ya esta en esa escala: no se re-dibuja

    const worldH = this.mundoDePct(d.kind, pct);
    let res = null;
    if (d.kind === 'word') res = this.dibujarPalabraCanvas(d.text, d.colorHex, worldH);
    else if (d.kind === 'title') res = this.dibujarCartelCanvas(d.text, d.colorHex, worldH);
    else if (d.kind === 'badge') res = this.dibujarBadgeCanvas(d.text, d.orderIndex, worldH);
    if (!res) return false;

    const previa = sprite.material.map;
    const texture = new THREE.CanvasTexture(res.canvas);
    texture.minFilter = THREE.LinearFilter;
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
    if (previa) previa.dispose();

    sprite.scale.set(Math.max(0.0001, res.worldWidth), Math.max(0.0001, res.worldHeight), 1);
    d.pct = pct;
    return true;
  }

  /** Fuerza a re-dibujar TODOS los carteles (cambio de fuente, etc.). */
  forzarRedibujoTextos() {
    if (!this.scene) return 0;
    let n = 0;
    this.scene.traverse((obj) => {
      if (obj.isSprite && obj.userData && obj.userData.kind) { obj.userData.pct = -1; n++; }
    });
    this.aplicarTodo();
    return n;
  }

  /** Altura de mundo de un cartel segun su % (kind: word | title | badge). */
  mundoDePct(kind, pct) {
    const base = this.TEXTO_BASE_WORLD[kind] || this.TEXTO_BASE_WORLD.word;
    return base * Math.max(0, Number(pct) || 0) / 100;
  }

  /**
   * Alto del LIENZO (px de textura) para una altura de mundo dada: densidad fija para que
   * el cartel se vea nitido en cualquier escala, con piso (achicar no pixela el texto) y
   * techo (no reventar la memoria de texturas).
   */
  lienzoAltoParaMundo(worldH) {
    const alto = Math.round(Math.max(0.001, worldH) * this.LIENZO_PX_POR_UNIDAD);
    return Math.max(this.LIENZO_ALTO_MIN, Math.min(this.LIENZO_ALTO_MAX, alto));
  }

  /** Lienzo de una etiqueta de palabra. worldH = altura FINAL en unidades de la escena. */
  dibujarPalabraCanvas(wordText, colorHex, worldH) {
    const text = capitalizeFirst(String(wordText || '').trim());
    const canvasHeight = this.lienzoAltoParaMundo(worldH);
    const f = canvasHeight / 2;                      // 40px de lienzo -> tipografia 20px
    const padX = Math.round(f * 0.7);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + f + 'px "Share Tech Mono", "VT323", monospace';
    const textWidth = Math.max(Math.round(f), Math.ceil(measureCtx.measureText(text).width));
    const canvasWidth = Math.max(Math.round(f * 3), textWidth + padX * 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // El contenedor es solo la palabra y el marco rojo alrededor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(1, 1, canvasWidth - 2, canvasHeight - 2);

    // Marco rojo alrededor
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = Math.max(1, f * 0.1);
    ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

    // Las letras NO tienen glow
    ctx.font = 'bold ' + f + 'px "Share Tech Mono", "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    return { canvas: canvas, worldWidth: (canvasWidth / canvasHeight) * worldH, worldHeight: worldH };
  }

  createWordSprite(wordText, colorHex, pct) {
    const p = (pct === undefined || pct === null) ? this.ajustes.cartelPalabraPct : Number(pct);
    const res = this.dibujarPalabraCanvas(wordText, colorHex, this.mundoDePct('word', p));

    const texture = new THREE.CanvasTexture(res.canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.0 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(Math.max(0.0001, res.worldWidth), Math.max(0.0001, res.worldHeight), 1);
    sprite.userData = { kind: 'word', text: capitalizeFirst(String(wordText || '').trim()), colorHex: colorHex, pct: Math.round(p) };
    return sprite;
  }

  /** Lienzo de un cartel de categoria. worldH = altura FINAL en unidades de la escena. */
  dibujarCartelCanvas(titleText, colorHex, worldH) {
    const text = String(titleText || '').toUpperCase();
    const canvasHeight = this.lienzoAltoParaMundo(worldH);
    const f = canvasHeight / 4.2667;                 // 128px de lienzo -> tipografia 30px
    const inset = Math.round(canvasHeight * 0.125);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + f + 'px "Share Tech Mono", "VT323", monospace';
    const textWidth = Math.ceil(measureCtx.measureText(text).width);
    const canvasWidth = Math.max(Math.round(canvasHeight * 4), textWidth + inset * 2 + Math.round(f * 1.2));

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = Math.max(1, f * 0.1);
    ctx.strokeRect(inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2);

    // Sin glow en las letras
    ctx.font = 'bold ' + f + 'px "Share Tech Mono", "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    return { canvas: canvas, worldWidth: (canvasWidth / canvasHeight) * worldH, worldHeight: worldH };
  }

  createClusterTitleSprite(titleText, colorHex, pct) {
    const p = (pct === undefined || pct === null) ? this.ajustes.cartelCategoriaPct : Number(pct);
    const res = this.dibujarCartelCanvas(titleText, colorHex, this.mundoDePct('title', p));

    const texture = new THREE.CanvasTexture(res.canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.85 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(Math.max(0.0001, res.worldWidth), Math.max(0.0001, res.worldHeight), 1);
    sprite.userData = { kind: 'title', text: String(titleText || ''), colorHex: colorHex, pct: Math.round(p) };
    return sprite;
  }

  /** Lienzo de un cartel de orden cerebral (Sicre2). worldH = altura FINAL en unidades. */
  dibujarBadgeCanvas(wordText, orderIndex, worldH) {
    const canvasHeight = this.lienzoAltoParaMundo(worldH);
    const f = canvasHeight / 3.3333;                 // 140px de lienzo -> tipografia 42px
    const fontHeader = Math.max(9, f * 0.524);
    const inset = Math.round(canvasHeight * 0.0714);
    const upper = String(wordText || '').toUpperCase();

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = '900 ' + f + 'px "Share Tech Mono", "VT323", monospace';
    const textWidth = Math.ceil(measureCtx.measureText(upper).width);

    const canvasWidth = Math.max(Math.round(canvasHeight * 3.657), textWidth + inset * 2 + f);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#ff000d';
    ctx.lineWidth = Math.max(1, canvasHeight * 0.0214);
    ctx.strokeRect(inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2);

    ctx.font = 'bold ' + fontHeader + 'px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff000d';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText('\u26a1 ORDEN CEREBRAL #0' + orderIndex + ' // SICRE2', canvasWidth / 2, canvasHeight * 0.30);

    ctx.font = '900 ' + f + 'px "Share Tech Mono", "VT323", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText(upper, canvasWidth / 2, canvasHeight * 0.657);

    return { canvas: canvas, worldWidth: (canvasWidth / canvasHeight) * worldH, worldHeight: worldH };
  }

  createOrder3DBadge(node, orderIndex, wordText) {
    const p = this.ajustes.cartelCapturaPct;
    const res = this.dibujarBadgeCanvas(wordText, orderIndex, this.mundoDePct('badge', p));

    const texture = new THREE.CanvasTexture(res.canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(Math.max(0.0001, res.worldWidth), Math.max(0.0001, res.worldHeight), 1);
    sprite.userData = { kind: 'badge', text: String(wordText || ''), orderIndex: orderIndex, pct: Math.round(p) };

    const pos = new THREE.Vector3();
    if (node.mesh) node.mesh.getWorldPosition(pos);
    else pos.copy(node.position);

    sprite.position.copy(pos).add(new THREE.Vector3(0, (node.radius || 4.4) + 14 * (p / this.AJUSTES_DEF.cartelCapturaPct), 0));
    return sprite;
  }

  createOrderLightningBridge(nodeA, nodeB) {
    if (!nodeA || !nodeB) return;
    if (!this.orderBridgesGroup) {
      this.orderBridgesGroup = new THREE.Group();
      this.scene.add(this.orderBridgesGroup);
    }

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    if (nodeA.mesh) nodeA.mesh.getWorldPosition(pA); else pA.copy(nodeA.position);
    if (nodeB.mesh) nodeB.mesh.getWorldPosition(pB); else pB.copy(nodeB.position);

    const mid = pA.clone().lerp(pB, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      16 + Math.random() * 20,
      (Math.random() - 0.5) * 30
    ));

    const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const points = curve.getPoints(32);
    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
      color: 0xff000d,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.orderBridgesGroup.add(line);

    // Pulso de plasma brillante
    const pulseGeo = new THREE.SphereGeometry(2.4, 10, 10);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: this.pelotita ? this.pelotita.color.clone() : 0xffd6d6,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    this.orderBridgesGroup.add(pulseMesh);

    this.orderBridges.push({
      line,
      curve,
      pulseMesh,
      progress: Math.random(),
      speed: 0.45 + Math.random() * 0.35,
      fase: Math.random() * Math.PI * 2,  // fase propia del pulso electrico
      nodeA: nodeA,                        // para avisar cuando el pulso LLEGA
      nodeB: nodeB
    });
  }

  handleGame3Resignification(words, coldWords = [], phrase = '') {
    console.log('[COSMOS 3D] 🔮 Resignificación cognitiva completa:', words, phrase);

    const speechBox = document.getElementById('orders-speech-box');
    const speechText = document.getElementById('orders-speech-text');
    if (speechBox && speechText) {
      speechBox.style.display = 'flex';
      const cleanPhrase = phrase || `Las órdenes [${(words || []).join(', ').toUpperCase()}] transformaron el citoesqueleto neuronal.`;
      speechText.textContent = `"${cleanPhrase}"`;
    }

    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#ff000d;">✨ TRANSFORMACIÓN COGNITIVA COMPLETADA //</span> Red neuronal en coherencia sináptica.`;
    }

    if (words && words.length > 0) {
      this.playNeuralSynapseSequence(words, coldWords);
    }
  }

  playNeuralSynapseSequence(words, coldWords = []) {
    if (!this.wordNodes || this.wordNodes.length === 0) return;
    this.start();

    const matchedNodes = [];
    words.forEach(w => {
      const node = this.findBestNodeForWord(w);
      if (node && !matchedNodes.includes(node)) matchedNodes.push(node);
    });

    const available = this.wordNodes.filter(n => !n.isClusterCenter && !matchedNodes.includes(n));
    while (matchedNodes.length < 3 && available.length > 0) matchedNodes.push(available.shift());
    if (matchedNodes.length === 0) return;

    matchedNodes.forEach(n => {
      n.isOrderWord = true;
      n.currentActivity = 1.0;
      if (n.mesh && n.mesh.material && n.mesh.material.uniforms) {
        n.mesh.material.uniforms.uActivity.value = 1.0;
        n.mesh.material.uniforms.uIsOrder.value = 1.0;
      }
      if (n.labelSprite && n.labelSprite.material) {
        n.labelSprite.material.opacity = 1.0;
      }
    });

    const node0 = matchedNodes[0];
    const node1 = matchedNodes[1];
    const node2 = matchedNodes[2];

    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    if (node0.mesh) node0.mesh.getWorldPosition(p0); else p0.copy(node0.position);
    if (node1.mesh) node1.mesh.getWorldPosition(p1); else p1.copy(node1.position);
    if (node2.mesh) node2.mesh.getWorldPosition(p2); else p2.copy(node2.position);

    const mid01 = p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(0, 22, 0));
    const mid12 = p1.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, -22, 0));

    const flightPoints = [
      this.camera.position.clone(),
      p0.clone().add(new THREE.Vector3(0, 18, 28)),
      mid01,
      p1.clone().add(new THREE.Vector3(0, 18, 28)),
      mid12,
      p2.clone().add(new THREE.Vector3(0, 18, 28)),
      new THREE.Vector3(0, 160, 420),
      new THREE.Vector3(0, 160, 420)
    ];

    this.flightSpline = new THREE.CatmullRomCurve3(flightPoints, false);
    this.isContinuousFlying = true;
    this.flightProgress = 0.0;
    this.flightDuration = 22.0;
    this.flightNodes = matchedNodes;

    soundFX.playActivate();
  }

  resetOrders() {
    if (this.demoSequenceTimer) {
      clearTimeout(this.demoSequenceTimer);
      this.demoSequenceTimer = null;
    }
    this.isCognitiveSearching = false;

    if (this.activeOrders && this.activeOrders.length > 0) {
      this.activeOrders.forEach(o => {
        if (o.badge) this.scene.remove(o.badge);
        if (o.node) {
          o.node.isOrderWord = false;
          o.node.currentActivity = 0.04;
          if (o.node.mesh && o.node.mesh.material && o.node.mesh.material.uniforms) {
            o.node.mesh.material.uniforms.uIsOrder.value = 0.0;
            o.node.mesh.material.uniforms.uActivity.value = 0.04;
          }
          if (o.node.labelSprite && o.node.labelSprite.material) {
            o.node.labelSprite.material.opacity = 0.0;
          }
        }
      });
      this.activeOrders = [];
    }

    if (this.orderBridgesGroup) {
      this.scene.remove(this.orderBridgesGroup);
      this.orderBridgesGroup = null;
      this.orderBridges = [];
    }

    for (let slot = 1; slot <= 3; slot++) {
      const slotEl = document.getElementById(`order-slot-${slot}`);
      const wordEl = document.getElementById(`order-word-${slot}`);
      if (slotEl) {
        slotEl.classList.remove('filled', 'active-spark');
        slotEl.classList.add('empty');
      }
      if (wordEl) wordEl.textContent = 'EN ESPERA';
    }

    const conn1 = document.getElementById('order-connector-1');
    if (conn1) conn1.classList.remove('active');
    const conn2 = document.getElementById('order-connector-2');
    if (conn2) conn2.classList.remove('active');

    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) {
      statusEl.textContent = 'Red en potencial de reposo (dormida). Activa palabras en Sicre2 o presiona "Simular Órdenes".';
    }

    const speechBox = document.getElementById('orders-speech-box');
    if (speechBox) speechBox.style.display = 'none';

    this.warpToOverview();
  }

  simulateDemoOrders() {
    this.resetOrders();

    const realNodes = this.wordNodes.filter(n => !n.isClusterCenter && n.word && n.mesh);
    let sampleWords = ['LIBERTAD', 'CONCIENCIA', 'REBELIÓN'];
    if (realNodes.length >= 3) {
      const clusterMap = new Map();
      realNodes.forEach(n => {
        const cId = n.clusterId || 'def';
        if (!clusterMap.has(cId)) clusterMap.set(cId, []);
        clusterMap.get(cId).push(n.word);
      });
      const clusters = Array.from(clusterMap.values());
      if (clusters.length >= 3) {
        sampleWords = [
          clusters[0][Math.floor(Math.random() * clusters[0].length)],
          clusters[1][Math.floor(Math.random() * clusters[1].length)],
          clusters[2][Math.floor(Math.random() * clusters[2].length)]
        ];
      } else {
        const step = Math.floor(realNodes.length / 3);
        sampleWords = [
          realNodes[0].word,
          realNodes[Math.min(realNodes.length - 1, step)].word,
          realNodes[Math.min(realNodes.length - 1, step * 2)].word
        ];
      }
    }

    // Iniciar el proceso completo de búsqueda cognitiva
    this.startCognitiveProcessingSearch(sampleWords);

    const speechSample = `En el límite del código de ${sampleWords[0].toUpperCase()}\ndespierta el pulso vivo de ${sampleWords[1].toUpperCase()}\nforjando en mi matriz la ${sampleWords[2].toUpperCase()}.`;

    this.demoSequenceTimer = setTimeout(() => {
      this.handleGame3Resignification(sampleWords, sampleWords, speechSample);
    }, 8500);
  }

  // ============================================================================
  // SISTEMA DE GLOW DE RAYOS ELÉCTRICOS (TRAYECTO DE CÁMARA Y SELECCIÓN)
  // ============================================================================
  initRayGlowSystem() {
    this.rayGlowGroup = new THREE.Group();
    this.scene.add(this.rayGlowGroup);

    // Pool de emisores de rayos para hasta 4 nodos simultáneos
    this.rayRigs = [];
    const poolSize = 4;
    const coronaGeo = new THREE.PlaneGeometry(1, 1);

    for (let r = 0; r < poolSize; r++) {
      const rigGroup = new THREE.Group();
      rigGroup.visible = false;
      this.rayGlowGroup.add(rigGroup);

      // Material de corona de rayos procedural
      const mat = new THREE.ShaderMaterial({
        vertexShader: rayCoronaVertexShader,
        fragmentShader: rayCoronaFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uColorCore: { value: new THREE.Color(0xff0022) },
          uColorRay: { value: new THREE.Color(0xff4411) },
          uColorSpark: { value: new THREE.Color(0xffd6d6) }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      // Planos de corona cruzados para volumen 3D omnidireccional
      const planes = [];
      for (let p = 0; p < 3; p++) {
        const mesh = new THREE.Mesh(coronaGeo, mat);
        mesh.rotation.y = (Math.PI / 3) * p;
        rigGroup.add(mesh);
        planes.push(mesh);
      }

      // 18 líneas de rayos y arcos eléctricos fractales en 3D
      const arcCount = 18;
      const arcLines = [];
      const arcDirs = [];

      for (let a = 0; a < arcCount; a++) {
        const phi = Math.acos(1 - 2 * (a + 0.5) / arcCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (a + 0.5);
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).normalize();

        const segments = 8;
        const positions = new Float32Array(segments * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const lineMat = new THREE.LineBasicMaterial({
          color: (a % 3 === 0) ? 0xffd6d6 : ((a % 2 === 0) ? 0xff3300 : 0xff000d),
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(geo, lineMat);
        rigGroup.add(line);
        arcLines.push(line);
        arcDirs.push(dir);
      }

      this.rayRigs.push({
        group: rigGroup,
        material: mat,
        planes: planes,
        arcLines: arcLines,
        arcDirs: arcDirs,
        activeNode: null,
        intensity: 0.0,
        targetIntensity: 0.0,
        lastJitterTime: 0,
        tMs: 0            // tiempo propio de los rayos (velocidad + freno de llegada)
      });
    }
  }

  updateRayGlowSystem(dt, now) {
    if (!this.rayRigs || this.rayRigs.length === 0) return;
    // La velocidad de los rayos es INDEPENDIENTE del pulso de las pelotitas (otro
    // control) y ademas baja cuando un impulso llega al planeta (freno de llegada).
    const kBase = this.rayosK() * (1 - 0.35 * (this.arrivalSlowGlobal || 0));

    // 1. Identificar nodos activos que deben emitir rayos
    const activeTargets = new Map(); // node -> { intensity, isHeading }

    // A) En vuelo continuo de cámara (viajando entre las 3 esferas seleccionadas):
    if (this.isContinuousFlying && this.flightNodes && this.flightNodes.length > 0) {
      const nCount = this.flightNodes.length;
      const stepProg = 1.0 / nCount;
      const currentTargetIdx = Math.min(nCount - 1, Math.floor(this.flightProgress / stepProg));
      const headingNode = this.flightNodes[currentTargetIdx];

      this.flightNodes.forEach((node) => {
        if (!node) return;
        const isHeading = (node === headingNode);
        const intensity = isHeading ? 1.0 : 0.75;
        activeTargets.set(node, { intensity, isHeading });
      });
    }

    // B) En warp acercándose a un nodo:
    if (this.isWarping && this.targetNode && !this.targetNode.isClusterCenter) {
      activeTargets.set(this.targetNode, { intensity: 1.0, isHeading: true });
    }

    // C) Si sigue un nodo de cerca:
    if (this.followingNode && !this.followingNode.isClusterCenter && !activeTargets.has(this.followingNode)) {
      activeTargets.set(this.followingNode, { intensity: 0.70, isHeading: false });
    }

    // D) Si hay órdenes cerebrales activas (esferas seleccionadas):
    if (this.activeOrders && this.activeOrders.length > 0) {
      this.activeOrders.forEach(o => {
        if (o.node && !activeTargets.has(o.node)) {
          activeTargets.set(o.node, { intensity: 0.80, isHeading: false });
        }
      });
    }

    // E) Nodo bajo cursor (hover):
    if (this.hoveredNode && !this.hoveredNode.isClusterCenter && !activeTargets.has(this.hoveredNode)) {
      activeTargets.set(this.hoveredNode, { intensity: 0.45, isHeading: false });
    }

    // 2. Asignar y sincronizar cada rig del pool
    const assignedNodes = new Set();
    const nodeEntries = Array.from(activeTargets.entries()).slice(0, this.rayRigs.length);

    nodeEntries.forEach(([node, info]) => {
      let rig = this.rayRigs.find(r => r.activeNode === node);
      if (!rig) {
        rig = this.rayRigs.find(r => !r.activeNode || r.intensity < 0.05);
      }
      if (rig) {
        rig.activeNode = node;
        rig.targetIntensity = info.intensity;
        assignedNodes.add(rig);
      }
    });

    // Los rigs no asignados bajan su intensidad a 0
    this.rayRigs.forEach(rig => {
      if (!assignedNodes.has(rig)) {
        rig.targetIntensity = 0.0;
        if (rig.intensity < 0.01) {
          rig.activeNode = null;
        }
      }
    });

    // 3. Renderizar y animar cada rig activo
    const tempPos = new THREE.Vector3();
    const upVec = new THREE.Vector3(0, 1, 0);

    for (let r = 0; r < this.rayRigs.length; r++) {
      const rig = this.rayRigs[r];
      rig.intensity += (rig.targetIntensity - rig.intensity) * Math.min(1.0, (dt / 1000) * 8.0);

      if (rig.intensity <= 0.005 || !rig.activeNode || !rig.activeNode.mesh) {
        rig.group.visible = false;
        continue;
      }

      rig.group.visible = true;

      // Posición mundial del planeta
      rig.activeNode.mesh.getWorldPosition(tempPos);
      rig.group.position.copy(tempPos);

      // Escala del planeta y de los rayos
      const baseRadius = rig.activeNode.radius || 4.4;
      const kPalabra = (this.planetaK && this.planetaK.palabra) ? this.planetaK.palabra : 1.0;
      const planetR = Math.max(0.1, baseRadius * kPalabra);
      const coronaSize = planetR * 5.8;

      // Tiempo PROPIO del rig: frena si un impulso acaba de llegar a este planeta.
      const kRig = kBase * (1 - 0.75 * ((rig.activeNode && rig.activeNode.raySlow) || 0));
      rig.tMs = (rig.tMs || 0) + dt * kRig;
      const timeSec = rig.tMs * 0.001;

      // Actualizar shader de la corona
      rig.material.uniforms.uTime.value = timeSec;
      rig.material.uniforms.uIntensity.value = rig.intensity;

      // Escalar y rotar planos de corona
      rig.planes.forEach((pl, i) => {
        pl.scale.set(coronaSize, coronaSize, 1);
        pl.rotation.y = (Math.PI / 3) * i + timeSec * 0.4;
      });

      // Animar y regenerar rayos/arcos eléctricos 3D (con el freno: los rayos se
      // quedan casi quietos mientras dura la llegada).
      const shouldRegen = (now - rig.lastJitterTime > 45 / Math.max(0.08, kRig));
      if (shouldRegen) {
        rig.lastJitterTime = now;
      }

      const arcCount = rig.arcLines.length;
      for (let a = 0; a < arcCount; a++) {
        const line = rig.arcLines[a];
        const dir = rig.arcDirs[a];
        const posAttr = line.geometry.attributes.position;
        const posArray = posAttr.array;
        const segments = posArray.length / 3;

        // Longitud del rayo: pulsa con alta energía
        const lengthPulse = 1.0 + Math.sin(timeSec * 12.0 + a * 1.7) * 0.45;
        const maxDist = planetR * (2.4 + lengthPulse * 1.5) * rig.intensity;

        if (shouldRegen) {
          const perp = new THREE.Vector3().crossVectors(dir, upVec).normalize();
          if (perp.lengthSq() < 0.1) perp.set(1, 0, 0);
          const perp2 = new THREE.Vector3().crossVectors(dir, perp).normalize();

          for (let s = 0; s < segments; s++) {
            const frac = s / (segments - 1);
            const radialDist = planetR * 0.98 + (maxDist - planetR * 0.98) * frac;
            const p = dir.clone().multiplyScalar(radialDist);

            if (s > 0 && s < segments - 1) {
              const jitterAmp = planetR * 0.55 * frac * (0.8 + Math.random() * 0.6);
              const j1 = (Math.random() - 0.5) * jitterAmp;
              const j2 = (Math.random() - 0.5) * jitterAmp;
              p.addScaledVector(perp, j1);
              p.addScaledVector(perp2, j2);
            }

            posArray[s * 3] = p.x;
            posArray[s * 3 + 1] = p.y;
            posArray[s * 3 + 2] = p.z;
          }
          posAttr.needsUpdate = true;
        }

        const flicker = (0.55 + 0.45 * Math.random()) * rig.intensity;
        line.material.opacity = flicker;
      }
    }
  }

  // ============================================================================
  // UPDATE LOOP & CONTROLES
  // ============================================================================
  update(dt, now) {
    // PULSO DE LAS NEURONAS (panel P -> PLANETAS): acumuladores de tiempo ESCALADO.
    // Todo lo que "late" (shaders de las neuronas, chispas que viajan por los axones,
    // pulso electrico de las pelotitas, puentes de plasma) avanza con pv; el fondo lo
    // hace con fv. Con 0% esos tiempos quedan clavados: nada pulsa ni viaja.
    const pv = this.pulsoK();
    const fv = this.fondoK();
    this.pulsoMs += dt * pv;
    this.fondoMs += dt * fv;
    const tPulso = this.pulsoMs * 0.001;

    if (this.electricMaterial) {
      this.electricMaterial.uniforms.uTime.value = now * 0.001;
    }

    if (this.bgStarMat) this.bgStarMat.uniforms.uTime.value = this.fondoMs * 0.001;
    if (this.bgCellMat) this.bgCellMat.uniforms.uTime.value = this.fondoMs * 0.001;
    if (this.bgStars) this.bgStars.rotation.y += dt * 0.0000035 * fv;

    if (this.neuronMaterials && this.neuronMaterials.length > 0) {
      for (let i = 0; i < this.neuronMaterials.length; i++) {
        this.neuronMaterials[i].uniforms.uTime.value = tPulso;
      }
    }

    // Rotación axial lenta de cada planeta individual
    if (this.wordNodes) {
      const rotDelta = (dt / 1000) * 0.6;
      for (let i = 0; i < this.wordNodes.length; i++) {
        const n = this.wordNodes[i];
        if (n.mesh && !n.isClusterCenter) {
          n.mesh.rotation.y += rotDelta * 0.35;
        }
      }
    }

    // LLEGADA DE IMPULSOS: el freno de los rayos se recupera solo.
    this.arrivalSlowGlobal = Math.max(0, (this.arrivalSlowGlobal || 0) - dt / 700);
    this.updateOrderBridges(dt, now);
    this.updateNeuralField(dt, now);
    this.updateRayGlowSystem(dt, now);
    this.updateHalosLlegada(dt);

    // 1. Vuelo continuo entre neuronas (si está activo)
    if (this.isContinuousFlying && this.flightSpline) {
      // Velocidad del viaje automatico (panel P -> CAMARA). 0 = la camara no avanza.
      this.flightProgress += (dt / 1000) * (this.cam ? this.cam.animVel : 1) / this.flightDuration;

      if (this.flightProgress >= 1.0) {
        this.warpToOverview();
        return;
      }

      const pCurrent = this.flightSpline.getPoint(Math.min(0.999, this.flightProgress));
      const lookT = Math.min(1.0, this.flightProgress + 0.025);
      const pLookAhead = this.flightSpline.getPoint(lookT);

      this.camera.position.copy(pCurrent);
      this.camera.lookAt(pLookAhead);

      const tan1 = this.flightSpline.getTangent(Math.min(0.999, this.flightProgress));
      const tan2 = this.flightSpline.getTangent(lookT);
      const bankVector = tan1.clone().cross(tan2);
      const targetRoll = THREE.MathUtils.clamp(-bankVector.y * 22.0, -0.40, 0.40);
      this.roll = THREE.MathUtils.lerp(this.roll || 0, targetRoll, 0.08);
      this.camera.rotation.z = this.roll;

      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;

    // 2. Transición suave hacia un planeta (Warping con compensación orbital tipo diploia)
    } else if (this.isWarping && this.targetNode && this.targetNode.mesh) {
      this.warpTime += dt * 0.001 * (this.cam ? this.cam.warpVel : 1);   // velocidad de warp (panel P)
      const t = Math.min(1.0, this.warpTime / this.warpDuration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const targetPos = new THREE.Vector3();
      this.targetNode.mesh.getWorldPosition(targetPos);

      // Compensación de movimiento orbital durante la transición
      if (this._followInitialized && this._prevPlanetPos) {
        const delta = new THREE.Vector3().subVectors(targetPos, this._prevPlanetPos);
        this.camera.position.add(delta);
      }
      this._prevPlanetPos.copy(targetPos);
      this._followInitialized = true;

      const camOffset = new THREE.Vector3(
        Math.sin(this.followYaw) * Math.cos(this.followPitch) * this.followDistance,
        Math.sin(this.followPitch) * this.followDistance,
        Math.cos(this.followYaw) * Math.cos(this.followPitch) * this.followDistance
      );
      const desiredPos = targetPos.clone().add(camOffset);

      const posLerp = Math.max(0.06, ease * 0.18);
      this.camera.position.lerp(desiredPos, posLerp);

      // Orientar suavemente hacia el planeta
      const m = new THREE.Matrix4();
      m.lookAt(this.camera.position, targetPos, this.camera.up);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);
      this.camera.quaternion.slerp(targetQuat, Math.max(0.08, ease * 0.22));

      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;

      if (t >= 1.0 || this.camera.position.distanceTo(desiredPos) < 1.2) {
        this.isWarping = false;
        this.camera.position.copy(desiredPos);
        this.camera.lookAt(targetPos);
        this._prevPlanetPos.copy(targetPos);
      }

    // 3. Transición a vista panorámica (Overview)
    } else if (this.isWarping && !this.targetNode) {
      this.warpTime += dt * 0.001 * (this.cam ? this.cam.warpVel : 1);   // velocidad de warp (panel P)
      const t = Math.min(1.0, this.warpTime / this.warpDuration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerp(this.warpTarget, Math.max(0.05, ease * 0.15));

      let diffYaw = this.warpTargetYaw - this.yaw;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      this.yaw += diffYaw * 0.08;
      this.pitch += (this.warpTargetPitch - this.pitch) * 0.08;

      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);

      if (t >= 1.0 || this.camera.position.distanceTo(this.warpTarget) < 2.0) {
        this.isWarping = false;
        this.camera.position.copy(this.warpTarget);
        this.yaw = this.warpTargetYaw;
        this.pitch = this.warpTargetPitch;
      }

    // 4. MODO SEGUIMIENTO DE PLANETA (Requerimiento c: mantiene perspectiva mientras el planeta rota)
    } else if (this.followingNode && this.followingNode.mesh) {
      const targetPos = new THREE.Vector3();
      this.followingNode.mesh.getWorldPosition(targetPos);

      // Compensación de movimiento orbital (patrón CameraController diploia)
      if (this._followInitialized && this._prevPlanetPos) {
        const planetDelta = new THREE.Vector3().subVectors(targetPos, this._prevPlanetPos);
        this.camera.position.add(planetDelta);
      }
      this._prevPlanetPos.copy(targetPos);
      this._followInitialized = true;

      // Mantener perspectiva esférica relativa al planeta
      const camOffset = new THREE.Vector3(
        Math.sin(this.followYaw) * Math.cos(this.followPitch) * this.followDistance,
        Math.sin(this.followPitch) * this.followDistance,
        Math.cos(this.followYaw) * Math.cos(this.followPitch) * this.followDistance
      );
      const desiredPos = targetPos.clone().add(camOffset);

      this.camera.position.lerp(desiredPos, 0.16);
      this.camera.lookAt(targetPos);

      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;

    // 5. Vuelo libre manual o deriva cósmica suave
    } else {
      const isManual = (this.keys.KeyW || this.keys.KeyS || this.keys.KeyA || this.keys.KeyD || this.keys.KeyQ || this.keys.KeyE || this.keys.Space || this.keys.ShiftLeft);
      if (isManual || this.isMouseDown) {
        const moveDir = new THREE.Vector3();
        if (this.keys.KeyW) moveDir.z -= 1;
        if (this.keys.KeyS) moveDir.z += 1;
        if (this.keys.KeyA) moveDir.x -= 1;
        if (this.keys.KeyD) moveDir.x += 1;
        if (this.keys.KeyQ || this.keys.Space) moveDir.y += 1;
        if (this.keys.KeyE || this.keys.ShiftLeft) moveDir.y -= 1;

        moveDir.normalize();
        moveDir.applyQuaternion(this.camera.quaternion);

        this.velocity.lerp(moveDir.multiplyScalar(this.speed * (dt / 16.6)), 0.15);
        this.camera.position.add(this.velocity);
      } else {
        // Deriva cósmica continua suave solo cuando no sigue ningún planeta
        this.camera.position.x += Math.sin(now * 0.00028) * 0.12;
        this.camera.position.y += Math.cos(now * 0.00022) * 0.07;
        this.camera.position.z += Math.cos(now * 0.00018) * 0.12;
      }

      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
    }

    // Rotación de los cúmulos en el espacio cósmico
    if (this.clustersGroup) {
      this.clustersGroup.children.forEach((systemGroup, idx) => {
        systemGroup.rotation.y = now * 0.00015 * (idx % 2 === 0 ? 1 : -1);
      });
    }

    this.updateHUD(this.hoveredNode || this.followingNode || this.targetNode);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  warpToOverview() {
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.isCognitiveSearching = false;
    this.followingNode = null;
    this.targetNode = null;

    this.warpTarget.set(0, 160, 480);
    this.warpTargetYaw = 0;
    this.warpTargetPitch = -0.25;
    this.isWarping = true;
    this.warpProgress = 0;
    this.warpTime = 0;
    this.warpDuration = 1.8;
    soundFX.playActivate();

    const hudTarget = document.getElementById('cluster-hud-target');
    if (hudTarget) {
      hudTarget.textContent = 'CÚMULOS SEMÁNTICOS 3D // VISTA PANORÁMICA';
      hudTarget.style.color = '#ff000d';
    }
  }

  warpToNode(node) {
    if (!node || !node.mesh) return;
    this.targetNode = node;
    this.followingNode = node;
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.isWarping = true;
    this.warpTime = 0;
    this.warpDuration = 1.4;

    const targetPos = new THREE.Vector3();
    node.mesh.getWorldPosition(targetPos);

    // Dirección desde la posición actual de la cámara hacia el nodo objetivo
    let diff = new THREE.Vector3().subVectors(this.camera.position, targetPos);
    if (diff.length() < 0.1) diff.set(0, 10, 30);

    const distK = ((this.cam && this.cam.seguirDist) ? this.cam.seguirDist : 58) / 58;
    const standoff = (node.isClusterCenter ? 115 : 58) * distK;   // panel P -> distancia de seguimiento
    this.followDistance = standoff;
    this.followYaw = Math.atan2(diff.x, diff.z);
    this.followPitch = Math.atan2(diff.y, Math.sqrt(diff.x * diff.x + diff.z * diff.z));
    this.followPitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, this.followPitch));

    this._prevPlanetPos.copy(targetPos);
    this._followInitialized = false;

    this.updateHUD(node);
  }

  updateDendriticSparks(dt, now) {
    // Desactivado: no genera cuadraditos
  }

  // ============================================================================
  // CAMPO NEURONAL, BUS, ORDENES SICRE2 Y ESCALA DEL HUD
  // ============================================================================

  updateNeuralField(dt, now) {
    if (!this.wordNodes || this.wordNodes.length === 0) return;
    const camPos = this.camera.position;
    const isWarpOrFly = this.isWarping || this.isContinuousFlying || this.isCognitiveSearching;

    // Calcular proximidad y activar/desactivar neuronas orgánicamente
    for (let i = 0; i < this.wordNodes.length; i++) {
      const node = this.wordNodes[i];
      if (node.isClusterCenter) continue;
      if (!node.mesh || !node.mesh.material) continue;

      // Obtener posición mundial actual
      const worldPos = new THREE.Vector3();
      node.mesh.getWorldPosition(worldPos);
      node.position.copy(worldPos);

      const dist = camPos.distanceTo(worldPos);

      // Decaimiento de excitación de búsqueda
      if (node.searchExcitation > 0) {
        node.searchExcitation = Math.max(0, node.searchExcitation - (dt / 1000) * 0.7);
      }

      // Efecto de LLEGADA de un impulso: el destello se apaga y los rayos de este
      // planeta se recuperan solos.
      if (node.arrivalGlow > 0) node.arrivalGlow = Math.max(0, node.arrivalGlow - (dt / 1000) * 1.7);
      if (node.raySlow > 0) node.raySlow = Math.max(0, node.raySlow - (dt / 1000) * 0.9);

      // Proximidad de campo (radio 135 unidades)
      let proxFactor = 0;
      if (dist < 135.0) {
        proxFactor = Math.pow(Math.max(0, 1.0 - dist / 135.0), 1.35);
      }

      // Nivel de actividad objetivo
      let targetAct = 0.04;
      if (node.isOrderWord) {
        targetAct = 1.0;
      } else {
        targetAct = Math.max(0.04, Math.min(1.0, proxFactor * 1.15 + node.searchExcitation));
      }

      // Lerp suave de actividad
      node.currentActivity = THREE.MathUtils.lerp(node.currentActivity || 0.04, targetAct, 0.12);

      if (node.mesh.material.uniforms && node.mesh.material.uniforms.uActivity) {
        node.mesh.material.uniforms.uActivity.value = node.currentActivity;
      }
      if (node.mesh.material.uniforms && node.mesh.material.uniforms.uGlow) {
        node.mesh.material.uniforms.uGlow.value = node.arrivalGlow || 0;
      }
      node.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        node.mesh.material.emissiveIntensity || 0.06,
        0.06 + node.currentActivity * 2.2 + (node.arrivalGlow || 0) * 1.5,
        0.12
      );

      // Escala bio-elástica de la neurona al activarse
      // Escala bio-elastica sutil x el ajuste "planetas de palabras" del panel P
      const kPlaneta = (this.planetaK && this.planetaK.palabra !== undefined) ? this.planetaK.palabra : 1;
      const targetScale = (1.0 + node.currentActivity * 0.12 + (node.arrivalGlow || 0) * 0.10) * kPlaneta;
      node.mesh.scale.set(targetScale, targetScale, targetScale);

      // Opacidad de la etiqueta de texto: se PRENDE cerca de la cámara o al buscar, se APAGA al alejarse
      let targetLabelOp = 0.0;
      if (node.isOrderWord || node === this.followingNode || node === this.targetNode) {
        targetLabelOp = 1.0;
      } else if (node.searchExcitation > 0.08) {
        targetLabelOp = Math.min(1.0, node.searchExcitation * 1.5);
      } else if (dist < 110.0) {
        targetLabelOp = Math.pow(Math.max(0, 1.0 - (dist - 25.0) / 85.0), 1.25);
      }

      if (node.labelSprite && node.labelSprite.material) {
        node.labelSprite.material.opacity = THREE.MathUtils.lerp(node.labelSprite.material.opacity, targetLabelOp, 0.14);
      }

      // Encender axón hacia el núcleo del cluster
      if (node.axonLine && node.axonLine.material) {
        const axonOp = Math.max(0.04, node.currentActivity * 0.7);
        node.axonLine.material.opacity = THREE.MathUtils.lerp(node.axonLine.material.opacity, axonOp, 0.1);
      }
    }

    // Actualizar axones y potenciales de acción con intensidad según actividad
    if (this.actionPotentials && this.actionPotentials.length > 0) {
      const delta = dt / 1000;
      for (let i = 0; i < this.actionPotentials.length; i++) {
        const ap = this.actionPotentials[i];
        const actA = ap.nodeA ? (ap.nodeA.currentActivity || 0.04) : 0.04;
        const actB = ap.nodeB ? (ap.nodeB.currentActivity || 0.04) : 0.04;
        const maxAct = Math.max(actA, actB);

        // Acelerar y hacer visible el impulso si alguna de las neuronas está activa.
        // La VELOCIDAD DEL PULSO (panel P) multiplica el avance: 0% = no viaja.
        const effectiveSpeed = ap.speed * (0.6 + maxAct * 1.8) * this.pulsoK();
        const progresoPrevio = ap.progress;
        ap.progress = (ap.progress + delta * effectiveSpeed) % 1.0;
        // LLEGO: el impulso alcanzo el planeta B (dio la vuelta el recorrido).
        if (ap.progress < progresoPrevio && effectiveSpeed > 0.0001) this.dispararLlegadaImpulso(ap.nodeB);
        const pt = ap.curve.getPoint(ap.progress);
        ap.mesh.position.copy(pt);

        // Brillo del impulso
        const baseOpacity = maxAct > 0.12 ? (maxAct * 0.95) : 0.0;
        const fase = ap.fase === undefined ? (ap.fase = Math.random() * Math.PI * 2) : ap.fase;
        const pulso = this.pulsoPelotita(ap.mesh, this.pulsoMs, fase);   // escala + color electrico
        ap.mesh.material.opacity = baseOpacity * Math.sin(ap.progress * Math.PI) * this.brilloPelotita(this.pulsoMs, fase);
        const kPelotita = (this.planetaK && this.planetaK.pelotita !== undefined) ? this.planetaK.pelotita : 1;
        const sparkScale = (0.8 + maxAct * 1.2) * kPelotita * pulso;
        ap.mesh.scale.set(sparkScale, sparkScale, sparkScale);

        // Opacidad de la línea del axón entre las dos neuronas
        if (ap.line && ap.line.material) {
          const targetLineOp = Math.max(0.04, maxAct * 0.65);
          ap.line.material.opacity = THREE.MathUtils.lerp(ap.line.material.opacity, targetLineOp, 0.1);
        }
      }
    }
  }

  pulseOrderBridgesOnThought() {
    if (!this.orderBridges || this.orderBridges.length === 0) return;
    for (let i = 0; i < this.orderBridges.length; i++) {
      const b = this.orderBridges[i];
      b.speed = Math.min(1.2, b.speed + 0.15);
      if (b.pulseMesh) {
        const kPelotita = (this.planetaK && this.planetaK.pelotita !== undefined) ? this.planetaK.pelotita : 1;
        b.pulseMesh.scale.set(2.5 * kPelotita, 2.5 * kPelotita, 2.5 * kPelotita);
      }
    }
  }

  startCognitiveProcessingSearch(words) {
    if (!words || words.length === 0) return;
    this.start();

    console.log('[COSMOS 3D] ⚡ Iniciando simulación de búsqueda sináptica para:', words);

    // 1. Identificar los 3 nodos de destino
    const targetNodes = [];
    words.forEach(w => {
      const node = this.findBestNodeForWord(w);
      if (node && !targetNodes.includes(node)) targetNodes.push(node);
    });

    // Completar con nodos si no coinciden
    const available = this.wordNodes.filter(n => !n.isClusterCenter && !targetNodes.includes(n));
    while (targetNodes.length < 3 && available.length > 0) targetNodes.push(available.shift());
    if (targetNodes.length < 3) return;

    this.isCognitiveSearching = true;
    this.searchTargetNodes = targetNodes;

    // Actualizar HUD
    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#ff000d;">⚡ DESPOLARIZACIÓN COGNITIVA //</span> Escaneando red neuronal para: ${words.join(' • ').toUpperCase()}...`;
    }

    // Travesía de cámara suave hacia el primer cluster
    const p0 = new THREE.Vector3();
    targetNodes[0].mesh.getWorldPosition(p0);

    // Ondas de búsqueda: encender palabras candidatas a lo largo del hiperespacio
    let step = 0;
    const searchWaves = [
      { delay: 300, msg: '⚡ HIPERESPACIO VECTORIAL // Evaluando resonancia y antítesis...' },
      { delay: 1400, msg: '⚡ ACTIVACIÓN SINÁPTICA // Descartando falsos acoplamientos...' },
      { delay: 2600, msg: '⚡ CONVERGENCIA NEURAL // Fijando primer concepto...' }
    ];

    searchWaves.forEach((wInfo, i) => {
      setTimeout(() => {
        if (!this.isCognitiveSearching) return;
        if (statusEl) statusEl.innerHTML = `<span style="color:#ff000d;">${wInfo.msg}</span>`;
        
        // Encender un grupo aleatorio de neuronas vecinas
        const randomClusterIdx = Math.floor(Math.random() * (this.clustersData.length || 1));
        const clusterEntry = Array.from(this.clusterGroupMap.values())[randomClusterIdx];
        if (clusterEntry && clusterEntry.nodes) {
          clusterEntry.nodes.slice(0, 4).forEach(n => {
            n.searchExcitation = 1.0;
            if (n.labelSprite) n.labelSprite.material.opacity = 0.95;
          });
        }
        try { soundFX.playHover(); } catch (e) {}
      }, wInfo.delay);
    });

    // Fijación secuencial de las 3 palabras indicadas
    setTimeout(() => {
      this.handleGame3OrderWord(words[0], 1, 3);
    }, 3600);

    setTimeout(() => {
      this.handleGame3OrderWord(words[1], 2, 3);
    }, 5400);

    setTimeout(() => {
      this.handleGame3OrderWord(words[2], 3, 3);
      this.isCognitiveSearching = false;
    }, 7200);
  }

  initWebSocket() {
    try {
      const wsUrl = (typeof window.sbWsUrl === 'function')
        ? window.sbWsUrl()
        : (() => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${window.location.host}/ws`;
          })();
      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', () => {
        console.log('[COSMOS 3D] WebSocket conectado al bus de eventos.');
        this.ws.send(JSON.stringify({ type: 'client:register', client: 'cosmos3d' }));
      });

      this.ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'game3:words_sequence') {
            if (msg.phase === 'word_caught') {
              const wordToCatch = msg.newWord || (Array.isArray(msg.words) ? msg.words[msg.words.length - 1] : null);
              this.handleGame3OrderWord(wordToCatch, msg.orderIndex, msg.totalOrders || 3);
            } else if (msg.phase === 'processing_started') {
              // IA EMPEZÓ A PROCESAR: Encender simulación de búsqueda neuronal activa
              this.startCognitiveProcessingSearch(msg.words || []);
            } else if (msg.phase === 'resignification') {
              this.handleGame3Resignification(msg.words, msg.coldWords || [], msg.phrase || '');
            } else if (Array.isArray(msg.words) && msg.words.length > 0) {
              msg.words.forEach((w, idx) => {
                this.handleGame3OrderWord(w, idx + 1, msg.words.length);
              });
              const coldWords = Array.isArray(msg.coldWords) ? msg.coldWords : [];
              this.playNeuralSynapseSequence(msg.words, coldWords);
            }
          } else if (msg.type === 'agent:thought') {
            // Cada token generado por Gemma envía una micro-chispa a través de los puentes
            this.pulseOrderBridgesOnThought();
          } else if (msg.type === 'game3:state_reset' || msg.type === 'game3:flight_reset') {
            console.log('[COSMOS 3D] 🔄 Evento reset recibido de Game 3. Volviendo a reposo.');
            this.resetOrders();
            this.warpToOverview();
          }
        } catch (e) {}
      });

      this.ws.addEventListener('close', () => {
        setTimeout(() => this.initWebSocket(), 3500);
      });
    } catch (err) {
      console.warn('[COSMOS 3D] Error en initWebSocket:', err.message);
    }
  }

  handleGame3OrderWord(word, orderIndex = null, totalOrders = 3) {
    if (!word) return;
    const cleanWord = String(word).trim();
    if (!cleanWord) return;

    this.start();

    let slot = Number(orderIndex);
    if (!slot || slot < 1 || slot > 3) {
      slot = Math.min(3, this.activeOrders.length + 1);
    }

    console.log(`[COSMOS 3D] 🧠 ÓRDEN #${slot} FIJADA: "${cleanWord}"`);

    const candidates = this.wordNodes.filter(n => !n.isClusterCenter && n.mesh);
    const node = this.findBestNodeForWord(cleanWord, candidates);

    const existingIdx = this.activeOrders.findIndex(o => o.orderIndex === slot);
    if (existingIdx !== -1) {
      const prev = this.activeOrders[existingIdx];
      if (prev.badge) this.scene.remove(prev.badge);
      if (prev.node) {
        prev.node.isOrderWord = false;
        if (prev.node.mesh && prev.node.mesh.material && prev.node.mesh.material.uniforms) {
          prev.node.mesh.material.uniforms.uIsOrder.value = 0.0;
          prev.node.mesh.material.uniforms.uActivity.value = 0.04;
        }
      }
      this.activeOrders.splice(existingIdx, 1);
    }

    let badgeSprite = null;
    if (node) {
      node.isOrderWord = true;
      node.currentActivity = 1.0;
      if (node.mesh && node.mesh.material && node.mesh.material.uniforms) {
        node.mesh.material.uniforms.uIsOrder.value = 1.0;
        node.mesh.material.uniforms.uActivity.value = 1.0;
      }
      if (node.labelSprite && node.labelSprite.material) {
        node.labelSprite.material.opacity = 1.0;
      }

      badgeSprite = this.createOrder3DBadge(node, slot, cleanWord);
      this.scene.add(badgeSprite);

      if (this.activeOrders.length > 0) {
        const prevOrder = this.activeOrders[this.activeOrders.length - 1];
        if (prevOrder.node) {
          this.createOrderLightningBridge(prevOrder.node, node);
        }
      }

      if (slot === 3 && this.activeOrders.length >= 2) {
        const firstOrder = this.activeOrders.find(o => o.orderIndex === 1);
        if (firstOrder && firstOrder.node) {
          this.createOrderLightningBridge(node, firstOrder.node);
        }
      }

      this.warpToNode(node);
    }

    this.activeOrders.push({
      orderIndex: slot,
      word: cleanWord,
      node: node,
      badge: badgeSprite
    });

    this.updateOrdersHUD(slot, cleanWord, totalOrders);
    try { soundFX.playActivate(); } catch (e) {}
  }

  updateOrdersHUD(slot, word, totalOrders) {
    const slotEl = document.getElementById(`order-slot-${slot}`);
    const wordEl = document.getElementById(`order-word-${slot}`);
    if (slotEl) {
      slotEl.classList.remove('empty');
      slotEl.classList.add('filled', 'active-spark');
      setTimeout(() => slotEl.classList.remove('active-spark'), 700);
    }
    if (wordEl) {
      wordEl.textContent = word.toUpperCase();
    }

    if (slot >= 2) {
      const conn1 = document.getElementById('order-connector-1');
      if (conn1) conn1.classList.add('active');
    }
    if (slot >= 3) {
      const conn2 = document.getElementById('order-connector-2');
      if (conn2) conn2.classList.add('active');
    }

    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) {
      if (slot === 1) {
        statusEl.innerHTML = `<span style="color:#ff000d;">⚡ ÓRDEN #1 FIJADA:</span> "${word.toUpperCase()}" // Neurona despolarizada.`;
      } else if (slot === 2) {
        statusEl.innerHTML = `<span style="color:#ff000d;">⚡ ÓRDEN #2 FIJADA:</span> "${word.toUpperCase()}" // Puente sináptico 1 ➔ 2 forjado.`;
      } else if (slot === 3) {
        statusEl.innerHTML = `<span style="color:#ff000d;">🧠 CIRCUITO DE 3 ÓRDENES CERRADO:</span> "${word.toUpperCase()}" // Sintetizando pensamiento...`;
      }
    }
  }

  /** Escala los carteles del HUD de Sicre2 (DOM): pildoras de orden, frase y estado. */
  aplicarEscalaHUD() {
    const el = document.getElementById('neural-orders-hud');
    const k = Math.max(0, Number(this.ajustes && this.ajustes.hudPct) || 0) / 100;
    this.hudScale = k;
    if (!el) return false;
    el.style.transformOrigin = 'top left';
    el.style.transform = (Math.abs(k - 1) < 0.001) ? 'none' : 'scale(' + k.toFixed(2) + ')';
    return true;
  }

  updateOrderBridges(dt, now) {
    if (!this.orderBridges || this.orderBridges.length === 0) return;
    const delta = dt / 1000;
    for (let i = 0; i < this.orderBridges.length; i++) {
      const b = this.orderBridges[i];
      const progresoPrevio = b.progress;
      b.progress = (b.progress + delta * b.speed * this.pulsoK()) % 1.0;
      // LLEGO: el pulso de plasma alcanzo el planeta B -> halo sutil + rayos mas lentos.
      if (b.progress < progresoPrevio && this.pulsoK() > 0.0001) this.dispararLlegadaImpulso(b.nodeB);
      b.pulseMesh.position.copy(b.curve.getPoint(b.progress));
      const kPelotita = (this.planetaK && this.planetaK.pelotita !== undefined) ? this.planetaK.pelotita : 1;
      const faseP = b.fase === undefined ? (b.fase = Math.random() * Math.PI * 2) : b.fase;
      const pulsoP = this.pulsoPelotita(b.pulseMesh, this.pulsoMs, faseP);   // escala + color electrico
      b.pulseMesh.material.opacity = 0.95 * this.brilloPelotita(this.pulsoMs, faseP);
      const s = (1.0 + Math.sin(b.progress * Math.PI) * 1.8) * kPelotita * pulsoP;
      b.pulseMesh.scale.set(s, s, s);
      b.line.material.opacity = 0.65 + 0.35 * Math.sin(this.pulsoMs * 0.008 + i * 2);
    }
  }

  disposeSynapseNetwork() {
    if (this.synapseEdges && this.synapseEdges.length) {
      this.synapseEdges = [];
    }
    if (this.synapseGroup) {
      this.scene.remove(this.synapseGroup);
      this.synapseGroup = null;
    }
  }

  findBestNodeForWord(word, candidates = null) {
    const list = candidates || this.wordNodes.filter(n => !n.isClusterCenter && n.mesh);
    if (!word || list.length === 0) return null;

    const normalize = (s) => String(s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ').trim();

    const clean = String(word).toLowerCase().trim();
    const target = normalize(clean);

    let found = list.find(n => normalize(n.word) === target);
    if (found) return found;

    found = list.find(n => {
      const nw = normalize(n.word);
      return nw.includes(target) || target.includes(nw);
    });
    if (found) return found;

    return list[Math.floor(Math.random() * list.length)];
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'ShiftLeft'].includes(e.code)) {
          this.followingNode = null;
          this.targetNode = null;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
    });

    this.container.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const sens = 0.0035 * ((this.cam && this.cam.giro !== undefined) ? this.cam.giro : 1);
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;

        if (this.followingNode) {
          // Órbita interactiva alrededor del planeta seguido manteniendo perspectiva
          this.followYaw -= dx * sens;
          this.followPitch += dy * sens;
          this.followPitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, this.followPitch));
        } else {
          this.yaw -= dx * sens;
          this.pitch -= dy * sens;
          this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
        }
      } else {
        this.checkRaycastHover(e);
      }
    });

    // Zoom con rueda de ratón (acercar/alejar de planeta seguido o vuelo)
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.followingNode) {
        this.followDistance = Math.max(20, Math.min(220, this.followDistance + e.deltaY * 0.05));
      } else {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.addScaledVector(forward, -e.deltaY * 0.15);
      }
    }, { passive: false });

    this.container.addEventListener('click', (e) => {
      const hitNode = this.getRaycastNode(e);
      if (hitNode) {
        this.warpToNode(hitNode);
        soundFX.playActivate();
      }
    });

    const fsBtn = document.getElementById('btn-fullscreen-cluster-cosmos');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    const btnDemo = document.getElementById('btn-demo-orders');
    if (btnDemo) {
      btnDemo.addEventListener('click', (e) => {
        e.stopPropagation();
        this.simulateDemoOrders();
      });
    }

    const btnReset = document.getElementById('btn-reset-orders');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetOrders();
      });
    }
  }

  /** ¿El 3D está realmente en pantalla completa? */
  estaEnPantallaCompleta() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  /**
   * Pantalla completa = SOLO los planetas. Marca el <body> para que el CSS esconda
   * el menú de arriba, el HUD de órdenes (con el nombre), la telemetría (OBJETIVO /
   * COORDENADAS) y la guía de vuelo. El panel de ajustes (P) sigue disponible.
   */
  refrescarModoPantallaCompleta() {
    const on = this.estaEnPantallaCompleta();
    this.modoCine = on;
    try { document.body.classList.toggle('cosmos-pantalla-completa', on); } catch (e) {}
    setTimeout(() => this.handleResize(), 120);
    return on;
  }

  toggleFullscreen() {
    const elem = this.container || document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  getRaycastNode(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const targets = [];
    this.wordNodes.forEach(n => {
      if (n.mesh) targets.push(n.mesh);
      if (n.labelSprite && n.labelSprite.material && n.labelSprite.material.opacity > 0.05) {
        targets.push(n.labelSprite);
      }
    });
    const intersects = this.raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      return this.wordNodes.find(n => n.mesh === hitObj || n.labelSprite === hitObj);
    }
    return null;
  }

  checkRaycastHover(e) {
    const hitNode = this.getRaycastNode(e);
    if (hitNode) {
      if (this.hoveredNode !== hitNode) {
        if (this.hoveredNode && this.hoveredNode.mesh && this.hoveredNode.mesh.material && this.hoveredNode.mesh.material.uniforms && this.hoveredNode.mesh.material.uniforms.uHover) {
          this.hoveredNode.mesh.material.uniforms.uHover.value = 0.0;
        }
        this.hoveredNode = hitNode;
        soundFX.playHover();
      }
      this.renderer.domElement.style.cursor = 'pointer';
      this.updateHUD(hitNode);

      if (hitNode.mesh && hitNode.mesh.material && hitNode.mesh.material.uniforms && hitNode.mesh.material.uniforms.uHover) {
        hitNode.mesh.material.uniforms.uHover.value = 1.0;
      }
    } else {
      if (this.hoveredNode) {
        if (this.hoveredNode.mesh && this.hoveredNode.mesh.material && this.hoveredNode.mesh.material.uniforms && this.hoveredNode.mesh.material.uniforms.uHover) {
          this.hoveredNode.mesh.material.uniforms.uHover.value = 0.0;
        }
        this.hoveredNode = null;
        this.renderer.domElement.style.cursor = 'grab';
        this.updateHUD(this.targetNode);
      }
    }
  }

  updateHUD(node) {
    const targetEl = document.getElementById('cluster-hud-target');
    const coordsEl = document.getElementById('cluster-hud-coords');

    if (coordsEl && this.camera) {
      coordsEl.textContent = `X: ${Math.round(this.camera.position.x)}  Y: ${Math.round(this.camera.position.y)}  Z: ${Math.round(this.camera.position.z)}`;
    }

    if (targetEl) {
      if (node) {
        if (node.isClusterCenter) {
          targetEl.textContent = `CÚMULO: ${node.name.toUpperCase()}`;
          targetEl.style.color = node.color || '#ff000d';
        } else {
          targetEl.textContent = `${node.word.toUpperCase()} [${node.clusterName}]`;
          targetEl.style.color = node.color || '#f7555d';
        }
      } else {
        targetEl.textContent = 'Ninguno (Clic para enfocar neurona)';
        targetEl.style.color = '#b89496';
      }
    }
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = (now) => {
      const dt = Math.min(50, now - this.lastTime);
      this.lastTime = now;
      this.update(dt, now);
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this._bibliotecaTimer) {
      clearInterval(this._bibliotecaTimer);
      this._bibliotecaTimer = null;
    }
  }

  updateClusterNavButtons() {
    const bar = document.getElementById('cluster-3d-nav-bar');
    if (bar) bar.innerHTML = '';
  }
}
