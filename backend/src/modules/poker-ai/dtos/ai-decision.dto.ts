// ──────────────────────────────────────────────
// Respuesta del backend a una petición de decisión.
// `source` es lo importante para el cliente: dice si
// jugó la IA, si se cayó al bot heurístico o si la IA
// está apagada y debe decidir el motor local.
// ──────────────────────────────────────────────

export type DecisionSource = 'ai' | 'fallback' | 'bots';

export type DecisionActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface DecisionAction {
  type: DecisionActionType;
  /** Para `bet`/`raise`: total apostado en la calle tras la acción. */
  amount?: number;
}

export interface PokerAiDecisionResult {
  source: DecisionSource;
  action: DecisionAction;
  /** Explicación breve del rival, en español, para el historial de la mano. */
  reasoning?: string;
  /** Talante del rival según la IA (`confiado`, `dudando`…), para la mesa. */
  mood?: string;
  model?: string;
  provider?: string;
  latencyMs?: number;
  /** La IA propuso algo ilegal y se ajustó a la acción legal más cercana. */
  adjusted?: boolean;
  /** Motivo por el que no decidió la IA. */
  error?: string;
}

export interface PokerAiStatusResult {
  /** La IA está encendida y bien configurada: la mesa puede usarla. */
  ready: boolean;
  enabled: boolean;
  provider: string;
  /** Solo se expone el modelo, nunca la clave. */
  model: string;
  baseUrl: string;
  /** `true` si hay una API key configurada (sin revelarla). */
  hasApiKey: boolean;
  maxAiSeats: number;
  fallbackToBots: boolean;
  /** Qué falta para que funcione, en lenguaje llano. */
  issues: string[];
  /** Resultado del último sondeo al proveedor, si se pidió. */
  reachable?: boolean;
  reachableError?: string;
}
