import { useEffect, useId, useRef, type RefObject, type ReactNode } from 'react'
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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function useDialogA11y(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const titleId = useId()
  const descId = useId()
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const container = ref.current
    const focusables = () =>
      container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => !el.hasAttribute('hidden') && el.getClientRects().length > 0,
          )
        : []

    const frame = requestAnimationFrame(() => {
      const [first] = focusables()
      ;(first ?? container)?.focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !container) return
      const items = focusables()
      if (!items.length) {
        e.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [open, ref])

  return { titleId, descId }
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const { titleId, descId } = useDialogA11y(open, onClose, dialogRef)
  if (!open) return null
  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Ventana de diálogo'}
      aria-describedby={subtitle ? descId : undefined}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 outline-none sm:p-6"
    >
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
              {title && <h2 id={titleId} className="text-base font-bold">{title}</h2>}
              {subtitle && <p id={descId} className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
            </div>
            <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="scroll-area min-w-0 flex-1 px-5 py-4">{children}</div>
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const { titleId, descId } = useDialogA11y(open, onClose, dialogRef)
  if (!open) return null
  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Panel lateral'}
      aria-describedby={subtitle ? descId : undefined}
      className="fixed inset-0 z-[70] outline-none"
    >
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
            {title && <h2 id={titleId} className="text-base font-bold">{title}</h2>}
            {subtitle && <p id={descId} className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-area min-w-0 flex-1">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body,
  )
}
