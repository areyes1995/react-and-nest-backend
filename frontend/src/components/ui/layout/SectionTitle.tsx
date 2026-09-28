// ──────────────────────────────────────────────
// SectionTitle — Uppercase muted section heading
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

export interface SectionTitleProps {
  children: ReactNode
  className?: string
}

export default function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <h2 className={`text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] ${className}`}>
      {children}
    </h2>
  )
}