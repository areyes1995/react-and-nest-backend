export interface CardSkeletonProps {
  count?: number
}

export default function CardSkeleton({ count = 1 }: CardSkeletonProps) {
  return (
    <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-[var(--border)] rounded w-1/2" />
          <div className="h-3 bg-[var(--border)] rounded w-3/4" />
          <div className="h-3 bg-[var(--border)] rounded w-2/3" />
          <div className="h-3 bg-[var(--border)] rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}
