// ──────────────────────────────────────────────
// MenuSearchBar — Search input with filter & add
// ──────────────────────────────────────────────

import { Search, SlidersHorizontal, Plus } from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface MenuSearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onFilter?: () => void
  onAdd?: () => void
}

export default function MenuSearchBar({
  placeholder = 'Search',
  onSearch,
  onFilter,
  onAdd,
}: MenuSearchBarProps) {
  const { t } = useAppTranslation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value)
  }

  return (
    <div className="p-4 flex items-center gap-2 border-b border-[var(--border)] h-[3.5625rem] bg-[var(--bg-main-80)] backdrop-blur-sm">
      <div className="relative flex-1 group">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[#f2a93b]" />
        <input
          type="text"
          placeholder={t(placeholder)}
          onChange={handleChange}
          className="w-full bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-9 pr-8 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#f2a93b]/40 focus:bg-[var(--bg-hover)] transition-all duration-200"
        />
        <button onClick={onFilter} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={onAdd}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f2a93b] to-[#d4902e] hover:from-[#f5b961] hover:to-[#f2a93b] text-white flex items-center justify-center transition-all duration-200 shrink-0 shadow-lg shadow-[#f2a93b]/20 hover:shadow-[#f2a93b]/30 hover:scale-105 active:scale-95"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}