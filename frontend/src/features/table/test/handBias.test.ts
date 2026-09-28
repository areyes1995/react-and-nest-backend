import { describe, expect, it } from 'vitest'
import {
  createRng,
  createTable,
  handNotation,
  positionName,
  startHand,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import { actionRangeFor, biasHeroHand } from '@features/table/handBias'

function dealt(seed: number, seats = 6): TableState {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
  return startHand(createTable({ smallBlind: 25, bigBlind: 50, startingStack: 5000, ante: 0 }, setups, seed))
}

function heroInRange(state: TableState): boolean {
  const hero = state.players.find(p => p.id === 'hero')!
  return actionRangeFor(positionName(state, hero.seat))!.has(handNotation(hero.holeCards))
}

describe('biasHeroHand', () => {
  it('con 100% siempre reparte una mano del rango de la posición', () => {
    const rng = createRng(1)
    for (let seed = 1; seed <= 60; seed++) {
      expect(heroInRange(biasHeroHand(dealt(seed), 'hero', 1, rng))).toBe(true)
    }
  })

  it('con 0% siempre reparte una mano fuera del rango', () => {
    const rng = createRng(2)
    for (let seed = 1; seed <= 60; seed++) {
      expect(heroInRange(biasHeroHand(dealt(seed), 'hero', 0, rng))).toBe(false)
    }
  })

  it('con 70% la proporción ronda el 70%', () => {
    const rng = createRng(3)
    let inRange = 0
    const total = 600
    for (let seed = 1; seed <= total; seed++) {
      if (heroInRange(biasHeroHand(dealt(seed), 'hero', 0.7, rng))) inRange += 1
    }
    expect(inRange / total).toBeGreaterThan(0.64)
    expect(inRange / total).toBeLessThan(0.76)
  })

  it('no toca a los rivales y la baraja sigue siendo una permutación válida', () => {
    const rng = createRng(4)
    for (let seed = 1; seed <= 40; seed++) {
      const before = dealt(seed, 9)
      const after = biasHeroHand(before, 'hero', 1, rng)

      for (const player of after.players) {
        if (player.id === 'hero') continue
        expect(player.holeCards).toEqual(before.players.find(p => p.id === player.id)!.holeCards)
      }
      expect(new Set(after.deck).size).toBe(52)
      // Las cartas repartidas siguen en la parte ya usada de la baraja.
      const hero = after.players.find(p => p.id === 'hero')!
      for (const card of hero.holeCards) expect(after.deck.indexOf(card)).toBeLessThan(after.deckIndex)
      // Lo que queda por salir no incluye ninguna carta ya en una mano.
      const inHands = new Set(after.players.flatMap(p => p.holeCards))
      for (const card of after.deck.slice(after.deckIndex)) expect(inHands.has(card)).toBe(false)
    }
  })
})
