// ──────────────────────────────────────────────
// SaveButton — el marcador de un contenido.
// Un solo botón para clases, artículos y videos: el
// icono se enciende al guardar y la acción viaja al
// backend por detrás. Antes cada página repetía este
// bloque con sus propios colores.
// ──────────────────────────────────────────────

import { Bookmark } from 'lucide-react'
import { useSavedItems } from '@features/saved'
import type { SavedTarget } from '@features/saved'

export interface SaveButtonProps {
  target: SavedTarget
  /** Texto del tooltip; por defecto, "Guardar". */
  label?: string
  /** Variante compacta para tarjetas y listas. */
  size?: 'md' | 'sm'
}

export default function SaveButton({ target, label = 'Guardar', size = 'md' }: SaveButtonProps) {
  const { isSaved, toggle } = useSavedItems()
  const saved = isSaved(target.contentId, target.kind)
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      type="button"
      onClick={() => void toggle(target)}
      title={saved ? `Quitar de guardados` : label}
      aria-pressed={saved}
      className={`${size === 'sm' ? 'p-1.5' : 'p-2'} rounded-lg transition ${
        saved
          ? 'text-[var(--poker-gold)] bg-[var(--poker-gold)]/10'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
      }`}
    >
      <Bookmark className={icon} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
    </button>
  )
}
