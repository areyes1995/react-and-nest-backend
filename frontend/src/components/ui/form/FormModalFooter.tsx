// ──────────────────────────────────────────────
// FormModalFooter — footer estándar de modales de form
// Cancelar (ghost) + Submit (FormButton). Usa ModalFooter
// para no duplicar el layout en cada page.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import ModalFooter from '@components/ui/modal/ModalFooter'
import { FormButton } from './FormButton'

interface FormModalFooterProps {
  onCancel: () => void
  submitLabel: string
  submitting?: boolean
  submittingText?: string
  submitIcon?: ReactNode
  cancelDisabled?: boolean
}

export function FormModalFooter({
  onCancel,
  submitLabel,
  submitting = false,
  submittingText,
  submitIcon,
}: FormModalFooterProps) {
  return (
    <ModalFooter
      right={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <FormButton
            type="submit"
            loading={submitting}
            loadingText={submittingText ?? 'Guardando…'}
            icon={submitIcon}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {submitLabel}
          </FormButton>
        </div>
      }
    />
  )
}
