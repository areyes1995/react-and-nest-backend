// ──────────────────────────────────────────────
// SavedContext — lo que el estudiante guarda.
//
// El marcador dejó de ser un dato del navegador: vive
// en la base de datos y sigue al estudiante entre
// equipos. Aun así se mantiene una copia local, por
// dos motivos: el botón tiene que responder al
// instante (se pinta antes de que el backend conteste)
// y sin sesión o sin API la biblioteca sigue siendo
// usable, igual que ContentContext.
//
// Los marcadores antiguos (`poker_academy_progress_v1`,
// solo ids sueltos) se migran una vez: se resuelve su
// tipo contra el catálogo y se suben al backend.
// ──────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@context/AuthContext'
import {
  fetchSavedItems,
  removeSavedItem,
  toggleSavedItem,
  type SavedItem,
  type SavedKind,
} from '@services/saved'
import { useCurriculumState } from '@features/academy/CurriculumContext'
import type { Curriculum } from '@features/academy/curriculum'
import { resolveTarget, type SavedTarget } from './catalog'

const STORAGE_KEY = 'poker_saved_items_v1'
/** Marcadores de la versión anterior, dentro del progreso del estudiante. */
const LEGACY_PROGRESS_KEY = 'poker_academy_progress_v1'
const MIGRATED_KEY = 'poker_saved_items_migrated'

/** De dónde salieron los datos que se están usando. */
export type SavedSource = 'api' | 'local' | 'loading'

/** Clave única de un guardado: el mismo id puede existir en dos catálogos. */
function keyOf(kind: SavedKind, contentId: string): string {
  return `${kind}:${contentId}`
}

function isSavedItem(value: unknown): value is SavedItem {
  const item = value as Partial<SavedItem> | null
  return Boolean(item && typeof item.contentId === 'string' && typeof item.kind === 'string')
}

function readLocal(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isSavedItem) : []
  } catch {
    return []
  }
}

function writeLocal(items: SavedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Cuota llena o almacenamiento bloqueado: la sesión sigue, sin copia local.
  }
}

/**
 * Marcadores de la versión anterior convertidos al formato nuevo.
 * Los ids que ya no existen en el catálogo se descartan: sin tipo ni ruta no
 * hay nada que enseñar en la lista.
 */
function readLegacy(curriculum: Curriculum): SavedItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_PROGRESS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { bookmarks?: unknown }
    if (!Array.isArray(parsed.bookmarks)) return []

    const createdAt = new Date().toISOString()
    return parsed.bookmarks
      .filter((id): id is string => typeof id === 'string')
      .map((id): SavedItem | null => {
        const target = resolveTarget(id, undefined, curriculum)
        if (!target) return null
        return {
          kind: target.kind,
          contentId: target.contentId,
          title: target.title,
          url: target.url,
          note: null,
          createdAt,
        }
      })
      .filter((item): item is SavedItem => item !== null)
  } catch {
    return []
  }
}

export interface SavedContextValue {
  items: SavedItem[]
  source: SavedSource
  /** ¿Está guardado? Sin `kind` busca el id en cualquier catálogo. */
  isSaved: (contentId: string, kind?: SavedKind) => boolean
  /** Guarda si no estaba, quita si estaba. Devuelve el estado resultante. */
  toggle: (target: SavedTarget) => Promise<boolean>
  /** Quita un guardado desde la página de la biblioteca. */
  remove: (kind: SavedKind, contentId: string) => Promise<void>
  reload: () => Promise<void>
}

const SavedContext = createContext<SavedContextValue | null>(null)

export function SavedProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { curriculum, status: curriculumStatus } = useCurriculumState()
  const [items, setItems] = useState<SavedItem[]>(() => readLocal())
  const [source, setSource] = useState<SavedSource>('loading')

  // La migración corre una vez por navegador, no una vez por render.
  const migrating = useRef(false)

  /** Guarda el estado nuevo y refresca la copia local en el mismo paso. */
  const commit = useCallback((next: SavedItem[]) => {
    writeLocal(next)
    setItems(next)
  }, [])

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      // Sin sesión no hay a quién pedirle nada: se trabaja con la copia local.
      setItems(readLocal())
      setSource('local')
      return
    }

    const remote = await fetchSavedItems().catch(() => null)

    // Sin respuesta, o con la tabla todavía sin crear, la lista que llega es
    // vacía: sobrescribir con ella borraría los marcadores del navegador.
    if (!remote || !remote.persisted) {
      setItems(readLocal())
      setSource('local')
      return
    }

    commit(remote.items)
    setSource('api')
  }, [isAuthenticated, commit])

  useEffect(() => {
    void load()
  }, [load])

  // ── Migración de los marcadores antiguos ──
  // Solo con sesión, backend vivo y el currículo cargado: si se hiciera sin API
  // se perdería al borrarse la marca de migrado, y sin currículo las clases
  // guardadas no se reconocerían.
  useEffect(() => {
    if (source !== 'api' || curriculumStatus !== 'ready' || migrating.current) return
    if (localStorage.getItem(MIGRATED_KEY) === 'true') return

    const legacy = readLegacy(curriculum)
    if (legacy.length === 0) {
      localStorage.setItem(MIGRATED_KEY, 'true')
      return
    }

    migrating.current = true
    void (async () => {
      const pending = legacy.filter(
        old => !items.some(item => keyOf(item.kind, item.contentId) === keyOf(old.kind, old.contentId)),
      )

      for (const item of pending) {
        await toggleSavedItem(item.kind, item.contentId, {
          title: item.title ?? undefined,
          url: item.url ?? undefined,
        }).catch(() => null)
      }

      localStorage.setItem(MIGRATED_KEY, 'true')
      migrating.current = false
      if (pending.length > 0) await load()
    })()
  }, [source, curriculumStatus, curriculum, items, load])

  const toggle = useCallback<SavedContextValue['toggle']>(
    async target => {
      const key = keyOf(target.kind, target.contentId)
      const wasSaved = items.some(item => keyOf(item.kind, item.contentId) === key)

      // Se pinta al instante y luego se confirma: un marcador que tarda medio
      // segundo en encenderse se siente roto.
      commit(
        wasSaved
          ? items.filter(item => keyOf(item.kind, item.contentId) !== key)
          : [
              {
                kind: target.kind,
                contentId: target.contentId,
                title: target.title,
                url: target.url,
                note: null,
                createdAt: new Date().toISOString(),
              },
              ...items,
            ],
      )

      if (!isAuthenticated) return !wasSaved

      const result = await toggleSavedItem(target.kind, target.contentId, {
        title: target.title,
        url: target.url,
      }).catch(() => null)

      // El backend manda: si respondió distinto de lo que se pintó (otra
      // pestaña, otro equipo), se recarga la lista en vez de discutir.
      if (result && result.saved === wasSaved) {
        await load()
        return result.saved
      }

      return result ? result.saved : !wasSaved
    },
    [items, isAuthenticated, commit, load],
  )

  const remove = useCallback<SavedContextValue['remove']>(
    async (kind, contentId) => {
      const key = keyOf(kind, contentId)
      commit(items.filter(item => keyOf(item.kind, item.contentId) !== key))
      if (isAuthenticated) await removeSavedItem(kind, contentId).catch(() => false)
    },
    [items, isAuthenticated, commit],
  )

  const keys = useMemo(
    () => new Set(items.map(item => keyOf(item.kind, item.contentId))),
    [items],
  )
  const ids = useMemo(() => new Set(items.map(item => item.contentId)), [items])

  const value = useMemo<SavedContextValue>(
    () => ({
      items,
      source,
      isSaved: (contentId, kind) => (kind ? keys.has(keyOf(kind, contentId)) : ids.has(contentId)),
      toggle,
      remove,
      reload: load,
    }),
    [items, source, keys, ids, toggle, remove, load],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

/** Acceso a la biblioteca personal. Debe usarse dentro de `SavedProvider`. */
export function useSavedItems(): SavedContextValue {
  const context = useContext(SavedContext)
  if (!context) {
    throw new Error('useSavedItems debe usarse dentro de <SavedProvider>')
  }
  return context
}
