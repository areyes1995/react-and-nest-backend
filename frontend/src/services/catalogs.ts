// ──────────────────────────────────────────────
// Catalogs API — Pabellones temáticos (spec §2.1 + §3.1)
// CRUD en /config/catalogs — solo ADMIN escribe; lectura autenticada.
// El GET sin ?all lista activos; con ?all=true lista todos (ADMIN).
// ──────────────────────────────────────────────

import { get, post, patch, del } from './api'
import type { ApiResponse } from './api'

export interface PavilionArea {
  id: number
  key: string
  label: string
  pavilion: string
  tagline: string
  description: string
  accent: string
  icon: string
  keywords: string[]
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PavilionPayload {
  key: string
  label: string
  pavilion?: string
  tagline?: string
  description?: string
  accent?: string
  icon?: string
  keywords?: string[]
  sortOrder?: number
  isActive?: boolean
}

export interface UpdatePavilionPayload {
  label?: string
  pavilion?: string
  tagline?: string
  description?: string
  accent?: string
  icon?: string
  keywords?: string[]
  sortOrder?: number
  isActive?: boolean
}

export function listPavilions(all = false): Promise<ApiResponse<PavilionArea[]>> {
  return get<PavilionArea[]>('/config/catalogs', all ? { all: 'true' } : undefined)
}

export function getPavilion(id: number): Promise<ApiResponse<PavilionArea>> {
  return get<PavilionArea>(`/config/catalogs/${id}`)
}

export function createPavilion(payload: PavilionPayload): Promise<ApiResponse<PavilionArea>> {
  return post<PavilionArea>('/config/catalogs', payload)
}

export function updatePavilion(id: number, payload: UpdatePavilionPayload): Promise<ApiResponse<PavilionArea>> {
  return patch<PavilionArea>(`/config/catalogs/${id}`, payload)
}

export function deletePavilion(id: number): Promise<ApiResponse<{ deleted: boolean; id: number }>> {
  return del<{ deleted: boolean; id: number }>(`/config/catalogs/${id}`)
}
