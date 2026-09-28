// ──────────────────────────────────────────────
// UsersPage — Tabla de usuarios con filtros
// Muestra los usuarios desde el backend con
// búsqueda global y filtros por columna
// ──────────────────────────────────────────────

import { useMemo, useState, useEffect, useCallback } from 'react'
import RecordsTable, { type RecordData } from '@components/records/RecordsTable'
import type { RecordColumn } from '@records'
import { ViewHeader } from '@components/ui'
import { getUsers, deleteUser, deactivateUser, type UserResponse } from '@services/users'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useAuth } from '@context/AuthContext'
import { isAdminUser } from '@services/auth'

interface UserRecordData extends RecordData {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
  phoneNumber: string
  roles: string
  isActive: string
  emailVerified: string
  mustChangePassword: string
  createdAt: string
  updatedAt: string
}

const STATUS_MAP: Record<string, string> = {
  'true': 'Active',
  'false': 'Archived',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function transformUserToRecord(user: UserResponse): UserRecordData {
  const isActive = String(user.isActive)
  const rolesArray = Array.isArray(user.roles) ? user.roles : user.roles ? String(user.roles) : ''
  const rolesStr = typeof rolesArray === 'string' ? rolesArray : (Array.isArray(rolesArray) ? rolesArray.join(', ') : '')
  return {
    id: `U-${String(user.id).padStart(3, '0')}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    employeeId: user.employeeId ?? '',
    phoneNumber: user.phoneNumber ?? '',
    roles: rolesStr,
    isActive: STATUS_MAP[isActive] ?? 'Active',
    emailVerified: String(user.emailVerified),
    mustChangePassword: String(user.mustChangePassword),
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
    status: isActive === 'false' ? 'Archived' : 'Active',
  }
}

const usersColumns: RecordColumn[] = [
  { key: 'firstName', header: 'First Name', type: 'text' },
  { key: 'lastName', header: 'Last Name', type: 'text' },
  { key: 'email', header: 'Email', type: 'text' },
  { key: 'employeeId', header: 'Employee ID', type: 'text' },
  { key: 'phoneNumber', header: 'Phone', type: 'text' },
  { key: 'roles', header: 'Roles', type: 'text' },
  { key: 'isActive', header: 'Status', type: 'select', options: ['true', 'false'] },
  { key: 'emailVerified', header: 'Email Verified', type: 'select', options: ['true', 'false'] },
  { key: 'mustChangePassword', header: 'Force Password Change', type: 'select', options: ['true', 'false'] },
  { key: 'createdAt', header: 'Created', type: 'date' },
  { key: 'updatedAt', header: 'Updated', type: 'date' },
]

interface UsersPageProps {
  data?: UserResponse[]
  pagination?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  isLoading?: boolean
}

function PaginationControls({ pagination, onPageChange, onPageSizeChange, pageSize }: {
  pagination: UsersPageProps['pagination']
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSize: number
}) {
  const { t } = useAppTranslation()

  if (!pagination) return null

  const { page, totalItems, totalPages } = pagination

  return (
    <div className="px-4 lg:px-6 py-3 border-t border-[var(--border)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-2">
        <span>{t('Rows per page:')}</span>
        <select
          className="bg-[var(--bg-surface)] border border-[var(--border-active)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]"
          value={pageSize}
          onChange={e => {
            const size = Number(e.target.value)
            if (onPageSizeChange) onPageSizeChange(size)
            else onPageChange(1)
          }}
        >
          {[10, 25, 50].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <span className="mr-2">
          {t('Page')} {page} {t('of')} {totalPages}
        </span>
      </div>

      <div>
        {totalItems} {t('records total')}
      </div>
    </div>
  )
}

export default function UsersPage({ data: propData, pagination: propPagination, isLoading: propLoading }: UsersPageProps) {
  const { user } = useAuth()

  const [data, setData] = useState<UserResponse[]>(propData ?? [])
  const [paginationState, setPaginationState] = useState<UsersPageProps['pagination']>(propPagination)
  const [loading, setLoading] = useState(propLoading ?? true)

  // Solo ADMIN/SUPERADMIN pueden desactivar usuarios (espejo del backend RF01).
  const hasDeletePermission = isAdminUser(user)

  const handleDeleteUser = useCallback(async (id: string) => {
    const numericId = parseInt(id.replace('U-', ''), 10)
    if (!confirm('Are you sure you want to deactivate this user?')) return
    try {
      const response = await deleteUser(numericId)
      if (response.ok) {
        fetchData(paginationState?.page ?? 1, paginationState?.pageSize ?? 10, {})
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }, [paginationState])

  const handleDeactivateUser = useCallback(async (id: string) => {
    const numericId = parseInt(id.replace('U-', ''), 10)
    if (!confirm('Are you sure you want to deactivate this user?')) return
    try {
      const response = await deactivateUser(numericId)
      if (response.ok) {
        fetchData(paginationState?.page ?? 1, paginationState?.pageSize ?? 10, {})
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    }
  }, [paginationState])

  const fetchData = useCallback(async (page: number = 1, pageSize: number = 10, filters: Record<string, unknown> = {}) => {
    setLoading(true)
    try {
      const response = await getUsers({ page, pageSize, filter: filters })
      if (response.ok && response.data) {
        setData(response.data.items)
        setPaginationState({
          page,
          pageSize: response.data.pageSize,
          totalItems: response.data.totalItems,
          totalPages: response.data.totalPages,
        })
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(1, 10, {})
  }, [])

  const tableData = useMemo<UserRecordData[]>(() => {
    return data.map(transformUserToRecord)
  }, [data])

  const handlePageChange = useCallback((page: number) => {
    const currentPageSize = paginationState?.pageSize ?? 10
    fetchData(page, currentPageSize)
  }, [paginationState])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchData(1, pageSize)
  }, [fetchData])

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <ViewHeader title="Users" />
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading users...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ViewHeader
        title="Users"
        subtitle={`${paginationState?.totalItems ?? 0} total users`}
      />
      <div className="flex-1 min-h-0 flex flex-col">
        <RecordsTable
          data={tableData as RecordData[]}
          columns={usersColumns}
          hideFilter={false}
          defaultPageSize={paginationState?.pageSize ?? 10}
          onDeactivate={handleDeactivateUser}
          onDelete={hasDeletePermission ? handleDeleteUser : undefined}
        />
        <PaginationControls
          pagination={paginationState}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={(paginationState?.pageSize) ?? 10}
        />
      </div>
    </div>
  )
}
