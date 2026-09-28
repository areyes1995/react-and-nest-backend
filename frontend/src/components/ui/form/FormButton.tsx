// ──────────────────────────────────────────────
// FormButton — Submit button with spinner
// ──────────────────────────────────────────────

import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
}

export function FormButton({
  children,
  loading = false,
  loadingText,
  icon,
  disabled,
  className = '',
  ...props
}: FormButtonProps) {
  return (
    <button
      type="submit"
      className={`form-submit-btn ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="form-btn-loading">
          <span className="form-spinner" />
          {loadingText || 'Loading…'}
        </span>
      ) : (
        <>
          {children}
          {icon && icon}
        </>
      )}
    </button>
  )
}