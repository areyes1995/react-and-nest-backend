import { Star as StarIcon } from 'lucide-react'

interface StarRatingProps {
  value: number
  size?: number
}

export default function StarRating({ value, size = 4 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`w-${size} h-${size} ${
            i < Math.floor(value)
              ? 'text-amber-400 fill-amber-400'
              : i < value
                ? 'text-amber-400 opacity-50'
                : 'text-[var(--text-muted)]'
          }`}
        />
      ))}
    </div>
  )
}
