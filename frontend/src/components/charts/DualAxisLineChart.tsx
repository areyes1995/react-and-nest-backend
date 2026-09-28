// ──────────────────────────────────────────────
// DualAxisLineChart — reusable line chart with
// dual Y-axes (left: numeric, right: percentage)
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface ChartDataPoint {
  month: string
  left1: number
  left2: number
  right: number
}

export interface ChartSeries {
  name: string
  key: keyof ChartDataPoint
  yAxis?: 'left' | 'right'
  strokeColor?: string
  strokeWidth?: number
  strokeDasharray?: string
  dot?: boolean
}

export interface DualAxisLineChartProps {
  data: ChartDataPoint[]
  series: ChartSeries[]
  title?: string
  /** Aspect ratio — height relative to width, e.g. "600" */
  height?: number
  /** Tooltip formatter; overrides default numeric/% formatting */
  formatValue?: (key: string, value: number, payload?: Record<string, unknown>) => string
}

export default function DualAxisLineChart({
  data,
  series,
  title,
  height = 380,
  formatValue,
}: DualAxisLineChartProps) {
  const chartData = useMemo(() => {
    return data.map((row) => {
      const entry: Record<string, number | string> = { month: row.month }
      series.forEach((s) => {
        entry[s.key] = row[s.key as keyof ChartDataPoint] ?? 0
      })
      return entry
    })
  }, [data, series])

  const leftTicks = useMemo(() => {
    const values = series
      .filter((s) => s.yAxis === 'left')
      .flatMap((s) => data.map((d) => d[s.key] as number))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const step = range / 5
    return Array.from({ length: 6 }, (_, i) => Math.round(min + step * i))
  }, [data, series])

  const rightTicks = useMemo(() => {
    const values = series
      .filter((s) => s.yAxis === 'right')
      .flatMap((s) => data.map((d) => d[s.key] as number))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const step = range / 5
    return Array.from({ length: 6 }, (_, i) => Math.round(min + step * i))
  }, [data, series])

  const MyTooltip = ({ payload, label }: { payload?: Array<{ dataKey: string; value: number; type: string; color: string }>; label?: string }) => {
    if (!payload || !payload.length || !label) return null
    const d = data.find((row) => row.month === label)

    const items = payload.map((p) => {
      const ser = series.find((s) => s.key === p.dataKey)
      const val = Number((d as unknown as Record<string, unknown>)[p.dataKey] ?? 0)
      const formatted = formatValue
        ? formatValue(p.dataKey, val)
        : ser?.yAxis === 'right'
          ? `${Math.round(val * 100)}%`
          : val.toLocaleString()
      return {
        type: p.type,
        dataKey: p.dataKey,
        color: ser?.strokeColor || 'var(--text-muted)',
        label: ser?.name || p.dataKey,
        value: formatted,
        strokeWidth: ser?.strokeWidth || 2,
        strokeDasharray: ser?.strokeDasharray,
      }
    })

    return (
      <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{String(label)}</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: item.color,
                ...(item.strokeDasharray ? { backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0, ${item.color} 2px, transparent 2px, transparent 4px)` } : {}),
              }}
            />
            <span className="text-[var(--text-secondary)] w-28 truncate">{item.label}</span>
            <span className="text-[var(--text-primary)] font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] flex flex-col" style={{ height: `${height}px` }}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            fontSize="0.75rem"
            tickLine={false}
          />

          <YAxis
            yAxisId="left"
            orientation="left"
            tickFormatter={(v: number) => v.toLocaleString()}
            ticks={leftTicks}
            stroke="var(--text-muted)"
            fontSize="0.75rem"
            tickLine={false}
            width={60}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => `${Math.round(v)}%`}
            ticks={rightTicks}
            stroke="var(--text-muted)"
            fontSize="0.75rem"
            tickLine={false}
            width={40}
          />

          <Tooltip
            content={<MyTooltip />}
            wrapperStyle={{ fontSize: '0.75rem' }}
          />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
          />

          {series.map((s) => (
            <Line
              key={s.key}
              yAxisId={s.yAxis || 'left'}
              type="monotone"
              dataKey={s.key}
              stroke={s.strokeColor || '#6b7280'}
              strokeWidth={s.strokeWidth || 2}
              strokeDasharray={s.strokeDasharray}
              dot={s.dot !== false ? { r: 4 } : false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
