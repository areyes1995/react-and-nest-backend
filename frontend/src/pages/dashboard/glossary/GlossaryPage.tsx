// ──────────────────────────────────────────────
// GlossaryPage — el vocabulario de la mesa.
// Se consulta a mitad de una clase o de una mano, así
// que tiene que resolver en dos segundos: búsqueda
// inmediata, filtros con color por categoría, índice
// alfabético para saltar y tarjetas ojeables.
// Los términos relacionados son navegables: el glosario
// se recorre como una red, no como una lista.
// ──────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookA, Search, X } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  categoryMeta,
  countByCategory,
  findTerm,
  groupByLetter,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@features/glossary/data'
import { useTranslatedContent } from '@services/translate'

/** Resalta el texto buscado sin romper el resto de la definición. */
function Highlight({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>

  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-[var(--poker-gold)]/25 px-0.5 text-[var(--text-primary)]">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  )
}

interface TermCardProps {
  term: GlossaryTerm
  needle: string
  onNavigate: (term: string) => void
  /** El término que el alumno pulsó en una clase: se señala al llegar. */
  focused?: boolean
}

function TermCard({ term, needle, onNavigate, focused }: TermCardProps) {
  const meta = useTranslatedContent(categoryMeta(term.category))

  return (
    <article
      id={`term-${encodeURIComponent(term.term)}`}
      data-term={term.term}
      className={`group relative overflow-hidden rounded-xl border bg-[var(--bg-panel)] p-4 transition duration-500 hover:border-[var(--border-active)] hover:shadow-lg ${
        focused
          ? 'border-[var(--poker-gold)] ring-2 ring-[var(--poker-gold)]/40 shadow-lg'
          : 'border-[var(--border)]'
      }`}
    >
      {/* Franja de color: identifica la categoría antes de leer nada. */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: meta.color }}
        aria-hidden
      />

      <div className="flex flex-wrap items-baseline gap-2 pl-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          <Highlight text={term.term} needle={needle} />
        </h3>
        {term.spanish && (
          <span className="text-xs italic text-[var(--text-muted)]">{term.spanish}</span>
        )}
        <span
          className="ml-auto rounded-md px-1.5 py-0.5 text-mini font-semibold uppercase tracking-wide"
          style={{ background: `${meta.color}1f`, color: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-1.5 pl-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        <Highlight text={term.definition} needle={needle} />
      </p>

      {term.related && term.related.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-2">
          <span className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
            Ver también
          </span>
          {term.related.map(related => (
            <button
              key={related}
              type="button"
              onClick={() => onNavigate(related)}
              disabled={!findTerm(related)}
              className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 text-caption text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-50"
            >
              {related}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all')
  const listRef = useRef<HTMLDivElement>(null)
  const [searchParams] = useSearchParams()
  // Llegada desde una clase (?term=Flop): glosario completo con ese término señalado.
  const [focusedTerm, setFocusedTerm] = useState<string | null>(
    () => findTerm(searchParams.get('term') ?? '')?.term ?? null,
  )
  const glossary = useTranslatedContent(GLOSSARY)
  const glossaryCategories = useTranslatedContent(GLOSSARY_CATEGORIES)

  const counts = useMemo(() => countByCategory(), [])
  const needle = query.trim()

  const groups = useMemo(() => {
    const lowered = needle.toLowerCase()
    const filtered = glossary.filter(term => {
      if (category !== 'all' && term.category !== category) return false
      if (!lowered) return true
      return (
        term.term.toLowerCase().includes(lowered) ||
        term.spanish?.toLowerCase().includes(lowered) ||
        term.definition.toLowerCase().includes(lowered)
      )
    })
    return groupByLetter(filtered)
  }, [glossary, needle, category])

  const count = groups.reduce((sum, group) => sum + group.terms.length, 0)
  const letters = groups.map(group => group.letter)

  /** Salta a una letra sin tocar el scroll de la página completa. */
  const jumpTo = (letter: string) => {
    const container = listRef.current
    const target = container?.querySelector<HTMLElement>(`[data-letter="${letter}"]`)
    if (!container || !target) return
    container.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' })
  }

  /** Abre un término relacionado: filtra por él y lo deja arriba. */
  const openTerm = (name: string) => {
    setCategory('all')
    setQuery(name)
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Lleva el término señalado a la vista y apaga el resalte pasados unos segundos.
  useEffect(() => {
    if (!focusedTerm) return
    const container = listRef.current
    const target = container?.querySelector<HTMLElement>(`[data-term="${CSS.escape(focusedTerm)}"]`)
    if (container && target) {
      const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
      container.scrollTo({ top: top - container.clientHeight / 3, behavior: 'smooth' })
    }
    const timer = window.setTimeout(() => setFocusedTerm(null), 4000)
    return () => window.clearTimeout(timer)
  }, [focusedTerm])

  const activeMeta = category === 'all' ? null : glossaryCategories.find(item => item.id === category)

  return (
    <AcademyPage
      title="Glosario"
      subtitle={`${glossary.length} términos del poker explicados sin dar nada por supuesto`}
      fill
      actions={
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar término…"
            className="w-44 sm:w-64 pl-8 pr-8 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      }
    >
      <div className="flex h-full flex-col gap-4">
        {/* ── Filtros por categoría ── */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                category === 'all'
                  ? 'bg-[var(--poker-gold)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              Todas <span className="opacity-70">{glossary.length}</span>
            </button>

            {glossaryCategories.map(item => {
              const active = category === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(active ? 'all' : item.id)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    background: active ? item.color : 'var(--bg-surface)',
                    borderColor: active ? item.color : 'transparent',
                    color: active ? '#0b0d12' : 'var(--text-secondary)',
                  }}
                >
                  {item.label} <span className="opacity-70">{counts[item.id]}</span>
                </button>
              )
            })}
          </div>

          {activeMeta && (
            <p className="text-caption text-[var(--text-muted)]">{activeMeta.hint}</p>
          )}
        </div>

        {/* ── Índice alfabético ── */}
        {letters.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {letters.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => jumpTo(letter)}
                className="h-6 w-6 rounded-md bg-[var(--bg-surface)] text-caption font-bold text-[var(--text-secondary)] transition hover:bg-[var(--poker-gold)] hover:text-black"
              >
                {letter}
              </button>
            ))}
            <span className="ml-auto self-center text-xs text-[var(--text-muted)]">
              {count} {count === 1 ? 'término' : 'términos'}
            </span>
          </div>
        )}

        {/* ── Listado ── */}
        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
            <BookA className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p className="text-sm text-[var(--text-primary)]">
              Ningún término coincide con «{query}».
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className="text-xs text-[var(--poker-gold)] hover:underline"
            >
              Ver todos los términos
            </button>
          </div>
        ) : (
          // El scroll vive aquí, no en la página: saltar a una letra no debe
          // mover la cabecera ni los filtros.
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-6">
              {groups.map(group => (
                <section key={group.letter} data-letter={group.letter} className="space-y-2">
                  <h2 className="sticky top-0 z-10 flex items-center gap-2 bg-[var(--bg-main)]/95 py-1 backdrop-blur-sm">
                    <span className="text-sm font-bold text-[var(--poker-gold)]">{group.letter}</span>
                    <span className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-mini text-[var(--text-muted)]">
                      {group.terms.length}
                    </span>
                  </h2>

                  <div className="grid gap-2.5 lg:grid-cols-2">
                    {group.terms.map(term => (
                      <TermCard
                        key={term.term}
                        term={term}
                        needle={needle}
                        onNavigate={openTerm}
                        focused={term.term === focusedTerm}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </AcademyPage>
  )
}
