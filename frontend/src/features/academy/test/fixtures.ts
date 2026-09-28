// ──────────────────────────────────────────────
// Currículo de prueba. El real vive en el backend;
// los tests del frontend trabajan con uno pequeño y
// conocido: dos niveles, tres cursos y seis clases.
// ──────────────────────────────────────────────

import { createCurriculum } from '@features/academy/curriculum'
import type { Course, Lesson, Level, LevelId } from '@features/academy/types'

export function lessonFixture(id: string, overrides: Partial<Lesson> = {}): Lesson {
  return {
    id,
    slug: id,
    title: `Clase ${id}`,
    summary: 'Resumen',
    kind: 'lesson',
    minutes: 10,
    xp: 30,
    blocks: [{ type: 'paragraph', text: 'Contenido' }],
    ...overrides,
  }
}

function course(id: string, level: LevelId, lessons: Lesson[]): Course {
  return {
    id,
    slug: `curso-${id}`,
    title: `Curso ${id}`,
    summary: 'Resumen del curso',
    level,
    icon: 'BookOpen',
    outcomes: [`Dominar ${id}`],
    lessons,
  }
}

function level(id: LevelId, title: string, courses: Course[]): Level {
  return {
    id,
    title,
    subtitle: 'Subtítulo',
    description: 'Descripción',
    color: `var(--level-${id})`,
    icon: 'Sprout',
    courses,
  }
}

export const FIXTURE_LEVELS: Level[] = [
  level('beginner', 'Principiante', [
    course('reglas', 'beginner', [lessonFixture('l-1'), lessonFixture('l-2')]),
    course('posicion', 'beginner', [lessonFixture('l-3'), lessonFixture('l-4')]),
  ]),
  level('intermediate', 'Intermedio', [
    course('postflop', 'intermediate', [lessonFixture('l-5'), lessonFixture('l-6')]),
  ]),
]

export const FIXTURE_CURRICULUM = createCurriculum(FIXTURE_LEVELS)
