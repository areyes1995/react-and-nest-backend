import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StatusBadge from '@components/ui/cards/StatusBadge'
import StatsGrid from '@components/ui/cards/StatsGrid'
import Toast from '@components/ui/feedback/Toast'
import EmptyState from '@components/ui/feedback/EmptyState'
import { FormField } from '@components/ui/form/FormField'
import { FormButton } from '@components/ui/form/FormButton'
import { FormAlert } from '@components/ui/form/FormAlert'
import Modal from '@components/ui/modal/Modal'
import ConfirmDeleteModal from '@components/ui/modal/ConfirmDeleteModal'
import Toggle from '@components/ui/controls/Toggle'
import FilterSelect from '@components/ui/controls/FilterSelect'
import DropdownFilter from '@components/ui/controls/DropdownFilter'
import StarRating from '@components/ui/data-display/StarRating'
import Expandable from '@components/ui/data-display/Expandable'
import ShowMore from '@components/ui/data-display/ShowMore'
import PageLayout from '@components/ui/layout/PageLayout'

describe('StatusBadge', () => {
  it('renderiza el label con el tono indicado', () => {
    render(<StatusBadge label="Activo" tone="emerald" />)
    const el = screen.getByText('Activo')
    expect(el.className).toContain('text-emerald-300')
  })
  it('default gray', () => {
    render(<StatusBadge label="X" />)
    expect(screen.getByText('X').className).toContain('text-gray-300')
  })
})

describe('StatsGrid', () => {
  it('renderiza todas las cards con valores', () => {
    render(
      <StatsGrid
        items={[
          { label: 'A', value: 5 },
          { label: 'B', value: 'x', accentClass: 'text-red-300' },
        ]}
      />,
    )
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('x').className).toContain('text-red-300')
  })
})

describe('Toast', () => {
  it('null → null', () => {
    const { container } = render(<Toast toast={null} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('success → role=status', () => {
    render(<Toast toast={{ type: 'success', message: 'ok' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('ok')
  })
  it('error → role=alert', () => {
    render(<Toast toast={{ type: 'error', message: 'fail' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('fail')
  })
})

describe('EmptyState', () => {
  it('solo mensaje sin botón', () => {
    render(<EmptyState message="Vacío" />)
    expect(screen.getByText('Vacío')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('con acción llama onAction', () => {
    const fn = vi.fn()
    render(<EmptyState message="V" actionLabel="Reintentar" onAction={fn} />)
    screen.getByRole('button', { name: /reintentar/i }).click()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('FormField', () => {
  it('label for + children + error condicional', () => {
    const { rerender } = render(
      <FormField label="Nombre" htmlFor="name">
        <input id="name" />
      </FormField>,
    )
    expect(screen.getByText('Nombre').getAttribute('for')).toBe('name')
    expect(screen.queryByText(/error/)).toBeNull()
    rerender(
      <FormField label="Nombre" htmlFor="name" error="requerido">
        <input id="name" />
      </FormField>,
    )
    expect(screen.getByText('requerido')).toBeInTheDocument()
  })
})

describe('FormButton', () => {
  it('loading deshabilita y muestra loadingText', () => {
    render(
      <FormButton loading loadingText="Guardando…">
        Guardar
      </FormButton>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent('Guardando…')
  })
  it('default loadingText + icon', () => {
    render(<FormButton loading icon={<span>ic</span>}>X</FormButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Loading…')
  })
  it('normal muestra children', () => {
    render(<FormButton>Enviar</FormButton>)
    expect(screen.getByRole('button')).not.toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent('Enviar')
  })
})

describe('FormAlert', () => {
  it('3 variantes con estilos distintos', () => {
    const { rerender } = render(<FormAlert variant="error">e</FormAlert>)
    expect(screen.getByText('e').parentElement!.className).toContain('bg-red-500/10')
    rerender(<FormAlert variant="info">i</FormAlert>)
    expect(screen.getByText('i').parentElement!.className).toContain('bg-blue-500/10')
    rerender(<FormAlert variant="success">s</FormAlert>)
    expect(screen.getByText('s').parentElement!.className).toContain('bg-emerald-500/10')
  })
  it('icono custom override', () => {
    render(<FormAlert icon={<span data-testid="custom-icon" />}>x</FormAlert>)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('cerrado → null', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>hola</p>
      </Modal>,
    )
    expect(container).toBeEmptyDOMElement()
  })
  it('abierto muestra children y clases custom; backdrop cierra', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} maxWidth="max-w-xl" maxHeight="max-h-[50vh]">
        <p>contenido</p>
      </Modal>,
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
    // el backdrop es el primer div absoluto
    const backdrop = document.querySelector('.absolute.inset-0') as HTMLElement
    backdrop.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ConfirmDeleteModal', () => {
  it('cerrado → null; abierto con itemName', () => {
    const { container, rerender } = render(
      <ConfirmDeleteModal isOpen={false} title="T" onCancel={() => {}} onConfirm={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
    rerender(
      <ConfirmDeleteModal
        isOpen
        title="Eliminar proyecto"
        itemName="Robot"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Eliminar proyecto')).toBeInTheDocument()
    expect(screen.getByText('“Robot”')).toBeInTheDocument()
  })
  it('confirming bloquea y muestra Eliminando…', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmDeleteModal
        isOpen
        title="T"
        confirming
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText('Eliminando…')).toBeInTheDocument()
    expect(screen.getByText('Cancelar').closest('button')).toBeDisabled()
    onCancel.mockClear()
    ;(document.querySelector('.absolute.inset-0') as HTMLElement).click()
    expect(onCancel).not.toHaveBeenCalled()
  })
  it('confirm llama onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDeleteModal isOpen title="T" onCancel={() => {}} onConfirm={onConfirm} />,
    )
    screen.getByText('Eliminar').click()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe('Toggle', () => {
  it('role=switch, aria-checked y click invierte', () => {
    const fn = vi.fn()
    const { rerender } = render(<Toggle checked={false} onChange={fn} />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'false')
    sw.click()
    expect(fn).toHaveBeenCalledWith(true)
    rerender(<Toggle checked onChange={fn} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})

describe('FilterSelect', () => {
  it('value/options y change', () => {
    const fn = vi.fn()
    render(
      <FilterSelect
        value="a"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
        onChange={fn}
        ariaLabel="filtro"
        minWidth="120px"
      />,
    )
    const sel = screen.getByLabelText('filtro') as HTMLSelectElement
    expect(sel.value).toBe('a')
    expect(sel.style.minWidth).toBe('120px')
    fireEvent.change(sel, { target: { value: 'b' } })
    expect(fn).toHaveBeenCalledWith('b')
  })
})

describe('DropdownFilter', () => {
  it('muestra label seleccionado y onChange por key', () => {
    const fn = vi.fn()
    render(
      <DropdownFilter
        value="p"
        items={[
          { key: 'p', label: 'Pendiente' },
          { key: 'a', label: 'Activo' },
        ]}
        onChange={fn}
      />,
    )
    // el trigger y el item activo comparten texto: hay 2 "Pendiente"
    expect(screen.getAllByText('Pendiente')).toHaveLength(2)
    screen.getByText('Activo').click()
    expect(fn).toHaveBeenCalledWith('a')
  })
})

describe('StarRating', () => {
  it('3.5 → 3 fill + 1 half + 1 muted', () => {
    const { container } = render(<StarRating value={3.5} />)
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
    const filled = [...stars].filter(s => s.classList.contains('fill-amber-400'))
    expect(filled).toHaveLength(3)
    const half = [...stars].filter(s => s.classList.contains('opacity-50'))
    expect(half).toHaveLength(1)
  })
  it('0 → ninguna fill ni half', () => {
    const { container } = render(<StarRating value={0} />)
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
    expect(container.querySelectorAll('.fill-amber-400')).toHaveLength(0)
    expect(container.querySelectorAll('.opacity-50')).toHaveLength(0)
  })
})

describe('Expandable', () => {
  it('open alterna las clases de grid', () => {
    const { container, rerender } = render(
      <Expandable open={false}>
        <p>h</p>
      </Expandable>,
    )
    expect(container.firstChild).toHaveClass('grid-rows-[0fr]')
    rerender(
      <Expandable open>
        <p>h</p>
      </Expandable>,
    )
    expect(container.firstChild).toHaveClass('grid-rows-[1fr]')
  })
})

describe('ShowMore', () => {
  const items = [1, 2, 3, 4, 5]
  // string plano: evita que el texto quede partido en varios nodos
  const renderItem = (n: number) => `item-${n}`

  it('muestra el primer lote + contador', () => {
    render(<ShowMore items={items} batchSize={2} renderItem={renderItem} />)
    expect(screen.getByText('item-1')).toBeInTheDocument()
    expect(screen.getByText('item-2')).toBeInTheDocument()
    expect(screen.queryByText('item-3')).toBeNull()
    expect(screen.getByText('Showing 2 of 5')).toBeInTheDocument()
  })
  it('Show more avanza un lote y Show all revela todo', () => {
    render(<ShowMore items={items} batchSize={2} renderItem={renderItem} />)
    fireEvent.click(screen.getByText('Show more'))
    expect(screen.getByText('item-4')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Show all'))
    expect(screen.getByText('item-5')).toBeInTheDocument()
    expect(screen.queryByText('Show more')).toBeNull()
  })
  it('vacío → empty; labels custom', () => {
    render(
      <ShowMore
        items={[]}
        renderItem={renderItem}
        empty={<p>sin datos</p>}
        labels={{ showMore: 'Ver más', showing: '{{visible}}/{{total}}' }}
      />,
    )
    expect(screen.getByText('sin datos')).toBeInTheDocument()
  })
  it('revealAllOnShowMore revela todo de una vez', () => {
    render(
      <ShowMore items={items} batchSize={2} renderItem={renderItem} revealAllOnShowMore />,
    )
    fireEvent.click(screen.getByText('Show more'))
    expect(screen.getByText('item-5')).toBeInTheDocument()
  })
})

describe('PageLayout', () => {
  it('título/subtítulo condicionales + controls + children', () => {
    const { rerender } = render(
      <PageLayout title="T" subtitle="S" controls={<button>ctl</button>}>
        <p>body</p>
      </PageLayout>,
    )
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('ctl')).toBeInTheDocument()
    rerender(
      <PageLayout>
        <p>solo body</p>
      </PageLayout>,
    )
    expect(screen.getByText('solo body')).toBeInTheDocument()
  })
})
