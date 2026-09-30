import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, FileDown, MonitorPlay, Pencil, Printer, Save, Sparkles, Trash2 } from 'lucide-react'
import { aiApi, planningApi } from '@services/educraft'
import type { LearningUnit, LessonMoment, LessonPlanInput, LessonPlanStatus } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useGradeCurriculum, useGrades, useSections } from '@hooks/useCatalog'
import { Button, Card, CardHeader, Field, Input, Select, Spinner, Tabs, Textarea } from '@components/ui'
import { CurriculumPicker } from '@/features/planning/CurriculumPicker'
import { LessonPlanTable } from '@/features/planning/LessonPlanTable'
import { planDocumentHtml } from '@/features/planning/planDocument'
import { exportWord, printDocument } from '@lib/exporters'
import { PLAN_STATUS } from '@lib/labels'
import { sectionLabel, slugify, today } from '@lib/format'

const EMPTY_MOMENTS: LessonMoment[] = [
  { moment: 'INICIO', minutes: 10, activities: [''], metacognition: '', evidences: [], techniques: [], resources: [] },
  { moment: 'DESARROLLO', minutes: 25, activities: [''], metacognition: '', evidences: [], techniques: [], resources: [] },
  { moment: 'CIERRE', minutes: 10, activities: [''], metacognition: '', evidences: [], techniques: [], resources: [] },
]

const MOMENT_STYLE: Record<string, { title: string; color: string }> = {
  INICIO: { title: 'Inicio', color: 'border-pink-300 bg-soft-pink' },
  DESARROLLO: { title: 'Desarrollo', color: 'border-violet-300 bg-soft-purple' },
  CIERRE: { title: 'Cierre', color: 'border-sky-300 bg-soft-sky' },
}

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

export default function LessonPlanEditor() {
  const { id } = useParams()
  const isNew = !id
  const location = useLocation()
  const navigate = useNavigate()
  const grades = useGrades()
  const { sections } = useSections()
  const { success, error, confirm } = useFeedback()
  const state = (location.state ?? {}) as { draft?: LessonPlanInput; unitId?: number; gradeId?: number; draftDate?: string }
  const [plan, setPlan] = useState<LessonPlanInput | null>(null)
  const [units, setUnits] = useState<LearningUnit[]>([])
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [assisting, setAssisting] = useState(false)
  const curriculum = useGradeCurriculum(plan?.gradeId)

  useEffect(() => {
    if (isNew) {
      setPlan(
        state.draft
          ? { ...state.draft, date: state.draft.date ?? today(), status: state.draft.status ?? 'DRAFT' }
          : {
              gradeId: state.gradeId ?? 0,
              unitId: state.unitId,
              title: '',
              topic: '',
              date: state.draftDate ?? today(),
              durationMinutes: 45,
              strategies: [],
              specificCompetenceIds: [],
              indicatorIds: [],
              contentIds: [],
              moments: EMPTY_MOMENTS,
              status: 'DRAFT',
            },
      )
    } else {
      planningApi
        .plan(Number(id))
        .then((p) =>
          setPlan({
            gradeId: p.gradeId,
            sectionId: p.sectionId,
            unitId: p.unitId,
            title: p.title,
            topic: p.topic,
            date: p.date?.slice(0, 10) ?? null,
            durationMinutes: p.durationMinutes,
            purpose: p.purpose,
            strategies: p.strategies,
            status: p.status,
            specificCompetenceIds: p.specificCompetenceIds,
            indicatorIds: p.indicatorIds,
            contentIds: p.contentIds,
            moments: p.moments,
            evaluation: p.evaluation,
            assignment: p.assignment,
            aiGenerated: p.aiGenerated,
          }),
        )
        .catch((err) => error('No se pudo cargar el plan', (err as Error).message))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (plan && !plan.gradeId && grades.length) setPlan({ ...plan, gradeId: grades[0].id })
  }, [grades, plan])

  useEffect(() => {
    if (plan?.gradeId) planningApi.units({ gradeId: plan.gradeId }).then(setUnits).catch(() => setUnits([]))
  }, [plan?.gradeId])

  const indicators = useMemo(
    () => curriculum?.indicators.filter((i) => plan?.indicatorIds?.includes(i.id)).map((i) => i.description) ?? [],
    [curriculum, plan?.indicatorIds],
  )

  if (!plan) return <Spinner />

  const set = (patch: Partial<LessonPlanInput>) => setPlan({ ...plan, ...patch })
  const setMoment = (i: number, patch: Partial<LessonMoment>) => set({ moments: plan.moments.map((m, k) => (k === i ? { ...m, ...patch } : m)) })
  const totalMinutes = plan.moments.reduce((a, m) => a + (Number(m.minutes) || 0), 0)
  const section = sections.find((s) => s.id === plan.sectionId)
  const gradeName = grades.find((g) => g.id === plan.gradeId)?.name ?? ''

  const body = (): LessonPlanInput => ({
    ...plan,
    title: plan.title.trim() || plan.topic.trim(),
    sectionId: plan.sectionId || undefined,
    unitId: plan.unitId || undefined,
    date: plan.date || undefined,
    moments: plan.moments.map((m) => ({ ...m, activities: m.activities.filter((a) => a.trim()) })),
    evaluation: { ...(plan.evaluation ?? {}), indicators },
  })

  const save = async () => {
    if (!plan.topic.trim() || !plan.gradeId) return error('Faltan datos', 'Indica al menos el tema y el grado.')
    setSaving(true)
    try {
      if (isNew) {
        const created = await planningApi.createPlan(body())
        success('Plan de clase guardado')
        navigate(`/app/planificacion/planes/${created.id}`, { replace: true })
      } else {
        await planningApi.updatePlan(Number(id), body())
        success('Cambios guardados')
      }
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const assist = async () => {
    if (!plan.topic.trim() || !plan.gradeId) return error('Indica el tema y el grado primero')
    setAssisting(true)
    try {
      const res = await aiApi.lessonPlan({
        gradeId: plan.gradeId,
        topic: plan.topic,
        durationMinutes: plan.durationMinutes,
        specificCompetenceIds: plan.specificCompetenceIds,
        indicatorIds: plan.indicatorIds,
        contentIds: plan.contentIds,
        strategies: plan.strategies?.length ? plan.strategies : undefined,
      })
      const draft = res.plan as LessonPlanInput
      set({ moments: draft.moments, purpose: plan.purpose || draft.purpose, strategies: plan.strategies?.length ? plan.strategies : draft.strategies, assignment: plan.assignment || draft.assignment, title: plan.title || draft.title, evaluation: draft.evaluation, aiGenerated: true })
      success('Momentos generados', 'Revisa y ajusta lo necesario.')
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setAssisting(false)
    }
  }

  const doc = () =>
    planDocumentHtml({
      title: plan.title || plan.topic,
      topic: plan.topic,
      gradeName,
      sectionName: section?.name,
      date: plan.date,
      durationMinutes: plan.durationMinutes,
      purpose: plan.purpose,
      strategies: plan.strategies,
      moments: plan.moments,
      indicators,
      curriculum: curriculum
        ? {
            competences: curriculum.specificCompetences.filter((c) => plan.specificCompetenceIds?.includes(c.id)),
            indicators: curriculum.indicators.filter((c) => plan.indicatorIds?.includes(c.id)),
            contents: curriculum.contents.filter((c) => plan.contentIds?.includes(c.id)),
          }
        : null,
      assignment: plan.assignment,
    })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => navigate('/app/planificacion?tab=programaciones')} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-brand-purple">
          <ArrowLeft className="h-4 w-4" /> Programaciones
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Tabs
            value={mode}
            onChange={setMode}
            items={[
              { key: 'edit', label: 'Editar', icon: <Pencil className="h-3.5 w-3.5" /> },
              { key: 'preview', label: 'Plantilla oficial', icon: <Eye className="h-3.5 w-3.5" /> },
            ]}
          />
          <Button variant="secondary" size="sm" icon={<FileDown className="h-3.5 w-3.5" />} onClick={() => exportWord(plan.title || 'Plan de clase', doc(), `plan-${slugify(plan.title || plan.topic)}`)}>
            Word
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => printDocument(plan.title || 'Plan de clase', doc())}>
            PDF
          </Button>
          {!isNew && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<MonitorPlay className="h-3.5 w-3.5" />}
                onClick={async () => {
                  const res = await aiApi.presentation(Number(id))
                  navigate(`/app/clases/presentaciones/${res.presentation.id}`)
                }}
              >
                Presentación
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={async () => {
                  if (await confirm({ title: 'Eliminar plan', danger: true, confirmLabel: 'Eliminar' })) {
                    await planningApi.removePlan(Number(id))
                    navigate('/app/planificacion?tab=programaciones')
                  }
                }}
              >
                Eliminar
              </Button>
            </>
          )}
          <Button size="sm" onClick={save} loading={saving} icon={<Save className="h-3.5 w-3.5" />}>
            Guardar
          </Button>
        </div>
      </div>

      {mode === 'preview' ? (
        <Card className="card-pad space-y-3">
          <h2 className="text-lg font-extrabold">{plan.title || plan.topic}</h2>
          {plan.purpose && <p className="text-sm text-ink-2"><b>Propósito:</b> {plan.purpose}</p>}
          <LessonPlanTable title={`Esquema plan de clase: ${gradeName}`} moments={plan.moments} strategies={plan.strategies} indicators={indicators} />
          {plan.assignment && <p className="text-sm text-ink-2"><b>Asignación:</b> {plan.assignment}</p>}
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
          <div className="space-y-4">
            <Card className="card-pad space-y-3">
              <CardHeader title="Datos de la sesión" className="mb-0" />
              <Field label="Tema">
                <Input value={plan.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Fracciones equivalentes" />
              </Field>
              <Field label="Título">
                <Input value={plan.title} onChange={(e) => set({ title: e.target.value })} placeholder="Igual al tema si lo dejas vacío" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Grado">
                  <Select value={plan.gradeId} onChange={(e) => set({ gradeId: Number(e.target.value), specificCompetenceIds: [], indicatorIds: [], contentIds: [], sectionId: undefined, unitId: undefined })} options={grades.map((g) => ({ value: g.id, label: g.name }))} />
                </Field>
                <Field label="Sección">
                  <Select value={plan.sectionId ?? ''} onChange={(e) => set({ sectionId: e.target.value ? Number(e.target.value) : null })} placeholder="—" options={sections.filter((s) => s.gradeId === plan.gradeId).map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} />
                </Field>
                <Field label="Fecha">
                  <Input type="date" value={plan.date ?? ''} onChange={(e) => set({ date: e.target.value })} />
                </Field>
                <Field label="Duración (min)">
                  <Input type="number" min={5} value={plan.durationMinutes ?? 45} onChange={(e) => set({ durationMinutes: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="Unidad / programación">
                <Select value={plan.unitId ?? ''} onChange={(e) => set({ unitId: e.target.value ? Number(e.target.value) : null })} placeholder="Sin unidad" options={units.map((u) => ({ value: u.id, label: u.title }))} />
              </Field>
              <Field label="Estado">
                <Select value={plan.status ?? 'DRAFT'} onChange={(e) => set({ status: e.target.value as LessonPlanStatus })} options={Object.entries(PLAN_STATUS).map(([v, s]) => ({ value: v, label: s.label }))} />
              </Field>
              <Field label="Propósito">
                <Textarea value={plan.purpose ?? ''} onChange={(e) => set({ purpose: e.target.value })} />
              </Field>
              <Field label="Estrategias de enseñanza y aprendizaje" hint="Una por línea">
                <Textarea value={(plan.strategies ?? []).join('\n')} onChange={(e) => set({ strategies: e.target.value.split('\n') })} onBlur={(e) => set({ strategies: lines(e.target.value) })} rows={4} />
              </Field>
            </Card>
            <Card className="card-pad">
              <CardHeader title="Adecuación curricular" />
              <CurriculumPicker
                gradeId={plan.gradeId}
                value={{ specificCompetenceIds: plan.specificCompetenceIds ?? [], indicatorIds: plan.indicatorIds ?? [], contentIds: plan.contentIds ?? [] }}
                onChange={(v) => set(v)}
                compact
              />
            </Card>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-2">
                Momentos de la clase · <b className={totalMinutes === plan.durationMinutes ? 'text-emerald-600' : 'text-amber-600'}>{totalMinutes} / {plan.durationMinutes} min</b>
              </p>
              <Button variant="soft" size="sm" icon={<Sparkles className="h-3.5 w-3.5" />} loading={assisting} onClick={assist}>
                Completar con IA
              </Button>
            </div>
            {plan.moments.map((m, i) => (
              <Card key={m.moment} className={`card-pad border-l-4 ${MOMENT_STYLE[m.moment].color.split(' ')[0]}`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-extrabold text-ink">{MOMENT_STYLE[m.moment].title}</p>
                  <label className="flex items-center gap-2 text-xs text-ink-3">
                    Tiempo
                    <Input type="number" min={0} value={m.minutes} onChange={(e) => setMoment(i, { minutes: Number(e.target.value) })} className="h-8 w-20" /> min
                  </label>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Actividades de enseñanza/aprendizaje" hint="Una por línea" className="lg:col-span-2">
                    <Textarea rows={4} value={m.activities.join('\n')} onChange={(e) => setMoment(i, { activities: e.target.value.split('\n') })} />
                  </Field>
                  <Field label="Metacognición">
                    <Input value={m.metacognition ?? ''} onChange={(e) => setMoment(i, { metacognition: e.target.value })} placeholder="¿Qué sabes sobre…?" />
                  </Field>
                  <Field label="Evidencias" hint="Separadas por línea">
                    <Textarea rows={2} value={(m.evidences ?? []).join('\n')} onChange={(e) => setMoment(i, { evidences: e.target.value.split('\n') })} />
                  </Field>
                  <Field label="Técnicas e instrumentos">
                    <Textarea rows={2} value={(m.techniques ?? []).join('\n')} onChange={(e) => setMoment(i, { techniques: e.target.value.split('\n') })} />
                  </Field>
                  <Field label="Recursos">
                    <Textarea rows={2} value={(m.resources ?? []).join('\n')} onChange={(e) => setMoment(i, { resources: e.target.value.split('\n') })} />
                  </Field>
                </div>
              </Card>
            ))}
            <Card className="card-pad">
              <Field label="Asignación / tarea para la casa">
                <Textarea value={plan.assignment ?? ''} onChange={(e) => set({ assignment: e.target.value })} />
              </Field>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
