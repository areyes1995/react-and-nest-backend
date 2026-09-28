// ──────────────────────────────────────────────
// Traducción del contenido dinámico.
// La interfaz (menús, botones, textos fijos) se
// traduce con i18next. El CONTENIDO —currículo,
// preguntas, correcciones de la IA— llega del
// backend en español (idioma fuente de la base) y
// aquí se traduce al idioma de Ajustes con el
// servicio `translate/` (ver su README).
//
// Reglas:
//  • Solo se traducen textos: nunca ids, slugs,
//    iconos, cartas, URLs ni notación de rangos.
//  • Cada texto se pide una vez por sesión (caché
//    en memoria; el servicio guarda la suya en disco).
//  • Si el servicio no responde, se queda el español:
//    traducir nunca rompe una página.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@i18n'

/** Idioma en el que está escrito el contenido del backend. */
export const SOURCE_LANGUAGE = 'es'

/** Servicio `translate/` (también sirve la voz: ver `services/speech.ts`). Vacío = desactivado. */
export const TRANSLATE_URL = (import.meta.env.VITE_TRANSLATE_URL ?? 'http://localhost:8010').replace(/\/$/, '')
const MAX_TEXTS_PER_REQUEST = 1000
const REQUEST_TIMEOUT_MS = 30_000

/** Claves cuyo valor es un identificador o un dato, no texto para leer. */
const SKIP_KEYS = new Set([
  'id',
  'slug',
  'code',
  'icon',
  'color',
  'level',
  'kind',
  'type',
  'tone',
  'mode',
  'format',
  'category',
  'source',
  'provider',
  'model',
  'url',
  'videoUrl',
  'thumbnail',
  'cards',
  'hole',
  'board',
  'notation',
  // Glosario: el término es inglés y `spanish` es justo su equivalente en español.
  'term',
  'spanish',
  'related',
  // Nombres de personas.
  'name',
  'initials',
  'lang',
  'status',
  'verdict',
  'error',
  'publishedAt',
  'createdAt',
  'updatedAt',
])

/** `playlistId`, `lessonIds`…: referencias, nunca texto. */
function skipKey(key: string | null): boolean {
  return key !== null && (SKIP_KEYS.has(key) || /[a-z]Ids?$/.test(key))
}

/** Textos que no hay que mandar a traducir aunque estén en una clave de texto. */
export function isTranslatable(text: string): boolean {
  if (!/\p{L}/u.test(text)) return false // números, porcentajes, símbolos
  if (/^https?:\/\//.test(text)) return false
  // Cartas ("As Kh", "Td 9d 2c") y rangos ("77+, AJs+, KQo").
  if (/^([2-9TJQKA][shdc♠♥♦♣]\s*)+$/.test(text.trim())) return false
  if (/^[2-9TJQKA][2-9TJQKAso+\-,\s]*$/.test(text.trim())) return false
  // Abreviaturas de posición y siglas sueltas (UTG, BTN, MDF, SPR…).
  if (/^[A-Z0-9/+\-\s]{1,8}$/.test(text.trim()) && text.trim() !== 'IA') return false
  return true
}

/** Idiomas a los que el servicio `translate/` sabe traducir. */
export const CONTENT_LANGUAGES = ['es', 'en', 'pt', 'fr', 'de', 'it'] as const

/**
 * Idioma del contenido según Ajustes: `es`, `en`, `fr`… Añadir un idioma a
 * i18next basta para que el contenido y el audio lo usen; si el traductor no
 * lo conoce, se usa inglés.
 */
export function contentLanguage(): string {
  const lang = (i18n.resolvedLanguage || i18n.language || SOURCE_LANGUAGE).toLowerCase().split('-')[0]
  return (CONTENT_LANGUAGES as readonly string[]).includes(lang) ? lang : 'en'
}

/** Igual que `contentLanguage`, pero re-renderiza al cambiar el idioma en Ajustes. */
export function useContentLanguage(): string {
  const { i18n: instance } = useTranslation()
  void instance.language
  return contentLanguage()
}

// ─── Textos ───────────────────────────────────

const cache = new Map<string, Map<string, string>>()
/** Traducciones ya producidas, para no volver a traducir un texto que ya está traducido. */
const outputs = new Map<string, Set<string>>()
const inflight = new Map<string, Promise<string | null>>()

// La caché se guarda en el navegador: al recargar, lo ya traducido se pinta
// directamente en el idioma de Ajustes, sin pasar un instante por el español.
// Se guarda con la `version` del glosario del servicio: si cambia, se descarta.
const STORAGE_PREFIX = 'content_translations_v2:'
const MAX_STORED = 20_000
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()
const versions = new Map<string, string>()

function loadStored(target: string): Map<string, string> {
  try {
    localStorage.removeItem(`content_translations_v1:${target}`) // formato anterior
    const raw = localStorage.getItem(STORAGE_PREFIX + target)
    const stored = raw ? (JSON.parse(raw) as { version?: string; entries?: [string, string][] }) : {}
    if (stored.version) versions.set(target, stored.version)
    return new Map(Array.isArray(stored.entries) ? stored.entries : [])
  } catch {
    return new Map()
  }
}

/** El servicio cambió su glosario: lo traducido antes puede estar mal. */
function checkVersion(target: string, version: unknown): void {
  if (typeof version !== 'string' || versions.get(target) === version) return
  const hadVersion = versions.has(target)
  versions.set(target, version)
  if (hadVersion) {
    cacheFor(target).clear()
    outputs.get(target)?.clear()
  }
  scheduleSave(target)
}

function scheduleSave(target: string): void {
  if (saveTimers.has(target)) return
  saveTimers.set(
    target,
    setTimeout(() => {
      saveTimers.delete(target)
      try {
        const entries = [...cacheFor(target)].slice(-MAX_STORED)
        localStorage.setItem(STORAGE_PREFIX + target, JSON.stringify({ version: versions.get(target), entries }))
      } catch {
        // Sin espacio o sin acceso: la caché sigue en memoria.
      }
    }, 1000),
  )
}

function cacheFor(target: string): Map<string, string> {
  let map = cache.get(target)
  if (!map) {
    map = loadStored(target)
    cache.set(target, map)
    outputs.set(target, new Set(map.values()))
  }
  return map
}

function remember(target: string, text: string, translated: string): void {
  cacheFor(target).set(text, translated)
  outputs.get(target)?.add(translated)
  scheduleSave(target)
}

/** Traducción ya conocida (síncrona). `undefined` si aún no se ha pedido. */
export function peekTranslation(text: string, target: string): string | undefined {
  return cacheFor(target).get(text)
}

/** `true` si el texto es una traducción ya hecha: volver a traducirlo no tiene sentido. */
export function isTranslationOutput(text: string, target: string): boolean {
  cacheFor(target)
  return outputs.get(target)?.has(text) ?? false
}

async function requestTranslations(texts: string[], target: string): Promise<(string | null)[]> {
  if (!TRANSLATE_URL) return texts.map(() => null)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${TRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: SOURCE_LANGUAGE, target }),
      signal: controller.signal,
    })
    if (!res.ok) return texts.map(() => null)
    const data = (await res.json()) as { translatedText?: unknown; complete?: boolean; version?: unknown }
    checkVersion(target, data.version)
    const out = data.translatedText
    if (!Array.isArray(out) || out.length !== texts.length) return texts.map(() => null)
    // Con `complete: false` el servicio devolvió originales en lo que falló: no se cachean.
    return out.map((t, i) =>
      typeof t === 'string' && (data.complete !== false || t !== texts[i]) ? t : null,
    )
  } catch {
    return texts.map(() => null)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Traduce textos sueltos. Devuelve el original donde no haya traducción
 * (servicio caído, texto no traducible o mismo idioma).
 */
export async function translateTexts(texts: string[], target = contentLanguage()): Promise<string[]> {
  if (target === SOURCE_LANGUAGE || texts.length === 0) return texts
  const known = cacheFor(target)
  const pending = [...new Set(texts.filter(t => isTranslatable(t) && !known.has(t)))]

  // Los textos que ya pidió otra llamada se esperan en vez de repetirse.
  const waiting: Promise<unknown>[] = []
  const fresh: string[] = []
  for (const text of pending) {
    const running = inflight.get(`${target}\u0000${text}`)
    if (running) waiting.push(running)
    else fresh.push(text)
  }

  for (let i = 0; i < fresh.length; i += MAX_TEXTS_PER_REQUEST) {
    const chunk = fresh.slice(i, i + MAX_TEXTS_PER_REQUEST)
    const request = requestTranslations(chunk, target)
    chunk.forEach((text, j) => {
      const key = `${target}\u0000${text}`
      const one = request.then(results => {
        const translated = results[j]
        if (translated != null) remember(target, text, translated)
        inflight.delete(key)
        return translated
      })
      inflight.set(key, one)
      waiting.push(one)
    })
  }

  await Promise.all(waiting)
  return texts.map(text => known.get(text) ?? text)
}

// ─── Estructuras ──────────────────────────────

function collect(value: unknown, key: string | null, out: string[]): void {
  if (skipKey(key)) return
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    value.forEach(item => collect(item, null, out))
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collect(v, k, out)
  }
}

function rebuild<T>(value: T, key: string | null, lookup: Map<string, string>): T {
  if (skipKey(key)) return value
  if (typeof value === 'string') return (lookup.get(value) ?? value) as T
  if (Array.isArray(value)) return value.map(item => rebuild(item, null, lookup)) as T
  if (value && typeof value === 'object') {
    const copy: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) copy[k] = rebuild(v, k, lookup)
    return copy as T
  }
  return value
}

/**
 * Devuelve una copia de `data` con sus textos traducidos al idioma del
 * contenido. Conserva la forma y todo lo que no es texto (ids, cartas,
 * `answerIndex`, orden de las opciones…).
 */
export async function translateContent<T>(data: T, target = contentLanguage()): Promise<T> {
  if (target === SOURCE_LANGUAGE || data == null) return data
  const texts: string[] = []
  collect(data, null, texts)
  const unique = [...new Set(texts)]
  const translated = await translateTexts(unique, target)
  const lookup = new Map(unique.map((text, i) => [text, translated[i]]))
  return rebuild(data, null, lookup)
}

/**
 * Hook para contenido que ya está en el componente (datos fijos del frontend,
 * respuestas puntuales): pinta el original y lo cambia por la traducción en
 * cuanto llega. Vuelve a traducir al cambiar el idioma en Ajustes.
 */
export function useTranslatedContent<T>(data: T): T {
  const lang = useContentLanguage()
  const [state, setState] = useState<{ source: T; lang: string; value: T }>({ source: data, lang, value: data })

  useEffect(() => {
    let cancelled = false
    if (lang === SOURCE_LANGUAGE) return
    void translateContent(data, lang).then(value => {
      if (!cancelled) setState({ source: data, lang, value })
    })
    return () => {
      cancelled = true
    }
  }, [data, lang])

  if (lang === SOURCE_LANGUAGE) return data
  return state.source === data && state.lang === lang ? state.value : data
}
