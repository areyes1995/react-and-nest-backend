// ──────────────────────────────────────────────
// Traductor de página.
// Buena parte de la interfaz se escribió con textos
// en español directamente en los componentes, sin
// pasar por i18next. Cuando el idioma de Ajustes no
// es español, este traductor recorre lo que hay en
// pantalla y traduce texto y atributos visibles
// (placeholder, title, aria-label, alt) con el
// servicio `translate/`, y sigue lo que React pinta
// después con un MutationObserver.
//
//  • Lo ya traducido se aplica en el mismo ciclo, antes
//    de pintar (caché en memoria + localStorage).
//  • Solo cambia el valor de los nodos de texto, no los
//    sustituye: React sigue siendo dueño del DOM.
//  • No toca: campos de texto, código, lo marcado con
//    `translate="no"` o `.notranslate`, ni los textos
//    que ya están en inglés (i18next o capa de datos).
//  • Al volver al español restaura los originales.
//
// Para excluir una zona (un nombre, una notación):
// `<span translate="no">…</span>`.
// ──────────────────────────────────────────────

import i18n from '@i18n'
import {
  SOURCE_LANGUAGE,
  isTranslatable,
  isTranslationOutput,
  peekTranslation,
  translateTexts,
} from '@services/translate'

const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'] as const
const SKIP_SELECTOR =
  '[translate="no"], .notranslate, [contenteditable="true"], script, style, noscript, textarea, code, pre, kbd, samp'
const FLUSH_DELAY_MS = 40

interface Tracked {
  /** Texto que puso la aplicación. */
  original: string
  /** Texto que puso el traductor (null si aún no hay traducción). */
  applied: string | null
}

let target = SOURCE_LANGUAGE
let observer: MutationObserver | null = null
let flushTimer: ReturnType<typeof setTimeout> | null = null

const texts = new WeakMap<Text, Tracked>()
const attributes = new WeakMap<Element, Map<string, Tracked>>()
/** Nodos con traducción aplicada, para restaurarlos al volver al español. */
const touched = new Set<Text | Element>()
/** Esperando traducción. */
const waitingNodes = new Set<Text>()
const waitingAttrs = new Map<Element, Set<string>>()
const pending = new Set<string>()

/** Textos de i18next en inglés: ya están en el idioma correcto. */
let englishUi = new Set<string>()

function collectStrings(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') out.add(value.trim())
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out))
}

function loadEnglishUi(): void {
  const out = new Set<string>()
  collectStrings(i18n.getResourceBundle?.(target, 'translation'), out)
  englishUi = out
}

/** Separa espacios de los extremos: se traduce el núcleo y se conservan. */
function splitWhitespace(value: string): [string, string, string] {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value)
  return match ? [match[1], match[2], match[3]] : ['', value, '']
}

function wanted(core: string): boolean {
  return (
    core.length > 0 &&
    isTranslatable(core) &&
    !englishUi.has(core) &&
    !isTranslationOutput(core, target)
  )
}

function skipped(element: Element | null): boolean {
  return !element || element.closest(SKIP_SELECTOR) !== null
}

/** Traduce `original` si ya se conoce; si no, lo encola y devuelve null. */
function resolve(original: string, queue: boolean): string | null {
  const [lead, core, trail] = splitWhitespace(original)
  if (!wanted(core)) return null
  const translated = peekTranslation(core, target)
  if (translated !== undefined) return lead + translated + trail
  if (queue) {
    pending.add(core)
    scheduleFlush()
  }
  return null
}

// ─── Nodos de texto ───────────────────────────

function processText(node: Text, queue = true): void {
  if (skipped(node.parentElement)) return
  const value = node.nodeValue ?? ''
  let state = texts.get(node)
  if (state && state.applied !== null && value === state.applied) return
  if (!state || value !== state.original) {
    state = { original: value, applied: null }
    texts.set(node, state)
  }
  const translated = resolve(state.original, queue)
  if (translated === null) {
    if (queue && wanted(splitWhitespace(state.original)[1])) waitingNodes.add(node)
    return
  }
  waitingNodes.delete(node)
  if (translated !== value) {
    state.applied = translated
    node.nodeValue = translated
    touched.add(node)
  }
}

// ─── Atributos ────────────────────────────────

function processAttribute(element: Element, name: string, queue = true): void {
  if (skipped(element)) return
  const value = element.getAttribute(name)
  if (value == null) return
  let states = attributes.get(element)
  if (!states) {
    states = new Map()
    attributes.set(element, states)
  }
  let state = states.get(name)
  if (state && state.applied !== null && value === state.applied) return
  if (!state || value !== state.original) {
    state = { original: value, applied: null }
    states.set(name, state)
  }
  const translated = resolve(state.original, queue)
  if (translated === null) {
    if (queue && wanted(splitWhitespace(state.original)[1])) {
      const names = waitingAttrs.get(element) ?? new Set<string>()
      names.add(name)
      waitingAttrs.set(element, names)
    }
    return
  }
  if (translated !== value) {
    state.applied = translated
    element.setAttribute(name, translated)
    touched.add(element)
  }
}

// ─── Recorrido ────────────────────────────────

function scan(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    processText(root as Text)
    return
  }
  if (!(root instanceof Element) || skipped(root)) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) processText(node as Text)

  const selector = ATTRIBUTES.map(name => `[${name}]`).join(',')
  const elements = root.matches(selector) ? [root, ...root.querySelectorAll(selector)] : [...root.querySelectorAll(selector)]
  for (const element of elements) {
    for (const name of ATTRIBUTES) if (element.hasAttribute(name)) processAttribute(element, name)
  }
}

function onMutations(records: MutationRecord[]): void {
  for (const record of records) {
    if (record.type === 'characterData') processText(record.target as Text)
    else if (record.type === 'attributes' && record.attributeName)
      processAttribute(record.target as Element, record.attributeName)
    else record.addedNodes.forEach(scan)
  }
}

// ─── Lotes ────────────────────────────────────

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => void flush(), FLUSH_DELAY_MS)
}

async function flush(): Promise<void> {
  flushTimer = null
  const batch = [...pending]
  pending.clear()
  if (batch.length === 0) return
  const lang = target
  await translateTexts(batch, lang)
  if (lang !== target) return

  // Solo los nodos cuyo texto iba en ESTE lote: otro lote puede seguir en
  // vuelo con el resto. Sin volver a encolar: si el servicio falló, el texto
  // se queda en español.
  const translated = new Set(batch)
  const inBatch = (original: string | undefined) =>
    original !== undefined && translated.has(splitWhitespace(original)[1])

  for (const node of [...waitingNodes]) {
    if (!node.isConnected) waitingNodes.delete(node)
    else if (inBatch(texts.get(node)?.original)) {
      waitingNodes.delete(node)
      processText(node, false)
    }
  }
  for (const [element, names] of [...waitingAttrs]) {
    if (!element.isConnected) {
      waitingAttrs.delete(element)
      continue
    }
    const states = attributes.get(element)
    for (const name of [...names]) {
      if (!inBatch(states?.get(name)?.original)) continue
      names.delete(name)
      processAttribute(element, name, false)
    }
    if (names.size === 0) waitingAttrs.delete(element)
  }
}

// ─── Arranque y parada ────────────────────────

function restore(): void {
  for (const node of touched) {
    if (node instanceof Text) {
      const state = texts.get(node)
      if (state?.applied != null && node.nodeValue === state.applied) node.nodeValue = state.original
      texts.delete(node)
    } else {
      attributes.get(node)?.forEach((state, name) => {
        if (state.applied != null && node.getAttribute(name) === state.applied) node.setAttribute(name, state.original)
      })
      attributes.delete(node)
    }
  }
  touched.clear()
  waitingNodes.clear()
  waitingAttrs.clear()
  pending.clear()
}

function stop(): void {
  observer?.disconnect()
  observer = null
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = null
}

/**
 * Traduce la página al idioma `lang`. Con el idioma fuente (español) la deja
 * como la pinta la aplicación.
 */
export function setPageLanguage(lang: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  if (lang === target && observer) return

  stop()
  restore()
  target = lang
  if (lang === SOURCE_LANGUAGE) return

  loadEnglishUi()
  scan(document.body)
  observer = new MutationObserver(onMutations)
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTES],
  })
}
