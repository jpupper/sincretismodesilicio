/**
 * Sincretismo de Silicio - Haiku Game Engine
 * Constelaciones Semánticas, Físicas Cósmicas p5.js y Generación Colaborativa de Haikus
 */

import { SemanticVectorEngine } from '../engine/semanticVectorEngine.js';
import { AsciiShaderBackground } from '../shaders/asciiShaderBackground.js';
import { soundFX } from '../audio/soundFX.js';

// Semillas poéticas por defecto sugeridas
export const POETIC_SEEDS = [
  'SILENCIO', 'LUNA', 'ALGORITMO', 'MEMORIA',
  'AGUA', 'FUEGO', 'SOMBRA', 'TIEMPO',
  'ESPEJO', 'CÓDIGO', 'SUEÑO', 'VACÍO',
  'LUZ', 'RED', 'VIENTO', 'ECO'
];

/**
 * Contador silábico poético en español con reglas métricas clásicas
 * (Sinalefas entre vocales consecutivas y compensación métrica final).
 */
export function countSpanishSyllables(verse) {
  if (!verse || typeof verse !== 'string') return 0;
  const clean = verse.trim().toLowerCase().replace(/[^a-záéíóúüñ\s]/g, '');
  if (!clean) return 0;

  const words = clean.split(/\s+/);
  let totalSyllables = 0;

  // 1. Contar sílabas fonéticas por palabra
  for (let i = 0; i < words.length; i++) {
    totalSyllables += countWordSyllables(words[i]);
  }

  // 2. Aplicar sinalefas poéticas (vocal final + vocal inicial)
  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    if (curr && next) {
      const endsInVowel = /[aeiouáéíóúü]$/.test(curr) || curr.endsWith('y');
      const startsWithVowel = /^[aeiouáéíóúüh]/.test(next);
      if (endsInVowel && startsWithVowel) {
        totalSyllables = Math.max(1, totalSyllables - 1);
      }
    }
  }

  // 3. Compensación métrica de la última palabra del verso
  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    const stress = getWordStress(lastWord);
    if (stress === 'aguda') {
      totalSyllables += 1;
    } else if (stress === 'esdrujula') {
      totalSyllables = Math.max(1, totalSyllables - 1);
    }
    // Llana: no suma ni resta
  }

  return Math.max(1, totalSyllables);
}

function countWordSyllables(word) {
  if (!word) return 0;
  // Simplificación fonética de núcleos vocálicos
  // Fuertes: a, e, o, í, ú (con tilde forman hiato)
  // Débiles: i, u, ü
  let cleaned = word.replace(/qu([ei])/g, 'k$1')
                    .replace(/gu([ei])/g, 'g$1');

  // Regex para grupos vocálicos
  const vowelGroups = cleaned.match(/[aeiouáéíóúü]+/g);
  if (!vowelGroups) return 1;

  let count = 0;
  for (const group of vowelGroups) {
    // Hiato con vocal débil tildada (ej: rí-o, dí-a, ba-úl)
    if (/[íú]/.test(group) && group.length > 1) {
      count += group.length;
    } else if (/[aeoáéó]{2}/.test(group)) {
      // Dos vocales fuertes consecutivas forman hiato (ej: ca-os, le-er, te-a-tro)
      count += group.length;
    } else {
      // Diptongo o triptongo cuenta como un solo núcleo
      count += 1;
    }
  }
  return Math.max(1, count);
}

function getWordStress(word) {
  if (!word) return 'llana';
  // Si tiene tilde, buscamos la posición del acento ortográfico
  const vowelsWithAccent = word.match(/[áéíóú]/g);
  if (vowelsWithAccent) {
    const vowelIndices = [];
    for (let i = 0; i < word.length; i++) {
      if (/[aeiouáéíóúü]/.test(word[i])) vowelIndices.push(i);
    }
    const accentIndex = word.search(/[áéíóú]/);
    const syllablePosFromEnd = vowelIndices.filter(idx => idx >= accentIndex).length;
    if (syllablePosFromEnd <= 1) return 'aguda';
    if (syllablePosFromEnd === 2) return 'llana';
    return 'esdrujula';
  }

  // Sin tilde: aguda si termina en consonante distinta de 'n' o 's'
  if (/[bcdfghjklmpqrtvwxyz]$/.test(word)) {
    return 'aguda';
  }
  // Termina en vocal, 'n' o 's' -> llana por defecto
  return 'llana';
}

/**
 * Plantillas Poéticas para Generación de Haikus (5 - 7 - 5)
 * Basadas en la tríada de conceptos y atmósfera estética
 */
function getGenderArticle(word) {
  const w = word.toLowerCase().trim();
  const isFem = w.endsWith('a') || w.endsWith('ad') || w.endsWith('ción') || w.endsWith('sión') || w === 'luz' || w === 'red' || w === 'noche';
  return {
    def: isFem ? 'la' : 'el',
    indef: isFem ? 'una' : 'un',
    dem: isFem ? 'aquella' : 'aquel',
    al: isFem ? 'a la' : 'al',
    del: isFem ? 'de la' : 'del'
  };
}

const HAIKU_TEMPLATES = {
  zen: {
    v1: [
      (w1) => { const a = getGenderArticle(w1); return `Guarda ${a.def} ${w1}`; },
      (w1) => { const a = getGenderArticle(w1); return `En ${a.def} ${w1} leve`; },
      (w1) => { const a = getGenderArticle(w1); return `Bajo ${a.def} ${w1}`; },
      (w1) => { const a = getGenderArticle(w1); return `Cae ${a.def} ${w1} mudo`; },
      (w1) => { return `Puro ${w1} en paz`; },
      (w1) => { return `Nace tu ${w1}`; }
    ],
    v2: [
      (w2) => { const a = getGenderArticle(w2); return `donde florece ${a.def} ${w2}`; },
      (w2) => { return `brisa serena y ${w2}`; },
      (w2) => { return `el agua refleja ${w2}`; },
      (w2) => { const a = getGenderArticle(w2); return `cruza en calma ${a.dem} ${w2}`; },
      (w2) => { const a = getGenderArticle(w2); return `y en la sombra duerme ${a.def} ${w2}`; }
    ],
    v3: [
      (w3) => { const a = getGenderArticle(w3); return `surge ${a.def} ${w3}`; },
      (w3) => { const a = getGenderArticle(w3); return `yace ${a.def} ${w3}`; },
      (w3) => { return `solo tu ${w3}`; },
      (w3) => { const a = getGenderArticle(w3); return `vuelve ${a.al} ${w3}`; },
      (w3) => { return `brilla fiel ${w3}`; }
    ]
  },
  silicio: {
    v1: [
      (w1) => `Pulso de ${w1}`,
      (w1) => { const a = getGenderArticle(w1); return `Luz de ${a.def} ${w1}`; },
      (w1) => `Bit en tu ${w1}`,
      (w1) => `Trazo de ${w1}`,
      (w1) => { const a = getGenderArticle(w1); return `Roto ${a.def} ${w1}`; }
    ],
    v2: [
      (w2) => `corre la red en ${w2}`,
      (w2) => `circuito y fulgor de ${w2}`,
      (w2) => { const a = getGenderArticle(w2); return `vibra en código ${a.dem} ${w2}`; },
      (w2) => `guarda el sistema tu ${w2}`,
      (w2) => { const a = getGenderArticle(w2); return `se desvanece ${a.def} ${w2}`; }
    ],
    v3: [
      (w3) => `eterno ${w3}`,
      (w3) => { const a = getGenderArticle(w3); return `brota ${a.def} ${w3}`; },
      (w3) => `guarda tu ${w3}`,
      (w3) => `quema aquel ${w3}`,
      (w3) => `vive en el bit`
    ]
  },
  cosmos: {
    v1: [
      (w1) => { const a = getGenderArticle(w1); return `En ${a.def} ${w1}`; },
      (w1) => { const a = getGenderArticle(w1); return `Gira ${a.def} ${w1}`; },
      (w1) => `Frío tu ${w1}`,
      (w1) => `Vasto ${w1}`,
      (w1) => { const a = getGenderArticle(w1); return `Ciego ${a.def} ${w1}`; }
    ],
    v2: [
      (w2) => `vuela en el éter ${w2}`,
      (w2) => `constelación de ${w2}`,
      (w2) => { const a = getGenderArticle(w2); return `orbita lento ${a.dem} ${w2}`; },
      (w2) => `hondo vacío sin ${w2}`,
      (w2) => `lejos viaja tu ${w2}`
    ],
    v3: [
      (w3) => `fuego en tu luz`,
      (w3) => { const a = getGenderArticle(w3); return `nace ${a.def} ${w3}`; },
      (w3) => { const a = getGenderArticle(w3); return `guía ${a.def} ${w3}`; },
      (w3) => `luz y verdad`,
      (w3) => `eco estelar`
    ]
  },
  filosofico: {
    v1: [
      (w1) => { const a = getGenderArticle(w1); return `Dice ${a.def} ${w1}`; },
      (w1) => `Hondo es tu ${w1}`,
      (w1) => `Breve es ${w1}`,
      (w1) => { const a = getGenderArticle(w1); return `Todo ${a.def} ${w1}`; },
      (w1) => `Sombra y sentir`
    ],
    v2: [
      (w2) => `sueño fugaz de ${w2}`,
      (w2) => `un pensamiento sin ${w2}`,
      (w2) => `huella infinita en ${w2}`,
      (w2) => { const a = getGenderArticle(w2); return `verdad que busca ${a.dem} ${w2}`; },
      (w2) => `tiempo que escapa en ti`
    ],
    v3: [
      (w3) => `solo ${w3}`,
      (w3) => { const a = getGenderArticle(w3); return `calla ${a.def} ${w3}`; },
      (w3) => { const a = getGenderArticle(w3); return `vuelve ${a.al} ${w3}`; },
      (w3) => { const a = getGenderArticle(w3); return `yace ${a.def} ${w3}`; },
      (w3) => `vive el pensar`
    ]
  }
};

/**
 * Generador procedural de versos con ajuste métrico estricto
 */
export function generateHaikuVerse(concept, verseIndex, tone = 'zen') {
  const c = concept.toLowerCase().trim();
  const theme = HAIKU_TEMPLATES[tone] || HAIKU_TEMPLATES.zen;
  const list = verseIndex === 0 ? theme.v1 : (verseIndex === 1 ? theme.v2 : theme.v3);
  const targetCount = (verseIndex === 1) ? 7 : 5;

  // Evaluar opciones para encontrar la métrica más exacta
  let bestVerse = '';
  let minDiff = 999;

  // Mezclar plantillas para variedad
  const shuffled = [...list].sort(() => Math.random() - 0.5);

  for (const templateFn of shuffled) {
    const candidate = templateFn(c);
    const count = countSpanishSyllables(candidate);
    const diff = Math.abs(count - targetCount);
    if (diff < minDiff) {
      minDiff = diff;
      bestVerse = candidate;
      if (diff === 0) break;
    }
  }

  // Si no encajó de forma perfecta, construimos una variante rítmica limpia
  if (!bestVerse) {
    if (verseIndex === 1) {
      bestVerse = `en el curso de ${c}`;
    } else if (verseIndex === 0) {
      bestVerse = `en el ${c} puro`;
    } else {
      bestVerse = `solo ${c}`;
    }
  }

  // Capitalizar primera letra
  return bestVerse.charAt(0).toUpperCase() + bestVerse.slice(1);
}

/**
 * CLASE PRINCIPAL DEL JUEGO HAIKU
 */
export class HaikuGameApp {
  constructor() {
    this.vectorEngine = new SemanticVectorEngine();
    this.asciiShader = null;
    this.p5Instance = null;

    // Estado del juego
    this.seedWord = 'SILENCIO';
    this.selectedTriad = ['SILENCIO']; // Semilla + 2 palabras seleccionadas
    this.satellites = []; // Palabras flotantes
    this.currentTone = 'zen';
    this.generatedHaiku = ['', '', ''];
    this.hoveredSatellite = null;
    this.isTriadComplete = false;

    // Parámetros
    this.config = {
      semanticThreshold: 0.58, // Umbral para considerar que dos palabras son afines
      satelliteCount: 14,
      orbitSpeed: 0.003,
      wobbleAmount: 0.8
    };

    // Cache del códice
    this.savedHaikus = this.loadCodex();

    this.init();
  }

  async init() {
    this.initShaders();
    this.bindDOM();
    this.showToast('Sincronizando espacio vectorial Laya ONNX (384D)...', 'info');

    try {
      await this.vectorEngine.load((p) => {
        // Progreso de carga
      });
      this.showToast('Espacio vectorial listo. Elige tu semilla.', 'success');
      this.openSeedModal();
    } catch (e) {
      console.warn('Error al cargar vector engine:', e);
      this.showToast('Modo autónomo activado.', 'warning');
      this.openSeedModal();
    }

    this.initP5();
  }

  initShaders() {
    const shaderCanvas = document.getElementById('shader-canvas');
    if (shaderCanvas) {
      try {
        this.asciiShader = new AsciiShaderBackground(shaderCanvas, {
          speed: 0.2,
          tile: 2.5,
          opacity: 0.65,
          color1: '#00f0ff',
          color2: '#a855f7',
          color3: '#ffcf33',
          color4: '#10b981'
        });
      } catch (e) {
        console.warn('AsciiShaderBackground no disponible en este entorno:', e);
      }
    }
  }

  bindDOM() {
    // Botones superiores
    document.getElementById('btn-open-seed')?.addEventListener('click', () => this.openSeedModal());
    document.getElementById('btn-open-codex')?.addEventListener('click', () => this.toggleCodex());
    document.getElementById('btn-close-codex')?.addEventListener('click', () => this.toggleCodex(false));
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      document.getElementById('settings-drawer')?.classList.toggle('open');
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      document.getElementById('settings-drawer')?.classList.remove('open');
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    document.getElementById('btn-mute-audio')?.addEventListener('click', (e) => {
      const isEnabled = soundFX.toggle();
      e.currentTarget.style.opacity = isEnabled ? '1' : '0.4';
      this.showToast(isEnabled ? 'Audio activado' : 'Audio silenciado', 'info');
    });

    // Modal de Semilla
    document.getElementById('btn-submit-seed')?.addEventListener('click', () => {
      const input = document.getElementById('custom-seed-input');
      const val = input ? input.value.trim().toUpperCase() : '';
      if (val) {
        this.setSeedWord(val);
      } else {
        this.setSeedWord('SILENCIO');
      }
    });

    // Píldoras de semillas
    const pillsContainer = document.getElementById('seed-presets-container');
    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      POETIC_SEEDS.forEach(seed => {
        const pill = document.createElement('button');
        pill.className = 'seed-preset-pill';
        pill.textContent = seed;
        pill.addEventListener('click', () => {
          this.setSeedWord(seed);
        });
        pillsContainer.appendChild(pill);
      });
    }

    // Modal de Altar de Haiku
    document.getElementById('btn-close-altar')?.addEventListener('click', () => {
      document.getElementById('haiku-altar-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-copy-haiku')?.addEventListener('click', () => {
      this.copyHaikuToClipboard();
    });

    document.getElementById('btn-save-codex')?.addEventListener('click', () => {
      this.saveCurrentHaikuToCodex();
    });

    document.getElementById('btn-new-universe')?.addEventListener('click', () => {
      document.getElementById('haiku-altar-modal')?.classList.add('hidden');
      this.openSeedModal();
    });

    // Botones de regeneración individual de versos
    document.querySelectorAll('.btn-verse-reroll').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const verseIdx = parseInt(e.currentTarget.getAttribute('data-verse'), 10);
        this.rerollVerse(verseIdx);
      });
    });

    // Input directo de versos (cómputo silábico dinámico)
    for (let i = 0; i < 3; i++) {
      const input = document.getElementById(`verse-input-${i}`);
      if (input) {
        input.addEventListener('input', (e) => {
          this.generatedHaiku[i] = e.target.value;
          this.updateSyllableBadges();
        });
      }
    }

    // Selector de tono poético
    document.querySelectorAll('.tone-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.tone-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTone = e.currentTarget.getAttribute('data-tone') || 'zen';
        this.generateFullHaiku();
      });
    });

    // Atajos de teclado
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        // Prevenir si está escribiendo en un input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          document.getElementById('settings-drawer')?.classList.toggle('open');
        }
      }
      if (e.key === 'Escape') {
        document.getElementById('settings-drawer')?.classList.remove('open');
        document.getElementById('codex-drawer')?.classList.remove('open');
      }
    });
  }

  setSeedWord(word) {
    this.seedWord = word.toUpperCase().trim();
    this.selectedTriad = [this.seedWord];
    this.isTriadComplete = false;
    document.getElementById('seed-modal')?.classList.add('hidden');
    document.getElementById('haiku-altar-modal')?.classList.add('hidden');

    // Actualizar HUD
    this.updateTriadHUD();
    this.spawnSatellites();
    this.showToast(`Universo forjado alrededor de "${this.seedWord}". Encuentra 2 resonancias afines.`, 'success');
  }

  spawnSatellites() {
    this.satellites = [];
    const seed = this.seedWord.toLowerCase();

    // 1. Obtener vecinos semánticos genuinos con el vector engine
    let neighbors = [];
    if (this.vectorEngine && this.vectorEngine.isLoaded) {
      const nnData = this.vectorEngine.getNearestNeighbors(seed, { k: 25, filterSignifier: true });
      if (nnData && nnData.neighbors) {
        neighbors = nnData.neighbors;
      }
    }

    // 2. Extraer candidatos cercanos (4 a 6 palabras)
    const closeCandidates = [];
    for (const item of neighbors) {
      if (item.distance < this.config.semanticThreshold) {
        closeCandidates.push({ word: item.word.toUpperCase(), distance: item.distance });
      }
      if (closeCandidates.length >= 6) break;
    }

    // Si el vocabulario no arrojó suficientes por ser palabra externa, fallback a palabras afines temáticas
    if (closeCandidates.length < 3) {
      const fallbackList = ['NOCHE', 'REFLEJO', 'SOMBRA', 'ORIGEN', 'RÍO', 'ALMA', 'CRISTAL', 'SENDERO', 'DESTINO', 'ABISMO'];
      for (const fw of fallbackList) {
        if (fw !== this.seedWord) {
          closeCandidates.push({ word: fw, distance: 0.38 + Math.random() * 0.15 });
        }
        if (closeCandidates.length >= 5) break;
      }
    }

    // 3. Extraer candidatos medios (4 palabras)
    const mediumCandidates = [];
    for (const item of neighbors) {
      if (item.distance >= this.config.semanticThreshold && item.distance < 0.75) {
        mediumCandidates.push({ word: item.word.toUpperCase(), distance: item.distance });
      }
      if (mediumCandidates.length >= 4) break;
    }
    if (mediumCandidates.length < 3) {
      const fallMed = ['CAMINO', 'PUERTA', 'ESTATUA', 'HORIZONTE', 'TIEMPO', 'VOLUNTAD'];
      for (const fm of fallMed) {
        mediumCandidates.push({ word: fm, distance: 0.62 + Math.random() * 0.1 });
        if (mediumCandidates.length >= 4) break;
      }
    }

    // 4. Extraer candidatos lejanos/distractores (3 palabras)
    const distantCandidates = [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const item = neighbors[i];
      if (item.distance >= 0.75) {
        distantCandidates.push({ word: item.word.toUpperCase(), distance: item.distance });
      }
      if (distantCandidates.length >= 4) break;
    }
    if (distantCandidates.length < 3) {
      const fallFar = ['TORNILLO', 'GASOLINA', 'PARKING', 'NEUMÁTICO', 'ALAMBRE'];
      for (const ff of fallFar) {
        distantCandidates.push({ word: ff, distance: 0.82 + Math.random() * 0.12 });
        if (distantCandidates.length >= 4) break;
      }
    }

    // Combinar y asignar órbitas
    const pool = [...closeCandidates, ...mediumCandidates, ...distantCandidates];
    // Mezclar el orden
    pool.sort(() => Math.random() - 0.5);

    const orbitCount = pool.length;
    pool.forEach((item, index) => {
      const angle = (Math.PI * 2 / orbitCount) * index + (Math.random() - 0.5) * 0.3;
      // Radio de órbita entre 160 y 380 px
      const baseRadius = 180 + (index % 3) * 75 + Math.random() * 40;
      const speed = (0.0015 + (Math.random() * 0.002)) * (index % 2 === 0 ? 1 : -1);

      this.satellites.push({
        word: item.word,
        distance: item.distance,
        similarityPercent: Math.round((1 - Math.min(1, item.distance)) * 100),
        angle: angle,
        orbitRadius: baseRadius,
        speed: speed,
        x: 0,
        y: 0,
        isSelected: false,
        pulseOffset: Math.random() * Math.PI * 2
      });
    });
  }

  updateTriadHUD() {
    const coreWordEl = document.getElementById('radar-core-name');
    if (coreWordEl) coreWordEl.textContent = this.seedWord;

    for (let i = 1; i <= 2; i++) {
      const slotEl = document.getElementById(`triad-slot-${i}`);
      const word = this.selectedTriad[i];
      if (slotEl) {
        if (word) {
          slotEl.className = 'triad-slot filled';
          slotEl.innerHTML = `<span class="slot-dot"></span> ${word}`;
        } else {
          slotEl.className = 'triad-slot';
          slotEl.innerHTML = `<span class="slot-dot"></span> Concepto ${i + 1}`;
        }
      }
    }
  }

  onSatelliteClick(satellite) {
    if (satellite.isSelected) return;
    soundFX.init();

    if (satellite.distance < this.config.semanticThreshold) {
      // Afinidad correcta encontrada
      satellite.isSelected = true;
      this.selectedTriad.push(satellite.word);
      this.updateTriadHUD();

      soundFX.playActivate();
      this.showToast(`¡Resonancia descubierta! "${satellite.word}" enlazada a la tríada.`, 'success');

      // Si se completaron los 3 conceptos
      if (this.selectedTriad.length >= 3) {
        this.isTriadComplete = true;
        this.showToast('¡Constelación Tríadica sellada! Abriendo el Altar del Haiku...', 'success');
        setTimeout(() => {
          this.openHaikuAltar();
        }, 1200);
      }
    } else {
      // Afinidad insuficiente
      soundFX.playWrong();
      this.showToast(`"${satellite.word}" tiene baja afinidad con "${this.seedWord}" (Distancia: ${satellite.distance.toFixed(2)}). Busca conceptos más cercanos.`, 'warning');
    }
  }

  openHaikuAltar() {
    const modal = document.getElementById('haiku-altar-modal');
    if (!modal) return;

    // Actualizar chips de la tríada
    const chip1 = document.getElementById('altar-chip-1');
    const chip2 = document.getElementById('altar-chip-2');
    const chip3 = document.getElementById('altar-chip-3');
    if (chip1) chip1.textContent = this.selectedTriad[0] || '---';
    if (chip2) chip2.textContent = this.selectedTriad[1] || '---';
    if (chip3) chip3.textContent = this.selectedTriad[2] || '---';

    this.generateFullHaiku();
    modal.classList.remove('hidden');
    soundFX.playCorrect();
  }

  generateFullHaiku() {
    for (let i = 0; i < 3; i++) {
      const concept = this.selectedTriad[i] || 'silencio';
      this.generatedHaiku[i] = generateHaikuVerse(concept, i, this.currentTone);
      const input = document.getElementById(`verse-input-${i}`);
      if (input) input.value = this.generatedHaiku[i];
    }
    this.updateSyllableBadges();
  }

  rerollVerse(verseIdx) {
    soundFX.playHover();
    const concept = this.selectedTriad[verseIdx] || 'silencio';
    this.generatedHaiku[verseIdx] = generateHaikuVerse(concept, verseIdx, this.currentTone);
    const input = document.getElementById(`verse-input-${verseIdx}`);
    if (input) input.value = this.generatedHaiku[verseIdx];
    this.updateSyllableBadges();
  }

  updateSyllableBadges() {
    const targets = [5, 7, 5];
    for (let i = 0; i < 3; i++) {
      const badge = document.getElementById(`verse-badge-${i}`);
      const count = countSpanishSyllables(this.generatedHaiku[i]);
      if (badge) {
        badge.textContent = `${count} síl`;
        if (count === targets[i]) {
          badge.style.color = 'var(--accent-green)';
          badge.style.borderColor = 'var(--accent-green)';
        } else {
          badge.style.color = 'var(--accent-cyan)';
          badge.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        }
      }
    }
  }

  copyHaikuToClipboard() {
    const text = `${this.generatedHaiku.join('\n')}\n\n— Tríada: ${this.selectedTriad.join(' · ')} (Sincretismo de Silicio)`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('¡Haiku copiado al portapapeles!', 'success');
      soundFX.playHover();
    }).catch(() => {
      this.showToast('No se pudo copiar el texto.', 'warning');
    });
  }

  saveCurrentHaikuToCodex() {
    const item = {
      id: Date.now(),
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      triad: [...this.selectedTriad],
      verses: [...this.generatedHaiku],
      tone: this.currentTone
    };
    this.savedHaikus.unshift(item);
    localStorage.setItem('sincretismo_haikus', JSON.stringify(this.savedHaikus));
    this.showToast('Haiku preservado en el Códice Cósmico.', 'success');
    soundFX.playCorrect();
    this.renderCodexList();
  }

  loadCodex() {
    try {
      const raw = localStorage.getItem('sincretismo_haikus');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  toggleCodex(forceState) {
    const drawer = document.getElementById('codex-drawer');
    if (!drawer) return;
    const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
    if (shouldOpen) {
      this.renderCodexList();
      drawer.classList.add('open');
    } else {
      drawer.classList.remove('open');
    }
  }

  renderCodexList() {
    const container = document.getElementById('codex-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.savedHaikus.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 40px;">
        Aún no has sellado ningún Haiku en el Códice.<br>Encuentra resonancias y forja tu primer poema.
      </div>`;
      return;
    }

    this.savedHaikus.forEach(item => {
      const card = document.createElement('div');
      card.className = 'codex-item-card';
      card.innerHTML = `
        <div class="codex-item-meta">
          <span>${item.date}</span>
          <span style="text-transform: uppercase; color: var(--accent-cyan);">${item.tone}</span>
        </div>
        <div class="codex-item-triad">
          <span>✨ ${item.triad.join(' · ')}</span>
        </div>
        <div class="codex-item-verses">
          ${item.verses.map(v => `<div>${v}</div>`).join('')}
        </div>
        <div class="codex-item-actions">
          <button class="btn-codex-action btn-copy-card">Copiar</button>
          <button class="btn-codex-action btn-delete-card">Eliminar</button>
        </div>
      `;

      card.querySelector('.btn-copy-card')?.addEventListener('click', () => {
        const text = `${item.verses.join('\n')}\n\n— Tríada: ${item.triad.join(' · ')}`;
        navigator.clipboard.writeText(text);
        this.showToast('Haiku copiado.', 'success');
      });

      card.querySelector('.btn-delete-card')?.addEventListener('click', () => {
        this.savedHaikus = this.savedHaikus.filter(h => h.id !== item.id);
        localStorage.setItem('sincretismo_haikus', JSON.stringify(this.savedHaikus));
        this.renderCodexList();
        this.showToast('Haiku eliminado del Códice.', 'info');
      });

      container.appendChild(card);
    });
  }

  openSeedModal() {
    const modal = document.getElementById('seed-modal');
    if (modal) modal.classList.remove('hidden');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `game-toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  /**
   * Inicialización del Canvas Interactivo con p5.js
   */
  initP5() {
    const p5Sketch = (p) => {
      p.setup = () => {
        const container = document.getElementById('p5-container');
        const w = container ? container.clientWidth : window.innerWidth;
        const h = container ? container.clientHeight : window.innerHeight;
        const canvas = p.createCanvas(w, h);
        canvas.parent('p5-container');
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Space Mono');
      };

      p.windowResized = () => {
        const container = document.getElementById('p5-container');
        const w = container ? container.clientWidth : window.innerWidth;
        const h = container ? container.clientHeight : window.innerHeight;
        p.resizeCanvas(w, h);
      };

      p.draw = () => {
        p.clear();
        const cx = p.width / 2;
        const cy = p.height / 2;

        // 1. Dibujar órbitas concéntricas sutiles
        p.noFill();
        p.stroke(0, 240, 255, 20);
        p.strokeWeight(1);
        [180, 255, 330].forEach(r => {
          p.ellipse(cx, cy, r * 2, r * 2);
        });

        // 2. Líneas de constelación fijas si hay palabras seleccionadas
        if (this.selectedTriad.length > 1) {
          p.stroke(255, 207, 51, 140);
          p.strokeWeight(2);
          const selectedNodes = this.satellites.filter(s => s.isSelected);

          selectedNodes.forEach(node => {
            // Línea del núcleo a cada palabra afín
            p.line(cx, cy, node.x, node.y);
          });

          // Si hay 3 conceptos, conectar los 2 satélites entre sí formando el triángulo
          if (selectedNodes.length >= 2) {
            p.stroke(0, 240, 255, 180);
            p.line(selectedNodes[0].x, selectedNodes[0].y, selectedNodes[1].x, selectedNodes[1].y);
          }
        }

        // 3. Actualizar y dibujar satélites
        let currentHover = null;
        const mx = p.mouseX;
        const my = p.mouseY;

        this.satellites.forEach(sat => {
          sat.angle += sat.speed * this.config.orbitSpeed * 120;
          sat.x = cx + Math.cos(sat.angle) * sat.orbitRadius;
          sat.y = cy + Math.sin(sat.angle) * sat.orbitRadius;

          // Suave oscilación radial
          sat.x += Math.sin(p.frameCount * 0.02 + sat.pulseOffset) * 6;
          sat.y += Math.cos(p.frameCount * 0.02 + sat.pulseOffset) * 6;

          const dToMouse = p.dist(mx, my, sat.x, sat.y);
          const isMouseOver = dToMouse < 45;

          if (isMouseOver) {
            currentHover = sat;
          }

          // Dibujo del nodo satélite
          p.push();
          p.translate(sat.x, sat.y);

          if (sat.isSelected) {
            // Nodo seleccionado (Brillante oro/cian)
            p.noStroke();
            p.fill(255, 207, 51, 60);
            p.ellipse(0, 0, 48, 48);

            p.stroke(255, 207, 51);
            p.strokeWeight(2);
            p.fill(8, 14, 26, 230);
            p.ellipse(0, 0, 32, 32);

            p.noStroke();
            p.fill(255, 207, 51);
            p.textSize(13);
            p.textStyle(p.BOLD);
            p.text(sat.word, 0, -28);
          } else {
            // Nodo flotante estándar
            p.noStroke();
            p.fill(0, 240, 255, isMouseOver ? 50 : 20);
            p.ellipse(0, 0, isMouseOver ? 36 : 24, isMouseOver ? 36 : 24);

            p.stroke(isMouseOver ? p.color(0, 240, 255) : p.color(0, 240, 255, 120));
            p.strokeWeight(isMouseOver ? 2 : 1);
            p.fill(6, 12, 22, 210);
            p.ellipse(0, 0, 20, 20);

            p.noStroke();
            p.fill(isMouseOver ? 255 : 200, isMouseOver ? 255 : 210, 255);
            p.textSize(isMouseOver ? 13 : 11);
            p.text(sat.word, 0, -22);
          }
          p.pop();
        });

        // 4. Si el mouse pasa sobre un satélite, dibujar rayo láser semántico y actualizar HUD inspector
        const inspectorHud = document.getElementById('distance-inspector-hud');
        if (currentHover) {
          p.stroke(0, 240, 255, 160);
          p.strokeWeight(1.5);
          p.line(cx, cy, currentHover.x, currentHover.y);

          if (this.hoveredSatellite !== currentHover) {
            soundFX.playHover();
            this.hoveredSatellite = currentHover;
          }

          if (inspectorHud) {
            inspectorHud.classList.add('visible');
            document.getElementById('insp-word').textContent = currentHover.word;
            document.getElementById('insp-affinity-val').textContent = `${currentHover.similarityPercent}%`;
            document.getElementById('insp-bar-fill').style.width = `${currentHover.similarityPercent}%`;

            const badge = document.getElementById('insp-badge');
            if (currentHover.distance < this.config.semanticThreshold) {
              badge.className = 'inspector-status-badge badge-close';
              badge.textContent = 'RESONANTE';
            } else if (currentHover.distance < 0.72) {
              badge.className = 'inspector-status-badge badge-medium';
              badge.textContent = 'DISTANCIA MEDIA';
            } else {
              badge.className = 'inspector-status-badge badge-far';
              badge.textContent = 'DISONANTE';
            }
          }
        } else {
          this.hoveredSatellite = null;
          if (inspectorHud) inspectorHud.classList.remove('visible');
        }

        // 5. Dibujar Sol Central (Semilla Semántica)
        p.push();
        p.translate(cx, cy);

        // Pulso solar
        const pulse = Math.sin(p.frameCount * 0.04) * 8;
        p.noStroke();
        p.fill(255, 207, 51, 35);
        p.ellipse(0, 0, 110 + pulse, 110 + pulse);

        p.stroke(255, 207, 51, 180);
        p.strokeWeight(2);
        p.fill(8, 14, 26, 240);
        p.ellipse(0, 0, 75, 75);

        p.noStroke();
        p.fill(255, 207, 51);
        p.textSize(15);
        p.textStyle(p.BOLD);
        p.text(this.seedWord, 0, 0);
        p.pop();
      };

      p.mousePressed = () => {
        if (this.hoveredSatellite) {
          this.onSatelliteClick(this.hoveredSatellite);
        }
      };
    };

    if (typeof window.p5 !== 'undefined') {
      this.p5Instance = new window.p5(p5Sketch);
    }
  }
}

// Iniciar aplicación al cargar en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.haikuGame = new HaikuGameApp();
  });
}
