// ──────────────────────────────────────────────
// showcase — lo que la academia ofrece, en cifras.
//
// Alimenta los bloques tipo Udemy ("Lo que vas a
// aprender", "Este programa incluye") del inicio,
// de la portada de cada curso y de la landing.
//
// Todas las cifras se calculan del contenido real
// (el backend las sirve con el currículo): añadir una
// clase actualiza los números solos.
// Las cifras de comunidad (estudiantes, valoración)
// NO se inventan: quedan en `null` hasta que las
// sirva el backend, y mientras tanto no se muestran.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { courseProgress, type Curriculum } from './curriculum'
import { useCurriculumState } from './CurriculumContext'
import type { Course, CurriculumStats, LevelId } from './types'
import { ARTICLES } from '@features/articles/data'
import { VIDEOS } from '@features/videos/data'
import { GLOSSARY } from '@features/glossary/data'

export interface ProgramStats extends CurriculumStats {
  articles: number
  videos: number
  glossaryTerms: number
  tools: number
}

/**
 * Cifras del programa. Las del currículo las calcula el backend sobre lo
 * publicado (también llegan con el catálogo público, que no trae el contenido
 * de las clases); artículos, videos y glosario siguen siendo locales.
 */
export function programStats(stats: CurriculumStats): ProgramStats {
  return {
    ...stats,
    articles: ARTICLES.length,
    videos: VIDEOS.length,
    glossaryTerms: GLOSSARY.length,
    // Calculadora de equity, rangos preflop y entrenador de manos.
    tools: 3,
  }
}

/** Cifras del programa cargado. */
export function useProgramStats(): ProgramStats {
  const { stats } = useCurriculumState()
  return useMemo(() => programStats(stats), [stats])
}

/** "6 h 50 min" a partir de minutos. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export interface Skill {
  text: string
  course: Course
  level: LevelId
}

/** Todas las habilidades del programa: los "Al terminar sabrás" de cada curso. */
export function skillsOf(curriculum: Curriculum): Skill[] {
  return curriculum.courses.flatMap(course =>
    course.outcomes.map(text => ({ text, course, level: course.level })),
  )
}

/**
 * Una habilidad cuenta como dominada cuando su curso está completo. Es una
 * regla simple y honesta: no se "gana" una habilidad sin hacer sus clases.
 */
export function isSkillLearned(skill: Skill, completed: Record<string, unknown>): boolean {
  return courseProgress(skill.course, completed).ratio >= 1
}

/**
 * Cifras de comunidad. Se dejan en `null` a propósito: publicar números de
 * estudiantes o valoraciones inventados engaña a quien decide apuntarse.
 * Cuando el backend exponga datos reales, rellenarlos aquí (o traerlos de la
 * API) y los bloques los mostrarán solos.
 */
export const COMMUNITY: { learners: number | null; rating: number | null; reviews: number | null } = {
  learners: null,
  rating: null,
  reviews: null,
}
