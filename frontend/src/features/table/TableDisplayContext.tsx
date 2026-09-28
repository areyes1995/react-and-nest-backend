// ──────────────────────────────────────────────
// TableDisplayContext — cómo se leen las mesas.
//
// Preferencias de cada estudiante que valen para
// TODAS las mesas a la vez (práctica, clases,
// modo explicativo, herramientas): cambiarlas en
// una las cambia en todas. Viven en un único
// provider y se guardan en el navegador; también
// se sincronizan entre pestañas abiertas.
//
//  · unit: fichas o ciegas grandes (BB). Pensar en
//    BB es lo que hacen los jugadores de verdad: un
//    stack de 5.000 no dice nada, 100 BB lo dice todo.
//  · compact: abrevia cantidades grandes (12,5k).
//  · showToCall: el aviso «Te piden X para seguir».
//
// Las cantidades se formatean con `useChipFormat`,
// que toma la ciega grande de la mesa más cercana
// (PokerTable la publica con <TableBlindProvider>).
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

export type ChipUnit = 'chips' | 'bb'

export interface TableDisplayPrefs {
  unit: ChipUnit
  compact: boolean
  showToCall: boolean
}

export const DEFAULT_TABLE_DISPLAY: TableDisplayPrefs = {
  unit: 'chips',
  compact: true,
  showToCall: true,
}

const STORAGE_KEY = 'poker_table_display'

function readPrefs(): TableDisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TABLE_DISPLAY
    const parsed = JSON.parse(raw) as Partial<TableDisplayPrefs>
    return {
      unit: parsed.unit === 'bb' ? 'bb' : 'chips',
      compact: typeof parsed.compact === 'boolean' ? parsed.compact : DEFAULT_TABLE_DISPLAY.compact,
      showToCall: typeof parsed.showToCall === 'boolean' ? parsed.showToCall : DEFAULT_TABLE_DISPLAY.showToCall,
    }
  } catch {
    return DEFAULT_TABLE_DISPLAY
  }
}

function writePrefs(prefs: TableDisplayPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Almacenamiento bloqueado: la preferencia vale para esta sesión.
  }
}

// ─── Formato de cantidades ──────────────────

/**
 * Formatea una cantidad según las preferencias. En fichas, compacta si se
 * pide (12500 → 12,5k); en BB, con un decimal como mucho (2,5 BB · 100 BB).
 * Sin ciega grande conocida, se muestran fichas.
 */
export function formatAmount(amount: number, prefs: TableDisplayPrefs, bigBlind?: number): string {
  if (prefs.unit === 'bb' && bigBlind && bigBlind > 0) {
    const bb = amount / bigBlind
    const shown =
      prefs.compact && Math.abs(bb) >= 10_000
        ? `${(bb / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k`
        : bb.toLocaleString('es-ES', { maximumFractionDigits: 1 })
    return `${shown} BB`
  }
  const abs = Math.abs(amount)
  if (prefs.compact && abs >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (prefs.compact && abs >= 10_000) return (amount / 1000).toFixed(1).replace('.0', '') + 'k'
  return amount.toLocaleString('es-ES')
}

// ─── Provider global ────────────────────────

interface TableDisplayContextValue {
  prefs: TableDisplayPrefs
  update: (patch: Partial<TableDisplayPrefs>) => void
}

const TableDisplayContext = createContext<TableDisplayContextValue | null>(null)

export function TableDisplayProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<TableDisplayPrefs>(readPrefs)

  // Otra pestaña cambió la preferencia: esta también la sigue.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPrefs(readPrefs())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((patch: Partial<TableDisplayPrefs>) => {
    setPrefs(current => {
      const next = { ...current, ...patch }
      writePrefs(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ prefs, update }), [prefs, update])
  return <TableDisplayContext.Provider value={value}>{children}</TableDisplayContext.Provider>
}

/** Preferencias y cómo cambiarlas. Fuera del provider, las de por defecto (sin guardar). */
export function useTableDisplay(): TableDisplayContextValue {
  return useContext(TableDisplayContext) ?? { prefs: DEFAULT_TABLE_DISPLAY, update: () => {} }
}

// ─── Ciega grande de la mesa ────────────────

const TableBlindContext = createContext<number | undefined>(undefined)

/** Publica la ciega grande de una mesa para que sus cantidades se puedan pasar a BB. */
export function TableBlindProvider({ bigBlind, children }: { bigBlind: number; children: ReactNode }) {
  return <TableBlindContext.Provider value={bigBlind}>{children}</TableBlindContext.Provider>
}

/**
 * Formateador de cantidades con las preferencias del estudiante. `bigBlind`
 * se puede pasar a mano (fuera de una mesa); si no, se usa la de la mesa.
 */
export function useChipFormat(bigBlind?: number): (amount: number) => string {
  const { prefs } = useTableDisplay()
  const tableBlind = useContext(TableBlindContext)
  const blind = bigBlind ?? tableBlind
  return useCallback((amount: number) => formatAmount(amount, prefs, blind), [prefs, blind])
}
