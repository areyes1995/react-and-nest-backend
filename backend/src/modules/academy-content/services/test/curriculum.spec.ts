// ──────────────────────────────────────────────
// El currículo de la academia.
// Tres garantías:
//  1. La semilla es coherente: claves únicas, quizzes
//     con respuesta válida, cartas legales.
//  2. Ningún bloque cambia al pasar por la base
//     (semilla → fila → API).
//  3. El estudiante solo recibe lo publicado, sin notas
//     internas; y sin tablas la academia sigue en pie.
// ──────────────────────────────────────────────

import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CURRICULUM_SEED, ContentBlockSeed } from '../../data/curriculum';
import { BlockRow, blockCreateInput, blockFromRow } from '../curriculum.mapper';
import {
  AcademyCurriculumService,
  programStats,
  seedLevels,
} from '../academy-curriculum.service';

const CARD = /^[2-9TJQKA][shdc]$/;

const courses = CURRICULUM_SEED.flatMap((level) => level.courses);
const lessons = courses.flatMap((course) => course.lessons);
const blocks = lessons.flatMap((lesson) => lesson.blocks);

describe('Currículo semilla', () => {
  it('tiene los seis niveles en orden', () => {
    expect(CURRICULUM_SEED.map((level) => level.id)).toEqual([
      'beginner',
      'intermediate',
      'advanced',
      'theory',
      'exploit',
      'pro',
    ]);
  });

  it('usa claves únicas en cursos y clases', () => {
    expect(new Set(courses.map((course) => course.id)).size).toBe(
      courses.length,
    );
    expect(new Set(courses.map((course) => course.slug)).size).toBe(
      courses.length,
    );
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(
      lessons.length,
    );
    for (const course of courses) {
      const slugs = course.lessons.map((lesson) => lesson.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('cada curso declara el nivel en el que está', () => {
    for (const level of CURRICULUM_SEED) {
      for (const course of level.courses) expect(course.level).toBe(level.id);
    }
  });

  it('todo quiz tiene la respuesta dentro de las opciones y una explicación', () => {
    for (const block of blocks) {
      if (block.type !== 'quiz') continue;
      for (const question of block.questions) {
        expect(question.answerIndex).toBeGreaterThanOrEqual(0);
        expect(question.answerIndex).toBeLessThan(question.options.length);
        expect(question.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('las prácticas usan un entrenamiento que existe en la mesa', () => {
    // Espejo de `DrillId` (frontend/src/features/table/drills.ts): un modo que
    // la mesa no conoce se degradaría en silencio a "juego libre".
    const DRILL_IDS = [
      'free',
      'preflop-position',
      'pot-odds',
      'cbet',
      'aggression',
      'discipline',
      'bluff-catch',
      'open-raise',
      'bb-defense',
      'vs-open',
      'vs-3bet',
      'blind-vs-blind',
      'integral',
    ];
    for (const block of blocks) {
      if (block.type !== 'drill') continue;
      if (block.mode) expect(DRILL_IDS).toContain(block.mode);
      expect(block.seats).toBeGreaterThanOrEqual(2);
      expect(block.seats).toBeLessThanOrEqual(9);
      expect(block.hands).toBeGreaterThan(0);
    }
  });

  it('las situaciones usan cartas válidas y sin repetir', () => {
    for (const block of blocks) {
      if (block.type !== 'spot') continue;
      const cards = [block.hole, block.board]
        .filter(Boolean)
        .join(' ')
        .split(' ');
      expect(cards.every((card) => CARD.test(card))).toBe(true);
      expect(new Set(cards).size).toBe(cards.length);
    }
  });
});

/** Simula lo que Prisma devuelve tras crear la fila con `blockCreateInput`. */
function asRow(block: ContentBlockSeed, position: number): BlockRow {
  const input = blockCreateInput(block, position);
  const list = (value: unknown): string[] =>
    Array.isArray(value) ? (value as string[]) : [];
  return {
    type: input.type,
    text: input.text ?? null,
    title: input.title ?? null,
    tone: input.tone ?? null,
    ordered: input.ordered ?? null,
    items: list(input.items),
    headers: list(input.headers),
    rows: (input.rows ?? null) as Prisma.JsonValue,
    hole: input.hole ?? null,
    board: input.board ?? null,
    question: input.question ?? null,
    answer: input.answer ?? null,
    drillMode: input.drillMode ?? null,
    seats: input.seats ?? null,
    drillHands: input.drillHands ?? null,
    goal: input.goal ?? null,
    hands: (input.hands?.create ?? []) as BlockRow['hands'],
    questions: (input.questions?.create ?? []) as BlockRow['questions'],
  };
}

/** `ordered: false` y la ausencia de `ordered` son el mismo bloque. */
function canonical(block: ContentBlockSeed): ContentBlockSeed {
  if (block.type === 'list' && !block.ordered)
    return { type: 'list', items: block.items };
  return block;
}

describe('Mapeo de bloques', () => {
  it('todos los bloques del currículo sobreviven a la ida y vuelta por la base', () => {
    for (const [index, block] of blocks.entries()) {
      expect(blockFromRow(asRow(block, index))).toEqual(canonical(block));
    }
  });

  it('las colecciones vuelven en su orden aunque la base las devuelva desordenadas', () => {
    const block = blocks.find((item) => item.type === 'hands')!;
    const row = asRow(block, 0);
    row.hands = [...row.hands].reverse();
    expect(blockFromRow(row)).toEqual(block);
  });

  it('descarta un tipo de bloque desconocido', () => {
    expect(blockFromRow({ ...asRow(blocks[0], 0), type: 'VIDEO' })).toBeNull();
  });
});

describe('AcademyCurriculumService', () => {
  /** Una base que devuelve el currículo semilla con un curso y una clase despublicados. */
  function serviceWith(
    options: { admin?: boolean; missingTable?: boolean } = {},
  ) {
    const hiddenCourse = courses[1];
    const hiddenLesson = courses[0].lessons[1];

    const rows = CURRICULUM_SEED.map((level, position) => ({
      slug: level.id,
      title: level.title,
      subtitle: level.subtitle,
      description: level.description,
      color: level.color,
      icon: level.icon,
      position,
      courses: level.courses.map((course) => ({
        code: course.id,
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        icon: course.icon,
        published: course.id !== hiddenCourse.id,
        notes: 'nota interna',
        outcomes: course.outcomes.map((text) => ({ text })),
        lessons: course.lessons.map((lesson) => ({
          code: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          kind: lesson.kind.toUpperCase(),
          minutes: lesson.minutes,
          xp: lesson.xp,
          published: lesson.id !== hiddenLesson.id,
          videoEnabled: lesson.id === courses[0].lessons[0].id,
          videoProvider: 'YOUTUBE',
          videoUrl: 'abc123',
          videoTitle: null,
          videoDurationSec: null,
          notes: 'nota interna',
          blocks: lesson.blocks.map(asRow),
        })),
      })),
    }));

    const prisma = {
      academyLevel: {
        findMany: jest.fn(() =>
          options.missingTable
            ? Promise.reject(
                Object.assign(new Error('missing'), { code: 'P2021' }),
              )
            : Promise.resolve(rows),
        ),
      },
      systemUser: {
        findUnique: jest.fn(() =>
          Promise.resolve({
            roles: options.admin
              ? [{ role: { name: 'ADMIN', isActive: true } }]
              : [],
          }),
        ),
      },
    };

    return {
      service: new AcademyCurriculumService(prisma as unknown as PrismaService),
      hiddenCourse,
      hiddenLesson,
    };
  }

  const allIds = (
    levels: { courses: { id: string; lessons: { id: string }[] }[] }[],
  ) => ({
    courses: levels.flatMap((level) =>
      level.courses.map((course) => course.id),
    ),
    lessons: levels.flatMap((level) =>
      level.courses.flatMap((course) =>
        course.lessons.map((lesson) => lesson.id),
      ),
    ),
  });

  it('el estudiante solo recibe lo publicado, sin notas ni videos apagados', async () => {
    const { service, hiddenCourse, hiddenLesson } = serviceWith();
    const view = await service.curriculum(7);
    const ids = allIds(view.levels);

    expect(view.admin).toBe(false);
    expect(ids.courses).not.toContain(hiddenCourse.id);
    expect(ids.lessons).not.toContain(hiddenLesson.id);

    const served = view.levels.flatMap((level) =>
      level.courses.flatMap((course) => course.lessons),
    );
    expect(served.every((lesson) => lesson.notes === undefined)).toBe(true);
    expect(
      served
        .filter((lesson) => lesson.video !== null)
        .map((lesson) => lesson.id),
    ).toEqual([courses[0].lessons[0].id]);
  });

  it('el administrador recibe todo, con notas y videos apagados', async () => {
    const { service, hiddenCourse, hiddenLesson } = serviceWith({
      admin: true,
    });
    const view = await service.curriculum(1);
    const ids = allIds(view.levels);

    expect(view.admin).toBe(true);
    expect(ids.courses).toContain(hiddenCourse.id);
    expect(ids.lessons).toContain(hiddenLesson.id);
    expect(view.levels[0].courses[0].notes).toBe('nota interna');
  });

  it('el catálogo público no lleva el contenido de las clases', async () => {
    const { service } = serviceWith();
    const view = await service.catalog();
    const served = view.levels.flatMap((level) =>
      level.courses.flatMap((course) => course.lessons),
    );

    expect(served.length).toBeGreaterThan(0);
    expect(served.every((lesson) => lesson.blocks.length === 0)).toBe(true);
    // Las cifras se calculan con el contenido, aunque no se envíe.
    expect(view.stats.drills).toBeGreaterThan(0);
  });

  it('sin tablas sirve la semilla en memoria', async () => {
    const { service } = serviceWith({ missingTable: true });
    const view = await service.curriculum();

    expect(view.persisted).toBe(false);
    expect(allIds(view.levels).lessons).toEqual(
      lessons.map((lesson) => lesson.id),
    );
    expect(view.stats).toEqual(programStats(seedLevels()));
  });
});
