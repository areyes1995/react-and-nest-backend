import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface DropdownItem {
  key: string
  label: string
  icon?: ReactNode
}

interface DropdownFilterProps {
  value: string
  items: DropdownItem[]
  onChange: (value: string) => void
}

export default function DropdownFilter({ value, items, onChange }: DropdownFilterProps) {
  const selected = items.find((i) => i.key === value)?.label || value
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-primary)]"
        onClick={() => {}}
      >
        {selected}
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute top-full left-0 mt-1 min-w-[12.5rem] bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg shadow-lg z-10 overflow-hidden">
        {items.map((item) => (
          <button
            key={item.key}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors ${
              item.key === value ? 'bg-[var(--bg-surface-soft)] font-medium' : ''
            }`}
            onClick={() => onChange(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
