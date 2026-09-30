import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { compile, derivative, formatNumber, integral, intersections, limit } from '@lib/math/expr'
import { Button, Field, Input, Select } from '@components/ui'
import { cn } from '@lib/cn'

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#f97316', '#22c55e', '#0ea5e9']

interface Fn {
  id: number
  expr: string
  color: string
  visible: boolean
  showDerivative: boolean
}

interface View {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
}

const DEFAULT_VIEW: View = { xmin: -10, xmax: 10, ymin: -7, ymax: 7 }

function niceStep(range: number) {
  const raw = range / 10
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}

/** 3.2 Calculadora graficadora: varias funciones, zoom, derivadas, integrales, límites e intersecciones. */
export function GraphingCalculator({ initial = ['x^2 - 4', '2x + 1'] }: { initial?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fns, setFns] = useState<Fn[]>(initial.map((expr, i) => ({ id: i, expr, color: COLORS[i % COLORS.length], visible: true, showDerivative: false })))
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [size, setSize] = useState({ w: 800, h: 520 })
  const [tool, setTool] = useState<'none' | 'tangent' | 'integral' | 'limit' | 'intersect'>('none')
  const [a, setA] = useState(0)
  const [b, setB] = useState(2)
  const [target, setTarget] = useState(0)
  const [second, setSecond] = useState(1)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ x: number; y: number; view: View } | null>(null)

  const compiled = useMemo(
    () =>
      fns.map((f) => {
        try {
          return { ...f, fn: compile(f.expr), error: null as string | null }
        } catch (err) {
          return { ...f, fn: null, error: (err as Error).message }
        }
      }),
    [fns],
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: Math.max(360, Math.min(620, entry.contentRect.width * 0.62)) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const toPx = (x: number, y: number) => ({
    px: ((x - view.xmin) / (view.xmax - view.xmin)) * size.w,
    py: size.h - ((y - view.ymin) / (view.ymax - view.ymin)) * size.h,
  })
  const toWorld = (px: number, py: number) => ({
    x: view.xmin + (px / size.w) * (view.xmax - view.xmin),
    y: view.ymin + ((size.h - py) / size.h) * (view.ymax - view.ymin),
  })

  const selected = compiled[target]?.fn
  const other = compiled[second]?.fn
  const analysis = useMemo(() => {
    if (!selected) return null
    if (tool === 'tangent') {
      const m = derivative(selected, a)
      return { kind: 'tangent' as const, m, y0: selected(a) }
    }
    if (tool === 'integral') return { kind: 'integral' as const, value: integral(selected, Math.min(a, b), Math.max(a, b)) * (a <= b ? 1 : -1) }
    if (tool === 'limit') return { kind: 'limit' as const, ...limit(selected, a) }
    if (tool === 'intersect' && other) return { kind: 'intersect' as const, roots: intersections(selected, other, view.xmin, view.xmax) }
    return null
  }, [tool, selected, other, a, b, view.xmin, view.xmax])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.w, size.h)

    // Cuadrícula
    const sx = niceStep(view.xmax - view.xmin)
    const sy = niceStep(view.ymax - view.ymin)
    ctx.font = '11px "Plus Jakarta Sans", sans-serif'
    ctx.lineWidth = 1
    for (let x = Math.ceil(view.xmin / sx) * sx; x <= view.xmax; x += sx) {
      const { px } = toPx(x, 0)
      ctx.strokeStyle = Math.abs(x) < 1e-9 ? '#1f1a3d' : '#efeaf8'
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, size.h)
      ctx.stroke()
      if (Math.abs(x) > 1e-9) {
        const { py } = toPx(0, 0)
        ctx.fillStyle = '#9d98b4'
        ctx.fillText(formatNumber(x, 4), px + 2, Math.min(size.h - 4, Math.max(12, py + 12)))
      }
    }
    for (let y = Math.ceil(view.ymin / sy) * sy; y <= view.ymax; y += sy) {
      const { py } = toPx(0, y)
      ctx.strokeStyle = Math.abs(y) < 1e-9 ? '#1f1a3d' : '#efeaf8'
      ctx.beginPath()
      ctx.moveTo(0, py)
      ctx.lineTo(size.w, py)
      ctx.stroke()
      if (Math.abs(y) > 1e-9) {
        const { px } = toPx(0, 0)
        ctx.fillStyle = '#9d98b4'
        ctx.fillText(formatNumber(y, 4), Math.min(size.w - 30, Math.max(2, px + 4)), py - 2)
      }
    }

    // Área de la integral
    if (tool === 'integral' && selected) {
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      ctx.fillStyle = 'rgba(236,72,153,0.18)'
      ctx.beginPath()
      const start = toPx(lo, 0)
      ctx.moveTo(start.px, start.py)
      for (let i = 0; i <= 200; i++) {
        const x = lo + ((hi - lo) * i) / 200
        const y = selected(x)
        if (!Number.isFinite(y)) continue
        const p = toPx(x, y)
        ctx.lineTo(p.px, p.py)
      }
      const end = toPx(hi, 0)
      ctx.lineTo(end.px, end.py)
      ctx.closePath()
      ctx.fill()
    }

    const plot = (f: (x: number) => number, color: string, dashed = false) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.setLineDash(dashed ? [6, 5] : [])
      ctx.beginPath()
      let pen = false
      let prevY = 0
      for (let px = 0; px <= size.w; px += 1) {
        const x = toWorld(px, 0).x
        const y = f(x)
        if (!Number.isFinite(y)) {
          pen = false
          continue
        }
        const { py } = toPx(x, y)
        if (pen && Math.abs(py - prevY) > size.h * 2) pen = false // asíntotas
        if (pen) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
        pen = true
        prevY = py
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    compiled.forEach((f) => {
      if (!f.visible || !f.fn) return
      plot(f.fn, f.color)
      if (f.showDerivative) {
        const fn = f.fn
        plot((x) => derivative(fn, x), f.color, true)
      }
    })

    const dot = (x: number, y: number, color: string, label?: string) => {
      const p = toPx(x, y)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(p.px, p.py, 5, 0, Math.PI * 2)
      ctx.fill()
      if (label) {
        ctx.fillStyle = '#1f1a3d'
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'
        ctx.fillText(label, p.px + 8, p.py - 8)
      }
    }

    if (analysis?.kind === 'tangent' && Number.isFinite(analysis.y0)) {
      plot((x) => analysis.y0 + analysis.m * (x - a), '#1f1a3d', true)
      dot(a, analysis.y0, '#1f1a3d', `m = ${formatNumber(analysis.m, 5)}`)
    }
    if (analysis?.kind === 'intersect' && selected) analysis.roots.forEach((r) => dot(r, selected(r), '#f97316', `(${formatNumber(r, 4)}, ${formatNumber(selected(r), 4)})`))
    if (analysis?.kind === 'limit' && analysis.value != null) dot(a, analysis.value, '#0ea5e9', `lím = ${formatNumber(analysis.value, 5)}`)
    if (hover) {
      ctx.fillStyle = 'rgba(31,26,61,0.75)'
      ctx.font = '11px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(`(${formatNumber(hover.x, 3)}, ${formatNumber(hover.y, 3)})`, 8, 16)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled, view, size, analysis, tool, a, b, hover, selected])

  const zoom = (factor: number, cx?: number, cy?: number) => {
    const centerX = cx ?? (view.xmin + view.xmax) / 2
    const centerY = cy ?? (view.ymin + view.ymax) / 2
    setView({
      xmin: centerX - (centerX - view.xmin) * factor,
      xmax: centerX + (view.xmax - centerX) * factor,
      ymin: centerY - (centerY - view.ymin) * factor,
      ymax: centerY + (view.ymax - centerY) * factor,
    })
  }

  const fnOptions = compiled.map((f, i) => ({ value: i, label: `f${i + 1}(x) = ${f.expr}` }))

  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_1fr]">
      <div className="space-y-3">
        <div className="card card-pad space-y-2">
          <p className="section-title">Funciones</p>
          {compiled.map((f, i) => (
            <div key={f.id}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: f.color }} />
                <span className="text-xs font-bold text-ink-3">f{i + 1}(x)=</span>
                <input
                  value={f.expr}
                  onChange={(e) => setFns(fns.map((x) => (x.id === f.id ? { ...x, expr: e.target.value } : x)))}
                  className={cn('input h-8 flex-1 font-mono text-xs', f.error && 'border-red-300')}
                />
                <button className="icon-btn h-7 w-7" onClick={() => setFns(fns.map((x) => (x.id === f.id ? { ...x, visible: !x.visible } : x)))} aria-label="Mostrar u ocultar">
                  {f.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button className="icon-btn h-7 w-7 hover:text-brand-red" onClick={() => setFns(fns.filter((x) => x.id !== f.id))} aria-label="Quitar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <label className="ml-5 mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-ink-3">
                <input type="checkbox" checked={f.showDerivative} onChange={(e) => setFns(fns.map((x) => (x.id === f.id ? { ...x, showDerivative: e.target.checked } : x)))} className="accent-violet-500" />
                Graficar derivada f′(x)
              </label>
              {f.error && <p className="ml-5 text-[0.68rem] text-red-500">{f.error}</p>}
            </div>
          ))}
          {fns.length < 6 && (
            <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setFns([...fns, { id: Date.now(), expr: 'sin(x)', color: COLORS[fns.length % COLORS.length], visible: true, showDerivative: false }])}>
              Agregar función
            </Button>
          )}
        </div>

        <div className="card card-pad space-y-3">
          <p className="section-title">Análisis</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['none', 'Ninguno'],
              ['tangent', 'Derivada'],
              ['integral', 'Integral'],
              ['limit', 'Límite'],
              ['intersect', 'Intersecciones'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setTool(k as typeof tool)} className={cn('chip', tool === k && 'chip-active')}>
                {l}
              </button>
            ))}
          </div>
          {tool !== 'none' && fnOptions.length > 0 && (
            <Field label="Función">
              <Select value={target} onChange={(e) => setTarget(Number(e.target.value))} options={fnOptions} />
            </Field>
          )}
          {(tool === 'tangent' || tool === 'limit') && (
            <Field label={tool === 'tangent' ? 'Punto x₀' : 'x tiende a'}>
              <Input type="number" step="any" value={a} onChange={(e) => setA(Number(e.target.value))} />
            </Field>
          )}
          {tool === 'integral' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde a">
                <Input type="number" step="any" value={a} onChange={(e) => setA(Number(e.target.value))} />
              </Field>
              <Field label="Hasta b">
                <Input type="number" step="any" value={b} onChange={(e) => setB(Number(e.target.value))} />
              </Field>
            </div>
          )}
          {tool === 'intersect' && (
            <Field label="Con la función">
              <Select value={second} onChange={(e) => setSecond(Number(e.target.value))} options={fnOptions} />
            </Field>
          )}
          {analysis && (
            <div className="rounded-xl bg-soft-purple px-3 py-2 text-sm text-violet-900 dark:text-violet-100">
              {analysis.kind === 'tangent' && (
                <>
                  f′({formatNumber(a)}) ≈ <b>{formatNumber(analysis.m, 6)}</b>
                  <br />
                  Recta tangente: y = {formatNumber(analysis.m, 4)}(x − {formatNumber(a)}) + {formatNumber(analysis.y0, 4)}
                </>
              )}
              {analysis.kind === 'integral' && (
                <>
                  ∫ f(x) dx de {formatNumber(a)} a {formatNumber(b)} ≈ <b>{formatNumber(analysis.value, 6)}</b>
                </>
              )}
              {analysis.kind === 'limit' && (
                <>
                  Por la izquierda: {formatNumber(analysis.left, 6)} · Por la derecha: {formatNumber(analysis.right, 6)}
                  <br />
                  {analysis.value != null ? <b>lím = {formatNumber(analysis.value, 6)}</b> : <b>El límite no existe (laterales distintos)</b>}
                </>
              )}
              {analysis.kind === 'intersect' && (analysis.roots.length ? analysis.roots.map((r) => `x ≈ ${formatNumber(r, 6)}`).join(' · ') : 'Sin intersecciones en la vista')}
            </div>
          )}
          <p className="text-[0.68rem] text-ink-3">Gráficas 3D disponibles en una versión futura.</p>
        </div>
      </div>

      <div className="card overflow-hidden p-2">
        <div className="mb-2 flex items-center justify-end gap-1">
          <button className="icon-btn" onClick={() => zoom(0.8)} aria-label="Acercar">
            <Plus className="h-4 w-4" />
          </button>
          <button className="icon-btn" onClick={() => zoom(1.25)} aria-label="Alejar">
            <Minus className="h-4 w-4" />
          </button>
          <button className="icon-btn" onClick={() => setView(DEFAULT_VIEW)} aria-label="Restablecer vista">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div ref={wrapRef} className="w-full">
          <canvas
            ref={canvasRef}
            style={{ width: size.w, height: size.h }}
            className="w-full cursor-grab touch-none rounded-xl border border-line active:cursor-grabbing"
            onWheel={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const p = toWorld(e.clientX - rect.left, e.clientY - rect.top)
              zoom(e.deltaY > 0 ? 1.12 : 0.89, p.x, p.y)
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { x: e.clientX, y: e.clientY, view }
            }}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setHover(toWorld(e.clientX - rect.left, e.clientY - rect.top))
              if (!drag.current) return
              const dx = ((e.clientX - drag.current.x) / size.w) * (drag.current.view.xmax - drag.current.view.xmin)
              const dy = ((e.clientY - drag.current.y) / size.h) * (drag.current.view.ymax - drag.current.view.ymin)
              const v = drag.current.view
              setView({ xmin: v.xmin - dx, xmax: v.xmax - dx, ymin: v.ymin + dy, ymax: v.ymax + dy })
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => {
              drag.current = null
              setHover(null)
            }}
          />
        </div>
      </div>
    </div>
  )
}
