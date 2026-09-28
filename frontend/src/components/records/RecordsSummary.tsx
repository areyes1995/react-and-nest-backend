// ──────────────────────────────────────────────
// RecordsSummary — Charts & KPIs for the active module.
// Groups by the module's `chartGroup` column (falls back to a
// categorical text column) so charts adapt to each module's data.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { LayoutGrid, CheckCircle2, Clock, Archive, TrendingUp, FolderOpen } from 'lucide-react'
import { sampleData, RECORD_STATUSES, STATUS_META, MODULE_BAR_COLORS } from '@records'
import type { RecordColumn, RecordData } from '@records'
import { KpiCard, CategoryBarList, StatusOverview } from '@components/charts'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface RecordsSummaryProps {
  data?: RecordData[]
  columns?: RecordColumn[]
  moduleColor?: string
}

const statusIcons = {
  Active: <CheckCircle2 className="w-4 h-4" />,
  Pending: <Clock className="w-4 h-4" />,
  Archived: <Archive className="w-4 h-4" />,
}

export default function RecordsSummary({ data, columns = [], moduleColor }: RecordsSummaryProps) {
  const { t } = useAppTranslation()
  const rows = data ?? sampleData

  /* ── Pick the grouping column: explicit chartGroup, else first text/select non-id column ── */
  const groupColumn = useMemo<RecordColumn | undefined>(() => {
    const explicit = columns.find(col => col.chartGroup)
    if (explicit) return explicit
    return columns.find(col => col.key !== 'id' && (col.type === 'text' || col.type === 'select'))
  }, [columns])

  const stats = useMemo(() => {
    const byStatus: Record<RecordData['status'], number> = { Active: 0, Pending: 0, Archived: 0 }
    const byGroup = new Map<string, number>()

    for (const row of rows) {
      byStatus[row.status]++
      const groupValue = groupColumn ? String(row[groupColumn.key] ?? '—') : '—'
      byGroup.set(groupValue, (byGroup.get(groupValue) ?? 0) + 1)
    }

    const groups = [...byGroup.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return { total: rows.length, byStatus, groups }
  }, [rows, groupColumn])

  const isHex = typeof moduleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(moduleColor)
  const barClass = moduleColor && !isHex ? (MODULE_BAR_COLORS[moduleColor] ?? 'bg-blue-500') : 'bg-blue-500'
  const barStyle = isHex ? { backgroundColor: moduleColor } : undefined
  const segments = RECORD_STATUSES.map(status => ({
    label: STATUS_META[status].label,
    count: stats.byStatus[status],
    color: STATUS_META[status].color,
    bar: STATUS_META[status].bar,
  }))

  const recent = rows.slice(0, 4).map(row => ({
    id: row.id,
    title: String(row.title),
    date: String(row.lastUpdated),
    dotClass: STATUS_META[row.status].bar,
  }))

  return (
    <div className="flex-1 overflow-auto px-4 lg:px-6 pt-5 pb-24">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Total')}
          value={stats.total}
          hint={t('records in view')}
          icon={<LayoutGrid className="w-4 h-4" />}
        />
        {RECORD_STATUSES.map(status => (
          <KpiCard
            key={status}
            label={STATUS_META[status].label}
            value={stats.byStatus[status]}
            hint={`${stats.total ? Math.round((stats.byStatus[status] / stats.total) * 100) : 0}% ${t('of records')}`}
            icon={statusIcons[status]}
            accentClass={STATUS_META[status].color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CategoryBarList
          title={`${t('Records by')} ${groupColumn?.header ?? t('group')}`}
          items={stats.groups}
          icon={<FolderOpen className="w-4 h-4 text-[var(--text-muted)]" />}
          barClass={barClass}
          barStyle={barStyle}
        />
        <StatusOverview
          title={t('Status overview')}
          segments={segments}
          total={stats.total}
          recent={recent}
          icon={<TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />}
        />
      </div>
    </div>
  )
}