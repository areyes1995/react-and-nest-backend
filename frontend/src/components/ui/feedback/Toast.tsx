// ──────────────────────────────────────────────
// Toast — banner inline success/error
// Reemplaza los divs duplicados en StandsView/ProjectsView.
// ──────────────────────────────────────────────

import { CheckCircle, XCircle } from 'lucide-react'

export interface ToastData {
  type: 'success' | 'error'
  message: string
}

export default function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null
  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`mx-4 lg:mx-6 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium ${
        toast.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}
    >
      {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="min-w-0 truncate">{toast.message}</span>
    </div>
  )
}
