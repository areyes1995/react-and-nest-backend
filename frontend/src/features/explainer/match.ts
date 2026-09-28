// ──────────────────────────────────────────────
// Qué escena corresponde a un trozo de clase.
//
// Las clases viven en la base de datos y no traen
// marcas para el modo explicativo: la escena se elige
// leyendo el texto (en español, el idioma fuente).
// Cada coincidencia de palabra clave suma el peso de
// su escena, así un párrafo que menciona "flop" y
// "c-bet" enseña la c-bet, no las calles. Una mención
// negada ("casi nunca faroleen") casi no cuenta: el
// texto habla justo de lo contrario.
// ──────────────────────────────────────────────

import { SCENES } from './scenes'
import type { ExplainerScene } from './types'

/** Minúsculas y sin tildes: "Posición" y "posicion" son la misma palabra. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const PATTERNS = new Map(
  SCENES.map(scene => [scene.id, scene.keywords.map(keyword => new RegExp(keyword, 'g'))]),
)

/** Tope de coincidencias por palabra: repetir "flop" diez veces no lo hace más relevante. */
const MAX_HITS = 3

/**
 * "nunca", "jamás" o "sin" hasta dos palabras antes. "no" se deja fuera a
 * propósito: "no hagas c-bet en boards dinámicos" sí trata de la c-bet.
 */
const NEGATED = /\b(?:nunca|jamas|sin)\s+(?:\S+\s+){0,2}$/
/** Lo que vale una mención negada frente a una normal. */
const NEGATED_WEIGHT = 0.3

/** Coincidencias de un patrón, con las negadas rebajadas. */
function countHits(normalized: string, pattern: RegExp): number {
  let hits = 0
  let seen = 0
  for (const match of normalized.matchAll(pattern)) {
    if (seen++ >= MAX_HITS) break
    const before = normalized.slice(Math.max(0, match.index - 30), match.index)
    hits += NEGATED.test(before) ? NEGATED_WEIGHT : 1
  }
  return hits
}

export interface SceneMatch {
  scene: ExplainerScene
  score: number
}

/** Escenas que trata un texto, de la más a la menos relevante. */
export function matchScenes(text: string, scenes: ExplainerScene[] = SCENES): SceneMatch[] {
  const normalized = normalizeText(text)
  return scenes
    .map(scene => {
      const patterns = PATTERNS.get(scene.id) ?? scene.keywords.map(keyword => new RegExp(keyword, 'g'))
      const hits = patterns.reduce((sum, pattern) => sum + countHits(normalized, pattern), 0)
      return { scene, score: hits * scene.weight }
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
}

/** La escena más relevante de un texto, si hay alguna. */
export function bestScene(text: string): ExplainerScene | undefined {
  return matchScenes(text)[0]?.scene
}

/**
 * Puntuación mínima para poner una mesa dentro de la clase: una mención suelta
 * de un concepto general ("el flop") no basta; un concepto concreto (c-bet,
 * farol…) o un bloque que repasa las calles una a una, sí.
 */
const ANCHOR_SCORE = 2.5

export interface AnchorOptions {
  /** Mesas como máximo (una por paso en la lectura paso a paso). */
  limit?: number
  /**
   * De qué va la clase (su título y el del paso): solo se pone mesa para un
   * concepto que sea el tema, no para uno que se mencione de pasada ("Tu
   * primera sesión en la mesa" habla de pot odds, pero no las explica).
   */
  topic?: string
  /** Se admiten conceptos de iniciación (solo en el nivel de fundamentos). */
  introductory?: boolean
}

/**
 * Bloques de la clase bajo los que va una mesa, con su escena. De los bloques
 * que tratan con claridad un concepto del tema, gana el concepto más concreto
 * (más peso: la apertura antes que la posición) y, dentro de él, el primer
 * bloque que lo trata, que suele ser el que lo define. Sin repetir concepto y
 * hasta `limit`, para que la clase no se llene de mesas. `null` marca bloques
 * que no se analizan (tests, ejercicios).
 */
export function anchorScenes(
  texts: (string | null)[],
  { limit = 1, topic, introductory = true }: AnchorOptions = {},
): Map<number, ExplainerScene> {
  const onTopic = topic === undefined ? null : new Set(matchScenes(topic).map(match => match.scene.id))

  const candidates = texts.flatMap((text, index) => {
    if (!text) return []
    const top = matchScenes(text)[0]
    if (!top || top.score < ANCHOR_SCORE) return []
    if (onTopic && !onTopic.has(top.scene.id)) return []
    if (top.scene.introductory && !introductory) return []
    return [{ index, ...top }]
  })

  candidates.sort((a, b) => b.scene.weight - a.scene.weight || a.index - b.index)
  const anchors = new Map<number, ExplainerScene>()
  const used = new Set<string>()
  for (const candidate of candidates) {
    if (anchors.size >= limit) break
    if (used.has(candidate.scene.id)) continue
    used.add(candidate.scene.id)
    anchors.set(candidate.index, candidate.scene)
  }
  return new Map([...anchors].sort(([a], [b]) => a - b))
}

/** Un apartado de la clase: su título y el texto hablado de cada bloque. */
export interface LessonSection {
  title: string
  /** Es la introducción (lo que va antes del primer encabezado): su tema es la clase. */
  intro: boolean
  /** `null` en los bloques que no se analizan (tests, ejercicios). */
  texts: (string | null)[]
}

/**
 * Mesas de toda una clase, apartado por apartado: como mucho una por
 * apartado, para un concepto que sea su tema (su título, o el de la clase en
 * la introducción), y cada concepto una sola vez en la clase. Si un concepto
 * sale en varios apartados, se lo queda el primero cuyo título trata de él
 * ("Las seis posiciones de una mesa de 6"), no la introducción, que solo se
 * queda con lo que no tiene apartado propio. Devuelve, por apartado, bloque →
 * escena.
 */
export function lessonAnchors(
  sections: LessonSection[],
  { lessonTitle, introductory = true }: { lessonTitle: string; introductory?: boolean },
): Map<number, ExplainerScene>[] {
  const used = new Set<string>()
  const result = sections.map(() => new Map<number, ExplainerScene>())
  // Primero los apartados con título, en orden; después la introducción.
  const order = sections.map((section, index) => ({ section, index })).sort((a, b) => Number(a.section.intro) - Number(b.section.intro))
  for (const { section, index } of order) {
    const anchors = anchorScenes(section.texts, {
      limit: 1,
      topic: section.intro ? lessonTitle : section.title,
      introductory,
    })
    for (const [block, scene] of anchors) {
      if (used.has(scene.id)) continue
      used.add(scene.id)
      result[index].set(block, scene)
    }
  }
  return result
}
