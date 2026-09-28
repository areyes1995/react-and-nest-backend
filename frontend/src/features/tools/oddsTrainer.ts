// ──────────────────────────────────────────────
// Entrenador de odds — las cuentas que deciden
// si pagar, farolear o comprometerte:
//   · pot odds: equity mínima para pagar,
//   · implied odds: cuánto más tienes que ganar
//     después para que pagar un proyecto compense,
//   · fold equity: cuánto gana (o pierde) un farol,
//   · fold equity requerida: cuántas veces tiene que
//     retirarse el rival para que el farol gane solo,
//   · SPR: stack efectivo ÷ bote, cuánto te juegas
//     respecto a lo que ya hay en el centro.
//
// Cada spot es una mano real del motor, jugada hasta
// que te toca decidir en el flop o el turn: los
// números salen del bote y la apuesta de la mesa.
// Las opciones incorrectas no son al azar: son los
// errores típicos (olvidar tu propio call, usar la
// razón en vez del porcentaje…).
// ──────────────────────────────────────────────

import {
  applyAction,
  countOuts,
  createRng,
  createTable,
  legalActions,
  shuffle,
  startHand,
  totalPot,
  type PlayerAction,
  type Rng,
  type SeatSetup,
  type TableState,
} from '@poker/engine'

export type OddsKind = 'pot-odds' | 'implied-odds' | 'fold-equity' | 'required-fold-equity' | 'spr'

export const ODDS_KINDS: { id: OddsKind; label: string; short: string }[] = [
  { id: 'pot-odds', label: 'Pot odds', short: 'Pot odds' },
  { id: 'implied-odds', label: 'Implied odds', short: 'Implied' },
  { id: 'fold-equity', label: 'Fold equity (EV del farol)', short: 'Fold equity' },
  { id: 'required-fold-equity', label: 'Fold equity requerida', short: 'FE requerida' },
  { id: 'spr', label: 'SPR (stack-to-pot ratio)', short: 'SPR' },
]

export const ODDS_HERO_ID = 'hero'

export interface OddsFact {
  label: string
  value: string
}

export interface OddsQuestion {
  kind: OddsKind
  title: string
  /** La situación y la pregunta, en una o dos frases. */
  prompt: string
  /** Fórmula general, sin números: se muestra antes de responder. */
  formula: string
  /** Los datos que hay que meter en la fórmula. */
  facts: OddsFact[]
  options: string[]
  answerIndex: number
  /** La fórmula con los números de esta mano, paso a paso. */
  explanation: string
}

export interface OddsSpot {
  state: TableState
  question: OddsQuestion
}

/** Tamaños "de manual" (fracción del bote); se usan con una ligera variación. */
const CLASSIC_FRACTIONS = [1 / 3, 1 / 2, 2 / 3, 3 / 4, 1]

/** Proyectos de referencia cuando tu mano real no tiene ninguno. */
const REFERENCE_DRAWS = [
  { name: 'proyecto de color', outs: 9 },
  { name: 'escalera abierta', outs: 8 },
  { name: 'gutshot', outs: 4 },
]

const chips = (value: number) => Math.round(value).toLocaleString('es-ES')
const ratio = (value: number) => (Math.round(value * 10) / 10).toLocaleString('es-ES', { minimumFractionDigits: 1 })
const percent = (value: number) => `${(Math.round(value * 1000) / 10).toLocaleString('es-ES')}%`

// ── Tamaños de apuesta ────────────────────────

/**
 * Un tamaño de apuesta al azar, como en una mesa real: a veces la mínima,
 * a menudo cualquier fracción del bote, a veces un overbet y a veces all-in.
 * Así las pot odds no siguen un patrón que se pueda memorizar.
 */
function randomBet(pot: number, bigBlind: number, maxBet: number, rng: Rng, allowAllIn: boolean): number {
  const round = (value: number) => Math.max(bigBlind, Math.round(value / 5) * 5)
  const roll = rng.next()
  let amount: number
  if (roll < 0.1) amount = bigBlind // apuesta mínima
  else if (roll < 0.5) amount = round(pot * (0.2 + rng.next() * 0.8)) // 20%–100% del bote
  else if (roll < 0.7) amount = round(pot * CLASSIC_FRACTIONS[rng.int(CLASSIC_FRACTIONS.length)] * (0.94 + rng.next() * 0.12))
  else if (roll < 0.88 || !allowAllIn) amount = round(pot * (1.2 + rng.next() * 1.3)) // overbet 1,2–2,5×
  else amount = maxBet // all-in
  return Math.max(Math.min(bigBlind, maxBet), Math.min(amount, maxBet))
}

/** Cómo se describe una apuesta en el enunciado. */
function describeBet(amount: number, pot: number, bigBlind: number, allIn: boolean): string {
  if (allIn) return `va all-in por ${chips(amount)}`
  if (amount <= bigBlind) return `apuesta el mínimo (${chips(amount)})`
  const ratio = amount / Math.max(1, pot)
  if (ratio >= 1.15) return `hace un overbet de ${chips(amount)} (${ratio.toFixed(1).replace('.', ',')}× el bote)`
  return `apuesta ${chips(amount)} (${Math.round(ratio * 100)}% del bote)`
}

// ── La mano en la mesa ────────────────────────

function newTable(seed: number, rng: Rng): TableState {
  const seats = 3 + rng.int(4) // de 3 a 6 jugadores
  const names = ['Marta', 'Diego', 'Nadia', 'Bruno', 'Elena']
  const bigBlind = 50
  // Stacks distintos (30–200 ciegas): los all-in tampoco son siempre iguales.
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? ODDS_HERO_ID : 'bot-' + i,
    name: i === 0 ? 'Tú' : names[(i - 1) % names.length],
    isHuman: i === 0,
    botProfile: 'tag' as const,
    stack: bigBlind * (30 + rng.int(171)),
  }))
  return startHand(createTable({ smallBlind: 25, bigBlind, startingStack: 5000, ante: 0 }, setups, seed))
}

/** Tamaños de open preflop (en ciegas grandes): cada mesa abre distinto. */
const OPEN_SIZES = [2, 2.2, 2.5, 2.5, 3, 3.5, 4]

/**
 * Juega la mano hasta el spot pedido: el estudiante contra el rival en el
 * flop o el turn, enfrentado a una apuesta (`facingBet`) o con la opción de
 * apostar primero. La acción previa también varía (tamaño del open, botes de
 * 3-bet, un tercer jugador, apuesta en el flop antes del turn) para que el
 * bote no sea siempre el mismo. Devuelve `null` si esa semilla no llega.
 */
function playToSpot(seed: number, facingBet: boolean, rng: Rng, allowAllIn: boolean): TableState | null {
  let state = newTable(seed, rng)
  const bigBlind = state.config.bigBlind
  const target = rng.next() < 0.5 ? 'flop' : 'turn'
  const openTo = Math.round((bigBlind * OPEN_SIZES[rng.int(OPEN_SIZES.length)]) / 5) * 5
  const threeBetPot = rng.next() < 0.25
  const threeBetTo = Math.round((openTo * (3 + rng.next())) / 5) * 5
  // Un tercero solo en los spots de pagar: en los faroles hay un único rival.
  const multiway = facingBet && rng.next() < 0.3
  const flopAction = target === 'turn' && rng.next() < 0.5
  let villain: string | null = null
  let extra: string | null = null

  for (let guard = 0; guard < 80; guard++) {
    if (state.street === 'complete' || state.actingSeat === null) return null
    const legal = legalActions(state)
    const acting = state.players.find(p => p.seat === state.actingSeat)
    if (!legal || !acting) return null
    const isHero = acting.id === ODDS_HERO_ID
    const passive: PlayerAction = legal.canCheck ? { type: 'check' } : { type: 'call' }

    // ¿Hemos llegado?
    if (isHero && state.street === target) {
      if (facingBet && legal.callAmount > 0) return state
      if (!facingBet && legal.canCheck) return state
    }

    let action: PlayerAction
    if (state.street === 'preflop') {
      const unopened = state.currentBet <= bigBlind
      const facingOpen = state.currentBet === openTo
      if (isHero) {
        if (unopened) action = { type: 'raise', amount: openTo }
        else if (facingOpen && threeBetPot && legal.canRaise) action = { type: 'raise', amount: threeBetTo }
        else action = passive
      } else if (!villain && unopened) {
        villain = acting.id
        action = { type: 'raise', amount: openTo }
      } else if (!villain) {
        // El estudiante abrió: el primero en hablar es el rival (paga o resube).
        villain = acting.id
        action = threeBetPot && legal.canRaise ? { type: 'raise', amount: threeBetTo } : { type: 'call' }
      } else if (acting.id === villain) {
        action = passive
      } else if (multiway && !extra && facingOpen && !legal.canCheck) {
        extra = acting.id
        action = { type: 'call' }
      } else if (acting.id === extra) {
        action = passive
      } else {
        action = legal.canCheck ? { type: 'check' } : { type: 'fold' }
      }
    } else if (isHero) {
      // Antes de la calle objetivo el estudiante pasa o paga.
      action = passive
    } else if (acting.id === villain && legal.canBet && state.street === 'flop' && flopAction) {
      // Acción en el flop antes del spot del turn: apuesta normal y el estudiante paga.
      action = { type: 'bet', amount: randomBet(totalPot(state), bigBlind, Math.floor(legal.maxRaiseTo / 4), rng, false) }
    } else if (acting.id === villain && state.street === target && facingBet && legal.canBet) {
      // Sin all-in (implied odds), la apuesta deja al estudiante con fichas detrás.
      const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
      const maxBet = allowAllIn ? legal.maxRaiseTo : Math.min(legal.maxRaiseTo, Math.floor(hero.stack / 2))
      action = { type: 'bet', amount: randomBet(totalPot(state), bigBlind, maxBet, rng, allowAllIn) }
    } else {
      action = legal.canCheck ? { type: 'check' } : { type: 'fold' }
    }

    state = applyAction(state, action)
  }
  return null
}

// ── Preguntas ─────────────────────────────────

/**
 * Tres opciones distintas (la correcta y dos errores típicos) en orden
 * aleatorio. Ordenarlas por valor delataría la correcta: los errores típicos
 * (olvidar tu call, usar la razón…) suelen dar números más grandes.
 */
function threeOptions(
  correct: number,
  mistakes: number[],
  format: (value: number) => string,
  step: number,
  rng: Rng,
) {
  const values = [correct]
  for (const mistake of mistakes) {
    let candidate = mistake
    // Si un error coincide (redondeado) con otra opción, se separa un poco.
    while (values.some(value => format(value) === format(candidate))) candidate += step
    values.push(candidate)
    if (values.length === 3) break
  }
  while (values.length < 3) {
    let candidate = correct + step * values.length
    while (values.some(value => format(value) === format(candidate))) candidate += step
    values.push(candidate)
  }
  const shuffled = shuffle([...values], rng)
  return { options: shuffled.map(format), answerIndex: shuffled.indexOf(correct) }
}

/** Los números de una apuesta que tienes delante. */
function facingBet(state: TableState) {
  const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
  const villain = state.players.find(p => p.id !== ODDS_HERO_ID && p.committed === state.currentBet)!
  const call = legalActions(state)!.callAmount
  const bet = villain.committed
  const potBefore = totalPot(state) - villain.committed - hero.committed
  // Si el rival apuesta más de lo que tienes, el sobrante se le devuelve.
  const effectiveBet = Math.min(bet, hero.committed + call)
  const finalPot = potBefore + effectiveBet + hero.committed + call
  return {
    call,
    bet,
    potBefore,
    effectiveBet,
    finalPot,
    heroAllIn: call >= hero.stack,
    description: describeBet(bet, potBefore, state.config.bigBlind, villain.status === 'allin'),
  }
}

function potOddsQuestion(state: TableState, rng: Rng): OddsQuestion {
  const { call, bet, potBefore, effectiveBet, finalPot, heroAllIn, description } = facingBet(state)
  const required = call / finalPot
  const capped = effectiveBet < bet
  return {
    kind: 'pot-odds',
    title: 'Pot odds',
    prompt: `El rival ${description} en un bote de ${chips(potBefore)}.${capped ? ` Solo te quedan ${chips(call)}: pagar es tu all-in.` : ''} ¿Qué equity mínima necesitas para pagar?`,
    formula: 'Equity necesaria = lo que pagas ÷ (bote total después de pagar)',
    facts: [
      { label: 'Bote antes de la apuesta', value: chips(potBefore) },
      { label: 'Apuesta del rival', value: chips(bet) },
      { label: heroAllIn ? 'Lo que pagas (tu all-in)' : 'Lo que pagas', value: chips(call) },
    ],
    ...threeOptions(
      required,
      [
        call / (potBefore + effectiveBet),
        capped ? call / (potBefore + bet + call) : call / potBefore,
      ],
      percent,
      0.02,
      rng,
    ),
    explanation: `${chips(call)} ÷ (${chips(potBefore)} + ${chips(effectiveBet)} + ${chips(call)}) = ${chips(call)} ÷ ${chips(finalPot)} = ${percent(required)}.${
      capped
        ? ` Ojo: el rival apostó ${chips(bet)}, pero solo cuenta lo que puedes igualar (${chips(effectiveBet)}); el resto se le devuelve.`
        : ` El error típico es olvidar sumar tu propio call al bote (${percent(call / (potBefore + effectiveBet))}).`
    }`,
  }
}

function impliedOddsQuestion(state: TableState, rng: Rng): OddsQuestion {
  const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
  const { call, potBefore, finalPot, description } = facingBet(state)
  const pot = finalPot - call // bote con la apuesta del rival, antes de pagar
  const unseen = 52 - 2 - state.board.length

  // Tu proyecto real si lo tienes; si no, uno de referencia.
  const real = countOuts(hero.holeCards, state.board)
  const draw =
    real && real.outs >= 4
      ? { name: 'tu proyecto', outs: real.outs, real: true }
      : { ...REFERENCE_DRAWS[rng.int(REFERENCE_DRAWS.length)], real: false }
  const equityNext = draw.outs / unseen

  // Lo que debes ganar DESPUÉS, cuando ligas, para que pagar tenga EV ≥ 0.
  const needed = Math.max(0, call / equityNext - (pot + call))
  return {
    kind: 'implied-odds',
    title: 'Implied odds',
    prompt: `${draw.real ? `Tienes ${draw.outs} outs.` : `Supón que tienes ${draw.name} (${draw.outs} outs).`} El rival ${description} en un bote de ${chips(potBefore)} y solo verás una carta. ¿Cuánto más tienes que ganar después, cuando ligues, para que pagar sea rentable?`,
    formula: 'Ganancia extra necesaria = (lo que pagas ÷ tu equity) − (bote + lo que pagas)',
    facts: [
      { label: 'Outs', value: String(draw.outs) },
      { label: 'Equity para la próxima carta', value: `${draw.outs} ÷ ${unseen} = ${percent(equityNext)}` },
      { label: 'Bote con la apuesta', value: chips(pot) },
      { label: 'Lo que pagas', value: chips(call) },
    ],
    ...threeOptions(
      needed,
      [call / equityNext, Math.max(0, call / equityNext - (pot - call))],
      value => chips(value),
      Math.max(25, Math.round(pot / 10)),
      rng,
    ),
    explanation:
      needed > 0
        ? `${chips(call)} ÷ ${percent(equityNext)} = ${chips(call / equityNext)}; menos lo que ya puedes ganar (${chips(pot)} + ${chips(call)} = ${chips(pot + call)}) = ${chips(needed)}. Si el rival te paga al menos eso cuando ligas, pagar ahora compensa.`
        : `Ya tienes pot odds directas: con ${percent(equityNext)} de equity no necesitas ganar nada más después.`,
  }
}

/** Tu apuesta de farol: tamaño al azar, hasta el stack efectivo. */
function heroBluff(state: TableState, rng: Rng) {
  const pot = totalPot(state)
  const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
  const rivals = state.players.filter(p => p.id !== ODDS_HERO_ID && (p.status === 'active' || p.status === 'allin'))
  const effective = Math.min(hero.stack, Math.max(...rivals.map(p => p.stack)))
  const bet = randomBet(pot, state.config.bigBlind, effective, rng, true)
  const allIn = bet >= effective
  const how = allIn
    ? `vas all-in por ${chips(bet)}`
    : bet <= state.config.bigBlind
      ? `apuestas el mínimo (${chips(bet)})`
      : `apuestas ${chips(bet)} (${Math.round((bet / pot) * 100)}% del bote)`
  return { pot, bet, how }
}

function foldEquityQuestion(state: TableState, rng: Rng): OddsQuestion {
  const { pot, bet, how } = heroBluff(state, rng)
  const foldRate = (6 + rng.int(9)) / 20 // 30%..70% en pasos de 5
  const ev = foldRate * pot - (1 - foldRate) * bet
  return {
    kind: 'fold-equity',
    title: 'Fold equity (EV del farol)',
    prompt: `Vas de farol (si te pagan, pierdes): ${how} en un bote de ${chips(pot)} y el rival se retira el ${percent(foldRate)} de las veces. ¿Cuánto ganas o pierdes de media con este farol?`,
    formula: 'EV del farol = %fold × bote − %pago × apuesta',
    facts: [
      { label: 'Bote', value: chips(pot) },
      { label: 'Tu apuesta', value: chips(bet) },
      { label: '% de fold', value: percent(foldRate) },
    ],
    ...threeOptions(
      ev,
      [foldRate * pot - bet, foldRate * (pot + bet) - (1 - foldRate) * bet],
      value => `${value >= 0 ? '+' : '−'}${chips(Math.abs(value))}`,
      Math.max(10, Math.round(pot / 20)),
      rng,
    ),
    explanation: `${percent(foldRate)} × ${chips(pot)} − ${percent(1 - foldRate)} × ${chips(bet)} = ${chips(foldRate * pot)} − ${chips((1 - foldRate) * bet)} = ${ev >= 0 ? '+' : '−'}${chips(Math.abs(ev))}. ${ev >= 0 ? 'Positivo: el farol gana dinero por sí solo.' : 'Negativo: con tan poco fold, este farol pierde.'} Cuando te retiras no pierdes la apuesta entera: solo la pierdes las veces que te pagan.`,
  }
}

function requiredFoldEquityQuestion(state: TableState, rng: Rng): OddsQuestion {
  const { pot, bet, how } = heroBluff(state, rng)
  const required = bet / (pot + bet)
  return {
    kind: 'required-fold-equity',
    title: 'Fold equity requerida',
    prompt: `Quieres farolear: ${how} en un bote de ${chips(pot)}. ¿Qué % de veces tiene que retirarse el rival para que el farol gane por sí solo?`,
    formula: 'Fold equity requerida = apuesta ÷ (bote + apuesta)',
    facts: [
      { label: 'Bote', value: chips(pot) },
      { label: 'Tu apuesta', value: chips(bet) },
    ],
    ...threeOptions(required, [bet / pot, bet / (pot + 2 * bet)], percent, 0.03, rng),
    explanation: `${chips(bet)} ÷ (${chips(pot)} + ${chips(bet)}) = ${percent(required)}. Arriesgas ${chips(bet)} para ganar ${chips(pot)}: si el rival se retira más de ese ${percent(required)}, el farol ya es rentable aunque no tengas nada.`,
  }
}

/** Qué significa un SPR y qué manos aguantan el stack entero. */
function sprBand(spr: number): string {
  if (spr < 4) return 'SPR bajo (menos de 4): con top pair o mejor ya estás comprometido; el plan es meterlo todo, no hay sitio para foldear.'
  if (spr <= 10) return 'SPR medio (4–10): top pair buen kicker juega con cuidado; para meter el stack quieres dobles parejas o mejor.'
  return 'SPR alto (más de 10): top pair no basta para ir all-in; los botes grandes son para sets, colores, escaleras y proyectos fuertes.'
}

/**
 * SPR = stack efectivo ÷ bote. Las tres claves para calcularlo bien:
 * el stack efectivo es el MENOR entre tú y el rival (nadie puede perder
 * más de lo que tiene el corto), se cuentan las fichas que quedan DETRÁS
 * (no el stack con el que empezaste la mano) y el bote es el de ahora,
 * al empezar la calle. El SPR de referencia es el del flop; en el turn
 * se recalcula igual.
 */
function sprQuestion(state: TableState, rng: Rng): OddsQuestion {
  const hero = state.players.find(p => p.id === ODDS_HERO_ID)!
  const villain = state.players.find(p => p.id !== ODDS_HERO_ID && (p.status === 'active' || p.status === 'allin'))!
  const pot = totalPot(state)
  const effective = Math.min(hero.stack, villain.stack)
  const spr = effective / pot
  const street = state.street === 'flop' ? 'el flop' : 'el turn'
  // Tras una apuesta de bote pagada, el bote se triplica y el stack baja un bote.
  const afterPotBet = (effective - pot) / (3 * pot)
  return {
    kind: 'spr',
    title: 'SPR',
    prompt: `Empieza ${street}: tú tienes ${chips(hero.stack)} detrás, ${villain.name} ${chips(villain.stack)} y en el bote hay ${chips(pot)}. ¿Cuál es el SPR?`,
    formula: 'SPR = stack efectivo (el menor de los dos) ÷ bote',
    facts: [
      { label: 'Tu stack', value: chips(hero.stack) },
      { label: `Stack de ${villain.name}`, value: chips(villain.stack) },
      { label: 'Bote', value: chips(pot) },
    ],
    ...threeOptions(
      spr,
      [
        // Usar el stack mayor en vez del efectivo.
        Math.max(hero.stack, villain.stack) / pot,
        // Usar el stack con el que empezaste la mano (lo ya invertido no se puede volver a perder).
        (effective + hero.totalCommitted) / pot,
      ],
      ratio,
      0.5,
      rng,
    ),
    explanation: `Stack efectivo = el menor entre ${chips(hero.stack)} y ${chips(villain.stack)} = ${chips(effective)}. ${chips(effective)} ÷ ${chips(pot)} = ${ratio(spr)}. ${sprBand(spr)}${
      afterPotBet > 0
        ? ` Truco: si se apuesta el bote y se paga, el SPR baja a (SPR − 1) ÷ 3 = ${ratio(afterPotBet)}.`
        : ' Truco: con SPR menor que 1, una apuesta de bote ya es all-in.'
    }`,
  }
}

/**
 * Crea un spot del tipo pedido. Determinista para una misma semilla, así se
 * puede testear y repetir.
 */
export function createOddsSpot(kind: OddsKind, seed: number): OddsSpot {
  const isFacingBet = kind === 'pot-odds' || kind === 'implied-odds'
  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = createRng((seed + attempt * 7919) >>> 0)
    // En implied odds no hay all-in: tiene que quedar dinero por ganar después.
    const state = playToSpot((seed + attempt * 104729) >>> 0, isFacingBet, rng, kind !== 'implied-odds')
    if (!state) continue
    const question =
      kind === 'pot-odds'
        ? potOddsQuestion(state, rng)
        : kind === 'implied-odds'
          ? impliedOddsQuestion(state, rng)
          : kind === 'fold-equity'
            ? foldEquityQuestion(state, rng)
            : kind === 'required-fold-equity'
              ? requiredFoldEquityQuestion(state, rng)
              : sprQuestion(state, rng)
    return { state, question }
  }
  throw new Error('No se pudo generar un spot de odds')
}
