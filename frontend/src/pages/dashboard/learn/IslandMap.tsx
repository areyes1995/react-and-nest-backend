// ──────────────────────────────────────────────
// IslandMap — la vista "Islas" de la ruta.
//
// Un mapa del tesoro visto desde arriba: cada nivel
// es una isla con su propio paisaje y las clases son
// paradas sobre un sendero que serpentea por ella y
// cruza el mar hasta la siguiente. Al final espera
// el islote del trofeo.
//
// Todo se dibuja con SVG + HTML posicionado sobre el
// mismo sistema de coordenadas (1 unidad = 1 px), así
// que no hay imágenes que cargar y el mapa crece
// solo al añadir clases.
//
// Interacción: se arrastra para navegar, la rueda
// desplaza en horizontal, las flechas saltan y al
// pulsar una parada se abre su tarjeta (como en
// Duolingo). Al entrar, la cámara viaja sola hasta
// la parada actual.
// ──────────────────────────────────────────────

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
  MapPin,
  Play,
  Sailboat,
  Spade,
  Star,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { Icon, ProgressBar } from '@components/content'
import { levelProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import type { Course, Lesson, Level, LevelId } from '@features/academy/types'
import { useAccess } from '@features/access/AccessContext'

// ── Geometría del mundo ──────────────────────────
const WORLD_H = 600
const CENTER_Y = 318
const NODE_GAP = 124
const ISLAND_PAD = 118
const SEA_GAP = 210
const WORLD_PAD = 90
const AMPLITUDE = 82
const TROPHY_GAP = 240

type NodeState = 'done' | 'current' | 'available' | 'locked'

interface Theme {
  name: string
  shore: string
  sand: string
  grassTop: string
  grassBottom: string
  deco: string
  sea: string
  decorations: string[]
}

/** Un paisaje por nivel: playa tropical, selva, montaña violeta e isla dorada. */
const THEMES: Record<LevelId, Theme> = {
  beginner: {
    name: 'Isla Semilla',
    shore: '#a5f3fc',
    sand: '#fde68a',
    grassTop: '#86efac',
    grassBottom: '#16a34a',
    deco: '#14532d',
    sea: '#0891b2',
    decorations: ['TreePalm', 'Tent', 'TreePalm', 'Flower2', 'TreePalm', 'Sprout'],
  },
  intermediate: {
    name: 'Selva de las Capas',
    shore: '#99f6e4',
    sand: '#fef3c7',
    grassTop: '#5eead4',
    grassBottom: '#0f766e',
    deco: '#134e4a',
    sea: '#0369a1',
    decorations: ['Trees', 'TreePine', 'TreePalm', 'Trees', 'Bird', 'TreePine'],
  },
  advanced: {
    name: 'Monte de los Rangos',
    shore: '#e9d5ff',
    sand: '#fed7aa',
    grassTop: '#d8b4fe',
    grassBottom: '#7e22ce',
    deco: '#3b0764',
    sea: '#5b21b6',
    decorations: ['MountainSnow', 'Mountain', 'TreePine', 'MountainSnow', 'Flame', 'Mountain'],
  },
  theory: {
    name: 'Isla del Equilibrio',
    shore: '#c4b5fd',
    sand: '#fef3c7',
    grassTop: '#a5b4fc',
    grassBottom: '#4f46e5',
    deco: '#312e81',
    sea: '#4338ca',
    decorations: ['Landmark', 'Trees', 'Landmark', 'Bird', 'TreePine', 'Gem'],
  },
  exploit: {
    name: 'Isla del Botín',
    shore: '#fed7aa',
    sand: '#f5f5f4',
    grassTop: '#fdba74',
    grassBottom: '#c2410c',
    deco: '#7c2d12',
    sea: '#9a3412',
    decorations: ['Tent', 'Flame', 'Mountain', 'Gem', 'Tent', 'Flame'],
  },
  pro: {
    name: 'Isla Dorada',
    shore: '#fde68a',
    sand: '#f5f5f4',
    grassTop: '#fcd34d',
    grassBottom: '#b45309',
    deco: '#78350f',
    sea: '#1e1b4b',
    decorations: ['Castle', 'Gem', 'Landmark', 'Crown', 'Gem', 'Castle'],
  },
}

const KIND_ICON: Record<Lesson['kind'], typeof BookOpen> = {
  lesson: BookOpen,
  video: Play,
  drill: Spade,
  quiz: Star,
}

const KIND_LABEL: Record<Lesson['kind'], string> = {
  lesson: 'Clase',
  video: 'Video',
  drill: 'Práctica en la mesa',
  quiz: 'Quiz',
}

// ── Utilidades geométricas ───────────────────────

/** Ruido determinista en [0, 1): el mapa se ve igual en cada visita. */
function noise(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface Point {
  x: number
  y: number
}

/** Curva suave (Catmull-Rom → Bézier) que pasa por todos los puntos. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`
  }
  return d
}

/**
 * Manchas de tierra que siguen el sendero: un círculo por parada y otro entre
 * cada dos, con radios algo irregulares. La unión da una isla orgánica que
 * abraza el camino, sin tener que dibujar la costa a mano.
 */
function landBlobs(points: Point[], seed: number): { x: number; y: number; r: number }[] {
  const blobs: { x: number; y: number; r: number }[] = []
  points.forEach((p, i) => {
    blobs.push({ x: p.x, y: p.y, r: 128 + noise(seed + i) * 34 })
    const next = points[i + 1]
    if (next) {
      const mx = (p.x + next.x) / 2
      const my = (p.y + next.y) / 2
      // Lóbulos alternos arriba y abajo del sendero.
      const side = i % 2 === 0 ? -1 : 1
      blobs.push({ x: mx, y: my + side * (40 + noise(seed + i * 3) * 30), r: 118 + noise(seed + i * 7) * 30 })
    }
  })
  // Remates redondeados en los extremos.
  const first = points[0]
  const last = points[points.length - 1]
  blobs.push({ x: first.x - 40, y: first.y + 20, r: 110 })
  blobs.push({ x: last.x + 40, y: last.y - 20, r: 110 })
  return blobs
}

// ── Modelo del mapa ──────────────────────────────

interface MapStop {
  lesson: Lesson
  course: Course
  level: Level
  pathIndex: number
  x: number
  y: number
  firstOfCourse: boolean
}

interface MapIsland {
  level: Level
  theme: Theme
  index: number
  x0: number
  x1: number
  stops: MapStop[]
  blobs: { x: number; y: number; r: number }[]
}

function buildMap(levels: Level[]) {
  const islands: MapIsland[] = []
  let cursor = WORLD_PAD
  let pathIndex = 0

  levels.forEach((level, islandIndex) => {
    const lessons = level.courses.flatMap(course => course.lessons.map(lesson => ({ lesson, course })))
    const width = ISLAND_PAD * 2 + Math.max(0, lessons.length - 1) * NODE_GAP
    const x0 = cursor
    const stops: MapStop[] = lessons.map(({ lesson, course }, i) => ({
      lesson,
      course,
      level,
      pathIndex: pathIndex++,
      x: x0 + ISLAND_PAD + i * NODE_GAP,
      y: CENTER_Y + AMPLITUDE * Math.sin(i * 0.95 + islandIndex * 1.4),
      firstOfCourse: i === 0 || lessons[i - 1].course.id !== course.id,
    }))
    islands.push({
      level,
      // Si el backend añade un nivel que el frontend aún no conoce,
      // se usa el paisaje semilla en vez de tumbar la página.
      theme: THEMES[level.id] ?? THEMES.beginner,
      index: islandIndex,
      x0,
      x1: x0 + width,
      stops,
      blobs: landBlobs(stops, islandIndex * 97 + 13),
    })
    cursor = x0 + width + SEA_GAP
  })

  const lastIsland = islands[islands.length - 1]
  const trophy = { x: lastIsland.x1 + TROPHY_GAP - 60, y: CENTER_Y - 10 }
  const width = trophy.x + 200

  return { islands, trophy, width }
}

// ── Piezas ───────────────────────────────────────

function StopNode({
  stop,
  state,
  selected,
  onSelect,
  registerNode,
}: {
  stop: MapStop
  state: NodeState
  selected: boolean
  onSelect: () => void
  registerNode: (node: HTMLElement | null) => void
}) {
  const KindIcon = KIND_ICON[stop.lesson.kind]
  const size = state === 'current' ? 76 : 62
  const theme = THEMES[stop.level.id]

  const face: CSSProperties =
    state === 'done'
      ? { background: `linear-gradient(180deg, ${theme.grassTop}, ${theme.grassBottom})`, color: '#0b0c0f', boxShadow: `0 6px 0 0 ${theme.deco}` }
      : state === 'current'
        ? { background: 'linear-gradient(180deg, #fcd67a, #f2a93b)', color: '#0b0c0f' }
        : state === 'available'
          ? { background: 'linear-gradient(180deg, #ffffff, #e2e8f0)', color: '#334155', boxShadow: '0 6px 0 0 #94a3b8' }
          : { background: 'linear-gradient(180deg, #64748b, #475569)', color: '#cbd5e1', boxShadow: '0 6px 0 0 #334155' }

  return (
    <button
      ref={registerNode}
      type="button"
      onClick={event => {
        event.stopPropagation()
        onSelect()
      }}
      aria-label={`${stop.lesson.title}${state === 'done' ? ' (completada)' : state === 'locked' ? ' (bloqueada)' : state === 'current' ? ' (siguiente)' : ''}`}
      aria-expanded={selected}
      data-stop
      className={`absolute z-10 grid place-items-center rounded-full border-4 border-white/85 transition-transform duration-150 hover:scale-110 active:translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white ${
        state === 'current' ? 'animate-node-pulse' : ''
      } ${selected ? 'scale-110' : ''}`}
      style={{
        left: stop.x - size / 2,
        top: stop.y - size / 2,
        width: size,
        height: size,
        ...face,
      }}
    >
      {state === 'done' ? (
        <Check className="w-7 h-7" strokeWidth={3.5} />
      ) : state === 'locked' ? (
        <Lock className="w-5 h-5" strokeWidth={2.5} />
      ) : (
        <KindIcon
          className={state === 'current' ? 'w-8 h-8' : 'w-6 h-6'}
          strokeWidth={2.5}
          fill={stop.lesson.kind === 'video' || stop.lesson.kind === 'quiz' ? 'currentColor' : 'none'}
        />
      )}
    </button>
  )
}

function StopCard({
  stop,
  state,
  worldWidth,
  onClose,
}: {
  stop: MapStop
  state: NodeState
  worldWidth: number
  onClose: () => void
}) {
  const width = 290
  const left = Math.min(Math.max(12, stop.x - width / 2), worldWidth - width - 12)
  const below = stop.y < CENTER_Y
  const top = below ? stop.y + 52 : undefined
  const bottom = below ? undefined : WORLD_H - stop.y + 52
  const theme = THEMES[stop.level.id]
  const href = `/app/classes/${stop.course.slug}/${stop.lesson.slug}`

  return (
    <div
      data-stop-card
      role="dialog"
      aria-label={stop.lesson.title}
      className="absolute z-30 animate-pop-in rounded-2xl border border-white/15 bg-[#0f1420]/95 p-4 text-left shadow-2xl shadow-black/50 backdrop-blur"
      style={{ left, top, bottom, width }}
      onClick={event => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-2.5 top-2.5 rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-2 pr-6">
        <span
          className="rounded-full px-2 py-0.5 text-mini font-bold uppercase tracking-wide text-[#0b0c0f]"
          style={{ background: theme.grassTop }}
        >
          {KIND_LABEL[stop.lesson.kind]}
        </span>
        <span className="truncate text-caption font-medium text-white/55">{stop.course.title}</span>
      </div>

      <h3 className="mt-2 text-base font-extrabold leading-snug text-white">{stop.lesson.title}</h3>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/70 line-clamp-3">{stop.lesson.summary}</p>

      <p className="mt-2.5 flex items-center gap-3 text-xs text-white/60">
        <span>{stop.lesson.minutes} min</span>
        <span className="flex items-center gap-1 font-semibold text-[var(--poker-gold)]">
          <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          {stop.lesson.xp} XP
        </span>
      </p>

      {state === 'locked' ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/60">
          <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          Completa el 60% de la isla anterior para llegar aquí.
        </p>
      ) : (
        <Link
          to={href}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-[#0b0c0f] transition hover:brightness-110 press"
          style={
            state === 'done'
              ? { background: '#e2e8f0', boxShadow: '0 4px 0 0 #94a3b8' }
              : { background: 'var(--poker-gold)', boxShadow: '0 4px 0 0 #b7791f' }
          }
        >
          {state === 'done' ? 'Repasar' : state === 'current' ? `Empezar · +${stop.lesson.xp} XP` : 'Abrir clase'}
        </Link>
      )}
    </div>
  )
}

function IslandSign({
  island,
  unlocked,
  stats,
  previousTitle,
}: {
  island: MapIsland
  unlocked: boolean
  stats: { done: number; total: number; ratio: number }
  previousTitle?: string
}) {
  const { level, theme } = island
  return (
    <div
      className="absolute z-20 w-[15.625rem] rounded-2xl border border-white/15 bg-black/45 p-3 text-white shadow-xl backdrop-blur-md"
      style={{ left: island.x0 + 20, top: 18 }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid place-items-center w-10 h-10 rounded-xl border-2 border-white/70 shrink-0"
          style={{ background: `linear-gradient(180deg, ${theme.grassTop}, ${theme.grassBottom})` }}
        >
          <Icon name={level.icon} className="w-5 h-5 text-[#0b0c0f]" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-mini font-bold uppercase tracking-[0.14em] text-white/55">
            Isla {island.index + 1} · {level.title}
          </p>
          <p className="truncate text-sm font-extrabold">{theme.name}</p>
        </div>
        {stats.ratio >= 1 ? (
          <Star className="w-5 h-5 text-[var(--poker-gold)] shrink-0" fill="currentColor" strokeWidth={0} />
        ) : !unlocked ? (
          <Lock className="w-4 h-4 text-white/60 shrink-0" strokeWidth={2} />
        ) : null}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <ProgressBar value={stats.ratio} color={theme.grassTop} className="flex-1" />
        <span className="text-caption font-bold tabular-nums text-white/80">
          {stats.done}/{stats.total}
        </span>
      </div>
      {!unlocked && previousTitle && (
        <p className="mt-1.5 text-caption text-white/55">Se abre al 60% de {previousTitle}.</p>
      )}
    </div>
  )
}

// ── El mapa ──────────────────────────────────────

export default function IslandMap({
  completed,
  currentLessonId,
}: {
  completed: Record<string, unknown>
  currentLessonId: string
}) {
  const { levels, path, findLessonById } = useCurriculum()
  const { isLevelUnlocked } = useAccess()
  const { islands, trophy, width } = useMemo(() => buildMap(levels), [levels])
  const scrollRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({})
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const homeIsland: LevelId = findLessonById(currentLessonId)?.level.id ?? 'beginner'
  const [activeIsland, setActiveIsland] = useState<LevelId>(homeIsland)
  const [selected, setSelected] = useState<string | null>(null)

  const allStops = useMemo(() => islands.flatMap(island => island.stops), [islands])
  const currentStop = allStops.find(stop => stop.lesson.id === currentLessonId) ?? allStops[0]
  const allDone = path.every(step => completed[step.lesson.id])

  const unlockedByLevel = useMemo(
    () => Object.fromEntries(levels.map(level => [level.id, isLevelUnlocked(level.id, completed)])) as Record<LevelId, boolean>,
    [completed, levels, isLevelUnlocked],
  )

  const stateOf = (stop: MapStop): NodeState => {
    if (!unlockedByLevel[stop.level.id]) return 'locked'
    if (completed[stop.lesson.id]) return 'done'
    if (stop.lesson.id === currentLessonId && !allDone) return 'current'
    return 'available'
  }

  // Sendero completo y tramo ya recorrido (hasta la parada actual).
  const routePoints = useMemo(() => [...allStops.map(s => ({ x: s.x, y: s.y })), trophy], [allStops, trophy])
  const fullRoute = useMemo(() => smoothPath(routePoints), [routePoints])
  const doneRoute = useMemo(
    () => smoothPath(routePoints.slice(0, (allDone ? routePoints.length : currentStop.pathIndex + 1))),
    [routePoints, currentStop, allDone],
  )

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const centerOn = (x: number, smooth = true) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: x - el.clientWidth / 2, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' })
  }

  // Al entrar, la cámara parte del inicio de la isla y navega hasta tu parada.
  useLayoutEffect(() => {
    const island = islands.find(i => i.level.id === homeIsland)
    const el = scrollRef.current
    if (!el || !island) return
    el.scrollLeft = Math.max(0, island.x0 - 40)
    const id = window.setTimeout(() => centerOn(currentStop.x), 250)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La rueda del ratón desplaza en horizontal (sin bloquear la página en los extremos).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      const atStart = el.scrollLeft <= 0 && event.deltaY < 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && event.deltaY > 0
      if (atStart || atEnd) return
      event.preventDefault()
      el.scrollLeft += event.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Cerrar la tarjeta con Escape.
  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best = islands[0]
    let bestDist = Infinity
    for (const island of islands) {
      const dist = Math.abs((island.x0 + island.x1) / 2 - center)
      if (dist < bestDist) {
        bestDist = dist
        best = island
      }
    }
    if (best.level.id !== activeIsland) setActiveIsland(best.level.id)
  }

  // Arrastrar para navegar, como un mapa.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if ((event.target as HTMLElement).closest('[data-stop-card], a, select')) return
    drag.current = { x: event.clientX, left: scrollRef.current?.scrollLeft ?? 0, moved: false }
  }
  const onPointerMove = (event: React.PointerEvent) => {
    const state = drag.current
    const el = scrollRef.current
    if (!state || !el) return
    const dx = event.clientX - state.x
    if (Math.abs(dx) > 4) state.moved = true
    if (state.moved) el.scrollLeft = state.left - dx
  }
  const onPointerUp = () => {
    if (drag.current?.moved) suppressClick.current = true
    drag.current = null
    window.setTimeout(() => {
      suppressClick.current = false
    }, 0)
  }

  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  const selectedStop = allStops.find(stop => stop.lesson.id === selected)
  const doneCount = path.filter(step => completed[step.lesson.id]).length

  // Fondo del océano: cada tramo de mar toma el tono de su isla.
  const oceanGradient = `linear-gradient(90deg, ${islands
    .map(island => `${island.theme.sea} ${Math.round((((island.x0 + island.x1) / 2) / width) * 100)}%`)
    .join(', ')}, #0b1026 100%)`

  const proIsland = islands[islands.length - 1]

  return (
    <div className="space-y-3">
      {/* ── Brújula: saltos por isla + volver a mi posición ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {islands.map(island => {
          const stats = levelProgress(island.level, completed)
          const active = activeIsland === island.level.id
          return (
            <button
              key={island.level.id}
              type="button"
              onClick={() => centerOn((island.x0 + island.x1) / 2)}
              aria-current={active}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'border-transparent text-[#0b0c0f] shadow-md'
                  : 'border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={active ? { background: `linear-gradient(180deg, ${island.theme.grassTop}, ${island.theme.grassBottom})` } : undefined}
            >
              {unlockedByLevel[island.level.id] ? (
                <Icon name={island.level.icon} className="w-3.5 h-3.5" strokeWidth={2.2} />
              ) : (
                <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
              {island.theme.name}
              <span className="tabular-nums opacity-75">{Math.round(stats.ratio * 100)}%</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => centerOn(currentStop.x)}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#f2a93b]/60 px-3.5 py-2 text-xs font-bold text-[var(--poker-gold)] transition hover:bg-[#f2a93b]/10"
        >
          <MapPin className="w-3.5 h-3.5" strokeWidth={2.2} />
          Dónde voy
        </button>
      </div>

      {/* ── El océano ── */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-black/40">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClickCapture={event => {
            if (suppressClick.current) {
              event.stopPropagation()
              event.preventDefault()
            }
          }}
          onClick={() => setSelected(null)}
          // El scroll suave global haría que el arrastre fuera a trompicones:
          // aquí el suave se pide solo cuando se quiere (scrollTo).
          style={{ scrollBehavior: 'auto' }}
          className="scrollbar-none cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing select-none"
        >
          <div className="relative" style={{ width, height: WORLD_H, background: oceanGradient }}>
            {/* Oleaje: dos capas de textura que se desplazan despacio. */}
            <div
              className="animate-ocean-drift pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cpath d='M8 30 q10 -9 20 0 t20 0' fill='none' stroke='white' stroke-opacity='0.13' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E"), radial-gradient(circle at 30px 30px, rgba(255,255,255,0.10) 1.5px, transparent 2.5px)`,
                backgroundSize: '120px 60px, 90px 90px',
              }}
            />

            {/* Estrellas sobre el mar nocturno de la isla dorada. */}
            {Array.from({ length: 26 }, (_, i) => (
              <span
                key={`star-${i}`}
                className="animate-twinkle pointer-events-none absolute rounded-full bg-white"
                style={{
                  left: proIsland.x0 - 160 + noise(i * 5) * (width - proIsland.x0 + 160),
                  top: 8 + noise(i * 9 + 1) * (WORLD_H - 16),
                  width: 2 + Math.round(noise(i) * 2),
                  height: 2 + Math.round(noise(i) * 2),
                  animationDelay: `${noise(i * 3) * 2.6}s`,
                }}
              />
            ))}

            {/* Tierra, orilla y sendero, en SVG. */}
            <svg
              className="pointer-events-none absolute inset-0"
              width={width}
              height={WORLD_H}
              viewBox={`0 0 ${width} ${WORLD_H}`}
              aria-hidden
            >
              <defs>
                {islands.map(island => (
                  <linearGradient
                    key={island.level.id}
                    id={`grass-${island.level.id}`}
                    x1="0"
                    y1={CENTER_Y - 200}
                    x2="0"
                    y2={CENTER_Y + 200}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={island.theme.grassTop} />
                    <stop offset="100%" stopColor={island.theme.grassBottom} />
                  </linearGradient>
                ))}
              </defs>

              {islands.map(island => {
                const locked = !unlockedByLevel[island.level.id]
                return (
                  <g key={island.level.id} style={locked ? { filter: 'grayscale(0.7) brightness(0.72)' } : undefined}>
                    {/* Espuma de la orilla */}
                    <g className="animate-shore-wave" fill={island.theme.shore} opacity={0.45}>
                      {island.blobs.map((b, i) => (
                        <circle key={i} cx={b.x} cy={b.y} r={b.r + 30} />
                      ))}
                    </g>
                    {/* Sombra de la isla sobre el agua */}
                    <g fill="#000" opacity={0.18} transform="translate(0 14)">
                      {island.blobs.map((b, i) => (
                        <circle key={i} cx={b.x} cy={b.y} r={b.r + 6} />
                      ))}
                    </g>
                    {/* Arena */}
                    <g fill={island.theme.sand}>
                      {island.blobs.map((b, i) => (
                        <circle key={i} cx={b.x} cy={b.y} r={b.r + 8} />
                      ))}
                    </g>
                    {/* Hierba */}
                    <g fill={`url(#grass-${island.level.id})`}>
                      {island.blobs.map((b, i) => (
                        <circle key={i} cx={b.x} cy={b.y} r={b.r - 16} />
                      ))}
                    </g>
                    {/* Matas de hierba más oscura */}
                    <g fill={island.theme.deco} opacity={0.14}>
                      {island.blobs.map((b, i) => (
                        <ellipse key={i} cx={b.x + (noise(i + island.index) - 0.5) * 80} cy={b.y + (noise(i * 2) - 0.5) * 70} rx={26} ry={12} />
                      ))}
                    </g>
                  </g>
                )
              })}

              {/* Islote del trofeo */}
              <g style={allDone ? undefined : { filter: 'grayscale(0.6) brightness(0.7)' }}>
                <circle cx={trophy.x} cy={trophy.y} r={120} fill="#fde68a" opacity={0.4} className="animate-shore-wave" />
                <circle cx={trophy.x} cy={trophy.y + 12} r={96} fill="#000" opacity={0.18} />
                <circle cx={trophy.x} cy={trophy.y} r={98} fill="#f5f5f4" />
                <circle cx={trophy.x} cy={trophy.y} r={80} fill="url(#grass-pro)" />
              </g>

              {/* Sendero: sombra, tramo pendiente (punteado) y tramo recorrido (dorado). */}
              <path d={fullRoute} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={16} strokeLinecap="round" transform="translate(0 4)" />
              <path d={fullRoute} fill="none" stroke="#fff8e7" strokeOpacity={0.8} strokeWidth={9} strokeLinecap="round" strokeDasharray="2 18" />
              <path d={doneRoute} fill="none" stroke="#f2a93b" strokeWidth={10} strokeLinecap="round" />
              <path d={doneRoute} fill="none" stroke="#fff3c4" strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" strokeDasharray="1 14" />
            </svg>

            {/* Decoración: palmeras, bosques, montes y castillos según la isla. */}
            {islands.map(island =>
              island.stops.slice(0, -1).map((stop, i) => {
                const next = island.stops[i + 1]
                const name = island.theme.decorations[i % island.theme.decorations.length]
                const side = i % 2 === 0 ? 1 : -1
                const size = 34 + Math.round(noise(i + island.index * 11) * 16)
                return (
                  <Icon
                    key={`${island.level.id}-deco-${i}`}
                    name={name}
                    className="pointer-events-none absolute drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]"
                    strokeWidth={2}
                    style={{
                      left: (stop.x + next.x) / 2 - size / 2 + (noise(i * 13) - 0.5) * 30,
                      top: (stop.y + next.y) / 2 + side * (96 + noise(i * 17) * 18) - size / 2,
                      width: size,
                      height: size,
                      color: island.theme.deco,
                      opacity: unlockedByLevel[island.level.id] ? 0.9 : 0.4,
                    }}
                  />
                )
              }),
            )}

            {/* Nubes que pasan por encima */}
            {Array.from({ length: Math.ceil(width / 520) }, (_, i) => (
              <div
                key={`cloud-${i}`}
                className="animate-cloud-drift pointer-events-none absolute"
                style={{ left: 180 + i * 520 + noise(i) * 160, top: 14 + noise(i + 7) * 36, opacity: 0.55 + noise(i + 2) * 0.3, animationDelay: `${-noise(i) * 14}s` }}
              >
                <div className="relative h-10 w-36">
                  <span className="absolute bottom-0 left-0 h-6 w-36 rounded-full bg-white" />
                  <span className="absolute bottom-2 left-6 h-9 w-12 rounded-full bg-white" />
                  <span className="absolute bottom-2 left-14 h-10 w-14 rounded-full bg-white" />
                </div>
              </div>
            ))}

            {/* Carteles de cada isla */}
            {islands.map((island, i) => (
              <IslandSign
                key={`sign-${island.level.id}`}
                island={island}
                unlocked={unlockedByLevel[island.level.id]}
                stats={levelProgress(island.level, completed)}
                previousTitle={islands[i - 1]?.level.title}
              />
            ))}

            {/* Boyas con el nombre de cada curso */}
            {allStops
              .filter(stop => stop.firstOfCourse && (allDone || stop.lesson.id !== currentStop.lesson.id))
              .map(stop => (
                <span
                  key={`course-${stop.course.id}`}
                  className="pointer-events-none absolute z-[5] flex max-w-[9.375rem] items-center gap-1 truncate rounded-full bg-black/55 px-2.5 py-1 text-mini font-bold text-white/90 backdrop-blur"
                  style={{ left: stop.x - 34, top: stop.y + (stop.y > CENTER_Y ? -74 : 46) }}
                >
                  <Icon name={stop.course.icon} className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  <span className="truncate">{stop.course.title}</span>
                </span>
              ))}

            {/* Paradas */}
            {allStops.map(stop => (
              <StopNode
                key={stop.lesson.id}
                stop={stop}
                state={stateOf(stop)}
                selected={selected === stop.lesson.id}
                onSelect={() => setSelected(current => (current === stop.lesson.id ? null : stop.lesson.id))}
                registerNode={node => {
                  nodeRefs.current[stop.lesson.id] = node
                }}
              />
            ))}

            {/* El barco marca dónde vas */}
            {!allDone && (
              <div
                className="pointer-events-none absolute z-20 flex flex-col items-center"
                style={{ left: currentStop.x - 60, top: currentStop.y - 112, width: 120 }}
              >
                <span className="rounded-full bg-white px-2.5 py-1 text-caption font-extrabold uppercase tracking-wide text-[#0b0c0f] shadow-lg">
                  Estás aquí
                </span>
                <span className="-mt-px h-2 w-2 rotate-45 bg-white" />
                <Sailboat className="animate-island-bob mt-0.5 w-8 h-8 text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" strokeWidth={2.2} />
              </div>
            )}

            {/* Trofeo final */}
            <div
              className="absolute z-10 flex flex-col items-center text-center"
              style={{ left: trophy.x - 80, top: trophy.y - 58, width: 160 }}
            >
              <span
                className={`grid place-items-center w-[5.25rem] h-[5.25rem] rounded-full border-4 border-white/85 ${allDone ? 'animate-node-pulse' : ''}`}
                style={{
                  background: allDone ? 'linear-gradient(180deg, #fde68a, #f59e0b)' : 'linear-gradient(180deg, #64748b, #475569)',
                  boxShadow: allDone ? undefined : '0 6px 0 0 #334155',
                  color: allDone ? '#0b0c0f' : '#cbd5e1',
                }}
              >
                <Trophy className="w-10 h-10" strokeWidth={2.2} />
              </span>
              <span className="mt-2 rounded-full bg-black/55 px-2.5 py-1 text-caption font-extrabold text-white backdrop-blur">
                <Crown className="mr-1 inline w-3 h-3 text-[var(--poker-gold)]" strokeWidth={2.5} />
                Maestro del Hold&apos;em
              </span>
            </div>

            {selectedStop && (
              <StopCard
                stop={selectedStop}
                state={stateOf(selectedStop)}
                worldWidth={width}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        </div>

        {/* ── Controles fijos sobre el mapa ── */}
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Ver islas anteriores"
          className="absolute left-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 p-2.5 text-white backdrop-blur transition hover:bg-black/75"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Ver islas siguientes"
          className="absolute right-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 p-2.5 text-white backdrop-blur transition hover:bg-black/75"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40 flex flex-wrap items-end justify-between gap-2">
          {!allDone ? (
            <Link
              to={`/app/classes/${currentStop.course.slug}/${currentStop.lesson.slug}`}
              className="pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-black/60 py-2 pl-2 pr-4 text-white shadow-xl backdrop-blur-md transition hover:bg-black/75"
            >
              <span
                className="grid place-items-center w-10 h-10 rounded-xl text-[#0b0c0f] shrink-0"
                style={{ background: 'var(--poker-gold)', boxShadow: '0 3px 0 0 #b7791f' }}
              >
                <Play className="w-4 h-4 translate-x-px" fill="currentColor" strokeWidth={0} />
              </span>
              <span className="min-w-0">
                <span className="block text-mini font-bold uppercase tracking-wider text-[var(--poker-gold)]">
                  Siguiente parada
                </span>
                <span className="block truncate text-sm font-bold">{currentStop.lesson.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold tabular-nums text-white/85 backdrop-blur-md">
            {doneCount}/{path.length} paradas · {Math.round((doneCount / path.length) * 100)}%
          </span>
        </div>
      </div>

      <p className="text-center text-caption text-[var(--text-muted)]">
        Arrastra el mapa o usa la rueda del ratón para navegar · pulsa una parada para ver la clase
      </p>
    </div>
  )
}
