// ──────────────────────────────────────────────
// Estado de una cuenta de fondeo según sus propias reglas:
// objetivo, pérdida diaria, drawdown (estático o trailing)
// y días mínimos de trading.
// ──────────────────────────────────────────────

import { buildEquity, ResultPoint } from './equity';
import { localDayKey, round2, round4, startOfLocalDay, sum } from './time.util';

export type FundingHealth = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface FundingRules {
  accountSize: number;
  profitTargetPct: number;
  dailyLossPct: number;
  maxDrawdownPct: number;
  drawdownType: 'STATIC' | 'TRAILING';
  minTradingDays: number;
  targetDays: number;
  riskPerTradePct: number;
  rewardRatio: number;
  /** Fecha de calendario (columna DATE): se lee en UTC, sin zona horaria. */
  startDate: Date;
  status: 'ACTIVE' | 'PASSED' | 'FAILED' | 'PAUSED';
}

export interface FundingStatusResult {
  health: FundingHealth;
  message: string;
  balance: number;
  profit: number;
  profitTarget: number;
  profitRemaining: number;
  progressPct: number;
  daily: { pnl: number; limit: number; used: number; remaining: number };
  drawdown: { floor: number; distance: number; limit: number; usedPct: number };
  riskPerTrade: number;
  lossesToDailyLimit: number;
  lossesToMaxDrawdown: number;
  tradingDays: number;
  minTradingDaysMet: boolean;
  daysElapsed: number;
  daysRemaining: number;
  /** Ganancia media diaria necesaria para llegar en los días objetivo restantes. */
  requiredPerDay: number;
  requiredRPerDay: number;
  targetReached: boolean;
  breached: boolean;
}

const DAY = 86_400_000;

export function evaluateFunding(
  rules: FundingRules,
  trades: ResultPoint[],
  now: Date = new Date(),
  tzOffset = 0,
): FundingStatusResult {
  const size = rules.accountSize;
  const equity = buildEquity(size, trades);
  const balance = equity.current;
  const profit = balance - size;
  const profitTarget = (size * rules.profitTargetPct) / 100;
  const ddLimit = (size * rules.maxDrawdownPct) / 100;

  // Trailing: el piso sube con el pico hasta asegurar el saldo inicial.
  const floor =
    rules.drawdownType === 'TRAILING'
      ? Math.min(equity.peak - ddLimit, size)
      : size - ddLimit;
  const distance = balance - floor;
  const usedPct =
    ddLimit > 0 ? Math.min(1, Math.max(0, (ddLimit - distance) / ddLimit)) : 0;

  const dayStart = startOfLocalDay(now, tzOffset);
  const todayPnl = sum(
    trades.filter((t) => t.tradeDate >= dayStart).map((t) => t.resultAmount),
  );
  // Límite diario sobre el tamaño inicial de la cuenta (regla más común).
  const dailyLimit = (size * rules.dailyLossPct) / 100;
  const dailyUsed = Math.max(0, -todayPnl);
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  const riskPerTrade = (balance * rules.riskPerTradePct) / 100;
  const tradingDays = new Set(
    trades.map((t) => localDayKey(t.tradeDate, tzOffset)),
  ).size;
  const todayKey = localDayKey(now, tzOffset);
  const startKey = rules.startDate.toISOString().slice(0, 10);
  const daysElapsed = Math.max(
    0,
    Math.round((Date.parse(todayKey) - Date.parse(startKey)) / DAY),
  );
  const daysRemaining = Math.max(1, rules.targetDays - daysElapsed);
  const profitRemaining = Math.max(0, profitTarget - profit);
  const requiredPerDay = profitRemaining / daysRemaining;

  const targetReached = profit >= profitTarget;
  const minTradingDaysMet = tradingDays >= rules.minTradingDays;
  const breached = distance <= 0 || (dailyLimit > 0 && dailyUsed >= dailyLimit);

  let health: FundingHealth;
  let message: string;
  if (rules.status === 'FAILED' || breached) {
    health = 'RED';
    message = breached
      ? 'Límite de pérdida alcanzado. No operes esta cuenta.'
      : 'Challenge fallido.';
  } else if (
    rules.status === 'PASSED' ||
    (targetReached && minTradingDaysMet)
  ) {
    health = 'GREEN';
    message = 'Objetivo cumplido. Protege el resultado.';
  } else if (
    usedPct >= 0.75 ||
    (dailyLimit > 0 && dailyUsed / dailyLimit >= 0.75)
  ) {
    health = 'ORANGE';
    message = 'Cerca de un límite de pérdida. Reduce el riesgo.';
  } else if (
    usedPct >= 0.5 ||
    (dailyLimit > 0 && dailyUsed / dailyLimit >= 0.5)
  ) {
    health = 'YELLOW';
    message = 'Has consumido la mitad de un límite. Opera con cuidado.';
  } else if (targetReached) {
    health = 'GREEN';
    message = `Objetivo cumplido. Faltan ${rules.minTradingDays - tradingDays} días mínimos de trading.`;
  } else {
    health = 'GREEN';
    message = 'Dentro de las reglas del challenge.';
  }

  return {
    health,
    message,
    balance: round2(balance),
    profit: round2(profit),
    profitTarget: round2(profitTarget),
    profitRemaining: round2(profitRemaining),
    progressPct:
      profitTarget > 0 ? round4(Math.max(0, profit) / profitTarget) : 0,
    daily: {
      pnl: round2(todayPnl),
      limit: round2(dailyLimit),
      used: round2(dailyUsed),
      remaining: round2(dailyRemaining),
    },
    drawdown: {
      floor: round2(floor),
      distance: round2(distance),
      limit: round2(ddLimit),
      usedPct: round4(usedPct),
    },
    riskPerTrade: round2(riskPerTrade),
    lossesToDailyLimit:
      riskPerTrade > 0 ? Math.floor(round4(dailyRemaining / riskPerTrade)) : 0,
    lossesToMaxDrawdown:
      riskPerTrade > 0
        ? Math.floor(round4(Math.max(0, distance) / riskPerTrade))
        : 0,
    tradingDays,
    minTradingDaysMet,
    daysElapsed,
    daysRemaining,
    requiredPerDay: round2(requiredPerDay),
    requiredRPerDay:
      riskPerTrade > 0 ? round2(requiredPerDay / riskPerTrade) : 0,
    targetReached,
    breached,
  };
}
