/**
 * Sincretismo de Silicio - 3D ASCII Displacement Visualizer
 * Renders 3D Spheres and 3D Connection Wires in Three.js,
 * overlaid with a WebGL ASCII displacement shader pixel-art effect.
 */

import * as THREE from '../libs/three.module.js';

export class NarrativeCosmos3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.nodeSpheres = [];
    this.connectionLines = [];
    this.stepPositions = [];
    this.currentStep = 0;
    this.totalSteps = options.totalSteps || 6;

    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.animFrameId = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    if (!this.container) return;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050b14, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x050b14, 1);
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2638, 1.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(20, 40, 20);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7c4dff, 2.0);
    dirLight2.position.set(-20, -30, -10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff1744, 3, 50);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // 5. Build 3D Node Path Sequence
    this.buildNodePathSequence(this.totalSteps);

    // Set initial camera position
    if (this.stepPositions.length > 0) {
      const first = this.stepPositions[0];
      this.camera.position.set(first.x, first.y + 2, first.z + 14);
      this.targetCameraPos.copy(this.camera.position);
      this.targetLookAt.copy(first);
      this.currentLookAt.copy(first);
      this.camera.lookAt(first);
    }

    // Window resize handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Start render loop
    this.animate();
  }

  buildNodePathSequence(steps) {
    this.totalSteps = steps;

    // Clear existing
    for (const sphere of this.nodeSpheres) this.scene.remove(sphere);
    for (const line of this.connectionLines) this.scene.remove(line);
    this.nodeSpheres = [];
    this.connectionLines = [];
    this.stepPositions = [];

    const sphereGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x003344,
      emissiveIntensity: 0.5
    });

    let currentPos = new THREE.Vector3(0, 0, 0);

    for (let i = 0; i < steps; i++) {
      const pos = currentPos.clone();
      this.stepPositions.push(pos);

      // Create 3D Sphere Node
      const sphereMat = baseMat.clone();
      if (i === 0) {
        sphereMat.color.setHex(0x00e676);
        sphereMat.emissive.setHex(0x00441a);
      } else if (i === steps - 1) {
        sphereMat.color.setHex(0xff1744);
        sphereMat.emissive.setHex(0x440011);
      }

      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      sphere.userData = { stepIndex: i };
      this.scene.add(sphere);
      this.nodeSpheres.push(sphere);

      // Create outer wireframe aura sphere
      const auraGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: sphereMat.color,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      sphere.add(aura);

      // Calculate next position along a winding 3D path
      if (i < steps - 1) {
        const nextPos = new THREE.Vector3(
          currentPos.x + (Math.sin(i * 1.2) * 12 + (i % 2 === 0 ? 8 : -8)),
          currentPos.y + (Math.cos(i * 0.9) * 4 - 1),
          currentPos.z - 18
        );

        // Build 3D Connecting Tube / Wire
        const pathCurve = new THREE.LineCurve3(currentPos, nextPos);
        const tubeGeo = new THREE.TubeGeometry(pathCurve, 20, 0.3, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x7c4dff,
          emissive: 0x2a0066,
          roughness: 0.3,
          metalness: 0.7,
          wireframe: false
        });

        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        this.scene.add(tube);
        this.connectionLines.push(tube);

        currentPos = nextPos;
      }
    }
  }

  advanceToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.stepPositions.length) return;
    this.currentStep = stepIndex;

    const targetNodePos = this.stepPositions[stepIndex];

    // Position camera slightly behind and above target node for dramatic perspective
    this.targetCameraPos.set(
      targetNodePos.x + Math.sin(stepIndex) * 3,
      targetNodePos.y + 3.5,
      targetNodePos.z + 12
    );

    this.targetLookAt.copy(targetNodePos);

    // Highlight active sphere node
    for (let i = 0; i < this.nodeSpheres.length; i++) {
      const s = this.nodeSpheres[i];
      if (i === stepIndex) {
        s.scale.set(1.4, 1.4, 1.4);
        s.material.emissiveIntensity = 1.2;
      } else {
        s.scale.set(1.0, 1.0, 1.0);
        s.material.emissiveIntensity = 0.4;
      }
    }
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Smoothly interpolate camera position & lookAt
    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.currentLookAt.lerp(this.targetLookAt, 0.05);
    this.camera.lookAt(this.currentLookAt);

    // Rotate node spheres & pulsing outer auras
    for (let i = 0; i < this.nodeSpheres.length; i++) {
      const s = this.nodeSpheres[i];
      s.rotation.y += 0.015;
      s.rotation.x += 0.008;

      if (s.children.length > 0) {
        const aura = s.children[0];
        aura.rotation.y -= 0.025;
        const pulse = 1.0 + 0.15 * Math.sin(elapsedTime * 3 + i);
        aura.scale.set(pulse, pulse, pulse);
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}
