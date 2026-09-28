// ──────────────────────────────────────────────
// RbacRolesView — tabla simple de roles (starter).
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { ViewHeader, EmptyState } from '@components/ui'
import { getRoles, type RoleDto } from '@services/rbac'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function RbacRolesView({ view }: { view?: string }) {
  void view
  const { t } = useAppTranslation()
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-sm text-[var(--text-muted)]">{t('common.loading')}</div>

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <ViewHeader title={t('roles.title')} subtitle={t('roles.subtitle')} />
      {roles.length === 0 ? (
        <EmptyState title={t('roles.empty')} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)] text-left">
              <tr>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('roles.name')}</th>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('roles.permissions')}</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 text-[var(--text-primary)]">{r.name}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">
                    {r.permissions?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
