import { soundFX } from '../audio/soundFX.js';

/**
 * Interactive Canvas-based Graph Visualizer for Semantic Vector Fields.
 * Renders a central word node surrounded by 8 orbital neighbor nodes,
 * with physics simulation, flowing synaptic energy pulses, and pivot transitions.
 */
export class GraphVisualizer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    // Viewport transform
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.targetCamera = { x: 0, y: 0, zoom: 1 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Graph Data
    this.centerNode = null;
    this.satelliteNodes = [];
    this.pulses = []; // flowing synaptic energy particles
    this.ambientParticles = [];

    // Interaction state
    this.hoveredNode = null;
    this.selectedNode = null;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.onNodeHover = options.onNodeHover || (() => {});

    // Animation & timing
    this.animId = null;
    this.lastTime = performance.now();
    this.transitionProgress = 1; // 0 to 1 for pivot transitions

    this.initEvents();
    this.initAmbientParticles();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 45; i++) {
      this.ambientParticles.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1200,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#00f0ff' : '#a855f7'
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
      this.onNodeHover(null);
    });

    // Touch support for mobile/tablets
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        this.camera.x += (currentX - this.dragStart.x) / this.camera.zoom;
        this.camera.y += (currentY - this.dragStart.y) / this.camera.zoom;
        this.targetCamera.x = this.camera.x;
        this.targetCamera.y = this.camera.y;
        this.dragStart = { x: currentX, y: currentY };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  screenToWorld(screenX, screenY) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    return {
      x: (screenX - cx) / this.camera.zoom - this.camera.x,
      y: (screenY - cy) / this.camera.zoom - this.camera.y
    };
  }

  worldToScreen(worldX, worldY) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    return {
      x: (worldX + this.camera.x) * this.camera.zoom + cx,
      y: (worldY + this.camera.y) * this.camera.zoom + cy
    };
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isDragging) {
      const dx = mouseX - this.dragStart.x;
      const dy = mouseY - this.dragStart.y;
      this.camera.x += dx / this.camera.zoom;
      this.camera.y += dy / this.camera.zoom;
      this.targetCamera.x = this.camera.x;
      this.targetCamera.y = this.camera.y;
      this.dragStart = { x: mouseX, y: mouseY };
      return;
    }

    const world = this.screenToWorld(mouseX, mouseY);
    let found = null;

    // Check center node
    if (this.centerNode) {
      const dist = Math.hypot(world.x - this.centerNode.x, world.y - this.centerNode.y);
      if (dist < this.centerNode.radius) {
        found = this.centerNode;
      }
    }

    // Check satellite nodes
    if (!found) {
      for (const node of this.satelliteNodes) {
        const dist = Math.hypot(world.x - node.x, world.y - node.y);
        if (dist < node.radius + 8) {
          found = node;
          break;
        }
      }
    }

    if (found !== this.hoveredNode) {
      this.hoveredNode = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
      if (found) {
        soundFX.playHover();
      }
      this.onNodeHover(found);
    }
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.hoveredNode) {
      // Clicked on a node!
      this.selectedNode = this.hoveredNode;
      soundFX.playActivate();
      this.onNodeClick(this.hoveredNode);
    } else {
      // Start dragging view
      this.isDragging = true;
      this.dragStart = { x: mouseX, y: mouseY };
    }
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.4, Math.min(2.2, this.targetCamera.zoom * zoomFactor));
    this.targetCamera.zoom = newZoom;
  }

  resetCamera() {
    this.targetCamera.x = 0;
    this.targetCamera.y = 0;
    this.targetCamera.zoom = 1;
  }

  /**
   * Updates the graph with a new central word and its 8 nearest neighbors
   */
  setData(data) {
    const { targetWord, neighbors } = data;

    // Center node
    this.centerNode = {
      id: 'center',
      word: targetWord,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      radius: 46,
      similarity: 1.0,
      distance: 0.0,
      isCenter: true,
      pulsePhase: 0
    };

    // Calculate satellite nodes
    this.satelliteNodes = [];
    const count = neighbors.length;

    // Distribute satellites radially based on semantic distance
    // Min distance in vector space is ~0.20-0.30, Max is ~0.65-0.70
    // We map semantic distance (0.2 -> 160px, 0.7 -> 320px)
    const baseAngle = -Math.PI / 2;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const neighbor = neighbors[i];
      const angle = baseAngle + i * angleStep + (Math.random() - 0.5) * 0.15;

      // Distance mapping: physical orbital radius directly reflects vector distance
      // Distance 0.25 -> 170px, Distance 0.60 -> 310px
      const orbitRadius = 150 + Math.pow(neighbor.distance, 1.3) * 290;

      const targetX = Math.cos(angle) * orbitRadius;
      const targetY = Math.sin(angle) * orbitRadius;

      this.satelliteNodes.push({
        id: `node-${i}`,
        index: i,
        word: neighbor.word,
        similarity: neighbor.similarity,
        distance: neighbor.distance,
        isSignifierTwin: neighbor.isSignifierTwin,
        orbitRadius,
        orbitAngle: angle,
        orbitSpeed: (0.0004 + (count - i) * 0.0001) * (i % 2 === 0 ? 1 : -1),
        x: targetX * 0.4, // start slightly inward for entry bloom
        y: targetY * 0.4,
        targetX,
        targetY,
        radius: 34,
        isCenter: false
      });
    }

    // Reset pulses
    this.pulses = [];
    for (let i = 0; i < 16; i++) {
      const nodeIdx = Math.floor(Math.random() * count);
      this.pulses.push({
        nodeIdx,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.005,
        color: '#00f0ff'
      });
    }

    this.transitionProgress = 0;
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = (now) => {
      const dt = Math.min(60, now - this.lastTime);
      this.lastTime = now;
      this.update(dt, now);
      this.render(now);
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
    // Smooth camera interpolation
    this.camera.x += (this.targetCamera.x - this.camera.x) * 0.12;
    this.camera.y += (this.targetCamera.y - this.camera.y) * 0.12;
    this.camera.zoom += (this.targetCamera.zoom - this.camera.zoom) * 0.12;

    // Transition bloom
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt * 0.0025);
    }

    // Update ambient particles
    for (const p of this.ambientParticles) {
      p.x += p.speedX * dt * 0.06;
      p.y += p.speedY * dt * 0.06;
      if (p.x > 800) p.x = -800;
      if (p.x < -800) p.x = 800;
      if (p.y > 600) p.y = -600;
      if (p.y < -600) p.y = 600;
    }

    if (!this.centerNode) return;

    this.centerNode.pulsePhase = (now * 0.0025) % (Math.PI * 2);

    // Update satellite nodes with gentle physics & orbital drift
    for (let i = 0; i < this.satelliteNodes.length; i++) {
      const node = this.satelliteNodes[i];

      // Orbital slow drift
      node.orbitAngle += node.orbitSpeed * dt;
      const idealX = Math.cos(node.orbitAngle) * node.orbitRadius;
      const idealY = Math.sin(node.orbitAngle) * node.orbitRadius;

      node.targetX = idealX;
      node.targetY = idealY;

      // Spring to target
      const ease = 0.06 * (this.transitionProgress);
      node.x += (node.targetX - node.x) * ease;
      node.y += (node.targetY - node.y) * ease;
    }

    // Update synaptic pulses
    for (const pulse of this.pulses) {
      pulse.progress += pulse.speed * (dt / 16.6);
      if (pulse.progress > 1) {
        pulse.progress = 0;
        pulse.nodeIdx = Math.floor(Math.random() * this.satelliteNodes.length);
      }
    }
  }

  render(now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // Background cosmic gradient
    const bgGradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 80,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
    );
    bgGradient.addColorStop(0, '#0d1326');
    bgGradient.addColorStop(0.5, '#070a14');
    bgGradient.addColorStop(1, '#03050a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Apply camera transform
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(this.camera.x, this.camera.y);

    // 1. Render ambient floating particles
    this.renderAmbientParticles(ctx);

    // 2. Render subtle concentric radar orbit guide rings
    this.renderRadarRings(ctx);

    if (this.centerNode) {
      // 3. Render Synaptic Filaments (links between center and satellites)
      this.renderFilaments(ctx, now);

      // 4. Render Satellite Nodes
      for (const node of this.satelliteNodes) {
        this.renderSatelliteNode(ctx, node, now);
      }

      // 5. Render Central Word Node
      this.renderCenterNode(ctx, now);
    }

    ctx.restore();
  }

  renderAmbientParticles(ctx) {
    for (const p of this.ambientParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }

  renderRadarRings(ctx) {
    const rings = [160, 230, 300, 370];
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);

    rings.forEach((r, idx) => {
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 + idx * 0.02})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Small distance indicator label along ring
      ctx.fillStyle = 'rgba(100, 150, 190, 0.3)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`d ~ ${(0.25 + idx * 0.14).toFixed(2)}`, -r - 4, 3);
    });

    ctx.setLineDash([]);
    ctx.restore();
  }

  renderFilaments(ctx, now) {
    for (let i = 0; i < this.satelliteNodes.length; i++) {
      const node = this.satelliteNodes[i];
      const isHovered = this.hoveredNode === node;
      const isSelected = this.selectedNode === node;

      // Color intensity based on cosine similarity
      // Higher similarity = brighter cyan, lower similarity = dimmer violet
      const simNorm = Math.max(0, Math.min(1, (node.similarity - 0.3) / 0.5));
      const strokeAlpha = isHovered || isSelected ? 0.95 : (0.2 + simNorm * 0.45);
      const strokeWidth = isHovered || isSelected ? 3.5 : (1.2 + simNorm * 2.2);

      // Gradient filament
      const grad = ctx.createLinearGradient(0, 0, node.x, node.y);
      grad.addColorStop(0, `rgba(0, 240, 255, ${strokeAlpha})`);
      if (node.isSignifierTwin) {
        grad.addColorStop(1, `rgba(255, 170, 0, ${strokeAlpha})`);
      } else {
        grad.addColorStop(1, `rgba(168, 85, 247, ${strokeAlpha})`);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = strokeWidth;
      if (isHovered || isSelected) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00f0ff';
      }
      ctx.stroke();
      ctx.restore();

      // Badge on link showing cosine similarity % and distance
      const midX = node.x * 0.52;
      const midY = node.y * 0.52;

      ctx.save();
      ctx.translate(midX, midY);

      // Pill background
      const simText = `${(node.similarity * 100).toFixed(0)}%`;
      ctx.font = '10px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(simText).width;

      ctx.fillStyle = isHovered ? 'rgba(0, 240, 255, 0.25)' : 'rgba(10, 16, 32, 0.85)';
      ctx.strokeStyle = isHovered ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;

      const pw = textWidth + 12;
      const ph = 16;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(simText, 0, 1);
      ctx.restore();
    }

    // Render flowing synaptic energy pulses
    for (const pulse of this.pulses) {
      const node = this.satelliteNodes[pulse.nodeIdx];
      if (!node) continue;

      // Pulse travels towards center or towards node
      const px = node.x * (1 - pulse.progress);
      const py = node.y * (1 - pulse.progress);

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
      ctx.restore();
    }
  }

  renderCenterNode(ctx, now) {
    const node = this.centerNode;
    const isHovered = this.hoveredNode === node;

    ctx.save();
    ctx.translate(0, 0);

    // Outer resonance wave rings
    const ring1 = (now * 0.04) % 45;
    const ringAlpha1 = Math.max(0, 1 - ring1 / 45) * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, node.radius + ring1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha1})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const ring2 = ((now * 0.04) + 22) % 45;
    const ringAlpha2 = Math.max(0, 1 - ring2 / 45) * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, node.radius + ring2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168, 85, 247, ${ringAlpha2})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Core glow
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, node.radius);
    coreGrad.addColorStop(0, '#00f0ff');
    coreGrad.addColorStop(0.4, '#1e3a8a');
    coreGrad.addColorStop(0.8, '#090d1c');
    coreGrad.addColorStop(1, '#05070e');

    ctx.beginPath();
    ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.shadowBlur = isHovered ? 30 : 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fill();

    // Border
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    // Core text
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.word.toUpperCase(), 0, -3);

    // Sub-badge: "NODO CENTRAL"
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillText('NODO CENTRAL', 0, 16);

    ctx.restore();
  }

  renderSatelliteNode(ctx, node, now) {
    const isHovered = this.hoveredNode === node;
    const isSelected = this.selectedNode === node;

    ctx.save();
    ctx.translate(node.x, node.y);

    const radius = node.radius * (isHovered ? 1.14 : 1.0);

    // Glowing aura on hover
    if (isHovered || isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }

    // Node body gradient
    const bodyGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    if (node.isSignifierTwin) {
      bodyGrad.addColorStop(0, '#ffaa00');
      bodyGrad.addColorStop(0.5, '#451a03');
      bodyGrad.addColorStop(1, '#1c1008');
    } else {
      bodyGrad.addColorStop(0, '#c084fc');
      bodyGrad.addColorStop(0.5, '#2e1065');
      bodyGrad.addColorStop(1, '#0c071e');
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.shadowBlur = isHovered ? 20 : 8;
    ctx.shadowColor = node.isSignifierTwin ? '#ffaa00' : '#a855f7';
    ctx.fill();

    // Border
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.strokeStyle = isHovered
      ? '#00f0ff'
      : (node.isSignifierTwin ? '#ffaa00' : 'rgba(192, 132, 252, 0.7)');
    ctx.stroke();

    // Word text
    ctx.shadowBlur = isHovered ? 8 : 0;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${isHovered ? 14 : 12}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.word, 0, -4);

    // Semantic distance / similarity label
    ctx.shadowBlur = 0;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = node.isSignifierTwin ? '#fcd34d' : '#38bdf8';
    ctx.fillText(`d: ${node.distance.toFixed(2)}`, 0, 12);

    // If morphological twin, show tag icon
    if (node.isSignifierTwin) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '8px sans-serif';
      ctx.fillText('⚡ Significante', 0, radius + 13);
    }

    ctx.restore();
  }
}
