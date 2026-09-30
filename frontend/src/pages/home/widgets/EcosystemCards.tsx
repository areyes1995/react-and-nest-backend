import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calculator, CalendarDays, ClipboardCheck, Presentation, Users } from 'lucide-react'
import { Card, CardHeader } from '@components/ui'
import { cn } from '@lib/cn'

const CARDS = [
  {
    title: 'Planificación docente',
    to: '/app/planificacion?tab=programaciones',
    color: 'text-pink-500',
    button: 'bg-brand-pink',
    tile: 'bg-soft-pink text-pink-500',
    icon: <CalendarDays className="h-7 w-7" />,
    items: ['Planificador anual, por periodo y semanal', 'Programaciones curriculares', 'Calendario académico'],
  },
  {
    title: 'Creación de clases',
    to: '/app/clases',
    color: 'text-violet-500',
    button: 'bg-brand-purple',
    tile: 'bg-soft-purple text-violet-500',
    icon: <Presentation className="h-7 w-7" />,
    items: ['Editor de presentaciones', 'Actividades interactivas', 'Biblioteca de recursos'],
  },
  {
    title: 'Herramientas matemáticas',
    to: '/app/herramientas',
    color: 'text-blue-500',
    button: 'bg-brand-blue',
    tile: 'bg-soft-blue text-blue-500',
    icon: <Calculator className="h-7 w-7" />,
    items: ['Calculadoras y graficador', 'Conversor de unidades', 'Editor de ecuaciones (LaTeX)'],
  },
  {
    title: 'Evaluación',
    to: '/app/evaluacion',
    color: 'text-orange-500',
    button: 'bg-brand-orange',
    tile: 'bg-soft-orange text-orange-500',
    icon: <ClipboardCheck className="h-7 w-7" />,
    items: ['Constructor de exámenes', 'Rúbricas y listas de cotejo', 'Escalas de valoración'],
  },
  {
    title: 'Seguimiento del estudiante',
    to: '/app/estudiantes',
    color: 'text-emerald-500',
    button: 'bg-brand-green',
    tile: 'bg-soft-green text-emerald-500',
    icon: <Users className="h-7 w-7" />,
    items: ['Asistencia y calificaciones', 'Alertas de bajo rendimiento', 'Reportes para padres'],
  },
]

export function EcosystemCards() {
  const navigate = useNavigate()
  return (
    <Card className="card-pad">
      <CardHeader title="Todo lo que necesitas, en un solo lugar" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((c) => (
          <div key={c.title} className="flex flex-col items-center rounded-2xl border border-line bg-surface-2 p-3 text-center">
            <span className={cn('grid h-14 w-14 place-items-center rounded-2xl', c.tile)}>{c.icon}</span>
            <p className={cn('mt-2 text-xs font-extrabold', c.color)}>{c.title}</p>
            <ul className="mt-1.5 flex-1 space-y-0.5 text-left text-[0.68rem] text-ink-2">
              {c.items.map((i) => (
                <li key={i} className="flex gap-1">
                  <span>•</span> {i}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate(c.to)} className={cn('mt-3 grid h-8 w-8 place-items-center rounded-full text-white shadow transition hover:scale-105', c.button)} aria-label={`Ir a ${c.title}`}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
