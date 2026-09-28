// ──────────────────────────────────────────────
// CheckoutPage — comprar un plan.
// Se llega desde las tarjetas de planes de la landing
// (/checkout/premium?cycle=annual) o desde cualquier
// muro de pago de la academia.
//
// Hace falta sesión: la suscripción se ata a la
// cuenta. Sin ella se pasa por /login y se vuelve
// aquí con el mismo plan y ciclo.
//
// Los datos de la tarjeta no salen del navegador: en
// modo simulado solo se valida el formato y se
// guardan los 4 últimos dígitos para el recibo; con
// una pasarela real se sustituirán por sus campos
// alojados (Stripe Elements, botones de PayPal,
// Google Pay), que cobran sin pasar por nuestro
// servidor.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  FlaskConical,
  Lock,
  PartyPopper,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { clearRedirect, rememberRedirect } from '@services/auth-redirect'
import { notReadyMessage, type CheckoutMethod } from '@services/billing'
import { useAccess } from '@features/access/AccessContext'
import {
  CURRENCY_SYMBOL,
  PLANS,
  annualSaving,
  chargeFor,
  findPlan,
  formatPrice,
  isPaidPlanId,
  type BillingCycle,
  type PaidPlanId,
} from '@features/pricing/plans'
import { LoadingScreen } from '../../routes/guards'

const METHODS: { id: CheckoutMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'google', label: 'Google Pay', icon: Smartphone },
]

const PAID_PLANS = PLANS.filter(plan => isPaidPlanId(plan.id))

// ─── Validación de la tarjeta (solo formato) ───

/** Algoritmo de Luhn: detecta erratas en el número, no si la tarjeta existe. */
export function luhnValid(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/** MM/AA en el futuro (la tarjeta vale hasta el último día de ese mes). */
export function expiryValid(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  return new Date(year, month, 1) > now
}

const groupCard = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--poker-gold)] focus:outline-none'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-caption font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
      {error && <span className="block text-caption text-red-400">{error}</span>}
    </label>
  )
}

export default function CheckoutPage() {
  const { planId: rawPlan } = useParams()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, user } = useAuth()
  const access = useAccess()

  const planId: PaidPlanId = isPaidPlanId(rawPlan) ? rawPlan : 'premium'
  const cycle: BillingCycle = params.get('cycle') === 'monthly' ? 'monthly' : 'annual'
  const plan = findPlan(planId)!

  const [method, setMethod] = useState<CheckoutMethod>('card')
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' })
  const [paypalEmail, setPaypalEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const total = chargeFor(planId, cycle)
  const billing = access.billing
  const simulated = billing?.mode === 'simulated'
  const canPay = billing?.ready === true

  const errors = useMemo(() => {
    if (method === 'card') {
      const digits = card.number.replace(/\s/g, '')
      return {
        name: card.name.trim().length < 3 ? 'Escribe el nombre como aparece en la tarjeta.' : undefined,
        number: luhnValid(digits) ? undefined : 'El número de tarjeta no es válido.',
        expiry: expiryValid(card.expiry) ? undefined : 'Fecha no válida o caducada (MM/AA).',
        cvc: /^\d{3,4}$/.test(card.cvc) ? undefined : 'CVC de 3 o 4 dígitos.',
      }
    }
    if (method === 'paypal') {
      return { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail) ? undefined : 'Correo de PayPal no válido.' }
    }
    return {}
  }, [method, card, paypalEmail])
  const formValid = Object.values(errors).every(value => !value)

  // Ya se volvió del login: que el próximo inicio de sesión no traiga aquí.
  useEffect(() => {
    if (isAuthenticated) clearRedirect()
  }, [isAuthenticated])

  // Sin sesión: primero entrar, y volver aquí con el mismo plan.
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    rememberRedirect(location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  if (rawPlan !== planId) return <Navigate to={`/checkout/${planId}?cycle=${cycle}`} replace />

  const setPlan = (id: PaidPlanId) => navigate(`/checkout/${id}?cycle=${cycle}`, { replace: true })
  const setCycle = (value: BillingCycle) => setParams({ cycle: value }, { replace: true })
  const current = access.subscription
  const samePlan = current?.planId === planId && current.cycle === cycle

  async function pay(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setError(null)
    if (!formValid || !canPay) return
    setSubmitting(true)
    const result = await access.checkout({
      planId,
      cycle,
      method,
      cardLast4: method === 'card' ? card.number.replace(/\s/g, '').slice(-4) : undefined,
    })
    setSubmitting(false)
    if (result.ok) setDone(true)
    else setError(result.error)
  }

  // ── Compra completada ──
  if (done && current) {
    return (
      <div className="min-h-dvh bg-[var(--bg-app)] px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <PartyPopper className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-[var(--text-primary)]">¡Ya tienes {plan.name}!</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Todos los cursos y herramientas están desbloqueados. Tu plan se renueva el{' '}
            {new Date(current.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
          {current.provider === 'simulated' && (
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-caption text-amber-300">
              Pago simulado: no se ha cobrado nada.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/app/home"
              className="press rounded-xl px-5 py-3 text-sm font-bold text-[#1a1206]"
              style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
            >
              Ir a la academia
            </Link>
            <Link to="/app/subscription" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Ver mi suscripción
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-app)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/#planes" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" />
            Volver a los planes
          </Link>
          <span className="flex items-center gap-1.5 text-caption text-[var(--text-muted)]">
            <Lock className="h-3.5 w-3.5" />
            {user?.email}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">Completa tu suscripción</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Premium y Gold desbloquean todos los cursos, la mesa de práctica y todas las herramientas.
        </p>

        {/* ── Modo de los pagos ── */}
        {billing && simulated && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <b>Modo de prueba.</b> No hay pasarela de pago conectada: al pagar no se cobra nada y la
              suscripción se activa al momento.
            </p>
          </div>
        )}
        {billing && !canPay && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <b>Pagos no disponibles.</b> {notReadyMessage(billing)}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* ── Plan ── */}
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tu plan</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Plan">
              {PAID_PLANS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={option.id === planId}
                  onClick={() => setPlan(option.id as PaidPlanId)}
                  className={`rounded-xl border p-3 text-left transition ${
                    option.id === planId
                      ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/10'
                      : 'border-[var(--border)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[var(--text-primary)]">{option.name}</span>
                  <span className="block text-caption text-[var(--text-muted)]">
                    {CURRENCY_SYMBOL}
                    {formatPrice(option.price[cycle])}/mes
                  </span>
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1" role="group" aria-label="Ciclo de facturación">
              {(
                [
                  ['monthly', 'Mensual'],
                  ['annual', `Anual · −${annualSaving(plan)}%`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cycle === value}
                  onClick={() => setCycle(value)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                    cycle === value ? 'bg-[var(--bg-panel)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ul className="space-y-2 border-t border-[var(--border)] pt-4">
              {plan.includes.map(item => (
                <li key={item} className="flex items-start gap-2 text-[0.8125rem] text-[var(--text-secondary)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="space-y-1 border-t border-[var(--border)] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total hoy</span>
                <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                  {CURRENCY_SYMBOL}
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-caption text-[var(--text-muted)]">
                {cycle === 'annual'
                  ? `Un pago al año (${CURRENCY_SYMBOL}${formatPrice(plan.price.annual)}/mes). Cancelas cuando quieras.`
                  : 'Se renueva cada mes. Cancelas cuando quieras.'}
              </p>
            </div>

            {current && (
              <p className="rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-caption text-[var(--text-secondary)]">
                {samePlan
                  ? `Ya tienes este plan activo hasta el ${new Date(current.currentPeriodEnd).toLocaleDateString('es-ES')}.`
                  : `Ahora tienes ${findPlan(current.planId)?.name}: al pagar, este plan lo sustituye.`}
              </p>
            )}
          </section>

          {/* ── Pago ── */}
          <form onSubmit={pay} noValidate className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Método de pago</h2>
            <div className="grid grid-cols-3 gap-2" role="tablist">
              {METHODS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={method === item.id}
                  onClick={() => {
                    setMethod(item.id)
                    setTouched(false)
                    setError(null)
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                    method === item.id
                      ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/10 text-[var(--text-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  {item.label}
                </button>
              ))}
            </div>

            {method === 'card' && (
              <div className="space-y-3">
                <Field label="Nombre del titular" error={touched ? errors.name : undefined}>
                  <input
                    className={inputClass}
                    autoComplete="cc-name"
                    value={card.name}
                    onChange={event => setCard({ ...card, name: event.target.value })}
                    placeholder="Como aparece en la tarjeta"
                  />
                </Field>
                <Field label="Número de tarjeta" error={touched ? errors.number : undefined}>
                  <input
                    className={`${inputClass} tabular-nums`}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={card.number}
                    onChange={event => setCard({ ...card, number: groupCard(event.target.value) })}
                    placeholder="1234 5678 9012 3456"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Caducidad" error={touched ? errors.expiry : undefined}>
                    <input
                      className={`${inputClass} tabular-nums`}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={card.expiry}
                      onChange={event => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
                      placeholder="MM/AA"
                    />
                  </Field>
                  <Field label="CVC" error={touched ? errors.cvc : undefined}>
                    <input
                      className={`${inputClass} tabular-nums`}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvc}
                      onChange={event => setCard({ ...card, cvc: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                    />
                  </Field>
                </div>
                {simulated && (
                  <p className="text-caption text-[var(--text-muted)]">
                    Para probar puedes usar 4242 4242 4242 4242, cualquier fecha futura y cualquier CVC.
                  </p>
                )}
              </div>
            )}

            {method === 'paypal' && (
              <div className="space-y-3">
                <Field label="Correo de tu cuenta PayPal" error={touched ? errors.email : undefined}>
                  <input
                    className={inputClass}
                    type="email"
                    autoComplete="email"
                    value={paypalEmail}
                    onChange={event => setPaypalEmail(event.target.value)}
                    placeholder="tu@correo.com"
                  />
                </Field>
                <p className="text-caption text-[var(--text-muted)]">
                  Con PayPal conectado, aquí se abrirá su ventana para confirmar el pago.
                </p>
              </div>
            )}

            {method === 'google' && (
              <p className="rounded-lg bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                Pagarás con la tarjeta guardada en tu cuenta de Google. Con Google Pay conectado, al pulsar
                pagar se abrirá su ventana para confirmar.
              </p>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !canPay}
              className="press flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#1a1206] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
            >
              <Lock className="h-4 w-4" />
              {submitting
                ? 'Procesando…'
                : `Pagar ${CURRENCY_SYMBOL}${formatPrice(total)}${method === 'paypal' ? ' con PayPal' : method === 'google' ? ' con Google Pay' : ''}`}
            </button>
            <p className="text-center text-caption text-[var(--text-muted)]">
              Los datos de pago no se guardan en la academia.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
