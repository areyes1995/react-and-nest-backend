// ──────────────────────────────────────────────
// DashboardLayout — 3-column layout shell
// Responsive: en móvil los paneles laterales se
// convierten en drawers deslizantes (off-canvas).
// ──────────────────────────────────────────────

import { useState, type ReactNode } from 'react'
import { LayoutGrid, Menu, X } from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'
import NotificationsBell from '@components/notifications/NotificationBell'

export interface DashboardLayoutProps {
  sidebar: ReactNode
  menuPanel?: ReactNode
  mainContent: ReactNode
  /** Barra superior de actividades. Ocupa el ancho del área principal. */
  appBar?: ReactNode
  /** Franja opcional bajo la barra superior. */
  guideBar?: ReactNode
}

export default function DashboardLayout({
  sidebar,
  menuPanel,
  mainContent,
  appBar,
  guideBar,
}: DashboardLayoutProps) {
  const { t } = useAppTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const closeBoth = () => {
    setSidebarOpen(false)
    setMenuOpen(false)
  }

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-secondary)] font-sans antialiased h-dvh overflow-hidden flex select-none">
      {/* ─── Sidebar: estático en lg+, drawer en móvil ─── */}
      <div
        data-tour="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-60 h-full transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:transition-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <button
          onClick={closeBoth}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden z-10"
          title={t('Close')}
        >
          <X className="w-4 h-4" />
        </button>
        {sidebar}
      </div>

      {/* ─── Menu panel: solo si se provee (el starter no lo usa) ─── */}
      {menuPanel && (
        <div
          data-tour="panel"
          className={`fixed inset-y-0 left-0 z-40 h-full transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:transition-none ${
            menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {menuPanel}
        </div>
      )}

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* ─── Mobile top bar (lg:hidden) ─── */}
        <div className="flex items-center gap-2 px-3 h-12 border-b border-[var(--border)] bg-[var(--bg-main)] shrink-0 lg:hidden">
          <button
            onClick={() => { setMenuOpen(false); setSidebarOpen(o => !o) }}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[#f2a93b] hover:bg-[var(--bg-surface)] transition"
            title={t('Toggle sidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{t('app.name')}</span>
          <button
            onClick={() => { setSidebarOpen(false); setMenuOpen(o => !o) }}
            className="ml-auto p-2 rounded-lg text-[var(--text-muted)] hover:text-[#f2a93b] hover:bg-[var(--bg-surface)] transition"
            title={t('Toggle menu')}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Backdrop para drawers en móvil ─── */}
        {(sidebarOpen || menuOpen) && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={closeBoth}
          />
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {appBar ?? (
            <div className="flex items-center justify-end px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-main)] shrink-0">
              <NotificationsBell />
            </div>
          )}
          {guideBar}
          <main className="flex-1 min-h-0 bg-[var(--bg-main)] flex flex-col overflow-hidden relative bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-app)] min-w-0">
            {mainContent}
          </main>
        </div>
      </div>
    </div>
  )
}