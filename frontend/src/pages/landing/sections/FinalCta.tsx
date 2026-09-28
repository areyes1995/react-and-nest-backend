// ──────────────────────────────────────────────
// FinalCta — la última puerta.
// Una sola frase, una sola acción y el recordatorio
// de que empezar no cuesta nada.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { freeCourseIds } from '@features/access/rules'

export default function FinalCta() {
  const { isAuthenticated } = useAuth()

  // Lo que abre el plan gratuito, contado del currículo real con las mismas
  // reglas que aplica la academia.
  const curriculum = useCurriculum()
  const freeLevel = curriculum.levels[0]
  const freeIds = freeCourseIds(curriculum)
  const freeList = curriculum.courses.filter(course => freeIds.has(course.id))
  const freeCourses = freeList.length
  const freeLessons = freeList.reduce((sum, course) => sum + course.lessons.length, 0)

  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] px-5 py-24 sm:px-8 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 50%, color-mix(in srgb, var(--poker-gold) 14%, transparent), transparent 70%)',
        }}
      />

      <div className="landing-reveal relative mx-auto max-w-2xl text-center">
        <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-[var(--text-primary)]">
          La próxima mano la juegas sabiendo por qué
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
          {freeLevel
            ? `Empieza por ${freeLevel.title}, gratis y sin tarjeta: ${freeCourses} cursos y ${freeLessons} clases para dejar de improvisar en la mesa.`
            : 'Empieza por el primer nivel, gratis y sin tarjeta, y deja de improvisar en la mesa.'}
        </p>

        <Link
          to={isAuthenticated ? '/app' : '/login'}
          className="press mt-9 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-[#1a1206] shadow-[0_12px_40px_rgba(242,169,59,0.35)] transition-all hover:brightness-105"
          style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
        >
          {isAuthenticated ? 'Ir a la academia' : 'Crear mi cuenta gratis'}
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-5 text-[0.8125rem] text-[var(--text-muted)]">
          Sin permanencia · Cancelas cuando quieras · Tu progreso se queda contigo
        </p>
      </div>
    </section>
  )
}
