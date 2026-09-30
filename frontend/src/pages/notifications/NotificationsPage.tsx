import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationApi } from '@services/educraft'
import { useAsync } from '@hooks/useAsync'
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, Tabs } from '@components/ui'
import { formatDateTime } from '@lib/format'
import { cn } from '@lib/cn'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const { data, loading, reload } = useAsync(() => notificationApi.list(page, 20, filter === 'unread' || undefined), [page, filter])

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        subtitle="Alertas del sistema, evaluaciones pendientes y avisos del calendario"
        actions={
          <Button
            variant="secondary"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={async () => {
              await notificationApi.markAllRead()
              void reload()
            }}
          >
            Marcar todo como leído
          </Button>
        }
      />
      <Tabs
        className="mb-4"
        value={filter}
        onChange={(f) => {
          setFilter(f)
          setPage(1)
        }}
        items={[
          { key: 'all', label: 'Todas' },
          { key: 'unread', label: 'No leídas', count: data?.unreadCount },
        ]}
      />
      <Card className="card-pad">
        {loading && !data ? (
          <Spinner />
        ) : !data?.items.length ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title="Sin notificaciones" />
        ) : (
          <ul className="space-y-2">
            {data.items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={async () => {
                    if (!n.isRead) await notificationApi.markRead(n.id)
                    if (n.link) navigate(n.link)
                    else void reload()
                  }}
                  className={cn('flex w-full items-start gap-3 rounded-2xl border border-line p-3 text-left transition hover:shadow-card', !n.isRead && (n.type === 'ERROR' || n.type === 'WARNING' ? 'bg-soft-pink' : 'bg-soft-purple'))}
                >
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-pink" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="text-xs text-ink-2">{n.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={n.type === 'ERROR' ? 'red' : n.type === 'WARNING' ? 'orange' : 'blue'}>{n.type === 'ERROR' ? 'Crítica' : n.type === 'WARNING' ? 'Atención' : 'Aviso'}</Badge>
                    <p className="mt-1 text-[0.68rem] text-ink-3">{formatDateTime(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-xs text-ink-3">
              {page} / {data.totalPages}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
