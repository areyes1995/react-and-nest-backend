// ──────────────────────────────────────────────
// Toasts y confirmaciones globales.
// ──────────────────────────────────────────────

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { Modal } from '@components/ui/Modal'
import { Button } from '@components/ui/Button'
import { cn } from '@lib/cn'

type ToastKind = 'success' | 'error' | 'info' | 'warning'
interface Toast {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  danger?: boolean
}

interface FeedbackContextValue {
  toast: (kind: ToastKind, title: string, description?: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-brand-green" />,
  error: <XCircle className="h-5 w-5 text-brand-red" />,
  info: <Info className="h-5 w-5 text-brand-blue" />,
  warning: <TriangleAlert className="h-5 w-5 text-brand-orange" />,
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++counter.current
      setToasts((t) => [...t.slice(-3), { id, kind, title, description }])
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  )

  const close = (value: boolean) => {
    confirmState?.resolve(value)
    setConfirmState(null)
  }

  const value: FeedbackContextValue = {
    toast,
    success: (t, d) => toast('success', t, d),
    error: (t, d) => toast('error', t, d),
    confirm,
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-2xl border border-line bg-surface p-3 shadow-pop"
            >
              {ICONS[t.kind]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-ink-3">{t.description}</p>}
              </div>
              <button className="text-ink-3 hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
      <Modal
        open={!!confirmState}
        onClose={() => close(false)}
        size="sm"
        title={confirmState?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button
              variant={confirmState?.danger ? 'danger' : 'primary'}
              className={cn(confirmState?.danger && 'font-bold')}
              onClick={() => close(true)}
            >
              {confirmState?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="text-sm text-ink-2">{confirmState?.description}</div>
      </Modal>
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback debe usarse dentro de FeedbackProvider')
  return ctx
}
