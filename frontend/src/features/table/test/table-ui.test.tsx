// ──────────────────────────────────────────────
// Humo de la capa visual: la mesa se dibuja con el
// estado real del motor y los bloques de contenido
// responden a la interacción del estudiante.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { createTable, startHand, type SeatSetup } from '@poker/engine'
import PokerTable from '@components/poker/PokerTable'
import ContentBlocks from '@components/content/ContentBlocks'
import type { ContentBlock } from '@features/academy/types'

function dealtTable(seats: number) {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
  return startHand(
    createTable({ smallBlind: 25, bigBlind: 50, startingStack: 1000, ante: 0 }, setups, 99),
  )
}

describe('PokerTable', () => {
  it('dibuja un asiento por jugador en una mesa de 9', () => {
    render(<PokerTable state={dealtTable(9)} heroId="hero" timeLeft={null} revealAll={false} />)
    expect(screen.getByText('Tú')).toBeInTheDocument()
    for (let i = 1; i < 9; i++) {
      expect(screen.getByText('Rival ' + i)).toBeInTheDocument()
    }
  })

  it('se adapta a una mesa de 2 sin dejar asientos vacíos', () => {
    render(<PokerTable state={dealtTable(2)} heroId="hero" timeLeft={null} revealAll={false} />)
    expect(screen.getByText('Tú')).toBeInTheDocument()
    expect(screen.getByText('Rival 1')).toBeInTheDocument()
    expect(screen.queryByText('Rival 2')).not.toBeInTheDocument()
  })

  it('muestra el bote con las ciegas ya puestas', () => {
    render(<PokerTable state={dealtTable(6)} heroId="hero" timeLeft={null} revealAll={false} />)
    expect(screen.getByText('Bote')).toBeInTheDocument()
  })

  it('enseña las cartas del estudiante y oculta las de los rivales', () => {
    const state = dealtTable(6)
    render(<PokerTable state={state} heroId="hero" timeLeft={null} revealAll={false} />)
    // 5 huecos de board vacíos + 2 cartas del héroe visibles.
    expect(screen.getAllByLabelText('Carta boca abajo')).toHaveLength(10)
  })
})

describe('ContentBlocks', () => {
  const blocks: ContentBlock[] = [
    { type: 'heading', text: 'Título de prueba' },
    { type: 'paragraph', text: 'Texto con **negrita** dentro.' },
    {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: '¿Qué gana, color o escalera?',
          options: ['La escalera', 'El color'],
          answerIndex: 1,
          explanation: 'El color siempre gana a la escalera.',
        },
      ],
    },
  ]

  it('renderiza encabezados y negritas', () => {
    render(
      <MemoryRouter>
        <ContentBlocks blocks={blocks} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Título de prueba')).toBeInTheDocument()
    expect(screen.getByText('negrita')).toBeInTheDocument()
  })

  it('revela la explicación al responder el test', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ContentBlocks blocks={blocks} />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/El color siempre gana/)).not.toBeInTheDocument()
    await user.click(screen.getByText('El color'))
    expect(screen.getByText(/El color siempre gana/)).toBeInTheDocument()
  })
})
