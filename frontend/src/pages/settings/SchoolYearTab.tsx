import { useEffect, useState } from 'react'
import { CalendarPlus, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react'
import { schoolYearApi, type SchoolYearInput } from '@services/educraft'
import type { SchoolYear } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, Modal, Select, Spinner } from '@components/ui'
import { addDays, formatDate, parseDay, toDay } from '@lib/format'

function defaultYear(): SchoolYearInput {
  const now = new Date()
  const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return {
    name: `${y}-${y + 1}`,
    startDate: `${y}-08-18`,
    endDate: `${y + 1}-06-19`,
    includeNationalHolidays: true,
    gradingScale: { type: 'NUMERIC_100', passing: 70 },
  }
}

function splitPeriods(start: string, end: string) {
  const s = parseDay(start).getTime()
  const e = parseDay(end).getTime()
  const size = Math.floor((e - s) / 86_400_000 / 4)
  return [1, 2, 3, 4].map((n) => ({
    number: n,
    name: `Periodo ${n}`,
    startDate: addDays(start, (n - 1) * size),
    endDate: n === 4 ? end : addDays(start, n * size - 1),
  }))
}

export function SchoolYearTab({ welcome, autoCreate }: { welcome?: boolean; autoCreate?: boolean }) {
  const { success, error, confirm } = useFeedback()
  const { data: years, loading, reload } = useAsync(() => schoolYearApi.list())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<SchoolYear | null>(null)
  const [creating, setCreating] = useState(!!autoCreate)
  const [form, setForm] = useState<SchoolYearInput>(defaultYear)
  const [periods, setPeriods] = useState(splitPeriods(form.startDate, form.endDate))
  const [holiday, setHoliday] = useState({ name: '', date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!years) return
    if (!years.length) setCreating(true)
    else if (!selectedId) setSelectedId((years.find((y) => y.isActive) ?? years[0]).id)
  }, [years, selectedId])

  useEffect(() => {
    if (selectedId) schoolYearApi.get(selectedId).then(setDetail).catch(() => setDetail(null))
  }, [selectedId])

  const create = async () => {
    setSaving(true)
    try {
      const year = await schoolYearApi.create({ ...form, periods })
      success('Año escolar creado', 'Ahora registra tus secciones y su horario.')
      setCreating(false)
      setSelectedId(year.id)
      await reload()
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const savePeriods = async () => {
    if (!detail) return
    try {
      const updated = await schoolYearApi.update(detail.id, {
        gradingScale: detail.gradingScale,
        teachingWeeks: detail.teachingWeeks ?? undefined,
        periods: detail.periods.map((p) => ({ number: p.number, name: p.name, startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10) })),
      })
      setDetail({ ...detail, ...updated })
      success('Año escolar actualizado')
      void schoolYearApi.get(detail.id).then(setDetail)
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const addHoliday = async () => {
    if (!detail || !holiday.name || !holiday.date) return
    try {
      await schoolYearApi.addHoliday(detail.id, holiday)
      setHoliday({ name: '', date: '' })
      setDetail(await schoolYearApi.get(detail.id))
    } catch (err) {
      error('No se pudo agregar', (err as Error).message)
    }
  }

  const removeHoliday = async (id: number) => {
    if (!detail) return
    await schoolYearApi.removeHoliday(id).catch(() => undefined)
    setDetail(await schoolYearApi.get(detail.id))
  }

  const activate = async (id: number) => {
    await schoolYearApi.update(id, { isActive: true })
    success('Año escolar activo actualizado')
    void reload()
  }

  const remove = async (y: SchoolYear) => {
    if (!(await confirm({ title: 'Eliminar año escolar', description: `Se ocultará “${y.name}” con sus secciones.`, danger: true, confirmLabel: 'Eliminar' }))) return
    await schoolYearApi.remove(y.id)
    setSelectedId(null)
    setDetail(null)
    void reload()
  }

  if (loading && !years) return <Spinner />

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <Card className="card-pad h-fit">
        <CardHeader title="Años escolares" action={<Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>Nuevo</Button>} />
        {years?.length ? (
          <ul className="space-y-1.5">
            {years.map((y) => (
              <li key={y.id}>
                <button onClick={() => setSelectedId(y.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${selectedId === y.id ? 'bg-soft-purple font-bold text-brand-purple' : 'hover:bg-surface-3'}`}>
                  <span>{y.name}</span>
                  {y.isActive && <Badge tone="green">Activo</Badge>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-3">Aún no tienes años escolares.</p>
        )}
      </Card>

      <div className="space-y-4">
        {welcome && !years?.length && (
          <div className="rounded-card bg-gradient-to-r from-pink-50 to-violet-50 p-4 text-sm text-ink-2 dark:from-pink-950/30 dark:to-violet-950/30">
            <b className="text-ink">¡Bienvenido a Educraft XYZ!</b> Empieza creando tu año escolar: definiremos las semanas lectivas, los 4 periodos y los feriados nacionales.
          </div>
        )}
        {!detail ? (
          <Card className="card-pad">
            <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="Crea tu año escolar" description="Semanas lectivas, periodos de evaluación, feriados y escala de calificación." action={<Button onClick={() => setCreating(true)}>Crear año escolar</Button>} />
          </Card>
        ) : (
          <>
            <Card className="card-pad">
              <CardHeader
                title={`Año escolar ${detail.name}`}
                subtitle={`${formatDate(detail.startDate)} — ${formatDate(detail.endDate)} · ${detail.teachingWeeks ?? '—'} semanas lectivas`}
                action={
                  <div className="flex gap-2">
                    {!detail.isActive && (
                      <Button size="sm" variant="soft" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => activate(detail.id)}>
                        Activar
                      </Button>
                    )}
                    <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => remove(detail)}>
                      Eliminar
                    </Button>
                  </div>
                }
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Escala de valoración">
                  <Select
                    value={detail.gradingScale.type}
                    onChange={(e) => setDetail({ ...detail, gradingScale: { ...detail.gradingScale, type: e.target.value } })}
                    options={[
                      { value: 'NUMERIC_100', label: 'Numérica 0 – 100' },
                      { value: 'NUMERIC_1_5', label: 'Numérica 1 – 5' },
                      { value: 'NUMERIC_1_4', label: 'Numérica 1 – 4' },
                      { value: 'LITERAL', label: 'Literal (AD, A, B, C)' },
                    ]}
                  />
                </Field>
                <Field label="Nota mínima de aprobación">
                  <Input type="number" min={0} max={100} value={detail.gradingScale.passing} onChange={(e) => setDetail({ ...detail, gradingScale: { ...detail.gradingScale, passing: Number(e.target.value) } })} />
                </Field>
                <Field label="Semanas lectivas">
                  <Input type="number" min={1} max={60} value={detail.teachingWeeks ?? ''} onChange={(e) => setDetail({ ...detail, teachingWeeks: Number(e.target.value) })} />
                </Field>
              </div>
              <p className="section-title mb-2 mt-5">Periodos de evaluación</p>
              <div className="grid gap-2 md:grid-cols-2">
                {detail.periods.map((p, i) => (
                  <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded-2xl border border-line p-3">
                    <Field label={`P${p.number}`}>
                      <Input value={p.name} onChange={(e) => setDetail({ ...detail, periods: detail.periods.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                    </Field>
                    <Field label="Inicio">
                      <Input type="date" value={p.startDate.slice(0, 10)} onChange={(e) => setDetail({ ...detail, periods: detail.periods.map((x, k) => (k === i ? { ...x, startDate: e.target.value } : x)) })} />
                    </Field>
                    <Field label="Fin">
                      <Input type="date" value={p.endDate.slice(0, 10)} onChange={(e) => setDetail({ ...detail, periods: detail.periods.map((x, k) => (k === i ? { ...x, endDate: e.target.value } : x)) })} />
                    </Field>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Button onClick={savePeriods} icon={<Save className="h-4 w-4" />}>
                  Guardar cambios
                </Button>
              </div>
            </Card>

            <Card className="card-pad">
              <CardHeader title="Feriados y días no lectivos" subtitle="La IA y el planificador los descuentan de las semanas lectivas." />
              <div className="mb-3 flex flex-wrap gap-2">
                <Input value={holiday.name} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} placeholder="Nombre" className="max-w-xs" />
                <Input type="date" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} className="w-auto" />
                <Button variant="soft" icon={<Plus className="h-4 w-4" />} onClick={addHoliday}>
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.holidays.map((h) => (
                  <span key={h.id} className="inline-flex items-center gap-2 rounded-full bg-soft-red px-3 py-1 text-xs font-semibold text-red-600">
                    {formatDate(h.date, { day: 'numeric', month: 'short' })} · {h.name}
                    <button onClick={() => removeHoliday(h.id)} aria-label="Quitar">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {!detail.holidays.length && <p className="text-xs text-ink-3">Sin feriados registrados.</p>}
              </div>
            </Card>
          </>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Crear año escolar"
        subtitle="Asistente: semanas lectivas, periodos y feriados"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={create} loading={saving}>
              Crear año escolar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Inicio de clases">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  setForm({ ...form, startDate: e.target.value })
                  setPeriods(splitPeriods(e.target.value, form.endDate))
                }}
              />
            </Field>
            <Field label="Fin de clases">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => {
                  setForm({ ...form, endDate: e.target.value })
                  setPeriods(splitPeriods(form.startDate, e.target.value))
                }}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nota mínima de aprobación">
              <Input type="number" value={form.gradingScale?.passing ?? 70} onChange={(e) => setForm({ ...form, gradingScale: { type: 'NUMERIC_100', passing: Number(e.target.value) } })} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox checked={form.includeNationalHolidays ?? true} onChange={(v) => setForm({ ...form, includeNationalHolidays: v })} label="Registrar los feriados nacionales de República Dominicana" />
            </div>
          </div>
          <div>
            <p className="label">Periodos (puedes ajustarlos)</p>
            <div className="space-y-2">
              {periods.map((p, i) => (
                <div key={p.number} className="grid grid-cols-[4rem_1fr_1fr] items-center gap-2">
                  <span className="text-sm font-bold text-brand-purple">P{p.number}</span>
                  <Input type="date" value={p.startDate} onChange={(e) => setPeriods(periods.map((x, k) => (k === i ? { ...x, startDate: e.target.value } : x)))} />
                  <Input type="date" value={p.endDate} onChange={(e) => setPeriods(periods.map((x, k) => (k === i ? { ...x, endDate: e.target.value } : x)))} />
                </div>
              ))}
            </div>
            <p className="hint">
              {Math.max(1, Math.ceil((parseDay(form.endDate).getTime() - parseDay(form.startDate).getTime()) / (7 * 86_400_000)))} semanas entre {toDay(parseDay(form.startDate))} y{' '}
              {toDay(parseDay(form.endDate))}.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
