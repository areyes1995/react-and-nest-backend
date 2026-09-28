// ──────────────────────────────────────────────
// Al cambiar de contenido (p. ej. de una clase a
// otra desde "Contenido del curso"), el cuerpo
// vuelve arriba: la página nueva no aparece a la
// altura donde se quedó la anterior.
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import ScrollToTop from '@components/layout/ScrollToTop'

function BackButton() {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(-1)}>atrás</button>
}

function Harness({ entries, index }: { entries: string[]; index?: number }) {
  return (
    <MemoryRouter initialEntries={entries} initialIndex={index}>
      <ScrollToTop />
      {/* Contenedor persistente como el cuerpo de AcademyPage. */}
      <div data-academy-scroll data-testid="scroll-body" style={{ overflowY: 'auto', height: 100 }}>
        <div style={{ height: 1000 }}>contenido</div>
      </div>
      <Routes>
        <Route path="/a" element={<Link to="/b">ir a b</Link>} />
        <Route
          path="/b"
          element={
            <>
              <Link to="/a">ir a a</Link>
              <BackButton />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ScrollToTop', () => {
  it('al ir a otro contenido el cuerpo vuelve arriba', () => {
    render(<Harness entries={['/a']} />)
    const body = screen.getByTestId('scroll-body')
    body.scrollTop = 200
    fireEvent.click(screen.getByText('ir a b'))
    expect(body.scrollTop).toBe(0)
  })

  it('con atrás del navegador se conserva la posición', () => {
    render(<Harness entries={['/a', '/b']} index={1} />)
    const body = screen.getByTestId('scroll-body')
    body.scrollTop = 200
    fireEvent.click(screen.getByText('atrás'))
    expect(body.scrollTop).toBe(200)
  })
})
