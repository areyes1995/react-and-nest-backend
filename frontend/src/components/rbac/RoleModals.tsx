// ──────────────────────────────────────────────
// RoleModals — gestión de roles (RF02).
// RoleFormModal: crear/editar (nombre solo al crear).
// RolePermissionsModal: asignar permisos agrupados
// por recurso con checkboxes.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { FormModal, formInputClass } from '@components/ui'
import {
  getPermissions,
  type PermissionDto,
  type RoleDto,
} from '@services/rbac'

// TODO(RF02): el backend aún no expone crear/editar/asignar roles.
// Stubs locales con la firma que usa este archivo para que compile;
// lanzan un error visible en el modal hasta que exista el endpoint.
async function createRole(_name: string, _description?: string): Promise<void> {
  throw new Error('Crear rol no disponible en el backend')
}

async function updateRole(
  _id: number,
  _payload: { description?: string; isActive?: boolean },
): Promise<void> {
  throw new Error('Actualizar rol no disponible en el backend')
}

async function setRolePermissions(_id: number, _permissionIds: number[]): Promise<void> {
  throw new Error('Asignar permisos no disponible en el backend')
}

const SYSTEM_ROLES = new Set(['SUPERADMIN', 'ADMIN'])

// ─── Crear / editar ───

interface RoleFormModalProps {
  role: RoleDto | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function RoleFormModal({ role, open, onClose, onSaved }: RoleFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(role?.name ?? '')
    setDescription(role?.description ?? '')
    setIsActive(role?.isActive ?? true)
    setError(null)
  }, [open, role])

  const handleSave = async () => {
    if (!role && !/^[A-Z0-9_]{3,50}$/.test(name.trim())) {
      setError('El nombre debe estar en MAYÚSCULAS con guiones bajos (mín. 3).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (role) {
        await updateRole(role.id, { description: description.trim() || undefined, isActive })
      } else {
        await createRole(name.trim(), description.trim() || undefined)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormModal
      isOpen={open}
      onClose={onClose}
      title={role ? 'Editar rol' : 'Nuevo rol'}
      onSubmit={() => void handleSave()}
      saving={saving}
      error={error}
    >
      {!role && (
        <label className="block text-xs text-[var(--text-secondary)]">
          Nombre (ej. EXHIBITOR)
          <input
            className={`${formInputClass} mt-1 uppercase`}
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            placeholder="EXHIBITOR"
          />
        </label>
      )}
      <label className="block text-xs text-[var(--text-secondary)]">
        Descripción
        <input
          className={`${formInputClass} mt-1`}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </label>
      {role && !SYSTEM_ROLES.has(role.name.toUpperCase()) && (
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Rol activo
        </label>
      )}
    </FormModal>
  )
}

// ─── Asignar permisos ───

interface RolePermissionsModalProps {
  role: RoleDto | null
  onClose: () => void
  onSaved: () => void
}

export function RolePermissionsModal({ role, onClose, onSaved }: RolePermissionsModalProps) {
  const [all, setAll] = useState<PermissionDto[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!role) return
    setLoading(true)
    setError(null)
    getPermissions()
      .then(perms => {
        setAll(perms)
        setSelected(new Set(role.permissions.map(p => p.id)))
      })
      .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los permisos'))
      .finally(() => setLoading(false))
  }, [role])

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionDto[]>()
    for (const p of all) {
      const list = map.get(p.resource) ?? []
      list.push(p)
      map.set(p.resource, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [all])

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!role) return
    setSaving(true)
    setError(null)
    try {
      await setRolePermissions(role.id, [...selected])
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar permisos')
    } finally {
      setSaving(false)
    }
  }

  const locked = role ? SYSTEM_ROLES.has(role.name.toUpperCase()) && role.name.toUpperCase() === 'SUPERADMIN' : false

  return (
    <FormModal
      isOpen={role !== null}
      onClose={onClose}
      title={role ? `Permisos de ${role.name}` : 'Permisos'}
      subtitle={locked ? 'SUPERADMIN tiene acceso total por código; no se edita.' : `${selected.size} permisos seleccionados`}
      onSubmit={locked ? undefined : () => void handleSave()}
      submitLabel="Asignar permisos"
      saving={saving}
      error={error}
      maxWidth="max-w-2xl"
    >
      {loading && <p className="text-sm text-[var(--text-muted)]">Cargando permisos…</p>}
      {!loading && (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {grouped.map(([resource, perms]) => (
            <div key={resource}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                {resource} ({perms.filter(p => selected.has(p.id)).length}/{perms.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {perms.map(p => (
                  <label
                    key={p.id}
                    title={p.description}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] px-2 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      disabled={locked}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </FormModal>
  )
}
