// ──────────────────────────────────────────────
// AiPage — placeholder del módulo IA (starter).
// El backend expone /ai-analysis/* (ver AiAnalysis).
// ──────────────────────────────────────────────

import { ViewHeader } from '@components/ui'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function AiPage() {
  const { t } = useAppTranslation()
  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <ViewHeader title={t('nav.aiAnalysis')} subtitle={t('nav.desc.aiAnalysis')} />
      <p className="text-sm text-[var(--text-muted)]">
        Conecta aquí tus llamadas a <code>POST /ai-analysis/analyze-text</code> (OpenAI).
      </p>
    </div>
  )
}
