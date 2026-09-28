// ──────────────────────────────────────────────
// FormTextarea — textarea con estilos del form system
// Usa .form-input central; no repetir chains en pages.
// ──────────────────────────────────────────────

import { forwardRef, type TextareaHTMLAttributes } from 'react'

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = '', hasError = false, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`form-input ${hasError ? 'form-input--error' : ''} ${className}`}
        {...props}
      />
    )
  },
)
FormTextarea.displayName = 'FormTextarea'
