// ──────────────────────────────────────────────
// ConnectionsPage — placeholder for the integrations
// module (built out in Fase 2). Route: /app/connections
// ──────────────────────────────────────────────

import { ViewHeader } from '@components/ui'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function ConnectionsPage() {
  const { t } = useAppTranslation()
  return (
    <div className="flex flex-col h-full">
      <ViewHeader title={t('Connections')} />
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
        {t('Connections module coming soon')}
      </div>
    </div>
  )
}