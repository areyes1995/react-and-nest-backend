// ──────────────────────────────────────────────
// Barra superior — "¿qué puedo hacer en el curso?"
// La barra lateral responde a "¿dónde está esto?";
// la superior responde a "¿qué actividades tiene el
// curso?". Por eso agrupa los mismos destinos por
// tipo de actividad — aprender, practicar, medir —
// y no por sección de la aplicación.
//
// Los items no se redeclaran: se toman de
// nav.config para que añadir una página en un sitio
// la haga aparecer en los dos.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { BookOpen, LineChart, ShieldCheck, Spade, Wrench } from 'lucide-react'
import { ALL_NAV_ITEMS, type NavItem } from './nav.config'

export interface AppBarGroup {
  id: string
  /** Clave i18n del rótulo del menú. */
  label: string
  /** Clave i18n de la frase que encabeza el desplegable. */
  description: string
  icon: ReactNode
  items: NavItem[]
  /** Permiso RBAC necesario para ver el grupo entero. */
  permission?: string
}

/** Resuelve items por slug conservando el orden pedido. */
function pick(...slugs: string[]): NavItem[] {
  return slugs
    .map(slug => ALL_NAV_ITEMS.find(item => item.slug === slug))
    .filter((item): item is NavItem => Boolean(item))
}

const groupIcon = 'w-4 h-4'

export const APP_BAR_GROUPS: AppBarGroup[] = [
  {
    id: 'learn',
    label: 'appbar.learn',
    description: 'appbar.learn.desc',
    icon: <BookOpen className={groupIcon} strokeWidth={1.5} />,
    items: pick('learn', 'classes', 'articles', 'videos', 'quiz', 'glossary', 'saved'),
  },
  {
    id: 'practice',
    label: 'appbar.practice',
    description: 'appbar.practice.desc',
    icon: <Spade className={groupIcon} strokeWidth={1.5} />,
    items: pick('play', 'trainer'),
  },
  {
    id: 'tools',
    label: 'appbar.tools',
    description: 'appbar.tools.desc',
    icon: <Wrench className={groupIcon} strokeWidth={1.5} />,
    items: pick('equity', 'ranges', 'odds'),
  },
  {
    id: 'progress',
    label: 'appbar.progress',
    description: 'appbar.progress.desc',
    icon: <LineChart className={groupIcon} strokeWidth={1.5} />,
    items: pick('progress', 'achievements', 'hands'),
  },
  {
    id: 'manage',
    label: 'appbar.manage',
    description: 'appbar.manage.desc',
    icon: <ShieldCheck className={groupIcon} strokeWidth={1.5} />,
    items: pick('notifications', 'users', 'roles', 'permissions', 'admin'),
    permission: 'module:permissions',
  },
]

/** El destino de "Inicio", que va suelto a la izquierda de los grupos. */
export const APP_BAR_HOME: NavItem = pick('home')[0]

/**
 * Grupo al que pertenece una ruta, para marcar el menú activo.
 * Se compara por prefijo porque `/app/classes/curso/clase` sigue siendo
 * "Aprender".
 */
export function activeGroupId(pathname: string): string | undefined {
  const match = APP_BAR_GROUPS.find(group =>
    group.items.some(item => pathname === item.path || pathname.startsWith(`${item.path}/`)),
  )
  return match?.id
}
