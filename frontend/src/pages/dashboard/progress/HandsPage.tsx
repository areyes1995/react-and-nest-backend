// ──────────────────────────────────────────────
// HandsPage — historial de manos.
// Cada mano guarda su semilla, así que es
// reproducible: es el material con el que el
// estudiante revisa en frío, que es donde de
// verdad se aprende.
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spade, TrendingDown, TrendingUp } from 'lucide-react'
import { parseCards } from '@poker/engine'
import { AcademyPage } from '@components/layout'
import { CardRow } from '@components/poker'
import { useStudentProgress } from '@features/progress/ProgressContext'

type Filter = 'all' | 'won' | 'lost'

function safeCards(notation: string[]) {
  try {
    return parseCards(notation.join(' '))
  } catch {
    return []
  }
}

export default function HandsPage() {
  const { progress } = useStudentProgress()
  const [filter, setFilter] = useState<Filter>('all')

  const hands = useMemo(() => {
    if (filter === 'won') return progress.hands.filter(hand => hand.net > 0)
    if (filter === 'lost') return progress.hands.filter(hand => hand.net < 0)
    return progress.hands
  }, [progress.hands, filter])

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition ${
      active
        ? 'bg-[var(--poker-gold)] text-black'
        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
    }`

  return (
    <AcademyPage
      title="Historial de manos"
      subtitle={`${progress.hands.length} manos guardadas (las 100 últimas)`}
    >
      <div className="max-w-5xl mx-auto w-full space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>
            Todas
          </button>
          <button type="button" onClick={() => setFilter('won')} className={chip(filter === 'won')}>
            Ganadas
          </button>
          <button type="button" onClick={() => setFilter('lost')} className={chip(filter === 'lost')}>
            Perdidas
          </button>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {hands.length} {hands.length === 1 ? 'mano' : 'manos'}
          </span>
        </div>

        {progress.hands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center space-y-3">
            <Spade className="w-8 h-8 mx-auto text-[var(--text-muted)]" strokeWidth={1.5} />
            <p className="text-sm text-[var(--text-secondary)]">
              Todavía no has jugado ninguna mano.
            </p>
            <Link
              to="/app/play"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black"
              style={{ background: 'var(--poker-gold)' }}
            >
              Ir a la mesa de práctica
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {hands.map(hand => {
              const positive = hand.net > 0
              return (
                <div
                  key={hand.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3.5 py-3"
                >
                  <div className="shrink-0">
                    <p className="text-mini uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Tu mano
                    </p>
                    <CardRow cards={safeCards(hand.hole)} size="xs" />
                  </div>

                  <div className="shrink-0">
                    <p className="text-mini uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Mesa
                    </p>
                    {hand.board.length > 0 ? (
                      <CardRow cards={safeCards(hand.board)} size="xs" />
                    ) : (
                      <span className="text-caption text-[var(--text-muted)]">Sin showdown</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {hand.handName ?? 'Mano no mostrada'}
                    </p>
                    <p className="text-mini text-[var(--text-muted)]">
                      Mesa de {hand.seats} · mano #{hand.handNumber} · semilla {hand.seed}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 shrink-0 text-sm font-bold tabular-nums ${
                      positive ? 'text-emerald-400' : hand.net < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {positive ? (
                      <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                    ) : hand.net < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
                    ) : null}
                    {positive ? '+' : ''}
                    {hand.net.toLocaleString('es-ES')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AcademyPage>
  )
}
