// ──────────────────────────────────────────────
// StreakWidget — racha y nivel del estudiante.
// Vive al pie de la barra lateral: es lo primero
// que se mira al entrar y lo que da continuidad
// entre sesiones.
// ──────────────────────────────────────────────

import { Flame, Zap } from 'lucide-react'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { ProgressBar } from './ProgressRing'
import AnimatedNumber from './AnimatedNumber'

export default function StreakWidget() {
  const { progress, level, today } = useStudentProgress()
  const ratio = level.current / level.needed

  return (
    <div
      data-tour="streak"
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-soft)] px-3 py-2.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
          <Flame className={`w-3.5 h-3.5 text-orange-400 ${progress.streak > 0 ? 'animate-flame' : ''}`} strokeWidth={2} />
          {progress.streak} {progress.streak === 1 ? 'día' : 'días'}
        </span>
        <span className="flex items-center gap-1 text-caption text-[var(--text-muted)]">
          <Zap key={progress.xp} className="w-3 h-3 text-[var(--poker-gold)] animate-bump" strokeWidth={2} />
          <AnimatedNumber value={progress.xp} /> XP
        </span>
      </div>

      <ProgressBar value={ratio} />

      <div className="flex items-center justify-between text-mini text-[var(--text-muted)]">
        <span>
          Nivel {level.level} ·{' '}
          <span className={today.xp >= today.goal ? 'text-emerald-400 font-semibold' : ''}>
            hoy {Math.min(today.xp, today.goal)}/{today.goal} XP
          </span>
        </span>
        <span className="tabular-nums">
          {level.current}/{level.needed}
        </span>
      </div>
    </div>
  )
}
