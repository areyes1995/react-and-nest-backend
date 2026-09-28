// ──────────────────────────────────────────────
// SceneStage: pulsar la mesa pausa la clase y la
// narra con voz (antes, con la clase sonando, la
// mesa arrancaba en silencio sin pausar la clase:
// la clase seguía y la mesa avanzaba muda).
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SceneStage from '@components/explainer/SceneStage'
import { SCENES } from '@features/explainer/scenes'
import { useScenePlayer } from '@features/explainer/useScenePlayer'
import type { ScenePlayer } from '@features/explainer/useScenePlayer'

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

function fakePlayer(overrides: Partial<ScenePlayer> = {}): ScenePlayer {
  return {
    frames: { heroId: 'hero' },
    state: {},
    beat: 0,
    total: 4,
    caption: 'Subes a 150.',
    reveal: false,
    finished: false,
    playing: false,
    mode: null,
    buffering: false,
    voiceSupported: true,
    voiceError: null,
    play: vi.fn(),
    pause: vi.fn(),
    replay: vi.fn(),
    goTo: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  } as unknown as ScenePlayer
}

describe('SceneStage', () => {
  it('al pulsar explicar pausa la clase y narra la mesa con voz', async () => {
    const user = userEvent.setup()
    const player = fakePlayer()
    const onNarrate = vi.fn()
    render(<SceneStage scene={SCENES[0]} player={player} onNarrate={onNarrate} />)

    await user.click(screen.getByRole('button', { name: /explicar con voz/i }))

    expect(onNarrate).toHaveBeenCalledTimes(1)
    expect(player.play).toHaveBeenCalledWith('voice')
  })

  it('sin voz disponible reproduce en silencio sin tocar la clase', async () => {
    const user = userEvent.setup()
    const player = fakePlayer({ voiceSupported: false })
    const onNarrate = vi.fn()
    render(<SceneStage scene={SCENES[0]} player={player} onNarrate={onNarrate} />)

    await user.click(screen.getByRole('button', { name: /reproducir/i }))

    expect(onNarrate).not.toHaveBeenCalled()
    expect(player.play).toHaveBeenCalledWith('silent')
  })
})

describe('turno de palabra entre mesas reales', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    mockSynth()
    localStorage.clear()
  })

  it('la mesa callada vuelve a reproducir y la que suena muestra pausar', async () => {
    const user = userEvent.setup()

    function TwoTables() {
      const [narrated, setNarrated] = useState('')
      const playerA = useScenePlayer(SCENES[0])
      const playerB = useScenePlayer(SCENES[1])
      return (
        <div>
          <div data-testid="mesa-a">
            <SceneStage scene={SCENES[0]} player={playerA} onNarrate={() => setNarrated(n => `${n}A`)} />
          </div>
          <div data-testid="mesa-b">
            <SceneStage scene={SCENES[1]} player={playerB} onNarrate={() => setNarrated(n => `${n}B`)} />
          </div>
          <span data-testid="narradas">{narrated}</span>
        </div>
      )
    }

    const { getByTestId } = render(<TwoTables />)
    const playA = () =>
      within(getByTestId('mesa-a')).getByRole('button', { name: /explicar con voz|reproducir/i })
    const playB = () =>
      within(getByTestId('mesa-b')).getByRole('button', { name: /explicar con voz|reproducir/i })

    // Suena la primera mesa: su botón pasa a pausar.
    await user.click(playA())
    await waitFor(() =>
      expect(within(getByTestId('mesa-a')).getByRole('button', { name: /pausar/i })).toBeDefined(),
    )

    // Al reproducir la segunda, la primera vuelve a reproducir y solo la
    // segunda muestra pausar: suena una sola.
    await user.click(playB())
    await waitFor(() =>
      expect(within(getByTestId('mesa-b')).getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    await waitFor(() =>
      expect(within(getByTestId('mesa-a')).getByRole('button', { name: /explicar con voz/i })).toBeDefined(),
    )
    expect(getByTestId('narradas').textContent).toBe('AB')
  })
})
