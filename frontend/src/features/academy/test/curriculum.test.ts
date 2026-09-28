// ──────────────────────────────────────────────
// Consultas de la ruta sobre el currículo que llega
// del backend: orden, búsquedas, siguiente clase y
// desbloqueo de niveles.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { EMPTY_CURRICULUM } from '@features/academy/curriculum'
import { FIXTURE_CURRICULUM as curriculum } from './fixtures'

const done = (...ids: string[]) => Object.fromEntries(ids.map(id => [id, true]))

describe('createCurriculum', () => {
  it('ordena la ruta nivel → curso → clase', () => {
    expect(curriculum.path.map(step => step.lesson.id)).toEqual(['l-1', 'l-2', 'l-3', 'l-4', 'l-5', 'l-6'])
    expect(curriculum.path.map(step => step.index)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('encuentra cursos, clases y el paso de una clase', () => {
    expect(curriculum.findCourse('curso-posicion')?.id).toBe('posicion')
    expect(curriculum.findLesson('curso-posicion', 'l-4')?.id).toBe('l-4')
    expect(curriculum.findLesson('curso-reglas', 'l-4')).toBeUndefined()
    expect(curriculum.findLessonById('l-5')?.level.id).toBe('intermediate')
  })

  it('siguiente y anterior cruzan cursos y niveles', () => {
    expect(curriculum.nextStep('l-4')?.lesson.id).toBe('l-5')
    expect(curriculum.previousStep('l-3')?.lesson.id).toBe('l-2')
    expect(curriculum.previousStep('l-1')).toBeUndefined()
    expect(curriculum.nextStep('l-6')).toBeUndefined()
  })

  it('continuar lleva a la primera clase sin completar, o a la última', () => {
    expect(curriculum.resumeStep({})?.lesson.id).toBe('l-1')
    expect(curriculum.resumeStep(done('l-1', 'l-3'))?.lesson.id).toBe('l-2')
    expect(curriculum.resumeStep(done('l-1', 'l-2', 'l-3', 'l-4', 'l-5', 'l-6'))?.lesson.id).toBe('l-6')
  })

  it('el nivel siguiente se abre al 60% del anterior', () => {
    expect(curriculum.isLevelUnlocked('beginner', {})).toBe(true)
    expect(curriculum.isLevelUnlocked('intermediate', done('l-1', 'l-2'))).toBe(false)
    expect(curriculum.isLevelUnlocked('intermediate', done('l-1', 'l-2', 'l-3'))).toBe(true)
  })

  it('un currículo vacío no rompe ninguna consulta', () => {
    expect(EMPTY_CURRICULUM.path).toEqual([])
    expect(EMPTY_CURRICULUM.resumeStep({})).toBeUndefined()
    expect(EMPTY_CURRICULUM.findCourse('lo-que-sea')).toBeUndefined()
  })
})
