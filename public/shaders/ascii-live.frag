#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

// ============================================================
// SHADER ASCII EN VIVO — Sincretismo de Silicio
// Editá este archivo y presioná [R] en el juego para recompilar
// sin recargar la página. Si hay un error de compilación, el
// shader anterior sigue activo y el error aparece en consola.
// Uniforms disponibles: u_resolution, u_cameraTexture,
// u_depthMaskTexture, u_hasDepthMask, u_useDepthMask,
// u_bodyTintColor, u_shaderBgColor, u_shaderBgAlpha, u_charSize,
// u_maskThreshold, u_glyphScale, u_drawBgGlyphs, u_bodyGlyphTint,
// u_opacity, u_fontMode, u_tintColor, u_hasCamera, u_time
// ============================================================

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
    // Espejamos X para coincidir con la cámara en espejo; invertimos Y para corregir coordenadas WebGL/video
    vec2 camUV = vec2(1.0 - cellUV.x, 1.0 - cellUV.y);
    vec4 cam = texture(u_cameraTexture, camUV);
    gray = dot(cam.rgb, vec3(0.299, 0.587, 0.114));
    // Mejorar contraste
    gray = clamp((gray - 0.15) * 1.35, 0.0, 1.0);

    // Máscara depth/silueta para colorear las letras del cuerpo
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
