// ──────────────────────────────────────────────
// Academy — modelo de contenido de la academia.
// Una clase es una secuencia de bloques tipados,
// no HTML suelto: eso permite intercalar manos
// reales, tablas de rangos, quizzes y ejercicios en
// la mesa dentro del mismo texto.
//
// Es el contrato de `GET /academy/curriculum`: el
// contenido vive en la base de datos del backend.
// ──────────────────────────────────────────────

import type { DrillId } from '@features/table/drills'

export type LevelId = 'beginner' | 'intermediate' | 'advanced' | 'theory' | 'exploit' | 'pro'

/** Formato principal de una clase, para filtrar y para el icono del listado. */
export type LessonKind = 'lesson' | 'video' | 'drill' | 'quiz'

/** Modalidad de poker: cash, torneos, spin o todas. */
export type FormatId = 'cash' | 'mtt' | 'spin' | 'all'

export const FORMAT_LABELS: Record<FormatId, string> = {
  cash: 'Cash',
  mtt: 'Torneos',
  spin: 'Spin',
  all: 'Todas',
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  answerIndex: number
  /** Por qué esa respuesta es la correcta — se muestra siempre tras responder. */
  explanation: string
}

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; tone: 'key' | 'tip' | 'warning'; title: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  /** Ejemplos de manos iniciales en notación corta: `As Kh`. */
  | { type: 'hands'; items: { cards: string; label: string; note?: string }[] }
  /** Una situación concreta: mano del héroe sobre un board. */
  | { type: 'spot'; hole: string; board?: string; question: string; answer: string }
  | { type: 'quiz'; questions: QuizQuestion[] }
  /** Visor de rango desplegable (`open-btn`, `bb-vs-btn`…). */
  | { type: 'range'; id: string }
  /** Enlace a la mesa de práctica con una configuración concreta. */
  | {
      type: 'drill'
      seats: number
      goal: string
      hands: number
      /** Entrenamiento que corrige esta práctica; por defecto, el del nivel. */
      mode?: DrillId
    }
  /** Mesa interactiva por pestañas (p. ej. texturas de board). */
  | { type: 'showcase'; id: string }

export type VideoProviderId = 'NONE' | 'YOUTUBE' | 'VIMEO' | 'MP4'

export interface LessonVideo {
  /** Un estudiante solo recibe videos activos; un administrador, también los apagados. */
  enabled: boolean
  provider: VideoProviderId
  /** ID de YouTube/Vimeo o URL del MP4, ya normalizado por el backend. */
  url: string | null
  title: string | null
  durationSec: number | null
}

export interface Lesson {
  /** Clave estable: la que guardan el progreso y los favoritos. */
  id: string
  slug: string
  title: string
  summary: string
  kind: LessonKind
  /** Duración estimada en minutos. */
  minutes: number
  xp: number
  /** Modalidades a las que aplica. Vacío o ausente = todas. */
  formats?: FormatId[]
  /** Vacío en el catálogo público: el contenido solo llega con sesión. */
  blocks: ContentBlock[]
  published?: boolean
  video?: LessonVideo | null
  /** Nota interna; solo llega a administradores. */
  notes?: string | null
}

export interface Course {
  id: string
  slug: string
  title: string
  summary: string
  level: LevelId
  /** Nombre del icono de lucide-react. */
  icon: string
  /** Qué sabrá hacer el estudiante al terminar. */
  outcomes: string[]
  /** Modalidades a las que aplica. Vacío o ausente = todas. */
  formats?: FormatId[]
  lessons: Lesson[]
  published?: boolean
  notes?: string | null
}

export interface Level {
  id: LevelId
  title: string
  subtitle: string
  description: string
  /** Variable CSS del color del nivel. */
  color: string
  icon: string
  courses: Course[]
}

/** Cifras del programa publicado, calculadas por el backend. */
export interface CurriculumStats {
  levels: number
  courses: number
  lessons: number
  minutes: number
  /** Clases que se practican en la mesa. */
  drills: number
  /** Clases con test de comprobación. */
  quizzes: number
  /** Situaciones de mano resueltas dentro de las clases. */
  spots: number
}

/** Minutos totales de un curso. */
export function courseMinutes(course: Course): number {
  return course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)
}

/** XP total que otorga un curso. */
export function courseXp(course: Course): number {
  return course.lessons.reduce((sum, lesson) => sum + lesson.xp, 0)
}
