// ──────────────────────────────────────────────
// La fila de la tabla que explica el audio queda
// marcada con un borde mientras suena.
// ──────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ContentBlocks from '@components/content/ContentBlocks'
import type { ContentBlock } from '@features/academy/types'

const blocks: ContentBlock[] = [
  {
    type: 'table',
    headers: ['Calle', 'Cartas'],
    rows: [
      ['Flop', 'Tres cartas'],
      ['Turn', 'Una carta'],
      ['River', 'Una carta'],
    ],
  },
]

function renderBlocks(activeChunk: number | null) {
  return render(
    <MemoryRouter>
      <ContentBlocks blocks={blocks} activeIndex={0} activeChunk={activeChunk} />
    </MemoryRouter>,
  )
}

describe('ContentBlocks: fila activa de la tabla', () => {
  it('marca con borde la fila del trozo que suena', () => {
    const { container } = renderBlocks(2)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[1].getAttribute('data-table-row-active')).toBe('true')
    expect(rows[0].hasAttribute('data-table-row-active')).toBe(false)
    expect(rows[2].hasAttribute('data-table-row-active')).toBe(false)
    // El texto de la fila sigue visible: solo se marca, no se sustituye.
    expect(within(rows[1] as HTMLElement).getByText('Turn')).toBeInTheDocument()
  })

  it('el prefijo "Tabla." no marca ninguna fila', () => {
    const { container } = renderBlocks(0)
    expect(container.querySelector('[data-table-row-active="true"]')).toBeNull()
  })

  it('sin trozo de audio no hay fila marcada', () => {
    const { container } = renderBlocks(null)
    expect(container.querySelector('[data-table-row-active="true"]')).toBeNull()
    expect(screen.getByText('Flop')).toBeInTheDocument()
  })

  it('las URLs se muestran como enlaces externos', () => {
    render(
      <MemoryRouter>
        <ContentBlocks
          blocks={[{ type: 'paragraph', text: 'Web oficial https://piosolver.com/.' }]}
        />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'https://piosolver.com/' })
    expect(link).toHaveAttribute('href', 'https://piosolver.com/')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('las URLs en celdas de tabla también enlazan', () => {
    const { container } = render(
      <MemoryRouter>
        <ContentBlocks
          blocks={[
            {
              type: 'table',
              headers: ['Solver', 'Enlace'],
              rows: [['PioSolver', 'https://piosolver.com/']],
            },
          ]}
        />
      </MemoryRouter>,
    )
    const link = container.querySelector('tbody a')
    expect(link?.getAttribute('href')).toBe('https://piosolver.com/')
  })
})

describe('ContentBlocks: términos del glosario', () => {
  const glossaryBlocks: ContentBlock[] = [
    { type: 'paragraph', text: 'En el **flop** decides si seguir.' },
    { type: 'paragraph', text: 'Otro flop más tarde.' },
  ]

  it('enlaza la primera aparición y abre su ficha con acceso al glosario', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ContentBlocks blocks={glossaryBlocks} />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('button', { name: 'flop' })
    expect(links).toHaveLength(1)

    await user.click(links[0])
    const card = screen.getByRole('dialog', { name: 'Glosario: Flop' })
    expect(within(card).getByText(/tres primeras cartas comunitarias/)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: /Ver en el glosario/ })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('se puede desactivar', () => {
    render(
      <MemoryRouter>
        <ContentBlocks blocks={glossaryBlocks} glossary={false} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'flop' })).toBeNull()
  })
})

describe('ContentBlocks: la tabla sigue a la mesa con audio', () => {
  it('marca la fila de lo que dice la mesa, solo en los bloques de su paso', () => {
    const { container } = render(
      <MemoryRouter>
        <ContentBlocks
          blocks={[...blocks, ...blocks]}
          sceneCaption={{ text: 'Turn: la cuarta carta.', from: 0, to: 1 }}
        />
      </MemoryRouter>,
    )
    const tables = container.querySelectorAll('table')
    const marked = tables[0].querySelectorAll('.table-scene-row-active')
    expect(marked).toHaveLength(1)
    expect(within(marked[0] as HTMLElement).getByText('Turn')).toBeInTheDocument()
    expect(tables[1].querySelector('.table-scene-row-active')).toBeNull()
  })

  it('el audio de la clase leyendo la tabla tiene prioridad', () => {
    const { container } = render(
      <MemoryRouter>
        <ContentBlocks
          blocks={blocks}
          activeIndex={0}
          activeChunk={2}
          sceneCaption={{ text: 'River: la última.', from: 0, to: 1 }}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('.table-scene-row-active')).toBeNull()
  })
})

describe('ContentBlocks: escuchar desde aquí', () => {
  const audioBlocks: ContentBlock[] = [
    { type: 'heading', text: 'Las calles' },
    { type: 'paragraph', text: 'Hay cuatro rondas.' },
    ...blocks,
    { type: 'list', items: ['Uno', 'Dos'] },
  ]

  function renderAudio(overrides: Partial<{ activeIndex: number | null; playing: boolean; canPlay: (i: number) => boolean }> = {}) {
    const onPlay = vi.fn()
    const onPause = vi.fn()
    render(
      <MemoryRouter>
        <ContentBlocks
          blocks={audioBlocks}
          glossary={false}
          activeIndex={overrides.activeIndex ?? null}
          blockAudio={{
            canPlay: overrides.canPlay ?? (() => true),
            playing: overrides.playing ?? false,
            onPlay,
            onPause,
          }}
        />
      </MemoryRouter>,
    )
    return { onPlay, onPause }
  }

  it('pone un botón al final de cada bloque y arranca el audio desde ese bloque', async () => {
    const user = userEvent.setup()
    const { onPlay } = renderAudio()
    const buttons = screen.getAllByRole('button', { name: 'Escuchar desde aquí' })
    // Título, párrafo, tabla y lista (en la lista, solo tras el último punto).
    expect(buttons).toHaveLength(4)
    await user.click(buttons[2])
    expect(onPlay).toHaveBeenCalledWith(2)
  })

  it('en el bloque que suena, el botón pausa', async () => {
    const user = userEvent.setup()
    const { onPlay, onPause } = renderAudio({ activeIndex: 1, playing: true })
    await user.click(screen.getByRole('button', { name: 'Pausar el audio' }))
    expect(onPause).toHaveBeenCalled()
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('los bloques sin nada que leer no llevan botón', () => {
    renderAudio({ canPlay: i => i !== 0 })
    expect(screen.getAllByRole('button', { name: 'Escuchar desde aquí' })).toHaveLength(3)
  })
})
