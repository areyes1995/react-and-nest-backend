import { describe, expect, it } from 'vitest'
import { legalActions, totalPot } from '@poker/engine'
import { ODDS_HERO_ID, ODDS_KINDS, createOddsSpot } from '../oddsTrainer'

const parseRatio = (text: string) => Number(text.replace(/\./g, '').replace(',', '.'))
const parsePercent = (text: string) => Number(text.replace('%', '').replace(',', '.')) / 100
const parseChips = (text: string) => Number(text.replace(/[+−.\s]/g, '')) * (text.startsWith('−') ? -1 : 1)

describe('createOddsSpot', () => {
  it.each(ODDS_KINDS.map(kind => [kind.id]))('%s: spot válido con 3 opciones distintas', kind => {
    for (let seed = 1; seed <= 25; seed++) {
      const { state, question } = createOddsSpot(kind, seed)
      const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
      expect(state.actingSeat).toBe(hero.seat)
      expect(['flop', 'turn']).toContain(state.street)
      expect(question.options).toHaveLength(3)
      expect(new Set(question.options).size).toBe(3)
      expect(question.answerIndex).toBeGreaterThanOrEqual(0)
      expect(question.answerIndex).toBeLessThan(3)
      expect(question.formula.length).toBeGreaterThan(0)
      expect(question.explanation.length).toBeGreaterThan(0)
      // Pot odds e implied: te están apostando; faroles: puedes apostar tú.
      const legal = legalActions(state)!
      if (kind === 'pot-odds' || kind === 'implied-odds') expect(legal.callAmount).toBeGreaterThan(0)
      else expect(legal.canCheck).toBe(true)
    }
  })

  it('pot odds: la correcta es lo que pagas ÷ (bote + lo que pagas)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { state, question } = createOddsSpot('pot-odds', seed)
      const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
      const call = legalActions(state)!.callAmount
      // Si el rival apuesta más de tu stack, el sobrante se le devuelve.
      const excess = Math.max(0, state.currentBet - (hero.committed + call))
      const expected = call / (totalPot(state) - excess + call)
      expect(parsePercent(question.options[question.answerIndex])).toBeCloseTo(expected, 3)
    }
  })

  it('el rival apuesta tamaños variados: mínimo, fracciones, overbets y all-in', () => {
    const kinds = { min: 0, fraction: 0, overbet: 0, allIn: 0 }
    const amounts = new Set<number>()
    for (let seed = 1; seed <= 120; seed++) {
      const { state, question } = createOddsSpot('pot-odds', seed)
      amounts.add(state.currentBet)
      if (question.prompt.includes('all-in')) kinds.allIn += 1
      else if (question.prompt.includes('el mínimo')) kinds.min += 1
      else if (question.prompt.includes('overbet')) kinds.overbet += 1
      else kinds.fraction += 1
    }
    for (const count of Object.values(kinds)) expect(count).toBeGreaterThan(0)
    // Nada de un puñado de tamaños fijos: muchas apuestas distintas.
    expect(amounts.size).toBeGreaterThan(40)
  })

  it('implied odds: nunca es un all-in (tiene que quedar algo que ganar después)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { state, question } = createOddsSpot('implied-odds', seed)
      const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
      expect(legalActions(state)!.callAmount).toBeLessThan(hero.stack)
      expect(question.prompt).not.toContain('all-in')
    }
  })

  it('fold equity requerida: apuesta ÷ (bote + apuesta)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { state, question } = createOddsSpot('required-fold-equity', seed)
      const pot = totalPot(state)
      const bet = parseChips(question.facts.find(f => f.label === 'Tu apuesta')!.value)
      expect(parsePercent(question.options[question.answerIndex])).toBeCloseTo(bet / (pot + bet), 3)
    }
  })

  it('SPR: stack efectivo (el menor) ÷ bote', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { state, question } = createOddsSpot('spr', seed)
      const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
      const rivals = state.players.filter(p => p.id !== ODDS_HERO_ID && p.status === 'active')
      expect(rivals).toHaveLength(1)
      const expected = Math.min(hero.stack, rivals[0].stack) / totalPot(state)
      expect(Math.abs(parseRatio(question.options[question.answerIndex]) - expected)).toBeLessThanOrEqual(0.051)
    }
  })

  it('EV del farol: %fold × bote − %pago × apuesta', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { question } = createOddsSpot('fold-equity', seed)
      const pot = parseChips(question.facts.find(f => f.label === 'Bote')!.value)
      const bet = parseChips(question.facts.find(f => f.label === 'Tu apuesta')!.value)
      const fold = parsePercent(question.facts.find(f => f.label === '% de fold')!.value)
      const expected = fold * pot - (1 - fold) * bet
      expect(Math.abs(parseChips(question.options[question.answerIndex]) - expected)).toBeLessThanOrEqual(1)
    }
  })

  it.each(ODDS_KINDS.map(kind => [kind.id]))('%s: la correcta no cae siempre en el mismo sitio', kind => {
    const positions = [0, 0, 0]
    for (let seed = 1; seed <= 90; seed++) positions[createOddsSpot(kind, seed).question.answerIndex] += 1
    // Con 90 preguntas, cada posición debería salir ~30 veces; ninguna por debajo de 15.
    for (const count of positions) expect(count).toBeGreaterThanOrEqual(15)
  })

  it('es determinista para una misma semilla', () => {
    expect(createOddsSpot('implied-odds', 9).question).toEqual(createOddsSpot('implied-odds', 9).question)
  })
})
