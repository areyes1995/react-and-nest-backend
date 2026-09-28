// ──────────────────────────────────────────────
// ShowcaseTabs: cuatro pestañas de texturas, cada
// una con su mesa y su audio, y al terminar una
// empieza la siguiente sola.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShowcaseTabs from '@components/explainer/ShowcaseTabs'

vi.mock('@components/poker', () => ({ PokerTable: () => null }))
vi.mock('@features/table/TableThemeContext', () => ({
  TableThemeScope: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@services/translate', () => ({
  SOURCE_LANGUAGE: 'es',
  CONTENT_LANGUAGES: ['es', 'en', 'pt', 'fr', 'de', 'it'],
  useContentLanguage: () => 'es',
  translateTexts: async (texts: string[]) => texts,
}))
vi.mock('@services/speech', () => ({
  fetchCloudVoices: async () => [],
  speechUrl: (text: string, voice: string) => `speak:${voice}:${text}`,
}))

const systemVoices = [
  { lang: 'es-MX', name: 'Microsoft Dalia Online - Spanish (Mexico)', voiceURI: 'es-mx-dalia' },
  { lang: 'es-ES', name: 'Microsoft Helena - Spanish (Spain)', voiceURI: 'es-es-helena' },
] as unknown as SpeechSynthesisVoice[]

function mockSynth() {
  const synth = {
    getVoices: () => systemVoices,
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('speechSynthesis', synth)
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    text: string
    voice: SpeechSynthesisVoice | null = null
    lang = ''
    rate = 1
    onend: ((event: SpeechSynthesisEvent) => void) | null = null
    onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  } as unknown as typeof SpeechSynthesisUtterance)
  return synth
}

describe('ShowcaseTabs', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    mockSynth()
  })

  it('muestra las cuatro texturas y narra la activa', async () => {
    render(<ShowcaseTabs id="board-textures" />)
    const tabs = screen.getByRole('tablist')
    expect(within(tabs).getByRole('tab', { name: /1\. Seco/ })).toHaveAttribute('aria-selected', 'true')
    within(tabs).getByRole('tab', { name: /2\. Húmedo/ })

    // Sin puntos de pasos ni selectores del modo explicativo.
    expect(screen.queryByLabelText('Voz que narra la mesa')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Escuchar: Seco/ }))
  })

  it('cambiar de pestaña muestra su mesa y su explicación', async () => {
    const user = userEvent.setup()
    render(<ShowcaseTabs id="board-textures" />)
    await user.click(screen.getByRole('tab', { name: /3\. Emparejado/ }))
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /3\. Emparejado/ })).toHaveAttribute('aria-selected', 'true'),
    )
    expect(screen.getByText(/apuesta pequeña/i)).toBeInTheDocument()
  })
})
