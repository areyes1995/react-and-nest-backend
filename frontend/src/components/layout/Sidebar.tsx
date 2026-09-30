import { NavLink } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useAssistant } from '@context/AssistantContext'
import { hasPermission, isAdminUser } from '@services/auth'
import { Logo } from '@components/brand/Logo'
import { Robot } from '@components/brand/Illustrations'
import { Avatar } from '@components/ui'
import { cn } from '@lib/cn'
import { NAV_ITEMS } from './nav'

export function Sidebar({ onNavigate, profile }: { onNavigate?: () => void; profile?: { title?: string | null; specialty?: string; avatarUrl?: string | null } }) {
  const { user } = useAuth()
  const assistant = useAssistant()
  const items = NAV_ITEMS.filter((item) =>
    item.adminOnly ? isAdminUser(user) : !item.permission || isAdminUser(user) || hasPermission(user, item.permission),
  )
  const firstName = user?.firstName ?? user?.name ?? ''

  return (
    <aside className="flex h-full w-64 flex-col gap-3 bg-surface px-3 py-4 sm:rounded-[1.75rem] sm:border sm:border-line sm:shadow-card">
      <div className="px-2 pb-1 pt-1">
        <Logo />
      </div>

      <nav className="scroll-area -mx-1 flex-1 px-1">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-brand-gradient text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)]'
                      : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-7 w-7 place-items-center rounded-lg', isActive ? 'bg-white/20' : 'bg-surface-3 text-ink-2 group-hover:text-brand-purple')}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronRight className={cn('h-4 w-4 opacity-60', isActive ? 'text-white' : 'text-ink-3')} />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 p-4 dark:from-violet-950/60 dark:via-fuchsia-950/40 dark:to-pink-950/40">
        <p className="relative z-[1] max-w-[8.5rem] text-sm font-bold leading-snug text-violet-950 dark:text-violet-100">
          Tu asistente docente siempre contigo
        </p>
        <button
          type="button"
          onClick={() => assistant.open()}
          className="relative z-[1] mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm transition hover:shadow dark:bg-violet-900 dark:text-violet-100"
        >
          Hablar con IA <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <Robot size={84} className="absolute -bottom-2 -right-2" />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-2.5">
        <Avatar name={user?.name ?? 'Docente'} src={profile?.avatarUrl} size={38} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {profile?.title ?? 'Prof.'} {firstName}
          </p>
          <p className="truncate text-xs text-ink-3">{profile?.specialty ?? 'Docente de Matemática'}</p>
        </div>
      </div>
    </aside>
  )
}
