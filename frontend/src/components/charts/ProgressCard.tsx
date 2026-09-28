export interface ProgressItem {
  label: string
  value: number
  max: number
  status?: 'good' | 'warning' | 'error'
}

interface ProgressCardProps {
  avgValue: number
  avgSuffix: string
  items: ProgressItem[]
  title: string
}

export default function ProgressCard({
  avgValue,
  avgSuffix,
  items,
  title,
}: ProgressCardProps) {
  const statusColor = {
    good: 'text-emerald-400 bg-emerald-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    error: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <div className="text-xs text-[var(--text-muted)]">
          Promedio:{' '}
          <span className="text-[var(--text-primary)] font-medium">
            {avgValue} {avgSuffix}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const pct = Math.min((item.value / item.max) * 100, 100)
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-primary)]">{item.label}</span>
                <span className={`px-2 py-0.5 rounded-full ${statusColor[item.status || 'good']}`}>
                  {item.value}ms
                </span>
              </div>
              <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.status === 'good'
                      ? 'bg-emerald-500'
                      : item.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
