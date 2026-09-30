// ──────────────────────────────────────────────
// Auth Service — Login / Logout / Refresh (starter, DB)
// ──────────────────────────────────────────────

import { post, get, type ApiResponse } from './api'

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  roles?: string[]
  permissions?: string[]
  isActive?: boolean
  avatarUrl?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
  expiresAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export type AuthMethod = 'db'

// ─── Payload real del backend ────────────────

interface RawUser {
  id: number
  firstName: string
  lastName: string
  employeeId?: string
  email: string
  phoneNumber?: string
  roles: string[]
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface RawAuthResponse {
  token: string
  refreshToken: string
  Expiration: string
  User: RawUser
}

function mapRawUser(raw: RawUser): User {
  return {
    id: String(raw.id),
    email: raw.email,
    name: [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.roles?.[0] ?? '',
    roles: raw.roles ?? [],
    permissions: raw.permissions ?? [],
    isActive: raw.isActive,
  }
}

/** Verifica si el usuario posee un permiso RBAC exacto. */
export function hasPermission(
  user: Pick<User, 'permissions'> | null | undefined,
  permission: string,
): boolean {
  return user?.permissions?.includes(permission) ?? false
}

/** Verifica si el usuario tiene alguno de los roles indicados (case-insensitive). */
export function hasAnyRole(
  user: Pick<User, 'roles' | 'role'> | null | undefined,
  ...names: string[]
): boolean {
  if (!user) return false
  const have = [...(user.roles ?? []), user.role ?? ''].map(r =>
    String(r).toUpperCase(),
  )
  return names.some(n => have.includes(String(n).toUpperCase()))
}

/** Verifica si el usuario tiene rol ADMIN o SUPERADMIN. */
export function isAdminUser(
  user: Pick<User, 'roles' | 'role'> | null | undefined,
): boolean {
  if (!user) return false
  const roles = [...(user.roles ?? []), user.role ?? '']
    .map(r => String(r).toUpperCase())
  return roles.includes('ADMIN') || roles.includes('SUPERADMIN')
}

export const AUTH_METHOD: AuthMethod = 'db'

// ─── Login ───────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await post<RawAuthResponse>('/auth/login', credentials)

  if (!res.ok) {
    throw new Error(res.error || 'Error al iniciar sesión')
  }
  return {
    token: res.data.token,
    refreshToken: res.data.refreshToken,
    expiresAt: res.data.Expiration,
    user: mapRawUser(res.data.User),
  }
}

// ─── Validar token ───────────────────────────

export async function validateToken(_token: string): Promise<User> {
  const res = await get<RawUser>('/auth/me')
  if (!res.ok) {
    throw new Error(res.error || 'Token inválido')
  }
  return mapRawUser(res.data)
}

// ─── Logout ──────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    // Ignorar errores de logout en red
  }
}

// ─── Reset password ──

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ApiResponse<RawUser>> {
  return post<RawUser>('/auth/reset-password', { token, newPassword })
}

// ─── Verificar email ──

export async function verifyEmail(token: string): Promise<ApiResponse<RawUser>> {
  return post<RawUser>('/auth/verify-email', { token })
}

// ─── Solicitar correo de reset ──

export async function requestPasswordReset(email: string): Promise<ApiResponse<void>> {
  return post<void>('/auth/request-password-reset', { email })
}

// ─── Registro público de docentes ──

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  institution?: string
}

export async function signup(data: SignupData): Promise<{ requiresVerification: boolean; session?: AuthResponse }> {
  const res = await post<{ requiresVerification: boolean; session?: RawAuthResponse }>('/auth/signup', data)
  if (!res.ok) {
    throw new Error(res.error || 'No se pudo crear la cuenta')
  }
  const raw = res.data.session
  return {
    requiresVerification: res.data.requiresVerification,
    session: raw
      ? { token: raw.token, refreshToken: raw.refreshToken, expiresAt: raw.Expiration, user: mapRawUser(raw.User) }
      : undefined,
  }
}

export function getAuthMethodLabel(): string {
  return 'Base de Datos'
}

// ─── Validación previa del lado del cliente ───

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function preValidateCredentials(credentials: LoginCredentials): ValidationResult {
  const { email, password } = credentials
  if (!email?.trim()) {
    return { valid: false, error: 'El correo electrónico es requerido' }
  }
  if (!password?.trim()) {
    return { valid: false, error: 'La contraseña es requerida' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'El formato del correo no es válido' }
  }
  if (password.length < 4) {
    return { valid: false, error: 'La contraseña debe tener al menos 4 caracteres' }
  }
  return { valid: true }
}
