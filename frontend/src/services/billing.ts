// ──────────────────────────────────────────────
// Billing API — suscripciones y checkout.
//
// Con backend, él decide (ver backend/src/modules/
// billing/config/billing.config.ts): sin
// PAYMENTS_LIVE ni PAYMENTS_PROVIDER en su .env los
// pagos van en MODO SIMULADO y la compra se completa
// sin cobrar.
//
// En modo mock (VITE_MOCK_ENABLED=true, sin backend)
// se aplican las mismas reglas con las variables del
// .env del frontend:
//   VITE_PAYMENTS_LIVE=true
//   VITE_PAYMENTS_PROVIDER=stripe|paypal|google
// y la suscripción se guarda en este navegador.
//
// Nunca se envían los datos completos de la tarjeta:
// con una pasarela real van directos a ella (Stripe
// Elements, botones de PayPal, Google Pay).
// ──────────────────────────────────────────────

import { get, post, MOCK_ENABLED } from './api'
import { chargeFor, type BillingCycle, type PaidPlanId } from '@features/pricing/plans'

export type PaymentProviderId = 'stripe' | 'paypal' | 'google'
export type PaymentsMode = 'simulated' | 'live'
export type CheckoutMethod = 'card' | 'paypal' | 'google'

export const PROVIDER_LABEL: Record<PaymentProviderId, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  google: 'Google Pay',
}

export interface BillingConfig {
  mode: PaymentsMode
  provider: PaymentProviderId | null
  /** Se puede completar una compra: modo simulado o pasarela integrada. */
  ready: boolean
}

export interface Subscription {
  id: number
  planId: PaidPlanId
  cycle: BillingCycle
  status: 'active' | 'canceled'
  provider: string
  method: CheckoutMethod | string
  amount: number
  currency: string
  currentPeriodEnd: string
  canceledAt: string | null
  createdAt: string
}

export interface SubscriptionState {
  subscription: Subscription | null
  persisted: boolean
}

export interface CheckoutRequest {
  planId: PaidPlanId
  cycle: BillingCycle
  method: CheckoutMethod
  /** Solo para el recibo en modo simulado. */
  cardLast4?: string
}

export type CheckoutResult =
  | { ok: true; subscription: Subscription }
  | { ok: false; error: string }

// ─── Modo mock ───────────────────────────────

const PROVIDERS: PaymentProviderId[] = ['stripe', 'paypal', 'google']
/** Pasarelas integradas en el frontend. Vacío: ninguna todavía. */
const INTEGRATED_PROVIDERS = new Set<PaymentProviderId>()

/** Mismas reglas que el backend, leídas de las variables del frontend. */
export function readMockBillingConfig(env: Record<string, unknown> = import.meta.env): BillingConfig {
  const raw = String(env.VITE_PAYMENTS_PROVIDER ?? '').trim().toLowerCase()
  const provider = PROVIDERS.includes(raw as PaymentProviderId) ? (raw as PaymentProviderId) : null
  const live = String(env.VITE_PAYMENTS_LIVE ?? '').trim().toLowerCase() === 'true'
  const mode: PaymentsMode = live || provider ? 'live' : 'simulated'
  return {
    mode,
    provider,
    ready: mode === 'simulated' || (provider !== null && INTEGRATED_PROVIDERS.has(provider)),
  }
}

const mockKey = (userId: string) => `billing:subscription:${userId}`

function readMock(userId: string): Subscription | null {
  try {
    const raw = localStorage.getItem(mockKey(userId))
    if (!raw) return null
    const sub = JSON.parse(raw) as Subscription
    const alive = sub.status === 'active' && new Date(sub.currentPeriodEnd).getTime() > Date.now()
    return alive ? sub : null
  } catch {
    return null
  }
}

function writeMock(userId: string, sub: Subscription | null): void {
  try {
    if (sub) localStorage.setItem(mockKey(userId), JSON.stringify(sub))
    else localStorage.removeItem(mockKey(userId))
  } catch {
    // Almacenamiento bloqueado: la suscripción dura lo que la pestaña.
  }
}

/** Motivo por el que no se puede cobrar con esta configuración. */
export function notReadyMessage(config: BillingConfig): string {
  if (!config.provider) {
    return 'Los pagos reales están activados pero no hay pasarela configurada (Stripe, PayPal o Google Pay).'
  }
  return `La pasarela ${PROVIDER_LABEL[config.provider]} todavía no está integrada: no se puede cobrar.`
}

// ─── API ─────────────────────────────────────

export async function fetchBillingConfig(): Promise<BillingConfig> {
  if (MOCK_ENABLED) return readMockBillingConfig()
  const res = await get<BillingConfig>('/billing/config')
  // Sin respuesta del backend no se sabe si se puede cobrar: nada se completa.
  return res.ok && res.data ? res.data : { mode: 'live', provider: null, ready: false }
}

export async function fetchSubscription(userId: string): Promise<SubscriptionState> {
  if (MOCK_ENABLED) return { subscription: readMock(userId), persisted: true }
  const res = await get<SubscriptionState>('/billing/subscription')
  return res.ok && res.data ? res.data : { subscription: null, persisted: false }
}

export async function checkout(userId: string, request: CheckoutRequest): Promise<CheckoutResult> {
  if (MOCK_ENABLED) {
    const config = readMockBillingConfig()
    if (!config.ready) return { ok: false, error: notReadyMessage(config) }
    const now = new Date()
    const end = new Date(now)
    if (request.cycle === 'annual') end.setFullYear(end.getFullYear() + 1)
    else end.setMonth(end.getMonth() + 1)
    const subscription: Subscription = {
      id: now.getTime(),
      planId: request.planId,
      cycle: request.cycle,
      status: 'active',
      provider: 'simulated',
      method: request.method,
      amount: chargeFor(request.planId, request.cycle),
      currency: 'USD',
      currentPeriodEnd: end.toISOString(),
      canceledAt: null,
      createdAt: now.toISOString(),
    }
    writeMock(userId, subscription)
    return { ok: true, subscription }
  }

  const res = await post<SubscriptionState>('/billing/checkout', request)
  if (!res.ok || !res.data?.subscription) {
    return { ok: false, error: res.error || 'No se pudo completar el pago.' }
  }
  return { ok: true, subscription: res.data.subscription }
}

export async function cancelSubscription(userId: string): Promise<boolean> {
  if (MOCK_ENABLED) {
    writeMock(userId, null)
    return true
  }
  const res = await post<SubscriptionState>('/billing/cancel')
  return res.ok
}
