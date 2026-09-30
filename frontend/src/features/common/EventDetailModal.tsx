import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, FileText, Trash2 } from 'lucide-react'
import { calendarApi } from '@services/educraft'
import type { AgendaItem, CalendarEventDetail } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, Modal, Spinner } from '@components/ui'
import { EVENT_TYPES } from '@lib/labels'
import { formatDateLong, formatTime, sectionLabel } from '@lib/format'

/** Detalle de un evento de la agenda (entregas con estadística de respuesta). */
export function EventDetailModal({ item, onClose, onChanged }: { item: AgendaItem | null; onClose: () => void; onChanged?: () => void }) {
  const navigate = useNavigate()
  const { confirm, success, error } = useFeedback()
  const [detail, setDetail] = useState<CalendarEventDetail | null>(null)

  useEffect(() => {
    setDetail(null)
    if (item?.source === 'event' && item.id) calendarApi.event(item.id).then(setDetail).catch(() => setDetail(null))
  }, [item])

  const remove = async () => {
    if (!item?.id) return
    if (!(await confirm({ title: 'Eliminar evento', description: `¿Eliminar “${item.title}” de tu agenda?`, danger: true, confirmLabel: 'Eliminar' }))) return
    try {
      await calendarApi.remove(item.id)
      success('Evento eliminado')
      onChanged?.()
      onClose()
    } catch (err) {
      error('No se pudo eliminar', (err as Error).message)
    }
  }

  const type = item ? EVENT_TYPES[item.type] : null
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="sm"
      title={item?.title}
      subtitle={item ? `${formatDateLong(item.date)}${item.startTime ? ` · ${formatTime(item.startTime)}${item.endTime ? ` - ${formatTime(item.endTime)}` : ''}` : ''}` : undefined}
      footer={
        item && (
          <>
            {item.source === 'event' && !item.assessmentId && !item.lessonPlanId && (
              <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={remove}>
                Eliminar
              </Button>
            )}
            {item.lessonPlanId && (
              <Button size="sm" variant="secondary" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => { onClose(); navigate(`/app/planificacion/planes/${item.lessonPlanId}`) }}>
                Ir a la sesión
              </Button>
            )}
            {item.assessmentId && (
              <Button size="sm" icon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => { onClose(); navigate(`/app/evaluacion?tab=actividades&id=${item.assessmentId}`) }}>
                Revisar trabajos
              </Button>
            )}
          </>
        )
      }
    >
      {item && (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {type && <Badge tone={type.tone}>{type.label}</Badge>}
            {item.section && <Badge tone="purple">{sectionLabel(item.section.grade, item.section.name)}</Badge>}
          </div>
          {item.description && <p className="text-ink-2">{item.description}</p>}
          {item.source === 'event' && !detail && <Spinner className="py-4" />}
          {detail?.description && item.description !== detail.description && <p className="text-ink-2">{detail.description}</p>}
          {detail?.delivery && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-2 p-2">
                <p className="text-lg font-extrabold text-ink">{detail.delivery.students}</p>
                <p className="text-[0.68rem] text-ink-3">Estudiantes</p>
              </div>
              <div className="rounded-xl bg-soft-green p-2">
                <p className="text-lg font-extrabold text-emerald-600">{detail.delivery.delivered}</p>
                <p className="text-[0.68rem] text-ink-3">Han respondido</p>
              </div>
              <div className="rounded-xl bg-soft-blue p-2">
                <p className="text-lg font-extrabold text-blue-600">{detail.delivery.graded}</p>
                <p className="text-[0.68rem] text-ink-3">Calificados</p>
              </div>
            </div>
          )}
          {item.source === 'class' && <p className="text-xs text-ink-3">Clase del horario semanal de la sección.</p>}
          {item.source === 'holiday' && <p className="text-xs text-ink-3">Feriado del año escolar: no hay clases.</p>}
        </div>
      )}
    </Modal>
  )
}
