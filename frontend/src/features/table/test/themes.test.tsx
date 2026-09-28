// ──────────────────────────────────────────────
// Estilos de mesa: el catálogo es coherente, todos
// pueden elegir el suyo, solo ADMIN / SUPERADMIN
// fijan el de todos y ese llega a cada usuario.
// ──────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TABLE_THEMES, isTableThemeId } from '@features/table/themes'

const auth = vi.hoisted(() => ({ user: null as null | { roles: string[] } }))
const api = vi.hoisted(() => ({
  fetchTableTheme: vi.fn(),
  saveTableTheme: vi.fn(),
}))

vi.mock('@context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('@services/table-theme', () => api)

import { TableThemeProvider, TableThemeScope } from '@features/table/TableThemeContext'
import TableThemePicker from '@components/poker/TableThemePicker'

function renderWith(children: React.ReactNode) {
  return render(
    <TableThemeProvider>
      <TableThemeScope>{children}</TableThemeScope>
    </TableThemeProvider>,
  )
}

const scopeTheme = (container: HTMLElement) =>
  container.querySelector('[data-table-theme]')?.getAttribute('data-table-theme')

beforeEach(() => {
  localStorage.clear()
  api.fetchTableTheme.mockReset().mockResolvedValue({ themeId: null, persisted: true })
  api.saveTableTheme.mockReset().mockImplementation(async (themeId: string) => ({ themeId, persisted: true }))
})

describe('catálogo de estilos', () => {
  it('tiene ids únicos y el clásico primero, sin sobrescribir colores', () => {
    const ids = TABLE_THEMES.map(theme => theme.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TABLE_THEMES[0].id).toBe('classic')
    expect(TABLE_THEMES[0].vars).toEqual({})
    expect(TABLE_THEMES.length).toBeGreaterThanOrEqual(6)
  })

  it('solo sobrescribe variables --poker-*', () => {
    for (const theme of TABLE_THEMES) {
      for (const name of Object.keys(theme.vars)) expect(name).toMatch(/^--poker-/)
    }
  })

  it('rechaza ids desconocidos', () => {
    expect(isTableThemeId('vegas')).toBe(true)
    expect(isTableThemeId('nope')).toBe(false)
    expect(isTableThemeId(null)).toBe(false)
  })
})

describe('TableThemePicker', () => {
  it('un estudiante elige su estilo pero no puede predeterminarlo', async () => {
    auth.user = { roles: ['GUEST'] }
    const { container } = renderWith(<TableThemePicker />)
    expect(screen.queryByText('Predeterminar')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTitle(/Salas del Strip/))
    expect(scopeTheme(container)).toBe('vegas')
    expect(api.saveTableTheme).not.toHaveBeenCalled()
  })

  it('ADMIN y SUPERADMIN pueden predeterminar', () => {
    for (const role of ['ADMIN', 'SUPERADMIN']) {
      auth.user = { roles: [role] }
      const { unmount } = renderWith(<TableThemePicker />)
      expect(screen.getAllByText('Predeterminar').length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('elegir un estilo cambia solo la vista del admin; predeterminarlo lo guarda', async () => {
    auth.user = { roles: ['ADMIN'] }
    const { container } = renderWith(<TableThemePicker />)

    await userEvent.click(screen.getByTitle(/Salas del Strip/))
    expect(scopeTheme(container)).toBe('vegas')
    expect(api.saveTableTheme).not.toHaveBeenCalled()

    const vegasCard = screen.getByTitle(/Salas del Strip/).parentElement!
    await userEvent.click(vegasCard.querySelector('button:last-child')!)
    expect(api.saveTableTheme).toHaveBeenCalledWith('vegas')
    expect(await screen.findByText(/mesa de todos los usuarios/)).toBeInTheDocument()
  })
})

describe('estilo por defecto', () => {
  it('un estudiante ve el que fijó el administrador', async () => {
    auth.user = { roles: ['GUEST'] }
    api.fetchTableTheme.mockResolvedValue({ themeId: 'neon', persisted: true })
    const { container } = renderWith(<span />)
    await waitFor(() => expect(scopeTheme(container)).toBe('neon'))
  })

  it('la elección personal de un estudiante manda sobre la de todos', async () => {
    auth.user = { roles: ['GUEST'] }
    localStorage.setItem('poker_table_theme_preview', 'minimal')
    api.fetchTableTheme.mockResolvedValue({ themeId: 'vegas', persisted: true })
    const { container } = renderWith(<span />)
    await waitFor(() => expect(api.fetchTableTheme).toHaveBeenCalled())
    expect(scopeTheme(container)).toBe('minimal')
  })

  it('un id desconocido del backend cae al clásico', async () => {
    auth.user = { roles: ['GUEST'] }
    api.fetchTableTheme.mockResolvedValue({ themeId: 'borrado', persisted: true })
    const { container } = renderWith(<span />)
    await waitFor(() => expect(api.fetchTableTheme).toHaveBeenCalled())
    expect(scopeTheme(container)).toBe('classic')
  })
})
