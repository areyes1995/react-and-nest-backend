import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
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
  idBase,
  ariaLabel = 'Secciones',
}: {
  items: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  className?: string
  idBase?: string
  ariaLabel?: string
}) {
  const generatedId = useId()
  const base = idBase ?? generatedId
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!items.length) return
    let next: number | null = null
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next == null) return
    e.preventDefault()
    onChange(items[next].key)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1', className)}
    >
      {items.map((t, i) => (
        <button
          key={t.key}
          ref={(el) => {
            buttons.current[i] = el
          }}
          type="button"
          role="tab"
          id={`${base}-tab-${t.key}`}
          aria-controls={`${base}-panel-${t.key}`}
          aria-selected={value === t.key}
          tabIndex={value === t.key ? 0 : -1}
          onKeyDown={(e) => onKeyDown(e, i)}
          onClick={() => onChange(t.key)}
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-[0.8rem]',
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

export function TabPanel({
  idBase,
  value,
  active,
  children,
  className,
}: {
  idBase: string
  value: string
  active: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${value}`}
      aria-labelledby={`${idBase}-tab-${value}`}
      hidden={active !== value}
      className={cn('min-w-0', className)}
    >
      {children}
    </div>
  )
}
