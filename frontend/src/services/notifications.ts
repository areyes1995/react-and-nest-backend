// ──────────────────────────────────────────────
// Notifications API — Cliente HTTP (RF18)
// Endpoints: /notifications, /unread-count,
// /read-all, /:id/read
// ──────────────────────────────────────────────

import { get, patch } from './api'

export type NotificationType = 'GENERIC' | 'INFO' | 'WARNING' | 'ERROR'

export interface BackendNotification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface PagedNotificationResponse {
  items: BackendNotification[]
  totalItems: number
  unreadCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface NotificationQuery {
  page?: number
  pageSize?: number
  onlyUnread?: boolean
}

export async function listNotifications(
  query: NotificationQuery = {},
): Promise<PagedNotificationResponse> {
  const res = await get<PagedNotificationResponse>('/notifications', {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 15,
    onlyUnread: query.onlyUnread,
  })
  if (!res.ok) {
    throw new Error(res.error || 'Error al cargar notificaciones')
  }
  return res.data
}

export async function getUnreadCount(): Promise<number> {
  const res = await get<{ count: number }>('/notifications/unread-count')
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener no leídas')
  }
  return res.data.count
}

export async function markNotificationRead(id: string | number): Promise<void> {
  const res = await patch(`/notifications/${id}/read`)
  if (!res.ok) {
    throw new Error(res.error || 'Error al marcar como leída')
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await patch('/notifications/read-all')
  if (!res.ok) {
    throw new Error(res.error || 'Error al marcar todas como leídas')
  }
}
