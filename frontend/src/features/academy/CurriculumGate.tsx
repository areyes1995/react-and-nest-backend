// ──────────────────────────────────────────────
// CurriculumGate — espera al currículo antes de
// pintar las páginas de la academia.
// Sin él, una clase abierta por enlace directo diría
// "no existe" durante el medio segundo que tarda la
// API. Las páginas que no dependen del currículo (la
// mesa, las herramientas, la configuración) no se
// bloquean si el backend falla. Detrás del gate, las
// páginas de la academia tienen al menos una clase.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import EmptyState from '@components/ui/feedback/EmptyState'
import { useCurriculumState } from './CurriculumContext'

/** Secciones de `/app` que no se pueden pintar sin el currículo. */
const CURRICULUM_SECTIONS = new Set(['home', 'learn', 'classes', 'progress', 'saved', 'admin'])

export default function CurriculumGate({ children }: { children: ReactNode }) {
  const { status, reload, curriculum } = useCurriculumState()
  const { pathname } = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex-1 grid place-items-center text-xs text-[var(--text-muted)]">
        Cargando el currículo…
      </div>
    )
  }

  const section = pathname.split('/')[2] ?? 'home'
  if (status === 'error' && CURRICULUM_SECTIONS.has(section)) {
    return (
      <EmptyState
        message="No se pudo cargar el contenido de la academia. Comprueba tu conexión con el servidor."
        actionLabel="Reintentar"
        onAction={() => void reload()}
      />
    )
  }

  // Con la base migrada pero sin sembrar no hay ruta que recorrer: las páginas
  // de la academia pueden contar con que existe al menos una clase.
  if (status === 'ready' && curriculum.path.length === 0 && CURRICULUM_SECTIONS.has(section)) {
    return <EmptyState message="Todavía no hay clases publicadas en la academia." />
  }

  return <>{children}</>
}
