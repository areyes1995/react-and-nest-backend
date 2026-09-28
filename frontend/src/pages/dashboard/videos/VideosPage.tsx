// ──────────────────────────────────────────────
// VideosPage — biblioteca de tutoriales.
// Organizada por playlists, que es como se estudia
// un tema de principio a fin, con filtro por nivel
// y búsqueda para las consultas puntuales.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { Icon, VideoCard } from '@components/content'
import { PLAYLISTS, VIDEOS } from '@features/videos/data'
import { useTranslatedContent } from '@services/translate'

export default function VideosPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const playlists = useTranslatedContent(PLAYLISTS)
  const videosAll = useTranslatedContent(VIDEOS)

  const playlistId = params.get('playlist')

  const visiblePlaylists = useMemo(
    () => (playlistId ? playlists.filter(p => p.id === playlistId) : playlists),
    [playlistId, playlists],
  )

  const matches = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase())

  const totalMinutes = Math.round(videosAll.reduce((sum, v) => sum + v.duration, 0) / 60)

  return (
    <AcademyPage
      title="Videos"
      subtitle={`${videosAll.length} tutoriales · ${totalMinutes} minutos de contenido`}
      actions={
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar video…"
            className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
        </div>
      }
    >
      <div className="space-y-4">
        {/* ── Playlists ── */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParams({})}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !playlistId
                ? 'bg-[var(--poker-gold)] text-black'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Todas
          </button>
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              type="button"
              onClick={() => setParams({ playlist: playlist.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                playlistId === playlist.id
                  ? 'bg-[var(--poker-gold)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {playlist.title}
            </button>
          ))}
        </div>

        {/* ── Videos agrupados ── */}
        <div className="space-y-8">
          {visiblePlaylists.map(playlist => {
            const videos = videosAll.filter(
              video =>
                video.playlistId === playlist.id &&
                (matches(video.title) || matches(video.description)),
            )
            if (videos.length === 0) return null

            return (
              <section key={playlist.id} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--bg-surface)] text-[var(--poker-gold)] shrink-0">
                    <Icon name={playlist.icon} className="w-4 h-4" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{playlist.title}</h2>
                    <p className="text-caption text-[var(--text-muted)] truncate">{playlist.description}</p>
                  </div>
                </div>

                <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </AcademyPage>
  )
}
