// ──────────────────────────────────────────────
// Utilidades de fecha con desplazamiento horario del cliente.
// `tzOffset` sigue la convención de `Date#getTimezoneOffset()`:
// minutos a SUMAR a la hora local para obtener UTC (UTC-4 → 240).
// ──────────────────────────────────────────────

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Clave `YYYY-MM-DD` del día local del trader. */
export function localDayKey(date: Date, tzOffset = 0): string {
  return new Date(date.getTime() - tzOffset * MINUTE)
    .toISOString()
    .slice(0, 10);
}

/** Instante UTC en que empieza el día local que contiene `date`. */
export function startOfLocalDay(date: Date, tzOffset = 0): Date {
  const local = new Date(date.getTime() - tzOffset * MINUTE);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + tzOffset * MINUTE);
}

/** Instante UTC en que empieza la semana local (lunes) que contiene `date`. */
export function startOfLocalWeek(date: Date, tzOffset = 0): Date {
  const dayStart = startOfLocalDay(date, tzOffset);
  const localWeekday = new Date(
    dayStart.getTime() - tzOffset * MINUTE,
  ).getUTCDay();
  const daysSinceMonday = (localWeekday + 6) % 7;
  return new Date(dayStart.getTime() - daysSinceMonday * DAY);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
