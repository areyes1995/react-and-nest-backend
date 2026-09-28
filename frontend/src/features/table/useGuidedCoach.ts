// ──────────────────────────────────────────────
// useGuidedCoach — cuándo se abren las preguntas
// guiadas y cómo va la sesión.
//
// Se abren solas en cada turno nuevo del estudiante
// (una vez por decisión) y se pueden reabrir con el
// botón «Piensa». Mientras están abiertas, la mesa
// no acepta atajos de teclado: primero se piensa,
// luego se actúa.
// ──────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react'
import type { TableState } from '@poker/engine'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { buildGuidedSpot, type GuidedSpot } from './guided'

export interface GuidedCoach {
  enabled: boolean
  spot: GuidedSpot | null
  isOpen: boolean
  open: () => void
  close: () => void
  /** Registra una respuesta del mini-test. */
  answer: (correct: boolean) => void
  stats: { answered: number; correct: number }
}

export function useGuidedCoach(
  state: TableState,
  heroId: string,
  isHeroTurn: boolean,
  enabled: boolean,
): GuidedCoach {
  const { addXp } = useStudentProgress()
  const [closedKey, setClosedKey] = useState<string | null>(null)
  const [reopened, setReopened] = useState(false)
  const [stats, setStats] = useState({ answered: 0, correct: 0 })

  const spot = useMemo(
    () => (enabled && isHeroTurn ? buildGuidedSpot(state, heroId) : null),
    [enabled, isHeroTurn, state, heroId],
  )

  // Abierto si es una decisión nueva (aún no cerrada) o si se pidió reabrir.
  const isOpen = spot !== null && (closedKey !== spot.key || reopened)

  const close = useCallback(() => {
    if (spot) setClosedKey(spot.key)
    setReopened(false)
  }, [spot])

  const open = useCallback(() => setReopened(true), [])

  const answer = useCallback(
    (correct: boolean) => {
      setStats(current => ({
        answered: current.answered + 1,
        correct: current.correct + (correct ? 1 : 0),
      }))
      if (correct) addXp(1)
    },
    [addXp],
  )

  return { enabled, spot, isOpen, open, close, answer, stats }
}
