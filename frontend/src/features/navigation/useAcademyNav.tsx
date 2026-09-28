// ──────────────────────────────────────────────
// useAppNav — barra lateral del starter.
// Sin academia, sin progreso, sin panel contextual:
// solo filtra por permiso RBAC.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SidebarSectionProps } from '@components/sidebar/SidebarSection'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { NAV_SECTIONS, PRIMARY_NAV } from './nav.config'

const MENU_COLLAPSED_KEY = 'starter_menu_collapsed'

export interface AcademyNav {
  sidebarSections: SidebarSectionProps[]
  menuTitle: string
  menuItems: never[]
  menuCollapsed: boolean
  setMenuCollapsed: (collapsed: boolean) => void
  isRecordsRoute: boolean
}

export function useAcademyNav(): AcademyNav {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(
    () => localStorage.getItem(MENU_COLLAPSED_KEY) === 'true',
  )

  const sidebarSections = useMemo<SidebarSectionProps[]>(() => {
    const isActive = (item: { path: string; matchPrefix?: boolean }) =>
      item.matchPrefix ? path.startsWith(item.path) : path === item.path
    const visible = (permission?: string) => !permission || hasPermission(user, permission)
    const go = (to: string) => {
      if (to !== path) navigate(to)
    }

    const primary = {
      title: '',
      items: PRIMARY_NAV.filter(item => visible(item.permission)).map(item => ({
        icon: item.icon,
        label: item.label,
        active: isActive(item),
        onClick: () => go(item.path),
      })),
    }

    const sections = NAV_SECTIONS.map(navSection => ({
      title: navSection.title,
      items: navSection.items
        .filter(item => visible(item.permission))
        .map(item => ({
          icon: item.icon,
          label: item.label,
          active: isActive(item),
          onClick: () => go(item.path),
        })),
    })).filter(navSection => navSection.items.length > 0)

    return [primary, ...sections]
  }, [path, user, navigate])

  return {
    sidebarSections,
    menuTitle: '',
    menuItems: [],
    menuCollapsed,
    setMenuCollapsed: (v: boolean) => {
      setMenuCollapsed(v)
      localStorage.setItem(MENU_COLLAPSED_KEY, String(v))
    },
    isRecordsRoute: false,
  }
}
