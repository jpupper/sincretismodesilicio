import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

/**
 * Semantic Duel Mini-Game (2 Options Around Central Word)
 * Features:
 * - Start Screen (Rules, Instructions, Start Button)
 * - Game Screen (Center word + 2 surrounding random options, lives, streaks, points)
 * - Final Score Screen (Victory/Defeat, stats, rank, replay)
 * - Keyboard shortcuts [A] / [B] / [1] / [2] / [Space]
 */
export class GameMode {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onPivotWord = options.onPivotWord || (() => {});

    // Game state
    this.screen = 'start'; // 'start' | 'play' | 'gameover'
    this.maxLives = 3;
    this.totalGameRounds = 10;
    this.lives = this.maxLives;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.roundNumber = 0;
    this.correctAnswersCount = 0;

    this.currentRound = null;
    this.isAnswered = false;

    this.boundKeyHandler = (e) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.boundKeyHandler);

    this.render();
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyHandler);
  }

  handleKeyDown(e) {
    if (this.screen !== 'play') return;

    if (!this.isAnswered) {
      if (e.key === 'a' || e.key === 'A' || e.key === '1') {
        this.handleSelection(0);
      } else if (e.key === 'b' || e.key === 'B' || e.key === '2') {
        this.handleSelection(1);
      }
    } else {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.advanceRound();
      }
    }
  }

  render() {
    this.container.innerHTML = '';
    if (this.screen === 'start') {
      this.renderStartScreen();
    } else if (this.screen === 'play') {
      this.renderPlayScreen();
    } else if (this.screen === 'gameover') {
      this.renderGameOverScreen();
    }
  }

  // =========================================================================
  // 1. PANTALLA DE INICIO
  // =========================================================================
  renderStartScreen() {
    const wrap = document.createElement('div');
    wrap.className = 'game-screen start-screen';
    wrap.innerHTML = `
      <div class="start-card">
        <div class="start-badge">MODO VIDEOJUEGO • ESPACIO VECTORIAL</div>
        <h2 class="start-title">DUELO SEMÁNTICO</h2>
        <div class="start-subtitle">Significado vs. Significante (300 Dimensiones)</div>

        <div class="start-rules-grid">
          <div class="rule-box">
            <div class="rule-icon">🎯</div>
            <div class="rule-heading">1 Palabra Central</div>
            <div class="rule-desc">Aparecerá un concepto objetivo generado al azar.</div>
          </div>
          <div class="rule-box">
            <div class="rule-icon">⚖️</div>
            <div class="rule-heading">2 Opciones Aleatorias</div>
            <div class="rule-desc">Dos palabras competirán a los costados del centro.</div>
          </div>
          <div class="rule-box">
            <div class="rule-icon">🧠</div>
            <div class="rule-heading">Menor Distancia</div>
            <div class="rule-desc">Elige la palabra con mayor afinidad conceptual de significado.</div>
          </div>
          <div class="rule-box">
            <div class="rule-icon">❤️</div>
            <div class="rule-heading">3 Vidas y Rachas</div>
            <div class="rule-desc">Cada fallo te quita 1 vida. ¿Podrás superar las 10 rondas?</div>
          </div>
        </div>

        <div class="start-keyboard-tip">
          ⌨️ Puedes jugar con el <strong>Mouse</strong> o las teclas <strong>[A]</strong> / <strong>[B]</strong> (o <strong>[1]</strong> / <strong>[2]</strong>)
        </div>

        <button class="btn btn-primary btn-play-start" id="btn-start-game">
          INICIAR PARTIDA 🚀
        </button>
      </div>
    `;

    wrap.querySelector('#btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    this.container.appendChild(wrap);
  }

  // =========================================================================
  // 2. PANTALLA DE JUEGO
  // =========================================================================
  renderPlayScreen() {
    const wrap = document.createElement('div');
    wrap.className = 'game-screen play-screen';
    wrap.innerHTML = `
      <!-- HUD Superior -->
      <div class="game-hud">
        <div class="hud-item">
          <span class="hud-label">VIDAS</span>
          <span class="hud-val lives" id="hud-lives">${this.getHeartsHTML()}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">PUNTOS</span>
          <span class="hud-val points" id="hud-score">${this.score}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">RACHA</span>
          <span class="hud-val streak" id="hud-streak">${this.streak} 🔥</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">RONDA</span>
          <span class="hud-val round" id="hud-round">${this.roundNumber} / ${this.totalGameRounds}</span>
        </div>
      </div>

      <div class="game-instruction-banner">
        ¿Cuál de las 2 palabras tiene <strong>MENOR DISTANCIA SEMÁNTICA</strong> (más parecida en significado) a la del centro?
      </div>

      <div class="duel-archetype-pill" id="duel-archetype-pill">Cargando duelo...</div>

      <!-- Tablero del Duelo: 2 opciones flanqueando el centro -->
      <div class="duel-arena">
        <!-- Opción 1 (Izquierda) -->
        <div class="duel-option-slot" id="slot-0"></div>

        <!-- Centro: Palabra Objetivo -->
        <div class="duel-center-slot">
          <div class="duel-center-core">
            <div class="core-wave ring-1"></div>
            <div class="core-wave ring-2"></div>
            <div class="core-tag">PALABRA OBJETIVO</div>
            <div class="core-word" id="duel-target-word">...</div>
          </div>
        </div>

        <!-- Opción 2 (Derecha) -->
        <div class="duel-option-slot" id="slot-1"></div>
      </div>

      <!-- Feedback inferior -->
      <div class="duel-feedback-panel" id="duel-feedback" style="display: none;">
        <div class="duel-feedback-title" id="duel-feedback-title"></div>
        <div class="duel-feedback-detail" id="duel-feedback-detail"></div>
        <button class="btn btn-primary" id="btn-duel-next">Siguiente Ronda ➔ [Enter]</button>
      </div>
    `;

    this.container.appendChild(wrap);
    this.renderCurrentDuelRound();
  }

  getHeartsHTML() {
    let hearts = '';
    for (let i = 0; i < this.maxLives; i++) {
      if (i < this.lives) {
        hearts += '<span class="heart active">❤️</span>';
      } else {
        hearts += '<span class="heart lost">🖤</span>';
      }
    }
    return hearts;
  }

  startGame() {
    this.lives = this.maxLives;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.roundNumber = 0;
    this.correctAnswersCount = 0;
    this.screen = 'play';
    this.render();
    this.nextRound();
  }

  nextRound() {
    this.roundNumber++;
    if (this.roundNumber > this.totalGameRounds || this.lives <= 0) {
      this.endGame();
      return;
    }

    this.isAnswered = false;
    this.currentRound = semanticEngine.generateTwoOptionGameRound();
    this.renderCurrentDuelRound();
    soundFX.playActivate();
  }

  renderCurrentDuelRound() {
    const targetWordEl = this.container.querySelector('#duel-target-word');
    if (!targetWordEl || !this.currentRound) return;

    targetWordEl.textContent = this.currentRound.targetWord.toUpperCase();

    // Actualizar pill de arquetipo
    const archetypePill = this.container.querySelector('#duel-archetype-pill');
    if (archetypePill) {
      archetypePill.textContent = `⚖️ ${this.currentRound.archetypeLabel.toUpperCase()}`;
    }

    // Actualizar HUD
    const hudLives = this.container.querySelector('#hud-lives');
    const hudScore = this.container.querySelector('#hud-score');
    const hudStreak = this.container.querySelector('#hud-streak');
    const hudRound = this.container.querySelector('#hud-round');

    if (hudLives) hudLives.innerHTML = this.getHeartsHTML();
    if (hudScore) hudScore.textContent = this.score;
    if (hudStreak) hudStreak.textContent = `${this.streak} 🔥`;
    if (hudRound) hudRound.textContent = `${this.roundNumber} / ${this.totalGameRounds}`;

    // Ocultar feedback
    const feedbackPanel = this.container.querySelector('#duel-feedback');
    if (feedbackPanel) feedbackPanel.style.display = 'none';

    // Renderizar las 2 opciones
    const labels = ['A', 'B'];
    this.currentRound.options.forEach((opt, idx) => {
      const slot = this.container.querySelector(`#slot-${idx}`);
      if (!slot) return;

      slot.innerHTML = `
        <button class="duel-card" id="duel-opt-${idx}">
          <div class="duel-key-badge">${labels[idx]}</div>
          <div class="duel-card-word">${opt.word}</div>
          <div class="duel-metrics" id="metrics-${idx}" style="display:none;">
            <span class="metric-d">d: ${opt.distance.toFixed(3)}</span>
            <span class="metric-s">Sim: ${(opt.similarity * 100).toFixed(1)}%</span>
          </div>
        </button>
      `;

      const btn = slot.querySelector(`#duel-opt-${idx}`);
      btn.addEventListener('click', () => {
        if (!this.isAnswered) {
          this.handleSelection(idx);
        }
      });

      btn.addEventListener('mouseenter', () => {
        if (!this.isAnswered) soundFX.playHover();
      });
    });

    const nextBtn = this.container.querySelector('#btn-duel-next');
    if (nextBtn) {
      nextBtn.onclick = () => this.advanceRound();
    }
  }

  handleSelection(selectedIndex) {
    if (this.isAnswered || !this.currentRound) return;
    this.isAnswered = true;

    const round = this.currentRound;
    const selectedOpt = round.options[selectedIndex];
    const isCorrect = selectedOpt.isCorrect;

    // Actualizar puntos y vidas
    if (isCorrect) {
      this.correctAnswersCount++;
      const multiplier = 1 + (this.streak * 0.25);
      const pointsWon = Math.round(100 * multiplier);
      this.score += pointsWon;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      soundFX.playCorrect();
    } else {
      this.lives--;
      this.streak = 0;
      soundFX.playWrong();
    }

    // Actualizar HUD
    const hudLives = this.container.querySelector('#hud-lives');
    const hudScore = this.container.querySelector('#hud-score');
    const hudStreak = this.container.querySelector('#hud-streak');
    if (hudLives) hudLives.innerHTML = this.getHeartsHTML();
    if (hudScore) hudScore.textContent = this.score;
    if (hudStreak) hudStreak.textContent = `${this.streak} 🔥`;

    // Revelar métricas en ambas cartas
    round.options.forEach((opt, idx) => {
      const btn = this.container.querySelector(`#duel-opt-${idx}`);
      const metrics = this.container.querySelector(`#metrics-${idx}`);
      if (metrics) metrics.style.display = 'flex';

      if (btn) {
        if (opt.isCorrect) {
          btn.classList.add('correct');
        } else if (idx === selectedIndex) {
          btn.classList.add('incorrect');
        } else {
          btn.classList.add('dimmed');
        }
      }
    });

    // Mostrar panel de feedback
    const feedbackPanel = this.container.querySelector('#duel-feedback');
    const feedbackTitle = this.container.querySelector('#duel-feedback-title');
    const feedbackDetail = this.container.querySelector('#duel-feedback-detail');

    if (feedbackPanel) {
      feedbackPanel.style.display = 'flex';
      feedbackPanel.className = `duel-feedback-panel ${isCorrect ? 'is-correct' : 'is-wrong'}`;

      let nuanceText = '';
      if (round.archetype === 'both_close') {
        nuanceText = '¡Ambas palabras eran cercanas! Pero elegiste la de mayor proximidad.';
      } else if (round.archetype === 'both_far') {
        nuanceText = 'Ambas palabras eran lejanas, pero detectaste el enlace más afín.';
      } else {
        nuanceText = 'Duelo entre palabras aleatorias.';
      }

      if (isCorrect) {
        feedbackTitle.innerHTML = `✓ ¡CORRECTO! MENOR DISTANCIA SEMÁNTICA`;
        feedbackDetail.innerHTML = `
          <strong>"${selectedOpt.word.toUpperCase()}"</strong> tiene menor distancia (<strong>d = ${selectedOpt.distance.toFixed(3)}</strong>)
          con <strong>"${round.targetWord.toUpperCase()}"</strong> que la otra opción (d = ${round.maxDistance.toFixed(3)}).<br>
          <span style="font-size:11px; color:#38bdf8">${nuanceText}</span>
        `;
      } else {
        feedbackTitle.innerHTML = `✗ INCORRECTO (-1 VIDA)`;
        feedbackDetail.innerHTML = `
          Elegiste <strong>"${selectedOpt.word}"</strong> (d = ${selectedOpt.distance.toFixed(3)}).<br>
          La más cercana en significado era <strong>"${round.correctWord.toUpperCase()}"</strong> con menor distancia (<strong>d = ${round.minDistance.toFixed(3)}</strong> vs ${round.maxDistance.toFixed(3)}).
        `;
      }
    }
  }

  advanceRound() {
    if (this.lives <= 0 || this.roundNumber >= this.totalGameRounds) {
      this.endGame();
    } else {
      this.nextRound();
    }
  }

  endGame() {
    this.screen = 'gameover';
    this.render();
  }

  // =========================================================================
  // 3. PANTALLA DE SCORE FINAL
  // =========================================================================
  renderGameOverScreen() {
    const isWin = this.lives > 0;
    const accuracy = this.roundNumber > 0 ? Math.round((this.correctAnswersCount / this.roundNumber) * 100) : 0;

    let rankTitle = 'Iniciado en el Léxico';
    let rankBadge = '🌱';
    if (this.score >= 1200) {
      rankTitle = 'Maestro del Espacio Latente';
      rankBadge = '🧙';
    } else if (this.score >= 700) {
      rankTitle = 'Sincronizador de Significados';
      rankBadge = '⚡';
    } else if (this.score >= 350) {
      rankTitle = 'Explorador Vectorial';
      rankBadge = '🧭';
    }

    const wrap = document.createElement('div');
    wrap.className = 'game-screen gameover-screen';
    wrap.innerHTML = `
      <div class="gameover-card ${isWin ? 'victory' : 'defeat'}">
        <div class="result-banner">
          <div class="result-icon">${isWin ? '🏆' : '💀'}</div>
          <h2 class="result-title">${isWin ? '¡VICTORIA VECTORIAL!' : 'PARTIDA FINALIZADA'}</h2>
          <div class="result-subtitle">
            ${isWin 
              ? 'Has completado con éxito las 10 rondas del Duelo Semántico.' 
              : 'Te has quedado sin vidas en el espacio latente.'}
          </div>
        </div>

        <!-- Rango obtenido -->
        <div class="rank-card">
          <span class="rank-icon">${rankBadge}</span>
          <div class="rank-info">
            <span class="rank-sub">RANGO DE PERCEPCIÓN SEMÁNTICA</span>
            <span class="rank-name">${rankTitle}</span>
          </div>
        </div>

        <!-- Estadísticas finales -->
        <div class="gameover-stats-grid">
          <div class="stat-box">
            <span class="stat-label">PUNTUACIÓN TOTAL</span>
            <span class="stat-val highlight">${this.score}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">RONDAS SUPERADAS</span>
            <span class="stat-val">${this.correctAnswersCount} / ${this.roundNumber}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">MEJOR RACHA</span>
            <span class="stat-val streak">${this.bestStreak} 🔥</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">PRECISIÓN</span>
            <span class="stat-val">${accuracy}%</span>
          </div>
        </div>

        <div class="gameover-actions">
          <button class="btn btn-primary btn-lg" id="btn-restart-game">
            Jugar de Nuevo 🔄
          </button>
          <button class="btn btn-secondary btn-lg" id="btn-back-to-explorer">
            Explorar en Grafo Nodal ☍
          </button>
        </div>
      </div>
    `;

    wrap.querySelector('#btn-restart-game').addEventListener('click', () => {
      this.startGame();
    });

    wrap.querySelector('#btn-back-to-explorer').addEventListener('click', () => {
      if (this.currentRound) {
        this.onPivotWord(this.currentRound.targetWord);
      } else {
        this.onPivotWord('filosofía');
      }
    });

    this.container.appendChild(wrap);
  }
}
