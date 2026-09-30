import { useState } from 'react'
import { ArrowRight, BookOpenCheck, ClipboardList, MessageCircleQuestion, PencilRuler } from 'lucide-react'
import { useAssistant } from '@context/AssistantContext'
import { Modal } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { ProblemGenerator } from '@/features/ai/ProblemGenerator'
import { SessionGenerator } from '@/features/ai/SessionGenerator'
import { StepByStepBoard } from '@/features/ai/StepByStepBoard'

type Tool = 'problems' | 'session' | 'examples' | null

const TOOLS = [
  { key: 'problems' as const, title: 'Generar problemas', text: 'Crea ejercicios personalizados', icon: <PencilRuler className="h-5 w-5 text-pink-500" /> },
  { key: 'session' as const, title: 'Generar sesión', text: 'Diseña sesiones de aprendizaje completas', icon: <BookOpenCheck className="h-5 w-5 text-amber-500" /> },
  { key: 'examples' as const, title: 'Crear ejemplos', text: 'Explicaciones paso a paso', icon: <ClipboardList className="h-5 w-5 text-blue-500" /> },
  { key: 'tutor' as const, title: 'Tutor virtual', text: 'Resuelve dudas y acompaña tu labor', icon: <MessageCircleQuestion className="h-5 w-5 text-violet-500" /> },
]

export function AiWidget() {
  const assistant = useAssistant()
  const [tool, setTool] = useState<Tool>(null)

  return (
    <section className="card relative overflow-hidden bg-gradient-to-br from-pink-50 via-fuchsia-50 to-violet-100 p-4 dark:from-pink-950/30 dark:via-fuchsia-950/20 dark:to-violet-950/40 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-base font-extrabold text-violet-950 dark:text-violet-50">
            <span className="rounded-md bg-brand-pink px-1.5 py-0.5 text-[0.65rem] font-bold text-white">IA</span> Educraft
          </p>
          <p className="text-xs text-ink-2">Tu asistente inteligente para la enseñanza</p>
        </div>
        <Robot size={78} className="-mr-2 -mt-3" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => (t.key === 'tutor' ? assistant.open() : setTool(t.key))}
            className="flex items-start gap-2 rounded-2xl bg-white/85 p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:bg-surface"
          >
            {t.icon}
            <span>
              <span className="block text-xs font-bold text-ink">{t.title}</span>
              <span className="block text-[0.68rem] leading-snug text-ink-3">{t.text}</span>
            </span>
          </button>
        ))}
      </div>
      <button onClick={() => assistant.open()} className="btn btn-primary mt-3 w-full">
        Abrir asistente IA <ArrowRight className="h-4 w-4" />
      </button>

      <Modal open={tool === 'problems'} onClose={() => setTool(null)} size="xl" title="Generador de problemas contextualizados">
        <ProblemGenerator />
      </Modal>
      <Modal open={tool === 'session'} onClose={() => setTool(null)} size="full" title="Generador de sesiones completas">
        <SessionGenerator onDone={() => setTool(null)} />
      </Modal>
      <Modal open={tool === 'examples'} onClose={() => setTool(null)} size="lg" title="Creador de ejemplos paso a paso" subtitle="Pizarra interactiva digital">
        <StepByStepBoard />
      </Modal>
    </section>
  )
}
