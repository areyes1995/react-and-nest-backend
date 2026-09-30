import { useEffect, useState } from 'react'
import { Delete, History, Trash2 } from 'lucide-react'
import { evaluate, formatNumber, toFraction, type AngleMode } from '@lib/math/expr'
import { useLocalStorage } from '@hooks/useLocalStorage'
import { cn } from '@lib/cn'

type Key = { label: string; insert?: string; action?: 'clear' | 'back' | 'eval' | 'ans' | 'frac'; tone?: 'fn' | 'op' | 'eq' | 'num' }

const KEYS: Key[][] = [
  [{ label: 'sin', insert: 'sin(', tone: 'fn' }, { label: 'cos', insert: 'cos(', tone: 'fn' }, { label: 'tan', insert: 'tan(', tone: 'fn' }, { label: 'π', insert: 'π', tone: 'fn' }, { label: 'e', insert: 'e', tone: 'fn' }],
  [{ label: 'sin⁻¹', insert: 'asin(', tone: 'fn' }, { label: 'cos⁻¹', insert: 'acos(', tone: 'fn' }, { label: 'tan⁻¹', insert: 'atan(', tone: 'fn' }, { label: 'ln', insert: 'ln(', tone: 'fn' }, { label: 'log', insert: 'log(', tone: 'fn' }],
  [{ label: 'x²', insert: '^2', tone: 'fn' }, { label: 'xʸ', insert: '^', tone: 'fn' }, { label: '√', insert: 'sqrt(', tone: 'fn' }, { label: 'ⁿ√', insert: 'nroot(', tone: 'fn' }, { label: 'n!', insert: '!', tone: 'fn' }],
  [{ label: '(', insert: '(', tone: 'op' }, { label: ')', insert: ')', tone: 'op' }, { label: ',', insert: ',', tone: 'op' }, { label: 'a/b', action: 'frac', tone: 'op' }, { label: 'AC', action: 'clear', tone: 'op' }],
  [{ label: '7', insert: '7' }, { label: '8', insert: '8' }, { label: '9', insert: '9' }, { label: '÷', insert: '/', tone: 'op' }, { label: '⌫', action: 'back', tone: 'op' }],
  [{ label: '4', insert: '4' }, { label: '5', insert: '5' }, { label: '6', insert: '6' }, { label: '×', insert: '*', tone: 'op' }, { label: 'Ans', action: 'ans', tone: 'op' }],
  [{ label: '1', insert: '1' }, { label: '2', insert: '2' }, { label: '3', insert: '3' }, { label: '−', insert: '-', tone: 'op' }, { label: '%', insert: '%', tone: 'op' }],
  [{ label: '0', insert: '0' }, { label: '.', insert: '.' }, { label: '×10ˣ', insert: '*10^', tone: 'op' }, { label: '+', insert: '+', tone: 'op' }, { label: '=', action: 'eval', tone: 'eq' }],
]

/** 3.1 Calculadora científica con historial. */
export function ScientificCalculator() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState<string>('0')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<AngleMode>('DEG')
  const [ans, setAns] = useState(0)
  const [asFraction, setAsFraction] = useState(false)
  const [history, setHistory] = useLocalStorage<Array<{ expr: string; result: string }>>('educraft_calc_history', [])

  const preview = (() => {
    if (!expr.trim()) return null
    try {
      return formatNumber(evaluate(expr.replace(/ans/gi, `(${ans})`), {}, mode))
    } catch {
      return null
    }
  })()

  const run = () => {
    if (!expr.trim()) return
    try {
      const value = evaluate(expr.replace(/ans/gi, `(${ans})`), {}, mode)
      const text = formatNumber(value)
      setResult(text)
      setAns(value)
      setError(null)
      setHistory((h) => [{ expr, result: text }, ...h].slice(0, 30))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const press = (k: Key) => {
    setError(null)
    if (k.action === 'clear') {
      setExpr('')
      setResult('0')
    } else if (k.action === 'back') setExpr((e) => e.slice(0, -1))
    else if (k.action === 'eval') run()
    else if (k.action === 'ans') setExpr((e) => e + 'Ans')
    else if (k.action === 'frac') setAsFraction((v) => !v)
    else if (k.insert) setExpr((e) => e + k.insert)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'Enter') run()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const fraction = asFraction ? toFraction(ans) : null
  const degRad = [
    { label: `${formatNumber(ans)}° → rad`, value: formatNumber((ans * Math.PI) / 180) },
    { label: `${formatNumber(ans)} rad → °`, value: formatNumber((ans * 180) / Math.PI) },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-[#1f1a3d] p-4 shadow-pop">
        <div className="mb-3 rounded-2xl bg-[#2a2452] p-4 text-right">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex gap-1">
              {(['DEG', 'RAD'] as AngleMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn('rounded-md px-2 py-0.5 text-[0.65rem] font-bold', mode === m ? 'bg-pink-500 text-white' : 'text-white/50')}>
                  {m}
                </button>
              ))}
            </div>
            {asFraction && <span className="text-[0.65rem] font-bold text-violet-300">a/b</span>}
          </div>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="0"
            className="w-full bg-transparent text-right font-mono text-lg text-white/80 outline-none placeholder:text-white/30"
          />
          <p className="mt-1 truncate font-mono text-3xl font-bold text-white">{fraction ? `${fraction.num}/${fraction.den}` : result}</p>
          <p className="h-4 text-xs text-white/40">{error ? <span className="text-red-300">{error}</span> : preview && preview !== result ? `= ${preview}` : ''}</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {KEYS.flat().map((k) => (
            <button
              key={k.label}
              onClick={() => press(k)}
              className={cn(
                'rounded-xl py-3 text-sm font-bold transition active:scale-95',
                k.tone === 'fn' && 'bg-[#3a3170] text-violet-100 hover:bg-[#463c85]',
                k.tone === 'op' && 'bg-[#4a3a8a] text-pink-100 hover:bg-[#5a47a3]',
                k.tone === 'eq' && 'bg-gradient-to-r from-pink-500 to-violet-500 text-white',
                !k.tone && 'bg-[#2f2960] text-white hover:bg-[#3a3375]',
              )}
            >
              {k.label === '⌫' ? <Delete className="mx-auto h-4 w-4" /> : k.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="card card-pad">
          <p className="section-title mb-2">Conversión de ángulos</p>
          {degRad.map((d) => (
            <p key={d.label} className="flex justify-between text-xs text-ink-2">
              <span>{d.label}</span>
              <b className="font-mono">{d.value}</b>
            </p>
          ))}
        </div>
        <div className="card card-pad">
          <div className="mb-2 flex items-center justify-between">
            <p className="section-title flex items-center gap-1.5">
              <History className="h-4 w-4" /> Historial
            </p>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-ink-3 hover:text-brand-red" aria-label="Borrar historial">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {history.map((h, i) => (
              <li key={i}>
                <button onClick={() => setExpr(h.expr)} className="w-full rounded-lg px-2 py-1 text-right font-mono text-xs hover:bg-surface-3">
                  <span className="text-ink-3">{h.expr} =</span> <b className="text-ink">{h.result}</b>
                </button>
              </li>
            ))}
            {!history.length && <li className="text-xs text-ink-3">Tus cálculos aparecerán aquí.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
