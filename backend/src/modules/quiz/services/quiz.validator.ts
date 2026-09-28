// ──────────────────────────────────────────────
// Validación de las preguntas que devuelve la IA.
// Regla de oro, la misma que en la mesa: la IA
// propone, el validador dispone. Una pregunta con
// la respuesta fuera de rango, opciones repetidas o
// cartas imposibles se descarta entera; nunca llega
// al estudiante a medio arreglar.
// ──────────────────────────────────────────────

import {
  QUIZ_CATEGORY_IDS,
  QUIZ_FORMATS,
  QuizFormatId,
  QuizLevelId,
} from '../constants/quiz.constants';
import { QuizQuestionView } from '../dtos/quiz.dto';

export const TRUE_FALSE_OPTIONS = ['Verdadero', 'Falso'];

export interface NormalizeContext {
  level: QuizLevelId;
  category?: string;
  format?: QuizFormatId;
}

/** Pregunta ya validada, lista para guardar o servir (sin barajar). */
export type NormalizedQuestion = Omit<QuizQuestionView, 'id' | 'source'>;

const SUIT_SYMBOLS: Record<string, string> = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

/** "10h", "AS", "K♠" → "Th", "As", "Ks". `null` si no es una carta. */
function normalizeCard(raw: string): string | null {
  let card = raw.trim();
  const last = card.slice(-1);
  if (SUIT_SYMBOLS[last]) card = card.slice(0, -1) + SUIT_SYMBOLS[last];
  if (card.startsWith('10')) card = `T${card.slice(2)}`;
  const match = /^([2-9TJQKA])([shdc])$/i.exec(card);
  return match ? `${match[1].toUpperCase()}${match[2].toLowerCase()}` : null;
}

/** Lista de cartas válida con el tamaño pedido, o `null`. */
function parseCardList(value: unknown, min: number, max: number): string[] | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cards = value.trim().split(/[\s,]+/).map(normalizeCard);
  if (cards.some((card) => card === null)) return null;
  if (cards.length < min || cards.length > max) return null;
  return cards as string[];
}

/** Índice de la correcta: número, texto numérico o el texto de la opción. */
function resolveAnswer(raw: Record<string, unknown>, options: string[]): number | null {
  const candidate = raw.answerIndex ?? raw.answer_index ?? raw.correctIndex;
  const index = typeof candidate === 'string' ? Number(candidate) : candidate;
  if (typeof index === 'number' && Number.isInteger(index)) {
    return index >= 0 && index < options.length ? index : null;
  }
  if (typeof raw.answer === 'string') {
    const found = options.findIndex(
      (option) => option.toLowerCase() === (raw.answer as string).trim().toLowerCase(),
    );
    return found === -1 ? null : found;
  }
  return null;
}

/** Valida y normaliza una pregunta. `null` = se descarta. */
export function normalizeQuestion(
  raw: unknown,
  context: NormalizeContext,
): NormalizedQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const question = text(item.question, 10, 500);
  const explanation = text(item.explanation, 10, 900);
  if (!question || !explanation || !Array.isArray(item.options)) return null;

  const parsedOptions = item.options.map((option) => text(option, 1, 200));
  if (parsedOptions.some((option) => option === null)) return null;
  const options = parsedOptions as string[];
  const unique = new Set(options.map((option) => option.toLowerCase()));
  if (unique.size !== options.length || options.length < 2 || options.length > 6) return null;

  const answerIndex = resolveAnswer(item, options);
  if (answerIndex === null) return null;

  // ── Formato: el pedido manda; si no, el declarado; si no, se deduce ──
  const declared = QUIZ_FORMATS.find((format) => format === item.format);
  const holeCards = parseCardList(item.hole, 2, 2);
  const boardCards = parseCardList(item.board, 3, 5);
  const looksTrueFalse =
    options.length === 2 &&
    options.every((option) => /^(verdadero|falso)$/i.test(option));

  const format: QuizFormatId =
    context.format ??
    declared ??
    (holeCards || boardCards ? 'spot' : looksTrueFalse ? 'true-false' : 'multiple-choice');

  if (format === 'true-false') {
    if (!looksTrueFalse) return null;
    // Orden canónico: "Verdadero" siempre primero, para no confundir al alumno.
    const saidTrue = /^verdadero$/i.test(options[answerIndex]);
    return {
      level: context.level,
      format,
      category: resolveCategory(item.category, context),
      question,
      options: [...TRUE_FALSE_OPTIONS],
      answerIndex: saidTrue ? 0 : 1,
      explanation,
      hole: null,
      board: null,
    };
  }

  if (format === 'multiple-choice' && options.length < 3) return null;

  // Una situación sin cartas válidas no se puede pintar: fuera.
  if (format === 'spot') {
    if (!holeCards && !boardCards) return null;
    const all = [...(holeCards ?? []), ...(boardCards ?? [])];
    if (new Set(all).size !== all.length) return null;
  }

  return {
    level: context.level,
    format,
    category: resolveCategory(item.category, context),
    question,
    options,
    answerIndex,
    explanation,
    hole: format === 'spot' && holeCards ? holeCards.join(' ') : null,
    board: format === 'spot' && boardCards ? boardCards.join(' ') : null,
  };
}

function resolveCategory(value: unknown, context: NormalizeContext): string {
  if (context.category) return context.category;
  return typeof value === 'string' && QUIZ_CATEGORY_IDS.includes(value) ? value : 'theory';
}

/** La lista de preguntas de la respuesta, tolerando que el modelo devuelva una sola. */
export function questionList(parsed: Record<string, unknown>): unknown[] {
  if (Array.isArray(parsed.questions)) return parsed.questions;
  if (typeof parsed.question === 'string') return [parsed];
  return [];
}

/**
 * Baraja las opciones y recalcula la correcta. Los modelos (y quien escribe
 * preguntas) tienden a poner la buena la primera; así la posición no enseña
 * nada. Verdadero/falso mantiene su orden.
 */
export function shuffleOptions<T extends { format: QuizFormatId; options: string[]; answerIndex: number }>(
  question: T,
  random: () => number = Math.random,
): T {
  if (question.format === 'true-false') return question;

  const order = question.options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return {
    ...question,
    options: order.map((index) => question.options[index]),
    answerIndex: order.indexOf(question.answerIndex),
  };
}

/** Muestra aleatoria sin repetición (Fisher-Yates parcial). */
export function sample<T>(items: T[], size: number, random: () => number = Math.random): T[] {
  const pool = [...items];
  const count = Math.min(size, pool.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
