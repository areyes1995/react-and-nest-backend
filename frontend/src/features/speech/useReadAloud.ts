// ──────────────────────────────────────────────
// useReadAloud — "Escuchar la clase".
//
// Dos fuentes de voz, en el mismo selector:
//  • Voz del sistema (Web Speech API): la del
//    navegador. Instantánea, pero cada equipo trae
//    unos idiomas u otros (Firefox, Chrome en Linux…).
//  • Voz en línea (Edge, vía el servicio
//    `translate/`): voces neuronales en todos los
//    idiomas del contenido, sin instalar nada. Se
//    pide frase a frase y la siguiente se adelanta
//    mientras suena la actual.
// Por defecto gana la del sistema si es "natural";
// si no, la en línea; y si no hay, la del sistema.
//
// Idioma del audio: por defecto el de Ajustes
// ("auto"); el estudiante puede elegir otro. El guion
// llega en español (idioma fuente, ya normalizado por
// `lessonScript`) y se traduce aquí al idioma del
// audio. Cada idioma recuerda la voz elegida.
//
// La voz y el idioma se leen en el momento de
// reproducir (no de una ref que se actualiza en el
// render): cambiar de voz mientras suena retoma la
// frase con la voz nueva, y si está en pausa, la
// nueva voz se usa al reanudar.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chunkForSpeech, esPhonetics } from './lessonScript'
import { CONTENT_LANGUAGES, SOURCE_LANGUAGE, translateTexts, useContentLanguage } from '@services/translate'
import { fetchCloudVoices, speechUrl, type CloudVoice } from '@services/speech'
import i18n from '@i18n'

export type ReadAloudStatus = 'idle' | 'playing' | 'paused'

/** Idiomas a los que se puede traducir el guion (los del servicio `translate/`). */
export const AUDIO_LANGUAGES = CONTENT_LANGUAGES

const PREFS_KEY = 'read-aloud-prefs'

/** Prefijo de los ids de voz en línea: `cloud:fr-FR-DeniseNeural`. */
const CLOUD_PREFIX = 'cloud:'

// ── Preferencias compartidas en vivo ──
// Cada lector (`useReadAloud`) vive en su propio componente: la clase, cada
// mesa con audio… Si uno cambia idioma, voz o velocidad, los demás deben
// enterarse sin recargar: aquí se avisan entre ellos en la misma pestaña
// (el evento `storage` del navegador solo llega a otras pestañas).
// El aviso lleva las preferencias nuevas: releer el almacenamiento en ese
// momento devolvería lo viejo, porque el estado aún no se ha aplicado.
type PrefsListener = (prefs: ReadAloudPrefs) => void
const prefListeners = new Set<PrefsListener>()

function notifyPrefListeners(prefs: ReadAloudPrefs) {
  for (const listener of prefListeners) listener(prefs)
}

/** Variantes latinoamericanas, en orden de preferencia. */
const LATAM_LANGS = ['es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-ve', 'es-uy', 'es-ec', 'es-gt', 'es-cr', 'es-pa', 'es-do', 'es-pr', 'es-bo', 'es-py', 'es-sv', 'es-hn', 'es-ni', 'es-cu']

/** Variante principal de cada idioma (el español ya se ordena con `LATAM_LANGS`). */
const MAIN_REGION: Record<string, string> = { en: 'en-us', fr: 'fr-fr', pt: 'pt-br', de: 'de-de', it: 'it-it' }

function normLang(lang: string): string {
  return lang.replace('_', '-').toLowerCase()
}

/** `es-MX` → `es`. */
export function baseLang(lang: string): string {
  return normLang(lang).split('-')[0]
}

/** ¿Es una voz de español latinoamericano? */
export function isLatamVoice(voice: Pick<SpeechSynthesisVoice, 'lang'>): boolean {
  return LATAM_LANGS.includes(normLang(voice.lang))
}

type RankableVoice = Pick<SpeechSynthesisVoice, 'lang' | 'name'> & { source?: VoiceSource }

/**
 * Puntuación de una voz para un idioma. En español: latinoamericana > otro
 * español > España; en los demás, la variante principal (fr-FR…). En todos: las "Natural"/"Online" del sistema (neuronales
 * de Edge) > las en línea > las de Google > las locales antiguas.
 */
export function scoreVoice(voice: RankableVoice, lang = 'es'): number {
  const code = normLang(voice.lang)
  if (baseLang(code) !== lang) return -1
  let score = 50
  if (lang === 'es') {
    const latamIndex = LATAM_LANGS.indexOf(code)
    score = latamIndex >= 0 ? 100 - latamIndex : code === 'es-es' ? 10 : 50
  } else if (MAIN_REGION[lang] === code) {
    score += 10
  }
  if (voice.source === 'cloud') score += 25
  else if (/natural|online|neural/i.test(voice.name)) score += 30
  else if (/google/i.test(voice.name)) score += 20
  return score
}

/** Voces de un idioma, de mejor a peor. */
export function rankVoices<T extends RankableVoice>(voices: T[], lang: string): T[] {
  return voices.filter(v => scoreVoice(v, lang) >= 0).sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang))
}

/** Voces en español ordenadas de mejor a peor. */
export function rankSpanishVoices<T extends RankableVoice>(voices: T[]): T[] {
  return rankVoices(voices, 'es')
}

// ─── Voces ────────────────────────────────────

export type VoiceSource = 'system' | 'cloud'

/** Una voz de cualquiera de las dos fuentes. */
export interface AnyVoice {
  id: string
  lang: string
  name: string
  source: VoiceSource
  /** Solo en las del sistema: la que se pasa a `SpeechSynthesisUtterance`. */
  system?: SpeechSynthesisVoice
}

export function mergeVoices(system: SpeechSynthesisVoice[], cloud: CloudVoice[]): AnyVoice[] {
  return [
    ...system.map(v => ({ id: v.voiceURI, lang: v.lang, name: v.name, source: 'system' as const, system: v })),
    ...cloud.map(v => ({ id: CLOUD_PREFIX + v.id, lang: v.lang, name: v.name, source: 'cloud' as const })),
  ]
}

// ─── Preferencias ─────────────────────────────

export interface ReadAloudPrefs {
  rate: number
  /** `auto` = el idioma de Ajustes. */
  audioLang: string
  /** Voz elegida por idioma (`es`, `en`…): id del sistema o `cloud:…`. */
  voiceByLang: Record<string, string>
}

export function readPrefs(): ReadAloudPrefs {
  const fallback: ReadAloudPrefs = {
    rate: 1,
    audioLang: 'auto',
    voiceByLang: {},
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ReadAloudPrefs> & {
      voiceURI?: string
      systemVoiceByLang?: Record<string, string>
    }
    // Formatos anteriores: `systemVoiceByLang`, y antes una sola voz en español.
    const voiceByLang = { ...(parsed.systemVoiceByLang ?? {}), ...(parsed.voiceByLang ?? {}) }
    if (parsed.voiceURI) voiceByLang.es ??= parsed.voiceURI
    return {
      rate: typeof parsed.rate === 'number' ? parsed.rate : 1,
      audioLang: typeof parsed.audioLang === 'string' ? parsed.audioLang : 'auto',
      voiceByLang,
    }
  } catch {
    return fallback
  }
}

function writePrefs(prefs: ReadAloudPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* preferencia solo en memoria */
  }
}

/**
 * Idioma efectivo del audio: el pedido (o el de Ajustes con `auto`) si tiene
 * voces; si no, español (idioma del contenido) o el primero que haya.
 */
export function resolveAudioLang(wanted: string, uiLang: string, available: string[]): string {
  const target = wanted === 'auto' ? uiLang : wanted
  if (available.includes(target)) return target
  if (available.includes(SOURCE_LANGUAGE)) return SOURCE_LANGUAGE
  return available[0] ?? target
}

function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

export interface VoiceOption {
  id: string
  label: string
  /** "México · natural". */
  detail?: string
  source: VoiceSource
}

/** Textos de la interfaz del lector (i18next: salen ya en el idioma de Ajustes). */
const t = (key: string) => i18n.t(`readAloud.${key}`)

function regionLabel(lang: string, uiLang: string): string {
  const region = lang.split(/[-_]/)[1]
  if (!region) return ''
  try {
    return new Intl.DisplayNames([uiLang], { type: 'region' }).of(region.toUpperCase()) ?? region
  } catch {
    return region
  }
}

export function languageLabel(code: string, uiLang: string): string {
  try {
    const name = new Intl.DisplayNames([uiLang], { type: 'language' }).of(code) ?? code
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return code
  }
}

// ─── Turno de palabra ───
// Varios lectores conviven en la misma página (la clase y cada mesa con
// audio): cuando uno empieza a hablar, los demás se pausan para no sonar
// dos voces a la vez. Gana el último al que se le da a reproducir; el
// resto conserva su posición y puede reanudarse.
interface FloorClaim {
  pauseIfPlaying: () => void
}
const floorHolders = new Set<FloorClaim>()

/** El que va a hablar calla a los demás: solo suena una voz. */
function claimFloor(self: FloorClaim) {
  for (const other of floorHolders) {
    if (other !== self) other.pauseIfPlaying()
  }
}

/** "Microsoft Dalia Online (Natural) - Spanish (Mexico)" → "Dalia". */
export function systemVoiceName(name: string): string {
  const short = name
    .replace(/^(Microsoft|Google)\s+/i, '')
    .replace(/\s*\(Natural\)/i, '')
    .replace(/\s+Online/i, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/(\S)Multilingual$/, '$1 (multilingüe)')
    .trim()
  return short || name
}

function voiceOption(voice: AnyVoice, uiLang: string): VoiceOption {
  const natural = voice.source === 'system' && /natural|online|neural/i.test(voice.name) ? t('natural') : ''
  const detail = [regionLabel(voice.lang, uiLang), natural].filter(Boolean).join(' · ')
  return { id: voice.id, label: systemVoiceName(voice.name), detail, source: voice.source }
}

// ─── Hook ─────────────────────────────────────

export interface UseReadAloudOptions {
  /** Cambia al cambiar de contenido: detiene la lectura en curso. */
  resetKey?: string | number
  /** Se llama al terminar el último segmento. */
  onEnd?: () => void
}

/**
 * @param segments Guion por bloque, en español (idioma fuente). Se traduce al
 *   idioma del audio antes de hablar.
 */
export function useReadAloud(segments: string[], { resetKey, onEnd }: UseReadAloudOptions = {}) {
  const synth = getSynth()
  const uiLang = useContentLanguage()

  const [status, setStatus] = useState<ReadAloudStatus>('idle')
  /** Se está traduciendo el guion o cargando el audio en línea: la lectura espera. */
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState<number | null>(null)
  /** Trozo (frase) dentro del segmento que está sonando: sigue a la fila de la tabla. */
  const [chunk, setChunk] = useState<number | null>(null)
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([])
  const [cloudVoices, setCloudVoices] = useState<CloudVoice[]>([])
  const [prefs, setPrefs] = useState<ReadAloudPrefs>(readPrefs)
  /** Espejo para calcular cambios fuera del render (ver `updatePrefs`). */
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  // Las voces del sistema llegan de forma asíncrona en Chrome.
  useEffect(() => {
    if (!synth) return
    const load = () => setSystemVoices(synth.getVoices())
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [synth])

  useEffect(() => {
    let alive = true
    void fetchCloudVoices().then(voices => {
      if (alive) setCloudVoices(voices)
    })
    return () => {
      alive = false
    }
  }, [])

  const allVoices = useMemo(() => mergeVoices(systemVoices, cloudVoices), [systemVoices, cloudVoices])

  /** Idiomas con alguna voz (y a los que se sabe traducir). */
  const languages = useMemo(() => {
    const codes = allVoices.map(v => baseLang(v.lang))
    const known = AUDIO_LANGUAGES as readonly string[]
    return known.filter(code => codes.includes(code))
  }, [allVoices])

  const lang = resolveAudioLang(prefs.audioLang, uiLang, languages)

  const voicesForLang = useMemo(() => rankVoices(allVoices, lang), [allVoices, lang])

  const voiceOptions: VoiceOption[] = voicesForLang.map(v => voiceOption(v, uiLang))
  const voiceId = (voicesForLang.find(v => v.id === prefs.voiceByLang[lang]) ?? voicesForLang[0])?.id ?? null

  // ── Estado leído en el momento de hablar ──
  // Todo lo que decide qué y cómo suena se guarda en una ref que se escribe
  // al elegir (no solo en el render), para que la acción siguiente ya lo use.
  const live = useRef({ lang, voiceId, rate: prefs.rate })
  live.current = { lang, voiceId, rate: prefs.rate }
  const allVoicesRef = useRef(allVoices)
  allVoicesRef.current = allVoices
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  /** Cada lectura lleva un número: los eventos de una lectura cancelada se ignoran. */
  const runRef = useRef(0)
  const position = useRef({ segment: 0, chunk: 0 })
  /** Voz e idioma en curso: si cambian en pausa, reanudar vuelve a generarlo. */
  const loadedRef = useRef<{ voiceId: string | null; lang: string; source: VoiceSource } | null>(null)
  /** En pausa: la frase en línea que acabe de cargar no debe empezar a sonar. */
  const pausedRef = useRef(false)

  // ── Guion en el idioma del audio ──
  const spokenCache = useRef(new Map<string, Promise<string[]>>())
  const spoken = useCallback((targetLang: string): Promise<string[]> => {
    const list = segmentsRef.current
    if (targetLang === SOURCE_LANGUAGE) return Promise.resolve(list)
    const key = `${targetLang}\u0000${list.join('\u0001')}`
    let promise = spokenCache.current.get(key)
    if (!promise) {
      promise = translateTexts(list, targetLang)
      spokenCache.current.set(key, promise)
    }
    return promise
  }, [])

  // ── Audio en línea ──
  // Un solo <audio> para toda la clase (el navegador lo desbloquea con el
  // primer clic). Las frases adelantadas se guardan como blob en memoria
  // mientras dura la clase: nada se escribe en disco.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prefetched = useRef(new Map<string, Promise<string | null>>())

  const clearPrefetched = useCallback(() => {
    for (const promise of prefetched.current.values()) {
      void promise.then(url => url && URL.revokeObjectURL(url))
    }
    prefetched.current.clear()
  }, [])

  const prefetch = useCallback((text: string, voice: string) => {
    const key = `${voice}\u0000${text}`
    if (prefetched.current.has(key)) return
    prefetched.current.set(
      key,
      fetch(speechUrl(text, voice))
        .then(res => (res.ok ? res.blob() : null))
        .then(blob => (blob ? URL.createObjectURL(blob) : null))
        .catch(() => null),
    )
  }, [])

  /** Adelantada si ya se pidió (se espera); si no, directa en streaming. */
  const cloudSource = useCallback(async (text: string, voice: string): Promise<string> => {
    const url = await prefetched.current.get(`${voice}\u0000${text}`)
    return url ?? speechUrl(text, voice)
  }, [])

  const haltAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.onended = audio.onerror = audio.onplaying = null
    audio.pause()
    // Corta la descarga en curso.
    audio.removeAttribute('src')
    audio.load()
  }, [])

  const idleState = useCallback(() => {
    setStatus('idle')
    setBuffering(false)
    setCurrent(null)
    setChunk(null)
    position.current = { segment: 0, chunk: 0 }
    loadedRef.current = null
  }, [])

  const fail = useCallback((run: number, message: string) => {
    if (run !== runRef.current) return
    runRef.current++
    setBuffering(false)
    setStatus('paused')
    setError(message)
  }, [])

  const speakFrom = useCallback(
    async (segment: number, chunk = 0) => {
      const run = ++runRef.current
      pausedRef.current = false
      // Gana el último: lo que estuviera sonando (otra mesa o la clase) se pausa.
      claimFloor(floorEntryRef.current!)
      let { lang: activeLang, voiceId: activeVoice } = live.current
      synth?.cancel()
      haltAudio()
      setError(null)
      setStatus('playing')
      setBuffering(true)

      let texts: string[]
      try {
        texts = await spoken(activeLang)
      } catch {
        texts = segmentsRef.current
      }
      if (run !== runRef.current) return

      // Sin traductor el guion sigue en español: mejor una voz española que una
      // inglesa leyendo español.
      const source = segmentsRef.current
      if (activeLang !== SOURCE_LANGUAGE && source.some(t => t.trim()) && texts.every((t, i) => t === source[i])) {
        const spanish = rankVoices(allVoicesRef.current, SOURCE_LANGUAGE)[0]?.id
        if (spanish) {
          activeLang = SOURCE_LANGUAGE
          activeVoice = spanish
          setError(t('error.untranslated'))
        }
      }

      // Solo en español: la fonética se ajusta al hablar ("hijack" →
      // "jaiyack", "outs" → "auts"). No va en el guion porque rompería la
      // traducción a otros idiomas y la detección de conceptos. No añade ni
      // quita frases, así que el resaltado por trozos no se descoloca.
      if (activeLang === SOURCE_LANGUAGE) texts = texts.map(esPhonetics)

      let seg = segment
      while (seg < texts.length && !texts[seg]?.trim()) seg++
      if (seg >= texts.length) {
        idleState()
        onEndRef.current?.()
        return
      }
      // Un bloque distinto del pedido empieza por su primer trozo.
      if (seg !== segment) chunk = 0
      position.current = { segment: seg, chunk }
      setCurrent(seg)
      setChunk(chunk)

      const chosen = allVoicesRef.current.find(v => v.id === activeVoice) ?? null
      const engine: VoiceSource = chosen?.source ?? 'system'
      loadedRef.current = { voiceId: activeVoice, lang: activeLang, source: engine }

      /** Siguiente frase no vacía desde (s, ch), o null al acabar el guion. */
      const locate = (s: number, ch: number): { s: number; ch: number; chunks: string[] } | null => {
        while (s < texts.length) {
          const chunks = texts[s]?.trim() ? chunkForSpeech(texts[s]) : []
          if (ch < chunks.length) return { s, ch, chunks }
          s++
          ch = 0
        }
        return null
      }

      const finish = () => {
        idleState()
        onEndRef.current?.()
      }

      // ── Voz en línea: <audio> frase a frase, adelantando la siguiente ──
      if (engine === 'cloud' && chosen) {
        const voice = chosen.id.slice(CLOUD_PREFIX.length)
        const audio = (audioRef.current ??= new Audio())
        const stepCloud = async (s: number, ch: number) => {
          if (run !== runRef.current) return
          const at = locate(s, ch)
          if (!at) return finish()
          position.current = { segment: at.s, chunk: at.ch }
          setCurrent(at.s)
          setChunk(at.ch)
          const src = await cloudSource(at.chunks[at.ch], voice)
          if (run !== runRef.current) return
          audio.onplaying = () => run === runRef.current && setBuffering(false)
          audio.onended = () => void stepCloud(at.s, at.ch + 1)
          audio.onerror = () => fail(run, t('error.cloud'))
          audio.src = src
          audio.defaultPlaybackRate = audio.playbackRate = live.current.rate
          // En pausa se deja cargada: `resume` la hace sonar.
          if (!pausedRef.current) {
            audio.play().catch((err: DOMException) => {
              // AbortError: se pausó o cambió de frase antes de empezar.
              if (err?.name === 'AbortError') return
              fail(run, err?.name === 'NotAllowedError' ? t('error.blocked') : t('error.cloud'))
            })
          }
          const next = locate(at.s, at.ch + 1)
          if (next) prefetch(next.chunks[next.ch], voice)
        }
        void stepCloud(seg, chunk)
        return
      }

      // ── Voz del sistema: frase a frase (Chrome corta a los ~15 s) ──
      if (!synth) {
        fail(run, t('error.unsupported'))
        return
      }
      setBuffering(false)
      const step = (s: number, ch: number) => {
        if (run !== runRef.current) return
        const at = locate(s, ch)
        if (!at) return finish()
        position.current = { segment: at.s, chunk: at.ch }
        setCurrent(at.s)
        setChunk(at.ch)
        const utterance = new SpeechSynthesisUtterance(at.chunks[at.ch])
        if (chosen?.system) utterance.voice = chosen.system
        utterance.lang = chosen?.lang ?? activeLang
        utterance.rate = live.current.rate
        utterance.onend = () => step(at.s, at.ch + 1)
        utterance.onerror = event => {
          // 'interrupted'/'canceled' son nuestras propias cancelaciones.
          if (event.error === 'interrupted' || event.error === 'canceled') return
          synth.cancel()
          fail(run, event.error === 'not-allowed' ? t('error.blocked') : t('error.system'))
        }
        synth.speak(utterance)
      }
      step(seg, chunk)
    },
    [synth, spoken, idleState, fail, haltAudio, cloudSource, prefetch],
  )

  const stop = useCallback(() => {
    runRef.current++
    synth?.cancel()
    haltAudio()
    setError(null)
    idleState()
  }, [synth, haltAudio, idleState])

  const play = useCallback((from = 0) => void speakFrom(from), [speakFrom])

  const pause = useCallback(() => {
    setBuffering(false)
    setStatus('paused')
    pausedRef.current = true
    // En línea se pausa el audio sin cortar la lectura: reanudar sigue donde iba.
    if (loadedRef.current?.source === 'cloud') {
      audioRef.current?.pause()
      return
    }
    runRef.current++
    synth?.cancel()
  }, [synth])

  const resume = useCallback(() => {
    const loaded = loadedRef.current
    const sameLang = loaded?.lang === live.current.lang
    const audio = audioRef.current
    if (loaded?.source === 'cloud' && sameLang && loaded.voiceId === live.current.voiceId && audio?.src && !audio.ended) {
      const run = runRef.current
      pausedRef.current = false
      setStatus('playing')
      claimFloor(floorEntryRef.current!)
      audio.play().catch((err: DOMException) => {
        if (err?.name !== 'AbortError') fail(run, err?.name === 'NotAllowedError' ? t('error.blocked') : t('error.cloud'))
      })
      return
    }
    // Voz o idioma nuevos: se retoma la frase actual (o el bloque si cambió el idioma).
    void speakFrom(position.current.segment, sameLang ? position.current.chunk : 0)
  }, [speakFrom, fail])

  const next = useCallback(() => void speakFrom(position.current.segment + 1), [speakFrom])
  const previous = useCallback(
    () => void speakFrom(Math.max(0, position.current.segment - (position.current.chunk > 0 ? 0 : 1))),
    [speakFrom],
  )

  const statusRef = useRef(status)
  statusRef.current = status

  // Turno de palabra: este lector pausa a los demás solo si está sonando.
  const pauseRef = useRef(pause)
  pauseRef.current = pause
  const floorEntryRef = useRef<FloorClaim | null>(null)
  if (!floorEntryRef.current) {
    floorEntryRef.current = {
      pauseIfPlaying: () => {
        if (statusRef.current === 'playing') pauseRef.current()
      },
    }
  }
  useEffect(() => {
    const entry = floorEntryRef.current
    if (!entry) return
    floorHolders.add(entry)
    return () => {
      floorHolders.delete(entry)
    }
  }, [])

  /** Guarda preferencias, avisa a los demás lectores y, si cambia lo que suena, retoma la frase con ello. */
  const updatePrefs = useCallback(
    (patch: Partial<ReadAloudPrefs>) => {
      const nextPrefs = { ...prefsRef.current, ...patch }
      writePrefs(nextPrefs)
      prefsRef.current = nextPrefs
      setPrefs(nextPrefs)
      notifyPrefListeners(nextPrefs)
    },
    [],
  )

  // Otro lector (la clase u otra mesa) cambió idioma, voz o velocidad:
  // suena igual que él desde el próximo render. El aviso propio rebota
  // con el mismo objeto y React lo ignora.
  useEffect(() => {
    const sync = (next: ReadAloudPrefs) => {
      prefsRef.current = next
      setPrefs(next)
    }
    prefListeners.add(sync)
    return () => {
      prefListeners.delete(sync)
    }
  }, [])

  // Cuando cambia la voz o el idioma efectivos mientras suena, se retoma la
  // frase actual con lo nuevo. (En pausa, `resume` lo detecta.)
  const playingKey = `${lang}|${voiceId}`
  const previousKey = useRef(playingKey)
  useEffect(() => {
    if (previousKey.current === playingKey) return
    const sameLang = previousKey.current.split('|')[0] === lang
    previousKey.current = playingKey
    // Voz nueva: la frase actual con la voz nueva. Idioma nuevo: el bloque entero.
    if (statusRef.current === 'playing') void speakFrom(position.current.segment, sameLang ? position.current.chunk : 0)
  }, [playingKey, lang, speakFrom])

  // Al cambiar de contenido se calla y se suelta lo cacheado.
  useEffect(() => {
    stop()
    spokenCache.current.clear()
    clearPrefetched()
  }, [resetKey, stop, clearPrefetched])
  useEffect(
    () => () => {
      runRef.current++
      getSynth()?.cancel()
      haltAudio()
      clearPrefetched()
    },
    [haltAudio, clearPrefetched],
  )

  return {
    supported: Boolean(synth) || cloudVoices.length > 0,
    error,
    status,
    /** Se está preparando el audio: mostrar un aviso de espera. */
    buffering,
    /** Índice del segmento que está sonando (o en pausa). */
    current,
    /** Trozo del segmento que está sonando: marca la fila de la tabla. */
    chunk,
    rate: prefs.rate,
    play,
    pause,
    resume,
    stop,
    next,
    previous,
    setRate: (rate: number) => {
      updatePrefs({ rate })
      live.current.rate = rate
      // El audio en línea cambia de velocidad al vuelo; la voz del sistema no
      // puede a mitad de frase: se retoma.
      if (loadedRef.current?.source === 'cloud') {
        const audio = audioRef.current
        if (audio) audio.defaultPlaybackRate = audio.playbackRate = rate
      } else if (statusRef.current === 'playing') {
        void speakFrom(position.current.segment, position.current.chunk)
      }
    },
    /** Idiomas con alguna voz (del sistema o en línea). */
    languages,
    /** Preferencia (`auto` = el de Ajustes). */
    audioLang: prefs.audioLang,
    /** Idioma que suena de verdad. */
    lang,
    /** Idioma de Ajustes (para el texto de "Automático"). */
    uiLang,
    setAudioLang: (code: string) => updatePrefs({ audioLang: code }),
    voices: voiceOptions,
    voiceId,
    setVoice: (id: string) => updatePrefs({ voiceByLang: { ...prefs.voiceByLang, [lang]: id } }),
    /** No hay ninguna voz (ni del sistema ni en línea) para el idioma del audio. */
    missingVoice: allVoices.length > 0 && voicesForLang.length === 0,
  }
}

export type ReadAloud = ReturnType<typeof useReadAloud>
