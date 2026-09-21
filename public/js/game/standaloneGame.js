/**
 * Sincretismo de Silicio - Standalone Game Engine (p5.js)
 * Semantic Word Collision Game with Procedural WebGL ASCII/Noise Background
 */

import { SemanticVectorEngine } from '../engine/semanticVectorEngine.js';
import { AsciiShaderBackground } from '../shaders/asciiShaderBackground.js';
import { soundFX } from '../audio/soundFX.js';

// Configuration state with default fallbacks
let config = {
  gameplay: {
    initialLives: 3,
    wordLifetime: 10,
    minSpeed: 0.5,
    maxSpeed: 4.5,
    spawnInterval: 2.0,
    maxWordsOnScreen: 14,
    thresholdPointsMinus: 0.5,
    thresholdPointsPlus: 0.5,
    thresholdLifePlus: 0.9,
    thresholdLifeMinus: 0.4,
    pointsBaseGain: 100,
    pointsBaseLoss: 50,
    collisionRadius: 48
  },
  wordsStyle: {
    fontFamily: 'Space Mono',
    fontSize: 18,
    textColor: '#ffffff',
    borderColor: '#00f0ff',
    borderWidth: 2,
    backgroundColor: 'rgba(8, 16, 28, 0.85)',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    showNetworkLines: true,
    maxLineDist: 200,
    lineWidth: 1.5
  },
  shaderBg: {
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
  },
  customWording: {
    mode: 'random',
    words: ['TIEMPO', 'FUEGO', 'LIBERTAD', 'UNIVERSO', 'MEMORIA', 'FILOSOFÍA']
  }
};

// Game Runtime State
const gameState = {
  lives: 3,
  score: 0,
  highScore: 0,
  combo: 0,
  words: [],
  animations: [],
  floatingTexts: [],
  draggedWord: null,
  dragOffset: { x: 0, y: 0 },
  lastSpawnTime: 0,
  isGameOver: false,
  isStarted: false,
  isAudioMuted: false,
  filteredVocab: [],
  customWordIndex: 0
};

let vectorEngine = null;
let shaderBg = null;
let p5Instance = null;

// Helper: Stop words & filter for playable words
const STOP_WORDS = new Set([
  'que', 'del', 'los', 'por', 'con', 'las', 'una', 'para', 'como', 'sus', 'también',
  'entre', 'este', 'pero', 'son', 'sobre', 'desde', 'hasta', 'sin', 'donde', 'era',
  'está', 'utc', 'después', 'otros', 'puede', 'uno', 'así', 'muy', 'había', 'mismo',
  'eran', 'cual', 'vez', 'tras', 'todo', 'según', 'contra', 'otras', 'todos', 'sido',
  'bajo', 'cada', 'han', 'ese', 'hay', 'mientras', 'web', 'antes', 'quien', 'embargo',
  'tanto', 'algunos', 'hacia', 'luego', 'siendo', 'otro', 'estaba', 'estos', 'esto',
  'debido', 'ella', 'pueden', 'varios', 'solo', 'tipo', 'entonces', 'tuvo', 'otra',
  'hace', 'tenía', 'poco', 'ellos', 'están', 'unos', 'caso', 'dentro', 'muchos',
  'les', 'estas', 'medio', 'través', 'menos', 'largo', 'hecho', 'algunas', 'veces',
  'todas', 'misma', 'ante', 'http', 'jpg', 'tienen', 'porque', 'actualmente', 'uso',
  'esa', 'cualquier', 'diferentes', 'toda', 'sea', 'haber', 'debe', 'siempre', 'casi',
  'cerca', 'cinco', 'anterior', 'cuales', 'mucho', 'ver', 'fuera', 'pesar', 'mediante',
  'hoy', 'tal', 'sino', 'siguientes', 'ambos', 'incluso', 'tan', 'ahora', 'aquí',
  'algo', 'aún', 'decir', 'ello', 'van', 'dio', 'don', 'allí', 'eso', 'parece',
  'seis', 'trata', 'from', 'favor', 'éste', 'unas', 'existen', 'existe', 'ellas',
  'dar', 'nos', 'tales', 'https', 'you', 'may', 'creo', 'será', 'width', 'alguna',
  'mano', 'sigue', 'cuya', 'ningún', 'demás', 'algún', 'cosas', 'quedó', 'dijo'
]);

function filterVocab(words) {
  if (!words || !words.length) return [];
  return words.filter(w => {
    if (!w || w.length < 3 || w.length > 15) return false;
    if (/^\d+$/.test(w) || /[0-9_]/.test(w)) return false;
    const clean = w.toLowerCase().trim();
    if (STOP_WORDS.has(clean)) return false;
    return true;
  });
}

/**
 * Word Class representing floating semantic words
 */
class Word {
  constructor(p, text, x, y, vx, vy, lifetime) {
    this.p = p;
    this.text = (text || '').toUpperCase();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = lifetime;
    this.bornTime = performance.now();
    this.isDragging = false;
    this.hover = false;
    this.dissolving = false;
    this.dissolveProgress = 0;
    this.width = 0;
    this.height = 36;
    this.paddingX = 20;
    this.paddingY = 8;
    this.energyType = null; // 'fire' or 'green'
    this.targetEnergyIntensity = 0; // 0 to 1
    this.displayedEnergyIntensity = 0; // smoothly interpolated 0 to 1
    this.particles = [];
    this.updateSize();
  }

  updateSize() {
    this.p.push();
    this.p.textFont(config.wordsStyle.fontFamily || 'Space Mono');
    this.p.textSize(Number(config.wordsStyle.fontSize) || 18);
    this.width = this.p.textWidth(this.text) + this.paddingX * 2;
    this.height = (Number(config.wordsStyle.fontSize) || 18) + this.paddingY * 2;
    this.p.pop();
  }

  get remainingLifeRatio() {
    const elapsed = (performance.now() - this.bornTime) * 0.001;
    return Math.max(0, 1 - elapsed / this.lifetime);
  }

  isExpired() {
    return this.remainingLifeRatio <= 0;
  }

  contains(px, py) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    return px >= this.x - hw && px <= this.x + hw && py >= this.y - hh && py <= this.y + hh;
  }

  update(boundsW, boundsH) {
    if (this.dissolving) {
      this.dissolveProgress += 0.04;
      return;
    }

    if (!this.isDragging) {
      this.x += this.vx;
      this.y += this.vy;

      const hw = this.width / 2;
      const hh = this.height / 2;

      // Bounce against screen walls
      if (this.x - hw < 15) {
        this.x = 15 + hw;
        this.vx = Math.abs(this.vx);
      } else if (this.x + hw > boundsW - 15) {
        this.x = boundsW - 15 - hw;
        this.vx = -Math.abs(this.vx);
      }

      if (this.y - hh < 70) { // Keep clear of top HUD
        this.y = 70 + hh;
        this.vy = Math.abs(this.vy);
      } else if (this.y + hh > boundsH - 45) { // Keep clear of bottom guide
        this.y = boundsH - 45 - hh;
        this.vy = -Math.abs(this.vy);
      }
    }
  }

  updateEnergy(p) {
    // Smooth transition for energy intensity
    this.displayedEnergyIntensity = p.lerp(this.displayedEnergyIntensity || 0, this.targetEnergyIntensity || 0, 0.22);
    if (this.displayedEnergyIntensity < 0.005) {
      this.displayedEnergyIntensity = 0;
      this.energyType = null;
    }

    // Spawn sparks/embers when energized
    if (this.displayedEnergyIntensity > 0.12 && !this.dissolving) {
      const hw = this.width * 0.5;
      const hh = this.height * 0.5;
      const isFire = this.energyType === 'fire';

      // Emission rate scales with intensity
      const spawnChance = this.displayedEnergyIntensity * 0.75;
      if (Math.random() < spawnChance) {
        this.particles.push({
          x: p.random(-hw - 4, hw + 4),
          y: isFire ? p.random(0, hh + 2) : p.random(-hh, hh),
          vx: p.random(-0.7, 0.7),
          vy: isFire ? p.random(-2.2, -0.6) : p.random(-1.4, 1.4),
          size: p.random(2.5, 5.5 + this.displayedEnergyIntensity * 3.5),
          life: 1.0,
          decay: p.random(0.035, 0.075),
          isFire: isFire
        });
      }
    }

    // Update active particles
    if (this.particles && this.particles.length > 0) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= pt.decay;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    const lifeRatio = this.remainingLifeRatio;
    let alpha = this.dissolving ? Math.max(0, 1 - this.dissolveProgress) : Math.min(1, lifeRatio * 1.5 + 0.2);

    const energy = this.displayedEnergyIntensity || 0;
    const isFire = this.energyType === 'fire';
    const isGreen = this.energyType === 'green';

    // Scale up slightly when energized or dragged or hovered
    let scaleVal = 1.0;
    if (this.isDragging) {
      scaleVal = 1.1;
    } else if (this.hover) {
      scaleVal = 1.04;
    }
    if (energy > 0.05) {
      scaleVal += energy * 0.06;
    }
    p.scale(scaleVal);

    const hw = this.width / 2;
    const hh = this.height / 2;
    const radius = 12;
    const time = performance.now();

    // 1. Draw Outer Energy Aura & Glow
    p.noStroke();
    if (energy > 0.05) {
      if (isFire) {
        // Organic fire flicker pulse
        const flamePulse1 = 0.85 + 0.20 * Math.sin(time * 0.022 + this.x * 0.1);
        const flamePulse2 = 0.88 + 0.15 * Math.cos(time * 0.035 + this.y * 0.1);

        // Wide fiery crimson aura
        p.fill(255, 23, 68, 80 * energy * flamePulse1 * alpha);
        p.rect(-hw - 14, -hh - 12, this.width + 28, this.height + 24, radius + 8);

        // Mid blazing orange flame core
        p.fill(255, 100, 20, 120 * energy * flamePulse2 * alpha);
        p.rect(-hw - 7, -hh - 6, this.width + 14, this.height + 12, radius + 4);

        // Inner hot gold heat
        p.fill(255, 200, 40, 75 * energy * alpha);
        p.rect(-hw - 3, -hh - 2, this.width + 6, this.height + 4, radius + 2);
      } else if (isGreen) {
        // High-frequency cyber plasma pulse
        const greenPulse = 0.88 + 0.18 * Math.sin(time * 0.016 + this.x * 0.1);

        // Wide neon emerald aura
        p.fill(0, 230, 118, 90 * energy * greenPulse * alpha);
        p.rect(-hw - 14, -hh - 12, this.width + 28, this.height + 24, radius + 8);

        // Bright cyber green plasma core
        p.fill(57, 255, 20, 130 * energy * greenPulse * alpha);
        p.rect(-hw - 7, -hh - 6, this.width + 14, this.height + 12, radius + 4);

        // Inner luminous mint sheen
        p.fill(210, 255, 230, 80 * energy * alpha);
        p.rect(-hw - 3, -hh - 2, this.width + 6, this.height + 4, radius + 2);
      }
    } else if (this.isDragging) {
      p.fill(0, 240, 255, 60 * alpha);
      p.rect(-hw - 8, -hh - 8, this.width + 16, this.height + 16, radius + 4);
    } else if (this.hover) {
      p.fill(0, 240, 255, 35 * alpha);
      p.rect(-hw - 4, -hh - 4, this.width + 8, this.height + 8, radius + 2);
    }

    // 2. Pill Background: shifts color dynamically with energy!
    let bgR = 10, bgG = 18, bgB = 30; // Standard dark cyber blue
    if (energy > 0.05) {
      if (isFire) {
        // Tinting red like burning charcoal / hot magma
        bgR = p.lerp(10, 65, energy);
        bgG = p.lerp(18, 10, energy);
        bgB = p.lerp(30, 14, energy);
      } else if (isGreen) {
        // Tinting deep cyber emerald
        bgR = p.lerp(10, 8, energy);
        bgG = p.lerp(18, 55, energy);
        bgB = p.lerp(30, 26, energy);
      }
    }
    p.fill(bgR, bgG, bgB, 235 * alpha);

    // 3. Pill Border: thickens & ignites with energy!
    let bWeight = Number(config.wordsStyle.borderWidth) || 2;
    if (energy > 0.05) {
      bWeight += energy * 2.5;
      p.strokeWeight(bWeight);

      if (isFire) {
        // Flaming oscillating fire border
        const tFire = Math.sin(time * 0.015) * 0.5 + 0.5;
        const fireBorder = p.lerpColor(p.color(255, 23, 68), p.color(255, 145, 0), tFire);
        fireBorder.setAlpha(255 * alpha);
        p.stroke(fireBorder);
      } else if (isGreen) {
        // Brilliant cyber electric emerald border
        const tGreen = Math.sin(time * 0.018) * 0.5 + 0.5;
        const greenBorder = p.lerpColor(p.color(0, 230, 118), p.color(57, 255, 20), tGreen);
        greenBorder.setAlpha(255 * alpha);
        p.stroke(greenBorder);
      }
    } else if (this.isDragging) {
      p.strokeWeight(bWeight);
      p.stroke(0, 240, 255, 255 * alpha);
    } else if (this.hover) {
      p.strokeWeight(bWeight);
      p.stroke(224, 64, 251, 230 * alpha);
    } else {
      p.strokeWeight(bWeight);
      const bColor = p.color(config.wordsStyle.borderColor || '#00f0ff');
      bColor.setAlpha(200 * alpha);
      p.stroke(bColor);
    }

    p.rect(-hw, -hh, this.width, this.height, radius);

    // 4. Lifetime Countdown Bar underneath pill
    p.noStroke();
    if (lifeRatio > 0.4) {
      p.fill(0, 240, 255, 180 * alpha);
    } else if (lifeRatio > 0.2) {
      p.fill(255, 171, 0, 200 * alpha);
    } else {
      p.fill(255, 23, 68, 220 * alpha);
    }
    const barWidth = (this.width - 12) * lifeRatio;
    p.rect(-hw + 6, hh - 4, barWidth, 2, 1);

    // 5. Word Text
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(config.wordsStyle.fontFamily || 'Space Mono');
    p.textSize(Number(config.wordsStyle.fontSize) || 18);
    p.textStyle(p.BOLD);
    p.noStroke();

    let textColor;
    if (energy > 0.15) {
      if (isFire) {
        textColor = p.lerpColor(p.color(255, 255, 255), p.color(255, 230, 170), energy);
      } else if (isGreen) {
        textColor = p.lerpColor(p.color(255, 255, 255), p.color(215, 255, 230), energy);
      }
    } else {
      textColor = p.color(config.wordsStyle.textColor || '#ffffff');
    }
    textColor.setAlpha(255 * alpha);
    p.fill(textColor);
    p.text(this.text, 0, -1);

    // 6. Draw Energy Sparks / Embers (in front of text for 3D depth!)
    if (this.particles && this.particles.length > 0) {
      p.noStroke();
      for (const pt of this.particles) {
        const ptAlpha = pt.life * energy * 255 * alpha;
        if (pt.isFire) {
          if (pt.life > 0.6) {
            p.fill(255, 225, 70, ptAlpha);
          } else if (pt.life > 0.3) {
            p.fill(255, 115, 20, ptAlpha);
          } else {
            p.fill(255, 23, 68, ptAlpha);
          }
        } else {
          if (pt.life > 0.6) {
            p.fill(220, 255, 235, ptAlpha);
          } else {
            p.fill(0, 245, 130, ptAlpha);
          }
        }
        p.circle(pt.x, pt.y, pt.size * pt.life);
      }
    }

    p.pop();
  }
}

/**
 * Collision Effect Animation with parameter d in [0, 1]
 */
class CollisionEffect {
  constructor(p, x, y, d, scoreDelta, lifeDelta, wordA, wordB) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.d = d; // Semantic distance interpolated parameter [0, 1]
    this.scoreDelta = scoreDelta;
    this.lifeDelta = lifeDelta;
    this.wordA = wordA;
    this.wordB = wordB;
    this.startTime = performance.now();
    this.duration = 1200; // ms
    this.isDone = false;

    // Build particles based on d
    const particleCount = Math.floor(p.lerp(16, 45, d));
    this.particles = [];

    // Interpolated color palette based on d
    // Low d (<0.4): Crimson Red | Mid d (0.4-0.6): Gold/Yellow | High d (>0.6): Cyan/Violet | Ultra (>0.9): Neon Emerald
    let baseColor;
    if (d < 0.4) {
      baseColor = p.color(255, 23, 68); // Red penalty
    } else if (d < 0.6) {
      baseColor = p.color(255, 171, 0); // Amber caution
    } else if (d < 0.9) {
      baseColor = p.color(0, 240, 255); // Cyan synergy
    } else {
      baseColor = p.color(0, 230, 118); // Emerald celestial
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (p.TWO_PI / particleCount) * i + p.random(-0.3, 0.3);
      const speed = p.lerp(2.5, 9.0, d) * p.random(0.6, 1.4);
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: p.random(3, 8 + d * 5),
        color: baseColor,
        life: 1.0,
        decay: p.random(0.015, 0.035)
      });
    }
  }

  update() {
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);
    if (progress >= 1) {
      this.isDone = true;
    }

    for (const pt of this.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.95;
      pt.vy *= 0.95;
      pt.life = Math.max(0, pt.life - pt.decay);
    }
  }

  draw(p) {
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);
    // Ease out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const alpha = (1 - progress) * 255;

    p.push();
    p.translate(this.x, this.y);

    // Primary Shockwave Ring (radius scaled by d)
    const maxRadius = p.lerp(70, 240, this.d);
    const currentRadius = maxRadius * easeOut;
    const strokeW = p.lerp(3, 7, this.d) * (1 - progress);

    p.noFill();
    if (this.d < 0.4) {
      p.stroke(255, 23, 68, alpha);
    } else if (this.d < 0.6) {
      p.stroke(255, 171, 0, alpha);
    } else if (this.d < 0.9) {
      p.stroke(0, 240, 255, alpha);
    } else {
      p.stroke(0, 230, 118, alpha);
    }
    p.strokeWeight(strokeW);
    p.ellipse(0, 0, currentRadius * 2, currentRadius * 2);

    // Secondary Echo Ring for high semantic distance
    if (this.d > 0.5) {
      const echoRadius = currentRadius * 0.65;
      p.stroke(224, 64, 251, alpha * 0.7);
      p.strokeWeight(strokeW * 0.6);
      p.ellipse(0, 0, echoRadius * 2, echoRadius * 2);
    }

    // Central flash
    if (progress < 0.3) {
      const flashAlpha = (1 - progress / 0.3) * 200;
      p.noStroke();
      p.fill(255, 255, 255, flashAlpha);
      p.ellipse(0, 0, currentRadius * 0.5, currentRadius * 0.5);
    }

    // Burst Particles
    p.noStroke();
    for (const pt of this.particles) {
      const pColor = p.color(pt.color);
      pColor.setAlpha(pt.life * alpha);
      p.fill(pColor);
      p.ellipse(pt.x, pt.y, pt.size * pt.life, pt.size * pt.life);
    }

    p.pop();
  }
}

/**
 * Floating Text Feedback (Points + "d=")
 */
class FloatingFeedback {
  constructor(p, x, y, scoreDelta, lifeDelta, d) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.scoreDelta = scoreDelta;
    this.lifeDelta = lifeDelta;
    this.d = d;
    this.startTime = performance.now();
    this.duration = 1800; // ms
    this.isDone = false;
  }

  update() {
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
    }
    this.y -= 0.85; // Float upward
  }

  draw(p) {
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);
    const alpha = (1 - Math.pow(progress, 2)) * 255;

    p.push();
    p.translate(this.x, this.y);
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(config.wordsStyle.fontFamily || 'Space Mono');

    // Score label (Line 1)
    let scoreText = '';
    let scoreColor;
    if (this.scoreDelta > 0) {
      scoreText = `+${this.scoreDelta} PTS`;
      scoreColor = p.color(0, 230, 118);
    } else {
      scoreText = `${this.scoreDelta} PTS`;
      scoreColor = p.color(255, 23, 68);
    }

    if (this.lifeDelta > 0) {
      scoreText += ' (+1 ❤️)';
    } else if (this.lifeDelta < 0) {
      scoreText += ' (-1 💔)';
    }

    // Line 2: Distance label: "d = 0.XX"
    const distText = `d = ${this.d.toFixed(2)}`;

    // Background pill for contrast
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(5, 11, 20, 210 * (alpha / 255));
    p.rect(0, 0, 150, 52, 10);
    p.strokeWeight(1);
    p.stroke(255, 255, 255, 60 * (alpha / 255));
    p.rect(0, 0, 150, 52, 10);

    // Draw Line 1
    scoreColor.setAlpha(alpha);
    p.fill(scoreColor);
    p.textSize(15);
    p.textStyle(p.BOLD);
    p.text(scoreText, 0, -11);

    // Draw Line 2 (d=)
    let dColor = this.d > 0.5 ? p.color(0, 240, 255) : p.color(255, 171, 0);
    dColor.setAlpha(alpha);
    p.fill(dColor);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.text(distText, 0, 12);

    p.pop();
  }
}

/**
 * Initialize Server API Configuration Loading
 */
async function loadServerConfig() {
  try {
    const res = await fetch('/api/game-config');
    if (res.ok) {
      const serverCfg = await res.json();
      config = deepMerge(config, serverCfg);
      console.log('[Game] Configuración cargada del servidor:', config);
    }
  } catch (e) {
    console.warn('[Game] No se pudo cargar configuración del servidor, usando defaults.', e);
  }
  syncSettingsUI();
  if (shaderBg) {
    shaderBg.updateConfig(config.shaderBg);
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

/**
 * Save configuration to server via POST /api/game-config
 */
async function saveServerConfig() {
  readSettingsUI();
  try {
    const res = await fetch('/api/game-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (res.ok) {
      showToast('Configuración guardada en el servidor exitosamente', 'success');
      if (shaderBg) {
        shaderBg.updateConfig(config.shaderBg);
      }
      // Update word sizes in case font/size changed
      for (const w of gameState.words) {
        w.updateSize();
      }
    } else {
      showToast('Error al guardar en el servidor', 'error');
    }
  } catch (err) {
    console.error('Error guardando configuración:', err);
    showToast('Error de conexión con el servidor', 'error');
  }
}

/**
 * HUD & Toast Helpers
 */
function updateHUD() {
  // Update lives display
  const container = document.getElementById('hud-lives-list');
  if (container) {
    container.innerHTML = '';
    const maxLives = Math.max(config.gameplay.initialLives, gameState.lives);
    for (let i = 0; i < maxLives; i++) {
      const span = document.createElement('span');
      span.className = 'life-heart' + (i < gameState.lives ? '' : ' lost');
      span.textContent = '❤️';
      container.appendChild(span);
    }
  }

  // Update Score
  const scoreEl = document.getElementById('hud-score-display');
  if (scoreEl) {
    scoreEl.textContent = gameState.score;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/**
 * Settings UI Binding & Synchronization
 */
function syncSettingsUI() {
  // Gameplay
  setVal('cfg-initial-lives', config.gameplay.initialLives);
  setVal('cfg-word-lifetime', config.gameplay.wordLifetime);
  setVal('cfg-min-speed', config.gameplay.minSpeed);
  setVal('cfg-max-speed', config.gameplay.maxSpeed);
  setVal('cfg-spawn-interval', config.gameplay.spawnInterval);
  setVal('cfg-max-words', config.gameplay.maxWordsOnScreen);
  setVal('cfg-thresh-points-minus', Number(config.gameplay.thresholdPointsMinus).toFixed(2));
  setVal('cfg-thresh-points-plus', Number(config.gameplay.thresholdPointsPlus).toFixed(2));
  setVal('cfg-thresh-life-plus', Number(config.gameplay.thresholdLifePlus).toFixed(2));
  setVal('cfg-thresh-life-minus', Number(config.gameplay.thresholdLifeMinus).toFixed(2));
  setVal('cfg-points-gain', config.gameplay.pointsBaseGain);
  setVal('cfg-points-loss', config.gameplay.pointsBaseLoss);

  // Words Style
  setVal('cfg-font-family', config.wordsStyle.fontFamily);
  setVal('cfg-font-size', config.wordsStyle.fontSize);
  setVal('cfg-text-color', config.wordsStyle.textColor);
  setVal('cfg-border-color', config.wordsStyle.borderColor);
  setVal('cfg-border-width', config.wordsStyle.borderWidth);
  setCheck('cfg-show-network', config.wordsStyle.showNetworkLines !== false);
  setVal('cfg-max-line-dist', config.wordsStyle.maxLineDist || 200);
  setVal('cfg-line-width', config.wordsStyle.lineWidth || 1.5);

  // Shader
  setCheck('cfg-shader-enabled', config.shaderBg.enabled);
  setCheck('cfg-shader-noise-only', config.shaderBg.asciiNoiseOnly);
  setVal('cfg-shader-opacity', config.shaderBg.opacity);
  setVal('cfg-shader-speed', config.shaderBg.speed);
  setVal('cfg-shader-tile', config.shaderBg.tile);
  setVal('cfg-shader-charsize', config.shaderBg.charSize);
  setVal('cfg-shader-glyphscale', config.shaderBg.glyphScale);
  setVal('cfg-shader-fontmode', config.shaderBg.fontMode);
  setVal('cfg-shader-color1', config.shaderBg.color1);
  setVal('cfg-shader-color2', config.shaderBg.color2);
  setVal('cfg-shader-color3', config.shaderBg.color3);
  setVal('cfg-shader-color4', config.shaderBg.color4);

  // Custom Wording
  if (!config.customWording) {
    config.customWording = { mode: 'random', words: ['TIEMPO', 'FUEGO', 'LIBERTAD', 'UNIVERSO', 'MEMORIA', 'FILOSOFÍA'] };
  }
  setCustomWordingMode(config.customWording.mode || 'random');
  renderCustomWordsList();

  updateValBadges();
  updateHUDGuide();
}

function readSettingsUI() {
  // Gameplay
  config.gameplay.initialLives = parseInt(getVal('cfg-initial-lives')) || 3;
  config.gameplay.wordLifetime = parseFloat(getVal('cfg-word-lifetime')) || 10;
  config.gameplay.minSpeed = parseFloat(getVal('cfg-min-speed')) || 0.5;
  config.gameplay.maxSpeed = parseFloat(getVal('cfg-max-speed')) || 4.5;
  config.gameplay.spawnInterval = Math.max(0.1, parseFloat(Number(getVal('cfg-spawn-interval')).toFixed(2)) || 1.0);
  config.gameplay.maxWordsOnScreen = Math.min(100, Math.max(1, parseInt(getVal('cfg-max-words')) || 14));
  config.gameplay.thresholdPointsMinus = Math.max(0, Math.min(1, parseFloat(Number(getVal('cfg-thresh-points-minus')).toFixed(2)) || 0.5));
  config.gameplay.thresholdPointsPlus = Math.max(0, Math.min(1, parseFloat(Number(getVal('cfg-thresh-points-plus')).toFixed(2)) || 0.5));
  config.gameplay.thresholdLifePlus = Math.max(0, Math.min(1, parseFloat(Number(getVal('cfg-thresh-life-plus')).toFixed(2)) || 0.9));
  config.gameplay.thresholdLifeMinus = Math.max(0, Math.min(1, parseFloat(Number(getVal('cfg-thresh-life-minus')).toFixed(2)) || 0.4));
  config.gameplay.pointsBaseGain = parseInt(getVal('cfg-points-gain')) || 100;
  config.gameplay.pointsBaseLoss = parseInt(getVal('cfg-points-loss')) || 50;

  // Words Style
  config.wordsStyle.fontFamily = getVal('cfg-font-family') || 'Space Mono';
  config.wordsStyle.fontSize = parseInt(getVal('cfg-font-size')) || 18;
  config.wordsStyle.textColor = getVal('cfg-text-color') || '#ffffff';
  config.wordsStyle.borderColor = getVal('cfg-border-color') || '#00f0ff';
  config.wordsStyle.borderWidth = parseInt(getVal('cfg-border-width')) || 2;
  config.wordsStyle.showNetworkLines = getCheck('cfg-show-network');
  config.wordsStyle.maxLineDist = parseInt(getVal('cfg-max-line-dist')) || 200;
  config.wordsStyle.lineWidth = parseFloat(getVal('cfg-line-width')) || 1.5;

  // Shader
  config.shaderBg.enabled = getCheck('cfg-shader-enabled');
  config.shaderBg.asciiNoiseOnly = getCheck('cfg-shader-noise-only');
  config.shaderBg.opacity = parseFloat(getVal('cfg-shader-opacity')) || 0.75;
  config.shaderBg.speed = parseFloat(getVal('cfg-shader-speed')) || 0.35;
  config.shaderBg.tile = parseFloat(getVal('cfg-shader-tile')) || 2.0;
  config.shaderBg.charSize = parseFloat(getVal('cfg-shader-charsize')) || 14;
  config.shaderBg.glyphScale = parseFloat(getVal('cfg-shader-glyphscale')) || 0.85;
  config.shaderBg.fontMode = parseInt(getVal('cfg-shader-fontmode')) || 0;
  config.shaderBg.color1 = getVal('cfg-shader-color1') || '#00e5ff';
  config.shaderBg.color2 = getVal('cfg-shader-color2') || '#7c4dff';
  config.shaderBg.color3 = getVal('cfg-shader-color3') || '#ff1744';
  config.shaderBg.color4 = getVal('cfg-shader-color4') || '#00e676';

  if (!config.customWording) {
    config.customWording = { mode: 'random', words: [] };
  }

  updateHUDGuide();
}

/**
 * Custom Wording UI Management & Event Handlers
 */
function renderCustomWordsList() {
  const container = document.getElementById('custom-words-list');
  const countEl = document.getElementById('custom-words-count');
  if (!container) return;

  if (!config.customWording) {
    config.customWording = { mode: 'random', words: [] };
  }
  const words = config.customWording.words || [];

  if (countEl) countEl.textContent = words.length;

  if (words.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px;">No hay palabras en la lista. Agrega palabras usando el campo de arriba.</div>`;
    return;
  }

  container.innerHTML = words.map((w, idx) => `
    <div class="custom-word-item" data-idx="${idx}">
      <span class="custom-word-idx">#${idx + 1}</span>
      <input type="text" class="custom-word-input-edit" value="${escapeHtml(w)}" data-idx="${idx}" spellcheck="false" />
      <button type="button" class="btn-word-action btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Subir posición">⬆</button>
      <button type="button" class="btn-word-action btn-move-down" data-idx="${idx}" ${idx === words.length - 1 ? 'disabled' : ''} title="Bajar posición">⬇</button>
      <button type="button" class="btn-word-action btn-delete" data-idx="${idx}" title="Eliminar palabra">🗑️</button>
    </div>
  `).join('');

  // Event listeners for editable text inputs
  container.querySelectorAll('.custom-word-input-edit').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const newVal = e.target.value.trim().toUpperCase();
      if (newVal) {
        config.customWording.words[idx] = newVal;
      } else {
        e.target.value = config.customWording.words[idx];
      }
    });
  });

  // Event listeners for Move Up buttons
  container.querySelectorAll('.btn-move-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      if (idx > 0) {
        const temp = words[idx];
        words[idx] = words[idx - 1];
        words[idx - 1] = temp;
        renderCustomWordsList();
      }
    });
  });

  // Event listeners for Move Down buttons
  container.querySelectorAll('.btn-move-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      if (idx < words.length - 1) {
        const temp = words[idx];
        words[idx] = words[idx + 1];
        words[idx + 1] = temp;
        renderCustomWordsList();
      }
    });
  });

  // Event listeners for Delete buttons
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      words.splice(idx, 1);
      renderCustomWordsList();
    });
  });
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function addCustomWord() {
  const input = document.getElementById('cfg-custom-word-input');
  if (!input) return;
  const val = input.value.trim().toUpperCase();
  if (!val) return;

  if (!config.customWording) {
    config.customWording = { mode: 'random', words: [] };
  }
  config.customWording.words.push(val);
  input.value = '';
  renderCustomWordsList();
  showToast(`Palabra "${val}" agregada`, 'info');
}

function setCustomWordingMode(mode) {
  if (!config.customWording) {
    config.customWording = { mode: 'random', words: [] };
  }
  config.customWording.mode = mode;
  const btnRandom = document.getElementById('btn-mode-random');
  const btnCustom = document.getElementById('btn-mode-custom');
  if (btnRandom && btnCustom) {
    if (mode === 'custom') {
      btnCustom.classList.add('active');
      btnRandom.classList.remove('active');
    } else {
      btnRandom.classList.add('active');
      btnCustom.classList.remove('active');
    }
  }
  gameState.customWordIndex = 0;
}

function updateHUDGuide() {
  const guide = document.querySelector('.hud-guide');
  if (guide) {
    const tpPlus = config.gameplay.thresholdPointsPlus.toFixed(2);
    const tpMinus = config.gameplay.thresholdPointsMinus.toFixed(2);
    const tlPlus = config.gameplay.thresholdLifePlus.toFixed(2);
    const tlMinus = config.gameplay.thresholdLifeMinus.toFixed(2);
    guide.innerHTML = `
      <span class="rule-good"><strong>D &gt; ${tpPlus}</strong>: +PUNTOS</span>
      <span class="rule-bad"><strong>D &lt; ${tpMinus}</strong>: -PUNTOS</span>
      <span class="rule-good"><strong>D &gt; ${tlPlus}</strong>: +1 VIDA ❤️</span>
      <span class="rule-bad"><strong>D &lt; ${tlMinus}</strong>: -1 VIDA 💔</span>
      <span>AJUSTA TODO CON <kbd style="color:var(--accent-cyan);">P</kbd></span>
    `;
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.value = val;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : null;
}

function setCheck(id, bool) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(bool);
}

function getCheck(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function updateValBadges() {
  document.querySelectorAll('[data-bind-badge]').forEach(badge => {
    const inputId = badge.getAttribute('data-bind-badge');
    const input = document.getElementById(inputId);
    if (input) {
      if (input.step === '0.01' || input.id.includes('thresh')) {
        badge.textContent = Number(input.value).toFixed(2);
      } else if (input.id === 'cfg-spawn-interval') {
        badge.textContent = Number(input.value).toFixed(2);
      } else {
        badge.textContent = input.value;
      }
    }
  });
}

function toggleSettingsDrawer() {
  const drawer = document.getElementById('settings-drawer');
  if (!drawer) return;
  drawer.classList.toggle('open');
}

/**
 * Intelligent Semantic Word Spawning
 * Ensures a dynamic spread of semantic distances across the vector field:
 * - Near words (traps/hazards: d < 0.50 and d < 0.40)
 * - Distant words (rewards/synergy: d >= 0.90 up to 1.0)
 * - Ambient variety
 */
function findNearWord(targetText) {
  if (!vectorEngine || !vectorEngine.isLoaded) return null;
  const res = vectorEngine.getNearestNeighbors(targetText, { k: 8, filterSignifier: true });
  if (!res || !res.neighbors) return null;

  const activeWordsSet = new Set(gameState.words.map(w => w.text.toLowerCase()));
  const valid = res.neighbors.filter(n => {
    const d = 1 - n.similarity;
    return d < 0.50 && !activeWordsSet.has(n.word.toLowerCase());
  });

  if (valid.length) {
    return valid[Math.floor(Math.random() * valid.length)].word.toUpperCase();
  }
  return null;
}

function findDistantWord(targetText) {
  if (!vectorEngine || !vectorEngine.isLoaded) return null;
  const targetVec = vectorEngine.getVector(targetText);
  if (!targetVec) return null;

  const activeWordsSet = new Set(gameState.words.map(w => w.text.toLowerCase()));
  let bestCandidate = null;
  let maxDistance = 0;

  // Evaluate candidate pool for extreme distance (d >= 0.90)
  for (let i = 0; i < 40; i++) {
    const cand = gameState.filteredVocab[Math.floor(Math.random() * gameState.filteredVocab.length)];
    if (!cand || activeWordsSet.has(cand.toLowerCase())) continue;
    const cVec = vectorEngine.getVector(cand);
    if (!cVec) continue;

    let dot = 0;
    for (let j = 0; j < 300; j++) dot += targetVec[j] * cVec[j];
    const d = 1 - dot;

    if (d >= 0.90) {
      return cand.toUpperCase();
    }
    if (d > maxDistance) {
      maxDistance = d;
      bestCandidate = cand;
    }
  }

  return bestCandidate ? bestCandidate.toUpperCase() : null;
}

function spawnRandomWord(p) {
  if (gameState.words.length >= config.gameplay.maxWordsOnScreen) return;

  let text = null;

  // Check if Custom Wording Mode is active and has words
  if (config.customWording && config.customWording.mode === 'custom' && config.customWording.words && config.customWording.words.length > 0) {
    const customList = config.customWording.words;
    const wordIndex = gameState.customWordIndex % customList.length;
    text = customList[wordIndex];
    gameState.customWordIndex++;
  } else {
    // Normal random mode using 300D model
    if (!gameState.filteredVocab || !gameState.filteredVocab.length) return;
    const roll = Math.random();

    // If words exist on screen, balance distances across the vector space
    if (gameState.words.length > 0) {
      const activeSeed = gameState.words[Math.floor(Math.random() * gameState.words.length)].text;
      if (roll < 0.40) {
        text = findNearWord(activeSeed);
      } else if (roll < 0.75) {
        text = findDistantWord(activeSeed);
      }
    }

    if (!text) {
      const idx = Math.floor(Math.random() * gameState.filteredVocab.length);
      text = gameState.filteredVocab[idx];
    }
  }

  text = (text || '').toUpperCase();

  // Random velocity between minSpeed and maxSpeed
  const minSpd = config.gameplay.minSpeed;
  const maxSpd = config.gameplay.maxSpeed;
  const speed = p.random(minSpd, maxSpd);
  const angle = p.random(p.TWO_PI);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  // Safe position to prevent spawning on top of existing words
  let x = p.random(110, p.width - 110);
  let y = p.random(110, p.height - 110);

  for (let attempt = 0; attempt < 8; attempt++) {
    let overlapping = false;
    for (const w of gameState.words) {
      if (Math.abs(w.x - x) < 130 && Math.abs(w.y - y) < 45) {
        overlapping = true;
        break;
      }
    }
    if (!overlapping) break;
    x = p.random(110, p.width - 110);
    y = p.random(110, p.height - 110);
  }

  const word = new Word(p, text, x, y, vx, vy, config.gameplay.wordLifetime);
  gameState.words.push(word);
}

/**
 * Anti-Overlap Physical Collision Resolution
 * Prevents words from ever superimposing on each other by calculating
 * bounding-pill overlap, separating positions, and applying elastic momentum bounce.
 */
function resolveWordCollisions(boundsW, boundsH) {
  const words = gameState.words;
  const n = words.length;
  if (n < 2) return;

  const margin = 8; // Extra padding between pills to prevent border touching
  const restitution = 0.75; // Damped elastic coefficient
  const passes = 2; // Multi-body relaxation passes for clean stability

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < n; i++) {
      const a = words[i];
      if (a.dissolving) continue;

      for (let j = i + 1; j < n; j++) {
        const b = words[j];
        if (b.dissolving) continue;

        // While a word is actively dragged by mouse, allow player to aim for intentional collision
        if (a.isDragging || b.isDragging) continue;

        const hwA = a.width * 0.5;
        const hhA = a.height * 0.5;
        const hwB = b.width * 0.5;
        const hhB = b.height * 0.5;

        const reqX = hwA + hwB + margin;
        const reqY = hhA + hhB + margin;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX < reqX && absY < reqY) {
          const penX = reqX - absX;
          const penY = reqY - absY;

          if (penX < penY) {
            // Horizontal separation
            const signX = dx >= 0 ? 1 : -1;
            const shift = penX * 0.5;

            a.x -= signX * shift;
            b.x += signX * shift;

            // Elastic bounce along X
            const vRelX = (b.vx - a.vx) * signX;
            if (vRelX < 0) {
              const impulse = -(1 + restitution) * vRelX * 0.5;
              a.vx -= signX * impulse;
              b.vx += signX * impulse;
            }
            // Repulsion bias to guarantee clean separation
            a.vx -= signX * 0.15;
            b.vx += signX * 0.15;
          } else {
            // Vertical separation
            const signY = dy >= 0 ? 1 : -1;
            const shift = penY * 0.5;

            a.y -= signY * shift;
            b.y += signY * shift;

            // Elastic bounce along Y
            const vRelY = (b.vy - a.vy) * signY;
            if (vRelY < 0) {
              const impulse = -(1 + restitution) * vRelY * 0.5;
              a.vy -= signY * impulse;
              b.vy += signY * impulse;
            }
            // Repulsion bias
            a.vy -= signY * 0.15;
            b.vy += signY * 0.15;
          }

          clampWordSpeed(a);
          clampWordSpeed(b);
        }
      }

      // Keep words within bounds
      const hw = a.width * 0.5;
      const hh = a.height * 0.5;
      if (a.x - hw < 15) {
        a.x = 15 + hw;
        a.vx = Math.abs(a.vx);
      } else if (a.x + hw > boundsW - 15) {
        a.x = boundsW - 15 - hw;
        a.vx = -Math.abs(a.vx);
      }

      if (a.y - hh < 70) {
        a.y = 70 + hh;
        a.vy = Math.abs(a.vy);
      } else if (a.y + hh > boundsH - 45) {
        a.y = boundsH - 45 - hh;
        a.vy = -Math.abs(a.vy);
      }
    }
  }
}

function clampWordSpeed(w) {
  const spdSq = w.vx * w.vx + w.vy * w.vy;
  const minSpd = config.gameplay.minSpeed;
  const maxSpd = config.gameplay.maxSpeed;
  if (spdSq < minSpd * minSpd && spdSq > 0.0001) {
    const spd = Math.sqrt(spdSq);
    w.vx = (w.vx / spd) * minSpd;
    w.vy = (w.vy / spd) * minSpd;
  } else if (spdSq > maxSpd * maxSpd) {
    const spd = Math.sqrt(spdSq);
    w.vx = (w.vx / spd) * maxSpd;
    w.vy = (w.vy / spd) * maxSpd;
  }
}

/**
 * Semantic Network Constellation
 * Draws interconnected lines between words with colors mapped directly
 * to their semantic distance d in [0, 1]:
 * - d < 0.40: Crimson Red (#ff1744 - Close / Penalty hazard)
 * - 0.40 <= d < 0.65: Amber Gold (#ffab00 - Medium proximity)
 * - 0.65 <= d < 0.85: Electric Cyan (#00f0ff - Synergistic distance / +Points)
 * - d >= 0.85: Neon Emerald (#00e676 - Extreme opposite / +1 Life bonus)
 */
const similarityCache = new Map();

function calculateFallbackSimilarity(a, b) {
  if (a === b) return 1.0;
  let matches = 0;
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  const charSim = matches / Math.max(a.length, b.length);
  let hash = 0;
  const combined = a < b ? a + b : b + a;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const normHash = (Math.abs(hash) % 1000) / 1000;
  return charSim * 0.35 + normHash * 0.65;
}

function getCachedSemanticDistance(wordA, wordB) {
  if (!vectorEngine || !vectorEngine.isLoaded) return 0.5;
  const tA = wordA.toLowerCase().trim();
  const tB = wordB.toLowerCase().trim();
  const key = tA < tB ? `${tA}|${tB}` : `${tB}|${tA}`;

  if (similarityCache.has(key)) {
    return similarityCache.get(key);
  }

  let sim = 0.5;
  if (vectorEngine.hasWord && vectorEngine.hasWord(tA) && vectorEngine.hasWord(tB)) {
    const res = vectorEngine.calculateSimilarity(tA, tB);
    sim = res ? res.similarity : 0.5;
  } else {
    sim = calculateFallbackSimilarity(tA, tB);
  }

  const d = Math.max(0, Math.min(1, 1 - sim));
  similarityCache.set(key, d);

  if (similarityCache.size > 8000) {
    similarityCache.clear();
  }
  return d;
}

function getSemanticColor(p, d, alpha = 255) {
  let c;
  const cRed = p.color(255, 23, 68);     // d = 0.00 (Cercanía máxima / Peligro)
  const cAmber = p.color(255, 171, 0);   // d = 0.45 (Cercanía moderada / Advertencia)
  const cCyan = p.color(0, 240, 255);    // d = 0.70 (Distancia sinérgica / +Puntos)
  const cGreen = p.color(0, 230, 118);   // d = 0.90 (Gran distancia / +1 Vida)
  const cViolet = p.color(224, 64, 251); // d = 1.00 (Ultra distancia)

  if (d < 0.45) {
    const t = Math.max(0, d / 0.45);
    c = p.lerpColor(cRed, cAmber, t);
  } else if (d < 0.70) {
    const t = (d - 0.45) / 0.25;
    c = p.lerpColor(cAmber, cCyan, t);
  } else if (d < 0.90) {
    const t = (d - 0.70) / 0.20;
    c = p.lerpColor(cCyan, cGreen, t);
  } else {
    const t = Math.min(1, (d - 0.90) / 0.10);
    c = p.lerpColor(cGreen, cViolet, t);
  }
  c.setAlpha(alpha);
  return c;
}

function drawSemanticNetwork(p) {
  if (config.wordsStyle.showNetworkLines === false) return;
  const words = gameState.words;
  const n = words.length;
  if (n < 2) return;

  const maxDist = Number(config.wordsStyle.maxLineDist) || 200;
  const maxDistSq = maxDist * maxDist;
  const baseWeight = Number(config.wordsStyle.lineWidth) || 1.5;
  const dragged = gameState.draggedWord;

  p.push();

  // Find the closest word to draggedWord for active tethering
  let closestToDragged = null;
  let minDraggedDist = Infinity;
  if (dragged) {
    for (let i = 0; i < n; i++) {
      const w = words[i];
      if (w === dragged || w.dissolving) continue;
      const d = p.dist(dragged.x, dragged.y, w.x, w.y);
      if (d < maxDist * 1.5 && d < minDraggedDist) {
        minDraggedDist = d;
        closestToDragged = w;
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const a = words[i];
    if (a.dissolving) continue;

    for (let j = i + 1; j < n; j++) {
      const b = words[j];
      if (b.dissolving) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > maxDistSq && !(dragged && (a === dragged || b === dragged) && distSq < maxDistSq * 2.25)) {
        continue;
      }

      const dist = Math.sqrt(distSq);
      const isConnectedToDragged = (a === dragged || b === dragged);
      const isClosestTether = isConnectedToDragged && (a === closestToDragged || b === closestToDragged);
      const isConnectedToHover = (a.hover || b.hover);

      const proximity = Math.max(0, 1 - (dist / (isConnectedToDragged ? maxDist * 1.5 : maxDist)));
      const lifeFade = Math.min(a.remainingLifeRatio, b.remainingLifeRatio);
      const d = getCachedSemanticDistance(a.text, b.text);

      let alpha = proximity * 210 * lifeFade;
      let strokeW = baseWeight;

      if (isClosestTether) {
        alpha = Math.min(255, alpha * 2.2 + 70);
        strokeW = baseWeight * 2.4;
      } else if (isConnectedToDragged) {
        alpha = Math.min(255, alpha * 1.8 + 35);
        strokeW = baseWeight * 1.8;
      } else if (isConnectedToHover) {
        alpha = Math.min(255, alpha * 1.4 + 20);
        strokeW = baseWeight * 1.4;
      }

      if (alpha <= 3) continue;

      const isGoodMatch = d > config.gameplay.thresholdPointsPlus;
      const isBadMatch = d < config.gameplay.thresholdPointsMinus;
      const isLifeBonus = d > config.gameplay.thresholdLifePlus;
      const isLifeLoss = d < config.gameplay.thresholdLifeMinus;

      if (isClosestTether) {
        // High-impact Energy Beam for the active dragged connection
        const time = performance.now();
        p.drawingContext.setLineDash([]);

        if (isBadMatch) {
          // FIERY CRACKLING BEAM
          p.stroke(255, 23, 68, 120 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 3.5);
          p.line(a.x, a.y, b.x, b.y);

          // Mid blazing flame stroke
          p.stroke(255, 110, 20, 220 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 2.0);
          p.line(a.x, a.y, b.x, b.y);

          // Hot inner core
          p.stroke(255, 240, 160, 255 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 0.9);
          p.line(a.x, a.y, b.x, b.y);
        } else {
          // GREEN ELECTRIC PLASMA BEAM
          p.stroke(0, 230, 118, 130 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 3.5);
          p.line(a.x, a.y, b.x, b.y);

          // Bright neon emerald plasma
          p.stroke(57, 255, 20, 230 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 2.0);
          p.line(a.x, a.y, b.x, b.y);

          // Laser traveling dashes
          p.drawingContext.setLineDash([12, 6]);
          p.drawingContext.lineDashOffset = -time * 0.04;
          p.stroke(220, 255, 240, 255 * (alpha / 255) * 255);
          p.strokeWeight(strokeW * 1.0);
          p.line(a.x, a.y, b.x, b.y);
          p.drawingContext.setLineDash([]);
        }

        // Prominent Energy Feedback Badge in the middle of tether
        if (dist > 60) {
          const midX = (a.x + b.x) * 0.5;
          const midY = (a.y + b.y) * 0.5;

          let badgeColor;
          let badgeLabel;
          if (isBadMatch) {
            badgeColor = p.color(255, 23, 68);
            badgeLabel = isLifeLoss ? `💔 -1 VIDA  d=${d.toFixed(2)}` : `🔥 -PUNTOS  d=${d.toFixed(2)}`;
          } else {
            badgeColor = isLifeBonus ? p.color(0, 230, 118) : p.color(0, 240, 255);
            badgeLabel = isLifeBonus ? `❤️ +1 VIDA  d=${d.toFixed(2)}` : `⚡ +PUNTOS  d=${d.toFixed(2)}`;
          }

          p.noStroke();
          p.fill(badgeColor);
          p.circle(midX, midY, 7);

          // Floating Badge Background Pill
          const badgeWidth = 120;
          p.fill(5, 12, 24, 230);
          p.rectMode(p.CENTER);
          p.rect(midX, midY - 16, badgeWidth, 22, 6);
          p.stroke(badgeColor);
          p.strokeWeight(1.5);
          p.rect(midX, midY - 16, badgeWidth, 22, 6);

          p.noStroke();
          p.fill(badgeColor);
          p.textSize(10);
          p.textAlign(p.CENTER, p.CENTER);
          p.textStyle(p.BOLD);
          p.text(badgeLabel, midX, midY - 16);
        }
      } else {
        // Standard Constellation Network Line
        const lineColor = getSemanticColor(p, d, alpha);
        p.stroke(lineColor);
        p.strokeWeight(strokeW);
        p.drawingContext.setLineDash([]);
        p.line(a.x, a.y, b.x, b.y);
      }
    }
  }

  p.drawingContext.setLineDash([]);
  p.pop();
}

/**
 * Collision Resolution between dragged word and target word
 */
function resolveCollision(dragged, target) {
  if (!vectorEngine || !vectorEngine.isLoaded) return;

  const wordA = dragged.text;
  const wordB = target.text;
  const result = vectorEngine.calculateSimilarity(wordA, wordB);

  // Semantic similarity is cosine similarity (-1 to 1)
  const similarity = result ? result.similarity : 0;
  // Semantic distance d clamped to [0, 1]
  const d = Math.max(0, Math.min(1, 1 - similarity));

  let scoreDelta = 0;
  let lifeDelta = 0;

  // Rule checks
  // 1) Si la diferencia semantica es menor a 0.5 te resta puntos, si es mayor a 0.5 te suma puntos.
  if (d > config.gameplay.thresholdPointsPlus) {
    scoreDelta = config.gameplay.pointsBaseGain;
  } else if (d < config.gameplay.thresholdPointsMinus) {
    scoreDelta = -config.gameplay.pointsBaseLoss;
  }

  // 2) Si es mayor a .9 te suma una vida, si es menor a .4 te resta una vida
  if (d > config.gameplay.thresholdLifePlus) {
    lifeDelta = 1;
  } else if (d < config.gameplay.thresholdLifeMinus) {
    lifeDelta = -1;
  }

  // Apply state changes
  gameState.score = Math.max(0, gameState.score + scoreDelta);
  gameState.lives = Math.max(0, gameState.lives + lifeDelta);

  // Audio feedback
  if (!gameState.isAudioMuted) {
    if (lifeDelta > 0) {
      soundFX.playActivate();
    } else if (scoreDelta > 0) {
      soundFX.playCorrect();
    } else {
      soundFX.playWrong();
    }
  }

  // Midpoint for collision animation
  const midX = (dragged.x + target.x) / 2;
  const midY = (dragged.y + target.y) / 2;

  // Add Collision Animation
  gameState.animations.push(new CollisionEffect(p5Instance, midX, midY, d, scoreDelta, lifeDelta, wordA, wordB));
  // Add Floating Feedback
  gameState.floatingTexts.push(new FloatingFeedback(p5Instance, midX, midY - 20, scoreDelta, lifeDelta, d));

  // Mark words as dissolving
  dragged.dissolving = true;
  target.dissolving = true;

  updateHUD();

  // Check Game Over
  if (gameState.lives <= 0) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  gameState.isGameOver = true;
  if (!gameState.isAudioMuted) {
    soundFX.playWrong();
  }
  const modal = document.getElementById('gameover-modal');
  const finalScoreEl = document.getElementById('final-score-val');
  if (finalScoreEl) finalScoreEl.textContent = gameState.score;
  if (modal) modal.classList.remove('hidden');
}

function restartGame() {
  gameState.lives = config.gameplay.initialLives;
  gameState.score = 0;
  gameState.isGameOver = false;
  gameState.words = [];
  gameState.animations = [];
  gameState.floatingTexts = [];
  gameState.draggedWord = null;

  const modal = document.getElementById('gameover-modal');
  if (modal) modal.classList.add('hidden');
  updateHUD();
}

/**
 * Toggle Fullscreen Helper
 */
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Error intentando entrar en pantalla completa:', err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

/**
 * p5.js Sketch
 */
const sketch = (p) => {
  p5Instance = p;

  p.setup = async () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('p5-container');
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

    // Initialize Vector Engine
    vectorEngine = new SemanticVectorEngine();
    try {
      await vectorEngine.load();
      gameState.filteredVocab = filterVocab(vectorEngine.vocab);
      console.log(`[VectorEngine] Vocabulario filtrado para el juego: ${gameState.filteredVocab.length} palabras`);
    } catch (err) {
      console.error('[VectorEngine] Error cargando vectores:', err);
    }

    // Populate initial words
    for (let i = 0; i < 7; i++) {
      spawnRandomWord(p);
    }
  };

  p.draw = () => {
    p.clear(); // Transparent background so WebGL shader shows through!

    if (!gameState.isStarted) return;

    const now = performance.now();

    // Spawning timer
    if (!gameState.isGameOver && now - gameState.lastSpawnTime > config.gameplay.spawnInterval * 1000) {
      spawnRandomWord(p);
      gameState.lastSpawnTime = now;
    }

    // Update & Draw Collision Animations
    for (let i = gameState.animations.length - 1; i >= 0; i--) {
      const anim = gameState.animations[i];
      anim.update();
      anim.draw(p);
      if (anim.isDone) {
        gameState.animations.splice(i, 1);
      }
    }

    // 1. Update word positions & hover states
    for (let i = gameState.words.length - 1; i >= 0; i--) {
      const w = gameState.words[i];
      w.update(p.width, p.height);

      if (!gameState.draggedWord) {
        w.hover = w.contains(p.mouseX, p.mouseY);
      }
    }

    // 2. Compute Drag Proximity Energy State (Red Fire vs. Green Glow)
    for (const w of gameState.words) {
      w.targetEnergyIntensity = 0;
    }

    if (gameState.draggedWord && !gameState.draggedWord.dissolving) {
      const dragged = gameState.draggedWord;
      let closestTarget = null;
      let minTargetDist = Infinity;
      const proximityMaxDist = 280; // Distance aura in pixels

      for (const w of gameState.words) {
        if (w === dragged || w.dissolving) continue;
        const dPixels = p.dist(dragged.x, dragged.y, w.x, w.y);
        if (dPixels < proximityMaxDist && dPixels < minTargetDist) {
          minTargetDist = dPixels;
          closestTarget = w;
        }
      }

      if (closestTarget) {
        const semanticDist = getCachedSemanticDistance(dragged.text, closestTarget.text);
        const collisionRadius = Number(config.gameplay.collisionRadius) || 48;

        // Proximity ramp from 0.0 at proximityMaxDist to 1.0 at collisionRadius
        const rawFactor = Math.max(0, Math.min(1, 1 - (minTargetDist - collisionRadius) / (proximityMaxDist - collisionRadius)));
        const intensity = Math.pow(rawFactor, 0.85);

        // Scoring rules: d < minus => BAD (fire), d > plus => GOOD (green)
        const isGood = semanticDist > config.gameplay.thresholdPointsPlus;
        const isBad = semanticDist < config.gameplay.thresholdPointsMinus;

        let energyType;
        if (isGood) {
          energyType = 'green';
        } else if (isBad) {
          energyType = 'fire';
        } else {
          energyType = semanticDist >= 0.5 ? 'green' : 'fire';
        }

        // Apply energy state to BOTH words!
        dragged.energyType = energyType;
        dragged.targetEnergyIntensity = intensity;

        closestTarget.energyType = energyType;
        closestTarget.targetEnergyIntensity = intensity;
      }
    }

    // Update energy smoothing & particles on all words
    for (const w of gameState.words) {
      w.updateEnergy(p);
    }

    // 3. Physical Collision Resolution (Anti-Overlap)
    resolveWordCollisions(p.width, p.height);

    // 4. Draw Interconnected Semantic Constellation Lines (color mapped to d)
    drawSemanticNetwork(p);

    // 4. Draw Word Pills
    for (let i = gameState.words.length - 1; i >= 0; i--) {
      const w = gameState.words[i];
      w.draw(p);

      // Remove expired or dissolved words
      if (w.dissolveProgress >= 1 || (w.isExpired() && !w.isDragging)) {
        gameState.words.splice(i, 1);
      }
    }

    // 5. Update & Draw Floating Text Feedback
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
      const ft = gameState.floatingTexts[i];
      ft.update();
      ft.draw(p);
      if (ft.isDone) {
        gameState.floatingTexts.splice(i, 1);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.mousePressed = () => {
    if (gameState.isGameOver || !gameState.isStarted) return;

    // Check if clicked inside settings drawer or HUD
    const drawer = document.getElementById('settings-drawer');
    if (drawer && drawer.classList.contains('open') && p.mouseX > p.width - drawer.offsetWidth) {
      return;
    }

    for (let i = gameState.words.length - 1; i >= 0; i--) {
      const w = gameState.words[i];
      if (w.contains(p.mouseX, p.mouseY) && !w.dissolving) {
        gameState.draggedWord = w;
        w.isDragging = true;
        gameState.dragOffset.x = w.x - p.mouseX;
        gameState.dragOffset.y = w.y - p.mouseY;

        const container = document.getElementById('p5-container');
        if (container) container.classList.add('grabbing');

        if (!gameState.isAudioMuted) soundFX.playHover();
        break;
      }
    }
  };

  p.mouseDragged = () => {
    if (gameState.draggedWord) {
      gameState.draggedWord.x = p.mouseX + gameState.dragOffset.x;
      gameState.draggedWord.y = p.mouseY + gameState.dragOffset.y;

      // Check dynamic collision during drag
      const collisionRadius = Number(config.gameplay.collisionRadius) || 48;
      for (const other of gameState.words) {
        if (other !== gameState.draggedWord && !other.dissolving) {
          const dist = p.dist(gameState.draggedWord.x, gameState.draggedWord.y, other.x, other.y);
          if (dist < collisionRadius) {
            resolveCollision(gameState.draggedWord, other);
            gameState.draggedWord.isDragging = false;
            gameState.draggedWord = null;
            const container = document.getElementById('p5-container');
            if (container) container.classList.remove('grabbing');
            break;
          }
        }
      }
    }
  };

  p.mouseReleased = () => {
    if (gameState.draggedWord) {
      // Check if released over another word
      const collisionRadius = Number(config.gameplay.collisionRadius) || 48;
      for (const other of gameState.words) {
        if (other !== gameState.draggedWord && !other.dissolving) {
          const dist = p.dist(gameState.draggedWord.x, gameState.draggedWord.y, other.x, other.y);
          if (dist < collisionRadius * 1.3) {
            resolveCollision(gameState.draggedWord, other);
            break;
          }
        }
      }

      if (gameState.draggedWord) {
        gameState.draggedWord.isDragging = false;
        gameState.draggedWord = null;
      }

      const container = document.getElementById('p5-container');
      if (container) container.classList.remove('grabbing');
    }
  };
};

/**
 * Global Keyboard & Event Listeners
 */
window.addEventListener('keydown', (e) => {
  // Check if typing inside an input or textarea
  const active = document.activeElement;
  const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
  if (isInput) return;

  // Tecla P: abrir/cerrar interfaz de configuración
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    toggleSettingsDrawer();
  }

  // Tecla F: Fullscreen
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    toggleFullScreen();
  }

  // Tecla M: Mute
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    gameState.isAudioMuted = !gameState.isAudioMuted;
    const btn = document.getElementById('btn-mute-audio');
    if (btn) btn.textContent = gameState.isAudioMuted ? '🔇' : '🔊';
  }
});

// Settings inputs live listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize WebGL background
  const shaderCanvas = document.getElementById('shader-canvas');
  if (shaderCanvas) {
    shaderBg = new AsciiShaderBackground(shaderCanvas, config.shaderBg);
  }

  // Load configuration from server
  await loadServerConfig();

  // Initialize p5.js
  new window.p5(sketch);

  // Attach UI event handlers
  document.getElementById('btn-open-settings')?.addEventListener('click', toggleSettingsDrawer);
  document.getElementById('btn-close-settings')?.addEventListener('click', toggleSettingsDrawer);
  document.getElementById('btn-save-settings')?.addEventListener('click', saveServerConfig);
  document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullScreen);
  document.getElementById('btn-retry-game')?.addEventListener('click', restartGame);

  const btnStart = document.getElementById('btn-start-game');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      gameState.isStarted = true;
      gameState.lives = config.gameplay.initialLives;
      updateHUD();
      toggleFullScreen();
      soundFX.init();
      soundFX.playActivate();
      document.getElementById('start-overlay')?.classList.add('hidden');
    });
  }

  const btnMute = document.getElementById('btn-mute-audio');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      gameState.isAudioMuted = !gameState.isAudioMuted;
      btnMute.textContent = gameState.isAudioMuted ? '🔇' : '🔊';
    });
  }

  // Attach Custom Wording event handlers
  document.getElementById('btn-mode-random')?.addEventListener('click', () => setCustomWordingMode('random'));
  document.getElementById('btn-mode-custom')?.addEventListener('click', () => setCustomWordingMode('custom'));
  document.getElementById('btn-add-custom-word')?.addEventListener('click', addCustomWord);
  document.getElementById('cfg-custom-word-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomWord();
    }
  });

  // Live updates from settings drawer controls
  const settingsInputs = document.querySelectorAll('#settings-drawer input, #settings-drawer select');
  settingsInputs.forEach(input => {
    input.addEventListener('input', () => {
      readSettingsUI();
      updateValBadges();
      if (shaderBg) {
        shaderBg.updateConfig(config.shaderBg);
      }
      for (const w of gameState.words) {
        w.updateSize();
      }
    });
  });
});
