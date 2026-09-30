// ──────────────────────────────────────────────
// Fechas "solo día" (columnas @db.Date).
// Se normalizan a medianoche UTC para que el día
// no se corra por la zona horaria del servidor.
// ──────────────────────────────────────────────

import { BadRequestException } from '@nestjs/common';

/** "2025-05-15" | Date → Date a las 00:00 UTC de ese día. */
export function toDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    throw new BadRequestException(`Fecha inválida: ${value}`);
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** Date → "YYYY-MM-DD" (UTC). */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** 1 = lunes … 7 = domingo (ISO). */
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}
