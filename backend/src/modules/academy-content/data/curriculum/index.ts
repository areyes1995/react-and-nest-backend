// ──────────────────────────────────────────────
// Currículo semilla de la academia: cuatro niveles en
// orden. Es lo que siembra el seeder y lo que sirve la
// API mientras las tablas no existan.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';
import { BEGINNER_LEVEL } from './beginner';
import { FORMATS_COURSE } from './formats';
import { INTERMEDIATE_LEVEL } from './intermediate';
import { ADVANCED_LEVEL } from './advanced';
import { THEORY_LEVEL } from './theory';
import { EXPLOIT_LEVEL } from './exploit';
import { PRO_LEVEL } from './pro';

// 6 niveles según `.docs/missing_course-part2.md:96-116`:
// L1 Fundamentos, L2 Postflop, L3 Rangos, L4 Teoría, L5 Exploit, L6 Grinder.
// Sin duplicar cursos: reraises + blind-vs-blind pasan de PRO a Rangos (L3),
// GTO pasa a Teoría (L4), exploit/pool pasan a Exploit (L5).
const COURSES_TO_MOVE_TO_RANGES = new Set(['c-reraises', 'c-blind-vs-blind']);
const COURSES_TO_EXCLUDE_FROM_PRO = new Set([
  'c-reraises',
  'c-blind-vs-blind',
  'c-gto',
  'c-exploit',
  'c-pool',
]);

const BEGINNER_WITH_FORMATS: LevelSeed = {
  ...BEGINNER_LEVEL,
  courses: [...BEGINNER_LEVEL.courses, { ...FORMATS_COURSE, level: 'beginner' as const }],
};

const ADVANCED_WITH_RERAISES: LevelSeed = {
  ...ADVANCED_LEVEL,
  courses: [
    ...ADVANCED_LEVEL.courses,
    ...PRO_LEVEL.courses
      .filter((c) => COURSES_TO_MOVE_TO_RANGES.has(c.id))
      .map((c) => ({ ...c, level: 'advanced' as const })),
  ],
};

const PRO_GRINDER_LEVEL: LevelSeed = {
  ...PRO_LEVEL,
  title: 'Grinder profesional',
  subtitle: 'El oficio completo',
  description:
    'Bankroll, varianza, winrate, mental, selección de mesa y análisis de base de datos. Lo que sostiene una carrera, no una sesión.',
  courses: PRO_LEVEL.courses.filter((c) => !COURSES_TO_EXCLUDE_FROM_PRO.has(c.id)),
};

export const CURRICULUM_SEED: LevelSeed[] = [
  BEGINNER_WITH_FORMATS,
  INTERMEDIATE_LEVEL,
  ADVANCED_WITH_RERAISES,
  THEORY_LEVEL,
  EXPLOIT_LEVEL,
  PRO_GRINDER_LEVEL,
];

export * from './curriculum.types';
