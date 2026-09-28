// ──────────────────────────────────────────────
// LessonPage — la clase en sí.
//
// Distribución tipo Udemy: la clase en una columna
// de lectura cómoda y, en pantallas anchas, el
// temario del curso a la derecha con el estado de
// cada clase y la meta del día. En pantallas
// estrechas el temario baja al final.
//
// Arriba de la clase va "Escuchar la clase" (lectura
// en voz alta). Completarla suma XP una sola vez y
// abre la celebración con el botón a la siguiente.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock, Lock, Play, Spade, Zap } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import {
  DailyGoal,
  Icon,
  LessonCompleteModal,
  LessonVideo,
  ProgressBar,
  SaveButton,
} from '@components/content'
import { LessonStepper } from '@components/guide'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { useAcademyContent } from '@features/academy/ContentContext'
import { lessonTarget } from '@features/saved'
import { courseProgress } from '@features/academy/curriculum'
import { useCurriculum, useSourceLesson } from '@features/academy/CurriculumContext'
import type { Course } from '@features/academy/types'
import { useAccess } from '@features/access/AccessContext'

const KIND_LABEL = { lesson: 'Clase', video: 'Video', drill: 'Práctica', quiz: 'Quiz' } as const

/** Temario del curso, como la columna "Contenido del curso" de Udemy. */
function CourseSyllabus({
  course,
  currentLessonId,
  completed,
  locked,
}: {
  course: Course
  currentLessonId: string
  completed: Record<string, unknown>
  locked: boolean
}) {
  const stats = courseProgress(course, completed)
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <p className="text-caption font-bold uppercase tracking-wide text-[var(--text-muted)]">Contenido del curso</p>
        <Link
          to={`/app/classes/${course.slug}`}
          className="mt-0.5 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] hover:text-[var(--poker-gold)] transition"
        >
          <Icon name={course.icon} className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{course.title}</span>
        </Link>
        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={stats.ratio} className="flex-1" />
          <span className="text-caption font-semibold tabular-nums text-[var(--text-muted)]">
            {stats.done}/{stats.total}
          </span>
        </div>
      </div>

      <ol className="max-h-[52vh] overflow-y-auto py-1">
        {course.lessons.map((lesson, index) => {
          const isCurrent = lesson.id === currentLessonId
          const isDone = Boolean(completed[lesson.id])
          return (
            <li key={lesson.id}>
              <Link
                to={`/app/classes/${course.slug}/${lesson.slug}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex items-start gap-3 px-4 py-2.5 transition ${
                  isCurrent
                    ? 'bg-[#f2a93b]/10 border-l-[3px] border-[var(--poker-gold)] pl-[0.8125rem]'
                    : 'hover:bg-[var(--bg-surface)] border-l-[3px] border-transparent pl-[0.8125rem]'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {isDone ? (
                    <span className="grid place-items-center w-5 h-5 rounded-full bg-emerald-500 text-white">
                      <Check className="w-3 h-3" strokeWidth={3.5} />
                    </span>
                  ) : isCurrent ? (
                    <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--poker-gold)] text-black">
                      <Play className="w-2.5 h-2.5 translate-x-px" fill="currentColor" strokeWidth={0} />
                    </span>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
                  ) : (
                    <span className="grid place-items-center w-5 h-5 rounded-full border-2 border-[var(--border-active)] text-micro font-bold text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[0.8125rem] leading-snug ${
                      isCurrent ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-caption text-[var(--text-muted)]">
                    {KIND_LABEL[lesson.kind]} · {lesson.minutes} min · {lesson.xp} XP
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

interface Celebration {
  xpGained: number
  todayBefore: number
  levelBefore: number
  quiz: { correct: number; total: number } | null
}

export default function LessonPage() {
  const { courseSlug, lessonSlug } = useParams()
  const navigate = useNavigate()
  const { progress, level, today, completeLesson, isLessonComplete } = useStudentProgress()
  const { lessonVideo, isLessonPublished } = useAcademyContent()
  const { findCourse, findLesson, findLessonById, nextStep, previousStep } = useCurriculum()
  // El 60% solo cuenta si el estudiante eligió el desbloqueo progresivo.
  const { isLevelUnlocked } = useAccess()

  // El resultado va atado a su clase: al pasar a la siguiente (misma ruta,
  // mismo componente) no debe arrastrarse.
  const [quiz, setQuiz] = useState<{ lessonId: string; correct: number; total: number } | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  const course = courseSlug ? findCourse(courseSlug) : undefined
  const lesson = courseSlug && lessonSlug ? findLesson(courseSlug, lessonSlug) : undefined
  // En español: con ella se escribe el guion de "Escuchar la clase".
  const sourceLesson = useSourceLesson(lesson?.id)

  if (!course || !lesson) return <Navigate to="/app/classes" replace />

  const quizResult = quiz && quiz.lessonId === lesson.id ? { correct: quiz.correct, total: quiz.total } : null
  const completed = isLessonComplete(lesson.id)
  const video = lessonVideo(lesson.id)
  const published = isLessonPublished(lesson.id)
  const stats = courseProgress(course, progress.lessons)
  const previous = previousStep(lesson.id)
  const next = nextStep(lesson.id)
  const levelId = findLessonById(lesson.id)?.level.id
  const levelLocked = levelId ? !isLevelUnlocked(levelId, progress.lessons) : false
  const nextHref = next ? `/app/classes/${next.course.slug}/${next.lesson.slug}` : undefined

  const finish = () => {
    if (completed) {
      // Repaso: sin recompensa nueva, directo a la siguiente.
      if (nextHref) navigate(nextHref)
      return
    }
    setCelebration({
      xpGained: lesson.xp,
      todayBefore: today.xp,
      levelBefore: level.level,
      quiz: quizResult,
    })
    completeLesson(lesson.id, lesson.xp, quizResult ?? undefined)
  }

  return (
    <AcademyPage
      title={lesson.title}
      subtitle={`${course.title} · ${lesson.minutes} min${video ? ' · con video' : ''}`}
      actions={
        <div className="flex items-center gap-2">
          {/* La clase se puede llevar a la mesa en cualquier momento: la mesa en
              vivo con estos mismos apartados al lado. */}
          <Link
            to={`/app/classes/${course.slug}/${lesson.slug}/practica`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-110"
            style={{ background: 'var(--poker-gold)' }}
          >
            <Spade className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            <span className="hidden sm:inline">Practicar en la mesa</span>
            <span className="sm:hidden">Mesa</span>
          </Link>

          <SaveButton target={lessonTarget(lesson, course)} label="Guardar clase" />
        </div>
      }
    >
      <div className="mx-auto max-w-6xl xl:grid xl:grid-cols-[minmax(0,1fr)_330px] xl:gap-8">
        <article className="mx-auto w-full max-w-3xl space-y-6 min-w-0">
          {/* ── Cabecera de la clase ── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[var(--bg-surface)] px-2.5 py-1 font-semibold text-[var(--text-secondary)]">
                {KIND_LABEL[lesson.kind]}
              </span>
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                {lesson.minutes} min
              </span>
              <span className="flex items-center gap-1 font-semibold text-[var(--poker-gold)]">
                <Zap className="w-3.5 h-3.5" strokeWidth={2.4} />
                {completed ? 'XP ya ganado' : `+${lesson.xp} XP al completarla`}
              </span>
              {completed && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-400">
                  <Check className="w-3 h-3" strokeWidth={3} />
                  Completada
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">{lesson.summary}</p>

            {/* Progreso del curso (en pantallas anchas lo cuenta el temario) */}
            <div className="space-y-1.5 xl:hidden">
              <div className="flex items-center justify-between text-caption text-[var(--text-muted)]">
                <Link to={`/app/classes/${course.slug}`} className="hover:text-[var(--text-primary)] transition">
                  {course.title}
                </Link>
                <span className="tabular-nums">
                  {stats.done}/{stats.total}
                </span>
              </div>
              <ProgressBar value={stats.ratio} />
            </div>
          </div>

          {/* ── Video de la clase ──
              Opcional por diseño: solo aparece si un administrador lo activó en
              Gestión de contenido. Sin él, la clase es exactamente la de antes. */}
          {video && <LessonVideo setting={video} lessonTitle={lesson.title} />}

          {/* Clase retirada de la publicación: se avisa en vez de esconderla, que
              el estudiante puede haber llegado por un enlace guardado. */}
          {!published && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Esta clase está despublicada: la ves porque tienes acceso directo, pero
              no aparece en el catálogo.
            </p>
          )}

          {/* El stepper trocea la clase por sus apartados, lleva el reproductor
              de voz y deja el botón de completar al final del último paso. */}
          <LessonStepper
            key={lesson.id}
            blocks={lesson.blocks}
            sourceBlocks={sourceLesson?.blocks}
            onQuizComplete={result => setQuiz({ lessonId: lesson.id, ...result })}
            practicePath={`/app/classes/${course.slug}/${lesson.slug}/practica`}
            onFinish={finish}
            completed={completed}
            lessonTitle={sourceLesson?.title ?? lesson.title}
            inlineTables={lesson.kind !== 'drill'}
            basicTables={levelId === 'beginner'}
            finishLabel={
              completed
                ? next
                  ? 'Clase completada · Ir a la siguiente'
                  : 'Clase completada'
                : `Completar clase y ganar ${lesson.xp} XP`
            }
          />

          {/* ── Resultado del test ── */}
          {quizResult && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 text-sm">
              <p className="text-[var(--text-primary)] font-medium">
                Has acertado {quizResult.correct} de {quizResult.total}.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {quizResult.correct === quizResult.total
                  ? 'Perfecto. Puedes seguir a la siguiente clase.'
                  : 'Revisa las explicaciones antes de continuar: los fallos de aquí se pagan en la mesa.'}
              </p>
            </div>
          )}

          {/* ── Clase anterior y siguiente ── */}
          <div className="pt-2 border-t border-[var(--border)]">
            <div className="grid grid-cols-2 gap-3">
              {previous ? (
                <Link
                  to={`/app/classes/${previous.course.slug}/${previous.lesson.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--border-active)] min-w-0"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0 text-[var(--text-muted)] transition group-hover:-translate-x-0.5" strokeWidth={2} />
                  <span className="min-w-0">
                    <span className="block text-mini font-bold uppercase tracking-wide text-[var(--text-muted)]">Anterior</span>
                    <span className="block truncate text-xs font-semibold text-[var(--text-secondary)]">{previous.lesson.title}</span>
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next ? (
                <Link
                  to={`/app/classes/${next.course.slug}/${next.lesson.slug}`}
                  className="group flex items-center justify-end gap-2 rounded-xl border border-[var(--border)] p-3 text-right transition hover:border-[var(--border-active)] min-w-0"
                >
                  <span className="min-w-0">
                    <span className="block text-mini font-bold uppercase tracking-wide text-[var(--text-muted)]">Siguiente</span>
                    <span className="block truncate text-xs font-semibold text-[var(--text-secondary)]">{next.lesson.title}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
              ) : (
                <span className="flex items-center justify-end gap-1.5 text-xs text-[var(--poker-gold)]">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Última clase de la ruta
                </span>
              )}
            </div>
          </div>
        </article>

        {/* ── Columna lateral: temario y meta del día ── */}
        <aside className="mt-8 space-y-4 xl:mt-0">
          <div className="space-y-4 xl:sticky xl:top-0">
            <CourseSyllabus
              course={course}
              currentLessonId={lesson.id}
              completed={progress.lessons}
              locked={levelLocked}
            />
            <DailyGoal compact />
          </div>
        </aside>
      </div>

      {celebration && (
        <LessonCompleteModal
          lessonTitle={lesson.title}
          xpGained={celebration.xpGained}
          todayBefore={celebration.todayBefore}
          todayAfter={today.xp}
          dailyGoal={today.goal}
          streak={progress.streak}
          levelBefore={celebration.levelBefore}
          levelAfter={level.level}
          levelRatio={level.current / level.needed}
          quiz={celebration.quiz}
          next={
            next && nextHref
              ? {
                  title: next.lesson.title,
                  href: nextHref,
                  courseChanged: next.course.id !== course.id,
                  courseTitle: next.course.title,
                }
              : undefined
          }
          onClose={() => setCelebration(null)}
        />
      )}
    </AcademyPage>
  )
}
