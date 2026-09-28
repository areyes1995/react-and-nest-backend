import { RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-[var(--text-muted)]">
      <p className="text-sm">{message}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-active)] transition-colors text-[var(--text-primary)]"
        >
          <RefreshCw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
