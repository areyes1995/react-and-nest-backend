// ──────────────────────────────────────────────
// Form — Reusable form components
// Default styles are minimal; pass className to
// customize (e.g. dark‑theme classes from parent).
// ──────────────────────────────────────────────

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

// Re-export old form components from individual files
export { FormField } from './FormField'
export { FormButton } from './FormButton'
export { FormTextarea } from './FormTextarea'
export type { FormTextareaProps } from './FormTextarea'
export { FormAlert } from './FormAlert'
export { FormModalFooter } from './FormModalFooter'

/* ── FormInput ── */
export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  wrapperClassName?: string
  hasError?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', icon, wrapperClassName = '', hasError = false, ...props }, ref) => {
    return (
      <>
        <style>{`
          .form-input-wrapper { position: relative; }
          .form-input-icon {
            position: absolute;
            left: 0.875rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            pointer-events: none;
            color: var(--text-muted);
            z-index: 1;
          }
          .form-input--with-left-icon { padding-left: 2.5rem !important; }
        `}</style>
        <div className={`form-input-wrapper ${wrapperClassName}`}>
          {icon && <span className="form-input-icon">{icon}</span>}
          <input
            ref={ref}
            className={`form-input ${icon ? 'form-input--with-icon form-input--with-left-icon' : ''} ${hasError ? 'form-input--error' : ''} ${className}`}
            {...props}
          />
        </div>
      </>
    )
  },
)
FormInput.displayName = 'FormInput'

/* ── FormNumberInput ── */
export interface FormNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon?: ReactNode
  wrapperClassName?: string
}

export const FormNumberInput = forwardRef<HTMLInputElement, FormNumberInputProps>(
  ({ className = '', icon, wrapperClassName = '', ...props }, ref) => {
    return (
      <>
        <style>{`
          .form-input-wrapper { position: relative; }
          .form-input-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            pointer-events: none;
            color: var(--text-muted);
            z-index: 1;
          }
          .form-input--with-left-icon { padding-left: 2.5rem !important; }
        `}</style>
        <div className={`form-input-wrapper ${wrapperClassName}`}>
          {icon && <span className="form-input-icon">{icon}</span>}
          <input
            ref={ref}
            type="number"
            className={`form-input ${icon ? 'form-input--with-icon form-input--with-left-icon' : ''} ${className}`}
            {...props}
          />
        </div>
      </>
    )
  }
)
FormNumberInput.displayName = 'FormNumberInput'

/* ── FormDateInput ── */
export interface FormDateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon?: ReactNode
  wrapperClassName?: string
}

export const FormDateInput = forwardRef<HTMLInputElement, FormDateInputProps>(
  ({ className = '', icon, wrapperClassName = '', ...props }, ref) => {
    return (
      <>
        <style>{`
          .form-input-wrapper { position: relative; }
          .form-input-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            pointer-events: none;
            color: var(--text-muted);
            z-index: 1;
          }
          .form-input--with-left-icon { padding-left: 2.5rem !important; }
        `}</style>
        <div className={`form-input-wrapper ${wrapperClassName}`}>
          {icon && <span className="form-input-icon">{icon}</span>}
          <input
            ref={ref}
            type="date"
            className={`form-input ${icon ? 'form-input--with-icon form-input--with-left-icon' : ''} ${className}`}
            {...props}
          />
        </div>
      </>
    )
  }
)
FormDateInput.displayName = 'FormDateInput'

/* ── FormSelect ── */
export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
  hasError?: boolean
  wrapperClassName?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = '', options, placeholder, hasError = false, wrapperClassName = '', ...props }, ref) => {
    return (
      <span className={`form-select-wrapper ${wrapperClassName}`}>
        <select
          ref={ref}
          className={`form-input ${hasError ? 'form-input--error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="form-select-icon" aria-hidden="true">
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
        </span>
      </span>
    )
  },
)
FormSelect.displayName = 'FormSelect'

/* ── FormLabel ── */
export interface FormLabelProps {
  children: ReactNode
  className?: string
}

export function FormLabel({ children, className = '' }: FormLabelProps) {
  return (
    <label className={`form-label ${className}`}>
      {children}
    </label>
  )
}

/* ── FormActionButton (blue accent) ── */
export interface FormActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  icon?: ReactNode
}

export function FormActionButton({ children, icon, className = '', ...props }: FormActionButtonProps) {
  return (
    <button
      className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

/* ── FilterPill — blue filter chip ── */
export interface FilterPillProps {
  prefix?: string
  children: ReactNode
  onRemove?: () => void
}

export function FilterPill({ prefix, children, onRemove }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs">
      {prefix && <span className="opacity-60">{prefix}</span>}
      {children}
      {onRemove && (
        <button
          className="hover:text-[var(--text-primary)] transition"
          onClick={e => { e.stopPropagation(); onRemove() }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

/* ── MiniPill — small neutral chip for footer ── */
export interface MiniPillProps {
  children: ReactNode
  onRemove?: () => void
}

export function MiniPill({ children, onRemove }: MiniPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] text-mini">
      {children}
      {onRemove && (
        <button
          className="hover:text-[var(--text-primary)] transition"
          onClick={e => { e.stopPropagation(); onRemove() }}
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}