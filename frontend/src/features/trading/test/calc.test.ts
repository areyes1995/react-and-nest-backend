import { describe, expect, it } from 'vitest'
import {
  allocate,
  challengeScenario,
  growthProjection,
  monteCarloChallenge,
  requiredRate,
  riskLimits,
  simulateTrades,
  tradeRisk,
} from '../calc'

describe('tradeRisk', () => {
  it('cuenta $10,000, 0.5%, 1:2 → riesgo $50, objetivo $100', () => {
    const r = tradeRisk({ capital: 10_000, riskPct: 0.5, stop: 50, valuePerUnit: 10, lotStep: 0.01, rewardRatio: 2 })
    expect(r.riskAmount).toBe(50)
    expect(r.targetAmount).toBe(100)
    expect(r.positionSize).toBe(0.1)
    expect(r.actualRisk).toBe(50)
    expect(r.targetDistance).toBe(100)
  })

  it('redondea el lote hacia abajo: nunca arriesga de más', () => {
    const r = tradeRisk({ capital: 10_000, riskPct: 0.5, stop: 33, valuePerUnit: 10, lotStep: 0.01, rewardRatio: 2 })
    expect(r.positionSize).toBe(0.15)
    expect(r.actualRisk).toBeLessThanOrEqual(50)
  })
})

describe('riskLimits', () => {
  it('cuántos stops caben en cada límite', () => {
    const l = riskLimits({ capital: 10_000, riskPct: 0.5, maxTradesPerDay: 3, maxDailyLossPct: 2, maxWeeklyLossPct: 5, maxDrawdownPct: 10 })
    expect(l.dailyLoss).toBe(200)
    expect(l.lossesToDaily).toBe(4)
    expect(l.lossesToDrawdown).toBe(20)
    expect(l.tradesExceedDaily).toBe(false)
  })

  it('avisa si el máximo de operaciones supera la pérdida diaria', () => {
    const l = riskLimits({ capital: 10_000, riskPct: 1, maxTradesPerDay: 5, maxDailyLossPct: 2, maxWeeklyLossPct: 5, maxDrawdownPct: 10 })
    expect(l.tradesExceedDaily).toBe(true)
  })
})

describe('growthProjection', () => {
  it('$2,000 al 5% mensual reinvirtiendo todo', () => {
    const g = growthProjection({ initial: 2000, ratePct: 5, periods: 3, reinvestPct: 100 })
    expect(g.rows.map(r => r.end)).toEqual([2100, 2205, 2315.25])
  })

  it('separa retirado y reinvertido', () => {
    const g = growthProjection({ initial: 1000, ratePct: 10, periods: 1, reinvestPct: 60 })
    expect(g.rows[0].reinvested).toBe(60)
    expect(g.rows[0].withdrawn).toBe(40)
    expect(g.finalCapital).toBe(1060)
  })

  it('detecta cuándo se alcanza el objetivo', () => {
    const g = growthProjection({ initial: 2000, ratePct: 5, periods: 60, reinvestPct: 100, goal: 10_000 })
    expect(g.goalReachedAt).toBe(33)
    expect(requiredRate(2000, 10_000, 33)).toBeCloseTo(4.99, 1)
  })
})

describe('challengeScenario', () => {
  const input = {
    accountSize: 100_000,
    profitTargetPct: 8,
    dailyLossPct: 5,
    maxDrawdownPct: 10,
    targetDays: 10,
    minTradingDays: 5,
    rewardRatio: 2,
    tradesPerDay: 2,
  }

  it('escenario moderado 0.5%', () => {
    const s = challengeScenario(input, { id: 'm', name: 'Moderado', riskPct: 0.5 })
    expect(s.riskAmount).toBe(500)
    expect(s.targetAmount).toBe(8000)
    expect(s.rNeeded).toBe(16)
    expect(s.minWinningTrades).toBe(8)
    expect(s.lossesToDaily).toBe(10)
    expect(s.lossesToDrawdown).toBe(20)
    const at50 = s.outcomes.find(o => o.winRate === 0.5)!
    expect(at50.expectancyR).toBe(0.5)
    expect(at50.tradesNeeded).toBe(32)
    expect(at50.daysNeeded).toBe(16)
    expect(at50.fitsTargetDays).toBe(false)
  })

  it('expectancy negativa → nunca llega', () => {
    const s = challengeScenario({ ...input, rewardRatio: 1 }, { id: 'c', name: 'C', riskPct: 0.25 }, [0.4])
    expect(s.outcomes[0].tradesNeeded).toBeNull()
  })
})

describe('simulateTrades', () => {
  it('5 trades, 3 ganadores a 1:2 → +4R', () => {
    const s = simulateTrades({ capital: 50_000, riskPct: 0.5, rewardRatio: 2, trades: 5, winners: 3 })
    expect(s.totalR).toBe(4)
    expect(s.riskAmount).toBe(250)
    expect(s.result).toBe(1000)
  })
})

describe('monteCarloChallenge', () => {
  it('es reproducible y las tasas suman 1', () => {
    const input = {
      accountSize: 100_000, profitTargetPct: 8, dailyLossPct: 5, maxDrawdownPct: 10,
      targetDays: 30, minTradingDays: 4, rewardRatio: 2, tradesPerDay: 2,
      riskPct: 1, winRate: 0.5, runs: 500,
    }
    const a = monteCarloChallenge(input)
    const b = monteCarloChallenge(input)
    expect(a).toEqual(b)
    expect(a.passRate + a.failRate + a.pendingRate).toBeCloseTo(1, 1)
    expect(a.passRate).toBeGreaterThan(0.5)
  })
})

describe('allocate', () => {
  it('payout de $2,000', () => {
    const out = allocate(2000, [
      { key: 'g', label: 'Gastos', percent: 30 },
      { key: 's', label: 'Ahorro', percent: 30 },
      { key: 'r', label: 'Reinversión', percent: 20 },
      { key: 't', label: 'Trading', percent: 10 },
      { key: 'e', label: 'Emergencia', percent: 10 },
    ])
    expect(out.map(b => b.amount)).toEqual([600, 600, 400, 200, 200])
  })
})
