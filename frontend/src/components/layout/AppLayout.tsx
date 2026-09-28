// ──────────────────────────────────────────────
// AppLayout — Shell protegido bajo /app (starter).
// Barra lateral fija + contenido. Sin panel contextual,
// sin guía, sin academia.
// ──────────────────────────────────────────────

import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { ReloadNotificationProvider } from '@context/ReloadNotificationContext'
import DashboardLayout from './DashboardLayout'
import ScrollToTop from './ScrollToTop'
import { Sidebar } from '@components/sidebar'
import { Breadcrumbs } from '@components/ui'
import ReloadNotificationBanner from '@components/ui/feedback/ReloadNotificationBanner'
import AppBar from './AppBar'
import { useAcademyNav } from '@features/navigation/useAcademyNav'
import { useAppTranslation } from '@i18n/useAppTranslation'

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1 pt-0.5">
      <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0 bg-[var(--poker-gold)]">
        <LayoutDashboard className="w-4 h-4 text-black" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
          Starter
        </p>
        <p className="text-mini text-[var(--text-muted)] leading-tight">Base project</p>
      </div>
    </div>
  )
}

function AppShell() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const academy = useAcademyNav()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayUser = {
    name: authUser?.name ?? t('nav.student'),
    subtitle:
      authUser?.email && authUser.email.length > 20
        ? `${authUser.email.slice(0, 20)}...`
        : authUser?.email,
    avatarUrl: authUser?.avatarUrl,
    status: 'online' as const,
  }

  return (
    <ReloadNotificationProvider>
      <DashboardLayout
        appBar={<AppBar />}
        sidebar={
          <Sidebar
            sections={academy.sidebarSections}
            user={displayUser}
            header={<Brand />}
            onLogout={handleLogout}
            onSettings={() => navigate('/app/settings')}
          />
        }
        mainContent={
          <>
            <ScrollToTop />
            <ReloadNotificationBanner />
            <Breadcrumbs items={[{ label: 'nav.home', to: '/app/home' }]} />
            <Suspense
              fallback={
                <div className="flex-1 grid place-items-center text-xs text-[var(--text-muted)]">
                  Cargando…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </>
        }
      />
    </ReloadNotificationProvider>
  )
}

export default function AppLayout() {
  return <AppShell />
}
