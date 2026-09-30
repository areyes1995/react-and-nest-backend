import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, FileText, Link2, Paperclip, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aiApi, reportApi, studentApi } from '@services/educraft'
import type { ObservationType } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, Modal, Select, Spinner, Stat, Tabs, Textarea } from '@components/ui'
import { ATTENDANCE, BLOCK_SHORT, EVALUATION_TYPES, OBSERVATION_TYPES, scoreTone } from '@lib/labels'
import { downloadBlob, formatDate, formatPercent, formatScore, fullName, sectionLabel } from '@lib/format'
import { BulletinModal, ParentReportModal } from '@/features/reports/StudentReports'

type Tab = 'resumen' | 'asistencia' | 'actividades' | 'observaciones' | 'evidencias' | 'reportes'

export default function StudentRecordPage() {
  const id = Number(useParams().id)
  const { success, error, confirm } = useFeedback()
  const { data, error: loadError, reload } = useAsync(() => studentApi.record(id), [id])
  const [tab, setTab] = useState<Tab>('resumen')
  const [obs, setObs] = useState<{ type: ObservationType; content: string }>({ type: 'PARTICIPATION', content: '' })
  const [generating, setGenerating] = useState(false)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evidence, setEvidence] = useState<{ title: string; description: string; url: string; file: File | null }>({ title: '', description: '', url: '', file: null })
  const [report, setReport] = useState<'bulletin' | 'parent' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (loadError) return <ErrorState message={loadError} onRetry={reload} />
  if (!data) return <Spinner />

  const { student, grades, attendance } = data
  const passing = student.section.schoolYear.gradingScale?.passing ?? 70
  const s = grades.summary
  const evolution = [1, 2, 3, 4].map((p) => ({ name: `P${p}`, promedio: s.periodAverages[p] }))
  const byBlock = [1, 2, 3, 4].map((b) => ({
    name: BLOCK_SHORT[b],
    ...Object.fromEntries([1, 2, 3, 4].map((p) => [`P${p}`, s.effective[b]?.[p] ?? null])),
  }))

  const generateObservation = async () => {
    setGenerating(true)
    try {
      const res = await aiApi.observation({ studentId: id, type: obs.type })
      setObs({ ...obs, content: res.text ?? '' })
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const addObservation = async () => {
    if (!obs.content.trim()) return
    try {
      await studentApi.addObservation(id, obs)
      setObs({ ...obs, content: '' })
      success('Observación registrada')
      void reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const addEvidence = async () => {
    if (!evidence.title.trim()) return
    try {
      await studentApi.addEvidence(id, { title: evidence.title, description: evidence.description || undefined, url: evidence.url || undefined, file: evidence.file ?? undefined })
      setEvidenceOpen(false)
      setEvidence({ title: '', description: '', url: '', file: null })
      success('Evidencia agregada')
      void reload()
    } catch (err) {
      error('No se pudo subir', (err as Error).message)
    }
  }

  const share = async () => {
    try {
      const link = await reportApi.share(id, 30)
      const url = `${window.location.origin}/familia/${link.token}`
      await navigator.clipboard.writeText(url).catch(() => undefined)
      success('Enlace seguro creado y copiado', 'Válido por 30 días.')
      void reload()
    } catch (err) {
      error('No se pudo crear el enlace', (err as Error).message)
    }
  }

  return (
    <div>
      <Link to="/app/estudiantes" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-brand-purple">
        <ArrowLeft className="h-4 w-4" /> Estudiantes
      </Link>
      <Card className="card-pad mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={fullName(student)} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{fullName(student)}</h1>
            <p className="text-sm text-ink-3">
              {sectionLabel(student.section.grade.name, student.section.name)} · No. {student.listNumber ?? '—'} · {student.section.schoolYear.name}
            </p>
            {student.guardianName && (
              <p className="mt-1 text-xs text-ink-2">
                Tutor: {student.guardianName} {student.guardianPhone && `· ${student.guardianPhone}`} {student.guardianEmail && `· ${student.guardianEmail}`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Calificación final" value={formatScore(s.finalScore)} tone={scoreTone(s.finalScore, passing) === 'red' ? 'text-red-500' : 'text-ink'} />
            <Stat label="Asistencia" value={formatPercent(attendance.rate)} />
            <Stat label="Situación" value={s.situation === 'A' ? 'Aprobado' : s.situation === 'R' ? 'Reprobado' : 'Pendiente'} tone="text-base" />
          </div>
        </div>
        {student.notes && <p className="mt-3 rounded-xl bg-soft-yellow px-3 py-2 text-xs text-amber-800 dark:text-amber-200">Adecuaciones / situaciones particulares: {student.notes}</p>}
      </Card>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { key: 'resumen', label: 'Evolución' },
          { key: 'asistencia', label: 'Asistencia', count: attendance.total },
          { key: 'actividades', label: 'Calificaciones', count: data.activities.length },
          { key: 'observaciones', label: 'Observaciones', count: data.observations.length },
          { key: 'evidencias', label: 'Evidencias', count: data.evidences.length },
          { key: 'reportes', label: 'Reportes' },
        ]}
      />

      {tab === 'resumen' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="card-pad">
            <CardHeader title="Evolución del aprendizaje" subtitle="Promedio por periodo" />
            <div className="h-60">
              <ResponsiveContainer>
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-3)' }} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="promedio" stroke="#ec4899" strokeWidth={3} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="card-pad">
            <CardHeader title="Rendimiento por competencia" subtitle="Nota efectiva (mayor entre P y RP)" />
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={byBlock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-3)' }} width={30} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {['#ec4899', '#8b5cf6', '#3b82f6', '#f97316'].map((c, i) => (
                    <Bar key={i} dataKey={`P${i + 1}`} fill={c} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === 'asistencia' && (
        <Card className="card-pad">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(ATTENDANCE) as Array<keyof typeof ATTENDANCE>).map((k) => (
              <Badge key={k} tone={ATTENDANCE[k].tone}>
                {ATTENDANCE[k].label}: {attendance.counts[k]}
              </Badge>
            ))}
          </div>
          {attendance.recent.length === 0 ? (
            <EmptyState title="Sin registros de asistencia" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {attendance.recent.map((a) => (
                <div key={a.date} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                  <span className="text-ink-2">{formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <Badge tone={ATTENDANCE[a.status].tone}>{ATTENDANCE[a.status].label}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'actividades' && (
        <Card className="card-pad">
          {data.activities.length === 0 ? (
            <EmptyState title="Sin actividades calificadas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Actividad</th>
                    <th>Tipo</th>
                    <th className="text-center">Periodo</th>
                    <th className="text-center">Competencia</th>
                    <th className="text-right">Puntuación</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap text-xs">{formatDate(a.date)}</td>
                      <td className="font-medium text-ink">
                        {a.title}
                        {a.feedback && <p className="text-xs text-ink-3">{a.feedback}</p>}
                      </td>
                      <td>
                        <Badge>{EVALUATION_TYPES[a.type]}</Badge>
                      </td>
                      <td className="text-center">P{a.period}</td>
                      <td className="text-center">PC{a.block}</td>
                      <td className="text-right font-bold">
                        {a.score == null ? (a.delivered ? 'Entregado' : '—') : `${formatScore(a.score, 1)} / ${a.maxScore}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'observaciones' && (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Card className="card-pad h-fit">
            <CardHeader title="Nueva observación" />
            <Field label="Tipo">
              <Select value={obs.type} onChange={(e) => setObs({ ...obs, type: e.target.value as ObservationType })} options={Object.entries(OBSERVATION_TYPES).map(([v, o]) => ({ value: v, label: o.label }))} />
            </Field>
            <Field label="Observación" className="mt-3">
              <Textarea rows={5} value={obs.content} onChange={(e) => setObs({ ...obs, content: e.target.value })} />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="soft" size="sm" loading={generating} icon={<Sparkles className="h-3.5 w-3.5" />} onClick={generateObservation}>
                Redactar con IA
              </Button>
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={addObservation} disabled={!obs.content.trim()}>
                Guardar
              </Button>
            </div>
          </Card>
          <Card className="card-pad">
            {data.observations.length === 0 ? (
              <EmptyState title="Sin observaciones" description="Registra conducta, participación y situaciones particulares." />
            ) : (
              <ul className="space-y-2">
                {data.observations.map((o) => (
                  <li key={o.id} className="rounded-2xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={OBSERVATION_TYPES[o.type].tone}>{OBSERVATION_TYPES[o.type].label}</Badge>
                        {o.aiGenerated && <Badge tone="pink">IA</Badge>}
                        <span className="text-xs text-ink-3">{formatDate(o.date)}</span>
                      </div>
                      <button
                        className="icon-btn h-7 w-7 hover:text-brand-red"
                        onClick={async () => {
                          if (await confirm({ title: 'Eliminar observación', danger: true, confirmLabel: 'Eliminar' })) {
                            await studentApi.removeObservation(o.id)
                            void reload()
                          }
                        }}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-ink-2">{o.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'evidencias' && (
        <Card className="card-pad">
          <CardHeader title="Evidencias de aprendizaje" action={<Button size="sm" icon={<Paperclip className="h-3.5 w-3.5" />} onClick={() => setEvidenceOpen(true)}>Agregar evidencia</Button>} />
          {data.evidences.length === 0 ? (
            <EmptyState title="Sin evidencias" description="Sube fotos de trabajos, hojas resueltas o enlaces a proyectos." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.evidences.map((e) => (
                <div key={e.id} className="rounded-2xl border border-line p-3">
                  <p className="font-semibold text-ink">{e.title}</p>
                  {e.assessment && <p className="text-xs text-ink-3">Actividad: {e.assessment.title}</p>}
                  {e.description && <p className="mt-1 text-xs text-ink-2">{e.description}</p>}
                  <div className="mt-2 flex gap-2">
                    {e.storageKey && (
                      <Button size="sm" variant="secondary" icon={<FileDown className="h-3.5 w-3.5" />} onClick={async () => downloadBlob(await studentApi.evidenceFile(e.id), e.title)}>
                        Descargar
                      </Button>
                    )}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        <Link2 className="h-3.5 w-3.5" /> Abrir
                      </a>
                    )}
                    <button
                      className="icon-btn h-8 w-8 hover:text-brand-red"
                      onClick={async () => {
                        if (await confirm({ title: 'Eliminar evidencia', danger: true, confirmLabel: 'Eliminar' })) {
                          await studentApi.removeEvidence(e.id)
                          void reload()
                        }
                      }}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'reportes' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-pad">
            <CardHeader title="Boletín de notas" subtitle="Plantilla oficial MINERD" />
            <Button icon={<FileText className="h-4 w-4" />} onClick={() => setReport('bulletin')}>
              Ver boletín
            </Button>
          </Card>
          <Card className="card-pad">
            <CardHeader title="Reporte para la familia" subtitle="Asistencia, rendimiento, fortalezas y recomendaciones" />
            <div className="flex flex-wrap gap-2">
              <Button icon={<FileText className="h-4 w-4" />} onClick={() => setReport('parent')}>
                Ver reporte
              </Button>
              <Button variant="secondary" icon={<Link2 className="h-4 w-4" />} onClick={share}>
                Crear enlace seguro
              </Button>
            </div>
            {data.reportLinks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {data.reportLinks.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs">
                    <button
                      className="truncate text-left font-mono text-brand-purple hover:underline"
                      onClick={() => {
                        void navigator.clipboard.writeText(`${window.location.origin}/familia/${l.token}`)
                        success('Enlace copiado')
                      }}
                    >
                      /familia/{l.token.slice(0, 10)}…
                    </button>
                    <span className="shrink-0 text-ink-3">vence {formatDate(l.expiresAt)}</span>
                    <button
                      className="shrink-0 text-red-500 hover:underline"
                      onClick={async () => {
                        await reportApi.revoke(l.id)
                        void reload()
                      }}
                    >
                      Revocar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title="Agregar evidencia"
        footer={
          <Button onClick={addEvidence} disabled={!evidence.title.trim() || (!evidence.file && !evidence.url)}>
            Guardar evidencia
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="Título">
            <Input value={evidence.title} onChange={(e) => setEvidence({ ...evidence, title: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea value={evidence.description} onChange={(e) => setEvidence({ ...evidence, description: e.target.value })} />
          </Field>
          <Field label="Archivo">
            <button onClick={() => fileRef.current?.click()} className="btn btn-secondary w-full">
              <Paperclip className="h-4 w-4" /> {evidence.file ? evidence.file.name : 'Seleccionar archivo'}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setEvidence({ ...evidence, file: e.target.files?.[0] ?? null })} />
          </Field>
          <Field label="…o enlace">
            <Input value={evidence.url} onChange={(e) => setEvidence({ ...evidence, url: e.target.value })} placeholder="https://" />
          </Field>
        </div>
      </Modal>

      <BulletinModal studentId={report === 'bulletin' ? id : null} onClose={() => setReport(null)} />
      <ParentReportModal studentId={report === 'parent' ? id : null} onClose={() => setReport(null)} />
    </div>
  )
}
