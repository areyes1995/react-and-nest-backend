// ──────────────────────────────────────────────
// LearnPathPage — la ruta de aprendizaje.
// Tres modos de vista: "Camino" (el camino vertical
// con un nodo por clase), "Lista" (estilo Udemy:
// cursos desplegables con la descripción de cada
// clase visible) e "Islas" (un archipiélago lateral:
// un mapa del tesoro que se recorre en horizontal;
// ver IslandMap.tsx).
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, List, Lock, Play, Route, Sailboat, Star } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { Icon, ProgressBar } from '@components/content'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { courseProgress, levelProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { courseMinutes } from '@features/academy/types'
import type { Course, Lesson } from '@features/academy/types'
import IslandMap from './IslandMap'
import { useAccess } from '@features/access/AccessContext'

type NodeState = 'done' | 'current' | 'locked' | 'available'
type ViewMode = 'path' | 'list' | 'islands'

const KIND_LABEL: Record<Lesson['kind'], string> = {
  lesson: 'Clase',
  video: 'Video',
  drill: 'Práctica',
  quiz: 'Quiz',
}

function PathNode({
  lesson,
  courseSlug,
  state,
  color,
  offset,
}: {
  lesson: Lesson
  courseSlug: string
  state: NodeState
  color: string
  offset: number
}) {
  const locked = state === 'locked'
  const icon =
    state === 'done' ? <Check className="w-5 h-5" strokeWidth={3} />
    : locked ? <Lock className="w-4 h-4" strokeWidth={2} />
    : <Play className="w-4 h-4 translate-x-0.5" fill="currentColor" strokeWidth={0} />

  const circle =
    state === 'done'
      ? { background: color, color: '#0b0c0f', borderColor: color }
      : state === 'current'
        ? { background: 'var(--poker-gold)', color: '#0b0c0f', borderColor: 'var(--poker-gold)' }
        : { background: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border)' }

  const body = (
    <div
      className="flex items-center gap-3 group"
      style={{ marginLeft: `${offset}px` }}
    >
      <span
        className={`grid place-items-center w-12 h-12 rounded-full border-4 shrink-0 transition-transform duration-200 ${
          locked ? '' : 'group-hover:scale-110'
        } ${state === 'current' ? 'ring-4 ring-[var(--poker-gold)]/25' : ''}`}
        style={circle}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            locked ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {lesson.title}
        </p>
        <p className="text-caption text-[var(--text-muted)]">
          {lesson.minutes} min · {lesson.xp} XP
          {state === 'current' && <span className="text-[var(--poker-gold)] font-semibold"> · Siguiente</span>}
        </p>
      </div>
    </div>
  )

  if (locked) return <div className="opacity-50 cursor-not-allowed">{body}</div>

  return (
    <Link to={`/app/classes/${courseSlug}/${lesson.slug}`} className="block">
      {body}
    </Link>
  )
}

/** Fila de clase en la vista lista: estado, título, descripción y meta. */
function LessonRow({
  lesson,
  courseSlug,
  state,
}: {
  lesson: Lesson
  courseSlug: string
  state: NodeState
}) {
  const locked = state === 'locked'

  const statusIcon =
    state === 'done' ? (
      <span className="grid place-items-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
        <Check className="w-4 h-4" strokeWidth={3} />
      </span>
    ) : state === 'current' ? (
      <span className="grid place-items-center w-7 h-7 rounded-full bg-[var(--poker-gold)] text-[#0b0c0f] shrink-0">
        <Play className="w-3.5 h-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
      </span>
    ) : locked ? (
      <span className="grid place-items-center w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] shrink-0">
        <Lock className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
    ) : (
      <span className="grid place-items-center w-7 h-7 rounded-full border border-[var(--border)] text-[var(--text-muted)] shrink-0">
        <Play className="w-3 h-3 translate-x-px" strokeWidth={2} />
      </span>
    )

  const content = (
    <div className={`flex items-start gap-3 px-5 py-4 ${locked ? 'opacity-50' : 'hover:bg-[var(--bg-surface)]'} transition`}>
      {statusIcon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-base font-medium text-[var(--text-primary)] truncate">{lesson.title}</p>
          {state === 'current' && (
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--poker-gold)] shrink-0">
              Siguiente
            </span>
          )}
        </div>
        {/* Descripción siempre visible, como en Udemy */}
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-2">
          {lesson.summary}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-[var(--border)] px-1.5 py-px text-caption font-semibold text-[var(--text-secondary)]">
            {KIND_LABEL[lesson.kind]}
          </span>
          {lesson.minutes} min · {lesson.xp} XP
        </p>
      </div>
      {!locked && <ChevronRight className="w-4 h-4 mt-1 text-[var(--text-muted)] shrink-0" strokeWidth={2} />}
    </div>
  )

  if (locked) return <div className="cursor-not-allowed">{content}</div>

  return (
    <Link to={`/app/classes/${courseSlug}/${lesson.slug}`} className="block">
      {content}
    </Link>
  )
}

/** Curso desplegable estilo Udemy: cabecera con progreso y lista de clases. */
function CourseAccordion({
  course,
  levelColor,
  open,
  onToggle,
  completed,
  currentLessonId,
  locked,
}: {
  course: Course
  levelColor: string
  open: boolean
  onToggle: () => void
  completed: Record<string, unknown>
  currentLessonId: string
  locked: boolean
}) {
  const stats = courseProgress(course, completed)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[var(--bg-surface)] transition"
      >
        <span
          className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: `color-mix(in srgb, ${levelColor} 14%, transparent)`, color: levelColor }}
        >
          <Icon name={course.icon} className="w-4 h-4" strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--text-primary)] truncate">{course.title}</span>
            {locked && <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={2} />}
          </span>
          <span className="block text-xs text-[var(--text-muted)] mt-0.5">
            {stats.done}/{stats.total} clases · {courseMinutes(course)} min · {Math.round(stats.ratio * 100)}%
          </span>
          <ProgressBar value={stats.ratio} color={levelColor} className="mt-2" />
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {course.lessons.map(lesson => {
            const isDone = Boolean(completed[lesson.id])
            const isCurrent = currentLessonId === lesson.id
            const state: NodeState = locked ? 'locked' : isDone ? 'done' : isCurrent ? 'current' : 'available'
            return <LessonRow key={lesson.id} lesson={lesson} courseSlug={course.slug} state={state} />
          })}
        </div>
      )}
    </div>
  )
}

export default function LearnPathPage() {
  const { progress } = useStudentProgress()
  const completed = progress.lessons
  const { levels, path, resumeStep } = useCurriculum()
  const { isLevelUnlocked } = useAccess()
  // `CurriculumGate` garantiza al menos una clase.
  const current = resumeStep(completed)!
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem('learn-path-view')
      return stored === 'path' || stored === 'list' || stored === 'islands' ? stored : 'islands'
    } catch {
      return 'islands'
    }
  })
  /** Cursos abiertos en la vista lista: por defecto, el que contiene la siguiente clase. */
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>(() => {
    const step = path.find(s => !completed[s.lesson.id]) ?? path[path.length - 1]
    return step ? { [step.course.id]: true } : {}
  })

  /** Desplazamiento en zigzag: da forma de camino sin necesitar SVG. */
  const offsetFor = (index: number) => [0, 28, 44, 28][index % 4]

  const setViewAndPersist = (mode: ViewMode) => {
    setView(mode)
    try {
      localStorage.setItem('learn-path-view', mode)
    } catch {
      /* almacenamiento no disponible: la vista solo vive en memoria */
    }
  }

  const toggleCourse = (courseId: string) =>
    setOpenCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }))

  return (
    <AcademyPage
      title="Tu ruta de aprendizaje"
      subtitle={`${Object.keys(completed).length} de ${path.length} clases completadas`}
    >
      {/* ── Selector de vista ── */}
      <div className={`mx-auto mb-4 flex justify-end ${view === 'islands' ? '' : 'max-w-4xl'}`}>
        <div
          role="group"
          aria-label="Modo de vista"
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-1 gap-1"
        >
          {(
            [
              { id: 'path', label: 'Camino', icon: Route },
              { id: 'list', label: 'Lista', icon: List },
              { id: 'islands', label: 'Islas', icon: Sailboat },
            ] as const
          ).map(option => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => setViewAndPersist(option.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                view === option.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <option.icon className="w-3.5 h-3.5" strokeWidth={2} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'islands' ? (
        /* ── Archipiélago lateral: la cámara navega sola ── */
        <IslandMap completed={completed} currentLessonId={current.lesson.id} />
      ) : (
      <div className="stagger mx-auto max-w-4xl space-y-10">
        {levels.map(level => {
          const stats = levelProgress(level, completed)
          const unlocked = isLevelUnlocked(level.id, completed)

          return (
            <section key={level.id} className="space-y-5">
              {/* ── Cabecera del nivel ── */}
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: `color-mix(in srgb, ${level.color} 30%, transparent)`,
                  background: `color-mix(in srgb, ${level.color} 7%, var(--bg-panel))`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                    style={{ background: `color-mix(in srgb, ${level.color} 18%, transparent)`, color: level.color }}
                  >
                    <Icon name={level.icon} className="w-5 h-5" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[var(--text-primary)]">{level.title}</h2>
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />}
                      {stats.ratio >= 1 && <Star className="w-4 h-4" style={{ color: level.color }} fill="currentColor" strokeWidth={0} />}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{level.subtitle}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: level.color }}>
                    {Math.round(stats.ratio * 100)}%
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                  {level.description}
                </p>
                <ProgressBar value={stats.ratio} color={level.color} className="mt-3" />

                {!unlocked && (
                  <p className="text-caption text-[var(--text-muted)] mt-2">
                    Completa el 60% del nivel anterior para desbloquearlo.
                  </p>
                )}
              </div>

              {view === 'path' ? (
                /* ── Camino de clases ── */
                <div className="space-y-6 pl-2">
                  {level.courses.map(course => (
                    <div key={course.id} className="space-y-3">
                      <Link
                        to={`/app/classes/${course.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        <Icon name={course.icon} className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {course.title}
                      </Link>

                      <div className="relative space-y-4 pl-1">
                        {/* Línea vertical del camino */}
                        <span
                          className="absolute left-6 top-2 bottom-2 w-px"
                          style={{ background: `color-mix(in srgb, ${level.color} 28%, transparent)` }}
                          aria-hidden
                        />
                        {course.lessons.map((lesson, index) => {
                          const isDone = Boolean(completed[lesson.id])
                          const isCurrent = current.lesson.id === lesson.id
                          const state: NodeState = !unlocked
                            ? 'locked'
                            : isDone
                              ? 'done'
                              : isCurrent
                                ? 'current'
                                : 'available'

                          return (
                            <div key={lesson.id} className="relative">
                              <PathNode
                                lesson={lesson}
                                courseSlug={course.slug}
                                state={state}
                                color={level.color}
                                offset={offsetFor(index)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── Lista desplegable estilo Udemy ── */
                <div className="space-y-3">
                  {level.courses.map(course => (
                    <CourseAccordion
                      key={course.id}
                      course={course}
                      levelColor={level.color}
                      open={Boolean(openCourses[course.id])}
                      onToggle={() => toggleCourse(course.id)}
                      completed={completed}
                      currentLessonId={current.lesson.id}
                      locked={!unlocked}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
      )}
    </AcademyPage>
  )
}
