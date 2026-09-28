// ──────────────────────────────────────────────
// FormAlert — banner inline para forms (error/info/success)
// Reemplaza los divs custom duplicados en cada modal.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { TriangleAlert, Info, CheckCircle2 } from 'lucide-react'

type Variant = 'error' | 'info' | 'success'

const STYLES: Record<Variant, { box: string; icon: typeof Info }> = {
  error: {
    box: 'bg-red-500/10 border-red-500/30 text-red-300',
    icon: TriangleAlert,
  },
  info: {
    box: 'bg-blue-500/10 border-blue-500/20 text-[var(--text-muted)]',
    icon: Info,
  },
  success: {
    box: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    icon: CheckCircle2,
  },
}

interface FormAlertProps {
  variant?: Variant
  children: ReactNode
  icon?: ReactNode
}

export function FormAlert({ variant = 'error', children, icon }: FormAlertProps) {
  const { box, icon: Fallback } = STYLES[variant]
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs leading-relaxed ${box}`}>
      <span className="flex-shrink-0 mt-0.5">{icon ?? <Fallback className="w-4 h-4" />}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
