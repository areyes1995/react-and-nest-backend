// ──────────────────────────────────────────────
// Navegación — estructura de la barra lateral (starter).
// Solo lo esencial: dashboard, usuarios, roles,
// notificaciones y auditoría.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import {
  Home,
  Users,
  ShieldCheck,
  KeyRound,
  Bell,
  ScrollText,
  Cpu,
  Database,
  Gauge,
  Calculator,
  BookOpen,
  BarChart3,
  Trophy,
  Target,
  Wallet,
  Coins,
  LineChart,
  Settings2,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: ReactNode
  slug: string
  description?: string
  permission?: string
  matchPrefix?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

const iconClass = 'w-4 h-4'

export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'nav.trading',
    path: '/app/trading',
    slug: 'trading',
    description: 'nav.desc.trading',
    icon: <Gauge className={iconClass} strokeWidth={1.5} />,
  },
  {
    label: 'nav.home',
    path: '/app/home',
    slug: 'home',
    description: 'nav.desc.home',
    icon: <Home className={iconClass} strokeWidth={1.5} />,
  },
]

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'nav.section.trading',
    items: [
      {
        label: 'nav.tradingRisk',
        path: '/app/trading/risk',
        slug: 'trading-risk',
        description: 'nav.desc.tradingRisk',
        icon: <Calculator className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingJournal',
        path: '/app/trading/journal',
        slug: 'trading-journal',
        description: 'nav.desc.tradingJournal',
        icon: <BookOpen className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingStats',
        path: '/app/trading/stats',
        slug: 'trading-stats',
        description: 'nav.desc.tradingStats',
        icon: <BarChart3 className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.funding',
    items: [
      {
        label: 'nav.tradingFunding',
        path: '/app/trading/funding',
        slug: 'trading-funding',
        description: 'nav.desc.tradingFunding',
        icon: <Trophy className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingChallenge',
        path: '/app/trading/challenge',
        slug: 'trading-challenge',
        description: 'nav.desc.tradingChallenge',
        icon: <Target className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.finance',
    items: [
      {
        label: 'nav.tradingFinance',
        path: '/app/trading/finance',
        slug: 'trading-finance',
        description: 'nav.desc.tradingFinance',
        icon: <Wallet className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingPayouts',
        path: '/app/trading/payouts',
        slug: 'trading-payouts',
        description: 'nav.desc.tradingPayouts',
        icon: <Coins className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingGrowth',
        path: '/app/trading/growth',
        slug: 'trading-growth',
        description: 'nav.desc.tradingGrowth',
        icon: <LineChart className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.tradingSettings',
        path: '/app/trading/settings',
        slug: 'trading-settings',
        description: 'nav.desc.tradingSettings',
        icon: <Settings2 className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.manage',
    items: [
      {
        label: 'nav.users',
        path: '/app/users',
        slug: 'users',
        description: 'nav.desc.users',
        icon: <Users className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
        matchPrefix: true,
      },
      {
        label: 'nav.roles',
        path: '/app/roles',
        slug: 'roles',
        description: 'nav.desc.roles',
        icon: <KeyRound className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.permissions',
        path: '/app/permissions',
        slug: 'permissions',
        description: 'nav.desc.permissions',
        icon: <ShieldCheck className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.notifications',
        path: '/app/notifications',
        slug: 'notifications',
        description: 'nav.desc.notifications',
        icon: <Bell className={iconClass} strokeWidth={1.5} />,
        permission: 'notification:read',
      },
    ],
  },
  {
    title: 'nav.section.ai',
    items: [
      {
        label: 'nav.aiAnalysis',
        path: '/app/ai',
        slug: 'ai',
        description: 'nav.desc.aiAnalysis',
        icon: <Cpu className={iconClass} strokeWidth={1.5} />,
        permission: 'ai-analysis:read',
      },
      {
        label: 'nav.rag',
        path: '/app/rag',
        slug: 'rag',
        description: 'nav.desc.rag',
        icon: <Database className={iconClass} strokeWidth={1.5} />,
        permission: 'rag:read',
      },
      {
        label: 'nav.logs',
        path: '/app/logs',
        slug: 'logs',
        description: 'nav.desc.logs',
        icon: <ScrollText className={iconClass} strokeWidth={1.5} />,
        permission: 'system-log:read',
      },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...NAV_SECTIONS.flatMap(section => section.items),
]
