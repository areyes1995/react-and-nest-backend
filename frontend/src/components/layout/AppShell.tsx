import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { teacherApi } from '@services/educraft'
import type { TeacherProfile } from '@services/types'
import { Spinner } from '@components/ui'
import { LogoMark } from '@components/brand/Logo'
import { AssistantProvider } from '@context/AssistantContext'
import { Sidebar } from './Sidebar'
import { SearchBox } from './SearchBox'
import { HelpMenu, MessagesMenu, NotificationsMenu, UserMenu } from './TopbarMenus'
import { AssistantDrawer } from './AssistantDrawer'

export interface ShellContext {
  profile: TeacherProfile | null
  setProfile: (p: TeacherProfile) => void
}

/** Estructura principal: marco degradado, menú lateral fijo y área de contenido. */
export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const location = useLocation()

  useEffect(() => {
    teacherApi.profile().then(setProfile).catch(() => setProfile(null))
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    document.getElementById('app-main')?.scrollTo({ top: 0 })
  }, [location.pathname])

  const sidebarProfile = {
    title: profile?.teacherProfile.displayTitle,
    specialty: profile?.teacherProfile.specialty,
    avatarUrl: profile?.teacherProfile.avatarUrl,
  }

  return (
    <AssistantProvider>
      <div className="frame flex h-dvh overflow-hidden sm:p-3 lg:p-4">
        {/* Menú lateral: fijo en escritorio, cajón en móvil */}
        <div className="hidden shrink-0 lg:block">
          <Sidebar profile={sidebarProfile} />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-[65] lg:hidden">
            <div className="absolute inset-0 bg-[var(--overlay)]" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 animate-fade-in p-2">
              <Sidebar profile={sidebarProfile} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-4">
          <header className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-2 sm:pb-3 sm:pt-0">
            <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
            <LogoMark size={30} className="lg:hidden" />
            <div className="mx-auto flex min-w-0 flex-1 justify-center">
              <SearchBox />
            </div>
            <div className="flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-card">
              <NotificationsMenu />
              <MessagesMenu />
              <HelpMenu />
            </div>
            <UserMenu profile={profile} onProfileChange={setProfile} />
          </header>

          <main id="app-main" className="scroll-area min-h-0 flex-1 px-3 pb-6 sm:px-2">
            <Suspense fallback={<Spinner label="Cargando…" />}>
              <Outlet context={{ profile, setProfile } satisfies ShellContext} />
            </Suspense>
          </main>
        </div>
      </div>
      <AssistantDrawer />
    </AssistantProvider>
  )
}
