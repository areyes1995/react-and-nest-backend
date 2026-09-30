import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Latex, Tabs } from '@components/ui'
import { cn } from '@lib/cn'

const PALETTE: Record<string, Array<[string, string]>> = {
  Básico: [
    ['\\frac{a}{b}', '\\frac{□}{□}'],
    ['x^{n}', 'x^{□}'],
    ['x_{i}', 'x_{□}'],
    ['\\sqrt{x}', '\\sqrt{□}'],
    ['\\sqrt[n]{x}', '\\sqrt[□]{□}'],
    ['\\pm', '\\pm'],
    ['\\times', '\\times'],
    ['\\div', '\\div'],
    ['\\neq', '\\neq'],
    ['\\leq', '\\leq'],
    ['\\geq', '\\geq'],
    ['\\approx', '\\approx'],
  ],
  Cálculo: [
    ['\\lim_{x \\to a}', '\\lim_{x \\to □}'],
    ['\\int_{a}^{b}', '\\int_{□}^{□} □ \\, dx'],
    ['\\sum_{i=1}^{n}', '\\sum_{i=1}^{□}'],
    ['\\frac{d}{dx}', '\\frac{d}{dx}'],
    ["f'(x)", "f'(x)"],
    ['\\infty', '\\infty'],
  ],
  Álgebra: [
    ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '\\begin{pmatrix} □ & □ \\\\ □ & □ \\end{pmatrix}'],
    ['\\begin{cases} x+y=1 \\\\ x-y=0 \\end{cases}', '\\begin{cases} □ \\\\ □ \\end{cases}'],
    ['|x|', '\\left| □ \\right|'],
    ['\\log_{b} x', '\\log_{□} □'],
    ['\\vec{v}', '\\vec{□}'],
    ['\\overline{AB}', '\\overline{□}'],
  ],
  Geometría: [
    ['\\angle ABC', '\\angle □'],
    ['\\triangle ABC', '\\triangle □'],
    ['90^{\\circ}', '□^{\\circ}'],
    ['\\parallel', '\\parallel'],
    ['\\perp', '\\perp'],
    ['\\pi r^{2}', '\\pi r^{2}'],
  ],
  Griegas: [
    ['\\alpha', '\\alpha'],
    ['\\beta', '\\beta'],
    ['\\gamma', '\\gamma'],
    ['\\theta', '\\theta'],
    ['\\lambda', '\\lambda'],
    ['\\pi', '\\pi'],
    ['\\sigma', '\\sigma'],
    ['\\Delta', '\\Delta'],
  ],
}

/** 3.4 Editor de ecuaciones LaTeX (visual + código) con vista previa en tiempo real. */
export function LatexEditor({ initial = 'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}' }: { initial?: string }) {
  const [code, setCode] = useState(initial)
  const [group, setGroup] = useState<keyof typeof PALETTE>('Básico')
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const insert = (snippet: string) => {
    const el = ref.current
    const text = snippet.replace(/□/g, '')
    if (!el) return setCode((c) => c + text)
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = code.slice(0, start) + text + code.slice(end)
    setCode(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + (snippet.indexOf('□') >= 0 ? snippet.indexOf('□') : text.length)
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className="space-y-3">
      <Tabs value={group} onChange={setGroup} items={Object.keys(PALETTE).map((k) => ({ key: k as keyof typeof PALETTE, label: k }))} />
      <div className="flex flex-wrap gap-1.5">
        {PALETTE[group].map(([preview, snippet]) => (
          <button key={snippet} onClick={() => insert(snippet)} className="grid h-11 min-w-[3.2rem] place-items-center rounded-xl border border-line bg-surface px-2 hover:border-violet-300 hover:bg-surface-2" title={snippet}>
            <Latex>{preview}</Latex>
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <p className="label">Código LaTeX</p>
          <textarea ref={ref} value={code} onChange={(e) => setCode(e.target.value)} rows={8} className="input font-mono text-sm" spellCheck={false} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="label mb-0">Vista previa</p>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(code)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className={cn('inline-flex items-center gap-1 text-xs font-semibold', copied ? 'text-emerald-500' : 'text-brand-purple')}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copiado' : 'Copiar código'}
            </button>
          </div>
          <div className="grid min-h-[12rem] place-items-center overflow-x-auto rounded-2xl border border-line bg-white p-4 text-2xl text-slate-900">
            <Latex block>{code || '\\text{Escribe una expresión}'}</Latex>
          </div>
        </div>
      </div>
    </div>
  )
}
