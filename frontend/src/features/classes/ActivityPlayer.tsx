// ──────────────────────────────────────────────
// Reproductores de actividades interactivas para
// proyectar en clase. Cada tipo lee su `content`
// (generado por la IA o editado por el docente).
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Lock, RotateCcw, Trophy, Unlock, XCircle } from 'lucide-react'
import type { ActivityType } from '@services/types'
import { Button, Latex, RichMath } from '@components/ui'
import { cn } from '@lib/cn'

type Content = Record<string, unknown>

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(',', '.')

function shuffleOnce<T>(items: T[], seed = 7): T[] {
  const copy = [...items]
  let s = seed
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function Score({ ok, total, onReset }: { ok: number; total: number; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-pink-50 to-violet-50 px-4 py-3 dark:from-pink-950/30 dark:to-violet-950/30">
      <span className="flex items-center gap-2 text-sm font-bold text-ink">
        <Trophy className="h-5 w-5 text-amber-500" /> {ok} de {total} correctas
      </span>
      <Button size="sm" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onReset}>
        Reiniciar
      </Button>
    </div>
  )
}

// ── Quiz (selección múltiple / tipo Kahoot) ──────
function QuizPlayer({ content, timed }: { content: Content; timed?: boolean }) {
  const questions = (content.questions as Array<{ prompt: string; options: string[]; answer: number; seconds?: number }>) ?? []
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [ok, setOk] = useState(0)
  const [left, setLeft] = useState(questions[0]?.seconds ?? 30)
  const done = i >= questions.length
  const COLORS = ['bg-pink-500', 'bg-violet-500', 'bg-sky-500', 'bg-amber-500']

  useEffect(() => {
    if (!timed || done || picked != null) return
    if (left <= 0) {
      setPicked(-1)
      return
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(id)
  }, [left, timed, done, picked])

  const next = () => {
    setI((x) => x + 1)
    setPicked(null)
    setLeft(questions[i + 1]?.seconds ?? 30)
  }
  const reset = () => {
    setI(0)
    setOk(0)
    setPicked(null)
    setLeft(questions[0]?.seconds ?? 30)
  }
  if (!questions.length) return <p className="text-sm text-ink-3">Sin preguntas.</p>
  if (done) return <Score ok={ok} total={questions.length} onReset={reset} />
  const q = questions[i]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-3">
        <span>
          Pregunta {i + 1} de {questions.length}
        </span>
        {timed && <span className={cn('rounded-full px-3 py-1 text-sm font-extrabold', left <= 5 ? 'bg-soft-red text-red-500' : 'bg-soft-purple text-brand-purple')}>{left}s</span>}
      </div>
      <p className="text-lg font-bold text-ink">
        <RichMath text={q.prompt} />
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const correct = picked != null && k === q.answer
          const wrong = picked === k && k !== q.answer
          return (
            <button
              key={k}
              disabled={picked != null}
              onClick={() => {
                setPicked(k)
                if (k === q.answer) setOk((x) => x + 1)
              }}
              className={cn(
                'rounded-2xl px-4 py-4 text-left text-base font-bold text-white shadow transition',
                COLORS[k % 4],
                picked != null && !correct && 'opacity-40',
                correct && 'ring-4 ring-emerald-300',
                wrong && 'ring-4 ring-red-300',
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
      {picked != null && (
        <div className="flex items-center justify-between">
          <p className={cn('text-sm font-bold', picked === q.answer ? 'text-emerald-600' : 'text-red-500')}>{picked === q.answer ? '¡Correcto!' : picked === -1 ? '¡Se acabó el tiempo!' : `Respuesta: ${q.options[q.answer]}`}</p>
          <Button onClick={next}>Siguiente</Button>
        </div>
      )}
    </div>
  )
}

// ── Verdadero o falso ────────────────────────────
function TrueFalsePlayer({ content }: { content: Content }) {
  const statements = (content.statements as Array<{ text: string; answer: boolean }>) ?? []
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const ok = statements.filter((s, i) => answers[i] === s.answer).length
  return (
    <div className="space-y-3">
      {statements.map((s, i) => (
        <div key={i} className="rounded-2xl border border-line p-3">
          <p className="text-sm text-ink">
            <RichMath text={s.text} />
          </p>
          <div className="mt-2 flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() => setAnswers({ ...answers, [i]: v })}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-sm font-bold transition',
                  answers[i] === v ? (v === s.answer ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-surface-3 text-ink-2',
                )}
              >
                {v ? 'Verdadero' : 'Falso'}
              </button>
            ))}
            {answers[i] !== undefined && (answers[i] === s.answer ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />)}
          </div>
        </div>
      ))}
      <Score ok={ok} total={statements.length} onReset={() => setAnswers({})} />
    </div>
  )
}

// ── Relacionar columnas / memorama ───────────────
function MatchingPlayer({ content }: { content: Content }) {
  const pairs = (content.pairs as Array<{ left: string; right: string }>) ?? []
  const rights = useMemo(() => shuffleOnce(pairs.map((p, i) => ({ text: p.right, i }))), [pairs])
  const [selected, setSelected] = useState<number | null>(null)
  const [matches, setMatches] = useState<Record<number, number>>({})
  const [wrong, setWrong] = useState<number | null>(null)
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <button
              key={i}
              disabled={matches[i] !== undefined}
              onClick={() => setSelected(i)}
              className={cn('w-full rounded-2xl border-2 px-3 py-2 text-left text-sm', matches[i] !== undefined ? 'border-emerald-300 bg-soft-green' : selected === i ? 'border-brand-purple bg-soft-purple' : 'border-line')}
            >
              <RichMath text={p.left.includes('\\') ? `$${p.left}$` : p.left} />
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rights.map((r) => {
            const used = Object.values(matches).includes(r.i)
            return (
              <button
                key={r.i}
                disabled={used || selected == null}
                onClick={() => {
                  if (selected == null) return
                  if (r.i === selected) {
                    setMatches({ ...matches, [selected]: r.i })
                    setSelected(null)
                  } else {
                    setWrong(r.i)
                    setTimeout(() => setWrong(null), 600)
                  }
                }}
                className={cn('w-full rounded-2xl border-2 px-3 py-2 text-left text-sm transition', used ? 'border-emerald-300 bg-soft-green' : wrong === r.i ? 'animate-pulse border-red-300 bg-soft-red' : 'border-line hover:border-violet-300')}
              >
                {r.text}
              </button>
            )
          })}
        </div>
      </div>
      <Score ok={Object.keys(matches).length} total={pairs.length} onReset={() => setMatches({})} />
    </div>
  )
}

function MemoryPlayer({ content }: { content: Content }) {
  const pairs = (content.pairs as Array<{ left: string; right: string }>) ?? []
  const cards = useMemo(() => shuffleOnce(pairs.flatMap((p, i) => [{ key: `${i}a`, pair: i, text: p.left }, { key: `${i}b`, pair: i, text: p.right }]), 13), [pairs])
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<number[]>([])
  const flip = (key: string, pair: number) => {
    if (open.length === 2 || open.includes(key) || found.includes(pair)) return
    const next = [...open, key]
    setOpen(next)
    if (next.length === 2) {
      const [a, b] = next.map((k) => cards.find((c) => c.key === k)!.pair)
      setTimeout(() => {
        if (a === b) setFound((f) => [...f, a])
        setOpen([])
      }, 800)
    }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const visible = open.includes(c.key) || found.includes(c.pair)
          return (
            <button key={c.key} onClick={() => flip(c.key, c.pair)} className={cn('grid aspect-[4/3] place-items-center rounded-2xl p-2 text-center text-xs font-semibold transition', visible ? (found.includes(c.pair) ? 'bg-soft-green text-emerald-700' : 'bg-surface text-ink ring-2 ring-brand-purple') : 'bg-brand-gradient text-white')}>
              {visible ? <RichMath text={c.text.includes('\\') ? `$${c.text}$` : c.text} /> : '?'}
            </button>
          )
        })}
      </div>
      <Score ok={found.length} total={pairs.length} onReset={() => { setFound([]); setOpen([]) }} />
    </div>
  )
}

// ── Completar / resolver operaciones ─────────────
function FillPlayer({ items }: { items: Array<{ text: string; answer: string }> }) {
  const [values, setValues] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  const ok = items.filter((it, i) => norm(values[i]) === norm(it.answer)).length
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-line p-3">
          <p className="text-sm text-ink">
            <RichMath text={it.text} />
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input value={values[i] ?? ''} onChange={(e) => setValues({ ...values, [i]: e.target.value })} className="input w-48" placeholder="Tu respuesta" />
            {checked && (norm(values[i]) === norm(it.answer) ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <span className="text-xs text-red-500">Respuesta: {it.answer}</span>)}
          </div>
        </div>
      ))}
      {checked ? <Score ok={ok} total={items.length} onReset={() => { setValues({}); setChecked(false) }} /> : <Button onClick={() => setChecked(true)}>Comprobar</Button>}
    </div>
  )
}

// ── Ordenar pasos ────────────────────────────────
type Step = string | { text: string; latex?: string }

function OrderPlayer({ content }: { content: Content }) {
  const steps = ((content.steps as Step[]) ?? []).map((s) => (typeof s === 'string' ? { text: s } : s))
  const [order, setOrder] = useState(() => shuffleOnce(steps.map((_, i) => i), 5))
  const [checked, setChecked] = useState(false)
  const move = (k: number, dir: number) => {
    const to = k + dir
    if (to < 0 || to >= order.length) return
    const next = [...order]
    ;[next[k], next[to]] = [next[to], next[k]]
    setOrder(next)
    setChecked(false)
  }
  const ok = order.filter((v, i) => v === i).length
  return (
    <div className="space-y-3">
      {Boolean(content.problem) && (
        <p className="rounded-2xl bg-soft-purple px-4 py-2 text-base font-bold text-violet-900 dark:text-violet-100">
          {/[=^]/.test(String(content.problem)) && String(content.problem).length < 60 ? <Latex>{String(content.problem)}</Latex> : String(content.problem)}
        </p>
      )}
      {order.map((idx, k) => (
        <div key={idx} className={cn('flex items-center gap-2 rounded-2xl border-2 p-2 text-sm', checked ? (idx === k ? 'border-emerald-300 bg-soft-green' : 'border-red-300 bg-soft-red') : 'border-line')}>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-3 text-xs font-bold">{k + 1}</span>
          <span className="flex-1 text-ink">
            {steps[idx].text} {steps[idx].latex && <Latex>{steps[idx].latex!}</Latex>}
          </span>
          <button className="icon-btn h-7 w-7" onClick={() => move(k, -1)} aria-label="Subir">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button className="icon-btn h-7 w-7" onClick={() => move(k, 1)} aria-label="Bajar">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      ))}
      {checked ? <Score ok={ok} total={steps.length} onReset={() => { setOrder(shuffleOnce(steps.map((_, i) => i), Date.now() % 97)); setChecked(false) }} /> : <Button onClick={() => setChecked(true)}>Comprobar orden</Button>}
    </div>
  )
}

// ── Ruleta ───────────────────────────────────────
function RoulettePlayer({ content }: { content: Content }) {
  const segments = (content.segments as Array<{ prompt: string; answer: string }>) ?? []
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [show, setShow] = useState(false)
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#f97316', '#22c55e', '#0ea5e9', '#f59e0b', '#ef4444']
  const n = Math.max(segments.length, 1)
  const spin = () => {
    const pick = Math.floor(Math.random() * n)
    const target = 360 * 5 + (360 - (pick * 360) / n - 180 / n)
    setAngle((a) => a - (a % 360) + target)
    setResult(null)
    setShow(false)
    setTimeout(() => setResult(pick), 3200)
  }
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-sm">
        <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-x-transparent border-t-ink" />
        <svg viewBox="-100 -100 200 200" className="h-full w-full transition-transform duration-[3000ms] ease-out" style={{ transform: `rotate(${angle}deg)` }}>
          {segments.map((_, i) => {
            const a0 = ((i * 360) / n - 90) * (Math.PI / 180)
            const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180)
            const large = 360 / n > 180 ? 1 : 0
            const mid = (a0 + a1) / 2
            return (
              <g key={i}>
                <path d={`M0 0 L${95 * Math.cos(a0)} ${95 * Math.sin(a0)} A95 95 0 ${large} 1 ${95 * Math.cos(a1)} ${95 * Math.sin(a1)} Z`} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="2" />
                <text x={62 * Math.cos(mid)} y={62 * Math.sin(mid)} fill="#fff" fontSize="14" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
                  {i + 1}
                </text>
              </g>
            )
          })}
          <circle r="14" fill="#fff" />
        </svg>
      </div>
      <div className="space-y-3">
        <Button size="lg" onClick={spin}>
          ¡Girar la ruleta!
        </Button>
        {result != null && (
          <div className="animate-fade-in rounded-2xl border border-line p-4">
            <p className="text-xs font-bold uppercase text-brand-pink">Reto {result + 1}</p>
            <p className="mt-1 text-base font-semibold text-ink">
              <RichMath text={segments[result].prompt} />
            </p>
            {show ? <p className="mt-2 font-bold text-emerald-600">Respuesta: {segments[result].answer}</p> : <Button size="sm" variant="secondary" className="mt-2" onClick={() => setShow(true)}>Ver respuesta</Button>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Escape room ──────────────────────────────────
function EscapePlayer({ content }: { content: Content }) {
  const challenges = (content.challenges as Array<{ room: string; riddle: string; answer: string; hint?: string }>) ?? []
  const [room, setRoom] = useState(0)
  const [value, setValue] = useState('')
  const [hint, setHint] = useState(false)
  const [fail, setFail] = useState(false)
  const done = room >= challenges.length
  const check = () => {
    const expected = norm(challenges[room].answer)
    const given = norm(value)
    if (given === expected || (Number(given) && Number(given) === Number(expected.replace(/[^\d.-]/g, '')))) {
      setRoom(room + 1)
      setValue('')
      setHint(false)
    } else {
      setFail(true)
      setTimeout(() => setFail(false), 700)
    }
  }
  return (
    <div className="space-y-4">
      {Boolean(content.story) && <p className="rounded-2xl bg-[#1f2a44] px-4 py-3 text-sm text-white/90">🔐 {String(content.story)}</p>}
      <div className="flex gap-2">
        {challenges.map((c, i) => (
          <span key={i} className={cn('flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold', i < room ? 'bg-soft-green text-emerald-600' : i === room ? 'bg-soft-purple text-brand-purple' : 'bg-surface-3 text-ink-3')}>
            {i < room ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {c.room}
          </span>
        ))}
      </div>
      {done ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 p-6 text-center dark:from-emerald-950/30 dark:to-sky-950/30">
          <p className="text-2xl font-extrabold text-emerald-600">¡Escaparon! 🎉</p>
          <p className="mt-1 text-sm text-ink-2">
            Código de salida: <b className="font-mono text-lg">{String(content.finalCode ?? '')}</b>
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => setRoom(0)}>
            Jugar de nuevo
          </Button>
        </div>
      ) : (
        <div className={cn('rounded-2xl border-2 p-4 transition', fail ? 'border-red-300 bg-soft-red' : 'border-line')}>
          <p className="text-base font-semibold text-ink">
            <RichMath text={challenges[room].riddle} />
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} className="input w-48" placeholder="Respuesta" />
            <Button onClick={check}>Abrir</Button>
            {challenges[room].hint && (
              <Button variant="ghost" onClick={() => setHint(true)}>
                Pista
              </Button>
            )}
          </div>
          {hint && <p className="mt-2 text-xs text-ink-3">💡 {challenges[room].hint}</p>}
        </div>
      )}
    </div>
  )
}

// ── Plano cartesiano ─────────────────────────────
function CartesianPlayer({ content }: { content: Content }) {
  const points = (content.points as Array<{ label: string; x: number; y: number }>) ?? []
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({})
  const next = points.find((p) => !placed[p.label])
  const R = 7
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!next) return
    const svg = e.currentTarget
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    setPlaced({ ...placed, [next.label]: { x: Math.round(p.x), y: Math.round(-p.y) } })
  }
  const ok = points.filter((p) => placed[p.label]?.x === p.x && placed[p.label]?.y === p.y).length
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} onClick={click} className="aspect-square w-full max-w-md cursor-crosshair rounded-2xl bg-white shadow-inner">
        {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map((v) => (
          <g key={v}>
            <line x1={v} y1={-R} x2={v} y2={R} stroke={v === 0 ? '#1e1b4b' : '#e9e5f5'} strokeWidth={v === 0 ? 0.06 : 0.03} />
            <line x1={-R} y1={v} x2={R} y2={v} stroke={v === 0 ? '#1e1b4b' : '#e9e5f5'} strokeWidth={v === 0 ? 0.06 : 0.03} />
            {v !== 0 && (
              <text x={v} y={0.45} fontSize="0.3" textAnchor="middle" fill="#9d98b4">
                {v}
              </text>
            )}
          </g>
        ))}
        {Object.entries(placed).map(([label, p]) => {
          const target = points.find((x) => x.label === label)!
          const good = target.x === p.x && target.y === p.y
          return (
            <g key={label}>
              <circle cx={p.x} cy={-p.y} r={0.22} fill={good ? '#22c55e' : '#ef4444'} />
              <text x={p.x + 0.3} y={-p.y - 0.3} fontSize="0.45" fontWeight="700" fill="#1e1b4b">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink">{next ? `Ubica el punto ${next.label}(${next.x}, ${next.y})` : '¡Todos los puntos ubicados!'}</p>
        <ul className="space-y-1 text-sm">
          {points.map((p) => (
            <li key={p.label} className="flex items-center gap-2 text-ink-2">
              {placed[p.label] ? placed[p.label].x === p.x && placed[p.label].y === p.y ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" /> : <span className="h-4 w-4 rounded-full border border-line" />}
              {p.label}({p.x}, {p.y})
            </li>
          ))}
        </ul>
        <Score ok={ok} total={points.length} onReset={() => setPlaced({})} />
      </div>
    </div>
  )
}

// ── Arrastrar y soltar (clasificar) ──────────────
function DragDropPlayer({ content }: { content: Content }) {
  const categories = (content.categories as string[]) ?? []
  const items = (content.items as Array<{ text: string; category: number }>) ?? []
  const [placed, setPlaced] = useState<Record<number, number>>({})
  const ok = items.filter((it, i) => placed[i] === it.category).length
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) =>
          placed[i] === undefined ? (
            <span key={i} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))} className="cursor-grab rounded-xl border border-line bg-surface px-3 py-1.5 text-sm shadow-sm">
              <RichMath text={it.text.includes('\\') || /[=^]/.test(it.text) ? `$${it.text}$` : it.text} />
            </span>
          ) : null,
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((c, k) => (
          <div
            key={k}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const i = Number(e.dataTransfer.getData('text/plain'))
              if (!Number.isNaN(i)) setPlaced({ ...placed, [i]: k })
            }}
            className="min-h-32 rounded-2xl border-2 border-dashed border-violet-200 p-3 dark:border-violet-900"
          >
            <p className="mb-2 text-sm font-bold text-ink">{c}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((it, i) =>
                placed[i] === k ? (
                  <span key={i} className={cn('rounded-lg px-2 py-1 text-xs', it.category === k ? 'bg-soft-green text-emerald-700' : 'bg-soft-red text-red-600')}>
                    <RichMath text={it.text.includes('\\') || /[=^]/.test(it.text) ? `$${it.text}$` : it.text} />
                  </span>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      <Score ok={ok} total={items.length} onReset={() => setPlaced({})} />
    </div>
  )
}

export function ActivityPlayer({ type, content }: { type: ActivityType; content: Content }) {
  switch (type) {
    case 'QUIZ_GAME':
      return <QuizPlayer content={content} timed />
    case 'MULTIPLE_CHOICE':
      return <QuizPlayer content={content} />
    case 'TRUE_FALSE':
      return <TrueFalsePlayer content={content} />
    case 'MATCHING':
      return <MatchingPlayer content={content} />
    case 'MEMORY':
      return <MemoryPlayer content={content} />
    case 'COMPLETE':
      return <FillPlayer items={(content.items as Array<{ text: string; answer: string }>) ?? []} />
    case 'SOLVE_OPERATIONS':
      return <FillPlayer items={((content.items as Array<{ prompt: string; answer: string }>) ?? []).map((x) => ({ text: x.prompt.includes('\\') || /[=^]/.test(x.prompt) ? `$${x.prompt}$` : x.prompt, answer: x.answer }))} />
    case 'ORDER_STEPS':
      return <OrderPlayer content={content} />
    case 'ROULETTE':
      return <RoulettePlayer content={content} />
    case 'ESCAPE_ROOM':
      return <EscapePlayer content={content} />
    case 'CARTESIAN_POINTS':
      return <CartesianPlayer content={content} />
    case 'DRAG_DROP':
      return <DragDropPlayer content={content} />
    default:
      return <p className="text-sm text-ink-3">Tipo de actividad no soportado.</p>
  }
}
