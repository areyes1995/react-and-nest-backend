// ──────────────────────────────────────────────
// HomeOverview — Home page dashboard.
// Feeds KPIs, trends, department rotation, recent
// exits and quick-access modules from real API data
// (HR attrition + RAG + notifications).
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  TrendingDown,
  FileText,
  UserMinus,
  LayoutGrid,
  PieChart as PieChartIcon,
  Boxes,
  Activity,
  PlusSquare,
  Settings,
  Cable,
  ShieldCheck,
  KeyRound,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { useHomeData } from '@hooks/useHomeData'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { KpiCard, DualAxisLineChart, CategoryBarList, DonutChart } from '@components/charts'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { SectionTitle } from '@components/ui'

const DEPT_COLORS = ['#f2a93b', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#f87171', '#fb923c', '#4ade80']

const exitTypeDot: Record<string, string> = {
  RESIGNATION: 'bg-red-400',
  TERMINATION: 'bg-rose-500',
  REDUCTION: 'bg-amber-400',
  RETIREMENT: 'bg-sky-400',
  OTHER: 'bg-gray-400',
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function SkeletonCard({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-4 ${height} animate-pulse`}>
      <div className="h-3 w-24 bg-[var(--bg-surface)] rounded mb-4" />
      <div className="h-8 w-16 bg-[var(--bg-surface)] rounded" />
    </div>
  )
}

export default function HomeOverview() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dashboard, trends, byDepartment, exitsDetail, ragStatus, unreadNotifications, loading, error, reload } =
    useHomeData()

  const chartData = useMemo(() => {
    return (trends?.months ?? []).map(m => ({
      month: formatMonth(m.month),
      left1: m.altas,
      left2: m.bajas,
      right: m.rotacionPct,
    }))
  }, [trends])

  const deptBars = useMemo(() => {
    return (byDepartment?.departments ?? [])
      .slice()
      .sort((a, b) => b.bajas - a.bajas)
      .map(d => ({
        name: d.name || t('attrition.noDepartment'),
        count: d.rotacionPct,
        subtitle: `${d.bajas} ${t('attrition.table.exits')} · ${d.headcount} ${t('attrition.chart.headcount')}`,
      }))
  }, [byDepartment, t])

  const deptDonut = useMemo(() => {
    const deps = (byDepartment?.departments ?? []).slice().sort((a, b) => b.bajas - a.bajas)
    return {
      items: deps.slice(0, 6).map((d, i) => ({
        name: d.name || t('attrition.noDepartment'),
        value: d.bajas,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      })),
      total: deps.reduce((sum, d) => sum + d.bajas, 0),
    }
  }, [byDepartment, t])

  const quickActions = useMemo(() => {
    const canPerms = user ? hasPermission(user, 'module:permissions') : false
    const items = [
      { label: t('sidebar.recordsView'), desc: t('home.quick.recordsDesc'), icon: <LayoutGrid className="w-5 h-5" />, path: '/app/records', color: 'text-sky-400', bg: 'bg-sky-400/10' },
      { label: t('attrition.title'), desc: t('home.quick.attritionDesc'), icon: <TrendingDown className="w-5 h-5" />, path: '/app/reports/attrition', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ]
    if (canPerms) {
      items.push({ label: 'Users', desc: t('home.quick.usersDesc'), icon: <Users className="w-5 h-5" />, path: '/app/records/users', color: 'text-blue-400', bg: 'bg-blue-400/10' })
      items.push({ label: 'Roles', desc: t('home.quick.rolesDesc'), icon: <KeyRound className="w-5 h-5" />, path: '/app/records/roles', color: 'text-violet-400', bg: 'bg-violet-400/10' })
      items.push({ label: 'Permissions', desc: t('home.quick.permissionsDesc'), icon: <ShieldCheck className="w-5 h-5" />, path: '/app/records/permissions', color: 'text-emerald-400', bg: 'bg-emerald-400/10' })
    }
    items.push(
      { label: t('home.quick.createModule'), desc: t('home.quick.createModuleDesc'), icon: <PlusSquare className="w-5 h-5" />, path: '/app/settings/create-module', color: 'text-pink-400', bg: 'bg-pink-400/10' },
      { label: t('settings.title'), desc: t('home.quick.settingsDesc'), icon: <Settings className="w-5 h-5" />, path: '/app/settings', color: 'text-gray-300', bg: 'bg-gray-400/10' },
      { label: t('Connections'), desc: t('home.quick.connectionsDesc'), icon: <Cable className="w-5 h-5" />, path: '/app/connections', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    )
    return items
  }, [user, t])

  const recentExits = useMemo(() => {
    return exitsDetail?.exits.slice(0, 6) ?? []
  }, [exitsDetail])

  return (
    <div className="flex-1 overflow-auto px-4 lg:px-6 pt-5 pb-24">
      {/* ── KPIs ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              label={t('attrition.kpi.totalEmployees')}
              value={dashboard?.totalEmployees ?? 0}
              hint={t('attrition.kpi.asOfPeriod')}
              icon={<Users className="w-4 h-4" />}
              accentClass="text-sky-400"
            />
            <KpiCard
              label={t('attrition.kpi.attritionRate')}
              value={dashboard?.attritionRate ?? 0}
              suffix="%"
              hint={t('attrition.kpi.leftThisPeriod')}
              icon={<TrendingDown className="w-4 h-4" />}
              accentClass="text-amber-400"
            />
            <KpiCard
              label={t('home.kpi.documents')}
              value={ragStatus?.totalDocuments ?? 0}
              hint={`${ragStatus?.totalChunks ?? 0} ${t('rag.chunks')}`}
              icon={<FileText className="w-4 h-4" />}
              accentClass="text-violet-400"
            />
            <KpiCard
              label={t('attrition.kpi.employeesLeft')}
              value={dashboard?.employeesLeft ?? 0}
              hint={`${dashboard?.terminationPct ?? 0}% ${t('attrition.kpi.terminationRate')}`}
              icon={<UserMinus className="w-4 h-4" />}
              accentClass="text-red-400"
            />
          </>
        )}
      </div>

      {/* ── Charts row ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {loading ? (
          <SkeletonCard height="h-[23.75rem]" />
        ) : (
          <DualAxisLineChart
            data={chartData}
            series={[
              { name: t('attrition.chart.altas'), key: 'left1', yAxis: 'left', strokeColor: '#34d399', strokeWidth: 2 },
              { name: t('attrition.chart.bajas'), key: 'left2', yAxis: 'left', strokeColor: '#f87171', strokeWidth: 2 },
              { name: t('attrition.chart.rotacion'), key: 'right', yAxis: 'right', strokeColor: '#f2a93b', strokeWidth: 2, strokeDasharray: '5 4' },
            ]}
            title={t('attrition.chart.trends')}
            height={380}
          />
        )}

        {loading ? (
          <SkeletonCard height="h-[23.75rem]" />
        ) : (
          <DonutChart
            title={t('attrition.donut.title')}
            icon={<PieChartIcon className="w-4 h-4 text-[var(--text-muted)]" />}
            items={deptDonut.items}
            total={deptDonut.total}
          />
        )}
      </div>

      {/* ── Departments + recent activity ────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {loading ? (
          <SkeletonCard height="h-72" />
        ) : (
          <CategoryBarList
            title={t('attrition.bar.byDepartment')}
            subtitle={t('attrition.bar.subtitle')}
            icon={<Boxes className="w-4 h-4 text-[var(--text-muted)]" />}
            items={deptBars}
            barClass="bg-amber-500"
          />
        )}

        {loading ? (
          <SkeletonCard height="h-72" />
        ) : (
          <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] h-full">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('home.recentExits')}</h3>
              {unreadNotifications > 0 && (
                <span className="ml-auto text-mini font-medium text-amber-400 bg-amber-400/10 rounded-full px-2 py-0.5">
                  {unreadNotifications} {t('home.notificationsUnread')}
                </span>
              )}
            </div>
            {recentExits.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">{t('No data available')}</p>
            ) : (
              <ul className="space-y-2.5">
                {recentExits.map(ex => (
                  <li key={ex.employeeId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${exitTypeDot[ex.exitType] ?? 'bg-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[var(--text-secondary)] truncate">{ex.employeeName || ex.employeeId}</p>
                        <p className="text-mini text-[var(--text-muted)] truncate">
                          {ex.department || t('attrition.noDepartment')}
                          {ex.reasonName ? ` · ${ex.reasonName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] shrink-0 ml-3">{ex.exitDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Quick access hub ─────────────────── */}
      <div className="mb-4">
        <SectionTitle className="mb-3">{t('home.quickAccess')}</SectionTitle>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-red-300">{error}</span>
          <button
            onClick={reload}
            className="flex items-center gap-1.5 text-xs font-medium text-red-200 hover:text-red-100 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('attrition.retry')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quickActions.map(action => (
          <button
            key={action.path + action.label}
            onClick={() => navigate(action.path)}
            className="group text-left bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                {action.icon}
              </span>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{action.label}</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}