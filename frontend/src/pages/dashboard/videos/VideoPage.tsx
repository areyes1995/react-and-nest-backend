// ──────────────────────────────────────────────
// VideoPage — reproductor y material de estudio.
// El reproductor admite YouTube, Vimeo o MP4. Si la
// fuente aún no está conectada, la página no queda
// vacía: muestra capítulos e ideas clave, que es lo
// que el estudiante acaba usando para repasar.
// ──────────────────────────────────────────────

import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, Clock, Film, ListVideo, User } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { LevelBadge, VideoCard, SaveButton } from '@components/content'
import { VIDEOS, findVideo, formatDuration, type VideoSource } from '@features/videos/data'
import { useTranslatedContent } from '@services/translate'
import { videoTarget } from '@features/saved'

/** Marco del reproductor según la fuente declarada por el video. */
function Player({ source, title }: { source: VideoSource; title: string }) {
  if (source.kind === 'youtube') {
    return (
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${source.id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (source.kind === 'vimeo') {
    return (
      <iframe
        className="w-full h-full"
        src={`https://player.vimeo.com/video/${source.id}`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (source.kind === 'mp4') {
    return <video className="w-full h-full" src={source.url} controls preload="metadata" />
  }

  return (
    <div className="w-full h-full grid place-items-center text-center px-6">
      <div>
        <Film className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
        <p className="text-sm font-medium text-[var(--text-primary)]">Fuente de video pendiente</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
          El guion, los capítulos y las ideas clave de esta lección ya están disponibles más abajo.
        </p>
      </div>
    </div>
  )
}

export default function VideoPage() {
  const { videoSlug } = useParams()
  const videos = useTranslatedContent(VIDEOS)
  const found = videoSlug ? findVideo(videoSlug) : undefined
  const video = videos.find(item => item.id === found?.id)

  if (!video) return <Navigate to="/app/videos" replace />

  const siblings = videos.filter(item => item.playlistId === video.playlistId && item.id !== video.id)

  return (
    <AcademyPage
      title={video.title}
      subtitle={`${video.instructor} · ${formatDuration(video.duration)}`}
      actions={<SaveButton target={videoTarget(video)} label="Guardar video" />}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* ── Reproductor ── */}
          <div className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-panel)]">
            <Player source={video.source} title={video.title} />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LevelBadge level={video.level} />
            <span className="text-caption text-[var(--text-muted)] flex items-center gap-1">
              <User className="w-3 h-3" strokeWidth={1.5} />
              {video.instructor}
            </span>
            <span className="text-caption text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              {formatDuration(video.duration)}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{video.description}</p>

          {/* ── Ideas clave ── */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2.5">
              Ideas clave
            </h2>
            <ul className="space-y-1.5">
              {video.takeaways.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Capítulos y playlist ── */}
        <aside className="space-y-5">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5">
              <ListVideo className="w-3.5 h-3.5" strokeWidth={1.5} />
              Capítulos
            </h2>
            <ol className="space-y-1">
              {video.chapters.map(chapter => (
                <li
                  key={chapter.at}
                  className="flex items-baseline gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-soft)] transition"
                >
                  <span className="text-caption font-mono text-[var(--poker-gold)] tabular-nums shrink-0">
                    {formatDuration(chapter.at)}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{chapter.title}</span>
                </li>
              ))}
            </ol>
          </section>

          {siblings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Más de esta playlist
              </h2>
              <div className="grid gap-3">
                {siblings.slice(0, 3).map(item => (
                  <VideoCard key={item.id} video={item} />
                ))}
              </div>
            </section>
          )}

          <Link to="/app/videos" className="inline-block text-xs text-[var(--poker-gold)] hover:underline">
            ← Volver a la biblioteca
          </Link>
        </aside>
      </div>
    </AcademyPage>
  )
}
