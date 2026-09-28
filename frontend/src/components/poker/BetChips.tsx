// ──────────────────────────────────────────────
// BetChips — la apuesta de cada jugador sobre el
// tapete, entre su asiento y el centro (como en
// PokerStars o GGPoker).
//
// El importe se descompone en fichas de casino
// (1, 5, 25, 100, 500, 1000, 5000) apiladas en
// columnas: cuanto más se apuesta, más alta y
// ancha es la pila, así se lee el tamaño de la
// apuesta sin mirar el número.
//
// Animaciones:
//  · al apostar, las fichas nuevas salen del
//    asiento y aterrizan sobre la pila;
//  · al cerrar la calle, la pila se desliza al
//    bote (o al ganador, al acabar la mano) y se
//    desvanece.
// El mismo componente dibuja la pila del bote.
// Con "reducir movimiento" se omiten las dos.
// ──────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useChipFormat } from '@features/table/TableDisplayContext'

/** Punto de la mesa en porcentaje del contenedor (0..100). */
export interface TablePoint {
  left: number
  top: number
}

interface Denomination {
  value: number
  color: string
  stripe: string
}

/** Colores estándar de casino, de mayor a menor. */
const DENOMINATIONS: Denomination[] = [
  { value: 5000, color: '#ea580c', stripe: '#fed7aa' },
  { value: 1000, color: '#eab308', stripe: '#fef9c3' },
  { value: 500, color: '#7c3aed', stripe: '#ddd6fe' },
  { value: 100, color: '#1f2937', stripe: '#e5e7eb' },
  { value: 25, color: '#16a34a', stripe: '#dcfce7' },
  { value: 5, color: '#dc2626', stripe: '#fee2e2' },
  { value: 1, color: '#e5e7eb', stripe: '#3b82f6' },
]

/** Fichas por columna antes de empezar otra, y columnas como máximo. */
const MAX_PER_COLUMN = 8
const MAX_COLUMNS = 5
/** Las fichas de 5000 solo aparecen en botes grandes: 5000 en una sola ficha parecería poco. */
const BIG_CHIP_FROM = 20_000

export interface ChipColumn {
  denomination: Denomination
  count: number
}

/** Reparte un importe en columnas de fichas, de la denominación mayor a la menor. */
export function chipColumns(amount: number): ChipColumn[] {
  const columns: ChipColumn[] = []
  let rest = Math.max(0, Math.floor(amount))
  for (const denomination of DENOMINATIONS) {
    if (denomination.value === 5000 && amount < BIG_CHIP_FROM) continue
    let count = Math.floor(rest / denomination.value)
    rest -= count * denomination.value
    while (count > 0 && columns.length < MAX_COLUMNS) {
      const inColumn = Math.min(count, MAX_PER_COLUMN)
      columns.push({ denomination, count: inColumn })
      count -= inColumn
    }
  }
  return columns
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Una pila de fichas (sin importe). */
function ChipPile({ amount }: { amount: number }) {
  const columns = chipColumns(amount)
  return (
    <span className="bet-pile" aria-hidden>
      {columns.map((column, columnIndex) => (
        <span
          key={columnIndex}
          className="bet-column"
          style={{ '--chips': column.count } as CSSProperties}
        >
          {Array.from({ length: column.count }, (_, index) => (
            <span
              key={index}
              className="bet-chip"
              style={{
                '--chip': column.denomination.color,
                '--chip-stripe': column.denomination.stripe,
                '--i': index,
              } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </span>
  )
}

interface Flight {
  id: number
  amount: number
  kind: 'in' | 'out'
}

export interface BetChipsProps {
  /** Fichas de la pila (apuesta de la calle en curso, o el bote). */
  amount: number
  /** Dónde se dibuja la pila. */
  spot: TablePoint
  /** Origen de las fichas que se añaden: el asiento de quien apuesta. */
  from: TablePoint
  /** Destino cuando la pila se recoge: el bote, o el ganador al acabar la mano. */
  to: TablePoint
  /** Lado del importe respecto a la pila, o sin importe (la pila del bote). */
  amountSide?: 'left' | 'right' | 'none'
}

/**
 * Apuesta de un jugador en la mesa. Debe ir dentro del contenedor posicionado
 * de la mesa: los puntos son porcentajes de ese contenedor.
 */
export default function BetChips({ amount, spot, from, to, amountSide = 'right' }: BetChipsProps) {
  const formatChips = useChipFormat()
  // `shown` es lo que ya está en la pila; mientras vuelan fichas nuevas sigue
  // mostrando el importe anterior y se actualiza al aterrizar.
  const [shown, setShown] = useState(amount)
  const [flight, setFlight] = useState<Flight | null>(null)
  const latest = useRef(amount)
  const flightId = useRef(0)
  const flightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const before = latest.current
    latest.current = amount
    if (amount === before) return

    if (prefersReducedMotion()) {
      setShown(amount)
      setFlight(null)
      return
    }
    flightId.current += 1
    if (amount > before) {
      setFlight({ id: flightId.current, amount: amount - before, kind: 'in' })
    } else {
      // Fin de calle (o devolución de una apuesta no igualada): lo que había
      // se va al bote y la pila queda con el importe nuevo.
      setShown(amount)
      setFlight(amount === 0 ? { id: flightId.current, amount: before, kind: 'out' } : null)
    }
  }, [amount])

  useLayoutEffect(() => {
    if (!flight) return
    const element = flightRef.current
    const land = () => {
      setShown(latest.current)
      setFlight(current => (current?.id === flight.id ? null : current))
    }
    if (!element || typeof element.animate !== 'function') {
      land()
      return
    }

    // El envoltorio mide lo mismo que la mesa, así que un translate en % de
    // sí mismo equivale a moverse en % de la mesa.
    const toOrigin = `translate(${from.left - spot.left}%, ${from.top - spot.top}%)`
    const toTarget = `translate(${to.left - spot.left}%, ${to.top - spot.top}%)`
    const animation = flight.kind === 'in'
      ? element.animate(
          [
            { transform: `${toOrigin} scale(0.85)`, opacity: 0 },
            { opacity: 1, offset: 0.25 },
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          ],
          { duration: 380, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)' },
        )
      : element.animate(
          [
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { opacity: 1, offset: 0.7 },
            { transform: `${toTarget} scale(0.7)`, opacity: 0 },
          ],
          { duration: 750, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
        )
    animation.onfinish = land
    return () => {
      animation.onfinish = null
      animation.cancel()
    }
    // Solo se lanza por vuelo: las posiciones no cambian a mitad de una animación.
  }, [flight])

  const at = { left: `${spot.left}%`, top: `${spot.top}%` }

  return (
    <>
      {shown > 0 && (
        <div className="bet-spot" style={at}>
          <ChipPile amount={shown} />
          {amountSide !== 'none' && (
            <span className={`bet-amount bet-amount-${amountSide}`}>{formatChips(shown)}</span>
          )}
        </div>
      )}

      {flight && (
        <div ref={flightRef} className="absolute inset-0 pointer-events-none z-[15]">
          <div className="bet-spot" style={at}>
            <ChipPile amount={flight.amount} />
          </div>
        </div>
      )}
    </>
  )
}
