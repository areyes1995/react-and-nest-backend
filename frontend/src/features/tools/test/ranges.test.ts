import { describe, expect, it } from 'vitest'
import { OPENING_RANGES, expandRange, parseRange, rangePercent } from '../ranges'

describe('parseRange', () => {
  it('expande la notación estándar al 100%', () => {
    const weights = parseRange('TT+, AJs+, KQo')
    expect([...weights.keys()].sort()).toEqual(
      ['AA', 'AJs', 'AKs', 'AQs', 'JJ', 'KK', 'KQo', 'QQ', 'TT'].sort(),
    )
    expect(new Set(weights.values())).toEqual(new Set([100]))
  })

  it('aplica pesos y deja que un token posterior sobrescriba', () => {
    const weights = parseRange('22+, 22:50, A5o:25, K9s:0')
    expect(weights.get('33')).toBe(100)
    expect(weights.get('22')).toBe(50)
    expect(weights.get('A5o')).toBe(25)
    expect(weights.has('K9s')).toBe(false)
  })

  it('pondera las combinaciones por su frecuencia', () => {
    // AA: 6 combos al 50% = 3 de 1326.
    expect(rangePercent(parseRange('AA:50'))).toBeCloseTo((3 / 1326) * 100)
  })

  it('expandRange incluye las manos mixtas', () => {
    expect(expandRange('AA, A5o:25').has('A5o')).toBe(true)
  })
})

describe('OPENING_RANGES', () => {
  // Frecuencias de apertura de referencia (6-max, 100bb, solver).
  const expected: Record<string, [number, number]> = {
    utg: [15, 19],
    mp: [19, 24],
    co: [26, 30],
    btn: [41, 46],
    sb: [41, 47],
  }

  it.each(OPENING_RANGES.map(p => [p.label, p] as const))('%s abre un porcentaje realista', (_, position) => {
    const percent = rangePercent(parseRange(position.range))
    const [min, max] = expected[position.id]
    expect(percent).toBeGreaterThanOrEqual(min)
    expect(percent).toBeLessThanOrEqual(max)
  })
})
