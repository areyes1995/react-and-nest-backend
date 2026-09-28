// ──────────────────────────────────────────────
// QuizPage — la arena de preguntas.
// Diseñada para volver: racha de días con su llama,
// estrellas por mesa que piden completarse, un reto
// del día con reloj que paga doble, y mesas que se
// juegan con un solo toque (sin formularios antes de
// la primera pregunta). Dentro de la ronda, el combo
// multiplica el XP hasta ×3.
//
// El generador de IA y el guardado en la base solo
// aparecen para ADMIN / SUPERADMIN (`meta.canGenerate`,
// que decide el backend).
//
// `?nivel=advanced` abre la ronda de ese nivel.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Check, Flame, Loader2, Sparkles, Star, Target, Trophy } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { useContentLanguage } from '@services/translate'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { formatCountdown, useDayCountdown } from '@features/progress/useDayCountdown'
import {
  AI_MULTIPLIER,
  COMBO_TIERS,
  DAILY_MULTIPLIER,
  PERFECT_BONUS,
  maxRoundXp,
  scoreRound,
  starsFor,
  type RoundScore,
} from '@features/quiz/xp'
import {
  STAR_MODES,
  dayKey,
  quizStreak,
  readQuizStats,
  recordRound,
  totalStars,
  writeQuizStats,
  type QuizStats,
  type RecordOutcome,
  type StarMode,
} from '@features/quiz/stats'
import {
  fetchQuizMeta,
  fetchQuizQuestions,
  generateQuiz,
  type QuizGenerateRequest,
  type QuizMeta,
  type QuizMode,
  type QuizQuestion,
} from '@services/quiz'
import QuizRunner from './QuizRunner'
import QuizResults from './QuizResults'
import { AiGenerator, AiReview, type AiBatch } from './AiStudio'
import { COUNT_OPTIONS, DAILY_COUNT, LEVEL_MODES, RANDOM_MODE, modeMeta, type ModeMeta } from './quizMeta'

/** De dónde salió la ronda, para poder repetirla igual. */
type BankOrigin = {
  type: 'bank'
  mode: QuizMode
  category?: string
  limit: number
  /** Solo preguntas de IA publicadas (la "ronda IA", XP ×2). */
  aiOnly?: boolean
  daily?: boolean
}
type Origin = BankOrigin | { type: 'ai'; request: QuizGenerateRequest }

type Stage =
  | { kind: 'menu' }
  | { kind: 'loading'; origin: Origin }
  | { kind: 'playing'; origin: Origin; questions: QuizQuestion[] }
  | {
      kind: 'finished'
      origin: Origin
      questions: QuizQuestion[]
      answers: number[]
      score: RoundScore
      outcome: RecordOutcome
    }
  | { kind: 'review' }

function starMode(origin: Origin): StarMode {
  if (origin.type === 'ai' || origin.aiOnly) return 'ai'
  if (origin.daily) return 'random'
  return origin.mode
}

export default function QuizPage() {
  const [params] = useSearchParams()
  const { addXp } = useStudentProgress()
  const countdown = useDayCountdown()

  const [meta, setMeta] = useState<QuizMeta | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [stats, setStats] = useState<QuizStats>(() => readQuizStats())
  const [stage, setStage] = useState<Stage>({ kind: 'menu' })
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(10)
  const [category, setCategory] = useState('')
  const [batch, setBatch] = useState<AiBatch | null>(null)

  const canGenerate = Boolean(meta?.canGenerate)
  const today = dayKey()
  const dailyDone = stats.dailyDone === today
  const streakDays = quizStreak(stats.days, today)

  const contentLang = useContentLanguage()
  const loadMeta = useCallback(async () => {
    setMetaError(null)
    const result = await fetchQuizMeta()
    if (result.ok) setMeta(result.data)
    else setMetaError(result.error)
  }, [])

  // `fetchQuizMeta` traduce al idioma de Ajustes: cambiarlo vuelve a pedirlo.
  useEffect(() => {
    void loadMeta()
  }, [loadMeta, contentLang])

  const categoryLabel = useCallback(
    (id: string) => meta?.categories.find(item => item.id === id)?.label ?? id,
    [meta],
  )

  const start = useCallback(async (origin: Origin) => {
    setError(null)
    setStage({ kind: 'loading', origin })

    if (origin.type === 'ai') {
      const result = await generateQuiz(origin.request)
      if (!result.ok) {
        setError(result.error)
        setStage({ kind: 'menu' })
        return
      }
      setBatch({
        request: origin.request,
        questions: result.data.questions,
        discarded: result.data.discarded,
        model: result.data.model,
        saved: {},
      })
      setStage({ kind: 'review' })
      return
    }

    const result = await fetchQuizQuestions({
      mode: origin.mode,
      category: origin.category,
      source: origin.aiOnly ? 'ai' : undefined,
      limit: origin.limit,
    })
    if (!result.ok) {
      setError(result.error)
      setStage({ kind: 'menu' })
      return
    }
    if (result.data.length === 0) {
      setError('No hay preguntas con esa combinación. Prueba otro tema o la mesa aleatoria.')
      setStage({ kind: 'menu' })
      return
    }
    setStage({ kind: 'playing', origin, questions: result.data })
  }, [])

  // `?nivel=` entra directo a la ronda: el enlace ya es la elección.
  useEffect(() => {
    const level = LEVEL_MODES.find(mode => mode.id === params.get('nivel'))
    if (level) void start({ type: 'bank', mode: level.id, limit: 10 })
    // Solo al abrir la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const play = (mode: QuizMode, extra: Partial<BankOrigin> = {}) =>
    void start({ type: 'bank', mode, category: category || undefined, limit, ...extra })

  const playDaily = () => void start({ type: 'bank', mode: 'random', limit: DAILY_COUNT, daily: true })

  /** El reto solo paga doble la primera vez del día. */
  const isPaidDaily = (origin: Origin) => origin.type === 'bank' && Boolean(origin.daily) && !dailyDone

  const finish = (answers: number[]) => {
    if (stage.kind !== 'playing') return
    const daily = isPaidDaily(stage.origin)
    const score = scoreRound(stage.questions, answers, { daily })
    if (score.total > 0) addXp(score.total)

    const outcome = recordRound(stats, {
      mode: starMode(stage.origin),
      correct: score.correct,
      total: stage.questions.length,
      bestCombo: score.bestCombo,
      xp: score.total,
      daily,
    })
    writeQuizStats(outcome.stats)
    setStats(outcome.stats)
    setStage({ kind: 'finished', origin: stage.origin, questions: stage.questions, answers, score, outcome })
  }

  const backToMenu = () => {
    setStage({ kind: 'menu' })
    void loadMeta()
  }

  // ── Ronda en curso ──
  if (stage.kind === 'playing') {
    return (
      <AcademyPage title="Preguntas" subtitle={originLabel(stage.origin, categoryLabel)}>
        <QuizRunner
          questions={stage.questions}
          categoryLabel={categoryLabel}
          showSource={canGenerate}
          daily={isPaidDaily(stage.origin)}
          onFinish={finish}
          onExit={backToMenu}
        />
      </AcademyPage>
    )
  }

  if (stage.kind === 'finished') {
    const { origin, questions } = stage
    return (
      <AcademyPage title="Preguntas" subtitle={originLabel(origin, categoryLabel)}>
        <QuizResults
          questions={questions}
          answers={stage.answers}
          score={stage.score}
          outcome={stage.outcome}
          daily={stage.score.dailyBonus > 0}
          streakDays={streakDays}
          againLabel={origin.type === 'ai' ? 'Jugar la tanda otra vez' : 'Otra ronda'}
          onAgain={() =>
            origin.type === 'ai' ? setStage({ kind: 'playing', origin, questions }) : void start(origin)
          }
          onMenu={backToMenu}
          onDaily={!dailyDone ? playDaily : undefined}
          onReview={origin.type === 'ai' && batch ? () => setStage({ kind: 'review' }) : undefined}
        />
      </AcademyPage>
    )
  }

  if (stage.kind === 'review' && batch && canGenerate) {
    return (
      <AcademyPage title="Preguntas" subtitle="Estudio de IA · revisión">
        <AiReview
          key={batch.questions[0]?.id}
          batch={batch}
          categoryLabel={categoryLabel}
          onSaved={(ids, published) =>
            setBatch(current =>
              current
                ? {
                    ...current,
                    saved: {
                      ...current.saved,
                      ...Object.fromEntries(ids.map(id => [id, published ? 'published' : 'draft'] as const)),
                    },
                  }
                : current,
            )
          }
          onPlay={() =>
            setStage({ kind: 'playing', origin: { type: 'ai', request: batch.request }, questions: batch.questions })
          }
          onRegenerate={() => void start({ type: 'ai', request: batch.request })}
          onDiscard={() => {
            setBatch(null)
            backToMenu()
          }}
        />
      </AcademyPage>
    )
  }

  // ── Barajando ──
  if (stage.kind === 'loading') {
    const ai = stage.origin.type === 'ai'
    return (
      <AcademyPage title="Preguntas" subtitle={originLabel(stage.origin, categoryLabel)}>
        <div className="grid min-h-[50vh] place-items-center">
          <div className="flex flex-col items-center gap-3 text-center animate-pop-in">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--poker-gold)]/15 text-[var(--poker-gold)] animate-chest-glow">
              {ai ? <Sparkles className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {ai ? 'La IA está escribiendo la tanda…' : 'Barajando preguntas…'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {ai ? 'Puede tardar hasta un minuto.' : 'Acierta seguido: el combo multiplica tu XP.'}
            </p>
          </div>
        </div>
      </AcademyPage>
    )
  }

  // ── Arena ──
  const aiCount = meta?.sources?.ai ?? 0
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : null
  const maxStars = STAR_MODES.length * 3

  return (
    <AcademyPage title="Preguntas" subtitle="Acierta seguido y multiplica tu XP">
      <div className="mx-auto max-w-5xl space-y-6">
        {metaError && (
          <Banner>
            {metaError}{' '}
            <button type="button" onClick={() => void loadMeta()} className="font-semibold underline">
              Reintentar
            </button>
          </Banner>
        )}
        {error && <Banner>{error}</Banner>}

        {/* ── 1. Héroe: tu racha y tu colección ── */}
        <section className="relative overflow-hidden rounded-3xl border border-[color:color-mix(in_srgb,var(--poker-gold)_25%,transparent)] p-5 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(700px 260px at 0% 0%, color-mix(in srgb, var(--poker-gold) 18%, transparent), transparent 65%), radial-gradient(600px 260px at 100% 100%, color-mix(in srgb, #f472b6 14%, transparent), transparent 60%), var(--bg-panel)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--bg-surface)]">
                <Flame
                  className={`h-9 w-9 ${streakDays > 0 ? 'animate-flame text-orange-400' : 'text-[var(--text-muted)]'}`}
                  fill={streakDays > 0 ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                />
                <span className="absolute -bottom-1.5 -right-1.5 grid h-7 min-w-7 place-items-center rounded-full bg-orange-500 px-1.5 text-xs font-black text-white">
                  {streakDays}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">
                  {streakDays > 0
                    ? `¡${streakDays} ${streakDays === 1 ? 'día' : 'días'} en racha!`
                    : 'Enciende tu racha'}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {stats.days.includes(today)
                    ? 'Hoy ya sumaste. Mañana, otra ronda para no perderla.'
                    : streakDays > 0
                      ? `Juega una ronda hoy o se apaga en ${formatCountdown(countdown)}.`
                      : 'Termina una ronda hoy para empezar a contar días.'}
                </p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-2">
              <Stat
                icon={<Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />}
                color="var(--poker-gold)"
                value={`${totalStars(stats)}/${maxStars}`}
                label="Estrellas"
              />
              <Stat
                icon={<Target className="h-4 w-4" />}
                color="#34d399"
                value={accuracy === null ? '—' : `${accuracy}%`}
                label="Precisión"
              />
              <Stat icon={<Flame className="h-4 w-4" />} color="#fb923c" value={String(stats.bestCombo)} label="Mejor combo" />
            </div>
          </div>
        </section>

        {/* ── 2. Reto diario ── */}
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Reto diario
                </span>
                {dailyDone ? (
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 px-1.5 py-0.5 text-mini font-semibold uppercase tracking-wide text-emerald-400">
                    <Check className="h-3 w-3" strokeWidth={3} /> Completado
                  </span>
                ) : (
                  <span className="rounded border border-[color:color-mix(in_srgb,var(--poker-gold)_40%,transparent)] px-1.5 py-0.5 text-mini font-semibold uppercase tracking-wide text-[var(--poker-gold)]">
                    Bonificación ×{DAILY_MULTIPLIER} XP
                  </span>
                )}
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                {dailyDone ? 'Has completado el reto de hoy' : `${DAILY_COUNT} preguntas de los cuatro niveles`}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {dailyDone
                  ? 'Mañana habrá un reto nuevo con otra selección de preguntas.'
                  : 'Una ronda corta y mixta. La bonificación se aplica a la primera ronda completada del día.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-5 border-t border-[var(--border)] pt-4 sm:justify-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <div className="sm:text-right">
                <p className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
                  {dailyDone ? 'Próximo reto en' : 'Cierra en'}
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatCountdown(countdown)}
                </p>
              </div>
              {!dailyDone && (
                <button
                  type="button"
                  disabled={!meta}
                  onClick={playDaily}
                  className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--poker-gold)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  Empezar reto <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          {/* Cuánto del día ha pasado: el plazo se ve sin leer el reloj. */}
          <div className="h-0.5 bg-[var(--bg-surface)]" aria-hidden>
            <div
              className="h-full bg-[var(--poker-gold)] transition-[width] duration-1000"
              style={{ width: `${Math.min(100, Math.max(0, (1 - countdown / 86_400_000) * 100))}%` }}
            />
          </div>
        </section>

        {/* ── 3. Niveles ── */}
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">Niveles</h2>
              <p className="text-xs text-[var(--text-muted)]">Selecciona un nivel para empezar una ronda.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {meta && (
                <label className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
                  Tema
                  <select
                    value={category}
                    onChange={event => setCategory(event.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-active)] focus:outline-none"
                  >
                    <option value="">Todos los temas</option>
                    {meta.categories.map(item => (
                      <option key={item.id} value={item.id} disabled={item.count === 0}>
                        {item.label} ({item.count})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
                Preguntas
                <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5">
                  {COUNT_OPTIONS.map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLimit(count)}
                      aria-pressed={limit === count}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition ${
                        limit === count
                          ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVEL_MODES.map(mode => (
              <LevelCard
                key={mode.id}
                mode={mode}
                disabled={!meta}
                best={stats.best[mode.id]}
                count={meta?.levels.find(level => level.id === mode.id)?.count}
                maxXp={`+${maxRoundXp(mode.id, limit)}`}
                onPlay={() => play(mode.id)}
              />
            ))}
            <LevelCard
              mode={RANDOM_MODE}
              disabled={!meta}
              best={stats.best.random}
              count={meta?.total}
              maxXp="Variable"
              onPlay={() => play('random')}
            />
            {(aiCount > 0 || canGenerate) && (
              <LevelCard
                mode={{
                  id: 'random',
                  title: 'Ronda IA',
                  subtitle: aiCount > 0 ? 'Preguntas generadas por IA y revisadas' : 'Aún no hay preguntas de IA publicadas',
                  color: 'var(--poker-gold)',
                  icon: Sparkles,
                }}
                tag={`×${AI_MULTIPLIER} XP`}
                disabled={!meta || aiCount === 0}
                best={stats.best.ai}
                count={aiCount}
                maxXp={`×${AI_MULTIPLIER}`}
                onPlay={() => play('random', { aiOnly: true, category: undefined })}
              />
            )}
          </div>
        </section>

        {/* ── 4. Cómo multiplicar ── */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            <Trophy className="h-3.5 w-3.5" /> Cómo multiplicar tu XP
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[...COMBO_TIERS]
              .filter(tier => tier.from > 0)
              .reverse()
              .map(tier => (
                <Booster key={tier.from} value={`×${tier.multiplier}`} label={`${tier.from} aciertos seguidos`} color="#fb923c" />
              ))}
            <Booster value={`×${AI_MULTIPLIER}`} label="Preguntas de IA" color="var(--poker-gold)" />
            <Booster value={`+${PERFECT_BONUS * 100}%`} label="Ronda perfecta" color="#34d399" />
            <Booster value={`×${DAILY_MULTIPLIER}`} label="Reto diario" color="var(--poker-gold)" />
          </div>
        </section>

        {/* ── 5. Estudio de IA (solo administradores) ── */}
        {canGenerate && meta && (
          <>
            {batch && (
              <button
                type="button"
                onClick={() => setStage({ kind: 'review' })}
                className="w-full rounded-xl border border-[color:color-mix(in_srgb,var(--poker-gold)_40%,transparent)] bg-[var(--poker-gold)]/10 px-4 py-2.5 text-left text-xs font-semibold text-[var(--poker-gold)]"
              >
                Tienes una tanda de IA pendiente de revisar ({batch.questions.length} preguntas) →
              </button>
            )}
            <AiGenerator meta={meta} loading={false} onGenerate={request => void start({ type: 'ai', request })} />
          </>
        )}
      </div>
    </AcademyPage>
  )
}

// ─── Piezas ──────────────────────────────────

function LevelCard({
  mode,
  best,
  count,
  maxXp,
  tag,
  disabled,
  onPlay,
}: {
  mode: ModeMeta
  best?: number
  count?: number
  maxXp: string
  tag?: string
  disabled?: boolean
  onPlay: () => void
}) {
  const stars = starsFor(best ?? 0)
  const mastery = Math.round((best ?? 0) * 100)
  const Icon = mode.icon
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPlay}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] text-left transition-colors hover:border-[var(--border-active)] focus-visible:border-[var(--border-active)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Acento del nivel: identifica sin teñir la tarjeta entera. */}
      <span className="h-[3px] w-full" style={{ background: mode.color }} aria-hidden />

      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border"
          style={{
            color: mode.color,
            borderColor: `color-mix(in srgb, ${mode.color} 30%, transparent)`,
            background: `color-mix(in srgb, ${mode.color} 8%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{mode.title}</p>
          <p className="text-xs leading-snug text-[var(--text-muted)]">{mode.subtitle}</p>
        </div>
        {tag && (
          <span className="shrink-0 rounded border border-[color:color-mix(in_srgb,var(--poker-gold)_40%,transparent)] px-1.5 py-0.5 text-mini font-semibold uppercase tracking-wide text-[var(--poker-gold)]">
            {tag}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-caption">
          <span className="text-[var(--text-muted)]">Dominio</span>
          <span className="flex items-center gap-1.5 tabular-nums text-[var(--text-secondary)]">
            {best === undefined ? 'Sin jugar' : `${mastery}%`}
            <span className="flex gap-px" aria-label={`${stars} de 3 estrellas`}>
              {[0, 1, 2].map(i => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < stars ? 'text-[var(--poker-gold)]' : 'text-[var(--bg-surface-hover)]'}`}
                  fill="currentColor"
                  strokeWidth={0}
                />
              ))}
            </span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${mastery}%`, background: mode.color }} />
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)] text-center">
        <Metric label="Preguntas" value={count === undefined ? '—' : String(count)} />
        <Metric label="XP máx." value={maxXp} />
        <span className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-[var(--poker-gold)] transition-all group-hover:gap-1.5">
          Empezar <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
    </button>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="py-2">
      <span className="block text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
      <span className="block text-mini uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
    </span>
  )
}

function Stat({ icon, value, label, color }: { icon: ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-lg font-black tabular-nums text-[var(--text-primary)]">
        <span style={{ color }}>{icon}</span>
        {value}
      </p>
      <p className="text-mini uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function Booster({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] px-3 py-2">
      <p className="text-base font-black" style={{ color }}>
        {value}
      </p>
      <p className="text-mini leading-tight text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-xs leading-relaxed text-[var(--text-primary)]">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <div>{children}</div>
    </div>
  )
}

function originLabel(origin: Origin, categoryLabel: (id: string) => string): string {
  if (origin.type === 'ai') return `Tanda de IA · ${modeMeta(origin.request.level).title}`
  if (origin.daily) return `Reto del día · XP ×${DAILY_MULTIPLIER}`
  if (origin.aiOnly) return `Ronda IA · XP ×${AI_MULTIPLIER}`
  const topic = origin.category ? ` · ${categoryLabel(origin.category)}` : ''
  return `${modeMeta(origin.mode).title}${topic}`
}
