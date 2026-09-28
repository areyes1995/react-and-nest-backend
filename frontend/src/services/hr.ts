// ──────────────────────────────────────────────
// HR Service — Atracción / rotación (módulo hr)
// Endpoints: /hr/attrition/*
// ──────────────────────────────────────────────

import { get } from './api'

export interface AttritionDashboard {
  totalEmployees: number
  employeesLeft: number
  attritionRate: number
  avgTenureMonths: number
  controllablePct: number
  nonControllablePct: number
  terminationPct: number
  avgHeadcount: number
}

export interface MonthData {
  month: string
  altas: number
  bajas: number
  netChange: number
  headcount: number
  rotacionPct: number
}

export interface AttritionTrends {
  months: MonthData[]
  avgRotacionPct: number
}

export interface DeptExitType {
  type: string
  count: number
}

export interface DepartmentAttrition {
  name: string
  headcount: number
  bajas: number
  rotacionPct: number
  controllablePct: number
  exitTypeBreakdown: DeptExitType[]
}

export interface AttritionByDepartment {
  departments: DepartmentAttrition[]
}

export interface ExitDetail {
  employeeId: string
  employeeName: string | null
  department: string | null
  organization: string | null
  exitDate: string
  exitType: string
  reasonCategory: string | null
  reasonName: string | null
  reasonText: string | null
  tenureMonths: number | null
}

export interface AttritionExitsDetail {
  exits: ExitDetail[]
}

export interface AttritionParams {
  from?: string
  to?: string
  period?: number
  top?: number
  limit?: number
}

const BASE = '/hr/attrition'

async function fetchData<T>(path: string, params?: AttritionParams): Promise<T> {
  const res = await get<T>(path, {
    from: params?.from,
    to: params?.to,
    period: params?.period,
    top: params?.top,
    limit: params?.limit,
  })
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener los datos de attrition')
  }
  return res.data
}

export function fetchAttritionDashboard(params?: AttritionParams): Promise<AttritionDashboard> {
  return fetchData<AttritionDashboard>(`${BASE}/dashboard`, params)
}

export function fetchAttritionTrends(params?: AttritionParams): Promise<AttritionTrends> {
  return fetchData<AttritionTrends>(`${BASE}/trends`, params)
}

export function fetchAttritionByDepartment(params?: AttritionParams): Promise<AttritionByDepartment> {
  return fetchData<AttritionByDepartment>(`${BASE}/by-department`, params)
}

export function fetchAttritionExitsDetail(params?: AttritionParams): Promise<AttritionExitsDetail> {
  return fetchData<AttritionExitsDetail>(`${BASE}/exits-detail`, params)
}
