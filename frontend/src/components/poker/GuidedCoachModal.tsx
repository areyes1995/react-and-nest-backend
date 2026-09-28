// ──────────────────────────────────────────────
// GuidedCoachModal — "piensa antes de actuar".
// Paso a paso: la situación y los rivales, las
// preguntas que te tienes que hacer, un mini-test
// con las cuentas del spot (rango, pot odds, outs,
// regla del 2 y 4, fold equity) y, al final, qué
// haría un profesional y qué haría un explotador
// contra este rival. Luego se decide en la mesa.
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Brain, Check, ChevronRight, Crosshair, Lightbulb, Scale, X } from 'lucide-react'
import type { Card } from '@poker/engine'
import Modal from '@components/ui/modal/Modal'
import type { GuidedSpot } from '@features/table/guided'
import { CardRow } from './PlayingCard'

export interface GuidedCoachModalProps {
  spot: GuidedSpot
  isOpen: boolean
  onClose: () => void
  onAnswer: (correct: boolean) => void
  heroCards: readonly Card[]
  board: readonly Card[]
  stats: { answered: number; correct: number }
}

export default function GuidedCoachModal(props: GuidedCoachModalProps) {
  // Cada decisión empieza de cero: el estado interno cuelga de la clave del spot.
  return <GuidedCoachBody key={props.spot.key} {...props} />
}

function GuidedCoachBody({ spot, isOpen, onClose, onAnswer, heroCards, board, stats }: GuidedCoachModalProps) {
  const [step, setStep] = useState(0)
  const [chosen, setChosen] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const total = spot.questions.length
  const finished = step >= total
  const question = spot.questions[step]
  const picked = question ? chosen[question.id] : undefined
  const correctCount = spot.questions.filter(q => chosen[q.id] === q.answerIndex).length

  const pick = (index: number) => {
    if (!question || picked !== undefined) return
    setChosen(current => ({ ...current, [question.id]: index }))
    onAnswer(index === question.answerIndex)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" maxHeight="max-h-[94dvh]">
      {/* Cabecera con tus cartas y el board: no hace falta ver la mesa detrás */}
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--poker-gold)]">
              <Brain className="h-3.5 w-3.5" />
              Piensa antes de actuar
            </p>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{spot.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <CardRow cards={heroCards} size="sm" />
          {board.length > 0 && (
            <>
              <span className="text-xs text-[var(--text-muted)]">Mesa</span>
              <CardRow cards={board} size="xs" />
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* La situación */}
        <section className="space-y-1">
          {spot.situation.map((line, index) => (
            <p key={index} className="text-sm text-[var(--text-secondary)]">
              {line}
            </p>
          ))}
        </section>

        {/* Rivales y cómo juegan */}
        {spot.villains.length > 0 && (
          <section className="grid gap-2 sm:grid-cols-2">
            {spot.villains.map(villain => (
              <div key={villain.name} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {villain.name} <span className="font-normal text-[var(--text-muted)]">· {villain.position}</span>
                </p>
                <p className="text-xs font-semibold text-sky-400">{villain.profile}</p>
                <p className="text-xs text-[var(--text-secondary)]">{villain.style}</p>
              </div>
            ))}
          </section>
        )}

        {/* Las preguntas que hay que hacerse */}
        <section className="rounded-xl border border-[var(--poker-gold)]/30 bg-[var(--poker-gold)]/[0.06] p-3">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--poker-gold)]">
            <Lightbulb className="h-3.5 w-3.5" />
            Pregúntate
          </h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text-primary)]">
            {spot.checklist.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </section>

        {/* Mini-test, una pregunta cada vez */}
        {!finished && question && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold uppercase tracking-wider">Pregunta {step + 1} de {total}</span>
              <span className="flex gap-1">
                {spot.questions.map((q, index) => (
                  <span
                    key={q.id}
                    className={`h-1.5 w-5 rounded-full ${
                      chosen[q.id] === undefined
                        ? index === step
                          ? 'bg-[var(--poker-gold)]'
                          : 'bg-[var(--bg-surface-hover)]'
                        : chosen[q.id] === q.answerIndex
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                    }`}
                  />
                ))}
              </span>
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)]">{question.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option, index) => {
                const isAnswer = index === question.answerIndex
                const isPicked = picked === index
                const tone =
                  picked === undefined
                    ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--poker-gold)]'
                    : isAnswer
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : isPicked
                        ? 'border-red-500 bg-red-500/15 text-red-300'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60'
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={picked !== undefined}
                    onClick={() => pick(index)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${tone}`}
                  >
                    {option}
                    {picked !== undefined && isAnswer && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
            {picked !== undefined && (
              <div className="space-y-2.5">
                <p
                  className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    picked === question.answerIndex
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : 'bg-red-500/10 text-red-200'
                  }`}
                >
                  <strong>{picked === question.answerIndex ? 'Correcto. ' : 'No exactamente. '}</strong>
                  {question.explanation}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(current => current + 1)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                >
                  {step + 1 < total ? 'Siguiente pregunta' : 'Ver cómo lo jugaría un pro'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Cierre: profesional vs explotador */}
        {finished && (
          <section className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Acertaste <strong className="text-[var(--text-primary)]">{correctCount} de {total}</strong>
              {stats.answered > 0 && (
                <span className="text-[var(--text-muted)]">
                  {' '}
                  · en la sesión {stats.correct}/{stats.answered}
                </span>
              )}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Scale className="h-3.5 w-3.5" />
                  Un profesional (equilibrado)
                </p>
                <p className="text-sm text-[var(--text-primary)]">{spot.pro}</p>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-300">
                  <Crosshair className="h-3.5 w-3.5" />
                  Un explotador
                </p>
                <p className="text-sm text-[var(--text-primary)]">{spot.exploit}</p>
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            {finished ? 'Cerrar' : 'Saltar preguntas'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
            style={{ background: 'var(--poker-gold)' }}
          >
            Ir a decidir
          </button>
        </div>
      </div>
    </Modal>
  )
}
