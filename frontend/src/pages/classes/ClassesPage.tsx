import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Blocks, Gamepad2, LayoutTemplate, Plus, Presentation as PresentationIcon, Sparkles, Trash2 } from 'lucide-react'
import { aiApi, planningApi } from '@services/educraft'
import type { ActivityType, Difficulty } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useGrades } from '@hooks/useCatalog'
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, TONE_CLASSES } from '@components/ui'
import { SlideView } from '@/features/classes/SlideView'
import { templateSlides } from '@/features/classes/templates'
import { ACTIVITY_TYPES, DIFFICULTY } from '@lib/labels'
import { formatDate } from '@lib/format'
import { cn } from '@lib/cn'

type Tab = 'presentaciones' | 'actividades'

const GAMES: ActivityType[] = ['ROULETTE', 'MEMORY', 'ESCAPE_ROOM', 'QUIZ_GAME']

export default function ClassesPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'presentaciones'
  const navigate = useNavigate()
  const grades = useGrades()
  const { success, error, confirm } = useFeedback()
  const presentations = useAsync(() => planningApi.presentations())
  const activities = useAsync(() => planningApi.activities())
  const plans = useAsync(() => planningApi.plans())
  const [newPresentation, setNewPresentation] = useState(false)
  const [newActivity, setNewActivity] = useState<ActivityType | null>(null)
  const [form, setForm] = useState({ title: '', planId: '', topic: '', gradeId: '', difficulty: 'MEDIUM' as Difficulty })
  const [busy, setBusy] = useState(false)

  const createPresentation = async () => {
    setBusy(true)
    try {
      const p = form.planId
        ? await planningApi.planToPresentation(Number(form.planId))
        : await planningApi.createPresentation({ title: form.title || 'Nueva presentación', slides: templateSlides(form.title || 'Nombre de la clase') })
      navigate(`/app/clases/presentaciones/${p.id}`)
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const createActivity = async () => {
    if (!newActivity || !form.topic.trim()) return
    setBusy(true)
    try {
      const res = await aiApi.activity({ type: newActivity, topic: form.topic, gradeId: form.gradeId ? Number(form.gradeId) : undefined, difficulty: form.difficulty, save: true })
      success('Actividad creada')
      navigate(`/app/clases/actividades/${res.activity.id}`)
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Creación de clases"
        subtitle="El “Canva para docentes”: presentaciones con bloques reutilizables y actividades interactivas"
        actions={
          <>
            <Button variant="secondary" icon={<Gamepad2 className="h-4 w-4" />} onClick={() => setNewActivity('QUIZ_GAME')}>
              Nueva actividad
            </Button>
            <Button icon={<Blocks className="h-4 w-4" />} onClick={() => setNewPresentation(true)}>
              Editor de bloques
            </Button>
          </>
        }
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        items={[
          { key: 'presentaciones', label: 'Mis Presentaciones', icon: <PresentationIcon className="h-4 w-4" />, count: presentations.data?.length },
          { key: 'actividades', label: 'Actividades Interactivas', icon: <Gamepad2 className="h-4 w-4" />, count: activities.data?.length },
        ]}
      />

      {tab === 'presentaciones' ? (
        <div className="space-y-4">
          <Card className="card-pad">
            <CardHeader title="Plantillas" subtitle="Estética pastel lista para proyectar" icon={<LayoutTemplate className="h-5 w-5 text-brand-purple" />} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {templateSlides().slice(0, 6).map((s) => (
                <button key={s.id} onClick={() => setNewPresentation(true)} className="rounded-xl p-0.5 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-pink-300">
                  <SlideView slide={s} />
                </button>
              ))}
            </div>
          </Card>
          <Card className="card-pad">
            <CardHeader title="Mis presentaciones" />
            {presentations.loading && !presentations.data ? (
              <Spinner />
            ) : !presentations.data?.length ? (
              <EmptyState title="Sin presentaciones" description="Crea una desde la plantilla oficial o a partir de un plan de clase." action={<Button onClick={() => setNewPresentation(true)}>Crear presentación</Button>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {presentations.data.map((p) => (
                  <div key={p.id} className="group rounded-2xl border border-line bg-surface-2 p-2">
                    <Link to={`/app/clases/presentaciones/${p.id}`}>{p.slides[0] && <SlideView slide={p.slides[0]} />}</Link>
                    <div className="mt-2 flex items-start justify-between gap-2 px-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{p.title}</p>
                        <p className="text-xs text-ink-3">
                          {p.slides.length} diapositivas · {formatDate(p.updatedAt)}
                        </p>
                      </div>
                      <button
                        className="icon-btn h-8 w-8 opacity-0 hover:text-brand-red group-hover:opacity-100"
                        aria-label="Eliminar"
                        onClick={async () => {
                          if (await confirm({ title: 'Eliminar presentación', description: `¿Eliminar “${p.title}”?`, danger: true, confirmLabel: 'Eliminar' })) {
                            await planningApi.removePresentation(p.id)
                            void presentations.reload()
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="card-pad">
            <CardHeader title="Dinámicas de juego" subtitle="Ruletas, memoramas, escape rooms y juegos tipo quiz generados a partir del tema" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {GAMES.map((t) => (
                <button key={t} onClick={() => setNewActivity(t)} className={cn('flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition hover:-translate-y-0.5', TONE_CLASSES[ACTIVITY_TYPES[t].tone])}>
                  <span className="text-2xl">{t === 'ROULETTE' ? '🎡' : t === 'MEMORY' ? '🧠' : t === 'ESCAPE_ROOM' ? '🔐' : '🏆'}</span>
                  <span className="text-sm font-bold">{ACTIVITY_TYPES[t].label}</span>
                  <span className="text-xs opacity-80">{ACTIVITY_TYPES[t].description}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-ink-3">Más actividades sin programar</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_TYPES) as ActivityType[])
                .filter((t) => !GAMES.includes(t))
                .map((t) => (
                  <button key={t} onClick={() => setNewActivity(t)} className="chip">
                    <Plus className="h-3.5 w-3.5" /> {ACTIVITY_TYPES[t].label}
                  </button>
                ))}
            </div>
          </Card>
          <Card className="card-pad">
            <CardHeader title="Mis actividades" />
            {!activities.data?.length ? (
              <EmptyState title="Sin actividades" description="Elige un tipo de actividad y un tema: la IA la genera por ti." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activities.data.map((a) => (
                  <Link key={a.id} to={`/app/clases/actividades/${a.id}`} className="rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:shadow-card">
                    <Badge tone={ACTIVITY_TYPES[a.type].tone}>{ACTIVITY_TYPES[a.type].label}</Badge>
                    <p className="mt-2 text-sm font-bold text-ink">{a.title}</p>
                    <p className="text-xs text-ink-3">
                      {a.grade?.name ?? 'Cualquier grado'} · {formatDate(a.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={newPresentation}
        onClose={() => setNewPresentation(false)}
        title="Nueva presentación"
        footer={
          <Button onClick={createPresentation} loading={busy}>
            Crear y abrir el editor
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="A partir de un plan de clase (opcional)">
            <Select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} placeholder="Plantilla oficial en blanco" options={(plans.data ?? []).map((p) => ({ value: p.id, label: p.title }))} />
          </Field>
          {!form.planId && (
            <Field label="Título de la clase">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la clase" />
            </Field>
          )}
          <p className="text-xs text-ink-3">Se usa la plantilla de presentación de clase: portada, reflexión, retroalimentación, propósito, contenidos, actividades, asignación y frase final.</p>
        </div>
      </Modal>

      <Modal
        open={!!newActivity}
        onClose={() => setNewActivity(null)}
        size="lg"
        title="Constructor de actividades interactivas"
        subtitle="Crea actividades sin programar: la IA las genera a partir del tema"
        footer={
          <Button onClick={createActivity} loading={busy} disabled={!form.topic.trim()} icon={<Sparkles className="h-4 w-4" />}>
            Generar actividad
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(ACTIVITY_TYPES) as ActivityType[]).map((t) => (
              <button key={t} onClick={() => setNewActivity(t)} className={cn('rounded-2xl border-2 p-3 text-left transition', newActivity === t ? 'border-brand-purple bg-soft-purple' : 'border-line hover:border-violet-200')}>
                <p className="text-sm font-bold text-ink">{ACTIVITY_TYPES[t].label}</p>
                <p className="text-xs text-ink-3">{ACTIVITY_TYPES[t].description}</p>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tema" className="sm:col-span-3">
              <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Ej.: ecuaciones lineales, fracciones, probabilidad" />
            </Field>
            <Field label="Grado">
              <Select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} placeholder="Cualquiera" options={grades.map((g) => ({ value: g.id, label: g.name }))} />
            </Field>
            <Field label="Dificultad">
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} options={Object.entries(DIFFICULTY).map(([v, d]) => ({ value: v, label: d.label }))} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
