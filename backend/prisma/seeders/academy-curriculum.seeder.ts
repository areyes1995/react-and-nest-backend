import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CURRICULUM_SEED } from '../../src/modules/academy-content/data/curriculum';
import {
  blockCreateInput,
  toDbLessonKind,
} from '../../src/modules/academy-content/services/curriculum.mapper';

/**
 * Currículo de la academia: niveles, cursos, resultados de aprendizaje, clases
 * y los bloques de cada clase.
 *
 * Idempotente. Las claves estables son el `slug` del nivel y el `code` de cursos
 * y clases: volver a sembrar actualiza el contenido en vez de duplicarlo, y los
 * bloques de cada clase se reescriben enteros (son contenido, no decisiones).
 *
 * Lo que decide un administrador — publicación, video y notas — NO se toca.
 * Tampoco se borra nada que ya no esté en la semilla: se avisa, y quien
 * administra decide si despublicarlo.
 */
export async function seedAcademyCurriculum(
  prisma: PrismaClient,
): Promise<void> {
  console.log('📚  Seed del currículo de la academia...\n');

  const seededCourses = new Set<string>();
  const seededLessons = new Set<string>();
  let blocks = 0;

  try {
    for (const [levelIndex, level] of CURRICULUM_SEED.entries()) {
      const levelData = {
        title: level.title,
        subtitle: level.subtitle,
        description: level.description,
        color: level.color,
        icon: level.icon,
        position: levelIndex,
      };
      const levelRow = await prisma.academyLevel.upsert({
        where: { slug: level.id },
        update: levelData,
        create: { slug: level.id, ...levelData },
      });

      for (const [courseIndex, course] of level.courses.entries()) {
        const courseData = {
          slug: course.slug,
          levelId: levelRow.id,
          title: course.title,
          summary: course.summary,
          icon: course.icon,
          position: courseIndex,
        };
        const courseRow = await prisma.academyCourse.upsert({
          where: { code: course.id },
          update: courseData,
          create: { code: course.id, ...courseData },
        });
        seededCourses.add(course.id);

        await prisma.$transaction([
          prisma.academyCourseOutcome.deleteMany({
            where: { courseId: courseRow.id },
          }),
          prisma.academyCourseOutcome.createMany({
            data: course.outcomes.map((text, position) => ({
              courseId: courseRow.id,
              position,
              text,
            })),
          }),
        ]);

        for (const [lessonIndex, lesson] of course.lessons.entries()) {
          const lessonData = {
            courseId: courseRow.id,
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary,
            kind: toDbLessonKind(lesson.kind),
            minutes: lesson.minutes,
            xp: lesson.xp,
            position: lessonIndex,
          };

          await prisma.$transaction(async (tx) => {
            const lessonRow = await tx.academyLesson.upsert({
              where: { code: lesson.id },
              update: lessonData,
              create: { code: lesson.id, ...lessonData },
            });

            // Los bloques se reescriben: sus manos y preguntas caen en cascada.
            await tx.academyLessonBlock.deleteMany({
              where: { lessonId: lessonRow.id },
            });
            for (const [position, block] of lesson.blocks.entries()) {
              await tx.academyLessonBlock.create({
                data: {
                  ...blockCreateInput(block, position),
                  lesson: { connect: { id: lessonRow.id } },
                },
              });
            }
          });

          seededLessons.add(lesson.id);
          blocks += lesson.blocks.length;
        }
      }
    }
  } catch (err) {
    // Sin las tablas no se puede sembrar, pero el resto de seeders sí debe correr:
    // la API sirve el currículo semilla en memoria mientras tanto.
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      console.warn(
        '  ⚠️  Las tablas del currículo no existen todavía: aplica la migración y vuelve a sembrar.',
      );
      return;
    }
    throw err;
  }

  const [orphanCourses, orphanLessons] = await Promise.all([
    prisma.academyCourse.findMany({
      where: { code: { notIn: [...seededCourses] } },
      select: { code: true },
    }),
    prisma.academyLesson.findMany({
      where: { code: { notIn: [...seededLessons] } },
      select: { code: true },
    }),
  ]);

  console.log(
    `  ✅  ${CURRICULUM_SEED.length} niveles, ${seededCourses.size} cursos, ${seededLessons.size} clases y ${blocks} bloques insertados/actualizados`,
  );
  if (orphanCourses.length || orphanLessons.length) {
    console.warn(
      `  ⚠️  En la base hay contenido que ya no está en la semilla (no se borra): ${[
        ...orphanCourses.map((row) => row.code),
        ...orphanLessons.map((row) => row.code),
      ].join(', ')}`,
    );
  }
}

// `pnpm db:seed:academy` — siembra solo el currículo, sin pasar por los roles.
if (require.main === module) {
  void (async () => {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL ?? '',
      }),
    });
    try {
      await seedAcademyCurriculum(prisma);
    } catch (err) {
      console.error('\n❌  Error sembrando el currículo:', err);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
