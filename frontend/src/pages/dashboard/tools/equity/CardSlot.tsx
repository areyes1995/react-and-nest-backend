// ──────────────────────────────────────────────
// CardSlot — hueco de una carta en la calculadora.
// Vacío es un marco punteado; con carta, tocarla
// la quita (la X aparece al pasar el cursor).
// ──────────────────────────────────────────────

import { X } from 'lucide-react'
import { cardToString, type Card } from '@poker/engine'
import { PlayingCard, type CardSize } from '@components/poker'

const EMPTY_CLASSES: Record<CardSize, string> = {
  xs: 'w-7 h-10 rounded-[4px]',
  sm: 'w-9 h-[3.25rem] rounded-md',
  md: 'w-12 h-[4.375rem] rounded-lg',
  lg: 'w-16 h-24 rounded-xl',
}

export interface CardSlotProps {
  card?: Card
  size?: CardSize
  faceDown?: boolean
  /** El hueco pertenece al destino activo: se resalta el primero libre. */
  highlight?: boolean
  /** Etiqueta del hueco vacío (p.ej. "Turn"). */
  hint?: string
  /** Carta elegida pero aún no a la vista en la calle actual. */
  pending?: boolean
  onRemove?: (card: Card) => void
}

export default function CardSlot({
  card,
  size = 'md',
  faceDown = false,
  highlight = false,
  hint,
  pending = false,
  onRemove,
}: CardSlotProps) {
  if (card === undefined) {
    return (
      <span
        className={`${EMPTY_CLASSES[size]} shrink-0 grid place-items-center border-2 border-dashed text-[0.625rem] font-semibold uppercase tracking-wide transition-colors ${
          highlight
            ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/10 text-[var(--poker-gold)]'
            : 'border-[var(--border-active)] text-[var(--text-muted)]'
        }`}
      >
        {hint}
      </span>
    )
  }

  if (faceDown || !onRemove) {
    return <PlayingCard card={card} size={size} faceDown={faceDown} dimmed={pending} />
  }

  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation()
        onRemove(card)
      }}
      title={`Quitar ${cardToString(card)}`}
      aria-label={`Quitar ${cardToString(card)}`}
      className="group relative shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--poker-gold)]"
    >
      <PlayingCard card={card} size={size} dimmed={pending} />
      <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <X className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  )
}
