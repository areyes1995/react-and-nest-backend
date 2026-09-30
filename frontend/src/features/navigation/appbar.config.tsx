// ──────────────────────────────────────────────
// Barra superior — starter mínimo.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { LayoutDashboard, LineChart, Trophy, Wallet } from 'lucide-react'
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
    id: 'trading',
    label: 'appbar.trading',
    description: 'appbar.trading.desc',
    icon: <LineChart className={groupIcon} strokeWidth={1.5} />,
    items: pick('trading-risk', 'trading-journal', 'trading-stats'),
  },
  {
    id: 'funding',
    label: 'appbar.funding',
    description: 'appbar.funding.desc',
    icon: <Trophy className={groupIcon} strokeWidth={1.5} />,
    items: pick('trading-funding', 'trading-challenge'),
  },
  {
    id: 'finance',
    label: 'appbar.finance',
    description: 'appbar.finance.desc',
    icon: <Wallet className={groupIcon} strokeWidth={1.5} />,
    items: pick('trading-finance', 'trading-payouts', 'trading-growth', 'trading-settings'),
  },
  {
    id: 'manage',
    label: 'appbar.manage',
    description: 'appbar.manage.desc',
    icon: <LayoutDashboard className={groupIcon} strokeWidth={1.5} />,
    items: pick('users', 'roles', 'permissions', 'notifications'),
    permission: 'module:permissions',
  },
]

export const APP_BAR_HOME: NavItem = pick('trading')[0]

export function activeGroupId(pathname: string): string | undefined {
  const match = APP_BAR_GROUPS.find(group =>
    group.items.some(item => pathname === item.path || pathname.startsWith(`${item.path}/`)),
  )
  return match?.id
}
