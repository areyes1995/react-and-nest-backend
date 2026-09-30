import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@lib/cn'

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZES: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(1400px,96vw)] h-[92vh]',
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  size?: Size
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92vh] w-full animate-pop-in flex-col overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-pop',
          SIZES[size],
          className,
        )}
      >
        {(title || icon) && (
          <div className="flex items-start gap-3 border-b border-line px-5 py-4">
            {icon}
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-base font-bold">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
            </div>
            <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="scroll-area flex-1 px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-full animate-slide-in flex-col border-l border-line bg-surface shadow-pop sm:rounded-l-[1.5rem]',
          width,
        )}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-base font-bold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-area flex-1">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body,
  )
}
