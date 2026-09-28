// ──────────────────────────────────────────────
// SettingsModal — Minimal platform settings modal
// ──────────────────────────────────────────────

import { X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-scale-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <SettingItem icon="🎨" label="Theme" description="Light / Dark / System" />
          <SettingItem icon="🎨" label="Theme" description="Light / Dark / System" className="delay-0" />
          <SettingItem icon="🔔" label="Notifications" description="Email, push and in-app" className="delay-[30ms]" />
          <SettingItem icon="🌐" label="Language" description="English (US)" className="delay-[60ms]" />
          <SettingItem icon="🔒" label="Privacy" description="Security and data" className="delay-[90ms]" />
          <SettingItem icon="👤" label="Profile" description="Name, email and avatar" className="delay-[120ms]" />
          <SettingItem icon="📊" label="Preferences" description="Default views and filters" className="delay-[150ms]" />
        </div>

        <div className="border-t border-[var(--border)] pt-3 flex justify-end">
          <button
            className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-active)] rounded-lg transition"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingItem({ icon, label, description, className = '' }: { icon: string; label: string; description: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all duration-200 cursor-pointer group animate-fade-in ${className}`}>
      <span className="text-lg">{icon}</span>
      <div className="text-sm">
        <p className="text-[var(--text-primary)] font-medium">{label}</p>
        <p className="text-[var(--text-muted)] text-xs">{description}</p>
      </div>
    </div>
  )
}