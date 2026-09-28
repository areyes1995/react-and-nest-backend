// ──────────────────────────────────────────────
// AppBar — barra superior mínima del starter.
// Enlace a inicio + campana de notificaciones.
// ──────────────────────────────────────────────

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'
import NotificationsBell from '@components/notifications/NotificationBell'

export default function AppBar() {
  const { t } = useAppTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/app/home'

  return (
    <div className="flex items-center gap-2 px-3 lg:px-5 h-[3.25rem] border-b border-[var(--border)] bg-[var(--bg-main)] shrink-0 relative z-30">
      <button
        type="button"
        onClick={() => navigate('/app/home')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-medium whitespace-nowrap transition-colors ${
          isHome
            ? 'text-[var(--text-primary)] bg-[var(--bg-surface)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
        }`}
      >
        <Home className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{t('nav.home')}</span>
      </button>

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <Link
          to="/app/notifications"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2"
        >
          {t('nav.notifications')}
        </Link>
        <NotificationsBell />
      </div>
    </div>
  )
}
