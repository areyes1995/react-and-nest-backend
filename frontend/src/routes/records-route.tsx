// ──────────────────────────────────────────────
// RecordsRoute — lógica de acceso al área de registros.
//
// Resuelve dos niveles de autorización sobre la URL
// `/app/records/:base?/:view?`:
//   1. El módulo base (`:base`) debe estar autorizado
//      con el permiso `module:<slug>`.
//   2. La vista (`:view`) puede exigir un permiso extra
//      declarado en `RecordViewOption.permission`
//      (ej. `rag:upload-view` para la subida de RAG).
//
// Sin módulos visibles se cae a /app/reports.
// ──────────────────────────────────────────────

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { RECORD_MODULES, getVisibleRecordModules } from '@records'
import { hasPermission } from '@services/auth'
import { ROLES_VIEW_OPTIONS, PERMISSIONS_VIEW_OPTIONS } from '@records/records.config'
import RecordsPage from '@pages/dashboard/records/RecordsPage'
import RbacRolesView from '@components/records/RbacRolesView'
import RbacPermissionsView from '@components/records/RbacPermissionsView'
import UsersPage from '@pages/dashboard/users/UsersPage'
import { LoadingScreen } from './guards'

export function RecordsRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  const segments = location.pathname.split('/').filter(Boolean)
  const baseSlug = segments[2] ?? 'records'
  const viewSlug = segments[3] ?? 'summary'

  const rbacBases: Record<string, { slug: string; options: { slug: string }[] }> = {
    roles: { slug: 'roles', options: ROLES_VIEW_OPTIONS },
    permissions: { slug: 'permissions', options: PERMISSIONS_VIEW_OPTIONS },
  }

  const rbac = rbacBases[baseSlug]
  if (rbac) {
    const validView = rbac.options.find(o => o.slug === viewSlug)
    if (!validView) {
      return <Navigate to={`/app/records/${rbac.slug}/summary`} replace />
    }
    if (!segments[3]) {
      return <Navigate to={`/app/records/${rbac.slug}/summary`} replace />
    }
    // --- RBAC permission check: only admin (or users with module:permissions) ---
    if (user && !hasPermission(user, 'module:permissions')) {
      return <Navigate to='/app/records' replace />
    }
    if (baseSlug === 'roles') {
      return <RbacRolesView view={viewSlug} />
    }
    if (baseSlug === 'permissions') {
      return <RbacPermissionsView view={viewSlug} />
    }
  }

  // --- Users: only admin (module:permissions) can access ---
  if (baseSlug === 'users') {
    if (user && !hasPermission(user, 'module:permissions')) {
      return <Navigate to='/app/home' replace />
    }
    return <UsersPage />
  }

  const targetModule = RECORD_MODULES.find(m => m.slug === baseSlug)

  if (targetModule && !hasPermission(user, `module:${targetModule.slug}`)) {
    const visibleModules = getVisibleRecordModules(user?.permissions)
    if (visibleModules.length === 0) {
      return <Navigate to="/app/reports" replace />
    }
    return <Navigate to={`/app/records/${visibleModules[0].slug}/summary`} replace />
  }

  if (targetModule && !segments[3]) {
    return <Navigate to={`/app/records/${targetModule.slug}/summary`} replace />
  }

  if (targetModule && targetModule.viewOptions?.find(v => v.slug === viewSlug)?.permission && !hasPermission(user, targetModule.viewOptions.find(v => v.slug === viewSlug)?.permission as string)) {
    return <Navigate to={`/app/records/${targetModule.slug}/summary`} replace />
  }

  return <RecordsPage />
}
