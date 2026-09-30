// ──────────────────────────────────────────────
// Trading Risk Manager API — Cliente HTTP
// Endpoints bajo /trading: perfil de riesgo, alertas,
// diario, cuentas de fondeo, ingresos y payouts.
// ──────────────────────────────────────────────

import { del, get, post, put, type ApiResponse } from './api'
import type { Bucket } from '@features/trading/calc'

export type AlertLevel = 'NORMAL' | 'CAUTION' | 'RISK' | 'STOP'
export type FundingHealth = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
export type TradeDirection = 'LONG' | 'SHORT'
export type TradingSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OTHER'
export type TradeEmotion = 'CALM' | 'CONFIDENT' | 'ANXIOUS' | 'FEARFUL' | 'GREEDY' | 'FRUSTRATED' | 'EUPHORIC' | 'BORED'
export type FundingPhase = 'CHALLENGE' | 'VERIFICATION' | 'FUNDED'
export type FundingStatus = 'ACTIVE' | 'PASSED' | 'FAILED' | 'PAUSED'
export type DrawdownType = 'STATIC' | 'TRAILING'
export type IncomeSource = 'TRADING' | 'FUNDING' | 'SALARY' | 'BUSINESS' | 'OTHER'
export type DistributionKind = 'INCOME' | 'PAYOUT'

export interface TradingProfile {
  id: number
  baseCurrency: string
  initialCapital: number
  riskPerTradePct: number
  defaultRewardRatio: number
  maxTradesPerDay: number
  maxDailyLossPct: number
  maxWeeklyLossPct: number
  maxDrawdownPct: number
  maxConsecutiveLosses: number
  warningThresholdPct: number
}

export interface RiskAlert {
  level: AlertLevel
  code: string
  message: string
}

export interface RiskStatus {
  level: AlertLevel
  headline: string
  canTrade: boolean
  alerts: RiskAlert[]
  capital: number
  peakCapital: number
  riskPerTrade: number
  drawdown: number
  drawdownPct: number
  maxDrawdownAmount: number
  today: {
    pnl: number
    trades: number
    lossLimit: number
    lossUsed: number
    lossRemaining: number
    tradesRemaining: number
    lossesAffordable: number
  }
  week: { pnl: number; lossLimit: number; lossUsed: number; lossRemaining: number }
  consecutiveLosses: number
}

export interface Trade {
  id: number
  fundingAccountId: number | null
  fundingAccount?: { id: number; firmName: string; label: string | null } | null
  asset: string
  direction: TradeDirection
  tradeDate: string
  session: TradingSession | null
  setup: string | null
  entryPrice: number | null
  stopLoss: number | null
  takeProfit: number | null
  positionSize: number | null
  riskPct: number | null
  riskAmount: number | null
  resultAmount: number
  resultR: number | null
  screenshotUrl: string | null
  followedPlan: boolean
  impulsive: boolean
  movedStopLoss: boolean
  closedEarly: boolean
  emotion: TradeEmotion | null
  comment: string | null
}

export type TradeInput = Omit<Trade, 'id' | 'fundingAccount'>

export interface GroupStat {
  key: string
  count: number
  winRate: number
  net: number
  expectancyR: number | null
}

export interface JournalStats {
  total: number
  wins: number
  losses: number
  breakeven: number
  winRate: number
  lossRate: number
  grossProfit: number
  grossLoss: number
  net: number
  profitFactor: number | null
  expectancy: number
  expectancyR: number | null
  avgWinR: number | null
  avgLossR: number | null
  avgWin: number
  avgLoss: number
  maxDrawdown: number
  maxDrawdownPct: number
  maxConsecutiveLosses: number
  bestDay: { date: string; pnl: number } | null
  worstDay: { date: string; pnl: number } | null
  equityCurve: { date: string; equity: number }[]
  daily: { date: string; pnl: number }[]
  byDirection: GroupStat[]
  bySession: GroupStat[]
  bySetup: GroupStat[]
  byEmotion: GroupStat[]
  discipline: {
    followedPlan: GroupStat[]
    impulsive: GroupStat[]
    movedStopLoss: GroupStat[]
    closedEarly: GroupStat[]
  }
  byRisk: (GroupStat & { maxDrawdownPct: number })[]
  mostUsedSetup: string | null
  bestSession: string | null
  insights: string[]
}

export interface FundingSummary {
  health: FundingHealth
  message: string
  balance: number
  profit: number
  profitTarget: number
  profitRemaining: number
  progressPct: number
  daily: { pnl: number; limit: number; used: number; remaining: number }
  drawdown: { floor: number; distance: number; limit: number; usedPct: number }
  riskPerTrade: number
  lossesToDailyLimit: number
  lossesToMaxDrawdown: number
  tradingDays: number
  minTradingDaysMet: boolean
  daysElapsed: number
  daysRemaining: number
  requiredPerDay: number
  requiredRPerDay: number
  targetReached: boolean
  breached: boolean
}

export interface FundingAccount {
  id: number
  firmName: string
  label: string | null
  accountSize: number
  phase: FundingPhase
  status: FundingStatus
  profitTargetPct: number
  dailyLossPct: number
  maxDrawdownPct: number
  drawdownType: DrawdownType
  minTradingDays: number
  targetDays: number
  riskPerTradePct: number
  rewardRatio: number
  startDate: string
  notes: string | null
  summary: FundingSummary
}

export type FundingAccountInput = Omit<FundingAccount, 'id' | 'summary'>

export interface IncomeEntry {
  id: number
  source: IncomeSource
  amount: number
  period: string
  note: string | null
}

export interface AllocatedBucket extends Bucket {
  amount: number
}

export interface FinanceSummary {
  month: string
  total: number
  bySource: { source: IncomeSource; amount: number }[]
  incomes: IncomeEntry[]
  distribution: AllocatedBucket[]
  history: { month: string; total: number }[]
}

export interface Payout {
  id: number
  amount: number
  receivedAt: string
  note: string | null
  fundingAccountId: number | null
  fundingAccount?: { id: number; firmName: string; label: string | null } | null
  allocation: AllocatedBucket[]
}

export interface PayoutList {
  items: Payout[]
  total: number
  byBucket: { key: string; label: string; amount: number }[]
}

export interface Paged<T> {
  items: T[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TradingDashboard {
  profile: TradingProfile
  risk: RiskStatus
  fundingAccounts: FundingAccount[]
  finance: { month: string; total: number }
  payouts: { total: number; count: number }
  recentTrades: Trade[]
  stats: Pick<JournalStats, 'total' | 'winRate' | 'expectancyR' | 'profitFactor' | 'net'>
}

/** Cuenta del diario: 'personal', 'all' o el id de una cuenta de fondeo. */
export type AccountScope = 'personal' | 'all' | `${number}`

const tzOffset = () => new Date().getTimezoneOffset()

function unwrap<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.ok) throw new Error(res.error || fallback)
  return res.data
}

// ─── Perfil y alertas ──────────────────────────

export async function getDashboard() {
  return unwrap(await get<TradingDashboard>('/trading/dashboard', { tzOffset: tzOffset() }), 'No se pudo cargar el panel')
}

export async function getProfile() {
  return unwrap(await get<TradingProfile>('/trading/profile'), 'No se pudo cargar tu perfil de riesgo')
}

export async function updateProfile(data: Partial<TradingProfile>) {
  const { id: _id, ...body } = data
  return unwrap(await put<TradingProfile>('/trading/profile', body), 'No se pudo guardar tu perfil de riesgo')
}

export async function getRiskStatus() {
  return unwrap(await get<RiskStatus>('/trading/risk-status', { tzOffset: tzOffset() }), 'No se pudo calcular tu estado de riesgo')
}

// ─── Diario ────────────────────────────────────

export async function listTrades(query: { account?: AccountScope; page?: number; pageSize?: number; from?: string; to?: string } = {}) {
  return unwrap(await get<Paged<Trade>>('/trading/trades', { ...query }), 'No se pudo cargar el diario')
}

export async function getTradeStats(query: { account?: AccountScope; from?: string; to?: string } = {}) {
  return unwrap(
    await get<JournalStats>('/trading/trades/stats', { ...query, tzOffset: tzOffset() }),
    'No se pudieron calcular las estadísticas',
  )
}

export async function saveTrade(data: Partial<TradeInput>, id?: number) {
  const res = id ? await put<Trade>(`/trading/trades/${id}`, data) : await post<Trade>('/trading/trades', data)
  return unwrap(res, 'No se pudo guardar la operación')
}

export async function deleteTrade(id: number) {
  return unwrap(await del(`/trading/trades/${id}`), 'No se pudo eliminar la operación')
}

// ─── Fondeo ────────────────────────────────────

export async function listFundingAccounts() {
  return unwrap(await get<FundingAccount[]>('/trading/funding-accounts', { tzOffset: tzOffset() }), 'No se pudieron cargar tus cuentas')
}

export async function getFundingAccount(id: number) {
  return unwrap(await get<FundingAccount>(`/trading/funding-accounts/${id}`, { tzOffset: tzOffset() }), 'No se pudo cargar la cuenta')
}

export async function saveFundingAccount(data: Partial<FundingAccountInput>, id?: number) {
  const res = id
    ? await put(`/trading/funding-accounts/${id}`, data)
    : await post('/trading/funding-accounts', data)
  return unwrap(res, 'No se pudo guardar la cuenta')
}

export async function deleteFundingAccount(id: number) {
  return unwrap(await del(`/trading/funding-accounts/${id}`), 'No se pudo eliminar la cuenta')
}

// ─── Finanzas ──────────────────────────────────

export async function getFinanceSummary(month?: string) {
  return unwrap(await get<FinanceSummary>('/trading/finance/summary', { month }), 'No se pudo cargar el resumen')
}

export async function saveIncome(data: { source: IncomeSource; amount: number; month: string; note?: string | null }, id?: number) {
  const res = id ? await put(`/trading/incomes/${id}`, data) : await post('/trading/incomes', data)
  return unwrap(res, 'No se pudo guardar el ingreso')
}

export async function deleteIncome(id: number) {
  return unwrap(await del(`/trading/incomes/${id}`), 'No se pudo eliminar el ingreso')
}

export async function getDistributionPlans() {
  return unwrap(await get<Record<DistributionKind, Bucket[]>>('/trading/distribution-plans'), 'No se pudieron cargar tus distribuciones')
}

export async function saveDistributionPlan(kind: DistributionKind, buckets: Bucket[]) {
  return unwrap(await put<Bucket[]>(`/trading/distribution-plans/${kind}`, { buckets }), 'No se pudo guardar la distribución')
}

export async function listPayouts() {
  return unwrap(await get<PayoutList>('/trading/payouts'), 'No se pudieron cargar tus payouts')
}

export async function createPayout(data: { amount: number; fundingAccountId?: number | null; receivedAt?: string; note?: string | null; buckets?: Bucket[] }) {
  return unwrap(await post<Payout>('/trading/payouts', data), 'No se pudo registrar el payout')
}

export async function deletePayout(id: number) {
  return unwrap(await del(`/trading/payouts/${id}`), 'No se pudo eliminar el payout')
}
