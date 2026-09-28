// ──────────────────────────────────────────────
// RangesPage — la matriz de 169 manos iniciales.
// Ver el rango pintado es lo que hace que se
// memorice: la forma del bloque dice más que
// cualquier lista de manos. Cada celda lleva su
// frecuencia: los rangos modernos mezclan manos.
//
// La matriz se ajusta al alto disponible en
// escritorio (container queries) para verla entera
// sin hacer scroll; el texto escala con la celda.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { AcademyPage } from '@components/layout'
import RangeGrid, { rangeCellColor } from '@components/poker/RangeGrid'
import {
  OPENING_RANGES,
  combosOf,
  parseRange,
  rangeCombos,
} from '@features/tools/ranges'

function handKind(hand: string): string {
  if (hand.length === 2) return 'Pareja'
  return hand.endsWith('s') ? 'Suited' : 'Offsuit'
}

const LEGEND = [
  { label: '100%', weight: 100 },
  { label: '75%', weight: 75 },
  { label: '50%', weight: 50 },
  { label: '25%', weight: 25 },
]

const POSITIONS = OPENING_RANGES.map(position => {
  const weights = parseRange(position.range)
  const combos = rangeCombos(weights)
  return { ...position, weights, combos, percent: (combos / 1326) * 100 }
})

export default function RangesPage() {
  const [positionId, setPositionId] = useState(POSITIONS[0].id)
  const [selected, setSelected] = useState<string | null>(null)
  const position = POSITIONS.find(item => item.id === positionId) ?? POSITIONS[0]

  const mixedCount = useMemo(
    () => [...position.weights.values()].filter(weight => weight < 100).length,
    [position.weights],
  )

  const selectedWeight = selected ? (position.weights.get(selected) ?? 0) : 0

  return (
    <AcademyPage
      title="Rangos preflop"
      subtitle="Qué manos abrir y con qué frecuencia desde cada posición (6-max, 100bb)"
      fill
    >
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:grid-rows-[minmax(0,1fr)]">
        {/* ── Matriz ── */}
        <div className="min-w-0 flex flex-col gap-3 lg:min-h-0">
          <div className="flex justify-center lg:flex-1 lg:min-h-0 lg:[container-type:size]">
            <div className="w-full max-w-[44rem] lg:max-w-none lg:w-[min(100cqw,100cqh)] [container-type:inline-size]">
              <RangeGrid
                cellFor={hand => ({ weight: position.weights.get(hand) ?? 0 })}
                selected={selected}
                onSelect={setSelected}
                outLabel="no se abre"
              />
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)] shrink-0">
            <span className="text-[var(--text-muted)]">Frecuencia de apertura:</span>
            {LEGEND.map(item => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded" style={{ background: rangeCellColor(item.weight) }} />
                {item.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-[var(--bg-surface-soft)] border border-[var(--border)]" />
              No se abre
            </span>
          </div>
        </div>

        {/* ── Panel lateral ── */}
        <aside className="space-y-3 lg:min-h-0 lg:overflow-y-auto">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3">
            <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Posición
            </h2>
            <div className="grid grid-cols-5 gap-1.5">
              {POSITIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPositionId(item.id)}
                  aria-pressed={positionId === item.id}
                  className={`rounded-lg px-1 py-2 text-center transition ${
                    positionId === item.id
                      ? 'bg-[var(--poker-gold)] text-black'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-xs tabular-nums opacity-75">{item.percent.toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{position.label}</h2>
              <span className="text-sm text-[var(--text-muted)]">Apertura {position.openSize}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {position.description}
            </p>

            <dl className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)] text-center">
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Del total</dt>
                <dd className="text-lg font-bold tabular-nums text-[var(--poker-gold)]">
                  {position.percent.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Combos</dt>
                <dd className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                  {position.combos.toFixed(0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Mixtas</dt>
                <dd className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{mixedCount}</dd>
              </div>
            </dl>

            {/* Detalle de la mano bajo el cursor (o tocada en móvil). */}
            <div className="rounded-lg bg-[var(--bg-surface)] px-3 py-2.5 min-h-[4.25rem]">
              {selected ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold font-mono text-[var(--text-primary)]">{selected}</span>
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{ color: selectedWeight > 0 ? 'var(--poker-gold)' : 'var(--text-muted)' }}
                    >
                      {selectedWeight > 0 ? `Abrir ${selectedWeight}%` : 'Retirarse'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {handKind(selected)} · {combosOf(selected)} combos
                    {selectedWeight > 0 && selectedWeight < 100
                      ? ` · mezcla: abre ${selectedWeight}%, foldea ${100 - selectedWeight}%`
                      : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Pasa el cursor o toca una mano para ver su frecuencia.
                </p>
              )}
            </div>

            <details className="pt-2 border-t border-[var(--border)]">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Notación del rango
              </summary>
              <p className="mt-2 text-xs font-mono text-[var(--text-secondary)] leading-relaxed break-words">
                {position.range}
              </p>
            </details>
          </section>

          <p className="px-1 text-xs text-[var(--text-muted)] leading-relaxed">
            Aproximación a soluciones GTO de cash 6-max con 100bb, rake estándar y estrategia de subir o
            retirarse (referencias: <em>Modern Poker Theory</em> de Acevedo y solvers actuales). Las manos
            mixtas se abren solo parte de las veces: úsalas con más frecuencia contra ciegas pasivas.
          </p>
        </aside>
      </div>
    </AcademyPage>
  )
}
