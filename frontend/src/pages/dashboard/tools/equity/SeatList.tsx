// ──────────────────────────────────────────────
// SeatList — vista de calculadora (tipo Equilab).
// Una fila compacta por posición: sus cartas, su
// equity y los controles (héroe, visible en mesa,
// fuera de la mano). Tocar la fila la elige como
// destino. En dos columnas cuando hay ancho, para
// que la baraja quede a la vista sin scroll.
// ──────────────────────────────────────────────

import type { KeyboardEvent, ReactNode } from 'react'
import { Eye, EyeOff, LogIn, LogOut, UserRound } from 'lucide-react'
import CardSlot from './CardSlot'
import type { SeatActions, SeatInfo } from './types'

interface SeatListProps extends SeatActions {
  seats: SeatInfo[]
  activeId: number | null
  /** Hay un cálculo en marcha: los números visibles son de antes. */
  calculating?: boolean
}

export function activateOnKey(event: KeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

export default function SeatList({
  seats,
  activeId,
  calculating = false,
  onSelect,
  onRemoveCard,
  onToggleVisible,
  onToggleFolded,
  onSetHero,
}: SeatListProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {seats.map(({ seat, label, isHero, result, winner, handName }) => {
        const active = activeId === seat.id
        const equity = result ? result.equity * 100 : null

        return (
          <div
            key={seat.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(seat.id)}
            onKeyDown={event => activateOnKey(event, () => onSelect(seat.id))}
            className={`flex items-center gap-2 sm:gap-3 rounded-xl border px-2 sm:px-2.5 py-1.5 cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--poker-gold)] ${
              active
                ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/[0.07]'
                : 'border-[var(--border)] bg-[var(--bg-panel)] hover:border-[var(--border-active)]'
            } ${seat.folded ? 'opacity-50' : ''} ${winner ? 'ring-2 ring-emerald-500/60' : ''}`}
          >
            {/* Posición */}
            <div className="w-11 sm:w-12 shrink-0 leading-tight">
              <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
              {isHero ? (
                <span className="text-xs font-semibold text-[var(--poker-gold)]">Tú</span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">{seat.folded ? 'Fuera' : 'Rival'}</span>
              )}
            </div>

            {/* Cartas */}
            <div className="flex gap-1 shrink-0">
              {[0, 1].map(index => (
                <CardSlot
                  key={index}
                  card={seat.cards[index]}
                  size="sm"
                  highlight={active && index === seat.cards.length}
                  hint={seat.cards.length === 0 && index === 0 ? '?' : undefined}
                  onRemove={onRemoveCard}
                />
              ))}
            </div>

            {/* Equity */}
            <div className={`flex-1 min-w-0 transition-opacity ${calculating ? 'opacity-40' : ''}`}>
              {seat.folded ? (
                <p className="text-xs text-[var(--text-muted)]">Fuera de la mano</p>
              ) : equity === null ? (
                <p className="text-xs text-[var(--text-muted)]">
                  {seat.cards.length === 0 ? 'Mano aleatoria' : '—'}
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-1.5">
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{ color: isHero ? 'var(--poker-gold)' : 'var(--text-primary)' }}
                    >
                      {equity.toFixed(1)}%
                    </span>
                    <span
                      className="hidden sm:inline truncate text-[0.6875rem] tabular-nums text-[var(--text-muted)]"
                      title={`Gana ${(result!.win * 100).toFixed(1)}% · empata ${(result!.tie * 100).toFixed(1)}%`}
                    >
                      G {(result!.win * 100).toFixed(1)} · E {(result!.tie * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${equity}%`,
                        background: isHero ? 'var(--poker-gold)' : 'var(--text-secondary)',
                      }}
                    />
                  </div>
                  {handName && (
                    <p className="mt-0.5 truncate text-[0.6875rem] text-[var(--text-secondary)]">{handName}</p>
                  )}
                </>
              )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-1 shrink-0" onClick={event => event.stopPropagation()}>
              {!isHero && (
                <IconButton label="Sentarme aquí" active={false} onClick={() => onSetHero(seat.id)}>
                  <UserRound className="h-3.5 w-3.5" />
                </IconButton>
              )}
              {!isHero && (
                <IconButton
                  label={seat.visible ? 'Ocultar sus cartas en la mesa' : 'Mostrar sus cartas en la mesa'}
                  active={seat.visible}
                  onClick={() => onToggleVisible(seat.id)}
                >
                  {seat.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </IconButton>
              )}
              <IconButton
                label={seat.folded ? 'Volver a la mano' : 'Retirar de la mano'}
                active={seat.folded}
                onClick={() => onToggleFolded(seat.id)}
              >
                {seat.folded ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
              </IconButton>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-lg transition ${
        active
          ? 'bg-[var(--poker-gold)]/20 text-[var(--poker-gold)]'
          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      {children}
    </button>
  )
}
