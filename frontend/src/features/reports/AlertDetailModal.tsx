import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, MessageSquareText, Sparkles } from 'lucide-react'
import { aiApi } from '@services/educraft'
import type { Alert } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Modal } from '@components/ui'
import { SourceBadge } from '@/features/common/SourceBadge'
import { formatScore, sectionLabel } from '@lib/format'

type Strategies = Awaited<ReturnType<typeof aiApi.strategies>>

export function AlertDetailModal({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { success, error } = useFeedback()
  const [strategies, setStrategies] = useState<Strategies | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!alert) return
    setLoading(true)
    try {
      setStrategies(
        await aiApi.strategies({
          sectionId: alert.section.id,
          studentIds: alert.kind === 'LOW_PERFORMANCE' || alert.kind === 'SUSTAINED_LOW' ? alert.students.map((s) => s.id) : undefined,
        }),
      )
    } catch (err) {
      error('No se pudieron generar estrategias', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const parentMessage = () => {
    if (!alert) return ''
    return alert.students
      .map(
        (s) =>
          `Estimada familia de ${s.name}: le informamos que su representado presenta ${
            alert.kind === 'LOW_ATTENDANCE' ? `una asistencia de ${formatScore(s.value, 1)}%` : 'entregas pendientes en Matemática'
          }. Le invitamos a acompañarle y a comunicarse con el docente. Gracias.`,
      )
      .join('\n\n')
  }

  const close = () => {
    setStrategies(null)
    onClose()
  }

  return (
    <Modal
      open={!!alert}
      onClose={close}
      size="lg"
      title={alert?.title}
      subtitle={alert ? `${sectionLabel(alert.section.grade, alert.section.name)} · ${alert.description}` : undefined}
      footer={
        alert && (
          <>
            {(alert.kind === 'LOW_PERFORMANCE' || alert.kind === 'SUSTAINED_LOW') && (
              <Button onClick={generate} loading={loading} icon={<Sparkles className="h-4 w-4" />}>
                Generar Estrategias de Refuerzo con IA
              </Button>
            )}
            {alert.kind === 'PENDING_DELIVERY' && (
              <Button onClick={() => { close(); navigate('/app/evaluacion?tab=actividades') }}>Ir a calificar entregas</Button>
            )}
            {alert.kind === 'TO_GRADE' && (
              <Button onClick={() => { close(); navigate(`/app/evaluacion?tab=actividades&id=${alert.assessmentIds?.[0] ?? ''}`) }}>Calificar ahora</Button>
            )}
            {(alert.kind === 'LOW_ATTENDANCE' || alert.kind === 'PENDING_DELIVERY') && (
              <Button
                variant="secondary"
                icon={<MessageSquareText className="h-4 w-4" />}
                onClick={() => {
                  void navigator.clipboard.writeText(parentMessage())
                  success('Mensajes para las familias copiados', 'Pégalos en WhatsApp o en el correo del centro.')
                }}
              >
                Notificar a padres
              </Button>
            )}
          </>
        )
      }
    >
      {alert && (
        <div className="space-y-4">
          {alert.students.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th className="text-right">{alert.kind === 'LOW_ATTENDANCE' ? 'Asistencia' : alert.kind === 'PENDING_DELIVERY' ? 'Pendientes' : 'Promedio'}</th>
                  </tr>
                </thead>
                <tbody>
                  {alert.students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/app/estudiantes/${s.id}`} onClick={close} className="font-medium text-ink hover:text-brand-purple">
                          {s.name}
                        </Link>
                        {s.detail && <p className="text-xs text-ink-3">{s.detail}</p>}
                      </td>
                      <td className="text-right font-bold">{alert.kind === 'LOW_ATTENDANCE' ? `${formatScore(s.value, 1)}%` : formatScore(s.value, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {strategies && (
            <div className="space-y-3 rounded-2xl bg-gradient-to-br from-pink-50 to-violet-50 p-4 dark:from-pink-950/30 dark:to-violet-950/30">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{strategies.summary}</p>
                <SourceBadge source={strategies.source} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {strategies.strategies.map((s) => (
                  <div key={s.title} className="rounded-xl bg-surface p-3 shadow-sm">
                    <p className="text-sm font-semibold text-ink">{s.title}</p>
                    <p className="mt-1 text-xs text-ink-2">{s.description}</p>
                  </div>
                ))}
              </div>
              {strategies.plan.length > 0 && (
                <ol className="list-decimal space-y-1 pl-5 text-xs text-ink-2">
                  {strategies.plan.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              )}
              <Button
                size="sm"
                variant="secondary"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => {
                  void navigator.clipboard.writeText([strategies.summary, ...strategies.strategies.map((s) => `• ${s.title}: ${s.description}`), ...strategies.plan].join('\n'))
                  success('Plan de refuerzo copiado')
                }}
              >
                Copiar plan
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
