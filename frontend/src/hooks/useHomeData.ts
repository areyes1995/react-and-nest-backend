// ──────────────────────────────────────────────
// useHomeData — fetches all data needed for the
// home page from HR attrition, RAG, and notifications.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import {
  fetchAttritionDashboard,
  fetchAttritionTrends,
  fetchAttritionByDepartment,
  fetchAttritionExitsDetail,
  type AttritionDashboard,
  type AttritionTrends,
  type AttritionByDepartment,
  type AttritionExitsDetail,
} from '@services/hr'
import { ragIndexStatus, type RagIndexStatus } from '@services/rag'
import { get } from '@services/api'

export interface NotificationCount {
  count: number
}

export interface HomeDataState {
  dashboard: AttritionDashboard | null
  trends: AttritionTrends | null
  byDepartment: AttritionByDepartment | null
  exitsDetail: AttritionExitsDetail | null
  ragStatus: RagIndexStatus | null
  unreadNotifications: number
  loading: boolean
  error: string | null
  reload: () => void
}

export function useHomeData(): HomeDataState {
  const [dashboard, setDashboard] = useState<AttritionDashboard | null>(null)
  const [trends, setTrends] = useState<AttritionTrends | null>(null)
  const [byDepartment, setByDepartment] = useState<AttritionByDepartment | null>(null)
  const [exitsDetail, setExitsDetail] = useState<AttritionExitsDetail | null>(null)
  const [ragStatus, setRagStatus] = useState<RagIndexStatus | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const to = now.toISOString().slice(0, 10)
      const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10)

      const [d, t, b, e, r, n] = await Promise.allSettled([
        fetchAttritionDashboard({ from, to }),
        fetchAttritionTrends({ from, to }),
        fetchAttritionByDepartment({ from, to, top: 8 }),
        fetchAttritionExitsDetail({ from, to, limit: 6 }),
        ragIndexStatus(),
        get<NotificationCount>('/notifications/unread-count'),
      ])

      if (d.status === 'fulfilled') setDashboard(d.value)
      if (t.status === 'fulfilled') setTrends(t.value)
      if (b.status === 'fulfilled') setByDepartment(b.value)
      if (e.status === 'fulfilled') setExitsDetail(e.value)
      if (r.status === 'fulfilled') setRagStatus(r.value)
      if (n.status === 'fulfilled' && n.value.ok) {
        setUnreadNotifications(n.value.data.count)
      }

      const failures = [d, t, b, r].filter(r => r.status === 'rejected')
      if (failures.length === 4) {
        setError('Error loading dashboard data')
      }
    } catch {
      setError('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    dashboard,
    trends,
    byDepartment,
    exitsDetail,
    ragStatus,
    unreadNotifications,
    loading,
    error,
    reload: load,
  }
}
