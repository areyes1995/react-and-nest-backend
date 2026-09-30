import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarX, ClipboardList, Sparkles, TrendingDown, TriangleAlert } from 'lucide-react'
import { reportApi } from '@services/educraft'
import type { Alert } from '@services/types'
import { useAsync } from '@hooks/useAsync'
import { useSections } from '@hooks/useCatalog'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, Select, Spinner, TONE_CLASSES } from '@components/ui'
import { AlertDetailModal } from '@/features/reports/AlertDetailModal'
import { LEVELS, scoreTone } from '@lib/labels'
import { formatPercent, formatScore, sectionLabel } from '@lib/format'
import { cn } from '@lib/cn'

const KINDS: Array<{ kind: Alert['kind']; label: string; icon: React.ReactNode; tone: 'orange' | 'red' | 'purple' | 'pink' | 'blue' }> = [
  { kind: 'LOW_PERFORMANCE', label: 'Promedio bajo', icon: <TriangleAlert className="h-5 w-5" />, tone: 'orange' },
  { kind: 'SUSTAINED_LOW', label: 'Bajo rendimiento sostenido', icon: <TrendingDown className="h-5 w-5" />, tone: 'red' },
  { kind: 'LOW_ATTENDANCE', label: 'Inasistencias frecuentes', icon: <CalendarX className="h-5 w-5" />, tone: 'purple' },
  { kind: 'PENDING_DELIVERY', label: 'Actividades sin entregar', icon: <ClipboardList className="h-5 w-5" />, tone: 'pink' },
]

const TEXT_TONE: Record<string, string> = { green: 'text-emerald-600', blue: 'text-blue-600', yellow: 'text-amber-600', red: 'text-red-600', gray: 'text-ink-3' }

export default function TrackingPage() {
  const [params] = useSearchParams()
  const filter = params.get('filtro')
  const alerts = useAsync(() => reportApi.alerts())
  const { sections } = useSections()
  const [sectionId, setSectionId] = useState<number | ''>('')
  const current = sectionId || sections[0]?.id
  const perf = useAsync(() => (current ? reportApi.performance(Number(current)) : Promise.resolve(null)), [current])
  const [active, setActive] = useState<Alert | null>(null)

  const counts = useMemo(() => {
    const map: Partial<Record<Alert['kind'], number>> = {}
    for (const a of alerts.data ?? []) map[a.kind] = (map[a.kind] ?? 0) + a.students.length
    return map
  }, [alerts.data])

  const rows = useMemo(() => {
    const list = [...(perf.data?.rows ?? [])]
    if (filter === 'asistencia') return list.sort((a, b) => (a.attendance.rate ?? 101) - (b.attendance.rate ?? 101))
    return list.sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
  }, [perf.data, filter])

  if (alerts.error) return <ErrorState message={alerts.error} onRetry={alerts.reload} />

  return (
    <div>
      <PageHeader title="Seguimiento del estudiante" subtitle="Alertas de bajo rendimiento, asistencia y entregas, con recomendaciones para intervenir a tiempo" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KINDS.map((k) => (
          <div key={k.kind} className={cn('rounded-card p-4', TONE_CLASSES[k.tone])}>
            <div className="flex items-center justify-between">
              {k.icon}
              <span className="text-3xl font-extrabold">{counts[k.kind] ?? 0}</span>
            </div>
            <p className="mt-2 text-sm font-bold">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <Card className="card-pad h-fit">
          <CardHeader title="Alertas activas" />
          {alerts.loading && !alerts.data ? (
            <Spinner />
          ) : !alerts.data?.length ? (
            <EmptyState title="Sin alertas" description="¡Excelente! No hay estudiantes en riesgo." />
          ) : (
            <ul className="space-y-2">
              {alerts.data.map((a, i) => (
                <li key={i}>
                  <button onClick={() => setActive(a)} className="w-full rounded-2xl border border-line p-3 text-left transition hover:shadow-card">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{a.title}</p>
                      <Badge tone={a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'orange' : 'blue'}>{a.severity === 'critical' ? 'Crítica' : a.severity === 'warning' ? 'Atención' : 'Info'}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-3">{a.description}</p>
                    {a.students.length > 0 && <p className="mt-1 truncate text-xs text-ink-2">{a.students.map((s) => s.name).join(', ')}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Dashboard de analítica estudiantil"
            subtitle={perf.data ? `${sectionLabel(perf.data.section.grade, perf.data.section.name)} · promedio ${formatScore(perf.data.summary.average, 1)} · asistencia ${formatPercent(perf.data.summary.attendanceRate)}` : undefined}
            action={<Select value={current ?? ''} onChange={(e) => setSectionId(Number(e.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} className="w-auto" />}
          />
          {!perf.data ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                {perf.data.blocks.map((b) => (
                  <div key={b.block} className="rounded-2xl border border-line p-3">
                    <p className="text-[0.68rem] font-bold uppercase text-ink-3">{b.code}</p>
                    <p className="line-clamp-1 text-xs text-ink-2">{b.name}</p>
                    <p className={cn('text-xl font-extrabold', TEXT_TONE[scoreTone(b.average, perf.data!.section.passing)])}>{formatScore(b.average, 1)}</p>
                    <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
                      {(['INICIO', 'EN_PROCESO', 'LOGRADO', 'EXCELENTE'] as const).map((l) => (
                        <span key={l} style={{ width: `${(b.distribution[l] / Math.max(1, perf.data!.rows.length)) * 100}%`, background: LEVELS[l].color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="max-h-[55vh] overflow-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th className="text-center">Promedio</th>
                      <th className="text-center">Nivel</th>
                      <th className="text-center">Asistencia</th>
                      {[1, 2, 3, 4].map((b) => (
                        <th key={b} className="text-center">
                          PC{b}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.student.id}>
                        <td>
                          <Link to={`/app/estudiantes/${r.student.id}`} className="font-semibold text-ink hover:text-brand-purple">
                            {r.student.lastName}, {r.student.firstName}
                          </Link>
                        </td>
                        <td className={cn('text-center font-bold', TEXT_TONE[scoreTone(r.score, perf.data!.section.passing)])}>{formatScore(r.score, 1)}</td>
                        <td className="text-center">{r.level ? <Badge tone={LEVELS[r.level].tone}>{LEVELS[r.level].label}</Badge> : '—'}</td>
                        <td className="text-center text-xs">{formatPercent(r.attendance.rate)}</td>
                        {[1, 2, 3, 4].map((b) => (
                          <td key={b} className={cn('text-center text-xs', TEXT_TONE[scoreTone(r.blocks[b], perf.data!.section.passing)])}>
                            {formatScore(r.blocks[b])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="soft"
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() =>
                    setActive({
                      kind: 'LOW_PERFORMANCE',
                      severity: 'critical',
                      title: 'Estrategias de refuerzo para la sección',
                      description: `${perf.data!.summary.atRisk} estudiante(s) por debajo de ${perf.data!.section.passing}`,
                      section: { id: perf.data!.section.id, name: perf.data!.section.name, grade: perf.data!.section.grade },
                      students: perf.data!.rows.filter((r) => r.score != null && r.score < perf.data!.section.passing).map((r) => ({ id: r.student.id, name: `${r.student.firstName} ${r.student.lastName}`, value: r.score })),
                    })
                  }
                >
                  Generar estrategias de refuerzo con IA
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
      <AlertDetailModal alert={active} onClose={() => setActive(null)} />
    </div>
  )
}
