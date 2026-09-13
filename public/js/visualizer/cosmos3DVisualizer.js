import * as THREE from '../libs/three.module.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

/**
 * GLSL Vertex Shader for Electric Lightning Noise
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
 * Uses 3D Simplex noise with smoothstep edge detection to extract pure crackling electric lightning lines
 */
const electricFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorCyan;
  uniform vec3 uColorPurple;
  uniform vec3 uColorWhite;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // 3D Simplex Noise generator
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

  void main() {
    // Spatial coordinates & animated time factor for rapid crackling
    vec3 p = vPosition * 0.58;
    float t = uTime * 2.8;

    // Multi-frequency noise sampling for fractal lightning branches
    float n1 = snoise(p + vec3(0.0, t * 0.9, 0.0));
    float n2 = snoise(p * 2.2 + vec3(-t * 1.3, 0.0, t * 0.7));
    float n3 = snoise(p * 4.0 + vec3(t * 0.5, -t * 1.2, 0.0));

    // Smoothstep edge extraction: isolates narrow lightning bands/lines
    float edge1 = 1.0 - smoothstep(0.0, 0.065, abs(n1 - 0.05));
    float edge2 = 1.0 - smoothstep(0.0, 0.055, abs(n2 + 0.14));
    float edge3 = 1.0 - smoothstep(0.0, 0.045, abs(n3 - 0.22));

    float sparks = edge1 * 1.35 + edge2 * 1.05 + edge3 * 0.75;

    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normalize(vNormal)));
    fresnel = pow(fresnel, 2.4);

    // Color gradient: cyan to purple plasma with intense white-hot lightning discharge
    vec3 plasmaColor = mix(uColorCyan, uColorPurple, sin(uTime * 3.5 + vPosition.y * 0.8) * 0.5 + 0.5);
    vec3 finalColor = plasmaColor * sparks * 2.6;
    finalColor += uColorWhite * pow(sparks, 2.8) * 2.2; // white-hot lightning filament core
    finalColor += uColorCyan * fresnel * 0.8;            // outer plasma corona

    float alpha = clamp(sparks * 1.45 + fresnel * 0.6, 0.0, 1.0);

    if (alpha < 0.05) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * 3D Cosmos Visualizer for 10,000 Word Vector Spheres
 * Features:
 * - 10,000 instanced spheres in 3D space based on 300D PCA coordinates
 * - WASD + QE flight controls with smooth double-click facing navigation
 * - Procedural GLSL Electric Noise Shader Material on hovered / selected spheres
 * - Real-time calibration HUD (distance, count, label size, sphere size, speed)
 * - Zero inter-word clutter (connections removed in 3D view)
 */
export class Cosmos3DVisualizer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.onSelectWord = options.onSelectWord || (() => {});

    // Scene setup
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.instancedMesh = null;
    this.starField = null;

    // Calibration settings (real-time adjustable)
    this.labelDistance = 260;
    this.maxVisibleLabels = 45;
    this.labelScale = 1.0;
    this.sphereScale = 1.0;
    this.speed = 4.5;

    // Word labels pool
    this.maxPoolSize = 90;
    this.labelPool = [];

    // Hover state & visuals
    this.hoveredIndex = -1;
    this.hoveredWord = null;
    this.electricSphere = null;
    this.electricMaterial = null;

    this.hoverSprite = null;
    this.hoverCanvas = null;
    this.hoverCtx = null;
    this.hoverTexture = null;

    // Raycasting tools
    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();

    // Flight controls
    this.keys = {
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      KeyQ: false,
      KeyE: false,
      Space: false,
      ShiftLeft: false,
      ShiftRight: false
    };

    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;
    this.isMouseDown = false;
    this.lastMouse = { x: 0, y: 0 };

    // Targeted / Selected word
    this.currentTargetWord = null;
    this.currentTargetIndex = -1;

    // Warp animation (Position + LookAt Facing Orientation)
    this.isWarping = false;
    this.warpTarget = new THREE.Vector3();
    this.warpTargetPitch = 0;
    this.warpTargetYaw = 0;
    this.warpProgress = 1;

    this.animId = null;
    this.lastTime = performance.now();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Three.js Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050711, 0.0006);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 6000);
    this.camera.position.set(0, 0, 450);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x04060d, 1);
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2.5, 3000);
    pointLight.position.set(0, 500, 500);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xa855f7, 2, 3000);
    pointLight2.position.set(-500, -500, -500);
    this.scene.add(pointLight2);

    // 4. Ambient Space Particles (Starfield)
    this.createStarfield();

    // 5. Build 10,000 Instanced Spheres
    this.buildInstancedSpheres();

    // 6. Setup Dynamic Billboard Labels Pool
    this.createLabelPool();

    // 7. Setup Electric Lightning Noise Mesh & Priority Hover Label
    this.createHoverVisuals();

    // 8. Event Handlers
    this.setupEvents();

    window.addEventListener('resize', () => this.handleResize());
  }

  createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 4500;
      starPositions[i + 1] = (Math.random() - 0.5) * 4500;
      starPositions[i + 2] = (Math.random() - 0.5) * 4500;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 3.5,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.starField = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starField);
  }

  buildInstancedSpheres() {
    if (!semanticEngine.coords3d || semanticEngine.vocab.length === 0) return;

    const count = semanticEngine.vocab.length;
    const sphereGeo = new THREE.SphereGeometry(3.8, 14, 14);
    const sphereMat = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.6,
      emissiveIntensity: 0.6
    });

    this.instancedMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, count);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = semanticEngine.coords3d[i * 3];
      const y = semanticEngine.coords3d[i * 3 + 1];
      const z = semanticEngine.coords3d[i * 3 + 2];

      dummy.position.set(x, y, z);
      dummy.scale.set(this.sphereScale, this.sphereScale, this.sphereScale);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);

      // Color based on 3D PCA coordinates
      const nx = (x + 900) / 1800;
      const ny = (y + 900) / 1800;

      color.setHSL(0.5 + nx * 0.4, 0.85, 0.55 + ny * 0.2);
      this.instancedMesh.setColorAt(i, color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    this.instancedMesh.computeBoundingSphere();
    this.instancedMesh.computeBoundingBox();

    this.scene.add(this.instancedMesh);
  }

  createLabelPool() {
    this.labelPool = [];
    for (let i = 0; i < this.maxPoolSize; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });

      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(38, 9.5, 1);
      sprite.visible = false;
      this.scene.add(sprite);

      this.labelPool.push({
        sprite,
        canvas,
        ctx: canvas.getContext('2d'),
        texture,
        currentWord: '',
        isTarget: false
      });
    }
  }

  createHoverVisuals() {
    // 1. Procedural Electric Lightning Noise Mesh
    const electricGeo = new THREE.SphereGeometry(4.2, 32, 32);
    this.electricMaterial = new THREE.ShaderMaterial({
      vertexShader: electricVertexShader,
      fragmentShader: electricFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorCyan: { value: new THREE.Color(0x00f0ff) },
        uColorPurple: { value: new THREE.Color(0xa855f7) },
        uColorWhite: { value: new THREE.Color(0xffffff) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.electricSphere = new THREE.Mesh(electricGeo, this.electricMaterial);
    this.electricSphere.visible = false;
    this.scene.add(this.electricSphere);

    // 2. High-priority billboard sprite for the hovered / targeted word
    const canvas = document.createElement('canvas');
    canvas.width = 340;
    canvas.height = 84;
    this.hoverCanvas = canvas;
    this.hoverCtx = canvas.getContext('2d');
    this.hoverTexture = new THREE.CanvasTexture(canvas);
    this.hoverTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.hoverTexture,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    this.hoverSprite = new THREE.Sprite(spriteMat);
    this.hoverSprite.visible = false;
    this.scene.add(this.hoverSprite);
  }

  updateLabelSprite(labelItem, word, isTarget = false) {
    if (labelItem.currentWord === word && labelItem.isTarget === isTarget) return;

    labelItem.currentWord = word;
    labelItem.isTarget = isTarget;
    const ctx = labelItem.ctx;
    const canvas = labelItem.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pill background
    ctx.fillStyle = isTarget ? 'rgba(0, 240, 255, 0.45)' : 'rgba(10, 16, 32, 0.75)';
    ctx.strokeStyle = isTarget ? '#00f0ff' : 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = isTarget ? 3 : 1.5;

    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 12);
    ctx.fill();
    ctx.stroke();

    // Word text
    ctx.font = `bold ${isTarget ? 24 : 20}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isTarget ? '#ffffff' : '#e2e8f0';
    if (isTarget) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillText(word, canvas.width / 2, canvas.height / 2);

    labelItem.texture.needsUpdate = true;
  }

  updateHoverSprite(word) {
    const ctx = this.hoverCtx;
    const canvas = this.hoverCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glowing cyan/purple pill container
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#a855f7');

    ctx.fillStyle = 'rgba(6, 10, 24, 0.92)';
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 14);
    ctx.fill();
    ctx.stroke();

    // Word text with bright cyber electric glow
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.fillText(`⚡ ${word.toUpperCase()}`, canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;

    this.hoverTexture.needsUpdate = true;
  }

  getIntersectedInstance(e) {
    if (!this.instancedMesh || !semanticEngine.coords3d || !this.camera) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const intersects = this.raycaster.intersectObject(this.instancedMesh);

    if (intersects.length > 0) {
      const idx = intersects[0].instanceId;
      if (idx !== undefined && idx >= 0 && idx < semanticEngine.vocab.length) {
        return {
          index: idx,
          word: semanticEngine.vocab[idx],
          x: semanticEngine.coords3d[idx * 3],
          y: semanticEngine.coords3d[idx * 3 + 1],
          z: semanticEngine.coords3d[idx * 3 + 2]
        };
      }
    }

    // Proximity ray check for distant spheres (generous angular tolerance)
    const ray = this.raycaster.ray;
    const count = semanticEngine.vocab.length;
    const coords = semanticEngine.coords3d;
    let closestDistSq = Infinity;
    let closestIndex = -1;
    const temp = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      temp.set(coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]);
      // Sphere must be in front of camera
      if (ray.direction.dot(temp.clone().sub(ray.origin)) <= 0) continue;

      const camDist = this.camera.position.distanceTo(temp);
      const distToRaySq = ray.distanceSqToPoint(temp);
      const threshold = Math.max(6.0, camDist * 0.022);
      if (distToRaySq < threshold * threshold) {
        if (distToRaySq < closestDistSq) {
          closestDistSq = distToRaySq;
          closestIndex = i;
        }
      }
    }

    if (closestIndex !== -1) {
      return {
        index: closestIndex,
        word: semanticEngine.vocab[closestIndex],
        x: coords[closestIndex * 3],
        y: coords[closestIndex * 3 + 1],
        z: coords[closestIndex * 3 + 2]
      };
    }

    return null;
  }

  handleHover(e) {
    if (this.isMouseDown || this.isWarping) return;
    const hit = this.getIntersectedInstance(e);

    if (hit) {
      if (this.hoveredIndex !== hit.index) {
        this.hoveredIndex = hit.index;
        this.hoveredWord = hit.word;
        soundFX.playHover();
      }

      this.renderer.domElement.style.cursor = 'pointer';

      // Position and scale procedural electric lightning sphere
      const sphereRadius = 3.8 * this.sphereScale;
      this.electricSphere.position.set(hit.x, hit.y, hit.z);
      this.electricSphere.scale.set(this.sphereScale * 1.08, this.sphereScale * 1.08, this.sphereScale * 1.08);
      this.electricSphere.visible = true;

      // Position and scale hover sprite
      const camDist = this.camera.position.distanceTo(new THREE.Vector3(hit.x, hit.y, hit.z));
      this.updateHoverSprite(hit.word);

      const spriteScale = Math.max(0.8, camDist * 0.016) * this.labelScale;
      this.hoverSprite.scale.set(44 * spriteScale, 11 * spriteScale, 1);
      this.hoverSprite.position.set(hit.x, hit.y + (sphereRadius + 5.5 * spriteScale), hit.z);
      this.hoverSprite.visible = true;

      // Update HUD target text
      const targetEl = document.getElementById('cosmos-hud-target');
      if (targetEl) {
        targetEl.textContent = `${hit.word.toUpperCase()} [DETECTADO]`;
      }
    } else {
      this.clearHover();
    }
  }

  clearHover() {
    if (this.hoveredIndex !== -1) {
      this.hoveredIndex = -1;
      this.hoveredWord = null;

      // If we have a selected target word, keep the electric material on it
      if (this.currentTargetWord) {
        const coord = semanticEngine.getWordCoord3D(this.currentTargetWord);
        if (coord) {
          this.electricSphere.position.set(coord.x, coord.y, coord.z);
          this.electricSphere.scale.set(this.sphereScale * 1.08, this.sphereScale * 1.08, this.sphereScale * 1.08);
          this.electricSphere.visible = true;
        } else {
          if (this.electricSphere) this.electricSphere.visible = false;
        }
      } else {
        if (this.electricSphere) this.electricSphere.visible = false;
      }

      if (this.hoverSprite) this.hoverSprite.visible = false;
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'grab';
      }
      this.updateHUD();
    }
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      // Avoid capturing flight keys when typing in an input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code in this.keys) {
        this.keys[e.code] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = false;
      }
    });

    // Mouse drag to rotate camera
    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.clearHover();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.yaw -= dx * 0.0032;
        this.pitch -= dy * 0.0032;
        // Clamp pitch
        this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.clearHover();
      } else {
        this.handleHover(e);
      }
    });

    dom.addEventListener('mouseleave', () => {
      this.clearHover();
    });

    // Mouse scroll to adjust flight speed
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.speed = Math.max(1.0, Math.min(25, this.speed * factor));
      this.updateHUD();

      const speedSlider = document.getElementById('calib-flight-speed');
      const speedVal = document.getElementById('val-flight-speed');
      if (speedSlider) speedSlider.value = this.speed.toFixed(1);
      if (speedVal) speedVal.textContent = `${this.speed.toFixed(1)}x`;
    }, { passive: false });

    // Single click: Target sphere
    dom.addEventListener('click', (e) => {
      const hit = this.getIntersectedInstance(e);
      if (hit) {
        this.selectSphere(hit.word);
      } else {
        this.targetWordUnderCrosshair();
      }
    });

    // Double click: Warp flight directly in front of the sphere, looking right at it
    dom.addEventListener('dblclick', (e) => {
      const hit = this.getIntersectedInstance(e);
      if (hit) {
        this.warpToWord(hit.word);
      }
    });
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
  }

  selectSphere(word) {
    const coord = semanticEngine.getWordCoord3D(word);
    if (!coord) return;

    this.currentTargetWord = coord.word;
    this.currentTargetIndex = coord.index;
    soundFX.playActivate();

    // Place electric lightning material on selected sphere
    if (this.electricSphere) {
      this.electricSphere.position.set(coord.x, coord.y, coord.z);
      this.electricSphere.scale.set(this.sphereScale * 1.08, this.sphereScale * 1.08, this.sphereScale * 1.08);
      this.electricSphere.visible = true;
    }

    this.updateHUD();
  }

  /**
   * Warps camera smoothly to stand right in front of the sphere, facing it directly
   */
  warpToWord(word) {
    const coord = semanticEngine.getWordCoord3D(word);
    if (!coord) return false;

    const spherePos = new THREE.Vector3(coord.x, coord.y, coord.z);
    const camPos = this.camera.position.clone();

    // Approach vector from camera to sphere
    const toSphere = new THREE.Vector3().subVectors(spherePos, camPos);
    const dist = toSphere.length();

    if (dist < 0.001) {
      toSphere.set(0, 0, 1);
    } else {
      toSphere.normalize();
    }

    // Standoff distance: comfortably frames the sphere right in front
    const standoff = Math.max(22, 30 * this.sphereScale);

    // Stop along approach direction directly in front of the sphere
    this.warpTarget.copy(spherePos).sub(toSphere.clone().multiplyScalar(standoff));

    // Orientation: look directly at the sphere center
    this.warpTargetYaw = Math.atan2(-toSphere.x, -toSphere.z);
    this.warpTargetPitch = Math.asin(Math.max(-0.999, Math.min(0.999, toSphere.y)));

    this.isWarping = true;
    this.warpProgress = 0;
    this.selectSphere(coord.word);

    return true;
  }

  targetWordUnderCrosshair() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const testPoint = this.camera.position.clone().add(forward.multiplyScalar(60));

    const found = semanticEngine.findClosestWordToPosition(testPoint.x, testPoint.y, testPoint.z, 95);
    if (found) {
      this.selectSphere(found.word);
      soundFX.playHover();
    }
  }

  // Calibration API
  setLabelDistance(dist) {
    this.labelDistance = Number(dist);
  }

  setMaxVisibleLabels(count) {
    this.maxVisibleLabels = Math.min(this.labelPool.length, Number(count));
  }

  setLabelScale(scale) {
    this.labelScale = Number(scale);
  }

  setFlightSpeed(spd) {
    this.speed = Number(spd);
    this.updateHUD();
  }

  setSphereScale(scale) {
    this.sphereScale = Number(scale);
    if (!this.instancedMesh || !semanticEngine.coords3d) return;

    const count = semanticEngine.vocab.length;
    const coords = semanticEngine.coords3d;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.set(coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]);
      dummy.scale.set(this.sphereScale, this.sphereScale, this.sphereScale);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    if (this.electricSphere && this.electricSphere.visible) {
      this.electricSphere.scale.set(this.sphereScale * 1.08, this.sphereScale * 1.08, this.sphereScale * 1.08);
    }
  }

  resetCalibration() {
    this.labelDistance = 260;
    this.maxVisibleLabels = 45;
    this.labelScale = 1.0;
    this.setSphereScale(1.0);
    this.speed = 4.5;
    this.updateHUD();
  }

  update(dt, now) {
    // 1. Warp flight transition (Position + Facing Orientation)
    if (this.isWarping) {
      this.warpProgress = Math.min(1, this.warpProgress + dt * 0.0035);

      // Smooth position interpolation
      this.camera.position.lerp(this.warpTarget, 0.09);

      // Smooth yaw and pitch interpolation with shortest angle wrap
      let diffYaw = this.warpTargetYaw - this.yaw;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      this.yaw += diffYaw * 0.09;
      this.pitch += (this.warpTargetPitch - this.pitch) * 0.09;

      if (this.warpProgress >= 1 || this.camera.position.distanceTo(this.warpTarget) < 1.0) {
        this.isWarping = false;
        this.camera.position.copy(this.warpTarget);
        this.yaw = this.warpTargetYaw;
        this.pitch = this.warpTargetPitch;
      }
    } else {
      // 2. WASD + QE Keyboard Flight Controls
      const moveDir = new THREE.Vector3();

      if (this.keys.KeyW) moveDir.z -= 1; // Forward
      if (this.keys.KeyS) moveDir.z += 1; // Backward
      if (this.keys.KeyA) moveDir.x -= 1; // Left
      if (this.keys.KeyD) moveDir.x += 1; // Right
      if (this.keys.KeyQ || this.keys.Space) moveDir.y += 1; // Up (Q o Espacio)
      if (this.keys.KeyE || this.keys.ShiftLeft || this.keys.ShiftRight) moveDir.y -= 1; // Down (E o Shift)

      moveDir.normalize();
      moveDir.applyQuaternion(this.camera.quaternion);

      this.velocity.lerp(moveDir.multiplyScalar(this.speed * (dt / 16.6)), 0.15);
      this.camera.position.add(this.velocity);
    }

    // Apply pitch and yaw to camera
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 3. Update Electric Noise Shader Time Uniform
    if (this.electricMaterial) {
      this.electricMaterial.uniforms.uTime.value = now * 0.001;
    }

    // 4. Rotate starfield subtly
    if (this.starField) {
      this.starField.rotation.y = now * 0.00003;
    }

    // 5. Update Dynamic Billboard Labels for words close to camera
    this.updateNearbyLabels();

    // 6. Update HUD
    this.updateHUD();
  }

  updateNearbyLabels() {
    if (!semanticEngine.coords3d || this.labelPool.length === 0) return;

    const camPos = this.camera.position;
    const vocab = semanticEngine.vocab;
    const N = vocab.length;
    const coords = semanticEngine.coords3d;

    // Find closest words within calibrated radius
    const nearby = [];
    const maxRadiusSq = this.labelDistance * this.labelDistance;

    for (let i = 0; i < N; i++) {
      const x = coords[i * 3];
      const y = coords[i * 3 + 1];
      const z = coords[i * 3 + 2];

      const dx = x - camPos.x;
      const dy = y - camPos.y;
      const dz = z - camPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < maxRadiusSq) {
        nearby.push({
          index: i,
          word: vocab[i],
          x, y, z,
          dist: Math.sqrt(distSq)
        });
      }
    }

    nearby.sort((a, b) => a.dist - b.dist);

    const count = Math.min(this.maxVisibleLabels, nearby.length);

    for (let i = 0; i < count; i++) {
      const labelItem = this.labelPool[i];
      const item = nearby[i];
      const isTarget = item.word === this.currentTargetWord;

      // If hovered or targeted, hide the ambient label so priority hoverSprite shines cleanly
      if (item.index === this.hoveredIndex) {
        labelItem.sprite.visible = false;
        continue;
      }

      this.updateLabelSprite(labelItem, item.word, isTarget);

      labelItem.sprite.position.set(item.x, item.y + (4.5 * this.sphereScale + 3), item.z);
      labelItem.sprite.visible = true;

      const scaleFactor = Math.max(0.6, Math.min(1.5, item.dist / 70)) * this.labelScale;
      labelItem.sprite.scale.set(38 * scaleFactor, 9.5 * scaleFactor, 1);
    }

    for (let i = count; i < this.labelPool.length; i++) {
      this.labelPool[i].sprite.visible = false;
    }
  }

  updateHUD() {
    const coordsEl = document.getElementById('cosmos-hud-coords');
    const speedEl = document.getElementById('cosmos-hud-speed');
    const targetEl = document.getElementById('cosmos-hud-target');

    if (coordsEl && this.camera) {
      coordsEl.textContent = `X: ${Math.round(this.camera.position.x)}  Y: ${Math.round(this.camera.position.y)}  Z: ${Math.round(this.camera.position.z)}`;
    }
    if (speedEl) {
      speedEl.textContent = `${this.speed.toFixed(1)}x`;
    }
    if (targetEl && this.hoveredIndex === -1) {
      targetEl.textContent = this.currentTargetWord ? this.currentTargetWord.toUpperCase() : 'Ninguna';
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
