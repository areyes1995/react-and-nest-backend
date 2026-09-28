// ──────────────────────────────────────────────
// useAcademyNav — barra lateral y panel contextual.
// La barra es fija; el panel del medio cambia según
// dónde estés: el temario del curso, las categorías
// de artículos, las playlists de video o los
// presets de la mesa. Así el detalle no compite con
// la navegación principal.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Clock, GraduationCap, Layers, Users, Zap } from 'lucide-react'
import type { MenuItemProps } from '@components/menu/MenuItem'
import type { SidebarSectionProps } from '@components/sidebar/SidebarSection'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useStudentProgress } from '@features/progress/ProgressContext'
import {
  courseProgress,
  levelProgress,
} from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { courseMinutes } from '@features/academy/types'
import { ARTICLES, ARTICLE_CATEGORIES } from '@features/articles/data'
import { PLAYLISTS, VIDEOS } from '@features/videos/data'
import { NAV_SECTIONS, PRIMARY_NAV } from './nav.config'

const MENU_COLLAPSED_KEY = 'poker_menu_collapsed'

export interface AcademyNav {
  sidebarSections: SidebarSectionProps[]
  menuTitle: string
  menuItems: MenuItemProps[]
  menuCollapsed: boolean
  setMenuCollapsed: (collapsed: boolean) => void
  /** True cuando la ruta actual la gestiona el módulo dinámico de records. */
  isRecordsRoute: boolean
}

/** Presets de mesa ofrecidos en el panel contextual de la práctica. */
const TABLE_PRESETS = [
  { seats: 2, title: 'Heads-up', description: 'Uno contra uno: máxima agresión y muchas manos jugables.' },
  { seats: 3, title: 'Mesa corta (3)', description: 'Las ciegas llegan constantemente. Ideal para practicar 3-bets.' },
  { seats: 6, title: '6-max', description: 'El formato estándar. Equilibrio entre acción y estructura.' },
  { seats: 9, title: 'Mesa completa (9)', description: 'Nueve jugadores: la posición pesa más que nunca.' },
]

export function useAcademyNav(): AcademyNav {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useAppTranslation()
  const { progress } = useStudentProgress()

  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(
    () => localStorage.getItem(MENU_COLLAPSED_KEY) === 'true',
  )

  useEffect(() => {
    localStorage.setItem(MENU_COLLAPSED_KEY, String(menuCollapsed))
  }, [menuCollapsed])

  const path = location.pathname
  const segments = path.split('/').filter(Boolean)
  const section = segments[1] ?? 'home'

  const go = useCallback(
    (to: string) => {
      if (to !== path) navigate(to)
    },
    [navigate, path],
  )

  // ── Barra lateral ──
  const sidebarSections = useMemo<SidebarSectionProps[]>(() => {
    const isActive = (item: { path: string; matchPrefix?: boolean }) =>
      item.matchPrefix ? path.startsWith(item.path) : path === item.path

    const visible = (permission?: string) => !permission || hasPermission(user, permission)

    const primary = {
      title: '',
      items: PRIMARY_NAV.filter(item => visible(item.permission)).map(item => ({
        icon: item.icon,
        label: item.label,
        active: isActive(item),
        onClick: () => go(item.path),
      })),
    }

    const sections = NAV_SECTIONS.map(navSection => ({
      title: navSection.title,
      items: navSection.items
        .filter(item => visible(item.permission))
        .map(item => ({
          icon: item.icon,
          label: item.label,
          active: isActive(item),
          onClick: () => go(item.path),
        })),
    })).filter(navSection => navSection.items.length > 0)

    return [primary, ...sections]
  }, [path, user, go])

  // ── Panel contextual ──
  const { levels: LEVELS, findCourse } = useCurriculum()
  const { menuTitle, menuItems } = useMemo<{ menuTitle: string; menuItems: MenuItemProps[] }>(() => {
    const completed = progress.lessons

    // Clases: temario del curso abierto, o catálogo por nivel.
    if (section === 'classes') {
      const course = segments[2] ? findCourse(segments[2]) : undefined
      if (course) {
        return {
          menuTitle: course.title,
          menuItems: course.lessons.map(lesson => ({
            title: lesson.title,
            description: lesson.summary,
            variant: (segments[3] === lesson.slug ? 'active' : 'default') as MenuItemProps['variant'],
            badge: {
              icon: completed[lesson.id] ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />,
              label: completed[lesson.id] ? 'Completada' : `${lesson.minutes} min · ${lesson.xp} XP`,
            },
            onClick: () => go(`/app/classes/${course.slug}/${lesson.slug}`),
          })),
        }
      }

      return {
        menuTitle: t('nav.classes'),
        menuItems: LEVELS.map(level => {
          const stats = levelProgress(level, completed)
          return {
            title: level.title,
            description: level.description,
            variant: 'default' as const,
            badge: {
              icon: <GraduationCap className="w-3 h-3" />,
              label: `${stats.done}/${stats.total} clases`,
            },
            onClick: () => go(`/app/classes?nivel=${level.id}`),
          }
        }),
      }
    }

    // Ruta de aprendizaje: progreso por nivel.
    if (section === 'learn') {
      return {
        menuTitle: t('nav.path'),
        menuItems: LEVELS.map(level => {
          const stats = levelProgress(level, completed)
          return {
            title: `${level.title} — ${level.subtitle}`,
            description: level.description,
            variant: 'default' as const,
            badge: {
              icon: <Layers className="w-3 h-3" />,
              label: `${Math.round(stats.ratio * 100)}% completado`,
            },
            onClick: () => go(`/app/classes?nivel=${level.id}`),
          }
        }),
      }
    }

    // Artículos: categorías con su recuento.
    if (section === 'articles') {
      return {
        menuTitle: t('nav.articles'),
        menuItems: ARTICLE_CATEGORIES.map(category => ({
          title: category.label,
          description: `${ARTICLES.filter(a => a.category === category.id).length} artículos`,
          variant: 'default' as const,
          onClick: () => go(`/app/articles?categoria=${category.id}`),
        })),
      }
    }

    // Videos: playlists.
    if (section === 'videos') {
      return {
        menuTitle: t('nav.videos'),
        menuItems: PLAYLISTS.map(playlist => ({
          title: playlist.title,
          description: playlist.description,
          variant: 'default' as const,
          badge: {
            icon: <BookOpen className="w-3 h-3" />,
            label: `${VIDEOS.filter(v => v.playlistId === playlist.id).length} videos`,
          },
          onClick: () => go(`/app/videos?playlist=${playlist.id}`),
        })),
      }
    }

    // Mesa de práctica: presets de número de jugadores.
    if (section === 'play') {
      const current = new URLSearchParams(location.search).get('seats')
      return {
        menuTitle: t('nav.play'),
        menuItems: TABLE_PRESETS.map(preset => ({
          title: preset.title,
          description: preset.description,
          variant: (current === String(preset.seats) ? 'active' : 'default') as MenuItemProps['variant'],
          badge: { icon: <Users className="w-3 h-3" />, label: `${preset.seats} jugadores` },
          onClick: () => go(`/app/play?seats=${preset.seats}`),
        })),
      }
    }

    // Por defecto: continuar donde lo dejaste, con los cursos en marcha.
    const inProgress = LEVELS.flatMap(level => level.courses)
      .map(course => ({ course, stats: courseProgress(course, completed) }))
      .filter(entry => entry.stats.ratio > 0 && entry.stats.ratio < 1)
      .slice(0, 5)

    return {
      menuTitle: t('nav.inProgress'),
      menuItems: inProgress.length
        ? inProgress.map(entry => ({
            title: entry.course.title,
            description: entry.course.summary,
            variant: 'default' as const,
            badge: {
              icon: <Clock className="w-3 h-3" />,
              label: `${entry.stats.done}/${entry.stats.total} · ${courseMinutes(entry.course)} min`,
            },
            onClick: () => go(`/app/classes/${entry.course.slug}`),
          }))
        : (LEVELS[0]?.courses ?? []).map(course => ({
            title: course.title,
            description: course.summary,
            variant: 'default' as const,
            badge: { icon: <GraduationCap className="w-3 h-3" />, label: 'Empezar aquí' },
            onClick: () => go(`/app/classes/${course.slug}`),
          })),
    }
  }, [section, segments, progress.lessons, go, t, location.search, LEVELS, findCourse])

  return {
    sidebarSections,
    menuTitle,
    menuItems,
    menuCollapsed,
    setMenuCollapsed,
    isRecordsRoute: section === 'records' || section === 'admin' || section === 'settings',
  }
}
