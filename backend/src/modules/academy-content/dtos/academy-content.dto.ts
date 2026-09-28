// ──────────────────────────────────────────────
// DTOs de la gestión de contenido de la academia.
// Lo que viaja no es la clase, sino la decisión sobre
// ella: si se publica y si lleva video. El contenido
// se sirve con `CurriculumView` (curriculum.dto.ts).
// ──────────────────────────────────────────────

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const VIDEO_PROVIDERS = ['NONE', 'YOUTUBE', 'VIMEO', 'MP4'] as const;
export type VideoProviderId = (typeof VIDEO_PROVIDERS)[number];

export class UpdateLessonSettingDto {
  /** Curso de la clase. Se acepta por compatibilidad; la clase ya lo sabe. */
  @IsOptional() @IsString() @MaxLength(120) courseSlug?: string;

  @IsOptional() @IsBoolean() published?: boolean;

  @IsOptional() @IsBoolean() videoEnabled?: boolean;

  @IsOptional() @IsIn(VIDEO_PROVIDERS) videoProvider?: VideoProviderId;

  /** URL completa o ID del video; el backend normaliza las de YouTube/Vimeo. */
  @IsOptional() @IsString() @MaxLength(500) videoUrl?: string;

  @IsOptional() @IsString() @MaxLength(200) videoTitle?: string;

  @IsOptional() @IsInt() @Min(0) videoDurationSec?: number;

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateCourseSettingDto {
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

/** Vista pública de la configuración de una clase. */
export interface LessonSettingView {
  lessonId: string;
  courseSlug: string;
  published: boolean;
  videoEnabled: boolean;
  videoProvider: VideoProviderId;
  /** Identificador ya normalizado (ID de YouTube/Vimeo o URL del MP4). */
  videoUrl: string | null;
  videoTitle: string | null;
  videoDurationSec: number | null;
  notes?: string | null;
  updatedAt?: string;
}

export interface CourseSettingView {
  courseSlug: string;
  published: boolean;
  notes?: string | null;
  updatedAt?: string;
}

export interface AcademyContentView {
  courses: CourseSettingView[];
  lessons: LessonSettingView[];
  /** `false` cuando la tabla aún no existe (migración sin aplicar). */
  persisted: boolean;
}
