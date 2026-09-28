// ──────────────────────────────────────────────
// Packs — accesos únicos, sin suscripción.
// Se desbloquean solo para cuentas que ya pasaron
// por Premium o Gold: cuando la suscripción termina,
// el estudiante puede seguir pagando únicamente por
// lo que use. La condición se explica arriba del
// todo para que nadie llegue a la caja confundido.
// ──────────────────────────────────────────────

import { Unlock } from 'lucide-react'
import { PACKS, CURRENCY_SYMBOL, formatPrice } from '@features/pricing/plans'
import { Section, SectionHead } from './shared'

export default function Packs() {
  return (
    <div className="border-y border-[var(--border)] bg-[var(--bg-main)]">
      <Section id="accesos">
        <SectionHead
          eyebrow="Accesos únicos"
          title="Cuando acabe tu suscripción, paga solo por lo que uses"
          subtitle="Pagos únicos, sin renovación automática. Compras la herramienta o la mesa que necesites y se acabó."
        />

        {/* ── La condición, antes que los precios ── */}
        <div className="mb-10 flex items-start gap-3 rounded-xl border border-[var(--poker-gold)]/25 bg-[var(--poker-gold)]/[0.06] px-4 py-3.5">
          <Unlock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--poker-gold)]" />
          <p className="text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">
              Disponibles tras tu primera suscripción.
            </strong>{' '}
            Los accesos únicos se abren en tu cuenta cuando ya has tenido Premium o Premium Gold.
            No son una alternativa para empezar: son la forma de seguir usando lo que te importa
            cuando decides no renovar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map(pack => (
            <div
              key={pack.id}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5"
            >
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {pack.name}
              </h3>
              <p className="mt-2 flex-1 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                {pack.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold leading-none tracking-tight text-[var(--text-primary)]">
                  {CURRENCY_SYMBOL}
                  {formatPrice(pack.price)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">pago único</span>
              </div>

              <span className="mt-3 self-start rounded-full border border-[var(--border-active)] bg-[var(--bg-surface)] px-2.5 py-1 text-caption font-semibold text-[var(--text-secondary)]">
                {pack.duration}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
