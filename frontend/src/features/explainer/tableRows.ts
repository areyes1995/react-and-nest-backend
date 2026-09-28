// ──────────────────────────────────────────────
// Qué parte de una tabla explica la mesa ahora.
//
// Cuando una mesa con audio y una tabla están en el
// mismo paso ("Las posiciones de una mesa de 6" y la
// mesa de las posiciones), mientras la mesa habla de
// algo se marca en la tabla lo que corresponde: la
// frase "Marta es UTG…" marca la fila de UTG.
//
// Cada fila se reconoce por su etiqueta (la primera
// celda y las abreviaturas, "BTN") y cada columna por
// su cabecera. Gana lo que la frase menciona primero:
// es de lo que trata ("Diego, en el cutoff, justo
// antes del botón" habla del cutoff, no del botón).
// Si ninguna fila encaja se prueba con las columnas
// ("En el flop (×4)" en la tabla de outs).
// ──────────────────────────────────────────────

import type { ContentBlock } from '@features/academy/types'
import { normalizeText } from './match'

type TableBlock = Extract<ContentBlock, { type: 'table' }>

export interface TableFocus {
  row: number | null
  column: number | null
}

const NONE: TableFocus = { row: null, column: null }

/**
 * Otras formas de decir lo mismo (ya normalizadas): las escenas dicen
 * "la ciega pequeña" y la tabla puede poner "SB", o al revés.
 */
const SYNONYMS: Record<string, string[]> = {
  btn: ['boton', 'button'],
  boton: ['btn', 'button'],
  sb: ['ciega pequena'],
  'ciega pequena': ['sb'],
  bb: ['ciega grande'],
  'ciega grande': ['bb'],
  co: ['cutoff'],
  cutoff: ['co'],
  hj: ['hijack'],
  hijack: ['hj'],
  mp: ['posicion media', 'hijack'],
  'posicion media': ['mp', 'hijack'],
  utg: ['under the gun', 'primera posicion'],
  'primera posicion': ['utg'],
  preflop: ['antes del flop'],
  postflop: ['despues del flop'],
  check: ['pasar'],
  pasar: ['check'],
  bet: ['apostar'],
  apostar: ['bet'],
  call: ['igualar'],
  igualar: ['call'],
  raise: ['subir'],
  subir: ['raise'],
  fold: ['retirarse', 'se retira'],
  retirarse: ['fold', 'se retira'],
}

/** Palabras de relleno que no identifican nada ("En el flop" → "flop"). */
const FILLER = /^(?:en|el|la|los|las|del|de|al)\s+/

/** "Flop, turn y river" → ["flop", "turn", "river"]; "Pasar (check)" → ["pasar", "check"]. */
function labelKeys(label: string): string[] {
  const parts = normalizeText(label.replace(/\*\*/g, ''))
    .split(/[(),/·:;]|\s+y\s+|\s+o\s+|\s+-\s+/)
    .map(part => {
      let key = part.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
      while (FILLER.test(key)) key = key.replace(FILLER, '')
      return key
    })
    .filter(key => key.length >= 2)
  return [...new Set(parts.flatMap(key => [key, ...(SYNONYMS[key] ?? [])]))]
}

/** Abreviaturas sueltas en la fila (columna "Abreviatura": "BTN", "SB"…). */
const ABBREVIATION = /^[A-Z]{2,4}$/

function rowKeys(row: string[]): string[] {
  const keys = labelKeys(row[0] ?? '')
  for (const cell of row.slice(1)) {
    if (ABBREVIATION.test(cell.trim())) keys.push(...labelKeys(cell))
  }
  return keys
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Primera posición del texto donde aparece alguna de las claves (con plural en "s"). */
function firstMention(normalized: string, keys: string[]): number {
  let best = Infinity
  for (const key of keys) {
    const match = new RegExp(`(?<![\\p{L}\\p{N}])${escape(key)}s?(?![\\p{L}\\p{N}])`, 'u').exec(normalized)
    if (match && match.index < best) best = match.index
  }
  return best
}

/** De una lista de etiquetas, la que el texto menciona primero. */
function earliest(normalized: string, candidates: string[][]): number | null {
  let best: number | null = null
  let bestAt = Infinity
  for (let index = 0; index < candidates.length; index++) {
    const at = firstMention(normalized, candidates[index])
    if (at < bestAt) {
      best = index
      bestAt = at
    }
  }
  return best
}

/** Fila (o, si ninguna encaja, columna) de la tabla de la que habla `text`. */
export function tableFocusForText(block: TableBlock, text: string | null | undefined): TableFocus {
  if (!text) return NONE
  const normalized = normalizeText(text)

  const row = earliest(normalized, block.rows.map(rowKeys))
  if (row !== null) return { row, column: null }

  // La primera columna es la de las etiquetas: marcarla no dice nada.
  const column = earliest(normalized, block.headers.map((header, i) => (i === 0 ? [] : labelKeys(header))))
  return { row: null, column }
}
