// ──────────────────────────────────────────────
// Rangos preflop — las tablas de la arquitectura
// preflop que enseñan las clases y corrigen los
// entrenamientos.
//
// Son rangos de referencia para 6-max a 100 ciegas.
// Los de open salen de la herramienta de rangos (con
// frecuencias) y aquí se simplifican: una mano está
// dentro si se abre al menos la mitad de las veces.
// El objetivo es interiorizar la forma del rango.
// ──────────────────────────────────────────────

import { positionName, type TableState } from '@poker/engine'
import { OPENING_RANGES, parseRange } from '@features/tools/ranges'

const RANKS = '23456789TJQKA'

function rankIndex(label: string): number {
  const index = RANKS.indexOf(label)
  if (index < 0) throw new Error(`Rango preflop: carta desconocida «${label}»`)
  return index
}

function pair(index: number): string {
  return RANKS[index] + RANKS[index]
}

/**
 * Expande la notación estándar de rangos a manos concretas.
 * Admite `TT+`, `22-99`, `A2s+`, `A5s-A2s`, `AJo+` y manos sueltas (`KQs`, `77`).
 */
export function expandRange(spec: string): Set<string> {
  const hands = new Set<string>()

  for (const raw of spec.split(',')) {
    const token = raw.trim()
    if (!token) continue

    const [from, to] = token.split('-')
    const plus = from.endsWith('+')
    const hand = plus ? from.slice(0, -1) : from
    const high = rankIndex(hand[0])
    const low = rankIndex(hand[1])
    const suffix = hand.slice(2)

    if (high === low) {
      // Parejas: `TT+` sube hasta ases; `22-99` es un tramo cerrado.
      const end = plus ? RANKS.length - 1 : to ? rankIndex(to[0]) : high
      for (let i = Math.min(high, end); i <= Math.max(high, end); i++) hands.add(pair(i))
      continue
    }

    // No parejas: la carta alta queda fija y la baja recorre el tramo.
    const end = plus ? high - 1 : to ? rankIndex(to[1]) : low
    for (let i = Math.min(low, end); i <= Math.max(low, end); i++) {
      hands.add(RANKS[high] + RANKS[i] + suffix)
    }
  }

  return hands
}

/** Combinaciones de una mano: 6 una pareja, 4 una suited, 12 una offsuit. */
export function handCombos(hand: string): number {
  if (hand.length === 2) return 6
  return hand.endsWith('s') ? 4 : 12
}

/** Porcentaje de las 1326 combinaciones iniciales que cubre un rango. */
export function rangePercent(range: Set<string>): number {
  let combos = 0
  for (const hand of range) combos += handCombos(hand)
  return combos / 1326
}

export function unionRanges(...ranges: Set<string>[]): Set<string> {
  return new Set(ranges.flatMap(range => [...range]))
}

// ── Open raise (RFI) ──────────────────────────

export type OpenPosition = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB'

/** Id de cada posición en los rangos con frecuencias de la herramienta. */
const TOOL_POSITION: Record<OpenPosition, string> = {
  UTG: 'utg',
  HJ: 'mp',
  CO: 'co',
  BTN: 'btn',
  SB: 'sb',
}

/**
 * Una mano "se abre" si su frecuencia en la solución es de al menos el 50%.
 * Los rangos vienen de la herramienta de rangos (con frecuencias), así la
 * tabla que ve el estudiante, el reparto de manos y la corrección del coach
 * dicen siempre lo mismo.
 */
export const OPEN_THRESHOLD = 50

function openRangeFromTool(position: OpenPosition): Set<string> {
  const source = OPENING_RANGES.find(item => item.id === TOOL_POSITION[position])
  if (!source) throw new Error(`Rango de open desconocido: ${position}`)
  const hands = new Set<string>()
  for (const [hand, weight] of parseRange(source.range)) {
    if (weight >= OPEN_THRESHOLD) hands.add(hand)
  }
  return hands
}

export const OPEN_RANGES: Record<OpenPosition, Set<string>> = {
  UTG: openRangeFromTool('UTG'),
  HJ: openRangeFromTool('HJ'),
  CO: openRangeFromTool('CO'),
  BTN: openRangeFromTool('BTN'),
  SB: openRangeFromTool('SB'),
}

/**
 * Rango de open de una etiqueta del motor. La posición media de las mesas
 * de 9 se trata como UTG: tiene aún más jugadores detrás.
 */
export function openRangeFor(position: string): Set<string> | null {
  if (position === 'MP') return OPEN_RANGES.UTG
  return OPEN_RANGES[position as OpenPosition] ?? null
}

// ── Contra un open ────────────────────────────

/** Desde dónde abrió el rival, agrupado como lo agrupan las tablas. */
export type OpenerGroup = 'EP' | 'HJ' | 'CO' | 'BTN' | 'SB'

export function openerGroup(position: string): OpenerGroup {
  if (position === 'HJ' || position === 'CO' || position === 'BTN' || position === 'SB') return position
  return 'EP'
}

/** Un grupo más temprano: lo que se defiende contra un open más grande. */
const TIGHTER: Record<OpenerGroup, OpenerGroup> = {
  SB: 'BTN',
  BTN: 'CO',
  CO: 'HJ',
  HJ: 'EP',
  EP: 'EP',
}

export function tighterGroup(group: OpenerGroup): OpenerGroup {
  return TIGHTER[group]
}

/** Defensa de la ciega grande: rango total que continúa y la parte que hace 3-bet. */
export const BB_DEFENSE_SPECS: Record<OpenerGroup, { defend: string; threeBet: string }> = {
  EP: {
    defend: '22+, A2s+, K6s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, ATo+, KJo+, QJo',
    threeBet: 'QQ+, AKs, AKo, A5s',
  },
  HJ: {
    defend: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A9o+, KTo+, QTo+, JTo',
    threeBet: 'JJ+, AQs+, AKo, A5s-A4s, KQs',
  },
  CO: {
    defend: '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A5o+, K9o+, Q9o+, J9o+, T9o',
    threeBet: 'TT+, AJs+, AQo+, KQs, A5s-A3s, K9s, Q9s, 76s',
  },
  BTN: {
    defend: '22+, A2s+, K2s+, Q2s+, J4s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K5o+, Q8o+, J8o+, T8o+, 97o+, 87o, 76o',
    threeBet: '99+, ATs+, KJs+, AJo+, KQo, A5s-A2s, K8s, Q9s, J9s, T8s, 65s',
  },
  SB: {
    defend: '22+, A2s+, K2s+, Q2s+, J2s+, T5s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K4o+, Q7o+, J7o+, T7o+, 97o+, 87o, 76o',
    threeBet: '88+, A8s+, KTs+, QJs, ATo+, KJo+, A5s-A2s, K5s, Q8s, J8s, 64s',
  },
}

/** 3-bet desde la ciega pequeña: sin rango de pago, se juega 3-bet o fold. */
export const SB_3BET_SPECS: Record<Exclude<OpenerGroup, 'SB'>, string> = {
  EP: 'JJ+, AQs+, AKo, A5s',
  HJ: 'TT+, AJs+, KQs, AQo+, A5s-A4s',
  CO: '99+, ATs+, KJs+, QJs, AQo+, A5s-A3s, K9s',
  BTN: '88+, A9s+, KTs+, QJs, JTs, AJo+, KQo, A5s-A2s, K9s, 76s, 65s',
}

/** Cold call y 3-bet desde HJ, CO y botón: siempre en posición contra el que abrió. */
export const COLD_SPECS: Record<Exclude<OpenerGroup, 'SB' | 'BTN'>, { call: string; threeBet: string }> = {
  EP: {
    call: '22-JJ, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo',
    threeBet: 'QQ+, AKs, AKo, A5s-A4s',
  },
  HJ: {
    call: '22-TT, AJs-ATs, KJs, KTs, QJs, QTs, JTs, T9s, 98s, 87s',
    threeBet: 'JJ+, AQs+, AQo+, KQs, A5s-A3s, K9s',
  },
  CO: {
    call: '22-99, ATs, KTs, QTs, JTs, T9s, 98s, 87s',
    threeBet: 'TT+, AJs+, KJs+, QJs, AJo+, KQo, A5s-A2s, K9s, 76s, 65s',
  },
}

// ── Contra 3-bet, 4-bet y 5-bet ───────────────

export const FOUR_BET_SPECS = {
  value: 'QQ+, AKs, AKo',
  bluff: 'A5s-A4s',
  /** Pagar el 3-bet en posición: manos que juegan bien postflop y no quieren 4-bet. */
  callInPosition: '77-JJ, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo',
  /** Fuera de posición el pago se estrecha muchísimo. */
  callOutOfPosition: 'TT-JJ, AQs-AJs, KQs',
}

export const FIVE_BET_SPECS = {
  /** 5-bet all-in a 100 ciegas. */
  jam: 'QQ+, AKs, AKo',
  /** Pagar un 4-bet sin ir all-in. */
  callFourBet: 'JJ, AQs',
  /** Pagar el all-in después de haber hecho 4-bet. */
  callJam: 'QQ+, AKs, AKo',
}

// ── Ciega pequeña contra ciega grande ─────────

export const BVB_SPECS = {
  /** Limp de la SB en una estrategia mixta: manos jugables sin valor para subir. */
  sbLimp: 'K2o+, Q2o+, J5o+, T6o+, 96o+, 86o+, 75o+, 65o, Q2s+, J2s+, T2s+, 92s+, 84s+, 73s+, 63s+, 52s+, 42s+, 32s',
  /** La BB sube contra el limp de la SB. */
  bbIsoVsLimp: '66+, A7s+, K9s+, QTs+, JTs, A9o+, KTo+, QJo, A5s-A2s, K6s, Q8s, J8s, T8s, 97s, 86s, 75s, 64s',
  /** Manos que la BB no debería pasar tras el limp: dejar entrar gratis es regalar valor. */
  bbIsoValue: '88+, ATs+, KJs+, AJo+, KQo',
}

// ── Leer la acción preflop del log ────────────

export interface PreflopSpot {
  /** Subidas antes de la decisión; el open cuenta como la primera. */
  raises: number
  /** Jugadores que pagaron la ciega grande antes de cualquier subida. */
  limpers: number
  /** Posiciones de quienes pagaron sin subir antes de la primera subida. */
  limperPositions: string[]
  /** Jugadores que pagaron la última subida. */
  callers: number
  openerSeat: number | null
  openerPosition: string
  lastRaiserSeat: number | null
  lastRaiserPosition: string
  /** Asientos que subieron, en orden. */
  raiserSeats: number[]
  /** Total de la última subida, en ciegas grandes. */
  raiseToBb: number
}

/** Reconstruye la acción preflop anterior a la decisión a partir del log de la mano. */
export function readPreflop(state: TableState): PreflopSpot {
  const spot: PreflopSpot = {
    raises: 0,
    limpers: 0,
    limperPositions: [],
    callers: 0,
    openerSeat: null,
    openerPosition: '',
    lastRaiserSeat: null,
    lastRaiserPosition: '',
    raiserSeats: [],
    raiseToBb: 1,
  }

  for (const entry of state.log) {
    if (entry.street !== 'preflop') break
    if (entry.seat === null) continue

    if (entry.key === 'poker.log.raises' || entry.key === 'poker.log.bets') {
      const position = positionName(state, entry.seat)
      if (spot.raises === 0) {
        spot.openerSeat = entry.seat
        spot.openerPosition = position
      }
      spot.raises += 1
      spot.callers = 0
      spot.lastRaiserSeat = entry.seat
      spot.lastRaiserPosition = position
      spot.raiserSeats.push(entry.seat)
      spot.raiseToBb = Number(entry.params?.amount ?? 0) / state.config.bigBlind
    } else if (entry.key === 'poker.log.calls') {
      if (spot.raises === 0) {
        spot.limpers += 1
        spot.limperPositions.push(positionName(state, entry.seat))
      } else {
        spot.callers += 1
      }
    }
  }

  return spot
}
