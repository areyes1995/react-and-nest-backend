// ──────────────────────────────────────────────
// Navegación — estructura de la barra lateral.
// Pocas secciones y nombres literales: "Clases",
// "Artículos", "Videos". La barra responde a una
// sola pregunta — ¿dónde está lo que busco? — y el
// panel contextual se encarga del detalle.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import {
  Home,
  Percent,
  Route,
  GraduationCap,
  FileText,
  PlayCircle,
  BookA,
  Spade,
  Calculator,
  Grid3x3,
  Brain,
  BarChart3,
  Trophy,
  History,
  Users,
  ShieldCheck,
  KeyRound,
  Settings,
  Bell,
  LibraryBig,
  Bookmark,
  MessageCircleQuestion,
  Crown,
} from 'lucide-react'

export interface NavItem {
  /** Clave i18n de la etiqueta. */
  label: string
  path: string
  icon: ReactNode
  /** Identificador usado para marcar el item activo. */
  slug: string
  /** Clave i18n de la frase que explica para qué sirve (menús de la barra superior). */
  description?: string
  /** Permiso RBAC necesario para verlo. */
  permission?: string
  /** Coincide también con las subrutas (`/app/classes/...`). */
  matchPrefix?: boolean
  /** De pago: sin suscripción se marca con una corona (features/access/rules.ts). */
  premium?: boolean
}

export interface NavSection {
  /** Clave i18n del título; vacío para el bloque principal sin cabecera. */
  title: string
  items: NavItem[]
}

const iconClass = 'w-4 h-4'

/** Accesos principales — siempre visibles, sin cabecera de sección. */
export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'nav.home',
    path: '/app/home',
    slug: 'home',
    description: 'nav.desc.home',
    icon: <Home className={iconClass} strokeWidth={1.5} />,
  },
  {
    label: 'nav.path',
    path: '/app/learn',
    slug: 'learn',
    description: 'nav.desc.path',
    icon: <Route className={iconClass} strokeWidth={1.5} />,
    matchPrefix: true,
  },
  {
    label: 'nav.play',
    path: '/app/play',
    premium: true,
    slug: 'play',
    description: 'nav.desc.play',
    icon: <Spade className={iconClass} strokeWidth={1.5} />,
    matchPrefix: true,
  },
]

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'nav.section.learn',
    items: [
      {
        label: 'nav.classes',
        path: '/app/classes',
        slug: 'classes',
        description: 'nav.desc.classes',
        icon: <GraduationCap className={iconClass} strokeWidth={1.5} />,
        matchPrefix: true,
      },
      {
        label: 'nav.articles',
        path: '/app/articles',
        slug: 'articles',
        description: 'nav.desc.articles',
        icon: <FileText className={iconClass} strokeWidth={1.5} />,
        matchPrefix: true,
      },
      {
        label: 'nav.videos',
        path: '/app/videos',
        premium: true,
        slug: 'videos',
        description: 'nav.desc.videos',
        icon: <PlayCircle className={iconClass} strokeWidth={1.5} />,
        matchPrefix: true,
      },
      {
        label: 'nav.quiz',
        path: '/app/quiz',
        premium: true,
        slug: 'quiz',
        description: 'nav.desc.quiz',
        icon: <MessageCircleQuestion className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.glossary',
        path: '/app/glossary',
        slug: 'glossary',
        description: 'nav.desc.glossary',
        icon: <BookA className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.saved',
        path: '/app/saved',
        premium: true,
        slug: 'saved',
        description: 'nav.desc.saved',
        icon: <Bookmark className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.tools',
    items: [
      {
        label: 'nav.equity',
        path: '/app/tools/equity',
        slug: 'equity',
        description: 'nav.desc.equity',
        icon: <Calculator className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.ranges',
        path: '/app/tools/ranges',
        premium: true,
        slug: 'ranges',
        description: 'nav.desc.ranges',
        icon: <Grid3x3 className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.odds',
        path: '/app/tools/odds',
        premium: true,
        slug: 'odds',
        description: 'nav.desc.odds',
        icon: <Percent className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.trainer',
        path: '/app/tools/trainer',
        premium: true,
        slug: 'trainer',
        description: 'nav.desc.trainer',
        icon: <Brain className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.progress',
    items: [
      {
        label: 'nav.stats',
        path: '/app/progress',
        slug: 'progress',
        description: 'nav.desc.stats',
        icon: <BarChart3 className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.achievements',
        path: '/app/progress/achievements',
        slug: 'achievements',
        description: 'nav.desc.achievements',
        icon: <Trophy className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.hands',
        path: '/app/progress/hands',
        slug: 'hands',
        description: 'nav.desc.hands',
        icon: <History className={iconClass} strokeWidth={1.5} />,
      },
      {
        label: 'nav.subscription',
        path: '/app/subscription',
        slug: 'subscription',
        description: 'nav.desc.subscription',
        icon: <Crown className={iconClass} strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: 'nav.section.manage',
    items: [
      {
        label: 'nav.notifications',
        path: '/app/notifications',
        slug: 'notifications',
        description: 'nav.desc.notifications',
        icon: <Bell className={iconClass} strokeWidth={1.5} />,
        permission: 'notification:read',
      },
      {
        label: 'nav.students',
        path: '/app/records/users',
        slug: 'users',
        description: 'nav.desc.students',
        icon: <Users className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.roles',
        path: '/app/records/roles',
        slug: 'roles',
        description: 'nav.desc.roles',
        icon: <KeyRound className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.permissions',
        path: '/app/records/permissions',
        slug: 'permissions',
        description: 'nav.desc.permissions',
        icon: <ShieldCheck className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.contentAdmin',
        path: '/app/admin/content',
        slug: 'content-admin',
        description: 'nav.desc.contentAdmin',
        icon: <LibraryBig className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
      {
        label: 'nav.admin',
        path: '/app/admin',
        slug: 'admin',
        description: 'nav.desc.admin',
        icon: <Settings className={iconClass} strokeWidth={1.5} />,
        permission: 'module:permissions',
      },
    ],
  },
]

/** Todos los items en una lista plana, para resolver el item activo. */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...NAV_SECTIONS.flatMap(section => section.items),
]
