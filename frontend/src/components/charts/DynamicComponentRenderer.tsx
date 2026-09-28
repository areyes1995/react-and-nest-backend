// ──────────────────────────────────────────────
// DynamicComponentRenderer — render components dynamically based on type
// Single items prop: each block is { type, props, layout?, before?, after? }
// Layout: { cols?: string, row?: boolean }
//   - row = true → render as a 4-col grid (KPI-style)
//   - cols = string → group items with same cols value in a grid with that layout
//   - before/after → render text/node before/after the component
// ──────────────────────────────────────────────

import KpiCard from './KpiCard'
import DualAxisLineChart from './DualAxisLineChart'
import CategoryBarList from './CategoryBarList'
import DonutChart from './DonutChart'
import RecordsTable from '@components/records/RecordsTable'
import StatusOverview from './StatusOverview'
import type { KpiCardProps } from './KpiCard'
import type { DualAxisLineChartProps } from './DualAxisLineChart'
import type { CategoryBarListProps } from './CategoryBarList'
import type { DonutChartProps } from './DonutChart'
import type { RecordsTableProps } from '@components/records/RecordsTable'
import type { StatusOverviewProps } from './StatusOverview'
import type { ReactNode } from 'react'

export type LayoutConfig = {
  cols?: string
  row?: boolean
}

export type KpiCardBlock = {
  type: 'KpiCard'
  props: KpiCardProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type DualAxisLineChartBlock = {
  type: 'DualAxisLineChart'
  props: DualAxisLineChartProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type CategoryBarListBlock = {
  type: 'CategoryBarList'
  props: CategoryBarListProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type DonutChartBlock = {
  type: 'DonutChart'
  props: DonutChartProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type StatusOverviewBlock = {
  type: 'StatusOverview'
  props: Omit<StatusOverviewProps, 'title'> & { title: string | undefined }
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type RecordsTableBlock = {
  type: 'RecordsTable'
  props: RecordsTableProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type ComponentGroupProps = {
  title?: string
  icon?: ReactNode
  className?: string
  children?: DynamicBlock[]
}

export type ComponentGroupBlock = {
  type: 'ComponentGroup'
  props: ComponentGroupProps
  layout?: LayoutConfig
  before?: string | ReactNode
  after?: string | ReactNode
}

export type DynamicBlock =
  | KpiCardBlock
  | DualAxisLineChartBlock
  | CategoryBarListBlock
  | DonutChartBlock
  | StatusOverviewBlock
  | RecordsTableBlock
  | ComponentGroupBlock

export interface DynamicComponentRendererProps {
  items: DynamicBlock[]
  className?: string
}

export default function DynamicComponentRenderer({ items, className = '' }: DynamicComponentRendererProps) {
  if (!items || items.length === 0) return null

  const rowItems = items.filter(item => item.layout?.row)
  const normalItems = items.filter(item => !item.layout?.row)

  // Group normal items by their cols value
  const grouped = new Map<string, DynamicBlock[]>()
  for (const item of normalItems) {
    const key = item.layout?.cols ?? '__default__'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(item)
  }

  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    const keyA = a === '__default__' ? '' : a
    const keyB = b === '__default__' ? '' : b
    return keyA.localeCompare(keyB)
  })

  // Render a single component by type
  const renderComponent = (item: DynamicBlock, index: number) => {
    if (item.type === 'KpiCard') return <KpiCard key={index} {...item.props} />
    if (item.type === 'DualAxisLineChart') return <DualAxisLineChart key={index} {...item.props} />
    if (item.type === 'CategoryBarList') return <CategoryBarList key={index} {...item.props} />
    if (item.type === 'DonutChart') return <DonutChart key={index} {...item.props} />
    if (item.type === 'StatusOverview') return <StatusOverview key={index} {...item.props} title={item.props.title ?? 'Status Overview'} />
    if (item.type === 'RecordsTable') return <RecordsTable key={index} {...item.props} />
    if (item.type === 'ComponentGroup') {
      const { title, icon, className: groupClass, children: childrenItems = [] } = item.props
      return (
        <div key={index} className={`bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] ${groupClass ?? ''} h-full`}>
          {title && (
            <div className="flex items-center gap-2 mb-4">
              {icon}
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {childrenItems.map((child, childIndex) => (
              <div key={childIndex} className="h-full">
                {child.before && (
                  <div className="mb-6">
                    {typeof child.before === 'string' ? <div className="text-sm font-medium text-[var(--text-muted)]">{child.before}</div> : child.before}
                  </div>
                )}
                {renderComponent(child, childIndex)}
                {child.after && child.after}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`flex flex-col min-h-0 px-4 lg:px-6 pt-5 pb-24 ${className}`}>
      {/* Row items — 4-col grid (KPI-style) */}
      {rowItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          {rowItems.map((item, index) => (
            <div key={index} className="h-full">
              {renderComponent(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Normal groups — each group rendered in its own grid */}
      {sortedKeys.map((cols) => {
        const group = grouped.get(cols)!
        const isGrid = cols !== '__default__'

        return (
          <div key={cols} className={`${cols === '__default__' ? 'flex flex-col' : cols} gap-4 mb-6 flex-1 min-h-0`}>
            {group.map((item, index) => (
              <div key={index} className={isGrid ? 'flex-1 h-full' : 'h-full'}>
                {item.before && (
                  <div className="mb-6">
                    {typeof item.before === 'string' ? <div className="text-sm font-medium text-[var(--text-muted)]">{item.before}</div> : item.before}
                  </div>
                )}
                {renderComponent(item, index)}
                {item.after && item.after}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
