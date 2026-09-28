// ──────────────────────────────────────────────
// useTableGame — puente entre el motor y React.
// El motor es puro; este hook le pone el tiempo:
// turnos de los rivales con pausa realista, reparto
// de la siguiente mano, análisis del coach y
// registro en el expediente del estudiante.
//
// Quién mueve a los rivales depende de la
// configuración del backend (POKER_AI_ENABLED):
//  · bots → el motor local, determinista y gratis.
//  · ia   → un modelo (llama.cpp local o API de
//           terceros), con caída a los bots si falla.
// La mesa se juega igual en los dos casos.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeDecision,
  applyAction,
  cardToString,
  createRng,
  createTable,
  decideBotAction,
  legalActions,
  startHand,
  totalPot,
  BOT_NAMES,
  DIFFICULTY_LINEUPS,
  type Advice,
  type DifficultyId,
  type PlayerAction,
  type Rng,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { buildSnapshot } from './snapshot'
import {
  fetchAiStatus,
  requestAiDecision,
  requestAiReview,
  type AiReview,
  type AiStatus,
} from '@services/poker-ai'
import { pushEvents, type TableEvent } from './events'
import { useChipFormat } from './TableDisplayContext'
import { biasHeroHand } from './handBias'
import {
  EMPTY_SESSION,
  findDrill,
  preflopAggressorSeat,
  type DrillCheck,
  type DrillId,
  type DrillSession,
} from './drills'

export const HERO_ID = 'hero'

export type GameSpeed = 'slow' | 'normal' | 'fast'

/** Quién controla a los rivales. `ai` solo es posible si el backend la ofrece. */
export type OpponentMode = 'bots' | 'ai'

/**
 * Quién corrige al estudiante.
 *  · `engine` → el motor: instantáneo, sin conexión y siempre disponible.
 *  · `ai`     → además, un modelo explica la jugada con sus palabras.
 * El motor se ejecuta SIEMPRE: la IA añade, no sustituye. Si el modelo falla,
 * la corrección sigue estando ahí.
 */
export type CorrectionMode = 'engine' | 'ai'

export interface TableSettings {
  /** Jugadores en la mesa, 2..9. */
  seats: number
  difficulty: DifficultyId
  smallBlind: number
  bigBlind: number
  startingStack: number
  speed: GameSpeed
  /** Muestra el análisis del coach tras cada decisión. */
  trainingMode: boolean
  /** Reparte la mano siguiente automáticamente. */
  autoDeal: boolean
  /** Motor de los rivales: bots del engine o modelo de IA. */
  opponentMode: OpponentMode
  /** Entrenamiento activo; `free` es jugar sin objetivo. */
  drillId: DrillId
  /** Quién corrige las decisiones del estudiante. */
  correctionMode: CorrectionMode
  /**
   * Reparto sesgado: más manos de tu rango para practicar las decisiones que
   * importan. Apagado, el reparto es puramente aleatorio.
   */
  actionHands: boolean
  /** Porcentaje de manos dentro del rango de tu posición (0..100). */
  actionHandsPercent: number
  /**
   * Preguntas guiadas antes de cada decisión ("piensa antes de actuar").
   * Algunos entrenamientos (la práctica integral) las activan siempre.
   */
  guided: boolean
}

/**
 * Modo de rivales por defecto, desde el `.env` del frontend
 * (`VITE_POKER_AI_DEFAULT=true`). Solo es una preferencia: si el backend no
 * ofrece IA, la mesa se queda en bots igualmente.
 */
const DEFAULT_OPPONENT_MODE: OpponentMode =
  import.meta.env.VITE_POKER_AI_DEFAULT === 'true' ? 'ai' : 'bots'

export const DEFAULT_SETTINGS: TableSettings = {
  seats: 6,
  difficulty: 'beginner',
  smallBlind: 25,
  bigBlind: 50,
  startingStack: 5000,
  speed: 'normal',
  trainingMode: true,
  autoDeal: true,
  opponentMode: DEFAULT_OPPONENT_MODE,
  drillId: 'free',
  correctionMode: 'engine',
  actionHands: true,
  actionHandsPercent: 70,
  guided: false,
}

/** Reparte la mano siguiente aplicando, si está activo, el reparto sesgado. */
function dealHand(table: TableState, settings: TableSettings, rng: Rng): TableState {
  const next = startHand(table)
  if (!settings.actionHands) return next
  return biasHeroHand(next, HERO_ID, settings.actionHandsPercent / 100, rng)
}

const THINK_MS: Record<GameSpeed, number> = { slow: 1700, normal: 950, fast: 350 }
const NEXT_HAND_MS: Record<GameSpeed, number> = { slow: 4200, normal: 2800, fast: 1400 }

/** Lo que dijo el último rival cuando lo mueve la IA. */
export interface OpponentNote {
  playerId: string
  playerName: string
  reasoning?: string
  mood?: string
  source: 'ai' | 'fallback'
  model?: string
  latencyMs?: number
}

/** Construye los asientos: el estudiante abajo y los rivales del nivel elegido. */
function buildSeats(settings: TableSettings): SeatSetup[] {
  const lineup = DIFFICULTY_LINEUPS[settings.difficulty] ?? DIFFICULTY_LINEUPS.beginner
  const bots: SeatSetup[] = Array.from({ length: settings.seats - 1 }, (_, i) => ({
    id: 'bot-' + i,
    name: BOT_NAMES[i % BOT_NAMES.length],
    isHuman: false,
    botProfile: lineup[i % lineup.length],
  }))

  return [{ id: HERO_ID, name: 'Tú', isHuman: true }, ...bots]
}

function createFreshTable(settings: TableSettings, seed: number): TableState {
  return createTable(
    {
      smallBlind: settings.smallBlind,
      bigBlind: settings.bigBlind,
      startingStack: settings.startingStack,
      ante: 0,
    },
    buildSeats(settings),
    seed,
  )
}

const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms))

/**
 * Lo que el estudiante ve tras cada decisión suya.
 * El análisis del motor está siempre; la revisión de la IA llega después, si
 * está activada, y se añade encima sin borrar nada.
 */
export interface DecisionFeedback {
  /** Análisis del motor: equity, pot odds y veredicto. */
  advice: Advice
  /** Veredicto del entrenamiento activo, si evaluó esta decisión. */
  drill: DrillCheck | null
  /** Explicación de la IA; `null` mientras llega o si no está activada. */
  review: AiReview | null
  /** La IA está pensando la corrección. */
  pending: boolean
  /** Mano y calle en las que se tomó, para no mezclar correcciones. */
  handNumber: number
}

export interface TableGame {
  state: TableState
  settings: TableSettings
  updateSettings: (patch: Partial<TableSettings>) => void
  /** Acciones legales del estudiante, o `null` si no es su turno. */
  legal: ReturnType<typeof legalActions>
  advice: Advice | null
  isHeroTurn: boolean
  /** Un rival está "pensando": se usa para atenuar los controles. */
  thinking: boolean
  /** Progreso del turno actual, 0..1, para la barra del asiento. */
  turnProgress: number | null
  handOver: boolean
  /** El estudiante se quedó sin fichas. */
  busted: boolean
  /** Eventos recientes de la mesa, para los avisos visuales. */
  events: TableEvent[]
  /** Fichas ganadas o perdidas por el estudiante en la mano terminada. */
  heroDelta: number | null
  /** Estado de la IA del backend; `null` mientras se consulta o si no hay backend. */
  aiStatus: AiStatus | null
  /** La IA está moviendo a los rivales ahora mismo. */
  aiActive: boolean
  /** Lo último que "pensó" un rival movido por IA. */
  opponentNote: OpponentNote | null
  /** Corrección de la última decisión del estudiante. */
  feedback: DecisionFeedback | null
  /** Progreso de la sesión de entrenamiento. */
  session: DrillSession
  /** Cambia de entrenamiento y aplica su configuración de mesa. */
  setDrill: (id: DrillId) => void
  /** Reinicia el marcador del entrenamiento sin tocar la mesa. */
  resetSession: () => void
  act: (action: PlayerAction) => void
  dealNext: () => void
  restart: () => void
}

export function useTableGame(initial: Partial<TableSettings> = {}): TableGame {
  const { recordHand, recordDecision } = useStudentProgress()

  const [settings, setSettings] = useState<TableSettings>({ ...DEFAULT_SETTINGS, ...initial })
  const [state, setState] = useState<TableState>(() =>
    dealHand(
      createFreshTable({ ...DEFAULT_SETTINGS, ...initial }, Date.now() >>> 0),
      { ...DEFAULT_SETTINGS, ...initial },
      createRng(),
    ),
  )
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [turnProgress, setTurnProgress] = useState<number | null>(null)
  const [events, setEvents] = useState<TableEvent[]>([])
  const [heroDelta, setHeroDelta] = useState<number | null>(null)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [opponentNote, setOpponentNote] = useState<OpponentNote | null>(null)
  const [feedback, setFeedback] = useState<DecisionFeedback | null>(null)
  const [session, setSession] = useState<DrillSession>(() => ({
    ...EMPTY_SESSION,
    drillId: initial.drillId ?? DEFAULT_SETTINGS.drillId,
  }))

  const rng = useRef(createRng())
  // La mano siguiente se reparte desde callbacks estables: leen los ajustes
  // vigentes de aquí en lugar de capturarlos.
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  const heroStackAtStart = useRef(state.players[0]?.stack ?? 0)
  const heroWasVoluntary = useRef(false)
  const recordedHand = useRef(-1)
  const seenLogEntries = useRef(0)
  /** Identifica la corrección en curso para descartar respuestas tardías. */
  const reviewToken = useRef(0)

  const hero = state.players.find(p => p.id === HERO_ID)
  const isHeroTurn = hero !== undefined && state.actingSeat === hero.seat
  const handOver = state.street === 'complete'
  const busted = (hero?.stack ?? 0) <= 0 && handOver

  const legal = useMemo(() => (isHeroTurn ? legalActions(state) : null), [state, isHeroTurn])

  // ── ¿Hay IA disponible? ──
  // Una sola consulta al abrir la mesa. Si el backend no está o la IA está
  // apagada, `aiStatus` queda en null/no-ready y todo sigue con los bots.
  useEffect(() => {
    let cancelled = false
    fetchAiStatus()
      .then(status => {
        if (!cancelled) setAiStatus(status)
      })
      .catch(() => {
        if (!cancelled) setAiStatus(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const aiReady = aiStatus?.ready === true
  const aiActive = aiReady && settings.opponentMode === 'ai'

  /** Rivales que mueve la IA; los que sobran del límite siguen con el motor. */
  const aiSeatIds = useMemo(() => {
    if (!aiActive) return new Set<string>()
    const limit = aiStatus?.maxAiSeats ?? 8
    return new Set(
      state.players
        .filter(player => !player.isHuman)
        .slice(0, limit)
        .map(player => player.id),
    )
  }, [aiActive, aiStatus?.maxAiSeats, state.players])

  // ── Eventos de la mesa ──
  // Se derivan del log del motor: así el aviso visual y el historial cuentan
  // exactamente lo mismo, sin un segundo camino que pueda desincronizarse.
  // Los avisos se redactan en la unidad del estudiante (fichas o BB).
  const formatChips = useChipFormat(state.config.bigBlind)
  useEffect(() => {
    if (state.log.length < seenLogEntries.current) {
      // Mano nueva: el log se reinicia.
      seenLogEntries.current = 0
      setEvents([])
    }
    if (state.log.length === seenLogEntries.current) return

    const fresh = state.log.slice(seenLogEntries.current)
    seenLogEntries.current = state.log.length
    setEvents(current => pushEvents(current, state, fresh, HERO_ID, formatChips))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // ── Turno de los rivales ──
  useEffect(() => {
    if (handOver || state.actingSeat === null) return
    const acting = state.players.find(p => p.seat === state.actingSeat)
    if (!acting || acting.isHuman) {
      setTurnProgress(null)
      return
    }

    let cancelled = false
    const total = THINK_MS[settings.speed]
    const startedAt = Date.now()
    setTurnProgress(1)

    const ticker = window.setInterval(() => {
      setTurnProgress(Math.max(0, 1 - (Date.now() - startedAt) / total))
    }, 60)

    /** Decisión local del motor: el camino por defecto y el de emergencia. */
    const localDecision = (): PlayerAction => {
      try {
        return decideBotAction(state, rng.current).action
      } catch {
        const fallback = legalActions(state)
        if (!fallback) return { type: 'fold' }
        return fallback.canCheck ? { type: 'check' } : { type: 'fold' }
      }
    }

    const play = async () => {
      let action: PlayerAction | null = null

      if (aiSeatIds.has(acting.id)) {
        const snapshot = buildSnapshot(state, acting)
        if (snapshot) {
          const decision = await requestAiDecision(snapshot).catch(() => null)
          if (cancelled) return
          if (decision) {
            action = decision.action as PlayerAction
            setOpponentNote({
              playerId: acting.id,
              playerName: acting.name,
              reasoning: decision.reasoning,
              mood: decision.mood,
              source: decision.source === 'ai' ? 'ai' : 'fallback',
              model: decision.model,
              latencyMs: decision.latencyMs,
            })
          }
        }
      }

      // Pensar tiene un mínimo de tiempo aunque la respuesta llegue antes: sin
      // esa pausa la mesa se vuelve ilegible.
      const elapsed = Date.now() - startedAt
      if (elapsed < total) await sleep(total - elapsed)
      if (cancelled) return

      const chosen = action ?? localDecision()

      setState(current => {
        try {
          return applyAction(current, chosen)
        } catch {
          // El estado avanzó mientras la IA pensaba: se resuelve con lo legal.
          const fallback = legalActions(current)
          if (!fallback) return current
          return applyAction(current, fallback.canCheck ? { type: 'check' } : { type: 'fold' })
        }
      })
    }

    void play()

    return () => {
      cancelled = true
      window.clearInterval(ticker)
    }
  }, [state, settings.speed, handOver, aiSeatIds])

  // ── Registro de la mano terminada ──
  useEffect(() => {
    if (!handOver || !hero || state.handNumber === recordedHand.current) return
    if (state.handNumber === 0) return
    recordedHand.current = state.handNumber

    const showdownEntry = state.outcome?.showdown.find(entry => entry.playerId === HERO_ID)
    const net = hero.stack - heroStackAtStart.current
    setHeroDelta(net)
    setSession(current => ({ ...current, handsPlayed: current.handsPlayed + 1 }))

    recordHand(
      {
        id: `${state.seed}-${state.handNumber}`,
        playedAt: new Date().toISOString(),
        seed: state.seed,
        handNumber: state.handNumber,
        seats: state.players.length,
        hole: hero.holeCards.map(cardToString),
        board: state.board.map(cardToString),
        net,
        handName: showdownEntry?.description,
        won: (hero.won ?? 0) > 0,
      },
      heroWasVoluntary.current,
    )
  }, [handOver, hero, state, recordHand])

  // ── Reparto automático de la mano siguiente ──
  useEffect(() => {
    if (!handOver || !settings.autoDeal || busted) return
    const timer = window.setTimeout(() => dealNext(), NEXT_HAND_MS[settings.speed])
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handOver, settings.autoDeal, settings.speed, busted])

  const dealNext = useCallback(() => {
    setState(current => {
      const next = dealHand(current, settingsRef.current, rng.current)
      heroStackAtStart.current = next.players.find(p => p.id === HERO_ID)?.stack ?? 0
      heroWasVoluntary.current = false
      return next
    })
    setAdvice(null)
    setHeroDelta(null)
    setOpponentNote(null)
    // La corrección pertenece a la mano que acaba de terminar.
    reviewToken.current += 1
    setFeedback(null)
  }, [])

  const restart = useCallback(() => {
    const fresh = dealHand(createFreshTable(settings, Date.now() >>> 0), settings, rng.current)
    heroStackAtStart.current = fresh.players.find(p => p.id === HERO_ID)?.stack ?? 0
    heroWasVoluntary.current = false
    recordedHand.current = -1
    seenLogEntries.current = 0
    setState(fresh)
    setAdvice(null)
    setEvents([])
    setHeroDelta(null)
    setOpponentNote(null)
    reviewToken.current += 1
    setFeedback(null)
    setSession({ ...EMPTY_SESSION, drillId: settings.drillId })
  }, [settings])

  const act = useCallback(
    (action: PlayerAction) => {
      if (!isHeroTurn || !hero) return

      if (action.type !== 'fold' && action.type !== 'check') {
        heroWasVoluntary.current = true
      }

      const drill = findDrill(settings.drillId)

      // Un entrenamiento activo ES el modo entrenamiento: se analiza aunque el
      // interruptor general esté apagado, porque si no la sesión no puntúa.
      const analyzing = settings.trainingMode || drill.id !== 'free'

      if (analyzing) {
        // El análisis se calcula ANTES de aplicar la acción: necesita el estado
        // en el que el estudiante tomó la decisión.
        const result = analyzeDecision(state, action, { rng: rng.current })
        setAdvice(result)

        if (result) {
          recordDecision(result.verdict)

          const legal = legalActions(state)
          const aggressorSeat = preflopAggressorSeat(state)

          const check = drill.evaluate({
            state,
            action,
            advice: result,
            hero,
            position: result.position,
            street: state.street,
            isPreflopAggressor: aggressorSeat === hero.seat,
            toCall: legal?.callAmount ?? 0,
            canCheck: legal?.canCheck ?? false,
          })

          // El marcador del entrenamiento solo cuenta lo que el entrenamiento
          // evalúa: una sesión de pot odds no puntúa manos sin apuesta enfrente.
          if (check) {
            setSession(current => {
              const streak = check.ok ? current.streak + 1 : 0
              return {
                ...current,
                evaluated: current.evaluated + 1,
                correct: current.correct + (check.ok ? 1 : 0),
                mistakes: current.mistakes + (check.ok ? 0 : 1),
                streak,
                bestStreak: Math.max(current.bestStreak, streak),
              }
            })
          }

          const wantsAiReview =
            settings.correctionMode === 'ai' && aiStatus?.ready === true

          setFeedback({
            advice: result,
            drill: check,
            review: null,
            pending: wantsAiReview,
            handNumber: state.handNumber,
          })

          // ── Revisión de la IA ──
          // Llega después y se añade encima: la corrección del motor ya está
          // en pantalla, así que un modelo lento no deja al alumno esperando.
          if (wantsAiReview) {
            const token = ++reviewToken.current
            const snapshot = buildSnapshot(state, hero)

            if (snapshot) {
              void requestAiReview({
                snapshot,
                action: { type: action.type, amount: action.amount },
                engine: {
                  verdict: result.verdict,
                  equity: result.equity,
                  required: result.required,
                  recommended: result.recommended,
                  message: check?.message,
                  chen: result.chen,
                },
                focus: drill.focus,
                drillMessage: check?.message,
              })
                .then(review => {
                  if (token !== reviewToken.current) return
                  setFeedback(current =>
                    current ? { ...current, review, pending: false } : current,
                  )
                })
                .catch(() => {
                  if (token !== reviewToken.current) return
                  setFeedback(current => (current ? { ...current, pending: false } : current))
                })
            } else {
              setFeedback(current => (current ? { ...current, pending: false } : current))
            }
          }
        }
      }

      setState(current => applyAction(current, action))
    },
    [
      isHeroTurn,
      hero,
      state,
      settings.trainingMode,
      settings.drillId,
      settings.correctionMode,
      aiStatus?.ready,
      recordDecision,
    ],
  )

  const updateSettings = useCallback(
    (patch: Partial<TableSettings>) => {
      const next = { ...settings, ...patch }
      setSettings(next)

      // Cambiar asientos, rivales, ciegas o stack obliga a rehacer la mesa:
      // no tendría sentido aplicar esos cambios a mitad de una mano.
      const rebuild =
        patch.seats !== undefined ||
        patch.difficulty !== undefined ||
        patch.smallBlind !== undefined ||
        patch.bigBlind !== undefined ||
        patch.startingStack !== undefined

      if (!rebuild) return

      const fresh = dealHand(createFreshTable(next, Date.now() >>> 0), next, rng.current)
      heroStackAtStart.current = fresh.players.find(p => p.id === HERO_ID)?.stack ?? 0
      heroWasVoluntary.current = false
      recordedHand.current = -1
      seenLogEntries.current = 0
      setState(fresh)
      setAdvice(null)
      setEvents([])
      setHeroDelta(null)
    },
    [settings],
  )

  /**
   * Cambia de entrenamiento. Cada uno trae la mesa que mejor lo expone
   * (la posición preflop se entrena en mesa de 9, no heads-up), así que
   * aplicar el entrenamiento reparte una mano nueva.
   */
  const setDrill = useCallback(
    (id: DrillId) => {
      const drill = findDrill(id)
      reviewToken.current += 1
      setFeedback(null)
      setSession({ ...EMPTY_SESSION, drillId: id })
      updateSettings({
        drillId: id,
        ...(drill.setup.seats ? { seats: drill.setup.seats } : {}),
        ...(drill.setup.difficulty ? { difficulty: drill.setup.difficulty } : {}),
        // Un entrenamiento sin análisis no enseña nada.
        ...(id !== 'free' ? { trainingMode: true } : {}),
      })
    },
    [updateSettings],
  )

  const resetSession = useCallback(() => {
    reviewToken.current += 1
    setFeedback(null)
    setSession({ ...EMPTY_SESSION, drillId: settings.drillId })
  }, [settings.drillId])

  return {
    state,
    settings,
    updateSettings,
    legal,
    advice,
    isHeroTurn,
    thinking: !isHeroTurn && !handOver,
    turnProgress,
    handOver,
    busted,
    events,
    heroDelta,
    aiStatus,
    aiActive,
    opponentNote,
    feedback,
    session,
    setDrill,
    resetSession,
    act,
    dealNext,
    restart,
  }
}

/** Bote total de la mano en curso — atajo para la barra de acciones. */
export function currentPot(state: TableState): number {
  return totalPot(state)
}
