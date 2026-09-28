// ──────────────────────────────────────────────
// StatsGrid — grid de métricas 2/4 cols
// Unifica los stats duplicados de Stands/Projects.
// ──────────────────────────────────────────────

interface StatItem {
  label: string
  value: number | string
  accentClass?: string
}

export default function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 lg:px-6 py-3 border-b border-[var(--border)]">
      {items.map(s => (
        <div key={s.label} className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-3 min-w-0">
          <div className="text-xs text-[var(--text-muted)] mb-1 truncate">{s.label}</div>
          <div className={`text-2xl font-bold tabular-nums ${s.accentClass ?? 'text-[var(--text-primary)]'}`}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}
