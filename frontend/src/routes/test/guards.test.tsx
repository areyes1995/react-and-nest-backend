import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  ProtectedRoute,
  PermissionRoute,
  GuestRoute,
  IndexRedirect,
  LoadingScreen,
} from '@routes/guards'

vi.mock('@context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@context/AuthContext'

const authMock = vi.mocked(useAuth)

function renderWithRouter(ui: React.ReactNode, initial = '/') {
  return render(<MemoryRouter initialEntries={[initial]}>{ui}</MemoryRouter>)
}

describe('route guards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('LoadingScreen renderiza el spinner', () => {
    render(<LoadingScreen />)
    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  it('ProtectedRoute: loading → LoadingScreen', () => {
    authMock.mockReturnValue({ isLoading: true } as any)
    renderWithRouter(<ProtectedRoute><p>ok</p></ProtectedRoute>)
    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  it('ProtectedRoute: sin auth → /login', () => {
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: false } as any)
    renderWithRouter(<ProtectedRoute><p>ok</p></ProtectedRoute>, '/app')
    expect(screen.queryByText('ok')).toBeNull()
  })

  it('ProtectedRoute: con auth → children', () => {
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: true } as any)
    renderWithRouter(<ProtectedRoute><p>ok</p></ProtectedRoute>)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('PermissionRoute: sin permiso → fallback', () => {
    authMock.mockReturnValue({
      isLoading: false,
      user: { permissions: [] },
    } as any)
    renderWithRouter(
      <PermissionRoute permission="module:coaching">
        <p>secreto</p>
      </PermissionRoute>,
      '/app/records',
    )
    expect(screen.queryByText('secreto')).toBeNull()
  })

  it('PermissionRoute: con permiso → children', () => {
    authMock.mockReturnValue({
      isLoading: false,
      user: { permissions: ['module:coaching'] },
    } as any)
    renderWithRouter(
      <PermissionRoute permission="module:coaching">
        <p>secreto</p>
      </PermissionRoute>,
    )
    expect(screen.getByText('secreto')).toBeInTheDocument()
  })

  it('GuestRoute: autenticado → /app; invitado → children', () => {
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: true } as any)
    const { unmount } = renderWithRouter(<GuestRoute><p>login</p></GuestRoute>, '/login')
    expect(screen.queryByText('login')).toBeNull()
    unmount()
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: false } as any)
    renderWithRouter(<GuestRoute><p>login</p></GuestRoute>, '/login')
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it('IndexRedirect: redirige según auth', () => {
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: true } as any)
    const { unmount } = renderWithRouter(<IndexRedirect />, '/')
    unmount()
    authMock.mockReturnValue({ isLoading: false, isAuthenticated: false } as any)
    renderWithRouter(<IndexRedirect />, '/')
  })
})
