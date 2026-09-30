// ──────────────────────────────────────────────
// Piezas de UI compartidas por las páginas del
// Trading Risk Manager.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CircleCheck, OctagonX, ShieldAlert } from 'lucide-react'
import { ViewHeader, formInputClass } from '@components/ui'
import type { AlertLevel, FundingHealth } from '@services/trading'

// ─── Formato ───────────────────────────────────

export function money(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value)
}

/** `value` ya en porcentaje (0.5 → "0.5%"). */
export function pct(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Number(value.toFixed(digits))}%`
}

/** `value` como fracción (0.42 → "42%"). */
export function ratioPct(value: number | null | undefined, digits = 1): string {
  return value == null ? '—' : pct(value * 100, digits)
}

export function rMultiple(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`
}

export function signedMoney(value: number, currency = 'USD'): string {
  return `${value > 0 ? '+' : ''}${money(value, currency)}`
}

export function pnlClass(value: number | null | undefined): string {
  if (!value) return 'text-[var(--text-primary)]'
  return value > 0 ? 'text-emerald-400' : 'text-red-400'
}

// ─── Estados de alerta ─────────────────────────

export const ALERT_META: Record<AlertLevel, { label: string; emoji: string; className: string; icon: ReactNode }> = {
  NORMAL: {
    label: 'Riesgo controlado',
    emoji: '🟢',
    className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: <CircleCheck className="w-5 h-5" />,
  },
  CAUTION: {
    label: 'Precaución',
    emoji: '🟡',
    className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  RISK: {
    label: 'Riesgo',
    emoji: '🟠',
    className: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    icon: <ShieldAlert className="w-5 h-5" />,
  },
  STOP: {
    label: 'Stop',
    emoji: '🔴',
    className: 'bg-red-500/10 border-red-500/30 text-red-400',
    icon: <OctagonX className="w-5 h-5" />,
  },
}

export const HEALTH_META: Record<FundingHealth, { emoji: string; className: string; bar: string }> = {
  GREEN: { emoji: '🟢', className: 'text-emerald-400', bar: 'bg-emerald-500' },
  YELLOW: { emoji: '🟡', className: 'text-yellow-400', bar: 'bg-yellow-500' },
  ORANGE: { emoji: '🟠', className: 'text-orange-400', bar: 'bg-orange-500' },
  RED: { emoji: '🔴', className: 'text-red-400', bar: 'bg-red-500' },
}

// ─── Layout ────────────────────────────────────

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 flex-wrap pr-4 lg:pr-6">
        <div className="min-w-0 flex-1">
          <ViewHeader title={title} subtitle={subtitle} />
        </div>
        {actions && <div className="flex items-center gap-2 py-2">{actions}</div>}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full p-4 lg:p-6 space-y-5">{children}</div>
      </div>
    </div>
  )
}

export function Panel({
  title,
  icon,
  actions,
  children,
  className = '',
}: {
  title?: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 lg:p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && (
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
              {title}
            </h3>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatTile({
  label,
  value,
  hint,
  valueClass = 'text-[var(--text-primary)]',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-soft)] px-3 py-2.5 min-w-0">
      <p className="text-caption uppercase tracking-wide text-[var(--text-muted)] truncate">{label}</p>
      <p className={`text-lg font-semibold tabular-nums truncate ${valueClass}`}>{value}</p>
      {hint && <p className="text-caption text-[var(--text-muted)] mt-0.5">{hint}</p>}
    </div>
  )
}

export function ProgressBar({ value, barClass = 'bg-emerald-500' }: { value: number; barClass?: string }) {
  const width = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className="h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden" role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {message}
    </div>
  )
}

export const primaryButton =
  'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50'
export const secondaryButton =
  'inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50'

// ─── Inputs ────────────────────────────────────

let fieldSeq = 0
function useFieldId(prefix: string) {
  const ref = useRef<string>('')
  if (!ref.current) ref.current = `${prefix}-${++fieldSeq}`
  return ref.current
}

/**
 * Input numérico que conserva el texto mientras se escribe ("0.", "")
 * y solo emite números válidos.
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 'any',
  min,
  max,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  step?: number | 'any'
  min?: number
  max?: number
  hint?: string
}) {
  const id = useFieldId('num')
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : ''))

  useEffect(() => {
    if (Number(text) !== value) setText(Number.isFinite(value) ? String(value) : '')
    // Solo se sincroniza cuando el valor externo cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={text}
          onChange={e => {
            setText(e.target.value)
            const n = Number(e.target.value)
            if (e.target.value !== '' && Number.isFinite(n)) onChange(n)
          }}
          className={`${formInputClass} tabular-nums ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="text-caption text-[var(--text-muted)]">{hint}</span>}
    </div>
  )
}

/** Variante opcional: vacío → `null`. */
export function OptionalNumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  suffix?: string
  hint?: string
}) {
  const id = useFieldId('onum')
  const [text, setText] = useState(() => (value == null ? '' : String(value)))

  useEffect(() => {
    const current = text === '' ? null : Number(text)
    if (current !== value) setText(value == null ? '' : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          value={text}
          onChange={e => {
            setText(e.target.value)
            if (e.target.value === '') onChange(null)
            else if (Number.isFinite(Number(e.target.value))) onChange(Number(e.target.value))
          }}
          className={`${formInputClass} tabular-nums ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="text-caption text-[var(--text-muted)]">{hint}</span>}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date' | 'datetime-local' | 'month' | 'url'
  placeholder?: string
}) {
  const id = useFieldId('txt')
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={formInputClass}
      />
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useFieldId('sel')
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value as T)} className={formInputClass}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
      {label}
    </label>
  )
}

// ─── Carga de datos ────────────────────────────

export function useLoader<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await run())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}

// ─── Etiquetas ─────────────────────────────────

export const SESSION_LABELS: Record<string, string> = {
  ASIA: 'Asia',
  LONDON: 'Londres',
  NEW_YORK: 'Nueva York',
  OVERLAP: 'Londres/NY',
  OTHER: 'Otra',
}

export const EMOTION_LABELS: Record<string, string> = {
  CALM: 'Tranquilo',
  CONFIDENT: 'Confiado',
  ANXIOUS: 'Ansioso',
  FEARFUL: 'Con miedo',
  GREEDY: 'Codicioso',
  FRUSTRATED: 'Frustrado',
  EUPHORIC: 'Eufórico',
  BORED: 'Aburrido',
}

export const INCOME_SOURCE_LABELS: Record<string, string> = {
  TRADING: 'Trading propio',
  FUNDING: 'Empresas de fondeo',
  SALARY: 'Salario',
  BUSINESS: 'Negocio',
  OTHER: 'Otros ingresos',
}

export const FUNDING_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PASSED: 'Aprobada',
  FAILED: 'Fallida',
  PAUSED: 'Pausada',
}

export const FUNDING_PHASE_LABELS: Record<string, string> = {
  CHALLENGE: 'Challenge',
  VERIFICATION: 'Verificación',
  FUNDED: 'Fondeada',
}

export const PHILOSOPHY = 'Tú decides qué operar. Yo controlo cómo administras el riesgo y el dinero.'
