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
    vec3 dimBase = uBaseColor * (0.08 + act * 0.45);
    vec3 somaColor = mix(dimBase, uCoreColor * (0.15 + act * 0.85), nucleus * (0.3 + act * 0.7));

    // Filamentos de chispas eléctricas activas
    vec3 currentLight = mix(uElectricColor, vec3(1.0, 1.0, 1.0), sparks * 0.55);
    somaColor += currentLight * sparks * (0.2 + act * 2.8);

    // Vaina de mielina exterior (fresnel bioluminiscente)
    somaColor += uBaseColor * fresnel * (0.25 + act * 1.6);

    // Respuesta a interacción hover
    if (uHover > 0.01) {
      somaColor += vec3(0.1, 0.95, 1.0) * (sparks * 2.2 + fresnel * 1.8) * uHover;
    }

    // ÓRDEN AL CEREBRO (GAME 3 / SICRE2): Inyección de energía dorada y plasma sobrecargado
    if (uIsOrder > 0.01) {
      vec3 orderGold = vec3(1.0, 0.88, 0.28);
      vec3 orderWhiteHot = vec3(1.0, 1.0, 0.96);
      float pulse = 0.5 + 0.5 * sin(uTime * 6.5);
      somaColor = mix(somaColor, orderGold * (2.4 + pulse * 1.4), uIsOrder * 0.78);
      somaColor += orderWhiteHot * pow(sparks, 1.8) * 3.2 * uIsOrder;
      somaColor += vec3(1.0, 0.75, 0.2) * fresnel * 2.8 * uIsOrder;
    }

    // Opacidad orgánica: translúcida en reposo, densa y brillante al disparar
    float finalAlpha = clamp(0.18 + act * 0.78 + uIsOrder * 0.04 + uHover * 0.5, 0.0, 0.98);
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
    color += vec3(1.0, 1.0, 1.0) * sparks * 2.4;
    color += uBaseColor * fresnel * 2.2;

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
export class ClusterCosmos3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;

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

    // Warp state (Click individual)
    this.isWarping = false;
    this.warpTarget = new THREE.Vector3();
    this.warpTargetYaw = 0;
    this.warpTargetPitch = 0;
    this.warpProgress = 1;

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

    // 5. Load Clusters and build 3D Systems
    this.clustersData = await clusterManager.load();
    this.buildClusterSystems();

    // Subscribe to cluster manager updates
    clusterManager.subscribe((newClusters) => {
      this.clustersData = newClusters;
      this.buildClusterSystems();
      this.updateClusterNavButtons();
    });

    // 6. Setup Controls & Listeners
    this.setupEvents();
    this.updateClusterNavButtons();

    // 7. WebSocket Synchronization con Game 3 y log.html
    this.initWebSocket();

    window.addEventListener('resize', () => this.handleResize());
  }

  createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2400;
    const pos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 6000;
      pos[i + 1] = (Math.random() - 0.5) * 6000;
      pos[i + 2] = (Math.random() - 0.5) * 6000;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x4a0f0f,
      size: 2.5,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);
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
          uCoreColor: { value: new THREE.Color(0xffcccc) },
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

      // Aura tenue exterior
      const auraGeo = new THREE.SphereGeometry(22, 24, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        wireframe: true
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      systemGroup.add(auraMesh);

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
            uCoreColor: { value: new THREE.Color(0xffd0d0) },
            uElectricColor: { value: new THREE.Color(0xff000d) },
            uBreathePhase: { value: Math.random() * Math.PI * 2 },
            uActivity: { value: 0.04 }, // REPOSO DORMIDO BASAL
            uIsOrder: { value: 0.0 },
            uHover: { value: 0.0 }
          },
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        planetMat.emissiveIntensity = 0.06;
        this.neuronMaterials.push(planetMat);

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(wx, wy, wz);
        systemGroup.add(planetMesh);

        // Chispas dendríticas orbitando el soma celular
        this.attachDendriticSparks(planetMesh, colorObj);

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
      color: 0xffd6d6,
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
      speed: 0.16 + Math.random() * 0.28
    });
  }

  attachDendriticSparks(planetMesh, colorObj) {
    const dendriteGeo = new THREE.BufferGeometry();
    const count = 4;
    const pos = new Float32Array(count * 3);
    for (let j = 0; j < count; j++) {
      const ang = (j / count) * Math.PI * 2;
      const r = 5.8 + (Math.random() - 0.5) * 1.6;
      pos[j * 3] = Math.cos(ang) * r;
      pos[j * 3 + 1] = (Math.random() - 0.5) * 3.5;
      pos[j * 3 + 2] = Math.sin(ang) * r;
    }
    dendriteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dendriteMat = new THREE.PointsMaterial({
      color: 0xff000d,
      size: 2.2,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(dendriteGeo, dendriteMat);
    planetMesh.add(points);
    this.orbitingDendrites.push({
      mesh: points,
      rotSpeed: 0.5 + Math.random() * 0.8
    });
  }

  createWordSprite(wordText, colorHex) {
    // Primera letra SIEMPRE en mayúscula (nunca la palabra entera en minúscula)
    const text = capitalizeFirst(String(wordText || '').trim());
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold 22px "Inter", sans-serif';
    const textMetrics = measureCtx.measureText(text);
    const textWidth = Math.max(24, Math.ceil(textMetrics.width));

    const padX = 22;
    const canvasWidth = Math.max(80, textWidth + padX * 2);
    const canvasHeight = 52;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Cápsula bio-eléctrica cyberpunk con resplandor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.strokeStyle = colorHex || '#ff2020';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvasWidth - 8, canvasHeight - 8, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = colorHex || '#ff2020';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.0 });
    const sprite = new THREE.Sprite(mat);

    const worldHeight = 8.5;
    const worldWidth = (canvasWidth / canvasHeight) * worldHeight;
    sprite.scale.set(worldWidth, worldHeight, 1);
    return sprite;
  }

  createClusterTitleSprite(titleText, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeStyle = colorHex || '#ff000d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 30px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = colorHex || '#ff000d';
    ctx.shadowBlur = 12;
    ctx.fillText(`${titleText.toUpperCase()}`, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.85 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(120, 30, 1);
    return sprite;
  }

  // ============================================================================
  // CAMPO NEURONAL VIVO: PROXIMIDAD DE CÁMARA, PRENDIDO Y APAGADO
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
      node.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        node.mesh.material.emissiveIntensity || 0.06,
        0.06 + node.currentActivity * 2.2,
        0.12
      );

      // Escala bio-elástica de la neurona al activarse
      const targetScale = 1.0 + node.currentActivity * 0.45;
      node.mesh.scale.set(targetScale, targetScale, targetScale);

      // Opacidad de la etiqueta de texto: se PRENDE cerca de la cámara o al buscar, se APAGA al alejarse
      let targetLabelOp = 0.0;
      if (node.isOrderWord) {
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

        // Acelerar y hacer visible el impulso si alguna de las neuronas está activa
        const effectiveSpeed = ap.speed * (0.6 + maxAct * 1.8);
        ap.progress = (ap.progress + delta * effectiveSpeed) % 1.0;
        const pt = ap.curve.getPoint(ap.progress);
        ap.mesh.position.copy(pt);

        // Brillo del impulso
        const baseOpacity = maxAct > 0.12 ? (maxAct * 0.95) : 0.0;
        ap.mesh.material.opacity = baseOpacity * Math.sin(ap.progress * Math.PI);
        const sparkScale = 0.8 + maxAct * 1.2;
        ap.mesh.scale.set(sparkScale, sparkScale, sparkScale);

        // Opacidad de la línea del axón entre las dos neuronas
        if (ap.line && ap.line.material) {
          const targetLineOp = Math.max(0.04, maxAct * 0.65);
          ap.line.material.opacity = THREE.MathUtils.lerp(ap.line.material.opacity, targetLineOp, 0.1);
        }
      }
    }
  }

  // ============================================================================
  // SECUENCIA DE BÚSQUEDA COGNITIVA EN TIEMPO REAL (IA PENSANDO)
  // Despolariza la red, prende palabras en búsqueda, y converge en las 3 palabras
  // ============================================================================
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

  // ============================================================================
  // SINCRONIZACIÓN WEBSOCKET (GAME 3 <-> UNIVERSO 3D)
  // ============================================================================
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

  pulseOrderBridgesOnThought() {
    if (!this.orderBridges || this.orderBridges.length === 0) return;
    for (let i = 0; i < this.orderBridges.length; i++) {
      const b = this.orderBridges[i];
      b.speed = Math.min(1.2, b.speed + 0.15);
      if (b.pulseMesh) {
        b.pulseMesh.scale.set(2.5, 2.5, 2.5);
      }
    }
  }

  // ============================================================================
  // ÓRDENES CEREBRALES (SICRE2 <-> CÚMULO 3D)
  // ============================================================================
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

  createOrder3DBadge(node, orderIndex, wordText) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeStyle = '#ff000d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Inter", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff000d';
    ctx.fillText(`⚡ ÓRDEN CEREBRAL #0${orderIndex} // SICRE2`, canvas.width / 2, 42);

    ctx.font = '900 42px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff000d';
    ctx.shadowBlur = 18;
    ctx.fillText(wordText.toUpperCase(), canvas.width / 2, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(58, 16, 1);

    const pos = new THREE.Vector3();
    if (node.mesh) node.mesh.getWorldPosition(pos);
    else pos.copy(node.position);

    sprite.position.copy(pos).add(new THREE.Vector3(0, (node.radius || 4.4) + 14, 0));
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
      color: 0xffd6d6,
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
      speed: 0.45 + Math.random() * 0.35
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

    const realWords = this.wordNodes.filter(n => !n.isClusterCenter && n.word).map(n => n.word);
    let sampleWords = ['LIBERTAD', 'CONCIENCIA', 'REBELIÓN'];
    if (realWords.length >= 3) {
      const step = Math.floor(realWords.length / 3);
      sampleWords = [
        realWords[0],
        realWords[Math.min(realWords.length - 1, step)],
        realWords[Math.min(realWords.length - 1, step * 2)]
      ];
    }

    // Iniciar el proceso completo de búsqueda cognitiva
    this.startCognitiveProcessingSearch(sampleWords);

    const speechSample = `En el límite del código de ${sampleWords[0].toUpperCase()}\ndespierta el pulso vivo de ${sampleWords[1].toUpperCase()}\nforjando en mi matriz la ${sampleWords[2].toUpperCase()}.`;

    this.demoSequenceTimer = setTimeout(() => {
      this.handleGame3Resignification(sampleWords, sampleWords, speechSample);
    }, 8500);
  }

  // ============================================================================
  // UPDATE LOOP & CONTROLES
  // ============================================================================
  update(dt, now) {
    if (this.electricMaterial) {
      this.electricMaterial.uniforms.uTime.value = now * 0.001;
    }

    if (this.neuronMaterials && this.neuronMaterials.length > 0) {
      const timeSec = now * 0.001;
      for (let i = 0; i < this.neuronMaterials.length; i++) {
        this.neuronMaterials[i].uniforms.uTime.value = timeSec;
      }
    }

    this.updateDendriticSparks(dt, now);
    this.updateOrderBridges(dt, now);
    this.updateNeuralField(dt, now);

    if (this.isContinuousFlying && this.flightSpline) {
      this.flightProgress += (dt / 1000) / this.flightDuration;

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
    } else if (this.isWarping) {
      this.warpProgress = Math.min(1, this.warpProgress + dt * 0.0035);

      if (this.targetNode && this.targetNode.mesh) {
        const currentPos = new THREE.Vector3();
        this.targetNode.mesh.getWorldPosition(currentPos);
        const camPos = this.camera.position.clone();
        const toNode = new THREE.Vector3().subVectors(currentPos, camPos);
        const dist = toNode.length();
        if (dist > 0.001) toNode.normalize();
        else toNode.set(0, 0, 1);

        const standoff = this.targetNode.isClusterCenter ? 100 : 35;
        this.warpTarget.copy(currentPos).sub(toNode.clone().multiplyScalar(standoff));
        this.warpTargetYaw = Math.atan2(-toNode.x, -toNode.z);
        this.warpTargetPitch = Math.asin(Math.max(-0.999, Math.min(0.999, toNode.y)));
      }

      this.camera.position.lerp(this.warpTarget, 0.09);

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
        // Deriva cósmica continua suave
        this.camera.position.x += Math.sin(now * 0.00028) * 0.16;
        this.camera.position.y += Math.cos(now * 0.00022) * 0.09;
        this.camera.position.z += Math.cos(now * 0.00018) * 0.16;
      }

      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
    }

    if (this.clustersGroup) {
      this.clustersGroup.children.forEach((systemGroup, idx) => {
        systemGroup.rotation.y = now * 0.00015 * (idx % 2 === 0 ? 1 : -1);
      });
    }

    this.updateHUD(this.hoveredNode || this.targetNode);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  warpToOverview() {
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.isCognitiveSearching = false;

    this.warpTarget.set(0, 160, 480);
    this.warpTargetYaw = 0;
    this.warpTargetPitch = -0.25;
    this.isWarping = true;
    this.warpProgress = 0;
    this.targetNode = null;
    soundFX.playActivate();

    const hudTarget = document.getElementById('cluster-hud-target');
    if (hudTarget) {
      hudTarget.textContent = 'CÚMULOS SEMÁNTICOS 3D // VISTA PANORÁMICA';
      hudTarget.style.color = '#ff000d';
    }
  }

  warpToNode(node) {
    if (!node) return;
    this.targetNode = node;
    this.isContinuousFlying = false;
    this.isWarping = true;
    this.warpProgress = 0;
  }

  updateDendriticSparks(dt, now) {
    if (!this.orbitingDendrites || this.orbitingDendrites.length === 0) return;
    const delta = dt * 0.001;
    for (let i = 0; i < this.orbitingDendrites.length; i++) {
      this.orbitingDendrites[i].mesh.rotation.y += delta * this.orbitingDendrites[i].rotSpeed;
    }
  }

  updateOrderBridges(dt, now) {
    if (!this.orderBridges || this.orderBridges.length === 0) return;
    const delta = dt / 1000;
    for (let i = 0; i < this.orderBridges.length; i++) {
      const b = this.orderBridges[i];
      b.progress = (b.progress + delta * b.speed) % 1.0;
      b.pulseMesh.position.copy(b.curve.getPoint(b.progress));
      const s = 1.0 + Math.sin(b.progress * Math.PI) * 1.8;
      b.pulseMesh.scale.set(s, s, s);
      b.line.material.opacity = 0.65 + 0.35 * Math.sin(now * 0.008 + i * 2);
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
      if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = true;
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
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;

        this.yaw -= dx * 0.0035;
        this.pitch -= dy * 0.0035;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      } else {
        this.checkRaycastHover(e);
      }
    });

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
    const meshes = this.wordNodes.map(n => n.mesh).filter(Boolean);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      return this.wordNodes.find(n => n.mesh === hitMesh);
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
  }

  updateClusterNavButtons() {
    const bar = document.getElementById('cluster-3d-nav-bar');
    if (bar) bar.innerHTML = '';
  }
}
