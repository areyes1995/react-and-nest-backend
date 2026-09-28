// ──────────────────────────────────────────────
// QuizService — el banco de preguntas.
// Tres fuentes, un solo contrato (`QuizQuestionView`):
//  1. La tabla `QuizQuestion`, cargada por el seeder.
//  2. El banco semilla en memoria, si la tabla aún no
//     existe (migración sin aplicar): la página
//     funciona igual antes de migrar.
//  3. La IA del `.env` (POKER_AI_*). Solo ADMIN y
//     SUPERADMIN generan; la tanda vuelve SIN guardar
//     y el administrador decide qué entra en la base
//     (`saveQuestions`), publicado o como borrador.
// Cada fila lleva su origen: LOCAL o AI.
// ──────────────────────────────────────────────

import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { PokerAiService } from 'src/modules/poker-ai/services/poker-ai.service';
import { extractJson } from 'src/modules/poker-ai/services/decision.validator';
import {
  QUIZ_CATEGORIES,
  QUIZ_FORMAT_DB,
  QUIZ_LEVEL_DB,
  QUIZ_LEVEL_LABEL,
  QUIZ_LEVELS,
  QuizFormatId,
  QuizLevelId,
  QuizSourceId,
} from '../constants/quiz.constants';
import { readQuizAiSettings } from '../config/quiz-ai.config';
import { QUIZ_SEED, QuizSeedQuestion } from '../data/quiz-seed.data';
import {
  GenerateQuizDto,
  GenerateQuizResult,
  QuizMetaResult,
  QuizQuestionView,
  QuizQuestionsQueryDto,
  QuizQuestionsResult,
  SaveQuizQuestionsDto,
  SaveQuizQuestionsResult,
} from '../dtos/quiz.dto';
import { buildQuizPrompt } from './quiz.prompt';
import {
  NormalizedQuestion,
  normalizeQuestion,
  questionList,
  sample,
  shuffleOptions,
} from './quiz.validator';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

const DEFAULT_LIMIT = 10;

/** Cuántas preguntas existentes se le pasan a la IA para que no las repita. */
const AVOID_SAMPLE = 20;

const LEVEL_FROM_DB = Object.fromEntries(
  Object.entries(QUIZ_LEVEL_DB).map(([id, db]) => [db, id]),
) as Record<string, QuizLevelId>;

/** Slug que asigna `generate`: reutilizarlo al guardar evita duplicar la misma pregunta. */
const AI_SLUG = /^ai-(beginner|intermediate|advanced|pro)-[0-9a-f]{8}$/;

const FORMAT_FROM_DB = Object.fromEntries(
  Object.entries(QUIZ_FORMAT_DB).map(([id, db]) => [db, id]),
) as Record<string, QuizFormatId>;

const SOURCE_DB: Record<QuizSourceId, 'LOCAL' | 'AI'> = { local: 'LOCAL', ai: 'AI' };

interface CountRow {
  level: QuizLevelId;
  category: string;
  source: QuizSourceId;
}

interface QuizRow {
  slug: string;
  level: string;
  format: string;
  category: string;
  question: string;
  options: unknown;
  answerIndex: number;
  explanation: string;
  hole: string | null;
  board: string | null;
  source: string;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pokerAi: PokerAiService,
  ) {}

  /**
   * Lo que la página necesita para pintar el menú: niveles, temas, origen y,
   * solo para administradores, el estado de la IA.
   */
  async meta(userId?: number): Promise<QuizMetaResult> {
    const { rows, persisted } = await this.countRows();
    const canGenerate = await this.isAdmin(userId);

    const countWhere = (predicate: (row: CountRow) => boolean) => rows.filter(predicate).length;

    return {
      levels: QUIZ_LEVELS.map((id) => ({
        id,
        label: QUIZ_LEVEL_LABEL[id],
        count: countWhere((row) => row.level === id),
      })),
      categories: QUIZ_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        count: countWhere((row) => row.category === category.id),
      })),
      total: rows.length,
      sources: {
        local: countWhere((row) => row.source === 'local'),
        ai: countWhere((row) => row.source === 'ai'),
      },
      persisted,
      canGenerate,
      // Proveedor, modelo y problemas de configuración no son asunto del estudiante.
      ai: canGenerate ? await this.aiStatus() : null,
    };
  }

  /** ¿Puede este usuario generar y guardar? ADMIN o SUPERADMIN, igual que el guard. */
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

  private async aiStatus(): Promise<NonNullable<QuizMetaResult['ai']>> {
    const status = await this.pokerAi.status();
    return {
      ready: status.ready,
      provider: status.provider,
      model: status.model,
      issues: status.enabled ? status.issues : ['La IA está desactivada (POKER_AI_ENABLED=false).'],
      maxQuestions: readQuizAiSettings().maxQuestions,
    };
  }

  /** Una partida: muestra aleatoria del nivel (o de todos) con las opciones barajadas. */
  async questions(query: QuizQuestionsQueryDto): Promise<QuizQuestionsResult> {
    const mode = query.mode ?? 'random';
    const limit = query.limit ?? DEFAULT_LIMIT;
    const level = mode === 'random' ? undefined : mode;

    try {
      const where = {
        published: true,
        ...(level ? { level: QUIZ_LEVEL_DB[level] } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.source ? { source: SOURCE_DB[query.source] } : {}),
      };

      // Primero solo los ids: el banco puede crecer con la IA y no hace falta
      // traer todos los enunciados para elegir diez.
      const ids = await this.prisma.quizQuestion.findMany({ where, select: { id: true } });
      const chosen = sample(ids, limit).map((row) => row.id);
      const rows = await this.prisma.quizQuestion.findMany({ where: { id: { in: chosen } } });

      // `in` no conserva el orden: se reordena según la muestra.
      const byId = new Map(rows.map((row) => [row.id, row]));
      const questions = chosen
        .map((id) => byId.get(id))
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .map((row) => shuffleOptions(this.fromRow(row)));

      return { questions, persisted: true };
    } catch (err) {
      if (!this.isMissingTable(err)) throw err;
      this.warnMissingTable();

      // En memoria solo existe el banco local: una ronda IA sale vacía.
      const pool = QUIZ_SEED.filter(
        (seed) =>
          query.source !== 'ai' &&
          (!level || seed.level === level) &&
          (!query.category || seed.category === query.category),
      );
      return {
        questions: sample(pool, limit).map((seed) => shuffleOptions(this.fromSeed(seed))),
        persisted: false,
      };
    }
  }

  /**
   * Genera una tanda nueva con la IA del `.env`. No guarda nada: la tanda
   * vuelve al administrador, que decide qué entra en el banco.
   */
  async generate(dto: GenerateQuizDto, userKey = 'anon'): Promise<GenerateQuizResult> {
    const status = await this.pokerAi.status();
    if (!status.ready) {
      throw new ServiceUnavailableException(
        status.enabled
          ? `La IA no está bien configurada: ${status.issues.join(' ')}`
          : 'La IA está desactivada: activa POKER_AI_ENABLED en el .env del backend.',
      );
    }

    const aiSettings = readQuizAiSettings();
    const count = Math.min(dto.count ?? 5, aiSettings.maxQuestions);

    const prompt = buildQuizPrompt({
      level: dto.level,
      count,
      category: dto.category,
      format: dto.format,
      topic: dto.topic?.trim() || undefined,
      avoid: await this.existingQuestions(dto.level, dto.category),
    });

    let result: Awaited<ReturnType<PokerAiService['complete']>>;
    try {
      result = await this.pokerAi.complete(prompt, userKey, {
        maxTokens: aiSettings.maxTokens,
        timeoutMs: aiSettings.timeoutMs,
        temperature: aiSettings.temperature,
      });
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`La IA no pudo generar preguntas: ${message}`);
      throw new BadGatewayException(`La IA no pudo generar preguntas: ${message}`);
    }
    const { completion } = result;

    let raw: unknown[];
    try {
      raw = questionList(extractJson(completion.text));
    } catch (err) {
      this.logger.warn(`Respuesta de la IA ilegible: ${(err as Error).message}`);
      throw new BadGatewayException(
        'La IA respondió en un formato que no se pudo interpretar. Prueba de nuevo o revisa POKER_AI_JSON_MODE.',
      );
    }

    const context = { level: dto.level, category: dto.category, format: dto.format };
    const valid = raw
      .map((item) => normalizeQuestion(item, context))
      .filter((item): item is NormalizedQuestion => item !== null)
      .slice(0, count);

    if (valid.length === 0) {
      throw new BadGatewayException(
        `La IA devolvió ${raw.length} preguntas, pero ninguna pasó la validación. Prueba de nuevo.`,
      );
    }

    const withIds = valid.map((question) => ({
      ...question,
      id: `ai-${dto.level}-${randomUUID().slice(0, 8)}`,
    }));
    return {
      source: 'ai',
      questions: withIds.map((question) => shuffleOptions({ ...question, source: 'ai' as const })),
      discarded: raw.length - valid.length,
      model: completion.model,
      provider: result.settings.provider,
      latencyMs: completion.latencyMs,
    };
  }

  /**
   * Guarda en el banco las preguntas de IA que el administrador eligió.
   * Se vuelven a validar: el cliente pudo tocarlas y la base solo acepta
   * preguntas completas. Guardar dos veces la misma no la duplica.
   */
  async saveQuestions(dto: SaveQuizQuestionsDto): Promise<SaveQuizQuestionsResult> {
    const valid = dto.questions
      .map((item) => {
        const normalized = normalizeQuestion(item, {
          level: item.level,
          category: item.category,
          format: item.format,
        });
        if (!normalized) return null;
        const slug =
          item.id && AI_SLUG.test(item.id) ? item.id : `ai-${item.level}-${randomUUID().slice(0, 8)}`;
        return { ...normalized, slug };
      })
      .filter((item): item is NormalizedQuestion & { slug: string } => item !== null);

    if (valid.length === 0) {
      return { saved: 0, skipped: dto.questions.length, published: dto.publish };
    }

    try {
      const result = await this.prisma.quizQuestion.createMany({
        data: valid.map((question) => ({
          slug: question.slug,
          level: QUIZ_LEVEL_DB[question.level],
          format: QUIZ_FORMAT_DB[question.format],
          category: question.category,
          question: question.question,
          options: question.options,
          answerIndex: question.answerIndex,
          explanation: question.explanation,
          hole: question.hole,
          board: question.board,
          source: 'AI',
          published: dto.publish,
        })),
        skipDuplicates: true,
      });
      return {
        saved: result.count,
        skipped: dto.questions.length - result.count,
        published: dto.publish,
      };
    } catch (err) {
      if (!this.isMissingTable(err)) throw err;
      this.warnMissingTable();
      throw new ServiceUnavailableException(
        'No se pudo guardar: la tabla de preguntas no existe todavía. Aplica la migración de base de datos.',
      );
    }
  }

  // ─── Internos ───────────────────────────────

  private async countRows(): Promise<{ rows: CountRow[]; persisted: boolean }> {
    try {
      const rows = await this.prisma.quizQuestion.findMany({
        where: { published: true },
        select: { level: true, category: true, source: true },
      });
      return {
        rows: rows.map((row) => ({
          level: LEVEL_FROM_DB[row.level],
          category: row.category,
          source: row.source === 'AI' ? 'ai' : 'local',
        })),
        persisted: true,
      };
    } catch (err) {
      if (!this.isMissingTable(err)) throw err;
      this.warnMissingTable();
      return {
        rows: QUIZ_SEED.map((seed) => ({ ...seed, source: 'local' as const })),
        persisted: false,
      };
    }
  }

  /** Enunciados que ya existen, para que la IA no los repita. */
  private async existingQuestions(level: QuizLevelId, category?: string): Promise<string[]> {
    try {
      const rows = await this.prisma.quizQuestion.findMany({
        where: { level: QUIZ_LEVEL_DB[level], ...(category ? { category } : {}) },
        select: { question: true },
      });
      return sample(rows, AVOID_SAMPLE).map((row) => row.question);
    } catch (err) {
      if (!this.isMissingTable(err)) throw err;
      return sample(
        QUIZ_SEED.filter((seed) => seed.level === level && (!category || seed.category === category)),
        AVOID_SAMPLE,
      ).map((seed) => seed.question);
    }
  }

  private fromRow(row: QuizRow): QuizQuestionView {
    return {
      id: row.slug,
      level: LEVEL_FROM_DB[row.level],
      format: FORMAT_FROM_DB[row.format],
      category: row.category,
      question: row.question,
      options: Array.isArray(row.options) ? row.options.map(String) : [],
      answerIndex: row.answerIndex,
      explanation: row.explanation,
      hole: row.hole,
      board: row.board,
      source: row.source === 'AI' ? 'ai' : 'local',
    };
  }

  private fromSeed(seed: QuizSeedQuestion): QuizQuestionView {
    return {
      id: seed.slug,
      level: seed.level,
      format: seed.format,
      category: seed.category,
      question: seed.question,
      options: [...seed.options],
      answerIndex: seed.answerIndex,
      explanation: seed.explanation,
      hole: seed.hole ?? null,
      board: seed.board ?? null,
      source: 'local',
    };
  }

  private warnMissingTable(): void {
    this.logger.warn(
      'La tabla QuizQuestion no existe todavía: se sirve el banco semilla en memoria. Ejecuta la migración y `pnpm db:seed`.',
    );
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return typeof code === 'string' && MISSING_TABLE_CODES.has(code);
  }
}
