// ──────────────────────────────────────────────
// Forma del currículo — la misma que consume el
// frontend (`features/academy/types.ts`).
// La usan los datos semilla, el seeder, la vista que
// sirve la API y el respaldo en memoria cuando las
// tablas aún no existen.
// ──────────────────────────────────────────────

export type LevelSlug =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'theory'
  | 'exploit'
  | 'pro';

export type LessonKindId = 'lesson' | 'video' | 'drill' | 'quiz';

/** Modalidad de poker a la que aplica un curso o clase. */
export type FormatId = 'cash' | 'mtt' | 'spin' | 'all';

export type CalloutToneId = 'key' | 'tip' | 'warning';

export interface QuizQuestionSeed {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export type ContentBlockSeed =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; tone: CalloutToneId; title: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hands'; items: { cards: string; label: string; note?: string }[] }
  | {
      type: 'spot';
      hole: string;
      board?: string;
      question: string;
      answer: string;
    }
  | { type: 'quiz'; questions: QuizQuestionSeed[] }
  | {
      type: 'drill';
      seats: number;
      goal: string;
      hands: number;
      mode?: string;
    }
  | {
      type: 'showcase';
      /** Mesa interactiva por pestañas (`board-textures`…); el contenido vive en el frontend. */
      id: string;
    }
  | {
      type: 'range';
      /** Visor de rango (`open-btn`, `bb-vs-btn`…); el contenido vive en el frontend. */
      id: string;
    };

export type BlockTypeId = ContentBlockSeed['type'];

export interface LessonSeed {
  /** Clave estable (`code` en la base). */
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: LessonKindId;
  minutes: number;
  xp: number;
  /** Modalidades a las que aplica. Vacío o ausente = todas. */
  formats?: FormatId[];
  blocks: ContentBlockSeed[];
}

export interface CourseSeed {
  /** Clave estable (`code` en la base). */
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: LevelSlug;
  icon: string;
  outcomes: string[];
  /** Modalidades a las que aplica. Vacío o ausente = todas. */
  formats?: FormatId[];
  lessons: LessonSeed[];
}

export interface LevelSeed {
  id: LevelSlug;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  courses: CourseSeed[];
}
