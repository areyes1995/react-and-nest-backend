// ──────────────────────────────────────────────
// StatusOverview — segmented distribution + recent items
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { SectionTitle } from '@components/ui'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface StatusSegment {
  label: string
  count: number
  color: string
  bar: string
}

export interface RecentItem {
  id: string
  title: string
  date: string
  dotClass: string
}

export interface StatusOverviewProps {
  title: string
  segments: StatusSegment[]
  total: number
  recent?: RecentItem[]
  icon?: ReactNode
}

export default function StatusOverview({ title, segments, total, recent, icon }: StatusOverviewProps) {
  const { t } = useAppTranslation()
  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] h-full">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {segments.map(seg => (
          <div
            key={seg.label}
            className={`${seg.bar} transition-all duration-500`}
            style={{ width: total ? `${(seg.count / total) * 100}%` : 0 }}
          />
        ))}
      </div>

      <div className="space-y-2.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${seg.bar}`} />
              <span className="text-[var(--text-secondary)]">{seg.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--text-primary)] font-medium">{seg.count}</span>
              <span className={`text-xs w-10 text-right ${seg.color}`}>
                {total ? Math.round((seg.count / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {recent && recent.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <SectionTitle className="mb-2">{t('Latest activity')}</SectionTitle>
          <ul className="space-y-2">
            {recent.map(row => (
              <li key={row.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dotClass}`} />
                  <span className="text-[var(--text-secondary)] truncate">{row.title}</span>
                </div>
                <span className="text-[var(--text-muted)] shrink-0 ml-3">{row.date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}