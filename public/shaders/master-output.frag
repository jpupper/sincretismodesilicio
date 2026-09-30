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
#define pi 3.14159265359

float poly(vec2 uv,vec2 p, float s, float dif,int N,float a){
    // Remap the space to -1. to 1.
    vec2 st = p - uv ;
    // Angle and radius from the current pixel
    float a2 = atan(st.x,st.y)+a;
    float r = pi*2./float(N);
    float d = cos(floor(.5+a2/r)*r-a2)*length(st);
    float e = 1.0 - smoothstep(s,dif,d);
    return e;
}
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
		
		float s = 0.1;
		float d = 0.1;
		
		
		float e = 1.-smoothstep(s,s+d,r);
        float e2 = 1.-smoothstep(s*.99,s*.99+d*.99,r);
		
		//e = poly(uv,wPos, 0.03, 0.04,4,0.0);
	
		wordsEffect += e*0.5;
    }
	
	return wordsEffect;
}
vec4 getQuadWords(float _s,float _d){
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
		float s = _s;
		float d = _d;
		float e = 1.-smoothstep(s,s+d,r);
        float e2 = 1.-smoothstep(s*.99,s*.99+d*.99,r);
		
		e = poly(uv,wPos, s, d,4,0.0);
	
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
    vec4 camCol = (u_hasCamera == 1) ? texture2D(u_cameraTexture, vec2(camUv.x,1.-camUv.y)) : vec4(0.0);
    vec4 depthCol = (u_hasDepth == 1) ? texture2D(u_depthTexture, uv) : vec4(0.0);
    vec4 openposeCol = (u_hasOpenpose == 1) ? texture2D(u_openposeTexture, uv) : vec4(0.0);
    vec4 words = getWords();
    vec4 jpCol = texture2D(renderJPSHADER, uv);
	
	
	
   // finalColor += jpCol*camCol;
	//finalColor += camCol;
	//finalColor += openposeCol * 0.70;
    finalColor += jpCol*words;
	
	//finalColor+=words;
    // 5) Modulación y tinte según el Estado Activo
    if (u_activeState == 0) {
        // Estado 0: Elección del usuario (Observación CCTV cyan sutil)
        finalColor.rgb += vec3(0.0, 0.03, 0.06);
		finalColor+= getQuadWords(0.01,0.05)*vec4(1.0,0.0,0.0,.0)*1.5;
		finalColor-= getQuadWords(0.009,0.04)*vec4(1.0,0.0,0.0,.0);
		
		
    } else if (u_activeState == 1) {
        // Estado 1: Animación / Desprocesando (Interferencia magenta / glitch)
        float wave = sin(uv.y * 60.0 + u_time * 12.0) * 1.06;
       // finalColor.rgb += vec3(0.12 + wave, 0.0, 0.04);
    } else if (u_activeState == 2) {
        // Estado 2: Pantalla Final (Resignificación verde corporativa)
        float grid = sin(uv.y * 180.0 + u_time * 2.0) * 0.03;
       // finalColor.rgb += vec3(0.0, 0.08 + grid, 0.03);
    }

    // Salida final del fragmento
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}
