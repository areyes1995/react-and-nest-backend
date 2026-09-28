import { TrendingUp } from 'lucide-react'
import type { BarDataPoint } from './types'

interface BarChartCardProps {
  data: BarDataPoint[]
  title: string
}

export default function BarChartCard({ data, title }: BarChartCardProps) {
  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 250" fill="none">
          {(() => {
            const maxVal = Math.max(...data.map(d => d.visitors))
            const barWidth = 60
            const gap = (800 - barWidth * data.length) / (data.length + 1)
            return data.map((d, i) => {
              const x = gap + i * (barWidth + gap)
              const height = (d.visitors / maxVal) * 200
              const y = 250 - height - 25
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barWidth} height={height} fill="#10b981" rx="4" />
                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="10">{d.visitors}</text>
                </g>
              )
            })
          })()}
        </svg>
      </div>
    </div>
  )
}
