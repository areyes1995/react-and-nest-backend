// ──────────────────────────────────────────────
// PaywallGate — contenido de pago, visto desde el
// plan gratis. La página se dibuja debajo,
// difuminada y sin poder tocarse, para que se vea
// lo que hay; encima, una tarjeta con el botón de
// suscribirse. Con acceso, no hace nada.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Lock } from 'lucide-react'
import { useAccess } from '@features/access/AccessContext'
import { PAID_FEATURE_LABEL, type PaidFeature } from '@features/access/rules'

export interface PaywallGateProps {
  /** Herramienta o sección de pago. Con `locked` se decide fuera. */
  feature?: PaidFeature
  /** Fuerza el bloqueo (p.ej. un curso de pago). */
  locked?: boolean
  title?: string
  description?: string
  children: ReactNode
}

export function SubscribeCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className="w-full max-w-md rounded-2xl border border-[var(--poker-gold)]/40 bg-[var(--bg-panel)]/95 p-6 text-center shadow-2xl backdrop-blur-md"
    >
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]">
        <Lock className="h-5 w-5" strokeWidth={2} />
      </span>
      <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      <Link
        to="/checkout/premium"
        className="press mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#1a1206] shadow-[0_8px_26px_rgba(242,169,59,0.3)] hover:brightness-105"
        style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
      >
        <Crown className="h-4 w-4" strokeWidth={2} />
        Suscribirme
      </Link>
      <p className="mt-3 text-caption text-[var(--text-muted)]">
        Premium y Gold incluyen todos los cursos y herramientas.{' '}
        <Link to="/#planes" className="font-semibold text-[var(--poker-gold)] hover:underline">
          Ver planes
        </Link>
      </p>
    </div>
  )
}

export function AccessLoading() {
  return (
    <div className="grid flex-1 place-items-center py-24" aria-busy="true">
      <div className="spinner-lg" />
    </div>
  )
}

export default function PaywallGate({ feature, locked, title, description, children }: PaywallGateProps) {
  const { canUse, status } = useAccess()
  const blocked = locked ?? (feature ? !canUse(feature) : false)
  if (!blocked) return <>{children}</>
  // Mientras se consulta la suscripción, ni muro (parpadearía a quien sí está
  // suscrito) ni contenido (se le escaparía a quien no lo está).
  if (status === 'loading') return <AccessLoading />

  const heading = title ?? (feature ? `Desbloquea ${PAID_FEATURE_LABEL[feature]}` : 'Contenido de pago')
  const body =
    description ??
    'Es contenido de pago y estás en el plan gratis. Suscríbete para desbloquear todos los cursos, la mesa de práctica y todas las herramientas.'

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" data-paywall>
      <div
        inert
        aria-hidden="true"
        className="pointer-events-none flex max-h-[80dvh] min-h-0 flex-1 select-none flex-col overflow-hidden opacity-60 blur-[6px]"
      >
        {children}
      </div>
      <div className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-[12vh]">
        <SubscribeCard title={heading} description={body} />
      </div>
    </div>
  )
}
