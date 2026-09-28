// ──────────────────────────────────────────────
// Vistas del currículo que sirve la API.
// Misma forma que el currículo semilla, más lo que
// decide el administrador: publicación, video y notas.
// ──────────────────────────────────────────────

import type {
  CourseSeed,
  LessonSeed,
  LevelSeed,
} from '../data/curriculum/curriculum.types';
import type { VideoProviderId } from './academy-content.dto';

export interface LessonVideoView {
  /** Solo los administradores reciben vídeos apagados, para poder editarlos. */
  enabled: boolean;
  provider: VideoProviderId;
  /** ID de YouTube/Vimeo o URL del MP4, ya normalizado. */
  url: string | null;
  title: string | null;
  durationSec: number | null;
}

export interface LessonView extends LessonSeed {
  published: boolean;
  /** `null` si la clase no lleva video (o, para un estudiante, si está apagado). */
  video: LessonVideoView | null;
  /** Nota interna: solo llega a administradores. */
  notes?: string | null;
}

export interface CourseView extends Omit<CourseSeed, 'lessons'> {
  published: boolean;
  notes?: string | null;
  lessons: LessonView[];
}

export interface LevelView extends Omit<LevelSeed, 'courses'> {
  courses: CourseView[];
}

/** Cifras del programa, calculadas sobre lo publicado. */
export interface ProgramStatsView {
  levels: number;
  courses: number;
  lessons: number;
  minutes: number;
  /** Clases que se practican en la mesa. */
  drills: number;
  /** Clases con test de comprobación. */
  quizzes: number;
  /** Situaciones de mano resueltas dentro de las clases. */
  spots: number;
}

export interface CurriculumView {
  levels: LevelView[];
  stats: ProgramStatsView;
  /** `false` si las tablas aún no existen y se sirve el currículo semilla. */
  persisted: boolean;
  /** El currículo incluye lo despublicado y las notas internas. */
  admin: boolean;
}
