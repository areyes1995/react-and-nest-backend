// ──────────────────────────────────────────────
// PositionStrip — el orden de acción de la mano.
// La posición se entiende viéndola en fila, no
// adivinándola en un óvalo: aquí están los jugadores
// desde el botón, con el que actúa marcado y el
// estudiante resaltado. Debajo, qué significa estar
// donde está.
// ──────────────────────────────────────────────

import { positionName, type TableState } from '@poker/engine'
import { positionMeta } from '@features/table/positions'

export interface PositionStripProps {
  state: TableState
  heroId: string
  className?: string
}

export default function PositionStrip({ state, heroId, className = '' }: PositionStripProps) {
  // Orden real de la mano: desde el botón, saltando a quien ya no juega.
  const seats = state.players
    .filter(player => player.status !== 'out')
    .map(player => ({ player, position: positionName(state, player.seat) }))
    .sort((a, b) => {
      const meta = (label: string) => positionMeta(label)?.quality ?? 0
      return meta(b.position) - meta(a.position)
    })

  const hero = seats.find(entry => entry.player.id === heroId)
  const heroMeta = hero ? positionMeta(hero.position) : null

  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-mini font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Posiciones
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {seats.map(({ player, position }) => {
            const meta = positionMeta(position)
            const isHero = player.id === heroId
            const isActing = state.actingSeat === player.seat
            const folded = player.status === 'folded'

            return (
              <span
                key={player.id}
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-mini transition ${
                  folded ? 'opacity-40' : ''
                } ${isActing ? 'ring-1 ring-[var(--poker-gold)]' : ''}`}
                style={{
                  background: isHero ? `${meta?.color ?? '#888'}26` : 'var(--bg-surface)',
                  color: isHero ? meta?.color : 'var(--text-secondary)',
                }}
                title={meta ? `${meta.name} — ${meta.hint}` : position}
              >
                <span className="font-bold uppercase" style={{ color: meta?.color }}>
                  {position}
                </span>
                <span className="max-w-[4.5rem] truncate">{isHero ? 'Tú' : player.name}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Qué implica la posición del estudiante en esta mano concreta. */}
      {heroMeta && (
        <p className="mt-1.5 text-caption leading-snug text-[var(--text-muted)]">
          <span className="font-semibold" style={{ color: heroMeta.color }}>
            {heroMeta.name}:
          </span>{' '}
          {heroMeta.hint}
        </p>
      )}
    </div>
  )
}
