// ──────────────────────────────────────────────
// Table theme API — estilo de mesa por defecto.
// El catálogo de estilos está en el frontend
// (`features/table/themes.ts`); el backend solo
// recuerda cuál eligió el administrador.
// ──────────────────────────────────────────────

import { get, put } from './api'

export interface TableThemeSetting {
  /** `null` si nadie ha elegido uno todavía. */
  themeId: string | null
  /** `false` si el backend aún no tiene la tabla creada. */
  persisted: boolean
  updatedAt?: string
}

/** Estilo por defecto. `null` si no hay backend. */
export async function fetchTableTheme(): Promise<TableThemeSetting | null> {
  const res = await get<TableThemeSetting>('/table/theme')
  return res.ok && res.data && typeof res.data === 'object' ? res.data : null
}

/** Cambia el estilo por defecto (solo ADMIN / SUPERADMIN). */
export async function saveTableTheme(themeId: string): Promise<TableThemeSetting | null> {
  const res = await put<TableThemeSetting>('/table/theme', { themeId })
  return res.ok && res.data && typeof res.data === 'object' ? res.data : null
}
