import { semanticEngine } from './engine/semanticVectorEngine.js';
import { GraphVisualizer } from './visualizer/graphVisualizer.js';
import { GameMode } from './game/gameMode.js';
import { soundFX } from './audio/soundFX.js';

let visualizer = null;
let gameMode = null;
let currentWord = 'filosofía';
let filterSignifier = true;
let inspectedNode = null;

// DOM Elements
const loaderOverlay = document.getElementById('loader-overlay');
const loaderStatus = document.getElementById('loader-status');
const loaderBar = document.getElementById('loader-bar');

const searchInput = document.getElementById('word-search-input');
const searchBtn = document.getElementById('btn-search-word');
const autocompleteDropdown = document.getElementById('search-autocomplete');
const randomWordBtn = document.getElementById('btn-random-word');
const filterToggle = document.getElementById('toggle-filter-signifier');

const tabExplorerBtn = document.getElementById('tab-explorer-btn');
const tabGameBtn = document.getElementById('tab-game-btn');
const viewExplorer = document.getElementById('view-explorer');
const viewGame = document.getElementById('view-game');

const canvas = document.getElementById('graph-canvas');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnResetCam = document.getElementById('btn-reset-cam');

const nodeInspector = document.getElementById('node-inspector');
const btnCloseInspector = document.getElementById('btn-close-inspector');
const inspectWordEl = document.getElementById('inspect-word');
const inspectDistEl = document.getElementById('inspect-distance');
const inspectSimEl = document.getElementById('inspect-similarity');
const inspectAngleEl = document.getElementById('inspect-angle');
const inspectTypeEl = document.getElementById('inspect-type');
const vectorSparkline = document.getElementById('vector-sparkline');
const btnPivotInspect = document.getElementById('btn-pivot-inspect');

const soundToggleBtn = document.getElementById('btn-sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const infoModalBtn = document.getElementById('btn-info-modal');
const infoModal = document.getElementById('info-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

const presetChipsContainer = document.getElementById('preset-chips');

async function initApp() {
  try {
    // 1. Load Embeddings & Vocabulary
    await semanticEngine.load((progressInfo) => {
      if (loaderStatus) loaderStatus.textContent = progressInfo.status;
      if (loaderBar) loaderBar.style.width = `${progressInfo.progress * 100}%`;
    });

    // Fade out loader
    setTimeout(() => {
      loaderOverlay.classList.add('hidden');
    }, 300);

    // 2. Initialize Graph Visualizer
    visualizer = new GraphVisualizer(canvas, {
      onNodeClick: (node) => handleNodeClick(node),
      onNodeHover: (node) => handleNodeHover(node)
    });
    visualizer.start();

    // 3. Initialize Game Mode
    const gameRoot = document.getElementById('game-root');
    gameMode = new GameMode(gameRoot, {
      onPivotWord: (word) => {
        switchTab('explorer');
        exploreWord(word);
      }
    });

    // 4. Setup Event Listeners
    setupControls();

    // 5. Initial Search
    exploreWord(currentWord);

  } catch (err) {
    console.error('Initialization failed:', err);
    if (loaderStatus) {
      loaderStatus.textContent = `Error al cargar vectores: ${err.message}`;
      loaderStatus.style.color = '#ef4444';
    }
  }
}

function exploreWord(word) {
  const cleanWord = word.toLowerCase().trim();
  if (!semanticEngine.hasWord(cleanWord)) {
    alert(`La palabra "${cleanWord}" no se encuentra en el vocabulario vectorial actual. Intenta con otra palabra o selecciona una de los ejemplos.`);
    return;
  }

  currentWord = cleanWord;
  searchInput.value = cleanWord;
  autocompleteDropdown.style.display = 'none';

  const data = semanticEngine.getNearestNeighbors(cleanWord, {
    k: 8,
    filterSignifier: filterSignifier
  });

  if (!data || data.neighbors.length === 0) {
    alert(`No se encontraron suficientes vecinos semánticos para "${cleanWord}".`);
    return;
  }

  visualizer.setData(data);
  visualizer.resetCamera();

  // Show center node details in inspector initially
  showNodeInspector(visualizer.centerNode);
}

function handleNodeClick(node) {
  if (node.isCenter) {
    showNodeInspector(node);
    return;
  }

  // Clicked on a satellite neighbor:
  // Show in inspector and provide immediate pivot
  showNodeInspector(node);

  // Pivot directly to this word as the new center!
  setTimeout(() => {
    exploreWord(node.word);
  }, 150);
}

function handleNodeHover(node) {
  if (node && !nodeInspector.classList.contains('open')) {
    // Optional preview
  }
}

function showNodeInspector(node) {
  if (!node) return;
  inspectedNode = node;
  nodeInspector.classList.add('open');

  inspectWordEl.textContent = node.word;
  inspectDistEl.textContent = node.distance.toFixed(4);
  inspectSimEl.textContent = `${(node.similarity * 100).toFixed(1)}%`;

  const angle = (Math.acos(Math.max(-1, Math.min(1, node.similarity))) * 180 / Math.PI).toFixed(1);
  inspectAngleEl.textContent = `${angle}°`;

  if (node.isCenter) {
    inspectTypeEl.textContent = 'Núcleo Central';
    inspectTypeEl.style.color = '#00f0ff';
    btnPivotInspect.style.display = 'none';
  } else if (node.isSignifierTwin) {
    inspectTypeEl.textContent = 'Morfología (Significante)';
    inspectTypeEl.style.color = '#ffaa00';
    btnPivotInspect.style.display = 'block';
  } else {
    inspectTypeEl.textContent = 'Concepto (Significado Puro)';
    inspectTypeEl.style.color = '#a855f7';
    btnPivotInspect.style.display = 'block';
  }

  // Generate vector sparkline bars from the word's 300D embedding
  const vec = semanticEngine.getVector(node.word);
  if (vec) {
    vectorSparkline.innerHTML = '';
    // Sample 24 dimensions
    const sampleSize = 24;
    const step = Math.floor(vec.length / sampleSize);
    for (let i = 0; i < sampleSize; i++) {
      const val = vec[i * step];
      const bar = document.createElement('div');
      bar.className = 'spark-bar';
      const heightPercent = Math.max(10, Math.min(100, Math.abs(val) * 450));
      bar.style.height = `${heightPercent}%`;
      bar.style.backgroundColor = val >= 0 ? '#00f0ff' : '#ec4899';
      bar.title = `Dimensión ${i * step}: ${val.toFixed(3)}`;
      vectorSparkline.appendChild(bar);
    }
  }
}

function setupControls() {
  // Search submit
  searchBtn.addEventListener('click', () => {
    const val = searchInput.value.trim();
    if (val) exploreWord(val);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) exploreWord(val);
      autocompleteDropdown.style.display = 'none';
    } else if (e.key === 'Escape') {
      autocompleteDropdown.style.display = 'none';
    }
  });

  // Autocomplete on typing
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      autocompleteDropdown.style.display = 'none';
      return;
    }

    const matches = semanticEngine.searchVocab(query, 8);
    if (matches.length === 0) {
      autocompleteDropdown.style.display = 'none';
      return;
    }

    autocompleteDropdown.innerHTML = '';
    matches.forEach((w) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span>${w}</span><span style="font-size:10px; color:#64748b; font-family:var(--font-mono)">300D</span>`;
      item.addEventListener('click', () => {
        exploreWord(w);
      });
      autocompleteDropdown.appendChild(item);
    });
    autocompleteDropdown.style.display = 'block';
  });

  // Close autocomplete on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      autocompleteDropdown.style.display = 'none';
    }
  });

  // Random word
  randomWordBtn.addEventListener('click', () => {
    const randomWord = semanticEngine.getRandomWord();
    exploreWord(randomWord);
  });

  // Filter toggle
  filterToggle.addEventListener('change', () => {
    filterSignifier = filterToggle.checked;
    exploreWord(currentWord);
  });

  // Preset chips
  presetChipsContainer.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const word = chip.getAttribute('data-word');
      exploreWord(word);
    });
  });

  // Canvas zoom/camera controls
  btnZoomIn.addEventListener('click', () => {
    visualizer.targetCamera.zoom = Math.min(2.2, visualizer.targetCamera.zoom * 1.2);
  });

  btnZoomOut.addEventListener('click', () => {
    visualizer.targetCamera.zoom = Math.max(0.4, visualizer.targetCamera.zoom * 0.83);
  });

  btnResetCam.addEventListener('click', () => {
    visualizer.resetCamera();
  });

  // Inspector actions
  btnCloseInspector.addEventListener('click', () => {
    nodeInspector.classList.remove('open');
  });

  btnPivotInspect.addEventListener('click', () => {
    if (inspectedNode && !inspectedNode.isCenter) {
      exploreWord(inspectedNode.word);
    }
  });

  // Tab switching
  tabExplorerBtn.addEventListener('click', () => switchTab('explorer'));
  tabGameBtn.addEventListener('click', () => switchTab('game'));

  // Sound toggle
  soundToggleBtn.addEventListener('click', () => {
    const isEnabled = soundFX.toggle();
    soundIcon.textContent = isEnabled ? '🔊' : '🔇';
    soundToggleBtn.title = isEnabled ? 'Silenciar Sonido' : 'Activar Sonido';
  });

  // Info modal
  infoModalBtn.addEventListener('click', () => {
    infoModal.style.display = 'flex';
  });

  btnCloseModal.addEventListener('click', () => {
    infoModal.style.display = 'none';
  });

  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
      infoModal.style.display = 'none';
    }
  });
}

function switchTab(tabId) {
  if (tabId === 'explorer') {
    tabExplorerBtn.classList.add('active');
    tabGameBtn.classList.remove('active');
    viewExplorer.classList.add('active');
    viewGame.classList.remove('active');
    visualizer.resize();
  } else if (tabId === 'game') {
    tabGameBtn.classList.add('active');
    tabExplorerBtn.classList.remove('active');
    viewGame.classList.add('active');
    viewExplorer.classList.remove('active');
    gameMode.start();
  }
}

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', initApp);
