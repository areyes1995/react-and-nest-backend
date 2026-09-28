// ──────────────────────────────────────────────
// Arquitectura preflop: las tablas de rangos y los
// entrenamientos que corrigen con ellas.
// Los spots se construyen escribiendo el log de la
// mano a mano: es lo que lee el corrector, y así cada
// test declara exactamente qué pasó antes de decidir.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  createTable,
  positionName,
  startHand,
  type Advice,
  type PlayerAction,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import { findDrill, type DrillContext } from '@features/table/drills'
import {
  BB_DEFENSE_SPECS,
  OPEN_RANGES,
  expandRange,
  rangePercent,
  readPreflop,
} from '@features/table/preflopRanges'

function table(seats = 6): TableState {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
  return startHand(createTable({ smallBlind: 25, bigBlind: 50, startingStack: 5000, ante: 0 }, setups, 42))
}

function seatAt(state: TableState, position: string): number {
  const seat = state.players.map(p => p.seat).find(s => positionName(state, s) === position)
  if (seat === undefined) throw new Error('Sin asiento para ' + position)
  return seat
}

type Step = [position: string, action: 'raises' | 'calls' | 'folds', amountBb?: number]

/**
 * Una mesa de 6 con el estudiante en `heroPosition` y la acción preflop dada.
 * El estudiante es el jugador 0; se mueve el botón hasta que ocupe esa posición.
 */
function spot(heroPosition: string, steps: Step[], hand: string, action: PlayerAction, seats = 6): DrillContext {
  let state = table(seats)
  for (let button = 0; button < seats; button++) {
    const candidate = { ...state, buttonSeat: button }
    if (positionName(candidate, state.players[0].seat) === heroPosition) {
      state = candidate
      break
    }
  }
  const bb = state.config.bigBlind
  state = {
    ...state,
    log: [
      { street: 'preflop', seat: seatAt(state, 'SB'), key: 'poker.log.postsSmallBlind', params: { amount: bb / 2 } },
      { street: 'preflop', seat: seatAt(state, 'BB'), key: 'poker.log.postsBigBlind', params: { amount: bb } },
      ...steps.map(([position, key, amount]) => ({
        street: 'preflop' as const,
        seat: seatAt(state, position),
        key: 'poker.log.' + key,
        params: amount ? { amount: amount * bb } : undefined,
      })),
    ],
  }

  const hero = state.players[0]
  const advice: Advice = {
    verdict: 'good',
    equity: 0.5,
    required: 0.3,
    potSize: 200,
    callAmount: 50,
    position: heroPosition,
    hand,
    chen: 8,
    recommended: 'call',
    messageKey: 'poker.coach.goodCall',
    params: {},
  }
  return {
    state,
    hero,
    action,
    advice,
    position: heroPosition,
    street: 'preflop',
    isPreflopAggressor: false,
    toCall: 50,
    canCheck: action.type === 'check',
  }
}

const raise: PlayerAction = { type: 'raise', amount: 300 }
const call: PlayerAction = { type: 'call' }
const fold: PlayerAction = { type: 'fold' }
const check: PlayerAction = { type: 'check' }

describe('notación de rangos', () => {
  it('expande parejas, tramos y manos sueltas', () => {
    expect([...expandRange('TT+')]).toEqual(['TT', 'JJ', 'QQ', 'KK', 'AA'])
    expect([...expandRange('A5s-A2s')].sort()).toEqual(['A2s', 'A3s', 'A4s', 'A5s'])
    expect([...expandRange('K9s+')]).toEqual(['K9s', 'KTs', 'KJs', 'KQs'])
    expect([...expandRange('22-44, AKo')]).toEqual(['22', '33', '44', 'AKo'])
  })

  it('el rango completo son las 1326 combinaciones', () => {
    expect(rangePercent(expandRange('22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J2o+, T2o+, 92o+, 82o+, 72o+, 62o+, 52o+, 42o+, 32o'))).toBe(1)
  })

  it('los rangos de open se ensanchan de UTG al botón', () => {
    const order = [OPEN_RANGES.UTG, OPEN_RANGES.HJ, OPEN_RANGES.CO, OPEN_RANGES.BTN]
    for (let i = 1; i < order.length; i++) {
      expect(rangePercent(order[i])).toBeGreaterThan(rangePercent(order[i - 1]))
      // Todo lo que se abre antes se sigue abriendo después.
      for (const hand of order[i - 1]) expect(order[i].has(hand)).toBe(true)
    }
  })

  it('el 3-bet de la BB siempre cabe en su rango de defensa', () => {
    for (const spec of Object.values(BB_DEFENSE_SPECS)) {
      const defend = expandRange(spec.defend)
      for (const hand of expandRange(spec.threeBet)) expect(defend.has(hand)).toBe(true)
    }
  })
})

describe('lectura del preflop', () => {
  it('distingue open, pagadores y limpers', () => {
    const { state } = spot('BB', [['UTG', 'calls'], ['CO', 'raises', 3], ['BTN', 'calls']], 'AKo', fold)
    const read = readPreflop(state)
    expect(read.limpers).toBe(1)
    expect(read.limperPositions).toEqual(['UTG'])
    expect(read.raises).toBe(1)
    expect(read.openerPosition).toBe('CO')
    expect(read.callers).toBe(1)
    expect(read.raiseToBb).toBe(3)
  })
})

describe('open raise', () => {
  const drill = findDrill('open-raise')

  it('aprueba abrir una mano del rango', () => {
    expect(drill.evaluate(spot('CO', [], 'K6s', raise))?.ok).toBe(true)
  })

  it('corrige abrir fuera de rango desde UTG', () => {
    const check = drill.evaluate(spot('UTG', [], 'Q8s', raise))
    expect(check?.ok).toBe(false)
    expect(check?.better).toBe('Retirarse.')
  })

  it('el open limp es error incluso con buena mano', () => {
    const check = drill.evaluate(spot('BTN', [], 'AKo', call))
    expect(check?.ok).toBe(false)
    expect(check?.better).toContain('subida')
  })

  it('corrige retirar una mano del rango del botón', () => {
    expect(drill.evaluate(spot('BTN', [], 'K8o', fold))?.ok).toBe(false)
  })

  it('no evalúa botes ya abiertos', () => {
    expect(drill.evaluate(spot('BTN', [['CO', 'raises', 2.5]], 'AKo', raise))).toBeNull()
  })
})

describe('defensa de la BB', () => {
  const drill = findDrill('bb-defense')

  it('defiende K7o contra el botón y la retira contra UTG', () => {
    expect(drill.evaluate(spot('BB', [['BTN', 'raises', 2.5]], 'K7o', call))?.ok).toBe(true)
    expect(drill.evaluate(spot('BB', [['UTG', 'raises', 2.5]], 'K7o', call))?.ok).toBe(false)
  })

  it('un open grande estrecha la defensa', () => {
    // A2o se defiende contra el botón a 2,5 pero no contra 4 ciegas (rango de CO).
    expect(drill.evaluate(spot('BB', [['BTN', 'raises', 2.5]], 'A2o', call))?.ok).toBe(true)
    const big = drill.evaluate(spot('BB', [['BTN', 'raises', 4]], 'A2o', call))
    expect(big?.ok).toBe(false)
    expect(big?.message).toContain('open grande')
  })

  it('pagar con una premium es error; con un farol de 3-bet, no', () => {
    expect(drill.evaluate(spot('BB', [['CO', 'raises', 2.5]], 'AA', call))?.ok).toBe(false)
    expect(drill.evaluate(spot('BB', [['CO', 'raises', 2.5]], 'A5s', call))?.ok).toBe(true)
  })

  it('no evalúa botes con pagadores en medio', () => {
    expect(drill.evaluate(spot('BB', [['CO', 'raises', 2.5], ['BTN', 'calls']], 'K7o', call))).toBeNull()
  })
})

describe('cold call o 3-bet', () => {
  const drill = findDrill('vs-open')

  it('AJo en el botón: 3-bet contra el CO, fold contra UTG', () => {
    expect(drill.evaluate(spot('BTN', [['CO', 'raises', 2.5]], 'AJo', raise))?.ok).toBe(true)
    expect(drill.evaluate(spot('BTN', [['UTG', 'raises', 2.5]], 'AJo', fold))?.ok).toBe(true)
  })

  it('77 paga en posición contra UTG', () => {
    expect(drill.evaluate(spot('BTN', [['UTG', 'raises', 2.5]], '77', call))?.ok).toBe(true)
  })

  it('desde la SB pagar siempre es error', () => {
    const check = drill.evaluate(spot('SB', [['BTN', 'raises', 2.5]], '77', call))
    expect(check?.ok).toBe(false)
    expect(check?.message).toContain('3-bet o fold')
  })

  it('la BB no es cosa de este entrenamiento', () => {
    expect(drill.evaluate(spot('BB', [['BTN', 'raises', 2.5]], '77', call))).toBeNull()
  })
})

describe('4-bet y 5-bet', () => {
  const drill = findDrill('vs-3bet')

  it('frente a un 3-bet: 4-bet de farol con A4s', () => {
    const context = spot('CO', [['CO', 'raises', 2.5], ['BB', 'raises', 11]], 'A4s', raise)
    expect(drill.evaluate(context)?.ok).toBe(true)
  })

  it('en posición se paga más que fuera de posición', () => {
    // CO contra 3-bet de la BB: en posición, 88 paga.
    expect(drill.evaluate(spot('CO', [['CO', 'raises', 2.5], ['BB', 'raises', 11]], '88', call))?.ok).toBe(true)
    // UTG contra 3-bet del botón: fuera de posición, 88 se retira.
    expect(drill.evaluate(spot('UTG', [['UTG', 'raises', 2.5], ['BTN', 'raises', 7.5]], '88', call))?.ok).toBe(false)
  })

  it('frente a un 4-bet: KQs se retira y QQ va all-in', () => {
    const steps: Step[] = [['CO', 'raises', 2.5], ['BTN', 'raises', 7.5], ['CO', 'raises', 18]]
    expect(drill.evaluate(spot('BTN', steps, 'KQs', fold))?.ok).toBe(true)
    expect(drill.evaluate(spot('BTN', steps, 'QQ', raise))?.ok).toBe(true)
  })

  it('no evalúa si el estudiante no había subido', () => {
    expect(drill.evaluate(spot('BTN', [['CO', 'raises', 2.5], ['SB', 'raises', 11]], 'QQ', raise))).toBeNull()
  })
})

describe('SB contra BB', () => {
  const drill = findDrill('blind-vs-blind')

  it('la SB abre su rango y puede completar manos jugables', () => {
    expect(drill.evaluate(spot('SB', [['BTN', 'folds']], 'K9o', raise, 3))?.ok).toBe(true)
    expect(drill.evaluate(spot('SB', [['BTN', 'folds']], 'Q6o', call, 3))?.ok).toBe(true)
    expect(drill.evaluate(spot('SB', [['BTN', 'folds']], '72o', call, 3))?.ok).toBe(false)
  })

  it('la BB no deja entrar gratis a la SB con AJo', () => {
    const result = drill.evaluate(spot('BB', [['BTN', 'folds'], ['SB', 'calls']], 'AJo', check, 3))
    expect(result?.ok).toBe(false)
    expect(result?.better).toContain('Subir')
  })

  it('la BB nunca se retira si puede pasar', () => {
    expect(drill.evaluate(spot('BB', [['BTN', 'folds'], ['SB', 'calls']], '72o', fold, 3))?.ok).toBe(false)
  })

  it('defiende la BB contra el open de la SB', () => {
    expect(drill.evaluate(spot('BB', [['BTN', 'folds'], ['SB', 'raises', 3]], 'J5s', call, 3))?.ok).toBe(true)
  })
})
