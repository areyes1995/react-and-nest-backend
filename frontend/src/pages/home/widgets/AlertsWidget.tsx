import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, TriangleAlert, UserX } from 'lucide-react'
import type { Alert } from '@services/types'
import { Card, CardHeader, EmptyState } from '@components/ui'
import { AlertDetailModal } from '@/features/reports/AlertDetailModal'
import { cn } from '@lib/cn'

const STYLE: Record<Alert['kind'], { icon: React.ReactNode; bg: string }> = {
  LOW_PERFORMANCE: { icon: <TriangleAlert className="h-4 w-4 text-orange-500" />, bg: 'bg-soft-orange' },
  SUSTAINED_LOW: { icon: <TriangleAlert className="h-4 w-4 text-red-500" />, bg: 'bg-soft-red' },
  PENDING_DELIVERY: { icon: <ClipboardList className="h-4 w-4 text-pink-500" />, bg: 'bg-soft-pink' },
  LOW_ATTENDANCE: { icon: <UserX className="h-4 w-4 text-violet-500" />, bg: 'bg-soft-purple' },
  TO_GRADE: { icon: <ClipboardList className="h-4 w-4 text-blue-500" />, bg: 'bg-soft-blue' },
}

export function AlertsWidget({ alerts }: { alerts: Alert[] }) {
  const [active, setActive] = useState<Alert | null>(null)
  return (
    <Card className="card-pad">
      <CardHeader title="Alertas importantes" action={<Link to="/app/seguimiento" className="link">Ver todas</Link>} />
      {alerts.length === 0 ? (
        <EmptyState title="Todo en orden" description="No hay alertas de rendimiento, asistencia ni entregas." className="py-4" />
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 4).map((a, i) => (
            <li key={i}>
              <button onClick={() => setActive(a)} className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:brightness-[0.98]', STYLE[a.kind].bg)}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80 dark:bg-black/20">{STYLE[a.kind].icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-ink">{a.title}</span>
                  <span className="block truncate text-[0.68rem] text-ink-2">{a.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-ink-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <AlertDetailModal alert={active} onClose={() => setActive(null)} />
    </Card>
  )
}
