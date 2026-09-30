// Hora local del centro educativo (por defecto República Dominicana).

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Santo_Domingo';

/** Fecha (YYYY-MM-DD) y hora (HH:MM) de un instante en la zona del centro. */
export function localParts(instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour').replace('24', '00')}:${get('minute')}`,
  };
}

/** "3ro de Secundaria" + "A" → "3° Secundaria A". */
export function sectionLabel(gradeName: string, sectionName: string): string {
  const short = gradeName.replace(/^(\d)\s*(?:ro|do|to|er|mo|vo|no)?\s+de\s+/i, '$1° ');
  return `${short} ${sectionName}`.trim();
}
