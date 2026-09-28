// ──────────────────────────────────────────────
// PlayerSeat — un asiento de la mesa.
// Muestra lo mínimo que hace falta para leer la
// acción: nombre, stack, posición, cartas, última
// acción y el temporizador de turno. El perfil del
// bot se muestra siempre: el objetivo didáctico es
// que el estudiante ajuste su juego al rival.
//
// La última acción va con color propio (subida en
// naranja, retirada en gris…) porque leer "Sube 300"
// en blanco sobre negro no transmite que acaba de
// pasar algo importante.
// ──────────────────────────────────────────────

import { BOT_PROFILES, type Player } from '@poker/engine'
import type { Card } from '@poker/engine'
import PlayingCard from './PlayingCard'
import PositionBadge from './PositionBadge'
import { DealerButton } from './TableChips'
import { useChipFormat } from '@features/table/TableDisplayContext'

interface ActionStyle {
  label: string
  bg: string
  color: string
  border: string
}

const ACTION_STYLES: Record<string, ActionStyle> = {
  fold: { label: 'Se retira', bg: 'rgba(100,116,139,0.25)', color: '#cbd5e1', border: 'rgba(148,163,184,0.4)' },
  check: { label: 'Pasa', bg: 'rgba(148,163,184,0.2)', color: '#e2e8f0', border: 'rgba(148,163,184,0.45)' },
  call: { label: 'Iguala', bg: 'rgba(56,189,248,0.2)', color: '#7dd3fc', border: 'rgba(56,189,248,0.5)' },
  bet: { label: 'Apuesta', bg: 'rgba(245,158,11,0.22)', color: '#fcd34d', border: 'rgba(245,158,11,0.55)' },
  raise: { label: 'Sube a', bg: 'rgba(249,115,22,0.25)', color: '#fdba74', border: 'rgba(249,115,22,0.6)' },
}

export interface PlayerSeatProps {
  player: Player
  /** Posición en la mesa (BTN, SB, BB, UTG…). */
  position: string
  isActing: boolean
  isHero: boolean
  /** Muestra las cartas boca arriba (showdown o modo estudio). */
  reveal: boolean
  /** Cartas que forman su mejor mano, para resaltarlas en el showdown. */
  winningCards?: readonly Card[]
  /** Ganó el último bote. */
  isWinner: boolean
  /** Fichas ganadas en la mano que acaba de terminar. */
  won?: number
  /** Fracción de tiempo restante del turno (0..1); null si no aplica. */
  timeLeft: number | null
  /** Si es el dealer, dónde va el botón "D" respecto a la placa. */
  dealer?: DealerPlacement | null
  /** Mesa de demostración: sin el aviso "TU TURNO". */
  spectator?: boolean
}

/**
 * Lado de la placa donde va el botón del dealer (hacia el centro de la mesa)
 * y a qué altura (lejos de la apuesta del jugador).
 */
export interface DealerPlacement {
  side: 'left' | 'right'
  align: 'top' | 'center' | 'bottom'
}

const DEALER_SIDE = { left: 'right-full mr-1.5', right: 'left-full ml-1.5' }
const DEALER_ALIGN = {
  top: 'top-0 -translate-y-1/2',
  center: 'top-1/2 -translate-y-1/2',
  bottom: 'bottom-0 translate-y-1/2',
}

export default function PlayerSeat({
  player,
  position,
  isActing,
  isHero,
  reveal,
  winningCards,
  isWinner,
  won,
  timeLeft,
  dealer = null,
  spectator = false,
}: PlayerSeatProps) {
  const formatChips = useChipFormat()
  const folded = player.status === 'folded'
  const out = player.status === 'out'
  const profile = player.botProfile ? BOT_PROFILES[player.botProfile] : null
  const accent = isHero ? 'var(--poker-gold)' : (profile?.accent ?? 'var(--border-active)')
  const highlight = winningCards ? new Set(winningCards) : null
  const action = player.lastAction ? ACTION_STYLES[player.lastAction.type] : null

  return (
    <div
      className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
        folded || out ? 'opacity-35' : 'opacity-100'
      }`}
    >
      {/* ── Fichas ganadas ── */}
      {isWinner && (won ?? 0) > 0 && (
        <span
          className="animate-chip-pop rounded-full px-1.5 sm:px-2 py-0.5 text-mini sm:text-caption font-bold text-black shadow-lg"
          style={{ background: 'var(--poker-gold)' }}
        >
          +{formatChips(won ?? 0)}
        </span>
      )}

      {/* ── Cartas privadas ── */}
      <div className="flex -space-x-1.5 sm:-space-x-2 scale-[0.85] sm:scale-100 lg:scale-105 origin-bottom">
        {player.holeCards.length > 0 && !out ? (
          player.holeCards.map((card, index) => (
            <PlayingCard
              key={`${card}-${index}`}
              card={card}
              faceDown={!reveal && !isHero}
              size={isHero ? 'sm' : 'xs'}
              highlighted={highlight ? highlight.has(card) : false}
              dimmed={folded}
              className={index === 1 ? 'rotate-[4deg]' : '-rotate-[4deg]'}
            />
          ))
        ) : (
          <div className={isHero ? 'h-[3.25rem]' : 'h-10'} />
        )}
      </div>

      {/* ── Placa del jugador ── */}
      <div
        className={`relative min-w-[5.5rem] sm:min-w-[6.5625rem] lg:min-w-[7.375rem] xl:min-w-[8.5rem] rounded-lg sm:rounded-xl border px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-center shadow-lg transition-all duration-200 ${
          isActing ? 'scale-105 animate-acting-pulse' : ''
        } ${isWinner ? 'ring-2 ring-[var(--poker-gold)] animate-winner-glow' : ''}`}
        style={{
          background: 'var(--poker-seat-bg, rgba(12, 14, 18, 0.88))',
          borderColor: isActing ? 'var(--poker-gold)' : accent,
        }}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: accent }}
            aria-hidden
          />
          <span className="text-mini sm:text-caption xl:text-xs font-semibold text-white truncate max-w-[3.75rem] sm:max-w-[4.625rem] xl:max-w-[5.5rem]">
            {player.name}
          </span>
        </div>

        <div className="mt-0.5 flex justify-center scale-[0.9] sm:scale-100">
          <PositionBadge position={position} size={isHero ? 'md' : 'sm'} emphasis={isHero} />
        </div>

        <div className="text-caption sm:text-[0.8125rem] xl:text-sm font-bold tabular-nums" style={{ color: 'var(--poker-gold)' }}>
          {player.status === 'allin' ? 'ALL-IN' : formatChips(player.stack)}
        </div>

        {profile && (
          <div className="text-nano sm:text-micro text-white/45 truncate">{profile.id.toUpperCase()}</div>
        )}

        {dealer && (
          <DealerButton className={`absolute z-10 ${DEALER_SIDE[dealer.side]} ${DEALER_ALIGN[dealer.align]}`} />
        )}

        {/* ── Barra de tiempo de turno ── */}
        {isActing && timeLeft !== null && (
          <span className="absolute left-1 right-1 -bottom-[3px] h-[3px] rounded-full bg-white/10 overflow-hidden">
            <span
              className="block h-full rounded-full transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.max(0, timeLeft) * 100}%`, background: 'var(--poker-gold)' }}
            />
          </span>
        )}

        {/* El turno del estudiante se marca en el propio asiento: mirando las
            cartas propias es donde antes se perdía el aviso. */}
        {isActing && isHero && !spectator && (
          <span
            className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-[1px] text-micro font-bold text-black whitespace-nowrap"
            style={{ background: 'var(--poker-gold)' }}
          >
            TU TURNO
          </span>
        )}
      </div>

      {/* ── Última acción ── */}
      {action && !out && (
        <span
          className="animate-chip-pop rounded-md border px-1.5 py-0.5 text-mini font-semibold"
          style={{ background: action.bg, color: action.color, borderColor: action.border }}
        >
          {action.label}
          {player.lastAction?.amount ? ` ${formatChips(player.lastAction.amount)}` : ''}
        </span>
      )}
    </div>
  )
}
