import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface DropdownItem {
  key: string
  label: string
  icon?: ReactNode
}

interface DropdownActionProps {
  items: DropdownItem[]
  onAction: (key: string) => void
  buttonLabel: string
  buttonIcon?: ReactNode
  buttonClass?: string
}

export default function DropdownAction({
  items,
  onAction,
  buttonLabel,
  buttonIcon,
  buttonClass = 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]',
}: DropdownActionProps) {
  return (
    <div className="relative">
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${buttonClass}`}
        onClick={() => {}}
      >
        {buttonIcon}
        {buttonLabel}
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute top-full right-0 mt-1 min-w-[12.5rem] bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg shadow-lg z-10 overflow-hidden">
        {items.map((item) => (
          <button
            key={item.key}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            onClick={() => onAction(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
