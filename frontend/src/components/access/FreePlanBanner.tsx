// ──────────────────────────────────────────────
// FreePlanBanner — recordatorio del plan gratis en
// el inicio: qué tienes y cómo abrir el resto.
// Con suscripción (o siendo administrador) no sale.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useAccess } from '@features/access/AccessContext'

export default function FreePlanBanner() {
  const { hasFullAccess, status } = useAccess()
  if (hasFullAccess || status === 'loading') return null
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--poker-gold)]/40 bg-[var(--poker-gold)]/10 px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--poker-gold)]/20 text-[var(--poker-gold)]">
        <Crown className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--text-primary)]">Estás en el plan gratis</p>
        <p className="text-caption text-[var(--text-secondary)]">
          Tienes los 3 primeros cursos de Fundamentos, la calculadora de equity y la mesa en modo demostración.
          Suscríbete para abrir todos los cursos, la mesa y todas las herramientas.
        </p>
      </div>
      <Link
        to="/checkout/premium"
        className="press shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1a1206]"
        style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
      >
        Ver planes
      </Link>
    </div>
  )
}
