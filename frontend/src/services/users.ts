// ──────────────────────────────────────────────
// Users API — Cliente HTTP para gestión de usuarios
// ──────────────────────────────────────────────

import { get, del } from './api'
import type { ApiResponse } from './api'

export interface UserQueryParams {
  page?: number
  pageSize?: number
  filter?: Record<string, unknown>
}

export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  employeeId?: string
  email: string
  phoneNumber?: string
  roles: string[]
  permissions: string[]
  isActive: boolean
  emailVerified: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export interface PagedUserResponse {
  items: UserResponse[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

export function getUsers(params?: UserQueryParams): Promise<ApiResponse<PagedUserResponse>> {
  const queryParams: Record<string, string | number | boolean | undefined> = {}

  if (params?.page !== undefined) {
    queryParams.page = params.page
  } else {
    queryParams.page = 1
  }

  if (params?.pageSize !== undefined) {
    queryParams.pageSize = params.pageSize
  } else {
    queryParams.pageSize = 10
  }

  if (params?.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      queryParams[`filter[${key}]`] = value as string | number | boolean | undefined
    }
  }

  return get<PagedUserResponse>('/users', queryParams)
}

export function deactivateUser(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/users/${id}`)
}

export function deleteUser(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/users/hard/${id}`)
}
