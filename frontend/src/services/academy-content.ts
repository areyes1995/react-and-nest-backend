// ──────────────────────────────────────────────
// Academy content API — publicación de clases.
// Las decisiones del administrador sobre el currículo:
// qué se publica y qué lleva video. El contenido en
// sí llega con `services/curriculum.ts`.
// ──────────────────────────────────────────────

import { del, get, put } from './api'

export type VideoProviderId = 'NONE' | 'YOUTUBE' | 'VIMEO' | 'MP4'

export interface LessonSetting {
  lessonId: string
  courseSlug: string
  published: boolean
  videoEnabled: boolean
  videoProvider: VideoProviderId
  /** ID de YouTube/Vimeo o URL del MP4, ya normalizado por el backend. */
  videoUrl: string | null
  videoTitle: string | null
  videoDurationSec: number | null
  notes?: string | null
  updatedAt?: string
}

export interface CourseSetting {
  courseSlug: string
  published: boolean
  notes?: string | null
  updatedAt?: string
}

export interface AcademyContent {
  courses: CourseSetting[]
  lessons: LessonSetting[]
  /** `false` si el backend aún no tiene las tablas creadas. */
  persisted: boolean
}

export interface LessonSettingInput {
  courseSlug: string
  published?: boolean
  videoEnabled?: boolean
  videoProvider?: VideoProviderId
  videoUrl?: string
  videoTitle?: string
  videoDurationSec?: number
  notes?: string
}

/** Configuración visible por el estudiante. `null` si no hay backend. */
export async function fetchAcademyContent(): Promise<AcademyContent | null> {
  const res = await get<AcademyContent>('/academy/content')
  return res.ok ? res.data : null
}

/** Configuración completa (solo administradores). */
export async function fetchAcademyContentAdmin(): Promise<AcademyContent | null> {
  const res = await get<AcademyContent>('/academy/content/admin')
  return res.ok ? res.data : null
}

export async function saveLessonSetting(
  lessonId: string,
  input: LessonSettingInput,
): Promise<LessonSetting | null> {
  const res = await put<LessonSetting>(
    `/academy/content/lessons/${encodeURIComponent(lessonId)}`,
    input,
  )
  return res.ok ? res.data : null
}

export async function saveCourseSetting(
  courseSlug: string,
  input: { published?: boolean; notes?: string },
): Promise<CourseSetting | null> {
  const res = await put<CourseSetting>(
    `/academy/content/courses/${encodeURIComponent(courseSlug)}`,
    input,
  )
  return res.ok ? res.data : null
}

export async function resetLessonSetting(lessonId: string): Promise<boolean> {
  const res = await del(`/academy/content/lessons/${encodeURIComponent(lessonId)}`)
  return res.ok
}

/** URL de reproducción a partir de la fuente guardada. */
export function playerUrl(setting: Pick<LessonSetting, 'videoProvider' | 'videoUrl'>): string | null {
  if (!setting.videoUrl) return null
  switch (setting.videoProvider) {
    case 'YOUTUBE':
      return `https://www.youtube-nocookie.com/embed/${setting.videoUrl}`
    case 'VIMEO':
      return `https://player.vimeo.com/video/${setting.videoUrl}`
    case 'MP4':
      return setting.videoUrl
    default:
      return null
  }
}
