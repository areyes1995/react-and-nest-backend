import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { formatDateOnly, toDateOnly } from '../shared/dates.util';
import {
  AttendanceHistoryDto,
  JustifyAttendanceDto,
  RevertAttendanceDto,
  SaveAttendanceDto,
} from './dto/attendance.dto';

type Counts = Record<AttendanceStatus, number>;
const emptyCounts = (): Counts => ({
  PRESENT: 0,
  LATE: 0,
  ABSENT: 0,
  EXCUSED: 0,
});

/** Asistencia efectiva: presente o tardanza. */
export function attendanceRate(c: Counts): number | null {
  const total = c.PRESENT + c.LATE + c.ABSENT + c.EXCUSED;
  if (!total) return null;
  return Math.round(((c.PRESENT + c.LATE) / total) * 1000) / 10;
}

type SectionWithYear = Awaited<ReturnType<TeacherScopeService['section']>>;

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  /** Toda escritura debe caer dentro del año escolar activo de la sección. */
  private assertWithinSchoolYear(section: SectionWithYear, day: Date) {
    const year = section.schoolYear;
    const value = formatDateOnly(day);
    if (
      formatDateOnly(year.startDate) > value ||
      formatDateOnly(year.endDate) < value
    ) {
      throw new BadRequestException(
        `La fecha ${value} está fuera del año escolar ${year.name} (${formatDateOnly(year.startDate)} a ${formatDateOnly(year.endDate)})`,
      );
    }
  }

  /** Pase de lista del día: estudiantes activos con su estado (si ya se registró). */
  async roster(teacherId: number, sectionId: number, date: string) {
    const section = await this.scope.section(teacherId, sectionId);
    const day = toDateOnly(date);
    const [students, records] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, deletedAt: null, isActive: true },
        orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.attendance.findMany({ where: { sectionId, date: day } }),
    ]);
    const byStudent = new Map(records.map((r) => [r.studentId, r]));
    return {
      section: {
        id: section.id,
        name: section.name,
        grade: section.grade.name,
        color: section.color,
      },
      date: formatDateOnly(day),
      taken: records.length > 0,
      withinSchoolYear:
        formatDateOnly(section.schoolYear.startDate) <= formatDateOnly(day) &&
        formatDateOnly(day) <= formatDateOnly(section.schoolYear.endDate),
      students: students.map((s) => {
        const record = byStudent.get(s.id);
        return {
          id: s.id,
          listNumber: s.listNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          status: record?.status ?? null,
          note: record?.note ?? null,
          justificationReason: record?.justificationReason ?? null,
          justificationNote: record?.justificationNote ?? null,
          justificationAttachment: record?.justificationAttachment ?? null,
        };
      }),
    };
  }

  async save(teacherId: number, dto: SaveAttendanceDto) {
    const section = await this.scope.section(teacherId, dto.sectionId);
    const date = toDateOnly(dto.date);
    this.assertWithinSchoolYear(section, date);
    const valid = await this.prisma.student.findMany({
      where: {
        sectionId: dto.sectionId,
        id: { in: dto.entries.map((e) => e.studentId) },
      },
      select: { id: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    const invalid = dto.entries.filter((e) => !validIds.has(e.studentId));
    if (invalid.length) {
      throw new BadRequestException(
        'Hay estudiantes que no pertenecen a la sección',
      );
    }

    await this.prisma.$transaction(
      dto.entries.map((e) => {
        const hasJustification = Boolean(
          e.justificationReason ||
          e.justificationNote ||
          e.justificationAttachment,
        );
        const justification = hasJustification
          ? {
              justificationReason: e.justificationReason ?? null,
              justificationNote: e.justificationNote ?? null,
              justificationAttachment: e.justificationAttachment ?? null,
              justifiedAt: new Date(),
            }
          : {};
        return this.prisma.attendance.upsert({
          where: { studentId_date: { studentId: e.studentId, date } },
          update: {
            status: e.status,
            note: e.note ?? null,
            sectionId: dto.sectionId,
            ...justification,
          },
          create: {
            studentId: e.studentId,
            sectionId: dto.sectionId,
            date,
            status: e.status,
            note: e.note ?? null,
            ...justification,
          },
        });
      }),
    );

    return this.stats(teacherId, dto.sectionId);
  }

  /** Justificación puntual de una marca existente (o la crea si aún no existe). */
  async justify(teacherId: number, dto: JustifyAttendanceDto) {
    const section = await this.scope.section(teacherId, dto.sectionId);
    const date = toDateOnly(dto.date);
    this.assertWithinSchoolYear(section, date);
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, sectionId: dto.sectionId, deletedAt: null },
      select: { id: true },
    });
    if (!student)
      throw new BadRequestException('El estudiante no pertenece a la sección');

    const record = await this.prisma.attendance.findUnique({
      where: { studentId_date: { studentId: dto.studentId, date } },
    });
    const data = {
      justificationReason: dto.reason,
      justificationNote: dto.note ?? null,
      justificationAttachment: dto.attachment ?? null,
      justifiedAt: new Date(),
    };
    return record
      ? this.prisma.attendance.update({ where: { id: record.id }, data })
      : this.prisma.attendance.create({
          data: {
            studentId: dto.studentId,
            sectionId: dto.sectionId,
            date,
            status: AttendanceStatus.ABSENT,
            ...data,
          },
        });
  }

  /** Revierte la asistencia de un día (o de un estudiante dentro del día). */
  async revert(teacherId: number, dto: RevertAttendanceDto) {
    const section = await this.scope.section(teacherId, dto.sectionId);
    const date = toDateOnly(dto.date);
    this.assertWithinSchoolYear(section, date);
    const deleted = await this.prisma.attendance.deleteMany({
      where: {
        sectionId: dto.sectionId,
        date,
        ...(dto.studentId ? { studentId: dto.studentId } : {}),
      },
    });
    return {
      deleted: deleted.count,
      ...(await this.stats(teacherId, dto.sectionId)),
    };
  }

  /** Historial audible de marcas y justificaciones de una sección. */
  async history(teacherId: number, query: AttendanceHistoryDto) {
    const section = await this.scope.section(teacherId, query.sectionId);
    if (query.from || query.to) {
      const bounds = query.from
        ? toDateOnly(query.from)
        : toDateOnly(section.schoolYear.startDate);
      this.assertWithinSchoolYear(section, bounds);
      if (query.to) this.assertWithinSchoolYear(section, toDateOnly(query.to));
    }
    const records = await this.prisma.attendance.findMany({
      where: {
        sectionId: query.sectionId,
        ...(query.studentId ? { studentId: query.studentId } : {}),
        ...(query.from || query.to
          ? {
              date: {
                ...(query.from ? { gte: toDateOnly(query.from) } : {}),
                ...(query.to ? { lte: toDateOnly(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            listNumber: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { student: { listNumber: 'asc' } }],
      take: Math.min(Math.max(query.limit ?? 200, 1), 500),
    });
    return {
      sectionId: query.sectionId,
      total: records.length,
      records: records.map((r) => ({
        id: r.id,
        date: formatDateOnly(r.date),
        status: r.status,
        note: r.note,
        justificationReason: r.justificationReason,
        justificationNote: r.justificationNote,
        justificationAttachment: r.justificationAttachment,
        justifiedAt: r.justifiedAt,
        student: r.student,
      })),
    };
  }

  /** Estadísticas por estudiante y por sección en un rango de fechas. */
  async stats(
    teacherId: number,
    sectionId: number,
    from?: string,
    to?: string,
  ) {
    await this.scope.section(teacherId, sectionId);
    const where = {
      sectionId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: toDateOnly(from) } : {}),
              ...(to ? { lte: toDateOnly(to) } : {}),
            },
          }
        : {}),
    };
    const [students, records] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, deletedAt: null },
        orderBy: [{ listNumber: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.attendance.findMany({ where }),
    ]);

    const section = emptyCounts();
    const perStudent = new Map<number, Counts>();
    const perDay = new Map<string, Counts>();
    for (const r of records) {
      section[r.status]++;
      if (!perStudent.has(r.studentId))
        perStudent.set(r.studentId, emptyCounts());
      perStudent.get(r.studentId)![r.status]++;
      const key = formatDateOnly(r.date);
      if (!perDay.has(key)) perDay.set(key, emptyCounts());
      perDay.get(key)![r.status]++;
    }

    return {
      sectionId,
      counts: section,
      rate: attendanceRate(section),
      days: [...perDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({
          date,
          counts,
          rate: attendanceRate(counts),
        })),
      students: students.map((s) => {
        const counts = perStudent.get(s.id) ?? emptyCounts();
        return {
          id: s.id,
          listNumber: s.listNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          counts,
          rate: attendanceRate(counts),
        };
      }),
    };
  }
}
