// ──────────────────────────────────────────────
// SidebarLinkItem — Single navigation link
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { Tooltip } from '@components/ui'

export interface SidebarLinkItemProps {
  icon: ReactNode
  label: string
  href?: string
  active?: boolean
  onClick?: () => void
}

export default function SidebarLinkItem({
  icon,
  label,
  href,
  active = false,
  onClick,
}: SidebarLinkItemProps) {
  const { t } = useAppTranslation()
  return (
    <a
      href={href ?? '#'}
      onClick={e => {
        e.preventDefault()
        onClick?.()
      }}
      className={`group relative flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ${
        active
          ? 'text-[var(--text-primary)] font-medium shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)]'
      }`}
    >
      {/* Blurred selection background (same color as the accent bar) */}
      <span
        className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-12 h-[85%] rounded-lg bg-white/15 blur-lg transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className="relative z-10 ml-1.5 shrink-0">{icon}</span>
      <Tooltip content={t(label)}>
        <span className="relative z-10 truncate min-w-0">{t(label)}</span>
      </Tooltip>
    </a>
  )
}