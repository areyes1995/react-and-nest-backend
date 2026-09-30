import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Copy, FileDown, FilePlus2, MonitorPlay, Pencil, Plus, Printer, Search, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { aiApi, planningApi } from '@services/educraft'
import type { LearningUnit, LessonPlan, Section } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useGrades } from '@hooks/useCatalog'
import { Badge, Button, Card, CardHeader, EmptyState, Modal, Select, Spinner } from '@components/ui'
import { SessionGenerator } from '@/features/ai/SessionGenerator'
import { planDocumentHtml } from '@/features/planning/planDocument'
import { indicatorTexts } from '@/features/planning/LessonPlanTable'
import { exportWord, printDocument } from '@lib/exporters'
import { PLAN_STATUS, UNIT_KINDS } from '@lib/labels'
import { formatDate, sectionLabel, slugify } from '@lib/format'
import { cn } from '@lib/cn'
import { UnitEditorModal } from './UnitEditorModal'

export function ProgramsTab({ sections }: { sections: Section[] }) {
  const navigate = useNavigate()
  const grades = useGrades()
  const { success, error, confirm } = useFeedback()
  const [gradeId, setGradeId] = useState<number | ''>('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<LearningUnit | null | undefined>(undefined)
  const [open, setOpen] = useState<number | null>(null)
  const [generator, setGenerator] = useState(false)
  const [generatingProgram, setGeneratingProgram] = useState(false)
  const units = useAsync(() => planningApi.units(gradeId ? { gradeId: Number(gradeId) } : {}), [gradeId])
  const plans = useAsync(() => planningApi.plans({ q: q || undefined }), [q])

  const visiblePlans = useMemo(() => (plans.data ?? []).filter((p) => !gradeId || p.gradeId === gradeId), [plans.data, gradeId])

  const generateProgram = async () => {
    const target = gradeId || sections[0]?.gradeId || grades[0]?.id
    if (!target) return
    const ok = await confirm({
      title: 'Generar programación anual con IA',
      description: 'Se crearán unidades didácticas a partir de los contenidos del grado, distribuidas en los periodos del año escolar activo, con sus competencias e indicadores.',
      confirmLabel: 'Generar',
    })
    if (!ok) return
    setGeneratingProgram(true)
    try {
      const res = await aiApi.program({ gradeId: Number(target), save: true })
      success('Programación generada', `${res.units.length} unidades creadas`)
      void units.reload()
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setGeneratingProgram(false)
    }
  }

  const removeUnit = async (u: LearningUnit) => {
    if (!(await confirm({ title: 'Eliminar programación', description: `¿Eliminar “${u.title}”? Las sesiones vinculadas se conservan.`, danger: true, confirmLabel: 'Eliminar' }))) return
    await planningApi.removeUnit(u.id)
    void units.reload()
  }

  const exportPlan = async (p: LessonPlan, format: 'word' | 'pdf') => {
    const full = await planningApi.plan(p.id)
    const html = planDocumentHtml({
      title: full.title,
      topic: full.topic,
      gradeName: full.grade.name,
      sectionName: full.section?.name,
      date: full.date,
      durationMinutes: full.durationMinutes,
      purpose: full.purpose,
      strategies: full.strategies,
      moments: full.moments,
      indicators: indicatorTexts(full.curriculum, full.evaluation),
      curriculum: full.curriculum,
      assignment: full.assignment,
    })
    if (format === 'word') exportWord(full.title, html, `plan-${slugify(full.title)}`)
    else printDocument(full.title, html)
  }

  const exportAll = async (format: 'word' | 'pdf') => {
    const list = (units.data ?? []).map(
      (u) => `<h2>${u.title}</h2><p class="muted">${UNIT_KINDS[u.kind]} · ${u.grade?.name ?? ''} · ${u.startDate ? formatDate(u.startDate) : ''} – ${u.endDate ? formatDate(u.endDate) : ''}</p><p>${u.description ?? ''}</p>${
        u.evaluationCriteria.length ? `<h3>Criterios de evaluación</h3><ul>${u.evaluationCriteria.map((c) => `<li>${c}</li>`).join('')}</ul>` : ''
      }${u.evidences.length ? `<h3>Evidencias</h3><ul>${u.evidences.map((c) => `<li>${c}</li>`).join('')}</ul>` : ''}`,
    )
    const html = `<h1>Programación curricular de Matemática</h1>${list.join('') || '<p>Sin unidades.</p>'}`
    if (format === 'word') exportWord('Programación curricular', html, 'programacion-curricular')
    else printDocument('Programación curricular', html, false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={gradeId} onChange={(e) => setGradeId(e.target.value ? Number(e.target.value) : '')} placeholder="Todos los grados" options={grades.map((g) => ({ value: g.id, label: g.name }))} className="w-auto" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={<FileDown className="h-3.5 w-3.5" />} onClick={() => exportAll('word')}>
            Exportar Word
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => exportAll('pdf')}>
            Exportar PDF
          </Button>
          <Button variant="soft" size="sm" icon={<Wand2 className="h-3.5 w-3.5" />} loading={generatingProgram} onClick={generateProgram}>
            Programación anual con IA
          </Button>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing(null)}>
            Nueva unidad
          </Button>
        </div>
      </div>

      <Card className="card-pad">
        <CardHeader title="Programaciones curriculares" subtitle="Programación anual, unidades didácticas, experiencias de aprendizaje y proyectos" />
        {units.loading && !units.data ? (
          <Spinner />
        ) : !units.data?.length ? (
          <EmptyState title="Sin programaciones" description="Crea tu primera unidad o genera la programación anual del grado con IA." />
        ) : (
          <div className="space-y-2">
            {units.data.map((u) => (
              <div key={u.id} className="rounded-2xl border border-line" style={{ borderLeft: `4px solid ${u.color ?? '#a855f7'}` }}>
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <button onClick={() => setOpen(open === u.id ? null : u.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-3 transition', open === u.id && 'rotate-180')} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{u.title}</p>
                      <p className="text-xs text-ink-3">
                        {UNIT_KINDS[u.kind]} · {u.grade?.name} {u.startDate && `· ${formatDate(u.startDate, { day: 'numeric', month: 'short' })} – ${formatDate(u.endDate ?? u.startDate, { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="purple">{u.specificCompetenceIds.length} competencias</Badge>
                    <Badge tone="blue">{u.indicatorIds.length} indicadores</Badge>
                    <Badge tone="green">{u._count?.lessonPlans ?? 0} sesiones</Badge>
                    {u.aiGenerated && <Badge tone="pink">IA</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <button className="icon-btn h-8 w-8" onClick={() => navigate('/app/planificacion/planes/nuevo', { state: { unitId: u.id, gradeId: u.gradeId } })} title="Nueva sesión en esta unidad" aria-label="Nueva sesión">
                      <FilePlus2 className="h-4 w-4" />
                    </button>
                    <button className="icon-btn h-8 w-8" onClick={() => setEditing(u)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="icon-btn h-8 w-8 hover:text-brand-red" onClick={() => removeUnit(u)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {open === u.id && <UnitDetail unitId={u.id} />}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="card-pad">
        <CardHeader
          title="Sesiones de aprendizaje (planes de clase)"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="soft" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setGenerator(true)}>
                Generar sesión con IA
              </Button>
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/app/planificacion/planes/nuevo')}>
                Nuevo plan
              </Button>
            </div>
          }
        />
        <div className="relative mb-3 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o tema" className="input pl-9" />
        </div>
        {plans.loading && !plans.data ? (
          <Spinner />
        ) : !visiblePlans.length ? (
          <EmptyState title="Sin planes de clase" description="Usa el generador de sesiones o crea un plan con la plantilla oficial." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesión</th>
                  <th>Sección</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlans.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap text-xs">{p.date ? formatDate(p.date) : '—'}</td>
                    <td>
                      <button onClick={() => navigate(`/app/planificacion/planes/${p.id}`)} className="text-left font-semibold text-ink hover:text-brand-purple">
                        {p.title}
                      </button>
                      <p className="text-xs text-ink-3">
                        {p.topic} · {p.durationMinutes} min {p.unit && `· ${p.unit.title}`}
                      </p>
                    </td>
                    <td className="text-xs">{p.section ? sectionLabel(p.grade.name, p.section.name) : p.grade.name}</td>
                    <td>
                      <Badge tone={PLAN_STATUS[p.status].tone}>{PLAN_STATUS[p.status].label}</Badge> {p.aiGenerated && <Badge tone="pink">IA</Badge>}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="icon-btn h-8 w-8"
                          title="Generar presentación"
                          aria-label="Generar presentación"
                          onClick={async () => {
                            try {
                              const res = await aiApi.presentation(p.id)
                              navigate(`/app/clases/presentaciones/${res.presentation.id}`)
                            } catch (err) {
                              error('No se pudo crear la presentación', (err as Error).message)
                            }
                          }}
                        >
                          <MonitorPlay className="h-4 w-4" />
                        </button>
                        <button
                          className="icon-btn h-8 w-8"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={async () => {
                            await planningApi.duplicatePlan(p.id)
                            success('Sesión duplicada')
                            void plans.reload()
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="icon-btn h-8 w-8" title="Exportar Word" aria-label="Exportar Word" onClick={() => exportPlan(p, 'word')}>
                          <FileDown className="h-4 w-4" />
                        </button>
                        <button className="icon-btn h-8 w-8" title="Imprimir / PDF" aria-label="Imprimir" onClick={() => exportPlan(p, 'pdf')}>
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          className="icon-btn h-8 w-8 hover:text-brand-red"
                          aria-label="Eliminar"
                          onClick={async () => {
                            if (await confirm({ title: 'Eliminar plan de clase', description: `¿Eliminar “${p.title}”?`, danger: true, confirmLabel: 'Eliminar' })) {
                              await planningApi.removePlan(p.id)
                              void plans.reload()
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UnitEditorModal open={editing !== undefined} unit={editing} sections={sections} defaults={gradeId ? { gradeId: Number(gradeId) } : undefined} onClose={() => setEditing(undefined)} onSaved={units.reload} />
      <Modal open={generator} onClose={() => setGenerator(false)} size="full" title="Generador de sesiones completas">
        <SessionGenerator onDone={() => setGenerator(false)} />
      </Modal>
    </div>
  )
}

function UnitDetail({ unitId }: { unitId: number }) {
  const navigate = useNavigate()
  const { data } = useAsync(() => planningApi.unit(unitId), [unitId])
  if (!data) return <Spinner className="py-4" />
  return (
    <div className="grid gap-4 border-t border-line p-4 md:grid-cols-2">
      <div className="space-y-2 text-xs text-ink-2">
        {data.description && <p>{data.description}</p>}
        {data.curriculum?.competences.map((c) => (
          <p key={c.id}>
            <b className="text-brand-purple">{c.fundamental.name}:</b> {c.description}
          </p>
        ))}
        {data.curriculum?.contents.length ? (
          <div>
            <p className="font-bold text-ink">Contenidos</p>
            <ul className="list-disc pl-4">
              {data.curriculum.contents.map((c) => (
                <li key={c.id}>{c.description}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-ink">Sesiones de la unidad</p>
        <ul className="space-y-1">
          {data.lessonPlans?.map((p) => (
            <li key={p.id}>
              <button onClick={() => navigate(`/app/planificacion/planes/${p.id}`)} className="flex w-full items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-left text-xs hover:text-brand-purple">
                <span className="font-semibold">{p.title}</span>
                <span className="text-ink-3">{p.date ? formatDate(p.date) : 'Sin fecha'}</span>
              </button>
            </li>
          ))}
          {!data.lessonPlans?.length && <li className="text-xs text-ink-3">Aún no hay sesiones vinculadas.</li>}
        </ul>
      </div>
    </div>
  )
}
