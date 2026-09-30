import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { CalendarService } from '../calendar/calendar.service';
import { ReportService } from '../report/report.service';
import { addDays, formatDateOnly, toDateOnly } from '../shared/dates.util';
import { GRADING_BLOCKS } from '../shared/grading.calculator';
import { localParts } from '../shared/zoned.util';
import { UpdateTeacherProfileDto } from './dto/teacher.dto';

/** Fecha y hora actuales en la zona horaria del centro. */
export const localNow = (now = new Date()) => localParts(now);

type ClassStatus = 'EN_PROGRESO' | 'PROXIMA' | 'PROGRAMADA' | 'FINALIZADA';

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
    private readonly calendar: CalendarService,
    private readonly reports: ReportService,
  ) {}

  async profile(userId: number) {
    const user = await this.prisma.systemUser.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        teacherProfile: true,
      },
    });
    const profile =
      user.teacherProfile ??
      (await this.prisma.teacherProfile.create({ data: { userId, displayTitle: 'Prof.' } }));
    return { ...user, teacherProfile: profile };
  }

  async updateProfile(userId: number, dto: UpdateTeacherProfileDto) {
    const { firstName, lastName, phoneNumber, preferences, ...rest } = dto;
    const profile = {
      ...rest,
      ...(rest.avatarUrl === '' ? { avatarUrl: null } : {}),
      ...(rest.signature === '' ? { signature: null } : {}),
    };
    await this.prisma.systemUser.update({
      where: { id: userId },
      data: { firstName: firstName?.trim(), lastName: lastName?.trim(), phoneNumber },
    });
    await this.prisma.teacherProfile.upsert({
      where: { userId },
      update: { ...profile, preferences: preferences as Prisma.InputJsonValue | undefined },
      create: { userId, ...profile, preferences: (preferences ?? {}) as Prisma.InputJsonValue },
    });
    return this.profile(userId);
  }

  /** Datos del panel de inicio ("Dashboard activo"). */
  async dashboard(userId: number, period?: number) {
    const now = localNow();
    const year = await this.scope.activeSchoolYear(userId);
    const [profile, today, sections] = await Promise.all([
      this.profile(userId),
      this.calendar.agenda(userId, now.date, now.date),
      year
        ? this.prisma.section.findMany({
            where: { teacherId: userId, schoolYearId: year.id, deletedAt: null },
            include: { grade: true },
            orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    // Clases de hoy con estado respecto a la hora actual.
    const classes = today.filter((i) => i.source === 'class');
    const plans = classes.length
      ? await this.prisma.lessonPlan.findMany({
          where: {
            teacherId: userId,
            deletedAt: null,
            date: toDateOnly(now.date),
            sectionId: { in: classes.map((c) => c.section!.id) },
          },
          select: { id: true, title: true, topic: true, sectionId: true },
        })
      : [];
    let nextMarked = false;
    const todayClasses = classes.map((c) => {
      let status: ClassStatus = 'PROGRAMADA';
      if (c.endTime && c.endTime <= now.time) status = 'FINALIZADA';
      else if (c.startTime && c.startTime <= now.time) status = 'EN_PROGRESO';
      else if (!nextMarked) {
        status = 'PROXIMA';
        nextMarked = true;
      }
      const plan = plans.find((p) => p.sectionId === c.section?.id);
      return {
        key: c.key,
        section: c.section,
        startTime: c.startTime,
        endTime: c.endTime,
        topic: plan?.topic ?? c.description ?? null,
        lessonPlanId: plan?.id ?? null,
        status,
      };
    });

    // Resumen de la clase (todas las secciones del año activo).
    const performances = await Promise.all(
      sections.map((s) => this.reports.sectionPerformance(userId, s.id, period)),
    );
    const allRows = performances.flatMap((p) => p.rows);
    const avg = (values: Array<number | null | undefined>) => {
      const list = values.filter((v): v is number => typeof v === 'number');
      return list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null;
    };
    const competences = GRADING_BLOCKS.map(({ block, code, name }) => ({
      block,
      code,
      name,
      average: avg(allRows.map((r) => r.blocks[block])),
    }));

    const monthStart = `${now.date.slice(0, 8)}01`;
    const upcoming = (
      await this.calendar.agenda(userId, now.date, formatDateOnly(addDays(toDateOnly(now.date), 14)), false)
    ).slice(0, 8);

    const alerts = await this.reports.alerts(userId);

    return {
      teacher: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayTitle: profile.teacherProfile.displayTitle,
        specialty: profile.teacherProfile.specialty,
        avatarUrl: profile.teacherProfile.avatarUrl,
      },
      now,
      monthStart,
      schoolYear: year && {
        id: year.id,
        name: year.name,
        periods: year.periods.map((p) => ({
          number: p.number,
          name: p.name,
          startDate: formatDateOnly(p.startDate),
          endDate: formatDateOnly(p.endDate),
        })),
        currentPeriod:
          year.periods.find(
            (p) => formatDateOnly(p.startDate) <= now.date && formatDateOnly(p.endDate) >= now.date,
          )?.number ?? null,
      },
      sections: sections.map((s) => ({ id: s.id, name: s.name, grade: s.grade.name, color: s.color })),
      todayClasses,
      summary: {
        period: period ?? null,
        students: allRows.length,
        average: avg(allRows.map((r) => r.score)),
        attendanceRate: avg(performances.map((p) => p.summary.attendanceRate)),
        atRisk: allRows.filter((r) => r.level === 'INICIO' || r.level === 'EN_PROCESO').length,
        competences,
      },
      upcoming,
      alerts: alerts.slice(0, 6),
    };
  }

  /** Búsqueda global ("Buscar en Educraft XYZ…"). */
  async search(userId: number, q: string, scope?: string) {
    const term = q.trim();
    if (term.length < 2) return { students: [], lessonPlans: [], resources: [], evaluations: [] };
    const contains = { contains: term, mode: 'insensitive' as const };
    const want = (s: string) => !scope || scope === 'all' || scope === s;
    const [students, lessonPlans, resources, instruments, exams] = await Promise.all([
      want('students')
        ? this.prisma.student.findMany({
            where: {
              deletedAt: null,
              section: { teacherId: userId, deletedAt: null },
              OR: [{ firstName: contains }, { lastName: contains }],
            },
            include: { section: { include: { grade: true } } },
            take: 6,
          })
        : [],
      want('resources')
        ? this.prisma.lessonPlan.findMany({
            where: { teacherId: userId, deletedAt: null, OR: [{ title: contains }, { topic: contains }] },
            select: { id: true, title: true, topic: true, date: true },
            take: 6,
          })
        : [],
      want('resources')
        ? this.prisma.libraryResource.findMany({
            where: {
              teacherId: userId,
              deletedAt: null,
              OR: [{ title: contains }, { tags: { has: term.toLowerCase() } }],
            },
            select: { id: true, title: true, category: true },
            take: 6,
          })
        : [],
      want('evaluations')
        ? this.prisma.evaluationInstrument.findMany({
            where: { teacherId: userId, deletedAt: null, title: contains },
            select: { id: true, title: true, type: true },
            take: 6,
          })
        : [],
      want('evaluations')
        ? this.prisma.exam.findMany({
            where: { teacherId: userId, deletedAt: null, title: contains },
            select: { id: true, title: true },
            take: 6,
          })
        : [],
    ]);
    return {
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        section: `${s.section.grade.name} ${s.section.name}`,
      })),
      lessonPlans,
      resources,
      evaluations: [
        ...instruments.map((i) => ({ id: i.id, title: i.title, kind: i.type })),
        ...exams.map((e) => ({ id: e.id, title: e.title, kind: 'EXAM' })),
      ],
    };
  }
}
