import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePenLine, Save, Sparkles } from 'lucide-react'
import { aiApi, planningApi } from '@services/educraft'
import type { LessonPlanInput, AiSource } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useGradeCurriculum, useGrades, useSections } from '@hooks/useCatalog'
import { Button, Field, Input, Select } from '@components/ui'
import { SourceBadge } from '@/features/common/SourceBadge'
import { CurriculumPicker, type CurriculumSelection } from '@/features/planning/CurriculumPicker'
import { LessonPlanTable } from '@/features/planning/LessonPlanTable'
import { sectionLabel, today } from '@lib/format'

const STRATEGY_OPTIONS = [
  'Recuperación de saberes previos.',
  'Manipulación de materiales didácticos.',
  'Juego simbólico.',
  'Descubrimiento guiado.',
  'Trabajo colaborativo.',
  'Socialización de respuestas.',
  'Resolución de problemas del contexto.',
  'Uso de TIC.',
]

/** 4.2 Generador de sesiones completas (plan de clase oficial). */
export function SessionGenerator({ initialTopic = '', onDone }: { initialTopic?: string; onDone?: () => void }) {
  const navigate = useNavigate()
  const grades = useGrades()
  const { sections } = useSections()
  const { success, error } = useFeedback()
  const [topic, setTopic] = useState(initialTopic)
  const [gradeId, setGradeId] = useState<number | ''>('')
  const [sectionId, setSectionId] = useState<number | ''>('')
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState(45)
  const [context, setContext] = useState('')
  const [strategies, setStrategies] = useState<string[]>(STRATEGY_OPTIONS.slice(0, 4))
  const [selection, setSelection] = useState<CurriculumSelection>({ specificCompetenceIds: [], indicatorIds: [], contentIds: [] })
  const [draft, setDraft] = useState<LessonPlanInput | null>(null)
  const [source, setSource] = useState<AiSource>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const curriculum = useGradeCurriculum(gradeId || null)

  useEffect(() => {
    if (!gradeId && grades.length) setGradeId(grades[0].id)
  }, [grades, gradeId])

  useEffect(() => {
    const s = sections.find((x) => x.id === sectionId)
    if (s) setGradeId(s.gradeId)
  }, [sectionId, sections])

  const generate = async () => {
    if (!topic.trim() || !gradeId) return
    setLoading(true)
    try {
      const res = await aiApi.lessonPlan({
        gradeId: Number(gradeId),
        sectionId: sectionId ? Number(sectionId) : undefined,
        topic,
        date,
        durationMinutes: duration,
        strategies,
        context: context || undefined,
        ...selection,
      })
      setDraft(res.plan as LessonPlanInput)
      setSource(res.source)
    } catch (err) {
      error('No se pudo generar la sesión', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const plan = await planningApi.createPlan({ ...draft, date: date || undefined })
      success('Plan de clase guardado')
      onDone?.()
      navigate(`/app/planificacion/planes/${plan.id}`)
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const indicatorTexts = curriculum?.indicators.filter((i) => selection.indicatorIds.includes(i.id)).map((i) => i.description) ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
      <div className="space-y-3">
        <Field label="Tema de la sesión">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej.: Función cuadrática" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sección">
            <Select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : '')}
              placeholder="Sin sección"
              options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))}
            />
          </Field>
          <Field label="Grado">
            <Select value={gradeId} onChange={(e) => setGradeId(Number(e.target.value))} options={grades.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Duración (min)">
            <Input type="number" min={10} max={240} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Contexto de los problemas" hint="Opcional: salud, finanzas, medio ambiente…">
          <Input value={context} onChange={(e) => setContext(e.target.value)} />
        </Field>
        <div>
          <p className="label">Estrategias</p>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStrategies((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]))}
                className={`chip ${strategies.includes(s) ? 'chip-active' : ''}`}
              >
                {s.replace('.', '')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label">Adecuación curricular</p>
          <CurriculumPicker gradeId={gradeId || null} value={selection} onChange={setSelection} compact />
        </div>
        <Button className="w-full" onClick={generate} loading={loading} disabled={!topic.trim() || !gradeId} icon={<Sparkles className="h-4 w-4" />}>
          Generar sesión
        </Button>
      </div>

      <div className="min-w-0 space-y-3">
        {!draft ? (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-3">
            La IA construirá propósito, inicio, desarrollo, cierre, recursos, evaluación, evidencias e instrumentos siguiendo el esquema oficial del plan de clase. Tú solo editas lo necesario.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-bold">{draft.title}</p>
                <p className="text-xs text-ink-3">{draft.purpose}</p>
              </div>
              <SourceBadge source={source} />
            </div>
            <LessonPlanTable moments={draft.moments} strategies={draft.strategies} indicators={indicatorTexts} />
            {draft.assignment && (
              <p className="rounded-xl bg-soft-blue px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                <b>Asignación:</b> {draft.assignment}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} loading={saving} icon={<Save className="h-4 w-4" />}>
                Guardar plan
              </Button>
              <Button
                variant="secondary"
                icon={<FilePenLine className="h-4 w-4" />}
                onClick={() => {
                  onDone?.()
                  navigate('/app/planificacion/planes/nuevo', { state: { draft: { ...draft, date } } })
                }}
              >
                Editar antes de guardar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
