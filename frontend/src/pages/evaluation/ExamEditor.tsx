import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, FileDown, Key, Plus, Printer, Save, Search, Trash2 } from 'lucide-react'
import { evaluationApi } from '@services/educraft'
import type { EvaluationType, Exam, ExamVersions, Question } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useGrades } from '@hooks/useCatalog'
import { useDebounce } from '@hooks/useDebounce'
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, Modal, RichMath, Select, Spinner, Tabs, Textarea } from '@components/ui'
import { escapeHtml as e, exportWord, printDocument } from '@lib/exporters'
import { DIFFICULTY, EVALUATION_TYPES, QUESTION_TYPES } from '@lib/labels'
import { slugify } from '@lib/format'
import { formatAnswer } from './QuestionBankTab'

type Item = { question: Question; points: number | null }

function versionHtml(exam: ExamVersions['exam'], v: ExamVersions['versions'][number], withKey: boolean) {
  const qs = v.questions
    .map((q) => {
      const opts =
        q.type === 'MULTIPLE_CHOICE' && q.options
          ? `<ol type="a">${q.options.map((o) => `<li>${e(o)}</li>`).join('')}</ol>`
          : q.type === 'TRUE_FALSE'
            ? '<p>( ) Verdadero &nbsp;&nbsp; ( ) Falso</p>'
            : q.type === 'MATCHING'
              ? '<p class="muted">Relaciona las columnas.</p>'
              : '<p style="height:60px"></p>'
      return `<div style="margin-bottom:12px"><p><b>${q.number}.</b> ${e(q.statement).replace(/\n/g, '<br/>')} <span class="muted">(${q.points} pts)</span></p>${opts}</div>`
    })
    .join('')
  const key = withKey ? `<h2>Clave de respuestas — Versión ${v.label}</h2><table><tr><th>No.</th><th>Respuesta</th></tr>${v.answerKey.map((k) => `<tr><td>${k.number}</td><td>${e(k.answer)}</td></tr>`).join('')}</table>` : ''
  return `<h1>${e(exam.title)} — Versión ${v.label}</h1><p class="muted">Nombre: ____________________________ &nbsp; Sección: ______ &nbsp; Fecha: __________ &nbsp; Puntuación: ____ / ${v.totalPoints}${exam.durationMinutes ? ` &nbsp; Tiempo: ${exam.durationMinutes} min` : ''}</p>${exam.instructions ? `<p><b>Instrucciones:</b> ${e(exam.instructions)}</p>` : ''}${withKey ? '' : qs}${key}`
}

export default function ExamEditor() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const grades = useGrades()
  const { success, error } = useFeedback()
  const [exam, setExam] = useState<Exam | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [versions, setVersions] = useState<ExamVersions | null>(null)
  const [tab, setTab] = useState<'edit' | 'versions'>('edit')
  const [picker, setPicker] = useState(false)
  const [bank, setBank] = useState<Question[]>([])
  const [pickQ, setPickQ] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeVersion, setGradeVersion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [gradeResult, setGradeResult] = useState<{ score: number; objectivePoints: number; totalPoints: number } | null>(null)
  const term = useDebounce(pickQ, 250)

  const load = () =>
    evaluationApi.exam(id).then((x) => {
      setExam(x)
      setItems((x.questions ?? []).map((q) => ({ question: q.question, points: q.points })))
    })
  useEffect(() => {
    void load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (picker) evaluationApi.questions({ q: term || undefined }).then(setBank).catch(() => setBank([]))
  }, [picker, term])

  useEffect(() => {
    if (tab === 'versions' && exam) evaluationApi.versions(id, exam.versions).then(setVersions).catch(() => setVersions(null))
  }, [tab, exam, id])

  if (!exam) return <Spinner />

  const save = async () => {
    setSaving(true)
    try {
      const updated = await evaluationApi.updateExam(id, {
        title: exam.title,
        instructions: exam.instructions ?? undefined,
        durationMinutes: exam.durationMinutes ?? undefined,
        gradeId: exam.gradeId ?? undefined,
        evaluationType: exam.evaluationType,
        versions: exam.versions,
        shuffle: exam.shuffle,
        questions: items.map((i) => ({ questionId: i.question.id, points: i.points ?? undefined })),
      })
      setExam(updated)
      setVersions(null)
      success('Examen guardado')
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const move = (k: number, dir: number) => {
    const to = k + dir
    if (to < 0 || to >= items.length) return
    const next = [...items]
    ;[next[k], next[to]] = [next[to], next[k]]
    setItems(next)
  }
  const total = items.reduce((a, i) => a + (i.points ?? i.question.points), 0)
  const objective = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'COMPLETE']

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => navigate('/app/evaluacion')} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-brand-purple">
          <ArrowLeft className="h-4 w-4" /> Evaluación
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'edit', label: 'Preguntas' },
              { key: 'versions', label: 'Versiones y clave' },
            ]}
          />
          <Button variant="secondary" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => setGrading(true)}>
            Corrección automática
          </Button>
          <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={save} loading={saving}>
            Guardar
          </Button>
        </div>
      </div>

      {tab === 'edit' ? (
        <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
          <Card className="card-pad h-fit space-y-3">
            <CardHeader title="Datos del examen" className="mb-0" />
            <Field label="Título">
              <Input value={exam.title} onChange={(ev) => setExam({ ...exam, title: ev.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select value={exam.evaluationType} onChange={(ev) => setExam({ ...exam, evaluationType: ev.target.value as EvaluationType })} options={Object.entries(EVALUATION_TYPES).map(([v, l]) => ({ value: v, label: l }))} />
              </Field>
              <Field label="Duración (min)">
                <Input type="number" min={5} value={exam.durationMinutes ?? ''} onChange={(ev) => setExam({ ...exam, durationMinutes: ev.target.value ? Number(ev.target.value) : null })} />
              </Field>
              <Field label="Grado">
                <Select value={exam.gradeId ?? ''} onChange={(ev) => setExam({ ...exam, gradeId: ev.target.value ? Number(ev.target.value) : null })} placeholder="—" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
              </Field>
              <Field label="Versiones">
                <Input type="number" min={1} max={6} value={exam.versions} onChange={(ev) => setExam({ ...exam, versions: Number(ev.target.value) })} />
              </Field>
            </div>
            <Checkbox checked={exam.shuffle} onChange={(v) => setExam({ ...exam, shuffle: v })} label="Barajar preguntas y opciones en cada versión" />
            <Field label="Instrucciones">
              <Textarea value={exam.instructions ?? ''} onChange={(ev) => setExam({ ...exam, instructions: ev.target.value })} />
            </Field>
            <p className="text-sm font-semibold text-ink">
              {items.length} preguntas · {total} puntos
            </p>
          </Card>
          <Card className="card-pad">
            <CardHeader
              title="Preguntas"
              action={
                <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setPicked([]); setPicker(true) }}>
                  Agregar del banco
                </Button>
              }
            />
            <div className="space-y-2">
              {items.map((it, k) => (
                <div key={it.question.id} className="rounded-2xl border border-line p-3">
                  <div className="flex items-start gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">{k + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-1">
                        <Badge tone="purple">{QUESTION_TYPES[it.question.type]}</Badge>
                        <Badge tone={DIFFICULTY[it.question.difficulty].tone}>{DIFFICULTY[it.question.difficulty].label}</Badge>
                      </div>
                      <p className="text-sm text-ink">
                        <RichMath text={it.question.statement} />
                      </p>
                      {Array.isArray(it.question.options) && (
                        <ol className="mt-1 grid list-[lower-alpha] gap-x-6 pl-5 text-xs text-ink-2 sm:grid-cols-2">
                          {(it.question.options as string[]).map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ol>
                      )}
                      <p className="mt-1 text-xs text-emerald-600">Respuesta: {formatAnswer(it.question)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <input type="number" min={0} step="0.5" value={it.points ?? it.question.points} onChange={(ev) => setItems(items.map((x, i) => (i === k ? { ...x, points: Number(ev.target.value) } : x)))} className="input h-8 w-16 text-center text-xs" aria-label="Puntos" />
                      <div className="flex">
                        <button className="icon-btn h-7 w-7" onClick={() => move(k, -1)} aria-label="Subir">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="icon-btn h-7 w-7" onClick={() => move(k, 1)} aria-label="Bajar">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button className="icon-btn h-7 w-7 hover:text-brand-red" onClick={() => setItems(items.filter((_, i) => i !== k))} aria-label="Quitar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-3">Agrega preguntas desde tu banco.</p>}
            </div>
          </Card>
        </div>
      ) : !versions ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {versions.versions.map((v) => (
            <Card key={v.label} className="card-pad">
              <CardHeader
                title={`Versión ${v.label}`}
                subtitle={`${v.questions.length} preguntas · ${v.totalPoints} puntos`}
                action={
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => printDocument(`${versions.exam.title} ${v.label}`, versionHtml(versions.exam, v, false), false)}>
                      Imprimir
                    </Button>
                    <Button size="sm" variant="secondary" icon={<Key className="h-3.5 w-3.5" />} onClick={() => printDocument(`Clave ${v.label}`, versionHtml(versions.exam, v, true), false)}>
                      Clave
                    </Button>
                    <Button size="sm" variant="secondary" icon={<FileDown className="h-3.5 w-3.5" />} onClick={() => exportWord(versions.exam.title, versionHtml(versions.exam, v, false) + versionHtml(versions.exam, v, true), `${slugify(versions.exam.title)}-${v.label}`)}>
                      Word
                    </Button>
                  </div>
                }
              />
              <ol className="space-y-2 text-sm text-ink-2">
                {v.questions.map((q) => (
                  <li key={q.number}>
                    <b>{q.number}.</b> <RichMath text={q.statement.split('\n')[0]} />
                    {q.options && <span className="block pl-5 text-xs text-ink-3">{q.options.map((o, i) => `${String.fromCharCode(97 + i)}) ${o}`).join('   ')}</span>}
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded-xl bg-soft-green p-3 text-xs text-emerald-800 dark:text-emerald-200">
                <b>Clave:</b> {v.answerKey.map((k) => `${k.number}: ${k.answer}`).join(' · ')}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        size="lg"
        title="Agregar preguntas del banco"
        footer={
          <Button
            disabled={!picked.length}
            onClick={() => {
              const add = bank.filter((q) => picked.includes(q.id) && !items.some((i) => i.question.id === q.id)).map((q) => ({ question: q, points: null }))
              setItems([...items, ...add])
              setPicker(false)
            }}
          >
            Agregar ({picked.length})
          </Button>
        }
      >
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input value={pickQ} onChange={(ev) => setPickQ(ev.target.value)} placeholder="Buscar en el banco" className="input pl-9" />
        </div>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {bank.map((q) => (
            <label key={q.id} className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line p-3">
              <input type="checkbox" checked={picked.includes(q.id)} onChange={(ev) => setPicked(ev.target.checked ? [...picked, q.id] : picked.filter((x) => x !== q.id))} className="mt-1 accent-violet-500" disabled={items.some((i) => i.question.id === q.id)} />
              <div>
                <div className="flex gap-1">
                  <Badge tone="purple">{QUESTION_TYPES[q.type]}</Badge>
                  <Badge>{q.topic}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink">
                  <RichMath text={q.statement} />
                </p>
              </div>
            </label>
          ))}
          {!bank.length && <p className="text-sm text-ink-3">No hay preguntas que coincidan.</p>}
        </div>
      </Modal>

      <Modal
        open={grading}
        onClose={() => {
          setGrading(false)
          setGradeResult(null)
        }}
        size="md"
        title="Corrección automática"
        subtitle="Preguntas objetivas: selección múltiple, verdadero/falso y completar"
        footer={
          <Button
            onClick={async () => {
              const payload: Record<number, unknown> = {}
              for (const [n, v] of Object.entries(answers)) {
                const q = versions?.versions[gradeVersion]?.questions.find((x) => x.number === Number(n))
                payload[Number(n)] = q?.type === 'MULTIPLE_CHOICE' ? v.toLowerCase().charCodeAt(0) - 97 : q?.type === 'TRUE_FALSE' ? v === 'V' : v
              }
              try {
                setGradeResult(await evaluationApi.grade(id, gradeVersion, payload))
              } catch (err) {
                error('No se pudo corregir', (err as Error).message)
              }
            }}
          >
            Corregir
          </Button>
        }
      >
        {!versions ? (
          <Button variant="secondary" onClick={() => evaluationApi.versions(id, exam.versions).then(setVersions)}>
            Cargar versiones
          </Button>
        ) : (
          <div className="space-y-3">
            <Select value={gradeVersion} onChange={(ev) => setGradeVersion(Number(ev.target.value))} options={versions.versions.map((v, i) => ({ value: i, label: `Versión ${v.label}` }))} className="w-auto" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {versions.versions[gradeVersion]?.questions
                .filter((q) => objective.includes(q.type))
                .map((q) => (
                  <label key={q.number} className="flex items-center gap-2 text-sm">
                    <b className="w-6">{q.number}.</b>
                    <input value={answers[q.number] ?? ''} onChange={(ev) => setAnswers({ ...answers, [q.number]: ev.target.value })} className="input h-8" placeholder={q.type === 'MULTIPLE_CHOICE' ? 'a, b, c…' : q.type === 'TRUE_FALSE' ? 'V / F' : 'respuesta'} />
                  </label>
                ))}
            </div>
            {gradeResult && (
              <p className="rounded-xl bg-soft-green px-3 py-2 text-sm font-bold text-emerald-700">
                Puntos objetivos: {gradeResult.score} / {gradeResult.objectivePoints} (total del examen: {gradeResult.totalPoints})
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
