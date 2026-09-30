import { randomBytes } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { addDays, formatDateOnly, toDateOnly } from '../shared/dates.util';
import {
  achievementLevel,
  AchievementLevel,
  GRADING_BLOCKS,
  summarizeStudent,
} from '../shared/grading.calculator';
import { attendanceRate } from '../attendance/attendance.service';
import { groupBy } from '../grading/grading.service';
import { passingScore } from '../section/section.service';
import { sectionLabel } from '../shared/zoned.util';

export type AlertKind = 'LOW_PERFORMANCE' | 'LOW_ATTENDANCE' | 'PENDING_DELIVERY' | 'SUSTAINED_LOW' | 'TO_GRADE';

export interface AlertStudent {
  id: number;
  name: string;
  value?: number | null;
  detail?: string;
}

export interface Alert {
  kind: AlertKind;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  section: { id: number; name: string; grade: string };
  students: AlertStudent[];
  assessmentIds?: number[];
}

const LOW_ATTENDANCE = 80;
const MIN_ATTENDANCE_RECORDS = 5;

const BLOCK_RECOMMENDATIONS: Record<number, string[]> = {
  1: [
    'Pídale que le explique con sus palabras cómo resolvió un ejercicio del día.',
    'Lean juntos situaciones cotidianas con números (recibos, ofertas) y conversen sobre ellas.',
  ],
  2: [
    'Practiquen 15 minutos diarios de problemas cortos, pidiéndole que justifique cada paso.',
    'Jueguen a estimar resultados antes de calcularlos y luego comprueben.',
  ],
  3: [
    'Valore el esfuerzo y la perseverancia más que la respuesta correcta.',
    'Establezcan una rutina estable de estudio y descanso.',
  ],
  4: [
    'Use aplicaciones como calculadoras graficadoras para explorar juntos las tareas.',
    'Relacionen la matemática con situaciones de salud y ambiente del hogar (consumo de agua, presupuesto).',
  ],
};

const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`;

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  // ── Rendimiento por sección ───────────────────────

  async sectionPerformance(teacherId: number, sectionId: number, period?: number) {
    const section = await this.scope.section(teacherId, sectionId);
    const passing = passingScore(section.schoolYear.gradingScale);
    const [students, grades, finals, attendance, observations] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, deletedAt: null, isActive: true },
        orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.competenceGrade.findMany({ where: { sectionId } }),
      this.prisma.finalGrade.findMany({ where: { sectionId } }),
      this.prisma.attendance.groupBy({
        by: ['studentId', 'status'],
        where: { sectionId },
        _count: { _all: true },
      }),
      this.prisma.studentObservation.groupBy({
        by: ['studentId', 'type'],
        where: { student: { sectionId } },
        _count: { _all: true },
      }),
    ]);

    const gradesByStudent = groupBy(grades, (g) => g.studentId);
    const finalByStudent = new Map(finals.map((f) => [f.studentId, f]));
    const attendanceByStudent = new Map<number, Record<AttendanceStatus, number>>();
    for (const a of attendance) {
      if (!attendanceByStudent.has(a.studentId)) {
        attendanceByStudent.set(a.studentId, { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 });
      }
      attendanceByStudent.get(a.studentId)![a.status] = a._count._all;
    }
    const obsByStudent = groupBy(observations, (o) => o.studentId);

    const rows = students.map((s) => {
      const summary = summarizeStudent(gradesByStudent.get(s.id) ?? [], finalByStudent.get(s.id) ?? null, passing);
      const score = period ? summary.periodAverages[period] : summary.finalScore;
      const blocks = Object.fromEntries(
        GRADING_BLOCKS.map(({ block }) => [
          block,
          period ? summary.effective[block][period] : summary.blockAverages[block],
        ]),
      ) as Record<number, number | null>;
      const counts = attendanceByStudent.get(s.id) ?? { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
      return {
        student: { id: s.id, listNumber: s.listNumber, firstName: s.firstName, lastName: s.lastName },
        score,
        level: achievementLevel(score, passing),
        blocks,
        situation: summary.situation,
        attendance: { counts, rate: attendanceRate(counts) },
        observations: Object.fromEntries((obsByStudent.get(s.id) ?? []).map((o) => [o.type, o._count._all])),
      };
    });

    const avg = (values: Array<number | null>) => {
      const list = values.filter((v): v is number => v != null);
      return list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null;
    };
    const blockAverages = GRADING_BLOCKS.map(({ block, code, name }) => {
      const values = rows.map((r) => r.blocks[block]);
      const distribution: Record<AchievementLevel, number> = { INICIO: 0, EN_PROCESO: 0, LOGRADO: 0, EXCELENTE: 0 };
      for (const v of values) {
        const level = achievementLevel(v, passing);
        if (level) distribution[level]++;
      }
      return { block, code, name, average: avg(values), distribution };
    });

    const totals = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
    for (const r of rows) for (const k of Object.keys(totals) as AttendanceStatus[]) totals[k] += r.attendance.counts[k];

    return {
      section: {
        id: section.id,
        name: section.name,
        grade: section.grade.name,
        color: section.color,
        schoolYear: section.schoolYear.name,
        passing,
      },
      period: period ?? null,
      summary: {
        students: rows.length,
        average: avg(rows.map((r) => r.score)),
        attendanceRate: attendanceRate(totals),
        approved: rows.filter((r) => r.score != null && r.score >= passing).length,
        atRisk: rows.filter((r) => r.score != null && r.score < passing).length,
      },
      blocks: blockAverages,
      rows,
    };
  }

  /** Reporte detallado de logro curricular de un bloque (modal del radar). */
  async competenceDetail(teacherId: number, sectionId: number, block: number, period?: number) {
    const perf = await this.sectionPerformance(teacherId, sectionId, period);
    const levels: Record<AchievementLevel, Array<{ id: number; name: string; score: number | null }>> = {
      INICIO: [],
      EN_PROCESO: [],
      LOGRADO: [],
      EXCELENTE: [],
    };
    for (const r of perf.rows) {
      const score = r.blocks[block];
      const level = achievementLevel(score, perf.section.passing);
      if (level) levels[level].push({ id: r.student.id, name: fullName(r.student), score });
    }
    return {
      section: perf.section,
      block: GRADING_BLOCKS.find((b) => b.block === block) ?? null,
      average: perf.blocks.find((b) => b.block === block)?.average ?? null,
      levels,
    };
  }

  async conduct(teacherId: number, sectionId: number) {
    await this.scope.section(teacherId, sectionId);
    const observations = await this.prisma.studentObservation.findMany({
      where: { student: { sectionId, deletedAt: null } },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });
    const byType = { CONDUCT: 0, PARTICIPATION: 0, SITUATION: 0 };
    for (const o of observations) byType[o.type]++;
    return { byType, observations };
  }

  // ── Boletín e informe para padres ─────────────────

  async bulletin(teacherId: number, studentId: number) {
    const student = await this.scope.student(teacherId, studentId);
    return this.buildBulletin(student.id, student.sectionId);
  }

  private async buildBulletin(studentId: number, sectionId: number) {
    const [student, grades, final] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        include: {
          section: {
            include: {
              grade: true,
              schoolYear: true,
              teacher: { include: { teacherProfile: true } },
            },
          },
        },
      }),
      this.prisma.competenceGrade.findMany({ where: { studentId, sectionId } }),
      this.prisma.finalGrade.findUnique({ where: { studentId_sectionId: { studentId, sectionId } } }),
    ]);
    const passing = passingScore(student.section.schoolYear.gradingScale);
    const summary = summarizeStudent(grades, final, passing);
    const teacher = student.section.teacher;
    return {
      student: {
        id: student.id,
        listNumber: student.listNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      grade: student.section.grade.name,
      cycle: student.section.grade.cycle === 1 ? 'Primer Ciclo' : 'Segundo Ciclo',
      level: 'Secundario',
      section: student.section.name,
      subject: student.section.subject,
      schoolYear: student.section.schoolYear.name,
      teacher: {
        name: `${teacher.teacherProfile?.displayTitle ?? ''} ${teacher.firstName} ${teacher.lastName}`.trim(),
        institution: teacher.teacherProfile?.institution ?? null,
        signature: teacher.teacherProfile?.signature ?? null,
      },
      blocks: GRADING_BLOCKS,
      entries: grades.map((g) => ({ period: g.period, block: g.block, score: g.score, recovery: g.recovery })),
      final: final && {
        completiveScore: final.completiveScore,
        extraordinaryScore: final.extraordinaryScore,
        specialScore: final.specialScore,
      },
      summary,
      passing,
    };
  }

  async parentReport(teacherId: number, studentId: number) {
    const student = await this.scope.student(teacherId, studentId);
    return this.buildParentReport(student.id, student.sectionId);
  }

  private async buildParentReport(studentId: number, sectionId: number) {
    const bulletin = await this.buildBulletin(studentId, sectionId);
    const [attendance, observations] = await Promise.all([
      this.prisma.attendance.findMany({ where: { studentId } }),
      this.prisma.studentObservation.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 6,
      }),
    ]);
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
    for (const a of attendance) counts[a.status]++;

    const competences = GRADING_BLOCKS.map(({ block, name }) => {
      const score = bulletin.summary.blockAverages[block];
      return { block, name, score, level: achievementLevel(score, bulletin.passing) };
    });
    const strengths = competences.filter((c) => c.score != null && c.score >= 80).map((c) => c.name);
    const improvements = competences.filter((c) => c.score != null && c.score < bulletin.passing);
    const rate = attendanceRate(counts);
    const recommendations = [
      ...improvements.flatMap((c) => BLOCK_RECOMMENDATIONS[c.block]),
      ...(rate != null && rate < LOW_ATTENDANCE
        ? ['La asistencia regular es clave: procure que no falte a clases y justifique las ausencias.']
        : []),
    ];
    if (!recommendations.length) {
      recommendations.push('Continúe acompañando su rutina de estudio y celebre sus logros.');
    }

    return {
      ...bulletin,
      generatedAt: new Date().toISOString(),
      attendance: { counts, total: attendance.length, rate },
      competences,
      strengths,
      improvements: improvements.map((c) => c.name),
      observations: observations.map((o) => ({ type: o.type, content: o.content, date: formatDateOnly(o.date) })),
      recommendations,
    };
  }

  async share(teacherId: number, studentId: number, days = 30) {
    await this.scope.student(teacherId, studentId);
    const token = randomBytes(24).toString('base64url');
    return this.prisma.parentReportLink.create({
      data: { token, studentId, teacherId, expiresAt: addDays(new Date(), Math.min(Math.max(days, 1), 180)) },
    });
  }

  async revokeShare(teacherId: number, linkId: number) {
    const link = await this.prisma.parentReportLink.findFirst({ where: { id: linkId, teacherId } });
    if (!link) throw new NotFoundException('Enlace no encontrado');
    await this.prisma.parentReportLink.update({ where: { id: linkId }, data: { revokedAt: new Date() } });
  }

  /** Acceso público (familia) mediante token. */
  async publicReport(token: string) {
    const link = await this.prisma.parentReportLink.findUnique({
      where: { token },
      include: { student: true },
    });
    if (!link || link.revokedAt || link.expiresAt < new Date() || link.student.deletedAt) {
      throw new NotFoundException('El enlace no es válido o ha expirado');
    }
    const report = await this.buildParentReport(link.studentId, link.student.sectionId);
    // La firma del docente no se expone en el enlace público.
    return { ...report, teacher: { ...report.teacher, signature: null }, expiresAt: link.expiresAt };
  }

  // ── Alertas de bajo rendimiento ───────────────────

  async alerts(teacherId: number): Promise<Alert[]> {
    const year = await this.scope.activeSchoolYear(teacherId);
    if (!year) return [];
    const sections = await this.prisma.section.findMany({
      where: { teacherId, schoolYearId: year.id, deletedAt: null },
      include: { grade: true },
    });
    const today = toDateOnly(new Date());
    const alerts: Alert[] = [];

    for (const section of sections) {
      const ref = { id: section.id, name: section.name, grade: section.grade.name };
      const label = sectionLabel(section.grade.name, section.name);
      const perf = await this.sectionPerformance(teacherId, section.id);
      const passing = perf.section.passing;

      const low = perf.rows.filter((r) => r.score != null && r.score < passing);
      if (low.length) {
        alerts.push({
          kind: 'LOW_PERFORMANCE',
          severity: 'critical',
          title: `${low.length} estudiante${low.length > 1 ? 's' : ''} con bajo rendimiento`,
          description: `${label}: promedio por debajo de ${passing}.`,
          section: ref,
          students: low.map((r) => ({ id: r.student.id, name: fullName(r.student), value: r.score })),
        });
      }

      const grades = await this.prisma.competenceGrade.findMany({ where: { sectionId: section.id } });
      const byStudent = groupBy(grades, (g) => g.studentId);
      const sustained: AlertStudent[] = [];
      for (const r of perf.rows) {
        const summary = summarizeStudent(byStudent.get(r.student.id) ?? [], null, passing);
        const periods = [1, 2, 3, 4]
          .map((p) => summary.periodAverages[p])
          .filter((v): v is number => v != null);
        if (periods.length >= 2 && periods.slice(-2).every((v) => v < passing)) {
          sustained.push({ id: r.student.id, name: fullName(r.student), value: periods[periods.length - 1] });
        }
      }
      if (sustained.length) {
        alerts.push({
          kind: 'SUSTAINED_LOW',
          severity: 'critical',
          title: `${sustained.length} con bajo rendimiento sostenido`,
          description: `${label}: dos periodos consecutivos por debajo de ${passing}.`,
          section: ref,
          students: sustained,
        });
      }

      const lowAttendance = perf.rows.filter((r) => {
        const total = Object.values(r.attendance.counts).reduce((a, b) => a + b, 0);
        return total >= MIN_ATTENDANCE_RECORDS && r.attendance.rate != null && r.attendance.rate < LOW_ATTENDANCE;
      });
      if (lowAttendance.length) {
        alerts.push({
          kind: 'LOW_ATTENDANCE',
          severity: 'warning',
          title: `Asistencia por debajo del ${LOW_ATTENDANCE}%`,
          description: `${label}: ${lowAttendance.length} estudiante${lowAttendance.length > 1 ? 's' : ''}.`,
          section: ref,
          students: lowAttendance.map((r) => ({
            id: r.student.id,
            name: fullName(r.student),
            value: r.attendance.rate,
          })),
        });
      }

      const assessments = await this.prisma.assessment.findMany({
        where: { sectionId: section.id, deletedAt: null, date: { lte: today } },
        include: { scores: true },
      });
      const studentIds = perf.rows.map((r) => r.student.id);
      const names = new Map(perf.rows.map((r) => [r.student.id, fullName(r.student)]));

      const pendingDelivery = new Map<number, string[]>();
      for (const a of assessments.filter((x) => x.requiresDelivery && (x.dueDate ?? x.date) < today)) {
        for (const id of studentIds) {
          const s = a.scores.find((x) => x.studentId === id);
          if (!s?.delivered) {
            if (!pendingDelivery.has(id)) pendingDelivery.set(id, []);
            pendingDelivery.get(id)!.push(a.title);
          }
        }
      }
      if (pendingDelivery.size) {
        alerts.push({
          kind: 'PENDING_DELIVERY',
          severity: 'warning',
          title: `${pendingDelivery.size} con entregas pendientes`,
          description: `${label}: actividades vencidas sin entregar.`,
          section: ref,
          students: [...pendingDelivery.entries()].map(([id, titles]) => ({
            id,
            name: names.get(id) ?? `#${id}`,
            value: titles.length,
            detail: titles.join(', '),
          })),
        });
      }

      // Actividades ya realizadas que aún no tienen ninguna nota.
      const toGrade = studentIds.length
        ? assessments.filter((a) => !a.scores.some((s) => s.score != null))
        : [];
      if (toGrade.length) {
        alerts.push({
          kind: 'TO_GRADE',
          severity: 'info',
          title: `${toGrade.length} actividad${toGrade.length > 1 ? 'es' : ''} lista${toGrade.length > 1 ? 's' : ''} para calificar`,
          description: `${label}: ${toGrade.map((a) => a.title).join(', ')}.`,
          section: ref,
          students: [],
          assessmentIds: toGrade.map((a) => a.id),
        });
      }
    }

    const weight = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => weight[a.severity] - weight[b.severity]);
  }

  /**
   * Cada mañana convierte las alertas en notificaciones del docente
   * (una por alerta y día, sin duplicar).
   */
  @Cron('0 30 6 * * 1-6')
  async notifyAlerts() {
    const teachers = await this.prisma.section.findMany({
      where: { deletedAt: null, schoolYear: { isActive: true, deletedAt: null } },
      distinct: ['teacherId'],
      select: { teacherId: true },
    });
    const since = toDateOnly(new Date());
    for (const { teacherId } of teachers) {
      try {
        const alerts = (await this.alerts(teacherId)).filter((a) => a.severity !== 'info');
        for (const alert of alerts) {
          const title = `${alert.title} · ${sectionLabel(alert.section.grade, alert.section.name)}`.slice(0, 150);
          const exists = await this.prisma.notification.findFirst({
            where: { userId: teacherId, title, createdAt: { gte: since } },
          });
          if (exists) continue;
          await this.prisma.notification.create({
            data: {
              userId: teacherId,
              type: alert.severity === 'critical' ? 'ERROR' : 'WARNING',
              title,
              message: `${alert.description} ${alert.students.map((s) => s.name).slice(0, 5).join(', ')}`.trim(),
              link: '/app/seguimiento',
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Alertas del docente ${teacherId}: ${(err as Error).message}`);
      }
    }
  }
}
