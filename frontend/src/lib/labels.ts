// Etiquetas en español y tonos de los enums del dominio.

import type { Tone } from '@components/ui/Badge'
import type {
  AchievementLevel,
  ActivityType,
  AttendanceStatus,
  CalendarEventType,
  ClassStatus,
  Difficulty,
  EvaluationType,
  InstrumentType,
  LessonPlanStatus,
  ObservationType,
  QuestionType,
  ResourceCategory,
  UnitKind,
} from '@services/types'

export const ATTENDANCE: Record<AttendanceStatus, { short: string; label: string; tone: Tone; color: string }> = {
  PRESENT: { short: 'P', label: 'Presente', tone: 'green', color: '#22c55e' },
  LATE: { short: 'T', label: 'Tardanza', tone: 'yellow', color: '#f59e0b' },
  ABSENT: { short: 'F', label: 'Falta', tone: 'red', color: '#ef4444' },
  EXCUSED: { short: 'J', label: 'Justificada', tone: 'blue', color: '#3b82f6' },
}

export const EVALUATION_TYPES: Record<EvaluationType, string> = {
  DIAGNOSTIC: 'Diagnóstica',
  FORMATIVE: 'Formativa',
  SUMMATIVE: 'Sumativa',
}

export const QUESTION_TYPES: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Selección múltiple',
  TRUE_FALSE: 'Verdadero/Falso',
  SHORT_ANSWER: 'Respuesta corta',
  DEVELOPMENT: 'Desarrollo',
  MATCHING: 'Relacionar',
  COMPLETE: 'Completar',
  GRAPH: 'Gráficas',
  PROBLEM: 'Problema',
}

export const DIFFICULTY: Record<Difficulty, { label: string; tone: Tone }> = {
  EASY: { label: 'Fácil', tone: 'green' },
  MEDIUM: { label: 'Media', tone: 'yellow' },
  HARD: { label: 'Difícil', tone: 'red' },
}

export const INSTRUMENT_TYPES: Record<InstrumentType, string> = {
  RUBRIC: 'Rúbrica',
  CHECKLIST: 'Lista de cotejo',
  RATING_SCALE: 'Escala de valoración',
}

export const OBSERVATION_TYPES: Record<ObservationType, { label: string; tone: Tone }> = {
  CONDUCT: { label: 'Conducta', tone: 'purple' },
  PARTICIPATION: { label: 'Participación', tone: 'blue' },
  SITUATION: { label: 'Situación particular', tone: 'orange' },
}

export const EVENT_TYPES: Record<CalendarEventType, { label: string; tone: Tone; color: string }> = {
  CLASS: { label: 'Clase', tone: 'purple', color: '#8b5cf6' },
  EXAM: { label: 'Evaluación', tone: 'orange', color: '#f97316' },
  MEETING: { label: 'Reunión', tone: 'sky', color: '#0ea5e9' },
  DELIVERY: { label: 'Entrega', tone: 'pink', color: '#ec4899' },
  INSTITUTIONAL: { label: 'Institucional', tone: 'blue', color: '#6366f1' },
  CIVIC: { label: 'Fecha cívica', tone: 'red', color: '#ef4444' },
  VACATION: { label: 'Vacaciones', tone: 'green', color: '#22c55e' },
  HOLIDAY: { label: 'Feriado', tone: 'red', color: '#ef4444' },
  REMINDER: { label: 'Recordatorio', tone: 'yellow', color: '#eab308' },
}

export const RESOURCE_CATEGORIES: Record<ResourceCategory, { label: string; tone: Tone }> = {
  IMAGE: { label: 'Imágenes', tone: 'pink' },
  ICON: { label: 'Íconos', tone: 'purple' },
  ILLUSTRATION: { label: 'Ilustraciones', tone: 'purple' },
  CHART: { label: 'Gráficos estadísticos', tone: 'blue' },
  GEOMETRY: { label: 'Figuras geométricas', tone: 'orange' },
  TEMPLATE: { label: 'Plantillas', tone: 'yellow' },
  BACKGROUND: { label: 'Fondos', tone: 'sky' },
  VIDEO: { label: 'Videos', tone: 'red' },
  ANIMATION: { label: 'Animaciones', tone: 'pink' },
  PDF: { label: 'PDF', tone: 'red' },
  OWN: { label: 'Materiales propios', tone: 'green' },
}

export const LEVELS: Record<AchievementLevel, { label: string; tone: Tone; color: string }> = {
  EXCELENTE: { label: 'Excelente', tone: 'green', color: '#22c55e' },
  LOGRADO: { label: 'Logrado', tone: 'blue', color: '#3b82f6' },
  EN_PROCESO: { label: 'En proceso', tone: 'yellow', color: '#f59e0b' },
  INICIO: { label: 'Inicio', tone: 'red', color: '#ef4444' },
}

export const PLAN_STATUS: Record<LessonPlanStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Borrador', tone: 'gray' },
  READY: { label: 'Lista', tone: 'green' },
  TAUGHT: { label: 'Impartida', tone: 'purple' },
}

export const UNIT_KINDS: Record<UnitKind, string> = {
  ANNUAL_PROGRAM: 'Programación anual',
  UNIT: 'Unidad didáctica',
  LEARNING_EXPERIENCE: 'Experiencia de aprendizaje',
  PROJECT: 'Proyecto',
}

export const CLASS_STATUS: Record<ClassStatus, { label: string; tone: Tone }> = {
  EN_PROGRESO: { label: 'En progreso', tone: 'pink' },
  PROXIMA: { label: 'Próxima', tone: 'purple' },
  PROGRAMADA: { label: 'Programada', tone: 'blue' },
  FINALIZADA: { label: 'Finalizada', tone: 'gray' },
}

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; description: string; tone: Tone }> = {
  QUIZ_GAME: { label: 'Juego tipo quiz', description: 'Preguntas con tiempo, estilo Kahoot', tone: 'purple' },
  MULTIPLE_CHOICE: { label: 'Selección múltiple', description: 'Elige la opción correcta', tone: 'blue' },
  TRUE_FALSE: { label: 'Verdadero o falso', description: 'Valida afirmaciones', tone: 'green' },
  MATCHING: { label: 'Relacionar columnas', description: 'Une planteamientos con resultados', tone: 'orange' },
  COMPLETE: { label: 'Completar espacios', description: 'Rellena los huecos', tone: 'yellow' },
  ORDER_STEPS: { label: 'Ordenar pasos', description: 'Reconstruye un procedimiento', tone: 'sky' },
  DRAG_DROP: { label: 'Arrastrar y soltar', description: 'Clasifica expresiones', tone: 'pink' },
  SOLVE_OPERATIONS: { label: 'Resolver operaciones', description: 'Práctica de cálculo', tone: 'blue' },
  CARTESIAN_POINTS: { label: 'Plano cartesiano', description: 'Ubica puntos en el plano', tone: 'green' },
  ROULETTE: { label: 'Ruleta', description: 'Gira y resuelve el reto', tone: 'pink' },
  MEMORY: { label: 'Memorama', description: 'Encuentra las parejas', tone: 'purple' },
  ESCAPE_ROOM: { label: 'Escape room', description: 'Resuelve retos para salir', tone: 'orange' },
}

export const BLOCK_SHORT: Record<number, string> = {
  1: 'Comunica',
  2: 'Razona y resuelve',
  3: 'Ética y ciudadanía',
  4: 'Ciencia y tecnología',
}

export const BLOCK_TONES: Record<number, Tone> = { 1: 'pink', 2: 'purple', 3: 'orange', 4: 'blue' }

export function levelFor(score: number | null | undefined, passing = 70): AchievementLevel | null {
  if (score == null) return null
  if (score >= 90) return 'EXCELENTE'
  if (score >= passing) return 'LOGRADO'
  if (score >= passing - 10) return 'EN_PROCESO'
  return 'INICIO'
}

export function scoreTone(score: number | null | undefined, passing = 70): Tone {
  const level = levelFor(score, passing)
  return level ? LEVELS[level].tone : 'gray'
}
