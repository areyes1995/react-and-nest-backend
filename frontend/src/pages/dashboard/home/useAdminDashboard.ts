// ──────────────────────────────────────────────
// useAdminDashboard — datos reales para el panel
// admin del home (/app/home). Solo usuarios,
// roles, permisos y notificaciones. Proyectos,
// stands, ferias, métricas y RAG eliminados.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { getUsers, type UserResponse } from '@services/users'
import { getRolesSummary, getPermissions } from '@services/rbac'
import { listNotifications, getUnreadCount, type BackendNotification } from '@services/notifications'

export interface AdminDashboardState {
  totalUsers: number
  activeUsers: number
  recentUsers: UserResponse[]
  totalRoles: number
  totalPermissions: number
  unreadNotifications: number
  recentNotifications: BackendNotification[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useAdminDashboard(): AdminDashboardState {
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [recentUsers, setRecentUsers] = useState<UserResponse[]>([])
  const [totalRoles, setTotalRoles] = useState(0)
  const [totalPermissions, setTotalPermissions] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<BackendNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [users, roles, perms, unread, notifs] =
        await Promise.allSettled([
          getUsers({ page: 1, pageSize: 6 }),
          getRolesSummary(),
          getPermissions(),
          getUnreadCount(),
          listNotifications({ page: 1, pageSize: 6 }),
        ])

      if (users.status === 'fulfilled' && users.value.ok) {
        const data = users.value.data
        // Una respuesta sin `items` (API a medias, proxy, versión distinta) no
        // puede dejar el panel en blanco: se trata como lista vacía.
        const items = Array.isArray(data?.items) ? data.items : []
        setTotalUsers(data?.totalItems ?? items.length)
        setRecentUsers(items)
        setActiveUsers(items.filter(u => u.isActive).length)
      }

      if (roles.status === 'fulfilled') {
        setTotalRoles(Array.isArray(roles.value) ? roles.value.length : 0)
      }

      if (perms.status === 'fulfilled') {
        setTotalPermissions(Array.isArray(perms.value) ? perms.value.length : 0)
      }

      if (unread.status === 'fulfilled') {
        setUnreadNotifications(Number(unread.value) || 0)
      }

      if (notifs.status === 'fulfilled') {
        const items = Array.isArray(notifs.value?.items) ? notifs.value.items : []
        setRecentNotifications(items)
        if (unread.status !== 'fulfilled') {
          setUnreadNotifications(notifs.value?.unreadCount ?? items.length)
        }
      }

      const critical = [users, roles].filter(r => r.status === 'rejected')
      if (critical.length === 2) {
        setError('Error loading admin dashboard data')
      }
    } catch {
      setError('Error loading admin dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    totalUsers,
    activeUsers,
    recentUsers,
    totalRoles,
    totalPermissions,
    unreadNotifications,
    recentNotifications,
    loading,
    error,
    reload: load,
  }
}
