import { describe, expect, it } from 'vitest'
import { summarize, templateColumn } from '../gradeMath'

describe('gradeMath', () => {
  it('calcula C.F. y situación como el servidor', () => {
    const entries = [1, 2, 3, 4].flatMap((block) => [1, 2].map((period) => ({ block, period, score: 60, recovery: period === 2 ? 80 : null })))
    const s = summarize(entries, null)
    expect(s.blockAverages[1]).toBe(70)
    expect(s.finalScore).toBe(70)
    expect(s.situation).toBe('A')
  })

  it('aplica la completiva', () => {
    const entries = [1, 2, 3, 4].map((block) => ({ block, period: 1, score: 50, recovery: null }))
    const s = summarize(entries, { completiveScore: 90, extraordinaryScore: null, specialScore: null })
    expect(s.completiveFinal).toBe(70)
    expect(s.situation).toBe('A')
  })

  it('mapea las columnas de la plantilla oficial', () => {
    expect(templateColumn(0)).toEqual({ block: 1, period: 1, recovery: false })
    expect(templateColumn(1)).toEqual({ block: 1, period: 1, recovery: true })
    expect(templateColumn(7)).toEqual({ block: 1, period: 4, recovery: true })
    expect(templateColumn(8)).toEqual({ block: 2, period: 1, recovery: false })
    expect(templateColumn(31)).toEqual({ block: 4, period: 4, recovery: true })
  })
})
