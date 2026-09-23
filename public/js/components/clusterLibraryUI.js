import { clusterManager } from '../engine/clusterManager.js';
import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

export class ClusterLibraryUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.clusters = [];
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
            <span class="lib-badge">ALGORITMO &amp; CATEGORÍAS</span>
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
        const inVocab = semanticEngine.hasWord(w);
        return `
          <span class="word-tag ${!inVocab ? 'not-in-vocab' : ''}" style="background-color: ${cluster.color}22; border-color: ${cluster.color}66;">
            <span class="tag-text">${w}</span>
            <button class="btn-remove-tag" data-cluster-id="${cluster.id}" data-word="${w}">&times;</button>
          </span>
        `;
      }).join('');

      card.innerHTML = `
        <div class="cluster-card-header" style="background: linear-gradient(90deg, ${cluster.color}1e, transparent);">
          <div class="cluster-card-title-group">
            <input 
              type="color" 
              class="cluster-color-picker" 
              data-cluster-id="${cluster.id}" 
              value="${cluster.color}" 
              title="Cambiar color del cluster"
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

        <div class="cluster-card-body">
          <div class="add-word-to-cluster-bar">
            <input 
              type="text" 
              class="input-add-cluster-word" 
              data-cluster-id="${cluster.id}" 
              placeholder="Escribir palabra y presionar Enter..."
              autocomplete="off"
            />
            <button class="btn btn-secondary btn-sm btn-add-word-trigger" data-cluster-id="${cluster.id}">+ Agregar</button>
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

    grid.querySelectorAll('.cluster-color-picker').forEach(picker => {
      picker.addEventListener('change', (e) => {
        const cId = picker.getAttribute('data-cluster-id');
        const color = e.target.value;
        const c = this.clusters.find(x => x.id === cId);
        if (c && color) {
          c.color = color;
          this.renderClusterCards();
        }
      });
    });

    grid.querySelectorAll('.input-add-cluster-word').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cId = input.getAttribute('data-cluster-id');
          this.addWordToCluster(cId, input.value);
          input.value = '';
        }
      });
    });

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
    const colors = ['#ef4444', '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6'];
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

    if (newBtn) {
      newBtn.addEventListener('click', () => this.createNewCluster());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAll());
    }
  }
}
