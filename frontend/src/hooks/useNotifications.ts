// ──────────────────────────────────────────────
// useNotifications — Hook para estado local de notificaciones
// Consume los endpoints existentes del backend:
//   GET /notifications
//   GET /notifications/unread-count
//   PATCH /notifications/:id/read
//   PATCH /notifications/read-all
// ──────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type BackendNotification,
  type PagedNotificationResponse,
} from '@services/notifications'

export interface NotificationState {
  unreadCount: number
  notifications: BackendNotification[]
  totalPages: number
  page: number
  loading: boolean
  acting: boolean
}

export function useNotifications(pageSize = 15) {
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    notifications: [],
    totalPages: 1,
    page: 1,
    loading: true,
    acting: false,
  })

  const pageRef = useRef(1)

  async function loadNotifications() {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const data: PagedNotificationResponse = await listNotifications({
        page: pageRef.current,
        pageSize,
        onlyUnread: true,
      })
      setState(prev => ({
        ...prev,
        notifications: data.items,
        unreadCount: data.unreadCount,
        totalPages: data.totalPages,
        loading: false,
      }))
    } catch {
      setState(prev => ({ ...prev, notifications: [], loading: false }))
    }
  }

  async function refreshBadge() {
    try {
      const count = await getUnreadCount()
      setState(prev => ({ ...prev, unreadCount: count }))
    } catch {
      // silently fail
    }
  }

  async function markAsRead(id: number) {
    setState(prev => ({ ...prev, acting: true }))
    try {
      await markNotificationRead(id)
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        acting: false,
      }))
    } catch {
      setState(prev => ({ ...prev, acting: false }))
    }
  }

  async function markAllAsRead() {
    setState(prev => ({ ...prev, acting: true }))
    try {
      await markAllNotificationsRead()
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        acting: false,
      }))
    } catch {
      setState(prev => ({ ...prev, acting: false }))
    }
  }

  useEffect(() => {
    void loadNotifications()
    void refreshBadge()
  }, [])

  return {
    ...state,
    loadNotifications,
    refreshBadge,
    markAsRead,
    markAllAsRead,
  }
}
