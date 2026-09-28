// ──────────────────────────────────────────────
// Reglas de acceso — qué es gratis y qué es de pago.
// Es el ÚNICO sitio donde se decide: las páginas
// preguntan a `useAccess()` y este archivo responde.
//
// Gratis (con cuenta, sin suscripción):
//   · los 3 primeros cursos de Fundamentos, sin
//     «Cash vs Torneos vs Spin»;
//   · la calculadora de equity;
//   · la mesa de práctica en modo demostración (se
//     ve, pero no se puede jugar);
//   · artículos, glosario, ruta y progreso.
// Todo lo demás lo abre cualquier plan de pago
// (Premium o Gold): ambos incluyen todos los
// cursos y herramientas.
// ──────────────────────────────────────────────

import type { Curriculum } from '@features/academy/curriculum'
import type { Course } from '@features/academy/types'

/** Lo que exige suscripción. Las páginas gratis no aparecen aquí. */
export type PaidFeature =
  | 'play'
  | 'ranges'
  | 'odds'
  | 'trainer'
  | 'quiz'
  | 'videos'
  | 'saved'

/** Nombre para el muro de pago: «Desbloquea {nombre}». */
export const PAID_FEATURE_LABEL: Record<PaidFeature, string> = {
  play: 'la mesa de práctica',
  ranges: 'los rangos preflop',
  odds: 'el entrenador de odds',
  trainer: 'el entrenador de manos',
  quiz: 'el banco de preguntas',
  videos: 'los videotutoriales',
  saved: 'tu biblioteca de guardados',
}

/** Nivel cuyos primeros cursos son gratis. */
export const FREE_LEVEL_ID = 'beginner'
/** Cuántos cursos de ese nivel son gratis. */
export const FREE_COURSE_COUNT = 3
/** Cursos de ese nivel que son de pago aunque entren en la cuenta. */
export const PAID_COURSE_SLUGS = new Set(['cash-vs-torneos-vs-spin'])

/** Ids de los cursos gratis, en el orden del currículo. */
export function freeCourseIds(curriculum: Pick<Curriculum, 'courseOfLevel'>): Set<string> {
  return new Set(
    curriculum
      .courseOfLevel(FREE_LEVEL_ID)
      .filter(course => !PAID_COURSE_SLUGS.has(course.slug))
      .slice(0, FREE_COURSE_COUNT)
      .map(course => course.id),
  )
}

export function isFreeCourse(course: Pick<Course, 'id'>, free: Set<string>): boolean {
  return free.has(course.id)
}
