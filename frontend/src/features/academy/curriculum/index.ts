// ──────────────────────────────────────────────
// Curriculum — la ruta de aprendizaje completa.
// El contenido llega del backend (`/academy/curriculum`);
// aquí se construyen, sobre esos niveles, las
// consultas que necesitan las páginas: buscar por
// slug, calcular progreso y saber cuál es la
// siguiente clase del estudiante.
// Se accede con `useCurriculum()`.
// ──────────────────────────────────────────────

import type { Course, Lesson, Level, LevelId } from '@features/academy/types'

/** Orden lineal de la ruta: nivel → curso → clase. */
export interface PathStep {
  lesson: Lesson
  course: Course
  level: Level
  /** Índice global dentro de la ruta. */
  index: number
}

export interface Curriculum {
  levels: Level[]
  courses: Course[]
  lessons: Lesson[]
  path: PathStep[]
  findLevel: (id: string) => Level | undefined
  findCourse: (slug: string) => Course | undefined
  findLesson: (courseSlug: string, lessonSlug: string) => Lesson | undefined
  findLessonById: (id: string) => PathStep | undefined
  courseOfLevel: (levelId: LevelId) => Course[]
  /** Paso siguiente en la ruta, o `undefined` si es el último. */
  nextStep: (lessonId: string) => PathStep | undefined
  /** Paso anterior en la ruta. */
  previousStep: (lessonId: string) => PathStep | undefined
  /**
   * Primera clase sin completar: es el "continuar donde lo dejaste" del
   * dashboard, la acción que debe estar siempre a un clic. `undefined` solo
   * si el currículo está vacío.
   */
  resumeStep: (completed: Record<string, unknown>) => PathStep | undefined
  /**
   * Un nivel se desbloquea cuando el anterior está al menos al 60%.
   * El umbral evita que el estudiante salte de nivel sin base, pero no le
   * obliga a completar el 100% de un contenido que quizá ya domina.
   */
  isLevelUnlocked: (levelId: LevelId, completed: Record<string, unknown>) => boolean
}

/** Construye las consultas de la ruta sobre los niveles recibidos. */
export function createCurriculum(levels: Level[]): Curriculum {
  const courses = levels.flatMap(level => level.courses)
  const lessons = courses.flatMap(course => course.lessons)
  const path: PathStep[] = levels
    .flatMap(level => level.courses.flatMap(course => course.lessons.map(lesson => ({ lesson, course, level }))))
    .map((step, index) => ({ ...step, index }))

  const byLessonId = new Map(path.map(step => [step.lesson.id, step]))
  const bySlug = new Map(courses.map(course => [course.slug, course]))

  const findLessonById = (id: string) => byLessonId.get(id)

  return {
    levels,
    courses,
    lessons,
    path,
    findLevel: id => levels.find(level => level.id === id),
    findCourse: slug => bySlug.get(slug),
    findLesson: (courseSlug, lessonSlug) =>
      bySlug.get(courseSlug)?.lessons.find(lesson => lesson.slug === lessonSlug),
    findLessonById,
    courseOfLevel: levelId => courses.filter(course => course.level === levelId),
    nextStep: lessonId => {
      const current = findLessonById(lessonId)
      return current ? path[current.index + 1] : undefined
    },
    previousStep: lessonId => {
      const current = findLessonById(lessonId)
      return current && current.index > 0 ? path[current.index - 1] : undefined
    },
    resumeStep: completed => path.find(step => !completed[step.lesson.id]) ?? path[path.length - 1],
    isLevelUnlocked: (levelId, completed) => {
      const index = levels.findIndex(level => level.id === levelId)
      if (index <= 0) return true
      return levelProgress(levels[index - 1], completed).ratio >= 0.6
    },
  }
}

/** Currículo sin contenido: el estado mientras carga o si el backend no responde. */
export const EMPTY_CURRICULUM: Curriculum = createCurriculum([])

/** Progreso de un curso: clases completadas sobre el total. */
export function courseProgress(
  course: Course,
  completed: Record<string, unknown>,
): { done: number; total: number; ratio: number } {
  const done = course.lessons.filter(lesson => completed[lesson.id]).length
  const total = course.lessons.length
  return { done, total, ratio: total === 0 ? 0 : done / total }
}

/** Progreso de un nivel completo. */
export function levelProgress(
  level: Level,
  completed: Record<string, unknown>,
): { done: number; total: number; ratio: number } {
  const lessons = level.courses.flatMap(course => course.lessons)
  const done = lessons.filter(lesson => completed[lesson.id]).length
  const total = lessons.length
  return { done, total, ratio: total === 0 ? 0 : done / total }
}
