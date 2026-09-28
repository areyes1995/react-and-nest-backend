import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface ExpandableTableProps {
  items: ReactNode[]
  total: number
  maxItems: number
}

export default function ExpandableTable({ items, total, maxItems }: ExpandableTableProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? items : items.slice(0, maxItems)

  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {visibleItems}
        </tbody>
      </table>
      {total > maxItems && (
        <button
          className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ver menos' : `Ver más (${total - maxItems})`}
        </button>
      )}
    </div>
  )
}
