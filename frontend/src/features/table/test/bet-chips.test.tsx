// ──────────────────────────────────────────────
// Apuestas sobre el tapete: el importe se reparte
// en fichas de casino y la pila refleja siempre lo
// apostado en la calle (en jsdom no hay animación,
// así que el importe se aplica al instante).
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BetChips, { chipColumns } from '@components/poker/BetChips'

const values = (amount: number) =>
  chipColumns(amount).map(column => `${column.count}x${column.denomination.value}`)

describe('chipColumns', () => {
  it('reparte de la ficha mayor a la menor', () => {
    expect(values(50)).toEqual(['2x25'])
    expect(values(175)).toEqual(['1x100', '3x25'])
    expect(values(1331)).toEqual(['1x1000', '3x100', '1x25', '1x5', '1x1'])
  })

  it('crece en columnas cuando una denominación no cabe en una', () => {
    expect(values(1000 * 12)).toEqual(['8x1000', '4x1000'])
  })

  it('no pasa de 5 columnas ni usa fichas de 5000 en apuestas medianas', () => {
    expect(chipColumns(4999)).toHaveLength(5)
    expect(values(5000)).toEqual(['5x1000'])
    expect(values(25_000)).toEqual(['5x5000'])
  })

  it('no dibuja nada sin apuesta', () => {
    expect(chipColumns(0)).toEqual([])
  })
})

describe('BetChips', () => {
  const point = { left: 50, top: 70 }

  it('muestra la pila con su importe y la actualiza al apostar más', () => {
    const { rerender, container } = render(
      <BetChips amount={50} spot={point} from={point} to={point} />,
    )
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(container.querySelectorAll('.bet-chip')).toHaveLength(2)

    rerender(<BetChips amount={200} spot={point} from={point} to={point} />)
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(container.querySelectorAll('.bet-chip')).toHaveLength(2)
  })

  it('retira la pila cuando la calle se recoge', () => {
    const { rerender, container } = render(
      <BetChips amount={300} spot={point} from={point} to={point} />,
    )
    rerender(<BetChips amount={0} spot={point} from={point} to={point} />)
    expect(screen.queryByText('300')).not.toBeInTheDocument()
    expect(container.querySelector('.bet-chip')).toBeNull()
  })
})
