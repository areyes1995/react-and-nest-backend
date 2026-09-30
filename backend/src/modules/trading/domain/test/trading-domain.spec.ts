import { evaluateRisk, RiskRules } from '../risk-status';
import { evaluateFunding, FundingRules } from '../funding-status';
import { computeJournalStats, StatTrade } from '../journal-stats';
import {
  allocate,
  validateBuckets,
  DEFAULT_PAYOUT_BUCKETS,
} from '../allocation';
import { startOfLocalDay, startOfLocalWeek, localDayKey } from '../time.util';

const NOW = new Date('2026-09-30T15:00:00.000Z'); // miércoles
const at = (iso: string) => new Date(iso);

const rules: RiskRules = {
  initialCapital: 10_000,
  riskPerTradePct: 0.5,
  maxTradesPerDay: 3,
  maxDailyLossPct: 2,
  maxWeeklyLossPct: 5,
  maxDrawdownPct: 10,
  maxConsecutiveLosses: 2,
  warningThresholdPct: 75,
};

describe('time.util', () => {
  it('usa el día local del trader (UTC-4)', () => {
    const lateNight = at('2026-10-01T02:00:00.000Z'); // 22:00 del 30 en UTC-4
    expect(localDayKey(lateNight, 240)).toBe('2026-09-30');
    expect(startOfLocalDay(lateNight, 240).toISOString()).toBe(
      '2026-09-30T04:00:00.000Z',
    );
  });

  it('la semana empieza el lunes', () => {
    expect(startOfLocalWeek(NOW, 0).toISOString()).toBe(
      '2026-09-28T00:00:00.000Z',
    );
  });
});

describe('evaluateRisk', () => {
  it('sin operaciones → NORMAL con riesgo permitido y límites', () => {
    const s = evaluateRisk(rules, [], NOW);
    expect(s.level).toBe('NORMAL');
    expect(s.canTrade).toBe(true);
    expect(s.riskPerTrade).toBe(50);
    expect(s.today.lossLimit).toBe(200);
    expect(s.today.lossesAffordable).toBe(4);
    expect(s.maxDrawdownAmount).toBe(1000);
  });

  it('dos pérdidas seguidas → PRECAUCIÓN', () => {
    const s = evaluateRisk(
      rules,
      [
        { tradeDate: at('2026-09-29T10:00:00Z'), resultAmount: 100 },
        { tradeDate: at('2026-09-29T12:00:00Z'), resultAmount: -50 },
        { tradeDate: at('2026-09-30T10:00:00Z'), resultAmount: -50 },
      ],
      NOW,
    );
    expect(s.consecutiveLosses).toBe(2);
    expect(s.level).toBe('CAUTION');
  });

  it('cerca del límite diario → RIESGO; límite alcanzado → STOP', () => {
    const risk = evaluateRisk(
      rules,
      [{ tradeDate: at('2026-09-30T10:00:00Z'), resultAmount: -160 }],
      NOW,
    );
    expect(risk.level).toBe('RISK');
    expect(risk.alerts.map((a) => a.code)).toContain('DAILY_LOSS');

    const stop = evaluateRisk(
      rules,
      [{ tradeDate: at('2026-09-30T10:00:00Z'), resultAmount: -200 }],
      NOW,
    );
    expect(stop.level).toBe('STOP');
    expect(stop.canTrade).toBe(false);
    expect(stop.headline).toMatch(/No debes abrir otra operación/);
  });

  it('máximo de operaciones diarias → STOP', () => {
    const trades = [1, 2, 3].map((h) => ({
      tradeDate: at(`2026-09-30T1${h}:00:00Z`),
      resultAmount: 10,
    }));
    const s = evaluateRisk(
      { ...rules, maxTradesPerDay: 3 },
      trades,
      at('2026-09-30T18:00:00Z'),
    );
    expect(s.level).toBe('STOP');
    expect(s.today.tradesRemaining).toBe(0);
  });

  it('a igual fecha desempata por id al contar la racha', () => {
    const same = at('2026-09-30T10:00:00Z');
    const s = evaluateRisk(
      rules,
      [
        { id: 1, tradeDate: same, resultAmount: 100 },
        { id: 2, tradeDate: same, resultAmount: -50 },
        { id: 3, tradeDate: same, resultAmount: -50 },
      ],
      NOW,
    );
    expect(s.consecutiveLosses).toBe(2);
  });

  it('las pérdidas de días anteriores no cuentan para hoy', () => {
    const s = evaluateRisk(
      rules,
      [{ tradeDate: at('2026-09-29T10:00:00Z'), resultAmount: -150 }],
      NOW,
    );
    expect(s.today.lossUsed).toBe(0);
    expect(s.week.lossUsed).toBe(150);
  });
});

describe('evaluateFunding', () => {
  const account: FundingRules = {
    accountSize: 100_000,
    profitTargetPct: 8,
    dailyLossPct: 5,
    maxDrawdownPct: 10,
    drawdownType: 'STATIC',
    minTradingDays: 5,
    targetDays: 10,
    riskPerTradePct: 0.5,
    rewardRatio: 2,
    startDate: at('2026-09-28T00:00:00Z'),
    status: 'ACTIVE',
  };

  it('calcula objetivo, límites y ritmo necesario', () => {
    const s = evaluateFunding(
      account,
      [{ tradeDate: at('2026-09-29T10:00:00Z'), resultAmount: 1000 }],
      NOW,
    );
    expect(s.profitTarget).toBe(8000);
    expect(s.profitRemaining).toBe(7000);
    expect(s.drawdown.floor).toBe(90_000);
    expect(s.daily.limit).toBe(5000);
    expect(s.daysElapsed).toBe(2);
    expect(s.daysRemaining).toBe(8);
    expect(s.requiredPerDay).toBe(875);
    expect(s.riskPerTrade).toBe(505);
    expect(s.health).toBe('GREEN');
  });

  it('la fecha de inicio es de calendario: no suma un día en UTC-4', () => {
    const lateLocal = at('2026-10-01T01:00:00Z'); // 21:00 del 30 en UTC-4
    const s = evaluateFunding(
      { ...account, startDate: at('2026-09-30T00:00:00Z') },
      [],
      lateLocal,
      240,
    );
    expect(s.daysElapsed).toBe(0);
    expect(s.daysRemaining).toBe(10);
  });

  it('drawdown trailing sube el piso con el pico', () => {
    const s = evaluateFunding(
      { ...account, drawdownType: 'TRAILING' },
      [
        { tradeDate: at('2026-09-28T10:00:00Z'), resultAmount: 4000 },
        { tradeDate: at('2026-09-29T10:00:00Z'), resultAmount: -3000 },
      ],
      NOW,
    );
    expect(s.drawdown.floor).toBe(94_000);
    expect(s.drawdown.distance).toBe(7000);
  });

  it('pérdida diaria agotada → RED y breached', () => {
    const s = evaluateFunding(
      account,
      [{ tradeDate: at('2026-09-30T10:00:00Z'), resultAmount: -5000 }],
      NOW,
    );
    expect(s.breached).toBe(true);
    expect(s.health).toBe('RED');
  });
});

describe('computeJournalStats', () => {
  const base: Omit<StatTrade, 'tradeDate' | 'resultAmount' | 'resultR'> = {
    direction: 'LONG',
    session: 'LONDON',
    setup: 'Breakout',
    emotion: null,
    riskPct: 0.5,
    followedPlan: true,
    impulsive: false,
    movedStopLoss: false,
    closedEarly: false,
  };
  const t = (
    day: number,
    r: number,
    extra: Partial<StatTrade> = {},
  ): StatTrade => ({
    ...base,
    tradeDate: at(`2026-09-${String(day).padStart(2, '0')}T10:00:00Z`),
    resultAmount: r * 50,
    resultR: r,
    ...extra,
  });

  it('win rate, profit factor, expectancy y drawdown', () => {
    const s = computeJournalStats(
      [t(1, 2), t(2, -1), t(3, 2), t(4, -1), t(5, 2)],
      10_000,
    );
    expect(s.total).toBe(5);
    expect(s.winRate).toBe(0.6);
    expect(s.net).toBe(200);
    expect(s.profitFactor).toBe(3);
    expect(s.expectancyR).toBe(0.8);
    expect(s.maxDrawdown).toBe(50);
    expect(s.bestDay?.pnl).toBe(100);
    expect(s.worstDay?.pnl).toBe(-50);
  });

  it('genera hallazgos por dirección y disciplina', () => {
    const trades = [
      t(1, 2),
      t(2, 1),
      t(3, -1),
      t(4, -1, { direction: 'SHORT', followedPlan: false }),
      t(5, -1, { direction: 'SHORT', followedPlan: false }),
      t(6, 1, { direction: 'SHORT', followedPlan: false }),
    ];
    const s = computeJournalStats(trades, 10_000);
    expect(s.insights).toContain(
      'Tus longs tienen +0.67R de expectancy (3 operaciones).',
    );
    expect(
      s.insights.some((i) =>
        i.startsWith('Cuando sigues tu estrategia: +0.67R'),
      ),
    ).toBe(true);
  });

  it('sin operaciones no revienta', () => {
    const s = computeJournalStats([], 1000);
    expect(s.total).toBe(0);
    expect(s.profitFactor).toBeNull();
    expect(s.bestDay).toBeNull();
  });
});

describe('allocation', () => {
  it('reparte el payout y cuadra al centavo', () => {
    const out = allocate(2000, DEFAULT_PAYOUT_BUCKETS);
    expect(out.map((b) => b.amount)).toEqual([600, 600, 400, 200, 200]);
    const odd = allocate(100, [
      { key: 'a', label: 'A', percent: 33.33 },
      { key: 'b', label: 'B', percent: 33.33 },
      { key: 'c', label: 'C', percent: 33.34 },
    ]);
    expect(odd.reduce((s, b) => s + b.amount, 0)).toBeCloseTo(100, 10);
  });

  it('valida que sumen 100 y no se repitan', () => {
    expect(validateBuckets(DEFAULT_PAYOUT_BUCKETS)).toBeNull();
    expect(validateBuckets([{ key: 'a', label: 'A', percent: 90 }])).toMatch(
      /100%/,
    );
    expect(
      validateBuckets([
        { key: 'a', label: 'A', percent: 50 },
        { key: 'a', label: 'B', percent: 50 },
      ]),
    ).toMatch(/repetirse/);
  });
});
