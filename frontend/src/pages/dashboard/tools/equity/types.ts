import type { Card, EquityResult } from '@poker/engine'
import type { SeatState } from '@features/tools/equityTable'

/** Destino de la próxima carta elegida en la baraja. */
export type PickTarget = { kind: 'seat'; id: number } | { kind: 'board' }

/** Todo lo que las vistas necesitan saber de un asiento. */
export interface SeatInfo {
  seat: SeatState
  label: string
  isHero: boolean
  /** En la mesa, sus cartas se ven boca arriba. */
  shown: boolean
  /** Equity calculada y visible para este asiento. */
  result?: EquityResult
  winner: boolean
  /** Jugada al river/showdown ("Doble pareja…"). */
  handName?: string
}

export interface SeatActions {
  onSelect: (id: number) => void
  onRemoveCard: (card: Card) => void
  onToggleVisible: (id: number) => void
  onToggleFolded: (id: number) => void
  onSetHero: (id: number) => void
}
