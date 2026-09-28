// ──────────────────────────────────────────────
// PositionBadge — la posición, legible de un vistazo.
// Antes era un texto gris de 9px junto al nombre y se
// perdía. Ahora es una pastilla con el color de la
// posición y su nombre completo en el tooltip, porque
// "estoy en CO" es la mitad de cualquier decisión.
// ──────────────────────────────────────────────

import { positionMeta } from '@features/table/positions'

export interface PositionBadgeProps {
  /** Etiqueta del motor: `BTN`, `SB`, `CO`… */
  position: string
  size?: 'sm' | 'md'
  /** Realza la pastilla (la posición del estudiante). */
  emphasis?: boolean
  className?: string
}

export default function PositionBadge({
  position,
  size = 'sm',
  emphasis = false,
  className = '',
}: PositionBadgeProps) {
  const meta = positionMeta(position)
  if (!meta) return null

  const dimensions =
    size === 'md' ? 'px-2 py-0.5 text-caption' : 'px-1.5 py-[1px] text-mini'

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-bold uppercase tracking-wide ${dimensions} ${className}`}
      style={
        emphasis
          ? { background: meta.color, color: '#0b0d12' }
          : { background: `${meta.color}26`, color: meta.color, border: `1px solid ${meta.color}59` }
      }
      title={`${meta.name} — ${meta.hint}`}
    >
      {meta.id}
    </span>
  )
}
