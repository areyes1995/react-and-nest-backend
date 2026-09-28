import { describe, it, expect } from 'vitest'
import { buildJourney, journeyStatus, visitedSlug } from '@features/guide/journey'
import { DEFAULT_GUIDE_STATE, type GuideState } from '@features/guide/storage'
import { EMPTY_PROGRESS, type StudentProgress } from '@features/progress/store'
import { FIXTURE_CURRICULUM } from '@features/academy/test/fixtures'

const PATH = FIXTURE_CURRICULUM.path

/** Progreso de un estudiante recién llegado, con los ajustes que pida la prueba. */
function student(overrides: Partial<StudentProgress> = {}): StudentProgress {
  return {
    ...EMPTY_PROGRESS,
    ...overrides,
    stats: { ...EMPTY_PROGRESS.stats, ...(overrides.stats ?? {}) },
  }
}

function guide(overrides: Partial<GuideState> = {}): GuideState {
  return { ...DEFAULT_GUIDE_STATE, ...overrides }
}

/** Marca las `count` primeras clases de la ruta como completadas. */
function completeLessons(count: number): StudentProgress['lessons'] {
  return Object.fromEntries(
    PATH.slice(0, count).map(step => [
      step.lesson.id,
      { lessonId: step.lesson.id, completedAt: '2026-01-01T00:00:00.000Z' },
    ]),
  )
}

describe('buildJourney', () => {
  it('arranca con todas las etapas pendientes para un estudiante nuevo', () => {
    const stages = buildJourney(student(), guide(), FIXTURE_CURRICULUM)
    expect(stages.every(stage => !stage.done)).toBe(true)
  })

  it('la primera etapa se resuelve abriendo el tour, no navegando', () => {
    const [first] = buildJourney(student(), guide(), FIXTURE_CURRICULUM)
    expect(first.opensTour).toBe(true)
    expect(first.to).toBeUndefined()
  })

  it('el tour queda hecho en cuanto se ha visto una vez', () => {
    const stages = buildJourney(student(), guide({ tourSeenVersion: 1 }), FIXTURE_CURRICULUM)
    expect(stages.find(stage => stage.id === 'tour')?.done).toBe(true)
  })

  it('completar una clase cierra la etapa de la primera clase', () => {
    const stages = buildJourney(student({ lessons: completeLessons(1) }), guide(), FIXTURE_CURRICULUM)
    expect(stages.find(stage => stage.id === 'first-lesson')?.done).toBe(true)
    // Responder un test es otra cosa: esa sigue pendiente.
    expect(stages.find(stage => stage.id === 'first-quiz')?.done).toBe(false)
  })

  it('la etapa del test exige una puntuación, no solo haber completado', () => {
    const lessons = completeLessons(1)
    const [id] = Object.keys(lessons)
    lessons[id] = { ...lessons[id], score: { correct: 3, total: 4 } }
    const stages = buildJourney(student({ lessons }), guide(), FIXTURE_CURRICULUM)
    expect(stages.find(stage => stage.id === 'first-quiz')?.done).toBe(true)
  })

  it('jugar una mano cierra la etapa de la mesa', () => {
    const stages = buildJourney(student({ stats: { ...EMPTY_PROGRESS.stats, handsPlayed: 1 } }), guide(), FIXTURE_CURRICULUM)
    expect(stages.find(stage => stage.id === 'first-hand')?.done).toBe(true)
  })

  it('vale cualquiera de las dos herramientas para cerrar su etapa', () => {
    const withRanges = buildJourney(student(), guide({ visited: ['ranges'] }), FIXTURE_CURRICULUM)
    expect(withRanges.find(stage => stage.id === 'first-tool')?.done).toBe(true)

    const withPlayOnly = buildJourney(student(), guide({ visited: ['play'] }), FIXTURE_CURRICULUM)
    expect(withPlayOnly.find(stage => stage.id === 'first-tool')?.done).toBe(false)
  })

  it('la etapa final nunca se marca como hecha: es el avance permanente', () => {
    const stages = buildJourney(student({ lessons: completeLessons(PATH.length) }), guide(), FIXTURE_CURRICULUM)
    expect(stages[stages.length - 1].id).toBe('keep-going')
    expect(stages[stages.length - 1].done).toBe(false)
  })
})

describe('journeyStatus', () => {
  it('la etapa en curso es la primera sin completar', () => {
    const status = journeyStatus(student(), guide(), FIXTURE_CURRICULUM)
    expect(status.current.id).toBe('tour')
    expect(status.position).toBe(1)
    expect(status.completed).toBe(0)
  })

  it('avanza de etapa conforme el estudiante cumple requisitos', () => {
    const status = journeyStatus(student(), guide({ tourSeenVersion: 1 }), FIXTURE_CURRICULUM)
    expect(status.current.id).toBe('first-lesson')
    expect(status.position).toBe(2)
    expect(status.completed).toBe(1)
  })

  it('el onboarding no se da por terminado mientras quede una etapa', () => {
    expect(journeyStatus(student(), guide(), FIXTURE_CURRICULUM).onboardingDone).toBe(false)
  })

  it('con todo cumplido queda solo la etapa de avance libre', () => {
    const lessons = completeLessons(PATH.length)
    const [id] = Object.keys(lessons)
    lessons[id] = { ...lessons[id], score: { correct: 1, total: 1 } }

    const status = journeyStatus(
      student({ lessons, stats: { ...EMPTY_PROGRESS.stats, handsPlayed: 5 } }),
      guide({ tourSeenVersion: 1, visited: ['equity'] }),
      FIXTURE_CURRICULUM,
    )
    expect(status.current.id).toBe('keep-going')
    expect(status.onboardingDone).toBe(true)
  })

  it('position y total son coherentes con la lista de etapas', () => {
    const status = journeyStatus(student(), guide(), FIXTURE_CURRICULUM)
    expect(status.total).toBe(status.stages.length)
    expect(status.stages[status.position - 1].id).toBe(status.current.id)
  })
})

describe('visitedSlug', () => {
  it.each([
    ['/app/tools/equity', 'equity'],
    ['/app/tools/ranges', 'ranges'],
    ['/app/tools/trainer', 'trainer'],
    ['/app/play?seats=6', 'play'],
    ['/app/classes/fundamentos/reglas', 'classes'],
    ['/app/progress/hands', 'progress'],
  ])('%s → %s', (path, expected) => {
    expect(visitedSlug(path)).toBe(expected)
  })

  it('devuelve undefined en rutas sin zona asociada', () => {
    expect(visitedSlug('/app/settings')).toBeUndefined()
    expect(visitedSlug('/app/home')).toBeUndefined()
  })
})
