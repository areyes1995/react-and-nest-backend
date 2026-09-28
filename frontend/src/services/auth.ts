// ──────────────────────────────────────────────
// Auth Service — Login / Logout / Refresh
// Soporta: DB (base de datos) y LDAP
// ──────────────────────────────────────────────

import { post, get, MOCK_ENABLED, type ApiResponse } from './api'
import { mockLogin, mockLdapLogin, mockValidateToken } from '../mocks/auth'

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

export type AuthMethod = 'db' | 'ldap'

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

/** Verifica si el usuario posee un permiso RBAC exacto (ej. `module:coaching`). */
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

/**
 * Puede gestionar contenido (proyectos/stands): ADMIN, SUPERADMIN o EXHIBITOR.
 * Espejo frontend de los guards @Roles del backend (RF04/RF10, RF-3D-46).
 */
export function canManageContent(
  user: Pick<User, 'roles' | 'role'> | null | undefined,
): boolean {
  return hasAnyRole(user, 'ADMIN', 'SUPERADMIN', 'EXHIBITOR')
}

/** Verifica si el usuario tiene rol ADMIN o SUPERADMIN (gestión: ferias, usuarios, etc.). */
export function isAdminUser(
  user: Pick<User, 'roles' | 'role'> | null | undefined,
): boolean {
  if (!user) return false
  const roles = [...(user.roles ?? []), user.role ?? '']
    .map(r => String(r).toUpperCase())
  return roles.includes('ADMIN') || roles.includes('SUPERADMIN')
}

// ─── Leer método desde .env ──────────────────

export const AUTH_METHOD: AuthMethod =
  (import.meta.env.VITE_AUTH_METHOD as AuthMethod) || 'db'

export const LDAP_CONFIG = {
  host: import.meta.env.VITE_LDAP_HOST || 'ldap.example.com',
  port: Number(import.meta.env.VITE_LDAP_PORT) || 389,
  baseDn: import.meta.env.VITE_LDAP_BASE_DN || 'dc=uapaverse,dc=edu',
  domain: import.meta.env.VITE_LDAP_DOMAIN || 'uapaverse.edu',
  bindDn: import.meta.env.VITE_LDAP_BIND_DN || '',
  bindPassword: import.meta.env.VITE_LDAP_BIND_PASSWORD || '',
}

// ─── Login ───────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  if (MOCK_ENABLED) {
    if (AUTH_METHOD === 'ldap') {
      return mockLdapLogin(credentials)
    }
    return mockLogin(credentials)
  }

  // ── Producción: decide endpoint según método ──
  const endpoint = AUTH_METHOD === 'ldap' ? '/auth/ldap/login' : '/auth/login'

  const res = await post<RawAuthResponse>(endpoint, {
    ...credentials,
    ...(AUTH_METHOD === 'ldap' && {
      ldapHost: LDAP_CONFIG.host,
      ldapPort: LDAP_CONFIG.port,
      ldapBaseDn: LDAP_CONFIG.baseDn,
    }),
  })
  
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

export async function validateToken(token: string): Promise<User> {
  if (MOCK_ENABLED) {
    return mockValidateToken(token)
  }

  const res = await get<RawUser>('/auth/me')
  if (!res.ok) {
    throw new Error(res.error || 'Token inválido')
  }
  console.log(res.data);

  return mapRawUser(res.data)
}

// ─── Logout ──────────────────────────────────

export async function logout(): Promise<void> {
  if (MOCK_ENABLED) {
    return
  }

  try {
    await post('/auth/logout')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    // Ignorar errores de logout en red
  }
}

// ─── Reset password (token de "password-change") ──

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ApiResponse<RawUser>> {
  return post<RawUser>('/auth/reset-password', { token, newPassword })
}

// ─── Verificar email (token de "email-verify") ──

export async function verifyEmail(token: string): Promise<ApiResponse<RawUser>> {
  return post<RawUser>('/auth/verify-email', { token })
}

// ─── Solicitar correo de reset de contraseña ──

export async function requestPasswordReset(email: string): Promise<ApiResponse<void>> {
  return post<void>('/auth/request-password-reset', { email })
}

// ─── Obtener label del método actual ─────────

export function getAuthMethodLabel(): string {
  return AUTH_METHOD === 'ldap' ? 'LDAP / Active Directory' : 'Base de Datos'
}

// ─── Validación previa del lado del cliente ───

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida las credenciales ANTES de llamar al API/mock.
 * Corre 100% en cliente, sin depender del backend.
 */
export function preValidateCredentials(credentials: LoginCredentials): ValidationResult {
  const { email, password } = credentials

  // ─ Campo obligatorio ─
  if (!email?.trim()) {
    return { valid: false, error: 'El correo electrónico es requerido' }
  }
  if (!password?.trim()) {
    return { valid: false, error: 'La contraseña es requerida' }
  }

  // ─ Formato de email ─
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'El formato del correo no es válido' }
  }


  // ─ Longitud mínima de contraseña ─
  if (password.length < 4) {
    return { valid: false, error: 'La contraseña debe tener al menos 4 caracteres' }
  }

  return { valid: true }
}