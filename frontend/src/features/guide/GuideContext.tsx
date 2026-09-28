// ──────────────────────────────────────────────
// GuideContext — el acompañante del estudiante.
//
// Reúne tres cosas que juntas hacen que nadie se
// pierda: el itinerario (qué toca ahora), el
// recorrido guiado de la interfaz (dónde está cada
// cosa) y el registro de zonas visitadas.
//
// Se monta dentro de /app, así que cualquier página
// puede preguntar "¿cuál es el siguiente paso?" sin
// recalcularlo.
// ──────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { journeyStatus, visitedSlug, type JourneyStatus } from './journey'
import {
  DEFAULT_GUIDE_STATE,
  TOUR_VERSION,
  readGuideState,
  shouldAutoStartTour,
  writeGuideState,
  type GuideState,
} from './storage'

export interface GuideContextValue {
  state: GuideState
  journey: JourneyStatus
  /** El recorrido guiado está abierto. */
  tourOpen: boolean
  startTour: () => void
  /** Cierra el tour y lo marca como visto (no vuelve a salir solo). */
  closeTour: () => void
  setGuidedReading: (enabled: boolean) => void
  setChecklistCollapsed: (collapsed: boolean) => void
  /** Reinicia la guía: vuelve a ofrecer el tour desde cero. */
  resetGuide: () => void
}

const GuideContext = createContext<GuideContextValue | null>(null)

export function GuideProvider({ children }: { children: ReactNode }) {
  const { progress } = useStudentProgress()
  const location = useLocation()

  const [state, setState] = useState<GuideState>(() => readGuideState())
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    writeGuideState(state)
  }, [state])

  // El tour se ofrece una vez, y solo cuando el estudiante ya está dentro de la
  // aplicación: lanzarlo sobre una pantalla a medio cargar resulta agresivo.
  useEffect(() => {
    if (shouldAutoStartTour(state)) {
      const timer = window.setTimeout(() => setTourOpen(true), 600)
      return () => window.clearTimeout(timer)
    }
    // El efecto solo debe evaluar la condición al montar; después el tour se
    // abre a petición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Registro de zonas visitadas: alimenta la etapa "usa una herramienta" y
  // evita volver a sugerir algo que el estudiante ya probó.
  useEffect(() => {
    const slug = visitedSlug(location.pathname)
    if (!slug) return
    setState(current =>
      current.visited.includes(slug)
        ? current
        : { ...current, visited: [...current.visited, slug] },
    )
  }, [location.pathname])

  const startTour = useCallback(() => setTourOpen(true), [])

  const closeTour = useCallback(() => {
    setTourOpen(false)
    setState(current =>
      current.tourSeenVersion >= TOUR_VERSION
        ? current
        : { ...current, tourSeenVersion: TOUR_VERSION },
    )
  }, [])

  const setGuidedReading = useCallback(
    (guidedReading: boolean) => setState(current => ({ ...current, guidedReading })),
    [],
  )

  const setChecklistCollapsed = useCallback(
    (checklistCollapsed: boolean) => setState(current => ({ ...current, checklistCollapsed })),
    [],
  )

  const resetGuide = useCallback(() => {
    setState({ ...DEFAULT_GUIDE_STATE })
    setTourOpen(true)
  }, [])

  const curriculum = useCurriculum()
  const journey = useMemo(
    () => journeyStatus(progress, state, curriculum),
    [progress, state, curriculum],
  )

  const value = useMemo<GuideContextValue>(
    () => ({
      state,
      journey,
      tourOpen,
      startTour,
      closeTour,
      setGuidedReading,
      setChecklistCollapsed,
      resetGuide,
    }),
    [state, journey, tourOpen, startTour, closeTour, setGuidedReading, setChecklistCollapsed, resetGuide],
  )

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}

/** Acceso a la guía. Debe usarse dentro de `<GuideProvider>`. */
export function useGuide(): GuideContextValue {
  const context = useContext(GuideContext)
  if (!context) {
    throw new Error('useGuide debe usarse dentro de <GuideProvider>')
  }
  return context
}
