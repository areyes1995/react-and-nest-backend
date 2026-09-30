import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Plus, Save, Trash2 } from 'lucide-react'
import { assessmentApi, evaluationApi, type AssessmentInput } from '@services/educraft'
import type { AssessmentDetail, ChecklistContent, EvaluationType, RatingScaleContent, RubricContent } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useSections } from '@hooks/useCatalog'
import { Badge, Button, Card, Checkbox, EmptyState, Field, Input, Modal, Select, Spinner } from '@components/ui'
import { BLOCK_SHORT, EVALUATION_TYPES } from '@lib/labels'
import { formatDate, formatScore, sectionLabel, today } from '@lib/format'
import { cn } from '@lib/cn'

type Row = AssessmentDetail['roster'][number]

/** Puntuación a partir de las respuestas del instrumento. */
function scoreFromInstrument(detail: AssessmentDetail, data: Record<string, unknown> | null): number | null {
  const inst = detail.instrument
  if (!inst || !data) return null
  if (inst.type === 'RUBRIC') {
    const c = inst.content as RubricContent
    const scores = c.scores ?? c.levels.map((_, i) => c.levels.length - i)
    const max = Math.max(...scores)
    const picks = data.levels as Record<string, number> | undefined
    if (!picks) return null
    let total = 0
    let weights = 0
    c.criteria.forEach((cr, i) => {
      const level = picks[i]
      if (level == null) return
      total += (scores[level] / max) * cr.weight
      weights += cr.weight
    })
    return weights ? Math.round((total / weights) * detail.maxScore * 10) / 10 : null
  }
  if (inst.type === 'CHECKLIST') {
    const c = inst.content as ChecklistContent
    const checked = (data.checked as number[] | undefined) ?? []
    return c.items.length ? Math.round((checked.length / c.items.length) * detail.maxScore * 10) / 10 : null
  }
  const c = inst.content as RatingScaleContent
  const values = (data.values as Record<string, string> | undefined) ?? {}
  const idx = Object.values(values).map((v) => c.levels.findIndex((l) => l.value === v)).filter((i) => i >= 0)
  if (!idx.length) return null
  const avg = idx.reduce((a, i) => a + (c.levels.length - 1 - i) / (c.levels.length - 1), 0) / idx.length
  return Math.round(avg * detail.maxScore * 10) / 10
}

function ScoringModal({ assessmentId, onClose, onSaved }: { assessmentId: number | null; onClose: () => void; onSaved: () => void }) {
  const { success, error } = useFeedback()
  const [detail, setDetail] = useState<AssessmentDetail | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    setDetail(null)
    if (!assessmentId) return
    assessmentApi.get(assessmentId).then((d) => {
      setDetail(d)
      setRows(d.roster)
    })
  }, [assessmentId])

  const setRow = (id: number, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.student.id === id ? { ...r, ...patch } : r)))

  const save = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await assessmentApi.saveScores(
        detail.id,
        rows.map((r) => ({ studentId: r.student.id, score: r.score, delivered: r.delivered, feedback: r.feedback ?? undefined, instrumentData: r.instrumentData ?? undefined })),
      )
      setDetail(updated)
      success('Calificaciones guardadas', 'El registro del periodo se actualizó automáticamente.')
      onSaved()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const inst = detail?.instrument
  const activeRow = rows.find((r) => r.student.id === active)
  const graded = rows.filter((r) => r.score != null).length

  return (
    <Modal
      open={!!assessmentId}
      onClose={onClose}
      size="full"
      title={detail?.title ?? 'Calificar'}
      subtitle={detail ? `${detail.section ? sectionLabel(detail.section.grade.name, detail.section.name) : ''} · P${detail.period} · PC${detail.block} · Máximo ${detail.maxScore} · ${graded}/${rows.length} calificados` : undefined}
      footer={
        <Button onClick={save} loading={saving} icon={<Save className="h-4 w-4" />}>
          Guardar calificaciones
        </Button>
      }
    >
      {!detail ? (
        <Spinner />
      ) : (
        <div className={cn('grid gap-4', inst && 'lg:grid-cols-[1fr_26rem]')}>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">No.</th>
                  <th>Estudiante</th>
                  {detail.requiresDelivery && <th className="text-center">Entregó</th>}
                  <th className="w-28 text-center">Puntuación</th>
                  <th>Retroalimentación</th>
                  {inst && <th className="w-24" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student.id} className={cn(active === r.student.id && 'bg-soft-purple')}>
                    <td className="text-ink-3">{r.student.listNumber}</td>
                    <td className="font-medium text-ink">
                      {r.student.lastName}, {r.student.firstName}
                    </td>
                    {detail.requiresDelivery && (
                      <td className="text-center">
                        <input type="checkbox" checked={r.delivered} onChange={(e) => setRow(r.student.id, { delivered: e.target.checked })} className="h-4 w-4 accent-violet-500" />
                      </td>
                    )}
                    <td className="text-center">
                      <input
                        type="number"
                        min={0}
                        max={detail.maxScore}
                        step="0.5"
                        value={r.score ?? ''}
                        onChange={(e) => setRow(r.student.id, { score: e.target.value === '' ? null : Math.min(detail.maxScore, Number(e.target.value)) })}
                        className="input h-8 w-24 text-center"
                      />
                    </td>
                    <td>
                      <input value={r.feedback ?? ''} onChange={(e) => setRow(r.student.id, { feedback: e.target.value })} className="input h-8 text-xs" placeholder="Comentario personalizado" />
                    </td>
                    {inst && (
                      <td>
                        <Button size="sm" variant="soft" onClick={() => setActive(r.student.id)}>
                          Instrumento
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inst && (
            <div className="card card-pad h-fit lg:sticky lg:top-0">
              <p className="section-title">{inst.title}</p>
              {!activeRow ? (
                <p className="mt-2 text-xs text-ink-3">Elige un estudiante para evaluar con el instrumento; la puntuación se calcula sola.</p>
              ) : (
                <InstrumentScorer
                  key={activeRow.student.id}
                  detail={detail}
                  row={activeRow}
                  onChange={(instrumentData) => {
                    const score = scoreFromInstrument(detail, instrumentData)
                    setRow(activeRow.student.id, { instrumentData, ...(score != null ? { score } : {}) })
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function InstrumentScorer({ detail, row, onChange }: { detail: AssessmentDetail; row: Row; onChange: (d: Record<string, unknown>) => void }) {
  const inst = detail.instrument!
  const data = (row.instrumentData ?? {}) as Record<string, unknown>
  const name = `${row.student.firstName} ${row.student.lastName}`
  if (inst.type === 'RUBRIC') {
    const c = inst.content as RubricContent
    const levels = (data.levels as Record<string, number>) ?? {}
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs font-semibold text-brand-purple">{name}</p>
        {c.criteria.map((cr, i) => (
          <div key={i}>
            <p className="text-xs font-bold text-ink">
              {cr.criterion} <span className="text-ink-3">({cr.weight}%)</span>
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {c.levels.map((l, k) => (
                <button key={k} onClick={() => onChange({ ...data, levels: { ...levels, [i]: k } })} title={cr.descriptors[k]} className={cn('rounded-lg px-2 py-1 text-[0.7rem] font-semibold', levels[i] === k ? 'bg-brand-gradient text-white' : 'bg-surface-3 text-ink-2')}>
                  {l}
                </button>
              ))}
            </div>
            {levels[i] != null && <p className="mt-1 text-[0.68rem] text-ink-3">{cr.descriptors[levels[i]]}</p>}
          </div>
        ))}
        <p className="rounded-xl bg-soft-green px-3 py-2 text-sm font-bold text-emerald-700">Puntuación: {formatScore(row.score, 1)} / {detail.maxScore}</p>
      </div>
    )
  }
  if (inst.type === 'CHECKLIST') {
    const c = inst.content as ChecklistContent
    const checked = (data.checked as number[]) ?? []
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-brand-purple">{name}</p>
        {c.items.map((it, i) => (
          <Checkbox key={i} checked={checked.includes(i)} onChange={(v) => onChange({ ...data, checked: v ? [...checked, i] : checked.filter((x) => x !== i) })} label={it.text} className="flex" />
        ))}
        <p className="rounded-xl bg-soft-green px-3 py-2 text-sm font-bold text-emerald-700">Puntuación: {formatScore(row.score, 1)} / {detail.maxScore}</p>
      </div>
    )
  }
  const c = inst.content as RatingScaleContent
  const values = (data.values as Record<string, string>) ?? {}
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-semibold text-brand-purple">{name}</p>
      {c.items.map((it, i) => (
        <div key={i}>
          <p className="text-xs font-bold text-ink">{it.text}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {c.levels.map((l) => (
              <button key={l.value} onClick={() => onChange({ ...data, values: { ...values, [i]: l.value } })} title={l.label} className={cn('rounded-lg px-2.5 py-1 text-xs font-bold', values[i] === l.value ? 'bg-brand-gradient text-white' : 'bg-surface-3 text-ink-2')}>
                {l.value}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="rounded-xl bg-soft-green px-3 py-2 text-sm font-bold text-emerald-700">Puntuación: {formatScore(row.score, 1)} / {detail.maxScore}</p>
    </div>
  )
}

export function AssessmentsTab({ openId }: { openId?: number | null }) {
  const { sections } = useSections()
  const { success, error, confirm } = useFeedback()
  const [sectionId, setSectionId] = useState<number | ''>('')
  const [period, setPeriod] = useState<number | ''>('')
  const { data, loading, reload } = useAsync(() => assessmentApi.list({ sectionId: sectionId || undefined, period: period || undefined }), [sectionId, period])
  const instruments = useAsync(() => evaluationApi.instruments())
  const exams = useAsync(() => evaluationApi.exams())
  const [scoring, setScoring] = useState<number | null>(openId ?? null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<AssessmentInput>({ sectionId: 0, title: '', period: 1, block: 2, date: today(), maxScore: 100, weight: 1, type: 'FORMATIVE' })

  useEffect(() => {
    if (openId) setScoring(openId)
  }, [openId])

  const sectionOptions = useMemo(() => sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) })), [sections])

  const create = async () => {
    if (!form.title.trim() || !form.sectionId) return
    try {
      const a = await assessmentApi.create({ ...form, dueDate: form.dueDate || undefined, instrumentId: form.instrumentId || undefined, examId: form.examId || undefined })
      success('Actividad creada')
      setCreating(false)
      void reload()
      setScoring(a.id)
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    }
  }

  return (
    <Card className="card-pad">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={sectionId} onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : '')} placeholder="Todas las secciones" options={sectionOptions} className="w-auto" />
        <Select value={period} onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : '')} placeholder="Todos los periodos" options={[1, 2, 3, 4].map((p) => ({ value: p, label: `Periodo ${p}` }))} className="w-auto" />
        <Button
          className="ml-auto"
          icon={<Plus className="h-4 w-4" />}
          disabled={!sections.length}
          onClick={() => {
            setForm({ ...form, sectionId: (sectionId || sections[0]?.id) as number })
            setCreating(true)
          }}
        >
          Nueva actividad evaluada
        </Button>
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="Sin actividades evaluadas" description="Registra pruebas, tareas y proyectos; al calificarlas se actualiza el registro oficial del periodo." />
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actividad</th>
                <th>Sección</th>
                <th className="text-center">Periodo</th>
                <th>Competencia</th>
                <th className="text-center">Calificados</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-xs">{formatDate(a.date)}</td>
                  <td>
                    <p className="font-semibold text-ink">{a.title}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <Badge>{EVALUATION_TYPES[a.type]}</Badge>
                      {a.requiresDelivery && <Badge tone="pink">Entrega{a.dueDate ? ` ${formatDate(a.dueDate, { day: 'numeric', month: 'short' })}` : ''}</Badge>}
                      {a.instrument && <Badge tone="purple">{a.instrument.title}</Badge>}
                    </div>
                  </td>
                  <td className="text-xs">{a.section ? sectionLabel(a.section.grade.name, a.section.name) : ''}</td>
                  <td className="text-center">P{a.period}</td>
                  <td className="text-xs">
                    PC{a.block} · {BLOCK_SHORT[a.block]}
                  </td>
                  <td className="text-center text-xs">{a._count?.scores ?? 0}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" onClick={() => setScoring(a.id)}>
                        Calificar
                      </Button>
                      <button
                        className="icon-btn h-8 w-8 hover:text-brand-red"
                        aria-label="Eliminar"
                        onClick={async () => {
                          if (await confirm({ title: 'Eliminar actividad', description: 'Se recalcularán las notas del periodo.', danger: true, confirmLabel: 'Eliminar' })) {
                            await assessmentApi.remove(a.id)
                            void reload()
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ScoringModal assessmentId={scoring} onClose={() => setScoring(null)} onSaved={reload} />

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        size="lg"
        title="Nueva actividad evaluada"
        footer={
          <Button onClick={create} disabled={!form.title.trim()}>
            Crear y calificar
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Prueba de ecuaciones lineales" />
          </Field>
          <Field label="Sección">
            <Select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: Number(e.target.value) })} options={sectionOptions} />
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EvaluationType })} options={Object.entries(EVALUATION_TYPES).map(([v, l]) => ({ value: v, label: l }))} />
          </Field>
          <Field label="Periodo">
            <Select value={form.period} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })} options={[1, 2, 3, 4].map((p) => ({ value: p, label: `Periodo ${p}` }))} />
          </Field>
          <Field label="Bloque de competencias">
            <Select value={form.block} onChange={(e) => setForm({ ...form, block: Number(e.target.value) })} options={[1, 2, 3, 4].map((b) => ({ value: b, label: `PC${b} · ${BLOCK_SHORT[b]}` }))} />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Puntaje máximo">
              <Input type="number" min={1} value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} />
            </Field>
            <Field label="Peso">
              <Input type="number" min={0} step="0.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Instrumento de evaluación">
            <Select value={form.instrumentId ?? ''} onChange={(e) => setForm({ ...form, instrumentId: e.target.value ? Number(e.target.value) : undefined })} placeholder="Ninguno" options={(instruments.data ?? []).map((i) => ({ value: i.id, label: i.title }))} />
          </Field>
          <Field label="Examen asociado">
            <Select value={form.examId ?? ''} onChange={(e) => setForm({ ...form, examId: e.target.value ? Number(e.target.value) : undefined })} placeholder="Ninguno" options={(exams.data ?? []).map((x) => ({ value: x.id, label: x.title }))} />
          </Field>
          <div className="flex items-end gap-3 sm:col-span-2">
            <Checkbox checked={!!form.requiresDelivery} onChange={(v) => setForm({ ...form, requiresDelivery: v })} label="Requiere entrega" />
            {form.requiresDelivery && (
              <Field label="Fecha de entrega">
                <Input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </Field>
            )}
          </div>
        </div>
      </Modal>
    </Card>
  )
}
