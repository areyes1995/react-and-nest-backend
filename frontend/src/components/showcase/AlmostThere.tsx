// ──────────────────────────────────────────────
// AlmostThere — "casi lo tienes".
// El logro más cercano y el siguiente nivel, con lo
// que falta exactamente. Algo a medio llenar pide
// ser terminado; algo lejano no motiva.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { Icon } from '@components/content'
import { ProgressBar } from '@components/content/ProgressRing'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { ACHIEVEMENTS } from '@features/progress/achievements'

export default function AlmostThere() {
  const { progress, level } = useStudentProgress()

  // El logro pendiente con más avance (a igualdad, el primero de la lista).
  const nearest = ACHIEVEMENTS.map(a => ({ achievement: a, value: a.progress(progress) }))
    .filter(entry => entry.value < 1)
    .sort((a, b) => b.value - a.value)[0]

  const xpToLevel = level.needed - level.current

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
      <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Casi lo tienes</h2>

      <div className="mt-3 space-y-4">
        {/* Siguiente nivel */}
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Nivel {level.level + 1}: te faltan {xpToLevel} XP
            </p>
            <ProgressBar value={level.current / level.needed} color="#38bdf8" className="mt-1.5" />
          </div>
        </div>

        {nearest && (
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#f2a93b]/15 text-[var(--poker-gold)] shrink-0">
              <Icon name={nearest.achievement.icon} className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[var(--text-primary)] truncate">{nearest.achievement.title}</span>
                <span className="text-xs tabular-nums text-[var(--text-muted)]">{Math.round(nearest.value * 100)}%</span>
              </p>
              <p className="text-caption text-[var(--text-muted)] truncate">{nearest.achievement.description}</p>
              <ProgressBar value={nearest.value} className="mt-1.5" />
            </div>
          </div>
        )}
      </div>

      <Link
        to="/app/progress/achievements"
        className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--poker-gold)] hover:underline"
      >
        Ver todos los logros <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
      </Link>
    </section>
  )
}
