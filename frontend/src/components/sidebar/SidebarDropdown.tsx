// ──────────────────────────────────────────────
// SidebarDropdown — Expandable nav group for modules
// ──────────────────────────────────────────────

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SidebarLinkItem, { type SidebarLinkItemProps } from './SidebarLinkItem'
import { Expandable, Tooltip } from '@components/ui'
import type { ReactNode } from 'react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface SidebarDropdownProps {
  icon: ReactNode
  label: string
  items: SidebarLinkItemProps[]
}

export default function SidebarDropdown({ icon, label, items }: SidebarDropdownProps) {
  const [open, setOpen] = useState(true)
  const { t } = useAppTranslation()

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="group relative flex w-full items-center justify-between gap-3 px-2 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)] transition-all duration-200"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="ml-1.5">{icon}</span>
          <Tooltip content={t(label)}>
            <span className="truncate font-medium">{t(label)}</span>
          </Tooltip>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <Expandable open={open}>
        <nav className="space-y-0.5 pt-1 pl-2">
          {items.map((item, idx) => (
            <SidebarLinkItem key={idx} {...item} />
          ))}
        </nav>
      </Expandable>
    </div>
  )
}