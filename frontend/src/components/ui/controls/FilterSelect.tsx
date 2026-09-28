// ──────────────────────────────────────────────
// FilterSelect — select estilizado reutilizable
// para filtros del dashboard (mismo look que
// MetricsPage: bg-surface-soft, xs, rounded-lg).
// ──────────────────────────────────────────────

interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  ariaLabel: string
  minWidth?: string
}

const BASE_CLASS =
  'px-3 py-2 text-xs bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)] transition-colors appearance-none pr-8 cursor-pointer'

export default function FilterSelect({ value, options, onChange, ariaLabel, minWidth }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={BASE_CLASS}
      style={minWidth ? { minWidth } : undefined}
      aria-label={ariaLabel}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
