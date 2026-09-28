// ──────────────────────────────────────────────
// AppLayout — Shell protegido bajo /app
// Barra lateral fija + panel contextual + contenido.
// La navegación de la academia y la del módulo
// dinámico de records conviven: cada ruta decide
// cuál de las dos alimenta los paneles.
// ──────────────────────────────────────────────

import { Suspense, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Spade } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { ReloadNotificationProvider } from '@context/ReloadNotificationContext'
import DashboardLayout from './DashboardLayout'
import ScrollToTop from './ScrollToTop'
import { Sidebar } from '@components/sidebar'
import { MenuPanel } from '@components/menu'
import SettingsView from '@components/settings/SettingsView'
import CreateModuleView from '@components/settings/CreateModuleView'
import { Breadcrumbs, type BreadcrumbItem } from '@components/ui'
import ReloadNotificationBanner from '@components/ui/feedback/ReloadNotificationBanner'
// Import directo, no por el barril: '../content' reexporta ContentBlocks,
// que arrastra el motor de poker al chunk inicial de toda la web.
import StreakWidget from '@components/content/StreakWidget'
import AppBar from './AppBar'
import XpToast from './XpToast'
import NextStepBar from '@components/guide/NextStepBar'
import { GuideProvider, GuidedTour } from '@features/guide'
import { useRecordsDashboard } from '@records'
import { useAcademyNav } from '@features/navigation/useAcademyNav'
import { useCurriculum } from '@features/academy/CurriculumContext'
import CurriculumGate from '@features/academy/CurriculumGate'
import { findArticle } from '@features/articles/data'
import { findVideo } from '@features/videos/data'
import { ALL_NAV_ITEMS } from '@features/navigation/nav.config'
import { useAppTranslation } from '@i18n/useAppTranslation'

/** Marca de la plataforma en la cabecera de la barra lateral. */
function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1 pt-0.5">
      <span
        className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: 'var(--poker-gold)' }}
      >
        <Spade className="w-4 h-4 text-black" fill="currentColor" strokeWidth={0} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
          Poker Academy
        </p>
        <p className="text-mini text-[var(--text-muted)] leading-tight">Texas Hold'em</p>
      </div>
    </div>
  )
}

/**
 * Cuerpo del shell. Va en un componente aparte porque la barra superior y la
 * franja de guía consumen `useGuide()`, y un hook no puede leer un contexto que
 * su propio componente acaba de montar.
 */
function AppShell() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useAppTranslation()
  const { findCourse, findLesson } = useCurriculum()

  const isCreateModuleRoute = location.pathname === '/app/settings/create-module'
  const isSettingsRoute = !isCreateModuleRoute && location.pathname.startsWith('/app/settings')

  const academy = useAcademyNav()
  const records = useRecordsDashboard()

  // El itinerario desplegado tapa parte de la página: es un estado de la sesión,
  // no una preferencia que convenga recordar.
  const [journeyOpen, setJourneyOpen] = useState(false)

  // Las rutas de records conservan su propio panel contextual; el resto de la
  // aplicación usa el de la academia.
  const useRecordsPanel = academy.isRecordsRoute
  const menuTitle = useRecordsPanel ? (records.menuTitle ?? 'Records') : academy.menuTitle
  const menuItems = useRecordsPanel ? (records.menuItems ?? []) : academy.menuItems
  const menuCollapsed = useRecordsPanel ? records.menuCollapsed : academy.menuCollapsed
  const setMenuCollapsed = useRecordsPanel ? records.setMenuCollapsed : academy.setMenuCollapsed

  const crumbs = useMemo<BreadcrumbItem[]>(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = [{ label: 'nav.home', to: '/app/home' }]
    const section = segments[1]

    if (isCreateModuleRoute) {
      items.push({ label: 'settings.title', to: '/app/settings' })
      items.push({ label: 'settings.preferences.createModule' })
      return items
    }
    if (isSettingsRoute) {
      items.push({ label: 'settings.title', to: '/app/settings' })
      return items
    }

    if (section === 'classes') {
      items.push({ label: 'nav.classes', to: '/app/classes' })
      const course = segments[2] ? findCourse(segments[2]) : undefined
      if (course) {
        items.push({ label: course.title, to: `/app/classes/${course.slug}` })
        const lesson = segments[3] ? findLesson(course.slug, segments[3]) : undefined
        if (lesson) items.push({ label: lesson.title })
      }
      return items
    }

    if (section === 'articles') {
      items.push({ label: 'nav.articles', to: '/app/articles' })
      const article = segments[2] ? findArticle(segments[2]) : undefined
      if (article) items.push({ label: article.title })
      return items
    }

    if (section === 'videos') {
      items.push({ label: 'nav.videos', to: '/app/videos' })
      const video = segments[2] ? findVideo(segments[2]) : undefined
      if (video) items.push({ label: video.title })
      return items
    }

    if (section && section !== 'home') {
      const item = ALL_NAV_ITEMS.find(nav => nav.path === location.pathname)
        ?? ALL_NAV_ITEMS.find(nav => nav.slug === section)
      items.push({ label: item?.label ?? section })
    }

    return items
  }, [location.pathname, isCreateModuleRoute, isSettingsRoute, findCourse, findLesson])

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
        guideBar={<NextStepBar expanded={journeyOpen} onExpandedChange={setJourneyOpen} />}
        sidebar={
          <Sidebar
            sections={academy.sidebarSections}
            user={displayUser}
            header={<Brand />}
            footer={<StreakWidget />}
            onLogout={handleLogout}
            onSettings={() => {
              setMenuCollapsed(true)
              navigate('/app/settings')
            }}
          />
        }
        menuPanel={
          <MenuPanel
            title={menuTitle}
            items={menuItems}
            search={{}}
            collapsed={menuCollapsed}
            onCollapsedChange={setMenuCollapsed}
          />
        }
        mainContent={
          <>
            <ScrollToTop />
            <ReloadNotificationBanner />
            {/* En la mesa de práctica cada píxel de alto cuenta: en móvil y en
                pantallas bajas se ocultan las migas para que quepan las acciones. */}
            <div
              className={
                location.pathname === '/app/play'
                  ? 'hidden lg:block [@media(max-height:820px)]:hidden'
                  : 'contents'
              }
            >
              <Breadcrumbs items={crumbs} />
            </div>
            {isCreateModuleRoute ? (
              <CreateModuleView />
            ) : isSettingsRoute ? (
              <SettingsView />
            ) : (
              // Las páginas se cargan bajo demanda; este fallback cubre el
              // instante entre la navegación y la llegada del chunk.
              <Suspense
                fallback={
                  <div className="flex-1 grid place-items-center text-xs text-[var(--text-muted)]">
                    Cargando…
                  </div>
                }
              >
                <CurriculumGate>
                  <Outlet />
                </CurriculumGate>
              </Suspense>
            )}
          </>
        }
      />
    </ReloadNotificationProvider>
  )
}

export default function AppLayout() {
  return (
    <GuideProvider>
      <AppShell />
      {/* El recorrido se dibuja en un portal sobre todo lo demás. */}
      <GuidedTour />
      <XpToast />
    </GuideProvider>
  )
}
