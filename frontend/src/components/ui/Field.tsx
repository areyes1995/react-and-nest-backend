import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@lib/cn'

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-brand-red">{error}</span> : hint && <span className="hint block">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn('input', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 3, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn('input resize-y leading-relaxed', className)} {...rest} />
})

export interface Option<V extends string | number = string | number> {
  value: V
  label: string
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }
>(function Select({ options, placeholder, className, ...rest }, ref) {
  return (
    <select ref={ref} className={cn('input cursor-pointer pr-8', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
})

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-ink-2 disabled:opacity-50"
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition',
          checked ? 'bg-brand-gradient' : 'bg-surface-3 ring-1 ring-inset ring-line',
        )}
      >
        <span
          className={cn(
            'absolute h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </span>
      {label}
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: ReactNode
  className?: string
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-start gap-2 text-sm text-ink-2', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-line accent-violet-500"
      />
      {label && <span>{label}</span>}
    </label>
  )
}
