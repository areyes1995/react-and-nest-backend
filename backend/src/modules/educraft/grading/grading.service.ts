import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { toDateOnly } from '../shared/dates.util';
import {
  GRADING_BLOCKS,
  internalPassing,
  isGradableScore,
  resolveGradingScale,
  scaleValueFromInternal,
  scaleValueToInternal,
  summarizeStudent,
  weightedActivityScore,
  type GradingScale,
} from '../shared/grading.calculator';
import {
  CreateAssessmentDto,
  GradeEntryDto,
  GradeHistoryQueryDto,
  SaveFinalGradesDto,
  SaveScoresDto,
  UpdateAssessmentDto,
} from './dto/grading.dto';

type HistoryAction = 'SAVE' | 'FINAL' | 'RECALCULATE' | 'LOCK' | 'UNLOCK';
type HistoryEntity = 'COMPETENCE_GRADE' | 'FINAL_GRADE' | 'PERIOD_LOCK';

const keyOf = (studentId: number, period: number, block: number) =>
  `${studentId}-${period}-${block}`;

const normalizeOptional = (
  value: number | null | undefined,
  scale: GradingScale,
) => (value === undefined ? undefined : scaleValueToInternal(value, scale));

const snapshot = (value: unknown): string | null =>
  value == null ? null : JSON.stringify(value);

function displayRecord(
  record: Record<number, number | null>,
  scale: GradingScale,
) {
  const result: Record<number, number | null> = {};
  for (const [key, value] of Object.entries(record)) {
    result[Number(key)] = scaleValueFromInternal(value, scale);
  }
  return result;
}

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  // ── Registro de calificaciones (P / RP por bloque) ─────

  async register(teacherId: number, sectionId: number) {
    const section = await this.scope.section(teacherId, sectionId);
    const scale = resolveGradingScale(section.schoolYear.gradingScale);
    const passing = internalPassing(scale);
    const [students, grades, finals, locks] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, deletedAt: null },
        orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.competenceGrade.findMany({ where: { sectionId } }),
      this.prisma.finalGrade.findMany({ where: { sectionId } }),
      this.prisma.periodLock.findMany({
        where: { sectionId },
        orderBy: { period: 'asc' },
      }),
    ]);
    const gradesByStudent = groupBy(grades, (g) => g.studentId);
    const finalByStudent = new Map(finals.map((f) => [f.studentId, f]));
    const display = (value: number | null) =>
      scaleValueFromInternal(value, scale);

    const rows = students.map((s) => {
      const entries = gradesByStudent.get(s.id) ?? [];
      const final = finalByStudent.get(s.id) ?? null;
      const summary = summarizeStudent(entries, final, passing);
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
          displayScore: display(e.score),
          displayRecovery: display(e.recovery),
        })),
        final: final && {
          completiveScore: final.completiveScore,
          extraordinaryScore: final.extraordinaryScore,
          specialScore: final.specialScore,
          displayCompletiveScore: display(final.completiveScore),
          displayExtraordinaryScore: display(final.extraordinaryScore),
          displaySpecialScore: display(final.specialScore),
        },
        summary: {
          ...summary,
          display: {
            blockAverages: displayRecord(summary.blockAverages, scale),
            periodAverages: displayRecord(summary.periodAverages, scale),
            finalScore: display(summary.finalScore),
            completiveFinal: display(summary.completiveFinal),
            extraordinaryFinal: display(summary.extraordinaryFinal),
            specialTotal: display(summary.specialTotal),
          },
        },
      };
    });

    const finalsList = rows
      .map((r) => r.summary.finalScore)
      .filter(isGradableScore);
    return {
      section: {
        id: section.id,
        name: section.name,
        grade: section.grade,
        schoolYear: section.schoolYear.name,
        passing,
        gradingScale: { type: scale.type, passing: scale.passing },
      },
      blocks: GRADING_BLOCKS,
      rows,
      locks: locks.map((l) => ({
        period: l.period,
        isLocked: l.isLocked,
        reason: l.reason,
        lockedBy: l.lockedBy,
        lockedAt: l.lockedAt,
      })),
      stats: {
        average: finalsList.length
          ? Math.round(
              (finalsList.reduce((a, b) => a + b, 0) / finalsList.length) * 10,
            ) / 10
          : null,
        displayAverage: finalsList.length
          ? display(
              Math.round(
                (finalsList.reduce((a, b) => a + b, 0) / finalsList.length) *
                  10,
              ) / 10,
            )
          : null,
        approved: rows.filter((r) => r.summary.situation === 'A').length,
        failed: rows.filter((r) => r.summary.situation === 'R').length,
        pending: rows.filter((r) => r.summary.situation === 'PENDIENTE').length,
      },
    };
  }

  async saveGrades(
    teacherId: number,
    sectionId: number,
    entries: GradeEntryDto[],
  ) {
    const section = await this.scope.section(teacherId, sectionId);
    const scale = resolveGradingScale(section.schoolYear.gradingScale);
    await this.assertStudents(
      sectionId,
      entries.map((e) => e.studentId),
    );
    await this.assertPeriodsUnlocked(
      sectionId,
      entries.map((e) => e.period),
    );

    const normalized = entries.map((e) => ({
      ...e,
      score: normalizeOptional(e.score, scale),
      recovery: normalizeOptional(e.recovery, scale),
    }));
    const studentIds = [...new Set(entries.map((e) => e.studentId))];
    const existing = await this.prisma.competenceGrade.findMany({
      where: { sectionId, studentId: { in: studentIds } },
    });
    const existingByKey = new Map(
      existing.map((g) => [keyOf(g.studentId, g.period, g.block), g]),
    );
    const now = new Date();
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    for (const e of normalized) {
      const current = existingByKey.get(keyOf(e.studentId, e.period, e.block));
      const next = {
        score: e.score === undefined ? (current?.score ?? null) : e.score,
        recovery:
          e.recovery === undefined ? (current?.recovery ?? null) : e.recovery,
      };
      ops.push(
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
        this.historyOp({
          sectionId,
          studentId: e.studentId,
          actorId: teacherId,
          action: 'SAVE',
          entity: 'COMPETENCE_GRADE',
          entityId: current?.id ?? null,
          period: e.period,
          block: e.block,
          previous: current
            ? { score: current.score, recovery: current.recovery }
            : null,
          next,
          reason: 'Registro manual de P/RP',
          createdAt: now,
        }),
      );
    }
    await this.prisma.$transaction(ops);
    return this.register(teacherId, sectionId);
  }

  async saveFinals(
    teacherId: number,
    sectionId: number,
    dto: SaveFinalGradesDto,
  ) {
    const section = await this.scope.section(teacherId, sectionId);
    const scale = resolveGradingScale(section.schoolYear.gradingScale);
    await this.assertStudents(
      sectionId,
      dto.entries.map((e) => e.studentId),
    );
    const studentIds = [...new Set(dto.entries.map((e) => e.studentId))];
    const existing = await this.prisma.finalGrade.findMany({
      where: { sectionId, studentId: { in: studentIds } },
    });
    const existingByStudent = new Map(existing.map((f) => [f.studentId, f]));
    const now = new Date();
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    for (const entry of dto.entries) {
      const e = {
        ...entry,
        completiveScore: normalizeOptional(entry.completiveScore, scale),
        extraordinaryScore: normalizeOptional(entry.extraordinaryScore, scale),
        specialScore: normalizeOptional(entry.specialScore, scale),
      };
      const current = existingByStudent.get(e.studentId);
      const previous = {
        completiveScore: current?.completiveScore ?? null,
        extraordinaryScore: current?.extraordinaryScore ?? null,
        specialScore: current?.specialScore ?? null,
      };
      const next = {
        completiveScore:
          e.completiveScore === undefined
            ? previous.completiveScore
            : e.completiveScore,
        extraordinaryScore:
          e.extraordinaryScore === undefined
            ? previous.extraordinaryScore
            : e.extraordinaryScore,
        specialScore:
          e.specialScore === undefined ? previous.specialScore : e.specialScore,
      };
      ops.push(
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
        this.historyOp({
          sectionId,
          studentId: e.studentId,
          actorId: teacherId,
          action: 'FINAL',
          entity: 'FINAL_GRADE',
          entityId: current?.id ?? null,
          previous,
          next,
          reason: 'Calificaciones completiva, extraordinaria y especial',
          createdAt: now,
        }),
      );
    }
    await this.prisma.$transaction(ops);
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
    await this.assertPeriodsUnlocked(
      sectionId,
      filter.period ? [filter.period] : assessments.map((a) => a.period),
    );

    const groups = groupBy(assessments, (a) => `${a.period}-${a.block}`);
    const existing = await this.prisma.competenceGrade.findMany({
      where: { sectionId },
    });
    const existingKey = new Map(
      existing.map((g) => [keyOf(g.studentId, g.period, g.block), g]),
    );
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    const now = new Date();

    for (const [key, list] of groups) {
      const [period, block] = key.split('-').map(Number);
      const students = new Set(
        list.flatMap((a) => a.scores.map((s) => s.studentId)),
      );
      for (const studentId of students) {
        const score = weightedActivityScore(
          list.map((a) => ({
            score:
              a.scores.find((s) => s.studentId === studentId)?.score ?? null,
            maxScore: a.maxScore,
            weight: a.weight,
          })),
        );
        const current = existingKey.get(keyOf(studentId, period, block));
        if (current?.isManual && !filter.overwriteManual) continue;
        ops.push(
          this.prisma.competenceGrade.upsert({
            where: {
              studentId_sectionId_period_block: {
                studentId,
                sectionId,
                period,
                block,
              },
            },
            update: { score, isManual: false },
            create: {
              studentId,
              sectionId,
              period,
              block,
              score,
              isManual: false,
            },
          }),
          this.historyOp({
            sectionId,
            studentId,
            actorId: teacherId,
            action: 'RECALCULATE',
            entity: 'COMPETENCE_GRADE',
            entityId: current?.id ?? null,
            period,
            block,
            previous: { score: current?.score ?? null },
            next: { score },
            reason: 'Recálculo desde actividades evaluadas',
            createdAt: now,
          }),
        );
      }
    }
    if (ops.length) await this.prisma.$transaction(ops);
    return { updated: ops.length / 2 };
  }

  // ── Bloqueo de periodos ────────────────────────────────

  listLocks(teacherId: number, sectionId: number) {
    return this.scope.section(teacherId, sectionId).then(() =>
      this.prisma.periodLock.findMany({
        where: { sectionId },
        orderBy: { period: 'asc' },
      }),
    );
  }

  async setPeriodLock(
    teacherId: number,
    sectionId: number,
    period: number,
    locked: boolean,
    reason?: string,
  ) {
    await this.scope.section(teacherId, sectionId);
    if (!Number.isInteger(period) || period < 1 || period > 4) {
      throw new BadRequestException('El periodo debe estar entre 1 y 4');
    }
    const existing = await this.prisma.periodLock.findUnique({
      where: { sectionId_period: { sectionId, period } },
    });
    const where = { sectionId_period: { sectionId, period } };
    const tx: Prisma.PrismaPromise<unknown>[] = [];
    if (locked) {
      tx.push(
        this.prisma.periodLock.upsert({
          where,
          update: {
            isLocked: true,
            lockedBy: teacherId,
            reason: reason ?? null,
            lockedAt: new Date(),
          },
          create: {
            sectionId,
            period,
            isLocked: true,
            lockedBy: teacherId,
            reason: reason ?? null,
          },
        }),
      );
    } else if (existing) {
      tx.push(this.prisma.periodLock.delete({ where }));
    }
    tx.push(
      this.historyOp({
        sectionId,
        studentId: null,
        actorId: teacherId,
        action: locked ? 'LOCK' : 'UNLOCK',
        entity: 'PERIOD_LOCK',
        entityId: existing?.id ?? null,
        period,
        previous: existing ? { isLocked: existing.isLocked } : null,
        next: { isLocked: locked },
        reason:
          reason ?? (locked ? 'Bloqueo del periodo' : 'Desbloqueo del periodo'),
        createdAt: new Date(),
      }),
    );
    await this.prisma.$transaction(tx);
    return this.listLocks(teacherId, sectionId);
  }

  // ── Historial auditable ────────────────────────────────

  async history(
    teacherId: number,
    sectionId: number,
    query: GradeHistoryQueryDto = {},
  ) {
    await this.scope.section(teacherId, sectionId);
    const [items, students] = await Promise.all([
      this.prisma.gradeHistory.findMany({
        where: {
          sectionId,
          ...(query.studentId ? { studentId: query.studentId } : {}),
          ...(query.period ? { period: query.period } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 30,
      }),
      this.prisma.student.findMany({
        where: { sectionId },
        select: { id: true, listNumber: true, firstName: true, lastName: true },
      }),
    ]);
    const byStudent = new Map(students.map((s) => [s.id, s]));
    return items.map((item) => ({
      ...item,
      student: item.studentId ? (byStudent.get(item.studentId) ?? null) : null,
    }));
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
        student: {
          id: s.id,
          listNumber: s.listNumber,
          firstName: s.firstName,
          lastName: s.lastName,
        },
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

  async updateAssessment(
    teacherId: number,
    id: number,
    dto: UpdateAssessmentDto,
  ) {
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
        title: updated.requiresDelivery
          ? `Entrega: ${updated.title}`
          : updated.title,
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
    await this.assertPeriodsUnlocked(assessment.sectionId, [assessment.period]);
    await this.prisma.assessment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
    await this.assertStudents(
      assessment.sectionId,
      dto.entries.map((e) => e.studentId),
    );
    await this.assertPeriodsUnlocked(assessment.sectionId, [assessment.period]);
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
          where: {
            assessmentId_studentId: {
              assessmentId: id,
              studentId: e.studentId,
            },
          },
          update: {
            score: e.score,
            delivered: e.delivered ?? (e.score != null ? true : undefined),
            feedback: e.feedback,
            instrumentData: e.instrumentData as
              Prisma.InputJsonValue | undefined,
            gradedAt: e.score != null ? now : undefined,
          },
          create: {
            assessmentId: id,
            studentId: e.studentId,
            score: e.score ?? null,
            delivered: e.delivered ?? e.score != null,
            feedback: e.feedback,
            instrumentData: e.instrumentData as
              Prisma.InputJsonValue | undefined,
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

  private async assertPeriodsUnlocked(sectionId: number, periods: number[]) {
    const unique = [...new Set(periods)].filter(
      (p) => Number.isInteger(p) && p >= 1 && p <= 4,
    );
    if (!unique.length) return;
    const locks = await this.prisma.periodLock.findMany({
      where: { sectionId, isLocked: true, period: { in: unique } },
      orderBy: { period: 'asc' },
    });
    if (locks.length) {
      throw new ForbiddenException(
        `El periodo ${locks.map((l) => `P${l.period}`).join(', ')} está bloqueado. Desbloquéelo antes de modificar calificaciones.`,
      );
    }
  }

  private historyOp(data: {
    sectionId: number;
    studentId: number | null;
    actorId: number | null;
    action: HistoryAction;
    entity: HistoryEntity;
    entityId: number | null;
    period?: number | null;
    block?: number | null;
    previous: unknown;
    next: unknown;
    reason: string;
    createdAt: Date;
  }): Prisma.PrismaPromise<unknown> {
    return this.prisma.gradeHistory.create({
      data: {
        sectionId: data.sectionId,
        studentId: data.studentId,
        actorId: data.actorId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        period: data.period ?? null,
        block: data.block ?? null,
        previousValue: snapshot(data.previous),
        nextValue: snapshot(data.next),
        reason: data.reason,
        createdAt: data.createdAt,
      },
    });
  }

  private async assertStudents(sectionId: number, ids: number[]) {
    const unique = [...new Set(ids)];
    const count = await this.prisma.student.count({
      where: { sectionId, id: { in: unique } },
    });
    if (count !== unique.length) {
      throw new BadRequestException(
        'Hay estudiantes que no pertenecen a la sección',
      );
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
