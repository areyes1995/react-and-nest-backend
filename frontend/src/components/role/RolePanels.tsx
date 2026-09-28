// ──────────────────────────────────────────────
// RolePanels — piezas reutilizables de los
// dashboards por rol (RF14): secciones, enlaces
// rápidos y listas con estados loading/empty.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

// ─── Sección de panel ───

interface RoleSectionProps {
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  children: ReactNode
}

export function RoleSection({ title, subtitle, actionLabel, actionTo, children }: RoleSectionProps) {
  return (
    <section className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
          >
            {actionLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Enlace rápido ───

interface QuickLinkProps {
  to: string
  icon: ReactNode
  title: string
  desc: string
}

export function QuickLink({ to, icon, title, desc }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-hover)] transition-colors"
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{title}</span>
        <span className="block text-xs text-[var(--text-muted)] truncate">{desc}</span>
      </span>
    </Link>
  )
}

// ─── Fila de lista ───

export interface SimpleRow {
  key: string
  primary: string
  secondary?: string
  meta?: string
  to?: string
}

interface SimpleListProps {
  rows: SimpleRow[]
  loading?: boolean
  emptyMessage: string
}

export function SimpleList({ rows, loading, emptyMessage }: SimpleListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 rounded-lg bg-[var(--bg-surface)] animate-pulse" />
        ))}
      </div>
    )
  }
  if (!rows.length) {
    return <p className="text-xs text-[var(--text-muted)] py-4 text-center">{emptyMessage}</p>
  }
  return (
    <ul className="divide-y divide-[var(--border)]">
      {rows.map(r => {
        const content = (
          <>
            <span className="min-w-0">
              <span className="block text-sm text-[var(--text-primary)] truncate">{r.primary}</span>
              {r.secondary && (
                <span className="block text-xs text-[var(--text-muted)] truncate">{r.secondary}</span>
              )}
            </span>
            {r.meta && (
              <span className="text-xs text-[var(--text-muted)] shrink-0 ml-3">{r.meta}</span>
            )}
          </>
        )
        return (
          <li key={r.key} className="py-2.5 first:pt-0 last:pb-0">
            {r.to ? (
              <Link to={r.to} className="flex items-center justify-between gap-3 hover:opacity-80 transition-opacity">
                {content}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ─── Cabecera de dashboard ───

interface RoleHeaderProps {
  title: string
  subtitle: string
  badge?: string
}

export function RoleHeader({ title, subtitle, badge }: RoleHeaderProps) {
  return (
    <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        </div>
        {badge && (
          <span className="ml-auto text-mini font-medium uppercase tracking-wide px-2 py-1 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20 shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
