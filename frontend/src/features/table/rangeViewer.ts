// ──────────────────────────────────────────────
// Visor de rangos de las clases — registro de qué
// rango enseña cada bloque `range`.
//
// Los rangos preflop son los mismos con los que
// corrige el coach (`preflopRanges.ts`): lo que se
// ve es lo que se exige. Los de flop salen del
// juego moderno con solvers (Acevedo, Janda):
// en A-K-4 seco el agresor apuesta con todo su
// rango; en 7-6-5 conectado el defensor pasa con
// todo el suyo.
// ──────────────────────────────────────────────

import type { RangeTone } from '@components/poker/RangeGrid'
import {
  BB_DEFENSE_SPECS,
  COLD_SPECS,
  FOUR_BET_SPECS,
  OPEN_RANGES,
  SB_3BET_SPECS,
  expandRange,
  rangePercent,
  type OpenPosition,
  type OpenerGroup,
} from './preflopRanges'

export interface RangeGroup {
  /** Etiqueta de la leyenda ("Abrir", "Pagar", "Apuesta"…). */
  label: string
  tone: RangeTone
  /** Frecuencia 0..100 con la que se juega (100 = siempre). */
  weight: number
  hands: Set<string>
}

export interface RangeView {
  /** Título del botón ("Ver rango: …"). */
  title: string
  /** Una línea que explica qué enseña, bajo la matriz. */
  caption: string
  groups: RangeGroup[]
}

const open = (position: OpenPosition, label: string): RangeView => ({
  title: `Open raise desde ${position}`,
  caption: `${(rangePercent(OPEN_RANGES[position]) * 100).toFixed(1)}% de las manos: primero en entrar al bote con subida.`,
  groups: [{ label, tone: 'raise', weight: 100, hands: OPEN_RANGES[position] }],
})

const defend = (group: OpenerGroup, groupLabel: string): RangeView => {
  const spec = BB_DEFENSE_SPECS[group]
  const defendHands = expandRange(spec.defend)
  const threeBet = expandRange(spec.threeBet)
  return {
    title: `Defensa de BB vs open de ${groupLabel}`,
    caption: `Azul: pagar (${(rangePercent(defendHands) * 100).toFixed(1)}%). Dorado: 3-bet. El resto se retira.`,
    groups: [
      { label: 'Pagar', tone: 'call', weight: 100, hands: defendHands },
      { label: '3-bet', tone: 'raise', weight: 100, hands: threeBet },
    ],
  }
}

export const RANGE_VIEWER: Record<string, RangeView> = {
  'open-utg': open('UTG', 'Abrir'),
  'open-hj': open('HJ', 'Abrir'),
  'open-co': open('CO', 'Abrir'),
  'open-btn': open('BTN', 'Abrir'),
  'open-sb': open('SB', 'Abrir'),

  'bb-vs-ep': defend('EP', 'UTG'),
  'bb-vs-co': defend('CO', 'CO'),
  'bb-vs-btn': defend('BTN', 'el botón'),

  'three-bet-sb': {
    title: '3-bet desde SB vs botón',
    caption: 'Desde la ciega pequeña no se paga: 3-bet o fold. Valor estrecho más faroles con blocker de as.',
    groups: [{ label: '3-bet', tone: 'raise', weight: 100, hands: expandRange(SB_3BET_SPECS.BTN) }],
  },

  'cold-vs-ep': {
    title: 'Vs open UTG: pagar o 3-betear',
    caption: 'Fuera de la ciega y en posición: manos que juegan bien postflop pagan, premiums y blockers resuben.',
    groups: [
      { label: 'Pagar', tone: 'call', weight: 100, hands: expandRange(COLD_SPECS.EP.call) },
      { label: '3-bet', tone: 'raise', weight: 100, hands: expandRange(COLD_SPECS.EP.threeBet) },
    ],
  },

  'four-bet': {
    title: 'Vs 3-bet: 4-bet por valor y de farol',
    caption: 'Oro intenso: 4-bet siempre (QQ+, AK). Oro suave: 4-bet de farol con blocker (A5s-A4s).',
    groups: [
      { label: '4-bet valor', tone: 'raise', weight: 100, hands: expandRange(FOUR_BET_SPECS.value) },
      { label: '4-bet farol', tone: 'raise', weight: 40, hands: expandRange(FOUR_BET_SPECS.bluff) },
    ],
  },

  'flop-cbet-ak4': {
    title: 'C-bet en A-K-4: apuesta con todo el rango',
    caption: 'Board alto y seco con ventaja total: el rango de apertura de UTG apuesta pequeño al completo.',
    groups: [{ label: 'Apuesta 33%', tone: 'raise', weight: 100, hands: OPEN_RANGES.UTG }],
  },

  'flop-check-765': {
    title: 'Defensa en 7-6-5: check con todo el rango',
    caption: 'Board bajo y conectado que pertenece al defensor: la ciega grande pasa con todo y deja el farol al agresor.',
    groups: [{ label: 'Check', tone: 'call', weight: 100, hands: expandRange(BB_DEFENSE_SPECS.EP.defend) }],
  },
}

/** Título hablado del bloque (lo lee "Escuchar la clase"). */
export function rangeViewTitle(id: string): string {
  return RANGE_VIEWER[id]?.title ?? 'rango'
}
