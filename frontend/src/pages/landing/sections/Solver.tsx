// ──────────────────────────────────────────────
// Solver — la matriz de 169 manos iniciales.
// Es la herramienta que más se reconoce de un
// programa de póker serio, así que la portada la
// enseña funcionando: la misma matriz y los mismos
// rangos que la herramienta real de la academia.
// En la landing solo se muestra BTN como vista
// previa; el resto de posiciones se deja visible
// pero bloqueado para provocar el salto a la academia.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { Crosshair, Lock } from 'lucide-react'
import {
  GRID_RANKS,
  OPENING_RANGES,
  cellNotation,
  parseRange,
  rangePercent,
} from '@features/tools/ranges'
import { Section, SectionHead } from './shared'

export default function Solver() {
  const position = OPENING_RANGES.find(p => p.id === 'btn')!
  const weights = useMemo(() => parseRange(position.range), [position.range])
  const percent = useMemo(() => rangePercent(weights), [weights])

  return (
    <div className="border-y border-[var(--border)] bg-[var(--bg-main)]">
      <Section id="solver">
        <SectionHead
          eyebrow="Herramientas"
          title="La matriz de rangos, no una captura de la matriz"
          subtitle="Las 169 manos iniciales pintadas por posición. Ver la forma del bloque es lo que hace que se memorice: dice más que cualquier lista de manos."
        />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ── La matriz ── */}
          <div className="min-w-0">
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
              role="img"
              aria-label={`Rango de apertura desde ${position.label}: ${position.range}`}
            >
              {GRID_RANKS.map((_, row) =>
                GRID_RANKS.map((__, col) => {
                  const hand = cellNotation(row, col)
                  const included = weights.has(hand)
                  const isPair = row === col
                  const isSuited = row < col

                  return (
                    <div
                      key={`${row}-${col}`}
                      title={hand}
                      className={`grid aspect-square place-items-center rounded-[3px] text-micro font-semibold transition-colors duration-500 sm:text-mini ${
                        included
                          ? 'text-black'
                          : 'bg-[var(--bg-surface)]/45 text-[var(--text-muted)]'
                      }`}
                      style={
                        included
                          ? {
                              background: isPair
                                ? 'var(--poker-gold)'
                                : isSuited
                                  ? 'color-mix(in srgb, var(--poker-gold) 76%, white)'
                                  : 'color-mix(in srgb, var(--poker-gold) 52%, #7c3aed)',
                            }
                          : undefined
                      }
                    >
                      {hand}
                    </div>
                  )
                }),
              )}
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-[var(--text-muted)]">
              {[
                ['Parejas', 'var(--poker-gold)'],
                ['Suited', 'color-mix(in srgb, var(--poker-gold) 76%, white)'],
                ['Offsuit', 'color-mix(in srgb, var(--poker-gold) 52%, #7c3aed)'],
                ['Fuera del rango', 'var(--bg-surface)'],
              ].map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ background: color }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Posición en curso ── */}
          {/* Sticky: la matriz es alta y el panel la acompaña en vez
              de quedarse arriba dejando media columna vacía. */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-[0.14em] text-[var(--poker-gold)]">
              <Crosshair className="h-3 w-3" />
              Apertura en mesa de 6
            </span>

            <div className="mt-4 flex items-baseline gap-3">
              <h3 className="text-3xl font-extrabold leading-none tracking-tight text-[var(--text-primary)]">
                {position.label}
              </h3>
              <span className="text-sm font-semibold tabular-nums text-[var(--poker-gold)]">
                {percent.toFixed(1)}% de las manos
              </span>
            </div>

            <p className="mt-3 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
              {position.description}
            </p>

            <p className="mt-4 break-words rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]/50 px-3 py-2.5 font-mono text-[0.75rem] leading-relaxed text-[var(--text-secondary)]">
              {position.range}
            </p>

            {/* Selector: solo BTN activo en la landing; el resto visible pero bloqueado. */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {OPENING_RANGES.map(item => {
                const isBtn = item.id === 'btn'
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isBtn}
                    aria-pressed={isBtn}
                    title={!isBtn ? 'Disponible en la academia' : undefined}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[0.75rem] font-bold transition-colors ${
                      isBtn
                        ? 'bg-[var(--poker-gold)] text-[#1a1206]'
                        : 'cursor-not-allowed border border-[var(--border-active)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60'
                    }`}
                  >
                    {item.label}
                    {!isBtn && <Lock className="h-3 w-3 opacity-70" />}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-caption leading-relaxed text-[var(--text-muted)]">
              Vista previa: solo el rango de BTN. El resto de posiciones está disponible en la academia.
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}
