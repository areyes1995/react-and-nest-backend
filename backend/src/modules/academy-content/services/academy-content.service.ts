// ──────────────────────────────────────────────
// AcademyContentService — publicación de clases.
// Lo que decide un administrador sobre el currículo:
// si un curso o una clase se publica, si la clase
// lleva video y las notas internas. Vive en las mismas
// filas que el contenido (`AcademyCourse`,
// `AcademyLesson`), y el seeder no lo sobrescribe.
//
// Si las tablas no existen todavía (migración sin
// aplicar), la lectura devuelve vacío en vez de
// reventar y la escritura avisa con un 503.
// ──────────────────────────────────────────────

import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AcademyCourse, AcademyLesson } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  AcademyContentView,
  CourseSettingView,
  LessonSettingView,
  UpdateCourseSettingDto,
  UpdateLessonSettingDto,
} from '../dtos/academy-content.dto';
import { normalizeVideo } from './video-source';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

@Injectable()
export class AcademyContentService {
  private readonly logger = new Logger(AcademyContentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Configuración completa — la usa el panel de administración. */
  async findAll(): Promise<AcademyContentView> {
    try {
      const [courses, lessons] = await Promise.all([
        this.prisma.academyCourse.findMany({ orderBy: { slug: 'asc' } }),
        this.prisma.academyLesson.findMany({
          orderBy: { code: 'asc' },
          include: { course: { select: { slug: true } } },
        }),
      ]);

      return {
        courses: courses.map((row) => this.toCourseView(row)),
        lessons: lessons.map((row) => this.toLessonView(row)),
        persisted: true,
      };
    } catch (err) {
      if (this.isMissingTable(err)) {
        this.logger.warn(
          'Las tablas del currículo no existen todavía: aplica la migración y ejecuta `pnpm db:seed:academy`.',
        );
        return { courses: [], lessons: [], persisted: false };
      }
      throw err;
    }
  }

  /** Solo lo que un estudiante puede ver: sin notas internas ni despublicados ocultos. */
  async findPublic(): Promise<AcademyContentView> {
    const all = await this.findAll();
    return {
      persisted: all.persisted,
      courses: all.courses.map(({ courseSlug, published }) => ({
        courseSlug,
        published,
      })),
      lessons: all.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        courseSlug: lesson.courseSlug,
        published: lesson.published,
        videoEnabled: lesson.videoEnabled,
        videoProvider: lesson.videoProvider,
        videoUrl: lesson.videoUrl,
        videoTitle: lesson.videoTitle,
        videoDurationSec: lesson.videoDurationSec,
      })),
    };
  }

  async updateLesson(
    lessonId: string,
    dto: UpdateLessonSettingDto,
    userId?: number,
  ): Promise<LessonSettingView> {
    const video = normalizeVideo(dto.videoProvider, dto.videoUrl);

    // Habilitar el video sin fuente válida no tiene sentido: se deja apagado
    // y el frontend enseña la clase como siempre.
    const videoEnabled = dto.videoEnabled === true && video.value !== null;

    const row = await this.write(
      () =>
        this.prisma.academyLesson.update({
          where: { code: lessonId },
          data: {
            published: dto.published ?? true,
            videoEnabled,
            videoProvider: video.value ? video.provider : 'NONE',
            videoUrl: video.value,
            videoTitle: dto.videoTitle?.trim() || null,
            videoDurationSec: dto.videoDurationSec ?? null,
            notes: dto.notes?.trim() || null,
            updatedById: userId ?? null,
          },
          include: { course: { select: { slug: true } } },
        }),
      `La clase «${lessonId}» no existe.`,
    );

    return this.toLessonView(row);
  }

  async updateCourse(
    courseSlug: string,
    dto: UpdateCourseSettingDto,
    userId?: number,
  ): Promise<CourseSettingView> {
    const row = await this.write(
      () =>
        this.prisma.academyCourse.update({
          where: { slug: courseSlug },
          data: {
            published: dto.published ?? true,
            notes: dto.notes?.trim() || null,
            updatedById: userId ?? null,
          },
        }),
      `El curso «${courseSlug}» no existe.`,
    );

    return this.toCourseView(row);
  }

  /** Devuelve la clase a su estado por defecto: publicada, sin video y sin notas. */
  async resetLesson(
    lessonId: string,
  ): Promise<{ lessonId: string; reset: boolean }> {
    await this.write(
      () =>
        this.prisma.academyLesson.update({
          where: { code: lessonId },
          data: {
            published: true,
            videoEnabled: false,
            videoProvider: 'NONE',
            videoUrl: null,
            videoTitle: null,
            videoDurationSec: null,
            notes: null,
          },
        }),
      `La clase «${lessonId}» no existe.`,
    );
    return { lessonId, reset: true };
  }

  /** Traduce los errores de Prisma de una escritura a respuestas HTTP. */
  private async write<T>(
    operation: () => Promise<T>,
    notFound: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2025') throw new NotFoundException(notFound);
      if (this.isMissingTable(err)) {
        throw new ServiceUnavailableException(
          'Las tablas del currículo no existen todavía: aplica la migración y ejecuta `pnpm db:seed:academy`.',
        );
      }
      throw err;
    }
  }

  private toLessonView(
    row: AcademyLesson & { course?: { slug: string } },
  ): LessonSettingView {
    return {
      lessonId: row.code,
      courseSlug: row.course?.slug ?? '',
      published: row.published,
      videoEnabled: row.videoEnabled,
      videoProvider: row.videoProvider,
      videoUrl: row.videoUrl,
      videoTitle: row.videoTitle,
      videoDurationSec: row.videoDurationSec,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCourseView(row: AcademyCourse): CourseSettingView {
    return {
      courseSlug: row.slug,
      published: row.published,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return code !== undefined && MISSING_TABLE_CODES.has(code);
  }
}
