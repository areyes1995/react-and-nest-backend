// ──────────────────────────────────────────────
// AcademyCurriculumService — el currículo de la
// academia servido desde la base.
//
//  • `curriculum()`: todo, con los bloques de cada
//    clase. El estudiante recibe solo lo publicado;
//    un administrador, todo y con notas internas.
//  • `catalog()`: pública, para la landing. Niveles,
//    cursos y clases SIN su contenido.
//
// Si las tablas aún no existen (migración sin
// aplicar), se sirve el currículo semilla en memoria
// con `persisted: false`: la academia sigue en pie.
// ──────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { CURRICULUM_SEED, LevelSlug } from '../data/curriculum';
import type { FormatId } from '../data/curriculum/curriculum.types';
import {
  CourseView,
  CurriculumView,
  LessonView,
  LevelView,
  ProgramStatsView,
} from '../dtos/curriculum.dto';
import { VideoProviderId } from '../dtos/academy-content.dto';
import { BlockRow, blockFromRow, fromDbLessonKind } from './curriculum.mapper';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

const ordered = { orderBy: { position: 'asc' as const } };

const CURRICULUM_INCLUDE = {
  courses: {
    ...ordered,
    include: {
      outcomes: ordered,
      lessons: {
        ...ordered,
        include: {
          blocks: {
            ...ordered,
            include: { hands: ordered, questions: ordered },
          },
        },
      },
    },
  },
};

@Injectable()
export class AcademyCurriculumService {
  private readonly logger = new Logger(AcademyCurriculumService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Currículo completo con el contenido de las clases. */
  async curriculum(userId?: number): Promise<CurriculumView> {
    const admin = await this.isAdmin(userId);
    const { levels, persisted } = await this.load();
    const visible = admin
      ? levels
      : this.onlyPublished(levels).map(stripInternal);
    return {
      levels: visible,
      stats: programStats(this.onlyPublished(levels)),
      persisted,
      admin,
    };
  }

  /** Catálogo público: la estructura del programa sin el contenido de las clases. */
  async catalog(): Promise<CurriculumView> {
    const { levels, persisted } = await this.load();
    const published = this.onlyPublished(levels);
    const withoutContent = published.map(stripInternal).map((level) => ({
      ...level,
      courses: level.courses.map((course) => ({
        ...course,
        lessons: course.lessons.map((lesson) => ({ ...lesson, blocks: [] })),
      })),
    }));
    return {
      levels: withoutContent,
      stats: programStats(published),
      persisted,
      admin: false,
    };
  }

  async isAdmin(userId?: number): Promise<boolean> {
    if (!userId || !Number.isFinite(userId)) return false;
    const user = await this.prisma.systemUser.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    return (user?.roles ?? []).some(
      (link) =>
        link.role.isActive &&
        (link.role.name === ROLES.ADMIN || link.role.name === ROLES.SUPERADMIN),
    );
  }

  private async load(): Promise<{ levels: LevelView[]; persisted: boolean }> {
    try {
      const rows = await this.prisma.academyLevel.findMany({
        ...ordered,
        include: CURRICULUM_INCLUDE,
      });
      return { levels: rows.map(levelFromRow), persisted: true };
    } catch (err) {
      if (!this.isMissingTable(err)) throw err;
      this.logger.warn(
        'Las tablas del currículo no existen todavía: se sirve el currículo semilla. Aplica la migración y ejecuta `pnpm db:seed:academy`.',
      );
      return { levels: seedLevels(), persisted: false };
    }
  }

  /** Quita cursos y clases despublicados. */
  private onlyPublished(levels: LevelView[]): LevelView[] {
    return levels.map((level) => ({
      ...level,
      courses: level.courses
        .filter((course) => course.published)
        .map((course) => ({
          ...course,
          lessons: course.lessons.filter((lesson) => lesson.published),
        })),
    }));
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return code !== undefined && MISSING_TABLE_CODES.has(code);
  }
}

// ── Construcción de las vistas ────────────────

interface LevelRow {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  courses: CourseRow[];
}

interface CourseRow {
  code: string;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  published: boolean;
  notes: string | null;
  outcomes: { text: string }[];
  lessons: LessonRow[];
}

interface LessonRow {
  code: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  minutes: number;
  xp: number;
  published: boolean;
  videoEnabled: boolean;
  videoProvider: string;
  videoUrl: string | null;
  videoTitle: string | null;
  videoDurationSec: number | null;
  notes: string | null;
  blocks: BlockRow[];
}

function levelFromRow(row: LevelRow): LevelView {
  const slug = row.slug as LevelSlug;
  return {
    id: slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    color: row.color,
    icon: row.icon,
    courses: row.courses.map((course): CourseView => ({
      id: course.code,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      level: slug,
      icon: course.icon,
      outcomes: course.outcomes.map((outcome) => outcome.text),
      published: course.published,
      notes: course.notes,
      formats: courseFormats(course.code),
      lessons: course.lessons.map(lessonFromRow),
    })),
  };
}

function lessonFromRow(row: LessonRow): LessonView {
  const hasVideo = row.videoProvider !== 'NONE' && !!row.videoUrl;
  return {
    id: row.code,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    kind: fromDbLessonKind(row.kind),
    minutes: row.minutes,
    xp: row.xp,
    published: row.published,
    formats: lessonFormats(row.code),
    video: hasVideo
      ? {
          enabled: row.videoEnabled,
          provider: row.videoProvider as VideoProviderId,
          url: row.videoUrl,
          title: row.videoTitle,
          durationSec: row.videoDurationSec,
        }
      : null,
    notes: row.notes,
    blocks: row.blocks
      .map(blockFromRow)
      .filter((block): block is NonNullable<typeof block> => block !== null),
  };
}

// ── Etiquetas de modalidad (cash/mtt/spin) ───
// Viven en la semilla, no en la base: así no hace falta
// migración y llegan igual sirva la API desde la base
// o desde la semilla en memoria.
const COURSE_FORMATS = new Map<string, FormatId[]>();
const LESSON_FORMATS = new Map<string, FormatId[]>();
for (const level of CURRICULUM_SEED) {
  for (const course of level.courses) {
    if (course.formats) COURSE_FORMATS.set(course.id, course.formats);
    for (const lesson of course.lessons) {
      if (lesson.formats) LESSON_FORMATS.set(lesson.id, lesson.formats);
    }
  }
}

const courseFormats = (code: string): FormatId[] | undefined => COURSE_FORMATS.get(code);
const lessonFormats = (code: string): FormatId[] | undefined => LESSON_FORMATS.get(code);

/** El currículo semilla con la forma de la API: todo publicado y sin video. */
export function seedLevels(): LevelView[] {  return CURRICULUM_SEED.map((level) => ({
    ...level,
    courses: level.courses.map((course) => ({
      ...course,
      published: true,
      notes: null,
      lessons: course.lessons.map((lesson) => ({
        ...lesson,
        published: true,
        video: null,
        notes: null,
      })),
    })),
  }));
}

/** Lo que el estudiante no debe recibir: notas internas y videos apagados. */
function stripInternal(level: LevelView): LevelView {
  return {
    ...level,
    // `undefined` no viaja en el JSON: la clave desaparece de la respuesta.
    courses: level.courses.map((course) => ({
      ...course,
      notes: undefined,
      lessons: course.lessons.map((lesson) => ({
        ...lesson,
        notes: undefined,
        video: lesson.video?.enabled ? lesson.video : null,
      })),
    })),
  };
}

export function programStats(levels: LevelView[]): ProgramStatsView {
  const courses = levels.flatMap((level) => level.courses);
  const lessons = courses.flatMap((course) => course.lessons);
  const hasBlock = (lesson: LessonView, type: string) =>
    lesson.blocks.some((block) => block.type === type);

  return {
    levels: levels.length,
    courses: courses.length,
    lessons: lessons.length,
    minutes: lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    drills: lessons.filter(
      (lesson) => lesson.kind === 'drill' || hasBlock(lesson, 'drill'),
    ).length,
    quizzes: lessons.filter((lesson) => hasBlock(lesson, 'quiz')).length,
    spots: lessons
      .flatMap((lesson) => lesson.blocks)
      .filter((block) => block.type === 'spot').length,
  };
}
