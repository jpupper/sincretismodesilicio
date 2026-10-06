precision highp float;

// ============================================================================
// SHADER MAESTRO DE SALIDA (MASTER OUTPUT SHADER)
// ============================================================================
// 1) Render de la Cámara
uniform sampler2D u_cameraTexture;
uniform int u_hasCamera;

// 2) Render del Depth Map / Segmentación
uniform sampler2D u_depthTexture;
uniform int u_hasDepth;

// 3) Render de la Silueta / Overlay OpenPose
uniform sampler2D u_openposeTexture;
uniform int u_hasOpenpose;
uniform float u_openposeOpacity;

// 3b) Render de Vectores de Campo de Flujo (Flow Field)
uniform sampler2D u_flowfieldTexture;
uniform int u_hasFlowfield;
uniform float u_flowfieldOpacity;

// 4) Array con las posiciones normalizadas de las palabras en pantalla (UV: 0.0 a 1.0)
#define MAX_WORDS 32
uniform vec2 u_wordPositions[MAX_WORDS];
// Ancho REAL de cada palabra en UV x (px/ancho de pantalla). 0 = sin dato:
// en ese caso el marco usa el ancho fijo de WORD_BOX_X.
uniform float u_wordWidths[MAX_WORDS];
uniform float u_wordDwell[MAX_WORDS];
uniform int u_wordCount;

uniform sampler2D renderJPSHADER;

// 5) Estados activos del sistema:
//    u_activeState (0: IDLE, 1: PROCESSING/THINKING, 2: HIJACK/HAIKU)
//    u_stateWeights (vec3 interpolado continuo: x=IDLE, y=THINKING, z=HAIKU)
uniform int u_activeState;
uniform vec3 u_stateWeights;


// Uniforms de Control de GLITCH (Mismos parámetros que en LOG)
uniform float glitchAmount;
uniform float blockIntensity;
uniform float blockSize;
uniform float chromaIntensity;
uniform float vhsNoiseIntensity;
uniform float edgeTearingIntensity;

// Uniforms de resolución y tiempo
uniform vec2 u_resolution;
uniform float u_time;

// ---------------------------------------------------------------------------
// PATRÓN RDM — FONDO DE LAS CAJAS DE PALABRAS Y DEL CONTENEDOR DEL HAIKU
// ---------------------------------------------------------------------------
// Port del shader "rdmf" de jpShadereditor (autor jpupper): un campo de RUIDO
// ALEATORIO POR CAPAS. Del original se quitó el feedback (iChannel0) y el hue:
// el patrón se calcula EN BLANCO y se tiñe con u_rdmColor.
//
// TODOS estos uniforms son manejables desde ARRIBA: los manda script.js en cada
// frame desde el panel MASTER RDM del modal (tecla P) y desde MASTER_RDM_DEF
// (arriba de todo en public/cambiapalabras/script.js). Llegan NORMALIZADOS a
// 0..1 y acá se pasan a la escala física del shader original con rdMap().
uniform float u_rdmCnt;        // CAPAS          (físico 1..20)
uniform float u_rdmIteScale;   // ESCALA X CAPA  (físico 0..10)
uniform float u_rdmSpeedX;     // deriva X       (físico -0.2..0.2)
uniform float u_rdmSpeedY;     // deriva Y       (físico -0.2..0.2)
uniform float u_rdmSpeedRot;   // rotación       (físico -0.01..0.01)
uniform float u_rdmSpeedRnd;   // velocidad del random (0..1)
uniform float u_rdmSm1;        // SMOOTH BAJO (umbral del smoothstep)
uniform float u_rdmSm2;        // SMOOTH ALTO (dónde llega a blanco pleno)
uniform float u_rdmForce;      // brillo final (e_force del original)
uniform float u_rdmMix;        // PRESENCIA: 1 = tapa el fondo anterior
uniform vec3  u_rdmColor;      // tinte del patrón

// ---------------------------------------------------------------------------
// PALETA UNIFICADA (la del GLOBALSTYLE: /globalstyle.html y global_style.json)
// ---------------------------------------------------------------------------
// u_palModo = 1 → el patrón RDM, los marcos de las palabras, el contenedor del
// haiku y el tinte de la cámara usan la paleta. 0 → colores fijos de siempre.
uniform vec3  u_palA;          // acento primario   (borde / acento)
uniform vec3  u_palB;          // acento secundario (acento2)
uniform float u_palModo;       // 1 = seguir la paleta global
uniform float u_camPal;        // 0..1 cuánto se tiñe la cámara con la paleta
// SILUETA (reemplazo de la cámara de color): la máscara de profundidad pintada con el
// patrón RDM de la paleta y un borde blanco. u_camVis = 1 vuelve a la cámara original.
uniform float u_camVis;        // 0..1 MEZCLA: 0 = depth+RDM puro · 1 = cámara pura
uniform float u_silRdm;        // 0..1 pinta la silueta con el patrón RDM
uniform float u_silEdge;       // 0..1 borde blanco de la silueta
uniform float u_maskOn;        // 0..1 PRESENCIA de la mascarilla del cuerpo (0 = solo el esqueleto)
uniform float u_silBlur;       // radio de BLUR del depth, en TEXELES del depth (no en px de pantalla:
                               // el depth viene de 240x160 y se estira ~6,6x, asi que el blur tiene
                               // que medirse en texeles o no alcanza a tapar el pixelado)
uniform vec2  u_depthTexel;     // 1.0 / tamaño real del canvas de depth
#define pi 3.14159265359

// ---------------------------------------------------------------------------
// AJUSTES RÁPIDOS (editá acá y apretá R para recompilar en vivo)
// ---------------------------------------------------------------------------
// ANCHO de los contenedores de las palabras:
//   1.0 = cuadrado · 0.55 = 1.8x MÁS ANCHO · 0.40 = 2.5x MÁS ANCHO
#define WORD_BOX_X        0.55

// ADAPTACIÓN PANTALLA VERTICAL:
// Comprime el alto en shader para palabras y reduce un poquito el ancho
#define WORD_BOX_KY       1.0
#define WORD_BOX_PAD      1.0

// Tamaño del contenedor del HAIKU (media medida, en UV)
// 0.38 media medida = 0.76 ancho total (~1460px en 1920) para que 3 versos queden cómodos en una sola línea
// 0.22 media medida = 0.44 alto total (~475px en 1080) para dar holgura vertical sin desbordar
#define HAIKU_BOX_W       0.25
#define HAIKU_BOX_H       0.25

// VELOCIDAD DE GIRO de los marcos de las palabras (rad/s aprox).
// Antes era 1.0 + 2*animPulse (= hasta 3.0 rad/s, "giraban como locos").
#define WORD_SPIN_SPEED   0.032
#define HAIKU_BG_TOP      vec3(0.0, 0.0, 0.0)
#define HAIKU_BG_BOT      vec3(0.0, 0.0, 0.0)
#define HAIKU_LINE_COL    vec3(1.0, 1.0, 0.1)
#define HAIKU_GLOW_COL    vec3(0.4, 0.4, 0.4)

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Función de ruido suave 2D (Value Noise continuo con interpolación quintic)
float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Ruido FBM de muy alta frecuencia (5 octavas con rotación irracional)
float fbmHighFreq(vec2 p) {
    float val = 0.0;
    float amp = 0.52;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
        val += amp * noise2D(p);
        p = rot * p * 2.07 + vec2(4.13, 7.37);
        amp *= 0.50;
    }
    return val;
}

// Fondo de alta frecuencia para los contenedores de palabras y el contenedor del haiku:
// Textura táctica densa con balance lumínico (no negro absoluto 0.0, ni blanco quemado)
vec3 getHighFreqNoiseBg(vec2 uv) {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv * vec2(280.0 * aspect, 280.0) + vec2(u_time * 0.35, u_time * 0.20);
    float n = clamp(fbmHighFreq(p), 0.0, 1.0);
    float lum = mix(0.08, 0.26, n);
    return vec3(lum);
}

// ---------------------------------------------------------------------------
// PATRÓN RDM (port de "rdmf"): se promedian u_rdmCnt capas de ruido aleatorio,
// cada una con su fase, su rotación y su escala (ite_scale * i). El original
// dividía por (cnt+1) y cerraba con un smoothstep: se respeta tal cual.
// ---------------------------------------------------------------------------
float rdMap(float v, float lo, float hi) { return lo + (hi - lo) * v; }
mat2 rdRotate2d(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
mat2 rdScale2d(vec2 sc) { return mat2(sc.x, 0.0, 0.0, sc.y); }
float rdRandom(vec2 st, float t) {
    return fract(sin(dot(floor(st.xy), vec2(12.9898, 78.233))) * 43000.3 + t);
}

vec3 rdmPattern(vec2 uv) {
    float fix = u_resolution.x / u_resolution.y;
    uv.x *= fix;                                  // el original escala el X (si no, se estira)

    int mcnt = int(floor(rdMap(u_rdmCnt, 1.0, 20.0)));
    if (mcnt < 1) mcnt = 1;
    float mite_scale = rdMap(u_rdmIteScale, 0.0, 10.0);
    float mspeedx    = rdMap(u_rdmSpeedX, -0.2, 0.2);
    float mspeedy    = rdMap(u_rdmSpeedY, -0.2, 0.2);
    float mspeedrot  = rdMap(u_rdmSpeedRot, -0.01, 0.01);
    float mspeedrdm  = u_rdmSpeedRnd;
    float tm = u_time;

    vec3 dib = vec3(1.0);
    for (int i = 1; i < 10; i++) {
        float fase = float(i) * pi * 2.0 / float(mcnt);
        vec2 uv2 = uv;
        uv2.x += tm * mspeedx;
        uv2.y += tm * mspeedy;

        uv2 -= vec2(0.5); uv2 *= rdRotate2d(mspeedrot * tm); uv2 += vec2(0.5);
        uv2 -= vec2(0.5); uv2 *= rdScale2d(vec2(mite_scale * float(i))); uv2 += vec2(0.5);

        float e = rdRandom(uv2 * mite_scale * float(i), tm * mspeedrdm + fase);
        dib += vec3(e);
    }
    dib /= (float(mcnt) + 1.0);
    dib = smoothstep(u_rdmSm1, max(u_rdmSm2, u_rdmSm1 + 0.001), dib);
    return dib * u_rdmForce;
}

// Fondo RDM teñido. Con u_palModo = 1 el patrón se PINTA con la paleta global:
// el degradado va del acento primario (oscuro) al acento secundario (crestas), y
// el brillo del patrón modula la mezcla. Con u_palModo = 0 queda el color del
// panel (blanco por defecto = tal cual el shader rdmf).
vec3 getRdmBg(vec2 uv) {
    vec3 p = rdmPattern(uv);
    float g = clamp(dot(p, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    vec3 conPaleta = mix(u_palA * 0.45, u_palB, g) * (0.35 + 0.65 * g);
    return mix(p * u_rdmColor, conPaleta, clamp(u_palModo, 0.0, 1.0));
}

float poly(vec2 uv, vec2 p, float s, float dif, int N, float a){
    vec2 st = p - uv;
    float a2 = atan(st.x, st.y) + a;
    float r = pi * 2.0 / float(N);
    float d = cos(floor(0.5 + a2 / r) * r - a2) * length(st);
    float e = 1.0 - smoothstep(s, dif, d);
    return e;
}
vec4 getWords(vec2 uv, float animPulse){
    float t = u_time * (1.0 + animPulse * 1.5);
    vec4 wordsEffect = vec4(0.0);
    float fx = u_resolution.x / u_resolution.y;

    for (int i = 0; i < MAX_WORDS; i++) {
        if (i >= u_wordCount) break;
        vec2 wPos = u_wordPositions[i];

        vec2 uv2 = uv;
        vec2 diff = (uv2 - wPos) * vec2(fx, 1.0);
        float r = length(diff);

        float s = mix(0.07, 0.12, animPulse);
        float d = mix(0.07, 0.12, animPulse);

        float e = 1.0 - smoothstep(s, s + d, r);
        wordsEffect += e * 0.5;
    }
    return wordsEffect;
}
vec4 getQuadWords(vec2 uv, float _s, float _d, float animPulse){

    float t = u_time * WORD_SPIN_SPEED * (1.0 + animPulse);
    vec4 wordsEffect = vec4(0.0);
    float fx = u_resolution.x / u_resolution.y;

    for (int i = 0; i < MAX_WORDS; i++) {
        if (i >= u_wordCount) break;
        vec2 wPos = u_wordPositions[i];

        float s = _s * (1.0 + animPulse * 0.35);
        // grosor del trazo: nunca 0 (smoothstep con bordes iguales es indefinido
        // y en algunos drivers el marco desaparecía por completo)
        float d = max(_d, s * 0.10) * (1.0 + animPulse * 0.35);

        // ANCHO POR PALABRA: el marco se estira hasta el ancho real de la palabra
        // (u_wordWidths[i], en UV x). Si no hay dato, cae al ancho fijo de siempre.
        float wAncho = u_wordWidths[i] * WORD_BOX_PAD * 0.5;
        float kx = (wAncho > 0.0005) ? (s / wAncho) : (fx * WORD_BOX_X);
        float ky = WORD_BOX_KY;
        // uv_m = uv con ejes adaptados para pantalla vertical (alto reducido)
        vec2 uv_m = wPos + (uv - wPos) * vec2(kx, ky);

        float rot = animPulse * sin(t + float(i));
        float full = poly(uv_m, wPos, s, s + d, 4, rot);
        float inner = poly(uv_m, wPos, s * 0.90, s * 0.90 + d, 4, rot);
        float border = max(0.0, full - inner);

        // REQUERIMIENTO 6: Relleno animado en el shader cuando se toca la palabra (dwell)
        // Animación como si se estuviera prendiendo (ignición incandescente / plasma)
        float dwell = (i < MAX_WORDS) ? u_wordDwell[i] : 0.0;
        if (dwell > 0.001 && full > 0.01) {
            float effAncho = max(0.015, (wAncho > 0.0005) ? wAncho : (s / max(0.001, fx * WORD_BOX_X)));
            // Coordenada horizontal normalizada dentro del contenedor
            float normX = clamp((uv.x - (wPos.x - effAncho)) / (2.0 * effAncho), 0.0, 1.0);
            
            // Frente de carga que se va llenando
            float fillProgress = smoothstep(0.0, 0.02, dwell - normX);
            // Filamento / chispa brillante en el frente activo de llenado
            float sparkLine = exp(-abs(normX - dwell) * 45.0) * (1.3 + 0.6 * sin(uv.y * 140.0 + u_time * 30.0));
            // Chisporroteo / calor de ignición
            float sizzle = 0.8 + 0.25 * sin(uv.x * 90.0 + u_time * 28.0) * cos(uv.y * 90.0 - u_time * 22.0);
            
            // Color que se prende: cobre fundido a núcleo blanco-ámbar incandescente
            vec3 igniteCol = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.92, 0.55), normX);
            if (u_palModo > 0.5) igniteCol = mix(u_palA * 1.3, u_palB * 1.8, normX);
            
            float igniteIntensity = (fillProgress * 0.70 * sizzle + sparkLine * 1.6) * full;
            wordsEffect.rgb += igniteCol * igniteIntensity * (0.85 + 0.6 * dwell);
        }

        // Borde exterior eliminado según requerimiento de diseño
        wordsEffect.a = max(wordsEffect.a, full);
    }
    return wordsEffect;
}
struct HaikuBox {
    float presence;   // 0 en IDLE, sube en THINKING (escaneo), pleno en HAIKU
    vec2  size;       // semitamaño del marco en UV
    vec2  p;          // uv relativa al centro de pantalla
    vec2  d;          // distancia por eje al borde (negativa = adentro)
    float boxDist;    // distancia al contorno (0 = sobre el borde)
    float inside;     // 1.0 adentro, 0.0 afuera
};
HaikuBox haikuBoxAt(vec2 uv, vec3 weights) {
    HaikuBox b;
    // SOLO cuando se está formando el haiku (estado HAIKU = weights.z). Antes de
    // eso (THINKING: palabras girando y cambiando) el contenedor NO existe.
    b.presence = clamp(weights.z, 0.0, 1.0);

    float aspect = u_resolution.x / u_resolution.y;
    vec2 targetSize = vec2(HAIKU_BOX_W, HAIKU_BOX_H);
    b.size = targetSize * mix(0.70, 1.0, b.presence);

    b.p = uv - vec2(0.5, 0.5);
    b.d = abs(b.p) - b.size;
    b.boxDist = max(b.d.x * aspect, b.d.y);
    b.inside = (b.d.x < 0.0 && b.d.y < 0.0) ? 1.0 : 0.0;
    return b;
}
vec4 getHaikuContainer(vec2 uv, vec3 weights) {
    HaikuBox b = haikuBoxAt(uv, weights);
    if (b.presence < 0.005) return vec4(0.0);
    if (b.boxDist > 0.08) return vec4(0.0);

    float wThink = weights.y;
    float wHaiku = weights.z;
    float aspect = u_resolution.x / u_resolution.y;

    vec4 outColor = vec4(0.0);

    // 1. Fondo interior del contenedor (vidrio ahumado silicio + matriz)
    if (b.inside > 0.5) {
        // Rejilla de silicio holográfica interna
        vec2 gridUv = fract(uv * vec2(36.0 * aspect, 36.0) + vec2(u_time * 0.04, 0.0));
        float gridLine = (step(0.90, gridUv.x) + step(0.90, gridUv.y)) * 0.05;

        // Barras de escaneo horizontal sutil
        float scan = sin(uv.y * 140.0 + u_time * 6.0) * 0.05 * (wThink + 0.2);

        // Relleno del contenedor: ruido FBM de alta frecuencia en vez de negro puro
        // Fondo: RDM del panel MASTER RDM (u_rdmMix=1 lo tapa por completo).
        vec3 bg = mix(getHighFreqNoiseBg(uv), getRdmBg(uv), u_rdmMix) + vec3(gridLine);
    
        // Viñeta interna: los bordes más apagados, el centro sostiene el texto
        float bordeInt = min(min(b.size.x - abs(b.p.x), b.size.y - abs(b.p.y)) * 6.0, 1.0);
        //bg *= mix(0.72, 1.0, bordeInt);

        // SIN TRANSPARENCIA: el interior tapa el fondo por completo (el fondo ya
        // no se ve en la zona del cuadrado). Sólo queda un fade corto al entrar.
        float fillAlpha = smoothstep(0.02, 0.40, b.presence);
        outColor = vec4(bg, fillAlpha);
    }

    // 2. Bordes y marcas tácticas del contenedor
    float edgeGlow = exp(-abs(b.boxDist) * 220.0);          // marco principal
    float innerLine = exp(-abs(b.boxDist + 0.014) * 260.0); // doble marco interior
    // Aura EXTERIOR: sólo afuera del cuadrado (adentro valía 1.0 y "pintaba" todo el
    // interior con el color del marco).
    float outerAura = (b.boxDist > 0.0) ? exp(-b.boxDist * 34.0) * 1.10 : 0.0;
    // Brillo INTERIOR: pegado al marco, decae hacia el centro.
    float innerAura = exp(-max(0.0, -b.boxDist) * 30.0) * 0.55;

    // Soportes de esquina (brackets tácticos)
    vec2 cornerOffset = abs(abs(b.p) - b.size);
    float isCorner = (step(cornerOffset.x, 0.055) * step(cornerOffset.y, 0.055));
    float cornerBoost = (isCorner > 0.0) ? 2.6 : 1.0;

    // Marco y esquinas: línea ROJA CLARA. Aura/brillo: ROJO (siempre, en los 3
    // estados — antes en thinking el marco pasaba a oro/naranja).
    float lineaAlpha = (edgeGlow * 3.2 * cornerBoost + innerLine * 1.6 * cornerBoost) * b.presence;
    float auraAlpha = (outerAura + innerAura) * b.presence;

    // Línea y aura del contenedor: con la paleta activa salen de u_palB / u_palA.
    vec3 lineaCol = mix(HAIKU_LINE_COL, u_palB, clamp(u_palModo, 0.0, 1.0));
    vec3 auraCol  = mix(HAIKU_GLOW_COL, u_palA * 0.55, clamp(u_palModo, 0.0, 1.0));

    outColor.rgb = mix(outColor.rgb, auraCol, clamp(auraAlpha, 0.0, 1.0));
    outColor.rgb = mix(outColor.rgb, lineaCol, clamp(lineaAlpha, 0.0, 1.0));
    outColor.a = max(outColor.a, clamp(max(lineaAlpha, auraAlpha), 0.0, 1.0));

    return outColor;
}
void getGlitchCoords(vec2 uv, out vec2 uvR, out vec2 uvG, out vec2 uvB, out float scanline, out float vhsNoise) {
    float t = floor(u_time * 15.0);

    // 1. PATRÓN RANDOM (Alta densidad de filas y columnas)
    float rows = (blockSize * 100.0);
    float row = floor(uv.y * rows);

    float baseCols = (blockSize * 100.0);
    float colsPerRow = baseCols * (0.5 + 2.0 * rand(vec2(row, t)));

    float colOffset = rand(vec2(row, t * 0.5)) * 100.0;
    float col = floor(uv.x * colsPerRow + colOffset);

    vec2 cellId = vec2(col, row);

    float cellRandom = rand(cellId + t);
    float glitchThreshold = 1.0 - (blockIntensity * glitchAmount);

    vec2 displace = vec2(0.0);
    bool isGlitching = (cellRandom > glitchThreshold) && (glitchAmount > 0.0);

    if (isGlitching) {
        float shiftX = (rand(cellId + t * 2.0) - 0.5) * 0.5 * glitchAmount;
        float shiftY = (rand(cellId + t * 3.0) - 0.5) * 0.1 * glitchAmount;
        displace = vec2(shiftX, shiftY);
    }

    vec2 p = uv + displace;

    // 2. TEARING LATERAL
    float effectiveEdge = edgeTearingIntensity * glitchAmount;
    float edgeDist = abs(uv.x - 0.5) * 2.0;
    if (effectiveEdge > 0.0 && edgeDist > (1.0 - effectiveEdge * 0.5)) {
        float sideCell = floor(uv.y * rows * 1.5);
        p.x += (rand(vec2(sideCell, t)) - 0.5) * 0.4 * effectiveEdge;
    }

    // 3. ABERRACIÓN CROMÁTICA
    float effectiveChroma = chromaIntensity * glitchAmount * 0.05;
    if (isGlitching) {
        effectiveChroma *= 3.0; // Resalta en los cuadraditos rotos
    }

    uvR = p + vec2(effectiveChroma, 0.0);
    uvG = p;
    uvB = p - vec2(effectiveChroma, 0.0);

    // 4. VHS NOISE Y SCANLINES
    float effectiveVHS = vhsNoiseIntensity * glitchAmount;
    scanline = sin(uv.y * u_resolution.y * 2.5) * 0.03 * effectiveVHS;
    vhsNoise = (rand(uv * u_time) - 0.5) * 0.15 * effectiveVHS;
}

// Función auxiliar para leer la máscara de profundidad limpia (canal alpha prioritario o luminancia)
float getDepthMask(vec2 p) {
    if (u_hasDepth != 1) return 0.0;
    // REQUERIMIENTO 3: Ensanchar la silueta fullscreen para que en pantalla vertical no se vea angosta/rara
    float sx = (u_resolution.y > u_resolution.x) ? 0.72 : 0.85;
    vec2 pWide = vec2(0.5 + (p.x - 0.5) * sx, p.y);
    if (pWide.x < 0.0 || pWide.x > 1.0) return 0.0;
    vec4 d = texture2D(u_depthTexture, vec2(pWide.x, 1.0 - pWide.y));
    return (d.a > 0.001) ? d.a : max(d.r, max(d.g, d.b));
}

void main() {
    vec2 rawUv = gl_FragCoord.xy / u_resolution;

    // Normalizar pesos de los 3 estados (fallback a u_activeState si u_stateWeights no se envió)
    vec3 weights = u_stateWeights;
    float sumW = weights.x + weights.y + weights.z;
    if (sumW < 0.01) {
        if (u_activeState == 1) weights = vec3(0.0, 1.0, 0.0);
        else if (u_activeState == 2) weights = vec3(0.0, 0.0, 1.0);
        else weights = vec3(1.0, 0.0, 0.0);
    } else {
        weights /= sumW;
    }

    vec2 uvR, uvG, uvB;
    float scanline, vhsNoise;
    getGlitchCoords(rawUv, uvR, uvG, uvB, scanline, vhsNoise);

    vec2 uv = uvG;

    // Espejado horizontal de la cámara web
    vec2 camUvR = vec2(1.0 - uvR.x, 1.0 - uvR.y);
    vec2 camUvG = vec2(1.0 - uvG.x, 1.0 - uvG.y);
    vec2 camUvB = vec2(1.0 - uvB.x, 1.0 - uvB.y);

    // 1) Render Cámara con aberración cromática glitcheada
    vec3 camCol = texture2D(u_cameraTexture, camUvR).rgb;
  /*  if (u_hasCamera == 1) {
        camCol.r = texture2D(u_cameraTexture, camUvR).r;
        camCol.g = texture2D(u_cameraTexture, camUvG).g;
        camCol.b = texture2D(u_cameraTexture, camUvB).b;
    }*/
    // TINTE DE LA CÁMARA con la paleta unificada (u_camPal = 0 → imagen original).
    if (u_hasCamera == 1 && u_camPal > 0.001) {
        float camLum = dot(camCol, vec3(0.299, 0.587, 0.114));
        vec3 camPalCol = mix(u_palA * 0.35, u_palB, clamp(camLum * 1.15, 0.0, 1.0));
        camCol = mix(camCol, camPalCol, clamp(u_camPal * u_palModo, 0.0, 1.0));
    }
    vec3 invcamCol = vec3(1.0, 1.0, 1.0) - camCol.rgb;
    vec4 depthCol = (u_hasDepth == 1) ? texture2D(u_depthTexture, vec2(uv.x, 1.0 - uv.y)) : vec4(0.0);

    vec4 openposeCol = vec4(0.0);
    if (u_hasOpenpose == 1) {
        openposeCol = texture2D(u_openposeTexture, vec2(uv.x,1.-uv.y));
        float opOpacity = (u_openposeOpacity > 0.0) ? u_openposeOpacity : 1.0;
        openposeCol.rgb *= opOpacity;
    }

    // 3b) Render Flow Field (Campo de Flujo Vectorial Óptico)
    vec4 flowfieldCol = vec4(0.0);
    if (u_hasFlowfield == 1) {
        flowfieldCol = texture2D(u_flowfieldTexture, uv);
        float ffOpacity = (u_flowfieldOpacity > 0.0) ? u_flowfieldOpacity : 1.0;
        flowfieldCol.rgb *= ffOpacity;
    }

    // 4) Render directo de JPShaderEditor Include
    vec3 jpCol = texture2D(renderJPSHADER, uvR).rgb;

    // 5) Efectos de palabras en pantalla (fondo de las palabras)
    float animPulse = weights.y * 1.0 + weights.z * 0.3;
    vec4 words = getWords(uv, animPulse);
    vec4 wordsq = getQuadWords(rawUv, mix(0.03, 0.045, weights.y), 0.0, animPulse);

    float cajaPresence = clamp(weights.z, 0.0, 1.0);   // = presencia del contenedor
    wordsq *= (1.0 - smoothstep(0.03, 0.45, cajaPresence));

    vec4 haikuBox = getHaikuContainer(rawUv, weights);




    vec3 fin = vec3(0.0);
    fin += jpCol * words.r;

    /* ============ SILUETA DEL CUERPO: la cámara de color ya no es tan obvia ============
       Pedido: "en vez de que se vea la máscara de COLOR, que sea solo la DEPTH pero pintada
       con un patrón RDM" y con "el borde blanco". Donde antes aparecía la IMAGEN de la
       cámara ahora va la máscara de profundidad rellena con el patrón RDM de la paleta
       (cobre) + un contorno BLANCO sacado del gradiente del depth.
       u_camVis (0 = cámara reemplazada, 1 = cámara original), u_silRdm y u_silEdge lo
       controlan desde el panel MASTER OUTPUT SHADER. */
    float silLum = clamp(dot(getRdmBg(rawUv), vec3(0.33333)) * 1.9, 0.0, 1.0);
    vec3  silRelleno = mix(u_palA, u_palB, 0.35) * (0.40 + 1.5 * silLum);
    vec3  silCol = mix(camCol, silRelleno, clamp(u_silRdm, 0.0, 1.0));
    /* MEZCLA: 0 = depth pintada con el RDM · 1 = cámara de color · en el medio, las dos
       cosas mezcladas (pedido: "probar mezclar la depth con el patrón RDM con la cámara"). */
    vec3  cuerpoCol = mix(silCol, camCol, clamp(u_camVis, 0.0, 1.0));

    /* BLUR DEL DEPTH DE ALTA CALIDAD (17 TAPS):
       Elimina el serruchado de píxeles y genera una silueta orgánica, etérea y suave.
       u_silBlur = radio de difusión. */
    float silMask = 0.0;
    float silBorde = 0.0;
    if (u_hasDepth == 1) {
        float bRadius = max(u_silBlur, 0.8) * 3.2;
        vec2 bStep = bRadius * u_depthTexel;

        // Muestreo gaussiano concéntrico de 17 taps
        float acc = getDepthMask(uv) * 0.18;
        float wsum = 0.18;

        // Anillo 1 (radio 1.0): 8 muestras
        float w1 = 0.07;
        acc += getDepthMask(uv + vec2( bStep.x,  0.0)) * w1;
        acc += getDepthMask(uv + vec2(-bStep.x,  0.0)) * w1;
        acc += getDepthMask(uv + vec2( 0.0,  bStep.y)) * w1;
        acc += getDepthMask(uv + vec2( 0.0, -bStep.y)) * w1;
        acc += getDepthMask(uv + vec2( bStep.x * 0.7071,  bStep.y * 0.7071)) * w1;
        acc += getDepthMask(uv + vec2(-bStep.x * 0.7071,  bStep.y * 0.7071)) * w1;
        acc += getDepthMask(uv + vec2( bStep.x * 0.7071, -bStep.y * 0.7071)) * w1;
        acc += getDepthMask(uv + vec2(-bStep.x * 0.7071, -bStep.y * 0.7071)) * w1;
        wsum += 8.0 * w1;

        // Anillo 2 (radio 2.0): 8 muestras a doble distancia
        float w2 = 0.0325;
        vec2 bStep2 = bStep * 2.0;
        acc += getDepthMask(uv + vec2( bStep2.x,  0.0)) * w2;
        acc += getDepthMask(uv + vec2(-bStep2.x,  0.0)) * w2;
        acc += getDepthMask(uv + vec2( 0.0,  bStep2.y)) * w2;
        acc += getDepthMask(uv + vec2( 0.0, -bStep2.y)) * w2;
        acc += getDepthMask(uv + vec2( bStep2.x * 0.7071,  bStep2.y * 0.7071)) * w2;
        acc += getDepthMask(uv + vec2(-bStep2.x * 0.7071,  bStep2.y * 0.7071)) * w2;
        acc += getDepthMask(uv + vec2( bStep2.x * 0.7071, -bStep2.y * 0.7071)) * w2;
        acc += getDepthMask(uv + vec2(-bStep2.x * 0.7071, -bStep2.y * 0.7071)) * w2;
        wsum += 8.0 * w2;

        silMask = clamp(acc / wsum, 0.0, 1.0);

        // BORDE SUAVE DE LA SILUETA: contorno limpio derivado de la máscara ya difuminada
        // Cero serruchado, antialiasing perfecto
        if (u_silEdge > 0.001) {
            float edgeBand = smoothstep(0.12, 0.42, silMask) * (1.0 - smoothstep(0.48, 0.88, silMask));
            silBorde = clamp(edgeBand * 2.8, 0.0, 1.0) * clamp(u_silEdge, 0.0, 1.0);
        }
    }

    /* PRESENCIA: la mascarilla del cuerpo aparece y desaparece con el ciclo
       random de los monitores PiP. SOLO se dibuja si u_hasDepth == 1 y maskVis > 0.001 */
    float maskVis = clamp(u_maskOn, 0.0, 1.0);
    if (u_hasDepth == 1 && maskVis > 0.001) {
        float cuerpoAlpha = smoothstep(0.18, 0.72, silMask) * maskVis;
        fin = mix(fin, cuerpoCol, cuerpoAlpha);
        fin = mix(fin, vec3(1.0), silBorde * maskVis);
    }

    // (a) SILUETA OPENPOSE MONOCROMA: SIEMPRE BLANCO PURO, en todos los estados.
    //     Antes se mezclaba hacia el color invertido de la camara; el usuario pidio
    //     que quede SOLO BLANCO (y con la linea mas finita: eso se ajusta en
    //     trackingConfig.boneWidth / pointRadius del overlay).
    //     Se usa la COBERTURA del trazo (alfa, con respaldo en el canal mas alto) en
    //     vez del color del canvas: el resultado es blanco aunque el canvas pinte los
    //     huesos de colores.
    if (u_hasOpenpose == 1) {
        float opMask = clamp(max(openposeCol.a, max(openposeCol.r, max(openposeCol.g, openposeCol.b))), 0.0, 1.0);
        float opRdm = clamp(dot(getRdmBg(rawUv), vec3(0.33333)) * 2.6 + 0.10, 0.0, 1.0);
        fin += vec3(1.0) * opMask * opRdm * ((u_openposeOpacity > 0.0) ? u_openposeOpacity : 1.0);
    }

    // Capa D: Integración del contenedor del Haiku detrás de los textos
    fin = mix(fin, haikuBox.rgb, haikuBox.a);

    // Fondo del interior de las cajas de las palabras: NEGRO PURO según requerimiento
    float wordMask = clamp(wordsq.a, 0.0, 1.0);
    fin = mix(fin, vec3(0.0), wordMask);

    // Borde de las palabras: ELIMINADO según requerimiento (sin marco exterior)
    // fin += wordsq.rgb * wordQuadCol;

    // Tinte y efectos sutiles de estado (sólo fuera de cajas de haiku y palabras)
    float maskTotal = max(haikuBox.a, wordMask);
    fin += vec3(0.0, 0.02, 0.04) * weights.x * (1.0 - maskTotal);

    // Estado 2 (HAIKU): tinte parejo, SIN onda. El usuario pidio que no aparezca el
    // dibujo de ondas/grilla animada mientras se esta generando el haiku (antes el
    // tinte iba modulado por una senoidal vertical que barria toda la pantalla).
    fin += vec3(0.04, 0.01, 0.02) * weights.z * (1.0 - maskTotal);


    gl_FragColor = vec4(fin, 1.0);
}
