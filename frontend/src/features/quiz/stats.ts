// ──────────────────────────────────────────────
// Estadísticas de preguntas del estudiante.
// Como el resto del progreso, viven en localStorage:
// mejor nota por modo (las estrellas), mejor combo,
// días jugados (la racha) y si el reto de hoy ya está
// hecho. Todo tolera que el almacenamiento falle.
// ──────────────────────────────────────────────

import { starsFor } from './xp'

const STORAGE_KEY = 'poker_academy_quiz_v1'
const MAX_DAYS = 90

/** Modos con récord propio: los seis niveles, aleatorio y la ronda IA. */
export const STAR_MODES = ['beginner', 'intermediate', 'advanced', 'theory', 'exploit', 'pro', 'random', 'ai'] as const
export type StarMode = (typeof STAR_MODES)[number]

export interface QuizStats {
  /** Mejor acierto (0..1) por modo. */
  best: Partial<Record<StarMode, number>>
  rounds: number
  answered: number
  correct: number
  bestCombo: number
  xpEarned: number
  /** Días (`YYYY-MM-DD`) con al menos una ronda terminada. */
  days: string[]
  /** Último día en que se completó el reto diario. */
  dailyDone: string | null
}

export const EMPTY_QUIZ_STATS: QuizStats = {
  best: {},
  rounds: 0,
  answered: 0,
  correct: 0,
  bestCombo: 0,
  xpEarned: 0,
  days: [],
  dailyDone: null,
}

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function readQuizStats(): QuizStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_QUIZ_STATS }
    const parsed = JSON.parse(raw) as Partial<QuizStats>
    return {
      ...EMPTY_QUIZ_STATS,
      ...parsed,
      best: parsed.best ?? {},
      days: Array.isArray(parsed.days) ? parsed.days : [],
    }
  } catch {
    return { ...EMPTY_QUIZ_STATS }
  }
}

export function writeQuizStats(stats: QuizStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Sin almacenamiento la ronda sigue contando XP; solo se pierde el récord.
  }
}

export interface RoundRecord {
  mode: StarMode
  correct: number
  total: number
  bestCombo: number
  xp: number
  daily: boolean
}

export interface RecordOutcome {
  stats: QuizStats
  /** Superó su mejor nota en ese modo. */
  newBest: boolean
  /** Superó su mejor combo histórico. */
  newCombo: boolean
  /** Estrellas ganadas por encima de las que ya tenía en ese modo. */
  starsGained: number
}

export function recordRound(stats: QuizStats, round: RoundRecord, today: string = dayKey()): RecordOutcome {
  const ratio = round.total ? round.correct / round.total : 0
  const previous = stats.best[round.mode] ?? 0
  const days = stats.days.includes(today) ? stats.days : [...stats.days, today].slice(-MAX_DAYS)

  const next: QuizStats = {
    ...stats,
    best: { ...stats.best, [round.mode]: Math.max(previous, ratio) },
    rounds: stats.rounds + 1,
    answered: stats.answered + round.total,
    correct: stats.correct + round.correct,
    bestCombo: Math.max(stats.bestCombo, round.bestCombo),
    xpEarned: stats.xpEarned + round.xp,
    days,
    dailyDone: round.daily ? today : stats.dailyDone,
  }

  return {
    stats: next,
    newBest: stats.rounds > 0 && ratio > previous,
    newCombo: stats.bestCombo > 0 && round.bestCombo > stats.bestCombo,
    starsGained: Math.max(0, starsFor(ratio) - starsFor(previous)),
  }
}

/** Días seguidos jugando, contando hoy o, si hoy aún no, hasta ayer. */
export function quizStreak(days: string[], today: string = dayKey()): number {
  const played = new Set(days)
  const cursor = new Date(`${today}T12:00:00`)
  if (!played.has(today)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (played.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function totalStars(stats: QuizStats): number {
  return STAR_MODES.reduce((sum, mode) => sum + starsFor(stats.best[mode] ?? 0), 0)
}
