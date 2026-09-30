import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { schoolYearApi, sectionApi, type SectionInput } from '@services/educraft'
import type { ClassSchedule, SchoolYear, Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useGrades, useSections } from '@hooks/useCatalog'
import { Button, Card, CardHeader, EmptyState, Field, Input, Modal, Select, Spinner } from '@components/ui'
import { WEEKDAYS, formatTime, sectionLabel } from '@lib/format'

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#f97316', '#22c55e', '#0ea5e9', '#f59e0b', '#ef4444']

export function SectionsTab() {
  const grades = useGrades()
  const { sections, loading, reload } = useSections()
  const { success, error, confirm } = useFeedback()
  const [year, setYear] = useState<SchoolYear | null>(null)
  const [editing, setEditing] = useState<(SectionInput & { id?: number }) | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    schoolYearApi.list().then((ys) => setYear(ys.find((y) => y.isActive) ?? ys[0] ?? null)).catch(() => undefined)
  }, [])

  const startNew = () =>
    year &&
    setEditing({
      schoolYearId: year.id,
      gradeId: grades[0]?.id ?? 1,
      name: 'A',
      color: COLORS[sections.length % COLORS.length],
      subject: 'Matemática',
      schedules: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: '08:00', endTime: '09:30' })),
    })

  const startEdit = (s: Section) =>
    setEditing({
      id: s.id,
      schoolYearId: s.schoolYearId,
      gradeId: s.gradeId,
      name: s.name,
      color: s.color,
      room: s.room ?? undefined,
      subject: s.subject,
      schedules: s.schedules.map(({ weekday, startTime, endTime, topic }) => ({ weekday, startTime, endTime, topic: topic ?? undefined })),
    })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const { id, ...body } = editing
      const cleanSchedules = (body.schedules ?? []).filter((s) => s.startTime < s.endTime).map((s) => ({ ...s, topic: s.topic || undefined }))
      if (id) await sectionApi.update(id, { ...body, schedules: cleanSchedules })
      else await sectionApi.create({ ...body, schedules: cleanSchedules })
      success(id ? 'Sección actualizada' : 'Sección creada')
      setEditing(null)
      await reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: Section) => {
    if (!(await confirm({ title: 'Eliminar sección', description: `Se ocultará ${sectionLabel(s.grade.name, s.name)} con sus estudiantes y registros.`, danger: true, confirmLabel: 'Eliminar' }))) return
    await sectionApi.remove(s.id)
    void reload()
  }

  const setSchedule = (i: number, patch: Partial<ClassSchedule>) =>
    editing && setEditing({ ...editing, schedules: (editing.schedules ?? []).map((s, k) => (k === i ? { ...s, ...patch } : s)) })

  if (loading) return <Spinner />

  return (
    <Card className="card-pad">
      <CardHeader
        title={`Secciones ${year ? `· ${year.name}` : ''}`}
        subtitle="Cursos a tu cargo, color identificador y horario semanal."
        action={
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={startNew} disabled={!year}>
            Nueva sección
          </Button>
        }
      />
      {!year ? (
        <EmptyState title="Primero crea un año escolar" action={<Link className="btn btn-primary btn-sm" to="/app/ajustes?tab=anio">Crear año escolar</Link>} />
      ) : sections.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Sin secciones" description="Crea tus cursos (p. ej. 3° Secundaria A) con su horario." action={<Button onClick={startNew}>Crear sección</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => (
            <div key={s.id} className="rounded-2xl border border-line p-4" style={{ borderTop: `4px solid ${s.color}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-extrabold text-ink">{sectionLabel(s.grade.name, s.name)}</p>
                  <p className="text-xs text-ink-3">
                    {s.subject} · {s._count.students} estudiantes{s.room ? ` · ${s.room}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="icon-btn h-8 w-8" onClick={() => startEdit(s)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="icon-btn h-8 w-8 hover:text-brand-red" onClick={() => remove(s)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-ink-2">
                {s.schedules.map((sc) => (
                  <li key={sc.id} className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-ink-3" /> {WEEKDAYS[sc.weekday - 1]} · {formatTime(sc.startTime)} - {formatTime(sc.endTime)}
                  </li>
                ))}
                {!s.schedules.length && <li className="text-ink-3">Sin horario</li>}
              </ul>
              <Link to={`/app/estudiantes?seccion=${s.id}`} className="link mt-3 inline-block">
                Ver estudiantes →
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'Editar sección' : 'Nueva sección'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Grado" className="sm:col-span-2">
                <Select value={editing.gradeId} onChange={(e) => setEditing({ ...editing, gradeId: Number(e.target.value) })} options={grades.map((g) => ({ value: g.id, label: g.name }))} />
              </Field>
              <Field label="Sección">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Aula">
                <Input value={editing.room ?? ''} onChange={(e) => setEditing({ ...editing, room: e.target.value })} />
              </Field>
            </div>
            <div>
              <p className="label">Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setEditing({ ...editing, color: c })} className={`h-8 w-8 rounded-full transition ${editing.color === c ? 'ring-4 ring-offset-2 ring-offset-surface' : ''}`} style={{ background: c, ['--tw-ring-color' as string]: c }} aria-label={c} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Horario semanal</p>
                <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing({ ...editing, schedules: [...(editing.schedules ?? []), { weekday: 1, startTime: '08:00', endTime: '09:30' }] })}>
                  Agregar bloque
                </Button>
              </div>
              <div className="space-y-2">
                {(editing.schedules ?? []).map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_1fr_auto] items-center gap-2">
                    <Select value={s.weekday} onChange={(e) => setSchedule(i, { weekday: Number(e.target.value) })} options={WEEKDAYS.map((d, k) => ({ value: k + 1, label: d }))} />
                    <Input type="time" value={s.startTime} onChange={(e) => setSchedule(i, { startTime: e.target.value })} className="w-28" />
                    <Input type="time" value={s.endTime} onChange={(e) => setSchedule(i, { endTime: e.target.value })} className="w-28" />
                    <Input value={s.topic ?? ''} onChange={(e) => setSchedule(i, { topic: e.target.value })} placeholder="Tema (opcional)" />
                    <button className="icon-btn hover:text-brand-red" onClick={() => setEditing({ ...editing, schedules: (editing.schedules ?? []).filter((_, k) => k !== i) })} aria-label="Quitar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
