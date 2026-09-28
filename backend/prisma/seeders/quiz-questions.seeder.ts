import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  QUIZ_FORMAT_DB,
  QUIZ_LEVEL_DB,
} from '../../src/modules/quiz/constants/quiz.constants';
import { QUIZ_SEED } from '../../src/modules/quiz/data/quiz-seed.data';

/**
 * Banco de preguntas inicial. Idempotente: el `slug` es la clave, así que
 * volver a sembrar corrige textos en vez de duplicar. No toca las preguntas
 * generadas por la IA.
 */
export async function seedQuizQuestions(prisma: PrismaClient): Promise<void> {
  console.log('❓  Seed del banco de preguntas...\n');

  try {
    for (const seed of QUIZ_SEED) {
      const data = {
        level: QUIZ_LEVEL_DB[seed.level],
        format: QUIZ_FORMAT_DB[seed.format],
        category: seed.category,
        question: seed.question,
        options: seed.options,
        answerIndex: seed.answerIndex,
        explanation: seed.explanation,
        hole: seed.hole ?? null,
        board: seed.board ?? null,
        source: 'LOCAL' as const,
      };
      await prisma.quizQuestion.upsert({
        where: { slug: seed.slug },
        update: data,
        create: { slug: seed.slug, ...data },
      });
    }
  } catch (err) {
    // Sin la tabla no se puede sembrar, pero el resto de seeders sí debe correr:
    // la página de preguntas sirve el banco en memoria mientras tanto.
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      console.warn(
        '  ⚠️  La tabla QuizQuestion no existe todavía: aplica la migración y vuelve a sembrar.',
      );
      return;
    }
    throw err;
  }

  console.log(`  ✅  ${QUIZ_SEED.length} preguntas insertadas/actualizadas`);
}

// `pnpm db:seed:quiz` — siembra solo las preguntas, sin pasar por los roles.
if (require.main === module) {
  void (async () => {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
    });
    try {
      await seedQuizQuestions(prisma);
    } catch (err) {
      console.error('\n❌  Error sembrando preguntas:', err);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
