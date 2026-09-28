// ──────────────────────────────────────────────
// NotificationBell — Icono de campana con badge
// y mini panel desplegable de notificaciones.
// Uso: <NotificationBell /> en DashboardLayout
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, CheckCheck, X } from 'lucide-react'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  type BackendNotification,
} from '@services/notifications'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function NotificationBell() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<BackendNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch {
      // silently fail
    }
  }, [])

  const loadRecent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listNotifications({ page: 1, pageSize: 5, onlyUnread: true })
      setNotifications(res.items)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClick = useCallback(() => {
    setOpen(prev => {
      if (!prev) {
        void loadRecent()
      }
      return !prev
    })
  }, [loadRecent])

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-notification-bell]')) return
    setOpen(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [handleOutsideClick])

  const handleRead = useCallback(async (id: number) => {
    setActing(true)
    try {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } finally {
      setActing(false)
    }
  }, [])

  const handleReadAll = useCallback(async () => {
    setActing(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } finally {
      setActing(false)
    }
  }, [])

  const handleViewAll = useCallback(() => {
    setOpen(false)
    navigate('/app/notifications')
  }, [navigate])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="relative" data-notification-bell>
      <button
        onClick={handleClick}
        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
        title={t('Notifications')}
      >
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-mini font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-[80vh] overflow-y-auto bg-[var(--bg-main)] border border-[var(--border)] rounded-xl shadow-xl z-50">
          <div className="sticky top-0 bg-[var(--bg-main)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between z-10">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{t('Notifications')}</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  disabled={acting}
                  className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition"
                >
                  <CheckCheck className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {unreadCount === 0 && notifications.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-[var(--text-muted)]">
              <BellRing className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t('No hay notificaciones nuevas')}</p>
            </div>
          ) : loading ? (
            <div className="px-4 py-3 text-xs text-[var(--text-muted)]">{t('Cargando...')}</div>
          ) : notifications.length === 0 ? null : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && void handleRead(n.id)}
                  className={`px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-surface)] cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">
                      {n.isRead ? <Bell className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <BellRing className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{n.title}</p>
                      <p className="text-caption text-[var(--text-secondary)] line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-mini text-[var(--text-muted)] mt-1">{formatDate(n.createdAt)}</p>
                      {!n.isRead && (
                        <span className="text-mini text-emerald-400">{t('Click para marcar como leída')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--border)] px-4 py-2 text-center">
            <button
              onClick={handleViewAll}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              {t('Ver todas las notificaciones →')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
