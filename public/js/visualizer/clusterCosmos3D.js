import * as THREE from '../libs/three.module.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { clusterManager } from '../engine/clusterManager.js';
import { soundFX } from '../audio/soundFX.js';

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

    // Flight controls
    this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, KeyQ: false, KeyE: false, Space: false, ShiftLeft: false };
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;
    this.isMouseDown = false;
    this.lastMouse = { x: 0, y: 0 };
    this.speed = 5.0;

    // Warp state
    this.isWarping = false;
    this.warpTarget = new THREE.Vector3();
    this.warpTargetYaw = 0;
    this.warpTargetPitch = 0;
    this.warpProgress = 1;

    // Hover & Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();
    this.hoveredNode = null;
    this.targetNode = null;

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
    // Clear existing cluster meshes
    if (this.clustersGroup) {
      this.scene.remove(this.clustersGroup);
    }

    this.clustersGroup = new THREE.Group();
    this.wordNodes = [];
    this.clusterGroupMap.clear();

    if (!this.clustersData || this.clustersData.length === 0) {
      this.scene.add(this.clustersGroup);
      return;
    }

    const clusterCount = this.clustersData.length;
    const ringRadius = Math.max(350, clusterCount * 180);

    this.clustersData.forEach((cluster, idx) => {
      // Calculate 3D position for cluster center arranged in a 3D ring/helios
      const angle = (idx / clusterCount) * Math.PI * 2;
      const cx = Math.cos(angle) * ringRadius;
      const cy = (Math.sin(idx * 1.5) * 120);
      const cz = Math.sin(angle) * ringRadius;

      const clusterCenter = new THREE.Vector3(cx, cy, cz);
      const hexColor = parseInt(cluster.color.replace('#', '0x'), 16) || 0x00f0ff;
      const colorObj = new THREE.Color(hexColor);

      const systemGroup = new THREE.Group();
      systemGroup.position.copy(clusterCenter);

      // 1. Central Nebula / Star Core
      const coreGeo = new THREE.SphereGeometry(24, 32, 32);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorObj,
        emissive: colorObj,
        emissiveIntensity: 0.9,
        roughness: 0.2
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      systemGroup.add(coreMesh);

      // Outer glow aura
      const auraGeo = new THREE.SphereGeometry(36, 32, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        wireframe: true
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      systemGroup.add(auraMesh);

      // 3D Category Title Banner
      const titleSprite = this.createClusterTitleSprite(cluster.name, cluster.color);
      titleSprite.position.set(0, 52, 0);
      systemGroup.add(titleSprite);

      // Store node for interaction
      const clusterNode = {
        isClusterCenter: true,
        clusterId: cluster.id,
        name: cluster.name,
        color: cluster.color,
        position: clusterCenter.clone(),
        mesh: coreMesh
      };
      this.wordNodes.push(clusterNode);

      // 2. Orbiting Word Planets
      const words = cluster.words || [];
      const wordCount = words.length;
      const orbitRadiusStep = Math.max(90, Math.min(220, wordCount * 14));

      words.forEach((w, wIdx) => {
        const wAngle = (wIdx / Math.max(1, wordCount)) * Math.PI * 2 + (idx * 0.5);
        const elevation = (Math.sin(wIdx * 2.2) * 45);
        const radius = orbitRadiusStep + (Math.cos(wIdx * 1.8) * 30);

        const wx = Math.cos(wAngle) * radius;
        const wy = elevation;
        const wz = Math.sin(wAngle) * radius;

        const planetGeo = new THREE.SphereGeometry(7, 20, 20);
        const planetMat = new THREE.MeshStandardMaterial({
          color: colorObj,
          emissive: colorObj,
          emissiveIntensity: 0.4,
          roughness: 0.3
        });

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(wx, wy, wz);
        systemGroup.add(planetMesh);

        // Connection line to cluster core
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(wx, wy, wz)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.35
        });
        const line = new THREE.Line(lineGeo, lineMat);
        systemGroup.add(line);

        // Billboard Word Sprite Label
        const labelSprite = this.createWordSprite(w, cluster.color);
        labelSprite.position.set(wx, wy + 14, wz);
        systemGroup.add(labelSprite);

        // World position of this word planet
        const worldPos = new THREE.Vector3().addVectors(clusterCenter, new THREE.Vector3(wx, wy, wz));

        const wordNode = {
          isClusterCenter: false,
          word: w,
          clusterName: cluster.name,
          color: cluster.color,
          position: worldPos,
          localPos: new THREE.Vector3(wx, wy, wz),
          mesh: planetMesh,
          systemGroup: systemGroup
        };

        this.wordNodes.push(wordNode);
      });

      this.clustersGroup.add(systemGroup);
      this.clusterGroupMap.set(cluster.id, { center: clusterCenter, name: cluster.name, color: cluster.color });
    });

    this.scene.add(this.clustersGroup);
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

    this.isWarping = true;
    this.warpProgress = 0;
    this.targetNode = node;
    soundFX.playActivate();

    this.updateHUD(node);
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code in this.keys) this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in this.keys) this.keys[e.code] = false;
    });

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
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
        this.warpToNode(hitNode);
      }
    });
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
        this.hoveredNode = hitNode;
        soundFX.playHover();
      }
      this.renderer.domElement.style.cursor = 'pointer';
      this.updateHUD(hitNode);
    } else {
      if (this.hoveredNode) {
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
    if (this.isWarping) {
      this.warpProgress = Math.min(1, this.warpProgress + dt * 0.0035);

      if (this.targetNode && this.targetNode.mesh) {
        const currentPos = new THREE.Vector3();
        this.targetNode.mesh.getWorldPosition(currentPos);
        const camPos = this.camera.position.clone();
        const toNode = new THREE.Vector3().subVectors(currentPos, camPos);
        const dist = toNode.length();
        if (dist > 0.001) toNode.normalize();
        else toNode.set(0, 0, 1);

        const standoff = this.targetNode.isClusterCenter ? 120 : 40;
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
    }

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Subtle rotation of cluster planetary orbits
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
}
