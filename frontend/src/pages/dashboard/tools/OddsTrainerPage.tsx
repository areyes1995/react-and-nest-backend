// ──────────────────────────────────────────────
// OddsTrainerPage — entrenador de odds.
// La misma mesa de la práctica, pero en vez de
// botones de acción, una pregunta: pot odds,
// implied odds, fold equity, fold equity
// requerida o SPR. Se ve la fórmula, se eligen entre
// tres opciones y se explica la cuenta con los
// números de la mano.
//
// Atajos: 1/2/3 para responder, Enter o espacio
// para la siguiente mano.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Sigma, X } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { PokerTable } from '@components/poker'
import { TableThemeScope } from '@features/table/TableThemeContext'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { ODDS_HERO_ID, ODDS_KINDS, createOddsSpot, type OddsKind } from '@features/tools/oddsTrainer'

type Filter = OddsKind | 'all'

const FORMULAS: { kind: OddsKind; formula: string; note: string }[] = [
  {
    kind: 'pot-odds',
    formula: 'pagas ÷ (bote + pagas)',
    note: 'Equity mínima para que pagar sea rentable. El bote incluye ya la apuesta del rival.',
  },
  {
    kind: 'implied-odds',
    formula: 'pagas ÷ equity − (bote + pagas)',
    note: 'Lo que tienes que cobrar después, cuando ligues, si ahora no te llega el precio.',
  },
  {
    kind: 'fold-equity',
    formula: '%fold × bote − %pago × apuesta',
    note: 'EV de un farol puro: ganas el bote cuando se retiran y pierdes la apuesta cuando pagan.',
  },
  {
    kind: 'required-fold-equity',
    formula: 'apuesta ÷ (bote + apuesta)',
    note: 'Cuántas veces tiene que retirarse el rival para que el farol gane por sí solo.',
  },
  {
    kind: 'spr',
    formula: 'stack efectivo ÷ bote',
    note: 'Stack efectivo = el menor de los dos, con lo que queda detrás. Se mide al empezar el flop (y se recalcula en el turn). <4 bajo: top pair se compromete · 4–10 medio: dobles parejas+ · >10 alto: sets y nuts. Tras una apuesta de bote pagada: (SPR − 1) ÷ 3.',
  },
]

const kindLabel = (kind: OddsKind) => ODDS_KINDS.find(item => item.id === kind)?.label ?? kind

export default function OddsTrainerPage() {
  const { addXp } = useStudentProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const [seed, setSeed] = useState(() => Date.now() >>> 0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0, best: 0 })
  const [byKind, setByKind] = useState<Record<OddsKind, { correct: number; total: number }>>(() =>
    Object.fromEntries(ODDS_KINDS.map(item => [item.id, { correct: 0, total: 0 }])) as Record<
      OddsKind,
      { correct: number; total: number }
    >,
  )

  // En «Todos» el tipo rota con la semilla: cada mano puede ser una cuenta distinta.
  const kind: OddsKind = filter === 'all' ? ODDS_KINDS[seed % ODDS_KINDS.length].id : filter
  const spot = useMemo(() => createOddsSpot(kind, seed), [kind, seed])
  const { question } = spot
  const answered = picked !== null
  const isCorrect = picked === question.answerIndex

  const answer = useCallback(
    (index: number) => {
      if (answered) return
      const ok = index === question.answerIndex
      setPicked(index)
      setScore(current => {
        const streak = ok ? current.streak + 1 : 0
        return {
          correct: current.correct + (ok ? 1 : 0),
          total: current.total + 1,
          streak,
          best: Math.max(current.best, streak),
        }
      })
      setByKind(current => ({
        ...current,
        [question.kind]: {
          correct: current[question.kind].correct + (ok ? 1 : 0),
          total: current[question.kind].total + 1,
        },
      }))
      if (ok) addXp(2)
    },
    [answered, question, addXp],
  )

  const next = useCallback(() => {
    setSeed(current => (current + 1 + Math.floor(Math.random() * 997)) >>> 0)
    setPicked(null)
  }, [])

  const changeFilter = (value: Filter) => {
    setFilter(value)
    next()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (!answered && ['1', '2', '3'].includes(event.key)) answer(Number(event.key) - 1)
      else if (answered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, answer, next])

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <AcademyPage
      title="Entrenador de odds"
      subtitle="Pot odds, implied odds, fold equity y SPR con manos reales: mira la fórmula y elige la respuesta"
      fill
    >
      <TableThemeScope className="play-shell flex-1 min-h-0">
        <div className="play-grid">
          {/* ── Escenario: la mesa y la pregunta ── */}
          <div className="play-stage">
            {/* La mesa se encoge para dejar sitio a la pregunta, pero nunca desaparece. */}
            <div className="min-h-[13rem] flex-1">
              <PokerTable state={spot.state} heroId={ODDS_HERO_ID} timeLeft={null} revealAll={false} spectator fit />
            </div>

            <div className="play-actions">
              <section className="space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--poker-gold)]/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--poker-gold)]">
                    {question.title}
                  </span>
                  <p className="min-w-0 basis-full text-sm font-medium text-[var(--text-primary)] sm:basis-0 sm:flex-1">{question.prompt}</p>
                </div>

                {/* Antes de responder, la fórmula y los datos; después, la misma
                    fórmula con los números de la mano (ocupa el mismo sitio). */}
                {!answered ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[var(--poker-gold)]/30 bg-[var(--poker-gold)]/[0.06] px-3 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--poker-gold)]">
                    <Sigma className="h-4 w-4" />
                    {question.formula}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {question.facts.map(fact => (
                      <span
                        key={fact.label}
                        className="rounded-md bg-[var(--bg-surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                      >
                        {fact.label}: <strong className="tabular-nums text-[var(--text-primary)]">{fact.value}</strong>
                      </span>
                    ))}
                  </span>
                </div>
                ) : (
                  <p
                    className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'
                    }`}
                  >
                    <strong>{isCorrect ? 'Correcto. ' : 'No. '}</strong>
                    {question.explanation}
                  </p>
                )}

                {/* Tres opciones */}
                <div className="grid grid-cols-3 gap-2">
                  {question.options.map((option, index) => {
                    const tone = !answered
                      ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--poker-gold)]'
                      : index === question.answerIndex
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : index === picked
                          ? 'border-red-500 bg-red-500/15 text-red-300'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60'
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={answered}
                        onClick={() => answer(index)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-base font-bold tabular-nums transition ${tone}`}
                      >
                        <span className="hidden text-xs font-normal opacity-50 sm:inline">{index + 1}</span>
                        {option}
                        {answered && index === question.answerIndex && <Check className="h-4 w-4" />}
                        {answered && index === picked && !isCorrect && <X className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>

                {answered && (
                  <button
                    type="button"
                    onClick={next}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-black sm:ml-auto sm:w-auto"
                    style={{ background: 'var(--poker-gold)' }}
                  >
                    Siguiente mano
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </section>
            </div>
          </div>

          {/* ── Panel: qué entrenar, marcador y chuleta ── */}
          <aside className="play-aside space-y-3 scrollbar-thin">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Qué practicar</h2>
              <div className="flex flex-wrap gap-1.5">
                {([{ id: 'all', short: 'Todo' }, ...ODDS_KINDS] as { id: Filter; short: string }[]).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeFilter(item.id)}
                    aria-pressed={filter === item.id}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      filter === item.id
                        ? 'bg-[var(--poker-gold)] text-black'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {item.short}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                    {score.correct}/{score.total}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Aciertos</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-[var(--poker-gold)]">{accuracy}%</p>
                  <p className="text-xs text-[var(--text-muted)]">Precisión</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{score.best}</p>
                  <p className="text-xs text-[var(--text-muted)]">Mejor racha</p>
                </div>
              </div>
              <ul className="space-y-1 border-t border-[var(--border)] pt-2">
                {ODDS_KINDS.map(item => {
                  const stats = byKind[item.id]
                  return (
                    <li key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="tabular-nums text-[var(--text-muted)]">
                        {stats.total > 0 ? `${stats.correct}/${stats.total}` : '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Chuleta de fórmulas</h2>
              {FORMULAS.map(item => (
                <div key={item.kind} className={item.kind === kind ? '' : 'opacity-70'}>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{kindLabel(item.kind)}</p>
                  <p className="font-mono text-xs text-[var(--poker-gold)]">{item.formula}</p>
                  <p className="text-xs leading-snug text-[var(--text-muted)]">{item.note}</p>
                </div>
              ))}
              <p className="border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)]">
                Atajos: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> para responder · <kbd>Enter</kbd> siguiente mano
              </p>
            </section>
          </aside>
        </div>
      </TableThemeScope>
    </AcademyPage>
  )
}
