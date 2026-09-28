// ──────────────────────────────────────────────
// DashboardHome — dashboard limpio del starter.
// Tarjetas de estado + accesos a los módulos base.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { Users, KeyRound, Bell, Cpu, Database, ScrollText } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { useAppTranslation } from '@i18n/useAppTranslation'

const iconClass = 'w-5 h-5'

export default function DashboardHome() {
  const { user } = useAuth()
  const { t } = useAppTranslation()

  const cards = [
    {
      to: '/app/users',
      icon: <Users className={iconClass} strokeWidth={1.5} />,
      title: t('nav.users'),
      desc: t('nav.desc.users'),
      permission: 'module:permissions',
    },
    {
      to: '/app/roles',
      icon: <KeyRound className={iconClass} strokeWidth={1.5} />,
      title: t('nav.roles'),
      desc: t('nav.desc.roles'),
      permission: 'module:permissions',
    },
    {
      to: '/app/notifications',
      icon: <Bell className={iconClass} strokeWidth={1.5} />,
      title: t('nav.notifications'),
      desc: t('nav.desc.notifications'),
      permission: 'notification:read',
    },
    {
      to: '/app/ai',
      icon: <Cpu className={iconClass} strokeWidth={1.5} />,
      title: t('nav.aiAnalysis'),
      desc: t('nav.desc.aiAnalysis'),
      permission: 'ai-analysis:read',
    },
    {
      to: '/app/rag',
      icon: <Database className={iconClass} strokeWidth={1.5} />,
      title: t('nav.rag'),
      desc: t('nav.desc.rag'),
      permission: 'rag:read',
    },
    {
      to: '/app/logs',
      icon: <ScrollText className={iconClass} strokeWidth={1.5} />,
      title: t('nav.logs'),
      desc: t('nav.desc.logs'),
      permission: 'system-log:read',
    },
  ].filter(card => !card.permission || hasPermission(user, card.permission))

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {t('dashboard.welcome', { name: user?.name ?? '' })}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 hover:border-[var(--border-active)] transition"
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-[var(--bg-surface)] text-[var(--poker-gold)] mb-3">
              {card.icon}
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{card.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
