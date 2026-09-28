// ──────────────────────────────────────────────
// Marcadores de la mesa: bote central y botón
// del dealer (las apuestas van en BetChips). Son los
// elementos que le dan lectura inmediata a la
// mesa — el estudiante debe ver de un vistazo
// cuánto hay en juego y quién está en posición.
// ──────────────────────────────────────────────

import { DEFAULT_TABLE_DISPLAY, formatAmount, useChipFormat } from '@features/table/TableDisplayContext'

/**
 * Formatea fichas de forma compacta: 12500 → 12.5k. Ignora las preferencias
 * del estudiante: dentro de una mesa se usa `useChipFormat`, que sí las sigue
 * (fichas o BB).
 */
export function formatChips(amount: number): string {
  return formatAmount(amount, DEFAULT_TABLE_DISPLAY)
}

export interface PotDisplayProps {
  /** Bote acumulado de calles anteriores. */
  main: number
  /** Apuestas de la calle en curso, aún sin recoger. */
  pending?: number
}

/** Bote central. Separa lo ya recogido de lo apostado en la calle actual. */
export function PotDisplay({ main, pending = 0 }: PotDisplayProps) {
  const formatChips = useChipFormat()
  if (main <= 0 && pending <= 0) return null
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[var(--poker-gold)]/40 backdrop-blur-sm">
        <span className="text-mini uppercase tracking-wider text-[var(--poker-gold)]">Bote</span>
        <span className="text-sm font-bold text-white tabular-nums">{formatChips(main)}</span>
      </div>
      {pending > 0 && (
        <span className="text-mini text-white/60 tabular-nums">+{formatChips(pending)} en juego</span>
      )}
    </div>
  )
}

/** Botón del dealer. Marca la posición, que es la variable clave del juego. */
export function DealerButton({ className = '' }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-caption sm:text-xs font-black text-slate-900 shadow-lg ring-2 ring-black/25 ${className}`}
      title="Botón del dealer"
    >
      D
    </span>
  )
}
