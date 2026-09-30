import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { toDateOnly } from '../shared/dates.util';
import {
  GRADING_BLOCKS,
  summarizeStudent,
  weightedActivityScore,
} from '../shared/grading.calculator';
import { passingScore } from '../section/section.service';
import {
  CreateAssessmentDto,
  GradeEntryDto,
  SaveFinalGradesDto,
  SaveScoresDto,
  UpdateAssessmentDto,
} from './dto/grading.dto';

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  // ── Registro de calificaciones (P / RP por bloque) ─────

  async register(teacherId: number, sectionId: number) {
    const section = await this.scope.section(teacherId, sectionId);
    const passing = passingScore(section.schoolYear.gradingScale);
    const [students, grades, finals] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, deletedAt: null },
        orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.competenceGrade.findMany({ where: { sectionId } }),
      this.prisma.finalGrade.findMany({ where: { sectionId } }),
    ]);
    const gradesByStudent = groupBy(grades, (g) => g.studentId);
    const finalByStudent = new Map(finals.map((f) => [f.studentId, f]));

    const rows = students.map((s) => {
      const entries = gradesByStudent.get(s.id) ?? [];
      const final = finalByStudent.get(s.id) ?? null;
      return {
        student: {
          id: s.id,
          listNumber: s.listNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          isActive: s.isActive,
        },
        entries: entries.map((e) => ({
          period: e.period,
          block: e.block,
          score: e.score,
          recovery: e.recovery,
          isManual: e.isManual,
        })),
        final: final && {
          completiveScore: final.completiveScore,
          extraordinaryScore: final.extraordinaryScore,
          specialScore: final.specialScore,
        },
        summary: summarizeStudent(entries, final, passing),
      };
    });

    const finalsList = rows.map((r) => r.summary.finalScore).filter((v): v is number => v != null);
    return {
      section: {
        id: section.id,
        name: section.name,
        grade: section.grade,
        schoolYear: section.schoolYear.name,
        passing,
      },
      blocks: GRADING_BLOCKS,
      rows,
      stats: {
        average: finalsList.length
          ? Math.round((finalsList.reduce((a, b) => a + b, 0) / finalsList.length) * 10) / 10
          : null,
        approved: rows.filter((r) => r.summary.situation === 'A').length,
        failed: rows.filter((r) => r.summary.situation === 'R').length,
        pending: rows.filter((r) => r.summary.situation === 'PENDIENTE').length,
      },
    };
  }

  async saveGrades(teacherId: number, sectionId: number, entries: GradeEntryDto[]) {
    await this.scope.section(teacherId, sectionId);
    await this.assertStudents(sectionId, entries.map((e) => e.studentId));
    await this.prisma.$transaction(
      entries.map((e) =>
        this.prisma.competenceGrade.upsert({
          where: {
            studentId_sectionId_period_block: {
              studentId: e.studentId,
              sectionId,
              period: e.period,
              block: e.block,
            },
          },
          update: {
            ...(e.score !== undefined ? { score: e.score } : {}),
            ...(e.recovery !== undefined ? { recovery: e.recovery } : {}),
            isManual: true,
          },
          create: {
            studentId: e.studentId,
            sectionId,
            period: e.period,
            block: e.block,
            score: e.score ?? null,
            recovery: e.recovery ?? null,
            isManual: true,
          },
        }),
      ),
    );
    return this.register(teacherId, sectionId);
  }

  async saveFinals(teacherId: number, sectionId: number, dto: SaveFinalGradesDto) {
    await this.scope.section(teacherId, sectionId);
    await this.assertStudents(sectionId, dto.entries.map((e) => e.studentId));
    await this.prisma.$transaction(
      dto.entries.map((e) =>
        this.prisma.finalGrade.upsert({
          where: { studentId_sectionId: { studentId: e.studentId, sectionId } },
          update: {
            completiveScore: e.completiveScore,
            extraordinaryScore: e.extraordinaryScore,
            specialScore: e.specialScore,
          },
          create: {
            studentId: e.studentId,
            sectionId,
            completiveScore: e.completiveScore ?? null,
            extraordinaryScore: e.extraordinaryScore ?? null,
            specialScore: e.specialScore ?? null,
          },
        }),
      ),
    );
    return this.register(teacherId, sectionId);
  }

  /**
   * Recalcula P de cada bloque/periodo a partir de las actividades
   * evaluadas (promedio ponderado). Respeta las notas fijadas a mano
   * salvo que `overwriteManual` sea true.
   */
  async recalculate(
    teacherId: number,
    sectionId: number,
    filter: { period?: number; block?: number; overwriteManual?: boolean } = {},
  ) {
    await this.scope.section(teacherId, sectionId);
    const assessments = await this.prisma.assessment.findMany({
      where: {
        sectionId,
        deletedAt: null,
        ...(filter.period ? { period: filter.period } : {}),
        ...(filter.block ? { block: filter.block } : {}),
      },
      include: { scores: true },
    });

    const groups = groupBy(assessments, (a) => `${a.period}-${a.block}`);
    const existing = await this.prisma.competenceGrade.findMany({ where: { sectionId } });
    const existingKey = new Map(existing.map((g) => [`${g.studentId}-${g.period}-${g.block}`, g]));
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    for (const [key, list] of groups) {
      const [period, block] = key.split('-').map(Number);
      const students = new Set(list.flatMap((a) => a.scores.map((s) => s.studentId)));
      for (const studentId of students) {
        const score = weightedActivityScore(
          list.map((a) => ({
            score: a.scores.find((s) => s.studentId === studentId)?.score ?? null,
            maxScore: a.maxScore,
            weight: a.weight,
          })),
        );
        const current = existingKey.get(`${studentId}-${period}-${block}`);
        if (current?.isManual && !filter.overwriteManual) continue;
        ops.push(
          this.prisma.competenceGrade.upsert({
            where: {
              studentId_sectionId_period_block: { studentId, sectionId, period, block },
            },
            update: { score, isManual: false },
            create: { studentId, sectionId, period, block, score, isManual: false },
          }),
        );
      }
    }
    if (ops.length) await this.prisma.$transaction(ops);
    return { updated: ops.length };
  }

  // ── Actividades evaluadas ─────────────────────────────

  listAssessments(teacherId: number, sectionId?: number, period?: number) {
    return this.prisma.assessment.findMany({
      where: {
        teacherId,
        deletedAt: null,
        ...(sectionId ? { sectionId } : {}),
        ...(period ? { period } : {}),
      },
      include: {
        section: { select: { id: true, name: true, color: true, grade: true } },
        fundamental: true,
        instrument: { select: { id: true, title: true, type: true } },
        exam: { select: { id: true, title: true } },
        _count: { select: { scores: { where: { score: { not: null } } } } },
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async getAssessment(teacherId: number, id: number) {
    await this.scope.assessment(teacherId, id);
    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id },
      include: {
        section: { include: { grade: true } },
        fundamental: true,
        instrument: true,
        exam: true,
        scores: true,
      },
    });
    const students = await this.prisma.student.findMany({
      where: { sectionId: assessment.sectionId, deletedAt: null },
      orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
    });
    const byStudent = new Map(assessment.scores.map((s) => [s.studentId, s]));
    return {
      ...assessment,
      roster: students.map((s) => ({
        student: { id: s.id, listNumber: s.listNumber, firstName: s.firstName, lastName: s.lastName },
        score: byStudent.get(s.id)?.score ?? null,
        delivered: byStudent.get(s.id)?.delivered ?? false,
        feedback: byStudent.get(s.id)?.feedback ?? null,
        instrumentData: byStudent.get(s.id)?.instrumentData ?? null,
      })),
    };
  }

  async createAssessment(teacherId: number, dto: CreateAssessmentDto) {
    await this.scope.section(teacherId, dto.sectionId);
    const assessment = await this.prisma.assessment.create({
      data: {
        teacherId,
        sectionId: dto.sectionId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        period: dto.period,
        block: dto.block,
        fundamentalId: dto.fundamentalId,
        instrumentId: dto.instrumentId,
        examId: dto.examId,
        date: toDateOnly(dto.date),
        dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : null,
        maxScore: dto.maxScore ?? 100,
        weight: dto.weight ?? 1,
        requiresDelivery: dto.requiresDelivery ?? false,
      },
    });
    // Agenda: las evaluaciones y entregas aparecen en el calendario.
    await this.prisma.calendarEvent.create({
      data: {
        teacherId,
        sectionId: dto.sectionId,
        assessmentId: assessment.id,
        type: dto.requiresDelivery ? 'DELIVERY' : 'EXAM',
        title: dto.requiresDelivery ? `Entrega: ${dto.title}` : dto.title,
        startAt: toDateOnly(dto.dueDate ?? dto.date),
        allDay: true,
      },
    });
    return assessment;
  }

  async updateAssessment(teacherId: number, id: number, dto: UpdateAssessmentDto) {
    await this.scope.assessment(teacherId, id);
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    const updated = await this.prisma.assessment.update({
      where: { id },
      data: {
        sectionId: dto.sectionId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        period: dto.period,
        block: dto.block,
        fundamentalId: dto.fundamentalId,
        instrumentId: dto.instrumentId,
        examId: dto.examId,
        date: dto.date ? toDateOnly(dto.date) : undefined,
        dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : undefined,
        maxScore: dto.maxScore,
        weight: dto.weight,
        requiresDelivery: dto.requiresDelivery,
      },
    });
    await this.prisma.calendarEvent.updateMany({
      where: { assessmentId: id },
      data: {
        title: updated.requiresDelivery ? `Entrega: ${updated.title}` : updated.title,
        startAt: updated.dueDate ?? updated.date,
      },
    });
    await this.recalculate(teacherId, updated.sectionId, {
      period: updated.period,
      block: updated.block,
    });
    return updated;
  }

  async removeAssessment(teacherId: number, id: number) {
    const assessment = await this.scope.assessment(teacherId, id);
    await this.prisma.assessment.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.calendarEvent.updateMany({
      where: { assessmentId: id },
      data: { deletedAt: new Date() },
    });
    await this.recalculate(teacherId, assessment.sectionId, {
      period: assessment.period,
      block: assessment.block,
    });
  }

  async saveScores(teacherId: number, id: number, dto: SaveScoresDto) {
    const assessment = await this.scope.assessment(teacherId, id);
    await this.assertStudents(assessment.sectionId, dto.entries.map((e) => e.studentId));
    for (const e of dto.entries) {
      if (e.score != null && e.score > assessment.maxScore) {
        throw new BadRequestException(
          `La puntuación ${e.score} supera el máximo de la actividad (${assessment.maxScore})`,
        );
      }
    }
    const now = new Date();
    await this.prisma.$transaction(
      dto.entries.map((e) =>
        this.prisma.assessmentScore.upsert({
          where: { assessmentId_studentId: { assessmentId: id, studentId: e.studentId } },
          update: {
            score: e.score,
            delivered: e.delivered ?? (e.score != null ? true : undefined),
            feedback: e.feedback,
            instrumentData: e.instrumentData as Prisma.InputJsonValue | undefined,
            gradedAt: e.score != null ? now : undefined,
          },
          create: {
            assessmentId: id,
            studentId: e.studentId,
            score: e.score ?? null,
            delivered: e.delivered ?? e.score != null,
            feedback: e.feedback,
            instrumentData: e.instrumentData as Prisma.InputJsonValue | undefined,
            gradedAt: e.score != null ? now : null,
          },
        }),
      ),
    );
    await this.recalculate(teacherId, assessment.sectionId, {
      period: assessment.period,
      block: assessment.block,
    });
    return this.getAssessment(teacherId, id);
  }

  private async assertStudents(sectionId: number, ids: number[]) {
    const unique = [...new Set(ids)];
    const count = await this.prisma.student.count({ where: { sectionId, id: { in: unique } } });
    if (count !== unique.length) {
      throw new BadRequestException('Hay estudiantes que no pertenecen a la sección');
    }
  }
}

export function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}
