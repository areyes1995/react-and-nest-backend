// ──────────────────────────────────────────────
// Calculadoras del Trading Risk Manager.
// Funciones puras: se ejecutan en el navegador mientras
// el usuario escribe. Nada aquí predice el mercado; solo
// traduce las reglas del trader a números.
// ──────────────────────────────────────────────

export const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100

// ─── Activos ───────────────────────────────────

export interface AssetPreset {
  id: string
  label: string
  /** Cómo se mide el stop para este activo. */
  unit: string
  /** Valor en USD de 1 unidad de movimiento por 1 lote/contrato. */
  valuePerUnit: number
  lotStep: number
  note?: string
}

export const ASSET_PRESETS: AssetPreset[] = [
  { id: 'XAUUSD', label: 'XAUUSD (Oro)', unit: 'pips (0.10)', valuePerUnit: 10, lotStep: 0.01, note: '1 lote = 100 oz' },
  { id: 'EURUSD', label: 'Forex USD cotizado (EURUSD, GBPUSD…)', unit: 'pips', valuePerUnit: 10, lotStep: 0.01, note: '1 lote = 100.000 unidades' },
  { id: 'USDJPY', label: 'Forex JPY (USDJPY…)', unit: 'pips', valuePerUnit: 6.5, lotStep: 0.01, note: 'Aproximado: varía con el precio de USDJPY' },
  { id: 'BTCUSD', label: 'BTCUSD', unit: 'USD de precio', valuePerUnit: 1, lotStep: 0.01, note: '1 lote = 1 BTC' },
  { id: 'NAS100', label: 'NASDAQ 100 (CFD)', unit: 'puntos', valuePerUnit: 1, lotStep: 0.1, note: 'Futuros: NQ = $20/pt, MNQ = $2/pt' },
  { id: 'US30', label: 'Dow Jones (CFD)', unit: 'puntos', valuePerUnit: 1, lotStep: 0.1 },
  { id: 'CUSTOM', label: 'Personalizado', unit: 'unidades', valuePerUnit: 1, lotStep: 0.01 },
]

// ─── Gestión de riesgo por operación ───────────

export interface TradeRiskInput {
  capital: number
  riskPct: number
  stop: number
  valuePerUnit: number
  lotStep: number
  rewardRatio: number
}

export interface TradeRiskResult {
  riskAmount: number
  targetAmount: number
  targetDistance: number
  /** Tamaño redondeado HACIA ABAJO al paso de lote: nunca arriesga de más. */
  positionSize: number
  actualRisk: number
  actualRiskPct: number
  lossPerUnitPerLot: number
}

export function tradeRisk(i: TradeRiskInput): TradeRiskResult {
  const riskAmount = (i.capital * i.riskPct) / 100
  const lossPerLot = i.stop * i.valuePerUnit
  const raw = lossPerLot > 0 ? riskAmount / lossPerLot : 0
  const step = i.lotStep > 0 ? i.lotStep : 0.01
  const positionSize = Math.floor(raw / step + 1e-9) * step
  const actualRisk = positionSize * lossPerLot
  return {
    riskAmount: round2(riskAmount),
    targetAmount: round2(riskAmount * i.rewardRatio),
    targetDistance: round2(i.stop * i.rewardRatio),
    positionSize: Number(positionSize.toFixed(4)),
    actualRisk: round2(actualRisk),
    actualRiskPct: i.capital > 0 ? round2((actualRisk / i.capital) * 100) : 0,
    lossPerUnitPerLot: i.valuePerUnit,
  }
}

export interface LimitsInput {
  capital: number
  riskPct: number
  maxTradesPerDay: number
  maxDailyLossPct: number
  maxWeeklyLossPct: number
  maxDrawdownPct: number
}

export interface LimitsResult {
  riskAmount: number
  dailyLoss: number
  weeklyLoss: number
  maxDrawdown: number
  lossesToDaily: number
  lossesToWeekly: number
  lossesToDrawdown: number
  /** Lo que perderías si todas las operaciones del día salen mal. */
  worstDay: number
  /** El máximo de operaciones permite perder más que el límite diario. */
  tradesExceedDaily: boolean
  capitalAfterMaxDrawdown: number
}

export function riskLimits(i: LimitsInput): LimitsResult {
  const risk = (i.capital * i.riskPct) / 100
  const daily = (i.capital * i.maxDailyLossPct) / 100
  const weekly = (i.capital * i.maxWeeklyLossPct) / 100
  const dd = (i.capital * i.maxDrawdownPct) / 100
  const fit = (limit: number) => (risk > 0 ? Math.floor(round2(limit / risk)) : 0)
  const worstDay = risk * i.maxTradesPerDay
  return {
    riskAmount: round2(risk),
    dailyLoss: round2(daily),
    weeklyLoss: round2(weekly),
    maxDrawdown: round2(dd),
    lossesToDaily: fit(daily),
    lossesToWeekly: fit(weekly),
    lossesToDrawdown: fit(dd),
    worstDay: round2(worstDay),
    tradesExceedDaily: worstDay > daily + 0.005,
    capitalAfterMaxDrawdown: round2(i.capital - dd),
  }
}

// ─── Plan de crecimiento ───────────────────────

export interface GrowthInput {
  initial: number
  ratePct: number
  periods: number
  /** % de la ganancia de cada periodo que se reinvierte; el resto se retira. */
  reinvestPct: number
  contribution?: number
  goal?: number
}

export interface GrowthRow {
  period: number
  start: number
  profit: number
  withdrawn: number
  reinvested: number
  contribution: number
  end: number
  totalWithdrawn: number
  totalReinvested: number
  growthPct: number
}

export interface GrowthResult {
  rows: GrowthRow[]
  finalCapital: number
  totalWithdrawn: number
  totalReinvested: number
  totalContributed: number
  goalReachedAt: number | null
}

export function growthProjection(i: GrowthInput): GrowthResult {
  const rows: GrowthRow[] = []
  const periods = Math.max(0, Math.min(600, Math.floor(i.periods)))
  const reinvest = Math.min(100, Math.max(0, i.reinvestPct)) / 100
  const contribution = i.contribution ?? 0
  let capital = i.initial
  let totalWithdrawn = 0
  let totalReinvested = 0
  let goalReachedAt: number | null = i.goal && i.initial >= i.goal ? 0 : null

  for (let p = 1; p <= periods; p++) {
    const start = capital
    const profit = (start * i.ratePct) / 100
    // Una pérdida (tasa negativa) se absorbe completa: no hay nada que retirar.
    const reinvested = profit > 0 ? profit * reinvest : profit
    const withdrawn = profit > 0 ? profit - reinvested : 0
    capital = start + reinvested + contribution
    totalWithdrawn += withdrawn
    totalReinvested += reinvested
    if (goalReachedAt === null && i.goal && capital >= i.goal) goalReachedAt = p
    rows.push({
      period: p,
      start: round2(start),
      profit: round2(profit),
      withdrawn: round2(withdrawn),
      reinvested: round2(reinvested),
      contribution: round2(contribution),
      end: round2(capital),
      totalWithdrawn: round2(totalWithdrawn),
      totalReinvested: round2(totalReinvested),
      growthPct: i.initial > 0 ? round2(((capital - i.initial) / i.initial) * 100) : 0,
    })
  }

  return {
    rows,
    finalCapital: round2(capital),
    totalWithdrawn: round2(totalWithdrawn),
    totalReinvested: round2(totalReinvested),
    totalContributed: round2(contribution * periods),
    goalReachedAt,
  }
}

/** Tasa por periodo necesaria para llegar de `initial` a `goal` en `periods` (100% reinvertido). */
export function requiredRate(initial: number, goal: number, periods: number): number | null {
  if (initial <= 0 || goal <= 0 || periods <= 0) return null
  return round2((Math.pow(goal / initial, 1 / periods) - 1) * 100)
}

// ─── Challenge de fondeo ───────────────────────

export interface ChallengeInput {
  accountSize: number
  profitTargetPct: number
  dailyLossPct: number
  maxDrawdownPct: number
  targetDays: number
  minTradingDays: number
  rewardRatio: number
  tradesPerDay: number
}

export interface WinRateOutcome {
  winRate: number
  expectancyR: number
  tradesNeeded: number | null
  daysNeeded: number | null
  fitsTargetDays: boolean
}

export interface ChallengeScenario {
  id: string
  name: string
  riskPct: number
  riskAmount: number
  targetAmount: number
  rNeeded: number
  rPerDay: number
  /** Operaciones ganadoras seguidas necesarias en el mejor caso. */
  minWinningTrades: number
  lossesToDaily: number
  lossesToDrawdown: number
  maxDailyLossIfAllLose: number
  breachesDailyAtFullLoss: boolean
  outcomes: WinRateOutcome[]
}

export const DEFAULT_SCENARIOS = [
  { id: 'conservative', name: 'Conservador', riskPct: 0.25 },
  { id: 'moderate', name: 'Moderado', riskPct: 0.5 },
  { id: 'aggressive', name: 'Agresivo', riskPct: 1 },
]

export const DEFAULT_WIN_RATES = [0.4, 0.5, 0.6]

export function challengeScenario(
  input: ChallengeInput,
  scenario: { id: string; name: string; riskPct: number },
  winRates: number[] = DEFAULT_WIN_RATES,
): ChallengeScenario {
  const risk = (input.accountSize * scenario.riskPct) / 100
  const target = (input.accountSize * input.profitTargetPct) / 100
  const daily = (input.accountSize * input.dailyLossPct) / 100
  const dd = (input.accountSize * input.maxDrawdownPct) / 100
  const rNeeded = risk > 0 ? target / risk : 0
  const rr = input.rewardRatio
  const perDay = Math.max(1, input.tradesPerDay)

  const outcomes = winRates.map(wr => {
    const e = wr * rr - (1 - wr)
    if (e <= 0) {
      return { winRate: wr, expectancyR: round2(e), tradesNeeded: null, daysNeeded: null, fitsTargetDays: false }
    }
    const trades = Math.ceil(round2(rNeeded / e))
    const days = Math.max(input.minTradingDays, Math.ceil(trades / perDay))
    return {
      winRate: wr,
      expectancyR: round2(e),
      tradesNeeded: trades,
      daysNeeded: days,
      fitsTargetDays: days <= input.targetDays,
    }
  })

  const fullLoss = risk * perDay
  return {
    ...scenario,
    riskAmount: round2(risk),
    targetAmount: round2(target),
    rNeeded: round2(rNeeded),
    rPerDay: input.targetDays > 0 ? round2(rNeeded / input.targetDays) : 0,
    minWinningTrades: rr > 0 ? Math.ceil(round2(rNeeded / rr)) : 0,
    lossesToDaily: risk > 0 ? Math.floor(round2(daily / risk)) : 0,
    lossesToDrawdown: risk > 0 ? Math.floor(round2(dd / risk)) : 0,
    maxDailyLossIfAllLose: round2(fullLoss),
    breachesDailyAtFullLoss: fullLoss >= daily,
    outcomes,
  }
}

// ─── Simulador de resultados ───────────────────

export interface SimulationInput {
  capital: number
  riskPct: number
  rewardRatio: number
  trades: number
  winners: number
}

export interface SimulationResult {
  losers: number
  totalR: number
  riskAmount: number
  result: number
  resultPct: number
  finalCapital: number
}

export function simulateTrades(i: SimulationInput): SimulationResult {
  const winners = Math.max(0, Math.min(i.trades, Math.floor(i.winners)))
  const losers = Math.max(0, Math.floor(i.trades) - winners)
  const totalR = winners * i.rewardRatio - losers
  const risk = (i.capital * i.riskPct) / 100
  const result = totalR * risk
  return {
    losers,
    totalR: round2(totalR),
    riskAmount: round2(risk),
    result: round2(result),
    resultPct: i.capital > 0 ? round2((result / i.capital) * 100) : 0,
    finalCapital: round2(i.capital + result),
  }
}

// ─── Monte Carlo del challenge ─────────────────

/** PRNG determinista (mulberry32) para que la simulación sea reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface MonteCarloInput extends ChallengeInput {
  riskPct: number
  winRate: number
  /** Días de trading simulados; por defecto `targetDays`. */
  horizonDays?: number
  runs?: number
  seed?: number
}

export interface MonteCarloResult {
  passRate: number
  failRate: number
  pendingRate: number
  medianDaysToPass: number | null
}

/**
 * Simula el challenge operación a operación con riesgo fijo sobre el tamaño
 * de la cuenta. Falla al tocar la pérdida diaria o el drawdown máximo; pasa
 * al llegar al objetivo habiendo operado los días mínimos.
 */
export function monteCarloChallenge(i: MonteCarloInput): MonteCarloResult {
  const runs = i.runs ?? 2000
  const rand = mulberry32(i.seed ?? 42)
  const risk = (i.accountSize * i.riskPct) / 100
  const target = (i.accountSize * i.profitTargetPct) / 100
  const daily = (i.accountSize * i.dailyLossPct) / 100
  const dd = (i.accountSize * i.maxDrawdownPct) / 100
  const horizon = Math.max(1, i.horizonDays ?? i.targetDays)
  const perDay = Math.max(1, Math.floor(i.tradesPerDay))
  let pass = 0
  let fail = 0
  const passDays: number[] = []

  for (let r = 0; r < runs; r++) {
    let pnl = 0
    let outcome: 'pass' | 'fail' | null = null
    for (let day = 1; day <= horizon && !outcome; day++) {
      let dayPnl = 0
      for (let t = 0; t < perDay; t++) {
        // No se abre una operación cuyo stop rompería el límite diario.
        if (dayPnl - risk <= -daily) break
        const win = rand() < i.winRate
        const delta = win ? risk * i.rewardRatio : -risk
        dayPnl += delta
        pnl += delta
        if (pnl <= -dd) {
          outcome = 'fail'
          break
        }
        if (pnl >= target && day >= i.minTradingDays) {
          outcome = 'pass'
          passDays.push(day)
          break
        }
      }
    }
    if (outcome === 'pass') pass++
    else if (outcome === 'fail') fail++
  }

  passDays.sort((a, b) => a - b)
  return {
    passRate: round2(pass / runs),
    failRate: round2(fail / runs),
    pendingRate: round2((runs - pass - fail) / runs),
    medianDaysToPass: passDays.length ? passDays[Math.floor(passDays.length / 2)] : null,
  }
}

// ─── Distribución ──────────────────────────────

export interface Bucket {
  key: string
  label: string
  percent: number
}

export function allocate(amount: number, buckets: Bucket[]): (Bucket & { amount: number })[] {
  let assigned = 0
  return buckets.map((b, i) => {
    const value = i === buckets.length - 1 ? round2(amount - assigned) : round2((amount * b.percent) / 100)
    assigned = round2(assigned + value)
    return { ...b, amount: value }
  })
}

export function bucketsTotal(buckets: Bucket[]): number {
  return round2(buckets.reduce((s, b) => s + (Number.isFinite(b.percent) ? b.percent : 0), 0))
}
