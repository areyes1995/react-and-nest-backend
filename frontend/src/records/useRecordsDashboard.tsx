// ──────────────────────────────────────────────
// useRecordsDashboard — URL-driven state for the dashboard
// Module + view are derived from the URL
// (`/app/records/:base?/:view?`), so deep-linking
// and reloads preserve the selection. Only the
// menu-panel collapse persists to localStorage.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuItemProps, MenuBadge } from '@components/menu/MenuItem'
import type { SidebarSectionProps } from '@components/sidebar/SidebarSection'
import { BarChart3, LayoutGrid, FileText } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import {
  RECORD_MODULES,
  GENERAL_MENU,
  STORAGE_KEYS,
  ROLES_VIEW_OPTIONS,
  PERMISSIONS_VIEW_OPTIONS,
} from './records.config'
import { QUICK_LINKS, STATIC_SECTIONS } from '@routes/menu.config'
import { getRecordsForModule } from './data'
import type { RecordColumn, RecordModule, RecordViewOption, StaticSidebarItem } from './types'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useAuth } from '@context/AuthContext'
import { hasPermission } from '@services/auth'
import { jsonConfig, type BaseModule, type ColumnType, type ViewOption } from '@services/json-config'


/** Slugs de módulos visibles según permisos RBAC (`module:<slug>`). */
export function getVisibleRecordModules(
  permissions: string[] | undefined,
): RecordModule[] {
  return RECORD_MODULES.filter(m =>
    permissions?.includes(`module:${m.slug}`),
  )
}

/** Un item de menú es visible si no exige permiso o el usuario lo posee. */
function isMenuItemVisible(
  item: Pick<StaticSidebarItem, 'permission'>,
  permissions: string[] | undefined,
): boolean {
  return !item.permission || (permissions?.includes(item.permission) ?? false)
}

/** RBAC-specific base slugs with their view options and display titles. */
const RBAC_BASES: Record<string, { title: string; options: RecordViewOption[] }> = {
  roles: { title: 'Roles', options: ROLES_VIEW_OPTIONS },
  permissions: { title: 'Permissions', options: PERMISSIONS_VIEW_OPTIONS },
}

/** Convert a JSON config column to a frontend RecordColumn. */
function jsonColumnToRecordColumn(col: ColumnType): RecordColumn {
  const base: RecordColumn = {
    key: col.key,
    header: col.header,
    type: col.type.toLowerCase() as RecordColumn['type'],
    chartGroup: col.chartGroup,
  }
  if (col.options && Array.isArray(col.options)) {
    base.options = col.options as string[]
  }
  return base
}

/** Convert a JSON config view option to a frontend RecordViewOption. */
function jsonViewToRecordView(vo: ViewOption): RecordViewOption {
  const kind = (vo.kind ?? '').toLowerCase()
  return {
    label: vo.label,
    slug: vo.slug,
    description: vo.description ?? '',
    kind: kind === 'summary' ? 'summary' : kind === 'table' ? 'table' : kind === 'archived' ? 'archived' : 'upload',
  }
}

function resolveIconComponent(iconName: string): ReactNode {
  const pascal = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  const Icon = (LucideIcons as Record<string, any>)[pascal]
  const IconComponent = Icon || LayoutGrid
  return <IconComponent className="w-4 h-4" strokeWidth={1.5} />
}

/** Convert a JSON config module to a frontend RecordModule. */
export function dbModuleToRecordModule(baseMod: BaseModule): RecordModule {
  const icon: RecordModule['icon'] = resolveIconComponent(baseMod.icon || 'LayoutGrid')
  return {
    label: baseMod.label,
    slug: baseMod.slug,
    color: baseMod.color,
    icon,
    viewOptions: (baseMod.viewOptions ?? []).map(jsonViewToRecordView),
    columns: (baseMod.columns ?? []).map(jsonColumnToRecordColumn),
    summaryChart: (baseMod as any).summaryChart,
  }
}


interface UseRecordsDashboardResult {
  activeItemLabel: string
  activeModule: RecordModule | undefined
  activeView: RecordViewOption
  selectedCard: string
  menuCollapsed: boolean
  setMenuCollapsed: (collapsed: boolean) => void
  sidebarSections: SidebarSectionProps[]
  menuTitle: string
  menuItems: MenuItemProps[]
  viewOptions: RecordViewOption[]
  handleSidebarClick: (slug: string) => void
  handleSelectCard: (slug: string) => void
}

/** Lee el estado colapsado migrando la key legacy de "notas". */
function readMenuCollapsed(): boolean {
  const current = localStorage.getItem(STORAGE_KEYS.menuCollapsed)
  if (current !== null) return current === 'true'
  return localStorage.getItem('modu_notes_collapsed') === 'true'
}

export function useRecordsDashboard(): UseRecordsDashboardResult {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(() =>
    readMenuCollapsed(),
  )

  const [systemModules, setSystemModules] = useState<BaseModule[]>([])
  const [customModules, setCustomModules] = useState<BaseModule[]>([])
  const [systemModulesLoaded, setSystemModulesLoaded] = useState(false)
  const [customModulesLoaded, setCustomModulesLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    jsonConfig.getSystemModules()
      .then(mods => {
        if (!cancelled) {
          setSystemModules(mods)
          setSystemModulesLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setSystemModulesLoaded(true)
      })
    jsonConfig.getCustomModules()
      .then(mods => {
        if (!cancelled) {
          setCustomModules(mods)
          setCustomModulesLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setCustomModulesLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const allModules = useMemo<RecordModule[]>(() => {
    if (!systemModulesLoaded || !customModulesLoaded) {
      return RECORD_MODULES
    }
    const combined = [...(systemModules ?? []), ...(customModules ?? [])]
    return combined.map(dbModuleToRecordModule)
  }, [systemModules, customModules, systemModulesLoaded, customModulesLoaded])

  const segments = location.pathname.split('/').filter(Boolean)
  const baseSlug = segments[1] === 'records' ? (segments[2] ?? 'records') : (segments[1] ?? 'records')
  const viewSlug = segments[3] ?? 'overview'

  const activeModule = useMemo(() => {
    const fromUrl = allModules.find(m => m.slug === baseSlug)
    if (!fromUrl) return undefined
    return fromUrl
  }, [baseSlug, allModules])

  const rbacBase = RBAC_BASES[baseSlug]
  const generalView = GENERAL_MENU.find(v => v.slug === baseSlug)
  const viewOptions = useMemo<RecordViewOption[]>(() => {
    if (rbacBase) {
      return rbacBase.options.filter(opt => !opt.permission || hasPermission(user, opt.permission))
    }
    const base = activeModule ? activeModule.viewOptions : GENERAL_MENU
    return base.filter(opt => !opt.permission || hasPermission(user, opt.permission))
  }, [activeModule, user, rbacBase])
  const fallbackView: RecordViewOption = rbacBase
    ? { label: rbacBase.title, slug: rbacBase.options[0].slug, description: '', kind: 'summary' }
    : activeModule
    ? { label: activeModule.label, slug: activeModule.slug, description: '', kind: 'summary' }
    : GENERAL_MENU[0]
  const activeView: RecordViewOption = rbacBase
    ? (viewOptions.find(v => v.slug === viewSlug) ?? viewOptions[0] ?? fallbackView)
    : activeModule
    ? (viewOptions.find(v => v.slug === viewSlug) ?? viewOptions[0] ?? fallbackView)
    : (generalView ?? viewOptions.find(v => v.slug === viewSlug) ?? viewOptions[0] ?? fallbackView)
  const activeItemLabel = rbacBase ? rbacBase.title : activeModule?.label ?? activeView.label
  const selectedCard = activeView.label
  const menuTitle = rbacBase ? rbacBase.title : activeModule?.label ?? activeView.label

  const goTo = useCallback((path: string, expandMenu = true) => {
    setMenuCollapsed(!expandMenu)
    navigate(path, { replace: location.pathname === path })
  }, [navigate, location.pathname])

  const handleSidebarClick = useCallback((slug: string) => {
    if (slug === 'attrition-report') {
      goTo('/app/reports/attrition', false)
      return
    }
    const item =
      QUICK_LINKS.find(q => q.slug === slug) ??
      STATIC_SECTIONS.flatMap(s => s.items).find(i => i.slug === slug)
    if (item?.path) {
      goTo(item.path, !item.path.startsWith('/app/records/'))
      return
    }
    const isStaticModule = RECORD_MODULES.some(m => m.slug === slug)
    const isCustomModule = (customModulesLoaded || systemModulesLoaded) && allModules.some(m => m.slug === slug)
    const isModule = isStaticModule || isCustomModule
    goTo(isModule ? `/app/records/${slug}/overview` : `/app/records/${slug}`, false)
  }, [goTo, customModulesLoaded, systemModulesLoaded, allModules])

  const handleSelectCard = useCallback((slug: string) => {
    const base = activeModule?.slug ?? baseSlug
    goTo(`/app/records/${base}/${slug}`)
  }, [goTo, activeModule, baseSlug])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.menuCollapsed, String(menuCollapsed))
  }, [menuCollapsed])

  const sidebarSections = useMemo<SidebarSectionProps[]>(() => {
    const userPermissions = user?.permissions

    // Slugs that map to direct page routes, not record modules
    const pageRouteSlugs = new Set(QUICK_LINKS.map(q => q.slug))
    STATIC_SECTIONS.forEach(s => s.items.forEach(i => { if (i.slug) pageRouteSlugs.add(i.slug) }) )

    const quickLinks = QUICK_LINKS
      .filter(item => isMenuItemVisible(item, userPermissions))
      .map(item => ({
        icon: item.icon,
        label: item.label,
        active: item.slug === baseSlug,
        onClick: () => {
          if (item.path) {
            goTo(item.path, true)
          }
        },
      }))

    const recordsItems = allModules
      .filter(m => !pageRouteSlugs.has(m.slug))
      .map(m => ({
        icon: m.icon,
        label: m.label,
        active: activeModule?.slug === m.slug || (!activeModule && m.slug === baseSlug),
        onClick: () => handleSidebarClick(m.slug),
      }))

    recordsItems.push({
      icon: <FileText className="w-4 h-4" strokeWidth={1.5} />,
      label: 'Attrition Report',
      active: baseSlug === 'attrition-report',
      onClick: () => handleSidebarClick('attrition-report'),
    })

    const staticSections = STATIC_SECTIONS
      .map(section => ({
        title: section.title,
        items: section.items
          .filter(item => isMenuItemVisible(item, userPermissions))
          .map(item => ({
            icon: item.icon,
            label: item.label,
            active: item.slug === baseSlug,
            onClick: () => handleSidebarClick(item.slug ?? item.label),
          })),
      }))
      .filter(section => section.items.length > 0)

    return [
      { title: 'Quick links', items: quickLinks },
      {
        title: 'Records',
        dropdown: {
          icon: <LayoutGrid className="w-4 h-4 text-white" strokeWidth={1.5} />,
          label: 'Records',
          items: recordsItems,
        },
      },
      ...staticSections,
    ]
  }, [baseSlug, activeModule, allModules, user, handleSidebarClick])

  const { t } = useAppTranslation()
  const menuItems = useMemo<MenuItemProps[]>(() => {
    const summaryBadge = buildSummaryBadge(activeModule)
    const lastArchived = buildArchivedLabel(activeModule)

    return viewOptions.map(opt => ({
      title: t(opt.label),
      color: activeModule?.color,
      description: opt.kind === 'archived' && lastArchived ? lastArchived : t(opt.description),
      variant: (opt.slug === activeView.slug ? 'active' : 'default') as 'default' | 'active' | 'subtle',
      badge: opt.kind === 'summary' ? summaryBadge : undefined,
      onClick: () => handleSelectCard(opt.slug),
    }))
  }, [viewOptions, activeModule, activeView, handleSelectCard, t])

  return {
    activeItemLabel,
    activeModule,
    activeView,
    selectedCard,
    menuCollapsed,
    setMenuCollapsed,
    sidebarSections,
    menuTitle,
    menuItems,
    viewOptions,
    handleSidebarClick,
    handleSelectCard,
  }
}

/** Builds a dynamic summary badge for the current module's dataset. */
function buildSummaryBadge(module: RecordModule | undefined): MenuBadge | undefined {
  const rows = getRecordsForModule(module?.label)
  const total = rows.length

  let metric: string
  let icon: ReactNode

  if (!module) {
    metric = `${total} records`
    icon = <BarChart3 className="w-3 h-3" />
  } else {
    const numCol = module.columns.find(c => c.type === 'number')
    if (numCol) {
      const sum = rows.reduce((acc, r) => acc + (Number(r[numCol.key]) || 0), 0)
      const isMoney = numCol.key === 'amount'
      metric = isMoney
        ? `Total ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sum)}`
        : `Total ${sum.toLocaleString('en-US')} ${numCol.header.toLowerCase()}`
      icon = <BarChart3 className="w-3 h-3" />
    } else {
      const active = rows.filter(r => r.status === 'Active').length
      metric = `${active} active · ${total} total`
      icon = <BarChart3 className="w-3 h-3" />
    }
  }

  return { icon, label: metric }
}

/** Builds a label with the most recent archived record date for a module. */
function buildArchivedLabel(module: RecordModule | undefined): string | undefined {
  const rows = getRecordsForModule(module?.label)
  const archived = rows.filter(r => r.status === 'Archived' && typeof r.lastUpdated === 'string')
  if (archived.length === 0) return undefined

  const latest = archived
    .map(r => r.lastUpdated as string)
    .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0]

  return `Last archived: ${latest}`
}

/** Parses a DD/MM/YYYY string into a comparable timestamp. */
function toTimestamp(date: string): number {
  const [d, m, y] = date.split('/').map(Number)
  return m && y ? new Date(y, m - 1, d).getTime() : 0
}
