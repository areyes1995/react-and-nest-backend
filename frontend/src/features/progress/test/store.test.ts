import { describe, it, expect } from 'vitest'
import { EMPTY_PROGRESS, gainXp, lastDays, today } from '@features/progress/store'

describe('today', () => {
  it('usa la fecha local, no la UTC', () => {
    // 21:30 del 17 de septiembre en hora local, sea cual sea la zona.
    expect(today(new Date(2026, 8, 17, 21, 30))).toBe('2026-09-17')
    expect(today(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05')
  })
})

describe('gainXp', () => {
  it('suma al total y al día de hoy', () => {
    const once = gainXp({ ...EMPTY_PROGRESS }, 20)
    const twice = gainXp(once, 12)
    expect(twice.xp).toBe(32)
    expect(twice.dailyXp[today()]).toBe(32)
  })

  it('ignora cantidades nulas o negativas', () => {
    const base = { ...EMPTY_PROGRESS }
    expect(gainXp(base, 0)).toBe(base)
  })

  it('conserva solo los últimos 60 días', () => {
    const dailyXp: Record<string, number> = {}
    for (const day of lastDays(80, '2026-01-31')) dailyXp[day] = 1
    const result = gainXp({ ...EMPTY_PROGRESS, dailyXp }, 5)
    expect(Object.keys(result.dailyXp)).toHaveLength(60)
    expect(result.dailyXp[today()]).toBeGreaterThanOrEqual(5)
  })
})

describe('lastDays', () => {
  it('devuelve los días en orden hasta el indicado', () => {
    expect(lastDays(3, '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01'])
  })
})
