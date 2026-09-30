import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calculator, FolderOpen, LineChart, MonitorPlay, Sigma } from 'lucide-react'
import { libraryApi, planningApi } from '@services/educraft'
import type { Dashboard, LibraryResource, Presentation } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, Card, CardHeader, EmptyState, Latex, Modal, TONE_CLASSES } from '@components/ui'
import { AttendanceTaker } from '@/features/attendance/AttendanceTaker'
import { CLASS_STATUS } from '@lib/labels'
import { formatTime, sectionLabel } from '@lib/format'
import { cn } from '@lib/cn'

type TodayClass = Dashboard['todayClasses'][number]

/** Miniatura ilustrativa según el tema de la clase. */
function TopicArt({ topic, color }: { topic: string | null; color: string }) {
  const t = (topic ?? '').toLowerCase()
  const content = /cuadr|funci|parábola/.test(t) ? (
    <svg viewBox="0 0 60 40" className="h-full w-full">
      <path d="M6 6 Q30 70 54 6" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="34" x2="56" y2="34" stroke="#c4b5fd" strokeWidth="1.5" />
      <line x1="30" y1="2" x2="30" y2="38" stroke="#c4b5fd" strokeWidth="1.5" />
    </svg>
  ) : /sistema|ecuaci/.test(t) ? (
    <div className="text-[0.62rem] leading-tight text-violet-900">
      <Latex>{'\\begin{cases} 2x+y=5 \\\\ x-y=1 \\end{cases}'}</Latex>
    </div>
  ) : /probab|dado|azar|estad/.test(t) ? (
    <span className="text-3xl">🎲</span>
  ) : /geom|triáng|pitág|ángulo/.test(t) ? (
    <span className="text-3xl">📐</span>
  ) : (
    <Sigma className="h-7 w-7" style={{ color }} />
  )
  return <div className="grid h-16 w-20 shrink-0 place-items-center rounded-2xl bg-white shadow-inner dark:bg-surface-3">{content}</div>
}

export function TodayClasses({ classes }: { classes: TodayClass[] }) {
  const [active, setActive] = useState<TodayClass | null>(null)
  return (
    <Card className="card-pad flex flex-col">
      <CardHeader title="Mis clases de hoy" action={<Link to="/app/calendario?vista=semana" className="link">Ver todas</Link>} />
      {classes.length === 0 ? (
        <EmptyState title="No tienes clases hoy" description="Configura el horario de tus secciones en Ajustes → Secciones." />
      ) : (
        <div className="space-y-2.5">
          {classes.map((c) => {
            const status = CLASS_STATUS[c.status]
            const clickable = c.status === 'EN_PROGRESO' || c.status === 'PROXIMA' || c.status === 'PROGRAMADA'
            return (
              <button
                key={c.key}
                onClick={() => clickable && setActive(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition',
                  c.status === 'EN_PROGRESO' ? 'bg-soft-pink' : 'bg-surface-2 hover:bg-surface-3',
                  c.status === 'FINALIZADA' && 'opacity-60',
                )}
              >
                <TopicArt topic={c.topic} color={c.section?.color ?? '#8b5cf6'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{c.section ? sectionLabel(c.section.grade, c.section.name) : 'Clase'}</p>
                  <p className="truncate text-xs text-ink-2">{c.topic ?? 'Sin tema planificado'}</p>
                  <p className="mt-0.5 text-[0.7rem] text-ink-3">
                    {formatTime(c.startTime)} - {formatTime(c.endTime)}
                  </p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </button>
            )
          })}
        </div>
      )}
      <ClassroomModal item={active} onClose={() => setActive(null)} />
    </Card>
  )
}

/** Panel de control de la clase activa ("Aula Virtual de Proyección"). */
function ClassroomModal({ item, onClose }: { item: TodayClass | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { error } = useFeedback()
  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!item) return
    setPresentation(null)
    setResources([])
    if (item.lessonPlanId) {
      planningApi
        .presentations()
        .then((list) => setPresentation(list.find((p) => p.lessonPlanId === item.lessonPlanId) ?? null))
        .catch(() => undefined)
    }
    const tag = item.topic?.split(/\s+/)[0]
    libraryApi.list({ q: tag }).then((r) => setResources(r.slice(0, 4))).catch(() => undefined)
  }, [item])

  const project = async () => {
    if (!item) return
    try {
      setBusy(true)
      let target = presentation
      if (!target && item.lessonPlanId) target = await planningApi.planToPresentation(item.lessonPlanId)
      if (target) {
        onClose()
        navigate(`/app/clases/presentaciones/${target.id}?proyectar=1`)
      } else {
        onClose()
        navigate('/app/clases')
      }
    } catch (err) {
      error('No se pudo abrir la presentación', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const tools = [
    { label: 'Graficadora', icon: <LineChart className="h-4 w-4" />, to: '/app/herramientas?tool=graficadora', tone: 'blue' as const },
    { label: 'Calculadora', icon: <Calculator className="h-4 w-4" />, to: '/app/herramientas?tool=calculadora', tone: 'purple' as const },
    { label: 'Editor LaTeX', icon: <Sigma className="h-4 w-4" />, to: '/app/herramientas?tool=latex', tone: 'pink' as const },
  ]

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="xl"
      title={item?.section ? `Aula virtual · ${sectionLabel(item.section.grade, item.section.name)}` : 'Aula virtual'}
      subtitle={item ? `${item.topic ?? 'Sin tema'} · ${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : undefined}
    >
      {item && (
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            <button
              onClick={project}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-brand-gradient px-6 py-8 text-xl font-extrabold text-white shadow-[0_12px_30px_rgba(236,72,153,0.3)] transition hover:brightness-105 disabled:opacity-60"
            >
              <MonitorPlay className="h-8 w-8" /> Proyectar Presentación
            </button>
            <div>
              <p className="section-title mb-2">Herramientas para este tema</p>
              <div className="grid grid-cols-3 gap-2">
                {tools.map((t) => (
                  <Link key={t.label} to={t.to} onClick={onClose} className={cn('flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-semibold', TONE_CLASSES[t.tone])}>
                    {t.icon} {t.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="section-title mb-2">Recursos asignados</p>
              {resources.length ? (
                <ul className="space-y-1.5">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <a href={r.url ?? '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-2 hover:text-brand-purple">
                        <FolderOpen className="h-4 w-4" /> {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink-3">Sin recursos relacionados. Agrégalos en Recursos con etiquetas del tema.</p>
              )}
            </div>
            {item.lessonPlanId && (
              <Button variant="secondary" onClick={() => { onClose(); navigate(`/app/planificacion/planes/${item.lessonPlanId}`) }}>
                Ver plan de clase
              </Button>
            )}
          </div>
          <div>
            <p className="section-title mb-2">Asistencia rápida</p>
            {item.section && <AttendanceTaker sectionId={item.section.id} compact />}
          </div>
        </div>
      )}
    </Modal>
  )
}
