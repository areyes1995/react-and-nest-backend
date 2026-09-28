// ──────────────────────────────────────────────
// lessonScript — convierte los bloques de una clase
// en texto para leer en voz alta.
//
// Cada bloque produce un segmento: así el lector
// puede resaltar lo que está leyendo y saltar de
// bloque en bloque. Las cartas se dicen con su
// nombre ("As de picas"), las tablas fila a fila y
// los tests sin revelar la respuesta.
//
// El guion se escribe SIEMPRE en español (idioma
// fuente del contenido) y `speakPoker` pasa la
// notación a palabras ("AJs+" → "As Jota del mismo
// palo o superior"); `speakNumbers`, las cifras
// ("1.200" → "mil doscientos"). Si el audio va en otro idioma,
// `useReadAloud` traduce el guion ya normalizado.
// ──────────────────────────────────────────────

import type { ContentBlock } from '@features/academy/types'
import { rangeViewTitle } from '@features/table/rangeViewer'
import { speakNumbers } from './numbers'

const RANK_NAMES: Record<string, string> = {
  A: 'As',
  K: 'Rey',
  Q: 'Dama',
  J: 'Jota',
  T: 'Diez',
}

const SUIT_NAMES: Record<string, string> = {
  s: 'picas',
  h: 'corazones',
  d: 'diamantes',
  c: 'tréboles',
}

const RANK_PLURAL: Record<string, string> = {
  A: 'ases',
  K: 'reyes',
  Q: 'damas',
  J: 'jotas',
  T: 'dieces',
  '9': 'nueves',
  '8': 'ochos',
  '7': 'sietes',
  '6': 'seises',
  '5': 'cincos',
  '4': 'cuatros',
  '3': 'treses',
  '2': 'doses',
}

const SUIT_SYMBOLS: Record<string, string> = {
  '♠': 'picas',
  '♥': 'corazones',
  '♦': 'diamantes',
  '♣': 'tréboles',
}

const rankWord = (rank: string) => RANK_NAMES[rank] ?? rank

/** `As` → "As de picas". Devuelve la notación tal cual si no es una carta. */
export function speakCard(notation: string): string {
  const rank = notation.slice(0, -1).toUpperCase()
  const suit = SUIT_NAMES[notation.slice(-1).toLowerCase()]
  if (!suit || !/^(10|[2-9TJQKA])$/.test(rank)) return notation
  return `${RANK_NAMES[rank] ?? rank} de ${suit}`
}

/** "As Kh" → "As de picas y Rey de corazones". */
export function speakCards(text: string): string {
  const names = text.split(/\s+/).filter(Boolean).map(speakCard)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

// ─── Notación de poker → palabras ─────────────
// Los sintetizadores leen "AJs+" como "ajs más", "bb/100" como
// "bebé barra cien" y se comen "¾". Esto lo evita.

/** Mano inicial: "AJs+", "77+", "KTo", "AK". */
const HAND = '([2-9TJQKA])([2-9TJQKA])([so])?(\\+)?'
const HAND_RE = new RegExp(`(?<![\\p{L}\\d])${HAND}(?![\\p{L}\\d])`, 'gu')
const HAND_RANGE_RE = new RegExp(`(?<![\\p{L}\\d])${HAND}-${HAND}(?![\\p{L}\\d])`, 'gu')

function speakHand(r1: string, r2: string, suited?: string, plus?: string, isHand = false): string {
  // "22", "99" sin sufijo son números, no parejas (salvo dentro de un rango como "22-JJ").
  if (!isHand && !suited && !plus && /^\d$/.test(r1) && /^\d$/.test(r2)) return `${r1}${r2}`
  const base =
    r1 === r2
      ? RANK_PLURAL[r1] ?? r1
      : `${rankWord(r1)} ${rankWord(r2)}${suited === 's' ? ' del mismo palo' : suited === 'o' ? ' de distinto palo' : ''}`
  return plus ? `${base} o superior` : base
}

/** Pasa a palabras la notación de poker de un texto en español. */
export function speakPoker(text: string): string {
  return (
    text
      // Inglés de póker que no se traduce ("rake" se dice igual en todos los
      // idiomas): se escribe como suena para que cualquier voz lo diga bien
      // ("rake" → "reik"). El traductor deja estas palabras igual en todos
      // los idiomas, y las escenas del modo explicativo llevan el alias
      // fonético en sus keywords. Lo que sí cambia al traducir (hijack,
      // hold'em, outs) no va aquí sino en `esPhonetics`, solo-español.
      .replace(/\brake\b/gi, 'reik')
      .replace(/\bequity\b/gi, 'ekuiti')
      .replace(/\ball-?in\b/gi, 'ol-in')
      .replace(/\bvalue\b/gi, 'valiu')
      .replace(/\bbankroll\b/gi, 'bancrol')
      .replace(/\bsqueeze\b/gi, 'scuiz')
      .replace(/\b(over|top|middle|second|third|pocket)\s?-?pair\b/gi, '$1 per')
      .replace(/\braises\b/gi, 'reises')
      .replace(/\braise\b/gi, 'reis')
      .replace(/\bcalls\b/gi, 'kols')
      .replace(/\bcalling\b/gi, 'kolin')
      .replace(/\bcall\b/gi, 'kol')
      // Parejas sin sufijo en contexto de mano ("77 UTG", "77 en UTG",
      // "(KJo, QTs, 77)", "AQo o 99"): se dicen cifra a cifra ("siete
      // siete"). Los números de verdad ("Juega 22 manos", "22-25 ciegas",
      // "33%", "77+") se dejan en paz.
      .replace(/(?<![\p{L}\d.,])([2-9])\1(?=\s+(?:en\s+)?(?:UTG|MP|CO|BTN|SB|BB|HJ|EP|posici[oó]n|bot[oó]n)\b)/gu, '$1 $1')
      .replace(/(?<=[(,]\s?|\bo\s)([2-9])\1(?![\p{L}\d%+\-–])/gu, '$1 $1')
      // Cartas con símbolo: "K♠ K♥", "7♠7♥".
      .replace(/([♠♥♦♣])\s*(?=(?:10|[2-9TJQKA])[♠♥♦♣])/g, '$1, ')
      .replace(/(10|[2-9TJQKA])([♠♥♦♣])/g, (_m, rank: string, suit: string) => `${rankWord(rank)} de ${SUIT_SYMBOLS[suit]}`)
      // Rangos de manos: "A5s-A2s" → "de As 5 del mismo palo a As 2 del mismo palo".
      .replace(HAND_RANGE_RE, (_m, a1, a2, as, ap, b1, b2, bs, bp) => {
        // "25-33" son números; si un lado es una mano ("22-JJ"), los dos lo son.
        const isHand = /[TJQKAso+]/.test(`${a1}${a2}${as ?? ''}${ap ?? ''}${b1}${b2}${bs ?? ''}${bp ?? ''}`)
        return `de ${speakHand(a1, a2, as, ap, isHand)} a ${speakHand(b1, b2, bs, bp, isHand)}`
      })
      // Boards y manos con guion: "K-7-2", "A-K", "7-6-5".
      .replace(/(?<![\p{L}\d])([2-9TJQKA])((?:-[2-9TJQKA])+)(?![\p{L}\d])/gu, (match, first: string, rest: string) => {
        const ranks = [first, ...rest.split('-').filter(Boolean)]
        // "3-4" (dos números) es un intervalo, no un board.
        if (ranks.length === 2 && ranks.every(r => /\d/.test(r))) return match
        return ranks.map(rankWord).join(' ')
      })
      .replace(/(?<![\p{L}\d])([2-9TJQKA])-x\b/gu, (_m, rank: string) => `${rankWord(rank)} con cualquier carta`)
      .replace(HAND_RE, (_m, r1, r2, suited, plus) => speakHand(r1, r2, suited, plus))
      // Siglas entre paréntesis tras su nombre ("en posición (IP)", "ciega
      // pequeña (SB)"): se deletrean. Si se tradujeran, la voz diría dos veces
      // lo mismo ("en posición, en posición"). Con guiones ("I-P") y no con
      // espacios: el traductor respeta los guiones en todos los idiomas, y los
      // espacios los junta en algunos ("UT G" en francés).
      .replace(/\(\s*(IP|OOP|BTN|SB|BB)\s*\)/g, (_m, abbr: string) => `(${[...abbr].join('-')})`)
      // Unidades y siglas.
      .replace(/\b(?:bb|BB)\s?\/\s?100\b/g, 'ciegas grandes cada cien manos')
      .replace(/(\d)\s?bb\b/g, '$1 ciegas grandes')
      .replace(/\bBTN\b/g, 'botón')
      .replace(/\bSB\b/g, 'ciega pequeña')
      .replace(/\bBB\b/g, 'ciega grande')
      .replace(/\bUTG\b/g, 'U-T-G')
      .replace(/\bOOP\b/g, 'fuera de posición')
      .replace(/\bIP\b/g, 'en posición')
      .replace(/\+EV\b/g, 'EV positivo')
      .replace(/(^|[\s(])-EV\b/g, '$1EV negativo')
      .replace(/\bvs\.?(?=\s)/gi, 'contra')
      // Fracciones y multiplicadores.
      .replace(/½/g, ' medio ')
      .replace(/¼/g, ' un cuarto ')
      .replace(/¾/g, ' tres cuartos ')
      .replace(/⅓/g, ' un tercio ')
      .replace(/⅔/g, ' dos tercios ')
      .replace(/(\d+(?:[.,]\d+)?)\s?[x×](?![\p{L}\d])/gu, '$1 veces')
      .replace(/[x×](\d+(?:[.,]\d+)?)/g, 'por $1')
      // Intervalos y comparaciones: "2,2–2,5", "25-33%", ">55%", "~36%".
      .replace(/(\d+(?:[.,]\d+)?)\s?[–-]\s?(\d+(?:[.,]\d+)?)(?!\s?-?\s?bet)/g, '$1 a $2')
      .replace(/>\s?(?=\d)/g, 'más de ')
      .replace(/<\s?(?=\d)/g, 'menos de ')
      .replace(/~\s?(?=\d)/g, 'aproximadamente ')
      .replace(/#(\d+)/g, 'número $1')
  )
}

/**
 * Fonética solo para el audio en español.
 *
 * Se aplica al hablar (tras traducir, si el audio va en otro idioma no se
 * toca): el guion fuente y la traducción no cambian, así que ni el texto en
 * pantalla ni las mesas que se detectan por palabras clave se ven afectados.
 * La voz española lee "hijack" como "ijack" (la h es muda), "Hold'em" como
 * "oldem" y "outs" deletreado: se escriben como suenan.
 */
export function esPhonetics(text: string): string {
  return text
    .replace(/\bhijack\b/gi, 'jaiyack')
    .replace(/hold\s?['’´`]?\s?em\b/gi, 'jóldem')
    .replace(/\bouts\b/gi, 'auts')
    .replace(/\bout\b/gi, 'aut')
}

/**
 * Limpia el texto para la voz: sin marcas de negrita ni flechas, sin URLs
 * (deletrear "https://…" no aporta nada: el enlace se ve en pantalla), con la
 * notación y los números en palabras ("1.200" → "mil doscientos").
 */
export function cleanForSpeech(text: string): string {
  return speakNumbers(speakPoker(text.replace(/https?:\/\/\S+/g, '')))
    .replace(/\*\*/g, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s*[→⇒]\s*/g, ', ')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Asegura el punto final para que la voz haga la pausa. */
function sentence(text: string): string {
  const clean = cleanForSpeech(text)
  if (!clean) return ''
  return /[.!?:;]$/.test(clean) ? clean : `${clean}.`
}

/** Frase hablada de cada fila de una tabla, sin el prefijo "Tabla.". */
export function tableRowSpeeches(block: Extract<ContentBlock, { type: 'table' }>): string[] {
  return block.rows.map(row =>
    sentence(row.map((cell, i) => (i === 0 ? cell : `${block.headers[i] ?? ''}: ${cell}`)).join(', ')),
  )
}

/** Prefijo hablado antes de las filas de una tabla. */
const TABLE_PREFIX = 'Tabla.'

/**
 * Fila de la tabla que se está explicando según el trozo (`chunk`) del audio
 * en curso dentro del segmento del bloque. El trozo 0 es el prefijo "Tabla."
 * (sin fila); el resto se reparte entre las filas con el mismo troceado que
 * usa el lector. Trozo desconocido o más allá del final: `null` / última fila.
 */
export function tableRowForChunk(
  block: Extract<ContentBlock, { type: 'table' }>,
  chunk: number | null | undefined,
): number | null {
  if (chunk === null || chunk === undefined || chunk < 0 || block.rows.length === 0) return null
  let cursor = chunk - chunkForSpeech(TABLE_PREFIX).length
  if (cursor < 0) return null
  const speeches = tableRowSpeeches(block)
  for (let row = 0; row < speeches.length; row++) {
    const count = chunkForSpeech(speeches[row]).length
    if (count === 0) continue
    if (cursor < count) return row
    cursor -= count
  }
  return speeches.length - 1
}

/** Texto hablado de un bloque. Cadena vacía si no hay nada que leer. */
export function blockToSpeech(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return sentence(block.text)
    case 'paragraph':
      return sentence(block.text)
    case 'list':
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}: ${sentence(item)}` : sentence(item)))
        .join(' ')
    case 'callout':
      return `${sentence(block.title)} ${sentence(block.text)}`
    case 'table':
      return [TABLE_PREFIX, ...tableRowSpeeches(block)].join(' ')
    case 'hands':
      return block.items
        .map(item => `${sentence(item.label)} ${speakCards(item.cards)}.${item.note ? ` ${sentence(item.note)}` : ''}`)
        .join(' ')
    case 'spot':
      return [
        `Tu mano: ${speakCards(block.hole)}.`,
        block.board ? `En la mesa: ${speakCards(block.board)}.` : '',
        sentence(block.question),
        // "ver" y no "abrir": "abrir" es palabra clave de open raise en el modo explicativo.
        'Piénsalo antes de ver la respuesta.',
      ]
        .filter(Boolean)
        .join(' ')
    case 'quiz':
      return [
        'Comprueba lo que has entendido.',
        ...block.questions.map(
          (q, n) =>
            `Pregunta ${n + 1}: ${sentence(q.question)} ${q.options
              .map((option, i) => `Opción ${i + 1}: ${sentence(option)}`)
              .join(' ')}`,
        ),
      ].join(' ')
    case 'drill':
      return `Ejercicio en la mesa: ${sentence(block.goal)}`
    case 'showcase':
      return `Mesa interactiva: ${sentence(showcaseLabel(block.id))} Elige una pestaña y escucha cada ejemplo.`
    case 'range':
      return `Rango para ver: ${sentence(rangeViewTitle(block.id))} Despliega el botón para ver la matriz.`
    default:
      return ''
  }
}

/** Título hablado de cada mesa interactiva (se traduce como el resto). */
function showcaseLabel(id: string): string {
  return SHOWCASE_LABELS[id] ?? 'ejemplos en la mesa'
}

/** Etiquetas en español (idioma fuente) de las mesas interactivas. */
const SHOWCASE_LABELS: Record<string, string> = {
  'board-textures': 'las texturas de board',
}

/**
 * Parte un texto en trozos cortos. Chrome corta las locuciones largas a los
 * ~15 segundos, así que se habla frase a frase (y las frases muy largas por
 * comas).
 */
export function chunkForSpeech(text: string, max = 200): string[] {
  // Solo se corta tras un punto seguido de espacio: "2.5 BB" no es fin de frase.
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  for (const raw of sentences) {
    const s = raw.trim()
    if (!s) continue
    if (s.length <= max) {
      chunks.push(s)
      continue
    }
    let current = ''
    for (const part of s.split(/(?<=[,;:])\s+/)) {
      if (current && (current + ' ' + part).length > max) {
        chunks.push(current)
        current = part
      } else {
        current = current ? `${current} ${part}` : part
      }
    }
    if (current) chunks.push(current)
  }
  return chunks
}
