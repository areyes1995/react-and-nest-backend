// ──────────────────────────────────────────────
// SavedPage — la biblioteca personal.
// Todo lo que el estudiante ha marcado, junto y en un
// solo sitio: clases, artículos y videos, del guardado
// más reciente al más antiguo.
//
// La lista se pinta con lo que devuelve el backend y
// se completa con el catálogo local, que es quien sabe
// la ruta actual de cada contenido. Un contenido que ya
// no existe no desaparece sin avisar: se muestra
// apagado para que el estudiante pueda quitarlo.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  BookA,
  FileText,
  GraduationCap,
  PlayCircle,
  Search,
  Trash2,
  WifiOff,
} from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { SAVED_KIND_LABEL, resolveTarget, useSavedItems } from '@features/saved'
import type { SavedItem, SavedKind } from '@services/saved'

const KIND_ICON: Record<SavedKind, typeof FileText> = {
  LESSON: GraduationCap,
  ARTICLE: FileText,
  VIDEO: PlayCircle,
  GLOSSARY: BookA,
}

const KIND_FILTERS: { id: SavedKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'LESSON', label: SAVED_KIND_LABEL.LESSON },
  { id: 'ARTICLE', label: SAVED_KIND_LABEL.ARTICLE },
  { id: 'VIDEO', label: SAVED_KIND_LABEL.VIDEO },
]

/** Fecha corta: "12 de marzo". El año solo cuando no es el actual. */
function savedOn(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

interface RowProps {
  item: SavedItem
  onRemove: () => void
}

function SavedRow({ item, onRemove }: RowProps) {
  // El catálogo manda sobre la copia guardada: un artículo renombrado o movido
  // debe seguir abriéndose desde aquí.
  const curriculum = useCurriculum()
  const target = resolveTarget(item.contentId, item.kind, curriculum)
  const title = target?.title ?? item.title ?? item.contentId
  const url = target?.url ?? item.url
  const Icon = KIND_ICON[item.kind] ?? Bookmark

  const body = (
    <>
      <span
        className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: 'var(--bg-surface-soft)' }}
      >
        <Icon
          className={`w-4 h-4 ${url ? 'text-[var(--poker-gold)]' : 'text-[var(--text-muted)]'}`}
          strokeWidth={1.5}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--text-primary)] truncate">
          {title}
        </span>
        <span className="block text-caption text-[var(--text-muted)] truncate">
          {[SAVED_KIND_LABEL[item.kind], target?.subtitle, savedOn(item.createdAt)]
            .filter(Boolean)
            .join(' · ')}
          {!url && ' · ya no disponible'}
        </span>
      </span>
    </>
  )

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2.5 transition hover:border-[var(--border-active)]">
      {url ? (
        <Link to={url} className="flex items-center gap-3 min-w-0 flex-1">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 min-w-0 flex-1 opacity-60">{body}</div>
      )}

      <button
        type="button"
        onClick={onRemove}
        title="Quitar de guardados"
        className="p-2 rounded-lg text-[var(--text-muted)] transition hover:text-red-400 hover:bg-[var(--bg-surface)]"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </li>
  )
}

export default function SavedPage() {
  const { items, source, remove } = useSavedItems()
  const [kind, setKind] = useState<SavedKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const curriculum = useCurriculum()

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      if (kind !== 'all' && item.kind !== kind) return false
      if (!needle) return true
      const target = resolveTarget(item.contentId, item.kind, curriculum)
      return `${target?.title ?? item.title ?? ''} ${target?.subtitle ?? ''}`
        .toLowerCase()
        .includes(needle)
    })
  }, [items, kind, query, curriculum])

  const countOf = (id: SavedKind | 'all') =>
    id === 'all' ? items.length : items.filter(item => item.kind === id).length

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition ${
      active
        ? 'bg-[var(--poker-gold)] text-black'
        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
    }`

  return (
    <AcademyPage
      title="Guardados"
      subtitle={
        items.length
          ? `${items.length} ${items.length === 1 ? 'contenido guardado' : 'contenidos guardados'}`
          : 'Lo que marques con el icono de guardar aparece aquí'
      }
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
            placeholder="Buscar en guardados…"
            className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Sin backend lo guardado no sale de este navegador: conviene decirlo
            antes de que el estudiante lo descubra cambiando de equipo. */}
        {source === 'local' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-soft)] px-3 py-2.5">
            <WifiOff className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Sin conexión con el servidor: estos guardados están solo en este navegador. Al
              iniciar sesión de nuevo se sincronizan con tu cuenta.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {KIND_FILTERS.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setKind(filter.id)}
              className={chip(kind === filter.id)}
            >
              {filter.label}
              <span className="ml-1.5 opacity-60 tabular-nums">{countOf(filter.id)}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bookmark className="w-7 h-7 text-[var(--text-muted)]" strokeWidth={1.25} />
            <p className="text-sm text-[var(--text-secondary)]">
              {items.length === 0
                ? 'Todavía no has guardado nada.'
                : 'No hay guardados con esos filtros.'}
            </p>
            {items.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                Pulsa el icono de marcador en una clase, un artículo o un video para tenerlo
                siempre a mano desde aquí.
              </p>
            )}
          </div>
        ) : (
          <ul className="stagger space-y-2">
            {filtered.map(item => (
              <SavedRow
                key={`${item.kind}:${item.contentId}`}
                item={item}
                onRemove={() => void remove(item.kind, item.contentId)}
              />
            ))}
          </ul>
        )}
      </div>
    </AcademyPage>
  )
}
