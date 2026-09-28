// ──────────────────────────────────────────────
// Reparto sesgado — más manos "de acción".
// Con reparto puro, desde UTG solo ~1 de cada 6
// manos entra en rango: se practica sobre todo a
// foldear. Aquí se decide antes de cada mano si al
// estudiante le toca una mano de su rango (con la
// probabilidad elegida) o una de fuera, y se
// cambian sus cartas por otras de la baraja aún no
// repartida. La baraja sigue siendo una permutación
// válida: board y rivales no notan nada.
// ──────────────────────────────────────────────

import { handNotation, positionName, type Rng, type TableState } from '@poker/engine'
import { BB_DEFENSE_SPECS, expandRange, openRangeFor } from './preflopRanges'

/** Defensa de la BB contra un open del cutoff: su spot más típico. */
const BB_ACTION_RANGE = expandRange(BB_DEFENSE_SPECS.CO.defend)

/**
 * Manos "de acción" de una posición: las que se abren (RFI) o, en la ciega
 * grande, las que defienden contra un open.
 */
export function actionRangeFor(position: string): Set<string> | null {
  if (position === 'BB') return BB_ACTION_RANGE
  return openRangeFor(position)
}

/**
 * Cambia (si hace falta) las cartas del héroe para que, con probabilidad
 * `share` (0..1), su mano esté en el rango de acción de su posición y, si no,
 * fuera de él. Devuelve el mismo estado si ya cumple o no se puede aplicar.
 */
export function biasHeroHand(
  state: TableState,
  heroId: string,
  share: number,
  rng: Rng,
): TableState {
  const hero = state.players.find(player => player.id === heroId)
  if (!hero || hero.holeCards.length !== 2 || state.street !== 'preflop') return state

  const range = actionRangeFor(positionName(state, hero.seat))
  if (!range) return state

  const wantAction = rng.next() < share
  if (range.has(handNotation(hero.holeCards)) === wantAction) return state

  // Pares de cartas aún sin repartir cuya mano cae del lado pedido.
  const candidates: [number, number][] = []
  for (let i = state.deckIndex; i < state.deck.length; i++) {
    for (let j = i + 1; j < state.deck.length; j++) {
      const inRange = range.has(handNotation([state.deck[i], state.deck[j]]))
      if (inRange === wantAction) candidates.push([i, j])
    }
  }
  if (candidates.length === 0) return state

  const [first, second] = candidates[rng.int(candidates.length)]
  const deck = state.deck.slice()
  const [oldA, oldB] = hero.holeCards
  const newA = deck[first]
  const newB = deck[second]

  // Intercambio dentro de la baraja: las cartas viejas del héroe ocupan el
  // hueco de las nuevas, y viceversa.
  const swap = (oldCard: number, newCard: number, newIndex: number) => {
    const oldIndex = deck.indexOf(oldCard)
    if (oldIndex >= 0) deck[oldIndex] = newCard
    deck[newIndex] = oldCard
  }
  swap(oldA, newA, first)
  swap(oldB, newB, second)

  return {
    ...state,
    deck,
    players: state.players.map(player =>
      player.id === heroId ? { ...player, holeCards: [newA, newB] } : player,
    ),
  }
}
