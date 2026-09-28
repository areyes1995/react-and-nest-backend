import { describe, expect, it } from 'vitest'
import { ARTICLES } from '@features/articles/data'
import { VIDEOS } from '@features/videos/data'
import { FIXTURE_CURRICULUM as curriculum } from '@features/academy/test/fixtures'
import { articleTarget, lessonTarget, resolveTarget, videoTarget } from '@features/saved/catalog'

describe('catálogo de guardados', () => {
  it('resuelve un artículo por su id, sin decir el tipo', () => {
    const article = ARTICLES[0]
    expect(resolveTarget(article.id, undefined, curriculum)).toEqual(articleTarget(article))
  })

  it('resuelve un video por su id', () => {
    const video = VIDEOS[0]
    expect(resolveTarget(video.id, 'VIDEO', curriculum)).toEqual(videoTarget(video))
  })

  it('resuelve una clase con la ruta de su curso', () => {
    const step = curriculum.path[0]
    const target = resolveTarget(step.lesson.id, undefined, curriculum)
    expect(target).toEqual(lessonTarget(step.lesson, step.course))
    expect(target?.url).toBe(`/app/classes/${step.course.slug}/${step.lesson.slug}`)
  })

  it('acotar por tipo evita resolver contra otro catálogo', () => {
    expect(resolveTarget(ARTICLES[0].id, 'VIDEO', curriculum)).toBeNull()
  })

  it('un contenido retirado devuelve null en vez de una ruta rota', () => {
    expect(resolveTarget('no-existe', undefined, curriculum)).toBeNull()
  })
})
