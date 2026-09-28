// ──────────────────────────────────────────────
// Breadcrumbs — back button + breadcrumb trail
// coherentes con la URL actual.
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onNavigate?: () => void
}

export default function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  const { t } = useAppTranslation()
  const navigate = useNavigate()

  const handleNavigate = (to: string) => {
    onNavigate?.()
    navigate(to)
  }

  const goBack = () => {
    onNavigate?.()
    const prev = items[items.length - 2]
    if (prev?.to) navigate(prev.to)
  }

  return (
    <header className="flex items-center gap-2 px-4 lg:px-8 py-2.5 border-b border-[var(--border)] bg-[var(--bg-main)] shrink-0 min-h-[2.75rem]">
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0"
        title={t('Back')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="w-px h-4 bg-[var(--bg-surface)] shrink-0" />
      <nav className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] min-w-0 overflow-x-auto scrollbar-none">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <span key={idx} className="flex items-center gap-1.5 shrink-0">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5" />}
              {item.to && !isLast ? (
                <button
                  onClick={() => item.to && handleNavigate(item.to)}
                  className="hover:text-[var(--text-primary)] transition"
                >
                  {t(item.label)}
                </button>
              ) : (
                <span className="text-[var(--text-secondary)] truncate">{t(item.label)}</span>
              )}
            </span>
          )
        })}
      </nav>
    </header>
  )
}