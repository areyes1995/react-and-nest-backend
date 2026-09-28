// ──────────────────────────────────────────────
// Botes laterales — el caso que decide si un motor
// de poker es usable: varios all-in de distinto
// tamaño y reparto con empates.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildPots, type Player } from '@poker/engine'

function player(overrides: Partial<Player> & Pick<Player, 'id' | 'totalCommitted'>): Player {
  return {
    name: overrides.id,
    seat: 0,
    stack: 0,
    holeCards: [],
    status: 'active',
    committed: 0,
    hasActed: true,
    isHuman: false,
    ...overrides,
  }
}

describe('buildPots', () => {
  it('crea un único bote cuando todos aportan lo mismo', () => {
    const pots = buildPots([
      player({ id: 'a', totalCommitted: 100 }),
      player({ id: 'b', totalCommitted: 100 }),
      player({ id: 'c', totalCommitted: 100 }),
    ])

    expect(pots).toHaveLength(1)
    expect(pots[0].amount).toBe(300)
    expect(pots[0].eligiblePlayerIds).toEqual(['a', 'b', 'c'])
  })

  it('separa bote principal y lateral con un all-in corto', () => {
    // a va all-in por 50, b y c siguen apostando hasta 200.
    const pots = buildPots([
      player({ id: 'a', totalCommitted: 50, status: 'allin' }),
      player({ id: 'b', totalCommitted: 200 }),
      player({ id: 'c', totalCommitted: 200 }),
    ])

    expect(pots).toHaveLength(2)
    expect(pots[0]).toEqual({ amount: 150, eligiblePlayerIds: ['a', 'b', 'c'] })
    expect(pots[1]).toEqual({ amount: 300, eligiblePlayerIds: ['b', 'c'] })
  })

  it('encadena tres niveles de all-in', () => {
    const pots = buildPots([
      player({ id: 'a', totalCommitted: 50, status: 'allin' }),
      player({ id: 'b', totalCommitted: 120, status: 'allin' }),
      player({ id: 'c', totalCommitted: 300 }),
      player({ id: 'd', totalCommitted: 300 }),
    ])

    expect(pots).toHaveLength(3)
    expect(pots[0]).toEqual({ amount: 200, eligiblePlayerIds: ['a', 'b', 'c', 'd'] })
    expect(pots[1]).toEqual({ amount: 210, eligiblePlayerIds: ['b', 'c', 'd'] })
    expect(pots[2]).toEqual({ amount: 360, eligiblePlayerIds: ['c', 'd'] })
  })

  it('deja las fichas del jugador retirado en el bote sin hacerlo elegible', () => {
    const pots = buildPots([
      player({ id: 'a', totalCommitted: 100, status: 'folded' }),
      player({ id: 'b', totalCommitted: 100 }),
      player({ id: 'c', totalCommitted: 100 }),
    ])

    expect(pots).toHaveLength(1)
    expect(pots[0].amount).toBe(300)
    expect(pots[0].eligiblePlayerIds).toEqual(['b', 'c'])
  })

  it('conserva el total apostado en todos los botes', () => {
    const players = [
      player({ id: 'a', totalCommitted: 25, status: 'folded' }),
      player({ id: 'b', totalCommitted: 80, status: 'allin' }),
      player({ id: 'c', totalCommitted: 240 }),
      player({ id: 'd', totalCommitted: 240 }),
    ]
    const total = players.reduce((sum, p) => sum + p.totalCommitted, 0)
    const pots = buildPots(players)

    expect(pots.reduce((sum, p) => sum + p.amount, 0)).toBe(total)
  })
})
