// ──────────────────────────────────────────────
// Catálogo de guardados — del `id` al contenido.
// La base de datos guarda una referencia y una copia
// del título; aquí se resuelve contra el catálogo real
// para que la lista siga viva (ruta correcta, título
// actualizado, autor, duración) y para reconocer los
// marcadores antiguos, que solo tenían el id.
// ──────────────────────────────────────────────

import { ARTICLES } from '@features/articles/data'
import { VIDEOS } from '@features/videos/data'
import type { Curriculum } from '@features/academy/curriculum'
import type { SavedKind } from '@services/saved'

export interface SavedTarget {
  kind: SavedKind
  contentId: string
  title: string
  /** Contexto de una línea: curso, autor o playlist. */
  subtitle?: string
  /** Ruta del frontend que abre el contenido. */
  url: string
}

/** Rótulo de cada tipo, tal y como se lee en los filtros de la página. */
export const SAVED_KIND_LABEL: Record<SavedKind, string> = {
  LESSON: 'Clases',
  ARTICLE: 'Artículos',
  VIDEO: 'Videos',
  GLOSSARY: 'Glosario',
}

/** Datos de guardado de un artículo, listos para el botón. */
export function articleTarget(article: {
  id: string
  slug: string
  title: string
  author: string
}): SavedTarget {
  return {
    kind: 'ARTICLE',
    contentId: article.id,
    title: article.title,
    subtitle: article.author,
    url: `/app/articles/${article.slug}`,
  }
}

export function videoTarget(video: {
  id: string
  slug: string
  title: string
  instructor: string
}): SavedTarget {
  return {
    kind: 'VIDEO',
    contentId: video.id,
    title: video.title,
    subtitle: video.instructor,
    url: `/app/videos/${video.slug}`,
  }
}

export function lessonTarget(
  lesson: { id: string; slug: string; title: string },
  course: { slug: string; title: string },
): SavedTarget {
  return {
    kind: 'LESSON',
    contentId: lesson.id,
    title: lesson.title,
    subtitle: course.title,
    url: `/app/classes/${course.slug}/${lesson.slug}`,
  }
}

/**
 * Busca un contenido por su `id` en todo el catálogo.
 * `kind` acota la búsqueda cuando se conoce; sin él se recorren los tres
 * catálogos, que es lo que hace falta para los marcadores antiguos guardados
 * en el navegador, donde solo se anotaba el id.
 */
export function resolveTarget(
  contentId: string,
  kind: SavedKind | undefined,
  curriculum: Curriculum,
): SavedTarget | null {
  if (!kind || kind === 'ARTICLE') {
    const article = ARTICLES.find(item => item.id === contentId)
    if (article) return articleTarget(article)
  }

  if (!kind || kind === 'VIDEO') {
    const video = VIDEOS.find(item => item.id === contentId)
    if (video) return videoTarget(video)
  }

  if (!kind || kind === 'LESSON') {
    const step = curriculum.findLessonById(contentId)
    if (step) return lessonTarget(step.lesson, step.course)
  }

  return null
}
