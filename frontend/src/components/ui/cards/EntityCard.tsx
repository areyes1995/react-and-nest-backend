// ──────────────────────────────────────────────
// EntityCard — shell genérico de card para entidades
// (Projects, Stands, ...). Unifica thumbnail h-40,
// badge de estado, contenido p-5, badges y footer.
// Los dominios solo adaptan datos a estas props.
// ──────────────────────────────────────────────

import type { ComponentType, ReactNode, SVGProps } from 'react'
import { ChevronRight } from 'lucide-react'
import StatusBadge, { type StatusTone } from './StatusBadge'

export interface EntityCardBadge {
  label: string
  title?: string
}

export interface EntityCardAction {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'muted' | 'blue' | 'red' | 'emerald' | 'gray'
}

interface EntityCardProps {
  title: string
  description: string
  statusLabel: string
  statusTone?: StatusTone
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badges?: EntityCardBadge[]
  topLeft?: ReactNode
  footerLeft: ReactNode
  footerMeta?: ReactNode
  actions?: EntityCardAction[]
  onClick: () => void
}

const actionTones: Record<NonNullable<EntityCardAction['tone']>, string> = {
  muted: 'text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-400/10',
  blue: 'text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-400/10',
  red: 'text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10',
  emerald: 'text-[var(--text-muted)] hover:text-emerald-300 hover:bg-emerald-500/10',
  gray: 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/15',
}

export default function EntityCard({
  title,
  description,
  statusLabel,
  statusTone = 'gray',
  icon: Icon,
  badges = [],
  topLeft,
  footerLeft,
  footerMeta,
  actions = [],
  onClick,
}: EntityCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick() }}
      className="bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] cursor-pointer h-full flex flex-col group outline-none focus:border-[var(--border-active)]"
      onClick={onClick}
    >
      <div className="relative h-40 bg-gradient-to-br from-[var(--bg-surface-soft)] to-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-[var(--text-muted)]" strokeWidth={1.5} />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge label={statusLabel} tone={statusTone} />
        </div>
        {topLeft && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {topLeft}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 min-h-0 gap-3">
        <div className="min-h-0 flex-1">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--text-primary)]/80 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {badges.map(b => (
              <span
                key={b.label}
                title={b.title ?? b.label}
                className="text-mini font-medium px-2 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)] max-w-full truncate"
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            {footerLeft}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {actions.map(a => (
              <button
                key={a.key}
                title={a.label}
                aria-label={a.label}
                disabled={a.disabled}
                onClick={a.onClick}
                className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${actionTones[a.tone ?? 'blue']}`}
              >
                {a.icon}
              </button>
            ))}
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
          </div>
        </div>

        {footerMeta && (
          <div className="flex items-center gap-3 text-mini text-[var(--text-muted)] pt-1">
            {footerMeta}
          </div>
        )}
      </div>
    </div>
  )
}
