// ──────────────────────────────────────────────
// AdminOverview — Panel admin simplificado (/app/home)
// Solo usuarios, RBAC y notificaciones. Sin
// proyectos, stands, ferias, métricas ni RAG.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Bell,
  ShieldCheck,
  KeyRound,
  Cable,
  Settings,
  PlusSquare,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { useAdminDashboard } from './useAdminDashboard'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { KpiCard } from '@components/charts'
import { SectionTitle } from '@components/ui'
import { useAppTranslation } from '@i18n/useAppTranslation'

function SkeletonCard({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-4 ${height} animate-pulse`}>
      <div className="h-3 w-24 bg-[var(--bg-surface)] rounded mb-4" />
      <div className="h-8 w-16 bg-[var(--bg-surface)] rounded" />
    </div>
  )
}

export default function AdminOverview() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    totalUsers,
    recentUsers,
    totalRoles,
    totalPermissions,
    unreadNotifications,
    recentNotifications,
    loading,
    error,
    reload,
  } = useAdminDashboard()

  const quickActions = useMemo(() => {
    const can = (perm: string) => (user ? hasPermission(user, perm) : false)
    const canRbac = can('module:permissions')
    const items = [
      { label: t('admin.users'), desc: t('home.quick.usersDesc'), icon: <Users className="w-5 h-5" />, path: '/app/records/users', color: 'text-blue-400', bg: 'bg-blue-400/10', show: canRbac },
      { label: t('admin.roles'), desc: t('home.quick.rolesDesc'), icon: <KeyRound className="w-5 h-5" />, path: '/app/records/roles', color: 'text-violet-400', bg: 'bg-violet-400/10', show: canRbac },
      { label: t('admin.permissions'), desc: t('home.quick.permissionsDesc'), icon: <ShieldCheck className="w-5 h-5" />, path: '/app/records/permissions', color: 'text-emerald-400', bg: 'bg-emerald-400/10', show: canRbac },
      { label: t('Connections'), desc: t('home.quick.connectionsDesc'), icon: <Cable className="w-5 h-5" />, path: '/app/connections', color: 'text-teal-400', bg: 'bg-teal-400/10', show: true },
      { label: t('home.quick.createModule'), desc: t('home.quick.createModuleDesc'), icon: <PlusSquare className="w-5 h-5" />, path: '/app/settings/create-module', color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', show: true },
      { label: t('settings.title'), desc: t('home.quick.settingsDesc'), icon: <Settings className="w-5 h-5" />, path: '/app/settings', color: 'text-gray-300', bg: 'bg-gray-400/10', show: true },
    ]
    return items.filter(i => i.show)
  }, [user, t])

  return (
    <div className="flex-1 min-h-0 overflow-auto px-4 lg:px-6 pt-5 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              label={t('admin.users')}
              value={totalUsers}
              hint={`${totalRoles} ${t('admin.roles')} · ${totalPermissions} ${t('admin.permissions')}`}
              icon={<Users className="w-4 h-4" />}
              accentClass="text-sky-400"
            />
            <KpiCard
              label={t('admin.roles')}
              value={totalRoles}
              hint={`${totalPermissions} ${t('admin.permissions')}`}
              icon={<ShieldCheck className="w-4 h-4" />}
              accentClass="text-violet-400"
            />
            <KpiCard
              label={t('admin.notifications')}
              value={unreadNotifications}
              hint={`${recentNotifications.length} ${t('home.notificationsUnread')}`}
              icon={<Bell className="w-4 h-4" />}
              accentClass="text-amber-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {loading ? (
          <SkeletonCard height="h-72" />
        ) : (
          <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('admin.recentUsers')}</h3>
              <button
                onClick={() => navigate('/app/records/users')}
                className="ml-auto text-caption font-medium text-sky-400 hover:text-sky-300"
              >
                {t('common.viewAll')}
              </button>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">{t('No data available')}</p>
            ) : (
              <ul className="space-y-2.5">
                {recentUsers.map(u => (
                  <li key={u.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.isActive ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[var(--text-secondary)] truncate">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                        </p>
                        <p className="text-mini text-[var(--text-muted)] truncate">
                          {u.email} · {(u.roles ?? []).join(', ') || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] shrink-0 ml-3">
                      {u.isActive ? t('rbac.active') : t('rbac.inactive')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading ? (
          <SkeletonCard height="h-72" />
        ) : (
          <div className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('admin.notifications')}</h3>
              {unreadNotifications > 0 && (
                <span className="ml-auto text-mini font-medium text-amber-400 bg-amber-400/10 rounded-full px-2 py-0.5">
                  {unreadNotifications} {t('home.notificationsUnread')}
                </span>
              )}
            </div>
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">{t('No data available')}</p>
            ) : (
              <ul className="space-y-2.5">
                {recentNotifications.map(n => (
                  <li key={n.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-gray-400' : 'bg-amber-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[var(--text-secondary)] truncate">{n.title}</p>
                        <p className="text-mini text-[var(--text-muted)] truncate">{n.message}</p>
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] shrink-0 ml-3">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <SectionTitle className="mb-3">{t('admin.quickAccess')}</SectionTitle>
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
