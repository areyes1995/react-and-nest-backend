// ──────────────────────────────────────────────
// Entrenamientos de la mesa.
//
// El modo entrenamiento general dice si una decisión
// fue buena; un entrenamiento dice si fue buena
// PARA LO QUE ESTÁS PRACTICANDO. No es lo mismo:
// retirar AK desde UTG puede ser correcto en general
// y ser exactamente el error que se entrena en
// "agresión en posición tardía".
//
// Cada entrenamiento declara qué mira y devuelve
// `null` cuando la decisión no es de su tipo: así una
// sesión de pot odds no puntúa manos que nunca se
// enfrentaron a una apuesta.
// ──────────────────────────────────────────────

import type { Advice, DifficultyId, PlayerAction, Player, Street, TableState } from '@poker/engine'
import { isLatePosition } from './positions'
import {
  BB_DEFENSE_SPECS,
  BVB_SPECS,
  COLD_SPECS,
  FIVE_BET_SPECS,
  FOUR_BET_SPECS,
  SB_3BET_SPECS,
  expandRange,
  openRangeFor,
  openerGroup,
  readPreflop,
  tighterGroup,
  unionRanges,
  type OpenerGroup,
  type PreflopSpot,
} from './preflopRanges'

export type DrillId =
  | 'free'
  | 'preflop-position'
  | 'pot-odds'
  | 'cbet'
  | 'aggression'
  | 'discipline'
  | 'bluff-catch'
  | 'open-raise'
  | 'bb-defense'
  | 'vs-open'
  | 'vs-3bet'
  | 'blind-vs-blind'
  | 'integral'

export interface DrillContext {
  /** Estado ANTES de aplicar la acción: es donde se decidió. */
  state: TableState
  action: PlayerAction
  /** Análisis del motor para esa misma decisión. */
  advice: Advice | null
  hero: Player
  position: string
  street: Street
  /** El estudiante fue quien subió por última vez preflop. */
  isPreflopAggressor: boolean
  /** Fichas que costaba igualar. */
  toCall: number
  /** El estudiante podía pasar sin pagar. */
  canCheck: boolean
}

export interface DrillCheck {
  ok: boolean
  /** Corrección o confirmación, en segunda persona. */
  message: string
  /** Qué convenía hacer, cuando hay una alternativa clara. */
  better?: string
}

export interface Drill {
  id: DrillId
  title: string
  /** Qué se entrena, para el selector. */
  summary: string
  /** Foco del corrector; también viaja a la IA en el prompt. */
  focus: string
  /** Icono de lucide-react. */
  icon: string
  /** Manos recomendadas para que la sesión signifique algo. */
  targetHands: number
  /** Configuración de mesa que mejor expone lo que se entrena. */
  setup: { seats?: number; difficulty?: DifficultyId }
  /**
   * Activa las preguntas guiadas ("piensa antes de actuar") en cada decisión:
   * el entrenamiento enseña el proceso, no solo corrige el resultado.
   */
  guided?: boolean
  /**
   * Evalúa la decisión desde el punto de vista del entrenamiento.
   * `null` = esta decisión no es del tipo que aquí se practica.
   */
  evaluate: (context: DrillContext) => DrillCheck | null
}

/** Puntuación mínima de Chen para entrar al bote desde cada posición. */
const OPEN_THRESHOLD: Record<string, number> = {
  UTG: 11,
  MP: 10,
  HJ: 9,
  CO: 8,
  BTN: 7,
  SB: 9,
  BB: 5,
}

const pct = (value: number) => `${Math.round(value * 100)}%`

/** ¿La acción mete fichas en el bote? */
function isVoluntary(action: PlayerAction): boolean {
  return action.type === 'call' || action.type === 'bet' || action.type === 'raise'
}

// ── Arquitectura preflop ──────────────────────
// Los entrenamientos preflop corrigen contra tablas
// de rangos (`preflopRanges.ts`), no contra Chen:
// son las mismas tablas que enseñan las clases.

function isRaise(action: PlayerAction): boolean {
  return action.type === 'raise' || action.type === 'bet'
}

/** `2.5` → `2,5`, como se escriben las ciegas en las clases. */
function formatBb(value: number): string {
  return String(Math.round(value * 10) / 10).replace('.', ',')
}

function without(range: Set<string>, removed: Set<string>): Set<string> {
  return new Set([...range].filter(hand => !removed.has(hand)))
}

const PREMIUM = expandRange('QQ+, AKs, AKo')

const BB_DEFENSE = Object.fromEntries(
  Object.entries(BB_DEFENSE_SPECS).map(([group, spec]) => {
    const threeBet = expandRange(spec.threeBet)
    return [group, { threeBet, defend: unionRanges(expandRange(spec.defend), threeBet) }]
  }),
) as Record<OpenerGroup, { threeBet: Set<string>; defend: Set<string> }>

const SB_3BET = Object.fromEntries(
  Object.entries(SB_3BET_SPECS).map(([group, spec]) => [group, expandRange(spec)]),
) as Record<Exclude<OpenerGroup, 'SB'>, Set<string>>

const COLD = Object.fromEntries(
  Object.entries(COLD_SPECS).map(([group, spec]) => [
    group,
    { call: expandRange(spec.call), threeBet: expandRange(spec.threeBet) },
  ]),
) as Record<Exclude<OpenerGroup, 'SB' | 'BTN'>, { call: Set<string>; threeBet: Set<string> }>

const FOUR_BET = unionRanges(expandRange(FOUR_BET_SPECS.value), expandRange(FOUR_BET_SPECS.bluff))
const CALL_3BET_IP = expandRange(FOUR_BET_SPECS.callInPosition)
const CALL_3BET_OOP = expandRange(FOUR_BET_SPECS.callOutOfPosition)
const FIVE_BET_JAM = expandRange(FIVE_BET_SPECS.jam)
const CALL_4BET = expandRange(FIVE_BET_SPECS.callFourBet)
const CALL_JAM = expandRange(FIVE_BET_SPECS.callJam)

const SB_OPEN = openRangeFor('SB') ?? new Set<string>()
const SB_LIMP = unionRanges(expandRange(BVB_SPECS.sbLimp), SB_OPEN)
const BB_ISO = expandRange(BVB_SPECS.bbIsoVsLimp)
const BB_ISO_VALUE = expandRange(BVB_SPECS.bbIsoValue)

/** Orden de actuación postflop: quien va después juega en posición. */
const POSTFLOP_ORDER: Record<string, number> = { SB: 0, BB: 1, UTG: 2, MP: 3, HJ: 4, CO: 5, BTN: 6 }

function actsLater(position: string, against: string): boolean {
  return (POSTFLOP_ORDER[position] ?? 0) > (POSTFLOP_ORDER[against] ?? 0)
}

/** Tamaño de open que la BB defiende como si viniera de una posición anterior. */
function isBigOpen(spot: PreflopSpot, group: OpenerGroup): boolean {
  return spot.raiseToBb >= (group === 'SB' ? 4 : 3.5)
}

/** Primera decisión en un bote sin abrir: subir el rango o retirarse. */
function evaluateOpen(
  action: PlayerAction,
  hand: string,
  position: string,
  range: Set<string>,
  size: string,
): DrillCheck | null {
  const inRange = range.has(hand)
  const better = `Abrir con subida a ${size} ciegas.`

  if (isRaise(action)) {
    return inRange
      ? { ok: true, message: `${hand} está en el rango de open de ${position}. Subida correcta.` }
      : {
          ok: false,
          message: `${hand} no entra en el rango de open de ${position}: abres demasiado ancho para los jugadores que quedan detrás.`,
          better: 'Retirarse.',
        }
  }

  if (action.type === 'call') {
    return {
      ok: false,
      message: `Entrar pagando (open limp) con ${hand} desde ${position} te deja sin iniciativa y en un bote con más jugadores.`,
      better: inRange ? better : 'Retirarse.',
    }
  }

  if (action.type === 'fold') {
    return inRange
      ? {
          ok: false,
          message: `${hand} está dentro del rango de open de ${position}: retirarla deja dinero en la mesa.`,
          better,
        }
      : { ok: true, message: `${hand} queda fuera del rango de ${position}. Buen fold.` }
  }

  return null
}

interface PreflopRanges {
  /** Manos que suben (3-bet, 4-bet, all-in…). */
  raise: Set<string>
  /** Manos que pagan. Puede solaparse con `raise`: entonces valen las dos. */
  call: Set<string>
}

/**
 * Decisión frente a una subida: subir, pagar o retirarse según el rango.
 * `raiseLabel` nombra la subida ("3-bet") y `spot` describe la situación.
 */
function evaluateFacingRaise(
  action: PlayerAction,
  hand: string,
  ranges: PreflopRanges,
  raiseLabel: string,
  spot: string,
  note = '',
): DrillCheck | null {
  const raises = ranges.raise.has(hand)
  const calls = ranges.call.has(hand)
  const suffix = note ? ` ${note}` : ''
  const raiseBetter = `${raiseLabel[0].toUpperCase()}${raiseLabel.slice(1)}.`

  if (isRaise(action)) {
    if (raises) return { ok: true, message: `${hand} ${spot}: ${raiseLabel} es la jugada del rango.${suffix}` }
    if (calls) {
      return {
        ok: false,
        message: `${hand} ${spot} es mano de pago, no de ${raiseLabel}: subiendo conviertes una mano jugable en un farol caro.${suffix}`,
        better: 'Pagar.',
      }
    }
    return {
      ok: false,
      message: `${hand} ${spot} no entra ni en el rango de ${raiseLabel} ni en el de pago.${suffix}`,
      better: 'Retirarse.',
    }
  }

  if (action.type === 'call') {
    if (calls) return { ok: true, message: `${hand} ${spot}: pagar es correcto.${suffix}` }
    if (raises) {
      return {
        ok: false,
        message: `${hand} ${spot} es mano de ${raiseLabel}: pagando juegas un bote más pequeño y más difícil de lo que tu mano pide.${suffix}`,
        better: raiseBetter,
      }
    }
    return {
      ok: false,
      message: `${hand} ${spot} no llega al rango de pago: pagar aquí es la fuga más cara del preflop.${suffix}`,
      better: 'Retirarse.',
    }
  }

  if (action.type === 'fold') {
    if (raises) {
      return { ok: false, message: `${hand} ${spot} está en tu rango de ${raiseLabel}.${suffix}`, better: raiseBetter }
    }
    if (calls) {
      return { ok: false, message: `${hand} ${spot} tiene precio para continuar.${suffix}`, better: 'Pagar.' }
    }
    return { ok: true, message: `${hand} ${spot} queda fuera del rango: retirarse es lo correcto.${suffix}` }
  }

  return null
}

/** Defensa de la ciega grande frente a un open, teniendo en cuenta el tamaño. */
function evaluateBbDefense(action: PlayerAction, hand: string, spot: PreflopSpot): DrillCheck | null {
  const base = openerGroup(spot.openerPosition)
  const big = isBigOpen(spot, base)
  const ranges = BB_DEFENSE[big ? tighterGroup(base) : base]

  return evaluateFacingRaise(
    action,
    hand,
    // Pagar con una mano de 3-bet de farol es aceptable; con una premium, no.
    { raise: ranges.threeBet, call: without(ranges.defend, PREMIUM) },
    '3-bet',
    `en la BB contra un open de ${formatBb(spot.raiseToBb)} ciegas desde ${spot.openerPosition}`,
    big ? 'Contra un open grande se defiende más estrecho: pagas más para ganar lo mismo.' : '',
  )
}

export const DRILLS: Drill[] = [
  {
    id: 'free',
    title: 'Juego libre',
    summary: 'Sin objetivo concreto: juegas y el coach comenta cada decisión.',
    focus: 'juego general, sin un foco concreto',
    icon: 'Spade',
    targetHands: 0,
    setup: {},
    evaluate: () => null,
  },

  {
    id: 'preflop-position',
    title: 'Posición preflop',
    summary: 'Entrar solo con manos que aguanten desde tu posición. Se evalúa cada mano preflop.',
    focus: 'selección de manos iniciales según la posición en la mesa',
    icon: 'Compass',
    targetHands: 25,
    setup: { seats: 9 },
    evaluate: ({ street, action, advice, position }) => {
      if (street !== 'preflop' || !advice) return null

      const threshold = OPEN_THRESHOLD[position] ?? 9
      const playable = advice.chen >= threshold

      if (isVoluntary(action)) {
        if (playable) {
          return {
            ok: true,
            message: `${advice.hand} desde ${position} entra bien: Chen ${advice.chen} supera el ${threshold} que pide esta posición.`,
          }
        }
        return {
          ok: false,
          message: `${advice.hand} desde ${position} es entrar demasiado ancho: Chen ${advice.chen} frente al ${threshold} que exige esta posición.`,
          better: 'Retirarse y esperar una mano que aguante desde aquí.',
        }
      }

      // Retirarse una mano claramente abrible desde posición tardía es el otro
      // error del ejercicio: pasividad donde hay dinero.
      if (playable && advice.chen >= threshold + 2 && isLatePosition(position)) {
        return {
          ok: false,
          message: `${advice.hand} desde ${position} se abre: Chen ${advice.chen} es de sobra para esta posición.`,
          better: 'Abrir con una subida, no regalar la mano.',
        }
      }

      return {
        ok: true,
        message: `Retirar ${advice.hand} desde ${position} es correcto: no llega al Chen ${threshold} que pide la posición.`,
      }
    },
  },

  {
    id: 'pot-odds',
    title: 'Pot odds',
    summary: 'Pagar solo cuando las matemáticas lo permiten. Se evalúan las decisiones frente a una apuesta.',
    focus: 'pagar o retirarse comparando la equity con las pot odds exigidas',
    icon: 'Calculator',
    targetHands: 20,
    setup: { seats: 6 },
    evaluate: ({ advice, action, toCall }) => {
      if (!advice || toCall <= 0) return null

      const profitable = advice.equity > advice.required

      if (action.type === 'fold') {
        return profitable
          ? {
              ok: false,
              message: `Tenías ${pct(advice.equity)} de equity y la apuesta solo exigía ${pct(advice.required)}: ese abandono regala valor.`,
              better: 'Igualar.',
            }
          : {
              ok: true,
              message: `Correcto: ${pct(advice.equity)} de equity no cubre el ${pct(advice.required)} que exigían las pot odds.`,
            }
      }

      return profitable
        ? {
            ok: true,
            message: `Bien pagado: ${pct(advice.equity)} de equity contra ${pct(advice.required)} exigido.`,
          }
        : {
            ok: false,
            message: `Pagaste con ${pct(advice.equity)} cuando las pot odds pedían ${pct(advice.required)}. A largo plazo eso pierde fichas.`,
            better: 'Retirarse.',
          }
    },
  },

  {
    id: 'cbet',
    title: 'Apuesta de continuación',
    summary: 'Usar la iniciativa en el flop cuando fuiste el agresor preflop.',
    focus: 'apostar o no en el flop teniendo la iniciativa preflop',
    icon: 'Zap',
    targetHands: 25,
    setup: { seats: 6 },
    evaluate: ({ street, isPreflopAggressor, action, advice, canCheck }) => {
      if (street !== 'flop' || !isPreflopAggressor || !advice) return null

      // Sin la opción de pasar no hay c-bet que decidir: le apostaron antes.
      if (!canCheck) return null

      if (action.type === 'bet') {
        return {
          ok: true,
          message: `C-bet correcta: llevabas la iniciativa y apostaste el flop con ${pct(advice.equity)} de equity.`,
        }
      }

      if (advice.equity < 0.3) {
        return {
          ok: true,
          message: `Pasar está bien: con ${pct(advice.equity)} de equity y un board que no te pega, no toda mano merece c-bet.`,
        }
      }

      return {
        ok: false,
        message: `Eras el agresor preflop y pasaste el flop con ${pct(advice.equity)} de equity: renuncias al bote que ya tenías medio ganado.`,
        better: 'Apostar entre ⅓ y ⅔ del bote.',
      }
    },
  },

  {
    id: 'aggression',
    title: 'Agresión con valor',
    summary: 'No dejar de apostar las manos fuertes. Se evalúan los turnos en los que podías pasar.',
    focus: 'extraer valor apostando las manos fuertes en vez de pasarlas',
    icon: 'TrendingUp',
    targetHands: 25,
    setup: { seats: 6 },
    evaluate: ({ canCheck, action, advice, street }) => {
      if (!canCheck || !advice || street === 'preflop') return null

      const strong = advice.equity >= 0.6

      if (action.type === 'check') {
        return strong
          ? {
              ok: false,
              message: `Pasaste con ${pct(advice.equity)} de equity: ibas por delante y no cobraste nada.`,
              better: 'Apostar por valor, entre ½ y ¾ del bote.',
            }
          : {
              ok: true,
              message: `Pasar con ${pct(advice.equity)} controla el tamaño del bote. Correcto.`,
            }
      }

      if (action.type === 'bet' || action.type === 'raise') {
        return strong
          ? {
              ok: true,
              message: `Así se cobra: ${pct(advice.equity)} de equity y apuesta por valor.`,
            }
          : {
              ok: advice.equity >= 0.4,
              message:
                advice.equity >= 0.4
                  ? `Apuesta fina con ${pct(advice.equity)}: funciona, pero no puede ser tu jugada por defecto.`
                  : `Apostar con ${pct(advice.equity)} infla el bote cuando no eres favorito.`,
              better: advice.equity >= 0.4 ? undefined : 'Pasar y ver una carta gratis.',
            }
      }

      return {
        ok: false,
        message: 'Podías pasar sin pagar nada: retirarse ahí nunca es correcto.',
        better: 'Pasar.',
      }
    },
  },

  {
    id: 'discipline',
    title: 'Disciplina',
    summary: 'Retirar a tiempo. Penaliza pagar sin odds y entrar con manos flojas.',
    focus: 'disciplina para retirarse: no pagar sin odds ni entrar con manos flojas',
    icon: 'ShieldCheck',
    targetHands: 30,
    setup: { seats: 9, difficulty: 'advanced' },
    evaluate: ({ advice, action, toCall, street, position }) => {
      if (!advice) return null

      if (street === 'preflop' && isVoluntary(action)) {
        const threshold = OPEN_THRESHOLD[position] ?? 9
        if (advice.chen < threshold) {
          return {
            ok: false,
            message: `Entraste con ${advice.hand} (Chen ${advice.chen}) desde ${position}. Jugar de más es la fuga que más dinero cuesta.`,
            better: 'Retirarse.',
          }
        }
        return { ok: true, message: `Entrada justificada con ${advice.hand} desde ${position}.` }
      }

      if (toCall <= 0) return null

      const profitable = advice.equity > advice.required

      if (action.type === 'fold') {
        return {
          ok: !profitable,
          message: profitable
            ? `Ojo: aquí sí había precio (${pct(advice.equity)} contra ${pct(advice.required)}). La disciplina no es retirarse siempre.`
            : `Buen abandono: ${pct(advice.equity)} no cubre el ${pct(advice.required)} exigido.`,
          better: profitable ? 'Igualar.' : undefined,
        }
      }

      return {
        ok: profitable,
        message: profitable
          ? `Seguir está justificado: ${pct(advice.equity)} contra ${pct(advice.required)}.`
          : `Pagaste sin precio (${pct(advice.equity)} frente a ${pct(advice.required)}). Ahí es donde se va el stack.`,
        better: profitable ? undefined : 'Retirarse.',
      }
    },
  },

  {
    id: 'bluff-catch',
    title: 'Pagar faroles',
    summary: 'Decidir en el river con manos medias frente a una apuesta.',
    focus: 'decidir en el river si pagar una apuesta con una mano media',
    icon: 'Eye',
    targetHands: 20,
    setup: { seats: 6, difficulty: 'advanced' },
    evaluate: ({ street, toCall, advice, action }) => {
      if (street !== 'river' || toCall <= 0 || !advice) return null

      const profitable = advice.equity > advice.required

      if (action.type === 'fold') {
        return {
          ok: !profitable,
          message: profitable
            ? `Con ${pct(advice.equity)} frente a un ${pct(advice.required)} exigido, ese fold deja pasar un farol.`
            : `Bien retirado: ${pct(advice.equity)} no paga el ${pct(advice.required)} que pedía la apuesta.`,
          better: profitable ? 'Igualar.' : undefined,
        }
      }

      return {
        ok: profitable,
        message: profitable
          ? `Buen bluff-catch: ${pct(advice.equity)} contra ${pct(advice.required)} exigido.`
          : `Pagaste con ${pct(advice.equity)} cuando hacía falta ${pct(advice.required)}: en el river ya no quedan cartas que te salven.`,
        better: profitable ? undefined : 'Retirarse.',
      }
    },
  },

  {
    id: 'open-raise',
    title: 'Open raise por posición',
    summary: 'Abrir el rango de cada posición cuando nadie ha entrado. Se evalúan los botes sin abrir.',
    focus: 'rango de open raise (RFI) por posición: UTG, HJ, CO, BTN y SB',
    icon: 'DoorOpen',
    targetHands: 40,
    setup: { seats: 6 },
    evaluate: ({ street, advice, action, position, state }) => {
      if (street !== 'preflop' || !advice) return null

      const spot = readPreflop(state)
      if (spot.raises > 0 || spot.limpers > 0) return null

      const range = openRangeFor(position)
      if (!range) return null

      return evaluateOpen(action, advice.hand, position, range, position === 'SB' ? '3' : '2,5')
    },
  },

  {
    id: 'bb-defense',
    title: 'Defensa de la ciega grande',
    summary: 'Pagar, 3-betear o retirarse en la BB según quién abre y con qué tamaño.',
    focus: 'defensa de la ciega grande frente a un open según la posición del rival y el tamaño',
    icon: 'Shield',
    targetHands: 40,
    setup: { seats: 6 },
    evaluate: ({ street, advice, action, position, state, hero }) => {
      if (street !== 'preflop' || !advice || position !== 'BB') return null

      // Solo el open limpio contra la BB: con pagadores en medio es otro spot.
      const spot = readPreflop(state)
      if (spot.raises !== 1 || spot.limpers > 0 || spot.callers > 0 || spot.openerSeat === hero.seat) return null

      return evaluateBbDefense(action, advice.hand, spot)
    },
  },

  {
    id: 'vs-open',
    title: 'Cold call o 3-bet',
    summary: 'Frente a un open: cuándo pagar, cuándo resubir y cuándo retirarse.',
    focus: 'responder a un open desde fuera de la ciega grande: cold call, 3-bet o fold',
    icon: 'Split',
    targetHands: 40,
    setup: { seats: 6 },
    evaluate: ({ street, advice, action, position, state, hero }) => {
      // La BB tiene su propio entrenamiento: cierra la acción y ya ha pagado.
      if (street !== 'preflop' || !advice || position === 'BB') return null

      const spot = readPreflop(state)
      if (spot.raises !== 1 || spot.limpers > 0 || spot.callers > 0 || spot.openerSeat === hero.seat) return null

      const group = openerGroup(spot.openerPosition)
      const where = `desde ${position} contra un open de ${spot.openerPosition}`

      if (position === 'SB') {
        if (group === 'SB') return null
        return evaluateFacingRaise(
          action,
          advice.hand,
          { raise: SB_3BET[group], call: new Set() },
          '3-bet',
          where,
          'Desde la SB se juega 3-bet o fold: pagar te deja fuera de posición y con la BB detrás.',
        )
      }

      if (group === 'SB' || group === 'BTN') return null
      const ranges = COLD[group]
      return evaluateFacingRaise(action, advice.hand, { raise: ranges.threeBet, call: ranges.call }, '3-bet', where)
    },
  },

  {
    id: 'vs-3bet',
    title: '4-bet y 5-bet',
    summary: 'Responder cuando te resuben: 4-bet, pagar o retirarse, y el all-in preflop.',
    focus: 'responder a un 3-bet, a un 4-bet y a un all-in preflop después de haber subido',
    icon: 'ChevronsUp',
    targetHands: 50,
    setup: { seats: 6, difficulty: 'advanced' },
    evaluate: ({ street, advice, action, position, state, hero }) => {
      if (street !== 'preflop' || !advice) return null

      const spot = readPreflop(state)
      const hand = advice.hand
      const [first, second] = spot.raiserSeats

      // Abriste y te han hecho 3-bet.
      if (spot.raises === 2 && first === hero.seat) {
        const inPosition = actsLater(position, spot.lastRaiserPosition)
        return evaluateFacingRaise(
          action,
          hand,
          { raise: FOUR_BET, call: inPosition ? CALL_3BET_IP : CALL_3BET_OOP },
          '4-bet',
          `contra un 3-bet de ${spot.lastRaiserPosition} ${inPosition ? 'en posición' : 'fuera de posición'}`,
        )
      }

      // Hiciste 3-bet y te han hecho 4-bet.
      if (spot.raises === 3 && second === hero.seat) {
        return evaluateFacingRaise(
          action,
          hand,
          { raise: FIVE_BET_JAM, call: CALL_4BET },
          '5-bet all-in',
          `contra un 4-bet de ${spot.lastRaiserPosition}`,
        )
      }

      // Tu última subida recibió otra encima: 5-bet o all-in.
      if (spot.raises >= 4 && spot.raiserSeats[spot.raises - 2] === hero.seat) {
        return evaluateFacingRaise(
          action,
          hand,
          { raise: CALL_JAM, call: CALL_JAM },
          'all-in',
          `contra un ${spot.raises + 1}-bet`,
          'A estas alturas solo continúa el tope del rango.',
        )
      }

      return null
    },
  },

  {
    id: 'blind-vs-blind',
    title: 'SB contra BB',
    summary: 'La guerra de ciegas: abrir desde la SB y defender la BB contra ella.',
    focus: 'ciega pequeña contra ciega grande cuando el resto se retira',
    icon: 'Swords',
    targetHands: 40,
    setup: { seats: 3 },
    evaluate: ({ street, advice, action, position, state }) => {
      if (street !== 'preflop' || !advice) return null

      const spot = readPreflop(state)
      const hand = advice.hand

      if (position === 'SB' && spot.raises === 0 && spot.limpers === 0) {
        // El limp tiene sitio en una estrategia mixta, pero solo con manos jugables.
        if (action.type === 'call') {
          return SB_LIMP.has(hand)
            ? {
                ok: true,
                message: `Completar con ${hand} es válido en una estrategia de limp: la mano juega, pero no quiere un bote grande fuera de posición.`,
              }
            : {
                ok: false,
                message: `${hand} no es jugable desde la SB ni siquiera completando: vas a jugar fuera de posición con la peor mano.`,
                better: 'Retirarse.',
              }
        }
        return evaluateOpen(action, hand, 'SB', SB_OPEN, '3')
      }

      if (position !== 'BB') return null

      if (spot.raises === 1 && spot.openerPosition === 'SB' && spot.callers === 0 && spot.limpers === 0) {
        return evaluateBbDefense(action, hand, spot)
      }

      if (spot.raises === 0 && spot.limpers === 1 && spot.limperPositions[0] === 'SB') {
        if (isRaise(action)) {
          return BB_ISO.has(hand)
            ? { ok: true, message: `Subir el limp de la SB con ${hand}: en posición y contra un rango sin manos fuertes.` }
            : {
                ok: false,
                message: `${hand} no gana nada subiendo el limp: ni tiene valor ni juega bien si te pagan.`,
                better: 'Pasar y ver el flop gratis.',
              }
        }
        if (action.type === 'check') {
          return BB_ISO_VALUE.has(hand)
            ? {
                ok: false,
                message: `${hand} es demasiado buena para dejar entrar gratis a la SB: su rango de limp es débil y paga.`,
                better: 'Subir a 3-4 ciegas.',
              }
            : { ok: true, message: `Pasar con ${hand} está bien: ves el flop gratis y en posición.` }
        }
        if (action.type === 'fold') {
          return { ok: false, message: 'Podías pasar sin pagar nada: retirarse ahí nunca es correcto.', better: 'Pasar.' }
        }
      }

      return null
    },
  },

  {
    id: 'integral',
    title: 'Práctica integral',
    summary:
      'Todo lo aprendido, en cada decisión: open, defensa, 3-bet, c-bet, pot odds, valor y faroles, con preguntas guiadas antes de actuar.',
    focus:
      'proceso completo de decisión: rango por posición, respuesta a opens y 3-bets, outs y equity frente a pot odds, apuestas de valor y faroles según el tipo de rival',
    icon: 'GraduationCap',
    targetHands: 40,
    // Rivales mezclados (sólidos, agresivos, pasivos): hay que adaptarse a cada uno.
    setup: { seats: 6, difficulty: 'intermediate' },
    guided: true,
    evaluate: context => {
      // Cada decisión la corrige el entrenamiento especialista de ese spot.
      for (const id of INTEGRAL_ORDER) {
        const check = findDrill(id).evaluate(context)
        if (check) return check
      }
      return null
    },
  },
]

/**
 * Orden de consulta de la práctica integral: primero los spots más concretos
 * (preflop por situación, river) y al final los generales.
 */
const INTEGRAL_ORDER: DrillId[] = [
  'open-raise',
  'blind-vs-blind',
  'bb-defense',
  'vs-open',
  'vs-3bet',
  'bluff-catch',
  'pot-odds',
  'cbet',
  'aggression',
]

export function findDrill(id: DrillId | string | undefined): Drill {
  return DRILLS.find(drill => drill.id === id) ?? DRILLS[0]
}

/** Quién subió por última vez preflop, para saber si el estudiante lleva la iniciativa. */
export function preflopAggressorSeat(state: TableState): number | null {
  let seat: number | null = null
  for (const entry of state.log) {
    if (entry.street !== 'preflop') break
    if (entry.key === 'poker.log.bets' || entry.key === 'poker.log.raises') {
      seat = entry.seat
    }
  }
  return seat
}

/** Resultado acumulado de una sesión de entrenamiento. */
export interface DrillSession {
  drillId: DrillId
  /** Decisiones que el entrenamiento ha podido evaluar. */
  evaluated: number
  correct: number
  mistakes: number
  handsPlayed: number
  /** Aciertos seguidos, para dar sensación de progreso. */
  streak: number
  bestStreak: number
}

export const EMPTY_SESSION: DrillSession = {
  drillId: 'free',
  evaluated: 0,
  correct: 0,
  mistakes: 0,
  handsPlayed: 0,
  streak: 0,
  bestStreak: 0,
}

/** Precisión de la sesión, 0..1. */
export function drillAccuracy(session: DrillSession): number {
  return session.evaluated === 0 ? 0 : session.correct / session.evaluated
}
