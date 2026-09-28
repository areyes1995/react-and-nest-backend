// ──────────────────────────────────────────────
// AchievementsPage — hitos del estudiante.
// Los bloqueados muestran su barra de progreso: un
// logro que no dice cuánto falta no motiva a nadie.
// ──────────────────────────────────────────────

import { AcademyPage } from '@components/layout'
import { Icon, ProgressBar } from '@components/content'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { ACHIEVEMENTS } from '@features/progress/achievements'

export default function AchievementsPage() {
  const { progress } = useStudentProgress()

  const entries = ACHIEVEMENTS.map(achievement => ({
    achievement,
    ratio: Math.min(1, achievement.progress(progress)),
  }))

  const unlocked = entries.filter(entry => entry.ratio >= 1).length

  return (
    <AcademyPage
      title="Logros"
      subtitle={`${unlocked} de ${ACHIEVEMENTS.length} desbloqueados`}
    >
      <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3 max-w-5xl mx-auto w-full">
        {entries.map(({ achievement, ratio }) => {
          const done = ratio >= 1
          return (
            <div
              key={achievement.id}
              className={`rounded-xl border p-4 transition ${
                done
                  ? 'border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/[0.06]'
                  : 'border-[var(--border)] bg-[var(--bg-panel)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
                    done
                      ? 'bg-[var(--poker-gold)] text-black'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <Icon name={achievement.icon} className="w-5 h-5" strokeWidth={1.5} />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-snug mt-0.5">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {!done && (
                <div className="mt-3 space-y-1">
                  <ProgressBar value={ratio} />
                  <p className="text-mini text-[var(--text-muted)] text-right tabular-nums">
                    {Math.round(ratio * 100)}%
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AcademyPage>
  )
}
