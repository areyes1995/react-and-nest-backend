import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, FileQuestion, Sparkles } from 'lucide-react'
import { aiApi } from '@services/educraft'
import { useFeedback } from '@context/ToastContext'
import { useFundamentals, useGrades } from '@hooks/useCatalog'
import { Button, Field, Input, Modal, Select } from '@components/ui'
import { cn } from '@lib/cn'

type Kind = 'exam' | 'rubric' | 'checklist'

/** "Crear evaluación": examen automático o rúbrica / lista de cotejo. */
export function CreateEvaluationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const grades = useGrades()
  const fundamentals = useFundamentals()
  const { success, error } = useFeedback()
  const [kind, setKind] = useState<Kind | null>(null)
  const [topic, setTopic] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [fundamentalId, setFundamentalId] = useState('')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const close = () => {
    setKind(null)
    onClose()
  }

  const create = async () => {
    if (!kind || !topic.trim()) return
    setLoading(true)
    const common = { topic, gradeId: gradeId ? Number(gradeId) : undefined, fundamentalId: fundamentalId ? Number(fundamentalId) : undefined, save: true }
    try {
      if (kind === 'exam') {
        const res = await aiApi.exam({ ...common, count, types: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'COMPLETE', 'PROBLEM'] })
        success('Examen creado', `${res.questions.length} preguntas guardadas en tu banco.`)
        close()
        navigate(`/app/evaluacion/examenes/${res.exam!.id}`)
      } else {
        const res = kind === 'rubric' ? await aiApi.rubric(common) : await aiApi.checklist(common)
        success(kind === 'rubric' ? 'Rúbrica creada' : 'Lista de cotejo creada')
        close()
        navigate(`/app/evaluacion?tab=instrumentos&id=${res.instrument.id}`)
      }
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="md" title="Crear evaluación" subtitle="Elige qué quieres preparar">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setKind('exam')}
          className={cn('flex flex-col items-center gap-2 rounded-3xl border-2 p-5 text-center transition', kind === 'exam' ? 'border-brand-orange bg-soft-orange' : 'border-line hover:border-orange-200')}
        >
          <FileQuestion className="h-10 w-10 text-orange-500" />
          <span className="text-sm font-bold text-ink">Crear Examen Automático</span>
          <span className="text-xs text-ink-3">Preguntas con respuestas y versiones</span>
        </button>
        <button
          onClick={() => setKind(kind === 'rubric' || kind === 'checklist' ? kind : 'rubric')}
          className={cn('flex flex-col items-center gap-2 rounded-3xl border-2 p-5 text-center transition', kind === 'rubric' || kind === 'checklist' ? 'border-brand-purple bg-soft-purple' : 'border-line hover:border-violet-200')}
        >
          <ClipboardCheck className="h-10 w-10 text-violet-500" />
          <span className="text-sm font-bold text-ink">Diseñar Rúbrica / Lista de Cotejo</span>
          <span className="text-xs text-ink-3">Criterios y niveles de logro</span>
        </button>
      </div>

      {kind && (
        <div className="mt-5 space-y-3 animate-fade-in">
          {kind !== 'exam' && (
            <div className="flex gap-2">
              <button className={`chip ${kind === 'rubric' ? 'chip-active' : ''}`} onClick={() => setKind('rubric')}>
                Rúbrica
              </button>
              <button className={`chip ${kind === 'checklist' ? 'chip-active' : ''}`} onClick={() => setKind('checklist')}>
                Lista de cotejo
              </button>
            </div>
          )}
          <Field label="Tema">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej.: Teorema de Pitágoras" autoFocus />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Competencia a evaluar">
              <Select value={fundamentalId} onChange={(e) => setFundamentalId(e.target.value)} placeholder="Selecciona" options={fundamentals.map((f) => ({ value: f.id, label: f.name }))} />
            </Field>
            <Field label="Grado">
              <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)} placeholder="Cualquiera" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
            </Field>
          </div>
          {kind === 'exam' && (
            <Field label="Número de preguntas">
              <Input type="number" min={2} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </Field>
          )}
          <Button className="w-full" onClick={create} loading={loading} disabled={!topic.trim()} icon={<Sparkles className="h-4 w-4" />}>
            Generar y abrir el editor
          </Button>
        </div>
      )}
    </Modal>
  )
}
