// ──────────────────────────────────────────────
// QuizResults — el cobro de la ronda.
// La recompensa se enseña entera y por partes: las
// estrellas caen una a una, el XP cuenta hacia arriba
// y cada extra (combo, IA, perfecta, reto) tiene su
// línea para que se vea qué lo ha multiplicado. Luego
// los fallos, para repasarlos, y un botón grande para
// la siguiente ronda.
// ──────────────────────────────────────────────

import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, Flame, ListChecks, RotateCcw, Sparkles, Star, Trophy, X, Zap } from 'lucide-react'
import { AnimatedNumber } from '@components/content'
import type { QuizQuestion } from '@services/quiz'
import type { RoundScore } from '@features/quiz/xp'
import { starsFor } from '@features/quiz/xp'
import type { RecordOutcome } from '@features/quiz/stats'

const CONFETTI_COLORS = ['#f2a93b', '#34d399', '#38bdf8', '#f472b6', '#a78bfa', '#facc15']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 220,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.6,
      })),
    [],
  )
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden" aria-hidden>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 0.45,
              background: piece.color,
              borderRadius: piece.round ? '999px' : '2px',
              animationDelay: `${piece.delay}s`,
              '--dur': `${piece.duration}s`,
              '--drift': `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}

export interface QuizResultsProps {
  questions: QuizQuestion[]
  answers: number[]
  score: RoundScore
  outcome: RecordOutcome
  daily: boolean
  streakDays: number
  /** Texto del botón principal ("Otra ronda", "Generar otra tanda"…). */
  againLabel: string
  onAgain: () => void
  onMenu: () => void
  /** Reto del día disponible: se ofrece como siguiente paso. */
  onDaily?: () => void
  /** Solo en tandas de IA para administradores: volver a revisar y guardar. */
  onReview?: () => void
}

function verdict(ratio: number): string {
  if (ratio === 1) return '¡Ronda perfecta!'
  if (ratio >= 0.8) return '¡Muy bien jugado!'
  if (ratio >= 0.5) return 'Buena ronda'
  return 'Sigue practicando'
}

export default function QuizResults({
  questions,
  answers,
  score,
  outcome,
  daily,
  streakDays,
  againLabel,
  onAgain,
  onMenu,
  onDaily,
  onReview,
}: QuizResultsProps) {
  const ratio = questions.length ? score.correct / questions.length : 0
  const stars = starsFor(ratio)
  const mistakes = questions
    .map((question, i) => ({ question, given: answers[i] }))
    .filter(({ question, given }) => given !== question.answerIndex)
  const celebrate = score.perfect || outcome.newBest || outcome.starsGained > 0

  const lines = [
    { label: `${score.correct} ${score.correct === 1 ? 'acierto' : 'aciertos'}`, value: score.base, icon: Check },
    { label: 'Combos', value: score.comboExtra, icon: Flame },
    { label: 'Preguntas IA ×2', value: score.aiExtra, icon: Sparkles },
    { label: 'Ronda perfecta +50%', value: score.perfectBonus, icon: Trophy },
    { label: 'Reto del día ×2', value: score.dailyBonus, icon: Zap },
  ].filter(line => line.value > 0)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {celebrate && <Confetti />}

      <section className="relative overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--poker-gold)_30%,transparent)] bg-[var(--bg-panel)] p-6 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(600px 220px at 50% -40%, color-mix(in srgb, var(--poker-gold) 22%, transparent), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map(i => (
              <Star
                key={i}
                className={`h-11 w-11 ${i < stars ? 'animate-pop-in text-[var(--poker-gold)]' : 'text-[var(--bg-surface)]'}`}
                style={{ animationDelay: `${150 + i * 220}ms` }}
                fill="currentColor"
                strokeWidth={0}
              />
            ))}
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">{verdict(ratio)}</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {score.correct} de {questions.length} correctas · mejor combo {score.bestCombo}
            </p>
          </div>

          <p className="flex items-center justify-center gap-2 text-4xl font-black text-[var(--poker-gold)]">
            <Zap className="h-8 w-8" fill="currentColor" strokeWidth={0} />
            +<AnimatedNumber value={score.total} duration={1100} />
            <span className="text-base font-bold">XP</span>
          </p>

          {(outcome.newBest || outcome.newCombo || outcome.starsGained > 0 || streakDays > 1 || daily) && (
            <div className="flex flex-wrap justify-center gap-1.5 stagger">
              {daily && <Badge tone="#f472b6">Reto del día completado</Badge>}
              {outcome.starsGained > 0 && (
                <Badge tone="var(--poker-gold)">
                  +{outcome.starsGained} {outcome.starsGained === 1 ? 'estrella nueva' : 'estrellas nuevas'}
                </Badge>
              )}
              {outcome.newBest && <Badge tone="#34d399">¡Nuevo récord!</Badge>}
              {outcome.newCombo && <Badge tone="#fb923c">Mejor combo histórico: {score.bestCombo}</Badge>}
              {streakDays > 1 && <Badge tone="#f43f5e">{streakDays} días seguidos</Badge>}
            </div>
          )}
        </div>
      </section>

      {lines.length > 0 && (
        <section className="space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 stagger">
          {lines.map(line => (
            <div key={line.label} className="flex items-center gap-2 text-sm">
              <line.icon className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
              <span className="flex-1 text-[var(--text-secondary)]">{line.label}</span>
              <span className="font-bold tabular-nums text-[var(--poker-gold)]">+{line.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 text-sm font-bold">
            <span className="flex-1 text-[var(--text-primary)]">Total</span>
            <span className="tabular-nums text-[var(--poker-gold)]">+{score.total} XP</span>
          </div>
        </section>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAgain}
          className="press inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--poker-gold)] px-4 py-3 text-sm font-black text-black transition hover:brightness-110 animate-chest-glow"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} /> {againLabel}
        </button>
        {onDaily ? (
          <button
            type="button"
            onClick={onDaily}
            className="press inline-flex items-center justify-center gap-2 rounded-xl border border-pink-400/50 bg-pink-400/10 px-4 py-3 text-sm font-bold text-pink-400 transition hover:bg-pink-400/20"
          >
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} /> Reto del día · XP ×2
          </button>
        ) : (
          <button
            type="button"
            onClick={onMenu}
            className="press inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--bg-surface)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
          >
            <ListChecks className="h-4 w-4" strokeWidth={2} /> Elegir otra mesa
          </button>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        {onDaily && (
          <button type="button" onClick={onMenu} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Elegir otra mesa
          </button>
        )}
        {onReview && (
          <button type="button" onClick={onReview} className="font-semibold text-[var(--poker-gold)] hover:underline">
            Volver a revisar y guardar esta tanda
          </button>
        )}
      </div>

      {mistakes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Para repasar · {mistakes.length}
          </h3>
          {mistakes.map(({ question, given }) => (
            <article key={question.id} className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{question.question}</p>
              {(question.hole || question.board) && (
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  {question.hole && <>Mano: {question.hole}</>}
                  {question.hole && question.board && ' · '}
                  {question.board && <>Mesa: {question.board}</>}
                </p>
              )}
              <p className="flex items-start gap-1.5 text-xs text-red-400">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> {question.options[given]}
              </p>
              <p className="flex items-start gap-1.5 text-xs text-emerald-400">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> {question.options[question.answerIndex]}
              </p>
              <p className="border-l-2 border-[var(--border-active)] pl-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                {question.explanation}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-caption font-bold"
      style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}
    >
      {children}
    </span>
  )
}
