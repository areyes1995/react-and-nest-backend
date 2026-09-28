// ──────────────────────────────────────────────
// EquityTableView — la calculadora sobre la mesa.
// El héroe se sienta abajo; los rivales enseñan el
// dorso salvo que se marquen visibles o se llegue
// al showdown. En el centro, el board de la calle
// en curso y la equity del héroe.
// ──────────────────────────────────────────────

import type { Card } from '@poker/engine'
import { TableFelt } from '@components/poker'
import { TableThemeScope, useActiveTableTheme } from '@features/table/TableThemeContext'
import { BOARD_COUNT, STREET_LABELS, type EquityStreet } from '@features/tools/equityTable'
import CardSlot from './CardSlot'
import type { SeatInfo } from './types'

interface EquityTableViewProps {
  seats: SeatInfo[]
  board: Card[]
  street: EquityStreet
  /** Hay un cálculo en marcha: los números visibles son de antes. */
  calculating: boolean
  /** Rivales en la mano cuyas cartas no se ven. */
  hiddenRivals: number
}

/** Radios de la elipse donde van los asientos (en % del contenedor). */
const SEAT_RADIUS = { x: 43, y: 39 }

function seatPoint(index: number, total: number) {
  const angle = Math.PI / 2 + (2 * Math.PI * index) / total
  return {
    left: `${50 + SEAT_RADIUS.x * Math.cos(angle)}%`,
    top: `${50 + SEAT_RADIUS.y * Math.sin(angle)}%`,
  }
}

export default function EquityTableView(props: EquityTableViewProps) {
  return (
    <TableThemeScope>
      <Table {...props} />
    </TableThemeScope>
  )
}

function Table({ seats, board, street, calculating, hiddenRivals }: EquityTableViewProps) {
  const theme = useActiveTableTheme()
  const heroIndex = Math.max(0, seats.findIndex(info => info.isHero))
  const hero = seats[heroIndex]
  const visibleBoard = BOARD_COUNT[street]

  return (
    <div className="px-2 pt-8 pb-12 sm:px-10 sm:pt-9 sm:pb-12">
      <div className="relative mx-auto w-full sm:w-[min(100%,calc((96dvh_-_15rem)*16/9))] max-w-[56rem] aspect-[4/3] sm:aspect-[16/9] min-h-[17rem]">
        <TableFelt theme={theme} />

        <span className="absolute top-[8%] left-1/2 -translate-x-1/2 z-10 rounded-md bg-black/45 px-3 py-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm">
          {STREET_LABELS[street]}
        </span>

        {/* ── Centro: board y equity del héroe ── */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="flex gap-1 sm:gap-1.5 rounded-xl p-1.5">
              {Array.from({ length: 5 }, (_, index) => {
                const card = index < visibleBoard ? board[index] : undefined
                return (
                  <CardSlot
                    key={index}
                    card={card}
                    size="md"
                    hint={index < 3 ? 'Flop' : index === 3 ? 'Turn' : 'River'}
                  />
                )
              })}
            </div>

            {hero?.result && !hero.seat.folded && (
              <div
                className={`rounded-2xl bg-black/50 px-4 py-1.5 text-center backdrop-blur-sm transition-opacity ${
                  calculating ? 'opacity-50' : ''
                }`}
              >
                <span className="text-xs uppercase tracking-wider text-white/70">Tu equity </span>
                <span className="text-lg sm:text-xl font-extrabold tabular-nums text-[var(--poker-gold)]">
                  {(hero.result.equity * 100).toFixed(1)}%
                </span>
                {hiddenRivals > 0 && (
                  <span className="block text-[0.6875rem] text-white/60">
                    vs {hiddenRivals === 1 ? '1 mano oculta' : `${hiddenRivals} manos ocultas`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Asientos ── */}
        {seats.map((info, index) => {
          const display = (index - heroIndex + seats.length) % seats.length
          const point = seatPoint(display, seats.length)
          const { seat, label, isHero, shown, result, winner, handName } = info
          const cardSize = isHero ? 'md' : 'sm'

          return (
            <div
              key={seat.id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 scale-[0.72] sm:scale-90 lg:scale-100"
              style={point}
            >
              <div className={`flex flex-col items-center gap-1 ${seat.folded ? 'opacity-40' : ''}`}>
                <div className="flex gap-1">
                  {[0, 1].map(i => (
                    <CardSlot
                      key={i}
                      card={seat.cards[i]}
                      size={cardSize}
                      faceDown={!shown}
                    />
                  ))}
                </div>
                <div
                  className={`min-w-[5.5rem] rounded-lg border px-2.5 py-1 text-center shadow-lg ${
                    winner
                      ? 'border-emerald-400 bg-emerald-950/90'
                      : isHero
                        ? 'border-[var(--poker-gold)]/70 bg-black/75'
                        : 'border-white/15 bg-black/70'
                  }`}
                >
                  <p className="text-sm font-bold leading-tight text-white">
                    {label}
                    {isHero && <span className="ml-1 text-[var(--poker-gold)]">· Tú</span>}
                  </p>
                  <p
                    className={`text-xs font-semibold tabular-nums leading-tight text-white/75 transition-opacity ${
                      calculating ? 'opacity-50' : ''
                    }`}
                  >
                    {seat.folded
                      ? 'Fuera'
                      : result && (isHero || shown)
                        ? `${(result.equity * 100).toFixed(1)}%`
                        : seat.cards.length === 0 && shown
                          ? 'Aleatoria'
                          : '?'}
                  </p>
                  {handName && shown && (
                    <p className="max-w-[7.5rem] truncate text-[0.6875rem] leading-tight text-emerald-300">{handName}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
