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

// 4) Array con las posiciones normalizadas de las palabras en pantalla (UV: 0.0 a 1.0)
#define MAX_WORDS 32
uniform vec2 u_wordPositions[MAX_WORDS];
uniform int u_wordCount;


uniform sampler2D renderJPSHADER;

// 5) Estado activo del sistema:
//    0 = Elección del usuario (IDLE / INTERACT)
//    1 = Animación / Desprocesando (PROCESSING)
//    2 = Pantalla final / Frase construida (HIJACK / FINAL)
uniform int u_activeState;

// Uniforms de resolución y tiempo
uniform vec2 u_resolution;
uniform float u_time;


vec4 getWords(){
   vec2 uv = gl_FragCoord.xy / u_resolution;
   float t = u_time;
   vec4 wordsEffect = vec4(0.0);
   float fx = u_resolution.x / u_resolution.y;
    for (int i = 0; i < MAX_WORDS; i++) {
        if (i >= u_wordCount) break;
        vec2 wPos = u_wordPositions[i];
        
		vec2 uv2 = uv;
		vec2 uv3 = uv;
		
		
		
		
		uv3 = fract(uv3*2.+t*0.1);
		vec2 diff = (uv2 - wPos) * vec2(fx, 1.0);
        vec2 diff3 = (uv3 - vec2(.5)) * vec2(fx, 1.0);
        
		
		
		
		float r = length(diff);
		float r2 = length(diff3);
		
		float s = 0.00;
		float d = 0.1;
		
		
		float e = 1.-smoothstep(s,s+d,r);
        float e2 = 1.-smoothstep(s,s+d,r);
        
		wordsEffect += e*0.5;
    }
	
	return wordsEffect;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    // Espejado horizontal de la cámara web para sensación natural
    vec2 camUv = vec2(1.0 - uv.x, uv.y);

    // Color base inicial
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);

    // ------------------------------------------------------------------------
    // SUMA LÍNEA POR LÍNEA:
    // (Podés ajustar los multiplicadores o sumas directas aquí)
    // ------------------------------------------------------------------------

    // 1) Render de la Cámara
    vec4 camCol = (u_hasCamera == 1) ? texture2D(u_cameraTexture, camUv) : vec4(0.0);
    finalColor += camCol * 0.70;
	

	
	
    // 2) Render del Depth Map
    vec4 depthCol = (u_hasDepth == 1) ? texture2D(u_depthTexture, uv) : vec4(0.0);
    
    // 3) Render de la Silueta OpenPose
    vec4 openposeCol = (u_hasOpenpose == 1) ? texture2D(u_openposeTexture, uv) : vec4(0.0);
    
    // 4) Render directo de JPShaderEditor Include
    vec4 jpCol = texture2D(renderJPSHADER, uv);
    finalColor += jpCol;

    // 5) Círculos en la posición de cada una de las palabras
    vec4 wordsEffect = getWords();
 
    finalColor += wordsEffect;

    // 5) Modulación y tinte según el Estado Activo
    if (u_activeState == 0) {
        // Estado 0: Elección del usuario (Observación CCTV cyan sutil)
        finalColor.rgb += vec3(0.0, 0.03, 0.06);
    } else if (u_activeState == 1) {
        // Estado 1: Animación / Desprocesando (Interferencia magenta / glitch)
        float wave = sin(uv.y * 60.0 + u_time * 12.0) * 0.06;
        finalColor.rgb += vec3(0.12 + wave, 0.0, 0.04);
    } else if (u_activeState == 2) {
        // Estado 2: Pantalla Final (Resignificación verde corporativa)
        float grid = sin(uv.y * 180.0 + u_time * 2.0) * 0.03;
        finalColor.rgb += vec3(0.0, 0.08 + grid, 0.03);
    }

    // Salida final del fragmento
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}
