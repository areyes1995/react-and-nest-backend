import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { formatDateOnly, toDateOnly } from '../shared/dates.util';
import { SaveAttendanceDto } from './dto/attendance.dto';

type Counts = Record<AttendanceStatus, number>;
const emptyCounts = (): Counts => ({ PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 });

/** Asistencia efectiva: presente o tardanza. */
export function attendanceRate(c: Counts): number | null {
  const total = c.PRESENT + c.LATE + c.ABSENT + c.EXCUSED;
  if (!total) return null;
  return Math.round(((c.PRESENT + c.LATE) / total) * 1000) / 10;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

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
      section: { id: section.id, name: section.name, grade: section.grade.name, color: section.color },
      date: formatDateOnly(day),
      taken: records.length > 0,
      students: students.map((s) => ({
        id: s.id,
        listNumber: s.listNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        status: byStudent.get(s.id)?.status ?? null,
        note: byStudent.get(s.id)?.note ?? null,
      })),
    };
  }

  async save(teacherId: number, dto: SaveAttendanceDto) {
    await this.scope.section(teacherId, dto.sectionId);
    const date = toDateOnly(dto.date);
    const valid = await this.prisma.student.findMany({
      where: { sectionId: dto.sectionId, id: { in: dto.entries.map((e) => e.studentId) } },
      select: { id: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    const invalid = dto.entries.filter((e) => !validIds.has(e.studentId));
    if (invalid.length) {
      throw new BadRequestException('Hay estudiantes que no pertenecen a la sección');
    }

    await this.prisma.$transaction(
      dto.entries.map((e) =>
        this.prisma.attendance.upsert({
          where: { studentId_date: { studentId: e.studentId, date } },
          update: { status: e.status, note: e.note ?? null, sectionId: dto.sectionId },
          create: {
            studentId: e.studentId,
            sectionId: dto.sectionId,
            date,
            status: e.status,
            note: e.note ?? null,
          },
        }),
      ),
    );

    return this.stats(teacherId, dto.sectionId);
  }

  /** Estadísticas por estudiante y por sección en un rango de fechas. */
  async stats(teacherId: number, sectionId: number, from?: string, to?: string) {
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
      if (!perStudent.has(r.studentId)) perStudent.set(r.studentId, emptyCounts());
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
        .map(([date, counts]) => ({ date, counts, rate: attendanceRate(counts) })),
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
