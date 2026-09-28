// ──────────────────────────────────────────────
// Entrenamientos: lo que corrigen y lo que dejan
// pasar.
// Dos cosas importan aquí. Una, que cada
// entrenamiento evalúe SOLO lo suyo (si puntuara
// manos que no son de su tipo, el marcador mentiría).
// Dos, que el veredicto no dependa de si la jugada
// ganó, sino de si era correcta.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  createTable,
  startHand,
  type Advice,
  type PlayerAction,
  type SeatSetup,
  type Street,
  type TableState,
} from '@poker/engine'
import { DRILLS, drillAccuracy, EMPTY_SESSION, findDrill, preflopAggressorSeat } from '@features/table/drills'
import type { DrillContext } from '@features/table/drills'

function table(seats = 6): TableState {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
  return startHand(
    createTable({ smallBlind: 25, bigBlind: 50, startingStack: 1000, ante: 0 }, setups, 42),
  )
}

function advice(overrides: Partial<Advice> = {}): Advice {
  return {
    verdict: 'good',
    equity: 0.5,
    required: 0.25,
    potSize: 200,
    callAmount: 50,
    position: 'CO',
    hand: 'AKs',
    chen: 12,
    recommended: 'call',
    messageKey: 'poker.coach.goodCall',
    params: {},
    ...overrides,
  }
}

function context(overrides: Partial<DrillContext> = {}): DrillContext {
  const state = table()
  const hero = state.players[0]
  return {
    state,
    hero,
    action: { type: 'call' } as PlayerAction,
    advice: advice(),
    position: 'CO',
    street: 'preflop' as Street,
    isPreflopAggressor: false,
    toCall: 50,
    canCheck: false,
    ...overrides,
  }
}

describe('posición preflop', () => {
  const drill = findDrill('preflop-position')

  it('acepta entrar con una mano que aguanta la posición', () => {
    const check = drill.evaluate(
      context({ position: 'BTN', advice: advice({ chen: 10, position: 'BTN' }) }),
    )
    expect(check?.ok).toBe(true)
  })

  it('corrige entrar demasiado ancho desde UTG', () => {
    const check = drill.evaluate(
      context({ position: 'UTG', advice: advice({ chen: 6, position: 'UTG', hand: 'T7o' }) }),
    )
    expect(check?.ok).toBe(false)
    expect(check?.better).toContain('Retirarse')
  })

  it('corrige también la pasividad: no abrir una mano clara desde el botón', () => {
    const check = drill.evaluate(
      context({
        position: 'BTN',
        action: { type: 'fold' },
        advice: advice({ chen: 14, position: 'BTN' }),
      }),
    )
    expect(check?.ok).toBe(false)
  })

  it('no evalúa lo que no es preflop', () => {
    expect(drill.evaluate(context({ street: 'turn' }))).toBeNull()
  })
})

describe('pot odds', () => {
  const drill = findDrill('pot-odds')

  it('no evalúa cuando no hay apuesta que pagar', () => {
    expect(drill.evaluate(context({ toCall: 0, canCheck: true }))).toBeNull()
  })

  it('aprueba pagar con precio', () => {
    const check = drill.evaluate(
      context({ action: { type: 'call' }, advice: advice({ equity: 0.5, required: 0.25 }) }),
    )
    expect(check?.ok).toBe(true)
  })

  it('corrige pagar sin precio', () => {
    const check = drill.evaluate(
      context({ action: { type: 'call' }, advice: advice({ equity: 0.15, required: 0.33 }) }),
    )
    expect(check?.ok).toBe(false)
    expect(check?.better).toBe('Retirarse.')
  })

  it('corrige retirarse teniendo precio', () => {
    const check = drill.evaluate(
      context({ action: { type: 'fold' }, advice: advice({ equity: 0.5, required: 0.2 }) }),
    )
    expect(check?.ok).toBe(false)
    expect(check?.better).toBe('Igualar.')
  })
})

describe('apuesta de continuación', () => {
  const drill = findDrill('cbet')

  it('solo evalúa el flop del agresor preflop', () => {
    expect(drill.evaluate(context({ street: 'flop', isPreflopAggressor: false }))).toBeNull()
    expect(drill.evaluate(context({ street: 'turn', isPreflopAggressor: true }))).toBeNull()
  })

  it('aprueba apostar con la iniciativa', () => {
    const check = drill.evaluate(
      context({
        street: 'flop',
        isPreflopAggressor: true,
        canCheck: true,
        toCall: 0,
        action: { type: 'bet', amount: 100 },
      }),
    )
    expect(check?.ok).toBe(true)
  })

  it('corrige pasar con iniciativa y equity razonable', () => {
    const check = drill.evaluate(
      context({
        street: 'flop',
        isPreflopAggressor: true,
        canCheck: true,
        toCall: 0,
        action: { type: 'check' },
        advice: advice({ equity: 0.55 }),
      }),
    )
    expect(check?.ok).toBe(false)
  })

  it('acepta pasar cuando el flop no te pega nada', () => {
    const check = drill.evaluate(
      context({
        street: 'flop',
        isPreflopAggressor: true,
        canCheck: true,
        toCall: 0,
        action: { type: 'check' },
        advice: advice({ equity: 0.18 }),
      }),
    )
    expect(check?.ok).toBe(true)
  })
})

describe('agresión con valor', () => {
  const drill = findDrill('aggression')

  it('corrige pasar una mano fuerte', () => {
    const check = drill.evaluate(
      context({
        street: 'river',
        canCheck: true,
        toCall: 0,
        action: { type: 'check' },
        advice: advice({ equity: 0.8 }),
      }),
    )
    expect(check?.ok).toBe(false)
    expect(check?.better).toContain('valor')
  })

  it('no evalúa turnos en los que había que pagar', () => {
    expect(drill.evaluate(context({ canCheck: false, street: 'river' }))).toBeNull()
  })
})

describe('pagar faroles', () => {
  const drill = findDrill('bluff-catch')

  it('solo evalúa el river frente a una apuesta', () => {
    expect(drill.evaluate(context({ street: 'turn', toCall: 100 }))).toBeNull()
    expect(drill.evaluate(context({ street: 'river', toCall: 0 }))).toBeNull()
    expect(drill.evaluate(context({ street: 'river', toCall: 100 }))).not.toBeNull()
  })
})

describe('juego libre', () => {
  it('no puntúa nada: solo se juega', () => {
    expect(findDrill('free').evaluate(context())).toBeNull()
  })
})

describe('catálogo', () => {
  it('todos los entrenamientos tienen título, foco e icono', () => {
    for (const drill of DRILLS) {
      expect(drill.title.length).toBeGreaterThan(0)
      expect(drill.focus.length).toBeGreaterThan(0)
      expect(drill.icon.length).toBeGreaterThan(0)
    }
  })

  it('un id desconocido cae en juego libre en vez de romper', () => {
    expect(findDrill('no-existe').id).toBe('free')
  })
})

describe('marcador', () => {
  it('la precisión de una sesión vacía es 0, no NaN', () => {
    expect(drillAccuracy(EMPTY_SESSION)).toBe(0)
  })

  it('cuenta la proporción de aciertos', () => {
    expect(drillAccuracy({ ...EMPTY_SESSION, evaluated: 4, correct: 3 })).toBe(0.75)
  })
})

describe('preflopAggressorSeat', () => {
  it('no hay agresor antes de que nadie suba', () => {
    expect(preflopAggressorSeat(table())).toBeNull()
  })
})
