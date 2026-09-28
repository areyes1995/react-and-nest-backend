// ──────────────────────────────────────────────
// LessonCompleteModal — la recompensa al terminar
// una clase: confeti, XP ganado, meta diaria, racha
// y un único botón grande hacia la siguiente.
//
// Es el momento que hace volver: el estudiante ve
// que su esfuerzo suma (XP, racha, nivel) y la
// siguiente clase está a un clic, sin pensar.
// ──────────────────────────────────────────────

import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Flame, Map as MapIcon, Target, Trophy, Zap } from 'lucide-react'
import { ProgressBar } from './ProgressRing'
import AnimatedNumber from './AnimatedNumber'

const CONFETTI_COLORS = ['#f2a93b', '#34d399', '#38bdf8', '#f472b6', '#a78bfa', '#facc15']

export interface LessonCompleteModalProps {
  lessonTitle: string
  xpGained: number
  /** XP del día antes y después de esta clase. */
  todayBefore: number
  todayAfter: number
  dailyGoal: number
  streak: number
  levelBefore: number
  levelAfter: number
  levelRatio: number
  quiz?: { correct: number; total: number } | null
  next?: { title: string; href: string; courseChanged: boolean; courseTitle: string }
  onClose: () => void
}

export default function LessonCompleteModal({
  lessonTitle,
  xpGained,
  todayBefore,
  todayAfter,
  dailyGoal,
  streak,
  levelBefore,
  levelAfter,
  levelRatio,
  quiz,
  next,
  onClose,
}: LessonCompleteModalProps) {
  const goalJustReached = todayBefore < dailyGoal && todayAfter >= dailyGoal
  const leveledUp = levelAfter > levelBefore

  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 240,
        size: 6 + Math.random() * 7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.6,
      })),
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const headline = leveledUp
    ? `¡Subiste al nivel ${levelAfter}!`
    : goalJustReached
      ? '¡Meta del día cumplida!'
      : quiz && quiz.correct === quiz.total
        ? '¡Perfecto!'
        : '¡Clase completada!'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={headline}
      onClick={onClose}
    >
      {/* Confeti */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {confetti.map((piece, i) => (
          <span
            key={i}
            className="animate-confetti absolute top-0"
            style={
              {
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.round ? piece.size : piece.size * 0.45,
                borderRadius: piece.round ? '9999px' : '2px',
                background: piece.color,
                animationDelay: `${piece.delay}s`,
                '--dur': `${piece.duration}s`,
                '--drift': `${piece.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div
        className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        {/* Cabecera celebratoria */}
        <div
          className="px-6 pt-7 pb-5 text-center"
          style={{ background: 'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--poker-gold) 26%, transparent), transparent 70%)' }}
        >
          <span
            className="mx-auto grid place-items-center w-20 h-20 rounded-full border-4 border-white/80 text-black shadow-lg"
            style={{ background: 'linear-gradient(180deg, #fcd67a, #f2a93b)', boxShadow: '0 6px 0 0 #b7791f' }}
          >
            {leveledUp ? <Trophy className="w-9 h-9" strokeWidth={2.4} /> : <Check className="w-10 h-10" strokeWidth={3.5} />}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-[var(--text-primary)]">{headline}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-1">{lessonTitle}</p>
        </div>

        {/* Recompensas */}
        <div className="grid grid-cols-3 gap-2 px-5">
          <div className="rounded-2xl border border-[#f2a93b]/40 bg-[#f2a93b]/10 p-3 text-center">
            <Zap className="mx-auto w-5 h-5 text-[var(--poker-gold)]" strokeWidth={2.4} />
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[var(--text-primary)]">
              +<AnimatedNumber value={xpGained} duration={900} />
            </p>
            <p className="text-mini font-bold uppercase tracking-wide text-[var(--text-muted)]">XP</p>
          </div>
          <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3 text-center">
            <Flame className="mx-auto w-5 h-5 text-orange-400 animate-flame" strokeWidth={2.4} />
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[var(--text-primary)]">{streak}</p>
            <p className="text-mini font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {streak === 1 ? 'día de racha' : 'días de racha'}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3 text-center">
            <Target className="mx-auto w-5 h-5 text-sky-400" strokeWidth={2.4} />
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[var(--text-primary)]">
              {quiz ? `${quiz.correct}/${quiz.total}` : '—'}
            </p>
            <p className="text-mini font-bold uppercase tracking-wide text-[var(--text-muted)]">Test</p>
          </div>
        </div>

        {/* Meta diaria y nivel */}
        <div className="space-y-3 px-5 pt-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-secondary)]">Meta del día</span>
              <span className="tabular-nums text-[var(--text-muted)]">
                {Math.min(todayAfter, dailyGoal)}/{dailyGoal} XP
              </span>
            </div>
            <ProgressBar value={Math.min(1, todayAfter / dailyGoal)} color="var(--poker-gold)" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-secondary)]">Nivel {levelAfter}</span>
              <span className="tabular-nums text-[var(--text-muted)]">{Math.round(levelRatio * 100)}%</span>
            </div>
            <ProgressBar value={levelRatio} color="#38bdf8" />
          </div>
          {quiz && quiz.correct < quiz.total && (
            <p className="text-xs text-[var(--text-muted)]">
              Fallaste {quiz.total - quiz.correct} en el test: repasa la explicación antes de seguir.
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-2 p-5">
          {next ? (
            <Link
              to={next.href}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-black transition hover:brightness-110 press"
              style={{ background: 'var(--poker-gold)', boxShadow: '0 4px 0 0 #b7791f' }}
            >
              <span className="truncate">
                {next.courseChanged ? `Empezar ${next.courseTitle}` : 'Siguiente clase'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={3} />
            </Link>
          ) : null}
          {next && <p className="text-center text-caption text-[var(--text-muted)] truncate">{next.title}</p>}
          <Link
            to="/app/learn"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <MapIcon className="w-4 h-4" strokeWidth={2} />
            Ver mi ruta
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}
