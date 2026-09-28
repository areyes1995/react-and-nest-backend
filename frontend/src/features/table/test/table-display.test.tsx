// ──────────────────────────────────────────────
// Preferencias de mesa: fichas o BB, compartidas
// por todas las mesas y guardadas en el navegador.
// ──────────────────────────────────────────────

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTable, startHand } from '@poker/engine'
import { PokerTable } from '@components/poker'
import {
  DEFAULT_TABLE_DISPLAY,
  TableDisplayProvider,
  formatAmount,
} from '@features/table/TableDisplayContext'

beforeEach(() => localStorage.clear())

describe('formatAmount', () => {
  it('en fichas, compacta solo si se pide', () => {
    expect(formatAmount(150, DEFAULT_TABLE_DISPLAY, 50)).toBe('150')
    expect(formatAmount(12500, DEFAULT_TABLE_DISPLAY, 50)).toBe('12.5k')
    expect(formatAmount(12500, { ...DEFAULT_TABLE_DISPLAY, compact: false }, 50)).toBe('12.500')
  })

  it('en BB, divide por la ciega grande con un decimal como mucho', () => {
    const bb = { ...DEFAULT_TABLE_DISPLAY, unit: 'bb' as const }
    expect(formatAmount(5000, bb, 50)).toBe('100 BB')
    expect(formatAmount(125, bb, 50)).toBe('2,5 BB')
    expect(formatAmount(-75, bb, 50)).toBe('-1,5 BB')
  })

  it('sin ciega grande conocida, vuelve a fichas', () => {
    expect(formatAmount(5000, { ...DEFAULT_TABLE_DISPLAY, unit: 'bb' })).toBe('5000')
  })
})

function table(seed: number) {
  return startHand(
    createTable(
      { smallBlind: 25, bigBlind: 50, startingStack: 5000, ante: 0 },
      [
        { id: 'hero', name: 'Tú', isHuman: true },
        { id: 'b1', name: 'Marta', botProfile: 'tag' },
      ],
      seed,
    ),
  )
}

describe('configuración de la mesa', () => {
  it('pasar a BB en una mesa cambia todas y se recuerda', async () => {
    const { unmount } = render(
      <TableDisplayProvider>
        <PokerTable state={table(1)} heroId="hero" timeLeft={null} revealAll={false} />
        <PokerTable state={table(2)} heroId="hero" timeLeft={null} revealAll={false} settings={false} />
      </TableDisplayProvider>,
    )
    expect(screen.queryAllByText(/ BB$/)).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Configuración de la mesa' }))
    await userEvent.click(screen.getByRole('button', { name: /Ciegas grandes \(BB\)/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Stacks de las dos mesas (la segunda no tiene engranaje) en BB.
    expect(screen.getAllByText(/^\d+(,\d)? BB$/).length).toBeGreaterThanOrEqual(4)
    unmount()

    render(
      <TableDisplayProvider>
        <PokerTable state={table(3)} heroId="hero" timeLeft={null} revealAll={false} />
      </TableDisplayProvider>,
    )
    expect(screen.getAllByText(/ BB$/).length).toBeGreaterThan(0)
  })

  it('una mesa puede añadir su pestaña propia', async () => {
    render(
      <TableDisplayProvider>
        <PokerTable
          state={table(1)}
          heroId="hero"
          timeLeft={null}
          revealAll={false}
          settings={{ title: 'Partida', content: <p>Ajustes de la partida</p> }}
        />
      </TableDisplayProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Configuración de la mesa' }))
    expect(screen.getByRole('tab', { name: /Partida/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Ajustes de la partida')).toBeInTheDocument()
  })
})
