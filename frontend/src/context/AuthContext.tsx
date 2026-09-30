// ──────────────────────────────────────────────
// AuthContext — Estado global de autenticación
// ──────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { login as apiLogin, validateToken, logout as apiLogout, preValidateCredentials } from '@services/auth'
import { setUnauthorizedHandler } from '@services/api'
import type { User, LoginCredentials, AuthResponse } from '@services/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  /** Inicia sesión con una respuesta ya obtenida (p. ej. tras registrarse). */
  startSession: (auth: AuthResponse) => void
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user && !!token

  // ─── Validar token al montar ───────────────

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    validateToken(savedToken)
      .then(userData => {
        setUser(userData)
        setToken(savedToken)
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // ─── Cerrar sesión automáticamente si la API responde 401 ───

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setToken(null)
      setUser(null)
      setError(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // ─── Login ─────────────────────────────────

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null)

    // ── Pre‑validación del lado del cliente ──
    const validation = preValidateCredentials(credentials)
    if (!validation.valid) {
      setError(validation.error || 'Credenciales inválidas')
      return
    }

    setIsSubmitting(true)

    try {
      const authResponse = await apiLogin(credentials)
      localStorage.setItem('auth_token', authResponse.token)
      if (authResponse.refreshToken) {
        localStorage.setItem('refresh_token', authResponse.refreshToken)
      }
      setToken(authResponse.token)
      setUser(authResponse.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const startSession = useCallback((auth: AuthResponse) => {
    localStorage.setItem('auth_token', auth.token)
    if (auth.refreshToken) localStorage.setItem('refresh_token', auth.refreshToken)
    setToken(auth.token)
    setUser(auth.user)
    setError(null)
  }, [])

  // ─── Logout ────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Ignorar errores
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setToken(null)
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isSubmitting,
        error,
        login,
        startSession,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export default AuthContext