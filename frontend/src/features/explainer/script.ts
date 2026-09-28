// ──────────────────────────────────────────────
// Motor de guion del modo explicativo.
//
// Convierte una escena (cartas y acciones escritas)
// en los estados de mesa que se van a enseñar,
// pasando por el motor de póker real:
//  1. sienta a los jugadores y reparte una mano;
//  2. sustituye las cartas repartidas por las del
//     guion y ordena la baraja para que el board
//     salga como está escrito (con sus quemadas);
//  3. aplica cada acción comprobando que le toca a
//     quien la hace;
//  4. respeta los tiempos de la narración: si la
//     última acción de un paso cierra la ronda, el
//     motor ya habría repartido la calle siguiente (o
//     enseñado el showdown). Eso se retiene hasta el
//     paso siguiente, que es el que habla de ello.
// Si el guion pide algo imposible (actuar fuera de
// turno, pasar con una apuesta delante…) falla aquí,
// al construir, y los tests lo cazan antes de que
// llegue a un estudiante.
// ──────────────────────────────────────────────

import {
  applyAction,
  createTable,
  fullDeck,
  parseCards,
  startHand,
  type Card,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import type { ExplainerScene, SceneAction } from './types'

export interface BeatFrames {
  /** Un estado por acción del paso (el primero, el de antes de actuar). */
  states: TableState[]
  reveal: boolean
}

export interface SceneFrames {
  /** Id del protagonista: se sienta abajo y ve sus cartas. */
  heroId: string
  /** Estado nada más repartir, con las ciegas puestas. */
  initial: TableState
  beats: BeatFrames[]
}

/** Coloca las cartas del guion y ordena la baraja para que el board salga igual. */
function rigDeck(state: TableState, scene: ExplainerScene): TableState {
  const scripted = new Map<string, Card[]>()
  for (const player of scene.players) {
    if (player.cards) scripted.set(player.id, parseCards(player.cards))
  }
  const board = scene.board ? parseCards(scene.board) : []

  const used = new Set<Card>([...[...scripted.values()].flat(), ...board])
  if (used.size !== [...scripted.values()].flat().length + board.length) {
    throw new Error(`Escena "${scene.id}": hay cartas repetidas`)
  }
  const spare = fullDeck().filter(card => !used.has(card))
  const take = () => {
    const card = spare.shift()
    if (card === undefined) throw new Error('Baraja agotada')
    return card
  }

  const next: TableState = { ...state, players: state.players.map(player => ({ ...player })) }
  for (const player of next.players) {
    if (player.status === 'out') continue
    player.holeCards = scripted.get(player.id) ?? [take(), take()]
  }

  // Tras las privadas, el motor quema una carta antes de cada calle:
  // quemada, flop ×3, quemada, turn, quemada, river.
  const streets = [board.slice(0, 3), board.slice(3, 4), board.slice(4, 5)]
  const rest: Card[] = []
  streets.forEach((cards, street) => {
    rest.push(take())
    for (let i = 0; i < (street === 0 ? 3 : 1); i++) rest.push(cards[i] ?? take())
  })
  next.deck = [...next.deck.slice(0, next.deckIndex), ...rest, ...spare]
  return next
}

/** La acción repartió cartas o destapó el showdown. */
function revealsSomething(before: TableState, after: TableState): boolean {
  return (
    after.board.length > before.board.length ||
    (after.street === 'complete' && !!after.outcome && !after.outcome.uncontested)
  )
}

/**
 * El estado justo después de `action`, pero sin lo que viene luego: ni las
 * cartas de la calle nueva ni el reparto del bote. Las fichas de la ronda ya
 * están en el bote y cada asiento conserva su última acción.
 */
function holdBack(before: TableState, after: TableState, action: SceneAction): TableState {
  const actorSeat = before.actingSeat
  return {
    ...after,
    board: before.board,
    street: before.street,
    actingSeat: null,
    outcome: undefined,
    players: after.players.map(player => {
      const previous = before.players.find(entry => entry.id === player.id) ?? player
      // Stack sin premio: el de antes menos lo que acaba de pagar.
      const paid = player.totalCommitted - previous.totalCommitted
      return {
        ...player,
        stack: previous.stack - paid,
        won: undefined,
        lastAction:
          player.seat === actorSeat ? { type: action.type, amount: action.amount } : previous.lastAction,
      }
    }),
  }
}

/** Construye todos los estados de una escena. */
export function buildScene(scene: ExplainerScene): SceneFrames {
  const setups: SeatSetup[] = scene.players.map((player, index) => ({
    id: player.id,
    name: player.name,
    isHuman: index === 0,
    stack: player.stack,
  }))
  const buttonSeat = scene.players.findIndex(player => player.id === scene.button)
  if (buttonSeat < 0) throw new Error(`Escena "${scene.id}": el botón no es de ningún jugador`)

  const table = createTable(
    {
      smallBlind: scene.blinds?.small ?? 25,
      bigBlind: scene.blinds?.big ?? 50,
      startingStack: scene.stack ?? 5000,
      ante: 0,
    },
    setups,
    1,
  )
  // En la primera mano el motor respeta el botón que ya tiene la mesa.
  let state = rigDeck(startHand({ ...table, buttonSeat }), scene)
  const initial = state

  const beats = scene.beats.map((beat, beatIndex) => {
    const states: TableState[] = [state]
    const actions = beat.actions ?? []
    const isLastBeat = beatIndex === scene.beats.length - 1
    actions.forEach((scripted, actionIndex) => {
      const { player, ...action } = scripted
      const acting = state.actingSeat === null ? undefined : state.players.find(p => p.seat === state.actingSeat)
      if (acting?.id !== player) {
        throw new Error(
          `Escena "${scene.id}", paso ${beatIndex + 1}: le toca a ${acting?.id ?? 'nadie'}, no a ${player}`,
        )
      }
      const before = state
      state = applyAction(state, action)
      const closesBeat = actionIndex === actions.length - 1 && !isLastBeat
      // Se enseña el estado retenido; el real (`state`) abre el paso siguiente.
      states.push(closesBeat && revealsSomething(before, state) ? holdBack(before, state, scripted) : state)
    })
    return { states, reveal: Boolean(beat.reveal) }
  })

  return { heroId: scene.players[0].id, initial, beats }
}
