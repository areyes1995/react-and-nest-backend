// ──────────────────────────────────────────────
// WhatYouLearn — el recuadro "Lo que vas a
// aprender" de Udemy, en dos columnas.
//
// Dentro de la academia marca además qué
// habilidades ya dominas: ver la lista llenarse de
// checks verdes es parte de la recompensa, y ver
// las que faltan, el motivo para seguir.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import ProgressRing from '@components/content/ProgressRing'

export interface WhatYouLearnItem {
  text: string
  /** Solo dentro de la academia: la habilidad ya está dominada. */
  learned?: boolean
  /** Contexto opcional (curso o nivel). */
  hint?: string
}

export interface WhatYouLearnProps {
  items: WhatYouLearnItem[]
  title?: string
  /** Cuántas se ven antes de "Mostrar más". */
  initialVisible?: number
  /** Muestra el contador de dominadas. */
  trackProgress?: boolean
}

export default function WhatYouLearn({
  items,
  title = 'Lo que vas a aprender',
  initialVisible = 10,
  trackProgress = false,
}: WhatYouLearnProps) {
  const [expanded, setExpanded] = useState(false)
  const learned = items.filter(item => item.learned).length
  // Primero lo pendiente: es lo que interesa ver; lo dominado queda como trofeo.
  const ordered = trackProgress ? [...items].sort((a, b) => Number(a.learned) - Number(b.learned)) : items
  const visible = expanded ? ordered : ordered.slice(0, initialVisible)
  const hidden = ordered.length - visible.length

  return (
    <section className="rounded-2xl border border-[var(--border-active)] bg-[var(--bg-panel)] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{title}</h2>
          {trackProgress && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {learned === 0
                ? `${items.length} habilidades concretas que vas a poder usar en la mesa.`
                : `Ya dominas ${learned} de ${items.length}. Cada curso que terminas marca las suyas.`}
            </p>
          )}
        </div>
        {trackProgress && (
          <ProgressRing value={items.length ? learned / items.length : 0} size={56} stroke={5} color="#34d399">
            <span className="text-caption font-extrabold tabular-nums text-[var(--text-primary)]">
              {Math.round((items.length ? learned / items.length : 0) * 100)}%
            </span>
          </ProgressRing>
        )}
      </div>

      <ul className="stagger mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {visible.map((item, index) => (
          <li key={item.text + index} className="flex items-start gap-3">
            {item.learned ? (
              <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">
                <Check className="w-3 h-3" strokeWidth={3.5} />
              </span>
            ) : (
              <Check className="mt-0.5 w-5 h-5 text-[var(--poker-gold)] shrink-0" strokeWidth={2.5} />
            )}
            <span className="min-w-0">
              <span
                className={`block text-sm leading-snug ${
                  item.learned ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {item.text}
              </span>
              {(item.hint || item.learned) && (
                <span className="mt-0.5 flex items-center gap-1.5 text-caption text-[var(--text-muted)]">
                  {item.learned && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                      <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                      Dominada
                    </span>
                  )}
                  {item.hint && <span className="truncate">{item.hint}</span>}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {(hidden > 0 || expanded) && ordered.length > initialVisible && (
        <button
          type="button"
          onClick={() => setExpanded(open => !open)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--poker-gold)] hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Mostrar ${hidden} más`}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
        </button>
      )}
    </section>
  )
}
