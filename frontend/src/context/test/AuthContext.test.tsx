import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@context/AuthContext'

vi.mock('@services/auth', async original => {
  const actual = await original<typeof import('@services/auth')>()
  return {
    ...actual,
    login: vi.fn(),
    validateToken: vi.fn(),
    logout: vi.fn(),
  }
})

vi.mock('@services/api', () => ({
  setUnauthorizedHandler: vi.fn(),
}))

import { login as apiLogin, validateToken, logout as apiLogout } from '@services/auth'

const user = {
  id: '1',
  email: 'a@b.c',
  name: 'Ana B',
  role: 'ADMIN',
  roles: ['ADMIN'],
  permissions: [],
}

function Probe() {
  const ctx = useAuth()
  return (
    <div>
      <span data-testid="auth">{String(ctx.isAuthenticated)}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="error">{ctx.error ?? 'none'}</span>
      <span data-testid="email">{ctx.user?.email ?? 'nouser'}</span>
      <button onClick={() => ctx.login({ email: 'a@b.c', password: '1234' })}>login</button>
      <button onClick={() => ctx.login({ email: 'mal', password: '1' })}>bad-login</button>
      <button onClick={() => ctx.logout()}>logout</button>
      <button onClick={() => ctx.clearError()}>clear</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('sin token: no autenticado y loading false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(validateToken).not.toHaveBeenCalled()
  })

  it('con token válido restaura la sesión', async () => {
    localStorage.setItem('auth_token', 't1')
    vi.mocked(validateToken).mockResolvedValue(user as any)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('a@b.c'))
    expect(screen.getByTestId('auth').textContent).toBe('true')
  })

  it('con token inválido limpia storage', async () => {
    localStorage.setItem('auth_token', 'bad')
    vi.mocked(validateToken).mockRejectedValue(new Error('invalid'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(screen.getByTestId('auth').textContent).toBe('false')
  })

  it('login válido guarda tokens y usuario', async () => {
    vi.mocked(apiLogin).mockResolvedValue({ user, token: 't', refreshToken: 'r', expiresAt: 'x' } as any)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))
    expect(localStorage.getItem('auth_token')).toBe('t')
    expect(localStorage.getItem('refresh_token')).toBe('r')
  })

  it('login con credenciales inválidas no llama al API y setea error', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await act(async () => {
      screen.getByText('bad-login').click()
    })
    expect(apiLogin).not.toHaveBeenCalled()
    expect(screen.getByTestId('error').textContent).not.toBe('none')
    await act(async () => {
      screen.getByText('clear').click()
    })
    expect(screen.getByTestId('error').textContent).toBe('none')
  })

  it('login con error del API setea el mensaje', async () => {
    vi.mocked(apiLogin).mockRejectedValue(new Error('credenciales malas'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('credenciales malas'))
  })

  it('logout limpia todo aunque el API falle', async () => {
    localStorage.setItem('auth_token', 't1')
    vi.mocked(validateToken).mockResolvedValue(user as any)
    vi.mocked(apiLogout).mockRejectedValue(new Error('net'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))
    await act(async () => {
      screen.getByText('logout').click()
    })
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('false'))
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('useAuth fuera del provider lanza', () => {
    const Bad = () => {
      useAuth()
      return null
    }
    expect(() => render(<Bad />)).toThrow('useAuth debe usarse dentro de un AuthProvider')
  })
})
