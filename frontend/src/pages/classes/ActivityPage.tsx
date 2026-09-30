import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Maximize2, Pencil, Play, Save, Trash2, X } from 'lucide-react'
import { planningApi } from '@services/educraft'
import type { InteractiveActivity } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Badge, Button, Card, Field, Input, Spinner, Tabs, Textarea } from '@components/ui'
import { ActivityPlayer } from '@/features/classes/ActivityPlayer'
import { ACTIVITY_TYPES } from '@lib/labels'

export default function ActivityPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { success, error, confirm } = useFeedback()
  const [activity, setActivity] = useState<InteractiveActivity | null>(null)
  const [mode, setMode] = useState<'play' | 'edit'>('play')
  const [json, setJson] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    planningApi
      .activity(id)
      .then((a) => {
        setActivity(a)
        setJson(JSON.stringify(a.content, null, 2))
      })
      .catch((err) => error('No se pudo abrir', (err as Error).message))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activity) return <Spinner />

  const save = async () => {
    try {
      const content = JSON.parse(json)
      const updated = await planningApi.updateActivity(id, { title: activity.title, instructions: activity.instructions, content })
      setActivity({ ...activity, ...updated })
      setPlayKey((k) => k + 1)
      success('Actividad guardada')
    } catch (err) {
      error('No se pudo guardar', err instanceof SyntaxError ? 'El contenido no es un JSON válido.' : (err as Error).message)
    }
  }

  const player = (
    <div key={playKey}>
      <ActivityPlayer type={activity.type} content={activity.content} />
    </div>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => navigate('/app/clases?tab=actividades')} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-brand-purple">
          <ArrowLeft className="h-4 w-4" /> Actividades
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Tabs
            value={mode}
            onChange={setMode}
            items={[
              { key: 'play', label: 'Jugar', icon: <Play className="h-3.5 w-3.5" /> },
              { key: 'edit', label: 'Editar', icon: <Pencil className="h-3.5 w-3.5" /> },
            ]}
          />
          <Button variant="secondary" size="sm" icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={() => setFullscreen(true)}>
            Proyectar
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={async () => {
              if (await confirm({ title: 'Eliminar actividad', danger: true, confirmLabel: 'Eliminar' })) {
                await planningApi.removeActivity(id)
                navigate('/app/clases?tab=actividades')
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <Card className="card-pad">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={ACTIVITY_TYPES[activity.type].tone}>{ACTIVITY_TYPES[activity.type].label}</Badge>
          {activity.aiGenerated && <Badge tone="pink">IA</Badge>}
          <h1 className="text-lg font-extrabold">{activity.title}</h1>
        </div>
        {activity.instructions && <p className="mb-4 text-sm text-ink-2">{activity.instructions}</p>}
        {mode === 'play' ? (
          player
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Field label="Título">
                <Input value={activity.title} onChange={(e) => setActivity({ ...activity, title: e.target.value })} />
              </Field>
              <Field label="Instrucciones">
                <Textarea value={activity.instructions ?? ''} onChange={(e) => setActivity({ ...activity, instructions: e.target.value })} />
              </Field>
              <Field label="Contenido (JSON)" hint="Edita preguntas, respuestas, pares o retos. Las fórmulas pueden ir entre $…$.">
                <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={16} className="font-mono text-xs" />
              </Field>
              <Button icon={<Save className="h-4 w-4" />} onClick={save}>
                Guardar cambios
              </Button>
            </div>
            <div className="rounded-2xl border border-dashed border-line p-4">
              <p className="mb-3 text-xs font-bold uppercase text-ink-3">Vista previa</p>
              {player}
            </div>
          </div>
        )}
      </Card>

      {fullscreen && (
        <div className="fixed inset-0 z-[95] overflow-y-auto bg-app p-6 sm:p-12">
          <button className="btn btn-secondary absolute right-6 top-6" onClick={() => setFullscreen(false)}>
            <X className="h-4 w-4" /> Salir
          </button>
          <div className="mx-auto max-w-5xl text-lg">
            <h1 className="mb-6 text-3xl font-extrabold">{activity.title}</h1>
            {player}
          </div>
        </div>
      )}
    </div>
  )
}
