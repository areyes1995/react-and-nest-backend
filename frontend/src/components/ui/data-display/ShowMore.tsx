// ──────────────────────────────────────────────
// ShowMore — Lista incremental reutilizable
// Muestra un lote inicial de items y permite ir
// mostrando más en lotes (batch) o todos a la vez.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronsDown } from 'lucide-react'

export interface ShowMoreLabels {
  /** Botón para revelar más items. Default: "Show more". */
  showMore?: string
  /** Botón para revelar todo de una vez. Default: "Show all". */
  showAll?: string
  /** Contador "Showing {{visible}} of {{total}}". Default en inglés. */
  showing?: string
}

export interface ShowMoreProps<T> {
  items: T[]
  /** Cuántos items se muestran por lote. Default: 9. */
  batchSize?: number
  /** Renderiza cada item visible. */
  renderItem: (item: T, index: number) => ReactNode
  /** Key estable por item (p. ej. `d.id`). Default: índice. */
  keyOf?: (item: T, index: number) => string | number
  className?: string
  /** Clases del contenedor de la lista (p. ej. el grid). */
  listClassName?: string
  /** Clases del bloque de controles (botones + contador). */
  controlsClassName?: string
  /** Contenido a mostrar cuando no hay items. */
  empty?: ReactNode
  /** Labels traducibles vía i18n. Default en inglés. */
  labels?: ShowMoreLabels
  /** Si `true`, el botón "Show more" revela todo el resto de una vez. */
  revealAllOnShowMore?: boolean
}

const DEFAULT_LABELS: Required<ShowMoreLabels> = {
  showMore: 'Show more',
  showAll: 'Show all',
  showing: 'Showing {{visible}} of {{total}}',
}

export default function ShowMore<T>({
  items,
  batchSize = 9,
  renderItem,
  keyOf,
  className = '',
  listClassName = '',
  controlsClassName = '',
  empty = null,
  labels,
  revealAllOnShowMore = false,
}: ShowMoreProps<T>) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(batchSize, items.length))
  const hasMore = visibleCount < items.length
  const remaining = items.length - visibleCount

  useEffect(() => {
    setVisibleCount(Math.min(batchSize, items.length))
  }, [items, batchSize])

  if (items.length === 0) {
    return <>{empty}</>
  }

  const resolved = { ...DEFAULT_LABELS, ...labels }
  const showingLabel = resolved.showing
    .replace('{{visible}}', String(visibleCount))
    .replace('{{total}}', String(items.length))

  return (
    <div className={className}>
      {visibleCount > 0 && (
        <div className={listClassName}>
          {items.slice(0, visibleCount).map((item, i) => (
            <div key={keyOf ? keyOf(item, i) : i}>{renderItem(item, i)}</div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className={controlsClassName}>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pb-2">
            <span className="text-caption tabular-nums text-[var(--text-muted)]">{showingLabel}</span>
            <button
              type="button"
              onClick={() =>
                setVisibleCount(v =>
                  Math.min(v + (revealAllOnShowMore ? remaining : batchSize), items.length),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f2a93b]/40 bg-[#f2a93b]/10 px-3 py-1.5 text-caption font-semibold text-[#f2a93b] transition hover:bg-[#f2a93b]/20"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {resolved.showMore}
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(items.length)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-active)] bg-[var(--bg-surface)] px-3 py-1.5 text-caption font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ChevronsDown className="h-3.5 w-3.5" />
              {resolved.showAll}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}