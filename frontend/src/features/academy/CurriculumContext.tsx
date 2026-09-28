// ──────────────────────────────────────────────
// CurriculumContext — el currículo de la academia.
// El contenido vive en el backend; este proveedor lo
// carga una vez y lo reparte con las consultas de la
// ruta (`createCurriculum`).
//
// Con sesión se pide el currículo completo; sin ella,
// el catálogo público (la landing solo necesita la
// estructura del programa, no el contenido). Cambiar
// de sesión vuelve a cargar: un administrador ve lo
// despublicado y un estudiante no.
//
// El backend sirve el contenido en español; si el
// idioma de Ajustes es otro, se traduce aquí
// (`@services/translate`) antes de repartirlo.
// Cambiar de idioma re-traduce sin volver a pedir.
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
import { fetchCatalog, fetchCurriculum, type CurriculumPayload } from '@services/curriculum'
import { SOURCE_LANGUAGE, translateContent, useContentLanguage } from '@services/translate'
import { EMPTY_CURRICULUM, createCurriculum, type Curriculum } from './curriculum'
import type { CurriculumStats, Level } from './types'

export type CurriculumStatus = 'loading' | 'ready' | 'error'

export interface CurriculumContextValue {
  curriculum: Curriculum
  /**
   * El mismo currículo en español, tal como lo sirve el backend. Lo usa la
   * lectura en voz alta: el guion se escribe en el idioma fuente y se traduce
   * al idioma del audio (que puede no ser el de la interfaz).
   */
  sourceCurriculum: Curriculum
  status: CurriculumStatus
  /** Cifras del programa publicado. */
  stats: CurriculumStats
  /** El backend sirve el currículo semilla porque aún no tiene las tablas. */
  persisted: boolean
  /** El currículo incluye lo despublicado y las notas internas. */
  admin: boolean
  /** Vuelve a pedir el currículo (tras publicar, despublicar o cambiar un video). */
  reload: () => Promise<void>
}

const EMPTY_STATS: CurriculumStats = {
  levels: 0,
  courses: 0,
  lessons: 0,
  minutes: 0,
  drills: 0,
  quizzes: 0,
  spots: 0,
}

/**
 * Normaliza lo que llegue del backend. Una respuesta con otra forma (un proxy,
 * una versión antigua de la API) se descarta en vez de tumbar las páginas.
 */
function normalize(payload: CurriculumPayload | null): CurriculumPayload | null {
  if (!payload || !Array.isArray(payload.levels)) return null
  const levels = payload.levels.filter(
    (level): level is Level => typeof level?.id === 'string' && Array.isArray(level.courses),
  )
  return {
    levels,
    stats: { ...EMPTY_STATS, ...payload.stats },
    persisted: payload.persisted !== false,
    admin: payload.admin === true,
  }
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null)

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const lang = useContentLanguage()
  /** Lo que devolvió el backend, en español. */
  const [source, setSource] = useState<CurriculumPayload | null>(null)
  /** Lo que se reparte: `source` en el idioma de Ajustes. */
  const [payload, setPayload] = useState<CurriculumPayload | null>(null)
  const [status, setStatus] = useState<CurriculumStatus>('loading')
  /** Qué se cargó: el currículo completo o el catálogo público. */
  const loadedScope = useRef<'full' | 'catalog' | null>(null)
  // Descarta respuestas de una sesión anterior que lleguen tarde.
  const request = useRef(0)

  const load = useCallback(async () => {
    const id = ++request.current
    const scope = isAuthenticated ? 'full' : 'catalog'

    // Recargar lo mismo (tras un cambio del administrador) no vuelve a pasar
    // por "cargando": la página sigue pintada y se actualiza al llegar. Pasar
    // del catálogo al currículo completo sí, porque el catálogo no trae el
    // contenido de las clases.
    if (loadedScope.current !== scope) setStatus('loading')

    const fetcher = scope === 'full' ? fetchCurriculum : fetchCatalog
    const next = normalize(await fetcher().catch(() => null))
    if (id !== request.current) return

    if (next) {
      // Pasa a 'ready' cuando esté en el idioma de Ajustes (efecto de abajo).
      setSource(next)
      loadedScope.current = scope
    } else if (loadedScope.current !== scope) {
      setStatus('error')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    void load()
    // `user.id` también: otro usuario en la misma pestaña tiene otros permisos.
  }, [authLoading, load, user?.id])

  // Traduce lo cargado al idioma de Ajustes. Si el traductor no responde se
  // reparte el español: `translateContent` nunca falla.
  useEffect(() => {
    if (!source) return
    if (lang === SOURCE_LANGUAGE) {
      setPayload(source)
      setStatus('ready')
      return
    }
    let cancelled = false
    void translateContent(source.levels, lang).then(levels => {
      if (cancelled) return
      setPayload({ ...source, levels })
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [source, lang])

  const curriculum = useMemo(
    () => (payload ? createCurriculum(payload.levels) : EMPTY_CURRICULUM),
    [payload],
  )

  const sourceCurriculum = useMemo(
    () => (source ? createCurriculum(source.levels) : EMPTY_CURRICULUM),
    [source],
  )

  const value = useMemo<CurriculumContextValue>(
    () => ({
      curriculum,
      sourceCurriculum,
      status,
      stats: payload?.stats ?? EMPTY_STATS,
      persisted: payload?.persisted ?? true,
      admin: payload?.admin ?? false,
      reload: load,
    }),
    [curriculum, sourceCurriculum, status, payload, load],
  )

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>
}

/**
 * Currículo fijo, sin pedir nada al backend. Para tests y para pintar
 * componentes aislados con un contenido conocido.
 */
export function StaticCurriculumProvider({
  levels,
  stats,
  children,
}: {
  levels: Level[]
  stats?: Partial<CurriculumStats>
  children: ReactNode
}) {
  const value = useMemo<CurriculumContextValue>(
    () => ({
      curriculum: createCurriculum(levels),
      sourceCurriculum: createCurriculum(levels),
      status: 'ready',
      stats: { ...EMPTY_STATS, ...stats },
      persisted: true,
      admin: false,
      reload: async () => {},
    }),
    [levels, stats],
  )
  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>
}

export function useCurriculumState(): CurriculumContextValue {
  const context = useContext(CurriculumContext)
  if (!context) {
    throw new Error('useCurriculum debe usarse dentro de <CurriculumProvider>')
  }
  return context
}

/** Las consultas de la ruta sobre el currículo cargado. */
export function useCurriculum(): Curriculum {
  return useCurriculumState().curriculum
}

/** Como `useCurriculum`, pero fuera del provider devuelve el currículo vacío. */
export function useOptionalCurriculum(): Curriculum {
  return useContext(CurriculumContext)?.curriculum ?? EMPTY_CURRICULUM
}

/** Una clase en español (idioma fuente), para escribir su guion de audio. */
export function useSourceLesson(lessonId: string | undefined) {
  const { sourceCurriculum } = useCurriculumState()
  return lessonId ? sourceCurriculum.findLessonById(lessonId)?.lesson : undefined
}
