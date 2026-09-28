// ──────────────────────────────────────────────
// Curriculum API — el contenido de la academia.
// Niveles, cursos, clases y sus bloques viven en la
// base de datos del backend:
//   /academy/curriculum → con sesión, todo el contenido
//   /academy/catalog    → público, sin el contenido de
//                         las clases (para la landing)
// ──────────────────────────────────────────────

import { get } from './api'
import type { CurriculumStats, Level } from '@features/academy/types'

export interface CurriculumPayload {
  levels: Level[]
  stats: CurriculumStats
  /** `false` si el backend aún no tiene las tablas y sirve el currículo semilla. */
  persisted: boolean
  /** Incluye lo despublicado y las notas internas. */
  admin: boolean
}

/** Currículo completo con el contenido de cada clase. `null` si no hay backend. */
export async function fetchCurriculum(): Promise<CurriculumPayload | null> {
  const res = await get<CurriculumPayload>('/academy/curriculum')
  return res.ok ? res.data : null
}

/** Estructura pública del programa, sin el contenido de las clases. */
export async function fetchCatalog(): Promise<CurriculumPayload | null> {
  const res = await get<CurriculumPayload>('/academy/catalog')
  return res.ok ? res.data : null
}
