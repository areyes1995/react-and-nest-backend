// ──────────────────────────────────────────────
// Asistente IA global ("Tu asistente docente siempre
// contigo"): panel lateral de chat con el Tutor
// Virtual que se abre sin cambiar de página.
// ──────────────────────────────────────────────

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface AssistantContextValue {
  isOpen: boolean
  prefill: string | null
  open: (prefill?: string) => void
  close: () => void
  consumePrefill: () => string | null
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<string | null>(null)

  const open = useCallback((text?: string) => {
    setPrefill(text ?? null)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const consumePrefill = useCallback(() => {
    const value = prefill
    setPrefill(null)
    return value
  }, [prefill])

  return (
    <AssistantContext.Provider value={{ isOpen, prefill, open, close, consumePrefill }}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext)
  if (!ctx) throw new Error('useAssistant debe usarse dentro de AssistantProvider')
  return ctx
}
