// ──────────────────────────────────────────────
// RecordsTable — Table with search, built dynamically
// from a module's column definitions
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Search, ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Power } from 'lucide-react'
import RecordsFilter from './RecordsFilter'
import type { FilterColumn, FilterItem } from './RecordsFilter'
import { matchFilterItem } from './RecordsFilter'
import { FormInput } from '@components/ui/form'
import { sampleData } from '@records'
import type { RecordColumn, RecordData } from '@records'
import { useAppTranslation } from '@i18n/useAppTranslation'

export { sampleData }
export type { RecordData }

export interface RecordsTableProps {
  data?: RecordData[]
  columns?: RecordColumn[]
  statusFilter?: RecordData['status']
  hideFilter?: boolean
  defaultPageSize?: number
  onDelete?: (id: string) => void
  onDeactivate?: (id: string) => void
}

export default function RecordsTable({ data, columns = [], statusFilter, hideFilter, defaultPageSize = 5, onDelete, onDeactivate }: RecordsTableProps) {
  const { t } = useAppTranslation()
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const sourceData = useMemo(() => {
    const base = data ?? sampleData
    if (!statusFilter) return base
    return base.filter(row => row.status === statusFilter)
  }, [data, statusFilter])

  /* ── Filter columns fed to the RecordsFilter UI ── */
  const filterColumns = useMemo<FilterColumn[]>(
    () =>
      columns.map(col => ({
        id: col.key,
        label: col.header,
        type: col.type,
        options: col.options,
      })),
    [columns],
  )

  /* ── Column defs built from the module's column config ── */
  const columnsDef = useMemo<ColumnDef<RecordData>[]>(() => {
    const baseColumns: ColumnDef<RecordData>[] = columns.map(col => {
      const filterFn = (row: any, columnId: string, filterValue: FilterItem[]) =>
        !filterValue?.length || filterValue.some(item => matchFilterItem(item, row.getValue(columnId), col.type))

      const base: ColumnDef<RecordData> = {
        accessorKey: col.key,
        header: col.header,
        filterFn,
      }

      if (col.render) {
        base.cell = info => col.render!(info)
      } else if (col.key === 'status') {
        base.cell = info => {
          const status = info.getValue<string>()
          const colors: Record<string, string> = {
            Active: 'text-green-400 bg-green-400/10',
            Pending: 'text-amber-400 bg-amber-400/10',
            Archived: 'text-[var(--text-secondary)] bg-gray-400/10',
          }
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? ''}`}>
              {status}
            </span>
          )
        }
      } else if (col.type === 'number') {
        base.cell = info => {
          const value = info.getValue<number>()
          return <span className="tabular-nums">{value?.toLocaleString('en-US')}</span>
        }
      } else if (col.type === 'list') {
        base.cell = info => {
          const items = info.getValue<string[]>() ?? []
          if (items.length === 0) return <span className="text-[var(--text-muted)]">—</span>
          return (
            <span className="flex flex-wrap gap-1">
              {items.slice(0, 3).map(item => (
                <span key={item} className="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-300">
                  {item}
                </span>
              ))}
              {items.length > 3 && (
                <span className="text-xs text-[var(--text-muted)]">+{items.length - 3}</span>
              )}
            </span>
          )
        }
      }

      return base
    })

    if (onDelete) {
      baseColumns.push({
          id: 'actions',
          header: '',
          enableColumnFilter: false,
          enableSorting: false,
          cell: ({ row }) => {
            const id = row.original.id
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(id)
                }}
                className="text-red-400 hover:text-red-300 transition p-1 rounded hover:bg-red-400/10"
                title="Deactivate user"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          },
        } as ColumnDef<RecordData>)
    }

    return baseColumns
  }, [columns, onDelete])

  const table = useReactTable({
    data: sourceData,
    columns: columnsDef,
    state: { globalFilter, sorting, pagination, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      {!hideFilter && (
      <div className="px-4 lg:px-6 py-3 border-b border-[var(--border)] flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative max-w-sm w-full md:flex-1">
          <FormInput
            wrapperClassName="relative flex items-center"
            className="w-full pl-10 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-active)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text-muted)] transition"
            icon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
            placeholder={t('Search records...')}
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />
        </div>
        <RecordsFilter table={table} columns={filterColumns} />
      </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left text-[var(--text-muted)] font-medium py-3 px-3 cursor-pointer hover:text-[var(--text-secondary)] transition select-none"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp className="w-3.5 h-3.5" />,
                        desc: <ChevronDown className="w-3.5 h-3.5" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-50)] transition-all duration-150 hover:bg-[var(--bg-surface-soft)] hover:shadow-sm hover:scale-[1.001] cursor-pointer group"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-3 px-3 text-[var(--text-secondary)] group-hover:text-[var(--text-primary-80)] transition-colors duration-150">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {(onDelete || onDeactivate) && (
                  <td className="py-3 px-3 text-right w-24 flex items-end justify-end gap-1">
                    {onDeactivate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeactivate(row.original.id)
                        }}
                        className="text-amber-400 hover:text-amber-300 transition p-1 rounded hover:bg-amber-400/10"
                        title="Deactivate user"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(row.original.id)
                        }}
                        className="text-red-400 hover:text-red-300 transition p-1 rounded hover:bg-red-400/10"
                        title="Soft delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columnsDef.length || 1 + (onDelete ? 1 : 0) + (onDeactivate ? 1 : 0)} className="text-center py-12 text-[var(--text-muted)]">
                  {t('No records found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 lg:px-6 py-3 border-t border-[var(--border)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span>{t('Rows per page:')}</span>
          <select
            className="bg-[var(--bg-surface)] border border-[var(--border-active)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]"
            value={pagination.pageSize}
            onChange={e => {
              setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))
            }}
          >
            {[5, 10, 20, 50].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <span className="mr-2">
            {t('Page')} {currentPage + 1} {t('of')} {pageCount}
          </span>
          <button
            className="p-1 rounded hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition disabled:opacity-30"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {(() => {
            const getPageNumbers = (): (number | 'ellipsis')[] => {
              if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i)
              const pages: (number | 'ellipsis')[] = [0]
              if (currentPage > 3) pages.push('ellipsis')
              const start = Math.max(1, currentPage - 1)
              const end = Math.min(pageCount - 2, currentPage + 1)
              for (let i = start; i <= end; i++) pages.push(i)
              if (currentPage < pageCount - 4) pages.push('ellipsis')
              pages.push(pageCount - 1)
              return pages
            }
            return getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-1 text-[var(--text-muted)]">…</span>
              ) : (
                <button
                  key={page}
                  className={`w-7 h-7 rounded text-xs transition ${
                    page === currentPage
                      ? 'bg-blue-500/20 text-blue-400 font-medium'
                      : 'hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                  }`}
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </button>
              )
            )
          })()}
          <button
            className="p-1 rounded hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition disabled:opacity-30"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div>
          {table.getFilteredRowModel().rows.length} {t('records total')}
        </div>
      </div>
    </div>
  )
}