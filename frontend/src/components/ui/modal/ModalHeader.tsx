import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalHeaderProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  onClose: () => void
}

export default function ModalHeader({
  title,
  subtitle,
  actions,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div className="space-y-1">
        {title && <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
        {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
