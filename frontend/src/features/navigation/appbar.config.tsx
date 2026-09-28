// ──────────────────────────────────────────────
// Barra superior — starter mínimo.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { ALL_NAV_ITEMS, type NavItem } from './nav.config'

export interface AppBarGroup {
  id: string
  label: string
  description: string
  icon: ReactNode
  items: NavItem[]
  permission?: string
}

function pick(...slugs: string[]): NavItem[] {
  return slugs
    .map(slug => ALL_NAV_ITEMS.find(item => item.slug === slug))
    .filter((item): item is NavItem => Boolean(item))
}

const groupIcon = 'w-4 h-4'

export const APP_BAR_GROUPS: AppBarGroup[] = [
  {
    id: 'manage',
    label: 'appbar.manage',
    description: 'appbar.manage.desc',
    icon: <LayoutDashboard className={groupIcon} strokeWidth={1.5} />,
    items: pick('users', 'roles', 'permissions', 'notifications'),
    permission: 'module:permissions',
  },
]

export const APP_BAR_HOME: NavItem = pick('home')[0]

export function activeGroupId(pathname: string): string | undefined {
  const match = APP_BAR_GROUPS.find(group =>
    group.items.some(item => pathname === item.path || pathname.startsWith(`${item.path}/`)),
  )
  return match?.id
}
