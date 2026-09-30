import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, CalendarCheck, FileSpreadsheet, FileText, HeartHandshake, Link2, MessageSquareText, Printer, Radar as RadarIcon, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { reportApi } from '@services/educraft'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useSections } from '@hooks/useCatalog'
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Spinner, Tabs } from '@components/ui'
import { BulletinModal, ParentReportModal, bulletinHtml } from '@/features/reports/StudentReports'
import { escapeHtml as e, exportExcel, printDocument } from '@lib/exporters'
import { ATTENDANCE, BLOCK_SHORT, LEVELS, OBSERVATION_TYPES } from '@lib/labels'
import { addDays, formatDate, formatPercent, formatScore, sectionLabel, slugify, today } from '@lib/format'

type Tab = 'rendimiento' | 'asistencia' | 'competencias' | 'conducta' | 'boletines' | 'padres'

export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'rendimiento'
  const { sections, loading } = useSections()
  const [sectionId, setSectionId] = useState<number | ''>('')
  const [period, setPeriod] = useState<number | ''>('')
  const current = Number(sectionId || sections[0]?.id || 0)
  const section = sections.find((s) => s.id === current)
  const label = section ? sectionLabel(section.grade.name, section.name) : ''

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Informes visuales de rendimiento, asistencia, competencias y conducta; boletines oficiales y reportes para las familias" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          value={tab}
          onChange={(t) => setParams({ tab: t })}
          items={[
            { key: 'rendimiento', label: 'Rendimiento', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'asistencia', label: 'Asistencia', icon: <CalendarCheck className="h-4 w-4" /> },
            { key: 'competencias', label: 'Competencias', icon: <RadarIcon className="h-4 w-4" /> },
            { key: 'conducta', label: 'Conducta', icon: <MessageSquareText className="h-4 w-4" /> },
            { key: 'boletines', label: 'Boletines', icon: <FileText className="h-4 w-4" /> },
            { key: 'padres', label: 'Para padres', icon: <HeartHandshake className="h-4 w-4" /> },
          ]}
        />
        <Select value={current || ''} onChange={(ev) => setSectionId(Number(ev.target.value))} options={sections.map((s) => ({ value: s.id, label: sectionLabel(s.grade.name, s.name) }))} className="w-auto" />
        {(tab === 'rendimiento' || tab === 'competencias') && (
          <Select value={period} onChange={(ev) => setPeriod(ev.target.value ? Number(ev.target.value) : '')} placeholder="Año completo" options={[1, 2, 3, 4].map((p) => ({ value: p, label: `Periodo ${p}` }))} className="w-auto" />
        )}
      </div>
      {loading ? (
        <Spinner />
      ) : !current ? (
        <Card className="card-pad">
          <EmptyState icon={<Users className="h-6 w-6" />} title="Sin secciones" description="Crea tus secciones para generar reportes." />
        </Card>
      ) : (
        <>
          {tab === 'rendimiento' && <PerformanceReport sectionId={current} period={period || undefined} label={label} />}
          {tab === 'asistencia' && <AttendanceReport sectionId={current} label={label} />}
          {tab === 'competencias' && <CompetenceReport sectionId={current} period={period || undefined} />}
          {tab === 'conducta' && <ConductReport sectionId={current} label={label} />}
          {tab === 'boletines' && <StudentsReports sectionId={current} kind="bulletin" label={label} />}
          {tab === 'padres' && <StudentsReports sectionId={current} kind="parent" label={label} />}
        </>
      )}
    </div>
  )
}

function PerformanceReport({ sectionId, period, label }: { sectionId: number; period?: number; label: string }) {
  const { data } = useAsync(() => reportApi.performance(sectionId, period), [sectionId, period])
  if (!data) return <Spinner />
  const distribution = (['INICIO', 'EN_PROCESO', 'LOGRADO', 'EXCELENTE'] as const).map((l) => ({ name: LEVELS[l].label, value: data.rows.filter((r) => r.level === l).length, fill: LEVELS[l].color }))
  const exportXlsx = () =>
    exportExcel(
      [
        {
          name: 'Rendimiento',
          title: `Rendimiento — ${label}${period ? ` · Periodo ${period}` : ''}`,
          header: ['No.', 'Estudiante', 'Promedio', 'Nivel', 'PC1', 'PC2', 'PC3', 'PC4', '% Asistencia', 'Situación'],
          rows: data.rows.map((r) => [r.student.listNumber, `${r.student.lastName}, ${r.student.firstName}`, r.score, r.level ? LEVELS[r.level].label : '', r.blocks[1], r.blocks[2], r.blocks[3], r.blocks[4], r.attendance.rate, r.situation]),
          widths: [5, 30, 10, 12, 8, 8, 8, 8, 12, 12],
        },
      ],
      `rendimiento-${slugify(label)}`,
    )
  const print = () =>
    printDocument(
      'Reporte de rendimiento',
      `<h1>Reporte de rendimiento — ${e(label)}</h1><p class="muted">${period ? `Periodo ${period}` : 'Año completo'} · Promedio ${formatScore(data.summary.average, 1)} · Asistencia ${formatPercent(data.summary.attendanceRate)} · Aprobados ${data.summary.approved}/${data.summary.students}</p><table><tr><th>No.</th><th>Estudiante</th><th>Promedio</th><th>Nivel</th><th>PC1</th><th>PC2</th><th>PC3</th><th>PC4</th><th>Asistencia</th></tr>${data.rows
        .map((r) => `<tr><td>${r.student.listNumber ?? ''}</td><td>${e(r.student.lastName)}, ${e(r.student.firstName)}</td><td class="center">${formatScore(r.score, 1)}</td><td>${r.level ? LEVELS[r.level].label : ''}</td>${[1, 2, 3, 4].map((b) => `<td class="center">${formatScore(r.blocks[b])}</td>`).join('')}<td class="center">${formatPercent(r.attendance.rate)}</td></tr>`)
        .join('')}</table>`,
    )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Estudiantes', data.summary.students],
          ['Promedio', formatScore(data.summary.average, 1)],
          ['Asistencia', formatPercent(data.summary.attendanceRate)],
          ['Aprobados', data.summary.approved],
          ['En riesgo', data.summary.atRisk],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs font-semibold text-ink-3">{k}</p>
            <p className="text-2xl font-extrabold text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-pad">
          <CardHeader title="Distribución por nivel de logro" />
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} width={28} />
                <Tooltip />
                <Bar dataKey="value" name="Estudiantes" radius={[8, 8, 0, 0]}>
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="card-pad">
          <CardHeader title="Promedio por competencia" />
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={data.blocks.map((b) => ({ name: BLOCK_SHORT[b.block], promedio: b.average }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-3)' }} width={28} />
                <Tooltip />
                <Bar dataKey="promedio" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="card-pad">
        <CardHeader
          title="Detalle por estudiante"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={exportXlsx}>
                Excel
              </Button>
              <Button size="sm" variant="secondary" icon={<Printer className="h-3.5 w-3.5" />} onClick={print}>
                PDF
              </Button>
            </div>
          }
        />
        <div className="max-h-[50vh] overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th className="text-center">Promedio</th>
                <th className="text-center">Nivel</th>
                {[1, 2, 3, 4].map((b) => (
                  <th key={b} className="text-center">
                    PC{b}
                  </th>
                ))}
                <th className="text-center">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.student.id}>
                  <td className="font-medium text-ink">
                    {r.student.lastName}, {r.student.firstName}
                  </td>
                  <td className="text-center font-bold">{formatScore(r.score, 1)}</td>
                  <td className="text-center">{r.level ? <Badge tone={LEVELS[r.level].tone}>{LEVELS[r.level].label}</Badge> : '—'}</td>
                  {[1, 2, 3, 4].map((b) => (
                    <td key={b} className="text-center text-xs">
                      {formatScore(r.blocks[b])}
                    </td>
                  ))}
                  <td className="text-center text-xs">{formatPercent(r.attendance.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function AttendanceReport({ sectionId, label }: { sectionId: number; label: string }) {
  const [from, setFrom] = useState(addDays(today(), -60))
  const [to, setTo] = useState(today())
  const { data } = useAsync(() => reportApi.attendance(sectionId, from, to), [sectionId, from, to])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={from} onChange={(ev) => setFrom(ev.target.value)} className="w-auto" />
        <span className="text-ink-3">—</span>
        <Input type="date" value={to} onChange={(ev) => setTo(ev.target.value)} className="w-auto" />
        {data && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
            onClick={() =>
              exportExcel(
                [{ name: 'Asistencia', title: `Asistencia — ${label} (${from} a ${to})`, header: ['No.', 'Estudiante', 'P', 'T', 'F', 'J', '%'], rows: data.students.map((s) => [s.listNumber, `${s.lastName}, ${s.firstName}`, s.counts.PRESENT, s.counts.LATE, s.counts.ABSENT, s.counts.EXCUSED, s.rate]), widths: [5, 30] }],
                `asistencia-${slugify(label)}`,
              )
            }
          >
            Excel
          </Button>
        )}
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Card className="card-pad">
            <CardHeader title={`Asistencia diaria · ${formatPercent(data.rate)}`} />
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={data.days.map((d) => ({ date: formatDate(d.date, { day: 'numeric', month: 'short' }), ...d.counts, rate: d.rate }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="rate" name="% asistencia" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="card-pad">
            <CardHeader title="Totales" />
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ATTENDANCE) as Array<keyof typeof ATTENDANCE>).map((k) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs text-ink-3">{ATTENDANCE[k].label}</p>
                  <p className="text-xl font-extrabold" style={{ color: ATTENDANCE[k].color }}>
                    {data.counts[k]}
                  </p>
                </div>
              ))}
            </div>
            <p className="mb-1 mt-4 text-xs font-bold text-ink">Asistencia más baja</p>
            <ul className="space-y-1">
              {[...data.students]
                .filter((s) => s.rate != null)
                .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))
                .slice(0, 6)
                .map((s) => (
                  <li key={s.id} className="flex justify-between text-xs text-ink-2">
                    <span>
                      {s.lastName}, {s.firstName}
                    </span>
                    <b>{formatPercent(s.rate)}</b>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

function CompetenceReport({ sectionId, period }: { sectionId: number; period?: number }) {
  const { data } = useAsync(() => reportApi.performance(sectionId, period), [sectionId, period])
  if (!data) return <Spinner />
  const stacked = data.blocks.map((b) => ({ name: BLOCK_SHORT[b.block], ...Object.fromEntries((['INICIO', 'EN_PROCESO', 'LOGRADO', 'EXCELENTE'] as const).map((l) => [LEVELS[l].label, b.distribution[l]])) }))
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="card-pad">
        <CardHeader title="Desempeño por competencia" />
        <div className="h-72">
          <ResponsiveContainer>
            <RadarChart data={data.blocks.map((b) => ({ label: BLOCK_SHORT[b.block], value: b.average ?? 0 }))} outerRadius="65%">
              <PolarGrid stroke="#f0abfc" strokeOpacity={0.5} />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="card-pad">
        <CardHeader title="Estudiantes por nivel de logro" />
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={stacked}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} width={28} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(['INICIO', 'EN_PROCESO', 'LOGRADO', 'EXCELENTE'] as const).map((l) => (
                <Bar key={l} dataKey={LEVELS[l].label} stackId="a" fill={LEVELS[l].color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function ConductReport({ sectionId, label }: { sectionId: number; label: string }) {
  const { data } = useAsync(() => reportApi.conduct(sectionId), [sectionId])
  if (!data) return <Spinner />
  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <Card className="card-pad h-fit">
        <CardHeader title="Resumen" />
        {(Object.keys(OBSERVATION_TYPES) as Array<keyof typeof OBSERVATION_TYPES>).map((k) => (
          <div key={k} className="flex items-center justify-between py-1.5 text-sm">
            <Badge tone={OBSERVATION_TYPES[k].tone}>{OBSERVATION_TYPES[k].label}</Badge>
            <b className="text-ink">{data.byType[k]}</b>
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-full"
          icon={<Printer className="h-3.5 w-3.5" />}
          onClick={() =>
            printDocument(
              'Reporte de conducta',
              `<h1>Reporte de conducta y participación — ${e(label)}</h1><table><tr><th>Fecha</th><th>Estudiante</th><th>Tipo</th><th>Observación</th></tr>${data.observations
                .map((o) => `<tr><td>${formatDate(o.date)}</td><td>${e(o.student.firstName)} ${e(o.student.lastName)}</td><td>${OBSERVATION_TYPES[o.type].label}</td><td>${e(o.content)}</td></tr>`)
                .join('')}</table>`,
              false,
            )
          }
        >
          Imprimir / PDF
        </Button>
      </Card>
      <Card className="card-pad">
        {!data.observations.length ? (
          <EmptyState title="Sin observaciones registradas" description="Regístralas desde el expediente de cada estudiante." />
        ) : (
          <ul className="space-y-2">
            {data.observations.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm text-ink">
                    {o.student.firstName} {o.student.lastName}
                  </b>
                  <Badge tone={OBSERVATION_TYPES[o.type].tone}>{OBSERVATION_TYPES[o.type].label}</Badge>
                  <span className="text-xs text-ink-3">{formatDate(o.date)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">{o.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function StudentsReports({ sectionId, kind, label }: { sectionId: number; kind: 'bulletin' | 'parent'; label: string }) {
  const { success, error } = useFeedback()
  const { data } = useAsync(() => reportApi.performance(sectionId), [sectionId])
  const [bulletin, setBulletin] = useState<number | null>(null)
  const [parent, setParent] = useState<number | null>(null)
  const [printing, setPrinting] = useState(false)

  const printAll = async () => {
    if (!data) return
    setPrinting(true)
    try {
      const all = await Promise.all(data.rows.map((r) => reportApi.bulletin(r.student.id)))
      printDocument(`Boletines ${label}`, all.map((b) => `<div style="page-break-after:always">${bulletinHtml(b)}</div>`).join(''))
    } catch (err) {
      error('No se pudieron generar', (err as Error).message)
    } finally {
      setPrinting(false)
    }
  }

  if (!data) return <Spinner />
  return (
    <Card className="card-pad">
      <CardHeader
        title={kind === 'bulletin' ? 'Boletines de notas (plantilla oficial)' : 'Reportes para padres'}
        subtitle={kind === 'bulletin' ? 'Genera el boletín individual o todos los de la sección' : 'Informes claros y visuales, exportables en PDF o compartibles por enlace seguro'}
        action={
          kind === 'bulletin' && (
            <Button size="sm" icon={<Printer className="h-3.5 w-3.5" />} loading={printing} onClick={printAll}>
              Imprimir todos
            </Button>
          )
        }
      />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {data.rows.map((r) => (
          <div key={r.student.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {r.student.lastName}, {r.student.firstName}
              </p>
              <p className="text-xs text-ink-3">
                Promedio {formatScore(r.score, 1)} {r.level && `· ${LEVELS[r.level].label}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {kind === 'bulletin' ? (
                <Button size="sm" variant="soft" onClick={() => setBulletin(r.student.id)}>
                  Boletín
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="soft" onClick={() => setParent(r.student.id)}>
                    Ver
                  </Button>
                  <button
                    className="icon-btn h-8 w-8"
                    title="Crear y copiar enlace seguro"
                    aria-label="Compartir enlace"
                    onClick={async () => {
                      try {
                        const link = await reportApi.share(r.student.id, 30)
                        await navigator.clipboard.writeText(`${window.location.origin}/familia/${link.token}`).catch(() => undefined)
                        success('Enlace seguro copiado', 'Válido por 30 días')
                      } catch (err) {
                        error('No se pudo crear el enlace', (err as Error).message)
                      }
                    }}
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <BulletinModal studentId={bulletin} onClose={() => setBulletin(null)} />
      <ParentReportModal studentId={parent} onClose={() => setParent(null)} />
    </Card>
  )
}
