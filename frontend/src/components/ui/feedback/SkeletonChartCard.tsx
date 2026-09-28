interface SkeletonChartCardProps {
  height?: number
}

export default function SkeletonChartCard({ height = 320 }: SkeletonChartCardProps) {
  return (
    <div className="animate-pulse bg-[var(--bg-surface-soft)] rounded-xl p-5" style={{ minHeight: height }}>
      <div className="w-1/2 h-4 bg-[var(--bg-surface)] rounded mb-4 animate-pulse" />
      <div className="w-full h-[calc(100%-28px)] bg-[var(--bg-surface)] rounded animate-pulse" />
    </div>
  )
}
