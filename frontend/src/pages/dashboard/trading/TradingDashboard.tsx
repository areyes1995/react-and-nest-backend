// ──────────────────────────────────────────────
// TradingDashboard — panel principal del Trading
// Risk Manager: estado de riesgo, límites de hoy,
// cuentas de fondeo y accesos a los tres "cerebros".
// Ruta: /app/trading
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Calculator,
  Coins,
  LineChart,
  Settings2,
  ShieldCheck,
  Trophy,
  Wallet,
} from 'lucide-react'
import { SkeletonChartCard } from '@components/ui'
import { getDashboard, type TradingDashboard as TradingDashboardData } from '@services/trading'
import {
  ALERT_META,
  ErrorNote,
  HEALTH_META,
  PageShell,
  Panel,
  PHILOSOPHY,
  ProgressBar,
  StatTile,
  money,
  pnlClass,
  ratioPct,
  rMultiple,
  signedMoney,
  useLoader,
} from '@features/trading/ui'

const iconClass = 'w-4 h-4'

const AREAS = [
  {
    title: '📊 Trading',
    brain: 'Trading Risk Manager',
    links: [
      { to: '/app/trading/risk', label: 'Calculadora de riesgo y posición', icon: <Calculator className={iconClass} /> },
      { to: '/app/trading/journal', label: 'Diario del trader', icon: <BookOpen className={iconClass} /> },
      { to: '/app/trading/stats', label: 'Estadísticas', icon: <BarChart3 className={iconClass} /> },
    ],
  },
  {
    title: '🏆 Fondeos',
    brain: 'Funding Manager',
    links: [
      { to: '/app/trading/funding', label: 'Mis challenges', icon: <Trophy className={iconClass} /> },
      { to: '/app/trading/challenge', label: 'Plan, simulador y ¿cuánto arriesgo?', icon: <ShieldCheck className={iconClass} /> },
    ],
  },
  {
    title: '💰 Finanzas',
    brain: 'Financial Manager',
    links: [
      { to: '/app/trading/finance', label: 'Ingresos y distribución', icon: <Wallet className={iconClass} /> },
      { to: '/app/trading/payouts', label: 'Administrador de retiros', icon: <Coins className={iconClass} /> },
      { to: '/app/trading/growth', label: 'Plan de crecimiento', icon: <LineChart className={iconClass} /> },
    ],
  },
  {
    title: '⚙️ Configuración',
    brain: 'Tus reglas',
    links: [{ to: '/app/trading/settings', label: 'Riesgo, reglas personales y alertas', icon: <Settings2 className={iconClass} /> }],
  },
]

export default function TradingDashboard() {
  const { data, loading, error } = useLoader(getDashboard)

  return (
    <PageShell title="Trading Risk Manager" subtitle="Tu administrador financiero y de riesgo">
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent px-5 py-6 text-center">
        <p className="text-base lg:text-lg font-bold tracking-wide text-[var(--text-primary)]">
          NO SE TRATA DE GANAR CADA TRADE.
        </p>
        <p className="text-base lg:text-lg font-bold tracking-wide text-emerald-400">
          SE TRATA DE SOBREVIVIR, CRECER Y REPETIR.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2">{PHILOSOPHY}</p>
      </div>

      <ErrorNote message={error} />

      {loading && !data ? (
        <SkeletonChartCard height={260} />
      ) : data ? (
        <>
          <RiskHero data={data} />

          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Hoy" className="lg:col-span-1">
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="P&L de hoy" value={signedMoney(data.risk.today.pnl)} valueClass={pnlClass(data.risk.today.pnl)} />
                <StatTile label="P&L semana" value={signedMoney(data.risk.week.pnl)} valueClass={pnlClass(data.risk.week.pnl)} />
                <StatTile
                  label="Operaciones"
                  value={`${data.risk.today.trades} / ${data.profile.maxTradesPerDay}`}
                  hint={`Te quedan ${data.risk.today.tradesRemaining}`}
                />
                <StatTile
                  label="Stops que caben hoy"
                  value={data.risk.today.lossesAffordable}
                  hint={`a ${money(data.risk.riskPerTrade)} cada uno`}
                />
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-caption text-[var(--text-muted)]">
                  <span>Pérdida diaria usada</span>
                  <span>
                    {money(data.risk.today.lossUsed)} / {money(data.risk.today.lossLimit)}
                  </span>
                </div>
                <ProgressBar
                  value={data.risk.today.lossLimit ? data.risk.today.lossUsed / data.risk.today.lossLimit : 0}
                  barClass="bg-red-500"
                />
                <div className="flex justify-between text-caption text-[var(--text-muted)] pt-1">
                  <span>Pérdida semanal usada</span>
                  <span>
                    {money(data.risk.week.lossUsed)} / {money(data.risk.week.lossLimit)}
                  </span>
                </div>
                <ProgressBar
                  value={data.risk.week.lossLimit ? data.risk.week.lossUsed / data.risk.week.lossLimit : 0}
                  barClass="bg-orange-500"
                />
              </div>
            </Panel>

            <Panel
              title="Cuentas de fondeo"
              icon={<Trophy className={iconClass} />}
              actions={
                <Link to="/app/trading/funding" className="text-caption text-emerald-400 hover:text-emerald-300">
                  Ver todas
                </Link>
              }
            >
              {data.fundingAccounts.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Aún no registras challenges.{' '}
                  <Link to="/app/trading/funding" className="text-emerald-400">
                    Añade tu primera cuenta
                  </Link>
                  .
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.fundingAccounts.slice(0, 4).map(a => (
                    <li key={a.id}>
                      <Link to={`/app/trading/challenge?account=${a.id}`} className="block group">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[var(--text-primary)] truncate group-hover:underline">
                            {HEALTH_META[a.summary.health].emoji} {a.firmName} · {money(a.accountSize)}
                          </span>
                          <span className={pnlClass(a.summary.profit)}>{signedMoney(a.summary.profit)}</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar value={a.summary.progressPct} barClass={HEALTH_META[a.summary.health].bar} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Rendimiento y finanzas" icon={<BarChart3 className={iconClass} />}>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Win rate" value={ratioPct(data.stats.winRate)} hint={`${data.stats.total} operaciones`} />
                <StatTile label="Expectancy" value={rMultiple(data.stats.expectancyR)} valueClass={pnlClass(data.stats.expectancyR)} />
                <StatTile label="Profit factor" value={data.stats.profitFactor?.toFixed(2) ?? '—'} />
                <StatTile label="Resultado neto" value={signedMoney(data.stats.net)} valueClass={pnlClass(data.stats.net)} />
                <StatTile label="Ingresos del mes" value={money(data.finance.total)} />
                <StatTile label="Payouts recibidos" value={money(data.payouts.total)} hint={`${data.payouts.count} en total`} />
              </div>
            </Panel>
          </div>

          {data.recentTrades.length > 0 && (
            <Panel
              title="Últimas operaciones"
              icon={<BookOpen className={iconClass} />}
              actions={
                <Link to="/app/trading/journal" className="text-caption text-emerald-400 hover:text-emerald-300">
                  Abrir diario
                </Link>
              }
            >
              <ul className="divide-y divide-[var(--border)]">
                {data.recentTrades.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                    <span className="text-[var(--text-secondary)] truncate">
                      <span className={t.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}>
                        {t.direction === 'LONG' ? '▲' : '▼'}
                      </span>{' '}
                      <span className="font-medium text-[var(--text-primary)]">{t.asset}</span>
                      {t.setup ? ` · ${t.setup}` : ''} · {new Date(t.tradeDate).toLocaleDateString()}
                    </span>
                    <span className={`tabular-nums ${pnlClass(t.resultAmount)}`}>
                      {signedMoney(t.resultAmount)} {t.resultR != null && `(${rMultiple(t.resultR)})`}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {AREAS.map(area => (
          <div key={area.title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{area.title}</p>
            <p className="text-caption text-[var(--text-muted)] mb-3">{area.brain}</p>
            <ul className="space-y-1">
              {area.links.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition"
                  >
                    <span className="text-[var(--text-muted)]">{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function RiskHero({ data }: { data: TradingDashboardData }) {
  const { risk, profile } = data
  const meta = ALERT_META[risk.level]
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className={`rounded-xl border p-5 flex flex-col justify-center gap-2 ${meta.className}`}>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          {meta.icon}
          {meta.emoji} {meta.label}
        </div>
        <p className="text-sm text-[var(--text-primary)]">{risk.headline}</p>
        {risk.alerts.length > 0 && (
          <ul className="mt-1 space-y-1">
            {risk.alerts.map(a => (
              <li key={a.code} className="text-xs text-[var(--text-secondary)]">
                {ALERT_META[a.level].emoji} {a.message}
              </li>
            ))}
          </ul>
        )}
        <Link to="/app/trading/settings" className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1">
          Ajustar mis reglas →
        </Link>
      </div>

      <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3 content-center">
        <StatTile label="Capital" value={money(risk.capital, profile.baseCurrency)} hint={`Pico: ${money(risk.peakCapital)}`} />
        <StatTile
          label="Riesgo permitido"
          value={money(risk.riskPerTrade, profile.baseCurrency)}
          hint={`${profile.riskPerTradePct}% por operación`}
        />
        <StatTile
          label="Pérdida diaria"
          value={money(risk.today.lossRemaining, profile.baseCurrency)}
          hint={`restante de ${money(risk.today.lossLimit)}`}
        />
        <StatTile
          label="Drawdown actual"
          value={ratioPct(risk.drawdownPct)}
          valueClass={risk.drawdownPct > 0 ? 'text-orange-400' : 'text-[var(--text-primary)]'}
          hint={`Máximo permitido ${profile.maxDrawdownPct}%`}
        />
      </div>
    </div>
  )
}
