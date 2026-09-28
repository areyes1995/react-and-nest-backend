// ──────────────────────────────────────────────
// StudentHome — el panel del estudiante.
// Una sola acción dominante ("continuar donde lo
// dejaste") y debajo el contexto: progreso por
// nivel, racha, estadísticas de mesa y contenido
// recomendado. Nada de datos sin acción asociada.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Play,
  Spade,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { AnimatedNumber, DailyGoal, Icon, ProgressBar, ArticleCard, VideoCard } from '@components/content'
import { GuideChecklist } from '@components/guide'
import { AlmostThere, DailyChallenge, ProgramIncludes, WhatYouLearn } from '@components/showcase'
import { isSkillLearned, skillsOf } from '@features/academy/showcase'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { courseProgress, levelProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'
import { ARTICLES } from '@features/articles/data'
import { VIDEOS } from '@features/videos/data'
import { useTranslatedContent } from '@services/translate'
import { useAccess } from '@features/access/AccessContext'
import { FreePlanBanner } from '@components/access'

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5">
      <div className="flex items-center gap-2 mb-1.5 text-[var(--text-muted)]">
        {icon}
        <span className="text-caption uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      {hint && <p className="text-caption text-[var(--text-muted)] mt-0.5">{hint}</p>}
    </div>
  )
}

export default function StudentHome() {
  const { progress, level } = useStudentProgress()
  const curriculum = useCurriculum()
  const articles = useTranslatedContent(ARTICLES)
  const videos = useTranslatedContent(VIDEOS)
  const { levels } = curriculum
  const { isLevelUnlocked } = useAccess()
  // `CurriculumGate` garantiza al menos una clase.
  const next = curriculum.resumeStep(progress.lessons)!
  const nextCourse = courseProgress(next.course, progress.lessons)

  const completedCount = Object.keys(progress.lessons).length
  const winRate =
    progress.stats.handsPlayed > 0
      ? Math.round((progress.stats.handsWon / progress.stats.handsPlayed) * 100)
      : 0
  const decisions =
    progress.stats.goodDecisions + progress.stats.okDecisions + progress.stats.mistakes
  const accuracy = decisions > 0 ? Math.round((progress.stats.goodDecisions / decisions) * 100) : 0

  return (
    <AcademyPage
      title="Tu academia"
      subtitle={`Nivel ${level.level} · ${progress.xp} XP acumulados`}
    >
      <div className="stagger space-y-6">
        {/* Plan gratis: qué incluye y cómo abrir el resto. */}
        <FreePlanBanner />

        {/* ── Acción principal ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Link
            to={`/app/classes/${next.course.slug}/${next.lesson.slug}`}
            className="lg:col-span-2 group hover-lift press relative overflow-hidden rounded-2xl border border-[var(--poker-gold)]/30 p-5 transition-all duration-200 hover:border-[var(--poker-gold)]/60"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--poker-gold) 12%, var(--bg-panel)) 0%, var(--bg-panel) 60%)',
            }}
          >
            <span className="text-caption uppercase tracking-wide text-[var(--poker-gold)] font-semibold">
              {completedCount === 0 ? 'Empieza por aquí' : 'Continúa donde lo dejaste'}
            </span>
            <h2 className="mt-1.5 text-xl font-bold text-[var(--text-primary)]">
              {next.lesson.title}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              {next.lesson.summary}
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>{next.level.title}</span>
              <span>·</span>
              <span>{next.course.title}</span>
              <span>·</span>
              <span>{next.lesson.minutes} min</span>
              <span className="flex items-center gap-1 text-[var(--poker-gold)]">
                <Zap className="w-3 h-3" strokeWidth={2} />
                {next.lesson.xp} XP
              </span>
            </div>

            {/* Avance del curso: ver lo poco que falta empuja a terminarlo. */}
            <div className="mt-4 flex max-w-md items-center gap-3">
              <ProgressBar value={nextCourse.ratio} className="flex-1" />
              <span className="text-caption font-semibold tabular-nums text-[var(--text-muted)]">
                {nextCourse.done}/{nextCourse.total} del curso
              </span>
            </div>

            <span className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide text-black transition-transform duration-200 group-hover:translate-x-1"
              style={{ background: 'var(--poker-gold)', boxShadow: '0 4px 0 0 #b7791f' }}
            >
              <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
              {completedCount === 0 ? 'Empezar' : 'Continuar'}
            </span>
          </Link>

          {/* ── Meta del día y semana de racha: la razón para volver mañana ── */}
          <DailyGoal />
        </div>

        {/* ── Retos del día (urgencia) y lo que está a punto de caer (recompensa) ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DailyChallenge nextLessonHref={`/app/classes/${next.course.slug}/${next.lesson.slug}`} />
          </div>
          <AlmostThere />
        </div>

        {/* ── El programa, al estilo Udemy: qué vas a saber hacer y qué incluye ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WhatYouLearn
              trackProgress
              initialVisible={8}
              items={skillsOf(curriculum).map(skill => ({
                text: skill.text,
                hint: skill.course.title,
                learned: isSkillLearned(skill, progress.lessons),
              }))}
            />
          </div>
          <ProgramIncludes />
        </div>

        {/* ── Primeros pasos ── debajo de la acción principal: guía sin tapar
            el "continuar". Se retira solo cuando el onboarding termina. */}
        <GuideChecklist />

        {/* ── Estadísticas ── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<Target className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Clases"
            value={<AnimatedNumber value={completedCount} />}
            hint="completadas"
          />
          <StatTile
            icon={<Spade className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Manos"
            value={<AnimatedNumber value={progress.stats.handsPlayed} />}
            hint={`${winRate}% ganadas`}
          />
          <StatTile
            icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Aciertos"
            value={<AnimatedNumber value={accuracy} format={n => `${n}%`} />}
            hint={`${decisions} decisiones analizadas`}
          />
          <StatTile
            icon={<Zap className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Balance"
            value={<AnimatedNumber value={progress.stats.chipsNet} format={n => n.toLocaleString('es-ES')} />}
            hint="fichas netas"
          />
        </div>

        {/* ── Ruta por niveles ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tu ruta</h2>
            <Link
              to="/app/learn"
              className="text-xs text-[var(--poker-gold)] hover:underline flex items-center gap-1"
            >
              Ver ruta completa <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map(lvl => {
              const stats = levelProgress(lvl, progress.lessons)
              const unlocked = isLevelUnlocked(lvl.id, progress.lessons)
              return (
                <Link
                  key={lvl.id}
                  to={`/app/classes?nivel=${lvl.id}`}
                  className={`hover-lift rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 transition-all duration-200 hover:border-[var(--border-active)] ${
                    unlocked ? '' : 'opacity-60'
                  }`}
                >
                  <span
                    className="grid place-items-center w-9 h-9 rounded-lg mb-2.5"
                    style={{
                      background: `color-mix(in srgb, ${lvl.color} 14%, transparent)`,
                      color: lvl.color,
                    }}
                  >
                    <Icon name={lvl.icon} className="w-4 h-4" strokeWidth={1.5} />
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{lvl.title}</h3>
                  <p className="text-caption text-[var(--text-muted)] mb-2.5">{lvl.subtitle}</p>
                  <ProgressBar value={stats.ratio} color={lvl.color} />
                  <p className="text-mini text-[var(--text-muted)] mt-1.5 tabular-nums">
                    {stats.done}/{stats.total} clases
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Contenido recomendado ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Artículos para ti</h2>
              <Link to="/app/articles" className="text-xs text-[var(--poker-gold)] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3">
              {articles.slice(0, 2).map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Videos recientes</h2>
              <Link to="/app/videos" className="text-xs text-[var(--poker-gold)] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 grid-cols-2">
              {videos.slice(0, 2).map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </AcademyPage>
  )
}
