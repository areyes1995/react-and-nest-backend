// ──────────────────────────────────────────────
// NotificationsPage — Centro de notificaciones
// (RF18, HU39-HU44). Lista paginada con filtro
// leídas/no leídas y acciones de lectura.
// Ruta: /app/notifications
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing, CheckCheck } from 'lucide-react'
import { EmptyState, FilterSelect, SkeletonChartCard } from '@components/ui'
import { RoleHeader, RoleSection } from '@components/role/RolePanels'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type BackendNotification,
} from '@services/notifications'

const TYPE_STYLES: Record<string, string> = {
  INFO: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
  WARNING: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  ERROR: 'bg-red-400/10 text-red-400 border-red-400/20',
  GENERIC: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

export default function NotificationsPage() {
  const [items, setItems] = useState<BackendNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listNotifications({ page, pageSize: 15, onlyUnread })
      setItems(data.items)
      setUnreadCount(data.unreadCount)
      setTotalPages(data.totalPages)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, onlyUnread])

  useEffect(() => {
    void load()
  }, [load])

  const handleRead = useCallback(async (id: number) => {
    setActing(true)
    try {
      await markNotificationRead(id)
      setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } finally {
      setActing(false)
    }
  }, [])

  const handleReadAll = useCallback(async () => {
    setActing(true)
    try {
      await markAllNotificationsRead()
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } finally {
      setActing(false)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <RoleHeader
          title="Notificaciones"
          subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : 'Estás al día'}
          badge={unreadCount > 0 ? `${unreadCount} nuevas` : undefined}
        />
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <RoleSection
            title="Actividad"
            subtitle="Eventos relevantes de la plataforma"
          >
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <FilterSelect
                value={onlyUnread ? 'unread' : 'all'}
                onChange={v => {
                  setOnlyUnread(v === 'unread')
                  setPage(1)
                }}
                ariaLabel="Filtrar notificaciones"
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'unread', label: 'No leídas' },
                ]}
              />
              <button
                onClick={() => void handleReadAll()}
                disabled={acting || unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas como leídas
              </button>
            </div>

            {loading ? (
              <SkeletonChartCard height={320} />
            ) : items.length === 0 ? (
              <EmptyState message={onlyUnread ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones.'} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map(n => (
                  <li key={n.id} className={`py-3 first:pt-0 last:pb-0 flex items-start gap-3 ${n.isRead ? 'opacity-70' : ''}`}>
                    <span className="mt-0.5 shrink-0">
                      {n.isRead ? <Bell className="w-4 h-4 text-[var(--text-muted)]" /> : <BellRing className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{n.title}</span>
                        <span className={`text-mini px-1.5 py-0.5 rounded-full border ${TYPE_STYLES[n.type] ?? TYPE_STYLES.GENERIC}`}>
                          {n.type}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-caption text-[var(--text-muted)]">{formatDate(n.createdAt)}</span>
                        {n.link && (
                          <Link to={n.link} className="text-caption text-emerald-400 hover:text-emerald-300">
                            Ver detalle
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => void handleRead(n.id)}
                            disabled={acting}
                            className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs text-[var(--text-muted)]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </RoleSection>
        </div>
      </div>
    </div>
  )
}
