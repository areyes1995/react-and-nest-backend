// ──────────────────────────────────────────────
// Menu config — navegación general de la app.
// Define los items del menú lateral (quick links y
// secciones estáticas). Cada item puede exigir un
// permiso RBAC vía el campo `permission`:
//
//   - `permission` definido → el item solo se ve si
//     el usuario posee ese permiso.
//   - `permission` ausente → se omite la validación
//     y el item siempre se muestra.
//
// Sigue el mismo patrón que `RecordViewOption.permission`
// de records.config (ej. `rag:upload-view`).
// ──────────────────────────────────────────────

import {
  Home,
  Users,
  KeyRound,
  ShieldCheck,
  Bell,
  Settings,
} from 'lucide-react'
import type { StaticSidebarItem, StaticSidebarSection } from '@records/types'

/** Quick links at the top of the sidebar — top-level product pages. */
export const QUICK_LINKS: StaticSidebarItem[] = [
  { icon: <Home className="w-4 h-4 text-blue-400" strokeWidth={1.5} />, label: 'Home Page', slug: 'home', path: '/app/home' },
  
]

/** Static sidebar sections — product areas grouping navigable links. */
export const STATIC_SECTIONS: StaticSidebarSection[] = [
  {
    title: 'Actions',
    items: [
      { icon: <Bell className="w-4 h-4 text-blue-400" strokeWidth={1.5} />, label: 'Notifications', slug: 'notifications', path: '/app/notifications', permission: 'notification:read' },
    ],
  },
  {
    title: 'Management',
    items: [
      { icon: <Users className="w-4 h-4 text-blue-400" strokeWidth={1.5} />, label: 'Users', slug: 'users', path: '/app/records/users', permission: 'module:permissions' },
      { icon: <Settings className="w-4 h-4 text-blue-400" strokeWidth={1.5} />, label: 'Pabellones', slug: 'pavilions', path: '/app/admin/config', permission: 'module:permissions' },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: <KeyRound className="w-4 h-4" strokeWidth={1.5} />, label: 'Roles', slug: 'roles', path: '/app/records/roles', permission: 'module:permissions' },
      { icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />, label: 'Permissions', slug: 'permissions', path: '/app/records/permissions', permission: 'module:permissions' },
    ],
  },
]
