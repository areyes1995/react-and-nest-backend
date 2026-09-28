// ──────────────────────────────────────────────
// OpponentsPanel — quién tienes delante.
// Con bots muestra el arquetipo y el stack; con IA
// añade lo último que "pensó" el rival. Ese texto es
// material didáctico: enseña a poner palabras a una
// decisión, que es justo lo que le falta al alumno.
// ──────────────────────────────────────────────

import { Bot, Cpu, MessageSquare } from 'lucide-react'
import { BOT_PROFILES, type TableState } from '@poker/engine'
import { useChipFormat } from '@features/table/TableDisplayContext'
import type { OpponentNote } from '@features/table/useTableGame'
import type { AiStatus } from '@services/poker-ai'

export interface OpponentsPanelProps {
  state: TableState
  /** La IA está moviendo a los rivales. */
  aiActive: boolean
  aiStatus: AiStatus | null
  note: OpponentNote | null
}

export default function OpponentsPanel({ state, aiActive, aiStatus, note }: OpponentsPanelProps) {
  const formatChips = useChipFormat(state.config.bigBlind)
  const opponents = state.players.filter(player => !player.isHuman)

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Rivales
        </h2>
        <span
          className={`ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-mini font-semibold ${
            aiActive
              ? 'bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
          }`}
          title={
            aiActive
              ? `Modelo: ${aiStatus?.model ?? 'desconocido'} (${aiStatus?.provider ?? ''})`
              : 'Los rivales los mueve el motor local'
          }
        >
          {aiActive ? <Cpu className="w-3 h-3" strokeWidth={2} /> : <Bot className="w-3 h-3" strokeWidth={2} />}
          {aiActive ? 'IA' : 'Bots'}
        </span>
      </div>

      <div className="space-y-1.5">
        {opponents.map(player => {
          const profile = player.botProfile ? BOT_PROFILES[player.botProfile] : null
          const speaking = note?.playerId === player.id
          const out = player.status === 'out' || player.status === 'folded'

          return (
            <div key={player.id} className={out ? 'opacity-50' : ''}>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: profile?.accent ?? 'var(--text-muted)' }}
                />
                <span className="text-[var(--text-primary)] font-medium truncate">{player.name}</span>
                <span className="text-[var(--text-muted)] uppercase text-mini shrink-0">
                  {player.botProfile}
                </span>
                <span className="ml-auto text-[var(--text-muted)] tabular-nums shrink-0">
                  {formatChips(player.stack)}
                </span>
              </div>

              {/* Lo que dijo la IA de este rival en su último turno. */}
              {speaking && note?.reasoning && (
                <p className="mt-1 flex gap-1.5 rounded-lg bg-[var(--bg-surface)] px-2 py-1.5 text-caption leading-snug text-[var(--text-secondary)]">
                  <MessageSquare
                    className="w-3 h-3 mt-0.5 shrink-0 text-[var(--poker-gold)]"
                    strokeWidth={2}
                  />
                  <span>
                    {note.reasoning}
                    {note.mood && (
                      <span className="text-[var(--text-muted)] italic"> · {note.mood}</span>
                    )}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* La caída a bots no se esconde: si el modelo falla hay que saberlo. */}
      {aiActive && note?.source === 'fallback' && (
        <p className="text-mini text-amber-400/90">
          El modelo no respondió en el último turno: jugó el bot local.
        </p>
      )}
    </section>
  )
}
