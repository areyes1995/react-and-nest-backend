import { round2, round4 } from './time.util';

export interface ResultPoint {
  /** Desempata operaciones con la misma fecha (orden de registro). */
  id?: number;
  tradeDate: Date;
  resultAmount: number;
}

/** Orden cronológico estable: fecha y, a igual fecha, id. */
export function chronological(a: ResultPoint, b: ResultPoint): number {
  return (
    a.tradeDate.getTime() - b.tradeDate.getTime() || (a.id ?? 0) - (b.id ?? 0)
  );
}

export interface EquitySummary {
  current: number;
  peak: number;
  /** Drawdown actual desde el pico (monto y fracción del pico). */
  drawdown: number;
  drawdownPct: number;
  /** Peor drawdown histórico (monto y fracción del pico de ese momento). */
  maxDrawdown: number;
  maxDrawdownPct: number;
  curve: { date: string; equity: number }[];
}

/** Curva de capital a partir de un saldo inicial y operaciones en orden cronológico. */
export function buildEquity(
  start: number,
  trades: ResultPoint[],
): EquitySummary {
  const ordered = [...trades].sort(chronological);
  let equity = start;
  let peak = start;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const curve: EquitySummary['curve'] = [];

  for (const t of ordered) {
    equity += t.resultAmount;
    peak = Math.max(peak, equity);
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (peak > 0 && dd / peak > maxDrawdownPct) maxDrawdownPct = dd / peak;
    curve.push({ date: t.tradeDate.toISOString(), equity: round2(equity) });
  }

  const drawdown = peak - equity;
  return {
    current: round2(equity),
    peak: round2(peak),
    drawdown: round2(drawdown),
    drawdownPct: peak > 0 ? round4(drawdown / peak) : 0,
    maxDrawdown: round2(maxDrawdown),
    maxDrawdownPct: round4(maxDrawdownPct),
    curve,
  };
}

/** Pérdidas consecutivas al final de la secuencia (las más recientes). */
export function trailingLosses(trades: ResultPoint[]): number {
  const ordered = [...trades].sort((a, b) => chronological(b, a));
  let count = 0;
  for (const t of ordered) {
    if (t.resultAmount < 0) count++;
    else break;
  }
  return count;
}
