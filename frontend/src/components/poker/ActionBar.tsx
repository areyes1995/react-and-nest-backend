// ──────────────────────────────────────────────
// ActionBar — los controles del jugador.
// Presets de tamaño (1/2, 3/4, bote, all-in) y
// atajos de teclado, porque apostar por fracciones
// del bote es el hábito que hay que instalar desde
// el primer día: pensar en bote, no en fichas.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import type { LegalActions, PlayerAction } from '@poker/engine'
import { useChipFormat } from '@features/table/TableDisplayContext'

export interface ActionBarProps {
  legal: LegalActions | null
  /** Bote total en el momento de decidir, para calcular los presets. */
  pot: number
  /** Apuesta máxima igualada en la calle actual. */
  currentBet: number
  bigBlind: number
  disabled?: boolean
  onAction: (action: PlayerAction) => void
}

interface Preset {
  label: string
  /** Fracción del bote; `null` para all-in. */
  fraction: number | null
}

const PRESETS: Preset[] = [
  { label: '½ bote', fraction: 0.5 },
  { label: '¾ bote', fraction: 0.75 },
  { label: 'Bote', fraction: 1 },
  { label: 'All-in', fraction: null },
]

export default function ActionBar({
  legal,
  pot,
  currentBet,
  bigBlind,
  disabled = false,
  onAction,
}: ActionBarProps) {
  const formatChips = useChipFormat(bigBlind)
  const canAggress = !!legal && (legal.canBet || legal.canRaise)
  const [amount, setAmount] = useState(legal?.minRaiseTo ?? 0)

  // Al cambiar el turno, el slider vuelve a la subida mínima.
  useEffect(() => {
    if (legal) setAmount(legal.minRaiseTo)
  }, [legal?.minRaiseTo, legal?.maxRaiseTo])

  // Una subida "de bote" es igualar y subir el bote resultante: el estudiante
  // debe razonar en fracciones del bote, no en fichas sueltas.
  const presetValue = useMemo(
    () => (preset: Preset) => {
      if (!legal) return 0
      if (preset.fraction === null) return legal.maxRaiseTo
      const potAfterCall = pot + legal.callAmount
      const to = currentBet + Math.round(potAfterCall * preset.fraction)
      return Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, to))
    },
    [legal, pot, currentBet],
  )

  // ── Atajos de teclado ──
  useEffect(() => {
    if (!legal || disabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'text') return
      const key = event.key.toLowerCase()
      if (key === 'f' && legal.canFold) onAction({ type: 'fold' })
      else if (key === 'c') {
        if (legal.canCheck) onAction({ type: 'check' })
        else if (legal.canCall) onAction({ type: 'call' })
      } else if (key === 'r' && canAggress) {
        onAction({ type: legal.canBet ? 'bet' : 'raise', amount })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [legal, disabled, amount, canAggress, onAction])

  if (!legal) {
    return (
      <div className="h-[5.25rem] grid place-items-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        Esperando a los rivales…
      </div>
    )
  }

  const btn =
    'px-2 sm:px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold leading-tight transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed'

  return (
    <div className="space-y-2">
      {/* ── Tamaño de la apuesta ── */}
      {canAggress && (
        // Móvil: presets en una fila a todo el ancho y, debajo, slider + importe.
        // Desde sm todo cabe en una sola línea.
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="grid w-full grid-cols-4 gap-1 sm:flex sm:w-auto sm:gap-1.5">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => setAmount(presetValue(preset))}
                className="px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-caption font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition disabled:opacity-40"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            step={Math.max(1, Math.round(bigBlind / 2))}
            value={amount}
            disabled={disabled}
            onChange={event => setAmount(Number(event.target.value))}
            className="min-w-0 flex-1 sm:min-w-[8.75rem] accent-[var(--poker-gold)]"
            aria-label="Tamaño de la apuesta"
          />

          <span className="min-w-[3.75rem] sm:min-w-[4.5rem] text-right text-sm font-bold text-[var(--poker-gold)] tabular-nums">
            {formatChips(amount)}
          </span>
        </div>
      )}

      {/* ── Acciones ── */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={disabled || !legal.canFold}
          onClick={() => onAction({ type: 'fold' })}
          className={`${btn} bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-red-500/15 hover:text-red-400`}
          title="Atajo: F"
        >
          Retirarse
        </button>

        {legal.canCheck ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction({ type: 'check' })}
            className={`${btn} bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]`}
            title="Atajo: C"
          >
            Pasar
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || !legal.canCall}
            onClick={() => onAction({ type: 'call' })}
            className={`${btn} bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]`}
            title="Atajo: C"
          >
            Igualar <span className="tabular-nums opacity-70">{formatChips(legal.callAmount)}</span>
          </button>
        )}

        <button
          type="button"
          disabled={disabled || !canAggress}
          onClick={() => onAction({ type: legal.canBet ? 'bet' : 'raise', amount })}
          className={`${btn} text-black`}
          style={{ background: 'var(--poker-gold)' }}
          title="Atajo: R"
        >
          {legal.canBet ? 'Apostar' : 'Subir a'}{' '}
          <span className="tabular-nums">{formatChips(amount)}</span>
        </button>
      </div>

      {/* Solo con altura de sobra: en pantallas bajas cada píxel es de la mesa. */}
      <p className="hidden text-mini text-[var(--text-muted)] text-center [@media(min-width:1024px)_and_(min-height:900px)]:block">
        Atajos: <kbd>F</kbd> retirarse · <kbd>C</kbd> pasar/igualar · <kbd>R</kbd> apostar
      </p>
    </div>
  )
}
