// ──────────────────────────────────────────────
// Práctica guiada de una clase.
//
// Toda clase se puede llevar a la mesa, tenga o no un
// ejercicio declarado: si lo tiene, manda él (mesa,
// objetivo y entrenamiento); si no, se usa el
// entrenamiento que mejor corresponde a su nivel.
// Así "practicar esta clase" no depende de que
// alguien se acordara de escribir un bloque `drill`.
// ──────────────────────────────────────────────

import type { DrillId } from '@features/table/drills'
import type { Lesson, LevelId } from './types'

export interface LessonPractice {
  /** Entrenamiento que corrige la sesión. */
  drillId: DrillId
  seats: number
  /** Qué hay que conseguir, en una frase. */
  goal: string
  /** Manos sugeridas. */
  hands: number
  /** El objetivo viene del currículo, no de un valor por defecto. */
  explicit: boolean
}

/** Entrenamiento por defecto de cada nivel, cuando la clase no declara ejercicio. */
const DRILL_BY_LEVEL: Record<LevelId, DrillId> = {
  beginner: 'preflop-position',
  intermediate: 'cbet',
  advanced: 'aggression',
  theory: 'bluff-catch',
  exploit: 'aggression',
  pro: 'discipline',
}

export function practiceForLesson(lesson: Lesson, level: LevelId = 'beginner'): LessonPractice {
  const block = lesson.blocks.find(item => item.type === 'drill')

  if (block && block.type === 'drill') {
    return {
      drillId: block.mode ?? DRILL_BY_LEVEL[level],
      seats: block.seats,
      goal: block.goal,
      hands: block.hands,
      explicit: true,
    }
  }

  return {
    drillId: DRILL_BY_LEVEL[level],
    seats: 6,
    goal: `Aplica en la mesa lo que explica «${lesson.title}»`,
    hands: 10,
    explicit: false,
  }
}
