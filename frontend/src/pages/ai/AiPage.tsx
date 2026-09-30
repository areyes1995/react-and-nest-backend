import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpenCheck, ClipboardCheck, Gamepad2, LayoutList, MessageCircleQuestion, PencilRuler, Presentation, Sigma, UserRoundCheck } from 'lucide-react'
import { aiApi } from '@services/educraft'
import { useAsync } from '@hooks/useAsync'
import { Badge, Card, PageHeader } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { ProblemGenerator } from '@/features/ai/ProblemGenerator'
import { SessionGenerator } from '@/features/ai/SessionGenerator'
import { StepByStepBoard } from '@/features/ai/StepByStepBoard'
import { TutorConsole } from '@/features/ai/TutorConsole'
import { cn } from '@lib/cn'

type Tool = 'problemas' | 'sesion' | 'ejemplos' | 'tutor'

const CARDS: Array<{ key: Tool; title: string; text: string; icon: React.ReactNode; gradient: string }> = [
  { key: 'problemas', title: 'Generador de Problemas Contextualizados', text: 'Tema, competencia, nivel, contexto y dificultad → problema, solución, procedimiento y variantes.', icon: <PencilRuler className="h-7 w-7" />, gradient: 'from-pink-100 to-pink-50 text-pink-600' },
  { key: 'sesion', title: 'Generador de Sesiones Completas', text: 'Propósito, inicio, desarrollo, cierre, recursos, evaluación, evidencias e instrumentos.', icon: <BookOpenCheck className="h-7 w-7" />, gradient: 'from-amber-100 to-orange-50 text-orange-600' },
  { key: 'ejemplos', title: 'Creador de Ejemplos Paso a Paso', text: 'Procedimientos completos listos para proyectar en la pizarra digital.', icon: <Sigma className="h-7 w-7" />, gradient: 'from-sky-100 to-blue-50 text-blue-600' },
  { key: 'tutor', title: 'Tutor Virtual Docente', text: 'Asistente permanente: didáctica, actividades, errores frecuentes y rúbricas.', icon: <MessageCircleQuestion className="h-7 w-7" />, gradient: 'from-violet-100 to-fuchsia-50 text-violet-600' },
]

const MORE = [
  { label: 'Exámenes y rúbricas', to: '/app/evaluacion', icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Actividades interactivas', to: '/app/clases?tab=actividades', icon: <Gamepad2 className="h-4 w-4" /> },
  { label: 'Programación anual', to: '/app/planificacion?tab=programaciones', icon: <LayoutList className="h-4 w-4" /> },
  { label: 'Presentaciones', to: '/app/clases', icon: <Presentation className="h-4 w-4" /> },
  { label: 'Estrategias de refuerzo', to: '/app/seguimiento', icon: <UserRoundCheck className="h-4 w-4" /> },
]

export default function AiPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tool = (params.get('tool') as Tool) || null
  const topic = params.get('topic') ?? ''
  const { data: status } = useAsync(() => aiApi.status())

  return (
    <div>
      <PageHeader
        title="IA Educraft"
        subtitle="El centro neurálgico de inteligencia artificial, alineado a la Adecuación Curricular de Matemática"
        icon={<Robot size={56} />}
        actions={
          status && (
            <Badge tone={status.providerEnabled ? 'green' : 'purple'}>
              {status.providerEnabled ? `Proveedor de IA activo (${status.model})` : 'Modo plantillas pedagógicas (sin proveedor externo)'}
            </Badge>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <button
            key={c.key}
            onClick={() => setParams({ tool: c.key })}
            className={cn('card flex flex-col items-start gap-3 bg-gradient-to-br p-5 text-left transition hover:-translate-y-1 dark:from-surface dark:to-surface-2', c.gradient, tool === c.key && 'ring-2 ring-brand-pink')}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/80 shadow-sm dark:bg-white/10">{c.icon}</span>
            <span className="text-base font-extrabold text-ink">{c.title}</span>
            <span className="text-xs text-ink-2">{c.text}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-3">También con IA:</span>
        {MORE.map((m) => (
          <button key={m.label} onClick={() => navigate(m.to)} className="chip">
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {tool && (
        <Card className="card-pad mt-5 animate-fade-in">
          <h2 className="mb-4 text-lg font-extrabold">{CARDS.find((c) => c.key === tool)?.title}</h2>
          {tool === 'problemas' && <ProblemGenerator initialTopic={topic} />}
          {tool === 'sesion' && <SessionGenerator initialTopic={topic} />}
          {tool === 'ejemplos' && <StepByStepBoard />}
          {tool === 'tutor' && <TutorConsole />}
        </Card>
      )}
    </div>
  )
}
