// ──────────────────────────────────────────────
// CurriculumProvider: qué pide al backend y qué hace
// cuando no responde, y en qué idioma lo reparte.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { CurriculumProvider, useCurriculumState } from '@features/academy/CurriculumContext'
import { FIXTURE_LEVELS } from './fixtures'

const auth = { isAuthenticated: false, isLoading: false, user: null as { id: number } | null }
vi.mock('@context/AuthContext', () => ({ useAuth: () => auth }))

const fetchCurriculum = vi.fn()
const fetchCatalog = vi.fn()
vi.mock('@services/curriculum', () => ({
  fetchCurriculum: () => fetchCurriculum(),
  fetchCatalog: () => fetchCatalog(),
}))

// El traductor real llama a un servicio: aquí "traduce" poniendo el idioma delante.
const translation = { lang: 'es' }
vi.mock('@services/translate', () => ({
  SOURCE_LANGUAGE: 'es',
  useContentLanguage: () => translation.lang,
  translateContent: async (data: unknown, lang: string) =>
    JSON.parse(JSON.stringify(data).replace(/"title":"/g, `"title":"[${lang}] `)),
}))

const payload = {
  levels: FIXTURE_LEVELS,
  stats: { levels: 2, courses: 3, lessons: 6, minutes: 60, drills: 0, quizzes: 0, spots: 0 },
  persisted: true,
  admin: false,
}

function Probe() {
  const { status, curriculum, stats } = useCurriculumState()
  return (
    <>
      <p>
        {status} · {curriculum.path.length} clases · {stats.minutes} min
      </p>
      <p>{curriculum.path[0]?.lesson.title}</p>
    </>
  )
}

describe('CurriculumProvider', () => {
  beforeEach(() => {
    fetchCurriculum.mockReset()
    fetchCatalog.mockReset()
    auth.isAuthenticated = false
    translation.lang = 'es'
  })

  it('sin sesión pide el catálogo público', async () => {
    fetchCatalog.mockResolvedValue(payload)
    render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText('ready · 6 clases · 60 min')).toBeInTheDocument())
    expect(fetchCurriculum).not.toHaveBeenCalled()
  })

  it('con sesión pide el currículo completo', async () => {
    auth.isAuthenticated = true
    fetchCurriculum.mockResolvedValue(payload)
    render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText('ready · 6 clases · 60 min')).toBeInTheDocument())
    expect(fetchCatalog).not.toHaveBeenCalled()
  })

  it('sin respuesta del backend queda en error y sin clases', async () => {
    auth.isAuthenticated = true
    fetchCurriculum.mockResolvedValue(null)
    render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText('error · 0 clases · 0 min')).toBeInTheDocument())
  })

  it('descarta una respuesta con otra forma en vez de romper', async () => {
    fetchCatalog.mockResolvedValue({ items: [] })
    render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText('error · 0 clases · 0 min')).toBeInTheDocument())
  })

  it('reparte el contenido traducido al idioma de Ajustes', async () => {
    translation.lang = 'en'
    fetchCatalog.mockResolvedValue(payload)
    render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText(/^\[en\] Clase/)).toBeInTheDocument())
  })

  it('al cambiar de idioma re-traduce sin volver a pedir al backend', async () => {
    fetchCatalog.mockResolvedValue(payload)
    const { rerender } = render(<CurriculumProvider><Probe /></CurriculumProvider>)
    await waitFor(() => expect(screen.getByText(/^Clase/)).toBeInTheDocument())

    translation.lang = 'en'
    await act(async () => rerender(<CurriculumProvider><Probe /></CurriculumProvider>))
    await waitFor(() => expect(screen.getByText(/^\[en\] Clase/)).toBeInTheDocument())
    expect(fetchCatalog).toHaveBeenCalledTimes(1)
  })
})
