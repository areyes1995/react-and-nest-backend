// ──────────────────────────────────────────────
// TrainerPage — entrenador de manos iniciales.
// Repetición espaciada de la decisión más frecuente
// del juego: abrir o no abrir desde una posición.
// Corrige al instante y explica el porqué, que es
// lo que fija el rango en la memoria.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { createRng, createDeck, chenScore, handNotation, type Card } from '@poker/engine'
import { AcademyPage } from '@components/layout'
import { CardRow } from '@components/poker'
import { OPENING_RANGES, parseRange, rangePercent } from '@features/tools/ranges'
import { useStudentProgress } from '@features/progress/ProgressContext'

type Decision = 'open' | 'fold'

interface Question {
  cards: Card[]
  notation: string
  positionId: string
}

interface Answer {
  chosen: Decision
  correct: Decision
}

const RANGE_SETS = OPENING_RANGES.map(position => {
  const weights = parseRange(position.range)
  return { ...position, weights, percent: Math.round(rangePercent(weights)) }
})

function newQuestion(): Question {
  const rng = createRng()
  const deck = createDeck(rng)
  const cards = deck.drawMany(2)
  const position = RANGE_SETS[rng.int(RANGE_SETS.length)]
  return { cards, notation: handNotation(cards), positionId: position.id }
}

export default function TrainerPage() {
  const { addXp } = useStudentProgress()
  const [question, setQuestion] = useState<Question>(() => newQuestion())
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const position = RANGE_SETS.find(item => item.id === question.positionId) ?? RANGE_SETS[0]
  const weight = position.weights.get(question.notation) ?? 0
  // Las manos mixtas (se abren solo parte de las veces) admiten ambas respuestas.
  const isMixed = weight > 0 && weight < 100
  const shouldOpen: Decision = weight >= 50 ? 'open' : 'fold'

  const respond = useCallback(
    (chosen: Decision) => {
      if (answer) return
      const isCorrect = isMixed || chosen === shouldOpen
      setAnswer({ chosen, correct: isMixed ? chosen : shouldOpen })
      setScore(current => ({
        correct: current.correct + (isCorrect ? 1 : 0),
        total: current.total + 1,
      }))
      if (isCorrect) addXp(2)
    },
    [answer, shouldOpen, isMixed, addXp],
  )

  const next = useCallback(() => {
    setQuestion(newQuestion())
    setAnswer(null)
  }, [])

  // Atajos: A para abrir, F para retirarse, espacio para la siguiente.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (answer && (key === ' ' || key === 'enter')) {
        event.preventDefault()
        next()
      } else if (!answer && key === 'a') respond('open')
      else if (!answer && key === 'f') respond('fold')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, next, respond])

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  const isCorrect = answer ? answer.chosen === answer.correct : false

  return (
    <AcademyPage
      title="Entrenador de manos"
      subtitle="Decide si abrirías esta mano desde esta posición"
      actions={
        <button
          type="button"
          onClick={() => {
            setScore({ correct: 0, total: 0 })
            next()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          Reiniciar
        </button>
      }
    >
      <div className="max-w-xl mx-auto space-y-5">
        {/* ── Marcador ── */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
          <div>
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Aciertos</p>
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {score.correct}/{score.total}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Precisión</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--poker-gold)' }}>
              {accuracy}%
            </p>
          </div>
        </div>

        {/* ── Pregunta ── */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 text-center space-y-4">
          <div>
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">Posición</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{position.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{position.description}</p>
          </div>

          <div className="flex justify-center">
            <CardRow cards={question.cards} size="lg" />
          </div>

          <p className="text-sm font-mono text-[var(--text-secondary)]">
            {question.notation} · Chen {chenScore(question.cards)}
          </p>

          {!answer ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => respond('fold')}
                className="px-4 py-3 rounded-xl text-sm font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-red-500/15 hover:text-red-400 transition"
              >
                Retirarse <span className="opacity-50">(F)</span>
              </button>
              <button
                type="button"
                onClick={() => respond('open')}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-black transition"
                style={{ background: 'var(--poker-gold)' }}
              >
                Abrir <span className="opacity-60">(A)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 ${
                  isCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-red-500/40 bg-red-500/10'
                }`}
              >
                {isCorrect ? (
                  <Check className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                ) : (
                  <X className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                )}
                <span
                  className={`text-sm font-semibold ${
                    isCorrect ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isCorrect ? 'Correcto' : `Lo estándar es ${answer.correct === 'open' ? 'abrir' : 'retirarse'}`}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isMixed
                  ? `${question.notation} es una mano mixta desde ${position.label}: se abre el ${weight}% de las veces y se foldea el resto, así que ambas opciones son válidas.`
                  : answer.correct === 'open'
                  ? `${question.notation} entra en el rango de apertura de ${position.label} (${position.percent}% de las manos).`
                  : `${question.notation} queda fuera del rango de ${position.label}. Desde esa posición solo se abre el ${position.percent}% de las manos.`}
              </p>

              <button
                type="button"
                onClick={next}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                Siguiente mano <span className="opacity-50">(espacio)</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-caption text-[var(--text-muted)] text-center">
          Los rangos de referencia son los de mesa de 6 jugadores. Puedes consultarlos completos en{' '}
          <span className="text-[var(--poker-gold)]">Rangos preflop</span>.
        </p>
      </div>
    </AcademyPage>
  )
}
