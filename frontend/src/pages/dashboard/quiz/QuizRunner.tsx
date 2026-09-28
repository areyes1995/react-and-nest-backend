// ──────────────────────────────────────────────
// QuizRunner — una ronda, pregunta a pregunta.
// Todo lo que ve el jugador empuja a la siguiente:
// el combo con su llama, el multiplicador que se
// calienta, el +XP que salta al acertar y el aviso
// cuando el combo sube de escalón. Un fallo apaga la
// llama — y ese miedo a perderla es el gancho.
// Se juega con teclado (1-6 y Enter).
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Flame, Sparkles, X, Zap } from 'lucide-react'
import { parseCards } from '@poker/engine'
import { CardRow } from '@components/poker'
import type { QuizQuestion } from '@services/quiz'
import { AI_MULTIPLIER, DAILY_MULTIPLIER, comboMultiplier, nextComboTier, scoreRound } from '@features/quiz/xp'
import { comboColor, modeMeta } from './quizMeta'

function safeCards(text: string | null) {
  if (!text) return []
  try {
    return parseCards(text)
  } catch {
    return []
  }
}

export interface QuizRunnerProps {
  questions: QuizQuestion[]
  categoryLabel: (id: string) => string
  /** Muestra también la insignia "Local" (administradores). */
  showSource?: boolean
  /** Reto del día: todo cuenta doble. */
  daily?: boolean
  onFinish: (answers: number[]) => void
  onExit: () => void
}

export default function QuizRunner({
  questions,
  categoryLabel,
  showSource = false,
  daily = false,
  onFinish,
  onExit,
}: QuizRunnerProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const question = questions[index]
  const given = answers[index]
  const answered = given !== undefined
  const isLast = index === questions.length - 1
  const level = modeMeta(question.level)

  // Marcador en vivo con las mismas reglas que el resultado final.
  const live = useMemo(
    () => scoreRound(questions.slice(0, answers.length), answers),
    [questions, answers],
  )
  const streak = useMemo(() => {
    let count = 0
    for (let i = answers.length - 1; i >= 0 && answers[i] === questions[i].answerIndex; i--) count++
    return count
  }, [answers, questions])
  const runningXp = live.perAnswer.reduce((sum, xp) => sum + xp, 0) * (daily ? DAILY_MULTIPLIER : 1)
  const multiplier = comboMultiplier(streak)
  const next = nextComboTier(streak)
  const lastXp = answered ? live.perAnswer[index] * (daily ? DAILY_MULTIPLIER : 1) : 0
  const tierUp = answered && given === question.answerIndex && multiplier > comboMultiplier(streak - 1)
  const brokeCombo = answered && given !== question.answerIndex && index > 0 && answers[index - 1] === questions[index - 1].answerIndex

  const choose = useCallback(
    (option: number) => {
      if (answered || option < 0 || option >= question.options.length) return
      setAnswers(current => {
        const nextAnswers = [...current]
        nextAnswers[index] = option
        return nextAnswers
      })
    },
    [answered, index, question.options.length],
  )

  const advance = useCallback(() => {
    if (!answered) return
    if (isLast) onFinish(answers)
    else setIndex(current => current + 1)
  }, [answered, isLast, onFinish, answers])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (/^[1-6]$/.test(event.key)) choose(Number(event.key) - 1)
      else if (event.key === 'Enter' || event.key === 'ArrowRight') advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, advance])

  const hole = safeCards(question.hole)
  const board = safeCards(question.board)
  const hot = comboColor(multiplier)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* ── Marcador: combo, multiplicador y XP ── */}
      <div className="flex items-stretch gap-2">
        <div
          key={`combo-${streak}`}
          className="flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors animate-bump"
          style={{
            borderColor: streak >= 3 ? hot : 'var(--border)',
            background: streak >= 3 ? `color-mix(in srgb, ${hot} 10%, var(--bg-panel))` : 'var(--bg-panel)',
          }}
        >
          <Flame
            className={`h-6 w-6 shrink-0 ${streak >= 3 ? 'animate-flame' : ''}`}
            style={{ color: streak > 0 ? hot : 'var(--text-muted)' }}
            fill={streak >= 3 ? 'currentColor' : 'none'}
            strokeWidth={1.75}
          />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Combo {streak}
              <span className="ml-1.5 rounded px-1 text-xs font-black" style={{ color: hot }}>
                ×{multiplier}
              </span>
            </p>
            <p className="truncate text-caption text-[var(--text-muted)]">
              {next
                ? `${next.missing} ${next.missing === 1 ? 'acierto' : 'aciertos'} más para ×${next.multiplier}`
                : '¡Multiplicador máximo! No lo pierdas'}
            </p>
          </div>
        </div>

        <div className="relative flex min-w-[6rem] flex-col items-end justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2">
          <p className="flex items-center gap-1 text-lg font-black tabular-nums text-[var(--poker-gold)]">
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            {runningXp}
          </p>
          <p className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
            XP ronda{daily ? ` · ×${DAILY_MULTIPLIER}` : ''}
          </p>
          {lastXp > 0 && (
            <span
              key={`xp-${index}`}
              className="pointer-events-none absolute -top-3 right-2 rounded-full bg-[var(--poker-gold)] px-2 py-0.5 text-xs font-black text-black shadow-lg animate-xp-float"
            >
              +{lastXp}
            </span>
          )}
        </div>
      </div>

      {/* ── Progreso ── */}
      <div className="space-y-1.5">
        <div className="flex gap-1" aria-hidden>
          {questions.map((item, i) => {
            const answer = answers[i]
            let tone = 'bg-[var(--bg-surface)]'
            if (answer !== undefined) tone = answer === item.answerIndex ? 'bg-emerald-500' : 'bg-red-500'
            else if (i === index) tone = 'bg-[var(--poker-gold)] animate-pulse'
            return <span key={item.id} className={`h-2 flex-1 rounded-full transition-colors ${tone}`} />
          })}
        </div>
        <p className="text-right text-caption text-[var(--text-muted)]">
          Pregunta <strong className="text-[var(--text-primary)]">{index + 1}</strong> de {questions.length}
        </p>
      </div>

      {/* ── Pregunta ── */}
      <article
        key={question.id}
        className="relative space-y-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 animate-fade-in"
      >
        {tierUp && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
            <span
              className="rounded-full px-4 py-1 text-sm font-black tracking-wide text-black shadow-xl animate-pop-in"
              style={{ background: hot }}
            >
              ¡COMBO ×{multiplier}!
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 text-mini font-semibold uppercase tracking-wide">
          <span
            className="rounded-md px-1.5 py-0.5"
            style={{ background: `color-mix(in srgb, ${level.color} 14%, transparent)`, color: level.color }}
          >
            {level.title}
          </span>
          <span className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 text-[var(--text-secondary)]">
            {categoryLabel(question.category)}
          </span>
          {question.source === 'ai' ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--poker-gold)]/15 px-1.5 py-0.5 text-[var(--poker-gold)]">
              <Sparkles className="h-3 w-3" strokeWidth={2} /> IA · XP ×{AI_MULTIPLIER}
            </span>
          ) : (
            showSource && (
              <span className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 text-[var(--text-muted)]">Local</span>
            )
          )}
        </div>

        {(hole.length > 0 || board.length > 0) && (
          <div className="flex flex-wrap items-end gap-5 rounded-xl bg-[var(--bg-surface)] p-3">
            {hole.length > 0 && (
              <div>
                <p className="mb-1 text-mini uppercase tracking-wide text-[var(--text-muted)]">Tu mano</p>
                <CardRow cards={hole} size="md" />
              </div>
            )}
            {board.length > 0 && (
              <div>
                <p className="mb-1 text-mini uppercase tracking-wide text-[var(--text-muted)]">Mesa</p>
                <CardRow cards={board} size="md" />
              </div>
            )}
          </div>
        )}

        <h2 className="text-base font-semibold leading-snug text-[var(--text-primary)]">{question.question}</h2>

        <div className={`grid gap-2 ${question.format === 'true-false' ? 'sm:grid-cols-2' : ''}`}>
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.answerIndex
            const isChosen = given === optionIndex

            let tone = 'border-[var(--border)] hover:border-[color:color-mix(in_srgb,var(--poker-gold)_60%,transparent)] hover:bg-[var(--bg-surface-soft)]'
            if (answered && isCorrect) tone = 'border-emerald-500/60 bg-emerald-500/10'
            else if (answered && isChosen) tone = 'border-red-500/50 bg-red-500/10'
            else if (answered) tone = 'border-[var(--border)] opacity-50'
            if (answered && isChosen) tone += isCorrect ? ' animate-answer-correct' : ' animate-answer-wrong'

            return (
              <button
                key={option}
                type="button"
                disabled={answered}
                onClick={() => choose(optionIndex)}
                className={`press flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition-all duration-150 ${tone}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-muted)]">
                  {answered && isCorrect ? (
                    <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />
                  ) : answered && isChosen ? (
                    <X className="h-4 w-4 text-red-400" strokeWidth={3} />
                  ) : (
                    optionIndex + 1
                  )}
                </span>
                <span className="flex-1">{option}</span>
                {answered && isChosen && isCorrect && lastXp > 0 && (
                  <span className="text-xs font-black text-[var(--poker-gold)]">+{lastXp} XP</span>
                )}
              </button>
            )
          })}
        </div>

        {answered && (
          <div
            className={`rounded-xl border-l-2 px-4 py-3 text-sm leading-relaxed animate-slide-up ${
              given === question.answerIndex
                ? 'border-emerald-500 bg-emerald-500/[0.06]'
                : 'border-red-500 bg-red-500/[0.06]'
            }`}
          >
            <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">
              {given === question.answerIndex
                ? streak >= 3
                  ? `¡En racha! ${streak} seguidas`
                  : '¡Correcto!'
                : brokeCombo
                  ? 'Se apagó el combo — a encenderlo otra vez'
                  : 'No exactamente'}
            </p>
            <p className="text-[var(--text-secondary)]">{question.explanation}</p>
          </div>
        )}
      </article>

      {/* ── Controles ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          title="Si abandonas, no cobras el XP de la ronda"
        >
          Abandonar
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-caption text-[var(--text-muted)] sm:inline">
            {answered ? 'Enter para seguir' : `Teclas 1–${question.options.length}`}
          </span>
          <button
            type="button"
            onClick={advance}
            disabled={!answered}
            className="press inline-flex items-center gap-1.5 rounded-lg bg-[var(--poker-gold)] px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast ? 'Cobrar XP' : 'Siguiente'}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
