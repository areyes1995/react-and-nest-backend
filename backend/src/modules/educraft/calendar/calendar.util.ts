// Utilidades de calendario: expansión de recurrencias y construcción manual
// de iCalendar (RFC 5545) sin dependencias externas.

import {
  addDays,
  formatDateOnly,
  isoWeekday,
  toDateOnly,
} from '../shared/dates.util';
import { APP_TIMEZONE } from '../shared/zoned.util';

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export const RECURRENCE_FREQS: RecurrenceFreq[] = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
];

export interface RecurrenceConfig {
  freq: RecurrenceFreq;
  interval: number;
  until?: Date | null;
  count?: number | null;
  byWeekday?: number[];
}

const MAX_OCCURRENCES = 400;
const MAX_STEPS = 5000;

function nextOccurrence(
  current: Date,
  freq: RecurrenceFreq,
  interval: number,
): Date {
  const step = Math.max(1, interval);
  if (freq === 'DAILY') return addDays(current, step);
  if (freq === 'WEEKLY') return addDays(current, 7 * step);
  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const day = current.getUTCDate();
  const targetYear = freq === 'YEARLY' ? year + step : year;
  const targetMonth = freq === 'MONTHLY' ? month + step : month;
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)));
}

/** Fechas (YYYY-MM-DD a medianoche UTC) en las que ocurre el evento dentro del rango. */
export function expandRecurrence(
  anchor: Date,
  config: RecurrenceConfig,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const start = toDateOnly(rangeStart);
  const end = toDateOnly(rangeEnd);
  const until = config.until ? toDateOnly(config.until) : null;
  const limit = until && until < end ? until : end;
  const anchorDay = toDateOnly(anchor);
  const max = Math.min(
    config.count && config.count > 0 ? config.count : MAX_OCCURRENCES,
    MAX_OCCURRENCES,
  );
  const interval = Math.max(1, config.interval || 1);
  const results: Date[] = [];

  if (config.freq === 'WEEKLY' && config.byWeekday?.length) {
    const weekdays = [...new Set(config.byWeekday)]
      .filter((d) => d >= 1 && d <= 7)
      .sort((a, b) => a - b);
    for (let week = 0; week < MAX_STEPS; week++) {
      const blockStart = addDays(anchorDay, week * 7 * interval);
      if (blockStart > limit) break;
      for (const weekday of weekdays) {
        const candidate = addDays(blockStart, weekday - isoWeekday(blockStart));
        if (candidate < anchorDay || candidate > limit || candidate < start)
          continue;
        results.push(candidate);
        if (results.length >= max) return results;
      }
    }
    return results;
  }

  let current = anchorDay;
  for (let step = 0; step < MAX_STEPS; step++) {
    if (current > limit) break;
    if (current >= start) {
      results.push(current);
      if (results.length >= max) break;
    }
    current = nextOccurrence(current, config.freq, interval);
  }
  return results;
}

/** Desplazamiento GMT en minutos de la zona del centro para una fecha dada. */
export function zonedOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    timeZoneName: 'longOffset',
  }).formatToParts(instant);
  const name =
    parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
  if (!match) return 0;
  const total = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -total : total;
}

/** "YYYY-MM-DD" + "HH:MM" (hora local del centro) → instante UTC. */
export function toUtcDate(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const guess = new Date(
    Date.UTC(year, month - 1, day, hour || 0, minute || 0),
  );
  return new Date(guess.getTime() - zonedOffsetMinutes(guess) * 60_000);
}

/** "YYYY-MM-DD" + "HH:MM" (hora local del centro) → "YYYYMMDDTHHMMSSZ". */
export function toUtcDateTime(date: string, time: string): string {
  return formatUtcStamp(toUtcDate(date, time));
}

export function formatUtcStamp(instant: Date): string {
  return instant
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function toIcsDate(date: string): string {
  return date.replace(/-/g, '');
}

/** Escapa TEXT de iCalendar: comas, puntos y comas, barras y saltos de línea. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** Pliegue de líneas a 75 octetos con espacio de continuación (RFC 5545 §3.1). */
export function foldIcsLine(line: string): string {
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8');
    const limit = chunks.length === 0 && bytes === 0 ? 75 : 74;
    if (bytes + size > limit) {
      chunks.push(current);
      current = char;
      bytes = size;
    } else {
      current += char;
      bytes += size;
    }
  }
  chunks.push(current);
  return chunks.join('\r\n ') + '\r\n';
}

export function icsDateStamp(now = new Date()): string {
  return now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function formatIcsRangeDay(date: string): string {
  return formatDateOnly(toDateOnly(date));
}
