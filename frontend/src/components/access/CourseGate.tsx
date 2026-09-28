// ──────────────────────────────────────────────
// CourseGate — la puerta de una clase.
// Envuelve la página de la clase (y su versión en la
// mesa) y decide antes de enseñarla:
//   · curso fuera del plan → muro de pago;
//   · desbloqueo progresivo encendido y nivel aún
//     cerrado (menos del 60% del anterior) → aviso
//     con el camino para abrirlo;
//   · si no, la clase tal cual.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAccess } from '@features/access/AccessContext'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { levelProgress } from '@features/academy/curriculum'
import { useStudentProgress } from '@features/progress/ProgressContext'
import PaywallGate, { AccessLoading } from './PaywallGate'

export default function CourseGate({ children }: { children: ReactNode }) {
  const { courseSlug } = useParams()
  const curriculum = useCurriculum()
  const { canOpenCourse, isLevelUnlocked, status } = useAccess()
  const { progress } = useStudentProgress()

  const course = courseSlug ? curriculum.findCourse(courseSlug) : undefined
  // Curso desconocido: la página ya sabe redirigir.
  if (!course) return <>{children}</>

  if (!canOpenCourse(course) && status === 'loading') return <AccessLoading />
  if (!canOpenCourse(course)) {
    return (
      <PaywallGate
        locked
        title="Esta clase es de pago"
        description={`«${course.title}» forma parte de los planes Premium y Gold. En el plan gratis tienes los 3 primeros cursos de Fundamentos.`}
      >
        {children}
      </PaywallGate>
    )
  }

  if (!isLevelUnlocked(course.level, progress.lessons)) {
    const index = curriculum.levels.findIndex(level => level.id === course.level)
    const previous = curriculum.levels[index - 1]
    const stats = previous ? levelProgress(previous, progress.lessons) : null
    return (
      <div className="grid flex-1 place-items-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)]">
            <Lock className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">Nivel bloqueado</h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Tienes activado el desbloqueo progresivo: completa el 60% de{' '}
            <b>{previous?.title ?? 'el nivel anterior'}</b> para abrir esta clase
            {stats ? ` (llevas ${stats.done} de ${stats.total} clases)` : ''}.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/app/learn" className="rounded-xl bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
              Ir a la ruta
            </Link>
            <Link to="/app/subscription" className="text-caption font-semibold text-[var(--poker-gold)] hover:underline">
              Abrir todas las clases
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
