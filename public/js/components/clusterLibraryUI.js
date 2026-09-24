import { clusterManager } from '../engine/clusterManager.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

export class ClusterLibraryUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.clusters = [];
    this.presetColors = [
      '#ef4444', '#10b981', '#8b5cf6', '#06b6d4', 
      '#f59e0b', '#ec4899', '#3b82f6', '#84cc16',
      '#14b8a6', '#6366f1'
    ];
    this.init();
  }

  async init() {
    this.clusters = await clusterManager.load();
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="cluster-lib-container">
        <div class="cluster-lib-header">
          <div class="title-box">
            <span class="lib-badge">ALGORITMO &amp; CATEGORÍAS • LAYA ONNX</span>
            <h2>Biblioteca de Clusters (Cúmulos Semánticos)</h2>
            <p class="sub-text">
              Crea, edita y organiza tus propias categorías temáticas de palabras. Guardalas en el servidor para explorarlas en el Universo 3D por Cúmulos.
            </p>
          </div>

          <div class="header-actions">
            <button class="btn btn-secondary" id="btn-cluster-new">
              <span>+ Crear Nueva Categoría</span>
            </button>
            <button class="btn btn-primary btn-save-large" id="btn-cluster-save-all">
              <span>💾 GUARDAR BIBLIOTECA DE CLUSTERS</span>
            </button>
          </div>
        </div>

        <div id="cluster-save-toast" class="cluster-toast" style="display: none;">
          ✓ ¡Biblioteca de Clusters guardada exitosamente en el servidor y navegador!
        </div>

        <!-- 2. AUTO-MAPPER DE PALABRAS A CLUSTERS CON LAYA -->
        <div class="cluster-automap-container">
          <div class="cluster-automap-header">
            <span class="automap-badge">⚡ AUTO-MAPEO LAYA ONNX</span>
            <span style="font-size: 13px; color: var(--text-muted);">
              Escribe cualquier palabra y LAYA detectará a qué categoría pertenece automáticamente
            </span>
          </div>
          <div class="automap-input-bar">
            <input 
              type="text" 
              id="input-automap-word" 
              placeholder="Escribe una palabra (ej: democracia, tigre, universo, código, filosofía)..." 
              autocomplete="off" 
              spellcheck="false" 
            />
            <button class="btn btn-primary" id="btn-automap-run">🤖 Clasificar con Laya</button>
          </div>
          <div id="automap-result-container" style="display: none;"></div>
        </div>

        <div class="clusters-grid" id="clusters-cards-grid">
          <!-- Dynamic cluster cards -->
        </div>
      </div>
    `;

    this.renderClusterCards();
    this.setupEvents();
  }

  renderClusterCards() {
    const grid = document.getElementById('clusters-cards-grid');
    if (!grid) return;

    if (this.clusters.length === 0) {
      grid.innerHTML = `
        <div class="clusters-empty">
          <span>🌌</span>
          <h3>No hay categorías en la biblioteca.</h3>
          <p>Presiona el botón <strong>"+ Crear Nueva Categoría"</strong> arriba para empezar.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    this.clusters.forEach((cluster, idx) => {
      const card = document.createElement('div');
      card.className = 'cluster-card';
      card.style.borderColor = `${cluster.color}66`;

      const wordsTagsHTML = cluster.words.map(w => {
        return `
          <span class="word-tag" style="background-color: ${cluster.color}22; border-color: ${cluster.color}66;">
            <span class="tag-text">${w}</span>
            <button class="btn-remove-tag" data-cluster-id="${cluster.id}" data-word="${w}">&times;</button>
          </span>
        `;
      }).join('');

      // Swatches for quick color choice
      const swatchesHTML = this.presetColors.map(col => `
        <button 
          class="color-swatch-btn ${col.toLowerCase() === cluster.color.toLowerCase() ? 'active' : ''}" 
          style="background-color: ${col};" 
          data-cluster-id="${cluster.id}" 
          data-color="${col}" 
          title="Color ${col}">
        </button>
      `).join('');

      card.innerHTML = `
        <div class="cluster-card-header" style="background: linear-gradient(90deg, ${cluster.color}1e, transparent);">
          <div class="cluster-card-title-group">
            <input 
              type="color" 
              class="cluster-color-picker" 
              data-cluster-id="${cluster.id}" 
              value="${cluster.color}" 
              title="Color personalizado"
            />
            <input 
              type="text" 
              class="cluster-name-input" 
              data-cluster-id="${cluster.id}" 
              value="${cluster.name}" 
              placeholder="Nombre del Cluster (ej: PODER)..."
            />
          </div>

          <button class="btn-delete-cluster" data-cluster-id="${cluster.id}" title="Eliminar categoría">&times;</button>
        </div>

        <!-- Palette picker row -->
        <div class="cluster-color-palette" title="Elegir color de la categoría">
          <span style="font-size: 11px; color: var(--text-dim); margin-right: 4px;">COLOR:</span>
          ${swatchesHTML}
        </div>

        <div class="cluster-card-body">
          <div class="add-word-to-cluster-bar">
            <input 
              type="text" 
              class="input-add-cluster-word" 
              data-cluster-id="${cluster.id}" 
              placeholder="Escribir palabra..."
              autocomplete="off"
            />
            <button class="btn btn-secondary btn-sm btn-add-word-trigger" data-cluster-id="${cluster.id}">+ Agregar</button>
            <button class="btn-auto-add-word" data-cluster-id="${cluster.id}" title="Auto-agregar palabra afín con Laya">+w</button>
          </div>

          <div class="words-tags-container">
            ${wordsTagsHTML}
          </div>
        </div>

        <div class="cluster-card-footer">
          <span class="count-badge">${cluster.words.length} palabras</span>
          <span class="hint-3d">🌌 Renderizable en Universo 3D</span>
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach card level event listeners
    grid.querySelectorAll('.btn-remove-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-cluster-id');
        const word = btn.getAttribute('data-word');
        this.removeWordFromCluster(cId, word);
      });
    });

    grid.querySelectorAll('.btn-delete-cluster').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-cluster-id');
        this.deleteCluster(cId);
      });
    });

    grid.querySelectorAll('.cluster-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const cId = input.getAttribute('data-cluster-id');
        const name = e.target.value.trim();
        const c = this.clusters.find(x => x.id === cId);
        if (c && name) c.name = name;
      });
    });

    // Native color picker
    grid.querySelectorAll('.cluster-color-picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const cId = picker.getAttribute('data-cluster-id');
        const color = e.target.value;
        const c = this.clusters.find(x => x.id === cId);
        if (c && color) {
          c.color = color;
          this.renderClusterCards();
        }
      });
    });

    // Palette swatches
    grid.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-cluster-id');
        const color = btn.getAttribute('data-color');
        const c = this.clusters.find(x => x.id === cId);
        if (c && color) {
          c.color = color;
          this.renderClusterCards();
          soundFX.playHover();
        }
      });
    });

    // Enter to add word
    grid.querySelectorAll('.input-add-cluster-word').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cId = input.getAttribute('data-cluster-id');
          this.addWordToCluster(cId, input.value);
          input.value = '';
        }
      });
    });

    // + Agregar button
    grid.querySelectorAll('.btn-add-word-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-cluster-id');
        const input = grid.querySelector(`.input-add-cluster-word[data-cluster-id="${cId}"]`);
        if (input && input.value) {
          this.addWordToCluster(cId, input.value);
          input.value = '';
        }
      });
    });

    // +w Auto-add related word button
    grid.querySelectorAll('.btn-auto-add-word').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-cluster-id');
        this.handleAutoAddRelatedWord(cId, btn);
      });
    });
  }

  /**
   * Auto-agrega una palabra afín al cluster usando LAYA (+w)
   */
  async handleAutoAddRelatedWord(clusterId, btn) {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = '...';
    }

    try {
      // Tomar como semilla una palabra existente o el nombre del cluster
      let seed = cluster.name.toLowerCase();
      if (cluster.words.length > 0) {
        const randWord = cluster.words[Math.floor(Math.random() * cluster.words.length)];
        seed = randWord;
      }

      // Buscar vecinos afines con Laya
      const res = await semanticEngine.getNearestNeighborsAsync(seed, { k: 25, filterSignifier: true });
      if (res && res.neighbors && res.neighbors.length > 0) {
        // Encontrar la primera palabra afín que no esté ya en el cluster
        const currentLower = new Set(cluster.words.map(w => w.toLowerCase()));
        const candidate = res.neighbors.find(n => !currentLower.has(n.word.toLowerCase()));

        if (candidate) {
          this.addWordToCluster(clusterId, candidate.word);
          soundFX.playActivate();
        } else {
          // Si todas están, probar con otra vecina
          this.addWordToCluster(clusterId, res.neighbors[0].word);
        }
      }
    } catch (e) {
      console.warn('Error en +w auto-agregar:', e);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '+w';
      }
    }
  }

  /**
   * Auto-mapeo: clasifica una palabra en los clusters existentes usando la API de Laya
   */
  async handleAutoMapWord() {
    const input = document.getElementById('input-automap-word');
    const resultContainer = document.getElementById('automap-result-container');
    const btn = document.getElementById('btn-automap-run');
    if (!input || !resultContainer) return;

    const word = input.value.trim();
    if (!word) return;

    if (this.clusters.length === 0) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="automap-result-card" style="border-left-color: #ef4444;">
          <span class="automap-result-text">Primero crea al menos una categoría para poder auto-mapear.</span>
        </div>
      `;
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = '🤖 Analizando...';
    }

    try {
      const res = await fetch('./api/semantic/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          categories: this.clusters.map(c => ({
            name: c.name,
            words: c.words || []
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const topClassification = data.classification && data.classification[0];

        if (topClassification) {
          const matchedCluster = this.clusters.find(c => c.name.toLowerCase() === topClassification.category.toLowerCase()) || this.clusters[0];
          const pct = (topClassification.probability * 100).toFixed(1);

          resultContainer.style.display = 'block';
          resultContainer.innerHTML = `
            <div class="automap-result-card" style="border-left-color: ${matchedCluster.color};">
              <div class="automap-result-text">
                ✦ La palabra <strong>"${word}"</strong> pertenece con <strong>${pct}%</strong> de afinidad Laya al cluster: 
                <span style="color: ${matchedCluster.color}; font-weight: 700; text-transform: uppercase;">${matchedCluster.name}</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-automap-add-now" style="border-color: ${matchedCluster.color}; color: ${matchedCluster.color};">
                ➕ Añadir a "${matchedCluster.name}"
              </button>
            </div>
          `;

          const addBtn = document.getElementById('btn-automap-add-now');
          if (addBtn) {
            addBtn.addEventListener('click', () => {
              this.addWordToCluster(matchedCluster.id, word);
              input.value = '';
              resultContainer.style.display = 'none';
              soundFX.playCorrect();
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error en auto-mapeo:', e);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🤖 Clasificar con Laya';
      }
    }
  }

  addWordToCluster(clusterId, word) {
    const clean = word.toLowerCase().trim();
    if (!clean) return;
    const c = this.clusters.find(x => x.id === clusterId);
    if (c) {
      if (!c.words.includes(clean)) {
        c.words.push(clean);
        this.renderClusterCards();
      }
    }
  }

  removeWordFromCluster(clusterId, word) {
    const c = this.clusters.find(x => x.id === clusterId);
    if (c) {
      c.words = c.words.filter(w => w !== word);
      this.renderClusterCards();
    }
  }

  deleteCluster(clusterId) {
    if (confirm('¿Deseas eliminar esta categoría/cluster?')) {
      this.clusters = this.clusters.filter(x => x.id !== clusterId);
      this.renderClusterCards();
    }
  }

  createNewCluster() {
    const id = 'cluster_' + Date.now();
    const colors = this.presetColors;
    const randColor = colors[Math.floor(Math.random() * colors.length)];

    this.clusters.push({
      id,
      name: 'NUEVA CATEGORÍA',
      color: randColor,
      words: []
    });

    this.renderClusterCards();
    soundFX.playActivate();
  }

  async saveAll() {
    const res = await clusterManager.save(this.clusters);
    soundFX.playCorrect();

    const toast = document.getElementById('cluster-save-toast');
    if (toast) {
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3500);
    }
  }

  setupEvents() {
    const newBtn = document.getElementById('btn-cluster-new');
    const saveBtn = document.getElementById('btn-cluster-save-all');
    const automapBtn = document.getElementById('btn-automap-run');
    const automapInput = document.getElementById('input-automap-word');

    if (newBtn) {
      newBtn.addEventListener('click', () => this.createNewCluster());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAll());
    }

    if (automapBtn) {
      automapBtn.addEventListener('click', () => this.handleAutoMapWord());
    }

    if (automapInput) {
      automapInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleAutoMapWord();
        }
      });
    }
  }
}
