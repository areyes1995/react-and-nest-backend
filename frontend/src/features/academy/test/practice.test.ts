// ──────────────────────────────────────────────
// Práctica guiada: toda clase se puede llevar a la
// mesa. Lo importante es que no dependa de que
// alguien escribiera un bloque `drill` en el
// currículo — si falta, el nivel decide. (Que los
// modos del currículo real existan lo comprueba el
// backend, que es donde vive el contenido.)
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { practiceForLesson } from '@features/academy/practice'
import type { Lesson } from '@features/academy/types'

function lesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'test-lesson',
    slug: 'test-lesson',
    title: 'Clase de prueba',
    summary: 'Resumen',
    kind: 'lesson',
    minutes: 10,
    xp: 50,
    blocks: [{ type: 'paragraph', text: 'Contenido' }],
    ...overrides,
  }
}

describe('practiceForLesson', () => {
  it('usa el ejercicio del currículo cuando la clase lo declara', () => {
    const practice = practiceForLesson(
      lesson({
        blocks: [
          { type: 'drill', mode: 'cbet', seats: 6, goal: 'Justifica cada c-bet', hands: 30 },
        ],
      }),
      'intermediate',
    )

    expect(practice).toMatchObject({
      drillId: 'cbet',
      seats: 6,
      goal: 'Justifica cada c-bet',
      hands: 30,
      explicit: true,
    })
  })

  it('cae en el entrenamiento del nivel si la clase no declara ejercicio', () => {
    const practice = practiceForLesson(lesson(), 'pro')
    expect(practice.drillId).toBe('discipline')
    expect(practice.explicit).toBe(false)
    expect(practice.goal).toContain('Clase de prueba')
  })

  it('un ejercicio sin modo declarado también recibe el del nivel', () => {
    const practice = practiceForLesson(
      lesson({ blocks: [{ type: 'drill', seats: 9, goal: 'Juega 20 manos', hands: 20 }] }),
      'beginner',
    )
    expect(practice.drillId).toBe('preflop-position')
    expect(practice.seats).toBe(9)
  })

})
