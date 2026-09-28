import { describe, expect, it } from 'vitest'
import {
  answerXp,
  comboMultiplier,
  maxRoundXp,
  nextComboTier,
  scoreRound,
  starsFor,
} from '../xp'
import { EMPTY_QUIZ_STATS, quizStreak, recordRound, totalStars } from '../stats'

const q = (level: 'beginner' | 'pro' = 'beginner', source: 'local' | 'ai' = 'local') => ({
  level,
  answerIndex: 0,
  source,
})

describe('combo', () => {
  it('sube por escalones y se queda en ×3', () => {
    expect([1, 2, 3, 4, 5, 7, 8, 20].map(comboMultiplier)).toEqual([1, 1, 1.5, 1.5, 2, 2, 3, 3])
  })

  it('dice cuánto falta para el siguiente escalón', () => {
    expect(nextComboTier(1)).toEqual({ missing: 2, multiplier: 1.5 })
    expect(nextComboTier(4)).toEqual({ missing: 1, multiplier: 2 })
    expect(nextComboTier(8)).toBeNull()
  })
})

describe('scoreRound', () => {
  it('un fallo reinicia el combo', () => {
    const questions = Array.from({ length: 5 }, () => q())
    const score = scoreRound(questions, [0, 0, 0, 1, 0])
    // 2, 2, 2×1.5=3, fallo, 2 (combo reiniciado)
    expect(score.perAnswer).toEqual([2, 2, 3, 0, 2])
    expect(score.bestCombo).toBe(3)
    expect(score.perfect).toBe(false)
    expect(score.total).toBe(9)
    expect(score.base + score.aiExtra + score.comboExtra).toBe(9)
  })

  it('las preguntas de IA pagan el doble', () => {
    expect(answerXp(q('pro', 'ai'), 1)).toBe(10)
    const score = scoreRound([q('pro', 'ai')], [0])
    expect(score).toMatchObject({ base: 5, aiExtra: 5, total: 10 })
  })

  it('ronda perfecta +50% y reto del día ×2, apilados', () => {
    const questions = Array.from({ length: 5 }, () => q())
    const plain = scoreRound(questions, [0, 0, 0, 0, 0])
    // 2 + 2 + 3 + 3 + 4 = 14; perfecta +7 = 21
    expect(plain.total).toBe(21)
    expect(plain.perfect).toBe(true)
    const daily = scoreRound(questions, [0, 0, 0, 0, 0], { daily: true })
    expect(daily.total).toBe(42)
    expect(daily.dailyBonus).toBe(21)
  })

  it('el máximo de una ronda es lo que se anuncia en la tarjeta', () => {
    expect(maxRoundXp('beginner', 5)).toBe(21)
  })
})

describe('estadísticas', () => {
  it('estrellas por nota', () => {
    expect([0.2, 0.5, 0.8, 1].map(starsFor)).toEqual([0, 1, 2, 3])
  })

  it('guarda récords y detecta estrellas nuevas', () => {
    const first = recordRound(
      EMPTY_QUIZ_STATS,
      { mode: 'beginner', correct: 4, total: 5, bestCombo: 3, xp: 10, daily: true },
      '2026-09-23',
    )
    expect(first.starsGained).toBe(2)
    expect(first.stats.dailyDone).toBe('2026-09-23')
    expect(totalStars(first.stats)).toBe(2)

    const second = recordRound(
      first.stats,
      { mode: 'beginner', correct: 5, total: 5, bestCombo: 5, xp: 20, daily: false },
      '2026-09-23',
    )
    expect(second).toMatchObject({ newBest: true, newCombo: true, starsGained: 1 })
    expect(second.stats.days).toEqual(['2026-09-23'])
  })

  it('la racha cuenta hasta ayer si hoy aún no jugó', () => {
    expect(quizStreak(['2026-09-21', '2026-09-22'], '2026-09-23')).toBe(2)
    expect(quizStreak(['2026-09-21', '2026-09-22', '2026-09-23'], '2026-09-23')).toBe(3)
    expect(quizStreak(['2026-09-20'], '2026-09-23')).toBe(0)
  })
})
