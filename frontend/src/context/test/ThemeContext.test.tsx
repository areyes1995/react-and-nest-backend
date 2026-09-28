import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@context/ThemeContext'

function matchMediaMock(matches: boolean) {
  const listeners = new Set<() => void>()
  const mq = {
    matches,
    media: '(prefers-color-scheme: light)',
    addEventListener: vi.fn((_e: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((cb: () => void) => listeners.delete(cb)),
    dispatchEvent: vi.fn(),
    _emit: () => listeners.forEach(cb => cb()),
  }
  // jsdom no implementa matchMedia: se asigna directamente
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue(mq),
    writable: true,
    configurable: true,
  })
  return mq
}

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>to-light</button>
      <button onClick={() => setTheme('system')}>to-system</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('default dark si no hay nada guardado', () => {
    matchMediaMock(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('respeta tema guardado inválido → dark', () => {
    localStorage.setItem('modu_theme', 'raro')
    matchMediaMock(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('setTheme cambia y persiste + data-theme', async () => {
    matchMediaMock(false)
    const { getByText } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await act(async () => {
      getByText('to-light').click()
    })
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(localStorage.getItem('modu_theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('system resuelve según matchMedia', () => {
    localStorage.setItem('modu_theme', 'system')
    matchMediaMock(true)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('resolved').textContent).toBe('light')
  })

  it('useTheme fuera del provider lanza', () => {
    const Bad = () => {
      useTheme()
      return null
    }
    expect(() => render(<Bad />)).toThrow('useTheme must be used within a ThemeProvider')
  })
})
