// ──────────────────────────────────────────────
// PlayingCard — una carta de la baraja.
// Dibujada con CSS puro (sin imágenes) para que
// escale sin pixelarse y responda al tema claro /
// oscuro. Los palos rojos y negros usan tokens de
// color propios para mantener contraste AA en ambos.
//
// Dentro de la mesa la cara, el dorso y los colores
// los decide el estilo activo (TableThemeScope):
// índice grande, baraja de cuatro colores, tramas…
// ──────────────────────────────────────────────

import { RANK_LABELS, SUIT_SYMBOLS, rankOf, suitOf, type Card, type Suit } from '@poker/engine'
import { useActiveTableTheme } from '@features/table/TableThemeContext'
import { cardBackBackground } from '@features/table/themes'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: 'w-7 h-10 text-mini rounded-[4px]',
  sm: 'w-9 h-[3.25rem] text-xs rounded-md',
  md: 'w-12 h-[4.375rem] text-sm rounded-lg',
  lg: 'w-16 h-24 text-base rounded-xl',
}

const PIP_CLASSES: Record<CardSize, string> = {
  xs: 'text-[0.8125rem]',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

/** Cara `jumbo`: el índice ocupa media carta, legible aunque la carta sea mínima. */
const JUMBO_RANK_CLASSES: Record<CardSize, string> = {
  xs: 'text-[0.9375rem]',
  sm: 'text-xl',
  md: 'text-[1.75rem]',
  lg: 'text-[2.375rem]',
}

const JUMBO_SUIT_CLASSES: Record<CardSize, string> = {
  xs: 'text-caption',
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
}

/**
 * Color de cada palo. Con la baraja de cuatro colores ♦ y ♣ toman sus propios
 * tokens; si el estilo no los fija, caen al rojo y al negro de siempre.
 */
function suitColor(suit: Suit, fourColor: boolean): string {
  if (suit === 'h') return 'var(--poker-suit-red)'
  if (suit === 's') return 'var(--poker-suit-black)'
  if (!fourColor) return suit === 'd' ? 'var(--poker-suit-red)' : 'var(--poker-suit-black)'
  return suit === 'd'
    ? 'var(--poker-suit-diamond, #1d4ed8)'
    : 'var(--poker-suit-club, #15803d)'
}

export interface PlayingCardProps {
  card?: Card
  /** Muestra el dorso en lugar de la cara. */
  faceDown?: boolean
  size?: CardSize
  /** Atenúa la carta (p.ej. cartas que no forman la mano ganadora). */
  dimmed?: boolean
  /** Resalta la carta con el aro dorado de mano ganadora. */
  highlighted?: boolean
  className?: string
  /** Retraso del reparto (ms): escalona las cartas de una fila. */
  dealDelay?: number
}

export default function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  dimmed = false,
  highlighted = false,
  className = '',
  dealDelay = 0,
}: PlayingCardProps) {
  const theme = useActiveTableTheme()
  // Cada carta nueva entra girando, como si la repartieran.
  const base = `relative shrink-0 select-none transition-all duration-200 animate-card-deal ${SIZE_CLASSES[size]}`
  const deal = dealDelay ? { animationDelay: `${dealDelay}ms` } : undefined

  if (faceDown || card === undefined) {
    return (
      <div
        className={`${base} border border-black/40 shadow-md ${className}`}
        style={{ ...deal, background: cardBackBackground(theme.cardBack) }}
        aria-label="Carta boca abajo"
      >
        <div className="absolute inset-[3px] rounded-[inherit] border border-white/15" />
        {theme.cardBack === 'solid' && (
          <span className="absolute inset-0 grid place-items-center text-white/25 text-[0.9em] leading-none" aria-hidden>
            ♠
          </span>
        )}
      </div>
    )
  }

  const rank = RANK_LABELS[rankOf(card)]
  const suit = suitOf(card)
  const symbol = SUIT_SYMBOLS[suit]
  const frame = `${base} flex flex-col justify-between border shadow-md ${
    highlighted
      ? 'border-[var(--poker-gold)] ring-2 ring-[var(--poker-gold)]/50 -translate-y-1'
      : 'border-black/20'
  } ${dimmed ? 'opacity-40 saturate-50' : ''} ${className}`
  const faceStyle = {
    ...deal,
    background: 'var(--poker-card-bg)',
    color: suitColor(suit, theme.fourColor === true),
  }

  if (theme.cardFace === 'jumbo') {
    return (
      <div className={frame} style={faceStyle} aria-label={`${rank}${symbol}`}>
        <span className={`leading-none font-extrabold tracking-tight px-[0.18em] pt-[0.12em] ${JUMBO_RANK_CLASSES[size]}`}>
          {rank}
        </span>
        <span className={`leading-none self-end px-[0.25em] pb-[0.2em] ${JUMBO_SUIT_CLASSES[size]}`}>
          {symbol}
        </span>
      </div>
    )
  }

  return (
    <div className={frame} style={faceStyle} aria-label={`${rank}${symbol}`}>
      <span className="leading-none font-bold px-1 pt-0.5">{rank}</span>
      <span className={`absolute inset-0 grid place-items-center ${PIP_CLASSES[size]} leading-none`}>
        {symbol}
      </span>
      <span className="leading-none font-bold px-1 pb-0.5 self-end rotate-180">{rank}</span>
    </div>
  )
}

export interface CardRowProps {
  cards: readonly Card[]
  size?: CardSize
  faceDown?: boolean
  /** Cartas que deben resaltarse (las que forman la mejor mano). */
  highlight?: readonly Card[]
  /** Solapa las cartas para ocupar menos ancho. */
  overlap?: boolean
  className?: string
}

/** Fila de cartas — mano privada, board o ejemplo dentro de una lección. */
export function CardRow({
  cards,
  size = 'md',
  faceDown = false,
  highlight,
  overlap = false,
  className = '',
}: CardRowProps) {
  const highlightSet = highlight ? new Set(highlight) : null
  return (
    <div className={`flex items-center ${overlap ? '-space-x-3' : 'gap-1'} ${className}`}>
      {cards.map((card, index) => (
        <PlayingCard
          key={`${card}-${index}`}
          card={card}
          size={size}
          faceDown={faceDown}
          highlighted={highlightSet ? highlightSet.has(card) : false}
          dimmed={highlightSet ? !highlightSet.has(card) : false}
          dealDelay={index * 70}
        />
      ))}
    </div>
  )
}
