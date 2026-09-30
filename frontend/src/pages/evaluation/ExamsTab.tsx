import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dices, Plus, Sparkles, Trash2 } from 'lucide-react'
import { aiApi, evaluationApi } from '@services/educraft'
import type { Difficulty, EvaluationType, QuestionType } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useFundamentals, useGrades } from '@hooks/useCatalog'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner } from '@components/ui'
import { DIFFICULTY, EVALUATION_TYPES, QUESTION_TYPES } from '@lib/labels'
import { formatDate } from '@lib/format'

type Mode = 'ai' | 'random' | null

export function ExamsTab() {
  const navigate = useNavigate()
  const grades = useGrades()
  const fundamentals = useFundamentals()
  const { success, error, confirm } = useFeedback()
  const { data, loading, reload } = useAsync(() => evaluationApi.exams())
  const [mode, setMode] = useState<Mode>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    title: '',
    topic: '',
    count: 10,
    gradeId: '',
    fundamentalId: '',
    difficulty: 'MEDIUM' as Difficulty,
    evaluationType: 'SUMMATIVE' as EvaluationType,
    versions: 2,
    types: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'COMPLETE', 'PROBLEM'] as QuestionType[],
  })

  const submit = async () => {
    setBusy(true)
    try {
      if (mode === 'ai') {
        const res = await aiApi.exam({
          topic: form.topic,
          title: form.title || undefined,
          count: form.count,
          gradeId: form.gradeId ? Number(form.gradeId) : undefined,
          fundamentalId: form.fundamentalId ? Number(form.fundamentalId) : undefined,
          difficulty: form.difficulty,
          evaluationType: form.evaluationType,
          types: form.types,
          save: true,
        })
        success('Examen generado', `${res.questions.length} preguntas con respuestas`)
        navigate(`/app/evaluacion/examenes/${res.exam!.id}`)
      } else {
        const exam = await evaluationApi.randomExam({
          title: form.title || `Examen aleatorio${form.topic ? `: ${form.topic}` : ''}`,
          count: form.count,
          topic: form.topic || undefined,
          gradeId: form.gradeId ? Number(form.gradeId) : undefined,
          difficulty: form.difficulty,
          types: form.types,
          versions: form.versions,
        })
        navigate(`/app/evaluacion/examenes/${exam.id}`)
      }
    } catch (err) {
      error('No se pudo crear el examen', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="card-pad">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button icon={<Sparkles className="h-4 w-4" />} onClick={() => setMode('ai')}>
          Crear Examen Automático
        </Button>
        <Button variant="soft" icon={<Dices className="h-4 w-4" />} onClick={() => setMode('random')}>
          Examen aleatorio del banco
        </Button>
        <Button
          variant="secondary"
          icon={<Plus className="h-4 w-4" />}
          onClick={async () => {
            const exam = await evaluationApi.createExam({ title: 'Nuevo examen', questions: [] })
            navigate(`/app/evaluacion/examenes/${exam.id}`)
          }}
        >
          Examen en blanco
        </Button>
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState title="Sin exámenes" description="Genera un examen automático con respuestas o arma uno con preguntas aleatorias de tu banco." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((x) => (
            <div key={x.id} className="group rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/app/evaluacion/examenes/${x.id}`} className="text-sm font-bold text-ink hover:text-brand-purple">
                  {x.title}
                </Link>
                <button
                  className="icon-btn h-7 w-7 opacity-0 hover:text-brand-red group-hover:opacity-100"
                  aria-label="Eliminar"
                  onClick={async () => {
                    if (await confirm({ title: 'Eliminar examen', danger: true, confirmLabel: 'Eliminar' })) {
                      await evaluationApi.removeExam(x.id)
                      void reload()
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge tone="orange">{EVALUATION_TYPES[x.evaluationType]}</Badge>
                <Badge>{x._count?.questions ?? 0} preguntas</Badge>
                <Badge tone="purple">{x.versions} versión(es)</Badge>
                {x.aiGenerated && <Badge tone="pink">IA</Badge>}
              </div>
              <p className="mt-2 text-xs text-ink-3">
                {x.grade?.name ?? 'General'} · {formatDate(x.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!mode}
        onClose={() => setMode(null)}
        size="lg"
        title={mode === 'ai' ? 'Crear Examen Automático' : 'Examen con preguntas aleatorias'}
        subtitle={mode === 'ai' ? 'Preguntas con respuestas incluidas, alineadas a la competencia' : 'Se eligen al azar preguntas de tu banco según los filtros'}
        footer={
          <Button onClick={submit} loading={busy} disabled={mode === 'ai' && !form.topic.trim()}>
            Crear examen
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Evaluación del periodo" />
          </Field>
          <Field label={mode === 'ai' ? 'Tema' : 'Tema (filtro opcional)'}>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Ej.: fracciones" />
          </Field>
          <Field label="Número de preguntas">
            <Input type="number" min={1} max={30} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
          </Field>
          <Field label="Dificultad">
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} />
          </Field>
          <Field label="Grado">
            <Select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} placeholder="Cualquiera" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          {mode === 'ai' ? (
            <>
              <Field label="Competencia">
                <Select value={form.fundamentalId} onChange={(e) => setForm({ ...form, fundamentalId: e.target.value })} placeholder="—" options={fundamentals.map((f) => ({ value: f.id, label: f.name }))} />
              </Field>
              <Field label="Tipo de evaluación">
                <Select value={form.evaluationType} onChange={(e) => setForm({ ...form, evaluationType: e.target.value as EvaluationType })} options={Object.entries(EVALUATION_TYPES).map(([v, l]) => ({ value: v, label: l }))} />
              </Field>
            </>
          ) : (
            <Field label="Versiones del examen">
              <Input type="number" min={1} max={6} value={form.versions} onChange={(e) => setForm({ ...form, versions: Number(e.target.value) })} />
            </Field>
          )}
          <div className="sm:col-span-2">
            <p className="label">Tipos de pregunta</p>
            <div className="flex flex-wrap gap-1.5">
              {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'DEVELOPMENT', 'MATCHING', 'COMPLETE', 'PROBLEM'] as QuestionType[]).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, types: form.types.includes(t) ? form.types.filter((x) => x !== t) : [...form.types, t] })} className={`chip ${form.types.includes(t) ? 'chip-active' : ''}`}>
                  {QUESTION_TYPES[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
