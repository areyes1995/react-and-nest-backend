// ──────────────────────────────────────────────
// useReadAloud: la voz y el idioma elegidos se usan
// de verdad al hablar (antes, cambiar de voz con la
// clase sonando seguía con la voz anterior), y los
// idiomas sin voz del sistema suenan con la voz en
// línea en vez de caer al español.
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { readPrefs, resolveAudioLang, useReadAloud } from '@features/speech/useReadAloud'

const ui = { lang: 'es' }
vi.mock('@services/translate', () => ({
  SOURCE_LANGUAGE: 'es',
  CONTENT_LANGUAGES: ['es', 'en', 'pt', 'fr', 'de', 'it'],
  useContentLanguage: () => ui.lang,
  translateTexts: async (texts: string[], lang: string) => texts.map(t => `[${lang}] ${t}`),
}))

const cloud = { voices: [] as { id: string; lang: string; name: string }[] }
vi.mock('@services/speech', () => ({
  fetchCloudVoices: async () => cloud.voices,
  speechUrl: (text: string, voice: string) => `speak:${voice}:${text}`,
}))

const SEGMENTS = ['Primer bloque.', 'Segundo bloque.']

const cloudVoices = [
  { id: 'fr-BE-CharlineNeural', lang: 'fr-BE', name: 'Microsoft Charline Online (Natural) - French (Belgium)' },
  { id: 'fr-FR-DeniseNeural', lang: 'fr-FR', name: 'Microsoft Denise Online (Natural) - French (France)' },
  { id: 'es-MX-DaliaNeural', lang: 'es-MX', name: 'Microsoft Dalia Online (Natural) - Spanish (Mexico)' },
]

/** <audio> falso: guarda lo que se reproduce y termina al instante si `autoEnd`. */
function mockAudio(played: string[], { autoEnd = true }: { autoEnd?: boolean } = {}) {
  const fetchSpy = vi.fn(async () => ({ ok: false }) as Response)
  vi.stubGlobal('fetch', fetchSpy)
  const instances: FakeAudio[] = []
  class FakeAudio {
    src = ''
    ended = false
    paused = true
    playbackRate = 1
    defaultPlaybackRate = 1
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    onplaying: (() => void) | null = null
    constructor() {
      instances.push(this)
    }
    play() {
      this.paused = false
      played.push(this.src)
      this.onplaying?.()
      if (autoEnd) queueMicrotask(() => this.onended?.())
      return Promise.resolve()
    }
    pause() {
      this.paused = true
    }
    removeAttribute(name: string) {
      if (name === 'src') this.src = ''
    }
    load() {}
  }
  vi.stubGlobal('Audio', FakeAudio)
  return { instances, fetchSpy }
}

const systemVoices = [
  { lang: 'es-MX', name: 'Microsoft Dalia Online - Spanish (Mexico)', voiceURI: 'es-mx-dalia' },
  { lang: 'es-ES', name: 'Microsoft Helena - Spanish (Spain)', voiceURI: 'es-es-helena' },
  { lang: 'en-US', name: 'Microsoft Aria Online - English (United States)', voiceURI: 'en-us-aria' },
] as unknown as SpeechSynthesisVoice[]

function mockSynth(spoken: string[], { autoEnd = true }: { autoEnd?: boolean } = {}) {
  const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
    spoken.push(utterance.text)
    if (autoEnd) utterance.onend?.({} as SpeechSynthesisEvent)
  })
  const synth = {
    getVoices: () => systemVoices,
    speak,
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

describe('useReadAloud', () => {
  beforeEach(() => {
    ui.lang = 'es'
    cloud.voices = []
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('usa la primera voz del sistema del idioma de Ajustes', async () => {
    const spoken: string[] = []
    mockSynth(spoken)
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.voiceId).toBe('es-mx-dalia'))
    act(() => result.current.play(0))
    await waitFor(() => expect(spoken.length).toBeGreaterThan(0))
    expect(spoken[0]).toBe('Primer bloque.')
  })

  it('cambiar de voz mientras suena retoma la frase con la voz nueva', async () => {
    const spoken: string[] = []
    // Sin auto-fin: la primera frase queda sonando (status playing).
    const synth = mockSynth(spoken, { autoEnd: false })
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.voiceId).toBe('es-mx-dalia'))
    act(() => result.current.play(0))
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1))

    act(() => result.current.setVoice('es-es-helena'))
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(2))
    const voices = (synth.speak as ReturnType<typeof vi.fn>).mock.calls.map(
      call => (call[0] as SpeechSynthesisUtterance).voice?.voiceURI,
    )
    expect(voices[0]).toBe('es-mx-dalia')
    expect(voices[1]).toBe('es-es-helena')
    expect(result.current.voiceId).toBe('es-es-helena')
  })

  it('el audio va en el idioma de Ajustes: traduce el guion', async () => {
    ui.lang = 'en'
    const spoken: string[] = []
    mockSynth(spoken)
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.lang).toBe('en'))
    act(() => result.current.play(0))
    await waitFor(() => expect(spoken.length).toBeGreaterThan(0))
    expect(spoken[0]).toBe('[en] Primer bloque.')
  })

  it('se puede elegir otro idioma de audio que el de Ajustes', async () => {
    ui.lang = 'en'
    const spoken: string[] = []
    mockSynth(spoken)
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    act(() => result.current.setAudioLang('es'))
    act(() => result.current.play(0))
    await waitFor(() => expect(spoken.length).toBeGreaterThan(0))
    expect(spoken[0]).toBe('Primer bloque.')
  })

  it('un idioma sin voz del sistema suena con la voz en línea, no en español', async () => {
    ui.lang = 'fr'
    cloud.voices = cloudVoices
    const spoken: string[] = []
    const played: string[] = []
    mockSynth(spoken)
    mockAudio(played)
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.lang).toBe('fr'))
    expect(result.current.languages).toContain('fr')
    expect(result.current.voiceId).toBe('cloud:fr-FR-DeniseNeural')
    act(() => result.current.play(0))
    await waitFor(() => expect(played).toHaveLength(2))
    expect(played[0]).toBe('speak:fr-FR-DeniseNeural:[fr] Primer bloque.')
    expect(played[1]).toBe('speak:fr-FR-DeniseNeural:[fr] Segundo bloque.')
    expect(spoken).toHaveLength(0)
    await waitFor(() => expect(result.current.status).toBe('idle'))
  })

  it('la voz del sistema "natural" va antes que la en línea; se puede elegir la en línea', async () => {
    cloud.voices = cloudVoices
    const spoken: string[] = []
    const played: string[] = []
    mockSynth(spoken)
    mockAudio(played)
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.voices.some(v => v.source === 'cloud')).toBe(true))
    expect(result.current.voiceId).toBe('es-mx-dalia')
    act(() => result.current.setVoice('cloud:es-MX-DaliaNeural'))
    act(() => result.current.play(0))
    await waitFor(() => expect(played.length).toBeGreaterThan(0))
    expect(played[0]).toBe('speak:es-MX-DaliaNeural:Primer bloque.')
  })

  it('adelanta la frase siguiente mientras suena la actual', async () => {
    ui.lang = 'fr'
    cloud.voices = cloudVoices
    const played: string[] = []
    mockSynth([])
    const { fetchSpy } = mockAudio(played, { autoEnd: false })
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.lang).toBe('fr'))
    act(() => result.current.play(0))
    await waitFor(() => expect(played).toHaveLength(1))
    expect(fetchSpy).toHaveBeenCalledWith('speak:fr-FR-DeniseNeural:[fr] Segundo bloque.')
  })

  it('pausar y reanudar la voz en línea sigue la misma frase sin volver a pedirla', async () => {
    ui.lang = 'fr'
    cloud.voices = cloudVoices
    const played: string[] = []
    mockSynth([])
    const { instances } = mockAudio(played, { autoEnd: false })
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.lang).toBe('fr'))
    act(() => result.current.play(0))
    await waitFor(() => expect(played).toHaveLength(1))
    act(() => result.current.pause())
    expect(instances[0].paused).toBe(true)
    act(() => result.current.resume())
    expect(result.current.status).toBe('playing')
    expect(played).toEqual([played[0], played[0]])
  })

  it('cambiar la velocidad en línea no reinicia la frase', async () => {
    ui.lang = 'fr'
    cloud.voices = cloudVoices
    const played: string[] = []
    mockSynth([])
    const { instances } = mockAudio(played, { autoEnd: false })
    const { result } = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(result.current.lang).toBe('fr'))
    act(() => result.current.play(0))
    await waitFor(() => expect(played).toHaveLength(1))
    act(() => result.current.setRate(1.5))
    expect(instances[0].playbackRate).toBe(1.5)
    expect(played).toHaveLength(1)
  })

  it('si la clase cambia idioma o voz, las mesas lo siguen sin recargar', async () => {
    ui.lang = 'es'
    mockSynth([])
    const lesson = renderHook(() => useReadAloud(SEGMENTS))
    const table = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(table.result.current.voiceId).toBe('es-mx-dalia'))

    // La clase cambia a inglés: la mesa suena en inglés con su voz.
    ui.lang = 'en'
    act(() => lesson.result.current.setAudioLang('en'))
    await waitFor(() => expect(table.result.current.lang).toBe('en'))
    expect(table.result.current.voiceId).toBe('en-us-aria')

    // Y si la clase elige otra voz, la mesa la sigue.
    ui.lang = 'es'
    act(() => lesson.result.current.setAudioLang('auto'))
    await waitFor(() => expect(table.result.current.lang).toBe('es'))
    act(() => lesson.result.current.setVoice('es-es-helena'))
    await waitFor(() => expect(table.result.current.voiceId).toBe('es-es-helena'))
  })

  it('el último al que se da a reproducir calla al otro del todo', async () => {
    const spoken: string[] = []
    // Sin auto-fin: las frases quedan sonando hasta que se las calla.
    const synth = mockSynth(spoken, { autoEnd: false })
    const first = renderHook(() => useReadAloud(SEGMENTS))
    const second = renderHook(() => useReadAloud(SEGMENTS))
    await waitFor(() => expect(first.result.current.voiceId).toBe('es-mx-dalia'))
    await waitFor(() => expect(second.result.current.voiceId).toBe('es-mx-dalia'))

    act(() => first.result.current.play(0))
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1))
    expect(first.result.current.status).toBe('playing')

    // Al reproducir el segundo, el primero se pausa y no avanza aunque su
    // frase termine: suena solo el último.
    act(() => second.result.current.play(0))
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(2))
    expect(first.result.current.status).toBe('paused')
    expect(first.result.current.current).toBe(0)
    expect(second.result.current.status).toBe('playing')

    const firstUtterance = synth.speak.mock.calls[0][0] as SpeechSynthesisUtterance
    act(() => firstUtterance.onend?.({} as SpeechSynthesisEvent))
    expect(synth.speak).toHaveBeenCalledTimes(2)
    expect(first.result.current.current).toBe(0)

    // Reanudar el primero calla al segundo: el turno cambia de bando.
    act(() => first.result.current.resume())
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(3))
    expect(first.result.current.status).toBe('playing')
    expect(second.result.current.status).toBe('paused')
  })
})

describe('resolveAudioLang', () => {
  it('automático = idioma de Ajustes si hay voces; si no, español', () => {
    expect(resolveAudioLang('auto', 'en', ['es', 'en'])).toBe('en')
    expect(resolveAudioLang('auto', 'de', ['es', 'en'])).toBe('es')
    expect(resolveAudioLang('fr', 'en', ['es', 'fr'])).toBe('fr')
  })
})

describe('readPrefs', () => {
  it('migra las preferencias antiguas (una sola voz en español)', () => {
    localStorage.setItem('read-aloud-prefs', JSON.stringify({ rate: 1.25, voiceURI: 'es-mx-dalia' }))
    const prefs = readPrefs()
    expect(prefs.rate).toBe(1.25)
    expect(prefs.audioLang).toBe('auto')
    expect(prefs.voiceByLang.es).toBe('es-mx-dalia')
  })

  it('migra la voz por idioma de solo-sistema', () => {
    localStorage.setItem('read-aloud-prefs', JSON.stringify({ systemVoiceByLang: { en: 'en-us-aria' } }))
    expect(readPrefs().voiceByLang.en).toBe('en-us-aria')
  })
})
