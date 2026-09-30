import { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react'
import { aiApi, evaluationApi } from '@services/educraft'
import type { ChecklistContent, EvaluationInstrument, InstrumentType, RatingScaleContent, RubricContent } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useFundamentals, useGrades } from '@hooks/useCatalog'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner } from '@components/ui'
import { escapeHtml as e, exportExcel, exportWord, printDocument } from '@lib/exporters'
import { INSTRUMENT_TYPES } from '@lib/labels'
import { formatDate, slugify } from '@lib/format'
import { cn } from '@lib/cn'

const LEVEL_COLORS = ['bg-soft-green', 'bg-soft-blue', 'bg-soft-yellow', 'bg-soft-red']

function defaultContent(type: InstrumentType): EvaluationInstrument['content'] {
  if (type === 'RUBRIC')
    return { levels: ['Excelente', 'Logrado', 'En proceso', 'Inicio'], scores: [4, 3, 2, 1], criteria: [{ criterion: 'Criterio 1', weight: 100, descriptors: ['', '', '', ''] }] }
  if (type === 'CHECKLIST') return { items: [{ text: 'Representa datos' }, { text: 'Resuelve correctamente' }, { text: 'Argumenta procedimientos' }, { text: 'Comunica resultados' }] }
  return {
    scale: '1-4',
    levels: [
      { value: '4', label: 'Excelente' },
      { value: '3', label: 'Logrado' },
      { value: '2', label: 'En proceso' },
      { value: '1', label: 'Inicio' },
    ],
    items: [{ text: 'Sigue un procedimiento ordenado' }],
  }
}

const SCALES: Record<string, RatingScaleContent['levels']> = {
  '1-4': [4, 3, 2, 1].map((v, i) => ({ value: String(v), label: ['Excelente', 'Logrado', 'En proceso', 'Inicio'][i] })),
  '1-5': [5, 4, 3, 2, 1].map((v, i) => ({ value: String(v), label: ['Siempre', 'Casi siempre', 'A veces', 'Casi nunca', 'Nunca'][i] })),
  'AD-A-B-C': [
    { value: 'AD', label: 'Logro destacado' },
    { value: 'A', label: 'Logro esperado' },
    { value: 'B', label: 'En proceso' },
    { value: 'C', label: 'En inicio' },
  ],
}

export function instrumentHtml(inst: EvaluationInstrument) {
  let body = ''
  if (inst.type === 'RUBRIC') {
    const c = inst.content as RubricContent
    body = `<table><tr><th>Criterios</th><th>Peso</th>${c.levels.map((l, i) => `<th>${e(l)}${c.scores ? ` (${c.scores[i]})` : ''}</th>`).join('')}</tr>${c.criteria
      .map((cr) => `<tr><td><b>${e(cr.criterion)}</b></td><td class="center">${cr.weight}%</td>${cr.descriptors.map((d) => `<td>${e(d)}</td>`).join('')}</tr>`)
      .join('')}</table>`
  } else if (inst.type === 'CHECKLIST') {
    const c = inst.content as ChecklistContent
    body = `<table><tr><th>Indicador</th><th>Sí</th><th>No</th><th>Observaciones</th></tr>${c.items.map((i) => `<tr><td>☐ ${e(i.text)}</td><td></td><td></td><td></td></tr>`).join('')}</table>`
  } else {
    const c = inst.content as RatingScaleContent
    body = `<table><tr><th>Aspecto</th>${c.levels.map((l) => `<th>${e(l.value)} · ${e(l.label)}</th>`).join('')}<th>Comentario</th></tr>${c.items.map((i) => `<tr><td>${e(i.text)}</td>${c.levels.map(() => '<td></td>').join('')}<td></td></tr>`).join('')}</table>`
  }
  return `<h1>${e(inst.title)}</h1>${inst.description ? `<p class="muted">${e(inst.description)}</p>` : ''}<p class="muted">Estudiante: __________________________ &nbsp; Sección: ______ &nbsp; Fecha: __________</p>${body}`
}

export function InstrumentsTab({ type, openId }: { type: InstrumentType; openId?: number | null }) {
  const grades = useGrades()
  const fundamentals = useFundamentals()
  const { success, error, confirm } = useFeedback()
  const { data, loading, reload } = useAsync(() => evaluationApi.instruments(type), [type])
  const [editing, setEditing] = useState<EvaluationInstrument | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [ai, setAi] = useState({ topic: '', gradeId: '', fundamentalId: '', criteriaCount: 4, scale: '1-4' as '1-4' | '1-5' | 'AD-A-B-C' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (openId && data) {
      const found = data.find((x) => x.id === openId)
      if (found) setEditing(found)
    }
  }, [openId, data])

  const startNew = () =>
    setEditing({ id: 0, type, title: `${INSTRUMENT_TYPES[type]} sin título`, description: null, gradeId: null, fundamentalId: null, content: defaultContent(type), aiGenerated: false, updatedAt: new Date().toISOString() })

  const save = async () => {
    if (!editing) return
    setBusy(true)
    try {
      const body = { type, title: editing.title, description: editing.description ?? undefined, gradeId: editing.gradeId, fundamentalId: editing.fundamentalId, content: editing.content }
      const saved = editing.id ? await evaluationApi.updateInstrument(editing.id, body) : await evaluationApi.createInstrument(body)
      setEditing({ ...editing, ...saved })
      success('Instrumento guardado')
      void reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const generate = async () => {
    if (!ai.topic.trim()) return
    setBusy(true)
    const common = { topic: ai.topic, gradeId: ai.gradeId ? Number(ai.gradeId) : undefined, fundamentalId: ai.fundamentalId ? Number(ai.fundamentalId) : undefined, save: true }
    try {
      const res = type === 'RUBRIC' ? await aiApi.rubric({ ...common, criteriaCount: ai.criteriaCount }) : type === 'CHECKLIST' ? await aiApi.checklist(common) : await aiApi.ratingScale({ ...common, scale: ai.scale })
      setEditing(res.instrument)
      setAiOpen(false)
      success(`${INSTRUMENT_TYPES[type]} generada`)
      void reload()
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const exportExcelFile = (inst: EvaluationInstrument) => {
    if (inst.type === 'RUBRIC') {
      const c = inst.content as RubricContent
      void exportExcel([{ name: 'Rúbrica', title: inst.title, header: ['Criterio', 'Peso', ...c.levels], rows: c.criteria.map((cr) => [cr.criterion, cr.weight, ...cr.descriptors]), widths: [28, 8, 30, 30, 30, 30] }], slugify(inst.title))
    } else if (inst.type === 'CHECKLIST') {
      const c = inst.content as ChecklistContent
      void exportExcel([{ name: 'Lista de cotejo', title: inst.title, header: ['Indicador', 'Sí', 'No', 'Observaciones'], rows: c.items.map((i) => [i.text, '', '', '']), widths: [45, 6, 6, 30] }], slugify(inst.title))
    } else {
      const c = inst.content as RatingScaleContent
      void exportExcel([{ name: 'Escala', title: inst.title, header: ['Aspecto', ...c.levels.map((l) => `${l.value} ${l.label}`), 'Comentario'], rows: c.items.map((i) => [i.text, ...c.levels.map(() => ''), '']), widths: [40] }], slugify(inst.title))
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
      <Card className="card-pad h-fit">
        <div className="mb-3 flex gap-2">
          <Button size="sm" className="flex-1" icon={<Plus className="h-3.5 w-3.5" />} onClick={startNew}>
            Nueva
          </Button>
          <Button size="sm" variant="soft" className="flex-1" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setAiOpen(true)}>
            Con IA
          </Button>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : !data?.length ? (
          <p className="text-xs text-ink-3">Aún no tienes instrumentos de este tipo.</p>
        ) : (
          <ul className="space-y-1">
            {data.map((inst) => (
              <li key={inst.id}>
                <button onClick={() => setEditing(inst)} className={cn('w-full rounded-xl px-3 py-2 text-left text-sm', editing?.id === inst.id ? 'bg-soft-purple font-bold text-brand-purple' : 'hover:bg-surface-3')}>
                  <span className="block truncate">{inst.title}</span>
                  <span className="text-[0.68rem] text-ink-3">
                    {inst.grade?.name ?? 'General'} · {formatDate(inst.updatedAt)} {inst.aiGenerated && '· IA'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!editing ? (
        <Card className="card-pad">
          <EmptyState title={`Selecciona o crea una ${INSTRUMENT_TYPES[type].toLowerCase()}`} description="Construye el instrumento visualmente o pide a la IA que lo genere según la competencia." />
        </Card>
      ) : (
        <Card className="card-pad space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Título" className="min-w-[16rem] flex-1">
              <Input value={editing.title} onChange={(ev) => setEditing({ ...editing, title: ev.target.value })} />
            </Field>
            <Field label="Grado">
              <Select value={editing.gradeId ?? ''} onChange={(ev) => setEditing({ ...editing, gradeId: ev.target.value ? Number(ev.target.value) : null })} placeholder="General" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
            </Field>
            <Field label="Competencia">
              <Select value={editing.fundamentalId ?? ''} onChange={(ev) => setEditing({ ...editing, fundamentalId: ev.target.value ? Number(ev.target.value) : null })} placeholder="—" options={fundamentals.map((f) => ({ value: f.id, label: f.shortName }))} />
            </Field>
          </div>

          {type === 'RUBRIC' && <RubricBuilder content={editing.content as RubricContent} onChange={(content) => setEditing({ ...editing, content })} />}
          {type === 'CHECKLIST' && <ChecklistBuilder content={editing.content as ChecklistContent} onChange={(content) => setEditing({ ...editing, content })} />}
          {type === 'RATING_SCALE' && <ScaleBuilder content={editing.content as RatingScaleContent} onChange={(content) => setEditing({ ...editing, content })} />}

          <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => printDocument(editing.title, instrumentHtml(editing))}>
                Imprimir / PDF
              </Button>
              <Button variant="secondary" size="sm" icon={<FileDown className="h-3.5 w-3.5" />} onClick={() => exportWord(editing.title, instrumentHtml(editing), slugify(editing.title))}>
                Word
              </Button>
              <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => exportExcelFile(editing)}>
                Excel
              </Button>
            </div>
            <div className="flex gap-2">
              {editing.id > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={async () => {
                    if (await confirm({ title: 'Eliminar instrumento', danger: true, confirmLabel: 'Eliminar' })) {
                      await evaluationApi.removeInstrument(editing.id)
                      setEditing(null)
                      void reload()
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
              <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={save} loading={busy}>
                Guardar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={`Generar ${INSTRUMENT_TYPES[type].toLowerCase()} con IA`}
        footer={
          <Button onClick={generate} loading={busy} disabled={!ai.topic.trim()} icon={<Sparkles className="h-4 w-4" />}>
            Generar
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="Tema">
            <Input value={ai.topic} onChange={(ev) => setAi({ ...ai, topic: ev.target.value })} placeholder="Ej.: resolución de ecuaciones lineales" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Grado">
              <Select value={ai.gradeId} onChange={(ev) => setAi({ ...ai, gradeId: ev.target.value })} placeholder="General" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
            </Field>
            <Field label="Competencia">
              <Select value={ai.fundamentalId} onChange={(ev) => setAi({ ...ai, fundamentalId: ev.target.value })} placeholder="—" options={fundamentals.map((f) => ({ value: f.id, label: f.name }))} />
            </Field>
            {type === 'RUBRIC' && (
              <Field label="Número de criterios">
                <Input type="number" min={2} max={6} value={ai.criteriaCount} onChange={(ev) => setAi({ ...ai, criteriaCount: Number(ev.target.value) })} />
              </Field>
            )}
            {type === 'RATING_SCALE' && (
              <Field label="Escala">
                <Select value={ai.scale} onChange={(ev) => setAi({ ...ai, scale: ev.target.value as typeof ai.scale })} options={Object.keys(SCALES).map((k) => ({ value: k, label: k }))} />
              </Field>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function RubricBuilder({ content, onChange }: { content: RubricContent; onChange: (c: RubricContent) => void }) {
  const total = content.criteria.reduce((a, c) => a + (Number(c.weight) || 0), 0)
  const setCriterion = (i: number, patch: Partial<RubricContent['criteria'][number]>) => onChange({ ...content, criteria: content.criteria.map((c, k) => (k === i ? { ...c, ...patch } : c)) })
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[56rem] border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-56 border-b border-line bg-surface-2 p-2 text-left">Criterios</th>
              <th className="w-16 border-b border-line bg-surface-2 p-2">Peso</th>
              {content.levels.map((l, i) => (
                <th key={i} className={cn('border-b border-line p-2', LEVEL_COLORS[i])}>
                  <input value={l} onChange={(ev) => onChange({ ...content, levels: content.levels.map((x, k) => (k === i ? ev.target.value : x)) })} className="w-full bg-transparent text-center font-bold text-ink outline-none" />
                  {content.scores && <span className="block text-[0.65rem] font-semibold text-ink-3">{content.scores[i]} pts</span>}
                </th>
              ))}
              <th className="w-10 border-b border-line bg-surface-2" />
            </tr>
          </thead>
          <tbody>
            {content.criteria.map((c, i) => (
              <tr key={i} className="align-top">
                <td className="border-b border-line p-1.5">
                  <textarea value={c.criterion} onChange={(ev) => setCriterion(i, { criterion: ev.target.value })} rows={3} className="input text-xs font-semibold" />
                </td>
                <td className="border-b border-line p-1.5">
                  <input type="number" value={c.weight} onChange={(ev) => setCriterion(i, { weight: Number(ev.target.value) })} className="input px-1 text-center text-xs" />
                </td>
                {content.levels.map((_, k) => (
                  <td key={k} className="border-b border-line p-1.5">
                    <textarea value={c.descriptors[k] ?? ''} onChange={(ev) => setCriterion(i, { descriptors: content.levels.map((__, j) => (j === k ? ev.target.value : c.descriptors[j] ?? '')) })} rows={3} className="input text-xs" />
                  </td>
                ))}
                <td className="border-b border-line p-1.5">
                  <button className="icon-btn h-8 w-8 hover:text-brand-red" onClick={() => onChange({ ...content, criteria: content.criteria.filter((_, k) => k !== i) })} aria-label="Quitar criterio">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onChange({ ...content, criteria: [...content.criteria, { criterion: 'Nuevo criterio', weight: 0, descriptors: content.levels.map(() => '') }] })}>
          Criterio
        </Button>
        <Badge tone={total === 100 ? 'green' : 'yellow'}>Pesos: {total}%</Badge>
      </div>
    </div>
  )
}

function ChecklistBuilder({ content, onChange }: { content: ChecklistContent; onChange: (c: ChecklistContent) => void }) {
  return (
    <div className="space-y-2">
      {content.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-violet-300" />
          <Input value={item.text} onChange={(ev) => onChange({ items: content.items.map((x, k) => (k === i ? { text: ev.target.value } : x)) })} />
          <button className="icon-btn hover:text-brand-red" onClick={() => onChange({ items: content.items.filter((_, k) => k !== i) })} aria-label="Quitar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onChange({ items: [...content.items, { text: '' }] })}>
        Indicador
      </Button>
    </div>
  )
}

function ScaleBuilder({ content, onChange }: { content: RatingScaleContent; onChange: (c: RatingScaleContent) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label mb-0">Escala:</span>
        {Object.keys(SCALES).map((k) => (
          <button key={k} onClick={() => onChange({ ...content, scale: k, levels: SCALES[k] })} className={`chip ${content.scale === k ? 'chip-active' : ''}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {content.levels.map((l, i) => (
          <div key={i} className="flex items-center gap-1 rounded-xl bg-surface-2 px-2 py-1">
            <b className="text-sm text-brand-purple">{l.value}</b>
            <input value={l.label} onChange={(ev) => onChange({ ...content, levels: content.levels.map((x, k) => (k === i ? { ...x, label: ev.target.value } : x)) })} className="w-32 bg-transparent text-xs text-ink outline-none" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {content.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item.text} onChange={(ev) => onChange({ ...content, items: content.items.map((x, k) => (k === i ? { text: ev.target.value } : x)) })} placeholder="Aspecto a valorar" />
            <button className="icon-btn hover:text-brand-red" onClick={() => onChange({ ...content, items: content.items.filter((_, k) => k !== i) })} aria-label="Quitar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onChange({ ...content, items: [...content.items, { text: '' }] })}>
          Aspecto
        </Button>
      </div>
      <p className="text-xs text-ink-3">Al calificar una actividad con esta escala podrás agregar comentarios personalizados por estudiante.</p>
    </div>
  )
}
