// ──────────────────────────────────────────────
// FormField — Label + input wrapper
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  )
}