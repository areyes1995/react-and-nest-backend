// ──────────────────────────────────────────────
// Feedback de la mesa: los avisos que se derivan del
// log y el arreglo del scroll.
// El historial usaba `scrollIntoView`, que arrastra a
// los contenedores padre: cada acción empujaba la
// página entera hacia abajo. Aquí se fija que no
// vuelva a ocurrir.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  applyAction,
  createTable,
  legalActions,
  startHand,
  type SeatSetup,
  type TableState,
} from '@poker/engine'
import HandLog from '@components/poker/HandLog'
import TableFeed from '@components/poker/TableFeed'
import HandResultOverlay from '@components/poker/HandResultOverlay'
import { pushEvents, type TableEvent } from '@features/table/events'

function dealtTable(seats = 3): TableState {
  const setups: SeatSetup[] = Array.from({ length: seats }, (_, i) => ({
    id: i === 0 ? 'hero' : 'bot-' + i,
    name: i === 0 ? 'Tú' : 'Rival ' + i,
    isHuman: i === 0,
    botProfile: 'tag' as const,
  }))
  return startHand(
    createTable({ smallBlind: 25, bigBlind: 50, startingStack: 1000, ante: 0 }, setups, 7),
  )
}

/** Lleva la mano al final retirando a todos menos a uno. */
function foldAround(state: TableState): TableState {
  let current = state
  let guard = 0
  while (current.street !== 'complete' && guard++ < 40) {
    const legal = legalActions(current)
    if (!legal) break
    current = applyAction(current, legal.canFold ? { type: 'fold' } : { type: 'check' })
  }
  return current
}

describe('pushEvents', () => {
  it('traduce el log a avisos y habla en segunda persona al estudiante', () => {
    const state = dealtTable()
    const events = pushEvents([], state, state.log, 'hero')

    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(event.text).not.toBe('')
    }
    // Las ciegas son lo primero que ocurre y ya deben verse.
    expect(events.some(event => event.kind === 'blind')).toBe(true)
  })

  it('marca como propios los eventos del estudiante', () => {
    const state = dealtTable(2)
    const events = pushEvents([], state, state.log, 'hero')
    expect(events.some(event => event.isHero)).toBe(true)
  })

  it('no deja crecer la lista sin límite', () => {
    const state = dealtTable(9)
    const many = [...state.log, ...state.log, ...state.log]
    expect(pushEvents([], state, many, 'hero').length).toBeLessThanOrEqual(5)
  })
})

describe('HandLog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('no usa scrollIntoView: eso arrastraba el scroll de la página', () => {
    const spy = vi.fn()
    // jsdom no implementa scrollIntoView; se instala un espía para detectarlo.
    Element.prototype.scrollIntoView = spy

    const { rerender } = render(<HandLog state={dealtTable()} />)
    rerender(<HandLog state={foldAround(dealtTable())} />)

    expect(spy).not.toHaveBeenCalled()
  })

  it('muestra la narración de la mano', () => {
    render(<HandLog state={dealtTable()} />)
    expect(screen.getByText('Historial de la mano')).toBeInTheDocument()
  })
})

describe('TableFeed', () => {
  it('muestra los avisos recientes y omite los caducados', () => {
    const now = Date.now()
    const events: TableEvent[] = [
      { id: '1', kind: 'raise', text: 'Rival 1 sube a 300', isHero: false, at: now },
      { id: '2', kind: 'win', text: '¡Ganas 500!', isHero: true, at: now },
      { id: '3', kind: 'fold', text: 'Te retiras', isHero: true, at: now - 10_000 },
    ]

    render(<TableFeed events={events} />)

    expect(screen.getByText('Rival 1 sube a 300')).toBeInTheDocument()
    expect(screen.getByText('¡Ganas 500!')).toBeInTheDocument()
    expect(screen.queryByText('Te retiras')).not.toBeInTheDocument()
  })
})

describe('HandResultOverlay', () => {
  it('no aparece mientras la mano sigue viva', () => {
    const { container } = render(
      <HandResultOverlay state={dealtTable()} heroId="hero" delta={null} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('anuncia el resultado al cerrarse la mano', () => {
    const finished = foldAround(dealtTable())
    render(<HandResultOverlay state={finished} heroId="hero" delta={-50} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
