import { semanticEngine } from './engine/semanticVectorEngine.js';
import { GraphVisualizer } from './visualizer/graphVisualizer.js';
import { Cosmos3DVisualizer } from './visualizer/cosmos3DVisualizer.js';
import { GameMode } from './game/gameMode.js';
import { soundFX } from './audio/soundFX.js';

let visualizer = null;
let cosmosVisualizer = null;
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
const tabCosmosBtn = document.getElementById('tab-cosmos-btn');
const viewExplorer = document.getElementById('view-explorer');
const viewGame = document.getElementById('view-game');
const viewCosmos = document.getElementById('view-cosmos');
const cosmosViewport = document.getElementById('cosmos-viewport');
const cosmosSearchInput = document.getElementById('cosmos-search-input');
const btnCosmosWarp = document.getElementById('btn-cosmos-warp');
const btnCosmosRandom = document.getElementById('btn-cosmos-random');

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

    // 4. Initialize 3D Cosmos Visualizer
    cosmosVisualizer = new Cosmos3DVisualizer(cosmosViewport, {
      onSelectWord: (word) => {
        // Targeted word in 3D
      }
    });

    // 5. Setup Event Listeners
    setupControls();

    // 6. Initial Search
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

  showNodeInspector(node);

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

  const vec = semanticEngine.getVector(node.word);
  if (vec) {
    vectorSparkline.innerHTML = '';
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

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      autocompleteDropdown.style.display = 'none';
    }
  });

  randomWordBtn.addEventListener('click', () => {
    const randomWord = semanticEngine.getRandomWord();
    exploreWord(randomWord);
  });

  filterToggle.addEventListener('change', () => {
    filterSignifier = filterToggle.checked;
    exploreWord(currentWord);
  });

  presetChipsContainer.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const word = chip.getAttribute('data-word');
      exploreWord(word);
    });
  });

  btnZoomIn.addEventListener('click', () => {
    visualizer.targetCamera.zoom = Math.min(2.2, visualizer.targetCamera.zoom * 1.2);
  });

  btnZoomOut.addEventListener('click', () => {
    visualizer.targetCamera.zoom = Math.max(0.4, visualizer.targetCamera.zoom * 0.83);
  });

  btnResetCam.addEventListener('click', () => {
    visualizer.resetCamera();
  });

  btnCloseInspector.addEventListener('click', () => {
    nodeInspector.classList.remove('open');
  });

  btnPivotInspect.addEventListener('click', () => {
    if (inspectedNode && !inspectedNode.isCenter) {
      exploreWord(inspectedNode.word);
    }
  });

  tabExplorerBtn.addEventListener('click', () => switchTab('explorer'));
  tabGameBtn.addEventListener('click', () => switchTab('game'));

  soundToggleBtn.addEventListener('click', () => {
    const isEnabled = soundFX.toggle();
    soundIcon.textContent = isEnabled ? '🔊' : '🔇';
    soundToggleBtn.title = isEnabled ? 'Silenciar Sonido' : 'Activar Sonido';
  });

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

  // 3D Cosmos Controls
  tabCosmosBtn.addEventListener('click', () => switchTab('cosmos'));

  btnCosmosWarp.addEventListener('click', () => {
    const val = cosmosSearchInput.value.trim();
    if (val && cosmosVisualizer) {
      const ok = cosmosVisualizer.warpToWord(val);
      if (!ok) alert(`La palabra "${val}" no se encuentra en el vocabulario.`);
    }
  });

  cosmosSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cosmosSearchInput.value.trim();
      if (val && cosmosVisualizer) {
        const ok = cosmosVisualizer.warpToWord(val);
        if (!ok) alert(`La palabra "${val}" no se encuentra en el vocabulario.`);
      }
    }
  });

  btnCosmosRandom.addEventListener('click', () => {
    if (cosmosVisualizer) {
      const randWord = semanticEngine.getRandomWord();
      cosmosSearchInput.value = randWord;
      cosmosVisualizer.warpToWord(randWord);
    }
  });

  // Calibration Panel Events
  const btnToggleCalib = document.getElementById('btn-toggle-calibration');
  const calibPanel = document.getElementById('cosmos-calibration-panel');
  const btnCloseCalib = document.getElementById('btn-close-calib');
  const btnResetCalib = document.getElementById('btn-reset-calibration');
  const btnSaveCalib = document.getElementById('btn-save-calibration');
  const calibSaveToast = document.getElementById('calib-save-toast');

  const selectProjection = document.getElementById('calib-projection-mode');
  const badgeProjection = document.getElementById('badge-projection-mode');

  const sliderLabelDist = document.getElementById('calib-label-dist');
  const valLabelDist = document.getElementById('val-label-dist');
  const sliderLabelCount = document.getElementById('calib-label-count');
  const valLabelCount = document.getElementById('val-label-count');
  const sliderLabelSize = document.getElementById('calib-label-size');
  const valLabelSize = document.getElementById('val-label-size');
  const sliderSphereSize = document.getElementById('calib-sphere-size');
  const valSphereSize = document.getElementById('val-sphere-size');
  const sliderFlightSpeed = document.getElementById('calib-flight-speed');
  const valFlightSpeed = document.getElementById('val-flight-speed');

  // Cambiar modelo de proyección dimensional (UMAP, PCA, Cúmulos)
  if (selectProjection) {
    selectProjection.addEventListener('change', async (e) => {
      const mode = e.target.value;
      if (badgeProjection) {
        badgeProjection.textContent = mode.toUpperCase();
      }
      if (cosmosVisualizer) {
        await cosmosVisualizer.setProjectionMode(mode);
      }
    });
  }

  if (btnToggleCalib && calibPanel) {
    btnToggleCalib.addEventListener('click', () => {
      const isHidden = calibPanel.style.display === 'none' || !calibPanel.style.display;
      calibPanel.style.display = isHidden ? 'flex' : 'none';
    });
  }

  if (btnCloseCalib && calibPanel) {
    btnCloseCalib.addEventListener('click', () => {
      calibPanel.style.display = 'none';
    });
  }

  if (sliderLabelDist) {
    sliderLabelDist.addEventListener('input', (e) => {
      const v = e.target.value;
      if (valLabelDist) valLabelDist.textContent = `${v} u`;
      if (cosmosVisualizer) cosmosVisualizer.setLabelDistance(v);
    });
  }

  if (sliderLabelCount) {
    sliderLabelCount.addEventListener('input', (e) => {
      const v = e.target.value;
      if (valLabelCount) valLabelCount.textContent = v;
      if (cosmosVisualizer) cosmosVisualizer.setMaxVisibleLabels(v);
    });
  }

  if (sliderLabelSize) {
    sliderLabelSize.addEventListener('input', (e) => {
      const v = e.target.value;
      if (valLabelSize) valLabelSize.textContent = `${Number(v).toFixed(1)}x`;
      if (cosmosVisualizer) cosmosVisualizer.setLabelScale(v);
    });
  }

  if (sliderSphereSize) {
    sliderSphereSize.addEventListener('input', (e) => {
      const v = e.target.value;
      if (valSphereSize) valSphereSize.textContent = `${Number(v).toFixed(1)}x`;
      if (cosmosVisualizer) cosmosVisualizer.setSphereScale(v);
    });
  }

  if (sliderFlightSpeed) {
    sliderFlightSpeed.addEventListener('input', (e) => {
      const v = e.target.value;
      if (valFlightSpeed) valFlightSpeed.textContent = `${Number(v).toFixed(1)}x`;
      if (cosmosVisualizer) cosmosVisualizer.setFlightSpeed(v);
    });
  }

  // Guardar configuración en localStorage
  if (btnSaveCalib) {
    btnSaveCalib.addEventListener('click', () => {
      const config = {
        projectionMode: selectProjection ? selectProjection.value : 'umap',
        labelDistance: sliderLabelDist ? Number(sliderLabelDist.value) : 260,
        maxVisibleLabels: sliderLabelCount ? Number(sliderLabelCount.value) : 45,
        labelScale: sliderLabelSize ? Number(sliderLabelSize.value) : 1.0,
        sphereScale: sliderSphereSize ? Number(sliderSphereSize.value) : 1.0,
        flightSpeed: sliderFlightSpeed ? Number(sliderFlightSpeed.value) : 4.5
      };

      try {
        localStorage.setItem('sincretismo_cosmos_config', JSON.stringify(config));
        soundFX.playCorrect();

        if (calibSaveToast) {
          calibSaveToast.style.display = 'block';
          setTimeout(() => {
            calibSaveToast.style.display = 'none';
          }, 2800);
        }
      } catch (err) {
        console.warn('Error al guardar configuración en localStorage:', err);
      }
    });
  }

  // Restablecer valores por defecto
  if (btnResetCalib) {
    btnResetCalib.addEventListener('click', () => {
      if (cosmosVisualizer) cosmosVisualizer.resetCalibration();
      if (selectProjection) selectProjection.value = 'umap';
      if (badgeProjection) badgeProjection.textContent = 'UMAP';
      if (sliderLabelDist) sliderLabelDist.value = 260;
      if (valLabelDist) valLabelDist.textContent = '260 u';
      if (sliderLabelCount) sliderLabelCount.value = 45;
      if (valLabelCount) valLabelCount.textContent = '45';
      if (sliderLabelSize) sliderLabelSize.value = 1.0;
      if (valLabelSize) valLabelSize.textContent = '1.0x';
      if (sliderSphereSize) sliderSphereSize.value = 1.0;
      if (valSphereSize) valSphereSize.textContent = '1.0x';
      if (sliderFlightSpeed) sliderFlightSpeed.value = 4.5;
      if (valFlightSpeed) valFlightSpeed.textContent = '4.5x';
    });
  }

  // Cargar configuración guardada al iniciar si existe
  try {
    const savedRaw = localStorage.getItem('sincretismo_cosmos_config');
    if (savedRaw) {
      const cfg = JSON.parse(savedRaw);
      if (cfg.projectionMode && selectProjection) {
        selectProjection.value = cfg.projectionMode;
        if (badgeProjection) badgeProjection.textContent = cfg.projectionMode.toUpperCase();
        if (cosmosVisualizer) cosmosVisualizer.setProjectionMode(cfg.projectionMode);
      }
      if (cfg.labelDistance !== undefined && sliderLabelDist) {
        sliderLabelDist.value = cfg.labelDistance;
        if (valLabelDist) valLabelDist.textContent = `${cfg.labelDistance} u`;
        if (cosmosVisualizer) cosmosVisualizer.setLabelDistance(cfg.labelDistance);
      }
      if (cfg.maxVisibleLabels !== undefined && sliderLabelCount) {
        sliderLabelCount.value = cfg.maxVisibleLabels;
        if (valLabelCount) valLabelCount.textContent = cfg.maxVisibleLabels;
        if (cosmosVisualizer) cosmosVisualizer.setMaxVisibleLabels(cfg.maxVisibleLabels);
      }
      if (cfg.labelScale !== undefined && sliderLabelSize) {
        sliderLabelSize.value = cfg.labelScale;
        if (valLabelSize) valLabelSize.textContent = `${Number(cfg.labelScale).toFixed(1)}x`;
        if (cosmosVisualizer) cosmosVisualizer.setLabelScale(cfg.labelScale);
      }
      if (cfg.sphereScale !== undefined && sliderSphereSize) {
        sliderSphereSize.value = cfg.sphereScale;
        if (valSphereSize) valSphereSize.textContent = `${Number(cfg.sphereScale).toFixed(1)}x`;
        if (cosmosVisualizer) cosmosVisualizer.setSphereScale(cfg.sphereScale);
      }
      if (cfg.flightSpeed !== undefined && sliderFlightSpeed) {
        sliderFlightSpeed.value = cfg.flightSpeed;
        if (valFlightSpeed) valFlightSpeed.textContent = `${Number(cfg.flightSpeed).toFixed(1)}x`;
        if (cosmosVisualizer) cosmosVisualizer.setFlightSpeed(cfg.flightSpeed);
      }
    }
  } catch (err) {
    console.warn('Error al restaurar configuración guardada:', err);
  }
}

function switchTab(tabId) {
  tabExplorerBtn.classList.remove('active');
  tabGameBtn.classList.remove('active');
  tabCosmosBtn.classList.remove('active');
  viewExplorer.classList.remove('active');
  viewGame.classList.remove('active');
  viewCosmos.classList.remove('active');

  if (tabId === 'explorer') {
    tabExplorerBtn.classList.add('active');
    viewExplorer.classList.add('active');
    visualizer.resize();
    if (cosmosVisualizer) cosmosVisualizer.stop();
  } else if (tabId === 'game') {
    tabGameBtn.classList.add('active');
    viewGame.classList.add('active');
    if (cosmosVisualizer) cosmosVisualizer.stop();
    if (gameMode) {
      if (gameMode.screen === 'start') {
        gameMode.render();
      }
    }
  } else if (tabId === 'cosmos') {
    tabCosmosBtn.classList.add('active');
    viewCosmos.classList.add('active');
    if (cosmosVisualizer) {
      cosmosVisualizer.handleResize();
      cosmosVisualizer.start();
    }
  }
}

window.addEventListener('DOMContentLoaded', initApp);
