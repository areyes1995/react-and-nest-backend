// ──────────────────────────────────────────────
// Records domain — shared types
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { CellContext } from '@tanstack/react-table'

export type RecordStatus = 'Active' | 'Pending' | 'Archived'

/** A record row. `id` and `status` are always present; the rest varies per module.
 *  Columns of type `list` keep a string[] of item labels for filtering. */
export interface RecordData extends Record<string, string | number | string[]> {
  id: string
  status: RecordStatus
}

/** Kind of view a module can render in the main area. */
export type RecordViewKind = 'summary' | 'table' | 'archived' | 'upload'

/** A selectable option in the notes panel for a record module. */
export interface RecordViewOption {
  label: string
  slug: string
  description: string
  kind: RecordViewKind
  /** Permiso RBAC requerido para ver esta opción (ej. `rag:upload-view`). */
  permission?: string
}

/** A single column definition of a module's grid. */
export interface RecordColumn {
  key: string
  header: string
  type: 'text' | 'number' | 'date' | 'select' | 'list'
  options?: string[]
  /** Marks the categorical column used by the Summary chart for grouping. */
  chartGroup?: boolean
  /** Custom cell renderer (overrides the default by type). */
  render?: (info: CellContext<RecordData, unknown>) => ReactNode
}

/** A record module shown in the sidebar + notes panel. */
export interface RecordModule {
  label: string
  slug: string
  color: string
  icon: ReactNode
  viewOptions: RecordViewOption[]
  columns: RecordColumn[]
  summaryChart?: Record<string, any>
}

/** Static entry in a sidebar section (folders, tags, trash, …). */
export interface StaticSidebarItem {
  icon: ReactNode
  label: string
  /** URL slug when the item is navigable. */
  slug?: string
  /** Full route path when the item points to a dedicated page (e.g. /app/reports). */
  path?: string
  /** Permiso RBAC requerido para ver este item. Si no se define, siempre es visible. */
  permission?: string
}

/** Static sidebar section (no click handlers, no active state). */
export interface StaticSidebarSection {
  title: string
  items: StaticSidebarItem[]
}