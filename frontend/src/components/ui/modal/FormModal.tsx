// ──────────────────────────────────────────────
// FormModal — shell reutilizable para modales con
// formulario: header + body + footer con acciones
// Cancelar/Guardar, loading y error opcionales.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import Modal from './Modal'
import ModalHeader from './ModalHeader'
import ModalBody from './ModalBody'
import ModalFooter from './ModalFooter'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  onSubmit?: () => void
  submitLabel?: string
  saving?: boolean
  error?: string | null
  maxWidth?: string
  hideFooter?: boolean
}

const INPUT_CLASS =
  'w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-active)] transition'

export default function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = 'Guardar',
  saving = false,
  error = null,
  maxWidth = 'max-w-lg',
  hideFooter = false,
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
      <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <ModalBody>
        <div className="space-y-4">{children}</div>
        {error && (
          <div className="mt-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </ModalBody>
      {!hideFooter && (
        <ModalFooter
          left={
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          }
          right={
            onSubmit && (
              <button
                onClick={onSubmit}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando…' : submitLabel}
              </button>
            )
          }
        />
      )}
    </Modal>
  )
}

export { INPUT_CLASS as formInputClass }
