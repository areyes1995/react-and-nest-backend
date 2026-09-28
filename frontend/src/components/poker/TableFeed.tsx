// ──────────────────────────────────────────────
// TableFeed — los avisos de la mesa.
// Problema real: el estudiante mira sus cartas y se
// pierde quién apostó, quién subió y cuánto ganó.
// Estos avisos se leen de un vistazo y desaparecen
// solos. Lo suyo lo ve destacado; lo de los rivales,
// atenuado.
//
// Va en franja horizontal bajo el tapete y no sobre
// él: con 6 o 9 jugadores los asientos ocupan las
// cuatro esquinas y cualquier capa encima tapaba a un
// rival justo cuando acababa de actuar.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { ArrowUp, Check, Coins, Circle, Trophy, X, Layers } from 'lucide-react'
import { EVENT_STYLE, type TableEvent, type TableEventKind } from '@features/table/events'

/** Cuánto vive un aviso antes de desvanecerse. */
const LIFETIME_MS = 4200

const ICONS: Record<TableEventKind, typeof Coins> = {
  bet: Coins,
  raise: ArrowUp,
  call: Circle,
  check: Check,
  fold: X,
  blind: Coins,
  win: Trophy,
  street: Layers,
}

export interface TableFeedProps {
  events: TableEvent[]
  className?: string
}

export default function TableFeed({ events, className = '' }: TableFeedProps) {
  // Los avisos caducan por tiempo, no por número: si la mano se para, la mesa
  // debe quedar limpia en vez de congelar el último aviso para siempre.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (events.length === 0) return
    const timer = window.setInterval(() => setNow(Date.now()), 400)
    return () => window.clearInterval(timer)
  }, [events.length])

  const visible = events.filter(event => now - event.at < LIFETIME_MS)

  return (
    // La franja reserva su altura siempre: si apareciera y desapareciera, la
    // página daría un salto en cada acción de la mano.
    <div
      className={`pointer-events-none flex h-7 flex-wrap items-center justify-center gap-1.5 overflow-hidden ${className}`}
      aria-live="polite"
      aria-atomic="false"
    >
      {visible.map(event => {
        const style = EVENT_STYLE[event.kind]
        const Icon = ICONS[event.kind]
        const fading = now - event.at > LIFETIME_MS - 600

        return (
          <div
            key={event.id}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 backdrop-blur-sm ${
              fading ? 'animate-table-event-out' : 'animate-table-event'
            } ${event.isHero ? 'text-white' : 'text-white/75'}`}
            style={{
              background: event.isHero ? 'rgba(10, 12, 16, 0.92)' : 'rgba(10, 12, 16, 0.7)',
              borderColor: event.isHero || style.emphasis ? style.accent : 'rgba(255,255,255,0.1)',
            }}
          >
            <Icon
              className={event.isHero ? 'w-3.5 h-3.5' : 'w-3 h-3'}
              style={{ color: style.accent }}
              strokeWidth={2}
            />
            <span
              className={`whitespace-nowrap ${
                event.isHero ? 'text-[0.75rem] font-semibold' : 'text-caption font-medium'
              }`}
            >
              {event.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}
