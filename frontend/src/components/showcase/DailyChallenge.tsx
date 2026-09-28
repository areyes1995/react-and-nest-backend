// ──────────────────────────────────────────────
// DailyChallenge — los retos del día y el cofre.
//
// Tres retos pequeños con reloj de cuenta atrás
// hasta medianoche (la urgencia), y un cofre que se
// abre al cumplir la meta diaria con un premio que
// cambia cada día (la dopamina: nunca sabes si toca
// el premio gordo).
//
// Todo se reinicia a medianoche en hora local.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, Gift, Hourglass, Lock, Spade, Sparkles, Zap } from 'lucide-react'
import { ProgressBar } from '@components/content/ProgressRing'
import AnimatedNumber from '@components/content/AnimatedNumber'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { activityToday, canOpenChest, today as todayKey, type ChestReward } from '@features/progress/store'
import { formatCountdown, useDayCountdown } from '@features/progress/useDayCountdown'

const HANDS_GOAL = 5

export default function DailyChallenge({ nextLessonHref }: { nextLessonHref: string }) {
  const { progress, today, openDailyChest } = useStudentProgress()
  const remaining = useDayCountdown()
  const [opening, setOpening] = useState(false)
  const [reward, setReward] = useState<ChestReward | null>(null)

  const activity = activityToday(progress)
  const challenges = [
    {
      id: 'lesson',
      icon: BookOpen,
      label: 'Completa una clase',
      value: Math.min(activity.lessons, 1),
      target: 1,
      href: nextLessonHref,
    },
    {
      id: 'xp',
      icon: Zap,
      label: `Gana ${today.goal} XP`,
      value: Math.min(today.xp, today.goal),
      target: today.goal,
      href: nextLessonHref,
    },
    {
      id: 'hands',
      icon: Spade,
      label: `Juega ${HANDS_GOAL} manos en la mesa`,
      value: Math.min(activity.hands, HANDS_GOAL),
      target: HANDS_GOAL,
      href: '/app/play',
    },
  ]
  const doneCount = challenges.filter(c => c.value >= c.target).length
  const allDone = doneCount === challenges.length

  const chestReady = canOpenChest(progress)
  const chestOpened = progress.chests.includes(todayKey())
  const hoursLeft = remaining / 3_600_000
  const urgent = !allDone && hoursLeft < 3

  const open = () => {
    if (!chestReady || opening) return
    setOpening(true)
    // Un segundo de suspense antes de enseñar el premio.
    window.setTimeout(() => {
      setReward(openDailyChest())
      setOpening(false)
    }, 1100)
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
      {/* ── Reloj ── */}
      <div
        className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold ${
          allDone
            ? 'bg-emerald-500/10 text-emerald-400'
            : urgent
              ? 'bg-red-500/15 text-red-400'
              : 'bg-[#f2a93b]/10 text-[var(--poker-gold)]'
        }`}
      >
        <Hourglass className={`w-4 h-4 ${urgent ? 'animate-pulse' : ''}`} strokeWidth={2.4} />
        {allDone ? (
          <span>¡Día perfecto! Mañana hay retos nuevos.</span>
        ) : (
          <span>
            {urgent ? '¡Se acaba el día! ' : ''}Los retos se reinician en{' '}
            <span className="tabular-nums">{formatCountdown(remaining)}</span>
          </span>
        )}
        <span className="ml-auto tabular-nums opacity-80">{doneCount}/3</span>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_200px]">
        {/* ── Retos ── */}
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Retos de hoy</h2>
          <ul className="stagger mt-3 space-y-3">
            {challenges.map(challenge => {
              const done = challenge.value >= challenge.target
              return (
                <li key={challenge.id}>
                  <Link to={challenge.href} className="group flex items-center gap-3">
                    <span
                      className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 transition ${
                        done
                          ? 'bg-emerald-500 text-white shadow-[0_3px_0_0_#047857]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {done ? <Check className="w-5 h-5" strokeWidth={3} /> : <challenge.icon className="w-5 h-5" strokeWidth={2} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className={`font-semibold ${done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {challenge.label}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--text-muted)]">
                          {challenge.value}/{challenge.target}
                        </span>
                      </span>
                      <ProgressBar
                        value={challenge.value / challenge.target}
                        color={done ? '#34d399' : 'var(--poker-gold)'}
                        className="mt-1.5"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Cofre ── */}
        <div
          className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
            chestReady ? 'border-[#f2a93b]/60 bg-[#f2a93b]/10' : 'border-[var(--border)] bg-[var(--bg-surface-soft)]'
          }`}
        >
          {reward ? (
            <div className="animate-pop-in">
              <Sparkles className="mx-auto w-7 h-7 text-[var(--poker-gold)]" strokeWidth={2.2} />
              <p className={`mt-1 font-extrabold tabular-nums text-[var(--poker-gold)] ${reward.jackpot ? 'text-4xl' : 'text-3xl'}`}>
                +<AnimatedNumber value={reward.xp} duration={900} /> XP
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
                {reward.jackpot ? '¡Premio gordo!' : '¡Premio del día!'}
              </p>
              <p className="mt-1 text-caption text-[var(--text-muted)]">Mañana, otro cofre. ¿Tocará el gordo?</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={open}
                disabled={!chestReady}
                aria-label={chestReady ? 'Abrir el cofre del día' : 'Cofre cerrado'}
                className={`relative grid place-items-center w-20 h-20 rounded-2xl transition ${
                  chestReady
                    ? `text-black ${opening ? 'animate-chest-shake' : 'animate-chest-glow hover:scale-105'}`
                    : 'text-[var(--text-muted)] bg-[var(--bg-surface)] cursor-not-allowed'
                }`}
                style={chestReady ? { background: 'linear-gradient(180deg, #fcd67a, #f2a93b)', boxShadow: '0 5px 0 0 #b7791f' } : undefined}
              >
                <Gift className="w-10 h-10" strokeWidth={2} />
                {!chestReady && !chestOpened && (
                  <span className="absolute -bottom-1.5 -right-1.5 grid place-items-center w-7 h-7 rounded-full bg-[var(--bg-panel)] border border-[var(--border-active)]">
                    <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                )}
              </button>
              <p className="mt-3 text-sm font-extrabold text-[var(--text-primary)]">
                {chestOpened ? 'Cofre abierto' : chestReady ? (opening ? 'Abriendo…' : '¡Ábrelo!') : 'Cofre del día'}
              </p>
              <p className="mt-0.5 text-caption leading-snug text-[var(--text-muted)]">
                {chestOpened
                  ? `El próximo aparece en ${formatCountdown(remaining)}.`
                  : chestReady
                    ? 'Premio sorpresa: de 10 a 50 XP.'
                    : `Cumple la meta de hoy (faltan ${Math.max(0, today.goal - today.xp)} XP) para abrirlo.`}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
