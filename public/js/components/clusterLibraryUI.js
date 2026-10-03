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
              <br><strong>Renombrar una palabra:</strong> doble clic sobre ella o tocá el lápiz ✎.
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

        <div id="cluster-edit-toast" class="cluster-toast" style="display: none;"></div>

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
        const wEsc = ClusterLibraryUI.esc(w);
        return `
          <span class="word-tag" style="background-color: ${cluster.color}22; border-color: ${cluster.color}66;" data-cluster-id="${cluster.id}" data-word="${wEsc}">
            <span class="tag-text" title="Doble clic para renombrar">${wEsc}</span>
            <button class="btn-edit-tag" data-cluster-id="${cluster.id}" data-word="${wEsc}" title="Renombrar palabra">&#9998;</button>
            <button class="btn-remove-tag" data-cluster-id="${cluster.id}" data-word="${wEsc}" title="Quitar palabra">&times;</button>
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
    // RENOMBRAR: lapiz ✎ o doble clic sobre la palabra -> edicion inline
    grid.querySelectorAll('.btn-edit-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tag = btn.closest('.word-tag');
        if (tag) this.beginEditWord(tag);
      });
    });

    grid.querySelectorAll('.word-tag .tag-text').forEach(txt => {
      txt.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tag = txt.closest('.word-tag');
        if (tag) this.beginEditWord(tag);
      });
    });

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
      const cId = input.getAttribute('data-cluster-id');
      const c = this.clusters.find(x => x.id === cId);
      if (!c) return;
      let ultimoBueno = c.name;

      // COMMIT EN VIVO: si escribís el nombre y apretás GUARDAR sin salir del campo,
      // el cambio ya está en el array. Antes se guardaba el nombre VIEJO (el nuevo
      // sólo entraba al hacer 'change', o sea al salir del input).
      input.addEventListener('input', (e) => {
        const v = e.target.value;
        if (v.trim()) ultimoBueno = v;
        c.name = v;
        // SE GUARDA SOLO: no hace falta apretar GUARDAR para que el nombre quede.
        this.programarAutoGuardadoNombre();
      });

      // Al salir del campo: sin espacios sobrantes, nunca vacío, y guardado inmediato.
      input.addEventListener('change', (e) => {
        const limpio = String(e.target.value || '').trim();
        if (limpio) { c.name = limpio; ultimoBueno = limpio; }
        else { c.name = ultimoBueno; }
        e.target.value = c.name;
        this.guardarNombreAhora();
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

          // REQUERIMIENTO 11: Auto-agregar inmediatamente al cluster al presionar Enter
          this.addWordToCluster(matchedCluster.id, word);
          input.value = '';

          resultContainer.style.display = 'block';
          resultContainer.innerHTML = `
            <div class="automap-result-card" style="border-left-color: ${matchedCluster.color};">
              <div class="automap-result-text">
                ✓ Palabra <strong>"${word}"</strong> auto-agregada al cluster: 
                <span style="color: ${matchedCluster.color}; font-weight: 700; text-transform: uppercase;">${matchedCluster.name}</span>
                (${pct}% afinidad semántica Laya).
              </div>
            </div>
          `;
          soundFX.playCorrect();
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

  /** Escapa texto para meterlo en atributos/template HTML sin romper el markup. */
  static esc(txt) {
    return String(txt == null ? '' : txt)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Normaliza una palabra escrita a mano: minusculas y SIEMPRE UNA SOLA
   * PALABRA (se corta en el primer separador: espacio, guion bajo, guion, punto).
   * Misma regla que el resto del sistema (nada de OPTIMO_LUJO -> OPTIMO).
   */
  static sanitizeWord(raw) {
    let t = String(raw == null ? '' : raw).trim().toLowerCase();
    t = t.replace(/[^0-9a-záéíóúüñ]/g, ' ');
    const first = t.split(/\s+/).filter(Boolean)[0] || '';
    return first;
  }

  /** Aviso efimero propio (no pisa el toast de guardado). */
  notify(msg, kind = 'ok', ms = 3200) {
    const t = document.getElementById('cluster-edit-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('is-error', kind === 'error');
    t.style.display = 'block';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      t.style.display = 'none';
      t.classList.remove('is-error');
    }, ms);
  }

  /** Convierte el tag de una palabra en un input editable (Enter/blur = guardar, Esc = cancelar). */
  beginEditWord(tagEl) {
    if (!tagEl) return;
    const cId = tagEl.getAttribute('data-cluster-id');
    const oldWord = tagEl.getAttribute('data-word') || '';
    const cluster = this.clusters.find(c => c.id === cId);
    if (!cluster) return;

    tagEl.classList.add('editing');
    tagEl.innerHTML = `<input type="text" class="input-edit-tag" value="${ClusterLibraryUI.esc(oldWord)}" spellcheck="false" autocomplete="off" title="Enter para guardar · Esc para cancelar" />`;

    const inp = tagEl.querySelector('.input-edit-tag');
    if (!inp) return;
    inp.focus();
    inp.select();

    let done = false;
    const finish = (commit) => {
      if (done) return;
      done = true;
      if (commit) this.renameWordInCluster(cId, oldWord, inp.value);
      else this.renderClusterCards();
    };

    inp.addEventListener('keydown', (e) => {
      e.stopPropagation(); // la tecla L global no debe auto-agregar palabras aca
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      else if (e.key === 'Tab') { finish(true); }
    });
    inp.addEventListener('blur', () => finish(true));
  }

  /** Renombra una palabra dentro de su cluster, conservando POSICION y color. */
  renameWordInCluster(clusterId, oldWord, rawNew) {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    const inCluster = cluster.words.indexOf(oldWord);
    const newWord = ClusterLibraryUI.sanitizeWord(rawNew);

    if (!newWord) { this.renderClusterCards(); return; }                 // vacio -> cancela
    if (newWord === String(oldWord).toLowerCase() || inCluster < 0) {    // sin cambios
      this.renderClusterCards();
      return;
    }
    const dup = cluster.words.some((w, i) => i !== inCluster && w.toLowerCase() === newWord);
    if (dup) {
      this.notify(`"${newWord.toUpperCase()}" ya existe en ${cluster.name}. No se cambió nada.`, 'error');
      this.renderClusterCards();
      return;
    }

    cluster.words[inCluster] = newWord;   // misma posicion en el array
    this.renderClusterCards();
    soundFX.playCorrect();

    const fueAjustada = newWord !== String(rawNew).trim().toLowerCase();
    this.notify(`Palabra renombrada: ${oldWord} ➔ ${newWord}${fueAjustada ? ' (ajustada a una sola palabra)' : ''} · Acordate de GUARDAR la biblioteca`);
  }

  /**
   * GUARDADO AUTOMATICO DEL NOMBRE (lo pidio el usuario: "edito el nombre y no se
   * guarda"). Rebota 900 ms despues de la ultima tecla y escribe la biblioteca
   * COMPLETA en el servidor (es el mismo archivo que lee el Universo 3D). Si el
   * POST falla, lo dice: antes el cambio quedaba solo en la memoria de esta pestana.
   */
  programarAutoGuardadoNombre() {
    clearTimeout(this._autoNombreTimer);
    this._autoNombreTimer = setTimeout(() => this.guardarNombreAhora(), 900);
  }

  async guardarNombreAhora() {
    clearTimeout(this._autoNombreTimer);
    if (this._guardandoNombre) { this._nombrePendiente = true; return; }
    this._guardandoNombre = true;
    try {
      const res = await clusterManager.save(this.clusters);
      if (res && res.serverSaved) {
        this.notify('\u2713 Nombre guardado en el servidor (se guarda solo, sin apretar GUARDAR).', 'ok', 2200);
      } else {
        this.notify('\u26a0 El nombre NO lleg\u00f3 al servidor (\u00bfnpm start apagado?): qued\u00f3 solo en este navegador.', 'error', 8000);
      }
    } catch (e) {
      this.notify('\u26a0 Error guardando el nombre: ' + (e && e.message ? e.message : e), 'error', 8000);
    } finally {
      this._guardandoNombre = false;
      if (this._nombrePendiente) { this._nombrePendiente = false; this.programarAutoGuardadoNombre(); }
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
    const serverOK = !!(res && res.serverSaved);

    if (serverOK) {
      soundFX.playCorrect();
      const toast = document.getElementById('cluster-save-toast');
      if (toast) {
        toast.style.display = 'block';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 3500);
      }
      this.notify('✓ Guardado en el servidor. El Universo 3D la toma solo en ~20 s (o al recargar).');
    } else {
      // ANTES esto cantaba "guardada exitosamente" aunque el POST al servidor hubiera
      // fallado: el 3D lee del SERVIDOR, así que seguía mostrando los nombres viejos
      // y parecía que el 3D "no tomaba" la biblioteca. Ahora se dice la verdad.
      this.notify('⚠ NO se pudo guardar en el SERVIDOR: quedó sólo en este navegador y el Universo 3D NO verá los cambios. Revisá que el server esté corriendo (npm start).', 'error', 9000);
    }
    return res;
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

    // REQUERIMIENTO 12: Si apretas la letra L en la interfaz te genera una palabra automáticamente
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Ignorar si el usuario está escribiendo dentro de un input o textarea
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        this.handleAutoGenerateWord();
      }
    });
  }

  /**
   * REQUERIMIENTO 12: Genera y asocia una palabra automáticamente con LAYA al presionar la letra L
   */
  async handleAutoGenerateWord() {
    if (!this.clusters || this.clusters.length === 0) {
      this.createNewCluster();
    }
    const randCluster = this.clusters[Math.floor(Math.random() * this.clusters.length)];
    if (!randCluster) return;

    await this.handleAutoAddRelatedWord(randCluster.id, null);

    const toast = document.getElementById('cluster-save-toast');
    if (toast) {
      toast.textContent = `⚡ [TECLA L] Palabra afín generada automáticamente con Laya y agregada a "${randCluster.name}"`;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }
  }
}
