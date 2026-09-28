// ──────────────────────────────────────────────
// Rangos preflop — notación y expansión.
// La notación estándar ("77+, AJs+, KQs") es
// compacta pero hay que expandirla a las 169 manos
// de la matriz para poder pintarla. Esta es la
// pieza que hace utilizable la herramienta.
// ──────────────────────────────────────────────

/** Rangos de la matriz, de mayor a menor (A en la esquina superior izquierda). */
export const GRID_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const

export type GridRank = (typeof GRID_RANKS)[number]

const RANK_VALUE: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
}

const VALUE_RANK: Record<number, string> = Object.entries(RANK_VALUE).reduce<Record<number, string>>(
  (acc, [label, value]) => {
    acc[value] = label
    return acc
  },
  {},
)

/** Notación de una celda de la matriz: `AA`, `AKs`, `AKo`. */
export function cellNotation(row: number, col: number): string {
  const high = GRID_RANKS[Math.min(row, col)]
  const low = GRID_RANKS[Math.max(row, col)]
  if (row === col) return `${high}${high}`
  // Por encima de la diagonal van las suited; por debajo, las offsuit.
  return row < col ? `${high}${low}s` : `${high}${low}o`
}

/**
 * Expande un token de rango a manos concretas con su frecuencia (0–100).
 * Acepta la notación estándar ("77+", "AJs+", "KQs") y un peso opcional
 * tras dos puntos: "A5o:50" abre A5o la mitad de las veces.
 */
function expandToken(token: string): Array<[string, number]> {
  const [rawHand, rawWeight] = token.trim().split(':')
  const clean = rawHand?.trim() ?? ''
  if (!clean) return []

  const parsedWeight = rawWeight === undefined ? 100 : Number(rawWeight)
  if (!Number.isFinite(parsedWeight)) return []
  const weight = Math.min(100, Math.max(0, parsedWeight))

  const plus = clean.endsWith('+')
  const body = plus ? clean.slice(0, -1) : clean

  const suffix = body.endsWith('s') || body.endsWith('o') ? body.slice(-1) : ''
  const ranks = suffix ? body.slice(0, -1) : body
  if (ranks.length !== 2) return []

  const first = RANK_VALUE[ranks[0].toUpperCase()]
  const second = RANK_VALUE[ranks[1].toUpperCase()]
  if (!first || !second) return []

  const out: string[] = []

  // Parejas: "77+" son todas las parejas de 7 en adelante.
  if (first === second) {
    const top = plus ? 14 : first
    for (let value = first; value <= top; value++) out.push(`${VALUE_RANK[value]}${VALUE_RANK[value]}`)
  } else {
    const high = Math.max(first, second)
    const low = Math.min(first, second)
    // "AJs+" mantiene la carta alta y sube la baja hasta rozarla.
    const top = plus ? high - 1 : low
    for (let value = low; value <= top; value++) {
      out.push(`${VALUE_RANK[high]}${VALUE_RANK[value]}${suffix}`)
    }
  }

  return out.map(hand => [hand, weight])
}

/**
 * Convierte un rango con pesos en un mapa mano → frecuencia (0–100).
 * Los tokens posteriores sobrescriben a los anteriores, así que
 * "22+, 22:50" deja todas las parejas al 100% salvo 22 al 50%.
 */
export function parseRange(range: string): Map<string, number> {
  const weights = new Map<string, number>()
  for (const token of range.split(',')) {
    for (const [hand, weight] of expandToken(token)) {
      if (weight > 0) weights.set(hand, weight)
      else weights.delete(hand)
    }
  }
  return weights
}

/** Expande un rango a las manos que se juegan con alguna frecuencia. */
export function expandRange(range: string): Set<string> {
  return new Set(parseRange(range).keys())
}

export interface PositionRange {
  id: string
  label: string
  description: string
  /** Tamaño de apertura estándar. */
  openSize: string
  /**
   * Rango con pesos: "hand:frecuencia". Sin peso, la mano se abre
   * siempre. Aproximación a soluciones GTO de 6-max, 100bb, apertura
   * de 2.5bb (3bb desde SB) y rake estándar de cash online.
   */
  range: string
}

/** Rangos de apertura (RFI) para mesa de 6 jugadores, 100bb efectivas. */
export const OPENING_RANGES: PositionRange[] = [
  {
    id: 'utg',
    label: 'UTG',
    description:
      'Primera posición: quedan cinco jugadores por actuar. Rango lineal y fuerte; los ases suited bajos y los conectores entran solo en mezcla.',
    openSize: '2.5 bb',
    range:
      '55+, 44:75, 33:40, 22:30, A8s+, A7s:75, A6s:75, A5s, A4s:75, A3s:75, A2s:50, ' +
      'K9s+, K8s:50, QTs+, Q9s:75, JTs, J9s:75, T9s, 98s:50, 87s:15, 76s:15, ' +
      'ATo+, KQo, KJo:75, QJo:25',
  },
  {
    id: 'mp',
    label: 'HJ',
    description:
      'Hijack (posición media en mesa de 6): entran todos los ases suited, más broadways y conectores suited con frecuencia alta.',
    openSize: '2.5 bb',
    range:
      '33+, 22:75, A2s+, K8s+, K7s:25, Q9s+, Q8s:60, J9s+, J8s:25, T9s, T8s:40, ' +
      '98s, 87s:75, 76s:60, 65s:50, 54s:20, ATo+, A9o:50, KJo+, KTo:60, QJo:75, QTo:15, JTo:40',
  },
  {
    id: 'co',
    label: 'CO',
    description:
      'Cutoff: solo el botón y las ciegas actúan después. Todas las parejas y los suited conectados, y los ases offsuit hasta A8o.',
    openSize: '2.5 bb',
    range:
      '22+, A2s+, K6s+, K5s:40, Q8s+, Q7s:15, J8s+, T8s+, T7s:25, 97s+, ' +
      '86s+, 76s, 75s:30, 65s, 54s, A8o+, A7o:25, A5o:25, KTo+, K9o:15, QTo+, JTo',
  },
  {
    id: 'btn',
    label: 'BTN',
    description:
      'Botón: la mejor posición de la mesa y el rango más ancho. Casi cualquier suited y buena parte de las offsuit con carta alta.',
    openSize: '2.5 bb',
    range:
      '22+, A2s+, K2s+, Q4s+, Q3s:25, J6s+, J5s:60, T6s+, 96s+, ' +
      '85s+, 75s+, 64s+, 53s+, 43s:25, A5o+, A4o:75, A3o:50, A2o:25, K8o+, K7o:35, ' +
      'Q9o+, Q8o:25, J9o+, J8o:50, T9o, T8o:60, 98o:60, 87o:15',
  },
  {
    id: 'sb',
    label: 'SB',
    description:
      'Ciega pequeña (estrategia de subir o retirarse): rango tan ancho como el del botón, pero jugarás toda la mano fuera de posición contra la BB.',
    openSize: '3 bb',
    range:
      '22+, A2s+, K2s+, Q3s+, Q2s:25, J5s+, J4s:20, T6s+, T5s:30, 96s+, 95s:30, 85s+, ' +
      '74s+, 64s+, 63s:50, 53s+, 43s:60, A4o+, A3o:75, A2o:50, K8o+, K7o:25, Q9o+, Q8o:15, J9o+, T9o, ' +
      'T8o:15, 98o:25',
  },
]

/** Número de combinaciones de una mano de la matriz. */
export function combosOf(hand: string): number {
  if (hand.length === 2) return 6 // pareja
  return hand.endsWith('s') ? 4 : 12
}

/** Combinaciones jugadas de un rango, ponderadas por su frecuencia. */
export function rangeCombos(weights: Map<string, number>): number {
  let combos = 0
  for (const [hand, weight] of weights) combos += combosOf(hand) * (weight / 100)
  return combos
}

/** Porcentaje real de manos que cubre un rango sobre las 1326 combinaciones. */
export function rangePercent(weights: Map<string, number>): number {
  return (rangeCombos(weights) / 1326) * 100
}
