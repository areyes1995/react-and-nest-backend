// ──────────────────────────────────────────────
// Tarjetas de contenido — cursos, clases, artículos
// y videos. Todas comparten la misma anatomía
// (icono, título, metadatos, progreso) para que el
// catálogo se lea como un sistema y no como cuatro
// listados distintos.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Check, Clock, Crown, Lock, Play, Zap, BookOpen, Spade, CircleHelp } from 'lucide-react'
import type { Course, FormatId, Lesson, LessonKind, LevelId } from '@features/academy/types'
import { FORMAT_LABELS } from '@features/academy/types'
import type { Article } from '@features/articles/data'
import type { Video } from '@features/videos/data'
import { formatDuration } from '@features/videos/data'
import Icon from './Icon'
import { ProgressBar } from './ProgressRing'

const LEVEL_COLORS: Record<LevelId, string> = {
  beginner: 'var(--level-beginner)',
  intermediate: 'var(--level-intermediate)',
  advanced: 'var(--level-advanced)',
  theory: 'var(--level-theory)',
  exploit: 'var(--level-exploit)',
  pro: 'var(--level-pro)',
}

const LEVEL_LABELS: Record<LevelId, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  theory: 'Teoría',
  exploit: 'Explotación',
  pro: 'Profesional',
}

const KIND_ICON: Record<LessonKind, typeof BookOpen> = {
  lesson: BookOpen,
  video: Play,
  drill: Spade,
  quiz: CircleHelp,
}

const KIND_LABEL: Record<LessonKind, string> = {
  lesson: 'Clase',
  video: 'Video',
  drill: 'Práctica',
  quiz: 'Test',
}

export interface LevelBadgeProps {
  level: LevelId
  className?: string
}

/** Etiqueta de nivel con el color del nivel correspondiente. */
export function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-mini font-semibold ${className}`}
      style={{ color: LEVEL_COLORS[level], background: `color-mix(in srgb, ${LEVEL_COLORS[level]} 14%, transparent)` }}
    >
      {LEVEL_LABELS[level]}
    </span>
  )
}

const FORMAT_STYLES: Record<FormatId, CSSProperties> = {
  cash: { color: 'var(--poker-gold)', background: 'color-mix(in srgb, var(--poker-gold) 14%, transparent)' },
  mtt: { color: '#38bdf8', background: 'color-mix(in srgb, #38bdf8 14%, transparent)' },
  spin: { color: '#f472b6', background: 'color-mix(in srgb, #f472b6 14%, transparent)' },
  all: { color: 'var(--text-secondary)', background: 'var(--bg-surface)' },
}

/** Etiqueta de modalidad: Cash, Torneos, Spin o Todas. */
export function FormatBadge({ format, className = '' }: { format: FormatId; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-mini font-semibold ${className}`}
      style={FORMAT_STYLES[format]}
      title={format === 'all' ? 'Aplica a todas las modalidades' : `Aplica a ${FORMAT_LABELS[format].toLowerCase()}`}
    >
      {FORMAT_LABELS[format]}
    </span>
  )
}

const cardBase =
  'group block hover-lift rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 transition-all duration-200 hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-soft)]'

export interface CourseCardProps {
  course: Course
  /** Clases completadas sobre el total. */
  progress: { done: number; total: number; ratio: number }
  minutes: number
  locked?: boolean
  /** Curso de pago visto desde el plan gratis: se puede abrir, pero sus clases piden suscripción. */
  premium?: boolean
}

/** Marca de contenido de pago. */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-[var(--poker-gold)]/15 px-1.5 py-0.5 text-mini font-semibold text-[var(--poker-gold)] ${className}`}
      title="Incluido en Premium y Gold"
    >
      <Crown className="h-3 w-3" strokeWidth={2} />
      Premium
    </span>
  )
}

export function CourseCard({ course, progress, minutes, locked = false, premium = false }: CourseCardProps) {
  const color = LEVEL_COLORS[course.level]
  const content = (
    <>
      <div className="flex items-start gap-3">
        <span
          className="grid place-items-center w-10 h-10 rounded-lg shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          {locked ? <Lock className="w-5 h-5" strokeWidth={1.5} /> : <Icon name={course.icon} className="w-5 h-5" strokeWidth={1.5} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <LevelBadge level={course.level} />
            {(course.formats ?? []).map(format => (
              <FormatBadge key={format} format={format} />
            ))}
            {premium && <PremiumBadge />}
            {progress.ratio >= 1 && <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />}
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{course.title}</h3>
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{course.summary}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <ProgressBar value={progress.ratio} color={color} />
        <div className="flex items-center justify-between text-mini text-[var(--text-muted)]">
          <span>
            {progress.done}/{progress.total} clases
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {minutes} min
          </span>
        </div>
      </div>
    </>
  )

  if (locked) {
    return <div className={`${cardBase} opacity-55 cursor-not-allowed`}>{content}</div>
  }

  return (
    <Link to={`/app/classes/${course.slug}`} className={cardBase}>
      {content}
    </Link>
  )
}

export interface LessonCardProps {
  lesson: Lesson
  courseSlug: string
  completed: boolean
  /** Número de orden dentro del curso. */
  index: number
}

export function LessonCard({ lesson, courseSlug, completed, index }: LessonCardProps) {
  const KindIcon = KIND_ICON[lesson.kind]

  return (
    <Link
      to={`/app/classes/${courseSlug}/${lesson.slug}`}
      className="group flex items-center gap-3 hover-lift rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3.5 py-3 transition-all duration-200 hover:border-[var(--border-active)] hover:bg-[var(--bg-surface-soft)]"
    >
      <span
        className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 text-xs font-bold ${
          completed
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
        }`}
      >
        {completed ? <Check className="w-4 h-4" strokeWidth={2.5} /> : index}
      </span>

      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{lesson.title}</h4>
        <p className="text-xs text-[var(--text-muted)] truncate">{lesson.summary}</p>
        {(lesson.formats ?? []).length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            {(lesson.formats ?? []).map(format => (
              <FormatBadge key={format} format={format} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 text-mini text-[var(--text-muted)]">
        <span className="hidden sm:flex items-center gap-1">
          <KindIcon className="w-3 h-3" strokeWidth={1.5} />
          {KIND_LABEL[lesson.kind]}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          {lesson.minutes}′
        </span>
        <span className="flex items-center gap-0.5 text-[var(--poker-gold)]">
          <Zap className="w-3 h-3" strokeWidth={2} />
          {lesson.xp}
        </span>
      </div>
    </Link>
  )
}

export interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/app/articles/${article.slug}`} className={cardBase}>
      <div className="flex items-center gap-2 mb-2">
        <LevelBadge level={article.level} />
        <span className="text-mini text-[var(--text-muted)] uppercase tracking-wide">
          {article.category}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">
        {article.title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] line-clamp-3">{article.excerpt}</p>
      <div className="mt-3 flex items-center justify-between text-mini text-[var(--text-muted)]">
        <span>{article.author}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          {article.readMinutes} min de lectura
        </span>
      </div>
    </Link>
  )
}

export interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link to={`/app/videos/${video.slug}`} className="group block hover-lift rounded-xl">
      {/* Miniatura: degradado por nivel con el icono de reproducción */}
      <div
        className="relative aspect-video rounded-xl border border-[var(--border)] overflow-hidden grid place-items-center transition-all duration-200 group-hover:border-[var(--border-active)]"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${LEVEL_COLORS[video.level]} 22%, var(--bg-panel)) 0%, var(--bg-panel) 100%)`,
        }}
      >
        <span className="grid place-items-center w-12 h-12 rounded-full bg-black/45 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
          <Play className="w-5 h-5 text-white translate-x-0.5" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-mini font-medium text-white tabular-nums">
          {formatDuration(video.duration)}
        </span>
        <span className="absolute top-2 left-2">
          <LevelBadge level={video.level} className="backdrop-blur-sm" />
        </span>
      </div>

      <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--poker-gold)] transition-colors">
        {video.title}
      </h3>
      <p className="text-caption text-[var(--text-muted)] mt-0.5">
        {video.instructor} · {video.chapters.length} capítulos
      </p>
    </Link>
  )
}
