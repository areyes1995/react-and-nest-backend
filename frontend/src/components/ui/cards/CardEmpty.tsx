import type { ComponentType, SVGProps } from 'react'
import { PlusCircle } from 'lucide-react'

export interface CardEmptyProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  message: string
  role?: string
  rolesWithAction?: string[]
  actionLabel?: string
  onAction?: () => void
}

export default function CardEmpty({
  icon: Icon,
  message,
  role,
  rolesWithAction,
  actionLabel,
  onAction,
}: CardEmptyProps) {
  const showAction = !!onAction && actionLabel && role
  const canShowAction = showAction && rolesWithAction ? rolesWithAction.includes(role) : showAction

  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center gap-4 text-center">
      {Icon && <Icon className="w-8 h-8 text-[var(--text-muted)]" strokeWidth={1.5} />}
      <p className="text-sm text-[var(--text-muted)] max-w-sm">{message}</p>
      {canShowAction && (
        <button
          onClick={onAction}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
        >
          <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
