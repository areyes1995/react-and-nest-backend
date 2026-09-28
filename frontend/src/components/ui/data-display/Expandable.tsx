// ──────────────────────────────────────────────
// Expandable — Animated collapsible content
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export interface ExpandableProps {
  open: boolean
  children: ReactNode
}

/**
 * Anima su contenido con una transición de altura
 * (grid-template-rows 0fr ↔ 1fr). Úsalo para
 * acordeones/desplegables sin medir alturas.
 */
export default function Expandable({ open, children }: ExpandableProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}