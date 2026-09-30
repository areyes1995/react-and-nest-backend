import { useState } from 'react'
import { KeyRound, ScrollText, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { adminApi, type AdminUser } from '@services/educraft'
import { useFeedback } from '@context/ToastContext'
import { useAsync } from '@hooks/useAsync'
import { useDebounce } from '@hooks/useDebounce'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, Toggle } from '@components/ui'
import { formatDate } from '@lib/format'
import LogsPage from '@pages/dashboard/logs/LogsPage'

type Tab = 'usuarios' | 'roles' | 'auditoria'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('usuarios')
  return (
    <div>
      <PageHeader title="Administración" subtitle="Usuarios, roles, permisos y auditoría de la plataforma" icon={<ShieldCheck className="h-8 w-8 text-brand-purple" />} />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { key: 'usuarios', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
          { key: 'roles', label: 'Roles y permisos', icon: <KeyRound className="h-4 w-4" /> },
          { key: 'auditoria', label: 'Auditoría', icon: <ScrollText className="h-4 w-4" /> },
        ]}
      />
      {tab === 'usuarios' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'auditoria' && (
        <Card className="card-pad">
          <LogsPage />
        </Card>
      )}
    </div>
  )
}

function UsersTab() {
  const { success, error } = useFeedback()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const term = useDebounce(q, 300)
  const { data, loading, reload } = useAsync(() => adminApi.users(page, 20, term ? { email: term } : {}), [page, term])
  const roles = useAsync(() => adminApi.roles())
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', employeeId: '', role: 'DOCENTE' })

  const save = async () => {
    if (!editing) return
    try {
      await adminApi.updateUser(editing.id, { firstName: editing.firstName, lastName: editing.lastName, role: editing.roles[0], isActive: editing.isActive })
      success('Usuario actualizado')
      setEditing(null)
      void reload()
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    }
  }

  const create = async () => {
    try {
      await adminApi.register({ ...form, employeeId: form.employeeId || form.email })
      success('Usuario creado', 'Recibirá un correo para establecer su contraseña.')
      setCreating(false)
      void reload()
    } catch (err) {
      error('No se pudo crear', (err as Error).message)
    }
  }

  const roleOptions = (roles.data ?? []).map((r) => ({ value: r.name, label: r.name }))

  return (
    <Card className="card-pad">
      <div className="mb-3 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por correo" className="max-w-xs" />
        <Button className="ml-auto" icon={<UserPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
          Nuevo usuario
        </Button>
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState title="Sin usuarios" />
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Alta</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-ink">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="text-xs">{u.email}</td>
                  <td>
                    {u.roles.map((r) => (
                      <Badge key={r} tone="purple">
                        {r}
                      </Badge>
                    ))}
                  </td>
                  <td>{u.isActive ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}</td>
                  <td className="text-xs">{formatDate(u.createdAt)}</td>
                  <td className="text-right">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar usuario" footer={<Button onClick={save}>Guardar</Button>}>
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <Input value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} />
              </Field>
              <Field label="Apellido">
                <Input value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} />
              </Field>
            </div>
            <Field label="Rol">
              <Select value={editing.roles[0] ?? ''} onChange={(e) => setEditing({ ...editing, roles: [e.target.value] })} options={roleOptions} />
            </Field>
            <Toggle checked={editing.isActive} onChange={(v) => setEditing({ ...editing, isActive: v })} label="Cuenta activa" />
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo usuario" footer={<Button onClick={create}>Crear</Button>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Apellido">
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Correo" className="sm:col-span-2">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contraseña temporal">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={roleOptions.length ? roleOptions : [{ value: 'DOCENTE', label: 'DOCENTE' }]} />
          </Field>
        </div>
      </Modal>
    </Card>
  )
}

function RolesTab() {
  const { data, loading } = useAsync(() => adminApi.roles())
  if (loading && !data) return <Spinner />
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(data ?? []).map((r) => (
        <Card key={r.id} className="card-pad">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-base font-extrabold text-ink">{r.name}</p>
            <Badge tone={r.isActive ? 'green' : 'gray'}>{r.permissions.length} permisos</Badge>
          </div>
          <p className="mb-3 text-xs text-ink-3">{r.description}</p>
          <div className="flex flex-wrap gap-1">
            {r.permissions.map((p) => (
              <Badge key={p.id} tone="purple">
                {p.name}
              </Badge>
            ))}
            {r.name === 'SUPERADMIN' && <Badge tone="pink">Acceso total</Badge>}
          </div>
        </Card>
      ))}
    </div>
  )
}
