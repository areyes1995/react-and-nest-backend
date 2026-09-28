// ──────────────────────────────────────────────
// Mesa de equity — estado y reglas puras.
// La calculadora funciona como Equilab: cada
// asiento tiene su posición y sus cartas (o una
// mano aleatoria). La vista de mesa añade las
// calles: se avanza de preflop a showdown y lo
// que no se haya elegido se reparte al azar.
// ──────────────────────────────────────────────

import { fullDeck, shuffle, type Card, type Rng } from '@poker/engine'

export type EquityStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export const STREETS: readonly EquityStreet[] = ['preflop', 'flop', 'turn', 'river', 'showdown']

export const STREET_LABELS: Record<EquityStreet, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
}

/** Cartas comunitarias a la vista en cada calle. */
export const BOARD_COUNT: Record<EquityStreet, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
  showdown: 5,
}

export const MIN_SEATS = 2
export const MAX_SEATS = 9
export const DEFAULT_SEATS = 6

/** Posiciones en orden de acción preflop, de la primera a la ciega grande. */
const POSITION_LABELS: Record<number, string[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
  5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  6: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  8: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  9: ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
}

export function positionLabels(count: number): string[] {
  return POSITION_LABELS[Math.min(MAX_SEATS, Math.max(MIN_SEATS, count))]
}

export interface SeatState {
  /** Id estable: no cambia al añadir o quitar asientos. */
  id: number
  cards: Card[]
  /** En la vista de mesa, sus cartas se ven boca arriba. */
  visible: boolean
  /** Fuera de la mano: no cuenta para la equity. */
  folded: boolean
}

export function createSeats(count: number = DEFAULT_SEATS): SeatState[] {
  return Array.from({ length: count }, (_, id) => ({ id, cards: [], visible: false, folded: false }))
}

/**
 * Índice donde entra (o sale) un asiento para pasar a `count` jugadores.
 * Los asientos cambian por las posiciones tempranas, así BTN, ciegas y CO
 * conservan sus cartas al crecer o encoger la mesa.
 */
function earlySlot(count: number): number {
  return count > 6 ? 1 : 0
}

export function addSeat(seats: SeatState[], folded = false): SeatState[] {
  if (seats.length >= MAX_SEATS) return seats
  const id = Math.max(...seats.map(seat => seat.id)) + 1
  const next = seats.slice()
  next.splice(earlySlot(seats.length + 1), 0, { id, cards: [], visible: false, folded })
  return next
}

/** Quita un asiento de posición temprana; nunca el del héroe. */
export function removeSeat(seats: SeatState[], heroId: number): SeatState[] {
  if (seats.length <= MIN_SEATS) return seats
  let index = earlySlot(seats.length)
  if (seats[index].id === heroId) index += 1
  return seats.filter((_, i) => i !== index)
}

/**
 * Asientos en orden de lista: el botón primero y después el resto en el
 * sentido de las agujas del reloj (SB, BB, UTG… hasta el CO).
 */
export function buttonFirst<T>(items: readonly T[]): T[] {
  const button = positionLabels(items.length).indexOf('BTN')
  return [...items.slice(button), ...items.slice(0, button)]
}

export function usedCards(seats: readonly SeatState[], board: readonly Card[]): Set<Card> {
  const used = new Set<Card>(board)
  for (const seat of seats) for (const card of seat.cards) used.add(card)
  return used
}

/** Calle que corresponde a un board con `count` cartas elegidas. */
export function streetForBoard(count: number): EquityStreet {
  if (count >= 5) return 'river'
  if (count === 4) return 'turn'
  if (count === 3) return 'flop'
  return 'preflop'
}

export interface DealResult {
  seats: SeatState[]
  board: Card[]
}

/**
 * Completa al azar lo que falte hasta `street`: dos cartas a cada jugador
 * en la mano y el board hasta las cartas de esa calle. Lo que el usuario
 * ya eligió se respeta.
 */
export function dealMissing(
  seats: readonly SeatState[],
  board: readonly Card[],
  street: EquityStreet,
  rng: Rng,
): DealResult {
  const used = usedCards(seats, board)
  const deck = shuffle(
    fullDeck().filter(card => !used.has(card)),
    rng,
  )
  let cursor = 0
  const draw = () => deck[cursor++]

  const nextSeats = seats.map(seat => {
    if (seat.folded || seat.cards.length >= 2) return seat
    const cards = seat.cards.slice()
    while (cards.length < 2) cards.push(draw())
    return { ...seat, cards }
  })

  const nextBoard = board.slice()
  while (nextBoard.length < BOARD_COUNT[street]) nextBoard.push(draw())

  return { seats: nextSeats, board: nextBoard }
}

/** Faltan cartas para llegar a `street` sin repartir al azar. */
export function missingFor(seats: readonly SeatState[], board: readonly Card[], street: EquityStreet): boolean {
  if (board.length < BOARD_COUNT[street]) return true
  // El showdown enseña todas las manos: tienen que existir.
  if (street === 'showdown') return seats.some(seat => !seat.folded && seat.cards.length < 2)
  return false
}
