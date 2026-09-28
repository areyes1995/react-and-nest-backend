// ──────────────────────────────────────────────
// DynamicColumns — construye columnas y filas a
// partir de datos crudos (estáticos o de endpoint)
// sin hardcodear el set de columnas.
//
// Cada columna se deriva de las claves de los datos
// y su header se auto-pretifica (camelCase, guiones
// bajos/medios → Title Case con espacios). Con el
// mapa `columns` puedes controlar por columna:
//   - header  : renombrarla
//   - hidden  : ocultarla del grid
//   - type    : forzar su tipo (text/number/date/select)
//   - transform : transformar el valor crudo (ej. array → count)
//   - render  : celda custom (ej. permisos anidados)
// ──────────────────────────────────────────────

import type { CellContext } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { RecordColumn, RecordData, RecordStatus } from './types'

export interface DynamicColumnOverride<T extends object = Record<string, unknown>> {
  /** Renombra el header de la columna. */
  header?: string
  /** Oculta la columna del grid (el valor se mantiene en la fila). */
  hidden?: boolean
  /** Fuerza el tipo de la columna. */
  type?: RecordColumn['type']
  /** Transforma el valor crudo a string/number (ej. array → count). */
  transform?: (value: unknown, row: T) => string | number
  /** Para type 'list': extrae el label de cada item del grupo. */
  itemsOf?: (item: unknown, row: T) => string
  /** Celda custom (ej. permisos anidados). */
  render?: (info: CellContext<RecordData, unknown>) => ReactNode
}

export interface DynamicColumnConfig<T extends object = Record<string, unknown>> {
  /** Overrides por clave de dato. */
  columns?: Record<string, DynamicColumnOverride<T>>
  /** Deriva el status de cada fila. */
  statusOf?: (row: T) => RecordStatus
  /** Deriva el id de cada fila (por defecto String(row.id ?? index+1)). */
  idOf?: (row: T, index: number) => string
}

export interface DynamicTableResult {
  columns: RecordColumn[]
  data: RecordData[]
}

function inferType(value: unknown): RecordColumn['type'] {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'select'
  return 'text'
}

/** Pretifica una clave: camelCase + guiones → Title Case con espacios. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, c => c.toUpperCase())
}

/** Convierte un valor crudo a string/number compatible con RecordData. */
function toCellValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value == null) return ''
  return String(value)
}

/**
 * Deriva columnas y filas a partir de un array de objetos.
 * - Columnas: unión de claves en orden de aparición.
 * - Header: override.header ?? humanizeKey(key).
 * - Tipo: override.type ?? inferido del primer valor.
 * - Fila: id/status derivados + valores convertidos (transform aplicado).
 */
export function buildDynamicTable<T extends object>(
  rows: T[],
  config: DynamicColumnConfig<T> = {},
): DynamicTableResult {
  const { columns: overrides = {}, statusOf, idOf } = config

  const keys: string[] = []
  rows.forEach(row => {
    Object.keys(row).forEach(k => {
      if (!keys.includes(k)) keys.push(k)
    })
  })

  const valueAt = (row: T, key: string): unknown => (row as Record<string, unknown>)[key]

  const visibleKeys = keys.filter(k => !overrides[k]?.hidden)

  /** Normaliza el grupo de items de una fila a labels string (para type 'list'). */
  const listOf = (row: T, k: string): string[] => {
    const v = valueAt(row, k)
    const override = overrides[k]
    const raw: unknown[] = Array.isArray(v) ? v : v == null ? [] : [v]
    return override?.itemsOf ? raw.map(item => override.itemsOf!(item, row)) : raw.map(String)
  }

  const columns: RecordColumn[] = visibleKeys.map(k => {
    const override = overrides[k]
    const sample = rows.find(r => valueAt(r, k) != null)
    const type = override?.type ?? inferType(sample ? valueAt(sample, k) : undefined)
    const col: RecordColumn = {
      key: k,
      header: override?.header ?? humanizeKey(k),
      type,
    }
    if (override?.render) col.render = override.render
    if (type === 'select') {
      col.options = Array.from(
        new Set(rows.map(r => String(override?.transform ? override.transform(valueAt(r, k), r) : valueAt(r, k) ?? '')).filter(Boolean)),
      )
    }
    if (type === 'list') {
      col.options = Array.from(new Set(rows.flatMap(r => listOf(r, k)).filter(Boolean)))
    }
    return col
  })

  const data: RecordData[] = rows.map((row, index) => {
    const record: RecordData = {
      id: idOf ? idOf(row, index) : String(valueAt(row, 'id') ?? index + 1),
      status: statusOf ? statusOf(row) : 'Active',
    }
    for (const k of keys) {
      if (k === 'id' || k === 'status') continue
      const override = overrides[k]
      if (override?.type === 'list') {
        record[k] = listOf(row, k)
        continue
      }
      record[k] = override?.transform
        ? override.transform(valueAt(row, k), row)
        : toCellValue(valueAt(row, k))
    }
    return record
  })

  return { columns, data }
}