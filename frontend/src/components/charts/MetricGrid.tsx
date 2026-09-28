import KpiCard, { type KpiCardProps } from './KpiCard'

interface MetricGridProps {
  metrics: KpiCardProps[]
}

export default function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {metrics.map((metric, i) => (
        <KpiCard key={i} {...metric} />
      ))}
    </div>
  )
}
