// ──────────────────────────────────────────────
// PokerTable — el tapete y la disposición de los
// asientos. Los asientos se colocan sobre una
// elipse por trigonometría, así el mismo componente
// sirve para 2, 3, 6 o 9 jugadores sin re-maquetar,
// y el héroe siempre queda abajo al centro.
//
// Encima del tapete van las dos capas de lectura
// rápida: los avisos de acción (TableFeed) y el
// cartel de resultado al cerrar la mano.
//
// La forma, los colores y el adorno del tapete los
// pone el estilo activo (features/table/themes.ts).
//
// En la esquina superior derecha, el engranaje de
// configuración (TableSettings): fichas o BB, avisos
// y estilo, compartidos por todas las mesas.
// ──────────────────────────────────────────────

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import {
  positionName,
  settledPot,
  type Card,
  type TableState,
} from '@poker/engine'
import PlayerSeat, { type DealerPlacement } from './PlayerSeat'
import PlayingCard from './PlayingCard'
import HandResultOverlay from './HandResultOverlay'
import BetChips, { type TablePoint } from './BetChips'
import { PotDisplay } from './TableChips'
import TableSettingsButton, { type TableSettingsExtra } from './TableSettings'
import { useActiveTableTheme } from '@features/table/TableThemeContext'
import { TableBlindProvider, useChipFormat, useTableDisplay } from '@features/table/TableDisplayContext'
import { OCTAGON_POINTS, shapeStyle, type TableTheme } from '@features/table/themes'

/**
 * Punto sobre la elipse de la mesa, en porcentaje del contenedor (0..100).
 * `turn` desplaza el ángulo (en radianes) para dejar algo al lado del asiento.
 */
function tablePoint(index: number, total: number, radiusX: number, radiusY: number, turn = 0): TablePoint {
  const angle = (Math.PI / 2) + (2 * Math.PI * index) / total + turn
  return {
    left: 50 + radiusX * Math.cos(angle),
    top: 50 + radiusY * Math.sin(angle),
  }
}

function seatPosition(index: number, total: number, radiusX: number, radiusY: number) {
  const point = tablePoint(index, total, radiusX, radiusY)
  return { left: `${point.left}%`, top: `${point.top}%` }
}

/** Radios de la elipse: asientos en el borde, apuestas a medio camino del centro. */
const SEAT_RADIUS = { x: 47, y: 41 }
const BET_RADIUS = { x: 33, y: 27 }
/** Donde se recogen las apuestas al cerrar la calle: el marcador del bote. */
const POT_POINT: TablePoint = { left: 50, top: 37 }
/** Pila del bote: a la izquierda del marcador, para no tapar el importe. */
const POT_CHIPS_POINT: TablePoint = { left: 39, top: 37 }

/**
 * El botón del dealer va pegado a la placa del BTN, en el lado que mira al
 * centro. En los asientos laterales se sube o se baja al borde de la placa
 * para apartarse de su apuesta; arriba y abajo (el héroe) se pega al borde
 * que mira al centro, del lado contrario a donde va la apuesta del héroe.
 */
function dealerPlacement(index: number, total: number): DealerPlacement {
  const angle = (Math.PI / 2) + (2 * Math.PI * index) / total
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  if (Math.abs(cos) < 0.2) return { side: sin > 0 ? 'left' : 'right', align: sin > 0 ? 'top' : 'bottom' }
  return { side: cos < 0 ? 'right' : 'left', align: sin < 0 ? 'top' : 'bottom' }
}

/**
 * Dónde van las fichas apostadas por el asiento visual `index`.
 * En la mitad superior se acercan un poco más al centro para no pegarse a
 * la placa del jugador. El héroe (abajo, índice 0) tiene cartas más grandes
 * justo encima de la placa: su apuesta se desplaza a un lado, entre sus
 * cartas y el board.
 */
function betPoint(index: number, total: number): TablePoint {
  if (index === 0) return tablePoint(0, total, BET_RADIUS.x, BET_RADIUS.y, -0.35)
  const upper = Math.sin((Math.PI / 2) + (2 * Math.PI * index) / total) < -0.01
  return tablePoint(index, total, BET_RADIUS.x, upper ? BET_RADIUS.y - 3 : BET_RADIUS.y)
}

/**
 * Barandilla y tapete con la forma, los colores y el adorno del estilo activo.
 * Las tres capas (barandilla, tapete, adorno) repiten la misma silueta; en el
 * octógono va recortada, así que la sombra se pinta como `drop-shadow`.
 */
export function TableFelt({ theme }: { theme: TableTheme }) {
  const shape = shapeStyle(theme.shape)
  const clipped = shape.clipPath !== undefined
  const neon = theme.feltMark === 'neon'

  return (
    <div
      className="absolute inset-[6%]"
      style={{
        filter: clipped
          ? `drop-shadow(0 18px 30px rgba(0,0,0,0.55))${neon ? ' drop-shadow(0 0 14px var(--poker-glow, var(--poker-gold)))' : ''}`
          : undefined,
      }}
    >
      <div
        className={`absolute inset-0 ${clipped ? '' : 'shadow-2xl'}`}
        style={{
          ...shape,
          background:
            'radial-gradient(ellipse at 50% 35%, var(--poker-rail) 0%, var(--poker-rail-edge) 100%)',
          boxShadow: !clipped && neon ? '0 0 26px -2px var(--poker-glow, var(--poker-gold))' : undefined,
        }}
      >
        {/* Costura de la barandilla acolchada. */}
        {theme.railStitch && (
          <Outline theme={theme} inset={1.8} color="rgba(255,255,255,0.15)" dashed />
        )}
        <div
          className={`absolute inset-[4%] ${clipped ? '' : 'border border-black/30'}`}
          style={{
            ...shape,
            background:
              'radial-gradient(ellipse at 50% 38%, var(--poker-felt) 0%, var(--poker-felt-edge) 100%)',
            boxShadow: clipped ? undefined : 'inset 0 6px 32px rgba(0,0,0,0.5)',
          }}
        >
          <FeltMark theme={theme} />
        </div>
      </div>
    </div>
  )
}

interface OutlineProps {
  theme: TableTheme
  /** Separación del borde de la capa, en %. */
  inset: number
  color: string
  width?: number
  dashed?: boolean
  glow?: string
}

/**
 * Contorno que sigue la silueta del tapete. En las formas redondeadas basta
 * un `border`; en el octógono el borde no sigue el recorte diagonal, así que
 * se dibuja el polígono en SVG con trazo de grosor fijo.
 */
function Outline({ theme, inset, color, width = 1, dashed = false, glow }: OutlineProps) {
  const shape = shapeStyle(theme.shape)
  const box = { inset: `${inset}%` }

  if (shape.clipPath !== undefined) {
    return (
      <svg
        className="absolute pointer-events-none overflow-visible"
        style={{ ...box, width: `${100 - 2 * inset}%`, height: `${100 - 2 * inset}%`, filter: glow }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points={OCTAGON_POINTS.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dashed ? '4 3' : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...box,
        ...shape,
        border: `${width}px ${dashed ? 'dashed' : 'solid'} ${color}`,
        filter: glow,
      }}
    />
  )
}

function FeltMark({ theme }: { theme: TableTheme }) {
  switch (theme.feltMark) {
    case 'line':
      return <Outline theme={theme} inset={9} color="rgba(255,255,255,0.06)" />
    case 'double':
      return (
        <>
          <Outline theme={theme} inset={7} color="color-mix(in srgb, var(--poker-gold) 30%, transparent)" />
          <Outline theme={theme} inset={9} color="color-mix(in srgb, var(--poker-gold) 16%, transparent)" />
        </>
      )
    case 'neon':
      return (
        <Outline
          theme={theme}
          inset={6}
          width={2}
          color="color-mix(in srgb, var(--poker-gold) 80%, transparent)"
          glow="drop-shadow(0 0 5px var(--poker-gold)) drop-shadow(0 0 10px var(--poker-gold))"
        />
      )
    case 'logo':
      return (
        <>
          <Outline theme={theme} inset={9} color="rgba(255,255,255,0.07)" />
          {/* Marca de agua en la mitad superior: el centro es del bote y el board. */}
          <span className="absolute left-1/2 top-[20%] -translate-x-1/2 select-none whitespace-nowrap text-mini sm:text-xs lg:text-sm font-black uppercase tracking-[0.5em] text-white/[0.09]">
            ♠ Poker ♠
          </span>
        </>
      )
    default:
      return null
  }
}

const STREET_LABELS: Record<string, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
  complete: 'Mano terminada',
}

export interface PokerTableProps {
  state: TableState
  heroId: string
  /** Segundos restantes del turno actual, normalizados 0..1. */
  timeLeft: number | null
  /** Enseña todas las cartas (showdown, repaso o modo estudio). */
  revealAll: boolean
  /** Fichas ganadas o perdidas por el estudiante en la mano terminada. */
  heroDelta?: number | null
  /**
   * Mesa más baja, para meterla dentro de otra vista (el modo explicativo de
   * las clases): sin la altura mínima pensada para jugar a pantalla completa.
   */
  compact?: boolean
  /**
   * Mesa para mirar, no para jugar (el modo explicativo): sin los avisos que
   * piden una decisión al estudiante ("tu turno", "te piden X para seguir").
   */
  spectator?: boolean
  /**
   * La mesa llena el contenedor (ancho y alto) en vez de usar alturas
   * mínimas propias: la mesa de práctica la encaja junto a los controles
   * para que todo quepa sin scroll. Asientos y centro escalan con el
   * tamaño real de la mesa, no con el de la ventana.
   */
  fit?: boolean
  /**
   * Engranaje de configuración. Por defecto muestra solo los ajustes
   * generales; una mesa puede añadir su propia pestaña (`{ title, content }`).
   * `false` lo oculta (la vista previa de la landing).
   */
  settings?: TableSettingsExtra | false
}

/**
 * Escala de asientos y centro en modo `fit`, según el tamaño real de la mesa.
 * Referencia: una mesa de ~820×470 px se ve a escala 1.
 */
function fitScaleFor(width: number, height: number): number {
  const scale = Math.min(width / 820, height / 470)
  return Math.min(1.3, Math.max(0.7, scale))
}

function useFitScale(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setScale(fitScaleFor(width, height))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return { ref, scale }
}

export default function PokerTable({
  state,
  heroId,
  timeLeft,
  revealAll,
  heroDelta = null,
  compact = false,
  spectator = false,
  fit = false,
  settings,
}: PokerTableProps) {
  const theme = useActiveTableTheme()
  const { prefs } = useTableDisplay()
  const formatChips = useChipFormat(state.config.bigBlind)
  const { ref: fitRef, scale: fitScale } = useFitScale(fit)
  const fitStyle: CSSProperties | undefined = fit ? { scale: String(fitScale) } : undefined
  // Las fichas (index.css, .poker-fit-box .bet-spot) leen la escala de aquí.
  const fitBoxStyle = fit ? ({ '--table-scale': fitScale } as CSSProperties) : undefined
  const seats = state.players.length
  const heroSeat = state.players.find(p => p.id === heroId)?.seat ?? 0
  const outcome = state.outcome
  const showdownById = new Map(outcome?.showdown.map(entry => [entry.playerId, entry]) ?? [])
  const winnerIds = new Set(outcome?.shares.map(share => share.playerId) ?? [])

  /** Índice visual: el héroe ocupa siempre la posición inferior central. */
  const displayIndex = (seat: number) => (seat - heroSeat + seats) % seats

  // Al acabar la mano las fichas (apuestas y bote) se empujan al ganador;
  // mientras tanto, cada calle se recoge en el bote.
  const handOver = state.street === 'complete' && !!outcome
  const winner = state.players.find(player => winnerIds.has(player.id))
  const collectTo = handOver && winner
    ? tablePoint(displayIndex(winner.seat), seats, SEAT_RADIUS.x, SEAT_RADIUS.y)
    : POT_POINT


  // Lo que le costaría al estudiante seguir en la mano: el número que más se
  // busca y el que antes no aparecía en ningún sitio de la mesa.
  const hero = state.players.find(player => player.id === heroId)
  const toCall = hero ? Math.max(0, Math.min(state.currentBet - hero.committed, hero.stack)) : 0

  return (
    // En compacto los asientos y el centro conservan su tamaño en rem pero la
    // mesa es más estrecha: se les deja margen alrededor y se encogen un poco.
    // En `fit` el contenedor manda: la mesa ocupa todo el hueco con una
    // proporción acotada (ver .poker-fit en index.css) y el margen deja
    // sitio a las placas de los asientos, que sobresalen del tapete.
    <TableBlindProvider bigBlind={state.config.bigBlind}>
    <div
      className={
        fit
          ? 'poker-fit h-full w-full px-8 pt-9 pb-12 sm:px-12 sm:pt-10 sm:pb-14'
          : compact
            ? 'px-12 pt-10 pb-14 sm:px-16 sm:pt-12 sm:pb-16'
            : 'px-1 sm:px-2 py-4 sm:py-6 lg:py-8'
      }
    >
      <div
        ref={fitRef}
        style={fitBoxStyle}
        className={`relative mx-auto ${
          fit
            ? 'poker-fit-box'
            : compact
            ? 'aspect-[4/3] sm:aspect-[16/10] min-h-[20rem] sm:min-h-[22rem] lg:min-h-[24rem] max-w-[48rem]'
            : 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] max-h-[62vh] sm:max-h-[68vh] lg:max-h-[78vh] xl:max-h-[82vh] min-h-[21.25rem] sm:min-h-[26.875rem] lg:min-h-[32.5rem] xl:min-h-[36.25rem] max-w-[45rem] sm:max-w-[51.25rem] lg:max-w-[61.25rem] xl:max-w-[68.75rem] 2xl:max-w-[75rem]'
        }`}
      >
      {/* ── Barandilla y tapete ── */}
      <TableFelt theme={theme} />

      {/* ── Calle en curso ── */}
      <span
        style={fit ? { scale: String(Math.min(1, fitScale)) } : undefined}
        className="absolute top-2 left-2 lg:top-3 lg:left-3 z-30 origin-top-left rounded-md bg-black/45 px-2 py-0.5 text-mini sm:text-caption lg:text-xs font-semibold uppercase tracking-wider text-white/70 backdrop-blur-sm">
        {STREET_LABELS[state.street] ?? state.street}
        {!spectator && ` · mano #${state.handNumber}`}
      </span>

      {/* ── Configuración (fichas/BB, avisos, estilo…) ── */}
      {settings !== false && (
        <div
          style={fit ? { scale: String(Math.min(1, fitScale)) } : undefined}
          className="absolute top-2 right-2 lg:top-3 lg:right-3 z-30 origin-top-right"
        >
          <TableSettingsButton bigBlind={state.config.bigBlind} extra={settings || undefined} />
        </div>
      )}

      {/* ── Centro: bote y cartas comunitarias ── */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none px-2">
        <div
          className={`flex flex-col items-center gap-2 sm:gap-3 origin-center ${
            fit ? '' : compact ? 'scale-[0.7] sm:scale-[0.85]' : 'lg:gap-4 scale-[0.85] sm:scale-100 lg:scale-110 xl:scale-125'
          }`}
          style={fitStyle}
        >
          <PotDisplay
            main={settledPot(state)}
            pending={state.players.reduce((sum, p) => sum + p.committed, 0)}
          />

          {/* Cuánto cuesta seguir: solo mientras haya algo que pagar. */}
          {!spectator && prefs.showToCall && toCall > 0 && state.street !== 'complete' && !(fit && fitScale < 0.85) && (
            <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2 sm:px-2.5 py-0.5 text-mini sm:text-caption font-semibold text-sky-200 max-w-[90%] truncate">
              Te piden {formatChips(toCall)} para seguir
            </span>
          )}

          <div className="flex gap-1 sm:gap-1.5 lg:gap-2">
            {Array.from({ length: 5 }, (_, index) => {
              const card: Card | undefined = state.board[index]
              return card === undefined ? (
                <span
                  key={index}
                  className={`${
                    fit
                      ? 'w-12 h-[4.375rem] rounded-lg'
                      : 'w-9 h-[3.375rem] sm:w-11 sm:h-[4.125rem] lg:w-14 lg:h-[5.125rem] xl:w-16 xl:h-[5.875rem] rounded-md sm:rounded-lg'
                  } border border-white/[0.07] bg-black/10`}
                />
              ) : (
                <span
                  key={index}
                  className={fit ? '' : 'scale-[0.8] sm:scale-95 lg:scale-110 xl:scale-125 origin-center -mx-1 sm:mx-0 lg:mx-0.5'}
                >
                  <PlayingCard card={card} size="md" />
                </span>
              )
            })}
          </div>

          {outcome && outcome.showdown.length > 0 && (
            <span className="text-caption text-white/70 px-2 py-0.5 rounded bg-black/40">
              {outcome.showdown
                .filter(entry => winnerIds.has(entry.playerId))
                .map(entry => entry.description)
                .join(' · ')}
            </span>
          )}
        </div>
      </div>

      {/* ── Fichas del bote: crecen al recoger cada calle y van al ganador ── */}
      <BetChips
        amount={handOver ? 0 : settledPot(state)}
        spot={POT_CHIPS_POINT}
        from={POT_CHIPS_POINT}
        to={collectTo}
        amountSide="none"
      />

      {/* ── Apuestas de la calle en curso, sobre el tapete ──
          El importe va hacia el centro (el lado exterior lo ocupa la placa
          del asiento); el del héroe, a la derecha, lejos de sus cartas. */}
      {state.players.map(player => {
        const index = displayIndex(player.seat)
        const spot = betPoint(index, seats)
        return (
          <BetChips
            key={player.id}
            amount={handOver ? 0 : player.committed}
            spot={spot}
            from={tablePoint(index, seats, SEAT_RADIUS.x, SEAT_RADIUS.y)}
            to={collectTo}
            amountSide={index !== 0 && spot.left > 55 ? 'left' : 'right'}
          />
        )
      })}

      {/* ── Asientos ── */}
      {state.players.map(player => {
        const index = displayIndex(player.seat)
        const entry = showdownById.get(player.id)
        return (
          <div
            key={player.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 origin-center ${
              fit ? '' : compact ? 'scale-[0.8] sm:scale-90' : 'scale-90 sm:scale-100 lg:scale-110'
            }`}
            style={{ ...seatPosition(index, seats, SEAT_RADIUS.x, SEAT_RADIUS.y), ...fitStyle }}
          >
            <PlayerSeat
              player={player}
              position={positionName(state, player.seat)}
              isActing={state.actingSeat === player.seat}
              isHero={player.id === heroId}
              spectator={spectator}
              reveal={revealAll || (!!outcome && !outcome.uncontested && !!entry)}
              winningCards={winnerIds.has(player.id) ? entry?.bestCards : undefined}
              isWinner={winnerIds.has(player.id)}
              won={player.won}
              timeLeft={state.actingSeat === player.seat ? timeLeft : null}
              dealer={player.seat === state.buttonSeat ? dealerPlacement(index, seats) : null}
            />
          </div>
        )
      })}

      {/* ── Resultado de la mano ── */}
      <HandResultOverlay state={state} heroId={heroId} delta={heroDelta} />
      </div>
    </div>
    </TableBlindProvider>
  )
}
