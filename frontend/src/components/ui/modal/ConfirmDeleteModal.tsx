// ──────────────────────────────────────────────
// ConfirmDeleteModal — confirmación destructiva genérica
// Reemplaza los modales custom duplicados en
// StandsView / ProjectsView (mismo layout senior).
// ──────────────────────────────────────────────

import { TriangleAlert, Trash2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  itemName?: string
  description?: string
  confirmLabel?: string
  confirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  itemName,
  description = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={confirming ? undefined : onCancel} />
      <div className="relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <TriangleAlert className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {itemName ? (
                <>
                  ¿Seguro que deseas eliminar{' '}
                  <span className="font-medium text-[var(--text-primary)]">“{itemName}”</span>?{' '}
                </>
              ) : (
                '¿Seguro que deseas eliminar este registro? '
              )}
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirming ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
