import { Activity } from 'lucide-react'
import type { AreaDataPoint } from './types'

interface AreaChartCardProps {
  data: AreaDataPoint[]
  title: string
}

export default function AreaChartCard({ data, title }: AreaChartCardProps) {
  if (data.length < 2) return null

  const width = 800
  const height = 250
  const padding = 25
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const maxVal = Math.max(...data.map(d => d.unique))
  const stepX = chartWidth / (data.length - 1)

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = padding + chartHeight - (d.unique / maxVal) * chartHeight
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding + chartHeight} L${points[0].x},${padding + chartHeight} Z`

  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[var(--text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <svg className="w-full h-64" viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} stroke="#3b82f6" strokeWidth="2" fill="none" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
        ))}
      </svg>
    </div>
  )
}
