// ──────────────────────────────────────────────
// ContentAdminPage — gestión de las publicaciones.
// Aquí se decide qué ve el estudiante: qué cursos y
// clases están publicados y cuáles llevan video.
// El texto de las clases se carga con el seeder
// (`pnpm db:seed:academy`); lo que se gestiona aquí es
// su visibilidad y su material añadido, y el seeder no
// lo pisa al volver a sembrar.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Eye,
  EyeOff,
  Film,
  HardDrive,
  Search,
} from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { useAcademyContent } from '@features/academy/ContentContext'
import { useCurriculum } from '@features/academy/CurriculumContext'
import type { Course, Lesson } from '@features/academy/types'
import type { VideoProviderId } from '@services/academy-content'

const PROVIDERS: { id: VideoProviderId; label: string; placeholder: string }[] = [
  { id: 'NONE', label: 'Sin video', placeholder: '' },
  {
    id: 'YOUTUBE',
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=… o el ID',
  },
  { id: 'VIMEO', label: 'Vimeo', placeholder: 'https://vimeo.com/123456789 o el ID' },
  { id: 'MP4', label: 'MP4', placeholder: 'https://…/clase.mp4' },
]

/** Interruptor de publicado/oculto, con el estado escrito, no solo en color. */
function PublishToggle({
  published,
  onChange,
  label,
}: {
  published: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!published)}
      aria-label={`${published ? 'Despublicar' : 'Publicar'} ${label}`}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-caption font-semibold transition ${
        published
          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      {published ? (
        <Eye className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {published ? 'Publicada' : 'Oculta'}
    </button>
  )
}

interface LessonRowProps {
  lesson: Lesson
  courseSlug: string
}

function LessonRow({ lesson, courseSlug }: LessonRowProps) {
  const { lessonSetting, isLessonPublished, saveLesson } = useAcademyContent()
  const setting = lessonSetting(lesson.id)

  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<VideoProviderId>(setting?.videoProvider ?? 'NONE')
  const [url, setUrl] = useState(setting?.videoUrl ?? '')
  const [videoTitle, setVideoTitle] = useState(setting?.videoTitle ?? '')
  const [saved, setSaved] = useState(false)

  const published = isLessonPublished(lesson.id)
  const hasVideo = setting?.videoEnabled === true && Boolean(setting.videoUrl)

  /** Cada guardado manda el estado completo: el backend hace upsert. */
  const persist = async (patch: Partial<{ published: boolean; videoEnabled: boolean }>) => {
    const ok = await saveLesson(lesson.id, {
      courseSlug,
      published: patch.published ?? published,
      videoEnabled: patch.videoEnabled ?? (provider !== 'NONE' && url.trim() !== ''),
      videoProvider: provider,
      videoUrl: url.trim(),
      videoTitle: videoTitle.trim(),
    })
    if (!ok) return
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  const activeProvider = PROVIDERS.find(item => item.id === provider) ?? PROVIDERS[0]

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(current => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" strokeWidth={2} />
          )}
          <span className="truncate text-xs text-[var(--text-primary)]">{lesson.title}</span>
          {hasVideo && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-[var(--poker-gold)]/15 px-1.5 py-0.5 text-mini font-semibold text-[var(--poker-gold)]">
              <Film className="h-3 w-3" strokeWidth={2} />
              video
            </span>
          )}
        </button>

        <span className="shrink-0 text-mini text-[var(--text-muted)] tabular-nums">
          {lesson.minutes} min
        </span>

        <PublishToggle
          published={published}
          label={lesson.title}
          onChange={next => void persist({ published: next })}
        />
      </div>

      {/* ── Video de la clase ── */}
      {open && (
        <div className="space-y-2.5 border-t border-[var(--border)] px-3 py-3">
          <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]">
            <label className="space-y-1">
              <span className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
                Fuente
              </span>
              <select
                value={provider}
                onChange={event => setProvider(event.target.value as VideoProviderId)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-active)] focus:outline-none"
              >
                {PROVIDERS.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
                Enlace o ID
              </span>
              <input
                type="text"
                value={url}
                disabled={provider === 'NONE'}
                onChange={event => setUrl(event.target.value)}
                placeholder={activeProvider.placeholder}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none disabled:opacity-40"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-mini uppercase tracking-wide text-[var(--text-muted)]">
              Título del video (opcional)
            </span>
            <input
              type="text"
              value={videoTitle}
              disabled={provider === 'NONE'}
              onChange={event => setVideoTitle(event.target.value)}
              placeholder={lesson.title}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none disabled:opacity-40"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void persist({})}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black"
              style={{ background: 'var(--poker-gold)' }}
            >
              Guardar
            </button>

            {provider !== 'NONE' && (
              <button
                type="button"
                onClick={() => {
                  setProvider('NONE')
                  setUrl('')
                  setVideoTitle('')
                  void saveLesson(lesson.id, {
                    courseSlug,
                    published,
                    videoEnabled: false,
                    videoProvider: 'NONE',
                    videoUrl: '',
                  })
                }}
                className="rounded-lg bg-[var(--bg-panel)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Quitar video
              </button>
            )}

            {saved && (
              <span className="flex items-center gap-1 text-caption text-emerald-400">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Guardado
              </span>
            )}

            <span className="ml-auto text-mini text-[var(--text-muted)]">
              El video solo se muestra si la fuente es válida.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function CourseBlock({ course }: { course: Course }) {
  const { isCoursePublished, saveCourse, lessonSetting } = useAcademyContent()
  const [open, setOpen] = useState(false)

  const published = isCoursePublished(course.slug)
  const withVideo = course.lessons.filter(
    lesson => lessonSetting(lesson.id)?.videoEnabled === true,
  ).length
  const hidden = course.lessons.filter(
    lesson => lessonSetting(lesson.id)?.published === false,
  ).length

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(current => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={2} />
          )}
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {course.title}
          </span>
          <span className="shrink-0 text-caption text-[var(--text-muted)]">
            {course.lessons.length} clases
            {withVideo > 0 && ` · ${withVideo} con video`}
            {hidden > 0 && ` · ${hidden} ocultas`}
          </span>
        </button>

        <PublishToggle
          published={published}
          label={course.title}
          onChange={next => void saveCourse(course.slug, next)}
        />
      </div>

      {open && (
        <div className="space-y-1.5 border-t border-[var(--border)] px-4 py-3">
          {course.lessons.map(lesson => (
            <LessonRow key={lesson.id} lesson={lesson} courseSlug={course.slug} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ContentAdminPage() {
  const { source, lessonSetting } = useAcademyContent()
  const { levels: allLevels, lessons: allLessons } = useCurriculum()
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()

  const levels = useMemo(
    () =>
      allLevels.map(level => ({
        ...level,
        courses: level.courses.filter(
          course =>
            !needle ||
            course.title.toLowerCase().includes(needle) ||
            course.lessons.some(lesson => lesson.title.toLowerCase().includes(needle)),
        ),
      })).filter(level => level.courses.length > 0),
    [needle, allLevels],
  )

  const totals = useMemo(() => {
    const lessons = allLessons
    return {
      lessons: lessons.length,
      videos: lessons.filter(lesson => lessonSetting(lesson.id)?.videoEnabled === true).length,
      hidden: lessons.filter(lesson => lessonSetting(lesson.id)?.published === false).length,
    }
  }, [lessonSetting, allLessons])

  return (
    <AcademyPage
      title="Gestión de contenido"
      subtitle={`${totals.lessons} clases · ${totals.videos} con video · ${totals.hidden} ocultas`}
      actions={
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar curso o clase…"
            className="w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] focus:outline-none sm:w-60"
          />
        </div>
      }
    >
      <div className="max-w-4xl space-y-4">
        {/* De dónde salen los datos: importa saber si un cambio se puede
            guardar en el servidor. */}
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
            source === 'api'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}
        >
          {source === 'api' ? (
            <Cloud className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <p className="leading-relaxed">
            {source === 'api'
              ? 'Los cambios se guardan en el servidor y los ven todos los estudiantes.'
              : 'El backend todavía no tiene las tablas del currículo y sirve el contenido semilla: los cambios no se pueden guardar. Aplica la migración y ejecuta `pnpm db:seed:academy`.'}
          </p>
        </div>

        {levels.map(level => (
          <div key={level.id} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{level.title}</h2>
              <span className="text-xs text-[var(--text-muted)]">{level.subtitle}</span>
            </div>

            {level.courses.map(course => (
              <CourseBlock key={course.id} course={course} />
            ))}
          </div>
        ))}

        {levels.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">
            Ningún curso o clase coincide con «{query}».
          </p>
        )}
      </div>
    </AcademyPage>
  )
}
