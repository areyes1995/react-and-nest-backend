// ──────────────────────────────────────────────
// Distribución de ingresos y payouts en categorías
// configurables por el usuario.
// ──────────────────────────────────────────────

import { round2 } from './time.util';

export interface Bucket {
  key: string;
  label: string;
  percent: number;
}

export interface AllocatedBucket extends Bucket {
  amount: number;
}

export const DEFAULT_INCOME_BUCKETS: Bucket[] = [
  { key: 'trading', label: 'Capital para trading', percent: 20 },
  { key: 'savings', label: 'Ahorro', percent: 20 },
  { key: 'expenses', label: 'Gastos personales', percent: 40 },
  { key: 'emergency', label: 'Fondo de emergencia', percent: 10 },
  { key: 'education', label: 'Reinversión / educación', percent: 10 },
];

export const DEFAULT_PAYOUT_BUCKETS: Bucket[] = [
  { key: 'expenses', label: 'Gastos', percent: 30 },
  { key: 'savings', label: 'Ahorro', percent: 30 },
  { key: 'reinvest', label: 'Reinversión', percent: 20 },
  { key: 'trading', label: 'Trading', percent: 10 },
  { key: 'emergency', label: 'Emergencia', percent: 10 },
];

/** Devuelve un mensaje de error o `null` si los buckets son válidos. */
export function validateBuckets(buckets: Bucket[]): string | null {
  if (!buckets.length) return 'Debe haber al menos una categoría.';
  const keys = new Set(buckets.map((b) => b.key));
  if (keys.size !== buckets.length)
    return 'Las categorías no pueden repetirse.';
  if (buckets.some((b) => b.percent < 0))
    return 'Los porcentajes no pueden ser negativos.';
  const total = buckets.reduce((acc, b) => acc + b.percent, 0);
  if (Math.abs(total - 100) > 0.01) {
    return `Los porcentajes deben sumar 100% (suman ${round2(total)}%).`;
  }
  return null;
}

/**
 * Reparte `amount` según los porcentajes. La última categoría absorbe
 * el redondeo para que la suma sea exactamente el monto original.
 */
export function allocate(amount: number, buckets: Bucket[]): AllocatedBucket[] {
  let assigned = 0;
  return buckets.map((b, i) => {
    const value =
      i === buckets.length - 1
        ? round2(amount - assigned)
        : round2((amount * b.percent) / 100);
    assigned = round2(assigned + value);
    return { ...b, amount: value };
  });
}
