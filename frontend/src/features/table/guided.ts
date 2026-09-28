// ──────────────────────────────────────────────
// Preguntas guiadas — "piensa antes de actuar".
//
// Corregir después de la decisión enseña qué estaba
// mal; preguntar antes enseña CÓMO se decide. En
// cada turno del estudiante se arma el spot:
//   · qué ha pasado y quién es cada rival (perfil),
//   · las preguntas que un jugador se hace ahí,
//   · un mini-test con respuestas calculadas por el
//     motor (rango, pot odds, outs, regla del 2 y 4,
//     fold equity),
//   · qué haría un profesional (equilibrado) y qué
//     haría un explotador contra ESTE rival.
//
// Todo es puro y determinista (misma mano, mismas
// preguntas): se puede testear y no baila al
// reabrir el panel.
// ──────────────────────────────────────────────

import {
  HAND_CATEGORY,
  contenders,
  countOuts,
  createRng,
  equity,
  evaluate,
  handNotation,
  legalActions,
  positionName,
  totalPot,
  type BotProfileId,
  type Player,
  type Rng,
  type TableState,
} from '@poker/engine'
import { OPENING_RANGES, parseRange, rangePercent } from '@features/tools/ranges'
import {
  BB_DEFENSE_SPECS,
  COLD_SPECS,
  FOUR_BET_SPECS,
  SB_3BET_SPECS,
  expandRange,
  openerGroup,
  readPreflop,
  unionRanges,
} from './preflopRanges'
import { actionRangeFor } from './handBias'

export type GuidedSpotKind =
  | 'unopened'
  | 'facing-limp'
  | 'facing-open'
  | 'facing-3bet'
  | 'postflop-first'
  | 'postflop-bet'
  | 'river-bet'

export interface GuidedQuestion {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface VillainNote {
  name: string
  position: string
  profile: string
  /** Cómo juega ese perfil, en una frase. */
  style: string
  /** Qué hace un explotador contra él en este spot. */
  exploit: string
}

export interface GuidedSpot {
  kind: GuidedSpotKind
  /** Clave de la decisión: cambia con cada turno del estudiante. */
  key: string
  title: string
  /** Qué ha pasado hasta ahora, en frases cortas. */
  situation: string[]
  /** Las preguntas que hay que hacerse en este spot. */
  checklist: string[]
  villains: VillainNote[]
  questions: GuidedQuestion[]
  /** Qué haría un jugador profesional (estrategia equilibrada). */
  pro: string
  /** Qué haría un explotador contra el rival principal. */
  exploit: string
}

// ── Perfiles de los rivales ───────────────────

interface ProfileInfo {
  label: string
  style: string
  /** Consejo explotador por tipo de spot. */
  preflop: string
  bluff: string
  value: string
  facingBet: string
}

const PROFILES: Record<BotProfileId, ProfileInfo> = {
  nit: {
    label: 'Nit (muy cerrado)',
    style: 'Juega pocas manos y casi solo apuesta fuerte con manos fuertes.',
    preflop: 'Róbale las ciegas más a menudo y respeta sus 3-bets: son casi siempre premium.',
    bluff: 'Es el rival ideal para farolear: se retira demasiado.',
    value: 'Apuesta por valor más pequeño: solo te paga con manos buenas.',
    facingBet: 'Cuando apuesta o sube, tiene la mano. Retírate con manos medias.',
  },
  tag: {
    label: 'TAG (sólido, estilo profesional)',
    style: 'Selectivo y agresivo: juega cerca del equilibrio.',
    preflop: 'Juega tu rango estándar; no hay una fuga clara que atacar.',
    bluff: 'Farolea con equilibrio: con bloqueadores y proyectos, no con aire puro.',
    value: 'Tamaños estándar (½–¾ del bote); paga con manos razonables.',
    facingBet: 'Sus apuestas mezclan valor y faroles: decide con pot odds y rango.',
  },
  lag: {
    label: 'LAG (agresivo)',
    style: 'Juega muchas manos y aprieta con frecuencia.',
    preflop: 'Haz 3-bet por valor más ancho y no abras manos marginales delante de él.',
    bluff: 'Farolea poco: te responde con subidas. Mejor deja que él farolee.',
    value: 'Pasa tus manos fuertes para que apueste por ti (check-raise o check-call).',
    facingBet: 'Paga más ligero: su rango de apuesta tiene muchos faroles.',
  },
  station: {
    label: 'Calling station (paga todo)',
    style: 'Paga casi cualquier apuesta y rara vez se retira.',
    preflop: 'Aíslalo con un rango de valor: juega botes grandes con manos buenas.',
    bluff: 'No le farolees nunca: no se retira.',
    value: 'Apuesta por valor más grande y más fino: te paga con peores manos.',
    facingBet: 'Si de repente apuesta o sube fuerte, créetelo: casi nunca farolea.',
  },
  maniac: {
    label: 'Maníaco (agresión extrema)',
    style: 'Apuesta y sube casi todo, con cualquier mano.',
    preflop: 'Estrecha tu rango y resube por valor: te dará las fichas él solo.',
    bluff: 'No farolees: deja que él lo haga.',
    value: 'Pasa y deja que apueste; paga o sube cuando llegue la hora.',
    facingBet: 'Paga mucho más ligero: la mayoría de sus apuestas son faroles.',
  },
}

const UNKNOWN_PROFILE: ProfileInfo = {
  label: 'Desconocido',
  style: 'Sin información todavía: asume un rival razonable.',
  preflop: 'Juega tu rango estándar.',
  bluff: 'Farolea con equilibrio.',
  value: 'Apuesta por valor con tamaños estándar.',
  facingBet: 'Decide con pot odds y rango.',
}

function profileOf(player: Player): ProfileInfo {
  return player.botProfile ? PROFILES[player.botProfile] ?? UNKNOWN_PROFILE : UNKNOWN_PROFILE
}

// ── Utilidades ────────────────────────────────

const pct = (value: number) => `${Math.round(value * 100)}%`

function bb(amount: number, bigBlind: number): string {
  return `${String(Math.round((amount / bigBlind) * 10) / 10).replace('.', ',')} bb`
}

/** Opciones numéricas: la correcta y tres distractores cercanos, en orden. */
function numericOptions(
  correct: number,
  pool: number[],
  format: (value: number) => string,
): { options: string[]; answerIndex: number } {
  const distractors = [...new Set(pool)]
    .filter(value => value !== correct)
    .sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct))
    .slice(0, 3)
  const values = [correct, ...distractors].sort((a, b) => a - b)
  return { options: values.map(format), answerIndex: values.indexOf(correct) }
}

/** Porcentaje de manos que abre cada posición (tabla de la herramienta). */
function openPercent(position: string): number {
  const id = position === 'HJ' ? 'mp' : position === 'MP' ? 'utg' : position.toLowerCase()
  const source = OPENING_RANGES.find(item => item.id === id)
  return source ? Math.round(rangePercent(parseRange(source.range))) : 0
}

function describeLabel(key: string, amount: number | undefined, bigBlind: number): string | null {
  switch (key) {
    case 'poker.log.bets':
      return `apuesta ${bb(amount ?? 0, bigBlind)}`
    case 'poker.log.raises':
      return `sube a ${bb(amount ?? 0, bigBlind)}`
    case 'poker.log.calls':
      return 'paga'
    case 'poker.log.checks':
      return 'pasa'
    case 'poker.log.folds':
      return 'se retira'
    default:
      return null
  }
}

/** Lo que han hecho los rivales en la calle actual (sin retiradas, para ir al grano). */
function streetStory(state: TableState, heroSeat: number): string[] {
  const lines: string[] = []
  for (const entry of state.log) {
    if (entry.street !== state.street || entry.seat === null || entry.seat === heroSeat) continue
    if (entry.key === 'poker.log.folds') continue
    const verb = describeLabel(entry.key, Number(entry.params?.amount ?? 0), state.config.bigBlind)
    if (!verb) continue
    const player = state.players.find(p => p.seat === entry.seat)
    if (player) lines.push(`${player.name} (${positionName(state, player.seat)}) ${verb}.`)
  }
  return lines
}

const STREET_NAMES: Record<string, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

/** Qué tienes, en palabras, a partir de la categoría y los outs. */
function handClass(category: number, equityValue: number, outs: number): 'strong' | 'medium' | 'draw' | 'air' {
  if (category >= HAND_CATEGORY.TWO_PAIR || equityValue >= 0.62) return 'strong'
  if (outs >= 8) return 'draw'
  if (category === HAND_CATEGORY.PAIR) return 'medium'
  return 'air'
}

const CLASS_LABEL = {
  strong: 'Mano hecha fuerte',
  medium: 'Mano media',
  draw: 'Proyecto',
  air: 'Aire (nada)',
} as const

// ── Constructor del spot ──────────────────────

export function buildGuidedSpot(state: TableState, heroId: string, rng?: Rng): GuidedSpot | null {
  const hero = state.players.find(p => p.id === heroId)
  const legal = legalActions(state)
  if (!hero || !legal || state.actingSeat !== hero.seat || hero.holeCards.length !== 2) return null

  const random = rng ?? createRng((state.seed + state.handNumber * 131 + state.log.length) >>> 0)
  const position = positionName(state, hero.seat)
  const hand = handNotation(hero.holeCards)
  const pot = totalPot(state)
  const toCall = legal.callAmount
  const bigBlind = state.config.bigBlind
  const others = contenders(state).filter(p => p.id !== heroId)
  const key = `${state.handNumber}-${state.street}-${state.log.length}`

  const villainNote = (player: Player, spotKind: 'preflop' | 'bluff' | 'value' | 'facingBet'): VillainNote => {
    const info = profileOf(player)
    return {
      name: player.name,
      position: positionName(state, player.seat),
      profile: info.label,
      style: info.style,
      exploit: info[spotKind],
    }
  }

  const situation: string[] = [`Estás en ${position} con ${hand}. Bote: ${bb(pot, bigBlind)}.`]
  const questions: GuidedQuestion[] = []

  // ── Preflop ──
  if (state.street === 'preflop') {
    const spot = readPreflop(state)
    const story = streetStory(state, hero.seat).filter(line => !line.includes('pone la ciega'))
    situation.push(...(story.length > 0 ? story : ['Nadie ha entrado todavía: todos se han retirado hasta ti.']))

    // Nadie ha entrado
    if (spot.raises === 0 && spot.limpers === 0) {
      const range = actionRangeFor(position)
      const inRange = range?.has(hand) ?? false
      const weight = parseRange(OPENING_RANGES.find(r => r.id === (position === 'HJ' ? 'mp' : position.toLowerCase()))?.range ?? '').get(hand) ?? 0
      const behind = others.filter(p => p.status === 'active')

      questions.push({
        id: 'open-range',
        prompt: `¿${hand} está en tu rango de open desde ${position}?`,
        options: ['Sí: subo', 'No: me retiro'],
        answerIndex: inRange ? 0 : 1,
        explanation: inRange
          ? `Sí. En la tabla de ${position}, ${hand} se abre ${weight >= 100 ? 'siempre' : `el ${weight}% de las veces`}. Un open de rango es rentable aunque te paguen.`
          : `No. ${weight > 0 ? `${hand} solo se abre el ${weight}% de las veces desde ${position}: por debajo del 50% se retira.` : `${hand} no entra en el rango de ${position}.`} Desde ${position} quedan ${behind.length} jugadores por hablar detrás.`,
      })
      questions.push({
        id: 'open-size',
        prompt: '¿De qué tamaño se abre?',
        options: ['Limp (1 bb)', '2,5 bb', '3 bb', '5 bb'],
        answerIndex: position === 'SB' ? 2 : 1,
        explanation:
          position === 'SB'
            ? 'Desde la SB, 3 bb: jugarás fuera de posición y conviene cobrar más para que la BB no defienda tan barato.'
            : 'El estándar a 100 ciegas es 2,5 bb. El limp de entrada regala la iniciativa: nunca es la jugada por defecto.',
      })

      const blinds = behind.filter(p => ['SB', 'BB'].includes(positionName(state, p.seat)))
      return {
        kind: 'unopened',
        key,
        title: `${STREET_NAMES.preflop} · nadie ha entrado`,
        situation,
        checklist: [
          `¿Cuántos jugadores quedan por hablar detrás de mí? (${behind.length})`,
          `¿${hand} está en el rango de open de ${position}? Mira la tabla con el botón «Rango».`,
          '¿Quiénes están en las ciegas y cómo juegan? Contra ciegas cerradas se roba más.',
          'Tamaño: 2,5 bb (3 bb desde la SB). Nunca limp de entrada.',
        ],
        villains: blinds.map(p => villainNote(p, 'preflop')),
        questions,
        pro: `Un profesional abre exactamente su rango de ${position} (${openPercent(position) || '—'}% de las manos) con el mismo tamaño siempre, para no dar pistas.`,
        exploit: blinds.length
          ? `Un explotador mira las ciegas: ${blinds.map(p => `${p.name} es ${profileOf(p).label.toLowerCase()} → ${profileOf(p).preflop.toLowerCase()}`).join(' ')}`
          : 'Un explotador ajusta el rango según quién queda detrás.',
      }
    }

    // Hubo limpers
    if (spot.raises === 0) {
      const range = actionRangeFor(position)
      const inRange = range?.has(hand) ?? false
      const size = 3 + spot.limpers
      questions.push({
        id: 'iso-size',
        prompt: `Hay ${spot.limpers} limper${spot.limpers > 1 ? 's' : ''}. Si subes para aislar, ¿a cuánto?`,
        options: ['2 bb', '2,5 bb', `${size} bb`, `${size + 4} bb`],
        answerIndex: 2,
        explanation: `Regla: 3 bb + 1 bb por cada limper = ${size} bb. Más pequeño deja entrar a todos; más grande solo te pagan manos mejores.`,
      })
      questions.push({
        id: 'iso-hand',
        prompt: `¿${hand} es buena mano para aislar desde ${position}?`,
        options: ['Sí: subo', 'No: me retiro o paso'],
        answerIndex: inRange ? 0 : 1,
        explanation: inRange
          ? 'Sí: está en tu rango de valor. Aislar al limper te da la iniciativa contra un rango débil.'
          : 'No: aislar con manos flojas te deja jugando un bote grande sin ventaja.',
      })
      const limpers = others.filter(p => spot.limperPositions.includes(positionName(state, p.seat)))
      return {
        kind: 'facing-limp',
        key,
        title: `${STREET_NAMES.preflop} · hay limpers`,
        situation,
        checklist: [
          '¿Quién ha hecho limp y cómo juega? El limp suele ser un rango débil.',
          '¿Mi mano gana jugando un bote más grande contra ese rango?',
          'Tamaño de aislamiento: 3 bb + 1 bb por limper.',
          '¿Estaré en posición contra él después del flop?',
        ],
        villains: limpers.map(p => villainNote(p, 'preflop')),
        questions,
        pro: 'Un profesional aísla con un rango lineal de valor y se retira con el resto; rara vez hace limp detrás.',
        exploit: limpers.length
          ? `Contra ${limpers[0].name} (${profileOf(limpers[0]).label.toLowerCase()}): ${profileOf(limpers[0]).preflop}`
          : 'Aísla a los limpers débiles con más frecuencia.',
      }
    }

    // Frente a un open
    const opener = state.players.find(p => p.seat === spot.openerSeat)
    if (spot.raises === 1 && opener && opener.id !== heroId) {
      const openerPos = spot.openerPosition === 'MP' ? 'UTG' : spot.openerPosition
      const openerPct = openPercent(openerPos)
      const range = numericOptions(openerPct, [17, 22, 28, 44, 60, 10].map(v => (v === openerPct ? v + 5 : v)), v => `~${v}%`)
      questions.push({
        id: 'opener-range',
        prompt: `${opener.name} abrió desde ${spot.openerPosition}. ¿Qué parte de sus manos abre un jugador sólido desde ahí?`,
        ...range,
        explanation: `Desde ${spot.openerPosition} se abre ~${openerPct}% de las manos. Cuanto más tarde abre, más ancho es su rango y más manos puedes jugar contra él.`,
      })

      // Qué hacer según las tablas
      const group = openerGroup(spot.openerPosition)
      let threeBet: Set<string> | null = null
      let call: Set<string> | null = null
      if (position === 'BB') {
        const spec = BB_DEFENSE_SPECS[group]
        threeBet = expandRange(spec.threeBet)
        call = expandRange(spec.defend)
      } else if (position === 'SB' && group !== 'SB') {
        threeBet = expandRange(SB_3BET_SPECS[group])
        call = new Set()
      } else if (group === 'EP' || group === 'HJ' || group === 'CO') {
        const spec = COLD_SPECS[group]
        threeBet = expandRange(spec.threeBet)
        call = expandRange(spec.call)
      }
      if (threeBet && call) {
        const answer = threeBet.has(hand) ? 0 : call.has(hand) ? 1 : 2
        questions.push({
          id: 'vs-open-action',
          prompt: `Con ${hand} en ${position} contra el open de ${spot.openerPosition}, ¿qué haces?`,
          options: ['3-bet', 'Pagar', 'Retirarse'],
          answerIndex: answer,
          explanation: [
            `${hand} está en el rango de 3-bet contra ${spot.openerPosition}${hand.startsWith('A') && hand.endsWith('s') && '5432'.includes(hand[1]) ? ' como farol con bloqueador de as' : ' por valor'}.`,
            `${hand} está en el rango de pago: juega bien postflop pero no es lo bastante fuerte para resubir.`,
            `${hand} no llega: contra un rango de ${spot.openerPosition} va por detrás demasiado a menudo.${position === 'SB' ? ' Desde la SB se juega 3-bet o fold.' : ''}`,
          ][answer],
        })
      }
      if (toCall > 0) questions.push(potOddsQuestion(toCall, pot))

      return {
        kind: 'facing-open',
        key,
        title: `${STREET_NAMES.preflop} · te han abierto`,
        situation,
        checklist: [
          `¿Desde qué posición abrió ${opener.name} y qué rango tiene?`,
          position === 'BB' || position === 'SB'
            ? 'Jugarás fuera de posición: defiende con manos que jueguen bien, no con cualquier cosa.'
            : '¿Estaré en posición después del flop? En posición puedes pagar más.',
          '¿Mi mano es 3-bet por valor, 3-bet de farol (A5s, bloqueadores), pagar o retirarse?',
          '¿Queda alguien detrás que pueda hacer squeeze si solo pago?',
        ],
        villains: [villainNote(opener, 'preflop')],
        questions,
        pro: 'Un profesional responde con su tabla: 3-bet polarizado en posición, más lineal desde las ciegas, y fold con el resto.',
        exploit: `${opener.name} es ${profileOf(opener).label.toLowerCase()}: ${profileOf(opener).preflop}`,
      }
    }

    // Frente a un 3-bet (o más)
    const raiser = state.players.find(p => p.seat === spot.lastRaiserSeat)
    if (raiser && raiser.id !== heroId) {
      const inPosition = ['SB', 'BB'].includes(spot.lastRaiserPosition)
      const value = expandRange(FOUR_BET_SPECS.value)
      const bluff = expandRange(FOUR_BET_SPECS.bluff)
      const callRange = expandRange(inPosition ? FOUR_BET_SPECS.callInPosition : FOUR_BET_SPECS.callOutOfPosition)
      const answer = unionRanges(value, bluff).has(hand) ? 0 : callRange.has(hand) ? 1 : 2
      questions.push({
        id: 'vs-3bet-action',
        prompt: `${raiser.name} te resube desde ${spot.lastRaiserPosition}. Con ${hand}, ¿qué haces?`,
        options: ['4-bet', 'Pagar', 'Retirarse'],
        answerIndex: answer,
        explanation: [
          value.has(hand)
            ? `${hand} es 4-bet por valor (QQ+, AK).`
            : `${hand} es el 4-bet de farol: bloquea ases y juega bien si te pagan.`,
          `${hand} paga ${inPosition ? 'en posición' : 'incluso fuera de posición'}: demasiado buena para foldear, no tanto para el 4-bet.`,
          `${hand} se retira: ${inPosition ? '' : 'fuera de posición '}contra un rango de 3-bet va muy por detrás.`,
        ][answer],
      })
      if (toCall > 0) questions.push(potOddsQuestion(toCall, pot))
      return {
        kind: 'facing-3bet',
        key,
        title: `${STREET_NAMES.preflop} · te resuben`,
        situation,
        checklist: [
          `¿Desde dónde me resube ${raiser.name} y con qué tamaño?`,
          '¿Tengo 4-bet por valor (QQ+, AK) o un farol con bloqueador (A5s–A4s)?',
          inPosition ? 'Estaré en posición: puedo pagar algo más.' : 'Estaré fuera de posición: pago muy poco.',
          '¿Cuánto me queda detrás? Con stacks cortos, 4-bet es casi all-in.',
        ],
        villains: [villainNote(raiser, 'facingBet')],
        questions,
        pro: 'Un profesional defiende su open con la proporción correcta: 4-bet de valor y de farol, algo de pago y fold con el resto.',
        exploit: `${raiser.name} es ${profileOf(raiser).label.toLowerCase()}: ${profileOf(raiser).facingBet}`,
      }
    }
  }

  // ── Postflop ──
  const street = state.street
  situation.push(`Mesa: ${state.board.length} cartas. Rivales en la mano: ${others.length}.`)
  situation.push(...streetStory(state, hero.seat))

  const outs = countOuts(hero.holeCards, state.board)
  const estimate = equity(hero.holeCards, state.board, Math.max(1, others.length), { samples: 1500, rng: random })
  const category = evaluate([...hero.holeCards, ...state.board]).category
  const kindOfHand = handClass(category, estimate.equity, outs?.outs ?? 0)
  // Te apuestan: el rival principal es quien apostó en esta calle. Si puedes
  // pasar, importa quién trae la iniciativa de las calles anteriores.
  const bettor = state.players.find(p => p.seat === state.lastAggressorSeat)
  const aggressor = state.players.find(p => p.seat === initiativeSeat(state))
  const mainVillain =
    (bettor && bettor.id !== heroId ? bettor : undefined) ??
    (aggressor && aggressor.id !== heroId && others.includes(aggressor) ? aggressor : undefined) ??
    others[0]

  if (outs) {
    const breakdown = Object.entries(outs.byKind)
      .map(([kind, count]) => `${count} ${OUT_LABEL[kind as keyof typeof OUT_LABEL]}`)
      .join(', ')
    questions.push({
      id: 'outs',
      prompt: '¿Cuántos outs tienes para mejorar a una mano probablemente ganadora?',
      ...numericOptions(outs.outs, [0, 2, 4, 5, 6, 8, 9, 12, 15], v => String(v)),
      explanation:
        outs.outs > 0
          ? `${outs.outs} outs: ${breakdown}. Solo cuentan las cartas que TE mejoran a ti, no las que emparejan el board para todos.`
          : 'Ninguna carta te mejora a una mano claramente ganadora: o ya la tienes, o no tienes proyecto.',
    })
    if (outs.outs > 0) {
      questions.push({
        id: 'rule-2-4',
        prompt: `Regla del 2 y 4: ¿qué equity aproximada te dan esos outs ${outs.cardsToCome === 2 ? 'hasta el river' : 'en el river'}?`,
        ...numericOptions(outs.ruleOfTwoAndFour, [outs.outs, outs.outs * 2, outs.outs * 4, outs.outs * 3, outs.outs * 6].map(v => Math.min(100, v)), v => `~${v}%`),
        explanation: `${outs.outs} outs × ${outs.cardsToCome === 2 ? '4 (quedan dos cartas)' : '2 (queda una carta)'} ≈ ${outs.ruleOfTwoAndFour}%. El simulador, contra ${others.length} mano${others.length > 1 ? 's' : ''} al azar, te da ${pct(estimate.equity)} en total (contando cuando ya vas ganando).`,
      })
    }
  }

  // Te han apostado
  if (toCall > 0) {
    const required = toCall / (pot + toCall)
    questions.push(potOddsQuestion(toCall, pot))
    const profitable = estimate.equity > required
    questions.push({
      id: 'call-profitable',
      prompt: `Con ~${pct(estimate.equity)} de equity, ¿pagar es rentable?`,
      options: ['Sí', 'No'],
      answerIndex: profitable ? 0 : 1,
      explanation: profitable
        ? `Sí: ${pct(estimate.equity)} > ${pct(required)}. Si además puedes cobrar más cuando ligues (implied odds), mejor todavía.`
        : `No: ${pct(estimate.equity)} < ${pct(required)}. Solo pagarías por implied odds claras o leyendo un farol del rival.`,
    })

    const isRiver = street === 'river'
    const villain = mainVillain ?? others[0]
    return {
      kind: isRiver ? 'river-bet' : 'postflop-bet',
      key,
      title: `${STREET_NAMES[street]} · te apuestan`,
      situation,
      checklist: isRiver
        ? [
            '¿Qué manos de valor y qué faroles llegan hasta aquí en su rango?',
            `Necesito ganar más del ${pct(required)} de las veces: ¿este rival farolea tanto?`,
            '¿Mi mano bloquea sus faroles (mala señal) o su valor (buena señal)?',
            '¿Le gano a algo más que a sus faroles?',
          ]
        : [
            `¿Qué representa ${villain?.name ?? 'el rival'} con esta apuesta según su perfil?`,
            '¿Cuántos outs tengo y son limpios (no le dan también la mano a él)?',
            `¿Qué equity necesito (pot odds: ${pct(required)}) y qué equity tengo?`,
            '¿Tengo implied odds si ligo? ¿Subir como semi-farol tiene sentido?',
          ],
      villains: villain ? [villainNote(villain, 'facingBet')] : [],
      questions,
      pro: `Un profesional compara equity con pot odds (${pct(required)}) y defiende lo suficiente para que el rival no gane faroleando con cualquier cosa.`,
      exploit: villain
        ? `${villain.name} es ${profileOf(villain).label.toLowerCase()}: ${profileOf(villain).facingBet}`
        : 'Ajusta según lo que sepas del rival.',
    }
  }

  // Puedes pasar: ¿apuestas?
  const heroIsAggressor = aggressor?.id === heroId
  const preflopAggressorName = aggressor ? (aggressor.id === heroId ? 'Tú' : aggressor.name) : 'Nadie'
  const initiativeOptions = ['Tú', aggressor && aggressor.id !== heroId ? aggressor.name : 'Un rival', 'Nadie']
  questions.push({
    id: 'initiative',
    prompt: '¿Quién llegó a esta calle con la iniciativa (la última apuesta o subida)?',
    options: initiativeOptions,
    answerIndex: heroIsAggressor ? 0 : aggressor ? 1 : 2,
    explanation: heroIsAggressor
      ? 'Tú. Con la iniciativa, tu rango representa las manos fuertes: la apuesta de continuación funciona a menudo.'
      : aggressor
        ? `${preflopAggressorName}. Sin la iniciativa, lo normal es pasar y ver qué hace el agresor.`
        : 'Nadie: bote sin agresor, el primero que apueste con sentido suele llevárselo.',
  })
  questions.push({
    id: 'hand-class',
    prompt: '¿Qué tienes ahora mismo?',
    options: [CLASS_LABEL.strong, CLASS_LABEL.medium, CLASS_LABEL.draw, CLASS_LABEL.air],
    answerIndex: ['strong', 'medium', 'draw', 'air'].indexOf(kindOfHand),
    explanation: {
      strong: `Mano fuerte (~${pct(estimate.equity)} de equity): hay que apostar por valor.`,
      medium: `Mano media (~${pct(estimate.equity)}): gana a faroles y a peores parejas, pierde contra lo fuerte. Suele preferir controlar el bote.`,
      draw: `Proyecto con ${outs?.outs ?? 0} outs: buen candidato a semi-farol.`,
      air: `Aire (~${pct(estimate.equity)}): solo gana si el rival se retira.`,
    }[kindOfHand],
  })

  const bluffTarget = mainVillain ? profileOf(mainVillain) : UNKNOWN_PROFILE
  const canBluff = !(mainVillain?.botProfile === 'station' || mainVillain?.botProfile === 'maniac')
  const purpose =
    kindOfHand === 'strong'
      ? 0
      : kindOfHand === 'draw'
        ? 1
        : kindOfHand === 'air' && heroIsAggressor && others.length === 1 && canBluff
          ? 2
          : 3
  questions.push({
    id: 'bet-purpose',
    prompt: 'Si apuestas, ¿con qué objetivo?',
    options: ['Valor', 'Semi-farol (con proyecto)', 'Farol', 'Mejor pasar'],
    answerIndex: purpose,
    explanation: [
      'Valor: te pagan manos peores. No regales cartas gratis.',
      'Semi-farol: ganas si se retira y, si paga, aún tienes outs.',
      `Farol: tienes la iniciativa, un solo rival y ${mainVillain?.name ?? 'él'} puede retirarse.`,
      kindOfHand === 'air'
        ? `Pasar: ${!canBluff ? `${mainVillain?.name} no se retira (${bluffTarget.label.toLowerCase()}): farolearle es regalar fichas.` : 'sin iniciativa o con varios rivales, el farol pierde.'}`
        : 'Pasar: con una mano media, apostar solo hace que te paguen las mejores.',
    ][purpose],
  })

  // Fold equity: cuánto tiene que retirarse el rival para que un farol de ⅔ gane solo.
  const bet = Math.round((pot * 2) / 3)
  const foldNeeded = Math.round((bet / (pot + bet)) * 100)
  questions.push({
    id: 'fold-equity',
    prompt: `Si apuestas ⅔ del bote (${bb(bet, bigBlind)}), ¿qué % de veces tiene que retirarse el rival para que un farol gane por sí solo?`,
    ...numericOptions(foldNeeded, [25, 33, 40, 50, 60, 67], v => `${v}%`),
    explanation: `Apuesta / (bote + apuesta) = ${bb(bet, bigBlind)} / ${bb(pot + bet, bigBlind)} ≈ ${foldNeeded}%. Si el rival se retira más que eso, el farol ya gana.`,
  })

  return {
    kind: 'postflop-first',
    key,
    title: `${STREET_NAMES[street]} · te toca a ti`,
    situation,
    checklist: [
      '¿Quién tiene la iniciativa y quién tiene ventaja de rango en este board?',
      '¿Qué tengo: mano hecha, proyecto o aire?',
      'Si apuesto: ¿qué manos peores me pagan (valor) o qué mejores se retiran (farol)?',
      '¿Mi historia es creíble? ¿El rival puede retirarse? ¿Tengo bloqueadores?',
      '¿Qué tamaño cuenta la historia que quiero contar?',
    ],
    villains: others.map(p => villainNote(p, kindOfHand === 'strong' ? 'value' : 'bluff')),
    questions,
    pro: heroIsAggressor
      ? 'Un profesional apuesta con frecuencia en boards que favorecen su rango (tamaño pequeño) y pasa más en los que favorecen al rival.'
      : 'Un profesional sin iniciativa pasa casi todo su rango y responde a lo que haga el agresor.',
    exploit: mainVillain
      ? `${mainVillain.name} es ${bluffTarget.label.toLowerCase()}: ${kindOfHand === 'strong' ? bluffTarget.value : bluffTarget.bluff}`
      : 'Ajusta según lo que sepas del rival.',
  }
}

/** Último que apostó o subió en una calle anterior: quien lleva la iniciativa. */
function initiativeSeat(state: TableState): number | null {
  let seat: number | null = null
  for (const entry of state.log) {
    if (entry.street === state.street) break
    if (entry.key === 'poker.log.bets' || entry.key === 'poker.log.raises') seat = entry.seat
  }
  return seat
}

const OUT_LABEL = {
  flush: 'para color',
  straight: 'para escalera',
  'full-house': 'para full o póker',
  trips: 'para trío',
  'two-pair': 'para doble pareja',
  overcard: 'para top pair (overcards)',
} as const

function potOddsQuestion(toCall: number, pot: number): GuidedQuestion {
  const required = Math.round((toCall / (pot + toCall)) * 100)
  return {
    id: 'pot-odds',
    prompt: `Te piden ${toCall} para un bote de ${pot}. ¿Qué equity mínima necesitas para pagar?`,
    ...numericOptions(required, [15, 20, 25, 30, 33, 40, 50].map(v => (v === required ? v + 3 : v)), v => `${v}%`),
    explanation: `Pot odds = lo que pagas / (bote + lo que pagas) = ${toCall} / ${pot + toCall} ≈ ${required}%. Con menos equity que eso, pagar pierde a largo plazo.`,
  }
}
