// ──────────────────────────────────────────────
// CoursePage — portada de un curso, al estilo
// Udemy: cabecera con lo esencial, "Lo que
// aprenderás", requisitos y temario a la izquierda,
// y a la derecha la tarjeta fija con el botón de
// empezar/continuar y lo que incluye el curso.
// ──────────────────────────────────────────────

import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, CircleHelp, Clock, Crown, ListChecks, MonitorPlay, Play, Spade, Swords, Trophy, Zap } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { Icon, LessonCard, LevelBadge, ProgressBar } from '@components/content'
import { FormatBadge } from '@components/content'
import { WhatYouLearn } from '@components/showcase'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { useAcademyContent } from '@features/academy/ContentContext'
import { courseProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { courseMinutes, courseXp } from '@features/academy/types'
import { formatDuration } from '@features/academy/showcase'
import { useAccess } from '@features/access/AccessContext'

export default function CoursePage() {
  const { courseSlug } = useParams()
  const { progress } = useStudentProgress()
  const { isLessonPublished } = useAcademyContent()
  const { courses: allCourses, findCourse } = useCurriculum()
  const { canOpenCourse } = useAccess()
  const course = courseSlug ? findCourse(courseSlug) : undefined

  if (!course) return <Navigate to="/app/classes" replace />

  // El temario muestra solo lo publicado: una clase retirada desde Gestión de
  // contenido desaparece del listado sin tocar el currículo.
  const lessons = course.lessons.filter(lesson => isLessonPublished(lesson.id))

  const stats = courseProgress(course, progress.lessons)
  const nextLesson = lessons.find(lesson => !progress.lessons[lesson.id]) ?? lessons[0]
  const finished = stats.ratio >= 1

  const courseIndex = allCourses.findIndex(c => c.id === course.id)
  const previousCourse = courseIndex > 0 ? allCourses[courseIndex - 1] : undefined
  const nextCourse = allCourses[courseIndex + 1]

  const drills = course.lessons.filter(l => l.kind === 'drill' || l.blocks.some(b => b.type === 'drill')).length
  const quizzes = course.lessons.filter(l => l.blocks.some(b => b.type === 'quiz')).length
  const spots = course.lessons.flatMap(l => l.blocks).filter(b => b.type === 'spot').length
  const remainingMinutes = course.lessons
    .filter(l => !progress.lessons[l.id])
    .reduce((sum, l) => sum + l.minutes, 0)

  // Curso de pago desde el plan gratis: el temario se ve, las clases no.
  const paid = !canOpenCourse(course)
  const cta = paid ? (
    <Link
      to="/checkout/premium"
      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition hover:brightness-110 press"
      style={{ background: 'var(--poker-gold)', boxShadow: '0 4px 0 0 #b7791f' }}
    >
      <Crown className="w-4 h-4" strokeWidth={2} />
      Suscríbete para verlo
    </Link>
  ) : nextLesson ? (
    <Link
      to={`/app/classes/${course.slug}/${nextLesson.slug}`}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition hover:brightness-110 press"
      style={{ background: 'var(--poker-gold)', boxShadow: '0 4px 0 0 #b7791f' }}
    >
      {stats.done === 0 ? (
        <>
          <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          Empezar curso
        </>
      ) : finished ? (
        <>
          Repasar <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </>
      ) : (
        <>
          Continuar <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </>
      )}
    </Link>
  ) : null

  return (
    <AcademyPage title={course.title} subtitle={course.summary}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ── Cabecera tipo Udemy ── */}
        <header
          className="rounded-2xl border border-[var(--border)] p-5 sm:p-7"
          style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--poker-gold) 10%, var(--bg-panel)), var(--bg-panel) 65%)' }}
        >
          <div className="flex items-start gap-4">
            <span className="hidden sm:grid place-items-center w-14 h-14 rounded-2xl bg-[var(--bg-surface)] text-[var(--poker-gold)] shrink-0">
              <Icon name={course.icon} className="w-7 h-7" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <LevelBadge level={course.level} />
                {(course.formats ?? []).map(format => (
                  <FormatBadge key={format} format={format} />
                ))}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">{course.title}</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--text-secondary)]">{course.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                  {formatDuration(courseMinutes(course))}
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" strokeWidth={2} />
                  {course.lessons.length} clases
                </span>
                <span className="flex items-center gap-1 font-semibold text-[var(--poker-gold)]">
                  <Zap className="w-3.5 h-3.5" strokeWidth={2.4} />
                  {courseXp(course)} XP
                </span>
              </div>
              {stats.done > 0 && (
                <div className="mt-4 max-w-md">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {finished ? '¡Curso completado!' : `Te quedan ${formatDuration(remainingMinutes)}`}
                    </span>
                    <span className="tabular-nums text-[var(--text-muted)]">
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  <ProgressBar value={stats.ratio} />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="stagger space-y-6 min-w-0">
            <WhatYouLearn
              title="Lo que aprenderás"
              items={course.outcomes.map(text => ({ text, learned: finished }))}
            />

            {/* ── Requisitos ── */}
            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Requisitos</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)] marker:text-[var(--text-muted)]">
                {previousCourse ? (
                  <li>
                    Haber hecho{' '}
                    <Link to={`/app/classes/${previousCourse.slug}`} className="font-semibold text-[var(--poker-gold)] hover:underline">
                      {previousCourse.title}
                    </Link>{' '}
                    (o saber ya lo que enseña).
                  </li>
                ) : (
                  <li>Ninguno: empieza desde cero, sin haber jugado nunca.</li>
                )}
                <li>Un navegador y ganas de jugar unas manos.</li>
              </ul>
            </section>

            {/* ── Temario ── */}
            <section className="space-y-2.5">
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Contenido del curso</h2>
                <span className="text-xs text-[var(--text-muted)]">
                  {lessons.length} clases · {formatDuration(courseMinutes(course))}
                </span>
              </div>
              {lessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  courseSlug={course.slug}
                  completed={Boolean(progress.lessons[lesson.id])}
                  index={index + 1}
                />
              ))}
              {lessons.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                  Este curso todavía no tiene clases publicadas.
                </p>
              )}
            </section>

            {nextCourse && finished && (
              <Link
                to={`/app/classes/${nextCourse.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-[#f2a93b]/40 bg-[#f2a93b]/10 p-4 transition hover:bg-[#f2a93b]/15"
              >
                <Trophy className="w-6 h-6 text-[var(--poker-gold)] shrink-0" strokeWidth={2} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-[var(--poker-gold)]">Siguiente curso</span>
                  <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{nextCourse.title}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--poker-gold)]" strokeWidth={2.5} />
              </Link>
            )}
          </div>

          {/* ── Tarjeta lateral fija ── */}
          <aside className="lg:sticky lg:top-0 self-start space-y-4">
            <div className="rounded-2xl border border-[var(--border-active)] bg-[var(--bg-panel)] p-5 shadow-xl shadow-black/10">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {stats.done === 0
                  ? `La primera clase dura ${nextLesson?.minutes ?? 0} min. Empieza ahora.`
                  : finished
                    ? 'Lo tienes todo hecho. ¿Un repaso?'
                    : `Vas por la clase ${stats.done + 1} de ${stats.total}`}
              </p>
              <div className="mt-3">{cta}</div>

              <h3 className="mt-5 text-sm font-extrabold text-[var(--text-primary)]">Este curso incluye</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2.5">
                  <MonitorPlay className="w-4 h-4 text-[var(--text-primary)] shrink-0" strokeWidth={2} />
                  {formatDuration(courseMinutes(course))} en {course.lessons.length} clases
                </li>
                {drills > 0 && (
                  <li className="flex items-center gap-2.5">
                    <Spade className="w-4 h-4 text-[var(--text-primary)] shrink-0" strokeWidth={2} />
                    {drills} {drills === 1 ? 'práctica' : 'prácticas'} en la mesa
                  </li>
                )}
                {quizzes > 0 && (
                  <li className="flex items-center gap-2.5">
                    <CircleHelp className="w-4 h-4 text-[var(--text-primary)] shrink-0" strokeWidth={2} />
                    {quizzes} {quizzes === 1 ? 'test' : 'tests'} con explicación
                  </li>
                )}
                {spots > 0 && (
                  <li className="flex items-center gap-2.5">
                    <Swords className="w-4 h-4 text-[var(--text-primary)] shrink-0" strokeWidth={2} />
                    {spots} situaciones de mano resueltas
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[var(--poker-gold)] shrink-0" strokeWidth={2.4} />
                  {courseXp(course)} XP para subir de nivel
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AcademyPage>
  )
}
