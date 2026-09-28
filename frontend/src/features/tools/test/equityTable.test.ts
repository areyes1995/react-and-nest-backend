import { describe, expect, it } from 'vitest'
import { createRng, equityMultiway, parseCards } from '@poker/engine'
import {
  addSeat,
  buttonFirst,
  createSeats,
  dealMissing,
  missingFor,
  positionLabels,
  removeSeat,
  streetForBoard,
  usedCards,
} from '../equityTable'

describe('asientos', () => {
  it('empieza con 6 y etiqueta las posiciones de 6-max', () => {
    expect(createSeats()).toHaveLength(6)
    expect(positionLabels(6)).toEqual(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'])
    expect(positionLabels(9)).toHaveLength(9)
  })

  it('añade hasta 9 y conserva las cartas de las posiciones tardías', () => {
    let seats = createSeats()
    seats[3] = { ...seats[3], cards: parseCards('As Kd') } // BTN
    for (let i = 0; i < 5; i++) seats = addSeat(seats)
    expect(seats).toHaveLength(9)
    expect(positionLabels(9)[seats.findIndex(s => s.cards.length === 2)]).toBe('BTN')
  })

  it('no quita el asiento del héroe ni baja de 2', () => {
    let seats = createSeats(3)
    const heroId = seats[0].id
    seats = removeSeat(seats, heroId)
    expect(seats.some(seat => seat.id === heroId)).toBe(true)
    expect(removeSeat(seats, heroId)).toHaveLength(2)
  })
})

describe('reparto aleatorio', () => {
  it('rellena manos y board hasta la calle pedida sin repetir cartas', () => {
    const seats = createSeats(9)
    seats[0] = { ...seats[0], cards: parseCards('Ah') }
    seats[1] = { ...seats[1], folded: true }
    const result = dealMissing(seats, parseCards('2c 3c 4c'), 'turn', createRng(7))

    expect(result.board).toHaveLength(4)
    expect(result.board.slice(0, 3)).toEqual(parseCards('2c 3c 4c'))
    expect(result.seats[0].cards[0]).toBe(parseCards('Ah')[0])
    expect(result.seats[1].cards).toHaveLength(0)
    expect(result.seats.filter(s => !s.folded).every(s => s.cards.length === 2)).toBe(true)
    expect(usedCards(result.seats, result.board).size).toBe(4 + 8 * 2)
  })

  it('sabe cuándo faltan cartas para avanzar', () => {
    const seats = createSeats(2)
    expect(missingFor(seats, [], 'flop')).toBe(true)
    expect(missingFor(seats, parseCards('2c 3c 4c 5c 6c'), 'river')).toBe(false)
    expect(missingFor(seats, parseCards('2c 3c 4c 5c 6c'), 'showdown')).toBe(true)
    expect(streetForBoard(4)).toBe('turn')
  })
})

describe('equityMultiway', () => {
  it('es exacta cuando todo es conocido', () => {
    const [hero, villain] = equityMultiway(
      [parseCards('As Ah'), parseCards('Kd Kh')],
      parseCards('2c 7d 9s Jc 3h'),
    )
    expect(hero.equity).toBe(1)
    expect(villain.equity).toBe(0)
    expect(hero.samples).toBe(1)
  })

  it('reparte las manos vacías y suma 100% entre todos', () => {
    const results = equityMultiway([parseCards('As Ah'), [], []], [], { samples: 3000, rng: createRng(3) })
    const total = results.reduce((sum, r) => sum + r.equity, 0)
    expect(total).toBeCloseTo(1, 5)
    expect(results[0].equity).toBeGreaterThan(0.6)
  })
})

describe('orden de la lista', () => {
  it('pone el BTN primero y sigue en sentido horario', () => {
    expect(buttonFirst(positionLabels(6))).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'])
    expect(buttonFirst(positionLabels(2))).toEqual(['BTN', 'BB'])
    expect(buttonFirst(positionLabels(9))[0]).toBe('BTN')
  })

  it('los asientos añadidos pueden empezar retirados', () => {
    const seats = addSeat(createSeats(), true)
    expect(seats.filter(seat => seat.folded)).toHaveLength(1)
  })
})

describe('equityMultiway: estabilidad', () => {
  it('da el mismo resultado al repetir el cálculo', () => {
    const hands = [parseCards('Ah Kh'), parseCards('Qs Qd'), []]
    const first = equityMultiway(hands, [], { samples: 5000 })
    const second = equityMultiway(hands, [], { samples: 5000 })
    expect(second).toEqual(first)
  })

  it('enumera todos los runouts en el flop (resultado exacto)', () => {
    const [hero] = equityMultiway([parseCards('Ah Kh'), parseCards('Qs Qd')], parseCards('2h 7h Tc'))
    expect(hero.exact).toBe(true)
    expect(hero.samples).toBe(990) // C(45, 2)
  })

  it('calcula 9 jugadores preflop en un tiempo razonable', () => {
    const hands = [parseCards('Ah Kh'), [], [], [], [], [], [], [], []]
    const start = performance.now()
    // Mismo presupuesto que usa la calculadora: 60.000 manos / 9 jugadores.
    equityMultiway(hands, [], { samples: Math.round(60000 / 9) })
    expect(performance.now() - start).toBeLessThan(1500)
  })
})
