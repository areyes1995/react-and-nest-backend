// ──────────────────────────────────────────────
// ProgressContext — estado del estudiante compartido
// por toda la app (XP, racha, clases completadas,
// historial de manos y estadísticas).
// Cada mutación persiste inmediatamente para que
// cerrar la pestaña no pierda el avance.
// ──────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  DAILY_GOAL_XP,
  EMPTY_PROGRESS,
  canOpenChest,
  gainXp,
  openChest,
  rollChest,
  type ChestReward,
  levelFromXp,
  pushHand,
  readProgress,
  today as todayKey,
  touchStreak,
  writeProgress,
  type HandRecord,
  type LessonProgress,
  type StudentProgress,
} from './store'
import { unlockedAchievements } from './achievements'

export interface ProgressContextValue {
  progress: StudentProgress
  level: { level: number; current: number; needed: number }
  /** XP ganado hoy frente a la meta diaria. */
  today: { xp: number; goal: number }
  unlocked: string[]
  /** Marca una clase como completada y suma su XP (solo la primera vez). */
  completeLesson: (lessonId: string, xp: number, score?: LessonProgress['score']) => void
  isLessonComplete: (lessonId: string) => boolean
  /** Registra una mano jugada y actualiza estadísticas. */
  recordHand: (record: HandRecord, voluntary: boolean) => void
  /** Registra el veredicto del coach sobre una decisión. */
  recordDecision: (verdict: 'good' | 'ok' | 'mistake') => void
  addXp: (amount: number) => void
  /** Abre el cofre del día si la meta está cumplida; devuelve el premio o null. */
  openDailyChest: () => ChestReward | null
  reset: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<StudentProgress>(() => readProgress())

  useEffect(() => {
    writeProgress(progress)
  }, [progress])

  /** Aplica un cambio marcando además actividad del día (racha). */
  const update = useCallback((mutate: (current: StudentProgress) => StudentProgress) => {
    setProgress(current => mutate(touchStreak(current)))
  }, [])

  const completeLesson = useCallback<ProgressContextValue['completeLesson']>(
    (lessonId, xp, score) => {
      update(current => {
        const already = current.lessons[lessonId]
        return {
          ...(already ? current : gainXp(current, xp)),
          lessons: {
            ...current.lessons,
            [lessonId]: {
              lessonId,
              completedAt: already?.completedAt ?? new Date().toISOString(),
              score: score ?? already?.score,
            },
          },
        }
      })
    },
    [update],
  )

  const recordHand = useCallback<ProgressContextValue['recordHand']>(
    (record, voluntary) => {
      update(current =>
        pushHand(
          {
            ...gainXp(current, record.won ? 12 : 4),
            stats: {
              ...current.stats,
              handsPlayed: current.stats.handsPlayed + 1,
              handsWon: current.stats.handsWon + (record.won ? 1 : 0),
              handsVoluntary: current.stats.handsVoluntary + (voluntary ? 1 : 0),
              chipsNet: current.stats.chipsNet + record.net,
            },
          },
          record,
        ),
      )
    },
    [update],
  )

  const recordDecision = useCallback<ProgressContextValue['recordDecision']>(
    verdict => {
      update(current => ({
        ...gainXp(current, verdict === 'good' ? 3 : verdict === 'ok' ? 1 : 0),
        stats: {
          ...current.stats,
          goodDecisions: current.stats.goodDecisions + (verdict === 'good' ? 1 : 0),
          okDecisions: current.stats.okDecisions + (verdict === 'ok' ? 1 : 0),
          mistakes: current.stats.mistakes + (verdict === 'mistake' ? 1 : 0),
        },
      }))
    },
    [update],
  )

  const addXp = useCallback<ProgressContextValue['addXp']>(
    amount => update(current => gainXp(current, amount)),
    [update],
  )

  const openDailyChest = useCallback<ProgressContextValue['openDailyChest']>(() => {
    if (!canOpenChest(progress)) return null
    // El premio se sortea fuera del actualizador: en modo estricto React puede
    // ejecutarlo dos veces y el estudiante vería un premio y recibiría otro.
    const reward = rollChest()
    update(current => openChest(current, reward))
    return reward
  }, [progress, update])

  const reset = useCallback(() => setProgress({ ...EMPTY_PROGRESS }), [])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      level: levelFromXp(progress.xp),
      today: { xp: progress.dailyXp[todayKey()] ?? 0, goal: DAILY_GOAL_XP },
      unlocked: unlockedAchievements(progress).map(a => a.id),
      completeLesson,
      isLessonComplete: (lessonId: string) => Boolean(progress.lessons[lessonId]),
      recordHand,
      recordDecision,
      addXp,
      openDailyChest,
      reset,
    }),
    [progress, completeLesson, recordHand, recordDecision, addXp, openDailyChest, reset],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

/** Acceso al progreso del estudiante. Debe usarse dentro de `ProgressProvider`. */
export function useStudentProgress(): ProgressContextValue {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useStudentProgress debe usarse dentro de <ProgressProvider>')
  }
  return context
}
