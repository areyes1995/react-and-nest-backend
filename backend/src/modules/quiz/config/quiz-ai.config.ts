// ──────────────────────────────────────────────
// Ajustes de la IA que genera preguntas.
// El proveedor, el modelo y la clave son los mismos
// de la mesa (POKER_AI_*): se conecta una sola vez.
// Aquí solo va lo que cambia para esta tarea — una
// tanda de preguntas necesita bastantes más tokens y
// tiempo que decidir una jugada. Guardar lo generado
// no es configuración: lo decide el administrador al
// revisar cada tanda.
// ──────────────────────────────────────────────

import { QUIZ_MAX_LIMIT } from '../constants/quiz.constants';

export interface QuizAiSettings {
  maxTokens: number;
  timeoutMs: number;
  temperature: number;
  /** Tope de preguntas por petición. */
  maxQuestions: number;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && value.trim() !== '' && Number.isFinite(parsed)
    ? parsed
    : fallback;
}

export function readQuizAiSettings(env: NodeJS.ProcessEnv = process.env): QuizAiSettings {
  return {
    maxTokens: Math.max(400, num(env.QUIZ_AI_MAX_TOKENS, 2400)),
    timeoutMs: Math.max(5_000, num(env.QUIZ_AI_TIMEOUT_MS, 60_000)),
    temperature: num(env.QUIZ_AI_TEMPERATURE, 0.8),
    maxQuestions: Math.min(QUIZ_MAX_LIMIT, Math.max(1, num(env.QUIZ_AI_MAX_QUESTIONS, 10))),
  };
}
