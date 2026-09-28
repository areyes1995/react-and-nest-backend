// ──────────────────────────────────────────────
// RbacPermissionsView — tabla simple de permisos.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { ViewHeader, EmptyState } from '@components/ui'
import { getPermissions, type PermissionDto } from '@services/rbac'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function RbacPermissionsView({ view }: { view?: string }) {
  void view
  const { t } = useAppTranslation()
  const [permissions, setPermissions] = useState<PermissionDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPermissions()
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-sm text-[var(--text-muted)]">{t('common.loading')}</div>

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <ViewHeader title={t('permissions.title')} subtitle={t('permissions.subtitle')} />
      {permissions.length === 0 ? (
        <EmptyState title={t('permissions.empty')} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)] text-left">
              <tr>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('permissions.name')}</th>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('permissions.resource')}</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{p.resource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
