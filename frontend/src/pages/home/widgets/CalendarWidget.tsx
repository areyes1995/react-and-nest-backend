import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { calendarApi } from '@services/educraft'
import type { AgendaItem } from '@services/types'
import { Card, CardHeader } from '@components/ui'
import { MonthGrid } from '@/features/common/MonthGrid'
import { EventDetailModal } from '@/features/common/EventDetailModal'
import { EVENT_TYPES } from '@lib/labels'
import { addDays, formatDate, formatTime, parseDay, toDay } from '@lib/format'

export function CalendarWidget({ today }: { today: string }) {
  const [month, setMonth] = useState(`${today.slice(0, 8)}01`)
  const [selected, setSelected] = useState(today)
  const [items, setItems] = useState<AgendaItem[]>([])
  const [active, setActive] = useState<AgendaItem | null>(null)

  const load = () => {
    const first = parseDay(month)
    const from = toDay(new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7)))
    calendarApi.agenda(from, addDays(from, 41)).then(setItems).catch(() => setItems([]))
  }
  useEffect(load, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  const marks = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const i of items) {
      if (i.source === 'class') continue
      ;(map[i.date] ??= []).push(i.color ?? EVENT_TYPES[i.type].color)
    }
    return map
  }, [items])
  const dayItems = items.filter((i) => i.date === selected)

  return (
    <Card className="card-pad">
      <CardHeader title="Calendario académico" action={<Link to="/app/calendario" className="btn btn-secondary btn-sm">Ver calendario</Link>} />
      <MonthGrid month={month} onMonth={setMonth} selected={selected} onSelect={setSelected} marks={marks} compact today={today} />
      <div className="mt-3 border-t border-line pt-3">
        <p className="mb-2 text-xs font-bold capitalize text-brand-pink">{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {dayItems.length === 0 && <li className="text-xs text-ink-3">Sin actividades para este día.</li>}
          {dayItems.map((i) => (
            <li key={i.key}>
              <button onClick={() => setActive(i)} className="flex w-full items-start gap-2 rounded-lg py-0.5 text-left hover:bg-surface-2">
                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: i.color ?? EVENT_TYPES[i.type].color }} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-ink">{i.title}</span>
                  <span className="block truncate text-[0.68rem] text-ink-3">
                    {i.startTime ? `${formatTime(i.startTime)}${i.endTime ? ` - ${formatTime(i.endTime)}` : ''}` : EVENT_TYPES[i.type].label}
                    {i.description ? ` · ${i.description}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link to="/app/calendario" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-purple hover:underline">
          Ver agenda completa <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <EventDetailModal item={active} onClose={() => setActive(null)} onChanged={load} />
    </Card>
  )
}
