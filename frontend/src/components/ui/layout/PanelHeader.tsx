// ──────────────────────────────────────────────
// PanelHeader — Back button + title row
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export interface PanelHeaderProps {
  title: string
  onBack?: () => void
  actions?: ReactNode
}

export default function PanelHeader({ title, onBack, actions }: PanelHeaderProps) {
  return (
    <header className="px-4 lg:px-8 py-3.5 flex items-center gap-3 border-b border-[var(--border)] shrink-0 bg-[var(--bg-main)] min-h-[3.5625rem]">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
      )}
      {onBack && <span className="w-px h-5 bg-[var(--bg-surface)]" />}
      <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate">{title}</h1>
      {actions && <div className="ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}