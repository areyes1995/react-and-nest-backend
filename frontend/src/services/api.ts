// ──────────────────────────────────────────────
// API Service — Cliente HTTP base
// ──────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiResponse<T = unknown> {
  ok: boolean
  status: number
  data: T
  error?: string
}

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

// ─── Sesión expirada (401) ───────────────────
// Si la API responde 401 con un token presente se
// intenta renovar la sesión con el refresh token y
// se reintenta la petición. Si el refresh falla,
// se avisa al AuthContext para cerrar sesión.

const REFRESH_PATH = '/auth/refresh'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let refreshPromise: Promise<boolean> | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

function notifyUnauthorized(): void {
  unauthorizedHandler?.()
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(buildUrl(REFRESH_PATH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false

      const data = (await response.json()) as { token?: string; refreshToken?: string }
      if (!data.token) return false

      localStorage.setItem('auth_token', data.token)
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  let url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }
  return url
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const maxAttempts = 2

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await fetch(buildUrl(path, options.params), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: undefined as unknown as T,
        error: (err as Error)?.message || 'Network error',
      }
    }

    if (response.status === 401 && getToken()) {
      const canRetry =
        path !== REFRESH_PATH && attempt < maxAttempts - 1 && getRefreshToken()
      if (canRetry) {
        const refreshed = await refreshSession()
        if (refreshed) continue
      }
      notifyUnauthorized()
    }

    let data: T = undefined as unknown as T
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      }
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: undefined as unknown as T,
        error: (err as Error)?.message || 'Invalid response',
      }
    }

    if (!response.ok) {
      const body = data as Record<string, unknown> | null
      let errorText: string | undefined
      if (typeof body?.message === 'string') {
        errorText = body.message
      } else if (Array.isArray(body?.message)) {
        errorText = body.message.join('. ')
      }
      return {
        ok: false,
        status: response.status,
        data,
        error: errorText || (typeof body?.error === 'string' && body.error) || response.statusText,
      }
    }

    return {
      ok: true,
      status: response.status,
      data,
    }
  }

  return {
    ok: false,
    status: 401,
    data: undefined as unknown as T,
    error: 'Unauthorized',
  }
}

// ─── Verbos HTTP ────────────────────────────

export function get<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'GET', params })
}

export function post<T = unknown>(
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'POST', body })
}

export function put<T = unknown>(
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PUT', body })
}

export function patch<T = unknown>(
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PATCH', body })
}

export function del<T = unknown>(
  path: string,
): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' })
}

export { BASE_URL }
export type { ApiResponse, RequestOptions }

// ─── Peticiones sin JSON (archivos) ───────────

async function errorFrom(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as { message?: string | string[] }
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message)) return data.message.join('. ')
  } catch {
    /* el error no es JSON */
  }
  return response.statusText || 'Error de red'
}

/** fetch con token + un reintento tras renovar la sesión ante un 401. */
async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const attempt = () => {
    const token = getToken()
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(buildUrl(path), { ...init, headers })
  }
  let response = await attempt()
  if (response.status === 401 && getToken() && getRefreshToken() && path !== REFRESH_PATH) {
    if (await refreshSession()) response = await attempt()
  }
  if (response.status === 401) notifyUnauthorized()
  return response
}

/** Descarga un archivo protegido como Blob. */
export async function getBlob(path: string): Promise<Blob> {
  const response = await authorizedFetch(path)
  if (!response.ok) throw new Error(await errorFrom(response))
  return response.blob()
}

/** Envía un formulario multipart (subida de archivos). */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const response = await authorizedFetch(path, { method: 'POST', body: form })
  if (!response.ok) throw new Error(await errorFrom(response))
  return (await response.json()) as T
}
