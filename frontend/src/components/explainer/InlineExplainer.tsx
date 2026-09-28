// ──────────────────────────────────────────────
// InlineExplainer — una mesa dentro de la clase.
//
// Con el modo explicativo abierto, aparece bajo el
// bloque que trata un concepto (p. ej. bajo la tabla
// de "Las cuatro rondas de apuestas") y lo enseña
// justo donde se lee. El panel principal de arriba
// sigue estando.
//
// Empieza minimizada para no llenar la clase de mesas.
// Relevo con "Escuchar la clase": si está activo
// "Seguir la clase" y el audio llega a este bloque,
// la mesa se despliega (y se queda desplegada), la
// clase se pausa y habla la mesa: su explicación
// sustituye a la del bloque. Al terminar, avisa para
// que la clase siga desde el bloque siguiente.
// ──────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { ChevronDown, MonitorPlay } from 'lucide-react'
import { useExplainerPref } from '@features/explainer/prefs'
import { useScenePlayer } from '@features/explainer/useScenePlayer'
import type { ExplainerScene } from '@features/explainer/types'
import SceneStage from './SceneStage'

export interface InlineExplainerProps {
  scene: ExplainerScene
  /**
   * Orden de relevo: cada valor nuevo distinto de 0 pide explicar la escena
   * desde el principio en lugar del audio de la clase.
   */
  handoff: number
  /** Fin del relevo. `played` es falso si se minimizó a medias y la explicación no terminó. */
  onHandoffEnd: (played: boolean) => void
  /** Desplegada o minimizada (lo guarda la clase: al volver al paso sigue igual). */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  lessonPlaying: boolean
  onNarrate: () => void
  /**
   * Frase que está explicando la mesa (`null` si está minimizada, sin empezar
   * o ya terminó): la clase la usa para marcar en sus tablas de qué se habla.
   */
  onCaptionChange?: (caption: string | null) => void
}

export default function InlineExplainer({
  scene,
  handoff,
  onHandoffEnd,
  lessonPlaying,
  onNarrate,
  expanded,
  onExpandedChange,
  onCaptionChange,
}: InlineExplainerProps) {
  const [voice] = useExplainerPref('voice')
  const [follow] = useExplainerPref('follow')
  const box = useRef<HTMLElement>(null)

  /** La explicación en curso es un relevo de la clase (y hay que devolverlo). */
  const relaying = useRef(false)
  const endRef = useRef(onHandoffEnd)
  endRef.current = onHandoffEnd

  const player = useScenePlayer(scene, {
    onFinish: () => {
      if (!relaying.current) return
      relaying.current = false
      endRef.current(true)
    },
  })

  // ── Relevo: la clase llegó a este bloque. La mesa se despliega y habla ──
  useEffect(() => {
    if (!handoff) return
    onExpandedChange(true)
    relaying.current = true
    // Se centra ya desplegada (en el siguiente fotograma).
    window.requestAnimationFrame(() => box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    player.play(voice && player.voiceSupported ? 'voice' : 'silent', 0)
    // Solo con cada orden nueva.
  }, [handoff])

  // ── La frase en curso, para las tablas del mismo paso ──
  const captionRef = useRef(onCaptionChange)
  captionRef.current = onCaptionChange
  const caption = expanded && !player.finished ? player.caption : null
  useEffect(() => {
    captionRef.current?.(caption)
  }, [caption])
  useEffect(() => () => captionRef.current?.(null), [])

  // Si el estudiante vuelve a darle a la clase, la clase manda y el relevo se
  // da por cancelado.
  useEffect(() => {
    if (!lessonPlaying) return
    relaying.current = false
    if (player.mode === 'voice') player.pause()
  }, [lessonPlaying, player])

  return (
    <aside
      ref={box}
      aria-label={`En la mesa: ${scene.title}`}
      className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/25 bg-[var(--bg-panel)]"
    >
      <button
        type="button"
        onClick={() => {
          if (expanded) {
            player.stop()
            // Minimizarla a mitad del relevo devuelve el audio a la clase, que lee
            // el bloque: la explicación de la mesa se quedó a medias.
            if (relaying.current) {
              relaying.current = false
              endRef.current(false)
            }
          }
          onExpandedChange(!expanded)
        }}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-[var(--bg-surface-soft)] sm:px-4"
      >
        <MonitorPlay className="w-3.5 h-3.5 shrink-0 text-emerald-400" strokeWidth={2.2} />
        <span className="text-caption font-bold uppercase tracking-wide text-emerald-400">En la mesa</span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text-primary)]">
          {scene.title}
          {!expanded && follow && (
            <span className="ml-2 hidden font-normal text-[var(--text-muted)] sm:inline">
              · se abre sola cuando la clase llegue aquí
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-caption text-[var(--text-muted)]">
          {expanded ? 'Minimizar' : 'Ver mesa'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)]">
          <SceneStage scene={scene} player={player} onNarrate={onNarrate} />
        </div>
      )}
    </aside>
  )
}
