export interface ActivityEntry {
  timestamp: string
  event: string
  user?: string
  status?: 'success' | 'info' | 'error'
  detail?: string
}

interface ActivityFeedProps {
  entries: ActivityEntry[]
}

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  const statusColors = {
    success: 'text-emerald-400',
    info: 'text-blue-400',
    error: 'text-red-400',
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-none">
          <span className="text-xs text-[var(--text-muted)] w-24 shrink-0">{entry.timestamp}</span>
          <span className="text-sm text-[var(--text-primary)]">{entry.event}</span>
          {entry.user && <span className="text-xs text-[var(--text-muted)] ml-auto">{entry.user}</span>}
          {entry.status && <span className={`text-xs ${statusColors[entry.status]}`}>{entry.detail}</span>}
        </div>
      ))}
    </div>
  )
}
