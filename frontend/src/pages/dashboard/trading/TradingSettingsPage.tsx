// ──────────────────────────────────────────────
// TradingSettingsPage — Configuración: riesgo,
// reglas personales y umbrales de alerta. El sistema
// de alertas protege exactamente estas reglas.
// Ruta: /app/trading/settings
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { BellRing, Save, Settings2 } from 'lucide-react'
import { SkeletonChartCard } from '@components/ui'
import { getProfile, getRiskStatus, updateProfile, type AlertLevel, type TradingProfile } from '@services/trading'
import {
  ALERT_META,
  ErrorNote,
  NumberField,
  PageShell,
  Panel,
  PHILOSOPHY,
  TextField,
  money,
  primaryButton,
  useLoader,
} from '@features/trading/ui'

const LEVEL_RULES: Record<AlertLevel, (p: TradingProfile) => string> = {
  NORMAL: () => 'Estás dentro de tu riesgo establecido.',
  CAUTION: p => `Has perdido ${p.maxConsecutiveLosses} operaciones consecutivas.`,
  RISK: p => `Has consumido el ${p.warningThresholdPct}% de tu pérdida diaria, semanal o drawdown máximo.`,
  STOP: p =>
    `Alcanzaste tu pérdida diaria (${p.maxDailyLossPct}%), semanal (${p.maxWeeklyLossPct}%), el drawdown máximo (${p.maxDrawdownPct}%) o las ${p.maxTradesPerDay} operaciones del día. No debes abrir otra operación hoy.`,
}

export default function TradingSettingsPage() {
  const { data, loading, error } = useLoader(getProfile)
  const { data: status, reload: reloadStatus } = useLoader(getRiskStatus)
  const [form, setForm] = useState<TradingProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const set = <K extends keyof TradingProfile>(k: K, v: TradingProfile[K]) => {
    setForm(f => (f ? { ...f, [k]: v } : f))
    setMessage(null)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    setSaveError(null)
    try {
      setForm(await updateProfile(form))
      setMessage('Reglas guardadas.')
      await reloadStatus()
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Configuración"
      subtitle="Riesgo, reglas personales y alertas"
      actions={
        <button onClick={() => void save()} disabled={!form || saving} className={primaryButton}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando…' : 'Guardar reglas'}
        </button>
      }
    >
      <ErrorNote message={error ?? saveError} />
      {message && <p className="text-xs text-emerald-400">{message}</p>}

      {loading || !form ? (
        <SkeletonChartCard height={320} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Panel title="Riesgo" icon={<Settings2 className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Capital inicial (cuenta personal)"
                  value={form.initialCapital}
                  onChange={v => set('initialCapital', v)}
                  suffix={form.baseCurrency}
                  hint="Tu capital actual = este valor + resultados del diario"
                />
                <TextField label="Moneda" value={form.baseCurrency} onChange={v => set('baseCurrency', v.toUpperCase().slice(0, 10))} />
                <NumberField label="Riesgo por operación" value={form.riskPerTradePct} onChange={v => set('riskPerTradePct', v)} suffix="%" step={0.05} />
                <NumberField label="R:R por defecto (1:x)" value={form.defaultRewardRatio} onChange={v => set('defaultRewardRatio', v)} step={0.1} />
              </div>
            </Panel>

            <Panel title="Reglas personales">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Máx. operaciones diarias" value={form.maxTradesPerDay} onChange={v => set('maxTradesPerDay', Math.floor(v))} step={1} min={0} />
                <NumberField label="Pérdida máx. diaria" value={form.maxDailyLossPct} onChange={v => set('maxDailyLossPct', v)} suffix="%" />
                <NumberField label="Pérdida máx. semanal" value={form.maxWeeklyLossPct} onChange={v => set('maxWeeklyLossPct', v)} suffix="%" />
                <NumberField label="Drawdown máx. permitido" value={form.maxDrawdownPct} onChange={v => set('maxDrawdownPct', v)} suffix="%" />
              </div>
            </Panel>

            <Panel title="Alertas" icon={<BellRing className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Pérdidas seguidas → Precaución"
                  value={form.maxConsecutiveLosses}
                  onChange={v => set('maxConsecutiveLosses', Math.floor(v))}
                  step={1}
                  min={0}
                  hint="0 desactiva esta alerta"
                />
                <NumberField
                  label="Umbral de Riesgo (límite consumido)"
                  value={form.warningThresholdPct}
                  onChange={v => set('warningThresholdPct', v)}
                  suffix="%"
                  step={5}
                  min={10}
                  max={100}
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-5">
            {status && (
              <div className={`rounded-xl border p-4 ${ALERT_META[status.level].className}`}>
                <p className="text-sm font-semibold">
                  Ahora mismo: {ALERT_META[status.level].emoji} {ALERT_META[status.level].label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Capital {money(status.capital)} · riesgo permitido {money(status.riskPerTrade)} · te quedan {money(status.today.lossRemaining)} de
                  pérdida hoy.
                </p>
              </div>
            )}

            <Panel title="🚨 Sistema de alertas">
              <ul className="space-y-3">
                {(Object.keys(LEVEL_RULES) as AlertLevel[]).map(level => (
                  <li key={level} className={`rounded-lg border px-3 py-2.5 ${ALERT_META[level].className}`}>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {ALERT_META[level].emoji} {ALERT_META[level].label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{LEVEL_RULES[level](form)}</p>
                  </li>
                ))}
              </ul>
              <p className="text-caption text-[var(--text-muted)] mt-4">
                No porque la aplicación sepa qué hará el mercado, sino porque protege las reglas que tú configuraste. {PHILOSOPHY}
              </p>
            </Panel>
          </div>
        </div>
      )}
    </PageShell>
  )
}
