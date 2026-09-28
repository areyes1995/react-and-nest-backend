// ──────────────────────────────────────────────
// RBAC Service — Roles y permisos (módulo rbac)
// Endpoints: /roles/all, /roles, /roles/:identifier, /permissions
// ──────────────────────────────────────────────

import { get } from './api'

export interface PermissionDto {
  id: number
  name: string
  description?: string
  resource: string
  resourceId: number
}

export interface RoleDto {
  id: number
  name: string
  description?: string
  isActive: boolean
  permissions: PermissionDto[]
  createdAt: string
  updatedAt: string
}

export interface RoleSummaryDto {
  id: number
  name: string
  description?: string
  isActive: boolean
  permissionCount: number
  createdAt: string
  updatedAt: string
}

// ─── Roles con sus permisos anidados ───

export async function getRoles(): Promise<RoleDto[]> {
  const res = await get<RoleDto[]>('/roles/all')
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener los roles')
  }
  return res.data
}

// ─── Resumen de roles (sin permisos) ───

export async function getRolesSummary(): Promise<RoleSummaryDto[]> {
  const res = await get<RoleSummaryDto[]>('/roles/all')
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener el resumen de roles')
  }
  return res.data
}

// ─── Detalle de un rol (por id o nombre) ───

export async function getRolePermissions(identifier: string | number): Promise<RoleDto> {
  const res = await get<RoleDto>(`/roles/${identifier}`)
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener el rol')
  }
  return res.data
}

// ─── Todos los permisos ───

export async function getPermissions(): Promise<PermissionDto[]> {
  const res = await get<PermissionDto[]>('/permissions')
  if (!res.ok) {
    throw new Error(res.error || 'Error al obtener los permisos')
  }
  return res.data
}