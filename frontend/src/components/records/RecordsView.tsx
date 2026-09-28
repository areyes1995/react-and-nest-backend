// ──────────────────────────────────────────────
// RecordsView — renders the main content for a module + view option
// ──────────────────────────────────────────────

import { LayoutGrid, CheckCircle2, Clock, Archive, FolderOpen, TrendingUp } from 'lucide-react'
import { getRecordsForModule, RECORD_STATUSES, STATUS_META, MODULE_BAR_COLORS } from '@records'
import type { RecordModule, RecordViewOption, RecordColumn, RecordData } from '@records'
import RagSearchView from './RagSearchView'
import UploadDocumentView from './UploadDocumentView'
import { DynamicComponentRenderer } from '@components/charts'
import type { DynamicBlock } from '@components/charts'

export interface SummaryChartConfig {
  kpiRow?: Array<{ label: string; targetKey: string; filter?: string; icon: string }>
  charts?: Array<{
    type: 'donut' | 'bar'
    title: string
    description: string
    groupKey?: string
    valueKey?: string
    color?: string
    colors?: Record<string, string>
    items?: Array<{ name: string; value: number; color: string }>
  }>
  overview?: {
    title: string
    recentKey?: string
    groupBy: string
  }
}

const MOCK_NAMES = ['Ana López', 'Carlos Ruiz', 'María García', 'Pedro Martínez', 'Laura Sánchez', 'Jorge Pérez']
const MOCK_TITLES = ['Record One', 'Record Two', 'Record Three', 'Record Four', 'Record Five']
const MOCK_DATES = ['01/01/2024', '15/02/2024', '10/03/2024', '20/02/2024', '05/03/2024']

function generateMockData(columns: RecordColumn[]): RecordData[] {
  const statuses: RecordData['status'][] = ['Active', 'Active', 'Active', 'Pending', 'Pending', 'Archived']
  const rows: RecordData[] = []

  for (let i = 0; i < 7; i++) {
    const row: RecordData = { id: `USR-${String(i + 1).padStart(3, '0')}`, status: statuses[i % statuses.length], lastUpdated: MOCK_DATES[i % MOCK_DATES.length] } as RecordData
    row.id = `USR-${String(i + 1).padStart(3, '0')}`
    row.title = MOCK_TITLES[i % MOCK_TITLES.length]
    row.status = statuses[i % statuses.length]
    row.lastUpdated = MOCK_DATES[i % MOCK_DATES.length]

    for (const col of columns) {
      if (col.key === 'id' || col.key === 'title' || col.key === 'status' || col.key === 'lastUpdated') continue
      if (col.key === 'owner') {
        (row as Record<string, unknown>)[col.key] = MOCK_NAMES[i % MOCK_NAMES.length]
      } else if (col.type === 'number') {
        (row as Record<string, unknown>)[col.key] = Math.floor(Math.random() * 100) + 1
      } else if (col.type === 'date') {
        (row as Record<string, unknown>)[col.key] = MOCK_DATES[i % MOCK_DATES.length]
      } else if (col.options && col.options.length > 0) {
        (row as Record<string, unknown>)[col.key] = col.options[i % col.options.length]
      } else {
        (row as Record<string, unknown>)[col.key] = `Value ${i + 1}`
      }
    }
    rows.push(row)
  }
  return rows
}

export interface RecordsViewProps {
  module: RecordModule
  view: RecordViewOption
}

function findGroupColumn(columns: RecordColumn[]) {
  const explicit = columns.find(col => col.chartGroup)
  if (explicit) return explicit
  return columns.find(col => col.key !== 'id' && (col.type === 'text' || col.type === 'select'))
}

export function computeSummaryData(
  rows: RecordData[],
  columns: RecordColumn[],
): {
  total: number
  byStatus: Record<RecordData['status'], number>
  groups: { name: string; count: number }[]
  groupColumn?: RecordColumn
} {
  const groupColumn = findGroupColumn(columns)

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

  return { total: rows.length, byStatus, groups, groupColumn }
}

function summaryToDynamicBlocks(
  rows: RecordData[],
  columns: RecordColumn[],
  moduleColor?: string,
): DynamicBlock[] {
  const stats = computeSummaryData(rows, columns)
  const groupColumn = stats.groupColumn
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

  return [
    {
      type: 'KpiCard',
      props: {
        label: 'Total',
        value: stats.total,
        hint: 'records in view',
        icon: <LayoutGrid className="w-4 h-4" />,
      },
      layout: { row: true },
    },
    ...RECORD_STATUSES.map(status => ({
      type: 'KpiCard' as const,
      props: {
        label: STATUS_META[status].label,
        value: stats.byStatus[status],
        hint: `${stats.total ? Math.round((stats.byStatus[status] / stats.total) * 100) : 0}% of records`,
        icon: status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : status === 'Pending' ? <Clock className="w-4 h-4" /> : <Archive className="w-4 h-4" />,
        accentClass: STATUS_META[status].color,
      },
      layout: { row: true },
    })),
    {
      type: 'CategoryBarList',
      props: {
        title: `Records by ${groupColumn?.header ?? 'group'}`,
        items: stats.groups,
        icon: <FolderOpen className="w-4 h-4 text-[var(--text-muted)]" />,
        barClass,
        barStyle,
      },
      layout: { cols: 'grid grid-cols-1 xl:grid-cols-2' },
    },
    {
      type: 'StatusOverview',
      props: {
        title: 'Status overview',
        segments,
        total: stats.total,
        recent,
        icon: <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />,
      },
      layout: { cols: 'grid grid-cols-1 xl:grid-cols-2' },
    },
  ]
}

function countByColumn(rows: RecordData[], key: string): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const val = String(row[key as keyof RecordData] ?? '—')
    counts.set(val, (counts.get(val) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function countByColumnSum(rows: RecordData[], groupKey: string, valueKey: string): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const val = String(row[groupKey as keyof RecordData] ?? '—')
    counts.set(val, (counts.get(val) ?? 0) + (Number(row[valueKey as keyof RecordData]) ?? 0))
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function summaryChartToDynamicBlocks(
  rows: RecordData[],
  _columns: RecordColumn[],
  config: SummaryChartConfig,
  moduleColor?: string,
): DynamicBlock[] {
  const blocks: DynamicBlock[] = []
  const isHex = typeof moduleColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(moduleColor)
  const barClass = moduleColor && !isHex ? (MODULE_BAR_COLORS[moduleColor] ?? 'bg-blue-500') : 'bg-blue-500'
  const barStyle = isHex ? { backgroundColor: moduleColor } : undefined

  if (config.kpiRow && config.kpiRow.length > 0) {
    for (const kpi of config.kpiRow) {
      let value: string | number = 0
      const count = rows.length
      if (kpi.filter) {
        value = rows.filter(r => r.status === kpi.filter).length
      } else if (kpi.targetKey === 'seats') {
        value = rows.reduce((acc, r) => acc + (Number(r['seats' as keyof RecordData]) ?? 0), 0)
      } else if (kpi.targetKey === 'costPerSeat') {
        value = rows.reduce((acc, r) => acc + (Number(r['costPerSeat' as keyof RecordData]) ?? 0), 0)
      } else {
        value = count
      }
      blocks.push({
        type: 'KpiCard',
        props: {
          label: kpi.label,
          value,
          hint: kpi.filter ? `${kpi.filter} items` : kpi.targetKey === 'seats' ? 'total seats' : `${count} records`,
          icon: <LayoutGrid className="w-4 h-4" />,
        },
        layout: { row: true },
      })
    }
  }

  if (config.charts) {
    for (const chart of config.charts) {
      const chartIndex = config.charts!.indexOf(chart)

      if (chart.type === 'donut') {
        const donutGroups = chart.groupKey ? countByColumn(rows, chart.groupKey) : []
        const items = (chart.items?.length ?? 0) > 0 ? chart.items! : donutGroups.map((g: { name: string; count: number }) => ({
          name: g.name,
          value: g.count,
          color: g.name === 'Active' ? '#10b981' : g.name === 'Pending' ? '#f59e0b' : '#94a3b8',
        }))
        blocks.push({
          type: 'DonutChart',
          props: {
            title: chart.title,
            total: rows.length,
            items,
          },
          layout: { cols: chartIndex === 0 ? 'grid grid-cols-1 xl:grid-cols-2' : undefined },
        })
      }

      if (chart.type === 'bar') {
        const groups = chart.groupKey
          ? (chart.valueKey
            ? countByColumnSum(rows, chart.groupKey, chart.valueKey)
            : countByColumn(rows, chart.groupKey))
          : []
        const isHexChart = typeof chart.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(chart.color)
        const chartBarClass = chart.color && !isHexChart ? chart.color : barClass
        const chartBarStyle = isHexChart ? { backgroundColor: chart.color } : barStyle
        blocks.push({
          type: 'CategoryBarList',
          props: {
            title: chart.title,
            items: groups.map(g => ({ name: g.name, count: g.count })),
            icon: <FolderOpen className="w-4 h-4 text-[var(--text-muted)]" />,
            barClass: chartBarClass,
            barStyle: chartBarStyle,
          },
          layout: { cols: chartIndex === 0 ? 'grid grid-cols-1 xl:grid-cols-2' : undefined },
        })
      }
    }
  }

  if (config.overview) {
    const groups = countByColumn(rows, config.overview.groupBy)
    const segments = groups.map(g => {
      const meta = STATUS_META[g.name as RecordData['status']]
      return {
        label: g.name,
        count: g.count,
        color: meta?.color || 'text-[var(--text-muted)]',
        bar: meta?.bar || 'bg-[var(--text-muted)]',
      }
    })
    blocks.push({
      type: 'StatusOverview',
      props: {
        title: config.overview?.title || 'Overview',
        segments,
        total: rows.length,
        recent: rows.slice(0, 4).map(row => ({
          id: row.id,
          title: String(row[config.overview?.recentKey as keyof RecordData] ?? row.title),
          date: String(row.lastUpdated),
          dotClass: STATUS_META[row.status as RecordData['status']]?.bar || 'bg-gray-400',
        })),
        icon: <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />,
      },
      layout: { cols: 'grid grid-cols-1 xl:grid-cols-2' },
    })
  }

  return blocks
}

export default function RecordsView({ module, view }: RecordsViewProps) {
  if (module.slug === 'records') {
    return view.kind === 'upload' ? <UploadDocumentView /> : <RagSearchView />
  }

  const data = getRecordsForModule(module.label)
  const mockData = generateMockData(module.columns)
  const effectiveData = data && data.length > 0 ? data : mockData
  const summaryChartConfig = module.summaryChart as SummaryChartConfig | undefined

  switch (view.kind) {
    case 'summary': {
      const rows = effectiveData
      const blocks = summaryChartConfig
        ? summaryChartToDynamicBlocks(rows, module.columns, summaryChartConfig, module.color)
        : summaryToDynamicBlocks(rows, module.columns, module.color)
      return <DynamicComponentRenderer items={blocks} />
    }
    case 'archived':
      return (
        <DynamicComponentRenderer
          items={[{
            type: 'RecordsTable',
            props: { data: effectiveData, columns: module.columns, statusFilter: 'Archived' },
          }]}
        />
      )
    case 'table':
    default:
      return (
        <DynamicComponentRenderer
          items={[{
            type: 'RecordsTable',
            props: { data: effectiveData, columns: module.columns },
          }]}
        />
      )
  }
}
