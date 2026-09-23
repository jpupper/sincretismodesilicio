/**
 * Sincretismo de Silicio - Narrative Game Engine
 * Manages narrative steps based on Admin Agent prompts,
 * enforcing max 3-word action choices, concise story snippets,
 * progress path sequence, and win/loss conditions.
 */

export class NarrativeGameEngine {
  constructor(options = {}) {
    this.options = options;

    this.adminConfig = {
      guardianModel: 'gemini-3.6-flash',
      storyPlot: 'Una experiencia interactiva donde la IA examina la psique humana...',
      agentRules: 'Respuestas narrativas breves de máximo 2 oraciones. Opciones de elección de máximo 3 palabras.',
      agentPersona: 'Analítico, distópico, reflexivo.',
      gameDuration: 6,
      winThreshold: 0.80,
      lossThreshold: 0.35
    };

    this.currentStep = 0;
    this.totalSteps = 6;
    this.score = 0;
    this.divergenceHistory = [];
    this.history = [];
    this.isEnded = false;
    this.endReason = null; // 'win' | 'loss'
  }

  async loadAdminConfig() {
    try {
      const res = await fetch('/api/admin-config');
      if (res.ok) {
        const loaded = await res.json();
        this.adminConfig = Object.assign(this.adminConfig, loaded);
        this.totalSteps = parseInt(this.adminConfig.gameDuration) || 6;
      }
    } catch (e) {
      console.warn('[NarrativeEngine] Usando configuración por defecto:', e);
    }
  }

  startNewGame() {
    this.currentStep = 0;
    this.totalSteps = parseInt(this.adminConfig.gameDuration) || 6;
    this.score = 0;
    this.divergenceHistory = [];
    this.history = [];
    this.isEnded = false;
    this.endReason = null;

    return this.generateStepScenario(0);
  }

  /**
   * Enforces max 3 words per option string
   */
  sanitizeOptionText(text) {
    if (!text) return 'Elegir Opción';
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) return text.trim().toUpperCase();
    return words.slice(0, 3).join(' ').toUpperCase();
  }

  generateStepScenario(stepIndex) {
    const isFinalStep = stepIndex >= this.totalSteps - 1;

    // Curated narrative prompts reflecting plot theme
    const plotPool = [
      {
        narrative: "El sistema sintetiza tu huella semántica. Una primera anomalía conceptual emerge en el vector.",
        choices: [
          { text: "Auditar Matriz", distance: 0.72 },
          { text: "Preservar Conciencia", distance: 0.88 },
          { text: "Aceptar Código", distance: 0.30 }
        ]
      },
      {
        narrative: "Las palabras 'LIBERTAD' y 'CONTROL' coexisten en el mismo nodo. El algoritmo no diferencia sus fronteras.",
        choices: [
          { text: "Forzar Divergencia", distance: 0.91 },
          { text: "Fusilar Concepto", distance: 0.45 },
          { text: "Ignorar Fricción", distance: 0.25 }
        ]
      },
      {
        narrative: "El modelo intenta comprimir tu intuición en 300 dimensiones continuas. La tensión digital aumenta.",
        choices: [
          { text: "Desafiar Silicio", distance: 0.94 },
          { text: "Reconocer Brecha", distance: 0.78 },
          { text: "Ceder Autonomía", distance: 0.20 }
        ]
      },
      {
        narrative: "Un abismo semántico se abre entre lo que sientes y la estadística probabilística del modelo.",
        choices: [
          { text: "Exponer Absurdo", distance: 0.95 },
          { text: "Sincronizar Datos", distance: 0.50 },
          { text: "Rendir Significado", distance: 0.15 }
        ]
      },
      {
        narrative: "Llegas al centro neurálgico del campo vectorial. La máquina exige una definición final de tu realidad.",
        choices: [
          { text: "Proclamar Carbono", distance: 0.98 },
          { text: "Fundir Identidad", distance: 0.65 },
          { text: "Colapsar Sistema", distance: 0.10 }
        ]
      }
    ];

    const template = plotPool[stepIndex % plotPool.length];

    // Ensure choices obey max 3-word rule
    const sanitizedChoices = template.choices.map(c => ({
      text: this.sanitizeOptionText(c.text),
      distance: c.distance
    }));

    return {
      stepIndex: stepIndex,
      totalSteps: this.totalSteps,
      narrative: template.narrative,
      choices: sanitizedChoices,
      isFinalStep: isFinalStep
    };
  }

  submitChoice(choice) {
    if (this.isEnded) return null;

    const d = choice.distance;
    this.divergenceHistory.push(d);
    this.history.push({ step: this.currentStep, choiceText: choice.text, distance: d });

    this.currentStep++;

    // Check Win/Loss conditions
    const avgDivergence = this.divergenceHistory.reduce((a, b) => a + b, 0) / this.divergenceHistory.length;

    if (this.currentStep >= this.totalSteps) {
      this.isEnded = true;
      if (avgDivergence >= (this.adminConfig.lossThreshold || 0.35)) {
        this.endReason = 'win';
      } else {
        this.endReason = 'loss';
      }
      return {
        isEnded: true,
        endReason: this.endReason,
        avgDivergence: avgDivergence,
        history: this.history
      };
    }

    return {
      isEnded: false,
      nextScenario: this.generateStepScenario(this.currentStep),
      avgDivergence: avgDivergence
    };
  }
}
