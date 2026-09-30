// ──────────────────────────────────────────────
// GrowthPage — Plan de crecimiento.
// Proyección del capital separando lo que se reinvierte
// de lo que se retira. Proyección, no garantía.
// Ruta: /app/trading/growth
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { LineChart as LineIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { growthProjection, requiredRate } from '@features/trading/calc'
import { Disclaimer, NumberField, PageShell, Panel, SelectField, StatTile, money } from '@features/trading/ui'

type Period = 'month' | 'week'
const PERIOD_LABEL: Record<Period, string> = { month: 'Mes', week: 'Semana' }

const CAPITAL = '#10b981'
const AXIS = { fontSize: 11, fill: 'var(--text-muted)' }

export default function GrowthPage() {
  const [initial, setInitial] = useState(2000)
  const [rate, setRate] = useState(5)
  const [period, setPeriod] = useState<Period>('month')
  const [periods, setPeriods] = useState(24)
  const [reinvest, setReinvest] = useState(100)
  const [contribution, setContribution] = useState(0)
  const [goal, setGoal] = useState(10_000)

  const result = useMemo(
    () => growthProjection({ initial, ratePct: rate, periods, reinvestPct: reinvest, contribution, goal }),
    [initial, rate, periods, reinvest, contribution, goal],
  )
  const needed = requiredRate(initial, goal, periods)
  const label = PERIOD_LABEL[period]

  return (
    <PageShell title="Plan de crecimiento" subtitle="Capital, reinversión y objetivos">
      <Disclaimer>
        <strong>Proyección, no garantía.</strong> Los rendimientos reales pueden variar y las pérdidas forman parte del escenario. Un
        rendimiento fijo cada periodo no existe en trading: usa esto para ver qué exige tu objetivo, no para prometértelo.
      </Disclaimer>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Parámetros" icon={<LineIcon className="w-4 h-4" />} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Capital inicial" value={initial} onChange={setInitial} suffix="USD" min={0} />
            <NumberField label="Objetivo financiero" value={goal} onChange={setGoal} suffix="USD" min={0} />
            <SelectField<Period>
              label="Periodo"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: 'Mensual' },
                { value: 'week', label: 'Semanal' },
              ]}
            />
            <NumberField label={`Ganancia promedio por ${label.toLowerCase()}`} value={rate} onChange={setRate} suffix="%" step={0.5} />
            <NumberField label="Tiempo" value={periods} onChange={v => setPeriods(Math.max(1, Math.min(600, Math.floor(v))))} suffix={period === 'month' ? 'meses' : 'semanas'} step={1} min={1} />
            <NumberField label="Aporte por periodo" value={contribution} onChange={setContribution} suffix="USD" min={0} />
            <NumberField label="% que reinviertes" value={reinvest} onChange={v => setReinvest(Math.max(0, Math.min(100, v)))} suffix="%" step={5} />
            <NumberField label="% que retiras" value={100 - reinvest} onChange={v => setReinvest(Math.max(0, Math.min(100, 100 - v)))} suffix="%" step={5} />
          </div>
          {needed !== null && (
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Para llegar de {money(initial)} a {money(goal)} en {periods} {period === 'month' ? 'meses' : 'semanas'} reinvirtiendo todo
              necesitas ≈ <span className="text-[var(--text-primary)] font-medium">{needed}%</span> por {label.toLowerCase()}.
            </p>
          )}
        </Panel>

        <div className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="📊 Capital final" value={money(result.finalCapital)} valueClass="text-emerald-400" />
            <StatTile label="💵 Retirado" value={money(result.totalWithdrawn)} />
            <StatTile label="🔄 Reinvertido" value={money(result.totalReinvested)} />
            <StatTile
              label="🎯 Objetivo"
              value={result.goalReachedAt === null ? 'No alcanzado' : result.goalReachedAt === 0 ? 'Ya cumplido' : `${label} ${result.goalReachedAt}`}
              valueClass={result.goalReachedAt === null ? 'text-orange-400' : 'text-emerald-400'}
            />
          </div>

          <Panel title="Capital proyectado">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CAPITAL} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={CAPITAL} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} width={70} tickFormatter={v => money(Number(v))} domain={[0, (max: number) => Math.max(max, goal)]} />
                  {goal > 0 && <ReferenceLine y={goal} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: 'Objetivo', fill: 'var(--text-muted)', fontSize: 11, position: 'insideTopLeft' }} />}
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                    labelFormatter={v => `${label} ${v}`}
                    formatter={v => [money(Number(v)), 'Capital']}
                  />
                  <Area type="linear" dataKey="end" stroke={CAPITAL} strokeWidth={2} fill="url(#growthFill)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Detalle por periodo">
        <div className="overflow-x-auto max-h-[28rem]">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="text-[var(--text-muted)] sticky top-0 bg-[var(--bg-panel)]">
              <tr className="text-right">
                <th className="py-1.5 font-medium text-left">{label}</th>
                <th className="py-1.5 font-medium">Inicio</th>
                <th className="py-1.5 font-medium">Ganancia</th>
                <th className="py-1.5 font-medium">Retirado</th>
                <th className="py-1.5 font-medium">Reinvertido</th>
                <th className="py-1.5 font-medium">Capital</th>
                <th className="py-1.5 font-medium">Crecimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] tabular-nums text-right">
              {result.rows.map(r => (
                <tr key={r.period} className={result.goalReachedAt === r.period ? 'bg-emerald-500/10' : ''}>
                  <td className="py-1.5 text-left text-[var(--text-secondary)]">
                    {label} {r.period}
                  </td>
                  <td className="py-1.5">{money(r.start)}</td>
                  <td className="py-1.5">{money(r.profit)}</td>
                  <td className="py-1.5">{money(r.withdrawn)}</td>
                  <td className="py-1.5">{money(r.reinvested)}</td>
                  <td className="py-1.5 font-medium text-[var(--text-primary)]">{money(r.end)}</td>
                  <td className="py-1.5">{r.growthPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  )
}
