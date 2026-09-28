// ──────────────────────────────────────────────
// TrainerBox — el entrenamiento de la mesa.
//
// Una caja pequeña con tres decisiones: qué se
// entrena, quién corrige y cómo va la sesión. Está
// en la mesa y no en una página aparte a propósito:
// el entrenamiento ocurre mientras se juega, no
// antes ni después.
//
// Quién corrige depende del `.env` del backend: con
// la IA apagada solo está el motor (instantáneo y sin
// conexión); con ella encendida se puede pedir además
// la explicación del modelo.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { Bot, Check, ChevronDown, Cpu, RotateCcw, Target, X } from 'lucide-react'
import { DRILLS, drillAccuracy, findDrill, type DrillId, type DrillSession } from '@features/table/drills'
import type { CorrectionMode } from '@features/table/useTableGame'
import Icon from '@components/content/Icon'

export interface TrainerBoxProps {
  drillId: DrillId
  session: DrillSession
  correctionMode: CorrectionMode
  /** La IA del backend está disponible para corregir. */
  aiReady: boolean
  /** Motivo por el que la IA no está disponible, para explicarlo. */
  aiHint?: string
  onDrillChange: (id: DrillId) => void
  onCorrectionChange: (mode: CorrectionMode) => void
  onReset: () => void
  className?: string
}

export default function TrainerBox({
  drillId,
  session,
  correctionMode,
  aiReady,
  aiHint,
  onDrillChange,
  onCorrectionChange,
  onReset,
  className = '',
}: TrainerBoxProps) {
  const [open, setOpen] = useState(false)
  const drill = findDrill(drillId)
  const active = drill.id !== 'free'

  const accuracy = drillAccuracy(session)
  const handsRatio =
    drill.targetHands > 0 ? Math.min(1, session.handsPlayed / drill.targetHands) : 0

  return (
    <section
      className={`rounded-xl border bg-[var(--bg-panel)] ${className}`}
      style={{ borderColor: active ? 'var(--poker-gold)' : 'var(--border)' }}
    >
      {/* ── Qué se entrena ── */}
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <Target
          className="h-4 w-4 shrink-0"
          style={{ color: active ? 'var(--poker-gold)' : 'var(--text-muted)' }}
          strokeWidth={2}
        />
        <div className="min-w-0 flex-1">
          <p className="text-mini font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Entrenamiento
          </p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{drill.title}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>

      {/* ── Catálogo ── */}
      {open && (
        <div className="space-y-1 border-t border-[var(--border)] px-3 py-2.5">
          {DRILLS.map(item => {
            const selected = item.id === drillId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onDrillChange(item.id)
                  setOpen(false)
                }}
                className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition ${
                  selected
                    ? 'bg-[var(--poker-gold)]/12'
                    : 'hover:bg-[var(--bg-surface)]'
                }`}
              >
                <Icon
                  name={item.icon}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: selected ? 'var(--poker-gold)' : 'var(--text-muted)' }}
                  strokeWidth={1.5}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        selected ? 'text-[var(--poker-gold)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.targetHands > 0 && (
                      <span className="text-mini text-[var(--text-muted)]">
                        {item.targetHands} manos
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-caption leading-snug text-[var(--text-muted)]">
                    {item.summary}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Marcador de la sesión ── */}
      {active && !open && (
        <div className="space-y-2.5 border-t border-[var(--border)] px-4 py-3">
          <p className="text-caption leading-snug text-[var(--text-secondary)]">{drill.summary}</p>

          {drill.targetHands > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-mini text-[var(--text-muted)]">
                <span>Progreso de la sesión</span>
                <span className="tabular-nums">
                  {session.handsPlayed}/{drill.targetHands} manos
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${handsRatio * 100}%`, background: 'var(--poker-gold)' }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[var(--bg-surface)] py-1.5">
              <p className="text-sm font-bold tabular-nums text-emerald-400">{session.correct}</p>
              <p className="text-mini text-[var(--text-muted)]">aciertos</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface)] py-1.5">
              <p className="text-sm font-bold tabular-nums text-red-400">{session.mistakes}</p>
              <p className="text-mini text-[var(--text-muted)]">fallos</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface)] py-1.5">
              <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                {session.evaluated === 0 ? '—' : `${Math.round(accuracy * 100)}%`}
              </p>
              <p className="text-mini text-[var(--text-muted)]">precisión</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session.bestStreak > 1 && (
              <span className="text-mini text-[var(--text-muted)]">
                Mejor racha: {session.bestStreak}
              </span>
            )}
            <button
              type="button"
              onClick={onReset}
              className="ml-auto flex items-center gap-1 text-mini text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2} />
              Reiniciar marcador
            </button>
          </div>
        </div>
      )}

      {/* ── Quién corrige ── */}
      <div className="space-y-1.5 border-t border-[var(--border)] px-4 py-3">
        <p className="text-mini font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Quién te corrige
        </p>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onCorrectionChange('engine')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-caption font-medium transition ${
              correctionMode === 'engine'
                ? 'bg-[var(--poker-gold)] text-black'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
            Motor
          </button>

          <button
            type="button"
            disabled={!aiReady}
            onClick={() => onCorrectionChange('ai')}
            title={aiReady ? undefined : aiHint}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-caption font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              correctionMode === 'ai'
                ? 'bg-[var(--poker-gold)] text-black'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" strokeWidth={1.5} />
            IA
          </button>
        </div>

        <p className="flex items-start gap-1 text-mini leading-snug text-[var(--text-muted)]">
          {correctionMode === 'ai' && aiReady ? (
            <>
              <Check className="mt-px h-3 w-3 shrink-0 text-emerald-400" strokeWidth={2.5} />
              El motor calcula y la IA te lo explica con sus palabras.
            </>
          ) : aiReady ? (
            'El motor corrige al instante con equity y pot odds reales.'
          ) : (
            <>
              <X className="mt-px h-3 w-3 shrink-0" strokeWidth={2.5} />
              {aiHint ?? 'Sin IA configurada: corrige el motor.'}
            </>
          )}
        </p>
      </div>
    </section>
  )
}
