// ──────────────────────────────────────────────
// useAttritionReport — orquesta los datos del reporte
// de attrition desde los endpoints /hr/attrition/*
// Maneja loading, error y el rango de fechas global.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
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

export type PeriodKey = '3' | '6' | '12' | 'YTD' | 'custom'

export interface DateRange {
  from?: string
  to?: string
}

export interface AttritionReportState {
  dashboard: AttritionDashboard | null
  trends: AttritionTrends | null
  byDepartment: AttritionByDepartment | null
  exitsDetail: AttritionExitsDetail | null
  loading: boolean
  error: string | null
  period: PeriodKey
  dateRange: DateRange
  setPeriod: (p: PeriodKey) => void
  setDateRange: (r: DateRange) => void
  reload: () => void
}

function getDefaultRange(period: PeriodKey): DateRange {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  if (period === 'YTD') {
    return { from: `${now.getFullYear()}-01-01`, to }
  }
  const n = Number(period)
  if (!Number.isFinite(n) || n <= 0) {
    return { to }
  }
  const from = new Date(now.getFullYear(), now.getMonth() - n + 1, 1)
  return { from: from.toISOString().slice(0, 10), to }
}

export function useAttritionReport(): AttritionReportState {
  const [period, setPeriod] = useState<PeriodKey>('12')
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultRange('12'))
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  const [dashboard, setDashboard] = useState<AttritionDashboard | null>(null)
  const [trends, setTrends] = useState<AttritionTrends | null>(null)
  const [byDepartment, setByDepartment] = useState<AttritionByDepartment | null>(null)
  const [exitsDetail, setExitsDetail] = useState<AttritionExitsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveRange = useMemo<DateRange>(() => {
    if (period === 'custom') {
      return customRange ?? { to: new Date().toISOString().slice(0, 10) }
    }
    return getDefaultRange(period)
  }, [period, customRange])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const base = {
      from: effectiveRange.from,
      to: effectiveRange.to,
    }
    const periodNum = Number(period)
    const params = Number.isFinite(periodNum)
      ? { ...base, period: periodNum }
      : base
    try {
      const [d, t, b, e] = await Promise.all([
        fetchAttritionDashboard(params),
        fetchAttritionTrends({ ...params }),
        fetchAttritionByDepartment({ ...params, top: 10 }),
        fetchAttritionExitsDetail({ ...params, limit: 50 }),
      ])
      setDashboard(d)
      setTrends(t)
      setByDepartment(b)
      setExitsDetail(e)
    } catch (err) {
      setError((err as Error)?.message || 'Error cargando el reporte')
    } finally {
      setLoading(false)
    }
  }, [effectiveRange.from, effectiveRange.to, period])

  useEffect(() => {
    load()
  }, [load])

  const handleSetPeriod = useCallback((p: PeriodKey) => {
    setPeriod(p)
    if (p !== 'custom') setDateRange(getDefaultRange(p))
  }, [])

  const handleSetDateRange = useCallback((r: DateRange) => {
    setCustomRange(r)
    setPeriod('custom')
    setDateRange(r)
  }, [])

  return {
    dashboard,
    trends,
    byDepartment,
    exitsDetail,
    loading,
    error,
    period,
    dateRange,
    setPeriod: handleSetPeriod,
    setDateRange: handleSetDateRange,
    reload: load,
  }
}
