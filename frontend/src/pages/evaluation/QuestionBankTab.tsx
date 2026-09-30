import { useState } from 'react'
import { Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { aiApi, evaluationApi, type QuestionInput } from '@services/educraft'
import type { Difficulty, Question, QuestionType } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useDebounce } from '@hooks/useDebounce'
import { useGrades } from '@hooks/useCatalog'
import { Badge, Button, Card, Checkbox, EmptyState, Field, Input, Modal, RichMath, Select, Spinner } from '@components/ui'
import { DIFFICULTY, QUESTION_TYPES } from '@lib/labels'
import { QuestionEditorModal } from './QuestionEditorModal'

export function formatAnswer(q: Pick<Question, 'type' | 'options' | 'answer'>): string {
  if (q.type === 'MULTIPLE_CHOICE' && typeof q.answer === 'number' && Array.isArray(q.options)) return `${String.fromCharCode(97 + q.answer)}) ${(q.options as string[])[q.answer] ?? ''}`
  if (q.type === 'TRUE_FALSE') return q.answer === true || q.answer === 'true' ? 'Verdadero' : 'Falso'
  if (Array.isArray(q.answer)) return (q.answer as unknown[]).map((p) => (Array.isArray(p) ? p.join(' → ') : String(p))).join('; ')
  return String(q.answer ?? '—')
}

export function QuestionBankTab() {
  const grades = useGrades()
  const { success, error, confirm } = useFeedback()
  const [q, setQ] = useState('')
  const [type, setType] = useState<QuestionType | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const term = useDebounce(q, 250)
  const { data, loading, reload } = useAsync(() => evaluationApi.questions({ q: term || undefined, type: type || undefined, difficulty: difficulty || undefined }), [term, type, difficulty])
  const [editing, setEditing] = useState<Question | null | undefined>(undefined)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiForm, setAiForm] = useState({ topic: '', count: 6, gradeId: '', difficulty: 'MEDIUM' as Difficulty, types: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROBLEM'] as QuestionType[] })
  const [drafts, setDrafts] = useState<Array<QuestionInput & { keep: boolean }>>([])
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    if (!aiForm.topic.trim()) return
    setBusy(true)
    try {
      const res = await aiApi.exam({ topic: aiForm.topic, count: aiForm.count, gradeId: aiForm.gradeId ? Number(aiForm.gradeId) : undefined, difficulty: aiForm.difficulty, types: aiForm.types })
      setDrafts(res.questions.map((x) => ({ ...(x as unknown as QuestionInput), keep: true })))
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const saveDrafts = async () => {
    const list = drafts.filter((d) => d.keep).map(({ keep: _keep, ...rest }) => rest)
    if (!list.length) return
    setBusy(true)
    try {
      await evaluationApi.createQuestions(list)
      success('Preguntas agregadas al banco', `${list.length} preguntas`)
      setDrafts([])
      setAiOpen(false)
      void reload()
    } catch (err) {
      error('No se pudieron guardar', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="card-pad">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por tema, enunciado o etiqueta" className="input pl-9" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value as QuestionType)} placeholder="Todos los tipos" options={Object.entries(QUESTION_TYPES).map(([v, l]) => ({ value: v, label: l }))} className="w-auto" />
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} placeholder="Toda dificultad" options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} className="w-auto" />
        <Button variant="soft" icon={<Sparkles className="h-4 w-4" />} onClick={() => setAiOpen(true)}>
          Generar con IA
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>
          Nueva pregunta
        </Button>
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState title="Tu banco de preguntas está vacío" description="Crea preguntas o genéralas con IA; luego arma exámenes aleatorios con varias versiones." />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="purple">{QUESTION_TYPES[item.type]}</Badge>
                  <Badge tone={DIFFICULTY[item.difficulty].tone}>{DIFFICULTY[item.difficulty].label}</Badge>
                  <Badge>{item.topic}</Badge>
                  {item.grade && <Badge tone="blue">{item.grade.name}</Badge>}
                  {item.aiGenerated && <Badge tone="pink">IA</Badge>}
                  <Badge tone="gray">{item.points} pts</Badge>
                </div>
                <div className="flex gap-1">
                  <button className="icon-btn h-8 w-8" onClick={() => setEditing(item)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="icon-btn h-8 w-8 hover:text-brand-red"
                    aria-label="Eliminar"
                    onClick={async () => {
                      if (await confirm({ title: 'Eliminar pregunta', danger: true, confirmLabel: 'Eliminar' })) {
                        await evaluationApi.removeQuestion(item.id)
                        void reload()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink">
                <RichMath text={item.statement} />
              </p>
              <p className="mt-1 text-xs text-emerald-600">Respuesta: {formatAnswer(item)}</p>
            </div>
          ))}
        </div>
      )}

      <QuestionEditorModal open={editing !== undefined} question={editing} onClose={() => setEditing(undefined)} onSaved={reload} />

      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        size="xl"
        title="Generar preguntas con IA"
        footer={
          drafts.length > 0 && (
            <Button onClick={saveDrafts} loading={busy}>
              Guardar seleccionadas ({drafts.filter((d) => d.keep).length})
            </Button>
          )
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Field label="Tema" className="sm:col-span-2">
            <Input value={aiForm.topic} onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="Ej.: porcentajes" />
          </Field>
          <Field label="Cantidad">
            <Input type="number" min={1} max={30} value={aiForm.count} onChange={(e) => setAiForm({ ...aiForm, count: Number(e.target.value) })} />
          </Field>
          <Field label="Dificultad">
            <Select value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as Difficulty })} options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} />
          </Field>
          <Field label="Grado">
            <Select value={aiForm.gradeId} onChange={(e) => setAiForm({ ...aiForm, gradeId: e.target.value })} placeholder="Cualquiera" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          <div className="sm:col-span-3">
            <p className="label">Tipos</p>
            <div className="flex flex-wrap gap-1.5">
              {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'COMPLETE', 'MATCHING', 'DEVELOPMENT', 'PROBLEM'] as QuestionType[]).map((t) => (
                <button key={t} onClick={() => setAiForm({ ...aiForm, types: aiForm.types.includes(t) ? aiForm.types.filter((x) => x !== t) : [...aiForm.types, t] })} className={`chip ${aiForm.types.includes(t) ? 'chip-active' : ''}`}>
                  {QUESTION_TYPES[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={generate} loading={busy && !drafts.length} disabled={!aiForm.topic.trim()} icon={<Sparkles className="h-4 w-4" />}>
          Generar
        </Button>
        {drafts.length > 0 && (
          <div className="mt-4 space-y-2">
            {drafts.map((d, i) => (
              <div key={i} className="rounded-2xl border border-line p-3">
                <Checkbox checked={d.keep} onChange={(v) => setDrafts(drafts.map((x, k) => (k === i ? { ...x, keep: v } : x)))} label={<Badge tone="purple">{QUESTION_TYPES[d.type]}</Badge>} />
                <p className="mt-1 text-sm text-ink">
                  <RichMath text={d.statement} />
                </p>
                <p className="text-xs text-emerald-600">Respuesta: {formatAnswer({ type: d.type, options: d.options, answer: d.answer })}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  )
}
