import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { addDays, formatDateOnly, isoWeekday, toDateOnly } from '../shared/dates.util';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';
import { localParts, sectionLabel } from '../shared/zoned.util';

export interface AgendaItem {
  key: string;
  source: 'event' | 'class' | 'holiday';
  id: number | null;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  color?: string | null;
  section?: { id: number; name: string; grade: string; color: string } | null;
  lessonPlanId?: number | null;
  assessmentId?: number | null;
}

const EVENT_COLORS: Record<string, string> = {
  CLASS: '#8b5cf6',
  EXAM: '#f97316',
  MEETING: '#0ea5e9',
  DELIVERY: '#ec4899',
  INSTITUTIONAL: '#6366f1',
  CIVIC: '#ef4444',
  VACATION: '#22c55e',
  HOLIDAY: '#ef4444',
  REMINDER: '#eab308',
};


@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  /**
   * Agenda unificada entre dos fechas: eventos propios, clases
   * derivadas del horario semanal (excepto en feriados) y feriados.
   */
  async agenda(teacherId: number, from: string, to: string, includeClasses = true) {
    const start = toDateOnly(from);
    const end = toDateOnly(to);
    const endExclusive = addDays(end, 1);
    const year = await this.scope.activeSchoolYear(teacherId);

    const [events, holidays, sections] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: { teacherId, deletedAt: null, startAt: { gte: addDays(start, -1), lt: addDays(endExclusive, 1) } },
        include: { section: { include: { grade: true } } },
        orderBy: { startAt: 'asc' },
      }),
      year
        ? this.prisma.holiday.findMany({
            where: { schoolYearId: year.id, date: { gte: start, lte: end } },
          })
        : Promise.resolve([]),
      includeClasses && year
        ? this.prisma.section.findMany({
            where: { teacherId, schoolYearId: year.id, deletedAt: null },
            include: { schedules: true, grade: true },
          })
        : Promise.resolve([]),
    ]);

    const holidayDays = new Set(holidays.map((h) => formatDateOnly(h.date)));
    const items: AgendaItem[] = [];

    for (const h of holidays) {
      items.push({
        key: `holiday-${h.id}`,
        source: 'holiday',
        id: h.id,
        type: 'HOLIDAY',
        title: h.name,
        date: formatDateOnly(h.date),
        allDay: true,
        color: EVENT_COLORS.HOLIDAY,
      });
    }

    for (const e of events) {
      const day = e.allDay ? formatDateOnly(e.startAt) : localParts(e.startAt).date;
      if (day < from.slice(0, 10) || day > to.slice(0, 10)) continue;
      items.push({
        key: `event-${e.id}`,
        source: 'event',
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        date: e.allDay ? formatDateOnly(e.startAt) : localParts(e.startAt).date,
        startTime: e.allDay ? null : localParts(e.startAt).time,
        endTime: e.endAt && !e.allDay ? localParts(e.endAt).time : null,
        allDay: e.allDay,
        color: e.color ?? e.section?.color ?? EVENT_COLORS[e.type],
        section: e.section
          ? { id: e.section.id, name: e.section.name, grade: e.section.grade.name, color: e.section.color }
          : null,
        lessonPlanId: e.lessonPlanId,
        assessmentId: e.assessmentId,
      });
    }

    if (year) {
      for (let day = start; day <= end; day = addDays(day, 1)) {
        const key = formatDateOnly(day);
        if (holidayDays.has(key) || day < year.startDate || day > year.endDate) continue;
        const weekday = isoWeekday(day);
        for (const s of sections) {
          for (const slot of s.schedules.filter((x) => x.weekday === weekday)) {
            items.push({
              key: `class-${slot.id}-${key}`,
              source: 'class',
              id: slot.id,
              type: 'CLASS',
              title: sectionLabel(s.grade.name, s.name),
              description: slot.topic,
              date: key,
              startTime: slot.startTime,
              endTime: slot.endTime,
              allDay: false,
              color: s.color,
              section: { id: s.id, name: s.name, grade: s.grade.name, color: s.color },
            });
          }
        }
      }
    }

    return items.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        Number(b.allDay) - Number(a.allDay) ||
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    );
  }

  async create(teacherId: number, dto: CreateEventDto) {
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    return this.prisma.calendarEvent.create({
      data: {
        teacherId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        allDay: dto.allDay ?? false,
        sectionId: dto.sectionId,
        color: dto.color,
      },
    });
  }

  async get(teacherId: number, id: number) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: {
        section: { include: { grade: true } },
        lessonPlan: { select: { id: true, title: true, topic: true } },
        assessment: {
          include: {
            scores: { select: { delivered: true, score: true } },
            section: { select: { _count: { select: { students: { where: { deletedAt: null } } } } } },
          },
        },
      },
    });
    if (!event) throw new NotFoundException(`Evento ${id} no encontrado`);
    const a = event.assessment;
    return {
      ...event,
      delivery: a
        ? {
            students: a.section._count.students,
            delivered: a.scores.filter((s) => s.delivered).length,
            graded: a.scores.filter((s) => s.score != null).length,
          }
        : null,
    };
  }

  async update(teacherId: number, id: number, dto: UpdateEventDto) {
    await this.get(teacherId, id);
    if (dto.sectionId) await this.scope.section(teacherId, dto.sectionId);
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        allDay: dto.allDay,
        sectionId: dto.sectionId,
        color: dto.color,
      },
    });
  }

  async remove(teacherId: number, id: number) {
    await this.get(teacherId, id);
    await this.prisma.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
