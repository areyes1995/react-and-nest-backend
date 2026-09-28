import { describe, expect, it } from 'vitest'
import {
  applyAction,
  createTable,
  handNotation,
  legalActions,
  positionName,
  startHand,
  totalPot,
  type PlayerAction,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import { buildGuidedSpot, type GuidedSpot } from '@features/table/guided'
import { actionRangeFor } from '@features/table/handBias'

function table(seed: number, seats = 6): TableState {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: (['tag', 'station', 'nit', 'lag', 'maniac'] as const)[i % 5],
  }))
  return startHand(createTable({ smallBlind: 25, bigBlind: 50, startingStack: 5000, ante: 0 }, setups, seed))
}

const heroSeat = (state: TableState) => state.players.find(p => p.id === 'hero')!.seat

/** Juega por los rivales con `bot` hasta que le toque al estudiante (o acabe la mano). */
function untilHero(state: TableState, bot: (state: TableState) => PlayerAction): TableState {
  let current = state
  for (let guard = 0; guard < 50; guard++) {
    if (current.street === 'complete' || current.actingSeat === null) return current
    if (current.actingSeat === heroSeat(current)) return current
    current = applyAction(current, bot(current))
  }
  throw new Error('La mano no llegó al turno del estudiante')
}

const fold = (): PlayerAction => ({ type: 'fold' })
const passive = (state: TableState): PlayerAction => {
  const legal = legalActions(state)!
  return legal.canCheck ? { type: 'check' } : { type: 'call' }
}

/** Busca una semilla donde el estudiante llegue a decidir en el spot pedido. */
function findSpot(build: (seed: number) => TableState | null): { state: TableState; spot: GuidedSpot } {
  for (let seed = 1; seed < 200; seed++) {
    const state = build(seed)
    if (!state) continue
    const spot = buildGuidedSpot(state, 'hero')
    if (spot) return { state, spot }
  }
  throw new Error('No se encontró el spot')
}

describe('buildGuidedSpot', () => {
  it('nadie ha entrado: pregunta por el rango de open y acierta la respuesta', () => {
    const { state, spot } = findSpot(seed => {
      const s = untilHero(table(seed), fold)
      return s.street === 'preflop' && positionName(s, heroSeat(s)) !== 'BB' ? s : null
    })
    expect(spot.kind).toBe('unopened')
    const hero = state.players.find(p => p.id === 'hero')!
    const question = spot.questions.find(q => q.id === 'open-range')!
    const inRange = actionRangeFor(positionName(state, hero.seat))!.has(handNotation(hero.holeCards))
    expect(question.answerIndex).toBe(inRange ? 0 : 1)
    expect(spot.checklist.length).toBeGreaterThan(2)
  })

  it('frente a un open: rango del que abre y pot odds correctas', () => {
    const { state, spot } = findSpot(seed => {
      let opened = false
      const s = untilHero(table(seed), () => {
        if (!opened) {
          opened = true
          return { type: 'raise', amount: 125 }
        }
        return { type: 'fold' }
      })
      return s.street === 'preflop' && opened ? s : null
    })
    expect(spot.kind).toBe('facing-open')
    expect(spot.villains).toHaveLength(1)
    const potOdds = spot.questions.find(q => q.id === 'pot-odds')!
    const call = legalActions(state)!.callAmount
    const expected = Math.round((call / (totalPot(state) + call)) * 100)
    expect(potOdds.options[potOdds.answerIndex]).toBe(`${expected}%`)
  })

  it('postflop con apuesta: outs, pot odds y si pagar es rentable', () => {
    const { spot } = findSpot(seed => {
      // Preflop todos pagan; en el flop el primer rival apuesta medio bote.
      let s = untilHero(table(seed), passive)
      if (s.street !== 'preflop') return null
      s = applyAction(s, passive(s))
      let betDone = false
      s = untilHero(s, current => {
        if (current.street === 'flop' && !betDone) {
          betDone = true
          return { type: 'bet', amount: Math.round(totalPot(current) / 2) }
        }
        return current.street === 'preflop' ? passive(current) : fold()
      })
      return s.street === 'flop' && betDone ? s : null
    })
    expect(spot.kind).toBe('postflop-bet')
    const ids = spot.questions.map(q => q.id)
    expect(ids).toContain('outs')
    expect(ids).toContain('pot-odds')
    expect(ids).toContain('call-profitable')
    for (const question of spot.questions) {
      expect(question.answerIndex).toBeGreaterThanOrEqual(0)
      expect(question.answerIndex).toBeLessThan(question.options.length)
      expect(question.explanation.length).toBeGreaterThan(0)
    }
  })

  it('postflop sin apuesta: iniciativa, tipo de mano y fold equity', () => {
    const { spot } = findSpot(seed => {
      let s = untilHero(table(seed), passive)
      if (s.street !== 'preflop') return null
      s = applyAction(s, passive(s))
      s = untilHero(s, current => (current.street === 'preflop' ? passive(current) : { type: 'check' }))
      return s.street === 'flop' && legalActions(s)?.canCheck ? s : null
    })
    expect(spot.kind).toBe('postflop-first')
    const foldEquity = spot.questions.find(q => q.id === 'fold-equity')!
    // Apostar ⅔ del bote necesita que el rival se retire el 40% de las veces.
    expect(foldEquity.options[foldEquity.answerIndex]).toBe('40%')
    expect(spot.questions.find(q => q.id === 'initiative')).toBeDefined()
  })

  it('es determinista: la misma decisión da las mismas preguntas', () => {
    const state = untilHero(table(7), fold)
    expect(buildGuidedSpot(state, 'hero')).toEqual(buildGuidedSpot(state, 'hero'))
  })

  it('no hay spot cuando no es tu turno', () => {
    const state = table(3)
    if (state.actingSeat !== heroSeat(state)) expect(buildGuidedSpot(state, 'hero')).toBeNull()
  })
})
