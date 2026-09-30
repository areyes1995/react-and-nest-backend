// ──────────────────────────────────────────────
// StatsPage — Estadísticas del diario.
// Win rate, profit factor, expectancy, drawdown y
// hallazgos: dónde ganas, dónde pierdes y por qué.
// Ruta: /app/trading/stats
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState, SkeletonChartCard, formInputClass } from '@components/ui'
import {
  getTradeStats,
  listFundingAccounts,
  type AccountScope,
  type GroupStat,
} from '@services/trading'
import {
  EMOTION_LABELS,
  ErrorNote,
  PageShell,
  Panel,
  SESSION_LABELS,
  StatTile,
  money,
  pnlClass,
  ratioPct,
  rMultiple,
  signedMoney,
  useLoader,
} from '@features/trading/ui'

const POSITIVE = '#10b981'
const NEGATIVE = '#ef4444'
const AXIS = { fontSize: 11, fill: 'var(--text-muted)' }

const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-active)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text-primary)',
  },
  labelStyle: { color: 'var(--text-secondary)' },
}

const YES_NO: Record<string, string> = { YES: 'Sí', NO: 'No' }

export default function StatsPage() {
  const [params, setParams] = useSearchParams()
  const [scope, setScope] = useState<AccountScope>((params.get('account') as AccountScope) || 'all')
  const { data: stats, loading, error } = useLoader(() => getTradeStats({ account: scope }), [scope])
  const { data: accounts } = useLoader(listFundingAccounts)

  const curve = useMemo(
    () => (stats?.equityCurve ?? []).map((p, i) => ({ n: i, date: new Date(p.date).toLocaleDateString(), equity: p.equity })),
    [stats],
  )

  return (
    <PageShell title="Estadísticas" subtitle="Lo que tu diario dice de ti">
      <select
        aria-label="Cuenta"
        value={scope}
        onChange={e => {
          const v = e.target.value as AccountScope
          setScope(v)
          setParams({ account: v }, { replace: true })
        }}
        className={`${formInputClass} max-w-xs`}
      >
        <option value="all">Todas las cuentas</option>
        <option value="personal">Cuenta personal</option>
        {(accounts ?? []).map(a => (
          <option key={a.id} value={a.id}>
            {a.firmName} · {money(a.accountSize)}
          </option>
        ))}
      </select>

      <ErrorNote message={error} />

      {loading && !stats ? (
        <SkeletonChartCard height={320} />
      ) : !stats || stats.total === 0 ? (
        <EmptyState message="Registra operaciones en el diario para ver tus estadísticas." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <StatTile label="Operaciones" value={stats.total} hint={`${stats.wins} G · ${stats.losses} P · ${stats.breakeven} BE`} />
            <StatTile label="Win rate" value={ratioPct(stats.winRate)} hint={`Loss rate ${ratioPct(stats.lossRate)}`} />
            <StatTile label="Profit factor" value={stats.profitFactor?.toFixed(2) ?? '∞'} />
            <StatTile label="Expectancy" value={rMultiple(stats.expectancyR)} valueClass={pnlClass(stats.expectancyR)} hint={`${signedMoney(stats.expectancy)} por operación`} />
            <StatTile label="R medio ganadoras" value={rMultiple(stats.avgWinR)} hint={`perdedoras ${rMultiple(stats.avgLossR)}`} />
            <StatTile label="Resultado neto" value={signedMoney(stats.net)} valueClass={pnlClass(stats.net)} />
            <StatTile label="Drawdown máx." value={money(stats.maxDrawdown)} hint={ratioPct(stats.maxDrawdownPct)} valueClass="text-orange-400" />
            <StatTile label="Peor racha" value={stats.maxConsecutiveLosses} hint={stats.maxConsecutiveLosses === 1 ? 'pérdida seguida' : 'pérdidas seguidas'} />
            <StatTile label="Mejor día" value={stats.bestDay ? signedMoney(stats.bestDay.pnl) : '—'} hint={stats.bestDay?.date} valueClass={pnlClass(stats.bestDay?.pnl)} />
            <StatTile label="Peor día" value={stats.worstDay ? signedMoney(stats.worstDay.pnl) : '—'} hint={stats.worstDay?.date} valueClass={pnlClass(stats.worstDay?.pnl)} />
            <StatTile label="Sesión más rentable" value={stats.bestSession ? SESSION_LABELS[stats.bestSession] : '—'} />
            <StatTile label="Setup más usado" value={stats.mostUsedSetup ?? '—'} />
          </div>

          {stats.insights.length > 0 && (
            <Panel title="Hallazgos" icon={<Lightbulb className="w-4 h-4" />}>
              <ul className="space-y-2">
                {stats.insights.map(text => (
                  <li key={text} className="text-sm text-[var(--text-primary)] flex gap-2">
                    <span className="text-emerald-400">›</span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="text-caption text-[var(--text-muted)] mt-3">Se muestran a partir de 3 operaciones por grupo. Con pocas operaciones, tómalos como pistas, no como conclusiones.</p>
            </Panel>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Curva de capital">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curve} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={POSITIVE} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={POSITIVE} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="n" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={70} domain={['auto', 'auto']} tickFormatter={v => money(Number(v))} />
                    <Tooltip {...tooltipStyle} formatter={v => [money(Number(v)), 'Capital']} labelFormatter={(_, p) => (p?.[0] ? (p[0].payload.n === 0 ? 'Capital inicial' : `Operación ${p[0].payload.n} · ${p[0].payload.date}`) : '')} />
                    <Area type="linear" dataKey="equity" stroke={POSITIVE} strokeWidth={2} fill="url(#equityFill)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Resultado por día">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.daily} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={70} tickFormatter={v => money(Number(v))} />
                    <ReferenceLine y={0} stroke="var(--border-active)" />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--hover-overlay)' }} formatter={v => [signedMoney(Number(v)), 'P&L']} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {stats.daily.map(d => (
                        <Cell key={d.date} fill={d.pnl >= 0 ? POSITIVE : NEGATIVE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <GroupTable title="Long vs Short" rows={stats.byDirection} label={k => (k === 'LONG' ? 'Long ▲' : 'Short ▼')} />
            <GroupTable title="Por sesión" rows={stats.bySession} label={k => SESSION_LABELS[k] ?? k} />
            <GroupTable title="Por setup" rows={stats.bySetup} label={k => k} />
            <GroupTable title="Por emoción" rows={stats.byEmotion} label={k => EMOTION_LABELS[k] ?? k} />
            <GroupTable
              title="Por riesgo por operación"
              rows={stats.byRisk}
              label={k => (k === 'HIGH' ? 'Más de 1%' : 'Hasta 1%')}
              extra={{ header: 'DD máx.', value: r => ratioPct((r as GroupStat & { maxDrawdownPct: number }).maxDrawdownPct) }}
            />
            <Panel title="Disciplina">
              <div className="space-y-4">
                <DisciplineRow title="¿Seguiste tu estrategia?" rows={stats.discipline.followedPlan} />
                <DisciplineRow title="¿Entraste por impulso?" rows={stats.discipline.impulsive} />
                <DisciplineRow title="¿Moviste el SL?" rows={stats.discipline.movedStopLoss} />
                <DisciplineRow title="¿Cerraste antes?" rows={stats.discipline.closedEarly} />
              </div>
            </Panel>
          </div>
        </>
      )}
    </PageShell>
  )
}

function GroupTable({
  title,
  rows,
  label,
  extra,
}: {
  title: string
  rows: GroupStat[]
  label: (key: string) => string
  extra?: { header: string; value: (row: GroupStat) => string }
}) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">Sin datos.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-[var(--text-muted)]">
            <tr className="text-left">
              <th className="py-1.5 font-medium" />
              <th className="py-1.5 font-medium text-right">Ops</th>
              <th className="py-1.5 font-medium text-right">Win rate</th>
              <th className="py-1.5 font-medium text-right">Expectancy</th>
              <th className="py-1.5 font-medium text-right">Neto</th>
              {extra && <th className="py-1.5 font-medium text-right">{extra.header}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map(r => (
              <tr key={r.key}>
                <td className="py-1.5 text-[var(--text-primary)]">{label(r.key)}</td>
                <td className="py-1.5 text-right tabular-nums">{r.count}</td>
                <td className="py-1.5 text-right tabular-nums">{ratioPct(r.winRate)}</td>
                <td className={`py-1.5 text-right tabular-nums ${pnlClass(r.expectancyR)}`}>{rMultiple(r.expectancyR)}</td>
                <td className={`py-1.5 text-right tabular-nums ${pnlClass(r.net)}`}>{signedMoney(r.net)}</td>
                {extra && <td className="py-1.5 text-right tabular-nums">{extra.value(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

function DisciplineRow({ title, rows }: { title: string; rows: GroupStat[] }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] mb-1">{title}</p>
      <div className="flex gap-3 flex-wrap">
        {rows.map(r => (
          <span key={r.key} className="text-xs text-[var(--text-muted)]">
            {YES_NO[r.key]}: <span className="text-[var(--text-primary)]">{r.count}</span> ops ·{' '}
            <span className={pnlClass(r.expectancyR)}>{rMultiple(r.expectancyR)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
