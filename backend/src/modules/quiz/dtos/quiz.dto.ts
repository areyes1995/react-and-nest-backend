// ──────────────────────────────────────────────
// DTOs del banco de preguntas.
// `QuizQuestionView` es el contrato único: la misma
// forma sale de la base, del banco semilla y de la
// IA, así que el cliente pinta las tres igual.
// ──────────────────────────────────────────────

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  QUIZ_CATEGORY_IDS,
  QUIZ_FORMATS,
  QUIZ_LEVELS,
  QUIZ_MAX_LIMIT,
  QUIZ_MODES,
  QuizFormatId,
  QuizLevelId,
  QuizModeId,
  QUIZ_SOURCES,
  QuizSourceId,
} from '../constants/quiz.constants';

export class QuizQuestionsQueryDto {
  /** Un nivel o `random` para mezclarlos todos. */
  @IsOptional() @IsIn(QUIZ_MODES) mode?: QuizModeId;

  @IsOptional() @IsIn(QUIZ_CATEGORY_IDS) category?: string;

  /** Solo del banco local o solo de IA (la "ronda IA" que da XP ×2). */
  @IsOptional() @IsIn(QUIZ_SOURCES) source?: QuizSourceId;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(QUIZ_MAX_LIMIT)
  limit?: number;
}

export class GenerateQuizDto {
  @IsIn(QUIZ_LEVELS) level: QuizLevelId;

  /** Tema de la lista cerrada; sin él, la IA elige temas variados del nivel. */
  @IsOptional() @IsIn(QUIZ_CATEGORY_IDS) category?: string;

  /** Formato de pregunta; sin él, la IA mezcla formatos. */
  @IsOptional() @IsIn(QUIZ_FORMATS) format?: QuizFormatId;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(QUIZ_MAX_LIMIT)
  count?: number;

  /** Enfoque libre del estudiante ("faroles en el river", "jugar desde la ciega grande"…). */
  @IsOptional() @IsString() @MaxLength(160) topic?: string;
}

/** Una pregunta que un administrador decide guardar tras revisarla. */
export class SaveQuizQuestionDto {
  /** El id que devolvió `generate`; se reutiliza como slug para no duplicar. */
  @IsOptional() @IsString() @MaxLength(120) id?: string;
  @IsIn(QUIZ_LEVELS) level: QuizLevelId;
  @IsIn(QUIZ_FORMATS) format: QuizFormatId;
  @IsIn(QUIZ_CATEGORY_IDS) category: string;
  @IsString() @MaxLength(500) question: string;
  @IsArray() @IsString({ each: true }) options: string[];
  @Type(() => Number) @IsInt() answerIndex: number;
  @IsString() @MaxLength(900) explanation: string;
  @IsOptional() @IsString() @MaxLength(20) hole?: string | null;
  @IsOptional() @IsString() @MaxLength(40) board?: string | null;
}

export class SaveQuizQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUIZ_MAX_LIMIT)
  @ValidateNested({ each: true })
  @Type(() => SaveQuizQuestionDto)
  questions: SaveQuizQuestionDto[];

  /** `true`: entran en las partidas de los estudiantes. `false`: quedan como borrador. */
  @IsBoolean() publish: boolean;
}

export interface SaveQuizQuestionsResult {
  saved: number;
  /** No pasaron la validación o ya estaban guardadas. */
  skipped: number;
  published: boolean;
}

export interface QuizQuestionView {
  /** `slug` en la base; las de IA sin guardar llevan uno temporal. */
  id: string;
  level: QuizLevelId;
  format: QuizFormatId;
  category: string;
  question: string;
  /** Ya barajadas (salvo verdadero/falso), con `answerIndex` recalculado. */
  options: string[];
  answerIndex: number;
  explanation: string;
  hole: string | null;
  board: string | null;
  /** `local` = banco propio (seeder); `ai` = generada por IA. */
  source: QuizSourceId;
}

export interface QuizQuestionsResult {
  questions: QuizQuestionView[];
  /** `false` si la tabla aún no existe y se sirvió el banco semilla en memoria. */
  persisted: boolean;
}

export interface QuizMetaResult {
  levels: { id: QuizLevelId; label: string; count: number }[];
  categories: { id: string; label: string; count: number }[];
  total: number;
  /** Publicadas por origen: la ronda IA solo aparece si hay preguntas de IA. */
  sources: Record<QuizSourceId, number>;
  persisted: boolean;
  /** ADMIN o SUPERADMIN: ve el generador y puede guardar en el banco. */
  canGenerate: boolean;
  /** Solo para administradores; `null` para el resto. */
  ai: {
    ready: boolean;
    provider: string;
    model: string;
    /** Qué falta por configurar, en lenguaje llano. */
    issues: string[];
    maxQuestions: number;
  } | null;
}

export interface GenerateQuizResult {
  source: 'ai';
  questions: QuizQuestionView[];
  /** Preguntas que devolvió el modelo pero no pasaron la validación. */
  discarded: number;
  model?: string;
  provider: string;
  latencyMs: number;
}
