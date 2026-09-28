// ──────────────────────────────────────────────
// UsersPage — tabla simple de usuarios (starter).
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { ViewHeader, EmptyState } from '@components/ui'
import { getUsers, deleteUser, type UserResponse } from '@services/users'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function UsersPage() {
  const { t } = useAppTranslation()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getUsers()
      if (res.ok) {
        setUsers(res.data.items ?? [])
      } else {
        setError(res.error || t('users.loadError'))
      }
    } catch {
      setError(t('users.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('users.confirmDelete'))) return
    await deleteUser(id)
    void load()
  }

  if (loading) return <div className="p-6 text-sm text-[var(--text-muted)]">{t('common.loading')}</div>
  if (error) return <div className="p-6 text-sm text-red-400">{error}</div>

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <ViewHeader title={t('users.title')} subtitle={t('users.subtitle')} />
      {users.length === 0 ? (
        <EmptyState title={t('users.empty')} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)] text-left">
              <tr>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('users.name')}</th>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('users.email')}</th>
                <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">{t('users.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 text-[var(--text-primary)]">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">
                    {u.isActive ? t('common.yes') : t('common.no')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDelete(u.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {t('common.delete')}
                    </button>
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
