import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, GripVertical, Search } from 'lucide-react'
import { libraryApi } from '@services/educraft'
import type { LibraryResource, ResourceCategory } from '@services/types'
import { Badge, Drawer, EmptyState, Spinner } from '@components/ui'
import { useDebounce } from '@hooks/useDebounce'
import { RESOURCE_CATEGORIES } from '@lib/labels'

export const RESOURCE_MIME = 'application/x-educraft-resource'

/** Explorador exprés de la biblioteca: los recursos se arrastran a las clases. */
export function ResourceExplorerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<LibraryResource[] | null>(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<ResourceCategory | ''>('')
  const term = useDebounce(q, 250)

  useEffect(() => {
    if (!open) return
    setItems(null)
    libraryApi.list({ q: term || undefined, category: category || undefined }).then(setItems).catch(() => setItems([]))
  }, [open, term, category])

  return (
    <Drawer open={open} onClose={onClose} title="Biblioteca de recursos" subtitle="Arrastra un recurso hacia la clase o sesión que estés editando">
      <div className="space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o etiqueta" className="input pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCategory('')} className={`chip ${!category ? 'chip-active' : ''}`}>
            Todos
          </button>
          {(['IMAGE', 'GEOMETRY', 'CHART', 'VIDEO', 'PDF', 'OWN'] as ResourceCategory[]).map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? 'chip-active' : ''}`}>
              {RESOURCE_CATEGORIES[c].label}
            </button>
          ))}
        </div>
        {!items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="Sin recursos" description="Sube tus materiales desde el módulo Recursos." action={<Link to="/app/recursos" className="btn btn-primary btn-sm" onClick={onClose}>Ir a Recursos</Link>} />
        ) : (
          <ul className="space-y-2">
            {items.map((r) => (
              <li
                key={r.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(RESOURCE_MIME, JSON.stringify({ id: r.id, title: r.title, url: r.url, category: r.category, mimeType: r.mimeType }))
                  e.dataTransfer.setData('text/plain', r.url ?? r.title)
                }}
                className="flex cursor-grab items-center gap-3 rounded-2xl border border-line bg-surface p-3 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={RESOURCE_CATEGORIES[r.category].tone}>{RESOURCE_CATEGORIES[r.category].label}</Badge>
                    {r.tags.slice(0, 3).map((t) => (
                      <Badge key={t}>#{t}</Badge>
                    ))}
                  </div>
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Abrir">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
