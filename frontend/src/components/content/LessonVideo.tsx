// ──────────────────────────────────────────────
// LessonVideo — el video opcional de una clase.
// No forma parte del currículo: aparece solo si un
// administrador lo activó desde Gestión de contenido.
// Por eso el componente no decide nada, solo dibuja lo
// que le llega; si no hay video, no se monta.
// ──────────────────────────────────────────────

import { Film } from 'lucide-react'
import { playerUrl, type LessonSetting } from '@services/academy-content'

export interface LessonVideoProps {
  setting: LessonSetting
  /** Título de la clase, como respaldo si el video no tiene el suyo. */
  lessonTitle: string
}

/** Duración en `mm:ss`, solo si el administrador la indicó. */
function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export default function LessonVideo({ setting, lessonTitle }: LessonVideoProps) {
  const src = playerUrl(setting)
  if (!src) return null

  const title = setting.videoTitle || lessonTitle
  const duration = formatDuration(setting.videoDurationSec)

  return (
    <figure className="space-y-2">
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black aspect-video">
        {setting.videoProvider === 'MP4' ? (
          <video className="h-full w-full" src={src} controls preload="metadata" title={title} />
        ) : (
          <iframe
            className="h-full w-full"
            src={src}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <figcaption className="flex items-center gap-1.5 text-caption text-[var(--text-muted)]">
        <Film className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="truncate">{title}</span>
        {duration && <span className="ml-auto tabular-nums shrink-0">{duration}</span>}
      </figcaption>
    </figure>
  )
}
