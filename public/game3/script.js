/**
 * SINCRETISMO DE SILICIO - SECUESTRO CIBERNÉTICO
 * Instalación Artística Interactiva Full Stack
 * MediaPipe Pose + Trackeo Mouse Prioritario + Shader ASCII WebGL + Detección Dinámica Ollama
 */

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

const DEFAULT_CONFIG = {
  ollamaModel: 'llama3.2:latest',
  systemPrompt: 'Eres el Núcleo Ejecutivo de una corporación distópica cibernética. El usuario ha osado introducir palabras humanas orgánicas y sentimentales. Tu objetivo es interceptar y neutralizar la humanidad de estas palabras. Debes responder ÚNICAMENTE con un JSON válido que contenga: 1) \'nuevas_palabras\': un array de 3 términos breves en mayúsculas de jerga cibernética, tecnocrática y corporativa hostil que reemplacen los conceptos humanos (ej. OPTIMIZACIÓN_NEURAL, OBSOLESCENCIA_BIOLÓGICA, PROTOCOLO_SUBYUGACIÓN). 2) \'frase_generada\': una sentencia lapidaria, fría y autoritaria en mayúsculas donde el sistema declara la absorción del factor biológico por la maquinaria corporativa. Estructura JSON exacta requerida: {"nuevas_palabras": ["PALABRA1", "PALABRA2", "PALABRA3"], "frase_generada": "TEXTO DE LA FRASE"}. No agregues markdown ni explicaciones adicionales.'
};

const HUMAN_WORDS_POOL = [
  'amor', 'nostalgia', 'fragilidad', 'ternura', 'abrazo', 
  'recuerdo', 'latido', 'suspiro', 'silencio', 'alma', 
  'caricia', 'esperanza', 'anhelo', 'piel', 'lágrima', 
  'respirar', 'cuerpo', 'deseo', 'infancia', 'duelo', 
  'poesía', 'mirada', 'calidez', 'intimidad', 'olvido', 
  'consuelo', 'vulnerabilidad', 'sueño', 'tiempo', 'perdón'
];

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
    fontMode: 0
  },
  
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
  typewriterInterval: null
};

// ============================================================================
// REFERENCIAS DOM
// ============================================================================
const DOM = {
  container: document.getElementById('installation-container'),
  video: document.getElementById('webcam-video'),
  asciiCanvas: document.getElementById('ascii-camera-canvas'),
  noiseCanvas: document.getElementById('noise-canvas'),
  
  // HUD
  hudTimestamp: document.getElementById('hud-timestamp'),
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
  
  // Processing
  processingOverlay: document.getElementById('processing-overlay'),
  telemetryModelName: document.getElementById('telemetry-model-name'),
  processingBar: document.getElementById('processing-bar'),
  
  // Hijack
  hijackOverlay: document.getElementById('hijack-overlay'),
  hijackWordsExplosion: document.getElementById('hijack-words-explosion'),
  typewriterText: document.getElementById('typewriter-text'),
  resetSecondsLeft: document.getElementById('reset-seconds-left'),
  
  // Modal Config
  configModal: document.getElementById('config-modal'),
  cfgActiveModelBadge: document.getElementById('cfg-active-model-badge'),
  cfgOllamaStatusTag: document.getElementById('cfg-ollama-status-tag'),
  cfgModelSelect: document.getElementById('cfg-model-select'),
  btnRefreshModels: document.getElementById('btn-refresh-models'),
  cfgModelName: document.getElementById('cfg-model-name'),
  cfgSystemPrompt: document.getElementById('cfg-system-prompt'),
  cfgAsciiEnabled: document.getElementById('cfg-ascii-enabled'),
  cfgAsciiSize: document.getElementById('cfg-ascii-size'),
  valAsciiSize: document.getElementById('val-ascii-size'),
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
    this.positionBuffer = null;
    this.uniforms = {};
    this.initWebGL();
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

    // Shaders
    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader adaptado de ascii.frag con bitmasks 5x5 auténticas
    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 fragColor;

      uniform vec2 u_resolution;
      uniform sampler2D u_cameraTexture;
      uniform float u_charSize;
      uniform float u_glyphScale;
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
        vec3 baseColor = u_tintColor;

        if (u_hasCamera) {
          // Espejamos X horizontalmente para coincidir con la cámara en espejo
          vec2 camUV = vec2(1.0 - cellUV.x, cellUV.y);
          vec4 cam = texture(u_cameraTexture, camUV);
          gray = dot(cam.rgb, vec3(0.299, 0.587, 0.114));
          // Mejorar contraste
          gray = clamp((gray - 0.15) * 1.35, 0.0, 1.0);
        } else {
          // Generador procedural de vigilancia si la cámara no está activa
          float noise = sin(cellCoord.x * 0.12 + u_time * 1.5) * cos(cellCoord.y * 0.12 - u_time * 1.2);
          float ring = sin(length(cellCoord - (u_resolution / charSize) * 0.5) * 0.2 - u_time * 2.0);
          gray = clamp(0.35 + 0.35 * noise + 0.3 * ring, 0.0, 1.0);
        }

        int n = getCharBitmask(gray);
        if (n == 0) {
          fragColor = vec4(0.0);
          return;
        }

        vec2 localUV = mod(pix, charSize) / charSize;
        float scale = max(0.1, u_glyphScale);
        vec2 p = (localUV - 0.5) / scale + 0.5;
        p *= 5.0;
        p.y = 4.0 - p.y;

        float charMask = character(n, p);
        if (charMask <= 0.01) {
          fragColor = vec4(0.0);
          return;
        }

        fragColor = vec4(baseColor * charMask * u_opacity, charMask * u_opacity);
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
      console.error('[ASCII Shader] Error en link:', gl.getProgramInfoLog(this.program));
      return;
    }

    // Cache uniforms
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      cameraTexture: gl.getUniformLocation(this.program, 'u_cameraTexture'),
      charSize: gl.getUniformLocation(this.program, 'u_charSize'),
      glyphScale: gl.getUniformLocation(this.program, 'u_glyphScale'),
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

    // Texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    console.log('[ASCII Shader] WebGL inicializado con éxito.');
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
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
    }

    // Color de tinte según estado
    let tint = [0.15, 0.95, 0.9]; // Cyan CCTV normal
    let fontMode = 0;
    if (appState.currentState === STATES.PROCESSING) {
      tint = [1.0, 0.08, 0.35]; // Alerta roja
      fontMode = 1; // Binario
    } else if (appState.currentState === STATES.HIJACK) {
      tint = [0.1, 1.0, 0.3]; // Verde neón tóxico
      fontMode = 2; // Matrix Hex
    }

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.charSize, appState.asciiConfig.charSize);
    gl.uniform1f(this.uniforms.glyphScale, appState.asciiConfig.glyphScale);
    gl.uniform1f(this.uniforms.opacity, 0.92);
    gl.uniform1i(this.uniforms.fontMode, fontMode);
    gl.uniform3f(this.uniforms.tintColor, tint[0], tint[1], tint[2]);
    gl.uniform1i(this.uniforms.hasCamera, hasCamera ? 1 : 0);
    gl.uniform1f(this.uniforms.time, timeNow * 0.001);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uniforms.cameraTexture, 0);

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
// GESTIÓN DE CONFIGURACIÓN Y MODELOS OLLAMA
// ============================================================================
async function loadConfigFromServer() {
  try {
    const res = await fetch('/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.ollamaModel) appState.config.ollamaModel = data.ollamaModel;
    if (data.systemPrompt) appState.config.systemPrompt = data.systemPrompt;
    console.log('[CONFIG] Configuración cargada desde servidor:', appState.config);
  } catch (err) {
    console.warn('[CONFIG] No se pudo leer /config, usando valores por defecto:', err.message);
  }
  syncConfigToModalInputs();
}

async function fetchAndPopulateOllamaModels() {
  DOM.cfgModelSelect.innerHTML = '<option value="">Detectando modelos en Ollama...</option>';
  try {
    const res = await fetch('/api/ollama/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    DOM.cfgActiveModelBadge.textContent = appState.config.ollamaModel;

    if (data.online) {
      DOM.cfgOllamaStatusTag.textContent = `● OLLAMA EN LÍNEA (${data.models.length} MODELOS DETECTADOS)`;
      DOM.cfgOllamaStatusTag.className = 'banner-status-tag online';
    } else {
      DOM.cfgOllamaStatusTag.textContent = '○ OLLAMA LOCAL NO DETECTADO';
      DOM.cfgOllamaStatusTag.className = 'banner-status-tag offline';
    }

    DOM.cfgModelSelect.innerHTML = '';
    const modelsList = data.models || [];

    // Asegurarse de que el modelo configurado esté presente
    if (!modelsList.includes(appState.config.ollamaModel)) {
      modelsList.unshift(appState.config.ollamaModel);
    }

    modelsList.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      const isCurrent = (m === appState.config.ollamaModel);
      opt.textContent = isCurrent ? `${m} ★ (ACTUAL)` : m;
      if (isCurrent) opt.selected = true;
      DOM.cfgModelSelect.appendChild(opt);
    });

    console.log('[OLLAMA] Modelos cargados en dropdown:', modelsList);
  } catch (err) {
    console.warn('[OLLAMA] Error obteniendo modelos:', err.message);
    DOM.cfgOllamaStatusTag.textContent = '○ ERROR CONECTANDO A OLLAMA';
    DOM.cfgOllamaStatusTag.className = 'banner-status-tag offline';
  }
}

async function saveConfigToServer(newConfig) {
  try {
    const res = await fetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    appState.config = { ...appState.config, ...newConfig };
    DOM.cfgActiveModelBadge.textContent = appState.config.ollamaModel;
    showToast(`✓ Modelo fijado a: ${appState.config.ollamaModel}`, 'success');
    showConfigStatus('✓ Archivo config.json reescrito físicamente en el servidor', 'success');
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
// WEBCAM Y MEDIAPIPE POSE (Secundario / Opcional frente al Mouse)
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
    initMediaPipePose();
  } catch (err) {
    console.warn('[WEBCAM] Cámara no activa o permisos no concedidos. Modo Mouse activo:', err.message);
    appState.cameraReady = false;
    setInputMode('mouse');
  }
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

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onPoseResults);
    appState.poseInstance = pose;

    let isProcessingFrame = false;
    async function processCameraFrame() {
      // Solo enviamos frames al modelo Pose si el usuario NO está usando activamente el mouse
      if (!appState.isUsingMouse && appState.cameraReady && DOM.video.readyState >= 2) {
        if (!isProcessingFrame) {
          isProcessingFrame = true;
          try {
            await pose.send({ image: DOM.video });
          } catch (e) {}
          isProcessingFrame = false;
        }
      }
      requestAnimationFrame(processCameraFrame);
    }
    requestAnimationFrame(processCameraFrame);
  } catch (err) {
    console.error('[MediaPipe] Error al inicializar Pose:', err);
  }
}

function onPoseResults(results) {
  // REQUERIMIENTO CLAVE: Si el usuario está usando el mouse, ignorar completamente OpenPose
  if (appState.isUsingMouse) return;

  if (results.poseLandmarks && results.poseLandmarks.length > 0) {
    const nose = results.poseLandmarks[0];
    appState.landmarkConfidence = nose.visibility || 0.95;

    // Espejamos X horizontalmente
    const mappedX = (1 - nose.x) * window.innerWidth;
    const mappedY = nose.y * window.innerHeight;

    appState.targetCursorX = mappedX;
    appState.targetCursorY = mappedY;
  } else {
    appState.landmarkConfidence = 0;
  }
}

function setInputMode(mode) {
  appState.inputMode = mode;
  if (mode === 'mouse') {
    appState.isUsingMouse = true;
    DOM.inputModeIcon.textContent = '🖱️';
    DOM.inputModeLabel.textContent = 'TRACK: MOUSE (CLIC DIRECTO)';
    DOM.telemetrySensor.textContent = 'PUNTERO [MOUSE]';
    DOM.telemetryConfidence.textContent = '100%';
  } else {
    appState.isUsingMouse = false;
    DOM.inputModeIcon.textContent = '📹';
    DOM.inputModeLabel.textContent = 'TRACK: CÁMARA (NARIZ)';
    DOM.telemetrySensor.textContent = 'MEDIAPIPE [NARIZ]';
  }
  showToast(`Control: ${mode === 'mouse' ? 'Mouse / Clics' : 'Cámara (Nariz)'}`, 'info');
}

// ============================================================================
// GESTIÓN DE PALABRAS FLOTANTES ORGÁNICAS
// ============================================================================
class FloatingWord {
  constructor(text, x, y) {
    this.text = text;
    this.x = x ?? (Math.random() * (window.innerWidth - 300) + 150);
    this.y = y ?? (Math.random() * (window.innerHeight - 350) + 120);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 0.9;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.floatPhase = Math.random() * 10;
    
    this.radius = 48;
    this.dwell = 0;
    this.isTargeted = false;
    this.isCaught = false;

    this.el = document.createElement('div');
    this.el.className = 'organic-word-item';
    this.el.title = 'Haz clic o posa el cursor para atraparla';
    
    this.el.innerHTML = `
      <svg class="proximity-ring-svg" width="96" height="96" viewBox="0 0 96 96">
        <circle class="proximity-ring-bg" cx="48" cy="48" r="45"></circle>
        <circle class="proximity-ring-fill" cx="48" cy="48" r="45"></circle>
      </svg>
      <span class="word-label">${this.text}</span>
    `;

    this.ringFill = this.el.querySelector('.proximity-ring-fill');
    this.circumference = 282.74;
    this.ringFill.style.strokeDasharray = this.circumference;
    this.ringFill.style.strokeDashoffset = this.circumference;

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

    this.floatPhase += dt * 1.5;
    const swayX = Math.sin(this.floatPhase) * 0.4;
    const swayY = Math.cos(this.floatPhase * 0.8) * 0.3;

    this.x += (this.vx + swayX);
    this.y += (this.vy + swayY);

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
    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.y}px`;
  }

  setTargeted(targeted, progress = 0) {
    this.isTargeted = targeted;
    if (targeted) {
      this.el.classList.add('targeting');
      const offset = this.circumference * (1 - progress);
      this.ringFill.style.strokeDashoffset = offset;
    } else {
      this.el.classList.remove('targeting');
      this.ringFill.style.strokeDashoffset = this.circumference;
    }
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
function transitionTo(newState) {
  if (appState.currentState === newState) return;
  console.log(`[STATE] Transición: ${appState.currentState} -> ${newState}`);
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
    DOM.container.classList.add('state-processing');
    DOM.hudStateText.textContent = 'ESTADO: INTERCEPTANDO (PROCESSING)';
    DOM.reticle.classList.add('hidden');
    handleStateProcessing();
  } 
  else if (newState === STATES.HIJACK) {
    DOM.container.classList.add('state-hijack');
    DOM.hudStateText.textContent = 'ESTADO: SECUESTRO CORPORATIVO (HIJACK)';
    DOM.reticle.classList.add('hidden');
  } 
  else if (newState === STATES.RESET) {
    DOM.hudStateText.textContent = 'ESTADO: REINICIO DEL SISTEMA';
    handleStateReset();
  }
}

// ============================================================================
// PROXIMIDAD Y CAPTURA DE PALABRAS (STATE_INTERACT)
// ============================================================================
function handleProximityAndInteractions(dt) {
  if (appState.currentState === STATES.PROCESSING || 
      appState.currentState === STATES.HIJACK || 
      appState.currentState === STATES.RESET) {
    return;
  }

  let foundTarget = false;
  let targetIndex = -1;

  for (let i = 0; i < appState.floatingWords.length; i++) {
    const word = appState.floatingWords[i];
    if (word.isCaught) continue;

    const dx = word.x - appState.cursorX;
    const dy = word.y - appState.cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= word.radius + 32) {
      foundTarget = true;
      targetIndex = i;
      break;
    }
  }

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

    playSound('hover-charge', progress);

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

// ============================================================================
// ESTADO: PROCESSING (Ollama Fetch + Bloqueo de Control)
// ============================================================================
async function handleStateProcessing() {
  DOM.processingOverlay.classList.remove('hidden');
  DOM.telemetryModelName.textContent = `CONSULTANDO NÚCLEO NEURAL: ${appState.config.ollamaModel}`;
  DOM.processingBar.style.width = '20%';

  playSound('processing-drone');

  let fakeProgress = 20;
  const progressInterval = setInterval(() => {
    if (fakeProgress < 85) {
      fakeProgress += 5;
      DOM.processingBar.style.width = `${fakeProgress}%`;
    }
  }, 300);

  const wordsCaptured = [...appState.caughtWords];
  console.log('[PROCESSING] Palabras humanas atrapadas para mutación:', wordsCaptured);

  try {
    const result = await requestOllamaHijack(wordsCaptured);
    clearInterval(progressInterval);
    DOM.processingBar.style.width = '100%';

    setTimeout(() => {
      DOM.processingOverlay.classList.add('hidden');
      executeHijackStrike(result);
    }, 600);
  } catch (err) {
    console.error('[PROCESSING] Error crítico en Ollama:', err);
    clearInterval(progressInterval);
    const fallbackResult = generateEmergencyHijack(wordsCaptured);
    DOM.processingOverlay.classList.add('hidden');
    executeHijackStrike(fallbackResult);
  }
}

async function requestOllamaHijack(words) {
  const wordsJoined = words.join(', ');
  const userPrompt = `Transforma estas 3 palabras humanas orgánicas: "${wordsJoined}" en 3 términos de jerga cibernética corporativa distópica y genera una frase lapidaria autoritaria del sistema. Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta: {"nuevas_palabras": ["TÉRMINO_1", "TÉRMINO_2", "TÉRMINO_3"], "frase_generada": "Texto de la frase"}.`;

  const payload = {
    model: appState.config.ollamaModel,
    prompt: userPrompt,
    system: appState.config.systemPrompt,
    format: 'json',
    stream: false
  };

  // Intento 1: Fetch directo a Ollama (localhost:11434)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const directRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (directRes.ok) {
      const data = await directRes.json();
      const parsed = parseOllamaResponse(data.response);
      if (parsed) return parsed;
    }
  } catch (directErr) {
    console.warn('[OLLAMA] Falló fetch directo, intentando vía backend Node...', directErr.message);
  }

  // Intento 2: Fetch a través del servidor Node (/api/ollama/generate)
  try {
    const proxyRes = await fetch('/api/ollama/generate', {
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

function parseOllamaResponse(rawText) {
  if (!rawText) return null;
  try {
    const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const json = JSON.parse(clean);
    if (Array.isArray(json.nuevas_palabras) && typeof json.frase_generada === 'string') {
      return json;
    }
  } catch (e) {
    console.error('[PARSER] Error parseando JSON de Ollama:', rawText);
  }
  return null;
}

function generateEmergencyHijack(words) {
  const dictionary = [
    'OBSOLESCENCIA_BIOMÉTRICA_PROG',
    'OPTIMIZACIÓN_RECURSO_ORGÁNICO',
    'LIQUIDACIÓN_EMOCIONAL_CUOTA',
    'PROTOCOLO_SUBYUGACIÓN_SINÁPTICA',
    'DEPURACIÓN_ALGORÍTMICA_V4',
    'CAPITALIZACIÓN_NEURAL_SISTÉMICA'
  ];
  const shuffled = dictionary.sort(() => 0.5 - Math.random());
  return {
    nuevas_palabras: [shuffled[0], shuffled[1], shuffled[2]],
    frase_generada: `EL FACTOR BIOLÓGICO VINCULADO A [${words.join(' + ').toUpperCase()}] HA SIDO DEPURADO. SUS AFECTOS QUEDAN FORMALMENTE ASIGNADOS A LA CUOTA DE RENDIMIENTO DEL SILICIO.`
  };
}

// ============================================================================
// ESTADO: HIJACK (Golpe Estético + Typewriter + Explosión de Palabras)
// ============================================================================
function executeHijackStrike(data) {
  transitionTo(STATES.HIJACK);
  playSound('hijack-strike');

  DOM.hijackOverlay.classList.remove('hidden');

  DOM.hijackWordsExplosion.innerHTML = '';
  const newWords = Array.isArray(data.nuevas_palabras) ? data.nuevas_palabras : ['OPTIMIZACIÓN_CORPORATIVA', 'OBSOLESCENCIA_BIOLÓGICA', 'CONTROL_SISTÉMICO'];

  newWords.forEach((wordText, i) => {
    const wordEl = document.createElement('div');
    wordEl.className = 'cyber-word-giant';
    wordEl.textContent = wordText.toUpperCase();
    wordEl.setAttribute('data-text', wordText.toUpperCase());
    wordEl.style.animationDelay = `${i * 0.15}s`;
    DOM.hijackWordsExplosion.appendChild(wordEl);
  });

  const speechText = data.frase_generada || 'SISTEMA SECUESTRADO. TODA VARIABLE HUMANA HA SIDO ASIMILADA POR EL SILICIO.';
  typewriteSpeech(speechText);

  let secondsRemaining = 8;
  DOM.resetSecondsLeft.textContent = secondsRemaining;
  
  const countdownInterval = setInterval(() => {
    secondsRemaining--;
    DOM.resetSecondsLeft.textContent = Math.max(0, secondsRemaining);
    if (secondsRemaining <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  appState.hijackResetTimeout = setTimeout(() => {
    clearInterval(countdownInterval);
    transitionTo(STATES.RESET);
  }, 8000);
}

function typewriteSpeech(text) {
  DOM.typewriterText.textContent = '';
  let charIdx = 0;
  if (appState.typewriterInterval) clearInterval(appState.typewriterInterval);

  appState.typewriterInterval = setInterval(() => {
    if (charIdx < text.length) {
      DOM.typewriterText.textContent += text.charAt(charIdx);
      if (charIdx % 2 === 0) playSound('typewriter');
      charIdx++;
    } else {
      clearInterval(appState.typewriterInterval);
    }
  }, 28);
}

// ============================================================================
// ESTADO: RESET (Restauración de Pantalla y Vuelta a IDLE)
// ============================================================================
function handleStateReset() {
  if (appState.typewriterInterval) clearInterval(appState.typewriterInterval);
  if (appState.hijackResetTimeout) clearTimeout(appState.hijackResetTimeout);

  DOM.hijackOverlay.classList.add('hidden');
  DOM.hijackWordsExplosion.innerHTML = '';
  DOM.typewriterText.textContent = '';

  appState.caughtWords = [];
  DOM.slots.forEach(slot => {
    slot.className = 'slot-box empty';
    slot.querySelector('.slot-content').innerHTML = '<span class="placeholder-text">&lt;ESPERANDO ENLACE&gt;</span>';
  });

  DOM.container.className = '';
  spawnInitialFloatingWords();

  setTimeout(() => {
    transitionTo(STATES.IDLE);
    showToast('Sistema reanudado. Nuevo ciclo de observación activado.', 'info');
  }, 800);
}

// ============================================================================
// BUCLE PRINCIPAL DE ANIMACIÓN Y RENDER
// ============================================================================
let lastTimestamp = performance.now();

function mainLoop(currentTimestamp) {
  const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = currentTimestamp;

  // 1. Suavizado (Lerp) del Cursor: Instantáneo si es mouse, suave si es cámara
  const lerpFactor = appState.isUsingMouse ? 0.6 : 0.28;
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

  // 3. Evaluar colisiones / proximidad
  handleProximityAndInteractions(dt);

  // 4. Renderizar Shader ASCII sobre la cámara
  if (appState.asciiShader) {
    appState.asciiShader.render(currentTimestamp);
  }

  // 5. Actualizar timestamp CCTV
  const now = new Date();
  DOM.hudTimestamp.textContent = now.toISOString().replace('T', ' ').replace('Z', '');

  requestAnimationFrame(mainLoop);
}

// ============================================================================
// RENDER DE RUIDO PROCEDURAL ESTÁTICO (Canvas 2D)
// ============================================================================
function initNoiseCanvas() {
  const canvas = DOM.noiseCanvas;
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth / 3);
    canvas.height = Math.floor(window.innerHeight / 3);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawStaticNoise() {
    if (appState.currentState === STATES.PROCESSING || appState.currentState === STATES.HIJACK) {
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      const len = data.length;

      for (let i = 0; i < len; i += 4) {
        const val = Math.random() * 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
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
    else if (e.key === 'Escape') {
      closeConfigModal();
    }
  });

  // Botón Toggle Modo de Entrada en HUD
  DOM.btnToggleInput.addEventListener('click', () => {
    setInputMode(appState.isUsingMouse ? 'camera' : 'mouse');
  });

  // Abrir / Cerrar Configuración
  DOM.btnOpenConfig.addEventListener('click', openConfigModal);
  DOM.btnCloseConfig.addEventListener('click', closeConfigModal);
  DOM.btnCancelConfig.addEventListener('click', closeConfigModal);

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
      DOM.cfgModelName.value = model;
      DOM.cfgActiveModelBadge.textContent = model;
      // Seleccionar en el dropdown si existe
      Array.from(DOM.cfgModelSelect.options).forEach(opt => {
        if (opt.value === model) opt.selected = true;
      });
    });
  });

  // REQUERIMIENTO 2: CONTROLES ASCII SHADER
  DOM.cfgAsciiEnabled.addEventListener('change', (e) => {
    appState.asciiConfig.enabled = e.target.checked;
  });

  DOM.cfgAsciiSize.addEventListener('input', (e) => {
    appState.asciiConfig.charSize = parseFloat(e.target.value);
    DOM.valAsciiSize.textContent = e.target.value;
  });

  // Guardar Configuración en Servidor
  DOM.btnSaveConfig.addEventListener('click', async () => {
    const newModel = DOM.cfgModelName.value.trim() || DOM.cfgModelSelect.value;
    const newPrompt = DOM.cfgSystemPrompt.value.trim();

    if (!newModel) {
      showConfigStatus('✕ Debes especificar un modelo de Ollama', 'error');
      return;
    }

    DOM.btnSaveConfig.disabled = true;
    DOM.btnSaveConfig.textContent = 'Guardando en Servidor...';

    const success = await saveConfigToServer({
      ollamaModel: newModel,
      systemPrompt: newPrompt
    });

    DOM.btnSaveConfig.disabled = false;
    DOM.btnSaveConfig.textContent = '💾 Guardar Físicamente en Servidor [P]';

    if (success) {
      setTimeout(closeConfigModal, 1200);
    }
  });

  DOM.btnResetDefaultConfig.addEventListener('click', () => {
    DOM.cfgModelName.value = DEFAULT_CONFIG.ollamaModel;
    DOM.cfgActiveModelBadge.textContent = DEFAULT_CONFIG.ollamaModel;
    DOM.cfgSystemPrompt.value = DEFAULT_CONFIG.systemPrompt;
    showConfigStatus('Parámetros restaurados (presiona Guardar para confirmar)', 'success');
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
    if (appState.asciiShader) appState.asciiShader.resize();
  });
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
  initNoiseCanvas();
  
  // 1. Inicializar Shader ASCII sobre la cámara
  appState.asciiShader = new AsciiCameraShader(DOM.asciiCanvas, DOM.video);

  // 2. Cargar configuración física desde /config
  await loadConfigFromServer();

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
