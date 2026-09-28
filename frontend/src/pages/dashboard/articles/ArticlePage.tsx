// ──────────────────────────────────────────────
// ArticlePage — lector de artículo.
// Columna estrecha, tipografía cómoda y el mismo
// renderizador de bloques que las clases, así que
// un artículo también puede llevar manos, tablas y
// ejercicios.
// ──────────────────────────────────────────────

import { Link, Navigate, useParams } from 'react-router-dom'
import { Clock, Tag } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { ContentBlocks, LevelBadge, ArticleCard, SaveButton } from '@components/content'
import { ARTICLES, findArticle } from '@features/articles/data'
import { useContentLanguage, useTranslatedContent } from '@services/translate'
import { articleTarget } from '@features/saved'

export default function ArticlePage() {
  const { articleSlug } = useParams()
  const lang = useContentLanguage()
  const articles = useTranslatedContent(ARTICLES)
  const found = articleSlug ? findArticle(articleSlug) : undefined
  const article = articles.find(item => item.id === found?.id)

  if (!article) return <Navigate to="/app/articles" replace />

  const related = articles.filter(
    item => item.id !== article.id && (item.category === article.category || item.level === article.level),
  ).slice(0, 2)

  const published = new Date(article.publishedAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <AcademyPage
      title={article.title}
      subtitle={`${article.author} · ${published}`}
      width="prose"
      actions={<SaveButton target={articleTarget(article)} label="Guardar artículo" />}
    >
      <article className="space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <LevelBadge level={article.level} />
          <span className="text-caption text-[var(--text-muted)] uppercase tracking-wide">
            {article.category}
          </span>
          <span className="text-caption text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {article.readMinutes} min de lectura
          </span>
        </div>

        <p className="text-base leading-relaxed text-[var(--text-primary)] border-l-2 border-[var(--poker-gold)] pl-3">
          {article.excerpt}
        </p>

        <ContentBlocks blocks={article.blocks} />

        {/* ── Etiquetas ── */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border)]">
          <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
          {article.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-caption bg-[var(--bg-surface)] text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* ── Relacionados ── */}
        {related.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Seguir leyendo</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map(item => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        )}

        <Link to="/app/articles" className="inline-block text-xs text-[var(--poker-gold)] hover:underline">
          ← Volver a todos los artículos
        </Link>
      </article>
    </AcademyPage>
  )
}
