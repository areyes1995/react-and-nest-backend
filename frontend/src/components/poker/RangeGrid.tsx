// ──────────────────────────────────────────────
// RangeGrid — la matriz 13×13 de manos iniciales.
// Cada celda se pinta según la frecuencia con la
// que se juega (más intensa = más a menudo) y su
// tipo de acción: subir (dorado) o pagar (azul).
// El texto escala con el ancho de la matriz, así
// se lee igual en una página que en un modal.
// Lo usan la página de rangos y el modal de la mesa.
// ──────────────────────────────────────────────

import { GRID_RANKS, cellNotation } from '@features/tools/ranges'

export type RangeTone = 'raise' | 'call'

export interface RangeCell {
  /** Frecuencia 0..100; 0 es fuera del rango. */
  weight: number
  tone?: RangeTone
}

const TONE_COLOR: Record<RangeTone, string> = {
  raise: 'var(--poker-gold)',
  call: '#38bdf8',
}

const DARK_TEXT = '#1a1206'

/** Color de una celda según su frecuencia y su tipo de acción. */
export function rangeCellColor(weight: number, tone: RangeTone = 'raise'): string {
  if (weight >= 100) return TONE_COLOR[tone]
  // Del 25% al 100% de intensidad: una mano al 10% sigue viéndose.
  const mix = Math.round(25 + weight * 0.75)
  return `color-mix(in srgb, ${TONE_COLOR[tone]} ${mix}%, var(--bg-surface-soft))`
}

export interface RangeGridProps {
  cellFor: (hand: string) => RangeCell
  /** Mano resaltada con un aro (la del cursor o la elegida). */
  selected?: string | null
  /** Mano marcada como "la tuya" (p.ej. tus cartas en la mesa). */
  mine?: string | null
  onSelect?: (hand: string | null) => void
  /** Etiqueta de las manos fuera del rango en el tooltip. */
  outLabel?: string
}

export default function RangeGrid({
  cellFor,
  selected = null,
  mine = null,
  onSelect,
  outLabel = 'no se juega',
}: RangeGridProps) {
  return (
    <div className="w-full [container-type:inline-size]">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        onMouseLeave={() => onSelect?.(null)}
      >
        {GRID_RANKS.map((_, row) =>
          GRID_RANKS.map((__, col) => {
            const hand = cellNotation(row, col)
            const { weight, tone = 'raise' } = cellFor(hand)
            const included = weight > 0
            const mixed = included && weight < 100
            const darkText = weight >= 50
            const isMine = mine === hand

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                title={`${hand}: ${included ? `${weight}%${tone === 'call' ? ' pagar' : ''}` : outLabel}${isMine ? ' · tu mano' : ''}`}
                onMouseEnter={() => onSelect?.(hand)}
                onFocus={() => onSelect?.(hand)}
                onClick={() => onSelect?.(hand)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-[3px] leading-none transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] ${
                  isMine
                    ? 'ring-[3px] ring-emerald-400 z-20'
                    : selected === hand
                      ? 'ring-2 ring-[var(--text-primary)] z-10'
                      : ''
                } ${included ? '' : 'bg-[var(--bg-surface-soft)] text-[var(--text-muted)]'}`}
                style={
                  included
                    ? {
                        background: rangeCellColor(weight, tone),
                        color: darkText ? DARK_TEXT : 'var(--text-primary)',
                      }
                    : undefined
                }
              >
                <span className="font-semibold" style={{ fontSize: 'max(0.5625rem, calc(100cqw * 0.024))' }}>
                  {hand}
                </span>
                {mixed && (
                  <span
                    className="hidden sm:block mt-[0.15em] font-medium tabular-nums opacity-80"
                    style={{ fontSize: 'max(0.5rem, calc(100cqw * 0.017))' }}
                  >
                    {weight}%
                  </span>
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
