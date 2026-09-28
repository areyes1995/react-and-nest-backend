// ──────────────────────────────────────────────
// XP de las preguntas — el multiplicador.
// Responder bien paga, pero responder bien SEGUIDO
// paga mucho más: el combo sube el multiplicador
// hasta ×3 y un fallo lo devuelve a ×1. Esa tensión
// ("no lo pierdas ahora") es lo que engancha.
//
// Encima del combo se apilan tres extras:
//  - preguntas de IA: ×2 la base,
//  - ronda perfecta: +50% del total,
//  - reto del día: ×2 todo, una vez al día.
// Funciones puras: la página solo las pinta.
// ──────────────────────────────────────────────

import type { LevelId } from '@features/academy/types'

/** XP base por acierto: cuanto más difícil el nivel, más paga. */
export const BASE_XP: Record<LevelId, number> = {
  beginner: 2,
  intermediate: 3,
  advanced: 4,
  theory: 4,
  exploit: 5,
  pro: 5,
}

export const AI_MULTIPLIER = 2
export const PERFECT_BONUS = 0.5
export const DAILY_MULTIPLIER = 2
/** Por debajo de este tamaño una ronda perfecta no tiene mérito suficiente. */
export const PERFECT_MIN_QUESTIONS = 5

/** Escalones del combo: a partir de `from` aciertos seguidos, `multiplier`. */
export const COMBO_TIERS = [
  { from: 8, multiplier: 3 },
  { from: 5, multiplier: 2 },
  { from: 3, multiplier: 1.5 },
  { from: 0, multiplier: 1 },
] as const

/** Multiplicador con `streak` aciertos seguidos (contando el actual). */
export function comboMultiplier(streak: number): number {
  return COMBO_TIERS.find(tier => streak >= tier.from)?.multiplier ?? 1
}

/** Cuántos aciertos faltan para el siguiente escalón; `null` si ya está en el máximo. */
export function nextComboTier(streak: number): { missing: number; multiplier: number } | null {
  const next = [...COMBO_TIERS].reverse().find(tier => tier.from > streak)
  return next ? { missing: next.from - streak, multiplier: next.multiplier } : null
}

export interface ScorableQuestion {
  level: LevelId
  answerIndex: number
  source: 'local' | 'ai'
}

/** XP de una respuesta concreta. */
export function answerXp(question: ScorableQuestion, streak: number): number {
  const base = BASE_XP[question.level] * (question.source === 'ai' ? AI_MULTIPLIER : 1)
  return Math.round(base * comboMultiplier(streak))
}

export interface RoundScore {
  correct: number
  /** XP de cada respuesta, en orden (0 si falló). */
  perAnswer: number[]
  /** Racha más larga de la ronda. */
  bestCombo: number
  /** Desglose: lo que se habría ganado sin extras y lo que aporta cada uno. */
  base: number
  aiExtra: number
  comboExtra: number
  perfectBonus: number
  dailyBonus: number
  /** XP total de la ronda, con todos los extras. */
  total: number
  perfect: boolean
}

export function scoreRound(
  questions: ScorableQuestion[],
  answers: number[],
  options: { daily?: boolean } = {},
): RoundScore {
  let streak = 0
  let bestCombo = 0
  let base = 0
  let aiExtra = 0
  const perAnswer: number[] = []

  questions.forEach((question, index) => {
    if (answers[index] !== question.answerIndex) {
      streak = 0
      perAnswer.push(0)
      return
    }
    streak += 1
    bestCombo = Math.max(bestCombo, streak)
    const plain = BASE_XP[question.level]
    base += plain
    if (question.source === 'ai') aiExtra += plain * (AI_MULTIPLIER - 1)
    perAnswer.push(answerXp(question, streak))
  })

  const earned = perAnswer.reduce((sum, xp) => sum + xp, 0)
  const correct = perAnswer.filter(xp => xp > 0).length
  const perfect = questions.length >= PERFECT_MIN_QUESTIONS && correct === questions.length
  const perfectBonus = perfect ? Math.round(earned * PERFECT_BONUS) : 0
  const beforeDaily = earned + perfectBonus
  const dailyBonus = options.daily ? beforeDaily * (DAILY_MULTIPLIER - 1) : 0

  return {
    correct,
    total: beforeDaily + dailyBonus,
    perAnswer,
    bestCombo,
    base,
    aiExtra,
    comboExtra: earned - base - aiExtra,
    perfectBonus,
    dailyBonus,
    perfect,
  }
}

/** Estrellas de una ronda: 1 desde el 50%, 2 desde el 80%, 3 si es perfecta. */
export function starsFor(ratio: number): number {
  if (ratio >= 1) return 3
  if (ratio >= 0.8) return 2
  if (ratio >= 0.5) return 1
  return 0
}

/** XP máximo que puede dar una ronda de `count` preguntas de un nivel (combo incluido). */
export function maxRoundXp(level: LevelId, count: number, source: 'local' | 'ai' = 'local'): number {
  const questions = Array.from({ length: count }, () => ({ level, answerIndex: 0, source }))
  return scoreRound(questions, questions.map(() => 0)).total
}
