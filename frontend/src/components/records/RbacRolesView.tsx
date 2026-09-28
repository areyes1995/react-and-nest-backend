// ──────────────────────────────────────────────
// RbacRolesView — Table grid de Roles (Security).
// Consume GET /roles/all (RoleDto con permisos
// anidados) y renderiza columnas dinámicas sobre
// RecordsTable. La columna "Permissions" es un
// desplegable con los permisos de cada rol.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, AlertCircle, KeyRound } from 'lucide-react'
import ViewHeader from '@components/ui/layout/ViewHeader'
import Expandable from '@components/ui/data-display/Expandable'
import { buildDynamicTable } from '@records/dynamicColumns'
import { getRoles } from '@services/rbac'
import type { PermissionDto, RoleDto } from '@services/rbac'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { DynamicComponentRenderer } from '@components/charts'

/** Badge de permisos anidados con Expandable (count + lista). */
function RolePermissionsCell({ permissions }: { permissions: PermissionDto[] }) {
  const [open, setOpen] = useState(false)
  if (permissions.length === 0) {
    return <span className="text-xs text-[var(--text-muted)]">0</span>
  }
  return (
    <div className="flex flex-col items-start">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
      >
        {permissions.length}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      <Expandable open={open}>
        <div className="mt-2 flex max-w-xs flex-wrap gap-1">
          {permissions.map(p => (
            <span
              key={p.id}
              title={p.description || p.name}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border-active)] bg-[var(--bg-surface)] px-2 py-0.5 text-mini font-medium text-[var(--text-secondary)]"
            >
              <KeyRound className="h-2.5 w-2.5 text-[#f2a93b]" />
              {p.name}
            </span>
          ))}
        </div>
      </Expandable>
    </div>
  )
}

export default function RbacRolesView({ view }: { view?: string }) {
  const { t } = useAppTranslation()
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getRoles()
      .then(data => {
        if (!mounted) return
        setRoles(data)
        setError(null)
      })
      .catch(e => {
        if (mounted) setError(e instanceof Error ? e.message : t('rbac.roles.error.load'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [t])

  const filteredRoles = useMemo(() => {
    if (view === 'archived') return roles.filter(r => !r.isActive)
    return roles
  }, [roles, view])

  const roleById = useMemo(
    () => new Map<string, RoleDto>(filteredRoles.map(r => [String(r.id), r])),
    [filteredRoles],
  )

  const { columns, data } = useMemo(
    () =>
      buildDynamicTable<RoleDto>(filteredRoles, {
        columns: {
          id: { header: 'ID' },
          name: { header: 'Name' },
          description: { header: 'Description' },
          isActive: {
            header: 'Status',
            render: info => {
              const role = roleById.get(info.row.original.id)
              const active = Boolean(role?.isActive)
              return (
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-400/10 text-[var(--text-secondary)]'
                  }`}
                >
                  {active ? t('rbac.active') : t('rbac.inactive')}
                </span>
              )
            },
          },
          permissions: {
            header: 'Permissions',
            type: 'list',
            itemsOf: item =>
              typeof item === 'object' && item != null
                ? String((item as { name?: string }).name ?? '')
                : String(item),
            render: info => {
              const role = roleById.get(info.row.original.id)
              return <RolePermissionsCell permissions={role?.permissions ?? []} />
            },
          },
        },
        statusOf: row => (row.isActive ? 'Active' : 'Archived'),
      }),
    [roles, roleById, t],
  )

  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Roles" subtitle={t('rbac.security')} />
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
                props: { data, columns },
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}