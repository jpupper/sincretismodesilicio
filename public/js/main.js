import { semanticEngine } from './engine/semanticVectorEngine.js';
import { GraphVisualizer } from './visualizer/graphVisualizer.js';
import { Cosmos3DVisualizer } from './visualizer/cosmos3DVisualizer.js';
import { ClusterCosmos3D } from './visualizer/clusterCosmos3D.js';
import { DistanceCalculatorUI } from './components/distanceCalculator.js';
import { ClusterLibraryUI } from './components/clusterLibraryUI.js';
import { GameMode } from './game/gameMode.js';
import { soundFX } from './audio/soundFX.js';

let visualizer = null;
let cosmosVisualizer = null;
let clusterCosmosVisualizer = null;
let distanceCalculatorUI = null;
let clusterLibraryUI = null;
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

// Tabs & Views
const tabHubBtn = document.getElementById('tab-hub-btn');
const tabExplorerBtn = document.getElementById('tab-explorer-btn');
const tabDistanceBtn = document.getElementById('tab-distance-btn');
const tabClusterLibBtn = document.getElementById('tab-cluster-lib-btn');
const tabCosmosClustersBtn = document.getElementById('tab-cosmos-clusters-btn');
const tabCosmosBtn = document.getElementById('tab-cosmos-btn');
const tabGameBtn = document.getElementById('tab-game-btn');

const viewHub = document.getElementById('view-hub');
const viewExplorer = document.getElementById('view-explorer');
const viewDistance = document.getElementById('view-distance');
const viewClusterLib = document.getElementById('view-cluster-lib');
const viewCosmosClusters = document.getElementById('view-cosmos-clusters');
const viewCosmos = document.getElementById('view-cosmos');
const viewGame = document.getElementById('view-game');

const cosmosViewport = document.getElementById('cosmos-viewport');
const cosmosClustersViewport = document.getElementById('cosmos-clusters-viewport');
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
const brandLogoBtn = document.getElementById('brand-logo-btn');

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

    // 4. Initialize 3D Cosmos Visualizers
    cosmosVisualizer = new Cosmos3DVisualizer(cosmosViewport, {
      onSelectWord: (word) => {}
    });

    clusterCosmosVisualizer = new ClusterCosmos3D(cosmosClustersViewport, {});

    // 5. Initialize UI Components
    const distCalcRoot = document.getElementById('distance-calc-root');
    if (distCalcRoot) {
      distanceCalculatorUI = new DistanceCalculatorUI(distCalcRoot);
    }

    const clusterLibRoot = document.getElementById('cluster-lib-root');
    if (clusterLibRoot) {
      clusterLibraryUI = new ClusterLibraryUI(clusterLibRoot);
    }

    // 6. Setup Event Listeners
    setupControls();

    // 7. Initial Search for 2D Graph
    exploreWord(currentWord);

    // 8. Handle Deep Linking / URL Query Param for direct tab opening (e.g. ?tab=cosmos-clusters)
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab') || window.location.hash.replace('#', '');
    if (targetTab && ['hub', 'explorer', 'distance', 'cluster-lib', 'cosmos-clusters', 'cosmos', 'game'].includes(targetTab)) {
      switchTab(targetTab);
    }

  } catch (err) {
    console.error('Initialization failed:', err);
    if (loaderStatus) {
      loaderStatus.textContent = `Error al cargar vectores: ${err.message}`;
      loaderStatus.style.color = '#ef4444';
    }
  }
}

async function exploreWord(word) {
  const cleanWord = word.toLowerCase().trim();
  if (!cleanWord) return;

  currentWord = cleanWord;
  searchInput.value = cleanWord;
  autocompleteDropdown.style.display = 'none';

  let data = semanticEngine.getNearestNeighbors(cleanWord, {
    k: 8,
    filterSignifier: filterSignifier
  });

  if (!data || data.neighbors.length === 0) {
    // Si la palabra es externa al vocabulario estático base, inferirla dinámicamente con Laya ONNX
    data = await semanticEngine.getNearestNeighborsAsync(cleanWord, {
      k: 8,
      filterSignifier: filterSignifier
    });
  }

  if (!data || data.neighbors.length === 0) {
    alert(`No se pudieron calcular vecinos semánticos para "${cleanWord}".`);
    return;
  }

  visualizer.setData(data);
  visualizer.resetCamera();

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

function handleNodeHover(node) {}

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
  // Brand logo -> Hub
  if (brandLogoBtn) {
    brandLogoBtn.addEventListener('click', () => switchTab('hub'));
  }

  // Hub Cards Launch Buttons
  document.querySelectorAll('.hub-card[data-launch]').forEach(card => {
    card.addEventListener('click', (e) => {
      const targetTab = card.getAttribute('data-launch');
      if (targetTab) switchTab(targetTab);
    });
  });

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

  // Tab Navigation Click Listeners
  if (tabHubBtn) tabHubBtn.addEventListener('click', () => switchTab('hub'));
  if (tabExplorerBtn) tabExplorerBtn.addEventListener('click', () => switchTab('explorer'));
  if (tabDistanceBtn) tabDistanceBtn.addEventListener('click', () => switchTab('distance'));
  if (tabClusterLibBtn) tabClusterLibBtn.addEventListener('click', () => switchTab('cluster-lib'));
  if (tabCosmosClustersBtn) tabCosmosClustersBtn.addEventListener('click', () => switchTab('cosmos-clusters'));
  if (tabCosmosBtn) tabCosmosBtn.addEventListener('click', () => switchTab('cosmos'));
  if (tabGameBtn) tabGameBtn.addEventListener('click', () => switchTab('game'));

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

  // 3D Cosmos Flight Controls
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
}

function switchTab(tabId) {
  // Clear active tab buttons
  [tabHubBtn, tabExplorerBtn, tabDistanceBtn, tabClusterLibBtn, tabCosmosClustersBtn, tabCosmosBtn, tabGameBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  // Clear active view panels
  [viewHub, viewExplorer, viewDistance, viewClusterLib, viewCosmosClusters, viewCosmos, viewGame].forEach(panel => {
    if (panel) panel.classList.remove('active');
  });

  // Stop 3D animations when leaving 3D tabs
  if (cosmosVisualizer) cosmosVisualizer.stop();
  if (clusterCosmosVisualizer) clusterCosmosVisualizer.stop();

  if (tabId === 'hub') {
    if (tabHubBtn) tabHubBtn.classList.add('active');
    if (viewHub) viewHub.classList.add('active');
  } else if (tabId === 'explorer') {
    if (tabExplorerBtn) tabExplorerBtn.classList.add('active');
    if (viewExplorer) viewExplorer.classList.add('active');
    if (visualizer) visualizer.resize();
  } else if (tabId === 'distance') {
    if (tabDistanceBtn) tabDistanceBtn.classList.add('active');
    if (viewDistance) viewDistance.classList.add('active');
    if (distanceCalculatorUI) distanceCalculatorUI.calculateAndRenderResults();
  } else if (tabId === 'cluster-lib') {
    if (tabClusterLibBtn) tabClusterLibBtn.classList.add('active');
    if (viewClusterLib) viewClusterLib.classList.add('active');
  } else if (tabId === 'cosmos-clusters') {
    if (tabCosmosClustersBtn) tabCosmosClustersBtn.classList.add('active');
    if (viewCosmosClusters) viewCosmosClusters.classList.add('active');
    if (clusterCosmosVisualizer) {
      clusterCosmosVisualizer.handleResize();
      clusterCosmosVisualizer.start();
    }
  } else if (tabId === 'cosmos') {
    if (tabCosmosBtn) tabCosmosBtn.classList.add('active');
    if (viewCosmos) viewCosmos.classList.add('active');
    if (cosmosVisualizer) {
      cosmosVisualizer.handleResize();
      cosmosVisualizer.start();
    }
  } else if (tabId === 'game') {
    if (tabGameBtn) tabGameBtn.classList.add('active');
    if (viewGame) viewGame.classList.add('active');
    if (gameMode && gameMode.screen === 'start') {
      gameMode.render();
    }
  }

  soundFX.playClick();
}

window.addEventListener('DOMContentLoaded', initApp);
