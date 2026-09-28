interface SkeletonGridProps {
  count: number
  cardHeight?: string
}

export default function SkeletonGrid({ count, cardHeight = 'h-24' }: SkeletonGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-${Math.min(count, 5)} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-[var(--bg-surface-soft)] ${cardHeight}`} />
      ))}
    </div>
  )
}
