// ──────────────────────────────────────────────
// TableThemeContext — qué estilo de mesa se ve.
//
// Dos decisiones distintas:
//  · El estilo POR DEFECTO lo elige un ADMIN o
//    SUPERADMIN y lo ven todos los usuarios. Vive en
//    el backend; si no responde, en localStorage (así
//    funciona también en modo mock, como el contenido
//    de la academia).
//  · Cada usuario puede además ELEGIR su propio
//    estilo (desde la configuración de cualquier
//    mesa) sin tocar el de los demás. Esa elección
//    se guarda en su navegador y vale para todas
//    sus mesas.
//
// La mesa solo toma el estilo dentro de un
// <TableThemeScope>: las cartas de las lecciones y
// herramientas siguen con el aspecto clásico.
// ──────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@context/AuthContext'
import { isAdminUser } from '@services/auth'
import { fetchTableTheme, saveTableTheme } from '@services/table-theme'
import {
  CLASSIC_TABLE_THEME,
  DEFAULT_TABLE_THEME_ID,
  findTableTheme,
  isTableThemeId,
  tableThemeStyle,
  type TableTheme,
} from './themes'

const DEFAULT_KEY = 'poker_table_theme_default'
const PREVIEW_KEY = 'poker_table_theme_preview'

/** De dónde salió el estilo por defecto que se está usando. */
export type TableThemeSource = 'api' | 'local' | 'loading'

interface TableThemeContextValue {
  /** El estilo que ve este usuario ahora mismo. */
  theme: TableTheme
  /** El que ven todos los usuarios. */
  defaultThemeId: string
  /** Estilo que este usuario eligió solo para sí; `null` si usa el de todos. */
  previewThemeId: string | null
  source: TableThemeSource
  /** ADMIN o SUPERADMIN: puede cambiar el estilo de todos. */
  canCustomize: boolean
  preview: (themeId: string | null) => void
  /** Devuelve `true` si quedó guardado en el backend, `false` si solo en este navegador. */
  setDefault: (themeId: string) => Promise<boolean>
}

const TableThemeContext = createContext<TableThemeContextValue | null>(null)

function readStorage(key: string): string | null {
  try {
    const value = localStorage.getItem(key)
    return isTableThemeId(value) ? value : null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Almacenamiento bloqueado: el estilo vale para esta sesión.
  }
}

export function TableThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const canCustomize = isAdminUser(user)

  const [defaultThemeId, setDefaultThemeId] = useState<string>(
    () => readStorage(DEFAULT_KEY) ?? DEFAULT_TABLE_THEME_ID,
  )
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(() => readStorage(PREVIEW_KEY))
  const [source, setSource] = useState<TableThemeSource>('loading')

  // Se vuelve a pedir al cambiar de usuario: el endpoint requiere sesión.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchTableTheme().then(setting => {
      if (cancelled) return
      if (setting && setting.persisted) {
        const id = isTableThemeId(setting.themeId) ? setting.themeId : DEFAULT_TABLE_THEME_ID
        setDefaultThemeId(id)
        writeStorage(DEFAULT_KEY, id)
        setSource('api')
      } else {
        setSource('local')
      }
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const preview = useCallback((themeId: string | null) => {
    const id = isTableThemeId(themeId) ? themeId : null
    setPreviewThemeId(id)
    writeStorage(PREVIEW_KEY, id)
  }, [])

  const setDefault = useCallback(async (themeId: string) => {
    if (!isTableThemeId(themeId)) return false
    setDefaultThemeId(themeId)
    writeStorage(DEFAULT_KEY, themeId)
    const saved = await saveTableTheme(themeId)
    const persisted = saved?.persisted === true
    setSource(persisted ? 'api' : 'local')
    return persisted
  }, [])

  const value = useMemo<TableThemeContextValue>(() => {
    // La elección personal manda sobre la de todos.
    const activeId = previewThemeId || defaultThemeId
    return {
      theme: findTableTheme(activeId) ?? CLASSIC_TABLE_THEME,
      defaultThemeId,
      previewThemeId,
      source,
      canCustomize,
      preview,
      setDefault,
    }
  }, [canCustomize, previewThemeId, defaultThemeId, source, preview, setDefault])

  return <TableThemeContext.Provider value={value}>{children}</TableThemeContext.Provider>
}

/** Estado y acciones del estilo de mesa. `null` fuera del provider. */
export function useTableThemeSettings(): TableThemeContextValue | null {
  return useContext(TableThemeContext)
}

// ─── Ámbito donde se aplica ─────────────────

const ActiveThemeContext = createContext<TableTheme>(CLASSIC_TABLE_THEME)

/** Estilo que deben dibujar la mesa y las cartas. Fuera de un scope, el clásico. */
export function useActiveTableTheme(): TableTheme {
  return useContext(ActiveThemeContext)
}

/**
 * Aplica el estilo activo a lo que envuelve: fija las variables `--poker-*`
 * (tapete, barandilla, acento, cartas) y le dice a las cartas qué cara y qué
 * dorso usar. `theme` fuerza uno concreto, p.ej. en las miniaturas del selector.
 */
export function TableThemeScope({
  theme: forced,
  className,
  children,
}: {
  theme?: TableTheme
  className?: string
  children: ReactNode
}) {
  const settings = useContext(TableThemeContext)
  const theme = forced ?? settings?.theme ?? CLASSIC_TABLE_THEME
  return (
    <ActiveThemeContext.Provider value={theme}>
      <div className={className} style={tableThemeStyle(theme)} data-table-theme={theme.id}>
        {children}
      </div>
    </ActiveThemeContext.Provider>
  )
}
