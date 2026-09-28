// ──────────────────────────────────────────────
// CategoryBarList — horizontal bar list by category
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface CategoryBarItem {
  name: string
  count: number
  subtitle?: string
  /** Optional per-item bar color. Overrides the shared `barClass`. */
  color?: string
}

export interface CategoryBarListProps {
  title: string
  subtitle?: string
  items: CategoryBarItem[]
  icon?: ReactNode
  barClass?: string
  barStyle?: React.CSSProperties
}

export default function CategoryBarList({ title, subtitle, items, icon, barClass = 'bg-blue-500', barStyle }: CategoryBarListProps) {
  const { t } = useAppTranslation()
  const max = Math.max(1, ...items.map(i => i.count))

  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] h-full">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)]">{item.name}</span>
              <span className="text-[var(--text-muted)] font-medium">{item.count}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              {item.color ? (
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ ...barStyle, width: `${(item.count / max) * 100}%`, backgroundColor: item.color }}
                />
              ) : (
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                  style={{ ...barStyle, width: `${(item.count / max) * 100}%` }}
                />
              )}
            </div>
            {item.subtitle && <p className="text-mini text-[var(--text-muted)] mt-1">{item.subtitle}</p>}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">{t('No data available')}</p>
        )}
      </div>
    </div>
  )
}