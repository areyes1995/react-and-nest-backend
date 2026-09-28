// ──────────────────────────────────────────────
// MenuPanel — Middle panel with menu items
// Colapsable: se anima a un rail fino con los
// módulos/opciones para los table grids.
// ──────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronsLeft, ChevronsRight, LayoutGrid } from 'lucide-react'
import MenuSearchBar, { type MenuSearchBarProps } from './MenuSearchBar'
import MenuItem, { type MenuItemProps } from './MenuItem'
import { type ReactNode } from 'react'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface MenuPanelProps {
  title?: string
  items: MenuItemProps[]
  search?: MenuSearchBarProps
  emptyMessage?: string
  children?: ReactNode
  /** Segundos tras los cuales el panel se oculta automáticamente.
   *  Si no se pasa o es 0, nunca se oculta solo. Mínimo 3s. */
  autoHideSeconds?: number
  /** Si true, se vuelve a ocultar cada vez que se reabre.
   *  Si false (default), solo se oculta automáticamente la primera vez. */
  autoHideRepeat?: boolean
  /** Aparece oculto por defecto (default: false) */
  defaultCollapsed?: boolean
  /** Estado controlado (si se pasa, el componente no lo gestiona) */
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const MENU_COLLAPSED_KEY = 'modu_menu_collapsed'
const LEGACY_NOTES_COLLAPSED_KEY = 'modu_notes_collapsed'

/** Lee el estado colapsado migrando la key legacy de "notas". */
function readCollapsedKey(): boolean {
  const current = localStorage.getItem(MENU_COLLAPSED_KEY)
  if (current !== null) return current === 'true'
  return localStorage.getItem(LEGACY_NOTES_COLLAPSED_KEY) === 'true'
}

export default function MenuPanel({
  title = 'Menu',
  items,
  search,
  emptyMessage,
  children,
  autoHideSeconds,
  autoHideRepeat = false,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
}: MenuPanelProps) {
  const isControlled = collapsed !== undefined
  const { t } = useAppTranslation()
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(
    () => defaultCollapsed ?? readCollapsedKey(),
  )
  const autoHideFired = useRef(false)

  const isCollapsed = isControlled ? !!collapsed : internalCollapsed

  const updateCollapsed = useCallback(
    (value: boolean) => {
      if (isControlled) onCollapsedChange?.(value)
      else setInternalCollapsed(value)
    },
    [isControlled, onCollapsedChange],
  )

  useEffect(() => {
    if (!isControlled) {
      localStorage.setItem(MENU_COLLAPSED_KEY, String(internalCollapsed))
    }
  }, [internalCollapsed, isControlled])

  // ─── Auto‑ocultar tras X segundos ──────────────
  useEffect(() => {
    if (isCollapsed) return
    const seconds = autoHideSeconds
    if (!seconds || seconds <= 0) return
    if (!autoHideRepeat && autoHideFired.current) return
    const timer = setTimeout(() => {
      autoHideFired.current = true
      updateCollapsed(true)
    }, Math.max(seconds, 3) * 1000)
    return () => clearTimeout(timer)
  }, [isCollapsed, autoHideSeconds, autoHideRepeat, updateCollapsed])

  return (
    <section
      className={`${
        isCollapsed ? 'w-12' : 'w-80'
      } h-full bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative group`}
    >
      {/* ─── Rail colapsado ─── */}
      <div
        className={`${
          isCollapsed ? 'flex' : 'hidden'
        } flex-col items-center gap-5 py-4 h-full shrink-0 bg-gradient-to-b from-[var(--bg-panel)] to-[var(--bg-hover)]`}
      >
        <button
          onClick={() => updateCollapsed(false)}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[#f2a93b] hover:bg-[var(--bg-surface)] transition-all duration-200 active:scale-90"
          title={t('Expand modules')}
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
        <LayoutGrid className="w-4 h-4 text-[var(--text-muted-60)]" />
        <span className="text-mini font-medium tracking-[0.25em] uppercase text-[var(--text-muted)] [writing-mode:vertical-rl] select-none">
          {t('Modules')}
        </span>
      </div>

      {/* ─── Contenido expandido ─── */}
      <div
        className={`${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } flex flex-col h-full transition-opacity duration-200`}
      >
        <MenuSearchBar
          placeholder={search?.placeholder}
          onSearch={search?.onSearch}
          onFilter={search?.onFilter}
          onAdd={search?.onAdd}
        />

        <div className="px-4 pt-4 pb-2 sticky top-0 z-10 bg-[var(--bg-panel-80)] backdrop-blur-md flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{t(title)}</h2>
          <button
            onClick={() => updateCollapsed(true)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#f2a93b] hover:bg-[var(--bg-surface)] transition-all duration-200 active:scale-90"
            title={t('Collapse')}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        {children}

        <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
          {items.length === 0 && emptyMessage && (
            <p className="text-sm text-[var(--text-muted)] text-center pt-8">{emptyMessage}</p>
          )}
          {items.map((item, idx) => (
            <MenuItem key={idx} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}