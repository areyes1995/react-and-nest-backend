import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus, ChevronLeft, ChevronRight, GripVertical, Plus, Sparkles } from 'lucide-react'
import { planningApi, schoolYearApi } from '@services/educraft'
import type { LearningUnit, LessonPlan, SchoolYear, Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, Card, CardHeader, EmptyState, Select, Spinner, Tabs } from '@components/ui'
import { CurriculumPicker, type CurriculumSelection } from '@/features/planning/CurriculumPicker'
import { PLAN_STATUS, UNIT_KINDS } from '@lib/labels'
import { MONTHS, WEEKDAYS, addDays, formatDate, parseDay, sectionLabel, toDay, today } from '@lib/format'
import { cn } from '@lib/cn'

type View = 'anual' | 'periodo' | 'mensual' | 'semanal' | 'diaria'

const PLAN_MIME = 'application/x-plan'
const UNIT_MIME = 'application/x-unit'
const CURR_MIME = 'application/x-curriculum'

const mondayOf = (day: string) => {
  const d = parseDay(day)
  return addDays(day, -((d.getDay() + 6) % 7))
}

export function PlannerTab({ sections, initialView }: { sections: Section[]; initialView?: string | null }) {
  const navigate = useNavigate()
  const { success, error, confirm } = useFeedback()
  const [year, setYear] = useState<SchoolYear | null | undefined>(undefined)
  const [units, setUnits] = useState<LearningUnit[]>([])
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [view, setView] = useState<View>(initialView === 'periodo' ? 'periodo' : (initialView as View) || 'periodo')
  const [period, setPeriod] = useState(1)
  const [ref, setRef] = useState(today())
  const [gradeFilter, setGradeFilter] = useState<number | ''>('')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [selection, setSelection] = useState<CurriculumSelection>({ specificCompetenceIds: [], indicatorIds: [], contentIds: [] })

  const load = async () => {
    try {
      const years = await schoolYearApi.list()
      const active = years.find((y) => y.isActive) ?? years[0]
      if (!active) {
        setYear(null)
        return
      }
      const [detail, u, p] = await Promise.all([
        schoolYearApi.get(active.id),
        planningApi.units(),
        planningApi.plans({ from: active.startDate.slice(0, 10), to: active.endDate.slice(0, 10) }),
      ])
      setYear(detail)
      setUnits(u)
      setPlans(p)
      const t = today()
      const current = detail.periods.find((x) => x.startDate.slice(0, 10) <= t && x.endDate.slice(0, 10) >= t)
      if (current) setPeriod(current.number)
    } catch (err) {
      error('No se pudo cargar el planificador', (err as Error).message)
    }
  }
  useEffect(() => {
    void load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const gradeOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of sections) map.set(s.gradeId, s.grade.name)
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [sections])
  const gradeId = gradeFilter || gradeOptions[0]?.value || null

  const colorFor = (p: LessonPlan) => p.section?.color ?? sections.find((s) => s.gradeId === p.gradeId)?.color ?? '#8b5cf6'
  const visiblePlans = plans.filter((p) => !gradeFilter || p.gradeId === gradeFilter)
  const visibleUnits = units.filter((u) => !gradeFilter || u.gradeId === gradeFilter)
  const plansOn = (day: string) => visiblePlans.filter((p) => p.date?.slice(0, 10) === day)

  // ── Acciones de arrastre ─────────────────────────
  const movePlan = async (planId: number, day: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan || plan.date?.slice(0, 10) === day) return
    setPlans((list) => list.map((p) => (p.id === planId ? { ...p, date: day } : p)))
    try {
      await planningApi.updatePlan(planId, { date: day })
      success('Sesión reprogramada', formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }))
    } catch (err) {
      error('No se pudo mover', (err as Error).message)
      void load()
    }
  }

  const moveUnitToPeriod = async (unitId: number, number: number) => {
    const p = year?.periods.find((x) => x.number === number)
    if (!p) return
    const startDate = p.startDate.slice(0, 10)
    const endDate = p.endDate.slice(0, 10)
    setUnits((list) => list.map((u) => (u.id === unitId ? { ...u, startDate, endDate } : u)))
    await planningApi.updateUnit(unitId, { startDate, endDate }).catch((err) => error('No se pudo mover', (err as Error).message))
  }

  const addCurriculum = async (target: { kind: 'unit' | 'plan'; id: number }, raw: string) => {
    const item = JSON.parse(raw) as { kind: 'competence' | 'indicator' | 'content'; id: number; text: string }
    const key = item.kind === 'competence' ? 'specificCompetenceIds' : item.kind === 'indicator' ? 'indicatorIds' : 'contentIds'
    if (target.kind === 'unit') {
      const unit = units.find((u) => u.id === target.id)
      if (!unit || unit[key].includes(item.id)) return
      const next = [...unit[key], item.id]
      setUnits((list) => list.map((u) => (u.id === unit.id ? { ...u, [key]: next } : u)))
      await planningApi.updateUnit(unit.id, { [key]: next })
    } else {
      const plan = plans.find((p) => p.id === target.id)
      if (!plan) return
      const current = plan[key] ?? []
      if (current.includes(item.id)) return
      const next = [...current, item.id]
      setPlans((list) => list.map((p) => (p.id === plan.id ? { ...p, [key]: next } : p)))
      await planningApi.updatePlan(plan.id, { [key]: next })
    }
    success('Agregado a la planificación', item.text.slice(0, 80))
  }

  const dropZone = (key: string, onDrop: (e: React.DragEvent) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(key)
    },
    onDragLeave: () => setDragOver((k) => (k === key ? null : k)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(null)
      onDrop(e)
    },
  })

  const dayDrop = (day: string) =>
    dropZone(`day-${day}`, (e) => {
      const id = e.dataTransfer.getData(PLAN_MIME)
      if (id) void movePlan(Number(id), day)
    })

  // ── Distribución automática ──────────────────────
  const distribute = async () => {
    if (!year?.calendar || !gradeId) return
    const list = units.filter((u) => u.gradeId === gradeId).sort((a, b) => a.order - b.order || a.id - b.id)
    if (!list.length) return error('Sin unidades', 'Crea o genera la programación del grado primero.')
    const ok = await confirm({
      title: 'Distribuir contenidos automáticamente',
      description: `Se repartirán ${list.length} unidad(es) de forma equilibrada en las semanas lectivas disponibles (sin feriados), según la cantidad de contenidos de cada una.`,
      confirmLabel: 'Distribuir',
    })
    if (!ok) return
    const weeks = year.calendar.filter((w) => w.teachingDays > 0)
    const weights = list.map((u) => Math.max(1, u.contentIds.length))
    const total = weights.reduce((a, b) => a + b, 0)
    let cursor = 0
    try {
      for (let i = 0; i < list.length; i++) {
        const span = i === list.length - 1 ? weeks.length - cursor : Math.max(1, Math.round((weights[i] / total) * weeks.length))
        const first = weeks[Math.min(cursor, weeks.length - 1)]
        const last = weeks[Math.min(cursor + span - 1, weeks.length - 1)]
        await planningApi.updateUnit(list[i].id, { startDate: first.start, endDate: last.end, order: i + 1 })
        cursor += span
      }
      success('Distribución aplicada', `${list.length} unidades en ${weeks.length} semanas lectivas`)
      void load()
    } catch (err) {
      error('No se pudo distribuir', (err as Error).message)
    }
  }

  if (year === undefined) return <Spinner />
  if (year === null)
    return (
      <Card className="card-pad">
        <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="Crea tu año escolar" description="Define semanas lectivas, periodos y feriados para usar el planificador." action={<Link to="/app/ajustes?tab=anio&nuevo=1" className="btn btn-primary btn-sm">Crear año escolar</Link>} />
      </Card>
    )

  const PlanCard = ({ plan, compact }: { plan: LessonPlan; compact?: boolean }) => (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData(PLAN_MIME, String(plan.id))}
      {...dropZone(`plan-${plan.id}`, (e) => {
        const raw = e.dataTransfer.getData(CURR_MIME)
        if (raw) {
          e.stopPropagation()
          void addCurriculum({ kind: 'plan', id: plan.id }, raw)
        }
      })}
      onClick={() => navigate(`/app/planificacion/planes/${plan.id}`)}
      className={cn(
        'group flex cursor-grab items-start gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 text-left shadow-sm transition hover:shadow active:cursor-grabbing',
        dragOver === `plan-${plan.id}` && 'ring-2 ring-brand-pink',
      )}
      style={{ borderLeft: `4px solid ${colorFor(plan)}` }}
    >
      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3 opacity-0 group-hover:opacity-100" />
      <div className="min-w-0">
        <p className={cn('truncate font-semibold text-ink', compact ? 'text-[0.68rem]' : 'text-xs')}>{plan.title}</p>
        {!compact && (
          <p className="truncate text-[0.65rem] text-ink-3">
            {plan.section ? sectionLabel(plan.grade.name, plan.section.name) : plan.grade.name} · {PLAN_STATUS[plan.status].label}
          </p>
        )}
      </div>
    </div>
  )

  const periodWeeks = (year.calendar ?? []).filter((w) => w.period === period)
  const monthStart = `${ref.slice(0, 8)}01`
  const weekStart = mondayOf(ref)

  return (
    <div className="grid gap-4 xl:grid-cols-[19rem_1fr]">
      <Card className="card-pad h-fit xl:sticky xl:top-0">
        <CardHeader title="Adecuación curricular" subtitle="Arrastra competencias, indicadores y contenidos a unidades o sesiones" />
        <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : '')} placeholder="Todos los grados" options={gradeOptions} className="mb-3" />
        <CurriculumPicker gradeId={gradeId} value={selection} onChange={setSelection} compact />
      </Card>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={view}
            onChange={setView}
            items={[
              { key: 'anual', label: 'Anual' },
              { key: 'periodo', label: 'Por periodo' },
              { key: 'mensual', label: 'Mensual' },
              { key: 'semanal', label: 'Semanal' },
              { key: 'diaria', label: 'Diaria' },
            ]}
          />
          {view === 'periodo' && (
            <Select value={period} onChange={(e) => setPeriod(Number(e.target.value))} options={year.periods.map((p) => ({ value: p.number, label: p.name }))} className="w-auto" />
          )}
          {(view === 'mensual' || view === 'semanal' || view === 'diaria') && (
            <div className="flex items-center gap-1">
              <button className="icon-btn" onClick={() => setRef(view === 'mensual' ? toDay(new Date(parseDay(ref).getFullYear(), parseDay(ref).getMonth() - 1, 1)) : addDays(ref, view === 'semanal' ? -7 : -1))} aria-label="Anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[9rem] text-center text-sm font-bold text-ink">
                {view === 'mensual' ? `${MONTHS[parseDay(ref).getMonth()]} ${parseDay(ref).getFullYear()}` : view === 'semanal' ? `Semana del ${formatDate(weekStart, { day: 'numeric', month: 'short' })}` : formatDate(ref, { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button className="icon-btn" onClick={() => setRef(view === 'mensual' ? toDay(new Date(parseDay(ref).getFullYear(), parseDay(ref).getMonth() + 1, 1)) : addDays(ref, view === 'semanal' ? 7 : 1))} aria-label="Siguiente">
                <ChevronRight className="h-4 w-4" />
              </button>
              <Button size="sm" variant="ghost" onClick={() => setRef(today())}>
                Hoy
              </Button>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="soft" size="sm" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={distribute}>
              Distribuir con IA
            </Button>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/app/planificacion/planes/nuevo')}>
              Nueva sesión
            </Button>
          </div>
        </div>

        {view === 'anual' && (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {year.periods.map((p) => {
              const start = p.startDate.slice(0, 10)
              const end = p.endDate.slice(0, 10)
              const inPeriod = visibleUnits.filter((u) => u.startDate && u.startDate.slice(0, 10) <= end && (u.endDate ?? u.startDate).slice(0, 10) >= start)
              const count = visiblePlans.filter((pl) => pl.date && pl.date.slice(0, 10) >= start && pl.date.slice(0, 10) <= end).length
              return (
                <div
                  key={p.number}
                  {...dropZone(`period-${p.number}`, (e) => {
                    const id = e.dataTransfer.getData(UNIT_MIME)
                    if (id) void moveUnitToPeriod(Number(id), p.number)
                  })}
                  className={cn('card card-pad min-h-64 transition', dragOver === `period-${p.number}` && 'ring-2 ring-brand-pink')}
                >
                  <p className="text-sm font-extrabold text-ink">{p.name}</p>
                  <p className="mb-3 text-xs text-ink-3">
                    {formatDate(start, { day: 'numeric', month: 'short' })} – {formatDate(end, { day: 'numeric', month: 'short' })} · {count} sesiones
                  </p>
                  <div className="space-y-2">
                    {inPeriod.map((u) => (
                      <UnitChip key={u.id} unit={u} dragOver={dragOver} dropZone={dropZone} onCurriculum={(raw) => addCurriculum({ kind: 'unit', id: u.id }, raw)} />
                    ))}
                    {!inPeriod.length && <p className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-3">Arrastra unidades aquí</p>}
                  </div>
                </div>
              )
            })}
            {visibleUnits.some((u) => !u.startDate) && (
              <div className="card card-pad md:col-span-2 2xl:col-span-4">
                <p className="mb-2 text-sm font-bold text-ink">Unidades sin fecha</p>
                <div className="flex flex-wrap gap-2">
                  {visibleUnits
                    .filter((u) => !u.startDate)
                    .map((u) => (
                      <UnitChip key={u.id} unit={u} dragOver={dragOver} dropZone={dropZone} onCurriculum={(raw) => addCurriculum({ kind: 'unit', id: u.id }, raw)} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'periodo' && (
          <div className="card overflow-hidden">
            {periodWeeks.map((w) => (
              <div key={w.week} className="grid grid-cols-[7rem_1fr] border-b border-line last:border-0">
                <div className="bg-surface-2 p-3">
                  <p className="text-xs font-extrabold text-ink">Semana {w.week}</p>
                  <p className="text-[0.65rem] text-ink-3">
                    {formatDate(w.start, { day: 'numeric', month: 'short' })} – {formatDate(w.end, { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="mt-1 text-[0.65rem] font-semibold text-emerald-600">{w.teachingDays} días lectivos</p>
                  {w.holidays.map((h) => (
                    <Badge key={h} tone="red" className="mt-1">
                      {h}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1.5 p-2">
                  {[0, 1, 2, 3, 4].map((d) => {
                    const day = addDays(w.start, d)
                    return (
                      <div key={day} {...dayDrop(day)} className={cn('min-h-16 rounded-xl p-1.5 transition', dragOver === `day-${day}` ? 'bg-soft-pink' : 'bg-surface-2 hover:bg-surface-3')}>
                        <p className={cn('mb-1 text-[0.62rem] font-bold', day === today() ? 'text-brand-pink' : 'text-ink-3')}>
                          {WEEKDAYS[d].slice(0, 3)} {parseDay(day).getDate()}
                        </p>
                        <div className="space-y-1">
                          {plansOn(day).map((p) => (
                            <PlanCard key={p.id} plan={p} compact />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {!periodWeeks.length && <p className="p-6 text-center text-sm text-ink-3">Este periodo no tiene semanas registradas.</p>}
          </div>
        )}

        {view === 'mensual' && (
          <div className="card overflow-hidden p-3">
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <p key={d} className="text-center text-[0.68rem] font-bold uppercase text-ink-3">
                  {d.slice(0, 3)}
                </p>
              ))}
              {Array.from({ length: 42 }, (_, i) => addDays(mondayOf(monthStart), i)).map((day) => (
                <div key={day} {...dayDrop(day)} className={cn('min-h-24 rounded-xl p-1.5 transition', day.slice(0, 7) !== monthStart.slice(0, 7) && 'opacity-40', dragOver === `day-${day}` ? 'bg-soft-pink' : 'bg-surface-2')}>
                  <p className={cn('text-[0.68rem] font-bold', day === today() ? 'text-brand-pink' : 'text-ink-3')}>{parseDay(day).getDate()}</p>
                  <div className="mt-1 space-y-1">
                    {plansOn(day).map((p) => (
                      <PlanCard key={p.id} plan={p} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'semanal' && (
          <div className="grid gap-2 md:grid-cols-5">
            {[0, 1, 2, 3, 4].map((d) => {
              const day = addDays(weekStart, d)
              const slots = sections.flatMap((s) => s.schedules.filter((x) => x.weekday === d + 1).map((x) => ({ section: s, slot: x })))
              return (
                <div key={day} {...dayDrop(day)} className={cn('card min-h-72 p-3 transition', dragOver === `day-${day}` && 'ring-2 ring-brand-pink')}>
                  <p className={cn('text-sm font-extrabold', day === today() ? 'text-brand-pink' : 'text-ink')}>
                    {WEEKDAYS[d]} {parseDay(day).getDate()}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {slots.map(({ section, slot }) => (
                      <p key={`${section.id}-${slot.startTime}`} className="rounded-lg px-2 py-1 text-[0.65rem] font-semibold text-white" style={{ background: section.color }}>
                        {slot.startTime} · {sectionLabel(section.grade.name, section.name)}
                      </p>
                    ))}
                    {plansOn(day).map((p) => (
                      <PlanCard key={p.id} plan={p} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view === 'diaria' && (
          <Card className="card-pad">
            <CardHeader title={formatDate(ref, { weekday: 'long', day: 'numeric', month: 'long' })} />
            <div className="space-y-2">
              {plansOn(ref).map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
              {!plansOn(ref).length && <EmptyState title="Sin sesiones planificadas" action={<Button size="sm" onClick={() => navigate('/app/planificacion/planes/nuevo', { state: { draftDate: ref } })}>Planificar este día</Button>} />}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function UnitChip({
  unit,
  dragOver,
  dropZone,
  onCurriculum,
}: {
  unit: LearningUnit
  dragOver: string | null
  dropZone: (key: string, onDrop: (e: React.DragEvent) => void) => Record<string, unknown>
  onCurriculum: (raw: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData(UNIT_MIME, String(unit.id))}
      {...dropZone(`unit-${unit.id}`, (e) => {
        const raw = e.dataTransfer.getData(CURR_MIME)
        if (raw) {
          e.stopPropagation()
          onCurriculum(raw)
        }
      })}
      className={cn('cursor-grab rounded-2xl border border-line bg-surface-2 p-2.5 active:cursor-grabbing', dragOver === `unit-${unit.id}` && 'ring-2 ring-brand-pink')}
      style={{ borderLeft: `4px solid ${unit.color ?? '#a855f7'}` }}
    >
      <p className="text-xs font-bold text-ink">{unit.title}</p>
      <p className="text-[0.65rem] text-ink-3">
        {UNIT_KINDS[unit.kind]} · {unit.specificCompetenceIds.length} comp. · {unit.indicatorIds.length} ind. · {unit.contentIds.length} cont.
      </p>
      {unit.startDate && (
        <p className="text-[0.65rem] text-ink-3">
          {formatDate(unit.startDate, { day: 'numeric', month: 'short' })} – {formatDate(unit.endDate ?? unit.startDate, { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
  )
}
