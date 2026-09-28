// ──────────────────────────────────────────────
// HomePage — panel admin montado en el home.
// Route: /app/home
// Renderiza AdminOverview (estilo home dashboard)
// con datos reales: usuarios, RBAC, proyectos,
// stands, ferias, métricas, RAG y notificaciones.
// ──────────────────────────────────────────────

import AdminOverview from './AdminOverview'
import { ViewHeader } from '@components/ui'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function HomePage() {
  const { t } = useAppTranslation()
  return (
    <div className="flex flex-col h-full">
      <ViewHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
      <AdminOverview />
    </div>
  )
}
