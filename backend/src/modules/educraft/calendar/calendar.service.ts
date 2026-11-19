import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherScopeService } from '../shared/teacher-scope.service';
import { addDays, formatDateOnly, toDateOnly } from '../shared/dates.util';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';
import { localParts, sectionLabel } from '../shared/zoned.util';
import {
  escapeIcsText,
  expandRecurrence,
  foldIcsLine,
  formatUtcStamp,
  icsDateStamp,
  toIcsDate,
  toUtcDate,
  type RecurrenceFreq,
} from './calendar.util';

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
  recurring?: boolean;
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

type CalendarEventWithRelations = Prisma.CalendarEventGetPayload<{
  include: { section: { include: { grade: true } } };
}>;

function parseWeekdays(value: string | null): number[] | undefined {
  if (!value) return undefined;
  const days = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
  return days.length ? days : undefined;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TeacherScopeService,
  ) {}

  /**
   * Agenda unificada entre dos fechas: eventos propios (con recurrencias
   * expandidas), clases derivadas del horario semanal y feriados.
   */
  async agenda(
    teacherId: number,
    from: string,
    to: string,
    includeClasses = true,
  ) {
    const start = toDateOnly(from);
    const end = toDateOnly(to);
    const endExclusive = addDays(end, 1);
    const year = await this.scope.activeSchoolYear(teacherId);

    const [events, recurringEvents, holidays, sections] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          teacherId,
          deletedAt: null,
          recurrenceFreq: null,
          startAt: { gte: addDays(start, -1), lt: addDays(endExclusive, 1) },
        },
        include: { section: { include: { grade: true } } },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          teacherId,
          deletedAt: null,
          recurrenceFreq: { not: null },
          startAt: { lte: addDays(endExclusive, 1) },
          OR: [
            { recurrenceUntil: null },
            { recurrenceUntil: { gte: addDays(start, -1) } },
          ],
        },
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

    for (const e of [...events, ...recurringEvents]) {
      items.push(...this.eventItems(e, start, end));
    }

    if (year) {
      for (let day = start; day <= end; day = addDays(day, 1)) {
        const key = formatDateOnly(day);
        if (holidayDays.has(key) || day < year.startDate || day > year.endDate)
          continue;
        const weekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay();
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
              section: {
                id: s.id,
                name: s.name,
                grade: s.grade.name,
                color: s.color,
              },
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

  private eventItems(
    event: CalendarEventWithRelations,
    start: Date,
    end: Date,
  ): AgendaItem[] {
    const anchorDay = event.allDay
      ? formatDateOnly(event.startAt)
      : localParts(event.startAt).date;
    const startTime = event.allDay ? null : localParts(event.startAt).time;
    const endTime =
      event.endAt && !event.allDay ? localParts(event.endAt).time : null;
    const recurring = Boolean(event.recurrenceFreq);
    const dates = recurring
      ? expandRecurrence(
          toDateOnly(anchorDay),
          {
            freq: event.recurrenceFreq as RecurrenceFreq,
            interval: event.recurrenceInterval ?? 1,
            until: event.recurrenceUntil,
            count: event.recurrenceCount,
            byWeekday: parseWeekdays(event.recurrenceByWeekday),
          },
          start,
          end,
        )
      : [toDateOnly(anchorDay)];

    return dates
      .filter(
        (day) =>
          formatDateOnly(day) >= formatDateOnly(start) &&
          formatDateOnly(day) <= formatDateOnly(end),
      )
      .map((day) => ({
        key: recurring
          ? `event-${event.id}-${formatDateOnly(day)}`
          : `event-${event.id}`,
        source: 'event' as const,
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        date: formatDateOnly(day),
        startTime,
        endTime,
        allDay: event.allDay,
        color: event.color ?? event.section?.color ?? EVENT_COLORS[event.type],
        section: event.section
          ? {
              id: event.section.id,
              name: event.section.name,
              grade: event.section.grade.name,
              color: event.section.color,
            }
          : null,
        lessonPlanId: event.lessonPlanId,
        assessmentId: event.assessmentId,
        recurring,
      }));
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
        recurrenceFreq: dto.recurrenceFreq ?? null,
        recurrenceInterval: dto.recurrenceFreq
          ? (dto.recurrenceInterval ?? 1)
          : null,
        recurrenceUntil:
          dto.recurrenceFreq && dto.recurrenceUntil
            ? toDateOnly(dto.recurrenceUntil)
            : null,
        recurrenceCount: dto.recurrenceFreq
          ? (dto.recurrenceCount ?? null)
          : null,
        recurrenceByWeekday:
          dto.recurrenceFreq && dto.recurrenceByWeekday?.length
            ? dto.recurrenceByWeekday.join(',')
            : null,
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
            section: {
              select: {
                _count: {
                  select: { students: { where: { deletedAt: null } } },
                },
              },
            },
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
        recurrenceFreq: dto.recurrenceFreq,
        recurrenceInterval:
          dto.recurrenceInterval ?? (dto.recurrenceFreq ? 1 : undefined),
        recurrenceUntil:
          dto.recurrenceUntil !== undefined
            ? dto.recurrenceUntil
              ? toDateOnly(dto.recurrenceUntil)
              : null
            : undefined,
        recurrenceCount: dto.recurrenceCount,
        recurrenceByWeekday: dto.recurrenceByWeekday
          ? dto.recurrenceByWeekday.join(',')
          : dto.recurrenceByWeekday === undefined
            ? undefined
            : null,
      },
    });
  }

  async remove(teacherId: number, id: number) {
    await this.get(teacherId, id);
    await this.prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Agenda en iCalendar (text/calendar) con líneas escapadas y plegadas. */
  async exportIcs(
    teacherId: number,
    from: string,
    to: string,
  ): Promise<string> {
    const items = (await this.agenda(teacherId, from, to, true)).filter(
      (i) => i.source === 'event' || i.source === 'holiday',
    );
    const stamp = icsDateStamp();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Educraft XYZ//Agenda Academica//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Agenda Educraft XYZ',
    ];

    for (const item of items) {
      const description = [
        EVENT_COLORS[item.type] ? item.type : '',
        item.section ? sectionLabel(item.section.grade, item.section.name) : '',
        item.description ?? '',
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.key}@educraft.app`,
        `DTSTAMP:${stamp}`,
        `SUMMARY:${escapeIcsText(item.title)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
      );
      if (item.allDay) {
        const day = toDateOnly(item.date);
        lines.push(
          `DTSTART;VALUE=DATE:${toIcsDate(formatDateOnly(day))}`,
          `DTEND;VALUE=DATE:${toIcsDate(formatDateOnly(addDays(day, 1)))}`,
        );
      } else {
        const start = toUtcDate(item.date, item.startTime ?? '00:00');
        const end =
          item.endTime && item.startTime && item.endTime > item.startTime
            ? toUtcDate(item.date, item.endTime)
            : new Date(start.getTime() + 60 * 60_000);
        lines.push(
          `DTSTART:${formatUtcStamp(start)}`,
          `DTEND:${formatUtcStamp(end)}`,
        );
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.map(foldIcsLine).join('');
  }
}
