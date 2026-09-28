import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}))

import { get } from '@services/api'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@services/notifications'
import {
  getRoles,
  getRolesSummary,
  getRolePermissions,
  getPermissions,
} from '@services/rbac'
import { getUsers, deactivateUser, deleteUser } from '@services/users'
import {
  fetchAttritionDashboard,
  fetchAttritionTrends,
  fetchAttritionByDepartment,
  fetchAttritionExitsDetail,
} from '@services/hr'

const getMock = vi.mocked(get)

describe('notifications service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list defaults page=1 pageSize=15', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: { items: [] } } as any)
    const out = await listNotifications()
    expect(out).toEqual({ items: [] })
    expect(get).toHaveBeenCalledWith(
      '/notifications',
      expect.objectContaining({ page: 1, pageSize: 15 }),
    )
  })

  it('getUnreadCount extrae count', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: { count: 4 } } as any)
    await expect(getUnreadCount()).resolves.toBe(4)
    expect(get).toHaveBeenCalledWith('/notifications/unread-count')
  })

  it('mark paths', async () => {
    const { patch } = await import('@services/api')
    vi.mocked(patch).mockResolvedValue({ ok: true, status: 200, data: null } as any)
    await markNotificationRead(9)
    expect(patch).toHaveBeenCalledWith('/notifications/9/read')
    await markAllNotificationsRead()
    expect(patch).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('lanza si !ok', async () => {
    getMock.mockResolvedValue({ ok: false, status: 500, error: 'e' } as any)
    await expect(listNotifications()).rejects.toThrow('e')
    await expect(getUnreadCount()).rejects.toThrow('e')
  })
})

describe('rbac service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('paths correctos', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: [] } as any)
    await getRoles()
    expect(get).toHaveBeenCalledWith('/roles/all')
    await getRolesSummary()
    expect(get).toHaveBeenCalledWith('/roles/all')
    await getRolePermissions('ADMIN')
    expect(get).toHaveBeenCalledWith('/roles/ADMIN')
    await getPermissions()
    expect(get).toHaveBeenCalledWith('/permissions')
  })

  it('propaga error', async () => {
    getMock.mockResolvedValue({ ok: false, status: 403, error: 'denied' } as any)
    await expect(getRoles()).rejects.toThrow('denied')
  })
})

describe('users service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults page=1 pageSize=10 y expande filter', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: {} } as any)
    await getUsers({ filter: { role: 'ADMIN', active: true } })
    expect(get).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        'filter[role]': 'ADMIN',
        'filter[active]': true,
      }),
    )
  })

  it('respeta page/pageSize explícitos', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: {} } as any)
    await getUsers({ page: 3, pageSize: 25 })
    expect(get).toHaveBeenCalledWith('/users', expect.objectContaining({ page: 3, pageSize: 25 }))
  })

  it('delete paths', async () => {
    const { del } = await import('@services/api')
    vi.mocked(del).mockResolvedValue({ ok: true, status: 200, data: undefined } as any)
    await deactivateUser(4)
    expect(del).toHaveBeenCalledWith('/users/4')
    await deleteUser(4)
    expect(del).toHaveBeenCalledWith('/users/hard/4')
  })
})

describe('hr service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('paths /hr/attrition/* con params', async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: {} } as any)
    await fetchAttritionDashboard({ from: '2025-01-01', to: '2026-01-01' })
    expect(get).toHaveBeenCalledWith(
      '/hr/attrition/dashboard',
      expect.objectContaining({ from: '2025-01-01' }),
    )
    await fetchAttritionTrends()
    expect(get).toHaveBeenCalledWith('/hr/attrition/trends', expect.anything())
    await fetchAttritionByDepartment()
    expect(get).toHaveBeenCalledWith('/hr/attrition/by-department', expect.anything())
    await fetchAttritionExitsDetail({ limit: 5 })
    expect(get).toHaveBeenCalledWith(
      '/hr/attrition/exits-detail',
      expect.objectContaining({ limit: 5 }),
    )
  })

  it('!ok lanza', async () => {
    getMock.mockResolvedValue({ ok: false, status: 500, error: 'hr down' } as any)
    await expect(fetchAttritionDashboard()).rejects.toThrow('hr down')
  })
})
