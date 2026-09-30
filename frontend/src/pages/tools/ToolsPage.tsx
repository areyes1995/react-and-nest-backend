import { useSearchParams } from 'react-router-dom'
import { Calculator, Columns2, LineChart, Ruler, Sigma } from 'lucide-react'
import { PageHeader } from '@components/ui'
import { ScientificCalculator } from '@/features/tools/ScientificCalculator'
import { GraphingCalculator } from '@/features/tools/GraphingCalculator'
import { UnitConverter } from '@/features/tools/UnitConverter'
import { LatexEditor } from '@/features/tools/LatexEditor'
import { cn } from '@lib/cn'

type Tool = 'calculadora' | 'graficadora' | 'conversor' | 'latex' | 'laboratorio'

const TOOLS: Array<{ key: Tool; label: string; icon: React.ReactNode }> = [
  { key: 'calculadora', label: 'Calculadora científica', icon: <Calculator className="h-4 w-4" /> },
  { key: 'graficadora', label: 'Graficadora 2D', icon: <LineChart className="h-4 w-4" /> },
  { key: 'conversor', label: 'Conversor de unidades', icon: <Ruler className="h-4 w-4" /> },
  { key: 'latex', label: 'Editor LaTeX', icon: <Sigma className="h-4 w-4" /> },
  { key: 'laboratorio', label: 'Pantalla dividida', icon: <Columns2 className="h-4 w-4" /> },
]

/** Laboratorio matemático integrado. */
export default function ToolsPage() {
  const [params, setParams] = useSearchParams()
  const tool = (params.get('tool') as Tool) || 'graficadora'
  return (
    <div>
      <PageHeader title="Laboratorio matemático" subtitle="Herramientas exclusivas para Matemática, listas para proyectar en clase" />
      <div className="sticky top-0 z-20 mb-4 flex justify-center">
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 shadow-pop">
          {TOOLS.map((t) => (
            <button key={t.key} onClick={() => setParams({ tool: t.key })} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm', tool === t.key ? 'bg-brand-gradient text-white shadow' : 'text-ink-2 hover:bg-surface-3')}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {tool === 'calculadora' && <ScientificCalculator />}
      {tool === 'graficadora' && <GraphingCalculator />}
      {tool === 'conversor' && <UnitConverter />}
      {tool === 'latex' && (
        <div className="card card-pad">
          <LatexEditor />
        </div>
      )}
      {tool === 'laboratorio' && (
        <div className="space-y-4">
          <GraphingCalculator initial={['x^2 - 2x - 3', '0']} />
          <div className="card card-pad">
            <LatexEditor initial="f(x) = x^{2} - 2x - 3 = (x-3)(x+1)" />
          </div>
        </div>
      )}
    </div>
  )
}
