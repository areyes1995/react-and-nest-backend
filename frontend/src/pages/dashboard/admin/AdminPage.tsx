// ──────────────────────────────────────────────
// AdminPage — el panel de administración.
// Route: /app/admin
// Reutiliza el resumen del home (métricas y accesos
// rápidos) y añade la entrada a la gestión de
// contenido, que es lo que un administrador de la
// academia usa a diario.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { LibraryBig } from 'lucide-react'
import AdminOverview from '@pages/dashboard/home/AdminOverview'
import { AcademyPage } from '@components/layout'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function AdminPage() {
  const { t } = useAppTranslation()

  return (
    <AcademyPage
      title={t('admin.title')}
      subtitle={t('admin.subtitle')}
      // El resumen trae su propio scroll y su propio margen: la página solo
      // aporta la cabecera, sin duplicar espaciados ni barras de scroll.
      fill
      padded={false}
      actions={
        <Link
          to="/app/admin/content"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-110"
          style={{ background: 'var(--poker-gold)' }}
        >
          <LibraryBig className="h-3.5 w-3.5" strokeWidth={2} />
          {t('nav.contentAdmin')}
        </Link>
      }
    >
      <AdminOverview />
    </AcademyPage>
  )
}
