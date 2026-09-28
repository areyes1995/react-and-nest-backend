// ──────────────────────────────────────────────
// CardPicker — la baraja completa para elegir.
// En pantalla ancha, cuatro filas (una por palo)
// de trece cartas que ocupan todo el ancho. En el
// modo compacto (móvil) cada palo se parte en dos
// filas de siete, para que cada carta sea lo
// bastante grande como para tocarla con el dedo.
// Las cartas en uso muestran a quién pertenecen;
// tocarlas las devuelve.
// ──────────────────────────────────────────────

import { RANK_LABELS, SUITS, SUIT_SYMBOLS, makeCard, type Card } from '@poker/engine'

const RANKS_DESC = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

export interface CardPickerProps {
  /** Carta → dueño ("BTN", "Mesa"…). */
  owners: Map<Card, string>
  /** A dónde va la próxima carta, para el texto de ayuda. */
  targetLabel?: string
  onPick: (card: Card) => void
  /** Siete columnas y cartas grandes: para móvil, dentro del modal. */
  compact?: boolean
}

export default function CardPicker({ owners, targetLabel, onPick, compact = false }: CardPickerProps) {
  return (
    <div
      className={
        compact
          ? 'space-y-2'
          : 'rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3 sm:p-4 space-y-2'
      }
    >
      {targetLabel && (
        <p className="text-sm text-[var(--text-secondary)]">
          Elige cartas para <strong className="text-[var(--poker-gold)]">{targetLabel}</strong>. Toca una
          carta en uso para quitarla.
        </p>
      )}

      <div className={compact ? 'space-y-2.5' : 'space-y-1.5'}>
        {SUITS.map(suit => {
          const isRed = suit === 'h' || suit === 'd'
          return (
            <div
              key={suit}
              className={`grid ${compact ? 'gap-1.5' : 'gap-1 sm:gap-1.5'}`}
              style={{ gridTemplateColumns: `repeat(${compact ? 7 : 13}, minmax(0, 1fr))` }}
            >
              {RANKS_DESC.map(rank => {
                const card = makeCard(rank, suit)
                const owner = owners.get(card)
                return (
                  <button
                    key={card}
                    type="button"
                    onClick={() => onPick(card)}
                    title={owner ? `En uso: ${owner} (toca para quitarla)` : undefined}
                    aria-label={`${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}${owner ? `, en uso: ${owner}` : ''}`}
                    className={`relative rounded-md border flex flex-col items-center justify-center leading-none transition ${
                      compact ? 'h-12' : 'h-[clamp(2.5rem,6.5vh,4rem)]'
                    } ${
                      owner
                        ? 'border-[var(--border)] bg-[var(--bg-surface)] opacity-45 hover:opacity-70'
                        : 'border-black/15 shadow-sm hover:-translate-y-0.5 hover:border-[var(--poker-gold)] hover:shadow-md active:scale-95'
                    }`}
                    style={{
                      background: owner ? undefined : 'var(--poker-card-bg)',
                      color: isRed ? 'var(--poker-suit-red)' : 'var(--poker-suit-black)',
                    }}
                  >
                    <span className={`font-extrabold ${compact ? 'text-base' : 'text-[0.8125rem] sm:text-base lg:text-lg'}`}>
                      {RANK_LABELS[rank]}
                    </span>
                    <span className={compact ? 'text-sm' : 'text-[0.75rem] sm:text-sm lg:text-base'}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    {owner && (
                      <span
                        className={`absolute inset-x-0 bottom-0 truncate rounded-b-md bg-black/60 px-0.5 py-px text-[0.5625rem] font-bold text-white ${
                          compact ? '' : 'hidden sm:block'
                        }`}
                      >
                        {owner}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
