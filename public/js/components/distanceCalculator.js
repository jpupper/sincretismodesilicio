import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

export class DistanceCalculatorUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.refWord = 'tiempo';
    this.compWords = ['reloj', 'memoria', 'pasado', 'futuro', 'espacio', 'fuego', 'perro', 'zapato'];
    this.init();
  }

  init() {
    this.render();
    this.setupEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="distance-calc-container">
        <div class="calc-header">
          <div class="calc-title-box">
            <span class="calc-badge">EXPLORADOR VECTORIAL 300D</span>
            <h2>Medidor &amp; Calculadora de Distancia Semántica</h2>
            <p class="calc-sub">
              Ingresa una palabra de referencia y compara la distancia semántica pura en el espacio de 300 dimensiones (\(d = 1 - \cos\theta\)).
            </p>
          </div>
        </div>

        <!-- Reference Word Card -->
        <div class="ref-word-card">
          <div class="ref-label-row">
            <span class="ref-tag">📍 PALABRA DE REFERENCIA (NÚCLEO)</span>
            <span class="ref-status" id="ref-word-status">En vocabulario</span>
          </div>

          <div class="ref-input-group">
            <div class="input-with-icon">
              <span class="icon">🎯</span>
              <input 
                type="text" 
                id="calc-ref-input" 
                value="${this.refWord}" 
                placeholder="Escribe la palabra de referencia (ej: tiempo, fuego, libertad)..."
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <button class="btn btn-primary" id="btn-calc-set-ref">Establecer Núcleo 🎯</button>
            <button class="btn btn-secondary" id="btn-calc-rand-ref" title="Elegir palabra al azar">🎲 Azar</button>
          </div>
        </div>

        <!-- Comparison Section Header & Controls -->
        <div class="comp-section-bar">
          <div class="comp-title">
            <span>Palabras a Comparar (<span id="comp-words-count">${this.compWords.length}</span>)</span>
          </div>

          <div class="comp-actions">
            <button class="btn btn-secondary btn-sm" id="btn-calc-add-word">
              <span>+ Agregar Palabra</span>
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-calc-fill-neighbors" title="Llenar con 5 vecinos cercanos del modelo">
              <span>🔭 Cargar Vecinos Cercanos</span>
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-calc-clear-words">
              <span>🗑 Limpiar Todo</span>
            </button>
          </div>
        </div>

        <!-- Add Word Input Row -->
        <div class="add-word-bar">
          <input 
            type="text" 
            id="calc-new-word-input" 
            placeholder="Ingresa otra palabra a comparar..."
            autocomplete="off"
            spellcheck="false"
          />
          <button class="btn btn-primary" id="btn-calc-submit-new">+ Agregar a la lista</button>
          <div class="autocomplete-dropdown" id="calc-autocomplete" style="display:none;"></div>
        </div>

        <!-- Results Grid / List -->
        <div class="comp-results-grid" id="comp-results-list">
          <!-- Dynamic cards inserted here -->
        </div>
      </div>
    `;

    this.calculateAndRenderResults();
  }

  calculateAndRenderResults() {
    const listEl = document.getElementById('comp-results-list');
    const statusEl = document.getElementById('ref-word-status');
    const countEl = document.getElementById('comp-words-count');

    if (!listEl) return;

    const cleanRef = this.refWord.toLowerCase().trim();
    const hasRef = semanticEngine.hasWord(cleanRef);

    if (countEl) countEl.textContent = this.compWords.length;

    if (statusEl) {
      if (hasRef) {
        statusEl.textContent = '✓ En Vocabulario Vectorial (300D)';
        statusEl.className = 'ref-status valid';
      } else {
        statusEl.textContent = '⚠ Palabra no encontrada en el vocabulario';
        statusEl.className = 'ref-status invalid';
      }
    }

    if (!hasRef) {
      listEl.innerHTML = `
        <div class="calc-empty-state">
          <span class="icon">⚠️</span>
          <h3>La palabra de referencia "${cleanRef}" no está en el vocabulario.</h3>
          <p>Intenta con otra palabra como <strong>tiempo, fuego, agua, libertad, mente, música</strong>...</p>
        </div>
      `;
      return;
    }

    if (this.compWords.length === 0) {
      listEl.innerHTML = `
        <div class="calc-empty-state">
          <span class="icon">📝</span>
          <h3>No hay palabras a comparar.</h3>
          <p>Usa el botón <strong>"+ Agregar Palabra"</strong> o <strong>"Cargar Vecinos Cercanos"</strong> arriba.</p>
        </div>
      `;
      return;
    }

    // Calculate similarity for each word
    const results = [];
    for (const w of this.compWords) {
      const cleanW = w.toLowerCase().trim();
      const sim = semanticEngine.calculateSimilarity(cleanRef, cleanW);
      results.push({
        word: cleanW,
        data: sim,
        valid: !!sim
      });
    }

    // Sort valid results by distance (closest first)
    results.sort((a, b) => {
      if (!a.valid) return 1;
      if (!b.valid) return -1;
      return a.data.distance - b.data.distance;
    });

    listEl.innerHTML = '';
    results.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `distance-card ${!item.valid ? 'invalid' : ''}`;

      if (!item.valid) {
        card.innerHTML = `
          <div class="card-left">
            <span class="card-rank">#${idx + 1}</span>
            <span class="card-word-title">${item.word}</span>
            <span class="card-badge-invalid">No en vocabulario</span>
          </div>
          <button class="btn-remove-card" data-word="${item.word}">&times;</button>
        `;
      } else {
        const d = item.data.distance;
        const simPct = item.data.similarityPercent.toFixed(1);
        const angle = item.data.angleDegrees.toFixed(1);

        // Color coding
        let colorHue = 180; // cyan
        let categoryLabel = 'Afinidad Moderada';
        let badgeClass = 'badge-medium';

        if (d < 0.35) {
          colorHue = 140; // green
          categoryLabel = 'Muy Cercana / Resonante';
          badgeClass = 'badge-close';
        } else if (d < 0.6) {
          colorHue = 190; // cyan
          categoryLabel = 'Afinidad Media';
          badgeClass = 'badge-medium';
        } else if (d < 0.8) {
          colorHue = 40; // orange
          categoryLabel = 'Concepto Distante';
          badgeClass = 'badge-far';
        } else {
          colorHue = 340; // red/purple
          categoryLabel = 'Opuesto / Dispar';
          badgeClass = 'badge-opposite';
        }

        const barWidth = Math.max(2, Math.min(100, item.data.similarity * 100));

        card.innerHTML = `
          <div class="card-main">
            <div class="card-top-line">
              <div class="card-word-group">
                <span class="card-rank">#${idx + 1}</span>
                <span class="card-word-title">${item.word}</span>
                <span class="card-category-badge ${badgeClass}">${categoryLabel}</span>
                ${item.data.isSignifierTwin ? '<span class="card-twin-badge" title="Misma raíz morfológica (Significante)">Flexión Morfológica</span>' : ''}
              </div>

              <div class="card-actions-right">
                <button class="btn-make-ref" data-word="${item.word}" title="Convertir en la nueva palabra de referencia">
                  🎯 Hacer Núcleo
                </button>
                <button class="btn-remove-card" data-word="${item.word}" title="Eliminar">&times;</button>
              </div>
            </div>

            <!-- Meter bar -->
            <div class="card-meter-bg">
              <div class="card-meter-fill" style="width: ${barWidth}%; background-color: hsl(${colorHue}, 90%, 50%);"></div>
            </div>

            <!-- Metrics grid -->
            <div class="card-metrics-grid">
              <div class="metric-box">
                <span class="m-label">DISTANCIA SEMÁNTICA (d)</span>
                <span class="m-val highlight">${d.toFixed(4)}</span>
                <span class="m-sub">1 - cos(θ)</span>
              </div>
              <div class="metric-box">
                <span class="m-label">SIMILITUD COSENO</span>
                <span class="m-val">${simPct}%</span>
                <span class="m-sub">Afinidad Vectorial</span>
              </div>
              <div class="metric-box">
                <span class="m-label">SEPARACIÓN ANGULAR</span>
                <span class="m-val">${angle}°</span>
                <span class="m-sub">Ángulo en 300D</span>
              </div>
            </div>
          </div>
        `;
      }

      listEl.appendChild(card);
    });

    // Attach card action handlers
    listEl.querySelectorAll('.btn-remove-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = btn.getAttribute('data-word');
        this.compWords = this.compWords.filter(item => item !== w);
        this.calculateAndRenderResults();
      });
    });

    listEl.querySelectorAll('.btn-make-ref').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = btn.getAttribute('data-word');
        this.refWord = w;
        const refInput = document.getElementById('calc-ref-input');
        if (refInput) refInput.value = w;
        this.calculateAndRenderResults();
        soundFX.playActivate();
      });
    });
  }

  setupEvents() {
    const refInput = document.getElementById('calc-ref-input');
    const setRefBtn = document.getElementById('btn-calc-set-ref');
    const randRefBtn = document.getElementById('btn-calc-rand-ref');
    const addWordBtn = document.getElementById('btn-calc-add-word');
    const fillNeighborsBtn = document.getElementById('btn-calc-fill-neighbors');
    const clearWordsBtn = document.getElementById('btn-calc-clear-words');
    const newWordInput = document.getElementById('calc-new-word-input');
    const submitNewBtn = document.getElementById('btn-calc-submit-new');

    if (setRefBtn && refInput) {
      setRefBtn.addEventListener('click', () => {
        const val = refInput.value.trim();
        if (val) {
          this.refWord = val;
          this.calculateAndRenderResults();
        }
      });

      refInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = refInput.value.trim();
          if (val) {
            this.refWord = val;
            this.calculateAndRenderResults();
          }
        }
      });
    }

    if (randRefBtn) {
      randRefBtn.addEventListener('click', () => {
        const rWord = semanticEngine.getRandomWord();
        this.refWord = rWord;
        if (refInput) refInput.value = rWord;
        this.calculateAndRenderResults();
      });
    }

    const addNewWord = (word) => {
      const clean = word.toLowerCase().trim();
      if (!clean) return;
      if (!this.compWords.includes(clean)) {
        this.compWords.push(clean);
        this.calculateAndRenderResults();
        if (newWordInput) newWordInput.value = '';
      }
    };

    if (submitNewBtn && newWordInput) {
      submitNewBtn.addEventListener('click', () => {
        addNewWord(newWordInput.value);
      });

      newWordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addNewWord(newWordInput.value);
        }
      });
    }

    if (fillNeighborsBtn) {
      fillNeighborsBtn.addEventListener('click', () => {
        const cleanRef = this.refWord.toLowerCase().trim();
        const neighbors = semanticEngine.getNearestNeighbors(cleanRef, { k: 6, filterSignifier: true });
        if (neighbors && neighbors.neighbors) {
          neighbors.neighbors.forEach(n => {
            if (!this.compWords.includes(n.word)) {
              this.compWords.push(n.word);
            }
          });
          this.calculateAndRenderResults();
          soundFX.playActivate();
        }
      });
    }

    if (clearWordsBtn) {
      clearWordsBtn.addEventListener('click', () => {
        this.compWords = [];
        this.calculateAndRenderResults();
      });
    }
  }
}
