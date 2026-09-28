// ──────────────────────────────────────────────
// RangeBlock: el botón "Ver rango" despliega la
// matriz con su leyenda.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RangeBlock from '@components/content/RangeBlock'

describe('RangeBlock', () => {
  it('despliega la matriz al pulsar "Ver rango"', async () => {
    const user = userEvent.setup()
    render(<RangeBlock id="open-btn" />)
    expect(screen.getByRole('button', { name: /Ver rango/ })).toBeInTheDocument()
    expect(screen.queryByText(/de las manos/)).toBeNull()
    await user.click(screen.getByRole('button', { name: /Ver rango/ }))
    expect(screen.getByText(/Open raise desde BTN/)).toBeInTheDocument()
    expect(screen.getByText(/Abrir/)).toBeInTheDocument()
  })

  it('no rompe con un id desconocido', () => {
    const { container } = render(<RangeBlock id="no-existe" />)
    expect(container).toBeEmptyDOMElement()
  })
})
