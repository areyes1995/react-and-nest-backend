// ──────────────────────────────────────────────
// ContentContext — qué clases están publicadas y
// cuáles llevan video.
// Son decisiones del administrador que viajan dentro
// del propio currículo (`published`, `video`, `notes`
// de cada curso y clase). Este contexto las expone con
// consultas sencillas y las guarda en el backend;
// tras guardar, el currículo se vuelve a pedir.
// ──────────────────────────────────────────────

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import {
  saveCourseSetting,
  saveLessonSetting,
  type CourseSetting,
  type LessonSetting,
  type LessonSettingInput,
} from '@services/academy-content'
import { useCurriculumState } from './CurriculumContext'
import type { Course, Lesson } from './types'

/** De dónde salieron los datos que se están usando. */
export type ContentSource = 'api' | 'seed' | 'loading'

function lessonSettingOf(lesson: Lesson, course: Course): LessonSetting {
  const video = lesson.video ?? null
  return {
    lessonId: lesson.id,
    courseSlug: course.slug,
    published: lesson.published ?? true,
    videoEnabled: video?.enabled === true && !!video.url,
    videoProvider: video?.provider ?? 'NONE',
    videoUrl: video?.url ?? null,
    videoTitle: video?.title ?? null,
    videoDurationSec: video?.durationSec ?? null,
    notes: lesson.notes ?? null,
  }
}

export interface ContentContextValue {
  lessons: Map<string, LessonSetting>
  courses: Map<string, CourseSetting>
  /**
   * `api` si el contenido viene de la base; `seed` si el backend sirve el
   * currículo semilla porque aún no tiene las tablas (no se puede guardar).
   */
  source: ContentSource
  /** Configuración de una clase. */
  lessonSetting: (lessonId: string) => LessonSetting | undefined
  isLessonPublished: (lessonId: string) => boolean
  isCoursePublished: (courseSlug: string) => boolean
  /** Video a mostrar en la clase, o `null` si no lleva. */
  lessonVideo: (lessonId: string) => LessonSetting | null
  /** Guarda en el backend. Devuelve `false` si no se pudo. */
  saveLesson: (lessonId: string, input: LessonSettingInput) => Promise<boolean>
  saveCourse: (courseSlug: string, published: boolean) => Promise<boolean>
  reload: () => Promise<void>
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function AcademyContentProvider({ children }: { children: ReactNode }) {
  const { curriculum, status, persisted, reload } = useCurriculumState()

  const lessons = useMemo(
    () =>
      new Map(
        curriculum.courses.flatMap(course =>
          course.lessons.map(lesson => [lesson.id, lessonSettingOf(lesson, course)] as const),
        ),
      ),
    [curriculum],
  )

  const courses = useMemo(
    () =>
      new Map(
        curriculum.courses.map(course => [
          course.slug,
          { courseSlug: course.slug, published: course.published ?? true, notes: course.notes ?? null },
        ]),
      ),
    [curriculum],
  )

  const saveLesson = useCallback<ContentContextValue['saveLesson']>(
    async (lessonId, input) => {
      const saved = await saveLessonSetting(lessonId, input).catch(() => null)
      await reload()
      return saved !== null
    },
    [reload],
  )

  const saveCourse = useCallback<ContentContextValue['saveCourse']>(
    async (courseSlug, published) => {
      const saved = await saveCourseSetting(courseSlug, { published }).catch(() => null)
      await reload()
      return saved !== null
    },
    [reload],
  )

  const value = useMemo<ContentContextValue>(
    () => ({
      lessons,
      courses,
      source: status === 'loading' ? 'loading' : persisted ? 'api' : 'seed',
      lessonSetting: lessonId => lessons.get(lessonId),
      // Lo que no está en el currículo no se puede ver: al estudiante no le
      // llega lo despublicado.
      isLessonPublished: lessonId => lessons.get(lessonId)?.published ?? false,
      isCoursePublished: courseSlug => courses.get(courseSlug)?.published ?? false,
      lessonVideo: lessonId => {
        const setting = lessons.get(lessonId)
        if (!setting?.videoEnabled || !setting.videoUrl) return null
        return setting
      },
      saveLesson,
      saveCourse,
      reload,
    }),
    [lessons, courses, status, persisted, saveLesson, saveCourse, reload],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useAcademyContent(): ContentContextValue {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useAcademyContent debe usarse dentro de <AcademyContentProvider>')
  }
  return context
}
