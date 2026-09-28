// ──────────────────────────────────────────────
// StatusBadge — badge genérico de estado.
// Unifica los mapas active/pending/... de Projects y
// published/pending/draft de Stands en un solo componente.
// ──────────────────────────────────────────────

export type StatusTone = 'emerald' | 'amber' | 'blue' | 'gray' | 'violet' | 'red'

const toneClasses: Record<StatusTone, string> = {
  emerald: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  amber: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  blue: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
  gray: 'text-gray-300 bg-gray-500/15 border-gray-500/30',
  violet: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  red: 'text-red-300 bg-red-500/15 border-red-500/30',
}

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
  className?: string
}

export default function StatusBadge({ label, tone = 'gray', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`text-mini font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border ${toneClasses[tone]} ${className}`}
    >
      {label}
    </span>
  )
}
