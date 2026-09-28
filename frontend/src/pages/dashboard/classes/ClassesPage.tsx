// ──────────────────────────────────────────────
// ClassesPage — catálogo completo de clases.
// Es la vista de "quiero encontrar algo concreto":
// filtro por nivel, búsqueda por texto y todos los
// cursos con su progreso. La ruta secuencial vive
// en /app/learn; aquí manda la exploración.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { CourseCard } from '@components/content'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { useAcademyContent } from '@features/academy/ContentContext'
import { courseProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { courseMinutes } from '@features/academy/types'
import type { LevelId } from '@features/academy/types'
import { useAccess } from '@features/access/AccessContext'

export default function ClassesPage() {
  const [params, setParams] = useSearchParams()
  const { progress } = useStudentProgress()
  const { isCoursePublished } = useAcademyContent()
  const [query, setQuery] = useState('')
  const { levels: allLevels, courses: allCourses, lessons: allLessons } = useCurriculum()
  const { isLevelUnlocked, canOpenCourse } = useAccess()

  const filters: { id: LevelId | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos' },
    ...allLevels.map(level => ({ id: level.id, label: level.title })),
  ]

  const active = (params.get('nivel') as LevelId | null) ?? 'all'

  const levels = useMemo(
    () => (active === 'all' ? allLevels : allLevels.filter(level => level.id === active)),
    [active, allLevels],
  )

  const matches = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase())


  return (
    <AcademyPage
      title="Clases"
      subtitle={`${allLessons.length} clases repartidas en ${allCourses.length} cursos y ${allLevels.length} niveles`}
      actions={
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar curso…"
            className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-7">
        {/* ── Filtro por nivel ── */}
        <div className="flex flex-wrap gap-1.5">
          {filters.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                if (filter.id === 'all') setParams({})
                else setParams({ nivel: filter.id })
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                active === filter.id
                  ? 'bg-[var(--poker-gold)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* ── Cursos por nivel ── */}
        {levels.map(level => {
          // Un curso despublicado desde Gestión de contenido desaparece del
          // catálogo, pero sigue en el currículo: la decisión es reversible.
          const courses = level.courses.filter(
            course =>
              isCoursePublished(course.slug) &&
              (matches(course.title) || matches(course.summary)),
          )
          if (courses.length === 0) return null
          const unlocked = isLevelUnlocked(level.id, progress.lessons)

          return (
            <section key={level.id} className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{level.title}</h2>
                <span className="text-xs text-[var(--text-muted)]">{level.subtitle}</span>
              </div>

              <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={courseProgress(course, progress.lessons)}
                    minutes={courseMinutes(course)}
                    locked={!unlocked}
                    premium={!canOpenCourse(course)}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {levels.every(level =>
          level.courses.every(
            course =>
              !isCoursePublished(course.slug) ||
              (!matches(course.title) && !matches(course.summary)),
          ),
        ) && (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">
            No hay cursos que coincidan con «{query}».
          </p>
        )}
      </div>
    </AcademyPage>
  )
}
