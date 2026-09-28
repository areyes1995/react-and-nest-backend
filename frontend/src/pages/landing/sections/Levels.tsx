// ──────────────────────────────────────────────
// Levels — los niveles del programa como fichas grandes.
// El equivalente a la fila de marcas de una portada
// de streaming: cuatro puertas de entrada, cada una
// con su color, que resumen todo el catálogo de un
// vistazo. Las cifras salen del currículo real.
// ──────────────────────────────────────────────

import { useCurriculum } from '@features/academy/CurriculumContext'
import { courseMinutes } from '@features/academy/types'
import { formatDuration } from '@features/academy/showcase'
import { Section, SectionHead } from './shared'

export default function Levels() {
  const { levels } = useCurriculum()

  return (
    <Section id="programa">
      <SectionHead
        eyebrow="El programa"
        title="Niveles encadenados, sin huecos"
        subtitle="Cada nivel se apoya en el anterior. No hay saltos: cuando llegas a rangos ya dominas las pot odds, porque las practicaste treinta manos antes."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {levels.map((level, index) => {
          const lessons = level.courses.reduce((sum, course) => sum + course.lessons.length, 0)
          const minutes = level.courses.reduce((sum, course) => sum + courseMinutes(course), 0)

          return (
            <article
              key={level.id}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 transition-colors duration-300 hover:border-[var(--border-active)]"
            >
              {/* Halo del color del nivel */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.18] blur-3xl transition-opacity duration-300 group-hover:opacity-30"
                style={{ background: level.color }}
              />

              <div className="relative flex items-center gap-3">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-[0.8125rem] font-extrabold text-black"
                  style={{ background: level.color }}
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[var(--text-primary)]">
                    {level.title}
                  </h3>
                  <p
                    className="text-[0.75rem] font-semibold uppercase tracking-wide"
                    style={{ color: level.color }}
                  >
                    {level.subtitle}
                  </p>
                </div>
              </div>

              <p className="relative mt-4 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
                {level.description}
              </p>

              <div className="relative mt-5 flex flex-wrap gap-2">
                {[
                  `${level.courses.length} cursos`,
                  `${lessons} clases`,
                  formatDuration(minutes),
                ].map(chip => (
                  <span
                    key={chip}
                    className="rounded-full border border-[var(--border-active)] bg-[var(--bg-surface)] px-2.5 py-1 text-caption font-semibold text-[var(--text-secondary)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
