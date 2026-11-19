import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { compile, derivative, evaluateNode, formatNumber, integral, intersections, limit, parse } from '@lib/math/expr'
import { Button, Field, Input, Select, Tabs } from '@components/ui'
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

interface Point3 {
  px: number
  py: number
  z: number
}

interface Segment3 {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

interface Axis3 {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  color: string
  lx: number
  ly: number
}

interface GridLabel3 {
  x: number
  y: number
  text: string
}

const DEFAULT_VIEW: View = { xmin: -10, xmax: 10, ymin: -7, ymax: 7 }

const DEFAULT_3D = { yaw: -35, pitch: 52, zoom: 1, panX: 0, panY: 0, range: 5, resolution: 22 }

const SURFACE_SAMPLES = [
  { label: 'Ondas radiales', expr: 'sin(sqrt(x^2 + y^2))' },
  { label: 'Silla de montar', expr: 'x^2 - y^2' },
  { label: 'Onda', expr: 'sin(x) * cos(y)' },
  { label: 'Cono', expr: 'sqrt(x^2 + y^2)' },
  { label: 'Paraboloide', expr: '-(x^2 + y^2)' },
  { label: 'Hiperbólico', expr: 'x * y' },
]

function niceStep(range: number) {
  const raw = range / 10
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}

/** Compila z = f(x, y) con el analizador seguro (sin eval); valida variables en un punto de prueba. */
function compileSurface(src: string): (x: number, y: number) => number {
  const cleaned = src.replace(/^\s*(?:z|f\s*\(\s*x\s*,\s*y\s*\))\s*=\s*/i, '')
  if (!cleaned.trim()) throw new Error('Escribe una expresión, por ejemplo sin(x) * cos(y)')
  const tree = parse(cleaned, ['x', 'y'])
  evaluateNode(tree, { x: 0.31, y: 0.67 })
  return (x, y) => {
    try {
      const value = evaluateNode(tree, { x, y })
      return Number.isFinite(value) ? value : NaN
    } catch {
      return NaN
    }
  }
}

function colorForZ(z: number, range: number) {
  const t = Math.max(0, Math.min(1, (z + range) / (2 * range)))
  return `hsl(${Math.round(205 + t * 125)}, 85%, 52%)`
}

/** 3.2 Calculadora graficadora: varias funciones, zoom, derivadas, integrales, límites e intersecciones. */
export function GraphingCalculator({ initial = ['x^2 - 4', '2x + 1'] }: { initial?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const wrap3dRef = useRef<HTMLDivElement>(null)
  const drag3d = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const markerId = useId().replace(/:/g, '')
  const [mode, setMode] = useState<'2d' | '3d'>('2d')
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

  const [surfaceExpr, setSurfaceExpr] = useState(SURFACE_SAMPLES[0].expr)
  const [size3d, setSize3d] = useState({ w: 800, h: 520 })
  const [yaw, setYaw] = useState(DEFAULT_3D.yaw)
  const [pitch, setPitch] = useState(DEFAULT_3D.pitch)
  const [zoom3d, setZoom3d] = useState(DEFAULT_3D.zoom)
  const [pan3d, setPan3d] = useState({ x: DEFAULT_3D.panX, y: DEFAULT_3D.panY })
  const [range3d, setRange3d] = useState(DEFAULT_3D.range)
  const [resolution3d, setResolution3d] = useState(DEFAULT_3D.resolution)

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
    if (mode !== '2d') return
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: Math.max(360, Math.min(620, entry.contentRect.width * 0.62)) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])

  useEffect(() => {
    if (mode !== '3d') return
    const el = wrap3dRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize3d({ w: entry.contentRect.width, h: Math.max(380, Math.min(640, entry.contentRect.width * 0.66)) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])

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
  }, [compiled, view, size, analysis, tool, a, b, hover, selected, mode])

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

  const surface = useMemo(() => {
    try {
      return { fn: compileSurface(surfaceExpr), error: null as string | null }
    } catch (err) {
      return { fn: null, error: (err as Error).message }
    }
  }, [surfaceExpr])

  const scene3d = useMemo(() => {
    if (!surface.fn) return null
    const R = Math.max(1, range3d)
    const N = Math.max(8, Math.min(36, resolution3d))
    const { w, h } = size3d
    const yawRad = (yaw * Math.PI) / 180
    const pitchRad = (pitch * Math.PI) / 180
    const cosYaw = Math.cos(yawRad)
    const sinYaw = Math.sin(yawRad)
    const sinPitch = Math.sin(pitchRad)
    const cosPitch = Math.cos(pitchRad)
    const scale = Math.min(w / (R * 3), h / (R * 3.8)) * Math.max(0.25, Math.min(6, zoom3d))
    const originX = w / 2 + pan3d.x
    const originY = h / 2 + pan3d.y
    const project = (x: number, y: number, z: number): Point3 => {
      const rx = x * cosYaw - y * sinYaw
      const ry = x * sinYaw + y * cosYaw
      return { px: originX + rx * scale, py: originY + (ry * sinPitch - z * cosPitch) * scale, z }
    }
    const finite = (p: Point3) => Number.isFinite(p.px) && Number.isFinite(p.py)
    const step = (2 * R) / N
    const grid: (Point3 | null)[][] = []
    for (let i = 0; i <= N; i++) {
      const row: (Point3 | null)[] = []
      for (let j = 0; j <= N; j++) {
        const x = -R + i * step
        const y = -R + j * step
        const raw = surface.fn(x, y)
        row.push(Number.isFinite(raw) ? project(x, y, Math.max(-R, Math.min(R, raw))) : null)
      }
      grid.push(row)
    }
    const segments: Segment3[] = []
    const addSegment = (p: Point3 | null, q: Point3 | null) => {
      if (!p || !q || !finite(p) || !finite(q)) return
      segments.push({ x1: p.px, y1: p.py, x2: q.px, y2: q.py, color: colorForZ((p.z + q.z) / 2, R) })
    }
    for (let j = 0; j <= N; j++) for (let i = 0; i < N; i++) addSegment(grid[i][j], grid[i + 1][j])
    for (let i = 0; i <= N; i++) for (let j = 0; j < N; j++) addSegment(grid[i][j], grid[i][j + 1])

    const ground: Segment3[] = []
    const groundStep = niceStep(2 * R)
    const gridLabels: GridLabel3[] = []
    for (let k = -R; k <= R + 1e-9; k += groundStep) {
      const alongX = [project(-R, k, 0), project(R, k, 0)]
      const alongY = [project(k, -R, 0), project(k, R, 0)]
      if (alongX.every(finite)) ground.push({ x1: alongX[0].px, y1: alongX[0].py, x2: alongX[1].px, y2: alongX[1].py, color: '#ece7f6' })
      if (alongY.every(finite)) ground.push({ x1: alongY[0].px, y1: alongY[0].py, x2: alongY[1].px, y2: alongY[1].py, color: '#ece7f6' })
      if (Math.abs(k) > 1e-9) {
        gridLabels.push({ x: alongX[1].px, y: alongX[1].py, text: formatNumber(k, 3) })
        gridLabels.push({ x: alongY[1].px, y: alongY[1].py, text: formatNumber(k, 3) })
      }
    }

    const axisDefs = [
      { from: project(-R, 0, 0), to: project(R, 0, 0), label: 'x', color: '#ef4444' },
      { from: project(0, -R, 0), to: project(0, R, 0), label: 'y', color: '#22c55e' },
      { from: project(0, 0, -R), to: project(0, 0, R), label: 'z', color: '#3b82f6' },
    ]
    const axes: Axis3[] = axisDefs.map((axis) => ({
      x1: axis.from.px,
      y1: axis.from.py,
      x2: axis.to.px,
      y2: axis.to.py,
      lx: axis.to.px + 8,
      ly: axis.to.py - 6,
      label: axis.label,
      color: axis.color,
    }))
    return { segments, ground, axes, gridLabels }
  }, [surface.fn, size3d, range3d, resolution3d, yaw, pitch, zoom3d, pan3d])

  const fnOptions = compiled.map((f, i) => ({ value: i, label: `f${i + 1}(x) = ${f.expr}` }))

  return (
    <div className="space-y-4">
      <Tabs
        items={[
          { key: '2d', label: 'Gráficas 2D' },
          { key: '3d', label: 'Superficies 3D' },
        ]}
        value={mode}
        onChange={(key) => setMode(key as '2d' | '3d')}
      />

      {mode === '2d' ? (
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
      ) : (
        <div className="grid gap-4 xl:grid-cols-[20rem_1fr]">
          <div className="space-y-3">
            <div className="card card-pad space-y-3">
              <p className="section-title">Superficie 3D</p>
              <Field label="z = f(x, y)" error={surface.error}>
                <Input
                  value={surfaceExpr}
                  onChange={(e) => setSurfaceExpr(e.target.value)}
                  aria-invalid={!!surface.error}
                  className={cn('font-mono text-xs', surface.error && 'border-red-300')}
                />
              </Field>
              <div>
                <p className="mb-1.5 text-[0.68rem] font-semibold text-ink-3">Funciones de ejemplo</p>
                <div className="flex flex-wrap gap-1.5">
                  {SURFACE_SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      className={cn('chip', surfaceExpr === sample.expr && 'chip-active')}
                      title={sample.expr}
                      onClick={() => setSurfaceExpr(sample.expr)}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Dominio R">
                  <Input type="number" min={1} max={12} step={1} value={range3d} onChange={(e) => setRange3d(Math.max(1, Math.min(12, Number(e.target.value) || DEFAULT_3D.range)))} className="h-8 text-xs" />
                </Field>
                <Field label="Resolución">
                  <Input type="number" min={8} max={36} step={2} value={resolution3d} onChange={(e) => setResolution3d(Math.max(8, Math.min(36, Number(e.target.value) || DEFAULT_3D.resolution)))} className="h-8 text-xs" />
                </Field>
              </div>
              <p className="text-[0.68rem] text-ink-3">x e y varían en [−R, R]; z se limita al mismo rango. Admite +, −, *, /, ^, sqrt, sin, cos, ln, exp…</p>
            </div>

            <div className="card card-pad space-y-3">
              <p className="section-title">Orientación</p>
              <Field label={`Rotación (yaw): ${yaw}°`}>
                <input type="range" min={0} max={360} value={yaw} onChange={(e) => setYaw(Number(e.target.value))} className="w-full accent-violet-500" />
              </Field>
              <Field label={`Inclinación (pitch): ${pitch}°`}>
                <input type="range" min={5} max={85} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-violet-500" />
              </Field>
              <p className="text-[0.68rem] text-ink-3">Arrastra sobre la gráfica para desplazar; usa la rueda del ratón para acercar o alejar.</p>
            </div>
          </div>

          <div className="card overflow-hidden p-2">
            <div className="mb-2 flex items-center justify-end gap-1">
              <button className="icon-btn" onClick={() => setZoom3d((z) => Math.min(6, z * 1.2))} aria-label="Acercar 3D">
                <Plus className="h-4 w-4" />
              </button>
              <button className="icon-btn" onClick={() => setZoom3d((z) => Math.max(0.25, z / 1.2))} aria-label="Alejar 3D">
                <Minus className="h-4 w-4" />
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setYaw(DEFAULT_3D.yaw)
                  setPitch(DEFAULT_3D.pitch)
                  setZoom3d(DEFAULT_3D.zoom)
                  setPan3d({ x: 0, y: 0 })
                }}
                aria-label="Restablecer vista 3D"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div ref={wrap3dRef} className="w-full">
              <svg
                viewBox={`0 0 ${size3d.w} ${size3d.h}`}
                style={{ width: size3d.w, height: size3d.h }}
                className="w-full cursor-grab touch-none rounded-xl border border-line bg-white active:cursor-grabbing"
                role="img"
                aria-label={`Superficie tridimensional z = ${surfaceExpr}`}
                onWheel={(e) => setZoom3d((z) => Math.max(0.25, Math.min(6, z * (e.deltaY > 0 ? 0.9 : 1.1))))}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  drag3d.current = { x: e.clientX, y: e.clientY, panX: pan3d.x, panY: pan3d.y }
                }}
                onPointerMove={(e) => {
                  const d = drag3d.current
                  if (!d) return
                  setPan3d({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) })
                }}
                onPointerUp={() => (drag3d.current = null)}
                onPointerLeave={() => (drag3d.current = null)}
              >
                <defs>
                  {scene3d?.axes.map((axis) => (
                    <marker key={axis.label} id={`${markerId}-arrow-${axis.label}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 z" fill={axis.color} />
                    </marker>
                  ))}
                </defs>
                {scene3d ? (
                  <>
                    {scene3d.ground.map((line, i) => (
                      <line key={`ground-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#ece7f6" strokeWidth={1} />
                    ))}
                    {scene3d.axes.map((axis) => (
                      <line
                        key={`axis-${axis.label}`}
                        x1={axis.x1}
                        y1={axis.y1}
                        x2={axis.x2}
                        y2={axis.y2}
                        stroke={axis.color}
                        strokeWidth={1.6}
                        markerEnd={`url(#${markerId}-arrow-${axis.label})`}
                      />
                    ))}
                    {scene3d.segments.map((segment, i) => (
                      <line key={`mesh-${i}`} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={segment.color} strokeWidth={1.1} strokeOpacity={0.9} />
                    ))}
                    {scene3d.gridLabels.map((label, i) => (
                      <text key={`label-${i}`} x={label.x} y={label.y} fill="#9d98b4" fontSize={9}>
                        {label.text}
                      </text>
                    ))}
                    {scene3d.axes.map((axis) => (
                      <text key={`axis-label-${axis.label}`} x={axis.lx} y={axis.ly} fill={axis.color} fontSize={12} fontWeight={700}>
                        {axis.label}
                      </text>
                    ))}
                  </>
                ) : (
                  <text x={size3d.w / 2} y={size3d.h / 2} textAnchor="middle" fill="#9d98b4" fontSize={13}>
                    Corrige la expresión para ver la superficie.
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
