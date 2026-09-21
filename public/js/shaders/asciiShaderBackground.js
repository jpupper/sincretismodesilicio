/**
 * WebGL2 ASCII & Procedural Noise Background Shader Renderer
 * Pipeline adapted from Arte Digital Data with live configuration updates.
 */

export class AsciiShaderBackground {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = Object.assign({
      enabled: true,
      asciiNoiseOnly: false,
      opacity: 0.75,
      speed: 0.35,
      tile: 2.0,
      charSize: 14,
      glyphScale: 0.85,
      fontMode: 0,
      color1: '#00e5ff',
      color2: '#7c4dff',
      color3: '#ff1744',
      color4: '#00e676'
    }, config);

    this.gl = null;
    this.animFrameId = null;
    this.isRunning = false;
    this.positionBuffer = null;
    this.noiseFbo = null;
    this.noiseFboTexture = null;
    this.fboWidth = 0;
    this.fboHeight = 0;

    this.noiseProgramInfo = null;
    this.asciiProgramInfo = null;
    this.blitProgramInfo = null;
    this.startTime = performance.now();

    this.init();
  }

  static hexToRgb(hex) {
    if (!hex) return [0, 1, 1];
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const num = parseInt(clean, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  init() {
    if (!this.canvas) return;
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    if (!this.gl) {
      console.warn('[AsciiShaderBackground] WebGL2 not supported on this browser.');
      return;
    }

    const gl = this.gl;

    // Fullscreen quad buffer
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Build shader programs
    this.buildPrograms();
    this.resize();

    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  buildPrograms() {
    const gl = this.gl;
    if (!gl) return;

    const vsSource = `#version 300 es
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }`;

    const blitVsSource = `#version 300 es
    in vec2 position;
    out vec2 v_uv;
    void main() {
        v_uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }`;

    const blitFsSource = `#version 300 es
    precision highp float;
    in vec2 v_uv;
    out vec4 fragColor;
    uniform sampler2D u_bufferTexture;
    uniform float u_opacity;
    void main() {
        vec4 col = texture(u_bufferTexture, v_uv);
        fragColor = vec4(col.rgb * u_opacity, col.a * u_opacity);
    }`;

    const noiseFsSource = `#version 300 es
    precision highp float;
    precision highp int;
    out vec4 fragColor;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_tile;
    uniform float u_opacity;
    uniform float u_speed;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    uniform vec3 u_color4;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float t = u_time * u_speed;
      float tl = u_tile;
      
      vec2 p = vec2(0.5) - uv;
      float r = length(p);
      
      float v1 = sin(uv.x * 5.0 + t * 0.5 + sin(uv.y * 10.0)) * 0.5 + 0.5;
      float v2 = sin(uv.y * 10.0 + t * 0.5 + sin(uv.x * 5.0)) * 0.5 + 0.5;
      float v3 = sin(uv.x * 20.0 + t * 0.5 + sin(uv.y * 10.0) + sin(uv.x * 100.0 + sin(uv.y * 100.0))) * 0.5 + 0.5;
      
      float v4 = (sin(uv.y * 5.0 * tl + t + sin(uv.x * 10.0 * tl)) * 0.5 + 0.5) * (sin(uv.x * 5.0 * tl + t + sin(uv.y * 10.0 * tl)) * 0.5 + 0.5);
      v4 *= sin(r * 10.0 + t) * 0.5 + 0.5;
      v4 = smoothstep(0.0, 0.04, v4);

      vec3 colnegro = vec3(0.02, 0.03, 0.06);
      vec3 dib = mix(u_color4, u_color2, v1);
      dib = mix(dib, u_color3, v2);
      dib = mix(dib, u_color1, v3);
      dib = mix(dib, colnegro, v4);
      
      vec3 col = sin(dib);
      fragColor = vec4(col * u_opacity, u_opacity);
    }`;

    const asciiFsSource = `#version 300 es
    precision highp float;
    precision highp int;
    out vec4 fragColor;

    uniform vec2 u_resolution;
    uniform sampler2D u_noiseTexture;
    uniform float u_charSize;
    uniform float u_glyphScale;
    uniform float u_opacity;
    uniform int u_fontMode;

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

        // Modo 1: Binary (0 y 1)
        if (u_fontMode == 1) {
            if (idx < 3) return 0;
            if (idx < 17) return 15255086; // 0
            return 32641183; // 1
        }

        // Modo 2: Matrix Hex (0-9, A-F)
        if (u_fontMode == 2) {
            int hexChars[16];
            hexChars[0]  = 15255086;
            hexChars[1]  = 32641183;
            hexChars[2]  = 32540703;
            hexChars[3]  = 32540687;
            hexChars[4]  = 18415121;
            hexChars[5]  = 32603679;
            hexChars[6]  = 32603695;
            hexChars[7]  = 32514081;
            hexChars[8]  = 32554031;
            hexChars[9]  = 32554015;
            hexChars[10] = 18415150;
            hexChars[11] = 16301619;
            hexChars[12] = 31491102;
            hexChars[13] = 7652647;
            hexChars[14] = 32554047;
            hexChars[15] = 1096767;
            if (idx < 2) return 0;
            int hIdx = int(clamp(gray * 15.0, 0.0, 15.0));
            return hexChars[hIdx];
        }

        // Modo 3: Minimal Dots
        if (u_fontMode == 3) {
            if (idx < 4) return 0;
            if (idx < 12) return 4096;
            if (idx < 20) return 65600;
            if (idx < 28) return 147584;
            return 332772;
        }

        // Modo 0 (Standard 32 ASCII)
        int chars[32];
        chars[0]  = 0;
        chars[1]  = 4096;
        chars[2]  = 131072;
        chars[3]  = 65600;
        chars[4]  = 67648;
        chars[5]  = 32641183;
        chars[6]  = 4329631;
        chars[7]  = 32539681;
        chars[8]  = 147584;
        chars[9]  = 332772;
        chars[10] = 31491102;
        chars[11] = 1096767;
        chars[12] = 16267294;
        chars[13] = 4539953;
        chars[14] = 1097255;
        chars[15] = 32554047;
        chars[16] = 18415150;
        chars[17] = 7652647;
        chars[18] = 18415153;
        chars[19] = 18128177;
        chars[20] = 18437745;
        chars[21] = 18136623;
        chars[22] = 15255086;
        chars[23] = 15255089;
        chars[24] = 18157905;
        chars[25] = 32575775;
        chars[26] = 16301619;
        chars[27] = 32044094;
        chars[28] = 18142766;
        chars[29] = 18405233;
        chars[30] = 18732593;
        chars[31] = 11512810;
        return chars[idx];
    }

    void main() {
        vec2 pix = gl_FragCoord.xy;
        float charSize = max(4.0, u_charSize);
        vec2 cellCoord = floor(pix / charSize);
        vec2 cellCenter = (cellCoord + 0.5) * charSize;
        vec2 cellUV = cellCenter / u_resolution.xy;
        
        vec4 noiseColor = texture(u_noiseTexture, cellUV);
        float gray = dot(noiseColor.rgb, vec3(0.299, 0.587, 0.114));
        
        int n = getCharBitmask(gray);
        if (n == 0 || noiseColor.a <= 0.001) {
            fragColor = vec4(0.0);
            return;
        }

        vec2 localUV = mod(pix, charSize) / charSize;
        float scale = max(0.1, u_glyphScale);
        vec2 p = (localUV - 0.5) / scale + 0.5;
        p *= 5.0;
        p.y = 4.0 - p.y;

        float charMask = character(n, p);
        fragColor = vec4(noiseColor.rgb * charMask * u_opacity, noiseColor.a * charMask * u_opacity);
    }`;

    this.noiseProgramInfo = this.createProgramInfo(vsSource, noiseFsSource, [
      'u_resolution', 'u_time', 'u_tile', 'u_opacity', 'u_speed',
      'u_color1', 'u_color2', 'u_color3', 'u_color4'
    ]);

    this.asciiProgramInfo = this.createProgramInfo(vsSource, asciiFsSource, [
      'u_resolution', 'u_noiseTexture', 'u_charSize', 'u_glyphScale',
      'u_opacity', 'u_fontMode'
    ]);

    this.blitProgramInfo = this.createProgramInfo(blitVsSource, blitFsSource, [
      'u_bufferTexture', 'u_opacity'
    ]);
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[AsciiShaderBackground] Error compilando shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgramInfo(vsSource, fsSource, uniformNames) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[AsciiShaderBackground] Error linkeando programa:', gl.getProgramInfoLog(prog));
      return null;
    }

    const uniforms = {};
    for (const name of uniformNames) {
      uniforms[name] = gl.getUniformLocation(prog, name);
    }

    return {
      program: prog,
      attribLocation: gl.getAttribLocation(prog, 'position'),
      uniforms
    };
  }

  initFBO(width, height) {
    const gl = this.gl;
    if (!gl) return;

    if (this.noiseFbo) gl.deleteFramebuffer(this.noiseFbo);
    if (this.noiseFboTexture) gl.deleteTexture(this.noiseFboTexture);

    this.fboWidth = width;
    this.fboHeight = height;

    this.noiseFboTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.noiseFboTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.noiseFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.noiseFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.noiseFboTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize() {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.initFBO(width, height);
    }
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  render() {
    if (!this.isRunning || !this.gl) return;
    const gl = this.gl;
    const cfg = this.config;

    if (!cfg.enabled) {
      gl.clearColor(0.02, 0.03, 0.06, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.animFrameId = requestAnimationFrame(() => this.render());
      return;
    }

    const time = (performance.now() - this.startTime) * 0.001;

    // --- PASO 1: Renderizar Noise a FBO ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.noiseFbo);
    gl.viewport(0, 0, this.fboWidth, this.fboHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.noiseProgramInfo) {
      gl.useProgram(this.noiseProgramInfo.program);
      gl.enableVertexAttribArray(this.noiseProgramInfo.attribLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.vertexAttribPointer(this.noiseProgramInfo.attribLocation, 2, gl.FLOAT, false, 0, 0);

      const u = this.noiseProgramInfo.uniforms;
      gl.uniform2f(u.u_resolution, this.fboWidth, this.fboHeight);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_tile, Number(cfg.tile) || 2.0);
      gl.uniform1f(u.u_opacity, Number(cfg.opacity) || 0.75);
      gl.uniform1f(u.u_speed, Number(cfg.speed) || 0.35);

      const c1 = AsciiShaderBackground.hexToRgb(cfg.color1);
      const c2 = AsciiShaderBackground.hexToRgb(cfg.color2);
      const c3 = AsciiShaderBackground.hexToRgb(cfg.color3);
      const c4 = AsciiShaderBackground.hexToRgb(cfg.color4);

      gl.uniform3f(u.u_color1, c1[0], c1[1], c1[2]);
      gl.uniform3f(u.u_color2, c2[0], c2[1], c2[2]);
      gl.uniform3f(u.u_color3, c3[0], c3[1], c3[2]);
      gl.uniform3f(u.u_color4, c4[0], c4[1], c4[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // --- PASO 2: Renderizar a Pantalla (FBO -> Pantalla con ASCII o Blit) ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.02, 0.03, 0.06, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (cfg.asciiNoiseOnly) {
      if (this.blitProgramInfo) {
        gl.useProgram(this.blitProgramInfo.program);
        gl.enableVertexAttribArray(this.blitProgramInfo.attribLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.blitProgramInfo.attribLocation, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseFboTexture);
        gl.uniform1i(this.blitProgramInfo.uniforms.u_bufferTexture, 0);
        gl.uniform1f(this.blitProgramInfo.uniforms.u_opacity, Number(cfg.opacity) || 0.75);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    } else {
      if (this.asciiProgramInfo) {
        gl.useProgram(this.asciiProgramInfo.program);
        gl.enableVertexAttribArray(this.asciiProgramInfo.attribLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.asciiProgramInfo.attribLocation, 2, gl.FLOAT, false, 0, 0);

        const uA = this.asciiProgramInfo.uniforms;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        gl.uniform2f(uA.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(uA.u_charSize, (Number(cfg.charSize) || 14) * dpr);
        gl.uniform1f(uA.u_glyphScale, Number(cfg.glyphScale) || 0.85);
        gl.uniform1i(uA.u_fontMode, parseInt(cfg.fontMode) || 0);
        gl.uniform1f(uA.u_opacity, Number(cfg.opacity) || 0.75);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseFboTexture);
        gl.uniform1i(uA.u_noiseTexture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.render());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.stop();
    const gl = this.gl;
    if (!gl) return;
    if (this.noiseFbo) gl.deleteFramebuffer(this.noiseFbo);
    if (this.noiseFboTexture) gl.deleteTexture(this.noiseFboTexture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
  }
}
