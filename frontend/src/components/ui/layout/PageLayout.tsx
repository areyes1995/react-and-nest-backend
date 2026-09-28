import type { ReactNode } from 'react'

interface PageLayoutProps {
  title?: string
  subtitle?: string
  controls?: ReactNode
  children: ReactNode
}

export default function PageLayout({ title, subtitle, controls, children }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {(title || subtitle) && (
          <div>
            {title && <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>}
            {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>}
          </div>
        )}
        {controls}
      </div>
      {children}
    </div>
  )
}
