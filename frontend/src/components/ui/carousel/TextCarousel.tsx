// ──────────────────────────────────────────────
// TextCarousel — Animated text rotator
// ──────────────────────────────────────────────

interface TextCarouselProps {
  items: string[]
  currentIndex: number
}

export function TextCarousel({ items, currentIndex }: TextCarouselProps) {
  return (
    <div className="text-carousel">
      {items.map((text, i) => (
        <span
          key={i}
          className={`text-carousel-item ${i === currentIndex ? 'text-carousel-item--active' : ''}`}
        >
          {text}
        </span>
      ))}
    </div>
  )
}