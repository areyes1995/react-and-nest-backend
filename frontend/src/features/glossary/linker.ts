// ──────────────────────────────────────────────
// Enlazador del glosario — encuentra en el texto de
// una clase los términos que el glosario explica,
// para que el alumno pueda consultarlos sin salir.
// Solo se enlaza la primera aparición de cada término
// en un mismo contenido: subrayar cada "flop" de una
// clase convertiría el texto en una lista de enlaces.
// ──────────────────────────────────────────────

import { GLOSSARY, type GlossaryTerm } from './data'

/**
 * Términos que no se enlazan nunca: coinciden con palabras
 * corrientes del español ("ante" = delante de).
 */
const NEVER_LINK = new Set(['Ante'])

/**
 * Traducciones que sí identifican al término sin ambigüedad.
 * Las demás ("pasar", "subir", "mesa"…) son palabras de uso
 * diario y enlazarlas marcaría texto que no habla del término.
 */
const LINKED_SPANISH = new Set([
  'Farol',
  'Semifarol',
  'Bloqueadores',
  'Burbuja',
  'Botón',
  'Proyecto',
  'Sobreapuesta',
  'Apuesta de valor',
  'Apuesta de continuación',
  'Valor fino',
  'Odds implícitas',
])

interface Alias {
  text: string
  term: GlossaryTerm
  /** Las siglas (GTO, TAG…) solo cuentan en mayúsculas: "tag" no es TAG. */
  caseSensitive: boolean
}

function buildAliases(): Alias[] {
  const aliases: Alias[] = []
  for (const term of GLOSSARY) {
    if (NEVER_LINK.has(term.term)) continue
    aliases.push({ text: term.term, term, caseSensitive: term.term === term.term.toUpperCase() })
    if (term.spanish && LINKED_SPANISH.has(term.spanish)) {
      aliases.push({ text: term.spanish, term, caseSensitive: false })
    }
  }
  // El más largo primero: "Check-raise" gana a "Check", "Fold equity" a "Fold".
  return aliases.sort((a, b) => b.text.length - a.text.length)
}

const ALIASES = buildAliases()

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Un solo patrón con todos los alias. Los límites son de letra Unicode
 * (no `\b`, que no entiende de tildes) y admite el plural en "s".
 * Nunca en "es": "calles" no es el plural de "call".
 */
const PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}])(${ALIASES.map(alias => escape(alias.text)).join('|')})s?(?![\\p{L}\\p{N}])`,
  'giu',
)

function resolve(match: string): GlossaryTerm | undefined {
  const lowered = match.toLowerCase()
  return ALIASES.find(alias =>
    alias.caseSensitive ? alias.text === match : alias.text.toLowerCase() === lowered,
  )?.term
}

export type GlossarySegment = string | { text: string; term: GlossaryTerm }

/**
 * Parte un texto en trozos planos y términos del glosario.
 * `seen` guarda los términos ya enlazados y se comparte entre
 * todos los textos de un mismo contenido.
 */
export function linkGlossaryTerms(text: string, seen: Set<string>): GlossarySegment[] {
  const segments: GlossarySegment[] = []
  let last = 0

  for (const match of text.matchAll(PATTERN)) {
    const term = resolve(match[1])
    if (!term || seen.has(term.term)) continue
    seen.add(term.term)

    const start = match.index ?? 0
    if (start > last) segments.push(text.slice(last, start))
    segments.push({ text: match[0], term })
    last = start + match[0].length
  }

  if (last < text.length) segments.push(text.slice(last))
  return segments
}
