// ──────────────────────────────────────────────
// Compare — la tabla que resuelve la duda final.
// Toda portada de suscripción termina aquí: qué
// cambia exactamente entre un plan y el siguiente,
// sin adjetivos. La matriz vive en features/pricing.
// ──────────────────────────────────────────────

import { Fragment } from 'react'
import { Check, Minus } from 'lucide-react'
import { COMPARISON, PLANS, type ComparisonRow } from '@features/pricing/plans'
import { Section, SectionHead } from './shared'

function Cell({ value }: { value: ComparisonRow['free'] }) {
  if (value === true) {
    return (
      <span className="grid place-items-center" aria-label="Incluido">
        <Check className="h-4 w-4 text-emerald-400" />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="grid place-items-center" aria-label="No incluido">
        <Minus className="h-4 w-4 text-[var(--text-muted)]" />
      </span>
    )
  }
  return (
    <span className="block text-center text-[0.8125rem] font-semibold text-[var(--text-secondary)]">
      {value}
    </span>
  )
}

export default function Compare() {
  return (
    <Section id="comparativa">
      <SectionHead
        centered
        eyebrow="Comparativa"
        title="Qué cambia de un plan a otro"
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse">
          <thead>
            <tr>
              <th className="w-[44%] px-4 pb-4 text-left text-[0.8125rem] font-semibold text-[var(--text-muted)]">
                Capacidad
              </th>
              {PLANS.map(plan => (
                <th
                  key={plan.id}
                  className={`px-4 pb-4 text-center text-[0.9375rem] font-bold ${
                    plan.featured ? 'text-[var(--poker-gold)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {COMPARISON.map(({ group, rows }) => (
              <Fragment key={group}>
                <tr>
                  <td
                    colSpan={PLANS.length + 1}
                    className="px-4 pb-2 pt-6 text-caption font-bold uppercase tracking-[0.14em] text-[var(--poker-gold)]"
                  >
                    {group}
                  </td>
                </tr>

                {rows.map(row => (
                  <tr
                    key={row.feature}
                    className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-panel)]"
                  >
                    <td className="px-4 py-3.5 text-[0.875rem] text-[var(--text-secondary)]">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5">
                      <Cell value={row.free} />
                    </td>
                    <td className="bg-[var(--poker-gold)]/[0.04] px-4 py-3.5">
                      <Cell value={row.premium} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Cell value={row.gold} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
