// ──────────────────────────────────────────────
// AppBar — la barra de actividades del curso.
//
// Responde a una pregunta que la barra lateral no
// respondía bien: "¿qué puedo hacer aquí?". Agrupa
// los destinos por tipo de actividad — aprender,
// practicar, herramientas, progreso — y cada menú
// explica para qué sirve cada apartado antes de
// entrar, que es la mitad de no perderse.
//
// A la derecha van los indicadores permanentes:
// racha, XP, guardados, ayuda y notificaciones.
// ──────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, ChevronDown, CircleHelp, Crown, Flame, Home, Zap } from 'lucide-react'
import AnimatedNumber from '@components/content/AnimatedNumber'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { useAccess } from '@features/access/AccessContext'
import { useSavedItems } from '@features/saved'
import { useGuide } from '@features/guide'
import {
  APP_BAR_GROUPS,
  APP_BAR_HOME,
  activeGroupId,
  type AppBarGroup,
} from '@features/navigation/appbar.config'
import type { NavItem } from '@features/navigation/nav.config'
import NotificationsBell from '@components/notifications/NotificationBell'

/** Ancho del desplegable, en píxeles. */
const MENU_WIDTH = 310

/** Un item dentro del desplegable: icono, nombre y para qué sirve. */
function GroupMenuItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const { t } = useAppTranslation()
  const { hasFullAccess } = useAccess()
  const locked = item.premium && !hasFullAccess

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
        active ? 'bg-[var(--bg-surface)]' : 'hover:bg-[var(--bg-surface-soft)]'
      }`}
    >
      <span
        className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 transition-colors ${
          active
            ? 'text-[var(--poker-gold)]'
            : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
        }`}
        style={
          active
            ? { background: 'color-mix(in srgb, var(--poker-gold) 14%, transparent)' }
            : { background: 'var(--bg-surface-soft)' }
        }
      >
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-[var(--text-primary)] leading-tight">
          {t(item.label)}
          {locked && (
            <Crown className="w-3 h-3 text-[var(--poker-gold)]" strokeWidth={2} aria-label="De pago" />
          )}
        </span>
        {item.description && (
          <span className="block text-caption text-[var(--text-muted)] leading-snug mt-0.5">
            {t(item.description)}
          </span>
        )}
      </span>
    </Link>
  )
}

/**
 * Un menú de la barra: el botón y su desplegable.
 *
 * El panel se dibuja en un portal y no dentro del botón. La fila de menús
 * necesita `overflow-x-auto` para poder desplazarse en pantallas estrechas, y
 * ese contenedor recortaría cualquier desplegable colocado dentro de él.
 */
function GroupMenu({
  group,
  items,
  open,
  active,
  onToggle,
  onClose,
}: {
  group: AppBarGroup
  items: NavItem[]
  open: boolean
  active: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const { t } = useAppTranslation()
  const location = useLocation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  // El panel se ancla bajo el botón y se mantiene dentro de la ventana.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(8, rect.left), window.innerWidth - MENU_WIDTH - 8),
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-medium whitespace-nowrap transition-colors ${
          active || open
            ? 'text-[var(--text-primary)] bg-[var(--bg-surface)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
        }`}
      >
        <span className={active ? 'text-[var(--poker-gold)]' : ''}>{group.icon}</span>
        {t(group.label)}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {/* Subrayado del grupo activo: dice dónde estás sin abrir nada. */}
      {active && (
        <span
          className="absolute left-2.5 right-2.5 bottom-[-7px] h-[2px] rounded-full"
          style={{ background: 'var(--poker-gold)' }}
        />
      )}

      {open &&
        position &&
        createPortal(
          <div
            role="menu"
            data-appbar-menu
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[60] rounded-2xl border border-[var(--border-active)] bg-[var(--bg-panel)] shadow-2xl p-2 animate-fade-in"
          >
            <p className="px-3 pt-1.5 pb-2 text-caption text-[var(--text-muted)] leading-snug">
              {t(group.description)}
            </p>
            <div className="space-y-0.5">
              {items.map(item => (
                <GroupMenuItem
                  key={item.slug}
                  item={item}
                  active={
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
                  }
                  onNavigate={onClose}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default function AppBar() {
  const { user } = useAuth()
  const { t } = useAppTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { progress, level } = useStudentProgress()
  const { items: saved } = useSavedItems()
  const { startTour } = useGuide()

  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Cerrar al pulsar fuera o con Escape: un menú abierto que tapa la página es
  // justo lo que desorienta.
  useEffect(() => {
    if (!openGroup) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // El panel vive en un portal fuera de la barra: hay que reconocerlo aparte.
      if (barRef.current?.contains(target) || target.closest('[data-appbar-menu]')) return
      setOpenGroup(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenGroup(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openGroup])

  // Navegar cierra el menú.
  useEffect(() => setOpenGroup(null), [location.pathname])

  const visible = (permission?: string) => !permission || hasPermission(user, permission)

  const groups = APP_BAR_GROUPS.map(group => ({
    group,
    items: group.items.filter(item => visible(item.permission)),
  })).filter(entry => visible(entry.group.permission) && entry.items.length > 0)

  const currentGroup = activeGroupId(location.pathname)
  const isHome = location.pathname === APP_BAR_HOME.path
  const isSaved = location.pathname === '/app/saved'

  return (
    <div
      ref={barRef}
      data-tour="appbar"
      className="flex items-center gap-2 px-3 lg:px-5 h-[3.25rem] border-b border-[var(--border)] bg-[var(--bg-main)] shrink-0 relative z-30"
    >
      {/* ── Actividades del curso ── */}
      <nav
        aria-label={t('appbar.aria')}
        className="flex items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-none"
      >
        <button
          type="button"
          onClick={() => navigate(APP_BAR_HOME.path)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-medium whitespace-nowrap transition-colors relative ${
            isHome
              ? 'text-[var(--text-primary)] bg-[var(--bg-surface)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
          }`}
        >
          <Home className={`w-4 h-4 ${isHome ? 'text-[var(--poker-gold)]' : ''}`} strokeWidth={1.5} />
          <span className="hidden sm:inline">{t(APP_BAR_HOME.label)}</span>
          {isHome && (
            <span
              className="absolute left-2.5 right-2.5 -bottom-[0.4375rem] h-[2px] rounded-full"
              style={{ background: 'var(--poker-gold)' }}
            />
          )}
        </button>

        <span className="w-px h-5 bg-[var(--border)] mx-1 shrink-0" />

        {groups.map(({ group, items }) => (
          <GroupMenu
            key={group.id}
            group={group}
            items={items}
            open={openGroup === group.id}
            active={currentGroup === group.id}
            onToggle={() => setOpenGroup(current => (current === group.id ? null : group.id))}
            onClose={() => setOpenGroup(null)}
          />
        ))}
      </nav>

      {/* ── Indicadores permanentes ── */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <Link
          to="/app/progress"
          title={t('appbar.streakTitle')}
          className="hidden 2xl:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-soft)] hover:border-[var(--border-active)] transition"
        >
          <span className="flex items-center gap-1 text-caption font-semibold text-[var(--text-primary)] tabular-nums">
            <Flame className={`w-3.5 h-3.5 text-orange-400 ${progress.streak > 0 ? 'animate-flame' : ''}`} strokeWidth={2} />
            {progress.streak}
          </span>
          <span className="w-px h-3 bg-[var(--border-active)]" />
          <span className="flex items-center gap-1 text-caption font-semibold text-[var(--text-primary)] tabular-nums">
            <Zap key={progress.xp} className="w-3.5 h-3.5 text-[var(--poker-gold)] animate-bump" strokeWidth={2} />
            <AnimatedNumber value={progress.xp} />
          </span>
          <span className="w-px h-3 bg-[var(--border-active)]" />
          <span className="text-caption text-[var(--text-muted)] whitespace-nowrap">
            {t('appbar.level')} {level.level}
          </span>
        </Link>

        {/* Acceso directo a la biblioteca personal: es la otra mitad del botón
            de guardar, y sin esto lo guardado no se encuentra. */}
        <Link
          to="/app/saved"
          title={t('nav.saved')}
          aria-label={t('nav.saved')}
          className={`relative p-2 rounded-lg transition hover:bg-[var(--bg-surface)] ${
            isSaved
              ? 'text-[var(--poker-gold)] bg-[var(--bg-surface)]'
              : 'text-[var(--text-muted)] hover:text-[var(--poker-gold)]'
          }`}
        >
          <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} strokeWidth={1.5} />
          {saved.length > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[0.9375rem] h-[0.9375rem] px-1 rounded-full text-micro font-bold text-black tabular-nums"
              style={{ background: 'var(--poker-gold)' }}
            >
              {saved.length > 99 ? '99+' : saved.length}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={startTour}
          title={t('appbar.replayTour')}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--poker-gold)] hover:bg-[var(--bg-surface)] transition"
        >
          <CircleHelp className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <NotificationsBell />
      </div>
    </div>
  )
}
