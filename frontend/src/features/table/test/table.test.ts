// ──────────────────────────────────────────────
// Máquina de estados de la mano: ciegas, orden de
// acción, cierre por abandono y reparto final.
// Todas las manos usan semilla fija para que los
// fallos sean reproducibles.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  createTable,
  startHand,
  applyAction,
  legalActions,
  totalPot,
  type SeatSetup,
  type TableState,
} from '@poker/engine'

const CONFIG = { smallBlind: 25, bigBlind: 50, startingStack: 1000, ante: 0 }

function seats(count: number): SeatSetup[] {
  return Array.from({ length: count }, (_, i) => ({
    id: 'p' + i,
    name: 'Jugador ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
}

function deal(count: number, seed = 42): TableState {
  return startHand(createTable(CONFIG, seats(count), seed))
}

describe('startHand — ciegas y reparto', () => {
  it('reparte dos cartas a cada jugador', () => {
    const state = deal(6)
    expect(state.players.every(p => p.holeCards.length === 2)).toBe(true)
  })

  it('no reparte cartas repetidas', () => {
    const state = deal(9)
    const dealt = state.players.flatMap(p => p.holeCards)
    expect(new Set(dealt).size).toBe(dealt.length)
  })

  it('cobra ciega pequeña y grande en mesa de 6', () => {
    const state = deal(6)
    expect(state.players[1].committed).toBe(25)
    expect(state.players[2].committed).toBe(50)
    expect(state.currentBet).toBe(50)
  })

  it('hace actuar primero a UTG en mesa de 6', () => {
    const state = deal(6)
    expect(state.actingSeat).toBe(3)
  })

  it('invierte las ciegas en heads-up y da el turno al botón', () => {
    const state = deal(2)
    expect(state.players[0].committed).toBe(25) // botón = ciega pequeña
    expect(state.players[1].committed).toBe(50)
    expect(state.actingSeat).toBe(0)
  })

  it('es determinista: la misma semilla reparte las mismas cartas', () => {
    const a = deal(6, 7)
    const b = deal(6, 7)
    expect(a.players.map(p => p.holeCards)).toEqual(b.players.map(p => p.holeCards))
  })

  it('reparte distinto con otra semilla', () => {
    const a = deal(6, 7)
    const b = deal(6, 8)
    expect(a.players.map(p => p.holeCards)).not.toEqual(b.players.map(p => p.holeCards))
  })
})

describe('legalActions', () => {
  it('ofrece igualar la ciega grande a UTG', () => {
    const legal = legalActions(deal(6))!
    expect(legal.canCheck).toBe(false)
    expect(legal.callAmount).toBe(50)
    expect(legal.canRaise).toBe(true)
    expect(legal.minRaiseTo).toBe(100)
  })

  it('deja pasar a la ciega grande cuando todos igualan', () => {
    let state = deal(6)
    // UTG, HJ, CO y BTN igualan; SB completa.
    for (let i = 0; i < 4; i++) state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'call' })
    expect(state.actingSeat).toBe(2) // ciega grande
    expect(legalActions(state)!.canCheck).toBe(true)
  })

  it('sube el mínimo tras una subida', () => {
    let state = deal(6)
    state = applyAction(state, { type: 'raise', amount: 150 })
    const legal = legalActions(state)!
    expect(legal.callAmount).toBe(150)
    expect(legal.minRaiseTo).toBe(250) // 150 + subida de 100
  })
})

describe('desarrollo de la mano', () => {
  it('termina sin showdown cuando todos se retiran', () => {
    let state = deal(6)
    while (state.street !== 'complete') {
      state = applyAction(state, { type: 'fold' })
    }
    expect(state.outcome?.uncontested).toBe(true)
    expect(state.outcome?.shares).toHaveLength(1)
    expect(state.outcome?.shares[0].amount).toBe(75) // 25 + 50 de ciegas
  })

  it('el ganador por abandono recupera sus fichas', () => {
    let state = deal(6)
    while (state.street !== 'complete') state = applyAction(state, { type: 'fold' })
    const winnerId = state.outcome!.shares[0].playerId
    const winner = state.players.find(p => p.id === winnerId)!
    expect(winner.stack).toBeGreaterThan(1000 - 50)
  })

  it('avanza a flop, turn y river cuando se pasa en todas las calles', () => {
    let state = deal(3)
    // Preflop: BTN y SB igualan, BB pasa.
    state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'check' })
    expect(state.street).toBe('flop')
    expect(state.board).toHaveLength(3)

    for (let i = 0; i < 3; i++) state = applyAction(state, { type: 'check' })
    expect(state.street).toBe('turn')
    expect(state.board).toHaveLength(4)

    for (let i = 0; i < 3; i++) state = applyAction(state, { type: 'check' })
    expect(state.street).toBe('river')
    expect(state.board).toHaveLength(5)

    for (let i = 0; i < 3; i++) state = applyAction(state, { type: 'check' })
    expect(state.street).toBe('complete')
    expect(state.outcome?.uncontested).toBe(false)
    expect(state.outcome?.showdown.length).toBe(3)
  })

  it('reparte exactamente el bote entre los ganadores', () => {
    let state = deal(3)
    state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'check' })
    while (state.street !== 'complete') state = applyAction(state, { type: 'check' })

    const pot = totalPot(state)
    const paid = state.outcome!.shares.reduce((sum, s) => sum + s.amount, 0)
    expect(paid).toBe(pot)
  })

  it('conserva el total de fichas de la mesa', () => {
    let state = deal(6)
    const before = state.players.reduce((sum, p) => sum + p.stack + p.totalCommitted, 0)
    while (state.street !== 'complete') {
      const legal = legalActions(state)!
      state = applyAction(state, legal.canCheck ? { type: 'check' } : { type: 'call' })
    }
    const after = state.players.reduce((sum, p) => sum + p.stack, 0)
    expect(after).toBe(before)
  })

  it('corre el board hasta el river cuando todos están all-in', () => {
    let state = deal(3)
    state = applyAction(state, { type: 'raise', amount: 1000 })
    state = applyAction(state, { type: 'call' })
    state = applyAction(state, { type: 'call' })
    expect(state.street).toBe('complete')
    expect(state.board).toHaveLength(5)
    expect(state.outcome?.showdown.length).toBe(3)
  })

  it('mueve el botón en la mano siguiente', () => {
    const first = deal(6)
    const second = startHand(first)
    expect(second.buttonSeat).toBe(1)
    expect(second.handNumber).toBe(2)
  })
})
