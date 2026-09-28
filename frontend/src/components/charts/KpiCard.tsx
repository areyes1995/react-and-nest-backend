// ──────────────────────────────────────────────
// KpiCard — single stat card for summaries
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export interface KpiCardProps {
  label: string
  value: number
  hint?: React.ReactNode
  suffix?: string
  icon?: ReactNode
  accentClass?: string
}

export default function KpiCard({ label, value, hint, suffix, icon, accentClass = 'text-[var(--text-muted)]' }: KpiCardProps) {
  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] cursor-default h-full">
      <div className={`flex items-center gap-2 mb-3 ${accentClass}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)]">
        {value}
        {suffix && <span className="text-base text-[var(--text-muted)] ml-1">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-[var(--text-muted)] mt-1">{hint}</div>}
    </div>
  )
}