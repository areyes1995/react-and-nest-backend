// ──────────────────────────────────────────────
// Poker AI API — rivales controlados por un modelo.
// El backend decide si hay IA (POKER_AI_ENABLED); aquí
// solo se pregunta y se traduce la respuesta. Ninguna
// llamada puede tumbar la mesa: si algo falla se
// devuelve `null` y el motor local sigue jugando.
// ──────────────────────────────────────────────

import { get, post } from './api'
import { translateContent } from './translate'

export type AiDecisionSource = 'ai' | 'fallback' | 'bots'

export interface AiStatus {
  /** La IA está encendida y bien configurada. */
  ready: boolean
  enabled: boolean
  provider: string
  model: string
  baseUrl: string
  hasApiKey: boolean
  maxAiSeats: number
  fallbackToBots: boolean
  /** Qué falta por configurar, en lenguaje llano. */
  issues: string[]
  reachable?: boolean
  reachableError?: string
}

export interface AiLegalActions {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number
  canBet: boolean
  canRaise: boolean
  minRaiseTo: number
  maxRaiseTo: number
}

export interface AiSnapshot {
  playerId: string
  playerName: string
  profile: string
  street: 'preflop' | 'flop' | 'turn' | 'river'
  hole: string[]
  board: string[]
  position: string
  stack: number
  pot: number
  currentBet: number
  committed: number
  bigBlind: number
  smallBlind: number
  handNumber: number
  legal: AiLegalActions
  opponents: {
    name: string
    stack: number
    committed: number
    status: string
    position: string
    lastAction?: string
  }[]
  history: string[]
  hint?: { equity?: number; potOdds?: number; notation?: string }
}

export interface AiDecision {
  source: AiDecisionSource
  action: { type: 'fold' | 'check' | 'call' | 'bet' | 'raise'; amount?: number }
  reasoning?: string
  mood?: string
  model?: string
  provider?: string
  latencyMs?: number
  adjusted?: boolean
  error?: string
}

/** Estado de la IA. Devuelve `null` si el backend no responde. */
export async function fetchAiStatus(probe = false): Promise<AiStatus | null> {
  const res = await get<AiStatus>('/poker/ai/status', probe ? { probe: true } : undefined)
  return res.ok ? res.data : null
}

/**
 * Pide la jugada de un rival. `null` significa "decide tú": la IA está apagada,
 * el backend no está o la respuesta no sirvió.
 */
export async function requestAiDecision(snapshot: AiSnapshot): Promise<AiDecision | null> {
  const res = await post<AiDecision>('/poker/ai/decide', snapshot)
  if (!res.ok || !res.data?.action) return null
  if (res.data.source === 'bots') return null
  // La IA razona en español: el historial de la mano lo muestra en el idioma de Ajustes.
  return translateContent(res.data)
}

// ─── Corrección de una decisión del estudiante ───

export type ReviewVerdict = 'good' | 'ok' | 'mistake'

export interface AiReviewRequest {
  /** La situación tal y como estaba antes de actuar. */
  snapshot: AiSnapshot
  action: { type: 'fold' | 'check' | 'call' | 'bet' | 'raise'; amount?: number }
  engine: {
    verdict: ReviewVerdict
    equity: number
    required: number
    recommended: string
    message?: string
    chen?: number
  }
  /** Qué se está entrenando, para que la corrección vaya al grano. */
  focus?: string
  /** Veredicto del entrenamiento concreto, si lo hubo. */
  drillMessage?: string
}

export interface AiReview {
  source: 'ai' | 'engine'
  verdict: ReviewVerdict
  headline?: string
  explanation?: string
  suggestion?: string
  model?: string
  provider?: string
  latencyMs?: number
  error?: string
}

/**
 * Pide a la IA que explique una decisión.
 * `null` significa "quédate con el análisis del motor": la IA está apagada, no
 * hay backend o la respuesta no sirvió. La corrección nunca se pierde.
 */
export async function requestAiReview(request: AiReviewRequest): Promise<AiReview | null> {
  const res = await post<AiReview>('/poker/ai/review', request)
  if (!res.ok || !res.data) return null
  if (res.data.source !== 'ai') return null
  return translateContent(res.data)
}
