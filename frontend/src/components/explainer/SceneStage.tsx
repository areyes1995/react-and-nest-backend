// ──────────────────────────────────────────────
// SceneStage — la mesa de una escena explicativa
// con su subtítulo y sus controles.
//
// Lo comparten el panel principal del modo
// explicativo y las mesas que aparecen dentro de la
// clase. Aquí se decide cómo suena: con voz si está
// activada (pausando antes el audio de la clase para
// no tener dos voces a la vez); si no, en silencio
// con subtítulos.
// ──────────────────────────────────────────────

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { PokerTable } from '@components/poker'
import { TableThemeScope } from '@features/table/TableThemeContext'
import { useExplainerPref } from '@features/explainer/prefs'
import type { ScenePlayer } from '@features/explainer/useScenePlayer'
import type { ExplainerScene } from '@features/explainer/types'

export interface SceneStageProps {
  scene: ExplainerScene
  player: ScenePlayer
  /** Antes de narrar: aquí se pausa el audio de la clase. */
  onNarrate: () => void
  /** Interruptores extra al final de los controles. */
  toggles?: ReactNode
}

export default function SceneStage({ scene, player, onNarrate, toggles }: SceneStageProps) {
  const [voice, setVoice] = useExplainerPref('voice')

  const wantsVoice = voice && player.voiceSupported
  const start = () => {
    // La pulsación explícita manda sobre el audio de la clase: se pausa la
    // clase y habla la mesa. Sin voz disponible, subtítulos sin tocar la clase.
    if (wantsVoice) onNarrate()
    player.play(wantsVoice ? 'voice' : 'silent')
  }
  const replay = () => {
    if (wantsVoice) onNarrate()
    player.replay(wantsVoice ? 'voice' : 'silent')
  }

  return (
    <>
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

          {/* Antes de empezar: invitación a verla. */}
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
                Ver cómo se juega: {scene.title}
              </span>
            </button>
          )}
        </div>
      </TableThemeScope>

      {/* ── Subtítulo del paso ── */}
      <div className="border-t border-[var(--border)] px-3 py-3 sm:px-4" aria-live="polite">
        <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {player.beat < 0 ? scene.title : `Paso ${player.beat + 1} de ${player.total} · ${scene.title}`}
        </p>
        <p
          key={`${scene.id}-${player.beat}`}
          className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-[var(--text-primary)] animate-fade-in"
        >
          {player.caption ?? scene.summary}
        </p>
        {player.voiceError && <p className="mt-1 text-xs text-amber-400">{player.voiceError}</p>}
      </div>

      {/* ── Controles ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1">
          <IconButton label="Repetir la explicación" onClick={replay}>
            <RotateCcw className="w-4 h-4" strokeWidth={2} />
          </IconButton>
          <IconButton label="Paso anterior" onClick={() => player.goTo(player.beat - 1)} disabled={player.beat <= 0}>
            <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
          </IconButton>

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
            {player.playing ? 'Pausar' : player.finished ? 'Ver otra vez' : wantsVoice ? 'Explicar con voz' : 'Reproducir'}
          </button>

          <IconButton
            label="Paso siguiente"
            onClick={() => player.goTo(player.beat + 1)}
            disabled={player.beat >= player.total - 1}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
          </IconButton>
        </div>

        {/* Pasos de la escena, clicables. */}
        <div className="flex items-center gap-1 flex-1 min-w-[6rem]">
          {Array.from({ length: player.total }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => player.goTo(index)}
              aria-label={`Ir al paso ${index + 1}`}
              aria-current={index === player.beat ? 'step' : undefined}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background:
                  index === player.beat
                    ? 'var(--poker-gold)'
                    : index < player.beat
                      ? 'color-mix(in srgb, var(--poker-gold) 45%, transparent)'
                      : 'var(--bg-surface)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {player.voiceSupported && (
            <Toggle
              on={voice}
              onChange={setVoice}
              label={voice ? 'Con voz' : 'Sin voz'}
              title={voice ? 'Narrar la explicación en voz alta' : 'Explicar con subtítulos, sin voz'}
            >
              {voice ? <Volume2 className="w-3.5 h-3.5" strokeWidth={2} /> : <VolumeX className="w-3.5 h-3.5" strokeWidth={2} />}
            </Toggle>
          )}
          {voice && player.voiceSupported && (player.voices?.length ?? 0) > 0 && (
            <select
              value={player.voiceId ?? ''}
              onChange={event => player.setVoice(event.target.value)}
              title="Voz que narra la mesa"
              aria-label="Voz que narra la mesa"
              className="max-w-[10rem] truncate rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-1.5 text-caption text-[var(--text-primary)] transition hover:text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]"
              translate="no"
            >
              {(player.voices ?? []).map(option => (
                <option key={option.id} value={option.id}>
                  {option.detail ? `${option.label} — ${option.detail}` : option.label}
                </option>
              ))}
            </select>
          )}
          {toggles}
        </div>
      </div>
    </>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid place-items-center w-9 h-9 rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

export function Toggle({
  on,
  onChange,
  label,
  title,
  children,
}: {
  on: boolean
  onChange: (value: boolean) => void
  label: string
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-caption font-semibold transition ${
        on
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-[var(--bg-surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
      {label}
    </button>
  )
}
