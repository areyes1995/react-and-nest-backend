// ──────────────────────────────────────────────
// Quiz API — el banco de preguntas.
// Las preguntas viven en el backend (seeder + IA);
// aquí solo se piden. Llegan ya barajadas y con la
// misma forma vengan de la base, del banco semilla o
// de la IA, así que la página las pinta igual.
// Generar y guardar es solo para ADMIN/SUPERADMIN
// (el backend lo impone; aquí solo se oculta).
//
// Meta y preguntas se traducen al idioma de Ajustes
// (`@services/translate`). Lo generado por la IA NO:
// el administrador lo revisa y lo guarda en la base,
// que tiene que quedar en español.
// ──────────────────────────────────────────────

import { get, post } from './api'
import { translateContent } from './translate'
import type { LevelId } from '@features/academy/types'

export type QuizMode = LevelId | 'random'
export type QuizFormat = 'multiple-choice' | 'true-false' | 'spot'
/** `local` = banco propio de la academia; `ai` = generada por IA. */
export type QuizSource = 'local' | 'ai'

export interface QuizQuestion {
  id: string
  level: LevelId
  format: QuizFormat
  category: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  /** Situación con cartas, en notación del motor (`As Kh`). */
  hole: string | null
  board: string | null
  source: QuizSource
}

export interface QuizMeta {
  levels: { id: LevelId; label: string; count: number }[]
  categories: { id: string; label: string; count: number }[]
  total: number
  /** Publicadas por origen. */
  sources: Record<QuizSource, number>
  /** `false` si el backend aún no tiene la tabla y sirve el banco en memoria. */
  persisted: boolean
  /** ADMIN o SUPERADMIN: ve el generador y puede guardar en el banco. */
  canGenerate: boolean
  /** Solo llega a administradores. */
  ai: {
    ready: boolean
    provider: string
    model: string
    /** Qué falta por configurar, en lenguaje llano. */
    issues: string[]
    maxQuestions: number
  } | null
}

export interface QuizGenerateRequest {
  level: LevelId
  category?: string
  format?: QuizFormat
  count?: number
  topic?: string
}

export interface QuizGenerateResult {
  source: 'ai'
  questions: QuizQuestion[]
  discarded: number
  model?: string
  provider: string
  latencyMs: number
}

/** Resultado con el motivo del fallo, para poder explicárselo al estudiante. */
export type QuizResult<T> = { ok: true; data: T } | { ok: false; error: string }

function failure(error: string | undefined, status: number): { ok: false; error: string } {
  if (status === 0) return { ok: false, error: 'No se pudo conectar con el servidor.' }
  return { ok: false, error: error || `El servidor respondió ${status}.` }
}

export async function fetchQuizMeta(): Promise<QuizResult<QuizMeta>> {
  const res = await get<QuizMeta>('/quiz/meta')
  return res.ok ? { ok: true, data: await translateContent(res.data) } : failure(res.error, res.status)
}

export async function fetchQuizQuestions(params: {
  mode: QuizMode
  category?: string
  source?: QuizSource
  limit: number
}): Promise<QuizResult<QuizQuestion[]>> {
  const res = await get<{ questions: QuizQuestion[] }>('/quiz/questions', params)
  return res.ok
    ? { ok: true, data: await translateContent(res.data.questions) }
    : failure(res.error, res.status)
}

export async function generateQuiz(
  request: QuizGenerateRequest,
): Promise<QuizResult<QuizGenerateResult>> {
  const res = await post<QuizGenerateResult>('/quiz/generate', request)
  return res.ok ? { ok: true, data: res.data } : failure(res.error, res.status)
}

export interface SaveQuizResult {
  saved: number
  skipped: number
  published: boolean
}

/** Guarda en la base (origen IA) las preguntas elegidas. Solo administradores. */
export async function saveQuizQuestions(
  questions: QuizQuestion[],
  publish: boolean,
): Promise<QuizResult<SaveQuizResult>> {
  const res = await post<SaveQuizResult>('/quiz/questions', {
    publish,
    questions: questions.map(question => ({
      id: question.id,
      level: question.level,
      format: question.format,
      category: question.category,
      question: question.question,
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hole: question.hole ?? undefined,
      board: question.board ?? undefined,
    })),
  })
  return res.ok ? { ok: true, data: res.data } : failure(res.error, res.status)
}
