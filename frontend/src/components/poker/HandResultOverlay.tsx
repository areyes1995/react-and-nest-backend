// ──────────────────────────────────────────────
// HandResultOverlay — el veredicto de la mano.
// Antes había que deducir si habías ganado mirando
// el stack. Ahora la mesa lo dice: cartel central con
// el resultado, cuánto ha cambiado tu stack y con qué
// mano se ganó. Es el momento del que más se aprende,
// así que no puede pasar desapercibido.
// ──────────────────────────────────────────────

import { Minus, TrendingDown, Trophy } from 'lucide-react'
import type { TableState } from '@poker/engine'
import { useChipFormat } from '@features/table/TableDisplayContext'

export interface HandResultOverlayProps {
  state: TableState
  heroId: string
  /** Fichas ganadas o perdidas por el estudiante en esta mano. */
  delta: number | null
}

export default function HandResultOverlay({ state, heroId, delta }: HandResultOverlayProps) {
  const formatChips = useChipFormat()
  const outcome = state.outcome
  if (!outcome || state.street !== 'complete') return null

  const hero = state.players.find(player => player.id === heroId)
  const heroWon = (hero?.won ?? 0) > 0
  const net = delta ?? 0

  const winners = outcome.shares
    .map(share => state.players.find(player => player.id === share.playerId)?.name)
    .filter((name): name is string => Boolean(name))

  // Con qué mano se ganó: la lección de la mano está casi siempre aquí.
  const winningIds = new Set(outcome.shares.map(share => share.playerId))
  const description = outcome.showdown.find(entry => winningIds.has(entry.playerId))?.description

  const tone = heroWon
    ? { border: 'var(--poker-gold)', text: 'text-[var(--poker-gold)]', Icon: Trophy }
    : net < 0
      ? { border: '#ef4444', text: 'text-red-400', Icon: TrendingDown }
      : { border: 'rgba(255,255,255,0.25)', text: 'text-white/70', Icon: Minus }

  const title = heroWon
    ? `Ganas ${formatChips(hero?.won ?? 0)}`
    : net < 0
      ? `Pierdes ${formatChips(Math.abs(net))}`
      : 'Mano terminada'

  const subtitle = heroWon
    ? description ?? 'Los rivales se retiraron'
    : winners.length > 0
      ? `Gana ${winners.join(' y ')}${description ? ` · ${description}` : ''}`
      : 'Sin showdown'

  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
      <div
        className="animate-result-in flex flex-col items-center gap-1 rounded-2xl border-2 px-6 py-4 text-center shadow-2xl backdrop-blur-md"
        style={{ background: 'rgba(8, 10, 14, 0.9)', borderColor: tone.border }}
        role="status"
      >
        <tone.Icon className={`w-6 h-6 ${tone.text}`} strokeWidth={2} />
        <p className={`text-lg font-bold ${tone.text}`}>{title}</p>
        <p className="max-w-[16.25rem] text-caption leading-snug text-white/70">{subtitle}</p>
        {hero && (
          <p className="mt-0.5 text-caption text-white/50 tabular-nums">
            Tu stack: <span className="font-semibold text-white">{formatChips(hero.stack)}</span>
            {net !== 0 && (
              <span className={net > 0 ? 'text-emerald-400' : 'text-red-400'}>
                {' '}
                ({net > 0 ? '+' : ''}
                {formatChips(net)})
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
