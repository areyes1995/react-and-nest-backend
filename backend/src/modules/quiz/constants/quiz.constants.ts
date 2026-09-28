// ──────────────────────────────────────────────
// Constantes del banco de preguntas.
// Los niveles viajan en minúscula (`beginner`…) para
// coincidir con los `LevelId` del currículo del
// frontend; en la base son el enum `QuizLevel`.
// Las categorías son una lista cerrada: la IA solo
// puede generar sobre estos temas y el filtro de la
// página se pinta a partir de ella.
// ──────────────────────────────────────────────

export const QUIZ_LEVELS = ['beginner', 'intermediate', 'advanced', 'pro'] as const;
export type QuizLevelId = (typeof QUIZ_LEVELS)[number];

/** `random` mezcla todos los niveles. */
export const QUIZ_MODES = [...QUIZ_LEVELS, 'random'] as const;
export type QuizModeId = (typeof QUIZ_MODES)[number];

export const QUIZ_LEVEL_DB: Record<QuizLevelId, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  pro: 'PRO',
};

export const QUIZ_LEVEL_LABEL: Record<QuizLevelId, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  pro: 'Profesional',
};

/** Qué se espera de cada nivel. Lo lee el prompt de la IA para calibrar la dificultad. */
export const QUIZ_LEVEL_BRIEF: Record<QuizLevelId, string> = {
  beginner:
    'Alguien que acaba de aprender las reglas: ranking de manos, orden de las calles, acciones básicas, posición elemental y contar outs sencillos.',
  intermediate:
    'Jugador que ya conoce las reglas: pot odds, regla del 4 y del 2, proyectos, c-bets, 3-bets, texturas de board y perfiles de rival.',
  advanced:
    'Jugador que piensa en rangos: MDF, fold equity, bloqueadores, rangos polarizados y capados, ventaja de rango, squeeze y valor fino.',
  pro:
    'Jugador profesional: equilibrio GTO, ratios de farol, explotación consciente, ICM, EV, protección de rangos, bankroll y varianza.',
};

export const QUIZ_FORMATS = ['multiple-choice', 'true-false', 'spot'] as const;
export type QuizFormatId = (typeof QUIZ_FORMATS)[number];

export const QUIZ_FORMAT_DB: Record<QuizFormatId, 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SPOT'> = {
  'multiple-choice': 'MULTIPLE_CHOICE',
  'true-false': 'TRUE_FALSE',
  spot: 'SPOT',
};

export interface QuizCategory {
  id: string;
  label: string;
  /** Qué cubre el tema. Se manda a la IA tal cual. */
  description: string;
}

export const QUIZ_CATEGORIES: QuizCategory[] = [
  { id: 'rules', label: 'Reglas', description: 'reglas del Texas Hold\'em No Limit, orden de acción, calles y acciones' },
  { id: 'hands', label: 'Manos', description: 'ranking de manos, kickers, empates y leer la mejor combinación de cinco cartas' },
  { id: 'position', label: 'Posición', description: 'posiciones de la mesa y cómo cambian qué manos jugar y cómo' },
  { id: 'preflop', label: 'Preflop', description: 'selección de manos, open raise, 3-bet, 4-bet, squeeze y defensa de ciegas' },
  { id: 'math', label: 'Matemáticas', description: 'outs, pot odds, equity, implied odds, fold equity y MDF' },
  { id: 'postflop', label: 'Postflop', description: 'c-bets, texturas de board, proyectos, check-raise, tamaños de apuesta y valor fino' },
  { id: 'ranges', label: 'Rangos', description: 'pensar en rangos, bloqueadores, rangos polarizados y capados, lectura de rivales' },
  { id: 'theory', label: 'Teoría', description: 'GTO, equilibrio, ratios de farol, explotación, EV e ICM' },
  { id: 'mental', label: 'Mentalidad', description: 'bankroll, varianza, tilt y evaluar decisiones en vez de resultados' },
];

export const QUIZ_CATEGORY_IDS = QUIZ_CATEGORIES.map((category) => category.id);

/** Origen de una pregunta: el banco propio (seeder) o la IA. */
export const QUIZ_SOURCES = ['local', 'ai'] as const;
export type QuizSourceId = (typeof QUIZ_SOURCES)[number];

/** Tope de preguntas por partida. */
export const QUIZ_MAX_LIMIT = 30;
