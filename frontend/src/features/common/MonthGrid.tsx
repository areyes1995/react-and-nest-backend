import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS, WEEKDAYS_SHORT, parseDay, toDay } from '@lib/format'
import { cn } from '@lib/cn'

/** Cuadrícula mensual (lunes a domingo) con marcas de eventos por día. */
export function MonthGrid({
  month,
  onMonth,
  selected,
  onSelect,
  marks,
  compact,
  today,
}: {
  month: string // YYYY-MM-01
  onMonth: (month: string) => void
  selected: string
  onSelect: (day: string) => void
  marks?: Record<string, string[]> // día → colores
  compact?: boolean
  today: string
}) {
  const first = parseDay(month)
  const year = first.getFullYear()
  const m = first.getMonth()
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, m, 1 - offset)
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  const shift = (n: number) => onMonth(toDay(new Date(year, m + n, 1)))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button className="icon-btn h-7 w-7" onClick={() => shift(-1)} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-ink">
          {MONTHS[m]} {year}
        </p>
        <button className="icon-btn h-7 w-7" onClick={() => shift(1)} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="text-[0.65rem] font-semibold text-ink-3">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const key = toDay(d)
          const inMonth = d.getMonth() === m
          const isSelected = key === selected
          const isToday = key === today
          const dots = marks?.[key] ?? []
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                'relative mx-auto grid place-items-center rounded-full text-xs font-semibold transition',
                compact ? 'h-7 w-7' : 'h-9 w-9',
                isSelected ? 'bg-brand-pink text-white shadow' : isToday ? 'bg-soft-pink text-brand-pink' : inMonth ? 'text-ink hover:bg-surface-3' : 'text-ink-3 opacity-50',
              )}
            >
              {d.getDate()}
              {!!dots.length && !isSelected && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {dots.slice(0, 3).map((c, i) => (
                    <span key={i} className="h-1 w-1 rounded-full" style={{ background: c }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
