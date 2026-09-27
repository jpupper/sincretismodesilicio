import * as THREE from '../libs/three.module.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
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
 * Somatic membrane breathing, micro-dendritic ripples, and order overdrive
 */
const neuronVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathePhase;
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

    // Alta excitación plasmática cuando esta neurona es una orden cerebral
    float orderExcitation = uIsOrder * (sin(uTime * 9.0) * 0.14 + 0.12);
    float hoverExcitation = uHover * 0.08;

    float totalDisp = breathe + microNoise + orderExcitation + hoverExcitation;
    vDisplacement = totalDisp;

    vec3 displacedPos = position + normal * totalDisp;
    vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/**
 * GLSL Fragment Shader for Bio-Electric Neurons
 * Pure crackling electric lightning running continuously across the soma,
 * nucleus glow, myelin sheath fresnel, and brain order overdrive
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
    float speed = 2.6 + uActivity * 1.8 + uIsOrder * 4.2;
    vec3 p = vPosition * 0.72;
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

    // Color base celular bio-eléctrico
    vec3 somaColor = mix(uBaseColor * 0.42, uCoreColor, nucleus * 0.65);

    // Corrientes eléctricas continuas fluyendo por toda la neurona
    vec3 currentLight = mix(uElectricColor, vec3(1.0, 1.0, 1.0), sparks * 0.55);
    somaColor += currentLight * sparks * (1.9 + uActivity * 1.3);

    // Vaina de mielina exterior (fresnel bioluminiscente)
    somaColor += uBaseColor * fresnel * 1.45;

    // Respuesta a interacción hover: descarga de plasma cian
    if (uHover > 0.01) {
      somaColor += vec3(0.1, 0.95, 1.0) * (sparks * 2.0 + fresnel * 1.6) * uHover;
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

    gl_FragColor = vec4(somaColor, 0.95);
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
 * Universo 3D por Cúmulos (Cluster 3D Universe)
 * Renders user categories as distinct 3D star clusters / nebulas with orbiting word planets.
 * Features WASD flight, smooth click-to-warp navigation, interactive word inspection,
 * and live updates when Cluster Library changes.
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

    // Continuous Spaceship Flight (Requerimientos 7 y 8)
    this.isContinuousFlying = false;
    this.flightSpline = null;
    this.flightProgress = 0;
    this.flightDuration = 26.0;
    this.flightNodes = [];

    // Global Interconnected Neural Mesh (Requerimiento 8)
    this.neuralMeshGroup = null;

    // Hover & Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();
    this.hoveredNode = null;
    this.targetNode = null;

    // Neural Synapse Sequence (Game 3 WebSocket Sync)
    this.ws = null;
    this.synapseGroup = null;
    this.synapseCurve = null;
    this.synapseSpark = null;
    this.synapseProgress = 0;

    // Red sináptica semántica bajo demanda (sólo activa durante la RESIGNIFICACIÓN)
    this.synapseEdges = [];
    this.synapseElapsed = 0;
    this.synapseFadeTimer = null;
    this.resignificationActive = false;
    this.resignificationTargets = [];
    this.breathePhase = 0;

    // Neuronas Vivas Bio-Eléctricas & Axones Permanentes
    this.neuronMaterials = [];
    this.permanentSynapseGroup = null;
    this.actionPotentials = [];
    this.orbitingDendrites = [];

    // Órdenes al Cerebro (Sincronización con Sicre2 / Game 3)
    this.activeOrders = [];
    this.orderBridgesGroup = null;
    this.orderBridges = [];
    this.demoSequenceTimer = null;

    this.animId = null;
    this.lastTime = performance.now();

    this.init();
  }

  async init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060e, 0.0005);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 7000);
    this.camera.position.set(0, 150, 600);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x04060e, 1);
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
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
        uColorCyan: { value: new THREE.Color(0x00f0ff) },
        uColorPurple: { value: new THREE.Color(0xb026ff) },
        uColorWhite: { value: new THREE.Color(0xffffff) }
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

    // 7. WebSocket Synchronization con Game 3 (Requerimiento 6)
    this.initWebSocket();

    window.addEventListener('resize', () => this.handleResize());
  }

  createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const pos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 6000;
      pos[i + 1] = (Math.random() - 0.5) * 6000;
      pos[i + 2] = (Math.random() - 0.5) * 6000;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);
  }

  buildClusterSystems() {
    // Clear existing cluster meshes and neural mesh
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

    // Cúmulos compactos en anillo 3D con axones y neuronas bio-eléctricas
    const clusterCount = this.clustersData.length;
    const ringRadius = Math.max(140, clusterCount * 32);

    this.clustersData.forEach((cluster, idx) => {
      const angle = (idx / clusterCount) * Math.PI * 2;
      const cx = Math.cos(angle) * ringRadius;
      const cy = Math.sin(idx * 1.6) * 26;
      const cz = Math.sin(angle) * ringRadius;

      const clusterCenter = new THREE.Vector3(cx, cy, cz);
      const hexColor = parseInt(cluster.color.replace('#', '0x'), 16) || 0x00f0ff;
      const colorObj = new THREE.Color(hexColor);

      const systemGroup = new THREE.Group();
      systemGroup.position.copy(clusterCenter);

      // 1. Núcleo macro-ganglionar central (Soma maestro con vórtice bio-eléctrico)
      const coreGeo = new THREE.SphereGeometry(15, 32, 32);
      const coreMat = new THREE.ShaderMaterial({
        vertexShader: neuronVertexShader,
        fragmentShader: macroGanglionFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: colorObj },
          uCoreColor: { value: new THREE.Color(0xffffff) },
          uBreathePhase: { value: Math.random() * Math.PI * 2 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      coreMat.emissiveIntensity = 0.95;
      this.neuronMaterials.push(coreMat);

      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      systemGroup.add(coreMesh);

      // Aura de resplandor exterior
      const auraGeo = new THREE.SphereGeometry(22, 24, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        wireframe: true
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      systemGroup.add(auraMesh);

      // Título de Categoría 3D
      const titleSprite = this.createClusterTitleSprite(cluster.name, cluster.color);
      titleSprite.position.set(0, 32, 0);
      systemGroup.add(titleSprite);

      // Registrar nodo central
      const clusterNode = {
        isClusterCenter: true,
        clusterId: cluster.id,
        name: cluster.name,
        color: cluster.color,
        position: clusterCenter.clone(),
        mesh: coreMesh,
        radius: 15,
        breathePhase: Math.random() * Math.PI * 2
      };
      this.wordNodes.push(clusterNode);

      // 2. Neuronas de palabras: somas bio-eléctricos con relámpagos continuos
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

        // Geometría y Shader vivo de neurona
        const planetGeo = new THREE.SphereGeometry(4.4, 24, 24);
        const planetMat = new THREE.ShaderMaterial({
          vertexShader: neuronVertexShader,
          fragmentShader: neuronFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uBaseColor: { value: colorObj },
            uCoreColor: { value: new THREE.Color(0xe0f2fe) },
            uElectricColor: { value: new THREE.Color(0x00f0ff) },
            uBreathePhase: { value: Math.random() * Math.PI * 2 },
            uActivity: { value: 0.35 + Math.random() * 0.4 },
            uIsOrder: { value: 0.0 },
            uHover: { value: 0.0 }
          },
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        planetMat.emissiveIntensity = 0.45;
        this.neuronMaterials.push(planetMat);

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(wx, wy, wz);
        systemGroup.add(planetMesh);

        // Chispas dendríticas orbitando el soma celular
        this.attachDendriticSparks(planetMesh, colorObj);

        // Axón hacia el ganglio central
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(wx, wy, wz)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(lineGeo, lineMat);
        systemGroup.add(line);

        // Etiqueta tipográfica
        const labelSprite = this.createWordSprite(w, cluster.color);
        labelSprite.position.set(wx, wy + 8, wz);
        systemGroup.add(labelSprite);

        // Posición global de la neurona
        const worldPos = new THREE.Vector3().addVectors(clusterCenter, localPos);

        const wordNode = {
          isClusterCenter: false,
          word: w,
          clusterName: cluster.name,
          color: cluster.color,
          position: worldPos,
          localPos: localPos,
          mesh: planetMesh,
          systemGroup: systemGroup,
          radius: 4.4,
          breathePhase: Math.random() * Math.PI * 2
        };

        this.wordNodes.push(wordNode);
        clusterWordLocalNodes.push(wordNode);
      });

      // 3. Construir red sináptica permanente intra-cúmulo con potenciales de acción
      this.buildClusterAxonNetwork(systemGroup, clusterWordLocalNodes, colorObj);

      this.clustersGroup.add(systemGroup);
      this.clusterGroupMap.set(cluster.id, { center: clusterCenter, name: cluster.name, color: cluster.color });
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
      this.createAxonWithActionPotential(systemGroup, nodeA.localPos, nodeB.localPos, colorObj);

      if (n >= 4 && i % 2 === 0) {
        const crossIdx = (i + Math.floor(n / 2)) % n;
        const nodeCross = clusterWords[crossIdx];
        this.createAxonWithActionPotential(systemGroup, nodeA.localPos, nodeCross.localPos, colorObj);
      }
    }
  }

  createAxonWithActionPotential(parentGroup, posA, posB, colorObj) {
    const mid = posA.clone().lerp(posB, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    ));
    const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
    const points = curve.getPoints(16);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    parentGroup.add(line);

    // Impulso nervioso (potencial de acción) que recorre continuamente el axón
    const sparkGeo = new THREE.SphereGeometry(0.85, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
    parentGroup.add(sparkMesh);

    this.actionPotentials.push({
      mesh: sparkMesh,
      curve: curve,
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
      color: 0x00f0ff,
      size: 2.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(dendriteGeo, dendriteMat);
    planetMesh.add(points);
    this.orbitingDendrites.push({
      mesh: points,
      rotSpeed: 0.5 + Math.random() * 0.8
    });
  }

  // ============================================================================
  // RED SINÁPTICA SEMÁNTICA BAJO DEMANDA
  // Las conexiones NO están todas activas: sólo se encienden durante la
  // RESIGNIFICACIÓN SEMÁNTICA, uniendo cada palabra capturada con sus vecinas
  // más cercanas por DISTANCIA SEMÁNTICA (vectores Laya 384D).
  // ============================================================================
  disposeSynapseNetwork() {
    if (this.synapseFadeTimer) {
      clearTimeout(this.synapseFadeTimer);
      this.synapseFadeTimer = null;
    }
    if (this.synapseEdges && this.synapseEdges.length) {
      this.synapseEdges.forEach(e => {
        if (e.line) {
          if (e.line.geometry) e.line.geometry.dispose();
          if (e.mat) e.mat.dispose();
        }
        if (e.pulse) {
          if (e.pulse.geometry) e.pulse.geometry.dispose();
          if (e.pulse.material) e.pulse.material.dispose();
        }
      });
      this.synapseEdges = [];
    }
    if (this.synapseGroup) {
      this.scene.remove(this.synapseGroup);
      this.synapseGroup = null;
    }
  }

  cosineOf(a, b) {
    if (!a || !b) return null;
    let dot = 0;
    const dims = Math.min(a.length, b.length);
    for (let i = 0; i < dims; i++) dot += a[i] * b[i];
    return Math.max(-1, Math.min(1, dot));
  }

  findBestNodeForWord(word, candidates = null) {
    const list = candidates || this.wordNodes.filter(n => !n.isClusterCenter && n.mesh);
    if (!word || list.length === 0) return null;

    const normalize = (s) => String(s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ').trim();

    const clean = String(word).toLowerCase().trim();
    const target = normalize(clean);

    // 1) Coincidencia exacta normalizada
    let found = list.find(n => normalize(n.word) === target);
    if (found) return found;

    // 2) Un término frío compuesto suele contener la raíz de su palabra base
    const parts = target.split(/\s+/).filter(p => p.length > 3);
    found = list.find(n => {
      const nw = normalize(n.word);
      return parts.some(p => nw.includes(p) || p.includes(nw));
    });
    if (found) return found;

    // 3) Vecino semántico más cercano según los vectores Laya
    const baseVec = semanticEngine.getVector(clean);
    if (baseVec) {
      let best = null;
      let bestSim = -2;
      list.forEach(n => {
        const v = semanticEngine.getVector(n.word);
        if (!v) return;
        const sim = this.cosineOf(baseVec, v);
        if (sim !== null && sim > bestSim) { bestSim = sim; best = n; }
      });
      if (best && bestSim > 0.12) return best;
    }

    // 4) Último recurso: afinidad léxica por prefijo
    return list.find(n => normalize(n.word).slice(0, 4) === target.slice(0, 4)) || null;
  }

  getSemanticNeighbors(node, candidates, k = 3) {
    const baseVec = semanticEngine.getVector(node.word);
    if (!baseVec) return [];
    const scored = [];
    candidates.forEach(c => {
      if (!c || c === node || !c.mesh) return;
      const v = semanticEngine.getVector(c.word);
      if (!v) return;
      const sim = this.cosineOf(baseVec, v);
      if (sim === null) return;
      scored.push({ node: c, similarity: sim });
    });
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, k);
  }

  createSynapseEdge(nodeA, nodeB, similarity, delay) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    if (nodeA.mesh) nodeA.mesh.getWorldPosition(a); else a.copy(nodeA.position);
    if (nodeB.mesh) nodeB.mesh.getWorldPosition(b); else b.copy(nodeB.position);

    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    ));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));

    const colorA = new THREE.Color(nodeA.color || '#00f0ff');
    const colorB = new THREE.Color(nodeB.color || '#a855f7');
    const mat = new THREE.LineBasicMaterial({
      color: colorA.clone().lerp(colorB, 0.5),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.synapseGroup.add(line);

    // Chispa sináptica que recorre el axón
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    pulse.visible = false;
    this.synapseGroup.add(pulse);

    return {
      line,
      mat,
      curve,
      pulse,
      delay: Math.max(0, delay || 0),
      strength: Math.max(0.15, Math.min(1, similarity || 0.4)),
      pulseT: Math.random(),
      pulseSpeed: 0.25 + Math.random() * 0.35,
      fadingOut: false
    };
  }

  buildSemanticSynapseNetwork(humanWords = [], coldWords = []) {
    this.disposeSynapseNetwork();
    if (!this.wordNodes || this.wordNodes.length === 0) return;

    const candidates = this.wordNodes.filter(n => !n.isClusterCenter && n.mesh);
    if (candidates.length === 0) return;

    this.synapseGroup = new THREE.Group();
    this.scene.add(this.synapseGroup);
    this.synapseEdges = [];
    this.synapseElapsed = 0;

    // 1) Emparejar palabras humanas y términos fríos con nodos reales del universo
    const targets = [];
    const pushTarget = (word) => {
      const node = this.findBestNodeForWord(word, candidates);
      if (node && !targets.some(t => t.node === node)) targets.push({ node, word });
    };
    humanWords.forEach(pushTarget);
    coldWords.forEach(pushTarget);
    if (targets.length === 0) return;

    this.resignificationTargets = targets.map(t => t.node);

    // 2) Conectar cada objetivo con sus vecinos por distancia semántica
    const used = new Set();
    let edgeIndex = 0;
    targets.forEach(t => {
      let neighbors = this.getSemanticNeighbors(t.node, candidates, 3);
      if (neighbors.length === 0) {
        // Fallback sin vectores: vecinos dentro del mismo cúmulo
        neighbors = candidates
          .filter(c => c.clusterName === t.node.clusterName)
          .slice(0, 3)
          .map(c => ({ node: c, similarity: 0.3 }));
      }
      neighbors.forEach(nb => {
        if (!nb.node || nb.node === t.node) return;
        const key = [t.node.word, nb.node.word].sort().join('::');
        if (used.has(key)) return;
        used.add(key);
        this.synapseEdges.push(this.createSynapseEdge(t.node, nb.node, nb.similarity, edgeIndex * 0.12));
        edgeIndex++;
      });
    });

    // 3) Encender gradualmente los planetas objetivo
    targets.forEach(t => {
      if (t.node.mesh && t.node.mesh.material) t.node.mesh.material.emissiveIntensity = 0.6;
    });

    console.log(`[COSMOS 3D] 🧠 Red sináptica semántica: ${this.synapseEdges.length} conexiones activadas hacia ${targets.map(t => t.node.word).join(', ')}`);

    // 4) Red de seguridad: si nunca llega el reset, apagar de todos modos
    this.synapseFadeTimer = setTimeout(() => this.fadeOutSynapseNetwork(), 45000);
  }

  fadeOutSynapseNetwork() {
    this.resignificationActive = false;
    this.resignificationTargets = [];
    if (!this.synapseEdges || this.synapseEdges.length === 0) {
      this.disposeSynapseNetwork();
      return;
    }
    if (this.synapseFadeTimer) {
      clearTimeout(this.synapseFadeTimer);
      this.synapseFadeTimer = null;
    }
    this.synapseEdges.forEach(e => { e.fadingOut = true; });
    this.synapseFadeTimer = setTimeout(() => this.disposeSynapseNetwork(), 1600);
  }

  updateSynapseNetwork(dt, now) {
    if (!this.synapseEdges || this.synapseEdges.length === 0) return;
    this.synapseElapsed += dt / 1000;

    this.synapseEdges.forEach(e => {
      if (e.fadingOut) {
        e.mat.opacity = Math.max(0, e.mat.opacity - dt * 0.0022);
      } else {
        const t = Math.max(0, Math.min(1, (this.synapseElapsed - e.delay) / 0.8));
        const flicker = 0.55 + 0.45 * Math.sin(now * 0.006 + e.delay * 12);
        const targetOpacity = t * (0.25 + 0.65 * e.strength) * flicker;
        e.mat.opacity = THREE.MathUtils.lerp(e.mat.opacity, targetOpacity, 0.18);
      }

      if (e.pulse) {
        const visible = !e.fadingOut && this.synapseElapsed > e.delay + 0.3;
        e.pulse.visible = visible;
        if (visible) {
          e.pulseT = (e.pulseT + (dt / 1000) * e.pulseSpeed) % 1;
          e.pulse.position.copy(e.curve.getPoint(e.pulseT));
          const s = 0.8 + e.strength * 1.4;
          e.pulse.scale.set(s, s, s);
          e.pulse.material.opacity = 0.85 * Math.sin(e.pulseT * Math.PI);
        }
      }
    });
  }

  // Respiración neuronal: los planetas se van PRENDIENDO y APAGANDO
  updateNodeBreathing(dt, now) {
    if (!this.wordNodes) return;
    this.breathePhase += dt * 0.001;
    const isTarget = (n) => this.resignificationTargets.includes(n);

    for (const n of this.wordNodes) {
      if (!n.mesh || !n.mesh.material) continue;
      if (n === this.hoveredNode || n === this.targetNode) continue;
      const base = isTarget(n) ? 1.3 : 0.40;
      const amp = isTarget(n) ? 1.0 : 0.30;
      const target = base + amp * (0.5 + 0.5 * Math.sin(this.breathePhase * 1.3 + (n.breathePhase || 0)));
      n.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(n.mesh.material.emissiveIntensity || base, target, 0.05);
    }
  }

  createClusterTitleSprite(titleText, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(6, 10, 24, 0.88)';
    ctx.strokeStyle = colorHex || '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = colorHex || '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillText(`🌌 ${titleText.toUpperCase()}`, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(120, 30, 1);
    return sprite;
  }

  createWordSprite(wordText, colorHex) {
    const text = String(wordText || '').trim();

    // Medición exacta del ancho del texto para un contenedor perfectamente ajustado
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold 22px "Inter", sans-serif';
    const textMetrics = measureCtx.measureText(text);
    const textWidth = Math.max(24, Math.ceil(textMetrics.width));

    // Márgenes dinámicos proporcionales alrededor de la palabra
    const padX = 22;
    const canvasWidth = Math.max(80, textWidth + padX * 2);
    const canvasHeight = 52;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Cápsula bio-eléctrica cyberpunk
    ctx.fillStyle = 'rgba(8, 14, 28, 0.84)';
    ctx.strokeStyle = colorHex || '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvasWidth - 8, canvasHeight - 8, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1f5f9';
    ctx.shadowColor = colorHex || '#a855f7';
    ctx.shadowBlur = 6;
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);

    // Escala física en el mundo 3D proporcional a la palabra (las cortas no quedan gigantes y las largas no se cortan)
    const worldHeight = 8.5;
    const worldWidth = (canvasWidth / canvasHeight) * worldHeight;
    sprite.scale.set(worldWidth, worldHeight, 1);
    return sprite;
  }

  updateClusterNavButtons() {
    // Requerimiento 2: La barra superior de botones de categorías fue eliminada
    const bar = document.getElementById('cluster-3d-nav-bar');
    if (bar) bar.innerHTML = '';
  }

  warpToCluster(clusterId) {
    const info = this.clusterGroupMap.get(clusterId);
    if (!info) return;

    const targetPos = info.center.clone();
    const camPos = this.camera.position.clone();
    const toCenter = new THREE.Vector3().subVectors(targetPos, camPos).normalize();

    // Stand 180 units in front of cluster center
    this.warpTarget.copy(targetPos).sub(toCenter.multiplyScalar(180));
    this.warpTargetYaw = Math.atan2(-toCenter.x, -toCenter.z);
    this.warpTargetPitch = Math.asin(Math.max(-0.99, Math.min(0.99, toCenter.y)));

    this.isWarping = true;
    this.warpProgress = 0;
    soundFX.playActivate();
  }

  warpToNode(node) {
    if (!node) return;
    const targetPos = new THREE.Vector3();
    if (node.mesh) {
      node.mesh.getWorldPosition(targetPos);
    } else if (node.position) {
      targetPos.copy(node.position);
    } else {
      return;
    }

    const camPos = this.camera.position.clone();
    const toNode = new THREE.Vector3().subVectors(targetPos, camPos);
    const dist = toNode.length();

    if (dist < 0.001) {
      toNode.set(0, 0, 1);
    } else {
      toNode.normalize();
    }

    const standoff = node.isClusterCenter ? 120 : 40;
    this.warpTarget.copy(targetPos).sub(toNode.clone().multiplyScalar(standoff));
    this.warpTargetYaw = Math.atan2(-toNode.x, -toNode.z);
    this.warpTargetPitch = Math.asin(Math.max(-0.999, Math.min(0.999, toNode.y)));

    // Si había un nodo anterior encendido, restaurar su brillo original
    if (this.targetNode && this.targetNode !== node && this.targetNode.mesh && this.targetNode.mesh.material) {
      this.targetNode.mesh.material.emissiveIntensity = this.targetNode.mesh.material._origEmissiveIntensity ?? (this.targetNode.isClusterCenter ? 0.95 : 0.45);
    }

    this.isWarping = true;
    this.warpProgress = 0;
    this.targetNode = node;
    soundFX.playActivate();

    // REQUERIMIENTO 8: El planeta destino se enciende radiantemente
    if (node.mesh && node.mesh.material) {
      if (node.mesh.material._origEmissiveIntensity === undefined) {
        node.mesh.material._origEmissiveIntensity = node.mesh.material.emissiveIntensity;
      }
      node.mesh.material.emissiveIntensity = 3.4;
    }

    // Acoplar aura de shader de rayos eléctricos
    if (this.electricSphere) {
      this.electricSphere.position.copy(targetPos);
      const radius = node.radius || (node.isClusterCenter ? 15 : 4.2);
      const scale = radius * 1.35;
      this.electricSphere.scale.set(scale, scale, scale);
      this.electricSphere.visible = true;
    }

    this.updateHUD(node);
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code in this.keys) {
        this.keys[e.code] = true;
        this.isContinuousFlying = false; // El usuario toma el control manual
      }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey) {
        this.toggleFullscreen();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in this.keys) this.keys[e.code] = false;
    });

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.isContinuousFlying = false; // El arrastre del mouse toma el control manual
        this.lastMouse = { x: e.clientX, y: e.clientY };
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
        this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
        this.lastMouse = { x: e.clientX, y: e.clientY };
      } else {
        this.checkRaycastHover(e);
      }
    });

    dom.addEventListener('click', (e) => {
      const hitNode = this.getRaycastNode(e);
      if (hitNode) {
        this.isContinuousFlying = false;
        this.warpToNode(hitNode);
      }
    });

    // REQUERIMIENTO 9: Botón de pantalla completa para el universo 3D
    const fsBtn = document.getElementById('btn-fullscreen-cluster-cosmos');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    // Botones de Órdenes Cerebrales (HUD)
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

    // Escucha de órdenes de pensamiento cross-tab (Sicre2 / Game 3 <-> Universo 3D)
    window.addEventListener('storage', (e) => {
      if (e.key === 'sincretismo_orders_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === 'game3:words_sequence') {
            if (data.phase === 'word_caught') {
              const wordToCatch = data.newWord || (Array.isArray(data.words) ? data.words[data.words.length - 1] : null);
              this.handleGame3OrderWord(wordToCatch, data.orderIndex, data.totalOrders || 3);
            } else if (data.phase === 'resignification') {
              this.handleGame3Resignification(data.words, data.coldWords || [], data.phrase || '');
            } else if (Array.isArray(data.words) && data.words.length > 0) {
              data.words.forEach((w, idx) => {
                this.handleGame3OrderWord(w, idx + 1, data.words.length);
              });
              const coldWords = Array.isArray(data.coldWords) ? data.coldWords : [];
              this.playNeuralSynapseSequence(data.words, coldWords);
            }
          } else if (data.type === 'game3:state_reset' || data.type === 'game3:flight_reset') {
            this.resetOrders();
            this.warpToOverview();
          }
        } catch (err) {}
      }
    });

    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => this.handleResize(), 150);
    });
  }

  toggleFullscreen() {
    const elem = this.container || document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  getRaycastNode(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const meshes = this.wordNodes.map(n => n.mesh);
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
        if (this.hoveredNode && this.hoveredNode !== this.targetNode && this.hoveredNode.mesh && this.hoveredNode.mesh.material) {
          this.hoveredNode.mesh.material.emissiveIntensity = this.hoveredNode.mesh.material._origEmissiveIntensity ?? (this.hoveredNode.isClusterCenter ? 0.95 : 0.45);
          if (this.hoveredNode.mesh.material.uniforms && this.hoveredNode.mesh.material.uniforms.uHover) {
            this.hoveredNode.mesh.material.uniforms.uHover.value = 0.0;
          }
        }
        this.hoveredNode = hitNode;
        soundFX.playHover();
      }
      this.renderer.domElement.style.cursor = 'pointer';
      this.updateHUD(hitNode);

      // Shader de rayos eléctricos en hover
      if (this.electricSphere && hitNode.mesh) {
        const worldPos = new THREE.Vector3();
        hitNode.mesh.getWorldPosition(worldPos);
        this.electricSphere.position.copy(worldPos);
        const radius = hitNode.radius || (hitNode.isClusterCenter ? 15 : 4.4);
        const scale = radius * 1.25;
        this.electricSphere.scale.set(scale, scale, scale);
        this.electricSphere.visible = true;
      }
      if (hitNode.mesh && hitNode.mesh.material) {
        if (hitNode !== this.targetNode) {
          if (hitNode.mesh.material._origEmissiveIntensity === undefined) {
            hitNode.mesh.material._origEmissiveIntensity = hitNode.mesh.material.emissiveIntensity;
          }
          hitNode.mesh.material.emissiveIntensity = hitNode.isClusterCenter ? 1.7 : 1.3;
        }
        if (hitNode.mesh.material.uniforms && hitNode.mesh.material.uniforms.uHover) {
          hitNode.mesh.material.uniforms.uHover.value = 1.0;
        }
      }
    } else {
      if (this.hoveredNode) {
        if (this.hoveredNode !== this.targetNode && this.hoveredNode.mesh && this.hoveredNode.mesh.material) {
          this.hoveredNode.mesh.material.emissiveIntensity = this.hoveredNode.mesh.material._origEmissiveIntensity ?? (this.hoveredNode.isClusterCenter ? 0.95 : 0.45);
        }
        if (this.hoveredNode.mesh && this.hoveredNode.mesh.material && this.hoveredNode.mesh.material.uniforms && this.hoveredNode.mesh.material.uniforms.uHover) {
          this.hoveredNode.mesh.material.uniforms.uHover.value = 0.0;
        }
        this.hoveredNode = null;
        this.renderer.domElement.style.cursor = 'grab';
        this.updateHUD(this.targetNode);
        if (this.electricSphere && !this.isWarping) {
          this.electricSphere.visible = false;
        }
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
          targetEl.textContent = `CATEGORÍA: ${node.name.toUpperCase()}`;
          targetEl.style.color = node.color || '#00f0ff';
        } else {
          targetEl.textContent = `${node.word.toUpperCase()} [${node.clusterName}]`;
          targetEl.style.color = node.color || '#a855f7';
        }
      } else {
        targetEl.textContent = 'Ninguno (Haz clic para volar)';
        targetEl.style.color = '#94a3b8';
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

  update(dt, now) {
    // Actualizar animación del shader de rayos eléctricos
    if (this.electricMaterial) {
      this.electricMaterial.uniforms.uTime.value = now * 0.001;
    }

    // Actualizar shaders neuronales bio-eléctricos continuos en todas las partículas
    if (this.neuronMaterials && this.neuronMaterials.length > 0) {
      const timeSec = now * 0.001;
      for (let i = 0; i < this.neuronMaterials.length; i++) {
        this.neuronMaterials[i].uniforms.uTime.value = timeSec;
      }
    }

    // Actualizar impulsos en axones permanentes
    this.updateActionPotentials(dt, now);

    // Actualizar chispas dendríticas orbitantes
    this.updateDendriticSparks(dt, now);

    // Actualizar puentes de relámpago entre órdenes cerebrales
    this.updateOrderBridges(dt, now);

    // Red sináptica semántica (sólo existe durante la RESIGNIFICACIÓN SEMÁNTICA)
    this.updateSynapseNetwork(dt, now);

    if (this.isContinuousFlying && this.flightSpline) {
      // Vuelo cinemático continuo estilo nave espacial recorriendo neuronas
      this.flightProgress += (dt / 1000) / this.flightDuration;

      if (this.flightProgress >= 1.0) {
        // Al culminar el recorrido, vuelve a la vista panorámica del cluster 3D
        this.warpToOverview();
        return;
      }

      const pCurrent = this.flightSpline.getPoint(Math.min(0.999, this.flightProgress));
      const lookT = Math.min(1.0, this.flightProgress + 0.025);
      const pLookAhead = this.flightSpline.getPoint(lookT);

      // Posicionamiento de la nave/cámara
      this.camera.position.copy(pCurrent);
      this.camera.lookAt(pLookAhead);

      // Inclinación espacial / alabeo (banking roll)
      const tan1 = this.flightSpline.getTangent(Math.min(0.999, this.flightProgress));
      const tan2 = this.flightSpline.getTangent(lookT);
      const bankVector = tan1.clone().cross(tan2);
      const targetRoll = THREE.MathUtils.clamp(-bankVector.y * 22.0, -0.40, 0.40);
      this.roll = THREE.MathUtils.lerp(this.roll || 0, targetRoll, 0.08);
      this.camera.rotation.z = this.roll;

      this.yaw = this.camera.rotation.y;
      this.pitch = this.camera.rotation.x;

      // Iluminación dinámica ("Prendido y Apagado") de cada palabra según la proximidad de la cámara
      if (this.flightNodes && this.flightNodes.length > 0) {
        const camPos = this.camera.position;
        let closestIdx = 0;
        let minD = 999999;

        this.flightNodes.forEach((node, idx) => {
          if (!node || !node.mesh) return;
          const nodePos = new THREE.Vector3();
          node.mesh.getWorldPosition(nodePos);
          const d = camPos.distanceTo(nodePos);
          if (d < minD) {
            minD = d;
            closestIdx = idx;
          }

          // Rango de encendido: a menos de 85 unidades se va PRENDIENDO progresivamente
          // Al alejarse se va APAGANDO de vuelta al estado base
          const lightRadius = 85.0;
          if (d < lightRadius) {
            const factor = Math.pow(1.0 - (d / lightRadius), 1.5);
            if (node.mesh.material) {
              node.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 3.8, factor);
            }
            const sc = THREE.MathUtils.lerp(1.0, 2.5, factor);
            node.mesh.scale.set(sc, sc, sc);
          } else {
            if (node.mesh.material) {
              node.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(node.mesh.material.emissiveIntensity || 0.45, 0.45, 0.1);
            }
            node.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
        });

        const activeWordNode = this.flightNodes[closestIdx];
        if (activeWordNode) {
          const hudTarget = document.getElementById('cluster-hud-target');
          if (hudTarget) {
            hudTarget.textContent = `🚀 EXPLORANDO NODO // [0${closestIdx + 1}/03]: ${activeWordNode.word.toUpperCase()} [${activeWordNode.clusterName}]`;
            hudTarget.style.color = '#00f0ff';
          }
        }
      }
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

        // REQUERIMIENTO 8: Mantener el planeta destino encendido con pulso energético y shader de rayos
        if (this.targetNode.mesh && this.targetNode.mesh.material) {
          this.targetNode.mesh.material.emissiveIntensity = 2.4 + Math.sin(now * 0.015) * 1.0;
        }
        if (this.electricSphere) {
          this.electricSphere.position.copy(currentPos);
          const radius = this.targetNode.radius || (this.targetNode.isClusterCenter ? 15 : 4.2);
          const pulseScale = radius * (1.28 + Math.sin(now * 0.012) * 0.12);
          this.electricSphere.scale.set(pulseScale, pulseScale, pulseScale);
          this.electricSphere.visible = true;
        }
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

        // Estabilizar el brillo encendido al culminar el viaje
        if (this.targetNode && this.targetNode.mesh && this.targetNode.mesh.material) {
          this.targetNode.mesh.material.emissiveIntensity = 1.35;
        }
        if (this.electricSphere && !this.hoveredNode) {
          this.electricSphere.visible = false;
        }
      }
    } else {
      // Seguimiento de planeta en hover cuando no está en warp
      if (this.hoveredNode && this.hoveredNode.mesh && this.electricSphere && this.electricSphere.visible) {
        const worldPos = new THREE.Vector3();
        this.hoveredNode.mesh.getWorldPosition(worldPos);
        this.electricSphere.position.copy(worldPos);
      }
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
        // REQUERIMIENTO 7: La cámara siempre se está moviendo (deriva cósmica continua de patrullaje)
        this.camera.position.x += Math.sin(now * 0.00028) * 0.16;
        this.camera.position.y += Math.cos(now * 0.00022) * 0.09;
        this.camera.position.z += Math.cos(now * 0.00018) * 0.16;
      }

      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
    }

    // Rotación suave de las órbitas planetarias
    if (this.clustersGroup) {
      this.clustersGroup.children.forEach((systemGroup, idx) => {
        systemGroup.rotation.y = now * 0.00015 * (idx % 2 === 0 ? 1 : -1);
      });
    }

    // Planetas prendiéndose y apagándose (respiración neuronal)
    if (!this.isContinuousFlying && !this.isWarping) {
      this.updateNodeBreathing(dt, now);
    }

    this.updateHUD(this.hoveredNode || this.targetNode);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ============================================================================
  // SINCRONIZACIÓN WEBSOCKET & VIAJE NEURAL (GAME 3 <-> UNIVERSO 3D)
  // Requerimientos 7 y 8: Navegación continua a través de las 3 palabras
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
            } else if (msg.phase === 'resignification') {
              this.handleGame3Resignification(msg.words, msg.coldWords || [], msg.phrase || '');
            } else if (Array.isArray(msg.words) && msg.words.length > 0) {
              msg.words.forEach((w, idx) => {
                this.handleGame3OrderWord(w, idx + 1, msg.words.length);
              });
              const coldWords = Array.isArray(msg.coldWords) ? msg.coldWords : [];
              this.playNeuralSynapseSequence(msg.words, coldWords);
            }
          } else if (msg.type === 'game3:state_reset' || msg.type === 'game3:flight_reset') {
            console.log('[COSMOS 3D] 🔄 Evento reset recibido de Game 3. Volviendo a vista panorámica.');
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

  playNeuralSynapseSequence(words, coldWords = []) {
    if (!this.wordNodes || this.wordNodes.length === 0) return;

    // Asegurar que el bucle de animación 3D esté activo
    this.start();

    // Si la interfaz general tiene el botón de la pestaña Universo 3D, activarlo
    const navBtn = document.getElementById('tab-cosmos-clusters-btn');
    if (navBtn && !navBtn.classList.contains('active')) {
      navBtn.click();
    }

    // ENCENDER LA RED SINÁPTICA SEMÁNTICA (sólo durante la resignificación)
    this.resignificationActive = true;
    this.buildSemanticSynapseNetwork(words, coldWords);

    // 1. Localizar los nodos correspondientes en el espacio 3D
    const matchedNodes = [];
    words.forEach(w => {
      const clean = String(w).trim().toLowerCase();
      let found = this.wordNodes.find(n => !n.isClusterCenter && n.word && n.word.toLowerCase() === clean);
      if (!found) {
        found = this.wordNodes.find(n => !n.isClusterCenter && n.word && (n.word.toLowerCase().includes(clean) || clean.includes(n.word.toLowerCase())));
      }
      if (found && !matchedNodes.includes(found)) {
        matchedNodes.push(found);
      }
    });

    // Fallback: Si alguna palabra no está presente, completar con nodos existentes del universo
    if (matchedNodes.length < 3) {
      const available = this.wordNodes.filter(n => !n.isClusterCenter && !matchedNodes.includes(n));
      while (matchedNodes.length < 3 && available.length > 0) {
        matchedNodes.push(available.shift());
      }
    }

    if (matchedNodes.length === 0) return;

    // 2. Preparar los nodos para iluminación dinámica conforme la cámara se acerque
    matchedNodes.forEach(n => {
      if (n.mesh && n.mesh.material) {
        n.mesh.material.emissiveIntensity = 0.45;
        n.mesh.scale.set(1.0, 1.0, 1.0);
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

    // Puntos puente intermedios para la curvatura del vuelo cinemático (sin dibujar caminos)
    const mid01 = p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 35,
      18 + Math.random() * 18,
      (Math.random() - 0.5) * 35
    ));
    const mid12 = p1.clone().lerp(p2, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 35,
      -18 - Math.random() * 14,
      (Math.random() - 0.5) * 35
    ));

    // 3. Construir trayectoria de vuelo cinemático continuo entre palabras
    const flightPoints = [];
    flightPoints.push(this.camera.position.clone());

    // Aproximación suave hacia Palabra 1
    const dir0 = p0.clone().sub(this.camera.position).normalize();
    flightPoints.push(this.camera.position.clone().lerp(p0, 0.45).add(new THREE.Vector3(0, 22, 0)));
    flightPoints.push(p0.clone().add(new THREE.Vector3(-dir0.z * 30, 8, dir0.x * 30)));

    // Transición continua hacia Palabra 2 pasando por el puente inter-cúmulo
    flightPoints.push(mid01);
    const dir1 = p1.clone().sub(mid01).normalize();
    flightPoints.push(p1.clone().add(new THREE.Vector3(-dir1.z * 26, 8, dir1.x * 26)));

    // Transición continua hacia Palabra 3
    flightPoints.push(mid12);
    const dir2 = p2.clone().sub(mid12).normalize();
    flightPoints.push(p2.clone().add(new THREE.Vector3(-dir2.z * 26, 8, dir2.x * 26)));

    // Salida fluida hacia órbita panorámica global
    flightPoints.push(p2.clone().add(new THREE.Vector3(25, 40, 25)));
    flightPoints.push(new THREE.Vector3(0, 140, 340));
    flightPoints.push(new THREE.Vector3(200, 150, 160));
    flightPoints.push(new THREE.Vector3(0, 160, -250));
    flightPoints.push(new THREE.Vector3(-200, 140, 150));
    flightPoints.push(new THREE.Vector3(0, 140, 340));

    this.flightSpline = new THREE.CatmullRomCurve3(flightPoints, false);
    this.isContinuousFlying = true;
    this.flightProgress = 0.0;
    this.flightDuration = 26.0;
    this.flightNodes = matchedNodes;

    soundFX.playActivate();
  }

  warpToOverview() {
    this.isContinuousFlying = false;
    this.flightSpline = null;

    // Resetear todos los nodos de palabras de vuelta a su escala y luminosidad base
    if (this.flightNodes && this.flightNodes.length > 0) {
      this.flightNodes.forEach(n => {
        if (n && n.mesh) {
          if (n.mesh.material) n.mesh.material.emissiveIntensity = 0.45;
          n.mesh.scale.set(1.0, 1.0, 1.0);
        }
      });
      this.flightNodes = [];
    }

    this.fadeOutSynapseNetwork();

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
      hudTarget.style.color = '#00f0ff';
    }
  }

  // ============================================================================
  // POTENCIALES DE ACCIÓN, CHISPAS DENDRÍTICAS Y PUENTES DE RELÁMPAGO
  // ============================================================================
  updateActionPotentials(dt, now) {
    if (!this.actionPotentials || this.actionPotentials.length === 0) return;
    const delta = dt / 1000;
    for (let i = 0; i < this.actionPotentials.length; i++) {
      const ap = this.actionPotentials[i];
      ap.progress = (ap.progress + delta * ap.speed) % 1.0;
      const pt = ap.curve.getPoint(ap.progress);
      ap.mesh.position.copy(pt);
      const alpha = Math.sin(ap.progress * Math.PI);
      ap.mesh.material.opacity = 0.25 + alpha * 0.75;
    }
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

  // ============================================================================
  // ÓRDENES AL CEREBRO & SINCRETISMO SINÁPTICO (SICRE2 <-> CÚMULO 3D)
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

    console.log(`[COSMOS 3D] 🧠 ÓRDEN #${slot} REGISTRADA: "${cleanWord}" (total: ${totalOrders})`);

    // Buscar nodo en el universo 3D
    const candidates = this.wordNodes.filter(n => !n.isClusterCenter && n.mesh);
    const node = this.findBestNodeForWord(cleanWord, candidates);

    // Limpiar si ya había orden en ese slot
    const existingIdx = this.activeOrders.findIndex(o => o.orderIndex === slot);
    if (existingIdx !== -1) {
      const prev = this.activeOrders[existingIdx];
      if (prev.badge) this.scene.remove(prev.badge);
      if (prev.node && prev.node.mesh && prev.node.mesh.material && prev.node.mesh.material.uniforms) {
        prev.node.mesh.material.uniforms.uIsOrder.value = 0.0;
        prev.node.mesh.material.uniforms.uActivity.value = 0.35;
      }
      this.activeOrders.splice(existingIdx, 1);
    }

    let badgeSprite = null;
    if (node) {
      // Encender shader bio-eléctrico a nivel ÓRDEN SUPREMA
      if (node.mesh && node.mesh.material && node.mesh.material.uniforms) {
        node.mesh.material.uniforms.uIsOrder.value = 1.0;
        node.mesh.material.uniforms.uActivity.value = 1.0;
      }

      // Crear insignia holográfica 3D sobre la neurona
      badgeSprite = this.createOrder3DBadge(node, slot, cleanWord);
      this.scene.add(badgeSprite);

      // Conectar puente de relámpago con la orden previa
      if (this.activeOrders.length > 0) {
        const prevOrder = this.activeOrders[this.activeOrders.length - 1];
        if (prevOrder.node) {
          this.createOrderLightningBridge(prevOrder.node, node);
        }
      }

      // Si es la 3era orden, cerrar el circuito conectando la orden 3 con la orden 1
      if (slot === 3 && this.activeOrders.length >= 2) {
        const firstOrder = this.activeOrders.find(o => o.orderIndex === 1);
        if (firstOrder && firstOrder.node) {
          this.createOrderLightningBridge(node, firstOrder.node);
        }
      }

      // Vuelo suave hacia la neurona estimulada
      this.warpToNode(node);
    }

    this.activeOrders.push({
      orderIndex: slot,
      word: cleanWord,
      node: node,
      badge: badgeSprite
    });

    // Actualizar HUD visual en la interfaz
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
        statusEl.innerHTML = `<span style="color:#00f0ff;">⚡ ÓRDEN #1 ASIMILADA:</span> "${word.toUpperCase()}" // Despolarizando axones receptores...`;
      } else if (slot === 2) {
        statusEl.innerHTML = `<span style="color:#00f0ff;">⚡ ÓRDEN #2 ASIMILADA:</span> "${word.toUpperCase()}" // Puente sináptico 1 ➔ 2 forjado. Conectando potencial...`;
      } else if (slot === 3) {
        statusEl.innerHTML = `<span style="color:#00ffaa;">🧠 CIRCUITO DE 3 ÓRDENES CERRADO:</span> "${word.toUpperCase()}" // Sintetizando pensamiento cognitivo...`;
      }
    }
  }

  createOrder3DBadge(node, orderIndex, wordText) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    // Fondo vidrio cyberpunk con resplandor dorado/cian
    ctx.fillStyle = 'rgba(6, 10, 24, 0.92)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 18);
    ctx.fill();
    ctx.stroke();

    // Franja de título superior
    ctx.font = 'bold 22px "Inter", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`⚡ ÓRDEN CEREBRAL #0${orderIndex} // SICRE2`, canvas.width / 2, 42);

    // Palabra central destacada
    ctx.font = '900 42px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
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
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.orderBridgesGroup.add(line);

    // Pulso de plasma brillante que recorre el puente
    const pulseGeo = new THREE.SphereGeometry(2.4, 10, 10);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
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
      const cleanPhrase = phrase || `Las órdenes [${(words || []).join(', ').toUpperCase()}] transformaron el citoesqueleto neuronal. La IA sintetiza una nueva realidad perceptual.`;
      speechText.textContent = `"${cleanPhrase}"`;
    }

    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#ffd700;">✨ TRANSFORMACIÓN COGNITIVA COMPLETADA //</span> Red neuronal en alta coherencia sináptica.`;
    }

    if (words && words.length > 0) {
      this.playNeuralSynapseSequence(words, coldWords);
    }
  }

  resetOrders() {
    if (this.demoSequenceTimer) {
      clearTimeout(this.demoSequenceTimer);
      this.demoSequenceTimer = null;
    }

    if (this.activeOrders && this.activeOrders.length > 0) {
      this.activeOrders.forEach(o => {
        if (o.badge) this.scene.remove(o.badge);
        if (o.node && o.node.mesh && o.node.mesh.material && o.node.mesh.material.uniforms) {
          o.node.mesh.material.uniforms.uIsOrder.value = 0.0;
          o.node.mesh.material.uniforms.uActivity.value = 0.35;
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
      statusEl.textContent = 'Esperando que el usuario active palabras en Sicre2 (o presiona "Simular Órdenes")...';
    }

    const speechBox = document.getElementById('orders-speech-box');
    if (speechBox) speechBox.style.display = 'none';

    this.fadeOutSynapseNetwork();
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

    const speechSample = `El modelo neuronal procesa los impulsos [${sampleWords.join(' • ')}]. La despolarización sináptica reconfigura la matriz conceptual del silicio.`;

    const statusEl = document.getElementById('orders-hud-status');
    if (statusEl) statusEl.textContent = '⚡ Iniciando simulación de órdenes cerebrales...';

    setTimeout(() => {
      this.handleGame3OrderWord(sampleWords[0], 1, 3);
    }, 400);

    setTimeout(() => {
      this.handleGame3OrderWord(sampleWords[1], 2, 3);
    }, 1800);

    setTimeout(() => {
      this.handleGame3OrderWord(sampleWords[2], 3, 3);
    }, 3200);

    this.demoSequenceTimer = setTimeout(() => {
      this.handleGame3Resignification(sampleWords, [], speechSample);
    }, 4600);
  }
}
