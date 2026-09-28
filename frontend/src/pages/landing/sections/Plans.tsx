// ──────────────────────────────────────────────
// Plans — las tarjetas de suscripción.
// En las portadas de streaming el precio no se
// esconde al final: va justo debajo del telón,
// con el ciclo de facturación conmutable y un solo
// plan destacado.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import {
  PLANS,
  CURRENCY_SYMBOL,
  annualSaving,
  annualTotal,
  formatPrice,
  type BillingCycle,
  type Plan,
} from '@features/pricing/plans'
import { Section, SectionHead } from './shared'

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const price = plan.price[cycle]
  const isFree = price === 0
  const saving = annualSaving(plan)

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-[var(--bg-panel)] p-6 ${
        plan.featured
          ? 'landing-featured md:-mt-4 md:mb-[-1rem] md:pb-10 md:pt-10'
          : 'border-[var(--border)]'
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--poker-gold)] px-3 py-1 text-caption font-bold uppercase tracking-wider text-[#1a1206]">
          Más elegido
        </span>
      )}

      <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
      <p className="mt-1 min-h-[2.5rem] text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        {plan.tagline}
      </p>

      {/* ── Precio ── */}
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-[2.5rem] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">
          {CURRENCY_SYMBOL}
          {formatPrice(price)}
        </span>
        {!isFree && (
          <span className="text-sm text-[var(--text-muted)]">/mes</span>
        )}
      </div>

      <p className="mt-2 min-h-[1.25rem] text-xs text-[var(--text-muted)]">
        {isFree ? (
          'Para siempre, sin tarjeta'
        ) : cycle === 'annual' ? (
          <>
            {CURRENCY_SYMBOL}
            {formatPrice(annualTotal(plan))} al año · ahorras {saving}%
          </>
        ) : (
          'Facturado cada mes · cancelas cuando quieras'
        )}
      </p>

      {/* Gratis: crear cuenta / entrar. De pago: al checkout con el ciclo elegido. */}
      <Link
        to={isFree ? '/login' : `/checkout/${plan.id}?cycle=${cycle}`}
        className={`press mt-6 rounded-xl px-5 py-3 text-center text-[0.875rem] font-bold transition-all ${
          plan.featured
            ? 'text-[#1a1206] shadow-[0_8px_26px_rgba(242,169,59,0.3)] hover:brightness-105'
            : 'border border-[var(--border-active)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
        }`}
        style={
          plan.featured
            ? { background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }
            : undefined
        }
      >
        {plan.cta}
      </Link>

      {/* ── Qué incluye ── */}
      <ul className="mt-6 flex flex-col gap-2.5 border-t border-[var(--border)] pt-6">
        {plan.includes.map(item => (
          <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {item}
          </li>
        ))}
        {plan.excludes.map(item => (
          <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Plans() {
  const [cycle, setCycle] = useState<BillingCycle>('annual')

  return (
    <Section id="planes">
      <SectionHead
        centered
        eyebrow="Planes"
        title="Elige cuánto quieres abarcar"
        subtitle="Empieza gratis con los 3 primeros cursos de Fundamentos. Premium y Gold abren todos los cursos y herramientas. Sin permanencia."
      />

      {/* ── Conmutador de ciclo ── */}
      <div className="mb-10 flex justify-center">
        <div
          role="group"
          aria-label="Ciclo de facturación"
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-1"
        >
          {(
            [
              ['monthly', 'Mensual'],
              ['annual', 'Anual'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCycle(value)}
              aria-pressed={cycle === value}
              className={`rounded-lg px-5 py-2 text-[0.8125rem] font-semibold transition-colors ${
                cycle === value
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
              {value === 'annual' && (
                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-mini font-bold text-emerald-400">
                  −33%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-3">
        {PLANS.map(plan => (
          <PlanCard key={plan.id} plan={plan} cycle={cycle} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Los precios incluyen impuestos. Puedes cambiar o cancelar tu plan desde tu cuenta en
        cualquier momento.
      </p>
    </Section>
  )
}
