import { describe, it, expect } from 'vitest'
import { DAILY_GOAL_XP, EMPTY_PROGRESS, activityToday, canOpenChest, gainXp, openChest, rollChest, today } from '@features/progress/store'
import { formatCountdown, msUntilMidnight } from '@features/progress/useDayCountdown'

describe('cofre diario', () => {
  it('no se abre sin la meta del día', () => {
    const progress = gainXp({ ...EMPTY_PROGRESS }, DAILY_GOAL_XP - 1)
    expect(canOpenChest(progress)).toBe(false)
    expect(openChest(progress, { xp: 20, jackpot: false })).toBe(progress)
  })

  it('se abre una sola vez al día y suma el premio', () => {
    const ready = gainXp({ ...EMPTY_PROGRESS }, DAILY_GOAL_XP)
    expect(canOpenChest(ready)).toBe(true)
    const opened = openChest(ready, { xp: 20, jackpot: false })
    expect(opened.xp).toBe(DAILY_GOAL_XP + 20)
    expect(opened.chests).toEqual([today()])
    expect(canOpenChest(opened)).toBe(false)
    expect(openChest(opened, { xp: 50, jackpot: true })).toBe(opened)
  })

  it('sortea entre 10 y 25 XP, con premio gordo de 50', () => {
    expect(rollChest(() => 0.05)).toEqual({ xp: 50, jackpot: true })
    expect(rollChest(() => 0.5)).toEqual({ xp: 18, jackpot: false })
    const sequence = [0.5, 0.999]
    expect(rollChest(() => sequence.shift()!)).toEqual({ xp: 25, jackpot: false })
  })
})

describe('activityToday', () => {
  it('cuenta solo lo hecho hoy', () => {
    const now = new Date().toISOString()
    const yesterday = new Date(Date.now() - 86_400_000 * 2).toISOString()
    const hand = { id: 'h', seed: 1, handNumber: 1, seats: 6, hole: [], board: [], net: 0, won: false }
    const progress = {
      ...EMPTY_PROGRESS,
      lessons: {
        a: { lessonId: 'a', completedAt: now },
        b: { lessonId: 'b', completedAt: yesterday },
      },
      hands: [{ ...hand, playedAt: now }, { ...hand, id: 'h2', playedAt: yesterday }],
    }
    expect(activityToday(progress)).toEqual({ xp: 0, lessons: 1, hands: 1 })
  })
})

describe('cuenta atrás', () => {
  it('mide hasta la medianoche local', () => {
    expect(msUntilMidnight(new Date(2026, 8, 17, 23, 0, 0))).toBe(3_600_000)
  })

  it('se lee de un vistazo', () => {
    expect(formatCountdown(5 * 3_600_000 + 12 * 60_000)).toBe('5 h 12 min')
    expect(formatCountdown(42 * 60_000 + 5_000)).toBe('42 min 05 s')
    expect(formatCountdown(58_000)).toBe('58 s')
  })
})
