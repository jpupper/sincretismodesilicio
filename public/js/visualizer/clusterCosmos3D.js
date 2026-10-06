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

/** Deja el texto en mayúsculas (requerimiento: todo en mayúsculas). */
function capitalizeFirst(str) {
  const s = String(str ?? '');
  return s.toUpperCase();
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
    vec3 sparkColor = mix(uElectricColor, uCoreColor, sparks * 0.45);
    somaColor += sparkColor * sparks * (0.22 + act * 0.95);

    // Vaina de mielina / membrana exterior
    somaColor += uBaseColor * fresnel * (0.20 + act * 0.75);

    // Respuesta a interacción hover: destello sináptico bio-eléctrico
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

    // LLEGADA DE UN IMPULSO: destello breve de la membrana
    if (uGlow > 0.01) {
      float g = clamp(uGlow, 0.0, 1.4);
      somaColor += uElectricColor * (0.45 * fresnel + 0.28 * sparks + 0.18) * g;
    }

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
    vec3 sparkColor = mix(uBaseColor, uCoreColor, sparks * 0.5);
    color += sparkColor * sparks * 1.35;
    color += uBaseColor * fresnel * 1.4;

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
    float tw = 0.55 + 0.45 * sin(uTime * 0.30 + aPhase * 6.2831);
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
    gl_FragColor = vec4(uColor * vTw, a * a * vTw * 0.30);
  }
`;
const fondoCellVertex = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;
/* ==========================================================================
   FONDO RDM: el mismo patron del shader "rdmf" de jpShadereditor que usa
   cambiapalabras (MASTER OUTPUT SHADER), portado a vec3 y muestreado con la
   DIRECCION de la esfera (mapa equirectangular del cielo). Como el patron queda
   fijo en el MUNDO, cuando la camara gira el patron gira con ella.
   Los colores salen de la PALETA GLOBAL (global_style.json): uColorA (acento
   primario, celdas) y uColorB (secundario, crestas).
   ========================================================================== */
const fondoCellFragment = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uRdmCnt;        // capas (fisico 1..20)
  uniform float uRdmIteScale;   // escala por capa (0..10)
  uniform float uRdmSpeedRnd;   // velocidad del random (0..1)
  uniform float uRdmSm1;
  uniform float uRdmSm2;
  uniform float uRdmForce;
  varying vec3 vDir;

  float rdMap(float v, float lo, float hi) { return lo + (hi - lo) * v; }
  mat2 rdRotate2d(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
  mat2 rdScale2d(vec2 sc) { return mat2(sc.x, 0.0, 0.0, sc.y); }
  float rdHash(vec2 p, float t) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43000.3 + t);
  }

  /* Ruido SUAVE en vez del ruido por CELDA (floor): antes cada celda devolvia un
     valor constante y el fondo se veia como CUADRADOS PLANOS (los "cuadrados
     rojos"). Ahora se interpolan los 4 vertices de la celda -> manchas suaves y
     continuas, sin bordes rectos. */
  float rdRandom(vec2 st, float t) {
    vec2 i = floor(st.xy), f = fract(st.xy);
    vec2 u = f * f * (3.0 - 2.0 * f);                      // suavizado entre celdas
    float a = rdHash(i, t);
    float b = rdHash(i + vec2(1.0, 0.0), t);
    float c = rdHash(i + vec2(0.0, 1.0), t);
    float d = rdHash(i + vec2(1.0, 1.0), t);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Patron RDM (port del shader rdmf): promedio de uRdmCnt capas de ruido
  // aleatorio con fase, rotacion y escala propias. Devuelve 0..1.
  float rdmPattern(vec2 uv, float tiempo) {
    int mcnt = int(floor(uRdmCnt));
    if (mcnt < 1) mcnt = 1;
    float mite = uRdmIteScale;
    float mspeedrdm = uRdmSpeedRnd;
    vec3 dib = vec3(1.0);
    for (int i = 1; i < 10; i++) {
      float fase = float(i) * 6.2831853 / float(mcnt);
      vec2 uv2 = uv;
      uv2 -= vec2(0.5); uv2 *= rdRotate2d(0.02 * tiempo); uv2 += vec2(0.5);
      uv2 -= vec2(0.5); uv2 *= rdScale2d(vec2(mite * float(i))); uv2 += vec2(0.5);
      float e = rdRandom(uv2 * mite * float(i), tiempo * mspeedrdm + fase);
      dib += vec3(e);
    }
    dib /= (float(mcnt) + 1.0);
    dib = smoothstep(uRdmSm1, max(uRdmSm2, uRdmSm1 + 0.001), dib);
    return clamp(dib.r * uRdmForce, 0.0, 1.0);
  }

  void main() {
    vec3 dir = normalize(vDir);
    // Mapa equirectangular de la esfera: la direccion (fija en el mundo) es la UV.
    vec2 uvSky = vec2(atan(dir.z, dir.x) * 0.15915494 + 0.5, dir.y * 0.5 + 0.5);
    // Frecuencia BAJA: el patron ya no se ve como ruido fino (pedido del artista:
    // "es un ruido que tiene mucha frecuencia"). Antes esto valia vec2(12.0, 7.8)
    // y las capas llegaban a escala 4.5 -> ~54 ciclos por unidad de cielo; ahora
    // 5.0/3.2 con capas hasta 0.28*9 = 2.5 -> ~12, y las manchas son grandes y lisas.
    uvSky *= vec2(5.0, 3.2);

    /* NUBES ROJAS PEQUENAS SOBRE NEGRO (pedido del artista: "que se vea como unas
       pequenas nubes rojas nada mas"). Dos cambios respecto de la version vieja:
         1) la banda del patron (RDM_BASE sm1/sm2 = 0.62/0.74) recorta la parte
            ALTA del ruido crudo, que vive entre ~0.36 y ~0.77 (medido), sin
            saturar: antes saturaba todo el cielo en una mancha clara gigante;
         2) se abandona el relleno de membrana y el contorno topografico y la
            salida queda muy atenuada (0.45 de brillo, 0.50 de alpha).
       Resultado: cielo practicamente negro con jirones rojos chicos y dispersos. */
    float nube = rdmPattern(uvSky, uTime);
    float resp = 0.82 + 0.18 * sin(uTime * 0.11);           // respiracion muy lenta
    float m = uIntensity * resp;
    vec3 col = uColorA * nube;
    float alpha = nube * 0.50 * m;
    // Salida mucho mas oscura que antes (0.75 de brillo, medido en vivo: picos de
    // ~R 110 sobre un cielo de media ~1.5/255).
    gl_FragColor = vec4(col * 0.75 * m, alpha);
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
      /* PATRON RDM DEL FONDO: cada uniform se maneja por separado (%, 100 = como esta).
         Pedido: "poder manejar cada valor del uniform del fondo por separado". */
      fondoRdmCnt: 100, fondoRdmIteScale: 100, fondoRdmSpeedRnd: 100,
      fondoRdmSm1: 100, fondoRdmSm2: 100, fondoRdmForce: 100,
      camAnimVel: 100, camWarpVel: 100, camSeguirDist: 58, camManualVel: 100, camGiroPct: 100
    };
    this.AJUSTES_MIN = {
      cartelPalabraPct: 0, cartelCategoriaPct: 0, cartelCapturaPct: 0, hudPct: 0,
      planetaPalabraPct: 0, planetaCategoriaPct: 0, pelotitaPct: 0,
      pelotitaElec: 0, pulsoVel: 0,
      rayosVel: 0, llegadaGlowPct: 0,
      fondoIntensidad: 0, fondoVel: 0,
      fondoRdmCnt: 0, fondoRdmIteScale: 0, fondoRdmSpeedRnd: 0,
      fondoRdmSm1: 0, fondoRdmSm2: 0, fondoRdmForce: 0,
      camAnimVel: 0, camWarpVel: 0, camSeguirDist: 0, camManualVel: 0, camGiroPct: 0
    };
    this.AJUSTES_TEXTO = ['pelotitaColor'];   // claves NO numericas (color hex)
    this.AJUSTES_MAX = {
      cartelPalabraPct: 400, cartelCategoriaPct: 400, cartelCapturaPct: 400, hudPct: 200,
      planetaPalabraPct: 400, planetaCategoriaPct: 400, pelotitaPct: 400,
      pelotitaElec: 300, pulsoVel: 400,
      rayosVel: 400, llegadaGlowPct: 300,
      fondoIntensidad: 300, fondoVel: 400,
      fondoRdmCnt: 300, fondoRdmIteScale: 300, fondoRdmSpeedRnd: 300,
      fondoRdmSm1: 300, fondoRdmSm2: 300, fondoRdmForce: 300,
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
    // Valores BASE de fabrica de cada uniform del patron RDM del fondo: el panel los
    // mueve en % sobre esto (100% = como estaba).
    // sm1/sm2 (0.55/0.70) recortan la parte ALTA del ruido crudo: el patron crudo
    // vive entre ~0.45 y ~0.71 (medido), asi que con los umbrales viejos (0.12/0.58)
    // TODO el cielo saturaba por encima de 0.9 y salia una unica mancha gigante y
    // clara. Con estos sobrevive ~15% del cielo: nubes chicas y separadas.
    // iteScale 0.28 (antes 0.5) baja la frecuencia: menos detalle fino, manchas mas
    // lisas y grandes.
    this.RDM_BASE = { cnt: 11, iteScale: 0.28, speedRnd: 0.5, sm1: 0.55, sm2: 0.70, force: 0.95 };
    // VELOCIDAD DEL TIEMPO DEL FONDO: pedido explicito del artista -> 0.00001, o sea
    // el fondo queda practicamente CONGELADO (el patron y el titileo apenas avanzan).
    // El panel (pestana FONDO -> velocidad) sigue escalando encima de esto.
    this.FONDO_TIME_BASE = 0.00001;
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
    // Requerimiento: el tamaño de las categorías tiene el mismo tamaño que las palabras comunes (6.5).
    this.TEXTO_BASE_WORLD = { word: 6.5, title: 6.5, badge: 16 };
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

    // Modo Idle Continuo (Requerimiento 3)
    this.lastUserInteraction = performance.now();
    this.idleDwellTimer = 0;
    this.idleCategoryIndex = 0;
    this.isIdleCruising = false;

    this.followYaw = 0;
    this.followPitch = 0.25;
    this.followDistance = 58;
    this._prevPlanetPos = new THREE.Vector3();
    this._followInitialized = false;

    // 2D Trajectory & Flight Tracking
    this.originNode = null;
    this.lastLandedNode = null;
    this.isTraveling = false;
    this.travelProgress = 1.0;

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
    if (document.fonts && typeof document.fonts.addEventListener === 'function') {
      document.fonts.addEventListener('loadingdone', () => { try { this.forzarRedibujoTextos(); } catch (e) {} });
    }
    window.addEventListener('globalstyle:applied', () => {
      try {
        this.aplicarColoresEsferas();
      } catch (e) {}
    });

    // Iniciar por defecto el recorrido cinemático continuo en la categoría HUMANA si nadie interactúa
    setTimeout(() => {
      if (!this.followingNode && !this.isWarping) {
        const catNodes = (this.wordNodes || []).filter(n => n.isClusterCenter && n.mesh);
        if (catNodes.length > 0) {
          const humIdx = catNodes.findIndex(cn => String(cn.clusterId).toLowerCase() === 'humana' || String(cn.name).toUpperCase() === 'HUMANA');
          this.idleCategoryIndex = humIdx >= 0 ? humIdx : 0;
          this.warpToNode(catNodes[this.idleCategoryIndex], true);
        }
      }
    }, 350);
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
        uColorB: { value: new THREE.Color(0x1c0004) },
        // Patron RDM de fondo. OJO: el rdmf divide por (cnt+1), asi que con
        // sm2 alto el cielo sale CASI NEGRO (medido: media 1.19/255 con sm2 0.86).
        // Estos valores lo dejan VISIBLE como celulas sin tapar las neuronas.
        uRdmCnt: { value: 11 },
        uRdmIteScale: { value: 0.28 },
        uRdmSpeedRnd: { value: 0.5 },
        uRdmSm1: { value: 0.55 },
        uRdmSm2: { value: 0.70 },
        uRdmForce: { value: 0.95 }
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
      /* PATRON RDM: cada uniform con su propio control (panel P -> pestana FONDO). */
      const pct = (clave) => Math.max(0, Number(a[clave] === undefined ? 100 : a[clave]) || 0) / 100;
      const B = this.RDM_BASE;
      const u = this.bgCellMat.uniforms;
      if (u.uRdmCnt)      u.uRdmCnt.value      = Math.max(1, Math.min(9, B.cnt * pct('fondoRdmCnt')));
      if (u.uRdmIteScale) u.uRdmIteScale.value = Math.max(0.01, B.iteScale * pct('fondoRdmIteScale'));
      if (u.uRdmSpeedRnd) u.uRdmSpeedRnd.value = B.speedRnd * pct('fondoRdmSpeedRnd');
      if (u.uRdmSm1)      u.uRdmSm1.value      = Math.min(0.99, B.sm1 * pct('fondoRdmSm1'));
      if (u.uRdmSm2)      u.uRdmSm2.value      = Math.min(1.0, B.sm2 * pct('fondoRdmSm2'));
      if (u.uRdmForce)    u.uRdmForce.value    = Math.min(2.0, B.force * pct('fondoRdmForce'));
      this.bgCellMat.visible = k > 0.001;
      // PATRON RDM + PALETA GLOBAL: el fondo del universo cumple la misma
      // seleccion de colores que cambiapalabras (global_style.json). Se lee en
      // vivo: si cambias la paleta en /globalstyle.html, el 3D la sigue.
      const col = (window.GlobalStyleConfig && window.GlobalStyleConfig.colores) || {};
      const cA = col.clusterEsfera || col.acento || '#ff000d';
      const cB = col.clusterNucleo || col.acento2 || '#9a000d';
      try {
        this.bgCellMat.uniforms.uColorA.value.set(cA);
        this.bgCellMat.uniforms.uColorB.value.set(cB);
      } catch (e) {}
    }
    if (this.bgStars) {
      this.bgStars.visible = k > 0.001;
      if (this.bgStarMat && this.bgStarMat.uniforms.uColor) {
        // Las estrellas tambien salen de la paleta (pelotita / texto), atenuadas.
        const col = (window.GlobalStyleConfig && window.GlobalStyleConfig.colores) || {};
        const cE = col.clusterPelotita || col.texto || '#ffd6d6';
        try { this.bgStarMat.uniforms.uColor.value.set(cE).multiplyScalar(k); }
        catch (e) { this.bgStarMat.uniforms.uColor.value.setRGB(1.0 * k, 0.42 * k, 0.42 * k); }
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
      const gs = window.GlobalStyleConfig;
      const col = (gs && gs.colores) || {};
      const baseEsferaHex = col.clusterEsfera || col.acento || null;
      let colorObj;
      let colorHex;
      if (baseEsferaHex) {
        colorObj = new THREE.Color(baseEsferaHex);
        if (clusterCount > 1) {
          const hsl = { h: 0, s: 0, l: 0 };
          colorObj.getHSL(hsl);
          const shiftL = ((idx % 3) - 1) * 0.06;
          colorObj.setHSL(hsl.h, hsl.s, Math.max(0.15, Math.min(0.85, hsl.l + shiftL)));
        }
        colorHex = '#' + colorObj.getHexString();
      } else {
        const hexColor = CLUSTER_RED_RAMP[idx % CLUSTER_RED_RAMP.length];
        colorHex = '#' + hexColor.toString(16).padStart(6, '0');
        colorObj = new THREE.Color(hexColor);
      }
      const nucleoColorObj = new THREE.Color(col.clusterNucleo || col.acento2 || '#9a000d');
      const pelotitaColorObj = new THREE.Color(col.clusterPelotita || col.acento || '#ffd6d6');

      const systemGroup = new THREE.Group();
      systemGroup.position.copy(clusterCenter);

      // 1. Núcleo macro-ganglionar central (Soma maestro) - Mismo tamaño base que palabras comunes (4.4)
      const coreGeo = new THREE.SphereGeometry(4.4, 24, 24);
      const coreMat = new THREE.ShaderMaterial({
        vertexShader: neuronVertexShader,
        fragmentShader: macroGanglionFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: colorObj },
          uCoreColor: { value: nucleoColorObj },
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
      titleSprite.position.set(0, 8, 0);
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
        radius: 4.4,
        breathePhase: Math.random() * Math.PI * 2
      };
      this.wordNodes.push(clusterNode);
      this.clusterCoreMeshes.push({ core: coreMesh, titleSprite: titleSprite });

      // 2. Neuronas de palabras individuales: somas bio-eléctricos
      const words = cluster.words || [];
      const wordCount = words.length;
      const isLargeCluster = wordCount > 40;
      const numShells = isLargeCluster ? Math.min(4, Math.ceil(wordCount / 35)) : 1;
      const clusterWordLocalNodes = [];

      words.forEach((w, wIdx) => {
        let wx, wy, wz;
        if (isLargeCluster) {
          const shellIdx = wIdx % numShells;
          const wordsInShell = Math.ceil(wordCount / numShells);
          const posInShell = Math.floor(wIdx / numShells);
          const baseShellRadius = 42 + shellIdx * 24 + (Math.cos(wIdx * 1.7) * 9);
          const wAngle = (posInShell / Math.max(1, wordsInShell)) * Math.PI * 2 + (shellIdx * 0.7) + (idx * 0.4);
          const elevation = Math.sin(wIdx * 2.3 + shellIdx * 1.3) * (20 + shellIdx * 9);
          wx = Math.cos(wAngle) * baseShellRadius;
          wy = elevation;
          wz = Math.sin(wAngle) * baseShellRadius;
        } else {
          const orbitRadiusStep = Math.max(34, Math.min(75, wordCount * 4.5));
          const wAngle = (wIdx / Math.max(1, wordCount)) * Math.PI * 2 + (idx * 0.4);
          const elevation = (Math.sin(wIdx * 2.2) * 22);
          const radius = orbitRadiusStep + (Math.cos(wIdx * 1.8) * 14);
          wx = Math.cos(wAngle) * radius;
          wy = elevation;
          wz = Math.sin(wAngle) * radius;
        }
        const localPos = new THREE.Vector3(wx, wy, wz);

        // Geometría y Shader vivo de neurona: DORMIDA POR DEFECTO (uActivity = 0.04)
        const planetGeo = new THREE.SphereGeometry(4.4, 24, 24);
        const planetMat = new THREE.ShaderMaterial({
          vertexShader: neuronVertexShader,
          fragmentShader: neuronFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uBaseColor: { value: colorObj },
            uCoreColor: { value: nucleoColorObj },
            uElectricColor: { value: pelotitaColorObj },
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

        const upperWord = String(w || '').toUpperCase();
        const upperCluster = String(cluster.name || '').toUpperCase();
        const wordNode = {
          isClusterCenter: false,
          word: upperWord,
          label: upperWord,
          clusterName: upperCluster,
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
      if (item.titleSprite) item.titleSprite.position.y = 8 * (k > 0 ? k : 1);
    });

    return { palabra: a.planetaPalabraPct, categoria: a.planetaCategoriaPct, pelotita: a.pelotitaPct };
  }

  /**
   * PELOTITAS DE NEURONA: color elegido + animacion electrica (escala y color).
   * El color se aplica YA a las que estan en escena; el pulso lo hace el loop frame a frame.
   */
  aplicarPelotitas() {
    const gs = window.GlobalStyleConfig;
    const col = (gs && gs.colores) || {};
    const hex = (col.clusterPelotita)
      ? col.clusterPelotita
      : (/^#[0-9a-f]{6}$/i.test(String(this.ajustes.pelotitaColor || ''))
        ? String(this.ajustes.pelotitaColor).toLowerCase()
        : '#ffd6d6');
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
    d.baseWidth = Math.max(0.0001, res.worldWidth);
    d.baseHeight = Math.max(0.0001, res.worldHeight);
    return true;
  }

  /**
   * Aplica los colores del DISENO GLOBAL (GLOBALSTYLE) a las esferas, núcleos, pelotitas y carteles 3D
   */
  aplicarColoresEsferas() {
    const gs = window.GlobalStyleConfig;
    const col = (gs && gs.colores) || {};
    const baseHex = col.clusterEsfera || col.acento || '#ff000d';
    const coreHex = col.clusterNucleo || col.acento2 || '#9a000d';
    const elecHex = col.clusterPelotita || col.acento || '#ffd6d6';

    const baseColor = new THREE.Color(baseHex);
    const coreColor = new THREE.Color(coreHex);
    const elecColor = new THREE.Color(elecHex);

    if (this.pelotita) {
      this.pelotita.color = elecColor.clone();
    }
    (this.actionPotentials || []).forEach((ap) => {
      if (ap.mesh && ap.mesh.material && ap.mesh.material.color) {
        ap.mesh.material.color.copy(elecColor);
      }
    });
    (this.orderBridges || []).forEach((b) => {
      if (b.pulseMesh && b.pulseMesh.material && b.pulseMesh.material.color) {
        b.pulseMesh.material.color.copy(elecColor);
      }
    });
    (this.halosLlegada || []).forEach((h) => {
      if (h.sprite && h.sprite.material && h.sprite.material.color) {
        h.sprite.material.color.copy(elecColor);
      }
    });

    (this.neuronMaterials || []).forEach((mat) => {
      if (mat.uniforms) {
        if (mat.uniforms.uBaseColor) mat.uniforms.uBaseColor.value.copy(baseColor);
        if (mat.uniforms.uCoreColor) mat.uniforms.uCoreColor.value.copy(coreColor);
        if (mat.uniforms.uElectricColor) mat.uniforms.uElectricColor.value.copy(elecColor);
      }
    });

    (this.wordNodes || []).forEach((node) => {
      if (node.axonLine && node.axonLine.material && node.axonLine.material.color) {
        node.axonLine.material.color.copy(baseColor);
      }
    });

    (this.rayRigs || []).forEach((rig) => {
      if (rig.material && rig.material.uniforms) {
        if (rig.material.uniforms.uColorCore) rig.material.uniforms.uColorCore.value.copy(coreColor);
        if (rig.material.uniforms.uColorRay) rig.material.uniforms.uColorRay.value.copy(baseColor);
        if (rig.material.uniforms.uColorSpark) rig.material.uniforms.uColorSpark.value.copy(elecColor);
      }
      (rig.arcLines || []).forEach((line, a) => {
        if (line.material && line.material.color) {
          line.material.color.copy((a % 3 === 0) ? elecColor : ((a % 2 === 0) ? baseColor : coreColor));
        }
      });
    });

    this.forzarRedibujoTextos();
  }

  /** Fuerza a re-dibujar TODOS los carteles (cambio de fuente, paleta, etc.). */
  forzarRedibujoTextos() {
    if (!this.scene) return 0;
    let n = 0;
    this.scene.traverse((obj) => {
      if (obj.isSprite && obj.userData && obj.userData.kind) { obj.userData.pct = -1; n++; }
    });
    this.refrescarTamanoTextos();
    return n;
  }

  /**
   * Fuente de los carteles del 3D. Sale del DISENO GLOBAL (GLOBALSTYLE) si esta
   * cargado: asi la tipografia del cúmulo se elige desde un solo lugar.
   */
  fuenteCarteles() {
    try {
      const gs = window.GlobalStyleConfig;
      if (gs && gs.fuente) return '"' + gs.fuente + '", monospace';
      if (window.GS_FONT_FAMILY) return window.GS_FONT_FAMILY;
    } catch (e) {}
    return '"Share Tech Mono", monospace';
  }

  /** Colores sincronizados con el DISENO GLOBAL (GLOBALSTYLE) */
  coloresCarteles(colorHex) {
    const gs = window.GlobalStyleConfig;
    const col = (gs && gs.colores) || {};
    const borde = col.clusterCajaBorde || col.borde || colorHex || '#ff000d';
    const texto = col.texto || '#ffffff';
    const acento = col.clusterEsfera || col.acento || colorHex || '#ff000d';
    let fondo = 'rgba(0, 0, 0, 0.88)';
    if (col.clusterCajaFill) {
      if (window.GlobalStyle && typeof window.GlobalStyle.hexARgba === 'function') {
        const op = (gs && gs.contenedores && gs.contenedores.opacidadPanel != null) ? gs.contenedores.opacidadPanel : 0.88;
        fondo = window.GlobalStyle.hexARgba(col.clusterCajaFill, op);
      } else {
        fondo = col.clusterCajaFill;
      }
    } else if (col.panel && window.GlobalStyle && typeof window.GlobalStyle.hexARgba === 'function') {
      const op = (gs && gs.contenedores && gs.contenedores.opacidadPanel != null) ? gs.contenedores.opacidadPanel : 0.90;
      fondo = window.GlobalStyle.hexARgba(col.panel, op);
    }
    return { borde, texto, acento, fondo };
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
    const text = String(wordText || '').trim().toUpperCase();
    const canvasHeight = this.lienzoAltoParaMundo(worldH);
    const f = canvasHeight / 2;                      // 40px de lienzo -> tipografia 20px
    const padX = Math.round(f * 0.7);
    const c = this.coloresCarteles(colorHex);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    const textWidth = Math.max(Math.round(f), Math.ceil(measureCtx.measureText(text).width));
    const canvasWidth = Math.max(Math.round(f * 3), textWidth + padX * 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // 3) Requerimiento: El fondo de las palabras en cluster las que están encima de cada palabra no tienen relleno.
    // Se elimina ctx.fillRect para que el fondo sea completamente transparente y no tape el cosmos/planetas.

    // Marco con el borde de globalstyle (solo trazo exterior, sin relleno de fondo)
    ctx.strokeStyle = c.borde;
    ctx.lineWidth = Math.max(1, f * 0.08);
    ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

    // Letras en MAYÚSCULAS con tipografía global y color de texto de GlobalStyle
    ctx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Contorno oscuro suave para legibilidad perfecta contra el cosmos sin relleno de fondo
    ctx.lineWidth = Math.max(2, f * 0.12);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(text, canvasWidth / 2, canvasHeight / 2);

    ctx.fillStyle = c.texto;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    return { canvas: canvas, worldWidth: (canvasWidth / canvasHeight) * worldH, worldHeight: worldH };
  }

  createWordSprite(wordText, colorHex, pct) {
    const p = (pct === undefined || pct === null) ? this.ajustes.cartelPalabraPct : Number(pct);
    const upperText = String(wordText || '').trim().toUpperCase();
    const res = this.dibujarPalabraCanvas(upperText, colorHex, this.mundoDePct('word', p));

    const texture = new THREE.CanvasTexture(res.canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.0 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(Math.max(0.0001, res.worldWidth), Math.max(0.0001, res.worldHeight), 1);
    sprite.userData = {
      kind: 'word',
      text: upperText,
      colorHex: colorHex,
      pct: Math.round(p),
      baseWidth: Math.max(0.0001, res.worldWidth),
      baseHeight: Math.max(0.0001, res.worldHeight)
    };
    return sprite;
  }

  /** Lienzo de un cartel de categoria. worldH = altura FINAL en unidades de la escena. */
  dibujarCartelCanvas(titleText, colorHex, worldH) {
    const text = String(titleText || '').toUpperCase();
    const canvasHeight = this.lienzoAltoParaMundo(worldH);
    const f = canvasHeight / 2;                      // Mismo ratio y tamaño de tipografía que las palabras comunes
    const padX = Math.round(f * 0.7);
    const c = this.coloresCarteles(colorHex);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    const textWidth = Math.max(Math.round(f), Math.ceil(measureCtx.measureText(text).width));

    // ANCHO AJUSTADO AL TEXTO
    const canvasWidth = Math.max(Math.round(f * 3), textWidth + padX * 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    const insetY = 1;
    const insetX = 1;
    const boxW = canvasWidth - insetX * 2;
    const boxH = canvasHeight - insetY * 2;

    // Fondo negro puro para categorías
    ctx.fillStyle = '#000000';
    ctx.fillRect(insetX, insetY, boxW, boxH);

    ctx.strokeStyle = c.borde;
    ctx.lineWidth = Math.max(1, f * 0.08);
    ctx.strokeRect(insetX, insetY, boxW, boxH);

    // Sin glow en las letras
    ctx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = Math.max(2, f * 0.12);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(text, canvasWidth / 2, canvasHeight / 2);

    ctx.fillStyle = c.texto;
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
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 1.0 });
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
    const c = this.coloresCarteles('#ff000d');

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    const textWidth = Math.ceil(measureCtx.measureText(upper).width);

    const canvasWidth = Math.max(Math.round(canvasHeight * 3.657), textWidth + inset * 2 + f);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = c.fondo;
    ctx.fillRect(inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2);

    ctx.strokeStyle = c.acento;
    ctx.lineWidth = Math.max(1, canvasHeight * 0.0214);
    ctx.strokeRect(inset, inset, canvasWidth - inset * 2, canvasHeight - inset * 2);

    ctx.font = 'bold ' + fontHeader + 'px ' + this.fuenteCarteles();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.acento;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillText('\u26a1 ORDEN CEREBRAL #0' + orderIndex + ' // SICRE2', canvasWidth / 2, canvasHeight * 0.30);

    ctx.font = 'bold ' + f + 'px ' + this.fuenteCarteles();
    ctx.fillStyle = c.texto;
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
    this.isTraveling = true;
    this.travelProgress = 0.0;
    this.originNode = this.followingNode || this.lastLandedNode || matchedNodes[0];
    this.targetNode = matchedNodes[0];

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

      // Color dinámico de rayos según el planeta activo y paleta global (Requerimiento 5a)
      const gs = window.GlobalStyleConfig;
      const col = (gs && gs.colores) || {};
      const baseHex = col.clusterEsfera || col.acento || '#00f0ff';
      const nodeColHex = (rig.activeNode && (rig.activeNode.color || (rig.activeNode.cluster && rig.activeNode.cluster.color))) || baseHex;
      const nodeColor = new THREE.Color(nodeColHex);
      const coreColor = new THREE.Color(col.clusterNucleo || col.acento2 || '#ffffff');
      const elecColor = new THREE.Color(col.clusterPelotita || '#ffd6d6');

      if (rig.material.uniforms.uColorRay) rig.material.uniforms.uColorRay.value.copy(nodeColor);
      if (rig.material.uniforms.uColorCore) rig.material.uniforms.uColorCore.value.copy(coreColor);
      if (rig.material.uniforms.uColorSpark) rig.material.uniforms.uColorSpark.value.copy(elecColor);

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
        if (line && line.material && line.material.color) {
          const lCol = (a % 3 === 0) ? elecColor : ((a % 2 === 0) ? nodeColor : coreColor);
          line.material.color.copy(lCol);
        }
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

    if (this.bgStarMat) this.bgStarMat.uniforms.uTime.value = this.fondoMs * 0.001 * this.FONDO_TIME_BASE;
    if (this.bgCellMat) this.bgCellMat.uniforms.uTime.value = this.fondoMs * 0.001 * this.FONDO_TIME_BASE;
    if (this.bgStars) this.bgStars.rotation.y += dt * 0.0000035 * fv * this.FONDO_TIME_BASE;

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
    this.updateAlienNavHUD(dt, now);

    // =========================================================================
    // MODO IDLE: Navegación lenta continua de categoría en categoría (Requerimiento 3)
    // =========================================================================
    const isManualInput = (this.keys.KeyW || this.keys.KeyS || this.keys.KeyA || this.keys.KeyD || 
                           this.keys.KeyQ || this.keys.KeyE || this.keys.Space || this.keys.ShiftLeft || 
                           this.isMouseDown);
    if (isManualInput) {
      this.lastUserInteraction = now;
      this.isIdleCruising = false;
    }

    const idleElapsed = now - (this.lastUserInteraction || 0);
    const isIdle = idleElapsed > 3500 && !isManualInput;

    if (isIdle) {
      const categoryNodes = (this.wordNodes || []).filter(n => n.isClusterCenter && n.mesh);
      if (categoryNodes.length > 0) {
        if (this.isWarping) {
          // El viaje suave lento hacia la categoría está en curso
        } else if (this.followingNode) {
          // Órbita lenta continua alrededor de la categoría para revelar todas sus palabras
          this.followYaw += dt * 0.00026;
          this.idleDwellTimer = (this.idleDwellTimer || 0) + (dt / 1000);

          // Tras 8.5 segundos de exhibición orbital pausada, transita lentamente a la siguiente categoría
          if (this.idleDwellTimer >= 8.5) {
            this.idleDwellTimer = 0;
            const currIdx = categoryNodes.findIndex(cn => cn === this.followingNode || cn.clusterId === this.followingNode.clusterId);
            const nextIdx = (currIdx >= 0 ? (currIdx + 1) : 0) % categoryNodes.length;
            const nextCategory = categoryNodes[nextIdx];
            this.warpToNode(nextCategory, true); // true = viaje lento cinemático (6.5s)
          }
        } else {
          // Sin objetivo actual: arranca el tour cinemático lento tras 1.2 segundos
          this.idleDwellTimer = (this.idleDwellTimer || 0) + (dt / 1000);
          if (this.idleDwellTimer >= 1.2) {
            this.idleDwellTimer = 0;
            if (this.idleCategoryIndex === undefined || this.idleCategoryIndex === null) {
              const humIdx = categoryNodes.findIndex(cn => String(cn.clusterId).toLowerCase() === 'humana' || String(cn.name).toUpperCase() === 'HUMANA');
              this.idleCategoryIndex = humIdx >= 0 ? humIdx : 0;
            } else {
              this.idleCategoryIndex = (this.idleCategoryIndex || 0) % categoryNodes.length;
            }
            this.warpToNode(categoryNodes[this.idleCategoryIndex], true);
          }
        }
      }
    } else {
      this.idleDwellTimer = 0;
    }

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
      this.travelProgress = t;
      this.isTraveling = true;
      // Interpolación suave C2 (smootherstep: aceleración y frenado suaves en los extremos)
      const ease = t * t * t * (t * (6 * t - 15) + 10);

      const targetPos = new THREE.Vector3();
      this.targetNode.mesh.getWorldPosition(targetPos);

      // Compensación de movimiento orbital durante la transición
      if (this._followInitialized && this._prevPlanetPos) {
        const delta = new THREE.Vector3().subVectors(targetPos, this._prevPlanetPos);
        if (this.warpStartPos) this.warpStartPos.add(delta);
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

      if (this.warpStartPos) {
        this.camera.position.lerpVectors(this.warpStartPos, desiredPos, ease);
      } else {
        this.camera.position.lerp(desiredPos, Math.max(0.08, ease * 0.25));
      }

      // Orientar suavemente hacia el planeta mediante slerp continuo de cuaterniones
      const m = new THREE.Matrix4();
      m.lookAt(this.camera.position, targetPos, this.camera.up);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);
      this.camera.quaternion.slerp(targetQuat, Math.min(1.0, 0.08 + ease * 0.22));

      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;

      if (t >= 1.0) {
        this.isWarping = false;
        this.isTraveling = false;
        this.travelProgress = 1.0;
        this.camera.position.copy(desiredPos);
        this._prevPlanetPos.copy(targetPos);
        this.lastLandedNode = this.targetNode;
        this.followingNode = this.targetNode;
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

      this.camera.position.lerp(desiredPos, 0.14);

      // Orientación fluida continua sin sacudidas ni saltos bruscos
      const mFollow = new THREE.Matrix4();
      mFollow.lookAt(this.camera.position, targetPos, this.camera.up);
      const followQuat = new THREE.Quaternion().setFromRotationMatrix(mFollow);
      this.camera.quaternion.slerp(followQuat, 0.16);

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
  }

  warpToNode(node, isSlowIdle = false) {
    if (!node || !node.mesh) return;
    const prev = this.followingNode || this.lastLandedNode;
    if (prev && prev !== node) {
      this.originNode = prev;
    } else {
      let minDist = Infinity;
      let closest = null;
      const camPos = this.camera ? this.camera.position : new THREE.Vector3();
      for (let i = 0; i < (this.wordNodes || []).length; i++) {
        const n = this.wordNodes[i];
        if (n === node || n.isClusterCenter || !n.mesh) continue;
        const d = camPos.distanceTo(n.mesh.position);
        if (d < minDist) {
          minDist = d;
          closest = n;
        }
      }
      this.originNode = closest || prev;
    }
    this.targetNode = node;
    this.followingNode = null;
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.isWarping = true;
    this.isTraveling = true;
    this.travelProgress = 0.0;
    this.warpTime = 0;
    this.warpDuration = isSlowIdle ? 6.5 : 1.4;
    this.warpStartPos = this.camera ? this.camera.position.clone() : new THREE.Vector3();

    const targetPos = new THREE.Vector3();
    node.mesh.getWorldPosition(targetPos);

    // Dirección desde la posición actual de la cámara hacia el nodo objetivo
    let diff = new THREE.Vector3().subVectors(this.camera.position, targetPos);
    if (diff.length() < 0.1) diff.set(0, 10, 30);

    const distK = ((this.cam && this.cam.seguirDist) ? this.cam.seguirDist : 58) / 58;
    const isBig = node.isClusterCenter && (node.clusterId === 'humana' || String(node.name).toUpperCase() === 'HUMANA');
    const standoff = (node.isClusterCenter ? (isBig ? 140 : 115) : 58) * distK;   // panel P -> distancia de seguimiento
    this.followDistance = standoff;
    this.followYaw = Math.atan2(diff.x, diff.z);
    this.followPitch = Math.atan2(diff.y, Math.sqrt(diff.x * diff.x + diff.z * diff.z));
    this.followPitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, this.followPitch));

    this._prevPlanetPos.copy(targetPos);
    this._followInitialized = false;
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
      const isCurrentClusterWord = (this.followingNode && this.followingNode.isClusterCenter && node.clusterId === this.followingNode.clusterId);
      if (node.isOrderWord || node === this.followingNode || node === this.targetNode || isCurrentClusterWord) {
        targetLabelOp = 1.0;
      } else if (node.searchExcitation > 0.08) {
        targetLabelOp = Math.min(1.0, node.searchExcitation * 1.5);
      } else if (dist < 110.0) {
        targetLabelOp = Math.pow(Math.max(0, 1.0 - (dist - 25.0) / 85.0), 1.25);
      }

      if (node.labelSprite && node.labelSprite.material) {
        node.labelSprite.material.opacity = THREE.MathUtils.lerp(node.labelSprite.material.opacity, targetLabelOp, 0.14);

        // Escala adaptativa en función de la distancia a la cámara (Requerimiento 2.a):
        // De lejos conserva su tamaño base para máxima legibilidad panorámica.
        // Al acercarse la cámara al planeta, se reduce suavemente para no verse desproporcionadamente gigante.
        const baseW = (node.labelSprite.userData && node.labelSprite.userData.baseWidth) || 12.0;
        const baseH = (node.labelSprite.userData && node.labelSprite.userData.baseHeight) || 3.0;
        const distK = Math.min(1.0, Math.max(0.35, Math.pow(Math.max(8.0, dist) / 75.0, 0.72)));
        const targetW = baseW * distK;
        const targetH = baseH * distK;
        node.labelSprite.scale.x = THREE.MathUtils.lerp(node.labelSprite.scale.x, targetW, 0.18);
        node.labelSprite.scale.y = THREE.MathUtils.lerp(node.labelSprite.scale.y, targetH, 0.18);
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
          
          if (msg.type === 'globalstyle:update' || msg.type === 'globalstyle:updated') {
            if (window.GlobalStyle && typeof window.GlobalStyle.aplicar === 'function') {
              window.GlobalStyle.aplicar(msg.config);
            }
            this.aplicarColoresEsferas();
            return;
          }

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
          } else if (msg.type === 'globalstyle:update') {
            if (msg.config && window.GlobalStyle && typeof window.GlobalStyle.aplicar === 'function') {
              window.GlobalStyle.aplicar(msg.config);
            }
            this.aplicarColoresEsferas();
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
    const markInteraction = () => {
      this.lastUserInteraction = performance.now();
      this.isIdleCruising = false;
    };

    window.addEventListener('keydown', (e) => {
      markInteraction();
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'ShiftLeft'].includes(e.code)) {
          this.followingNode = null;
          this.targetNode = null;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      markInteraction();
      if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
    });

    this.container.addEventListener('mousedown', (e) => {
      markInteraction();
      if (e.button === 0) {
        this.isMouseDown = true;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      markInteraction();
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        markInteraction();
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
      markInteraction();
      e.preventDefault();
      if (this.followingNode) {
        this.followDistance = Math.max(20, Math.min(220, this.followDistance + e.deltaY * 0.05));
      } else {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.addScaledVector(forward, -e.deltaY * 0.15);
      }
    }, { passive: false });

    this.container.addEventListener('click', (e) => {
      markInteraction();
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
      }
    }
  }

  /* updateHUD() ELIMINADO: alimentaba el contenedor "TELEMETRÍA NODAL"
     (OBJETIVO / COORDENADAS), que el artista pidió sacar por completo. */

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

  // ============================================================================
  // MONITOR ALIENÍGENA 2D, GIROSCÓPIO CIBERNÉTICO & VELOCIDAD 3D
  // Requerimientos 5c, 5d, 5f
  // ============================================================================
  initAlienNavHUD() {
    this.alienHUD = {
      container: document.getElementById('alien-nav-hud'),
      canvasVelX: document.getElementById('canvas-vel-x'),
      canvasVelY: document.getElementById('canvas-vel-y'),
      canvasVelZ: document.getElementById('canvas-vel-z'),
      valVelX: document.getElementById('val-vel-x'),
      valVelY: document.getElementById('val-vel-y'),
      valVelZ: document.getElementById('val-vel-z'),
      canvasGyro: document.getElementById('canvas-alien-gyro'),
      textGyro: document.getElementById('alien-gyro-text'),
      lastCamPos: this.camera ? this.camera.position.clone() : new THREE.Vector3(),
      smoothVel: new THREE.Vector3(),
      displacement2D: 0,
      gridOffset: { x: 0, y: 0 }
    };

    this.semanticTreeHUD = {
      container: document.getElementById('semantic-tree-hud'),
      canvas: document.getElementById('canvas-semantic-tree'),
      activeWord: document.getElementById('semantic-active-word'),
      activePrefix: document.getElementById('semantic-active-prefix'),
      statusBadge: document.getElementById('semantic-status-badge'),
      activeCluster: document.getElementById('semantic-active-cluster'),
      valDelta: document.getElementById('semantic-tree-delta'),
      footerText: document.getElementById('semantic-tree-footer-text')
    };
  }

  getActiveTrajectoryState() {
    let isTraveling = false;
    let originNode = this.originNode;
    let destNode = this.targetNode || this.followingNode;
    let progress = 1.0;
    let status = 'CÁMARA POSADA';

    // A) En vuelo continuo de cámara
    if (this.isContinuousFlying && this.flightNodes && this.flightNodes.length > 0) {
      const nCount = this.flightNodes.length;
      const stepProg = 1.0 / nCount;
      const currentTargetIdx = Math.min(nCount - 1, Math.floor(this.flightProgress / stepProg));
      const segmentProgress = (this.flightProgress - currentTargetIdx * stepProg) / stepProg;
      const prevIdx = currentTargetIdx > 0 ? currentTargetIdx - 1 : 0;

      originNode = (currentTargetIdx === 0) ? (this.originNode || this.flightNodes[0]) : this.flightNodes[prevIdx];
      destNode = this.flightNodes[currentTargetIdx];
      progress = Math.max(0, Math.min(1, segmentProgress));
      isTraveling = true;
      status = 'RECORRIENDO RUTA';

    // B) En warp entre planetas
    } else if (this.isWarping && this.targetNode && !this.targetNode.isClusterCenter) {
      destNode = this.targetNode;
      if (!originNode || originNode === destNode) {
        originNode = this.lastLandedNode;
      }
      progress = Math.min(1.0, this.warpTime / this.warpDuration);
      isTraveling = true;
      status = 'WARP EN TRAYECTORIA';

    // C) Posado en órbita siguiendo el planeta
    } else if (this.followingNode && !this.followingNode.isClusterCenter) {
      destNode = this.followingNode;
      originNode = this.followingNode;
      progress = 1.0;
      isTraveling = false;
      status = 'CÁMARA POSADA // ÓRBITA';

    // D) Fallback a palabra más cercana si vuela libre
    } else {
      let minDist = Infinity;
      let closest = null;
      const camPos = this.camera ? this.camera.position : new THREE.Vector3();
      for (let i = 0; i < (this.wordNodes || []).length; i++) {
        const n = this.wordNodes[i];
        if (n.isClusterCenter || !n.mesh) continue;
        const d = camPos.distanceTo(n.mesh.position);
        if (d < minDist) {
          minDist = d;
          closest = n;
        }
      }
      destNode = closest;
      originNode = closest;
      progress = 1.0;
      isTraveling = false;
      status = 'VUELO LIBRE';
    }

    if (originNode && !originNode.mesh) originNode = null;
    if (destNode && !destNode.mesh) destNode = null;

    return {
      isTraveling,
      originNode,
      destNode,
      progress,
      status
    };
  }

  getActiveTouringWordNode() {
    const traj = this.getActiveTrajectoryState();
    return {
      node: traj.destNode || traj.originNode,
      status: traj.status
    };
  }

  updateAlienNavHUD(dt, now) {
    if (!this.alienHUD || !this.semanticTreeHUD) {
      this.initAlienNavHUD();
      if (!this.alienHUD) return;
    }
    const hud = this.alienHUD;
    const sHud = this.semanticTreeHUD;

    const dtSec = Math.max(0.001, dt * 0.001);

    // 1. Calcular velocidad real de la cámara (delta entre fotogramas)
    const currentCamPos = this.camera ? this.camera.position : new THREE.Vector3();
    const deltaPos = currentCamPos.clone().sub(hud.lastCamPos);
    hud.lastCamPos.copy(currentCamPos);

    const instantVel = deltaPos.clone().divideScalar(dtSec);
    // Mezclar con this.velocity si estuviera volando manualmente
    if (this.velocity && this.velocity.lengthSq() > 0.001) {
      instantVel.add(this.velocity.clone().divideScalar(dtSec));
    }
    // Suavizado lerp de la velocidad para que las flechas se muevan fluidas
    hud.smoothVel.lerp(instantVel, 0.20);

    const vx = hud.smoothVel.x;
    const vy = hud.smoothVel.y;
    const vz = hud.smoothVel.z;

    const distDelta = Math.sqrt(deltaPos.x * deltaPos.x + deltaPos.z * deltaPos.z);
    hud.displacement2D += distDelta;
    hud.gridOffset.x = (hud.gridOffset.x + deltaPos.x * 0.4) % 20;
    hud.gridOffset.y = (hud.gridOffset.y + deltaPos.z * 0.4) % 20;

    // Paleta de colores globales
    const gs = window.GlobalStyleConfig;
    const col = (gs && gs.colores) || {};
    const primaryHex = col.acento || '#c85a32';
    const secondaryHex = col.acento2 || '#dca876';

    // 2. Renderizar Vectores 3D Normalizados: Rotación, Velocidad y Posición con Flecha 3D (Requerimiento 2)
    if (hud.container && !hud.container.classList.contains('hud-hidden')) {
      // Vector 1: Rotación (Dirección 3D a la que apunta la cámara, normalizado)
      const rotDir = new THREE.Vector3();
      if (this.camera) this.camera.getWorldDirection(rotDir);
      this.renderVector3DBox(hud.canvasVelX, hud.valVelX, rotDir, 'rot', primaryHex, now);

      // Vector 2: Velocidad 3D de la cámara (normalizado con flecha 3D y magnitud en texto)
      this.renderVector3DBox(hud.canvasVelY, hud.valVelY, hud.smoothVel, 'vel', secondaryHex, now);

      // Vector 3: Posición 3D de la cámara respecto al origen cósmico (normalizado con flecha 3D y distancia en texto)
      const camPos = this.camera ? this.camera.position.clone() : new THREE.Vector3();
      this.renderVector3DBox(hud.canvasVelZ, hud.valVelZ, camPos, 'pos', primaryHex, now);

      this.renderAlienGyro(hud.canvasGyro, hud.textGyro, primaryHex, secondaryHex, now);
    }

    // 3. Resolver estado de trayectoria y palabras (Requerimiento: trayectoria 2D y palabras aledañas)
    const traj = this.getActiveTrajectoryState();

    // 4. Renderizar Panel de Trayectoria & Palabras Aledañas 2D (esquina inferior derecha)
    if (sHud && (!sHud.container || !sHud.container.classList.contains('hud-hidden'))) {
      if (traj.isTraveling && traj.originNode && traj.destNode && traj.originNode !== traj.destNode) {
        if (sHud.statusBadge) sHud.statusBadge.textContent = traj.status;
        if (sHud.activeCluster) {
          sHud.activeCluster.textContent = `DE: ${(traj.originNode.label || '').toUpperCase()} ➔ A: ${(traj.destNode.label || '').toUpperCase()}`;
        }
        if (sHud.activePrefix) sHud.activePrefix.textContent = 'RUMBO:';
        if (sHud.activeWord) {
          sHud.activeWord.textContent = (traj.destNode.label || '').toUpperCase();
        }
        if (sHud.valDelta) {
          sHud.valDelta.textContent = `VUELO: ${(traj.progress * 100).toFixed(0)}%`;
        }
        if (sHud.footerText) {
          sHud.footerText.textContent = 'TRAYECTORIA INTERPLANETARIA // PALABRAS ALEDAÑAS';
        }
      } else {
        const activeNode = traj.destNode || traj.originNode;
        if (sHud.statusBadge) sHud.statusBadge.textContent = traj.status;
        if (sHud.activeCluster) {
          const cName = activeNode && activeNode.cluster ? (activeNode.cluster.label || activeNode.cluster.id) : 'SISTEMA';
          sHud.activeCluster.textContent = `CÚMULO: ${String(cName).toUpperCase()}`;
        }
        if (sHud.activePrefix) sHud.activePrefix.textContent = 'EN ÓRBITA:';
        if (sHud.activeWord) {
          sHud.activeWord.textContent = activeNode ? (activeNode.label || '').toUpperCase() : '---';
        }
        if (sHud.valDelta) {
          sHud.valDelta.textContent = `Δ: ${(hud.displacement2D || 0).toFixed(1)}`;
        }
        if (sHud.footerText) {
          sHud.footerText.textContent = 'VECINDAD SEMÁNTICA // PALABRAS ALEDAÑAS';
        }
      }

      this.renderTrajectoryRadar2D(sHud.canvas, traj, primaryHex, secondaryHex, now);
    }
  }

  renderVector3DBox(canvas, valEl, rawVec, type, accentColor, now) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Fondo y marco táctico con micro-esquinas cibernéticas
    ctx.strokeStyle = 'rgba(255, 0, 13, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // Esquinas tácticas
    ctx.strokeStyle = 'rgba(220, 168, 118, 0.40)';
    ctx.lineWidth = 1;
    const bLen = 5;
    ctx.beginPath();
    ctx.moveTo(3, 3 + bLen); ctx.lineTo(3, 3); ctx.lineTo(3 + bLen, 3);
    ctx.moveTo(w - 3 - bLen, 3); ctx.lineTo(w - 3, 3); ctx.lineTo(w - 3, 3 + bLen);
    ctx.moveTo(3, h - 3 - bLen); ctx.lineTo(3, h - 3); ctx.lineTo(3 + bLen, h - 3);
    ctx.moveTo(w - 3 - bLen, h - 3); ctx.lineTo(w - 3, h - 3); ctx.lineTo(w - 3, h - 3 - bLen);
    ctx.stroke();

    // Etiqueta de tipo en esquina superior izquierda
    ctx.fillStyle = type === 'rot' ? 'rgba(240, 185, 130, 0.95)' : 'rgba(220, 168, 118, 0.75)';
    ctx.font = 'bold 9.5px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    const tagText = type === 'rot' ? 'VEC·ROT 3D' : (type === 'vel' ? 'VEC·VEL 3D' : 'VEC·POS 3D');
    ctx.fillText(tagText, 6, 14);

    // Manejo de valores y magnitudes
    const vec = (rawVec && typeof rawVec.length === 'function') ? rawVec.clone() : new THREE.Vector3();
    const mag = vec.length();

    if (valEl) {
      if (type === 'rot') {
        const pDeg = Math.round((this.camera ? this.camera.rotation.x : 0) * 180 / Math.PI);
        const yDeg = Math.round((this.camera ? this.camera.rotation.y : 0) * 180 / Math.PI);
        valEl.textContent = `P:${pDeg}° Y:${yDeg}°`;
        valEl.style.color = accentColor;
        valEl.style.fontSize = '15.5px';
        valEl.style.fontWeight = '900';
      } else if (type === 'vel') {
        valEl.textContent = `${mag.toFixed(1)} u/s`;
        valEl.style.color = mag > 0.05 ? accentColor : '#888';
        valEl.style.fontSize = '14.5px';
        valEl.style.fontWeight = '700';
      } else if (type === 'pos') {
        valEl.textContent = `${Math.round(mag)} u`;
        valEl.style.color = accentColor;
        valEl.style.fontSize = '14.5px';
        valEl.style.fontWeight = '700';
      }
    }

    // Normalizar vector (o dejar en 0 si está en reposo)
    const norm = mag > 0.001 ? vec.clone().divideScalar(mag) : new THREE.Vector3(0, 0, 0);

    // Proyección 3D Isométrica / Tridimensional en el lienzo 2D
    const cosT = Math.cos(0.60); // rotación azimutal ~34°
    const sinT = Math.sin(0.60);
    const cosP = Math.cos(0.44); // inclinación cenital ~25°
    const sinP = Math.sin(0.44);

    const R = 30; // radio de la esfera de referencia

    function project3D(x, y, z, scale) {
      const rx = (x * cosT - z * sinT) * scale;
      const rz = (x * sinT + z * cosT);
      const ry = (-y * cosP + rz * sinP) * scale;
      return { px: cx + rx, py: cy + ry, depth: rz };
    }

    // 1. Disco ecuatorial 3D (plano XZ, piso de referencia)
    ctx.strokeStyle = 'rgba(220, 168, 118, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let a = 0; a <= 24; a++) {
      const ang = (a / 24) * Math.PI * 2;
      const pt = project3D(Math.cos(ang), 0, Math.sin(ang), R);
      if (a === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
    }
    ctx.stroke();

    // 2. Ejes 3D cardinales tenues (+X, +Y, +Z)
    ctx.lineWidth = 0.8;
    // Eje Y (arriba)
    const yAx = project3D(0, 1, 0, R * 0.40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(yAx.px, yAx.py); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.font = '8px monospace';
    ctx.fillText('+Y', yAx.px + 2, yAx.py);

    // Eje X (lateral)
    const xAx = project3D(1, 0, 0, R * 0.40);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(xAx.px, xAx.py); ctx.stroke();

    // Eje Z (frontal)
    const zAx = project3D(0, 0, 1, R * 0.40);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(zAx.px, zAx.py); ctx.stroke();

    // Centro / Origen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();

    // 3. Si la magnitud es nula o casi nula (ej. velocidad en reposo)
    if (mag < 0.05 && type === 'vel') {
      const pulseR = 2.5 + Math.sin(now * 0.005) * 1.0;
      ctx.strokeStyle = 'rgba(220, 168, 118, 0.40)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, pulseR, 0, Math.PI * 2); ctx.stroke();
      return;
    }

    // 4. Vector 3D Normalizado: punto de destino y sombra sobre el piso
    const tip3D = project3D(norm.x, norm.y, norm.z, R);
    const floor3D = project3D(norm.x, 0, norm.z, R);

    // Sombra proyectada en el plano base (XZ)
    ctx.strokeStyle = 'rgba(220, 168, 118, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(floor3D.px, floor3D.py);
    ctx.stroke();

    // Línea de altura vertical desde el piso hacia la punta
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(floor3D.px, floor3D.py);
    ctx.lineTo(tip3D.px, tip3D.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Cuerpo / asta de la flecha 3D
    const shaftFraction = 0.68;
    const shaftEnd3D = project3D(norm.x * shaftFraction, norm.y * shaftFraction, norm.z * shaftFraction, R);

    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3.2;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(shaftEnd3D.px, shaftEnd3D.py);
    ctx.stroke();
    ctx.restore();

    // 6. Cabeza de la Flecha 3D (Cono / Pirámide tridimensional)
    const upRef = Math.abs(norm.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const perp1 = new THREE.Vector3().crossVectors(norm, upRef).normalize();
    const perp2 = new THREE.Vector3().crossVectors(norm, perp1).normalize();

    const baseCenter = norm.clone().multiplyScalar(0.68);
    const headRadius = 0.20;

    const baseVertices = [];
    const facetCount = 4;
    for (let f = 0; f < facetCount; f++) {
      const fAng = (f / facetCount) * Math.PI * 2 + (Math.PI / 4);
      const v = baseCenter.clone()
        .addScaledVector(perp1, Math.cos(fAng) * headRadius)
        .addScaledVector(perp2, Math.sin(fAng) * headRadius);
      baseVertices.push(project3D(v.x, v.y, v.z, R));
    }

    // Dibujar las 4 facetas triangulares del cono 3D con sombreado volumétrico
    for (let f = 0; f < facetCount; f++) {
      const vA = baseVertices[f];
      const vB = baseVertices[(f + 1) % facetCount];

      const avgDepth = (vA.depth + vB.depth + tip3D.depth) / 3;
      const shade = Math.max(0.45, Math.min(1.0, 0.70 + avgDepth * 0.30));

      ctx.fillStyle = accentColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = shade;

      ctx.beginPath();
      ctx.moveTo(tip3D.px, tip3D.py);
      ctx.lineTo(vA.px, vA.py);
      ctx.lineTo(vB.px, vB.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Punta luminosa de la flecha 3D
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(tip3D.px, tip3D.py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  renderAlienGyro(canvas, textEl, primaryHex, secondaryHex, now) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const pitch = this.camera ? this.camera.rotation.x : 0;
    const yaw = this.camera ? this.camera.rotation.y : 0;
    const roll = this.camera ? this.camera.rotation.z : 0;

    const pDeg = Math.round(pitch * 180 / Math.PI);
    const yDeg = Math.round(yaw * 180 / Math.PI);
    const rDeg = Math.round(roll * 180 / Math.PI);

    if (textEl) {
      textEl.textContent = `P: ${pDeg}° · Y: ${yDeg}° · R: ${rDeg}°`;
    }

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Anillo Exterior Alienígena (Yaw Ring - radio ampliado a 60px)
    ctx.save();
    ctx.rotate(yaw);
    ctx.strokeStyle = primaryHex;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = primaryHex;
    ctx.shadowBlur = 8;

    // Arcos alienígenas segmentados
    const segments = 12;
    const radiusOut = 60;
    for (let i = 0; i < segments; i++) {
      const startA = (i * (Math.PI * 2 / segments)) + 0.05;
      const endA = ((i + 1) * (Math.PI * 2 / segments)) - 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, radiusOut, startA, endA);
      ctx.stroke();

      // Marcas / Runas alienígenas en cada sector
      const tickA = startA + 0.08;
      const tx1 = Math.cos(tickA) * (radiusOut - 6);
      const ty1 = Math.sin(tickA) * (radiusOut - 6);
      const tx2 = Math.cos(tickA) * (radiusOut + 6);
      const ty2 = Math.sin(tickA) * (radiusOut + 6);
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Anillo Medio Gimbal (Pitch Ring - radio 44px)
    ctx.save();
    ctx.rotate(roll);
    ctx.scale(1.0, Math.cos(pitch) * 0.75 + 0.25);
    ctx.strokeStyle = secondaryHex;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = secondaryHex;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();

    // Cruz interna del horizonte artificial
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-38, 0); ctx.lineTo(-14, 0);
    ctx.moveTo(14, 0);  ctx.lineTo(38, 0);
    ctx.stroke();
    ctx.restore();

    // 3. Retículo Central de Roll (Giro Z - radio 22px)
    ctx.save();
    ctx.rotate(roll);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Punteros del visor más grandes
    ctx.fillStyle = primaryHex;
    ctx.beginPath();
    ctx.moveTo(0, -25); ctx.lineTo(-5, -18); ctx.lineTo(5, -18); ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aguja de barrido alienígena
    const sweepA = (now * 0.0015) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepA) * 60, Math.sin(sweepA) * 60);
    ctx.stroke();

    ctx.restore();
  }

  renderTrajectoryRadar2D(canvas, traj, primaryHex, secondaryHex, now) {
    if (!canvas || !this.wordNodes || this.wordNodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const gs = window.GlobalStyleConfig;
    const fontFam = (gs && gs.fuente) ? `"${gs.fuente}", monospace` : '"Space Mono", monospace';

    // 1. Grilla y fondo táctico de radar cósmico
    ctx.save();
    const offX = (this.alienHUD ? this.alienHUD.gridOffset.x : 0);
    const offY = (this.alienHUD ? this.alienHUD.gridOffset.y : 0);
    ctx.strokeStyle = 'rgba(200, 90, 50, 0.08)';
    ctx.lineWidth = 1;
    for (let x = (offX % 24) - 24; x < w + 24; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = (offY % 24) - 24; y < h + 24; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Esquinas tácticas (Steampunk brackets)
    ctx.strokeStyle = 'rgba(220, 168, 118, 0.35)';
    ctx.lineWidth = 1.2;
    const bLen = 8;
    ctx.beginPath(); ctx.moveTo(6, 6 + bLen); ctx.lineTo(6, 6); ctx.lineTo(6 + bLen, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 6 - bLen, 6); ctx.lineTo(w - 6, 6); ctx.lineTo(w - 6, 6 + bLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, h - 6 - bLen); ctx.lineTo(6, h - 6); ctx.lineTo(6 + bLen, h - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 6 - bLen, h - 6); ctx.lineTo(w - 6, h - 6); ctx.lineTo(w - 6, h - 6 - bLen); ctx.stroke();

    // =========================================================================
    // MODO A: EN TRAYECTORIA ENTRE PLANETAS (Vuelo/Warp de Planeta A a Planeta B)
    // =========================================================================
    if (traj.isTraveling && traj.originNode && traj.destNode && traj.originNode !== traj.destNode && traj.originNode.mesh && traj.destNode.mesh) {
      // Coordenadas ampliadas para el lienzo de 420x280
      const P0 = { x: 65, y: 215 };
      const P1 = { x: 355, y: 65 };
      const Pctrl = { x: 195, y: 85 };

      function bezierPt(t) {
        const inv = 1 - t;
        return {
          x: inv * inv * P0.x + 2 * inv * t * Pctrl.x + t * t * P1.x,
          y: inv * inv * P0.y + 2 * inv * t * Pctrl.y + t * t * P1.y
        };
      }
      function bezierTan(t) {
        return {
          x: 2 * (1 - t) * (Pctrl.x - P0.x) + 2 * t * (P1.x - Pctrl.x),
          y: 2 * (1 - t) * (Pctrl.y - P0.y) + 2 * t * (P1.y - Pctrl.y)
        };
      }

      // 1. Resplandor difuso del corredor de vuelo ampliado
      ctx.strokeStyle = 'rgba(200, 90, 50, 0.14)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(P0.x, P0.y);
      ctx.quadraticCurveTo(Pctrl.x, Pctrl.y, P1.x, P1.y);
      ctx.stroke();

      // 2. Doble carril guía hiperespacial (guías paralelas punteadas)
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(220, 168, 118, 0.28)';
      ctx.setLineDash([4, 4]);
      [-6, 6].forEach(offset => {
        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const st = s / 24;
          const pt = bezierPt(st);
          const tan = bezierTan(st);
          const len = Math.hypot(tan.x, tan.y) || 1;
          const nx = -tan.y / len;
          const ny = tan.x / len;
          const rx = pt.x + nx * offset;
          const ry = pt.y + ny * offset;
          if (s === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 3. Tramo recorrido (haz sólido de cobre con resplandor)
      const prog = Math.max(0.001, Math.min(1.0, traj.progress));
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = primaryHex;
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let s = 0; s <= 28; s++) {
        const st = (s / 28) * prog;
        const pt = bezierPt(st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Tramo restante (corredor punteado animado hacia el destino)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(220, 168, 118, 0.55)';
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -now * 0.025;
      ctx.beginPath();
      for (let s = 0; s <= 28; s++) {
        const st = prog + (s / 28) * (1.0 - prog);
        const pt = bezierPt(st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Flechas guía / chevrons (>>) a lo largo de la curva
      [0.28, 0.68].forEach(ct => {
        const cp = bezierPt(ct);
        const ctTan = bezierTan(ct);
        const cAngle = Math.atan2(ctTan.y, ctTan.x);
        ctx.save();
        ctx.translate(cp.x, cp.y);
        ctx.rotate(cAngle);
        ctx.strokeStyle = 'rgba(255, 225, 198, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, -4); ctx.lineTo(3, 0); ctx.lineTo(-5, 4);
        ctx.moveTo(1, -4); ctx.lineTo(9, 0); ctx.lineTo(1, 4);
        ctx.stroke();
        ctx.restore();
      });

      // 6. Pulso de fotones viajando periódicamente por la ruta
      const pulseT = (now * 0.0008) % 1.0;
      const pulsePt = bezierPt(pulseT);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pulsePt.x, pulsePt.y, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // =========================================================================
      // PALABRAS ALEDAÑAS (Nodos más grandes y etiquetas legibles)
      // =========================================================================
      const posA = new THREE.Vector3();
      const posB = new THREE.Vector3();
      traj.originNode.mesh.getWorldPosition(posA);
      traj.destNode.mesh.getWorldPosition(posB);

      const dirAB = posB.clone().sub(posA);
      const lenAB = dirAB.length();
      const unitAB = dirAB.clone().normalize();

      const aledanos = [];
      for (let i = 0; i < (this.wordNodes || []).length; i++) {
        const n = this.wordNodes[i];
        if (n === traj.originNode || n === traj.destNode || n.isClusterCenter || !n.mesh) continue;
        const pN = new THREE.Vector3();
        n.mesh.getWorldPosition(pN);

        const vA = pN.clone().sub(posA);
        const proj = vA.dot(unitAB);
        const u = lenAB > 0.001 ? proj / lenAB : 0.5;

        const closestPt = posA.clone().add(unitAB.clone().multiplyScalar(Math.max(0, Math.min(lenAB, proj))));
        const distToSegment = pN.distanceTo(closestPt);

        // Signo perpendicular en el espacio 3D
        const perp = vA.clone().sub(unitAB.clone().multiplyScalar(proj));
        const crossY = unitAB.clone().cross(perp).y;
        const side = crossY >= 0 ? 1 : -1;

        aledanos.push({ node: n, u, dist: distToSegment, side });
      }

      // Tomar las 6 palabras aledañas más cercanas a la trayectoria
      aledanos.sort((a, b) => a.dist - b.dist);
      const topAledanos = aledanos.slice(0, 6);

      topAledanos.forEach((item, idx) => {
        // Clampear u entre 0.12 y 0.88 para distribuirlas a lo largo del corredor
        const uClamped = Math.max(0.12, Math.min(0.88, item.u));
        const curvePt = bezierPt(uClamped);
        const tan = bezierTan(uClamped);
        const tLen = Math.hypot(tan.x, tan.y) || 1;
        const nx = -tan.y / tLen;
        const ny = tan.x / tLen;

        // Alternar lado si se agrupan demasiado
        const sideSign = (idx % 2 === 0) ? -1 : 1;
        const offsetDist = Math.max(38, Math.min(85, 34 + idx * 7.5 + item.dist * 0.12));
        let wx = curvePt.x + nx * (sideSign * offsetDist);
        let wy = curvePt.y + ny * (sideSign * offsetDist);

        // Clampear dentro de los límites del lienzo ampliado
        wx = Math.max(35, Math.min(w - 35, wx));
        wy = Math.max(26, Math.min(h - 26, wy));

        // Detección de proximidad con la nave/sonda en vuelo
        const isProximity = Math.abs(prog - uClamped) < 0.13;

        // Línea conectora punteada entre la trayectoria y la palabra aledaña
        ctx.strokeStyle = isProximity ? primaryHex : 'rgba(220, 168, 118, 0.38)';
        ctx.lineWidth = isProximity ? 2.0 : 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(curvePt.x, curvePt.y);
        ctx.lineTo(wx, wy);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isProximity) {
          // Pulso de proximidad / escaneo en la palabra aledaña
          const pingR = 7 + (now * 0.015) % 12;
          ctx.strokeStyle = primaryHex;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(wx, wy, pingR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Nodo punto de la palabra aledaña más grande
        const dotCol = item.node.color || secondaryHex;
        ctx.fillStyle = dotCol;
        ctx.beginPath();
        ctx.arc(wx, wy, isProximity ? 6.5 : 5.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx, wy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Distancia métrica sobre la línea conectora
        const midX = (curvePt.x + wx) / 2;
        const midY = (curvePt.y + wy) / 2;
        ctx.fillStyle = isProximity ? '#ffffff' : 'rgba(220, 168, 118, 0.85)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Δ${Math.round(item.dist * 0.1)}`, midX, midY - 3);

        // Etiqueta tipográfica de la palabra aledaña ampliada
        ctx.fillStyle = isProximity ? '#ffffff' : '#edd3be';
        ctx.font = (isProximity ? 'bold 12px ' : '10.5px ') + fontFam;
        ctx.textAlign = wx > curvePt.x ? 'left' : 'right';
        const labelX = wx > curvePt.x ? wx + 8 : wx - 8;
        ctx.fillText((item.node.label || '').toUpperCase(), labelX, wy + 3.5);
      });

      // =========================================================================
      // NAVE / SONDA EN VUELO (Tamaño ampliado y efectos nítidos)
      // =========================================================================
      const probePt = bezierPt(prog);
      const probeTan = bezierTan(prog);
      const probeAngle = Math.atan2(probeTan.y, probeTan.x);

      ctx.save();
      ctx.translate(probePt.x, probePt.y);
      ctx.rotate(probeAngle);

      // Estela de plasma del propulsor
      const flamePulse = 0.6 + 0.4 * Math.sin(now * 0.03);
      ctx.fillStyle = `rgba(255, 180, 80, ${flamePulse})`;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-20 * flamePulse, 0);
      ctx.lineTo(-15, 4);
      ctx.closePath();
      ctx.fill();

      // Fuselaje cibernético de la nave / sonda ampliado
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-7, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Haz de radar frontal
      ctx.strokeStyle = 'rgba(220, 168, 118, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI / 5, Math.PI / 5);
      ctx.stroke();

      ctx.restore();

      // Porcentaje de progreso flotante sobre la nave
      ctx.fillStyle = secondaryHex;
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(prog * 100)}%`, probePt.x, probePt.y - 14);

      // =========================================================================
      // ANCLAS: PLANETA DE ORIGEN Y PLANETA DE DESTINO AMPLIADOS
      // =========================================================================
      // Planeta de Origen
      ctx.fillStyle = '#8f634b';
      ctx.beginPath(); ctx.arc(P0.x, P0.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200, 90, 50, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(P0.x, P0.y, 13, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = '#8f634b';
      ctx.font = `8px ${fontFam}`;
      ctx.textAlign = 'left';
      ctx.fillText('ORIGEN', P0.x - 16, P0.y + 18);
      ctx.fillStyle = '#edd3be';
      ctx.font = `bold 11px ${fontFam}`;
      ctx.fillText((traj.originNode.label || '').toUpperCase(), P0.x - 16, P0.y + 32);

      // Planeta de Destino
      const destPulse = 1.0 + 0.25 * Math.sin(now * 0.008);
      ctx.strokeStyle = primaryHex;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(P1.x, P1.y, 10 * destPulse, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(P1.x, P1.y, 16, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(P1.x, P1.y, 4.5, 0, Math.PI * 2); ctx.fill();

      // Retículo de mira táctica en el destino
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(P1.x - 22, P1.y); ctx.lineTo(P1.x - 17, P1.y);
      ctx.moveTo(P1.x + 17, P1.y); ctx.lineTo(P1.x + 22, P1.y);
      ctx.moveTo(P1.x, P1.y - 22); ctx.lineTo(P1.x, P1.y - 17);
      ctx.moveTo(P1.x, P1.y + 17); ctx.lineTo(P1.x, P1.y + 22);
      ctx.stroke();

      ctx.fillStyle = secondaryHex;
      ctx.font = `8px ${fontFam}`;
      ctx.textAlign = 'right';
      ctx.fillText('DESTINO', P1.x + 12, P1.y - 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 12.5px ${fontFam}`;
      ctx.fillText((traj.destNode.label || '').toUpperCase(), P1.x + 12, P1.y - 10);

    // =========================================================================
    // MODO B: CÁMARA POSADA / ORBITANDO (Planeta activo en centro y aledaños)
    // =========================================================================
    } else {
      const activeNode = traj.destNode || traj.originNode;
      if (!activeNode || !activeNode.mesh) {
        ctx.fillStyle = 'rgba(237, 211, 190, 0.45)';
        ctx.font = `12px ${fontFam}`;
        ctx.textAlign = 'center';
        ctx.fillText('[EN BUSCA DE PLANETA...]', w / 2, h / 2);
        ctx.restore();
        return;
      }

      const cx = w / 2;
      const cy = h / 2;

      // Anillos orbitales concéntricos ampliados
      ctx.strokeStyle = 'rgba(220, 168, 118, 0.16)';
      [55, 110].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Buscar palabras aledañas respecto al planeta activo
      const activePos = activeNode.mesh.position;
      const neighbors = [];
      for (let i = 0; i < (this.wordNodes || []).length; i++) {
        const n = this.wordNodes[i];
        if (n === activeNode || n.isClusterCenter || !n.mesh) continue;
        const d = activePos.distanceTo(n.mesh.position);
        const sameCluster = (n.clusterId && n.clusterId === activeNode.clusterId);
        const semanticDist = sameCluster ? d * 0.75 : d;
        neighbors.push({ node: n, dist: d, semanticDist });
      }
      neighbors.sort((a, b) => a.semanticDist - b.semanticDist);
      const topNeighbors = neighbors.slice(0, 6);

      const R_ORBIT = 100;
      const baseAngle = (now * 0.0003) + (this.camera ? -this.camera.rotation.y * 0.5 : 0);

      topNeighbors.forEach((item, j) => {
        const angle = baseAngle + (j * (Math.PI * 2 / topNeighbors.length)) - Math.PI / 2;
        const nx = cx + Math.cos(angle) * R_ORBIT;
        const ny = cy + Math.sin(angle) * R_ORBIT;

        // Conector dendrítico
        ctx.strokeStyle = 'rgba(220, 168, 118, 0.38)';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.setLineDash([]);

        // Chispa sináptica viajera
        const sparkT = (now * 0.0012 + j * 0.18) % 1.0;
        const sx = cx + (nx - cx) * sparkT;
        const sy = cy + (ny - cy) * sparkT;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Nodo aledaño ampliado
        const nCol = item.node.color || secondaryHex;
        ctx.fillStyle = nCol;
        ctx.beginPath();
        ctx.arc(nx, ny, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
        ctx.stroke();

        // Distancia
        const midX = (cx + nx) / 2;
        const midY = (cy + ny) / 2;
        ctx.fillStyle = secondaryHex;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Δ${Math.round(item.dist * 0.1)}`, midX, midY - 3);

        // Etiqueta ampliada
        ctx.fillStyle = '#edd3be';
        ctx.font = `bold 11px ${fontFam}`;
        ctx.textAlign = nx >= cx ? 'left' : 'right';
        const labelX = nx >= cx ? nx + 8 : nx - 8;
        ctx.fillText((item.node.label || '').toUpperCase(), labelX, ny + 3.5);
      });

      // Sonda en órbita alrededor del planeta activo
      const probeOrbAngle = (now * 0.0015) + (this.camera ? -this.camera.rotation.y : 0);
      const probeOrbX = cx + Math.cos(probeOrbAngle) * 55;
      const probeOrbY = cy + Math.sin(probeOrbAngle) * 55;

      ctx.save();
      ctx.translate(probeOrbX, probeOrbY);
      ctx.rotate(probeOrbAngle + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(-5, -4.5); ctx.lineTo(-3, 0); ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Planeta central posado ampliado
      const rootPulse = 1.0 + Math.sin(now * 0.006) * 0.20;
      ctx.strokeStyle = primaryHex;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, 11 * rootPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta destacada del planeta central
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 13.5px ${fontFam}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 8;
      ctx.fillText((activeNode.label || '').toUpperCase(), cx, cy + 32);
    }

    ctx.restore();
  }

  updateClusterNavButtons() {
    const bar = document.getElementById('cluster-3d-nav-bar');
    if (bar) bar.innerHTML = '';
  }
}
