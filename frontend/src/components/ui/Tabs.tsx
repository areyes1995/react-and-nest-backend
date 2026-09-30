import type { ReactNode } from 'react'
import { cn } from '@lib/cn'

export interface TabItem<K extends string = string> {
  key: K
  label: ReactNode
  icon?: ReactNode
  count?: number
}

export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1', className)}>
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-[0.8rem]',
            value === t.key ? 'bg-brand-gradient text-white shadow' : 'text-ink-2 hover:bg-surface-3',
          )}
        >
          {t.icon}
          {t.label}
          {t.count != null && (
            <span className={cn('rounded-full px-1.5 text-[0.65rem]', value === t.key ? 'bg-white/25' : 'bg-surface-3')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
