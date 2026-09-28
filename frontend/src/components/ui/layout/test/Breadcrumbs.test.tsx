import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Breadcrumbs from '@components/ui/layout/Breadcrumbs'

vi.mock('@i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({ t: (s: string) => s }),
}))

describe('Breadcrumbs', () => {
  const items = [
    { label: 'Home', to: '/app' },
    { label: 'Records', to: '/app/records' },
    { label: 'Detalle' },
  ]

  it('renderiza todos los labels; el último es span', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={items} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Detalle').tagName).toBe('SPAN')
  })

  it('click intermedio navega y llama onNavigate', () => {
    const fn = vi.fn()
    render(
      <MemoryRouter initialEntries={['/app/records/detalle']}>
        <Breadcrumbs items={items} onNavigate={fn} />
      </MemoryRouter>,
    )
    screen.getByText('Records').click()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('back navega al penúltimo con to', () => {
    const fn = vi.fn()
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Breadcrumbs items={items} onNavigate={fn} />
      </MemoryRouter>,
    )
    screen.getByTitle('Back').click()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('back sin to en el penúltimo no rompe', () => {
    const fn = vi.fn()
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'A' }, { label: 'B' }]} onNavigate={fn} />
      </MemoryRouter>,
    )
    expect(() => screen.getByTitle('Back').click()).not.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
