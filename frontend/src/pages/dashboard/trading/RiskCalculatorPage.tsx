// ──────────────────────────────────────────────
// RiskCalculatorPage — Gestión de riesgo.
// Capital → riesgo permitido → tamaño de posición →
// pérdida máxima → beneficio potencial. Y, sobre todo,
// cuánto NO puedes permitirte perder.
// Ruta: /app/trading/risk
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { Calculator, Save, ShieldX } from 'lucide-react'
import { getProfile, updateProfile } from '@services/trading'
import { ASSET_PRESETS, riskLimits, tradeRisk } from '@features/trading/calc'
import {
  ErrorNote,
  NumberField,
  PageShell,
  Panel,
  SelectField,
  StatTile,
  money,
  secondaryButton,
  useLoader,
} from '@features/trading/ui'

export default function RiskCalculatorPage() {
  const { data: profile, error } = useLoader(getProfile)
  const [capital, setCapital] = useState(10_000)
  const [riskPct, setRiskPct] = useState(0.5)
  const [assetId, setAssetId] = useState('XAUUSD')
  const [stop, setStop] = useState(50)
  const [valuePerUnit, setValuePerUnit] = useState(10)
  const [lotStep, setLotStep] = useState(0.01)
  const [rr, setRr] = useState(2)
  const [maxTrades, setMaxTrades] = useState(3)
  const [dailyPct, setDailyPct] = useState(2)
  const [weeklyPct, setWeeklyPct] = useState(5)
  const [ddPct, setDdPct] = useState(10)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Arranca con las reglas guardadas del usuario.
  useEffect(() => {
    if (!profile) return
    setCapital(profile.initialCapital)
    setRiskPct(profile.riskPerTradePct)
    setRr(profile.defaultRewardRatio)
    setMaxTrades(profile.maxTradesPerDay)
    setDailyPct(profile.maxDailyLossPct)
    setWeeklyPct(profile.maxWeeklyLossPct)
    setDdPct(profile.maxDrawdownPct)
  }, [profile])

  const asset = ASSET_PRESETS.find(a => a.id === assetId) ?? ASSET_PRESETS[0]

  const trade = useMemo(
    () => tradeRisk({ capital, riskPct, stop, valuePerUnit, lotStep, rewardRatio: rr }),
    [capital, riskPct, stop, valuePerUnit, lotStep, rr],
  )
  const limits = useMemo(
    () =>
      riskLimits({
        capital,
        riskPct,
        maxTradesPerDay: maxTrades,
        maxDailyLossPct: dailyPct,
        maxWeeklyLossPct: weeklyPct,
        maxDrawdownPct: ddPct,
      }),
    [capital, riskPct, maxTrades, dailyPct, weeklyPct, ddPct],
  )

  const saveAsRules = async () => {
    setSaving(true)
    setSaved(null)
    setSaveError(null)
    try {
      await updateProfile({
        initialCapital: capital,
        riskPerTradePct: riskPct,
        defaultRewardRatio: rr,
        maxTradesPerDay: maxTrades,
        maxDailyLossPct: dailyPct,
        maxWeeklyLossPct: weeklyPct,
        maxDrawdownPct: ddPct,
      })
      setSaved('Guardado como tus reglas personales.')
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Gestión de riesgo"
      subtitle="Calculadora de riesgo y de posición"
      actions={
        <button onClick={() => void saveAsRules()} disabled={saving} className={secondaryButton}>
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Guardando…' : 'Guardar como mis reglas'}
        </button>
      }
    >
      <ErrorNote message={error ?? saveError} />
      {saved && <p className="text-xs text-emerald-400">{saved}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Tu operación" icon={<Calculator className="w-4 h-4" />} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Capital de la cuenta" value={capital} onChange={setCapital} suffix="USD" min={0} />
            <NumberField label="Riesgo por trade" value={riskPct} onChange={setRiskPct} suffix="%" step={0.05} min={0} />
            <div className="col-span-2">
              <SelectField
                label="Activo"
                value={assetId}
                onChange={id => {
                  setAssetId(id)
                  const preset = ASSET_PRESETS.find(a => a.id === id)
                  if (preset) {
                    setValuePerUnit(preset.valuePerUnit)
                    setLotStep(preset.lotStep)
                  }
                }}
                options={ASSET_PRESETS.map(a => ({ value: a.id, label: a.label }))}
              />
            </div>
            <NumberField label={`Stop loss (${asset.unit})`} value={stop} onChange={setStop} min={0} />
            <NumberField label="Ratio R:R (1:x)" value={rr} onChange={setRr} step={0.1} min={0} />
            <NumberField
              label="Valor por unidad por lote"
              value={valuePerUnit}
              onChange={setValuePerUnit}
              suffix="USD"
              hint={asset.note ? `${asset.note}. Verifica con tu broker.` : 'Verifica con tu broker.'}
            />
            <NumberField label="Paso de lote" value={lotStep} onChange={setLotStep} step={0.01} min={0.0001} />
          </div>

          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] mt-5 mb-2">Tus límites</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Máx. operaciones diarias" value={maxTrades} onChange={setMaxTrades} step={1} min={0} />
            <NumberField label="Pérdida máx. diaria" value={dailyPct} onChange={setDailyPct} suffix="%" min={0} />
            <NumberField label="Pérdida máx. semanal" value={weeklyPct} onChange={setWeeklyPct} suffix="%" min={0} />
            <NumberField label="Drawdown máx." value={ddPct} onChange={setDdPct} suffix="%" min={0} />
          </div>
        </Panel>

        <div className="lg:col-span-3 space-y-5">
          <Panel title="Resultado">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="🟢 Riesgo permitido" value={money(trade.riskAmount)} hint={`${riskPct}% de ${money(capital)}`} valueClass="text-emerald-400" />
              <StatTile label={`🎯 Objetivo a ${rr}R`} value={money(trade.targetAmount)} hint={`TP a ${trade.targetDistance} ${asset.unit}`} valueClass="text-sky-400" />
              <StatTile label="🔴 Pérdida máxima del trade" value={money(trade.actualRisk)} hint={`${trade.actualRiskPct}% real con el lote redondeado`} valueClass="text-red-400" />
            </div>

            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-soft)] p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Tamaño de posición</p>
                <p className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
                  {trade.positionSize} <span className="text-base font-normal text-[var(--text-muted)]">lotes</span>
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Redondeado hacia abajo al paso de {lotStep}: nunca arriesgas más de lo permitido.
                {trade.positionSize === 0 && ' Con este stop el riesgo no alcanza para el lote mínimo: amplía capital o reduce el stop.'}
              </p>
            </div>

            <table className="w-full mt-4 text-xs">
              <thead>
                <tr className="text-[var(--text-muted)] text-left">
                  <th className="py-1.5 font-medium">Escenario</th>
                  <th className="py-1.5 font-medium text-right">Distancia</th>
                  <th className="py-1.5 font-medium text-right">Resultado</th>
                  <th className="py-1.5 font-medium text-right">% cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[-1, 1, 2, 3].map(r => (
                  <tr key={r}>
                    <td className="py-1.5 text-[var(--text-secondary)]">{r < 0 ? 'Stop (−1R)' : `Take profit ${r}R`}</td>
                    <td className="py-1.5 text-right tabular-nums">{Math.abs(r) * stop} {asset.unit}</td>
                    <td className={`py-1.5 text-right tabular-nums ${r < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {r < 0 ? '−' : '+'}
                      {money(Math.abs(r) * trade.actualRisk)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {capital > 0 ? ((r * trade.actualRisk * 100) / capital).toFixed(2) : '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Lo que NO puedes permitirte perder" icon={<ShieldX className="w-4 h-4" />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Hoy" value={money(limits.dailyLoss)} hint={`= ${limits.lossesToDaily} stops seguidos`} valueClass="text-red-400" />
              <StatTile label="Esta semana" value={money(limits.weeklyLoss)} hint={`= ${limits.lossesToWeekly} stops`} valueClass="text-red-400" />
              <StatTile
                label="Drawdown total"
                value={money(limits.maxDrawdown)}
                hint={`= ${limits.lossesToDrawdown} stops · cuenta a ${money(limits.capitalAfterMaxDrawdown)}`}
                valueClass="text-red-400"
              />
            </div>
            <p className={`mt-4 text-xs ${limits.tradesExceedDaily ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}>
              {limits.tradesExceedDaily
                ? `⚠️ Con ${maxTrades} operaciones al ${riskPct}% podrías perder ${money(limits.worstDay)} en un día, más que tu límite diario de ${money(limits.dailyLoss)}. Reduce el riesgo o el número de operaciones.`
                : `Si todas tus ${maxTrades} operaciones de hoy fallan pierdes ${money(limits.worstDay)}, dentro de tu límite diario.`}
            </p>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
