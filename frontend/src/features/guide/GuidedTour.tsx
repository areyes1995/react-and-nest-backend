// ──────────────────────────────────────────────
// GuidedTour — el recorrido de bienvenida.
//
// Ilumina de una en una las cuatro zonas de la
// interfaz y explica para qué sirve cada una. No
// describe funciones abstractas: señala el elemento
// real que el estudiante tiene delante.
//
// Los objetivos se marcan con `data-tour="id"` en el
// propio componente, así que si una zona no está en
// pantalla (móvil, o sin permisos) su paso se salta
// solo en vez de iluminar el vacío.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, Compass, X } from 'lucide-react'
import { useGuide } from './GuideContext'

interface TourStep {
  /** Valor del atributo `data-tour` del elemento a iluminar. */
  target: string
  title: string
  text: string
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'appbar',
    title: 'Todo lo que puedes hacer',
    text: 'Esta barra agrupa las actividades del curso: aprender, practicar, herramientas y tu progreso. Abre cualquier menú y verás para qué sirve cada apartado antes de entrar.',
  },
  {
    target: 'nextstep',
    title: 'Tu siguiente paso, siempre a la vista',
    text: 'Aquí aparece la única cosa que te toca hacer ahora, con el botón para hacerla. Si alguna vez no sabes por dónde seguir, pulsa ahí.',
  },
  {
    target: 'sidebar',
    title: 'El índice completo',
    text: 'La barra lateral tiene todos los destinos ordenados por sección. Es el mapa: úsala cuando busques algo concreto.',
  },
  {
    target: 'panel',
    title: 'El detalle de donde estés',
    text: 'Este panel cambia con la página: el temario del curso, las categorías de artículos o los formatos de mesa. No tienes que volver atrás para cambiar de clase.',
  },
  {
    target: 'streak',
    title: 'Tu racha y tu nivel',
    text: 'Cada clase completada y cada mano jugada suman XP. La racha cuenta los días seguidos que estudias: es el hábito lo que hace al jugador.',
  },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** Rectángulo del objetivo, o `null` si no se puede iluminar. */
function measure(target: string): Rect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  // En móvil la barra lateral y el panel siguen en el DOM, solo desplazados
  // fuera de la pantalla. Iluminarlos sería alumbrar el vacío.
  if (rect.right <= 0 || rect.left >= window.innerWidth) return null
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}

const PADDING = 6
const CARD_WIDTH = 340
const GAP = 14

export default function GuidedTour() {
  const { tourOpen, closeTour } = useGuide()
  const [steps, setSteps] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  // Al abrir se descartan los pasos cuyo objetivo no está en pantalla: en móvil
  // la barra lateral y el panel son cajones cerrados.
  useEffect(() => {
    if (!tourOpen) return
    const available = TOUR_STEPS.filter(step => measure(step.target))
    setSteps(available)
    setIndex(0)
    if (available.length === 0) closeTour()
  }, [tourOpen, closeTour])

  const step = steps[index]

  useLayoutEffect(() => {
    if (!tourOpen || !step) return
    const update = () => setRect(measure(step.target))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [tourOpen, step])

  const next = useCallback(() => {
    if (index >= steps.length - 1) closeTour()
    else setIndex(index + 1)
  }, [index, steps.length, closeTour])

  const previous = useCallback(() => setIndex(current => Math.max(0, current - 1)), [])

  useEffect(() => {
    if (!tourOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTour()
      if (event.key === 'ArrowRight' || event.key === 'Enter') next()
      if (event.key === 'ArrowLeft') previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tourOpen, closeTour, next, previous])

  if (!tourOpen || !step || !rect) return null

  const isLast = index === steps.length - 1
  const hole = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  // La tarjeta va debajo del hueco si cabe; si no, encima. Y siempre dentro de
  // los márgenes de la ventana.
  const below = hole.top + hole.height + GAP
  const fitsBelow = below + 220 < window.innerHeight
  const cardTop = fitsBelow ? below : Math.max(GAP, hole.top - 220 - GAP)
  const cardLeft = Math.min(
    Math.max(GAP, hole.left + hole.width / 2 - CARD_WIDTH / 2),
    window.innerWidth - CARD_WIDTH - GAP,
  )

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Recorrido guiado">
      {/* ── Penumbra con el hueco recortado ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={next}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={hole.left}
              y={hole.top}
              width={hole.width}
              height={hole.height}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-mask)" />
      </svg>

      {/* ── Marco dorado alrededor del elemento iluminado ── */}
      <div
        className="absolute rounded-xl pointer-events-none transition-all duration-200"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          border: '2px solid var(--poker-gold)',
          boxShadow: '0 0 0 4px color-mix(in srgb, var(--poker-gold) 22%, transparent)',
        }}
      />

      {/* ── Explicación ── */}
      <div
        className="absolute rounded-2xl border border-[var(--border-active)] bg-[var(--bg-panel)] shadow-2xl p-4"
        style={{ top: cardTop, left: cardLeft, width: CARD_WIDTH }}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: 'color-mix(in srgb, var(--poker-gold) 16%, transparent)', color: 'var(--poker-gold)' }}
          >
            <Compass className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-mini uppercase tracking-wide text-[var(--poker-gold)] font-semibold">
              Paso {index + 1} de {steps.length}
            </p>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={closeTour}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition shrink-0"
            title="Cerrar el recorrido"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2.5">{step.text}</p>

        {/* ── Puntos de posición ── */}
        <div className="flex items-center gap-1.5 mt-3.5">
          {steps.map((dot, dotIndex) => (
            <span
              key={dot.target}
              className="h-1 rounded-full transition-all duration-200"
              style={{
                width: dotIndex === index ? 18 : 6,
                background: dotIndex <= index ? 'var(--poker-gold)' : 'var(--bg-surface)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={closeTour}
            className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            Saltar
          </button>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={previous}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-bold text-black transition hover:brightness-110"
              style={{ background: 'var(--poker-gold)' }}
            >
              {isLast ? (
                <>
                  <Check className="w-3 h-3" strokeWidth={3} />
                  Entendido
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
