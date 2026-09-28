// ──────────────────────────────────────────────
// RbacPermissionsView — Table grid de Permissions
// (Security). Consume GET /permissions y renderiza
// columnas dinámicas sobre RecordsTable.
// Soporta vistas: summary (grid), archived (filtrado).
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import ViewHeader from '@components/ui/layout/ViewHeader'
import { buildDynamicTable } from '@records/dynamicColumns'
import { getPermissions } from '@services/rbac'
import type { PermissionDto } from '@services/rbac'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { DynamicComponentRenderer } from '@components/charts'

export default function RbacPermissionsView({ view }: { view?: string }) {
  const { t } = useAppTranslation()
  const [permissions, setPermissions] = useState<PermissionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getPermissions()
      .then(data => {
        if (!mounted) return
        setPermissions(data)
        setError(null)
      })
      .catch(e => {
        if (mounted) setError(e instanceof Error ? e.message : t('rbac.permissions.error.load'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [t])

  const { columns, data } = useMemo(
    () =>
      buildDynamicTable<PermissionDto>(permissions, {
        columns: {
          id: { header: 'ID' },
          name: { header: 'Name' },
          description: { header: 'Description' },
          resource: { header: 'Resource' },
          resourceId: { header: 'Resource ID' },
        },
        statusOf: () => 'Active',
      }),
    [permissions],
  )

  const filteredData = useMemo(() => {
    if (view === 'archived') return data.filter(d => d.status === 'Archived')
    return data
  }, [data, view])

  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Permissions" subtitle={t('rbac.security')} />
      <div className="flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : error ? (
          <div className="m-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : (
          <DynamicComponentRenderer
            items={[
              {
                type: 'RecordsTable',
                props: { data: filteredData, columns },
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}