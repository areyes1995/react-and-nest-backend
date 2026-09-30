// ──────────────────────────────────────────────
// Sistema de alertas: evalúa las reglas que el propio
// trader configuró contra lo que ya ocurrió. No predice
// el mercado; solo protege el plan.
// ──────────────────────────────────────────────

import { buildEquity, ResultPoint, trailingLosses } from './equity';
import {
  round2,
  round4,
  startOfLocalDay,
  startOfLocalWeek,
  sum,
} from './time.util';

export type AlertLevel = 'NORMAL' | 'CAUTION' | 'RISK' | 'STOP';

const LEVEL_WEIGHT: Record<AlertLevel, number> = {
  NORMAL: 0,
  CAUTION: 1,
  RISK: 2,
  STOP: 3,
};

export interface RiskRules {
  initialCapital: number;
  riskPerTradePct: number;
  maxTradesPerDay: number;
  maxDailyLossPct: number;
  maxWeeklyLossPct: number;
  maxDrawdownPct: number;
  maxConsecutiveLosses: number;
  warningThresholdPct: number;
}

export interface RiskAlert {
  level: AlertLevel;
  code: string;
  message: string;
}

export interface RiskStatus {
  level: AlertLevel;
  headline: string;
  canTrade: boolean;
  alerts: RiskAlert[];
  capital: number;
  peakCapital: number;
  riskPerTrade: number;
  drawdown: number;
  drawdownPct: number;
  maxDrawdownAmount: number;
  today: {
    pnl: number;
    trades: number;
    lossLimit: number;
    lossUsed: number;
    lossRemaining: number;
    tradesRemaining: number;
    /** Stops completos que caben antes de tocar el límite diario. */
    lossesAffordable: number;
  };
  week: {
    pnl: number;
    lossLimit: number;
    lossUsed: number;
    lossRemaining: number;
  };
  consecutiveLosses: number;
}

const HEADLINES: Record<AlertLevel, string> = {
  NORMAL: 'Estás dentro de tu riesgo establecido.',
  CAUTION: 'Precaución. Revisa tu estado antes de la siguiente operación.',
  RISK: 'Riesgo alto. Estás cerca de uno de tus límites.',
  STOP: 'No debes abrir otra operación según tu plan.',
};

export function maxLevel(levels: AlertLevel[]): AlertLevel {
  return levels.reduce<AlertLevel>(
    (acc, l) => (LEVEL_WEIGHT[l] > LEVEL_WEIGHT[acc] ? l : acc),
    'NORMAL',
  );
}

export function evaluateRisk(
  rules: RiskRules,
  trades: ResultPoint[],
  now: Date = new Date(),
  tzOffset = 0,
): RiskStatus {
  const equity = buildEquity(rules.initialCapital, trades);
  const dayStart = startOfLocalDay(now, tzOffset);
  const weekStart = startOfLocalWeek(now, tzOffset);

  const todayTrades = trades.filter((t) => t.tradeDate >= dayStart);
  const weekTrades = trades.filter((t) => t.tradeDate >= weekStart);
  const todayPnl = sum(todayTrades.map((t) => t.resultAmount));
  const weekPnl = sum(weekTrades.map((t) => t.resultAmount));

  // Los límites se calculan sobre el saldo al inicio del periodo,
  // como hacen la mayoría de las empresas de fondeo.
  const dayStartCapital = equity.current - todayPnl;
  const weekStartCapital = equity.current - weekPnl;
  const dailyLimit = (dayStartCapital * rules.maxDailyLossPct) / 100;
  const weeklyLimit = (weekStartCapital * rules.maxWeeklyLossPct) / 100;
  const riskPerTrade = (equity.current * rules.riskPerTradePct) / 100;

  const dailyUsed = Math.max(0, -todayPnl);
  const weeklyUsed = Math.max(0, -weekPnl);
  const ddLimitPct = rules.maxDrawdownPct / 100;
  const consecutive = trailingLosses(trades);
  const warn = rules.warningThresholdPct / 100;

  const alerts: RiskAlert[] = [];
  const ratioCheck = (
    used: number,
    limit: number,
    code: string,
    label: string,
  ) => {
    if (limit <= 0) return;
    const ratio = used / limit;
    if (ratio >= 1) {
      alerts.push({
        level: 'STOP',
        code,
        message: `Has alcanzado tu ${label}.`,
      });
    } else if (ratio >= warn) {
      alerts.push({
        level: 'RISK',
        code,
        message: `Has consumido el ${Math.round(ratio * 100)}% de tu ${label}.`,
      });
    }
  };

  ratioCheck(dailyUsed, dailyLimit, 'DAILY_LOSS', 'pérdida máxima diaria');
  ratioCheck(weeklyUsed, weeklyLimit, 'WEEKLY_LOSS', 'pérdida máxima semanal');
  ratioCheck(
    equity.drawdownPct,
    ddLimitPct,
    'MAX_DRAWDOWN',
    'drawdown máximo permitido',
  );

  if (
    rules.maxTradesPerDay > 0 &&
    todayTrades.length >= rules.maxTradesPerDay
  ) {
    alerts.push({
      level: 'STOP',
      code: 'MAX_TRADES',
      message: `Ya hiciste ${todayTrades.length} de ${rules.maxTradesPerDay} operaciones permitidas hoy.`,
    });
  }

  if (
    rules.maxConsecutiveLosses > 0 &&
    consecutive >= rules.maxConsecutiveLosses
  ) {
    alerts.push({
      level: 'CAUTION',
      code: 'CONSECUTIVE_LOSSES',
      message: `Llevas ${consecutive} operaciones perdedoras consecutivas.`,
    });
  }

  const level = maxLevel(alerts.map((a) => a.level));
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  return {
    level,
    headline: HEADLINES[level],
    canTrade: level !== 'STOP',
    alerts,
    capital: equity.current,
    peakCapital: equity.peak,
    riskPerTrade: round2(riskPerTrade),
    drawdown: equity.drawdown,
    drawdownPct: equity.drawdownPct,
    maxDrawdownAmount: round2(equity.peak * ddLimitPct),
    today: {
      pnl: round2(todayPnl),
      trades: todayTrades.length,
      lossLimit: round2(dailyLimit),
      lossUsed: round2(dailyUsed),
      lossRemaining: round2(dailyRemaining),
      tradesRemaining: Math.max(0, rules.maxTradesPerDay - todayTrades.length),
      lossesAffordable:
        riskPerTrade > 0
          ? Math.floor(round4(dailyRemaining / riskPerTrade))
          : 0,
    },
    week: {
      pnl: round2(weekPnl),
      lossLimit: round2(weeklyLimit),
      lossUsed: round2(weeklyUsed),
      lossRemaining: round2(Math.max(0, weeklyLimit - weeklyUsed)),
    },
    consecutiveLosses: consecutive,
  };
}
