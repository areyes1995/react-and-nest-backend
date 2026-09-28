// ──────────────────────────────────────────────
// DailyGoal — la meta del día y la semana de racha.
//
// Una meta pequeña y alcanzable (una clase la
// cubre) más los siete últimos días marcados: es la
// razón para volver mañana. Si hoy aún no hay
// actividad, se avisa de que la racha está en juego.
// ──────────────────────────────────────────────

import { Flame, Target } from 'lucide-react'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { lastDays, today as todayKey } from '@features/progress/store'
import { formatCountdown, useDayCountdown } from '@features/progress/useDayCountdown'
import ProgressRing from './ProgressRing'
import AnimatedNumber from './AnimatedNumber'

const WEEKDAY = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export default function DailyGoal({ compact = false }: { compact?: boolean }) {
  const { progress, today } = useStudentProgress()
  const ratio = Math.min(1, today.xp / today.goal)
  const reached = today.xp >= today.goal
  const days = lastDays(7)
  const activeToday = progress.lastActiveDay === todayKey()
  const atRisk = progress.streak > 0 && !activeToday
  const remaining = useDayCountdown()

  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] ${compact ? 'p-3.5' : 'p-5'}`}>
      <div className="flex items-center gap-4">
        <ProgressRing value={ratio} size={compact ? 52 : 68} stroke={compact ? 5 : 6} color={reached ? '#34d399' : 'var(--poker-gold)'}>
          <Target className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${reached ? 'text-emerald-400' : 'text-[var(--poker-gold)]'}`} strokeWidth={2.4} />
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-bold uppercase tracking-wide text-[var(--text-muted)]">Meta de hoy</p>
          <p className={`${compact ? 'text-base' : 'text-xl'} font-extrabold tabular-nums text-[var(--text-primary)]`}>
            <AnimatedNumber value={Math.min(today.xp, today.goal)} />
            <span className="text-[var(--text-muted)] font-semibold">/{today.goal} XP</span>
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {reached
              ? '¡Cumplida! Todo lo que sumes hoy es extra.'
              : `Te faltan ${today.goal - today.xp} XP: una clase corta basta.`}
          </p>
        </div>
      </div>

      {/* Semana de racha */}
      <div className={`${compact ? 'mt-3' : 'mt-4'} flex items-center justify-between gap-1`}>
        {days.map(day => {
          const active = (progress.dailyXp[day] ?? 0) > 0 || (day === todayKey() && activeToday)
          const isToday = day === todayKey()
          const weekday = WEEKDAY[new Date(day + 'T12:00:00Z').getUTCDay()]
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span
                className={`grid place-items-center rounded-full ${compact ? 'w-7 h-7' : 'w-8 h-8'} transition ${
                  active
                    ? 'bg-orange-500 text-white shadow-[0_3px_0_0_#c2410c]'
                    : isToday
                      ? 'border-2 border-dashed border-orange-400/70 text-orange-400'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}
                title={day}
              >
                <Flame
                  className={`w-3.5 h-3.5 ${active && isToday ? 'animate-flame' : ''}`}
                  strokeWidth={2.4}
                  fill={active ? 'currentColor' : 'none'}
                />
              </span>
              <span className={`text-mini font-bold ${isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {weekday}
              </span>
            </div>
          )
        })}
      </div>

      {atRisk && (
        <p className="mt-3 rounded-xl bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-300">
          🔥 Tu racha de {progress.streak} {progress.streak === 1 ? 'día' : 'días'} se apaga en {formatCountdown(remaining)}. Haz una clase para salvarla.
        </p>
      )}
    </div>
  )
}
