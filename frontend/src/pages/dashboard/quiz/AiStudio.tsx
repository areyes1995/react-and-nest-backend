// ──────────────────────────────────────────────
// Estudio de IA — solo ADMIN y SUPERADMIN.
// Dos piezas:
//  - AiGenerator: nivel, tema, formato, cantidad y
//    enfoque → la IA escribe una tanda.
//  - AiReview: la tanda vuelve SIN guardar. El
//    administrador marca cuáles entran en la base
//    (origen IA) y si entran publicadas —los
//    estudiantes las verán y darán XP ×2— o como
//    borrador. También puede jugarlas antes.
// El backend impone el rol; esto solo lo oculta.
// ──────────────────────────────────────────────

import { useState, type ReactNode } from 'react'
import { Check, Database, Eye, EyeOff, Loader2, Play, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import type { LevelId } from '@features/academy/types'
import type { QuizFormat, QuizGenerateRequest, QuizMeta, QuizQuestion } from '@services/quiz'
import { saveQuizQuestions } from '@services/quiz'
import { COUNT_OPTIONS, FORMAT_OPTIONS, LEVEL_MODES, modeMeta } from './quizMeta'

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none'

const chip = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs font-medium transition ${
    active
      ? 'bg-[var(--poker-gold)] text-black'
      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
  }`

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-mini font-semibold text-sky-400">
      <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Solo administradores
    </span>
  )
}

// ─── Generador ───────────────────────────────

export interface AiGeneratorProps {
  meta: QuizMeta
  loading: boolean
  onGenerate: (request: QuizGenerateRequest) => void
}

export function AiGenerator({ meta, loading, onGenerate }: AiGeneratorProps) {
  const ai = meta.ai
  const [level, setLevel] = useState<LevelId>('beginner')
  const [category, setCategory] = useState('')
  const [format, setFormat] = useState<QuizFormat | 'mixed'>('mixed')
  const [count, setCount] = useState(5)
  const [topic, setTopic] = useState('')

  const counts = COUNT_OPTIONS.filter(value => !ai || value <= ai.maxQuestions)

  return (
    <section className="space-y-4 rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--poker-gold)_40%,transparent)] bg-[var(--bg-panel)] p-5">
      <header className="flex flex-wrap items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Generar preguntas con IA <AdminBadge />
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            La tanda vuelve sin guardar: la revisas, eliges cuáles entran en la base de datos (tipo IA) y si se
            publican para los estudiantes, donde valen XP ×2.
          </p>
        </div>
        {ai?.ready && (
          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-mini font-semibold text-emerald-400">
            {ai.provider} · {ai.model}
          </span>
        )}
      </header>

      {ai && !ai.ready && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.07] px-4 py-3 text-xs text-[var(--text-secondary)]">
          La generación con IA no está disponible.
          {ai.issues.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {ai.issues.map(issue => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset disabled={!ai?.ready || loading} className="space-y-4 disabled:opacity-50">
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_MODES.map(mode => (
            <button key={mode.id} type="button" onClick={() => setLevel(mode.id)} className={chip(level === mode.id)}>
              {mode.title}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tema">
            <select value={category} onChange={event => setCategory(event.target.value)} className={inputClass}>
              <option value="">Variado</option>
              {meta.categories.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Formato">
            <select
              value={format}
              onChange={event => setFormat(event.target.value as QuizFormat | 'mixed')}
              className={inputClass}
            >
              {FORMAT_OPTIONS.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad">
            <select value={count} onChange={event => setCount(Number(event.target.value))} className={inputClass}>
              {counts.map(value => (
                <option key={value} value={value}>
                  {value} preguntas
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Enfoque (opcional)">
          <input
            type="text"
            value={topic}
            maxLength={160}
            onChange={event => setTopic(event.target.value)}
            placeholder="Ej.: defender la ciega grande, faroles en el river…"
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={() =>
            onGenerate({
              level,
              category: category || undefined,
              format: format === 'mixed' ? undefined : format,
              count,
              topic: topic.trim() || undefined,
            })
          }
          className="press inline-flex items-center gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--poker-gold)_50%,transparent)] bg-[var(--poker-gold)]/10 px-4 py-2 text-sm font-semibold text-[var(--poker-gold)] transition hover:bg-[var(--poker-gold)]/20"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" strokeWidth={2} />}
          {loading ? 'La IA está escribiendo…' : 'Generar tanda'}
        </button>
      </fieldset>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-caption font-medium text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  )
}

// ─── Revisión y guardado ─────────────────────

export interface AiBatch {
  request: QuizGenerateRequest
  questions: QuizQuestion[]
  discarded: number
  model?: string
  /** Ids ya guardados en la base, y si entraron publicados. */
  saved: Record<string, 'published' | 'draft'>
}

export interface AiReviewProps {
  batch: AiBatch
  categoryLabel: (id: string) => string
  onSaved: (ids: string[], published: boolean) => void
  onPlay: () => void
  onRegenerate: () => void
  onDiscard: () => void
}

export function AiReview({ batch, categoryLabel, onSaved, onPlay, onRegenerate, onDiscard }: AiReviewProps) {
  const pending = batch.questions.filter(question => !batch.saved[question.id])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(pending.map(question => question.id)))
  const [publish, setPublish] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const toggle = (id: string) =>
    setSelected(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const chosen = batch.questions.filter(question => selected.has(question.id) && !batch.saved[question.id])

  const save = async () => {
    if (chosen.length === 0) return
    setSaving(true)
    setMessage(null)
    const result = await saveQuizQuestions(chosen, publish)
    setSaving(false)
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }
    onSaved(
      chosen.map(question => question.id),
      publish,
    )
    setSelected(new Set())
    setMessage({
      tone: 'ok',
      text: `${result.data.saved} guardadas en la base de datos como tipo IA · ${
        publish ? 'publicadas (XP ×2 para los estudiantes)' : 'como borrador'
      }${result.data.skipped ? ` · ${result.data.skipped} omitidas` : ''}.`,
    })
  }

  const level = modeMeta(batch.request.level)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Revisa la tanda <AdminBadge />
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {batch.questions.length} preguntas de nivel {level.title}
            {batch.model ? ` · ${batch.model}` : ''}
            {batch.discarded ? ` · ${batch.discarded} descartadas por no pasar la validación` : ''}. Nada se ha guardado
            todavía.
          </p>
        </div>
        <button
          type="button"
          onClick={onPlay}
          className="press inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2.5} /> Jugarlas
        </button>
      </header>

      <div className="space-y-2">
        {batch.questions.map(question => {
          const savedAs = batch.saved[question.id]
          const isSelected = selected.has(question.id)
          return (
            <label
              key={question.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                savedAs
                  ? 'cursor-default border-emerald-500/40 bg-emerald-500/[0.05]'
                  : isSelected
                    ? 'border-[color:color-mix(in_srgb,var(--poker-gold)_50%,transparent)] bg-[var(--bg-panel)]'
                    : 'border-[var(--border)] bg-[var(--bg-panel)] opacity-70'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--poker-gold)]"
                checked={Boolean(savedAs) || isSelected}
                disabled={Boolean(savedAs)}
                onChange={() => toggle(question.id)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-mini font-semibold uppercase tracking-wide">
                  <span className="rounded-md bg-[var(--poker-gold)]/15 px-1.5 py-0.5 text-[var(--poker-gold)]">Tipo: IA</span>
                  <span className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                    {categoryLabel(question.category)}
                  </span>
                  <span className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 text-[var(--text-muted)]">
                    {FORMAT_OPTIONS.find(item => item.id === question.format)?.label}
                  </span>
                  {savedAs && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      {savedAs === 'published' ? 'Guardada y publicada' : 'Guardada como borrador'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{question.question}</p>
                {(question.hole || question.board) && (
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    {question.hole && <>Mano: {question.hole}</>}
                    {question.hole && question.board && ' · '}
                    {question.board && <>Mesa: {question.board}</>}
                  </p>
                )}
                <ul className="grid gap-1 text-xs sm:grid-cols-2">
                  {question.options.map((option, index) => (
                    <li
                      key={option}
                      className={`flex items-start gap-1.5 rounded-md px-2 py-1 ${
                        index === question.answerIndex
                          ? 'bg-emerald-500/10 font-semibold text-emerald-400'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {index === question.answerIndex && <Check className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={3} />}
                      {option}
                    </li>
                  ))}
                </ul>
                <p className="border-l-2 border-[var(--border-active)] pl-3 text-xs leading-relaxed text-[var(--text-muted)]">
                  {question.explanation}
                </p>
              </div>
            </label>
          )
        })}
      </div>

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-xs ${
            message.tone === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400'
              : 'border-red-500/30 bg-red-500/[0.07] text-[var(--text-primary)]'
          }`}
        >
          {message.text}
        </p>
      )}

      <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)]/95 p-4 backdrop-blur">
        <div className="flex rounded-lg bg-[var(--bg-surface)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPublish(true)}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 ${publish ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)]'}`}
          >
            <Eye className="h-3.5 w-3.5" /> Publicar
          </button>
          <button
            type="button"
            onClick={() => setPublish(false)}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 ${!publish ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)]'}`}
          >
            <EyeOff className="h-3.5 w-3.5" /> Borrador
          </button>
        </div>
        <button
          type="button"
          disabled={saving || chosen.length === 0}
          onClick={() => void save()}
          className="press inline-flex items-center gap-2 rounded-lg bg-[var(--poker-gold)] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" strokeWidth={2} />}
          Guardar {chosen.length} en la base de datos
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRegenerate}
          className="text-xs font-semibold text-[var(--poker-gold)] hover:underline"
        >
          Generar otra
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" /> {pending.length === batch.questions.length ? 'Descartar tanda' : 'Cerrar'}
        </button>
      </footer>
    </div>
  )
}
