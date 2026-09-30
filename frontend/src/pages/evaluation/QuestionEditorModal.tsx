import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { evaluationApi, type QuestionInput } from '@services/educraft'
import type { Difficulty, Question, QuestionType } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useFundamentals, useGrades } from '@hooks/useCatalog'
import { Button, Field, Input, Modal, RichMath, Select, Textarea } from '@components/ui'
import { DIFFICULTY, QUESTION_TYPES } from '@lib/labels'

const EMPTY: QuestionInput = { topic: '', type: 'MULTIPLE_CHOICE', statement: '', options: ['', '', '', ''], answer: 0, difficulty: 'MEDIUM', points: 1 }

export function QuestionEditorModal({ open, question, onClose, onSaved }: { open: boolean; question?: Question | null; onClose: () => void; onSaved: () => void }) {
  const grades = useGrades()
  const fundamentals = useFundamentals()
  const { success, error } = useFeedback()
  const [q, setQ] = useState<QuestionInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setQ(question ? { ...question, solution: question.solution ?? '' } : EMPTY)
  }, [open, question])

  const setType = (type: QuestionType) => {
    const base: Partial<QuestionInput> =
      type === 'MULTIPLE_CHOICE'
        ? { options: ['', '', '', ''], answer: 0 }
        : type === 'TRUE_FALSE'
          ? { options: undefined, answer: true }
          : type === 'MATCHING'
            ? { options: { left: ['', ''], right: ['', ''] }, answer: [['', ''], ['', '']] }
            : { options: undefined, answer: '' }
    setQ({ ...q, type, ...base })
  }

  const options = Array.isArray(q.options) ? (q.options as string[]) : []
  const pairs = q.type === 'MATCHING' && Array.isArray(q.answer) ? (q.answer as string[][]) : []

  const save = async () => {
    if (!q.statement.trim() || !q.topic.trim()) return error('Faltan datos', 'Escribe el tema y el enunciado.')
    setSaving(true)
    let body: QuestionInput = { ...q }
    if (q.type === 'MATCHING') body = { ...q, options: { left: pairs.map((p) => p[0]), right: pairs.map((p) => p[1]) }, answer: pairs }
    if (q.type === 'MULTIPLE_CHOICE') body = { ...q, options: options.filter((o) => o.trim()) }
    try {
      if (question) await evaluationApi.updateQuestion(question.id, body)
      else await evaluationApi.createQuestion(body)
      success('Pregunta guardada')
      onSaved()
      onClose()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={question ? 'Editar pregunta' : 'Nueva pregunta'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo">
            <Select value={q.type} onChange={(e) => setType(e.target.value as QuestionType)} options={Object.entries(QUESTION_TYPES).map(([v, l]) => ({ value: v, label: l }))} />
          </Field>
          <Field label="Dificultad">
            <Select value={q.difficulty ?? 'MEDIUM'} onChange={(e) => setQ({ ...q, difficulty: e.target.value as Difficulty })} options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} />
          </Field>
          <Field label="Puntos">
            <Input type="number" min={0} step="0.5" value={q.points ?? 1} onChange={(e) => setQ({ ...q, points: Number(e.target.value) })} />
          </Field>
          <Field label="Tema">
            <Input value={q.topic} onChange={(e) => setQ({ ...q, topic: e.target.value })} />
          </Field>
          <Field label="Grado">
            <Select value={q.gradeId ?? ''} onChange={(e) => setQ({ ...q, gradeId: e.target.value ? Number(e.target.value) : null })} placeholder="—" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          <Field label="Competencia">
            <Select value={q.fundamentalId ?? ''} onChange={(e) => setQ({ ...q, fundamentalId: e.target.value ? Number(e.target.value) : null })} placeholder="—" options={fundamentals.map((f) => ({ value: f.id, label: f.shortName }))} />
          </Field>
        </div>
        <Field label="Enunciado" hint="Puedes escribir fórmulas entre $…$, p. ej. $\frac{3}{4}$">
          <Textarea rows={3} value={q.statement} onChange={(e) => setQ({ ...q, statement: e.target.value })} />
        </Field>
        {q.statement.includes('$') && (
          <div className="rounded-xl bg-surface-2 p-3 text-sm">
            <RichMath text={q.statement} />
          </div>
        )}

        {q.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <p className="label">Opciones (marca la correcta)</p>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" checked={q.answer === i} onChange={() => setQ({ ...q, answer: i })} className="accent-violet-500" />
                <span className="w-5 text-sm font-bold text-ink-3">{String.fromCharCode(97 + i)})</span>
                <Input value={o} onChange={(e) => setQ({ ...q, options: options.map((x, k) => (k === i ? e.target.value : x)) })} />
                <button className="icon-btn hover:text-brand-red" onClick={() => setQ({ ...q, options: options.filter((_, k) => k !== i), answer: 0 })} aria-label="Quitar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setQ({ ...q, options: [...options, ''] })}>
              Opción
            </Button>
          </div>
        )}
        {q.type === 'TRUE_FALSE' && (
          <Field label="Respuesta correcta">
            <Select value={String(q.answer)} onChange={(e) => setQ({ ...q, answer: e.target.value === 'true' })} options={[{ value: 'true', label: 'Verdadero' }, { value: 'false', label: 'Falso' }]} />
          </Field>
        )}
        {q.type === 'MATCHING' && (
          <div className="space-y-2">
            <p className="label">Pares a relacionar</p>
            {pairs.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={p[0]} onChange={(e) => setQ({ ...q, answer: pairs.map((x, k) => (k === i ? [e.target.value, x[1]] : x)) })} placeholder="Columna A" />
                <Input value={p[1]} onChange={(e) => setQ({ ...q, answer: pairs.map((x, k) => (k === i ? [x[0], e.target.value] : x)) })} placeholder="Columna B" />
                <button className="icon-btn hover:text-brand-red" onClick={() => setQ({ ...q, answer: pairs.filter((_, k) => k !== i) })} aria-label="Quitar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setQ({ ...q, answer: [...pairs, ['', '']] })}>
              Par
            </Button>
          </div>
        )}
        {['SHORT_ANSWER', 'COMPLETE', 'PROBLEM', 'DEVELOPMENT', 'GRAPH'].includes(q.type) && (
          <Field label={q.type === 'DEVELOPMENT' ? 'Respuesta esperada / criterios' : 'Respuesta'}>
            <Input value={String(q.answer ?? '')} onChange={(e) => setQ({ ...q, answer: e.target.value })} />
          </Field>
        )}
        <Field label="Solución / procedimiento">
          <Textarea rows={3} value={q.solution ?? ''} onChange={(e) => setQ({ ...q, solution: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
