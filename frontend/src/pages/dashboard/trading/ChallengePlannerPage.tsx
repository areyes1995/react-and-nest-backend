// ──────────────────────────────────────────────
// ChallengePlannerPage — Pasar pruebas de fondeo.
// En vez de "gana $800 cada día", escenarios de riesgo
// con lo que implica cada uno: R necesarios, stops que
// aguantas, días según tu win rate y probabilidad.
// Ruta: /app/trading/challenge[?account=id]
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Dices, Target, Calculator } from 'lucide-react'
import { formInputClass } from '@components/ui'
import { listFundingAccounts } from '@services/trading'
import {
  DEFAULT_SCENARIOS,
  DEFAULT_WIN_RATES,
  challengeScenario,
  monteCarloChallenge,
  simulateTrades,
  type ChallengeInput,
} from '@features/trading/calc'
import {
  Disclaimer,
  HEALTH_META,
  NumberField,
  PageShell,
  Panel,
  StatTile,
  money,
  pnlClass,
  ratioPct,
  signedMoney,
  useLoader,
} from '@features/trading/ui'

const SCENARIO_STYLE: Record<string, string> = {
  conservative: 'border-emerald-500/30',
  moderate: 'border-sky-500/30',
  aggressive: 'border-orange-500/30',
  custom: 'border-violet-500/30',
}

export default function ChallengePlannerPage() {
  const [params, setParams] = useSearchParams()
  const { data: accounts } = useLoader(listFundingAccounts)
  const [accountId, setAccountId] = useState(params.get('account') ?? '')
  const [input, setInput] = useState<ChallengeInput>({
    accountSize: 100_000,
    profitTargetPct: 8,
    dailyLossPct: 5,
    maxDrawdownPct: 10,
    targetDays: 10,
    minTradingDays: 5,
    rewardRatio: 2,
    tradesPerDay: 2,
  })
  const [customRisk, setCustomRisk] = useState(0.5)
  const [winRate, setWinRate] = useState(50)
  const set = <K extends keyof ChallengeInput>(k: K, v: ChallengeInput[K]) => setInput(i => ({ ...i, [k]: v }))

  const account = accounts?.find(a => String(a.id) === accountId)

  // Al elegir una cuenta registrada se copian sus reglas.
  useEffect(() => {
    if (!account) return
    setInput(i => ({
      ...i,
      accountSize: account.accountSize,
      profitTargetPct: account.profitTargetPct,
      dailyLossPct: account.dailyLossPct,
      maxDrawdownPct: account.maxDrawdownPct,
      targetDays: account.targetDays,
      minTradingDays: account.minTradingDays,
      rewardRatio: account.rewardRatio,
    }))
    setCustomRisk(account.riskPerTradePct)
  }, [account])

  const scenarios = useMemo(() => {
    const list = [...DEFAULT_SCENARIOS]
    if (!list.some(s => s.riskPct === customRisk)) list.push({ id: 'custom', name: 'Tu riesgo', riskPct: customRisk })
    return list.map(s => ({
      ...challengeScenario(input, s, DEFAULT_WIN_RATES),
      odds: monteCarloChallenge({ ...input, riskPct: s.riskPct, winRate: winRate / 100, runs: 1500 }),
    }))
  }, [input, customRisk, winRate])

  const target = (input.accountSize * input.profitTargetPct) / 100
  const naivePerDay = input.targetDays > 0 ? target / input.targetDays : 0

  return (
    <PageShell title="Plan para el challenge" subtitle="Escenarios, no promesas">
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Reglas del challenge" icon={<Target className="w-4 h-4" />} className="lg:col-span-2">
          <div className="form-field mb-3">
            <label htmlFor="plan-account">Usar una cuenta registrada</label>
            <select
              id="plan-account"
              value={accountId}
              onChange={e => {
                setAccountId(e.target.value)
                setParams(e.target.value ? { account: e.target.value } : {}, { replace: true })
              }}
              className={formInputClass}
            >
              <option value="">— Manual —</option>
              {(accounts ?? []).map(a => (
                <option key={a.id} value={a.id}>
                  {a.firmName} · {money(a.accountSize)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Cuenta" value={input.accountSize} onChange={v => set('accountSize', v)} suffix="USD" />
            <NumberField label="Profit target" value={input.profitTargetPct} onChange={v => set('profitTargetPct', v)} suffix="%" />
            <NumberField label="Daily loss limit" value={input.dailyLossPct} onChange={v => set('dailyLossPct', v)} suffix="%" />
            <NumberField label="Maximum drawdown" value={input.maxDrawdownPct} onChange={v => set('maxDrawdownPct', v)} suffix="%" />
            <NumberField label="Días mínimos" value={input.minTradingDays} onChange={v => set('minTradingDays', v)} step={1} />
            <NumberField label="Días deseados" value={input.targetDays} onChange={v => set('targetDays', v)} step={1} />
            <NumberField label="R:R promedio (1:x)" value={input.rewardRatio} onChange={v => set('rewardRatio', v)} step={0.1} />
            <NumberField label="Operaciones por día" value={input.tradesPerDay} onChange={v => set('tradesPerDay', v)} step={1} min={1} />
            <NumberField label="Tu riesgo por operación" value={customRisk} onChange={setCustomRisk} suffix="%" step={0.05} />
            <NumberField label="Tu win rate estimado" value={winRate} onChange={setWinRate} suffix="%" step={1} hint="Míralo en tus estadísticas" />
          </div>
        </Panel>

        <div className="lg:col-span-3 space-y-5">
          <Panel title="🎯 Tu objetivo">
            {account && (
              <p className={`text-xs mb-3 ${HEALTH_META[account.summary.health].className}`}>
                {HEALTH_META[account.summary.health].emoji} {account.firmName}: llevas {signedMoney(account.summary.profit)}, faltan{' '}
                {money(account.summary.profitRemaining)} en {account.summary.daysRemaining} días ({money(account.summary.requiredPerDay)}/día ≈{' '}
                {account.summary.requiredRPerDay}R/día). Te caben {account.summary.lossesToDailyLimit} stops hoy.
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Objetivo" value={money(target)} hint={`${input.profitTargetPct}% de ${money(input.accountSize)}`} />
              <StatTile label="Días objetivo" value={input.targetDays} hint={`mínimo ${input.minTradingDays}`} />
              <StatTile label="Pérdida diaria máx." value={money((input.accountSize * input.dailyLossPct) / 100)} valueClass="text-red-400" />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Dividirlo en "{money(naivePerDay)} todos los días" empuja a sobreoperar. Mejor piensa en R: elige cuánto arriesgas y mira
              qué exige cada escenario.
            </p>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map(s => (
              <div key={s.id} className={`rounded-xl border bg-[var(--bg-panel)] p-4 space-y-3 ${SCENARIO_STYLE[s.id] ?? ''}`}>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Escenario {s.name.toLowerCase()}</h4>
                  <span className="text-xs text-[var(--text-muted)]">
                    Riesgo {s.riskPct}% = {money(s.riskAmount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="R necesarios" value={`${s.rNeeded}R`} hint={`≈ ${s.rPerDay}R por día`} />
                  <StatTile label="Mín. ganadoras" value={s.minWinningTrades} hint={`a 1:${input.rewardRatio} sin pérdidas`} />
                  <StatTile label="Stops hasta daily" value={s.lossesToDaily} valueClass={s.lossesToDaily <= 3 ? 'text-orange-400' : undefined} />
                  <StatTile label="Stops hasta max DD" value={s.lossesToDrawdown} valueClass={s.lossesToDrawdown <= 6 ? 'text-orange-400' : undefined} />
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[var(--text-muted)]">
                    <tr className="text-left">
                      <th className="font-medium py-1">Win rate</th>
                      <th className="font-medium py-1 text-right">Expectancy</th>
                      <th className="font-medium py-1 text-right">Trades</th>
                      <th className="font-medium py-1 text-right">Días</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {s.outcomes.map(o => (
                      <tr key={o.winRate}>
                        <td className="py-1">{Math.round(o.winRate * 100)}%</td>
                        <td className={`py-1 text-right tabular-nums ${pnlClass(o.expectancyR)}`}>{o.expectancyR}R</td>
                        <td className="py-1 text-right tabular-nums">{o.tradesNeeded ?? '∞'}</td>
                        <td className={`py-1 text-right tabular-nums ${o.fitsTargetDays ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {o.daysNeeded ?? 'nunca'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-lg bg-[var(--bg-surface-soft)] px-3 py-2 text-xs">
                  <p className="text-[var(--text-secondary)]">
                    Con {winRate}% de acierto y {input.tradesPerDay} ops/día en {input.targetDays} días:
                  </p>
                  <p className="mt-0.5">
                    <span className="text-emerald-400">pasas {ratioPct(s.odds.passRate, 0)}</span> ·{' '}
                    <span className="text-red-400">quemas {ratioPct(s.odds.failRate, 0)}</span> ·{' '}
                    <span className="text-[var(--text-muted)]">sin terminar {ratioPct(s.odds.pendingRate, 0)}</span>
                  </p>
                </div>
                {s.breachesDailyAtFullLoss && (
                  <p className="text-caption text-orange-400">
                    ⚠️ Si pierdes las {input.tradesPerDay} operaciones de un día ({money(s.maxDailyLossIfAllLose)}) tocas el daily loss.
                  </p>
                )}
              </div>
            ))}
          </div>
          <Disclaimer>
            Simulación de {1500} challenges con resultados aleatorios independientes según tu win rate y R:R. Es una estimación de
            escenarios, no una garantía: el mercado no reparte resultados de forma independiente ni uniforme.
          </Disclaimer>
        </div>
      </div>

      <RiskAndSimulator defaultCapital={input.accountSize} defaultTargetPct={input.profitTargetPct} defaultDays={input.targetDays} defaultRr={input.rewardRatio} defaultRisk={customRisk} />
    </PageShell>
  )
}

function RiskAndSimulator({
  defaultCapital,
  defaultTargetPct,
  defaultDays,
  defaultRr,
  defaultRisk,
}: {
  defaultCapital: number
  defaultTargetPct: number
  defaultDays: number
  defaultRr: number
  defaultRisk: number
}) {
  const [capital, setCapital] = useState(defaultCapital)
  const [targetPct, setTargetPct] = useState(defaultTargetPct)
  const [days, setDays] = useState(defaultDays)
  const [riskPct, setRiskPct] = useState(defaultRisk)
  const [rr, setRr] = useState(defaultRr)
  const [trades, setTrades] = useState(5)
  const [winners, setWinners] = useState(3)

  useEffect(() => {
    setCapital(defaultCapital)
    setTargetPct(defaultTargetPct)
    setDays(defaultDays)
    setRr(defaultRr)
    setRiskPct(defaultRisk)
  }, [defaultCapital, defaultTargetPct, defaultDays, defaultRr, defaultRisk])

  const risk = (capital * riskPct) / 100
  const target = (capital * targetPct) / 100
  const sim = simulateTrades({ capital, riskPct, rewardRatio: rr, trades, winners })

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="🧮 ¿Cuánto arriesgo?" icon={<Calculator className="w-4 h-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumberField label="Cuenta" value={capital} onChange={setCapital} suffix="USD" />
          <NumberField label="Profit target" value={targetPct} onChange={setTargetPct} suffix="%" />
          <NumberField label="Días objetivo" value={days} onChange={setDays} step={1} />
          <NumberField label="Riesgo por trade" value={riskPct} onChange={setRiskPct} suffix="%" step={0.05} />
          <NumberField label="R:R (1:x)" value={rr} onChange={setRr} step={0.1} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <StatTile label="Riesgo por trade" value={money(risk)} valueClass="text-red-400" />
          <StatTile label="Ganancia a 1R" value={money(risk)} valueClass="text-emerald-400" />
          <StatTile label={`Ganancia a ${rr}R`} value={money(risk * rr)} valueClass="text-emerald-400" />
          <StatTile label="R para el objetivo" value={risk > 0 ? `${(target / risk).toFixed(1)}R` : '—'} hint={days > 0 && risk > 0 ? `${(target / risk / days).toFixed(2)}R/día` : undefined} />
        </div>
      </Panel>

      <Panel title="📊 Simulación" icon={<Dices className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Operaciones" value={trades} onChange={v => setTrades(Math.max(0, Math.floor(v)))} step={1} min={0} />
          <NumberField label="Ganadoras" value={winners} onChange={v => setWinners(Math.max(0, Math.min(trades, Math.floor(v))))} step={1} min={0} />
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-4">
          {trades} trades · {Math.min(winners, trades)} ganadores · {sim.losers} perdedores a 1:{rr}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <StatTile label="Resultado" value={`${sim.totalR >= 0 ? '+' : ''}${sim.totalR}R`} valueClass={pnlClass(sim.totalR)} />
          <StatTile label="En dólares" value={signedMoney(sim.result)} valueClass={pnlClass(sim.result)} hint={`${sim.resultPct}% de la cuenta`} />
          <StatTile label="Del objetivo" value={target > 0 ? `${Math.round((sim.result / target) * 100)}%` : '—'} hint={`de ${money(target)}`} />
        </div>
      </Panel>
    </div>
  )
}
