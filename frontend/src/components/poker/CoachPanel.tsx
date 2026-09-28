// ──────────────────────────────────────────────
// CoachPanel — feedback inmediato tras cada
// decisión del estudiante.
// Es lo que separa "jugar una partida" de
// "entrenar". Tiene tres capas, de más rápida a más
// rica, y ninguna depende de la siguiente:
//
//  1. El motor: equity real, pot odds exigidas y
//     veredicto. Instantáneo y siempre disponible.
//  2. El entrenamiento activo: si lo que hiciste
//     encaja con lo que estás practicando.
//  3. La IA, si está encendida: por qué, con el
//     contexto de la mano, y qué hacer la próxima vez.
//
// Si la IA tarda o falla, las dos primeras capas ya
// están en pantalla: la corrección nunca se pierde.
// ──────────────────────────────────────────────

import { Check, TriangleAlert, X, Lightbulb, Cpu, Target } from 'lucide-react'
import type { AdviceVerdict } from '@poker/engine'
import type { DecisionFeedback } from '@features/table/useTableGame'

const VERDICT_STYLE: Record<AdviceVerdict, { color: string; bg: string; label: string }> = {
  good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Buena decisión' },
  ok: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Aceptable' },
  mistake: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Se puede mejorar' },
}

const VERDICT_ICON: Record<AdviceVerdict, typeof Check> = {
  good: Check,
  ok: TriangleAlert,
  mistake: X,
}

const MESSAGES: Record<string, string> = {
  'poker.coach.goodCall':
    'Tu equity ({{equity}}%) supera lo que exigía la apuesta ({{required}}%), así que igualar gana fichas a largo plazo.',
  'poker.coach.calledWithoutOdds':
    'Necesitabas al menos {{required}}% de equity para pagar y solo tenías {{equity}}%. Retirarse era lo correcto.',
  'poker.coach.foldedWithOdds':
    'Tenías {{equity}}% de equity y la apuesta solo exigía {{required}}%. Ese abandono regala valor.',
  'poker.coach.goodFold':
    'Con {{equity}}% frente a un {{required}}% exigido, retirarse es la jugada que ahorra fichas.',
  'poker.coach.couldRaise':
    'Igualar no está mal, pero con {{equity}}% de equity tu mano es favorita: subir extrae más valor.',
  'poker.coach.goodRaise': 'Mano fuerte ({{equity}}%) y agresión: así se construyen los botes grandes.',
  'poker.coach.loosePlay':
    'Subiste con {{equity}}% de equity. Funciona como farol ocasional, pero no puede ser tu jugada por defecto.',
  'poker.coach.goodValueBet':
    'Apostar con {{equity}}% de equity hace que las manos peores paguen. Es la definición de apuesta de valor.',
  'poker.coach.goodCheck': 'Pasar con {{equity}}% de equity controla el tamaño del bote. Correcto.',
  'poker.coach.missedValue':
    'Con {{equity}}% de equity ibas por delante: apostar te habría hecho ganar más fichas.',
  'poker.coach.thinBet':
    'Apostar con {{equity}}% de equity infla el bote cuando no eres favorito. Cuidado con hacerlo por rutina.',
  'poker.coach.foldedForFree':
    'Podías pasar sin pagar nada. Retirarse cuando ver la siguiente carta es gratis nunca es correcto.',
}

const RECOMMENDED_LABELS: Record<string, string> = {
  fold: 'retirarse',
  check: 'pasar',
  call: 'igualar',
  bet: 'apostar',
  raise: 'subir',
}

function render(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''))
}

export interface CoachPanelProps {
  feedback: DecisionFeedback | null
  /** Panel desactivado: el modo entrenamiento está apagado. */
  enabled: boolean
}

export default function CoachPanel({ feedback, enabled }: CoachPanelProps) {
  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-3 text-xs text-[var(--text-muted)]">
        <Lightbulb className="w-4 h-4 mb-1.5 text-[var(--poker-gold)]" strokeWidth={1.5} />
        Activa el modo entrenamiento para recibir análisis de cada decisión.
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-muted)]">
        Juega una mano y aquí verás tu equity, las pot odds y qué habría hecho el motor.
      </div>
    )
  }

  const { advice, drill, review, pending } = feedback
  const style = VERDICT_STYLE[advice.verdict]
  const Icon = VERDICT_ICON[advice.verdict]
  const message = render(MESSAGES[advice.messageKey] ?? '', advice.params)
  const equityPct = Math.round(advice.equity * 100)
  const requiredPct = Math.round(advice.required * 100)

  return (
    <div className={`rounded-xl border p-3 space-y-3 ${style.bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${style.color}`} strokeWidth={2} />
        <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
        <span className="ml-auto text-mini text-[var(--text-muted)]">
          {advice.hand} · {advice.position}
        </span>
      </div>

      {/* ── Equity vs. equity exigida ── */}
      <div className="space-y-1">
        <div className="relative h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--poker-gold)]"
            style={{ width: `${equityPct}%` }}
          />
          {advice.callAmount > 0 && (
            <div
              className="absolute inset-y-0 w-0.5 bg-[var(--text-primary)]"
              style={{ left: `${requiredPct}%` }}
              title={`Equity exigida: ${requiredPct}%`}
            />
          )}
        </div>
        <div className="flex justify-between text-mini text-[var(--text-muted)]">
          <span>
            Tu equity: <strong className="text-[var(--text-primary)]">{equityPct}%</strong>
          </span>
          {advice.callAmount > 0 && (
            <span>
              Exigido por las pot odds:{' '}
              <strong className="text-[var(--text-primary)]">{requiredPct}%</strong>
            </span>
          )}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{message}</p>

      {/* ── Veredicto del entrenamiento activo ── */}
      {drill && (
        <div
          className={`flex gap-1.5 rounded-lg border px-2 py-1.5 ${
            drill.ok
              ? 'border-emerald-500/25 bg-emerald-500/5'
              : 'border-red-500/25 bg-red-500/5'
          }`}
        >
          <Target
            className={`mt-0.5 h-3 w-3 shrink-0 ${drill.ok ? 'text-emerald-400' : 'text-red-400'}`}
            strokeWidth={2}
          />
          <div className="min-w-0 space-y-0.5">
            <p className="text-caption leading-snug text-[var(--text-secondary)]">{drill.message}</p>
            {drill.better && (
              <p className="text-caption font-medium text-[var(--text-primary)]">
                Mejor: {drill.better}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Explicación de la IA ── */}
      {pending && (
        <p className="flex items-center gap-1.5 text-caption text-[var(--text-muted)]">
          <Cpu className="h-3 w-3 animate-pulse" strokeWidth={2} />
          La IA está revisando tu jugada…
        </p>
      )}

      {review && (
        <div className="space-y-1 rounded-lg border border-[var(--poker-gold)]/25 bg-[var(--poker-gold)]/5 px-2.5 py-2">
          <p className="flex items-center gap-1.5 text-mini font-semibold uppercase tracking-wide text-[var(--poker-gold)]">
            <Cpu className="h-3 w-3" strokeWidth={2} />
            {review.headline ?? 'Revisión de la IA'}
          </p>
          {review.explanation && (
            <p className="text-caption leading-relaxed text-[var(--text-secondary)]">
              {review.explanation}
            </p>
          )}
          {review.suggestion && (
            <p className="text-caption leading-relaxed text-[var(--text-primary)]">
              <strong>La próxima vez:</strong> {review.suggestion}
            </p>
          )}
        </div>
      )}

      <p className="text-mini text-[var(--text-muted)]">
        Jugada recomendada por el motor:{' '}
        <strong className="text-[var(--text-primary)]">
          {RECOMMENDED_LABELS[advice.recommended] ?? advice.recommended}
        </strong>
      </p>
    </div>
  )
}
