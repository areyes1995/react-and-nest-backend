import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleHelp,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useTheme } from '@context/ThemeContext'
import { useAssistant } from '@context/AssistantContext'
import { useFeedback } from '@context/ToastContext'
import { notificationApi, teacherApi } from '@services/educraft'
import type { Notification, TeacherProfile } from '@services/types'
import { Avatar, Latex, Modal, Popover, Toggle } from '@components/ui'
import { cn } from '@lib/cn'
import { relativeTime } from '@lib/format'

// ── Notificaciones ─────────────────────────────

export function NotificationsMenu() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try {
      const res = await notificationApi.list(1, 8)
      setItems(res.items)
      setUnread(res.unreadCount)
    } catch {
      // sin notificaciones
    }
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 60_000)
    return () => clearInterval(id)
  }, [])

  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => undefined)
    setItems((list) => list.map((n) => ({ ...n, isRead: true })))
    setUnread(0)
  }

  const open = async (n: Notification, close: () => void) => {
    if (!n.isRead) {
      await notificationApi.markRead(n.id).catch(() => undefined)
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
    }
    close()
    if (n.link) navigate(n.link)
  }

  return (
    <Popover
      width="w-[22rem]"
      trigger={({ toggle }) => (
        <button className="icon-btn relative" onClick={toggle} aria-label="Notificaciones">
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-brand-pink px-1 text-[0.62rem] font-bold text-white ring-2 ring-surface">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Notificaciones</p>
            <button onClick={markAll} className="text-xs font-semibold text-sky-500 hover:underline disabled:opacity-40" disabled={!unread}>
              Marcar todo como leído
            </button>
          </div>
          <div className="max-h-96 divide-y divide-[var(--border)] overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-xs text-ink-3">No tienes notificaciones.</p>}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n, close)}
                className={cn(
                  'block w-full px-4 py-3 text-left transition hover:brightness-[0.98]',
                  n.type === 'ERROR' || n.type === 'WARNING' ? 'bg-soft-pink' : 'bg-surface',
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-pink" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-ink">{n.title}</p>
                    {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">{n.message}</p>}
                    <p className="mt-1 text-[0.68rem] text-ink-3">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              close()
              navigate('/app/notificaciones')
            }}
            className="block w-full border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-brand-purple hover:bg-surface-3"
          >
            Ver todas
          </button>
        </div>
      )}
    </Popover>
  )
}

// ── Mensajes / compartir ───────────────────────

export function MessagesMenu() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'messages' | 'shared'>('messages')
  return (
    <Popover
      width="w-80"
      trigger={({ toggle }) => (
        <button className="icon-btn" onClick={toggle} aria-label="Mensajes y elementos compartidos">
          <MessageCircle className="h-[1.15rem] w-[1.15rem]" />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex gap-1 border-b border-line p-2">
            {(['messages', 'shared'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold', tab === t ? 'bg-soft-purple text-brand-purple' : 'text-ink-2 hover:bg-surface-3')}
              >
                {t === 'messages' ? 'Mensajes' : 'Elementos compartidos'}
              </button>
            ))}
          </div>
          <div className="px-4 py-6 text-center">
            <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-soft-purple text-brand-purple">
              {tab === 'messages' ? <MessageCircle className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </div>
            <p className="text-sm font-semibold text-ink">
              {tab === 'messages' ? 'Sin conversaciones todavía' : 'Nada compartido contigo aún'}
            </p>
            <p className="mt-1 text-xs text-ink-3">
              {tab === 'messages'
                ? 'La mensajería con coordinación y colegas aparecerá aquí.'
                : 'Las programaciones y recursos que compartan contigo aparecerán aquí.'}
            </p>
          </div>
          <div className="border-t border-line p-3">
            <button
              onClick={() => {
                close()
                navigate('/app/planificacion?tab=programaciones')
              }}
              className="btn w-full bg-brand-purple text-white hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Compartir una nueva programación o recurso
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

// ── Ayuda ──────────────────────────────────────

const LATEX_GUIDE: Array<[string, string]> = [
  ['Fracción', '\\frac{a}{b}'],
  ['Potencia', 'x^{2}'],
  ['Raíz', '\\sqrt{x}'],
  ['Raíz n-ésima', '\\sqrt[3]{x}'],
  ['Subíndice', 'a_{1}'],
  ['Sumatoria', '\\sum_{i=1}^{n} i'],
  ['Integral', '\\int_{0}^{1} x\\,dx'],
  ['Límite', '\\lim_{x \\to 0} \\frac{\\sin x}{x}'],
  ['Matriz', '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}'],
  ['Vector', '\\vec{v}'],
  ['Sistema', '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}'],
  ['Griegas', '\\alpha, \\beta, \\pi, \\Delta'],
]

const PROMPTS = [
  '¿Cómo enseñar funciones cuadráticas a 3° de secundaria?',
  'Dame una actividad para segundo grado sobre números reales.',
  'Explícame el error frecuente al sumar fracciones.',
  'Crea una rúbrica para resolución de problemas con Pitágoras.',
  'Resuelve paso a paso 3(x - 2) = x + 4',
  'Sugiere una pausa activa matemática de 3 minutos.',
]

export function HelpMenu() {
  const assistant = useAssistant()
  const [filter, setFilter] = useState('')
  const [guide, setGuide] = useState<'latex' | 'prompts' | null>(null)
  const links = [
    { key: 'latex' as const, icon: <BookOpen className="h-4 w-4" />, label: 'Guía del Editor de Ecuaciones (LaTeX)', emoji: '📖' },
    { key: 'prompts' as const, icon: <Sparkles className="h-4 w-4" />, label: 'Prompts efectivos para el Tutor Virtual', emoji: '🤖' },
    { key: 'support' as const, icon: <LifeBuoy className="h-4 w-4" />, label: 'Contactar a Soporte', emoji: '💬' },
  ].filter((l) => l.label.toLowerCase().includes(filter.toLowerCase()))

  return (
    <>
      <Popover
        width="w-80"
        trigger={({ toggle }) => (
          <button className="icon-btn" onClick={toggle} aria-label="Ayuda">
            <CircleHelp className="h-[1.15rem] w-[1.15rem]" />
          </button>
        )}
      >
        {(close) => (
          <div className="p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} className="input pl-9" placeholder="¿Cómo te ayudamos hoy?" />
            </div>
            <ul className="space-y-0.5">
              {links.map((l) => (
                <li key={l.key}>
                  <button
                    onClick={() => {
                      close()
                      if (l.key === 'support') window.location.href = 'mailto:soporte@educraft.app?subject=Soporte%20Educraft%20XYZ'
                      else setGuide(l.key)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-surface-3 hover:text-ink"
                  >
                    <span>{l.emoji}</span> {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Popover>

      <Modal open={guide === 'latex'} onClose={() => setGuide(null)} title="Guía del Editor de Ecuaciones (LaTeX)" size="lg">
        <p className="mb-3 text-sm text-ink-2">
          Escribe fórmulas en el editor LaTeX de Herramientas o en las presentaciones usando estas expresiones. En los textos puedes encerrarlas entre <span className="kbd">$…$</span>.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LATEX_GUIDE.map(([label, code]) => (
            <div key={label} className="rounded-xl border border-line p-3">
              <p className="text-xs font-bold text-ink-3">{label}</p>
              <code className="mt-1 block truncate text-xs text-brand-purple">{code}</code>
              <div className="mt-2">
                <Latex>{code}</Latex>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={guide === 'prompts'} onClose={() => setGuide(null)} title="Prompts efectivos para el Tutor Virtual" size="md">
        <p className="mb-3 text-sm text-ink-2">
          Sé específico: indica el grado, el tema y lo que necesitas (actividad, rúbrica, explicación). Haz clic para enviarlo al tutor.
        </p>
        <div className="space-y-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setGuide(null)
                assistant.open(p)
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-left text-sm text-ink-2 hover:border-violet-300 hover:bg-surface-2"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-brand-pink" /> {p}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}

// ── Menú de usuario ────────────────────────────

export function UserMenu({ profile, onProfileChange }: { profile: TeacherProfile | null; onProfileChange: (p: TeacherProfile) => void }) {
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const { success, error } = useFeedback()
  const navigate = useNavigate()
  const name = profile ? `${profile.firstName}` : user?.firstName ?? user?.name ?? ''
  const title = profile?.teacherProfile.displayTitle ?? 'Prof.'
  const sync = profile?.teacherProfile.googleCalendarSync ?? false

  const toggleSync = async (value: boolean) => {
    try {
      const updated = await teacherApi.updateProfile({ googleCalendarSync: value })
      onProfileChange(updated)
      success(value ? 'Sincronización activada' : 'Sincronización desactivada', value ? 'Exporta o suscribe tu agenda desde Calendario (.ics).' : undefined)
    } catch (err) {
      error('No se pudo actualizar', (err as Error).message)
    }
  }

  return (
    <Popover
      width="w-72"
      trigger={({ toggle }) => (
        <button onClick={toggle} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 shadow-card transition hover:bg-surface-2">
          <Avatar name={user?.name ?? 'Docente'} src={profile?.teacherProfile.avatarUrl} size={34} />
          <span className="hidden text-sm font-semibold text-ink sm:inline">¡Hola, {name}! 👋</span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-pink-50 to-violet-50 p-4 dark:from-pink-950/30 dark:to-violet-950/30">
            <Avatar name={user?.name ?? 'Docente'} src={profile?.teacherProfile.avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {title} {name}
              </p>
              <p className="truncate text-xs text-ink-3">{profile?.teacherProfile.specialty ?? 'Docente de Matemática'}</p>
            </div>
          </div>
          <div className="space-y-0.5 p-2">
            <MenuItem icon={<UserRound className="h-4 w-4" />} label="Mi Perfil y Firma Digital" onClick={() => { close(); navigate('/app/ajustes?tab=perfil') }} />
            <MenuItem icon={<Settings className="h-4 w-4" />} label="Configuración del Año Escolar" onClick={() => { close(); navigate('/app/ajustes?tab=anio') }} />
            <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-2">
              <span className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4" /> Google Calendar
              </span>
              <Toggle checked={sync} onChange={toggleSync} />
            </div>
            <MenuItem
              icon={resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              label={resolvedTheme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            />
          </div>
          <div className="border-t border-line p-2">
            <button
              onClick={async () => {
                close()
                await logout()
                navigate('/login', { replace: true })
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 hover:bg-soft-red"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-3 hover:text-ink">
      {icon} {label}
    </button>
  )
}
