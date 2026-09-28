import { describe, expect, it } from 'vitest'
import { countOuts, parseCards } from '@poker/engine'

const outs = (hole: string, board: string) => countOuts(parseCards(hole), parseCards(board))!

describe('countOuts', () => {
  it('proyecto de color: 9 outs y regla del 4 en el flop', () => {
    const result = outs('Ah 7h', 'Kh 9h 2c')
    expect(result.byKind.flush).toBe(9)
    expect(result.cardsToCome).toBe(2)
    // 9 de color + 3 ases para top pair.
    expect(result.outs).toBe(12)
    expect(result.ruleOfTwoAndFour).toBe(48)
  })

  it('escalera abierta: 8 outs', () => {
    const result = outs('9c 8d', '7s 6h 2c')
    expect(result.byKind.straight).toBe(8)
  })

  it('gutshot: 4 outs', () => {
    const result = outs('9c 8d', '7s 5h 2c')
    expect(result.byKind.straight).toBe(4)
  })

  it('set a full o póker en el flop: 7 outs', () => {
    const result = outs('7c 7d', '7s Kh 2c')
    expect(result.outs).toBe(7)
    expect(result.byKind['full-house']).toBe(7)
  })

  it('pareja servida (pocket pair bajo el board): 2 outs a set', () => {
    const result = outs('5c 5d', 'Ks Qh 9c')
    expect(result.byKind.trips).toBe(2)
    expect(result.outs).toBe(2)
  })

  it('dos overcards: 6 outs', () => {
    const result = outs('Ac Kd', '9s 6h 2c')
    expect(result.byKind.overcard).toBe(6)
  })

  it('en el turn usa la regla del 2', () => {
    const result = outs('Ah 7h', 'Kh 9h 2c 4s')
    expect(result.cardsToCome).toBe(1)
    expect(result.ruleOfTwoAndFour).toBe(result.outs * 2)
  })

  it('las cartas que solo emparejan el board no son outs', () => {
    // Con A-high, que salga otro 9 empareja el board para todos.
    const result = outs('Ac Jd', '9s 6h 2c')
    const nines = result.cards.filter(card => card >> 2 === 9)
    expect(nines).toHaveLength(0)
  })

  it('en un board emparejado, emparejar una carta baja tuya no es out', () => {
    // K-K-T: un 7 o un 4 te dan "doble pareja", pero en realidad es pareja baja.
    expect(outs('7d 4s', 'Ks Kc Th').outs).toBe(0)
    // Con overcards al board sí: emparejar el as es top pair real.
    expect(outs('Ad 4s', 'Ks Kc Th').byKind.overcard).toBe(3)
  })

  it('fuera del flop y el turn no hay cuenta de outs', () => {
    expect(countOuts(parseCards('Ah Kh'), [])).toBeNull()
    expect(countOuts(parseCards('Ah Kh'), parseCards('2c 3d 4s 5h 9c'))).toBeNull()
  })
})
