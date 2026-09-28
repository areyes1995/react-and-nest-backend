// ──────────────────────────────────────────────
// Visor de rangos: todo id usado en las clases
// existe en el registro y cada grupo pinta manos
// con porcentajes sensatos.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { RANGE_VIEWER } from '../rangeViewer'
import { rangePercent } from '../preflopRanges'

/** Ids referenciados por bloques `range` del currículo. */
const REFERENCED = [
  'open-utg',
  'open-btn',
  'open-co',
  'bb-vs-btn',
  'three-bet-sb',
  'cold-vs-ep',
  'four-bet',
  'flop-cbet-ak4',
  'flop-check-765',
]

describe('RANGE_VIEWER', () => {
  it('resuelve todos los rangos usados en las clases', () => {
    for (const id of REFERENCED) {
      expect(RANGE_VIEWER[id], id).toBeDefined()
      expect(RANGE_VIEWER[id].title.length).toBeGreaterThan(0)
      expect(RANGE_VIEWER[id].groups.length).toBeGreaterThan(0)
    }
  })

  it('cada grupo tiene manos y porcentaje entre 1% y 100%', () => {
    for (const [id, view] of Object.entries(RANGE_VIEWER)) {
      for (const group of view.groups) {
        expect(group.hands.size, `${id}/${group.label}`).toBeGreaterThan(0)
        const percent = rangePercent(group.hands) * 100
        expect(percent, `${id}/${group.label}`).toBeGreaterThan(0)
        expect(percent, `${id}/${group.label}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('el open se ensancha de UTG al botón', () => {
    const pct = (id: string) =>
      RANGE_VIEWER[id].groups.reduce((sum, group) => sum + rangePercent(group.hands), 0)
    expect(pct('open-utg')).toBeLessThan(pct('open-co'))
    expect(pct('open-co')).toBeLessThan(pct('open-btn'))
  })
})
