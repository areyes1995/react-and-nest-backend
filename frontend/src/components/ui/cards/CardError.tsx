import { AlertTriangle } from 'lucide-react'

export interface CardErrorProps {
  message?: string
}

export default function CardError({ message }: CardErrorProps) {
  return (
    <div className="bg-[var(--bg-surface-soft)] border border-red-500/30 rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
      <p className="text-sm text-[var(--text-muted)]">
        {message ?? 'Ocurri\u00f3 un error. Intente nuevamente.'}
      </p>
    </div>
  )
}
