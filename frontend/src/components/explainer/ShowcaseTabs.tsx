// ──────────────────────────────────────────────
// ShowcaseTabs — mesa interactiva por pestañas.
//
// Una mesa con varias explicaciones cortas (las
// texturas de board): cada pestaña es una escena
// con su audio. Al terminar una pestaña empieza la
// siguiente sola, hasta explicarlas todas.
//
// A propósito más simple que el modo explicativo:
// sin puntos de pasos, sin interruptores de voz ni
// selectores. La voz es la compartida con la clase
// (la que elijas en el reproductor principal suena
// aquí también) y el relevo de audio la pausa solo
// mientras habla la mesa.
// ──────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import { PokerTable } from '@components/poker'
import { TableThemeScope } from '@features/table/TableThemeContext'
import { useExplainerPref } from '@features/explainer/prefs'
import { useScenePlayer } from '@features/explainer/useScenePlayer'
import type { ExplainerScene } from '@features/explainer/types'
import { TEXTURE_SCENES } from '@features/explainer/textures'

const SHOWCASES: Record<string, { label: string; scenes: ExplainerScene[] }> = {
  'board-textures': { label: 'Texturas de board en la mesa', scenes: TEXTURE_SCENES },
}

export default function ShowcaseTabs({ id }: { id: string }) {
  const showcase = SHOWCASES[id] ?? SHOWCASES['board-textures']
  const [tab, setTab] = useState(0)
  const [voice] = useExplainerPref('voice')
  // Al acabar una pestaña se avanza a la siguiente y se reproduce sola.
  const autoNext = useRef(false)

  const scene = showcase.scenes[Math.min(tab, showcase.scenes.length - 1)]
  const player = useScenePlayer(scene, {
    onFinish: () => {
      if (tab < showcase.scenes.length - 1) {
        autoNext.current = true
        setTab(tab + 1)
      }
    },
  })
  const playerRef = useRef(player)
  playerRef.current = player
  const voiceRef = useRef(voice)
  voiceRef.current = voice

  // La pestaña nueva empieza narrando sola si venía de un avance automático.
  useEffect(() => {
    if (!autoNext.current) return
    autoNext.current = false
    const current = playerRef.current
    current.play(voiceRef.current && current.voiceSupported ? 'voice' : 'silent', 0)
    // Solo al cambiar de pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const start = () => {
    autoNext.current = false
    player.play(voice && player.voiceSupported ? 'voice' : 'silent')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-[var(--bg-panel)]">
      {/* ── Pestañas: una por textura ── */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] p-2" role="tablist" aria-label={showcase.label}>
        {showcase.scenes.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={index === tab}
            onClick={() => {
              autoNext.current = false
              player.stop()
              setTab(index)
            }}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              index === tab
                ? 'bg-emerald-500/15 text-emerald-300'
                : index < tab
                  ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {index + 1}. {entry.title}
          </button>
        ))}
      </div>

      {/* ── La mesa ── */}
      <TableThemeScope>
        <div className="relative bg-[var(--bg-app)]/40">
          <PokerTable
            state={player.state}
            heroId={player.frames.heroId}
            timeLeft={null}
            revealAll={player.reveal}
            compact
            spectator
          />
          {player.beat < 0 && !player.playing && (
            <button
              type="button"
              onClick={start}
              className="absolute inset-0 z-40 grid place-items-center bg-black/35 backdrop-blur-[1px] transition hover:bg-black/25"
            >
              <span
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-black shadow-xl"
                style={{ background: 'var(--poker-gold)' }}
              >
                <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                Escuchar: {scene.title}
              </span>
            </button>
          )}
        </div>
      </TableThemeScope>

      {/* ── Lo que se explica ── */}
      <div className="border-t border-[var(--border)] px-3 py-3 sm:px-4" aria-live="polite">
        <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {scene.title} · paso {Math.max(player.beat + 1, 1)} de {player.total}
        </p>
        <p key={`${scene.id}-${player.beat}`} className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-[var(--text-primary)] animate-fade-in">
          {player.caption ?? scene.summary}
        </p>
        {player.voiceError && <p className="mt-1 text-xs text-amber-400">{player.voiceError}</p>}
      </div>

      {/* ── Controles mínimos ── */}
      <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={player.playing ? player.pause : start}
          className="press flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          style={{ background: 'var(--poker-gold)' }}
        >
          {player.buffering ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
          ) : player.playing ? (
            <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          )}
          {player.playing ? 'Pausar' : player.finished && tab === showcase.scenes.length - 1 ? 'Ver otra vez' : 'Explicar con voz'}
        </button>
        <button
          type="button"
          onClick={() => player.replay(voice && player.voiceSupported ? 'voice' : 'silent')}
          title="Repetir esta textura"
          aria-label="Repetir esta textura"
          className="grid place-items-center w-9 h-9 rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2} />
        </button>
        {tab < showcase.scenes.length - 1 ? (
          <p className="ml-auto text-caption text-[var(--text-muted)]">
            Al terminar sigue: {showcase.scenes[tab + 1].title}
          </p>
        ) : (
          <p className="ml-auto text-caption text-emerald-400">Última textura</p>
        )}
      </div>
    </div>
  )
}
