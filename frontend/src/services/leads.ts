// ──────────────────────────────────────────────
// Leads API — Solicitudes de contacto (RF13)
// Lectura con scope: admin ve todo, el resto
// solo leads de sus proyectos propios.
// ──────────────────────────────────────────────

import { get } from './api'
import type { ApiResponse } from './api'

export interface BackendLead {
  id: number
  projectId: number
  projectTitle: string | null
  visitorName: string
  visitorEmail: string | null
  message: string | null
  createdAt: string
}

export interface PagedLeadResponse {
  items: BackendLead[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LeadQuery {
  search?: string
  projectId?: number
  page?: number
  pageSize?: number
}

export function listLeads(query: LeadQuery = {}): Promise<ApiResponse<PagedLeadResponse>> {
  return get<PagedLeadResponse>('/leads', {
    search: query.search || undefined,
    projectId: query.projectId,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  })
}

export function getLead(id: string | number): Promise<ApiResponse<BackendLead>> {
  return get<BackendLead>(`/leads/${id}`)
}
