// ──────────────────────────────────────────────
// MenuItem — Single menu item in the list
// Variants:
//   "default"  → bg-surface-soft hover:bg-surface  (title: text-primary)
//   "active"   → bg-surface border-active          (title: text-primary)
//   "subtle"   → no bg, hover:bg-surface-hover     (title: text-secondary)
// ──────────────────────────────────────────────

import { Pin, Tag, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

export interface MenuBadge {
  icon: ReactNode
  label: string
}

export interface MenuItemProps {
  title: string
  date?: string
  description?: string
  color?: string
  variant?: 'default' | 'active' | 'subtle'
  pinned?: boolean
  tags?: number
  badge?: MenuBadge
  onClick?: () => void
  onDelete?: () => void
}

const dotColors: Record<string, string> = {
  lime: 'bg-lime-400',
  orange: 'bg-orange-400',
  purple: 'bg-purple-400',
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  green: 'bg-green-400',
  amber: 'bg-amber-400',
}

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--bg-surface-soft)] hover:bg-[var(--bg-surface)] border border-transparent hover:shadow-lg hover:shadow-black/10',
  active: 'bg-[var(--bg-surface)] border border-[var(--border-active)] shadow-md shadow-black/20',
  subtle: 'hover:bg-[var(--bg-surface-hover)] border border-transparent',
}

const titleColors: Record<string, string> = {
  default: 'text-[var(--text-primary)]',
  active: 'text-[var(--text-primary)]',
  subtle: 'text-[var(--text-secondary)]',
}

export default function MenuItem({
  title,
  date,
  description,
  color,
  variant = 'default',
  pinned,
  tags,
  badge,
  onClick,
  onDelete,
}: MenuItemProps) {
  const isHex = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)
  const dotClass = isHex ? '' : (color ? dotColors[color] ?? '' : '')
  const vClasses = variantClasses[variant] ?? variantClasses.default
  const titleClass = titleColors[variant] ?? titleColors.default
  const hasDot = !!color
  const dotStyle = isHex ? { backgroundColor: color } : undefined

  return (
    <div
      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] ${vClasses} animate-fade-in`}
      onClick={onClick}
    >
      {/* Row 1: dot + title + icons */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {hasDot && (
            <span className={`w-2.5 h-2.5 rounded-full ${dotClass} shrink-0 ring-2 ring-[var(--border)]`} style={dotStyle} />
          )}
          <h4 className={`text-sm font-semibold ${titleClass} truncate`}>
            {title}
          </h4>
        </div>
        {(pinned || tags !== undefined || onDelete) && (
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] shrink-0 ml-2">
            {pinned && <Pin className="w-3.5 h-3.5" />}
            {tags !== undefined && <Tag className="w-3.5 h-3.5" />}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete?.() }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Row 2: description or date */}
      {description && (
        <p className={`text-xs text-[var(--text-muted)] ${hasDot ? 'pl-4' : 'mt-0.5'} ${badge ? 'mb-2' : ''} truncate`}>
          {description}
        </p>
      )}
      {!description && date && (
        <p className={`text-xs text-[var(--text-muted)] ${hasDot ? 'pl-4' : 'mt-0.5'}`}>
          {date}
        </p>
      )}

      {/* Row 3: optional badge */}
      {badge && (
        <div className={`${hasDot ? 'ml-4' : ''} inline-flex items-center gap-1.5 bg-[#2B2E36] px-2 py-0.5 rounded text-caption text-blue-400`}>
          {badge.icon}
          {badge.label}
        </div>
      )}
    </div>
  )
}