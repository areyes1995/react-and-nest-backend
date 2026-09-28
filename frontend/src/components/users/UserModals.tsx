// ──────────────────────────────────────────────
// UserModals — detalle y edición de usuarios (RF01).
// Reutilizables: UserDetailModal muestra la ficha
// completa ("No disponible" si la fecha es inválida);
// UserEditModal edita datos + cambia el rol.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { FormModal, formInputClass, FilterSelect } from '@components/ui'
import { getUsers, type UserResponse } from '@services/users'
import { patch } from '@services/api'
import { getRolesSummary, type RoleSummaryDto } from '@services/rbac'

/** Fecha legible o "No disponible" (criterio §9 del consolidado). */
export function formatUserDate(iso?: string | null): string {
  if (!iso) return 'No disponible'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? 'No disponible'
    : d.toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--border)] last:border-none">
      <span className="text-xs text-[var(--text-muted)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--text-primary)] text-right break-all">{value}</span>
    </div>
  )
}

// ─── Detalle ───

interface UserDetailModalProps {
  userId: number | null
  onClose: () => void
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) {
      setUser(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    getUsers({ page: 1, pageSize: 100 })
      .then(res => {
        if (!res.ok) {
          setError(res.error || 'No se pudo cargar el usuario')
          return
        }
        const found = res.data.items.find(u => u.id === userId)
        if (found) setUser(found)
        else setError('No se pudo cargar el usuario')
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar el usuario'))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <FormModal
      isOpen={userId !== null}
      onClose={onClose}
      title="Detalle del usuario"
      subtitle={user ? `${user.firstName} ${user.lastName}` : undefined}
      hideFooter
    >
      {loading && <p className="text-sm text-[var(--text-muted)]">Cargando…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {user && (
        <div>
          <DetailRow label="Nombre" value={`${user.firstName} ${user.lastName}`} />
          <DetailRow label="Correo" value={user.email} />
          <DetailRow label="Empleado" value={user.employeeId || '—'} />
          <DetailRow label="Teléfono" value={user.phoneNumber || '—'} />
          <DetailRow label="Roles" value={user.roles?.length ? user.roles.join(', ') : '—'} />
          <DetailRow label="Estado" value={user.isActive ? 'Activo' : 'Inactivo'} />
          <DetailRow label="Email verificado" value={user.emailVerified ? 'Sí' : 'No'} />
          <DetailRow label="Debe cambiar clave" value={user.mustChangePassword ? 'Sí' : 'No'} />
          <DetailRow label="Última actividad" value={formatUserDate(user.updatedAt)} />
          <DetailRow label="Creado" value={formatUserDate(user.createdAt)} />
        </div>
      )}
    </FormModal>
  )
}

// ─── Edición + cambio de rol ───

interface UserEditModalProps {
  user: UserResponse | null
  onClose: () => void
  onSaved: () => void
}

export function UserEditModal({ user, onClose, onSaved }: UserEditModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [roles, setRoles] = useState<RoleSummaryDto[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setPhoneNumber(user.phoneNumber ?? '')
    setRole(user.roles?.[0] ?? '')
    setIsActive(user.isActive)
    setError(null)
    getRolesSummary()
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [user])

  const handleSave = async () => {
    if (!user) return
    if (firstName.trim().length < 3 || lastName.trim().length < 3) {
      setError('Nombre y apellido deben tener al menos 3 caracteres.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await patch<UserResponse>(`/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        role: role || undefined,
        isActive,
      })
      if (!res.ok) throw new Error(res.error || 'No se pudo guardar')
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
      isOpen={user !== null}
      onClose={onClose}
      title="Editar usuario"
      subtitle={user ? user.email : undefined}
      onSubmit={() => void handleSave()}
      saving={saving}
      error={error}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-[var(--text-secondary)]">
          Nombre
          <input className={`${formInputClass} mt-1`} value={firstName} onChange={e => setFirstName(e.target.value)} />
        </label>
        <label className="block text-xs text-[var(--text-secondary)]">
          Apellido
          <input className={`${formInputClass} mt-1`} value={lastName} onChange={e => setLastName(e.target.value)} />
        </label>
      </div>
      <label className="block text-xs text-[var(--text-secondary)]">
        Teléfono
        <input className={`${formInputClass} mt-1`} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
      </label>
      <label className="block text-xs text-[var(--text-secondary)]">
        Rol
        <div className="mt-1">
          <FilterSelect
            value={role}
            onChange={setRole}
            ariaLabel="Rol del usuario"
            options={[
              { value: '', label: 'Sin cambios' },
              ...roles.filter(r => r.isActive).map(r => ({ value: r.name, label: r.name })),
            ]}
          />
        </div>
      </label>
      <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
        Usuario activo
      </label>
    </FormModal>
  )
}
