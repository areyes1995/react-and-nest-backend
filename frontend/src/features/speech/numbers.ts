// ──────────────────────────────────────────────
// Números → palabras para la voz.
//
// Los sintetizadores (y sobre todo la traducción a
// otros idiomas) leen mal las cifras del contenido:
// "1.200" es mil doscientos en español pero 1,2 en
// inglés, y hay voces que lo leen cifra a cifra.
// Por eso el guion dice los números en palabras, en
// español; si el audio va en otro idioma se traducen
// como el resto del texto ("mil doscientos" →
// "one thousand two hundred").
//
// Formatos del contenido: miles con punto (1.200,
// 5.000), decimales con coma (2,5) o con punto
// (2.5), porcentajes (17 %), "k" (10k). No se tocan
// los números pegados a letras (A5s ya lo resuelve
// speakPoker) ni el "3-bet"/"4-bet", que las voces
// ya dicen bien.
// ──────────────────────────────────────────────

const UNITS = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
]
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
]

/** 0..999 en palabras. */
function below1000(n: number): string {
  if (n === 100) return 'cien'
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundreds) parts.push(HUNDREDS[hundreds])
  if (rest || !hundreds) {
    if (rest < 30) parts.push(UNITS[rest])
    else parts.push(TENS[Math.floor(rest / 10)] + (rest % 10 ? ` y ${UNITS[rest % 10]}` : ''))
  }
  return parts.join(' ')
}

/** Delante de "mil" y "millón(es)" el uno se apocopa: "veintiún mil", "un millón". */
function beforeMultiplier(n: number): string {
  return below1000(n).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')
}

/** Entero no negativo en palabras; `null` si es demasiado grande para decirlo bien. */
export function integerToSpanish(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n >= 1e12) return null
  if (n < 1000) return below1000(n)

  const millions = Math.floor(n / 1e6)
  const thousands = Math.floor((n % 1e6) / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (millions) parts.push(millions === 1 ? 'un millón' : `${beforeMultiplier(millions)} millones`)
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${beforeMultiplier(thousands)} mil`)
  if (rest) parts.push(below1000(rest))
  return parts.join(' ')
}

/** Parte decimal: "5" → "cinco", "25" → "veinticinco", "05" → "cero cinco". */
function decimalsToSpanish(digits: string): string {
  if (digits.startsWith('0') || digits.length > 3) return [...digits].map(d => UNITS[Number(d)]).join(' ')
  return below1000(Number(digits))
}

/**
 * "1.200" → "mil doscientos", "2,5" → "dos coma cinco", "17 %" →
 * "diecisiete por ciento", "10k" → "diez mil".
 */
export function speakNumbers(text: string): string {
  return text.replace(
    // Un número suelto: ni pegado a letras (A5s, 3bet) ni seguido de "-bet".
    /(?<![\p{L}\d.,])(\d{1,3}(?:\.\d{3})+|\d+)(?:([.,])(\d+))?(?!\s?-?\s?bet)(\s?%|k\b)?(?![\p{L}\d])/gu,
    (match, whole: string, separator: string | undefined, fraction: string | undefined, suffix: string | undefined) => {
      let integer = whole.replace(/\./g, '')
      let decimals = fraction
      // "2.500" con punto y tres cifras es un millar; "2.5", un decimal.
      if (separator === '.' && fraction?.length === 3 && !whole.includes('.')) {
        integer += fraction
        decimals = undefined
      }
      const words = integerToSpanish(Number(integer))
      if (words === null) return match
      let spoken = decimals ? `${words} coma ${decimalsToSpanish(decimals)}` : words
      if (suffix?.trim() === '%') spoken += ' por ciento'
      else if (suffix === 'k') spoken += ' mil'
      return spoken
    },
  )
}
