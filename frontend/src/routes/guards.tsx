// ──────────────────────────────────────────────
// Guards — lógica de acceso/sesión de la app.
// Componentes puros de protección de rutas.
// ──────────────────────────────────────────────

import { Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { readRedirect } from '@services/auth-redirect'
import type { ReactNode } from 'react'

export function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="spinner-lg" />
      <p>Loading session…</p>
    </div>
  )
}

/** Requiere sesión activa; redirige a /login si no la hay. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Requiere un permiso RBAC específico; redirige a `fallback` si no lo tiene. */
export function PermissionRoute({
  permission,
  fallback = '/app',
  children,
}: {
  permission: string
  fallback?: string
  children: ReactNode
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user || !hasPermission(user, permission)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

/** Solo accesible sin sesión; redirige a /app si ya está autenticado. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={readRedirect('/app')} replace />
  }

  return <>{children}</>
}

/** Index: redirige según autenticación. */
export function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return <Navigate to={isAuthenticated ? '/app' : '/login'} replace />
}