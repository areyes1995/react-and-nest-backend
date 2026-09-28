// ──────────────────────────────────────────────
// DateRangePicker — selector de rango de fechas y
// periodo rápido (3M / 6M / 12M / YTD / Custom)
// ──────────────────────────────────────────────

import { useAppTranslation } from '@i18n/useAppTranslation'
import type { PeriodKey, DateRange } from '@hooks/useAttritionReport'

export interface DateRangePickerProps {
  period: PeriodKey
  dateRange: DateRange
  onPeriodChange: (p: PeriodKey) => void
  onDateRangeChange: (r: DateRange) => void
}

export default function DateRangePicker({
  period,
  dateRange,
  onPeriodChange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const { t } = useAppTranslation()

  const periods: { key: PeriodKey; label: string }[] = [
    { key: '3', label: '3M' },
    { key: '6', label: '6M' },
    { key: '12', label: '12M' },
    { key: 'YTD', label: t('attrition.period.ytd') },
    { key: 'custom', label: t('attrition.period.custom') },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => onPeriodChange(p.key)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              period === p.key
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateRange.from ?? ''}
            onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value || undefined })}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]"
          />
          <span className="text-xs text-[var(--text-muted)]">→</span>
          <input
            type="date"
            value={dateRange.to ?? ''}
            onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value || undefined })}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]"
          />
        </div>
      )}
    </div>
  )
}
