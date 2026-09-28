// ──────────────────────────────────────────────
// ArticlesPage — biblioteca escrita.
// Filtros por categoría y nivel más búsqueda por
// texto: el catálogo crece y la página tiene que
// seguir siendo navegable con cien artículos.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Bookmark } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { ArticleCard } from '@components/content'
import { useSavedItems } from '@features/saved'
import { ARTICLES, ARTICLE_CATEGORIES, type ArticleCategory } from '@features/articles/data'
import { useTranslatedContent } from '@services/translate'
import type { LevelId } from '@features/academy/types'

const LEVEL_FILTERS: { id: LevelId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos los niveles' },
  { id: 'beginner', label: 'Principiante' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzado' },
  { id: 'theory', label: 'Teoría' },
  { id: 'exploit', label: 'Explotación' },
  { id: 'pro', label: 'Profesional' },
]

export default function ArticlesPage() {
  const [params, setParams] = useSearchParams()
  const { isSaved } = useSavedItems()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelId | 'all'>('all')
  const [onlySaved, setOnlySaved] = useState(false)
  const articles = useTranslatedContent(ARTICLES)
  const categories = useTranslatedContent(ARTICLE_CATEGORIES)

  const category = (params.get('categoria') as ArticleCategory | null) ?? 'all'

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return articles.filter(article => {
      if (category !== 'all' && article.category !== category) return false
      if (level !== 'all' && article.level !== level) return false
      if (onlySaved && !isSaved(article.id, 'ARTICLE')) return false
      if (!needle) return true
      return (
        article.title.toLowerCase().includes(needle) ||
        article.excerpt.toLowerCase().includes(needle) ||
        article.tags.some(tag => tag.toLowerCase().includes(needle))
      )
    })
  }, [articles, category, level, query, onlySaved, isSaved])

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition ${
      active
        ? 'bg-[var(--poker-gold)] text-black'
        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
    }`

  return (
    <AcademyPage
      title="Artículos"
      subtitle={`${articles.length} artículos sobre estrategia, matemáticas y mentalidad`}
      actions={
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar artículo…"
            className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Categorías ── */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setParams({})} className={chip(category === 'all')}>
            Todas
          </button>
          {categories.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setParams({ categoria: item.id })}
              className={chip(category === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Nivel y guardados ── */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={level}
            onChange={event => setLevel(event.target.value as LevelId | 'all')}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
          >
            {LEVEL_FILTERS.map(item => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlySaved(value => !value)}
            className={`flex items-center gap-1.5 ${chip(onlySaved)}`}
          >
            <Bookmark className="w-3 h-3" fill={onlySaved ? 'currentColor' : 'none'} strokeWidth={1.5} />
            Guardados
          </button>

          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* ── Listado ── */}
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-10 text-center">
            No hay artículos con esos filtros.
          </p>
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </AcademyPage>
  )
}
