import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { cn } from '@lib/cn'
import { Button } from './Button'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-ink-3', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
      {label}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-3', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-soft-purple text-brand-purple">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-soft-red text-brand-red">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="max-w-md text-sm text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className={cn('shrink-0 rounded-full object-cover', className)} />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn('grid shrink-0 place-items-center rounded-full bg-brand-gradient font-bold text-white', className)}
    >
      {initials || '?'}
    </span>
  )
}

export function Stat({
  label,
  value,
  hint,
  icon,
  onClick,
  tone,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  onClick?: () => void
  tone?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-3 text-left transition',
        onClick && 'hover:-translate-y-0.5 hover:shadow-card',
      )}
    >
      <span className="text-xs font-semibold text-ink-3">{label}</span>
      <span className="flex items-center gap-2">
        {icon}
        <span className={cn('text-2xl font-extrabold', tone)}>{value}</span>
      </span>
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
    </Tag>
  )
}
