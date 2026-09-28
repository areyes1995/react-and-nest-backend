// ──────────────────────────────────────────────
// DetailInfoGrid — grid 2 cols label/valor para
// DetailModals. Unifica Project/Stands specs.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export interface DetailInfoItem {
  key: string
  label: string
  value: ReactNode
}

export default function DetailInfoGrid({ items }: { items: DetailInfoItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.key} className="p-3 rounded-lg bg-[var(--bg-surface-soft)] border border-[var(--border)] min-w-0">
          <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
          <div className="text-sm font-medium text-[var(--text-primary)] mt-1 truncate">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
