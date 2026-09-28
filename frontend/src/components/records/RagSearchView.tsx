// ──────────────────────────────────────────────
// RagSearchView — Búsqueda sobre la base vectorial
// Full-text (sin IA) + documentos indexados.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  FileText,
  Sparkles,
  Layers,
  Building2,
  ShieldCheck,
  Clock,
  Loader2,
  ArrowRight,
  Hash,
  Inbox,
  AlertCircle,
  Database,
  Zap,
  FolderOpen,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ScanSearch,
  X,
} from 'lucide-react'
import { ragTextSearch, ragListDocumentsCached, ragChunkContext } from '@services/rag'
import type { RagTextChunk, RagDocument, RagContextChunk } from '@services/rag'
import { useAppTranslation } from '@i18n/useAppTranslation'
import ShowMore from '@components/ui/data-display/ShowMore'

// ─── Helpers de presentación ─────────────────

const DEPT_COLORS: Record<string, string> = {
  finance: 'from-amber-400/25 to-orange-500/10 text-amber-300 border-amber-400/30',
  hr: 'from-emerald-400/25 to-teal-500/10 text-emerald-300 border-emerald-400/30',
  operations: 'from-sky-400/25 to-blue-500/10 text-sky-300 border-sky-400/30',
  it: 'from-violet-400/25 to-purple-500/10 text-violet-300 border-violet-400/30',
  legal: 'from-fuchsia-400/25 to-pink-500/10 text-fuchsia-300 border-fuchsia-400/30',
  sales: 'from-lime-400/25 to-green-500/10 text-lime-300 border-lime-400/30',
  default: 'from-slate-400/25 to-slate-500/10 text-slate-300 border-slate-400/30',
}

const SENS_COLORS: Record<string, string> = {
  internal: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  confidential: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  restricted: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  public: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  default: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
}

function deptClass(dept: string | null): string {
  return DEPT_COLORS[dept ?? 'default'] ?? DEPT_COLORS.default
}

function sensClass(sens: string | null): string {
  return SENS_COLORS[sens ?? 'default'] ?? SENS_COLORS.default
}

function titleCase(s: string | null): string | null {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : null
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(score: number): string {
  if (score >= 0.6) return 'text-emerald-300'
  if (score >= 0.3) return 'text-amber-300'
  return 'text-rose-300'
}

function scoreBar(score: number): string {
  if (score >= 0.6) return 'from-emerald-400 to-teal-400'
  if (score >= 0.3) return 'from-amber-400 to-orange-400'
  return 'from-rose-400 to-red-400'
}

// ─── Subcomponentes ──────────────────────────

/** Resalta los términos de la query dentro de un texto. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return <>{text}</>
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-[#f2a93b]/25 px-0.5 text-[var(--text-primary)]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function DocCard({ doc }: { doc: RagDocument }) {
  const [expanded, setExpanded] = useState(false)
  const { t, i18n } = useAppTranslation()
  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 transition-all duration-300 hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-soft)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${deptClass(doc.department)}`}>
          <FileText className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {doc.title || doc.originalFilename}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{doc.originalFilename}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-mini font-medium ${deptClass(doc.department)}`}>
          <Building2 className="h-3 w-3" strokeWidth={2} />
          {titleCase(doc.department) ?? t('rag.noDepartment')}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-mini font-medium uppercase ${sensClass(doc.sensitivity)}`}>
          <ShieldCheck className="h-3 w-3" strokeWidth={2} />
          {doc.sensitivity || 'n/a'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-caption text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="font-semibold text-[var(--text-secondary)]">{doc.chunkCount}</span> {t('rag.chunks')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          {formatDate(doc.createdAt, i18n.language)}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-soft)] p-3">
          <p className="text-caption font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('rag.sourcePath')}</p>
          <p className="mt-1 break-all font-mono text-caption text-[var(--text-secondary)]">{doc.sourcePath}</p>
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        className="mt-2 inline-flex items-center gap-1 text-caption font-medium text-[#f2a93b] hover:text-amber-200 transition-colors"
      >
        {expanded ? t('rag.hidePath') : t('rag.showPath')}
        <ArrowRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
  )
}

function ResultCard({ chunk, query }: { chunk: RagTextChunk; query: string }) {
  const { t } = useAppTranslation()
  const [expanded, setExpanded] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [context, setContext] = useState<RagContextChunk[] | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [contextError, setContextError] = useState(false)
  const fullContent = chunk.content.replace(/\r\n/g, '\n')
  const snippet = chunk.content.replace(/\r\n/g, ' ').slice(0, 260)

  const loadContext = useCallback(async () => {
    if (context) return
    setContextLoading(true)
    setContextError(false)
    try {
      const res = await ragChunkContext(chunk.id, { before: 3, after: 3 })
      setContext(res.context)
    } catch {
      setContextError(true)
    } finally {
      setContextLoading(false)
    }
  }, [chunk.id, context])

  const toggleExpand = useCallback(() => {
    setExpanded(e => !e)
  }, [])

  const toggleContext = useCallback(() => {
    if (!showContext) {
      setShowContext(true)
      loadContext()
    } else {
      setShowContext(false)
    }
  }, [showContext, loadContext])

  const before = context?.filter(c => c.chunkIndex < chunk.chunkIndex) ?? []
  const after = context?.filter(c => c.chunkIndex > chunk.chunkIndex) ?? []

  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 transition-all duration-300 hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-soft)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br ${deptClass(chunk.department)}`}>
          <Hash className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {chunk.documentTitle || chunk.originalFilename || t('rag.documentFallback', { id: chunk.documentId })}
            </p>
            <span className={`shrink-0 text-xs font-bold tabular-nums ${scoreColor(chunk.rank)}`}>
              {chunk.rank.toFixed(2)}
            </span>
          </div>
          {chunk.sectionTitle && (
            <p className="mt-0.5 truncate text-caption text-[#f2a93b]/80">{chunk.sectionTitle}</p>
          )}
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreBar(chunk.rank)} transition-all duration-700`}
          style={{ width: `${Math.min(100, chunk.rank * 100)}%` }}
        />
      </div>

      {!expanded ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
          <Highlighted text={snippet} query={query} />
          {chunk.content.replace(/\r\n/g, ' ').length >= 260 ? '…' : ''}
        </p>
      ) : (
        <div className="mt-3 max-h-96 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
            <Highlighted text={fullContent} query={query} />
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-3">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-mini font-medium ${deptClass(chunk.department)}`}>
          <Building2 className="h-3 w-3" strokeWidth={2} />
          {titleCase(chunk.department) ?? t('rag.noDepartment')}
        </span>
        {chunk.originalFilename && (
          <span className="inline-flex max-w-[11.25rem] items-center gap-1 rounded-full border border-[var(--border-active)] bg-[var(--bg-surface)] px-2 py-0.5 text-mini font-medium text-[var(--text-secondary)]">
            <FileText className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{chunk.originalFilename}</span>
          </span>
        )}
        {chunk.pageStart != null && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-active)] bg-[var(--bg-surface)] px-2 py-0.5 text-mini font-medium text-[var(--text-secondary)]">
            {t('rag.page', { page: chunk.pageStart + (chunk.pageEnd && chunk.pageEnd !== chunk.pageStart ? `–${chunk.pageEnd}` : '') })}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleExpand}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-active)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-caption font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? t('rag.collapse') : t('rag.expand')}
        </button>
        <button
          onClick={toggleContext}
          disabled={!expanded || contextLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-active)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-caption font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ScanSearch className="h-3.5 w-3.5" />
          {contextLoading ? t('rag.contextLoading') : showContext ? t('rag.hideContext') : t('rag.loadContext')}
        </button>
      </div>

      {showContext && contextError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t('rag.contextError')}
        </div>
      )}

      {showContext && context && (
        <div className="mt-4 space-y-3">
          {before.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-soft)]/50 p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <ArrowUp className="h-3 w-3" /> {t('rag.contextBefore')}
              </p>
              <div className="space-y-2.5">
                {before.map(c => (
                  <div key={c.id}>
                    {c.sectionTitle && (
                      <p className="mb-1 text-mini font-medium text-[#f2a93b]/80">{c.sectionTitle}</p>
                    )}
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
                      <Highlighted text={c.content.replace(/\r\n/g, '\n')} query={query} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {after.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-soft)]/50 p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <ArrowDown className="h-3 w-3" /> {t('rag.contextAfter')}
              </p>
              <div className="space-y-2.5">
                {after.map(c => (
                  <div key={c.id}>
                    {c.sectionTitle && (
                      <p className="mb-1 text-mini font-medium text-[#f2a93b]/80">{c.sectionTitle}</p>
                    )}
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
                      <Highlighted text={c.content.replace(/\r\n/g, '\n')} query={query} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────

export default function RagSearchView() {
  const { t } = useAppTranslation()
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [results, setResults] = useState<RagTextChunk[] | null>(null)
  const [docs, setDocs] = useState<RagDocument[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [executionMs, setExecutionMs] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const departments = useMemo(() => {
    const set = new Set<string>()
    docs.forEach(d => d.department && set.add(d.department))
    return Array.from(set).sort()
  }, [docs])

  const loadDocuments = useCallback(async (force = false) => {
    setLoadingDocs(true)
    try {
      const { docs } = await ragListDocumentsCached(100, force)
      setDocs(docs)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('rag.search.error.load'))
    } finally {
      setLoadingDocs(false)
    }
  }, [t])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) {
      inputRef.current?.focus()
      return
    }
    setLoadingSearch(true)
    setError(null)
    try {
      const res = await ragTextSearch(q, { department: department || undefined, limit: 8 })
      setResults(res.chunks)
      setExecutionMs(res.executionTimeMs)
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rag.search.error.search'))
    } finally {
      setLoadingSearch(false)
    }
  }, [query, department, t])

  const docStats = useMemo(() => {
    const depts = new Map<string, number>()
    let chunks = 0
    docs.forEach(d => {
      chunks += d.chunkCount
      const key = d.department ?? 'other'
      depts.set(key, (depts.get(key) ?? 0) + 1)
    })
    return { total: docs.length, chunks, depts }
  }, [docs])

  const resetSearch = useCallback(() => {
    setQuery('')
    setDepartment('')
    setResults(null)
    setHasSearched(false)
    setExecutionMs(null)
    setError(null)
    inputRef.current?.focus()
  }, [])

  const canSearch = loadingSearch
  const searching = loadingSearch

  return (
    <div className="h-full overflow-y-auto scroll-pb-6">
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-12">
        {/* ── Hero: buscador ── */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-active)] bg-[var(--bg-panel)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(242,169,59,0.14),transparent_65%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-40 -right-20 h-64 w-96 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(96,165,250,0.10),transparent_65%)] blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2a93b] to-[#d18e2a] text-[#121316] shadow-[0_4px_16px_rgba(242,169,59,0.35)]">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('rag.search.title')}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('rag.search.subtitle')} · <span className="text-emerald-300">{t('rag.search.noAi')}</span> · {executionMs != null ? t('rag.search.lastSearch', { ms: executionMs }) : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('rag.search.placeholder')}
                  className="w-full rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#f2a93b]/60 focus:ring-2 focus:ring-[#f2a93b]/20"
                />
              </div>

              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none transition focus:border-[#f2a93b]/60 focus:ring-2 focus:ring-[#f2a93b]/20"
              >
                <option value="">{t('rag.search.allDepartments')}</option>
                {departments.map(d => (
                  <option key={d} value={d}>{titleCase(d)}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={canSearch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2a93b] to-[#d18e2a] px-5 py-2.5 text-sm font-semibold text-[#121316] shadow-[0_4px_16px_rgba(242,169,59,0.3)] transition hover:shadow-[0_4px_24px_rgba(242,169,59,0.45)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('rag.search.searching')}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" strokeWidth={2} />
                    {t('rag.search.search')}
                  </>
                )}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  onClick={resetSearch}
                  disabled={canSearch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-active)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[#f2a93b]/60 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  {t('rag.search.clear')}
                </button>
              )}
            </form>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats del índice ── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5">
            <div className="flex items-center gap-2 text-caption font-medium text-[var(--text-muted)]">
              <Database className="h-3.5 w-3.5" /> {t('rag.search.stat.documents')}
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{docStats.total}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5">
            <div className="flex items-center gap-2 text-caption font-medium text-[var(--text-muted)]">
              <Layers className="h-3.5 w-3.5" /> {t('rag.search.stat.chunks')}
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{docStats.chunks.toLocaleString('en-US')}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5">
            <div className="flex items-center gap-2 text-caption font-medium text-[var(--text-muted)]">
              <Building2 className="h-3.5 w-3.5" /> {t('rag.search.stat.departments')}
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{docStats.depts.size}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5">
            <div className="flex items-center gap-2 text-caption font-medium text-[var(--text-muted)]">
              <Zap className="h-3.5 w-3.5" /> {t('rag.search.stat.mode')}
            </div>
            <p className="mt-1 text-sm font-semibold text-emerald-300">{t('rag.search.stat.modeFullText')}</p>
          </div>
        </div>

        {/* ── Resultados ── */}
        {hasSearched && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {t('rag.search.results')}{results && results.length > 0 ? ` (${results.length})` : ''}
              </h3>
              {executionMs != null && (
                <span className="text-caption tabular-nums text-[var(--text-muted)]">{executionMs} ms</span>
              )}
            </div>

            {results && results.length > 0 ? (
              <div className="grid gap-3">
                {results.map(c => (
                  <ResultCard key={c.id} chunk={c} query={query} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-active)] bg-[var(--bg-panel)] p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('rag.search.noMatches', { query })}</p>
                <p className="text-xs text-[var(--text-muted)]">{t('rag.search.tryOtherTerms')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Documentos indexados ── */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <FolderOpen className="h-4 w-4 text-[#f2a93b]" />
              {t('rag.search.indexedDocuments')}
              <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-mini font-medium text-[var(--text-muted)]">{docs.length}</span>
            </h3>
            <button
              onClick={() => loadDocuments(true)}
              disabled={loadingDocs}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-active)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-caption font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingDocs ? 'animate-spin' : ''}`} />
              {t('rag.search.reload')}
            </button>
          </div>

          {loadingDocs ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-soft)]" />
              ))}
            </div>
          ) : (
            <ShowMore
              items={docs}
              batchSize={9}
              keyOf={d => d.id}
              listClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              renderItem={d => <DocCard doc={d} />}
              labels={{
                showMore: t('rag.search.showMore'),
                showAll: t('rag.search.showAll'),
                showing: t('rag.search.showing'),
              }}
              empty={
                <div className="rounded-2xl border border-dashed border-[var(--border-active)] bg-[var(--bg-panel)] p-8 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('rag.search.noDocuments')}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t('rag.search.seedCorpus')}</p>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}