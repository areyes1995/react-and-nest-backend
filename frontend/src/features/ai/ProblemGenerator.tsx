import { useState } from 'react'
import { ChevronDown, Copy, Save, Sparkles } from 'lucide-react'
import { aiApi, evaluationApi } from '@services/educraft'
import type { Difficulty, GeneratedProblem } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useFundamentals, useGrades } from '@hooks/useCatalog'
import { Badge, Button, Field, Input, RichMath, Select, Latex } from '@components/ui'
import { SourceBadge } from '@/features/common/SourceBadge'
import { DIFFICULTY } from '@lib/labels'
import { cn } from '@lib/cn'

/** 4.1 Generador de problemas contextualizados. */
export function ProblemGenerator({ initialTopic = '' }: { initialTopic?: string }) {
  const grades = useGrades()
  const fundamentals = useFundamentals()
  const { success, error } = useFeedback()
  const [form, setForm] = useState({ topic: initialTopic, gradeId: '', fundamentalId: '', context: '', difficulty: 'MEDIUM' as Difficulty, count: 3 })
  const [result, setResult] = useState<Awaited<ReturnType<typeof aiApi.problems>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState<number | null>(0)

  const generate = async () => {
    if (!form.topic.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.problems({
        topic: form.topic,
        gradeId: form.gradeId ? Number(form.gradeId) : undefined,
        fundamentalId: form.fundamentalId ? Number(form.fundamentalId) : undefined,
        context: form.context || undefined,
        difficulty: form.difficulty,
        count: form.count,
      })
      setResult(res)
      setOpen(0)
    } catch (err) {
      error('No se pudieron generar los problemas', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const saveToBank = async (p: GeneratedProblem) => {
    try {
      await evaluationApi.createQuestion({
        topic: form.topic,
        type: 'PROBLEM',
        statement: p.statement,
        answer: p.answer,
        solution: p.procedure.join('\n'),
        difficulty: form.difficulty,
        gradeId: form.gradeId ? Number(form.gradeId) : null,
        fundamentalId: form.fundamentalId ? Number(form.fundamentalId) : null,
        points: 5,
        aiGenerated: true,
      })
      success('Guardado en el banco de preguntas')
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-3">
        <Field label="Tema">
          <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Ej.: fracciones, Pitágoras, interés simple" />
        </Field>
        <Field label="Nivel (grado)">
          <Select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} placeholder="Cualquiera" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
        </Field>
        <Field label="Competencia">
          <Select value={form.fundamentalId} onChange={(e) => setForm({ ...form, fundamentalId: e.target.value })} placeholder="Cualquiera" options={fundamentals.map((f) => ({ value: f.id, label: f.name }))} />
        </Field>
        <Field label="Contexto" hint="Salud, finanzas, medio ambiente, deportes…">
          <Input value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Vida cotidiana" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dificultad">
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} />
          </Field>
          <Field label="Cantidad">
            <Input type="number" min={1} max={10} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
          </Field>
        </div>
        <Button className="w-full" onClick={generate} loading={loading} disabled={!form.topic.trim()} icon={<Sparkles className="h-4 w-4" />}>
          Generar problemas
        </Button>
      </div>

      <div className="min-w-0 space-y-3">
        {!result && (
          <div className="grid h-full min-h-60 place-items-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-3">
            Indica el tema, la competencia, el nivel, el contexto y la dificultad. Recibirás problemas con solución, procedimiento, respuesta y variantes fácil y difícil.
          </div>
        )}
        {result && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{result.problems.length} problema(s) sobre “{result.topic}”</p>
            <SourceBadge source={result.source} />
          </div>
        )}
        {result?.problems.map((p, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface-2">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start gap-3 p-4 text-left">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">{i + 1}</span>
              <span className="flex-1 text-sm text-ink">
                <RichMath text={p.statement} />
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-3 transition', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <div className="space-y-3 border-t border-line p-4 text-sm">
                {p.latex && (
                  <div className="rounded-xl bg-surface p-2 text-center">
                    <Latex block>{p.latex}</Latex>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-3">Procedimiento</p>
                  <ol className="list-decimal space-y-1 pl-5 text-ink-2">
                    {p.procedure.map((s, k) => (
                      <li key={k}>
                        <RichMath text={s} />
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="rounded-xl bg-soft-green px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">Respuesta: {p.answer}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-line p-3">
                    <Badge tone="green">Variante fácil</Badge>
                    <p className="mt-2 text-ink-2">{p.easierVariant.statement}</p>
                    <p className="mt-1 text-xs font-semibold text-ink-3">R: {p.easierVariant.answer}</p>
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <Badge tone="red">Variante difícil</Badge>
                    <p className="mt-2 text-ink-2">{p.harderVariant.statement}</p>
                    <p className="mt-1 text-xs font-semibold text-ink-3">R: {p.harderVariant.answer}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="soft" icon={<Save className="h-3.5 w-3.5" />} onClick={() => saveToBank(p)}>
                    Guardar en banco de preguntas
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => {
                      void navigator.clipboard.writeText(`${p.statement}\n\n${p.procedure.join('\n')}\nRespuesta: ${p.answer}`)
                      success('Copiado al portapapeles')
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
