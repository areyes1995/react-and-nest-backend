import { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Sparkles } from 'lucide-react'
import { aiApi } from '@services/educraft'
import type { StepSolution } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, Input, Latex } from '@components/ui'
import { cn } from '@lib/cn'

const EXAMPLES = ['2x + 5 = 13', '3(x - 2) = x + 4', 'x/2 + 1/3 = 1', 'x^2 - 5x + 6 = 0', '2x + y = 7; x - y = 2', '3(x + 2) - x']

/** 4.3 Pizarra de ejemplos paso a paso, lista para proyectar. */
export function StepByStepBoard({ initial = '2x + 5 = 13' }: { initial?: string }) {
  const { error } = useFeedback()
  const [expression, setExpression] = useState(initial)
  const [solution, setSolution] = useState<StepSolution | null>(null)
  const [visible, setVisible] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const solve = async (expr = expression) => {
    if (!expr.trim()) return
    setLoading(true)
    try {
      const res = await aiApi.stepByStep(expr)
      setSolution(res)
      setVisible(0)
    } catch (err) {
      error('No se pudo resolver', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const total = solution ? solution.steps.length : 0
  const board = solution && (
    <div className={cn('rounded-2xl bg-[#1f2a44] p-5 text-white shadow-inner sm:p-8', fullscreen && 'flex h-full flex-col justify-center')}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-300">Resolver</p>
      <div className={cn('mt-2', fullscreen ? 'text-4xl' : 'text-2xl')}>
        <Latex block>{solution.inputLatex.replace(/\*/g, '\\cdot ')}</Latex>
      </div>
      <div className="mt-4 space-y-3">
        {solution.steps.slice(0, visible + 1).map((s, i) => (
          <div key={i} className="animate-fade-in rounded-xl bg-white/5 p-3">
            <p className="text-sm font-bold text-violet-200">
              {s.title}: <span className="font-normal text-white/90">{s.explanation}</span>
            </p>
            <div className={cn('mt-1', fullscreen ? 'text-3xl' : 'text-xl')}>
              <Latex block>{s.latex}</Latex>
            </div>
          </div>
        ))}
      </div>
      {visible >= total - 1 && (
        <p className="mt-4 rounded-xl bg-emerald-400/15 px-4 py-2 text-lg font-bold text-emerald-300">
          Respuesta: <Latex>{solution.answerLatex}</Latex>
        </p>
      )}
      <div className="mt-5 flex items-center justify-between">
        <button className="btn bg-white/10 text-white hover:bg-white/20" disabled={visible === 0} onClick={() => setVisible((v) => v - 1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-xs text-white/60">
          Paso {Math.min(visible + 1, total)} de {total}
        </span>
        <button className="btn bg-white/10 text-white hover:bg-white/20" disabled={visible >= total - 1} onClick={() => setVisible((v) => v + 1)}>
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && solve()}
          placeholder="Escribe una ecuación, sistema o expresión"
          className="min-w-[14rem] flex-1 font-mono"
        />
        <Button onClick={() => solve()} loading={loading} icon={<Sparkles className="h-4 w-4" />}>
          Explicar paso a paso
        </Button>
        {solution && (
          <Button variant="secondary" icon={<Maximize2 className="h-4 w-4" />} onClick={() => setFullscreen(true)}>
            Proyectar
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="chip font-mono"
            onClick={() => {
              setExpression(ex)
              void solve(ex)
            }}
          >
            {ex}
          </button>
        ))}
      </div>
      {board ?? (
        <div className="grid min-h-60 place-items-center rounded-2xl bg-[#1f2a44] p-6 text-center text-sm text-white/70">
          Escribe una expresión como <span className="kbd mx-1 bg-white/10 text-white">2x + 5 = 13</span> y la IA la explicará paso a paso para proyectar en clase.
        </div>
      )}
      {fullscreen && solution && (
        <div className="fixed inset-0 z-[90] bg-[#141c30] p-6 sm:p-12">
          <button className="btn absolute right-6 top-6 bg-white/10 text-white hover:bg-white/20" onClick={() => setFullscreen(false)}>
            Salir de la proyección
          </button>
          {board}
        </div>
      )}
    </div>
  )
}
