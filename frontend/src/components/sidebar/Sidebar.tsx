// ──────────────────────────────────────────────
// Sidebar — Left navigation panel
// Admite una cabecera de marca y un widget de pie
// (racha / XP) porque en una plataforma de
// aprendizaje el progreso debe estar siempre a la
// vista, no escondido en una pestaña.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import SidebarSection, { type SidebarSectionProps } from './SidebarSection'
import UserProfile, { type UserProfileProps } from './UserProfile'

export interface SidebarProps {
  sections: SidebarSectionProps[]
  user: UserProfileProps
  /** Cabecera de marca sobre la navegación. */
  header?: ReactNode
  /** Widget sobre el perfil (racha, XP, nivel). */
  footer?: ReactNode
  onLogout?: () => void
  onSettings?: () => void
}

export default function Sidebar({
  sections,
  user,
  header,
  footer,
  onLogout,
  onSettings,
}: SidebarProps) {
  return (
    <aside className="w-60 h-full bg-[var(--bg-main)] border-r border-[var(--border)] flex flex-col justify-between p-4 shrink-0 select-none">
      <div className="min-h-0 flex flex-col gap-4">
        {header}
        <div className="space-y-5 overflow-y-auto pr-1 min-h-0">
          {sections.map((section, idx) => (
            <SidebarSection
              key={idx}
              title={section.title}
              items={section.items}
              dropdown={section.dropdown}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 shrink-0">
        {footer}
        <UserProfile
          name={user.name}
          subtitle={user.subtitle}
          avatarUrl={user.avatarUrl}
          status={user.status}
          onLogout={onLogout}
          onSettings={onSettings}
        />
      </div>
    </aside>
  )
}
