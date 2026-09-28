// ──────────────────────────────────────────────
// ViewHeader — Title + optional subtitle row
// for main-area views
// ──────────────────────────────────────────────

import { useAppTranslation } from '@i18n/useAppTranslation'

export interface ViewHeaderProps {
  title: string
  subtitle?: string
}

export default function ViewHeader({ title, subtitle }: ViewHeaderProps) {
  const { t } = useAppTranslation()
  return (
    <div className="px-4 lg:px-6 py-3 border-b border-[var(--border)] flex items-center gap-3">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">{t(title)}</h2>
      {subtitle && <span className="text-xs text-[var(--text-muted)] shrink-0">— {t(subtitle)}</span>}
    </div>
  )
}