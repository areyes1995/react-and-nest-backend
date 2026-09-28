// ──────────────────────────────────────────────
// EntityModalAction — botón pill genérico para headers
// de DetailModal (Aprobar/Publicar/Editar/Eliminar).
// Unifica ProjectDetailModal y StandsDetailModal.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export type EntityActionTone = 'emerald' | 'violet' | 'blue' | 'red' | 'ghost'

const toneClasses: Record<EntityActionTone, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30',
  violet: 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30',
  blue: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
  red: 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
  ghost: 'bg-red-500/10 text-red-400/80 hover:bg-red-500/20',
}

interface EntityModalActionProps {
  tone?: EntityActionTone
  disabled?: boolean
  onClick?: () => void
  icon?: ReactNode
  children: ReactNode
}

export default function EntityModalAction({
  tone = 'blue',
  disabled,
  onClick,
  icon,
  children,
}: EntityModalActionProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </button>
  )
}
