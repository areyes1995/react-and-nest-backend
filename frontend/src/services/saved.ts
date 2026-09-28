// ──────────────────────────────────────────────
// Saved API — la biblioteca personal del estudiante.
// El contenido sigue viviendo en el catálogo del
// frontend; el backend solo guarda a qué apunta cada
// marcador, junto con una copia del título y la ruta
// para poder pintar la lista sin resolver nada.
// ──────────────────────────────────────────────

import { del, get, post } from './api'

export type SavedKind = 'ARTICLE' | 'VIDEO' | 'LESSON' | 'GLOSSARY'

export interface SavedItem {
  kind: SavedKind
  /** `id` del contenido en el catálogo (no el slug). */
  contentId: string
  title: string | null
  /** Ruta del frontend que lo abre. */
  url: string | null
  note: string | null
  createdAt: string
}

export interface SavedItemInput {
  title?: string
  url?: string
  note?: string
}

export interface SavedItemList {
  items: SavedItem[]
  /** `false` si el backend aún no tiene la tabla creada. */
  persisted: boolean
}

export interface ToggleResult {
  saved: boolean
  item: SavedItem | null
}

function path(kind: SavedKind, contentId: string): string {
  return `/saved-items/${kind}/${encodeURIComponent(contentId)}`
}

/** Lo guardado por el usuario de la sesión. `null` si no hay backend. */
export async function fetchSavedItems(): Promise<SavedItemList | null> {
  const res = await get<SavedItemList>('/saved-items')
  return res.ok ? res.data : null
}

/** Guarda si no estaba, quita si estaba. `null` si el backend no respondió. */
export async function toggleSavedItem(
  kind: SavedKind,
  contentId: string,
  input: SavedItemInput = {},
): Promise<ToggleResult | null> {
  const res = await post<ToggleResult>(`${path(kind, contentId)}/toggle`, input)
  return res.ok ? res.data : null
}

export async function removeSavedItem(kind: SavedKind, contentId: string): Promise<boolean> {
  const res = await del(path(kind, contentId))
  return res.ok
}
