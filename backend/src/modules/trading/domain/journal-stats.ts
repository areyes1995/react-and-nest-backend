// ──────────────────────────────────────────────
// Estadísticas del diario del trader y hallazgos en
// lenguaje natural ("Tus longs tienen +0.42R de expectancy").
// ──────────────────────────────────────────────

import { buildEquity, chronological } from './equity';
import { localDayKey, round2, round4, sum } from './time.util';

export interface StatTrade {
  id?: number;
  tradeDate: Date;
  direction: 'LONG' | 'SHORT';
  session: string | null;
  setup: string | null;
  emotion: string | null;
  resultAmount: number;
  resultR: number | null;
  riskPct: number | null;
  followedPlan: boolean;
  impulsive: boolean;
  movedStopLoss: boolean;
  closedEarly: boolean;
}

export interface GroupStat {
  key: string;
  count: number;
  winRate: number;
  net: number;
  expectancyR: number | null;
}

export interface JournalStats {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  lossRate: number;
  grossProfit: number;
  grossLoss: number;
  net: number;
  profitFactor: number | null;
  expectancy: number;
  expectancyR: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  maxConsecutiveLosses: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  equityCurve: { date: string; equity: number }[];
  daily: { date: string; pnl: number }[];
  byDirection: GroupStat[];
  bySession: GroupStat[];
  bySetup: GroupStat[];
  byEmotion: GroupStat[];
  discipline: {
    followedPlan: GroupStat[];
    impulsive: GroupStat[];
    movedStopLoss: GroupStat[];
    closedEarly: GroupStat[];
  };
  byRisk: (GroupStat & { maxDrawdownPct: number })[];
  mostUsedSetup: string | null;
  bestSession: string | null;
  insights: string[];
}

/** Umbral de riesgo por operación que separa los grupos de `byRisk`. */
export const HIGH_RISK_PCT = 1;
const MIN_SAMPLE = 3;

function avg(values: number[]): number | null {
  return values.length ? sum(values) / values.length : null;
}

function rOf(t: StatTrade): number | null {
  return t.resultR ?? null;
}

function groupStat(key: string, trades: StatTrade[]): GroupStat {
  const rs = trades.map(rOf).filter((r): r is number => r !== null);
  const e = avg(rs);
  return {
    key,
    count: trades.length,
    winRate: trades.length
      ? round4(trades.filter((t) => t.resultAmount > 0).length / trades.length)
      : 0,
    net: round2(sum(trades.map((t) => t.resultAmount))),
    expectancyR: e === null ? null : round2(e),
  };
}

function groupBy(
  trades: StatTrade[],
  keyOf: (t: StatTrade) => string | null,
): GroupStat[] {
  const map = new Map<string, StatTrade[]>();
  for (const t of trades) {
    const k = keyOf(t);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return [...map.entries()]
    .map(([k, list]) => groupStat(k, list))
    .sort((a, b) => b.count - a.count);
}

function boolGroups(
  trades: StatTrade[],
  pick: (t: StatTrade) => boolean,
): GroupStat[] {
  return groupBy(trades, (t) => (pick(t) ? 'YES' : 'NO'));
}

function fmtR(r: number): string {
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
}

const DIRECTION_LABEL: Record<string, string> = {
  LONG: 'longs',
  SHORT: 'shorts',
};
const SESSION_LABEL: Record<string, string> = {
  ASIA: 'Asia',
  LONDON: 'Londres',
  NEW_YORK: 'Nueva York',
  OVERLAP: 'solapamiento Londres/NY',
  OTHER: 'otras sesiones',
};

function buildInsights(s: Omit<JournalStats, 'insights'>): string[] {
  const out: string[] = [];
  const sampled = (g: GroupStat) =>
    g.count >= MIN_SAMPLE && g.expectancyR !== null;

  for (const g of s.byDirection.filter(sampled)) {
    out.push(
      `Tus ${DIRECTION_LABEL[g.key] ?? g.key} tienen ${fmtR(g.expectancyR!)} de expectancy (${g.count} operaciones).`,
    );
  }

  const sessions = s.bySession.filter(sampled);
  if (sessions.length > 1) {
    const best = [...sessions].sort(
      (a, b) => b.expectancyR! - a.expectancyR!,
    )[0];
    out.push(
      `Tu sesión más rentable es ${SESSION_LABEL[best.key] ?? best.key} con ${fmtR(best.expectancyR!)} por operación.`,
    );
  }

  const setups = s.bySetup.filter(sampled);
  if (setups.length) {
    const worst = [...setups].sort(
      (a, b) => a.expectancyR! - b.expectancyR!,
    )[0];
    if (worst.expectancyR! < 0) {
      out.push(
        `El setup "${worst.key}" tiene expectancy negativa (${fmtR(worst.expectancyR!)}). Revísalo o deja de operarlo.`,
      );
    }
  }

  const plan = new Map(s.discipline.followedPlan.map((g) => [g.key, g]));
  const yes = plan.get('YES');
  const no = plan.get('NO');
  if (yes && no && sampled(yes) && sampled(no)) {
    out.push(
      `Cuando sigues tu estrategia: ${fmtR(yes.expectancyR!)} por operación. Cuando no: ${fmtR(no.expectancyR!)}.`,
    );
  }

  const impulsive = s.discipline.impulsive.find((g) => g.key === 'YES');
  if (impulsive && sampled(impulsive) && impulsive.expectancyR! < 0) {
    out.push(
      `Tus entradas por impulso te cuestan ${fmtR(impulsive.expectancyR!)} por operación.`,
    );
  }

  const moved = s.discipline.movedStopLoss.find((g) => g.key === 'YES');
  if (moved && sampled(moved) && moved.expectancyR! < 0) {
    out.push(
      `Mover el stop loss te deja en ${fmtR(moved.expectancyR!)} de media.`,
    );
  }

  const high = s.byRisk.find((g) => g.key === 'HIGH');
  const low = s.byRisk.find((g) => g.key === 'LOW');
  if (high && low && high.count >= MIN_SAMPLE && low.count >= MIN_SAMPLE) {
    if (
      high.maxDrawdownPct > low.maxDrawdownPct * 1.5 &&
      high.maxDrawdownPct > 0
    ) {
      out.push(
        `Cuando arriesgas más de ${HIGH_RISK_PCT}%, tu drawdown aumenta considerablemente ` +
          `(${(high.maxDrawdownPct * 100).toFixed(1)}% vs ${(low.maxDrawdownPct * 100).toFixed(1)}%).`,
      );
    }
  }

  if (s.maxConsecutiveLosses >= 4) {
    out.push(
      `Tu peor racha fue de ${s.maxConsecutiveLosses} pérdidas seguidas. Tu plan debe soportar al menos esa racha.`,
    );
  }

  return out;
}

export function computeJournalStats(
  trades: StatTrade[],
  startingCapital: number,
  tzOffset = 0,
): JournalStats {
  const ordered = [...trades].sort(chronological);
  const wins = ordered.filter((t) => t.resultAmount > 0);
  const losses = ordered.filter((t) => t.resultAmount < 0);
  const grossProfit = sum(wins.map((t) => t.resultAmount));
  const grossLoss = sum(losses.map((t) => t.resultAmount));
  const net = grossProfit + grossLoss;
  const total = ordered.length;
  const rs = ordered.map(rOf).filter((r): r is number => r !== null);

  const equity = buildEquity(startingCapital, ordered);

  let streak = 0;
  let maxStreak = 0;
  for (const t of ordered) {
    streak = t.resultAmount < 0 ? streak + 1 : 0;
    maxStreak = Math.max(maxStreak, streak);
  }

  const dayMap = new Map<string, number>();
  for (const t of ordered) {
    const k = localDayKey(t.tradeDate, tzOffset);
    dayMap.set(k, (dayMap.get(k) ?? 0) + t.resultAmount);
  }
  const daily = [...dayMap.entries()].map(([date, pnl]) => ({
    date,
    pnl: round2(pnl),
  }));
  const byPnl = [...daily].sort((a, b) => b.pnl - a.pnl);

  const riskGroup = (key: 'LOW' | 'HIGH', list: StatTrade[]) => ({
    ...groupStat(key, list),
    // Drawdown del subconjunto sobre el mismo capital de partida.
    maxDrawdownPct: buildEquity(startingCapital, list).maxDrawdownPct,
  });
  const withRisk = ordered.filter((t) => t.riskPct !== null);
  const byRisk = [
    riskGroup(
      'LOW',
      withRisk.filter((t) => t.riskPct! <= HIGH_RISK_PCT),
    ),
    riskGroup(
      'HIGH',
      withRisk.filter((t) => t.riskPct! > HIGH_RISK_PCT),
    ),
  ].filter((g) => g.count > 0);

  const bySession = groupBy(ordered, (t) => t.session);
  const bySetup = groupBy(ordered, (t) => t.setup?.trim() || null);
  const profitableSessions = bySession.filter((g) => g.count >= MIN_SAMPLE);

  const base: Omit<JournalStats, 'insights'> = {
    total,
    wins: wins.length,
    losses: losses.length,
    breakeven: total - wins.length - losses.length,
    winRate: total ? round4(wins.length / total) : 0,
    lossRate: total ? round4(losses.length / total) : 0,
    grossProfit: round2(grossProfit),
    grossLoss: round2(grossLoss),
    net: round2(net),
    profitFactor:
      grossLoss < 0 ? round2(grossProfit / Math.abs(grossLoss)) : null,
    expectancy: total ? round2(net / total) : 0,
    expectancyR: rs.length ? round2(sum(rs) / rs.length) : null,
    avgWinR: avg(wins.map(rOf).filter((r): r is number => r !== null)),
    avgLossR: avg(losses.map(rOf).filter((r): r is number => r !== null)),
    avgWin: wins.length ? round2(grossProfit / wins.length) : 0,
    avgLoss: losses.length ? round2(grossLoss / losses.length) : 0,
    maxDrawdown: equity.maxDrawdown,
    maxDrawdownPct: equity.maxDrawdownPct,
    maxConsecutiveLosses: maxStreak,
    bestDay: byPnl[0] ?? null,
    // Con un solo día, "peor día" repetiría el mejor.
    worstDay: byPnl.length > 1 ? byPnl[byPnl.length - 1] : null,
    equityCurve: ordered.length
      ? [
          {
            date: ordered[0].tradeDate.toISOString(),
            equity: round2(startingCapital),
          },
          ...equity.curve,
        ]
      : [],
    daily,
    byDirection: groupBy(ordered, (t) => t.direction),
    bySession,
    bySetup,
    byEmotion: groupBy(ordered, (t) => t.emotion),
    discipline: {
      followedPlan: boolGroups(ordered, (t) => t.followedPlan),
      impulsive: boolGroups(ordered, (t) => t.impulsive),
      movedStopLoss: boolGroups(ordered, (t) => t.movedStopLoss),
      closedEarly: boolGroups(ordered, (t) => t.closedEarly),
    },
    byRisk,
    mostUsedSetup: bySetup[0]?.key ?? null,
    bestSession: profitableSessions.length
      ? [...profitableSessions].sort((a, b) => b.net - a.net)[0].key
      : null,
  };

  if (base.avgWinR !== null) base.avgWinR = round2(base.avgWinR);
  if (base.avgLossR !== null) base.avgLossR = round2(base.avgLossR);

  return { ...base, insights: buildInsights(base) };
}
