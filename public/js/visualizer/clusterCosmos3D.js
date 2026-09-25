import * as THREE from '../libs/three.module.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { clusterManager } from '../engine/clusterManager.js';
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

    this.clustersGroup = new THREE.Group();
    this.wordNodes = [];
    this.clusterGroupMap.clear();

    if (!this.clustersData || this.clustersData.length === 0) {
      this.scene.add(this.clustersGroup);
      return;
    }

    // REQUERIMIENTO 8: Cúmulos MUCHO MÁS cerca (~200-240 unidades en vez de >1200)
    const clusterCount = this.clustersData.length;
    const ringRadius = Math.max(140, clusterCount * 32);

    this.clustersData.forEach((cluster, idx) => {
      // Posición central compacta en anillo 3D
      const angle = (idx / clusterCount) * Math.PI * 2;
      const cx = Math.cos(angle) * ringRadius;
      const cy = Math.sin(idx * 1.6) * 26;
      const cz = Math.sin(angle) * ringRadius;

      const clusterCenter = new THREE.Vector3(cx, cy, cz);
      const hexColor = parseInt(cluster.color.replace('#', '0x'), 16) || 0x00f0ff;
      const colorObj = new THREE.Color(hexColor);

      const systemGroup = new THREE.Group();
      systemGroup.position.copy(clusterCenter);

      // 1. Núcleo central estelar
      const coreGeo = new THREE.SphereGeometry(15, 24, 24);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorObj,
        emissive: colorObj,
        emissiveIntensity: 0.95,
        roughness: 0.2
      });
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
        radius: 15
      };
      this.wordNodes.push(clusterNode);

      // 2. Planetas de palabras en órbitas más densas y entrelazadas
      const words = cluster.words || [];
      const wordCount = words.length;
      const orbitRadiusStep = Math.max(34, Math.min(75, wordCount * 4.5));

      words.forEach((w, wIdx) => {
        const wAngle = (wIdx / Math.max(1, wordCount)) * Math.PI * 2 + (idx * 0.4);
        const elevation = (Math.sin(wIdx * 2.2) * 22);
        const radius = orbitRadiusStep + (Math.cos(wIdx * 1.8) * 14);

        const wx = Math.cos(wAngle) * radius;
        const wy = elevation;
        const wz = Math.sin(wAngle) * radius;

        const planetGeo = new THREE.SphereGeometry(4.2, 16, 16);
        const planetMat = new THREE.MeshStandardMaterial({
          color: colorObj,
          emissive: colorObj,
          emissiveIntensity: 0.45,
          roughness: 0.3
        });

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(wx, wy, wz);
        systemGroup.add(planetMesh);

        // Línea conectora al núcleo del cúmulo
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(wx, wy, wz)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.25
        });
        const line = new THREE.Line(lineGeo, lineMat);
        systemGroup.add(line);

        // Etiqueta tipográfica
        const labelSprite = this.createWordSprite(w, cluster.color);
        labelSprite.position.set(wx, wy + 8, wz);
        systemGroup.add(labelSprite);

        // Posición global de la palabra
        const worldPos = new THREE.Vector3().addVectors(clusterCenter, new THREE.Vector3(wx, wy, wz));

        const wordNode = {
          isClusterCenter: false,
          word: w,
          clusterName: cluster.name,
          color: cluster.color,
          position: worldPos,
          localPos: new THREE.Vector3(wx, wy, wz),
          mesh: planetMesh,
          systemGroup: systemGroup,
          radius: 4.2
        };

        this.wordNodes.push(wordNode);
      });

      this.clustersGroup.add(systemGroup);
      this.clusterGroupMap.set(cluster.id, { center: clusterCenter, name: cluster.name, color: cluster.color });
    });

    this.scene.add(this.clustersGroup);

    // REQUERIMIENTO 8: Construir la red interconectada global de neuronas y sinapsis
    this.buildInterconnectedNeuralMesh();
  }

  // ============================================================================
  // RED NEURONAL INTERCONECTADA (MALLA DE SINAPSIS CÓSMICA)
  // Requerimiento 8: Conexiones entre todas las palabras dentro y entre categorías
  // ============================================================================
  buildInterconnectedNeuralMesh() {
    if (this.neuralMeshGroup) {
      this.scene.remove(this.neuralMeshGroup);
    }
    this.neuralMeshGroup = new THREE.Group();

    const points = [];
    const colors = [];
    const onlyWords = this.wordNodes.filter(n => !n.isClusterCenter);

    // 1. Conexiones intra-cúmulo (anillo sináptico dentro de la categoría)
    for (let i = 0; i < onlyWords.length; i++) {
      const nodeA = onlyWords[i];
      for (let j = i + 1; j < onlyWords.length; j++) {
        const nodeB = onlyWords[j];
        if (nodeA.clusterName === nodeB.clusterName) {
          const dist = nodeA.position.distanceTo(nodeB.position);
          if (dist < 50) {
            points.push(nodeA.position.x, nodeA.position.y, nodeA.position.z);
            points.push(nodeB.position.x, nodeB.position.y, nodeB.position.z);
            const cA = new THREE.Color(nodeA.color || '#00f0ff');
            const cB = new THREE.Color(nodeB.color || '#a855f7');
            colors.push(cA.r, cA.g, cA.b, cB.r, cB.g, cB.b);
          }
        }
      }
    }

    // 2. Conexiones inter-cúmulos (axones conectando categorías contiguas)
    for (let i = 0; i < onlyWords.length; i++) {
      const nodeA = onlyWords[i];
      let closestOther = null;
      let minDist = 140;
      for (let j = 0; j < onlyWords.length; j++) {
        const nodeB = onlyWords[j];
        if (nodeA.clusterName !== nodeB.clusterName) {
          const dist = nodeA.position.distanceTo(nodeB.position);
          if (dist < minDist) {
            minDist = dist;
            closestOther = nodeB;
          }
        }
      }
      if (closestOther) {
        points.push(nodeA.position.x, nodeA.position.y, nodeA.position.z);
        points.push(closestOther.position.x, closestOther.position.y, closestOther.position.z);
        const cA = new THREE.Color(nodeA.color || '#00f0ff');
        const cB = new THREE.Color(closestOther.color || '#ff0055');
        colors.push(cA.r, cA.g, cA.b, cB.r, cB.g, cB.b);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    const meshLines = new THREE.LineSegments(geo, mat);
    this.neuralMeshGroup.add(meshLines);
    this.scene.add(this.neuralMeshGroup);
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
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(10, 16, 32, 0.75)';
    ctx.strokeStyle = colorHex || '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(wordText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(40, 10, 1);
    return sprite;
  }

  updateClusterNavButtons() {
    const bar = document.getElementById('cluster-3d-nav-bar');
    if (!bar) return;

    if (!this.clustersData || this.clustersData.length === 0) {
      bar.innerHTML = '<span class="nav-hint">Crea categorías en la Biblioteca de Clusters para explorarlas aquí</span>';
      return;
    }

    bar.innerHTML = '';
    this.clustersData.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'btn-cluster-warp';
      btn.style.borderColor = c.color;
      btn.innerHTML = `<span class="dot" style="background-color:${c.color};"></span> ${c.name}`;
      btn.addEventListener('click', () => {
        this.warpToCluster(c.id);
      });
      bar.appendChild(btn);
    });
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
        }
        this.hoveredNode = hitNode;
        soundFX.playHover();
      }
      this.renderer.domElement.style.cursor = 'pointer';
      this.updateHUD(hitNode);

      // REQUERIMIENTO 7: Shader de rayos eléctricos en hover
      if (this.electricSphere && hitNode.mesh) {
        const worldPos = new THREE.Vector3();
        hitNode.mesh.getWorldPosition(worldPos);
        this.electricSphere.position.copy(worldPos);
        const radius = hitNode.radius || (hitNode.isClusterCenter ? 15 : 4.2);
        const scale = radius * 1.25;
        this.electricSphere.scale.set(scale, scale, scale);
        this.electricSphere.visible = true;
      }
      if (hitNode.mesh && hitNode.mesh.material && hitNode !== this.targetNode) {
        if (hitNode.mesh.material._origEmissiveIntensity === undefined) {
          hitNode.mesh.material._origEmissiveIntensity = hitNode.mesh.material.emissiveIntensity;
        }
        hitNode.mesh.material.emissiveIntensity = hitNode.isClusterCenter ? 1.7 : 1.3;
      }
    } else {
      if (this.hoveredNode) {
        if (this.hoveredNode !== this.targetNode && this.hoveredNode.mesh && this.hoveredNode.mesh.material) {
          this.hoveredNode.mesh.material.emissiveIntensity = this.hoveredNode.mesh.material._origEmissiveIntensity ?? (this.hoveredNode.isClusterCenter ? 0.95 : 0.45);
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', () => {
        console.log('[COSMOS 3D] WebSocket conectado al bus de eventos.');
        this.ws.send(JSON.stringify({ type: 'client:register', client: 'cosmos3d' }));
      });

      this.ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'game3:words_sequence' && Array.isArray(msg.words) && msg.words.length > 0) {
            console.log('[COSMOS 3D] ⚡ Secuencia neural de 3 palabras recibida:', msg.words);
            this.playNeuralSynapseSequence(msg.words);
          } else if (msg.type === 'game3:state_reset' || msg.type === 'game3:flight_reset') {
            console.log('[COSMOS 3D] 🔄 Evento reset recibido de Game 3. Volviendo a vista panorámica.');
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

  playNeuralSynapseSequence(words) {
    if (!this.wordNodes || this.wordNodes.length === 0) return;

    // Asegurar que el bucle de animación 3D esté activo
    this.start();

    // Si la interfaz general tiene el botón de la pestaña Universo 3D, activarlo
    const navBtn = document.getElementById('tab-cosmos-clusters-btn');
    if (navBtn && !navBtn.classList.contains('active')) {
      navBtn.click();
    }

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

    if (this.synapseGroup) {
      this.scene.remove(this.synapseGroup);
      this.synapseGroup = null;
    }

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

    if (this.synapseGroup) {
      this.scene.remove(this.synapseGroup);
      this.synapseGroup = null;
    }

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
}
