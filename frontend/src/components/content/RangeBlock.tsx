// ──────────────────────────────────────────────
// RangeBlock — el botón "Ver rango" de las clases.
// Despliega la matriz 13×13 del rango que toca en
// ese punto del curso (open por posición, defensa
// de BB, 3-bet, c-bet en A-K-4…). Son los mismos
// rangos con los que corrige el coach.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Grid3x3 } from 'lucide-react'
import RangeGrid, { rangeCellColor, type RangeCell } from '@components/poker/RangeGrid'
import { RANGE_VIEWER } from '@features/table/rangeViewer'
import { rangePercent } from '@features/table/preflopRanges'

export default function RangeBlock({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const view = RANGE_VIEWER[id]
  const cells = useMemo(() => {
    const map = new Map<string, RangeCell>()
    if (!view) return map
    for (const group of view.groups) {
      for (const hand of group.hands) {
        if (!map.has(hand)) map.set(hand, { weight: group.weight, tone: group.tone })
      }
    }
    return map
  }, [view])

  if (!view) return null

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition hover:bg-[var(--bg-surface-soft)]"
      >
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--poker-gold)]/15 text-[var(--poker-gold)] shrink-0">
          <Grid3x3 className="w-4 h-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[var(--text-primary)]">Ver rango: {view.title}</span>
          <span className="block truncate text-xs text-[var(--text-muted)]">
            {open ? 'Toca para ocultar' : 'Toca para desplegar la matriz'}
          </span>
        </span>
        <span
          className={`text-xs font-bold text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-3.5 py-3 space-y-2.5 animate-fade-in">
          <div className="mx-auto" style={{ width: 'min(100%, 26rem)' }}>
            <RangeGrid cellFor={hand => cells.get(hand) ?? { weight: 0 }} outLabel="fuera" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            {view.groups.map(group => (
              <span key={group.label} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: rangeCellColor(group.weight, group.tone) }} />
                {group.label}
                <span className="tabular-nums text-[var(--text-muted)]">
                  {(rangePercent(group.hands) * 100).toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{view.caption}</p>
        </div>
      )}
    </div>
  )
}
