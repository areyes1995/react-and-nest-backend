// ──────────────────────────────────────────────
// RecordsFilter — Column-specific filter with
// operator-based accumulated pills
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { Filter, Plus } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import type { RecordData } from './RecordsTable'
import {
  FormInput,
  FormNumberInput,
  FormDateInput,
  FormSelect,
  FormLabel,
  FormActionButton,
  FilterPill,
  MiniPill,
} from '@components/ui/form'
import { useAppTranslation } from '@i18n/useAppTranslation'

const fieldInput = 'w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-active)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text-muted)] transition'
const fieldLabel = 'block text-xs text-[var(--text-muted)] mb-1'

/* ── Filter item type ── */
export interface FilterItem {
  op: string
  value: string
  value2?: string
}

export interface FilterColumn {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'list'
  options?: string[]
}

/* ── Operator definitions per column type ── */
const operatorOptions: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
  ],
  list: [
    { value: 'has', label: 'Has' },
    { value: 'lacks', label: "Doesn't have" },
  ],
}

function getOperators(type: string) {
  return operatorOptions[type] ?? operatorOptions.text
}

function formatOpLabel(op: string): string {
  const map: Record<string, string> = {
    contains: 'contains',
    equals: '=',
    gt: '>',
    lt: '<',
    between: 'between',
    before: '<',
    after: '>',
    has: 'has',
    lacks: 'without',
  }
  return map[op] ?? op
}

/* ── Run a single FilterItem against a cell value ── */
export function matchFilterItem(item: FilterItem, cellValue: unknown, type: string): boolean {
  if (cellValue == null) return false
  const strVal = String(cellValue)

  switch (type) {
    case 'number': {
      const num = Number(strVal)
      const fv = Number(item.value)
      if (isNaN(num) || isNaN(fv)) return false
      switch (item.op) {
        case 'equals': return num === fv
        case 'gt': return num > fv
        case 'lt': return num < fv
        case 'between': {
          const fv2 = Number(item.value2)
          return !isNaN(fv2) && num >= fv && num <= fv2
        }
        default: return false
      }
    }
    case 'date': {
      // Handles DD/MM/YYYY (data) and YYYY-MM-DD (input)
      const toComparable = (s: string) => {
        if (!s) return ''
        if (s.includes('/')) {
          const [d, m, y] = s.split('/')
          return `${y}-${m}-${d}`
        }
        return s // already YYYY-MM-DD
      }
      const cell = toComparable(strVal)
      const fv = toComparable(item.value)
      switch (item.op) {
        case 'equals': return cell === fv
        case 'before': return cell < fv
        case 'after': return cell > fv
        case 'between': {
          const fv2 = toComparable(item.value2 ?? '')
          return cell >= fv && cell <= fv2
        }
        default: return false
      }
    }
    select: {
      return strVal === item.value
    }
    case 'list': {
      const arr = Array.isArray(cellValue)
        ? cellValue.map(v => String(v))
        : strVal.split(',')
      const has = () => arr.some(v => v.toLowerCase() === item.value.toLowerCase())
      switch (item.op) {
        case 'has': return has()
        case 'lacks': return !has()
        default: return false
      }
    }
    default: {
      // text
      switch (item.op) {
        case 'contains':
          return strVal.toLowerCase().includes(item.value.toLowerCase())
        case 'equals':
          return strVal.toLowerCase() === item.value.toLowerCase()
        default:
          return false
      }
    }
  }
}

/* ── Component ── */
interface RecordsFilterProps {
  table: Table<RecordData>
  columns: FilterColumn[]
}

export default function RecordsFilter({ table, columns }: RecordsFilterProps) {
  const { t } = useAppTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [inputOp, setInputOp] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [inputValue2, setInputValue2] = useState('')

  const currentCol = columns.find(c => c.id === selectedColumn)
  const ops = currentCol ? getOperators(currentCol.type) : []
  const filterItems = selectedColumn
    ? (table.getColumn(selectedColumn)?.getFilterValue() as FilterItem[] | undefined) ?? []
    : []

  /* ── Summary of all active filters ── */
  const allFilters = columns
    .map(col => {
      const items = table.getColumn(col.id)?.getFilterValue() as FilterItem[] | undefined
      return items?.length ? { column: col, items } : null
    })
    .filter(Boolean) as { column: FilterColumn; items: FilterItem[] }[]

  const totalFilterCount = allFilters.reduce((acc, f) => acc + f.items.length, 0)

  /* ── Add filter item ── */
  const addFilter = useCallback(() => {
    if (!selectedColumn || !inputOp || !inputValue.trim()) return
    if (inputOp === 'between' && !inputValue2.trim()) return

    const col = table.getColumn(selectedColumn)
    if (!col) return

    const current = (col.getFilterValue() as FilterItem[] | undefined) ?? []
    const newItem: FilterItem = { op: inputOp, value: inputValue.trim(), value2: inputOp === 'between' ? inputValue2.trim() : undefined }

    col.setFilterValue([...current, newItem])
    setInputValue('')
    setInputValue2('')
  }, [selectedColumn, inputOp, inputValue, inputValue2, table])

  /* ── Remove one filter item ── */
  const removeFilter = useCallback(
    (colId: string, idx: number) => {
      const col = table.getColumn(colId)
      if (!col) return
      const current = (col.getFilterValue() as FilterItem[] | undefined) ?? []
      const updated = current.filter((_, i) => i !== idx)
      col.setFilterValue(updated.length ? updated : undefined)
    },
    [table],
  )

  /* ── Clear all filters ── */
  const clearAll = useCallback(() => {
    columns.forEach(col => table.getColumn(col.id)?.setFilterValue(undefined))
    setSelectedColumn('')
    setInputOp('')
    setInputValue('')
    setInputValue2('')
  }, [columns, table])

  /* ── When column changes, reset inputs ── */
  const handleColumnChange = (colId: string) => {
    setSelectedColumn(colId)
    setInputOp('')
    setInputValue('')
    setInputValue2('')
    const col = columns.find(c => c.id === colId)
    if (col) {
      const ops = getOperators(col.type)
      setInputOp(ops[0]?.value ?? '')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFilter()
    }
  }

  /* ── Render the type-specific input ── */
  const renderInput = () => {
    if (!currentCol || !inputOp) return null
    const showSecond = inputOp === 'between'

    switch (currentCol.type) {
      case 'number':
        return (
          <div className="space-y-1.5">
            <FormNumberInput
              className={fieldInput}
              placeholder={showSecond ? t('Min value') : t('Value...')}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {showSecond && (
              <FormNumberInput
                className={fieldInput}
                placeholder={t('Max value')}
                value={inputValue2}
                onChange={e => setInputValue2(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>
        )
      case 'date':
        return (
          <div className="space-y-1.5">
            <FormDateInput
              className={`${fieldInput} `}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {showSecond && (
              <FormDateInput
                className={`${fieldInput} `}
                value={inputValue2}
                onChange={e => setInputValue2(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>
        )
      case 'select':
        return (
          <FormSelect
            className={fieldInput}
            options={currentCol.options?.map(opt => ({ value: opt, label: opt })) ?? []}
            placeholder={t('Select value...')}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        )
      case 'list':
        return (
          <FormSelect
            className={fieldInput}
            options={currentCol.options?.map(opt => ({ value: opt, label: opt })) ?? []}
            placeholder={t('Select item...')}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        )
      default:
        return (
          <div className="space-y-1.5">
            <FormInput
              className={fieldInput}
              placeholder={showSecond ? t('First value') : t('Value...')}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {showSecond && (
              <FormInput
                className={fieldInput}
                placeholder={t('Second value')}
                value={inputValue2}
                onChange={e => setInputValue2(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>
        )
    }
  }

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition ${
          totalFilterCount > 0
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-[var(--bg-surface)] border-[var(--border-active)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>
          {totalFilterCount > 0
            ? `${totalFilterCount} ${t(totalFilterCount > 1 ? 'filters' : 'filter')}`
            : t('Filter')}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-[80vw] max-w-80 z-20 bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-xl p-3 space-y-3 animate-scale-in">
            {/* Column selector */}
            <FormSelect
              className={fieldInput}
              options={columns.map(col => ({ value: col.id, label: col.label }))}
              placeholder={t('Select column...')}
              value={selectedColumn}
              onChange={e => handleColumnChange(e.target.value)}
            />

            {currentCol && (
              <>
                {/* Accumulated pills for this column */}
                {filterItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filterItems.map((item, idx) => (
                      <FilterPill
                        key={idx}
                        prefix={formatOpLabel(item.op)}
                        onRemove={() => removeFilter(selectedColumn, idx)}
                      >
                        {item.op === 'between' ? `${item.value} – ${item.value2}` : item.value}
                      </FilterPill>
                    ))}
                  </div>
                )}

                {/* Operator selector */}
                <div>
                  <FormLabel className={fieldLabel}>{t('Operator')}</FormLabel>
                  <FormSelect
                    className={fieldInput}
                    options={ops.map(op => ({ value: op.value, label: t(op.label) }))}
                    placeholder={t('Select operator...')}
                    value={inputOp}
                    onChange={e => setInputOp(e.target.value)}
                  />
                </div>

                {/* Value input(s) */}
                {inputOp && (
                  <div>
                    <FormLabel className={fieldLabel}>{t('Value')}</FormLabel>
                    {renderInput()}
                  </div>
                )}

                {/* Add Item button */}
                {inputOp && inputValue.trim() && (inputOp !== 'between' || inputValue2.trim()) && (
                  <FormActionButton icon={<Plus className="w-3.5 h-3.5" />} onClick={addFilter}>
                    {t('Add Item')}
                  </FormActionButton>
                )}
              </>
            )}

            {!currentCol && (
              <p className="text-xs text-[var(--text-muted)] text-center py-2">
                {t('Choose a column to filter')}
              </p>
            )}

            {/* Footer with quick pills and clear-all */}
            {totalFilterCount > 0 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {allFilters.flatMap(f =>
                    f.items.map((item, idx) => (
                      <MiniPill key={`${f.column.id}-${idx}`} onRemove={() => removeFilter(f.column.id, idx)}>
                        {f.column.label}: {formatOpLabel(item.op)} {item.value}
                        {item.value2 && ` – ${item.value2}`}
                      </MiniPill>
                    )),
                  )}
                </div>
                <button
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0 ml-2"
                  onClick={clearAll}
                >
{t('Clear all')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}