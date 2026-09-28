// ──────────────────────────────────────────────
// HandLog — narración de la mano en curso.
// Reproduce el "historial de manos" de las salas
// reales: leerlo es la forma más rápida de que un
// estudiante entienda qué acaba de pasar y por qué.
// ──────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import type { LogEntry, TableState } from '@poker/engine'
import { useAppTranslation } from '@i18n/useAppTranslation'
import { useChipFormat } from '@features/table/TableDisplayContext'

const STREET_LABELS: Record<string, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
  complete: 'Fin',
}

export interface HandLogProps {
  state: TableState
  className?: string
}

export default function HandLog({ state, className = '' }: HandLogProps) {
  const { t } = useAppTranslation()
  const formatChips = useChipFormat(state.config.bigBlind)
  const listRef = useRef<HTMLDivElement>(null)

  // Se mueve el scroll DE ESTA LISTA, no `scrollIntoView`: aquel arrastra
  // también a los contenedores padre, y cada acción de la mano empujaba la
  // página entera hacia abajo aunque el estudiante estuviera mirando la mesa.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [state.log.length])

  const nameFor = (entry: LogEntry): string =>
    entry.seat === null ? '' : (state.players.find(p => p.seat === entry.seat)?.name ?? '')

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
        Historial de la mano
      </h3>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
        {state.log.length === 0 && (
          <p className="text-[var(--text-muted)]">La mano aún no ha empezado.</p>
        )}
        {state.log.map((entry, index) => (
          <div key={index} className="flex gap-2">
            <span className="w-14 shrink-0 text-mini uppercase text-[var(--text-muted)] pt-0.5">
              {STREET_LABELS[entry.street] ?? entry.street}
            </span>
            <span className="text-[var(--text-secondary)]">
              {entry.seat !== null && (
                <span className="font-medium text-[var(--text-primary)]">{nameFor(entry)} </span>
              )}
              {t(entry.key, {
                ...entry.params,
                ...(entry.params?.amount !== undefined && { amount: formatChips(Number(entry.params.amount)) }),
                defaultValue: entry.key,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
