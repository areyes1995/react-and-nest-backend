import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarArrowDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { calendarApi, type EventInput } from '@services/educraft'
import type { AgendaItem, CalendarEventType } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useSections } from '@hooks/useCatalog'
import { Button, Card, Checkbox, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea } from '@components/ui'
import { EventDetailModal } from '@/features/common/EventDetailModal'
import { exportIcs } from '@lib/exporters'
import { EVENT_TYPES } from '@lib/labels'
import { MONTHS, WEEKDAYS, addDays, formatDate, formatTime, parseDay, sectionLabel, toDay, today } from '@lib/format'
import { cn } from '@lib/cn'

type View = 'mes' | 'semana' | 'agenda'

const mondayOf = (day: string) => addDays(day, -((parseDay(day).getDay() + 6) % 7))

export default function CalendarPage() {
  const [params] = useSearchParams()
  const { sections } = useSections()
  const { success, error } = useFeedback()
  const [view, setView] = useState<View>((params.get('vista') as View) || 'mes')
  const [ref, setRef] = useState(today())
  const [items, setItems] = useState<AgendaItem[] | null>(null)
  const [hidden, setHidden] = useState<CalendarEventType[]>([])
  const [showClasses, setShowClasses] = useState(view === 'semana')
  const [active, setActive] = useState<AgendaItem | null>(null)
  const [creating, setCreating] = useState<(EventInput & { date: string; start: string; end: string }) | null>(null)

  const range = useMemo(() => {
    if (view === 'semana') {
      const from = mondayOf(ref)
      return { from, to: addDays(from, 6) }
    }
    if (view === 'agenda') return { from: ref, to: addDays(ref, 30) }
    const first = `${ref.slice(0, 8)}01`
    const from = mondayOf(first)
    return { from, to: addDays(from, 41) }
  }, [view, ref])

  const load = () => {
    setItems(null)
    calendarApi
      .agenda(range.from, range.to, showClasses)
      .then(setItems)
      .catch((err) => {
        setItems([])
        error('No se pudo cargar la agenda', (err as Error).message)
      })
  }
  useEffect(load, [range.from, range.to, showClasses]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = (items ?? []).filter((i) => !hidden.includes(i.type))
  const on = (day: string) => visible.filter((i) => i.date === day)

  const shift = (dir: number) => {
    if (view === 'mes') {
      const d = parseDay(ref)
      setRef(toDay(new Date(d.getFullYear(), d.getMonth() + dir, 1)))
    } else setRef(addDays(ref, dir * (view === 'semana' ? 7 : 30)))
  }

  const openNew = (date = today()) => setCreating({ type: 'REMINDER', title: '', startAt: '', date, start: '08:00', end: '09:00', allDay: true })

  const save = async () => {
    if (!creating || !creating.title.trim()) return
    const startAt = creating.allDay ? `${creating.date}T00:00:00.000Z` : new Date(`${creating.date}T${creating.start}:00`).toISOString()
    const endAt = creating.allDay ? undefined : new Date(`${creating.date}T${creating.end}:00`).toISOString()
    try {
      await calendarApi.create({ type: creating.type, title: creating.title, description: creating.description || undefined, startAt, endAt, allDay: creating.allDay, sectionId: creating.sectionId || undefined })
      success('Evento agregado')
      setCreating(null)
      load()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const exportRange = async () => {
    const first = parseDay(ref)
    const from = toDay(new Date(first.getFullYear(), first.getMonth(), 1))
    const to = toDay(new Date(first.getFullYear(), first.getMonth() + 3, 0))
    const all = await calendarApi.agenda(from, to, true)
    exportIcs(
      all.map((i) => ({ uid: i.key, title: i.title, description: [EVENT_TYPES[i.type].label, i.section ? sectionLabel(i.section.grade, i.section.name) : '', i.description ?? ''].filter(Boolean).join(' · '), date: i.date, startTime: i.startTime, endTime: i.endTime })),
      `agenda-educraft-${from}`,
    )
    success('Agenda exportada', 'Importa el archivo .ics en Google Calendar, Outlook o tu teléfono (3 meses).')
  }

  const title =
    view === 'mes' ? `${MONTHS[parseDay(ref).getMonth()]} ${parseDay(ref).getFullYear()}` : view === 'semana' ? `Semana del ${formatDate(range.from, { day: 'numeric', month: 'long' })}` : `Desde ${formatDate(ref, { day: 'numeric', month: 'long' })}`

  const EventChip = ({ i }: { i: AgendaItem }) => (
    <button onClick={() => setActive(i)} className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[0.65rem] font-semibold text-white" style={{ background: i.color ?? EVENT_TYPES[i.type].color }} title={i.title}>
      {i.startTime && `${i.startTime} `}
      {i.title}
    </button>
  )

  return (
    <div>
      <PageHeader
        title="Calendario académico"
        subtitle="Clases, evaluaciones, reuniones, entregas, fechas institucionales y cívicas, vacaciones y recordatorios"
        actions={
          <>
            <Button variant="secondary" icon={<CalendarArrowDown className="h-4 w-4" />} onClick={exportRange}>
              Exportar .ics
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => openNew()}>
              Nuevo evento
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          value={view}
          onChange={(v) => {
            setView(v)
            if (v === 'semana') setShowClasses(true)
          }}
          items={[
            { key: 'mes', label: 'Mes' },
            { key: 'semana', label: 'Semana' },
            { key: 'agenda', label: 'Agenda' },
          ]}
        />
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[12rem] text-center text-sm font-bold text-ink">{title}</span>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button size="sm" variant="ghost" onClick={() => setRef(today())}>
            Hoy
          </Button>
        </div>
        <Checkbox checked={showClasses} onChange={setShowClasses} label="Mostrar clases del horario" className="ml-2" />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(EVENT_TYPES) as CalendarEventType[]).map((t) => (
          <button key={t} onClick={() => setHidden((h) => (h.includes(t) ? h.filter((x) => x !== t) : [...h, t]))} className={cn('chip', hidden.includes(t) && 'opacity-40')}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: EVENT_TYPES[t].color }} /> {EVENT_TYPES[t].label}
          </button>
        ))}
      </div>

      {!items ? (
        <Spinner />
      ) : view === 'mes' ? (
        <Card className="overflow-hidden p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <p key={d} className="text-center text-[0.68rem] font-bold uppercase text-ink-3">
                {d.slice(0, 3)}
              </p>
            ))}
            {Array.from({ length: 42 }, (_, i) => addDays(range.from, i)).map((day) => (
              <div key={day} onDoubleClick={() => openNew(day)} className={cn('min-h-28 rounded-xl p-1.5', day.slice(0, 7) !== ref.slice(0, 7) ? 'bg-surface-2 opacity-50' : 'bg-surface-2')}>
                <p className={cn('mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold', day === today() ? 'bg-brand-pink text-white' : 'text-ink-3')}>{parseDay(day).getDate()}</p>
                <div className="space-y-0.5">
                  {on(day)
                    .slice(0, 4)
                    .map((i) => (
                      <EventChip key={i.key} i={i} />
                    ))}
                  {on(day).length > 4 && <p className="text-[0.62rem] text-ink-3">+{on(day).length - 4} más</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[0.68rem] text-ink-3">Doble clic en un día para crear un evento.</p>
        </Card>
      ) : view === 'semana' ? (
        <div className="grid gap-2 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(range.from, i)).map((day, i) => (
            <Card key={day} className={cn('min-h-80 p-3', day === today() && 'ring-2 ring-brand-pink')}>
              <p className={cn('text-sm font-extrabold', day === today() ? 'text-brand-pink' : 'text-ink')}>
                {WEEKDAYS[i]} <span className="text-ink-3">{parseDay(day).getDate()}</span>
              </p>
              <div className="mt-2 space-y-1.5">
                {on(day).map((it) => (
                  <button key={it.key} onClick={() => setActive(it)} className="block w-full rounded-xl border border-line p-2 text-left" style={{ borderLeft: `4px solid ${it.color ?? EVENT_TYPES[it.type].color}` }}>
                    <p className="text-[0.68rem] text-ink-3">{it.startTime ? `${formatTime(it.startTime)}${it.endTime ? ` - ${formatTime(it.endTime)}` : ''}` : EVENT_TYPES[it.type].label}</p>
                    <p className="text-xs font-bold text-ink">{it.title}</p>
                    {it.description && <p className="truncate text-[0.68rem] text-ink-3">{it.description}</p>}
                  </button>
                ))}
                {!on(day).length && <p className="text-xs text-ink-3">Libre</p>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-pad">
          {!visible.length ? (
            <EmptyState title="Sin eventos en los próximos 30 días" />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {visible.map((i) => (
                <li key={i.key}>
                  <button onClick={() => setActive(i)} className="flex w-full items-center gap-4 py-3 text-left">
                    <div className="w-20 shrink-0 text-center">
                      <p className="text-xs font-bold uppercase text-brand-pink">{formatDate(i.date, { weekday: 'short' })}</p>
                      <p className="text-2xl font-extrabold text-ink">{parseDay(i.date).getDate()}</p>
                    </div>
                    <span className="h-10 w-1 rounded-full" style={{ background: i.color ?? EVENT_TYPES[i.type].color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{i.title}</p>
                      <p className="text-xs text-ink-3">
                        {EVENT_TYPES[i.type].label}
                        {i.startTime && ` · ${formatTime(i.startTime)}`}
                        {i.section && ` · ${sectionLabel(i.section.grade, i.section.name)}`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <EventDetailModal item={active} onClose={() => setActive(null)} onChanged={load} />
      <Modal
        open={!!creating}
        onClose={() => setCreating(null)}
        title="Nuevo evento"
        footer={
          <Button onClick={save} disabled={!creating?.title.trim()}>
            Guardar
          </Button>
        }
      >
        {creating && (
          <div className="space-y-3">
            <Field label="Título">
              <Input value={creating.title} onChange={(e) => setCreating({ ...creating, title: e.target.value })} autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select value={creating.type} onChange={(e) => setCreating({ ...creating, type: e.target.value as CalendarEventType })} options={(Object.keys(EVENT_TYPES) as CalendarEventType[]).filter((t) => t !== 'CLASS' && t !== 'HOLIDAY').map((t) => ({ value: t, label: EVENT_TYPES[t].label }))} />
              </Field>
              <Field label="Fecha">
                <Input type="date" value={creating.date} onChange={(e) => setCreating({ ...creating, date: e.target.value })} />
              </Field>
            </div>
            <Checkbox checked={!!creating.allDay} onChange={(v) => setCreating({ ...creating, allDay: v })} label="Todo el día" />
            {!creating.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Inicio">
                  <Input type="time" value={creating.start} onChange={(e) => setCreating({ ...creating, start: e.target.value })} />
                </Field>
                <Field label="Fin">
                  <Input type="time" value={creating.end} onChange={(e) => setCreating({ ...creating, end: e.target.value })} />
                </Field>
              </div>
            )}
            <Field label="Sección (opcional)">
              <Select value={creating.sectionId ?? ''} onChange={(e) => setCreating({ ...creating, sectionId: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} />
            </Field>
            <Field label="Descripción">
              <Textarea value={creating.description ?? ''} onChange={(e) => setCreating({ ...creating, description: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
