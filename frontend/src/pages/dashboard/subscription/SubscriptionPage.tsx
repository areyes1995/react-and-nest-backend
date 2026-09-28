// ──────────────────────────────────────────────
// SubscriptionPage — tu plan.
// Qué plan tienes, hasta cuándo, y cómo quieres que
// se abran las clases: todas desde el primer día o
// nivel a nivel, al completar el 60% del anterior.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, FlaskConical, LockOpen, Layers } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { useAccess } from '@features/access/AccessContext'
import { CURRENCY_SYMBOL, findPlan, formatPrice } from '@features/pricing/plans'

const METHOD_LABEL: Record<string, string> = { card: 'Tarjeta', paypal: 'PayPal', google: 'Google Pay' }

export function ProgressiveUnlockToggle() {
  const { progressive, setProgressive } = useAccess()
  const options = [
    { value: false, icon: LockOpen, title: 'Todas abiertas', text: 'Entra en cualquier clase de tu plan cuando quieras.' },
    { value: true, icon: Layers, title: 'Desbloqueo progresivo', text: 'Cada nivel se abre al completar el 60% del anterior.' },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Cómo se abren las clases">
      {options.map(option => (
        <button
          key={option.title}
          type="button"
          role="radio"
          aria-checked={progressive === option.value}
          onClick={() => setProgressive(option.value)}
          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
            progressive === option.value
              ? 'border-[var(--poker-gold)] bg-[var(--poker-gold)]/10'
              : 'border-[var(--border)] hover:border-[var(--border-active)]'
          }`}
        >
          <option.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--poker-gold)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">{option.title}</span>
            <span className="block text-caption text-[var(--text-muted)]">{option.text}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export default function SubscriptionPage() {
  const { subscription, isAdmin, cancel } = useAccess()
  const [confirming, setConfirming] = useState(false)
  const plan = subscription ? findPlan(subscription.planId) : findPlan('free')
  const endDate = subscription
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <AcademyPage title="Mi suscripción" subtitle="Tu plan y cómo se abren las clases">
      <div className="max-w-3xl space-y-4">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]">
              <Crown className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Plan actual</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {plan?.name}
                {isAdmin && !subscription && ' · acceso de administrador'}
              </p>
            </div>
            {!subscription && (
              <Link
                to="/checkout/premium"
                className="press rounded-xl px-4 py-2 text-sm font-bold text-[#1a1206]"
                style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
              >
                Suscribirme
              </Link>
            )}
          </div>

          {subscription ? (
            <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
              <p>
                {CURRENCY_SYMBOL}
                {formatPrice(subscription.amount)} {subscription.cycle === 'annual' ? 'al año' : 'al mes'} ·{' '}
                {METHOD_LABEL[subscription.method] ?? subscription.method} · se renueva el {endDate}
              </p>
              {subscription.provider === 'simulated' && (
                <p className="flex items-center gap-2 text-caption text-amber-300">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Suscripción de prueba (pago simulado, sin cobro).
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/checkout/${subscription.planId === 'premium' ? 'gold' : 'premium'}?cycle=${subscription.cycle}`}
                  className="rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cambiar a {subscription.planId === 'premium' ? 'Gold' : 'Premium'}
                </Link>
                {confirming ? (
                  <span className="flex items-center gap-2 text-xs">
                    ¿Seguro? Perderás el acceso a lo de pago.
                    <button
                      type="button"
                      onClick={async () => {
                        await cancel()
                        setConfirming(false)
                      }}
                      className="rounded-lg bg-red-500/15 px-3 py-1.5 font-semibold text-red-300 hover:bg-red-500/25"
                    >
                      Sí, cancelar
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} className="text-[var(--text-muted)] hover:underline">
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-300"
                  >
                    Cancelar suscripción
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
              {isAdmin
                ? 'Como administrador ves todo el contenido sin suscripción.'
                : 'Con el plan gratis tienes los 3 primeros cursos de Fundamentos, la calculadora de equity y la mesa de práctica en modo demostración.'}
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Cómo se abren las clases</h2>
            <p className="text-caption text-[var(--text-muted)]">
              Para quien prefiere avanzar paso a paso: con el desbloqueo progresivo no puedes saltar de nivel
              sin haber hecho la base.
            </p>
          </div>
          <ProgressiveUnlockToggle />
        </section>
      </div>
    </AcademyPage>
  )
}
