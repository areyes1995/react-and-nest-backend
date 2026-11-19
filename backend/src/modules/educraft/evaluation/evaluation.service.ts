import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Difficulty,
  InstrumentType,
  Prisma,
  QuestionType,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { normalizeInstrumentContent } from '../ai-pedagogy/generators/pedagogy-templates';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import {
  scoreInstrument,
  validateInstrumentContent,
} from './dto/instrument-content';
import {
  BulkQuestionsDto,
  CreateExamDto,
  CreateInstrumentDto,
  CreateQuestionDto,
  RandomExamDto,
  SaveInstrumentScoresDto,
  UpdateExamDto,
  UpdateInstrumentDto,
  UpdateQuestionDto,
} from './dto/evaluation.dto';

const json = (value: unknown) =>
  value === undefined ? undefined : (value as Prisma.InputJsonValue);

const EXAM_INCLUDE = {
  grade: true,
  fundamental: true,
  questions: { include: { question: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.ExamInclude;

/** Tipos de pregunta que se corrigen automáticamente. */
export const OBJECTIVE_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MATCHING',
  'COMPLETE',
];

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  // ── Banco de preguntas ────────────────────────────

  listQuestions(
    teacherId: number,
    filter: {
      q?: string;
      type?: QuestionType;
      gradeId?: number;
      difficulty?: Difficulty;
    },
  ) {
    const q = filter.q?.trim();
    return this.prisma.question.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.gradeId ? { gradeId: filter.gradeId } : {}),
        ...(filter.difficulty ? { difficulty: filter.difficulty } : {}),
        ...(q
          ? {
              OR: [
                { topic: { contains: q, mode: 'insensitive' } },
                { statement: { contains: q, mode: 'insensitive' } },
                { tags: { has: q.toLowerCase() } },
              ],
            }
          : {}),
      },
      include: { grade: true, fundamental: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  createQuestion(teacherId: number, dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: this.questionData(teacherId, dto),
    });
  }

  async createQuestions(teacherId: number, dto: BulkQuestionsDto) {
    const created = await this.prisma.$transaction(
      dto.questions.map((q) =>
        this.prisma.question.create({ data: this.questionData(teacherId, q) }),
      ),
    );
    return created;
  }

  async updateQuestion(teacherId: number, id: number, dto: UpdateQuestionDto) {
    await this.findQuestion(teacherId, id);
    return this.prisma.question.update({
      where: { id },
      data: {
        gradeId: dto.gradeId,
        fundamentalId: dto.fundamentalId,
        topic: dto.topic,
        type: dto.type,
        difficulty: dto.difficulty,
        statement: dto.statement,
        options: json(dto.options),
        answer: json(dto.answer),
        solution: dto.solution,
        points: dto.points,
        tags: dto.tags?.map((t) => t.toLowerCase()),
      },
    });
  }

  async removeQuestion(teacherId: number, id: number) {
    await this.findQuestion(teacherId, id);
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findQuestion(teacherId: number, id: number) {
    const q = await this.prisma.question.findFirst({
      where: { id, teacherId, deletedAt: null },
    });
    if (!q) throw new NotFoundException(`Pregunta ${id} no encontrada`);
    return q;
  }

  /** Vista completa del docente: respuesta y solución incluidas. */
  async getQuestion(teacherId: number, id: number) {
    return this.findQuestion(teacherId, id);
  }

  /** Vista segura del estudiante: nunca incluye respuesta ni solución. */
  async studentQuestion(teacherId: number, id: number) {
    const q = await this.findQuestion(teacherId, id);
    return {
      id: q.id,
      topic: q.topic,
      type: q.type,
      difficulty: q.difficulty,
      statement: q.statement,
      options: q.options,
      points: q.points,
    };
  }

  private questionData(
    teacherId: number,
    dto: CreateQuestionDto,
  ): Prisma.QuestionUncheckedCreateInput {
    return {
      teacherId,
      gradeId: dto.gradeId,
      fundamentalId: dto.fundamentalId,
      topic: dto.topic,
      type: dto.type,
      difficulty: dto.difficulty ?? 'MEDIUM',
      statement: dto.statement,
      options: json(dto.options),
      answer: json(dto.answer),
      solution: dto.solution,
      points: dto.points ?? 1,
      tags: (dto.tags ?? []).map((t) => t.toLowerCase()),
      aiGenerated: dto.aiGenerated ?? false,
    };
  }

  // ── Exámenes ──────────────────────────────────────

  listExams(teacherId: number) {
    return this.prisma.exam.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        grade: true,
        fundamental: true,
        _count: { select: { questions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getExam(teacherId: number, id: number) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: EXAM_INCLUDE,
    });
    if (!exam) throw new NotFoundException(`Examen ${id} no encontrado`);
    return exam;
  }

  /** Examen sin respuestas ni soluciones: seguro antes de la publicación. */
  async studentExam(teacherId: number, id: number) {
    const exam = await this.getExam(teacherId, id);
    return {
      id: exam.id,
      title: exam.title,
      instructions: exam.instructions,
      durationMinutes: exam.durationMinutes,
      questions: exam.questions.map((eq, index) => ({
        number: index + 1,
        questionId: eq.questionId,
        type: eq.question.type,
        statement: eq.question.statement,
        options: eq.question.options,
        points: eq.points ?? eq.question.points,
      })),
      totalPoints: exam.questions.reduce(
        (sum, eq) => sum + (eq.points ?? eq.question.points),
        0,
      ),
    };
  }

  /** Clave de respuestas: solo se expone al docente dueño del examen. */
  async answerKey(teacherId: number, id: number) {
    const exam = await this.getExam(teacherId, id);
    return {
      examId: exam.id,
      title: exam.title,
      questions: exam.questions.map((eq, index) => ({
        number: index + 1,
        questionId: eq.questionId,
        answer: eq.question.answer,
        solution: eq.question.solution,
        formatted: formatAnswer(
          eq.question.type,
          eq.question.answer,
          Array.isArray(eq.question.options)
            ? (eq.question.options as unknown[]).map(String)
            : undefined,
        ),
      })),
    };
  }

  async createExam(teacherId: number, dto: CreateExamDto) {
    await this.assertOwnQuestions(
      teacherId,
      dto.questions?.map((q) => q.questionId) ?? [],
    );
    return this.prisma.exam.create({
      data: {
        teacherId,
        title: dto.title,
        gradeId: dto.gradeId,
        fundamentalId: dto.fundamentalId,
        evaluationType: dto.evaluationType,
        instructions: dto.instructions,
        durationMinutes: dto.durationMinutes,
        versions: dto.versions ?? 1,
        shuffle: dto.shuffle ?? false,
        aiGenerated: dto.aiGenerated ?? false,
        questions: {
          create: (dto.questions ?? []).map((q, order) => ({
            questionId: q.questionId,
            order,
            points: q.points,
          })),
        },
      },
      include: EXAM_INCLUDE,
    });
  }

  async updateExam(teacherId: number, id: number, dto: UpdateExamDto) {
    await this.getExam(teacherId, id);
    if (dto.questions) {
      await this.assertOwnQuestions(
        teacherId,
        dto.questions.map((q) => q.questionId),
      );
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.questions) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        await tx.examQuestion.createMany({
          data: dto.questions.map((q, order) => ({
            examId: id,
            questionId: q.questionId,
            order,
            points: q.points,
          })),
        });
      }
      return tx.exam.update({
        where: { id },
        data: {
          title: dto.title,
          gradeId: dto.gradeId,
          fundamentalId: dto.fundamentalId,
          evaluationType: dto.evaluationType,
          instructions: dto.instructions,
          durationMinutes: dto.durationMinutes,
          versions: dto.versions,
          shuffle: dto.shuffle,
        },
        include: EXAM_INCLUDE,
      });
    });
  }

  async removeExam(teacherId: number, id: number) {
    await this.getExam(teacherId, id);
    await this.prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Crea un examen con preguntas aleatorias del banco según filtros. */
  async randomExam(teacherId: number, dto: RandomExamDto) {
    const pool = await this.prisma.question.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.types?.length ? { type: { in: dto.types } } : {}),
        ...(dto.topic
          ? { topic: { contains: dto.topic, mode: 'insensitive' } }
          : {}),
      },
      select: { id: true },
    });
    if (pool.length === 0) {
      throw new BadRequestException(
        'No hay preguntas en el banco que cumplan los filtros',
      );
    }
    const chosen = shuffle(pool, Math.random).slice(0, dto.count);
    return this.createExam(teacherId, {
      title: dto.title,
      gradeId: dto.gradeId,
      versions: dto.versions ?? 1,
      shuffle: true,
      questions: chosen.map((q) => ({ questionId: q.id })),
    });
  }

  /**
   * Versiones del examen (A, B, C…): mismo contenido con orden de
   * preguntas y opciones barajado de forma determinista, más la clave
   * de respuestas de cada versión.
   */
  async versions(teacherId: number, id: number, count?: number) {
    const exam = await this.getExam(teacherId, id);
    const total = Math.min(6, Math.max(1, count ?? exam.versions));
    const letters = 'ABCDEF';
    return {
      exam: {
        id: exam.id,
        title: exam.title,
        instructions: exam.instructions,
        durationMinutes: exam.durationMinutes,
      },
      versions: Array.from({ length: total }, (_, v) => {
        const rng = seeded(exam.id * 97 + v * 13 + 1);
        const items =
          v === 0 && !exam.shuffle
            ? exam.questions
            : shuffle(exam.questions, rng);
        const questions = items.map((eq, index) => {
          const q = eq.question;
          let options = Array.isArray(q.options)
            ? (q.options as unknown[]).map(String)
            : undefined;
          let answer: unknown = q.answer;
          if (
            q.type === 'MULTIPLE_CHOICE' &&
            options &&
            typeof q.answer === 'number' &&
            v > 0
          ) {
            const order = shuffle(
              options.map((_, i) => i),
              rng,
            );
            options = order.map((i) => options![i]);
            answer = order.indexOf(q.answer);
          }
          return {
            number: index + 1,
            questionId: q.id,
            type: q.type,
            statement: q.statement,
            options,
            points: eq.points ?? q.points,
            answer,
            solution: q.solution,
          };
        });
        return {
          label: letters[v],
          questions,
          totalPoints: questions.reduce((a, q) => a + q.points, 0),
          answerKey: questions.map((q) => ({
            number: q.number,
            answer: formatAnswer(q.type, q.answer, q.options),
          })),
        };
      }),
    };
  }

  /** Corrección automática de preguntas objetivas; opcionalmente persiste el resultado. */
  async grade(
    teacherId: number,
    id: number,
    version: number,
    answers: Record<number, unknown>,
    target: { studentId?: number; assessmentId?: number } = {},
  ) {
    const data = await this.versions(teacherId, id, version + 1);
    const v = data.versions[version];
    if (!v) throw new BadRequestException('Versión inexistente');
    let score = 0;
    let objectivePoints = 0;
    const detail = v.questions.map((q) => {
      const given = answers[q.number];
      if (!OBJECTIVE_TYPES.includes(q.type))
        return { number: q.number, auto: false };
      objectivePoints += q.points;
      const correct = sameAnswer(q.answer, given);
      if (correct) score += q.points;
      return { number: q.number, auto: true, correct };
    });
    const result = {
      score,
      objectivePoints,
      totalPoints: v.totalPoints,
      detail,
    };
    if (!target.studentId && !target.assessmentId) return result;
    return {
      ...result,
      saved: await this.persistExamGrade(
        teacherId,
        id,
        version,
        result,
        target,
      ),
    };
  }

  private async persistExamGrade(
    teacherId: number,
    examId: number,
    version: number,
    result: { score: number; objectivePoints: number; totalPoints: number },
    target: { studentId?: number; assessmentId?: number },
  ) {
    if (!target.studentId) {
      throw new BadRequestException(
        'Se necesita el estudiante para guardar la calificación',
      );
    }
    await this.scope.student(teacherId, target.studentId);
    let assessmentId = target.assessmentId;
    if (!assessmentId) {
      const found = await this.prisma.assessment.findFirst({
        where: {
          examId,
          teacherId,
          deletedAt: null,
          section: {
            students: { some: { id: target.studentId, deletedAt: null } },
          },
        },
        orderBy: { date: 'desc' },
        select: { id: true },
      });
      if (!found) {
        throw new BadRequestException(
          'Indica la actividad evaluada donde se guardará la calificación',
        );
      }
      assessmentId = found.id;
    }
    const assessment = await this.scope.assessment(teacherId, assessmentId);
    const score = result.totalPoints
      ? Math.round(
          (result.score / result.totalPoints) * assessment.maxScore * 10,
        ) / 10
      : 0;
    const instrumentData = {
      origen: 'CORRECCION_EXAMEN',
      examId,
      version,
      objectivePoints: result.objectivePoints,
    } as Prisma.InputJsonValue;
    await this.prisma.assessmentScore.upsert({
      where: {
        assessmentId_studentId: { assessmentId, studentId: target.studentId },
      },
      update: { score, delivered: true, gradedAt: new Date(), instrumentData },
      create: {
        assessmentId,
        studentId: target.studentId,
        score,
        delivered: true,
        gradedAt: new Date(),
        instrumentData,
      },
    });
    return { assessmentId, studentId: target.studentId, score };
  }

  private async assertOwnQuestions(teacherId: number, ids: number[]) {
    if (!ids.length) return;
    const count = await this.prisma.question.count({
      where: { teacherId, id: { in: [...new Set(ids)] }, deletedAt: null },
    });
    if (count !== new Set(ids).size) {
      throw new BadRequestException('Alguna pregunta no existe en tu banco');
    }
  }

  // ── Instrumentos ──────────────────────────────────

  listInstruments(teacherId: number, type?: InstrumentType) {
    return this.prisma.evaluationInstrument.findMany({
      where: { teacherId, deletedAt: null, ...(type ? { type } : {}) },
      include: { grade: true, fundamental: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getInstrument(teacherId: number, id: number) {
    const instrument = await this.prisma.evaluationInstrument.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: { grade: true, fundamental: true },
    });
    if (!instrument)
      throw new NotFoundException(`Instrumento ${id} no encontrado`);
    return instrument;
  }

  createInstrument(teacherId: number, dto: CreateInstrumentDto) {
    const content = dto.aiGenerated
      ? normalizeInstrumentContent(dto.content)
      : dto.content;
    const validation = validateInstrumentContent(dto.type, content);
    if (!validation.ok) throw new BadRequestException(validation.message);
    return this.prisma.evaluationInstrument.create({
      data: {
        teacherId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        gradeId: dto.gradeId,
        fundamentalId: dto.fundamentalId,
        content: content as Prisma.InputJsonValue,
        aiGenerated: dto.aiGenerated ?? false,
      },
    });
  }

  async updateInstrument(
    teacherId: number,
    id: number,
    dto: UpdateInstrumentDto,
  ) {
    const current = await this.getInstrument(teacherId, id);
    if (dto.content !== undefined) {
      const validation = validateInstrumentContent(
        dto.type ?? current.type,
        dto.content,
      );
      if (!validation.ok) throw new BadRequestException(validation.message);
    }
    return this.prisma.evaluationInstrument.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        gradeId: dto.gradeId,
        fundamentalId: dto.fundamentalId,
        content: json(dto.content),
      },
    });
  }

  /** Guarda la cuadrícula de marcas de un instrumento para todo el listado. */
  async saveInstrumentScores(
    teacherId: number,
    id: number,
    dto: SaveInstrumentScoresDto,
  ) {
    const assessment = await this.scope.assessment(teacherId, id);
    if (!assessment.instrumentId) {
      throw new BadRequestException(
        'La actividad no tiene un instrumento de evaluación asociado',
      );
    }
    const instrument = await this.getInstrument(
      teacherId,
      assessment.instrumentId,
    );
    const unique = [...new Set(dto.entries.map((entry) => entry.studentId))];
    const count = await this.prisma.student.count({
      where: {
        sectionId: assessment.sectionId,
        id: { in: unique },
        deletedAt: null,
      },
    });
    if (count !== unique.length) {
      throw new BadRequestException(
        'Hay estudiantes que no pertenecen a la sección',
      );
    }
    const now = new Date();
    const operations: Prisma.PrismaPromise<unknown>[] = [];
    const rows: Array<{
      studentId: number;
      score: number | null;
      instrumentData: Record<string, unknown>;
    }> = [];
    for (const entry of dto.entries) {
      const result = scoreInstrument(
        instrument.type,
        instrument.content,
        entry.instrumentData,
        assessment.maxScore,
      );
      if (result.error)
        throw new BadRequestException(
          `Estudiante ${entry.studentId}: ${result.error}`,
        );
      const instrumentData = entry.instrumentData as Prisma.InputJsonValue;
      operations.push(
        this.prisma.assessmentScore.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId: id,
              studentId: entry.studentId,
            },
          },
          update: {
            instrumentData,
            score: result.score,
            delivered: entry.delivered ?? result.score != null,
            feedback: entry.feedback,
            gradedAt: result.score != null ? now : null,
          },
          create: {
            assessmentId: id,
            studentId: entry.studentId,
            instrumentData,
            score: result.score,
            delivered: entry.delivered ?? result.score != null,
            feedback: entry.feedback,
            gradedAt: result.score != null ? now : null,
          },
        }),
      );
      rows.push({
        studentId: entry.studentId,
        score: result.score,
        instrumentData: entry.instrumentData,
      });
    }
    if (operations.length) await this.prisma.$transaction(operations);
    return { assessmentId: id, saved: rows.length, rows };
  }

  async removeInstrument(teacherId: number, id: number) {
    await this.getInstrument(teacherId, id);
    await this.prisma.evaluationInstrument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// ── Utilidades ─────────────────────────────────────

export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatAnswer(
  type: QuestionType,
  answer: unknown,
  options?: string[],
): string {
  if (answer == null) return '—';
  if (type === 'MULTIPLE_CHOICE' && typeof answer === 'number') {
    const letter = String.fromCharCode(97 + answer);
    return options?.[answer] ? `${letter}) ${options[answer]}` : letter;
  }
  if (type === 'TRUE_FALSE')
    return answer === true || answer === 'true' ? 'Verdadero' : 'Falso';
  if (Array.isArray(answer))
    return answer
      .map((a) => (Array.isArray(a) ? a.join(' → ') : String(a)))
      .join('; ');
  return String(answer);
}

function normalize(value: unknown): string {
  return JSON.stringify(value ?? null)
    .toLowerCase()
    .replace(/\s+/g, '');
}

function sameAnswer(expected: unknown, given: unknown): boolean {
  if (typeof expected === 'boolean') return String(expected) === String(given);
  if (typeof expected === 'number') return Number(given) === expected;
  return normalize(expected) === normalize(given);
}
