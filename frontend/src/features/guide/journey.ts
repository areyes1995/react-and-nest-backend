// ──────────────────────────────────────────────
// Journey — el itinerario guiado del estudiante.
//
// La plataforma tiene muchas cosas (clases, mesa,
// herramientas, estadísticas) y esa es justo la
// razón por la que alguien nuevo se pierde. El
// itinerario las ordena: en cada momento hay UNA
// etapa en curso y una sola acción recomendada.
//
// Todo se deriva del progreso real — no hay un
// "paso actual" guardado que se pueda desincronizar
// con lo que el estudiante ya hizo.
// ──────────────────────────────────────────────

import { levelProgress, type Curriculum } from '@features/academy/curriculum'
import type { StudentProgress } from '@features/progress/store'
import type { GuideState } from './storage'

/** Umbral que desbloquea el nivel siguiente (mismo criterio que el currículo). */
const LEVEL_UNLOCK_RATIO = 0.6

export interface JourneyStage {
  id: string
  /** Rótulo corto de la etapa. */
  title: string
  /** Qué hay que hacer, en imperativo. */
  action: string
  /** Por qué esta etapa va aquí y no en otro sitio. */
  why: string
  /** Texto del botón. */
  cta: string
  /** Nombre del icono de lucide-react. */
  icon: string
  /** Destino; `undefined` cuando la etapa se resuelve abriendo el tour. */
  to?: string
  /** La etapa se completa lanzando el tour guiado. */
  opensTour?: boolean
  done: boolean
}

/** ¿Ha respondido ya algún test? */
function hasQuizScore(progress: StudentProgress): boolean {
  return Object.values(progress.lessons).some(lesson => lesson.score !== undefined)
}

/**
 * Construye el itinerario completo con el estado de cada etapa.
 * El orden es deliberado: primero orientarse, luego aprender, luego practicar
 * lo aprendido, y solo después medir. Las herramientas llegan cuando ya hay
 * algo que analizar con ellas.
 */
export function buildJourney(
  progress: StudentProgress,
  guide: GuideState,
  curriculum: Curriculum,
): JourneyStage[] {
  const lessonsDone = Object.keys(progress.lessons).length
  const beginner = curriculum.levels[0]
  const beginnerStats = beginner
    ? levelProgress(beginner, progress.lessons)
    : { done: 0, total: 0, ratio: 0 }
  const resume = curriculum.resumeStep(progress.lessons)
  // Sin currículo (cargando o sin backend) las etapas de clase llevan a la ruta.
  const lessonPath = resume ? `/app/classes/${resume.course.slug}/${resume.lesson.slug}` : '/app/learn'
  const resumeTitle = resume?.lesson.title ?? 'la primera clase'

  return [
    {
      id: 'tour',
      title: 'Conoce la plataforma',
      action: 'Haz el recorrido guiado de 5 pasos',
      why: 'Dos minutos ahora te ahorran buscar dónde está cada cosa después.',
      cta: 'Empezar recorrido',
      icon: 'Compass',
      opensTour: true,
      done: guide.tourSeenVersion > 0,
    },
    {
      id: 'first-lesson',
      title: 'Tu primera clase',
      action: `Completa «${resumeTitle}»`,
      why: 'La ruta está ordenada de menos a más: empezar por el principio evita huecos.',
      cta: 'Abrir la clase',
      icon: 'GraduationCap',
      to: lessonPath,
      done: lessonsDone >= 1,
    },
    {
      id: 'first-quiz',
      title: 'Comprueba que lo entendiste',
      action: 'Responde el test de una clase',
      why: 'Leer no es saber. El test te dice qué repasar antes de jugarlo con fichas.',
      cta: 'Ir a una clase con test',
      icon: 'ListChecks',
      to: lessonPath,
      done: hasQuizScore(progress),
    },
    {
      id: 'first-hand',
      title: 'Juega tu primera mano',
      action: 'Siéntate en la mesa de práctica',
      why: 'La teoría se fija jugándola. El coach comenta cada decisión mientras juegas.',
      cta: 'Ir a la mesa',
      icon: 'Spade',
      to: '/app/play?seats=6',
      done: progress.stats.handsPlayed >= 1,
    },
    {
      id: 'first-tool',
      title: 'Usa una herramienta',
      action: 'Calcula la equity de una mano',
      why: 'Ver el porcentaje real de una mano corrige la intuición más rápido que cualquier texto.',
      cta: 'Abrir la calculadora',
      icon: 'Calculator',
      to: '/app/tools/equity',
      done: guide.visited.includes('equity') || guide.visited.includes('ranges'),
    },
    {
      id: 'finish-beginner',
      title: 'Termina los cimientos',
      action: `Completa el nivel ${beginner?.title ?? 'Principiante'} (${beginnerStats.done}/${beginnerStats.total} clases)`,
      why: 'Al 60% se desbloquea el nivel Intermedio y el juego postflop.',
      cta: 'Seguir la ruta',
      icon: 'Sprout',
      to: lessonPath,
      done: beginnerStats.ratio >= LEVEL_UNLOCK_RATIO,
    },
    {
      id: 'keep-going',
      title: 'Avanza por la ruta',
      action: `Siguiente clase: «${resumeTitle}»`,
      why: 'A partir de aquí la ruta manda: una clase, su práctica y a por la siguiente.',
      cta: 'Continuar',
      icon: 'Route',
      to: lessonPath,
      done: false,
    },
  ]
}

export interface JourneyStatus {
  stages: JourneyStage[]
  /** Etapa en curso: la primera sin completar. */
  current: JourneyStage
  /** Posición humana de la etapa en curso (1..total). */
  position: number
  total: number
  /** Etapas ya completadas. */
  completed: number
  /** Solo quedan etapas de recorrido libre: el onboarding terminó. */
  onboardingDone: boolean
}

export function journeyStatus(
  progress: StudentProgress,
  guide: GuideState,
  curriculum: Curriculum,
): JourneyStatus {
  const stages = buildJourney(progress, guide, curriculum)
  const index = stages.findIndex(stage => !stage.done)
  const safeIndex = index === -1 ? stages.length - 1 : index
  const completed = stages.filter(stage => stage.done).length

  return {
    stages,
    current: stages[safeIndex],
    position: safeIndex + 1,
    total: stages.length,
    completed,
    // La última etapa no se completa nunca: es el "sigue avanzando" permanente.
    onboardingDone: stages[safeIndex].id === 'keep-going',
  }
}

/** Zona de la guía a la que corresponde una ruta, para marcarla como visitada. */
export function visitedSlug(pathname: string): string | undefined {
  if (pathname.startsWith('/app/tools/equity')) return 'equity'
  if (pathname.startsWith('/app/tools/ranges')) return 'ranges'
  if (pathname.startsWith('/app/tools/trainer')) return 'trainer'
  if (pathname.startsWith('/app/tools/odds')) return 'odds'
  if (pathname.startsWith('/app/play')) return 'play'
  if (pathname.startsWith('/app/learn')) return 'learn'
  if (pathname.startsWith('/app/classes')) return 'classes'
  if (pathname.startsWith('/app/progress')) return 'progress'
  return undefined
}
