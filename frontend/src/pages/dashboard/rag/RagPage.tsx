// ──────────────────────────────────────────────
// RagPage — placeholder RAG (starter).
// Usa @services/rag (GET /rag/text-search).
// ──────────────────────────────────────────────

import { useState } from 'react'
import { ViewHeader } from '@components/ui'
import { ragTextSearch } from '@services/rag'
import { useAppTranslation } from '@i18n/useAppTranslation'

export default function RagPage() {
  const { t } = useAppTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      const data = await ragTextSearch(query)
      const list = (data as { results?: unknown[]; chunks?: unknown[] }).results
        ?? (data as { chunks?: unknown[] }).chunks
        ?? []
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4 overflow-y-auto">
      <ViewHeader title={t('nav.rag')} subtitle={t('nav.desc.rag')} />
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar en documentos…"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || !query.trim()}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          style={{ background: 'var(--poker-gold)' }}
        >
          {t('common.search')}
        </button>
      </div>
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={i} className="rounded-xl border border-[var(--border)] p-3 text-xs">
            <pre className="whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}
