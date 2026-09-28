// ──────────────────────────────────────────────
// Contrato de un proveedor de IA para la mesa.
// Devuelve texto crudo: la traducción a una acción
// legal es responsabilidad del validador, no del
// proveedor. Así añadir un proveedor nuevo es
// implementar un único método.
// ──────────────────────────────────────────────

import { PokerAiSettings } from '../../config/poker-ai.config';

export interface AiPrompt {
  system: string;
  user: string;
}

export interface AiCompletion {
  text: string;
  model?: string;
  latencyMs: number;
  tokens?: { prompt: number; completion: number };
}

export interface PokerAiProvider {
  /** Pide una respuesta al modelo. Lanza si la API falla o tarda de más. */
  complete(prompt: AiPrompt, settings: PokerAiSettings): Promise<AiCompletion>;
  /** Sondeo de disponibilidad para el panel de estado. */
  ping(settings: PokerAiSettings): Promise<void>;
}

export const POKER_AI_PROVIDER = 'PokerAiProvider';
