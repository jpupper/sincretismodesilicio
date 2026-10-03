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
#define pi 3.14159265359

// ---------------------------------------------------------------------------
// AJUSTES RÁPIDOS (editá acá y apretá R para recompilar en vivo)
// ---------------------------------------------------------------------------
// ANCHO de los contenedores de las palabras:
//   1.0 = cuadrado · 0.55 = 1.8x MÁS ANCHO · 0.40 = 2.5x MÁS ANCHO
#define WORD_BOX_X        0.55

// Tamaño del contenedor del HAIKU (media medida, en UV)
#define HAIKU_BOX_W       0.40
#define HAIKU_BOX_H       0.21

// Margen (en UV) alrededor del marco del haiku que queda INMUNE al glitch
#define HAIKU_IMMUNE_PAD  0.030

// VELOCIDAD DE GIRO de los marcos de las palabras (rad/s aprox).
// Antes era 1.0 + 2*animPulse (= hasta 3.0 rad/s, "giraban como locos").
#define WORD_SPIN_SPEED   0.32

// Margen del marco alrededor del ancho real de la palabra (1.0 = exacto)
#define WORD_BOX_PAD      1.06

// CONTENEDOR DEL HAIKU: el interior es OPACO (el fondo NO se ve nunca) y ROJO.
// HAIKU_BG_TOP/BOT = relleno del cuadrado (rojo con profundidad).
// Si lo querés NEGRO PURO: vec3(0.0) en los dos.
// HAIKU_LINE_COL = la línea del marco (rojo claro, para que se lea sobre el rojo).
#define HAIKU_BG_TOP      vec3(0.05, 0.95, 0.30)
#define HAIKU_BG_BOT      vec3(0.004, 0.34, 0.10)
#define HAIKU_LINE_COL    vec3(0.55, 1.0, 0.62)
#define HAIKU_GLOW_COL    vec3(0.05, 0.92, 0.35)

// Función de ruido base pseudo-aleatorio
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// -----------------------------------------------------------------
// FORMAS POLIGONALES Y PALABRAS
// -----------------------------------------------------------------
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

// Contenedores de las palabras (marcos).
// (c) AHORA SON MÁS ANCHOS: el eje X se comprime por WORD_BOX_X antes de
// evaluar el polígono, así el marco se estira horizontalmente alrededor de la
// palabra (el eje Y no se toca).
vec4 getQuadWords(vec2 uv, float _s, float _d, float animPulse){
    // Giro MUCHO más lento: antes (1.0 + 2*animPulse) = hasta 3.0 rad/s.
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
        float wAncho = u_wordWidths[i] * WORD_BOX_PAD;
        float kx = (wAncho > 0.0005) ? (s / wAncho) : (fx * WORD_BOX_X);
        // uv_m = uv con el eje X comprimido alrededor de la palabra
        vec2 uv_m = wPos + (uv - wPos) * vec2(kx, 1.0);

        float e = poly(uv_m, wPos, s, s + d, 4, animPulse * sin(t + float(i)));
        e -= poly(uv_m, wPos, s * 0.90, s * 0.90 + d, 4, animPulse * sin(t + float(i)));

        wordsEffect += e;
    }
    return wordsEffect;
}

// -----------------------------------------------------------------
// CONTENEDOR (MARCO CIBERNÉTICO) DEL HAIKU EN SHADER
// Se dibuja detrás del Haiku e interpola fluidamente con los 3 estados.
// La geometría se calcula SIEMPRE con la UV SIN GLITCH (rawUv): así el marco
// nunca se deforma y define una zona inmune que no se glitchea.
// -----------------------------------------------------------------
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

// Zona INMUNE AL GLITCH: 1.0 dentro del marco (y su margen), 0.0 afuera.
// IMPORTANTE: NO se multiplica por 'presence'. La inmunidad es GEOMÉTRICA: donde
// el marco está dibujado, las UVs son SIEMPRE limpio (rawUv) — antes, con
// presence=0.55 (THINKING) sólo se corregía el 55% del desplazamiento y el
// contenedor entraba a pantalla ya con las UVs movidas por el glitch.
float getHaikuImmuneZone(vec2 uv, vec3 weights) {
    HaikuBox b = haikuBoxAt(uv, weights);
    if (b.presence < 0.005) return 0.0;
    float zone = 1.0 - smoothstep(0.0, HAIKU_IMMUNE_PAD, b.boxDist);
    return zone;
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
        float gridLine = (step(0.90, gridUv.x) + step(0.90, gridUv.y)) * 0.16;

        // Barras de escaneo horizontal sutil
        float scan = sin(uv.y * 140.0 + u_time * 6.0) * 0.05 * (wThink + 0.2);

        // Relleno del contenedor: ROJO (degradado vertical suave).
        vec3 bg = mix(HAIKU_BG_TOP, HAIKU_BG_BOT, uv.y);
    
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

    outColor.rgb = mix(outColor.rgb, HAIKU_GLOW_COL, clamp(auraAlpha, 0.0, 1.0));
    outColor.rgb = mix(outColor.rgb, HAIKU_LINE_COL, clamp(lineaAlpha, 0.0, 1.0));
    outColor.a = max(outColor.a, clamp(max(lineaAlpha, auraAlpha), 0.0, 1.0));

    return outColor;
}

// -----------------------------------------------------------------
// FUNCIÓN ENCAPSULADA DE GLITCH
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------
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

    // (b) ZONA INMUNE AL GLITCH: donde se dibuja el contenedor del haiku el
    // shader NO se glitchea (ni se desplaza, ni aberra, ni mete scanlines/ruido).
    float immune = getHaikuImmuneZone(rawUv, weights);

    // Cálculo de coordenadas con GLITCH integrado
    vec2 uvR, uvG, uvB;
    float scanline, vhsNoise;
    getGlitchCoords(rawUv, uvR, uvG, uvB, scanline, vhsNoise);

    // Dentro del contenedor se usan las coordenadas LIMPIAS
    uvR = mix(uvR, rawUv, immune);
    uvG = mix(uvG, rawUv, immune);
    uvB = mix(uvB, rawUv, immune);
    scanline *= (1.0 - immune);
    vhsNoise *= (1.0 - immune);

    vec2 uv = uvG;

    // Espejado horizontal de la cámara web
    vec2 camUvR = vec2(1.0 - uvR.x, 1.0 - uvR.y);
    vec2 camUvG = vec2(1.0 - uvG.x, 1.0 - uvG.y);
    vec2 camUvB = vec2(1.0 - uvB.x, 1.0 - uvB.y);

    // 1) Render Cámara con aberración cromática glitcheada
    vec3 camCol = vec3(0.0);
    if (u_hasCamera == 1) {
        camCol.r = texture2D(u_cameraTexture, camUvR).r;
        camCol.g = texture2D(u_cameraTexture, camUvG).g;
        camCol.b = texture2D(u_cameraTexture, camUvB).b;
    }
    vec3 invcamCol = vec3(1.0, 1.0, 1.0) - camCol.rgb;

    // 2) Render Depth Map / Segmentación
    vec4 depthCol = (u_hasDepth == 1) ? texture2D(u_depthTexture, vec2(uv.x, 1.0 - uv.y)) : vec4(0.0);

    // 3) Render Silueta / OpenPose (Esqueleto Cinemático & Nodos)
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
    vec3 jpCol = vec3(0.0);
    jpCol.r = texture2D(renderJPSHADER, uvR).r;
    jpCol.g = texture2D(renderJPSHADER, uvG).g;
    jpCol.b = texture2D(renderJPSHADER, uvB).b;

    // 5) Efectos de palabras en pantalla (fondo de las palabras)
    float animPulse = weights.y * 1.0 + weights.z * 0.3;
    vec4 words = getWords(uv, animPulse);
    vec4 wordsq = getQuadWords(uv, mix(0.03, 0.045, weights.y), 0.0, animPulse);

    // (3) Los marcos de TODAS las palabras desaparecen apenas ENTRA el contenedor
    //     del haiku (la caja empieza a aparecer en THINKING, no sólo en HAIKU) y
    //     vuelven cuando la caja se retira.
    float cajaPresence = clamp(weights.z, 0.0, 1.0);   // = presencia del contenedor
    wordsq *= (1.0 - smoothstep(0.03, 0.45, cajaPresence));

    // 6) DIBUJO DEL CONTENEDOR DEL HAIKU (con rawUv: geometría fija, sin glitch)
    vec4 haikuBox = getHaikuContainer(rawUv, weights);

    // Composición de capas de renderizado:
    // Capa A: Salida base (JPShader + Cámara recortada por Depth Map)
    vec3 finalColor = vec3(0.0);
    finalColor += jpCol * words.r;
    finalColor += mix(jpCol * words.r, camCol, depthCol.r);

    // (a) SILUETA OPENPOSE: primero BLANCA y después, cuando la obra avanza a
    //     THINKING / HAIKU, pasa al COLOR INVERTIDO DE LA CÁMARA.
    //     En IDLE (weights.x) el esqueleto queda blanco puro; al entrar en los
    //     otros estados se mezcla hacia (1 - cámara).
    float opToInvert = clamp(weights.y + weights.z, 0.0, 1.0);
    vec3 siluetaCol = mix(vec3(1.0), invcamCol, opToInvert);
    finalColor += openposeCol.rgb * siluetaCol;

    // Capa D: Integración del contenedor del Haiku detrás de los textos
    finalColor = mix(finalColor, haikuBox.rgb, haikuBox.a);

    // Fondo y halos de las palabras (transición suave entre estados)
    vec3 wordQuadCol = mix(vec3(1.0, 0.05, 0.05), vec3(1.0, 0.65, 0.15), weights.y);
    wordQuadCol = mix(wordQuadCol, vec3(0.2, 0.95, 1.0), weights.x * 0.4);
    finalColor += wordsq.rgb * wordQuadCol;

    // Modulación e interferencias continuas según el peso de cada estado.
    // OJO: nada de esto entra en la zona del contenedor del haiku ('limpio' = 0
    // ahí) — el marco y su texto son la última pila de la imagen del shader, así
    // que ningún post efecto (ni del shader ni de una capa DOM superior) los toca.
    float limpio = 1.0 - immune;

    // Estado 0 (IDLE): tinte de reposo cibernético sutil
    finalColor += vec3(0.0, 0.02, 0.04) * weights.x * limpio;

    // Estado 1 (THINKING): interferencia de alta frecuencia y escaneo sináptico
    float waveThink = sin(uv.y * 90.0 + u_time * 16.0) * 0.08;
    //finalColor += vec3(0.14 + waveThink, 0.01, 0.05) * weights.y * limpio;

    // Estado 2 (HAIKU): matriz estructurada y coherencia poética
    float gridHaiku = sin(uv.y * 160.0 + u_time * 2.5) * 0.03;
    finalColor += vec3(0.04, 0.01 + gridHaiku, 0.02) * weights.z * limpio;

    // Aplicación de Scanlines y Ruido VHS de la función glitch
    // (dentro del contenedor del haiku NO entran: el marco queda limpio)
    finalColor -= scanline;
    finalColor += vhsNoise;

    gl_FragColor = vec4(finalColor, 1.0);
}
