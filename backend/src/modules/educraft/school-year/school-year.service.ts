import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { DR_HOLIDAYS } from 'prisma/seeders/data/curriculum-matematica';
import { addDays, formatDateOnly, isoWeekday, toDateOnly } from '../shared/dates.util';
import {
  CreateHolidayDto,
  CreateSchoolYearDto,
  PeriodDto,
  UpdateSchoolYearDto,
} from './dto/school-year.dto';

const INCLUDE = {
  periods: { orderBy: { number: 'asc' } },
  holidays: { orderBy: { date: 'asc' } },
  _count: { select: { sections: { where: { deletedAt: null } } } },
} satisfies Prisma.SchoolYearInclude;

@Injectable()
export class SchoolYearService {
  constructor(private readonly prisma: PrismaService) {}

  list(teacherId: number) {
    return this.prisma.schoolYear.findMany({
      where: { teacherId, deletedAt: null },
      include: INCLUDE,
      orderBy: { startDate: 'desc' },
    });
  }

  async get(teacherId: number, id: number) {
    const year = await this.prisma.schoolYear.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: INCLUDE,
    });
    if (!year) throw new NotFoundException(`Año escolar ${id} no encontrado`);
    return { ...year, calendar: this.teachingCalendar(year) };
  }

  async create(teacherId: number, dto: CreateSchoolYearDto) {
    const startDate = toDateOnly(dto.startDate);
    const endDate = toDateOnly(dto.endDate);
    const periods = dto.periods?.length ? dto.periods : splitPeriods(startDate, endDate);
    const holidays =
      dto.includeNationalHolidays === false ? [] : nationalHolidaysBetween(startDate, endDate);

    return this.prisma.$transaction(async (tx) => {
      // Solo un año activo por docente.
      await tx.schoolYear.updateMany({
        where: { teacherId, isActive: true },
        data: { isActive: false },
      });
      return tx.schoolYear.create({
        data: {
          teacherId,
          name: dto.name,
          startDate,
          endDate,
          isActive: true,
          teachingWeeks: dto.teachingWeeks ?? countTeachingWeeks(startDate, endDate),
          gradingScale: (dto.gradingScale ?? { type: 'NUMERIC_100', passing: 70 }) as object,
          periods: {
            create: periods.map((p) => ({
              number: p.number,
              name: p.name,
              startDate: toDateOnly(p.startDate),
              endDate: toDateOnly(p.endDate),
            })),
          },
          holidays: { create: holidays },
        },
        include: INCLUDE,
      });
    });
  }

  async update(teacherId: number, id: number, dto: UpdateSchoolYearDto) {
    await this.get(teacherId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.schoolYear.updateMany({
          where: { teacherId, isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }
      if (dto.periods) {
        for (const p of dto.periods) {
          await tx.academicPeriod.upsert({
            where: { schoolYearId_number: { schoolYearId: id, number: p.number } },
            update: {
              name: p.name,
              startDate: toDateOnly(p.startDate),
              endDate: toDateOnly(p.endDate),
            },
            create: {
              schoolYearId: id,
              number: p.number,
              name: p.name,
              startDate: toDateOnly(p.startDate),
              endDate: toDateOnly(p.endDate),
            },
          });
        }
      }
      return tx.schoolYear.update({
        where: { id },
        data: {
          name: dto.name,
          startDate: dto.startDate ? toDateOnly(dto.startDate) : undefined,
          endDate: dto.endDate ? toDateOnly(dto.endDate) : undefined,
          teachingWeeks: dto.teachingWeeks,
          gradingScale: dto.gradingScale ? (dto.gradingScale as object) : undefined,
          isActive: dto.isActive,
        },
        include: INCLUDE,
      });
    });
  }

  async remove(teacherId: number, id: number) {
    await this.get(teacherId, id);
    await this.prisma.schoolYear.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async addHoliday(teacherId: number, schoolYearId: number, dto: CreateHolidayDto) {
    await this.get(teacherId, schoolYearId);
    return this.prisma.holiday.create({
      data: {
        schoolYearId,
        name: dto.name,
        date: toDateOnly(dto.date),
        isNational: dto.isNational ?? false,
      },
    });
  }

  async removeHoliday(teacherId: number, holidayId: number) {
    const holiday = await this.prisma.holiday.findFirst({
      where: { id: holidayId, schoolYear: { teacherId } },
    });
    if (!holiday) throw new NotFoundException(`Feriado ${holidayId} no encontrado`);
    await this.prisma.holiday.delete({ where: { id: holidayId } });
  }

  /**
   * Semanas lectivas del año: por cada semana, días hábiles descontando
   * feriados. Base de la vista anual/bimestral del planificador.
   */
  private teachingCalendar(year: {
    startDate: Date;
    endDate: Date;
    holidays: Array<{ date: Date; name: string }>;
    periods: Array<{ number: number; startDate: Date; endDate: Date }>;
  }) {
    const holidaySet = new Map(year.holidays.map((h) => [formatDateOnly(h.date), h.name]));
    const weeks: Array<{
      week: number;
      start: string;
      end: string;
      period: number | null;
      teachingDays: number;
      holidays: string[];
    }> = [];
    // Primer lunes en o antes del inicio.
    let cursor = addDays(year.startDate, 1 - isoWeekday(year.startDate));
    let week = 1;
    while (cursor <= year.endDate) {
      let teachingDays = 0;
      const names: string[] = [];
      for (let d = 0; d < 5; d++) {
        const day = addDays(cursor, d);
        if (day < year.startDate || day > year.endDate) continue;
        const key = formatDateOnly(day);
        if (holidaySet.has(key)) names.push(holidaySet.get(key)!);
        else teachingDays++;
      }
      const period = year.periods.find((p) => cursor >= addDays(p.startDate, -6) && cursor <= p.endDate);
      weeks.push({
        week,
        start: formatDateOnly(cursor),
        end: formatDateOnly(addDays(cursor, 4)),
        period: period?.number ?? null,
        teachingDays,
        holidays: names,
      });
      cursor = addDays(cursor, 7);
      week++;
    }
    return weeks;
  }
}

/** Divide el año en 4 periodos de duración similar. */
export function splitPeriods(start: Date, end: Date): PeriodDto[] {
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const size = Math.floor(totalDays / 4);
  return [1, 2, 3, 4].map((n) => {
    const s = addDays(start, (n - 1) * size);
    const e = n === 4 ? end : addDays(start, n * size - 1);
    return {
      number: n,
      name: `Periodo ${n}`,
      startDate: formatDateOnly(s),
      endDate: formatDateOnly(e),
    };
  });
}

function nationalHolidaysBetween(start: Date, end: Date) {
  const result: Array<{ name: string; date: Date; isNational: boolean }> = [];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
    for (const h of DR_HOLIDAYS) {
      const date = toDateOnly(`${year}-${h.monthDay}`);
      if (date >= start && date <= end) result.push({ name: h.name, date, isNational: true });
    }
  }
  return result;
}

function countTeachingWeeks(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86_400_000)));
}
