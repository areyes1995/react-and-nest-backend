// ──────────────────────────────────────────────
// Snapshot de la mesa para la IA.
// El motor vive aquí, en el navegador, así que el
// backend no recalcula nada: recibe la situación ya
// resuelta y, sobre todo, las acciones legales. La
// equity va incluida como pista para que el modelo
// tenga suelo matemático y no decida "de oído".
// ──────────────────────────────────────────────

import {
  cardToString,
  equity,
  handNotation,
  legalActions,
  positionName,
  potOdds,
  totalPot,
  type LogEntry,
  type Player,
  type TableState,
} from '@poker/engine'
import type { AiSnapshot } from '@services/poker-ai'

/** Historial en español plano: el prompt no pasa por i18n. */
const LOG_TEXT: Record<string, (params: Record<string, string | number>) => string> = {
  'poker.log.handStart': p => `comienza la mano #${p.hand}`,
  'poker.log.postsSmallBlind': p => `pone la ciega pequeña (${p.amount})`,
  'poker.log.postsBigBlind': p => `pone la ciega grande (${p.amount})`,
  'poker.log.folds': () => 'se retira',
  'poker.log.checks': () => 'pasa',
  'poker.log.calls': p => `iguala ${p.amount}`,
  'poker.log.bets': p => `apuesta ${p.amount}`,
  'poker.log.raises': p => `sube a ${p.amount}`,
  'poker.log.wins': p => `gana ${p.amount} fichas`,
  'poker.log.street.flop': () => 'se reparte el flop',
  'poker.log.street.turn': () => 'se reparte el turn',
  'poker.log.street.river': () => 'se reparte el river',
  'poker.log.street.showdown': () => 'showdown',
}

function describeEntry(state: TableState, entry: LogEntry): string {
  const text = LOG_TEXT[entry.key]?.(entry.params ?? {}) ?? entry.key
  if (entry.seat === null) return text
  const name = state.players.find(player => player.seat === entry.seat)?.name ?? ''
  return `${name} ${text}`.trim()
}

/** Última acción de un rival, redactada para el prompt. */
function describeLastAction(player: Player): string | undefined {
  if (!player.lastAction) return undefined
  const labels: Record<string, string> = {
    fold: 'se retiró',
    check: 'pasó',
    call: 'igualó',
    bet: 'apostó',
    raise: 'subió a',
  }
  const label = labels[player.lastAction.type] ?? player.lastAction.type
  return player.lastAction.amount ? `${label} ${player.lastAction.amount}` : label
}

/** Calles en las que tiene sentido pedir una decisión. */
function playableStreet(street: TableState['street']): AiSnapshot['street'] | null {
  return street === 'preflop' || street === 'flop' || street === 'turn' || street === 'river'
    ? street
    : null
}

/**
 * Construye la petición para un rival concreto.
 * Devuelve `null` si no hay turno válido: el motor manda, no la IA.
 */
export function buildSnapshot(state: TableState, player: Player): AiSnapshot | null {
  const legal = legalActions(state)
  const street = playableStreet(state.street)
  if (!legal || !street || state.actingSeat !== player.seat) return null

  const pot = totalPot(state)
  const opponentsInHand = state.players.filter(
    other => other.id !== player.id && other.status !== 'folded' && other.status !== 'out',
  )

  // Monte Carlo corto: la IA tarda mucho más que esto, así que no se nota.
  const estimated = equity(player.holeCards, state.board, Math.max(1, opponentsInHand.length), {
    samples: 240,
  })

  return {
    playerId: player.id,
    playerName: player.name,
    profile: player.botProfile ?? 'tag',
    street,
    hole: player.holeCards.map(cardToString),
    board: state.board.map(cardToString),
    position: positionName(state, player.seat),
    stack: player.stack,
    pot,
    currentBet: state.currentBet,
    committed: player.committed,
    bigBlind: state.config.bigBlind,
    smallBlind: state.config.smallBlind,
    handNumber: state.handNumber,
    legal: {
      canFold: legal.canFold,
      canCheck: legal.canCheck,
      canCall: legal.canCall,
      callAmount: legal.callAmount,
      canBet: legal.canBet,
      canRaise: legal.canRaise,
      minRaiseTo: legal.minRaiseTo,
      maxRaiseTo: legal.maxRaiseTo,
    },
    opponents: state.players
      .filter(other => other.id !== player.id && other.status !== 'out')
      .map(other => ({
        name: other.name,
        stack: other.stack,
        committed: other.committed,
        status: other.status,
        position: positionName(state, other.seat),
        lastAction: describeLastAction(other),
      })),
    // Las últimas líneas bastan: el prompt debe caber en modelos locales pequeños.
    history: state.log.slice(-14).map(entry => describeEntry(state, entry)),
    hint: {
      equity: estimated.equity,
      potOdds: potOdds(legal.callAmount, pot),
      notation: player.holeCards.length === 2 ? handNotation(player.holeCards) : undefined,
    },
  }
}
