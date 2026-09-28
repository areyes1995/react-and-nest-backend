// ──────────────────────────────────────────────
// DonutChart — distribution donut chart with
// total in the center and a rich legend
// ──────────────────────────────────────────────

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export interface DonutDataPoint {
  name: string
  value: number
  color: string
}

export interface DonutChartProps {
  title: string
  total: number
  items: DonutDataPoint[]
  icon?: React.ReactNode
  className?: string
}

export default function DonutChart({ title, items, icon, total, className }: DonutChartProps) {
  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  const displayTotal = total > 0 ? total : totalValue

  const renderTooltip = (props: { payload?: Array<{ name: string; value: number }> }) => {
    const entry = props.payload?.[0]
    if (!entry) return null
    const data = items.find(i => i.name === entry.name)
    if (!data) return null
    const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0'
    return (
      <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-[var(--text-secondary)]">{data.name}</span>
          <span className="text-[var(--text-primary)] font-medium ml-auto">
            {data.value} ({percentage}%)
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] ${className} h-full`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>

      <div className="flex gap-2 items-center justify-center">
        <div className="relative shrink-0">
          <ResponsiveContainer width={300} height={200}>
            <PieChart>
              <Pie
                data={items}
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={300}
                startAngle={90}
                endAngle={-270}
              >
                {items.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={renderTooltip as any} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-primary)] leading-none">
              {displayTotal.toLocaleString('en-US')}
            </span>
            <span className="text-mini text-[var(--text-muted)] mt-0.5 uppercase tracking-wide">
              total
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2 w-40">
          {items.map((item) => {
            const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0'
            return (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                <span className="text-[var(--text-primary)] font-medium ml-auto">
                  {item.value} ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
