import { semanticEngine } from '../engine/semanticVectorEngine.js';
import { soundFX } from '../audio/soundFX.js';

/**
 * Semantic Distance Mini-Game
 * Implements the user's game mechanics:
 * 1 target word in the center + 5 option words.
 * The player must find the word with the LOWEST semantic distance (closest in meaning, NOT form).
 */
export class GameMode {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.totalRounds = 0;
    this.currentRound = null;
    this.isAnswered = false;
    this.onPivotWord = options.onPivotWord || (() => {});

    this.renderInitial();
  }

  renderInitial() {
    this.container.innerHTML = `
      <div class="game-wrapper">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">PUNTOS</span>
            <span class="hud-val" id="game-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">RACHA</span>
            <span class="hud-val racha" id="game-streak">0 🔥</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">PRECISIÓN</span>
            <span class="hud-val" id="game-accuracy">100%</span>
          </div>
        </div>

        <div class="game-instruction">
          Selecciona la palabra con <strong>MENOR DISTANCIA SEMÁNTICA</strong> (mayor cercanía en <em>significado</em>, no de <em>significante</em>):
        </div>

        <div class="game-board">
          <!-- 5 option buttons will surround or frame the center -->
          <div class="game-options-container" id="game-options"></div>

          <!-- Central target word -->
          <div class="game-center-target" id="game-center">
            <div class="target-glow"></div>
            <div class="target-sub">PALABRA OBJETIVO</div>
            <div class="target-word" id="target-word-display">...</div>
          </div>
        </div>

        <div class="game-feedback" id="game-feedback" style="display: none;">
          <div class="feedback-title" id="feedback-title"></div>
          <div class="feedback-desc" id="feedback-desc"></div>
          <div class="feedback-actions">
            <button class="btn btn-primary" id="btn-next-round">Siguiente Ronda ➔</button>
            <button class="btn btn-secondary" id="btn-explore-center">Ver en Explorador Nodal ☍</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-next-round').addEventListener('click', () => {
      this.nextRound();
    });

    this.container.querySelector('#btn-explore-center').addEventListener('click', () => {
      if (this.currentRound) {
        this.onPivotWord(this.currentRound.targetWord);
      }
    });
  }

  start() {
    this.score = 0;
    this.streak = 0;
    this.totalRounds = 0;
    this.updateHUD();
    this.nextRound();
  }

  nextRound() {
    this.isAnswered = false;
    this.currentRound = semanticEngine.generateGameRound();

    const targetDisplay = this.container.querySelector('#target-word-display');
    targetDisplay.textContent = this.currentRound.targetWord.toUpperCase();

    const feedback = this.container.querySelector('#game-feedback');
    feedback.style.display = 'none';

    const optionsContainer = this.container.querySelector('#game-options');
    optionsContainer.innerHTML = '';

    this.currentRound.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'game-option-btn';
      btn.id = `opt-${idx}`;
      btn.innerHTML = `
        <span class="opt-num">${idx + 1}</span>
        <span class="opt-text">${opt.word}</span>
        <span class="opt-metrics" style="display:none;">d: ${opt.distance.toFixed(2)} (${(opt.similarity * 100).toFixed(0)}%)</span>
      `;

      btn.addEventListener('click', () => {
        if (this.isAnswered) return;
        this.handleSelection(idx);
      });

      btn.addEventListener('mouseenter', () => {
        if (!this.isAnswered) soundFX.playHover();
      });

      optionsContainer.appendChild(btn);
    });

    soundFX.playActivate();
  }

  handleSelection(selectedIndex) {
    this.isAnswered = true;
    this.totalRounds++;
    const round = this.currentRound;
    const selectedOpt = round.options[selectedIndex];
    const isCorrect = selectedOpt.isCorrect;

    // Update score and streak
    if (isCorrect) {
      this.score += 100 + (this.streak * 25);
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      soundFX.playCorrect();
    } else {
      this.streak = 0;
      soundFX.playWrong();
    }

    this.updateHUD();

    // Reveal distances on all buttons
    round.options.forEach((opt, idx) => {
      const btn = this.container.querySelector(`#opt-${idx}`);
      const metrics = btn.querySelector('.opt-metrics');
      metrics.style.display = 'block';

      if (opt.isCorrect) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex) {
        btn.classList.add('incorrect');
      } else {
        btn.classList.add('dimmed');
      }
    });

    // Show feedback explanation
    const feedback = this.container.querySelector('#game-feedback');
    const feedbackTitle = this.container.querySelector('#feedback-title');
    const feedbackDesc = this.container.querySelector('#feedback-desc');

    feedback.style.display = 'block';
    feedback.className = `game-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;

    if (isCorrect) {
      feedbackTitle.innerHTML = `✓ ¡EXCELENTE! MENOR DISTANCIA SEMÁNTICA ENCONTRADA`;
      feedbackDesc.innerHTML = `
        <strong>${selectedOpt.word.toUpperCase()}</strong> es la más cercana en significado a <strong>${round.targetWord.toUpperCase()}</strong>
        con una distancia de solo <strong>${selectedOpt.distance.toFixed(3)}</strong> (similitud del ${(selectedOpt.similarity * 100).toFixed(1)}%).
      `;
    } else {
      feedbackTitle.innerHTML = `✗ NO EXACTO`;
      feedbackDesc.innerHTML = `
        Elegiste <strong>${selectedOpt.word}</strong> (distancia: ${selectedOpt.distance.toFixed(2)}).<br>
        La correcta con menor distancia semántica era <strong>${round.correctWord.toUpperCase()}</strong>
        con distancia de <strong>${round.minDistance.toFixed(3)}</strong> (${(round.maxSimilarity * 100).toFixed(1)}% similitud conceptual).
      `;
    }
  }

  updateHUD() {
    const scoreEl = this.container.querySelector('#game-score');
    const streakEl = this.container.querySelector('#game-streak');
    const accEl = this.container.querySelector('#game-accuracy');

    if (scoreEl) scoreEl.textContent = this.score;
    if (streakEl) streakEl.textContent = `${this.streak} 🔥`;
    if (accEl) {
      const acc = this.totalRounds > 0 ? Math.round(((this.score > 0 ? (this.totalRounds - (this.streak === 0 && this.totalRounds > 0 ? 1 : 0)) : 0) / this.totalRounds) * 100) : 100;
      accEl.textContent = `${Math.min(100, Math.max(0, acc))}%`;
    }
  }
}
