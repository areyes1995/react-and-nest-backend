// ──────────────────────────────────────────────
// UserProfile — Bottom sidebar user card + menu
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Repeat, LogOut, Settings, UserRound } from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface UserProfileProps {
  name: string
  subtitle?: string
  avatarUrl?: string
  status?: 'online' | 'busy' | 'away'
  onLogout?: () => void
  onSettings?: () => void
}

const statusColor: Record<string, string> = {
  online: 'bg-emerald-500',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

export default function UserProfile({
  name,
  subtitle,
  avatarUrl,
  status = 'online',
  onLogout,
  onSettings,
}: UserProfileProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useAppTranslation()

  return (
    <div className="relative pt-4 border-t border-[var(--border)]">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#f2a93b]/30 transition-all duration-300"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] ring-2 ring-transparent group-hover:ring-[#f2a93b]/30 transition-all duration-300">
                <UserRound className="w-5 h-5" />
              </div>
            )}
            <span
              className={`w-2.5 h-2.5 ${statusColor[status]} border-2 border-[var(--bg-main)] rounded-full absolute bottom-0 right-0 animate-pulse-dot`}
            />
          </div>
          <div className="text-xs min-w-0">
            {subtitle && <p className="text-[var(--text-muted)] truncate">{subtitle}</p>}
            <p className="font-semibold text-[var(--text-primary)] truncate mt-1">{name}</p>
            
          </div>
        </div>
        <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition group-hover:rotate-45 duration-300">
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-40 bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-slide-up">
            {onSettings && (
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all duration-150 group"
                onClick={() => { setMenuOpen(false); onSettings() }}
              >
                <Settings className="w-4 h-4 transition-transform duration-150 group-hover:rotate-12" />
                {t('Settings')}
              </button>
            )}
            {onLogout && (
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[var(--bg-surface)] hover:text-red-300 transition border-t border-[var(--border)]"
                onClick={() => { setMenuOpen(false); onLogout() }}
              >
                <LogOut className="w-4 h-4" />
                {t('Log out')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}